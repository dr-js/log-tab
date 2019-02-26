import { Preset, prepareOption } from 'dr-js/module/node/module/Option/preset'

const { Config, parseCompactList } = Preset

const OPTION_CONFIG = {
  prefixENV: 'log-tab',
  formatList: [
    Config,
    ...parseCompactList(
      'help,h/T|show full help',
      'version,v/T|show version',
      'command,C/AS,O|command to run',
      'default-cwd/SP,O|default cwd, default to cwd',
      'host,H/SS,O|set "hostname:port", default to "localhost:random"',
      'keep,K/T|do no auto exit when no command running'
    )
  ]
}

const { parseOption, formatUsage } = prepareOption(OPTION_CONFIG)

export { parseOption, formatUsage }
