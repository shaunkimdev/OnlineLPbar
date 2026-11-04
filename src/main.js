import { GENRE_SHELVES, getLPCoverDataURL, getProceduralLPCoverDataURL } from './data/lpCatalog.js';
import { BAR_TABLES, INITIAL_COASTER_NOTES } from './data/barTables.js';
import {
  MOOD_CATEGORIES,
  getMoodMeta,
  CONTACT_LABELS,
  validateSongSubmission,
  loadUserRecommendedSongs,
  persistCustomUserSong,
  normalizeUserSongToLP,
  loadSavedHeartState,
  saveHeartState,
  searchSongsByArtistAndTitle,
  lookupSongPreviewAndArt,
  recommendUserSongsByMood,
  getMusicServiceLinks
} from './data/userMusicService.js';
import { AudioEngine } from './audio/AudioEngine.js';
import { LPBarWorld } from './world/LPBarWorld.js';
import { MultiplayerSync, generateRandomNickname } from './network/MultiplayerSync.js';

const initialUserSongs = loadUserRecommendedSongs();

// Application State
const state = {
  shelves: GENRE_SHELVES,
  tables: BAR_TABLES,
  coasters: [...INITIAL_COASTER_NOTES],

  // User-Recommended Story Songs (adapted from yourmusic)
  userSongs: initialUserSongs,
  filteredUserSongs: [...initialUserSongs],
  activeMoodFilter: 'all',
  openUserCorner: false,
  selectedUserLPIndex: 0,
  userCornerAutoPlay: false,
  userCornerPlaying: false,
  userCornerActiveLP: null,
  heartState: loadSavedHeartState(),

  // Currently held LP in character's hands
  heldLP: null,

  // Active shelf close-up state
  openShelf: null,
  selectedLPIndex: 0,
  isRandomFlipping: false,

  // Active seated table & currently playing table across the bar
  seatedTable: null,
  playingTableId: null
};

const audio = new AudioEngine();
let world = null;
let mp = null;

// Helper to apply LP cover image with automatic procedural fallback if external URL fails
function applyLPCoverImage(imgEl, lp) {
  if (!imgEl || !lp) return;
  imgEl.onerror = () => {
    imgEl.onerror = null;
    imgEl.src = getProceduralLPCoverDataURL(lp);
  };
  imgEl.src = getLPCoverDataURL(lp);
}

// Toast helper
function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast-msg';
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3300);
}

// Initialize 3D World & UI
window.addEventListener('DOMContentLoaded', () => {
  const sceneContainer = document.getElementById('scene-container');

  // Apply persisted heart counts to loaded user songs
  state.userSongs.forEach((song) => {
    if (typeof state.heartState.counts[song.id] === 'number') {
      song.heartCount = state.heartState.counts[song.id];
    }
  });
  state.filteredUserSongs = [...state.userSongs];

  world = new LPBarWorld(sceneContainer, state.shelves, state.tables, {
    initialUserSongs: state.userSongs,
    onFootstep: () => audio.playFootstep(),
    onProximityChange: (prox) => updateProximityPrompt(prox),
    onEnterShelfCloseup: (shelfData) => openShelfDiggingUI(shelfData),
    onEnterUserCornerCloseup: () => openUserCornerUI(),
    onOpenRecommendSongModal: () => openRecommendSongModal(),
    onSitAtTable: (tableData) => handleCharacterSatAtTable(tableData),
    onLeaveTable: (tableId) => handleWorldLeftTable(tableId),
    getAvailableSeatIndex: (tableId, capacity) => (mp ? mp.findAvailableSeatIndex(tableId, capacity) : 0),
    onPlayerTransformChange: (transformState, forceImmediate) => {
      if (mp) {
        mp.updateLocalTransform(transformState, forceImmediate);
      }
    }
  });

  audio.onStatusChange = (statusText) => {
    const noteEl = document.getElementById('source-status-note');
    if (noteEl) noteEl.textContent = statusText;
    const ucStatusEl = document.getElementById('uc-player-status');
    if (ucStatusEl && state.openUserCorner) ucStatusEl.textContent = statusText;
  };

  audio.onBgJazzChange = (track) => {
    const labelEl = document.getElementById('bg-jazz-current-track');
    if (labelEl && track) {
      labelEl.textContent = `🎵 ${track.title} — ${track.artist}`;
    }
  };

  // Run each setup step independently so one failing module can never block the others
  // (e.g. a multiplayer error must not prevent the entrance button from working)
  const setupSteps = [
    setupMultiplayerSync,
    setupEntranceOverlay,
    setupTopHUD,
    setupShelfDiggingUI,
    setupUserCornerUI,
    setupRecommendSongModal,
    setupTableTurntableHUD,
    setupNowPlayingBar,
    setupAmbientDrawer,
    setupCoasterGuestbook,
    setupCustomLPModal,
    setupGlobalHotkeys,
    setupMobileControls
  ];
  setupSteps.forEach((step) => {
    try {
      step();
    } catch (err) {
      console.error(`[setup] ${step.name} failed: ${err?.message || err}`, err);
    }
  });

  // Pre-seed Table A-1 with a classic Jazz record paused on platter so users can also test immediately
  const initialJazzLP = state.shelves[0].records[0];
  state.tables[0].currentLP = initialJazzLP;
  world.updateTableTurntableVisual(state.tables[0].id);
});

function syncGenderUI(gender) {
  world.setPlayerGender(gender);
  if (mp) {
    mp.setGender(gender);
  }
  document.querySelectorAll('.char-choice-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.gender === gender);
  });
  const btnGender = document.getElementById('btn-gender-switch');
  if (btnGender) {
    btnGender.innerHTML =
      gender === 'female'
        ? '<span>👧 캐릭터: <strong id="current-gender-label">여자아이</strong></span>'
        : '<span>👦 캐릭터: <strong id="current-gender-label">남자아이</strong></span>';
  }
}

// =========================================================================
// 1. ENTRANCE OVERLAY
// =========================================================================
function setupEntranceOverlay() {
  const overlay = document.getElementById('entrance-overlay');
  const btnEnter = document.getElementById('btn-enter-bar');
  const nickInput = document.getElementById('entrance-nickname');
  const btnRandomNick = document.getElementById('btn-random-nickname');
  let hasEntered = false;

  if (nickInput) {
    nickInput.value = getLocalNickname();
    nickInput.addEventListener('input', () => {
      const val = nickInput.value.trim();
      if (val) {
        updateLocalNickname(val);
      }
    });
  }

  if (btnRandomNick && nickInput) {
    btnRandomNick.addEventListener('click', () => {
      const randNick = generateRandomNickname();
      nickInput.value = randNick;
      updateLocalNickname(randNick);
    });
  }

  document.querySelectorAll('.char-choice-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      syncGenderUI(btn.dataset.gender);
    });
  });

  btnEnter.addEventListener('click', async () => {
    if (hasEntered) return;
    hasEntered = true;

    // Hide the overlay first so entering never depends on audio/network initialization succeeding
    overlay.style.opacity = '0';
    setTimeout(() => overlay.classList.add('hidden'), 480);

    const nickVal = (nickInput?.value || '').trim() || getLocalNickname();
    updateLocalNickname(nickVal);

    try {
      await audio.init();
      audio.playSleeveFlip();
    } catch (err) {
      console.warn('Audio init failed:', err);
    }

    // Join the real-time multiplayer room only after entering the bar
    try {
      if (mp && !mp.started) {
        mp.started = true;
        mp.init({ nickname: getLocalNickname(), gender: world.playerGender });
      }
    } catch (err) {
      console.warn('Multiplayer init failed:', err);
    }

    showToast(`🎷 [${getLocalNickname()}]님, 미드나잇 그루브 LP바에 오신 것을 환영합니다!`);
  });
}

// =========================================================================
// 2. TOP HUD & ZONE TELEPORTATION
// =========================================================================
function setupTopHUD() {
  const btnTopUserCorner = document.getElementById('btn-top-user-corner');
  if (btnTopUserCorner) {
    btnTopUserCorner.addEventListener('click', () => {
      closeShelfDiggingUI(false);
      closeTableTurntableHUD(false);
      world.enterUserCornerCloseup();
    });
  }

  const btnTopRecommend = document.getElementById('btn-top-recommend-song');
  if (btnTopRecommend) {
    btnTopRecommend.addEventListener('click', () => {
      openRecommendSongModal();
    });
  }

  const btnGender = document.getElementById('btn-gender-switch');
  if (btnGender) {
    btnGender.addEventListener('click', () => {
      const next = world.playerGender === 'male' ? 'female' : 'male';
      syncGenderUI(next);
      showToast(
        next === 'female'
          ? '👧 캐릭터가 [귀여운 여자아이]로 변경되었습니다!'
          : '👦 캐릭터가 [귀여운 남자아이]로 변경되었습니다!'
      );
    });
  }

  const chkAuto = document.getElementById('chk-auto-closeup');
  chkAuto.addEventListener('change', (e) => {
    world.autoShelfCloseup = e.target.checked;
    showToast(
      e.target.checked
        ? '📚 책장 및 유저 LP 코너 접근 시 자동 1인칭 클로즈업이 켜졌습니다.'
        : '📚 책장 및 유저 LP 코너 접근 시 E키 또는 클릭으로 전환합니다.'
    );
  });

  // Mood lighting cycle
  const btnMood = document.getElementById('btn-mood-cycle');
  const moodNameEl = document.getElementById('mood-name');
  btnMood.addEventListener('click', () => {
    const nextName = world.cycleMood();
    moodNameEl.textContent = nextName;
    if (mp) {
      mp.broadcastMoodChanged(world.moodIndex, nextName);
    }
    showToast(`🕯️ 바 조명 테마가 [${nextName}] 모드로 변경되었습니다.`);
  });

  // Drop currently held LP
  document.getElementById('btn-drop-lp').addEventListener('click', () => {
    setHeldLP(null);
    showToast('손에 들고 있던 LP판을 내려놓았습니다.');
  });

  // Left Zone Navigation Buttons
  const zoneBtns = document.querySelectorAll('.zone-btn');
  zoneBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      zoneBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const zone = btn.dataset.zone;
      closeShelfDiggingUI(false);
      closeUserCornerUI(false);
      closeTableTurntableHUD(false);
      world.focusZone(zone);

      if (zone === 'user-corner') {
        showToast('💌 찐 유저 추천 사연 LP 코너 (1인칭 감상 부스)로 이동했습니다.');
      } else if (zone === 'shelves') {
        showToast('📚 앞쪽 장르별 인기 LP 책장 구역으로 이동했습니다.');
      } else if (zone === 'tables-2p') {
        showToast('🥂 2인석 테이블 구역 (Table A-1 ~ A-4)으로 이동했습니다.');
      } else if (zone === 'tables-4p') {
        showToast('🛋️ 4인석 부스 테이블 구역 (Table B-1 ~ B-4)으로 이동했습니다.');
      }
    });
  });
}

function highlightZoneButton(zoneKey) {
  document.querySelectorAll('.zone-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.zone === zoneKey);
  });
}

function setHeldLP(lp) {
  state.heldLP = lp;
  world.setCharacterHeldLP(lp);

  const pill = document.getElementById('held-lp-pill');
  const thumb = document.getElementById('held-lp-thumb');
  const title = document.getElementById('held-lp-title');

  if (lp) {
    pill.classList.remove('hidden');
    applyLPCoverImage(thumb, lp);
    title.textContent = `${lp.title} — ${lp.artist}`;
  } else {
    pill.classList.add('hidden');
  }

  const mobileDropBtn = document.getElementById('btn-mobile-drop-lp');
  if (mobileDropBtn) {
    mobileDropBtn.classList.toggle('hidden', !lp);
  }
}

function setLocationStatus(text) {
  const el = document.getElementById('location-status-text');
  if (el) el.textContent = text;
}

// =========================================================================
// 3. PROXIMITY INTERACTION PROMPT
// =========================================================================
function updateProximityPrompt(prox) {
  const promptEl = document.getElementById('proximity-prompt');
  const mobileActBtn = document.getElementById('btn-mobile-interact');
  const mobileActIcon = document.getElementById('mobile-act-icon');
  const mobileActText = document.getElementById('mobile-act-text');

  if (!prox) {
    promptEl.classList.add('hidden');
    if (mobileActBtn) mobileActBtn.classList.add('hidden');
    return;
  }

  promptEl.classList.remove('hidden');
  if (mobileActBtn && !state.seatedTable) {
    mobileActBtn.classList.remove('hidden');
  }

  const badgeEl = document.getElementById('proximity-type');
  const titleEl = document.getElementById('proximity-title');
  const subEl = document.getElementById('proximity-sub');
  const btnLabel = document.getElementById('proximity-btn-label');
  const btnAction = document.getElementById('btn-proximity-action');

  if (prox.type === 'user-corner') {
    badgeEl.textContent = 'YOUR MUSIC · 1ST-PERSON BOOTH';
    titleEl.textContent = '💌 찐 유저 추천 사연 LP 코너';
    subEl.textContent = `유저들이 직접 남긴 사연과 인생곡 ${state.userSongs.length}장이 꽂혀 있습니다. 1인칭 시점으로 사연을 읽으며 감상하거나 나만의 노래를 추천해보세요!`;
    btnLabel.textContent = '1인칭 사연 감상 & 청음 화면으로 전환';
    btnAction.onclick = () => world.enterUserCornerCloseup();
    if (mobileActIcon) mobileActIcon.textContent = '💌';
    if (mobileActText) mobileActText.textContent = '사연 코너';
  } else if (prox.type === 'shelf') {
    badgeEl.textContent = `${prox.data.code} · POPULAR VINYL RACK`;
    titleEl.textContent = `${prox.data.name} (${prox.data.koName})`;
    subEl.textContent = prox.data.subtitle;
    btnLabel.textContent = '책장 정면 클로즈업으로 LP 둘러보기';
    btnAction.onclick = () => world.enterShelfCloseup(prox.id);
    if (mobileActIcon) mobileActIcon.textContent = '📚';
    if (mobileActText) mobileActText.textContent = '책장 디깅';
  } else if (prox.type === 'table') {
    badgeEl.textContent = prox.data.typeLabel;
    titleEl.textContent = prox.data.name;
    if (state.heldLP) {
      subEl.textContent = `손에 든 [${state.heldLP.title}] LP를 이 테이블의 턴테이블에 올립니다`;
      btnLabel.textContent = '테이블에 앉아서 LP판 올리고 재생하기';
      if (mobileActIcon) mobileActIcon.textContent = '💿';
      if (mobileActText) mobileActText.textContent = 'LP 올리기';
    } else if (prox.data.currentLP) {
      subEl.textContent = `현재 올려진 LP: ${prox.data.currentLP.title} (${prox.data.currentLP.artist})`;
      btnLabel.textContent = '테이블에 앉아서 턴테이블 조작하기';
      if (mobileActIcon) mobileActIcon.textContent = '🛋️';
      if (mobileActText) mobileActText.textContent = '테이블 착석';
    } else {
      subEl.textContent = prox.data.desc;
      btnLabel.textContent = '이 테이블에 앉기';
      if (mobileActIcon) mobileActIcon.textContent = '🛋️';
      if (mobileActText) mobileActText.textContent = '테이블 착석';
    }
    btnAction.onclick = () => world.sitAtTable(prox.id);
  }
}

