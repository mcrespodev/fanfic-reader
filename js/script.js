/* Fanfic Reader – script.js (versión simple)
   Minimal para entender y extender. Sin fades, sin Media Session, sin localStorage.
   Requisitos del HTML: IDs existentes en index.html (navbar + reader).
*/

document.addEventListener('DOMContentLoaded', () => {
  // ====== Atajos ======
  const $ = (s, r = document) => r.querySelector(s);

  // ====== Elementos ======
  const els = {
    // Navbar / Player
    btnAudio: $('#btnAudio'),
    audioSeek: $('#audioSeek'),
    audioVolume: $('#audioVolume'),
    btnMute: $('#btnMute'),
    audioCurrent: $('#audioCurrent'),
    audioDuration: $('#audioDuration'),
    audioNowPlaying: $('#audioNowPlaying'),

    // Sidebar
    chaptersList: $('#chaptersList'),
    quickFilter: $('#quickFilter'),
    btnClearFilter: $('#btnClearFilter'),

    // Reader
    chapterCover: $('#chapterCover'),
    chapterTitle: $('#chapterTitle'),
    chapterCode: $('#chapterCode'),
    chapterContent: $('#chapterContent'),
    btnPrev: $('#btnPrev'),
    btnNext: $('#btnNext'),

    // Template para items
    tplItem: $('#tplChapterItem')
  };

  // ====== Estado simple ======
  const state = {
    chapters: [],      // array con objetos del JSON normalizados con paths
    filtered: [],      // lista filtrada que se muestra
    currentIndex: -1,  // índice del capítulo abierto en state.chapters
    audio: new Audio() // reproductor básico HTMLAudioElement
  };

  // ====== Util ======
  const formatTime = (s) => {
    if (!isFinite(s)) return '0:00';
    s = Math.max(0, Math.floor(s));
    const m = Math.floor(s / 60);
    const ss = String(s % 60).padStart(2, '0');
    return `${m}:${ss}`;
  };

  // ====== Inicializar ======
  initPlayer();
  loadChapters();
  attachUIEvents();

  // ---------------------------
  // Cargar capítulos (JSON)
  // ---------------------------
  async function loadChapters(){
    try{
      const res = await fetch('chapters.json');
      if(!res.ok) throw new Error('No se pudo cargar chapters.json');
      const data = await res.json();
      // Normalizar rutas según tu estructura
      state.chapters = data.map(c => ({
        ...c,
        imagePath: `${c.image}`,
        audioPath: c.song ? `${c.song}` : null,
        textPath: `${c.text}`
      }));
      state.filtered = state.chapters.slice();
      renderChapterList(state.filtered);
    }catch(err){
      console.error(err);
      els.chapterContent.innerHTML = '<div class="text-danger">Error cargando chapters.json</div>';
    }
  }

  // ---------------------------
  // Render lista de capítulos
  // ---------------------------
  function renderChapterList(list){
    els.chaptersList.innerHTML = '';
    list.forEach((c) => {
      const node = els.tplItem.content.firstElementChild.cloneNode(true);
      node.dataset.code = c.code;
      node.querySelector('.chapter-thumb').src = c.imagePath;
      node.querySelector('.chapter-thumb').alt = `Portada ${c.title}`;
      node.querySelector('.chapter-title').textContent = c.title;
      node.addEventListener('click', () => openChapterByCode(c.code));
      els.chaptersList.appendChild(node);
    });
  }

  function findIndexByCode(code){
    return state.chapters.findIndex(c => c.code === code);
  }

  // ---------------------------
  // Abrir capítulo
  // ---------------------------
  async function openChapterByCode(code){
    const index = findIndexByCode(code);
    if(index === -1) return;
    state.currentIndex = index;
    const chap = state.chapters[index];

    // Encabezado
    els.chapterTitle.textContent = chap.title;
    els.chapterCode.textContent = chap.code;
    els.chapterCover.src = chap.imagePath;

    // Texto (simple: dividir por dobles saltos en párrafos)
    els.chapterContent.innerHTML = '<div class="text-muted">Cargando…</div>';
    try{
      const res = await fetch(chap.textPath);
      if(!res.ok) throw new Error('No se pudo cargar el texto');
      const raw = await res.text();
      const parts = raw.split(/\n\n+/);
      const frag = document.createDocumentFragment();
      parts.forEach(p => {
        const para = document.createElement('p');
        para.textContent = p.replace(/\n/g, ' ');
        frag.appendChild(para);
      });
      els.chapterContent.innerHTML = '';
      els.chapterContent.appendChild(frag);
    }catch(err){
      console.error(err);
      els.chapterContent.innerHTML = '<div class="text-danger">No se pudo cargar el texto del capítulo.</div>';
    }

    // Audio
    if(chap.audioPath){
      setAudioSource(chap.audioPath, chap.title);
    }else{
      clearAudio();
    }

    // Prev/Next
    els.btnPrev.disabled = index <= 0;
    els.btnNext.disabled = index >= state.chapters.length - 1;
  }

  // ---------------------------
  // Reproductor (muy básico)
  // ---------------------------
  function initPlayer(){
    const a = state.audio;
    a.preload = 'metadata';

    // metadata -> mostrar duración
    a.addEventListener('loadedmetadata', () => {
      els.audioDuration.textContent = formatTime(a.duration);
      els.audioSeek.max = a.duration || 0;
      els.audioSeek.value = 0;
    });

    // progreso -> actualizar current y slider
    a.addEventListener('timeupdate', () => {
      els.audioCurrent.textContent = formatTime(a.currentTime);
      if(!els.audioSeek.matches(':active')){
        els.audioSeek.value = a.currentTime;
      }
    });

    // fin -> volver botón a ▶
    a.addEventListener('ended', () => updatePlayButton(false));

    // Controles UI
    els.btnAudio.addEventListener('click', () => {
      if(!a.src) return;
      a.paused ? play() : pause();
    });

    els.audioSeek.addEventListener('input', () => {
      const t = Number(els.audioSeek.value) || 0;
      a.currentTime = Math.max(0, Math.min(t, a.duration || 0));
    });

    els.audioVolume.addEventListener('input', () => {
      a.volume = Math.max(0, Math.min(Number(els.audioVolume.value) || 0, 1));
    });

    els.btnMute.addEventListener('click', () => {
      a.muted = !a.muted;
      els.btnMute.textContent = a.muted ? '🔈' : '🔇';
    });

    // Estado inicial deshabilitado
    disablePlayer(true);
  }

  function setAudioSource(src, title){
    const a = state.audio;
    a.src = src;
    a.currentTime = 0;
    els.audioNowPlaying.textContent = title ? `Reproduciendo: ${title}` : 'Reproduciendo';
    disablePlayer(false);
    updatePlayButton(false);
  }

  function clearAudio(){
    const a = state.audio;
    a.pause(); a.removeAttribute('src');
    els.audioNowPlaying.textContent = 'Sin canción';
    els.audioCurrent.textContent = '0:00';
    els.audioDuration.textContent = '0:00';
    els.audioSeek.value = 0;
    disablePlayer(true);
    updatePlayButton(false);
  }

  function play(){ state.audio.play().then(() => updatePlayButton(true)).catch(console.warn); }
  function pause(){ state.audio.pause(); updatePlayButton(false); }

  function updatePlayButton(isPlaying){ els.btnAudio.textContent = isPlaying ? '⏸' : '▶'; }

  function disablePlayer(disabled){
    els.btnAudio.disabled = disabled;
    els.audioSeek.disabled = disabled;
    els.audioVolume.disabled = disabled;
    els.btnMute.disabled = disabled;
  }

  // ---------------------------
  // UI: filtro, prev/next
  // ---------------------------
  function attachUIEvents(){
    // Filtro rápido por título o código
    els.quickFilter.addEventListener('input', () => {
      const q = (els.quickFilter.value || '').toLowerCase();
      state.filtered = !q ? state.chapters.slice() : state.chapters.filter(c =>
        c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
      );
      renderChapterList(state.filtered);
    });
    els.btnClearFilter.addEventListener('click', () => {
      els.quickFilter.value = '';
      state.filtered = state.chapters.slice();
      renderChapterList(state.filtered);
    });

    // Prev / Next
    els.btnPrev.addEventListener('click', () => {
      if(state.currentIndex > 0) openChapterByCode(state.chapters[state.currentIndex - 1].code);
    });
    els.btnNext.addEventListener('click', () => {
      if(state.currentIndex < state.chapters.length - 1) openChapterByCode(state.chapters[state.currentIndex + 1].code);
    });
  }
});
