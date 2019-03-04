import { debounce, createInsideOutPromise } from 'dr-js/module/common/function'
import { Terminal } from 'xterm'
import * as fit from 'xterm/lib/addons/fit/fit'
import * as attach from 'xterm/lib/addons/attach/attach'

// import 'xterm/dist/xterm.css'

Terminal.applyAddon(fit) // Apply the `fit` addon
Terminal.applyAddon(attach) // Apply the `attach` addon

const createTerminal = (element, option) => {
  const terminal = new Terminal(option)
  terminal.open(element) // Open the terminal in #terminal-container
  terminal.fit() // Make the terminal's size and geometry fit the size of #terminal-container
  window.addEventListener('resize', debounce(() => terminal.fit(), 500))
  return terminal
}

export {
  createTerminal,
  createInsideOutPromise
}
