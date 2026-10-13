// Base de datos simulada para prototipo estilo Netflix (AZFLIX)
// Incluye enlaces a videos reales MP4 de alta calidad (Google GTV sample CDN),
// pósters cinemáticos, temporadas, episodios, elenco y metadatos completos.

const titles = [
  {
    id: 'stranger-codes',
    title: 'Stranger Codes: La Brecha',
    originalTitle: 'Stranger Codes',
    type: 'series',
    isOriginal: true,
    isTop10: 1,
    year: 2026,
    rating: '16+',
    matchScore: 99,
    duration: '3 Temporadas',
    genres: ['Ciencia Ficción', 'Suspenso', 'Misterio'],
    tags: ['Siniestro', 'Inquietante', 'Frenético'],
    director: 'The Az Brothers',
    cast: ['Millie Vance', 'David Hopper', 'Finn Wolf', 'Winona Ryder'],
    synopsis: 'Cuando un joven programador desaparece sin dejar rastro en un laboratorio subterráneo, sus amigos descubren un portal a una dimensión cuántica dominada por inteligencias hostiles y experimentos clasificados.',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    progressPercent: 78,
    seasons: [
      {
        seasonNumber: 1,
        title: 'Temporada 1',
        episodes: [
          {
            number: 1,
            title: 'Capítulo 1: El Algoritmo Perdido',
            duration: '48 min',
            synopsis: 'Una noche tormentosa, la señal de telecomunicaciones de la ciudad colapsa tras una extraña brecha de datos.',
            thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=500&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
          },
          {
            number: 2,
            title: 'Capítulo 2: El Eco de la Frecuencia',
            duration: '52 min',
            synopsis: 'El equipo rastrea la señal hasta un servidor abandonado en el bosque, encontrando una criatura bio-digital.',
            thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=500&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
          },
          {
            number: 3,
            title: 'Capítulo 3: La Dimensión Espejo',
            duration: '55 min',
            synopsis: 'Las leyes físicas se invierten cuando logran cruzar la membrana entre ambos mundos.',
            thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
          }
        ]
      },
      {
        seasonNumber: 2,
        title: 'Temporada 2',
        episodes: [
          {
            number: 1,
            title: 'Capítulo 1: La Nueva Infección',
            duration: '51 min',
            synopsis: 'Un año después de cerrar el portal, una red neural parasitaria infecta la infraestructura metropolitana.',
            thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=500&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
          }
        ]
      }
    ]
  },
  {
    id: 'sombras-neon',
    title: 'Cyberpunk: Sombras de Neón',
    originalTitle: 'Neon Shadows: 2099',
    type: 'movie',
    isOriginal: true,
    isTop10: 2,
    year: 2026,
    rating: '18+',
    matchScore: 97,
    duration: '2 h 18 min',
    genres: ['Acción', 'Ciencia Ficción', 'Cyberpunk'],
    tags: ['Visualmente deslumbrante', 'Violencia estilizada', 'Distópico'],
    director: 'Katsuhiro Tanaka',
    cast: ['Alex Drake', 'Rinko Takahashi', 'Michael Fassbender'],
    synopsis: 'En una megalópolis vertical empapada de lluvia y neón, un mercenario cibernético con recuerdos implantados acepta un último contrato para robar la llave cuántica de una megacorporación farmacéutica.',
    backdropUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1920&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    progressPercent: 42
  },
  {
    id: 'el-imperio-az',
    title: 'Dinastía Az: Reyes de Wall Street',
    originalTitle: 'Az Dynasty',
    type: 'series',
    isOriginal: true,
    isTop10: 3,
    year: 2025,
    rating: '16+',
    matchScore: 96,
    duration: '4 Temporadas',
    genres: ['Drama', 'Intriga', 'Negocios'],
    tags: ['Cínico', 'Elegante', 'Suspenso corporativo'],
    director: 'Martin Scorsese',
    cast: ['Brian Cox', 'Jeremy Strong', 'Sarah Snook', 'Kieran Culkin'],
    synopsis: 'Una feroz lucha de poder se desata en el conglomerado mediático y financiero más influyente del planeta cuando el patriarca de la familia decide ceder el control.',
    backdropUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    progressPercent: 91,
    seasons: [
      {
        seasonNumber: 1,
        title: 'Temporada 1',
        episodes: [
          {
            number: 1,
            title: 'Capítulo 1: La Celebración',
            duration: '60 min',
            synopsis: 'Durante el cumpleaños del patriarca, una filtración de información confidencial desata el pánico en la junta directiva.',
            thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=500&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
          }
        ]
      }
    ]
  },
  {
    id: 'furia-nocturna',
    title: 'Rally Nocturno: Furia en Tokio',
    originalTitle: 'Midnight Drift Tokyo',
    type: 'movie',
    isOriginal: false,
    isTop10: 4,
    year: 2025,
    rating: '13+',
    matchScore: 94,
    duration: '1 h 54 min',
    genres: ['Acción', 'Velocidad', 'Crimen'],
    tags: ['Adrenalina pura', 'Automovilismo', 'Sonido estruendoso'],
    director: 'Justin Lin',
    cast: ['Paul Walker Jr.', 'Lucas Black', 'Sung Kang'],
    synopsis: 'Un piloto clandestino exiliado compite por los corredores subterráneos de Shinjuku para saldar una deuda mortal con la mafia japonesa y limpiar el nombre de su escudería.',
    backdropUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1920&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4'
  },
  {
    id: 'mision-espacial-orion',
    title: 'Estación Espacial Orión',
    originalTitle: 'Orion Deep Space',
    type: 'movie',
    isOriginal: true,
    isTop10: 5,
    year: 2026,
    rating: '13+',
    matchScore: 98,
    duration: '2 h 29 min',
    genres: ['Ciencia Ficción', 'Aventura', 'Drama'],
    tags: ['Épico', 'Reflexivo', 'Banda sonora majestuosa'],
    director: 'Christopher Nolan',
    cast: ['Matthew McConaughey', 'Jessica Chastain', 'Anne Hathaway'],
    synopsis: 'La tripulación del crucero interestelar Orión emprende un viaje más allá de la galaxia conocida en busca de un nuevo hogar habitable, desafiando las distorsiones del tiempo y agujeros de gusano.',
    backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
  },
  {
    id: 'el-cazador-glaciar',
    title: 'El Cazador Glaciar',
    originalTitle: 'The Glacial Hunter',
    type: 'movie',
    isOriginal: false,
    isTop10: 6,
    year: 2024,
    rating: '16+',
    matchScore: 91,
    duration: '2 h 05 min',
    genres: ['Acción', 'Supervivencia', 'Suspenso'],
    tags: ['Crudo', 'Nieve extrema', 'Tensión constante'],
    director: 'Alejandro G. Iñárritu',
    cast: ['Leonardo DiCaprio', 'Tom Hardy'],
    synopsis: 'Tras ser traicionado y abandonado a su suerte en la tundra congelada de Alaska, un rastreador experto lucha contra los elementos y una manada de lobos para cobrar venganza.',
    backdropUrl: 'https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=1920&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
  },
  {
    id: 'la-casa-de-datos',
    title: 'La Casa de Datos: Atraco Digital',
    originalTitle: 'Money Heist: Crypto Zero',
    type: 'series',
    isOriginal: true,
    isTop10: 7,
    year: 2025,
    rating: '16+',
    matchScore: 95,
    duration: '3 Temporadas',
    genres: ['Suspenso', 'Acción', 'Crimen'],
    tags: ['Ingenioso', 'Frenético', 'Mente maestra'],
    director: 'Álex Pina',
    cast: ['Álvaro Morte', 'Úrsula Corberó', 'Pedro Alonso'],
    synopsis: 'Un genio informático apodado El Arquitecto recluta a los 8 hackers más buscados de Interpol para infiltrarse en la bóveda cuántica del Banco Central Europeo y ejecutar el mayor atraco cibernético de la historia.',
    backdropUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1920&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    seasons: [
      {
        seasonNumber: 1,
        title: 'Temporada 1',
        episodes: [
          {
            number: 1,
            title: 'Capítulo 1: El Firewall Se Rompe',
            duration: '50 min',
            synopsis: 'El equipo se reúne en una fortaleza secreta en Toledo para ensayar durante cinco meses cada paso del plan.',
            thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=500&q=80',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
          }
        ]
      }
    ]
  },
  {
    id: 'chef-secreto-alta-cocina',
    title: 'Chef Secreto: Batalla Culinaria',
    originalTitle: 'Secret Kitchen: Masterclass',
    type: 'series',
    isOriginal: true,
    isTop10: 8,
    year: 2026,
    rating: 'ATP',
    matchScore: 90,
    duration: '2 Temporadas',
    genres: ['Reality', 'Cocina', 'Competencia'],
    tags: ['Inspirador', 'Delicioso', 'Emocionante'],
    director: 'Gordon Ramsay Studio',
    cast: ['Gordon Ramsay', 'Massimo Bottura', 'Dominique Crenn'],
    synopsis: 'Doce chefs con estrellas Michelin de todo el mundo compiten a ciegas con ingredientes exóticos en desafíos contrarreloj de alta presión.',
    backdropUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1920&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4'
  },
  {
    id: 'reino-de-dragones',
    title: 'Reino de Dragones: Trono de Ceniza',
    originalTitle: 'Dragon Realm',
    type: 'series',
    isOriginal: true,
    isTop10: 9,
    year: 2025,
    rating: '18+',
    matchScore: 97,
    duration: '2 Temporadas',
    genres: ['Fantasía', 'Acción', 'Aventura'],
    tags: ['Épico', 'Criaturas colosales', 'Guerra'],
    director: 'Miguel Sapochnik',
    cast: ['Emma D’Arcy', 'Matt Smith', 'Olivia Cooke'],
    synopsis: 'Dos dinastías milenarias libran una guerra despiadada por el dominio de las tierras altas mientras los últimos dragones ancestrales despiertan de su letargo.',
    backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1920&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
  },
  {
    id: 'berlin-espionaje',
    title: 'Protocolo Berlín: Muro de Sombras',
    originalTitle: 'Berlin Protocol',
    type: 'movie',
    isOriginal: false,
    isTop10: 10,
    year: 2025,
    rating: '16+',
    matchScore: 89,
    duration: '2 h 12 min',
    genres: ['Suspenso', 'Espionaje', 'Acción'],
    tags: ['Inteligente', 'Guerra Fría moderna', 'Giro inesperado'],
    director: 'Tomas Alfredson',
    cast: ['Gary Oldman', 'Colin Firth', 'Tom Hardy'],
    synopsis: 'Un veterano agente de inteligencia británico es sacado de su retiro para descubrir a un topo infiltrado en el MI6 antes de que una cumbre internacional sea saboteada.',
    backdropUrl: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1920&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
  },

  // SECCIÓN INFANTIL / FAMILIAR (KIDS MODE)
  {
    id: 'super-conejo-valiente',
    title: 'Super Conejo y el Bosque Mágico',
    originalTitle: 'Super Bunny: Enchanted Forest',
    type: 'movie',
    isKids: true,
    isOriginal: true,
    year: 2026,
    rating: 'Kids',
    matchScore: 99,
    duration: '1 h 28 min',
    genres: ['Infantil', 'Animación', 'Aventura'],
    tags: ['Divertido', 'Tierno', 'Colorido'],
    director: 'Pete Docter',
    cast: ['Voces: Diego Jr', 'Vicky Vicky', 'Tom Hanks'],
    synopsis: '¡Un conejito con una capa mágica emprende una divertida misión para rescatar a las zanahorias doradas del bosque de las garras de un travieso erizo glotón!',
    backdropUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1920&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  },
  {
    id: 'escuadron-galactico-junior',
    title: 'Escuadrón Galáctico Junior',
    originalTitle: 'Galactic Kids Squad',
    type: 'series',
    isKids: true,
    isOriginal: true,
    year: 2026,
    rating: 'Kids',
    matchScore: 98,
    duration: '2 Temporadas',
    genres: ['Infantil', 'Animación', 'Ciencia Ficción'],
    tags: ['Alegre', 'Didáctico', 'Creativo'],
    director: 'Brad Bird',
    cast: ['Voces en Español', 'Animación 4K'],
    synopsis: 'Tres pequeños astronautas viajan por el sistema solar resolviendo acertijos matemáticos y salvando planetas de divertidos meteoritos de colores.',
    backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  },
  {
    id: 'el-misterio-de-los-dinosaurios',
    title: 'Pequeños Exploradores: Reino Dino',
    originalTitle: 'Little Explorers Dino World',
    type: 'movie',
    isKids: true,
    isOriginal: false,
    year: 2025,
    rating: 'Kids',
    matchScore: 95,
    duration: '1 h 35 min',
    genres: ['Infantil', 'Animación', 'Familiar'],
    tags: ['Aventura', 'Dinosaurios', 'Didáctico'],
    director: 'Don Hall',
    cast: ['Voces de Aventura'],
    synopsis: 'Un grupo de niños curiosos construye una máquina del tiempo de cartón y termina en la era jurásica haciendo amistad con un simpático triceratops.',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
  },

  // MÁS TÍTULOS DE ACCIÓN Y CIENCIA FICCIÓN
  {
    id: 'cazadores-del-abismo',
    title: 'Cazadores del Abismo Oceánico',
    originalTitle: 'Abyss Hunters',
    type: 'movie',
    isOriginal: false,
    year: 2025,
    rating: '16+',
    matchScore: 92,
    duration: '2 h 04 min',
    genres: ['Acción', 'Ciencia Ficción', 'Terror Acuático'],
    tags: ['Claustrofóbico', 'Monstruos marinos', 'Frenético'],
    director: 'James Cameron',
    cast: ['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver'],
    synopsis: 'A 11.000 metros de profundidad en la Fosa de las Marianas, una estación minera despierta a una especie prehistórica biomecánica sepultada por milenios.',
    backdropUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1920&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
  },
  {
    id: 'gambito-cuantico',
    title: 'Gambito Cuántico: La Partida Final',
    originalTitle: 'Quantum Gambit',
    type: 'series',
    isOriginal: true,
    year: 2026,
    rating: '16+',
    matchScore: 94,
    duration: '1 Temporada',
    genres: ['Drama', 'Suspenso', 'Intriga'],
    tags: ['Magistral', 'Psicológico', 'Intenso'],
    director: 'Scott Frank',
    cast: ['Anya Taylor-Joy', 'Bill Camp', 'Harry Melling'],
    synopsis: 'Una prodigio del ajedrez descubre que cada movimiento en el tablero predice eventos de los mercados globales y conspiraciones mundiales.',
    backdropUrl: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=1920&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4'
  },
  {
    id: 'furia-desierto',
    title: 'Mad Wasteland: Furia en el Desierto',
    originalTitle: 'Mad Wasteland: Chromium',
    type: 'movie',
    isOriginal: false,
    year: 2024,
    rating: '18+',
    matchScore: 96,
    duration: '2 h 00 min',
    genres: ['Acción', 'Post-apocalíptico', 'Aventura'],
    tags: ['Explosiones', 'Combate en vehículos', 'Salvaje'],
    director: 'George Miller',
    cast: ['Tom Hardy', 'Charlize Theron', 'Nicholas Hoult'],
    synopsis: 'En un páramo desértico sin ley donde el agua y la gasolina valen más que la vida, una guerrera rebelde lidera un convoy acorazado contra un tirano despiadado.',
    backdropUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1920&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4'
  }
];

