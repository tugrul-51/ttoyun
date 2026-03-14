export default function TopNav({ screen, setScreen, isScormContentMode = false, onNavigate = null }) {
  const safeNav = (target) => () => {
    if (typeof onNavigate === 'function') {
      onNavigate(target);
      return;
    }
    setScreen(target);
  };
  const items = isScormContentMode
    ? [
        { key: 'game-settings', label: 'Oyun ayarları', action: safeNav('game-settings') },
        { key: 'games', label: 'Oyunlar', action: safeNav('games') },
      ]
    : [
        { key: 'home', label: 'Ana sayfa', action: safeNav('home') },
        { key: 'editor', label: 'Soru editörü', action: safeNav('editor') },
        { key: 'game-settings', label: 'Oyun ayarları', action: safeNav('game-settings') },
        { key: 'games', label: 'Oyunlar', action: safeNav('games') },
      ];

  const isActive = (key) => {
    if (key === 'games') return screen === 'games' || screen === 'game' || screen === 'modes';
    return screen === key;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      flexWrap: 'wrap',
      padding: screen === 'game' ? '4px 8px' : '10px 12px',
      borderRadius: 20,
      border: '1px solid rgba(255,255,255,.09)',
      background: 'linear-gradient(180deg, rgba(13,18,40,.82), rgba(13,18,40,.62))',
      backdropFilter: 'blur(16px)',
      boxShadow: '0 12px 28px rgba(0,0,0,.18)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {screen !== 'game' && !isScormContentMode ? <div style={{
          padding: '8px 12px', borderRadius: 999, fontSize: 12, fontWeight: 900,
          color: '#C9D8F2', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)'
        }}>
          Yapay zeka soru girişi sonrası hızlı gezinme
        </div> : null}
        {items.map((item) => {
          const active = isActive(item.key);
          return (
            <button
              key={item.key}
              onClick={item.action}
              style={{
                padding: screen === 'game' ? '8px 11px' : '11px 16px',
                borderRadius: 14,
                border: `1px solid ${active ? 'rgba(78,205,196,.28)' : 'rgba(255,255,255,.10)'}`,
                background: active ? 'linear-gradient(135deg, rgba(108,92,231,.34), rgba(78,205,196,.22))' : 'rgba(255,255,255,.05)',
                color: '#fff', fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap'
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
