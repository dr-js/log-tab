import { URLSearchParams } from 'url'

import { createInsideOutPromise } from 'dr-js/module/common/function'
import { getUnusedPort } from 'dr-js/module/node/server/function'
import { getDefaultOpen } from 'dr-js/module/node/system/DefaultOpen'
import { runSync } from 'dr-js/module/node/system/Run'
import { addExitListenerAsync } from 'dr-js/module/node/system/ExitListener'

import { configureServer } from 'dr-server/module/configure/server'
import { getServerOption } from 'dr-server/module/configure/option'

import { configureResponder } from './configureResponder'
import { configureWebSocket } from './configureWebSocket'
import { MODE_NAME_LIST, parseOption, formatUsage } from './option'
import { name as packageName, version as packageVersion } from '../package.json'

const URL_WS = '/ws'
const URL_RUN = '/run'
const logger = { add: console.log }

const startCommand = async (optionData) => {
  const command = (optionData.get('command')).join(' ')
  const timeoutExit = optionData.tryGetFirst('timeout-exit') || 5 * 1000
  const { server, start, /* stop, */ option } = await configureServer({ port: await getUnusedPort(0, 'localhost') })
  await configureResponder({ server, option, logger, URL_WS, URL_RUN, isSingleCommand: true })
  const { promise, resolve } = createInsideOutPromise()
  let exitTimeout
  const onProcessStart = () => {
    exitTimeout && clearTimeout(exitTimeout)
    logger.add(`[PROCESS] start, current: ${processStoreMap.size}`)
  }
  const onProcessStop = () => {
    exitTimeout && clearTimeout(exitTimeout)
    if (!processStoreMap.size) exitTimeout = setTimeout(resolve, timeoutExit)
    logger.add(`[PROCESS] exit, current: ${processStoreMap.size}`)
  }
  const { webSocketSet, processStoreMap } = configureWebSocket({ server, option, logger, URL_WS, defaultCwd: process.cwd(), timeoutExit, singleCommand: command, onProcessStart, onProcessStop })
  await start()
  logger.add(`[SERVER UP] version: ${packageVersion}, pid: ${process.pid}, at: ${option.baseUrl}`)
  logger.add(`[COMMAND] ${command}`)
  addExitListenerAsync(async () => {
    for (const processStore of processStoreMap) await processStore.stop()
    webSocketSet.forEach((webSocket) => webSocket.close())
  })
  runSync({
    command: getDefaultOpen(),
    argList: [ `${option.baseUrl}/${URL_RUN}?${new URLSearchParams({ command })}` ]
  })
  await promise
  // webSocketSet.forEach((webSocket) => webSocket.close())
  // await stop()
  logger.add(`[SERVER DOWN]`)
  process.exit()
}

const startServer = async (optionData) => {
  const defaultCwd = optionData.tryGetFirst('default-cwd') || process.cwd()
  const timeoutExit = optionData.tryGetFirst('timeout-exit') || 5 * 1000
  const { server, start, /* stop, */ option } = await configureServer(getServerOption(optionData))
  await configureResponder({ server, option, logger, URL_WS, URL_RUN })
  const { webSocketSet, processStoreMap } = await configureWebSocket({ server, option, logger, URL_WS, defaultCwd, timeoutExit })
  await start()
  logger.add(`[SERVER UP] version: ${packageVersion}, pid: ${process.pid}, at: ${option.baseUrl}`)
  addExitListenerAsync(async () => {
    for (const processStore of processStoreMap) await processStore.stop()
    webSocketSet.forEach((webSocket) => webSocket.close())
  })
  // webSocketSet.forEach((webSocket) => webSocket.close())
  // await stop()
  // logger.add(`[SERVER DOWN]`)
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
