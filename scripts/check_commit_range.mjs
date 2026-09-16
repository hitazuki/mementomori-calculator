import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { validateCommitMessage } from './validate_commit_message.js'

const event = process.env.GITHUB_EVENT_PATH
  ? JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')) : {}
const head = event.pull_request?.head?.sha || process.env.GITHUB_SHA || 'HEAD'
const base = event.pull_request?.base?.sha || event.before
const range = base && !/^0+$/.test(base) ? `${base}..${head}` : head
const args = ['rev-list', '--no-merges', ...(base && !/^0+$/.test(base) ? [] : ['-1']), range]
const commits = execFileSync('git', args, { encoding: 'utf8' }).trim().split('\n').filter(Boolean)
for (const sha of commits) {
  const message = execFileSync('git', ['show', '-s', '--format=%B', sha], { encoding: 'utf8' })
  const result = validateCommitMessage(message)
  if (!result.valid) {
    console.error(`${sha}: ${result.header}\n${result.reason}`)
    process.exitCode = 1
  }
}
