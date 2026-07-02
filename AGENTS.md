# MementoMori Calculator Project Rules

## Commands

- Run dev server: `npm run dev`
- Build app: `npm run build`
- Preview production: `npm run preview`
- Sync master data: `npm run sync:master`

## Dev Server Coordination

- The shared dev server should normally be the first Vite instance on port 5173.
- Before starting `npm run dev`, check whether `127.0.0.1:5173` is already listening. If it is, reuse `http://127.0.0.1:5173/mementomori-calculator/` instead of starting another server.
- Do not intentionally start a second Vite server on 5174+ for ordinary verification; it fragments agent/browser state. Only use another port when the user explicitly asks for an isolated server.

## Project Shape

- Stack: Vue 3 + Vite + Pinia + ECharts, vanilla CSS.
- Components live in `src/views/` and `src/components/`.
- Pack calculator UI components live in `src/components/pack/`; related view-state composables live in `src/composables/pack/`.
- Global CSS is split under `src/styles/`; `src/style.css` is only the import aggregator used by `index.html`.
- Shared state lives in `src/store/calculator.js`.
- Prefer existing engine/helper patterns before adding new abstractions.

## Git Commits

- Use Conventional Commits: `type(scope): summary`.
- Common types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`.
- Keep the summary concise, imperative, and in English when possible.

## Context Budget Rules

- Load only the files required by the current task.
- Prefer `rg`/targeted scripts over reading large docs or JSON files in full.
- Do not read `data/Master/*.json` wholesale. Query the specific id/name/key instead.
- For large generated constants such as `src/constants/ultraSalePacks.json` or `src/constants/allPacks.json`, inspect targeted slices only.

## Encoding / Chinese Text

- Project source and docs should be treated as UTF-8. Chinese or emoji text that looks like mojibake in PowerShell output is usually a terminal decoding/display issue, not file corruption.
- Do not spend time repeatedly probing encodings when a UTF-8 read/build works. Prefer targeted UTF-8 checks such as `node -e "const fs=require('fs'); const s=fs.readFileSync('path','utf8'); console.log((s.match(/\uFFFD/g)||[]).length)"` only when corruption is relevant to the task.
- Do not rewrite Chinese, Japanese, Korean, or emoji text just to “fix” garbled terminal display. Only change text when the actual UTF-8 file content is wrong or the user asks for wording/localization changes.
- If terminal readability matters, use targeted `rg`/line reads and rely on file paths, keys, and tests/build output rather than full-file PowerShell dumps of Chinese-heavy files.

## Task-Specific References

- Damage formula/scan/chart tasks: read `doc/damage/variables_glossary.md` first, then only the affected source/test files.
- Pack CE calculator tasks touching `PackCalculatorView.vue`, `packCalc.js`, item scoring, or CE output:
  - Read `doc/items/items-calc-formula.md` for formulas.
  - Read `doc/items/item-score-template.md` only when base item scores are involved.
  - Search `doc/items/items.md` or `doc/items/pack.md` only for the relevant item/pack rows; avoid full-file reads unless the task requires a broad audit.
  - For page assembly or tab wiring, inspect `src/views/PackCalculatorView.vue`.
  - For score panel UI/state, inspect `src/components/pack/PackScorePanel.vue` and `src/composables/pack/usePackScores.js`.
  - For pack query filters/table/cards, inspect `src/components/pack/PackQueryResults.vue` and `src/composables/pack/usePackQuery.js`.
  - For planner UI controls/summary/step table, inspect `src/components/pack/PackPlannerControls.vue`, `src/components/pack/PackPlannerSummary.vue`, `src/components/pack/PackPlannerStepTable.vue`, and `src/composables/pack/usePackPlannerView.js`.
  - For shared pack display formatting, inspect `src/composables/pack/usePackDisplay.js`.
- Ultra Sale purchase planner tasks: use the local `planner-multi-agent` skill and follow its on-demand reference routing.
  - `src/engine/ultraSalePlanner.js` is stable planner engine code. Do not split or refactor it for structure-only reasons; inspect or edit it only for planner behavior changes.
- Global style tasks:
  - Theme/reset/base layout: `src/styles/base.css` and `src/styles/layout.css`.
  - Forms/buttons/tags/stats: `src/styles/controls.css`.
  - Charts/tables/mobile cards/modals/responsive behavior: inspect the matching file in `src/styles/` rather than opening all CSS.
- Localization/proper noun tasks:
  - Do not create secondary translations for in-game proper nouns.
  - Search local docs first for official names.
  - If not found, query `data/Master/TextResource*MB.json` for the exact official game text.
