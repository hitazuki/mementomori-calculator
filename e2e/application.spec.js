import { test, expect } from '@playwright/test'
import fs from 'node:fs'

const browserErrors = new WeakMap()

test.beforeEach(async ({ page }) => {
  const errors = []
  browserErrors.set(page, errors)
  page.on('pageerror', error => errors.push(error.message))
  // External typography is unrelated to application behavior and may be offline.
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort())
})
test.afterEach(async ({ page }) => { expect(browserErrors.get(page)).toEqual([]) })

async function openView(page, view) {
  await page.addInitScript(view => localStorage.setItem('mmt-calc-current-view', view), view)
  await page.goto('./', { waitUntil: 'domcontentloaded' })
}

test('raid table hides calculations for an empty lineup and restores them on selection', async ({ page }) => {
  await openView(page, 'raidTable')
  const selected = page.locator('.raid-roster-select[aria-pressed="true"]')
  await expect(selected).toHaveCount(5)
  await page.locator('.raid-action-cell').first().click()
  await expect(page.locator('.raid-detail-card')).toBeVisible()
  for (let remaining = 5; remaining > 0; remaining -= 1) {
    await selected.first().click()
    await expect(selected).toHaveCount(remaining - 1)
  }
  await expect(page.locator('.raid-roster-grid')).toBeVisible()
  for (const selector of ['.raid-summary-grid', '.raid-assumption-grid', '.raid-order-grid', '.raid-penetration-editor', '.raid-matrix-card', '.raid-detail-card', '.raid-warning-list']) {
    await expect(page.locator(selector)).toHaveCount(0)
  }
  await page.locator('.raid-roster-select').first().click()
  await expect(selected).toHaveCount(1)
  await expect(page.locator('.raid-summary-grid')).toBeVisible()
  await expect(page.locator('.raid-matrix-card')).toBeVisible()
  await expect(page.locator('.raid-penetration-editor tbody tr')).toHaveCount(1)
  await page.locator('.raid-action-cell').first().click()
  await expect(page.locator('.raid-detail-card')).toBeVisible()
  await selected.first().click()
  await expect(page.locator('.raid-matrix-card')).toHaveCount(0)
  await page.locator('.raid-config-card .raid-section-head button').click()
  await expect(selected).toHaveCount(5)
  await expect(page.locator('.raid-matrix-card')).toBeVisible()
})

test('Apostle Rosalie early-Memory control limits full stacks to six rounds and resets to natural growth', async ({ page }) => {
  await openView(page, 'raidTable')
  await expect(page.locator('.raid-roster-select').first()).toBeVisible()
  while (await page.locator('.raid-roster-select[aria-pressed="true"]').count()) {
    await page.locator('.raid-roster-select[aria-pressed="true"]').first().click()
  }
  await page.locator('.raid-roster-select').filter({ hasText: '#88' }).click()
  const checkbox = page.locator('.raid-assumption-grid label').filter({ has: page.locator('input[type="checkbox"]') }).filter({ hasText: '提前达到15层记忆' }).locator('input')
  const round = page.locator('.raid-assumption-grid label').filter({ hasText: '记忆达到15层的回合' }).locator('select')
  await expect(round).toBeDisabled()
  await expect(round.locator('option')).toHaveCount(6)
  await checkbox.check()
  await round.selectOption('1')
  await expect(round).toHaveValue('1')
  await expect(page.locator('.raid-converted-stat').first()).toContainText('% HP')
  await page.locator('.raid-roster-item').filter({ hasText: '#88' }).locator('.raid-roster-detail-button').click()
  await expect(page.locator('.raid-character-detail-modal')).toBeVisible()
  await expect(page.locator('.raid-character-detail-modal')).toContainText('最大生命值')
  await page.keyboard.press('Escape')
  await checkbox.uncheck()
  await expect(round).toBeDisabled()
  await expect(round).toHaveValue('6')
})

