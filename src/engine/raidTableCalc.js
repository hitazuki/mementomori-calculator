import { compileRaidProgram, DEFAULT_RAID_ENVIRONMENT } from './raid/compiler.js'
import { runRaidProgram } from './raid/runtime.js'

export { compileRaidProgram, DEFAULT_RAID_ENVIRONMENT } from './raid/compiler.js'
export { DEFAULT_RAID_MECHANICS } from './raid/mechanics.js'

export function simulateRaidTable(config = {}, environment = DEFAULT_RAID_ENVIRONMENT) {
  return runRaidProgram(compileRaidProgram(config, environment))
}
