import { resolve } from 'path'
import { readFileSync } from 'fs'
import { COMMON_LAYOUT, COMMON_STYLE, COMMON_SCRIPT } from '@dr-js/core/module/node/server/commonHTML'

const getHTML = ({
  URL_WS
}) => COMMON_LAYOUT([
  `<title>log-tab</title>`,
  COMMON_STYLE(),
  `<style>${String(readFileSync(resolve(__dirname, '../browser/run.css')))}</style>`,
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
  #root { overflow: hidden; width: 100vw; height: 100vh; background: #000; }
</style>`

const onLoadFunc = () => {
  const {
    qS,
    URLSearchParams, location,
    URL_WS,
    LOG_TAB: { setupTerminal }
  } = window

  const searchParams = new URLSearchParams(location.search)
  const command = searchParams.get('command') || ''
  const cwd = searchParams.get('cwd') || '.'

  document.title = command

  // const command = `dr-js --stc`
  // const cwd = `.`

  setupTerminal(qS('#root'), {
    urlWebSocket: `ws://${location.host}${URL_WS}?${new URLSearchParams({ command, cwd })}`,
    fontSize: 12,
    scrollback: 4096
  })
}

export { getHTML }
