import { resolve } from 'path'

import { setTimeoutAsync } from 'dr-js/module/common/time'
import { createResponderRouter, createRouteMap } from 'dr-js/module/node/server/Responder/Router'
import { WEB_SOCKET_EVENT_MAP } from 'dr-js/module/node/server/WebSocket/type'
import { enableWebSocketServer } from 'dr-js/module/node/server/WebSocket/WebSocketServer'
import { createUpdateRequestListener } from 'dr-js/module/node/server/WebSocket/WebSocketUpgradeRequest'
import { run } from 'dr-js/module/node/system/Run'
import { addExitListenerAsync, deleteExitListenerAsync } from 'dr-js/module/node/system/ExitListener'
import { getProcessList, getProcessPidMap, getProcessTree, findProcessTreeNode, tryKillProcessTreeNode } from 'dr-js/module/node/system/ProcessStatus'

const configureWebSocket = async ({
  server, option, logger,
  URL_WS,
  defaultCwd, isAutoExit
}) => {
  const WebSocketSet = new Set()
  enableWebSocketServer({
    server,
    onUpgradeRequest: createUpdateRequestListener({
      responderList: [
        createResponderRouter({
          routeMap: createRouteMap([
            [ URL_WS, 'GET', (store) => responderWebSocketUpgrade(store, { server, logger, defaultCwd, isAutoExit, WebSocketSet }) ]
          ]),
          baseUrl: option.baseUrl
        })
      ]
    })
  })
}

const responderWebSocketUpgrade = async (store, { server, logger, defaultCwd, isAutoExit, WebSocketSet }) => { // TODO: NOTE: expect createResponderRouter
  __DEV__ && console.log('[responderWebSocketUpgrade]', store.bodyHeadBuffer.length, store.request.url)
  const { webSocket } = store

  const { url: { searchParams } } = store.getState()
  const command = searchParams.get('command')
  const cwd = resolve(defaultCwd, searchParams.get('cwd') || '.')
  if (!command) return

  store.setState({ protocol: webSocket.protocolList[ 0 ] })
  __DEV__ && console.log('[responderWebSocketUpgrade] pass', { command, cwd })

  let commandState
  const startCommand = async () => {
    await stopCommand()

    const { promise, subProcess } = run({ command, option: { cwd, stdio: [ 'ignore', 'pipe', 'pipe' ] } })

    // subProcess.stdout.on('data', (chunk) => webSocket.sendBuffer(chunk))
    // subProcess.stderr.on('data', (chunk) => webSocket.sendBuffer(chunk))
    subProcess.stdout.on('data', (chunk) => webSocket.sendText(patchXtermString(chunk)))
    subProcess.stderr.on('data', (chunk) => webSocket.sendText(patchXtermString(chunk)))

    const exitPromise = promise.catch((errorWithStatus) => errorWithStatus)

    WebSocketSet.add(webSocket)
    commandState = { exitPromise, subProcess }
    addExitListenerAsync(stopCommand)

    await setTimeoutAsync(500) // wait for a bit for output flush
    exitPromise.then(() => { webSocket.close(1000, 'process exit') })
  }
  const stopCommand = async () => {
    if (!commandState) return

    WebSocketSet.delete(webSocket)
    const { exitPromise, subProcess } = commandState
    commandState = undefined

    const processList = await getProcessList()
    const subProcessInfo = (await getProcessPidMap(processList))[ subProcess.pid ]
    if (subProcessInfo) {
      const { pid, command, subTree } = await findProcessTreeNode(subProcessInfo, await getProcessTree(processList)) // drops ppid since sub tree may get chopped
      await tryKillProcessTreeNode({ pid, command, subTree })
    }
    const { code, status } = await exitPromise
    logger.add('process exit', { code, status })
    deleteExitListenerAsync(stopCommand)

    if (isAutoExit && !WebSocketSet.size) { // exit
      await server.close()
      process.exit(code)
    }
  }

  webSocket.on(WEB_SOCKET_EVENT_MAP.OPEN, () => {
    __DEV__ && console.log(`[RequestProtocol] >> OPEN`)
    startCommand().catch(() => {})
  })
  webSocket.on(WEB_SOCKET_EVENT_MAP.CLOSE, () => {
    __DEV__ && console.log(`[RequestProtocol] >> CLOSE`)
    stopCommand().catch(() => {})
  })
  webSocket.on(WEB_SOCKET_EVENT_MAP.FRAME, () => {
    webSocket.close(1000, 'no stdin support yet') // TODO: should not send back data
  })
}

const REGEXP_LINE_BREAK = /\n/g
const patchXtermString = (buffer) => String(buffer).replace(REGEXP_LINE_BREAK, '\r\n')

export { configureWebSocket }
