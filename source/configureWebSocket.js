import { resolve } from 'path'

import { time } from '@dr-js/core/module/common/format'
import { setTimeoutAsync } from '@dr-js/core/module/common/time'
import { createStateStoreLite } from '@dr-js/core/module/common/immutable/StateStore'
import { createResponderRouter, createRouteMap } from '@dr-js/core/module/node/server/Responder/Router'
import { WEBSOCKET_EVENT } from '@dr-js/core/module/node/server/WebSocket/function'
import { enableWebSocketServer } from '@dr-js/core/module/node/server/WebSocket/WebSocketServer'
import { createUpdateRequestListener } from '@dr-js/core/module/node/server/WebSocket/WebSocketUpgradeRequest'
import { run } from '@dr-js/core/module/node/system/Run'
import { getProcessListAsync, toProcessPidMap, toProcessTree, findProcessTreeInfo, killProcessTreeInfoAsync } from '@dr-js/core/module/node/system/Process'

const __DEV__ = true

const configureWebSocket = ({
  serverExot, logger,
  URL_WS,
  defaultCwd, timeoutExit, singleCommand,
  onProcessStart = () => {},
  onProcessStop = () => {}
}) => {
  serverExot.processStoreMap = new Map()

  const config = {
    logger,
    defaultCwd,
    timeoutExit,
    singleCommand,
    processStoreMap: serverExot.processStoreMap,
    onProcessStart,
    onProcessStop
  }

  serverExot.webSocketSet = enableWebSocketServer({
    server: serverExot.server,
    onUpgradeRequest: createUpdateRequestListener({
      responderList: [
        createResponderRouter({
          routeMap: createRouteMap([
            [ URL_WS, 'GET', (store) => responderWebSocketUpgrade(store, config) ]
          ]),
          baseUrl: serverExot.option.baseUrl
        })
      ]
    })
  })
}

const responderWebSocketUpgrade = async (store, {
  logger,
  defaultCwd, timeoutExit, singleCommand,
  processStoreMap,
  onProcessStart, onProcessStop
}) => { // TODO: NOTE: expect createResponderRouter
  __DEV__ && console.log('[responderWebSocketUpgrade]', store.bodyHeadBuffer.length, store.request.url)
  const { webSocket } = store

  const { url: { searchParams } } = store.getState()
  const command = singleCommand || searchParams.get('command')
  const tag = singleCommand ? '' : searchParams.get('tag') || ''
  const cwd = singleCommand ? defaultCwd : resolve(defaultCwd, searchParams.get('cwd') || '.')
  if (!command) return

  store.setState({ protocol: webSocket.protocolList[ 0 ] })
  __DEV__ && console.log('[responderWebSocketUpgrade] pass', { command, cwd })

  const KEY = [ command, cwd, tag ].join(';')
  let processStore = processStoreMap.get(KEY)
  if (processStore === undefined) {
    processStore = createProcessStore(command, cwd, logger)
    processStoreMap.set(KEY, processStore)
    onProcessStart()
    logger.add(`[PROCESS] start, current: ${processStoreMap.size}`)
  }

  if (processStore.getState().sendChunk) {
    logger.add(`>> [${command}] already attached, drop extra connection`)
    return webSocket.on(WEBSOCKET_EVENT.OPEN, async () => {
      webSocket.sendText('process already attached, drop extra connection')
      webSocket.close(1000, 'process already attached')
    })
  }

  webSocket.on(WEBSOCKET_EVENT.OPEN, async () => {
    __DEV__ && console.log('[RequestProtocol] >> OPEN')
    processStore.start()
    const { exitPromise, subProcess, timeoutExitToken } = processStore.getState()
    if (timeoutExitToken) {
      logger.add(`>> [${command}] re-attach, exit canceled`)
      clearTimeout(timeoutExitToken)
      processStore.setState({ timeoutExitToken: null })
    }
    const sendChunk = (chunk) => {
      const { webSocket, pendingChunkList } = processStore.getState()
      if (webSocket.getReadyState() === webSocket.OPEN) {
        pendingChunkList.forEach((pendingChunk) => webSocket.sendText(patchXtermString(pendingChunk)))
        pendingChunkList.length = 0
        webSocket.sendText(patchXtermString(chunk))
      } else pendingChunkList.push(chunk)
    }
    processStore.setState({ webSocket, sendChunk })
    subProcess.stdout.on('data', sendChunk)
    subProcess.stderr.on('data', sendChunk)
    await setTimeoutAsync(500) // wait for a bit for output flush
    exitPromise.then(() => {
      processStoreMap.delete(KEY)
      onProcessStop()
      webSocket.close(1000, 'process exit')
      logger.add(`[PROCESS] exit, current: ${processStoreMap.size}`)
    })
  })

  webSocket.on(WEBSOCKET_EVENT.CLOSE, async () => {
    __DEV__ && console.log('[RequestProtocol] >> CLOSE')
    const { subProcess, sendChunk } = processStore.getState()
    if (subProcess) {
      subProcess.stdout.off('data', sendChunk)
      subProcess.stderr.off('data', sendChunk)
      logger.add(`>> [${command}] detach, will exit in ${time(timeoutExit)} if no re-connect`)
      const timeoutExitToken = setTimeout(() => {
        processStoreMap.delete(KEY)
        onProcessStop()
        return processStore.stop()
      }, timeoutExit)
      timeoutExitToken.unref()
      processStore.setState({ timeoutExitToken })
    }
    processStore.setState({ webSocket: null, sendChunk: null })
  })

  webSocket.on(WEBSOCKET_EVENT.FRAME, () => {
    webSocket.close(1000, 'no stdin support yet') // TODO: should not send back data
  })
}

const initialProcessState = {
  subProcess: null,
  exitPromise: null,
  webSocket: null,
  sendChunk: null,
  pendingChunkList: [],
  timeoutExitToken: null
}
const createProcessStore = (command, cwd, logger) => {
  const { getState, setState } = createStateStoreLite(initialProcessState)

  const start = () => {
    __DEV__ && console.log('[createProcessStore] start', { command, cwd })
    if (getState().subProcess) return
    const { promise, subProcess } = run({
      command,
      // TODO: support argList
      // TODO: support optional shell: true
      option: { cwd, stdio: [ 'ignore', 'pipe', 'pipe' ], env: { ...process.env, FORCE_COLOR: true }, shell: true }
    })
    const exitPromise = promise.catch((errorWithStatus) => {
      logger.add(`>> [${command}] error: ${errorWithStatus}`)
      return errorWithStatus
    })
    logger.add(`>> [${command}] attach`)
    setState({ subProcess, exitPromise })
  }

  const stop = async () => {
    __DEV__ && console.log('[createProcessStore] stop', { command, cwd })
    if (!getState().subProcess) return
    const { exitPromise, subProcess } = getState()
    setState(initialProcessState)
    const processList = await getProcessListAsync()
    const subProcessInfo = (await toProcessPidMap(processList))[ subProcess.pid ]
    const processTreeNode = subProcessInfo && await findProcessTreeInfo(subProcessInfo, await toProcessTree(processList)) // drops ppid since sub tree may get chopped
    processTreeNode && await killProcessTreeInfoAsync(processTreeNode)
    const { code, status } = await exitPromise
    logger.add(`>> [${command}] exit ${code}/${status}`)
    return { code, status }
  }

  return { getState, setState, start, stop }
}

const REGEXP_LINE_BREAK = /\n/g
const patchXtermString = (buffer) => String(buffer).replace(REGEXP_LINE_BREAK, '\r\n')

export { configureWebSocket }
