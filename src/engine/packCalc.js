/**
 * 超值限时组合包 性价比计算引擎
 *
 * packs: [{ cat, tower, price, trigger, sortKey, items: [{ItemType, ItemId, ItemCount}] }]
 * scores: { "[ItemType,ItemId]": { name, score, batch, iconId } }
 *
 * 返回 packs 数组，每项增加 value, diamondCount, ce 字段
 */

// 同质道具换算规则
const DERIVED_RULES = {
  // 挂机资源按时长比例 (ItemType=10)
  resourceTimeScale: {
    // ItemId -> baseId + multiplier
    2: { base: 1, mult: 2 },   // 金币(2h) = 金币(1h) × 2
    3: { base: 1, mult: 6 },   // 6h
    4: { base: 1, mult: 8 },   // 8h
    5: { base: 1, mult: 24 },  // 24h
    7: { base: 6, mult: 2 },   // 经验珠(2h)
    8: { base: 6, mult: 6 },   // 6h
    9: { base: 6, mult: 8 },   // 8h
    10: { base: 6, mult: 24 }, // 24h
    12: { base: 11, mult: 2 }, // 潜能宝珠(2h)
    13: { base: 11, mult: 6 }, // 6h
    14: { base: 11, mult: 8 }, // 8h
    15: { base: 11, mult: 24 },// 24h
  },
  // 培育材料组(Nh) = 金币(Nh) + 经验珠(Nh) + 潜能宝珠(Nh)
  growthSet: {
    16: { gold: 1, exp: 6, kindle: 11, mult: 1 },   // 培育材料组(1h)
    17: { gold: 1, exp: 6, kindle: 11, mult: 2 },   // 2h
    18: { gold: 1, exp: 6, kindle: 11, mult: 6 },   // 6h
    19: { gold: 1, exp: 6, kindle: 11, mult: 8 },   // 8h
    20: { gold: 1, exp: 6, kindle: 11, mult: 24 },  // 24h
  },
  // 魔装高级香油 = 3 × 魔装香油
  // ItemType=15, ItemId=2 -> base is ItemType=15, ItemId=1, mult=3
  // 未鉴定符石: LvN = Lv2 × 2^(N-2), ItemIds 5-10
  runeLevelMult: {
    6: 2,   // Lv3 = Lv2 × 2
    7: 4,   // Lv4 = Lv2 × 4
    8: 8,   // Lv5 = Lv2 × 8
    9: 16,  // Lv6 = Lv2 × 16
    10: 32, // Lv7 = Lv2 × 32
  },
  // 魔女的来信: 蓝/红/翠/黄 等价 → all use ItemId=21's score
  witchLetterSame: [22, 23, 24],  // these use same score as 21
}

function scoreKey(itype, iid) {
  return `[${itype},${iid}]`
}

function getScore(scores, itype, iid) {
  // Resolve derived items first
  if (itype === 10) {
    // 培育材料组
    const gs = DERIVED_RULES.growthSet[iid]
    if (gs) {
      const goldScore = getScore(scores, 10, gs.gold) * gs.mult
      const expScore = getScore(scores, 10, gs.exp) * gs.mult
      const kindleScore = getScore(scores, 10, gs.kindle) * gs.mult
      return goldScore + expScore + kindleScore
    }
    // 挂机资源按时长
    const ts = DERIVED_RULES.resourceTimeScale[iid]
    if (ts) {
      const base = getScore(scores, 10, ts.base)
      return base * ts.mult
    }
  }

  // 魔装高级香油 (ItemType=15, ItemId=2)
  if (itype === 15 && iid === 2) {
    return getScore(scores, 15, 1) * 3
  }

  // 未鉴定符石 Lv3-7 (ItemType=17)
  if (itype === 17) {
    const mult = DERIVED_RULES.runeLevelMult[iid]
    if (mult) {
      return getScore(scores, 17, 5) * mult
    }
    // 魔女的来信 红/翠/黄 等价于蓝
    if (DERIVED_RULES.witchLetterSame.includes(iid)) {
      return getScore(scores, 17, 21)
    }
  }

  // Direct lookup
  const s = scores[scoreKey(itype, iid)]
  if (s && s.score > 0) {
    return s.score / s.batch
  }
  return 0
}

export function getBaseItemKey(itype, iid) {
  // 1. 挂机资源按时长 (金币/经验/潜能)
  const ts = DERIVED_RULES.resourceTimeScale[iid]
  if (itype === 10 && ts) return `[${itype},${ts.base}]`
  
  // 2. 培育材料组 (统一映射为 24h [10,20] 代表)
  if (itype === 10 && DERIVED_RULES.growthSet[iid]) return `[10,20]`
  
  // 3. 魔装高级香油 -> 普通香油
  if (itype === 15 && iid === 2) return `[15,1]`
  
  // 4. 未鉴定符石 (Lv3-7 映射到 Lv2 [17,5])
  if (itype === 17 && DERIVED_RULES.runeLevelMult[iid]) return `[17,5]`
  
  // 5. 魔女的来信 (红翠黄 映射到 蓝)
  if (itype === 17 && DERIVED_RULES.witchLetterSame.includes(iid)) return `[17,21]` // SR
  if (itype === 17 && [18,19,20].includes(iid)) return `[17,17]` // R

  // 其他物品没有同质衍生，直接返回自身
  return `[${itype},${iid}]`
}

export function getItemInfo(scores, itype, iid) {
  const key = scoreKey(itype, iid)
  const s = scores[key]
  return {
    name: s ? s.name : `T${itype}I${iid}`,
    nameZh: s ? s.nameZh : '',
    nameTw: s ? s.nameTw : '',
    nameEn: s ? s.nameEn : '',
    nameJa: s ? s.nameJa : '',
    nameKo: s ? s.nameKo : '',
    iconId: s ? s.iconId : iid,
    batch: s ? s.batch : 1,
    score: s ? s.score : 0
  }
}

export function calculatePackCE(packs, scores) {
  return packs.map(pack => {
    let totalValue = 0
    let diamondCount = 0
    const itemDetails = []

    for (const item of pack.items) {
      const itype = item.ItemType
      const iid = item.ItemId
      const qty = item.ItemCount

      const unitScore = getScore(scores, itype, iid)
      const info = getItemInfo(scores, itype, iid)

      if (itype === 2 && iid === 1) {
        diamondCount = qty
      }

      const itemValue = unitScore * qty
      totalValue += itemValue

      itemDetails.push({
        ...info,
        itype,
        iid,
        qty,
        value: itemValue
      })
    }

    return {
      ...pack,
      value: Math.round(totalValue),
      diamondCount,
      ce: diamondCount > 0 ? (totalValue / diamondCount) : 0,
      items: itemDetails
    }
  })
}

/**
 * Parse scores from the imported JSON into a plain object for O(1) lookup
 */
export function normalizeScores(rawScores) {
  // rawScores is already keyed by "[itype,iid]"
  // Just ensure all fields are present
  const result = {}
  for (const [key, val] of Object.entries(rawScores)) {
    result[key] = {
      ...val,
      name: val.name || '',
      score: val.score || 0,
      batch: val.batch || 1,
      iconId: val.iconId || 0
    }
  }
  return result
}
