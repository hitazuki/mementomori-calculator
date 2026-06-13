<template>
  <div class="view-header animate-fadeup">
    <h1 class="view-title">{{ $t('mysteriumTitle') }}</h1>
    <p class="view-desc">{{ $t('mysteriumDesc') }}</p>
  </div>

  <div class="grid-sidebar mysterium-layout animate-fadeup" style="align-items:start;gap:16px;">
    <!-- Left Sidebar: Scoring Settings -->
    <div class="mysterium-settings" style="display: flex; flex-direction: column; max-height: calc(100vh - 120px);">
      <div class="panel" style="margin-bottom: 16px; background: rgba(201,168,76,0.1); border-color: rgba(201,168,76,0.3);">
        <h3 class="panel-title" style="color: var(--gold);">{{ $t('ui_weight_title') }}</h3>
        <p style="font-size: var(--fs-sm); color: var(--text-muted); margin-bottom: 12px;">
          {{ $t('ui_weight_desc') }}
        </p>
      </div>
      <div style="flex:1; overflow-y: auto; padding-right: 4px; padding-bottom: 32px;">
        <div v-for="(items, group) in groupedTemplate" :key="group" class="panel" style="margin-bottom: 12px; padding: 12px;">
          <h3 class="panel-title" style="margin-bottom: 8px; font-size: var(--fs-md);">{{ $t(group) }}</h3>
          <div class="form-group" style="gap: 4px;">
            <div v-for="item in items" :key="item.key + item.ctype" style="display: flex; align-items: center; justify-content: space-between; padding: 2px 0; font-size: var(--fs-sm); gap: 8px;">
              <div style="display: flex; gap: 6px; overflow: hidden; white-space: nowrap; flex: 1;">
                <span style="overflow:hidden; text-overflow:ellipsis;" :title="(item.key === 'appLevelCap' ? $t('appLevelCap') : $t(item.key)) + ' ' + getCtypeStr(item.ctype)">
                  {{ item.key === 'appLevelCap' ? $t('appLevelCap') : $t(item.key) }} 
                  <span style="color:var(--text-muted); font-size: var(--fs-xs);">{{ getCtypeStr(item.ctype) }}</span>
                </span>
                <span style="color:var(--gold); flex-shrink: 0;">+{{ item.ctype === 2 ? item.baseVal*100+'%' : item.baseVal }}</span>
              </div>
              <input class="form-input score-input" type="number" step="1" v-model.number="item.score" style="width:52px; text-align:center; padding: 2px 4px; min-height: var(--control-h-sm); flex-shrink: 0;">
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Main: Results -->
    <div class="mysterium-results" style="display: flex; flex-direction: column; gap: 12px; max-height: calc(100vh - 120px); min-width: 0;">
      <!-- Top Controls -->
      <div style="display: flex; flex-direction: column; gap: 8px; flex-shrink: 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <!-- Tabs -->
          <div class="segmented-control mysterium-tabs">
            <button class="btn btn-sm" :class="mainTab === 'colls' ? 'btn-primary' : 'btn-ghost'" @click="mainTab = 'colls'">{{ $t('ui_tab_colls') }}</button>
            <button class="btn btn-sm" :class="mainTab === 'chars' ? 'btn-primary' : 'btn-ghost'" @click="mainTab = 'chars'">{{ $t('ui_tab_chars') }}</button>
          </div>
          <!-- Algorithms -->
          <div v-show="mainTab === 'chars'" class="segmented-control mysterium-algos">
            <button class="btn btn-sm" :class="algo === 1 ? 'btn-primary' : 'btn-ghost'" @click="algo = 1">{{ $t('ui_algo1') }}</button>
            <button class="btn btn-sm" :class="algo === 2 ? 'btn-primary' : 'btn-ghost'" @click="algo = 2">{{ $t('ui_algo2') }}</button>
            <button class="btn btn-sm" :class="algo === 3 ? 'btn-primary' : 'btn-ghost'" @click="algo = 3">{{ $t('ui_algo3') }}</button>
          </div>
          <!-- Hide Standard Colls Toggle -->
          <div v-show="mainTab === 'colls'" style="margin-left: auto;">
            <label style="display:flex; align-items:center; gap: 6px; font-size: var(--fs-sm); cursor: pointer; color: var(--text-secondary); user-select: none;">
              <input type="checkbox" v-model="hideStandard" />
              {{ $t('ui_hide_standard') }}
            </label>
          </div>
        </div>
        <!-- Description -->
        <div v-show="mainTab === 'chars'" class="mysterium-desc" style="font-size: var(--fs-xs); color: var(--text-muted); background: rgba(var(--color-invert-rgb),0.02); border: 1px solid rgba(var(--color-invert-rgb),0.05); padding: 6px 10px; border-radius: 4px; line-height: 1.4;" v-html="$t('ui_algo' + algo + '_desc')">
        </div>
      </div>
      
      <!-- Table Panel -->
      <div class="panel desktop-mysterium-table" style="flex: 1; overflow-y: auto; padding: 0;">
        <table class="data-table">
          <thead>
            <tr v-if="mainTab === 'colls'">
              <th>{{ $t('ui_rank') }}</th>
              <th>{{ $t('ui_collection') }}</th>
              <th>{{ $t('ui_characters') }}</th>
              <th @click="toggleSort('cost')" style="cursor:pointer; user-select:none;">
                {{ $t('ui_cost') }}
                <span v-if="collSortBy !== 'cost'" style="opacity:0.3;font-size: var(--fs-xs);margin-left:4px;">↕</span>
                <span v-else style="font-size: var(--fs-xs);color:var(--gold);margin-left:4px;">{{ collSortDesc ? '▼' : '▲' }}</span>
              </th>
              <th @click="toggleSort('score')" style="cursor:pointer; user-select:none;">
                {{ $t('ui_score') }} 
                <span v-if="collSortBy !== 'score'" style="opacity:0.3;font-size: var(--fs-xs);margin-left:4px;">↕</span>
                <span v-else style="font-size: var(--fs-xs);color:var(--gold);margin-left:4px;">{{ collSortDesc ? '▼' : '▲' }}</span>
              </th>
              <th @click="toggleSort('ce')" style="cursor:pointer; user-select:none;">
                {{ $t('ui_ce') }} 
                <span v-if="collSortBy !== 'ce'" style="opacity:0.3;font-size: var(--fs-xs);margin-left:4px;">↕</span>
                <span v-else style="font-size: var(--fs-xs);color:var(--gold);margin-left:4px;">{{ collSortDesc ? '▼' : '▲' }}</span>
              </th>
            </tr>
            <tr v-else-if="algo === 1 || algo === 2">
              <th>{{ $t('ui_rank') }}</th>
              <th>{{ $t('ui_characters') }}</th>
              <th>{{ $t('ui_cost') }}</th>
              <th>{{ $t('ui_score') }}</th>
              <th>{{ $t('ui_ce') }} <span style="font-size: var(--fs-xs); color: var(--text-muted); font-weight: normal; margin-left: 4px;">▼</span></th>
            </tr>
            <tr v-else-if="algo === 3">
              <th>{{ $t('ui_rank') }}</th>
              <th>{{ $t('ui_characters') }}</th>
              <th>{{ $t('ui_cost') }}</th>
              <th>{{ $t('ui_score') }}</th>
              <th>{{ $t('ui_ce') }}</th>
              <th>{{ $t('ui_marginal_ce') }}</th>
              <th>{{ $t('ui_bottleneck') }} <span style="font-size: var(--fs-xs); color: var(--text-muted); font-weight: normal; margin-left: 4px;">▼</span></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(r, i) in displayedResults" :key="i">
              <tr style="cursor: pointer; transition: background 0.2s;" class="hover-row" @click="r._expanded = !r._expanded">
                <td>{{ i + 1 }}</td>
                <td style="color: var(--text-primary); font-weight: bold;">
                  <template v-if="mainTab === 'colls'">
                    {{ $t(r.nameKey) }}
                  </template>
                  <template v-else>
                    <div class="char-list-inline">
                      <div v-for="c in (r.chars || [r])" :key="c.id" class="char-avatar char-avatar-sm" :title="getCharFullName(c)">
                                                <img v-if="hasIcon(c.id)" :src="getCharIconUrl(c.id)" @error="handleImgError" />
                        <span v-else class="char-avatar-fallback">?</span>
                      </div>
                    </div>
                  </template>
                </td>
                <td v-if="mainTab === 'colls'" style="max-width: 250px;">
                  <div class="char-avatar-group">
                    <div v-for="c in (r.chars || [])" :key="c.id" class="char-avatar char-avatar-sm" :title="getCharFullName(c)">
                                              <img v-if="hasIcon(c.id)" :src="getCharIconUrl(c.id)" @error="handleImgError" />
                        <span v-else class="char-avatar-fallback">?</span>
                    </div>
                  </div>
                </td>
                <td>{{ r.cost }}</td>
                <td>{{ (r.totalScore ?? r.score ?? 0).toFixed(1) }}</td>
                <td v-if="algo !== 3 || mainTab === 'colls'" style="color:var(--gold); font-weight:bold;">
                  {{ mainTab === 'colls' && r.cost === 0 ? '-' : (r.ce === Infinity ? '∞' : r.ce.toFixed(2)) }}
                </td>
                <template v-if="mainTab === 'chars' && algo === 3">
                  <td>{{ r.ce.toFixed(2) }}</td>
                  <td style="color:var(--success); font-weight:bold;">{{ r.marginalCe.toFixed(2) }}</td>
                  <td>
                    <div v-if="r.bottleneck && r.bottleneck.length > 0" class="char-avatar-group">
                      <div v-for="c in r.bottleneck" :key="c.id" class="char-avatar char-avatar-sm char-avatar-bw" :title="getCharFullName(c)">
                                                <img v-if="hasIcon(c.id)" :src="getCharIconUrl(c.id)" @error="handleImgError" />
                        <span v-else class="char-avatar-fallback">?</span>
                      </div>
                    </div>
                    <span v-else style="font-size: var(--fs-xs); color:var(--text-muted)">-</span>
                  </td>
                </template>
              </tr>
              <tr v-show="r._expanded" style="background: rgba(var(--color-invert-rgb),0.04);">
                <td :colspan="mainTab === 'colls' ? 6 : (algo === 3 ? 7 : 5)" style="padding: 16px; background: rgba(var(--color-invert-rgb),0.02);">
                  <div style="display: flex; flex-wrap: wrap; gap: 12px; text-align: left; align-items: stretch;">
                    
                      <!-- Team Characters -->
                      <div style="background: rgba(var(--color-invert-rgb),0.03); padding: 10px; border-radius: 6px; border: 1px solid rgba(var(--color-invert-rgb),0.05); display: flex; flex-direction: column; min-width: min-content;">
                        <div style="display: flex; gap: 8px; flex-wrap: wrap; flex: 1; align-content: flex-start; justify-content: center;">
                          <div v-for="c in (r.chars || [r])" :key="c.id" class="char-card">
                                            <img v-if="hasIcon(c.id)" :src="getCharIconUrl(c.id)" class="char-card-img" @error="handleImgError" />
                <span v-else class="char-card-img char-avatar-fallback" style="display:flex;align-items:center;justify-content:center;font-size:24px;">?</span>
                            <div class="char-card-name" :title="getCharFullName(c)">
                              <div class="char-base-name">{{ $t(c.nameKey) }}</div>
                              <div v-if="c.name2Key" class="char-sub-name">{{ $t(c.name2Key) }}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                    <div style="flex: 1; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; align-content: flex-start;">
                      
                      <!-- Level Cap Card -->
                      <div style="background: rgba(var(--color-invert-rgb),0.03); padding: 10px; border-radius: 6px; border: 1px solid rgba(var(--color-invert-rgb),0.05);">
                        <div style="font-weight: bold; margin-bottom: 6px; font-size: 15px; color: var(--text-primary);">
                          🏰 <span style="font-size: var(--fs-xs); color: var(--gold); font-weight: normal; margin-left: 4px;">⭐ {{ ((r.chars ? r.chars.length : 1) * levelCapScore).toFixed(1) }}</span>
                        </div>
                        <div style="font-size: var(--fs-sm); color: var(--text-secondary); display: flex; justify-content: space-between;">
                          <span>{{ $t('appLevelCap') }} +{{ (r.chars ? r.chars.length : 1) * levelCapBaseVal }}</span>
                          <span style="opacity: 0.6;">{{ ((r.chars ? r.chars.length : 1) * levelCapScore).toFixed(1) }}</span>
                        </div>
                      </div>

                      <!-- Activation Cards -->
                      <div v-for="(act, actIndex) in getActivatedList(r)" :key="actIndex" style="background: rgba(var(--color-invert-rgb),0.03); padding: 10px; border-radius: 6px; border: 1px solid rgba(var(--color-invert-rgb),0.05);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; gap: 8px;">
                          <div style="flex: 1; min-width: 0; display: flex; align-items: center; gap: 4px;">
                            <span style="font-weight: bold; font-size: 15px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" :title="$t(getCol(act).nameKey)">
                              {{ $t(getCol(act).nameKey) }}
                            </span>
                            <span v-if="act.portion !== undefined && act.portion < 1" style="font-size: var(--fs-xs); color: var(--text-muted); flex-shrink: 0;">x{{ act.portion.toFixed(2) }}</span>
                            <span style="font-size: var(--fs-xs); color: var(--gold); flex-shrink: 0;">⭐ {{ (act.score !== undefined ? act.score : getCol(act).totalScore).toFixed(1) }}</span>
                          </div>
                          <div v-if="getCol(act).reqCids" class="char-avatar-group" style="gap: 2px; flex-wrap: nowrap; flex-shrink: 0;">
                            <div v-for="cid in getCol(act).reqCids" :key="cid" class="char-avatar char-avatar-xs" :title="getCharFullNameById(cid)">
                                                            <img v-if="hasIcon(cid)" :src="getCharIconUrl(cid)" @error="handleImgError" />
                              <span v-else class="char-avatar-fallback">?</span>
                            </div>
                          </div>
                        </div>
                        <div v-for="(d, dIdx) in getCol(act).details" :key="dIdx" style="font-size: var(--fs-sm); color: var(--text-secondary); display: flex; justify-content: space-between; margin-bottom: 2px;">
                          <span>{{ $t(d.nameKey) }} {{ d.ctype === 2 ? '+' + (d.val * 100) + '%' : (d.ctype === 3 ? '📈+' + d.val : '+' + d.val) }}</span>
                          <span style="opacity: 0.6;">{{ (act.portion !== undefined ? d.score * act.portion : d.score).toFixed(1) }}</span>
                        </div>
                      </div>
                      
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div class="mobile-mysterium-list">
        <article
          v-for="(r, i) in displayedResults"
          :key="`mobile-${i}`"
          class="mobile-mysterium-card"
          @click="r._expanded = !r._expanded"
        >
          <div class="mobile-mysterium-head">
            <div class="mobile-mysterium-rank">#{{ i + 1 }}</div>
            <div class="mobile-mysterium-title">
              <template v-if="mainTab === 'colls'">
                {{ $t(r.nameKey) }}
              </template>
              <template v-else>
                {{ getCharNames(r) }}
              </template>
            </div>
            <div class="mobile-mysterium-ce">
              {{ mainTab === 'colls' && r.cost === 0 ? '-' : (r.ce === Infinity ? '∞' : r.ce.toFixed(2)) }}
            </div>
          </div>

          <div class="mobile-mysterium-meta">
            <span>{{ $t('ui_cost') }} <b>{{ r.cost }}</b></span>
            <span>{{ $t('ui_score') }} <b>{{ (r.totalScore ?? r.score ?? 0).toFixed(1) }}</b></span>
            <span v-if="mainTab === 'chars' && algo === 3">{{ $t('ui_marginal_ce') }} <b>{{ r.marginalCe.toFixed(2) }}</b></span>
          </div>

          <div class="mobile-mysterium-avatars">
            <div v-for="c in (r.chars || [r])" :key="c.id" class="char-avatar char-avatar-sm" :title="getCharFullName(c)">
                                      <img v-if="hasIcon(c.id)" :src="getCharIconUrl(c.id)" @error="handleImgError" />
                        <span v-else class="char-avatar-fallback">?</span>
            </div>
          </div>

          <div v-if="mainTab === 'chars' && algo === 3 && r.bottleneck && r.bottleneck.length > 0" class="mobile-mysterium-bottleneck">
            <span>{{ $t('ui_bottleneck') }}</span>
            <div class="char-avatar-group">
              <div v-for="c in r.bottleneck" :key="c.id" class="char-avatar char-avatar-xs char-avatar-bw" :title="getCharFullName(c)">
                                        <img v-if="hasIcon(c.id)" :src="getCharIconUrl(c.id)" @error="handleImgError" />
                        <span v-else class="char-avatar-fallback">?</span>
              </div>
            </div>
          </div>

          <div v-show="r._expanded" class="mobile-mysterium-detail">
            <div class="char-avatar-group">
              <div v-for="c in (r.chars || [r])" :key="c.id" class="char-card">
                                <img v-if="hasIcon(c.id)" :src="getCharIconUrl(c.id)" class="char-card-img" @error="handleImgError" />
                <span v-else class="char-card-img char-avatar-fallback" style="display:flex;align-items:center;justify-content:center;font-size:24px;">?</span>
                <div class="char-card-name" :title="getCharFullName(c)">
                  <div class="char-base-name">{{ $t(c.nameKey) }}</div>
                  <div v-if="c.name2Key" class="char-sub-name">{{ $t(c.name2Key) }}</div>
                </div>
              </div>
            </div>
            <div class="mobile-mysterium-acts">
              <div v-for="(act, actIndex) in getActivatedList(r)" :key="actIndex" class="mobile-mysterium-act">
                <span>{{ $t(getCol(act).nameKey) }}</span>
                <b>{{ (act.score !== undefined ? act.score : getCol(act).totalScore).toFixed(1) }}</b>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { calculateMysteriumRankings } from '../engine/mysteriumCalc.js'

