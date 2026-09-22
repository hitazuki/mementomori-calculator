<template>
  <div v-if="loading" class="card" role="status">{{ t('dataLoading') }}</div>
  <div v-else-if="error" class="card" role="alert">
    {{ t('dataLoadError') }}
    <button type="button" class="btn btn-secondary" @click="$emit('retry')">{{ t('dataRetry') }}</button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
defineProps({ loading: Boolean, error: Boolean })
defineEmits(['retry'])
const { t } = useI18n()
</script>
