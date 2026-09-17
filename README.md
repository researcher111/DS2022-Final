# DS 2022 visual lectures

Browser-based lectures for **Systems I: Introduction to Computing**, with concise animated slides, handwriting tools, presenter notes, and separate student activities.

## Open the course

- [Course home](https://researcher111.github.io/DS2022-Final/)
- [Lecture 04: Scripting](https://researcher111.github.io/DS2022-Final/slides/lecture-04.html)
- [Student interactive activities](https://researcher111.github.io/DS2022-Final/interactives/lecture-04/index.html)
- [Lecture companion and code](https://researcher111.github.io/DS2022-Final/lectures/lecture-04/index.html)
- [Printable teaching guide](https://researcher111.github.io/DS2022-Final/slides/lecture-04.html?guide=1)

Only the uploaded scripting lecture is included. Its source PowerPoint contains both Bash and Python class sessions. The adaptation covers both. Add later lectures individually.

## Presenting

Use landscape orientation. Right arrow or Space advances one build, then the next slide. Page Down jumps to the next slide. Press **O** for the overview, **N** for a separate presenter window, **F** for full screen, and **?** for all controls.

Press **D** for the pen, **H** for the highlighter, **E** for the stroke eraser, or **L** for the laser pointer. **U** undoes the previous ink action, including clear. **C** clears only the current slide. Escape closes drawing tools. Writing disables swipe navigation; use the arrow buttons instead.

Annotations save per slide in this browser's local storage. They are not committed to GitHub and do not sync between devices. Presenter/audience windows share live annotations when opened from the same browser on the same device. Device palm rejection varies. If a tablet mirrors its entire screen, switching to the presenter window also shows notes to the audience.

The ↗ toolbar link opens the current topic's activity, or the activity gallery when no specific activity applies. Student activity URLs are independent of slide navigation. Each activity also has a copy-link control. Activities are classroom simulations, not real Bash or Python runtimes.

## Direct student links

| Activity | Link |
| --- | --- |
| Pipelines and ETL | [Open](https://researcher111.github.io/DS2022-Final/interactives/lecture-04/index.html?activity=pipeline) |
| PATH and environments | [Open](https://researcher111.github.io/DS2022-Final/interactives/lecture-04/index.html?activity=path) |
| Output streams | [Open](https://researcher111.github.io/DS2022-Final/interactives/lecture-04/index.html?activity=streams) |
| Control flow | [Open](https://researcher111.github.io/DS2022-Final/interactives/lecture-04/index.html?activity=control) |
| Virtual environment setup | [Open](https://researcher111.github.io/DS2022-Final/interactives/lecture-04/index.html?activity=venv) |
| Dependency conflicts | [Open](https://researcher111.github.io/DS2022-Final/interactives/lecture-04/index.html?activity=environments) |

## Run locally

No build or package install is required. From this directory:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/`. Serve over HTTP for the interactive ES modules and presenter synchronization. All runtime assets are local; reading/source links point to external documentation.

With Node 20 or newer:

```sh
npm test
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

- `slides/decks/lecture-04.js`: lecture content, notes, and editable diagram builds.
- `slides/_shared/`: SVG drawing helpers, player, styling, and ink support.
- `interactives/lecture-04/`: standalone activities and their model tests.
- `lectures/lecture-04/index.html`: student companion and sources.
- `examples/lecture-04/`: downloadable Bash/Python examples and synthetic CSV.
- `scripts/validate_slides.mjs`: content and link checks.

Keep each build to **45 visible words maximum**, counting titles, code, and diagram labels. Definitions have an **18-word maximum**. Put full explanations, prediction questions, answers, and caveats in notes. Leave substantial empty space for handwriting and preserve stable scene IDs so existing annotations remain attached correctly. See [AUTHORING.md](AUTHORING.md).

## Source and attribution

Lecture content adapts `04-DS2022-Scripting.pptx`, supplied by Daniel Graham, with instructors Daniel Graham and Karsten Siller. The original PowerPoint remains outside this repository. Source slide references appear in the notes. Examples use corrected ASCII syntax and documented Bash/Python behavior. The companion links to official documentation for technical corrections. Assignment dates are identified as source-deck information; Canvas remains the course reference.

The slide player, drawing tools, diagram helpers, and visual styles are adapted from Daniel Graham's [AdvanceDatabase](https://github.com/researcher111/AdvanceDatabase) project, specifically the local `AdvanceDatabase-public/slides/_shared` files. DS 2022 uses its own annotation and presenter-channel namespaces, separate student activity links, and lecture-specific timing.
