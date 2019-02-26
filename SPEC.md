# Specification

* [Export Path](#export-path)
* [Bin Option Format](#bin-option-format)

#### Export Path
+ 📄 [source/HTML.js](source/HTML.js)
  - `getHTML`
+ 📄 [source/configureResponder.js](source/configureResponder.js)
  - `configureResponder`
+ 📄 [source/configureWebSocket.js](source/configureWebSocket.js)
  - `configureWebSocket`
+ 📄 [source/option.js](source/option.js)
  - `formatUsage`, `parseOption`

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
>   --command --C -C [OPTIONAL] [ARGUMENT=1+]
>       command to run
>   --default-cwd [OPTIONAL] [ARGUMENT=1]
>       default cwd, default to cwd
>   --host --H -H [OPTIONAL] [ARGUMENT=1]
>       set "hostname:port", default to "localhost:random"
>   --keep --K -K [OPTIONAL] [ARGUMENT=0+]
>       do no auto exit when no command running
> ENV Usage:
>   "
>     #!/usr/bin/env bash
>     export LOG_TAB_CONFIG="[OPTIONAL] [ARGUMENT=1]"
>     export LOG_TAB_HELP="[OPTIONAL] [ARGUMENT=0+]"
>     export LOG_TAB_VERSION="[OPTIONAL] [ARGUMENT=0+]"
>     export LOG_TAB_COMMAND="[OPTIONAL] [ARGUMENT=1+]"
>     export LOG_TAB_DEFAULT_CWD="[OPTIONAL] [ARGUMENT=1]"
>     export LOG_TAB_HOST="[OPTIONAL] [ARGUMENT=1]"
>     export LOG_TAB_KEEP="[OPTIONAL] [ARGUMENT=0+]"
>   "
> CONFIG Usage:
>   {
>     "config": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "help": [ "[OPTIONAL] [ARGUMENT=0+]" ],
>     "version": [ "[OPTIONAL] [ARGUMENT=0+]" ],
>     "command": [ "[OPTIONAL] [ARGUMENT=1+]" ],
>     "defaultCwd": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "host": [ "[OPTIONAL] [ARGUMENT=1]" ],
>     "keep": [ "[OPTIONAL] [ARGUMENT=0+]" ],
>   }
> ```
