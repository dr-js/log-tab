import { resolve } from 'path'

import { modifyCopy } from 'dr-js/module/node/file/Modify'

import { runMain } from 'dr-dev/module/main'
import { compileWithWebpack, commonFlag } from 'dr-dev/module/webpack'

const PATH_ROOT = resolve(__dirname, '..')
const PATH_OUTPUT = resolve(__dirname, '../output-gitignore')
const fromRoot = (...args) => resolve(PATH_ROOT, ...args)
const fromOutput = (...args) => resolve(PATH_OUTPUT, ...args)

runMain(async (logger) => {
  const { mode, isWatch, profileOutput, getCommonWebpackConfig } = await commonFlag({
    profileOutput: fromRoot('.temp-gitignore/profile-stat.browser.json'),
    logger
  })

  // copy css
  await modifyCopy(fromRoot('node_modules/xterm/dist/xterm.css'), fromOutput('browser/run.css'))

  const config = getCommonWebpackConfig({
    output: { path: fromOutput('browser'), filename: '[name].js', library: 'LOG_TAB', libraryTarget: 'umd' },
    entry: { run: 'source-browser/run' },
    resolve: { alias: { 'source-browser': fromRoot('source-browser') } }
  })

  logger.padLog(`compile with webpack mode: ${mode}, isWatch: ${Boolean(isWatch)}`)
  await compileWithWebpack({ config, isWatch, profileOutput, logger })
}, 'webpack-browser')
