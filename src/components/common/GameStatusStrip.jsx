function StatPill({ label, value, tone = 'default', wide = false }) {
  const palette = {
    default: { bg: 'rgba(255,255,255,.06)', border: 'rgba(255,255,255,.10)', color: '#fff' },
    accent: { bg: 'rgba(78,205,196,.14)', border: 'rgba(78,205,196,.24)', color: '#D6FFFA' },
    warn: { bg: 'rgba(255,230,109,.14)', border: 'rgba(255,230,109,.24)', color: '#FFF6BE' },
    danger: { bg: 'rgba(255,107,107,.14)', border: 'rgba(255,107,107,.24)', color: '#FFD1D1' },
  }[tone] || { bg: 'rgba(255,255,255,.06)', border: 'rgba(255,255,255,.10)', color: '#fff' };

  return (
    <div style={{ padding: '10px 12px', borderRadius: 16, background: palette.bg, border: `1px solid ${palette.border}`, minWidth: wide ? 160 : 110 }}>
      <div style={{ fontSize: 11, fontWeight: 900, color: '#9FB3CD', textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</div>
      <div style={{ marginTop: 4, fontSize: 18, fontWeight: 900, color: palette.color, whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  );
}

function TimerTrack({ value = 0, max = 15, danger = false }) {
  const safeMax = Math.max(max || 1, 1);
  const pct = safeMax >= 9000 ? 100 : Math.max(0, Math.min(100, (value / safeMax) * 100));
  return (
    <div style={{ display: 'grid', gap: 6, minWidth: 190 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 12, fontWeight: 900, color: danger ? '#FFB3B3' : '#D7F7F3' }}>
        <span>⏱ Kalan süre</span>
        <span>{safeMax >= 9000 ? '∞' : `${value}s`}</span>
      </div>
      <div style={{ height: 10, borderRadius: 999, background: 'rgba(255,255,255,.08)', overflow: 'hidden', border: '1px solid rgba(255,255,255,.08)' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: danger ? 'linear-gradient(90deg,#FF6B6B,#FF8E53)' : 'linear-gradient(90deg,#4ECDC4,#6C5CE7)', transition: 'width .35s ease' }} />
      </div>
    </div>
  );
}

export default function GameStatusStrip({
  mode,
  tm,
  mmt,
  bombT,
  duration,
  lv,
  sc,
  cb,
  cor,
  qi,
  totalQuestions,
  currentPlayerName,
  competitionMode,
}) {
  const timerValue = mode?.id === 'memory' ? mmt : mode?.id === 'bomb' ? bombT : tm;
  const timerMax = mode?.id === 'memory' ? Math.max(duration * 6, 30) : duration;
  const low = timerValue <= Math.max(5, Math.floor(timerMax * 0.2));

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 3, display: 'grid', gap: 10, padding: '10px 12px', borderRadius: 18, background: 'linear-gradient(180deg, rgba(9,15,34,.94), rgba(9,15,34,.82))', border: '1px solid rgba(255,255,255,.08)', boxShadow: '0 10px 24px rgba(0,0,0,.18)', backdropFilter: 'blur(14px)', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <StatPill label='Soru' value={`${Math.min((qi || 0) + 1, totalQuestions || 1)}/${totalQuestions || 1}`} tone='accent' />
          {competitionMode ? <StatPill label='Oyuncu' value={currentPlayerName || 'Tek oyuncu'} wide /> : null}
          <StatPill label='Puan' value={`⭐ ${sc || 0}`} />
          <StatPill label='Doğru' value={`✅ ${cor || 0}`} />
          <StatPill label='Can' value={`${'❤️'.repeat(Math.max(0, lv || 0))}${'🖤'.repeat(Math.max(0, 3 - (lv || 0)))}`} tone={(lv || 0) <= 1 ? 'danger' : 'warn'} wide />
          {cb >= 2 ? <StatPill label='Seri' value={`🔥 ${cb}x`} tone='warn' /> : null}
        </div>
        <TimerTrack value={timerValue} max={timerMax} danger={low} />
      </div>
    </div>
  );
}
