const cleanBase = () => import.meta.env.BASE_URL.replace(/\/$/, '')

export const characterImagePath = id => `images/characters/${id}.png`
export const characterThumbnailPath = id => `images/character-thumbnails/${id}.webp`
export const assetUrl = path => `${cleanBase()}/${path.replace(/^\//, '')}`
