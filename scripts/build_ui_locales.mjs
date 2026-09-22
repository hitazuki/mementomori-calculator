import fs from 'node:fs/promises'

// Keep authoring modules intact, but ship only the selected language at runtime.
const output = new URL('../src/locales/generated/', import.meta.url)
await fs.mkdir(output, { recursive: true })
for (const locale of ['zh-CN', 'zh-TW', 'en', 'ja', 'ko']) {
  const messages = (await import(`../src/locales/${locale}.js`)).default
  const target = new URL(`${locale}.json`, output)
  const content = JSON.stringify(messages) + '\n'
  const previous = await fs.readFile(target, 'utf8').catch(() => null)
  if (previous !== content) await fs.writeFile(target, content)
}
console.log('Generated 5 independent UI language bundles.')
