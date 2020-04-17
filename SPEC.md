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
>       from ENV: set to "env" to enable, not using be default
>       from JS/JSON file: set to "path/to/file.config.js|json"
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
>     --TLS-SNI-config [ARGUMENT=1]
>         TLS SNI config map, set to enable https:
>           multi config: { [hostname]: { key: pathOrBuffer, cert: pathOrBuffer, ca: pathOrBuffer } }, default to special hostname "default", or the first config
>           single config: { key: pathOrBuffer, cert: pathOrBuffer, ca: pathOrBuffer }
>           key: Private keys in PEM format
>           cert: Cert chains in PEM format
>           ca: Optionally override the trusted CA certificates
>       --TLS-dhparam [ARGUMENT=1]
>           pathOrBuffer; Diffie-Hellman Key Exchange, generate with: "openssl dhparam -dsaparam -outform PEM -out output/path/dh4096.pem 4096"
>     --default-cwd [ARGUMENT=1]
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
>     export LOG_TAB_TLS_SNI_CONFIG="[ARGUMENT=1]"
>     export LOG_TAB_TLS_DHPARAM="[ARGUMENT=1]"
>     export LOG_TAB_DEFAULT_CWD="[ARGUMENT=1]"
>   "
> CONFIG Usage:
>   {
>     "config": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "help": [ "[OPTIONAL] [ARGUMENT=0+]" ],
>     "version": [ "[OPTIONAL] [ARGUMENT=0+]" ],
>     "timeoutExit": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "command": [ "[OPTIONAL] [ARGUMENT=1+]" ],
>     "host": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "TLSSNIConfig": [ "[ARGUMENT=1]" ],
>     "TLSDhparam": [ "[ARGUMENT=1]" ],
>     "defaultCwd": [ "[ARGUMENT=1]" ],
>   }
> ```
