<template>
  <div class="view-header animate-fadeup">
    <h1 class="view-title">🪵 {{ $t('raidTableTitle') }}</h1>
    <p class="view-desc">{{ $t('raidTableDesc') }}</p>
  </div>

  <section class="raid-summary-grid animate-fadeup">
    <div class="stat-box raid-summary-primary">
      <div class="stat-value">{{ formatPercent(result.teamAtkPercent) }}</div>
      <div v-for="term in conversionStatEntries(result.conversionTotals)" :key="term.stat" class="stat-value">{{ formatConversionTotal(term) }}</div>
      <div v-if="conversionSourceEntries(result.conversionTotals).length" class="raid-summary-extra">{{ $t('raidIncludedConversionScaling', { terms: formatConversionSources(conversionSourceEntries(result.conversionTotals)) }) }}</div>
      <div class="stat-label">{{ $t('raidTeamAtkTotal') }}</div>
    </div>
    <div class="stat-box raid-summary-symbolic">
      <div v-for="([stat, value]) in symbolicEntries(result.symbolicTotals)" :key="stat" class="stat-value">{{ formatStat(value, stat) }}</div>
      <div v-if="!symbolicEntries(result.symbolicTotals).length" class="stat-value">—</div>
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
      <article
        v-for="id in filteredRoster"
        :key="id"
        class="raid-roster-item"
        :class="{ selected: lineup.includes(id) }"
      >
        <button
          type="button"
          class="raid-roster-select"
          :disabled="(!lineup.includes(id) && lineup.length >= 5) || (lineup.includes(id) && lineup.length <= 1)"
          :aria-pressed="lineup.includes(id)"
          @click="toggleCharacter(id)"
        >
          <CharacterLabel :id="id" strong /><small>#{{ id }} · {{ $t('raidBaseSpeed') }} {{ speeds[id] }}</small>
        </button>
        <button
          type="button"
          class="raid-roster-detail-button"
          :aria-label="$t('raidViewCharacterDetailsFor', { name: characterName(id) })"
          :title="$t('raidViewCharacterDetails')"
          @click="openCharacterDetails(id)"
        >
          <span aria-hidden="true">i</span>
        </button>
      </article>
    </div>
    <p v-else class="raid-roster-empty">{{ $t('raidNoCharactersForElement') }}</p>

    <div class="raid-assumption-grid">
      <div class="raid-number-control">
        <span>
          <strong>{{ $t('raidElementBonusTitle') }}</strong>
          <small v-for="line in elementBonusLines" :key="line">{{ line }}</small>
        </span>
      </div>
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
      <label v-if="lineup.includes(RAID_TABLE_CHARACTER_IDS.WARM_MEMORY_SOLTINA)" class="raid-toggle-control">
        <input v-model="probabilityOverrides.warmMemorySoltinaStun" type="checkbox">
        <span><strong>{{ $t('raidAssumeWarmMemorySoltinaStun') }}</strong><small>{{ $t('raidProbabilityHint') }}</small></span>
      </label>
      <label v-if="lineup.includes(RAID_TABLE_CHARACTER_IDS.WITCH_ILLYA)" class="raid-number-control">
        <span><strong>{{ $t('raidWitchIllyaCurseUnleashedRound') }}</strong><small>{{ $t('raidWitchIllyaCurseUnleashedRoundHint') }}</small></span>
        <span class="raid-number-input"><input v-model.number="activationRounds.witchIllyaCurseUnleashed" type="number" min="1" max="10" step="1" @change="normalizeActivationRound('witchIllyaCurseUnleashed')"><em>{{ $t('raidRoundUnit') }}</em></span>
      </label>
      <label v-if="lineup.includes(RAID_TABLE_CHARACTER_IDS.CANDY_CERBERUS)" class="raid-number-control">
        <span><strong>{{ $t('raidCandyCerberusReviveRound') }}</strong><small>{{ $t('raidCandyCerberusReviveRoundHint') }}</small></span>
        <span class="raid-number-input"><input v-model.number="activationRounds.candyCerberusKindMagic" type="number" min="1" max="10" step="1" @change="normalizeActivationRound('candyCerberusKindMagic')"><em>{{ $t('raidRoundUnit') }}</em></span>
      </label>
      <label v-if="lineup.includes(RAID_TABLE_CHARACTER_IDS.SIVI)" class="raid-number-control raid-select-control">
        <span><strong>{{ $t('raidSiviDamageTier') }}</strong><small>{{ $t('raidSiviDamageTierHint') }}</small></span>
        <select v-model.number="scenarioTiers.siviReactiveBladeIncomingHits">
          <option v-for="tier in siviDamageTiers" :key="tier.hits" :value="tier.hits">{{ $t('raidSiviDamageTierOption', { hits: tier.hits, rate: tier.rate }) }}</option>
        </select>
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
          <thead><tr><th>{{ $t('raidCharacter') }}</th><th>{{ $t('raidCharacterLevel') }}</th><th>{{ $t('raidBaseCriticalDamage') }}</th><th>{{ $t('raidDefensePenetration') }}</th><th>{{ $t('raidPmDefensePenetration') }}</th></tr></thead>
          <tbody><tr v-for="id in lineup" :key="`penetration-${id}`">
            <th><CharacterLabel :id="id" /></th>
            <td><input v-model.number="levels[id]" type="number" min="1" step="1"></td>
            <td><span class="raid-number-input"><input v-model.number="criticalDamagePercents[id]" type="number" min="0" step="0.1" @change="normalizeCriticalDamagePercent(id)"><em>%</em></span></td>
            <td><input v-model.number="defensePenetrations[id]" type="number" min="0" step="1"></td>
            <td><input v-model.number="pmDefensePenetrations[id]" type="number" min="0" step="1"></td>
          </tr></tbody>
        </table>
      </div>
    </div>
  </section>

  <section class="card raid-matrix-card animate-fadeup">
    <div class="raid-section-head">
      <div><h2>{{ $t('raidMatrixTitle') }}</h2><p>{{ $t('raidSelectCellHint') }}</p></div>
      <div class="raid-section-actions">
        <button type="button" class="btn btn-ghost btn-sm" @click="openRaidExport">▣ {{ $t('raidExportImage') }}</button>
        <button type="button" class="btn btn-ghost btn-sm" @click="openActionOrderEditor()">
          ↕ {{ $t('raidAdjustActionOrder') }}<template v-if="manualOrderCount"> · {{ $t('raidAdjustedRoundCount', { n: manualOrderCount }) }}</template>
        </button>
      </div>
    </div>
    <div class="raid-table-scroll">
      <table class="raid-matrix-table">
        <thead><tr>
          <th class="raid-sticky-col">{{ $t('raidCharacter') }}</th>
          <th class="raid-sticky-total">{{ $t('raidCharacterTotal') }}</th>
          <th v-for="round in result.rounds" :key="round.turn">
            <span>{{ $t('raidTurn', { n: round.turn }) }}</span>
            <button
              type="button"
              class="raid-turn-order-button"
              :class="{ manual: round.orderSource === 'manual' }"
              :aria-label="$t('raidEditRoundOrder', { n: round.turn })"
              @click="openActionOrderEditor(round.turn)"
            >
              <CharacterSequence :ids="round.actionOrder" compact class="raid-turn-order" />
              <small>{{ $t(round.orderSource === 'manual' ? 'raidOrderManual' : 'raidOrderAutomatic') }}</small>
            </button>
            <span v-if="round.orderSource === 'manual'" class="raid-turn-speed-reference">
              <small>{{ $t('raidSpeedReference') }}</small>
              <CharacterSequence :ids="round.speedOrder" compact />
            </span>
          </th>
        </tr></thead>
        <tbody>
          <tr v-for="id in lineup" :key="id">
            <th class="raid-sticky-col raid-character-cell"><CharacterLabel :id="id" /><small>#{{ id }}</small></th>
            <td class="raid-row-total raid-sticky-total">
              {{ formatPercent(result.characterTotals[id].atkPercent) }}
              <small v-for="term in conversionStatEntries(result.characterTotals[id].conversionTotals)" :key="term.stat" class="raid-converted-stat">{{ formatConversionTotal(term) }}</small>
              <small v-if="conversionSourceEntries(result.characterTotals[id].conversionTotals, id).length" class="raid-conversion-sources">{{ $t('raidIncludedConversionScaling', { terms: formatConversionSources(conversionSourceEntries(result.characterTotals[id].conversionTotals, id)) }) }}</small>
              <small v-if="Object.keys(includedScaling(result.characterTotals[id].scalingTotals)).length">{{ $t('raidIncludedSourceAttackScaling', { terms: formatScaling(includedScaling(result.characterTotals[id].scalingTotals)) }) }}</small>
              <small v-if="Object.keys(unresolvedScaling(result.characterTotals[id].scalingTotals)).length">+ {{ formatScaling(unresolvedScaling(result.characterTotals[id].scalingTotals)) }}</small>
              <small v-if="Object.keys(result.characterTotals[id].symbolicTotals).length" class="raid-converted-stat">+ {{ formatSymbolic(result.characterTotals[id].symbolicTotals) }}</small>
            </td>
            <td v-for="round in result.rounds" :key="`${id}-${round.turn}`">
              <button type="button" class="raid-action-cell" :class="{ active: selectedEvent?.sequence === eventFor(round, id).sequence }" @click="selectedEvent = eventFor(round, id)">
                <strong>{{ $t(eventFor(round, id).skillNameKey) }}</strong>
                <span>{{ formatPercent(eventFor(round, id).effectiveAtkPercent) }}</span>
                <span v-for="term in conversionStatEntries(eventFor(round, id).conversionTotals)" :key="term.stat" class="raid-converted-stat">{{ formatConversionTotal(term) }}</span>
                <em v-if="conversionSourceEntries(eventFor(round, id).conversionTotals, id).length">{{ $t('raidIncludedConversionScaling', { terms: formatConversionSources(conversionSourceEntries(eventFor(round, id).conversionTotals, id)) }) }}</em>
                <em v-if="Object.keys(includedScaling(eventFor(round, id).scalingTotals)).length">{{ $t('raidIncludedSourceAttackScaling', { terms: formatScaling(includedScaling(eventFor(round, id).scalingTotals)) }) }}</em>
                <em v-if="Object.keys(unresolvedScaling(eventFor(round, id).scalingTotals)).length">+ {{ formatScaling(unresolvedScaling(eventFor(round, id).scalingTotals)) }}</em>
                <span v-if="Object.keys(eventFor(round, id).symbolicTotals).length" class="raid-converted-stat">+ {{ formatSymbolic(eventFor(round, id).symbolicTotals) }}</span>
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
          <td class="raid-row-total raid-sticky-total">
            {{ formatPercent(result.teamAtkPercent) }}
            <small v-for="term in conversionStatEntries(result.conversionTotals)" :key="term.stat" class="raid-converted-stat">{{ formatConversionTotal(term) }}</small>
            <small v-if="conversionSourceEntries(result.conversionTotals).length" class="raid-conversion-sources">{{ $t('raidIncludedConversionScaling', { terms: formatConversionSources(conversionSourceEntries(result.conversionTotals)) }) }}</small>
            <small v-if="Object.keys(result.symbolicTotals).length" class="raid-converted-stat">+ {{ formatSymbolic(result.symbolicTotals) }}</small>
          </td>
          <td v-for="round in result.rounds" :key="`total-${round.turn}`">
            <strong>{{ formatPercent(round.atkPercent) }}</strong>
            <small v-for="term in conversionStatEntries(round.conversionTotals)" :key="term.stat" class="raid-converted-stat">{{ formatConversionTotal(term) }}</small>
            <small v-if="conversionSourceEntries(round.conversionTotals).length" class="raid-conversion-sources">{{ $t('raidIncludedConversionScaling', { terms: formatConversionSources(conversionSourceEntries(round.conversionTotals)) }) }}</small>
            <small v-if="Object.keys(round.symbolicTotals).length" class="raid-converted-stat">+ {{ formatSymbolic(round.symbolicTotals) }}</small>
          </td>
        </tr></tfoot>
      </table>
    </div>
  </section>

  <section v-if="selectedEvent" class="card raid-detail-card animate-fadeup">
    <div class="raid-section-head">
      <div><h2>{{ $t('raidActionDetails') }}</h2><p class="raid-detail-heading">{{ $t('raidTurn', { n: selectedEvent.turn }) }} · <CharacterLabel :id="selectedEvent.actorId" /> · {{ $t(selectedEvent.skillNameKey) }}</p></div>
      <div class="raid-detail-total"><strong>{{ formatPercent(selectedEvent.effectiveAtkPercent) }}</strong><small v-for="term in conversionStatEntries(selectedEvent.conversionTotals)" :key="term.stat">{{ formatConversionTotal(term) }}</small><small v-if="conversionSourceEntries(selectedEvent.conversionTotals, selectedEvent.actorId).length" class="raid-conversion-sources">{{ $t('raidIncludedConversionScaling', { terms: formatConversionSources(conversionSourceEntries(selectedEvent.conversionTotals, selectedEvent.actorId)) }) }}</small></div>
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
            <small v-if="visibleScalingTerms(step).length" class="raid-converted-stat">+ {{ formatScalingArray(visibleScalingTerms(step), selectedEvent.actorId) }}</small>
          </article>
        </div>
        <p v-else class="raid-muted">{{ $t('raidNoDamageSteps') }}</p>
      </div>

      <div class="raid-detail-panel">
        <h3>{{ $t('raidSpeedSnapshot') }}</h3>
        <dl class="raid-detail-list">
          <template v-for="id in result.rounds[selectedEvent.turn - 1].speedOrder" :key="`speed-detail-${id}`">
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
        <h3 class="raid-subtitle">{{ $t('raidStatusSnapshot') }}</h3>
        <dl class="raid-detail-list">
          <dt>{{ $t('raidCooldownBefore') }}</dt>
          <dd><ul v-if="actorStatuses(selectedEvent, 'statusSnapshotBeforeAction').length" class="raid-detail-items compact"><li v-for="status in actorStatuses(selectedEvent, 'statusSnapshotBeforeAction')" :key="`before-${status.effectGroupId}-${status.sourceId}-${status.appliedSequence}`">{{ actorStatusText(status) }}</li></ul><span v-else>—</span></dd>
          <dt>{{ $t('raidCooldownAfter') }}</dt>
          <dd><ul v-if="actorStatuses(selectedEvent, 'statusSnapshotAfterAction').length" class="raid-detail-items compact"><li v-for="status in actorStatuses(selectedEvent, 'statusSnapshotAfterAction')" :key="`after-${status.effectGroupId}-${status.sourceId}-${status.appliedSequence}`">{{ actorStatusText(status) }}</li></ul><span v-else>—</span></dd>
        </dl>
        <h3 class="raid-subtitle">{{ $t('raidCooldownTitle') }}</h3>
        <dl class="raid-detail-list"><dt>{{ $t('raidCooldownBefore') }}</dt><dd>S1 {{ selectedEvent.cooldownsBefore.s1 }} · S2 {{ selectedEvent.cooldownsBefore.s2 }}</dd><dt>{{ $t('raidCooldownAfter') }}</dt><dd>S1 {{ selectedEvent.cooldownsAfter.s1 }} · S2 {{ selectedEvent.cooldownsAfter.s2 }}</dd></dl>
      </div>

      <div class="raid-detail-panel">
        <h3>{{ $t('raidAppliedEffects') }}</h3>
        <ul v-if="selectedEvent.effectsApplied.length" class="raid-detail-items compact"><li v-for="(effect, index) in selectedEvent.effectsApplied" :key="`${effect.type}-${effect.id}-${index}`">{{ effectText(effect) }}</li></ul>
        <p v-else class="raid-muted">—</p>
        <h3 class="raid-subtitle">{{ $t('raidExpiredEffects') }}</h3>
        <ul v-if="selectedEvent.expiredEffects.length" class="raid-detail-items compact"><li v-for="status in selectedEvent.expiredEffects" :key="`expired-${status.effectGroupId}-${status.sourceId}-${status.appliedSequence}`">{{ actorStatusText(status, false) }}</li></ul>
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
        <p v-else-if="!Object.keys(selectedEvent.scalingTotals).length && !Object.keys(selectedEvent.symbolicTotals).length" class="raid-muted">{{ $t('raidNoActiveBuffs') }}</p>
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
        <div v-if="Object.keys(selectedEvent.symbolicTotals).length" class="raid-symbolic-breakdown">
          <h3 class="raid-subtitle">{{ $t('raidSymbolicDamage') }}</h3>
          <p class="raid-detail-converted-stat">{{ formatSymbolic(selectedEvent.symbolicTotals) }}</p>
        </div>
      </div>
    </div>
  </section>

  <section class="raid-warning-list animate-fadeup"><p v-for="warning in result.warnings" :key="warning">ℹ {{ $t(warning) }}</p></section>

  <RaidExportPreview
    v-if="raidExportSnapshot"
    :model="raidExportSnapshot.model"
    :theme="raidExportSnapshot.theme"
    :filename="raidExportSnapshot.filename"
    @close="raidExportSnapshot = null"
  />

  <Teleport to="body">
    <div
      v-if="selectedCharacterDetail"
      ref="characterDetailDialog"
      class="modal-overlay active"
      role="dialog"
      aria-modal="true"
      aria-labelledby="raid-character-detail-title"
      tabindex="-1"
      @keydown.esc.stop="closeCharacterDetails"
      @mousedown.self="closeCharacterDetails"
    >
      <div class="modal-content raid-character-detail-modal">
        <div class="modal-header raid-character-detail-header">
          <div>
            <span class="raid-character-detail-kicker">{{ $t('raidCharacterDetails') }}</span>
            <h2 id="raid-character-detail-title" class="modal-title"><CharacterLabel :id="selectedCharacterDetail.id" strong /></h2>
          </div>
          <button type="button" class="modal-close" :aria-label="$t('raidCloseCharacterDetails')" @click="closeCharacterDetails">&times;</button>
        </div>
        <div class="modal-body raid-character-detail-body">
          <div class="raid-character-detail-meta">
            <span><img :src="elementIconUrl(selectedCharacterDetail.element)" alt="">{{ $t(elementNameKey(selectedCharacterDetail.element)) }}</span>
            <span>{{ $t(jobNameKey(selectedCharacterDetail.jobFlags)) }}</span>
            <span>#{{ selectedCharacterDetail.id }}</span>
            <span>{{ $t('raidBaseSpeed') }} {{ selectedCharacterDetail.speed }}</span>
          </div>
          <p class="raid-character-detail-scope">{{ $t('raidCharacterDetailScopeHint') }}</p>

          <section v-if="selectedCharacterDetail.passiveItems.length" class="raid-character-passive-section">
            <h3>{{ $t('raidCharacterModeledPassives') }}</h3>
            <ul class="raid-character-effect-list">
              <li v-for="(effect, index) in selectedCharacterDetail.passiveItems" :key="`${effect.nameKey}-${index}`">
                <span>{{ $t(effect.nameKey) }}</span>
                <small class="raid-character-effect-scope">{{ characterEffectScopeText(effect) }}</small>
                <small v-if="characterEffectConditionText(effect)">{{ characterEffectConditionText(effect) }}</small>
                <small v-if="characterEffectDetailText(effect)">{{ characterEffectDetailText(effect) }}</small>
              </li>
            </ul>
          </section>

          <div class="raid-character-skill-grid">
            <article v-for="skill in selectedCharacterDetail.skills" :key="skill.key" class="raid-character-skill-card">
              <header>
                <span class="raid-character-skill-slot">{{ skill.key.toUpperCase() }}</span>
                <div><h3>{{ $t(skill.nameKey) }}</h3><p>{{ skillMetaText(skill) }}</p></div>
              </header>

              <section>
                <h4>{{ $t('raidCharacterDamageSummary') }}</h4>
                <ul v-if="skill.damageSteps.length" class="raid-character-damage-list">
                  <li v-for="(step, index) in skill.damageSteps" :key="`${skill.key}-step-${index}`">
                    <strong>{{ $t('raidCharacterDamageStep', { n: index + 1 }) }}</strong>
                    <span>{{ characterDamageStepText(step) }}</span>
                    <small v-if="step.conditionKey">{{ $t(step.conditionKey) }}</small>
                    <small v-if="step.originalTargetCount">{{ $t('raidCharacterOriginalTargetCount', { n: step.originalTargetCount }) }}</small>
                  </li>
                </ul>
                <p v-else class="raid-muted">{{ $t('raidNoDamageSteps') }}</p>
              </section>

              <section>
                <h4>{{ $t('raidCharacterModeledEffects') }}</h4>
                <ul v-if="skill.effectItems.length" class="raid-character-effect-list">
                  <li v-for="(effect, index) in skill.effectItems" :key="`${effect.nameKey}-${index}`">
                    <span>{{ $t(effect.nameKey) }}</span>
                    <small class="raid-character-effect-scope">{{ characterEffectScopeText(effect) }}</small>
                    <small v-if="characterEffectConditionText(effect)">{{ characterEffectConditionText(effect) }}</small>
                    <small v-if="characterEffectDetailText(effect)">{{ characterEffectDetailText(effect) }}</small>
                  </li>
                </ul>
                <p v-else class="raid-muted">{{ $t('raidCharacterNoModeledEffects') }}</p>
              </section>

              <section v-if="skill.ignoredKeys.length" class="raid-character-ignored-section">
                <h4>{{ $t('raidIgnoredEffects') }}</h4>
                <ul class="raid-character-effect-list ignored">
                  <li v-for="key in skill.ignoredKeys" :key="key">{{ $t(key) }}</li>
                </ul>
              </section>
            </article>
          </div>

          <section class="raid-character-mb-section">
            <div class="raid-character-mb-heading">
              <h3>{{ $t('raidCharacterMbOriginalText') }}</h3>
              <p>{{ $t('raidCharacterMbOriginalTextHint') }}</p>
            </div>
            <p v-if="characterMbTextsLoading" class="raid-muted">{{ $t('raidCharacterMbLoading') }}</p>
            <div v-else class="raid-character-mb-list">
              <article v-for="skill in selectedCharacterMbTexts" :key="`${skill.source}-${skill.id}`" class="raid-character-mb-card">
                <header>
                  <span class="raid-character-skill-slot">{{ skill.slot }}</span>
                  <div><strong>{{ skill.name }}</strong></div>
                </header>
                <ul class="raid-character-mb-levels">
                  <li v-for="level in skill.levels" :key="`${level.type}-${level.level}`">
                    <span>{{ mbLevelLabel(level) }}</span>
                    <p>{{ level.text }}</p>
                  </li>
                </ul>
              </article>
            </div>
          </section>
        </div>
      </div>
    </div>
  </Teleport>

  <Teleport to="body">
    <div
      v-if="showActionOrderEditor"
      ref="actionOrderDialog"
      class="modal-overlay active"
      role="dialog"
      aria-modal="true"
      aria-labelledby="raid-action-order-editor-title"
      tabindex="-1"
      @keydown.esc.stop="closeActionOrderEditor"
      @mousedown.self="closeActionOrderEditor"
    >
      <div class="modal-content raid-action-order-modal">
        <div class="modal-header">
          <h2 id="raid-action-order-editor-title" class="modal-title">{{ $t('raidActionOrderEditorTitle') }}</h2>
          <button type="button" class="modal-close" :aria-label="$t('raidCloseActionOrderEditor')" @click="closeActionOrderEditor">&times;</button>
        </div>
        <div class="modal-body raid-action-order-modal-body">
          <p class="raid-order-editor-hint">{{ $t('raidActionOrderEditorHint') }}</p>
          <article
            v-for="round in result.rounds"
            :key="`order-editor-${round.turn}`"
            :ref="element => setRoundOrderCardRef(round.turn, element)"
            class="raid-round-order-card"
            :class="{ manual: round.orderSource === 'manual', editing: editingOrderRound === round.turn }"
          >
            <button type="button" class="raid-round-order-summary" @click="startRoundOrderEdit(round.turn)">
              <strong>{{ $t('raidTurn', { n: round.turn }) }}</strong>
              <CharacterSequence :ids="round.actionOrder" compact />
              <span class="raid-order-source" :class="round.orderSource">{{ $t(round.orderSource === 'manual' ? 'raidOrderManual' : 'raidOrderAutomatic') }}</span>
            </button>
            <div v-if="editingOrderRound === round.turn" class="raid-round-order-editor">
              <div class="raid-round-speed-reference">
                <span>{{ $t('raidSpeedReference') }}</span>
                <CharacterSequence :ids="round.speedOrder" compact />
              </div>
              <p>{{ $t('raidRoundOrderHint') }}</p>
              <div class="raid-round-order-list">
                <div v-for="(id, index) in orderDraft" :key="`draft-${round.turn}-${id}`" class="raid-round-order-row">
                  <span class="raid-order-rank">{{ index + 1 }}</span>
                  <CharacterLabel :id="id" strong />
                  <small>{{ $t('raidEffectiveSpeed', { value: formatter().format(round.speedSnapshot[id].effectiveSpeed) }) }}</small>
                  <div class="raid-order-actions">
                    <button type="button" class="btn btn-ghost btn-sm" :disabled="index === 0" :aria-label="`${$t('raidMoveUp')} ${characterName(id)}`" @click="moveDraftOrder(index, -1)">↑</button>
                    <button type="button" class="btn btn-ghost btn-sm" :disabled="index === orderDraft.length - 1" :aria-label="`${$t('raidMoveDown')} ${characterName(id)}`" @click="moveDraftOrder(index, 1)">↓</button>
                  </div>
                </div>
              </div>
              <div class="raid-round-order-actions">
                <button v-if="round.orderSource === 'manual'" type="button" class="btn btn-ghost btn-sm" @click="restoreSpeedOrder(round.turn)">{{ $t('raidRestoreSpeedOrder') }}</button>
                <span></span>
                <button type="button" class="btn btn-ghost btn-sm" @click="cancelRoundOrderEdit">{{ $t('raidCancel') }}</button>
                <button type="button" class="btn btn-primary btn-sm" @click="applyRoundOrder">{{ $t('raidApply') }}</button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, defineComponent, h, nextTick, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RAID_BOSS_TEMPLATES, RAID_ELEMENTS, RAID_JOB_FLAGS, RAID_TABLE_CHARACTER_IDS, RAID_TABLE_CHARACTERS, RAID_TABLE_ROSTER, createDefaultRaidTableConfig } from '../constants/raidTableCharacters.js'
