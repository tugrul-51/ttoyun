/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useRef, useState } from 'react';
import { SFX } from '../../../utils/audio';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getStageLabel(matches, totalPairs) {
  const ratio = totalPairs ? matches / totalPairs : 0;
  if (ratio >= 1) return 'Efsane Hafıza';
  if (ratio >= 0.75) return 'Mükemmel Seri';
  if (ratio >= 0.45) return 'Parlayan Hafıza';
  if (matches >= 1) return 'Sıcak Başlangıç';
  return 'Kart Avı';
}

function getMoveMood(moves, matches, totalPairs) {
  if (matches >= totalPairs) return 'Görev tamamlandı';
  if (moves <= Math.max(4, totalPairs) && matches >= Math.max(2, Math.ceil(totalPairs * 0.3))) return 'Keskin hafıza';
  if (moves <= Math.max(8, totalPairs * 2)) return 'Harika tempo';
  if (moves <= Math.max(12, totalPairs * 3)) return 'Dikkatli ilerleme';
  return 'Odaklan ve eşleştir';
}

function getStarCount(matches, moves, totalPairs) {
  if (totalPairs <= 0) return 0;
  if (matches < totalPairs) {
    const ratio = matches / totalPairs;
    return ratio >= 0.75 ? 2 : ratio >= 0.4 ? 1 : 0;
  }
  if (moves <= Math.max(totalPairs + 1, 7)) return 3;
  if (moves <= Math.max(totalPairs + 3, 10)) return 2;
  return 1;
}

function getFocusState(cards, openIndexes) {
  const openCards = openIndexes.map((index) => cards[index]).filter(Boolean);

  if (openCards.length === 2) {
    const [a, b] = openCards;
    const paired = a.p === b.p && a.t !== b.t;
    const questionText = a.t === 'q' ? a.x : b.x;
    const answerText = a.t === 'a' ? a.x : b.x;

    return paired
      ? {
          tone: 'match',
          badge: '✅ Eşleşme bulundu',
          title: questionText,
          subtitle: `Cevap: ${answerText}`,
        }
      : {
          tone: 'warn',
          badge: '🔍 Kartları karşılaştır',
          title: a.x,
          subtitle: b.x,
        };
  }

  if (openCards.length === 1) {
    const [card] = openCards;
    return card.t === 'q'
      ? {
          tone: 'question',
          badge: '❓ Aktif soru',
          title: card.x,
          subtitle: 'Şimdi bu soruya ait doğru cevap kartını bul.',
        }
      : {
          tone: 'answer',
          badge: '💡 Açık cevap',
          title: `Cevap: ${card.x}`,
          subtitle: 'Şimdi bu cevaba ait soru kartını bul.',
        };
  }

  return {
    tone: 'idle',
    badge: '🧠 Hafıza görevi',
    title: 'Soru ve cevap kartlarını eşleştir.',
    subtitle: 'Bir kart aç, metni dikkatle oku ve doğru eşini hatırlayıp bul.',
  };
}

