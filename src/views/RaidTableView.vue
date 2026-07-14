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

    <div class="raid-element-filter" role="group" :aria-label="$t('raidElementFilter')">
      <span class="raid-element-filter-label">{{ $t('raidElementFilter') }}</span>
      <button
        v-for="option in elementFilters"
        :key="option.element"
        type="button"
        class="raid-element-filter-button"
        :class="[`element-${option.element}`, { active: selectedRosterElement === option.element }]"
        :aria-label="$t('raidFilterByElement', { element: $t(option.nameKey) })"
        :aria-pressed="selectedRosterElement === option.element"
        :title="$t(option.nameKey)"
        @click="toggleRosterElement(option.element)"
      >
        <img
          class="raid-element-icon"
          :src="elementIconUrl(option.element)"
          alt=""
          aria-hidden="true"
          draggable="false"
        >
        <span>{{ $t(option.nameKey) }}</span>
      </button>
    </div>

    <div v-if="filteredRoster.length" class="raid-roster-grid">
      <button
        v-for="id in filteredRoster"
        :key="id"
        type="button"
        class="raid-roster-item"
        :class="{ selected: lineup.includes(id) }"
        :disabled="(!lineup.includes(id) && lineup.length >= 5) || (lineup.includes(id) && lineup.length <= 1)"
        @click="toggleCharacter(id)"
      >
        <CharacterLabel :id="id" strong /><small>#{{ id }} · {{ $t('raidBaseSpeed') }} {{ speeds[id] }}</small>
      </button>
    </div>
    <p v-else class="raid-roster-empty">{{ $t('raidNoCharactersForElement') }}</p>

    <div class="raid-assumption-grid">
      <label class="raid-number-control raid-select-control">
        <span><strong>{{ $t('raidBossTemplate') }}</strong><small>{{ bossTemplateStats }}</small></span>
        <select v-model="bossTemplateId">
          <option v-for="bossTemplate in bossTemplates" :key="bossTemplate.id" :value="bossTemplate.id">{{ $t(bossTemplate.nameKey) }}</option>
        </select>
      </label>
      <label class="raid-toggle-control">
        <input v-model="guaranteedCritical" type="checkbox">
        <span><strong>{{ $t('raidGuaranteedCritical') }}</strong><small>{{ $t('raidGuaranteedCriticalHint') }}</small></span>
      </label>
      <label class="raid-number-control">
        <span><strong>{{ $t('raidBaseCriticalDamage') }}</strong><small>{{ $t('raidBaseCriticalDamageHint') }}</small></span>
        <span class="raid-number-input"><input v-model.number="baseCriticalDamagePercent" type="number" min="0" step="0.1" @change="normalizeBaseCriticalDamagePercent"><em>%</em></span>
      </label>
      <label v-if="lineup.includes(RAID_TABLE_CHARACTER_IDS.LIBERIA)" class="raid-toggle-control">
        <input v-model="probabilityOverrides.liberiaSand" type="checkbox">
        <span><strong>{{ $t('raidAssumeLiberiaSand') }}</strong><small>{{ $t('raidProbabilityHint') }}</small></span>
      </label>
      <label v-if="lineup.includes(RAID_TABLE_CHARACTER_IDS.SPRING_SHIZU)" class="raid-toggle-control">
        <input v-model="probabilityOverrides.shizuSpeedDown" type="checkbox">
        <span><strong>{{ $t('raidAssumeShizuSpeedDown') }}</strong><small>{{ $t('raidProbabilityHint') }}</small></span>
      </label>
      <label v-if="lineup.includes(RAID_TABLE_CHARACTER_IDS.GUINEVERE)" class="raid-toggle-control">
        <input v-model="probabilityOverrides.guinevereDamageTaken" type="checkbox">
        <span><strong>{{ $t('raidAssumeGuinevereDamageTaken') }}</strong><small>{{ $t('raidProbabilityHint') }}</small></span>
      </label>
      <label v-if="lineup.includes(RAID_TABLE_CHARACTER_IDS.CAROL)" class="raid-toggle-control">
        <input v-model="probabilityOverrides.carolSilence" type="checkbox">
        <span><strong>{{ $t('raidAssumeCarolSilence') }}</strong><small>{{ $t('raidProbabilityHint') }}</small></span>
      </label>
      <label v-if="lineup.includes(RAID_TABLE_CHARACTER_IDS.MORGANA)" class="raid-toggle-control">
        <input v-model="probabilityOverrides.morganaHealingDown" type="checkbox">
        <span><strong>{{ $t('raidAssumeMorganaHealingDown') }}</strong><small>{{ $t('raidProbabilityHint') }}</small></span>
      </label>
      <label v-if="lineup.includes(RAID_TABLE_CHARACTER_IDS.MOWANO)" class="raid-toggle-control">
        <input v-model="probabilityOverrides.mowanoDelay" type="checkbox">
        <span><strong>{{ $t('raidAssumeMowanoDelay') }}</strong><small>{{ $t('raidProbabilityHint') }}</small></span>
      </label>
      <label v-if="lineup.includes(RAID_TABLE_CHARACTER_IDS.MILLA)" class="raid-toggle-control">
        <input v-model="probabilityOverrides.millaDelay" type="checkbox">
        <span><strong>{{ $t('raidAssumeMillaDelay') }}</strong><small>{{ $t('raidProbabilityHint') }}</small></span>
      </label>
      <label v-if="lineup.includes(RAID_TABLE_CHARACTER_IDS.YILDIZ)" class="raid-toggle-control">
        <input v-model="probabilityOverrides.yildizBuffBlock" type="checkbox">
        <span><strong>{{ $t('raidAssumeYildizBuffBlock') }}</strong><small>{{ $t('raidProbabilityHint') }}</small></span>
      </label>
      <label v-if="lineup.includes(RAID_TABLE_CHARACTER_IDS.WINTER_STELLA)" class="raid-toggle-control">
        <input v-model="probabilityOverrides.winterStellaSilence" type="checkbox">
        <span><strong>{{ $t('raidAssumeWinterStellaSilence') }}</strong><small>{{ $t('raidProbabilityHint') }}</small></span>
      </label>
      <label v-if="lineup.includes(RAID_TABLE_CHARACTER_IDS.LILICOTTE)" class="raid-toggle-control">
        <input v-model="probabilityOverrides.lilicotteSilence" type="checkbox">
        <span><strong>{{ $t('raidAssumeLilicotteSilence') }}</strong><small>{{ $t('raidProbabilityHint') }}</small></span>
      </label>
      <label v-if="lineup.includes(RAID_TABLE_CHARACTER_IDS.LIEBES)" class="raid-toggle-control">
        <input v-model="probabilityOverrides.liebesStun" type="checkbox">
        <span><strong>{{ $t('raidAssumeLiebesStun') }}</strong><small>{{ $t('raidProbabilityHint') }}</small></span>
      </label>
      <label v-if="lineup.includes(RAID_TABLE_CHARACTER_IDS.ARTORIA)" class="raid-toggle-control">
        <input v-model="probabilityOverrides.artoriaStun" type="checkbox">
        <span><strong>{{ $t('raidAssumeArtoriaStun') }}</strong><small>{{ $t('raidProbabilityHint') }}</small></span>
      </label>
      <label v-if="lineup.includes(RAID_TABLE_CHARACTER_IDS.WITCH_PALADIA)" class="raid-toggle-control">
        <input v-model="probabilityOverrides.paladiaCriticalResistDown" type="checkbox">
        <span><strong>{{ $t('raidAssumeWitchPaladiaCriticalResistDown') }}</strong><small>{{ $t('raidProbabilityHint') }}</small></span>
      </label>
      <label v-if="lineup.includes(RAID_TABLE_CHARACTER_IDS.WITCH_ILLYA)" class="raid-number-control">
        <span><strong>{{ $t('raidWitchIllyaCurseUnleashedRound') }}</strong><small>{{ $t('raidWitchIllyaCurseUnleashedRoundHint') }}</small></span>
        <span class="raid-number-input"><input v-model.number="activationRounds.witchIllyaCurseUnleashed" type="number" min="1" max="10" step="1" @change="normalizeActivationRound('witchIllyaCurseUnleashed')"><em>{{ $t('raidRoundUnit') }}</em></span>
      </label>
      <label v-if="lineup.includes(RAID_TABLE_CHARACTER_IDS.CANDY_CERBERUS)" class="raid-number-control">
        <span><strong>{{ $t('raidCandyCerberusReviveRound') }}</strong><small>{{ $t('raidCandyCerberusReviveRoundHint') }}</small></span>
        <span class="raid-number-input"><input v-model.number="activationRounds.candyCerberusKindMagic" type="number" min="1" max="10" step="1" @change="normalizeActivationRound('candyCerberusKindMagic')"><em>{{ $t('raidRoundUnit') }}</em></span>
      </label>
    </div>

    <div class="raid-order-grid">
      <OrderList :title="$t('raidPositionOrder')" :items="lineup" :name-of="characterName" :up-label="$t('raidMoveUp')" :down-label="$t('raidMoveDown')" @move="moveItem(lineup, $event.index, $event.delta)" />
      <OrderList :title="$t('raidAttackPriority')" :items="attackPriority" :name-of="characterName" :up-label="$t('raidMoveUp')" :down-label="$t('raidMoveDown')" @move="moveItem(attackPriority, $event.index, $event.delta)" />
      <div class="raid-speed-editor">
        <h3>{{ $t('raidSpeedSettings') }}</h3>
        <div class="raid-speed-list">
          <label v-for="id in lineup" :key="`speed-${id}`">
            <CharacterLabel :id="id" /><input v-model.number="speeds[id]" type="number" min="0" step="1">
          </label>
        </div>
        <div class="raid-speed-order">
          <strong>{{ $t('raidSpeedOrder') }}</strong>
          <CharacterSequence :ids="currentSpeedOrder" />
          <small>{{ $t('raidSpeedOrderHint') }}</small>
        </div>
      </div>
    </div>

    <div class="raid-penetration-editor">
      <h3>{{ $t('raidPenetrationSettings') }}</h3>
      <p>{{ $t('raidPenetrationSettingsHint') }}</p>
      <div class="raid-penetration-scroll">
        <table>
          <thead><tr><th>{{ $t('raidCharacter') }}</th><th>{{ $t('raidCharacterLevel') }}</th><th>{{ $t('raidDefensePenetration') }}</th><th>{{ $t('raidPmDefensePenetration') }}</th></tr></thead>
          <tbody><tr v-for="id in lineup" :key="`penetration-${id}`">
            <th><CharacterLabel :id="id" /></th>
            <td><input v-model.number="levels[id]" type="number" min="1" step="1"></td>
            <td><input v-model.number="defensePenetrations[id]" type="number" min="0" step="1"></td>
            <td><input v-model.number="pmDefensePenetrations[id]" type="number" min="0" step="1"></td>
          </tr></tbody>
        </table>
      </div>
    </div>
  </section>

  <section class="card raid-matrix-card animate-fadeup">
    <div class="raid-section-head"><div><h2>{{ $t('raidMatrixTitle') }}</h2><p>{{ $t('raidSelectCellHint') }}</p></div></div>
    <div class="raid-table-scroll">
      <table class="raid-matrix-table">
        <thead><tr>
          <th class="raid-sticky-col">{{ $t('raidCharacter') }}</th>
          <th class="raid-sticky-total">{{ $t('raidCharacterTotal') }}</th>
          <th v-for="round in result.rounds" :key="round.turn">
            {{ $t('raidTurn', { n: round.turn }) }}
            <CharacterSequence :ids="round.actionOrder" compact class="raid-turn-order" />
          </th>
        </tr></thead>
        <tbody>
          <tr v-for="id in lineup" :key="id">
            <th class="raid-sticky-col raid-character-cell"><CharacterLabel :id="id" /><small>#{{ id }}</small></th>
            <td class="raid-row-total raid-sticky-total">
              {{ formatPercent(result.characterTotals[id].atkPercent) }}
              <small v-if="Object.keys(result.characterTotals[id].scalingTotals).length">+ {{ formatScaling(result.characterTotals[id].scalingTotals) }}</small>
              <small v-if="Object.keys(result.characterTotals[id].symbolicTotals).length">+ {{ formatSymbolic(result.characterTotals[id].symbolicTotals) }}</small>
            </td>
            <td v-for="round in result.rounds" :key="`${id}-${round.turn}`">
              <button type="button" class="raid-action-cell" :class="{ active: selectedEvent?.sequence === eventFor(round, id).sequence }" @click="selectedEvent = eventFor(round, id)">
                <strong>{{ $t(eventFor(round, id).skillNameKey) }}</strong>
                <span>{{ formatPercent(eventFor(round, id).effectiveAtkPercent) }}</span>
                <em v-if="Object.keys(eventFor(round, id).scalingTotals).length">+ {{ formatScaling(eventFor(round, id).scalingTotals) }}</em>
                <em v-if="Object.keys(eventFor(round, id).symbolicTotals).length">+ {{ formatSymbolic(eventFor(round, id).symbolicTotals) }}</em>
                <span v-if="modifierSummary(eventFor(round, id)).length" class="raid-cell-buffs">{{ modifierSummary(eventFor(round, id)).join(' · ') }}</span>
              </button>
            </td>
          </tr>
          <tr class="raid-boss-status-row">
            <th class="raid-sticky-col">{{ $t('raidBossStatus') }}</th>
            <td class="raid-sticky-total raid-boss-status-note">{{ $t('raidAfterRound') }}</td>
            <td v-for="round in result.rounds" :key="`boss-${round.turn}`" class="raid-boss-status-cell">
              <template v-if="round.bossStatusAfterRound.length">
                <span v-for="status in round.bossStatusAfterRound" :key="status.id">{{ bossStatusLabel(status) }}</span>
              </template>
              <small v-else>{{ $t('raidNoBossStatus') }}</small>
            </td>
          </tr>
        </tbody>
        <tfoot><tr>
          <th class="raid-sticky-col">{{ $t('raidRoundTotal') }}</th>
          <td class="raid-row-total raid-sticky-total">{{ formatPercent(result.teamAtkPercent) }}</td>
          <td v-for="round in result.rounds" :key="`total-${round.turn}`">
            <strong>{{ formatPercent(round.atkPercent) }}</strong>
            <small v-if="Object.keys(round.scalingTotals).length">+ {{ formatScaling(round.scalingTotals) }}</small>
            <small v-if="Object.keys(round.symbolicTotals).length">+ {{ formatSymbolic(round.symbolicTotals) }}</small>
          </td>
        </tr></tfoot>
      </table>
    </div>
  </section>

  <section v-if="selectedEvent" class="card raid-detail-card animate-fadeup">
    <div class="raid-section-head">
      <div><h2>{{ $t('raidActionDetails') }}</h2><p class="raid-detail-heading">{{ $t('raidTurn', { n: selectedEvent.turn }) }} · <CharacterLabel :id="selectedEvent.actorId" /> · {{ $t(selectedEvent.skillNameKey) }}</p></div>
      <strong class="raid-detail-total">{{ formatPercent(selectedEvent.effectiveAtkPercent) }}</strong>
    </div>
    <div class="raid-detail-grid">
      <div class="raid-detail-panel raid-detail-panel-wide">
        <h3>{{ $t('raidDamageSteps') }}</h3>
        <div v-if="selectedEvent.damageSteps.length" class="raid-step-list">
          <article v-for="step in selectedEvent.damageSteps" :key="step.index">
            <header><strong>#{{ step.index }} · {{ step.percent }}% {{ step.stat }}</strong><span>{{ formatStep(step) }}</span></header>
            <small>{{ $t('raidStepCritical', { value: formatter().format(step.criticalMultiplier) }) }} · {{ $t('raidStepDamageRate', { value: formatRate(step.damageRate) }) }} · {{ bossStackSummary(step.bossStatusBefore) }}</small>
            <small v-if="step.defense.applies">{{ $t('raidStepDefenseMultiplier', { value: formatter(4).format(step.defenseMultiplier) }) }} · {{ $t('raidStepDefenseMitigation', { value: formatRate(step.defense.defenseMitigationRate) }) }} · {{ $t(step.damageType === 'mag' ? 'raidStepMagicDefenseMitigation' : 'raidStepPhysicalDefenseMitigation', { value: formatRate(step.defense.pmDefenseMitigationRate) }) }}</small>
            <small v-else>{{ $t('raidStepDirectIgnoresDefense') }}</small>
            <small v-if="step.defense.applies">{{ $t('raidStepPenetrationValues', { level: step.defense.attackerLevel, defense: formatter().format(step.defense.defensePenetration), pm: formatter().format(step.defense.pmDefensePenetration) }) }}</small>
            <small v-if="step.scalingTerms.length">+ {{ formatScalingArray(step.scalingTerms) }}</small>
          </article>
        </div>
        <p v-else class="raid-muted">{{ $t('raidNoDamageSteps') }}</p>
      </div>

      <div class="raid-detail-panel">
        <h3>{{ $t('raidSpeedSnapshot') }}</h3>
        <dl class="raid-detail-list">
          <template v-for="id in result.rounds[selectedEvent.turn - 1].actionOrder" :key="`speed-detail-${id}`">
            <dt><CharacterLabel :id="id" /></dt><dd>{{ formatter().format(result.rounds[selectedEvent.turn - 1].speedSnapshot[id].effectiveSpeed) }}</dd>
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
        <p class="raid-muted">{{ $t('raidBuffCountTiming') }}</p>
        <dl class="raid-detail-list"><template v-for="id in lineup" :key="`buff-${id}`"><dt><CharacterLabel :id="id" /></dt><dd>{{ selectedEvent.removableBuffCountsAtActionStart[id] }} → {{ selectedEvent.removableBuffCountsAfterAction[id] }}</dd></template></dl>
        <h3 class="raid-subtitle">{{ $t('raidCooldownTitle') }}</h3>
        <dl class="raid-detail-list"><dt>{{ $t('raidCooldownBefore') }}</dt><dd>S1 {{ selectedEvent.cooldownsBefore.s1 }} · S2 {{ selectedEvent.cooldownsBefore.s2 }}</dd><dt>{{ $t('raidCooldownAfter') }}</dt><dd>S1 {{ selectedEvent.cooldownsAfter.s1 }} · S2 {{ selectedEvent.cooldownsAfter.s2 }}</dd></dl>
      </div>

      <div class="raid-detail-panel">
        <h3>{{ $t('raidAppliedEffects') }}</h3>
        <ul v-if="selectedEvent.effectsApplied.length" class="raid-detail-items compact"><li v-for="(effect, index) in selectedEvent.effectsApplied" :key="`${effect.type}-${effect.id}-${index}`">{{ effectText(effect) }}</li></ul>
        <p v-else class="raid-muted">—</p>
        <h3 class="raid-subtitle">{{ $t('raidBossStatus') }}</h3>
        <ul v-if="selectedEvent.bossStatusAfterAction.length" class="raid-detail-items compact"><li v-for="status in selectedEvent.bossStatusAfterAction" :key="status.id">{{ bossStatusLabel(status) }}</li></ul>
        <p v-else class="raid-muted">—</p>
      </div>

      <div class="raid-detail-panel">
        <h3>{{ $t('raidIgnoredEffects') }}</h3>
        <ul v-if="selectedEvent.ignoredKeys.length" class="raid-ignored-list"><li v-for="key in selectedEvent.ignoredKeys" :key="key">{{ $t(key) }}</li></ul><p v-else class="raid-muted">—</p>
      </div>

      <div class="raid-detail-panel raid-detail-panel-wide">
        <h3>{{ $t('raidActiveBuffs') }}</h3>
        <p v-if="modifierSummary(selectedEvent).length" class="raid-modifier-summary">{{ modifierSummary(selectedEvent).join(' · ') }}</p>
        <p v-else-if="!Object.keys(selectedEvent.scalingTotals).length" class="raid-muted">{{ $t('raidNoActiveBuffs') }}</p>
        <ul v-if="modifierBreakdown(selectedEvent).length" class="raid-detail-items raid-modifier-breakdown">
          <li v-for="item in modifierBreakdown(selectedEvent)" :key="item.channel">
            <strong>{{ item.label }} +{{ formatRate(item.total) }}</strong>
            <small>{{ item.sources.join(' · ') }}</small>
          </li>
        </ul>
        <div v-if="Object.keys(selectedEvent.scalingTotals).length" class="raid-symbolic-breakdown">
          <h3 class="raid-subtitle">{{ $t('raidSymbolicScaling') }}</h3>
          <ul class="raid-detail-items compact"><li v-for="term in Object.values(selectedEvent.scalingTotals)" :key="term.key">{{ formatScalingTerm(term) }}</li></ul>
        </div>
      </div>
    </div>
  </section>

  <section class="raid-warning-list animate-fadeup"><p v-for="warning in result.warnings" :key="warning">ℹ {{ $t(warning) }}</p></section>
