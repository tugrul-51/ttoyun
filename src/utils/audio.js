let _ac = null;
let _masterVolume = 0.55;
let _soundProfile = 'balanced';
let _ambientInterval = null;
let _ambientMode = null;
let _ambientStep = 0;
let _effectsEnabled = true;
let _musicEnabled = true;
let _effectsVolume = 0.92;
let _musicVolume = 0.56;

function getCtx() {
  if (typeof window === 'undefined') return null;
  if (!_ac) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    _ac = new Ctx();
  }
  if (_ac.state === 'suspended') {
    _ac.resume().catch(() => {});
  }
  return _ac;
}

function levelMultiplier() {
  switch (_soundProfile) {
    case 'off':
      return 0;
    case 'cinematic':
      return 1;
    case 'focused':
      return 0.45;
    default:
      return 0.72;
  }
}

function channelMultiplier(channel = 'effects') {
  if (channel === 'music') {
    if (!_musicEnabled) return 0;
    return _musicVolume;
  }
  if (!_effectsEnabled) return 0;
  return _effectsVolume;
}

function tone(frequency, type, duration, volume = 0.15, options = {}) {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const finalVolume = volume * _masterVolume * levelMultiplier() * channelMultiplier(options.channel || 'effects');
    if (finalVolume <= 0) return;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const now = ctx.currentTime;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (options.slideTo) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, options.slideTo), now + duration);
    }

    filter.type = options.filterType || 'lowpass';
    filter.frequency.setValueAtTime(options.filterFreq || 1400, now);
    filter.Q.value = options.q || 0.0001;

    const attack = options.attack ?? 0.01;
    const release = options.release ?? duration;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, finalVolume), now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + release);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  } catch {
    // sessiz devam et
  }
}

function chord(notes, type = 'sine', duration = 0.12, volume = 0.15, gap = 60, options = {}) {
  notes.forEach((note, index) => {
    setTimeout(() => tone(note, type, duration, volume, options), index * gap);
  });
}

function arpeggio(notes, config = {}) {
  const {
    type = 'triangle',
    duration = 0.18,
    volume = 0.1,
    step = 90,
    repeat = 1,
    reverse = false,
    options = {},
  } = config;

  for (let round = 0; round < repeat; round += 1) {
    const sequence = reverse && round % 2 === 1 ? [...notes].reverse() : notes;
    sequence.forEach((note, index) => {
      setTimeout(() => tone(note, type, duration, volume, options), (round * sequence.length + index) * step);
    });
  }
}

function stopAmbient() {
  if (_ambientInterval) {
    clearInterval(_ambientInterval);
    _ambientInterval = null;
  }
  _ambientMode = null;
  _ambientStep = 0;
}

function getAmbientPattern(modeId) {
  switch (modeId) {
    case 'bomb':
      return { notes: [130, 120, 110, 98], type: 'sawtooth', duration: 0.2, volume: 0.032, stepMs: 1100, filterFreq: 280 };
    case 'race':
      return { notes: [196, 247, 294], type: 'triangle', duration: 0.16, volume: 0.04, stepMs: 900, filterFreq: 900 };
    case 'treasure':
      return { notes: [262, 330, 392, 494], type: 'triangle', duration: 0.2, volume: 0.04, stepMs: 1350, filterFreq: 1200 };
    case 'monster':
      return { notes: [196, 247, 220, 294], type: 'square', duration: 0.16, volume: 0.035, stepMs: 1150, filterFreq: 840 };
    case 'chef':
      return { notes: [330, 392, 440, 523], type: 'sine', duration: 0.16, volume: 0.035, stepMs: 1280, filterFreq: 1400 };
    case 'hero':
      return { notes: [220, 294, 330, 440], type: 'triangle', duration: 0.18, volume: 0.04, stepMs: 1180, filterFreq: 980 };
    case 'dino':
      return { notes: [147, 175, 220, 262], type: 'triangle', duration: 0.18, volume: 0.038, stepMs: 1220, filterFreq: 880 };
    default:
      return { notes: [262, 330, 392], type: 'triangle', duration: 0.18, volume: 0.03, stepMs: 1500, filterFreq: 1000 };
  }
}

export function configureAudio({ soundProfile = 'balanced', masterVolume, effectsEnabled, musicEnabled, effectsVolume, musicVolume } = {}) {
  _soundProfile = soundProfile;
  if (typeof masterVolume === 'number') _masterVolume = Math.max(0, Math.min(masterVolume, 1));
  if (typeof effectsEnabled === 'boolean') _effectsEnabled = effectsEnabled;
  if (typeof musicEnabled === 'boolean') _musicEnabled = musicEnabled;
  if (typeof effectsVolume === 'number') _effectsVolume = Math.max(0, Math.min(effectsVolume, 1));
  if (typeof musicVolume === 'number') _musicVolume = Math.max(0, Math.min(musicVolume, 1));
  if (soundProfile === 'off' || !_musicEnabled) stopAmbient();
}

