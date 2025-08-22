
export async function loadChapters() {
  const res = await fetch('./chapters.json')
  if (!res.ok) throw new Error('No se pudo cargar chapters.json')
  const data = await res.json()
  return data
}
export function renderGrid(container, chapters, onOpen) {
  container.innerHTML = ''
  chapters.forEach((ch, i) => {
    const card = document.createElement('div')
    card.className = 'card'
    const img = document.createElement('img')
    img.src = ch.image || './assets/img/placeholder.jpg'
    const h3 = document.createElement('h3')
    h3.textContent = ch.title
    const meta = document.createElement('div')
    meta.className = 'meta'
    const code = document.createElement('span')
    code.textContent = ch.code
    const song = document.createElement('span')
    song.textContent = ch.song
    meta.append(code, song)
    const btns = document.createElement('div')
    btns.className = 'controls'
    const openBtn = document.createElement('button')
    openBtn.textContent = 'Leer'
    openBtn.addEventListener('click', () => onOpen(i))
    btns.append(openBtn)
    card.append(img, h3, meta, btns)
    container.append(card)
  })
}

export async function openChapterByIndex(index) {
  const res = await fetch('./chapters.json')
  const chapters = await res.json()
  const ch = chapters[index]
  if (!ch) return

  const titleEl = document.querySelector('#chapter-title')
  const songEl = document.querySelector('#chapter-song')
  const bodyEl = document.querySelector('#chapter-text')
  const coverEl = document.querySelector('#chapter-cover')

  titleEl.textContent = ch.title
  songEl.textContent = ch.song
  coverEl.src = ch.image || './assets/img/placeholder.jpg'

  const textRes = await fetch(ch.textFile)
  const txt = await textRes.text()
  bodyEl.textContent = txt

  // Música: requerirá interacción del usuario para iniciar. Mostramos botón.
  const playBtn = document.querySelector('#play-audio')
  const audio = document.querySelector('#bg-audio')
  audio.src = './assets/audio/placeholder.mp3'
  playBtn.onclick = async () => {
    try { await audio.play() } catch (e) { console.warn('Autoplay bloqueado') }
  }
}
