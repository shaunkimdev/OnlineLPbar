// Curated Genre Shelves & Popular Vinyl Records for MIDNIGHT GROOVE LP BAR

export const GENRE_SHELVES = [
  {
    id: 'jazz',
    code: 'SHELF 01',
    name: 'JAZZ & BLUE NOTE',
    koName: '재즈 & 블루노트',
    subtitle: '깊은 밤 위스키 온더락과 가장 잘 어울리는 스모키 재즈 명반',
    accent: '#d99b4e',
    woodColor: 0x4a2e1b,
    position: { x: -12.5, z: -10.8 },
    records: [
      {
        id: 'jazz-1',
        title: 'Waltz for Debby',
        artist: 'Bill Evans Trio',
        year: 1961,
        rpm: 33,
        tags: ['Cool Jazz', 'Piano Trio', 'Village Vanguard'],
        youtubeId: 'dH3GSrCmzC8',
        palette: ['#1b2432', '#d4a359', '#f4ead5'],
        motif: 'piano-waves',
        synth: { style: 'jazz-waltz', bpm: 84, root: 60, prog: [[0, 4, 7, 11], [5, 9, 12, 16], [2, 5, 9, 12], [7, 11, 14, 17]] },
        desc: '뉴욕 빌리지 뱅가드 클럽의 잔 부딪히는 소리와 빌 에반스의 서정적인 피아노 터치가 그대로 담긴 불멸의 라이브 LP입니다.'
      },
      {
        id: 'jazz-2',
        title: 'Chet Baker Sings',
        artist: 'Chet Baker',
        year: 1954,
        rpm: 33,
        tags: ['West Coast Jazz', 'Vocal Jazz', 'Trumpet'],
        youtubeId: '3zrSoHgAAWo',
        palette: ['#182936', '#588bae', '#f2e8dc'],
        motif: 'spotlight',
        synth: { style: 'slow-ballad', bpm: 72, root: 58, prog: [[0, 3, 7, 10], [5, 8, 12, 15], [2, 5, 9, 12], [7, 10, 14, 17]] },
        desc: '달빛처럼 나른하고 중성적인 보컬과 트럼펫 솔로. My Funny Valentine이 흐르면 바 전체의 공기가 차분하게 가라앉습니다.'
      },
      {
        id: 'jazz-3',
        title: 'Kind of Blue',
        artist: 'Miles Davis',
        year: 1959,
        rpm: 33,
        tags: ['Modal Jazz', 'Trumpet', 'Masterpiece'],
        youtubeId: 'ylXk1LBvIqU',
        palette: ['#0d1f33', '#2e6da4', '#e8c574'],
        motif: 'blue-circles',
        synth: { style: 'modal-jazz', bpm: 78, root: 62, prog: [[0, 3, 7, 10, 14], [0, 3, 7, 10, 14], [1, 4, 8, 11, 15], [0, 3, 7, 10, 14]] },
        desc: '재즈 역사상 가장 많이 팔린 명반. So What과 Blue in Green의 서늘하고도 따뜻한 트럼펫 울림을 LP로 감상해보세요.'
      },
      {
        id: 'jazz-4',
        title: 'Scenery',
        artist: 'Ryo Fukui',
        year: 1976,
        rpm: 33,
        tags: ['Japanese Jazz', 'Hard Bop', 'Sapporo'],
        youtubeId: 'Hrr3dp7zRQY',
        palette: ['#8c2318', '#f2c48d', '#241915'],
        motif: 'horizon-sun',
        synth: { style: 'upbeat-jazz', bpm: 108, root: 65, prog: [[0, 4, 7, 11], [9, 12, 16, 19], [2, 5, 9, 12], [7, 11, 14, 17]] },
        desc: '훗카이도 삿포로의 재즈 클럽 Slowboat의 온기를 담은 일본 재즈 피아노의 보석 같은 앨범입니다.'
      },
      {
        id: 'jazz-5',
        title: 'Midnight Blue',
        artist: 'Kenny Burrell',
        year: 1963,
        rpm: 33,
        tags: ['Soul Jazz', 'Blue Note', 'Jazz Guitar'],
        youtubeId: 'v5eynAM_bbw',
        palette: ['#0b1e3d', '#1e56a0', '#d6e4f0'],
        motif: 'stripes',
        synth: { style: 'blues-groove', bpm: 76, root: 57, prog: [[0, 3, 7, 10], [5, 8, 12, 15], [0, 3, 7, 10], [7, 10, 14, 17]] },
        desc: '블루노트 레이블을 상징하는 푸른 밤의 블루스 기타 연주. 치지직거리는 바늘 소리와 기타 톤의 궁합이 완벽합니다.'
      },
      {
        id: 'jazz-6',
        title: 'Getz / Gilberto',
        artist: 'Stan Getz & João Gilberto',
        year: 1964,
        rpm: 33,
        tags: ['Bossa Nova', 'Saxophone', 'Warm Breeze'],
        youtubeId: 'c5QfXjsoNe4',
        palette: ['#d96b27', '#f2b705', '#1e1e1e'],
        motif: 'abstract-block',
        synth: { style: 'bossa', bpm: 96, root: 65, prog: [[0, 4, 7, 11, 14], [2, 6, 9, 12], [2, 5, 9, 12], [1, 5, 8, 11]] },
        desc: '부드러운 색소폰과 보사노바 리듬이 어우러진 The Girl from Ipanema 수록 음반입니다.'
      }
    ]
  },
  {
    id: 'citypop',
    code: 'SHELF 02',
    name: 'CITY POP & 80s GROOVE',
    koName: '시티팝 & 80s 그루브',
    subtitle: '네온사인 비치는 도쿄의 밤거리를 달리는 경쾌하고 낭만적인 아날로그 신스 & 펑크',
    accent: '#ff6b9d',
    woodColor: 0x522d38,
    position: { x: -7.5, z: -10.8 },
    records: [
      {
        id: 'city-1',
        title: 'Plastic Love (Variety LP)',
        artist: 'Mariya Takeuchi',
        year: 1984,
        rpm: 45,
        tags: ['City Pop', '80s Boogie', 'Tokyo Night'],
        youtubeId: 'T_lC2O1oIew',
        palette: ['#241734', '#ff5e97', '#5ce1e6'],
        motif: 'neon-sunset',
        synth: { style: 'city-pop', bpm: 106, root: 62, prog: [[5, 8, 12, 15], [4, 7, 11, 14], [0, 3, 7, 10], [2, 6, 9, 12]] },
        desc: '시티팝 열풍의 시작점. 쫀득한 슬랩 베이스와 화려한 브라스, 아련한 멜로디가 LP바의 조명을 한층 황홀하게 물들입니다.'
      },
      {
        id: 'city-2',
        title: 'Ride on Time',
        artist: 'Tatsuro Yamashita',
        year: 1980,
        rpm: 33,
        tags: ['City Pop King', 'Funk Groove', 'Vinyl Classic'],
        youtubeId: '9Gj47G2e1Jc',
        palette: ['#0f4c81', '#ff7b54', '#ffd56b'],
        motif: 'horizon-sun',
        synth: { style: 'city-pop', bpm: 112, root: 64, prog: [[0, 4, 7, 11], [5, 9, 12, 16], [7, 11, 14, 17], [4, 7, 11, 14]] },
        desc: '시티팝의 제왕 야마시타 타츠로의 청량한 보컬과 완벽한 레코딩 사운드를 자랑하는 명반입니다.'
      },
      {
        id: 'city-3',
        title: 'Timely!!',
        artist: 'Anri',
        year: 1983,
        rpm: 33,
        tags: ['Summer Groove', 'Synth Funk', 'Bestseller'],
        youtubeId: 'feeg794Cnbc',
        palette: ['#1d70b8', '#f582ae', '#fef6e4'],
        motif: 'palm-waves',
        synth: { style: 'city-pop', bpm: 115, root: 67, prog: [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]] },
        desc: '토시코 카도마츠가 프로듀싱한 시티팝의 교과서. 기분 좋은 리듬이 테이블 위 위스키 잔을 흔듭니다.'
      },
      {
        id: 'city-4',
        title: 'First Light (Mayonaka no Door)',
        artist: 'Miki Matsubara',
        year: 1980,
        rpm: 45,
        tags: ['Stay With Me', 'Soulful City Pop', '45 RPM'],
        youtubeId: 'moR4uw-NWLY',
        palette: ['#2b193d', '#c84b31', '#ecdbba'],
        motif: 'spotlight',
        synth: { style: 'city-pop', bpm: 108, root: 63, prog: [[5, 8, 12, 15], [10, 14, 17, 20], [3, 7, 10, 14], [0, 3, 7, 10]] },
        desc: '"Stay With Me~" 첫 소절이 나오는 순간 모두가 고개를 끄덕이게 되는 마법 같은 시티팝 대표곡입니다.'
      },
      {
        id: 'city-5',
        title: 'Sunshower',
        artist: 'Taeko Ohnuki',
        year: 1977,
        rpm: 33,
        tags: ['Sophisti-Pop', 'Ryuichi Sakamoto', 'Jazz Fusion'],
        youtubeId: 'Q65c6r1sG0E',
        palette: ['#3d405b', '#e07a5f', '#f4f1de'],
        motif: 'stripes',
        synth: { style: 'jazz-waltz', bpm: 98, root: 60, prog: [[0, 4, 7, 11], [2, 5, 9, 12], [4, 7, 11, 14], [9, 12, 16, 19]] },
        desc: '사카모토 류이치가 편곡에 참여한 세련된 도회적 사운드. 구석 2인석 테이블에서 듣기 좋은 감각적인 LP입니다.'
      },
      {
        id: 'city-6',
        title: '춘천 가는 기차 (김현철 1집)',
        artist: '김현철',
        year: 1989,
        rpm: 33,
        tags: ['K-City Pop', 'Korean Groove', '1989 Vinyl'],
        youtubeId: 'wP6v1D_4I8I',
        palette: ['#1a3c40', '#ede6db', '#e48900'],
        motif: 'horizon-sun',
        synth: { style: 'bossa', bpm: 100, root: 65, prog: [[0, 4, 7, 11], [5, 9, 12, 16], [2, 5, 9, 12], [7, 11, 14, 17]] },
        desc: '한국 시티팝과 재즈 퓨전의 효시로 꼽히는 명반. 아련하고 따뜻한 아날로그 질감이 일품입니다.'
      }
    ]
  },
  {
    id: 'lofi',
    code: 'SHELF 03',
    name: 'LO-FI & MIDNIGHT CHILL',
    koName: '로파이 & 심야 칠아웃',
    subtitle: 'LP 치지직 노이즈와 빗소리에 가장 완벽하게 녹아드는 로파이 힙합 & 칠 비츠',
    accent: '#7cd4b8',
    woodColor: 0x263c38,
    position: { x: -2.5, z: -10.8 },
    records: [
      {
        id: 'lofi-1',
        title: 'Modal Soul',
        artist: 'Nujabes',
        year: 2005,
        rpm: 33,
        tags: ['Jazzy Hip-Hop', 'Feather', 'Luv(sic)'],
        youtubeId: 'WrO9PTpuSSs',
        palette: ['#22333b', '#5e8c61', '#eae0d5'],
        motif: 'abstract-block',
        synth: { style: 'lofi-chill', bpm: 88, root: 60, prog: [[0, 3, 7, 10], [5, 8, 12, 15], [10, 14, 17, 21], [7, 10, 14, 17]] },
        desc: '재즈 샘플링과 서정적인 힙합 비트의 정수. 턴테이블 위에서 가장 영롱하게 빛나는 심야의 동반자입니다.'
      },
      {
        id: 'lofi-2',
        title: 'Rainy Evening',
        artist: 'Idealism',
        year: 2017,
        rpm: 33,
        tags: ['Lo-fi Study', 'Rainy Piano', 'Cozy Beats'],
        youtubeId: '5qap5aO4i9A',
        palette: ['#1d2d44', '#748cab', '#f0ebd8'],
        motif: 'piano-waves',
        synth: { style: 'lofi-chill', bpm: 74, root: 58, prog: [[0, 3, 7, 10], [8, 12, 15, 19], [5, 8, 12, 15], [7, 10, 14, 17]] },
        desc: '창밖 빗소리와 바늘의 치지직거리는 소리가 하나가 되는 먹먹한 로파이 피아노 연주곡입니다.'
      },
      {
        id: 'lofi-3',
        title: 'Con Todo El Mundo',
        artist: 'Khruangbin',
        year: 2018,
        rpm: 33,
        tags: ['Psychedelic Groove', 'Warm Bass', 'Chill Lounge'],
        youtubeId: 'q4xKvHANqjk',
        palette: ['#3c1642', '#086375', '#f7b801'],
        motif: 'horizon-sun',
        synth: { style: 'blues-groove', bpm: 86, root: 62, prog: [[0, 3, 7, 10], [5, 8, 12, 15], [0, 3, 7, 10], [2, 5, 9, 12]] },
        desc: '리버브 가득한 기타와 묵직한 베이스 라인이 몽환적인 공간감을 만들어내는 텍사스 트리오의 명반입니다.'
      },
      {
        id: 'lofi-4',
        title: 'French Kiwi Juice',
        artist: 'FKJ',
        year: 2017,
        rpm: 33,
        tags: ['Nu-Jazz', 'Rhodes Piano', 'French Touch'],
        youtubeId: 'sCNlt5nvSI8',
        palette: ['#2b2d42', '#ef233c', '#edf2f4'],
        motif: 'palm-waves',
        synth: { style: 'lofi-chill', bpm: 82, root: 63, prog: [[0, 4, 7, 11], [9, 12, 16, 19], [2, 5, 9, 12], [7, 11, 14, 17]] },
        desc: '로즈 일렉트릭 피아노와 색소폰 루프가 물 흐르듯 이어지는 감각적인 라운지 사운드입니다.'
      },
      {
        id: 'lofi-5',
        title: 'Freeform Jazz',
        artist: 'Uyama Hiroto',
        year: 2016,
        rpm: 33,
        tags: ['Spiritual Lo-fi', 'Sax & Piano', 'Hydeout'],
        youtubeId: 'M8RtI9393mQ',
        palette: ['#1b1b1e', '#a9bcd0', '#d8dbe2'],
        motif: 'blue-circles',
        synth: { style: 'modal-jazz', bpm: 84, root: 60, prog: [[0, 3, 7, 10, 14], [5, 8, 12, 15], [2, 5, 9, 12], [7, 10, 14, 17]] },
        desc: '누자베스의 음악적 동지 우야마 히로토가 빚어낸 동양적이고도 깊은 서정의 재즈 힙합 앨범입니다.'
      },
      {
        id: 'lofi-6',
        title: 'Harbor LP',
        artist: 'Tomppabeats',
        year: 2016,
        rpm: 45,
        tags: ['Vinyl Crackle', 'Short Loops', 'Warm Tape'],
        youtubeId: 'ptrIne381vI',
        palette: ['#3d5a80', '#ee6c4d', '#e0fbfc'],
        motif: 'neon-sunset',
        synth: { style: 'lofi-chill', bpm: 78, root: 65, prog: [[0, 4, 7, 11], [5, 9, 12, 16], [2, 5, 9, 12], [7, 10, 14, 17]] },
        desc: '따뜻한 테이프 히스와 보사노바 기타 샘플이 가득 담긴 아기자기한 로파이 명반입니다.'
      }
    ]
  },
  {
    id: 'rocksoul',
    code: 'SHELF 04',
    name: 'CLASSIC ROCK & SOUL',
    koName: '클래식 록 & 빈티지 소울',
    subtitle: '진공관 앰프와 턴테이블의 진가를 일깨우는 70~90년대 록 & 소울 그루브',
    accent: '#e86f52',
    woodColor: 0x4b241c,
    position: { x: 2.5, z: -10.8 },
    records: [
      {
        id: 'rock-1',
        title: 'The Dark Side of the Moon',
        artist: 'Pink Floyd',
        year: 1973,
        rpm: 33,
        tags: ['Progressive Rock', 'Prism Vinyl', 'Audiophile'],
        youtubeId: 'k9ynZnEBtvw',
        palette: ['#0b0c10', '#45a29e', '#ff6b6b'],
        motif: 'prism',
        synth: { style: 'space-rock', bpm: 72, root: 59, prog: [[0, 3, 7, 10], [5, 9, 12, 16], [0, 3, 7, 10], [5, 9, 12, 16]] },
        desc: 'LP 바의 대형 혼 스피커로 들을 때 압도적인 공간감을 선사하는 전설의 프리즘 앨범입니다.'
      },
      {
        id: 'rock-2',
        title: 'Love Deluxe',
        artist: 'Sade',
        year: 1992,
        rpm: 33,
        tags: ['Smooth Soul', 'No Ordinary Love', 'Velvet Vocal'],
        youtubeId: '_WcWHZc8s2I',
        palette: ['#23192d', '#b88b4a', '#e6dcd2'],
        motif: 'spotlight',
        synth: { style: 'slow-ballad', bpm: 80, root: 57, prog: [[0, 3, 7, 10], [10, 14, 17, 21], [5, 8, 12, 15], [7, 10, 14, 17]] },
        desc: '샤데이의 고혹적이고 나지막한 보이스. 밤 11시 이후 4인석 부스 테이블에서 가장 많이 신청되는 앨범입니다.'
      },
      {
        id: 'rock-3',
        title: 'What’s Going On',
        artist: 'Marvin Gaye',
        year: 1971,
        rpm: 33,
        tags: ['Motown Soul', 'Warm Bass', '70s Classic'],
        youtubeId: 'H-kA3UtBj4M',
        palette: ['#2c1810', '#c87d55', '#f3e9dc'],
        motif: 'horizon-sun',
        synth: { style: 'blues-groove', bpm: 94, root: 64, prog: [[0, 4, 7, 11], [9, 12, 16, 19], [2, 5, 9, 12], [7, 11, 14, 17]] },
        desc: '모타운 특유의 풍성한 현악기와 제임스 제머슨의 베이스라인이 온몸을 감싸는 소울 역사상 최고의 명반입니다.'
      },
      {
        id: 'rock-4',
        title: 'Rumours',
        artist: 'Fleetwood Mac',
        year: 1977,
        rpm: 33,
        tags: ['Soft Rock', 'Dreams', 'Analog Warmth'],
        youtubeId: 'mrZRURcb1cM',
        palette: ['#1c1917', '#d6c7b2', '#9a7b4f'],
        motif: 'blue-circles',
        synth: { style: 'city-pop', bpm: 102, root: 65, prog: [[0, 4, 7, 11], [2, 6, 9, 12], [0, 4, 7, 11], [2, 6, 9, 12]] },
        desc: 'Dreams의 몽환적인 드럼 비트와 어쿠스틱 사운드는 바이닐 레코드로 들을 때 가장 빛을 발합니다.'
      },
      {
        id: 'rock-5',
        title: 'Brothers in Arms',
        artist: 'Dire Straits',
        year: 1985,
        rpm: 33,
        tags: ['Blues Rock', 'Guitar Tone', 'Audiophile'],
        youtubeId: 'jhdFe3evXpk',
        palette: ['#2b4570', '#7180ac', '#e4dfda'],
        motif: 'stripes',
        synth: { style: 'space-rock', bpm: 76, root: 56, prog: [[0, 3, 7, 10], [8, 12, 15, 19], [5, 8, 12, 15], [7, 10, 14, 17]] },
        desc: '마크 노플러의 핑거스타일 기타 톤이 밤공기를 가르는 오디오파일 필수 청음 LP입니다.'
      },
      {
        id: 'rock-6',
        title: 'Abbey Road',
        artist: 'The Beatles',
        year: 1969,
        rpm: 33,
        tags: ['British Rock', 'Something', 'Here Comes The Sun'],
        youtubeId: 'KQetemT1sWc',
        palette: ['#1d3557', '#a8dadc', '#f1faee'],
        motif: 'stripes',
        synth: { style: 'upbeat-jazz', bpm: 96, root: 69, prog: [[0, 4, 7, 11], [5, 9, 12, 16], [2, 6, 9, 12], [7, 11, 14, 17]] },
        desc: '비틀즈 후기 아날로그 녹음 기술의 결정체. 누구와 함께 앉아 들어도 미소 짓게 만드는 영원한 클래식입니다.'
      }
    ]
  },
  {
    id: 'kvinyl',
    code: 'SHELF 05',
    name: 'K-VINYL & INDIE',
    koName: '한국 명반 & 감성 인디',
    subtitle: '유재하·김광석부터 검정치마·백예린까지, 아날로그 감성을 자극하는 한국 바이닐',
    accent: '#c59bf0',
    woodColor: 0x3b2c47,
    position: { x: 7.5, z: -10.8 },
    records: [
      {
        id: 'k-1',
        title: '사랑하기 때문에',
        artist: '유재하',
        year: 1987,
        rpm: 33,
        tags: ['한국 대중음악 1위 명반', '지난날', '우울한 편지'],
        youtubeId: 'aA1yF2bN9Zk',
        palette: ['#2c2523', '#b8967d', '#efe6dd'],
        motif: 'spotlight',
        synth: { style: 'slow-ballad', bpm: 74, root: 60, prog: [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]] },
        desc: '단 한 장의 앨범으로 한국 대중음악사의 별이 된 유재하. LP 바늘이 내려앉을 때 흐르는 현악 도입부가 가슴을 적십니다.'
      },
      {
        id: 'k-2',
        title: '김광석 네번째 (서른 즈음에)',
        artist: '김광석',
        year: 1994,
        rpm: 33,
        tags: ['Folk Classic', 'Acoustic Guitar', 'Harmonicas'],
        youtubeId: 'n3B7O_29zK8',
        palette: ['#28231d', '#9e7649', '#ede3d2'],
        motif: 'piano-waves',
        synth: { style: 'slow-ballad', bpm: 70, root: 62, prog: [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]] },
        desc: '통기타와 하모니카 소리, 그리고 화장기 없는 목소리. 오리지널 LP의 두툼한 중음역대가 살아있는 명반입니다.'
      },
      {
        id: 'k-3',
        title: 'TEAM BABY (Everything)',
        artist: '검정치마 (The Black Skirts)',
        year: 2017,
        rpm: 33,
        tags: ['Dream Pop', 'Indie Rock', 'Everything'],
        youtubeId: 'Aq_gsctWHtQ',
        palette: ['#2b1e3e', '#d46a92', '#f7e1d7'],
        motif: 'neon-sunset',
        synth: { style: 'space-rock', bpm: 72, root: 63, prog: [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]] },
        desc: '"넌 내 모든 거야~" 리버브 가득한 기타 아르페지오가 LP바 천장까지 아스라이 퍼져나갑니다.'
      },
      {
        id: 'k-4',
        title: 'Every letter I sent you.',
        artist: '백예린 (Yerin Baek)',
        year: 2019,
        rpm: 33,
        tags: ['R&B / Lo-fi', 'Square', 'Limited Vinyl'],
        youtubeId: '4iFP_wd6QU8',
        palette: ['#2d4a43', '#e29578', '#edf6f9'],
        motif: 'palm-waves',
        synth: { style: 'city-pop', bpm: 98, root: 65, prog: [[0, 4, 7, 11], [2, 5, 9, 12], [9, 12, 16, 19], [7, 10, 14, 17]] },
        desc: '구하기 힘든 한정판 LP로도 유명한 앨범. 따뜻하고 포근한 음색이 2인석 테이블의 온도를 높여줍니다.'
      },
      {
        id: 'k-5',
        title: '전설 (주저하는 연인들을 위해)',
        artist: '잔나비 (JANNABI)',
        year: 2019,
        rpm: 33,
        tags: ['Vintage Pop', 'Retro Sound', 'Analog Lyricism'],
        youtubeId: 'GpQ22S6t3zU',
        palette: ['#3d2622', '#c9935b', '#f5ebe0'],
        motif: 'horizon-sun',
        synth: { style: 'slow-ballad', bpm: 78, root: 67, prog: [[0, 4, 7, 11], [4, 7, 11, 14], [9, 12, 16, 19], [5, 9, 12, 16]] },
        desc: '처음부터 아날로그 테이프와 LP 사운드를 염두에 두고 만들어진 서정적인 밤의 노래입니다.'
      },
      {
        id: 'k-6',
        title: '23 (TOMBOY)',
        artist: '혁오 (HYUKOH)',
        year: 2017,
        rpm: 33,
        tags: ['Indie Band', 'Tomboy', 'Youth Anthem'],
        youtubeId: 'pC6tPEaAiYU',
        palette: ['#1c1c1c', '#d90429', '#edf2f4'],
        motif: 'abstract-block',
        synth: { style: 'space-rock', bpm: 76, root: 60, prog: [[0, 4, 7], [4, 7, 11], [5, 9, 12], [7, 11, 14]] },
        desc: '젊은 날의 방황과 낭만을 담은 록 발라드. 후반부 드럼과 코러스가 터져 나올 때의 전율을 느껴보세요.'
      }
    ]
  },
  {
    id: 'cinema',
    code: 'SHELF 06',
    name: 'CINEMA OST & NOCTURNE',
    koName: '영화 음악 & 심야 노턴',
    subtitle: '한 편의 영화 속 주인공이 된 듯한 사운드트랙과 깊은 밤의 피아노 노턴',
    accent: '#e2b857',
    woodColor: 0x3d3020,
    position: { x: 12.5, z: -10.8 },
    records: [
      {
        id: 'ost-1',
        title: 'In the Mood for Love (화양연화 OST)',
        artist: 'Shigeru Umebayashi',
        year: 2000,
        rpm: 33,
        tags: ['Wong Kar-wai', 'Yumeji’s Theme', 'Cello Waltz'],
        youtubeId: 'BnS9ms0x2kI',
        palette: ['#590d22', '#c9184a', '#ffccd5'],
        motif: 'spotlight',
        synth: { style: 'jazz-waltz', bpm: 76, root: 57, prog: [[0, 3, 7], [5, 8, 12], [7, 11, 14], [0, 3, 7]] },
        desc: '왕가위 감독의 붉은 조명과 자욱한 연기, 첼로 왈츠 선율이 LP바 공간 전체를 영화 속 홍콩으로 바꿉니다.'
      },
      {
        id: 'ost-2',
        title: 'Merry Christmas Mr. Lawrence',
        artist: 'Ryuichi Sakamoto',
        year: 1983,
        rpm: 33,
        tags: ['Piano Classic', 'Cinematic', 'Sakamoto'],
        youtubeId: 'LGs_vGt0MY8',
        palette: ['#1f2421', '#9cc5a1', '#dce1de'],
        motif: 'piano-waves',
        synth: { style: 'lofi-chill', bpm: 84, root: 61, prog: [[5, 8, 12, 15], [0, 3, 7, 10], [2, 5, 9, 12], [7, 10, 14, 17]] },
        desc: '사카모토 류이치의 영롱한 피아노 선율. LP 특유의 미세한 치지직 소리가 더해져 더욱 아련하게 울립니다.'
      },
      {
        id: 'ost-3',
        title: 'La La Land (Original Motion Picture Soundtrack)',
        artist: 'Justin Hurwitz',
        year: 2016,
        rpm: 33,
        tags: ['Mia & Sebastian’s Theme', 'Jazz Musical', 'Blue Hour'],
        youtubeId: 'D30V4x8E56k',
        palette: ['#1d1145', '#6b3fa0', '#f7c873'],
        motif: 'neon-sunset',
        synth: { style: 'jazz-waltz', bpm: 80, root: 62, prog: [[0, 4, 7, 11], [5, 9, 12, 16], [0, 4, 7, 11], [7, 10, 14, 17]] },
        desc: '보랏빛 노을이 내려앉은 재즈바에서 피아노 독주로 시작되는 미아와 세바스찬의 테마를 만나보세요.'
      },
      {
        id: 'ost-4',
        title: 'Cowboy Bebop (Tank! & Space Lion)',
        artist: 'Seatbelts (Yoko Kanno)',
        year: 1998,
        rpm: 45,
        tags: ['Big Band Jazz', 'Space Blues', 'Anime Vinyl'],
        youtubeId: 'gg0aZvaiJjU',
        palette: ['#191923', '#fb8b24', '#f4f4f9'],
        motif: 'abstract-block',
        synth: { style: 'upbeat-jazz', bpm: 120, root: 60, prog: [[0, 3, 7, 10], [5, 8, 12, 15], [7, 10, 14, 17], [0, 3, 7, 10]] },
        desc: '폭발적인 브라스 빅밴드 재즈부터 우주를 유영하는 색소폰 블루스까지 담긴 명작 사운드트랙입니다.'
      },
      {
        id: 'ost-5',
        title: 'Cinema Paradiso (시네마 천국 OST)',
        artist: 'Ennio Morricone',
        year: 1988,
        rpm: 33,
        tags: ['Nostalgia', 'Love Theme', 'Italian Cinema'],
        youtubeId: '1FzVWlArLpI',
        palette: ['#2b2118', '#b08968', '#ede0d4'],
        motif: 'horizon-sun',
        synth: { style: 'slow-ballad', bpm: 68, root: 65, prog: [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]] },
        desc: '엔니오 모리꼬네의 따뜻한 선율이 오래된 영사기 소리와 같은 바이닐 노이즈를 만나 깊은 향수를 불러일으킵니다.'
      },
      {
        id: 'ost-6',
        title: 'Chopin: Nocturnes (Op. 9 No. 2)',
        artist: 'Maurizio Pollini',
        year: 1976,
        rpm: 33,
        tags: ['Classical Vinyl', 'Deutsche Grammophon', 'Night Piano'],
        youtubeId: '9E6b3swbnWg',
        palette: ['#141414', '#f4c430', '#faf3dd'],
        motif: 'blue-circles',
        synth: { style: 'jazz-waltz', bpm: 66, root: 63, prog: [[0, 4, 7, 11], [7, 11, 14, 17], [9, 12, 16, 19], [5, 9, 12, 16]] },
        desc: '노란 도이치 그라모폰 라벨이 돌며 들려주는 쇼팽의 야상곡. 혼자 조용히 사색하기에 더할 나위 없는 LP입니다.'
      }
    ]
  }
];

