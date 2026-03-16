/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react';
import { SFX } from '../../../utils/audio';
import PremiumIntro from '../PremiumIntro';

const LETTERS = ['A', 'B', 'C', 'D'];
const OPTION_ICONS = ['🦴', '🌿', '🥚', '🪨'];
const OPTION_HINTS = ['İzi takip et', 'Yeşil yolu dene', 'Yuvayı seç', 'Gizli patikaya bak'];
const SKY_GRADIENTS = {
  day: 'linear-gradient(180deg, rgba(72,191,255,.95) 0%, rgba(136,233,255,.78) 42%, rgba(255,244,201,.82) 100%)',
  night: 'linear-gradient(180deg, rgba(24,32,92,.96) 0%, rgba(54,64,133,.82) 48%, rgba(111,88,155,.78) 100%)',
};
const DINO_EMOJIS = ['🦖', '🦕', '🦖', '🦕'];
const NEST_ICONS = ['🥚', '🥚', '🥚', '🥚'];

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export default function Dino({ q, qi, gqs, ans, hAns }) {
  const [hovered, setHovered] = useState(null);
  const [scenePulse, setScenePulse] = useState(false);
  const [trailMode, setTrailMode] = useState('run');
  const [showBurst, setShowBurst] = useState(false);
  const [showDust, setShowDust] = useState(false);
  const [showTracks, setShowTracks] = useState(false);

  const total = gqs?.length || 1;
  const progress = clamp(((qi + 1) / total) * 100, 0, 100);
  const discoveryRate = clamp(((qi + (ans === q?.a ? 1 : 0)) / total) * 100, 0, 100);
  const nightMode = (qi + (ans === q?.a ? 1 : 0)) % 2 === 1;
  const answerState = ans === null ? 'idle' : ans === q?.a ? 'correct' : 'wrong';

  const milestone = useMemo(() => {
    if (progress >= 90) return 'Final yuva bölgesi';
    if (progress >= 60) return 'Volkanik geçit';
    if (progress >= 30) return 'Orman yolu';
    return 'Başlangıç kampı';
  }, [progress]);

  useEffect(() => {
    setHovered(null);
    setScenePulse(false);
    setTrailMode('run');
    setShowBurst(false);
    setShowDust(false);
    setShowTracks(false);
  }, [qi]);

  useEffect(() => {
    if (!q || ans === null) return undefined;

    if (ans === q.a) {
      setTrailMode('jump');
      setScenePulse(true);
      setShowBurst(true);
      setShowTracks(true);
      SFX.dinoLeap?.();
      setTimeout(() => SFX.successDino?.(), 120);
      setTimeout(() => SFX.dinoHatch?.(), 260);

      const timers = [
        setTimeout(() => setScenePulse(false), 900),
        setTimeout(() => setShowBurst(false), 1400),
        setTimeout(() => setShowTracks(false), 1500),
      ];
      return () => timers.forEach(clearTimeout);
    }

    setTrailMode('stumble');
    setShowDust(true);
    SFX.dinoStumble?.();
    setTimeout(() => SFX.wrong?.(), 85);

    const timers = [
      setTimeout(() => setShowDust(false), 1250),
      setTimeout(() => setTrailMode('run'), 1280),
    ];
    return () => timers.forEach(clearTimeout);
  }, [ans, q]);

  useEffect(() => {
    if (!q || ans !== null) return undefined;

    const handler = (event) => {
      const key = event.key.toLowerCase();
      const keyMap = { a: 0, b: 1, c: 2, d: 3, '1': 0, '2': 1, '3': 2, '4': 3 };
      if (Object.prototype.hasOwnProperty.call(keyMap, key)) {
        event.preventDefault();
        hAns?.(keyMap[key]);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [ans, hAns, q]);

  if (!q) return null;

  return (
    <div style={{ maxWidth: 1380, margin: '0 auto', animation: 'dinoEnter .45s ease' }}>
      <style>{`
        @keyframes dinoEnter { from{opacity:0; transform:translateY(16px) scale(.985)} to{opacity:1; transform:translateY(0) scale(1)} }
        @keyframes dinoRun { 0%{transform:translateY(0)} 50%{transform:translateY(-5px)} 100%{transform:translateY(0)} }
        @keyframes dinoJump { 0%{transform:translate(0,0) scale(1) rotate(0deg)} 35%{transform:translate(92px,-64px) scale(1.03) rotate(-6deg)} 70%{transform:translate(148px,-22px) scale(1.02) rotate(4deg)} 100%{transform:translate(170px,-4px) scale(1) rotate(0deg)} }
        @keyframes dinoStumble { 0%{transform:translate(0,0) rotate(0deg)} 20%{transform:translate(10px,10px) rotate(6deg)} 45%{transform:translate(18px,-4px) rotate(-8deg)} 72%{transform:translate(6px,6px) rotate(4deg)} 100%{transform:translate(0,0) rotate(0deg)} }
        @keyframes cloudFloat { from{transform:translateX(0)} to{transform:translateX(-120px)} }
        @keyframes sunPulse { 0%,100%{transform:scale(1); opacity:.96} 50%{transform:scale(1.08); opacity:1} }
        @keyframes starBlink { 0%,100%{opacity:.2; transform:scale(.9)} 50%{opacity:1; transform:scale(1.1)} }
        @keyframes trackMove { from{background-position:0 0} to{background-position:-240px 0} }
        @keyframes fossilSpin { from{transform:rotate(0deg) translateY(0)} to{transform:rotate(360deg) translateY(0)} }
        @keyframes hatchPulse { 0%{transform:scale(.86); opacity:.18} 60%{transform:scale(1.12); opacity:.48} 100%{transform:scale(1.24); opacity:0} }
        @keyframes burstRise { 0%{transform:translateY(18px) scale(.82); opacity:0} 20%{opacity:1} 100%{transform:translateY(-34px) scale(1.18); opacity:0} }
        @keyframes sparkFloat { 0%{transform:translateY(0) scale(.8); opacity:0} 18%{opacity:1} 100%{transform:translateY(-86px) scale(1.28); opacity:0} }
        @keyframes dustBlast { 0%{transform:scale(.76); opacity:0} 30%{opacity:.7} 100%{transform:scale(1.32); opacity:0} }
        @keyframes optionLift { from{transform:translateY(0)} to{transform:translateY(-6px)} }
        @keyframes footprintFlash { 0%,100%{opacity:.22} 50%{opacity:.92} }
        .dino-main-grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(320px,.95fr);gap:18px;align-items:start}
        .dino-option-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .dino-stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .dino-question-card{position:relative;overflow:hidden;border-radius:30px;padding:22px 22px 20px;background:linear-gradient(135deg, rgba(33,197,94,.25), rgba(163,230,53,.16) 48%, rgba(255,236,153,.20));border:1px solid rgba(255,255,255,.16);box-shadow:0 24px 44px rgba(14, 35, 20, .18);margin-bottom:18px}
        @media (max-width: 1160px){
          .dino-main-grid{grid-template-columns:1fr}
        }
        @media (max-width: 720px){
          .dino-option-grid,.dino-stats-grid{grid-template-columns:1fr}
          .dino-question-card{padding:18px}
        }
      `}</style>

      <PremiumIntro
        questionKey={qi}
        title='Dino Koşusu'
        subtitle='Yumurtayı güvenle yuvaya ulaştır'
        mascot='🦖'
        accent='#22C55E'
        accent2='#FACC15'
        onIntro={() => SFX.introDino?.()}
        introLine='Dino rehber hazır: büyük soruyu oku, doğru izi bul ve yumurtayı güvenli yuvaya taşı!'
        successLine='Süper! Dino engeli aştı ve yumurta sevgiyle çatladı!'
        failureLine='Dino küçük bir tökezleme yaşadı ama yeni tur hemen geliyor.'
        answerState={answerState}
      />

      <div className='dino-question-card'>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 12% 18%, rgba(255,255,255,.22), transparent 24%), radial-gradient(circle at 82% 12%, rgba(255,255,255,.14), transparent 18%), linear-gradient(180deg, rgba(255,255,255,.04), transparent 62%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              <span style={{ padding: '8px 12px', borderRadius: 999, background: 'rgba(7,12,28,.16)', color: '#F5FFF7', fontWeight: 1000, letterSpacing: '.05em', textTransform: 'uppercase', fontSize: 12 }}>Aktif soru paneli</span>
              <span style={{ padding: '8px 12px', borderRadius: 999, background: nightMode ? 'rgba(87,97,255,.24)' : 'rgba(255,190,11,.22)', color: '#fff', fontWeight: 900 }}>{nightMode ? '🌙 Gece koşusu' : '☀️ Gündüz koşusu'}</span>
              <span style={{ padding: '8px 12px', borderRadius: 999, background: 'rgba(7,12,28,.14)', color: '#fff', fontWeight: 900 }}>Soru {qi + 1} / {total}</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,.88)', fontWeight: 900, fontSize: 15 }}>Görev: doğru cevabı seç, dino zıplasın</div>
          </div>
          <div style={{ fontSize: 34, lineHeight: 1.2, fontWeight: 1000, color: '#fff', textShadow: '0 4px 14px rgba(0,0,0,.16)' }}>{q.q}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 14 }}>
            <div style={{ padding: '12px 14px', borderRadius: 18, background: 'rgba(7,12,28,.14)', color: 'rgba(255,255,255,.94)', fontWeight: 800 }}>Oyuncu soru cümlesini aramasın diye bu alan sabit ve büyük tutuldu.</div>
            <div style={{ padding: '12px 14px', borderRadius: 18, background: 'rgba(7,12,28,.10)', color: 'rgba(255,255,255,.85)', fontWeight: 800 }}>İpucu: A-D veya 1-4 ile hemen cevap verebilirsin.</div>
          </div>
        </div>
      </div>

      <div className='dino-main-grid'>
        <div style={{ minHeight: 560, padding: 22, borderRadius: 32, background: 'linear-gradient(180deg, rgba(10,16,34,.74), rgba(13,18,34,.92))', border: '1px solid rgba(255,255,255,.10)', position: 'relative', overflow: 'hidden', boxShadow: '0 28px 52px rgba(0,0,0,.24)' }}>
          <div style={{ position: 'absolute', inset: 0, background: SKY_GRADIENTS[nightMode ? 'night' : 'day'] }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,.14), transparent 32%, rgba(10,16,34,.16) 68%, rgba(7,12,28,.46) 100%)' }} />

          {[0, 1, 2].map((i) => (
            <div
              key={`cloud-${i}`}
              style={{
                position: 'absolute',
                top: 48 + i * 42,
                left: 50 + i * 160,
                fontSize: 38 + i * 6,
                opacity: nightMode ? 0.18 : 0.34,
                filter: nightMode ? 'drop-shadow(0 0 10px rgba(255,255,255,.18))' : 'none',
                animation: `cloudFloat ${14 + i * 4}s linear infinite`,
              }}
            >
              ☁️
            </div>
          ))}

          {nightMode && [0, 1, 2, 3, 4, 5].map((i) => (
            <div key={`star-${i}`} style={{ position: 'absolute', top: 36 + i * 28, left: 68 + (i % 3) * 180, fontSize: 12 + (i % 2) * 6, opacity: .7, animation: `starBlink ${1.8 + i * .24}s ease-in-out infinite` }}>✨</div>
          ))}

          <div style={{ position: 'absolute', top: 34, right: 52, width: 74, height: 74, borderRadius: '50%', background: nightMode ? 'radial-gradient(circle, rgba(255,250,220,.98) 0%, rgba(255,231,160,.84) 48%, rgba(255,255,255,.08) 100%)' : 'radial-gradient(circle, rgba(255,248,196,.98) 0%, rgba(255,205,86,.86) 45%, rgba(255,205,86,.08) 100%)', boxShadow: nightMode ? '0 0 42px rgba(255,243,173,.44)' : '0 0 46px rgba(255,191,73,.46)', animation: 'sunPulse 3.6s ease-in-out infinite' }} />

          <div style={{ position: 'absolute', insetInline: 0, bottom: 176, height: 130, background: 'linear-gradient(180deg, rgba(60,118,46,.18), rgba(40,90,36,.44) 65%, rgba(32,78,31,.76) 100%)' }} />
          <div style={{ position: 'absolute', insetInline: 0, bottom: 136, height: 78, background: 'linear-gradient(180deg, rgba(79,127,46,.18), rgba(68,94,34,.74))' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 84, height: 88, background: 'linear-gradient(180deg, rgba(132,88,47,.18), rgba(86,58,27,.94))', backgroundSize: '240px 88px', backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,.06) 0 4%, transparent 4% 16%, rgba(0,0,0,.12) 16% 20%, transparent 20% 100%)', animation: 'trackMove 4.4s linear infinite' }} />

          <div style={{ position: 'absolute', left: 22, right: 22, top: 18, display: 'flex', justifyContent: 'space-between', gap: 12, zIndex: 2 }}>
            <div style={{ padding: '12px 14px', borderRadius: 18, background: 'rgba(7,12,28,.28)', border: '1px solid rgba(255,255,255,.10)', color: '#fff' }}>
              <div style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.74)', fontWeight: 1000 }}>Jurassic koşu sahnesi</div>
              <div style={{ fontSize: 28, fontWeight: 1000 }}>Yuva rotası</div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <div style={{ padding: '10px 12px', borderRadius: 16, background: 'rgba(7,12,28,.26)', color: '#fff', fontWeight: 900 }}>İlerleme %{Math.round(progress)}</div>
              <div style={{ padding: '10px 12px', borderRadius: 16, background: answerState === 'correct' ? 'rgba(34,197,94,.28)' : answerState === 'wrong' ? 'rgba(255,107,107,.24)' : 'rgba(255,255,255,.14)', color: '#fff', fontWeight: 900 }}>
                {answerState === 'idle' ? 'Koşu hazır' : answerState === 'correct' ? 'Zıplama başarılı' : 'Engel teması'}
              </div>
            </div>
          </div>

          <div style={{ position: 'absolute', left: 34, right: 34, bottom: 186, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 2 }}>
            {[0, 1, 2].map((i) => (
              <div key={`hill-${i}`} style={{ width: 180 - i * 24, height: 88 + i * 20, borderRadius: '60% 60% 0 0', background: nightMode ? `rgba(42,56,94,${0.34 + i * .12})` : `rgba(56,114,72,${0.28 + i * .10})`, filter: 'blur(1px)' }} />
            ))}
          </div>

          {[0, 1, 2, 3].map((i) => (
            <div key={`fossil-${i}`} style={{ position: 'absolute', left: 120 + i * 120, bottom: 150 + (i % 2) * 18, fontSize: 26, opacity: i <= qi % 5 ? 0.94 : 0.35, animation: i <= qi % 5 ? `fossilSpin ${6 + i}s linear infinite` : 'none', zIndex: 2 }}>
              {i % 2 === 0 ? '🦴' : '🪨'}
            </div>
          ))}

          <div style={{ position: 'absolute', left: 60, bottom: 108, zIndex: 3, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            {showTracks && [0, 1, 2].map((i) => (
              <div key={`track-${i}`} style={{ fontSize: 18, opacity: .78 - i * .18, transform: `translate(${i * 10}px, ${-i * 4}px)`, animation: `footprintFlash ${.7 + i * .2}s ease-in-out infinite` }}>👣</div>
            ))}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: -18, borderRadius: '50%', background: answerState === 'correct' ? 'radial-gradient(circle, rgba(250,204,21,.34), transparent 70%)' : 'radial-gradient(circle, rgba(255,255,255,.12), transparent 70%)', opacity: scenePulse ? 1 : .6, transform: `scale(${scenePulse ? 1.15 : .9})`, transition: 'all .25s ease' }} />
              <div style={{ fontSize: 96, position: 'relative', zIndex: 2, transform: trailMode === 'jump' ? 'translate(170px,-4px)' : trailMode === 'stumble' ? 'translate(0,0)' : 'translate(0,0)', animation: trailMode === 'jump' ? 'dinoJump .9s cubic-bezier(.2,.8,.25,1) forwards' : trailMode === 'stumble' ? 'dinoStumble .9s ease' : 'dinoRun 1.05s ease-in-out infinite' }}>{ans === q.a ? '🦕' : DINO_EMOJIS[qi % DINO_EMOJIS.length]}</div>
            </div>
          </div>

          <div style={{ position: 'absolute', right: 130, bottom: 116, fontSize: 64, zIndex: 2 }}>{answerState === 'correct' ? '🌈' : '🌿'}</div>
          <div style={{ position: 'absolute', right: 210, bottom: 110, fontSize: 58, zIndex: 2 }}>{answerState === 'wrong' ? '🪨' : '🌵'}</div>
          <div style={{ position: 'absolute', right: 58, bottom: 112, fontSize: 78, zIndex: 2 }}>{answerState === 'correct' ? '🥚' : '🪺'}</div>
          <div style={{ position: 'absolute', right: 242, top: 160, fontSize: 46, zIndex: 2, transform: answerState === 'correct' ? 'translateY(-20px)' : 'translateY(0)', transition: 'transform .35s ease' }}>{answerState === 'correct' ? '🦅' : '🦇'}</div>

          <div style={{ position: 'absolute', right: 34, bottom: 22, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, zIndex: 2 }}>
            {NEST_ICONS.map((egg, index) => {
              const isCorrect = ans === q.a && index === q.a;
              const isSelected = ans !== null && ans === index;
              return (
                <div key={index} style={{ width: 78, height: 94, borderRadius: '48% 48% 42% 42%', background: isCorrect ? 'linear-gradient(180deg, rgba(250,204,21,.36), rgba(255,243,176,.22))' : isSelected ? 'linear-gradient(180deg, rgba(255,107,107,.32), rgba(255,107,107,.14))' : 'linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,.08))', border: `1px solid ${isCorrect ? 'rgba(250,204,21,.62)' : isSelected ? 'rgba(255,122,122,.45)' : 'rgba(255,255,255,.14)'}`, display: 'grid', placeItems: 'center', fontSize: 34, position: 'relative', overflow: 'hidden', boxShadow: isCorrect ? '0 18px 34px rgba(250,204,21,.22)' : '0 14px 26px rgba(0,0,0,.16)' }}>
                  {isCorrect && <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: '2px solid rgba(255,255,255,.36)', animation: 'hatchPulse .9s ease-out infinite' }} />}
                  <div style={{ position: 'absolute', top: 8, left: 8, padding: '4px 7px', borderRadius: 12, background: 'rgba(7,12,28,.18)', color: '#fff', fontSize: 11, fontWeight: 1000 }}>{LETTERS[index]}</div>
                  <div style={{ position: 'relative', zIndex: 1 }}>{isCorrect ? '🦕' : egg}</div>
                </div>
              );
            })}
          </div>

          {showBurst && (
            <>
              <div style={{ position: 'absolute', right: 38, bottom: 112, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,248,173,.58), rgba(250,204,21,.30) 40%, transparent 72%)', animation: 'hatchPulse 1s ease-out 2', zIndex: 3 }} />
              {['✨', '🌟', '💛', '🦕', '🥚', '✨'].map((spark, i) => (
                <div key={`spark-${spark}-${i}`} style={{ position: 'absolute', right: 84 + ((i % 3) - 1) * 26, bottom: 150 + Math.floor(i / 2) * 12, fontSize: 22 + (i % 2) * 6, animation: `sparkFloat ${.8 + i * .15}s ease-out forwards`, animationDelay: `${i * .05}s`, zIndex: 4 }}>{spark}</div>
              ))}
            </>
          )}

          {showDust && (
            <>
              <div style={{ position: 'absolute', left: 76, bottom: 90, width: 110, height: 110, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,122,122,.28), rgba(255,122,122,.10) 42%, transparent 72%)', animation: 'dustBlast .8s ease-out 2', zIndex: 3 }} />
              {['💥', '🪨', '⚠️', '💨'].map((spark, i) => (
                <div key={`dust-${spark}-${i}`} style={{ position: 'absolute', left: 120 + (i * 22), bottom: 150 + ((i % 2) * 14), fontSize: 22 + (i % 2) * 6, animation: `burstRise ${.7 + i * .12}s ease-out forwards`, zIndex: 4 }}>{spark}</div>
              ))}
            </>
          )}

          <div style={{ position: 'absolute', left: 24, right: 24, bottom: 18, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12, zIndex: 2 }}>
            {[
              { label: 'Park bölgesi', value: milestone, icon: '🗺️' },
              { label: 'Yuva güvenliği', value: answerState === 'correct' ? 'Güvenli iniş' : answerState === 'wrong' ? 'Kaya teması' : 'Hazırda', icon: '🪺' },
              { label: 'Dino enerjisi', value: `${72 + ((qi * 7) % 24)}%`, icon: '⚡' },
            ].map((item) => (
              <div key={item.label} style={{ padding: '12px 14px', borderRadius: 18, background: 'rgba(7,12,28,.26)', border: '1px solid rgba(255,255,255,.10)', color: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}><span style={{ fontSize: 18 }}>{item.icon}</span><span style={{ fontSize: 12, color: 'rgba(255,255,255,.72)', fontWeight: 1000, letterSpacing: '.08em', textTransform: 'uppercase' }}>{item.label}</span></div>
                <div style={{ fontSize: 20, fontWeight: 1000, lineHeight: 1.2 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <div style={{ padding: 18, borderRadius: 28, background: 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))', border: '1px solid rgba(255,255,255,.10)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.66)', fontWeight: 1000 }}>Cevap istasyonu</div>
                <div style={{ fontSize: 28, fontWeight: 1000, color: '#fff' }}>Doğru izi seç</div>
              </div>
              <div style={{ fontSize: 38 }}>{nightMode ? '🌙' : '☀️'}</div>
            </div>

            <div className='dino-option-grid'>
              {q.o.map((option, index) => {
                const correct = ans !== null && index === q.a;
                const selected = ans === index;
                const idle = ans === null;
                const hovering = hovered === index && idle;
                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (ans !== null) return;
                      SFX.click?.();
                      hAns(index);
                    }}
                    onMouseEnter={() => setHovered(index)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      minHeight: 176,
                      borderRadius: 28,
                      border: `1px solid ${correct ? 'rgba(34,197,94,.55)' : selected ? 'rgba(255,122,122,.48)' : hovering ? 'rgba(250,204,21,.42)' : 'rgba(255,255,255,.10)'}`,
                      background: idle
                        ? hovering
                          ? 'linear-gradient(180deg, rgba(250,204,21,.22), rgba(34,197,94,.14))'
                          : 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))'
                        : correct
                          ? 'linear-gradient(180deg, rgba(34,197,94,.34), rgba(34,197,94,.12))'
                          : selected
                            ? 'linear-gradient(180deg, rgba(255,107,107,.28), rgba(255,107,107,.12))'
                            : 'rgba(255,255,255,.035)',
                      color: '#fff',
                      padding: 18,
                      textAlign: 'left',
                      cursor: idle ? 'pointer' : 'default',
                      boxShadow: hovering ? '0 20px 36px rgba(250,204,21,.16)' : '0 14px 28px rgba(0,0,0,.14)',
                      transition: 'all .22s ease',
                      transform: hovering ? 'translateY(-4px)' : 'translateY(0)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(7,12,28,.20)', display: 'grid', placeItems: 'center', fontWeight: 1000, fontSize: 18 }}>{LETTERS[index]}</div>
                      <div style={{ fontSize: 30 }}>{correct ? '🦕' : selected ? '💥' : OPTION_ICONS[index] || '✨'}</div>
                    </div>
                    <div style={{ marginTop: 16, fontSize: 22, lineHeight: 1.32, fontWeight: 1000 }}>{option}</div>
                    <div style={{ marginTop: 12, display: 'inline-flex', padding: '8px 10px', borderRadius: 14, background: 'rgba(7,12,28,.18)', color: 'rgba(255,255,255,.82)', fontWeight: 800, fontSize: 13 }}>{correct ? 'Doğru yuva bulundu' : selected ? 'Bu yol kayaya çıktı' : OPTION_HINTS[index]}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className='dino-stats-grid'>
            {[
              { title: 'Keşif ilerlemesi', value: `%${Math.round(discoveryRate)}`, note: 'Her doğru cevapta fosil müzesi doluyor.', icon: '🦴' },
              { title: 'Koşu temposu', value: `${1 + (qi % 4)}. seviye`, note: 'İlerledikçe park daha hareketli oluyor.', icon: '🏃' },
              { title: 'Yumurta hedefi', value: `${1 + ((qi + 2) % 4)} özel yuva`, note: 'Doğru seçenek yuvayı güvene alır.', icon: '🥚' },
              { title: 'Kısayol desteği', value: 'A-D / 1-4', note: 'Masaüstünde hızlı cevap için hazır.', icon: '⌨️' },
            ].map((card) => (
              <div key={card.title} style={{ padding: 16, borderRadius: 24, background: 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))', border: '1px solid rgba(255,255,255,.10)', color: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}><span style={{ fontSize: 22 }}>{card.icon}</span><span style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.68)', fontWeight: 1000 }}>{card.title}</span></div>
                <div style={{ fontSize: 24, lineHeight: 1.15, fontWeight: 1000, marginBottom: 6 }}>{card.value}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,.78)', lineHeight: 1.45 }}>{card.note}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: 18, borderRadius: 26, background: answerState === 'correct' ? 'linear-gradient(180deg, rgba(34,197,94,.24), rgba(34,197,94,.10))' : answerState === 'wrong' ? 'linear-gradient(180deg, rgba(255,107,107,.22), rgba(255,107,107,.10))' : 'linear-gradient(180deg, rgba(250,204,21,.18), rgba(34,197,94,.08))', border: '1px solid rgba(255,255,255,.10)' }}>
            <div style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.68)', fontWeight: 1000, marginBottom: 8 }}>Dino rehber notu</div>
            <div style={{ fontSize: 23, lineHeight: 1.28, fontWeight: 1000, color: '#fff', marginBottom: 8 }}>
              {answerState === 'idle' && 'Büyük soruyu oku, sonra doğru izi seç ve dinoya zıplama gücü ver.'}
              {answerState === 'correct' && 'Harika! Dino kayayı aştı, yumurta çatladı ve parkta yeni bir dost doğdu.'}
              {answerState === 'wrong' && 'Bu yol biraz kayalıktı. Yeni soruda daha güvenli patikayı seçip dinoyu yuvaya taşıyacağız.'}
            </div>
            <div style={{ color: 'rgba(255,255,255,.82)', lineHeight: 1.55 }}>
              Chrome Dino tarzı koşu oyunlarında öne çıkan şey; sürekli akış, engelleri zamanında aşma ve ilerledikçe zorlaşan ama okunabilir bir sahne hissidir. Bu sürümde o akışı, eğitim projesine uygun şekilde cevap seçme mekanizmine bağladım.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
