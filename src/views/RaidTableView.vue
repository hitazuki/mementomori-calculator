<template>
  <div class="view-header animate-fadeup">
    <h1 class="view-title">🪵 {{ $t('raidTableTitle') }}</h1>
    <p class="view-desc">{{ $t('raidTableDesc') }}</p>
  </div>

  <section class="raid-summary-grid animate-fadeup">
    <div class="stat-box raid-summary-primary">
      <div class="stat-value">{{ formatPercent(result.teamAtkPercent) }}</div>
      <div v-if="Object.keys(result.scalingTotals).length" class="raid-summary-extra">+ {{ formatScaling(result.scalingTotals) }}</div>
      <div class="stat-label">{{ $t('raidTeamAtkTotal') }}</div>
    </div>
    <div class="stat-box">
      <div class="stat-value is-purple">{{ formatSymbolic(result.symbolicTotals) }}</div>
      <div class="stat-label">{{ $t('raidTeamSymbolicTotal') }}</div>
    </div>
    <div class="stat-box">
      <div class="stat-value is-info">10</div>
      <div class="stat-label">{{ $t('raidTenTurns') }}</div>
    </div>
  </section>

  <section class="card raid-config-card animate-fadeup">
    <div class="raid-section-head">
      <div><h2>{{ $t('raidConfigTitle') }}</h2><p>{{ $t('raidRosterHint') }}</p></div>
      <button type="button" class="btn btn-ghost btn-sm" @click="resetConfig">↻ {{ $t('raidReset') }}</button>
    </div>

    <div class="raid-roster-grid">
      <button
        v-for="id in roster"
        :key="id"
        type="button"
        class="raid-roster-item"
        :class="{ selected: lineup.includes(id) }"
        :disabled="(!lineup.includes(id) && lineup.length >= 5) || (lineup.includes(id) && lineup.length <= 1)"
        @click="toggleCharacter(id)"
      >
        <strong>{{ characterName(id) }}</strong><small>#{{ id }} · {{ $t('raidBaseSpeed') }} {{ speeds[id] }}</small>
      </button>
    </div>

    <div class="raid-assumption-grid">
      <label class="raid-toggle-control">
        <input v-model="guaranteedCritical" type="checkbox">
        <span><strong>{{ $t('raidGuaranteedCritical') }}</strong><small>{{ $t('raidGuaranteedCriticalHint') }}</small></span>
      </label>
      <label class="raid-number-control">
        <span><strong>{{ $t('raidBaseCriticalDamage') }}</strong><small>{{ $t('raidBaseCriticalDamageHint') }}</small></span>
        <span class="raid-number-input"><input v-model.number="baseCriticalDamagePercent" type="number" min="0" step="10"><em>%</em></span>
      </label>
      <label class="raid-toggle-control">
        <input v-model="probabilityOverrides.liberiaSand" type="checkbox">
        <span><strong>{{ $t('raidAssumeLiberiaSand') }}</strong><small>{{ $t('raidProbabilityHint') }}</small></span>
      </label>
      <label class="raid-toggle-control">
        <input v-model="probabilityOverrides.shizuSpeedDown" type="checkbox">
        <span><strong>{{ $t('raidAssumeShizuSpeedDown') }}</strong><small>{{ $t('raidProbabilityHint') }}</small></span>
      </label>
    </div>

    <div class="raid-speed-editor">
      <h3>{{ $t('raidSpeedSettings') }}</h3>
      <div class="raid-speed-list">
        <label v-for="id in lineup" :key="`speed-${id}`">
          <span>{{ characterName(id) }}</span><input v-model.number="speeds[id]" type="number" min="0" step="1">
        </label>
      </div>
    </div>

    <div class="raid-order-grid raid-order-grid-two">
      <OrderList :title="$t('raidPositionOrder')" :items="lineup" :name-of="characterName" :up-label="$t('raidMoveUp')" :down-label="$t('raidMoveDown')" @move="moveItem(lineup, $event.index, $event.delta)" />
      <OrderList :title="$t('raidAttackPriority')" :items="attackPriority" :name-of="characterName" :up-label="$t('raidMoveUp')" :down-label="$t('raidMoveDown')" @move="moveItem(attackPriority, $event.index, $event.delta)" />
    </div>
  </section>

  <section class="card raid-matrix-card animate-fadeup">
    <div class="raid-section-head"><div><h2>{{ $t('raidMatrixTitle') }}</h2><p>{{ $t('raidSelectCellHint') }}</p></div></div>
    <div class="raid-table-scroll">
      <table class="raid-matrix-table">
        <thead><tr>
          <th class="raid-sticky-col">{{ $t('raidCharacter') }}</th>
          <th v-for="round in result.rounds" :key="round.turn">
            {{ $t('raidTurn', { n: round.turn }) }}
            <small class="raid-turn-order">{{ round.actionOrder.map(characterName).join(' → ') }}</small>
          </th>
          <th>{{ $t('raidCharacterTotal') }}</th>
        </tr></thead>
        <tbody>
          <tr v-for="id in lineup" :key="id">
            <th class="raid-sticky-col raid-character-cell"><span>{{ characterName(id) }}</span><small>#{{ id }}</small></th>
            <td v-for="round in result.rounds" :key="`${id}-${round.turn}`">
              <button type="button" class="raid-action-cell" :class="{ active: selectedEvent?.sequence === eventFor(round, id).sequence }" @click="selectedEvent = eventFor(round, id)">
                <strong>{{ $t(eventFor(round, id).skillNameKey) }}</strong>
                <span>{{ formatPercent(eventFor(round, id).effectiveAtkPercent) }}</span>
                <em v-if="Object.keys(eventFor(round, id).scalingTotals).length">+ {{ formatScaling(eventFor(round, id).scalingTotals) }}</em>
                <em v-if="Object.keys(eventFor(round, id).symbolicTotals).length">+ {{ formatSymbolic(eventFor(round, id).symbolicTotals) }}</em>
                <span v-if="modifierLabels(eventFor(round, id)).length" class="raid-cell-buffs">{{ modifierLabels(eventFor(round, id)).join(' · ') }}</span>
              </button>
            </td>
            <td class="raid-row-total">
              {{ formatPercent(result.characterTotals[id].atkPercent) }}
              <small v-if="Object.keys(result.characterTotals[id].scalingTotals).length">+ {{ formatScaling(result.characterTotals[id].scalingTotals) }}</small>
              <small v-if="Object.keys(result.characterTotals[id].symbolicTotals).length">+ {{ formatSymbolic(result.characterTotals[id].symbolicTotals) }}</small>
            </td>
          </tr>
        </tbody>
        <tfoot><tr>
          <th class="raid-sticky-col">{{ $t('raidRoundTotal') }}</th>
          <td v-for="round in result.rounds" :key="`total-${round.turn}`">
            <strong>{{ formatPercent(round.atkPercent) }}</strong>
            <small v-if="Object.keys(round.scalingTotals).length">+ {{ formatScaling(round.scalingTotals) }}</small>
            <small v-if="Object.keys(round.symbolicTotals).length">+ {{ formatSymbolic(round.symbolicTotals) }}</small>
          </td>
          <td class="raid-row-total">{{ formatPercent(result.teamAtkPercent) }}</td>
        </tr></tfoot>
      </table>
    </div>
  </section>

  <section v-if="selectedEvent" class="card raid-detail-card animate-fadeup">
    <div class="raid-section-head">
      <div><h2>{{ $t('raidActionDetails') }}</h2><p>{{ $t('raidTurn', { n: selectedEvent.turn }) }} · {{ characterName(selectedEvent.actorId) }} · {{ $t(selectedEvent.skillNameKey) }}</p></div>
      <strong class="raid-detail-total">{{ formatPercent(selectedEvent.effectiveAtkPercent) }}</strong>
    </div>
    <div class="raid-detail-grid">
      <div class="raid-detail-panel raid-detail-panel-wide">
        <h3>{{ $t('raidDamageSteps') }}</h3>
        <div v-if="selectedEvent.damageSteps.length" class="raid-step-list">
          <article v-for="step in selectedEvent.damageSteps" :key="step.index">
            <header><strong>#{{ step.index }} · {{ step.percent }}% {{ step.stat }}</strong><span>{{ formatStep(step) }}</span></header>
            <small>{{ $t('raidStepCritical', { value: formatter().format(step.criticalMultiplier) }) }} · {{ $t('raidStepDamageRate', { value: formatRate(step.damageRate) }) }} · {{ bossStackSummary(step.bossStatusBefore) }}</small>
            <small v-if="step.scalingTerms.length">+ {{ formatScalingArray(step.scalingTerms) }}</small>
          </article>
        </div>
        <p v-else class="raid-muted">{{ $t('raidNoDamageSteps') }}</p>
      </div>

      <div class="raid-detail-panel">
        <h3>{{ $t('raidSpeedSnapshot') }}</h3>
        <dl class="raid-detail-list">
          <template v-for="id in result.rounds[selectedEvent.turn - 1].actionOrder" :key="`speed-detail-${id}`">
            <dt>{{ characterName(id) }}</dt><dd>{{ formatter().format(result.rounds[selectedEvent.turn - 1].speedSnapshot[id].effectiveSpeed) }}</dd>
          </template>
        </dl>
        <h3 class="raid-subtitle">{{ $t('raidSkillHistory') }}</h3>
        <p class="raid-muted">S1 {{ selectedEvent.runtimeBefore.skillUses.s1 }} → {{ selectedEvent.runtimeAfter.skillUses.s1 }} · S2 {{ selectedEvent.runtimeBefore.skillUses.s2 }} → {{ selectedEvent.runtimeAfter.skillUses.s2 }}</p>
        <p v-for="(value, key) in selectedEvent.runtimeAfter.counters" :key="key" class="raid-muted">
          {{ counterLabel(selectedEvent.actorId, key) }}：{{ value }}
        </p>
      </div>

      <div class="raid-detail-panel">
        <h3>{{ $t('raidRemovableBuffCount') }}</h3>
        <dl class="raid-detail-list"><template v-for="id in lineup" :key="`buff-${id}`"><dt>{{ characterName(id) }}</dt><dd>{{ selectedEvent.removableBuffCounts[id] }}</dd></template></dl>
        <h3 class="raid-subtitle">{{ $t('raidCooldownTitle') }}</h3>
        <dl class="raid-detail-list"><dt>{{ $t('raidCooldownBefore') }}</dt><dd>S1 {{ selectedEvent.cooldownsBefore.s1 }} · S2 {{ selectedEvent.cooldownsBefore.s2 }}</dd><dt>{{ $t('raidCooldownAfter') }}</dt><dd>S1 {{ selectedEvent.cooldownsAfter.s1 }} · S2 {{ selectedEvent.cooldownsAfter.s2 }}</dd></dl>
      </div>

      <div class="raid-detail-panel">
        <h3>{{ $t('raidAppliedEffects') }}</h3>
        <ul v-if="selectedEvent.effectsApplied.length" class="raid-detail-items compact"><li v-for="(effect, index) in selectedEvent.effectsApplied" :key="`${effect.type}-${effect.id}-${index}`">{{ effectText(effect) }}</li></ul>
        <p v-else class="raid-muted">—</p>
        <h3 class="raid-subtitle">{{ $t('raidBossStatus') }}</h3>
        <ul v-if="selectedEvent.bossStatusAfterAction.length" class="raid-detail-items compact"><li v-for="status in selectedEvent.bossStatusAfterAction" :key="status.id">{{ $t(status.nameKey) }} · {{ $t('raidStatusStacks', { n: status.stacks }) }}<span v-if="status.remainingRounds != null"> · {{ $t('raidRemainingRounds', { n: status.remainingRounds }) }}</span></li></ul>
        <p v-else class="raid-muted">—</p>
      </div>

      <div class="raid-detail-panel">
        <h3>{{ $t('raidSymbolicScaling') }}</h3>
        <p v-if="Object.keys(selectedEvent.scalingTotals).length" class="raid-symbolic-value">{{ formatScaling(selectedEvent.scalingTotals) }}</p>
        <p v-else class="raid-muted">—</p>
        <h3 class="raid-subtitle">{{ $t('raidIgnoredEffects') }}</h3>
        <ul v-if="selectedEvent.ignoredKeys.length" class="raid-ignored-list"><li v-for="key in selectedEvent.ignoredKeys" :key="key">{{ $t(key) }}</li></ul><p v-else class="raid-muted">—</p>
      </div>
    </div>
  </section>

  <section class="raid-warning-list animate-fadeup"><p v-for="warning in result.warnings" :key="warning">ℹ {{ $t(warning) }}</p></section>
