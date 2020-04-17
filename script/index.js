import { resolve } from 'path'
import { execSync } from 'child_process'

import { getSourceJsFileListFromPathList } from '@dr-js/dev/module/node/filePreset'
import { initOutput, packOutput, clearOutput, verifyNoGitignore, verifyGitStatusClean, verifyOutputBin, publishOutput } from '@dr-js/dev/module/output'
import { getTerserOption, minifyFileListWithTerser } from '@dr-js/dev/module/minify'
import { processFileList, fileProcessorWebpack } from '@dr-js/dev/module/fileProcessor'
import { runMain, argvFlag } from '@dr-js/dev/module/main'

const PATH_ROOT = resolve(__dirname, '..')
const PATH_OUTPUT = resolve(__dirname, '../output-gitignore')
const fromRoot = (...args) => resolve(PATH_ROOT, ...args)
const fromOutput = (...args) => resolve(PATH_OUTPUT, ...args)
const execShell = (command) => execSync(command, { cwd: fromRoot(), stdio: argvFlag('quiet') ? [ 'ignore', 'ignore', 'inherit' ] : 'inherit' })

const buildOutput = async ({ logger }) => {
  logger.padLog('generate spec')
  execShell('npm run script-generate-spec')
  logger.padLog('build library')
  execShell('npm run build-library')
  logger.padLog('build browser')
  execShell('npm run build-browser')
}

const processOutput = async ({ logger }) => {
  const fileList = await getSourceJsFileListFromPathList([ '.' ], fromOutput)
  let sizeReduce = 0
  sizeReduce += await minifyFileListWithTerser({ fileList, option: getTerserOption(), rootPath: PATH_OUTPUT, logger })
  sizeReduce += await processFileList({ fileList, processor: fileProcessorWebpack, rootPath: PATH_OUTPUT, logger })
  logger.padLog(`size reduce: ${sizeReduce}B`)
}

runMain(async (logger) => {
  await verifyNoGitignore({ path: fromRoot('source'), logger })
  const packageJSON = await initOutput({
    copyMapPathList: [ [ 'source-bin/index.js', 'bin/index.js' ] ],
    fromRoot, fromOutput, logger
  })
  if (!argvFlag('pack')) return
  await buildOutput({ logger })
  await processOutput({ logger })
  const isTest = true // argvFlag('test', 'publish', 'publish-dev')
  isTest && logger.padLog('lint source')
  isTest && execShell('npm run lint')
  isTest && await processOutput({ logger }) // once more
  // isTest && logger.padLog('test output')
  // isTest && execShell('npm run test-output')
  await clearOutput({ fromOutput, logger })
  await verifyOutputBin({ fromOutput, packageJSON, logger })
  isTest && await verifyGitStatusClean({ fromRoot, logger })
  const pathPackagePack = await packOutput({ fromRoot, fromOutput, logger })
  await publishOutput({ flagList: process.argv, packageJSON, pathPackagePack, logger })
})
