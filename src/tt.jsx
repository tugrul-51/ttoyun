import { useEffect, useMemo, useRef, useState } from 'react';
import { SFX, configureAudio, startAmbient, stopAmbient } from './utils/audio';
import { commitScorm, getScormDebugInfo, setScormLocation, setScormStatus } from './utils/scormRuntime';
import { buildManifest, buildSCORM, buildRuntimeScormFiles, makeZip, sanitizeScormFileBase, validateScormQuestions } from './utils/scorm';
import { loadAppState, saveAppState } from './utils/appStore';
import TopNav from './components/common/TopNav';
import PremiumStage from './components/common/PremiumStage';
import { getDifficultyProfile, normalizeQuestion } from './utils/gameAnalytics';
import { MODES, renderGameByMode } from './constants/gameRegistry';
import { useScormBridge } from './hooks/useScormBridge';
import { useMembershipController } from './hooks/useMembershipController';
import { useQuestionGenerator } from './hooks/useQuestionGenerator';
import { useGameFlow } from './hooks/useGameFlow';

import Home from './components/Home';
import Editor from './components/Editor';
import Modes from './components/Modes';
import Results from './components/Results';
import MembershipHub from './components/MembershipHub';
import SavedQuestionSets from './components/SavedQuestionSets';
import HUD from './components/games/HUD';
import GameLiveLeaderboard from './components/common/GameLiveLeaderboard';
import InGameStageMeta from './components/common/InGameStageMeta';
import AutoFitStage from './components/common/AutoFitStage';
import { getGameQuestionSummary, resolveGameQuestions } from './utils/gameQuestionSelection';

