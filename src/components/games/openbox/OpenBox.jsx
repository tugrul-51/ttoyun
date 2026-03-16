/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
import { SFX } from "../../../utils/audio";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

const OPTION_LABELS = ["A", "B", "C", "D"];

const BOX_THEMES = [
  {
    name: "Yakut",
    grad: "linear-gradient(135deg,#FF6B6B,#E74C3C)",
    glow: "rgba(255,107,107,.30)",
    ribbon: "#FFD166",
    icon: "💎",
    accent: "#FFD166",
  },
  {
    name: "Okyanus",
    grad: "linear-gradient(135deg,#4ECDC4,#2563EB)",
    glow: "rgba(78,205,196,.28)",
    ribbon: "#E0FBFC",
    icon: "🌊",
    accent: "#B7F3FF",
  },
  {
    name: "Yıldız",
    grad: "linear-gradient(135deg,#FFD166,#F39C12)",
    glow: "rgba(255,209,102,.30)",
    ribbon: "#FFF8D6",
    icon: "⭐",
    accent: "#FFF4B2",
  },
  {
    name: "Mor",
    grad: "linear-gradient(135deg,#A78BFA,#6D28D9)",
    glow: "rgba(167,139,250,.30)",
    ribbon: "#F3E8FF",
    icon: "🔮",
    accent: "#E9D5FF",
  },
  {
    name: "Zümrüt",
    grad: "linear-gradient(135deg,#3DDC97,#15803D)",
    glow: "rgba(61,220,151,.28)",
    ribbon: "#DCFCE7",
    icon: "🍀",
    accent: "#D9FFE7",
  },
  {
    name: "Günbatımı",
    grad: "linear-gradient(135deg,#FF9F43,#FF6B6B)",
    glow: "rgba(255,159,67,.28)",
    ribbon: "#FFF1E6",
    icon: "🌅",
    accent: "#FFE2C5",
  },
  {
    name: "Buz",
    grad: "linear-gradient(135deg,#7DD3FC,#38BDF8)",
    glow: "rgba(125,211,252,.28)",
    ribbon: "#EFFBFF",
    icon: "❄️",
    accent: "#DDF6FF",
  },
  {
    name: "Lav",
    grad: "linear-gradient(135deg,#FB7185,#F97316)",
    glow: "rgba(251,113,133,.28)",
    ribbon: "#FFF1F2",
    icon: "🔥",
    accent: "#FFD7D0",
  },
  {
    name: "Gökkuşağı",
    grad: "linear-gradient(135deg,#34D399,#60A5FA,#F472B6)",
    glow: "rgba(96,165,250,.30)",
    ribbon: "#FFF7F7",
    icon: "🌈",
    accent: "#FFE3F2",
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
  if (revealOpen) return `${points} puanlık kutu açıldı! Görev hazırlanıyor 🎁`;
  if (!swq) return "Kutulardan birini seç. Her kutu yeni bir soru ve sürpriz sahne açar 🎁";
  if (ans === null) return `${points} puanlık görevi çöz. Soru paneli yukarıda, seçenekler aşağıda ⭐`;
  if (ans === correctIndex) return "Harika! Kutunun görevi başarıyla tamamlandı ve ödül kasaya eklendi ✅";
  return "Bu tur kapanıyor ama sonraki kutuda daha güçlü döneceksin ✨";
}

function makeSparkBurst(count, palette, prefix) {
  return Array.from({ length: count }).map((_, i) => ({
    id: `${prefix}-${i}-${Date.now()}`,
    left: 10 + Math.random() * 80,
    top: 10 + Math.random() * 70,
    dx: -120 + Math.random() * 240,
    dy: -100 + Math.random() * 180,
    size: 10 + Math.random() * 18,
    delay: Math.random() * 0.15,
    bg: palette[i % palette.length],
  }));
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
  const [hoveredBox, setHoveredBox] = useState(null);
  const [hoveredAnswer, setHoveredAnswer] = useState(null);
  const [burst, setBurst] = useState(false);
  const [sparkles, setSparkles] = useState([]);
  const [outcomeOverlay, setOutcomeOverlay] = useState(null);

  useEffect(() => {
    setSelectedBox(typeof selectedBoxIndex === "number" ? selectedBoxIndex : null);
    setOpening(false);
    setHoveredBox(null);
    setHoveredAnswer(null);
    setBurst(false);
    setSparkles([]);
    setOutcomeOverlay(null);
  }, [qi, selectedBoxIndex, swq, boxRevealOpen]);

  useEffect(() => {
    if (!swq || ans !== null || !q) return undefined;
    const t = setTimeout(() => {
      SFX.sparkle?.();
    }, 120);
    return () => clearTimeout(t);
  }, [swq, ans, q, qi]);

  useEffect(() => {
    if (!q || ans === null) return undefined;

    if (ans === q.a) {
      setBurst(true);
      setOutcomeOverlay("correct");
      setSparkles(
        makeSparkBurst(
          26,
          [
            "linear-gradient(135deg,#FFE66D,#FF9F43)",
            "linear-gradient(135deg,#6C5CE7,#4ECDC4)",
            "linear-gradient(135deg,#FFFFFF,#FFD166)",
          ],
          `openbox-correct-${qi}`
        )
      );
      SFX.sparkle?.();
      setTimeout(() => SFX.reveal?.(), 90);
    } else {
      setBurst(true);
      setOutcomeOverlay("wrong");
      setSparkles(
        makeSparkBurst(
          18,
          [
            "linear-gradient(135deg,#FF7B7B,#FF3B30)",
            "linear-gradient(135deg,#FFC2BD,#FF8A80)",
            "linear-gradient(135deg,#FFD166,#FF6B6B)",
          ],
          `openbox-wrong-${qi}`
        )
      );
      SFX.whoosh?.();
    }

    const t = setTimeout(() => {
      setBurst(false);
      setSparkles([]);
      setOutcomeOverlay(null);
    }, 1100);

    return () => clearTimeout(t);
  }, [ans, q, qi]);

  const total = gqs?.length || 1;
  const current = (qi || 0) + 1;
  const progress = clamp((current / total) * 100, 0, 100);
  const points = Number(wp) || 50;
  const rewardTier = getRewardTier(points);

  const boxes = useMemo(
    () =>
      BOX_THEMES.map((theme, index) => ({
        ...theme,
        index,
        bob: 2.7 + (index % 3) * 0.35,
        tilt: index % 2 === 0 ? -1 : 1,
      })),
    []
  );

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

  function handlePickBox(index) {
    if (selectedBox !== null || opening || swq || boxRevealOpen) return;

    setSelectedBox(index);
    setOpening(true);
    setHoveredBox(null);
    SFX.whoosh?.();
    setTimeout(() => SFX.reveal?.(), 70);

    setTimeout(() => {
      setOpening(false);
      hBoxPick(index);
    }, 620);
  }

  function handleAnswer(index) {
    if (ans !== null) return;
    SFX.click?.();
    hWhlAns(index);
  }

  useEffect(() => {
    const onKeyDown = (event) => {
      const key = String(event.key || "").toLowerCase();
      if (!key) return;

      if (!swq) {
        const index = Number.parseInt(key, 10) - 1;
        if (
          Number.isInteger(index) &&
          index >= 0 &&
          index < boxes.length &&
          selectedBox === null &&
          !opening &&
          !boxRevealOpen
        ) {
          event.preventDefault();
          handlePickBox(index);
        }
        return;
      }

      if (ans !== null) return;
      const answerMap = { a: 0, b: 1, c: 2, d: 3, "1": 0, "2": 1, "3": 2, "4": 3 };
      if (Object.prototype.hasOwnProperty.call(answerMap, key)) {
        event.preventDefault();
        handleAnswer(answerMap[key]);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [swq, boxes.length, selectedBox, opening, boxRevealOpen, ans, handlePickBox, handleAnswer]);

  if (!q && swq) return null;

  return (
    <div
      style={{
        maxWidth: 1380,
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
          0% { transform: translateY(0px) rotate(var(--tilt)); }
          50% { transform: translateY(-10px) rotate(calc(var(--tilt) * -1)); }
          100% { transform: translateY(0px) rotate(var(--tilt)); }
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
          35% { transform: scale(1.08) rotate(2deg); opacity: 1; }
          65% { transform: scale(1.12) rotate(-2deg); opacity: 1; }
          100% { transform: scale(1.22) rotate(3deg); opacity: 0; }
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

        @keyframes openboxFlash {
          0% { opacity: 0; transform: scale(.88); }
          30% { opacity: 1; transform: scale(1.02); }
          100% { opacity: 0; transform: scale(1.12); }
        }

        @keyframes openboxWave {
          0% { opacity: .9; transform: scale(.75); }
          100% { opacity: 0; transform: scale(1.5); }
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
          transform: translateY(-6px) scale(1.025);
        }

        .openbox-box.disabled {
          cursor: default;
        }

        .openbox-box.opening {
          animation: boxOpenBurst .62s ease forwards;
        }

        .openbox-spark {
          position: absolute;
          border-radius: 999px;
          animation: boxSpark .82s ease forwards;
          pointer-events: none;
        }

        .openbox-answer-btn {
          width: 100%;
          cursor: pointer;
          transition: transform .2s ease, box-shadow .2s ease, opacity .2s ease, border-color .2s ease;
        }

        .openbox-answer-btn:hover {
          transform: translateY(-2px);
        }

        .openbox-answer-btn:disabled {
          cursor: default;
        }

        .openbox-reward-overlay,
        .openbox-outcome-overlay {
          position: absolute;
          inset: 0;
          z-index: 40;
          display: grid;
          place-items: center;
          pointer-events: none;
        }

        .openbox-reward-overlay {
          background: rgba(7,10,22,.30);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }

        .openbox-reward-card,
        .openbox-outcome-card {
          position: relative;
          width: min(90vw, 640px);
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

        .openbox-reward-ring,
        .openbox-outcome-wave {
          position: absolute;
          inset: 16px;
          border-radius: 28px;
          border: 2px solid rgba(255,255,255,.25);
          animation: boxRewardRing 1s ease-out infinite;
          pointer-events: none;
        }

        .openbox-outcome-overlay::before {
          content: "";
          position: absolute;
          inset: 12%;
          border-radius: 50%;
          animation: openboxFlash .78s ease forwards;
          background: radial-gradient(circle, rgba(255,255,255,.48), transparent 66%);
          pointer-events: none;
        }

        .openbox-outcome-card::after {
          content: "";
          position: absolute;
          inset: 26px;
          border-radius: 30px;
          border: 2px solid rgba(255,255,255,.28);
          animation: openboxWave .9s ease forwards;
          pointer-events: none;
        }

        @media (max-width: 1240px) {
          .openbox-layout {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 760px) {
          .openbox-box-grid {
            grid-template-columns: repeat(2,1fr) !important;
          }

          .openbox-question-grid {
            grid-template-columns: 1fr !important;
          }

          .openbox-question-title {
            font-size: 28px !important;
          }

          .openbox-answer-btn {
            min-height: 92px !important;
          }

          .openbox-reward-card,
          .openbox-outcome-card {
            width: min(94vw, 430px) !important;
            min-height: 236px !important;
            padding: 24px 18px !important;
          }
        }
      `}</style>

      <div
        className="openbox-shell"
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 34,
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
              ⌨️ {swq ? "A-D / 1-4" : `1-${boxes.length}`}
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
              maxWidth: 560,
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
              gridTemplateColumns: "320px minmax(0, 1fr)",
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
                🗝️ Kutu Görev Merkezi
              </div>

              <div
                style={{
                  fontSize: "clamp(28px, 2.5vw, 34px)",
                  lineHeight: 1.24,
                  fontWeight: 900,
                  color: "#fff",
                  marginBottom: 12,
                }}
              >
                Yeni soru için büyük bir gizemli kutu seç
              </div>

              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "#DCE9FF",
                  marginBottom: 18,
                }}
              >
                Her turda yeni bir kutu açılır. Kutunun sürpriz puanı görünür, ardından soru cümlesi dev görev panelinde açılır.
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

              <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
                {[
                  "1. Kutunu seç",
                  "2. Sürpriz puan açılır",
                  "3. Büyük soru paneline odaklan",
                  "4. Doğru cevabı seç ve patlamayı izle",
                ].map((item) => (
                  <div
                    key={item}
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
                    {item}
                  </div>
                ))}
              </div>

              <div
                style={{
                  borderRadius: 22,
                  padding: 16,
                  background: "linear-gradient(135deg, rgba(255,209,102,.14), rgba(255,255,255,.05))",
                  border: "1px solid rgba(255,209,102,.18)",
                }}
              >
                <div style={{ color: "#FFF1BE", fontSize: 12, fontWeight: 900, marginBottom: 8 }}>
                  KLAVYE KISAYOLU
                </div>
                <div style={{ color: "#fff", fontSize: 16, fontWeight: 900, lineHeight: 1.4 }}>
                  1-{boxes.length} ile kutu seçebilirsin
                </div>
                <div style={{ color: "#E5EEFF", fontSize: 13, lineHeight: 1.5, marginTop: 8 }}>
                  Dokunmatik ve fareyle de tüm kutular güvenle çalışır.
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
                minHeight: 620,
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
                  gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                  gap: 18,
                  alignItems: "center",
                }}
              >
                {boxes.map((box) => {
                  const isChosen = selectedBox === box.index;
                  const isLocked = selectedBox !== null && selectedBox !== box.index;

                  return (
                    <div
                      key={box.index}
                      className={`openbox-box ${selectedBox !== null ? "disabled" : ""} ${
                        isChosen && opening ? "opening" : ""
                      }`}
                      onMouseEnter={() => setHoveredBox(box.index)}
                      onMouseLeave={() => setHoveredBox(null)}
                      onClick={() => handlePickBox(box.index)}
                      style={{
                        opacity: isLocked ? 0.18 : 1,
                        filter: isLocked ? "grayscale(1) blur(.2px)" : `drop-shadow(0 18px 28px ${box.glow})`,
                        animation:
                          selectedBox === null
                            ? `boxBob ${box.bob}s ease-in-out infinite`
                            : "none",
                        "--tilt": `${box.tilt}deg`,
                      }}
                    >
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          aspectRatio: "1 / 1",
                          borderRadius: 28,
                          background: box.grad,
                          border: hoveredBox === box.index ? `3px solid ${box.accent}` : "3px solid rgba(255,255,255,.16)",
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
                            inset: 8,
                            borderRadius: 22,
                            border: "1px solid rgba(255,255,255,.18)",
                            background: "linear-gradient(180deg, rgba(255,255,255,.18), transparent 42%)",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: 12,
                            left: 12,
                            right: 12,
                            height: 18,
                            borderRadius: 999,
                            background: box.ribbon,
                            boxShadow: "0 2px 8px rgba(0,0,0,.12)",
                            opacity: 0.96,
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: 12,
                            bottom: 54,
                            left: "50%",
                            width: 18,
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
                            top: 22,
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: 36,
                            height: 22,
                            borderRadius: "50%",
                            border: `5px solid ${box.ribbon}`,
                            background: "transparent",
                            opacity: 0.96,
                          }}
                        />

                        <div
                          style={{
                            position: "absolute",
                            top: 14,
                            right: 14,
                            minWidth: 36,
                            height: 36,
                            borderRadius: 999,
                            background: "rgba(8,12,24,.34)",
                            border: "1px solid rgba(255,255,255,.16)",
                            display: "grid",
                            placeItems: "center",
                            color: "#fff",
                            fontWeight: 900,
                            fontSize: 15,
                            backdropFilter: "blur(6px)",
                            WebkitBackdropFilter: "blur(6px)",
                          }}
                        >
                          {box.index + 1}
                        </div>

                        <div
                          style={{
                            position: "absolute",
                            top: "38%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            fontSize: "clamp(32px, 3vw, 46px)",
                            filter: "drop-shadow(0 8px 14px rgba(0,0,0,.20))",
                          }}
                        >
                          {box.icon}
                        </div>

                        <div
                          style={{
                            position: "absolute",
                            left: 10,
                            right: 10,
                            bottom: 12,
                            minHeight: 44,
                            padding: "8px 10px",
                            borderRadius: 16,
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
                              fontSize: 14,
                              fontWeight: 900,
                              lineHeight: 1.15,
                              letterSpacing: ".02em",
                              textShadow: "0 2px 6px rgba(0,0,0,.45)",
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
                  fontSize: 20,
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
              gridTemplateColumns: "320px minmax(0, 1fr)",
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
                🏆 Seçilen Gizemli Kutu
              </div>

              <div
                style={{
                  borderRadius: 24,
                  padding: 18,
                  background: activeBox.grad,
                  color: "#fff",
                  boxShadow: `0 18px 40px ${activeBox.glow}`,
                  marginBottom: 16,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: -20,
                    right: -8,
                    fontSize: 60,
                    opacity: 0.22,
                  }}
                >
                  {activeBox.icon}
                </div>
                <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 6 }}>
                  KAZANILABİLECEK PUAN
                </div>
                <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1 }}>{points}</div>
                <div style={{ marginTop: 10, fontSize: 15, fontWeight: 800 }}>
                  {rewardTier} · {activeBox.name}
                </div>
                <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: activeBox.accent }}>
                  Kutuyu açtın. Şimdi üstteki büyük soru panelini çöz.
                </div>
              </div>

              <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
                {[
                  "🎯 Önce soru panelini oku",
                  "⌨️ A-D veya 1-4 ile seç",
                  `⭐ Doğru cevapta +${points} puan`,
                  "🎁 Her soruda yeni kutu açılır",
                ].map((item) => (
                  <div
                    key={item}
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
                    {item}
                  </div>
                ))}
              </div>

              <div
                style={{
                  borderRadius: 22,
                  padding: 16,
                  background: "linear-gradient(135deg, rgba(108,92,231,.18), rgba(255,255,255,.05))",
                  border: "1px solid rgba(108,92,231,.18)",
                }}
              >
                <div style={{ color: "#E6E0FF", fontSize: 12, fontWeight: 900, marginBottom: 8 }}>
                  AKTİF TUR BİLGİSİ
                </div>
                <div style={{ color: "#fff", fontSize: 16, fontWeight: 900, lineHeight: 1.4 }}>
                  Soru burada gizlenmez.
                </div>
                <div style={{ color: "#E5EEFF", fontSize: 13, lineHeight: 1.5, marginTop: 8 }}>
                  Oyuncu soru cümlesini aramasın diye görev cümlesi büyük, parlak ve merkezde tutulur.
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
                minHeight: 560,
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

              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  marginBottom: 18,
                  borderRadius: 28,
                  padding: 22,
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,.10), rgba(255,255,255,.04))",
                  border: "1px solid rgba(255,255,255,.12)",
                  boxShadow: "0 18px 38px rgba(0,0,0,.20)",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 14px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,.08)",
                    border: "1px solid rgba(255,255,255,.12)",
                    color: "#DCEBFF",
                    fontSize: 13,
                    fontWeight: 900,
                    marginBottom: 14,
                  }}
                >
                  📣 ŞİMDİ CEVAPLANACAK SORU
                </div>

                <div
                  className="openbox-question-title"
                  style={{
                    fontSize: "clamp(30px, 2.8vw, 40px)",
                    lineHeight: 1.28,
                    fontWeight: 1000,
                    color: "#fff",
                    textShadow: "0 2px 12px rgba(0,0,0,.22)",
                    maxHeight: 210,
                    overflowY: "auto",
                    paddingRight: 6,
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                  }}
                >
                  {q.q}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    marginTop: 16,
                  }}
                >
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,.08)",
                      border: "1px solid rgba(255,255,255,.10)",
                      color: "#EEF6FF",
                      fontSize: 13,
                      fontWeight: 900,
                    }}
                  >
                    {activeBox.icon} {activeBox.name}
                  </div>
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: 16,
                      background: "rgba(255,209,102,.10)",
                      border: "1px solid rgba(255,209,102,.16)",
                      color: "#FFF2C4",
                      fontSize: 13,
                      fontWeight: 900,
                    }}
                  >
                    Bu soru {points} puan değerinde
                  </div>
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
                    : "linear-gradient(135deg, rgba(255,255,255,.10), rgba(255,255,255,.04))";

                  const border = isAnswered
                    ? isCorrect
                      ? "1px solid rgba(46,204,113,.38)"
                      : isSelected
                      ? "1px solid rgba(231,76,60,.34)"
                      : "1px solid rgba(255,255,255,.06)"
                    : hoveredAnswer === i
                    ? `1px solid ${activeBox.accent}`
                    : "1px solid rgba(255,209,102,.16)";

                  return (
                    <button
                      key={i}
                      className="openbox-answer-btn"
                      disabled={isAnswered}
                      onMouseEnter={() => setHoveredAnswer(i)}
                      onMouseLeave={() => setHoveredAnswer(null)}
                      onClick={() => handleAnswer(i)}
                      style={{
                        minHeight: 110,
                        borderRadius: 22,
                        border,
                        background: bg,
                        padding: "16px 16px",
                        textAlign: "left",
                        boxShadow:
                          hoveredAnswer === i && !isAnswered
                            ? `0 14px 28px ${activeBox.glow}`
                            : "none",
                        opacity: isAnswered && !isCorrect && !isSelected ? 0.72 : 1,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div
                          style={{
                            width: 48,
                            minWidth: 48,
                            height: 48,
                            borderRadius: 16,
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
                            fontWeight: 1000,
                            fontSize: 17,
                            border: "1px solid rgba(255,255,255,.10)",
                            flexShrink: 0,
                          }}
                        >
                          {OPTION_LABELS[i] || i + 1}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              color: "#fff",
                              fontSize: 17,
                              lineHeight: 1.45,
                              fontWeight: 900,
                            }}
                          >
                            {opt}
                          </div>

                          {!isAnswered && (
                            <div
                              style={{
                                marginTop: 8,
                                fontSize: 12,
                                fontWeight: 900,
                                color: "#CFE2FF",
                              }}
                            >
                              {OPTION_LABELS[i]} / {i + 1} ile seçebilirsin
                            </div>
                          )}

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
                      width: spark.size,
                      height: spark.size,
                      background: spark.bg,
                      boxShadow: "0 0 20px rgba(255,255,255,.26)",
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
            <div className="openbox-reward-card" style={{ background: activeBox.grad }}>
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

              <div style={{ marginTop: 12, fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 900 }}>
                {rewardTier} · {activeBox.name}
              </div>

              <div style={{ marginTop: 14, fontSize: 16, fontWeight: 800, opacity: 0.96 }}>
                Kutunun içindeki puanlı görev hazırlanıyor
              </div>

              <div style={{ marginTop: 16, fontSize: 34 }}>{activeBox.icon}</div>
            </div>
          </div>
        )}

        {outcomeOverlay && (
          <div className="openbox-outcome-overlay">
            <div
              className="openbox-outcome-card"
              style={{
                background:
                  outcomeOverlay === "correct"
                    ? "linear-gradient(135deg, rgba(46,204,113,.92), rgba(22,163,74,.9))"
                    : "linear-gradient(135deg, rgba(239,68,68,.92), rgba(249,115,22,.9))",
              }}
            >
              <div className="openbox-outcome-wave" />
              <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: ".12em", opacity: 0.92 }}>
                {outcomeOverlay === "correct" ? "KUTU GÖREVİ TAMAMLANDI" : "KUTU GÖREVİ KAÇTI"}
              </div>
              <div style={{ fontSize: "clamp(58px, 9vw, 92px)", marginTop: 18 }}>
                {outcomeOverlay === "correct" ? "🎉" : "💥"}
              </div>
              <div style={{ marginTop: 10, fontSize: "clamp(24px, 3vw, 34px)", fontWeight: 1000 }}>
                {outcomeOverlay === "correct" ? `+${points} puanlık kutu başarıyla açıldı` : "Bu kutu kapandı, sıradaki sürpriz seni bekliyor"}
              </div>
              <div style={{ marginTop: 12, fontSize: 16, fontWeight: 800, opacity: 0.96 }}>
                {outcomeOverlay === "correct"
                  ? "Doğru cevapla birlikte ekranı kaplayan kutlama efekti açıldı"
                  : "Yanlış seçimden sonra yeni kutuya geçmeye hazır ol"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
