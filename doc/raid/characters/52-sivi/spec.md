# Sivi normalized raid model

- Identity: `id=52`, speed `2855`, Blue, Warrior, physical normal attack.
- S1: cooldown 4; before damage, EffectGroup `5200150101` grants a removable four-action damage-rate status to self and the two slowest other allies; one configured tier selects `30/54/72/84/90%` for all recipients; then one `1170% ATK` physical hit and one self-targeted `activeSkillHeal` event after damage.
- S2: cooldown 4; one `530% ATK` physical hit against the single dummy, retaining original target count 4; after damage, one `activeSkillHeal` event targets the three slowest allies including self (configured speed, lineup ties).
- Reuse level: C. Existing statuses and damage channels are reused; add generic lowest-speed multi-target selection and configured-tier value resolution.
- Ignored: healing amounts, cleanse, passive defense, incoming damage reduction, and separate per-recipient incoming-hit counters. Active healing events remain implemented for passive stacks and recipient counters.
- Tests: target selection/order, all five shared tiers, four-action status clock, rotation, and ignored behavior.
