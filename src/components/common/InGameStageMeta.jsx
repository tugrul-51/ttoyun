export default function InGameStageMeta({
  currentPlayerName = 'Tek oyuncu',
  score = 0,
  correct = 0,
  lives = 3,
  timeLeft = 0,
  questionIndex = 0,
  totalQuestions = 0,
  competitionMode = false,
  showTime = true,
  isFullscreen = false,
  onToggleFullscreen,
}) {
  const safeLives = Math.max(0, Number(lives) || 0);
  const safeQuestion = Math.min((questionIndex || 0) + 1, Math.max(totalQuestions || 1, 1));
  const numericTime = Math.max(0, Number(timeLeft) || 0);
  const safeTime = timeLeft === 9999 ? 'Sınırsız' : `${numericTime} sn`;
  const lowTime = timeLeft !== 9999 && numericTime <= 5;

  const items = [
    {
      label: competitionMode ? 'Oyuncu' : 'Tur',
      value: currentPlayerName || 'Tek oyuncu',
      tone: 'default',
      wide: true,
      action: typeof onToggleFullscreen === 'function'
        ? { label: isFullscreen ? '🗗 Çık' : '⛶ Tam ekran', active: isFullscreen }
        : null,
    },
    { label: 'Soru', value: `${safeQuestion}/${Math.max(totalQuestions || 1, 1)}`, tone: 'default' },
    { label: 'Puan', value: `${score}`, tone: 'accent' },
    { label: 'Doğru', value: `${correct}`, tone: 'default' },
  ];

  if (showTime) items.push({ label: 'Süre', value: safeTime, tone: lowTime ? 'danger' : 'accent' });
  items.push({ label: 'Can', value: `${'❤️'.repeat(safeLives)}${'🖤'.repeat(Math.max(0, 3 - safeLives))}`, tone: safeLives <= 1 ? 'danger' : 'warn' });

  const tones = {
    default: { bg: 'rgba(255,255,255,.07)', border: 'rgba(255,255,255,.10)', value: '#FFFFFF' },
    accent: { bg: 'rgba(78,205,196,.16)', border: 'rgba(78,205,196,.22)', value: '#D8FFFB' },
    warn: { bg: 'rgba(255,230,109,.16)', border: 'rgba(255,230,109,.22)', value: '#FFF5B7' },
    danger: { bg: 'rgba(255,107,107,.16)', border: 'rgba(255,107,107,.24)', value: '#FFD8D8' },
  };

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 8,
      padding: '8px 10px',
      borderRadius: 18,
      background: 'linear-gradient(180deg, rgba(7,12,28,.68), rgba(7,12,28,.48))',
      border: '1px solid rgba(255,255,255,.08)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.04)',
      backdropFilter: 'blur(14px)',
      alignItems: 'center',
    }}>
      {items.map((item) => {
        const tone = tones[item.tone] || tones.default;
        return (
          <div
            key={item.label}
            style={{
              padding: item.wide ? '8px 12px' : '8px 10px',
              borderRadius: 14,
              background: tone.bg,
              border: `1px solid ${tone.border}`,
              minWidth: item.wide ? 140 : 92,
              maxWidth: '100%',
              display: 'grid',
              gap: 5,
              alignContent: 'center',
              flex: item.wide ? '1 1 220px' : '0 1 auto',
            }}
          >
            {item.action ? (
              <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: '#A9BEDC', fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' }}>{item.label}</div>
                  <div style={{ fontSize: 15, color: tone.value, fontWeight: 900, lineHeight: 1.15, wordBreak: 'break-word', marginTop: 3 }}>{item.value}</div>
                </div>
                <button
                  onClick={onToggleFullscreen}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 11,
                    border: `1px solid ${item.action.active ? 'rgba(255,107,107,.24)' : 'rgba(255,255,255,.12)'}`,
                    background: item.action.active ? 'rgba(255,107,107,.14)' : 'rgba(255,255,255,.06)',
                    color: '#fff',
                    fontWeight: 900,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.action.label}
                </button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 10, color: '#A9BEDC', fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' }}>{item.label}</div>
                <div style={{ fontSize: item.wide ? 15 : 14, color: tone.value, fontWeight: 900, lineHeight: 1.15, wordBreak: 'break-word' }}>{item.value}</div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
