<template>
  <Teleport to="body">
    <div ref="dialog" class="modal-overlay active raid-export-overlay" role="dialog" aria-modal="true" :aria-labelledby="titleId" tabindex="-1" @mousedown.self="$emit('close')" @keydown.esc.stop="$emit('close')">
      <div class="modal-content raid-export-modal">
        <div class="modal-header">
          <div>
            <h2 :id="titleId" class="modal-title">{{ model.labels.previewTitle }}</h2>
            <small class="raid-export-modal-hint">{{ model.labels.previewHint }}</small>
          </div>
          <button type="button" class="modal-close" :aria-label="model.labels.close" @click="$emit('close')">&times;</button>
        </div>
        <div class="modal-body raid-export-modal-body">
          <div class="raid-export-toolbar">
            <span class="raid-export-status" :class="statusType">{{ statusText }}</span>
            <div>
              <button type="button" class="btn btn-ghost btn-sm" :disabled="generating || !copySupported || !blob" @click="copyImage">{{ model.labels.copy }}</button>
              <button type="button" class="btn btn-primary btn-sm" :disabled="generating || !blob" @click="downloadImage">{{ model.labels.download }}</button>
            </div>
          </div>
          <div class="raid-export-preview-scroll">
            <div v-if="generating" class="raid-export-loading">{{ model.labels.generating }}</div>
            <img v-else-if="previewUrl" class="raid-export-preview-image" :src="previewUrl" :alt="model.labels.previewAlt">
          </div>
        </div>
      </div>

      <div ref="captureNode" class="raid-export-capture-host" aria-hidden="true">
        <article class="raid-export-sheet" :class="`theme-${theme}`">
          <header class="raid-export-header">
            <div><h1>🪵 {{ model.title }}</h1><p>{{ model.boss.name }} · {{ model.boss.stats }}</p></div>
            <div class="raid-export-grand-total"><strong>{{ model.totals.attack }}</strong><span v-for="value in model.totals.conversion" :key="value">+ {{ value }}</span><span v-if="model.totals.symbolic !== '—'">+ {{ model.totals.symbolic }}</span></div>
          </header>

          <section class="raid-export-meta-grid">
            <div><strong>{{ model.labels.position }}</strong><RaidExportSequence :items="model.lineup" /></div>
            <div><strong>{{ model.labels.attackPriority }}</strong><RaidExportSequence :items="model.attackPriority" /></div>
            <div><strong>{{ model.labels.assumptions }}</strong><span>{{ model.labels.guaranteedCritical }}：{{ model.guaranteedCritical ? model.labels.enabled : model.labels.disabled }}</span><span v-for="line in model.elementBonusLines" :key="line">{{ line }}</span></div>
            <div><strong>{{ model.labels.scenarios }}</strong><span v-for="line in model.scenarioLines" :key="line">{{ line }}</span><span v-if="!model.scenarioLines.length">—</span></div>
          </section>

          <section class="raid-export-panel-section">
            <h2>{{ model.labels.panelStats }}</h2>
            <table><thead><tr><th>{{ model.labels.character }}</th><th>{{ model.labels.level }}</th><th>{{ model.labels.speed }}</th><th>{{ model.labels.criticalDamage }}</th><th>{{ model.labels.defensePenetration }}</th><th>{{ model.labels.pmDefensePenetration }}</th></tr></thead>
              <tbody><tr v-for="row in model.rows" :key="row.id"><th><RaidExportCharacter :item="row" /></th><td>{{ number(row.panel.level) }}</td><td>{{ number(row.panel.speed) }}</td><td>{{ number(row.panel.criticalDamage) }}%</td><td>{{ number(row.panel.defensePenetration) }}</td><td>{{ number(row.panel.pmDefensePenetration) }}</td></tr></tbody>
            </table>
          </section>

          <section class="raid-export-matrix-section">
            <h2>{{ model.labels.matrix }}</h2>
            <table class="raid-export-matrix"><thead><tr><th>{{ model.labels.character }}</th><th>{{ model.labels.characterTotal }}</th><th v-for="round in model.rounds" :key="round.turn"><span>{{ round.label }}</span><RaidExportSequence :items="round.order" compact /><em :class="round.orderSource">{{ round.orderSource === 'manual' ? model.labels.manual : model.labels.automatic }}</em></th></tr></thead>
              <tbody>
                <tr v-for="row in model.rows" :key="row.id"><th><RaidExportCharacter :item="row" /></th><td class="total"><strong>{{ row.total }}</strong><span v-for="value in row.conversionTotals" :key="value">+ {{ value }}</span><span v-if="row.symbolicTotal !== '—'">+ {{ row.symbolicTotal }}</span></td><td v-for="action in row.actions" :key="action.turn"><strong>{{ action.skill }}</strong><span>{{ action.total }}</span></td></tr>
                <tr class="boss-row"><th>{{ model.labels.bossStatus }}</th><td>{{ model.labels.afterRound }}</td><td v-for="round in model.rounds" :key="round.turn"><span v-for="status in round.bossStatuses" :key="status">{{ status }}</span><span v-if="!round.bossStatuses.length">—</span></td></tr>
              </tbody>
              <tfoot><tr><th>{{ model.labels.roundTotal }}</th><td class="total"><strong>{{ model.totals.attack }}</strong><span v-for="value in model.totals.conversion" :key="value">+ {{ value }}</span><span v-if="model.totals.symbolic !== '—'">+ {{ model.totals.symbolic }}</span></td><td v-for="round in model.rounds" :key="round.turn"><strong>{{ round.total }}</strong><span v-for="value in round.conversionTotals" :key="value">+ {{ value }}</span><span v-if="round.symbolicTotal !== '—'">+ {{ round.symbolicTotal }}</span></td></tr></tfoot>
            </table>
          </section>

          <footer><p v-for="warning in model.warningLines" :key="warning">ℹ {{ warning }}</p><small>{{ model.generatedLabel }}：{{ model.generatedAt }}</small></footer>
        </article>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { toBlob } from 'html-to-image'
