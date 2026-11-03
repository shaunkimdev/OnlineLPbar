// User Music Recommendation & Story Service
// Reference implementation adapted from https://github.com/shaunkimdev/yourmusic.git
// Supports:
// 1. Artist / Title smart song search (Korean pronunciation/alias rewrite + iTunes Search API US/JP + Local Catalog + optional Supabase Edge Function)
// 2. Submitting user song recommendations with personal stories (scene), favorite lyric, recommender profile, and mood classification
// 3. Real User Story LP Corner data, mood filtering/recommendation, heart (공감) counter, and 30-sec preview lookup

export const MOOD_CATEGORIES = {
  nostalgic: {
    key: 'nostalgic',
    labelKo: '그리운 · 레트로 밤거리',
    shortKo: '그리운',
    emoji: '🌃',
    color: '#FF6B9D',
    description: '옛 기억, 밤거리, 레트로, 네온사인 회상에 어울리는 분위기',
    keywords: ['그리', '추억', '옛', '레트로', '네온', '시부야', '아련', '향수', 'nostalgic', 'retro']
  },
  uplifting: {
    key: 'uplifting',
    labelKo: '상쾌한 · 드라이브',
    shortKo: '상쾌한',
    emoji: '🌅',
    color: '#FFB088',
    description: '기분 전환, 해안도로 드라이브, 가벼운 설렘에 어울리는 분위기',
    keywords: ['상쾌', '기분전환', '드라이브', '달리', '바람', '가벼', '시원', '청량', 'uplifting', 'drive']
  },
  melancholy: {
    key: 'melancholy',
    labelKo: '쓸쓸한 · 센치한 밤',
    shortKo: '쓸쓸한',
    emoji: '❄️',
    color: '#7DD3FC',
    description: '외로움, 겨울밤, 차분한 슬픔과 사색에 어울리는 분위기',
    keywords: ['쓸쓸', '외로', '우울', '슬프', '겨울', '혼자', '센치', '눈물', '먹먹', 'melancholy', 'lonely']
  },
  summer: {
    key: 'summer',
    labelKo: '여름 · 푸른 해변',
    shortKo: '여름',
    emoji: '🌊',
    color: '#00D4FF',
    description: '바다, 햇살, 여름밤, 수평선 너머 일몰에 어울리는 분위기',
    keywords: ['여름', '바다', '해변', '휴가', '햇살', '수평선', '파도', '오키나와', 'summer', 'beach']
  },
  romantic: {
    key: 'romantic',
    labelKo: '로맨틱 · 설렘과 사랑',
    shortKo: '로맨틱',
    emoji: '🌸',
    color: '#FFB6C1',
    description: '봄날, 사랑, 연인과의 산책, 설레는 순간에 어울리는 분위기',
    keywords: ['사랑', '연애', '설렘', '봄', '벚꽃', '고백', '연인', '데이트', '두근', 'romantic', 'love']
  },
  'late-night': {
    key: 'late-night',
    labelKo: '늦은 밤 · 새벽 감성',
    shortKo: '늦은 밤',
    emoji: '🌙',
    color: '#C084FC',
    description: '자정 이후, 도시 야경, 혼자 깨어 있는 새벽에 어울리는 분위기',
    keywords: ['밤', '새벽', '야경', '자정', '잠', '호텔', '불면', '심야', 'late night', 'midnight']
  },
  warm: {
    key: 'warm',
    labelKo: '따뜻한 · 비와 위로',
    shortKo: '따뜻한',
    emoji: '☕',
    color: '#FCD34D',
    description: '비 오는 날, 오래된 LP 카페, 포근한 위로에 어울리는 분위기',
    keywords: ['따뜻', '포근', '비', '카페', '커피', '위로', '휴식', '나른', '일요일', 'warm', 'rain']
  },
  energetic: {
    key: 'energetic',
    labelKo: '활기찬 · 에너지 충전',
    shortKo: '활기찬',
    emoji: '🌇',
    color: '#FF1493',
    description: '새벽 첫 해, 산책과 러닝, 활기찬 리듬에 어울리는 분위기',
    keywords: ['신나', '활기', '에너지', '운동', '출근', '빠른', '리듬', '춤', '열정', 'energetic', 'energy']
  }
};

export const CONTACT_LABELS = {
  email: '이메일',
  instagram: '인스타그램 ID',
  kakao: '카카오톡 ID',
  phone: '전화번호'
};

