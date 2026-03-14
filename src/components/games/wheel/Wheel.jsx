/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { SFX } from "../../../utils/audio";

const SEGMENTS = [
  { points: 50, color1: "#FF6B6B", color2: "#C0392B", label: "Hız" },
  { points: 100, color1: "#4ECDC4", color2: "#0077B6", label: "Akıl" },
  { points: 150, color1: "#FFE66D", color2: "#F39C12", label: "Bonus" },
  { points: 200, color1: "#6C5CE7", color2: "#4C3AC7", label: "Güç" },
  { points: 250, color1: "#FD79A8", color2: "#D63384", label: "Mega" },
  { points: 300, color1: "#00B894", color2: "#008060", label: "Efsane" },
  { points: 100, color1: "#E17055", color2: "#C44536", label: "Şans" },
  { points: 200, color1: "#0984E3", color2: "#1D4ED8", label: "Usta" },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getTierLabel(index) {
  const n = (index || 0) + 1;
  if (n >= 10) return "Çark Ustası";
  if (n >= 7) return "Şans Kaptanı";
  if (n >= 4) return "Parlak Tur";
  return "Başlangıç Dönüşü";
}

function getRewardLabel(points) {
  if (points >= 250) return "Büyük Ödül";
  if (points >= 150) return "Güçlü Ödül";
  if (points >= 100) return "Orta Ödül";
  return "Mini Ödül";
}

function getStatusText({ swq, ans, correctIndex, points, wheelReveal, spn }) {
  if (spn) return "Çark dönüyor... bakalım şansın hangi ödülü getirecek 🎡";
  if (wheelReveal) return `${points} puanlık ödül geldi! Soru açılıyor... ✨`;
  if (!swq) return "Çarkı çevir ve puanlı görevi aç 🎯";
  if (ans === null) return `${points} puanlık soru açıldı. Doğru cevabı seç ⭐`;
  if (ans === correctIndex) return "Harika! Çarktan gelen ödülü başarıyla kazandın ✅";
  return "Bu tur kaçtı ama sonraki dönüşte daha büyük ödül gelebilir ✨";
}

export default function Wheel({
  q,
  qi,
  gqs,
  ans,
  hWhlAns,
  swq,
  wa,
  spn,
  wp,
  hWhlSpin,
  wsi,
  wheelReveal,
}) {
  const [hovered, setHovered] = useState(null);
  const [burst, setBurst] = useState(false);
  const [shakeWrong, setShakeWrong] = useState(false);
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    setHovered(null);
    setBurst(false);
    setShakeWrong(false);
    setSparkles([]);
  }, [qi, swq, wheelReveal]);

  useEffect(() => {
    if (!q || ans === null) return;

    if (ans === q.a) {
      setBurst(true);
      setSparkles(
        Array.from({ length: 22 }).map((_, i) => ({
          id: `${qi}-${i}-${Date.now()}`,
          left: 10 + Math.random() * 80,
          top: 14 + Math.random() * 64,
          dx: -85 + Math.random() * 170,
          dy: -70 + Math.random() * 130,
          delay: Math.random() * 0.18,
        }))
      );

      SFX.reveal?.();

      const t = setTimeout(() => {
        setBurst(false);
        setSparkles([]);
      }, 1100);

      return () => clearTimeout(t);
    }

    setShakeWrong(true);
    const t = setTimeout(() => setShakeWrong(false), 520);
    return () => clearTimeout(t);
  }, [ans, q, qi]);

  const total = gqs?.length || 1;
  const current = (qi || 0) + 1;
  const progress = clamp((current / total) * 100, 0, 100);
  const points = Number(wp) || 0;
  const tier = getTierLabel(qi || 0);
  const rewardLabel = getRewardLabel(points);

  const activeSegment = useMemo(() => {
    if (typeof wsi === "number" && SEGMENTS[wsi]) return SEGMENTS[wsi];
    return SEGMENTS.find((s) => s.points === points) || SEGMENTS[0];
  }, [wsi, points]);

  const statusText = getStatusText({
    swq,
    ans,
    correctIndex: q?.a,
    points,
    wheelReveal,
    spn,
  });

  if (!q && swq) return null;

  const handleSpin = () => {
    if (spn || wheelReveal) return;
    SFX.whoosh?.();
    hWhlSpin();
  };

  const handleAnswer = (index) => {
    if (ans !== null) return;
    SFX.click?.();
    hWhlAns(index);
  };

  return (
    <div
      style={{
        maxWidth: 1380,
        margin: "0 auto",
        position: "relative",
        animation: "wheelUltraEnter .45s ease",
      }}
    >
      <style>{`
        @keyframes wheelUltraEnter {
          from { opacity: 0; transform: translateY(18px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes wheelPulse {
          from { transform: scale(1); }
          to { transform: scale(1.04); }
        }

        @keyframes wheelGlowBar {
          from { filter: brightness(1); }
          to { filter: brightness(1.15); }
        }

        @keyframes wheelShake {
          0% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }

        @keyframes wheelSpark {
          0% { opacity: 1; transform: translate(0,0) scale(.55) rotate(0deg); }
          100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(1.18) rotate(220deg); }
        }

        @keyframes wheelBadgeFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }

        @keyframes wheelRewardPop {
          0% { opacity: 0; transform: translateY(24px) scale(.82); }
          60% { opacity: 1; transform: translateY(0) scale(1.03); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes wheelRewardRing {
          0% { transform: scale(.85); opacity: .9; }
          100% { transform: scale(1.18); opacity: 0; }
        }

        @keyframes wheelPremiumGlow {
          from { box-shadow: 0 20px 60px rgba(0,0,0,.32), 0 0 0 rgba(255,255,255,0); }
          to { box-shadow: 0 20px 60px rgba(0,0,0,.32), 0 0 30px rgba(255,255,255,.12); }
        }

        .wheel-shell {
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .wheel-progress-glow {
          animation: wheelGlowBar .85s ease-in-out infinite alternate;
        }

        .wheel-pulse {
          animation: wheelPulse .8s ease-in-out infinite alternate;
        }

        .wheel-float {
          animation: wheelBadgeFloat 2.6s ease-in-out infinite;
        }

        .wheel-shake {
          animation: wheelShake .46s ease;
        }

        .wheel-answer-btn {
          width: 100%;
          cursor: pointer;
          transition: transform .22s ease, box-shadow .22s ease, opacity .22s ease;
        }

        .wheel-answer-btn:hover {
          transform: translateY(-2px) scale(1.01);
        }

        .wheel-answer-btn:disabled {
          cursor: default;
        }

        .wheel-spin-btn {
          cursor: pointer;
          transition: transform .22s ease, box-shadow .22s ease, opacity .22s ease;
        }

        .wheel-spin-btn:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.02);
        }

        .wheel-spark {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 4px;
          animation: wheelSpark .8s ease forwards;
          pointer-events: none;
        }

        .wheel-global-reward-overlay {
          position: absolute;
          inset: 0;
          z-index: 50;
          display: grid;
          place-items: center;
          background: rgba(7,10,22,.28);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          pointer-events: none;
        }

        .wheel-reward-card {
          position: relative;
          width: min(90vw, 700px);
          min-height: 300px;
          border-radius: 36px;
          padding: 36px 30px;
          text-align: center;
          color: #fff;
          border: 1px solid rgba(255,255,255,.18);
          box-shadow: 0 28px 70px rgba(0,0,0,.35);
          animation: wheelRewardPop .42s ease forwards, wheelPremiumGlow 1s ease-in-out infinite alternate;
          overflow: hidden;
        }

        .wheel-reward-ring {
          position: absolute;
          inset: 16px;
          border-radius: 30px;
          border: 2px solid rgba(255,255,255,.25);
          animation: wheelRewardRing 1s ease-out infinite;
          pointer-events: none;
        }

        @media (max-width: 1120px) {
          .wheel-layout {
            grid-template-columns: 1fr !important;
          }
          .wheel-side-panel {
            order: 2;
          }
          .wheel-main-panel {
            order: 1;
          }
        }

        @media (max-width: 700px) {
          .wheel-answers-grid {
            grid-template-columns: 1fr !important;
          }

          .wheel-question-title {
            font-size: 24px !important;
          }

          .wheel-svg-wrap {
            width: 290px !important;
            height: 290px !important;
          }

          .wheel-reward-card {
            width: min(94vw, 430px) !important;
            min-height: 240px !important;
            padding: 24px 18px !important;
          }
        }
      `}</style>

      <div
        className={`wheel-shell ${shakeWrong ? "wheel-shake" : ""}`}
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 34,
          padding: 18,
          border: "1px solid rgba(255,255,255,.10)",
          background:
            "radial-gradient(circle at top left, rgba(108,92,231,.18), transparent 24%), radial-gradient(circle at top right, rgba(255,230,109,.14), transparent 20%), linear-gradient(180deg, rgba(11,14,28,.90), rgba(14,18,32,.98))",
          boxShadow: "0 20px 64px rgba(0,0,0,.30)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -60,
            left: -50,
            width: 190,
            height: 190,
            borderRadius: "50%",
            background: "rgba(108,92,231,.14)",
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
            background: "rgba(255,230,109,.10)",
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
            marginBottom: 18,
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
              TUR {current}/{total}
            </div>

            <div
              className={spn ? "wheel-pulse" : ""}
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                background: "linear-gradient(135deg,#6C5CE7,#FD79A8)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 900,
                boxShadow: "0 10px 24px rgba(108,92,231,.22)",
              }}
            >
              🎡 {tier}
            </div>

            {(swq || wheelReveal) && (
              <div
                className="wheel-float"
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: "linear-gradient(135deg,#FFE66D,#FFA502)",
                  color: "#1B1F2A",
                  fontSize: 13,
                  fontWeight: 900,
                  boxShadow: "0 10px 24px rgba(255,230,109,.24)",
                }}
              >
                🏆 {points} PUAN
              </div>
            )}
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
              maxWidth: 540,
            }}
          >
            {statusText}
          </div>
        </div>

        {!swq ? (
          <div
            className="wheel-layout"
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gridTemplateColumns: "300px minmax(0, 1.25fr)",
              gap: 18,
              alignItems: "stretch",
            }}
          >
            <div
              className="wheel-shell wheel-side-panel"
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
                🎯 Çark Görev Paneli
              </div>

              <div
                style={{
                  fontSize: "clamp(24px, 2.1vw, 30px)",
                  lineHeight: 1.35,
                  fontWeight: 900,
                  color: "#fff",
                  marginBottom: 16,
                }}
              >
                Çarkı çevir, ödülü gör, sonra soruyu çöz
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
                  <span>İlerleme</span>
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
                    className="wheel-progress-glow"
                    style={{
                      width: `${progress}%`,
                      height: "100%",
                      borderRadius: 999,
                      transition: "width .35s ease",
                      background: "linear-gradient(90deg,#6C5CE7,#FD79A8,#FFE66D)",
                      boxShadow: "0 0 18px rgba(108,92,231,.22)",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
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
                  🎡 Şansını çevir
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
                  🏆 Gelen ödül tüm ekran alanında görünür
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
                  ✨ Büyük puanlarda premium parıltı açılır
                </div>
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                {SEGMENTS.slice(0, 6).map((seg, i) => (
                  <div
                    key={`${seg.points}-${seg.label}-${i}`}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,.05)",
                      border: "1px solid rgba(255,255,255,.08)",
                      color: "#F6F7FB",
                      fontSize: 13,
                      fontWeight: 800,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <span>{seg.label}</span>
                    <span>{seg.points}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="wheel-shell wheel-main-panel"
              style={{
                borderRadius: 30,
                padding: 24,
                border: "1px solid rgba(255,255,255,.08)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))",
                minHeight: 540,
                display: "grid",
                placeItems: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(circle at center, rgba(255,255,255,.05), transparent 42%)",
                  pointerEvents: "none",
                }}
              />

              <div
                className="wheel-svg-wrap"
                style={{
                  position: "relative",
                  width: 440,
                  height: 440,
                  marginBottom: 20,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 6,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: 40,
                    zIndex: 12,
                    filter: "drop-shadow(0 6px 10px rgba(0,0,0,.22))",
                  }}
                >
                  🔻
                </div>

                <svg
                  width="410"
                  height="410"
                  viewBox="-210 -210 420 420"
                  style={{
                    transform: `rotate(${wa}deg)`,
                    transition: spn
                      ? "transform 3.5s cubic-bezier(.17,.67,.12,.99)"
                      : "none",
                    filter: "drop-shadow(0 20px 30px rgba(0,0,0,.24))",
                  }}
                >
                  {SEGMENTS.map((seg, i) => {
                    const a = i * 45;
                    const r1 = ((a - 90) * Math.PI) / 180;
                    const r2 = ((a + 45 - 90) * Math.PI) / 180;
                    const ta = a + 22.5;
                    const tr = ((ta - 90) * Math.PI) / 180;
                    const radius = 185;
                    const x1 = radius * Math.cos(r1);
                    const y1 = radius * Math.sin(r1);
                    const x2 = radius * Math.cos(r2);
                    const y2 = radius * Math.sin(r2);
                    const tx = 122 * Math.cos(tr);
                    const ty = 122 * Math.sin(tr);
                    const isActive = typeof wsi === "number" && i === wsi && (wheelReveal || swq);

                    return (
                      <g key={i}>
                        <defs>
                          <linearGradient id={`wheelGrad${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={seg.color1} />
                            <stop offset="100%" stopColor={seg.color2} />
                          </linearGradient>
                        </defs>

                        <path
                          d={`M0,0 L${x1},${y1} A${radius},${radius} 0 0,1 ${x2},${y2} Z`}
                          fill={`url(#wheelGrad${i})`}
                          stroke={isActive ? "#FFF7C2" : "#1a1a2e"}
                          strokeWidth={isActive ? "6" : "3"}
                          style={{
                            filter: isActive
                              ? "drop-shadow(0 0 18px rgba(255,230,109,.45))"
                              : "none",
                          }}
                        />

                        <text
                          x={tx}
                          y={ty - 12}
                          fill="#fff"
                          fontWeight="900"
                          fontSize="24"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`rotate(${ta},${tx},${ty - 12})`}
                        >
                          {seg.points}
                        </text>

                        <text
                          x={tx}
                          y={ty + 20}
                          fill="rgba(255,255,255,.92)"
                          fontWeight="800"
                          fontSize="13"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`rotate(${ta},${tx},${ty + 20})`}
                        >
                          {seg.label}
                        </text>
                      </g>
                    );
                  })}

                  <circle cx="0" cy="0" r="34" fill="#1a1a2e" stroke="#FFE66D" strokeWidth="7" />
                  <circle cx="0" cy="0" r="10" fill="#fff" />
                </svg>
              </div>

              <button
                className="wheel-spin-btn"
                onClick={handleSpin}
                disabled={spn || wheelReveal}
                style={{
                  padding: "18px 48px",
                  borderRadius: 999,
                  border: "none",
                  background:
                    spn || wheelReveal
                      ? "rgba(255,255,255,.10)"
                      : "linear-gradient(135deg,#FFE66D,#FFA502)",
                  color: "#1B1F2A",
                  fontSize: 22,
                  fontWeight: 900,
                  cursor: spn || wheelReveal ? "default" : "pointer",
                  boxShadow: spn || wheelReveal ? "none" : "0 14px 30px rgba(255,230,109,.22)",
                  opacity: spn || wheelReveal ? 0.72 : 1,
                }}
              >
                {spn ? "🎡 Çevriliyor..." : wheelReveal ? "🏆 Ödül Açılıyor..." : "🎡 ÇARKI ÇEVİR"}
              </button>
            </div>
          </div>
        ) : (
          <div
            className="wheel-layout"
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gridTemplateColumns: "300px minmax(0, 1.25fr)",
              gap: 18,
              alignItems: "stretch",
            }}
          >
            <div
              className="wheel-shell wheel-side-panel"
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
                🏆 Çark Ödülü
              </div>

              <div
                style={{
                  borderRadius: 24,
                  padding: 18,
                  background: `linear-gradient(135deg, ${activeSegment.color1}, ${activeSegment.color2})`,
                  color: "#fff",
                  boxShadow: `0 18px 40px ${activeSegment.color1}55`,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 900,
                    marginBottom: 6,
                    opacity: 0.92,
                  }}
                >
                  GELEN ÖDÜL
                </div>

                <div
                  style={{
                    fontSize: 46,
                    fontWeight: 900,
                    lineHeight: 1,
                  }}
                >
                  {points}
                </div>

                <div
                  style={{
                    marginTop: 10,
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                >
                  {rewardLabel} · {activeSegment.label}
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
                  🎯 Soruyu doğru cevapla
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
                  ⭐ Bu tur {points} puan değerinde
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
                  ✨ Ödül ve soru ekranı birebir eşleşiyor
                </div>
              </div>
            </div>

            <div
              className="wheel-shell wheel-main-panel"
              style={{
                borderRadius: 30,
                padding: 22,
                border: "1px solid rgba(255,255,255,.08)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))",
                position: "relative",
                overflow: "hidden",
                minHeight: 540,
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
                  background: "rgba(108,92,231,.08)",
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
                  🎯 Çark Sorusu
                </div>

                <div
                  className="wheel-question-title"
                  style={{
                    fontSize: "clamp(30px, 2.8vw, 40px)",
                    lineHeight: 1.35,
                    fontWeight: 900,
                    color: "#fff",
                    textShadow: "0 2px 12px rgba(0,0,0,.22)",
                    maxWidth: 920,
                  }}
                >
                  {q.q}
                </div>
              </div>

              <div
                className="wheel-answers-grid"
                style={{
                  position: "relative",
                  zIndex: 1,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                {q.o.map((opt, i) => {
                  const isAnswered = ans !== null;
                  const isCorrect = i === q.a;
                  const isSelected = ans === i;

                  const bg = isAnswered
                    ? isCorrect
                      ? "linear-gradient(135deg, rgba(46,204,113,.25), rgba(46,204,113,.12))"
                      : isSelected
                      ? "linear-gradient(135deg, rgba(231,76,60,.25), rgba(231,76,60,.12))"
                      : "linear-gradient(135deg, rgba(255,255,255,.05), rgba(255,255,255,.03))"
                    : "linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.04))";

                  const border = isAnswered
                    ? isCorrect
                      ? "1px solid rgba(46,204,113,.38)"
                      : isSelected
                      ? "1px solid rgba(231,76,60,.34)"
                      : "1px solid rgba(255,255,255,.06)"
                    : "1px solid rgba(108,92,231,.18)";

                  return (
                    <button
                      key={i}
                      className="wheel-answer-btn"
                      disabled={isAnswered}
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => handleAnswer(i)}
                      style={{
                        minHeight: 102,
                        borderRadius: 22,
                        border,
                        background: bg,
                        padding: "16px 16px",
                        textAlign: "left",
                        boxShadow:
                          hovered === i && !isAnswered
                            ? "0 14px 28px rgba(108,92,231,.14)"
                            : "none",
                        opacity: isAnswered && !isCorrect && !isSelected ? 0.72 : 1,
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
                            width: 44,
                            minWidth: 44,
                            height: 44,
                            borderRadius: 14,
                            display: "grid",
                            placeItems: "center",
                            background: isAnswered
                              ? isCorrect
                                ? "rgba(46,204,113,.22)"
                                : isSelected
                                ? "rgba(231,76,60,.22)"
                                : "rgba(255,255,255,.06)"
                              : "linear-gradient(135deg,#6C5CE7,#FD79A8)",
                            color: "#fff",
                            fontWeight: 900,
                            fontSize: 16,
                            border: "1px solid rgba(255,255,255,.10)",
                            flexShrink: 0,
                          }}
                        >
                          {["A", "B", "C", "D"][i] || i + 1}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              color: "#fff",
                              fontSize: 17,
                              lineHeight: 1.45,
                              fontWeight: 800,
                            }}
                          >
                            {opt}
                          </div>

                          {isAnswered && isCorrect && (
                            <div
                              style={{
                                marginTop: 8,
                                fontSize: 12,
                                fontWeight: 900,
                                color: "#CFF7DE",
                              }}
                            >
                              ✅ Doğru cevap
                            </div>
                          )}

                          {isAnswered && isSelected && !isCorrect && (
                            <div
                              style={{
                                marginTop: 8,
                                fontSize: 12,
                                fontWeight: 900,
                                color: "#FFD1CC",
                              }}
                            >
                              ❌ Seçilen cevap
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
                    className="wheel-spark"
                    style={{
                      left: `${spark.left}%`,
                      top: `${spark.top}%`,
                      background:
                        spark.bg ||
                          (Number(String(spark.id).split("-").pop()) % 2 === 0
                            ? "linear-gradient(135deg,#FFE66D,#FF9F43)"
                            : "linear-gradient(135deg,#6C5CE7,#FD79A8)"),
                      "--dx": `${spark.dx}px`,
                      "--dy": `${spark.dy}px`,
                      animationDelay: `${spark.delay}s`,
                    }}
                  />
                ))}
            </div>
          </div>
        )}

        {wheelReveal && (
          <div className="wheel-global-reward-overlay">
            <div
              className="wheel-reward-card"
              style={{
                background: `linear-gradient(135deg, ${activeSegment.color1}, ${activeSegment.color2})`,
              }}
            >
              <div className="wheel-reward-ring" />

              <div
                style={{
                  fontSize: 15,
                  fontWeight: 900,
                  letterSpacing: ".14em",
                  opacity: 0.94,
                  marginBottom: 10,
                }}
              >
                GELEN ÖDÜL
              </div>

              <div
                style={{
                  fontSize: "clamp(68px, 10vw, 110px)",
                  fontWeight: 1000,
                  lineHeight: 1,
                  textShadow: "0 8px 24px rgba(0,0,0,.20)",
                }}
              >
                {points}
              </div>

              <div
                style={{
                  marginTop: 12,
                  fontSize: "clamp(22px, 3vw, 30px)",
                  fontWeight: 900,
                }}
              >
                {rewardLabel} · {activeSegment.label}
              </div>

              <div
                style={{
                  marginTop: 14,
                  fontSize: 16,
                  fontWeight: 800,
                  opacity: 0.96,
                }}
              >
                Şimdi bu ödül değerindeki soru geliyor
              </div>

              {points >= 250 && (
                <div
                  style={{
                    marginTop: 18,
                    display: "inline-flex",
                    padding: "10px 16px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,.18)",
                    border: "1px solid rgba(255,255,255,.26)",
                    fontSize: 13,
                    fontWeight: 900,
                  }}
                >
                  🔥 Yüksek ödül geldi
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}