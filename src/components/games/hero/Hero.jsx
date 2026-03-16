/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react';
import { SFX } from '../../../utils/audio';
import PremiumIntro from '../PremiumIntro';

const LETTERS = ['A', 'B', 'C', 'D'];
const OPTION_ICONS = ['🚁', '🛡️', '⚡', '🌟'];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function Hero({ q, qi, gqs, ans, hAns }) {
  const [hovered, setHovered] = useState(null);
  const [burstState, setBurstState] = useState('idle');
  const [pulseIndex, setPulseIndex] = useState(0);

  useEffect(() => {
    setHovered(null);
    setBurstState('idle');
    setPulseIndex(0);
  }, [qi]);

  useEffect(() => {
    if (!q || ans === null) return undefined;
    if (ans === q.a) {
      setBurstState('success');
      SFX.successHero?.();
      SFX.heroBoost?.();
      SFX.heroRescue?.();
    } else {
      setBurstState('wrong');
      SFX.heroAlert?.();
    }
    const burstTimer = setTimeout(() => setBurstState('settled'), 1200);
    return () => clearTimeout(burstTimer);
  }, [ans, q]);

  useEffect(() => {
    if (ans !== null) return undefined;
    const onKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const byLetter = { a: 0, b: 1, c: 2, d: 3 };
      if (key in byLetter) {
        hAns(byLetter[key]);
      } else if (/^[1-4]$/.test(key)) {
        hAns(Number(key) - 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [ans, hAns]);

  useEffect(() => {
    if (ans !== null) return undefined;
    const interval = setInterval(() => {
      setPulseIndex((current) => (current + 1) % 3);
      SFX.tick?.();
    }, 1600);
    return () => clearInterval(interval);
  }, [ans]);

  const skyline = useMemo(() => [88, 124, 102, 150, 116, 166, 132], []);
  const sparkles = useMemo(
    () => Array.from({ length: 16 }, (_, index) => ({
      id: `spark-${index}`,
      left: 6 + ((index * 6.2) % 88),
      top: 8 + ((index * 5.4) % 72),
      delay: index * 0.08,
      size: 12 + (index % 4) * 8,
    })),
    [],
  );

  if (!q) return null;

  const total = gqs?.length || 1;
  const progress = clamp(((qi + 1) / total) * 100, 0, 100);
  const safeCount = clamp(qi + (ans === q.a ? 1 : 0), 0, total);
  const starCount = clamp((qi % 3) + (ans === q.a ? 1 : 0), 0, 3);
  const heroPosition = ans === null ? { left: 10, bottom: 18 } : ans === q.a ? { left: 69, bottom: 54 } : { left: 36, bottom: 6 };
  const statusText = ans === null
    ? 'Görev açık. Şehirde yardım ışığı yanıyor. En doğru planı seç.'
    : ans === q.a
      ? 'Harika! Kahraman ışık hızıyla ulaştı ve şehir güvene kavuştu.'
      : 'Bu rota işe yaramadı ama alarm merkezi yeni bir görev hazırlıyor.';

  return (
    <div style={{ maxWidth: 1380, margin: '0 auto', animation: 'heroStageEnter .45s ease' }}>
      <style>{`
        @keyframes heroStageEnter { from { opacity: 0; transform: translateY(18px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes heroFloat { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-10px) rotate(-2deg); } }
        @keyframes heroBeacon { 0% { transform: scale(.92); opacity: .36; } 50% { transform: scale(1.06); opacity: .9; } 100% { transform: scale(.92); opacity: .36; } }
        @keyframes heroSparkle { 0% { transform: translateY(0) scale(.8); opacity: 0; } 30% { opacity: 1; } 100% { transform: translateY(-34px) scale(1.22); opacity: 0; } }
        @keyframes heroShake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(7px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
        @keyframes heroGlow { 0%,100% { box-shadow: 0 0 0 rgba(255,255,255,0); } 50% { box-shadow: 0 0 26px rgba(255,230,109,.34); } }
        @keyframes heroOptionPulse { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes heroScan { 0% { transform: translateX(-130%); } 100% { transform: translateX(180%); } }
      `}</style>

      <PremiumIntro
        questionKey={qi}
        title="Kahraman Kurtarma"
        subtitle="Şehir görev merkezi aktif"
        mascot="🦸"
        accent="#60A5FA"
        accent2="#6C5CE7"
        onIntro={() => SFX.introHero?.()}
        introLine="Görev merkezi konuşuyor: doğru planı seç, kahramanımızı yardıma ulaştıralım!"
        successLine="Süper! Kahraman gökyüzünden süzüldü ve görevi yıldızlarla tamamladı!"
        failureLine="Bu plan tutmadı ama şehir seni bir sonraki görev için bekliyor."
        answerState={ans === null ? 'idle' : ans === q.a ? 'correct' : 'wrong'}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.08fr .92fr', gap: 18, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 16 }}>
          <section style={{ position: 'relative', overflow: 'hidden', borderRadius: 32, padding: '24px 24px 22px', background: 'linear-gradient(135deg, rgba(96,165,250,.24), rgba(108,92,231,.20), rgba(14,23,53,.92))', border: '1px solid rgba(255,255,255,.10)', boxShadow: '0 24px 60px rgba(5,10,30,.24)' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(255,255,255,.08), transparent 35%, transparent 65%, rgba(255,255,255,.06))' }} />
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
              {sparkles.map((sparkle) => (
                <span
                  key={sparkle.id}
                  style={{
                    position: 'absolute',
                    left: `${sparkle.left}%`,
                    top: `${sparkle.top}%`,
                    width: sparkle.size,
                    height: sparkle.size,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,.95) 0%, rgba(255,230,109,.55) 35%, transparent 72%)',
                    filter: 'blur(.4px)',
                    opacity: burstState === 'success' ? 1 : 0,
                    animation: burstState === 'success' ? `heroSparkle .9s ease-out ${sparkle.delay}s both` : 'none',
                  }}
                />
              ))}
            </div>

            <div style={{ position: 'relative', display: 'grid', gap: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 74, height: 74, borderRadius: 24, display: 'grid', placeItems: 'center', fontSize: 34, background: 'linear-gradient(135deg,#60A5FA,#6C5CE7)', boxShadow: '0 18px 32px rgba(108,92,231,.30)' }}>🦸</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#CDE6FF', textTransform: 'uppercase', letterSpacing: '.14em' }}>Aktif görev</div>
                    <div style={{ marginTop: 4, fontSize: 'clamp(30px,3.4vw,42px)', fontWeight: 1000, color: '#fff', lineHeight: 1.04 }}>Şehri kurtarma planı</div>
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {['Uçuş görevi', 'Yıldız kurtarma', 'Süper hızlı seçim'].map((chip) => (
                        <span key={chip} style={{ padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,.09)', border: '1px solid rgba(255,255,255,.10)', color: '#fff', fontSize: 13, fontWeight: 800 }}>{chip}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ minWidth: 248, display: 'grid', gap: 10 }}>
                  <div style={{ padding: '12px 14px', borderRadius: 18, background: 'rgba(7,12,28,.28)', border: '1px solid rgba(255,255,255,.10)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, color: '#E8F3FF', fontWeight: 800, fontSize: 13 }}>
                      <span>Görev ilerleme seviyesi</span>
                      <span>{qi + 1}/{total}</span>
                    </div>
                    <div style={{ height: 12, borderRadius: 999, overflow: 'hidden', marginTop: 10, background: 'rgba(255,255,255,.10)' }}>
                      <div style={{ width: `${progress}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#60A5FA,#A78BFA,#FFE66D)', boxShadow: '0 0 24px rgba(255,230,109,.25)' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    <div style={{ padding: '12px 10px', borderRadius: 18, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.10)' }}>
                      <div style={{ color: '#B7D3FF', fontSize: 12, fontWeight: 900, textTransform: 'uppercase' }}>Güvenli bölge</div>
                      <div style={{ marginTop: 4, fontSize: 26, color: '#fff', fontWeight: 1000 }}>{safeCount}</div>
                    </div>
                    <div style={{ padding: '12px 10px', borderRadius: 18, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.10)' }}>
                      <div style={{ color: '#B7D3FF', fontSize: 12, fontWeight: 900, textTransform: 'uppercase' }}>Süper yıldız</div>
                      <div style={{ marginTop: 4, fontSize: 22 }}>{Array.from({ length: 3 }, (_, index) => (index < starCount ? '⭐' : '☆')).join(' ')}</div>
                    </div>
                    <div style={{ padding: '12px 10px', borderRadius: 18, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.10)' }}>
                      <div style={{ color: '#B7D3FF', fontSize: 12, fontWeight: 900, textTransform: 'uppercase' }}>Güç modu</div>
                      <div style={{ marginTop: 4, fontSize: 25 }}>{ans === q.a ? 'MAX' : ans === null ? 'HAZIR' : 'TEKRAR'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 28, padding: '22px 20px 20px', background: 'linear-gradient(180deg, rgba(7,12,28,.16), rgba(7,12,28,.28))', border: '1px solid rgba(255,255,255,.10)' }}>
                <div style={{ position: 'absolute', inset: 0, opacity: .42, pointerEvents: 'none', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.12), transparent)', animation: 'heroScan 7.5s linear infinite' }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, position: 'relative', zIndex: 2 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#CFE1FF', textTransform: 'uppercase', letterSpacing: '.14em' }}>Şimdi cevaplanacak soru</div>
                    <div style={{ marginTop: 8, fontSize: 'clamp(28px,3vw,40px)', fontWeight: 1000, color: '#fff', lineHeight: 1.14, textShadow: '0 4px 24px rgba(0,0,0,.24)' }}>{q.q}</div>
                  </div>
                  <div style={{ minWidth: 132, padding: '12px 14px', borderRadius: 18, background: ans === q.a ? 'rgba(46,204,113,.20)' : ans !== null ? 'rgba(255,107,107,.18)' : 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.10)' }}>
                    <div style={{ fontSize: 12, color: '#D5E6FF', fontWeight: 900, textTransform: 'uppercase' }}>Görev durumu</div>
                    <div style={{ marginTop: 8, fontSize: 24, fontWeight: 1000, color: '#fff' }}>{ans === null ? 'Hazır' : ans === q.a ? 'Tamam' : 'Alarm'}</div>
                  </div>
                </div>
                <div style={{ marginTop: 16, padding: '16px 18px', borderRadius: 22, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.10)', color: '#DCEBFF', fontSize: 16, lineHeight: 1.6, position: 'relative', zIndex: 2 }}>
                  {statusText}
                </div>
              </div>
            </div>
          </section>

          <section style={{ position: 'relative', overflow: 'hidden', minHeight: 520, padding: 22, borderRadius: 32, background: 'linear-gradient(180deg, rgba(96,165,250,.18), rgba(12,18,36,.94) 58%)', border: '1px solid rgba(255,255,255,.10)', boxShadow: burstState === 'wrong' ? '0 24px 60px rgba(255,107,107,.20)' : '0 24px 60px rgba(7,12,28,.26)', animation: burstState === 'wrong' ? 'heroShake .45s ease' : 'none' }}>
            <div style={{ position: 'absolute', inset: 0, background: burstState === 'success' ? 'radial-gradient(circle at 72% 34%, rgba(255,230,109,.22), transparent 28%), radial-gradient(circle at 68% 56%, rgba(46,204,113,.20), transparent 22%)' : burstState === 'wrong' ? 'radial-gradient(circle at 52% 44%, rgba(255,107,107,.18), transparent 30%)' : 'radial-gradient(circle at 80% 14%, rgba(255,255,255,.08), transparent 22%)' }} />
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 172, background: 'linear-gradient(180deg, rgba(44,80,160,.08), rgba(9,16,34,.72))' }} />
            <div style={{ position: 'absolute', insetInline: 0, bottom: 0, paddingInline: 18, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
              {skyline.map((height, index) => (
                <div key={height} style={{ position: 'relative', flex: 1, height, borderRadius: '20px 20px 0 0', background: index % 2 === 0 ? 'linear-gradient(180deg, rgba(20,34,70,.88), rgba(10,18,34,.98))' : 'linear-gradient(180deg, rgba(33,54,101,.88), rgba(12,18,34,.98))', border: '1px solid rgba(255,255,255,.06)' }}>
                  <div style={{ position: 'absolute', inset: 12, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, opacity: .5 }}>
                    {Array.from({ length: 6 }, (_, lightIndex) => (
                      <span key={lightIndex} style={{ height: 14, borderRadius: 4, background: (lightIndex + index + pulseIndex) % 3 === 0 ? 'rgba(255,230,109,.80)' : 'rgba(255,255,255,.12)', boxShadow: (lightIndex + index + pulseIndex) % 3 === 0 ? '0 0 12px rgba(255,230,109,.35)' : 'none' }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ position: 'absolute', left: '12%', bottom: '26%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 999, background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.10)' }}>
              <span style={{ fontSize: 18 }}>📡</span>
              <span style={{ color: '#E4F0FF', fontWeight: 800, fontSize: 14 }}>Merkez üs</span>
            </div>
            <div style={{ position: 'absolute', right: '11%', top: '14%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 999, background: ans === q.a ? 'rgba(46,204,113,.18)' : 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.10)', animation: ans === null ? 'heroGlow 2s ease-in-out infinite' : 'none' }}>
              <span style={{ fontSize: 18 }}>🚨</span>
              <span style={{ color: '#E4F0FF', fontWeight: 800, fontSize: 14 }}>Yardım noktası</span>
            </div>

            <div style={{ position: 'absolute', left: '18%', top: '18%', width: 72, height: 72, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,.95), rgba(255,255,255,.15) 58%, transparent 72%)', filter: 'blur(2px)' }} />
            <div style={{ position: 'absolute', right: '14%', top: '30%', width: 120, height: 120, borderRadius: '50%', background: burstState === 'success' ? 'radial-gradient(circle, rgba(255,230,109,.36), transparent 70%)' : 'radial-gradient(circle, rgba(255,255,255,.12), transparent 72%)', animation: ans === null ? 'heroBeacon 2.3s ease-in-out infinite' : 'none' }} />
            <div style={{ position: 'absolute', right: '14%', top: '30%', width: 120, height: 120, borderRadius: '50%', border: '2px solid rgba(255,255,255,.14)', opacity: ans === null ? .8 : 0, animation: 'heroBeacon 2.3s ease-in-out infinite' }} />

            <div style={{ position: 'absolute', left: '17%', bottom: '32%', width: '51%', height: 8, borderRadius: 999, background: 'linear-gradient(90deg, rgba(255,255,255,.06), rgba(96,165,250,.18), rgba(255,255,255,.06))' }} />
            <div style={{ position: 'absolute', left: '17%', bottom: '31.6%', width: ans === q.a ? '52%' : ans !== null ? '26%' : '20%', height: 12, borderRadius: 999, background: ans === q.a ? 'linear-gradient(90deg, rgba(96,165,250,.70), rgba(255,230,109,.96))' : ans !== null ? 'linear-gradient(90deg, rgba(255,107,107,.72), rgba(255,159,67,.82))' : 'linear-gradient(90deg, rgba(96,165,250,.65), rgba(167,139,250,.82))', boxShadow: ans !== null ? '0 0 28px rgba(255,255,255,.14)' : '0 0 20px rgba(96,165,250,.18)', transition: 'all .65s ease' }} />

            <div style={{ position: 'absolute', left: `${heroPosition.left}%`, bottom: `${heroPosition.bottom}%`, width: 110, height: 110, borderRadius: 32, display: 'grid', placeItems: 'center', fontSize: 56, background: ans === q.a ? 'linear-gradient(135deg,#60A5FA,#6C5CE7,#FFE66D)' : ans !== null ? 'linear-gradient(135deg,#FB7185,#F97316)' : 'linear-gradient(135deg,#60A5FA,#6C5CE7)', boxShadow: ans === q.a ? '0 26px 44px rgba(255,230,109,.28)' : '0 24px 40px rgba(108,92,231,.28)', animation: 'heroFloat 2.8s ease-in-out infinite', transition: 'all .7s ease' }}>
              {ans === q.a ? '🦸‍♂️' : ans !== null ? '🪂' : '🦸'}
            </div>

            <div style={{ position: 'absolute', right: 28, bottom: 26, width: 154, padding: '14px 14px 16px', borderRadius: 24, background: 'rgba(7,12,28,.36)', border: '1px solid rgba(255,255,255,.10)', backdropFilter: 'blur(6px)' }}>
              <div style={{ fontSize: 12, color: '#D8E9FF', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.12em' }}>Görev merkezi</div>
              <div style={{ marginTop: 8, display: 'grid', gap: 10 }}>
                {[
                  { icon: '🚑', label: 'Vatandaşlar', state: ans === q.a ? 'Güvende' : 'Bekliyor' },
                  { icon: '⭐', label: 'Yıldız puanı', state: `${starCount}/3` },
                  { icon: '⚡', label: 'Turbo gücü', state: ans === q.a ? 'Tam dolu' : ans !== null ? 'Şarj oluyor' : 'Hazır' },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, color: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}><span style={{ fontSize: 18 }}>{item.icon}</span>{item.label}</div>
                    <div style={{ color: '#D0E2FF', fontSize: 13, fontWeight: 900 }}>{item.state}</div>
                  </div>
                ))}
              </div>
            </div>

            {burstState === 'success' && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', right: '8%', top: '8%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,230,109,.35), transparent 66%)' }} />
                <div style={{ position: 'absolute', left: '55%', top: '16%', padding: '14px 18px', borderRadius: 999, background: 'rgba(46,204,113,.18)', border: '1px solid rgba(255,255,255,.14)', color: '#fff', fontWeight: 1000, boxShadow: '0 18px 40px rgba(46,204,113,.18)' }}>Kurtarma tamamlandı! ⭐⭐⭐</div>
              </div>
            )}
            {burstState === 'wrong' && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', left: '42%', top: '22%', width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,107,.30), transparent 66%)' }} />
                <div style={{ position: 'absolute', left: '50%', top: '14%', padding: '14px 18px', borderRadius: 999, background: 'rgba(255,107,107,.18)', border: '1px solid rgba(255,255,255,.14)', color: '#fff', fontWeight: 1000 }}>Alarm! Yeni rota gerekli</div>
              </div>
            )}
          </section>
        </div>

        <aside style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <section style={{ padding: 18, borderRadius: 28, background: 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))', border: '1px solid rgba(255,255,255,.10)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: '#CFE1FF', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.14em' }}>Görev planları</div>
                <div style={{ marginTop: 4, fontSize: 28, color: '#fff', fontWeight: 1000 }}>En doğru rotayı seç</div>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 18, background: 'rgba(255,255,255,.08)', color: '#fff', fontWeight: 900 }}>A-D / 1-4</div>
            </div>
            <div style={{ marginTop: 12, color: '#D5E7FF', lineHeight: 1.55, fontSize: 15 }}>
              Her plan kahramanı farklı bir rotaya götürür. Doğru seçimi yaparsan şehir yıldızlarla aydınlanır.
            </div>
          </section>

          <div style={{ display: 'grid', gap: 14 }}>
            {q.o.map((option, index) => {
              const correct = ans !== null && index === q.a;
              const selected = ans === index;
              const idle = ans === null;
              const active = hovered === index;
              const bg = idle
                ? active
                  ? 'linear-gradient(135deg, rgba(96,165,250,.28), rgba(108,92,231,.18))'
                  : 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))'
                : correct
                  ? 'linear-gradient(180deg, rgba(46,204,113,.30), rgba(46,204,113,.12))'
                  : selected
                    ? 'linear-gradient(180deg, rgba(255,107,107,.26), rgba(255,107,107,.12))'
                    : 'rgba(255,255,255,.04)';

              return (
                <button
                  key={index}
                  onClick={() => idle && hAns(index)}
                  onMouseEnter={() => setHovered(index)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: 146,
                    borderRadius: 28,
                    border: `1px solid ${correct ? 'rgba(46,204,113,.40)' : selected ? 'rgba(255,107,107,.36)' : 'rgba(255,255,255,.10)'}`,
                    background: bg,
                    color: '#fff',
                    cursor: idle ? 'pointer' : 'default',
                    padding: '18px 18px 18px 20px',
                    textAlign: 'left',
                    boxShadow: active && idle ? '0 22px 38px rgba(96,165,250,.18)' : '0 14px 28px rgba(0,0,0,.14)',
                    transform: active && idle ? 'translateY(-3px)' : 'translateY(0)',
                    transition: 'all .22s ease',
                    animation: correct ? 'heroOptionPulse .5s ease 1' : 'none',
                  }}
                >
                  <div style={{ position: 'absolute', inset: 0, opacity: idle ? .8 : .45, background: 'linear-gradient(120deg, rgba(255,255,255,.08), transparent 38%, transparent 62%, rgba(255,255,255,.06))' }} />
                  <div style={{ position: 'relative', display: 'grid', gap: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 56, height: 56, borderRadius: 18, display: 'grid', placeItems: 'center', background: 'rgba(7,12,28,.18)', fontSize: 22, fontWeight: 1000, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.08)' }}>{LETTERS[index]}</div>
                      <div style={{ fontSize: 34 }}>{correct ? '🏆' : selected ? '💥' : OPTION_ICONS[index]}</div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.35 }}>{option}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                      <div style={{ color: 'rgba(255,255,255,.82)', fontSize: 13, fontWeight: 800 }}>
                        {correct ? 'Şehri kurtaran karar' : selected ? 'Bu plan bu görev için uygun değildi' : 'Bu planı seçebilirsin'}
                      </div>
                      <div style={{ padding: '8px 10px', borderRadius: 999, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.08)', fontSize: 12, fontWeight: 900, color: '#DDEBFF' }}>
                        {index + 1}. rota
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