</template>

<script setup>
import { computed, defineComponent, h, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RAID_TABLE_CHARACTERS, RAID_TABLE_ROSTER, createDefaultRaidTableConfig } from '../constants/raidTableCharacters.js'
import { simulateRaidTable } from '../engine/raidTableCalc.js'

const OrderList = defineComponent({
  props: { title: { type: String, required: true }, items: { type: Array, required: true }, nameOf: { type: Function, required: true }, upLabel: { type: String, required: true }, downLabel: { type: String, required: true } },
  emits: ['move'],
  setup(props, { emit }) {
    return () => h('div', { class: 'raid-order-list' }, [h('h3', props.title), ...props.items.map((id, index) => h('div', { class: 'raid-order-row', key: id }, [
      h('span', { class: 'raid-order-rank' }, String(index + 1)), h('strong', props.nameOf(id)), h('div', { class: 'raid-order-actions' }, [
        h('button', { type: 'button', class: 'btn btn-ghost btn-sm', disabled: index === 0, title: props.upLabel, 'aria-label': `${props.upLabel} ${props.nameOf(id)}`, onClick: () => emit('move', { index, delta: -1 }) }, '↑'),
        h('button', { type: 'button', class: 'btn btn-ghost btn-sm', disabled: index === props.items.length - 1, title: props.downLabel, 'aria-label': `${props.downLabel} ${props.nameOf(id)}`, onClick: () => emit('move', { index, delta: 1 }) }, '↓'),
      ]),
    ]))])
  },
})

