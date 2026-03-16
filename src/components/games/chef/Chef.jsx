/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react';
import { SFX } from '../../../utils/audio';
import PremiumIntro from '../PremiumIntro';

const LETTERS = ['A', 'B', 'C', 'D'];
const INGREDIENT_ICONS = ['🍅', '🧀', '🥬', '🥕', '🌽', '🍓', '🍫', '🍞'];
const PANTRY_SPARKLES = ['✨', '⭐', '💫', '🫧'];
const STEPS = [
  { label: 'Menü panosu', icon: '📋' },
  { label: 'Malzemeyi seç', icon: '🥄' },
  { label: 'Tabağa ekle', icon: '🍽️' },
  { label: 'Yıldız topla', icon: '🏅' },
];
const RECIPE_BADGES = ['Renkli', 'Taptaze', 'Mini Şef', 'Sürpriz'];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function makeParticles(kind = 'success', count = 22) {
  return Array.from({ length: count }).map((_, index) => ({
    id: `${kind}-${index}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    left: 8 + Math.random() * 84,
    top: 12 + Math.random() * 70,
    dx: -120 + Math.random() * 240,
    dy: -110 + Math.random() * 210,
    size: 10 + Math.random() * 26,
    delay: Math.random() * 0.18,
    color: kind === 'success'
      ? ['#FFE66D', '#FF8BA7', '#4ECDC4', '#F59E0B'][index % 4]
      : ['#FF6B6B', '#FB7185', '#F97316', '#F43F5E'][index % 4],
    emoji: kind === 'success' ? PANTRY_SPARKLES[index % PANTRY_SPARKLES.length] : ['💨', '⚠️', '💥', '🥄'][index % 4],
  }));
}

function StatChip({ label, value, tone = 'rgba(255,255,255,.08)' }) {
  return (
    <div
      style={{
        padding: '12px 14px',
        borderRadius: 18,
        background: tone,
        border: '1px solid rgba(255,255,255,.10)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.07)',
      }}
    >
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 900, color: 'rgba(255,255,255,.62)' }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 16, fontWeight: 900, color: '#fff' }}>{value}</div>
    </div>
  );
}

export default function Chef({ q, qi, gqs, ans, hAns }) {
  const [hovered, setHovered] = useState(null);
  const [fxState, setFxState] = useState('idle');
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    setHovered(null);
    setFxState('idle');
    setParticles([]);
  }, [qi]);

  useEffect(() => {
    if (!q || ans === null) return undefined;

    if (ans === q.a) {
      setFxState('success');
      setParticles(makeParticles('success', 26));
      SFX.successChef?.();
      setTimeout(() => SFX.chefServe?.(), 80);
      setTimeout(() => SFX.sparkle?.(), 150);
      const timeout = setTimeout(() => {
        setFxState('idle');
        setParticles([]);
      }, 1300);
      return () => clearTimeout(timeout);
    }

    setFxState('wrong');
    setParticles(makeParticles('wrong', 16));
    SFX.chefOops?.();
    setTimeout(() => SFX.wrong?.(), 60);
    const timeout = setTimeout(() => {
      setFxState('idle');
      setParticles([]);
    }, 1050);
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
  const chefStars = clamp((qi || 0) + (ans === q?.a ? 2 : ans !== null ? 1 : 0), 0, 12);
  const comboHeat = clamp(18 + ((qi || 0) + (ans === q?.a ? 1 : 0)) * 8, 18, 100);
  const servedCount = clamp((qi || 0) + (ans === q?.a ? 1 : 0), 0, total);

  const plateItems = useMemo(() => {
    const count = clamp((qi || 0) + (ans === q?.a ? 2 : ans !== null ? 1 : 0), 2, 7);
    return Array.from({ length: count }, (_, index) => INGREDIENT_ICONS[index % INGREDIENT_ICONS.length]);
  }, [ans, q, qi]);

  const pantryCards = useMemo(
    () => (q?.o || []).slice(0, 4).map((option, index) => ({
      option,
      icon: INGREDIENT_ICONS[index % INGREDIENT_ICONS.length],
      badge: RECIPE_BADGES[(qi + index) % RECIPE_BADGES.length],
      hint: index === q?.a ? 'Tarifi tamamlayan seçim' : 'Mutfak tezgâhındaki seçenek',
      spice: ['Bol renk', 'Taze dokunuş', 'Çıtır fikir', 'Sürpriz sos'][index % 4],
    })),
    [q, qi]
  );

  if (!q) return null;

  const answerState = ans === null ? 'idle' : ans === q.a ? 'correct' : 'wrong';
  const selectedIcon = ans === null ? '🥘' : pantryCards[ans]?.icon || '🥘';
  const sceneLabel = ans === null ? 'Şef masası hazır' : ans === q.a ? 'Tabak servis edildi' : 'Tarif yeniden deneniyor';

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', animation: 'chefUltraEnter .45s ease' }}>
      <style>{`
        @keyframes chefUltraEnter {
          from { opacity: 0; transform: translateY(18px) scale(.986); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chefFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes chefSteam {
          0% { opacity: .08; transform: translateY(0) scale(.84); }
          55% { opacity: .26; }
          100% { opacity: 0; transform: translateY(-34px) scale(1.28); }
        }
        @keyframes chefIngredientRise {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-6px) scale(1.05); }
        }
        @keyframes chefParticlePop {
          0% { opacity: 1; transform: translate(0,0) scale(.4) rotate(0deg); }
          100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(1.16) rotate(220deg); }
        }
        @keyframes chefWrongShake {
          0%, 100% { transform: translateX(0); }
          18% { transform: translateX(-8px); }
          36% { transform: translateX(7px); }
          54% { transform: translateX(-6px); }
          72% { transform: translateX(5px); }
        }
        @keyframes chefGlowPulse {
          0% { box-shadow: 0 0 0 rgba(255,139,167,0); }
          100% { box-shadow: 0 0 28px rgba(255,139,167,.18); }
        }
        @keyframes chefScan {
          0% { transform: translateX(-40%); opacity: .18; }
          50% { opacity: .55; }
          100% { transform: translateX(130%); opacity: .18; }
        }
        .chef-shell {
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }
        .chef-answer {
          transition: transform .22s ease, box-shadow .22s ease, filter .22s ease, opacity .22s ease;
          cursor: pointer;
        }
        .chef-answer:hover {
          transform: translateY(-4px) scale(1.015);
        }
        .chef-answer:disabled {
          cursor: default;
        }
        .chef-particle {
          position: absolute;
          border-radius: 999px;
          animation: chefParticlePop .92s ease forwards;
          pointer-events: none;
        }
        @media (max-width: 1240px) {
          .chef-main-grid {
            grid-template-columns: 1fr !important;
          }
          .chef-answer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 760px) {
          .chef-answer-grid {
            grid-template-columns: 1fr !important;
          }
          .chef-question-title {
            font-size: 28px !important;
          }
          .chef-kitchen-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <PremiumIntro
        questionKey={qi}
        title='Şef Yarışması'
        subtitle='Lezzetli görev sahnesi'
        mascot='👨‍🍳'
        accent='#FF8BA7'
        accent2='#FFD166'
        onIntro={() => SFX.introChef?.()}
        introLine='Mini Şef diyor ki: siparişi dikkatle oku, doğru malzemeyi seç ve tabağı ışıldat!'
        successLine='Servis zili çaldı! Tabak çocuk şeflerden tam not aldı!'
        failureLine='Bu malzeme tabağa uymadı ama yeni sipariş seni bekliyor.'
        answerState={answerState}
      />

      <div
        className='chef-shell'
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 34,
          padding: 18,
          border: '1px solid rgba(255,255,255,.10)',
          background: 'radial-gradient(circle at top left, rgba(255,139,167,.18), transparent 24%), radial-gradient(circle at top right, rgba(255,209,102,.16), transparent 22%), linear-gradient(180deg, rgba(32,15,30,.95), rgba(18,10,24,.98))',
          boxShadow: '0 28px 70px rgba(0,0,0,.26)',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg, transparent 0%, rgba(255,255,255,.04) 42%, transparent 70%)', transform: 'translateX(-30%)', animation: 'chefScan 5s linear infinite' }} />

        <div
          className='chef-shell'
          style={{
            position: 'relative',
            zIndex: 1,
            borderRadius: 28,
            padding: 22,
            background: 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03))',
            border: '1px solid rgba(255,255,255,.10)',
            animation: 'chefGlowPulse 1.1s ease-in-out infinite alternate',
            boxShadow: '0 16px 34px rgba(0,0,0,.18)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ padding: '8px 12px', borderRadius: 999, background: 'rgba(255,209,102,.18)', color: '#FFE9A8', fontWeight: 900, fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase' }}>Aktif sipariş</span>
              <span style={{ padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,.08)', color: '#fff', fontWeight: 800, fontSize: 12 }}>Soru {current} / {total}</span>
              <span style={{ padding: '8px 12px', borderRadius: 999, background: 'rgba(255,139,167,.16)', color: '#FFD6E5', fontWeight: 800, fontSize: 12 }}>⌨️ A-D / 1-4</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fff', fontWeight: 800 }}>
              <span style={{ fontSize: 18 }}>🍽️</span>
              <span>Bu tur için doğru malzemeyi bul</span>
            </div>
          </div>

          <div className='chef-question-title' style={{ marginTop: 16, fontSize: 34, lineHeight: 1.2, fontWeight: 1000, color: '#fff', letterSpacing: '-0.02em' }}>
            {q.q}
          </div>

          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <StatChip label='Şef yıldızı' value={`${chefStars} ⭐`} tone='rgba(255,209,102,.12)' />
            <StatChip label='Servis edilen tabak' value={`${servedCount}/${total}`} tone='rgba(255,139,167,.12)' />
            <StatChip label='Ocak ısısı' value={`%${comboHeat}`} tone='rgba(78,205,196,.14)' />
            <StatChip label='Sahne durumu' value={sceneLabel} tone='rgba(255,255,255,.08)' />
          </div>
        </div>

        <div className='chef-main-grid' style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1.06fr) minmax(0, .94fr)', gap: 18, marginTop: 18 }}>
          <div className='chef-shell' style={{ position: 'relative', overflow: 'hidden', borderRadius: 30, padding: 20, border: '1px solid rgba(255,255,255,.10)', background: 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03))', boxShadow: '0 18px 42px rgba(0,0,0,.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: '#FFE9A8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.08em' }}>Mini Şef Stüdyosu</div>
                <div style={{ marginTop: 6, fontSize: 30, fontWeight: 1000, color: '#fff' }}>Tarif sahnesi ve servis masası</div>
              </div>
              <div style={{ width: 78, height: 78, borderRadius: 24, background: 'linear-gradient(135deg, rgba(255,139,167,.28), rgba(255,209,102,.24))', display: 'grid', placeItems: 'center', fontSize: 40, boxShadow: '0 16px 28px rgba(255,139,167,.18)' }}>👨‍🍳</div>
            </div>

            <div style={{ height: 12, borderRadius: 999, background: 'rgba(255,255,255,.08)', overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#FF8BA7,#FFD166,#4ECDC4)' }} />
            </div>

            <div className='chef-kitchen-grid' style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 16 }}>
              <div
                style={{
                  position: 'relative',
                  minHeight: 360,
                  borderRadius: 28,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,.10)',
                  background: 'radial-gradient(circle at 18% 18%, rgba(255,255,255,.15), transparent 26%), radial-gradient(circle at 82% 18%, rgba(255,209,102,.16), transparent 24%), linear-gradient(180deg, rgba(83,42,67,.82), rgba(36,20,33,.95))',
                  animation: fxState === 'wrong' ? 'chefWrongShake .5s ease' : 'none',
                }}
              >
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,.04), rgba(0,0,0,.08))' }} />
                <div style={{ position: 'absolute', left: 22, top: 22, padding: '10px 14px', borderRadius: 16, background: 'rgba(0,0,0,.18)', color: '#fff', fontWeight: 900 }}>🎬 {sceneLabel}</div>
                <div style={{ position: 'absolute', right: 20, top: 18, display: 'flex', gap: 10 }}>
                  {[0, 1, 2].map((steam) => (
                    <div
                      key={steam}
                      style={{
                        width: 34,
                        height: 56,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,.18)',
                        filter: 'blur(8px)',
                        animation: `chefSteam ${1.8 + steam * 0.2}s ease-out ${steam * 0.22}s infinite`,
                      }}
                    />
                  ))}
                </div>

                <div style={{ position: 'absolute', left: 24, right: 24, bottom: 34, height: 28, borderRadius: 999, background: 'rgba(0,0,0,.20)' }} />
                <div style={{ position: 'absolute', left: 24, right: 24, bottom: 58, height: 92, borderRadius: 28, background: 'linear-gradient(180deg,#4B2E39,#24131C)', border: '1px solid rgba(255,255,255,.10)' }} />
                <div style={{ position: 'absolute', left: 42, bottom: 118, width: 110, height: 110, borderRadius: '50%', background: 'linear-gradient(180deg,#2F4858,#17212C)', border: '6px solid rgba(255,255,255,.18)', boxShadow: '0 20px 34px rgba(0,0,0,.28)' }}>
                  <div style={{ position: 'absolute', inset: 16, borderRadius: '50%', background: fxState === 'wrong' ? 'radial-gradient(circle, rgba(255,107,107,.78), rgba(245,92,92,.34) 60%, transparent 72%)' : 'radial-gradient(circle, rgba(255,209,102,.72), rgba(255,139,167,.26) 62%, transparent 72%)' }} />
                </div>
                <div style={{ position: 'absolute', left: 70, bottom: 82, width: 76, height: 18, borderRadius: 999, background: 'linear-gradient(90deg,#A78BFA,#60A5FA)', transform: 'rotate(-12deg)' }} />

                <div style={{ position: 'absolute', left: '50%', bottom: 108, transform: 'translateX(-50%)', width: 290, height: 146, borderRadius: '0 0 130px 130px', background: 'linear-gradient(180deg,#FFF7ED,#FDE68A)', border: '7px solid rgba(255,255,255,.34)', boxShadow: '0 24px 40px rgba(0,0,0,.18)' }} />
                <div style={{ position: 'absolute', left: '50%', bottom: 176, transform: 'translateX(-50%)', width: 250, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
                  {plateItems.map((item, index) => (
                    <div key={`${item}-${index}`} style={{ fontSize: 36, animation: `chefIngredientRise ${1.8 + index * 0.08}s ease-in-out infinite` }}>{item}</div>
                  ))}
                </div>
                <div style={{ position: 'absolute', left: '50%', bottom: 224, transform: 'translateX(-50%)', width: 120, height: 120, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 58, background: fxState === 'wrong' ? 'rgba(255,107,107,.14)' : 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.10)' }}>{selectedIcon}</div>

                <div style={{ position: 'absolute', right: 20, bottom: 112, width: 106, height: 136, borderRadius: 24, background: 'linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,.06))', border: '1px solid rgba(255,255,255,.10)', display: 'grid', placeItems: 'center', boxShadow: '0 16px 28px rgba(0,0,0,.12)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 40, animation: 'chefFloat 2.4s ease-in-out infinite' }}>{ans === q.a ? '🏆' : ans !== null ? '🥄' : '📋'}</div>
                    <div style={{ marginTop: 10, fontSize: 12, fontWeight: 900, color: '#fff', letterSpacing: '.08em', textTransform: 'uppercase' }}>Servis kartı</div>
                    <div style={{ marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,.78)' }}>{ans === q.a ? 'Tam isabet' : ans !== null ? 'Yeni deneme' : 'Malzeme bekleniyor'}</div>
                  </div>
                </div>

                {particles.map((particle) => (
                  <div
                    key={particle.id}
                    className='chef-particle'
                    style={{
                      left: `${particle.left}%`,
                      top: `${particle.top}%`,
                      width: particle.size,
                      height: particle.size,
                      background: particle.color,
                      color: '#fff',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: particle.size * 0.7,
                      animationDelay: `${particle.delay}s`,
                      ['--dx']: `${particle.dx}px`,
                      ['--dy']: `${particle.dy}px`,
                    }}
                  >
                    {particle.emoji}
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
                <div style={{ borderRadius: 24, padding: 16, background: 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03))', border: '1px solid rgba(255,255,255,.10)' }}>
                  <div style={{ fontSize: 12, color: '#FFD6E5', fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' }}>Görev akışı</div>
                  <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                    {STEPS.map((step, index) => (
                      <div key={step.label} style={{ display: 'grid', gridTemplateColumns: '48px 1fr', gap: 12, alignItems: 'center', padding: '10px 12px', borderRadius: 18, background: index <= (ans === null ? 1 : ans === q.a ? 3 : 2) ? 'rgba(255,209,102,.12)' : 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
                        <div style={{ width: 48, height: 48, borderRadius: 16, display: 'grid', placeItems: 'center', fontSize: 24, background: 'rgba(255,255,255,.08)' }}>{step.icon}</div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>{step.label}</div>
                          <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,.72)' }}>{index === 1 ? 'Doğru cevabı seçerek tabağı ilerlet.' : index === 2 ? 'Seçim sahnede servis tabağına yansır.' : 'Şef görevi adım adım tamamla.'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ borderRadius: 24, padding: 16, background: 'linear-gradient(180deg, rgba(255,139,167,.10), rgba(255,255,255,.03))', border: '1px solid rgba(255,255,255,.10)' }}>
                  <div style={{ fontSize: 12, color: '#FFE9A8', fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' }}>Mutfak notu</div>
                  <div style={{ marginTop: 10, fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1.35 }}>
                    {ans === null
                      ? 'Soru cümlesi üstte. Şimdi yalnızca doğru malzemeyi seç ve tabağı tamamla.'
                      : ans === q.a
                        ? 'Harika seçim! Doğru malzeme tabağa girdi ve çocuk şef alkışını topladı.'
                        : 'Bu malzeme tarife uymadı. Bir sonraki turda soru paneline bakıp en uygun seçimi yap.'}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 13, color: 'rgba(255,255,255,.74)', lineHeight: 1.6 }}>
                    Çocuk dostu mutfak oyunlarında kısa görevler, büyük görsel malzemeler ve anında sesli-görsel geri bildirim oyunu daha keyifli hale getirir.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='chef-shell' style={{ borderRadius: 30, padding: 18, border: '1px solid rgba(255,255,255,.10)', background: 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03))', boxShadow: '0 18px 42px rgba(0,0,0,.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 12, color: '#FFE9A8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.08em' }}>Malzeme panosu</div>
                <div style={{ marginTop: 6, fontSize: 28, fontWeight: 1000, color: '#fff' }}>Doğru malzemeyi seç</div>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 18, background: 'rgba(78,205,196,.12)', color: '#D8FFFA', fontWeight: 800, fontSize: 13 }}>Klavye açık</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 14 }}>
              <StatChip label='Kısayol' value='A-D / 1-4' tone='rgba(255,255,255,.06)' />
              <StatChip label='Seçim modu' value='Malzeme kartı' tone='rgba(255,209,102,.10)' />
            </div>

            <div className='chef-answer-grid' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {pantryCards.map((card, index) => {
                const correct = ans !== null && index === q.a;
                const selected = ans === index;
                const isIdle = ans === null;
                return (
                  <button
                    key={`${card.option}-${index}`}
                    className='chef-answer'
                    disabled={!isIdle}
                    onClick={() => isIdle && hAns(index)}
                    onMouseEnter={() => setHovered(index)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      minHeight: 208,
                      borderRadius: 26,
                      border: `1px solid ${correct ? 'rgba(46,204,113,.42)' : selected ? 'rgba(255,107,107,.42)' : hovered === index ? 'rgba(255,209,102,.34)' : 'rgba(255,255,255,.10)'}`,
                      background: isIdle
                        ? hovered === index
                          ? 'linear-gradient(180deg, rgba(255,139,167,.20), rgba(255,209,102,.12))'
                          : 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03))'
                        : correct
                          ? 'linear-gradient(180deg, rgba(46,204,113,.30), rgba(46,204,113,.12))'
                          : selected
                            ? 'linear-gradient(180deg, rgba(255,107,107,.28), rgba(255,107,107,.12))'
                            : 'rgba(255,255,255,.035)',
                      color: '#fff',
                      padding: 18,
                      textAlign: 'left',
                      boxShadow: hovered === index && isIdle ? '0 18px 34px rgba(255,139,167,.18)' : '0 12px 24px rgba(0,0,0,.14)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(0,0,0,.16)', display: 'grid', placeItems: 'center', fontWeight: 900 }}>{LETTERS[index]}</div>
                        <div>
                          <div style={{ fontSize: 13, color: '#FFD6E5', fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' }}>{card.badge}</div>
                          <div style={{ marginTop: 6, fontSize: 15, fontWeight: 900, color: '#fff' }}>Tezgâh {index + 1}</div>
                        </div>
                      </div>
                      <div style={{ width: 54, height: 54, borderRadius: 18, display: 'grid', placeItems: 'center', fontSize: 30, background: 'rgba(255,255,255,.08)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08)' }}>{correct ? '🏆' : selected ? '💥' : card.icon}</div>
                    </div>

                    <div style={{ marginTop: 16, fontSize: 24, fontWeight: 1000, lineHeight: 1.28 }}>{card.option}</div>
                    <div style={{ marginTop: 10, fontSize: 13, color: 'rgba(255,255,255,.78)', lineHeight: 1.55 }}>{correct ? 'Tarifi tamamlayan doğru seçim bulundu.' : selected ? 'Bu malzeme tabağın dengesini bozdu.' : card.hint}</div>

                    <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <span style={{ padding: '8px 10px', borderRadius: 999, background: 'rgba(255,255,255,.08)', fontSize: 12, fontWeight: 800 }}>{card.spice}</span>
                      <span style={{ padding: '8px 10px', borderRadius: 999, background: correct ? 'rgba(46,204,113,.18)' : 'rgba(255,209,102,.12)', fontSize: 12, fontWeight: 800 }}>{correct ? 'Doğru tarif' : 'Şef denemesi'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