test('application shell renders while the master dictionary is pending', async ({ page }) => {
  let release
  const gate = new Promise(resolve => { release = resolve })
  await page.route('**/data/master_dict_zh-CN.json', async route => {
    await gate
    await route.fulfill({ json: {} })
  })
  await page.goto('./', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.sidebar')).toBeVisible()
  await expect(page.locator('h1')).toBeVisible()
  release()
})

test('Golden Artoria displays S2 healing threshold upgrades and official skill details', async ({ page }) => {
  await openView(page, 'raidTable')
  await expect(page.locator('.raid-roster-select').first()).toBeVisible()
  while (await page.locator('.raid-roster-select[aria-pressed="true"]').count()) {
    await page.locator('.raid-roster-select[aria-pressed="true"]').first().click()
  }
  for (const id of [154, 92, 80, 114, 124]) {
    await page.locator('.raid-roster-select').filter({ hasText: `#${id} ·` }).click()
  }
  const row = page.locator('.raid-matrix-card tbody tr').filter({ hasText: '#154' })
  await row.locator('.raid-action-cell').nth(1).click()
  await expect(page.locator('.raid-step-list article')).toHaveCount(4)
  await expect(page.locator('.raid-step-list article header strong').first()).toContainText('540% ATK')
  await row.locator('.raid-action-cell').nth(5).click()
  await expect(page.locator('.raid-step-list article header strong').first()).toContainText('2160% ATK')
  await expect(page.locator('.raid-detail-card')).toContainText('主动回复触发次数：15')
  await page.locator('.raid-roster-item').filter({ hasText: '#154 ·' }).locator('.raid-roster-detail-button').click()
  await expect(page.locator('.raid-character-detail-modal')).toBeVisible()
  await expect(page.locator('.raid-character-detail-modal')).toContainText('破魔圣剑')
  await expect(page.locator('.raid-character-detail-modal')).toContainText('圣剑光辉')
  await expect(page.locator('.raid-character-detail-modal')).toContainText('其他苍翠/天光属性友军合计至少2名')
})

test('Twilight Fortina exposes attribute and speed rules and five-hit S2 details', async ({ page }) => {
  await openView(page, 'raidTable')
  await expect(page.locator('.raid-roster-select').first()).toBeVisible()
  while (await page.locator('.raid-roster-select[aria-pressed="true"]').count()) {
    await page.locator('.raid-roster-select[aria-pressed="true"]').first().click()
  }
  await page.locator('.raid-roster-select').filter({ hasText: '#151 ·' }).click()
  await page.locator('.raid-roster-item').filter({ hasText: '#151 ·' }).locator('.raid-roster-detail-button').click()
  await expect(page.locator('.raid-character-detail-modal')).toContainText('有效速度严格高于自身')
  await expect(page.locator('.raid-character-detail-modal')).toContainText('天光单独计一种')
  await expect(page.locator('.raid-character-detail-modal')).toContainText('夕阳色的约定')
  await page.keyboard.press('Escape')
  await page.locator('.raid-action-cell').nth(1).click()
  await expect(page.locator('.raid-step-list article')).toHaveCount(5)
  await expect(page.locator('.raid-step-list article header strong').first()).toContainText('610% ATK')
})

test('rapid language changes retain the last selection', async ({ page }) => {
  let releaseEnglish
  const gate = new Promise(resolve => { releaseEnglish = resolve })
  await page.route('**/data/master_dict_en.json', async route => {
    await gate
    await route.fulfill({ json: {} })
  })
  await page.route('**/data/master_dict_ja.json', route => route.fulfill({ json: {} }))
  await page.goto('./')
  const select = page.locator('.global-actions select')
  await select.selectOption('en')
  await select.selectOption('ja')
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja')
  const englishResponse = page.waitForResponse('**/data/master_dict_en.json')
  releaseEnglish()
  await (await englishResponse).finished()
  await page.evaluate(() => new Promise(requestAnimationFrame))
  await expect(select).toHaveValue('ja')
  await expect.poll(() => page.evaluate(() => localStorage.getItem('mmt-calc-lang'))).toBe('ja')
})

for (const [view, file] of [['packCompare', 'allPacks'], ['packCalc', 'ultraSalePacks'], ['mysterium', 'mysterium_data']]) {
  test(`${view} displays a recoverable data failure`, async ({ page }) => {
    let fail = true
    await page.route(`**/data/${file}.json`, route => fail
      ? route.fulfill({ status: 503, body: 'unavailable' })
      : route.continue())
    await openView(page, view)
    await expect(page.getByRole('alert')).toBeVisible()
    fail = false
    await page.getByRole('button', { name: '重试', exact: true }).click()
    await expect(page.getByRole('alert')).toHaveCount(0)
    await expect(page.locator('.grid-sidebar')).toBeVisible()
  })
}

test('mobile navigation supports shareable URLs, history and preserved input', async ({ page }) => {
  await page.setViewportSize({ width: 550, height: 900 })
  await page.goto('./#forbiddenWeaponGacha')
  const input = page.locator('.weapon-pull-input')
  await input.fill('123')
  await input.blur()
  await page.locator('.mobile-view-select').selectOption('gacha')
  await expect(page).toHaveURL(/#gacha$/)
  await expect(page.locator('.gacha-controls')).toBeVisible()
  await page.goBack()
  await expect(input).toHaveValue('123')
  await page.goForward()
  await expect(page.locator('.gacha-controls')).toBeVisible()
  await page.reload()
  await expect(page.locator('.mobile-view-select')).toHaveValue('gacha')
})

test('legacy scores propagate across pages, persist, and reset', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('migration-seeded')) {
      localStorage.setItem('mmt-pack-scores-v2', JSON.stringify({ '[16,4]': { score: 777, batch: 999 } }))
      localStorage.setItem('migration-seeded', 'true')
    }
  })
  await page.goto('./#gacha')
  const unitCost = page.locator('.gacha-rule-cell').filter({ hasText: '单抽' })
  await expect(unitCost).toContainText('777')
  await page.evaluate(() => { location.hash = 'packCompare' })
  const input = page.locator('input[data-score-key="[16,4]"]')
  await expect(input).toHaveValue('777')
  await input.fill('888')
  await input.blur()
  await page.evaluate(() => { location.hash = 'gacha' })
  await expect(unitCost).toContainText('888')
  await page.reload()
  await expect(unitCost).toContainText('888')
  await page.evaluate(() => { location.hash = 'packCompare' })
  await page.getByRole('button', { name: '恢复默认', exact: true }).click()
  await expect(input).toHaveValue('500')
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('mmt-pack-scores-v3')).overrides)).toEqual({})
  expect(await page.evaluate(() => localStorage.getItem('mmt-pack-scores-v2'))).toBeNull()
  await page.evaluate(() => { location.hash = 'gacha' })
  await expect(unitCost).toContainText('500')
})