// =========================================================================
// 4. FRONT-FACING SHELF CLOSE-UP DIGGING VIEW
// =========================================================================
function setupShelfDiggingUI() {
  // Genre quick tabs inside shelf close-up header
  const tabsContainer = document.getElementById('shelf-genre-tabs');
  state.shelves.forEach((shelf) => {
    const btn = document.createElement('button');
    btn.className = 'shelf-tab-btn';
    btn.dataset.shelfId = shelf.id;
    btn.textContent = shelf.koName;
    btn.addEventListener('click', () => {
      audio.playSleeveFlip();
      world.enterShelfCloseup(shelf.id);
    });
    tabsContainer.appendChild(btn);
  });

  document.getElementById('btn-close-shelf').addEventListener('click', () => {
    closeShelfDiggingUI(true);
  });

  document.getElementById('btn-lp-prev').addEventListener('click', () => {
    flipShelfLP(-1);
  });

  document.getElementById('btn-lp-next').addEventListener('click', () => {
    flipShelfLP(1);
  });

  // Mouse wheel & Touch swipe inside the crate viewport flips records!
  const viewport = document.getElementById('lp-crate-viewport');
  viewport.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      if (e.deltaY > 0) flipShelfLP(1);
      else if (e.deltaY < 0) flipShelfLP(-1);
    },
    { passive: false }
  );

  let vpTouchStartX = 0;
  viewport.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      vpTouchStartX = e.touches[0].clientX;
    }
  }, { passive: true });

  viewport.addEventListener('touchend', (e) => {
    if (e.changedTouches.length === 1) {
      const dx = e.changedTouches[0].clientX - vpTouchStartX;
      if (Math.abs(dx) > 35) {
        if (dx < 0) flipShelfLP(1);
        else flipShelfLP(-1);
      }
    }
  }, { passive: true });

  // Random Digging Button ("추천곡들을 랜덤하게 넘겨볼수있고")
  document.getElementById('btn-random-lp').addEventListener('click', () => {
    triggerRandomShelfFlip();
  });

  // Pick LP Button ("선택하면 들고 원하는 테이블로 가서 LP판 넣고 음악을 들을수있도록")
  document.getElementById('btn-pick-lp').addEventListener('click', () => {
    pickCurrentShelfLP();
  });

  const btnShelfRec = document.getElementById('btn-shelf-open-user-recommend');
  if (btnShelfRec) {
    btnShelfRec.addEventListener('click', () => {
      openRecommendSongModal();
    });
  }
}

function openShelfDiggingUI(shelfData) {
  state.openShelf = shelfData;
  state.selectedLPIndex = 0;

  // Hide user corner & table HUD & mobile joystick if open
  closeUserCornerUI(false);
  document.getElementById('table-turntable-hud').classList.add('hidden');
  document.getElementById('proximity-prompt').classList.add('hidden');
  document.getElementById('mobile-controls-layer')?.classList.add('hidden');

  const overlay = document.getElementById('shelf-closeup-overlay');
  overlay.classList.remove('hidden');
  highlightZoneButton('shelves');

  document.getElementById('shelf-modal-badge').textContent = `${shelfData.code} · FRONT CLOSE-UP VIEW`;
  document.getElementById('shelf-modal-title').textContent = `${shelfData.name} (${shelfData.koName})`;
  document.getElementById('shelf-modal-desc').textContent = shelfData.subtitle;
  document.getElementById('crate-front-plate').textContent = `${shelfData.name} · POPULAR VINYL`;

  // Highlight active genre tab
  document.querySelectorAll('.shelf-tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.shelfId === shelfData.id);
  });

  setLocationStatus(`${shelfData.koName} LP 책장 정면 디깅 중`);
  audio.playSleeveFlip();
  renderShelfCrateCards();
}

function closeShelfDiggingUI(tellWorld = true) {
  state.openShelf = null;
  document.getElementById('shelf-closeup-overlay').classList.add('hidden');
  if (detectMobileDevice()) {
    document.getElementById('mobile-controls-layer')?.classList.remove('hidden');
  }
  if (tellWorld) {
    world.exitShelfCloseup();
    highlightZoneButton('walk');
    setLocationStatus(
      state.heldLP
        ? `LP를 들고 테이블을 찾는 중 (${state.heldLP.title})`
        : 'LP바 라운지 산책 중'
    );
  }
}

function flipShelfLP(delta) {
  if (!state.openShelf || state.isRandomFlipping) return;
  const count = state.openShelf.records.length;
  if (count === 0) return;

  state.selectedLPIndex = (state.selectedLPIndex + delta + count) % count;
  audio.playSleeveFlip();
  updateShelfCratePositions();
}

function triggerRandomShelfFlip() {
  if (!state.openShelf || state.isRandomFlipping) return;
  const count = state.openShelf.records.length;
  if (count <= 1) return;

  state.isRandomFlipping = true;
  const totalFlips = 6 + Math.floor(Math.random() * 5);
  let step = 0;

  const flipInterval = setInterval(() => {
    state.selectedLPIndex = (state.selectedLPIndex + 1 + Math.floor(Math.random() * 2)) % count;
    audio.playSleeveFlip();
    updateShelfCratePositions();
    step++;

    if (step >= totalFlips) {
      clearInterval(flipInterval);
      state.isRandomFlipping = false;
      const chosen = state.openShelf.records[state.selectedLPIndex];
      showToast(`🎲 랜덤 추천 LP: [${chosen.title} — ${chosen.artist}]`);
    }
  }, 95);
}

function renderShelfCrateCards() {
  const stage = document.getElementById('lp-cards-stage');
  stage.innerHTML = '';
  if (!state.openShelf) return;

  state.openShelf.records.forEach((lp, idx) => {
    const card = document.createElement('div');
    card.className = 'lp-sleeve-card';
    card.dataset.index = idx;

    const img = document.createElement('img');
    applyLPCoverImage(img, lp);
    img.alt = lp.title;

    const discPeek = document.createElement('div');
    discPeek.className = 'lp-sleeve-disc-peek';

    card.appendChild(discPeek);
    card.appendChild(img);

    card.addEventListener('click', () => {
      if (state.selectedLPIndex === idx) {
        pickCurrentShelfLP();
      } else {
        state.selectedLPIndex = idx;
        audio.playSleeveFlip();
        updateShelfCratePositions();
      }
    });

    stage.appendChild(card);
  });

  updateShelfCratePositions();
}

function updateShelfCratePositions() {
  if (!state.openShelf) return;
  const records = state.openShelf.records;
  const activeIdx = state.selectedLPIndex;
  const cards = document.querySelectorAll('#lp-cards-stage .lp-sleeve-card');

  cards.forEach((card, idx) => {
    const diff = idx - activeIdx;
    card.classList.toggle('is-active', diff === 0);

    if (diff === 0) {
      // Front & center pulled-up LP jacket facing the user straight on
      card.style.transform = 'translate3d(-18px, -36px, 90px) rotateX(0deg) rotateY(-4deg) scale(1.04)';
      card.style.opacity = '1';
      card.style.zIndex = '20';
      card.style.filter = 'brightness(1.04)';
    } else if (diff < 0) {
      // Left/front flipped sleeves
      const absD = Math.abs(diff);
      const x = -140 - absD * 38;
      const y = 8 + absD * 8;
      const z = -absD * 45;
      card.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateY(28deg) rotateZ(-4deg) scale(0.86)`;
      card.style.opacity = absD > 3 ? '0' : String(Math.max(0.25, 0.85 - absD * 0.2));
      card.style.zIndex = String(15 - absD);
      card.style.filter = 'brightness(0.65)';
    } else {
      // Right/back stacked sleeves in crate
      const x = 115 + diff * 38;
      const y = 4 + diff * 6;
      const z = -diff * 45;
      card.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateY(-26deg) rotateZ(3deg) scale(0.86)`;
      card.style.opacity = diff > 3 ? '0' : String(Math.max(0.25, 0.85 - diff * 0.2));
      card.style.zIndex = String(15 - diff);
      card.style.filter = 'brightness(0.68)';
    }
  });

  // Update right-side LP inspector details
  const lp = records[activeIdx];
  if (!lp) return;

  document.getElementById('lp-detail-index').textContent = `${String(activeIdx + 1).padStart(2, '0')} / ${String(records.length).padStart(2, '0')}`;
  document.getElementById('lp-detail-rpm').textContent = `${lp.rpm || 33}⅓ RPM · ANALOG STEREO`;
  document.getElementById('lp-detail-title').textContent = lp.title;
  document.getElementById('lp-detail-artist').textContent = `${lp.artist} · ${lp.year}`;
  document.getElementById('lp-detail-desc').textContent = lp.desc;

  const tagsEl = document.getElementById('lp-detail-tags');
  tagsEl.innerHTML = '';
  (lp.tags || []).forEach((t) => {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = t;
    tagsEl.appendChild(span);
  });
}

function pickCurrentShelfLP() {
  if (!state.openShelf) return;
  const lp = state.openShelf.records[state.selectedLPIndex];
  if (!lp) return;

  audio.playSleeveFlip();
  setHeldLP(lp);
  closeShelfDiggingUI(true);
  showToast(`💿 [${lp.title}] LP를 손에 들었습니다! 원하는 2인석·4인석 테이블을 클릭하거나 걸어가서 올려보세요.`);
}

// =========================================================================
// 4-B. USER STORY LP CORNER (1st-Person Listening & Story Reading View)
// =========================================================================
function setupUserCornerUI() {
  renderUserCornerMoodTabs();

  // Header controls
  document.getElementById('btn-uc-autoplay').addEventListener('click', () => {
    state.userCornerAutoPlay = !state.userCornerAutoPlay;
    const btn = document.getElementById('btn-uc-autoplay');
    const label = document.getElementById('uc-autoplay-state');
    btn.classList.toggle('active', state.userCornerAutoPlay);
    label.textContent = state.userCornerAutoPlay ? 'ON' : 'OFF';
    showToast(
      state.userCornerAutoPlay
        ? '🔊 1인칭 코너에서 사연 LP를 넘길 때 자동으로 노래를 청음합니다.'
        : '🔇 자동 청음이 꺼졌습니다. [바로 듣기] 버튼으로 원하는 곡만 재생하세요.'
    );
  });

  document.getElementById('btn-uc-open-recommend').addEventListener('click', () => {
    openRecommendSongModal();
  });

  document.getElementById('btn-uc-goto-shelves').addEventListener('click', () => {
    closeUserCornerUI(false);
    world.enterShelfCloseup(state.shelves[0].id);
  });

  document.getElementById('btn-close-user-corner').addEventListener('click', () => {
    closeUserCornerUI(true);
  });

  // Mood text recommendation ("♪ 기분 맞춤 사연곡 찾기" from yourmusic)
  const moodInput = document.getElementById('uc-mood-input');
  const btnMoodRecommend = document.getElementById('btn-uc-mood-recommend');
  const runMoodSearch = () => {
    const query = moodInput.value.trim();
    if (!query) {
      filterUserSongsByMood('all');
      return;
    }
    const result = recommendUserSongsByMood(query, state.userSongs, 10);
    state.activeMoodFilter = result.mood;
    state.filteredUserSongs = result.songs;
    state.selectedUserLPIndex = 0;
    syncMoodTabButtons();
    audio.playSleeveFlip();
    renderUserCornerCrateCards(true);
    showToast(`✨ '${query}' 기분에 어울리는 [${result.moodMeta.emoji} ${result.moodMeta.shortKo}] 사연곡을 찾았습니다!`);
  };

  btnMoodRecommend.addEventListener('click', runMoodSearch);
  moodInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      runMoodSearch();
    }
  });

  // Left/Right Crate Navigation
  document.getElementById('btn-uc-prev').addEventListener('click', () => {
    flipUserCornerLP(-1);
  });
  document.getElementById('btn-uc-next').addEventListener('click', () => {
    flipUserCornerLP(1);
  });

  // Mouse wheel & touch swipe inside User Corner crate flips records
  const ucViewport = document.getElementById('uc-crate-viewport');
  ucViewport.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      if (e.deltaY > 0) flipUserCornerLP(1);
      else if (e.deltaY < 0) flipUserCornerLP(-1);
    },
    { passive: false }
  );

  let ucTouchStartX = 0;
  ucViewport.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      ucTouchStartX = e.touches[0].clientX;
    }
  }, { passive: true });

  ucViewport.addEventListener('touchend', (e) => {
    if (e.changedTouches.length === 1) {
      const dx = e.changedTouches[0].clientX - ucTouchStartX;
      if (Math.abs(dx) > 35) {
        if (dx < 0) flipUserCornerLP(1);
        else flipUserCornerLP(-1);
      }
    }
  }, { passive: true });

  // 1st-Person Listening Controls
  document.getElementById('btn-uc-play-toggle').addEventListener('click', () => {
    const lp = state.filteredUserSongs[state.selectedUserLPIndex];
    if (!lp) return;
    if (state.userCornerPlaying && state.userCornerActiveLP?.id === lp.id) {
      stopUserCornerPlayback();
    } else {
      startUserCornerPlayback(lp, true);
    }
  });

  document.getElementById('btn-uc-needle-drop').addEventListener('click', () => {
    const lp = state.filteredUserSongs[state.selectedUserLPIndex];
    if (!lp) return;
    startUserCornerPlayback(lp, true);
    showToast(`🪡 [${lp.title}] 첫 트랙에 바늘을 다시 내려놓았습니다 (툭— 치지직...)`);
  });

  // Heart / Empathy Button (from yourmusic)
  document.getElementById('btn-uc-heart').addEventListener('click', () => {
    handleHeartCurrentUserSong();
  });

  // Random Flip & Pick LP to Table
  document.getElementById('btn-uc-random').addEventListener('click', () => {
    triggerRandomUserCornerFlip();
  });

  document.getElementById('btn-uc-pick-lp').addEventListener('click', () => {
    pickCurrentUserCornerLP();
  });
}

