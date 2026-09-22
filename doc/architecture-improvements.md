# Architecture improvements

Scope: implement the architecture review in order while retaining the current stack and calculation behavior.

## Acceptance checklist

- [x] Async loading: last language selection wins; startup does not wait on master data; HTTP/shape errors, timeout and retry are visible on pack and mysterium pages.
- [x] Checks/tests: inspect resolved translation keys and placeholders; cover async races, retry, score propagation and browser navigation.
- [x] CI/types: independent push/PR validation; lint and incremental checked JavaScript contracts; reproducible install and production build.
- [x] Page responsibilities: extract weapon gacha analysis and chart responsibilities without changing formulas; verify representative interactions.
- [x] Navigation/state: consistent shareable URLs and back/forward; central view registration; validated/versioned score persistence and reset; explicit page cache policy preserving calculator input.
- [x] Resources/cache: lazy language bundles, measured build and browser loading; verify cache policy and record limits of performance measurements.

## Verification

Baseline: 281 Node tests passing; production entry 496.65 kB (160.05 kB gzip). No browser timing baseline was collected during the review.

Verified locally on 2026-09-22 using Node 24 and Playwright Chromium:

| Gate | Result |
| --- | --- |
| `npm ci --offline --no-audit --no-fund` | Clean lockfile install succeeds using the populated npm cache |
| `npm run lint` | JavaScript correctness and Vue essential checks pass |
| `npm run typecheck` | Seven selected infrastructure/engine modules pass strict checked-JavaScript contracts |
| `npm run build` | 292 Node tests, 1504 resolved translation keys in five languages, and production build pass |
| `E2E_PRODUCTION=1 npm run test:e2e` | 15 browser tests pass against production assets, including all 18 pages |
| Raid schema validator | 47 characters, 47 evidence records, five locales, zero warnings |
| `npm audit --json` | Zero reported vulnerabilities after compatible nanoid/postcss updates |
| Visual inspection | Weapon analysis desktop/mobile layout inspected; no document horizontal overflow at 550 px |

The production entry is 160.05 kB (57.68 kB gzip), down from 496.65 kB (160.05 kB gzip). This is entry JavaScript size, not total page transfer or an Internet loading-time benchmark. Browser requests confirm that nonselected UI language chunks are absent on first load, and selecting English again reuses its loaded module.

The cache regression test first reproduced four retained chart canvases after leaving the character gacha page. It now observes zero and verifies that charts reappear on return. This proves disposal of those ECharts resources, not a measurement of total browser heap usage.

## Maintenance conventions

- Node 24 is declared in `.nvmrc`, `package.json`, and all workflows. The independent validation workflow runs on PRs and non-main pushes; main deployment calls the same workflow and waits for it before publishing. Hosted GitHub Actions execution requires a subsequent push and was not performed as part of local validation.
- `npm run build` retains its existing test gate. Browser tests are separate; use `npm run test:e2e` for the shared dev server, or set `E2E_PRODUCTION=1` after building with port 5173 free. PowerShell: `$env:E2E_PRODUCTION='1'; npm run test:e2e`. `PLAYWRIGHT_CHANNEL=chrome` can use an installed Chrome for local checks; CI installs Playwright Chromium.
- Lint initially targets correctness, not a repository-wide unused-code/style cleanup. Parent-owned reactive form models permit nested field edits. Type checking is incremental, not a claim that every Vue component or engine is typed; extend `tsconfig.json` as modules acquire explicit contracts.
- UI translations are authored in the existing locale modules. `generate:ui-locales` resolves their spreads/assignments into five independent generated JSON bundles. Both dev/build generate them, and the Vite watcher regenerates them on locale source changes. Generated files are ignored; no external Master directory is needed.
- Weapon analysis state/display derivation lives in `useWeaponGachaAnalysis`, chart options in `useWeaponGachaCharts`, and chart markup in `WeaponGachaCharts`. The calculation algorithms remain in the existing engines.
- `VIEW_DEFINITIONS` registers page loaders and cache policy beside navigation metadata. URLs use `#viewId`, retaining `#characters/id`. Unknown routes fall back to home. Input-bearing pages retain state; home and serial-code pages remount. `ActiveChart` explicitly disposes inactive ECharts instances while retaining only small zoom/legend state.
- Score storage v3 contains validated numeric overrides only. Existing v2 scores migrate without importing stored names/batches; successful persistence removes the legacy key. Reset clears overrides. Storage failures preserve an in-memory working calculator. `derivedItemScores` shares one lazy derived computation across pages.

## Behavior-preserving cleanup

Resolved messages were compared before/after removing 66 shadowed locale properties and were identical. Raid changes are level A (direct reuse): remove Rustica S2's overwritten empty `hooks` property and rename the icon component's `slot` prop to `skillSlot` to distinguish it from deprecated Vue slot syntax. The existing nonempty hook, effect groups, timing, formulas and supported model boundary remain unchanged; focused coverage and the full raid regression/schema gates pass.

### Raid integration report

| Field | Result |
| --- | --- |
| Character | Rustica (113); skill icon prop naming applies to the detail UI |
| Reuse level | A |
| New generic mechanics | None |
| Reused mechanics | Existing `beforeDamage` status hook, unchanged |
| Explicitly ignored | No additions to existing ignored effects |
| Unconfirmed rules | No new rules or game-mechanic claims |
| Evidence record | Existing character records unchanged; overwritten empty property removed without changing its effective value |
| Modified raid files | `rustica.js`, `RaidSkillIcon.vue`, `RaidTableView.vue` |
| Validator | 47/47 records, zero warnings |
| Tests | Existing structured raid regression tests pass within the 292-test suite |
| Build | Pass |
| Effect on existing characters | No calculation changes |
| Documentation | This maintenance report; modeling guide and term reference require no semantic changes |
