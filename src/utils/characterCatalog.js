export function filterCharacters(characters, { element = 0, search = '', sort = 'id' } = {}) {
  const query = search.trim().toLocaleLowerCase()
  return characters.filter(character => (!element || character.element === element)
    && `${character.id} ${character.name} ${character.title}`.toLocaleLowerCase().includes(query))
    .sort((a, b) => sort === 'speed' ? (b.speed ?? 0) - (a.speed ?? 0) || a.id - b.id : a.id - b.id)
}
