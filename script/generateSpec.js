import { resolve } from 'path'
import { writeFileSync } from 'fs'

import { indentLine } from 'dr-js/module/common/string'

import { runMain } from 'dr-dev/module/main'
import { collectSourceRouteMap } from 'dr-dev/module/node/export/parse'
import { generateExportInfo } from 'dr-dev/module/node/export/generate'
import { autoAppendMarkdownHeaderLink, renderMarkdownFileLink, renderMarkdownExportPath } from 'dr-dev/module/node/export/renderMarkdown'

import { formatUsage } from 'source/option'

const PATH_ROOT = resolve(__dirname, '..')
const fromRoot = (...args) => resolve(PATH_ROOT, ...args)

const renderMarkdownBinOptionFormat = () => [
  renderMarkdownFileLink('source/option.js'),
  '> ```',
  indentLine(formatUsage(), '> '),
  '> ```'
]

runMain(async (logger) => {
  logger.log(`collect sourceRouteMap`)
  const sourceRouteMap = await collectSourceRouteMap({ pathRootList: [ fromRoot('source') ], logger })

  logger.log(`generate exportInfo`)
  const exportInfoMap = generateExportInfo({ sourceRouteMap })

  logger.log(`output: SPEC.md`)
  writeFileSync(fromRoot('SPEC.md'), [
    '# Specification',
    '',
    ...autoAppendMarkdownHeaderLink(
      '#### Export Path',
      ...renderMarkdownExportPath({ exportInfoMap, rootPath: PATH_ROOT }),
      '',
      '#### Bin Option Format',
      ...renderMarkdownBinOptionFormat()
    ),
    ''
  ].join('\n'))
}, 'generate-export')