import { canCopyPng, copyPngBlob } from '../../utils/raidExport.js'

const props = defineProps({ model: { type: Object, required: true }, theme: { type: String, default: 'dark' }, filename: { type: String, required: true } })
defineEmits(['close'])

const titleId = `raid-export-preview-${Math.random().toString(36).slice(2)}`
const dialog = ref(null)
const captureNode = ref(null)
const blob = ref(null)
const previewUrl = ref('')
const generating = ref(true)
const messageKey = ref('')
const messageType = ref('')
const copySupported = canCopyPng()
const statusText = computed(() => messageKey.value ? props.model.labels[messageKey.value] : (copySupported ? props.model.labels.ready : props.model.labels.copyUnavailable))
const statusType = computed(() => messageType.value || (copySupported ? 'success' : 'warning'))

const RaidExportCharacter = defineComponent({ props: { item: { type: Object, required: true } }, setup(p) { return () => h('span', { class: 'raid-export-character' }, [h('span', { class: 'avatar' }, [h('b', p.item.name.slice(0, 1)), h('img', { src: p.item.icon, alt: '', onError: event => { event.currentTarget.style.display = 'none' } })]), h('span', p.item.name)]) } })
const RaidExportSequence = defineComponent({ props: { items: { type: Array, required: true }, compact: Boolean }, setup(p) { return () => h('span', { class: ['raid-export-sequence', { compact: p.compact }] }, p.items.flatMap((item, index) => [index ? h('i', '→') : null, h(RaidExportCharacter, { item, key: item.id })])) } })

function number(value) { return new Intl.NumberFormat(props.model.locale).format(value) }
function releasePreview() { if (previewUrl.value) URL.revokeObjectURL(previewUrl.value); previewUrl.value = '' }