</template>

<script setup>
import { computed, defineComponent, h, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RAID_BOSS_TEMPLATES, RAID_ELEMENTS, RAID_TABLE_CHARACTER_IDS, RAID_TABLE_CHARACTERS, RAID_TABLE_ROSTER, createDefaultRaidTableConfig } from '../constants/raidTableCharacters.js'
import { simulateRaidTable } from '../engine/raidTableCalc.js'

const OrderList = defineComponent({
  props: { title: { type: String, required: true }, items: { type: Array, required: true }, nameOf: { type: Function, required: true }, upLabel: { type: String, required: true }, downLabel: { type: String, required: true } },
  emits: ['move'],
  setup(props, { emit }) {
    return () => h('div', { class: 'raid-order-list' }, [h('h3', props.title), ...props.items.map((id, index) => h('div', { class: 'raid-order-row', key: id }, [
      h('span', { class: 'raid-order-rank' }, String(index + 1)), h(CharacterLabel, { id, strong: true }), h('div', { class: 'raid-order-actions' }, [
        h('button', { type: 'button', class: 'btn btn-ghost btn-sm', disabled: index === 0, title: props.upLabel, 'aria-label': `${props.upLabel} ${props.nameOf(id)}`, onClick: () => emit('move', { index, delta: -1 }) }, '↑'),
        h('button', { type: 'button', class: 'btn btn-ghost btn-sm', disabled: index === props.items.length - 1, title: props.downLabel, 'aria-label': `${props.downLabel} ${props.nameOf(id)}`, onClick: () => emit('move', { index, delta: 1 }) }, '↓'),
      ]),
    ]))])
  },
})

