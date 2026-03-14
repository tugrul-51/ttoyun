/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { SFX } from "../../../utils/audio";

const LETTERS = ["A", "B", "C", "D"];
const TARGET_THEMES = [
  ["#FF6B6B", "#C0392B", "Alev Hedef"],
  ["#FFE66D", "#F39C12", "Güneş Hedef"],
  ["#4ECDC4", "#0077B6", "Deniz Hedef"],
  ["#A78BFA", "#6D28D9", "Yıldız Hedef"],
];

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function tier(index) {
  const n = (index || 0) + 1;
  if (n >= 10) return "Usta Nişancı";
  if (n >= 7) return "Keskin Atıcı";
  if (n >= 4) return "Atış Serisi";
  return "Isınma Turu";
}

export default function Target({ q, qi, gqs, ans, hAns }) {
  const [hovered, setHovered] = useState(null);
  const [burst, setBurst] = useState(false);
  const [wrongShake, setWrongShake] = useState(false);

  useEffect(() => { setHovered(null); setBurst(false); setWrongShake(false); }, [qi]);
  useEffect(() => {
    if (!q || ans === null) return;
    if (ans === q.a) {
      setBurst(true);
      SFX.whoosh?.();
      const t = setTimeout(() => setBurst(false), 950);
      return () => clearTimeout(t);
    }
    setWrongShake(true);
    const t = setTimeout(() => setWrongShake(false), 420);
    return () => clearTimeout(t);
  }, [ans, q]);

  const progress = clamp((((qi || 0) + 1) / (gqs?.length || 1)) * 100, 0, 100);
  const wind = useMemo(() => (((qi || 0) * 7) % 5) - 2, [qi]);
  const windText = wind === 0 ? "Sakin" : wind > 0 ? `Sağa ${wind}` : `Sola ${Math.abs(wind)}`;
  const accuracy = clamp(92 - Math.abs(wind) * 14 + ((qi || 0) % 4) * 4, 28, 98);
  const status = ans === null ? "Doğru hedefi seç ve oku merkeze gönder." : ans === q?.a ? "Mükemmel isabet. Hedef tam merkezden vuruldu." : "Bu atış dış çembere gitti. Doğru hedef şimdi parlıyor.";
  if (!q) return null;
  const choose = (index) => { if (ans !== null) return; SFX.whoosh?.(); hAns(index); };

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 14, animation: "fadeUp .35s ease" }}>
      <style>{`
        @keyframes tBob { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
        @keyframes tImpact { from { transform: scale(.55); opacity:.85; } to { transform: scale(1.8); opacity:0; } }
        @keyframes tArrow { 0% { transform: translateX(-180px) translateY(18px) rotate(-7deg); opacity:.15; } 100% { transform: translateX(var(--arrowX)) translateY(var(--arrowY)) rotate(0deg); opacity:1; } }
        @keyframes tShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 50%{transform:translateX(5px)} 75%{transform:translateX(-4px)} }
        @keyframes tSparkle { 0%,100% { opacity:.3; transform: scale(.8); } 50% { opacity:1; transform: scale(1.25); } }
        .t-card { backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border:1px solid rgba(255,255,255,.08); background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03)); box-shadow: 0 18px 40px rgba(0,0,0,.18); border-radius: 28px; }
        .t-options { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:12px; }
        .t-shake { animation: tShake .36s ease; }
        @media (max-width: 920px){ .t-layout { grid-template-columns: 1fr !important; } }
      `}</style>
      <div className="t-card" style={{ padding: 16 }}>
        <div className="t-layout" style={{ display: "grid", gridTemplateColumns: "1.08fr .92fr", gap: 14 }}>
          <div style={{ position: "relative", minHeight: 420, overflow: "hidden", borderRadius: 24, background: "radial-gradient(circle at 50% 18%, rgba(255,255,255,.14), transparent 22%), linear-gradient(180deg, rgba(22,32,74,.95), rgba(12,18,42,.92))", border: "1px solid rgba(255,255,255,.08)" }}>
            {Array.from({ length: 10 }).map((_, i) => <span key={i} style={{ position: "absolute", left: `${12 + ((i * 9) % 76)}%`, top: `${14 + ((i * 7) % 54)}%`, width: 8 + (i % 3) * 4, height: 8 + (i % 3) * 4, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.95), rgba(255,230,109,.15))", animation: `tSparkle ${1.7 + i * .1}s ease-in-out ${i * .08}s infinite` }} />)}
            <div style={{ position: "absolute", left: 18, top: 18, right: 18, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {[[`Tur ${(qi || 0) + 1}`, `${gqs?.length || 1} soru`],[tier(qi), "rütbe"],[windText, "rüzgar"],[`%${Math.round(progress)}`, "ilerleme"]].map(([big, small]) => <div key={big + small} style={{ padding: "10px 12px", borderRadius: 18, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)" }}><div style={{ color: "#fff", fontWeight: 900, fontSize: 15 }}>{big}</div><div style={{ color: "#9FB3CD", fontSize: 11, marginTop: 4, textTransform: "uppercase", letterSpacing: ".08em" }}>{small}</div></div>)}
            </div>
            <div style={{ position: "absolute", right: 70, top: 96, width: 210, height: 210, borderRadius: "50%", border: "10px solid rgba(255,255,255,.95)", background: "repeating-radial-gradient(circle, #fff 0px, #fff 16px, #ff7070 16px, #ff7070 36px, #fff 36px, #fff 56px, #4ecdc4 56px, #4ecdc4 76px)", boxShadow: ans === q.a ? "0 0 0 12px rgba(46,204,113,.10), 0 22px 44px rgba(46,204,113,.24)" : "0 18px 44px rgba(0,0,0,.24)", animation: "tBob 2.8s ease-in-out infinite" }}>
              <div style={{ position: "absolute", inset: 70, borderRadius: "50%", background: "radial-gradient(circle, #FFE66D, #F39C12)" }} />
              <div style={{ position: "absolute", left: "50%", top: "50%", width: 16, height: 16, borderRadius: "50%", background: "#fff", transform: "translate(-50%, -50%)" }} />
              {ans === q.a && burst && Array.from({ length: 4 }).map((_, i) => <span key={i} style={{ position: "absolute", left: "50%", top: "50%", width: 30, height: 30, borderRadius: "50%", border: "2px solid rgba(255,255,255,.85)", transform: "translate(-50%, -50%)", animation: `tImpact ${0.9 + i * 0.1}s ease-out ${i * 0.08}s forwards` }} />)}
            </div>
            <div style={{ position: "absolute", left: 56, top: 152, width: 180, height: 8, borderRadius: 999, background: "linear-gradient(90deg, #8B5CF6, #4ECDC4)", transformOrigin: "left center", rotate: `${wind * 2}deg`, boxShadow: "0 10px 24px rgba(78,205,196,.26)" }} />
            <div style={{ position: "absolute", left: 218, top: 144, width: 0, height: 0, borderTop: "12px solid transparent", borderBottom: "12px solid transparent", borderLeft: "24px solid #4ECDC4", transform: `rotate(${wind * 2}deg)` }} />
            {ans !== null && <div style={{ position: "absolute", left: 160, top: 186, width: 170, height: 6, borderRadius: 999, background: ans === q.a ? "linear-gradient(90deg,#FFE66D,#fff)" : "linear-gradient(90deg,#FF6B6B,#fff)", boxShadow: ans === q.a ? "0 0 24px rgba(255,230,109,.45)" : "0 0 20px rgba(255,107,107,.35)", transform: "rotate(-5deg)", ['--arrowX']: ans === q.a ? '534px' : '460px', ['--arrowY']: ans === q.a ? '14px' : '72px', animation: 'tArrow .55s ease-out forwards' }}><span style={{ position: "absolute", right: -18, top: -9, width: 0, height: 0, borderTop: "12px solid transparent", borderBottom: "12px solid transparent", borderLeft: `18px solid ${ans === q.a ? '#FFE66D' : '#FF6B6B'}` }} /></div>}
            <div style={{ position: "absolute", left: 22, bottom: 98, maxWidth: 420 }}><div style={{ color: "#9FB3CD", fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Atış görevi</div><div style={{ color: "#fff", fontSize: 30, lineHeight: 1.16, fontWeight: 900 }}>{q.q}</div><div style={{ marginTop: 12, color: ans === null ? "#CFE4FF" : ans === q.a ? "#8CF0B9" : "#FFB0B0", fontSize: 15, lineHeight: 1.55 }}>{status}</div></div>
          </div>
          <div className={`t-card ${wrongShake ? 't-shake' : ''}`} style={{ padding: 18, display: "grid", gridTemplateRows: "auto auto 1fr", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><div><div style={{ color: "#A3B6D4", fontSize: 12, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase" }}>Seçenek hedefleri</div><div style={{ color: "#fff", fontSize: 24, fontWeight: 900, marginTop: 4 }}>Doğru hedefi vur</div></div><div style={{ minWidth: 120, textAlign: "right" }}><div style={{ color: "#FFE66D", fontSize: 22, fontWeight: 900 }}>{Math.round(progress)}%</div><div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,.08)", overflow: "hidden", marginTop: 6 }}><div style={{ width: `${progress}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#FFE66D,#4ECDC4)" }} /></div></div></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>{[["Rüzgar", windText],["İsabet", `${accuracy}%`],["Durum", ans === null ? "Beklemede" : ans === q.a ? "Merkez" : "Kaçtı"]].map(([label, value]) => <div key={label} style={{ padding: "12px 14px", borderRadius: 16, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}><div style={{ color: "#93A7C4", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</div><div style={{ color: "#fff", fontWeight: 900, fontSize: 16, marginTop: 5 }}>{value}</div></div>)}</div>
            <div className="t-options">{q.o.map((option, index) => { const [c1, c2, label] = TARGET_THEMES[index % TARGET_THEMES.length]; const isCorrect = index === q.a; const isSelected = index === ans; const active = hovered === index && ans === null; const background = ans === null ? (active ? `linear-gradient(135deg, color-mix(in srgb, ${c1} 28%, transparent), color-mix(in srgb, ${c2} 18%, transparent))` : "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))") : isCorrect ? "linear-gradient(135deg, rgba(46,204,113,.35), rgba(46,204,113,.18))" : isSelected ? "linear-gradient(135deg, rgba(231,76,60,.30), rgba(231,76,60,.14))" : "rgba(255,255,255,.03)"; return <button key={index} onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)} onClick={() => choose(index)} disabled={ans !== null} style={{ textAlign: "left", borderRadius: 22, border: `1px solid ${isCorrect && ans !== null ? 'rgba(46,204,113,.34)' : isSelected && ans !== null ? 'rgba(231,76,60,.28)' : 'rgba(255,255,255,.08)'}`, background, padding: 16, color: "#fff", minHeight: 132 }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}><div style={{ width: 42, height: 42, borderRadius: 14, display: "grid", placeItems: "center", background: "rgba(0,0,0,.22)", fontWeight: 900 }}>{LETTERS[index]}</div><div style={{ width: 58, height: 58, borderRadius: "50%", background: `radial-gradient(circle, ${c1}, ${c2})`, border: "2px solid rgba(255,255,255,.20)", boxShadow: active ? `0 0 22px ${c1}` : "none" }} /></div><div style={{ color: "#BFD1EC", fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div><div style={{ fontSize: 17, fontWeight: 900, lineHeight: 1.35 }}>{option}</div></button>; })}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
