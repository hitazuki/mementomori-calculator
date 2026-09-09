import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '..')
const source = path.resolve(process.argv[2] || path.join(root, 'public/images/characters'))
const output = path.resolve(process.argv[3] || path.join(root, 'public/images/character-thumbnails'))
const files = (await fs.readdir(source)).filter(file => /^\d+\.png$/.test(file))
await fs.mkdir(output, { recursive: true })
await Promise.all(files.map(async file => {
  const target = path.join(output, file.replace(/\.png$/, '.webp'))
  await sharp(path.join(source, file)).resize(96, 96, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 82, alphaQuality: 90 }).toFile(target)
}))
console.log(`Generated ${files.length} shared character thumbnails in ${output}`)
