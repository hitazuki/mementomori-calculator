export const RAID_STATUS_CLASSES = Object.freeze({
  REMOVABLE_BUFF: 'removableBuff',
  UNREMOVABLE_STATE: 'unremovableState',
  REMOVABLE_DEBUFF: 'removableDebuff',
  UNREMOVABLE_DEBUFF: 'unremovableDebuff',
  INTERNAL_MARK: 'internalMark',
})

export const RAID_ELEMENTS = Object.freeze({ BLUE: 1, RED: 2, GREEN: 3, YELLOW: 4, LIGHT: 5, DARK: 6 })

export const RAID_JOB_FLAGS = Object.freeze({ WARRIOR: 1, SNIPER: 2, MAGE: 4 })

export const RAID_MODIFIER_CHANNELS = Object.freeze([
  'attackRate', 'damageRate', 'criticalDamageBonus', 'speedRate', 'cooldownRecoveryBonus', 'defensePenetrationRate',
])

export const normalPhysical = Object.freeze({
  key: 'normal', nameKey: 'raidSkillNormalPhysical', damageType: 'phys',
  damageSteps: [{ stat: 'ATK', percent: 100, hits: 1, damageType: 'phys' }],
  hooks: [],
})

export const normalMagic = Object.freeze({
  key: 'normal', nameKey: 'raidSkillNormalMagic', damageType: 'mag',
  damageSteps: [{ stat: 'ATK', percent: 100, hits: 1, damageType: 'mag' }],
  hooks: [],
})

export function statusEffect({ id, effectGroupId, nameKey, target, duration, statusClass = RAID_STATUS_CLASSES.REMOVABLE_BUFF, modifiers = [], symbolicModifiers = [], ...rest }) {
  return { type: 'status', id, effectGroupId, nameKey, target, duration, statusClass, modifiers, symbolicModifiers, ...rest }
}

export function copyStatusesEffect({ id, nameKey, target = 'self', sourceTarget, ...rest }) {
  return { type: 'copyStatuses', id, nameKey, target, sourceTarget, ...rest }
}

export function removeStatusesEffect({ id, nameKey, target, count = 1, statusClass = RAID_STATUS_CLASSES.REMOVABLE_DEBUFF, ...rest }) {
  return { type: 'removeStatuses', id, nameKey, target, count, statusClass, ...rest }
}

export function bossStatusEffect({
  id, effectGroupId, nameKey, durationRounds = null, addStacks = 1, maxStacks = 1,
  damageRatePerStack = 0, defenseRatePerStack = 0, physicalDefenseRatePerStack = 0,
  magicDefenseRatePerStack = 0, ...rest
}) {
  return {
    type: 'bossStatus', id, effectGroupId, nameKey, durationRounds, addStacks, maxStacks,
    damageRatePerStack, defenseRatePerStack, physicalDefenseRatePerStack, magicDefenseRatePerStack,
    statusClass: RAID_STATUS_CLASSES.REMOVABLE_DEBUFF, ...rest,
  }
}

export function hook(trigger, effects, rest = {}) {
  return { trigger, effects, ...rest }
}
