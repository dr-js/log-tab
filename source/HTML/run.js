import { resolve } from 'path'
import { readFileSync } from 'fs'
import { COMMON_LAYOUT, COMMON_STYLE, COMMON_SCRIPT } from 'dr-js/module/node/server/commonHTML'

const getHTML = ({
  URL_WS
}) => COMMON_LAYOUT([
  `<title>log-tab</title>`,
  COMMON_STYLE(),
  mainStyle
], [
  `<div id="root"></div>`,
  COMMON_SCRIPT({
    URL_WS,
    onload: onLoadFunc
  }),
  `<script>${String(readFileSync(resolve(__dirname, '../browser/run.js')))}</script>`
])

const mainStyle = `<style>
  ::-webkit-scrollbar-thumb { background: #fff4; }
  ::-webkit-scrollbar-thumb:hover { background: #fff6; }
  html, body, #root { overflow: hidden; width: 100vw; height: 100vh; background: #000; }
</style>`

const onLoadFunc = () => {
  const {
    WebSocket, URLSearchParams, location,
    URL_WS,
    LOG_TAB: { createTerminal, createInsideOutPromise, withRetryAsync }
  } = window

  const searchParams = new URLSearchParams(location.search)
  const command = searchParams.get('command') || ''
  const cwd = searchParams.get('cwd') || '.'

  document.title = command

  // const command = `dr-js --stc`
  // const cwd = `.`

  const terminal = createTerminal(document.querySelector('#root'), {
    fontSize: 12,
    scrollback: 4096
  })

  const attachWebSocket = async () => {
    const { promise, resolve, reject } = createInsideOutPromise()

    const websocket = new WebSocket(`ws://${location.host}${URL_WS}?${new URLSearchParams({ command, cwd })}`, 'log-tab')

    const onCloseWebSocket = (error) => {
      terminal.detach(websocket)
      terminal.writeln(`websocket close`)
      error ? resolve() : reject()
    }
    const onErrorWebSocket = (error) => {
      console.warn(error)
      terminal.writeln(`websocket error: ${error}`)
      onCloseWebSocket(error)
    }
    websocket.addEventListener('error', onErrorWebSocket)
    websocket.addEventListener('close', ({ code }) => code === 1000
      ? onCloseWebSocket()
      : onErrorWebSocket(new Error(`server close with code: ${code}`))
    )
    // websocket.addEventListener('message', ({ data }) => onMessage(data))

    // The following line of code:
    //   1. Attaches the given socket to `terminal`
    //   2. Sets up non-bidirectional communication (renders stdout/stderr)
    //   3. Buffers rendering for better performance
    terminal.attach(websocket, false, true)

    return promise
  }

  withRetryAsync(attachWebSocket(), Infinity, 1000)
}

export { getHTML }