// Cache for procedurally generated high-res LP cover art data URLs
const coverCache = new Map();

export function getProceduralLPCoverDataURL(lp) {
  if (!lp) return '';
  if (coverCache.has(lp.id)) return coverCache.get(lp.id);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const [bg, mid, light] = lp.palette || ['#1e1b24', '#d99b4e', '#f5ebd6'];

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, bg);
  grad.addColorStop(0.65, bg);
  grad.addColorStop(1, '#09080c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Artwork motif rendering
  ctx.save();
  switch (lp.motif) {
    case 'horizon-sun': {
      ctx.fillStyle = mid;
      ctx.beginPath();
      ctx.arc(256, 250, 125, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bg;
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(100, 265 + i * 20, 312, 6 + i * 2);
      }
      break;
    }
    case 'neon-sunset': {
      const sunGrad = ctx.createLinearGradient(0, 110, 0, 360);
      sunGrad.addColorStop(0, light);
      sunGrad.addColorStop(1, mid);
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(256, 240, 130, 0, Math.PI * 2);
      ctx.fill();
      // Perspective grid lines at bottom
      ctx.strokeStyle = light;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.45;
      for (let y = 340; y < 490; y += 22) {
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(472, y);
        ctx.stroke();
      }
      break;
    }
    case 'prism': {
      // Rainbow beam
      const colors = ['#ff4d4d', '#ff9f1c', '#ffbf69', '#2ec4b6', '#3a86ff', '#8338ec'];
      colors.forEach((c, idx) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(290, 225 + idx * 7);
        ctx.lineTo(500, 250 + idx * 14);
        ctx.lineTo(500, 264 + idx * 14);
        ctx.lineTo(290, 232 + idx * 7);
        ctx.fill();
      });
      // White beam left
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(20, 285);
      ctx.lineTo(215, 240);
      ctx.stroke();
      // Triangle
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.fillStyle = 'rgba(20,25,35,0.85)';
      ctx.beginPath();
      ctx.moveTo(256, 145);
      ctx.lineTo(175, 315);
      ctx.lineTo(337, 315);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'blue-circles': {
      ctx.strokeStyle = mid;
      for (let r = 35; r <= 175; r += 28) {
        ctx.lineWidth = r % 56 === 0 ? 8 : 3;
        ctx.globalAlpha = 0.35 + (r / 300);
        ctx.beginPath();
        ctx.arc(256, 256, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = light;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(256, 256, 22, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'piano-waves': {
      ctx.strokeStyle = mid;
      ctx.lineWidth = 4;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        for (let x = 60; x <= 452; x += 12) {
          const y = 185 + i * 24 + Math.sin((x + i * 35) * 0.03) * 18;
          if (x === 60) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      break;
    }
    case 'spotlight': {
      const spot = ctx.createRadialGradient(256, 230, 10, 256, 230, 180);
      spot.addColorStop(0, light);
      spot.addColorStop(0.5, mid);
      spot.addColorStop(1, 'transparent');
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, 512, 512);
      break;
    }
    case 'stripes': {
      ctx.fillStyle = mid;
      for (let i = 0; i < 7; i++) {
        ctx.globalAlpha = 0.25 + i * 0.1;
        ctx.fillRect(70 + i * 54, 130, 34, 240);
      }
      break;
    }
    case 'palm-waves':
    case 'abstract-block':
    default: {
      ctx.fillStyle = mid;
      ctx.fillRect(85, 145, 210, 210);
      ctx.fillStyle = light;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(325, 265, 95, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
  ctx.restore();

  // Vintage worn sleeve ring mark (subtle vinyl ring wear)
  ctx.strokeStyle = 'rgba(255, 248, 230, 0.08)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(256, 256, 215, 0, Math.PI * 2);
  ctx.stroke();

  // Border frame
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 4;
  ctx.strokeRect(22, 22, 468, 468);

  // Top Stereo / Year stamp
  ctx.fillStyle = light;
  ctx.font = '600 16px "JetBrains Mono", monospace';
  ctx.fillText(`STEREO · ${lp.rpm || 33} RPM`, 42, 56);
  ctx.textAlign = 'right';
  ctx.fillText(String(lp.year || 1980), 470, 56);

  // Bottom Title & Artist Typography
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(10, 10, 14, 0.68)';
  ctx.fillRect(24, 378, 464, 110);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 28px "Cormorant Garamond", "Noto Serif KR", serif';
  const shortTitle = lp.title.length > 24 ? lp.title.slice(0, 22) + '…' : lp.title;
  ctx.fillText(shortTitle, 42, 422);

  ctx.fillStyle = mid;
  ctx.font = '500 20px "Noto Sans KR", sans-serif';
  ctx.fillText(lp.artist, 42, 458);

  const url = canvas.toDataURL('image/png');
  coverCache.set(lp.id, url);
  return url;
}

export function getLPCoverDataURL(lp) {
  if (!lp) return '';
  if (lp.coverImage && typeof lp.coverImage === 'string' && lp.coverImage.trim()) {
    return lp.coverImage.trim();
  }
  return getProceduralLPCoverDataURL(lp);
}

export function findLPById(lpId) {
  for (const shelf of GENRE_SHELVES) {
    const found = shelf.records.find((r) => r.id === lpId);
    if (found) return { lp: found, shelf };
  }
  return null;
}
