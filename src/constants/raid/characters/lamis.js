import {
  RAID_ELEMENTS, RAID_JOB_FLAGS, RAID_STATUS_CLASSES, bossStatusEffect, conditionalValue, hook, normalMagic, statusEffect,
} from '../shared.js'

const shield = {
  id: 'lamis-shield', nameKey: 'raidBuffLamisShield', duration: 3,
  target: 'selfAndTopAttackOther', targetCount: 3,
}

const guidance = statusEffect({
  id: 'lamis-guidance', effectGroupId: 15700400101, nameKey: 'raidBuffLamisGuidance',
  target: 'selfAndTopAttackOther', targetCount: 2, duration: null,
  statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
  addStacks: 1, maxStacks: 12,
  modifiers: [{ channel: 'attackRate', rate: 0.05 }],
})

export default {
  id: 157, nameKey: 'raidCharLamis', speed: 3161, element: RAID_ELEMENTS.YELLOW, normal: normalMagic,
  permanentModifiers: [],
  hooks: [
    hook('battleStart', [statusEffect({
      id: 'lamis-damage-reduction', effectGroupId: 15700430401, nameKey: 'raidBuffLamisDamageReduction',
      target: 'self', duration: null, statusClass: RAID_STATUS_CLASSES.UNREMOVABLE_STATE,
    })]),
    hook('roundStart', [
      statusEffect({
        ...shield,
        replacementKey: shield.id,
        effectGroupId: conditionalValue({ type: 'roundAtMost', round: 1 }, 15700320102, 15700330102),
        targetCondition: { type: 'targetElementIn', elements: [RAID_ELEMENTS.YELLOW] },
      }),
      statusEffect({
        ...shield, id: 'lamis-shield-other-element', replacementKey: shield.id, effectGroupId: 15700320101,
        targetCondition: { type: 'targetElementNot', element: RAID_ELEMENTS.YELLOW },
      }),
    ], { everyRounds: 3, roundOffset: 1, condition: { type: 'roundAtMost', round: 12 } }),
    hook('roundStart', [
      guidance,
      { ...guidance, targetCondition: { type: 'targetJobIs', jobFlags: RAID_JOB_FLAGS.MAGE } },
    ]),
  ],
  ignoredKeys: ['raidIgnoredLamisShieldAbsorption', 'raidIgnoredIncomingDamageReduction', 'raidIgnoredHitRateUp'],
  skills: {
    s1: {
      key: 's1', nameKey: 'raidSkillLamisS1', cooldown: 4, damageType: 'mag',
      damageSteps: [{ enemyTarget: { type: 'randomGroup', count: 5 }, originalTargetCount: 5, stat: 'ATK', percent: 640, hits: 1, damageType: 'mag' }],
      hooks: [
        hook('beforeDamage', [bossStatusEffect({
          id: 'lamis-magic-defense-down', effectGroupId: 15700120103, nameKey: 'raidDebuffLamisMagicDefense',
          durationRounds: 4, magicDefenseRatePerStack: -0.2,
        })]),
        hook('afterDamage', [bossStatusEffect({
          id: 'lamis-debuff-hit-down', effectGroupId: 15700100102, nameKey: 'raidDebuffLamisDebuffHit', durationRounds: 4,
        })]),
      ],
      ignoredKeys: ['raidIgnoredLamisDebuffHit'],
    },
    s2: {
      key: 's2', nameKey: 'raidSkillLamisS2', cooldown: 4, damageType: 'mag', hooks: [],
      damageSteps: [{
        enemyTarget: { type: 'lowestMagicDefense', reselectEachHit: true },
        stat: 'ATK', damageType: 'mag', hits: 5,
        percent: { type: 'skillUsesThresholds', skillKey: 's2', values: [320, 320, 960, 1280] },
      }],
    },
  },
}