// Korean pronunciation / alias dictionary inspired by yourmusic's search-song rewrite rules
const KOREAN_QUERY_REWRITES = [
  { match: ['키스오브라이프', '키오라'], replace: 'KISS OF LIFE' },
  { match: ['스티키'], replace: 'Sticky' },
  { match: ['뉴진스'], replace: 'NewJeans' },
  { match: ['하입보이', '하잎보이'], replace: 'Hype Boy' },
  { match: ['디토'], replace: 'Ditto' },
  { match: ['버블검'], replace: 'Bubble Gum' },
  { match: ['마리야 타케우치', '타케우치 마리야', '다케우치 마리야'], replace: 'Mariya Takeuchi' },
  { match: ['플라스틱 러브', '플라스틱러브'], replace: 'Plastic Love' },
  { match: ['야마시타 타츠로', '타츠로 야마시타'], replace: 'Tatsuro Yamashita' },
  { match: ['라이드 온 타임', '라이드온타임'], replace: 'Ride on Time' },
  { match: ['마츠바라 미키', '미키 마츠바라'], replace: 'Miki Matsubara' },
  { match: ['스테이 위드 미', '스테이위드미', '마요나카노도어'], replace: 'Mayonaka no Door Stay With Me' },
  { match: ['안리'], replace: 'Anri' },
  { match: ['카시오페아'], replace: 'Casiopea' },
  { match: ['아사야케'], replace: 'Asayake' },
  { match: ['검정치마'], replace: 'The Black Skirts' },
  { match: ['안티프리즈'], replace: 'Antifreeze' },
  { match: ['에브리띵'], replace: 'EVERYTHING' },
  { match: ['새소년'], replace: 'SE SO NEON' },
  { match: ['난춘'], replace: 'Nan Chun' },
  { match: ['잔나비'], replace: 'JANNABI' },
  { match: ['주저하는 연인들을 위해'], replace: 'For Lovers Who Hesitate' },
  { match: ['백예린'], replace: 'Yerin Baek' },
  { match: ['스퀘어'], replace: 'Square (2017)' },
  { match: ['아이유'], replace: 'IU' },
  { match: ['밤편지'], replace: 'Through the Night' },
  { match: ['데이식스'], replace: 'DAY6' },
  { match: ['한 페이지가 될 수 있게', '한페이지가될수있게'], replace: 'Time of Our Life' },
  { match: ['예뻤어'], replace: 'You Were Beautiful' },
  { match: ['혁오'], replace: 'HYUKOH' },
  { match: ['톰보이'], replace: 'TOMBOY' },
  { match: ['에스파'], replace: 'aespa' },
  { match: ['르세라핌'], replace: 'LE SSERAFIM' },
  { match: ['아이브'], replace: 'IVE' },
  { match: ['태연'], replace: 'TAEYEON' },
  { match: ['성시경'], replace: 'Sung Si Kyung' },
  { match: ['빌 에반스', '빌에반스'], replace: 'Bill Evans' },
  { match: ['쳇 베이커', '쳇베이커'], replace: 'Chet Baker' },
  { match: ['마일스 데이비스', '마일즈 데이비스'], replace: 'Miles Davis' },
  { match: ['누자베스'], replace: 'Nujabes' },
  { match: ['핑크 플로이드', '핑크플로이드'], replace: 'Pink Floyd' },
  { match: ['비틀즈'], replace: 'The Beatles' },
  { match: ['샤데이'], replace: 'Sade' },
  { match: ['사카모토 류이치', '류이치 사카모토'], replace: 'Ryuichi Sakamoto' }
];