const { t, locale } = useI18n()

const CharacterLabel = defineComponent({
  props: {
    id: { type: Number, required: true },
    compact: { type: Boolean, default: false },
    hideName: { type: Boolean, default: false },
    strong: { type: Boolean, default: false },
  },
  setup(props) {
    return () => h(props.strong ? 'strong' : 'span', {
      class: ['raid-character-label', { compact: props.compact, 'icon-only': props.hideName }],
      title: props.hideName ? characterName(props.id) : undefined,
      'aria-label': props.hideName ? characterName(props.id) : undefined,
    }, [
      h('span', { class: 'raid-character-avatar', 'aria-hidden': 'true' }, [
        h('span', { class: 'raid-character-avatar-fallback' }, characterName(props.id).slice(0, 1)),
        h('img', { src: characterIconUrl(props.id), alt: '', onError: event => { event.currentTarget.style.display = 'none' } }),
      ]),
      props.hideName ? null : h('span', { class: 'raid-character-name' }, characterName(props.id)),
    ])
  },
})

const CharacterSequence = defineComponent({
  props: {
    ids: { type: Array, required: true },
    compact: { type: Boolean, default: false },
  },
  setup(props) {
    return () => h('span', { class: ['raid-character-sequence', { compact: props.compact }] }, props.ids.flatMap((id, index) => [
      index ? h('span', { class: 'raid-character-arrow', 'aria-hidden': 'true' }, '→') : null,
      h(CharacterLabel, { id, compact: props.compact, hideName: true, key: id }),
    ]))
  },
})

