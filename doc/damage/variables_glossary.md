# MementoMori Calculator Variable Glossary & Formulas Reference

This file contains the detailed mathematical and logical definitions for MementoMori combat damage calculations. Refer to this file when working on the calculation engine, charts, tables, or views that present damage breakdowns.

---

## 1. Core Damage Formulas (Double-Path Multiplicative)
The game uses a **two-path multiplicative defense reduction system** (防御路 and 物魔路) rather than a simple flat subtraction or single percentage calculation.

### Formula Structure
1. **Defense Path (防御路 DEF)**: Target DEF vs. Attacker DEF Break (防御贯通)
2. **Physical/Magic Path (物魔路 PM.DEF)**: Target P.DEF/M.DEF vs. Attacker PM.DEF Break (物理/魔法防御贯通)

For **either path**, the damage pass rate (通过率, `dr` where 1 = 100% pass) is:
$$effective\_DEF = DEF \times \frac{C_{pen}}{PEN + C_{pen}}$$
$$Damage\_Rate = \frac{C_{def}}{effective\_DEF + C_{def}}$$

* **Final Defense Multiplier (综合防御通过率)** = `drDef` $\times$ `drPm`
* **Final Damage (最终伤害)** = `面板攻击` $\times$ `技能倍率` $\times$ `(1 + 增伤% + 阵营克制等)` $\times$ `爆击倍率` $\times$ `综合防御通过率`

---

## 2. Variables Definition & Mapping (CRITICAL)

Strictly adhere to the following mapping:

| Code Variable | UI Name (Chinese) | Mathematical Name | Meaning & Source / Determination |
| :--- | :--- | :--- | :--- |
| `def` | 目标防御力 | $DEF$ | Defender's raw defense. |
| `pmDef` | 目标物理/魔法防御力 | $P.DEF / M.DEF$ | Defender's physical or magic defense (based on attacker type). |
| `pen` | 攻击方防御贯通 | $DEF\ Break$ | Attacker's defense penetration. |
| `pmPen` | 攻击方物魔防御贯通 | $PM.DEF\ Break$ | Attacker's physical/magic defense penetration. |
| `atkLevel` | 攻击方等级 | $Lv_{atk}$ | Attacker's level. **Determines penetration constants ($C_{pen}, C_{pmpen}$)**. |
| `defLevel` | 防守方等级 | $Lv_{def}$ | Defender's level. **Determines defense constants ($C_{def}, C_{pdef}/C_{mdef}$)**. |
| `cPen` | 防御贯通定数 | $C_{pen}$ | Derived from `atkLevel` coefficient table (usually `1725` at Lv500). |
| `cPmPen` | 物魔贯通定数 | $C_{pmpen}$ | Derived from `atkLevel` coefficient table (usually `16660` at Lv500). |
| `cDef` | 防御路防御定数 | $C_{def}$ | Derived from `defLevel` coefficient table (usually `834953` at Lv500). |
| `cPmDef` | 物魔路防御定数 | $C_{pdef} / C_{mdef}$ | Derived from `defLevel` coefficient table (physical or magic constant based on attacker type). |
| `drDef` | 防御路伤害通过率 | $dr_{def}$ | Return value of `calcDamageRate(def, pen, cDef, cPen)`. Range `0` to `1`. |
| `drPm` | 物魔路伤害通过率 | $dr_{pm}$ | Return value of `calcDamageRate(pmDef, pmPen, cPmDef, cPmPen)`. Range `0` to `1`. |
| `defMitMultiplier` | 综合防御通过率 | - | `drDef * drPm`. Range `0` to `1`. |

---

## 3. Crucial Rules to Avoid Confusion

1. **Level vs. Constant Lookup**:
   * **Attacker's Level (`atkLevel`)** determines penetration constants (`cPen`, `cPmPen`).
   * **Defender's Level (`defLevel`)** determines defense constants (`cDef`, `cPmDef`).
   * Never mix these lookups up.
2. **Defenses & Penetrations**:
   * `def` and `pmDef` are separate routes.
   * `pen` only breaks `def`. `pmPen` only breaks `pmDef`.
3. **Damage Type**:
   * If `damageType === 'phys'`, map defender's constant `cPmDef` to `coeffD.cPdef`.
   * If `damageType === 'mag'`, map defender's constant `cPmDef` to `coeffD.cMdef`.
