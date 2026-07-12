# 讨伐角色档案格式

每个已写入 `doc/raid/characters/<id>-<slug>/` 的角色使用两个文件：

- `record.json`：唯一的机器可校验档案。它覆盖 MB 来源、技能/被动、EffectGroup、当前模型处理、忽略项和未决项。
- `evidence.md`：给维护者阅读的证据说明。它解释选择、时序和后续日志需求；不得替代 `record.json`。

## `record.json` 结构

```json
{
  "formatVersion": 1,
  "characterId": 0,
  "slug": "module-file-name",
  "build": { "level": 240, "exclusive": "EX3" },
  "sources": {
    "activeSkillIds": [0, 0],
    "passiveSkillIds": [0, 0],
    "combatLogs": []
  },
  "terms": [
    { "kind": "activeSkill", "sourceId": 0, "model": "implemented", "summary": "" }
  ],
  "effectGroups": [
    { "id": 0, "model": "implemented", "summary": "" }
  ],
  "ignored": [
    { "key": "raidIgnoredExample", "summary": "" }
  ],
  "unresolved": []
}
```

`terms[].model` 和 `effectGroups[].model` 只能使用 `implemented`、`ignored`、`unresolved` 或 `outOfScope`。所有 MB 主动/被动技能必须在 `terms` 中各有一项；代码中出现的每个 `effectGroupId` 与 `ignoredKeys` 也必须出现在档案中。无未决项时使用空数组。

## 校验

```bash
node .codex/skills/raid-character-integration/scripts/validate-raid-characters.mjs
node .codex/skills/raid-character-integration/scripts/validate-raid-characters.mjs --strict-docs
```

普通模式校验已建档角色的格式和代码/MB 覆盖关系；严格模式额外要求讨伐角色池中的每名角色都已建档。新增或修改角色必须通过严格模式后才算完成。
