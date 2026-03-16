export default function LoadingStage({ title = 'Sahne hazırlanıyor', text = 'Premium oyun deneyimi yükleniyor...' }) {
  return (
    <div style={{ minHeight: 'min(62vh, 720px)', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: 'min(560px, 100%)', borderRadius: 28, padding: 28, background: 'linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03))', border: '1px solid rgba(255,255,255,.08)', boxShadow: '0 20px 48px rgba(0,0,0,.24)', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 999, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', color: '#EAF1FF', fontWeight: 900 }}>✨ Yükleniyor</div>
        <div style={{ marginTop: 18, fontSize: 'clamp(24px, 4vw, 34px)', color: '#fff', fontWeight: 900 }}>{title}</div>
        <div style={{ marginTop: 10, color: '#AFC2DF', fontSize: 15, lineHeight: 1.65 }}>{text}</div>
        <div style={{ marginTop: 18, height: 12, borderRadius: 999, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
          <div style={{ width: '42%', height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #6C5CE7, #4ECDC4, #FFE66D)', animation: 'ttLoadingPulse 1.2s ease-in-out infinite alternate' }} />
        </div>
      </div>
    </div>
  );
}
