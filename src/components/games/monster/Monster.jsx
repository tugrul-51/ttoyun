/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { SFX } from '../../../utils/audio';
import PremiumIntro from '../PremiumIntro';

const LETTERS = ['A', 'B', 'C', 'D'];
const MONSTERS = ['🦕', '👾', '🐲', '🪼', '🐸', '🦄'];
function clamp(v,min,max){return Math.max(min,Math.min(max,v));}

export default function Monster({ q, qi, gqs, ans, hAns }) {
  const [hovered, setHovered] = useState(null);
  const [pulse, setPulse] = useState(false);
  useEffect(() => { setHovered(null); setPulse(false); }, [qi]);
  useEffect(() => {
    if (ans === null || !q) return;
    if (ans === q.a) {
      setPulse(true); SFX.successMonster?.();
      const t = setTimeout(() => setPulse(false), 900);
      return () => clearTimeout(t);
    }
  }, [ans, q]);
  if (!q) return null;
  const total = gqs?.length || 1;
  const progress = clamp(((qi + 1) / total) * 100, 0, 100);
  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', animation: 'monsterEnter .45s ease' }}>
      <style>{`
        @keyframes monsterEnter { from{opacity:0; transform:translateY(16px) scale(.985)} to{opacity:1; transform:translateY(0) scale(1)} }
        @keyframes monsterBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes monsterGlow { from{filter:brightness(1)} to{filter:brightness(1.2)} }
      `}</style>
      <PremiumIntro
        questionKey={qi}
        title='Canavar Yakalama'
        subtitle='Sevimli yaratık kulübü'
        mascot='👾'
        accent='#A78BFA'
        accent2='#4ECDC4'
        onIntro={() => SFX.introMonster?.()}
        introLine='Kaptan Momo diyor ki: en dost canlısı yaratığı takımına kat!'
        successLine='Yakalama ağı parladı, yeni dost takımda!'
        failureLine='Bu minik dost kaçtı ama sıradaki çok meraklı görünüyor.'
        answerState={ans === null ? 'idle' : ans === q.a ? 'correct' : 'wrong'}
      />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        <div style={{ minHeight:500, padding:22, borderRadius:30, background:'linear-gradient(180deg, rgba(75,0,130,.22), rgba(9,13,34,.18))', border:'1px solid rgba(255,255,255,.10)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 20% 18%, rgba(167,139,250,.22), transparent 28%), radial-gradient(circle at 80% 14%, rgba(78,205,196,.18), transparent 22%), linear-gradient(180deg, rgba(9,13,34,.1), rgba(9,13,34,.4))' }} />
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', gap:12, alignItems:'center', marginBottom:14 }}><div><div style={{ fontSize:12, color:'#C9B7FF', fontWeight:900, textTransform:'uppercase', letterSpacing:'.08em' }}>Canavar Yakalama</div><div style={{ fontSize:30, fontWeight:1000, color:'#fff' }}>Sevimli yaratık ekibi</div></div><div style={{ padding:'10px 14px', borderRadius:999, background:'rgba(255,255,255,.08)', color:'#E7E0FF', fontWeight:900 }}>Yakalama turu</div></div>
            <div style={{ height:12, borderRadius:999, background:'rgba(255,255,255,.08)', overflow:'hidden', marginBottom:18 }}><div style={{ width:`${progress}%`, height:'100%', background:'linear-gradient(90deg,#A78BFA,#4ECDC4,#FFE66D)', animation:'monsterGlow 1.6s ease-in-out infinite alternate' }} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, minHeight:320, alignContent:'center' }}>
              {MONSTERS.map((monster, index) => {
                const active = ans !== null && index % 4 === q.a % 4;
                return <div key={index} style={{ padding:'18px 12px', borderRadius:22, background: active ? 'linear-gradient(180deg, rgba(46,204,113,.26), rgba(46,204,113,.10))' : 'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.09)', textAlign:'center', animation:`monsterBob ${2.2 + index * 0.12}s ease-in-out infinite`, boxShadow: active ? '0 16px 30px rgba(46,204,113,.16)' : '0 10px 20px rgba(0,0,0,.16)' }}><div style={{ fontSize:50, filter:'drop-shadow(0 10px 16px rgba(0,0,0,.18))' }}>{active && ans === q.a ? '✨' : monster}</div><div style={{ color:'#fff', fontWeight:900, marginTop:10 }}>Takım {index + 1}</div><div style={{ fontSize:12, color:'rgba(255,255,255,.72)', marginTop:4 }}>{active && ans === q.a ? 'Yakalandı!' : 'Hazır bekliyor'}</div></div>;
              })}
            </div>
            <div style={{ marginTop:18, padding:'16px 18px', borderRadius:20, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.10)' }}>
              <div style={{ fontSize:24, fontWeight:900, color:'#fff', lineHeight:1.28 }}>{q.q}</div>
              <div style={{ color:'rgba(255,255,255,.78)', marginTop:10, lineHeight:1.55 }}>{ans === null ? 'En dost canlısı yaratığı takımına katmak için doğru cevabı seç.' : ans === q.a ? 'Süper! Yeni bir dost yakaladın.' : 'Bu yaratık kaçtı ama sıradaki çok daha tatlı olabilir.'}</div>
            </div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, alignContent:'start' }}>
          {q.o.map((option, index) => {
            const correct = ans !== null && index === q.a;
            const selected = ans === index;
            return <button key={index} onClick={() => ans === null && hAns(index)} onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)} style={{ minHeight:170, borderRadius:26, border:`1px solid ${correct ? 'rgba(46,204,113,.42)' : selected ? 'rgba(255,107,107,.42)' : 'rgba(255,255,255,.10)'}`, background: ans === null ? (hovered === index ? 'linear-gradient(180deg, rgba(167,139,250,.24), rgba(78,205,196,.12))' : 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))') : correct ? 'linear-gradient(180deg, rgba(46,204,113,.30), rgba(46,204,113,.12))' : selected ? 'linear-gradient(180deg, rgba(255,107,107,.28), rgba(255,107,107,.12))' : 'rgba(255,255,255,.035)', color:'#fff', padding:'18px', textAlign:'left', cursor: ans === null ? 'pointer' : 'default', transition:'all .22s ease', boxShadow: hovered === index && ans === null ? '0 18px 34px rgba(167,139,250,.18)' : '0 12px 24px rgba(0,0,0,.14)' }}><div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', gap:12 }}><div style={{ width:44, height:44, borderRadius:16, background:'rgba(0,0,0,.16)', display:'grid', placeItems:'center', fontWeight:900 }}>{LETTERS[index]}</div><div style={{ fontSize:30 }}>{correct ? '🥳' : selected ? '💥' : pulse && index === q.a ? '⭐' : MONSTERS[index]}</div></div><div style={{ fontSize:22, fontWeight:900, lineHeight:1.35, marginTop:18 }}>{option}</div><div style={{ marginTop:12, fontSize:13, color:'rgba(255,255,255,.78)' }}>{correct ? 'Doğru seçim' : selected ? 'Bu cevap yaratığı ürküttü' : 'Bu ağı seç'}</div></button>;
          })}
        </div>
      </div>
    </div>
  );
}
