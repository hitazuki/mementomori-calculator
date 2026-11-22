import { expect, test } from '@playwright/test'

test('raid presets reproduce the reference lineups and replace edited settings', async ({ page }) => {
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort())
  await page.addInitScript(() => localStorage.setItem('mmt-calc-current-view', 'raidTable'))
  await page.goto('./', { waitUntil: 'domcontentloaded' })

  const presets = page.getByRole('group', { name: '预设阵容' })
  const florencePreset = presets.getByRole('button', { name: '佛罗伦斯', exact: true })
  const darkPreset = presets.getByRole('button', { name: '幽冥', exact: true })
  const yellowPreset = presets.getByRole('button', { name: '流金', exact: true })
  const greenPreset = presets.getByRole('button', { name: '苍翠', exact: true })
  const redPreset = presets.getByRole('button', { name: '业红', exact: true })
  const boss = page.locator('select').filter({ has: page.locator('option[value="sonya"]') })
  const attack = page.locator('.raid-summary-primary .stat-value').first()
  const direct = page.locator('.raid-summary-symbolic .stat-value')
  const order = page.locator('.raid-order-list .raid-character-name')
  const curseRound = page.locator('label').filter({ hasText: '神咒解放生效回合' }).locator('input')
  const lukeSpeed = page.locator('.raid-speed-list label').filter({ hasText: '光士' }).locator('input')
  const adjusted = page.locator('.raid-turn-order-button.manual')

  await expect(attack).toHaveText('248,424.66% ATK')
  await expect(direct).toHaveText('6,964.65% STR')
  await expect(adjusted).toHaveCount(1)
  await expect(adjusted).toHaveAccessibleName('调整第6回合行动顺序')
  await expect(page.getByRole('button', { name: /恢复默认/ })).toHaveCount(0)

  await darkPreset.click()
  await expect(order).toHaveText([
    /伊利亚/, '梅琳', '光士', /埃尔芙琳黛/, '茉缇',
    /伊利亚/, /埃尔芙琳黛/, '光士', '梅琳', '茉缇',
  ])
  await expect(attack).toHaveText('444,490.07% ATK')
  await expect(direct).toHaveText('58,578.75% STR')
  await expect(curseRound).toHaveValue('2')
  await curseRound.fill('5')
  await lukeSpeed.fill('1')
  await boss.selectOption('five-targets')

  await yellowPreset.click()
  await expect(boss).toHaveValue('sonya')
  await expect(lukeSpeed).toHaveValue('4093')
  await expect(order).toHaveText([
    '鹭丝堤卡', '梅琳', '光士', '波普莉', '小白',
    '波普莉', '鹭丝堤卡', '梅琳', '光士', '小白',
  ])
  await expect(attack).toHaveText('388,728.68% ATK')
  await expect(direct).toHaveText('6,460.65% STR')

  await greenPreset.click()
  await expect(order).toHaveText([
    '宝拉', '芬里尔', /佛罗伦斯/, '光士', '耶尔德兹',
    /佛罗伦斯/, '宝拉', '光士', '芬里尔', '耶尔德兹',
  ])
  await expect(attack).toHaveText('488,463.23% ATK')
  await expect(direct).toHaveText('6,460.65% STR')
  await expect(adjusted).toHaveCount(1)
  await expect(adjusted).toHaveAccessibleName('调整第5回合行动顺序')

  await redPreset.click()
  await expect(order).toHaveText([
    '艾谢', '阿尔托莉亚', /亚历珊卓/, '桂妮维亚', '莉贝',
    '艾谢', '阿尔托莉亚', /亚历珊卓/, '桂妮维亚', '莉贝',
  ])
  await expect(attack).toHaveText('709,245.86% ATK')
  await expect(adjusted).toHaveCount(0)

  await darkPreset.click()
  await expect(adjusted).toHaveCount(0)
  await expect(curseRound).toHaveValue('2')
  await expect(attack).toHaveText('444,490.07% ATK')
  await florencePreset.click()
  await expect(lukeSpeed).toHaveValue('3793')
  await expect(adjusted).toHaveAccessibleName('调整第6回合行动顺序')
  await expect(attack).toHaveText('248,424.66% ATK')
})
