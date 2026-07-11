<template>
  <div class="view-header animate-fadeup">
    <h1 class="view-title">🪵 {{ $t('raidTableTitle') }}</h1>
    <p class="view-desc">{{ $t('raidTableDesc') }}</p>
  </div>

  <section class="raid-summary-grid animate-fadeup">
    <div class="stat-box raid-summary-primary">
      <div class="stat-value">{{ formatPercent(result.teamAtkPercent) }}</div>
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
      <div>
        <h2>{{ $t('raidConfigTitle') }}</h2>
        <p>{{ $t('raidOrderHint') }}</p>
      </div>
      <button type="button" class="btn btn-ghost btn-sm" @click="resetConfig">↻ {{ $t('raidReset') }}</button>
    </div>

    <label class="raid-bench-control">
      <span>
        <strong>{{ $t('raidBenchCharacter') }}</strong>
        <small>{{ $t('raidBenchHint') }}</small>
      </span>
      <select :value="benchId" @change="changeBench(Number($event.target.value))">
        <option v-for="characterId in roster" :key="characterId" :value="characterId">
          {{ characterName(characterId) }} (#{{ characterId }})
        </option>
      </select>
    </label>

    <div class="raid-order-grid">
      <OrderList
        :title="$t('raidPositionOrder')"
        :items="lineup"
        :name-of="characterName"
        :up-label="$t('raidMoveUp')"
        :down-label="$t('raidMoveDown')"
        @move="moveItem(lineup, $event.index, $event.delta)"
      />
      <OrderList
        :title="$t('raidActionOrder')"
        :items="actionOrder"
        :name-of="characterName"
        :up-label="$t('raidMoveUp')"
        :down-label="$t('raidMoveDown')"
        @move="moveItem(actionOrder, $event.index, $event.delta)"
      />
      <OrderList
        :title="$t('raidAttackPriority')"
        :items="attackPriority"
        :name-of="characterName"
        :up-label="$t('raidMoveUp')"
        :down-label="$t('raidMoveDown')"
        @move="moveItem(attackPriority, $event.index, $event.delta)"
      />
    </div>
  </section>

  <section class="card raid-matrix-card animate-fadeup">
    <div class="raid-section-head">
      <div>
        <h2>{{ $t('raidMatrixTitle') }}</h2>
        <p>{{ $t('raidSelectCellHint') }}</p>
      </div>
    </div>
    <div class="raid-table-scroll">
      <table class="raid-matrix-table">
        <thead>
          <tr>
            <th class="raid-sticky-col">{{ $t('raidCharacter') }}</th>
            <th v-for="round in result.rounds" :key="round.turn">
              {{ $t('raidTurn', { n: round.turn }) }}
            </th>
            <th>{{ $t('raidCharacterTotal') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="characterId in lineup" :key="characterId">
            <th class="raid-sticky-col raid-character-cell">
              <span>{{ characterName(characterId) }}</span>
              <small>#{{ characterId }}</small>
            </th>
            <td v-for="round in result.rounds" :key="`${characterId}-${round.turn}`">
              <button
                type="button"
                class="raid-action-cell"
                :class="{ active: selectedEvent?.sequence === eventFor(round, characterId).sequence }"
                @click="selectedEvent = eventFor(round, characterId)"
              >
                <strong>{{ $t(eventFor(round, characterId).skillNameKey) }}</strong>
                <span>{{ formatPercent(eventFor(round, characterId).effectiveAtkPercent) }}</span>
                <em v-if="eventFor(round, characterId).symbolicTerms.length">
                  + {{ formatSymbolicTerms(eventFor(round, characterId).symbolicTerms) }}
                </em>
                <span class="raid-cell-buffs" v-if="runtimeBuffs(eventFor(round, characterId)).length">
                  {{ runtimeBuffs(eventFor(round, characterId)).map(buffShortLabel).join(' · ') }}
                </span>
              </button>
            </td>
            <td class="raid-row-total">
              {{ formatPercent(result.characterTotals[characterId].atkPercent) }}
              <small v-if="Object.keys(result.characterTotals[characterId].symbolicTotals).length">
                + {{ formatSymbolic(result.characterTotals[characterId].symbolicTotals) }}
              </small>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <th class="raid-sticky-col">{{ $t('raidRoundTotal') }}</th>
            <td v-for="round in result.rounds" :key="`total-${round.turn}`">
              <strong>{{ formatPercent(round.atkPercent) }}</strong>
              <small v-if="Object.keys(round.symbolicTotals).length">
                + {{ formatSymbolic(round.symbolicTotals) }}
              </small>
            </td>
            <td class="raid-row-total">{{ formatPercent(result.teamAtkPercent) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </section>

  <section v-if="selectedEvent" class="card raid-detail-card animate-fadeup">
    <div class="raid-section-head">
      <div>
        <h2>{{ $t('raidActionDetails') }}</h2>
        <p>{{ $t('raidTurn', { n: selectedEvent.turn }) }} · {{ characterName(selectedEvent.actorId) }} · {{ $t(selectedEvent.skillNameKey) }}</p>
      </div>
      <strong class="raid-detail-total">{{ formatPercent(selectedEvent.effectiveAtkPercent) }}</strong>
    </div>

    <div class="raid-detail-grid">
      <div class="raid-detail-panel">
        <h3>{{ $t('raidFormula') }}</h3>
        <div class="raid-formula">{{ formulaText(selectedEvent) }}</div>
        <dl class="raid-detail-list">
          <template v-for="term in selectedEvent.attackTerms" :key="`${term.stat}-${term.percent}-${term.hits}`">
            <dt>{{ $t('raidBaseMultiplier') }}</dt>
            <dd>{{ termText(term) }}</dd>
          </template>
          <dt>{{ $t('raidEffectiveMultiplier') }}</dt>
          <dd>{{ formatPercent(selectedEvent.effectiveAtkPercent) }}</dd>
          <template v-if="isRusticaHistoryAction(selectedEvent)">
            <dt>{{ $t('raidSkillHistory') }}</dt>
            <dd>{{ $t('raidRusticaS2UseNumber', { n: selectedEvent.historyBefore.skillUses.s2 + 1 }) }}</dd>
            <dt>{{ $t('raidDynamicHitCount') }}</dt>
            <dd>{{ selectedEvent.attackTerms[0].hits }}</dd>
          </template>
        </dl>
      </div>

      <div class="raid-detail-panel">
        <h3>{{ $t('raidActiveBuffs') }}</h3>
        <ul v-if="selectedEvent.modifierSources.length" class="raid-detail-items">
          <li v-for="source in selectedEvent.modifierSources" :key="`${source.id}-${source.sourceId}-${source.appliedSequence}`">
            <span>{{ $t(source.nameKey) }}</span>
            <strong>+{{ formatRate(source.rate) }}</strong>
            <small>{{ source.permanent ? $t('raidPermanent') : $t('raidRemainingActions', { n: source.remainingActions }) }}</small>
          </li>
        </ul>
        <p v-else class="raid-muted">{{ $t('raidNoActiveBuffs') }}</p>

        <h3 class="raid-subtitle">{{ $t('raidRemovableBuffCount') }}</h3>
        <dl class="raid-detail-list">
          <template v-for="characterId in lineup" :key="`buff-count-${characterId}`">
            <dt>{{ characterName(characterId) }}</dt>
            <dd>{{ selectedEvent.removableBuffCounts[characterId] }}</dd>
          </template>
        </dl>

        <h3 class="raid-subtitle">{{ $t('raidStatusSnapshot') }}</h3>
        <ul v-if="selectedActorStatuses.length" class="raid-detail-items compact">
          <li v-for="status in selectedActorStatuses" :key="`${status.effectGroupId}-${status.sourceId}`">
            {{ $t(status.nameKey) }} · {{ statusClassLabel(status.statusClass) }} · {{ $t('raidRemainingActions', { n: status.remainingActions }) }}
          </li>
        </ul>
        <p v-else class="raid-muted">—</p>
      </div>

      <div class="raid-detail-panel">
        <h3>{{ $t('raidCooldownTitle') }}</h3>
        <dl class="raid-detail-list">
          <dt>{{ $t('raidCooldownBefore') }}</dt>
          <dd>S1 {{ selectedEvent.cooldownsBefore.s1 }} · S2 {{ selectedEvent.cooldownsBefore.s2 }}</dd>
          <dt>{{ $t('raidCooldownAfter') }}</dt>
          <dd>S1 {{ selectedEvent.cooldownsAfter.s1 }} · S2 {{ selectedEvent.cooldownsAfter.s2 }}</dd>
        </dl>
        <h3 class="raid-subtitle">{{ $t('raidAppliedEffects') }}</h3>
        <ul v-if="selectedEvent.effectsApplied.length" class="raid-detail-items compact">
          <li v-for="(effect, index) in selectedEvent.effectsApplied" :key="`${effect.type}-${effect.targetId}-${index}`">
            <span>{{ appliedEffectText(effect) }}</span>
          </li>
        </ul>
        <p v-else class="raid-muted">—</p>
        <h3 class="raid-subtitle">{{ $t('raidExpiredEffects') }}</h3>
        <ul v-if="selectedEvent.expiredEffects.length" class="raid-detail-items compact">
          <li v-for="effect in selectedEvent.expiredEffects" :key="`${effect.id}-${effect.sourceId}`">
            {{ $t(effect.nameKey) }}
          </li>
        </ul>
        <p v-else class="raid-muted">—</p>
      </div>

      <div class="raid-detail-panel">
        <h3>{{ $t('raidSymbolicDamage') }}</h3>
        <template v-if="selectedEvent.symbolicTerms.length">
          <p class="raid-symbolic-value">{{ formatSymbolicTerms(selectedEvent.symbolicTerms) }}</p>
          <p
            v-for="term in selectedEvent.symbolicTerms.filter(item => item.conditionKey)"
            :key="term.conditionKey"
            class="raid-muted"
          >
            {{ $t(term.conditionKey) }}
          </p>
        </template>
        <p v-else class="raid-muted">—</p>
        <h3 class="raid-subtitle">{{ $t('raidIgnoredEffects') }}</h3>
        <ul v-if="selectedEvent.ignoredKeys.length" class="raid-ignored-list">
          <li v-for="key in selectedEvent.ignoredKeys" :key="key">{{ $t(key) }}</li>
        </ul>
        <p v-else class="raid-muted">—</p>
      </div>
    </div>
  </section>

  <section class="raid-warning-list animate-fadeup">
    <p v-for="warning in result.warnings" :key="warning">ℹ {{ $t(warning) }}</p>
  </section>
</template>

<script setup>
import { computed, defineComponent, h, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  DEFAULT_RAID_BENCH_ID,
  RAID_TABLE_CHARACTERS,
  RAID_TABLE_CHARACTER_IDS,
  RAID_TABLE_ROSTER,
  createDefaultRaidTableConfig,
  replaceRaidBenchMember,
} from '../constants/raidTableCharacters.js'
import { simulateRaidTable } from '../engine/raidTableCalc.js'

const OrderList = defineComponent({
  props: {
    title: { type: String, required: true },
    items: { type: Array, required: true },
    nameOf: { type: Function, required: true },
    upLabel: { type: String, required: true },
    downLabel: { type: String, required: true },
  },
  emits: ['move'],
  setup(props, { emit }) {
    return () => h('div', { class: 'raid-order-list' }, [
      h('h3', props.title),
      ...props.items.map((id, index) => h('div', { class: 'raid-order-row', key: id }, [
        h('span', { class: 'raid-order-rank' }, String(index + 1)),
        h('strong', props.nameOf(id)),
        h('div', { class: 'raid-order-actions' }, [
          h('button', {
            type: 'button',
            class: 'btn btn-ghost btn-sm',
            disabled: index === 0,
            title: props.upLabel,
            'aria-label': `${props.upLabel} ${props.nameOf(id)}`,
            onClick: () => emit('move', { index, delta: -1 }),
          }, '↑'),
          h('button', {
            type: 'button',
            class: 'btn btn-ghost btn-sm',
            disabled: index === props.items.length - 1,
            title: props.downLabel,
            'aria-label': `${props.downLabel} ${props.nameOf(id)}`,
            onClick: () => emit('move', { index, delta: 1 }),
          }, '↓'),
        ]),
      ])),
    ])
  },
})

const { t, locale } = useI18n()
const defaults = createDefaultRaidTableConfig()
const roster = [...RAID_TABLE_ROSTER]
const benchId = ref(DEFAULT_RAID_BENCH_ID)
const lineup = ref([...defaults.lineup])
const actionOrder = ref([...defaults.actionOrder])
const attackPriority = ref([...defaults.attackPriority])

const result = computed(() => simulateRaidTable({
  lineup: lineup.value,
  actionOrder: actionOrder.value,
  attackPriority: attackPriority.value,
  turns: 10,
}))

const selectedEvent = ref(null)

function characterName(id) {
  return t(RAID_TABLE_CHARACTERS[id].nameKey)
}

function moveItem(listRef, index, delta) {
  const next = index + delta
  if (next < 0 || next >= listRef.length) return
  const copy = [...listRef]
  ;[copy[index], copy[next]] = [copy[next], copy[index]]
  listRef.splice(0, listRef.length, ...copy)
  selectedEvent.value = null
}

function changeBench(nextBenchId) {
  if (nextBenchId === benchId.value) return
  const previousBenchId = benchId.value
  lineup.value = replaceRaidBenchMember(lineup.value, nextBenchId, previousBenchId)
  actionOrder.value = replaceRaidBenchMember(actionOrder.value, nextBenchId, previousBenchId)
  attackPriority.value = replaceRaidBenchMember(attackPriority.value, nextBenchId, previousBenchId)
  benchId.value = nextBenchId
  selectedEvent.value = null
}

function resetConfig() {
  const next = createDefaultRaidTableConfig()
  benchId.value = DEFAULT_RAID_BENCH_ID
  lineup.value = [...next.lineup]
  actionOrder.value = [...next.actionOrder]
  attackPriority.value = [...next.attackPriority]
  selectedEvent.value = null
}

function eventFor(round, characterId) {
  return round.actions.find(action => action.actorId === characterId)
}

function formatter(maximumFractionDigits = 2) {
  return new Intl.NumberFormat(locale.value, { maximumFractionDigits, minimumFractionDigits: 0 })
}

function formatPercent(value) {
  return `${formatter().format(value)}% ATK`
}

function formatRate(rate) {
  return `${formatter().format(rate * 100)}%`
}

function formatSymbolic(totals) {
  const entries = Object.entries(totals)
  return entries.length ? entries.map(([stat, value]) => `${formatter().format(value)}% ${stat}`).join(' + ') : '—'
}

function formatSymbolicTerms(terms) {
  const totals = {}
  for (const term of terms) totals[term.stat] = (totals[term.stat] ?? 0) + term.percent * (term.hits ?? 1)
  return formatSymbolic(totals)
}

function termText(term) {
  return t('raidTermHits', {
    hits: term.hits ?? 1,
    percent: formatter().format(term.percent),
    stat: term.stat,
  })
}

function runtimeBuffs(event) {
  return event.modifierSources.filter(source => !source.permanent)
}

const selectedActorStatuses = computed(() => {
  if (!selectedEvent.value) return []
  return selectedEvent.value.statusSnapshotAtDamage[selectedEvent.value.actorId]?.statuses ?? []
})

function statusClassLabel(statusClass) {
  return t(statusClass === 'removableBuff' ? 'raidStatusRemovable' : 'raidStatusUnremovable')
}

function isRusticaHistoryAction(event) {
  return event.actorId === RAID_TABLE_CHARACTER_IDS.RUSTICA && event.actionKey === 's2'
}

function buffShortLabel(buff) {
  return `${t(buff.nameKey)} +${formatRate(buff.rate)}`
}

function formulaText(event) {
  const attack = 1 + event.modifierTotals.attackRate
  const damage = 1 + event.modifierTotals.damageDealtRate
  const taken = 1 + event.modifierTotals.targetDamageTakenRate
  return `${formatter().format(event.baseAtkPercent)}% × ${formatter().format(attack)} × ${formatter().format(damage)} × ${formatter().format(taken)} = ${formatter().format(event.effectiveAtkPercent)}% ATK`
}

function appliedEffectText(effect) {
  if (effect.type === 'cooldownReduction') {
    return t('raidEffectCooldownReduction', { target: characterName(effect.targetId), n: effect.amount })
  }
  const modifiers = effect.modifiers
    .filter(modifier => modifier.channel === 'attackRate')
    .map(modifier => `+${formatRate(modifier.rate)}`)
    .join(' · ')
  const text = t(modifiers ? 'raidEffectStatusWithModifier' : 'raidEffectStatus', {
    target: characterName(effect.targetId),
    status: t(effect.nameKey),
    class: statusClassLabel(effect.statusClass),
    value: modifiers,
    n: effect.duration,
  })
  if (!effect.selectionCounts) return text
  return `${text} · ${t('raidEffectSelectionCount', { n: effect.selectionCounts[effect.targetId] })}`
}
</script>
