import { useEffect, useMemo, useState } from 'react';
import { SFX, configureAudio, startAmbient, stopAmbient } from './utils/audio';
import { commitScorm, getScormDebugInfo, setScormLocation, setScormStatus } from './utils/scormRuntime';
import { buildManifest, buildSCORM, buildRuntimeScormFiles, makeZip, sanitizeScormFileBase, validateScormQuestions } from './utils/scorm';
import { loadAppState, saveAppState } from './utils/appStore';
import TopNav from './components/common/TopNav';
import PremiumStage from './components/common/PremiumStage';
import AutoFitStage from './components/common/AutoFitStage';
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
import HUD from './components/games/HUD';

function FeedbackOverlay({ feedback, onClose, onRetry, onSkip }) {
  if (!feedback) return null;
  const tone = feedback.type === 'correct'
    ? { bg: 'linear-gradient(180deg, rgba(46,204,113,.18), rgba(46,204,113,.08))', border: '1px solid rgba(46,204,113,.28)', title: '#CFFFE3' }
    : { bg: 'linear-gradient(180deg, rgba(255,107,107,.16), rgba(255,107,107,.07))', border: '1px solid rgba(255,107,107,.22)', title: '#FFD5D5' };
  return <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'grid', placeItems: 'center', background: 'rgba(2,6,23,.46)', backdropFilter: 'blur(10px)', padding: 18 }}><div style={{ width: 'min(760px, 100%)', borderRadius: 30, padding: 24, background: tone.bg, border: tone.border, boxShadow: '0 26px 70px rgba(0,0,0,.35)', display: 'grid', gap: 14 }}><div style={{ fontSize: 30, fontWeight: 900, color: tone.title }}>{feedback.title}</div><div style={{ color: '#E9F0FF', fontSize: 16, lineHeight: 1.65 }}>{feedback.message}</div>{!!feedback.hint && <div style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,.06)' }}><b>İpucu:</b> {feedback.hint}</div>}{!!feedback.explanation && <div style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,.06)' }}><b>Açıklama:</b> {feedback.explanation}</div>}<div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>{feedback.canRetry ? <button onClick={onRetry} style={{ padding: '13px 18px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#6C5CE7,#4ECDC4)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>Tekrar Dene</button> : null}{feedback.canSkip ? <button onClick={onSkip} style={{ padding: '13px 18px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.06)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>Pas Geç</button> : null}<button onClick={onClose} style={{ padding: '13px 18px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.06)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>{feedback.primaryLabel || 'Devam'}</button></div></div></div>;
}

export default function BilgiArena() {
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
  const initialSettings = { ...(persisted.settings || {}), ...((bootstrapScormData?.settings) || {}) };
  const [settings, setSettings] = useState(initialSettings);
  const [competition, setCompetition] = useState({ ...(persisted.competition || {}), ...((bootstrapScormData?.competition) || {}) });
  const [branding] = useState(persisted.branding);
  const initialScreenFromUrl = (() => { try { return new URLSearchParams(window.location.search).get('screen'); } catch { return null; } })();
  const [scr, setScr] = useState(initialScreenFromUrl || (initialIsScormContentMode ? 'games' : 'home'));
  const [topic, setTopic] = useState(bootstrapScormData?.topic || '');
  const [qs, setQs] = useState(initialQuestions);
  const [fqs, setFqs] = useState(initialQuestions);
  const [sel, setSel] = useState(new Set(initialQuestions.map((_, i) => i)));
  const [isScormContentMode] = useState(initialIsScormContentMode);
  const [scormStudioOpen, setScormStudioOpen] = useState(false);
  const [scormExportState, setScormExportState] = useState({ status: 'idle', message: '' });
  const [activeAssignment, setActiveAssignment] = useState(null);
  const notify = (message) => { if (typeof window !== 'undefined') window.alert(message); };
  const updateSettings = (patch) => setSettings((prev) => ({ ...prev, ...patch }));
  const mergeSettings = (patch) => setSettings((prev) => ({ ...prev, ...(patch || {}) }));
  const mergeCompetition = (patch) => setCompetition((prev) => ({ ...prev, ...(patch || {}) }));

  const {
    membership, setMembership, registerTeacher, loginTeacher, createClass, addStudent, createAssignment, joinStudentByCode, loginStudentAccount, logoutMembership, createSyncBackup, importSyncBackup, pushMembershipToCloud, pullMembershipFromCloud, startAssignmentFlow,
  } = useMembershipController({
    initialMembership: persisted.membership, initialUserRole: persisted.settings?.userRole || 'teacher', notify, setScreen: setScr, setTopic,
    onSettingsUserRoleChange: (role) => updateSettings({ userRole: role }), onSettingsMerge: mergeSettings, onCompetitionMerge: mergeCompetition,
    onStartAssignmentTopic: (assignment) => { setActiveAssignment(assignment); setTimeout(() => { generateQuestions(assignment.topic); }, 50); },
  });

  const difficulty = useMemo(() => getDifficultyProfile(settings.difficulty), [settings.difficulty]);
  const { loading: aiLoading, error: aiError, dots: aiDots, setDots, generateQuestions } = useQuestionGenerator({ topic, setTopic, normalizeQuestion, notifyError: notify, onBeforeGenerate: () => { SFX.click(); }, onAfterGenerate: () => undefined, onQuestionsReady: (json) => { setQs(json); setFqs(json); setSel(new Set(json.map((_, i) => i))); setScr('editor'); setScormLocation('editor'); commitScorm(); }, onSuccess: () => { SFX.win(); } });
  const { mode, gqs, sc, lv, cb, mcb, cor, wrong, st, tt, tm, glow, feedback, bonusState, currentPlayer, hasNextPlayer, analytics, badge, mmt, bombT, quickActions, renderGameProps, startG, nextCompetitionPlayer, goBackToModes, leaveGame, togglePresentationLock, handleFeedbackClose, handleRetry, handleSkip } = useGameFlow({ settings, updateSettings, difficulty, topic, competition, setCompetition, membership, setMembership, activeAssignment, setScreen: setScr, screen: scr });
  const { scormApi } = useScormBridge({ screen: scr, score: sc, correct: cor, total: gqs.length, startedAt: st });
  const { initScorm } = scormApi;

  useEffect(() => { saveAppState({ settings, competition, branding, membership }); }, [settings, competition, branding, membership]);
  useEffect(() => { configureAudio({ soundProfile: settings.soundProfile, masterVolume: settings.masterVolume }); }, [settings.soundProfile, settings.masterVolume]);
  useEffect(() => { if (typeof document === 'undefined') return undefined; const body = document.body; body.dataset.smartboard = settings.smartboardMode ? 'on' : 'off'; body.dataset.soundProfile = settings.soundProfile || 'balanced'; body.dataset.themeFamily = settings.themeFamily || 'aurora'; body.dataset.lowMotion = settings.lowMotion ? 'on' : 'off'; return () => { delete body.dataset.smartboard; delete body.dataset.soundProfile; delete body.dataset.themeFamily; delete body.dataset.lowMotion; }; }, [settings.smartboardMode, settings.soundProfile, settings.themeFamily, settings.lowMotion]);
  useEffect(() => { if (scr === 'game' && mode?.id) { startAmbient(mode.id); return () => stopAmbient(); } stopAmbient(); return undefined; }, [scr, mode?.id, settings.soundProfile]);
  useEffect(() => { if (!aiLoading) return undefined; const i = setInterval(() => setDots((d) => (d.length >= 3 ? '' : `${d}.`)), 400); return () => clearInterval(i); }, [aiLoading, setDots]);
  useEffect(() => { if (!initScorm()) return; setScormStatus('incomplete'); setScormLocation(initialIsScormContentMode ? 'games' : 'app-opened'); commitScorm(); }, [initScorm, initialIsScormContentMode]);

  const openMembership = () => setScr('membership');
  const closeMembership = () => setScr('home');
  const dlSCORM = async (exportOptions = {}) => {
    try {
      SFX.click();
      if (!fqs || fqs.length === 0) {
        setScormExportState({ status: 'error', message: 'Önce en az 1 soru seçmelisin.' });
        return;
      }

      setScormExportState({ status: 'loading', message: 'SCORM paketi hazırlanıyor...' });
      const validQuestions = validateScormQuestions(fqs);
      const safeTopic = topic || 'Bilgi Arena';
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
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      };

      const defaultName = `${sanitizeScormFileBase(safeTopic)}_SCORM_${scormOptions.scormVersion}.zip`;
      const canUseLocalExporter = import.meta.env.DEV || ['localhost', '127.0.0.1'].includes(window.location.hostname);
      const exporterEndpoints = canUseLocalExporter ? ['http://127.0.0.1:3210/export-scorm', 'http://localhost:3210/export-scorm'] : [];
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
  const renderGame = () => { if (!renderGameProps.mode || !renderGameProps.sharedProps) return null; return renderGameByMode(renderGameProps.mode.id, renderGameProps.sharedProps, { ...(renderGameProps.extraPropsByMode[renderGameProps.mode.id] || {}), gameRunId: renderGameProps.gameRunId }); };
  const handleTopNavNavigate = (target) => {
    if (scr === 'game' && target !== 'game') {
      leaveGame(target);
      return;
    }
    setScr(target);
  };


  return <div id='app' className={scr === 'game' ? 'screen-game' : 'screen-scroll'}><TopNav screen={scr} setScreen={setScr} isScormContentMode={isScormContentMode} onNavigate={handleTopNavNavigate} /><div className={scr === 'game' ? 'game-shell' : 'page-shell'}>{scr === 'home' && !isScormContentMode && <Home topic={topic} setTopic={setTopic} genQs={generateQuestions} loading={aiLoading} dots={aiDots} err={aiError} branding={branding} settings={settings} membership={membership} openMembership={openMembership} openModes={() => setScr('games')} openScorm={() => { setScr('game-settings'); setScormStudioOpen(true); }} />}{scr === 'membership' && !isScormContentMode && <MembershipHub membership={membership} onClose={closeMembership} onTeacherRegister={registerTeacher} onTeacherLogin={loginTeacher} onClassCreate={createClass} onStudentAdd={addStudent} onAssignmentCreate={createAssignment} onStudentJoin={joinStudentByCode} onStudentAccountLogin={loginStudentAccount} onStartAssignment={startAssignmentFlow} onLogout={logoutMembership} onImportSync={importSyncBackup} onCreateSyncPackage={() => createSyncBackup({ settings, competition, topic })} onCloudPush={() => pushMembershipToCloud({ settings, competition, topic })} onCloudPull={pullMembershipFromCloud} />}{scr === 'editor' && !isScormContentMode && <Editor topic={topic} qs={qs} setQs={setQs} sel={sel} setSel={setSel} setFqs={setFqs} setScr={setScr} />}{isScormContentMode && (scr === 'home' || scr === 'membership' || scr === 'editor') && <Modes view='games' topic={topic} fqs={fqs} setScr={setScr} startG={(m) => startG(m, { questions: fqs })} dlSCORM={dlSCORM} isScormContentMode={isScormContentMode} branding={branding} settings={settings} updateSettings={updateSettings} scormStudioOpen={scormStudioOpen} openScormStudio={() => setScormStudioOpen(true)} closeScormStudio={() => setScormStudioOpen(false)} scormExportState={scormExportState} competition={competition} updateCompetition={setCompetition} resetLeaderboard={() => setCompetition((prev) => ({ ...prev, leaderboard: [], currentPlayerIndex: 0 }))} availableGameIds={scormSelectedGameIds} />}{(scr === 'game-settings' || scr === 'modes') && <Modes view='settings' topic={topic} fqs={fqs} setScr={setScr} startG={(m) => startG(m, { questions: fqs })} dlSCORM={dlSCORM} isScormContentMode={isScormContentMode} branding={branding} settings={settings} updateSettings={updateSettings} scormStudioOpen={scormStudioOpen} openScormStudio={() => setScormStudioOpen(true)} closeScormStudio={() => setScormStudioOpen(false)} scormExportState={scormExportState} competition={competition} updateCompetition={setCompetition} resetLeaderboard={() => setCompetition((prev) => ({ ...prev, leaderboard: [], currentPlayerIndex: 0 }))} availableGameIds={scormSelectedGameIds} />}{scr === 'games' && <Modes view='games' topic={topic} fqs={fqs} setScr={setScr} startG={(m) => startG(m, { questions: fqs })} dlSCORM={dlSCORM} isScormContentMode={isScormContentMode} branding={branding} settings={settings} updateSettings={updateSettings} scormStudioOpen={scormStudioOpen} openScormStudio={() => setScormStudioOpen(true)} closeScormStudio={() => setScormStudioOpen(false)} scormExportState={scormExportState} competition={competition} updateCompetition={setCompetition} resetLeaderboard={() => setCompetition((prev) => ({ ...prev, leaderboard: [], currentPlayerIndex: 0 }))} availableGameIds={scormSelectedGameIds} />}{scr === 'game' && <><HUD mode={mode} mmt={mmt} bombT={bombT} tm={tm} lv={lv} sc={sc} cb={cb} cor={cor} glow={glow} onBackToModes={goBackToModes} brandTitle={branding.title} topic={topic} currentPlayerName={currentPlayer?.name || ''} currentPlayerIndex={competition.currentPlayerIndex} totalPlayers={competition.players?.length || 1} competitionMode={competition.enabled} duration={settings.duration === 9999 ? 9999 : Math.round(settings.duration * difficulty.timeMul)} difficulty={settings.difficulty} userRole={settings.userRole} bonusState={bonusState} quickActions={quickActions} lockPresentation={togglePresentationLock} presentationLocked={settings.presentationLock} turnMode={settings.turnMode} compact /><AutoFitStage><PremiumStage mode={mode} compact>{renderGame()}</PremiumStage></AutoFitStage></>}{scr === 'res' && <Results mode={mode} topic={topic} sc={sc} cor={cor} wrong={wrong} gqs={gqs} mcb={mcb} tt={tt} startG={(m) => startG(m, { questions: fqs })} setScr={setScr} competitionMode={competition.enabled} currentPlayerName={currentPlayer?.name || 'Tek Oyuncu'} onNextPlayer={nextCompetitionPlayer} hasNextPlayer={hasNextPlayer} leaderboard={competition.leaderboard} analytics={analytics} badge={badge} onDownloadBadge={() => { const blob = new Blob([JSON.stringify({ badge, analytics, score: sc }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'tt-rozet.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }} />}</div><FeedbackOverlay feedback={feedback} onClose={handleFeedbackClose} onRetry={handleRetry} onSkip={handleSkip} />{import.meta.env.DEV ? <div style={{ position: 'fixed', right: 18, bottom: 12, fontSize: 11, color: 'rgba(255,255,255,.45)' }}>SCORM: {getScormDebugInfo().scormVersion || 'web'} • queue {getScormDebugInfo().queued}</div> : null}</div>;
}