const roster = [...RAID_TABLE_ROSTER].sort((left, right) => left - right)
const elementFilters = Object.freeze([
  { element: RAID_ELEMENTS.BLUE, nameKey: 'raidElementBlue' },
  { element: RAID_ELEMENTS.RED, nameKey: 'raidElementRed' },
  { element: RAID_ELEMENTS.GREEN, nameKey: 'raidElementGreen' },
  { element: RAID_ELEMENTS.YELLOW, nameKey: 'raidElementYellow' },
  { element: RAID_ELEMENTS.LIGHT, nameKey: 'raidElementLight' },
  { element: RAID_ELEMENTS.DARK, nameKey: 'raidElementDark' },
])
const bossTemplates = Object.values(RAID_BOSS_TEMPLATES)
const defaults = createDefaultRaidTableConfig()
const selectedRosterElement = ref(null)
const lineup = ref([...defaults.lineup])
const attackPriority = ref([...defaults.attackPriority])
const speeds = reactive({ ...defaults.speeds })
const bossTemplateId = ref(defaults.bossTemplateId)
const levels = reactive({ ...defaults.levels })
const defensePenetrations = reactive({ ...defaults.defensePenetrations })
const pmDefensePenetrations = reactive({ ...defaults.pmDefensePenetrations })
const guaranteedCritical = ref(defaults.guaranteedCritical)
const baseCriticalDamagePercent = ref(roundBaseCriticalDamagePercent(defaults.baseCriticalDamageBonus * 100))
const probabilityOverrides = reactive({ ...defaults.probabilityOverrides })
const activationRounds = reactive({ ...defaults.activationRounds })
const selectedEvent = ref(null)
const filteredRoster = computed(() => selectedRosterElement.value == null
  ? roster
  : roster.filter(id => RAID_TABLE_CHARACTERS[id].element === selectedRosterElement.value))

