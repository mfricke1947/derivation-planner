# Tests

End-to-end checks of Save/Open through the **real File menu** (the native file dialogs are stubbed) against the app's
live `war/` build. Run from the `DeriverElectron` folder (each takes about a minute; no window appears):

```
env -u ELECTRON_RUN_AS_NODE node_modules/.bin/electron tests/e2e-halffinished.js
env -u ELECTRON_RUN_AS_NODE node_modules/.bin/electron tests/e2e-ex6.js
```

(`-u ELECTRON_RUN_AS_NODE` is needed when launched from VS Code, which sets that variable.) Each prints `STEP …` lines.
Files they save go to a temporary folder, never to `testfiles/`.

## e2e-halffinished.js
Opens `testfiles/HalfFinished.lgc`; expect: the tree in the widget identical to the file's; an unchanged Save As leaves
everything except the Journal element identical; editing a tree node sets the dirty dot ("•" in the title), Save clears it;
the saved file decodes with the **real Java app classes** (tree nodes linked, proof intact, no leftover statements);
reopening shows the edit; New gives an empty tree whose saved file decodes.

## e2e-ex6.js
The scenario that exposed the `bG` bug: open `Ex6.lgc`; an unchanged save keeps the old `proofs.bG` section as it was;
then build the part-proof and a drawing item, save — expect **no warnings**, a real `proofs.TProofTableModel` and no
`bG` in the saved file, a clean Java decode (`1. F⊃(∼G⊃H) … 5. H∧F`), and the proof showing again on reopen.

## e2e-symbolize.js
The Symbolize tab. Uses a throwaway settings folder, so it never reads or changes your real Preferences. Expect: four tabs for the
default notation; `symbolizeSupportedFor` false for barwise/girle/howson/stegeman and true for default/bergmann; the shared Journal
shows in Symbolize as plain text; visiting Symbolize without editing leaves the other tabs' formatting alone (bold stays bold);
**To Symbols** on a selected sentence works and the changed text travels back to the other tabs; **Do Command** works
(`+ 1 2` becomes `3`; `write propositions` lists the vocabulary; an invalid command gives a message); Save/Open's Journal
bridge works while Symbolize is the active tab. Run it again with `PARSER=barwise` in front of the command: the Symbolize tab must be
absent (it prints "Symbolize tab is hidden for parser barwise").

## e2e-journal-height.js
The Journal on every tab runs down to the bottom of the window. Resizes the window to three heights and measures each of the four
tabs: expect "OK fills to bottom" (a 6px gap), or, in a window too short for it, "OK at minimum, page scrolls" (Journal 140px, never
squashed). Set `SHOTS=<folder>` to also save screenshots.

## java/
`checkproof.js`, `checktree.js` decode a `.lgc` with the app's real classes through Nashorn (bundled with Java 8), which
is how the tests ask "does the Java program accept what Electron saved?":
`java -Djava.awt.headless=true -cp ../cheerpj/cheerpjProject/Deriver20FatV17.jar jdk.nashorn.tools.Shell tests/java/checkproof.js -- file.lgc`
Needs the Java 8 runtime (`java -version` → 1.8) and that jar.

Not covered here: whether the Java *GUI* displays a file correctly (open Electron-saved files in the CheerpJ app to check);
the checkers for drawings were written ad hoc earlier and are not saved.

- `e2e-games.js` — optional Games tab: hidden by default; with `GAMES=1` (pref `gamesTab`) all five games render with the right
  instructions and the chooser switches game; screenshot written to the OS temp folder.
- `e2e-cleartree.js` — a cleared tree is cleared in the saved file (also `RELOAD=1`: app reloaded, tree widget never started).
- `e2e-author.js` — authoring tools: absent by default; with `AUTHOR=1` the toolbar sits between palette and Journal on Proofs/Trees/Interpretations (none on Symbolize), formats the Journal, and the HTML-source window applies edits.
- `e2e-html.js` — open/save plain HTML pages (Open, Open from URL, Save, Save As .html/.lgc), scripts stripped, state cleared, head kept.
- `e2e-resetdrawing.js` — Reset Drawing returns to the opened file's drawing (and to empty after New).
- `e2e-print.js` — print page and PDF export of the Journal (name shown, scripts stripped, empty Journal -> message, real PDF).
- `e2e-writedrawing.js` — Interpretations "Write Drawing": button present, picture is self-contained SVG with the board, inserted at the end / after the caret's paragraph, survives Save/Open, prints.
- `e2e-tabs.js` — per-tab/Derive settings: tabs per notation and setting, dialog auto-setup, Wizard hiding, opening/saving with a tab off (env PREFS/DIALOG/DERIVE/OPEN).
- `prefs-setup.js` — the per-notation table in prefs.js (plain node: `node tests/prefs-setup.js`).
- `e2e-pages.js` — converted exercise pages (tools/pages-to-journal.js): both content kinds, Journal contents, notation notice, Start from selection, Save keeps the notation record (PARSER= env).
- `pages-to-journal.js` — the converter tool's folder handling, skips, ordering, --force (plain node).
- `seed.js` — shared helper: every test gets a throwaway settings folder with all four tabs on (so tests do not depend on the per-notation table or the user's settings; e2e-tabs is the exception).
