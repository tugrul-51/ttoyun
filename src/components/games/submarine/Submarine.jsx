/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { SFX } from "../../../utils/audio";

const LETTERS = ["A", "B", "C", "D"];
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function depthLabel(qi) { return `${((qi || 0) + 1) * 120} m`; }
function rank(qi) { const n = (qi || 0) + 1; return n >= 10 ? "Derin Deniz Ustası" : n >= 7 ? "Sualtı Kaptanı" : n >= 4 ? "Sonar Kaşifi" : "Başlangıç Dalışı"; }

export default function Submarine({ q, qi, gqs, ans, hAns }) {
  const [hovered, setHovered] = useState(null);
  const [burst, setBurst] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => { setHovered(null); setBurst(false); setShake(false); }, [qi]);
  useEffect(() => {
    if (!q || ans === null) return;
    if (ans === q.a) {
      setBurst(true);
      SFX.splash?.();
      const t = setTimeout(() => setBurst(false), 900);
      return () => clearTimeout(t);
    }
    setShake(true);
    const t = setTimeout(() => setShake(false), 420);
    return () => clearTimeout(t);
  }, [ans, q]);

  const progress = clamp((((qi || 0) + 1) / (gqs?.length || 1)) * 100, 0, 100);
  const pressure = clamp(1 + Math.floor((qi || 0) / 2), 1, 9);
  const energy = clamp(100 - (qi || 0) * 6, 35, 100);
  const sonar = clamp(52 + (qi || 0) * 4, 52, 96);
  const status = ans === null ? "Sonar taramasını yap ve doğru sinyali yakala. Parlayan halkaları takip et." : ans === q?.a ? "Hedef doğrulandı. Rota kilitlendi ve mürettebat sevindi." : "Yanlış sinyal seçildi. Doğru hedef şimdi sonar ışığıyla vurgulanıyor.";
  const waves = useMemo(() => Array.from({ length: 4 }).map((_, i) => ({ id: i, size: 120 + i * 52 })), []);
  const bubbles = useMemo(() => Array.from({ length: 12 }).map((_, i) => ({ id: i, left: 12 + ((i * 7) % 76), delay: i * 0.22, size: 8 + (i % 4) * 4 })), []);

  if (!q) return null;
  const choose = (index) => { if (ans !== null) return; SFX.splash?.(); hAns(index); };

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 14, animation: "fadeUp .35s ease" }}>
      <style>{`
        @keyframes sPulse { from { transform: translate(-50%, -50%) scale(.4); opacity:.65; } to { transform: translate(-50%, -50%) scale(1.45); opacity:0; } }
        @keyframes sFloat { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
        @keyframes sShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 50%{transform:translateX(5px)} 75%{transform:translateX(-4px)} }
        @keyframes sBubble { 0% { transform: translateY(0) scale(.8); opacity:0; } 20% { opacity:.9; } 100% { transform: translateY(-180px) scale(1.15); opacity:0; } }
        .s-card { backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border:1px solid rgba(255,255,255,.08); background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03)); box-shadow: 0 18px 40px rgba(0,0,0,.18); border-radius: 28px; }
        .s-options { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:12px; }
        .s-shake { animation: sShake .36s ease; }
        @media (max-width: 920px){ .s-layout { grid-template-columns: 1fr !important; } }
      `}</style>
      <div className="s-card" style={{ padding: 16 }}>
        <div className="s-layout" style={{ display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 14 }}>
          <div style={{ position: "relative", minHeight: 420, overflow: "hidden", borderRadius: 24, background: "radial-gradient(circle at 50% 10%, rgba(190,234,255,.15), transparent 18%), linear-gradient(180deg, rgba(5,59,97,.95), rgba(4,19,43,.96))", border: "1px solid rgba(255,255,255,.08)" }}>
            {bubbles.map((bubble) => (
              <span key={bubble.id} style={{ position: "absolute", left: `${bubble.left}%`, bottom: -12, width: bubble.size, height: bubble.size, borderRadius: "50%", background: "rgba(190,234,255,.45)", animation: `sBubble ${3.4 + bubble.delay}s linear ${bubble.delay}s infinite` }} />
            ))}
            <div style={{ position: "absolute", top: 18, left: 18, right: 18, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
              {[[depthLabel(qi), "derinlik"],[`${pressure}/9`, "basınç"],[`${energy}%`, "enerji"],[rank(qi), "rütbe"]].map(([big, small]) => <div key={big + small} style={{ padding: "10px 12px", borderRadius: 18, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)" }}><div style={{ color: "#fff", fontWeight: 900, fontSize: 15 }}>{big}</div><div style={{ color: "#9FB3CD", fontSize: 11, marginTop: 4, textTransform: "uppercase", letterSpacing: ".08em" }}>{small}</div></div>)}
            </div>
            <div style={{ position: "absolute", inset: 0 }}>
              {waves.map((wave) => <span key={wave.id} style={{ position: "absolute", left: "62%", top: "48%", width: wave.size, height: wave.size, borderRadius: "50%", border: ans === q.a ? "2px solid rgba(126,245,184,.55)" : "2px solid rgba(77,163,255,.36)", transform: "translate(-50%, -50%)", animation: `sPulse ${1.8 + wave.id * 0.28}s ease-out ${wave.id * 0.16}s infinite` }} />)}
            </div>
            <div className={shake ? 's-shake' : ''} style={{ position: "absolute", left: 84, top: 176, width: 220, height: 96, borderRadius: 50, background: "linear-gradient(135deg,#4ECDC4,#2C82C9)", boxShadow: ans === q.a ? "0 0 0 12px rgba(46,204,113,.10), 0 20px 40px rgba(0,0,0,.22)" : "0 20px 40px rgba(0,0,0,.22)", animation: "sFloat 3s ease-in-out infinite" }}>
              <div style={{ position: "absolute", inset: "18px auto 18px 24px", width: 78, borderRadius: 999, background: "rgba(255,255,255,.16)" }} />
              <div style={{ position: "absolute", right: 32, top: 28, width: 54, height: 40, borderRadius: 18, background: "rgba(255,255,255,.16)" }} />
              <div style={{ position: "absolute", right: -26, top: 34, width: 40, height: 28, clipPath: "polygon(0 0, 100% 50%, 0 100%)", background: "#2C82C9" }} />
              <div style={{ position: "absolute", left: 86, top: -20, width: 42, height: 26, borderRadius: 12, background: "rgba(255,255,255,.16)" }} />
              <div style={{ position: "absolute", left: 104, top: -40, width: 8, height: 24, borderRadius: 999, background: "rgba(255,255,255,.16)" }} />
            </div>
            {ans === q.a && burst && <div style={{ position: "absolute", left: "62%", top: "48%", width: 120, height: 120, borderRadius: "50%", border: "3px solid rgba(126,245,184,.8)", transform: "translate(-50%, -50%)", animation: "sPulse .9s ease-out forwards" }} />}
            <div style={{ position: "absolute", left: 24, right: 24, bottom: 28 }}><div style={{ color: "#9FB3CD", fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Sonar görevi</div><div style={{ color: "#fff", fontSize: 30, lineHeight: 1.16, fontWeight: 900 }}>{q.q}</div><div style={{ marginTop: 12, color: ans === null ? "#BFE4FF" : ans === q.a ? "#8CF0B9" : "#FFB0B0", fontSize: 15, lineHeight: 1.55 }}>{status}</div></div>
          </div>
          <div className="s-card" style={{ padding: 18, display: "grid", gridTemplateRows: "auto auto auto 1fr", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><div><div style={{ color: "#A3B6D4", fontSize: 12, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase" }}>Sonar paneli</div><div style={{ color: "#fff", fontSize: 24, fontWeight: 900, marginTop: 4 }}>Doğru sinyali seç</div></div><div style={{ minWidth: 120, textAlign: "right" }}><div style={{ color: "#7DE3FF", fontSize: 22, fontWeight: 900 }}>{Math.round(progress)}%</div><div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,.08)", overflow: "hidden", marginTop: 6 }}><div style={{ width: `${progress}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#7DE3FF,#4ECDC4)" }} /></div></div></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>{[["Derinlik", depthLabel(qi)],["Basınç", `${pressure}/9`],["Enerji", `${energy}%`]].map(([label, value]) => <div key={label} style={{ padding: "12px 14px", borderRadius: 16, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}><div style={{ color: "#93A7C4", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</div><div style={{ color: "#fff", fontWeight: 900, fontSize: 16, marginTop: 5 }}>{value}</div></div>)}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><div style={{ padding: "8px 12px", borderRadius: 999, background: "rgba(125,227,255,.10)", border: "1px solid rgba(125,227,255,.18)", color: "#BFE4FF", fontWeight: 800, fontSize: 12 }}>🔊 Sonar gücü {sonar}%</div><div style={{ padding: "8px 12px", borderRadius: 999, background: "rgba(78,205,196,.10)", border: "1px solid rgba(78,205,196,.18)", color: "#CFFFF9", fontWeight: 800, fontSize: 12 }}>🐠 Derin görev</div></div>
            <div className="s-options">
              {q.o.map((option, index) => {
                const isCorrect = index === q.a, isSelected = index === ans, active = hovered === index && ans === null;
                const background = ans === null ? active ? "linear-gradient(135deg, rgba(77,163,255,.28), rgba(78,205,196,.18))" : "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))" : isCorrect ? "linear-gradient(135deg, rgba(46,204,113,.35), rgba(46,204,113,.18))" : isSelected ? "linear-gradient(135deg, rgba(231,76,60,.30), rgba(231,76,60,.14))" : "rgba(255,255,255,.03)";
                return <button key={index} onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)} onClick={() => choose(index)} disabled={ans !== null} style={{ textAlign: "left", borderRadius: 22, border: `1px solid ${isCorrect && ans !== null ? 'rgba(46,204,113,.34)' : isSelected && ans !== null ? 'rgba(231,76,60,.28)' : 'rgba(255,255,255,.08)'}`, background, padding: 16, color: "#fff", minHeight: 124 }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}><div style={{ width: 42, height: 42, borderRadius: 14, display: "grid", placeItems: "center", background: "rgba(0,0,0,.22)", fontWeight: 900 }}>{LETTERS[index]}</div><div style={{ width: 56, height: 56, borderRadius: "50%", border: "2px solid rgba(125,227,255,.55)", boxShadow: active ? "0 0 18px rgba(125,227,255,.32)" : "none" }} /></div><div style={{ color: "#C6D7EE", fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>{index === 0 ? "Yumuşak Yankı" : index === 1 ? "Derin Yankı" : index === 2 ? "Parlak Sinyal" : "Kaptan İzleri"}</div><div style={{ fontSize: 17, fontWeight: 900, lineHeight: 1.35 }}>{option}</div></button>;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
