import { getScormSuspendData, setScormSuspendData } from './scormRuntime';

const STORAGE_KEY = 'tt-oyun-app-state-v6';

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
    effectsEnabled: true,
    musicEnabled: true,
    effectsVolume: 0.92,
    musicVolume: 0.56,
    lowMotion: false,
    themeFamily: 'aurora',
    turnMode: 'manual',
    scormVersion: '1.2',
    publishMode: false,
    selectedGames: [],
    questionGenerationCount: '',
    gameQuestionProfiles: {},
    memoryCardSelectionMode: 'random',
    memoryCardQuestionKeys: [],
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
    title: 'T-T Eğitsel Oyunlar',
    subtitle: 'Akıllı tahta uyumlu • Yarışma destekli • Web ve SCORM uyumlu',
    logoText: 'T-T',
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
    savedQuestionSets: [],
    questionDrafts: [],
    cloud: {
      enabled: false,
      lastSyncAt: '',
      lastPullAt: '',
      status: 'idle',
      mode: 'disabled',
      message: '',
    },
  },
  workspace: {
    topic: '',
    editorDraft: null,
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
    workspace: { ...base.workspace, ...(loaded?.workspace || {}) },
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

  const scormSafe = JSON.stringify({
    settings: merged.settings,
    competition: merged.competition,
    branding: merged.branding,
    membership: {
      currentUser: merged.membership?.currentUser || null,
      reports: merged.membership?.reports || [],
      assignmentProgress: merged.membership?.assignmentProgress || [],
    },
    workspace: {
      topic: merged.workspace?.topic || '',
    },
  });

  setScormSuspendData(scormSafe.slice(0, 3800));
}