// Initial real-user style stories & recommendations from `yourmusic` (music-data.js) + curated user stories
export const INITIAL_USER_SONGS = [
  {
    id: 'user-ym-1',
    artist: 'Mariya Takeuchi',
    title: 'Plastic Love',
    year: 1984,
    rpm: 45,
    cover: '🌃',
    coverImage: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/1b/bf/7d/1bbf7d0d-fe41-4e4b-29d0-7feb373a9e4c/190295078515.jpg/600x600bb.jpg',
    coverColor: '#FF6B9D',
    mood: 'nostalgic',
    heartCount: 24,
    scene: '한밤중 도쿄 시부야 횡단보도, 네온사인 아래 혼자 걷는 기분. 이어폰에서 베이스 인트로가 시작되자마자 영화 속 주인공이 된 것 같았어요.',
    lyric: '突然のキスや熱いまなざしで (갑작스러운 키스나 뜨거운 눈빛으로)',
    spotifyTrackId: '7rU6Iebxzlvqy5t857bKFq',
    spotifyPreviewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/9d/de/a8/9ddea8ea-2ba4-c29b-2bdc-d411239fe80c/mzaf_15077054009562163230.plus.aac.p.m4a',
    youtubeId: 'T_lC2O1oIew',
    recommender: { name: '유진', age: 28, city: '서울' },
    timeAgo: '오늘 밤 추천',
    palette: ['#241734', '#ff5e97', '#5ce1e6'],
    motif: 'neon-sunset',
    synth: { style: 'city-pop', bpm: 106, root: 62, prog: [[5, 8, 12, 15], [4, 7, 11, 14], [0, 3, 7, 10], [2, 6, 9, 12]] }
  },
  {
    id: 'user-ym-3',
    artist: '검정치마 (The Black Skirts)',
    title: 'Antifreeze',
    year: 2010,
    rpm: 33,
    cover: '❄️',
    coverImage: 'https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/59/85/0b/59850bdc-1a15-bbe8-68b2-63a11e639f22/201_cover.jpg/600x600bb.jpg',
    coverColor: '#7DD3FC',
    mood: 'melancholy',
    heartCount: 31,
    scene: '겨울밤 한강 산책로, 입김이 하얗게 보이는 거리에서 코트 주머니에 손을 넣고 걸을 때 늘 꺼내 듣는 인생곡입니다.',
    lyric: '얼지 말고 있어줘, 우리 둘이 얼어붙지 않게',
    spotifyTrackId: '31JwlIZJjlUzcemnVi8bdO',
    spotifyPreviewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/ad/e2/4e/ade24e58-ceaa-011f-4ff0-60b83b4ce8d3/mzaf_13791806651521067531.plus.aac.p.m4a',
    youtubeId: '7bcX1Z2g79I',
    recommender: { name: '민지', age: 25, city: '부산' },
    timeAgo: '1시간 전',
    palette: ['#182936', '#7DD3FC', '#f2e8dc'],
    motif: 'blue-circles',
    synth: { style: 'space-rock', bpm: 92, root: 60, prog: [[0, 4, 7, 11], [5, 9, 12, 16], [2, 5, 9, 12], [7, 11, 14, 17]] }
  },
  {
    id: 'user-ym-5',
    artist: '새소년 (SE SO NEON)',
    title: '난춘 (亂春)',
    year: 2018,
    rpm: 33,
    cover: '🌸',
    coverImage: 'https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/9d/83/29/9d832953-ab16-06cc-d0e1-3adf8f5f9e11/SESONEON_NANCHUN_3000.jpg/600x600bb.jpg',
    coverColor: '#FFB6C1',
    mood: 'romantic',
    heartCount: 29,
    scene: '벚꽃 흩날리는 봄날 오후, 친구와 한강변 자전거를 타다가 벤치에 앉아 노을을 바라보던 순간이 아직도 생생해요.',
    lyric: '봄이 와도 그곳은 여전한가요, 그대 나를 본다면',
    spotifyTrackId: '320twJYO0LC64eWCuCC5vj',
    spotifyPreviewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c7/86/9f/c7869fc6-f086-ad14-db63-23f1184d7144/mzaf_7645952816921757602.plus.aac.p.m4a',
    youtubeId: 'KsznX5j2oQ0',
    recommender: { name: '재현', age: 24, city: '서울' },
    timeAgo: '2시간 전',
    palette: ['#2b1e3e', '#FFB6C1', '#f7e1d7'],
    motif: 'spotlight',
    synth: { style: 'slow-ballad', bpm: 76, root: 62, prog: [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]] }
  },
  {
    id: 'user-ym-7',
    artist: '잔나비 (JANNABI)',
    title: '주저하는 연인들을 위해',
    year: 2019,
    rpm: 33,
    cover: '☕',
    coverImage: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/fc/a9/b2/fca9b2d4-b1ed-92e8-2e5f-1838d77cbce7/cover-_NEW.jpg/600x600bb.jpg',
    coverColor: '#FCD34D',
    mood: 'warm',
    heartCount: 38,
    scene: '비 오는 날 오래된 골목 LP 카페 창가 자리에서 따뜻한 드립 커피 한 잔을 마시며, 차마 전하지 못한 마음을 노트에 적었던 기억.',
    lyric: '나는 읽기 쉬운 마음이야, 당신도 스윽 훑고 가셔요',
    spotifyTrackId: '5BqwC9kOBbqYkzdOKeXFFk',
    spotifyPreviewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/b1/a4/0a/b1a40a3e-65ca-f51b-3bb9-12145d970895/mzaf_509885747699732949.plus.aac.p.m4a',
    youtubeId: 'GpQ22S6t3zU',
    recommender: { name: '도윤', age: 26, city: '대구' },
    timeAgo: '3시간 전',
    palette: ['#3d2622', '#c9935b', '#f5ebe0'],
    motif: 'horizon-sun',
    synth: { style: 'slow-ballad', bpm: 78, root: 67, prog: [[0, 4, 7, 11], [4, 7, 11, 14], [9, 12, 16, 19], [5, 9, 12, 16]] }
  },
  {
    id: 'user-ym-6',
    artist: 'Miki Matsubara',
    title: 'Stay With Me (真夜中のドア)',
    year: 1980,
    rpm: 45,
    cover: '🌙',
    coverImage: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/4e/96/c5/4e96c53f-0e15-e1f6-e21e-86b85f2e389/PA00204088_0_234545_jacket.jpg/600x600bb.jpg',
    coverColor: '#C084FC',
    mood: 'late-night',
    heartCount: 27,
    scene: '12시가 넘은 야경을 작은 방 창문에서 바라볼 때. 유난히 길었던 하루 끝에 위스키 온더락 한 잔을 따라놓고 들으면 위로가 됩니다.',
    lyric: '真夜中のドアをたたき 帰らないでと泣いた',
    spotifyTrackId: '5DCLkzuWICNar6qn3B393f',
    spotifyPreviewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/e1/28/78/e1287879-74f1-660b-34b7-ad323a612056/mzaf_16413173230631267645.plus.aac.p.m4a',
    youtubeId: 'moR4uw-NWLY',
    recommender: { name: '유나', age: 29, city: '인천' },
    timeAgo: '어제',
    palette: ['#2b193d', '#C084FC', '#ecdbba'],
    motif: 'spotlight',
    synth: { style: 'city-pop', bpm: 108, root: 63, prog: [[5, 8, 12, 15], [10, 14, 17, 20], [3, 7, 10, 14], [0, 3, 7, 10]] }
  },
  {
    id: 'user-ym-4',
    artist: 'Anri',
    title: 'Last Summer Whisper',
    year: 1982,
    rpm: 33,
    cover: '🌊',
    coverImage: 'https://is1-ssl.mzstatic.com/image/thumb/Music/v4/0f/e5/75/0fe575e6-5e01-968d-8e54-30b8400e17ed/FLCF-5036.jpg/600x600bb.jpg',
    coverColor: '#00D4FF',
    mood: 'summer',
    heartCount: 19,
    scene: '여름 끝자락 제주 해변에서 수평선 너머로 붉게 물드는 일몰을 바라볼 때, 바닷바람과 함께 흘러나오던 잊지 못할 멜로디.',
    lyric: 'Last summer whisper, 風になりたい',
    spotifyTrackId: '38LUbz74v3nmP8x0efElw2',
    spotifyPreviewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/8b/32/c5/8b32c59f-2e3e-fac7-e3b5-c62825493559/mzaf_4817514222728919386.plus.aac.p.m4a',
    youtubeId: 'feeg794Cnbc',
    recommender: { name: '소희', age: 27, city: '제주' },
    timeAgo: '어제',
    palette: ['#1d70b8', '#00D4FF', '#fef6e4'],
    motif: 'palm-waves',
    synth: { style: 'city-pop', bpm: 104, root: 65, prog: [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]] }
  },
  {
    id: 'user-ym-2',
    artist: 'Tatsuro Yamashita',
    title: 'Ride on Time',
    year: 1980,
    rpm: 33,
    cover: '🌅',
    coverImage: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/87/52/9c/87529ca3-843f-3cd2-3b64-d6911b64f2e3/4547366494839.jpg/600x600bb.jpg',
    coverColor: '#FFB088',
    mood: 'uplifting',
    heartCount: 21,
    scene: '첫 차를 사고 여름 해변도로를 달리며 창문을 활짝 내렸을 때! 답답했던 기분이 단숨에 날아가던 순간의 사운드트랙이에요.',
    lyric: 'Ride on time 時よ止まれ (시간이여 멈추어라)',
    spotifyTrackId: '',
    spotifyPreviewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/a9/35/c2/a935c29a-698e-15e8-8c70-00bf0b08e3ee/mzaf_3544229620593400074.plus.aac.p.m4a',
    youtubeId: '9Gj47G2e1Jc',
    recommender: { name: 'Hiro', age: 31, city: '도쿄' },
    timeAgo: '2일 전',
    palette: ['#0f4c81', '#ff7b54', '#ffd56b'],
    motif: 'horizon-sun',
    synth: { style: 'city-pop', bpm: 112, root: 64, prog: [[0, 4, 7, 11], [5, 9, 12, 16], [7, 11, 14, 17], [4, 7, 11, 14]] }
  },
  {
    id: 'user-ym-8',
    artist: 'Casiopea',
    title: 'Asayake (朝焼け)',
    year: 1979,
    rpm: 45,
    cover: '🌇',
    coverImage: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/b2/54/db/b254dbdb-0661-034e-7f7a-04fa43231531/4582290414003.jpg/600x600bb.jpg',
    coverColor: '#FF1493',
    mood: 'energetic',
    heartCount: 18,
    scene: '밤샘 작업을 마치고 새벽 5시 반, 빌딩 숲 사이로 첫 해가 떠오를 때 들었던 곡. 다시 시작할 에너지를 줍니다.',
    lyric: '(Instrumental — 새벽빛을 가르는 기타 & 슬랩 베이스)',
    spotifyTrackId: '1yQmKOIJE13EcFPIWQS2Pw',
    spotifyPreviewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/77/48/9c/77489ce8-f440-ad56-616a-5bc9f39520ab/mzaf_168556408365358289.plus.aac.p.m4a',
    youtubeId: 'vKOekWuzk3o',
    recommender: { name: 'Kenji', age: 33, city: '오사카' },
    timeAgo: '2일 전',
    palette: ['#241734', '#FF1493', '#ffd56b'],
    motif: 'neon-sunset',
    synth: { style: 'upbeat-jazz', bpm: 120, root: 64, prog: [[0, 4, 7, 11], [5, 9, 12, 16], [2, 5, 9, 12], [7, 11, 14, 17]] }
  },
  {
    id: 'user-ym-9',
    artist: '백예린 (Yerin Baek)',
    title: 'Square (2017)',
    year: 2019,
    rpm: 33,
    cover: '🍀',
    coverImage: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/ca/58/77/ca5877d9-2e1e-0456-c3b2-7704e423dc70/Every_letter_I_sent_you_3000.jpg/600x600bb.jpg',
    coverColor: '#7cd4b8',
    mood: 'uplifting',
    heartCount: 34,
    scene: '자존감이 바닥나서 힘들었던 시절, 퇴근길 버스 창가에 머리를 기대고 이 노래를 들으며 있는 그대로의 나를 사랑하기로 다짐했어요.',
    lyric: 'Come, take my arms and walk with me',
    spotifyTrackId: '',
    spotifyPreviewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/58/38/01/58380131-0613-470a-df50-366756ad343f/mzaf_299567716638719768.plus.aac.p.m4a',
    youtubeId: '4iFP_wd6QU8',
    recommender: { name: '서연', age: 26, city: '수원' },
    timeAgo: '3일 전',
    palette: ['#2d4a43', '#7cd4b8', '#edf6f9'],
    motif: 'palm-waves',
    synth: { style: 'city-pop', bpm: 98, root: 65, prog: [[0, 4, 7, 11], [2, 5, 9, 12], [9, 12, 16, 19], [7, 10, 14, 17]] }
  },
  {
    id: 'user-ym-10',
    artist: '아이유 (IU)',
    title: '밤편지 (Through the Night)',
    year: 2017,
    rpm: 33,
    cover: '🕯️',
    coverImage: 'https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/94/ec/24/94ec2442-5add-d1ca-5eba-37f1298abfbc/cover_KM0005225_1.jpg/600x600bb.jpg',
    coverColor: '#d99b4e',
    mood: 'late-night',
    heartCount: 42,
    scene: '잠 못 이루는 새벽 두 시, 방 안 스탠드 조명 하나만 켜두고 그리운 사람의 안부를 속으로만 되뇌던 밤에 LP로 들었던 곡입니다.',
    lyric: '이 밤 그날의 반딧불을 당신의 창 가까이 보낼게요',
    spotifyTrackId: '',
    spotifyPreviewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/85/45/de/8545de32-479c-1424-9dce-5694ad9f5235/mzaf_12278878103860208085.plus.aac.p.m4a',
    youtubeId: 'BzYnNdJhZQw',
    recommender: { name: '지훈', age: 30, city: '성남' },
    timeAgo: '4일 전',
    palette: ['#28231d', '#d99b4e', '#ede3d2'],
    motif: 'piano-waves',
    synth: { style: 'slow-ballad', bpm: 72, root: 60, prog: [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]] }
  }
];

