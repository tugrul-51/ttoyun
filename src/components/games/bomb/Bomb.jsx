/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import { SFX } from "../../../utils/audio";

const LETTERS = ["A", "B", "C", "D"];
const WIRES = ["#FF6B6B", "#4DA3FF", "#3DDC97", "#FFD166"];
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

export default function Bomb({ q, qi, gqs, ans, hAns }) {
  const [hovered, setHovered] = useState(null);
  const [shake, setShake] = useState(false);

  useEffect(() => { setHovered(null); setShake(false); }, [qi]);
  useEffect(() => {
    if (!q || ans === null) return;
    if (ans !== q.a) {
      setShake(true);
      SFX.bomb?.();
      const t = setTimeout(() => setShake(false), 420);
      return () => clearTimeout(t);
    }
    SFX.reveal?.();
  }, [ans, q]);

  const progress = clamp((((qi || 0) + 1) / (gqs?.length || 1)) * 100, 0, 100);
  const risk = clamp(30 + (qi || 0) * 8, 30, 96);
  const status = ans === null ? "Doğru kabloyu seç ve düzeneği güvenli moda al." : ans === q?.a ? "Bomba başarıyla etkisiz hale getirildi." : "Yanlış kablo kesildi. Sistem alarm verdi.";
  const wires = useMemo(() => (q?.o || []).map((option, index) => ({ option, color: WIRES[index % WIRES.length], index })), [q]);
  if (!q) return null;
  const cut = (index) => { if (ans !== null) return; SFX.pop?.(); hAns(index); };

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 14, animation: "fadeUp .35s ease" }}>
      <style>{`
        @keyframes bPulse { from { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,107,107,.18); } to { transform: scale(1.05); box-shadow: 0 0 0 22px rgba(255,107,107,0); } }
        @keyframes bBlink { 0%,100% { opacity: .35; } 50% { opacity: 1; } }
        @keyframes bShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 50%{transform:translateX(6px)} 75%{transform:translateX(-4px)} }
        .b-card { backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border:1px solid rgba(255,255,255,.08); background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03)); box-shadow: 0 18px 40px rgba(0,0,0,.18); border-radius: 28px; }
        .b-shake { animation: bShake .36s ease; }
        .b-options { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:12px; }
        @media (max-width: 920px){ .b-layout { grid-template-columns: 1fr !important; } }
      `}</style>
      <div className="b-card" style={{ padding: 16 }}>
        <div className="b-layout" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ position: "relative", minHeight: 420, overflow: "hidden", borderRadius: 24, background: "radial-gradient(circle at 50% 12%, rgba(255,255,255,.12), transparent 18%), linear-gradient(180deg, rgba(42,12,19,.96), rgba(16,18,34,.96))", border: "1px solid rgba(255,255,255,.08)" }}>
            <div style={{ position: "absolute", top: 18, left: 18, right: 18, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
              {[[`Tur ${(qi || 0) + 1}`, `${gqs?.length || 1} soru`],[`%${risk}`, "risk"],[`${Math.round(progress)}%`, "ilerleme"],[ans === null ? "Aktif" : ans === q.a ? "Güvenli" : "Alarm", "durum"]].map(([big, small]) => <div key={big + small} style={{ padding: "10px 12px", borderRadius: 18, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)" }}><div style={{ color: "#fff", fontWeight: 900, fontSize: 15 }}>{big}</div><div style={{ color: "#9FB3CD", fontSize: 11, marginTop: 4, textTransform: "uppercase", letterSpacing: ".08em" }}>{small}</div></div>)}
            </div>
            <div className={shake ? 'b-shake' : ''} style={{ position: "absolute", left: "50%", top: "52%", transform: "translate(-50%, -50%)", width: 220, height: 220, borderRadius: "50%", background: ans === q.a ? "radial-gradient(circle at 35% 30%, #7EF5B8, #1E8E5A)" : "radial-gradient(circle at 35% 30%, #4b566f, #0f172a)", boxShadow: ans === q.a ? "0 0 0 16px rgba(46,204,113,.10), 0 24px 44px rgba(46,204,113,.22)" : "0 24px 54px rgba(0,0,0,.34)", animation: ans === null ? "bPulse .95s ease-in-out infinite alternate" : "none" }}>
              <div style={{ position: "absolute", inset: 26, borderRadius: "50%", border: ans === q.a ? "10px solid rgba(255,255,255,.26)" : "10px solid rgba(255,255,255,.12)" }} />
              <div style={{ position: "absolute", left: "50%", top: 28, transform: "translateX(-50%)", width: 34, height: 72, borderRadius: 999, background: ans === q.a ? "linear-gradient(180deg,#FFE66D,#2ECC71)" : "linear-gradient(180deg,#FFE66D,#FF6B6B)", animation: ans === null ? "bBlink .8s linear infinite" : "none" }} />
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 54 }}>{ans === q.a ? "🛡️" : "💣"}</div>
            </div>
            <div style={{ position: "absolute", left: 24, right: 24, bottom: 28 }}>
              <div style={{ color: "#9FB3CD", fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Bomba çözüm görevi</div>
              <div style={{ color: "#fff", fontSize: 30, lineHeight: 1.16, fontWeight: 900 }}>{q.q}</div>
              <div style={{ marginTop: 12, color: ans === null ? "#FFD7A3" : ans === q.a ? "#8CF0B9" : "#FFB0B0", fontSize: 15, lineHeight: 1.55 }}>{status}</div>
            </div>
          </div>
          <div className="b-card" style={{ padding: 18, display: "grid", gridTemplateRows: "auto auto 1fr", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><div><div style={{ color: "#A3B6D4", fontSize: 12, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase" }}>Kablo paneli</div><div style={{ color: "#fff", fontSize: 24, fontWeight: 900, marginTop: 4 }}>Doğru kabloyu kes</div></div><div style={{ minWidth: 120, textAlign: "right" }}><div style={{ color: "#FFB86B", fontSize: 22, fontWeight: 900 }}>{risk}%</div><div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,.08)", overflow: "hidden", marginTop: 6 }}><div style={{ width: `${risk}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#FFE66D,#FF6B6B)" }} /></div></div></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>{[["Risk", `${risk}%`],["Tur", `${(qi || 0) + 1}`],["Mod", ans === null ? "Çözüm" : ans === q.a ? "Temiz" : "Alarm"]].map(([label, value]) => <div key={label} style={{ padding: "12px 14px", borderRadius: 16, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}><div style={{ color: "#93A7C4", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</div><div style={{ color: "#fff", fontWeight: 900, fontSize: 16, marginTop: 5 }}>{value}</div></div>)}</div>
            <div className="b-options">
              {wires.map(({ option, color, index }) => {
                const isCorrect = index === q.a, isSelected = index === ans, active = hovered === index && ans === null;
                const background = ans === null ? active ? `linear-gradient(135deg, color-mix(in srgb, ${color} 28%, transparent), rgba(255,255,255,.06))` : "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))" : isCorrect ? "linear-gradient(135deg, rgba(46,204,113,.35), rgba(46,204,113,.18))" : isSelected ? "linear-gradient(135deg, rgba(231,76,60,.30), rgba(231,76,60,.14))" : "rgba(255,255,255,.03)";
                return <button key={index} onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)} onClick={() => cut(index)} disabled={ans !== null} style={{ textAlign: "left", borderRadius: 22, border: `1px solid ${isCorrect && ans !== null ? 'rgba(46,204,113,.34)' : isSelected && ans !== null ? 'rgba(231,76,60,.28)' : 'rgba(255,255,255,.08)'}`, background, padding: 16, color: "#fff", minHeight: 124 }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}><div style={{ width: 42, height: 42, borderRadius: 14, display: "grid", placeItems: "center", background: "rgba(0,0,0,.22)", fontWeight: 900 }}>{LETTERS[index]}</div><div style={{ width: 88, height: 10, borderRadius: 999, background: color, boxShadow: active ? `0 0 18px ${color}` : "none" }} /></div><div style={{ fontSize: 17, fontWeight: 900, lineHeight: 1.35 }}>{option}</div></button>;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