function renderUserCornerMoodTabs() {
  const container = document.getElementById('uc-mood-tabs');
  if (!container) return;
  container.innerHTML = '';

  const allBtn = document.createElement('button');
  allBtn.type = 'button';
  allBtn.className = 'uc-mood-chip active';
  allBtn.dataset.mood = 'all';
  allBtn.textContent = `💿 전체 사연 (${state.userSongs.length})`;
  allBtn.addEventListener('click', () => filterUserSongsByMood('all'));
  container.appendChild(allBtn);

  Object.values(MOOD_CATEGORIES).forEach((m) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'uc-mood-chip';
    chip.dataset.mood = m.key;
    chip.textContent = `${m.emoji} ${m.shortKo}`;
    chip.addEventListener('click', () => filterUserSongsByMood(m.key));
    container.appendChild(chip);
  });
}

function syncMoodTabButtons() {
  document.querySelectorAll('#uc-mood-tabs .uc-mood-chip').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mood === state.activeMoodFilter);
    if (btn.dataset.mood === 'all') {
      btn.textContent = `💿 전체 사연 (${state.userSongs.length})`;
    }
  });
}

function filterUserSongsByMood(moodKey) {
  state.activeMoodFilter = moodKey;
  if (moodKey === 'all') {
    state.filteredUserSongs = [...state.userSongs];
  } else {
    const matched = state.userSongs.filter((s) => s.mood === moodKey);
    if (matched.length === 0) {
      const meta = getMoodMeta(moodKey);
      showToast(`아직 [${meta.emoji} ${meta.shortKo}] 무드의 사연곡이 없어 전체 사연곡을 표시합니다.`);
      state.activeMoodFilter = 'all';
      state.filteredUserSongs = [...state.userSongs];
    } else {
      state.filteredUserSongs = matched;
    }
  }
  state.selectedUserLPIndex = 0;
  syncMoodTabButtons();
  audio.playSleeveFlip();
  renderUserCornerCrateCards(true);
}

function openUserCornerUI(targetSongId = null) {
  state.openUserCorner = true;

  // Hide shelf or table HUD & mobile joystick if open
  closeShelfDiggingUI(false);
  document.getElementById('table-turntable-hud').classList.add('hidden');
  document.getElementById('proximity-prompt').classList.add('hidden');
  document.getElementById('mobile-controls-layer')?.classList.add('hidden');

  if (targetSongId) {
    state.activeMoodFilter = 'all';
    state.filteredUserSongs = [...state.userSongs];
    const foundIdx = state.filteredUserSongs.findIndex((s) => s.id === targetSongId);
    state.selectedUserLPIndex = foundIdx >= 0 ? foundIdx : 0;
  } else if (state.filteredUserSongs.length === 0) {
    state.filteredUserSongs = [...state.userSongs];
    state.selectedUserLPIndex = 0;
  }

  syncMoodTabButtons();

  const overlay = document.getElementById('user-corner-overlay');
  overlay.classList.remove('hidden');
  highlightZoneButton('user-corner');

  setLocationStatus('💌 찐 유저 추천 사연 LP 코너 (1인칭 감상 중)');
  audio.playSleeveFlip();
  renderUserCornerCrateCards(state.userCornerAutoPlay);
}

function closeUserCornerUI(tellWorld = true) {
  if (!state.openUserCorner) return;
  state.openUserCorner = false;
  document.getElementById('user-corner-overlay').classList.add('hidden');
  if (detectMobileDevice()) {
    document.getElementById('mobile-controls-layer')?.classList.remove('hidden');
  }

  if (tellWorld) {
    world.exitUserCornerCloseup();
    highlightZoneButton('walk');
    setLocationStatus(
      state.heldLP
        ? `사연 LP를 들고 테이블을 찾는 중 (${state.heldLP.title})`
        : 'LP바 라운지 산책 중'
    );
  }
}

function flipUserCornerLP(delta) {
  if (!state.openUserCorner || state.isRandomFlipping) return;
  const count = state.filteredUserSongs.length;
  if (count === 0) return;

  state.selectedUserLPIndex = (state.selectedUserLPIndex + delta + count) % count;
  audio.playSleeveFlip();
  updateUserCornerPositions(state.userCornerAutoPlay);
}

function triggerRandomUserCornerFlip() {
  if (!state.openUserCorner || state.isRandomFlipping) return;
  const count = state.filteredUserSongs.length;
  if (count <= 1) return;

  state.isRandomFlipping = true;
  const totalFlips = 5 + Math.floor(Math.random() * 5);
  let step = 0;

  const flipInterval = setInterval(() => {
    state.selectedUserLPIndex = (state.selectedUserLPIndex + 1 + Math.floor(Math.random() * 2)) % count;
    audio.playSleeveFlip();
    updateUserCornerPositions(false);
    step++;

    if (step >= totalFlips) {
      clearInterval(flipInterval);
      state.isRandomFlipping = false;
      const chosen = state.filteredUserSongs[state.selectedUserLPIndex];
      updateUserCornerPositions(state.userCornerAutoPlay);
      if (chosen) {
        const recName = chosen.recommender?.name || '익명 디거';
        showToast(`🎲 [${recName}]님의 추천 사연곡: ${chosen.title} — ${chosen.artist}`);
      }
    }
  }, 95);
}

function renderUserCornerCrateCards(shouldAutoPlay = false) {
  const stage = document.getElementById('uc-cards-stage');
  if (!stage) return;
  stage.innerHTML = '';

  state.filteredUserSongs.forEach((lp, idx) => {
    const card = document.createElement('div');
    card.className = 'lp-sleeve-card uc-sleeve-card';
    card.dataset.index = idx;

    const img = document.createElement('img');
    applyLPCoverImage(img, lp);
    img.alt = lp.title;

    const discPeek = document.createElement('div');
    discPeek.className = 'lp-sleeve-disc-peek';

    // Story Recommender Ribbon on the LP Jacket
    const ribbon = document.createElement('div');
    ribbon.className = 'uc-sleeve-ribbon';
    const recName = lp.recommender?.name || '익명 디거';
    const moodMeta = getMoodMeta(lp.mood);
    ribbon.innerHTML = `<span>${moodMeta.emoji} ${escapeHTML(recName)}님의 사연</span><strong>♥ ${Number(lp.heartCount) || 1}</strong>`;

    card.appendChild(discPeek);
    card.appendChild(img);
    card.appendChild(ribbon);

    card.addEventListener('click', () => {
      if (state.selectedUserLPIndex === idx) {
        // Clicking the active front LP toggles playback or picks it up
        if (!state.userCornerPlaying || state.userCornerActiveLP?.id !== lp.id) {
          startUserCornerPlayback(lp, true);
        } else {
          pickCurrentUserCornerLP();
        }
      } else {
        state.selectedUserLPIndex = idx;
        audio.playSleeveFlip();
        updateUserCornerPositions(state.userCornerAutoPlay);
      }
    });

    stage.appendChild(card);
  });

  updateUserCornerPositions(shouldAutoPlay);
}

function updateUserCornerPositions(shouldAutoPlay = false) {
  const records = state.filteredUserSongs;
  if (!records || records.length === 0) return;

  if (state.selectedUserLPIndex >= records.length) {
    state.selectedUserLPIndex = 0;
  }
  const activeIdx = state.selectedUserLPIndex;
  const cards = document.querySelectorAll('#uc-cards-stage .lp-sleeve-card');

  cards.forEach((card, idx) => {
    const diff = idx - activeIdx;
    card.classList.toggle('is-active', diff === 0);

    if (diff === 0) {
      card.style.transform = 'translate3d(-16px, -34px, 92px) rotateX(0deg) rotateY(-4deg) scale(1.04)';
      card.style.opacity = '1';
      card.style.zIndex = '20';
      card.style.filter = 'brightness(1.05)';
    } else if (diff < 0) {
      const absD = Math.abs(diff);
      const x = -138 - absD * 36;
      const y = 8 + absD * 8;
      const z = -absD * 44;
      card.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateY(28deg) rotateZ(-4deg) scale(0.86)`;
      card.style.opacity = absD > 3 ? '0' : String(Math.max(0.25, 0.85 - absD * 0.2));
      card.style.zIndex = String(15 - absD);
      card.style.filter = 'brightness(0.64)';
    } else {
      const x = 114 + diff * 36;
      const y = 4 + diff * 6;
      const z = -diff * 44;
      card.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateY(-26deg) rotateZ(3deg) scale(0.86)`;
      card.style.opacity = diff > 3 ? '0' : String(Math.max(0.25, 0.85 - diff * 0.2));
      card.style.zIndex = String(15 - diff);
      card.style.filter = 'brightness(0.66)';
    }
  });

  const lp = records[activeIdx];
  if (!lp) return;

  if (shouldAutoPlay) {
    startUserCornerPlayback(lp, true);
  } else {
    updateUserCornerInspector(lp);
  }
}

function updateUserCornerInspector(lp) {
  if (!lp) return;
  const records = state.filteredUserSongs;
  const activeIdx = state.selectedUserLPIndex;
  const moodMeta = getMoodMeta(lp.mood);

  document.getElementById('uc-detail-index').textContent = `${String(activeIdx + 1).padStart(2, '0')} / ${String(records.length).padStart(2, '0')}`;

  const moodBadge = document.getElementById('uc-detail-mood');
  moodBadge.textContent = `${moodMeta.emoji} ${moodMeta.shortKo}`;
  moodBadge.style.borderColor = moodMeta.color;
  moodBadge.style.color = moodMeta.color;

  // Heart state
  const isLiked = !!state.heartState.likedIds[lp.id];
  const btnHeart = document.getElementById('btn-uc-heart');
  btnHeart.classList.toggle('liked', isLiked);
  document.getElementById('uc-heart-icon').textContent = isLiked ? '♥' : '♡';
  document.getElementById('uc-heart-count').textContent = String(lp.heartCount || 1);

  // Song Cover + Title + Artist + Recommender
  const coverEl = document.getElementById('uc-detail-cover');
  applyLPCoverImage(coverEl, lp);

  const isThisPlaying = state.userCornerPlaying && state.userCornerActiveLP?.id === lp.id;
  document.getElementById('uc-song-cover-wrap').classList.toggle('spinning', isThisPlaying);

  document.getElementById('uc-detail-title').textContent = lp.title;
  document.getElementById('uc-detail-artist').textContent = `${lp.artist} · ${lp.year || 2024}`;

  const rec = lp.recommender || {};
  const recParts = [rec.name || '익명 디거', rec.age ? `${rec.age}세` : '', rec.city || ''].filter(Boolean);
  document.getElementById('uc-detail-recommender').textContent = `💌 추천인: ${recParts.join(' · ')}`;

  // 1st-Person Player Button & Live Indicator
  const playLabel = document.getElementById('uc-play-btn-label');
  const playBtn = document.getElementById('btn-uc-play-toggle');
  const liveDot = document.getElementById('uc-live-dot');
  playBtn.classList.toggle('playing', isThisPlaying);
  liveDot.classList.toggle('active', isThisPlaying);

  if (isThisPlaying) {
    playLabel.textContent = '⏸ 1인칭 사연곡 청음 중 (일시정지)';
  } else {
    playLabel.textContent = '▶ 이 사연의 노래 바로 듣기 (1인칭 청음)';
  }

  // External Full Song Service Links (YouTube Music, Spotify, Melon)
  const links = getMusicServiceLinks(lp);
  document.getElementById('uc-link-yt').href = links.youtubeMusic;
  document.getElementById('uc-link-spotify').href = links.spotify;
  document.getElementById('uc-link-melon').href = links.melon;

  // Story (Scene) & Lyric
  document.getElementById('uc-story-scene').textContent = lp.scene || lp.desc || '';

  const lyricBox = document.getElementById('uc-lyric-box');
  const lyricEl = document.getElementById('uc-story-lyric');
  if (lp.lyric && lp.lyric.trim()) {
    lyricBox.classList.remove('hidden');
    lyricEl.textContent = `"${lp.lyric.trim()}"`;
  } else {
    lyricBox.classList.add('hidden');
  }
}

function startUserCornerPlayback(lp, withNeedleDrop = true, isRemoteSync = false) {
  if (!lp) return;

  // Pause any table turntable that was playing
  state.tables.forEach((t) => {
    if (t.isPlaying) {
      t.isPlaying = false;
      world.updateTableTurntableVisual(t.id);
    }
  });
  state.playingTableId = null;

  state.userCornerPlaying = true;
  state.userCornerActiveLP = lp;

  world.updateUserCornerVisuals(state.userSongs, lp, true);
  audio.startTurntableLP(lp, lp.rpm || 33, withNeedleDrop);

  if (!isRemoteSync && mp) {
    mp.broadcastUserCornerPlayback(lp, true);
  }

  updateUserCornerInspector(lp);
  refreshNowPlayingBar();
}

function stopUserCornerPlayback(isRemoteSync = false) {
  state.userCornerPlaying = false;
  world.updateUserCornerVisuals(state.userSongs, state.userCornerActiveLP, false);
  audio.stopTurntable(true);

  if (!isRemoteSync && mp) {
    mp.broadcastUserCornerPlayback(state.userCornerActiveLP, false);
  }

  const currentLP = state.filteredUserSongs[state.selectedUserLPIndex];
  if (currentLP) updateUserCornerInspector(currentLP);
  refreshNowPlayingBar();
}

function handleHeartCurrentUserSong() {
  const lp = state.filteredUserSongs[state.selectedUserLPIndex];
  if (!lp) return;

  const alreadyLiked = !!state.heartState.likedIds[lp.id];
  if (alreadyLiked) {
    delete state.heartState.likedIds[lp.id];
    lp.heartCount = Math.max(1, (lp.heartCount || 1) - 1);
    showToast(`♡ [${lp.title}] 공감 하트를 취소했습니다.`);
  } else {
    state.heartState.likedIds[lp.id] = true;
    lp.heartCount = (lp.heartCount || 1) + 1;
    audio.playSleeveFlip();
    showToast(`♥ [${lp.recommender?.name || '익명'}]님의 사연과 '${lp.title}'에 공감 하트를 보냈습니다!`);
  }

  state.heartState.counts[lp.id] = lp.heartCount;
  saveHeartState(state.heartState);

  if (mp) {
    mp.broadcastUserSongHeart(lp.id, lp.heartCount);
  }

  // Update ribbon heart count on the active card
  const activeCardRibbonStrong = document.querySelector(
    `#uc-cards-stage .lp-sleeve-card[data-index="${state.selectedUserLPIndex}"] .uc-sleeve-ribbon strong`
  );
  if (activeCardRibbonStrong) {
    activeCardRibbonStrong.textContent = `♥ ${lp.heartCount}`;
  }

  updateUserCornerInspector(lp);
}