const STORAGE_KEY_SONGS = 'midnight_groove_user_songs_v1';
const STORAGE_KEY_HEARTS = 'midnight_groove_user_hearts_v1';
const previewLookupCache = new Map();

function clean(value) {
  return String(value || '').trim();
}

export function getMoodMeta(moodKey) {
  return MOOD_CATEGORIES[moodKey] || MOOD_CATEGORIES.warm;
}

// Convert a user song entry into a full LP record compatible with both User LP Corner & 3D Table Turntables
export function normalizeUserSongToLP(song, idx = 0) {
  const moodKey = MOOD_CATEGORIES[song.mood] ? song.mood : classifySongMood(`${song.scene || ''} ${song.lyric || ''} ${song.title || ''}`);
  const moodMeta = getMoodMeta(moodKey);
  const recommender = song.recommender || {};
  const recLabel = recommender.name
    ? `${recommender.name}${recommender.age ? ` (${recommender.age}세)` : ''}${recommender.city ? ` · ${recommender.city}` : ''}`
    : '익명의 리스너';

  const sceneText = clean(song.scene) || clean(song.desc) || '유저가 소중한 기억과 함께 추천한 인생 LP입니다.';
  const previewUrl = clean(song.spotifyPreviewUrl || song.previewUrl);

  return {
    id: clean(song.id) || `user-lp-${Date.now()}-${idx}`,
    title: clean(song.title) || 'Untitled',
    artist: clean(song.artist) || 'Unknown Artist',
    album: clean(song.album) || '',
    year: song.year || new Date().getFullYear(),
    rpm: song.rpm || 33,
    isUserSong: true,
    cover: clean(song.cover) || moodMeta.emoji,
    coverImage: clean(song.coverImage || song.cover_image),
    coverColor: clean(song.coverColor || song.cover_color) || moodMeta.color,
    mood: moodKey,
    moodLabel: moodMeta.labelKo,
    moodEmoji: moodMeta.emoji,
    heartCount: Number(song.heartCount ?? song.heart_count ?? 0),
    scene: sceneText,
    desc: sceneText,
    lyric: clean(song.lyric),
    spotifyTrackId: clean(song.spotifyTrackId || song.spotify_track_id),
    spotifyPreviewUrl: previewUrl,
    previewUrl,
    youtubeId: clean(song.youtubeId),
    recommender: {
      name: clean(recommender.name || song.recommender_name),
      age: recommender.age || song.recommender_age || '',
      city: clean(recommender.city || song.recommender_city)
    },
    recommenderLabel: recLabel,
    timeAgo: clean(song.timeAgo) || '방금 추천됨',
    tags: [
      `${moodMeta.emoji} ${moodMeta.shortKo}`,
      `💌 ${recLabel}`,
      ...(song.lyric ? ['♪ 가사 수록'] : [])
    ],
    palette: song.palette || ['#22182b', moodMeta.color, '#f5ebe0'],
    motif: song.motif || 'neon-sunset',
    synth: song.synth || {
      style: moodKey === 'energetic' || moodKey === 'uplifting' ? 'city-pop' : 'lofi-chill',
      bpm: moodKey === 'energetic' ? 110 : 84,
      root: 62,
      prog: [[0, 4, 7, 11], [5, 9, 12, 16], [2, 5, 9, 12], [7, 11, 14, 17]]
    }
  };
}

