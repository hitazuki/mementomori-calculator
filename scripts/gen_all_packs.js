/** 脚本: gen_all_packs.js
 * 用途: 解析抓取回来的原始礼包数据，对价格和内容物完全一致的礼包进行去重清洗，最后输出供计算器使用的主数据(allPacks.json)。
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { parseMainQuestProgress } from '../src/engine/mainQuestProgress.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

// 1. Read input JSONs
const rawUltraSalePath = path.join(root, 'doc', 'items', 'UltraSalePack', 'ultra-sale-packs.json')
const witchGiftPath = path.join(root, 'src', 'constants', 'witchGiftPacks.json')
const itemScoresPath = path.join(root, 'src', 'constants', 'itemScores.json')

const ultraSaleRawDict = JSON.parse(fs.readFileSync(rawUltraSalePath, 'utf8'))
const witchGiftRaw = JSON.parse(fs.readFileSync(witchGiftPath, 'utf8'))
const itemScores = JSON.parse(fs.readFileSync(itemScoresPath, 'utf8'))

const permanentPacksPath = path.join(root, 'src', 'constants', 'permanentPacks.json')
let permanentPacksRaw = []
if (fs.existsSync(permanentPacksPath)) {
  permanentPacksRaw = JSON.parse(fs.readFileSync(permanentPacksPath, 'utf8'))
}

// 1.5 Flatten Ultra Sale Packs
const ultraSaleRaw = []
const towerIdMap = {
  '2': 'origin_tower_infinite',
  '3': 'origin_tower_blue',
  '4': 'origin_tower_red',
  '5': 'origin_tower_green',
  '6': 'origin_tower_yellow',
  '7': 'origin_group_all_towers'
}

function packSortKey(cat, id) {
  if (cat === 'quest') return parseMainQuestProgress(id)
  return parseInt(id)
}

for (const [key, packs] of Object.entries(ultraSaleRawDict)) {
  const parts = key.split('_')
  let cat = parts[0]
  let tower = null
  let priceStr = ''
  
  if (cat === 'tower') {
    tower = towerIdMap[parts[1]] || 'origin_tower_unknown'
    priceStr = parts[2]
  } else if (cat === 'rank') {
    priceStr = parts[1]
  } else if (cat === 'quest') {
    priceStr = parts[1]
  }

  const price = parseInt(priceStr.replace('¥', ''))

  for (const pack of packs) {
    // Simplify items by removing string names
    const simplifiedItems = pack.Item.map(i => ({
      ItemType: i.ItemType,
      ItemId: i.ItemId,
      ItemCount: i.ItemCount
    }))
    
    ultraSaleRaw.push({
      cat: cat,
      tower: tower,
      price: price,
      trigger: pack.Id,
      sortKey: packSortKey(cat, pack.Id),
      items: simplifiedItems
    })
  }
}

// Output the flattened ultraSalePacks.json for backward compatibility with old views
const ultraSaleOutPath = path.join(root, 'src', 'constants', 'ultraSalePacks.json')
fs.writeFileSync(ultraSaleOutPath, JSON.stringify(ultraSaleRaw, null, 0))
console.log(`Generated ultraSalePacks.json (flattened) with ${ultraSaleRaw.length} elements.`)

// Prepare forward dictionary for item display names (for generating Markdown)
const idToNameMap = new Map()
for (const [key, val] of Object.entries(itemScores)) {
  const [itype, iid] = JSON.parse(key)
  idToNameMap.set(`${itype}_${iid}`, val.nameZh || val.name || "Unknown")
}

// 2. Format Raw Packs into standard layout
const allRawPacks = []

for (const p of ultraSaleRaw) {
  allRawPacks.push({
    _type: 'ultra',
    cat: p.cat,
    tower: p.tower,
    price: p.price,
    items: p.items
  })
}

for (const p of witchGiftRaw) {
  allRawPacks.push({
    _type: 'witch',
    witchType: p.type,
    witchElement: p.element,
    stage: p.stage,
    price: p.price,
    items: p.items
  })
}

for (const p of permanentPacksRaw) {
  allRawPacks.push({
    _type: 'permanent',
    name: p.name,
    price: p.price,
    items: p.items
  })
}

// 3. Deduplication
const dedupMap = new Map()

for (const p of allRawPacks) {
  const sortedItems = [...p.items].sort((a, b) => a.ItemType - b.ItemType || a.ItemId - b.ItemId)
  const key = `${p.price}|${JSON.stringify(sortedItems.map(i => [i.ItemType, i.ItemId, i.ItemCount]))}`
  
  if (!dedupMap.has(key)) {
    dedupMap.set(key, {
      price: p.price,
      items: p.items,
      rawPacks: []
    })
  }
  dedupMap.get(key).rawPacks.push(p)
}

const permPackNameMap = {
  "强化秘药 组合包": "[ShopCommonProductName7]",
  "强化秘药 (大) 组合包": "[ShopCommonProductName33]",
  "赤红秘药 组合包": "[ShopCommonProductName22]",
  "圣装钢 组合包": "[ShopCommonProductName10]",
  "精炼钢 组合包": "[ShopCommonProductName11]",
  "符石兑换券 (大) 组合包": "[ShopCommonProductName12]",
  "魔女的信爱 组合包": "[ShopCommonProductName14]",
  "祝福之光 组合包": "[ShopCommonProductName19]",
  "天使的教谕 组合包": "[ShopCommonProductName20]",
  "女神的恩宠 组合包": "[ShopCommonProductName21]",
  "圣骑士 组合包": "[ShopCommonProductName27]",
  "天使的指引 组合包": "[ShopCommonProductName31]",
  "天使的羽翼 组合包": "[ShopCommonProductName39]",
  "奇迹的恩赐 组合包": "[ShopCommonProductName40]",
  "钻石组合包 80": "origin_perm_diamond_80",
  "钻石组合包 80 (首次双倍)": "origin_perm_diamond_80_double",
  "钻石组合包 325": "origin_perm_diamond_325",
  "钻石组合包 325 (首次双倍)": "origin_perm_diamond_325_double",
  "钻石组合包 500": "origin_perm_diamond_500",
  "钻石组合包 500 (首次双倍)": "origin_perm_diamond_500_double",
  "钻石组合包 750": "origin_perm_diamond_750",
  "钻石组合包 750 (首次双倍)": "origin_perm_diamond_750_double",
  "钻石组合包 1500": "origin_perm_diamond_1500",
  "钻石组合包 1500 (首次双倍)": "origin_perm_diamond_1500_double",
  "钻石组合包 3000": "origin_perm_diamond_3000",
  "钻石组合包 3000 (首次双倍)": "origin_perm_diamond_3000_double",
  "钻石组合包 5900": "origin_perm_diamond_5900",
  "钻石组合包 5900 (首次双倍)": "origin_perm_diamond_5900_double"
}

function synthesizeI18nKeys(rawPacks) {
  const keys = new Set()
  let hasUltra = false
  let hasWitch = false
  let hasPermanent = false

  for (const p of rawPacks) {
    if (p._type === 'witch') {
      hasWitch = true
      // Pass stage as a param for i18n
      keys.add(`origin_witch_${p.witchType}_${p.witchElement}|${p.stage}`)
    } else if (p._type === 'ultra') {
      hasUltra = true
      if (p.cat === 'tower') {
        if (p.tower) keys.add(p.tower)
        else keys.add(`origin_tower_unknown`) // fallback
      } else if (p.cat === 'rank') {
        keys.add('origin_rank')
      } else if (p.cat === 'quest') {
        keys.add('origin_quest')
      } else {
        keys.add('origin_unknown')
      }
    } else if (p._type === 'permanent') {
      hasPermanent = true
      const mappedKey = permPackNameMap[p.name] || p.name
      keys.add(mappedKey)
    }
  }

  let sourceBadge = 'mixed'
  if (hasUltra && !hasWitch && !hasPermanent) sourceBadge = 'ultra_sale'
  if (!hasUltra && hasWitch && !hasPermanent) sourceBadge = 'witch_gift'
  if (!hasUltra && !hasWitch && hasPermanent) sourceBadge = 'permanent_pack'

  return {
    source: sourceBadge,
    originKeys: Array.from(keys)
  }
}

const finalPacks = []
for (const group of dedupMap.values()) {
  const info = synthesizeI18nKeys(group.rawPacks)
  finalPacks.push({
    source: info.source,
    price: group.price,
    items: group.items,
    originKeys: info.originKeys
  })
}

const outPath = path.join(root, 'src', 'constants', 'allPacks.json')
fs.writeFileSync(outPath, JSON.stringify(finalPacks, null, 2))
console.log(`Generated allPacks.json with ${finalPacks.length} totally unique packs (i18n supported).`)


// 4. Auto-generate WitchGiftPacks.md
const mdLines = [
  '<!-- 自动生成，请勿手动修改此文件 -->',
  '<!-- 礼包数据源在 src/constants/witchGiftPacks.json 中维护 -->',
  '',
  '# 魔女的赠礼 (Witch\'s Gift) 礼包记录',
  '',
  '本文档用于记录“魔女的赠礼”各个阶段触发的礼包内容与价格。',
  ''
]

function formatItem(item) {
  let name = idToNameMap.get(`${item.ItemType}_${item.ItemId}`) || `未知物品[${item.ItemType},${item.ItemId}]`
  let count = item.ItemCount
  if (count >= 100000 && count % 10000 === 0) count = (count / 10000) + '万'
  return `${name} x${count}`
}

function generateTable(packs, title) {
  mdLines.push(`## ${title}`)
  mdLines.push('| 阶段(稀有度) | 免费赠送 | 礼包价格(日元) | 钻石 | 内容物 1 | 内容物 2 |')
  mdLines.push('| :--- | :--- | :--- | :--- | :--- | :--- |')
  
  if (packs.length === 0) {
    mdLines.push('| SR | | | | | |')
    mdLines.push('| SR+ | | | | | |')
    mdLines.push('| SSR | | | | | |')
    mdLines.push('| SSR+ | | | | | |')
    mdLines.push('| UR | | | | | |')
    mdLines.push('| UR+ | | | | | |')
    mdLines.push('| LR | | | | | |')
  } else {
    for (let i = 0; i < packs.length; i++) {
      const p = packs[i]
      const items = p.items || []
      const free = (p.freeItems && p.freeItems[0]) ? formatItem(p.freeItems[0]) : ''
      const i1 = items[0] ? formatItem(items[0]) : ''
      const i2 = items[1] ? formatItem(items[1]) : ''
      const i3 = items[2] ? formatItem(items[2]) : ''
      mdLines.push(`| ${p.stage} | ${free} | ${p.price} | ${i1} | ${i2} | ${i3} |`)
    }
  }
  mdLines.push('')
}

const firstFour = witchGiftRaw.filter(p => p.type === 'first' && p.element === 'four_elements')
const firstLightDark = witchGiftRaw.filter(p => p.type === 'first' && p.element === 'light_dark')
const rerunFour = witchGiftRaw.filter(p => p.type === 'rerun' && p.element === 'four_elements')
const rerunLightDark = witchGiftRaw.filter(p => p.type === 'rerun' && p.element === 'light_dark')

generateTable(firstFour, '首次 - 四属（蓝/红/翠/黄）')
generateTable(firstLightDark, '首次 - 光暗')
generateTable(rerunFour, '复刻 - 四属（蓝/红/翠/黄）')
generateTable(rerunLightDark, '复刻 - 光暗')

const mdOutPath = path.join(root, 'doc', 'items', 'Pack', 'WitchGiftPacks.md')
fs.writeFileSync(mdOutPath, mdLines.join('\n'))
console.log('Auto-generated WitchGiftPacks.md')