test('weapon analysis charts react to banner, mode and theme changes', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('./#forbiddenWeaponGacha')
  await expect(page.locator('.weapon-chart-card canvas')).toHaveCount(3)
  await page.getByRole('button', { name: '圣天使神谕', exact: true }).click()
  await expect(page.locator('.weapon-chart-card canvas')).toHaveCount(5)
  const efficiency = page.getByRole('button', { name: '性价比', exact: true }).first()
  await efficiency.click()
  await expect(efficiency).toHaveAttribute('aria-pressed', 'true')
  await page.locator('.global-actions button').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expect(page.locator('.weapon-chart-card').first()).toContainText('范围内最佳 = 100')
  expect(errors).toEqual([])
})

test('inactive calculator pages release their chart canvases', async ({ page }) => {
  await page.goto('./#gacha')
  await expect(page.locator('canvas').first()).toBeVisible()
  await page.evaluate(() => {
    window.inactiveCharts = Array.from(document.querySelectorAll('[_echarts_instance_]'))
    location.hash = 'home'
  })
  expect(await page.evaluate(() => window.inactiveCharts.length)).toBeGreaterThan(0)
  await expect(page.locator('.nav-home-item')).toHaveClass(/active/)
  await expect.poll(() => page.evaluate(() => window.inactiveCharts.filter(element => element.querySelector('canvas')).length)).toBe(0)
  await page.evaluate(() => { location.hash = 'gacha' })
  await expect(page.locator('canvas').first()).toBeVisible()
})

