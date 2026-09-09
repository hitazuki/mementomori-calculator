import fs from 'node:fs'
import path from 'node:path'

// Raw game data is external input, never an implicit repository dependency.
export function requireMasterDirectory(argument, usage) {
  if (!argument || argument.startsWith('-')) throw new Error(`Usage: ${usage}`)
  const directory = path.resolve(argument)
  if (!fs.statSync(directory, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error(`Master directory does not exist: ${directory}`)
  }
  return directory
}
