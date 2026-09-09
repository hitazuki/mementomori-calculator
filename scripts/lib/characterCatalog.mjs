import fs from 'node:fs'
import path from 'node:path'

export function readCharacterCatalog(root, locale = 'zh-CN') {
  const isUrl = root instanceof URL
  const resolve = (...parts) => isUrl ? new URL(`${locale}/${parts.join('/')}`, root) : path.join(root, locale, ...parts)
  const index = JSON.parse(fs.readFileSync(resolve('index.json'), 'utf8'))
  if (index.schemaVersion !== 2 || !Number.isInteger(index.shardSize) || !Array.isArray(index.characters)) {
    throw new Error(`Invalid character catalog index: ${locale}`)
  }
  const shardIds = [...new Set(index.characters.map(character => Math.floor((character.id - 1) / index.shardSize)))]
  const characters = shardIds.flatMap(shard => {
    const data = JSON.parse(fs.readFileSync(resolve('details', `${shard}.json`), 'utf8'))
    if (data.schemaVersion !== 2 || !Array.isArray(data.characters)) throw new Error(`Invalid character catalog shard: ${locale}/${shard}`)
    return data.characters
  })
  return { ...index, characters }
}
