import { execFileSync } from 'node:child_process'
import { chmodSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

try {
  chmodSync(resolve(projectRoot, '.githooks', 'commit-msg'), 0o755)
  execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { stdio: 'ignore' })
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'ignore' })
  console.log('Git hooks enabled from .githooks')
} catch {
  console.log('Git hooks were not installed because this directory is not a Git worktree')
}
