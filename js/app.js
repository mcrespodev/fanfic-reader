
import { loadChapters, renderGrid, openChapterByIndex } from './reader.js'

const searchInput = document.querySelector('#q')
const listContainer = document.querySelector('#list')
const readerSection = document.querySelector('#reader')
const prevBtn = document.querySelector('#prev')
const nextBtn = document.querySelector('#next')
const backBtn = document.querySelector('#back')
let state = { chapters: [], filtered: [], currentIndex: -1 }

async function init() {
  state.chapters = await loadChapters()
  state.filtered = state.chapters.slice()
  renderGrid(listContainer, state.filtered, (index) => {
    const globalIndex = state.chapters.findIndex(c => c.code === state.filtered[index].code)
    state.currentIndex = globalIndex
    openChapter(globalIndex)
  })
  wireSearch()
  wireNav()
}
function wireSearch() {
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase().trim()
    state.filtered = state.chapters.filter(ch =>
      ch.title.toLowerCase().includes(q) ||
      ch.song.toLowerCase().includes(q) ||
      ch.code.toLowerCase().includes(q)
    )
    renderGrid(listContainer, state.filtered, (index) => {
      const globalIndex = state.chapters.findIndex(c => c.code === state.filtered[index].code)
      state.currentIndex = globalIndex
      openChapter(globalIndex)
    })
  })
}
function wireNav() {
  backBtn.addEventListener('click', () => {
    readerSection.classList.add('hidden')
    document.querySelector('#home').classList.remove('hidden')
  })
  prevBtn.addEventListener('click', () => nav(-1))
  nextBtn.addEventListener('click', () => nav(1))
}
async function openChapter(index) {
  await openChapterByIndex(index)
  document.querySelector('#home').classList.add('hidden')
  readerSection.classList.remove('hidden')
  updateNav()
}
function nav(delta) {
  const size = state.chapters.length
  if (size === 0) return
  state.currentIndex = Math.max(0, Math.min(size - 1, state.currentIndex + delta))
  openChapter(state.currentIndex)
}
function updateNav() {
  const { currentIndex } = state
  prevBtn.disabled = currentIndex <= 0
  nextBtn.disabled = currentIndex >= state.chapters.length - 1
}
init()
