import { useEffect, useState } from 'react';
import { FEATURED_GAMES, MODES, NEW_GAMES } from '../constants/gameRegistry';
import BrandMark from './common/BrandMark';

const THEME_LABELS = {
  aurora: { title: 'Aurora', icon: '🌌' },
  ocean: { title: 'Okyanus', icon: '🌊' },
  candy: { title: 'Şeker', icon: '🍭' },
  jungle: { title: 'Orman', icon: '🌴' },
};

function ActionCard({ icon, title, text, cta, onClick, accent = 'linear-gradient(135deg,#6C5CE7,#4ECDC4)', compact = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left',
        padding: compact ? 18 : 24,
        borderRadius: 26,
        border: '1px solid rgba(255,255,255,.08)',
        background: 'linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03))',
        boxShadow: '0 22px 44px rgba(0,0,0,.18)',
        color: '#fff',
        cursor: 'pointer',
        display: 'grid',
        gap: compact ? 10 : 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
        <div style={{ fontSize: compact ? 30 : 40 }}>{icon}</div>
        <div style={{ padding: compact ? '6px 10px' : '8px 12px', borderRadius: 999, background: accent, fontSize: compact ? 11 : 12, fontWeight: 900 }}>{cta}</div>
      </div>
      <div>
        <div style={{ fontSize: compact ? 22 : 28, fontWeight: 900, marginBottom: compact ? 6 : 8, lineHeight: 1.1 }}>{title}</div>
        <div style={{ color: '#C7D4E8', lineHeight: compact ? 1.45 : 1.6, fontSize: compact ? 13 : 15 }}>{text}</div>
      </div>
    </button>
  );
}

