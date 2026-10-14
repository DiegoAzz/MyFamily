// ==============================================================
// AZFLIX - MOTOR Y LÓGICA DEL PROTOTIPO DE STREAMING (ESTILO NETFLIX)
// ==============================================================

(function() {
  'use strict';

  // ESTADO GLOBAL DE LA APLICACIÓN
  const state = {
    currentView: 'home', // 'home' | 'series' | 'movies' | 'trending' | 'mylist'
    isKidsMode: false,
    myList: JSON.parse(localStorage.getItem('azflix_mylist') || '["los-cuatro-zapateados", "el-entierro-de-la-anaconda-negra", "stranger-codes"]'),
    likedTitles: JSON.parse(localStorage.getItem('azflix_likes') || '["los-cuatro-zapateados", "stranger-codes"]'),
    allTitles: [],
    categories: [],
    currentFeatured: null,
    currentModalTitle: null,
    currentPlayingTitle: null,
    currentPlayingEpisode: null,
    idleTimer: null,
    audioCtx: null
  };

  // REFERENCIAS AL DOM
  const dom = {
    navbar: document.getElementById('navbar'),
    brandLogo: document.getElementById('brand-logo'),
    navItems: document.querySelectorAll('.nav-item'),
    myListCounter: document.getElementById('my-list-counter'),
    searchBox: document.getElementById('search-box'),
    btnToggleSearch: document.getElementById('btn-toggle-search'),
    searchInput: document.getElementById('search-input'),
    btnClearSearch: document.getElementById('btn-clear-search'),
    btnKidsMode: document.getElementById('btn-kids-mode'),
    btnNotifications: document.getElementById('btn-notifications'),
    dropdownNotifications: document.getElementById('dropdown-notifications'),
    notifList: document.getElementById('notif-list'),
    btnProfile: document.getElementById('btn-profile'),
    dropdownProfile: document.getElementById('dropdown-profile'),
    profilesList: document.getElementById('profiles-list'),
    currentProfileAvatar: document.getElementById('current-profile-avatar'),

    // Hero Billboard
    billboard: document.getElementById('billboard'),
    billboardBackdrop: document.getElementById('billboard-backdrop'),
    heroTitle: document.getElementById('hero-title'),
    heroSynopsis: document.getElementById('hero-synopsis'),
    heroBtnPlay: document.getElementById('hero-btn-play'),
    heroBtnInfo: document.getElementById('hero-btn-info'),
    heroBtnMute: document.getElementById('hero-btn-mute'),

    // Contenido
    mainContent: document.getElementById('main-content'),
    rowsContainer: document.getElementById('rows-container'),
    searchView: document.getElementById('search-view'),
    searchTermDisplay: document.getElementById('searchTermDisplay') || document.getElementById('search-term-display'),
    searchCountDisplay: document.getElementById('search-count-display'),
    searchResultsGrid: document.getElementById('search-results-grid'),
    myListView: document.getElementById('mylist-view'),
    myListCountDisplay: document.getElementById('mylist-count-display'),
    myListGrid: document.getElementById('mylist-grid'),

    // Modal de Detalle
    modalDetail: document.getElementById('modal-detail'),
    modalBtnClose: document.getElementById('modal-btn-close'),
    modalBackdropImg: document.getElementById('modal-backdrop-img'),
    modalTitle: document.getElementById('modal-title'),
    modalBtnPlay: document.getElementById('modal-btn-play'),
    modalBtnMyList: document.getElementById('modal-btn-mylist'),
    modalBtnLike: document.getElementById('modal-btn-like'),
    modalBtnShare: document.getElementById('modal-btn-share'),
    modalMatchScore: document.getElementById('modal-match-score'),
    modalYear: document.getElementById('modal-year'),
    modalRating: document.getElementById('modal-rating'),
    modalDuration: document.getElementById('modal-duration'),
    modalSynopsis: document.getElementById('modal-synopsis'),
    modalCast: document.getElementById('modal-cast'),
    modalGenres: document.getElementById('modal-genres'),
    modalTags: document.getElementById('modal-tags'),
    modalEpisodesSection: document.getElementById('modal-episodes-section'),
    modalSeasonSelect: document.getElementById('modal-season-select'),
    modalEpisodesList: document.getElementById('modal-episodes-list'),
    modalSimilarGrid: document.getElementById('modal-similar-grid'),
    modalAboutTitle: document.getElementById('modal-about-title'),
    modalDirector: document.getElementById('modal-director'),

    // Reproductor de Video
    videoPlayerOverlay: document.getElementById('video-player-overlay'),
    mainVideo: document.getElementById('main-video'),
    playerBtnBack: document.getElementById('player-btn-back'),
    playerTitleDisplay: document.getElementById('player-title-display'),
    playerSubtitleDisplay: document.getElementById('player-subtitle-display'),
    playerCenterPlay: document.getElementById('player-center-play'),
    timelineContainer: document.getElementById('timeline-container'),
    timelineBar: document.getElementById('timeline-bar'),
    timelineProgress: document.getElementById('timeline-progress'),
    timelineThumb: document.getElementById('timeline-thumb'),
    timelineTooltip: document.getElementById('timeline-tooltip'),
    btnPlayerPlay: document.getElementById('btn-player-play'),
    btnPlayerRewind: document.getElementById('btn-player-rewind'),
    btnPlayerForward: document.getElementById('btn-player-forward'),
    btnPlayerVolume: document.getElementById('btn-player-volume'),
    volumeSlider: document.getElementById('volume-slider'),
    playerTimeText: document.getElementById('player-time-text'),
    btnPlayerNext: document.getElementById('btn-player-next'),
    btnPlayerSubtitles: document.getElementById('btn-player-subtitles'),
    dropdownSubtitles: document.getElementById('dropdown-subtitles'),
    btnPlayerSpeed: document.getElementById('btn-player-speed'),
    dropdownSpeed: document.getElementById('dropdown-speed'),
    btnPlayerFullscreen: document.getElementById('btn-player-fullscreen'),

    // Toast
    toast: document.getElementById('toast'),
    toastText: document.getElementById('toast-text')
  };

  // CONEXIÓN SOCKET.IO (TIEMPO REAL)
  let socket = null;
  try {
    if (typeof io !== 'undefined') {
      socket = io();
      socket.on('online_count', (data) => {
        // Actualizar métrica si está visible
      });
      socket.on('user_watching', (data) => {
        showToast(`🍿 ${data.user} acaba de ver "${data.title}"`);
      });
    }
  } catch (e) {
    console.log('Socket.io no disponible o modo local');
  }

  // ==============================================================
  // 1. SONIDO "TA-DUM" EMBLEMÁTICO DE NETFLIX (WEB AUDIO API)
  // ==============================================================
  function playNetflixTaDum() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!state.audioCtx) {
        state.audioCtx = new AudioContext();
      }
      if (state.audioCtx.state === 'suspended') {
        state.audioCtx.resume();
      }

      const ctx = state.audioCtx;
      const now = ctx.currentTime;

      // Primer golpe percusivo grave (Cello/Taiko profundo)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(105, now);
      osc1.frequency.exponentialRampToValueAtTime(50, now + 0.45);
      gain1.gain.setValueAtTime(0.7, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Segundo acorde amplio orquestal ("DUM" con resonancia)
      setTimeout(() => {
        const t2 = ctx.currentTime;
        const freqs = [130.81, 196.00, 261.63, 392.00]; // Acorde C3, G3, C4, G4
        freqs.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, t2);
          osc.frequency.exponentialRampToValueAtTime(freq * 0.98, t2 + 1.6);
          gain.gain.setValueAtTime(0.25, t2);
          gain.gain.exponentialRampToValueAtTime(0.001, t2 + 1.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t2);
          osc.stop(t2 + 1.8);
        });
      }, 180);
    } catch (err) {
      console.warn('AudioContext bloqueado por navegador', err);
    }
  }

  // ==============================================================
  // 2. INICIALIZACIÓN Y CARGA DE DATOS DESDE LA API
  // ==============================================================
  async function init() {
    setupEventListeners();
    updateMyListCounter();

    try {
      // 1. Obtener títulos generales
      const titlesRes = await fetch('/api/titles');
      const titlesData = await titlesRes.json();
      state.allTitles = titlesData.titles || [];

      // 2. Obtener título destacado para el Hero
      const featRes = await fetch('/api/featured');
      const featData = await featRes.json();
      state.currentFeatured = featData.featured || state.allTitles[0];
      renderBillboard(state.currentFeatured);

      // 3. Obtener categorías con carruseles
      await loadCategories();

      // 4. Obtener perfiles y notificaciones
      loadProfiles();
      loadNotifications();

    } catch (err) {
      console.error('Error cargando catálogo:', err);
      showToast('Error conectando con el servidor de AzFlix');
    }
  }

  // Cargar categorías según la vista actual y filtros
  async function loadCategories() {
    try {
      const url = `/api/categories?kids=${state.isKidsMode}`;
      const res = await fetch(url);
      const data = await res.json();
      state.categories = data.categories || [];
      renderRows(state.categories);
    } catch (err) {
      console.error('Error cargando categorías:', err);
    }
  }

  // ==============================================================
  // 3. RENDERIZADO DE COMPONENTES
  // ==============================================================

  // Renderizar Hero Billboard
  function renderBillboard(item) {
    if (!item) return;
    dom.heroTitle.textContent = item.title.toUpperCase();
    dom.heroSynopsis.textContent = item.synopsis;
    dom.billboardBackdrop.style.backgroundImage = `url('${item.backdropUrl}')`;

    // Asignar clics de reproducción e información
    dom.heroBtnPlay.onclick = () => {
      playNetflixTaDum();
      openVideoPlayer(item);
    };

    dom.heroBtnInfo.onclick = () => {
      openDetailModal(item);
    };
  }

  // Renderizar todas las filas de carrusel
  function renderRows(categoriesList) {
    dom.rowsContainer.innerHTML = '';

    categoriesList.forEach(category => {
      if (!category.titles || category.titles.length === 0) return;

      const rowElem = document.createElement('section');
      rowElem.className = 'content-row';

      // Cabecera de fila
      const headerElem = document.createElement('div');
      headerElem.className = 'row-header';
      headerElem.innerHTML = `
        <h2 class="row-title">${category.title}</h2>
        <span class="row-see-all">Explorar todo ›</span>
      `;
      rowElem.appendChild(headerElem);

      // Contenedor de carrusel con flechas de scroll
      const carouselWrap = document.createElement('div');
      carouselWrap.className = 'carousel-wrapper';

      const btnPrev = document.createElement('button');
      btnPrev.className = 'carousel-btn prev';
      btnPrev.innerHTML = '‹';
      btnPrev.title = 'Anterior';

      const btnNext = document.createElement('button');
      btnNext.className = 'carousel-btn next';
      btnNext.innerHTML = '›';
      btnNext.title = 'Siguiente';

      const track = document.createElement('div');
      track.className = 'carousel-track';

      // Renderizar tarjetas dentro del track
      category.titles.forEach((titleItem, index) => {
        if (category.isTop10Layout) {
          // Diseño especial Top 10 con número gigante
          const top10Card = createTop10Card(titleItem, index + 1);
          track.appendChild(top10Card);
        } else {
          // Tarjeta estándar o vertical (Originals)
          const card = createMediaCard(titleItem, category);
          track.appendChild(card);
        }
      });

      // Navegación de scroll horizontal
      btnPrev.onclick = () => {
        track.scrollBy({ left: -window.innerWidth * 0.75, behavior: 'smooth' });
      };
      btnNext.onclick = () => {
        track.scrollBy({ left: window.innerWidth * 0.75, behavior: 'smooth' });
      };

      carouselWrap.appendChild(btnPrev);
      carouselWrap.appendChild(track);
      carouselWrap.appendChild(btnNext);
      rowElem.appendChild(carouselWrap);

      dom.rowsContainer.appendChild(rowElem);
    });
  }

  // Crear tarjeta estándar o de Originales
  function createMediaCard(item, category) {
    const card = document.createElement('div');
    const isTall = !!category.isTall;
    card.className = `media-card ${isTall ? 'tall-card' : ''}`;

    const isBookmarked = state.myList.includes(item.id);
    const isLiked = state.likedTitles.includes(item.id);

    const thumbUrl = isTall ? (item.posterUrl || item.backdropUrl) : (item.backdropUrl || item.posterUrl);

    card.innerHTML = `
      <img src="${thumbUrl}" alt="${item.title}" class="card-thumb" loading="lazy">
      ${item.isOriginal ? '<span class="card-original-badge">N</span>' : ''}
      ${category.showProgress && item.progressPercent ? `
        <div class="card-progress-bar">
          <div class="card-progress-fill" style="width: ${item.progressPercent}%"></div>
        </div>
      ` : ''}

      <!-- Overlay expandible en hover -->
      <div class="card-hover-overlay">
        <div class="card-hover-actions">
          <div class="actions-left">
            <button class="btn-mini-circle pri btn-card-play" title="Reproducir">▶</button>
            <button class="btn-mini-circle btn-card-list" title="${isBookmarked ? 'Quitar de mi lista' : 'Agregar a mi lista'}">
              ${isBookmarked ? '✓' : '+'}
            </button>
            <button class="btn-mini-circle btn-card-like" title="Me gusta">
              ${isLiked ? '❤️' : '👍'}
            </button>
          </div>
          <button class="btn-mini-circle btn-card-info" title="Más detalles">∨</button>
        </div>

        <span class="card-hover-title">${item.title}</span>
        
        <div class="card-hover-meta">
          <span class="match-score">${item.matchScore}%</span>
          <span class="rating-badge">${item.rating}</span>
          <span class="meta-tag">${item.duration}</span>
        </div>

        <span class="card-hover-genres">${(item.genres || []).slice(0, 3).join(' • ')}</span>
      </div>
    `;

    // Eventos de botones internos de la tarjeta
    const btnPlay = card.querySelector('.btn-card-play');
    const btnList = card.querySelector('.btn-card-list');
    const btnLike = card.querySelector('.btn-card-like');
    const btnInfo = card.querySelector('.btn-card-info');

    btnPlay.onclick = (e) => {
      e.stopPropagation();
      playNetflixTaDum();
      openVideoPlayer(item);
    };

    btnList.onclick = (e) => {
      e.stopPropagation();
      toggleMyList(item.id);
      btnList.textContent = state.myList.includes(item.id) ? '✓' : '+';
    };

    btnLike.onclick = (e) => {
      e.stopPropagation();
      toggleLike(item.id);
      btnLike.textContent = state.likedTitles.includes(item.id) ? '❤️' : '👍';
    };

    btnInfo.onclick = (e) => {
      e.stopPropagation();
      openDetailModal(item);
    };

    // Click en la tarjeta abre el detalle
    card.onclick = () => {
      openDetailModal(item);
    };

    return card;
  }

  // Crear tarjeta especial para el TOP 10 (con número gigante)
  function createTop10Card(item, rankNumber) {
    const wrap = document.createElement('div');
    wrap.className = 'top10-card-wrapper';

    wrap.innerHTML = `
      <span class="top10-number">${rankNumber}</span>
      <div class="top10-poster-wrap">
        <img src="${item.posterUrl || item.backdropUrl}" alt="${item.title}" loading="lazy">
      </div>
    `;

    wrap.onclick = () => {
      openDetailModal(item);
    };

    return wrap;
  }

  // ==============================================================
  // 4. MODAL DE DETALLE (QUICK-VIEW / INFO MODAL)
  // ==============================================================
  async function openDetailModal(item) {
    state.currentModalTitle = item;

    // Cargar datos en el modal
    dom.modalTitle.textContent = item.title;
    dom.modalBackdropImg.src = item.backdropUrl || item.posterUrl;
    dom.modalMatchScore.textContent = `${item.matchScore}% de coincidencia`;
    dom.modalYear.textContent = item.year || 2026;
    dom.modalRating.textContent = item.rating || '16+';
    dom.modalDuration.textContent = item.duration;
    dom.modalSynopsis.textContent = item.synopsis;

    dom.modalCast.textContent = (item.cast || ['Elenco estelar']).join(', ');
    dom.modalGenres.textContent = (item.genres || []).join(', ');
    dom.modalTags.textContent = (item.tags || ['Emocionante', 'Frenético']).join(', ');

    dom.modalAboutTitle.textContent = item.title;
    dom.modalDirector.textContent = item.director || 'The Az Studios';

    // Actualizar estado del botón Mi Lista en el modal
    updateModalMyListBtn(item.id);

    // Si es serie y tiene episodios, mostrarlos
    if (item.type === 'series' && item.seasons && item.seasons.length > 0) {
      dom.modalEpisodesSection.classList.remove('hidden');
      renderSeasonsAndEpisodes(item);
    } else {
      dom.modalEpisodesSection.classList.add('hidden');
    }

    // Cargar recomendaciones de títulos similares
    loadSimilarTitles(item.id);

    // Botón reproducir del modal
    dom.modalBtnPlay.onclick = () => {
      playNetflixTaDum();
      closeDetailModal();
      openVideoPlayer(item);
    };

    // Botón toggle mi lista
    dom.modalBtnMyList.onclick = () => {
      toggleMyList(item.id);
      updateModalMyListBtn(item.id);
    };

    // Botón compartir
    dom.modalBtnShare.onclick = () => {
      navigator.clipboard?.writeText(window.location.href);
      showToast('Enlace de AzFlix copiado al portapapeles');
    };

    // Mostrar modal y bloquear scroll de fondo
    dom.modalDetail.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeDetailModal() {
    dom.modalDetail.classList.add('hidden');
    document.body.style.overflow = '';
    state.currentModalTitle = null;
  }

  function updateModalMyListBtn(id) {
    const isSaved = state.myList.includes(id);
    dom.modalBtnMyList.textContent = isSaved ? '✓' : '+';
    dom.modalBtnMyList.title = isSaved ? 'En mi lista' : 'Agregar a mi lista';
  }

  // Renderizar episodios para series en el modal
  function renderSeasonsAndEpisodes(seriesItem) {
    dom.modalSeasonSelect.innerHTML = '';
    seriesItem.seasons.forEach((season, sIdx) => {
      const opt = document.createElement('option');
      opt.value = sIdx;
      opt.textContent = `${season.title} (${season.episodes.length} episodios)`;
      dom.modalSeasonSelect.appendChild(opt);
    });

    const displayEpisodes = (seasonIndex) => {
      const season = seriesItem.seasons[seasonIndex];
      dom.modalEpisodesList.innerHTML = '';

      season.episodes.forEach((ep) => {
        const epItem = document.createElement('div');
        epItem.className = 'episode-item';
        epItem.innerHTML = `
          <span class="ep-number">${ep.number}</span>
          <div class="ep-thumb-wrap">
            <img src="${ep.thumbnail}" alt="${ep.title}">
            <div class="ep-play-overlay">▶</div>
          </div>
          <div class="ep-details">
            <div class="ep-header-row">
              <span class="ep-title">${ep.title}</span>
              <span class="ep-duration">${ep.duration}</span>
            </div>
            <p class="ep-synopsis">${ep.synopsis}</p>
          </div>
        `;

        epItem.onclick = () => {
          playNetflixTaDum();
          closeDetailModal();
          openVideoPlayer(seriesItem, ep);
        };

        dom.modalEpisodesList.appendChild(epItem);
      });
    };

    dom.modalSeasonSelect.onchange = (e) => {
      displayEpisodes(parseInt(e.target.value, 10));
    };

    // Mostrar temporada 1 por defecto
    displayEpisodes(0);
  }

  // Cargar títulos similares en el modal
  async function loadSimilarTitles(id) {
    try {
      const res = await fetch(`/api/title/${id}`);
      const data = await res.json();
      dom.modalSimilarGrid.innerHTML = '';

      (data.similar || []).forEach(sim => {
        const simCard = document.createElement('div');
        simCard.className = 'similar-card';
        simCard.innerHTML = `
          <img src="${sim.backdropUrl || sim.posterUrl}" class="similar-thumb" alt="${sim.title}">
          <div class="similar-body">
            <div class="similar-meta">
              <span class="match-score">${sim.matchScore}%</span>
              <span class="rating-badge">${sim.rating}</span>
            </div>
            <h4 class="similar-title">${sim.title}</h4>
            <p class="similar-synopsis">${sim.synopsis}</p>
          </div>
        `;

        simCard.onclick = () => {
          openDetailModal(sim);
        };

        dom.modalSimilarGrid.appendChild(simCard);
      });
    } catch (err) {
      console.error('Error cargando similares:', err);
    }
  }

  // ==============================================================
  // 5. REPRODUCTOR DE VIDEO COMPLETO (NETFLIX VIDEO PLAYER)
  // ==============================================================
  function openVideoPlayer(item, episode = null) {
    state.currentPlayingTitle = item;
    state.currentPlayingEpisode = episode;

    const streamUrl = episode ? episode.videoUrl : item.videoUrl;
    dom.mainVideo.src = streamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4';

    // Textos informativos de barra superior
    dom.playerTitleDisplay.textContent = item.title;
    dom.playerSubtitleDisplay.textContent = episode ? episode.title : (item.duration || 'Película');

    dom.videoPlayerOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Reproducir video
    dom.mainVideo.play().then(() => {
      dom.btnPlayerPlay.textContent = '⏸';
      dom.playerCenterPlay.classList.add('hidden');
    }).catch(() => {
      dom.btnPlayerPlay.textContent = '▶';
      dom.playerCenterPlay.classList.remove('hidden');
    });

    // Notificar en tiempo real por Socket.io
    if (socket) {
      socket.emit('watch_title', {
        user: 'Diego',
        title: item.title
      });
    }

    resetIdleTimer();
  }

  function closeVideoPlayer() {
    dom.mainVideo.pause();
    dom.mainVideo.src = '';
    dom.videoPlayerOverlay.classList.add('hidden');
    document.body.style.overflow = '';
    state.currentPlayingTitle = null;
    state.currentPlayingEpisode = null;
  }

  // Formatear segundos a formato MM:SS o HH:MM:SS
  function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // Ocultar controles del reproductor al no mover el mouse
  function resetIdleTimer() {
    dom.videoPlayerOverlay.classList.remove('user-idle');
    clearTimeout(state.idleTimer);
    state.idleTimer = setTimeout(() => {
      if (!dom.mainVideo.paused) {
        dom.videoPlayerOverlay.classList.add('user-idle');
      }
    }, 3500);
  }

  // ==============================================================
  // 6. GESTIÓN DE MI LISTA Y VISTAS DE NAVEGACIÓN
  // ==============================================================
  function toggleMyList(id) {
    const idx = state.myList.indexOf(id);
    if (idx === -1) {
      state.myList.push(id);
      showToast('Añadido a Mi lista');
    } else {
      state.myList.splice(idx, 1);
      showToast('Quitado de Mi lista');
    }
    localStorage.setItem('azflix_mylist', JSON.stringify(state.myList));
    updateMyListCounter();

    if (state.currentView === 'mylist') {
      renderMyListView();
    }
  }

  function toggleLike(id) {
    const idx = state.likedTitles.indexOf(id);
    if (idx === -1) {
      state.likedTitles.push(id);
      showToast('Te gusta este título 👍');
    } else {
      state.likedTitles.splice(idx, 1);
      showToast('Reacción eliminada');
    }
    localStorage.setItem('azflix_likes', JSON.stringify(state.likedTitles));
  }

  function updateMyListCounter() {
    const count = state.myList.length;
    if (count > 0) {
      dom.myListCounter.textContent = count;
      dom.myListCounter.classList.remove('hidden');
    } else {
      dom.myListCounter.classList.add('hidden');
    }
  }

  function renderMyListView() {
    dom.rowsContainer.classList.add('hidden');
    dom.searchView.classList.add('hidden');
    dom.billboard.classList.add('hidden');
    dom.myListView.classList.remove('hidden');

    const savedTitles = state.allTitles.filter(t => state.myList.includes(t.id));
    dom.myListCountDisplay.textContent = `${savedTitles.length} títulos guardados`;
    dom.myListGrid.innerHTML = '';

    if (savedTitles.length === 0) {
      dom.myListGrid.innerHTML = `
        <div style="grid-column: 1/-1; padding: 60px 0; text-align: center; color: #888;">
          <h3 style="font-size: 1.3rem; margin-bottom: 8px;">Aún no tienes títulos en tu lista</h3>
          <p>Explora el catálogo y presiona el botón '+' para guardar películas y series aquí.</p>
        </div>
      `;
      return;
    }

    savedTitles.forEach(item => {
      const card = createMediaCard(item, { isTall: false });
      dom.myListGrid.appendChild(card);
    });
  }

  // Filtrar vistas por pestañas de la barra de navegación
  function switchView(viewName) {
    state.currentView = viewName;
    dom.navItems.forEach(b => {
      b.classList.toggle('active', b.dataset.view === viewName);
    });

    if (viewName === 'mylist') {
      renderMyListView();
      return;
    }

    // Restaurar vistas estándar
    dom.myListView.classList.add('hidden');
    dom.searchView.classList.add('hidden');
    dom.billboard.classList.remove('hidden');
    dom.rowsContainer.classList.remove('hidden');

    if (viewName === 'series') {
      const filtered = state.categories.map(c => ({
        ...c,
        titles: c.titles.filter(t => t.type === 'series')
      })).filter(c => c.titles.length > 0);
      renderRows(filtered);
    } else if (viewName === 'movies') {
      const filtered = state.categories.map(c => ({
        ...c,
        titles: c.titles.filter(t => t.type === 'movie')
      })).filter(c => c.titles.length > 0);
      renderRows(filtered);
    } else if (viewName === 'trending') {
      const filtered = state.categories.filter(c => c.id === 'trending' || c.id === 'top-10');
      renderRows(filtered);
    } else {
      // 'home'
      renderRows(state.categories);
    }
  }

  // ==============================================================
  // 7. BÚSQUEDA EN TIEMPO REAL
  // ==============================================================
  let searchTimeout = null;

  function performSearch(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
      dom.searchView.classList.add('hidden');
      dom.billboard.classList.remove('hidden');
      dom.rowsContainer.classList.remove('hidden');
      return;
    }

    dom.billboard.classList.add('hidden');
    dom.rowsContainer.classList.add('hidden');
    dom.myListView.classList.add('hidden');
    dom.searchView.classList.remove('hidden');

    dom.searchTermDisplay.textContent = `"${query}"`;

    const results = state.allTitles.filter(t => {
      return t.title.toLowerCase().includes(q) ||
        t.originalTitle.toLowerCase().includes(q) ||
        t.synopsis.toLowerCase().includes(q) ||
        t.genres.some(g => g.toLowerCase().includes(q)) ||
        (t.cast && t.cast.some(c => c.toLowerCase().includes(q)));
    });

    dom.searchCountDisplay.textContent = `${results.length} títulos encontrados`;
    dom.searchResultsGrid.innerHTML = '';

    if (results.length === 0) {
      dom.searchResultsGrid.innerHTML = `
        <div style="grid-column: 1/-1; padding: 60px 0; text-align: center; color: #888;">
          <h3 style="font-size: 1.3rem; margin-bottom: 8px;">No se encontraron coincidencias para "${query}"</h3>
          <p>Sugerencias: intenta buscar por género como "Acción", "Suspenso", o actores.</p>
        </div>
      `;
      return;
    }

    results.forEach(item => {
      const card = createMediaCard(item, { isTall: false });
      dom.searchResultsGrid.appendChild(card);
    });
  }

  // ==============================================================
  // 8. NOTIFICACIONES Y PERFILES
  // ==============================================================
  async function loadNotifications() {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      dom.notifList.innerHTML = '';

      (data.notifications || []).forEach(notif => {
        const item = document.createElement('div');
        item.className = 'notif-item';
        item.innerHTML = `
          <img src="${notif.imageUrl}" class="notif-img" alt="${notif.title}">
          <div class="notif-texts">
            <h4>${notif.title}</h4>
            <p>${notif.subtitle}</p>
            <span class="notif-time">${notif.time}</span>
          </div>
        `;
        dom.notifList.appendChild(item);
      });
    } catch (e) {
      console.log('Error notificaciones:', e);
    }
  }

  async function loadProfiles() {
    try {
      const res = await fetch('/api/profiles');
      const data = await res.json();
      dom.profilesList.innerHTML = '';

      (data.profiles || []).forEach(prof => {
        const row = document.createElement('div');
        row.className = 'profile-item-row';
        row.innerHTML = `
          <img src="${prof.avatar}" alt="${prof.name}">
          <span>${prof.name}</span>
        `;

        row.onclick = () => {
          dom.currentProfileAvatar.src = prof.avatar;
          state.isKidsMode = !!prof.isKids;
          dom.btnKidsMode.classList.toggle('active', state.isKidsMode);
          dom.dropdownProfile.classList.add('hidden');
          showToast(`Cambiado a perfil: ${prof.name}`);
          loadCategories();
        };

        dom.profilesList.appendChild(row);
      });
    } catch (e) {
      console.log('Error perfiles:', e);
    }
  }

  // ==============================================================
  // 9. CONFIGURACIÓN DE EVENTOS Y ATAJOS
  // ==============================================================
  function setupEventListeners() {
    // 1. Efecto Scroll en Navbar
    window.addEventListener('scroll', () => {
      dom.navbar.classList.toggle('scrolled', window.scrollY > 40);
    });

    // 2. Click en Logo (Ta-dum!)
    dom.brandLogo.onclick = (e) => {
      e.preventDefault();
      playNetflixTaDum();
      switchView('home');
    };

    // 3. Menú de navegación
    dom.navItems.forEach(btn => {
      btn.onclick = () => {
        switchView(btn.dataset.view);
      };
    });

    // 4. Buscador expandible
    dom.btnToggleSearch.onclick = () => {
      dom.searchBox.classList.toggle('open');
      if (dom.searchBox.classList.contains('open')) {
        dom.searchInput.focus();
      }
    };

    dom.searchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      dom.btnClearSearch.classList.toggle('hidden', val.length === 0);
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        performSearch(val);
      }, 250);
    });

    dom.btnClearSearch.onclick = () => {
      dom.searchInput.value = '';
      dom.btnClearSearch.classList.add('hidden');
      performSearch('');
    };

    // 5. Modo Niños
    dom.btnKidsMode.onclick = () => {
      state.isKidsMode = !state.isKidsMode;
      dom.btnKidsMode.classList.toggle('active', state.isKidsMode);
      showToast(state.isKidsMode ? 'Modo Niños activado 🎈' : 'Modo Estándar activado');
      loadCategories();
    };

    // 6. Dropdowns (Notificaciones y Perfil)
    dom.btnNotifications.onclick = (e) => {
      e.stopPropagation();
      dom.dropdownNotifications.classList.toggle('hidden');
      dom.dropdownProfile.classList.add('hidden');
    };

    dom.btnProfile.onclick = (e) => {
      e.stopPropagation();
      dom.dropdownProfile.classList.toggle('hidden');
      dom.dropdownNotifications.classList.add('hidden');
    };

    document.addEventListener('click', () => {
      dom.dropdownNotifications.classList.add('hidden');
      dom.dropdownProfile.classList.add('hidden');
      dom.dropdownSubtitles.classList.add('hidden');
      dom.dropdownSpeed.classList.add('hidden');
    });

    // 7. Modal de Detalle
    dom.modalBtnClose.onclick = closeDetailModal;
    dom.modalDetail.onclick = (e) => {
      if (e.target === dom.modalDetail) closeDetailModal();
    };

    // 8. Reproductor de Video
    dom.playerBtnBack.onclick = closeVideoPlayer;

    dom.btnPlayerPlay.onclick = () => {
      if (dom.mainVideo.paused) {
        dom.mainVideo.play();
        dom.btnPlayerPlay.textContent = '⏸';
        dom.playerCenterPlay.classList.add('hidden');
      } else {
        dom.mainVideo.pause();
        dom.btnPlayerPlay.textContent = '▶';
        dom.playerCenterPlay.classList.remove('hidden');
      }
    };

    dom.mainVideo.onclick = () => {
      dom.btnPlayerPlay.click();
    };

    dom.btnPlayerRewind.onclick = () => {
      dom.mainVideo.currentTime = Math.max(0, dom.mainVideo.currentTime - 10);
    };

    dom.btnPlayerForward.onclick = () => {
      dom.mainVideo.currentTime = Math.min(dom.mainVideo.duration, dom.mainVideo.currentTime + 10);
    };

    // Barra de progreso y tiempo
    dom.mainVideo.addEventListener('timeupdate', () => {
      const cur = dom.mainVideo.currentTime;
      const dur = dom.mainVideo.duration || 1;
      const pct = (cur / dur) * 100;
      dom.timelineProgress.style.width = `${pct}%`;
      dom.timelineThumb.style.left = `${pct}%`;
      dom.playerTimeText.textContent = `${formatTime(cur)} / ${formatTime(dur)}`;
    });

    dom.timelineContainer.onclick = (e) => {
      const rect = dom.timelineBar.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      dom.mainVideo.currentTime = pos * dom.mainVideo.duration;
    };

    // Volumen
    dom.volumeSlider.addEventListener('input', (e) => {
      dom.mainVideo.volume = parseFloat(e.target.value);
      dom.btnPlayerVolume.textContent = dom.mainVideo.volume === 0 ? '🔇' : '🔊';
    });

    dom.btnPlayerVolume.onclick = () => {
      dom.mainVideo.muted = !dom.mainVideo.muted;
      dom.btnPlayerVolume.textContent = dom.mainVideo.muted ? '🔇' : '🔊';
    };

    // Pantalla completa
    dom.btnPlayerFullscreen.onclick = () => {
      if (!document.fullscreenElement) {
        dom.videoPlayerOverlay.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    };

    // Velocidad de reproducción
    dom.btnPlayerSpeed.onclick = (e) => {
      e.stopPropagation();
      dom.dropdownSpeed.classList.toggle('hidden');
    };

    dom.dropdownSpeed.querySelectorAll('.popup-option').forEach(btn => {
      btn.onclick = () => {
        const spd = parseFloat(btn.dataset.speed);
        dom.mainVideo.playbackRate = spd;
        dom.btnPlayerSpeed.textContent = `⚡ ${spd}x`;
        dom.dropdownSpeed.querySelectorAll('.popup-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        dom.dropdownSpeed.classList.add('hidden');
      };
    });

    // Subtítulos
    dom.btnPlayerSubtitles.onclick = (e) => {
      e.stopPropagation();
      dom.dropdownSubtitles.classList.toggle('hidden');
    };

    // Detectar inactividad del mouse en reproductor
    dom.videoPlayerOverlay.addEventListener('mousemove', resetIdleTimer);

    // 9. Atajos de Teclado
    document.addEventListener('keydown', (e) => {
      // Si el reproductor está abierto
      if (!dom.videoPlayerOverlay.classList.contains('hidden')) {
        if (e.code === 'Space') {
          e.preventDefault();
          dom.btnPlayerPlay.click();
        } else if (e.code === 'ArrowLeft') {
          e.preventDefault();
          dom.btnPlayerRewind.click();
        } else if (e.code === 'ArrowRight') {
          e.preventDefault();
          dom.btnPlayerForward.click();
        } else if (e.code === 'KeyF') {
          dom.btnPlayerFullscreen.click();
        } else if (e.code === 'KeyM') {
          dom.btnPlayerVolume.click();
        } else if (e.code === 'Escape') {
          closeVideoPlayer();
        }
        return;
      }

      // Si el modal de detalle está abierto
      if (!dom.modalDetail.classList.contains('hidden')) {
        if (e.code === 'Escape') {
          closeDetailModal();
        }
      }
    });
  }

  // Toast flotante
  function showToast(msg) {
    dom.toastText.textContent = msg;
    dom.toast.classList.remove('hidden');
    clearTimeout(dom.toast._timer);
    dom.toast._timer = setTimeout(() => {
      dom.toast.classList.add('hidden');
    }, 2800);
  }

  // Iniciar al cargar el DOM
  document.addEventListener('DOMContentLoaded', init);

})();