// Rule-based mood classification from yourmusic
export function classifySongMood(input) {
  const text = clean(input).toLowerCase();
  if (!text) return 'warm';

  let bestKey = 'warm';
  let bestScore = 0;

  Object.entries(MOOD_CATEGORIES).forEach(([key, meta]) => {
    const score = meta.keywords.reduce(
      (sum, kw) => sum + (text.includes(kw.toLowerCase()) ? 1 : 0),
      0
    );
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  });

  return bestKey;
}

export function loadSavedHeartState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HEARTS);
    if (!raw) return { counts: {}, clickedIds: {} };
    const parsed = JSON.parse(raw);
    return {
      counts: parsed.counts || {},
      clickedIds: parsed.clickedIds || {}
    };
  } catch {
    return { counts: {}, clickedIds: {} };
  }
}

export function saveHeartState(state) {
  try {
    localStorage.setItem(STORAGE_KEY_HEARTS, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function loadUserRecommendedSongs() {
  const heartState = loadSavedHeartState();
  let customSaved = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SONGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) customSaved = parsed;
    }
  } catch {
    customSaved = [];
  }

  const combined = [...customSaved, ...INITIAL_USER_SONGS];
  const seen = new Set();
  const normalized = [];

  combined.forEach((item, idx) => {
    const lp = normalizeUserSongToLP(item, idx);
    if (seen.has(lp.id)) return;
    seen.add(lp.id);
    if (heartState.counts[lp.id] !== undefined) {
      lp.heartCount = Number(heartState.counts[lp.id]);
    }
    normalized.push(lp);
  });

  return normalized;
}

