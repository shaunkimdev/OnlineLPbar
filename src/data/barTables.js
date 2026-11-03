// 2-Person & 4-Person Tables with dedicated 3D Turntables in the LP Bar

export const BAR_TABLES = [
  // ================= 2인석 테이블 (4개) =================
  {
    id: 'table-a1',
    code: 'Table A-1',
    name: '창가 2인석 테이블 A-1',
    capacity: 2,
    typeLabel: '2인석 테이블 · 전용 턴테이블',
    desc: '빗방울 맺힌 통창 너머로 도시 야경이 보이는 아늑한 2인석',
    position: { x: -10.5, z: -2.2 },
    currentLP: null,
    isPlaying: false,
    rpm: 33
  },
  {
    id: 'table-a2',
    code: 'Table A-2',
    name: '중앙 라운지 2인석 A-2',
    capacity: 2,
    typeLabel: '2인석 테이블 · 전용 턴테이블',
    desc: 'LP 책장과 가까워 디깅 후 바로 음악을 걸기 좋은 2인석',
    position: { x: -3.6, z: -2.2 },
    currentLP: null,
    isPlaying: false,
    rpm: 33
  },
  {
    id: 'table-a3',
    code: 'Table A-3',
    name: '중앙 라운지 2인석 A-3',
    capacity: 2,
    typeLabel: '2인석 테이블 · 전용 턴테이블',
    desc: '따뜻한 황동 펜던트 조명이 비추는 감성 2인석',
    position: { x: 3.6, z: -2.2 },
    currentLP: null,
    isPlaying: false,
    rpm: 33
  },
  {
    id: 'table-a4',
    code: 'Table A-4',
    name: '벽난로 옆 2인석 A-4',
    capacity: 2,
    typeLabel: '2인석 테이블 · 전용 턴테이블',
    desc: '장작 타는 소리와 LP 치지직 소리가 어우러지는 포근한 2인석',
    position: { x: 10.5, z: -2.2 },
    currentLP: null,
    isPlaying: false,
    rpm: 33
  },

  // ================= 4인석 테이블 (4개) =================
  {
    id: 'table-b1',
    code: 'Table B-1',
    name: '창가 4인석 부스 B-1',
    capacity: 4,
    typeLabel: '4인석 테이블 · 하이파이 턴테이블',
    desc: '여유로운 원목 테이블 중앙에 턴테이블이 놓인 창가 4인석',
    position: { x: -10.5, z: 4.6 },
    currentLP: null,
    isPlaying: false,
    rpm: 33
  },
  {
    id: 'table-b2',
    code: 'Table B-2',
    name: '메인 홀 4인석 테이블 B-2',
    capacity: 4,
    typeLabel: '4인석 테이블 · 하이파이 턴테이블',
    desc: '네 명이 둘러앉아 위스키와 함께 음악 이야기를 나누기 좋은 4인석',
    position: { x: -3.6, z: 4.6 },
    currentLP: null,
    isPlaying: false,
    rpm: 33
  },
  {
    id: 'table-b3',
    code: 'Table B-3',
    name: '메인 홀 4인석 테이블 B-3',
    capacity: 4,
    typeLabel: '4인석 테이블 · 하이파이 턴테이블',
    desc: '바 카운터의 은은한 조명이 닿는 중심가 4인석',
    position: { x: 3.6, z: 4.6 },
    currentLP: null,
    isPlaying: false,
    rpm: 33
  },
  {
    id: 'table-b4',
    code: 'Table B-4',
    name: '벽난로 라운지 4인석 B-4',
    capacity: 4,
    typeLabel: '4인석 테이블 · 하이파이 턴테이블',
    desc: '깊은 밤 오래 머물며 앨범 한 장을 통째로 듣기 좋은 4인석',
    position: { x: 10.5, z: 4.6 },
    currentLP: null,
    isPlaying: false,
    rpm: 33
  }
];

export const INITIAL_COASTER_NOTES = [
  {
    id: 'c-1',
    nickname: '을지로디거',
    table: '2인석 A-1',
    lpTitle: 'Waltz for Debby — Bill Evans',
    message: '창밖 빗소리 40%에 치지직 노이즈 70%로 맞춰놓고 빌 에반스 들으니 여기가 천국이네요.',
    time: '오후 10:42'
  },
  {
    id: 'c-2',
    nickname: '도쿄나이트',
    table: '4인석 B-2',
    lpTitle: 'Plastic Love — Mariya Takeuchi',
    message: '시티팝 책장에서 랜덤으로 뽑았는데 바로 최애곡 당첨! 45 RPM으로 돌려보세요.',
    time: '오후 11:15'
  },
  {
    id: 'c-3',
    nickname: '새벽세시',
    table: '2인석 A-4',
    lpTitle: '사랑하기 때문에 — 유재하',
    message: '바늘 내려놓을 때 치지직 소리에 마음까지 차분해집니다. 오늘 하루도 고생 많으셨어요.',
    time: '오전 12:08'
  }
];
