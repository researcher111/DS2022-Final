# Lecture 05 SQL activities

Open `index.html` through the repository's static server (for example `npm run serve`). Each activity has a direct URL:

- `index.html?activity=keys`: manual PK/required/CHECK/FK rules, optional FK enforcement, inner vs left join.
- `index.html?activity=normalization`: source restaurant example from raw lists through 3NF; Alice #1 and Alice #3 remain distinct people.
- `index.html?activity=queries`: real editable SQLite via locally vendored sql.js in a dedicated worker.
- `index.html?activity=transactions`: deterministic integer-cent transfer model with commit, application rollback, and a committed-reader view.
- `index.html?activity=etl`: editable JSON transformation and actual SQLite bound inserts in an atomic batch.

All data is synthetic teaching data. No database server or remote package CDN is contacted during an experiment. The database is in memory; leaving or reloading the activity resets it. Once the activity's local assets finish loading, its controls and queries require no internet connection. Serve the repository root rather than opening with `file://`, because worker and WebAssembly loading require normal browser asset access.

## Engine and dialect

The lecture examples use MySQL. The sandbox explicitly uses SQLite and lists differences in its sidebar. The actual engine version comes from `sqlite_version()`. Foreign-key enforcement is enabled for each seeded connection before any transaction. The sandbox displays the current setting if a student changes it. Seed integer IDs use `INT NOT NULL PRIMARY KEY` to require a supplied non-NULL ID, rather than SQLite's auto-assigning `INTEGER PRIMARY KEY` rowid alias.

Each SQL statement is parsed and executed by SQLite, not a regular-expression imitation. Output is limited to 200 rows per statement and 50 statements per run. Statements are finalized after use, including errors and capped output. Work runs in a Web Worker; Cancel or an eight-second timeout discards the worker's database. Reset data creates a fresh sample database. Earlier SQL statements can change the database before a later statement fails, as the UI explains.

The keys and transactions activities are conceptual models. The transfer application explicitly rolls back after a simulated failure; the page does not imply every SQL error automatically rolls back its whole transaction or demonstrate physical disk durability.

The ETL preview accepts at most 500 records. Default transformations trim names, normalize known state abbreviations/numeric state codes, and keep the first valid occurrence of each employee ID. Invalid rows are reported individually. Loading uses prepared parameter binding. A conflict with an already stored ID rolls back every row from that load.

## Verification

Run `node --test interactives/lecture-05/*.test.mjs`. `models.test.mjs` covers conceptual behavior; `sql-core.test.mjs` loads the same local WebAssembly engine used in the browser and tests real SQL, constraints, statement finalization, and transactional bound inserts.

The base visual styles are imported from the Lecture 04 activity stylesheet; this folder contains only Lecture 05 code and overrides. sql.js provenance and license are under `vendor/`.