export default function Memory({ mcs, mfl, mma, mmv, hMem }) {
  const [flash, setFlash] = useState(null);
  const prevMatchesRef = useRef(mma?.length || 0);
  const prevOpenCountRef = useRef(mfl?.length || 0);

  const matches = mma?.length || 0;
  const totalPairs = Math.max(1, mcs.filter((card) => card.t === 'q').length);
  const progress = clamp((matches / totalPairs) * 100, 0, 100);
  const stageLabel = getStageLabel(matches, totalPairs);
  const moveMood = getMoveMood(mmv || 0, matches, totalPairs);
  const starCount = getStarCount(matches, mmv || 0, totalPairs);
  const efficiency = clamp(Math.round((matches / Math.max(mmv || 1, 1)) * 100), 0, 100);
  const focus = useMemo(() => getFocusState(mcs, mfl), [mcs, mfl]);
  const remainingQuestions = useMemo(
    () => mcs.filter((card) => card.t === 'q' && !card.m),
    [mcs],
  );
  const matchedQuestions = useMemo(
    () => mcs.filter((card) => card.t === 'q' && card.m),
    [mcs],
  );

  useEffect(() => {
    if (matches > prevMatchesRef.current) {
      setFlash('match');
      if (matches === 3 || matches === 5) SFX.levelUp();
      if (matches >= totalPairs) SFX.win();
      const timeoutId = setTimeout(() => setFlash(null), 900);
      prevMatchesRef.current = matches;
      return () => clearTimeout(timeoutId);
    }

    if (prevOpenCountRef.current === 2 && (mfl?.length || 0) === 0 && matches === prevMatchesRef.current) {
      setFlash('miss');
      const timeoutId = setTimeout(() => setFlash(null), 720);
      prevOpenCountRef.current = mfl?.length || 0;
      return () => clearTimeout(timeoutId);
    }

    prevMatchesRef.current = matches;
    prevOpenCountRef.current = mfl?.length || 0;
    return undefined;
  }, [matches, mfl, totalPairs]);

  useEffect(() => {
    prevOpenCountRef.current = mfl?.length || 0;
  }, [mfl]);

  const focusPalette = {
    idle: {
      bg: 'linear-gradient(135deg, rgba(108,92,231,.26), rgba(78,205,196,.16))',
      border: 'rgba(255,255,255,.16)',
      glow: 'rgba(108,92,231,.25)',
    },
    question: {
      bg: 'linear-gradient(135deg, rgba(108,92,231,.38), rgba(255,255,255,.08))',
      border: 'rgba(155,136,255,.32)',
      glow: 'rgba(108,92,231,.28)',
    },
    answer: {
      bg: 'linear-gradient(135deg, rgba(78,205,196,.34), rgba(255,255,255,.08))',
      border: 'rgba(78,205,196,.3)',
      glow: 'rgba(78,205,196,.24)',
    },
    match: {
      bg: 'linear-gradient(135deg, rgba(46,204,113,.34), rgba(255,230,109,.18))',
      border: 'rgba(124,255,195,.34)',
      glow: 'rgba(46,204,113,.28)',
    },
    warn: {
      bg: 'linear-gradient(135deg, rgba(255,107,107,.32), rgba(255,159,67,.14))',
      border: 'rgba(255,140,140,.32)',
      glow: 'rgba(255,107,107,.26)',
    },
  };

  const palette = focusPalette[focus.tone] || focusPalette.idle;

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 'min(1600px, 98vw)',
        margin: '0 auto',
        position: 'relative',
        animation: 'memoryUltraEnter .45s ease',
      }}
    >
      <style>{`
        @keyframes memoryUltraEnter {
          from { opacity: 0; transform: translateY(18px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes memoryFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
          100% { transform: translateY(0px); }
        }

        @keyframes memoryGlowBar {
          from { filter: brightness(1); }
          to { filter: brightness(1.14); }
        }

        @keyframes memoryPulse {
          from { transform: scale(1); }
          to { transform: scale(1.04); }
        }

        @keyframes memoryMatchGlow {
          0% { box-shadow: 0 0 0 rgba(46,204,113,0); }
          50% { box-shadow: 0 0 36px rgba(46,204,113,.22); }
          100% { box-shadow: 0 0 0 rgba(46,204,113,0); }
        }

        @keyframes memoryFocusPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.012); }
          100% { transform: scale(1); }
        }

        @keyframes memoryShimmer {
          0% { transform: translateX(-120%) rotate(10deg); opacity: 0; }
          20% { opacity: .2; }
          100% { transform: translateX(220%) rotate(10deg); opacity: 0; }
        }

        @keyframes memoryBurstPop {
          from { opacity: 0; transform: scale(.88); }
          30% { opacity: 1; }
          to { opacity: 0; transform: scale(1.15); }
        }

        @keyframes memoryMissShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          50% { transform: translateX(8px); }
          75% { transform: translateX(-5px); }
        }

        .memory-shell {
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .memory-progress-glow {
          animation: memoryGlowBar .85s ease-in-out infinite alternate;
        }

        .memory-badge-pulse {
          animation: memoryPulse .8s ease-in-out infinite alternate;
        }

        .memory-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(96px, 1fr));
          gap: 12px;
        }

        .memory-card-wrap {
          perspective: 1200px;
          min-width: 0;
        }

        .memory-card {
          position: relative;
          width: 100%;
          min-height: 132px;
          transform-style: preserve-3d;
          transition: transform .45s cubic-bezier(.2,.8,.2,1), filter .2s ease, box-shadow .2s ease;
          cursor: pointer;
        }

        .memory-card:hover {
          filter: brightness(1.05);
          transform: translateY(-3px);
        }

        .memory-card.flipped {
          transform: rotateY(180deg);
        }

        .memory-card.matched {
          animation: memoryFloat 2.3s ease-in-out infinite, memoryMatchGlow 2s ease-in-out infinite;
        }

        .memory-face {
          position: absolute;
          inset: 0;
          border-radius: 22px;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 12px 10px;
        }

        .memory-front {
          transform: rotateY(180deg);
        }

        .memory-content-text {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .memory-focus-panel {
          animation: memoryFocusPulse 1.8s ease-in-out infinite;
        }

        .memory-shimmer::after {
          content: '';
          position: absolute;
          inset: -30% auto -30% -20%;
          width: 42%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.28), transparent);
          transform: translateX(-120%) rotate(10deg);
          animation: memoryShimmer 3.8s ease-in-out infinite;
          pointer-events: none;
        }

        @media (max-width: 1560px) {
          .memory-layout {
            grid-template-columns: 320px minmax(0, 1fr) !important;
          }
          .memory-grid {
            grid-template-columns: repeat(5, minmax(92px, 1fr)) !important;
          }
          .memory-card {
            min-height: 124px !important;
          }
        }

        @media (max-width: 1280px) {
          .memory-layout {
            grid-template-columns: 1fr !important;
          }
          .memory-grid {
            grid-template-columns: repeat(4, minmax(92px, 1fr)) !important;
          }
        }

        @media (max-width: 760px) {
          .memory-grid {
            grid-template-columns: repeat(3, minmax(90px, 1fr)) !important;
            gap: 10px !important;
          }
          .memory-card {
            min-height: 116px !important;
          }
          .memory-title {
            font-size: 24px !important;
          }
        }

        @media (max-width: 560px) {
          .memory-grid {
            grid-template-columns: repeat(2, minmax(102px, 1fr)) !important;
          }
          .memory-card {
            min-height: 110px !important;
          }
        }
      `}</style>

      <div
        className="memory-shell"
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 28,
          padding: 16,
          border: '1px solid rgba(255,255,255,.10)',
          background:
            'radial-gradient(circle at top left, rgba(108,92,231,.18), transparent 24%), radial-gradient(circle at top right, rgba(78,205,196,.14), transparent 20%), linear-gradient(180deg, rgba(9,14,28,.88), rgba(12,18,32,.97))',
          boxShadow: '0 20px 64px rgba(0,0,0,.30)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -60,
            left: -50,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'rgba(108,92,231,.14)',
            filter: 'blur(18px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -70,
            right: -20,
            width: 250,
            height: 250,
            borderRadius: '50%',
            background: 'rgba(78,205,196,.10)',
            filter: 'blur(20px)',
          }}
        />

        {flash === 'match' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              pointerEvents: 'none',
              zIndex: 3,
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: '78%',
                maxWidth: 760,
                aspectRatio: '1 / 1',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,230,109,.25), rgba(46,204,113,.12), transparent 72%)',
                animation: 'memoryBurstPop .9s ease forwards',
              }}
            />
            <div
              style={{
                padding: '18px 28px',
                borderRadius: 999,
                background: 'linear-gradient(135deg, rgba(46,204,113,.28), rgba(255,230,109,.18))',
                border: '1px solid rgba(255,255,255,.16)',
                color: '#fff',
                fontSize: 'clamp(18px, 2vw, 30px)',
                fontWeight: 900,
                letterSpacing: '.02em',
                boxShadow: '0 18px 34px rgba(0,0,0,.25)',
                animation: 'memoryBurstPop .9s ease forwards',
              }}
            >
              ✨ Harika eşleşme!
            </div>
          </div>
        )}

        {flash === 'miss' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 3,
              background: 'radial-gradient(circle at center, rgba(255,107,107,.12), transparent 58%)',
              animation: 'memoryMissShake .34s ease',
            }}
          />
        )}

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div
              style={{
                padding: '11px 16px',
                borderRadius: 999,
                background: 'rgba(255,255,255,.08)',
                border: '1px solid rgba(255,255,255,.08)',
                color: '#EEF4FF',
                fontSize: 14,
                fontWeight: 900,
              }}
            >
              🧠 HAFIZA GÖREVİ
            </div>

            <div
              style={{
                padding: '11px 16px',
                borderRadius: 999,
                background: 'rgba(255,230,109,.12)',
                border: '1px solid rgba(255,230,109,.18)',
                color: '#FFF4BF',
                fontSize: 14,
                fontWeight: 900,
              }}
            >
              EŞLEŞME {matches}/{totalPairs}
            </div>

            <div
              className={matches >= 2 ? 'memory-badge-pulse' : ''}
              style={{
                padding: '11px 16px',
                borderRadius: 999,
                background:
                  matches >= 4
                    ? 'linear-gradient(135deg,#FF6B6B,#FFE66D)'
                    : 'linear-gradient(135deg,#6C5CE7,#4ECDC4)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 900,
                boxShadow:
                  matches >= 4
                    ? '0 10px 24px rgba(255,107,107,.22)'
                    : '0 10px 24px rgba(108,92,231,.22)',
              }}
            >
              ✨ {stageLabel}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div
              style={{
                padding: '11px 16px',
                borderRadius: 16,
                background: 'rgba(255,255,255,.08)',
                border: '1px solid rgba(255,255,255,.08)',
                color: '#F4F8FF',
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              Hamle: {mmv}
            </div>

            <div
              style={{
                padding: '11px 16px',
                borderRadius: 16,
                background: 'rgba(78,205,196,.10)',
                border: '1px solid rgba(78,205,196,.16)',
                color: '#DDFDFC',
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              {moveMood}
            </div>
          </div>
        </div>

        <div
          className="memory-focus-panel memory-shimmer"
          style={{
            position: 'relative',
            zIndex: 1,
            marginBottom: 16,
            overflow: 'hidden',
            borderRadius: 30,
            padding: '20px clamp(18px, 2vw, 28px)',
            background: palette.bg,
            border: `1px solid ${palette.border}`,
            boxShadow: `0 18px 36px ${palette.glow}`,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 14px',
              borderRadius: 999,
              background: 'rgba(255,255,255,.09)',
              border: '1px solid rgba(255,255,255,.12)',
              color: '#F2F6FF',
              fontSize: 13,
              fontWeight: 900,
              marginBottom: 12,
            }}
          >
            {focus.badge}
          </div>

          <div
            style={{
              fontSize: 'clamp(24px, 2.5vw, 42px)',
              lineHeight: 1.18,
              fontWeight: 950,
              color: '#fff',
              textShadow: '0 6px 24px rgba(0,0,0,.22)',
              marginBottom: 10,
            }}
          >
            {focus.title}
          </div>

          <div
            style={{
              color: '#E9F2FF',
              fontSize: 'clamp(14px, 1.2vw, 18px)',
              lineHeight: 1.5,
              fontWeight: 700,
              maxWidth: 920,
            }}
          >
            {focus.subtitle}
          </div>
        </div>

        <div
          className="memory-layout"
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 400px) minmax(0, 1fr)',
            gap: 16,
            alignItems: 'stretch',
          }}
        >
          <div
            className="memory-shell"
            style={{
              borderRadius: 30,
              padding: 18,
              border: '1px solid rgba(255,255,255,.08)',
              background:
                'linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 999,
                background: 'rgba(255,255,255,.06)',
                border: '1px solid rgba(255,255,255,.08)',
                color: '#DCEBFF',
                fontSize: 13,
                fontWeight: 800,
                marginBottom: 14,
              }}
            >
              🎯 Görev Merkezi
            </div>

            <div
              className="memory-title"
              style={{
                fontSize: 'clamp(28px, 2vw, 40px)',
                lineHeight: 1.18,
                fontWeight: 900,
                color: '#fff',
                marginBottom: 18,
              }}
            >
              Soru cümlelerini kaybetmeden doğru cevap kartlarıyla eşleştir.
            </div>

            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#CFE2FF',
                }}
              >
                <span>İlerleme</span>
                <span>%{Math.round(progress)}</span>
              </div>

              <div
                style={{
                  width: '100%',
                  height: 14,
                  background: 'rgba(255,255,255,.08)',
                  borderRadius: 999,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,.06)',
                }}
              >
                <div
                  className="memory-progress-glow"
                  style={{
                    width: `${progress}%`,
                    height: '100%',
                    borderRadius: 999,
                    transition: 'width .35s ease',
                    background: 'linear-gradient(90deg,#4ECDC4,#6C5CE7,#FFE66D)',
                    boxShadow: '0 0 18px rgba(108,92,231,.22)',
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 8,
                marginBottom: 16,
              }}
            >
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  style={{
                    padding: '14px 12px',
                    borderRadius: 20,
                    background: index < starCount ? 'linear-gradient(135deg,#FFE66D,#FFB347)' : 'rgba(255,255,255,.05)',
                    border: index < starCount ? '1px solid rgba(255,230,109,.28)' : '1px solid rgba(255,255,255,.08)',
                    color: index < starCount ? '#4A3300' : '#DCEBFF',
                    textAlign: 'center',
                    fontWeight: 900,
                    boxShadow: index < starCount ? '0 12px 24px rgba(255,179,71,.18)' : 'none',
                  }}
                >
                  ⭐
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
              <div
                style={{
                  padding: '13px 15px',
                  borderRadius: 18,
                  background: 'rgba(255,255,255,.06)',
                  border: '1px solid rgba(255,255,255,.08)',
                  color: '#EEF6FF',
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                👀 Açılan karttaki metni dikkatle oku.
              </div>

              <div
                style={{
                  padding: '13px 15px',
                  borderRadius: 18,
                  background: 'rgba(255,255,255,.06)',
                  border: '1px solid rgba(255,255,255,.08)',
                  color: '#EEF6FF',
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                🧩 Soru kartını doğru cevap kartıyla eşleştir.
              </div>

              <div
                style={{
                  padding: '13px 15px',
                  borderRadius: 18,
                  background: 'rgba(255,230,109,.08)',
                  border: '1px solid rgba(255,230,109,.12)',
                  color: '#FFF0BE',
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                ⚡ Az hamle + doğru seri = daha yüksek hafıza yıldızı.
              </div>
            </div>

            <div
              style={{
                borderRadius: 24,
                padding: 16,
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.08)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 900 }}>📜 Kalan soru kartları</div>
                <div style={{ color: '#A8BEDA', fontSize: 10, fontWeight: 800 }}>{remainingQuestions.length} soru açıkta</div>
              </div>

              <div style={{ display: 'grid', gap: 8, maxHeight: 246, overflowY: 'auto', paddingRight: 4 }}>
                {remainingQuestions.map((card, index) => (
                  <div
                    key={card.id}
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'flex-start',
                      padding: '10px 12px',
                      borderRadius: 16,
                      background: 'rgba(108,92,231,.10)',
                      border: '1px solid rgba(108,92,231,.18)',
                    }}
                  >
                    <div
                      style={{
                        flex: '0 0 auto',
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        background: 'rgba(255,255,255,.12)',
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 900,
                      }}
                    >
                      {index + 1}
                    </div>
                    <div style={{ color: '#F2F6FF', fontSize: 14, fontWeight: 800, lineHeight: 1.35 }}>{card.x}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className="memory-shell"
            style={{
              borderRadius: 30,
              padding: 18,
              border: '1px solid rgba(255,255,255,.08)',
              background:
                'linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -40,
                right: -30,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: 'rgba(255,230,109,.08)',
                filter: 'blur(14px)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: -40,
                left: -20,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: 'rgba(78,205,196,.08)',
                filter: 'blur(14px)',
              }}
            />

            <div
              style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,.06)',
                  border: '1px solid rgba(255,255,255,.08)',
                  color: '#DCEBFF',
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                🎴 Parlayan kart sahnesi
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div
                  style={{
                    padding: '9px 12px',
                    borderRadius: 999,
                    background: 'rgba(78,205,196,.10)',
                    border: '1px solid rgba(78,205,196,.14)',
                    color: '#D9FFFB',
                    fontSize: 10,
                    fontWeight: 900,
                  }}
                >
                  Verim %{efficiency}
                </div>
                <div
                  style={{
                    padding: '9px 12px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,.06)',
                    border: '1px solid rgba(255,255,255,.08)',
                    color: '#E9F2FF',
                    fontSize: 10,
                    fontWeight: 900,
                  }}
                >
                  Tamamlanan soru {matchedQuestions.length}
                </div>
              </div>
            </div>

            <div className="memory-grid" style={{ position: 'relative', zIndex: 1 }}>
              {mcs.map((c, i) => {
                const flipped = mfl.includes(i) || c.m;
                const matched = !!c.m;

                return (
                  <div key={c.id} className="memory-card-wrap">
                    <div
                      className={`memory-card ${flipped ? 'flipped' : ''} ${matched ? 'matched' : ''}`}
                      onClick={() => !matched && hMem(i)}
                      style={{
                        cursor: matched ? 'default' : 'pointer',
                        filter: matched ? 'brightness(1.06)' : 'none',
                      }}
                    >
                      <div
                        className="memory-face memory-back"
                        style={{
                          background:
                            'linear-gradient(145deg, rgba(108,92,231,.36), rgba(78,205,196,.18))',
                          border: '2px solid rgba(108,92,231,.24)',
                          boxShadow: '0 16px 34px rgba(108,92,231,.16)',
                        }}
                      >
                        <div style={{ textAlign: 'center', maxWidth: '90%' }}>
                          <div style={{ fontSize: 24, marginBottom: 6 }}>🧠</div>
                          <div
                            style={{
                              color: '#E9E5FF',
                              fontSize: 11.5,
                              fontWeight: 900,
                              letterSpacing: '.5px',
                              lineHeight: 1.2,
                              marginBottom: 8,
                            }}
                          >
                            HAFIZA KARTI
                          </div>
                          <div
                            style={{
                              color: '#CFE2FF',
                              fontSize: 9,
                              fontWeight: 800,
                            }}
                          >
                            Dokun ve metni oku
                          </div>
                        </div>
                      </div>

                      <div
                        className="memory-face memory-front"
                        style={{
                          background: matched
                            ? 'linear-gradient(145deg, rgba(46,204,113,.26), rgba(255,230,109,.12))'
                            : c.t === 'q'
                              ? 'linear-gradient(145deg, rgba(108,92,231,.22), rgba(255,255,255,.07))'
                              : 'linear-gradient(145deg, rgba(78,205,196,.20), rgba(255,255,255,.07))',
                          border: matched
                            ? '2px solid rgba(46,204,113,.34)'
                            : '2px solid rgba(255,255,255,.12)',
                          boxShadow: matched
                            ? '0 16px 34px rgba(46,204,113,.14)'
                            : '0 16px 34px rgba(0,0,0,.14)',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            padding: '4px 7px',
                            borderRadius: 999,
                            background: matched
                              ? 'rgba(46,204,113,.18)'
                              : c.t === 'q'
                                ? 'rgba(108,92,231,.18)'
                                : 'rgba(78,205,196,.18)',
                            border: '1px solid rgba(255,255,255,.10)',
                            color: '#fff',
                            fontSize: 9,
                            fontWeight: 900,
                          }}
                        >
                          {matched ? 'EŞLEŞTİ' : c.t === 'q' ? 'SORU' : 'CEVAP'}
                        </div>

                        <div
                          style={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            padding: '4px 7px',
                            borderRadius: 999,
                            background: 'rgba(255,255,255,.08)',
                            border: '1px solid rgba(255,255,255,.08)',
                            color: '#fff',
                            fontSize: 9,
                            fontWeight: 900,
                          }}
                        >
                          #{c.p + 1}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            width: '100%',
                            maxWidth: '96%',
                          }}
                        >
                          <div style={{ fontSize: 16, lineHeight: 1, opacity: 0.98 }}>
                            {matched ? '✅' : c.t === 'q' ? '❓' : '💡'}
                          </div>

                          <div
                            className="memory-content-text"
                            style={{
                              color: '#fff',
                              fontSize: 13.5,
                              lineHeight: 1.24,
                              fontWeight: 900,
                              textAlign: 'center',
                              maxWidth: '100%',
                              textShadow: '0 2px 10px rgba(0,0,0,.16)',
                            }}
                          >
                            {c.x}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                position: 'relative',
                zIndex: 1,
                marginTop: 16,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,.06)',
                  border: '1px solid rgba(255,255,255,.08)',
                  color: '#DCEBFF',
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                👀 Açık kartlar: {mfl.length}
              </div>

              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,.06)',
                  border: '1px solid rgba(255,255,255,.08)',
                  color: '#DCEBFF',
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                🎯 Hedef: {totalPairs} eşleşme
              </div>

              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 999,
                  background: 'rgba(108,92,231,.10)',
                  border: '1px solid rgba(108,92,231,.16)',
                  color: '#EEE7FF',
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                📌 En iyi sonuç: az hamle + tam eşleşme
              </div>

              {matches >= 3 && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 999,
                    background: 'rgba(255,107,107,.10)',
                    border: '1px solid rgba(255,107,107,.16)',
                    color: '#FFE1DD',
                    fontSize: 13,
                    fontWeight: 900,
                  }}
                >
                  🔥 Güçlü seri
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
