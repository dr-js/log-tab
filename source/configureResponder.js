import { BASIC_EXTENSION_MAP } from 'dr-js/module/common/module/MIME'
import { createRequestListener } from 'dr-js/module/node/server/Server'
import { responderEnd, createResponderLog, createResponderLogEnd } from 'dr-js/module/node/server/Responder/Common'
import { createResponderFavicon, responderSendBufferCompress, prepareBufferDataAsync } from 'dr-js/module/node/server/Responder/Send'
import { createResponderRouter, createRouteMap } from 'dr-js/module/node/server/Responder/Router'

import { getHTML } from './HTML'

const configureResponder = async ({ server, option, logger, URL_WS }) => {
  const HTMLBufferData = await prepareBufferDataAsync(Buffer.from(getHTML({
    URL_WS
  })), BASIC_EXTENSION_MAP.html)

  const responderLogEnd = createResponderLogEnd({ log: logger.add })

  const routeMap = createRouteMap([
    [ [ '/', '/*' ], 'GET', (store) => responderSendBufferCompress(store, HTMLBufferData) ],
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
