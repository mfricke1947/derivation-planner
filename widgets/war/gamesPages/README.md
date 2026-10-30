# gamesPages — game host pages from the 2025 production archive

Copied 2026-10-07 (by Claude, at Martin's request) from
`/Users/martinfricke/Documents/SoftOption/AaaSoftOptionArchive2025/Tome/StaticWrapperForSoftOption/sites/all/js/gamesWar/`.

These are the small iframe host pages that start the Games widget (`../games/`, the 2026 build in this project) in a particular game and notation
(`fTitle`, `fParser` in each page's `Parameters`). Only the pages were copied, not the archive's older compiled widget code.

- **Only change from the archive**: the two relative paths (`Games.css`, `games/games.nocache.js`) now start with `../`, because the pages live in this folder, not in the war root.
- **19 pages**: generic (`TruthTable`, `Satisfiable`, `Consistent`, `Invalid`, `MainConnective`, `PropTruth`), Gentzen variants (`*Gentzen`), `TruthTableGirle`,
  modal (`ModalTruthTable`, `ModalTruthTableGirle`: game `ModalTT`, with worlds and accessibility boxes), `Branches`, `BranchesHowson`, `GamesQuiz`.
- **Howson pages** (`ConsistentHowson`, `InvalidHowson`, `SatisfiableHowson`, `TruthTableHowson`) were copied unchanged into `../howson/`.
- **Not copied**: the archive's `bergmann/` pages (this project already has the same games as `../bergmann/Games*Bergmann.html`) and the archive's `Games.html`
  (the root `Games.html` here is different and was left alone).
- Games the widget supports but that the DeriverElectron Games tab does not offer yet: `ModalTT`, `Branches`, `GamesQuiz`.
- Checked 2026-10-07: all 23 pages load their game with no missing files.
