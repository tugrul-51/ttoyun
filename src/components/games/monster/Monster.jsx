/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react';
import { SFX } from '../../../utils/audio';
import PremiumIntro from '../PremiumIntro';

const LETTERS = ['A', 'B', 'C', 'D'];
const MONSTERS = ['🦕', '👾', '🐲', '🪼', '🐸', '🦄'];
const RARITIES = ['Neşeli', 'Parlak', 'Nadir', 'Mini', 'Hızlı', 'Efsane'];

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function makeBursts(count, kind = 'good') {
  return Array.from({ length: count }).map((_, index) => ({
    id: `${kind}-${index}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    left: 6 + Math.random() * 88,
    top: 12 + Math.random() * 72,
    dx: -130 + Math.random() * 260,
    dy: -110 + Math.random() * 220,
    size: 10 + Math.random() * 22,
    delay: Math.random() * 0.18,
    hue: kind === 'good'
      ? ['#FFE66D', '#4ECDC4', '#A78BFA', '#F59E0B'][index % 4]
      : ['#FF6B6B', '#FB7185', '#F97316', '#F43F5E'][index % 4],
  }));
}

export default function Monster({ q, qi, gqs, ans, hAns }) {
  const [hovered, setHovered] = useState(null);
  const [celebrate, setCelebrate] = useState(false);
  const [panic, setPanic] = useState(false);
  const [bursts, setBursts] = useState([]);

  useEffect(() => {
    setHovered(null);
    setCelebrate(false);
    setPanic(false);
    setBursts([]);
  }, [qi]);

  useEffect(() => {
    if (!q || ans === null) return;

    if (ans === q.a) {
      setCelebrate(true);
      setBursts(makeBursts(26, 'good'));
      SFX.successMonster?.();
      SFX.sparkle?.();
      const timeout = setTimeout(() => {
        setCelebrate(false);
        setBursts([]);
      }, 1200);
      return () => clearTimeout(timeout);
    }

    setPanic(true);
    setBursts(makeBursts(18, 'bad'));
    SFX.wrong?.();
    setTimeout(() => SFX.explosion?.(), 70);
    const timeout = setTimeout(() => {
      setPanic(false);
      setBursts([]);
    }, 950);
    return () => clearTimeout(timeout);
  }, [ans, q, qi]);

  useEffect(() => {
    if (!q || ans !== null) return undefined;

    const onKeyDown = (event) => {
      if (event.repeat) return;
      const key = event.key.toLowerCase();
      const map = { a: 0, b: 1, c: 2, d: 3, '1': 0, '2': 1, '3': 2, '4': 3 };
      if (Object.prototype.hasOwnProperty.call(map, key) && q.o?.[map[key]] != null) {
        event.preventDefault();
        hAns(map[key]);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [ans, hAns, q]);

  const total = gqs?.length || 1;
  const current = (qi || 0) + 1;
  const progress = clamp((current / total) * 100, 0, 100);
  const capturedCount = clamp(qi + (ans === q?.a ? 1 : 0), 0, total);
  const streakPower = clamp(((capturedCount + 1) / total) * 100, 6, 100);
  const activeMonster = MONSTERS[(q?.a ?? 0) % MONSTERS.length];
  const safeOptions = q?.o?.slice(0, 4) || [];

  const teamCards = useMemo(
    () => MONSTERS.map((monster, index) => ({
      monster,
      label: `Takım ${index + 1}`,
      rarity: RARITIES[index % RARITIES.length],
      pulse: 2 + index * 0.17,
      isTarget: index === (q?.a ?? 0),
    })),
    [q]
  );

  if (!q) return null;

  const selectedMonster = ans !== null ? MONSTERS[ans % MONSTERS.length] : activeMonster;
  const answerState = ans === null ? 'idle' : ans === q.a ? 'correct' : 'wrong';

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', animation: 'monsterUltraEnter .45s ease' }}>
      <style>{`
        @keyframes monsterUltraEnter {
          from { opacity: 0; transform: translateY(18px) scale(.986); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes monsterFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-12px) scale(1.03); }
        }
        @keyframes monsterBeam {
          0% { opacity: 0; transform: scaleY(.4); }
          20% { opacity: 1; }
          100% { opacity: 0; transform: scaleY(1.16); }
        }
        @keyframes monsterScan {
          0% { transform: translateX(-20%); opacity: .2; }
          50% { opacity: .85; }
          100% { transform: translateX(120%); opacity: .2; }
        }
        @keyframes monsterGlow {
          from { filter: brightness(1); }
          to { filter: brightness(1.18); }
        }
        @keyframes monsterShock {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(4px); }
        }
        @keyframes monsterPop {
          0% { opacity: 1; transform: translate(0,0) scale(.45) rotate(0deg); }
          100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(1.2) rotate(240deg); }
        }
        @keyframes monsterQuestionPulse {
          from { box-shadow: 0 0 0 rgba(167,139,250,.0); }
          to { box-shadow: 0 0 32px rgba(167,139,250,.18); }
        }
        .monster-shell {
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }
        .monster-answer {
          transition: transform .22s ease, box-shadow .22s ease, filter .22s ease, opacity .22s ease;
          cursor: pointer;
        }
        .monster-answer:hover {
          transform: translateY(-4px) scale(1.015);
        }
        .monster-answer:disabled {
          cursor: default;
        }
        .monster-particle {
          position: absolute;
          border-radius: 999px;
          animation: monsterPop .9s ease forwards;
          pointer-events: none;
        }
        @media (max-width: 1220px) {
          .monster-main-grid {
            grid-template-columns: 1fr !important;
          }
          .monster-answer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 760px) {
          .monster-answer-grid {
            grid-template-columns: 1fr !important;
          }
          .monster-question-title {
            font-size: 28px !important;
          }
          .monster-capture-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>

      <PremiumIntro
        questionKey={qi}
        title='Canavar Yakalama'
        subtitle='Sevimli yaratık kulübü'
        mascot='👾'
        accent='#A78BFA'
        accent2='#4ECDC4'
        onIntro={() => SFX.introMonster?.()}
        introLine='Kaptan Momo diyor ki: hedef yaratığı bul, doğru ağı fırlat ve kulübüne kat!'
        successLine='Yakalama ışını tuttu! Yeni dost takımına katıldı!'
        failureLine='Bu minik dost kaçtı ama sıradaki görev seni bekliyor.'
        answerState={answerState}
      />

      <div
        className='monster-shell'
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 34,
          padding: 18,
          border: '1px solid rgba(255,255,255,.10)',
          background: 'radial-gradient(circle at top left, rgba(167,139,250,.18), transparent 24%), radial-gradient(circle at top right, rgba(78,205,196,.16), transparent 22%), linear-gradient(180deg, rgba(12,18,44,.94), rgba(8,11,28,.98))',
          boxShadow: '0 28px 70px rgba(0,0,0,.26)',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg, transparent 0%, rgba(255,255,255,.05) 42%, transparent 70%)', transform: 'translateX(-30%)', animation: 'monsterScan 4.6s linear infinite' }} />

        <div
          className='monster-shell'
          style={{
            position: 'relative',
            zIndex: 1,
            marginBottom: 18,
            borderRadius: 28,
            padding: 22,
            border: '1px solid rgba(255,255,255,.12)',
            background: 'linear-gradient(180deg, rgba(255,255,255,.09), rgba(255,255,255,.04))',
            animation: 'monsterQuestionPulse .9s ease-in-out infinite alternate',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 999, background: 'rgba(167,139,250,.16)', color: '#F3E8FF', fontSize: 13, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,.10)' }}>
                🎯 Aktif Görev Sorusu
              </div>
              <div className='monster-question-title' style={{ marginTop: 14, fontSize: 'clamp(32px, 3vw, 44px)', lineHeight: 1.2, fontWeight: 1000, color: '#fff', textShadow: '0 4px 18px rgba(0,0,0,.24)' }}>
                {q.q}
              </div>
              <div style={{ marginTop: 12, color: 'rgba(235,244,255,.86)', fontSize: 16, lineHeight: 1.65, maxWidth: 980 }}>
                Hedef canavarı yakalamak için doğru cevabı seç. Oyuncu soru cümlesini aramasın diye görev metni burada sabit ve en görünür alanda tutuluyor.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(120px,1fr))', gap: 10, minWidth: 260, maxWidth: 360, flex: 1 }}>
              <StatChip label='Tur' value={`${current}/${total}`} tone='rgba(167,139,250,.18)' />
              <StatChip label='Yakalanan' value={`${capturedCount}`} tone='rgba(46,204,113,.18)' />
              <StatChip label='Hedef' value={activeMonster} tone='rgba(78,205,196,.18)' />
              <StatChip label='Kısayol' value='A-D / 1-4' tone='rgba(255,209,102,.16)' />
            </div>
          </div>
        </div>

        <div className='monster-main-grid' style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, .95fr)', gap: 18, alignItems: 'stretch' }}>
          <div
            className='monster-shell'
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 30,
              padding: 20,
              border: '1px solid rgba(255,255,255,.08)',
              background: panic ? 'linear-gradient(180deg, rgba(127,29,29,.42), rgba(9,13,34,.68))' : 'linear-gradient(180deg, rgba(75,0,130,.22), rgba(9,13,34,.20))',
              animation: panic ? 'monsterShock .55s ease' : 'none',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 18%, rgba(167,139,250,.22), transparent 26%), radial-gradient(circle at 82% 16%, rgba(78,205,196,.18), transparent 22%), linear-gradient(180deg, rgba(9,13,34,.1), rgba(9,13,34,.42))' }} />
            {celebrate && (
              <div style={{ position: 'absolute', left: '50%', top: '28%', width: 190, height: 280, transform: 'translateX(-50%)', background: 'linear-gradient(180deg, rgba(255,230,109,.0), rgba(255,230,109,.75), rgba(78,205,196,.0))', filter: 'blur(4px)', transformOrigin: 'center top', animation: 'monsterBeam .9s ease forwards', opacity: .9 }} />
            )}
            {panic && (
              <div style={{ position: 'absolute', inset: '18% 16% auto 16%', height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,107,.38), rgba(255,107,107,0))', filter: 'blur(10px)' }} />
            )}

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#D7CBFF', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.08em' }}>Canavar Laboratuvarı</div>
                  <div style={{ fontSize: 32, fontWeight: 1000, color: '#fff' }}>Hedef yaratığı bul</div>
                </div>
                <div style={{ padding: '10px 14px', borderRadius: 999, background: celebrate ? 'rgba(46,204,113,.18)' : panic ? 'rgba(255,107,107,.18)' : 'rgba(255,255,255,.08)', color: '#F8FBFF', fontWeight: 900, border: '1px solid rgba(255,255,255,.10)' }}>
                  {celebrate ? 'Yakalama başarılı' : panic ? 'Kaçış alarmı' : 'Yakalama turu'}
                </div>
              </div>

              <div style={{ height: 12, borderRadius: 999, background: 'rgba(255,255,255,.08)', overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#A78BFA,#4ECDC4,#FFE66D)', animation: 'monsterGlow 1.4s ease-in-out infinite alternate' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }} className='monster-capture-grid'>
                {teamCards.map((card, index) => {
                  const isCorrectAnswer = ans !== null && index % 4 === q.a % 4;
                  const isWrongSelection = ans !== null && ans === index % 4 && ans !== q.a;
                  const isTarget = card.isTarget;
                  return (
                    <div
                      key={card.label}
                      style={{
                        padding: '16px 12px',
                        borderRadius: 24,
                        position: 'relative',
                        overflow: 'hidden',
                        textAlign: 'center',
                        border: isCorrectAnswer ? '1px solid rgba(46,204,113,.42)' : isWrongSelection ? '1px solid rgba(255,107,107,.36)' : isTarget ? '1px solid rgba(255,209,102,.28)' : '1px solid rgba(255,255,255,.08)',
                        background: isCorrectAnswer ? 'linear-gradient(180deg, rgba(46,204,113,.24), rgba(46,204,113,.10))' : isWrongSelection ? 'linear-gradient(180deg, rgba(255,107,107,.24), rgba(255,107,107,.10))' : isTarget ? 'linear-gradient(180deg, rgba(255,209,102,.14), rgba(255,255,255,.05))' : 'rgba(255,255,255,.06)',
                        boxShadow: isCorrectAnswer ? '0 18px 34px rgba(46,204,113,.18)' : '0 10px 24px rgba(0,0,0,.16)',
                        animation: `monsterFloat ${card.pulse}s ease-in-out infinite`,
                      }}
                    >
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(255,255,255,.10), transparent 45%)' }} />
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, background: 'rgba(0,0,0,.16)', color: '#EAF5FF', fontSize: 11, fontWeight: 900, marginBottom: 10 }}>
                          {card.rarity}
                        </div>
                        <div style={{ fontSize: 52, filter: 'drop-shadow(0 10px 18px rgba(0,0,0,.18))' }}>
                          {isCorrectAnswer ? '✨' : isWrongSelection ? '💨' : card.monster}
                        </div>
                        <div style={{ color: '#fff', fontWeight: 900, marginTop: 10 }}>{card.label}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.76)', marginTop: 4 }}>
                          {isCorrectAnswer ? 'Kulübe katıldı' : isWrongSelection ? 'Kaçtı' : isTarget ? 'Hedef izleniyor' : 'Hazır bekliyor'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 14 }}>
                <div style={{ borderRadius: 22, padding: '16px 18px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.10)' }}>
                  <div style={{ fontSize: 12, color: '#D7CBFF', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.08em' }}>Canavar Rehberi</div>
                  <div style={{ marginTop: 10, fontSize: 17, color: '#fff', lineHeight: 1.65, fontWeight: 700 }}>
                    {ans === null
                      ? `Bugünkü hedef ${activeMonster}. Soruya odaklan, doğru ağı seç ve takımı tamamla.`
                      : ans === q.a
                        ? `${selectedMonster} başarıyla yakalandı. Kutlama ışınları aktif!`
                        : `${selectedMonster} korkup kaçtı. Kırmızı alarmdan sonra yeni bir yaratık deneyeceğiz.`}
                  </div>
                </div>
                <div style={{ borderRadius: 22, padding: '16px 18px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.10)' }}>
                  <div style={{ fontSize: 12, color: '#C9FFF8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.08em' }}>Kulüp Enerjisi</div>
                  <div style={{ marginTop: 10, height: 12, borderRadius: 999, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
                    <div style={{ width: `${streakPower}%`, height: '100%', background: celebrate ? 'linear-gradient(90deg,#2ecc71,#4ECDC4,#FFE66D)' : 'linear-gradient(90deg,#A78BFA,#60A5FA,#4ECDC4)' }} />
                  </div>
                  <div style={{ marginTop: 10, color: '#fff', fontWeight: 900 }}>{Math.round(streakPower)}% yakalama gücü</div>
                </div>
              </div>
            </div>

            {bursts.map((particle) => (
              <span
                key={particle.id}
                className='monster-particle'
                style={{
                  left: `${particle.left}%`,
                  top: `${particle.top}%`,
                  width: particle.size,
                  height: particle.size,
                  background: particle.hue,
                  boxShadow: `0 0 16px ${particle.hue}`,
                  '--dx': `${particle.dx}px`,
                  '--dy': `${particle.dy}px`,
                  animationDelay: `${particle.delay}s`,
                }}
              />
            ))}
          </div>

          <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
            <div className='monster-shell' style={{ borderRadius: 28, padding: 18, border: '1px solid rgba(255,255,255,.08)', background: 'linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#D7CBFF', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.08em' }}>Seçim Panosu</div>
                  <div style={{ color: '#fff', fontSize: 24, fontWeight: 1000 }}>Doğru ağı seç</div>
                </div>
                <div style={{ padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', color: '#F8FBFF', fontWeight: 900 }}>
                  {ans === null ? '4 seçenek aktif' : 'Tur sonucu sabitlendi'}
                </div>
              </div>

              <div className='monster-answer-grid' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {safeOptions.map((option, index) => {
                  const correct = ans !== null && index === q.a;
                  const selected = ans === index;
                  const icon = correct ? '🏆' : selected ? '💥' : MONSTERS[index % MONSTERS.length];
                  return (
                    <button
                      key={`${index}-${option}`}
                      className='monster-answer'
                      onClick={() => ans === null && hAns(index)}
                      onMouseEnter={() => setHovered(index)}
                      onMouseLeave={() => setHovered(null)}
                      disabled={ans !== null}
                      style={{
                        minHeight: 176,
                        borderRadius: 28,
                        border: correct ? '1px solid rgba(46,204,113,.42)' : selected ? '1px solid rgba(255,107,107,.42)' : hovered === index ? '1px solid rgba(255,209,102,.28)' : '1px solid rgba(255,255,255,.10)',
                        background: ans === null
                          ? hovered === index
                            ? 'linear-gradient(180deg, rgba(167,139,250,.22), rgba(78,205,196,.11))'
                            : 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))'
                          : correct
                            ? 'linear-gradient(180deg, rgba(46,204,113,.30), rgba(46,204,113,.12))'
                            : selected
                              ? 'linear-gradient(180deg, rgba(255,107,107,.28), rgba(255,107,107,.12))'
                              : 'rgba(255,255,255,.035)',
                        color: '#fff',
                        padding: 18,
                        textAlign: 'left',
                        boxShadow: hovered === index && ans === null ? '0 18px 34px rgba(167,139,250,.16)' : '0 12px 24px rgba(0,0,0,.14)',
                        opacity: ans !== null && !correct && !selected ? 0.76 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ width: 46, height: 46, minWidth: 46, borderRadius: 16, display: 'grid', placeItems: 'center', background: ans === null ? 'linear-gradient(135deg,#FFD166,#FF9F43)' : 'rgba(0,0,0,.18)', color: ans === null ? '#1B1F2A' : '#fff', fontWeight: 1000, fontSize: 16, border: '1px solid rgba(255,255,255,.10)' }}>
                          {LETTERS[index]}
                        </div>
                        <div style={{ fontSize: 34 }}>{icon}</div>
                      </div>

                      <div style={{ marginTop: 18, fontSize: 22, lineHeight: 1.36, fontWeight: 900 }}>{option}</div>
                      <div style={{ marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,.78)', lineHeight: 1.55 }}>
                        {correct
                          ? 'Doğru ağ hedefi tam tuttu.'
                          : selected
                            ? 'Bu seçim hedef canavarı ürküttü.'
                            : `Kısayol: ${LETTERS[index]} / ${index + 1}`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className='monster-shell' style={{ borderRadius: 28, padding: 18, border: '1px solid rgba(255,255,255,.08)', background: 'linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#C9FFF8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.08em' }}>Mini Koleksiyon</div>
                  <div style={{ color: '#fff', fontSize: 22, fontWeight: 1000 }}>Takıma katılanlar</div>
                </div>
                <div style={{ color: '#EAF5FF', fontWeight: 900 }}>{capturedCount}/{total}</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {Array.from({ length: Math.min(total, 10) }).map((_, index) => {
                  const filled = index < capturedCount;
                  return (
                    <div key={index} style={{ width: 62, height: 62, borderRadius: 20, display: 'grid', placeItems: 'center', background: filled ? 'linear-gradient(135deg,#A78BFA,#4ECDC4)' : 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', boxShadow: filled ? '0 12px 26px rgba(78,205,196,.18)' : 'none', color: '#fff', fontSize: 28 }}>
                      {filled ? MONSTERS[index % MONSTERS.length] : '❔'}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatChip({ label, value, tone }) {
  return (
    <div style={{ borderRadius: 18, padding: '12px 14px', border: '1px solid rgba(255,255,255,.10)', background: `linear-gradient(180deg, ${tone}, rgba(255,255,255,.04))` }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.78)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</div>
      <div style={{ marginTop: 6, color: '#fff', fontSize: 20, fontWeight: 1000 }}>{value}</div>
    </div>
  );
}
