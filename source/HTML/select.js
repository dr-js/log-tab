import { COMMON_LAYOUT, COMMON_STYLE, COMMON_SCRIPT } from '@dr-js/core/module/node/server/commonHTML'

const getHTML = ({
  URL_RUN
}) => COMMON_LAYOUT([
  '<title>log-tab</title>',
  COMMON_STYLE()
], [
  COMMON_SCRIPT({
    URL_RUN,
    onload: onLoadFunc
  })
])

const onLoadFunc = () => {
  const {
    cE, aCL,
    URLSearchParams, open,
    URL_RUN
  } = window

  const inputCommand = cE('input', { placeholder: 'command', autofocus: true })
  const inputCwd = cE('input', { placeholder: 'cwd' })
  const inputTag = cE('input', { placeholder: 'tag' })

  aCL(document.body, [
    inputCommand,
    inputCwd,
    inputTag,
    cE('button', {
      innerText: 'Run Command',
      onclick: () => {
        const command = inputCommand.value.trim()
        const cwd = inputCwd.value.trim() || '.'
        const tag = inputTag.value.trim() || ''
        if (!command) return
        open(`${URL_RUN}?${new URLSearchParams({ command, cwd, tag })}`)
      }
    })
  ])
}

export { getHTML }