const { t, locale } = useI18n()
const roster = [...RAID_TABLE_ROSTER]
const defaults = createDefaultRaidTableConfig()
const lineup = ref([...defaults.lineup])
const attackPriority = ref([...defaults.attackPriority])
const speeds = reactive({ ...defaults.speeds })
const guaranteedCritical = ref(defaults.guaranteedCritical)
const baseCriticalDamagePercent = ref(defaults.baseCriticalDamageBonus * 100)
const probabilityOverrides = reactive({ ...defaults.probabilityOverrides })
const selectedEvent = ref(null)

const result = computed(() => simulateRaidTable({
  lineup: lineup.value,
  attackPriority: attackPriority.value,
  speeds,
  guaranteedCritical: guaranteedCritical.value,
  baseCriticalDamageBonus: Math.max(0, Number(baseCriticalDamagePercent.value) || 0) / 100,
  probabilityOverrides,
  turns: 10,
}))

function characterName(id) { return t(RAID_TABLE_CHARACTERS[id].nameKey) }
function counterLabel(id, key) { return t(RAID_TABLE_CHARACTERS[id].counterLabels?.[key] ?? key) }
function formatter(maximumFractionDigits = 2) { return new Intl.NumberFormat(locale.value, { maximumFractionDigits, minimumFractionDigits: 0 }) }
function formatPercent(value) { return `${formatter().format(value)}% ATK` }
function formatRate(value) { return `${formatter().format(value * 100)}%` }
function formatSymbolic(totals) { const entries = Object.entries(totals); return entries.length ? entries.map(([stat, value]) => `${formatter().format(value)}% ${stat}`).join(' + ') : '—' }
function formatScaling(totals) { return Object.values(totals).map(term => `${formatter().format(term.coefficient)}% ATK×(${term.key})`).join(' + ') }
function formatScalingArray(terms) { return terms.map(term => `${formatter().format(term.coefficient)}% ATK×(${term.key})`).join(' + ') }
function formatStep(step) { return `${formatter().format(step.effectivePercent)}% ${step.stat}` }
function eventFor(round, id) { return round.actions.find(action => action.actorId === id) }

