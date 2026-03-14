import { getScormSuspendData, setScormSuspendData } from './scormRuntime';

const STORAGE_KEY = 'tt-oyun-app-state-v5';

const DEFAULT_STATE = {
  settings: {
    duration: 20,
    difficulty: 'medium',
    userRole: 'teacher',
    smartboardMode: true,
    presentationLock: false,
    quickToolbar: true,
    soundProfile: 'cinematic',
    masterVolume: 0.58,
    lowMotion: false,
    themeFamily: 'aurora',
    turnMode: 'manual',
    scormVersion: '1.2',
  },
  competition: {
    enabled: false,
    playerMode: 'individual',
    players: [],
    teams: [],
    currentPlayerIndex: 0,
    leaderboard: [],
    tournament: {
      totalRounds: 0,
      badges: [],
      certificates: [],
    },
  },
  branding: {
    title: 'T~T Eğitsel Çevrimiçi Oyunlar',
    subtitle: 'Akıllı tahta uyumlu • Yarışma destekli • Web ve SCORM uyumlu',
    logoText: 'T~T',
  },
  membership: {
    currentUser: null,
    teachers: [],
    students: [],
    classes: [],
    assignments: [],
    reports: [],
    assignmentProgress: [],
    syncPackages: [],
    cloud: {
      enabled: false,
      lastSyncAt: '',
      lastPullAt: '',
      status: 'idle',
      mode: 'disabled',
      message: '',
    },
  },
};

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function mergeState(base, loaded) {
  return {
    ...base,
    ...loaded,
    settings: { ...base.settings, ...(loaded?.settings || {}) },
    competition: {
      ...base.competition,
      ...(loaded?.competition || {}),
      tournament: {
        ...base.competition.tournament,
        ...(loaded?.competition?.tournament || {}),
      },
    },
    branding: { ...base.branding, ...(loaded?.branding || {}) },
    membership: { ...base.membership, ...(loaded?.membership || {}) },
  };
}

export function getDefaultAppState() {
  return clone(DEFAULT_STATE);
}

export function loadAppState() {
  const scormRaw = getScormSuspendData();
  if (scormRaw) {
    const parsed = safeParse(scormRaw);
    if (parsed) return mergeState(getDefaultAppState(), parsed);
  }

  if (typeof window === 'undefined') return getDefaultAppState();

  try {
    const localRaw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = safeParse(localRaw);
    return mergeState(getDefaultAppState(), parsed);
  } catch {
    return getDefaultAppState();
  }
}

export function saveAppState(nextState) {
  const merged = mergeState(getDefaultAppState(), nextState);
  const json = JSON.stringify(merged);

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, json);
    } catch (error) {
      console.warn('[appStore] localStorage save failed:', error);
    }
  }

  setScormSuspendData(json.slice(0, 3800));
}
