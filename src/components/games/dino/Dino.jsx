/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { SFX } from '../../../utils/audio';
import PremiumIntro from '../PremiumIntro';

const LETTERS = ['A','B','C','D'];
const EGGS = ['🥚','🥚','🥚','🥚'];
function clamp(v,min,max){return Math.max(min,Math.min(max,v));}

export default function Dino({ q, qi, gqs, ans, hAns }) {
  const [hovered, setHovered] = useState(null);
  const [shake, setShake] = useState(false);
  useEffect(() => { setHovered(null); setShake(false); }, [qi]);
  useEffect(() => {
    if (!q || ans === null) return;
    if (ans === q.a) { setShake(true); SFX.successDino?.(); const t = setTimeout(() => setShake(false), 900); return () => clearTimeout(t); }
  }, [ans, q]);
  if (!q) return null;
  const total = gqs?.length || 1;
  const progress = clamp(((qi + 1) / total) * 100, 0, 100);
  return (
    <div style={{ maxWidth:1320, margin:'0 auto', animation:'dinoEnter .45s ease' }}>
      <style>{`
        @keyframes dinoEnter { from{opacity:0; transform:translateY(16px) scale(.985)} to{opacity:1; transform:translateY(0) scale(1)} }
        @keyframes dinoBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes eggShake { 0%,100%{transform:rotate(0deg)} 20%{transform:rotate(-6deg)} 40%{transform:rotate(6deg)} 60%{transform:rotate(-5deg)} 80%{transform:rotate(5deg)} }
      `}</style>
      <PremiumIntro
        questionKey={qi}
        title='Dino Parkı'
        subtitle='Sevimli yumurta görevi'
        mascot='🦖'
        accent='#22C55E'
        accent2='#A3E635'
        onIntro={() => SFX.introDino?.()}
        introLine='Dino Rehber diyor ki: doğru izi bul, yumurtadan sürpriz dost çıksın!'
        successLine='Çatır çatır! Yumurtadan mutlu bir dino çıktı!'
        failureLine='Bu yumurta sessiz kaldı ama parkta daha çok sürpriz var.'
        answerState={ans === null ? 'idle' : ans === q.a ? 'correct' : 'wrong'}
      />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        <div style={{ minHeight:500, padding:22, borderRadius:30, background:'linear-gradient(180deg, rgba(61,220,151,.18), rgba(34,197,94,.10))', border:'1px solid rgba(255,255,255,.10)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 16% 18%, rgba(255,255,255,.16), transparent 28%), radial-gradient(circle at 82% 20%, rgba(255,230,109,.18), transparent 22%), linear-gradient(180deg, rgba(34,197,94,.04), rgba(20,83,45,.18))' }} />
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, marginBottom:14 }}><div><div style={{ fontSize:12, color:'#C8F7DA', fontWeight:900, textTransform:'uppercase', letterSpacing:'.08em' }}>Dino Parkı</div><div style={{ fontSize:30, fontWeight:1000, color:'#fff' }}>Sevimli dino görevi</div></div><div style={{ fontSize:42 }}>🦖</div></div>
            <div style={{ height:12, borderRadius:999, background:'rgba(255,255,255,.08)', overflow:'hidden', marginBottom:18 }}><div style={{ width:`${progress}%`, height:'100%', background:'linear-gradient(90deg,#3DDC97,#22C55E,#FFE66D)' }} /></div>
            <div style={{ minHeight:310, borderRadius:26, background:'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03))', border:'1px solid rgba(255,255,255,.10)', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', left:0, right:0, bottom:0, height:120, background:'linear-gradient(180deg, rgba(74,222,128,.10), rgba(20,83,45,.28))' }} />
              <div style={{ position:'absolute', left:28, bottom:20, fontSize:88, animation:'dinoBob 2.8s ease-in-out infinite' }}>{ans === q.a ? '🦕' : ans !== null ? '🦖' : '🦖'}</div>
              <div style={{ position:'absolute', right:26, bottom:26, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {EGGS.map((egg, index) => <div key={index} style={{ width:72, height:88, borderRadius:'50% 50% 46% 46%', background:'rgba(255,255,255,.10)', border:'1px solid rgba(255,255,255,.12)', display:'grid', placeItems:'center', fontSize:32, animation: shake && index === q.a ? 'eggShake .55s ease-in-out 2' : 'none' }}>{ans === q.a && index === q.a ? '🦖' : egg}</div>)}
              </div>
              <div style={{ position:'absolute', left:28, top:22, padding:'10px 14px', borderRadius:16, background:'rgba(255,255,255,.08)', color:'#F0FFF5', fontWeight:900 }}>{ans === null ? 'Yumurtalar sürpriz dolu' : ans === q.a ? 'Dino dostu çıktı!' : 'Yanlış iz sürüldü'}</div>
            </div>
            <div style={{ marginTop:18, padding:'16px 18px', borderRadius:20, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.10)' }}><div style={{ fontSize:24, fontWeight:900, color:'#fff', lineHeight:1.28 }}>{q.q}</div><div style={{ color:'rgba(255,255,255,.80)', marginTop:10, lineHeight:1.55 }}>{ans === null ? 'Doğru cevabı seç, yumurtadan sevimli dino çıksın.' : ans === q.a ? 'Harika! Parka yeni bir dino misafiri geldi.' : 'Bu yumurta boş çıktı ama macera devam ediyor.'}</div></div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, alignContent:'start' }}>
          {q.o.map((option, index) => {
            const correct = ans !== null && index === q.a;
            const selected = ans === index;
            return <button key={index} onClick={() => ans === null && hAns(index)} onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)} style={{ minHeight:168, borderRadius:26, border:`1px solid ${correct ? 'rgba(46,204,113,.42)' : selected ? 'rgba(255,107,107,.42)' : 'rgba(255,255,255,.10)'}`, background: ans === null ? (hovered === index ? 'linear-gradient(180deg, rgba(61,220,151,.22), rgba(255,230,109,.12))' : 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))') : correct ? 'linear-gradient(180deg, rgba(46,204,113,.30), rgba(46,204,113,.12))' : selected ? 'linear-gradient(180deg, rgba(255,107,107,.28), rgba(255,107,107,.12))' : 'rgba(255,255,255,.035)', color:'#fff', padding:'18px', textAlign:'left', cursor: ans === null ? 'pointer' : 'default', boxShadow: hovered === index && ans === null ? '0 18px 34px rgba(61,220,151,.18)' : '0 12px 24px rgba(0,0,0,.14)', transition:'all .22s ease' }}><div style={{ display:'flex', justifyContent:'space-between', gap:10 }}><div style={{ width:44, height:44, borderRadius:16, background:'rgba(0,0,0,.16)', display:'grid', placeItems:'center', fontWeight:900 }}>{LETTERS[index]}</div><div style={{ fontSize:28 }}>{correct ? '🌟' : selected ? '🪨' : ['🦴','🌿','🥚','🦕'][index]}</div></div><div style={{ fontSize:22, fontWeight:900, lineHeight:1.35, marginTop:18 }}>{option}</div><div style={{ marginTop:12, fontSize:13, color:'rgba(255,255,255,.78)' }}>{correct ? 'Doğru iz bulundu' : selected ? 'Bu iz kayaya çıktı' : 'İzi takip et'}</div></button>;
          })}
        </div>
      </div>
    </div>
  );
}