const result = computed(() => simulateRaidTable({
  lineup: lineup.value,
  attackPriority: attackPriority.value,
  speeds,
  bossTemplateId: bossTemplateId.value,
  levels,
  defensePenetrations,
  pmDefensePenetrations,
  guaranteedCritical: guaranteedCritical.value,
  baseCriticalDamageBonus: Math.max(0, Number(baseCriticalDamagePercent.value) || 0) / 100,
  probabilityOverrides,
  activationRounds: Object.fromEntries(Object.keys(activationRounds).map(key => [key, normalizedActivationRound(key)])),
  turns: 10,
}))
const currentSpeedOrder = computed(() => result.value.rounds[0]?.actionOrder ?? [])
const selectedBossTemplate = computed(() => RAID_BOSS_TEMPLATES[bossTemplateId.value])
const bossTemplateStats = computed(() => t('raidBossTemplateStats', {
  level: selectedBossTemplate.value.level,
  defense: formatter().format(selectedBossTemplate.value.defense),
  physical: formatter().format(selectedBossTemplate.value.physicalDefense),
  magic: formatter().format(selectedBossTemplate.value.magicDefense),
}))

function characterName(id) { return t(RAID_TABLE_CHARACTERS[id].nameKey) }
function characterIconUrl(id) { return `${import.meta.env.BASE_URL}images/characters/${id}.png` }
function elementIconUrl(element) { return `${import.meta.env.BASE_URL}images/elements/icon_element_${element}.png` }
function counterLabel(id, key) { return t(RAID_TABLE_CHARACTERS[id].counterLabels?.[key] ?? key) }
function formatter(maximumFractionDigits = 2) { return new Intl.NumberFormat(locale.value, { maximumFractionDigits, minimumFractionDigits: 0 }) }
function roundBaseCriticalDamagePercent(value) { return Number((Number(value) || 0).toFixed(1)) }
function normalizeBaseCriticalDamagePercent() { baseCriticalDamagePercent.value = roundBaseCriticalDamagePercent(baseCriticalDamagePercent.value) }
function normalizedActivationRound(key) { return Math.min(10, Math.max(1, Math.trunc(Number(activationRounds[key]) || defaults.activationRounds[key] || 1))) }
function normalizeActivationRound(key) { activationRounds[key] = normalizedActivationRound(key) }
function formatPercent(value) { return `${formatter().format(value)}% ATK` }
function formatRate(value) { return `${formatter().format(value * 100)}%` }
function formatSymbolic(totals) { const entries = Object.entries(totals); return entries.length ? entries.map(([stat, value]) => `${formatter().format(value)}% ${stat}`).join(' + ') : '—' }
function valueSourceText(sourceId) { return t('raidValueSourceAttack', { source: characterName(sourceId) }) }
function formatScalingTerm(term) {
  const source = term.kind === 'sourceAttackOverTargetAttack' ? `（${valueSourceText(term.sourceId)}）` : ''
  return `${formatter().format(term.coefficient)}% ATK×(${term.key})${source}`
}
function formatScaling(totals) { return Object.values(totals).map(formatScalingTerm).join(' + ') }
function formatScalingArray(terms) { return terms.map(formatScalingTerm).join(' + ') }
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

