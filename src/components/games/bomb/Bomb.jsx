/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useRef, useState } from "react";
import { SFX } from "../../../utils/audio";

const LETTERS = ["A", "B", "C", "D"];
const WIRES = [
  { color: "#FF6B6B", aura: "rgba(255,107,107,.42)", glow: "#ff8a8a" },
  { color: "#4DA3FF", aura: "rgba(77,163,255,.42)", glow: "#86c5ff" },
  { color: "#3DDC97", aura: "rgba(61,220,151,.42)", glow: "#8ff0c1" },
  { color: "#FFD166", aura: "rgba(255,209,102,.42)", glow: "#ffe7a5" },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function timeTone(seconds) {
  if (seconds >= 10) return { label: "Kontrollü", color: "#7CF7C2", ring: "rgba(124,247,194,.4)" };
  if (seconds >= 6) return { label: "Dikkat", color: "#FFD166", ring: "rgba(255,209,102,.42)" };
  return { label: "Kritik", color: "#FF7B7B", ring: "rgba(255,123,123,.4)" };
}

export default function Bomb({ q, qi, gqs, ans, hAns, bombT = 0 }) {
  const [hovered, setHovered] = useState(null);
  const [screenFx, setScreenFx] = useState(null);
  const [shake, setShake] = useState(false);
  const [selectedWire, setSelectedWire] = useState(null);
  const heartbeatRef = useRef(null);

  const totalQuestions = gqs?.length || 1;
  const questionNumber = (qi || 0) + 1;
  const progress = clamp((questionNumber / totalQuestions) * 100, 0, 100);
  const risk = clamp(34 + (qi || 0) * 7, 34, 98);
  const safeBombT = typeof bombT === "number" ? bombT : 0;
  const timeMeta = timeTone(safeBombT);
  const urgency = clamp(100 - (safeBombT / 20) * 100, 12, 100);
  const tension = clamp(32 + (100 - safeBombT * 4) + (qi || 0) * 4, 26, 100);

  const wires = useMemo(
    () =>
      (q?.o || []).map((option, index) => ({
        option,
        index,
        ...WIRES[index % WIRES.length],
      })),
    [q]
  );

  const particles = useMemo(
    () => Array.from({ length: 20 }, (_, index) => ({ id: index, left: 5 + ((index * 9) % 90), delay: index * 0.05, top: 8 + ((index * 13) % 70) })),
    []
  );

  const sparks = useMemo(
    () => Array.from({ length: 18 }, (_, index) => ({ id: index, left: 8 + ((index * 11) % 86), delay: index * 0.04 })),
    []
  );

  const debris = useMemo(
    () =>
      Array.from({ length: 22 }, (_, index) => ({
        id: index,
        left: 14 + ((index * 7) % 72),
        size: 8 + (index % 4) * 3,
        delay: index * 0.025,
        rotate: -48 + index * 9,
      })),
    []
  );

  useEffect(() => {
    setHovered(null);
    setScreenFx(null);
    setShake(false);
    setSelectedWire(null);
    heartbeatRef.current = null;
  }, [qi]);

  useEffect(() => {
    if (ans === null || !q) return undefined;

    if (ans === q.a) {
      setScreenFx("correct");
      SFX.correct?.();
      setTimeout(() => SFX.sparkle?.(), 120);
      const timeoutId = setTimeout(() => setScreenFx(null), 1050);
      return () => clearTimeout(timeoutId);
    }

    setShake(true);
    setScreenFx("wrong");
    SFX.bomb?.();
    setTimeout(() => SFX.bombBlast?.(), 70);
    setTimeout(() => SFX.explosion?.(), 140);
    const shakeTimeout = setTimeout(() => setShake(false), 520);
    const fxTimeout = setTimeout(() => setScreenFx(null), 1320);
    return () => {
      clearTimeout(shakeTimeout);
      clearTimeout(fxTimeout);
    };
  }, [ans, q]);

  useEffect(() => {
    if (ans !== null || safeBombT <= 0) return;
    if (safeBombT <= 5 && heartbeatRef.current !== safeBombT) {
      heartbeatRef.current = safeBombT;
      SFX.heartbeat?.();
    }
  }, [safeBombT, ans]);

  useEffect(() => {
    if (!q || ans !== null) return undefined;

    const onKeyDown = (event) => {
      const key = event.key.toLowerCase();
      if (/[1-4]/.test(key)) {
        event.preventDefault();
        const index = Number(key) - 1;
        setSelectedWire(index);
        SFX.click?.();
        hAns(index);
        return;
      }

      const letterIndex = LETTERS.map((letter) => letter.toLowerCase()).indexOf(key);
      if (letterIndex >= 0) {
        event.preventDefault();
        setSelectedWire(letterIndex);
        SFX.click?.();
        hAns(letterIndex);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [q, ans, hAns]);

  if (!q) return null;

  const status =
    ans === null
      ? "Büyük soru paneline bak, doğru seçeneği kablo gibi düşün ve süre bitmeden sistemi güvenli moda al."
      : ans === q.a
        ? "Harika. Doğru kablo seçildi ve düzenek güvenli moda geçti."
        : "Yanlış kablo seçildi. Alarm tetiklendi ama tur tamamlandı; sıradaki soruda yeniden deneyeceksin.";

  const cut = (index) => {
    if (ans !== null) return;
    setSelectedWire(index);
    SFX.click?.();
    SFX.pop?.();
    hAns(index);
  };

  const stageBadge = ans === null ? `${safeBombT} sn` : ans === q.a ? "Güvenli" : "Alarm";
  const selectedCorrect = ans !== null && ans === q.a;

  return (
    <div style={{ maxWidth: 1260, margin: "0 auto", display: "grid", gap: 14, animation: "fadeUp .35s ease" }}>
      <style>{`
        @keyframes bombPulse { 0%,100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,90,90,.18); } 50% { transform: scale(1.03); box-shadow: 0 0 0 24px rgba(255,90,90,0); } }
        @keyframes bombBlink { 0%,100% { opacity: .32; } 50% { opacity: 1; } }
        @keyframes bombShake { 0%,100% { transform: translateX(0); } 18% { transform: translateX(-8px); } 36% { transform: translateX(7px); } 54% { transform: translateX(-6px); } 72% { transform: translateX(4px); } }
        @keyframes wireFloat { 0%,100% { transform: translateY(0); opacity: .65; } 50% { transform: translateY(-8px); opacity: 1; } }
        @keyframes sparkFly { 0% { transform: translate3d(0,0,0) scale(.7) rotate(0deg); opacity: 0; } 12% { opacity: 1; } 100% { transform: translate3d(0,260px,0) scale(1.15) rotate(220deg); opacity: 0; } }
        @keyframes sweep { from { transform: translateX(-120%); } to { transform: translateX(120%); } }
        @keyframes overlayPulse { 0% { opacity: 0; transform: scale(.94); } 20% { opacity: 1; } 100% { opacity: 0; transform: scale(1.08); } }
        @keyframes ringGrow { 0% { transform: scale(.75); opacity: .8; } 100% { transform: scale(1.45); opacity: 0; } }
        @keyframes blastFlash { 0% { opacity: 0; } 15% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes shockWave { 0% { transform: scale(.16); opacity: .95; } 70% { opacity: .45; } 100% { transform: scale(1.7); opacity: 0; } }
        @keyframes debrisBurst { 0% { transform: translate3d(0,0,0) scale(.6) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 100% { transform: translate3d(calc((var(--dx) * 1px)), calc((var(--dy) * 1px)), 0) scale(1.08) rotate(calc(var(--rot) * 1deg)); opacity: 0; } }
        @keyframes blastCloud { 0% { transform: scale(.3); opacity: 0; } 20% { opacity: .95; } 100% { transform: scale(1.35); opacity: 0; } }
        .bomb-card { backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); border: 1px solid rgba(255,255,255,.09); background: linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03)); box-shadow: 0 18px 44px rgba(0,0,0,.2); border-radius: 30px; }
        .bomb-layout { display: grid; grid-template-columns: minmax(0, 1.04fr) minmax(390px, .96fr); gap: 14px; }
        .bomb-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        @media (max-width: 1160px) { .bomb-layout { grid-template-columns: 1fr; } }
        @media (max-width: 760px) { .bomb-options { grid-template-columns: 1fr; } }
      `}</style>

      {screenFx && (
        <div style={{ position: "fixed", inset: 0, zIndex: 70, pointerEvents: "none", display: "grid", placeItems: "center" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                screenFx === "correct"
                  ? "radial-gradient(circle at center, rgba(255,255,255,.15), rgba(61,220,151,.2), rgba(7,14,28,0))"
                  : "radial-gradient(circle at center, rgba(255,248,208,.22), rgba(255,120,60,.26), rgba(7,14,28,0))",
              animation: screenFx === "correct" ? "overlayPulse .95s ease-out forwards" : "blastFlash 1.12s ease-out forwards",
            }}
          />
          {screenFx === "wrong" && (
            <>
              <div
                style={{
                  position: "absolute",
                  width: 280,
                  height: 280,
                  borderRadius: "50%",
                  border: "20px solid rgba(255,205,124,.45)",
                  boxShadow: "0 0 90px rgba(255,133,72,.32)",
                  animation: "shockWave .92s ease-out forwards",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  width: 220,
                  height: 220,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(255,244,214,.98) 0%, rgba(255,182,92,.82) 26%, rgba(255,96,66,.62) 52%, rgba(255,96,66,0) 74%)",
                  filter: "blur(1px)",
                  animation: "blastCloud .92s ease-out forwards",
                }}
              />
              <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                {debris.map((piece, index) => (
                  <span
                    key={`blast-${piece.id}`}
                    style={{
                      position: "absolute",
                      left: `${piece.left}%`,
                      top: "50%",
                      width: piece.size,
                      height: piece.size * (index % 2 ? 1.8 : 1.2),
                      borderRadius: index % 3 === 0 ? 999 : 3,
                      background: index % 2 ? "#FFD166" : index % 3 === 0 ? "#FF8E53" : "#9EA6B4",
                      boxShadow: index % 2 ? "0 0 18px rgba(255,209,102,.6)" : "0 0 14px rgba(255,120,72,.45)",
                      opacity: 0,
                      ['--dx']: -180 + index * 16,
                      ['--dy']: -120 - (index % 6) * 26,
                      ['--rot']: piece.rotate,
                      animation: `debrisBurst ${0.82 + piece.delay}s cubic-bezier(.18,.7,.22,1) ${piece.delay}s forwards`,
                    }}
                  />
                ))}
              </div>
            </>
          )}
          <div
            style={{
              padding: "18px 30px",
              borderRadius: 999,
              background: screenFx === "correct" ? "rgba(61,220,151,.16)" : "rgba(255,103,74,.18)",
              border: `1px solid ${screenFx === "correct" ? "rgba(61,220,151,.34)" : "rgba(255,154,102,.42)"}`,
              color: "#fff",
              fontWeight: 950,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              boxShadow: screenFx === "correct" ? "0 20px 48px rgba(61,220,151,.22)" : "0 20px 48px rgba(255,110,72,.28)",
              animation: screenFx === "correct" ? "overlayPulse .95s ease-out forwards" : "blastCloud 1.02s ease-out forwards",
            }}
          >
            {screenFx === "correct" ? "Düzenek Güvende" : "Bomba Patladı"}
          </div>
        </div>
      )}

      <div
        className="bomb-card"
        style={{
          padding: 18,
          background: "linear-gradient(135deg, rgba(38,15,22,.94), rgba(10,20,39,.98))",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 16% 18%, rgba(255,107,107,.18), transparent 26%), radial-gradient(circle at 86% 14%, rgba(255,255,255,.12), transparent 18%)" }} />
        <div style={{ position: "relative", display: "grid", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ color: "#F2C1C1", fontSize: 12, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase" }}>Şimdi cevaplanacak soru</div>
              <div style={{ color: "#fff", fontSize: 17, fontWeight: 800, marginTop: 5 }}>Oyuncu soru cümlesini aramasın diye soru metnini üstte, çok büyük ve ayrı bir panelde tuttum.</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div style={{ padding: "10px 14px", borderRadius: 999, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.08)", color: "#fff", fontWeight: 900 }}>{questionNumber}. soru</div>
              <div style={{ padding: "10px 14px", borderRadius: 999, background: `${timeMeta.ring}`, border: `1px solid ${timeMeta.ring}`, color: "#fff", fontWeight: 900 }}>{stageBadge}</div>
            </div>
          </div>

          <div style={{ padding: "18px 20px", borderRadius: 24, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.11)", boxShadow: "0 12px 34px rgba(0,0,0,.18)" }}>
            <div style={{ color: "#FFD1D1", fontSize: 12, fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 10 }}>Büyük soru paneli</div>
            <div style={{ color: "#fff", fontSize: 30, lineHeight: 1.28, fontWeight: 950, letterSpacing: "-.01em", textShadow: "0 8px 22px rgba(0,0,0,.28)" }}>{q.q}</div>
          </div>
        </div>
      </div>

      <div className="bomb-layout">
        <div className="bomb-card" style={{ padding: 16, position: "relative", overflow: "hidden", minHeight: 610 }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(145deg, rgba(48,10,20,.98), rgba(11,22,46,.98))" }} />
          <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(135deg, rgba(255,209,102,.08), rgba(255,209,102,.08) 18px, transparent 18px, transparent 36px)", opacity: .18 }} />
          <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
            {particles.map((particle) => (
              <span
                key={particle.id}
                style={{
                  position: "absolute",
                  left: `${particle.left}%`,
                  top: `${particle.top}%`,
                  width: 8 + (particle.id % 3) * 4,
                  height: 8 + (particle.id % 3) * 4,
                  borderRadius: "50%",
                  background: particle.id % 2 ? "rgba(255,255,255,.82)" : "rgba(255,209,102,.7)",
                  opacity: .7,
                  filter: "blur(.2px)",
                  animation: `wireFloat ${2 + particle.delay}s ease-in-out ${particle.delay}s infinite`,
                }}
              />
            ))}
          </div>

          <div style={{ position: "relative", display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 10 }}>
              {[
                [`Tur ${questionNumber}`, `${totalQuestions} soru`],
                [`${safeBombT} sn`, "geri sayım"],
                [`%${risk}`, "risk"],
                [`%${Math.round(progress)}`, "ilerleme"],
              ].map(([big, small]) => (
                <div key={`${big}-${small}`} style={{ padding: "12px 12px", borderRadius: 18, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)" }}>
                  <div style={{ color: "#fff", fontWeight: 900, fontSize: 15 }}>{big}</div>
                  <div style={{ color: "#B5C6DE", fontSize: 11, marginTop: 4, textTransform: "uppercase", letterSpacing: ".08em" }}>{small}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 260px", gap: 18, alignItems: "stretch" }}>
              <div style={{ padding: "18px 18px 14px", borderRadius: 24, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", minHeight: 330, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, bottom: 0, width: 120, background: "linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent)", opacity: .3, animation: "sweep 3s linear infinite" }} />
                <div style={{ position: "relative", display: "grid", gap: 14 }}>
                  <div>
                    <div style={{ color: "#FFB9B9", fontSize: 12, fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>Görev paneli</div>
                    <div style={{ color: "#fff", fontSize: 32, fontWeight: 950, lineHeight: 1.12 }}>Doğru kabloyu seç, düzenek sakinleşsin.</div>
                    <div style={{ color: "#D7E1F5", fontSize: 16, lineHeight: 1.55, marginTop: 12 }}>{status}</div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>
                    {[
                      ["Mod", ans === null ? "Çözüm" : ans === q.a ? "Güvenli" : "Alarm"],
                      ["Basınç", `${tension}%`],
                      ["Süre durumu", timeMeta.label],
                    ].map(([label, value]) => (
                      <div key={label} style={{ padding: "12px 12px", borderRadius: 18, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)" }}>
                        <div style={{ color: "#AFC2DF", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</div>
                        <div style={{ color: "#fff", fontWeight: 900, fontSize: 16, marginTop: 5 }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 6 }}>
                    <div style={{ color: "#FFDD9D", fontSize: 12, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>Kesme rehberi</div>
                    <div style={{ display: "grid", gap: 10 }}>
                      {wires.map((wire) => {
                        const isChosen = selectedWire === wire.index || ans === wire.index;
                        const isCorrect = ans !== null && wire.index === q.a;
                        const isWrongPicked = ans !== null && ans === wire.index && ans !== q.a;
                        return (
                          <div key={`guide-${wire.index}`} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 28, height: 12, borderRadius: 999, background: wire.color, boxShadow: `0 0 18px ${wire.aura}` }} />
                            <div style={{ color: isCorrect ? "#8EF0BC" : isWrongPicked ? "#FF9B9B" : isChosen ? wire.glow : "#D7E1F5", fontWeight: 800, fontSize: 14 }}>
                              {LETTERS[wire.index]} kablosu {isCorrect ? "güvenli hattı açtı" : isWrongPicked ? "yanlış seçim oldu" : isChosen ? "seçildi" : "beklemede"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", alignContent: "center", justifyItems: "center", gap: 14, position: "relative" }}>
                <div
                  
                  style={{
                    width: 244,
                    height: 244,
                    borderRadius: "50%",
                    position: "relative",
                    display: "grid",
                    placeItems: "center",
                    background: selectedCorrect
                      ? "radial-gradient(circle at 35% 30%, #86F2BC, #1B8E57)"
                      : "radial-gradient(circle at 35% 30%, #5f6c84, #121b2b)",
                    boxShadow: selectedCorrect
                      ? "0 0 0 14px rgba(61,220,151,.14), 0 24px 54px rgba(61,220,151,.24)"
                      : "0 24px 64px rgba(0,0,0,.36)",
                    animation: ans === null ? "bombPulse 1s ease-in-out infinite alternate" : shake ? "bombShake .36s ease" : "none",
                  }}
                >
                  {ans === null && (
                    <>
                      <span style={{ position: "absolute", inset: 18, borderRadius: "50%", border: `10px solid ${timeMeta.ring}` }} />
                      <span style={{ position: "absolute", inset: -10, borderRadius: "50%", border: `2px solid ${timeMeta.ring}`, animation: "ringGrow 1.2s ease-out infinite" }} />
                    </>
                  )}
                  <div style={{ position: "absolute", top: 24, left: "50%", transform: "translateX(-50%)", width: 40, height: 82, borderRadius: 999, background: selectedCorrect ? "linear-gradient(180deg,#FFE66D,#2ECC71)" : "linear-gradient(180deg,#FFE66D,#FF6B6B)", animation: ans === null ? "bombBlink .82s linear infinite" : "none" }} />
                  <div style={{ position: "absolute", inset: 30, borderRadius: "50%", border: selectedCorrect ? "10px solid rgba(255,255,255,.26)" : "10px solid rgba(255,255,255,.14)" }} />
                  <div style={{ textAlign: "center", position: "relative", zIndex: 2 }}>
                    <div style={{ fontSize: 58, lineHeight: 1 }}>{selectedCorrect ? "🛡️" : "💣"}</div>
                    <div style={{ color: "#fff", fontWeight: 950, fontSize: 34, marginTop: 10 }}>{safeBombT}</div>
                    <div style={{ color: "#DCE7FA", fontSize: 12, textTransform: "uppercase", letterSpacing: ".12em" }}>saniye</div>
                  </div>
                </div>

                {ans !== null && ans !== q.a && (
                  <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
                    <span
                      style={{
                        position: "absolute",
                        inset: "18% 18%",
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(255,243,205,.98) 0%, rgba(255,182,92,.85) 26%, rgba(255,96,66,.68) 52%, rgba(255,96,66,0) 72%)",
                        animation: "blastCloud .88s ease-out forwards",
                        filter: "blur(2px)",
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        inset: "8%",
                        borderRadius: "50%",
                        border: "16px solid rgba(255,209,102,.34)",
                        animation: "shockWave .86s ease-out forwards",
                      }}
                    />
                    {sparks.map((spark, index) => (
                      <span
                        key={spark.id}
                        style={{
                          position: "absolute",
                          left: `${spark.left}%`,
                          top: "42%",
                          width: 8 + (index % 3) * 3,
                          height: 18 + (index % 2) * 6,
                          borderRadius: 999,
                          background: index % 2 ? "#FFD166" : "#FF6B6B",
                          boxShadow: `0 0 16px ${index % 2 ? "rgba(255,209,102,.55)" : "rgba(255,107,107,.55)"}`,
                          animation: `sparkFly ${1 + spark.delay}s linear ${spark.delay}s forwards`,
                        }}
                      />
                    ))}
                    {debris.map((piece, index) => (
                      <span
                        key={`debris-${piece.id}`}
                        style={{
                          position: "absolute",
                          left: `${piece.left}%`,
                          top: "50%",
                          width: piece.size,
                          height: piece.size * (index % 2 ? 1.7 : 1.15),
                          borderRadius: index % 3 === 0 ? 999 : 3,
                          background: index % 2 ? "#FFD166" : index % 3 === 0 ? "#FF8E53" : "#9EA6B4",
                          boxShadow: index % 2 ? "0 0 18px rgba(255,209,102,.6)" : "0 0 14px rgba(255,120,72,.45)",
                          opacity: 0,
                          ['--dx']: -132 + index * 12,
                          ['--dy']: -96 - (index % 6) * 22,
                          ['--rot']: piece.rotate,
                          animation: `debrisBurst ${0.78 + piece.delay}s cubic-bezier(.18,.7,.22,1) ${piece.delay}s forwards`,
                        }}
                      />
                    ))}
                  </div>
                )}

                <div style={{ width: "100%", padding: "12px 14px", borderRadius: 20, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <div>
                      <div style={{ color: "#B5C6DE", fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em" }}>Zaman basıncı</div>
                      <div style={{ color: timeMeta.color, fontSize: 20, fontWeight: 950, marginTop: 4 }}>{timeMeta.label}</div>
                    </div>
                    <div style={{ color: "#fff", fontWeight: 900 }}>{safeBombT} sn</div>
                  </div>
                  <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,.08)", overflow: "hidden", marginTop: 10 }}>
                    <div style={{ width: `${urgency}%`, height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${timeMeta.color}, #FF6B6B)` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bomb-card" style={{ padding: 18, display: "grid", gridTemplateRows: "auto auto 1fr", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ color: "#AFC2DF", fontSize: 12, fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase" }}>Kesme konsolu</div>
              <div style={{ color: "#fff", fontSize: 26, fontWeight: 950, marginTop: 4 }}>Doğru cevabı kablo gibi seç</div>
            </div>
            <div style={{ minWidth: 140, textAlign: "right" }}>
              <div style={{ color: timeMeta.color, fontSize: 22, fontWeight: 950 }}>{safeBombT} sn</div>
              <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,.08)", overflow: "hidden", marginTop: 6 }}>
                <div style={{ width: `${urgency}%`, height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${timeMeta.color}, #FF6B6B)` }} />
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>
            {[
              ["Kısayol", "1-4 / A-D"],
              ["Hedef", "Doğru kablo"],
              ["Seri", `${questionNumber}/${totalQuestions}`],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: "12px 14px", borderRadius: 16, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}>
                <div style={{ color: "#93A7C4", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</div>
                <div style={{ color: "#fff", fontWeight: 900, fontSize: 16, marginTop: 5 }}>{value}</div>
              </div>
            ))}
          </div>

          <div className="bomb-options">
            {wires.map((wire) => {
              const isCorrect = wire.index === q.a;
              const isSelected = wire.index === ans;
              const active = hovered === wire.index && ans === null;
              const isChosen = selectedWire === wire.index;

              const background =
                ans === null
                  ? active || isChosen
                    ? `linear-gradient(135deg, ${wire.aura}, rgba(255,255,255,.06))`
                    : "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))"
                  : isCorrect
                    ? "linear-gradient(135deg, rgba(46,204,113,.35), rgba(46,204,113,.18))"
                    : isSelected
                      ? "linear-gradient(135deg, rgba(231,76,60,.32), rgba(231,76,60,.14))"
                      : "rgba(255,255,255,.03)";

              return (
                <button
                  key={wire.index}
                  onMouseEnter={() => setHovered(wire.index)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => cut(wire.index)}
                  disabled={ans !== null}
                  style={{
                    textAlign: "left",
                    borderRadius: 24,
                    border: `1px solid ${isCorrect && ans !== null ? "rgba(46,204,113,.34)" : isSelected && ans !== null ? "rgba(231,76,60,.30)" : active || isChosen ? wire.aura : "rgba(255,255,255,.08)"}`,
                    background,
                    padding: 16,
                    color: "#fff",
                    minHeight: 138,
                    boxShadow: active || isChosen ? `0 18px 34px ${wire.aura}` : "none",
                    transform: active ? "translateY(-2px)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 16, display: "grid", placeItems: "center", background: "rgba(0,0,0,.22)", fontWeight: 950, fontSize: 18 }}>{LETTERS[wire.index]}</div>
                    <div style={{ flex: 1, height: 14, borderRadius: 999, background: wire.color, boxShadow: active || isChosen ? `0 0 24px ${wire.aura}` : "none", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent)", transform: active || isChosen ? "translateX(100%)" : "translateX(-100%)", transition: "transform .45s ease" }} />
                    </div>
                  </div>

                  <div style={{ color: wire.glow, fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 7 }}>Kablo seçeneği {LETTERS[wire.index]}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.36, minHeight: 72 }}>{wire.option}</div>

                  <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, color: isCorrect && ans !== null ? "#8EF0BC" : isSelected && ans !== null ? "#FF9B9B" : "#BFD0E7", fontSize: 13, fontWeight: 700 }}>
                    <span>{ans === null ? "Kesmek için tıkla" : isCorrect ? "Doğru kablo" : isSelected ? "Seçilen kablo" : "Kontrol edildi"}</span>
                    <span>{wire.index + 1}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
