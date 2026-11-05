# Derivation Planner (Deriver)

A desktop application for teaching and learning logic: natural-deduction **proofs**, semantic **trees**, **interpretations** (drawing
models and reading off what is true in them), English-to-logic **symbolization**, and truth-table and related **games** — in several
textbook notations (Bergmann, Copi, Gentzen, Hausman, Herrick, Howson, Barwise, Girle, Stegeman and a default). Documents are
the familiar `.lgc` files of the Java-era Deriver and also plain HTML pages.

**Download and documentation:** https://softoption.us/node/887

* **Windows:** get it from the **[Microsoft Store](https://apps.microsoft.com/detail/9n3cfwbp80nz)** (recommended: signed by Microsoft, no security warnings, updates automatically).
  A direct installer is also on the [Releases](https://github.com/mfricke1947/derivation-planner/releases) page (unsigned, so Windows SmartScreen may ask you to confirm).
* **macOS** (Apple silicon and Intel): the signed and notarized disk image, from the download page or the Releases page.

Source code and release files are here on GitHub.

Author: Martin Frické — mfricke@arizona.edu. Licence: MIT (see `LICENSE`; third-party components in `THIRD-PARTY-NOTICES.md`).
How the installers are signed and how to verify them: [Releases and verification](RELEASES-AND-VERIFICATION.md).

## How it is built
The logic widgets are written in Java and compiled to JavaScript with GWT (a separate project); this repository holds the **Electron**
application around them: tabs, preferences, opening and saving the legacy `.lgc` format (journal, drawing, proofs and trees),
printing, and packaging. A snapshot of the compiled widgets is kept in `widgets/war`.

* `main.js` — Electron main process: serves the widgets on a random local port, menus, file open/save, preferences, printing.
* `shell.html` — the tab bar and the glue between tabs, the Journal and the widgets.
* `lgc.js`, `beans.js`, `interp.js`, `proofstate.js`, `treestate.js` — reading and writing `.lgc` (Java `XMLEncoder`) files.
* `pages/`, `vendor/` — the Symbolize and Games pages, and the bundled Symbolize widget.
* `tests/` — end-to-end tests that drive the real app; `testfiles/` — sample documents.

## Run from source
```
npm install
npm start
```
(`ELECTRON_RUN_AS_NODE` must not be set in your environment.)

## Build installers
```
node tools/stage-war.js            # copies widgets/war to build/war
npx electron-builder --mac         # or --win
```
The Windows installer is built by GitHub Actions (`.github/workflows/build.yml`) on every tagged release. The macOS build is signed
with a Developer ID certificate and notarized by hand.

## Acknowledgement
Derivation Planner was developed by Martin Frické, with software implementation, debugging and testing carried out with the assistance
of Claude Code (Anthropic), an AI coding assistant, under the author's direction. The author warmly thanks Claude and Anthropic.
