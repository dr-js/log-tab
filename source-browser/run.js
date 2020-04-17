import { debounce, createInsideOutPromise } from '@dr-js/core/module/common/function'

import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { AttachAddon } from 'xterm-addon-attach'

// import 'xterm/css/xterm.css'

const setupTerminal = (element, { urlWebSocket, ...option }) => {
  const terminal = new Terminal(option)
  terminal.open(element) // Open the terminal in #terminal-container

  const fitAddon = new FitAddon()
  terminal.loadAddon(fitAddon) // Apply the `fit` addon
  window.addEventListener('resize', debounce(() => fitAddon.fit(), 500))
  fitAddon.fit() // Make the terminal's size and geometry fit the size of #terminal-container

  const attachWebSocketLoop = (terminal, urlWebSocket) => {
    attachWebSocket(terminal, urlWebSocket)
      .catch((error) => {
        console.log({ error })
        setTimeout(() => attachWebSocketLoop(terminal, urlWebSocket))
      })
  }
  attachWebSocketLoop(terminal, urlWebSocket)
}

const attachWebSocket = async (terminal, urlWebSocket) => {
  const { promise, resolve, reject } = createInsideOutPromise()

  const websocket = new window.WebSocket(urlWebSocket, 'log-tab')
  const attachAddon = new AttachAddon(websocket)
  terminal.writeln('websocket connect')
  console.log('websocket connect')

  const onOpenWebSocket = () => {
    // The following line of code:
    //   1. Attaches the given socket to `terminal`
    //   2. Sets up non-bidirectional communication (renders stdout/stderr)
    //   3. Buffers rendering for better performance
    terminal.loadAddon(attachAddon) // Apply the `attach` addon
    terminal.writeln('websocket open')
    console.log('websocket open')
  }
  const onCloseWebSocket = (error) => {
    attachAddon.dispose()
    terminal.writeln('websocket close')
    console.log('websocket close')
    error ? reject(error) : resolve()
  }
  const onErrorWebSocket = (error) => {
    terminal.writeln(`websocket error: ${error}`)
    console.warn(`websocket error: ${error}`)
    onCloseWebSocket(error)
  }
  websocket.addEventListener('open', onOpenWebSocket)
  websocket.addEventListener('error', onErrorWebSocket)
  websocket.addEventListener('close', ({ code }) => code === 1000
    ? onCloseWebSocket()
    : onErrorWebSocket(new Error(`server close with code: ${code}`))
  )
  // websocket.addEventListener('message', ({ data }) => onMessage(data))
  return promise
}

export { setupTerminal }