export default function Home({ topic, setTopic, genQs, loading, dots, err, branding, settings, membership, openMembership, openModes, openScorm }) {
  const themeInfo = THEME_LABELS[settings?.themeFamily] || THEME_LABELS.aurora;
  const currentUserText = membership?.currentUser ? `${membership.currentUser.name} aktif` : 'Üyeliksiz hızlı kullanım aktif';
  const [viewport, setViewport] = useState({ width: typeof window !== 'undefined' ? window.innerWidth : 1440, height: typeof window !== 'undefined' ? window.innerHeight : 900 });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const compact = viewport.height < 860 || viewport.width < 1320;
  const ultraCompact = viewport.height < 760 || viewport.width < 1120;
  const featuredToShow = ultraCompact ? FEATURED_GAMES.slice(0, 2) : compact ? FEATURED_GAMES.slice(0, 3) : FEATURED_GAMES.slice(0, 4);
  const newGamesToShow = ultraCompact ? NEW_GAMES.slice(0, 3) : NEW_GAMES;

  return (
    <div style={{ width: '100%', maxWidth: 1360, margin: '0 auto', display: 'grid', gridTemplateRows: 'auto auto auto auto', gap: compact ? 14 : 18, padding: compact ? '4px 0 18px' : '8px 0 24px', alignContent: 'start' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: compact ? 12 : 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 12 : 18 }}>
          <BrandMark size={86} />
          <div>
            <div style={{ color: '#A3B6D4', fontSize: 12, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }}>V5 sade görünüm</div>
            <h1 style={{ fontSize: 'clamp(34px,5vw,56px)', fontWeight: 900, margin: '0 0 8px', background: 'linear-gradient(135deg,#FFE66D,#FF6B6B,#4ECDC4,#6C5CE7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1px', lineHeight: 1.04 }}>{branding?.title || 'T~T Eğitsel Çevrimiçi Oyunlar'}</h1>
            <p style={{ color: '#95A7C4', fontSize: compact ? 14 : 16, margin: 0 }}>{branding?.subtitle || 'Öğretmen hızlı başlasın, isteyen gelişmiş merkeze girsin.'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ padding: '10px 14px', borderRadius: 999, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', color: '#DCE8F7', fontWeight: 800 }}>👥 {currentUserText}</div>
          <div style={{ padding: '10px 14px', borderRadius: 999, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', color: '#DCE8F7', fontWeight: 800 }}>{themeInfo.icon} {themeInfo.title} tema</div>
        </div>
      </div>

      <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))', borderRadius: compact ? 22 : 28, padding: compact ? 18 : 24, border: '1px solid rgba(255,255,255,.08)', boxShadow: '0 20px 40px rgba(0,0,0,.18)', display: 'grid', gridTemplateColumns: '1fr', gap: compact ? 12 : 18, alignItems: 'stretch' }}>
        <div>
          <div style={{ fontSize: compact ? 12 : 14, fontWeight: 900, color: '#95A7C4', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>Hızlı başla</div>
          <div style={{ fontSize: compact ? 'clamp(23px, 2.6vw, 30px)' : 'clamp(28px, 3vw, 40px)', fontWeight: 900, color: '#fff', lineHeight: 1.12, marginBottom: 12 }}>Konu yaz, soruları hazırla, oyunu hemen başlat.</div>
          <div style={{ color: '#9FB3CD', fontSize: compact ? 13 : 15, lineHeight: 1.55, marginBottom: compact ? 12 : 18 }}>Ana ekranda sadece en önemli üç yol var: hızlı kullanım, sınıf merkezi ve SCORM dışa aktarma.</div>
          <label style={{ fontSize: 15, fontWeight: 800, color: '#E5EDFF', marginBottom: 10, display: 'block' }}>📝 Konu</label>
          <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && genQs()} placeholder='Örn: Fotosentez, Kesirler, Osmanlı, Gezegenler...' style={{ width: '100%', padding: compact ? '14px 16px' : '18px 20px', fontSize: compact ? 17 : 19, fontWeight: 700, background: 'rgba(0,0,0,.34)', border: '2px solid rgba(255,255,255,.10)', borderRadius: 18, color: '#fff', outline: 'none', fontFamily: 'inherit' }} />
          {err ? <div style={{ marginTop: 10, padding: 14, borderRadius: 14, background: 'rgba(231,76,60,.15)', color: '#FF9292', fontSize: 15, fontWeight: 700 }}>⚠️ {err}</div> : null}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: compact ? 12 : 16 }}>
            <button onClick={() => genQs()} disabled={loading || !topic.trim()} style={{ padding: compact ? '14px 18px' : '18px 22px', fontSize: compact ? 16 : 19, fontWeight: 900, border: 'none', borderRadius: 18, cursor: loading || !topic.trim() ? 'default' : 'pointer', background: loading ? 'rgba(108,92,231,.3)' : !topic.trim() ? 'rgba(255,255,255,.06)' : 'linear-gradient(135deg,#6C5CE7,#4ECDC4)', color: !topic.trim() ? '#7E8FA8' : '#fff', minWidth: compact ? 190 : 240 }}>{loading ? `Sorular hazırlanıyor${dots}` : '🚀 Soruları Oluştur'}</button>
            <button onClick={openModes} style={{ padding: compact ? '14px 18px' : '18px 22px', fontSize: compact ? 15 : 18, fontWeight: 900, border: '1px solid rgba(255,255,255,.10)', borderRadius: 18, cursor: 'pointer', background: 'rgba(255,255,255,.05)', color: '#fff' }}>🎮 Hazır sorularla oyunlara geç</button>
          </div>
        </div>
      </div>

      <div style={{ minHeight: 0, display: 'grid', gridTemplateColumns: viewport.width < 1280 ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: compact ? 12 : 18 }}>
        <ActionCard compact={compact} icon='⚡' title='Hızlı Kullanım' text='Konu gir, soru hazırla, oyunu başlat. Ders içinde en hızlı yol.' cta='Önerilen' onClick={openModes} />
        <ActionCard compact={compact} icon='🏫' title='Sınıf / Üyelik Merkezi' text='Öğretmen girişi, öğrenci kodu, görevler ve raporlar burada.' cta='Gelişmiş' onClick={openMembership} accent='linear-gradient(135deg,#FF8A5B,#FFD166)' />
        <ActionCard compact={compact} icon='📦' title='SCORM / Dışa Aktar' text='Paket özeti, sürüm seçimi ve LMS için tek tık dışa aktar.' cta='Export' onClick={openScorm} accent='linear-gradient(135deg,#2ecc71,#4ecdc4)' />
      </div>

      {!ultraCompact && <div style={{ display: 'grid', gridTemplateColumns: viewport.width < 1350 ? '1fr' : 'minmax(0,1.15fr) minmax(320px,.85fr)', gap: compact ? 12 : 18, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {['Hızlı Başla', 'Sınıf Merkezi', 'SCORM', `${MODES.length} Oyun`, 'Akıllı Tahta'].map((item) => (
              <div key={item} style={{ padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)', color: '#C8D6E8', fontSize: 13, fontWeight: 700 }}>{item}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 10 }}>
            {featuredToShow.map((game) => (
              <div key={game.id} style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ fontSize: 24 }}>{game.icon}</div>
                  <div style={{ fontSize: 11, color: '#BFD1E8', fontWeight: 900, textTransform: 'uppercase' }}>Vitrin</div>
                </div>
                <div style={{ marginTop: 10, color: '#fff', fontWeight: 900 }}>{game.name}</div>
                <div style={{ marginTop: 4, color: '#95A7C4', fontSize: 12 }}>{game.cat} • {game.audience}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '18px 18px 16px', alignContent: 'start', borderRadius: 24, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', display: 'grid', gap: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#A3B6D4', letterSpacing: '.08em', textTransform: 'uppercase' }}>Yeni premium oyunlar</div>
          {newGamesToShow.map((game) => (
            <div key={game.id} style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 10, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
              <div style={{ fontSize: 24 }}>{game.icon}</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 800 }}>{game.name}</div>
                <div style={{ color: '#95A7C4', fontSize: 12 }}>{game.desc}</div>
              </div>
              <div style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(78,205,196,.14)', color: '#C9FFF8', fontSize: 11, fontWeight: 900 }}>Yeni</div>
            </div>
          ))}
        </div>
      </div>}
    </div>
  );
}