import { loadRaidCharacterMbTexts } from '../constants/raid/characterMbTexts.js'
import { simulateRaidTable } from '../engine/raidTableCalc.js'
import RaidExportPreview from '../components/raid/RaidExportPreview.vue'
import { buildRaidCharacterDetail } from '../utils/raidCharacterDetails.js'
import { buildRaidExportModel, raidExportFilename } from '../utils/raidExport.js'
import { currentTheme } from '../utils/themeStore.js'

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
const actionOrderOverrides = ref(cloneActionOrderOverrides(defaults.actionOrderOverrides))
const speeds = reactive({ ...defaults.speeds })
const bossTemplateId = ref(defaults.bossTemplateId)
const levels = reactive({ ...defaults.levels })
const defensePenetrations = reactive({ ...defaults.defensePenetrations })
const pmDefensePenetrations = reactive({ ...defaults.pmDefensePenetrations })
const criticalDamagePercents = reactive(Object.fromEntries(Object.entries(defaults.criticalDamageBonuses).map(([id, value]) => [id, roundCriticalDamagePercent(value * 100)])))
const guaranteedCritical = ref(defaults.guaranteedCritical)
const probabilityOverrides = reactive({ ...defaults.probabilityOverrides })
const activationRounds = reactive({ ...defaults.activationRounds })
const scenarioTiers = reactive({ ...defaults.scenarioTiers })
const siviDamageTiers = Object.freeze([
  { hits: 0, rate: 30 }, { hits: 1, rate: 54 }, { hits: 2, rate: 72 }, { hits: 3, rate: 84 }, { hits: 4, rate: 90 },
])
const selectedEvent = ref(null)
const selectedCharacterId = ref(null)
const raidExportSnapshot = ref(null)
const showActionOrderEditor = ref(false)
const editingOrderRound = ref(null)
const orderDraft = ref([])
const actionOrderDialog = ref(null)
const characterDetailDialog = ref(null)
const roundOrderCardRefs = new Map()
const filteredRoster = computed(() => selectedRosterElement.value == null
  ? roster
  : roster.filter(id => RAID_TABLE_CHARACTERS[id].element === selectedRosterElement.value))
