// Equipment links may lag behind skill MB (for example Character 97).
// Rarity flags, not description-row IDs, identify the three weapon upgrades.
export function characterExclusiveEffects(character, active, passive, description, text) {
  const skills = [
    ...(character.ActiveSkillIds ?? []).map(id => active.get(id)),
    ...(character.PassiveSkillIds ?? []).map(id => passive.get(id)),
  ].filter(Boolean)
  return [128, 256, 512].flatMap((rarity, index) => {
    const level = index + 1
    const key = description?.[`Description${level}Key`]
    if (key && key !== '*') {
      const value = text(key)
      if (!value) throw new Error(`Missing exclusive description: ${character.Id}/${level}`)
      return [{ level, text: value }]
    }
    const values = skills.flatMap(skill => (skill.ActiveSkillInfos ?? skill.PassiveSkillInfos ?? [])
      .filter(info => info.EquipmentRarityFlags === rarity)
      .map(info => {
        const value = text(info.DescriptionKey)
        if (!value) throw new Error(`Missing exclusive skill text: ${character.Id}/${info.DescriptionKey}`)
        return value
      }))
    return values.length ? [{ level, text: [...new Set(values)].join('\n') }] : []
  })
}
