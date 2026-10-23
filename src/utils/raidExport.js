function sanitizeFilenamePart(value) {
  const safe = String(value ?? '').normalize('NFKC')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[.\s-]+|[.\s-]+$/g, '')
  return safe || 'boss'
}

function timestamp(date) {
  const pad = value => String(value).padStart(2, '0')
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`
}

export function raidExportFilename(bossName, date = new Date()) {
  return `mmt-raid-${sanitizeFilenamePart(bossName)}-${timestamp(date)}.png`
}

export function canCopyPng({ secureContext = globalThis.isSecureContext, clipboard = globalThis.navigator?.clipboard, ClipboardItemClass = globalThis.ClipboardItem } = {}) {
  return Boolean(secureContext && clipboard?.write && ClipboardItemClass)
}

export async function copyPngBlob(blob, { clipboard = globalThis.navigator?.clipboard, ClipboardItemClass = globalThis.ClipboardItem, secureContext = globalThis.isSecureContext } = {}) {
  if (!canCopyPng({ secureContext, clipboard, ClipboardItemClass })) throw new Error('PNG clipboard is unavailable')
  await clipboard.write([new ClipboardItemClass({ 'image/png': blob })])
}

// Summarize combat modifiers, keeping unaffected enemies in the range as zero.
// Names, sources, durations and non-numeric effects remain in action details.
export function summarizeRaidBossRates(statuses, targetCount = 1) {
  const channels = ['damageRatePerStack', 'defenseRatePerStack', 'physicalDefenseRatePerStack', 'magicDefenseRatePerStack']
  const empty = () => Object.fromEntries(channels.map(channel => [channel, 0]))
  const firstId = targetCount > 1 ? 'enemy-1' : 'boss'
  const targets = new Map(Array.from({ length: targetCount }, (_, index) => [targetCount > 1 ? `enemy-${index + 1}` : 'boss', empty()]))
  for (const status of statuses) {
    const id = status.targetId ?? firstId
    if (!targets.has(id)) targets.set(id, empty())
    const rates = targets.get(id)
    for (const channel of channels) rates[channel] += (status[channel] ?? 0) * (status.stacks ?? 1)
  }
  return channels.flatMap(channel => {
    const values = [...targets.values()].map(rates => Number(rates[channel].toFixed(12)))
    const min = Math.min(...values)
    const max = Math.max(...values)
    return min || max ? [{ channel, min, max }] : []
  })
}

export function buildRaidExportModel({
  result, lineup, attackPriority, characters, bossName, bossStats, generatedAt = new Date(),
  locale, characterName, skillName, iconUrl, turnLabel, formatPercent, formatSymbolic, formatConversionTotals,
  bossStatusText, bossStatusSummary, elementBonusLines = [], scenarioLines = [], warningLines = [], labels,
}) {
  const rows = lineup.map(id => ({
    id,
    name: characterName(id),
    icon: iconUrl(id),
    total: formatPercent(result.characterTotals[id].atkPercent),
    conversionTotals: formatConversionTotals(result.characterTotals[id].conversionTotals),
    symbolicTotal: formatSymbolic(result.characterTotals[id].symbolicTotals),
    panel: {
      level: result.config.levels[id],
      speed: result.config.speeds[id],
      criticalDamage: result.config.criticalDamageBonuses[id] * 100,
      defensePenetration: result.config.defensePenetrations[id],
      pmDefensePenetration: result.config.pmDefensePenetrations[id],
    },
    actions: result.rounds.map(round => {
      const action = round.actions.find(entry => entry.actorId === id)
      return {
        turn: round.turn,
        skill: skillName(action.skillNameKey),
        total: formatPercent(action.effectiveAtkPercent),
      }
    }),
  }))

  const rounds = result.rounds.map(round => ({
    turn: round.turn,
    label: turnLabel(round.turn),
    orderSource: round.orderSource,
    order: round.actionOrder.map(id => ({ id, name: characterName(id), icon: iconUrl(id) })),
    total: formatPercent(round.atkPercent),
    conversionTotals: formatConversionTotals(round.conversionTotals),
    symbolicTotal: formatSymbolic(round.symbolicTotals),
    bossStatuses: bossStatusSummary ? bossStatusSummary(round.bossStatusAfterRound) : round.bossStatusAfterRound.map(bossStatusText),
  }))

  return {
    locale,
    title: labels.title,
    generatedLabel: labels.generatedAt,
    generatedAt: generatedAt.toLocaleString(locale),
    boss: { name: bossName, stats: bossStats },
    enemyTotals: result.config.bossTemplateId === 'five-targets' ? result.enemyTotals.map(target => ({
      id: target.id, label: (labels.enemyTarget ?? 'Enemy {n}').replace('{n}', String(target.position)),
      attack: formatPercent(target.atkPercent), symbolic: formatSymbolic(target.symbolicTotals),
      conversion: Object.entries(target.conversionTotals).filter(([, value]) => value).map(([stat, value]) => `${value.toLocaleString(locale)}% ${stat}`),
    })) : [],
    guaranteedCritical: result.config.guaranteedCritical,
    lineup: lineup.map(id => ({ id, name: characterName(id), icon: iconUrl(id) })),
    attackPriority: attackPriority.map(id => ({ id, name: characterName(id), icon: iconUrl(id) })),
    elementBonusLines: [...elementBonusLines],
    scenarioLines: [...scenarioLines],
    warningLines: [...warningLines],
    labels,
    rows,
    rounds,
    totals: {
      attack: formatPercent(result.teamAtkPercent),
      conversion: formatConversionTotals(result.conversionTotals),
      symbolic: formatSymbolic(result.symbolicTotals),
    },
    characterCount: rows.length,
    roundCount: rounds.length,
    characterJobFlags: Object.fromEntries(lineup.map(id => [id, characters[id].jobFlags])),
  }
}
