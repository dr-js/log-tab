import { resolve } from 'path'
import { execSync } from 'child_process'

import { getScriptFileListFromPathList } from '@dr-js/dev/module/node/file'
import { initOutput, packOutput, verifyNoGitignore, verifyGitStatusClean, verifyOutputBin, publishOutput } from '@dr-js/dev/module/output'
import { getTerserOption, minifyFileListWithTerser } from '@dr-js/dev/module/minify'
import { processFileList, fileProcessorWebpack } from '@dr-js/dev/module/fileProcessor'
import { runMain, argvFlag } from '@dr-js/dev/module/main'

const PATH_ROOT = resolve(__dirname, '..')
const PATH_OUTPUT = resolve(__dirname, '../output-gitignore')
const fromRoot = (...args) => resolve(PATH_ROOT, ...args)
const fromOutput = (...args) => resolve(PATH_OUTPUT, ...args)
const execShell = (command) => execSync(command, { cwd: fromRoot(), stdio: argvFlag('quiet') ? [ 'ignore', 'ignore', 'inherit' ] : 'inherit' })

const buildOutput = async ({ logger }) => {
  logger.padLog('generate spec doc')
  execShell('npm run script-generate-spec')
  logger.padLog('build library')
  execShell('npm run build-library')
  logger.padLog('build browser')
  execShell('npm run build-browser')
}

const processOutput = async ({ logger }) => {
  const fileList = await getScriptFileListFromPathList([ '.' ], fromOutput)
  let sizeReduce = 0
  sizeReduce += await minifyFileListWithTerser({ fileList, option: getTerserOption(), rootPath: PATH_OUTPUT, logger })
  sizeReduce += await processFileList({ fileList, processor: fileProcessorWebpack, rootPath: PATH_OUTPUT, logger })
  logger.padLog(`total size reduce: ${sizeReduce}B`)
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
  logger.padLog('lint source')
  execShell('npm run lint')
  await verifyOutputBin({ fromOutput, packageJSON, logger })
  await verifyGitStatusClean({ fromRoot, logger })
  const pathPackagePack = await packOutput({ fromRoot, fromOutput, logger })
  await publishOutput({ flagList: process.argv, packageJSON, pathPackagePack, logger })
})