function toggleRosterElement(element) {
  selectedRosterElement.value = selectedRosterElement.value === element ? null : element
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
  selectedRosterElement.value = null
  lineup.value = [...next.lineup]; attackPriority.value = [...next.attackPriority]
  Object.assign(speeds, next.speeds); guaranteedCritical.value = next.guaranteedCritical
  bossTemplateId.value = next.bossTemplateId
  Object.assign(levels, next.levels)
  Object.assign(defensePenetrations, next.defensePenetrations)
  Object.assign(pmDefensePenetrations, next.pmDefensePenetrations)
  baseCriticalDamagePercent.value = roundBaseCriticalDamagePercent(next.baseCriticalDamageBonus * 100)
  Object.assign(activationRounds, next.activationRounds)
  Object.assign(probabilityOverrides, next.probabilityOverrides); selectedEvent.value = null
}

const modifierChannels = [
  ['attackRate', 'raidAttackRate'],
  ['damageRate', 'raidDamageRate'],
  ['criticalDamageBonus', 'raidCriticalDamage'],
  ['defensePenetrationRate', 'raidDefensePenetration'],
]

function modifierTotals(step) {
  return Object.fromEntries(modifierChannels.map(([channel]) => [channel, step.modifierSources
    .filter(source => source.channel === channel)
    .reduce((total, source) => total + source.rate, 0)]))
}

