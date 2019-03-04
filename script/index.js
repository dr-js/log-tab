import { resolve } from 'path'
import { execSync } from 'child_process'

import { binary } from 'dr-js/module/common/format'
import { modify } from 'dr-js/module/node/file/Modify'

import { argvFlag, runMain } from 'dr-dev/module/main'
import { getScriptFileListFromPathList } from 'dr-dev/module/node/fileList'
import { initOutput, packOutput, verifyOutputBinVersion, publishOutput } from 'dr-dev/module/output'
import { processFileList, fileProcessorWebpack } from 'dr-dev/module/fileProcessor'
import { getTerserOption, minifyFileListWithTerser } from 'dr-dev/module/minify'
import { writeLicenseFile } from 'dr-dev/module/license'

const PATH_ROOT = resolve(__dirname, '..')
const PATH_OUTPUT = resolve(__dirname, '../output-gitignore')
const fromRoot = (...args) => resolve(PATH_ROOT, ...args)
const fromOutput = (...args) => resolve(PATH_OUTPUT, ...args)
const execOptionRoot = { cwd: fromRoot(), stdio: argvFlag('quiet') ? [ 'ignore', 'ignore', 'inherit' ] : 'inherit', shell: true }

runMain(async (logger) => {
  const { padLog } = logger

  padLog('generate spec')
  execSync(`npm run script-generate-spec`, execOptionRoot)

  const packageJSON = await initOutput({ fromRoot, fromOutput, copyPathList: [ 'README.md' ], logger })
  writeLicenseFile(fromRoot('LICENSE'), packageJSON.license, packageJSON.author)

  padLog(`copy bin`)
  await modify.copy(fromRoot('source-bin/index.js'), fromOutput('bin/index.js'))

  if (!argvFlag('pack')) return

  padLog(`build library`)
  execSync('npm run build-library', execOptionRoot)

  padLog(`build browser`)
  execSync('npm run build-browser', execOptionRoot)

  padLog(`process output`)
  const fileList = await getScriptFileListFromPathList([ '.' ], fromOutput)
  let sizeReduce = 0

  sizeReduce += await minifyFileListWithTerser({ fileList, option: getTerserOption(), rootPath: PATH_OUTPUT, logger })
  sizeReduce += await processFileList({ fileList, processor: fileProcessorWebpack, rootPath: PATH_OUTPUT, logger })

  // again, maybe smaller
  sizeReduce += await minifyFileListWithTerser({ fileList, option: getTerserOption(), rootPath: PATH_OUTPUT, logger })
  sizeReduce += await processFileList({ fileList, processor: fileProcessorWebpack, rootPath: PATH_OUTPUT, logger })

  padLog(`total size reduce: ${binary(sizeReduce)}B`)

  await verifyOutputBinVersion({ fromOutput, packageJSON, logger })

  const pathPackagePack = await packOutput({ fromRoot, fromOutput, logger })
  await publishOutput({ flagList: process.argv, packageJSON, pathPackagePack, logger })
})