const charactersRaw = ref({})
const mysteriumRaw = ref({})
const availableIcons = ref(null)

onMounted(async () => {
  try {
    const [chars, myst, icons] = await Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/characters.json`).then(r => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/mysterium_data.json`).then(r => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/available_icons.json`).then(r => r.json()).catch(() => null)
    ])
    charactersRaw.value = chars
    mysteriumRaw.value = myst
    availableIcons.value = icons
  } catch (e) {
    console.error('Failed to fetch mysterium data', e)
  }
})

const { t } = useI18n()

const defaultScoringTemplate = [
  { group: 'grp_base', key: 'appLevelCap', ctype: 1, baseVal: 5, score: 50 },
  
  { group: 'grp_stats', key: 'appBasicStr', ctype: 3, baseVal: 30, score: 4 },
  { group: 'grp_stats', key: 'appBasicDex', ctype: 3, baseVal: 30, score: 4 },
  { group: 'grp_stats', key: 'appBasicMag', ctype: 3, baseVal: 30, score: 4 },
  { group: 'grp_stats', key: 'appBasicStm', ctype: 3, baseVal: 30, score: 4 },
  
  { group: 'grp_core', key: '[BattleParameterTypeAttackPower]', ctype: 1, baseVal: 5000, score: 0 },
  { group: 'grp_core', key: '[BattleParameterTypeAttackPower]', ctype: 2, baseVal: 0.02, score: 20 },
  { group: 'grp_core', key: '[BattleParameterTypeHp]', ctype: 2, baseVal: 0.05, score: 50 },
  { group: 'grp_core', key: '[BattleParameterTypeDefense]', ctype: 2, baseVal: 0.01, score: 10 },
  { group: 'grp_core', key: '[BattleParameterTypeDefense]', ctype: 3, baseVal: 15, score: 1 },
  { group: 'grp_core', key: '[BattleParameterTypePhysicalDamageRelax]', ctype: 1, baseVal: 3000, score: 0 },
  { group: 'grp_core', key: '[BattleParameterTypePhysicalDamageRelax]', ctype: 2, baseVal: 0.02, score: 10 },
  { group: 'grp_core', key: '[BattleParameterTypeMagicDamageRelax]', ctype: 1, baseVal: 3000, score: 0 },
  { group: 'grp_core', key: '[BattleParameterTypeMagicDamageRelax]', ctype: 2, baseVal: 0.02, score: 10 },

  { group: 'grp_pen', key: '[BattleParameterTypeDefensePenetration]', ctype: 1, baseVal: 200, score: 10 },
  { group: 'grp_pen', key: '[BattleParameterTypeDamageEnhance]', ctype: 1, baseVal: 250, score: 5 },

  { group: 'grp_crit', key: '[BattleParameterTypeCritical]', ctype: 3, baseVal: 70, score: 5 },
  { group: 'grp_crit', key: '[BattleParameterTypeCriticalDamageEnhance]', ctype: 2, baseVal: 0.1, score: 120 },
  { group: 'grp_crit', key: '[BattleParameterTypeCriticalResist]', ctype: 1, baseVal: 1500, score: 0 },
  { group: 'grp_crit', key: '[BattleParameterTypeCriticalResist]', ctype: 3, baseVal: 70, score: 5 },
  { group: 'grp_crit', key: '[BattleParameterTypePhysicalCriticalDamageRelax]', ctype: 2, baseVal: 0.1, score: 80 },
  { group: 'grp_crit', key: '[BattleParameterTypeMagicCriticalDamageRelax]', ctype: 2, baseVal: 0.1, score: 80 },

  { group: 'grp_hit', key: '[BattleParameterTypeHit]', ctype: 1, baseVal: 1500, score: 0 },
  { group: 'grp_hit', key: '[BattleParameterTypeHit]', ctype: 3, baseVal: 70, score: 3 },
  { group: 'grp_hit', key: '[BattleParameterTypeHit]', ctype: 2, baseVal: 0.015, score: 15 },
  { group: 'grp_hit', key: '[BattleParameterTypeAvoidance]', ctype: 1, baseVal: 1500, score: 0 },
  { group: 'grp_hit', key: '[BattleParameterTypeAvoidance]', ctype: 3, baseVal: 50, score: 2 },

  { group: 'grp_debuff', key: '[BattleParameterTypeDebuffHit]', ctype: 2, baseVal: 0.015, score: 5 },
  { group: 'grp_debuff', key: '[BattleParameterTypeDebuffHit]', ctype: 3, baseVal: 70, score: 2 },
  { group: 'grp_debuff', key: '[BattleParameterTypeDebuffResist]', ctype: 1, baseVal: 1500, score: 0 },
  { group: 'grp_debuff', key: '[BattleParameterTypeDebuffResist]', ctype: 3, baseVal: 70, score: 2 },

  { group: 'grp_special', key: '[BattleParameterTypeHpDrain]', ctype: 2, baseVal: 0.05, score: 100 },
  { group: 'grp_special', key: '[BattleParameterTypeDamageReflect]', ctype: 2, baseVal: 0.03, score: 60 }
]

const stateTemplate = reactive(JSON.parse(JSON.stringify(defaultScoringTemplate)))

const algo = ref(3)
const mainTab = ref('colls')
const collSortBy = ref('ce')
const collSortDesc = ref(true)
const hideStandard = ref(false)

const getCtypeStr = (ctype) => {
  if (ctype === 1) return t('ui_fixed')
  if (ctype === 2) return t('ui_percent')
  if (ctype === 3) return t('ui_growth')
  return ''
}

const groupedTemplate = computed(() => {
  const grouped = {}
  stateTemplate.forEach(item => {
    if (!grouped[item.group]) grouped[item.group] = []
    grouped[item.group].push(item)
  })
  return grouped
})

const result = computed(() => {
  if (!Object.keys(charactersRaw.value).length) return { collections: [], rankings: [] }
  return calculateMysteriumRankings(charactersRaw.value, mysteriumRaw.value, stateTemplate, algo.value)
})

const levelCapItem = computed(() => stateTemplate.find(t => t.key === 'appLevelCap') || { baseVal: 0, score: 0 })
const levelCapScore = computed(() => levelCapItem.value.score)
const levelCapBaseVal = computed(() => levelCapItem.value.baseVal)

const getCharFullName = (c) => t(c.nameKey) + (c.name2Key ? ` (${t(c.name2Key)})` : '')

const getCharFullNameById = (id) => {
  const c = charactersRaw.value[id]
  if (!c) return ''
  return getCharFullName(c)
}

const getCharIconUrl = (id) => `${import.meta.env.BASE_URL}images/characters/${id}.png`

const hasIcon = (id) => {
  if (!availableIcons.value) return true // fallback to true before load
  return availableIcons.value.includes(Number(id))
}

const getCharNames = (r) => {
  if (r.chars) return r.chars.map(c => getCharFullName(c)).join(' + ')
  return getCharFullName(r)
}

const handleImgError = (e) => {
  e.target.style.display = 'none';
  e.target.parentElement.classList.add('char-avatar-fallback');
  e.target.parentElement.innerText = '?';
}

const getBottleneckNames = (r) => {
  if (r.bottleneck && r.bottleneck.length > 0) return r.bottleneck.map(c => getCharFullName(c)).join(' + ')
  return '-'
}

const getActivatedList = (r) => {
  if (r.activated) return r.activated
  if (r.totalScore !== undefined) {
    // collection dummy
    return [{ col: r, portion: 1, score: r.totalScore }]
  }
  return []
}

const getCol = (act) => act.col || act

const displayedResults = ref([])

watch([result, mainTab, collSortBy, collSortDesc, hideStandard], () => {
  let list = []
  if (mainTab.value === 'colls') {
    list = [...result.value.collections]
    if (hideStandard.value) {
      list = list.filter(item => item.cost > 0)
    }
    list.sort((a, b) => {
      let valA = collSortBy.value === 'ce' ? a.ce : (collSortBy.value === 'cost' ? a.cost : a.totalScore)
      let valB = collSortBy.value === 'ce' ? b.ce : (collSortBy.value === 'cost' ? b.cost : b.totalScore)
      return collSortDesc.value ? valB - valA : valA - valB
    })
  } else {
    list = [...result.value.rankings]
  }
  
  // Add _expanded state for Vue UI
  displayedResults.value = list.map(item => ({
    ...item,
    _expanded: false
  }))
}, { immediate: true })

function toggleSort(key) {
  if (collSortBy.value === key) {
    collSortDesc.value = !collSortDesc.value
  } else {
    collSortBy.value = key
    collSortDesc.value = key === 'cost' ? false : true
  }
}

</script>

<style scoped>
.mobile-mysterium-list {
  display: none;
}
.mobile-mysterium-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-sm);
  padding: 12px;
}
.mobile-mysterium-head {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: 10px;
}
.mobile-mysterium-rank {
  color: var(--gold);
  font-family: var(--font-mono);
  font-weight: 800;
}
.mobile-mysterium-title {
  min-width: 0;
  color: var(--text-primary);
  font-weight: 700;
  line-height: 1.35;
}
.mobile-mysterium-ce {
  color: var(--gold);
  font-family: var(--font-mono);
  font-size: var(--fs-md);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}
.mobile-mysterium-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}
.mobile-mysterium-meta span {
  min-width: 0;
  padding: 7px 8px;
  border-radius: var(--r-sm);
  background: rgba(var(--color-invert-rgb), 0.035);
  color: var(--text-muted);
  font-size: var(--fs-xs);
}
.mobile-mysterium-meta b {
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-weight: 750;
  font-variant-numeric: tabular-nums;
}
.mobile-mysterium-avatars,
.mobile-mysterium-bottleneck {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 10px;
}
.mobile-mysterium-bottleneck {
  color: var(--text-muted);
  font-size: var(--fs-xs);
}
.mobile-mysterium-detail {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-subtle);
}
.mobile-mysterium-acts {
  display: grid;
  gap: 6px;
  margin-top: 10px;
}
.mobile-mysterium-act {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 8px;
  border-radius: var(--r-sm);
  background: rgba(var(--color-invert-rgb), 0.035);
}
.mobile-mysterium-act span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-secondary);
}
.mobile-mysterium-act b {
  color: var(--gold);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}
.hover-row:hover {
  background: rgba(var(--color-invert-rgb),0.05);
}

.char-avatar-group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}
.char-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(var(--color-invert-rgb),0.1);
  border: 1px solid rgba(var(--color-invert-rgb),0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.2s, box-shadow 0.2s;
}
.char-avatar:hover {
  transform: scale(1.3);
  box-shadow: 0 4px 8px rgba(var(--color-base-rgb),0.5);
  z-index: 10;
}
.char-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.char-avatar-sm {
  width: 32px;
  height: 32px;
}
.char-avatar-xs {
  width: 20px;
  height: 20px;
}
.char-avatar-bw {
  filter: grayscale(100%) opacity(0.7);
}
.char-avatar-fallback {
  font-size: var(--fs-sm);
  font-weight: bold;
  color: var(--text-muted);
}
.char-list-inline {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
}
.char-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: rgba(var(--color-invert-rgb),0.06);
  padding: 8px;
  border-radius: 8px;
  border: 1px solid rgba(var(--color-invert-rgb),0.05);
  min-width: 72px;
  max-width: 84px;
}
.char-card-img {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  object-fit: cover;
  background: rgba(var(--color-invert-rgb),0.05);
}
.char-card-name {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  width: 100%;
}
.char-base-name {
  font-size: var(--fs-sm);
  font-weight: bold;
  color: var(--text-primary);
  text-align: center;
  line-height: 1.2;
  word-break: keep-all;
}
.char-sub-name {
  font-size: var(--fs-xs);
  color: var(--text-primary);
  text-align: center;
  background: var(--gold-dim);
  border: 1px solid var(--border-subtle);
  padding: 2px 4px;
  border-radius: 4px;
  line-height: 1.1;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 560px) {
  .mysterium-layout {
    grid-template-columns: 1fr;
    gap: 12px !important;
  }
  .mysterium-settings,
  .mysterium-results {
    max-height: none !important;
    overflow: visible;
  }
  .mysterium-tabs,
  .mysterium-algos {
    width: 100%;
  }
  .mysterium-desc {
    font-size: var(--fs-sm) !important;
  }
  .desktop-mysterium-table {
    display: none;
  }
  .mobile-mysterium-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .mobile-mysterium-meta {
    grid-template-columns: 1fr;
  }
  .char-avatar:hover {
    transform: none;
  }
}
</style>