export function persistCustomUserSong(newSongLP) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SONGS);
    const list = raw ? JSON.parse(raw) : [];
    const filtered = Array.isArray(list) ? list.filter((s) => s.id !== newSongLP.id) : [];
    filtered.unshift(newSongLP);
    localStorage.setItem(STORAGE_KEY_SONGS, JSON.stringify(filtered.slice(0, 60)));
  } catch {
    // ignore storage errors
  }
}

// Expand Korean artist/title queries into English/original search queries (like yourmusic's getSearchRewrites)
export function buildSearchQueries(artist, title) {
  const cleanA = clean(artist);
  const cleanT = clean(title);
  const rawCombined = [cleanA, cleanT].filter(Boolean).join(' ');

  let rewrittenA = cleanA;
  let rewrittenT = cleanT;
  let rewrittenCombined = rawCombined;
  let usedRewrite = false;

  KOREAN_QUERY_REWRITES.forEach(({ match, replace }) => {
    match.forEach((term) => {
      if (cleanA.includes(term)) {
        rewrittenA = rewrittenA.replace(term, replace);
        usedRewrite = true;
      }
      if (cleanT.includes(term)) {
        rewrittenT = rewrittenT.replace(term, replace);
        usedRewrite = true;
      }
      if (rewrittenCombined.includes(term)) {
        rewrittenCombined = rewrittenCombined.replace(term, replace);
        usedRewrite = true;
      }
    });
  });

  const candidates = [
    cleanA && cleanT ? `${cleanA} ${cleanT}` : '',
    rewrittenA && rewrittenT ? `${rewrittenA} ${rewrittenT}` : '',
    rewrittenCombined,
    cleanT,
    rewrittenT,
    cleanA,
    rewrittenA
  ]
    .map(clean)
    .filter(Boolean);

  const unique = [];
  const seen = new Set();
  candidates.forEach((q) => {
    const k = q.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      unique.push(q);
    }
  });

  return { queries: unique, usedRewrite };
}