function modifierSummary(event) {
  const firstStep = event.damageSteps[0]
  if (!firstStep) return []
  const totals = modifierTotals(firstStep)
  return modifierChannels.flatMap(([channel, labelKey]) => totals[channel] ? [`${t(labelKey)} +${formatRate(totals[channel])}`] : [])
}

function modifierBreakdown(event) {
  const firstStep = event.damageSteps[0]
  if (!firstStep) return []
  const totals = modifierTotals(firstStep)
  return modifierChannels.flatMap(([channel, labelKey]) => {
    const sources = firstStep.modifierSources
      .filter(source => source.channel === channel && source.rate)
      .map(source => `${t(source.nameKey)} +${formatRate(source.rate)}${source.copiedFromId != null ? `（${valueSourceText(source.sourceId)}）` : ''}`)
    return sources.length ? [{ channel, label: t(labelKey), total: totals[channel], sources }] : []
  })
}

function bossStackSummary(statuses) {
  if (!statuses.length) return t('raidNoBossStatus')
  return statuses.map(status => `${t(status.nameKey)}×${status.stacks}`).join(' · ')
}

function bossStatusLabel(status) {
  const source = status.sourceId != null ? `${characterName(status.sourceId)} · ` : ''
  const statusClass = status.statusClass === 'unremovableDebuff' ? t('raidStatusUnremovableDebuff') : t('raidStatusRemovableDebuff')
  const duration = status.remainingRounds != null ? ` · ${t('raidRemainingRounds', { n: status.remainingRounds })}` : ''
  const defenseRates = bossDefenseRateSummary(status)
  return `${source}${t(status.nameKey)} · ${statusClass} · ${t('raidStatusStacks', { n: status.stacks })}${defenseRates ? ` · ${defenseRates}` : ''}${duration}`
}

