import { resolve } from 'path'

import { time } from 'dr-js/module/common/format'
import { setTimeoutAsync } from 'dr-js/module/common/time'
import { createStateStoreLite } from 'dr-js/module/common/immutable/StateStore'
import { createResponderRouter, createRouteMap } from 'dr-js/module/node/server/Responder/Router'
import { WEB_SOCKET_EVENT_MAP } from 'dr-js/module/node/server/WebSocket/type'
import { enableWebSocketServer } from 'dr-js/module/node/server/WebSocket/WebSocketServer'
import { createUpdateRequestListener } from 'dr-js/module/node/server/WebSocket/WebSocketUpgradeRequest'
import { run } from 'dr-js/module/node/system/Run'
import { getProcessList, getProcessPidMap, getProcessTree, findProcessTreeNode, tryKillProcessTreeNode } from 'dr-js/module/node/system/ProcessStatus'

const configureWebSocket = ({
  server, option, logger,
  URL_WS,
  defaultCwd, timeoutExit, singleCommand,
  onProcessStart = () => {},
  onProcessStop = () => {}
}) => {
  const processStoreMap = new Map()

  const config = {
    server,
    logger,
    defaultCwd,
    timeoutExit,
    singleCommand,
    processStoreMap,
    onProcessStart,
    onProcessStop
  }

  const webSocketSet = enableWebSocketServer({
    server,
    onUpgradeRequest: createUpdateRequestListener({
      responderList: [
        createResponderRouter({
          routeMap: createRouteMap([
            [ URL_WS, 'GET', (store) => responderWebSocketUpgrade(store, config) ]
          ]),
          baseUrl: option.baseUrl
        })
      ]
    })
  })

  return { webSocketSet, processStoreMap }
}

const responderWebSocketUpgrade = async (store, {
  server, logger,
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
  }

  if (processStore.getState().sendChunk) {
    logger.add('process already attached, drop extra connection', { command })
    return webSocket.on(WEB_SOCKET_EVENT_MAP.OPEN, async () => {
      webSocket.sendText('process already attached, drop extra connection')
      webSocket.close(1000, 'process already attached')
    })
  }

  webSocket.on(WEB_SOCKET_EVENT_MAP.OPEN, async () => {
    __DEV__ && console.log(`[RequestProtocol] >> OPEN`)
    processStore.start()
    const { exitPromise, subProcess, timeoutExitToken } = processStore.getState()
    if (timeoutExitToken) {
      logger.add('process resume', { command })
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
    })
  })

  webSocket.on(WEB_SOCKET_EVENT_MAP.CLOSE, async () => {
    __DEV__ && console.log(`[RequestProtocol] >> CLOSE`)
    const { subProcess, sendChunk } = processStore.getState()
    if (subProcess) {
      subProcess.stdout.off('data', sendChunk)
      subProcess.stderr.off('data', sendChunk)
      logger.add(`process will exit in ${time(timeoutExit)} if no re-connect`, { command })
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

  webSocket.on(WEB_SOCKET_EVENT_MAP.FRAME, () => {
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
    const { promise, subProcess } = run({ command, option: { cwd, stdio: [ 'ignore', 'pipe', 'pipe' ], env: { ...process.env, FORCE_COLOR: true } } })
    const exitPromise = promise.catch((errorWithStatus) => {
      logger.add(`process error: ${errorWithStatus}`)
      return errorWithStatus
    })
    logger.add('process start', { command })
    setState({ subProcess, exitPromise })
  }

  const stop = async () => {
    __DEV__ && console.log('[createProcessStore] stop', { command, cwd })
    if (!getState().subProcess) return
    const { exitPromise, subProcess } = getState()
    setState(initialProcessState)
    const processList = await getProcessList()
    const subProcessInfo = (await getProcessPidMap(processList))[ subProcess.pid ]
    const processTreeNode = subProcessInfo && await findProcessTreeNode(subProcessInfo, await getProcessTree(processList)) // drops ppid since sub tree may get chopped
    processTreeNode && await tryKillProcessTreeNode(processTreeNode)
    const { code, status } = await exitPromise
    logger.add('process exit', { code, status })
    return { code, status }
  }

  return { getState, setState, start, stop }
}

const REGEXP_LINE_BREAK = /\n/g
const patchXtermString = (buffer) => String(buffer).replace(REGEXP_LINE_BREAK, '\r\n')

export { configureWebSocket }