const selectedCharacterDetail = computed(() => selectedCharacterId.value == null
  ? null
  : buildRaidCharacterDetail(RAID_TABLE_CHARACTERS[selectedCharacterId.value]))
const characterMbTextsByLocale = reactive({})
const characterMbTextsLoading = ref(false)
let characterMbTextRequest = 0
const selectedCharacterMbTexts = computed(() => characterMbTextsByLocale[locale.value]?.[selectedCharacterId.value] ?? [])

watch([selectedCharacterId, locale], async ([id, currentLocale]) => {
  const request = ++characterMbTextRequest
  if (id == null || characterMbTextsByLocale[currentLocale]) {
    characterMbTextsLoading.value = false
    return
  }
  characterMbTextsLoading.value = true
  try {
    const texts = await loadRaidCharacterMbTexts(currentLocale)
    characterMbTextsByLocale[currentLocale] = texts
  } finally {
    if (request === characterMbTextRequest) characterMbTextsLoading.value = false
  }
})

const result = computed(() => simulateRaidTable({
  lineup: lineup.value,
  attackPriority: attackPriority.value,
  actionOrderOverrides: actionOrderOverrides.value,
  speeds,
  bossTemplateId: bossTemplateId.value,
  levels,
  defensePenetrations,
  pmDefensePenetrations,
  criticalDamageBonuses: Object.fromEntries(Object.keys(criticalDamagePercents).map(id => [id, Math.max(0, Number(criticalDamagePercents[id]) || 0) / 100])),
  guaranteedCritical: guaranteedCritical.value,
  probabilityOverrides,
  activationRounds: Object.fromEntries(Object.keys(activationRounds).map(key => [key, normalizedActivationRound(key)])),
  scenarioTiers: { ...scenarioTiers },
  turns: 10,
}))
const currentSpeedOrder = computed(() => result.value.rounds[0]?.speedOrder ?? [])
const manualOrderCount = computed(() => result.value.rounds.filter(round => round.orderSource === 'manual').length)

