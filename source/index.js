import { URLSearchParams } from 'url'

import { createInsideOutPromise } from '@dr-js/core/module/common/function'
import { getUnusedPort } from '@dr-js/core/module/node/server/function'
import { getDefaultOpenCommandList } from '@dr-js/core/module/node/system/DefaultOpen'
import { run } from '@dr-js/core/module/node/system/Run'
import { addExitListenerAsync } from '@dr-js/core/module/node/system/ExitListener'

import { configureServerExot } from '@dr-js/node/module/module/ServerExot'
import { getServerExotOption } from '@dr-js/node/module/server/share/option'

import { configureResponder } from './configureResponder'
import { configureWebSocket } from './configureWebSocket'
import { MODE_NAME_LIST, parseOption, formatUsage } from './option'

import PACKAGE_JSON from '../package.json' // TODO: wait for: https://github.com/webpack/webpack/issues/11676
// const { name: packageName, version: packageVersion } = PACKAGE_JSON
const packageName = PACKAGE_JSON.name
const packageVersion = PACKAGE_JSON.version

const URL_WS = '/ws'
const URL_RUN = '/run'
const logger = { add: console.log }

const startCommand = async (optionData) => {
  const command = (optionData.get('command')).join(' ')
  const timeoutExit = optionData.tryGetFirst('timeout-exit') || 5 * 1000
  const serverExot = await configureServerExot({ hostname: '0.0.0.0', port: await getUnusedPort(0, '0.0.0.0') })
  await configureResponder({ serverExot, logger, URL_WS, URL_RUN, isSingleCommand: true })
  const { promise, resolve } = createInsideOutPromise()
  let exitTimeout
  const onProcessStart = () => {
    exitTimeout && clearTimeout(exitTimeout)
    logger.add(`[PROCESS] start, current: ${serverExot.processStoreMap.size}`)
  }
  const onProcessStop = () => {
    exitTimeout && clearTimeout(exitTimeout)
    if (!serverExot.processStoreMap.size) exitTimeout = setTimeout(resolve, timeoutExit)
    logger.add(`[PROCESS] exit, current: ${serverExot.processStoreMap.size}`)
  }
  configureWebSocket({ serverExot, logger, URL_WS, defaultCwd: process.cwd(), timeoutExit, singleCommand: command, onProcessStart, onProcessStop })
  await serverExot.up()
  logger.add(`[SERVER UP] version: ${packageVersion}, pid: ${process.pid}, at: ${serverExot.option.baseUrl}`)
  logger.add(`[COMMAND] ${command}`)
  const [ commandOpen, ...argList ] = [ ...getDefaultOpenCommandList(), `${serverExot.option.baseUrl}${URL_RUN}?${new URLSearchParams({ command })}` ]
  await Promise.all([
    promise,
    run({ command: commandOpen, argList }).promise
  ])
  logger.add('[SERVER DOWN]')
  for (const processStore of serverExot.processStoreMap) await processStore.stop()
  serverExot.webSocketSet.forEach((webSocket) => webSocket.close())
  await serverExot.down()
}

const startServer = async (optionData) => {
  const defaultCwd = optionData.tryGetFirst('default-cwd') || process.cwd()
  const timeoutExit = optionData.tryGetFirst('timeout-exit') || 5 * 1000
  const serverExot = await configureServerExot(getServerExotOption(optionData))
  await configureResponder({ serverExot, logger, URL_WS, URL_RUN })
  configureWebSocket({ serverExot, logger, URL_WS, defaultCwd, timeoutExit })
  await serverExot.up()
  logger.add(`[SERVER UP] version: ${packageVersion}, pid: ${process.pid}, at: ${serverExot.option.baseUrl}`)
  addExitListenerAsync(async () => {
    logger.add('[SERVER DOWN]')
    for (const processStore of serverExot.processStoreMap) await processStore.stop()
    serverExot.webSocketSet.forEach((webSocket) => webSocket.close())
    await serverExot.down()
  })
}

const runMode = async (modeName, optionData) => {
  switch (modeName) {
    case 'command':
      return startCommand(optionData)
    case 'host':
      return startServer(optionData)
  }
}

const main = async () => {
  const optionData = await parseOption()
  const modeName = MODE_NAME_LIST.find((name) => optionData.tryGet(name))

  if (!modeName) {
    return optionData.tryGet('version')
      ? console.log(JSON.stringify({ packageName, packageVersion }, null, '  '))
      : console.log(formatUsage(null, optionData.tryGet('help') ? null : 'simple'))
  }

  await runMode(modeName, optionData).catch((error) => {
    console.warn(`[Error] in mode: ${modeName}:`, error.stack || error)
    process.exit(2)
  })
}

main().catch((error) => {
  console.warn(formatUsage(error.stack || error, 'simple'))
  process.exit(1)
})
