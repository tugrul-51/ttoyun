/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { SFX } from "../../../utils/audio";

const LETTERS = ["A", "B", "C", "D"];
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function rewardLabel(value) { if (value >= 6) return "Efsane Tur"; if (value >= 5) return "Büyük Bonus"; if (value >= 3) return "Güçlü Hamle"; return "Standart Tur"; }
function laneLabel(value) { if (value >= 6) return "Gökkuşağı Jackpot"; if (value >= 4) return "Süper Çarpan"; return "Neşeli Kazanç"; }

export default function Dice({ q, qi, gqs, ans, hWhlAns, swq, wp, dv, dr, hDiceRoll }) {
  const [hovered, setHovered] = useState(null);
  const [burst, setBurst] = useState(false);

  useEffect(() => { setHovered(null); setBurst(false); }, [qi, swq]);
  useEffect(() => {
    if (ans === null || !q) return;
    if (ans === q.a) {
      setBurst(true);
      SFX.dice?.();
      const t = setTimeout(() => setBurst(false), 1000);
      return () => clearTimeout(t);
    }
  }, [ans, q]);

  const progress = clamp((((qi || 0) + 1) / (gqs?.length || 1)) * 100, 0, 100);
  const reward = wp || dv * 100;
  const bonusStars = Math.max(1, Math.min(5, Math.ceil(dv / 2)));
  const status = !swq ? "Önce zarı at. Gelen sayı bu turun puanını ve bonus ışıklarını belirler." : ans === null ? `Bu tur ${reward} puan değerinde. En parlak seçeneği bul.` : ans === q?.a ? `${reward} puan kasaya girdi. Bonus yıldızlar açıldı.` : `Bu tur ${reward} puan kaçtı ama yeni tur seni bekliyor.`;
  const pips = useMemo(() => ({1:[[2,2]],2:[[1,1],[3,3]],3:[[1,1],[2,2],[3,3]],4:[[1,1],[1,3],[3,1],[3,3]],5:[[1,1],[1,3],[2,2],[3,1],[3,3]],6:[[1,1],[1,2],[1,3],[3,1],[3,2],[3,3]]})[dv] || [[2,2]], [dv]);
  const confetti = useMemo(() => Array.from({ length: 12 }).map((_, i) => ({ id: i, left: 14 + (i * 7) % 72, delay: i * 0.08 })), []);
  if (!q) return null;
  const choose = (index) => { if (ans !== null || !swq) return; SFX.click?.(); hWhlAns(index); };
  const dieHalo = dv >= 5 ? "rgba(255,209,102,.12)" : "rgba(108,92,231,.10)";
  const dieShadow = `0 26px 50px rgba(0,0,0,.28), 0 0 0 10px ${dieHalo}`;

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 14, animation: "fadeUp .35s ease" }}>
      <style>{`
        @keyframes dFloat { 0%,100%{transform:translateY(0) rotateX(-12deg) rotateY(18deg)} 50%{transform:translateY(-6px) rotateX(-12deg) rotateY(24deg)} }
        @keyframes dSpin { from { transform: rotateX(0deg) rotateY(0deg);} to { transform: rotateX(540deg) rotateY(720deg);} }
        @keyframes dBurst { from { transform: scale(.6); opacity:.8; } to { transform: scale(1.8); opacity:0; } }
        @keyframes dConfetti { 0% { transform: translateY(0) rotate(0deg); opacity:0; } 20% { opacity:1; } 100% { transform: translateY(180px) rotate(240deg); opacity:0; } }
        .d-card { backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border:1px solid rgba(255,255,255,.08); background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03)); box-shadow: 0 18px 40px rgba(0,0,0,.18); border-radius: 28px; }
        .d-options { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:12px; }
        @media (max-width: 920px){ .d-layout { grid-template-columns: 1fr !important; } }
      `}</style>
      <div className="d-card" style={{ padding: 16 }}>
        <div className="d-layout" style={{ display: "grid", gridTemplateColumns: "1.02fr .98fr", gap: 14 }}>
          <div style={{ minHeight: 420, position: "relative", overflow: "hidden", borderRadius: 24, background: "radial-gradient(circle at 25% 10%, rgba(255,255,255,.16), transparent 20%), linear-gradient(135deg, rgba(40,22,82,.94), rgba(7,20,47,.96))", border: "1px solid rgba(255,255,255,.08)" }}>
            {ans === q.a && burst && confetti.map((piece, i) => <span key={piece.id} style={{ position: "absolute", left: `${piece.left}%`, top: 64, width: 10 + (i % 3) * 4, height: 18, borderRadius: 999, background: i % 2 ? "#FFD166" : i % 3 ? "#A78BFA" : "#4ECDC4", animation: `dConfetti ${1.5 + piece.delay}s linear ${piece.delay}s forwards` }} />)}
            <div style={{ position: "absolute", top: 18, left: 18, right: 18, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
              {[[`Tur ${(qi || 0) + 1}`, `${gqs?.length || 1} soru`],[`${dv}`, "zar değeri"],[`${reward}`, "puan"],[rewardLabel(dv), "ödül"]].map(([big, small]) => <div key={big + small} style={{ padding: "10px 12px", borderRadius: 18, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)" }}><div style={{ color: "#fff", fontWeight: 900, fontSize: 15 }}>{big}</div><div style={{ color: "#9FB3CD", fontSize: 11, marginTop: 4, textTransform: "uppercase", letterSpacing: ".08em" }}>{small}</div></div>)}
            </div>
            <div style={{ position: "absolute", left: 32, bottom: 34, maxWidth: 430 }}><div style={{ color: "#9FB3CD", fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Bonus turu</div><div style={{ color: "#fff", fontSize: 30, lineHeight: 1.16, fontWeight: 900 }}>{q.q}</div><div style={{ marginTop: 12, color: swq ? (ans === null ? "#CFE4FF" : ans === q.a ? "#8CF0B9" : "#FFB0B0") : "#FFE9A3", fontSize: 15, lineHeight: 1.55 }}>{status}</div></div>
            <div style={{ position: "absolute", right: 46, top: 106, width: 230, height: 230, perspective: 900 }}><div style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d", animation: dr ? "dSpin .95s linear infinite" : "dFloat 2.8s ease-in-out infinite", transform: "rotateX(-12deg) rotateY(18deg)" }}><div style={{ position: "absolute", inset: 0, borderRadius: 36, background: "linear-gradient(145deg, #fff, #dfe7ff)", boxShadow: dieShadow }}>{pips.map(([x, y], i) => <span key={i} style={{ position: "absolute", width: 26, height: 26, borderRadius: "50%", left: `${x * 25}%`, top: `${y * 25}%`, transform: "translate(-50%, -50%)", background: dv >= 5 ? "#F39C12" : "#4ECDC4", boxShadow: "0 4px 10px rgba(0,0,0,.18)" }} />)}{burst && Array.from({ length: 3 }).map((_, i) => <span key={i} style={{ position: "absolute", inset: 32, borderRadius: 32, border: "2px solid rgba(255,255,255,.95)", animation: `dBurst ${0.95 + i * 0.1}s ease-out ${i * 0.08}s forwards` }} />)}</div></div></div>
            <div style={{ position: "absolute", right: 36, bottom: 28, width: 260 }}><div style={{ display: "flex", justifyContent: "space-between", color: "#C6D7EE", fontWeight: 800, fontSize: 13, marginBottom: 8 }}><span>İlerleme</span><span>{Math.round(progress)}%</span></div><div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,.08)", overflow: "hidden" }}><div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg,#FFD166,#A78BFA,#4ECDC4)" }} /></div></div>
          </div>
          <div className="d-card" style={{ padding: 18, display: "grid", gridTemplateRows: "auto auto auto 1fr", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><div><div style={{ color: "#A3B6D4", fontSize: 12, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase" }}>Ödül kontrol paneli</div><div style={{ color: "#fff", fontSize: 24, fontWeight: 900, marginTop: 4 }}>{swq ? "Cevabı Seç" : "Zarı Fırlat"}</div></div><button onClick={hDiceRoll} disabled={dr || swq} style={{ padding: "14px 18px", borderRadius: 18, border: "none", cursor: dr || swq ? "default" : "pointer", background: dr || swq ? "rgba(255,255,255,.06)" : "linear-gradient(135deg,#FFD166,#F39C12)", color: dr || swq ? "#67768f" : "#1B1731", fontWeight: 900, fontSize: 16, boxShadow: !dr && !swq ? "0 18px 36px rgba(243,156,18,.22)" : "none" }}>{dr ? "Zar dönüyor..." : swq ? "Zar atıldı" : "🎲 Zarı At"}</button></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>{[["Zar", `${dv}`],["Tur puanı", `${reward}`],["Etiket", laneLabel(dv)]].map(([label, value]) => <div key={label} style={{ padding: "12px 14px", borderRadius: 16, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}><div style={{ color: "#93A7C4", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</div><div style={{ color: "#fff", fontWeight: 900, fontSize: 16, marginTop: 5 }}>{value}</div></div>)}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{Array.from({ length: bonusStars }).map((_, i) => <div key={i} style={{ padding: "8px 12px", borderRadius: 999, background: "rgba(255,209,102,.14)", border: "1px solid rgba(255,209,102,.20)", color: "#FFE39A", fontWeight: 800, fontSize: 12 }}>⭐ Bonus {i + 1}</div>)}</div>
            <div className="d-options">{q.o.map((option, index) => { const isCorrect = index === q.a, isSelected = index === ans, active = hovered === index && swq && ans === null; const background = !swq ? "rgba(255,255,255,.03)" : ans === null ? active ? "linear-gradient(135deg, rgba(255,209,102,.28), rgba(108,92,231,.18))" : "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))" : isCorrect ? "linear-gradient(135deg, rgba(46,204,113,.35), rgba(46,204,113,.18))" : isSelected ? "linear-gradient(135deg, rgba(231,76,60,.30), rgba(231,76,60,.14))" : "rgba(255,255,255,.03)"; return <button key={index} onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)} onClick={() => choose(index)} disabled={!swq || ans !== null} style={{ textAlign: "left", borderRadius: 22, border: `1px solid ${isCorrect && ans !== null ? 'rgba(46,204,113,.34)' : isSelected && ans !== null ? 'rgba(231,76,60,.28)' : 'rgba(255,255,255,.08)'}`, background, padding: 16, color: "#fff", minHeight: 122, opacity: !swq ? .66 : 1 }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}><div style={{ width: 42, height: 42, borderRadius: 14, display: "grid", placeItems: "center", background: "rgba(0,0,0,.22)", fontWeight: 900 }}>{LETTERS[index]}</div><div style={{ padding: "8px 10px", borderRadius: 999, background: "rgba(255,255,255,.08)", fontWeight: 900, fontSize: 12 }}>{reward} P</div></div><div style={{ color: "#C6D7EE", fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>{index === 0 ? "Mini Bonus" : index === 1 ? "Sürpriz Hamle" : index === 2 ? "Güç Penceresi" : "Jackpot Şansı"}</div><div style={{ fontSize: 17, fontWeight: 900, lineHeight: 1.35 }}>{option}</div></button>; })}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
