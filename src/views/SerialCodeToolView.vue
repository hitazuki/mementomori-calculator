<template>
  <div class="serial-code-view">
    <header class="view-header animate-fadeup">
      <h1 class="view-title">🎁 {{ $t('serialCodeTitle') }}</h1>
      <p class="view-desc">{{ $t('serialCodeDesc') }}</p>
    </header>

    <section class="serial-install-grid animate-fadeup">
      <article class="panel serial-install-card">
        <div>
          <h2 class="panel-title">{{ $t('serialCodeInstallTitle') }}</h2>
          <p>{{ $t('serialCodeInstallDesc') }}</p>
        </div>
        <div class="serial-actions">
          <a class="btn btn-secondary" href="https://www.tampermonkey.net/" target="_blank" rel="noopener noreferrer">
            Tampermonkey
          </a>
          <a class="btn btn-primary" :href="userscriptUrl" target="_blank" rel="noopener noreferrer">
            {{ $t('serialCodeInstallAction') }}
          </a>
          <a class="btn btn-ghost" href="https://mememori-game.com/code/" target="_blank" rel="noopener noreferrer">
            {{ $t('serialCodeOfficialAction') }}
          </a>
        </div>
      </article>

      <article class="panel serial-safety-card">
        <h2 class="panel-title">{{ $t('serialCodeSafetyTitle') }}</h2>
        <p>{{ $t('serialCodeSafetyDesc') }}</p>
      </article>
    </section>

    <section class="panel serial-usage animate-fadeup">
      <h2 class="panel-title">{{ $t('serialCodeUsageTitle') }}</h2>
      <ol>
        <li>{{ $t('serialCodeStep1') }}</li>
        <li>{{ $t('serialCodeStep2') }}</li>
        <li>{{ $t('serialCodeStep3') }}</li>
        <li>{{ $t('serialCodeStep4') }}</li>
      </ol>
    </section>

    <section class="panel serial-list-panel animate-fadeup">
      <div class="serial-list-heading">
        <h2 class="panel-title">{{ $t('serialCodeListTitle') }}</h2>
        <button v-if="activeCodes.length" type="button" class="btn btn-sm btn-secondary" @click="copyAll">
          {{ copiedCode === '__all__' ? $t('serialCodeCopied') : $t('serialCodeCopyAll') }}
        </button>
      </div>

      <p v-if="loading" class="text-muted">{{ $t('serialCodeLoading') }}</p>
      <p v-else-if="loadError" class="text-danger">{{ $t('serialCodeLoadError') }}</p>
      <div v-else class="serial-code-list">
        <article v-for="item in activeCodes" :key="item.code" class="serial-code-row">
          <div>
            <code>{{ item.code }}</code>
            <span>{{ expiryLabel(item) }}</span>
          </div>
          <button type="button" class="btn btn-sm btn-ghost" @click="copyCode(item.code)">
            {{ copiedCode === item.code ? $t('serialCodeCopied') : $t('serialCodeCopy') }}
          </button>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale, t } = useI18n()
const registry = ref({ codes: [] })
const loading = ref(true)
const loadError = ref(false)
const copiedCode = ref('')

const userscriptUrl = new URL(
  `${import.meta.env.BASE_URL}userscripts/mememori-code-batch.user.js`,
  window.location.origin,
).href

const activeCodes = computed(() => {
  const now = Date.now()
  return registry.value.codes.filter(item => {
    if (!item.enabled) return false
    if (item.validFrom && now < Date.parse(item.validFrom)) return false
    if (item.expiresAt && now > Date.parse(item.expiresAt)) return false
    return true
  })
})

onMounted(async () => {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/serial-codes.json`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    if (!Array.isArray(data.codes)) throw new Error('Invalid serial-code registry')
    registry.value = data
  } catch (error) {
    console.error('Failed to load serial codes', error)
    loadError.value = true
  } finally {
    loading.value = false
  }
})

function expiryLabel(item) {
  if (!item.expiresAt) return t('serialCodeNoExpiry')
  const date = new Intl.DateTimeFormat(locale.value, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(item.expiresAt))
  return t('serialCodeExpires', { date })
}

async function copyText(value, marker) {
  try {
    await navigator.clipboard.writeText(value)
    copiedCode.value = marker
    window.setTimeout(() => {
      if (copiedCode.value === marker) copiedCode.value = ''
    }, 1800)
  } catch (error) {
    console.error('Failed to copy serial code', error)
  }
}

function copyCode(code) {
  return copyText(code, code)
}

function copyAll() {
  return copyText(activeCodes.value.map(item => item.code).join('\n'), '__all__')
}
</script>

<style scoped>
.serial-code-view {
  width: min(980px, 100%);
  margin: 0 auto;
}

.serial-install-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(260px, 1fr);
  gap: 16px;
}

.serial-install-card,
.serial-safety-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.serial-install-card p,
.serial-safety-card p,
.serial-usage li {
  color: var(--text-secondary);
  font-size: var(--fs-sm);
  line-height: 1.7;
}

.serial-safety-card {
  border-color: rgba(201, 168, 76, 0.38);
  background: linear-gradient(135deg, rgba(201, 168, 76, 0.09), var(--bg-card));
}

.serial-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: auto;
}

.serial-actions a {
  text-decoration: none;
}

.serial-usage,
.serial-list-panel {
  margin-top: 16px;
}

.serial-usage ol {
  display: grid;
  gap: 8px;
  margin: 12px 0 0;
  padding-left: 24px;
}

.serial-list-heading,
.serial-code-row,
.serial-code-row > div {
  display: flex;
  align-items: center;
}

.serial-list-heading {
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.serial-code-list {
  display: grid;
  gap: 8px;
}

.serial-code-row {
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-sm);
  background: rgba(var(--color-invert-rgb), 0.025);
}

.serial-code-row > div {
  min-width: 0;
  flex-wrap: wrap;
  gap: 8px 14px;
}

.serial-code-row code {
  color: var(--gold);
  font-family: var(--font-mono);
  font-size: var(--fs-md);
  font-weight: 800;
  letter-spacing: 0.04em;
}

.serial-code-row span {
  color: var(--text-muted);
  font-size: var(--fs-xs);
}

@media (max-width: 720px) {
  .serial-install-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .serial-actions,
  .serial-actions .btn {
    width: 100%;
  }

  .serial-code-row {
    align-items: flex-start;
  }
}
</style>