function pickCurrentUserCornerLP() {
  const lp = state.filteredUserSongs[state.selectedUserLPIndex];
  if (!lp) return;

  audio.playSleeveFlip();
  setHeldLP(lp);
  closeUserCornerUI(true);
  showToast(`💿 [${lp.recommender?.name || '익명'}]님의 추천곡 '${lp.title}' LP를 들었습니다! 원하는 테이블로 가서 올려보세요.`);
}

// =========================================================================
// 4-C. USER SONG & STORY RECOMMENDATION MODAL (Artist/Title Search + Story)
// =========================================================================
const recFormState = {
  candidates: [],
  selectedCandidate: null,
  matched: false,
  confirmed: false,
  contactType: 'instagram',
  previewingUrl: null
};

function setupRecommendSongModal() {
  const modal = document.getElementById('recommend-song-modal');
  const artistInput = document.getElementById('rec-artist-input');
  const titleInput = document.getElementById('rec-title-input');
  const btnSearch = document.getElementById('btn-rec-search');

  const closeModal = () => closeRecommendSongModal();
  document.getElementById('btn-close-recommend-modal').addEventListener('click', closeModal);
  document.getElementById('btn-rec-cancel').addEventListener('click', closeModal);

  // Trigger search by button or Enter key in artist/title inputs
  btnSearch.addEventListener('click', () => performRecommendSongSearch());
  [artistInput, titleInput].forEach((inp) => {
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        performRecommendSongSearch();
      }
    });
    inp.addEventListener('input', () => {
      hideFieldError('rec-err-song');
    });
  });

  // Confirmation card buttons (IS THIS RIGHT? YES ♥ / NO from yourmusic)
  document.getElementById('btn-rec-confirm-preview').addEventListener('click', () => {
    const cand = recFormState.selectedCandidate;
    if (!cand || !cand.previewUrl) {
      showToast('이 곡은 30초 미리듣기 음원이 없어 등록 시 아날로그 신스/YouTube로 재생됩니다.');
      return;
    }
    toggleCandidateSamplePreview(cand.previewUrl, document.getElementById('btn-rec-confirm-preview'));
  });

  document.getElementById('btn-rec-confirm-yes').addEventListener('click', () => {
    if (!recFormState.selectedCandidate) return;
    recFormState.confirmed = true;
    hideFieldError('rec-err-confirmed');

    const box = document.getElementById('rec-confirm-box');
    box.classList.add('is-confirmed');
    document.getElementById('rec-confirm-status-tag').textContent = '✓ CONFIRMED ♥ · 이 노래로 나만의 사연을 남깁니다';
    document.getElementById('btn-rec-confirm-yes').textContent = '✓ YES ♥ 선택 완료';
    audio.playSleeveFlip();
  });

  document.getElementById('btn-rec-confirm-no').addEventListener('click', () => {
    audio.stopQuickSample();
    recFormState.matched = false;
    recFormState.confirmed = false;
    recFormState.selectedCandidate = null;
    document.getElementById('rec-confirm-box').classList.add('hidden');
    document.getElementById('rec-confirm-box').classList.remove('is-confirmed');
    if (recFormState.candidates.length > 0) {
      document.getElementById('rec-results-wrap').classList.remove('hidden');
    }
  });

  // Contact type selector
  document.querySelectorAll('#rec-contact-type-group .contact-type-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#rec-contact-type-group .contact-type-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      recFormState.contactType = btn.dataset.type;
      const contactInput = document.getElementById('rec-contact-input');
      contactInput.placeholder = CONTACT_LABELS[recFormState.contactType]?.placeholder || '@아이디';
    });
  });

  document.getElementById('rec-scene-input').addEventListener('input', () => {
    hideFieldError('rec-err-scene');
  });

  // Submit recommendation
  document.getElementById('btn-rec-submit').addEventListener('click', () => {
    submitUserSongRecommendation();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

function openRecommendSongModal() {
  audio.stopQuickSample();
  const modal = document.getElementById('recommend-song-modal');
  modal.classList.remove('hidden');

  // Reset form errors
  ['rec-err-song', 'rec-err-confirmed', 'rec-err-scene', 'rec-err-contact', 'rec-err-privacy'].forEach(hideFieldError);
}

function closeRecommendSongModal() {
  audio.stopQuickSample();
  recFormState.previewingUrl = null;
  document.getElementById('recommend-song-modal').classList.add('hidden');
}

function showFieldError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = `⚠ ${msg}`;
  el.classList.remove('hidden');
}

function hideFieldError(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = '';
  el.classList.add('hidden');
}

async function performRecommendSongSearch() {
  const artist = document.getElementById('rec-artist-input').value.trim();
  const title = document.getElementById('rec-title-input').value.trim();
  const btnSearch = document.getElementById('btn-rec-search');
  const noteEl = document.getElementById('rec-search-note');

  hideFieldError('rec-err-song');
  hideFieldError('rec-err-confirmed');

  if (!artist && !title) {
    showFieldError('rec-err-song', '가수 이름이나 노래 제목 중 하나 이상을 입력해주세요.');
    return;
  }

  audio.stopQuickSample();
  btnSearch.disabled = true;
  btnSearch.textContent = '⏳ 검색 중...';
  noteEl.textContent = '🔍 LP바 카탈로그 및 글로벌 음원 아카이브에서 곡과 앨범 커버를 찾고 있습니다...';

  try {
    const searchRes = await searchSongsByArtistAndTitle(artist, title, state.shelves, state.userSongs, 8);
    const results = Array.isArray(searchRes) ? searchRes : (searchRes?.songs || []);
    recFormState.candidates = results;
    recFormState.matched = false;
    recFormState.confirmed = false;
    recFormState.selectedCandidate = null;

    document.getElementById('rec-confirm-box').classList.add('hidden');
    document.getElementById('rec-confirm-box').classList.remove('is-confirmed');

    renderRecommendSearchResults(results, artist, title);
    noteEl.textContent =
      results.length > 0
        ? `✨ 총 ${results.length}개의 노래를 찾았습니다. 미리듣기(▶)로 확인하거나 곡을 선택해주세요.`
        : '검색 결과가 없어도 입력한 가수·제목으로 직접 LP를 생성해 추천할 수 있습니다.';
  } catch (err) {
    console.warn('Search error:', err);
    renderRecommendSearchResults([], artist, title);
  } finally {
    btnSearch.disabled = false;
    btnSearch.textContent = '🔍 노래 찾기';
  }
}

function renderRecommendSearchResults(results, rawArtist, rawTitle) {
  const wrap = document.getElementById('rec-results-wrap');
  const list = document.getElementById('rec-results-list');
  const countEl = document.getElementById('rec-results-count');

  wrap.classList.remove('hidden');
  list.innerHTML = '';

  if (results.length === 0) {
    countEl.textContent = '검색 결과 0건 · 직접 입력한 곡으로 등록 가능';
    const customRow = document.createElement('div');
    customRow.className = 'rec-result-item custom-fallback';
    customRow.innerHTML = `
      <div class="rec-result-info">
        <strong>"${rawTitle || '무제'}" — ${rawArtist || '익명 아티스트'}</strong>
        <small>음원 DB에 없는 인디/미발매 곡도 커스텀 LP 자켓으로 바로 추천할 수 있습니다.</small>
      </div>
      <button type="button" class="btn-rec-pick">이 곡으로 선택</button>
    `;
    customRow.querySelector('.btn-rec-pick').addEventListener('click', () => {
      selectRecommendCandidate({
        artist: rawArtist || 'Unknown Artist',
        title: rawTitle || 'Untitled Track',
        album: 'Custom Vinyl Selection',
        year: new Date().getFullYear(),
        coverImage: '',
        previewUrl: '',
        youtubeId: '',
        spotifyTrackId: ''
      });
    });
    list.appendChild(customRow);
    return;
  }

  countEl.textContent = `검색 결과 (${results.length}곡)`;

  results.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'rec-result-item';

    const tempLP = normalizeUserSongToLP({
      artist: item.artist,
      title: item.title,
      coverImage: item.coverImage
    });

    const img = document.createElement('img');
    img.className = 'rec-result-thumb';
    applyLPCoverImage(img, tempLP);
    img.alt = item.title;

    const info = document.createElement('div');
    info.className = 'rec-result-info';
    info.innerHTML = `
      <strong>${item.title}</strong>
      <span>${item.artist}</span>
      <small>${item.album || 'Single / Album'} · ${item.year || ''}</small>
    `;

    const actions = document.createElement('div');
    actions.className = 'rec-result-actions';

    if (item.previewUrl) {
      const btnPrev = document.createElement('button');
      btnPrev.type = 'button';
      btnPrev.className = 'btn-rec-sample';
      btnPrev.textContent = '▶ 미리듣기';
      btnPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCandidateSamplePreview(item.previewUrl, btnPrev);
      });
      actions.appendChild(btnPrev);
    }

    const btnPick = document.createElement('button');
    btnPick.type = 'button';
    btnPick.className = 'btn-rec-pick';
    btnPick.textContent = '선택';
    btnPick.addEventListener('click', (e) => {
      e.stopPropagation();
      selectRecommendCandidate(item);
    });
    actions.appendChild(btnPick);

    row.appendChild(img);
    row.appendChild(info);
    row.appendChild(actions);

    row.addEventListener('click', () => selectRecommendCandidate(item));
    list.appendChild(row);
  });
}

function toggleCandidateSamplePreview(previewUrl, btnEl) {
  if (!previewUrl) return;
  if (recFormState.previewingUrl === previewUrl) {
    audio.stopQuickSample();
    recFormState.previewingUrl = null;
    if (btnEl) btnEl.textContent = '▶ 미리듣기';
    return;
  }

  // Reset all preview button labels
  document.querySelectorAll('.btn-rec-sample, #btn-rec-confirm-preview').forEach((b) => {
    b.textContent = b.id === 'btn-rec-confirm-preview' ? '▶ 30초 미리듣기' : '▶ 미리듣기';
  });

  recFormState.previewingUrl = previewUrl;
  if (btnEl) btnEl.textContent = '⏹ 정지';

  audio.playQuickSample(previewUrl, () => {
    recFormState.previewingUrl = null;
    if (btnEl) {
      btnEl.textContent = btnEl.id === 'btn-rec-confirm-preview' ? '▶ 30초 미리듣기' : '▶ 미리듣기';
    }
  });
}

function selectRecommendCandidate(item) {
  audio.stopQuickSample();
  recFormState.previewingUrl = null;
  recFormState.selectedCandidate = item;
  recFormState.matched = true;
  recFormState.confirmed = false;

  // Fill inputs with canonical artist & title
  document.getElementById('rec-artist-input').value = item.artist;
  document.getElementById('rec-title-input').value = item.title;

  hideFieldError('rec-err-song');
  hideFieldError('rec-err-confirmed');

  // Hide results list and show IS THIS RIGHT? confirmation box
  document.getElementById('rec-results-wrap').classList.add('hidden');
  const confirmBox = document.getElementById('rec-confirm-box');
  confirmBox.classList.remove('hidden');
  confirmBox.classList.remove('is-confirmed');

  document.getElementById('rec-confirm-status-tag').textContent = 'IS THIS RIGHT? · 이 노래가 맞나요? (YES ♥를 눌러 확정해주세요)';
  document.getElementById('btn-rec-confirm-yes').textContent = 'YES ♥ 맞아요';

  const tempLP = normalizeUserSongToLP({
    artist: item.artist,
    title: item.title,
    coverImage: item.coverImage
  });
  applyLPCoverImage(document.getElementById('rec-confirm-cover'), tempLP);

  document.getElementById('rec-confirm-title').textContent = item.title;
  document.getElementById('rec-confirm-artist').textContent = item.artist;
  document.getElementById('rec-confirm-album').textContent = `${item.album || 'Album'} · ${item.year || ''}`;

  const previewBtn = document.getElementById('btn-rec-confirm-preview');
  if (item.previewUrl) {
    previewBtn.classList.remove('hidden');
    previewBtn.textContent = '▶ 30초 미리듣기';
  } else {
    previewBtn.classList.add('hidden');
  }
}

