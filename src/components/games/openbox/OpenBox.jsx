/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { SFX } from "../../../utils/audio";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

const BOX_THEMES = [
  {
    name: "Yakut",
    grad: "linear-gradient(135deg,#FF6B6B,#E74C3C)",
    glow: "rgba(255,107,107,.30)",
    ribbon: "#FFD166",
    icon: "💎",
  },
  {
    name: "Okyanus",
    grad: "linear-gradient(135deg,#4ECDC4,#2563EB)",
    glow: "rgba(78,205,196,.28)",
    ribbon: "#E0FBFC",
    icon: "🌊",
  },
  {
    name: "Yıldız",
    grad: "linear-gradient(135deg,#FFD166,#F39C12)",
    glow: "rgba(255,209,102,.30)",
    ribbon: "#FFF8D6",
    icon: "⭐",
  },
  {
    name: "Mor",
    grad: "linear-gradient(135deg,#A78BFA,#6D28D9)",
    glow: "rgba(167,139,250,.30)",
    ribbon: "#F3E8FF",
    icon: "🔮",
  },
  {
    name: "Zümrüt",
    grad: "linear-gradient(135deg,#3DDC97,#15803D)",
    glow: "rgba(61,220,151,.28)",
    ribbon: "#DCFCE7",
    icon: "🍀",
  },
  {
    name: "Günbatımı",
    grad: "linear-gradient(135deg,#FF9F43,#FF6B6B)",
    glow: "rgba(255,159,67,.28)",
    ribbon: "#FFF1E6",
    icon: "🌅",
  },
  {
    name: "Buz",
    grad: "linear-gradient(135deg,#7DD3FC,#38BDF8)",
    glow: "rgba(125,211,252,.28)",
    ribbon: "#EFFBFF",
    icon: "❄️",
  },
  {
    name: "Lav",
    grad: "linear-gradient(135deg,#FB7185,#F97316)",
    glow: "rgba(251,113,133,.28)",
    ribbon: "#FFF1F2",
    icon: "🔥",
  },
];

function getRewardTier(points) {
  if (points >= 300) return "Efsane Ödül";
  if (points >= 250) return "Mega Ödül";
  if (points >= 200) return "Güçlü Ödül";
  if (points >= 150) return "Parlak Ödül";
  if (points >= 100) return "Güzel Ödül";
  return "Sürpriz Ödül";
}

function getStatusText({ swq, ans, correctIndex, points, revealOpen }) {
  if (revealOpen) return `${points} puanlık kutu açıldı! Soru hazırlanıyor 🎁`;
  if (!swq) return "Kutulardan birini seç ve içindeki sürpriz görevi aç 🎁";
  if (ans === null) return `${points} puanlık soru seni bekliyor. Doğru cevabı seç ⭐`;
  if (ans === correctIndex) return "Harika! Kutunun içindeki görevi başarıyla tamamladın ✅";
  return "Bu kutu zor çıktı. Sonraki sürprizde daha da iyi olacaksın ✨";
}

