# 讨伐角色档案格式

每个角色目录只要求一个必选文件：`character.json`。它是唯一的机器可校验词条档案，覆盖 MB 索引、技能/被动、EffectGroup、当前模型处理、忽略项和未决项。

`evidence.md` 是可选的人读备注：只记录战斗日志、推断、冲突与补充说明；它不重复 `character.json` 的结构化字段。

## `character.json` 结构

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

校验检查档案格式、代码中的 EffectGroup / `ignoredKeys` 覆盖关系；严格模式额外要求讨伐角色池中的每名角色都已建档。MB 通过 `skillId` 与 `effectGroupId` 按需查询，不保留副本，也不参与日常同步校验。