async function submitUserSongRecommendation() {
  ['rec-err-song', 'rec-err-confirmed', 'rec-err-scene', 'rec-err-contact', 'rec-err-privacy'].forEach(hideFieldError);

  const artist = document.getElementById('rec-artist-input').value.trim();
  const title = document.getElementById('rec-title-input').value.trim();
  const scene = document.getElementById('rec-scene-input').value.trim();
  const lyric = document.getElementById('rec-lyric-input').value.trim();
  const name = document.getElementById('rec-name-input').value.trim() || '익명 디거';
  const age = document.getElementById('rec-age-input').value.trim();
  const city = document.getElementById('rec-city-input').value.trim() || '미드나잇 그루브';
  const contact = document.getElementById('rec-contact-input').value.trim();
  const privacyAgreed = document.getElementById('rec-privacy-chk').checked;

  const { valid, errors } = validateSongSubmission({
    artist,
    title,
    matched: recFormState.matched,
    confirmed: recFormState.confirmed,
    scene,
    contactType: recFormState.contactType,
    contact,
    privacyAgreed
  });

  if (!valid) {
    if (errors.song) showFieldError('rec-err-song', errors.song);
    if (errors.confirmed) showFieldError('rec-err-confirmed', errors.confirmed);
    if (errors.scene) showFieldError('rec-err-scene', errors.scene);
    if (errors.contact) showFieldError('rec-err-contact', errors.contact);
    if (errors.privacy) showFieldError('rec-err-privacy', errors.privacy);
    return;
  }

  const btnSubmit = document.getElementById('btn-rec-submit');
  btnSubmit.disabled = true;
  btnSubmit.textContent = '⏳ LP 자켓 각인 및 코너 등록 중...';

  try {
    const cand = recFormState.selectedCandidate || {};
    let coverImage = cand.coverImage || '';
    let previewUrl = cand.previewUrl || '';
    let spotifyTrackId = cand.spotifyTrackId || '';
    let year = cand.year || new Date().getFullYear();

    // If cover or preview wasn't populated yet, do a quick lookup
    if (!coverImage && !previewUrl) {
      const lookedUp = await lookupSongPreviewAndArt(artist, title);
      coverImage = lookedUp.coverImage || '';
      previewUrl = lookedUp.previewUrl || '';
      spotifyTrackId = lookedUp.spotifyTrackId || '';
      if (lookedUp.year) year = lookedUp.year;
    }

    const newSongLP = normalizeUserSongToLP(
      {
        id: 'user-custom-' + Date.now(),
        artist,
        title,
        year,
        scene,
        lyric,
        recommender: { name, age, city },
        coverImage,
        previewUrl,
        youtubeId: cand.youtubeId || '',
        spotifyTrackId,
        heartCount: 1,
        createdAt: new Date().toISOString().slice(0, 10)
      },
      0
    );

    // Save to localStorage and prepend to state
    persistCustomUserSong(newSongLP);
    state.userSongs.unshift(newSongLP);
    state.activeMoodFilter = 'all';
    state.filteredUserSongs = [...state.userSongs];
    state.selectedUserLPIndex = 0;

    // Also add a note to the Whiskey Coaster Guestbook so visitors see it there too
    const autoCoaster = {
      id: 'c-' + Date.now(),
      nickname: name,
      table: '💌 유저 사연 LP 코너',
      lpTitle: `${title} — ${artist}`,
      message: scene.length > 110 ? scene.slice(0, 110) + '…' : scene,
      time: '방금 추천됨'
    };
    state.coasters.unshift(autoCoaster);
    renderCoasterNotes();

    if (mp) {
      mp.broadcastUserSongAdded(newSongLP);
      mp.broadcastCoasterAdded(autoCoaster);
    }

    // Update 3D User LP Corner wall jackets & turntable
    world.updateUserCornerVisuals(state.userSongs, newSongLP, true);

    // Reset form fields
    document.getElementById('rec-artist-input').value = '';
    document.getElementById('rec-title-input').value = '';
    document.getElementById('rec-scene-input').value = '';
    document.getElementById('rec-lyric-input').value = '';
    document.getElementById('rec-contact-input').value = '';
    document.getElementById('rec-privacy-chk').checked = false;
    document.getElementById('rec-results-wrap').classList.add('hidden');
    document.getElementById('rec-confirm-box').classList.add('hidden');
    recFormState.candidates = [];
    recFormState.selectedCandidate = null;
    recFormState.matched = false;
    recFormState.confirmed = false;

    closeRecommendSongModal();

    // Immediately transition to 1st-Person User LP Corner & play the user's newly recommended song!
    world.enterUserCornerCloseup();
    openUserCornerUI(newSongLP.id);
    startUserCornerPlayback(newSongLP, true);

    const moodMeta = getMoodMeta(newSongLP.mood);
    showToast(`💌 [${name}]님의 추천곡 '${title}'이(가) [${moodMeta.emoji} ${moodMeta.shortKo}] LP 코너에 등록되어 재생됩니다!`);
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = '💿 사연과 함께 유저 LP 코너에 꽂기';
  }
}

// =========================================================================
// 5. TABLE & 3D TURNTABLE INTERACTION (2-Person & 4-Person Tables)
// =========================================================================
function isTableDJStillSeated(table) {
  if (!table || !table.djPeerId) return false;
  const myPeerId = mp?.peerId || 'local';
  if (table.djPeerId === myPeerId) {
    return state.seatedTable?.id === table.id;
  }
  if (mp && mp.peers) {
    const peer = mp.peers.get(table.djPeerId);
    if (peer && peer.isSeated && peer.seatedTableId === table.id) {
      return true;
    }
  }
  return false;
}

function canModifyTableTurntable(table) {
  if (!table) return false;
  // If no song is actively playing, anyone seated can place or play
  if (!table.isPlaying || !table.currentLP) return true;

  // If no DJ is recorded, anyone seated can modify
  if (!table.djPeerId) return true;

  // If the local user is the DJ, they have full control
  const myPeerId = mp?.peerId || 'local';
  if (table.djPeerId === myPeerId) return true;

  // If the DJ who started the song has left their seat, lock is released!
  if (!isTableDJStillSeated(table)) {
    return true;
  }

  // DJ is still seated and music is playing: cannot be modified by others!
  return false;
}

function getSeatedPeersCount(tableId) {
  let count = 0;
  if (mp && mp.peers) {
    for (const p of mp.peers.values()) {
      if (p.isSeated && p.seatedTableId === tableId) {
        count++;
      }
    }
  }
  return count;
}

function setupTableTurntableHUD() {
  document.getElementById('btn-leave-table').addEventListener('click', () => {
    closeTableTurntableHUD(true);
  });

  // Put currently held LP onto this table's turntable
  document.getElementById('btn-tt-put-held').addEventListener('click', () => {
    if (!state.seatedTable || !state.heldLP) return;
    const table = state.seatedTable;
    if (!canModifyTableTurntable(table)) {
      showToast(`⚠️ 현재 [${table.djNickname || '다른 손님'}]님이 재생 중입니다. 먼저 곡을 튼 분이 일시정지하거나 자리를 비우기 전에는 변경할 수 없습니다.`);
      return;
    }
    placeLPOnTableAndPlay(state.seatedTable, state.heldLP);
  });

  // Tonearm Needle Drop / Lift Toggle
  document.getElementById('btn-tt-needle').addEventListener('click', () => {
    if (!state.seatedTable) return;
    const table = state.seatedTable;

    if (!canModifyTableTurntable(table)) {
      showToast(`⚠️ 현재 [${table.djNickname || '다른 손님'}]님이 재생 중입니다. 먼저 곡을 튼 분이 일시정지하거나 자리를 비우기 전에는 변경할 수 없습니다.`);
      return;
    }

    // If table is empty and user has no held LP, load a random recommended LP so they can enjoy right away
    if (!table.currentLP) {
      if (state.heldLP) {
        placeLPOnTableAndPlay(table, state.heldLP);
        return;
      } else {
        const randomShelf = state.shelves[Math.floor(Math.random() * state.shelves.length)];
        const randomLP = randomShelf.records[Math.floor(Math.random() * randomShelf.records.length)];
        placeLPOnTableAndPlay(table, randomLP);
        showToast(`💿 테이블 추천 LP [${randomLP.title}]를 턴테이블에 올렸습니다.`);
        return;
      }
    }

    if (table.isPlaying) {
      stopTableTurntable(table);
    } else {
      startTableTurntable(table, true);
    }
  });

  // Quick go back to front shelves to pick another LP
  document.getElementById('btn-tt-quick-pick').addEventListener('click', () => {
    closeTableTurntableHUD(true);
    world.focusZone('shelves');
    showToast('📚 앞쪽 장르별 LP 책장으로 이동했습니다. 원하는 책장을 클릭해보세요!');
  });

  // RPM Switch (33 1/3 vs 45 RPM)
  const btn33 = document.getElementById('btn-rpm-33');
  const btn45 = document.getElementById('btn-rpm-45');
  btn33.addEventListener('click', () => {
    if (state.seatedTable && !canModifyTableTurntable(state.seatedTable)) {
      showToast(`⚠️ 현재 [${state.seatedTable.djNickname || '다른 손님'}]님이 재생 중입니다.`);
      return;
    }
    setTableRPM(33);
  });
  btn45.addEventListener('click', () => {
    if (state.seatedTable && !canModifyTableTurntable(state.seatedTable)) {
      showToast(`⚠️ 현재 [${state.seatedTable.djNickname || '다른 손님'}]님이 재생 중입니다.`);
      return;
    }
    setTableRPM(45);
  });

  // Crackle Slider inside Table HUD
  const crackleSlider = document.getElementById('tt-crackle-slider');
  crackleSlider.addEventListener('input', (e) => {
    const val = Number(e.target.value);
    syncCrackleLevel(val);
  });

  // Music Volume Slider inside Table HUD
  const musicSlider = document.getElementById('tt-music-slider');
  musicSlider.addEventListener('input', (e) => {
    const val = Number(e.target.value);
    syncMusicVolume(val);
  });

  // Audio Source Mode (Hybrid vs Built-in Analog Synth)
  const btnHybrid = document.getElementById('btn-source-hybrid');
  const btnSynth = document.getElementById('btn-source-synth');
  btnHybrid.addEventListener('click', () => {
    btnHybrid.classList.add('active');
    btnSynth.classList.remove('active');
    audio.setSourceMode('hybrid');
  });
  btnSynth.addEventListener('click', () => {
    btnSynth.classList.add('active');
    btnHybrid.classList.remove('active');
    audio.setSourceMode('synth');
  });
}

function handleCharacterSatAtTable(tableData) {
  state.seatedTable = tableData;
  closeShelfDiggingUI(false);
  closeUserCornerUI(false);
  document.getElementById('proximity-prompt').classList.add('hidden');
  document.getElementById('table-turntable-hud').classList.remove('hidden');

  const mobileLeaveBtn = document.getElementById('btn-mobile-leave');
  if (mobileLeaveBtn) mobileLeaveBtn.classList.remove('hidden');
  const mobileActBtn = document.getElementById('btn-mobile-interact');
  if (mobileActBtn) mobileActBtn.classList.add('hidden');

  setLocationStatus(`${tableData.name} 착석 중`);

  // Audio rule: The song playing at a table is ONLY heard when seated at that table!
  if (tableData.isPlaying && tableData.currentLP) {
    state.playingTableId = tableData.id;
    audio.startTurntableLP(tableData.currentLP, tableData.rpm, true);

    if (state.heldLP) {
      if (!canModifyTableTurntable(tableData)) {
        showToast(`🎧 [${tableData.code}]에 착석하여 [${tableData.djNickname || '다른 손님'}]님이 재생 중인 음악을 함께 듣습니다. (소지한 LP는 보관)`);
      } else {
        showToast(`🎧 [${tableData.code}]에 착석하여 재생 중인 '${tableData.currentLP.title}'을(를) 함께 듣습니다.`);
      }
    } else {
      showToast(`🎧 [${tableData.code}]에 착석하여 '${tableData.currentLP.title}'을(를) 함께 듣습니다.`);
    }
  } else {
    // If table is quiet, stop any previous table audio that was playing locally
    if (audio.isPlaying && state.playingTableId !== tableData.id) {
      audio.stopTurntable(false);
    }
    state.playingTableId = null;

    // If character carried an LP to an empty/quiet table, load and play it!
    if (state.heldLP) {
      const lpToPlay = state.heldLP;
      placeLPOnTableAndPlay(tableData, lpToPlay);
      showToast(`🪡 [${tableData.code}] 턴테이블에 '${lpToPlay.title}' LP를 올리고 바늘을 내려놓았습니다!`);
    } else {
      refreshTableHUD();
    }
  }

  refreshNowPlayingBar();
}

function placeLPOnTableAndPlay(tableData, lp) {
  if (!canModifyTableTurntable(tableData)) {
    showToast(`⚠️ 현재 [${tableData.djNickname || '다른 손님'}]님이 재생 중입니다. 먼저 곡을 튼 분이 일시정지하거나 자리를 비우기 전에는 변경할 수 없습니다.`);
    return;
  }

  // Stop User Corner turntable if it was playing
  if (state.userCornerPlaying) {
    state.userCornerPlaying = false;
    world.updateUserCornerVisuals(state.userSongs, state.userCornerActiveLP, false);
  }

  // Stop any other table that was previously playing
  state.tables.forEach((t) => {
    if (t.id !== tableData.id && t.isPlaying) {
      t.isPlaying = false;
      t.djPeerId = null;
      t.djNickname = null;
      world.updateTableTurntableVisual(t.id);
    }
  });

  tableData.currentLP = lp;
  tableData.rpm = lp.rpm || 33;
  tableData.djPeerId = mp ? mp.peerId : 'local';
  tableData.djNickname = getLocalNickname();

  // Clear held LP from character's hands since it's now on the turntable!
  if (state.heldLP && state.heldLP.id === lp.id) {
    setHeldLP(null);
  }

  startTableTurntable(tableData, true);
}

function startTableTurntable(tableData, withNeedleDrop = true, isRemoteSync = false) {
  if (!tableData.currentLP) return;

  // Stop User Corner turntable if it was playing
  if (state.userCornerPlaying) {
    state.userCornerPlaying = false;
    world.updateUserCornerVisuals(state.userSongs, state.userCornerActiveLP, false);
  }

  // Pause other tables
  state.tables.forEach((t) => {
    if (t.id !== tableData.id && t.isPlaying) {
      t.isPlaying = false;
      t.djPeerId = null;
      t.djNickname = null;
      world.updateTableTurntableVisual(t.id);
    }
  });

  tableData.isPlaying = true;
  if (!isRemoteSync && !tableData.djPeerId) {
    tableData.djPeerId = mp ? mp.peerId : 'local';
    tableData.djNickname = getLocalNickname();
  }

  world.updateTableTurntableVisual(tableData.id);

  // Audio rule: ONLY play audio if the local user is actually seated at this table!
  const isLocalUserSeatedHere = state.seatedTable?.id === tableData.id;
  if (isLocalUserSeatedHere) {
    state.playingTableId = tableData.id;
    audio.startTurntableLP(tableData.currentLP, tableData.rpm, withNeedleDrop);
  } else {
    // If not seated at this table, do NOT play table audio locally
    if (state.playingTableId === tableData.id) {
      audio.stopTurntable(false);
      state.playingTableId = null;
    }
  }

  if (!isRemoteSync && mp) {
    mp.broadcastTableUpdate(tableData, 'play');
  }

  refreshTableHUD();
  refreshNowPlayingBar();
}

function stopTableTurntable(tableData, isRemoteSync = false) {
  tableData.isPlaying = false;
  // DJ lock is released when paused
  tableData.djPeerId = null;
  tableData.djNickname = null;

  world.updateTableTurntableVisual(tableData.id);

  if (state.playingTableId === tableData.id || state.seatedTable?.id === tableData.id) {
    audio.stopTurntable(true);
    state.playingTableId = null;
  }

  if (!isRemoteSync && mp) {
    mp.broadcastTableUpdate(tableData, 'pause');
  }

  refreshTableHUD();
  refreshNowPlayingBar();
}

function setTableRPM(rpm) {
  if (state.seatedTable) {
    state.seatedTable.rpm = rpm;
    if (mp) {
      mp.broadcastTableUpdate(state.seatedTable, 'rpm');
    }
  }
  audio.setRPM(rpm);
  document.getElementById('btn-rpm-33').classList.toggle('active', rpm === 33);
  document.getElementById('btn-rpm-45').classList.toggle('active', rpm === 45);
}

