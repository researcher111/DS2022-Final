# DS 2022 visual lectures

Browser-based lectures for **Systems I: Introduction to Computing**, with concise animated slides, handwriting tools, presenter notes, and separate student activities.

## Open the course

- [Course home](https://researcher111.github.io/DS2022-Final/)
- [Lecture 04: Scripting](https://researcher111.github.io/DS2022-Final/slides/lecture-04.html)
- [Student interactive activities](https://researcher111.github.io/DS2022-Final/interactives/lecture-04/index.html)
- [Lecture companion and code](https://researcher111.github.io/DS2022-Final/lectures/lecture-04/index.html)
- [Printable teaching guide](https://researcher111.github.io/DS2022-Final/slides/lecture-04.html?guide=1)

The uploaded Scripting, SQL, and NoSQL lectures are included. Scripting and SQL cover the class sessions in their source PowerPoints. NoSQL follows a focused 75-minute bookstore story, with additional source topics preserved in its companion. Add later lectures individually.

- [Lecture 05: SQL](https://researcher111.github.io/DS2022-Final/slides/lecture-05.html)
- [SQL interactive activities](https://researcher111.github.io/DS2022-Final/interactives/lecture-05/index.html)
- [SQL companion and examples](https://researcher111.github.io/DS2022-Final/lectures/lecture-05/index.html)
- [SQL teaching guide](https://researcher111.github.io/DS2022-Final/slides/lecture-05.html?guide=1)

- [Lecture 06: NoSQL](https://researcher111.github.io/DS2022-Final/slides/lecture-06.html)
- [NoSQL interactive activities](https://researcher111.github.io/DS2022-Final/interactives/lecture-06/index.html)
- [NoSQL companion and MongoDB examples](https://researcher111.github.io/DS2022-Final/lectures/lecture-06/index.html)
- [NoSQL teaching guide](https://researcher111.github.io/DS2022-Final/slides/lecture-06.html?guide=1)

## NoSQL: one 75-minute bookstore story

Lecture 06 uses 27 scenes to connect document shape, queries, shared author information, and update guarantees.

| Time | Live focus |
| --- | --- |
| 0–24 minutes | Brief file-format overview; documents, arrays, identifiers, collections, and validation |
| 24–38 minutes | Find and update, including the 5-minute **Find books** activity |
| 38–53 minutes | Embedding and references, including the 5-minute **Embed or reference** activity |
| 53–75 minutes | Atomicity and replication, including the 4-minute **Let a copy catch up** activity and the exit question |

Use the three live activities in that order with their prepared tasks and **Explore more** closed. JSON and graph activities are optional practice. The [NoSQL companion](https://researcher111.github.io/DS2022-Final/lectures/lecture-06/index.html) separates live essentials from extended format comparisons, other database models, specialized queries, MongoDB setup and code, WORM, and original course logistics. September 29 and October 1, 2026 are the source deck’s dates; the live route is one 75-minute lecture.

The live catalog queries an embedded `author.name`. The modeling activity’s shared-author alternative uses one `author_id`; downloadable MongoDB examples use an `author_ids` array to allow multiple authors. These are distinct stored shapes, so their queries must change accordingly. References do not automatically create embedded fields or enforce foreign keys.

Exit question: **Emma still shows Jane Austen’s old biography after an update. Is that necessarily replication lag? Give one other explanation.** A missed embedded copy and a delayed replica are different possible causes.

## Presenting

Use landscape orientation. Right arrow or Space advances one build, then the next slide. Page Down jumps to the next slide. Press **O** for the overview, **N** for a separate presenter window, **F** for full screen, and **?** for all controls.

Press **D** for the pen, **H** for the highlighter, **E** for the stroke eraser, or **L** for the laser pointer. **U** undoes the previous ink action, including clear. **C** clears only the current slide. Escape closes drawing tools. Writing disables swipe navigation; use the arrow buttons instead.

Annotations save per slide in this browser's local storage. They are not committed to GitHub and do not sync between devices. Presenter/audience windows share live annotations when opened from the same browser on the same device. Device palm rejection varies. If a tablet mirrors its entire screen, switching to the presenter window also shows notes to the audience.

The ↗ toolbar link opens the current topic's activity, or the activity gallery when no specific activity applies. Student activity URLs are independent of slide navigation. Each activity also has a copy-link control. Scripting and concept activities are classroom simulations. The SQL query playground runs real SQLite locally in a browser worker. It does not connect to MySQL or a cloud database; resetting the activity restores its synthetic data.

Each activity starts with one short task and a prepared example. **Explore more** reveals extra controls and explanations without resetting the current experiment. Use the initial task during class, then open the extra options for follow-up practice.

## Direct student links

| Activity | Link |
| --- | --- |
| Pipelines and ETL | [Open](https://researcher111.github.io/DS2022-Final/interactives/lecture-04/index.html?activity=pipeline) |
| PATH and environments | [Open](https://researcher111.github.io/DS2022-Final/interactives/lecture-04/index.html?activity=path) |
| Output streams | [Open](https://researcher111.github.io/DS2022-Final/interactives/lecture-04/index.html?activity=streams) |
| Control flow | [Open](https://researcher111.github.io/DS2022-Final/interactives/lecture-04/index.html?activity=control) |
| Virtual environment setup | [Open](https://researcher111.github.io/DS2022-Final/interactives/lecture-04/index.html?activity=venv) |
| Dependency conflicts | [Open](https://researcher111.github.io/DS2022-Final/interactives/lecture-04/index.html?activity=environments) |

| SQL activity | Link |
| --- | --- |
| Keys and relationships | [Open](https://researcher111.github.io/DS2022-Final/interactives/lecture-05/index.html?activity=keys) |
| Restaurant normalization | [Open](https://researcher111.github.io/DS2022-Final/interactives/lecture-05/index.html?activity=normalization) |
| SQL query playground | [Open](https://researcher111.github.io/DS2022-Final/interactives/lecture-05/index.html?activity=queries) |
| Transactions | [Open](https://researcher111.github.io/DS2022-Final/interactives/lecture-05/index.html?activity=transactions) |
| JSON to SQL ETL | [Open](https://researcher111.github.io/DS2022-Final/interactives/lecture-05/index.html?activity=etl) |

| NoSQL activity | Link |
| --- | --- |
| Live 1 · Find books | [Open](https://researcher111.github.io/DS2022-Final/interactives/lecture-06/index.html?activity=documents) |
| Live 2 · Embedding and references | [Open](https://researcher111.github.io/DS2022-Final/interactives/lecture-06/index.html?activity=modeling) |
| Live 3 · Replication lag | [Open](https://researcher111.github.io/DS2022-Final/interactives/lecture-06/index.html?activity=replication) |
| Optional · JSON structure | [Open](https://researcher111.github.io/DS2022-Final/interactives/lecture-06/index.html?activity=json) |
| Optional · Graph traversal | [Open](https://researcher111.github.io/DS2022-Final/interactives/lecture-06/index.html?activity=graph) |

The NoSQL activities are local simulations with explicit limits. The JSON activity uses the browser's JSON parser; the document activity models a small MongoDB query subset and does not run MongoDB. Downloadable mongosh and PyMongo examples connect to a deployment only when students run them with their own connection settings.

## Run locally

No build or package install is required. From this directory:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/`. Serve over HTTP for the interactive ES modules and presenter synchronization. All runtime assets are local; reading/source links point to external documentation.

With Node 20 or newer:

```sh
npm test
# Downloadable Python ETL example:
python3 -m unittest discover -s examples/lecture-05 -p 'test_*.py'
```

This validates slide contracts, visible word limits, diagram bounds and local links, then tests the interactive models. Browser inspection is also needed after visual changes.

## Update and publish

GitHub Pages serves the root of `main`. After reviewing changes:

```sh
git add .
git commit -m "Update lecture 04"
git push
```

GitHub Pages publishes the new commit automatically. Check the repository's Actions or Settings → Pages for deployment status.

## Files and authoring

- `slides/decks/lecture-NN.js`: lecture content, notes, and editable diagram builds.
- `slides/_shared/`: SVG drawing helpers, player, styling, and ink support.
- `interactives/lecture-NN/`: standalone activities and their model tests. Lecture 05 vendors sql.js with its license for offline SQLite execution.
- `lectures/lecture-NN/index.html`: student companions and sources.
- `examples/lecture-NN/`: downloadable Bash, Python, SQL and synthetic data examples.
- `scripts/validate_slides.mjs`: content and link checks.

Keep each build to **45 visible words maximum**, counting titles, code, and diagram labels. Definitions have an **18-word maximum**. Put full explanations, prediction questions, answers, and caveats in notes. Leave substantial empty space for handwriting and preserve stable scene IDs so existing annotations remain attached correctly. See [AUTHORING.md](AUTHORING.md).

## Source and attribution

Lecture content adapts `04-DS2022-Scripting.pptx`, `05-DS2022-SQL.pptx`, and `06-DS2022-NoSQL.pptx`, supplied by Daniel Graham, with instructors Daniel Graham and Karsten Siller. The original PowerPoints remain outside this repository. Source slide references appear in the notes, with additional NoSQL topics retained in companion reference sections. Examples use corrected ASCII syntax and documented Bash/Python/SQL/NoSQL behavior. The SQL lecture distinguishes MySQL from the browser’s SQLite runtime. The NoSQL lecture and companion distinguish flexible schemas from validation, wide-column from analytical column storage, BSON from JSON, and transaction guarantees from replica consistency. The companions link to official documentation for technical corrections. Assignment dates are identified as source-deck information; Canvas remains the course reference, including the NoSQL source deck's conflicting Lab 05 labels.

The slide player, drawing tools, diagram helpers, and visual styles are adapted from Daniel Graham's [AdvanceDatabase](https://github.com/researcher111/AdvanceDatabase) project, specifically the local `AdvanceDatabase-public/slides/_shared` files. DS 2022 uses its own annotation and presenter-channel namespaces, separate student activity links, and lecture-specific timing.
