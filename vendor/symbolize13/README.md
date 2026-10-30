# Bundled widget: Symbolize (English <-> logic)

A **compiled GWT widget copied unchanged** into this project (not rebuilt), so the Stegeman project stays untouched.

- **Source:** `Deriver Programs/Deriver20/eclipseGitMaster/Symbolize13` (Eclipse GWT project, 52 Java files:
  `us.softoption.gwt.client.Symbolize13` plus the parser, `TEnglishToLogic`/`*EtoLRules` and a small Scheme interpreter `jscheme`).
- **Build copied from:** that project's `war/` (`symbolize13/` + `Symbolize13.css`), dated 2012. It is byte-for-byte what
  https://softoption.us/sites/all/js/symbolize13War/ serves (checked 2026-10-01: same loader, same file sizes), so it behaves as
  it does on the website. An old-style GWT build (`*.cache.html` permutations); it runs fine in Electron's Chromium.
- **Served** by `main.js` at `/vendor/symbolize13/...`; the start page is `pages/SymbolizeDefault.html` (loaded as the "Symbolize" tab).
- **Settings it reads** (the shared Preferences are injected into its `Parameters`): `fParser` — it handles `bergmann`, `copi`,
  `gentzen`, `hausman`, `herrick` and otherwise uses the default rules; `fInputText` (starting text); `fNoCommands` (hides
  "Do Command"). The Symbolize tab is hidden for parsers it does not support (barwise, girle, howson, stegeman).
- **Buttons:** To Symbols / To English act on the selected text in the Journal; Do Command evaluates the selected text as a
  Scheme expression (used to set up vocabulary) and writes "Scheme output: …" into the Journal.
- **Journal:** the widget itself only knows a plain text box. Since 2026-10-05 the Symbolize PAGE shows a rich-text Journal (like the other tabs) and
  keeps the widget's own text box off-screen as a plain-text copy: when a widget button is clicked, the page flattens the rich text into that box
  with the same selection, the widget runs (it reads the selection and replaces exactly that selection with its result), and the result is
  written back over the same selection in the rich text. See the script at the bottom of `pages/SymbolizeDefault.html`.
- **Not saved in files:** vocabulary set up with Do Command lives in memory only (a possible future addition: carry it in the
  saved document).
- To change the widget itself, edit/rebuild the source project above and replace these files.