function refreshTableHUD() {
  const table = state.seatedTable;
  if (!table) return;

  document.getElementById('tt-table-badge').textContent = table.typeLabel;
  document.getElementById('tt-table-name').textContent = table.name;

  const btnPutHeld = document.getElementById('btn-tt-put-held');
  if (state.heldLP) {
    btnPutHeld.classList.remove('hidden');
    btnPutHeld.querySelector('span').textContent = `💿 들고 있는 [${state.heldLP.title}] 올리기`;
  } else {
    btnPutHeld.classList.add('hidden');
  }

  const platterEl = document.getElementById('tt-mini-platter');
  const coverImg = document.getElementById('tt-current-cover');
  const emptyDisc = document.getElementById('tt-empty-disc');
  const stateLabel = document.getElementById('tt-state-label');
  const titleEl = document.getElementById('tt-track-title');
  const artistEl = document.getElementById('tt-track-artist');
  const needleLabel = document.getElementById('tt-needle-label');
  const storyBox = document.getElementById('tt-user-story-box');

  if (table.currentLP) {
    applyLPCoverImage(coverImg, table.currentLP);
    coverImg.classList.remove('hidden');
    emptyDisc.classList.add('hidden');
    platterEl.classList.toggle('spinning', table.isPlaying);

    const canModify = canModifyTableTurntable(table);
    if (!canModify) {
      stateLabel.textContent = `🔒 [${table.djNickname || '다른 손님'}]님이 재생 중 (${table.rpm} RPM · 변경 잠금)`;
      titleEl.textContent = table.currentLP.title;
      artistEl.textContent = `${table.currentLP.artist} · ${table.currentLP.year}`;
      needleLabel.textContent = `🔒 [${table.djNickname || '다른 손님'}]님 재생 중 (일시정지/퇴장 시 변경 가능)`;
      if (btnPutHeld) btnPutHeld.style.opacity = '0.5';
    } else {
      if (btnPutHeld) btnPutHeld.style.opacity = '1';
      stateLabel.textContent = table.isPlaying
        ? `🎵 턴테이블 회전 중 (${table.rpm} RPM · 치지직 ON)`
        : '⏸ 턴테이블에 LP 올려짐 (대기 중)';
      titleEl.textContent = table.currentLP.title;
      artistEl.textContent = `${table.currentLP.artist} · ${table.currentLP.year}`;
      needleLabel.textContent = table.isPlaying
        ? '🪡 톤암(바늘) 들어올리기 · 일시정지'
        : '🪡 톤암(바늘) 내려놓기 · 재생';
    }

    // Show user story box if this LP came from the User Story LP Corner
    if (table.currentLP.isUserRecommendation || table.currentLP.scene) {
      storyBox.classList.remove('hidden');
      const rec = table.currentLP.recommender || {};
      const recInfo = [rec.name || '익명 디거', rec.age ? `${rec.age}세` : '', rec.city || ''].filter(Boolean).join(' · ');
      document.getElementById('tt-user-story-recommender').textContent = `추천인: ${recInfo}`;
      document.getElementById('tt-user-story-scene').textContent = table.currentLP.scene || table.currentLP.desc || '';
      const lyricEl = document.getElementById('tt-user-story-lyric');
      if (table.currentLP.lyric) {
        lyricEl.classList.remove('hidden');
        lyricEl.textContent = `"${table.currentLP.lyric}"`;
      } else {
        lyricEl.classList.add('hidden');
      }
    } else {
      storyBox.classList.add('hidden');
    }
  } else {
    coverImg.classList.add('hidden');
    emptyDisc.classList.remove('hidden');
    platterEl.classList.remove('spinning');
    storyBox.classList.add('hidden');
    if (btnPutHeld) btnPutHeld.style.opacity = '1';

    stateLabel.textContent = '턴테이블 비어 있음';
    titleEl.textContent = '올려진 LP판이 없습니다';
    artistEl.textContent = '앞쪽 책장이나 유저 사연 LP 코너에서 LP를 골라오거나 바늘 버튼을 눌러보세요';
    needleLabel.textContent = '💿 테이블 추천 LP 올리고 바로 재생';
  }

  document.getElementById('btn-rpm-33').classList.toggle('active', table.rpm !== 45);
  document.getElementById('btn-rpm-45').classList.toggle('active', table.rpm === 45);
}

function handleCharacterLeftTable(table) {
  if (!table) return;

  // 1. Audio for this table immediately stops because the user is no longer seated!
  if (state.playingTableId === table.id) {
    audio.stopTurntable(true);
    state.playingTableId = null;
  }

  // 2. DJ status handling
  const myPeerId = mp?.peerId || 'local';
  const wasDJ = table.djPeerId === myPeerId;
  const othersSeated = getSeatedPeersCount(table.id);

  if (wasDJ) {
    table.djPeerId = null;
    table.djNickname = null;

    if (othersSeated > 0) {
      // Others are still seated: song keeps playing for them, DJ lock is released!
      if (mp) mp.broadcastTableUpdate(table, 'dj-leave');
    } else {
      // Table is now empty: stop the turntable
      table.isPlaying = false;
      world.updateTableTurntableVisual(table.id);
      if (mp) mp.broadcastTableUpdate(table, 'pause');
    }
  } else if (othersSeated === 0 && table.isPlaying) {
    table.isPlaying = false;
    table.djPeerId = null;
    table.djNickname = null;
    world.updateTableTurntableVisual(table.id);
    if (mp) mp.broadcastTableUpdate(table, 'pause');
  }

  refreshNowPlayingBar();
}

function handleWorldLeftTable(tableId) {
  const table = state.tables.find((t) => t.id === tableId) || state.seatedTable;
  state.seatedTable = null;
  document.getElementById('table-turntable-hud').classList.add('hidden');
  const mobileLeaveBtn = document.getElementById('btn-mobile-leave');
  if (mobileLeaveBtn) mobileLeaveBtn.classList.add('hidden');

  if (table) {
    handleCharacterLeftTable(table);
  }
}

function closeTableTurntableHUD(tellWorld = true) {
  const prevTable = state.seatedTable;
  state.seatedTable = null;
  document.getElementById('table-turntable-hud').classList.add('hidden');
  const mobileLeaveBtn = document.getElementById('btn-mobile-leave');
  if (mobileLeaveBtn) mobileLeaveBtn.classList.add('hidden');

  if (prevTable) {
    handleCharacterLeftTable(prevTable);
  }

  if (tellWorld) {
    world.leaveTable();
    highlightZoneButton('walk');
    setLocationStatus('LP바 라운지 산책 중');
  }
}

// =========================================================================
// 6. PERSISTENT BOTTOM NOW-PLAYING BAR
// =========================================================================
function setupNowPlayingBar() {
  document.getElementById('btn-np-toggle').addEventListener('click', () => {
    if (state.seatedTable) {
      const activeTable = state.seatedTable;
      if (!canModifyTableTurntable(activeTable)) {
        showToast(`⚠️ 현재 [${activeTable.djNickname || '다른 손님'}]님이 재생 중입니다. 먼저 곡을 튼 분이 일시정지하거나 자리를 비우기 전에는 변경할 수 없습니다.`);
        return;
      }
      if (activeTable.isPlaying) {
        stopTableTurntable(activeTable);
      } else {
        startTableTurntable(activeTable, true);
      }
      return;
    }

    if (state.userCornerActiveLP && state.openUserCorner) {
      if (state.userCornerPlaying) {
        stopUserCornerPlayback();
      } else {
        startUserCornerPlayback(state.userCornerActiveLP, true);
      }
      return;
    }

    showToast('🎧 음악을 제어하려면 해당 테이블에 착석해야 합니다.');
  });

  document.getElementById('btn-np-needle-drop').addEventListener('click', () => {
    if (state.seatedTable) {
      const activeTable = state.seatedTable;
      if (!canModifyTableTurntable(activeTable)) {
        showToast(`⚠️ 현재 [${activeTable.djNickname || '다른 손님'}]님이 재생 중입니다.`);
        return;
      }
      if (activeTable.currentLP) {
        startTableTurntable(activeTable, true);
        showToast('🪡 바늘을 LP 첫 트랙에 다시 내려놓았습니다 (툭— 치지직...)');
        return;
      }
    }
    if (state.userCornerActiveLP && state.openUserCorner) {
      startUserCornerPlayback(state.userCornerActiveLP, true);
      showToast('🪡 바늘을 사연 LP 첫 트랙에 다시 내려놓았습니다 (툭— 치지직...)');
    }
  });

  document.getElementById('btn-np-goto-table').addEventListener('click', () => {
    if (state.seatedTable) {
      showToast('🪑 이미 해당 테이블에 착석해 있습니다.');
      return;
    }
    const playingTable = state.tables.find((t) => t.isPlaying && t.currentLP) || state.tables.find((t) => t.id === state.playingTableId);
    if (playingTable) {
      closeShelfDiggingUI(false);
      closeUserCornerUI(false);
      world.sitAtTable(playingTable.id);
    } else if (state.userCornerActiveLP) {
      closeShelfDiggingUI(false);
      closeTableTurntableHUD(false);
      world.enterUserCornerCloseup();
      openUserCornerUI(state.userCornerActiveLP.id);
    }
  });

  document.getElementById('np-crackle-range').addEventListener('input', (e) => {
    syncCrackleLevel(Number(e.target.value));
  });

  document.getElementById('np-volume-range').addEventListener('input', (e) => {
    syncMusicVolume(Number(e.target.value));
  });
}

function refreshNowPlayingBar() {
  const bar = document.getElementById('now-playing-bar');
  const topIcon = document.getElementById('top-vinyl-icon');
  const btnToggle = document.getElementById('btn-np-toggle');
  const btnGoto = document.getElementById('btn-np-goto-table');

  // Case 1: Local player is seated at a table with an LP
  if (state.seatedTable && state.seatedTable.currentLP) {
    const table = state.seatedTable;
    bar.classList.remove('hidden');
    topIcon.classList.toggle('playing', table.isPlaying);

    const disc = document.getElementById('np-spinning-disc');
    disc.classList.toggle('paused', !table.isPlaying);

    applyLPCoverImage(document.getElementById('np-cover-img'), table.currentLP);
    const djTag = table.djNickname ? ` · DJ: ${table.djNickname}` : '';
    document.getElementById('np-table-tag').textContent = `${table.capacity}인석 ${table.code} 턴테이블 (착석 청음 중)${djTag}`;
    document.getElementById('np-title').textContent = table.currentLP.title;
    document.getElementById('np-artist').textContent = table.currentLP.artist;

    const canModify = canModifyTableTurntable(table);
    if (!canModify) {
      btnToggle.textContent = '🔒 재생 중 (잠금)';
      btnToggle.disabled = true;
    } else {
      btnToggle.disabled = false;
      btnToggle.textContent = table.isPlaying ? '⏸ 일시정지' : '▶ 다시 재생';
    }
    btnGoto.textContent = '🪑 현재 테이블';
    return;
  }

  // Case 2: User Corner 1st-person listening station
  if (state.userCornerPlaying && state.userCornerActiveLP) {
    bar.classList.remove('hidden');
    topIcon.classList.toggle('playing', true);

    const disc = document.getElementById('np-spinning-disc');
    disc.classList.toggle('paused', false);

    applyLPCoverImage(document.getElementById('np-cover-img'), state.userCornerActiveLP);
    const recName = state.userCornerActiveLP.recommender?.name || '익명 디거';
    document.getElementById('np-table-tag').textContent = `💌 유저 사연 코너 · ${recName}님의 추천 LP`;
    document.getElementById('np-title').textContent = state.userCornerActiveLP.title;
    document.getElementById('np-artist').textContent = state.userCornerActiveLP.artist;
    btnToggle.disabled = false;
    btnToggle.textContent = '⏸ 일시정지';
    btnGoto.textContent = '💌 1인칭 사연 코너';
    return;
  }

  // Case 3: Walking around in lounge, but some table in the bar is playing!
  // Audio is silent for the walking player; bar invites user to walk over and sit down to listen!
  const playingTable = state.tables.find((t) => t.isPlaying && t.currentLP);
  if (playingTable) {
    bar.classList.remove('hidden');
    topIcon.classList.remove('playing');

    const disc = document.getElementById('np-spinning-disc');
    disc.classList.add('paused');

    applyLPCoverImage(document.getElementById('np-cover-img'), playingTable.currentLP);
    const djTag = playingTable.djNickname ? ` · DJ: ${playingTable.djNickname}` : '';
    document.getElementById('np-table-tag').textContent = `🎵 ${playingTable.name} 재생 중 (착석 시 청음)${djTag}`;
    document.getElementById('np-title').textContent = playingTable.currentLP.title;
    document.getElementById('np-artist').textContent = playingTable.currentLP.artist;
    btnToggle.disabled = true;
    btnToggle.textContent = '🎧 착석 시 들림';
    btnGoto.textContent = '🪑 해당 테이블로 가기';
    return;
  }

  // Case 4: No playback anywhere
  bar.classList.add('hidden');
  topIcon.classList.remove('playing');
}

function syncCrackleLevel(percent) {
  audio.setAmbientVolume('crackle', percent / 100);
  document.getElementById('tt-crackle-val').textContent = `${percent}%`;
  document.getElementById('tt-crackle-slider').value = percent;
  document.getElementById('np-crackle-range').value = percent;
  document.getElementById('amb-val-crackle').textContent = `${percent}%`;
  const ambCrackle = document.querySelector('.amb-slider[data-channel="crackle"]');
  if (ambCrackle) ambCrackle.value = percent;
}

function syncMusicVolume(percent) {
  audio.setMusicVolume(percent / 100);
  document.getElementById('tt-music-val').textContent = `${percent}%`;
  document.getElementById('tt-music-slider').value = percent;
  document.getElementById('np-volume-range').value = percent;
}

// =========================================================================
// 7. AMBIENT SOUND MIXER DRAWER (Moodist Style)
// =========================================================================
function setupAmbientDrawer() {
  const drawer = document.getElementById('ambient-drawer');
  const coasterDrawer = document.getElementById('coaster-drawer');

  document.getElementById('btn-toggle-ambient').addEventListener('click', () => {
    coasterDrawer.classList.add('hidden');
    drawer.classList.toggle('hidden');
  });

  document.getElementById('btn-close-ambient').addEventListener('click', () => {
    drawer.classList.add('hidden');
  });

  const btnNextBgJazz = document.getElementById('btn-next-bg-jazz');
  if (btnNextBgJazz) {
    btnNextBgJazz.addEventListener('click', () => {
      const next = audio.nextBackgroundJazzTrack();
      if (next) {
        showToast(`🎷 잔잔한 재즈 배경음 전환: [${next.title} — ${next.artist}]`);
      }
    });
  }

  document.querySelectorAll('.amb-slider').forEach((slider) => {
    slider.addEventListener('input', (e) => {
      const ch = e.target.dataset.channel;
      const val = Number(e.target.value);
      if (ch === 'crackle') {
        syncCrackleLevel(val);
      } else {
        audio.setAmbientVolume(ch, val / 100);
        const label = document.getElementById(`amb-val-${ch}`);
        if (label) label.textContent = `${val}%`;
      }
    });
  });

  // Moodist Presets (Default cozy: ONLY calm jazz BGM in background; crackle ONLY when playing a song)
  const presets = {
    cozy: { bgJazz: 48, crackle: 65, rain: 0, murmur: 0, ice: 0, fire: 0 },
    rainy: { bgJazz: 45, crackle: 65, rain: 40, murmur: 0, ice: 0, fire: 0 },
    'pure-vinyl': { bgJazz: 40, crackle: 85, rain: 0, murmur: 0, ice: 0, fire: 0 }
  };

  document.querySelectorAll('.preset-chip[data-preset]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const p = presets[chip.dataset.preset];
      if (!p) return;
      Object.entries(p).forEach(([ch, val]) => {
        if (ch === 'crackle') {
          syncCrackleLevel(val);
        } else {
          audio.setAmbientVolume(ch, val / 100);
          const s = document.querySelector(`.amb-slider[data-channel="${ch}"]`);
          if (s) s.value = val;
          const l = document.getElementById(`amb-val-${ch}`);
          if (l) l.textContent = `${val}%`;
        }
      });
      showToast(`🎚️ 사운드 프리셋 [${chip.textContent}] 적용 완료`);
    });
  });
}

