/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { SFX } from "../../../utils/audio";

const LETTERS = ["A", "B", "C", "D"];
const TIMER_MAX = 15;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getEncourageMessage({
  ans,
  correctIndex,
  combo,
  timeLeft,
  used5050,
  usedTimeBonus,
}) {
  if (ans === null) {
    if (timeLeft <= 3) return "Hızlı ol! Süre bitmek üzere ⏳";
    if (combo >= 5) return "Muhteşem seri devam ediyor! 🔥";
    if (!used5050 && !usedTimeBonus) return "İpucu kullanabilir veya hemen cevaplayabilirsin ✨";
    return "Dikkatle düşün ve en doğru cevabı seç 🌟";
  }

  if (ans === correctIndex) {
    if (combo >= 6) return "Efsane seri! Sen tam bir quiz ustasısın 👑";
    if (combo >= 4) return "Süper! Harika gidiyorsun 🚀";
    return "Bravo! Doğru cevap 🎉";
  }

  return "Sorun değil! Doğru cevap sana ışık olsun ✨";
}

function getComboTitle(combo) {
  if (combo >= 8) return "Efsane Seri";
  if (combo >= 6) return "Mega Seri";
  if (combo >= 4) return "Süper Seri";
  if (combo >= 2) return "Seri Başladı";
  return null;
}

