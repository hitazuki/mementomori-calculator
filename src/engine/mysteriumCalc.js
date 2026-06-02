// src/engine/mysteriumCalc.js

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
      const allPlans = []

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

          pData.marginalCe = marginalCe
          pData.bottleneck = bottleneckPlanChars
          allPlans.push(pData)
        }
      }

      // Sort by marginal CE descending
      result.rankings = allPlans
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
