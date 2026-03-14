/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { SFX } from '../../../utils/audio';
import PremiumIntro from '../PremiumIntro';

const LETTERS = ['A', 'B', 'C', 'D'];
const CHESTS = ['🧰', '💎', '🪙', '🗝️', '📜', '🏺'];

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

export default function Treasure({ q, qi, gqs, ans, hAns }) {
  const [hovered, setHovered] = useState(null);
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => { setHovered(null); setSparkles([]); }, [qi]);
  useEffect(() => {
    if (!q || ans === null) return;
    if (ans === q.a) {
      setSparkles(Array.from({ length: 14 }, (_, i) => ({ id: `${qi}-${i}`, left: 12 + Math.random() * 76, top: 20 + Math.random() * 48, dx: -50 + Math.random() * 100, dy: -30 + Math.random() * 70 })));
      SFX.successTreasure?.();
      const t = setTimeout(() => setSparkles([]), 1000);
      return () => clearTimeout(t);
    }
  }, [ans, q, qi]);

  if (!q) return null;

  const total = gqs?.length || 1;
  const progress = clamp(((qi + 1) / total) * 100, 0, 100);
  const treasureProgress = clamp((qi / Math.max(1, total - 1)) * 100, 0, 100);
  const status = ans === null ? 'Haritayı takip et ve doğru ipucuyla sandığa ulaş.' : ans === q.a ? 'Harika! Yeni bir hazine parçası buldun.' : 'Bu ipucu yanıltıcıydı, sonraki adımda yeniden dene.';

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', animation: 'treasureEnter .45s ease' }}>
      <style>{`
        @keyframes treasureEnter { from {opacity:0; transform: translateY(16px) scale(.985);} to {opacity:1; transform: translateY(0) scale(1);} }
        @keyframes treasureFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes treasureSpark { from { opacity:1; transform:translate(0,0) scale(.4) rotate(0deg);} to { opacity:0; transform:translate(var(--dx), var(--dy)) scale(1.2) rotate(220deg);} }
        @keyframes treasureWave { from { background-position:0% 50%; } to { background-position:100% 50%; } }
      `}</style>
      <PremiumIntro
        questionKey={qi}
        title='Hazine Avı'
        subtitle='Parlayan sandık görevi'
        mascot='🧭'
        accent='#F59E0B'
        accent2='#FFE66D'
        onIntro={() => SFX.introTreasure?.()}
        introLine='Kaptan Pusula diyor ki: doğru ipucunu bul, sandığı birlikte açalım!'
        successLine='Altın kıvılcımlar geldi, sandık açılıyor!'
        failureLine='Bu rota çıkmaz sokak oldu ama yeni ipucu seni bekliyor.'
        answerState={ans === null ? 'idle' : ans === q.a ? 'correct' : 'wrong'}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1.08fr .92fr', gap: 18 }}>
        <div style={{ padding: 22, borderRadius: 28, background: 'linear-gradient(180deg, rgba(255,230,160,.16), rgba(107,79,26,.14))', border: '1px solid rgba(255,255,255,.10)', position: 'relative', overflow: 'hidden', minHeight: 480 }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 10% 10%, rgba(255,255,255,.18), transparent 28%), radial-gradient(circle at 90% 18%, rgba(255,209,102,.22), transparent 30%), linear-gradient(135deg, rgba(120,84,32,.10), rgba(255,232,163,.04))' }} />
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', gap:12, alignItems:'center', marginBottom:14 }}>
              <div>
                <div style={{ fontSize:12, fontWeight:900, color:'#FFE8A3', letterSpacing:'.08em', textTransform:'uppercase' }}>Hazine Avı</div>
                <div style={{ fontSize:30, fontWeight:1000, color:'#fff' }}>Kayıp sandığın izi</div>
              </div>
              <div style={{ padding:'10px 14px', borderRadius:999, background:'rgba(0,0,0,.16)', color:'#FFF4D6', fontWeight:900 }}>Adım {(qi || 0) + 1} / {total}</div>
            </div>
            <div style={{ height:12, borderRadius:999, background:'rgba(255,255,255,.08)', overflow:'hidden', marginBottom:20 }}><div style={{ width:`${progress}%`, height:'100%', background:'linear-gradient(90deg,#FFD166,#F59E0B,#FFF1A8)', backgroundSize:'200% 100%', animation:'treasureWave 2.4s linear infinite' }} /></div>
            <div style={{ position:'relative', minHeight:250, borderRadius:24, background:'linear-gradient(180deg, rgba(92,55,18,.24), rgba(37,24,9,.22))', border:'1px solid rgba(255,255,255,.08)', overflow:'hidden', marginBottom:18 }}>
              <div style={{ position:'absolute', left:'8%', top:'20%', width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,.10)', filter:'blur(16px)' }} />
              <div style={{ position:'absolute', inset:'24px 26px 20px', borderRadius:22, background:'linear-gradient(135deg,#D8B46A,#8B5E34)', boxShadow:'inset 0 0 0 4px rgba(255,255,255,.12)' }}>
                <svg viewBox='0 0 800 420' style={{ width:'100%', height:'100%' }}>
                  <path d='M80 300 C170 270, 210 220, 270 225 S390 320, 470 250 S610 130, 720 150' fill='none' stroke='rgba(82,50,22,.65)' strokeWidth='18' strokeDasharray='14 18' strokeLinecap='round'/>
                  {[12,28,42,58,72].map((left, i) => <circle key={i} cx={80 + i * 140} cy={300 - i * 26} r='18' fill='rgba(255,245,200,.35)' />)}
                </svg>
              </div>
              <div style={{ position:'absolute', left:`calc(${treasureProgress}% - 28px)`, bottom:'84px', width:58, height:58, borderRadius:18, display:'grid', placeItems:'center', fontSize:30, background:'linear-gradient(135deg,#fff6cc,#f59e0b)', boxShadow:'0 16px 30px rgba(245,158,11,.26)', animation:'treasureFloat 2.6s ease-in-out infinite' }}>🧭</div>
              <div style={{ position:'absolute', right:'9%', top:'18%', width:88, height:88, borderRadius:24, display:'grid', placeItems:'center', fontSize:42, background: ans === q.a ? 'linear-gradient(135deg,#FFE66D,#F59E0B)' : 'linear-gradient(135deg,#8C6239,#5B3C22)', boxShadow: ans === q.a ? '0 18px 32px rgba(245,158,11,.34)' : '0 14px 24px rgba(0,0,0,.24)' }}>{ans === q.a ? '💰' : '🪙'}</div>
              {sparkles.map((s) => <div key={s.id} style={{ position:'absolute', left:`${s.left}%`, top:`${s.top}%`, width:14, height:14, borderRadius:999, background:'rgba(255,241,168,.95)', boxShadow:'0 0 18px rgba(255,214,102,.85)', ['--dx']: `${s.dx}px`, ['--dy']: `${s.dy}px`, animation:'treasureSpark .95s ease-out forwards' }} />)}
            </div>
            <div style={{ padding:'16px 18px', borderRadius:20, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.10)', color:'#FFF6E8', fontWeight:700, lineHeight:1.55 }}>
              <div style={{ fontSize:14, color:'#FFE5A5', fontWeight:900, marginBottom:8 }}>Harita notu</div>
              <div style={{ fontSize:26, fontWeight:900, lineHeight:1.22, marginBottom:10 }}>{q.q}</div>
              <div style={{ color:'rgba(255,248,231,.86)' }}>{status}</div>
            </div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateRows:'auto 1fr', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {CHESTS.map((chest, i) => <div key={i} style={{ padding:'14px 10px', borderRadius:20, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.08)', textAlign:'center', color:'#FFF2D3' }}><div style={{ fontSize:28 }}>{chest}</div><div style={{ fontSize:12, fontWeight:800, marginTop:6 }}>İpucu {i + 1}</div></div>)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, alignContent:'start' }}>
            {q.o.map((option, index) => {
              const correct = index === q.a;
              const selected = ans === index;
              const idle = ans === null;
              const background = idle
                ? hovered === index ? 'linear-gradient(180deg, rgba(255,209,102,.26), rgba(245,158,11,.14))' : 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))'
                : correct ? 'linear-gradient(180deg, rgba(46,204,113,.34), rgba(46,204,113,.14))' : selected ? 'linear-gradient(180deg, rgba(255,107,107,.34), rgba(255,107,107,.14))' : 'rgba(255,255,255,.035)';
              return (
                <button key={index} onClick={() => ans === null && hAns(index)} onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)} style={{ minHeight:150, borderRadius:24, border:`1px solid ${correct && ans !== null ? 'rgba(46,204,113,.44)' : selected ? 'rgba(255,107,107,.44)' : 'rgba(255,255,255,.10)'}`, background, color:'#fff', cursor: ans === null ? 'pointer' : 'default', padding:'18px 18px', textAlign:'left', boxShadow: hovered === index && idle ? '0 16px 34px rgba(245,158,11,.18)' : '0 12px 26px rgba(0,0,0,.16)', transition:'all .22s ease' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', gap:10 }}><div style={{ width:42, height:42, borderRadius:14, display:'grid', placeItems:'center', background:'rgba(0,0,0,.16)', fontWeight:900 }}>{LETTERS[index]}</div><div style={{ fontSize:26 }}>{correct && ans !== null ? '🗝️' : selected ? '❌' : '🧩'}</div></div>
                  <div style={{ fontSize:21, fontWeight:900, lineHeight:1.35, marginTop:18 }}>{option}</div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,.78)', marginTop:10 }}>{idle ? 'Bu ipucunu seç' : correct ? 'Doğru rota bulundu' : selected ? 'Bu rota çıkmaz sokak' : 'Diğer ipucu'}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