export default function Quiz({ q, qi, gqs, ans, hAns, tm, setTm, cb }) {
  const [used5050, setUsed5050] = useState(false);
  const [usedTimeBonus, setUsedTimeBonus] = useState(false);
  const [hiddenOptions, setHiddenOptions] = useState([]);
  const [pointBurst, setPointBurst] = useState(null);
  const [shakeWrong, setShakeWrong] = useState(false);
  const [sparkles, setSparkles] = useState([]);
  const [selectedHover, setSelectedHover] = useState(null);

  useEffect(() => {
    setHiddenOptions([]);
    setPointBurst(null);
    setShakeWrong(false);
    setSparkles([]);
    setSelectedHover(null);
  }, [qi]);

  useEffect(() => {
    if (!q || ans === null) return;

    if (ans === q.a) {
      const earned = 100 + Math.max(0, (Number(tm) || 0) * 5);
        setPointBurst(`+${earned}`);
      setSparkles(
        Array.from({ length: 14 }).map((_, i) => ({
          id: `${qi}-${i}-${Date.now()}`,
          left: Math.random() * 100,
          delay: Math.random() * 0.25,
          size: 8 + Math.random() * 14,
          drift: -30 + Math.random() * 60,
        }))
      );

      const t = setTimeout(() => {
        setPointBurst(null);
        setSparkles([]);
      }, 1200);

      return () => clearTimeout(t);
    }

    setShakeWrong(true);
    const t = setTimeout(() => setShakeWrong(false), 520);
    return () => clearTimeout(t);
  }, [ans, q, tm, qi]);

  const safeTime = clamp(Number(tm) || 0, 0, 30);
  const total = gqs?.length || 1;
  const current = (qi || 0) + 1;
  const progress = clamp((current / total) * 100, 0, 100);
  const timerPercent = clamp((safeTime / TIMER_MAX) * 100, 0, 100);
  const isLowTime = safeTime <= 5;
  const isVeryLowTime = safeTime <= 3;
  const combo = cb || 0;
  const comboTitle = getComboTitle(combo);
  const correctRateStars = Math.min(3, Math.max(1, Math.ceil((combo + 1) / 3)));

  const feedbackText = getEncourageMessage({
    ans,
    correctIndex: q?.a,
    combo,
    timeLeft: safeTime,
    used5050,
    usedTimeBonus,
  });

  const visibleOptions = useMemo(() => {
    if (!q?.o) return [];
    return q.o.map((text, index) => ({
      text,
      index,
      hidden: hiddenOptions.includes(index),
    }));
  }, [q, hiddenOptions]);

  if (!q) return null;

  const use5050 = () => {
    if (used5050 || ans !== null) return;

    const wrongIndexes = [0, 1, 2, 3]
      .filter((i) => i !== q.a)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);

    setHiddenOptions(wrongIndexes);
    setUsed5050(true);
    SFX.reveal?.();
  };

  const useTimeBonus = () => {
    if (usedTimeBonus || ans !== null) return;

    setTm((prev) => Math.min((prev || 0) + 5, 30));
    setUsedTimeBonus(true);
    SFX.whoosh?.();
  };

  const handleAnswer = (index) => {
    if (ans !== null) return;
    hAns(index);
  };

  const getOptionState = (index) => {
    const isAnswered = ans !== null;
    const isCorrect = index === q.a;
    const isSelected = ans === index;

    if (!isAnswered) {
      return {
        border: "1px solid rgba(255,255,255,.12)",
        background:
          selectedHover === index
            ? "linear-gradient(180deg, rgba(124,92,255,.28), rgba(78,205,196,.14))"
            : "linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.05))",
        boxShadow:
          selectedHover === index
            ? "0 16px 36px rgba(108,92,231,.20)"
            : "0 10px 24px rgba(0,0,0,.18)",
        transform:
          selectedHover === index ? "translateY(-3px) scale(1.01)" : "scale(1)",
        opacity: 1,
      };
    }

    if (isCorrect) {
      return {
        border: "1px solid rgba(46,204,113,.55)",
        background:
          "linear-gradient(180deg, rgba(46,204,113,.42), rgba(46,204,113,.18))",
        boxShadow:
          "0 0 0 3px rgba(46,204,113,.10), 0 12px 28px rgba(46,204,113,.20)",
        transform: "scale(1.015)",
        opacity: 1,
      };
    }

    if (isSelected) {
      return {
        border: "1px solid rgba(231,76,60,.58)",
        background:
          "linear-gradient(180deg, rgba(231,76,60,.38), rgba(231,76,60,.16))",
        boxShadow:
          "0 0 0 3px rgba(231,76,60,.08), 0 12px 28px rgba(231,76,60,.16)",
        transform: "scale(.992)",
        opacity: 1,
      };
    }

    return {
      border: "1px solid rgba(255,255,255,.06)",
      background: "rgba(255,255,255,.035)",
      boxShadow: "none",
      transform: "scale(1)",
      opacity: 0.72,
    };
  };

  return (
    <div
      style={{
        maxWidth: 980,
        margin: "0 auto",
        position: "relative",
        animation: "quizUltraEnter .45s ease",
      }}
    >
      <style>{`
        @keyframes quizUltraEnter {
          from { opacity: 0; transform: translateY(18px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes quizPulseSoft {
          from { transform: scale(1); }
          to { transform: scale(1.03); }
        }

        @keyframes quizDangerPulse {
          from {
            transform: scale(1);
            box-shadow: 0 0 0 rgba(255,99,99,0);
          }
          to {
            transform: scale(1.04);
            box-shadow: 0 0 28px rgba(255,99,99,.22);
          }
        }

        @keyframes quizBurstFloat {
          0% {
            opacity: 0;
            transform: translateY(12px) scale(.75);
          }
          25% {
            opacity: 1;
            transform: translateY(-2px) scale(1.08);
          }
          100% {
            opacity: 0;
            transform: translateY(-34px) scale(1.12);
          }
        }

        @keyframes quizShake {
          0% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }

        @keyframes sparkleFly {
          0% {
            opacity: 0;
            transform: translate(0, 14px) scale(.4) rotate(0deg);
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(var(--dx), -86px) scale(1.1) rotate(160deg);
          }
        }

        @keyframes glowBar {
          from { filter: brightness(1); }
          to { filter: brightness(1.15); }
        }

        .quiz-ultra-card {
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .quiz-option-ultra {
          width: 100%;
          text-align: left;
          cursor: pointer;
          transition: transform .22s ease, box-shadow .22s ease, background .22s ease, border-color .22s ease, opacity .22s ease;
        }

        .quiz-option-ultra:disabled {
          cursor: default;
        }

        .quiz-burst {
          animation: quizBurstFloat 1.1s ease forwards;
        }

        .quiz-combo-badge {
          animation: quizPulseSoft .8s ease-in-out infinite alternate;
        }

        .quiz-timer-danger {
          animation: quizDangerPulse .55s ease-in-out infinite alternate;
        }

        .quiz-shake {
          animation: quizShake .45s ease;
        }

        .quiz-progress-glow {
          animation: glowBar .9s ease-in-out infinite alternate;
        }

        .quiz-sparkle {
          position: absolute;
          bottom: 44px;
          width: var(--size);
          height: var(--size);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,230,109,1) 35%, rgba(255,255,255,0) 72%);
          animation: sparkleFly 1.05s ease-out forwards;
          animation-delay: var(--delay);
          pointer-events: none;
          filter: blur(.3px);
        }

        @media (max-width: 860px) {
          .quiz-ultra-layout {
            grid-template-columns: 1fr !important;
          }
          .quiz-options-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 640px) {
          .quiz-top-strip {
            flex-direction: column;
            align-items: stretch !important;
          }
          .quiz-stats-pack {
            justify-content: center !important;
          }
          .quiz-question-text {
            font-size: 22px !important;
          }
          .quiz-timer-circle {
            width: 104px !important;
            height: 104px !important;
          }
        }
      `}</style>

      {pointBurst && (
        <div
          className="quiz-burst"
          style={{
            position: "absolute",
            top: 126,
            right: 20,
            zIndex: 7,
            padding: "10px 16px",
            borderRadius: 999,
            background: "linear-gradient(135deg,#FFE66D,#2ecc71)",
            color: "#1b1f2a",
            fontWeight: 900,
            fontSize: 18,
            boxShadow: "0 14px 28px rgba(0,0,0,.22)",
          }}
        >
          {pointBurst}
        </div>
      )}

      {sparkles.map((item) => (
        <span
          key={item.id}
          className="quiz-sparkle"
          style={{
            left: `${item.left}%`,
            "--delay": `${item.delay}s`,
            "--size": `${item.size}px`,
            "--dx": `${item.drift}px`,
          }}
        />
      ))}

      <div
        className="quiz-ultra-card"
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 32,
          padding: 20,
          border: "1px solid rgba(255,255,255,.10)",
          background:
            "radial-gradient(circle at top left, rgba(108,92,231,.24), transparent 28%), radial-gradient(circle at top right, rgba(78,205,196,.18), transparent 24%), linear-gradient(180deg, rgba(9,12,24,.86), rgba(15,20,34,.94))",
          boxShadow: "0 18px 60px rgba(0,0,0,.30)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -60,
            left: -50,
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: "rgba(108,92,231,.18)",
            filter: "blur(16px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -70,
            right: -20,
            width: 190,
            height: 190,
            borderRadius: "50%",
            background: "rgba(78,205,196,.14)",
            filter: "blur(18px)",
          }}
        />

        <div
          className="quiz-top-strip"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 14,
            marginBottom: 18,
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,.08)",
                border: "1px solid rgba(255,255,255,.08)",
                color: "#EEF4FF",
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: ".4px",
              }}
            >
              SORU {current}/{total}
            </div>

            <div
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                background: "rgba(255,230,109,.12)",
                border: "1px solid rgba(255,230,109,.18)",
                color: "#FFF4BF",
                fontSize: 13,
                fontWeight: 900,
              }}
            >
              {"⭐".repeat(correctRateStars)}
            </div>

            {comboTitle && (
              <div
                className="quiz-combo-badge"
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: "linear-gradient(135deg,#FF6B6B,#FFE66D)",
                  color: "#1B1F2A",
                  fontSize: 13,
                  fontWeight: 900,
                  boxShadow: "0 10px 24px rgba(255,107,107,.22)",
                }}
              >
                🔥 {comboTitle}
              </div>
            )}
          </div>

          <div
            className="quiz-stats-pack"
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 16,
                background:
                  ans === null
                    ? "rgba(78,205,196,.10)"
                    : ans === q.a
                    ? "rgba(46,204,113,.12)"
                    : "rgba(255,107,107,.10)",
                border:
                  ans === null
                    ? "1px solid rgba(78,205,196,.18)"
                    : ans === q.a
                    ? "1px solid rgba(46,204,113,.20)"
                    : "1px solid rgba(255,107,107,.18)",
                color: "#FFFFFF",
                fontSize: 13,
                fontWeight: 800,
                maxWidth: 360,
              }}
            >
              {feedbackText}
            </div>
          </div>
        </div>

        <div
          className="quiz-ultra-layout"
          style={{
            display: "grid",
            gridTemplateColumns: "260px 1fr",
            gap: 20,
            alignItems: "stretch",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            className="quiz-ultra-card"
            style={{
              borderRadius: 28,
              padding: 18,
              border: "1px solid rgba(255,255,255,.08)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)",
            }}
          >
            <div
              style={{
                display: "grid",
                placeItems: "center",
                marginBottom: 14,
              }}
            >
              <div
                className={`quiz-timer-circle ${isLowTime ? "quiz-timer-danger" : ""}`}
                style={{
                  width: 126,
                  height: 126,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: isVeryLowTime
                    ? "linear-gradient(135deg,#FF6B6B,#E74C3C)"
                    : isLowTime
                    ? "linear-gradient(135deg,#F39C12,#F1C40F)"
                    : "linear-gradient(135deg,#4ECDC4,#6C5CE7)",
                  boxShadow: isVeryLowTime
                    ? "0 14px 34px rgba(231,76,60,.28)"
                    : isLowTime
                    ? "0 14px 34px rgba(243,156,18,.26)"
                    : "0 14px 34px rgba(108,92,231,.24)",
                  border: "4px solid rgba(255,255,255,.16)",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 900,
                      letterSpacing: ".5px",
                      opacity: .94,
                    }}
                  >
                    SÜRE
                  </div>
                  <div
                    style={{
                      fontSize: 42,
                      lineHeight: 1,
                      fontWeight: 900,
                      color: "#fff",
                      marginTop: 4,
                    }}
                  >
                    {safeTime}
                  </div>
                </div>
              </div>
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
                <span>Zaman Enerjisi</span>
                <span>%{Math.round(timerPercent)}</span>
              </div>

              <div
                style={{
                  width: "100%",
                  height: 16,
                  background: "rgba(255,255,255,.08)",
                  borderRadius: 999,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,.06)",
                  boxShadow: "inset 0 2px 8px rgba(0,0,0,.16)",
                }}
              >
                <div
                  className="quiz-progress-glow"
                  style={{
                    width: `${timerPercent}%`,
                    height: "100%",
                    borderRadius: 999,
                    transition: "width .35s linear, background .25s ease",
                    background: isVeryLowTime
                      ? "linear-gradient(90deg,#FF6B6B,#E74C3C)"
                      : isLowTime
                      ? "linear-gradient(90deg,#F39C12,#F1C40F)"
                      : "linear-gradient(90deg,#4ECDC4,#6C5CE7,#FFE66D)",
                    boxShadow: "0 0 18px rgba(108,92,231,.24)",
                  }}
                />
              </div>
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
                <span>Quiz Yolculuğu</span>
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

            <div
              style={{
                display: "grid",
                gap: 10,
              }}
            >
              <button
                onClick={use5050}
                disabled={used5050 || ans !== null}
                style={{
                  padding: "14px 14px",
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,.10)",
                  background:
                    used5050 || ans !== null
                      ? "rgba(255,255,255,.05)"
                      : "linear-gradient(135deg,#6C5CE7,#4ECDC4)",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 14,
                  cursor: used5050 || ans !== null ? "default" : "pointer",
                  opacity: used5050 || ans !== null ? 0.5 : 1,
                  boxShadow:
                    used5050 || ans !== null
                      ? "none"
                      : "0 10px 24px rgba(108,92,231,.22)",
                }}
              >
                ✂️ 50-50 Jokeri
              </button>

              <button
                onClick={useTimeBonus}
                disabled={usedTimeBonus || ans !== null}
                style={{
                  padding: "14px 14px",
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,.10)",
                  background:
                    usedTimeBonus || ans !== null
                      ? "rgba(255,255,255,.05)"
                      : "linear-gradient(135deg,#F39C12,#F1C40F)",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 14,
                  cursor: usedTimeBonus || ans !== null ? "default" : "pointer",
                  opacity: usedTimeBonus || ans !== null ? 0.5 : 1,
                  boxShadow:
                    usedTimeBonus || ans !== null
                      ? "none"
                      : "0 10px 24px rgba(243,156,18,.22)",
                }}
              >
                ⏱️ +5 Saniye
              </button>
            </div>
          </div>

          <div
            className={`quiz-ultra-card ${shakeWrong ? "quiz-shake" : ""}`}
            style={{
              borderRadius: 28,
              padding: 20,
              border: "1px solid rgba(255,255,255,.08)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -35,
                right: -20,
                width: 110,
                height: 110,
                borderRadius: "50%",
                background: "rgba(255,230,109,.10)",
                filter: "blur(10px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: -26,
                left: -10,
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: "rgba(108,92,231,.12)",
                filter: "blur(12px)",
              }}
            />

            <div
              style={{
                position: "relative",
                zIndex: 1,
                marginBottom: 16,
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
                🧠 Bilgi Görevi
              </div>

              <div
                className="quiz-question-text"
                style={{
                  fontSize: "clamp(24px, 2.7vw, 34px)",
                  lineHeight: 1.4,
                  fontWeight: 900,
                  color: "#fff",
                  textShadow: "0 2px 12px rgba(0,0,0,.20)",
                }}
              >
                {q.q}
              </div>
            </div>

            <div
              className="quiz-options-grid"
              style={{
                position: "relative",
                zIndex: 1,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
              }}
            >
              {visibleOptions.map(({ text, index, hidden }) => {
                if (hidden) {
                  return (
                    <div
                      key={index}
                      style={{
                        minHeight: 88,
                        borderRadius: 22,
                        border: "1px dashed rgba(255,255,255,.10)",
                        background: "rgba(255,255,255,.035)",
                        display: "grid",
                        placeItems: "center",
                        color: "rgba(255,255,255,.35)",
                        fontWeight: 800,
                        fontSize: 14,
                      }}
                    >
                      Gizli seçenek
                    </div>
                  );
                }

                const optionStyle = getOptionState(index);
                const isCorrect = ans !== null && index === q.a;
                const isSelected = ans === index;

                return (
                  <button
                    key={index}
                    className="quiz-option-ultra"
                    disabled={ans !== null}
                    onMouseEnter={() => setSelectedHover(index)}
                    onMouseLeave={() => setSelectedHover(null)}
                    onClick={() => handleAnswer(index)}
                    style={{
                      minHeight: 88,
                      borderRadius: 22,
                      padding: "16px 16px",
                      ...optionStyle,
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
                          minWidth: 42,
                          width: 42,
                          height: 42,
                          borderRadius: 14,
                          display: "grid",
                          placeItems: "center",
                          background:
                            ans === null
                              ? "rgba(255,255,255,.10)"
                              : isCorrect
                              ? "rgba(46,204,113,.26)"
                              : isSelected
                              ? "rgba(231,76,60,.26)"
                              : "rgba(255,255,255,.06)",
                          color: "#fff",
                          fontWeight: 900,
                          fontSize: 16,
                          border: "1px solid rgba(255,255,255,.10)",
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)",
                          flexShrink: 0,
                        }}
                      >
                        {LETTERS[index]}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            color: "#fff",
                            fontSize: 16,
                            lineHeight: 1.45,
                            fontWeight: 800,
                            textAlign: "left",
                          }}
                        >
                          {text}
                        </div>

                        {ans !== null && isCorrect && (
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

                        {ans !== null && isSelected && !isCorrect && (
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

            <div
              style={{
                position: "relative",
                zIndex: 1,
                marginTop: 18,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,.06)",
                  border: "1px solid rgba(255,255,255,.08)",
                  color: "#DCEBFF",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                🎯 Amaç: doğruyu hızlı bul
              </div>

              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,.06)",
                  border: "1px solid rgba(255,255,255,.08)",
                  color: "#DCEBFF",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                ⚡ Hızlı cevap = daha çok puan
              </div>

              {combo > 0 && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 999,
                    background: "rgba(255,107,107,.10)",
                    border: "1px solid rgba(255,107,107,.16)",
                    color: "#FFE1DD",
                    fontSize: 13,
                    fontWeight: 900,
                  }}
                >
                  🔥 Aktif seri: {combo}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}