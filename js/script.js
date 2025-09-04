/* Fanfic Reader – script.js (versión simple)
   Minimal para entender y extender. Sin fades, sin Media Session, sin localStorage.
   Requisitos del HTML: IDs existentes en index.html (navbar + reader).
*/

document.addEventListener("DOMContentLoaded", () => {
  // ====== Atajos ======
  const $ = (s, r = document) => r.querySelector(s);

  // ====== Elementos ======
  const els = {
    // Navbar / Player
    btnAudio: $("#btnAudio"),
    audioVolume: $("#audioVolume"),
    btnMute: $("#btnMute"),
    audioCurrent: $("#audioCurrent"),
    audioDuration: $("#audioDuration"),
    audioNowPlaying: $("#audioNowPlaying"),
    artistNowPlaying: $("#artistNowPlaying"),

    // Sidebar
    chaptersList: $("#chaptersList"),
    // quickFilter: $("#quickFilter"),
    btnClearFilter: $("#btnClearFilter"),

    // Reader
    chapterCover: $("#chapterCover"),
    chapterTitle: $("#chapterTitle"),
    chapterCode: $("#chapterCode"),
    chapterContent: $("#chapterContent"),
    // btnPrev: $("#btnPrev"),
    // btnNext: $("#btnNext"),
    pdfFrame: $("#pdfFrame"),

    // Template para items
    tplItem: $("#tplChapterItem"),
  };

  // ====== Estado simple ======
  const state = {
    chapters: [], // array con objetos del JSON normalizados con paths
    filtered: [], // lista filtrada que se muestra
    currentIndex: -1, // índice del capítulo abierto en state.chapters
    audio: new Audio(), // reproductor básico HTMLAudioElement
  };

  // ====== Util ======
  const formatTime = (s) => {
    if (!isFinite(s)) return "0:00";
    s = Math.max(0, Math.floor(s));
    const m = Math.floor(s / 60);
    const ss = String(s % 60).padStart(2, "0");
    return `${m}:${ss}`;
  };

  // ====== Inicializar ======
  initPlayer();
  // loadChapters();
  loadChapters().then(() => {
    if (state.chapters?.length) {
      openChapterByCode(state.chapters[0].code);
    }
  });
  attachUIEvents();

  // ---------------------------
  // Cargar capítulos (JSON)
  // ---------------------------
  async function loadChapters() {
    try {
      const res = await fetch("chapters.json");
      if (!res.ok) throw new Error("No se pudo cargar chapters.json");
      const data = await res.json();
      // Normalizar rutas según tu estructura
      state.chapters = data.map((c) => ({
        ...c,
        iconPath: c.icon ? `assets/icons/${c.icon}` : null,
        imagePath: c.image ? `assets/img/${c.image}` : null,
        audioPath: c.song ? `assets/audio/${c.song}` : null,
        pdfPath: c.pdf ? `pdfs/${c.pdf}` : null,
      }));
      state.filtered = state.chapters.slice();
      renderChapterList(state.filtered);
    } catch (err) {
      console.error(err);
      els.chapterContent.innerHTML =
        '<div class="text-danger">Error cargando chapters.json</div>';
    }
  }

  // ---------------------------
  // Render lista de capítulos
  // ---------------------------
  function renderChapterList(list) {
    els.chaptersList.innerHTML = "";
    list.forEach((c) => {
      const node = els.tplItem.content.firstElementChild.cloneNode(true);
      node.dataset.code = c.code;
      node.querySelector(".chapter-thumb").src = c.iconPath;
      node.querySelector(".chapter-thumb").alt = `Portada ${c.title}`;
      node.querySelector(".chapter-title").textContent = c.chapter || c.title;
      node.addEventListener("click", () => openChapterByCode(c.code));
      els.chaptersList.appendChild(node);
    });
  }

  function findIndexByCode(code) {
    return state.chapters.findIndex((c) => c.code === code);
  }

  // ---------------------------
  // Abrir capítulo
  // ---------------------------
  async function openChapterByCode(code) {
    const index = findIndexByCode(code);
    if (index === -1) return;
    state.currentIndex = index;
    const chap = state.chapters[index];

    // Encabezado
    els.chapterTitle.textContent = chap.title || chap.code;
    els.chapterCode.textContent = chap.code || "";
    els.chapterCover.src = chap.iconPath;

    if (chap.iconPath) {
      els.chapterCover.src = chap.iconPath;
      els.chapterCover.classList.remove("d-none");
    } else {
      els.chapterCover.removeAttribute("src"); // evita "undefined"
      els.chapterCover.classList.add("d-none"); // ocúltalo si no hay imagen
    }

    try {
      // PDF (con PDF.js)
      const pdfFrame = document.getElementById("pdfFrame");
      if (chap.pdfPath) {
        const base = document.baseURI; // funciona igual en localhost y en GH Pages
        const viewerAbs = new URL("pdfjs/web/viewer.html", base).toString();
        const pdfAbs = new URL(chap.pdfPath, base).toString();

        els.pdfFrame.src = `${viewerAbs}?file=${encodeURIComponent(pdfAbs)}`;

        // console.log(els.pdfFrame.src);
        // const viewer = `pdfjs/web/viewer.html#file=${encodeURIComponent(
        //   chap.pdfPath
        // )}`;
        // pdfFrame.src = viewer;
      } else {
        pdfFrame.removeAttribute("src"); // evita "undefined"
      }
    } catch (err) {
      console.error(err);
      els.chapterContent.innerHTML =
        '<div class="text-danger">No se pudo cargar el texto del capítulo.</div>';
    }

    // Audio
    if (chap.audioPath) {
      setAudioSource(chap.audioPath, chap.titleSong);
      setTimeout(() => {
        play();
      }, 1000);
      // play();
    } else {
      clearAudio();
    }

    // Prev/Next
    // els.btnPrev.disabled = index <= 0;
    // els.btnNext.disabled = index >= state.chapters.length - 1;
    updateChapterBoxUI();
  }

  // ---------------------------
  // Reproductor (muy básico)
  // ---------------------------
  function initPlayer() {
    const a = state.audio;
    a.volume = 0.1;
    a.preload = "metadata";

    // metadata -> mostrar duración
    a.addEventListener("loadedmetadata", () => {
      els.audioDuration.textContent = formatTime(a.duration);
    });

    // progreso -> actualizar current y slider
    a.addEventListener("timeupdate", () => {
      els.audioCurrent.textContent = formatTime(a.currentTime);
    });

    // fin -> volver botón a ▶
    a.addEventListener("ended", () => updatePlayButton(false));

    // Controles UI
    els.btnAudio.addEventListener("click", () => {
      if (!a.src) return;
      a.paused ? play() : pause();
    });

    els.audioVolume.addEventListener("input", () => {
      a.volume = Math.max(0, Math.min(Number(els.audioVolume.value) || 0, 1));
    });

    els.btnMute.addEventListener("click", () => {
      a.muted = !a.muted;
      els.btnMute.innerHTML = a.muted
        ? '<i class="bi bi-volume-mute-fill fs-6"></i>'
        : '<i class="bi bi-volume-up-fill fs-6"></i>';
    });

    // Estado inicial deshabilitado
    disablePlayer(true);
    wireChapterBoxNav();
  }

  function setAudioSource(src, title) {
    const a = state.audio;
    a.src = src;
    a.currentTime = 0;
    state.audio.volume = 0.1;

    let partes = title.split(" - ");

    // Guardamos en variables
    let cancion = partes[0];
    let artista = partes[1];

    els.audioNowPlaying.textContent = cancion ? `${cancion}` : "Sin canción";
    els.artistNowPlaying.textContent = artista ? `${artista}` : "Sin artista";

    // if (title.length > 18 && window.innerWidth < 768){
    //   activarScroll();
    // }
    // else {
    //   desactivarScroll();
    // }

    disablePlayer(false);
    updatePlayButton(false);
  }

  function clearAudio() {
    const a = state.audio;
    a.pause();
    a.removeAttribute("src");
    els.audioNowPlaying.textContent = "Sin canción";
    els.audioCurrent.textContent = "0:00";
    els.audioDuration.textContent = "0:00";
    disablePlayer(true);
    updatePlayButton(false);
  }

  function play() {
    state.audio
      .play()
      .then(() => updatePlayButton(true))
      .catch(console.warn);
  }
  function pause() {
    state.audio.pause();
    updatePlayButton(false);
  }

  function updatePlayButton(isPlaying) {
    els.btnAudio.innerHTML = isPlaying
      ? '<i class="bi bi-pause-fill"></i>'
      : '<i class="bi bi-play-fill"></i>';
  }

  function disablePlayer(disabled) {
    els.btnAudio.disabled = disabled;
    els.audioVolume.disabled = disabled;
    els.btnMute.disabled = disabled;
  }

  function goPrevChapter() {
    if (state.currentIndex > 0) {
      const prev = state.chapters[state.currentIndex - 1];
      openChapterByCode(prev.code);
    }
  }

  function goNextChapter() {
    if (state.currentIndex < state.chapters.length - 1) {
      const next = state.chapters[state.currentIndex + 1];
      openChapterByCode(next.code);
    }
  }

  function wireChapterBoxNav() {
    const prev = document.getElementById("btnPrevChapterBox");
    const next = document.getElementById("btnNextChapterBox");
    prev && prev.addEventListener("click", goPrevChapter);
    next && next.addEventListener("click", goNextChapter);
  }

  function updateChapterBoxUI() {
    const titleEl = document.getElementById("chapterHeaderTitle");
    const chapterEl = document.getElementById("chapterHeaderChapter");
    const partEl = document.getElementById("chapterHeaderPart");

    if (titleEl) {
      titleEl.textContent =
        state.chapters[state.currentIndex]?.title || "Título";
      chapterEl.textContent =
        state.chapters[state.currentIndex]?.chapter || "Capítulo";
      partEl.textContent = state.chapters[state.currentIndex]?.part || "";
    }

    if (titleEl.textContent.length >= 15) {
      titleEl.style.fontSize = "14px";
    } else {
      titleEl.style.fontSize = "16px";
    }

    if (window.innerWidth > 768) {
      titleEl.style.fontSize = "20px";
    }

    const atStart = state.currentIndex <= 0;
    const atEnd = state.currentIndex >= state.chapters.length - 1;
    const prev = document.getElementById("btnPrevChapterBox");
    const next = document.getElementById("btnNextChapterBox");
    if (prev) prev.disabled = atStart;
    if (next) next.disabled = atEnd;
  }

  function activarScroll() {
    const texto = document.getElementById("audioNowPlaying");
    texto.classList.add("scroll-text");
  }

  function desactivarScroll() {
    const texto = document.getElementById("audioNowPlaying");
    texto.classList.remove("scroll-text");
  }

  // ---------------------------
  // UI: filtro, prev/next
  // ---------------------------
  function attachUIEvents() {
    // // Filtro rápido por título o código
    // els.quickFilter.addEventListener("input", () => {
    //   const q = (els.quickFilter.value || "").toLowerCase();
    //   state.filtered = !q
    //     ? state.chapters.slice()
    //     : state.chapters.filter(
    //         (c) =>
    //           c.title.toLowerCase().includes(q) ||
    //           c.code.toLowerCase().includes(q)
    //       );
    //   renderChapterList(state.filtered);
    // });
    // els.btnClearFilter.addEventListener("click", () => {
    //   els.quickFilter.value = "";
    //   state.filtered = state.chapters.slice();
    //   renderChapterList(state.filtered);
    // });
    // // Prev / Next
    // els.btnPrev.addEventListener("click", () => {
    //   if (state.currentIndex > 0)
    //     openChapterByCode(state.chapters[state.currentIndex - 1].code);
    // });
    // els.btnNext.addEventListener("click", () => {
    //   if (state.currentIndex < state.chapters.length - 1)
    //     openChapterByCode(state.chapters[state.currentIndex + 1].code);
    // });
  }
});

