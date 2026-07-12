---
name: raid-character-integration
description: Integrate, modify, diagnose, or review characters and reusable mechanics for the MementoMori raid multiplier table (讨伐拉表). Use for changes involving `doc/raid/*`, `src/constants/raid/characters/*`, `src/constants/raid/shared.js`, `src/engine/raid/*`, raid translations/configuration/UI, or raid character and mechanic tests. Do not use for unrelated Vue UI, damage calculator, pack CE, or Ultra Sale work.
---

# Raid Character Integration

Treat this skill as a repository workflow. Keep game evidence, modeling rules, declarative character data, generic mechanics, UI, and tests aligned. Do not duplicate the two raid rule documents inside this skill.

## Load Context

Always read:

- `doc/raid/skill-modeling-guide.md` for settlement semantics and model boundaries.
- `doc/raid/skill-term-reference.md` for supported fields and mechanics.
- The target file under `src/constants/raid/characters/` and its focused tests in `test/raidTableCalc.test.js`.
- Only the relevant parser/runtime code under `src/engine/raid/`.

Route by change:

- Character data or roster: inspect `src/constants/raid/characters/index.js`, the target character module, and `src/constants/raid/shared.js`. Keep `src/constants/raidTableCharacters.js` as the public compatibility facade.
- Mechanic semantics: inspect `src/engine/raid/mechanics.js`, then `compiler.js` for validation/compilation and `runtime.js` for execution.
- Display/config: inspect `src/views/RaidTableView.vue` and `src/locales/raid.js`.
- Official names or MB evidence: query exact IDs/keys in `data/Master/*MB.json`; never read large master files wholesale.
- Combat logs: verify `AttackUnitGuid`, `TargetUnitGuid`, `GranterGuid`, and action phase. Do not infer the caster from nested `SubSkillResult` alone.

Use `git log`/`git show` when recent refactors may invalidate a requested layout. Preserve the current module boundaries instead of recreating an older proposed architecture.

## Build an Evidence Record

Before changing behavior, separate facts into game data, combat-log confirmation, project convention, and unresolved inference. For a substantial new character, copy `references/evidence-template.md` and `references/record-template.json` to `doc/raid/characters/<id>-<slug>/`. `record.json` is the canonical machine-validated coverage record; `evidence.md` is the readable rationale. Keep unresolved items in both records rather than presenting them as confirmed.

Describe every active skill, passive, exclusive-weapon effect, and EffectGroup. Record damage steps, target choice, trigger phase, duration clock, refresh/stack rules, history/counter read and update points, probability scenario, and intentionally ignored behavior.

Use `references/character-spec-template.md` to draft the normalized implementation before editing code. Every described effect must become implemented, explicitly ignored through `ignoredKeys`, or explicitly unresolved.

## Classify the Change

Choose exactly one level before implementation:

- **A — direct reuse:** current fields express the rule exactly. Change character data, translations, focused tests, and evidence/docs as needed.
- **B — composed reuse:** several registered mechanisms express the rule without engine changes. Prove that their phases, snapshots, duration, and refresh behavior match.
- **C — generic mechanism extension:** current fields cannot express the rule, but the capability is reusable. Define its neutral name, schema, trigger/read/update timing, compiler rejection behavior, runtime handler, UI representation, docs, and isolated tests before adding the character.
- **D — model-boundary extension:** the rule needs HP changes, death/revival, enemy actions, summons, incoming-hit/retaliation flow, dynamic team size, stochastic expectation, defense, or penetration. Update and review the model boundary before character implementation.

Do not introduce a character-named mechanic for C or smuggle D behavior into character data. A second use of a formerly special mechanism is the signal to generalize it.

## Implement in the Current Architecture

Apply changes in this order when applicable:

1. Shared constructors/constants and the generic mechanics registry.
2. Compiler validation and runtime execution.
3. One declarative character module and `characters/index.js` wiring.
4. Raid configuration/detail UI.
5. All five locale dictionaries in `src/locales/raid.js`.
6. Focused mechanic/character tests and golden regression.
7. Evidence, term reference, and modeling guide updates.

Keep character modules declarative. Small shared constructors such as `hook`, `statusEffect`, and `bossStatusEffect` belong in `src/constants/raid/shared.js`; resolver/selector/condition/effect functions belong in `src/engine/raid/mechanics.js`. Never branch in compiler/runtime on character ID or name.

Preserve these invariants:

- Model each EffectGroup separately, including removable buffs with `modifiers: []` that only affect buff count.
- Use `duration` for actor target-action duration and `durationRounds` for Boss round duration.
- Use registered `type`, target selector, condition, value resolver, modifier channel, trigger, and event semantics.
- Put dynamic conditions in executable `condition` data; `conditionKey` is display metadata only.
- Apply after-hit/after-critical effects after the current hit so they first affect the next hit.
- Read skill history/counters before the current activation increment unless evidence proves otherwise.
- Preserve unsupported described behavior in `ignoredKeys` with translations.
- Use official in-game proper nouns from local docs or exact TextResource records; do not invent secondary translations.

If code and docs disagree, stop the disputed behavior change, record the conflict, and determine whether the code, docs, or evidence is stale.

## Validate

Run the deterministic schema check from the repository root:

```bash
node .codex/skills/raid-character-integration/scripts/validate-raid-characters.mjs
```

Then run focused tests during iteration and the full gates before completion:

```bash
npm test
npm run build
```

Tests must assert structured action records, not only totals. Cover the affected rotation, cooldown before/after, per-hit state snapshots, effect timing, EffectGroup buff counts, selectors/ties, duration consumption, refresh/stack expiry, history/counter ordering, probability on/off, guaranteed-critical on/off when relevant, single-dummy handling of multi-target skills, symbolic terms, and the default-lineup golden result.

Review for character-specific engine branches, unregistered values, timing reuse mistakes, incomplete `ignoredKeys`, missing locale keys, and unintended existing-character changes. Fix findings and rerun the relevant gates.

## Report

Use `references/integration-report-template.md`. Report failures honestly as introduced, pre-existing, or environmental. Completion requires every described effect to be implemented, ignored, or unresolved; all new generic fields to have compile-time validation, execution, display, tests, and docs; and test/build results to be stated.

Use subagents only when the user explicitly requests delegation or parallel agent work. Keep the primary agent as the sole writer; delegate bounded evidence, reuse, test-gap, or doc-consistency reviews only.
