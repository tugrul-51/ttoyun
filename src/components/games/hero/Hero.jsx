/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { SFX } from '../../../utils/audio';
import PremiumIntro from '../PremiumIntro';

const LETTERS = ['A','B','C','D'];
function clamp(v,min,max){return Math.max(min,Math.min(max,v));}

export default function Hero({ q, qi, gqs, ans, hAns }) {
  const [hovered, setHovered] = useState(null);
  const [flash, setFlash] = useState(false);
  useEffect(() => { setHovered(null); setFlash(false); }, [qi]);
  useEffect(() => {
    if (!q || ans === null) return;
    if (ans === q.a) {
      setFlash(true); SFX.successHero?.();
      const t = setTimeout(() => setFlash(false), 900);
      return () => clearTimeout(t);
    }
  }, [ans, q]);
  if (!q) return null;
  const total = gqs?.length || 1;
  const progress = clamp(((qi + 1) / total) * 100, 0, 100);
  const heroLeft = ans === null ? 16 : ans === q.a ? 68 : 36;
  const heroBottom = ans === null ? 28 : ans === q.a ? 58 : 6;
  return (
    <div style={{ maxWidth:1320, margin:'0 auto', animation:'heroEnter .45s ease' }}>
      <style>{`
        @keyframes heroEnter { from{opacity:0; transform:translateY(16px) scale(.985)} to{opacity:1; transform:translateY(0) scale(1)} }
        @keyframes heroPulse { from{transform:scale(1)} to{transform:scale(1.05)} }
        @keyframes heroFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      `}</style>
      <PremiumIntro
        questionKey={qi}
        title='Süper Kahraman'
        subtitle='Şehir kurtarma çağrısı'
        mascot='🦸'
        accent='#60A5FA'
        accent2='#6C5CE7'
        onIntro={() => SFX.introHero?.()}
        introLine='Kaptan Işık diyor ki: doğru planı seç, şehri birlikte kurtaralım!'
        successLine='Kahraman süzülerek ulaştı, görev tertemiz tamamlandı!'
        failureLine='Bu rota biraz saptı ama yeni görev ışıkları yanıyor.'
        answerState={ans === null ? 'idle' : ans === q.a ? 'correct' : 'wrong'}
      />
      <div style={{ display:'grid', gridTemplateColumns:'1.02fr .98fr', gap:18 }}>
        <div style={{ minHeight:500, padding:22, borderRadius:30, background:'linear-gradient(180deg, rgba(96,165,250,.16), rgba(108,92,231,.16))', border:'1px solid rgba(255,255,255,.10)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(125,211,252,.12), rgba(7,12,28,.16))' }} />
          <div style={{ position:'absolute', left:0, right:0, bottom:0, height:160, background:'linear-gradient(180deg, rgba(37,99,235,.10), rgba(20,31,77,.42))' }} />
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, marginBottom:14 }}><div><div style={{ fontSize:12, fontWeight:900, color:'#B8D8FF', textTransform:'uppercase', letterSpacing:'.08em' }}>Süper Kahraman</div><div style={{ fontSize:30, fontWeight:1000, color:'#fff' }}>Şehir kurtarma görevi</div></div><div style={{ fontSize:42 }}>🦸</div></div>
            <div style={{ height:12, borderRadius:999, background:'rgba(255,255,255,.08)', overflow:'hidden', marginBottom:18 }}><div style={{ width:`${progress}%`, height:'100%', background:'linear-gradient(90deg,#60A5FA,#6C5CE7,#FFE66D)' }} /></div>
            <div style={{ minHeight:310, borderRadius:26, background:'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03))', border:'1px solid rgba(255,255,255,.10)', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', left:22, bottom:20, display:'flex', gap:12, alignItems:'end' }}>{[90,130,110,160,124].map((h,i) => <div key={i} style={{ width:58, height:h, borderRadius:'14px 14px 0 0', background: i % 2 ? 'rgba(15,23,42,.76)' : 'rgba(30,41,59,.74)', border:'1px solid rgba(255,255,255,.06)' }} />)}</div>
              <div style={{ position:'absolute', right:26, top:32, width:84, height:84, borderRadius:'50%', background: flash ? 'rgba(255,230,109,.32)' : 'rgba(255,255,255,.10)', filter:'blur(4px)' }} />
              <div style={{ position:'absolute', left:`${heroLeft}%`, bottom:`${heroBottom}%`, width:84, height:84, borderRadius:26, display:'grid', placeItems:'center', fontSize:44, background:'linear-gradient(135deg,#60A5FA,#6C5CE7)', boxShadow:'0 18px 34px rgba(108,92,231,.28)', animation:'heroFloat 2.6s ease-in-out infinite', transition:'all .6s ease' }}>{ans === q.a ? '🦸‍♂️' : ans !== null ? '🪂' : '🦸'}</div>
              <div style={{ position:'absolute', right:34, bottom:32, width:96, height:96, borderRadius:30, display:'grid', placeItems:'center', fontSize:46, background: ans === q.a ? 'linear-gradient(135deg,#FFE66D,#F59E0B)' : 'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.10)' }}>{ans === q.a ? '🏅' : '🚨'}</div>
            </div>
            <div style={{ marginTop:18, padding:'16px 18px', borderRadius:20, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.10)' }}><div style={{ fontSize:24, fontWeight:900, color:'#fff', lineHeight:1.28 }}>{q.q}</div><div style={{ color:'rgba(255,255,255,.80)', marginTop:10, lineHeight:1.55 }}>{ans === null ? 'Doğru cevabı seç ve kahramanı yardım çağrısına ulaştır.' : ans === q.a ? 'Görev başarıyla tamamlandı, şehir rahat bir nefes aldı.' : 'Kahraman yön değiştirdi ama yeni görev seni bekliyor.'}</div></div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, alignContent:'start' }}>
          {q.o.map((option, index) => {
            const correct = ans !== null && index === q.a;
            const selected = ans === index;
            return <button key={index} onClick={() => ans === null && hAns(index)} onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)} style={{ minHeight:168, borderRadius:26, border:`1px solid ${correct ? 'rgba(46,204,113,.42)' : selected ? 'rgba(255,107,107,.42)' : 'rgba(255,255,255,.10)'}`, background: ans === null ? (hovered === index ? 'linear-gradient(180deg, rgba(96,165,250,.22), rgba(108,92,231,.12))' : 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))') : correct ? 'linear-gradient(180deg, rgba(46,204,113,.30), rgba(46,204,113,.12))' : selected ? 'linear-gradient(180deg, rgba(255,107,107,.28), rgba(255,107,107,.12))' : 'rgba(255,255,255,.035)', color:'#fff', padding:'18px', textAlign:'left', cursor: ans === null ? 'pointer' : 'default', boxShadow: hovered === index && ans === null ? '0 18px 34px rgba(96,165,250,.18)' : '0 12px 24px rgba(0,0,0,.14)', transition:'all .22s ease' }}><div style={{ display:'flex', justifyContent:'space-between', gap:10 }}><div style={{ width:44, height:44, borderRadius:16, background:'rgba(0,0,0,.16)', display:'grid', placeItems:'center', fontWeight:900 }}>{LETTERS[index]}</div><div style={{ fontSize:28 }}>{correct ? '🛡️' : selected ? '💥' : ['🚑','⚡','🧩','🌟'][index]}</div></div><div style={{ fontSize:22, fontWeight:900, lineHeight:1.35, marginTop:18 }}>{option}</div><div style={{ marginTop:12, fontSize:13, color:'rgba(255,255,255,.78)' }}>{correct ? 'Şehri kurtaran karar' : selected ? 'Bu plan tutmadı' : 'Görevi seç'}</div></button>;
          })}
        </div>
      </div>
    </div>
  );
}
