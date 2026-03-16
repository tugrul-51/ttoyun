import { useEffect, useState } from 'react';
import BrandMark from './common/BrandMark';

const THEME_LABELS = {
  aurora: { title: 'Aurora', icon: '🌌' },
  ocean: { title: 'Okyanus', icon: '🌊' },
  candy: { title: 'Şeker', icon: '🍭' },
  jungle: { title: 'Orman', icon: '🌴' },
};

function LinkButton({ children, onClick, primary = false, fullWidth = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: primary ? '15px 20px' : '13px 18px',
        borderRadius: 16,
        border: primary ? 'none' : '1px solid rgba(255,255,255,.10)',
        background: primary ? 'linear-gradient(135deg,#6C5CE7,#4ECDC4)' : 'rgba(255,255,255,.05)',
        color: '#fff',
        fontWeight: 900,
        fontSize: primary ? 17 : 15,
        cursor: 'pointer',
        boxShadow: primary ? '0 18px 34px rgba(26,32,78,.28)' : 'none',
        width: fullWidth ? '100%' : 'auto',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );
}

export default function Home({
  topic,
  setTopic,
  genQs,
  loading,
  dots,
  err,
  branding,
  settings,
  membership,
  openMembership,
  openModes,
  openScorm,
  openEditor,
  openSavedQuestions,
  questionCountInput = '',
  onQuestionCountChange,
  localDraft,
  onRestoreLocalDraft,
  onDismissLocalDraft,
}) {
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
  const isMobile = viewport.width < 760;
  const effectiveCount = Number.parseInt(String(questionCountInput || '').trim(), 10) || 10;

  return (
    <div style={{ width: '100%', maxWidth: 1240, margin: '0 auto', display: 'grid', gap: compact ? 14 : 18, padding: compact ? '6px 0 18px' : '10px 0 24px', alignContent: 'start' }}>
      {localDraft ? (
        <div style={{ width: '100%', padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ color: '#E7F0FF', fontWeight: 800, lineHeight: 1.6 }}>
            🛟 Otomatik taslak hazır: <strong>{localDraft.sourceName || localDraft.topic || 'Adsız taslak'}</strong> • {localDraft.questions?.length || 0} soru
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <LinkButton onClick={onRestoreLocalDraft} primary>Taslağı Aç</LinkButton>
            <LinkButton onClick={onDismissLocalDraft}>Gizle</LinkButton>
          </div>
        </div>
      ) : null}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: compact ? 12 : 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: compact ? 12 : 18 }}>
          <BrandMark size={isMobile ? 64 : 86} />
          <div>
            <div style={{ color: '#A3B6D4', fontSize: 12, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }}>Doğrudan yapay zeka ile başla</div>
            <h1 style={{ fontSize: 'clamp(34px,5vw,56px)', fontWeight: 900, margin: '0 0 8px', background: 'linear-gradient(135deg,#FFE66D,#FF6B6B,#4ECDC4,#6C5CE7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1px', lineHeight: 1.04 }}>{branding?.title || 'T-T Eğitsel Oyunlar'}</h1>
            <p style={{ color: '#95A7C4', fontSize: compact ? 14 : 16, margin: 0 }}>{branding?.subtitle || 'Konu gir, soru üret, düzenle ve oyunu kontrollü başlat.'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ padding: '10px 14px', borderRadius: 999, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', color: '#DCE8F7', fontWeight: 800 }}>👥 {currentUserText}</div>
          <div style={{ padding: '10px 14px', borderRadius: 999, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', color: '#DCE8F7', fontWeight: 800 }}>{themeInfo.icon} {themeInfo.title}</div>
        </div>
      </div>

      <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))', borderRadius: compact ? 22 : 28, padding: compact ? 18 : 24, border: '1px solid rgba(255,255,255,.08)', boxShadow: '0 20px 40px rgba(0,0,0,.18)', display: 'grid', gap: compact ? 14 : 18 }}>
        <div>
          <div style={{ fontSize: compact ? 'clamp(23px, 2.6vw, 30px)' : 'clamp(28px, 3vw, 40px)', fontWeight: 900, color: '#fff', lineHeight: 1.12, marginBottom: 12 }}>Konu yaz, soru sayısını seç, soruları hazırla.</div>
          <div style={{ color: '#9FB3CD', fontSize: compact ? 13 : 15, lineHeight: 1.55, marginBottom: compact ? 12 : 18 }}>Sorular üretildiğinde doğrudan düzenleme akışına geçebilirsin. İstersen soru editörüne, oyunlara, sorularına veya SCORM Studio’ya alttaki sade menüden geç.</div>
          <label style={{ fontSize: 15, fontWeight: 800, color: '#E5EDFF', marginBottom: 10, display: 'block' }}>📝 Konu</label>
          <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && genQs()} placeholder='Örn: Fotosentez, Kesirler, Osmanlı, Gezegenler...' style={{ width: '100%', padding: compact ? '14px 16px' : '18px 20px', fontSize: compact ? 17 : 19, fontWeight: 700, background: 'rgba(0,0,0,.34)', border: '2px solid rgba(255,255,255,.10)', borderRadius: 18, color: '#fff', outline: 'none', fontFamily: 'inherit' }} />

          <div style={{ maxWidth: isMobile ? '100%' : 320, marginTop: 14 }}>
            <label style={{ fontSize: 15, fontWeight: 800, color: '#E5EDFF', marginBottom: 10, display: 'block' }}>🔢 Kaç soru hazırlansın?</label>
            <input
              type="number"
              min="1"
              step="1"
              value={questionCountInput}
              onChange={(e) => onQuestionCountChange?.(e.target.value)}
              placeholder='15'
              style={{ width: '100%', padding: compact ? '14px 16px' : '16px 18px', fontSize: compact ? 17 : 18, fontWeight: 800, background: 'rgba(0,0,0,.34)', border: '2px solid rgba(255,255,255,.10)', borderRadius: 18, color: '#fff', outline: 'none', fontFamily: 'inherit' }}
            />
            <div style={{ color: '#9FB3CD', fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>Önerilen sayı <strong style={{ color: '#fff' }}>15</strong>. Alanı boş bırakırsan yapay zeka otomatik olarak <strong style={{ color: '#fff' }}>10 soru</strong> üretir.</div>
          </div>
          {err ? <div style={{ marginTop: 10, padding: 14, borderRadius: 14, background: 'rgba(231,76,60,.15)', color: '#FF9292', fontSize: 15, fontWeight: 700 }}>⚠️ {err}</div> : null}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(220px, max-content))', gap: 12, marginTop: compact ? 12 : 16 }}>
            <LinkButton onClick={() => genQs()} primary fullWidth={isMobile}>{loading ? `Sorular hazırlanıyor${dots}` : `🚀 ${effectiveCount} Soruyu Oluştur`}</LinkButton>
            <LinkButton onClick={openModes} fullWidth={isMobile}>🎮 Hazır sorularla oyunlara geç</LinkButton>
            <LinkButton onClick={openEditor} fullWidth={isMobile}>📝 Soru editörüne geç</LinkButton>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(220px, max-content))', gap: 10 }}>
          <LinkButton onClick={openSavedQuestions} fullWidth={isMobile}>💾 Sorularım</LinkButton>
          <LinkButton onClick={openScorm} fullWidth={isMobile}>🚀 SCORM Studio</LinkButton>
          <LinkButton onClick={openMembership} fullWidth={isMobile}>🏫 Üyelik Merkezi</LinkButton>
        </div>
      </div>
    </div>
  );
}
