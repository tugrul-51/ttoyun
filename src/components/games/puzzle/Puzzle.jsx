/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { SFX } from "../../../utils/audio";

const LETTERS = ["A", "B", "C", "D"];
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function tier(qi) { const n = (qi || 0) + 1; return n >= 10 ? "Usta Yapbozcu" : n >= 7 ? "Parça Avcısı" : n >= 4 ? "Hızlı Toplayıcı" : "Başlangıç"; }

export default function Puzzle({ q, qi, gqs, ans, hAns }) {
  const [hovered, setHovered] = useState(null);
  const [shake, setShake] = useState(false);
  useEffect(() => { setHovered(null); setShake(false); }, [qi]);
  useEffect(() => {
    if (!q || ans === null) return;
    if (ans === q.a) SFX.reveal?.();
    else { setShake(true); const t = setTimeout(() => setShake(false), 420); return () => clearTimeout(t); }
  }, [ans, q]);
  const progress = clamp((((qi || 0) + 1) / (gqs?.length || 1)) * 100, 0, 100);
  const completion = ans === q?.a ? 100 : ans === null ? 75 : 82;
  const status = ans === null ? "Eksik parçayı seç ve yapbozu tamamla. Parıltılı parça doğru yere uyacak." : ans === q?.a ? "Harika. Eksik parça yerine oturdu ve resim tamamlandı." : "Yanlış parça seçildi. Doğru parça şimdi öne çıktı.";
  const floaters = useMemo(() => Array.from({ length: 8 }).map((_, i) => ({ id: i, left: 10 + ((i * 11) % 80), top: 12 + ((i * 9) % 64), rotate: i % 2 ? -18 : 16 })), []);
  if (!q) return null;
  const choose = (index) => { if (ans !== null) return; SFX.click?.(); hAns(index); };

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 14, animation: "fadeUp .35s ease" }}>
      <style>{`
        @keyframes pFloat { 0%,100% { transform: translateY(0px) rotate(var(--rot)); } 50% { transform: translateY(-6px) rotate(calc(var(--rot) + 3deg)); } }
        @keyframes pShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 50%{transform:translateX(5px)} 75%{transform:translateX(-4px)} }
        @keyframes pSparkle { 0%,100% { opacity:.25; transform: scale(.8); } 50% { opacity:1; transform: scale(1.18); } }
        .p-card { backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border:1px solid rgba(255,255,255,.08); background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03)); box-shadow: 0 18px 40px rgba(0,0,0,.18); border-radius: 28px; }
        .p-shake { animation: pShake .36s ease; }
        .p-options { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:12px; }
        @media (max-width: 920px){ .p-layout { grid-template-columns: 1fr !important; } }
      `}</style>
      <div className="p-card" style={{ padding: 16 }}>
        <div className="p-layout" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ position: "relative", minHeight: 420, overflow: "hidden", borderRadius: 24, background: "radial-gradient(circle at 50% 10%, rgba(255,255,255,.14), transparent 18%), linear-gradient(180deg, rgba(40,30,74,.95), rgba(12,18,42,.95))", border: "1px solid rgba(255,255,255,.08)" }}>
            <div style={{ position: "absolute", top: 18, left: 18, right: 18, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
              {[[`Tur ${(qi || 0) + 1}`, `${gqs?.length || 1} soru`],[tier(qi), "seviye"],[`${Math.round(progress)}%`, "ilerleme"],[`${completion}%`, "tamam" ]].map(([big, small]) => <div key={big + small} style={{ padding: "10px 12px", borderRadius: 18, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)" }}><div style={{ color: "#fff", fontWeight: 900, fontSize: 15 }}>{big}</div><div style={{ color: "#9FB3CD", fontSize: 11, marginTop: 4, textTransform: "uppercase", letterSpacing: ".08em" }}>{small}</div></div>)}
            </div>
            {floaters.map((piece) => <span key={piece.id} style={{ position: "absolute", left: `${piece.left}%`, top: `${piece.top}%`, width: 14, height: 14, borderRadius: 4, background: "rgba(255,255,255,.14)", ["--rot"]: `${piece.rotate}deg`, animation: `pFloat ${2.8 + piece.id * 0.15}s ease-in-out infinite` }} />)}
            <div style={{ position: "absolute", left: "50%", top: "48%", transform: "translate(-50%, -50%)", width: 320, height: 320, display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
              {[0,1,2,3].map((piece) => {
                const missing = 3;
                const filled = missing === piece ? ans !== null && ans === q.a : true;
                return <div key={piece} style={{ position: "relative", borderRadius: 26, background: filled ? `linear-gradient(135deg, rgba(${piece % 2 ? '78,205,196' : '167,139,250'},.62), rgba(255,230,109,.22))` : "repeating-linear-gradient(135deg, rgba(255,255,255,.08) 0 12px, rgba(255,255,255,.03) 12px 24px)", border: filled ? "1px solid rgba(255,255,255,.16)" : "2px dashed rgba(255,255,255,.18)", boxShadow: filled ? "0 18px 30px rgba(0,0,0,.16)" : "inset 0 0 0 1px rgba(255,255,255,.08)", ["--rot"]: `${piece % 2 ? -5 : 5}deg`, animation: filled ? "pFloat 2.8s ease-in-out infinite" : "none" }}>
                  <span style={{ position: "absolute", width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,.18)", left: "50%", top: -14, transform: "translateX(-50%)" }} />
                  <span style={{ position: "absolute", width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,.18)", left: -14, top: "50%", transform: "translateY(-50%)" }} />
                  {filled && <span style={{ position: "absolute", right: 14, bottom: 14, width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,.8)", animation: `pSparkle ${1.6 + piece * 0.1}s ease-in-out infinite` }} />}
                </div>;
              })}
            </div>
            <div style={{ position: "absolute", left: 24, right: 24, bottom: 28 }}><div style={{ color: "#9FB3CD", fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Yapboz görevi</div><div style={{ color: "#fff", fontSize: 30, lineHeight: 1.16, fontWeight: 900 }}>{q.q}</div><div style={{ marginTop: 12, color: ans === null ? "#D6E3FF" : ans === q.a ? "#8CF0B9" : "#FFB0B0", fontSize: 15, lineHeight: 1.55 }}>{status}</div></div>
          </div>
          <div className={`p-card ${shake ? 'p-shake' : ''}`} style={{ padding: 18, display: "grid", gridTemplateRows: "auto auto auto 1fr", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><div><div style={{ color: "#A3B6D4", fontSize: 12, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase" }}>Parça seçim paneli</div><div style={{ color: "#fff", fontSize: 24, fontWeight: 900, marginTop: 4 }}>Eksik parçayı bul</div></div><div style={{ minWidth: 120, textAlign: "right" }}><div style={{ color: "#C9B8FF", fontSize: 22, fontWeight: 900 }}>{Math.round(progress)}%</div><div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,.08)", overflow: "hidden", marginTop: 6 }}><div style={{ width: `${progress}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#A78BFA,#4ECDC4)" }} /></div></div></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>{[["Seviye", tier(qi)],["Tur", `${(qi || 0) + 1}`],["Durum", ans === null ? "Aranıyor" : ans === q.a ? "Tamam" : "Hata"]].map(([label, value]) => <div key={label} style={{ padding: "12px 14px", borderRadius: 16, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}><div style={{ color: "#93A7C4", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</div><div style={{ color: "#fff", fontWeight: 900, fontSize: 16, marginTop: 5 }}>{value}</div></div>)}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><div style={{ padding: "8px 12px", borderRadius: 999, background: "rgba(167,139,250,.10)", border: "1px solid rgba(167,139,250,.18)", color: "#E7D8FF", fontWeight: 800, fontSize: 12 }}>🧩 Parça dedektifi</div><div style={{ padding: "8px 12px", borderRadius: 999, background: "rgba(78,205,196,.10)", border: "1px solid rgba(78,205,196,.18)", color: "#CFFFF9", fontWeight: 800, fontSize: 12 }}>✨ Parıltılı eşleşme</div></div>
            <div className="p-options">
              {q.o.map((option, index) => {
                const isCorrect = index === q.a, isSelected = index === ans, active = hovered === index && ans === null;
                const background = ans === null ? active ? "linear-gradient(135deg, rgba(167,139,250,.28), rgba(78,205,196,.18))" : "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))" : isCorrect ? "linear-gradient(135deg, rgba(46,204,113,.35), rgba(46,204,113,.18))" : isSelected ? "linear-gradient(135deg, rgba(231,76,60,.30), rgba(231,76,60,.14))" : "rgba(255,255,255,.03)";
                return <button key={index} onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)} onClick={() => choose(index)} disabled={ans !== null} style={{ textAlign: "left", borderRadius: 22, border: `1px solid ${isCorrect && ans !== null ? 'rgba(46,204,113,.34)' : isSelected && ans !== null ? 'rgba(231,76,60,.28)' : 'rgba(255,255,255,.08)'}`, background, padding: 16, color: "#fff", minHeight: 124 }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}><div style={{ width: 42, height: 42, borderRadius: 14, display: "grid", placeItems: "center", background: "rgba(0,0,0,.22)", fontWeight: 900 }}>{LETTERS[index]}</div><div style={{ width: 66, height: 50, borderRadius: 18, background: "rgba(255,255,255,.10)", position: "relative" }}><span style={{ position: "absolute", width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,.16)", left: "50%", top: -10, transform: "translateX(-50%)" }} /></div></div><div style={{ color: "#C6D7EE", fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>{index === 0 ? "Köşe Parçası" : index === 1 ? "Renk Parçası" : index === 2 ? "Şekil Parçası" : "Sürpriz Parça"}</div><div style={{ fontSize: 17, fontWeight: 900, lineHeight: 1.35 }}>{option}</div></button>;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
