import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

export const COMMIT_TYPES = [
  'feat',
  'fix',
  'refactor',
  'perf',
  'test',
  'docs',
  'chore',
  'build',
  'ci',
  'style',
  'revert',
]

const TYPE_PATTERN = COMMIT_TYPES.join('|')
const HEADER_PATTERN = new RegExp(
  `^(${TYPE_PATTERN})(\\([a-z0-9][a-z0-9._/-]*\\))?!?: \\S.*$`,
)

export function commitHeader(message) {
  return message
    .split(/\r?\n/)
    .map(line => line.trim())
    .find(line => line && !line.startsWith('#')) ?? ''
}

export function validateCommitMessage(message) {
  const header = commitHeader(message)
  if (!header) return { valid: false, header, reason: 'commit message is empty' }
  if (!HEADER_PATTERN.test(header)) {
    return {
      valid: false,
      header,
      reason: `expected type(scope): summary; allowed types: ${COMMIT_TYPES.join(', ')}`,
    }
  }
  return { valid: true, header, reason: '' }
}

function readMessageArgument(args) {
  if (args[0] === '--message') return args.slice(1).join(' ')
  if (args[0] && existsSync(args[0])) return readFileSync(args[0], 'utf8')
  return ''
}

function main() {
  const result = validateCommitMessage(readMessageArgument(process.argv.slice(2)))
  if (result.valid) return

  console.error(`Invalid commit message: ${result.header || '(empty)'}`)
  console.error(result.reason)
  console.error('Examples: feat(raid): add manual action order')
  console.error('          fix: clear redundant round override')
  process.exitCode = 1
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main()
