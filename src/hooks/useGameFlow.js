/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useRef, useState } from 'react';
import { SFX } from '../utils/audio';
import { spawnConfetti, spawnEmoji, shakeEl } from '../utils/effects';
import { commitScorm, setScormLocation, setScormProgressData, setScormScore, setScormSessionTime, setScormStatus } from '../utils/scormRuntime';
import { uid } from '../utils/membership';
import { clamp, computeAnalytics, extractTopicLabel, getBadge, normalizeQuestion, shuffleArray } from '../utils/gameAnalytics';

export function useGameFlow({ settings, updateSettings, difficulty, topic, competition, setCompetition, membership, setMembership, activeAssignment, setScreen, screen }) {
  const advanceTimeoutRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);
  const wheelSpinTimeoutRef = useRef(null);
  const wheelRevealTimeoutRef = useRef(null);
  const roundSavedRef = useRef(false);
  const lvRef = useRef(difficulty.lives);
  const modeRef = useRef(null);
  const qiRef = useRef(0);
  const gqsRef = useRef([]);
  const stRef = useRef(0);

  const [mode, setMode] = useState(null);
  const [gqs, setGqs] = useState([]);
  const [qi, setQi] = useState(0);
  const [sc, setSc] = useState(0);
  const [lv, setLv] = useState(3);
  const [cb, setCb] = useState(0);
  const [mcb, setMcb] = useState(0);
  const [cor, setCor] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [ans, setAns] = useState(null);
  const [st, setSt] = useState(0);
  const [tt, setTt] = useState(0);
  const [tm, setTm] = useState(settings.duration);
  const [glow, setGlow] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [answerLogs, setAnswerLogs] = useState([]);
  const [bonusState, setBonusState] = useState(null);
  const [questionRetryUsed, setQuestionRetryUsed] = useState(false);
  const [jokers, setJokers] = useState({ skip: 1, retry: 1, reveal: 1, fifty: true });
  const [blns, setBlns] = useState([]);
  const [wa, setWa] = useState(0);
  const [spn, setSpn] = useState(false);
  const [wp, setWp] = useState(0);
  const [swq, setSwq] = useState(false);
  const [wsi, setWsi] = useState(null);
  const [wheelReveal, setWheelReveal] = useState(false);
  const [dv, setDv] = useState(1);
  const [dr, setDr] = useState(false);
  const [bp, setBp] = useState(false);
  const [selectedBoxIndex, setSelectedBoxIndex] = useState(null);
  const [boxRevealOpen, setBoxRevealOpen] = useState(false);
  const [mcs, setMcs] = useState([]);
  const [mfl, setMfl] = useState([]);
  const [mma, setMma] = useState([]);
  const [mmv, setMmv] = useState(0);
  const [mmt, setMmt] = useState(Math.max(settings.duration * 6, 30));
  const [moles, setMoles] = useState([]);
  const [bombT, setBombT] = useState(settings.duration);
  const [, setFc2] = useState(false);
  const [gameRunId, setGameRunId] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const currentPlayer = useMemo(() => {
    if (!competition.enabled || !competition.players?.length) return null;
    return competition.players[competition.currentPlayerIndex] || competition.players[0] || null;
  }, [competition]);
  const hasNextPlayer = competition.enabled && !!competition.players?.length && competition.currentPlayerIndex < competition.players.length - 1;
  const analytics = useMemo(() => computeAnalytics(answerLogs, gqs), [answerLogs, gqs]);
  const badge = useMemo(() => getBadge(sc, analytics.accuracy), [sc, analytics.accuracy]);
  const supportsSkipJoker = (gameId) => gameId === 'millionaire';

  useEffect(() => { lvRef.current = lv; }, [lv]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { qiRef.current = qi; }, [qi]);
  useEffect(() => { gqsRef.current = gqs; }, [gqs]);
  useEffect(() => { stRef.current = st; }, [st]);

  const clearAdvanceTimeout = () => { if (advanceTimeoutRef.current) { clearTimeout(advanceTimeoutRef.current); advanceTimeoutRef.current = null; } };
  const clearFeedbackTimeout = () => { if (feedbackTimeoutRef.current) { clearTimeout(feedbackTimeoutRef.current); feedbackTimeoutRef.current = null; } };
  const clearWheelTimeouts = () => { if (wheelSpinTimeoutRef.current) clearTimeout(wheelSpinTimeoutRef.current); if (wheelRevealTimeoutRef.current) clearTimeout(wheelRevealTimeoutRef.current); wheelSpinTimeoutRef.current = null; wheelRevealTimeoutRef.current = null; };
  const setupTimedState = (gameId) => { const baseDuration = settings.duration === 9999 ? 9999 : Math.round(settings.duration * difficulty.timeMul); if (gameId === 'memory') { setMmt(baseDuration === 9999 ? 9999 : Math.max(baseDuration * 6, 30)); return; } setTm(baseDuration); setBombT(baseDuration); };
  const setupBlns = (q) => {
    const now = Date.now();
    const answerBalloons = q.o.map((o, i) => ({
      uid: `answer-${i}-${now}`,
      id: i,
      t: o,
      ok: i === q.a,
      kind: 'answer',
      c: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA'][i],
      cGlow: 'rgba(255,255,255,.30)',
      cDark: ['#B91C1C', '#0F766E', '#B45309', '#5B21B6'][i],
      size: 128,
      height: 158,
    }));

    const guaranteedBonuses = [
      { uid: `bonus-time-${now}`, id: 100, t: '', ok: false, kind: 'time', size: 118, height: 148 },
      { uid: `bonus-gold-${now}`, id: 101, t: '', ok: false, kind: 'gold', size: 116, height: 146 },
      { uid: `bonus-heart-${now}`, id: 102, t: '', ok: false, kind: 'heart', size: 116, height: 146 },
      { uid: `bonus-rainbow-${now}`, id: 103, t: '', ok: false, kind: 'rainbow', size: 116, height: 146 },
      { uid: `bonus-bomb-${now}`, id: 104, t: '', ok: false, kind: 'bomb', size: 116, height: 146 },
    ];

    const extraPool = [
      { kind: 'gold', icon: '✨' },
      { kind: 'time', icon: '⏱️' },
      { kind: 'rainbow', icon: '🌈' },
      { kind: 'heart', icon: '❤️' },
      { kind: 'bomb', icon: '⚠️' },
    ];

    const extraBonuses = shuffleArray(extraPool)
      .slice(0, 2)
      .map((item, index) => ({
        uid: `bonus-extra-${item.kind}-${index}-${now}`,
        id: 110 + index,
        t: '',
        ok: false,
        kind: item.kind,
        icon: item.icon,
        size: 112,
        height: 142,
      }));

    setBlns(shuffleArray([...answerBalloons, ...guaranteedBonuses, ...extraBonuses]));
  };
  const setupMem = (qA) => { const pairs = []; qA.forEach((q, i) => { pairs.push({ id: `q${i}`, p: i, t: 'q', x: q.q, m: false }); pairs.push({ id: `a${i}`, p: i, t: 'a', x: q.o[q.a], m: false }); }); setMcs(shuffleArray(pairs)); setMfl([]); setMma([]); setMmv(0); };
  const setupMoles = (q) => setMoles(q.o.map((o, i) => ({ id: i, t: o, ok: i === q.a, vis: false })));

  const getEffectDelay = (type, gameId = modeRef.current?.id) => {
    const correctMap = { balloon: 760, bomb: 900, wheel: 950, dice: 780, openbox: 820, race: 760, treasure: 720, hero: 720, chef: 700, dino: 720, monster: 720, millionaire: 720, whack: 560, memory: 420, quiz: 340, truefalse: 340 };
    const wrongMap = { balloon: 820, bomb: 980, wheel: 820, dice: 760, openbox: 780, race: 820, treasure: 760, hero: 760, chef: 760, dino: 760, monster: 760, millionaire: 760, whack: 620, memory: 420, quiz: 380, truefalse: 360 };
    const map = type === 'correct' ? correctMap : wrongMap;
    return map[gameId] || (type === 'correct' ? 420 : 520);
  };
  const scheduleFeedback = (payload, delay) => {
    clearFeedbackTimeout();
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(payload);
      feedbackTimeoutRef.current = null;
    }, delay);
  };
  const applyLifePenalty = (amount = 1) => {
    const nextLives = Math.max((lvRef.current || 0) - amount, 0);
    lvRef.current = nextLives;
    setLv(nextLives);
    return nextLives;
  };
  const endRoundAfterDelay = (delay = 500) => {
    clearAdvanceTimeout();
    advanceTimeoutRef.current = setTimeout(() => {
      endG();
    }, delay);
  };

  const resetRuntimeState = () => {
    clearAdvanceTimeout();
    clearFeedbackTimeout();
    clearWheelTimeouts();
    roundSavedRef.current = false;
    setMode(null);
    setGqs([]);
    setQi(0);
    setSc(0);
    setLv(difficulty.lives);
    lvRef.current = difficulty.lives;
    setCb(0);
    setMcb(0);
    setCor(0);
    setWrong(0);
    setAns(null);
    setSt(0);
    stRef.current = 0;
    setTt(0);
    setTm(settings.duration === 9999 ? 9999 : Math.round(settings.duration * difficulty.timeMul));
    setGlow(false);
    setFeedback(null);
    setAnswerLogs([]);
    setBonusState(null);
    setQuestionRetryUsed(false);
    setJokers({ skip: 1, retry: 1, reveal: 1, fifty: true });
    setBlns([]);
    setWa(0);
    setSpn(false);
    setWp(0);
    setSwq(false);
    setWsi(null);
    setWheelReveal(false);
    setDv(1);
    setDr(false);
    setBp(false);
    setSelectedBoxIndex(null);
    setBoxRevealOpen(false);
    setMcs([]);
    setMfl([]);
    setMma([]);
    setMmv(0);
    setMmt(settings.duration === 9999 ? 9999 : Math.max(Math.round(settings.duration * difficulty.timeMul) * 6, 30));
    setMoles([]);
    setBombT(settings.duration === 9999 ? 9999 : Math.round(settings.duration * difficulty.timeMul));
    setFc2(false);
    setGameStarted(false);
    setGameRunId((prev) => prev + 1);
  };


  useEffect(() => {
    if (screen !== 'game' || !mode?.id || ans !== null || !gameStarted) return undefined;
    const infiniteMode = settings.duration === 9999;
    if (infiniteMode) return undefined;
    const resetTimedValue = Math.round(settings.duration * difficulty.timeMul);
    const ti = setInterval(() => {
      if (mode?.id === 'memory') {
        setMmt((p) => {
          if (p <= 1) {
            trigNo();
            const nextLives = applyLifePenalty(1);
            setBonusState({ label: '⏳ Süre doldu • 1 can eksildi' });
            if (nextLives <= 0) {
              endRoundAfterDelay(120);
              return 0;
            }
            return Math.max(resetTimedValue * 6, 30);
          }
          if (p <= 10) SFX.tick();
          return p - 1;
        });
      } else if (mode?.id === 'bomb') {
        setBombT((p) => {
          if (p <= 1) {
            triggerIncorrect('Süre doldu', 'Süre bittiği için yalnızca 1 can eksildi.', gqsRef.current[qiRef.current], { showFeedback: false, noRetry: true, noSkip: true, forceLoseLife: true, delay: 620 });
            return 0;
          }
          if (p <= 4) SFX.tick();
          return p - 1;
        });
      } else if (!['wheel', 'dice', 'openbox'].includes(mode?.id)) {
        setTm((p) => {
          if (p <= 1) {
            triggerIncorrect('Süre doldu', 'Süre bittiği için yalnızca 1 can eksildi.', gqsRef.current[qiRef.current], { showFeedback: false, noRetry: true, noSkip: true, forceLoseLife: true, delay: 620 });
            return 0;
          }
          if (p <= 5) SFX.tick();
          return p - 1;
        });
      }
    }, 1000);
    return () => clearInterval(ti);
  }, [screen, mode, ans, settings.duration, difficulty, gameStarted]);
  useEffect(() => { if (screen !== 'game' || mode?.id !== 'whack' || ans !== null || !gameStarted) return undefined; const mi = setInterval(() => setMoles((prev) => prev.map((m) => ({ ...m, vis: Math.random() > 0.6 }))), settings.difficulty === 'hard' ? 650 : settings.difficulty === 'easy' ? 950 : 800); return () => clearInterval(mi); }, [screen, mode, ans, settings.difficulty, gameStarted]);
  useEffect(() => () => { clearAdvanceTimeout(); clearFeedbackTimeout(); clearWheelTimeouts(); }, []);

  const appendAnswerLog = (correct, question) => setAnswerLogs((prev) => [...prev, { correct, topic: extractTopicLabel(question), q: question?.q || '' }]);
  const trigOk = () => { SFX.correct(); spawnConfetti(35); setCor((p) => p + 1); setGlow(true); setTimeout(() => setGlow(false), 600); setCb((p) => { const next = p + 1; setMcb((prev) => (next > prev ? next : prev)); if (next >= 3) SFX.combo(); return next; }); };
  const trigNo = () => { SFX.wrong(); shakeEl('app'); setCb(0); setWrong((p) => p + 1); };
  const triggerCorrect = (question, basePoints, message = 'Harika! Doğru cevap.') => {
    clearAdvanceTimeout();
    clearFeedbackTimeout();
    setAns(question.a);
    trigOk();
    appendAnswerLog(true, question);
    const earned = Math.round(basePoints * difficulty.scoreMul) + (cb >= 2 ? 40 : 0);
    setSc((p) => p + earned);
    setScormProgressData({ score: sc + earned, correct: cor + 1, wrong, total: gqs.length, mode: mode?.id, question: qi + 1 });
    scheduleFeedback({ type: 'correct', title: 'Başarılı Tur', message, hint: '', explanation: settings.userRole === 'teacher' ? question.explanation : '', primaryLabel: 'Sıradaki Soru', advanceOnClose: true }, getEffectDelay('correct'));
  };
  function triggerIncorrect(title, message, question = gqsRef.current[qiRef.current], options = {}) {
    clearAdvanceTimeout();
    clearFeedbackTimeout();
    if (ans === null) setAns(-1);
    trigNo();
    appendAnswerLog(false, question);
    const lostLife = options.forceLoseLife === false ? 0 : 1;
    const nextLives = options.endGame ? 0 : (lostLife ? applyLifePenalty(lostLife) : lvRef.current);
    if (options.endGame) {
      lvRef.current = 0;
      setLv(0);
    }
    const canRetry = nextLives > 0 && jokers.retry > 0 && !questionRetryUsed && !options.noRetry;
    const canSkip = nextLives > 0 && supportsSkipJoker(modeRef.current?.id) && jokers.skip > 0 && !options.noSkip;
    const feedbackPayload = {
      type: 'wrong',
      title,
      message,
      hint: settings.userRole === 'teacher' ? question?.hint : '',
      explanation: settings.userRole === 'teacher' ? question?.explanation : '',
      canRetry,
      canSkip,
      primaryLabel: nextLives <= 0 || options.endGame ? 'Skor ekranına geç' : 'Sıradaki Soru',
      advanceOnClose: true,
      endGameOnClose: nextLives <= 0 || !!options.endGame,
    };
    setQuestionRetryUsed(true);
    setScormProgressData({ score: sc, correct: cor, wrong: wrong + 1, total: gqs.length, mode: mode?.id, question: qi + 1 });
    const effectDelay = options.delay || getEffectDelay('wrong');
    if (options.showFeedback === false) {
      setFeedback(null);
      if (feedbackPayload.endGameOnClose) endRoundAfterDelay(effectDelay + 80);
      else advanceTimeoutRef.current = setTimeout(() => { nxtQ(); }, effectDelay + 80);
      return;
    }
    scheduleFeedback(feedbackPayload, effectDelay);
  }
  function nxtQ() { clearAdvanceTimeout(); clearFeedbackTimeout(); clearWheelTimeouts(); setAns(null); setWheelReveal(false); setFeedback(null); setQuestionRetryUsed(false); if (qi + 1 >= gqs.length) { endG(); return; } const nextIndex = qi + 1; const nextQuestion = gqs[nextIndex]; setQi(nextIndex);
    qiRef.current = nextIndex; setBonusState(null); if (mode?.id === 'balloon') setupBlns(nextQuestion); if (mode?.id === 'whack') setupMoles(nextQuestion); if (mode?.id === 'wheel') { setSwq(false); setWp(0); setWsi(null); } if (mode?.id === 'openbox') { setSelectedBoxIndex(null); setBoxRevealOpen(false); setWp(0); setBp(false); setSwq(false); } setupTimedState(mode?.id); }
  function persistScore() { if (roundSavedRef.current) return; roundSavedRef.current = true; const playerId = currentPlayer?.id || 'solo-player'; const playerName = currentPlayer?.name || 'Tek Oyuncu'; const gameId = mode?.id || 'unknown'; const roundAnalytics = computeAnalytics(answerLogs, gqs); const roundBadge = getBadge(sc, roundAnalytics.accuracy); setCompetition((prev) => { const previous = prev.leaderboard || []; const found = previous.find((entry) => entry.id === playerId); const nextEntry = found ? { ...found, name: playerName, games: { ...(found.games || {}), [gameId]: sc } } : { id: playerId, name: playerName, games: { [gameId]: sc } }; nextEntry.total = Object.values(nextEntry.games || {}).reduce((sum, value) => sum + (Number(value) || 0), 0); nextEntry.badge = roundBadge.name; const nextLeaderboard = found ? previous.map((entry) => (entry.id === playerId ? nextEntry : entry)) : [...previous, nextEntry]; return { ...prev, leaderboard: nextLeaderboard }; }); if (membership.currentUser?.role === 'student') { const report = { id: uid('report'), studentId: membership.currentUser.id, studentName: membership.currentUser.name, mode: gameId, modeName: mode?.name || gameId, topic, assignmentId: activeAssignment?.id || '', score: sc, correct: cor, wrong, accuracy: roundAnalytics.accuracy, strongestTopic: roundAnalytics.strongestTopic, weakestTopic: roundAnalytics.weakestTopic, badge: roundBadge.name, createdAt: new Date().toISOString() }; setMembership((prev) => { let nextProgress = prev.assignmentProgress || []; if (activeAssignment?.id) { const existing = nextProgress.find((item) => item.assignmentId === activeAssignment.id && item.studentId === prev.currentUser?.id); const completion = { id: existing?.id || uid('assignmentprogress'), assignmentId: activeAssignment.id, studentId: prev.currentUser?.id, classId: activeAssignment.classId, status: 'completed', startedAt: existing?.startedAt || new Date().toISOString(), completedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), score: sc }; nextProgress = existing ? nextProgress.map((item) => item.id === existing.id ? completion : item) : [...nextProgress, completion]; } return { ...prev, reports: [...(prev.reports || []), report], assignmentProgress: nextProgress }; }); } }
  function endG() { clearAdvanceTimeout(); clearFeedbackTimeout(); clearWheelTimeouts(); const elapsed = stRef.current ? Math.floor((Date.now() - stRef.current) / 1000) : 0; setTt(elapsed); persistScore(); SFX.win(); spawnConfetti(60); setScreen('res'); setScormStatus('completed'); setScormScore(sc); setScormSessionTime(elapsed); setScormLocation('results'); commitScorm(); }
  function startG(modeConfig, options = {}) { clearAdvanceTimeout(); clearFeedbackTimeout(); clearWheelTimeouts(); roundSavedRef.current = false; setGameRunId((prev) => prev + 1); SFX.click(); const sourceQuestions = options.questions || []; const shuffled = shuffleArray(sourceQuestions.map(normalizeQuestion)); const playerIndex = typeof options.playerIndexOverride === 'number' ? options.playerIndexOverride : competition.currentPlayerIndex; if (typeof options.playerIndexOverride === 'number') setCompetition((prev) => ({ ...prev, currentPlayerIndex: playerIndex })); setMode(modeConfig); modeRef.current = modeConfig; setGqs(shuffled); gqsRef.current = shuffled; setQi(0); qiRef.current = 0; setSc(0); setLv(difficulty.lives); lvRef.current = difficulty.lives; setCb(0); setMcb(0); setCor(0); setWrong(0); setAns(null); setSt(0); stRef.current = 0; setGameStarted(false); setScreen('game'); setFeedback(null); setAnswerLogs([]); setQuestionRetryUsed(false); setJokers({ skip: supportsSkipJoker(modeConfig.id) ? 1 : 0, retry: 1, reveal: 1, fifty: true }); setScormStatus('incomplete'); setScormScore(0); setScormLocation(`game:${modeConfig.id}:ready`); commitScorm(); if (!shuffled.length) return; if (modeConfig.id === 'balloon') setupBlns(shuffled[0]); else if (['wheel', 'dice', 'openbox'].includes(modeConfig.id)) { setSwq(false); setSpn(false); setDr(false); setBp(false); setWp(0); setWsi(null); setWheelReveal(false); setSelectedBoxIndex(null); setBoxRevealOpen(false); setupTimedState(modeConfig.id); } else if (modeConfig.id === 'memory') { setupMem(shuffled); } else if (modeConfig.id === 'whack') { setupMoles(shuffled[0]); } setupTimedState(modeConfig.id); }
  function startCurrentGame() { if (!mode || !gqs.length || gameStarted) return; const now = Date.now(); setGameStarted(true); setSt(now); stRef.current = now; setScormLocation(`game:${mode.id}:question:${qi + 1}`); commitScorm(); SFX.start?.(); SFX.click(); }
  const hAns = (i) => { if (!gameStarted || ans !== null) return; const q = gqs[qi]; setAns(i); if (i === q.a) { triggerCorrect(q, 100 + Math.max(0, clamp(tm, 0, 9999) * 5), 'Doğru cevap ve güçlü bir puan kazanıldı.'); return; } triggerIncorrect('Yanlış cevap', 'Doğru yanıta biraz daha yaklaşmak için ipucunu ve açıklamayı inceleyebilirsin.', q); };
  const hBalloonPick = (balloon) => {
    if (!gameStarted || ans !== null) return;
    setBlns((prev) => prev.map((b) => (b.uid === balloon.uid ? { ...b, popped: true } : b)));

    if (balloon.kind !== 'answer') {
      if (balloon.kind === 'time') {
        SFX.reveal();
        setTm((p) => (p === 9999 ? 9999 : Math.min((p || 0) + 4, 60)));
        setBonusState({ label: '⏱️ +4 sn bonus' });
        spawnEmoji('⏱️', 50, 42);
        return;
      }

      if (balloon.kind === 'gold') {
        const goldScore = Math.round(80 * difficulty.scoreMul);
        setSc((p) => p + goldScore);
        setBonusState({ label: `💰 +${goldScore} puan` });
        spawnEmoji('💰', 50, 42);
        return;
      }

      if (balloon.kind === 'heart') {
        setLv((p) => { const next = Math.min(p + 1, 3); lvRef.current = next; return next; });
        setBonusState({ label: '❤️ +1 can bonus' });
        spawnEmoji('❤️', 50, 42);
        return;
      }

      if (balloon.kind === 'rainbow') {
        const rainbowRewards = ['time', 'gold', 'heart'];
        const reward = rainbowRewards[Math.floor(Math.random() * rainbowRewards.length)];
        if (reward === 'time') {
          setTm((p) => (p === 9999 ? 9999 : Math.min((p || 0) + 6, 60)));
          setBonusState({ label: '🌈 +6 sn sürpriz' });
          spawnEmoji('🌈', 50, 42);
        } else if (reward === 'gold') {
          const rainbowScore = Math.round(120 * difficulty.scoreMul);
          setSc((p) => p + rainbowScore);
          setBonusState({ label: `🌈 +${rainbowScore} puan` });
          spawnEmoji('🌈', 50, 42);
        } else {
          setLv((p) => { const next = Math.min(p + 1, 3); lvRef.current = next; return next; });
          setBonusState({ label: '🌈 +1 can sürprizi' });
          spawnEmoji('🌈', 50, 42);
        }
        spawnConfetti(18);
        return;
      }

      if (balloon.kind === 'bomb') {
        SFX.bomb();
        setTm((p) => (p === 9999 ? 9999 : Math.max((p || 0) - 5, 3)));
        setCb(0);
        setBonusState({ label: '💥 -5 sn tehlike' });
        spawnEmoji('💥', 50, 42);
        return;
      }

      return;
    }

    setAns(balloon.id);
    if (balloon.ok) {
      triggerCorrect(gqs[qi], 120 + Math.max(0, clamp(tm, 0, 9999) * 6), 'Balon başarıyla patlatıldı.');
      return;
    }

    triggerIncorrect('Yanlış balon', 'Doğru balonu seçmeden önce seçenekleri dikkatle kontrol et.', gqs[qi]);
  };
  const hWhlSpin = () => { if (!gameStarted || spn || swq || wheelReveal) return; clearWheelTimeouts(); SFX.click(); const segments = [50, 100, 150, 200, 250, 300, 120, 220]; const ri = Math.floor(Math.random() * segments.length); const selected = segments[ri]; setSpn(true); setSwq(false); setWheelReveal(false); setWsi(ri); setWp(selected); setWa((prev) => prev + 360 * 4 + ((360 - (ri * 45 + 22.5)) % 360)); wheelSpinTimeoutRef.current = setTimeout(() => { setSpn(false); setWheelReveal(true); SFX.reveal?.(); wheelRevealTimeoutRef.current = setTimeout(() => { setWheelReveal(false); setSwq(true); setupTimedState('wheel'); }, 1200); }, 3200); };
  const hDiceRoll = () => { if (!gameStarted || dr || swq) return; SFX.dice(); setDr(true); let t = 0; const dint = setInterval(() => { setDv(Math.floor(Math.random() * 6) + 1); if (++t > 14) clearInterval(dint); }, 100); setTimeout(() => { const ndv = Math.floor(Math.random() * 6) + 1; setDv(ndv); setWp([50, 100, 150, 200, 250, 300][ndv - 1]); setDr(false); setSwq(true); setupTimedState('dice'); }, 1500); };
  const hBoxPick = (boxIndex) => { if (!gameStarted || bp || swq || boxRevealOpen) return; setBp(true); setSelectedBoxIndex(boxIndex); const reward = [50, 100, 150, 200, 250, 300][Math.floor(Math.random() * 6)]; setWp(reward); setBoxRevealOpen(true); SFX.reveal?.(); setTimeout(() => { setBoxRevealOpen(false); setSwq(true); setupTimedState('openbox'); }, 1200); };
  const hWhlAns = (i) => { if (!gameStarted || ans !== null) return; setAns(i); const q = gqs[qi]; if (i === q.a) { triggerCorrect(q, wp || 120, 'Bonus tur başarıyla tamamlandı.'); return; } triggerIncorrect('Bonus soru kaçtı', 'Şans puanı kazanıldı ama cevap hatalı olduğu için tur kapanıyor.', q, { noRetry: false }); };
  const hMem = (i) => { if (!gameStarted) return; const c = mcs[i]; if (!c || c.m || mfl.includes(i) || mfl.length >= 2) return; SFX.flip(); setMfl((prev) => { const next = [...prev, i]; if (prev.length === 1) { setMmv((p) => p + 1); const a = mcs[prev[0]]; const b = mcs[i]; if (a.p === b.p && a.t !== b.t) { trigOk(); setMma((p) => [...p, a.p]); setMcs((cards) => { const copy = [...cards]; copy[prev[0]].m = true; copy[i].m = true; return copy; }); setSc((p) => p + Math.round(150 * difficulty.scoreMul)); appendAnswerLog(true, gqs[Math.min(a.p, gqs.length - 1)] || gqs[0]); setTimeout(() => setMfl([]), 100); if (mma.length + 1 >= gqs.length) advanceTimeoutRef.current = setTimeout(endG, 800); } else { trigNo(); appendAnswerLog(false, gqs[Math.min(a.p, gqs.length - 1)] || gqs[0]); setTimeout(() => { setMfl([]); const nextLives = Math.max((lvRef.current || 0) - 1, 0); lvRef.current = nextLives; setLv(nextLives); if (nextLives <= 0) endG(); }, 800); } } return next; }); };
  const useJk = (type) => { if (!gameStarted) return; if (type === 'fifty' && jokers.fifty) { setJokers((p) => ({ ...p, fifty: false })); SFX.reveal(); setGqs((prev) => { const next = [...prev]; next[qi].hid = [0, 1, 2, 3].filter((x) => x !== prev[qi].a).sort(() => Math.random() - 0.5).slice(0, 2); return next; }); } if (type === 'skip' && supportsSkipJoker(modeRef.current?.id) && jokers.skip > 0) { setJokers((p) => ({ ...p, skip: p.skip - 1 })); SFX.whoosh(); nxtQ(); } };
  const nextCompetitionPlayer = () => { if (!hasNextPlayer || !mode) return; let nextIndex = competition.currentPlayerIndex + 1; if (settings.turnMode === 'random' && competition.players?.length) nextIndex = Math.floor(Math.random() * competition.players.length); setCompetition((prev) => ({ ...prev, currentPlayerIndex: nextIndex })); startG(mode, { playerIndexOverride: nextIndex, questions: gqsRef.current }); };
  const selectCompetitionPlayer = (playerIndex) => { if (!mode || !competition.players?.length || playerIndex < 0 || playerIndex >= competition.players.length) return; setCompetition((prev) => ({ ...prev, currentPlayerIndex: playerIndex, enabled: true })); startG(mode, { playerIndexOverride: playerIndex, questions: gqsRef.current }); };
  const leaveGame = (targetScreen = 'games') => { if (settings.presentationLock) return; resetRuntimeState(); setScreen(targetScreen); setScormLocation(targetScreen); commitScorm(); };
  const goBackToModes = () => leaveGame('games');
  const togglePresentationLock = () => updateSettings({ presentationLock: !settings.presentationLock });
  const handleFeedbackClose = () => {
    const activeFeedback = feedback;
    clearAdvanceTimeout();
    clearFeedbackTimeout();
    setFeedback(null);
    if (!activeFeedback) return;
    if (activeFeedback.type === 'wrong' && activeFeedback.advanceOnClose) {
      if (activeFeedback.endGameOnClose || lvRef.current <= 0) {
        endG();
        return;
      }
      nxtQ();
      return;
    }
    if (activeFeedback.type === 'correct' && activeFeedback.advanceOnClose) nxtQ();
  };
  const handleRetry = () => { if (lvRef.current <= 0) return; setJokers((p) => ({ ...p, retry: Math.max(0, p.retry - 1) })); setAns(null); setFeedback(null); };
  const handleSkip = () => { if (!supportsSkipJoker(modeRef.current?.id)) return; setJokers((p) => ({ ...p, skip: Math.max(0, p.skip - 1) })); setFeedback(null); nxtQ(); };
  const soundMuted = settings.soundProfile === 'off' || (!settings.effectsEnabled && !settings.musicEnabled);
  const nextQuickPlayerName = settings.turnMode === 'random' ? 'Rastgele' : (competition.players?.[competition.currentPlayerIndex + 1]?.name || 'Oyuncu');
  const quickActions = [
    { label: `👤 ${nextQuickPlayerName}`, onClick: nextCompetitionPlayer, disabled: !competition.enabled || !hasNextPlayer },
    { label: soundMuted ? '🔊 Sesi Aç' : '🔇 Sessize Al', onClick: () => updateSettings(soundMuted ? { soundProfile: 'balanced', effectsEnabled: true, musicEnabled: true } : { effectsEnabled: false, musicEnabled: false }) },
    { label: '🔄 Sıfırla', onClick: () => startG(mode, { questions: gqsRef.current }), disabled: !mode, primary: true },
  ];
  const renderGameProps = { mode, gameRunId, sharedProps: mode ? { mode, q: gqs[qi], qi, gqs, ans, hAns } : null, extraPropsByMode: { quiz: { tm, setTm, cb }, balloon: { blns, cb, hBalloonPick }, wheel: { hWhlAns, swq, wa, spn, wp, wsi, wheelReveal, hWhlSpin }, memory: { mcs, mfl, mma, mmv, hMem }, millionaire: { jk: { fifty: jokers.fifty, skip: supportsSkipJoker(mode?.id) && jokers.skip > 0 }, useJk, tm }, whack: { moles }, dice: { hWhlAns, swq, wp, dv, dr, hDiceRoll }, openbox: { hWhlAns, swq, wp, bp, selectedBoxIndex, boxRevealOpen, hBoxPick }, bomb: { bombT } } };

  return { mode, gqs, qi, sc, lv, cb, mcb, cor, wrong, st, tt, tm, glow, feedback, bonusState, currentPlayer, hasNextPlayer, analytics, badge, mmt, bombT, quickActions, renderGameProps, gameStarted, startCurrentGame, startG, nextCompetitionPlayer, selectCompetitionPlayer, goBackToModes, leaveGame, togglePresentationLock, handleFeedbackClose, handleRetry, handleSkip, answerLogs };
}
