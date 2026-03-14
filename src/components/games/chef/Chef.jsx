/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react';
import { SFX } from '../../../utils/audio';
import PremiumIntro from '../PremiumIntro';

const LETTERS = ['A', 'B', 'C', 'D'];
const INGREDIENTS = ['🍞','🧀','🍅','🥬','🥕','🌽','🍓','🍫'];
function clamp(v,min,max){return Math.max(min,Math.min(max,v));}

export default function Chef({ q, qi, gqs, ans, hAns }) {
  const [hovered, setHovered] = useState(null);
  useEffect(() => setHovered(null), [qi]);
  useEffect(() => {
    if (!q || ans === null) return;
    if (ans === q.a) SFX.successChef?.();
  }, [ans, q]);
  const total = gqs?.length || 1;
  const progress = clamp(((qi + 1) / total) * 100, 0, 100);
  const plate = useMemo(() => {
    const count = clamp((qi || 0) + (ans === q?.a ? 2 : ans !== null ? 1 : 0), 1, 6);
    return INGREDIENTS.slice(0, count);
  }, [qi, ans, q]);
  if (!q) return null;
  return (
    <div style={{ maxWidth:1320, margin:'0 auto', animation:'chefEnter .45s ease' }}>
      <style>{`
        @keyframes chefEnter { from{opacity:0; transform:translateY(16px) scale(.985)} to{opacity:1; transform:translateY(0) scale(1)} }
        @keyframes chefSteam { 0%{transform:translateY(0) scale(.9); opacity:.18} 100%{transform:translateY(-20px) scale(1.15); opacity:0} }
        @keyframes chefBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      `}</style>
      <PremiumIntro
        questionKey={qi}
        title='Şef Yarışması'
        subtitle='Mini mutfak gösterisi'
        mascot='👨‍🍳'
        accent='#FF8BA7'
        accent2='#FFD166'
        onIntro={() => SFX.introChef?.()}
        introLine='Şef Pofuduk diyor ki: doğru malzemeyi seç, tabağı ışıl ışıl yapalım!'
        successLine='Mutfaktan alkış sesi geldi, tarif harika görünüyor!'
        failureLine='Ufak bir mutfak karışıklığı oldu ama yeni tabak seni bekliyor.'
        answerState={ans === null ? 'idle' : ans === q.a ? 'correct' : 'wrong'}
      />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        <div style={{ minHeight:500, padding:22, borderRadius:30, background:'linear-gradient(180deg, rgba(255,182,193,.16), rgba(255,215,0,.10))', border:'1px solid rgba(255,255,255,.10)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 20% 18%, rgba(255,255,255,.16), transparent 30%), radial-gradient(circle at 80% 16%, rgba(255,209,102,.18), transparent 22%), linear-gradient(180deg, rgba(255,255,255,.04), rgba(0,0,0,.08))' }} />
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', gap:12, alignItems:'center', marginBottom:14 }}><div><div style={{ fontSize:12, color:'#FFE7A5', fontWeight:900, textTransform:'uppercase', letterSpacing:'.08em' }}>Şef Yarışması</div><div style={{ fontSize:30, fontWeight:1000, color:'#fff' }}>Tatlı mutfak görevi</div></div><div style={{ fontSize:42 }}>👨‍🍳</div></div>
            <div style={{ height:12, borderRadius:999, background:'rgba(255,255,255,.08)', overflow:'hidden', marginBottom:18 }}><div style={{ width:`${progress}%`, height:'100%', background:'linear-gradient(90deg,#FF8BA7,#FFD166,#F59E0B)' }} /></div>
            <div style={{ minHeight:280, borderRadius:28, background:'linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.04))', border:'1px solid rgba(255,255,255,.10)', position:'relative', overflow:'hidden' }}>
              {[0,1,2].map((i) => <div key={i} style={{ position:'absolute', left:`${40 + i * 10}%`, top:'22%', width:34, height:56, borderRadius:'50%', background:'rgba(255,255,255,.22)', filter:'blur(8px)', animation:`chefSteam ${1.8 + i * .25}s ease-out ${i * .3}s infinite` }} />)}
              <div style={{ position:'absolute', inset:'auto 22px 30px', height:20, borderRadius:999, background:'rgba(0,0,0,.16)' }} />
              <div style={{ position:'absolute', left:'50%', bottom:42, transform:'translateX(-50%)', width:280, height:140, borderRadius:'0 0 120px 120px', background:'linear-gradient(180deg,#FFF7ED,#FDE68A)', border:'6px solid rgba(255,255,255,.35)', boxShadow:'0 24px 38px rgba(0,0,0,.16)' }} />
              <div style={{ position:'absolute', left:'50%', bottom:116, transform:'translateX(-50%)', display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center', width:260 }}>
                {plate.map((item, i) => <div key={i} style={{ fontSize:42, animation:`chefBounce ${1.9 + i * .12}s ease-in-out infinite` }}>{item}</div>)}
              </div>
              <div style={{ position:'absolute', left:26, bottom:22, padding:'10px 14px', borderRadius:16, background:'rgba(255,255,255,.10)', color:'#fff', fontWeight:900 }}>{ans === q.a ? 'Tarif güçlendi' : ans !== null ? 'Tarif devam ediyor' : 'Malzeme bekleniyor'}</div>
            </div>
            <div style={{ marginTop:18, padding:'16px 18px', borderRadius:20, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.10)' }}><div style={{ fontSize:24, fontWeight:900, color:'#fff', lineHeight:1.28 }}>{q.q}</div><div style={{ color:'rgba(255,255,255,.78)', marginTop:10, lineHeight:1.55 }}>{ans === null ? 'Doğru cevabı seçerek tabağı tamamla ve çocuk şeflerin alkışını kazan.' : ans === q.a ? 'Lezzet puanı arttı! Tabak şimdi çok daha güzel.' : 'Ufak bir mutfak kazası oldu ama tarif hâlâ kurtarılabilir.'}</div></div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, alignContent:'start' }}>
          {q.o.map((option, index) => {
            const correct = ans !== null && index === q.a;
            const selected = ans === index;
            return <button key={index} onClick={() => ans === null && hAns(index)} onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)} style={{ minHeight:168, borderRadius:26, border:`1px solid ${correct ? 'rgba(46,204,113,.42)' : selected ? 'rgba(255,107,107,.42)' : 'rgba(255,255,255,.10)'}`, background: ans === null ? (hovered === index ? 'linear-gradient(180deg, rgba(255,139,167,.22), rgba(255,209,102,.12))' : 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))') : correct ? 'linear-gradient(180deg, rgba(46,204,113,.30), rgba(46,204,113,.12))' : selected ? 'linear-gradient(180deg, rgba(255,107,107,.28), rgba(255,107,107,.12))' : 'rgba(255,255,255,.035)', color:'#fff', padding:'18px', textAlign:'left', cursor: ans === null ? 'pointer' : 'default', boxShadow: hovered === index && ans === null ? '0 18px 34px rgba(255,139,167,.18)' : '0 12px 24px rgba(0,0,0,.14)', transition:'all .22s ease' }}><div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', gap:10 }}><div style={{ width:44, height:44, borderRadius:16, background:'rgba(0,0,0,.16)', display:'grid', placeItems:'center', fontWeight:900 }}>{LETTERS[index]}</div><div style={{ fontSize:28 }}>{correct ? '🍰' : selected ? '🥄' : INGREDIENTS[index]}</div></div><div style={{ fontSize:22, fontWeight:900, lineHeight:1.35, marginTop:18 }}>{option}</div><div style={{ marginTop:12, fontSize:13, color:'rgba(255,255,255,.78)' }}>{correct ? 'Tarif için doğru seçim' : selected ? 'Bu malzeme tarifte sırıttı' : 'Menü seçeneği'}</div></button>;
          })}
        </div>
      </div>
    </div>
  );
}