async function waitForAssets(node) {
  await document.fonts?.ready
  await Promise.all([...node.querySelectorAll('img')].map(image => image.complete ? Promise.resolve() : new Promise(resolve => { image.addEventListener('load', resolve, { once: true }); image.addEventListener('error', resolve, { once: true }) })))
}

async function generate() {
  generating.value = true; messageKey.value = ''; messageType.value = ''
  await nextTick()
  try {
    await waitForAssets(captureNode.value)
    const output = await toBlob(captureNode.value.firstElementChild, { pixelRatio: 2, cacheBust: true, skipFonts: true, backgroundColor: props.theme === 'light' ? '#f4f3ee' : '#0d0b14' })
    if (!output) throw new Error('Empty image blob')
    releasePreview(); blob.value = output; previewUrl.value = URL.createObjectURL(output)
  } catch (error) {
    console.error('Failed to generate raid export image', error)
    messageKey.value = 'generateFailed'; messageType.value = 'error'
  } finally { generating.value = false }
}

async function copyImage() {
  if (!blob.value) return
  try { await copyPngBlob(blob.value); messageKey.value = 'copied'; messageType.value = 'success' }
  catch (error) { console.error('Failed to copy raid export image', error); messageKey.value = 'copyFailed'; messageType.value = 'error' }
}

function downloadImage() {
  if (!blob.value) return
  const link = document.createElement('a'); link.href = previewUrl.value; link.download = props.filename; link.click()
  messageKey.value = 'downloaded'; messageType.value = 'success'
}

onMounted(() => { dialog.value?.focus(); generate() })
onBeforeUnmount(releasePreview)
</script>