const probabilityScenarioDefinitions = Object.freeze([
  [RAID_TABLE_CHARACTER_IDS.LIBERIA, 'liberiaSand', 'raidAssumeLiberiaSand'],
  [RAID_TABLE_CHARACTER_IDS.SPRING_SHIZU, 'shizuSpeedDown', 'raidAssumeShizuSpeedDown'],
  [RAID_TABLE_CHARACTER_IDS.GUINEVERE, 'guinevereDamageTaken', 'raidAssumeGuinevereDamageTaken'],
  [RAID_TABLE_CHARACTER_IDS.CAROL, 'carolSilence', 'raidAssumeCarolSilence'],
  [RAID_TABLE_CHARACTER_IDS.MORGANA, 'morganaHealingDown', 'raidAssumeMorganaHealingDown'],
  [RAID_TABLE_CHARACTER_IDS.MOWANO, 'mowanoDelay', 'raidAssumeMowanoDelay'],
  [RAID_TABLE_CHARACTER_IDS.MILLA, 'millaDelay', 'raidAssumeMillaDelay'],
  [RAID_TABLE_CHARACTER_IDS.YILDIZ, 'yildizBuffBlock', 'raidAssumeYildizBuffBlock'],
  [RAID_TABLE_CHARACTER_IDS.WINTER_STELLA, 'winterStellaSilence', 'raidAssumeWinterStellaSilence'],
  [RAID_TABLE_CHARACTER_IDS.LILICOTTE, 'lilicotteSilence', 'raidAssumeLilicotteSilence'],
  [RAID_TABLE_CHARACTER_IDS.LIEBES, 'liebesStun', 'raidAssumeLiebesStun'],
  [RAID_TABLE_CHARACTER_IDS.ARTORIA, 'artoriaStun', 'raidAssumeArtoriaStun'],
  [RAID_TABLE_CHARACTER_IDS.WITCH_PALADIA, 'paladiaCriticalResistDown', 'raidAssumeWitchPaladiaCriticalResistDown'],
  [RAID_TABLE_CHARACTER_IDS.WARM_MEMORY_SOLTINA, 'warmMemorySoltinaStun', 'raidAssumeWarmMemorySoltinaStun'],
])

