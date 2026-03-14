export default function ResultModal({ open, title, subtitle, stats = [], actions = [] }) {
  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,10,20,.72)', backdropFilter: 'blur(8px)', zIndex: 90, display: 'grid', placeItems: 'center', padding: 20 }}>
      <div style={{ width: 'min(920px, 100%)', background: 'linear-gradient(180deg,rgba(20,28,46,.98),rgba(11,16,30,.98))', border: '1px solid rgba(255,255,255,.08)', borderRadius: 28, padding: 28, boxShadow: '0 24px 70px rgba(0,0,0,.45)' }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 56, marginBottom: 10 }}>🏆</div>
          <h2 style={{ margin: 0, fontSize: 34, color: '#FFE66D' }}>{title}</h2>
          {subtitle ? <p style={{ margin: '8px 0 0', color: '#9FB3CD' }}>{subtitle}</p> : null}
        </div>
        {!!stats.length && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 22 }}>
            {stats.map((item) => (
              <div key={item.label} style={{ padding: 16, borderRadius: 18, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)', textAlign: 'center' }}>
                <div style={{ fontSize: 26 }}>{item.icon}</div>
                <div style={{ fontSize: 24, fontWeight: 900, marginTop: 4 }}>{item.value}</div>
                <div style={{ fontSize: 12, color: '#7D90AC', marginTop: 3 }}>{item.label}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          {actions.map((action) => (
            <button key={action.label} onClick={action.onClick} style={{ padding: '14px 24px', borderRadius: 16, border: action.primary ? 'none' : '1px solid rgba(255,255,255,.12)', background: action.primary ? 'linear-gradient(135deg,#6C5CE7,#8E6BFF)' : 'rgba(255,255,255,.06)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', minWidth: 180 }}>
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
