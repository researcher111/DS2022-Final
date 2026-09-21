# sql.js (vendored)

Version: **1.14.2**, from the official [sql.js release](https://github.com/sql-js/sql.js/releases/tag/v1.14.2).

Files were downloaded from the npm package mirrored by jsDelivr:

- https://cdn.jsdelivr.net/npm/sql.js@1.14.2/dist/sql-wasm.js
- https://cdn.jsdelivr.net/npm/sql.js@1.14.2/dist/sql-wasm.wasm
- https://cdn.jsdelivr.net/npm/sql.js@1.14.2/LICENSE

`sql-wasm.js` and `sql-wasm.wasm` are third-party sql.js / SQLite runtime code. The accompanying `LICENSE` preserves upstream notices. The activities use local copies: no CDN requests are needed when running the sandbox. The actual SQLite version is displayed in the sandbox from `sqlite_version()`.

User SQL runs inside a dedicated Web Worker against an in-memory database. A long-running operation can be cancelled, and a timeout resets the worker and sample data. No external database connection is made. A refresh resets sandbox data.