(function attachSidebarAutoClose() {
  const list = document.getElementById("chaptersList");
  const sidebarEl = document.getElementById("sidebar");
  if (!list || !sidebarEl) return;

  const offcanvas = bootstrap.Offcanvas.getOrCreateInstance(sidebarEl);

  // Delegación: vale para items creados dinámicamente
  list.addEventListener("click", (e) => {
    // Ajusta el selector según tu markup: .list-group-item o .chapter-item
    const item = e.target.closest(".chapter-item");
    if (!item) return;

    // Si tu item guarda el code en data-code:
    const code = item.dataset.code;
    if (code && typeof openChapterByCode === "function") {
      openChapterByCode(code);
    }

    // Cierra el offcanvas
    offcanvas.hide();
  });
})();

// Cambio de Tema Claro/Oscuro
// (() => {
//   const STORAGE_KEY = 'color-scheme';
//   const root = document.documentElement;
//   const btn = document.getElementById('btnTema');
//   const icono = document.getElementById('iconoTema');
//   const label = document.getElementById('labelTema');
//   const media = window.matchMedia('(prefers-color-scheme: dark)');

//   const getSystemPref = () => (media.matches ? 'dark' : 'light');
//   const getSaved = () => localStorage.getItem(STORAGE_KEY) || 'auto';
//   const resolveTheme = (pref) => (pref === 'auto' ? getSystemPref() : pref);