watch(() => result.value.config.actionOrderOverrides, normalized => {
  if (sameActionOrderOverrides(actionOrderOverrides.value, normalized)) return
  actionOrderOverrides.value = cloneActionOrderOverrides(normalized)
  selectedEvent.value = null
})
const elementBonusLines = computed(() => {
  const { normal, dark } = result.value.config.elementBonus
  const lines = []
  if (normal.phase > 0) lines.push(t('raidElementBonusNormalPhase', {
    phase: normal.phase,
    hp: formatter().format(normal.hpRate * 100),
    attack: formatter().format(normal.attackRate * 100),
  }))
  if (dark.count > 0) {
    const effects = []
    if (dark.defenseRate) effects.push(`${t('raidElementBonusDefense')} +${formatter().format(dark.defenseRate * 100)}%`)
    if (dark.hpDrainRate) effects.push(`${t('raidElementBonusHpDrain')} +${formatter().format(dark.hpDrainRate * 100)}%`)
    if (dark.defensePenetration) effects.push(`${t('raidDefensePenetration')} +${formatter().format(dark.defensePenetration)}`)
    if (dark.damageReflectRate) effects.push(`${t('raidElementBonusDamageReflect')} +${formatter().format(dark.damageReflectRate * 100)}%`)
    if (dark.criticalDamageBonus) effects.push(`${t('raidCriticalDamage')} +${formatter().format(dark.criticalDamageBonus * 100)}%`)
    lines.push(`${t('raidElementBonusDarkCount', { count: dark.count })}：${effects.join(' · ')}`)
  }
  return lines.length ? lines : [t('raidElementBonusNone')]
})
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
function elementNameKey(element) { return elementFilters.find(option => option.element === element)?.nameKey ?? 'raidCharacterUnknown' }
function jobNameKey(jobFlags) {
  if (jobFlags === RAID_JOB_FLAGS.WARRIOR) return 'raidJobWarrior'
  if (jobFlags === RAID_JOB_FLAGS.SNIPER) return 'raidJobSniper'
  if (jobFlags === RAID_JOB_FLAGS.MAGE) return 'raidJobMage'
  return 'raidCharacterUnknown'
}
function counterLabel(id, key) { return t(RAID_TABLE_CHARACTERS[id].counterLabels?.[key] ?? key) }
function formatter(maximumFractionDigits = 2) { return new Intl.NumberFormat(locale.value, { maximumFractionDigits, minimumFractionDigits: 0 }) }
function roundCriticalDamagePercent(value) { return Number((Number(value) || 0).toFixed(1)) }
function normalizeCriticalDamagePercent(id) { criticalDamagePercents[id] = roundCriticalDamagePercent(criticalDamagePercents[id]) }
function normalizedActivationRound(key) { return Math.min(10, Math.max(1, Math.trunc(Number(activationRounds[key]) || defaults.activationRounds[key] || 1))) }
function normalizeActivationRound(key) { activationRounds[key] = normalizedActivationRound(key) }
function formatPercent(value) { return `${formatter().format(value)}% ATK` }
function formatRate(value) { return `${formatter().format(value * 100)}%` }
function formatStat(value, stat) { return `${formatter().format(value)}% ${stat}` }
function symbolicEntries(totals) { return Object.entries(totals) }
function formatSymbolic(totals) { const entries = symbolicEntries(totals); return entries.length ? entries.map(([stat, value]) => formatStat(value, stat)).join(' + ') : '—' }
function conversionEntries(totals) { return Object.values(totals) }
function conversionStatEntries(totals) {
  return Object.values(conversionEntries(totals).reduce((entries, term) => {
    if (!entries[term.stat]) entries[term.stat] = { stat: term.stat, value: 0 }
    entries[term.stat].value += term.value
    return entries
  }, {}))
}
function conversionSourceEntries(totals, ownerId = null) { return conversionEntries(totals).filter(term => ownerId == null || term.sourceId !== ownerId) }
function formatConversionTotal(term) { return `+ ${formatStat(term.value, term.stat)}` }
function formatConversionExportTotals(totals) { return conversionStatEntries(totals).map(term => formatStat(term.value, term.stat)) }
function formatConversionSources(terms) { return terms.map(term => `${formatStat(term.value, term.stat)}（${valueSourceText(term.sourceId, term.stat)}）`).join(' + ') }
function valueSourceText(sourceId, stat = 'ATK') { return t(stat === 'DEF' ? 'raidValueSourceDefense' : 'raidValueSourceAttack', { source: characterName(sourceId) }) }
function formatScalingTerm(term, ownerId = null) {
  if (term.kind === 'targetBaseDefenseOverTargetAttack') return `${formatStat(term.coefficient, 'DEF')}${term.valueSourceId === ownerId ? '' : `（${valueSourceText(term.valueSourceId, 'DEF')}）`}`
  const source = term.kind === 'sourceAttackOverTargetAttack' ? `（${valueSourceText(term.valueSourceId ?? term.sourceId)}）` : ''
  return `${formatter().format(term.coefficient)}% ATK×(${term.key})${source}`
}
function formatScaling(totals) { return Object.values(totals).map(formatScalingTerm).join(' + ') }
function formatScalingArray(terms, ownerId = null) { return terms.map(term => formatScalingTerm(term, ownerId)).join(' + ') }
function visibleScalingTerms(step) { return step.scalingTerms.filter(term => (
  term.kind === 'targetBaseDefenseOverTargetAttack' || term.valueSourceId !== selectedEvent.value?.actorId
)) }
function includedScaling(totals) { return Object.fromEntries(Object.entries(totals).filter(([, term]) => term.kind === 'sourceAttackOverTargetAttack')) }
function unresolvedScaling(totals) { return Object.fromEntries(Object.entries(totals).filter(([, term]) => term.kind !== 'sourceAttackOverTargetAttack')) }
function formatStep(step) { return `${formatter().format(step.effectivePercent)}% ${step.stat}` }
function formatCharacterValueRange(range, suffix = '') {
  if (range.min == null) return t('raidCharacterDynamicValue')
  const min = formatter().format(range.min)
  const max = formatter().format(range.max)
  return `${min}${range.max !== range.min ? `–${max}` : ''}${suffix}`
}
function characterDamageStepText(step) {
  return t('raidCharacterDamageFormula', {
    hits: formatCharacterValueRange(step.hits),
    percent: formatCharacterValueRange(step.percent, '%'),
    stat: step.stat,
  })
}
function skillMetaText(skill) {
  const type = t({ phys: 'raidDamageTypePhysical', mag: 'raidDamageTypeMagic', direct: 'raidDamageTypeDirect', support: 'raidDamageTypeSupport' }[skill.damageType] ?? 'raidCharacterUnknown')
  return `${type} · ${t('raidCharacterCooldownValue', { n: skill.cooldown })}`
}
const characterEffectChannelKeys = {
  attackRate: 'raidAttackRate', damageRate: 'raidDamageRate', criticalDamageBonus: 'raidCriticalDamage',
  speedRate: 'raidCharacterSpeedRate', cooldownRecoveryBonus: 'raidCharacterCooldownRecovery', defensePenetrationRate: 'raidDefensePenetration',
  defenseRate: 'raidDefenseRate', physicalDefenseRate: 'raidPhysicalDefenseRate', magicDefenseRate: 'raidMagicDefenseRate',
}
function formatCharacterEffectRate({ channel, rate }) {
  if (rate.min == null) return `${t(characterEffectChannelKeys[channel] ?? channel)} ${t('raidCharacterDynamicValue')}`
  const min = rate.min * 100
  const max = rate.max * 100
  const signed = value => `${value > 0 ? '+' : ''}${formatter().format(value)}%`
  return `${t(characterEffectChannelKeys[channel] ?? channel)} ${signed(min)}${max !== min ? `～${signed(max)}` : ''}`
}
const characterEffectTargetKeys = {
  self: 'raidCharacterTargetSelf', boss: 'raidCharacterTargetBoss', eventSource: 'raidCharacterTargetEventSource',
  all: 'raidCharacterTargetAllAllies', allOther: 'raidCharacterTargetAllOtherAllies', adjacent: 'raidCharacterTargetAdjacentAllies',
  topAttack: 'raidCharacterTargetTopAttack', topAttackOther: 'raidCharacterTargetTopAttackOther', selfAndTopAttackOther: 'raidCharacterTargetSelfAndTopAttackOther',
  lowestSpeedOther: 'raidCharacterTargetLowestSpeedOther', lowestSpeedOthers: 'raidCharacterTargetLowestSpeedOthers', selfAndLowestSpeedOthers: 'raidCharacterTargetSelfAndLowestSpeedOthers',
  highestSpeedOther: 'raidCharacterTargetHighestSpeedOther', highestBuffCount: 'raidCharacterTargetHighestBuffCount', highestBuffCountOther: 'raidCharacterTargetHighestBuffCountOther',
  internal: 'raidCharacterTargetInternal', event: 'raidCharacterTargetEvent',
}
const characterEffectTimingKeys = {
  permanent: 'raidCharacterTimingPermanent', battleStart: 'raidCharacterTimingBattleStart', roundStart: 'raidCharacterTimingRoundStart',
  actionStart: 'raidCharacterTimingActionStart', beforeDamage: 'raidCharacterTimingBeforeDamage', afterHit: 'raidCharacterTimingAfterHit',
  afterCriticalHit: 'raidCharacterTimingAfterCriticalHit', afterDamage: 'raidCharacterTimingAfterDamage', actionEnd: 'raidCharacterTimingActionEnd',
  afterDamageStep: 'raidCharacterTimingAfterDamageStep',
}
const characterEffectEventKeys = {
  activeSkillHeal: 'raidCharacterEventActiveSkillHeal', criticalHit: 'raidCharacterEventCriticalHit',
  normalAttack: 'raidCharacterEventNormalAttack', selfDamage: 'raidCharacterEventSelfDamage',
}
function characterEffectTargetText(target, count = null, element = null) {
  let text = t(characterEffectTargetKeys[target] ?? 'raidCharacterTargetUnknown')
  if (count != null) text += t('raidCharacterTargetCountSuffix', { n: count })
  if (element != null) text += t('raidCharacterTargetElementSuffix', { element: t(elementNameKey(element)) })
  return text
}
function characterEffectTimingText(effect) {
  const parts = []
  if (effect.trigger === 'event') parts.push(t(characterEffectEventKeys[effect.event] ?? 'raidCharacterEventUnknown'))
  else if (effect.trigger) parts.push(t(characterEffectTimingKeys[effect.trigger] ?? 'raidCharacterTimingUnknown'))
  if (effect.everyRounds != null) {
    const start = effect.roundOffset ?? effect.everyRounds
    parts.push(effect.everyRounds === 1
      ? t('raidCharacterScheduleFromRound', { n: start })
      : t('raidCharacterScheduleEveryRounds', { n: effect.everyRounds, start }))
  }
  if (effect.every != null) {
    const start = effect.offset ?? effect.every
    parts.push(effect.every === 1
      ? t('raidCharacterScheduleFromAction', { n: start })
      : t('raidCharacterScheduleEveryActions', { n: effect.every, start }))
  }
  if (effect.once) parts.push(t('raidCharacterScheduleOnce'))
  return parts.join(' · ')
}
function characterEffectScopeText(effect) {
  const parts = [t('raidCharacterEffectTarget', { target: characterEffectTargetText(effect.target, effect.targetCount, effect.targetElement) })]
  if (effect.sourceTarget) parts.push(t('raidCharacterEffectSource', { target: characterEffectTargetText(effect.sourceTarget) }))
  const timing = characterEffectTimingText(effect)
  if (timing) parts.push(t('raidCharacterEffectTiming', { timing }))
  return parts.join(' · ')
}
function characterConditionText(condition) {
  const element = value => t(elementNameKey(value))
  const args = { n: condition.count, round: condition.round, skill: condition.skillKey?.toUpperCase(), element: condition.element == null ? '' : element(condition.element), elements: (condition.elements ?? []).map(element).join('/') }
  const keys = {
    actorHasStatus: 'raidCharacterConditionActorHasStatus', actorRemovableBuffCountAtLeast: 'raidCharacterConditionActorBuffCountAtLeast',
    anyRemovableBuffCountAtLeast: 'raidCharacterConditionAnyBuffCountAtLeast', bossElementIs: 'raidCharacterConditionBossElementIs',
    bossStacksAtLeast: 'raidCharacterConditionBossStacksAtLeast', bossStatusCountAtLeast: 'raidCharacterConditionBossStatusCountAtLeast',
    configuredActivationRoundReached: 'raidCharacterConditionConfiguredRound', counterAtLeast: 'raidCharacterConditionCounterAtLeast',
    counterAtMost: 'raidCharacterConditionCounterAtMost', counterBeforeActionAtLeast: 'raidCharacterConditionCounterBeforeActionAtLeast',
    eventSourceHasStatus: 'raidCharacterConditionEventSourceHasStatus', eventSourceIsOwner: 'raidCharacterConditionEventSourceIsOwner',
    eventTargetsIncludeOwner: 'raidCharacterConditionEventTargetsIncludeOwner', guaranteedCritical: 'raidCharacterConditionGuaranteedCritical',
    otherLineupElementCountAtLeast: 'raidCharacterConditionOtherElementCountAtLeast', probabilityEnabled: 'raidCharacterConditionProbabilityEnabled',
    roundAtLeast: 'raidCharacterConditionRoundAtLeast', roundAtMost: 'raidCharacterConditionRoundAtMost',
    skillUsesAtLeast: 'raidCharacterConditionSkillUsesAtLeast', skillUsesAtMost: 'raidCharacterConditionSkillUsesAtMost',
    targetElementIn: 'raidCharacterConditionTargetElementIn', targetElementNot: 'raidCharacterConditionTargetElementNot',
    targetElementNotIn: 'raidCharacterConditionTargetElementNotIn', targetHasStatus: 'raidCharacterConditionTargetHasStatus',
    targetLacksStatus: 'raidCharacterConditionTargetLacksStatus', targetRemovableDebuffCountAtMost: 'raidCharacterConditionTargetDebuffCountAtMost',
  }
  return t(keys[condition.type] ?? 'raidCharacterConditionUnknown', args)
}
function characterEffectConditionText(effect) {
  const conditions = (effect.conditions ?? []).map(characterConditionText)
  conditions.push(...(effect.targetConditions ?? []).map(condition => t('raidCharacterTargetCondition', { condition: characterConditionText(condition) })))
  return conditions.length ? t('raidCharacterEffectCondition', { condition: conditions.join(' · ') }) : ''
}
function characterEffectDetailText(effect) {
  const parts = [...effect.modifiers, ...effect.bossRates].map(formatCharacterEffectRate)
  if (effect.type === 'cooldownReduction' && effect.amount != null) parts.push(t('raidCharacterCooldownReductionAmount', { n: effect.amount }))
  if (effect.type === 'changeCounter' && effect.amount != null) parts.push(t('raidCharacterCounterChangeAmount', { n: `${effect.amount > 0 ? '+' : ''}${effect.amount}` }))
  if (effect.type === 'setCooldown' && effect.value != null) parts.push(t('raidCharacterCooldownSetValue', { n: effect.value }))
  if (effect.duration != null) parts.push(t('raidCharacterEffectDurationActions', { n: effect.duration }))
  if (effect.durationRounds != null) parts.push(t('raidCharacterEffectDurationRounds', { n: effect.durationRounds }))
  if (effect.maxStacks > 1) parts.push(t('raidCharacterMaxStacks', { n: effect.maxStacks }))
  return parts.join(' · ')
}
function mbLevelLabel(level) {
  return t(level.type === 'exclusive' ? 'raidCharacterMbExclusiveLevel' : 'raidCharacterMbSkillLevel', { n: level.level })
}
function eventFor(round, id) { return round.actions.find(action => action.actorId === id) }

