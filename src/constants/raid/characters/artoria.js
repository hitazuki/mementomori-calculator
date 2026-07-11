import { RAID_ELEMENTS, RAID_STATUS_CLASSES, hook, normalPhysical, statusEffect } from '../shared.js'

const selfDamageHook = hook('beforeDamage', [{ type: 'emitEvent', event: 'selfDamage' }])

export default {
  id: 93, nameKey: 'raidCharArtoria', speed: 3572, element: RAID_ELEMENTS.RED, normal: normalPhysical,
  runtime: { counters: { justice: 0 }, flags: {} },
  counterLabels: { justice: 'raidBuffArtoriaJustice' },
  permanentModifiers: [],
  derivedModifiers: [{
    id: 'artoria-justice', nameKey: 'raidBuffArtoriaJustice', channel: 'attackRate',
    rate: { type: 'counterLinear', counter: 'justice', base: 0, perStack: 0.1, max: 0.4 },
  }],
  eventHooks: [{
    event: 'selfDamage',
    effects: [{
      type: 'changeCounter', counter: 'justice', amount: 1, max: 4,
      id: 'artoria-justice', nameKey: 'raidBuffArtoriaJustice', eventType: 'counter',
    }],
  }],
  hooks: [hook('battleStart', [
    statusEffect({
      id: 'artoria-flat-atk', effectGroupId: 9300430101, nameKey: 'raidBuffArtoriaAttack', target: 'lowestSpeedOther', duration: 2,
      statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
      symbolicModifiers: [{ kind: 'sourceAttackOverTargetAttack', coefficient: 0.5, sourceId: 93 }],
    }),
    statusEffect({
      id: 'artoria-speed', effectGroupId: 9300440201, nameKey: 'raidBuffArtoriaSpeed', target: 'lowestSpeedOther', duration: 2,
      statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE, targetElement: RAID_ELEMENTS.RED,
      modifiers: [{ id: 'artoria-speed', channel: 'speedRate', rate: 0.2 }],
    }),
  ])],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillArtoriaS1', cooldown: 4, damageType: 'phys', hooks: [selfDamageHook],
      damageSteps: [{ stat: 'ATK', percent: 520, hits: 6, damageType: 'phys' }], ignoredKeys: ['raidIgnoredStun'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillArtoriaS2', cooldown: 4, damageType: 'phys', hooks: [selfDamageHook],
      damageSteps: [{
        stat: 'ATK',
        percent: { type: 'counterLinear', counter: 'justice', base: 540, perStack: 150, max: 1140 },
        hits: 7, damageType: 'phys',
      }],
    },
  },
}
