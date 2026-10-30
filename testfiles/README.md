# Test files

Real `.lgc` files used by the tests in `../tests/`. **Copies** — the app's tests only read them (they save to a temp
folder), but make your own copies for hand testing so these stay as they are.

| File | What it is / why it is here |
|---|---|
| `HalfFinished.lgc` | Saved by the CheerpJ Java app: Bergmann notation, a part-finished **proof** (`1 F⊃G Ass, 2 F Ass, 3 G ⊃E 1,2, 4 H Ass (subproof), 5 G∧H &I 3,4`, goal `7 F∧G` still to prove), a part-finished **truth tree** (two `∼&D` branches, `⊃D` splits) and a **drawing** with every item type (individuals n,a,b,c; property A; function g; identity q; relation R). The main Phase 2/3 sample. |
| `Ex6.lgc` | An exercise file from the older obfuscated build: its (empty) proof is stored as `us.softoption.proofs.bG`, which the current Java app cannot even decode. Starting point for the Ex6 scenario below. |
| `Ex6Interpretation.lgc` | `Ex6.lgc` + a drawing item, saved by Electron **before the 2026-10-01 fix**: the part-proof that was also built is missing from it (the bug). Kept as a record; do not "fix" it. |
| `Ex6InterpretationFromCheerpJ.lgc` | The same work saved by CheerpJ: has the part-proof (premises `F⊃(∼G⊃H)`, `F⊃∼G`, `F`; goal `H∧F`). The expected result. |
| `Identity3.lgc` | A drawing with identity/function items, plus a tree. |
| `PropExBergmann6Test2.lgc` | An obfuscated-section exercise (`proofs.bG`) that also has a tree and a drawing item. |

Other samples (not copied): the 25 exercise files linked at the bottom of https://softoption.us/node/709, and
`Deriver20/ExercisesAndDocumentation/` (30 files; 29 of them use the obfuscated `proofs.bG` proof section).