const categories = [
  {
    id: 'continue-watching',
    title: 'Continuar viendo para Diego',
    filter: (t) => t.progressPercent !== undefined,
    showProgress: true
  },
  {
    id: 'top-10',
    title: 'Los 10 más populares en tu país hoy',
    filter: (t) => t.isTop10 !== undefined,
    isTop10Layout: true
  },
  {
    id: 'trending',
    title: 'Tendencias ahora',
    filter: (t) => t.matchScore >= 94 && !t.isKids
  },
  {
    id: 'originals',
    title: 'Solo en AzFlix (Originales)',
    filter: (t) => t.isOriginal === true && !t.isKids,
    isTall: true
  },
  {
    id: 'action',
    title: 'Películas y series de acción electrizantes',
    filter: (t) => t.genres.includes('Acción') && !t.isKids
  },
  {
    id: 'scifi',
    title: 'Ciencia ficción, cyberpunk y universos alternos',
    filter: (t) => (t.genres.includes('Ciencia Ficción') || t.genres.includes('Cyberpunk')) && !t.isKids
  },
  {
    id: 'kids-family',
    title: 'Diversión para toda la familia y niños',
    filter: (t) => t.isKids === true || t.genres.includes('Familiar')
  }
];

const profiles = [
  {
    id: 'diego',
    name: 'Diego',
    isKids: false,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    accentColor: '#E50914'
  },
  {
    id: 'kids',
    name: 'Niños (Diego Jr)',
    isKids: true,
    avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&q=80',
    accentColor: '#F59E0B'
  },
  {
    id: 'vicky',
    name: 'Vicky',
    isKids: false,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    accentColor: '#8B5CF6'
  }
];

const notifications = [
  {
    id: 'notif-1',
    title: '¡Nueva temporada disponible!',
    subtitle: 'Stranger Codes: La Brecha Temporada 3 ya está completa.',
    time: 'Hace 2 horas',
    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=100&q=80'
  },
  {
    id: 'notif-2',
    title: 'Top 10 Nacional',
    subtitle: 'Cyberpunk: Sombras de Neón es la #1 más vista hoy.',
    time: 'Ayer',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=100&q=80'
  },
  {
    id: 'notif-3',
    title: 'Recomendado para ti',
    subtitle: 'Dinastía Az tiene nuevos episodios semanales.',
    time: 'Hace 3 días',
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=100&q=80'
  }
];

module.exports = {
  titles,
  categories,
  profiles,
  notifications
};