<style>
.raid-export-overlay { z-index: 1300; }
.raid-export-modal { width: min(96vw, 1500px); max-width: none; max-height: 95vh; }
.raid-export-modal .modal-header > div { min-width: 0; }
.raid-export-modal-hint { color: var(--text-muted); }
.raid-export-modal-body { display: grid; gap: 12px; padding: 16px; overflow: hidden; }
.raid-export-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.raid-export-toolbar > div { display: flex; gap: 8px; }
.raid-export-status { color: var(--text-muted); font-size: var(--fs-sm); }
.raid-export-status.success { color: var(--success); }.raid-export-status.warning { color: var(--warning); }.raid-export-status.error { color: var(--danger); }
.raid-export-preview-scroll { min-height: 260px; max-height: calc(95vh - 145px); overflow: auto; border: 1px solid var(--border-subtle); border-radius: var(--r-sm); background: var(--bg-base); }
.raid-export-preview-image { display: block; width: auto; max-width: none; height: auto; }
.raid-export-loading { display: grid; min-height: 260px; place-items: center; color: var(--text-muted); }
.raid-export-capture-host { position: fixed; left: -20000px; top: 0; width: max-content; pointer-events: none; }
.raid-export-sheet { width: 1660px; padding: 28px; background: #0d0b14; color: #f0e6c8; font: 500 13px/1.4 Inter, Arial, sans-serif; }
.raid-export-sheet.theme-light { background: #f4f3ee; color: #1a1614; }
.raid-export-sheet * { box-sizing: border-box; }
.raid-export-sheet h1 { margin: 0; color: #f5df9a; font-size: 25px; }.raid-export-sheet.theme-light h1 { color: #755912; }
.raid-export-sheet h2 { margin: 0 0 8px; color: #d4ba70; font-size: 16px; }.raid-export-sheet.theme-light h2 { color: #9e791b; }
.raid-export-header { display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: 16px; border-bottom: 1px solid rgba(212,186,112,.3); }.raid-export-header p { margin: 4px 0 0; opacity: .72; }
.raid-export-grand-total { display: grid; justify-items: end; color: #f5df9a; }.raid-export-sheet.theme-light .raid-export-grand-total { color: #755912; }.raid-export-grand-total strong { font-size: 22px; }.raid-export-grand-total span { font-size: 12px; }
.raid-export-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 14px 0; }.raid-export-meta-grid > div { display: grid; gap: 3px; min-width: 0; padding: 9px; border: 1px solid rgba(212,186,112,.2); border-radius: 6px; background: rgba(255,255,255,.025); }.theme-light .raid-export-meta-grid > div { background: rgba(0,0,0,.025); }.raid-export-meta-grid strong { color: #d4ba70; }.theme-light .raid-export-meta-grid strong { color: #9e791b; }
.raid-export-sequence { display: flex; align-items: center; gap: 5px; min-width: 0; }.raid-export-sequence.compact { justify-content: center; gap: 2px; }.raid-export-sequence i { opacity: .4; font-style: normal; }.raid-export-sequence.compact .raid-export-character > span:last-child { display: none; }.raid-export-sequence.compact .avatar { width: 21px; height: 21px; }
.raid-export-character { display: inline-flex; align-items: center; gap: 5px; min-width: 0; }.raid-export-character .avatar { position: relative; display: inline-grid; flex: 0 0 auto; width: 27px; height: 27px; overflow: hidden; place-items: center; border: 1px solid rgba(212,186,112,.35); border-radius: 50%; background: rgba(134,107,150,.25); }.raid-export-character .avatar b { font-size: 10px; }.raid-export-character img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.raid-export-panel-section { margin-bottom: 14px; }.raid-export-sheet table { width: 100%; border-collapse: collapse; table-layout: fixed; }.raid-export-sheet th,.raid-export-sheet td { padding: 6px; border: 1px solid rgba(255,255,255,.09); text-align: center; vertical-align: middle; }.theme-light table th,.theme-light table td { border-color: rgba(0,0,0,.1); }.raid-export-sheet thead th { color: #d4ba70; background: rgba(212,186,112,.07); }.theme-light thead th { color: #755912; }.raid-export-panel-section th:first-child { width: 210px; text-align: left; }
.raid-export-matrix th:first-child { width: 150px; }.raid-export-matrix th:nth-child(2) { width: 145px; }.raid-export-matrix thead th { height: 74px; }.raid-export-matrix thead th > span,.raid-export-matrix thead th > em { display: block; }.raid-export-matrix thead em { margin-top: 3px; opacity: .6; font-size: 9px; font-style: normal; }.raid-export-matrix thead em.manual { color: #f5df9a; opacity: 1; }.theme-light .raid-export-matrix thead em.manual { color: #755912; }
.raid-export-matrix tbody th { text-align: left; }.raid-export-matrix tbody td { height: 62px; }.raid-export-matrix td strong,.raid-export-matrix td span { display: block; }.raid-export-matrix td strong { font-size: 12px; }.raid-export-matrix td span { color: #f5df9a; font: 600 10px/1.35 'JetBrains Mono', Consolas, monospace; }.theme-light .raid-export-matrix td span { color: #755912; }.raid-export-matrix .total { color: #f5df9a; }.theme-light .raid-export-matrix .total { color: #755912; }.raid-export-matrix .boss-row td,.raid-export-matrix .boss-row th { background: rgba(46,204,113,.05); }.raid-export-matrix .boss-row span { color: #2ecc71; }.raid-export-matrix tfoot td,.raid-export-matrix tfoot th { background: rgba(212,186,112,.08); }
.raid-export-sheet footer { display: grid; gap: 3px; margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(212,186,112,.25); opacity: .72; font-size: 10px; }.raid-export-sheet footer p { margin: 0; }.raid-export-sheet footer small { margin-top: 4px; text-align: right; }
@media (max-width: 700px) { .raid-export-toolbar { align-items: stretch; flex-direction: column; }.raid-export-toolbar > div { display: grid; grid-template-columns: 1fr 1fr; }.raid-export-modal { width: 100vw; max-height: 100vh; border-radius: 0; }.raid-export-preview-scroll { max-height: calc(100vh - 170px); } }
</style>