function FeedbackOverlay({ feedback, onClose, onRetry, onSkip }) {
  if (!feedback) return null;
  const tone = feedback.type === 'correct'
    ? { bg: 'linear-gradient(180deg, rgba(46,204,113,.18), rgba(46,204,113,.08))', border: '1px solid rgba(46,204,113,.28)', title: '#CFFFE3' }
    : { bg: 'linear-gradient(180deg, rgba(255,107,107,.16), rgba(255,107,107,.07))', border: '1px solid rgba(255,107,107,.22)', title: '#FFD5D5' };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'grid', placeItems: 'center', background: 'rgba(2,6,23,.46)', backdropFilter: 'blur(10px)', padding: 18 }}>
      <div style={{ width: 'min(760px, 100%)', borderRadius: 30, padding: 24, background: tone.bg, border: tone.border, boxShadow: '0 26px 70px rgba(0,0,0,.35)', display: 'grid', gap: 14 }}>
        <div style={{ fontSize: 30, fontWeight: 900, color: tone.title }}>{feedback.title}</div>
        <div style={{ color: '#E9F0FF', fontSize: 16, lineHeight: 1.65 }}>{feedback.message}</div>
        {!!feedback.hint && <div style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,.06)' }}><b>İpucu:</b> {feedback.hint}</div>}
        {!!feedback.explanation && <div style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,.06)' }}><b>Açıklama:</b> {feedback.explanation}</div>}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {feedback.canRetry ? <button onClick={onRetry} style={{ padding: '13px 18px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#6C5CE7,#4ECDC4)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>Tekrar Dene</button> : null}
          {feedback.canSkip ? <button onClick={onSkip} style={{ padding: '13px 18px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.06)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>Pas Geç</button> : null}
          <button onClick={onClose} style={{ padding: '13px 18px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.06)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>{feedback.primaryLabel || 'Devam'}</button>
        </div>
      </div>
    </div>
  );
}

function GameReadyOverlay({ open, mode, questionSummary, currentPlayerName = '', competitionMode = false, onStart, onBack }) {
  if (!open || !mode) return null;

  const maarifFocus = Array.isArray(mode.maarifFocus) ? mode.maarifFocus : [];
  const sdoFocus = Array.isArray(mode.sdoFocus) ? mode.sdoFocus : [];
  const effectiveQuestionCount = questionSummary?.effectiveCount ?? 0;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 65, display: 'grid', placeItems: 'center', background: 'rgba(2,6,23,.58)', backdropFilter: 'blur(10px)', padding: 18 }}>
      <div style={{ width: 'min(840px, 100%)', borderRadius: 34, padding: 26, background: 'linear-gradient(180deg, rgba(8,13,31,.98), rgba(8,13,31,.92))', border: '1px solid rgba(255,255,255,.10)', boxShadow: '0 32px 90px rgba(0,0,0,.44)', display: 'grid', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'start', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, color: '#AFC2DF', fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 }}>Oyun hazır</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ width: 76, height: 76, borderRadius: 24, display: 'grid', placeItems: 'center', fontSize: 38, background: 'linear-gradient(135deg, rgba(108,92,231,.32), rgba(78,205,196,.24))', border: '1px solid rgba(255,255,255,.12)' }}>{mode.icon}</div>
              <div>
                <div style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 1000, color: '#fff', lineHeight: 1.05 }}>{mode.name}</div>
                <div style={{ color: '#C7D4E8', marginTop: 8, lineHeight: 1.65, fontSize: 16 }}>
                  Bu turda <strong style={{ color: '#fff' }}>{effectiveQuestionCount}</strong> soru kullanılacak. {questionSummary?.detailLabel || 'Hazır sorular bu oyun için otomatik düzenlenecek.'} Zaman ve etkileşim yalnızca sen <strong style={{ color: '#fff' }}>Oyunu Başlat</strong> butonuna bastığında başlayacak.
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 10, minWidth: 220 }}>
            <div style={{ padding: '12px 14px', borderRadius: 18, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}><div style={{ color: '#fff', fontWeight: 900, fontSize: 24 }}>{effectiveQuestionCount}</div><div style={{ color: '#A3B6D4', fontSize: 12, marginTop: 4 }}>oyunda kullanılacak soru</div></div>
            <div style={{ padding: '12px 14px', borderRadius: 18, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}><div style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>{competitionMode ? (currentPlayerName || 'Sıradaki oyuncu') : 'Tek oyuncu turu'}</div><div style={{ color: '#A3B6D4', fontSize: 12, marginTop: 4 }}>{competitionMode ? 'bu turu oynayacak kullanıcı' : 'oyuncu'}</div></div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          <div style={{ padding: 18, borderRadius: 24, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#DDE7F5', lineHeight: 1.7 }}>
            <div style={{ fontSize: 12, color: '#AFC2DF', fontWeight: 900, letterSpacing: '.10em', textTransform: 'uppercase', marginBottom: 10 }}>Maarif odağı</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{maarifFocus.map((item) => <span key={item} style={{ padding: '8px 10px', borderRadius: 999, background: 'rgba(108,92,231,.18)', border: '1px solid rgba(108,92,231,.24)', color: '#F1EDFF', fontWeight: 800, fontSize: 12 }}>{item}</span>)}</div>
          </div>
          <div style={{ padding: 18, borderRadius: 24, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#DDE7F5', lineHeight: 1.7 }}>
            <div style={{ fontSize: 12, color: '#AFC2DF', fontWeight: 900, letterSpacing: '.10em', textTransform: 'uppercase', marginBottom: 10 }}>SDÖ odağı</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{sdoFocus.map((item) => <span key={item} style={{ padding: '8px 10px', borderRadius: 999, background: 'rgba(78,205,196,.14)', border: '1px solid rgba(78,205,196,.24)', color: '#D8FFFB', fontWeight: 800, fontSize: 12 }}>{item}</span>)}</div>
          </div>
        </div>
        <div style={{ padding: 18, borderRadius: 24, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#DDE7F5', lineHeight: 1.7 }}>
          <strong style={{ color: '#fff' }}>Sahne hatırlatması:</strong> Önce soru paneline göz at, sonra oyunu başlat. Böylece çocuklar hazırlanmış olur, zaman erkenden akmaz ve oyun deneyimi daha kontrollü başlar. {mode.reflectionPrompt ? `Tur sonunda sınıfa şu soruyu yöneltebilirsin: ${mode.reflectionPrompt}` : ''}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={onBack} style={{ padding: '13px 18px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.05)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>← Oyunlara Dön</button>
          <button onClick={onStart} style={{ padding: '14px 24px', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg,#6C5CE7,#4ECDC4)', color: '#fff', fontWeight: 900, cursor: 'pointer', fontSize: 17 }}>▶ Oyunu Başlat</button>
        </div>
      </div>
    </div>
  );
}

function getFullscreenElement() {
  if (typeof document === 'undefined') return null;
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

async function requestFullscreenForElement(element) {
  if (!element) return false;
  if (typeof element.requestFullscreen === 'function') {
    await element.requestFullscreen();
    return true;
  }
  if (typeof element.webkitRequestFullscreen === 'function') {
    element.webkitRequestFullscreen();
    return true;
  }
  return false;
}

async function exitFullscreenSafely() {
  if (typeof document === 'undefined') return false;
  if (typeof document.exitFullscreen === 'function') {
    await document.exitFullscreen();
    return true;
  }
  if (typeof document.webkitExitFullscreen === 'function') {
    document.webkitExitFullscreen();
    return true;
  }
  return false;
}


export default function TTEgitselOyunlar() {
  const persisted = loadAppState();
  const bootstrapScormData = typeof window !== 'undefined' ? (window.__SCORM_DATA__ || null) : null;
  const initialIsScormContentMode = !!bootstrapScormData;
  const scormSelectedGameIds = (() => {
    const raw = bootstrapScormData?.selectedGames || bootstrapScormData?.settings?.selectedGames || null;
    if (!Array.isArray(raw) || !raw.length) return null;
    const allowed = new Set(MODES.map((game) => game.id));
    const valid = raw.filter((id) => allowed.has(id));
    return valid.length ? Array.from(new Set(valid)) : null;
  })();

  const initialQuestions = (bootstrapScormData?.questions || []).map(normalizeQuestion);
  const initialSettings = { ...(persisted.settings || {}), ...(bootstrapScormData?.settings || {}) };
  const initialScreenFromUrl = (() => { try { return new URLSearchParams(window.location.search).get('screen'); } catch { return null; } })();

  const [settings, setSettings] = useState(initialSettings);
  const [competition, setCompetition] = useState({ ...(persisted.competition || {}), ...(bootstrapScormData?.competition || {}) });
  const [branding] = useState(persisted.branding);
  const [scr, setScr] = useState(initialScreenFromUrl || (initialIsScormContentMode ? 'games' : 'home'));
  const [topic, setTopic] = useState(bootstrapScormData?.topic || persisted.workspace?.topic || '');
  const [qs, setQs] = useState(initialQuestions);
  const [fqs, setFqs] = useState(initialQuestions);
  const [sel, setSel] = useState(new Set(initialQuestions.map((_, i) => i)));
  const [isScormContentMode] = useState(initialIsScormContentMode);
  const [scormStudioOpen, setScormStudioOpen] = useState(false);
  const [scormExportState, setScormExportState] = useState({ status: 'idle', message: '' });
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [pendingMemberAction, setPendingMemberAction] = useState(null);
  const [savePromptTicket, setSavePromptTicket] = useState(0);
  const [activeSavedQuestionSet, setActiveSavedQuestionSet] = useState(null);
  const [localEditorDraft, setLocalEditorDraft] = useState(persisted.workspace?.editorDraft || null);
  const appRef = useRef(null);
  const stageFullscreenRef = useRef(null);
  const [viewport, setViewport] = useState({ width: typeof window !== 'undefined' ? window.innerWidth : 1440, height: typeof window !== 'undefined' ? window.innerHeight : 900 });
  const [fullscreenMode, setFullscreenMode] = useState('off');
  const isGameFullscreen = fullscreenMode !== 'off';

  const notify = (message) => { if (typeof window !== 'undefined') window.alert(message); };
  const localDraftCandidate = !isScormContentMode ? localEditorDraft : null;
  const updateSettings = (patch) => setSettings((prev) => ({ ...prev, ...patch }));
  const mergeSettings = (patch) => setSettings((prev) => ({ ...prev, ...(patch || {}) }));
  const mergeCompetition = (patch) => setCompetition((prev) => ({ ...prev, ...(patch || {}) }));

  const {
    membership,
    setMembership,
    registerTeacher,
    loginTeacher,
    createClass,
    addStudent,
    createAssignment,
    joinStudentByCode,
    loginStudentAccount,
    logoutMembership,
    saveQuestionSet,
    duplicateQuestionSet,
    deleteQuestionSet,
    saveQuestionDraft,
    dismissQuestionDraft,
    exportQuestionSet,
    importQuestionSetFile,
    createSyncBackup,
    importSyncBackup,
    pushMembershipToCloud,
    pullMembershipFromCloud,
    startAssignmentFlow,
  } = useMembershipController({
    initialMembership: persisted.membership,
    initialUserRole: persisted.settings?.userRole || 'teacher',
    notify,
    setScreen: setScr,
    setTopic,
    onSettingsUserRoleChange: (role) => updateSettings({ userRole: role }),
    onSettingsMerge: mergeSettings,
    onCompetitionMerge: mergeCompetition,
    onStartAssignmentTopic: (assignment) => {
      setActiveAssignment(assignment);
      setActiveSavedQuestionSet(null);
      setTimeout(() => { generateQuestions(assignment.topic); }, 50);
    },
  });

  const difficulty = useMemo(() => getDifficultyProfile(settings.difficulty), [settings.difficulty]);
  const autoDraft = useMemo(() => {
    const ownerId = membership.currentUser?.id || 'guest';
    return (membership.questionDrafts || []).find((item) => item.ownerId === ownerId && (!activeSavedQuestionSet?.id || item.questionSetId === activeSavedQuestionSet.id)) || null;
  }, [membership.questionDrafts, membership.currentUser?.id, activeSavedQuestionSet?.id]);


  const { loading: aiLoading, error: aiError, dots: aiDots, setDots, generateQuestions } = useQuestionGenerator({
    topic,
    setTopic,
    normalizeQuestion,
    defaultQuestionCount: settings.questionGenerationCount,
    notifyError: notify,
    onBeforeGenerate: () => { SFX.click(); setActiveSavedQuestionSet(null); },
    onAfterGenerate: () => undefined,
    onQuestionsReady: (json) => {
      setQs(json);
      setFqs(json);
      setSel(new Set(json.map((_, i) => i)));
      setLocalEditorDraft({
        id: `local-${Date.now()}`,
        topic: bootstrapScormData?.topic || topic || '',
        sourceName: (bootstrapScormData?.topic || topic || 'Yeni soru seti'),
        questions: json,
        selectedIndexes: json.map((_, i) => i),
        settingsSnapshot: settings,
        updatedAt: new Date().toISOString(),
      });
      setScr('editor');
      setScormLocation('editor');
      commitScorm();
    },
    onSuccess: () => { SFX.win(); },
  });

  const {
    mode,
    gqs,
    qi,
    sc,
    lv,
    mcb,
    cor,
    wrong,
    st,
    tt,
    tm,
    feedback,
    bonusState,
    currentPlayer,
    hasNextPlayer,
    analytics,
    badge,
    mmt,
    bombT,
    quickActions,
    renderGameProps,
    gameStarted,
    answerLogs,
    startCurrentGame,
    startG,
    nextCompetitionPlayer,
    selectCompetitionPlayer,
    goBackToModes,
    leaveGame,
    togglePresentationLock,
    handleFeedbackClose,
    handleRetry,
    handleSkip,
  } = useGameFlow({ settings, updateSettings, difficulty, topic, competition, setCompetition, membership, setMembership, activeAssignment, activeSavedQuestionSet, setScreen: setScr, screen: scr });

  const { scormApi } = useScormBridge({ screen: scr, score: sc, correct: cor, total: gqs.length, startedAt: st });
  const { initScorm } = scormApi;

  useEffect(() => { saveAppState({ settings, competition, branding, membership, workspace: { topic, editorDraft: localEditorDraft } }); }, [settings, competition, branding, membership, topic, localEditorDraft]);
  useEffect(() => { configureAudio({ soundProfile: settings.soundProfile, masterVolume: settings.masterVolume, effectsEnabled: settings.effectsEnabled, musicEnabled: settings.musicEnabled, effectsVolume: settings.effectsVolume, musicVolume: settings.musicVolume }); }, [settings.soundProfile, settings.masterVolume, settings.effectsEnabled, settings.musicEnabled, settings.effectsVolume, settings.musicVolume]);
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const body = document.body;
    body.dataset.smartboard = settings.smartboardMode ? 'on' : 'off';
    body.dataset.soundProfile = settings.soundProfile || 'balanced';
    body.dataset.themeFamily = settings.themeFamily || 'aurora';
    body.dataset.lowMotion = settings.lowMotion ? 'on' : 'off';
    return () => {
      delete body.dataset.smartboard;
      delete body.dataset.soundProfile;
      delete body.dataset.themeFamily;
      delete body.dataset.lowMotion;
    };
  }, [settings.smartboardMode, settings.soundProfile, settings.themeFamily, settings.lowMotion]);
  useEffect(() => {
    if (scr === 'game' && mode?.id) {
      startAmbient(mode.id);
      return () => stopAmbient();
    }
    stopAmbient();
    return undefined;
  }, [scr, mode?.id, settings.soundProfile, settings.musicEnabled, settings.musicVolume]);
  useEffect(() => {
    if (!aiLoading) return undefined;
    const intervalId = setInterval(() => setDots((d) => (d.length >= 3 ? '' : `${d}.`)), 400);
    return () => clearInterval(intervalId);
  }, [aiLoading, setDots]);
  useEffect(() => {
    if (!initScorm()) return;
    setScormStatus('incomplete');
    setScormLocation(initialIsScormContentMode ? 'games' : 'app-opened');
    commitScorm();
  }, [initScorm, initialIsScormContentMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const onFullscreenChange = () => {
      const activeElement = getFullscreenElement();
      setFullscreenMode((prev) => {
        if (activeElement) return 'native';
        return prev === 'native' ? 'off' : prev;
      });
    };
    const onFullscreenError = () => setFullscreenMode('fallback');
    onFullscreenChange();
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('fullscreenerror', onFullscreenError);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      document.removeEventListener('fullscreenerror', onFullscreenError);
    };
  }, []);

  useEffect(() => {
    if (scr === 'game') return undefined;
    if (fullscreenMode === 'native') exitFullscreenSafely().catch(() => undefined);
    if (fullscreenMode === 'fallback') setFullscreenMode('off');
    return undefined;
  }, [scr, fullscreenMode]);

  useEffect(() => {
    if (fullscreenMode !== 'fallback' || typeof window === 'undefined') return undefined;
    const onKeyDown = (event) => { if (event.key === 'Escape') setFullscreenMode('off'); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [fullscreenMode]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const previousOverflow = document.body.style.overflow;
    if (fullscreenMode === 'fallback') document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [fullscreenMode]);

  useEffect(() => {
    if (!membership.currentUser || !pendingMemberAction) return;
    if (pendingMemberAction === 'save-questions') {
      setScr('editor');
      setSavePromptTicket((prev) => prev + 1);
    } else if (pendingMemberAction === 'saved-questions') {
      setScr('saved-questions');
    }
    setPendingMemberAction(null);
  }, [membership.currentUser, pendingMemberAction]);

  const openMembership = () => {
    setPendingMemberAction(null);
    setScr('membership');
  };

  const closeMembership = () => {
    setPendingMemberAction(null);
    setScr('home');
  };

  const handleRequireMembershipForSave = () => {
    setPendingMemberAction('save-questions');
    setScr('membership');
  };

  const handleOpenSavedQuestions = () => {
    if (!membership.currentUser) {
      setPendingMemberAction('saved-questions');
      setScr('membership');
      return;
    }
    setScr('saved-questions');
  };

  const handleSaveQuestionSet = (payload) => {
    const result = saveQuestionSet(payload);
    if (result?.id) {
      setActiveSavedQuestionSet({
        id: result.id,
        name: payload.name,
        folder: payload.folder || '',
        tags: String(payload.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean),
        publishMode: payload.publishMode || 'edit',
        notes: payload.notes || '',
      });
    }
    return result;
  };

  const handleDuplicateQuestionSet = (questionSet) => {
    const duplicated = duplicateQuestionSet(questionSet?.id);
    if (duplicated?.id) setScr('saved-questions');
  };

  const handleExportCurrentSet = (format = 'json') => {
    const payload = {
      id: activeSavedQuestionSet?.id,
      name: activeSavedQuestionSet?.name || (topic ? `${topic} soru seti` : 'Yeni soru seti'),
      topic,
      questions: qs,
      selectedIndexes: Array.from(sel).sort((a, b) => a - b),
      settingsSnapshot: settings,
      folder: activeSavedQuestionSet?.folder || '',
      tags: activeSavedQuestionSet?.tags || [],
      publishMode: activeSavedQuestionSet?.publishMode || 'edit',
      notes: activeSavedQuestionSet?.notes || '',
    };
    exportQuestionSet(payload, format);
  };

  const handlePreviewQuestionSet = (questionSet = null) => {
    if (questionSet) {
      handleEditQuestionSet(questionSet);
      setTimeout(() => { setScr('games'); }, 0);
      return;
    }
    const chosen = qs.filter((_, index) => sel.has(index));
    if (chosen.length < 4) {
      notify('Önizleme için en az 4 soru seçmelisin.');
      return;
    }
    setFqs(chosen);
    mergeSettings({ publishMode: true });
    setScr('games');
  };

  const handleImportQuestionSet = async (file) => {
    const imported = await importQuestionSetFile(file);
    if (imported?.id) handleEditQuestionSet(imported);
  };

  const handleRestoreDraft = (draft) => {
    if (!draft) return;
    const normalizedQuestions = Array.isArray(draft.questions) ? draft.questions.map((item) => normalizeQuestion(item)) : [];
    const indexes = Array.isArray(draft.selectedIndexes) && draft.selectedIndexes.length ? draft.selectedIndexes : normalizedQuestions.map((_, index) => index);
    setTopic(draft.topic || '');
    setQs(normalizedQuestions);
    setSel(new Set(indexes));
    setFqs(normalizedQuestions.filter((_, index) => indexes.includes(index)));
    if (draft.settingsSnapshot) mergeSettings(draft.settingsSnapshot);
    setScr('editor');
    dismissQuestionDraft(draft.id);
  };

  const handleDeleteQuestionSet = (questionSet) => {
    if (!questionSet?.id) return;
    if (typeof window !== 'undefined' && !window.confirm(`"${questionSet.name}" adlı soru seti silinsin mi?`)) return;
    deleteQuestionSet(questionSet.id);
    if (activeSavedQuestionSet?.id === questionSet.id) setActiveSavedQuestionSet(null);
  };

  const handleRestoreLocalDraft = () => {
    if (!localEditorDraft) return;
    const normalizedQuestions = Array.isArray(localEditorDraft.questions) ? localEditorDraft.questions.map((item) => normalizeQuestion(item)) : [];
    const indexes = Array.isArray(localEditorDraft.selectedIndexes) && localEditorDraft.selectedIndexes.length ? localEditorDraft.selectedIndexes : normalizedQuestions.map((_, index) => index);
    setTopic(localEditorDraft.topic || '');
    setQs(normalizedQuestions);
    setSel(new Set(indexes));
    setFqs(normalizedQuestions.filter((_, index) => indexes.includes(index)));
    if (localEditorDraft.settingsSnapshot) mergeSettings(localEditorDraft.settingsSnapshot);
    setScr('editor');
    setScormLocation('editor');
    commitScorm();
    SFX.click();
  };

  const dismissLocalDraft = () => setLocalEditorDraft(null);

  const leaderboardMap = useMemo(() => new Map((competition.leaderboard || []).map((entry) => [entry.id, entry])), [competition.leaderboard]);
  const liveLeaderboardEntries = useMemo(() => {
    const activePlayerId = currentPlayer?.id || membership.currentUser?.id || 'solo-player';
    const activePlayerName = currentPlayer?.name || membership.currentUser?.name || 'Tek oyuncu';
    const basePlayers = competition.enabled && competition.players?.length
      ? competition.players
      : [{ id: activePlayerId, name: activePlayerName, avatar: currentPlayer?.avatar || membership.currentUser?.avatar || '🧑' }];

    return basePlayers
      .map((player, index) => {
        const stored = leaderboardMap.get(player.id);
        const baseTotal = Number(stored?.total || 0);
        const isActive = competition.enabled ? index === competition.currentPlayerIndex : true;
        const liveGain = isActive ? Number(sc || 0) : 0;
        return {
          id: player.id,
          name: player.name || `Oyuncu ${index + 1}`,
          avatar: player.avatar || '👤',
          total: baseTotal + liveGain,
          baseTotal,
          liveGain,
          active: isActive,
          badge: stored?.badge || (isActive ? badge?.name : ''),
        };
      })
      .sort((a, b) => (b.total - a.total) || Number(b.active) - Number(a.active))
      .map((entry, rankIndex) => ({ ...entry, rank: rankIndex + 1 }));
  }, [competition.enabled, competition.players, competition.currentPlayerIndex, currentPlayer?.id, currentPlayer?.name, currentPlayer?.avatar, membership.currentUser?.id, membership.currentUser?.name, membership.currentUser?.avatar, leaderboardMap, sc, badge?.name]);
  const gameRailDocked = viewport.width >= 1500;
  const gameRailCompact = viewport.width < 1640;
  const gameScrollNeedsWidthFit = viewport.width < 1320;

  const launchGame = (selectedMode) => {
    const baseQuestions = Array.isArray(fqs) ? fqs : [];
    const questionsForGame = resolveGameQuestions(selectedMode?.id, baseQuestions, settings);
    startG(selectedMode, { questions: questionsForGame });
  };
  const currentGameQuestionSummary = useMemo(() => mode?.id ? { ...getGameQuestionSummary(mode.id, fqs, settings), effectiveCount: gqs.length || getGameQuestionSummary(mode.id, fqs, settings).effectiveCount } : null, [mode?.id, fqs, settings, gqs.length]);
  const stageFitConfigMap = {
    balloon: { minScale: 0.82, padding: 4 },
    bomb: { minScale: 0.82, padding: 4 },
    chef: { minScale: 0.84, padding: 4 },
    dice: { minScale: 0.82, padding: 4 },
    dino: { minScale: 0.84, padding: 4 },
    memory: { minScale: 0.8, padding: 4 },
    millionaire: { minScale: 0.78, padding: 4 },
    monster: { minScale: 0.84, padding: 4 },
    openbox: { minScale: 0.8, padding: 4 },
    race: { minScale: 0.84, padding: 4 },
    treasure: { minScale: 0.84, padding: 4 },
    wheel: { minScale: 0.8, padding: 4 },
    whack: { minScale: 0.82, padding: 4 },
  };
  const stageFitConfig = stageFitConfigMap[mode?.id] || null;

  const handleEditQuestionSet = (questionSet) => {
    const normalizedQuestions = Array.isArray(questionSet?.questions) ? questionSet.questions.map((item) => normalizeQuestion(item)) : [];
    const indexes = Array.isArray(questionSet?.selectedIndexes) && questionSet.selectedIndexes.length
      ? questionSet.selectedIndexes.filter((index) => Number.isInteger(index) && index >= 0 && index < normalizedQuestions.length)
      : normalizedQuestions.map((_, index) => index);
    const selectedSet = new Set(indexes);
    setTopic(questionSet?.topic || '');
    setQs(normalizedQuestions);
    setSel(selectedSet);
    setFqs(normalizedQuestions.filter((_, index) => selectedSet.has(index)));
    if (questionSet?.settingsSnapshot) mergeSettings(questionSet.settingsSnapshot);
    setActiveSavedQuestionSet(questionSet ? { ...questionSet } : null);
    setScr('editor');
    setScormLocation('editor');
    commitScorm();
    SFX.click();
  };

  useEffect(() => {
    if (isScormContentMode || scr !== 'editor' || !qs.length) return undefined;
    const timeoutId = setTimeout(() => {
      saveQuestionDraft({
        draftId: autoDraft?.id,
        questionSetId: activeSavedQuestionSet?.id,
        topic,
        questions: qs,
        selectedIndexes: Array.from(sel).sort((a, b) => a - b),
        settingsSnapshot: settings,
        sourceName: activeSavedQuestionSet?.name || (topic ? `${topic} taslağı` : 'Yeni taslak'),
      });
    }, 1200);
    return () => clearTimeout(timeoutId);
  }, [isScormContentMode, scr, qs, sel, topic, settings, activeSavedQuestionSet?.id, activeSavedQuestionSet?.name, autoDraft?.id, saveQuestionDraft]);

  useEffect(() => {
    if (isScormContentMode || scr !== 'editor' || !qs.length) return undefined;
    const timeoutId = setTimeout(() => {
      setLocalEditorDraft({
        id: localEditorDraft?.id || `local-${Date.now()}`,
        topic,
        questions: qs,
        selectedIndexes: Array.from(sel).sort((a, b) => a - b),
        settingsSnapshot: settings,
        sourceName: activeSavedQuestionSet?.name || (topic ? `${topic} yerel taslağı` : 'Yerel taslak'),
        updatedAt: new Date().toISOString(),
      });
    }, 900);
    return () => clearTimeout(timeoutId);
  }, [isScormContentMode, scr, qs, sel, topic, settings, activeSavedQuestionSet?.name, localEditorDraft?.id]);

  const dlSCORM = async (exportOptions = {}) => {
    try {
      SFX.click();
      if (!fqs || fqs.length === 0) {
        setScormExportState({ status: 'error', message: 'Önce en az 1 soru seçmelisin.' });
        return;
      }

      setScormExportState({ status: 'loading', message: 'SCORM paketi hazırlanıyor...' });
      const validQuestions = validateScormQuestions(fqs);
      const safeTopic = topic || 'T-T Eğitsel Oyunlar';
      const scormOptions = { ...(settings || {}), difficulty: settings.difficulty, scormVersion: settings.scormVersion || '1.2' };
      const selectedGameIds = Array.isArray(exportOptions.selectedGameIds) && exportOptions.selectedGameIds.length
        ? Array.from(new Set(exportOptions.selectedGameIds.filter((id) => MODES.some((game) => game.id === id))))
        : MODES.map((game) => game.id);
      const payload = {
        topic: safeTopic,
        questions: validQuestions,
        settings: { ...scormOptions, selectedGames: selectedGameIds },
        competition,
        selectedGames: selectedGameIds,
      };

      const triggerDownload = (blob, filename) => {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.URL.revokeObjectURL(url);
      };

      const defaultName = `${sanitizeScormFileBase(safeTopic)}_SCORM_${scormOptions.scormVersion}.zip`;
      const exporterEndpoints = ['http://127.0.0.1:3210/export-scorm', 'http://localhost:3210/export-scorm'];
      let exporterError = null;

      for (const endpoint of exporterEndpoints) {
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            let message = 'SCORM export başarısız.';
            try {
              const data = await res.json();
              if (data?.error) message = data.error;
            } catch {
              // noop
            }
            throw new Error(message);
          }
          const blob = await res.blob();
          const header = res.headers.get('Content-Disposition') || '';
          const match = header.match(/filename="?([^";]+)"?/i);
          triggerDownload(blob, match?.[1] || defaultName);
          setScormExportState({ status: 'success', message: `${scormOptions.scormVersion} profili için ${validQuestions.length} soru ve ${selectedGameIds.length} oyun ile SCORM paketi üretildi.` });
          return;
        } catch (error) {
          exporterError = error;
        }
      }

      if (import.meta.env.DEV) {
        throw new Error(exporterError?.message || 'Yerel SCORM exporter servisine ulaşılamadı. Uygulamayı BASLAT.bat veya npm run dev ile yeniden aç.');
      }

      let files;
      try {
        files = await buildRuntimeScormFiles(safeTopic, validQuestions, scormOptions, { competition, selectedGames: selectedGameIds });
      } catch (runtimeError) {
        console.warn('Tam uygulama SCORM paketi alınamadı, legacy moda düşülüyor.', runtimeError);
        const launchContent = buildSCORM(safeTopic, validQuestions, scormOptions);
        const manifest = buildManifest(safeTopic, { scormVersion: scormOptions.scormVersion });
        files = [
          { name: 'index.html', content: launchContent },
          { name: 'launch.html', content: launchContent },
          { name: 'imsmanifest.xml', content: manifest },
          { name: 'SCORM_API_wrapper.js', content: '' },
          { name: 'scorm-data.js', content: `window.__SCORM_DATA__ = ${JSON.stringify({ topic: safeTopic, questions: validQuestions, settings: { ...scormOptions, selectedGames: selectedGameIds }, competition, selectedGames: selectedGameIds }, null, 2)};` },
        ];
      }

      triggerDownload(makeZip(files), defaultName);
      setScormExportState({ status: 'success', message: `${scormOptions.scormVersion} profili için ${validQuestions.length} soru ve ${selectedGameIds.length} oyun ile SCORM paketi üretildi.` });
    } catch (error) {
      setScormExportState({ status: 'error', message: error.message || 'SCORM indirilemedi.' });
    }
  };

  const renderGame = () => {
    if (!renderGameProps.mode || !renderGameProps.sharedProps) return null;
    return renderGameByMode(renderGameProps.mode.id, renderGameProps.sharedProps, {
      ...(renderGameProps.extraPropsByMode[renderGameProps.mode.id] || {}),
      gameRunId: renderGameProps.gameRunId,
    });
  };

  const toggleGameFullscreen = async () => {
    if (typeof document === 'undefined') return;
    try {
      if (fullscreenMode === 'fallback') {
        setFullscreenMode('off');
        return;
      }
      if (getFullscreenElement()) {
        await exitFullscreenSafely();
        setFullscreenMode('off');
        return;
      }
      const target = stageFullscreenRef.current;
      const opened = await requestFullscreenForElement(target);
      setFullscreenMode(opened ? 'native' : 'fallback');
    } catch (error) {
      console.warn('Tam ekran açılamadı.', error);
      setFullscreenMode('fallback');
    }
  };

  const handleTopNavNavigate = (target) => {
    if (!isScormContentMode && target === 'saved-questions') {
      handleOpenSavedQuestions();
      return;
    }
    if (scr === 'game' && target !== 'game') {
      leaveGame(target);
      return;
    }
    setScr(target);
  };

  return (
    <div ref={appRef} id='app' className={scr === 'game' ? 'screen-game' : 'screen-scroll'}>
      {scr !== 'game' ? <TopNav screen={scr} setScreen={setScr} isScormContentMode={isScormContentMode} onNavigate={handleTopNavNavigate} /> : null}
      <div className={scr === 'game' ? 'game-shell' : 'page-shell'} style={scr === 'game' ? { overflow: 'visible' } : undefined}>
        {scr === 'home' && !isScormContentMode ? (
          <Home
            topic={topic}
            setTopic={setTopic}
            genQs={generateQuestions}
            loading={aiLoading}
            dots={aiDots}
            err={aiError}
            branding={branding}
            settings={settings}
            membership={membership}
            openMembership={openMembership}
            openModes={() => setScr('games')}
            openScorm={() => { setScr('game-settings'); setScormStudioOpen(true); }}
            openEditor={() => setScr('editor')}
            openSavedQuestions={handleOpenSavedQuestions}
            questionCountInput={settings.questionGenerationCount}
            onQuestionCountChange={(value) => updateSettings({ questionGenerationCount: value })}
            localDraft={localDraftCandidate}
            onRestoreLocalDraft={handleRestoreLocalDraft}
            onDismissLocalDraft={dismissLocalDraft}
          />
        ) : null}

        {scr === 'membership' && !isScormContentMode ? (
          <MembershipHub
            membership={membership}
            onClose={closeMembership}
            onTeacherRegister={registerTeacher}
            onTeacherLogin={loginTeacher}
            onClassCreate={createClass}
            onStudentAdd={addStudent}
            onAssignmentCreate={createAssignment}
            onStudentJoin={joinStudentByCode}
            onStudentAccountLogin={loginStudentAccount}
            onStartAssignment={startAssignmentFlow}
            onLogout={logoutMembership}
            onImportSync={importSyncBackup}
            onCreateSyncPackage={() => createSyncBackup({ settings, competition, topic })}
            onCloudPush={() => pushMembershipToCloud({ settings, competition, topic })}
            onCloudPull={pullMembershipFromCloud}
          />
        ) : null}

        {scr === 'editor' && !isScormContentMode ? (
          <Editor
            topic={topic}
            qs={qs}
            setQs={(next) => { setQs(next); if (activeSavedQuestionSet && next !== qs) setActiveSavedQuestionSet((prev) => prev ? { ...prev } : null); }}
            sel={sel}
            setSel={setSel}
            setFqs={setFqs}
            setScr={setScr}
            currentUser={membership.currentUser}
            onRequireMembership={handleRequireMembershipForSave}
            onSaveQuestionSet={handleSaveQuestionSet}
            activeSavedQuestionSet={activeSavedQuestionSet}
            savePromptTicket={savePromptTicket}
            onPreview={() => handlePreviewQuestionSet()}
            onExportCurrentSet={handleExportCurrentSet}
            autoDraft={autoDraft || localDraftCandidate}
            onRestoreDraft={autoDraft ? handleRestoreDraft : handleRestoreLocalDraft}
            onDismissDraft={autoDraft ? dismissQuestionDraft : dismissLocalDraft}
            settings={settings}
          />
        ) : null}

        {scr === 'saved-questions' && !isScormContentMode ? (
          <SavedQuestionSets
            currentUser={membership.currentUser}
            questionSets={membership.savedQuestionSets || []}
            reports={membership.reports || []}
            onEdit={handleEditQuestionSet}
            onDelete={handleDeleteQuestionSet}
            onDuplicate={handleDuplicateQuestionSet}
            onExport={exportQuestionSet}
            onPreview={handlePreviewQuestionSet}
            onOpenMembership={openMembership}
            onImport={handleImportQuestionSet}
          />
        ) : null}

        {isScormContentMode && (scr === 'home' || scr === 'membership' || scr === 'editor' || scr === 'saved-questions') ? (
          <Modes
            view='games'
            topic={topic}
            fqs={fqs}
            setScr={setScr}
            startG={launchGame}
            dlSCORM={dlSCORM}
            isScormContentMode={isScormContentMode}
            branding={branding}
            settings={settings}
            updateSettings={updateSettings}
            scormStudioOpen={scormStudioOpen}
            openScormStudio={() => setScormStudioOpen(true)}
            closeScormStudio={() => setScormStudioOpen(false)}
            scormExportState={scormExportState}
            competition={competition}
            updateCompetition={setCompetition}
            resetLeaderboard={() => setCompetition((prev) => ({ ...prev, leaderboard: [], currentPlayerIndex: 0 }))}
            availableGameIds={scormSelectedGameIds}
          />
        ) : null}

        {(scr === 'game-settings' || scr === 'modes') ? (
          <Modes
            view='settings'
            topic={topic}
            fqs={fqs}
            setScr={setScr}
            startG={launchGame}
            dlSCORM={dlSCORM}
            isScormContentMode={isScormContentMode}
            branding={branding}
            settings={settings}
            updateSettings={updateSettings}
            scormStudioOpen={scormStudioOpen}
            openScormStudio={() => setScormStudioOpen(true)}
            closeScormStudio={() => setScormStudioOpen(false)}
            scormExportState={scormExportState}
            competition={competition}
            updateCompetition={setCompetition}
            resetLeaderboard={() => setCompetition((prev) => ({ ...prev, leaderboard: [], currentPlayerIndex: 0 }))}
            availableGameIds={scormSelectedGameIds}
          />
        ) : null}

        {scr === 'games' ? (
          <Modes
            view='games'
            topic={topic}
            fqs={fqs}
            setScr={setScr}
            startG={launchGame}
            dlSCORM={dlSCORM}
            isScormContentMode={isScormContentMode}
            branding={branding}
            settings={settings}
            updateSettings={updateSettings}
            scormStudioOpen={scormStudioOpen}
            openScormStudio={() => setScormStudioOpen(true)}
            closeScormStudio={() => setScormStudioOpen(false)}
            scormExportState={scormExportState}
            competition={competition}
            updateCompetition={setCompetition}
            resetLeaderboard={() => setCompetition((prev) => ({ ...prev, leaderboard: [], currentPlayerIndex: 0 }))}
            availableGameIds={scormSelectedGameIds}
          />
        ) : null}

        {scr === 'game' ? (
          <>
            <HUD
              mode={mode}
              onBackToModes={goBackToModes}
              brandTitle={branding.title}
              topic={topic}
              currentPlayerName={currentPlayer?.name || ''}
              currentPlayerIndex={competition.currentPlayerIndex}
              totalPlayers={competition.players?.length || 1}
              competitionMode={competition.enabled}
              difficulty={settings.difficulty}
              userRole={settings.userRole}
              bonusState={bonusState}
              quickActions={quickActions}
              lockPresentation={togglePresentationLock}
              presentationLocked={settings.presentationLock}
              turnMode={settings.turnMode}
              compact
              isFullscreen={isGameFullscreen}
              onToggleFullscreen={toggleGameFullscreen}
            />
            <div style={{ display: 'grid', gridTemplateRows: gameRailDocked ? 'auto' : 'auto auto', gap: 10, overflow: 'visible' }}>
              <div style={{ display: 'grid', gridTemplateColumns: gameRailDocked ? 'minmax(0, 1fr) minmax(220px, 258px)' : 'minmax(0, 1fr)', gap: 10, overflow: 'visible', alignItems: 'start' }}>
                <div style={{ minWidth: 0, display: 'grid', gap: 10, alignContent: 'start' }}>
                  <div
                    ref={stageFullscreenRef}
                    style={{
                      position: isGameFullscreen && fullscreenMode === 'fallback' ? 'fixed' : 'relative',
                      inset: isGameFullscreen && fullscreenMode === 'fallback' ? 0 : 'auto',
                      zIndex: isGameFullscreen && fullscreenMode === 'fallback' ? 90 : 'auto',
                      minWidth: 0,
                      width: isGameFullscreen && fullscreenMode === 'fallback' ? '100vw' : 'auto',
                      minHeight: isGameFullscreen ? '100dvh' : 0,
                      height: isGameFullscreen ? '100dvh' : 'auto',
                      padding: isGameFullscreen ? 8 : 0,
                      background: isGameFullscreen ? 'radial-gradient(circle at top, rgba(108,92,231,.18), rgba(4,8,22,.98) 62%)' : 'transparent',
                      boxSizing: 'border-box',
                    }}
                  >
                    <PremiumStage mode={mode} compact>
                      <div style={{ display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr)', minHeight: 0, height: isGameFullscreen ? '100%' : 'auto' }}>
                        <InGameStageMeta
                          currentPlayerName={currentPlayer?.name || membership.currentUser?.name || 'Tek oyuncu'}
                          competitionMode={competition.enabled}
                          score={sc}
                          correct={cor}
                          lives={lv}
                          timeLeft={mode?.id === 'memory' ? mmt : mode?.id === 'bomb' ? bombT : tm}
                          questionIndex={qi}
                          totalQuestions={gqs.length}
                          showTime={settings.duration !== 9999}
                          isFullscreen={isGameFullscreen}
                          onToggleFullscreen={toggleGameFullscreen}
                        />
                        <div style={{ minHeight: 0, maxWidth: '100%', overflowX: isGameFullscreen || gameScrollNeedsWidthFit ? 'auto' : 'hidden', overflowY: 'auto', paddingRight: 2, paddingBottom: gameScrollNeedsWidthFit ? 4 : 0 }}>
                          {stageFitConfig ? (
                            <AutoFitStage padding={stageFitConfig.padding} minScale={stageFitConfig.minScale} fitHeight={false}>
                              {renderGame()}
                            </AutoFitStage>
                          ) : renderGame()}
                        </div>
                      </div>
                      <FeedbackOverlay feedback={feedback} onClose={handleFeedbackClose} onRetry={handleRetry} onSkip={handleSkip} />
                    </PremiumStage>
                  </div>
                </div>
                {gameRailDocked ? (
                  <GameLiveLeaderboard
                    entries={liveLeaderboardEntries}
                    competitionMode={competition.enabled}
                    currentPlayerName={currentPlayer?.name || membership.currentUser?.name || 'Tek oyuncu'}
                    currentPlayerScore={sc}
                    questionIndex={qi}
                    totalQuestions={gqs.length}
                    compact={gameRailCompact}
                  />
                ) : null}
              </div>
              {!gameRailDocked ? (
                <div style={{ minHeight: 0 }}>
                  <GameLiveLeaderboard
                    entries={liveLeaderboardEntries}
                    competitionMode={competition.enabled}
                    currentPlayerName={currentPlayer?.name || membership.currentUser?.name || 'Tek oyuncu'}
                    currentPlayerScore={sc}
                    questionIndex={qi}
                    totalQuestions={gqs.length}
                    compact
                  />
                </div>
              ) : null}
            </div>
            <GameReadyOverlay open={!gameStarted} mode={mode} questionSummary={currentGameQuestionSummary} currentPlayerName={currentPlayer?.name || membership.currentUser?.name || ''} competitionMode={competition.enabled} onStart={startCurrentGame} onBack={goBackToModes} />
          </>
        ) : null}

        {scr === 'res' ? (
          <Results
            mode={mode}
            topic={topic}
            sc={sc}
            cor={cor}
            wrong={wrong}
            gqs={gqs}
            mcb={mcb}
            tt={tt}
            startG={launchGame}
            setScr={setScr}
            competitionMode={competition.enabled}
            currentPlayerName={currentPlayer?.name || 'Tek Oyuncu'}
            onNextPlayer={nextCompetitionPlayer}
            hasNextPlayer={hasNextPlayer}
            competitionPlayers={competition.players || []}
            currentPlayerIndex={competition.currentPlayerIndex || 0}
            onSelectPlayer={selectCompetitionPlayer}
            leaderboard={competition.leaderboard}
            analytics={analytics}
            badge={badge}
            answerLogs={answerLogs}
            onGoToGames={() => setScr('games')}
            turnMode={settings.turnMode}
            onDownloadBadge={() => {
              const blob = new Blob([JSON.stringify({ badge, analytics, score: sc }, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const anchor = document.createElement('a');
              anchor.href = url;
              anchor.download = 'tt-rozet.json';
              document.body.appendChild(anchor);
              anchor.click();
              anchor.remove();
              URL.revokeObjectURL(url);
            }}
          />
        ) : null}
      </div>
      {import.meta.env.DEV ? <div style={{ position: 'fixed', right: 18, bottom: 12, fontSize: 11, color: 'rgba(255,255,255,.45)' }}>SCORM: {getScormDebugInfo().scormVersion || 'web'} • queue {getScormDebugInfo().queued}</div> : null}
    </div>
  );
}
