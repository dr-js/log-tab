import { BASIC_EXTENSION_MAP } from '@dr-js/core/module/common/module/MIME'
import { createRequestListener } from '@dr-js/core/module/node/server/Server'
import { responderEnd, createResponderLog, createResponderLogEnd } from '@dr-js/core/module/node/server/Responder/Common'
import { createResponderFavicon, responderSendBufferCompress, prepareBufferDataAsync } from '@dr-js/core/module/node/server/Responder/Send'
import { createResponderRouter, createRouteMap } from '@dr-js/core/module/node/server/Responder/Router'

import { getHTML as getSelectHTML } from './HTML/select.js'
import { getHTML as getRunHTML } from './HTML/run.js'

const configureResponder = async ({
  server, option, logger,
  URL_WS,
  URL_RUN,
  isSingleCommand
}) => {
  const SelectHTMLBufferData = await prepareBufferDataAsync(Buffer.from(getSelectHTML({
    URL_RUN
  })), BASIC_EXTENSION_MAP.html)

  const RunHTMLBufferData = await prepareBufferDataAsync(Buffer.from(getRunHTML({
    URL_WS
  })), BASIC_EXTENSION_MAP.html)

  const responderLogEnd = createResponderLogEnd({ log: logger.add })

  const routeMap = createRouteMap([
    !isSingleCommand && [ '/', 'GET', (store) => responderSendBufferCompress(store, SelectHTMLBufferData) ],
    [ [ URL_RUN, `${URL_RUN}/*` ], 'GET', (store) => responderSendBufferCompress(store, RunHTMLBufferData) ],
    [ [ '/favicon', '/favicon.ico' ], 'GET', createResponderFavicon() ]
  ].filter(Boolean))

  server.on('request', createRequestListener({
    responderList: [
      createResponderLog({ log: logger.add }),
      createResponderRouter({ routeMap, baseUrl: option.baseUrl })
    ],
    responderEnd: (store) => {
      responderEnd(store)
      responderLogEnd(store)
    }
  }))
}

export { configureResponder }
