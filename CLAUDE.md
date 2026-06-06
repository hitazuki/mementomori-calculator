# MementoMori Calculator Project Rules (CLAUDE.md)

This file contains the guidelines and references for Claude Code.

## 🛠 Commands
* **Run Dev Server**: `npm run dev`
* **Build App**: `npm run build`
* **Preview Production**: `npm run preview`
* **Sync Master Data**: `npm run sync:master`

## 📏 Coding Style & Conventions
* **Tech Stack**: Vue 3 + Vite + Pinia + ECharts (Gothic Dark Gold theme, Vanilla CSS)
* **Components**: Single File Components (SFC) in `src/views/` and `src/components/`
* **State Management**: Pinia store in [calculator.js](./src/store/calculator.js)

---

## 📐 Damage Calculation Logic Pointer
* **IMPORTANT**: When implementing, modifying, or testing the damage calculation engine, formulas, scanning views, or chart/table output data, you **must** read and strictly follow the definitions and formulas in [variables_glossary.md](./doc/damage/variables_glossary.md).

## 💰 Pack Cost-Efficiency (CE) Calculation

* **IMPORTANT**: When implementing, modifying, or testing the pack CE calculator (`PackCalculatorView.vue`, `packCalc.js`), you **must** reference:
  * [items-calc-formula.md](./doc/items/items-calc-formula.md) — Scoring formulas, homogeneous item conversion rules, CE calculation logic
  * [item-score-template.md](./doc/items/item-score-template.md) — Base item scores (user-editable, synced to `src/constants/itemScores.json`)
  * [items.md](./doc/items/items.md) — Full item index with multi-language names and icon files
  * [pack.md](./doc/items/pack.md) — Treasure chest / bundle data from Master files

## 📖 Game Localization
* **No Secondary Translation**: Never translate in-game proper nouns (packs, items, mechanics) yourself. 
  1. **Check Docs First**: Look up existing official translations in local documentation (e.g., `doc/items/items.md`).
  2. **Fallback to Game Text**: If not found, write a script to search the `data/Master/TextResource*MB.json` files for the official text and use that exact string.