function mapItunesItem(item) {
  const artwork =
    typeof item.artworkUrl100 === 'string'
      ? item.artworkUrl100.replace('100x100bb', '600x600bb')
      : '';
  const releaseYear = item.releaseDate ? new Date(item.releaseDate).getFullYear() : new Date().getFullYear();

  return {
    id: `itunes:${item.trackId}`,
    artist: clean(item.artistName) || 'Unknown Artist',
    title: clean(item.trackName) || 'Untitled',
    album: clean(item.collectionName) || '',
    year: Number.isFinite(releaseYear) ? releaseYear : 1990,
    cover: '🎵',
    coverImage: artwork,
    coverColor: '#C084FC',
    spotifyTrackId: '',
    spotifyPreviewUrl: clean(item.previewUrl),
    previewUrl: clean(item.previewUrl),
    youtubeId: '',
    source: 'itunes'
  };
}

// Search songs across Local Bar Catalog + iTunes Search API (US & JP stores for global/Korean/J-Pop coverage)
export async function searchSongsByArtistAndTitle(artist, title, genreShelves = [], userSongs = [], limit = 8) {
  const cleanA = clean(artist);
  const cleanT = clean(title);
  if (!cleanA && !cleanT) return { songs: [], usedRewrite: false, note: '' };

  const { queries, usedRewrite } = buildSearchQueries(cleanA, cleanT);

  // 1) Local matches from existing Genre Shelves + User Story Songs (carries YouTube IDs & curated metadata)
  const localPool = [
    ...userSongs,
    ...genreShelves.flatMap((s) => s.records || [])
  ];

  const tokens = queries
    .flatMap((q) => q.toLowerCase().split(/\s+/))
    .filter((t) => t.length >= 1);

  const rawTokens = `${cleanA} ${cleanT}`
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const localMatches = localPool
    .filter((item) => {
      const hay = `${item.artist || ''} ${item.title || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
      return (
        rawTokens.every((tk) => hay.includes(tk)) ||
        queries.some((q) => hay.includes(q.toLowerCase()))
      );
    })
    .map((item) => ({
      id: item.id,
      artist: item.artist,
      title: item.title,
      album: item.album || '',
      year: item.year || 1985,
      cover: item.cover || '💿',
      coverImage: item.coverImage || '',
      coverColor: item.coverColor || '#d99b4e',
      spotifyTrackId: item.spotifyTrackId || '',
      spotifyPreviewUrl: item.spotifyPreviewUrl || item.previewUrl || '',
      previewUrl: item.previewUrl || item.spotifyPreviewUrl || '',
      youtubeId: item.youtubeId || '',
      source: 'catalog'
    }));

  // 2) Live iTunes Search API (US store + JP store in parallel so K-Pop, Pop, Jazz, and City Pop all resolve)
  const itunesResults = [];
  const primaryQueries = queries.slice(0, 2);

  try {
    const fetchJobs = [];
    for (const q of primaryQueries) {
      for (const country of ['US', 'JP']) {
        const url = new URL('https://itunes.apple.com/search');
        url.searchParams.set('term', q);
        url.searchParams.set('entity', 'song');
        url.searchParams.set('limit', '6');
        url.searchParams.set('country', country);
        fetchJobs.push(
          fetch(url.toString())
            .then((r) => (r.ok ? r.json() : { results: [] }))
            .then((data) => (data.results || []).map(mapItunesItem))
            .catch(() => [])
        );
      }
    }

    const batches = await Promise.all(fetchJobs);
    batches.forEach((batch) => itunesResults.push(...batch));
  } catch {
    // ignore network errors and rely on localMatches
  }

  // Merge & deduplicate by artist|title, enriching local matches with iTunes coverImage & previewUrl
  const mergedMap = new Map();

  [...localMatches, ...itunesResults].forEach((song) => {
    const a = clean(song.artist);
    const t = clean(song.title);
    if (!a && !t) return;
    const key = `${a}|${t}`.toLowerCase();

    if (!mergedMap.has(key)) {
      mergedMap.set(key, { ...song });
    } else {
      const existing = mergedMap.get(key);
      if (!existing.coverImage && song.coverImage) existing.coverImage = song.coverImage;
      if (!existing.previewUrl && song.previewUrl) {
        existing.previewUrl = song.previewUrl;
        existing.spotifyPreviewUrl = song.previewUrl;
      }
      if (!existing.youtubeId && song.youtubeId) existing.youtubeId = song.youtubeId;
      if (!existing.spotifyTrackId && song.spotifyTrackId) existing.spotifyTrackId = song.spotifyTrackId;
      if (!existing.album && song.album) existing.album = song.album;
    }
  });

  const songs = Array.from(mergedMap.values()).slice(0, limit);

  // If first local match has no coverImage/previewUrl yet, enrich from first iTunes result if same artist/title token
  if (songs.length > 0 && itunesResults.length > 0) {
    songs.forEach((s) => {
      if (!s.coverImage || !s.previewUrl) {
        const donor = itunesResults[0];
        if (donor && tokens.length > 0) {
          if (!s.coverImage && donor.coverImage) s.coverImage = donor.coverImage;
          if (!s.previewUrl && donor.previewUrl) {
            s.previewUrl = donor.previewUrl;
            s.spotifyPreviewUrl = donor.previewUrl;
          }
        }
      }
    });
  }

  return {
    songs,
    usedRewrite,
    queries
  };
}

// Look up 30-sec audio preview & high-res artwork on demand (like yourmusic's lookupPreviewUrl)
export async function lookupSongPreviewAndArt(artist, title) {
  const term = [clean(artist), clean(title)].filter(Boolean).join(' ');
  if (!term) return { previewUrl: '', coverImage: '' };

  const cacheKey = term.toLowerCase();
  if (previewLookupCache.has(cacheKey)) {
    return previewLookupCache.get(cacheKey);
  }

  const { queries } = buildSearchQueries(artist, title);
  const searchTerms = queries.length ? queries.slice(0, 2) : [term];

  for (const q of searchTerms) {
    for (const country of ['US', 'JP']) {
      try {
        const url = new URL('https://itunes.apple.com/search');
        url.searchParams.set('term', q);
        url.searchParams.set('entity', 'song');
        url.searchParams.set('limit', '3');
        url.searchParams.set('country', country);

        const res = await fetch(url.toString());
        if (!res.ok) continue;
        const data = await res.json();
        const item = (data.results || []).find((r) => clean(r.previewUrl)) || data.results?.[0];
        if (item) {
          const result = {
            previewUrl: clean(item.previewUrl),
            coverImage:
              typeof item.artworkUrl100 === 'string'
                ? item.artworkUrl100.replace('100x100bb', '600x600bb')
                : ''
          };
          if (result.previewUrl || result.coverImage) {
            previewLookupCache.set(cacheKey, result);
            return result;
          }
        }
      } catch {
        // continue
      }
    }
  }

  const empty = { previewUrl: '', coverImage: '' };
  previewLookupCache.set(cacheKey, empty);
  return empty;
}

export function isValidContact(type, value) {
  const v = clean(value);
  if (!v) return false;
  if (type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  if (type === 'instagram') return /^@?[a-zA-Z0-9._]{2,30}$/.test(v);
  if (type === 'phone') return /^01[016789]-?\d{3,4}-?\d{4}$/.test(v);
  return v.length >= 2;
}

// Validation logic matching yourmusic's validateSubmission
export function validateSongSubmission({
  artist,
  title,
  matched,
  confirmed,
  scene,
  contactType,
  contact,
  privacyAgreed
}) {
  const errors = {};

  if (!clean(artist) && !clean(title) && !matched) {
    errors.song = '가수 또는 노래 제목 중 하나는 입력해주세요.';
  }

  if (matched && !confirmed) {
    errors.confirmed = '검색된 노래가 맞는지 [YES ♥ 맞아요] 버튼을 눌러 확인해주세요.';
  }

  if (!clean(scene)) {
    errors.scene = '이 노래와 연결된 사연, 떠오르는 장면 또는 경험담을 적어주세요.';
  }

  if (clean(contact) && !isValidContact(contactType, contact)) {
    errors.contact = `${CONTACT_LABELS[contactType] || '연락처'} 형식을 확인해주세요.`;
  }

  if (clean(contact) && !privacyAgreed) {
    errors.privacy = '연락처를 입력한 경우 개인정보 수집에 동의해주세요.';
  }

  return errors;
}

// Recommend user songs by mood text (yourmusic's HomeScreen -> recommend-songs)
export function recommendUserSongsByMood(moodText, userSongs, limit = 8) {
  const moodKey = classifySongMood(moodText);
  const moodMeta = getMoodMeta(moodKey);
  const matching = userSongs.filter((s) => s.mood === moodKey);
  const others = userSongs.filter((s) => s.mood !== moodKey);
  const combined = [...matching, ...others].slice(0, limit);

  return {
    moodKey,
    moodMeta,
    matchCount: matching.length,
    songs: combined
  };
}

// Generate YouTube Music, Spotify, and Melon external listening links (yourmusic's FullSongLinks)
export function getMusicServiceLinks(song) {
  if (!song) return { youtubeMusic: '', spotify: '', melon: '' };
  const query = [clean(song.title), clean(song.artist)].filter(Boolean).join(' ');
  if (!query) return { youtubeMusic: '', spotify: '', melon: '' };

  const encoded = encodeURIComponent(query);
  const spotifyTrackId = clean(song.spotifyTrackId);

  return {
    youtubeMusic: song.youtubeId
      ? `https://www.youtube.com/watch?v=${encodeURIComponent(song.youtubeId)}`
      : `https://music.youtube.com/search?q=${encoded}`,
    melon: `https://www.melon.com/search/total/index.htm?q=${encoded}`,
    spotify: spotifyTrackId
      ? `https://open.spotify.com/track/${encodeURIComponent(spotifyTrackId)}`
      : `https://open.spotify.com/search/${encoded}`
  };
}
