# Specification

* [Export Path](#export-path)
* [Bin Option Format](#bin-option-format)

#### Export Path
+ 📄 [source/configureResponder.js](source/configureResponder.js)
  - `configureResponder`
+ 📄 [source/configureWebSocket.js](source/configureWebSocket.js)
  - `configureWebSocket`
+ 📄 [source/option.js](source/option.js)
  - `MODE_NAME_LIST`, `formatUsage`, `parseOption`
+ 📄 [source/HTML/run.js](source/HTML/run.js)
  - `getHTML`
+ 📄 [source/HTML/select.js](source/HTML/select.js)
  - `getHTML`

#### Bin Option Format
📄 [source/option.js](source/option.js)
> ```
> CLI Usage:
>   --config --c -c [OPTIONAL] [ARGUMENT=1]
>       from ENV: set to "env"
>       from JS/JSON file: set to "path/to/config.js|json"
>   --help --h -h [OPTIONAL] [ARGUMENT=0+]
>       show full help
>   --version --v -v [OPTIONAL] [ARGUMENT=0+]
>       show version
>   --timeout-exit --TE [OPTIONAL] [ARGUMENT=1]
>       in msec, default 5 sec, exit timeout when no tab connected (to allow reconnect)
>   --command --C -C [OPTIONAL] [ARGUMENT=1+]
>       command to run
>   --host --H -H [OPTIONAL] [ARGUMENT=1]
>       set "hostname:port"
>     --https --S -S [OPTIONAL-CHECK] [ARGUMENT=0+]
>         set to enable
>       --file-SSL-key [OPTIONAL-CHECK] [ARGUMENT=1]
>       --file-SSL-cert [OPTIONAL-CHECK] [ARGUMENT=1]
>       --file-SSL-chain [OPTIONAL-CHECK] [ARGUMENT=1]
>       --file-SSL-dhparam [OPTIONAL-CHECK] [ARGUMENT=1]
>     --default-cwd [OPTIONAL-CHECK] [ARGUMENT=1]
>         default cwd, default to cwd
> ENV Usage:
>   "
>     #!/usr/bin/env bash
>     export LOG_TAB_CONFIG="[OPTIONAL] [ARGUMENT=1]"
>     export LOG_TAB_HELP="[OPTIONAL] [ARGUMENT=0+]"
>     export LOG_TAB_VERSION="[OPTIONAL] [ARGUMENT=0+]"
>     export LOG_TAB_TIMEOUT_EXIT="[OPTIONAL] [ARGUMENT=1]"
>     export LOG_TAB_COMMAND="[OPTIONAL] [ARGUMENT=1+]"
>     export LOG_TAB_HOST="[OPTIONAL] [ARGUMENT=1]"
>     export LOG_TAB_HTTPS="[OPTIONAL-CHECK] [ARGUMENT=0+]"
>     export LOG_TAB_FILE_SSL_KEY="[OPTIONAL-CHECK] [ARGUMENT=1]"
>     export LOG_TAB_FILE_SSL_CERT="[OPTIONAL-CHECK] [ARGUMENT=1]"
>     export LOG_TAB_FILE_SSL_CHAIN="[OPTIONAL-CHECK] [ARGUMENT=1]"
>     export LOG_TAB_FILE_SSL_DHPARAM="[OPTIONAL-CHECK] [ARGUMENT=1]"
>     export LOG_TAB_DEFAULT_CWD="[OPTIONAL-CHECK] [ARGUMENT=1]"
>   "
> CONFIG Usage:
>   {
>     "config": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "help": [ "[OPTIONAL] [ARGUMENT=0+]" ],
>     "version": [ "[OPTIONAL] [ARGUMENT=0+]" ],
>     "timeoutExit": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "command": [ "[OPTIONAL] [ARGUMENT=1+]" ],
>     "host": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "https": [ "[OPTIONAL-CHECK] [ARGUMENT=0+]" ],
>     "fileSSLKey": [ "[OPTIONAL-CHECK] [ARGUMENT=1]" ],
>     "fileSSLCert": [ "[OPTIONAL-CHECK] [ARGUMENT=1]" ],
>     "fileSSLChain": [ "[OPTIONAL-CHECK] [ARGUMENT=1]" ],
>     "fileSSLDhparam": [ "[OPTIONAL-CHECK] [ARGUMENT=1]" ],
>     "defaultCwd": [ "[OPTIONAL-CHECK] [ARGUMENT=1]" ],
>   }
> ```
