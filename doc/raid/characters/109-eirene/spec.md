# Eirene normalized raid model

- Identity: `id=109`, speed `3148`, Light, Sniper, physical normal attack.
- S1: cooldown 4; before damage apply Boss EffectGroup `10900120101`, unremovable, four rounds, DEF -25%; then one `280% ATK` physical hit with original target count 5.
- S2: cooldown 4; use history 0-1 gives `4×380%`, history 2+ gives `8×760%`; the late form grants self EffectGroup `10900220301` for one action.
- Passive: at rounds 1,4,7... apply enhanced-normal states to self and the slowest other ally for three actions. Either recipient's next normal attack consumes its corresponding state after reducing that actor's two skill cooldowns by one. At rounds 1,5,9... apply the four-action barrier state to the slowest other ally.
- Reuse level: C. Existing round hooks and cooldown effects are combined with the generic `normalAttack` event, `eventSourceHasStatus` condition, and `eventSource` selector for cross-character execution.
- Ignored: hit-rate value, cleansing, and incoming damage blocking.
- Tests: S1 pre-hit DEF snapshot, S2 third-use transition, self and slowest-ally enhanced-normal cooldown rotation/consumption, barrier schedule, status classes, and ignored behavior.