// =========================================================================
// 8. WHISKEY COASTER GUESTBOOK
// =========================================================================
function setupCoasterGuestbook() {
  const drawer = document.getElementById('coaster-drawer');
  const ambientDrawer = document.getElementById('ambient-drawer');

  document.getElementById('btn-toggle-coaster').addEventListener('click', () => {
    ambientDrawer.classList.add('hidden');
    drawer.classList.toggle('hidden');
    renderCoasterNotes();
  });

  document.getElementById('btn-close-coaster').addEventListener('click', () => {
    drawer.classList.add('hidden');
  });

  document.getElementById('coaster-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const nick = document.getElementById('coaster-nickname').value.trim();
    const table = document.getElementById('coaster-table-select').value;
    const msg = document.getElementById('coaster-message').value.trim();
    if (!nick || !msg) return;

    const activeTable = state.tables.find((t) => t.id === state.playingTableId);
    const currentLP = state.heldLP || activeTable?.currentLP || state.userCornerActiveLP;
    const lpTitle = currentLP
      ? `${currentLP.title} — ${currentLP.artist}`
      : 'Midnight Groove House Vinyl';

    const newCoaster = {
      id: 'c-' + Date.now(),
      nickname: nick,
      table,
      lpTitle,
      message: msg,
      time: '방금 전'
    };

    state.coasters.unshift(newCoaster);

    if (mp) {
      mp.broadcastCoasterAdded(newCoaster);
    }

    document.getElementById('coaster-message').value = '';
    renderCoasterNotes();
    showToast('🥃 위스키 코스터에 오늘 밤의 사연과 추천곡을 남겼습니다!');
  });

  renderCoasterNotes();
}

function renderCoasterNotes() {
  const list = document.getElementById('coaster-list');
  list.innerHTML = '';
  state.coasters.forEach((c) => {
    const card = document.createElement('div');
    card.className = 'coaster-card';
    card.innerHTML = `
      <div class="coaster-card-top">
        <strong>🥃 ${escapeHTML(c.nickname)} · ${escapeHTML(c.table)}</strong>
        <span>${escapeHTML(c.time)}</span>
      </div>
      <div class="coaster-card-lp">💿 ${escapeHTML(c.lpTitle)}</div>
      <p>${escapeHTML(c.message)}</p>
    `;
    list.appendChild(card);
  });
}

// =========================================================================
// 9. CUSTOM YOUTUBE LP MODAL
// =========================================================================
function setupCustomLPModal() {
  const modal = document.getElementById('custom-lp-modal');

  document.getElementById('btn-open-custom-lp').addEventListener('click', () => {
    modal.classList.remove('hidden');
  });

  const closeModal = () => modal.classList.add('hidden');
  document.getElementById('btn-close-custom-lp').addEventListener('click', closeModal);
  document.getElementById('btn-cancel-custom-lp').addEventListener('click', closeModal);

  document.getElementById('custom-lp-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('custom-lp-title').value.trim();
    const artist = document.getElementById('custom-lp-artist').value.trim();
    const rawYt = document.getElementById('custom-lp-yt').value.trim();
    const desc = document.getElementById('custom-lp-desc').value.trim() || '직접 책장에 꽂아둔 나만의 추천 LP 음반입니다.';

    if (!title || !artist || !state.openShelf) return;

    // Extract 11-char YouTube Video ID if full URL was pasted
    let youtubeId = '';
    if (rawYt) {
      const match = rawYt.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
      youtubeId = match ? match[1] : rawYt.slice(0, 11);
    }

    const newLP = {
      id: 'custom-' + Date.now(),
      title,
      artist,
      year: new Date().getFullYear(),
      rpm: 33,
      tags: ['Custom Vinyl', state.openShelf.koName],
      youtubeId,
      palette: ['#241932', state.openShelf.accent, '#f5ebe0'],
      motif: 'neon-sunset',
      synth: { style: 'lofi-chill', bpm: 86, root: 62, prog: [[0, 4, 7, 11], [5, 9, 12, 16], [2, 5, 9, 12], [7, 11, 14, 17]] },
      desc
    };

    state.openShelf.records.unshift(newLP);
    state.selectedLPIndex = 0;
    closeModal();
    e.target.reset();
    renderShelfCrateCards();
    showToast(`💿 [${title}] LP가 ${state.openShelf.koName} 책장에 추가되었습니다!`);
  });
}

// =========================================================================
// 9-B. REAL-TIME MULTIPLAYER SYNCHRONIZATION & LOUNGE CHAT
// =========================================================================
// Remote data arrives from a public relay, so always escape before inserting into HTML
function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getLocalNickname() {
  return mp?.localState?.nickname || '익명의 디거';
}

function updateLocalNickname(nick) {
  const safeNick = (nick || '').trim().slice(0, 16) || getLocalNickname();
  const applied = mp ? mp.setNickname(safeNick) : safeNick;
  if (world) {
    world.updateLocalPlayerLabel(applied);
  }
  const myNickEl = document.getElementById('mp-my-nickname');
  if (myNickEl) myNickEl.textContent = applied;
  if (mp) renderPeerChips(mp.getPeersArray());
}

// Resolve a lightweight LP reference (id/title/artist) received from the network into the full local LP object
function resolveLPReference(lpRef) {
  if (!lpRef || !lpRef.id) return lpRef || null;
  for (const shelf of state.shelves) {
    const found = shelf.records.find((r) => r.id === lpRef.id);
    if (found) return found;
  }
  const userFound = state.userSongs.find((s) => s.id === lpRef.id);
  return userFound || lpRef;
}

function applyRemotePeerToWorld(peerData) {
  if (!world || !peerData) return;
  world.updateRemotePeer({
    ...peerData,
    heldLP: resolveLPReference(peerData.heldLP)
  });
}

function setupMultiplayerSync() {
  const connBadge = document.getElementById('mp-conn-badge');
  const liveDot = document.getElementById('mp-live-dot');
  const panelDot = document.getElementById('mp-panel-dot');
  const seenPeerStatus = new Map();

  mp = new MultiplayerSync({
    // 1. Connection status
    onConnectionChange: (connected) => {
      if (connBadge) {
        connBadge.textContent = connected ? '실시간 동기화' : '재연결 중';
        connBadge.classList.toggle('online', connected);
      }
      if (liveDot) liveDot.classList.toggle('online', connected);
      if (panelDot) panelDot.classList.toggle('online', connected);
    },

    // 2. Peer joins & state updates
    onPeerUpdate: (peerData, isNew) => {
      applyRemotePeerToWorld(peerData);

      // Refresh peer chips only when a peer's visible status changes (not on every movement packet)
      const statusKey = `${peerData.nickname}|${peerData.gender}|${peerData.isSeated}|${peerData.seatedTableId}`;
      if (seenPeerStatus.get(peerData.peerId) !== statusKey) {
        seenPeerStatus.set(peerData.peerId, statusKey);
        renderPeerChips(mp.getPeersArray());
      }

      if (isNew) {
        const nick = peerData.nickname || '새로운 디거';
        appendChatMessage({ sender: 'system', text: `👋 [${nick}]님이 LP바에 입장했습니다.` });
        showToast(`👋 [${nick}]님이 LP바에 입장했습니다.`);
      }
    },

    onPeerLeave: (peerId, peerData) => {
      seenPeerStatus.delete(peerId);
      if (world) world.removeRemotePeer(peerId);
      appendChatMessage({ sender: 'system', text: `🚪 [${peerData?.nickname || '디거'}]님이 퇴장했습니다.` });

      // If this peer was the DJ of any table, clear their DJ lock
      state.tables.forEach((t) => {
        if (t.djPeerId === peerId) {
          t.djPeerId = null;
          t.djNickname = null;
          // If no one is seated at this table anymore, stop the turntable
          if (getSeatedPeersCount(t.id) === 0 && state.seatedTable?.id !== t.id && t.isPlaying) {
            t.isPlaying = false;
            if (world) world.updateTableTurntableVisual(t.id);
          }
        }
      });
      if (state.seatedTable) refreshTableHUD();
      refreshNowPlayingBar();
    },

    // 3. Online count
    onPeersCountChange: (count, peers) => {
      const onlineCountEl = document.getElementById('mp-online-count');
      const panelCountEl = document.getElementById('mp-panel-count');
      if (onlineCountEl) onlineCountEl.textContent = String(count);
      if (panelCountEl) panelCountEl.textContent = String(count);
      renderPeerChips(peers);
    },

    // 4. Chat messages (log + 3D speech bubble above the sender)
    onChatMessage: (msg) => {
      appendChatMessage(msg);
      if (world && msg.peerId) world.showRemoteChatBubble(msg.peerId, msg.text);
    },

    // 5. Table turntable sync
    onTableUpdate: (payload) => {
      const table = state.tables.find((t) => t.id === payload.tableId);
      if (!table) return;

      table.currentLP = resolveLPReference(payload.currentLP);
      table.rpm = payload.rpm === 45 ? 45 : 33;
      table.isPlaying = Boolean(payload.isPlaying) && Boolean(table.currentLP);
      if (payload.djPeerId !== undefined) {
        table.djPeerId = payload.djPeerId;
      }
      if (payload.djNickname !== undefined) {
        table.djNickname = payload.djNickname;
      }

      if (world) world.updateTableTurntableVisual(table.id);

      // Audio rule: The song playing at a table is ONLY heard when seated at that table!
      const iAmSeatedHere = state.seatedTable?.id === table.id;

      if (iAmSeatedHere) {
        if (table.isPlaying) {
          if (state.userCornerPlaying) {
            state.userCornerPlaying = false;
            if (world) world.updateUserCornerVisuals(state.userSongs, state.userCornerActiveLP, false);
          }
          state.playingTableId = table.id;
          audio.startTurntableLP(table.currentLP, table.rpm, true);
        } else {
          audio.stopTurntable(true);
          state.playingTableId = null;
        }
        refreshTableHUD();
        refreshNowPlayingBar();
      } else {
        // I am NOT seated at this table: ensure my local audio is silent!
        if (state.playingTableId === table.id) {
          audio.stopTurntable(true);
          state.playingTableId = null;
          refreshNowPlayingBar();
        }
      }

      if (payload.actionType === 'play' && table.currentLP) {
        showToast(`🎵 [${payload.nickname || '디거'}]님이 ${table.name}에서 '${table.currentLP.title}'을(를) 재생했습니다.`);
      }
    },

    // 6. User song & story recommendation sync
    onUserSongAdded: (payload) => {
      const newSong = payload.song;
      if (!newSong || !newSong.id) return;
      if (state.userSongs.some((s) => s.id === newSong.id)) return;

      state.userSongs.unshift(newSong);
      state.filteredUserSongs =
        state.activeMoodFilter === 'all'
          ? [...state.userSongs]
          : state.userSongs.filter((s) => s.mood === state.activeMoodFilter);

      if (world) {
        world.updateUserCornerVisuals(state.userSongs, state.userCornerActiveLP, state.userCornerPlaying);
      }
      if (state.openUserCorner) {
        syncMoodTabButtons();
        renderUserCornerCrateCards(false);
      }
      const recName = newSong.recommender?.name || payload.nickname || '유저';
      appendChatMessage({ sender: 'system', text: `💌 [${recName}]님이 새 사연곡 '${newSong.title}'을(를) 추천했습니다!` });
      showToast(`💌 [${recName}]님이 새 사연곡 '${newSong.title}'을(를) 추천했습니다!`);
    },

    onUserSongHeart: (payload) => {
      const song = state.userSongs.find((s) => s.id === payload.songId);
      if (!song || !Number.isFinite(payload.heartCount)) return;
      song.heartCount = payload.heartCount;
      state.heartState.counts[song.id] = payload.heartCount;
      saveHeartState(state.heartState);
      if (state.openUserCorner) {
        const cur = state.filteredUserSongs[state.selectedUserLPIndex];
        if (cur && cur.id === song.id) {
          const hcEl = document.getElementById('uc-heart-count');
          if (hcEl) hcEl.textContent = String(song.heartCount);
        }
      }
    },

    // 7. User Corner playback: visual-only sync (each visitor's 1st-person listening stays personal)
    onUserCornerPlayback: (payload) => {
      if (!world || state.userCornerPlaying) return;
      world.updateUserCornerVisuals(state.userSongs, resolveLPReference(payload.activeLP), Boolean(payload.isPlaying));
    },

    // 8. Whiskey coaster guestbook sync
    onCoasterAdded: (payload) => {
      const note = payload.coaster;
      if (!note || !note.id) return;
      if (state.coasters.some((c) => c.id === note.id)) return;
      state.coasters.unshift(note);
      renderCoasterNotes();
      showToast(`🥃 [${note.nickname}]님이 방명록 코스터를 남겼습니다.`);
    },

    // 9. Mood lighting sync
    onMoodChanged: (payload) => {
      if (!world || !Number.isFinite(payload.moodIndex)) return;
      const moodName = world.setMoodByIndex(payload.moodIndex);
      const moodNameEl = document.getElementById('mood-name');
      if (moodNameEl) moodNameEl.textContent = moodName;
      showToast(`🕯️ [${payload.nickname || '디거'}]님이 조명을 [${moodName}] 모드로 바꿨습니다.`);
    },

    // 10. Late-joiner state snapshot
    onStateRequest: () => {
      mp.sendStateSnapshot({
        tables: state.tables.map((t) => ({
          id: t.id,
          currentLP: t.currentLP,
          isPlaying: Boolean(t.isPlaying),
          rpm: t.rpm,
          djPeerId: t.djPeerId || null,
          djNickname: t.djNickname || null
        })),
        coasters: state.coasters.slice(0, 15),
        moodIndex: world ? world.moodIndex : 0
      });
    },

    onStateSnapshot: (snap) => {
      if (Array.isArray(snap.tables)) {
        snap.tables.forEach((st) => {
          const localT = state.tables.find((t) => t.id === st.id);
          // Only adopt remote table visuals; don't hijack local audio
          if (localT && st.currentLP && state.playingTableId !== localT.id) {
            localT.currentLP = resolveLPReference(st.currentLP);
            localT.isPlaying = Boolean(st.isPlaying);
            localT.rpm = st.rpm === 45 ? 45 : 33;
            localT.djPeerId = st.djPeerId || null;
            localT.djNickname = st.djNickname || null;
            if (world) world.updateTableTurntableVisual(localT.id);
          }
        });
      }
      if (Array.isArray(snap.coasters) && snap.coasters.length > 0) {
        let added = false;
        snap.coasters.forEach((c) => {
          if (c && c.id && !state.coasters.some((ex) => ex.id === c.id)) {
            state.coasters.push(c);
            added = true;
          }
        });
        if (added) renderCoasterNotes();
      }
      if (Number.isFinite(snap.moodIndex) && world) {
        const moodName = world.setMoodByIndex(snap.moodIndex);
        const moodNameEl = document.getElementById('mood-name');
        if (moodNameEl) moodNameEl.textContent = moodName;
      }
    }
  });

  const initialNick = getLocalNickname();
  const myNickEl = document.getElementById('mp-my-nickname');
  if (myNickEl) myNickEl.textContent = initialNick;
  if (world) world.updateLocalPlayerLabel(initialNick);

  renderPeerChips([]);
  setupChatUI();
}