//   function applyTheme(pref) {
//     const effective = resolveTheme(pref);
//     root.setAttribute('data-bs-theme', effective);

//     // Cambiar icono según modo
//     if (effective === 'dark') {
//       icono.className = "bi bi-sun-fill"; // Sol para modo oscuro
//       label.textContent = "Modo claro";
//     } else {
//       icono.className = "bi bi-moon-stars-fill"; // Luna para modo claro
//       label.textContent = "Modo oscuro";
//     }
//   }

//   function save(pref) {
//     localStorage.setItem(STORAGE_KEY, pref);
//   }

//   function nextPref(current) {
//     if (current === 'light') return 'dark';
//     if (current === 'dark') return 'light';
//   }

//   const initial = getSaved();
//   applyTheme(initial);

//   media.addEventListener('change', () => {
//     const pref = getSaved();
//     if (pref === 'auto') applyTheme('auto');
//   });

//   btn?.addEventListener('click', () => {
//     const cur = getSaved();
//     const next = nextPref(cur);
//     save(next);
//     applyTheme(next);
//   });
// })();

(() => {
  const root = document.documentElement;
  const btn = document.getElementById("btnTema");
  const icon = document.getElementById("iconoTema");
  const label = document.getElementById("labelTema");

  function applyTheme(theme) {
    root.setAttribute("data-bs-theme", theme);
    if (icon)
      icon.className =
        theme === "dark" ? "bi bi-sun-fill" : "bi bi-moon-stars-fill";
    if (label)
      label.textContent = theme === "dark" ? "Modo claro" : "Modo oscuro";
  }

  // Siempre inicia en dark
  applyTheme("dark");

  // Alterna en cada click
  btn?.addEventListener("click", (e) => {
    e.preventDefault();
    const current = root.getAttribute("data-bs-theme");
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
  });
})();
