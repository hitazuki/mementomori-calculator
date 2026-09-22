import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const run = promisify(execFile)
const localesDirectory = fileURLToPath(new URL('../src/locales/', import.meta.url)).replaceAll('\\', '/')

export function watchUiLocales() {
  return {
    name: 'watch-ui-locales',
    apply: 'serve',
    async handleHotUpdate({ file, server }) {
      const normalized = file.replaceAll('\\', '/')
      if (!normalized.startsWith(localesDirectory) || !normalized.endsWith('.js')) return
      await run(process.execPath, [fileURLToPath(new URL('./build_ui_locales.mjs', import.meta.url))])
      server.ws.send({ type: 'full-reload' })
      return []
    },
  }
}
