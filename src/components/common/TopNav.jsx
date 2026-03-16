export default function TopNav({ screen, setScreen, isScormContentMode = false, onNavigate = null }) {
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 760 : false;
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
        { key: 'saved-questions', label: 'Sorularım', action: safeNav('saved-questions') },
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
      padding: screen === 'game' ? '4px 8px' : (isMobile ? '8px 10px' : '10px 12px'),
      borderRadius: 20,
      border: '1px solid rgba(255,255,255,.09)',
      background: 'linear-gradient(180deg, rgba(13,18,40,.82), rgba(13,18,40,.62))',
      backdropFilter: 'blur(16px)',
      boxShadow: '0 12px 28px rgba(0,0,0,.18)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: isMobile ? 'nowrap' : 'wrap', overflowX: isMobile ? 'auto' : 'visible', width: '100%', paddingBottom: isMobile ? 2 : 0, scrollbarWidth: 'none' }}>
        {items.map((item) => {
          const active = isActive(item.key);
          return (
            <button
              key={item.key}
              onClick={item.action}
              style={{
                padding: screen === 'game' ? '8px 11px' : (isMobile ? '10px 14px' : '11px 16px'),
                borderRadius: 14,
                border: `1px solid ${active ? 'rgba(78,205,196,.28)' : 'rgba(255,255,255,.10)'}`,
                background: active ? 'linear-gradient(135deg, rgba(108,92,231,.34), rgba(78,205,196,.22))' : 'rgba(255,255,255,.05)',
                color: '#fff', fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0
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
