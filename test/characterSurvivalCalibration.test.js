import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { capacityBand, survivalCalibration, survivalCalibrationReference } from '../scripts/lib/characterSurvivalCalibration.mjs'
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'))
const records=read('../doc/character-ratings/v6/review.json').records
const get=id=>records.find(r=>r.id===id)
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex')

test('expanded finite-capacity anchors separate 400, 600 and 800 percent without a healing veto',()=>{
  assert.deepEqual([1,1.05,1.15,1.3,1.5,1.8,2.2,3,4,6,8,20].map(capacityBand),[0,1,2,3,4,5,6,7,8,9,10,10])
  assert.equal(capacityBand(5.999),8)
  assert.equal(capacityBand(7.999),9)
  assert.equal(get(125).axes[3].score,8) // 400%, permanent, no healing.
  assert.equal(get(114).axes[3].score,9) // 634%, limited heals do not erase expiry.
  assert.equal(get(156).axes[3].score,10) // 800% permanent before stacking, no heal required.
  assert.equal(get(156).survival.calibration.burstReference.capacity,8)
  assert.equal(get(156).survival.calibration.sustainReference.capacity,8)
})

test('all 138 authored reviews retain source checks and freeze the other five axes and raw calculations',()=>{
  assert.equal(Object.keys(survivalCalibration.records).length,138)
  for(const r of records) {
    const c=survivalCalibration.records[r.id]
    assert.equal(c.sourceHash,r.sourceHash)
    const baseline=read('../doc/character-ratings/v6/output-calibration.json').records[r.id]
    assert.equal(hash([...baseline.previousAxes,...r.axes.slice(4)]),c.preservedAxesHash)
    assert.equal(hash(r.output),c.preservedOutputHash)
    assert.equal(hash(r.survival.states),c.preservedStatesHash)
    assert.deepEqual(r.survival.calibration,survivalCalibrationReference(r.id,r.survival.states,r.sourceHash))
    assert.throws(()=>survivalCalibrationReference(r.id,r.survival.states,'stale'),'do not refresh hashes to bypass source review')
    const pub=read(`../public/data/character-ratings/${r.id}.json`)
    assert.deepEqual(pub.assessment.survivalCalibration,r.survival.calibration)
  }
})

test('one-time shields, early shield expiry and recovery do not silently become permanent capacity',()=>{
  assert.ok(get(69).axes[2].score>get(69).axes[3].score)
  assert.equal(get(78).axes[3].score,0) // All protection expires at turn 11.
  assert.equal(get(157).survival.calibration.burstReference.state,0) // Not the mature 1680% shield.
  assert.equal(get(157).survival.calibration.sustainReference.capacity,4)
  assert.equal(get(155).survival.calibration.burstReference.state,1) // Four-event state, not 15-event ceiling.
  assert.equal(get(155).axes[3].score,0)
  assert.equal(get(82).survival.calibration.burstReference.capacity,1.22) // 80% healing never becomes block.
  assert.ok(get(82).axes[3].score>get(82).axes[2].score)
  assert.ok(get(81).axes[3].score>get(68).axes[3].score) // Long vs short transparency, no invented EHP.
})
