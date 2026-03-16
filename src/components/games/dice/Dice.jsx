/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { SFX } from "../../../utils/audio";

const LETTERS = ["A", "B", "C", "D"];
const PIPS = {
  1: [[2, 2]],
  2: [[1, 1], [3, 3]],
  3: [[1, 1], [2, 2], [3, 3]],
  4: [[1, 1], [1, 3], [3, 1], [3, 3]],
  5: [[1, 1], [1, 3], [2, 2], [3, 1], [3, 3]],
  6: [[1, 1], [1, 2], [1, 3], [3, 1], [3, 2], [3, 3]],
};
const LANES = [
  { value: 1, points: 50, title: "Mini Başlangıç", aura: "#8BE9FD", note: "Küçük zar ama hâlâ kazanma şansı sende." },
  { value: 2, points: 100, title: "Isınma Turu", aura: "#7CF7C2", note: "Orta güç. Hızlı düşün, puanı kap." },
  { value: 3, points: 150, title: "Güçlü Hamle", aura: "#FFD166", note: "Artık ödül hissi başlıyor." },
  { value: 4, points: 200, title: "Süper Bonus", aura: "#FFB86B", note: "Parlak şerit açıldı. Dikkatli seç." },
  { value: 5, points: 250, title: "Mega Şans", aura: "#C8A6FF", note: "Büyük puan turu. Cevap sahneyi patlatabilir." },
  { value: 6, points: 300, title: "Jackpot", aura: "#FF7FD1", note: "En yüksek ödül geldi. Şimdi yıldız gibi oyna." },
];

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function getLane(dv, wp) {
  return LANES.find((lane) => lane.value === dv) || LANES.find((lane) => lane.points === wp) || LANES[0];
}

