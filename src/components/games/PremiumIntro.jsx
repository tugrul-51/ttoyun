/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';

export default function PremiumIntro({
  questionKey,
  title,
  subtitle,
  mascot = '✨',
  accent = '#6C5CE7',
  accent2 = '#4ECDC4',
  introMs = 1400,
  onIntro,
  introLine,
  successLine,
  failureLine,
  answerState,
}) {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    setShowIntro(true);
    onIntro?.();
    const timer = setTimeout(() => setShowIntro(false), introMs);
    return () => clearTimeout(timer);
  }, [questionKey, introMs, onIntro]);

  const bubbleText = answerState === 'correct'
    ? (successLine || 'Harika iş!')
    : answerState === 'wrong'
      ? (failureLine || 'Bir sonraki tur daha iyi olacak!')
      : (introLine || subtitle);

  return (
    <>
      <style>{`
        @keyframes premiumIntroIn { from { opacity: 0; transform: scale(.96) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes premiumIntroOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes mascotBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
        @keyframes ringPulse { 0% { transform: scale(.92); opacity: .28; } 70% { transform: scale(1.08); opacity: 0; } 100% { transform: scale(1.12); opacity: 0; } }
        @keyframes sparkOrbit { from { transform: rotate(0deg) translateX(18px) rotate(0deg); } to { transform: rotate(360deg) translateX(18px) rotate(-360deg); } }
      `}</style>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginBottom: 16,
        padding: '14px 16px',
        borderRadius: 22,
        background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 24%, rgba(255,255,255,.04)), color-mix(in srgb, ${accent2} 18%, rgba(255,255,255,.03)))`,
        border: '1px solid rgba(255,255,255,.10)',
        boxShadow: `0 16px 32px color-mix(in srgb, ${accent} 18%, rgba(0,0,0,.12))`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'relative', width: 82, height: 82, flex: '0 0 auto', display: 'grid', placeItems: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(circle, color-mix(in srgb, ${accent2} 52%, white) 0%, transparent 70%)`, animation: 'ringPulse 2.2s ease-out infinite' }} />
          <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: '1px dashed rgba(255,255,255,.24)', opacity: .65 }} />
          {[0,1,2].map((i) => (
            <div key={i} style={{ position: 'absolute', width: 10, height: 10, borderRadius: 999, background: 'rgba(255,255,255,.92)', boxShadow: '0 0 14px rgba(255,255,255,.8)', animation: `sparkOrbit ${3 + i * .6}s linear infinite`, animationDelay: `${i * .3}s` }} />
          ))}
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 22,
            display: 'grid',
            placeItems: 'center',
            fontSize: 34,
            background: 'linear-gradient(135deg, rgba(255,255,255,.26), rgba(255,255,255,.08))',
            border: '1px solid rgba(255,255,255,.18)',
            backdropFilter: 'blur(10px)',
            animation: 'mascotBob 2.6s ease-in-out infinite',
            position: 'relative',
            zIndex: 1,
          }}>{mascot}</div>
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.76)', marginBottom: 5 }}>{title}</div>
          <div style={{ fontSize: 20, fontWeight: 1000, color: '#fff', lineHeight: 1.2, marginBottom: 6 }}>{subtitle}</div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            maxWidth: '100%',
            padding: '10px 14px',
            borderRadius: 16,
            background: 'rgba(7,12,28,.28)',
            border: '1px solid rgba(255,255,255,.10)',
            color: 'rgba(255,255,255,.92)',
            fontWeight: 800,
            lineHeight: 1.35,
            boxShadow: '0 10px 20px rgba(0,0,0,.12)',
          }}>
            <span style={{ fontSize: 18 }}>💬</span>
            <span style={{ overflowWrap: 'anywhere' }}>{bubbleText}</span>
          </div>
        </div>
      </div>

      {showIntro && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 60,
          display: 'grid',
          placeItems: 'center',
          background: 'radial-gradient(circle at center, rgba(7,12,28,.18), rgba(7,12,28,.72))',
          backdropFilter: 'blur(6px)',
          pointerEvents: 'none',
          animation: 'premiumIntroOut .35s ease-out forwards',
          animationDelay: `${Math.max(0, introMs - 350)}ms`,
        }}>
          <div style={{
            minWidth: 320,
            maxWidth: 560,
            padding: '28px 26px',
            borderRadius: 28,
            background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 35%, rgba(7,12,28,.90)), color-mix(in srgb, ${accent2} 28%, rgba(7,12,28,.90)))`,
            border: '1px solid rgba(255,255,255,.14)',
            boxShadow: `0 28px 60px color-mix(in srgb, ${accent} 30%, rgba(0,0,0,.24))`,
            textAlign: 'center',
            animation: 'premiumIntroIn .35s ease-out',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,.18), transparent 24%), radial-gradient(circle at 80% 10%, rgba(255,255,255,.10), transparent 20%)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 58, marginBottom: 10 }}>{mascot}</div>
              <div style={{ fontSize: 14, fontWeight: 1000, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.76)', marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 32, fontWeight: 1000, color: '#fff', lineHeight: 1.1, marginBottom: 10 }}>{subtitle}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'rgba(255,255,255,.88)', lineHeight: 1.4 }}>{introLine || 'Hazırsan mini macera başlıyor!'}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