function cloneActionOrderOverrides(overrides) {
  return Object.fromEntries(Object.entries(overrides ?? {}).map(([round, order]) => [round, [...order]]))
}

function sameOrder(left, right) {
  return left?.length === right?.length && left.every((id, index) => id === right[index])
}

function sameActionOrderOverrides(left, right) {
  const leftRounds = Object.keys(left)
  const rightRounds = Object.keys(right)
  return leftRounds.length === rightRounds.length && leftRounds.every(round => sameOrder(left[round], right[round]))
}

function startRoundOrderEdit(turn) {
  const round = result.value.rounds[turn - 1]
  editingOrderRound.value = turn
  orderDraft.value = [...round.actionOrder]
}

function setRoundOrderCardRef(turn, element) {
  if (element) roundOrderCardRefs.set(turn, element)
  else roundOrderCardRefs.delete(turn)
}

function openActionOrderEditor(turn = null) {
  showActionOrderEditor.value = true
  if (turn == null) cancelRoundOrderEdit()
  else startRoundOrderEdit(turn)
  nextTick(() => {
    actionOrderDialog.value?.focus()
    if (turn != null) roundOrderCardRefs.get(turn)?.scrollIntoView({ block: 'center' })
  })
}

function closeActionOrderEditor() {
  showActionOrderEditor.value = false
  cancelRoundOrderEdit()
}

