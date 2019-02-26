import { URLSearchParams } from 'url'

import { getUnusedPort } from 'dr-js/module/node/server/function'
import { getDefaultOpen } from 'dr-js/module/node/system/DefaultOpen'
import { runSync } from 'dr-js/module/node/system/Run'

import { configureServer } from 'dr-server/module/configure/server'

import { configureResponder } from './configureResponder'
import { configureWebSocket } from './configureWebSocket'
import { parseOption, formatUsage } from './option'
import { name as packageName, version as packageVersion } from '../package.json'

const startServer = async ({ tryGet, tryGetFirst }) => {
  const host = tryGetFirst('host') || ''
  const [ hostname, port ] = host.split(':')
  const { server, start, option } = await configureServer({
    hostname: hostname || 'localhost',
    port: port || await getUnusedPort(0, hostname)
  })

  // const logger = await configureLog(getLogOption(optionData))
  const logger = { add: console.log }

  const defaultCwd = tryGetFirst('default-cwd') || process.cwd()
  const isAutoExit = !tryGet('keep')
  const URL_WS = '/ws'
  await configureResponder({ server, option, logger, URL_WS })
  await configureWebSocket({ server, option, logger, URL_WS, defaultCwd, isAutoExit })

  await start()
  logger.add(`[SERVER UP] version: ${packageVersion}, pid: ${process.pid}, at: ${option.baseUrl}, isAutoExit: ${isAutoExit}, defaultCwd: ${defaultCwd}`)

  const command = (tryGet('command') || []).join(' ')
  __DEV__ && console.log({ command })
  command && runSync({
    command: getDefaultOpen(),
    argList: [ `${option.protocol}//${option.hostname === '0.0.0.0' ? 'localhost' : option.hostname}:${option.port}?${new URLSearchParams({ command })}` ]
  })
}

const main = async () => {
  const optionData = await parseOption()
  const hasOption = Boolean(
    optionData.tryGet('host') ||
    optionData.tryGet('command')
  )

  if (!hasOption) {
    return optionData.tryGet('version')
      ? console.log(JSON.stringify({ packageName, packageVersion }, null, '  '))
      : console.log(formatUsage(null, optionData.tryGet('help') ? null : 'simple'))
  }

  await startServer(optionData).catch((error) => {
    console.warn(`[Error]`, error.stack || error)
    process.exit(2)
  })
}

main().catch((error) => {
  console.warn(formatUsage(error.stack || error, 'simple'))
  process.exit(1)
})
