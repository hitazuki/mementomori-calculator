# MementoMori Calculator Project Rules

## Commands

- Run dev server: `npm run dev`
- Build app: `npm run build`
- Preview production: `npm run preview`
- Sync master data: `npm run sync:master`

## Project Shape

- Stack: Vue 3 + Vite + Pinia + ECharts, vanilla CSS.
- Components live in `src/views/` and `src/components/`.
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

## Task-Specific References

- Damage formula/scan/chart tasks: read `doc/damage/variables_glossary.md` first, then only the affected source/test files.
- Pack CE calculator tasks touching `PackCalculatorView.vue`, `packCalc.js`, item scoring, or CE output:
  - Read `doc/items/items-calc-formula.md` for formulas.
  - Read `doc/items/item-score-template.md` only when base item scores are involved.
  - Search `doc/items/items.md` or `doc/items/pack.md` only for the relevant item/pack rows; avoid full-file reads unless the task requires a broad audit.
- Ultra Sale purchase planner tasks: use the local `planner-multi-agent` skill and follow its on-demand reference routing.
- Localization/proper noun tasks:
  - Do not create secondary translations for in-game proper nouns.
  - Search local docs first for official names.
  - If not found, query `data/Master/TextResource*MB.json` for the exact official game text.