export default function Dice({ q, qi, gqs, ans, hWhlAns, swq, wp, dv, dr, hDiceRoll }) {
  const [hovered, setHovered] = useState(null);
  const [screenFx, setScreenFx] = useState(null);
  const [burst, setBurst] = useState(false);
  const [rollPulse, setRollPulse] = useState(false);

  const lane = useMemo(() => getLane(dv, wp), [dv, wp]);
  const reward = wp || lane.points;
  const progress = clamp((((qi || 0) + 1) / (gqs?.length || 1)) * 100, 0, 100);
  const pips = useMemo(() => PIPS[dv] || PIPS[1], [dv]);
  const bonusStars = Math.max(1, Math.min(6, dv));
  const questionNumber = (qi || 0) + 1;
  const totalQuestions = gqs?.length || 1;
  const rollReady = swq && !dr;
  const stageStatus = !swq
    ? "Önce zarı fırlat. Zarın gösterdiği sayı bu turun puan gücünü belirleyecek."
    : ans === null
      ? `${reward} puanlık soru açıldı. Büyük soru paneline bak ve doğru seçeneği yakala.`
      : ans === q?.a
        ? `${reward} puan toplandı. Bu tur çocuklara tatlı bir jackpot hissi verdi.`
        : `Bu turdaki ${reward} puan kaçtı. Yeni zar seni hemen oyuna geri döndürecek.`;

  const sparkles = useMemo(
    () => Array.from({ length: 16 }, (_, i) => ({ id: i, left: 6 + ((i * 11) % 84), top: 10 + ((i * 17) % 70), delay: i * 0.06 })),
    []
  );
  const confetti = useMemo(
    () => Array.from({ length: 22 }, (_, i) => ({ id: i, left: 4 + ((i * 9) % 90), delay: i * 0.05, duration: 1.25 + (i % 5) * 0.14 })),
    []
  );

  useEffect(() => {
    setHovered(null);
    setScreenFx(null);
    setBurst(false);
    setRollPulse(false);
  }, [qi, swq]);

  useEffect(() => {
    if (!rollReady || ans !== null) return;
    setRollPulse(true);
    if (dv >= 6) SFX.diceJackpot?.();
    else if (dv >= 4) SFX.reveal?.();
    else SFX.sparkle?.();
    const t = setTimeout(() => setRollPulse(false), 980);
    return () => clearTimeout(t);
  }, [rollReady, ans, dv]);

  useEffect(() => {
    if (ans === null || !q) return;
    if (ans === q.a) {
      setBurst(true);
      setScreenFx("correct");
      if (dv >= 5) SFX.diceJackpot?.();
      else SFX.sparkle?.();
      const t = setTimeout(() => {
        setBurst(false);
        setScreenFx(null);
      }, 1200);
      return () => clearTimeout(t);
    }

    setScreenFx("wrong");
    SFX.diceMiss?.();
    const t = setTimeout(() => setScreenFx(null), 1000);
    return () => clearTimeout(t);
  }, [ans, q, dv]);

  useEffect(() => {
    if (!q) return undefined;

    const onKeyDown = (event) => {
      const key = event.key.toLowerCase();
      if (!swq && !dr && [" ", "enter", "r"].includes(key)) {
        event.preventDefault();
        hDiceRoll?.();
        return;
      }

      if (!swq || ans !== null) return;

      if (/[1-4]/.test(key)) {
        event.preventDefault();
        hWhlAns?.(Number(key) - 1);
        return;
      }

      const letterIndex = LETTERS.map((letter) => letter.toLowerCase()).indexOf(key);
      if (letterIndex >= 0) {
        event.preventDefault();
        hWhlAns?.(letterIndex);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [q, swq, dr, ans, hDiceRoll, hWhlAns]);

  if (!q) return null;

  const choose = (index) => {
    if (ans !== null || !swq) return;
    SFX.click?.();
    hWhlAns(index);
  };

  const dieHalo = `0 0 0 10px ${lane.aura}1f, 0 24px 60px rgba(0,0,0,.28), 0 0 70px ${lane.aura}28`;

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gap: 14, animation: "fadeUp .35s ease" }}>
      <style>{`
        @keyframes diceFloat { 0%,100%{transform:translateY(0) rotateX(-14deg) rotateY(18deg)} 50%{transform:translateY(-8px) rotateX(-10deg) rotateY(24deg)} }
        @keyframes diceSpin { from { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);} to { transform: rotateX(720deg) rotateY(900deg) rotateZ(180deg);} }
        @keyframes pulseRing { 0% { transform: scale(.82); opacity: .76; } 100% { transform: scale(1.55); opacity: 0; } }
        @keyframes confettiFall { 0% { transform: translate3d(0,-10px,0) rotate(0deg) scale(.9); opacity: 0; } 15% { opacity: 1; } 100% { transform: translate3d(0,240px,0) rotate(240deg) scale(1.15); opacity: 0; } }
        @keyframes floatSparkle { 0%,100% { transform: translateY(0) scale(.9); opacity: .55; } 50% { transform: translateY(-10px) scale(1.15); opacity: 1; } }
        @keyframes screenCelebrate { 0% { opacity: 0; transform: scale(.96); } 35% { opacity: 1; } 100% { opacity: 0; transform: scale(1.06); } }
        @keyframes flashBadge { 0%{ transform: scale(.7); opacity: 0; } 18%{ opacity: 1; } 100%{ transform: scale(1.35); opacity: 0; } }
        .dice-card { backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); border: 1px solid rgba(255,255,255,.09); background: linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03)); box-shadow: 0 18px 44px rgba(0,0,0,.2); border-radius: 30px; }
        .dice-options { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .dice-layout { display:grid; grid-template-columns: minmax(0, 1.08fr) minmax(390px, .92fr); gap: 14px; }
        @media (max-width: 1160px){ .dice-layout { grid-template-columns: 1fr; } }
        @media (max-width: 760px){ .dice-options { grid-template-columns: 1fr; } }
      `}</style>

      {screenFx && (
        <div style={{ position: "fixed", inset: 0, zIndex: 55, pointerEvents: "none", display: "grid", placeItems: "center" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                screenFx === "correct"
                  ? "radial-gradient(circle at center, rgba(255,255,255,.14), rgba(46,204,113,.18), rgba(11,17,34,0))"
                  : "radial-gradient(circle at center, rgba(255,255,255,.08), rgba(231,76,60,.18), rgba(11,17,34,0))",
              animation: "screenCelebrate .9s ease-out forwards",
            }}
          />
          <div
            style={{
              padding: "18px 30px",
              borderRadius: 999,
              background: screenFx === "correct" ? "rgba(46,204,113,.20)" : "rgba(231,76,60,.18)",
              border: `1px solid ${screenFx === "correct" ? "rgba(46,204,113,.34)" : "rgba(231,76,60,.28)"}`,
              color: "#fff",
              fontWeight: 900,
              letterSpacing: ".06em",
              textTransform: "uppercase",
              animation: "flashBadge .9s ease-out forwards",
              boxShadow: screenFx === "correct" ? "0 20px 40px rgba(46,204,113,.22)" : "0 20px 40px rgba(231,76,60,.20)",
            }}
          >
            {screenFx === "correct" ? "Jackpot Başarısı" : "Tur Kaçtı"}
          </div>
        </div>
      )}

      <div
        className="dice-card"
        style={{
          padding: 18,
          background: "linear-gradient(135deg, rgba(26,18,62,.92), rgba(6,18,40,.96))",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 18% 18%, ${lane.aura}26, transparent 24%), radial-gradient(circle at 85% 12%, rgba(255,255,255,.12), transparent 20%)` }} />
        <div style={{ position: "relative", display: "grid", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ color: "#B8C8E8", fontSize: 12, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase" }}>Şimdi cevaplanacak soru</div>
              <div style={{ color: "#fff", fontSize: 17, fontWeight: 800, marginTop: 5 }}>Zar sonucu geldikten sonra aşağıdaki seçeneklerden doğru cevabı seç.</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div style={{ padding: "10px 14px", borderRadius: 999, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.08)", color: "#fff", fontWeight: 900 }}>{questionNumber}. soru</div>
              <div style={{ padding: "10px 14px", borderRadius: 999, background: `${lane.aura}24`, border: `1px solid ${lane.aura}44`, color: "#fff", fontWeight: 900 }}>{reward} puan turu</div>
            </div>
          </div>

          <div style={{ padding: "18px 20px", borderRadius: 24, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.10)", boxShadow: `0 10px 36px ${lane.aura}10` }}>
            <div style={{ color: "#D8E3F8", fontSize: 12, fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 10 }}>Oyuncu soru cümlesini aramasın diye büyük soru paneli</div>
            <div style={{ color: "#fff", fontSize: 30, lineHeight: 1.28, fontWeight: 950, letterSpacing: "-.01em", textShadow: "0 8px 22px rgba(0,0,0,.26)" }}>{q.q}</div>
          </div>
        </div>
      </div>

      <div className="dice-layout">
        <div className="dice-card" style={{ padding: 16, position: "relative", overflow: "hidden", minHeight: 590 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(circle at 20% 14%, ${lane.aura}24, transparent 22%), linear-gradient(140deg, rgba(35,24,85,.96), rgba(8,22,49,.98))`,
            }}
          />
          {sparkles.map((sparkle) => (
            <span
              key={sparkle.id}
              style={{
                position: "absolute",
                left: `${sparkle.left}%`,
                top: `${sparkle.top}%`,
                width: 8 + (sparkle.id % 3) * 4,
                height: 8 + (sparkle.id % 3) * 4,
                borderRadius: "50%",
                background: sparkle.id % 2 ? lane.aura : "rgba(255,255,255,.9)",
                opacity: 0.75,
                filter: "blur(.2px)",
                animation: `floatSparkle ${2.2 + sparkle.delay}s ease-in-out ${sparkle.delay}s infinite`,
              }}
            />
          ))}
          {ans === q.a && burst && confetti.map((piece, index) => (
            <span
              key={piece.id}
              style={{
                position: "absolute",
                left: `${piece.left}%`,
                top: 72,
                width: 10 + (index % 3) * 4,
                height: 18 + (index % 2) * 6,
                borderRadius: 999,
                background: index % 3 === 0 ? lane.aura : index % 2 ? "#FFD166" : "#4ECDC4",
                animation: `confettiFall ${piece.duration}s linear ${piece.delay}s forwards`,
              }}
            />
          ))}

          <div style={{ position: "relative", display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 10 }}>
              {[
                [`Tur ${questionNumber}`, `${totalQuestions} soru`],
                [`${dv}`, "zar yüzü"],
                [`${reward}`, "puan"],
                [lane.title, "ödül yolu"],
              ].map(([big, small]) => (
                <div key={`${big}-${small}`} style={{ padding: "12px 12px", borderRadius: 18, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)" }}>
                  <div style={{ color: "#fff", fontWeight: 900, fontSize: 15 }}>{big}</div>
                  <div style={{ color: "#9FB3CD", fontSize: 11, marginTop: 4, textTransform: "uppercase", letterSpacing: ".08em" }}>{small}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 18, alignItems: "stretch" }}>
              <div style={{ padding: "18px 18px 14px", borderRadius: 24, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", minHeight: 290, display: "grid", alignContent: "space-between" }}>
                <div>
                  <div style={{ color: lane.aura, fontSize: 12, fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>Zar turu sahnesi</div>
                  <div style={{ color: "#fff", fontSize: 32, fontWeight: 950, lineHeight: 1.12 }}>{lane.title}</div>
                  <div style={{ color: "#D5E1F7", fontSize: 16, lineHeight: 1.55, marginTop: 12 }}>{stageStatus}</div>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0,1fr))", gap: 8 }}>
                    {LANES.map((item) => {
                      const active = item.value === dv;
                      return (
                        <div
                          key={item.value}
                          style={{
                            padding: "10px 8px",
                            borderRadius: 18,
                            border: `1px solid ${active ? `${item.aura}66` : "rgba(255,255,255,.08)"}`,
                            background: active ? `${item.aura}26` : "rgba(255,255,255,.04)",
                            boxShadow: active ? `0 10px 24px ${item.aura}22` : "none",
                            textAlign: "center",
                          }}
                        >
                          <div style={{ color: "#fff", fontSize: 20, fontWeight: 950 }}>{item.value}</div>
                          <div style={{ color: "#BFD0E8", fontSize: 11, fontWeight: 800 }}>{item.points} P</div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ padding: 14, borderRadius: 18, background: "rgba(0,0,0,.20)", border: "1px solid rgba(255,255,255,.08)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#C6D7EE", fontWeight: 800, fontSize: 13, marginBottom: 8 }}>
                      <span>İlerleme</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
                      <div style={{ width: `${progress}%`, height: "100%", background: `linear-gradient(90deg, #4ECDC4, ${lane.aura}, #FFD166)` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ position: "relative", minHeight: 320, display: "grid", placeItems: "center", perspective: 1000 }}>
                {rollPulse && Array.from({ length: 3 }).map((_, index) => (
                  <span
                    key={index}
                    style={{
                      position: "absolute",
                      width: 180,
                      height: 180,
                      borderRadius: "50%",
                      border: `2px solid ${lane.aura}`,
                      animation: `pulseRing ${1 + index * 0.12}s ease-out ${index * 0.08}s forwards`,
                      opacity: 0,
                    }}
                  />
                ))}
                <div
                  style={{
                    position: "relative",
                    width: 250,
                    height: 250,
                    transformStyle: "preserve-3d",
                    animation: dr ? "diceSpin .9s linear infinite" : "diceFloat 2.7s ease-in-out infinite",
                    transform: "rotateX(-14deg) rotateY(18deg)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 40,
                      background: "linear-gradient(145deg, #ffffff, #dce6ff 60%, #c9d7ff)",
                      boxShadow: dieHalo,
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ position: "absolute", inset: 10, borderRadius: 32, border: "1px solid rgba(255,255,255,.85)" }} />
                    {pips.map(([x, y], index) => (
                      <span
                        key={index}
                        style={{
                          position: "absolute",
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          left: `${x * 25}%`,
                          top: `${y * 25}%`,
                          transform: "translate(-50%, -50%)",
                          background: lane.aura,
                          boxShadow: `0 6px 16px ${lane.aura}66, inset 0 -2px 4px rgba(0,0,0,.25)`,
                        }}
                      />
                    ))}
                    {burst && Array.from({ length: 4 }).map((_, index) => (
                      <span
                        key={index}
                        style={{
                          position: "absolute",
                          inset: 34,
                          borderRadius: 34,
                          border: "2px solid rgba(255,255,255,.95)",
                          animation: `pulseRing ${0.9 + index * 0.1}s ease-out ${index * 0.07}s forwards`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ position: "absolute", bottom: 18, left: 0, right: 0, textAlign: "center" }}>
                  <div style={{ color: lane.aura, fontSize: 13, fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase" }}>Zar sonucu</div>
                  <div style={{ color: "#fff", fontSize: 44, fontWeight: 950, lineHeight: 1 }}>{dv}</div>
                  <div style={{ color: "#D4DDF0", fontSize: 15, marginTop: 6 }}>{lane.note}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="dice-card" style={{ padding: 18, display: "grid", gridTemplateRows: "auto auto auto 1fr", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ color: "#A3B6D4", fontSize: 12, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase" }}>Kontrol paneli</div>
              <div style={{ color: "#fff", fontSize: 26, fontWeight: 950, marginTop: 4 }}>{swq ? "Cevabı seç" : dr ? "Zar dönüyor" : "Zarı fırlat"}</div>
            </div>
            <button
              onClick={hDiceRoll}
              disabled={dr || swq}
              style={{
                padding: "15px 20px",
                borderRadius: 18,
                border: "none",
                cursor: dr || swq ? "default" : "pointer",
                background: dr || swq ? "rgba(255,255,255,.06)" : `linear-gradient(135deg, ${lane.aura}, #FFD166)`,
                color: dr || swq ? "#67768f" : "#1B1731",
                fontWeight: 950,
                fontSize: 16,
                boxShadow: !dr && !swq ? `0 18px 36px ${lane.aura}33` : "none",
              }}
            >
              {dr ? "🎲 Zar dönüyor..." : swq ? "✅ Zar atıldı" : "🎲 Zarı At"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>
            {[
              ["Kısayol", !swq ? "Space / Enter" : "1-4 veya A-D"],
              ["Puan", `${reward} puan`],
              ["Tur", lane.title],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: "12px 14px", borderRadius: 16, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}>
                <div style={{ color: "#93A7C4", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</div>
                <div style={{ color: "#fff", fontWeight: 900, fontSize: 16, marginTop: 5 }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Array.from({ length: bonusStars }).map((_, index) => (
                <div key={index} style={{ padding: "8px 12px", borderRadius: 999, background: `${lane.aura}1f`, border: `1px solid ${lane.aura}44`, color: "#fff", fontWeight: 800, fontSize: 12 }}>
                  ⭐ Güç {index + 1}
                </div>
              ))}
            </div>
            <div style={{ padding: 14, borderRadius: 18, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", color: "#D5E1F7", fontSize: 14, lineHeight: 1.55 }}>
              <div style={{ color: lane.aura, fontWeight: 900, marginBottom: 6 }}>Çocuk dostu oyun akışı</div>
              Zar at ➜ büyük soru paneline bak ➜ doğru şıkkı seç ➜ efekt ve puanı anında gör.
            </div>
          </div>

          <div className="dice-options">
            {q.o.map((option, index) => {
              const isCorrect = index === q.a;
              const isSelected = index === ans;
              const active = hovered === index && swq && ans === null;
              const background = !swq
                ? "rgba(255,255,255,.03)"
                : ans === null
                  ? active
                    ? `linear-gradient(135deg, ${lane.aura}38, rgba(108,92,231,.18))`
                    : "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))"
                  : isCorrect
                    ? "linear-gradient(135deg, rgba(46,204,113,.35), rgba(46,204,113,.18))"
                    : isSelected
                      ? "linear-gradient(135deg, rgba(231,76,60,.30), rgba(231,76,60,.14))"
                      : "rgba(255,255,255,.03)";

              return (
                <button
                  key={index}
                  onMouseEnter={() => setHovered(index)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => choose(index)}
                  disabled={!swq || ans !== null}
                  style={{
                    textAlign: "left",
                    borderRadius: 24,
                    border: `1px solid ${isCorrect && ans !== null ? "rgba(46,204,113,.34)" : isSelected && ans !== null ? "rgba(231,76,60,.28)" : active ? `${lane.aura}66` : "rgba(255,255,255,.08)"}`,
                    background,
                    padding: 16,
                    color: "#fff",
                    minHeight: 136,
                    opacity: !swq ? 0.66 : 1,
                    boxShadow: active ? `0 16px 34px ${lane.aura}22` : "none",
                    transition: "transform .16s ease, box-shadow .16s ease, border-color .16s ease",
                    transform: active ? "translateY(-2px)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, display: "grid", placeItems: "center", background: "rgba(0,0,0,.22)", fontWeight: 950, fontSize: 18 }}>{LETTERS[index]}</div>
                    <div style={{ padding: "8px 10px", borderRadius: 999, background: `${lane.aura}20`, border: `1px solid ${lane.aura}44`, fontWeight: 900, fontSize: 12 }}>{reward} P</div>
                  </div>
                  <div style={{ color: lane.aura, fontSize: 11, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>
                    {index === 0 ? "Parlak seçenek" : index === 1 ? "Güçlü hamle" : index === 2 ? "Şans kapısı" : "Final cevabı"}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 950, lineHeight: 1.38, wordBreak: "break-word" }}>{option}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
