import { Preset, prepareOption } from '@dr-js/core/module/node/module/Option/preset'
import { getServerExotFormatConfig } from '@dr-js/node/module/server/share/option'

const { Config, parseCompactList } = Preset

const MODE_FORMAT_LIST = [
  ...parseCompactList(
    'command,C/AS,O|command to run'
  ),
  getServerExotFormatConfig(parseCompactList(
    'default-cwd/SP,O|default cwd, default to cwd'
  ))
]
const MODE_NAME_LIST = MODE_FORMAT_LIST.map(({ name }) => name)

const OPTION_CONFIG = {
  prefixENV: 'log-tab',
  formatList: [
    Config,
    ...parseCompactList(
      'help,h/T|show full help',
      'version,v/T|show version',
      'timeout-exit,TE/SI,O|in msec, default 5 sec, exit timeout when no tab connected (to allow reconnect)'
    ),
    ...MODE_FORMAT_LIST
  ]
}

const { parseOption, formatUsage } = prepareOption(OPTION_CONFIG)

export { MODE_NAME_LIST, parseOption, formatUsage }
