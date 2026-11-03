// Hybrid Audio Engine for Online LP Bar:
// 1. LP Vinyl Crackle & Needle Drop/Lift: Plays ONLY when an LP track is actively playing
// 2. Background Sound (BGM): Plays ONLY calm Jazz classics in random order when no LP is playing
// 3. Hybrid Turntable Player: Real Preview / YouTube IFrame API + Built-in Analog Vinyl Synthesizer

export const CALM_JAZZ_BGM_TRACKS = [
  {
    id: 'bgm-jazz-1',
    title: 'Waltz for Debby',
    artist: 'Bill Evans Trio',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/4b/d6/62/4bd662a5-1435-85c2-3fd4-f95f4999f077/mzaf_4342118010685951964.plus.aac.p.m4a',
    root: 60,
    bpm: 64,
    prog: [[0, 4, 7, 11], [5, 9, 12, 16], [2, 5, 9, 12], [7, 11, 14, 17]]
  },
  {
    id: 'bgm-jazz-2',
    title: 'Peace Piece',
    artist: 'Bill Evans',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/e1/5b/27/e15b2780-51a0-b418-cbb3-16e4a65a41fb/mzaf_4421605330193573032.plus.aac.p.m4a',
    root: 60,
    bpm: 58,
    prog: [[0, 4, 7, 11], [5, 8, 12, 14], [0, 4, 7, 11], [7, 11, 14, 17]]
  },
  {
    id: 'bgm-jazz-3',
    title: 'Blue in Green',
    artist: 'Miles Davis',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/af/5d/60/af5d603d-d0db-c066-3fe6-54bb2b51bdfb/mzaf_1714770531795139058.plus.aac.p.m4a',
    root: 62,
    bpm: 60,
    prog: [[0, 3, 7, 10, 14], [2, 5, 9, 12], [0, 3, 7, 10], [5, 8, 12, 15]]
  },
  {
    id: 'bgm-jazz-4',
    title: 'In a Sentimental Mood',
    artist: 'Duke Ellington & John Coltrane',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/cc/7c/62/cc7c6261-164e-a28f-7a02-efaf04346fb5/mzaf_6202742881995670733.plus.aac.p.m4a',
    root: 65,
    bpm: 62,
    prog: [[0, 3, 7, 10], [5, 8, 12, 15], [3, 7, 10, 14], [7, 10, 14, 17]]
  },
  {
    id: 'bgm-jazz-5',
    title: 'Almost Blue',
    artist: 'Chet Baker',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/71/89/2a/71892a04-af34-b690-93a0-2dc8accc7c45/mzaf_13972860435492431686.plus.aac.p.m4a',
    root: 57,
    bpm: 60,
    prog: [[0, 3, 7, 10], [5, 8, 12, 15], [2, 5, 8, 12], [4, 8, 11, 14]]
  },
  {
    id: 'bgm-jazz-6',
    title: 'Corcovado (Quiet Nights of Quiet Stars)',
    artist: 'Stan Getz & João Gilberto',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/5a/91/31/5a913105-95e9-6669-1b1c-a3fe18560077/mzaf_8444170522757703263.plus.aac.p.m4a',
    root: 60,
    bpm: 68,
    prog: [[0, 4, 7, 11], [2, 5, 9, 12], [5, 9, 12, 16], [7, 11, 14, 17]]
  },
  {
    id: 'bgm-jazz-7',
    title: 'Cast Your Fate to the Wind',
    artist: 'Vince Guaraldi Trio',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/7d/52/aa/7d52aa06-f962-09de-7221-15dacbaef15f/mzaf_11034300868525152748.plus.aac.p.m4a',
    root: 65,
    bpm: 68,
    prog: [[0, 4, 7, 11], [5, 9, 12, 16], [2, 5, 9, 12], [7, 11, 14, 17]]
  },
  {
    id: 'bgm-jazz-8',
    title: 'Strange Meadow Lark',
    artist: 'The Dave Brubeck Quartet',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/79/a0/76/79a0765b-11a4-0d8e-927b-57e764ac439c/mzaf_14319271082161494060.plus.aac.p.m4a',
    root: 63,
    bpm: 62,
    prog: [[0, 4, 7, 11], [5, 9, 12, 16], [2, 5, 9, 12], [7, 11, 14, 17]]
  },
  {
    id: 'bgm-jazz-9',
    title: 'Wave',
    artist: 'Oscar Peterson Trio',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview124/v4/42/0b/84/420b840f-ffac-da2b-c134-ea6ca86ed9bd/mzaf_13111466470560818554.plus.aac.p.m4a',
    root: 62,
    bpm: 66,
    prog: [[0, 4, 7, 11], [5, 8, 12, 15], [2, 5, 9, 12], [7, 10, 14, 17]]
  },
  {
    id: 'bgm-jazz-10',
    title: 'Concierto de Aranjuez',
    artist: 'Jim Hall',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/35/ae/4e/35ae4ef3-dfb4-fe5e-d5db-ed02b81e41f4/mzaf_19604089613208477.plus.aac.p.m4a',
    root: 59,
    bpm: 60,
    prog: [[0, 3, 7, 10], [5, 8, 12, 15], [0, 3, 7, 10], [7, 11, 14, 17]]
  }
];

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isInitialized = false;

    // Master & Channel Volumes (0.0 ~ 1.0)
    // Note: Background noise channels (rain, murmur, ice, fire) default to 0.0 so ONLY calm jazz BGM plays in the background.
    // Vinyl crackle is ONLY active while a turntable song is actively playing (this.isPlaying === true).
    this.musicVolume = 0.8;
    this.ambientVolumes = {
      bgJazz: 0.48,
      crackle: 0.65,
      rain: 0.0,
      murmur: 0.0,
      ice: 0.0,
      fire: 0.0
    };

    // Background Calm Jazz Lounge BGM state
    this.bgJazzAudio = null;
    this.bgJazzActive = false;
    this.bgJazzTrackIndex = -1;
    this.currentBgJazzTrack = null;
    this.bgJazzSynthTimer = null;
    this.bgJazzSynthStep = 0;
    this.onBgJazzChange = null;

    // Turntable state
    this.isPlaying = false;
    this.currentLP = null;
    this.rpm = 33; // 33 or 45
    this.sourceMode = 'hybrid'; // 'hybrid' | 'synth'
    this.ytReady = false;
    this.ytPlayer = null;
    this.ytPlayingActive = false;
    this.previewAudio = null;
    this.previewPlayingActive = false;
    this.quickSampleAudio = null;
    this.onStatusChange = null;

    // Synth scheduler state
    this.synthTimer = null;
    this.synthStep = 0;
    this.ambientTimers = [];
    this.ambientNodes = {};
  }

  async init() {
    if (this.isInitialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();

    // Master compressor for warm analog glue
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.95;

    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -16;
    this.compressor.knee.value = 24;
    this.compressor.ratio.value = 3;
    this.compressor.attack.value = 0.01;
    this.compressor.release.value = 0.25;

    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.ctx.destination);

    // Music bus (for built-in analog synth)
    this.synthBus = this.ctx.createGain();
    this.synthBus.gain.value = this.musicVolume;

    // Warm vinyl lowpass filter on synth bus
    this.vinylToneFilter = this.ctx.createBiquadFilter();
    this.vinylToneFilter.type = 'lowpass';
    this.vinylToneFilter.frequency.value = 3600;
    this.vinylToneFilter.Q.value = 0.7;

    this.synthBus.connect(this.vinylToneFilter);
    this.vinylToneFilter.connect(this.masterGain);

    // Setup ambient & crackle layers (crackle starts at 0.0 until a song is played)
    this._setupAmbientChannels();
    this._initYouTubeAPI();

    this.isInitialized = true;

    // Start random calm Jazz background music immediately upon entering the bar
    if (!this.isPlaying) {
      this.startBackgroundJazz();
    }
  }

  // =========================================================================
  // 1. AMBIENT CHANNELS & VINYL CRACKLE ENGINE (Crackle ONLY on LP Playback)
  // =========================================================================
  _setupAmbientChannels() {
    const ctx = this.ctx;

    // Create 4-second noise buffers
    const bufferSize = ctx.sampleRate * 4;

    // A) Vinyl Crackle Buffer (ONLY audible when this.isPlaying === true)
    const crackleBuffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = crackleBuffer.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + white * 0.025;
        b1 = 0.96 * b1 + white * 0.04;
        b2 = 0.85 * b2 + white * 0.08;
        let sample = (b0 + b1 + b2) * 0.18;

        // Add vinyl dust micro-ticks & crackles
        const r = Math.random();
        if (r > 0.9985) {
          sample += (Math.random() * 2 - 1) * 0.85;
        } else if (r > 0.992) {
          sample += (Math.random() * 2 - 1) * 0.28;
        }
        data[i] = sample;
      }
    }

    const crackleSource = ctx.createBufferSource();
    crackleSource.buffer = crackleBuffer;
    crackleSource.loop = true;

    const crackleBandpass = ctx.createBiquadFilter();
    crackleBandpass.type = 'bandpass';
    crackleBandpass.frequency.value = 2400;
    crackleBandpass.Q.value = 0.75;

    const crackleGain = ctx.createGain();
    crackleGain.gain.value = 0.0; // Strictly 0 until an LP song is played

    crackleSource.connect(crackleBandpass);
    crackleBandpass.connect(crackleGain);
    crackleGain.connect(this.masterGain);
    crackleSource.start();
    this.ambientNodes.crackle = crackleGain;

    // B) Optional Midnight Rain Buffer (default 0.0)
    const rainBuffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = rainBuffer.getChannelData(ch);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.08 * white) / 1.08;
        lastOut = data[i];
        data[i] *= 0.55;
      }
    }
    const rainSource = ctx.createBufferSource();
    rainSource.buffer = rainBuffer;
    rainSource.loop = true;

    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'bandpass';
    rainFilter.frequency.value = 1150;
    rainFilter.Q.value = 0.5;

    const rainGain = ctx.createGain();
    rainGain.gain.value = this.ambientVolumes.rain * 0.25;

    rainSource.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(this.masterGain);
    rainSource.start();
    this.ambientNodes.rain = rainGain;

    // C) Optional Cozy Bar Murmur (default 0.0)
    const murmurBuffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = murmurBuffer.getChannelData(ch);
      let v0 = 0, v1 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        v0 = 0.985 * v0 + white * 0.015;
        v1 = 0.95 * v1 + v0 * 0.05;
        const mod = 0.65 + 0.35 * Math.sin((i / ctx.sampleRate) * Math.PI * 1.5 + ch);
        data[i] = v1 * mod * 1.8;
      }
    }
    const murmurSource = ctx.createBufferSource();
    murmurSource.buffer = murmurBuffer;
    murmurSource.loop = true;

    const murmurFilter = ctx.createBiquadFilter();
    murmurFilter.type = 'bandpass';
    murmurFilter.frequency.value = 420;
    murmurFilter.Q.value = 1.1;

    const murmurGain = ctx.createGain();
    murmurGain.gain.value = this.ambientVolumes.murmur * 0.35;

    murmurSource.connect(murmurFilter);
    murmurFilter.connect(murmurGain);
    murmurGain.connect(this.masterGain);
    murmurSource.start();
    this.ambientNodes.murmur = murmurGain;

    // D) Optional Fireplace (default 0.0)
    const fireBuffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = fireBuffer.getChannelData(ch);
      let f0 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const w = Math.random() * 2 - 1;
        f0 = 0.992 * f0 + w * 0.018;
        let pop = 0;
        if (Math.random() > 0.9975) pop = (Math.random() * 2 - 1) * 0.6;
        data[i] = f0 * 1.4 + pop * 0.35;
      }
    }
    const fireSource = ctx.createBufferSource();
    fireSource.buffer = fireBuffer;
    fireSource.loop = true;

    const fireFilter = ctx.createBiquadFilter();
    fireFilter.type = 'lowpass';
    fireFilter.frequency.value = 880;

    const fireGain = ctx.createGain();
    fireGain.gain.value = this.ambientVolumes.fire * 0.32;

    fireSource.connect(fireFilter);
    fireFilter.connect(fireGain);
    fireGain.connect(this.masterGain);
    fireSource.start();
    this.ambientNodes.fire = fireGain;

    // Periodic organic events: Vinyl dust pops ONLY when a song is playing
    const eventInterval = setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running') return;

      // Vinyl pop ONLY when an LP track is actively playing (this.isPlaying === true)
      if (this.isPlaying && this.ambientVolumes.crackle > 0.05) {
        if (Math.random() < 0.65) {
          this._triggerVinylDustPop();
        }
      }

      // Optional whiskey glass ice clink only when user turns ice > 0
      if (this.ambientVolumes.ice > 0.05 && Math.random() < 0.32) {
        this._triggerIceClink();
      }
    }, 1800);

    this.ambientTimers.push(eventInterval);
  }

  _getEffectiveCrackleGain() {
    // LP 치지직 노이즈 효과음은 음원을 틀 때(this.isPlaying === true)만 출력됨
    if (!this.isPlaying) return 0.0;
    return this.ambientVolumes.crackle * 0.42;
  }

  _triggerVinylDustPop() {
    if (!this.ctx || !this.isPlaying) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Very short impulse-like pop (치직 / 틱)
    osc.type = 'triangle';
    const startFreq = 900 + Math.random() * 2200;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.018);

    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 1.4;

    const intensity = this.ambientVolumes.crackle * 0.16 * (0.4 + Math.random() * 0.6);
    gain.gain.setValueAtTime(intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.025);
  }

  _triggerIceClink() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const vol = this.ambientVolumes.ice * 0.09;
    if (vol <= 0.002) return;

    const freqs = [2650 + Math.random() * 220, 3980 + Math.random() * 300];
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      const t = now + idx * 0.065;
      osc.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(vol * (idx === 0 ? 1 : 0.7), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  // =========================================================================
  // 1-B. RANDOM CALM JAZZ BACKGROUND MUSIC (배경음: 잔잔한 재즈 랜덤 재생)
  // =========================================================================
  _pickRandomBgJazzTrack() {
    const count = CALM_JAZZ_BGM_TRACKS.length;
    if (count === 0) return null;
    if (count === 1) {
      this.bgJazzTrackIndex = 0;
      return CALM_JAZZ_BGM_TRACKS[0];
    }
    let nextIdx = Math.floor(Math.random() * count);
    if (nextIdx === this.bgJazzTrackIndex) {
      nextIdx = (nextIdx + 1 + Math.floor(Math.random() * (count - 1))) % count;
    }
    this.bgJazzTrackIndex = nextIdx;
    return CALM_JAZZ_BGM_TRACKS[nextIdx];
  }

  startBackgroundJazz(forceNewTrack = false) {
    if (!this.isInitialized) return;
    // Do not play background jazz while a user is actively playing an LP or sample preview
    if (this.isPlaying || this.quickSampleAudio) return;

    if (!this.currentBgJazzTrack || forceNewTrack) {
      this.currentBgJazzTrack = this._pickRandomBgJazzTrack();
    }
    const track = this.currentBgJazzTrack;
    if (!track) return;

    this.bgJazzActive = true;
    this._stopCalmJazzBgmSynth();

    if (typeof this.onBgJazzChange === 'function') {
      this.onBgJazzChange(track);
    }

    if (this.ambientVolumes.bgJazz <= 0.005) {
      if (this.bgJazzAudio) {
        try {
          this.bgJazzAudio.pause();
        } catch {
          // ignore
        }
      }
      return;
    }

    try {
      if (!this.bgJazzAudio) {
        this.bgJazzAudio = new Audio();
        this.bgJazzAudio.crossOrigin = 'anonymous';
        this.bgJazzAudio.onended = () => {
          if (this.bgJazzActive && !this.isPlaying && !this.quickSampleAudio) {
            this.nextBackgroundJazzTrack();
          }
        };
        this.bgJazzAudio.onerror = () => {
          if (this.bgJazzActive && !this.isPlaying) {
            this._startCalmJazzBgmSynth(track);
          }
        };
      }

      if (this.bgJazzAudio.src !== track.previewUrl) {
        this.bgJazzAudio.src = track.previewUrl;
      }
      this.bgJazzAudio.volume = Math.min(1, this.ambientVolumes.bgJazz * 0.85);

      const playPromise = this.bgJazzAudio.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.catch(() => {
          if (this.bgJazzActive && !this.isPlaying) {
            this._startCalmJazzBgmSynth(track);
          }
        });
      }
    } catch {
      this._startCalmJazzBgmSynth(track);
    }
  }

  nextBackgroundJazzTrack() {
    const nextTrack = this._pickRandomBgJazzTrack();
    this.currentBgJazzTrack = nextTrack;
    if (!this.isPlaying && !this.quickSampleAudio) {
      this.startBackgroundJazz(false);
    } else if (typeof this.onBgJazzChange === 'function' && nextTrack) {
      this.onBgJazzChange(nextTrack);
    }
    return nextTrack;
  }

  pauseBackgroundJazz() {
    this.bgJazzActive = false;
    this._stopCalmJazzBgmSynth();
    if (this.bgJazzAudio) {
      try {
        this.bgJazzAudio.pause();
      } catch {
        // ignore
      }
    }
  }

  resumeBackgroundJazz() {
    if (this.isPlaying || this.quickSampleAudio) return;
    this.startBackgroundJazz(false);
  }

  _stopCalmJazzBgmSynth() {
    if (this.bgJazzSynthTimer) {
      clearInterval(this.bgJazzSynthTimer);
      this.bgJazzSynthTimer = null;
    }
  }

  _startCalmJazzBgmSynth(track) {
    this._stopCalmJazzBgmSynth();
    if (!this.ctx || this.isPlaying || !this.bgJazzActive) return;

    const bpm = track?.bpm || 62;
    const stepMs = Math.round((60000 / bpm) / 2);
    this.bgJazzSynthStep = 0;

    this.bgJazzSynthTimer = setInterval(() => {
      if (!this.bgJazzActive || this.isPlaying || !this.ctx) return;
      const vol = this.ambientVolumes.bgJazz;
      if (vol <= 0.01) return;

      const step = this.bgJazzSynthStep++;
      // Switch to another random calm jazz progression every 64 steps
      if (step > 0 && step % 64 === 0) {
        this.currentBgJazzTrack = this._pickRandomBgJazzTrack();
        if (typeof this.onBgJazzChange === 'function' && this.currentBgJazzTrack) {
          this.onBgJazzChange(this.currentBgJazzTrack);
        }
      }

      const activeTrack = this.currentBgJazzTrack || track || CALM_JAZZ_BGM_TRACKS[0];
      const barStep = step % 8;
      const chordIdx = Math.floor(step / 8) % activeTrack.prog.length;
      const chord = activeTrack.prog[chordIdx];
      const root = activeTrack.root || 60;
      const now = this.ctx.currentTime;

      // Pure, soft acoustic Jazz Piano & Upright Bass (no percussion noise or crackle)
      if (barStep === 0 || barStep === 5) {
        const dur = barStep === 0 ? 2.4 : 1.1;
        chord.forEach((offset, i) => {
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.type = 'sine';
          const freq = 440 * Math.pow(2, (root + offset - 69) / 12);
          osc.frequency.setValueAtTime(freq, now + i * 0.03);

          const peak = (0.045 * vol) / Math.sqrt(chord.length);
          g.gain.setValueAtTime(0.0001, now + i * 0.03);
          g.gain.linearRampToValueAtTime(peak, now + i * 0.03 + 0.06);
          g.gain.exponentialRampToValueAtTime(0.0002, now + dur);

          osc.connect(g);
          g.connect(this.masterGain);
          osc.start(now + i * 0.03);
          osc.stop(now + dur + 0.05);
        });
      }

      if (barStep === 0 || barStep === 4) {
        const bassNote = root - 12 + (barStep === 4 ? chord[1] || 7 : chord[0]);
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = 'sine';
        bOsc.frequency.setValueAtTime(440 * Math.pow(2, (bassNote - 69) / 12), now);
        bGain.gain.setValueAtTime(0.07 * vol, now);
        bGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.65);
        bOsc.connect(bGain);
        bGain.connect(this.masterGain);
        bOsc.start(now);
        bOsc.stop(now + 0.7);
      }

      if (barStep === 2 || barStep === 6) {
        const note = root + chord[Math.floor(Math.random() * chord.length)] + 12;
        const mOsc = this.ctx.createOscillator();
        const mGain = this.ctx.createGain();
        mOsc.type = 'sine';
        mOsc.frequency.setValueAtTime(440 * Math.pow(2, (note - 69) / 12), now);
        mGain.gain.setValueAtTime(0.0001, now);
        mGain.gain.linearRampToValueAtTime(0.032 * vol, now + 0.05);
        mGain.gain.exponentialRampToValueAtTime(0.0003, now + 0.75);
        mOsc.connect(mGain);
        mGain.connect(this.masterGain);
        mOsc.start(now);
        mOsc.stop(now + 0.8);
      }
    }, stepMs);
  }

  setAmbientVolume(channel, value0to1) {
    this.ambientVolumes[channel] = Math.max(0, Math.min(1, value0to1));
    if (!this.ctx || !this.isInitialized) return;

    const now = this.ctx.currentTime;
    if (channel === 'bgJazz') {
      if (this.bgJazzAudio) {
        this.bgJazzAudio.volume = Math.min(1, this.ambientVolumes.bgJazz * 0.85);
      }
      if (this.ambientVolumes.bgJazz > 0.01 && !this.isPlaying && !this.bgJazzActive) {
        this.startBackgroundJazz(false);
      } else if (this.ambientVolumes.bgJazz <= 0.005 && this.bgJazzAudio) {
        try {
          this.bgJazzAudio.pause();
        } catch {
          // ignore
        }
      }
    } else if (channel === 'crackle' && this.ambientNodes.crackle) {
      this.ambientNodes.crackle.gain.setTargetAtTime(this._getEffectiveCrackleGain(), now, 0.08);
    } else if (channel === 'rain' && this.ambientNodes.rain) {
      this.ambientNodes.rain.gain.setTargetAtTime(this.ambientVolumes.rain * 0.25, now, 0.08);
    } else if (channel === 'murmur' && this.ambientNodes.murmur) {
      this.ambientNodes.murmur.gain.setTargetAtTime(this.ambientVolumes.murmur * 0.35, now, 0.08);
    } else if (channel === 'fire' && this.ambientNodes.fire) {
      this.ambientNodes.fire.gain.setTargetAtTime(this.ambientVolumes.fire * 0.32, now, 0.08);
    } else if (channel === 'ice' && this.ambientVolumes.ice > 0.1) {
      this._triggerIceClink();
    }
  }

  setMusicVolume(value0to1) {
    this.musicVolume = Math.max(0, Math.min(1, value0to1));
    if (this.synthBus && this.ctx) {
      const target = (this.ytPlayingActive || this.previewPlayingActive) ? 0.0 : this.musicVolume;
      this.synthBus.gain.setTargetAtTime(target, this.ctx.currentTime, 0.08);
    }
    if (this.ytPlayer && typeof this.ytPlayer.setVolume === 'function') {
      this.ytPlayer.setVolume(Math.round(this.musicVolume * 100));
    }
    if (this.previewAudio) {
      this.previewAudio.volume = this.musicVolume;
    }
  }

  // =========================================================================
  // 2. INTERACTIVE SOUND EFFECTS (Needle Drop, Sleeve Flip, Footsteps)
  // =========================================================================
  playNeedleDrop() {
    if (!this.isInitialized) this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1) Mechanical tonearm lever click
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(1100, now);
    clickOsc.frequency.exponentialRampToValueAtTime(220, now + 0.03);
    clickGain.gain.setValueAtTime(0.12, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    clickOsc.connect(clickGain);
    clickGain.connect(this.masterGain);
    clickOsc.start(now);
    clickOsc.stop(now + 0.04);

    // 2) Stylus touching vinyl groove thud ("툭—")
    const thudTime = now + 0.14;
    const thudOsc = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(92, thudTime);
    thudOsc.frequency.exponentialRampToValueAtTime(28, thudTime + 0.16);
    thudGain.gain.setValueAtTime(0.38, thudTime);
    thudGain.gain.exponentialRampToValueAtTime(0.001, thudTime + 0.19);
    thudOsc.connect(thudGain);
    thudGain.connect(this.masterGain);
    thudOsc.start(thudTime);
    thudOsc.stop(thudTime + 0.2);

    // 3) Immediate burst of vinyl needle-drop scratch ("치지지직...")
    const burstLen = Math.floor(this.ctx.sampleRate * 0.45);
    const burstBuf = this.ctx.createBuffer(1, burstLen, this.ctx.sampleRate);
    const data = burstBuf.getChannelData(0);
    for (let i = 0; i < burstLen; i++) {
      const env = Math.sin((i / burstLen) * Math.PI);
      let s = (Math.random() * 2 - 1) * 0.25 * env;
      if (Math.random() > 0.96) s += (Math.random() * 2 - 1) * 0.75;
      data[i] = s;
    }
    const burstSrc = this.ctx.createBufferSource();
    burstSrc.buffer = burstBuf;

    const burstFilter = this.ctx.createBiquadFilter();
    burstFilter.type = 'bandpass';
    burstFilter.frequency.value = 2100;
    burstFilter.Q.value = 0.9;

    const burstGain = this.ctx.createGain();
    burstGain.gain.value = Math.max(0.28, this.ambientVolumes.crackle * 0.55);

    burstSrc.connect(burstFilter);
    burstFilter.connect(burstGain);
    burstGain.connect(this.masterGain);
    burstSrc.start(thudTime);
  }

  playNeedleLift() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.045);
    g.gain.setValueAtTime(0.14, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  playSleeveFlip() {
    if (!this.isInitialized || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Crisp cardboard LP jacket slide & flip sound ("스윽- 탁")
    const len = Math.floor(this.ctx.sampleRate * 0.11);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const env = Math.sin((i / len) * Math.PI);
      d[i] = (Math.random() * 2 - 1) * env * 0.35;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, now);
    filter.frequency.exponentialRampToValueAtTime(1750, now + 0.1);
    filter.Q.value = 1.4;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.24;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
  }

  playFootstep() {
    if (!this.isInitialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(115 + Math.random() * 20, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.055);
    g.gain.setValueAtTime(0.06, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  // =========================================================================
  // 3. YOUTUBE IFRAME API + BUILT-IN ANALOG SYNTH HYBRID MUSIC PLAYER
  // =========================================================================
  _initYouTubeAPI() {
    if (window.YT && window.YT.Player) {
      this._createYTPlayer();
      return;
    }

    window.onYouTubeIframeAPIReady = () => {
      this._createYTPlayer();
    };

    if (!document.getElementById('yt-iframe-script')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  }

  _createYTPlayer() {
    try {
      this.ytPlayer = new window.YT.Player('yt-player', {
        height: '120',
        width: '200',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          rel: 0,
          playsinline: 1
        },
        events: {
          onReady: () => {
            this.ytReady = true;
            this.ytPlayer.setVolume(Math.round(this.musicVolume * 100));
            const iframe = this.ytPlayer.getIframe?.();
            if (iframe) {
              iframe.setAttribute('tabindex', '-1');
            }
          },
          onStateChange: (e) => {
            const iframe = this.ytPlayer.getIframe?.();
            if (iframe && document.activeElement === iframe) {
              iframe.blur();
              window.focus();
            }
            // YT.PlayerState.PLAYING === 1
            if (e.data === 1 && this.isPlaying && this.sourceMode === 'hybrid') {
              this.ytPlayingActive = true;
              // Gently fade out backup synth so YouTube original plays cleanly over vinyl crackle
              if (this.synthBus && this.ctx) {
                this.synthBus.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.25);
              }
              this._notifyStatus('YouTube 원곡 LP 스트리밍 + 실시간 바이닐 치지직 노이즈 재생 중');
            } else if (e.data === 0 && this.isPlaying) {
              // Ended -> loop vinyl track
              this.ytPlayer.seekTo(0);
              this.ytPlayer.playVideo();
            }
          },
          onError: () => {
            this.ytPlayingActive = false;
            // Try fallback previewUrl stream if LP has one before falling back to synth
            const pUrl = this.currentLP && (this.currentLP.previewUrl || this.currentLP.spotifyPreviewUrl);
            if (this.isPlaying && this.sourceMode === 'hybrid' && pUrl) {
              this._startPreviewAudioStream(pUrl);
              return;
            }
            // Seamlessly keep playing the built-in Analog Vinyl Synthesizer!
            if (this.synthBus && this.ctx && this.isPlaying) {
              this.synthBus.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.15);
            }
            this._notifyStatus('내장 아날로그 LP 신스 엔진 + 실시간 바이닐 치지직 노이즈 재생 중');
          }
        }
      });
    } catch {
      this.ytReady = false;
    }
  }

  _notifyStatus(msg) {
    if (typeof this.onStatusChange === 'function') {
      this.onStatusChange(msg);
    }
  }

  _stopPreviewAudioStream() {
    this.previewPlayingActive = false;
    if (this.previewAudio) {
      try {
        this.previewAudio.pause();
        this.previewAudio.currentTime = 0;
      } catch {
        // ignore
      }
    }
  }

  _startPreviewAudioStream(previewUrl) {
    if (!previewUrl) return false;
    try {
      if (!this.previewAudio) {
        this.previewAudio = new Audio();
        this.previewAudio.crossOrigin = 'anonymous';
        this.previewAudio.loop = true;
      }
      this.previewAudio.pause();
      this.previewAudio.src = previewUrl;
      this.previewAudio.volume = this.musicVolume;
      this.previewAudio.playbackRate = this.rpm === 45 ? 1.18 : 1.0;

      const playPromise = this.previewAudio.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(() => {
            if (!this.isPlaying || this.sourceMode !== 'hybrid') {
              this._stopPreviewAudioStream();
              return;
            }
            this.previewPlayingActive = true;
            if (this.synthBus && this.ctx) {
              this.synthBus.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.2);
            }
            this._notifyStatus('원곡 프리뷰 스트리밍 + 실시간 바이닐 치지직 노이즈 재생 중');
          })
          .catch(() => {
            this.previewPlayingActive = false;
          });
      }
      return true;
    } catch {
      this.previewPlayingActive = false;
      return false;
    }
  }

  playQuickSample(previewUrl, onEnded) {
    this.stopQuickSample(false);
    if (!previewUrl) return false;
    try {
      this.pauseBackgroundJazz();
      this.quickSampleAudio = new Audio(previewUrl);
      this.quickSampleAudio.volume = Math.min(1, this.musicVolume * 0.95);
      this.quickSampleAudio.onended = () => {
        this.quickSampleAudio = null;
        if (!this.isPlaying) {
          this.resumeBackgroundJazz();
        }
        if (typeof onEnded === 'function') onEnded();
      };
      this.quickSampleAudio.play().catch(() => {
        this.quickSampleAudio = null;
        if (!this.isPlaying) {
          this.resumeBackgroundJazz();
        }
        if (typeof onEnded === 'function') onEnded();
      });
      return true;
    } catch {
      return false;
    }
  }

  stopQuickSample(resumeBg = true) {
    if (this.quickSampleAudio) {
      try {
        this.quickSampleAudio.pause();
        this.quickSampleAudio.currentTime = 0;
      } catch {
        // ignore
      }
      this.quickSampleAudio = null;
    }
    if (resumeBg && !this.isPlaying && this.isInitialized) {
      this.resumeBackgroundJazz();
    }
  }

  async startTurntableLP(lp, rpm = 33, withNeedleDrop = true) {
    await this.init();
    this.stopQuickSample(false);
    this.pauseBackgroundJazz();
    this._stopPreviewAudioStream();
    if (this.ytReady && this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
      try {
        this.ytPlayer.pauseVideo();
      } catch {
        // ignore
      }
    }

    this.currentLP = lp;
    this.rpm = rpm || lp.rpm || 33;
    this.isPlaying = true;
    this.ytPlayingActive = false;
    this.previewPlayingActive = false;

    // Enable vinyl crackle ONLY while this LP song is playing
    if (this.ambientNodes.crackle && this.ctx) {
      this.ambientNodes.crackle.gain.setTargetAtTime(this._getEffectiveCrackleGain(), this.ctx.currentTime, 0.12);
    }

    if (withNeedleDrop) {
      this.playNeedleDrop();
    }

    // Start built-in analog vinyl synth immediately after needle drop (380ms)
    this._stopSynthLoop();
    setTimeout(() => {
      if (!this.isPlaying || this.currentLP?.id !== lp.id) return;
      this._startSynthLoop(lp);
    }, withNeedleDrop ? 380 : 40);

    const previewUrl = lp.previewUrl || lp.spotifyPreviewUrl;

    // In hybrid mode:
    // 1) If LP has a direct previewUrl (e.g. user-recommended song or iTunes/Spotify preview), play it directly for instant, reliable vocal audio!
    // 2) Else if LP has a YouTube ID, load YouTube player.
    if (this.sourceMode === 'hybrid' && previewUrl && (lp.isUserSong || !lp.youtubeId)) {
      setTimeout(() => {
        if (!this.isPlaying || this.currentLP?.id !== lp.id) return;
        this._startPreviewAudioStream(previewUrl);
      }, withNeedleDrop ? 280 : 20);
      this._notifyStatus('바늘이 내려앉았습니다 · 원곡 음원 & 치지직 노이즈 연결 중...');
    } else if (this.sourceMode === 'hybrid' && lp.youtubeId && this.ytReady && this.ytPlayer) {
      try {
        this.ytPlayer.setVolume(Math.round(this.musicVolume * 100));
        this.ytPlayer.loadVideoById({
          videoId: lp.youtubeId,
          startSeconds: 0
        });
        const rate = this.rpm === 45 ? 1.25 : 1.0;
        if (typeof this.ytPlayer.setPlaybackRate === 'function') {
          this.ytPlayer.setPlaybackRate(rate);
        }
        this._notifyStatus('바늘이 내려앉았습니다 · 치지직 노이즈 & 음원 연결 중...');
      } catch {
        if (previewUrl) {
          this._startPreviewAudioStream(previewUrl);
        } else {
          this._notifyStatus('내장 아날로그 LP 신스 엔진 + 바이닐 치지직 노이즈 재생 중');
        }
      }
    } else if (this.sourceMode === 'hybrid' && previewUrl) {
      this._startPreviewAudioStream(previewUrl);
    } else {
      this._notifyStatus('내장 아날로그 LP 신스 엔진 + 바이닐 치지직 노이즈 재생 중');
    }
  }

  stopTurntable(withNeedleLift = true) {
    if (withNeedleLift && this.isPlaying) {
      this.playNeedleLift();
    }
    this.isPlaying = false;
    this.ytPlayingActive = false;
    this._stopPreviewAudioStream();
    this._stopSynthLoop();

    if (this.ytReady && this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
      try {
        this.ytPlayer.pauseVideo();
      } catch {
        // ignore
      }
    }

    // Immediately silence LP crackle noise when no song is playing
    if (this.ambientNodes.crackle && this.ctx) {
      this.ambientNodes.crackle.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.08);
    }

    // Resume random calm Jazz background music
    this.resumeBackgroundJazz();
    this._notifyStatus('턴테이블 정지 · 잔잔한 재즈 배경음악 재생 중');
  }

  setRPM(rpm) {
    this.rpm = rpm;
    if (this.isPlaying && this.currentLP) {
      // Restart synth timing for new RPM speed
      this._startSynthLoop(this.currentLP);
      if (this.previewAudio && this.previewPlayingActive) {
        this.previewAudio.playbackRate = rpm === 45 ? 1.18 : 1.0;
      }
      if (this.ytReady && this.ytPlayer && typeof this.ytPlayer.setPlaybackRate === 'function') {
        try {
          this.ytPlayer.setPlaybackRate(rpm === 45 ? 1.25 : 1.0);
        } catch {
          // ignore
        }
      }
    }
  }

  setSourceMode(mode) {
    this.sourceMode = mode; // 'hybrid' | 'synth'
    if (!this.isPlaying || !this.currentLP) return;

    if (mode === 'synth') {
      this.ytPlayingActive = false;
      this._stopPreviewAudioStream();
      if (this.ytReady && this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
        try {
          this.ytPlayer.pauseVideo();
        } catch {
          // ignore
        }
      }
      if (this.synthBus && this.ctx) {
        this.synthBus.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.12);
      }
      this._notifyStatus('내장 아날로그 LP 신스 전용 모드 재생 중');
    } else {
      // Re-trigger hybrid playback
      this.startTurntableLP(this.currentLP, this.rpm, false);
    }
  }

  // =========================================================================
  // 4. PROCEDURAL MULTI-INSTRUMENT ANALOG VINYL SYNTHESIZER
  // =========================================================================
  _stopSynthLoop() {
    if (this.synthTimer) {
      clearInterval(this.synthTimer);
      this.synthTimer = null;
    }
  }

  _midiToFreq(midi) {
    // Include subtle vinyl wow & flutter pitch drift
    const flutter = 1 + Math.sin(performance.now() * 0.004) * 0.0025;
    const rpmFactor = this.rpm === 45 ? 1.12 : 1.0;
    return 440 * Math.pow(2, (midi - 69) / 12) * flutter * rpmFactor;
  }

  _startSynthLoop(lp) {
    this._stopSynthLoop();
    if (!this.ctx) return;

    // Ensure synthBus gain is audible unless YouTube or Preview stream has already taken over
    if (!this.ytPlayingActive && !this.previewPlayingActive) {
      this.synthBus.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.12);
    }

    const preset = lp.synth || {
      style: 'lofi-chill',
      bpm: 84,
      root: 60,
      prog: [[0, 4, 7, 11], [5, 9, 12, 16], [2, 5, 9, 12], [7, 11, 14, 17]]
    };

    const effectiveBpm = (preset.bpm || 84) * (this.rpm === 45 ? 1.18 : 1.0);
    const stepMs = Math.round((60000 / effectiveBpm) / 2); // Eighth-note resolution
    this.synthStep = 0;

    // Play first step right away
    this._playSynthStep(preset, this.synthStep++);

    this.synthTimer = setInterval(() => {
      if (!this.isPlaying || !this.ctx) return;
      this._playSynthStep(preset, this.synthStep++);
    }, stepMs);
  }

  _playSynthStep(preset, step) {
    if ((this.ytPlayingActive || this.previewPlayingActive) && this.sourceMode === 'hybrid') return;

    const now = this.ctx.currentTime;
    const barStep = step % 8; // 8 eighth-notes per bar
    const chordIdx = Math.floor(step / 8) % preset.prog.length;
    const chordOffsets = preset.prog[chordIdx];
    const root = preset.root || 60;

    // 1) Warm Rhodes / Analog Pad Chord on beat 0 (and syncopated beat 5 for city-pop/bossa)
    if (barStep === 0 || (barStep === 5 && (preset.style === 'city-pop' || preset.style === 'bossa'))) {
      const dur = barStep === 0 ? 1.85 : 0.75;
      chordOffsets.forEach((offset, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = preset.style === 'city-pop' ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(this._midiToFreq(root + offset), now + i * 0.018);

        const peak = (preset.style === 'city-pop' ? 0.045 : 0.065) / Math.sqrt(chordOffsets.length);
        g.gain.setValueAtTime(0.0001, now + i * 0.018);
        g.gain.linearRampToValueAtTime(peak, now + i * 0.018 + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0005, now + dur);

        osc.connect(g);
        g.connect(this.synthBus);
        osc.start(now + i * 0.018);
        osc.stop(now + dur + 0.05);
      });
    }

    // 2) Upright / Slap Bassline
    if (barStep === 0 || barStep === 3 || barStep === 6) {
      const bassNote = root - 12 + (barStep === 6 ? chordOffsets[1] || 7 : chordOffsets[0]);
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(this._midiToFreq(bassNote), now);
      bassGain.gain.setValueAtTime(0.14, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      bassOsc.connect(bassGain);
      bassGain.connect(this.synthBus);
      bassOsc.start(now);
      bassOsc.stop(now + 0.45);
    }

    // 3) Expressive Melodic Solo Note (Sax / Piano / Guitar feel)
    if (barStep === 2 || barStep === 4 || (barStep === 7 && Math.random() > 0.35)) {
      const pick = chordOffsets[Math.floor(Math.random() * chordOffsets.length)];
      const octaveShift = Math.random() > 0.45 ? 12 : 0;
      const melNote = root + pick + octaveShift;

      const melOsc = this.ctx.createOscillator();
      const melGain = this.ctx.createGain();
      melOsc.type = preset.style === 'space-rock' ? 'sawtooth' : 'sine';
      const freq = this._midiToFreq(melNote);
      melOsc.frequency.setValueAtTime(freq * 0.992, now);
      melOsc.frequency.exponentialRampToValueAtTime(freq, now + 0.045);

      melGain.gain.setValueAtTime(0.001, now);
      melGain.gain.linearRampToValueAtTime(0.065, now + 0.03);
      melGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.55);

      melOsc.connect(melGain);
      melGain.connect(this.synthBus);
      melOsc.start(now);
      melOsc.stop(now + 0.58);
    }

    // 4) Soft Brushed Jazz / Lo-fi Drum Groove
    if (barStep === 0 || barStep === 4) {
      // Soft Kick
      const kOsc = this.ctx.createOscillator();
      const kGain = this.ctx.createGain();
      kOsc.type = 'sine';
      kOsc.frequency.setValueAtTime(110, now);
      kOsc.frequency.exponentialRampToValueAtTime(36, now + 0.09);
      kGain.gain.setValueAtTime(0.12, now);
      kGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      kOsc.connect(kGain);
      kGain.connect(this.synthBus);
      kOsc.start(now);
      kOsc.stop(now + 0.12);
    }
    if (barStep === 2 || barStep === 6) {
      // Soft Brushed Snare / Hi-hat
      const len = Math.floor(this.ctx.sampleRate * 0.065);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.35)) * 0.18;
      }
      const sSrc = this.ctx.createBufferSource();
      sSrc.buffer = buf;
      const sFilt = this.ctx.createBiquadFilter();
      sFilt.type = 'highpass';
      sFilt.frequency.value = 1800;
      sSrc.connect(sFilt);
      sFilt.connect(this.synthBus);
      sSrc.start(now);
    }
  }
}
