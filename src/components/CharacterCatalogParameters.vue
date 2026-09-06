<template>
  <dl class="catalog-parameters"><template v-for="(parameter, index) in parameters" :key="index"><dt>{{ parameter.name }}<small v-if="parameter.growth"> · {{ t('ui_growth') }}</small></dt><dd>+{{ parameter.value }}{{ parameter.percent ? '%' : '' }}</dd></template></dl>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
defineProps({ parameters: { type: Array, default: () => [] } })
const { t } = useI18n()
</script>
<style scoped>
.catalog-parameters { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:8px; font-size:var(--fs-sm); }.catalog-parameters dd { margin:0; color:var(--gold); }.catalog-parameters dt { overflow-wrap:anywhere; }
</style>
