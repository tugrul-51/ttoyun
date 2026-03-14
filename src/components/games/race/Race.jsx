/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { SFX } from "../../../utils/audio";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

const LETTERS = ["A", "B", "C", "D"];

function getTierLabel(index) {
  const n = (index || 0) + 1;
  if (n >= 10) return "Galaksi Ustası";
  if (n >= 7) return "Yıldız Pilot";
  if (n >= 4) return "Hızlı Kaşif";
  return "Kalkış Modu";
}

function getStageText(ans, correctIndex) {
  if (ans === null) return "Doğru cevabı seç ve roketini hedef istasyonuna ulaştır 🚀";
  if (ans === correctIndex) return "Başarılı kilit! Roketin hedefe yükseliyor 🌟";
  return "Yanlış rota! Roket denge kaybedip aşağı düşüyor ⚠️";
}

function getFlightMode(qi, ans, correctIndex) {
  if (ans === null) {
    if ((qi || 0) >= 7) return "Final Yörüngesi";
    if ((qi || 0) >= 4) return "Hızlanan Uçuş";
    return "Hazırlanıyor";
  }
  return ans === correctIndex ? "Hedefe Kilit" : "Denge Kaybı";
}

export default function Race({ q, qi, gqs, ans, hAns }) {
  const [hovered, setHovered] = useState(null);
  const [shakeWrong, setShakeWrong] = useState(false);
  const [burst, setBurst] = useState(false);
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    setHovered(null);
    setShakeWrong(false);
    setBurst(false);
    setSparkles([]);
  }, [qi]);

  useEffect(() => {
    if (!q || ans === null) return;

    if (ans === q.a) {
      setBurst(true);
      setSparkles(
        Array.from({ length: 16 }).map((_, i) => ({
          id: `${qi}-${i}-${Date.now()}`,
          left: 18 + Math.random() * 64,
          top: 12 + Math.random() * 54,
          dx: -70 + Math.random() * 140,
          dy: -40 + Math.random() * 90,
          delay: Math.random() * 0.14,
        }))
      );
      SFX.rocket?.();

      const t = setTimeout(() => {
        setBurst(false);
        setSparkles([]);
      }, 980);

      return () => clearTimeout(t);
    }

    setShakeWrong(true);
    const t = setTimeout(() => setShakeWrong(false), 520);
    return () => clearTimeout(t);
  }, [ans, q, qi]);

  const total = gqs?.length || 1;
  const current = (qi || 0) + 1;
  const progress = clamp((current / total) * 100, 0, 100);
  const tier = getTierLabel(qi || 0);
  const stageText = getStageText(ans, q?.a);
  const flightMode = getFlightMode(qi || 0, ans, q?.a);

  const scene = useMemo(() => {
    if (ans === null) {
      return {
        rocketLeft: 20,
        rocketBottom: 10,
        rocketRotate: -6,
        rocketScale: 1,
        targetGlow: 0.55,
        smokeOpacity: 0.35,
        crash: false,
        success: false,
        exhaust: "hazır",
        status: "Kilit Bekleniyor",
      };
    }

    if (ans === q?.a) {
      return {
        rocketLeft: 73,
        rocketBottom: 68,
        rocketRotate: -18,
        rocketScale: 1.08,
        targetGlow: 1,
        smokeOpacity: 0.1,
        crash: false,
        success: true,
        exhaust: "boost",
        status: "Hedefe Uçuş",
      };
    }

    return {
      rocketLeft: 48,
      rocketBottom: -4,
      rocketRotate: 120,
      rocketScale: 0.96,
      targetGlow: 0.18,
      smokeOpacity: 0.92,
      crash: true,
      success: false,
      exhaust: "fall",
      status: "Düşüş Başladı",
    };
  }, [ans, q]);

  if (!q) return null;

  const handleAnswer = (index) => {
    if (ans !== null) return;
    SFX.rocket?.();
    hAns(index);
  };

  const getOptionState = (index) => {
    const isAnswered = ans !== null;
    const isCorrect = index === q.a;
    const isSelected = ans === index;

    if (!isAnswered) {
      return {
        border: "1px solid rgba(255,255,255,.10)",
        background:
          hovered === index
            ? "linear-gradient(180deg, rgba(108,92,231,.24), rgba(78,205,196,.12))"
            : "linear-gradient(180deg, rgba(255,255,255,.09), rgba(255,255,255,.04))",
        boxShadow:
          hovered === index
            ? "0 16px 30px rgba(108,92,231,.18)"
            : "0 10px 22px rgba(0,0,0,.14)",
        opacity: 1,
      };
    }

    if (isCorrect) {
      return {
        border: "1px solid rgba(46,204,113,.40)",
        background:
          "linear-gradient(180deg, rgba(46,204,113,.24), rgba(46,204,113,.10))",
        boxShadow:
          "0 0 0 3px rgba(46,204,113,.08), 0 14px 28px rgba(46,204,113,.14)",
        opacity: 1,
      };
    }

    if (isSelected) {
      return {
        border: "1px solid rgba(231,76,60,.40)",
        background:
          "linear-gradient(180deg, rgba(231,76,60,.22), rgba(231,76,60,.10))",
        boxShadow:
          "0 0 0 3px rgba(231,76,60,.08), 0 14px 28px rgba(231,76,60,.14)",
        opacity: 1,
      };
    }

    return {
      border: "1px solid rgba(255,255,255,.06)",
      background: "rgba(255,255,255,.035)",
      boxShadow: "none",
      opacity: 0.72,
    };
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "min(1320px, 98vw)",
        margin: "0 auto",
        position: "relative",
        animation: "raceUltraEnter .45s ease",
      }}
    >
      <style>{`
        @keyframes raceUltraEnter {
          from { opacity: 0; transform: translateY(18px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes raceStarDrift {
          from { transform: translateY(0); }
          to { transform: translateY(80px); }
        }

        @keyframes raceRocketIdle {
          0% { transform: translateY(0px) rotate(-6deg); }
          50% { transform: translateY(-7px) rotate(-4deg); }
          100% { transform: translateY(0px) rotate(-6deg); }
        }

        @keyframes raceGlowBar {
          from { filter: brightness(1); }
          to { filter: brightness(1.14); }
        }

        @keyframes raceShake {
          0% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }

        @keyframes raceSpark {
          0% {
            opacity: 1;
            transform: translate(0,0) scale(.55) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translate(var(--dx), var(--dy)) scale(1.15) rotate(220deg);
          }
        }

        @keyframes raceTargetPulse {
          0% { transform: translateX(-50%) scale(1); opacity: .75; }
          50% { transform: translateX(-50%) scale(1.06); opacity: 1; }
          100% { transform: translateX(-50%) scale(1); opacity: .75; }
        }

        @keyframes raceCrashFlash {
          0% { opacity: 0; transform: scale(.7); }
          40% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0; transform: scale(1.55); }
        }

        .race-shell {
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .race-shake {
          animation: raceShake .46s ease;
        }

        .race-progress-glow {
          animation: raceGlowBar .85s ease-in-out infinite alternate;
        }

        .race-answer-btn {
          width: 100%;
          cursor: pointer;
          transition: transform .22s ease, box-shadow .22s ease, opacity .22s ease;
        }

        .race-answer-btn:hover {
          transform: translateY(-2px) scale(1.01);
        }

        .race-answer-btn:disabled {
          cursor: default;
        }

        .race-spark {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 4px;
          animation: raceSpark .8s ease forwards;
          pointer-events: none;
        }

        .race-stars {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          opacity: .28;
        }

        .race-stars::before,
        .race-stars::after {
          content: "";
          position: absolute;
          inset: -20%;
          background-image:
            radial-gradient(#fff 1px, transparent 1px),
            radial-gradient(#fff 1px, transparent 1px);
          background-size: 54px 54px, 80px 80px;
          background-position: 0 0, 28px 36px;
          animation: raceStarDrift 8s linear infinite;
        }

        .race-stars::after {
          opacity: .6;
          animation-duration: 12s;
        }

        .race-target-pulse {
          animation: raceTargetPulse 2s ease-in-out infinite;
        }

        .race-rocket-idle {
          animation: raceRocketIdle 2.2s ease-in-out infinite;
        }

        .race-crash-ring {
          animation: raceCrashFlash .9s ease forwards;
        }

        @media (max-width: 980px) {
          .race-layout {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 640px) {
          .race-grid {
            grid-template-columns: 1fr !important;
          }
          .race-question-title {
            font-size: 24px !important;
          }
          .race-track {
            min-height: 270px !important;
          }
        }
      `}</style>

      <div
        className={`race-shell ${shakeWrong ? "race-shake" : ""}`}
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 32,
          padding: 18,
          border: "1px solid rgba(255,255,255,.10)",
          background:
            "radial-gradient(circle at top left, rgba(78,205,196,.16), transparent 24%), radial-gradient(circle at top right, rgba(108,92,231,.16), transparent 22%), linear-gradient(180deg, rgba(8,12,26,.90), rgba(11,18,32,.98))",
          boxShadow: "0 20px 64px rgba(0,0,0,.30)",
        }}
      >
        <div className="race-stars" />

        <div
          style={{
            position: "absolute",
            top: -60,
            left: -50,
            width: 190,
            height: 190,
            borderRadius: "50%",
            background: "rgba(108,92,231,.12)",
            filter: "blur(16px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -70,
            right: -20,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "rgba(78,205,196,.10)",
            filter: "blur(18px)",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,.08)",
                border: "1px solid rgba(255,255,255,.08)",
                color: "#EEF4FF",
                fontSize: 13,
                fontWeight: 900,
              }}
            >
              ETAP {current}/{total}
            </div>

            <div
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                background: "linear-gradient(135deg,#6C5CE7,#4ECDC4)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 900,
                boxShadow: "0 10px 24px rgba(108,92,231,.22)",
              }}
            >
              🚀 {tier}
            </div>

            <div
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                background:
                  ans === null
                    ? "rgba(255,230,109,.12)"
                    : ans === q.a
                      ? "rgba(46,204,113,.12)"
                      : "rgba(231,76,60,.12)",
                border:
                  ans === null
                    ? "1px solid rgba(255,230,109,.18)"
                    : ans === q.a
                      ? "1px solid rgba(46,204,113,.18)"
                      : "1px solid rgba(231,76,60,.18)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 900,
              }}
            >
              ⚡ {flightMode}
            </div>
          </div>

          <div
            style={{
              padding: "10px 14px",
              borderRadius: 16,
              background: "rgba(255,255,255,.08)",
              border: "1px solid rgba(255,255,255,.08)",
              color: "#F4F8FF",
              fontSize: 13,
              fontWeight: 800,
              maxWidth: 450,
            }}
          >
            {stageText}
          </div>
        </div>

        <div
          className="race-layout"
          style={{
            position: "relative",
            zIndex: 1,
            display: "grid",
            gridTemplateColumns: "300px 1fr",
            gap: 18,
            alignItems: "stretch",
          }}
        >
          <div
            className="race-shell"
            style={{
              borderRadius: 28,
              padding: 18,
              border: "1px solid rgba(255,255,255,.08)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,.06)",
                border: "1px solid rgba(255,255,255,.08)",
                color: "#DCEBFF",
                fontSize: 13,
                fontWeight: 800,
                marginBottom: 14,
              }}
            >
              🛰️ Yarış Kontrol Paneli
            </div>

            <div
              style={{
                fontSize: "clamp(26px, 2.4vw, 34px)",
                lineHeight: 1.28,
                fontWeight: 900,
                color: "#fff",
                marginBottom: 16,
              }}
            >
              Doğru cevabı seç, roket hedefe tırmansın
            </div>

            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#CFE2FF",
                }}
              >
                <span>Galaksi İlerlemesi</span>
                <span>%{Math.round(progress)}</span>
              </div>

              <div
                style={{
                  width: "100%",
                  height: 14,
                  background: "rgba(255,255,255,.08)",
                  borderRadius: 999,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,.06)",
                }}
              >
                <div
                  className="race-progress-glow"
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    borderRadius: 999,
                    transition: "width .35s ease",
                    background: "linear-gradient(90deg,#4ECDC4,#6C5CE7,#FFE66D)",
                    boxShadow: "0 0 18px rgba(108,92,231,.22)",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 18,
                  background: "rgba(255,255,255,.06)",
                  border: "1px solid rgba(255,255,255,.08)",
                  color: "#EEF6FF",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                🎯 Doğru cevap = hedefe yükseliş
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 18,
                  background: "rgba(255,255,255,.06)",
                  border: "1px solid rgba(255,255,255,.08)",
                  color: "#EEF6FF",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                ⚠️ Yanlış cevap = roket aşağı düşer
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 18,
                  background: "rgba(255,230,109,.08)",
                  border: "1px solid rgba(255,230,109,.12)",
                  color: "#FFF0BE",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                🌌 Hedef istasyonu üstte, kalkış pisti altta
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 18,
                  background: "rgba(108,92,231,.10)",
                  border: "1px solid rgba(108,92,231,.14)",
                  color: "#ECE8FF",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                💥 3 yanlış kuralı için can bilgisi parent’tan bağlanabilir
              </div>
            </div>
          </div>

          <div
            className="race-shell"
            style={{
              borderRadius: 28,
              padding: 20,
              border: "1px solid rgba(255,255,255,.08)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -40,
                right: -30,
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: "rgba(255,230,109,.08)",
                filter: "blur(12px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: -40,
                left: -20,
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: "rgba(78,205,196,.08)",
                filter: "blur(12px)",
              }}
            />

            <div style={{ position: "relative", zIndex: 1, marginBottom: 18 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,.06)",
                  border: "1px solid rgba(255,255,255,.08)",
                  color: "#DCEBFF",
                  fontSize: 13,
                  fontWeight: 800,
                  marginBottom: 14,
                }}
              >
                🌌 Uzay Yarışı
              </div>

              <div
                className="race-track"
                style={{
                  minHeight: 320,
                  borderRadius: 24,
                  border: "1px solid rgba(255,255,255,.10)",
                  background:
                    "linear-gradient(180deg, rgba(5,8,18,.92), rgba(10,18,34,.98))",
                  padding: "18px 18px 16px",
                  position: "relative",
                  overflow: "hidden",
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "radial-gradient(circle at 50% 10%, rgba(255,255,255,.06), transparent 18%), radial-gradient(circle at 80% 28%, rgba(255,255,255,.05), transparent 12%), radial-gradient(circle at 15% 40%, rgba(255,255,255,.04), transparent 10%)",
                    pointerEvents: "none",
                  }}
                />

                {[0, 1, 2, 3].map((line) => (
                  <div
                    key={line}
                    style={{
                      position: "absolute",
                      left: 18,
                      right: 18,
                      top: 54 + line * 56,
                      height: 2,
                      background:
                        "linear-gradient(90deg, rgba(255,255,255,.12), rgba(255,255,255,.02))",
                    }}
                  />
                ))}

                <div
                  className="race-target-pulse"
                  style={{
                    position: "absolute",
                    left: "76%",
                    top: 26,
                    width: 110,
                    height: 110,
                    transform: "translateX(-50%)",
                    borderRadius: "50%",
                    background: `radial-gradient(circle, rgba(255,230,109,${scene.targetGlow}) 0%, rgba(255,159,67,.28) 28%, rgba(255,255,255,.02) 70%)`,
                    filter: "blur(0.4px)",
                    boxShadow: `0 0 36px rgba(255,230,109,${scene.targetGlow * 0.45})`,
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    left: "76%",
                    top: 44,
                    transform: "translateX(-50%)",
                    display: "grid",
                    placeItems: "center",
                    width: 76,
                    height: 76,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, rgba(255,230,109,.22), rgba(255,255,255,.08))",
                    border: "1px solid rgba(255,230,109,.28)",
                    boxShadow: "0 0 18px rgba(255,230,109,.18)",
                    color: "#FFF5CF",
                    fontSize: 28,
                    fontWeight: 900,
                  }}
                >
                  🎯
                </div>

                <div
                  style={{
                    position: "absolute",
                    left: 28,
                    right: 28,
                    bottom: 26,
                    height: 22,
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, rgba(35,26,18,.88), rgba(10,8,8,1))",
                    boxShadow: "inset 0 8px 18px rgba(0,0,0,.44)",
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    left: "18%",
                    bottom: 18,
                    transform: "translateX(-50%)",
                    color: "#CFE2FF",
                    fontSize: 12,
                    fontWeight: 900,
                    opacity: 0.95,
                  }}
                >
                  START
                </div>

                <div
                  style={{
                    position: "absolute",
                    left: "76%",
                    top: 126,
                    transform: "translateX(-50%)",
                    color: "#FFF5CF",
                    fontSize: 12,
                    fontWeight: 900,
                    opacity: 0.95,
                  }}
                >
                  HEDEF
                </div>

                <div
                  style={{
                    position: "absolute",
                    left: `${scene.rocketLeft}%`,
                    bottom: `${scene.rocketBottom}%`,
                    transform: `translateX(-50%) rotate(${scene.rocketRotate}deg) scale(${scene.rocketScale})`,
                    transition:
                      ans === null
                        ? "left .35s ease, bottom .35s ease, transform .35s ease"
                        : ans === q.a
                          ? "left .9s cubic-bezier(.2,.8,.2,1), bottom .9s cubic-bezier(.2,.8,.2,1), transform .8s ease"
                          : "left .7s ease, bottom .85s cubic-bezier(.35,.02,.8,.2), transform .75s ease",
                    zIndex: 3,
                    filter:
                      ans === q.a
                        ? "drop-shadow(0 16px 22px rgba(46,204,113,.24))"
                        : scene.crash
                          ? "drop-shadow(0 16px 22px rgba(231,76,60,.22))"
                          : "drop-shadow(0 14px 20px rgba(78,205,196,.22))",
                  }}
                  className={ans === null ? "race-rocket-idle" : ""}
                >
                  <div style={{ fontSize: 52, lineHeight: 1 }}>🚀</div>
                </div>

                <div
                  style={{
                    position: "absolute",
                    left: `${scene.rocketLeft - 6}%`,
                    bottom: `${Math.max(scene.rocketBottom - 1, 2)}%`,
                    transform: "translateX(-50%)",
                    transition:
                      ans === null
                        ? "left .35s ease, bottom .35s ease, opacity .35s ease"
                        : "left .9s ease, bottom .9s ease, opacity .4s ease",
                    opacity:
                      scene.exhaust === "boost"
                        ? 1
                        : scene.exhaust === "fall"
                          ? 0.65
                          : 0.55,
                    zIndex: 2,
                    fontSize: scene.exhaust === "boost" ? 22 : 18,
                    letterSpacing: "2px",
                  }}
                >
                  {scene.exhaust === "boost"
                    ? "✨✨✨"
                    : scene.exhaust === "fall"
                      ? "💨💨"
                      : "✨✨"}
                </div>

                {scene.crash && (
                  <div
                    className="race-crash-ring"
                    style={{
                      position: "absolute",
                      left: `${scene.rocketLeft}%`,
                      bottom: "6%",
                      transform: "translateX(-50%)",
                      width: 82,
                      height: 82,
                      borderRadius: "50%",
                      border: "6px solid rgba(255,120,100,.58)",
                      zIndex: 1,
                    }}
                  />
                )}
              </div>

              <div
                className="race-question-title"
                style={{
                  fontSize: "clamp(28px, 2.6vw, 36px)",
                  lineHeight: 1.34,
                  fontWeight: 900,
                  color: "#fff",
                  textShadow: "0 2px 12px rgba(0,0,0,.22)",
                }}
              >
                {q.q}
              </div>
            </div>

            <div
              className="race-grid"
              style={{
                position: "relative",
                zIndex: 1,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
              }}
            >
              {q.o.map((opt, i) => {
                const state = getOptionState(i);
                const isCorrect = ans !== null && i === q.a;
                const isSelected = ans === i;

                return (
                  <button
                    key={i}
                    className="race-answer-btn"
                    disabled={ans !== null}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => handleAnswer(i)}
                    style={{
                      minHeight: 98,
                      borderRadius: 22,
                      padding: "16px 16px",
                      textAlign: "left",
                      ...state,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 42,
                          minWidth: 42,
                          height: 42,
                          borderRadius: 14,
                          display: "grid",
                          placeItems: "center",
                          background:
                            ans !== null && i === q.a
                              ? "linear-gradient(135deg,#2ecc71,#27ae60)"
                              : ans !== null && ans === i && i !== q.a
                                ? "linear-gradient(135deg,#ff7675,#e74c3c)"
                                : "linear-gradient(135deg,#6C5CE7,#4ECDC4)",
                          color: "#fff",
                          fontWeight: 900,
                          fontSize: 16,
                          border: "1px solid rgba(255,255,255,.10)",
                          flexShrink: 0,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)",
                        }}
                      >
                        {LETTERS[i]}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            color: "#fff",
                            fontSize: 16,
                            lineHeight: 1.45,
                            fontWeight: 800,
                          }}
                        >
                          {opt}
                        </div>

                        {isCorrect && (
                          <div
                            style={{
                              marginTop: 8,
                              fontSize: 12,
                              fontWeight: 900,
                              color: "#CFF7DE",
                            }}
                          >
                            ✅ Hedefe taşıyan cevap
                          </div>
                        )}

                        {isSelected && !isCorrect && (
                          <div
                            style={{
                              marginTop: 8,
                              fontSize: 12,
                              fontWeight: 900,
                              color: "#FFD1CC",
                            }}
                          >
                            ❌ Düşüşe neden olan seçim
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {burst &&
              sparkles.map((spark) => (
                <span
                  key={spark.id}
                  className="race-spark"
                  style={{
                    left: `${spark.left}%`,
                    top: `${spark.top}%`,
                    background:
                      spark.bg ||
                        (Number(String(spark.id).split("-").pop()) % 2 === 0
                          ? "linear-gradient(135deg,#FFE66D,#FF9F43)"
                          : "linear-gradient(135deg,#4ECDC4,#6C5CE7)"),
                    "--dx": `${spark.dx}px`,
                    "--dy": `${spark.dy}px`,
                    animationDelay: `${spark.delay}s`,
                  }}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}