test('failed language selection retries the requested language', async ({ page }) => {
  let fail = true
  await page.route('**/data/master_dict_en.json', route => fail
    ? route.fulfill({ status: 503, body: 'unavailable' })
    : route.fulfill({ json: {} }))
  await page.goto('./#home')
  await page.locator('.global-actions select').selectOption('en')
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
  fail = false
  await page.getByRole('button', { name: '重试', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('chart PNG export survives leaving and returning to a cached page', async ({ page }) => {
  await page.goto('./#sweep')
  await expect(page.locator('canvas')).toBeVisible()
  await page.evaluate(() => { location.hash = 'home' })
  await expect(page.locator('.nav-home-item')).toHaveClass(/active/)
  await page.evaluate(() => { location.hash = 'sweep' })
  await expect(page.locator('canvas')).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: '⬇ PNG' }).click()
  const result = await download
  expect(result.suggestedFilename()).toMatch(/^mmt-sweep-.*\.png$/)
  expect(await result.failure()).toBeNull()
  const bytes = fs.readFileSync(await result.path())
  expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
})

test('all registered pages mount without browser errors', async ({ page }) => {
  const { VIEW_DEFINITIONS } = await import('../src/constants/navigation.js')
  await page.goto('./#home')
  for (const view of Object.keys(VIEW_DEFINITIONS)) {
    await page.evaluate(view => { location.hash = view }, view)
    await expect(page.locator('.mobile-view-select')).toHaveValue(view)
    await expect(page.locator('.view h1')).toBeVisible()
    await expect(page.locator('.view-loading')).toHaveCount(0)
    await expect(page.locator('.view [role="status"]')).toHaveCount(0)
    await expect(page.locator('.view [role="alert"]')).toHaveCount(0)
  }
})

test('production loads UI languages only when selected', async ({ page }) => {
  test.skip(!process.env.E2E_PRODUCTION, 'Requires the production manifest')
  const manifest = JSON.parse(fs.readFileSync('dist/.vite/manifest.json', 'utf8'))
  const fileFor = locale => manifest[`src/locales/generated/${locale}.json`].file
  const scripts = []
  page.on('request', request => { if (request.resourceType() === 'script') scripts.push(request.url()) })
  await page.goto('./#home')
  await expect(page.locator('.view h1')).toBeVisible()
  for (const locale of ['en', 'ja', 'ko', 'zh-TW']) expect(scripts.some(url => url.endsWith(fileFor(locale)))).toBe(false)
  const initialScripts = [...scripts]
  await page.locator('.global-actions select').selectOption('en')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await page.locator('.global-actions select').selectOption('zh-CN')
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
  await page.locator('.global-actions select').selectOption('en')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  expect(scripts.filter(url => url.endsWith(fileFor('en')))).toHaveLength(1)
  await test.info().attach('initial-script-requests', { body: JSON.stringify(initialScripts, null, 2), contentType: 'application/json' })
})

test('character detail links survive history and reload', async ({ page }) => {
  await page.goto('./#characters')
  await page.locator('.catalog-card').first().click()
  await expect(page).toHaveURL(/#characters\/\d+$/)
  await expect(page.locator('.catalog-detail')).toBeVisible()
  const name = await page.locator('.catalog-profile h2').textContent()
  await page.goBack()
  await expect(page.locator('.catalog-card').first()).toBeVisible()
  await page.goForward()
  await expect(page.locator('.catalog-profile h2')).toHaveText(name)
  await page.reload()
  await expect(page.locator('.catalog-profile h2')).toHaveText(name)
})

test('unavailable browser storage does not block loading or editing scores', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Denied', 'SecurityError') } })
  })
  await page.goto('./#packCompare')
  const input = page.locator('input[data-score-key="[16,4]"]')
  await expect(input).toHaveValue('500')
  await input.fill('600')
  await input.blur()
  await page.evaluate(() => { location.hash = 'gacha' })
  await expect(page.locator('.gacha-rule-cell').filter({ hasText: '单抽' })).toContainText('600')
})
