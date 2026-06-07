import { readFile } from 'node:fs/promises'

export async function load(url, context, defaultLoad) {
  if (url.includes('?raw')) {
    const fileUrl = url.replace(/\?raw$/, '')
    const source = await readFile(new URL(fileUrl), 'utf8')
    return {
      format: 'module',
      shortCircuit: true,
      source: `export default ${JSON.stringify(source)};`,
    }
  }

  return defaultLoad(url, context, defaultLoad)
}
