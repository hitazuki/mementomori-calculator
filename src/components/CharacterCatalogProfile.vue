<template>
  <section v-if="character.exclusivePassives?.length" class="profile-section">
    <h3>{{ t('catalogPassives') }}</h3>
    <select v-model="weaponId" class="form-select" :aria-label="t('catalogPassives')"><option v-for="weapon in character.exclusivePassives" :key="weapon.id" :value="weapon.id">{{ weapon.rarity }} · Lv{{ weapon.level }}+</option></select>
    <template v-if="weapon"><p>{{ weapon.name }}</p><CharacterCatalogParameters :parameters="weapon.parameters"/></template>
  </section>
  <section class="profile-section">
    <h3>{{ t('catalogCollections') }}</h3>
    <p v-if="!character.collections?.length">{{ t('catalogNoCollections') }}</p>
    <article v-for="collection in character.collections" :key="collection.id" class="collection">
      <h4>{{ collection.name }}</h4>
      <div class="members"><a v-for="member in collection.members" :key="member.id" :href="`#characters/${member.id}`" :title="member.name" :aria-label="member.name"><CharacterCatalogImage :path="`images/characters/${member.id}.png`" :fallback="member.name.slice(0, 1)"/></a></div>
      <label>{{ t('catalogRequirement') }}<select class="form-select" :value="collectionLevel(collection)?.level" @change="levels[collection.id] = Number($event.target.value)"><option v-for="level in collection.levels" :key="level.level" :value="level.level">Lv{{ level.level }} · {{ level.rarity }}</option></select></label>
      <template v-if="collectionLevel(collection)">
        <CharacterCatalogParameters :parameters="collectionLevel(collection).parameters"/>
        <p v-if="collectionLevel(collection).rarityBonus">{{ t('catalogRarityBonus') }} +{{ collectionLevel(collection).rarityBonus }}</p>
        <p v-if="collectionLevel(collection).maxLevelIncrease">{{ t('catalogLevelBonus') }} +{{ collectionLevel(collection).maxLevelIncrease }}</p>
      </template>
    </article>
  </section>
</template>
<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import CharacterCatalogImage from './CharacterCatalogImage.vue'
import CharacterCatalogParameters from './CharacterCatalogParameters.vue'
const props = defineProps({ character: { type: Object, required: true } })
const { t } = useI18n()
const weaponId = ref(null), levels = ref({})
watch(() => props.character.id, () => { weaponId.value = props.character.exclusivePassives?.at(-1)?.id; levels.value = {} }, { immediate: true })
const weapon = computed(() => props.character.exclusivePassives?.find(item => item.id === weaponId.value))
const collectionLevel = collection => collection.levels.find(level => level.level === levels.value[collection.id]) ?? collection.levels.find(level => level.rarity === 'LR') ?? collection.levels.at(-1)
</script>
<style scoped>
.profile-section { border-top:1px solid var(--border-subtle); margin-top:20px; padding-top:8px; }.profile-section h3 { font-size:var(--fs-base); }.profile-section p,.profile-section label { font-size:var(--fs-sm); }.collection + .collection { border-top:1px solid var(--border-subtle); margin-top:18px; }.collection h4 { margin-bottom:10px; }.members { display:flex; flex-wrap:wrap; gap:6px 12px; margin-bottom:14px; }.members .catalog-image { width:48px; height:48px; border-radius:8px; }.members a:focus-visible { outline:2px solid var(--gold); outline-offset:3px; }.members a { color:var(--gold); font-size:var(--fs-sm); }.form-select { width:100%; margin-top:6px; }
</style>
