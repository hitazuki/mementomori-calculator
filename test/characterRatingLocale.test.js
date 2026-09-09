import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { ratingDisplayTexts, completeRatingTranslation, loadRatingTranslations } from '../src/utils/characterRatingLocale.js'
import { readCharacterCatalog } from '../scripts/lib/characterCatalog.mjs'

const read=path=>JSON.parse(fs.readFileSync(new URL(path,import.meta.url)))
const records=readCharacterCatalog(new URL('../public/data/character-catalog/',import.meta.url)).characters.map(c=>read(`../public/data/character-ratings/${c.id}.json`))
const percentages=text=>(text.match(/\d+(?:\.\d+)?%/g)??[]).sort()

test('all 134 characters have complete localized rating copy, with original percentages retained',()=>{
  assert.equal(records.length,134)
  for(const locale of ['en','ja','ko','zh-TW']) {
    const bundle=read(`../public/data/character-ratings/i18n/${locale}.json`)
    const authored=read(`../doc/character-ratings/i18n/${locale}.json`)
    assert.equal(bundle.locale,locale)
    for(const r of records) {
      assert.ok(completeRatingTranslation(r,bundle.translations),`${locale}/${r.id}`)
      for(const source of ratingDisplayTexts(r)) {
        const translated=bundle.translations[source]
        assert.equal(translated,authored[source])
        assert.deepEqual(percentages(translated),percentages(source),`${locale}/${r.id}: ${source}`)
        const numbers = text => text.replace(/\b(?:S|P|R|Lv|CD)\d+/g,'').match(/\d+(?:\.\d+)?/g) ?? []
        for (const value of new Set(numbers(source).filter(n=>Number(n)>=3))) {
          assert.ok(numbers(translated).filter(n=>n===value).length>=numbers(source).filter(n=>n===value).length,`${locale}/${r.id}: missing ${value}`)
        }
        for (const slot of source.match(/\b[SP][12]\b/g) ?? []) assert.ok(translated.includes(slot))
        assert.doesNotMatch(translated,/[{｛]|UNRESOLVED|battery life|バッテリー|배터리/)
        if(locale==='en'||locale==='ko') assert.doesNotMatch(translated,/[\u3400-\u9fff]/)
      }
    }
  }
})

test('missing or outdated translations require an explicit source-language fallback',()=>{
  const r=records[0],d={...read('../public/data/character-ratings/i18n/en.json').translations}
  delete d[r.axes[0].reason]
  assert.equal(completeRatingTranslation(r,d),false)
  assert.equal(completeRatingTranslation(r,null),false)
})

test('locale requests share one cached fetch, while failed requests can be retried',async t=>{
  let calls=0
  t.mock.method(globalThis,'fetch',async()=>{
    calls++
    return {ok:true,json:async()=>({locale:'en',translations:{sample:'Sample'}})}
  })
  const [a,b]=await Promise.all([loadRatingTranslations('en'),loadRatingTranslations('en')])
  assert.equal(calls,1)
  assert.deepEqual(a,b)
  t.mock.method(globalThis,'fetch',async()=>{
    calls++
    if(calls===2) throw new Error('Network unavailable')
    return {ok:true,json:async()=>({locale:'ja',translations:{sample:'例'}})}
  })
  await assert.rejects(loadRatingTranslations('ja'))
  assert.deepEqual(await loadRatingTranslations('ja'),{sample:'例'})
  assert.equal(calls,3)
  await loadRatingTranslations('ja', { reload: true })
  assert.equal(calls,4)
})
