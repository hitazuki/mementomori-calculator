import { test, expect } from '@playwright/test'

for (const width of [1440, 390]) {
  test(`shop exchange plan computes and invalidates at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort())
    await page.addInitScript(() => localStorage.setItem('mmt-calc-current-view', 'shopExchange'))
    await page.goto('./', { waitUntil: 'domcontentloaded' })
    const panel = page.locator('.shop-plan')
    const budget = panel.locator('input')
    const calculate = panel.locator('button[type="submit"]')
    await expect(panel).toBeVisible()
    await calculate.click()
    await expect(budget).toHaveAttribute('aria-invalid', 'true')
    await budget.fill('100000')
    await calculate.click()
    await expect(panel.locator('tbody tr').first()).toBeVisible()
    await page.screenshot({ path: test.info().outputPath(`shop-${width}.png`), fullPage: true })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await budget.fill('10')
    await expect(panel.locator('tbody tr')).toHaveCount(0)
    await calculate.click()
    await expect(panel.locator('tbody tr').first()).toBeVisible()
    // Scores affect the optimum; changing a score must remove the old plan.
    const score = page.locator('.item-score-panel input[type="number"]').first()
    await score.fill('123')
    await score.blur()
    await expect(panel.locator('tbody tr')).toHaveCount(0)
    await page.locator('.shop-switch-buttons button').nth(1).click()
    await expect(panel).toHaveCount(0)
    expect(errors).toEqual([])
  })
}