export default function OpenBox({
  q,
  qi,
  gqs,
  ans,
  hWhlAns,
  swq,
  wp,
  hBoxPick,
  selectedBoxIndex,
  boxRevealOpen,
}) {
  const [selectedBox, setSelectedBox] = useState(
    typeof selectedBoxIndex === "number" ? selectedBoxIndex : null
  );
  const [opening, setOpening] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [burst, setBurst] = useState(false);
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    setSelectedBox(typeof selectedBoxIndex === "number" ? selectedBoxIndex : null);
    setOpening(false);
    setHovered(null);
    setBurst(false);
    setSparkles([]);
  }, [qi, selectedBoxIndex, swq, boxRevealOpen]);

  useEffect(() => {
    if (!q || ans === null) return;

    if (ans === q.a) {
      setBurst(true);
      setSparkles(
        Array.from({ length: 16 }).map((_, i) => ({
          id: `${qi}-${i}-${Date.now()}`,
          left: 12 + Math.random() * 76,
          top: 18 + Math.random() * 58,
          dx: -60 + Math.random() * 120,
          dy: -50 + Math.random() * 100,
          delay: Math.random() * 0.16,
        }))
      );
      SFX.reveal?.();

      const t = setTimeout(() => {
        setBurst(false);
        setSparkles([]);
      }, 950);

      return () => clearTimeout(t);
    }
  }, [ans, q, qi]);

  const total = gqs?.length || 1;
  const current = (qi || 0) + 1;
  const progress = clamp((current / total) * 100, 0, 100);
  const points = Number(wp) || 50;
  const rewardTier = getRewardTier(points);

  const activeBox = useMemo(() => {
    if (typeof selectedBox === "number" && BOX_THEMES[selectedBox]) {
      return BOX_THEMES[selectedBox];
    }
    return BOX_THEMES[0];
  }, [selectedBox]);

  const statusText = getStatusText({
    swq,
    ans,
    correctIndex: q?.a,
    points,
    revealOpen: boxRevealOpen,
  });

  const boxes = useMemo(
    () =>
      BOX_THEMES.map((theme, index) => ({
        ...theme,
        index,
        bob: 2.7 + (index % 3) * 0.35,
      })),
    []
  );

  if (!q && swq) return null;

  const handlePickBox = (index) => {
    if (selectedBox !== null || opening || swq || boxRevealOpen) return;

    setSelectedBox(index);
    setOpening(true);
    SFX.reveal?.();

    setTimeout(() => {
      setOpening(false);
      hBoxPick(index);
    }, 560);
  };

  const handleAnswer = (index) => {
    if (ans !== null) return;
    SFX.click?.();
    hWhlAns(index);
  };

  return (
    <div
      style={{
        maxWidth: 1360,
        margin: "0 auto",
        position: "relative",
        animation: "openboxUltraEnter .45s ease",
      }}
    >
      <style>{`
        @keyframes openboxUltraEnter {
          from { opacity: 0; transform: translateY(18px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes boxBob {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }

        @keyframes boxPulse {
          from { transform: scale(1); }
          to { transform: scale(1.04); }
        }

        @keyframes boxGlowBar {
          from { filter: brightness(1); }
          to { filter: brightness(1.14); }
        }

        @keyframes boxOpenBurst {
          0% { transform: scale(1) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.10) rotate(3deg); opacity: 1; }
          100% { transform: scale(1.18) rotate(-3deg); opacity: 0; }
        }

        @keyframes boxRewardPop {
          0% { opacity: 0; transform: translateY(24px) scale(.82); }
          60% { opacity: 1; transform: translateY(0) scale(1.03); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes boxRewardRing {
          0% { transform: scale(.88); opacity: .9; }
          100% { transform: scale(1.16); opacity: 0; }
        }

        @keyframes boxSpark {
          0% {
            opacity: 1;
            transform: translate(0,0) scale(.55) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translate(var(--dx), var(--dy)) scale(1.18) rotate(220deg);
          }
        }

        .openbox-shell {
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .openbox-progress-glow {
          animation: boxGlowBar .85s ease-in-out infinite alternate;
        }

        .openbox-pulse {
          animation: boxPulse .8s ease-in-out infinite alternate;
        }

        .openbox-box {
          cursor: pointer;
          transition: transform .22s ease, box-shadow .22s ease, opacity .22s ease, filter .22s ease;
        }

        .openbox-box:hover {
          transform: translateY(-4px) scale(1.02);
        }

        .openbox-box.disabled {
          cursor: default;
        }

        .openbox-box.opening {
          animation: boxOpenBurst .56s ease forwards;
        }

        .openbox-spark {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 4px;
          animation: boxSpark .8s ease forwards;
          pointer-events: none;
        }

        .openbox-answer-btn {
          width: 100%;
          cursor: pointer;
          transition: transform .2s ease, box-shadow .2s ease, opacity .2s ease;
        }

        .openbox-answer-btn:hover {
          transform: translateY(-2px);
        }

        .openbox-answer-btn:disabled {
          cursor: default;
        }

        .openbox-reward-overlay {
          position: absolute;
          inset: 0;
          z-index: 40;
          display: grid;
          place-items: center;
          background: rgba(7,10,22,.30);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          pointer-events: none;
        }

        .openbox-reward-card {
          position: relative;
          width: min(90vw, 620px);
          min-height: 290px;
          border-radius: 34px;
          padding: 32px 28px;
          text-align: center;
          color: #fff;
          border: 1px solid rgba(255,255,255,.18);
          box-shadow: 0 28px 70px rgba(0,0,0,.35);
          animation: boxRewardPop .42s ease forwards;
          overflow: hidden;
        }

        .openbox-reward-ring {
          position: absolute;
          inset: 16px;
          border-radius: 28px;
          border: 2px solid rgba(255,255,255,.25);
          animation: boxRewardRing 1s ease-out infinite;
          pointer-events: none;
        }

        @media (max-width: 980px) {
          .openbox-layout {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 700px) {
          .openbox-box-grid {
            grid-template-columns: repeat(2,1fr) !important;
          }

          .openbox-question-grid {
            grid-template-columns: 1fr !important;
          }

          .openbox-question-title {
            font-size: 24px !important;
          }

          .openbox-reward-card {
            width: min(94vw, 430px) !important;
            min-height: 240px !important;
            padding: 24px 18px !important;
          }
        }
      `}</style>

      <div
        className="openbox-shell"
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 32,
          padding: 18,
          border: "1px solid rgba(255,255,255,.10)",
          background:
            "radial-gradient(circle at top left, rgba(255,107,107,.16), transparent 24%), radial-gradient(circle at top right, rgba(108,92,231,.14), transparent 20%), linear-gradient(180deg, rgba(12,14,28,.90), rgba(12,18,32,.98))",
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
            background: "rgba(255,107,107,.12)",
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
            background: "rgba(108,92,231,.10)",
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
              TUR {current}/{total}
            </div>

            <div
              className={points >= 200 ? "openbox-pulse" : ""}
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                background: "linear-gradient(135deg,#FFD166,#FF9F43)",
                color: "#1B1F2A",
                fontSize: 13,
                fontWeight: 900,
                boxShadow: "0 10px 24px rgba(255,209,102,.24)",
              }}
            >
              🎁 {rewardTier}
            </div>

            {(swq || boxRevealOpen) && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: "rgba(108,92,231,.14)",
                  border: "1px solid rgba(108,92,231,.18)",
                  color: "#ECE8FF",
                  fontSize: 13,
                  fontWeight: 900,
                }}
              >
                ⭐ {points} PUAN
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
              maxWidth: 520,
            }}
          >
            {statusText}
          </div>
        </div>

        {!swq ? (
          <div
            className="openbox-layout"
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gridTemplateColumns: "300px minmax(0, 1fr)",
              gap: 18,
              alignItems: "stretch",
            }}
          >
            <div
              className="openbox-shell"
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
                🗝️ Kutu Seçim Paneli
              </div>

              <div
                style={{
                  fontSize: "clamp(26px, 2.4vw, 32px)",
                  lineHeight: 1.35,
                  fontWeight: 900,
                  color: "#fff",
                  marginBottom: 16,
                }}
              >
                Her soru için yeni bir gizemli kutu aç
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
                  <span>Oyun İlerlemesi</span>
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
                    className="openbox-progress-glow"
                    style={{
                      width: `${progress}%`,
                      height: "100%",
                      borderRadius: 999,
                      transition: "width .35s ease",
                      background: "linear-gradient(90deg,#FF6B6B,#6C5CE7,#FFE66D)",
                      boxShadow: "0 0 18px rgba(255,107,107,.20)",
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
                  🎁 Her kutu yeni bir görev açar
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
                  ⭐ Doğru cevapta kutu puanı eklenir
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
                  🖼️ Her yeni soru yeni kutuyla başlar
                </div>
              </div>
            </div>

            <div
              className="openbox-shell"
              style={{
                borderRadius: 28,
                padding: 22,
                border: "1px solid rgba(255,255,255,.08)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))",
                position: "relative",
                overflow: "hidden",
                minHeight: 560,
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
                className="openbox-box-grid"
                style={{
                  position: "relative",
                  zIndex: 1,
                  display: "grid",
                  gridTemplateColumns: "repeat(4,1fr)",
                  gap: 18,
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                {boxes.map((box) => {
                  const isChosen = selectedBox === box.index;
                  const isLocked = selectedBox !== null && selectedBox !== box.index;

                  return (
                    <div
                      key={box.index}
                      className={`openbox-box ${
                        selectedBox !== null ? "disabled" : ""
                      } ${isChosen && opening ? "opening" : ""}`}
                      onMouseEnter={() => setHovered(box.index)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => handlePickBox(box.index)}
                      style={{
                        opacity: isLocked ? 0.22 : 1,
                        transform:
                          hovered === box.index && selectedBox === null
                            ? "translateY(-4px) scale(1.03)"
                            : "scale(1)",
                        filter: isLocked
                          ? "grayscale(1)"
                          : `drop-shadow(0 18px 28px ${box.glow})`,
                        animation:
                          selectedBox === null
                            ? `boxBob ${box.bob}s ease-in-out infinite`
                            : "none",
                      }}
                    >
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          aspectRatio: "1 / 1",
                          borderRadius: 26,
                          background: box.grad,
                          border: "3px solid rgba(255,255,255,.16)",
                          boxShadow: `0 18px 34px ${box.glow}`,
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: 10,
                            left: 10,
                            right: 10,
                            height: 16,
                            borderRadius: 999,
                            background: box.ribbon,
                            boxShadow: "0 2px 8px rgba(0,0,0,.12)",
                            opacity: 0.96,
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: 10,
                            bottom: 46,
                            left: "50%",
                            width: 16,
                            transform: "translateX(-50%)",
                            borderRadius: 999,
                            background: box.ribbon,
                            boxShadow: "0 2px 8px rgba(0,0,0,.12)",
                            opacity: 0.96,
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: 18,
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: 34,
                            height: 20,
                            borderRadius: "50%",
                            border: `5px solid ${box.ribbon}`,
                            background: "transparent",
                            opacity: 0.96,
                          }}
                        />

                        <div
                          style={{
                            position: "absolute",
                            top: "38%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            fontSize: "clamp(26px, 2.6vw, 38px)",
                            filter: "drop-shadow(0 8px 14px rgba(0,0,0,.20))",
                          }}
                        >
                          {box.icon}
                        </div>

                        <div
                          style={{
                            position: "absolute",
                            left: 8,
                            right: 8,
                            bottom: 10,
                            minHeight: 34,
                            padding: "7px 10px",
                            borderRadius: 14,
                            background: "rgba(8,12,24,.42)",
                            backdropFilter: "blur(6px)",
                            WebkitBackdropFilter: "blur(6px)",
                            border: "1px solid rgba(255,255,255,.16)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            boxShadow: "0 6px 18px rgba(0,0,0,.18)",
                          }}
                        >
                          <span
                            style={{
                              color: "#FFFFFF",
                              fontSize: 13,
                              fontWeight: 900,
                              lineHeight: 1.1,
                              letterSpacing: ".02em",
                              textShadow: "0 2px 6px rgba(0,0,0,.45)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {box.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  textAlign: "center",
                  marginTop: 22,
                  color: "#EAF2FF",
                  fontSize: 18,
                  fontWeight: 900,
                }}
              >
                {selectedBox === null
                  ? "Yeni soru için bir gizemli kutu seç!"
                  : "Kutu açılıyor... sürpriz görev hazırlanıyor 🎉"}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="openbox-layout"
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gridTemplateColumns: "300px minmax(0, 1fr)",
              gap: 18,
              alignItems: "stretch",
            }}
          >
            <div
              className="openbox-shell"
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
                🏆 Kutu Ödülü
              </div>

              <div
                style={{
                  borderRadius: 24,
                  padding: 18,
                  background: activeBox.grad,
                  color: "#fff",
                  boxShadow: `0 18px 40px ${activeBox.glow}`,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 900,
                    marginBottom: 6,
                  }}
                >
                  KAZANILABİLECEK PUAN
                </div>
                <div
                  style={{
                    fontSize: 42,
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
                  {rewardTier} · {activeBox.name}
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
                  ⭐ Bu kutu {points} puan değerinde
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
                  🎁 Hediye kutusu premium görev ekranına dönüştü
                </div>
              </div>
            </div>

            <div
              className="openbox-shell"
              style={{
                borderRadius: 28,
                padding: 20,
                border: "1px solid rgba(255,255,255,.08)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))",
                position: "relative",
                overflow: "hidden",
                minHeight: 520,
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
                  🎁 Sürpriz Kutu Sorusu
                </div>

                <div
                  className="openbox-question-title"
                  style={{
                    fontSize: "clamp(28px, 2.6vw, 36px)",
                    lineHeight: 1.4,
                    fontWeight: 900,
                    color: "#fff",
                    textShadow: "0 2px 12px rgba(0,0,0,.22)",
                  }}
                >
                  {q.q}
                </div>
              </div>

              <div
                className="openbox-question-grid"
                style={{
                  position: "relative",
                  zIndex: 1,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
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
                    : "1px solid rgba(255,209,102,.16)";

                  return (
                    <button
                      key={i}
                      className="openbox-answer-btn"
                      disabled={isAnswered}
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => handleAnswer(i)}
                      style={{
                        minHeight: 96,
                        borderRadius: 22,
                        border,
                        background: bg,
                        padding: "16px 16px",
                        textAlign: "left",
                        boxShadow:
                          hovered === i && !isAnswered
                            ? "0 14px 28px rgba(255,209,102,.14)"
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
                            width: 42,
                            minWidth: 42,
                            height: 42,
                            borderRadius: 14,
                            display: "grid",
                            placeItems: "center",
                            background: isAnswered
                              ? isCorrect
                                ? "rgba(46,204,113,.22)"
                                : isSelected
                                ? "rgba(231,76,60,.22)"
                                : "rgba(255,255,255,.06)"
                              : "linear-gradient(135deg,#FFD166,#FF9F43)",
                            color: isAnswered ? "#fff" : "#1B1F2A",
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
                              fontSize: 16,
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
                    className="openbox-spark"
                    style={{
                      left: `${spark.left}%`,
                      top: `${spark.top}%`,
                      background:
                        spark.bg ||
                          (Number(String(spark.id).split("-").pop()) % 2 === 0
                            ? "linear-gradient(135deg,#FFE66D,#FF9F43)"
                            : "linear-gradient(135deg,#6C5CE7,#4ECDC4)"),
                      "--dx": `${spark.dx}px`,
                      "--dy": `${spark.dy}px`,
                      animationDelay: `${spark.delay}s`,
                    }}
                  />
                ))}
            </div>
          </div>
        )}

        {boxRevealOpen && (
          <div className="openbox-reward-overlay">
            <div
              className="openbox-reward-card"
              style={{
                background: activeBox.grad,
              }}
            >
              <div className="openbox-reward-ring" />

              <div
                style={{
                  fontSize: 15,
                  fontWeight: 900,
                  letterSpacing: ".14em",
                  opacity: 0.94,
                  marginBottom: 10,
                }}
              >
                KUTU AÇILDI
              </div>

              <div
                style={{
                  fontSize: "clamp(58px, 10vw, 100px)",
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
                {rewardTier} · {activeBox.name}
              </div>

              <div
                style={{
                  marginTop: 14,
                  fontSize: 16,
                  fontWeight: 800,
                  opacity: 0.96,
                }}
              >
                Kutunun içindeki puanlı görev hazırlanıyor
              </div>

              <div
                style={{
                  marginTop: 16,
                  fontSize: 34,
                }}
              >
                {activeBox.icon}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}