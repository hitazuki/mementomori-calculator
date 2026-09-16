<template>
  <div>
    <header class="view-header">
      <h1 class="view-title">📈 {{ t('equipmentUpgradeTitle') }}</h1>
      <p class="view-desc">{{ t('equipmentUpgradeDescription') }}</p>
    </header>
    <EquipmentUpgradePanel />
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import EquipmentUpgradePanel from '../components/EquipmentUpgradePanel.vue'
const { t } = useI18n()
</script>