function statusClassLabel(statusClass) {
  if (statusClass === 'removableBuff') return t('raidStatusRemovable')
  if (statusClass === 'removableDebuff') return t('raidStatusRemovableDebuff')
  if (statusClass === 'unremovableDebuff') return t('raidStatusUnremovableDebuff')
  return t('raidStatusUnremovable')
}

function bossDefenseRateSummary(status) {
  return [
    ['raidDefenseRate', status.defenseRatePerStack],
    ['raidPhysicalDefenseRate', status.physicalDefenseRatePerStack],
    ['raidMagicDefenseRate', status.magicDefenseRatePerStack],
  ].filter(([, rate]) => rate).map(([key, rate]) => `${t(key)} ${rate > 0 ? '+' : ''}${formatRate(rate * status.stacks)}`).join(' · ')
}

function effectText(effect) {
  if (effect.skipped) return t('raidEffectSkipped', { effect: t(effect.nameKey) })
  if (effect.type === 'cooldownReduction') return t('raidEffectCooldownReduction', { target: characterName(effect.targetId), n: effect.amount })
  if (effect.type === 'cooldownReset') return t('raidEffectCooldownReset')
  if (effect.type === 'removeStatus') return t('raidEffectStatusRemoved', { target: characterName(effect.targetId), status: t(effect.nameKey) })
  if (effect.type === 'counter') return t('raidEffectCounter', { target: characterName(effect.targetId), effect: t(effect.nameKey), n: effect.after })
  if (effect.type === 'bossStatus') return `${characterName(effect.sourceId)} · ${t('raidEffectBossStatus', { effect: t(effect.nameKey), n: effect.stacks ?? 0 })}`
  if (effect.type === 'status' && effect.copiedFromId != null) return t('raidEffectCopiedStatus', {
    target: characterName(effect.targetId), status: t(effect.nameKey), from: characterName(effect.copiedFromId), valueSource: valueSourceText(effect.sourceId), n: effect.duration ?? '∞',
  })
  const sourceAttack = effect.symbolicModifiers?.find(modifier => modifier.kind === 'sourceAttackOverTargetAttack')
  if (effect.type === 'status' && sourceAttack) return t('raidEffectStatusWithValueSource', {
    target: characterName(effect.targetId), status: t(effect.nameKey), valueSource: valueSourceText(sourceAttack.sourceId), n: effect.duration ?? '∞',
  })
  if (effect.type === 'status') return t('raidEffectStatus', { target: characterName(effect.targetId), status: t(effect.nameKey), class: statusClassLabel(effect.statusClass), n: effect.duration ?? '∞' })
  return effect.type
}
</script>
