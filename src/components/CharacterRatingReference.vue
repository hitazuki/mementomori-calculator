<template>
  <section class="rating-reference">
    <p class="reference-note">{{ t('ratingReferenceHelp') }}</p>
    <details v-for="kind in kinds" :key="kind">
      <summary>{{ t('ratingReference_' + kind) }}</summary>
      <p lang="zh-CN">{{ assessment.quantitative[kind].note }}</p>
      <label>{{ t('ratingReferenceScenario') }}
        <select v-model="selection[kind]" class="form-select">
          <option v-for="scenario in assessment.quantitative[kind].assumptions" :key="scenario.key" :value="scenario.key">{{ scenario.label }}</option>
        </select>
      </label>
      <p class="reference-note" lang="zh-CN">{{ assumptions(kind) }}</p>
      <article v-for="state in assessment.quantitative[kind].states" :key="state.label">
        <h4 lang="zh-CN">{{ state.label }}</h4>
        <template v-if="kind === 'survival'">
          <div class="reference-table"><table>
            <thead><tr><th>{{ t('ratingReferencePath') }}</th><th>{{ t('ratingReferenceNoShield') }}</th><th>{{ t('ratingReferenceShield') }}</th></tr></thead>
            <tbody><tr v-for="type in ['physical', 'magic']" :key="type"><th>{{ t('ratingReference_' + type) }}</th><td>{{ number(comparison(state, kind)[type].withoutShield) }}×</td><td>{{ number(comparison(state, kind)[type].withShield) }}×</td></tr></tbody>
          </table></div>
          <p class="reference-note" lang="zh-CN">{{ survivalFactors(comparison(state, kind)) }}</p>
        </template>
        <template v-else>
          <strong>{{ t('ratingReferenceGain') }} {{ number(comparison(state, kind).gain) }}×</strong>
          <p class="reference-note" lang="zh-CN">{{ offenseFactors(comparison(state, kind)) }}</p>
        </template>
        <details class="reference-source"><summary>{{ t('ratingReferenceSource') }} · {{ state.evidence.join(' / ') }}</summary>
          <div v-for="source in sources(state)" :key="source.key" lang="zh-CN"><strong>{{ source.title }}</strong><p>{{ source.text }}</p></div>
        </details>
      </article>
      <p class="reference-note">{{ assessment.quantitative[kind].version }} · {{ assessment.quantitative[kind].reviewedAt }}</p>
    </details>
  </section>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
const props = defineProps({ assessment: { type: Object, required: true } })
const { t } = useI18n()
const selection = reactive({ survival: 'reference', offense: 'reference' })
const kinds = computed(() => ['survival', 'offense'].filter(kind => props.assessment.quantitative?.[kind]))
const number = value => value.toFixed(2)
const percent = value => (value * 100).toFixed(0) + '%'
const comparison = (state, kind) => state.comparisons.find(row => row.scenario === selection[kind])
const sources = state => props.assessment.sources.filter(source => state.evidence.includes(source.key))
function assumptions(kind) {
  const s = props.assessment.quantitative[kind].assumptions.find(s => s.key === selection[kind])
  const common = '有效防御/防御定数=' + s.defenseRatio + '（防御、物魔防御两路分别计算）；已有增伤=' + percent(s.damageBonus)
  return kind === 'survival' ? common + '；攻击/生命=' + number(s.attackToHp) + '。不含普通回复、闪避、屏障次数与代承伤。'
    : common + '；已有加攻=' + percent(s.attackBonus) + '；暴率=' + percent(s.critRate) + '；暴击倍率=' + s.critMultiplier + '；贯通/贯通定数=' + s.penetrationRatio + '；生命/攻击=' + s.hpToAttack + '；防御/攻击=' + s.defenseToAttack + '。不含命中与技能倍率，仅攻击基准且可暴击、受双防作用的伤害。'
}
function survivalFactors(result) {
  const f = result.physical.factors, m = result.magic.factors
  return '容量=(' + number(f.hp) + '生命 + ' + number(f.shield) + '护盾) × ' + number(f.defense) + '防御路 × 物理' + number(f.specificDefense) + '/魔法' + number(m.specificDefense) + '物魔路 × ' + number(f.damage) + '增伤减伤路 × ' + number(f.block) + '独立阻绝。无盾列将护盾取0。'
}
function offenseFactors(result) {
  const f = result.factors
  return number(f.attack) + '攻击 × ' + number(f.damage) + '增伤 × ' + number(f.critical) + '暴击期望 × ' + number(f.defense) + '防御路 × ' + number(f.specificDefense) + '物魔路。相对移除本组效果的同面板参照。'
}
</script>

<style scoped>
.rating-reference { margin:16px 0; border-top:1px solid var(--border-subtle); padding-top:10px; font-size:var(--fs-sm); }
summary { cursor:pointer; color:var(--gold); padding:8px 0; }
p { line-height:1.7; overflow-wrap:anywhere; }
.reference-note { color:var(--text-secondary); font-size:var(--fs-xs); }
label { display:flex; flex-wrap:wrap; gap:10px; align-items:center; }
select { width:auto; max-width:100%; }
article { border-top:1px solid var(--border-subtle); margin-top:14px; }
h4 { margin:12px 0; }
.reference-table { overflow-x:auto; }
table { width:100%; border-collapse:collapse; }
th,td { text-align:left; padding:8px; border-bottom:1px solid var(--border-subtle); }
td { color:var(--gold); font-variant-numeric:tabular-nums; }
.reference-source p { white-space:pre-line; }
</style>
