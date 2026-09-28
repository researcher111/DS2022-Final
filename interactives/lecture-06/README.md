# Lecture 06 NoSQL activities

Serve the repository root with `npm run serve`, then open this folder’s `index.html`. Five independent links are available:

- `index.html?activity=json`: strict JSON parser, clickable hierarchy, typed values, and explicit root/field/array-index paths.
- `index.html?activity=modeling`: embedded author copies versus a shared author reference; review storage and retention controls.
- `index.html?activity=documents`: Mongo-style JSON filter and CRUD simulator; no database server or JavaScript evaluation.
- `index.html?activity=graph`: bookstore breadth-first search with selectable endpoints, directed/undirected traversal, and a removable relationship.
- `index.html?activity=replication`: single-writer asynchronous replication with two or three local copies, stepped delivery, and partitions.

Every page offers **Reset activity** and **Copy activity link**, course/slide/guide navigation, labeled controls, visible focus, and mobile layouts. The common visual styles are imported from `../lecture-04/lab.css`; these activities do not modify the shared stylesheet. All runtime assets are local. After they load, no network connection is needed to use the activities. Documentation links are optional external navigation. Reloading or leaving the page discards its in-memory state.

## Scope and data

The JSON parser uses `JSON.parse`, not an imitation of its syntax. It accepts any JSON root type. The inspector path grammar supports `$`, `.identifier`, `[nonnegative integer]`, and `["JSON-quoted key"]` only; it is not a full JSONPath engine. Array indices start at zero and object-key lookup never follows the JavaScript prototype chain. Bounds are 40,000 input characters, 400 values, and 12 nesting levels. Numbers use finite JavaScript numbers, which can lose precision for large integers. Duplicate object keys retain their last value, so the UI advises avoiding duplicate keys.

The bookstore design compares **copying the same author inside multiple books** with keeping one author document referenced by the books. This is distinct from embedding a biography inside its single owning author. Both books share Jane Austen, using readable string IDs. Book titles/authors are real; price, availability, reviews, biography-edit examples, and operational data are illustrative. Embedded review history grows a book; referenced review history grows a separate collection. Retaining only the latest three explicitly discards older history. The displayed size is serialized UTF-8 JSON, not BSON. Lookup counts describe a simple application plan, not guaranteed network round trips or performance.

The document seed and insert example use `published_year`, matching the lecture and downloadable seed. This activity embeds an `author` object for nested-path exercises; the downloadable MongoDB example uses `author_ids` references as a different design.

The document simulator supports `find`, `insertOne`, `updateOne` with `$set`, and `deleteOne`. Filters support scalar equality, numeric `$gt`/`$gte`/`$lt`/`$lte`, `$in` with scalar choices, dotted object fields, and implicit AND across fields. Equality to `null` also matches missing fields. Numeric comparisons do not coerce strings. It deliberately excludes implicit array-element matching, array traversal, embedded-document equality, regular expressions, logical operators, upserts, and other update operators. Stored arrays are permitted but are not queried with scalar membership semantics. The simulator requires an explicit unique string `_id`; MongoDB also supports other BSON ID types and automatic ObjectId generation. Its field-name restrictions and 50-document cap are teaching limits. Validation failures leave the collection unchanged. “One” operations use the first stored match; use an `_id` filter to select a specific document.

The graph uses fictional readers, books, and authors. Breadth-first search returns a minimum-hop path in an unweighted graph. Turning off directed traversal follows either endpoint without changing stored relationship direction. Fixed neighbor order makes repeated runs deterministic. The frontier and visit log expose actual search steps.

Replication has exactly one primary A, local reads, immediate acknowledgment at A, and monotonic primary-assigned revisions. There is no failover, election, quorum, multi-writer conflict resolution, or physical durability model. A–B and A–C can be blocked separately. Writes enqueue messages; delivery is manual. Older revisions cannot overwrite newer ones. Convergence requires finite writes, recovered communication, and delivery of the newest updates. This is **not** MongoDB’s replication protocol or a complete CAP demonstration, and does not claim that NoSQL systems lack ACID transactions.

## Model API

`models.mjs` exports pure operations:

- `parseJSON`, `jsonType`, `pathLabel`, `parseInspectorPath`, `inspectJSON`, `jsonNodes`, `JSON_SAMPLE`.
- `createBookstore`, `changeAuthor`, `addBookReviews`, `bookstoreView`.
- `DOCUMENT_SEED`, `createDocuments`, `findDocuments`, `documentOperation`.
- `GRAPH_NODES`, `GRAPH_EDGES`, `shortestPath`.
- `createReplication`, `replicationAction`, `replicationStatus`.

Returned model states are separate from their input states. Operations reject unsupported inputs and enforce finite classroom bounds. User strings are escaped before HTML rendering; no user-supplied JavaScript, Mongo shell code, or arbitrary expression is evaluated.

## Verification

Use Node 20 or newer:

```sh
node --test interactives/lecture-06/models.test.mjs
```

Tests exercise JSON types/path grammar and bounds, missing versus null, prototype-safe access, shared-data anomalies, review growth/retention, CRUD results and error atomicity, numeric types and nested filters, deterministic minimum-hop paths, stale reads, partitions, recovery, rejection of secondary writes, and ignoring old revisions.

Primary references are linked inside the activities. The lecture guide provides the full set of documentation and actual MongoDB/PyMongo examples.
