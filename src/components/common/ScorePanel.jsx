export default function ScorePanel({ score = 0, combo = 0, lives = 3, glow = false, correct = 0, playerName = '', compact = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 6 : 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      {playerName && (
        <div style={{ padding: compact ? '7px 9px' : '10px 14px', borderRadius: 14, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', fontWeight: 800 }}>
          👤 {playerName}
        </div>
      )}
      <div style={{ display: 'flex', gap: 4 }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ fontSize: compact ? 14 : 20, filter: i < lives ? 'none' : 'grayscale(1) opacity(.28)' }}>
            {i < lives ? '❤️' : '🖤'}
          </span>
        ))}
      </div>
      <div style={{ padding: compact ? '7px 9px' : '10px 14px', borderRadius: 14, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', fontWeight: 900, color: glow ? '#FFE66D' : '#fff', transform: glow ? 'scale(1.06)' : 'scale(1)', transition: 'all .25s ease' }}>
        ⭐ {score}
      </div>
      <div style={{ padding: compact ? '7px 9px' : '10px 14px', borderRadius: 14, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', fontWeight: 800 }}>
        ✅ {correct}
      </div>
      {combo >= 2 && (
        <div style={{ padding: compact ? '7px 9px' : '10px 14px', borderRadius: 14, background: 'linear-gradient(135deg,#FF6B6B,#FFE66D)', color: '#1a1a2e', fontWeight: 900 }}>
          🔥 {combo}x
        </div>
      )}
    </div>
  );
}