function toggleCharacter(id) {
  if (lineup.value.includes(id)) {
    if (lineup.value.length <= 1) return
    lineup.value = lineup.value.filter(item => item !== id)
    attackPriority.value = attackPriority.value.filter(item => item !== id)
  } else {
    if (lineup.value.length >= 5) return
    lineup.value = [...lineup.value, id]
    attackPriority.value = [...attackPriority.value, id]
  }
  selectedEvent.value = null
}

function moveItem(list, index, delta) {
  const next = index + delta
  if (next < 0 || next >= list.length) return
  const copy = [...list]; [copy[index], copy[next]] = [copy[next], copy[index]]
  list.splice(0, list.length, ...copy)
  selectedEvent.value = null
}

function resetConfig() {
  const next = createDefaultRaidTableConfig()
  lineup.value = [...next.lineup]; attackPriority.value = [...next.attackPriority]
  Object.assign(speeds, next.speeds); guaranteedCritical.value = next.guaranteedCritical
  baseCriticalDamagePercent.value = next.baseCriticalDamageBonus * 100
  Object.assign(probabilityOverrides, next.probabilityOverrides); selectedEvent.value = null
}

function modifierLabels(event) {
  const seen = new Set(); const labels = []
  for (const step of event.damageSteps) for (const source of step.modifierSources) {
    if (source.permanent || seen.has(source.id) || !['attackRate', 'damageRate', 'criticalDamageBonus'].includes(source.channel)) continue
    seen.add(source.id); labels.push(`${t(source.nameKey)} +${formatRate(source.rate)}`)
  }
  return labels
}

function bossStackSummary(statuses) {
  if (!statuses.length) return t('raidNoBossStatus')
  return statuses.map(status => `${t(status.nameKey)}×${status.stacks}`).join(' · ')
}

function effectText(effect) {
  if (effect.skipped) return t('raidEffectSkipped', { effect: t(effect.nameKey) })
  if (effect.type === 'cooldownReduction') return t('raidEffectCooldownReduction', { target: characterName(effect.targetId), n: effect.amount })
  if (effect.type === 'cooldownReset') return t('raidEffectCooldownReset')
  if (effect.type === 'counter') return t('raidEffectCounter', { target: characterName(effect.targetId), effect: t(effect.nameKey), n: effect.after })
  if (effect.type === 'bossStatus') return t('raidEffectBossStatus', { effect: t(effect.nameKey), n: effect.stacks ?? 0 })
  if (effect.type === 'status') return t('raidEffectStatus', { target: characterName(effect.targetId), status: t(effect.nameKey), class: t(effect.statusClass === 'removableBuff' ? 'raidStatusRemovable' : 'raidStatusUnremovable'), n: effect.duration ?? '∞' })
  return effect.type
}
</script>