function renderPeerChips(peers) {
  const container = document.getElementById('mp-peer-chips');
  if (!container) return;
  container.innerHTML = '';

  const myChip = document.createElement('div');
  myChip.className = 'mp-peer-chip my-chip';
  const myGenderIcon = world?.playerGender === 'female' ? '👧' : '👦';
  myChip.innerHTML = `<span class="peer-gender">${myGenderIcon}</span><strong>${escapeHTML(getLocalNickname())}</strong><small>(나)</small>`;
  container.appendChild(myChip);

  (peers || []).forEach((peer) => {
    const chip = document.createElement('div');
    chip.className = 'mp-peer-chip';
    const pGenderIcon = peer.gender === 'female' ? '👧' : '👦';
    const tableName = peer.isSeated ? state.tables.find((t) => t.id === peer.seatedTableId)?.code : '';
    const statusText = tableName ? ` · ${tableName} 착석` : '';
    chip.innerHTML = `<span class="peer-gender">${pGenderIcon}</span><span>${escapeHTML(peer.nickname || '디거')}</span><small>${escapeHTML(statusText)}</small>`;
    container.appendChild(chip);
  });
}

function appendChatMessage(msg) {
  const container = document.getElementById('mp-chat-messages');
  if (!container) return;

  const div = document.createElement('div');
  if (msg.sender === 'system') {
    div.className = 'mp-msg mp-msg-system';
    div.innerHTML = `<span>${escapeHTML(msg.text)}</span>`;
  } else {
    const isMe = msg.peerId && msg.peerId === mp?.peerId;
    div.className = `mp-msg ${isMe ? 'mp-msg-mine' : 'mp-msg-peer'}`;
    const timeStr = new Date(msg.ts || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = `
      <div class="mp-msg-sender">${isMe ? '★ 나' : escapeHTML(msg.nickname || '디거')} <time>${timeStr}</time></div>
      <div class="mp-msg-content">${escapeHTML(msg.text)}</div>
    `;
  }
  container.appendChild(div);

  // Keep the log bounded
  while (container.children.length > 80) {
    container.removeChild(container.firstChild);
  }
  container.scrollTop = container.scrollHeight;
}

function setupChatUI() {
  const panel = document.getElementById('mp-chat-panel');
  const btnToggle = document.getElementById('btn-toggle-mp-chat');
  const pillBtn = document.getElementById('mp-online-pill');
  const chatForm = document.getElementById('mp-chat-form');
  const chatInput = document.getElementById('mp-chat-input');

  const togglePanel = () => {
    if (!panel) return;
    panel.classList.toggle('collapsed');
    if (btnToggle) {
      btnToggle.textContent = panel.classList.contains('collapsed') ? '▴' : '▾';
    }
  };

  if (btnToggle) btnToggle.addEventListener('click', togglePanel);
  if (pillBtn) pillBtn.addEventListener('click', togglePanel);

  if (chatForm && chatInput) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;

      if (mp) mp.broadcastChatMessage(text);
      if (world) world.updateLocalPlayerLabel(getLocalNickname(), text);
      appendChatMessage({
        peerId: mp?.peerId,
        nickname: getLocalNickname(),
        text,
        ts: Date.now()
      });
      chatInput.value = '';
      // Return focus to the 3D world so WASD works immediately after sending
      chatInput.blur();
    });

    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') chatInput.blur();
    });
  }
}

// =========================================================================
// 10. GLOBAL KEYBOARD SHORTCUTS (Shelf, 1st-Person User Corner & World)
// =========================================================================
function isTypingInTextField() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') {
    const type = (el.type || 'text').toLowerCase();
    return ['text', 'search', 'email', 'tel', 'url', 'password', 'number'].includes(type);
  }
  return el.isContentEditable === true;
}

function setupGlobalHotkeys() {
  // Automatically blur buttons, checkboxes, and range sliders after click/change
  // so they never trap keyboard focus or block WASD / Space / Enter / ESC shortcuts
  document.addEventListener('click', (e) => {
    const target = e.target?.closest?.('button, input[type="checkbox"], input[type="range"]');
    if (target && typeof target.blur === 'function') {
      target.blur();
    }
  });

  document.addEventListener('change', (e) => {
    const target = e.target;
    if (target && target.tagName === 'INPUT' && ['range', 'checkbox'].includes((target.type || '').toLowerCase())) {
      target.blur?.();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (isTypingInTextField()) return;

    const code = e.code;
    const key = e.key;

    const isLeft = code === 'ArrowLeft' || key === 'ArrowLeft' || code === 'KeyA' || key === 'a' || key === 'A' || key === 'ㅁ';
    const isRight = code === 'ArrowRight' || key === 'ArrowRight' || code === 'KeyD' || key === 'd' || key === 'D' || key === 'ㅇ';
    const isSpace = code === 'Space' || key === ' ';
    const isEnter = code === 'Enter' || key === 'Enter';
    const isE = code === 'KeyE' || key === 'e' || key === 'E' || key === 'ㄷ' || key === 'ㄸ';
    const isEsc = code === 'Escape' || key === 'Escape';
    const isP = code === 'KeyP' || key === 'p' || key === 'P' || key === 'ㅔ' || key === 'ㅖ';
    const isH = code === 'KeyH' || key === 'h' || key === 'H' || key === 'ㅗ';

    // If Entrance Overlay is still visible, Enter or Space enters the bar
    const entranceOverlay = document.getElementById('entrance-overlay');
    if (entranceOverlay && !entranceOverlay.classList.contains('hidden')) {
      if (isEnter || isSpace) {
        e.preventDefault();
        document.getElementById('btn-enter-bar')?.click();
      }
      return;
    }

    // If Recommend Song Modal or Custom LP Modal is open, Escape closes it
    const recModal = document.getElementById('recommend-song-modal');
    if (recModal && !recModal.classList.contains('hidden')) {
      if (isEsc) {
        e.preventDefault();
        closeRecommendSongModal();
      }
      return;
    }

    const customModal = document.getElementById('custom-lp-modal');
    if (customModal && !customModal.classList.contains('hidden')) {
      if (isEsc) {
        e.preventDefault();
        customModal.classList.add('hidden');
      }
      return;
    }

    // A) When inside 1st-Person User Story LP Corner View:
    if (state.openUserCorner) {
      if (isLeft) {
        e.preventDefault();
        flipUserCornerLP(-1);
      } else if (isRight) {
        e.preventDefault();
        flipUserCornerLP(1);
      } else if (isSpace) {
        e.preventDefault();
        triggerRandomUserCornerFlip();
      } else if (isEnter || isE) {
        e.preventDefault();
        pickCurrentUserCornerLP();
      } else if (isP) {
        e.preventDefault();
        document.getElementById('btn-uc-play-toggle')?.click();
      } else if (isH) {
        e.preventDefault();
        handleHeartCurrentUserSong();
      } else if (isEsc) {
        e.preventDefault();
        closeUserCornerUI(true);
      }
      return;
    }

    // B) When inside Shelf Close-Up View:
    if (state.openShelf) {
      if (isLeft) {
        e.preventDefault();
        flipShelfLP(-1);
      } else if (isRight) {
        e.preventDefault();
        flipShelfLP(1);
      } else if (isSpace) {
        e.preventDefault();
        triggerRandomShelfFlip();
      } else if (isEnter || isE) {
        e.preventDefault();
        pickCurrentShelfLP();
      } else if (isEsc) {
        e.preventDefault();
        closeShelfDiggingUI(true);
      }
      return;
    }

    // C) When Seated at a Table:
    if (state.seatedTable) {
      if (isEsc || isE) {
        e.preventDefault();
        closeTableTurntableHUD(true);
      } else if (isSpace || isEnter) {
        e.preventDefault();
        if (state.heldLP) {
          placeLPOnTableAndPlay(state.seatedTable, state.heldLP);
        } else {
          document.getElementById('btn-tt-needle')?.click();
        }
      }
      return;
    }

    // D) Quick Zone Number Shortcuts (1 ~ 5) while walking
    if (code === 'Digit1' || key === '1') {
      document.getElementById('btn-zone-walk')?.click();
      return;
    }
    if (code === 'Digit2' || key === '2') {
      document.getElementById('btn-zone-user-corner')?.click();
      return;
    }
    if (code === 'Digit3' || key === '3') {
      document.getElementById('btn-zone-shelves')?.click();
      return;
    }
    if (code === 'Digit4' || key === '4') {
      document.getElementById('btn-zone-2p')?.click();
      return;
    }
    if (code === 'Digit5' || key === '5') {
      document.getElementById('btn-zone-4p')?.click();
      return;
    }

    // E) When Walking in the 3D Bar: E, Space, or Enter interacts with nearest Shelf, User Corner, or Table
    if (isE || isSpace || isEnter) {
      const near = world.nearestInteractable;
      if (near) {
        e.preventDefault();
        if (near.type === 'user-corner') {
          world.enterUserCornerCloseup();
        } else if (near.type === 'shelf') {
          world.enterShelfCloseup(near.id);
        } else if (near.type === 'table') {
          world.sitAtTable(near.id);
        }
      }
    }
  });
}

// =========================================================================
// 11. MOBILE DETECTION & SCREEN TOUCH CONTROLS (Joystick, Gestures, Actions)
// =========================================================================
function detectMobileDevice() {
  const uaMatch = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const touchMatch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const narrowScreen = window.innerWidth <= 1024;
  return uaMatch || (touchMatch && narrowScreen);
}

function setupMobileControls() {
  const isMobile = detectMobileDevice();
  const layer = document.getElementById('mobile-controls-layer');
  if (isMobile) {
    document.body.classList.add('is-mobile');
    if (layer && !state.openShelf && !state.openUserCorner) {
      layer.classList.remove('hidden');
    }
  }

  window.addEventListener('resize', () => {
    const nowMobile = detectMobileDevice();
    document.body.classList.toggle('is-mobile', nowMobile);
    if (layer) {
      if (nowMobile && !state.openShelf && !state.openUserCorner) {
        layer.classList.remove('hidden');
      } else if (!nowMobile) {
        layer.classList.add('hidden');
      }
    }
  });

  // Virtual Joystick touch tracking
  const joystick = document.getElementById('virtual-joystick');
  const base = document.getElementById('joystick-base');
  const knob = document.getElementById('joystick-knob');

  if (joystick && knob) {
    let activeTouchId = null;
    let baseCenter = { x: 0, y: 0 };
    const maxRadius = 40; // px

    joystick.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        if (activeTouchId !== null) return;
        const t = e.changedTouches[0];
        activeTouchId = t.identifier;

        const rect = (base || joystick).getBoundingClientRect();
        baseCenter = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };

        updateJoystick(t.clientX, t.clientY);
      },
      { passive: false }
    );

    const onTouchMove = (e) => {
      if (activeTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === activeTouchId) {
          e.preventDefault();
          updateJoystick(t.clientX, t.clientY);
          break;
        }
      }
    };

    const onTouchEnd = (e) => {
      if (activeTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === activeTouchId) {
          activeTouchId = null;
          knob.style.transform = 'translate(0px, 0px)';
          if (world) world.setJoystickVector(0, 0);
          break;
        }
      }
    };

    function updateJoystick(clientX, clientY) {
      let dx = clientX - baseCenter.x;
      let dy = clientY - baseCenter.y;
      const dist = Math.hypot(dx, dy);

      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }

      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      const normX = dx / maxRadius;
      const normY = dy / maxRadius;
      if (world) world.setJoystickVector(normX, normY);
    }

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: false });
    window.addEventListener('touchcancel', onTouchEnd, { passive: false });
  }

  // Mobile Action Buttons
  const btnInteract = document.getElementById('btn-mobile-interact');
  if (btnInteract) {
    btnInteract.addEventListener('click', () => {
      if (!world) return;
      const near = world.nearestInteractable;
      if (near) {
        if (near.type === 'user-corner') {
          world.enterUserCornerCloseup();
        } else if (near.type === 'shelf') {
          world.enterShelfCloseup(near.id);
        } else if (near.type === 'table') {
          world.sitAtTable(near.id);
        }
      }
    });
  }

  const btnLeave = document.getElementById('btn-mobile-leave');
  if (btnLeave) {
    btnLeave.addEventListener('click', () => {
      closeTableTurntableHUD(true);
    });
  }

  const btnDropLP = document.getElementById('btn-mobile-drop-lp');
  if (btnDropLP) {
    btnDropLP.addEventListener('click', () => {
      setHeldLP(null);
      showToast('손에 들고 있던 LP판을 내려놓았습니다.');
    });
  }

  const btnCamReset = document.getElementById('btn-mobile-cam-reset');
  if (btnCamReset) {
    btnCamReset.addEventListener('click', () => {
      if (world) world.resetCameraOrbit();
      showToast('카메라 시점을 정면으로 재정렬했습니다.');
    });
  }
}
