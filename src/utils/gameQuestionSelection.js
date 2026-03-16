import { getGameMeta } from '../constants/gameRegistry';
import { shuffleArray } from './gameAnalytics';

export function buildQuestionSignature(question = {}) {
  const answerText = Array.isArray(question.o) ? question.o[question.a] || '' : '';
  return JSON.stringify([
    question.q || '',
    answerText,
    question.hint || '',
    question.explanation || '',
    question.topicTag || '',
  ]);
}

export function getGameQuestionConfig(gameId) {
  const gameMeta = getGameMeta(gameId) || {};
  return {
    mode: 'all',
    limit: null,
    recommendedCount: 10,
    buttonLabel: 'Soru setini seç',
    ...(gameMeta.questionSelection || {}),
  };
}

export function getGameQuestionProfile(gameId, settings = {}) {
  const config = getGameQuestionConfig(gameId);
  const profile = (settings.gameQuestionProfiles || {})[gameId] || {};

  if (gameId === 'memory' && !(settings.gameQuestionProfiles || {}).memory) {
    return {
      mode: settings.memoryCardSelectionMode === 'manual' ? 'manual' : config.mode,
      questionKeys: Array.isArray(settings.memoryCardQuestionKeys) ? settings.memoryCardQuestionKeys : [],
      randomCount: config.recommendedCount,
    };
  }

  return {
    mode: ['all', 'random', 'manual'].includes(profile.mode) ? profile.mode : config.mode,
    questionKeys: Array.isArray(profile.questionKeys) ? profile.questionKeys : [],
    randomCount: Number.isFinite(Number(profile.randomCount)) && Number(profile.randomCount) > 0 ? Number(profile.randomCount) : config.recommendedCount,
  };
}

export function buildUpdatedQuestionSettings(gameId, settings = {}, partial = {}) {
  const current = getGameQuestionProfile(gameId, settings);
  const nextProfile = { ...current, ...partial };
  const nextSettings = {
    gameQuestionProfiles: {
      ...(settings.gameQuestionProfiles || {}),
      [gameId]: nextProfile,
    },
  };

  if (gameId === 'memory') {
    if (partial.mode) nextSettings.memoryCardSelectionMode = partial.mode === 'manual' ? 'manual' : 'random';
    if (Array.isArray(partial.questionKeys)) nextSettings.memoryCardQuestionKeys = partial.questionKeys;
  }

  return nextSettings;
}

export function resolveGameQuestions(gameId, allQuestions = [], settings = {}) {
  const questions = Array.isArray(allQuestions) ? allQuestions : [];
  if (!questions.length) return [];

  const config = getGameQuestionConfig(gameId);
  const profile = getGameQuestionProfile(gameId, settings);
  const selectedKeys = new Set(profile.questionKeys || []);
  const limit = Number.isFinite(config.limit) && config.limit > 0 ? config.limit : null;
  const randomCount = Math.max(1, Number(profile.randomCount || config.recommendedCount || questions.length));

  if (profile.mode === 'manual') {
    const manualQuestions = questions.filter((question) => selectedKeys.has(buildQuestionSignature(question)));
    if (manualQuestions.length) return limit ? manualQuestions.slice(0, limit) : manualQuestions;
  }

  if (profile.mode === 'random') {
    const count = limit ? Math.min(limit, questions.length) : Math.min(randomCount, questions.length);
    return shuffleArray(questions).slice(0, count);
  }

  if (limit) {
    if (questions.length <= limit) return questions;
    return shuffleArray(questions).slice(0, limit);
  }

  return questions;
}

export function getGameQuestionSummary(gameId, allQuestions = [], settings = {}) {
  const questions = Array.isArray(allQuestions) ? allQuestions : [];
  const config = getGameQuestionConfig(gameId);
  const profile = getGameQuestionProfile(gameId, settings);
  const limit = Number.isFinite(config.limit) && config.limit > 0 ? config.limit : null;
  const randomCount = Math.max(1, Number(profile.randomCount || config.recommendedCount || questions.length || 1));
  const validKeySet = new Set(questions.map((question) => buildQuestionSignature(question)));
  const selectedCount = (profile.questionKeys || []).filter((key) => validKeySet.has(key)).slice(0, limit || undefined).length;
  const effectiveCount = resolveGameQuestions(gameId, questions, settings).length;

  let modeLabel = 'Tüm sorular';
  let detailLabel = questions.length ? `${questions.length} sorunun tamamı kullanılacak` : 'Henüz soru yok';

  if (profile.mode === 'manual' && selectedCount > 0) {
    modeLabel = config.buttonLabel;
    detailLabel = `${selectedCount} seçili soru kullanılacak`;
  } else if (profile.mode === 'random') {
    modeLabel = `Rastgele ${effectiveCount} soru`;
    detailLabel = `${questions.length} hazır soru içinden rastgele ${effectiveCount} soru kullanılacak`;
  } else if (limit && questions.length > limit) {
    modeLabel = `Rastgele ${limit} soru`;
    detailLabel = `${questions.length} hazır soru içinden en fazla ${limit} soru kullanılacak`;
  }

  if (limit && questions.length <= limit) {
    detailLabel = `${questions.length} sorunun tamamı kullanılacak`;
  }

  return {
    total: questions.length,
    limit,
    randomCount,
    effectiveCount,
    selectedCount,
    modeLabel,
    detailLabel,
    buttonLabel: config.buttonLabel,
  };
}