function cancelRoundOrderEdit() {
  editingOrderRound.value = null
  orderDraft.value = []
}

function moveDraftOrder(index, delta) {
  const next = index + delta
  if (next < 0 || next >= orderDraft.value.length) return
  const copy = [...orderDraft.value]; [copy[index], copy[next]] = [copy[next], copy[index]]
  orderDraft.value = copy
}

function applyRoundOrder() {
  const turn = editingOrderRound.value
  if (turn == null) return
  const speedOrder = result.value.rounds[turn - 1].speedOrder
  const next = cloneActionOrderOverrides(actionOrderOverrides.value)
  if (sameOrder(orderDraft.value, speedOrder)) delete next[turn]
  else next[turn] = [...orderDraft.value]
  actionOrderOverrides.value = next
  selectedEvent.value = null
  cancelRoundOrderEdit()
}

function restoreSpeedOrder(turn) {
  const next = cloneActionOrderOverrides(actionOrderOverrides.value)
  delete next[turn]
  actionOrderOverrides.value = next
  selectedEvent.value = null
  cancelRoundOrderEdit()
}

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
  actionOrderOverrides.value = {}
  selectedEvent.value = null
}

function openCharacterDetails(id) {
  selectedCharacterId.value = id
  nextTick(() => characterDetailDialog.value?.focus())
}