export function startAmbient(modeId) {
  stopAmbient();
  if (!modeId || _soundProfile === 'off' || !_musicEnabled) return;

  const pattern = getAmbientPattern(modeId);
  _ambientMode = modeId;

  const play = () => {
    const note = pattern.notes[_ambientStep % pattern.notes.length];
    tone(note, pattern.type, pattern.duration, pattern.volume, {
      filterFreq: pattern.filterFreq,
      release: pattern.duration,
      slideTo: note * 1.03,
      channel: 'music',
    });
    _ambientStep += 1;
  };

  play();
  _ambientInterval = setInterval(play, pattern.stepMs);
}

export const SFX = {
  start() {
    chord([523, 659, 784], 'triangle', 0.08, 0.12, 50, { filterFreq: 1900 });
  },
  correct() { chord([523, 659, 784], 'sine', 0.14, 0.22, 80, { filterFreq: 1800 }); },
  wrong() { chord([220, 180], 'square', 0.26, 0.11, 150, { filterFreq: 700 }); },
  click() { tone(880, 'triangle', 0.05, 0.12, { filterFreq: 1800, release: 0.05 }); },
  pop() { tone(980 + Math.random() * 260, 'sine', 0.1, 0.18, { filterFreq: 2000, release: 0.1 }); },
  tick() { tone(1200, 'triangle', 0.03, 0.07, { filterFreq: 2200, release: 0.03 }); },
  combo() { arpeggio([600, 750, 900, 1100], { type: 'sine', duration: 0.09, volume: 0.16, step: 55, repeat: 1, options: { filterFreq: 2000 } }); },
  win() { arpeggio([523, 587, 659, 784, 880, 1047], { type: 'triangle', duration: 0.18, volume: 0.17, step: 95, repeat: 1, options: { filterFreq: 1900 } }); },
  spin() { tone(420 + Math.random() * 180, 'triangle', 0.05, 0.07, { slideTo: 520 + Math.random() * 120, filterFreq: 1300, release: 0.05 }); },
  flip() { tone(620, 'triangle', 0.08, 0.1, { slideTo: 760, filterFreq: 1500, release: 0.08 }); },
  whoosh() { tone(240, 'sawtooth', 0.18, 0.08, { slideTo: 650, filterFreq: 900, release: 0.18 }); setTimeout(() => tone(540, 'triangle', 0.08, 0.05, { slideTo: 720, filterFreq: 1400 }), 45); },
  explosion() { tone(82, 'sawtooth', 0.34, 0.24, { slideTo: 45, filterFreq: 340, release: 0.32 }); setTimeout(() => tone(140, 'square', 0.18, 0.1, { slideTo: 70, filterFreq: 420 }), 45); },
  splash() { chord([380, 520, 760, 980], 'sine', 0.05, 0.08, 18, { filterFreq: 1800 }); },
  rocket() { tone(150, 'sawtooth', 0.42, 0.1, { slideTo: 260, filterFreq: 700, release: 0.4 }); setTimeout(() => tone(190, 'triangle', 0.25, 0.06, { slideTo: 320, filterFreq: 1000 }), 100); },
  dice() { for (let i = 0; i < 8; i += 1) setTimeout(() => tone(280 + Math.random() * 450, 'triangle', 0.03, 0.09, { filterFreq: 1600, release: 0.03 }), i * 48); },
  diceJackpot() { arpeggio([523, 659, 784, 988, 1175], { type: 'triangle', duration: 0.1, volume: 0.14, step: 55, repeat: 1, options: { filterFreq: 2100 } }); setTimeout(() => chord([784, 988, 1175], 'sine', 0.1, 0.12, 45, { filterFreq: 2200 }), 80); },
  diceMiss() { tone(240, 'triangle', 0.08, 0.06, { slideTo: 170, filterFreq: 900, release: 0.08 }); setTimeout(() => tone(160, 'square', 0.12, 0.06, { slideTo: 120, filterFreq: 620, release: 0.12 }), 65); },
  reveal() { chord([440, 554, 659], 'sine', 0.15, 0.14, 90, { filterFreq: 1800 }); },
  mole() { tone(520, 'triangle', 0.05, 0.14, { filterFreq: 1500 }); setTimeout(() => tone(720, 'triangle', 0.04, 0.1, { filterFreq: 1800 }), 55); },
  bomb() { tone(100, 'sawtooth', 0.5, 0.21, { slideTo: 58, filterFreq: 280, release: 0.5 }); setTimeout(() => { tone(62, 'square', 0.28, 0.16, { filterFreq: 180, release: 0.26 }); tone(182, 'sawtooth', 0.16, 0.1, { filterFreq: 380, release: 0.16 }); }, 180); },
  bombBlast() { tone(54, 'sawtooth', 0.48, 0.28, { slideTo: 28, filterFreq: 220, release: 0.46 }); setTimeout(() => tone(96, 'square', 0.26, 0.15, { slideTo: 48, filterFreq: 320, release: 0.24 }), 22); setTimeout(() => tone(180, 'triangle', 0.18, 0.1, { slideTo: 90, filterFreq: 520, release: 0.18 }), 64); setTimeout(() => chord([120, 96, 72], 'sawtooth', 0.18, 0.08, 42, { filterFreq: 340 }), 90); },
  levelUp() { arpeggio([523, 659, 784, 1047], { type: 'triangle', duration: 0.12, volume: 0.18, step: 75, repeat: 1, options: { filterFreq: 2000 } }); },
  balloonParty() { for (let i = 0; i < 6; i += 1) setTimeout(() => tone(720 + Math.random() * 260, 'sine', 0.06, 0.11, { filterFreq: 2200, release: 0.06 }), i * 34); setTimeout(() => chord([659, 784, 988], 'triangle', 0.11, 0.14, 55, { filterFreq: 2000 }), 40); },
  balloonOops() { tone(280, 'triangle', 0.09, 0.08, { slideTo: 190, filterFreq: 1100, release: 0.09 }); setTimeout(() => tone(170, 'square', 0.14, 0.07, { slideTo: 110, filterFreq: 700, release: 0.14 }), 58); setTimeout(() => tone(130, 'sawtooth', 0.16, 0.06, { slideTo: 88, filterFreq: 480, release: 0.16 }), 96); },
  balloonBonus() { tone(620, 'sine', 0.08, 0.09, { slideTo: 860, filterFreq: 1700, release: 0.08 }); setTimeout(() => chord([740, 980], 'triangle', 0.06, 0.08, 40, { filterFreq: 1800 }), 45); },
  introTreasure() { chord([523, 659, 784], 'triangle', 0.12, 0.13, 65, { filterFreq: 1700 }); setTimeout(() => tone(988, 'sine', 0.12, 0.08, { filterFreq: 2100, release: 0.12 }), 180); },
  introMonster() { arpeggio([220, 277, 330, 392], { type: 'square', duration: 0.08, volume: 0.1, step: 60, repeat: 1, options: { filterFreq: 1200 } }); },
  introChef() { chord([330, 392, 523], 'sine', 0.1, 0.11, 75, { filterFreq: 1800 }); setTimeout(() => tone(660, 'triangle', 0.08, 0.07, { slideTo: 880, filterFreq: 1600 }), 150); },
  introHero() { tone(220, 'sawtooth', 0.16, 0.08, { slideTo: 440, filterFreq: 900, release: 0.16 }); setTimeout(() => chord([440, 554, 659], 'triangle', 0.12, 0.12, 55, { filterFreq: 1700 }), 120); },
  introDino() { tone(130, 'triangle', 0.18, 0.11, { slideTo: 180, filterFreq: 600, release: 0.18 }); setTimeout(() => tone(260, 'sine', 0.09, 0.07, { filterFreq: 1200, release: 0.09 }), 160); },
  sparkle() { arpeggio([784, 988, 1175], { type: 'sine', duration: 0.07, volume: 0.09, step: 45, repeat: 1, options: { filterFreq: 2200 } }); },
  successTreasure() { chord([659, 784, 988], 'triangle', 0.14, 0.16, 60, { filterFreq: 1800 }); setTimeout(() => this.sparkle(), 160); },
  treasureChest() { chord([523, 659, 784, 988], 'triangle', 0.12, 0.14, 45, { filterFreq: 1900 }); setTimeout(() => tone(1175, 'sine', 0.12, 0.08, { filterFreq: 2200, release: 0.12 }), 110); setTimeout(() => arpeggio([784, 988, 1175], { type: 'sine', duration: 0.08, volume: 0.08, step: 42, repeat: 1, options: { filterFreq: 2100 } }), 150); },
  treasureWrong() { tone(220, 'triangle', 0.12, 0.07, { slideTo: 160, filterFreq: 880, release: 0.12 }); setTimeout(() => tone(150, 'square', 0.14, 0.06, { slideTo: 100, filterFreq: 520, release: 0.14 }), 55); setTimeout(() => tone(96, 'sawtooth', 0.16, 0.05, { slideTo: 72, filterFreq: 360, release: 0.16 }), 110); },
  successMonster() { arpeggio([330, 392, 494, 659], { type: 'square', duration: 0.09, volume: 0.12, step: 55, repeat: 1, options: { filterFreq: 1600 } }); },
  successChef() { chord([392, 494, 659], 'sine', 0.14, 0.14, 70, { filterFreq: 1700 }); setTimeout(() => tone(880, 'triangle', 0.08, 0.07, { filterFreq: 2000, release: 0.08 }), 170); },
  chefServe() { chord([523, 659, 784], 'triangle', 0.1, 0.12, 52, { filterFreq: 1900 }); setTimeout(() => tone(988, 'sine', 0.11, 0.07, { filterFreq: 2200, release: 0.11 }), 105); setTimeout(() => arpeggio([784, 988, 1175], { type: 'sine', duration: 0.07, volume: 0.08, step: 42, repeat: 1, options: { filterFreq: 2100 } }), 145); },
  chefOops() { tone(210, 'triangle', 0.1, 0.07, { slideTo: 150, filterFreq: 820, release: 0.1 }); setTimeout(() => tone(146, 'square', 0.14, 0.06, { slideTo: 104, filterFreq: 520, release: 0.14 }), 55); setTimeout(() => tone(96, 'sawtooth', 0.18, 0.05, { slideTo: 72, filterFreq: 340, release: 0.18 }), 110); },
  successHero() { arpeggio([392, 523, 659, 784], { type: 'triangle', duration: 0.11, volume: 0.14, step: 65, repeat: 1, options: { filterFreq: 1900 } }); },
  heroBoost() { tone(190, 'sawtooth', 0.18, 0.08, { slideTo: 420, filterFreq: 820, release: 0.18 }); setTimeout(() => chord([440, 554, 659], 'triangle', 0.1, 0.1, 42, { filterFreq: 1800 }), 90); },
  heroRescue() { chord([523, 659, 784], 'triangle', 0.12, 0.14, 55, { filterFreq: 1900 }); setTimeout(() => arpeggio([784, 988, 1175], { type: 'sine', duration: 0.07, volume: 0.08, step: 44, repeat: 1, options: { filterFreq: 2200 } }), 120); },
  heroAlert() { tone(220, 'square', 0.12, 0.07, { slideTo: 170, filterFreq: 760, release: 0.12 }); setTimeout(() => tone(160, 'sawtooth', 0.16, 0.06, { slideTo: 120, filterFreq: 500, release: 0.16 }), 55); setTimeout(() => tone(320, 'triangle', 0.08, 0.05, { slideTo: 250, filterFreq: 1100, release: 0.08 }), 125); },
  successDino() { tone(165, 'triangle', 0.14, 0.1, { slideTo: 220, filterFreq: 700, release: 0.14 }); setTimeout(() => chord([330, 392, 523], 'sine', 0.1, 0.1, 55, { filterFreq: 1500 }), 120); },
  dinoLeap() { tone(160, 'triangle', 0.12, 0.08, { slideTo: 280, filterFreq: 900, release: 0.12 }); setTimeout(() => tone(320, 'sine', 0.08, 0.06, { slideTo: 440, filterFreq: 1500, release: 0.08 }), 85); },
  dinoHatch() { chord([523, 659, 784], 'triangle', 0.1, 0.12, 52, { filterFreq: 1900 }); setTimeout(() => arpeggio([784, 988, 1175], { type: 'sine', duration: 0.07, volume: 0.08, step: 42, repeat: 1, options: { filterFreq: 2200 } }), 120); },
  dinoStumble() { tone(180, 'square', 0.1, 0.08, { slideTo: 132, filterFreq: 640, release: 0.1 }); setTimeout(() => tone(112, 'sawtooth', 0.18, 0.07, { slideTo: 84, filterFreq: 360, release: 0.18 }), 60); setTimeout(() => tone(280, 'triangle', 0.07, 0.05, { slideTo: 220, filterFreq: 1100, release: 0.07 }), 125); },
  heartbeat() { tone(78, 'sine', 0.14, 0.14, { filterFreq: 240, release: 0.14 }); setTimeout(() => tone(78, 'sine', 0.1, 0.1, { filterFreq: 240, release: 0.1 }), 190); },
};

export { stopAmbient };
