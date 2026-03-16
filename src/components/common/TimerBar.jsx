function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export default function TimerBar({ value = 0, max = 15, icon = '⏱', danger = false, label = 'Süre', compact = false }) {
  const safeMax = Math.max(max || 1, 1);
  const pct = clamp((value / safeMax) * 100, 0, 100);

  return (
    <div style={{ minWidth: compact ? '150px' : '220px', flex: compact ? '1 1 150px' : '1 1 220px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: compact ? 4 : 6, fontSize: compact ? 10 : 13, fontWeight: 800, color: danger ? '#FF8A8A' : '#D7F7F3' }}>
        <span>{icon} {label}</span>
        <span>{safeMax >= 9000 ? '∞' : `${value}s`}</span>
      </div>
      <div style={{ height: compact ? 8 : 12, borderRadius: 999, background: 'rgba(255,255,255,.08)', overflow: 'hidden', border: '1px solid rgba(255,255,255,.08)' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: danger ? 'linear-gradient(90deg,#FF6B6B,#FF8E53)' : 'linear-gradient(90deg,#4ECDC4,#6C5CE7)', transition: 'width .35s ease' }} />
      </div>
    </div>
  );
}