function closeCharacterDetails() {
  selectedCharacterId.value = null
}

function toggleRosterElement(element) {
  selectedRosterElement.value = selectedRosterElement.value === element ? null : element
}

function activeRaidScenarioLines() {
  const lines = probabilityScenarioDefinitions
    .filter(([id, key]) => lineup.value.includes(id) && result.value.config.probabilityOverrides[key])
    .map(([, , labelKey]) => t(labelKey))
  if (lineup.value.includes(RAID_TABLE_CHARACTER_IDS.WITCH_ILLYA)) {
    lines.push(`${t('raidWitchIllyaCurseUnleashedRound')}：${t('raidTurn', { n: result.value.config.activationRounds.witchIllyaCurseUnleashed })}`)
  }
  if (lineup.value.includes(RAID_TABLE_CHARACTER_IDS.CANDY_CERBERUS)) {
    lines.push(`${t('raidCandyCerberusReviveRound')}：${t('raidTurn', { n: result.value.config.activationRounds.candyCerberusKindMagic })}`)
  }
  if (lineup.value.includes(RAID_TABLE_CHARACTER_IDS.SIVI)) {
    const hits = result.value.config.scenarioTiers.siviReactiveBladeIncomingHits
    const rate = siviDamageTiers.find(tier => tier.hits === hits)?.rate ?? 30
    lines.push(`${t('raidSiviDamageTier')}：${t('raidSiviDamageTierOption', { hits, rate })}`)
  }
  return lines
}

function openRaidExport() {
  const generatedAt = new Date()
  const model = buildRaidExportModel({
    result: result.value,
    lineup: lineup.value,
    attackPriority: attackPriority.value,
    characters: RAID_TABLE_CHARACTERS,
    bossName: t(selectedBossTemplate.value.nameKey),
    bossStats: bossTemplateStats.value,
    generatedAt,
    locale: locale.value,
    characterName,
    skillName: key => t(key),
    iconUrl: characterIconUrl,
    turnLabel: turn => t('raidTurn', { n: turn }),
    formatPercent,
    formatSymbolic,
    formatConversionTotals: formatConversionExportTotals,
    bossStatusText: bossStatusLabel,
    elementBonusLines: elementBonusLines.value,
    scenarioLines: activeRaidScenarioLines(),
    warningLines: result.value.warnings.map(key => t(key)),
    labels: {
      title: t('raidMatrixTitle'), generatedAt: t('raidExportGeneratedAt'),
      previewTitle: t('raidExportPreviewTitle'), previewHint: t('raidExportPreviewHint'),
      close: t('raidExportClose'), copy: t('raidExportCopy'), download: t('raidExportDownload'),
      generating: t('raidExportGenerating'), loadingAssets: t('raidExportLoadingAssets'), rendering: t('raidExportRendering'), generatingHint: t('raidExportGeneratingHint'), ready: t('raidExportReady'), copied: t('raidExportCopied'), downloaded: t('raidExportDownloaded'),
      copyUnavailable: t('raidExportCopyUnavailable'), copyFailed: t('raidExportCopyFailed'), generateFailed: t('raidExportGenerateFailed'), previewAlt: t('raidExportPreviewAlt'),
      position: t('raidPositionOrder'), attackPriority: t('raidAttackPriority'), assumptions: t('raidExportAssumptions'),
      guaranteedCritical: t('raidGuaranteedCritical'), enabled: t('raidExportEnabled'), disabled: t('raidExportDisabled'), scenarios: t('raidExportScenarios'),
      panelStats: t('raidPenetrationSettings'), character: t('raidCharacter'), level: t('raidCharacterLevel'), speed: t('raidBaseSpeed'),
      criticalDamage: t('raidBaseCriticalDamage'), defensePenetration: t('raidDefensePenetration'), pmDefensePenetration: t('raidPmDefensePenetration'),
      matrix: t('raidMatrixTitle'), characterTotal: t('raidCharacterTotal'), manual: t('raidOrderManual'), automatic: t('raidOrderAutomatic'),
      bossStatus: t('raidBossStatus'), afterRound: t('raidExportAfterRound'), roundTotal: t('raidRoundTotal'),
    },
  })
  raidExportSnapshot.value = {
    model,
    filename: raidExportFilename(t(selectedBossTemplate.value.nameKey), generatedAt),
    theme: currentTheme.value,
  }
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
  actionOrderOverrides.value = cloneActionOrderOverrides(next.actionOrderOverrides)
  Object.assign(speeds, next.speeds); guaranteedCritical.value = next.guaranteedCritical
  bossTemplateId.value = next.bossTemplateId
  Object.assign(levels, next.levels)
  Object.assign(defensePenetrations, next.defensePenetrations)
  Object.assign(pmDefensePenetrations, next.pmDefensePenetrations)
  Object.assign(criticalDamagePercents, Object.fromEntries(Object.entries(next.criticalDamageBonuses).map(([id, value]) => [id, roundCriticalDamagePercent(value * 100)])))
  Object.assign(activationRounds, next.activationRounds)
  Object.assign(scenarioTiers, next.scenarioTiers)
  Object.assign(probabilityOverrides, next.probabilityOverrides); selectedEvent.value = null
  raidExportSnapshot.value = null
  closeCharacterDetails()
  closeActionOrderEditor()
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

function actorStatuses(event, snapshotKey) {
  return event[snapshotKey]?.[event.actorId]?.statuses ?? []
}

function actorStatusText(status, includeDuration = true) {
  const duration = includeDuration
    ? ` · ${status.remainingActions == null ? t('raidPermanent') : t('raidRemainingActions', { n: status.remainingActions })}`
    : ''
  return `${t(status.nameKey)} · ${statusClassLabel(status.statusClass)}${duration}`
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
  if (effect.type === 'removeStatus') {
    const removedNameKey = effect.nameKey ?? effect.removed?.[0]?.nameKey
    const status = removedNameKey ? t(removedNameKey) : effect.statusId
    return t('raidEffectStatusRemoved', { target: characterName(effect.targetId), status })
  }
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
