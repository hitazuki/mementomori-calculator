// src/engine/mysteriumCalc.js

function isConnectedPlan(charSet, activated) {
  const adjacency = new Map(Array.from(charSet, cid => [cid, new Set()]))
  for (const col of activated) {
    const required = col.reqCids.filter(cid => charSet.has(cid))
    for (const cid of required.slice(1)) {
      adjacency.get(required[0]).add(cid)
      adjacency.get(cid).add(required[0])
    }
  }

  const reached = new Set()
  const pending = [charSet.values().next().value]
  while (pending.length > 0) {
    const cid = pending.pop()
    if (reached.has(cid)) continue
    reached.add(cid)
    for (const next of adjacency.get(cid)) pending.push(next)
  }
  return reached.size === charSet.size
}

export function calculateMysteriumRankings(characters, collections, scoringTemplate, algorithmId) {
  // 1. Build score lookup map
  const scoresMap = new Map()
  let levelCapScore = 0
  let levelCapBaseVal = 5

  for (const t of scoringTemplate) {
    if (t.key === 'appLevelCap') {
      levelCapBaseVal = t.baseVal
      levelCapScore = t.score
    } else {
      scoresMap.set(`${t.key}_${t.ctype}`, t)
    }
  }

  const levelCapBonusPerChar = levelCapBaseVal > 0 ? (5.0 / levelCapBaseVal) * levelCapScore : 0

  // 2. Map characters & calculate cost
  const charMap = new Map()
  for (const cid in characters) {
    const c = characters[cid]
    const cost = c.isLimited ? ([5, 6].includes(c.elementType) ? 1.75 : 1.0) : 0
    charMap.set(Number(cid), {
      ...c,
      cost,
      earnedScore: 0,
      ce: 0,
      activated: []
    })
  }

  // 3. Score collections
  const colScores = new Map()
  const scoredCols = []

  for (const col of collections) {
    let totalScore = 0
    const details = []
    
    const evaluateParams = (paramList) => {
      for (const p of paramList) {
        let evalVal = p.val
        if (p.ctype === 2) evalVal = p.val / 10000.0 // Percentage 200 -> 0.02
        
        const keyStr = `${p.nameKey}_${p.ctype}`
        const template = scoresMap.get(keyStr)
        if (template && template.baseVal > 0) {
          const s = (evalVal / template.baseVal) * template.score
          totalScore += s
          details.push({
            nameKey: p.nameKey,
            ctype: p.ctype,
            val: evalVal,
            score: s
          })
        }
      }
    }
    
    evaluateParams(col.params)
    evaluateParams(col.baseParams)
    
    colScores.set(col.id, {
      score: totalScore,
      details
    })
    
    scoredCols.push({
      ...col,
      totalScore,
      details
    })
  }

  const limitedChars = Array.from(charMap.values()).filter(c => c.isLimited && c.cost > 0)
  const limitedCids = limitedChars.map(c => c.id)
  
  let result = {
    algo: algorithmId,
    rankings: [] // Format depends on algo
  }

  if (algorithmId === 1) {
    // Algo 1: Independent sharing
    for (const col of scoredCols) {
      let totalCost = 0
      for (const reqCid of col.reqCids) {
        if (charMap.has(reqCid)) totalCost += charMap.get(reqCid).cost
      }
      
      if (totalCost > 0) {
        for (const reqCid of col.reqCids) {
          const char = charMap.get(reqCid)
          if (char && char.cost > 0) {
            const portion = char.cost / totalCost
            char.earnedScore += col.totalScore * portion
            char.activated.push({
              col: col,
              portion: portion,
              score: col.totalScore * portion
            })
          }
        }
      }
    }

    for (const c of limitedChars) {
      c.earnedScore += levelCapBonusPerChar
      c.ce = c.earnedScore / c.cost
    }

    result.rankings = limitedChars
      .sort((a, b) => b.ce - a.ce)
      .map(c => ({
        type: 'char',
        id: c.id,
        nameKey: c.nameKey,
        name2Key: c.name2Key,
        cost: c.cost,
        score: c.earnedScore,
        ce: c.ce,
        activated: c.activated
      }))
      
  } else if (algorithmId === 2 || algorithmId === 3) {
    // Build adjacency list for limited characters connected by collections
    const adj = new Map()
    for (const cid of limitedCids) adj.set(cid, new Set())
      
    for (const col of scoredCols) {
      const reqLims = col.reqCids.filter(id => adj.has(id))
      for (let i = 0; i < reqLims.length; i++) {
        for (let j = i + 1; j < reqLims.length; j++) {
          adj.get(reqLims[i]).add(reqLims[j])
          adj.get(reqLims[j]).add(reqLims[i])
        }
      }
    }

    // Find connected components
    const visited = new Set()
    const components = []
    for (const cid of limitedCids) {
      if (!visited.has(cid)) {
        const comp = []
        const q = [cid]
        visited.add(cid)
        while (q.length > 0) {
          const curr = q.shift()
          comp.push(curr)
          for (const nxt of adj.get(curr)) {
            if (!visited.has(nxt)) {
              visited.add(nxt)
              q.push(nxt)
            }
          }
        }
        components.push(comp)
      }
    }

    if (algorithmId === 2) {
      const setRankings = []
      
      for (const comp of components) {
        let setCost = 0
        for (const cid of comp) setCost += charMap.get(cid).cost
        
        let setScore = levelCapBonusPerChar * comp.length
        const compSet = new Set(comp)
        const compCols = []
        
        for (const col of scoredCols) {
          const hasOverlap = col.reqCids.some(rc => compSet.has(rc))
          if (hasOverlap) {
            setScore += col.totalScore
            compCols.push(col)
          }
        }
        
        const setCe = setCost > 0 ? setScore / setCost : 0
        
        // Build set object
        setRankings.push({
          type: 'set',
          chars: comp.map(cid => charMap.get(cid)),
          cost: setCost,
          score: setScore,
          ce: setCe,
          activated: compCols
        })
      }
      
      result.rankings = setRankings.sort((a, b) => b.ce - a.ce)

    } else if (algorithmId === 3) {
      const allPlans = new Map()

      // Generator for combinations
      function* combinations(elements, length) {
        if (length === 0) { yield []; return; }
        for (let i = 0; i <= elements.length - length; i++) {
          const head = elements.slice(i, i + 1);
          for (const tail of combinations(elements.slice(i + 1), length - 1)) {
            yield head.concat(tail);
          }
        }
      }

      for (const comp of components) {
        const compSet = new Set(comp)
        const compCols = []
        for (const col of scoredCols) {
          const reqLims = col.reqCids.filter(rc => limitedCids.includes(rc))
          if (reqLims.length > 0 && reqLims.some(rc => compSet.has(rc))) {
            compCols.push({ col, reqLims: new Set(reqLims) })
          }
        }

        if (compCols.length === 0) continue

        const uniquePlans = new Map()

        for (let r = 1; r <= compCols.length; r++) {
          for (const subset of combinations(compCols, r)) {
            // Union of reqLims
            const planChars = new Set()
            for (const item of subset) {
              for (const rc of item.reqLims) planChars.add(rc)
            }
            
            const planKey = Array.from(planChars).sort().join(',')
            if (!uniquePlans.has(planKey)) {
              let planCost = 0
              for (const cid of planChars) planCost += charMap.get(cid).cost
                
              let planScore = levelCapBonusPerChar * planChars.size
              const activatedCols = []
              
              for (const item of compCols) {
                // Check if item.reqLims is subset of planChars
                const isSubset = Array.from(item.reqLims).every(rc => planChars.has(rc))
                if (isSubset) {
                  planScore += item.col.totalScore
                  activatedCols.push(item.col)
                }
              }
              
              const planCe = planCost > 0 ? planScore / planCost : 0
              uniquePlans.set(planKey, {
                chars: Array.from(planChars).map(cid => charMap.get(cid)),
                charSet: planChars,
                cost: planCost,
                score: planScore,
                ce: planCe,
                activated: activatedCols
              })
            }
          }
        }

        for (const [pKey, pData] of uniquePlans.entries()) {
          // Only activated collections can connect a recommendation. Keep all
          // subsets in uniquePlans so marginal CE still considers every baseline.
          if (!isConnectedPlan(pData.charSet, pData.activated)) continue
          let marginalCe = pData.ce
          let bottleneckPlanChars = []

          for (const [sKey, sData] of uniquePlans.entries()) {
            // Check if sData.charSet is strict subset of pData.charSet
            const isStrictSubset = sData.charSet.size < pData.charSet.size && 
                                   Array.from(sData.charSet).every(c => pData.charSet.has(c))
            if (isStrictSubset) {
              const costDiff = pData.cost - sData.cost
              if (costDiff > 0) {
                const scoreDiff = pData.score - sData.score
                const ceDiff = scoreDiff / costDiff
                if (ceDiff < marginalCe) {
                  marginalCe = ceDiff
                  bottleneckPlanChars = sData.chars
                }
              }
            }
          }

          const baselineIds = new Set(bottleneckPlanChars.map(c => c.id))
          const addedIds = new Set(pData.chars.filter(c => !baselineIds.has(c.id)).map(c => c.id))
          const requiredBaseline = new Set()
          // A prerequisite contributes only if it is required by a nonzero
          // collection unlocked by the added characters. Baseline-only rewards
          // cancel out of marginal CE and must not create duplicate routes.
          for (const col of pData.activated) {
            if (col.totalScore === 0 || !col.reqCids.some(cid => addedIds.has(cid))) continue
            for (const cid of col.reqCids) {
              if (baselineIds.has(cid)) requiredBaseline.add(cid)
            }
          }
          const minimalIds = new Set([...addedIds, ...requiredBaseline])
          const activated = compCols.filter(item =>
            Array.from(item.reqLims).every(cid => minimalIds.has(cid))
          ).map(item => item.col)
          const chars = pData.chars.filter(c => minimalIds.has(c.id))
          const cost = chars.reduce((sum, c) => sum + c.cost, 0)
          const score = levelCapBonusPerChar * chars.length +
            activated.reduce((sum, col) => sum + col.totalScore, 0)
          const addedCost = chars.filter(c => addedIds.has(c.id)).reduce((sum, c) => sum + c.cost, 0)
          const addedScore = levelCapBonusPerChar * addedIds.size + activated
            .filter(col => col.reqCids.some(cid => addedIds.has(cid)))
            .reduce((sum, col) => sum + col.totalScore, 0)
          const routeKey = `${Array.from(addedIds).sort().join(',')}|${Array.from(requiredBaseline).sort().join(',')}`
          allPlans.set(routeKey, {
            chars, cost, score, ce: score / cost, marginalCe: addedScore / addedCost,
            bottleneck: bottleneckPlanChars.filter(c => requiredBaseline.has(c.id)),
            activated
          })
        }
      }

      // Sort by marginal CE descending
      result.rankings = Array.from(allPlans.values())
        .sort((a, b) => b.marginalCe - a.marginalCe)
        .map(p => ({
          type: 'plan',
          chars: p.chars,
          cost: p.cost,
          score: p.score,
          ce: p.ce,
          marginalCe: p.marginalCe,
          bottleneck: p.bottleneck,
          activated: p.activated
        }))
    }
  }

  // 6. Format collections ranking
  result.collections = scoredCols.map(col => {
    let cost = 0
    let chars = []
    for (const cid of col.reqCids) {
      if (charMap.has(cid)) {
        const char = charMap.get(cid)
        cost += char.cost
        chars.push(char)
      } else {
        chars.push({ id: cid, nameKey: '???', cost: 0 })
      }
    }
    return {
      ...col,
      chars,
      cost,
      ce: cost > 0 ? col.totalScore / cost : col.totalScore // If cost is 0, use totalScore to represent its value (technically infinity)
    }
  }).sort((a, b) => b.ce - a.ce) // Sort by CE descending by default

  return result
}
