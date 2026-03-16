export function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
export function shuffleArray(items) { return [...items].sort(() => Math.random() - 0.5); }
export function normalizeQuestion(question = {}) {
  return {
    q: question.q || '',
    o: Array.isArray(question.o) ? [...question.o, '', '', '', ''].slice(0, 4) : ['', '', '', ''],
    a: Number.isInteger(question.a) ? question.a : 0,
    hint: question.hint || '',
    explanation: question.explanation || '',
    media: { image: question.media?.image || question.image || '', audio: question.media?.audio || question.audio || '', video: question.media?.video || question.video || '' },
    type: question.type || 'multiple-choice',
    topicTag: question.topicTag || '',
    games: Array.isArray(question.games) && question.games.length ? question.games : [],
  };
}
export function getDifficultyProfile(difficulty = 'medium') {
  if (difficulty === 'easy') return { timeMul: 1.35, scoreMul: 0.95, lives: 3, label: 'Kolay' };
  if (difficulty === 'hard') return { timeMul: 0.8, scoreMul: 1.2, lives: 3, label: 'Zor' };
  return { timeMul: 1, scoreMul: 1, lives: 3, label: 'Orta' };
}
export function getBadge(score, accuracy) {
  if (score >= 1800 || accuracy >= 90) return { name: 'Altın Usta', icon: '🥇' };
  if (score >= 1200 || accuracy >= 75) return { name: 'Gümüş Seri', icon: '🥈' };
  if (score >= 700 || accuracy >= 60) return { name: 'Bronz Başarı', icon: '🥉' };
  return { name: 'Katılım Rozeti', icon: '🎖️' };
}
export function extractTopicLabel(question) {
  if (question.topicTag?.trim()) return question.topicTag.trim();
  const text = `${question.q} ${question.explanation || ''}`.toLowerCase();
  const tokens = text.replace(/[^a-zA-ZğüşöçıİĞÜŞÖÇ0-9\s]/g, ' ').split(/\s+/).filter((word) => word.length > 4);
  return tokens[0] || 'genel';
}
export function computeAnalytics(logs = [], allQuestions = []) {
  const map = new Map();
  allQuestions.forEach((question) => {
    const key = extractTopicLabel(question);
    if (!map.has(key)) map.set(key, { correct: 0, wrong: 0 });
  });
  logs.forEach((entry) => {
    const key = entry.topic || 'genel';
    if (!map.has(key)) map.set(key, { correct: 0, wrong: 0 });
    const target = map.get(key);
    if (entry.correct) target.correct += 1; else target.wrong += 1;
  });
  const arr = [...map.entries()].map(([key, value]) => ({ key, ...value, score: value.correct - value.wrong }));
  arr.sort((a, b) => b.score - a.score);
  const total = logs.length;
  const correct = logs.filter((item) => item.correct).length;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  return {
    strongestTopic: arr[0]?.key || 'genel',
    weakestTopic: arr[arr.length - 1]?.key || 'genel',
    accuracy,
  };
}
