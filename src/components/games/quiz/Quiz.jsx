/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useRef, useState } from "react";
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
    if (timeLeft <= 3) return "Hızlı ol! Son saniyeler ⏳";
    if (combo >= 5) return "Muhteşem seri devam ediyor! 🔥";
    if (!used5050 && !usedTimeBonus) {
      return "İstersen joker kullanabilir ya da direkt cevaba gidebilirsin ✨";
    }
    if (timeLeft >= 10) return "Rahat düşün, en doğru cevabı seç 🌟";
    return "Dikkatini koru, doğru cevap çok yakın 👀";
  }

  if (ans === correctIndex) {
    if (combo >= 6) return "Efsane seri! Sen tam bir quiz ustasısın 👑";
    if (combo >= 4) return "Süper! Harika gidiyorsun 🚀";
    return "Bravo! Doğru cevap 🎉";
  }

  return "Sorun değil! Bir sonraki soruda daha güçlüsün ✨";
}

function getComboTitle(combo) {
  if (combo >= 8) return "Efsane Seri";
  if (combo >= 6) return "Mega Seri";
  if (combo >= 4) return "Süper Seri";
  if (combo >= 2) return "Seri Başladı";
  return null;
}

function estimateDifficulty(questionText = "", options = []) {
  const textLen = String(questionText).trim().length;
  const averageOptionLen =
    options.length > 0
      ? options.reduce((sum, item) => sum + String(item || "").length, 0) / options.length
      : 0;

  const raw = textLen * 0.65 + averageOptionLen * 1.75;

  if (raw >= 60) {
    return {
      label: "Zor",
      tone: "rgba(255,107,107,.18)",
      border: "rgba(255,107,107,.28)",
      color: "#FFE1DD",
      icon: "🧩",
    };
  }

  if (raw >= 38) {
    return {
      label: "Orta",
      tone: "rgba(255,230,109,.16)",
      border: "rgba(255,230,109,.22)",
      color: "#FFF4BF",
      icon: "⚡",
    };
  }

  return {
    label: "Akıcı",
    tone: "rgba(78,205,196,.16)",
    border: "rgba(78,205,196,.22)",
    color: "#D7FFFB",
    icon: "🌈",
  };
}

function getSpeedBadge(timeLeft) {
  if (timeLeft >= 11) {
    return {
      label: "Hız Bonusu Yüksek",
      tone: "linear-gradient(135deg,#4ECDC4,#6C5CE7)",
      glow: "0 10px 24px rgba(108,92,231,.22)",
    };
  }

  if (timeLeft >= 6) {
    return {
      label: "Tempo İyi",
      tone: "linear-gradient(135deg,#6C5CE7,#8E7DFF)",
      glow: "0 10px 24px rgba(108,92,231,.18)",
    };
  }

  return {
    label: "Acil Karar",
    tone: "linear-gradient(135deg,#FF6B6B,#F39C12)",
    glow: "0 10px 24px rgba(255,107,107,.18)",
  };
}

function getOptionHint(index) {
  return `${LETTERS[index]} / ${index + 1}`;
}

export default function Quiz({ q, qi, gqs, ans, hAns, tm, setTm, cb }) {
  const [used5050, setUsed5050] = useState(false);
  const [usedTimeBonus, setUsedTimeBonus] = useState(false);
  const [hiddenOptions, setHiddenOptions] = useState([]);
  const [pointBurst, setPointBurst] = useState(null);
  const [shakeWrong, setShakeWrong] = useState(false);
  const [sparkles, setSparkles] = useState([]);
  const [selectedHover, setSelectedHover] = useState(null);
  const [keyboardFlash, setKeyboardFlash] = useState(null);
  const [lastAction, setLastAction] = useState(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    setHiddenOptions([]);
    setPointBurst(null);
    setShakeWrong(false);
    setSparkles([]);
    setSelectedHover(null);
    setKeyboardFlash(null);
    setLastAction(null);
  }, [qi]);

  useEffect(() => {
    if (!q || ans === null) return;

    if (ans === q.a) {
      const earned = 100 + Math.max(0, (Number(tm) || 0) * 5);
      setPointBurst(`+${earned}`);
      setSparkles(
        Array.from({ length: 16 }).map((_, i) => ({
          id: `${qi}-${i}-${Date.now()}`,
          left: Math.random() * 100,
          delay: Math.random() * 0.25,
          size: 8 + Math.random() * 14,
          drift: -34 + Math.random() * 68,
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
  const difficultyMeta = estimateDifficulty(q?.q, q?.o);
  const speedMeta = getSpeedBadge(safeTime);
  const timerDegrees = clamp((safeTime / TIMER_MAX) * 360, 0, 360);

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

  const activeOptionIndexes = useMemo(
    () => visibleOptions.filter((item) => !item.hidden).map((item) => item.index),
    [visibleOptions]
  );

  function activate5050() {
    if (used5050 || ans !== null) return;

    const wrongIndexes = [0, 1, 2, 3]
      .filter((i) => i !== q.a)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);

    setHiddenOptions(wrongIndexes);
    setUsed5050(true);
    setLastAction("50-50 jokeri kullanıldı");
    SFX.reveal?.();
  }

  function activateTimeBonus() {
    if (usedTimeBonus || ans !== null) return;

    setTm((prev) => Math.min((prev || 0) + 5, 30));
    setUsedTimeBonus(true);
    setLastAction("+5 saniye bonusu alındı");
    SFX.whoosh?.();
  }

    function handleAnswer(index) {
    if (ans !== null) return;
    hAns(index);
  }

  useEffect(() => {
    if (!q || ans !== null) return undefined;

    const onKeyDown = (event) => {
      const targetTag = event.target?.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(targetTag)) return;

      const key = String(event.key || "").toLowerCase();
      let targetIndex = null;

      if (["1", "2", "3", "4"].includes(key)) {
        targetIndex = Number(key) - 1;
      } else if (["a", "b", "c", "d"].includes(key)) {
        targetIndex = LETTERS.findIndex((letter) => letter.toLowerCase() === key);
      } else if (key === "j") {
        event.preventDefault();
        activate5050();
        return;
      } else if (key === "t") {
        event.preventDefault();
        activateTimeBonus();
        return;
      }

      if (targetIndex === null) return;
      if (hiddenOptions.includes(targetIndex)) return;

      event.preventDefault();
      setKeyboardFlash(targetIndex);
      handleAnswer(targetIndex);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [q, ans, hiddenOptions, handleAnswer, activate5050, activateTimeBonus]);

  useEffect(() => {
    if (keyboardFlash === null) return undefined;
    const t = setTimeout(() => setKeyboardFlash(null), 240);
    return () => clearTimeout(t);
  }, [keyboardFlash]);

  if (!q) return null;

  function getOptionState(index) {
    const isAnswered = ans !== null;
    const isCorrect = index === q.a;
    const isSelected = ans === index;
    const isKeyboardTriggered = keyboardFlash === index;

    if (!isAnswered) {
      return {
        border: "1px solid rgba(255,255,255,.12)",
        background:
          selectedHover === index || isKeyboardTriggered
            ? "linear-gradient(180deg, rgba(124,92,255,.30), rgba(78,205,196,.16))"
            : "linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.05))",
        boxShadow:
          selectedHover === index || isKeyboardTriggered
            ? "0 16px 36px rgba(108,92,231,.22)"
            : "0 10px 24px rgba(0,0,0,.18)",
        transform:
          selectedHover === index || isKeyboardTriggered
            ? "translateY(-3px) scale(1.01)"
            : "scale(1)",
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
  }

  return (
    <div
      ref={wrapRef}
      style={{
        maxWidth: 1080,
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

        @keyframes urgentGlow {
          from { opacity: .45; }
          to { opacity: .95; }
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

        .quiz-option-help {
          opacity: .7;
          transition: opacity .18s ease, transform .18s ease;
        }

        .quiz-option-ultra:hover .quiz-option-help {
          opacity: 1;
          transform: translateY(-1px);
        }

        .quiz-question-panel {
          border-radius: 26px;
          padding: 18px 20px;
          border: 1px solid rgba(255,255,255,.10);
          background:
            radial-gradient(circle at top left, rgba(255,230,109,.12), transparent 34%),
            linear-gradient(180deg, rgba(255,255,255,.09), rgba(255,255,255,.045));
          box-shadow:
            0 14px 32px rgba(0,0,0,.16),
            inset 0 1px 0 rgba(255,255,255,.08);
        }

        .quiz-question-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: linear-gradient(135deg, rgba(255,230,109,.22), rgba(108,92,231,.22));
          border: 1px solid rgba(255,255,255,.12);
          color: #FFF7D1;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .6px;
          margin-bottom: 12px;
          text-transform: uppercase;
        }

        .quiz-question-text {
          font-size: clamp(25px, 2.7vw, 38px);
          line-height: 1.42;
          font-weight: 950;
          color: #fff;
          text-shadow: 0 2px 14px rgba(0,0,0,.22);
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .quiz-question-note {
          margin-top: 12px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 16px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.08);
          color: #EAF2FF;
          font-size: 13px;
          font-weight: 800;
        }

        .quiz-urgent-overlay {
          animation: urgentGlow .65s ease-in-out infinite alternate;
        }

        @media (max-width: 920px) {
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

          .quiz-question-panel {
            padding: 16px !important;
          }

          .quiz-question-text {
            font-size: 24px !important;
          }

          .quiz-timer-circle {
            width: 108px !important;
            height: 108px !important;
          }

          .quiz-help-row {
            flex-direction: column !important;
            align-items: stretch !important;
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
        {ans === null && isVeryLowTime && (
          <div
            className="quiz-urgent-overlay"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(255,107,107,.05), rgba(255,107,107,.02))",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
        )}

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
                background: difficultyMeta.tone,
                border: `1px solid ${difficultyMeta.border}`,
                color: difficultyMeta.color,
                fontSize: 13,
                fontWeight: 900,
              }}
            >
              {difficultyMeta.icon} {difficultyMeta.label}
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
                borderRadius: 999,
                background: speedMeta.tone,
                color: "#fff",
                fontSize: 13,
                fontWeight: 900,
                boxShadow: speedMeta.glow,
              }}
            >
              ⚡ {speedMeta.label}
            </div>

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
                maxWidth: 380,
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
            gridTemplateColumns: "290px 1fr",
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
                  width: 138,
                  height: 138,
                  borderRadius: "50%",
                  padding: 8,
                  background: `conic-gradient(${isVeryLowTime ? "#FF6B6B" : isLowTime ? "#F39C12" : "#4ECDC4"} ${timerDegrees}deg, rgba(255,255,255,.08) 0deg)`,
                  boxShadow: isVeryLowTime
                    ? "0 14px 34px rgba(231,76,60,.28)"
                    : isLowTime
                    ? "0 14px 34px rgba(243,156,18,.26)"
                    : "0 14px 34px rgba(108,92,231,.24)",
                  border: "1px solid rgba(255,255,255,.12)",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    background: isVeryLowTime
                      ? "linear-gradient(135deg,#FF6B6B,#E74C3C)"
                      : isLowTime
                      ? "linear-gradient(135deg,#F39C12,#F1C40F)"
                      : "linear-gradient(135deg,#4ECDC4,#6C5CE7)",
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
                marginBottom: 14,
              }}
            >
              <button
                onClick={activate5050}
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
                ✂️ 50-50 Jokeri {ans === null && !used5050 ? "(J)" : ""}
              </button>

              <button
                onClick={activateTimeBonus}
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
                ⏱️ +5 Saniye {ans === null && !usedTimeBonus ? "(T)" : ""}
              </button>
            </div>

            <div
              style={{
                borderRadius: 18,
                padding: 14,
                border: "1px solid rgba(255,255,255,.08)",
                background: "rgba(255,255,255,.045)",
                display: "grid",
                gap: 8,
              }}
            >
              <div
                style={{
                  color: "#DCEBFF",
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: ".4px",
                }}
              >
                HIZLI OYUN KISAYOLLARI
              </div>

              <div style={{ color: "rgba(255,255,255,.84)", fontSize: 13, lineHeight: 1.5 }}>
                Cevap için <strong>1-4</strong> veya <strong>A-D</strong> kullan.
              </div>
              <div style={{ color: "rgba(255,255,255,.70)", fontSize: 12, lineHeight: 1.45 }}>
                {lastAction || "J: 50-50 jokeri • T: +5 saniye"}
              </div>
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
                marginBottom: 18,
              }}
            >
              <div
                className="quiz-help-row"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 14,
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
                  }}
                >
                  🧠 Bilgi Görevi
                </div>

                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,.06)",
                    border: "1px solid rgba(255,255,255,.08)",
                    color: "#EAF2FF",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {activeOptionIndexes.length} seçenek aktif
                </div>
              </div>

              <div className="quiz-question-panel">
                <div className="quiz-question-kicker">📢 Şimdi cevaplanacak soru</div>

                <div className="quiz-question-text">
                  {q.q}
                </div>

                <div className="quiz-question-note">
                  👀 Önce soruyu oku, sonra en doğru seçeneği işaretle.
                </div>
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
                        minHeight: 96,
                        borderRadius: 22,
                        border: "1px dashed rgba(255,255,255,.10)",
                        background: "rgba(255,255,255,.035)",
                        display: "grid",
                        placeItems: "center",
                        color: "rgba(255,255,255,.42)",
                        fontWeight: 800,
                        fontSize: 14,
                        textAlign: "center",
                        padding: 10,
                      }}
                    >
                      🚫 Bu seçenek joker ile elendi
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
                      minHeight: 96,
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
                          minWidth: 44,
                          width: 44,
                          height: 44,
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
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 10,
                            marginBottom: 4,
                          }}
                        >
                          <div
                            style={{
                              color: "#fff",
                              fontSize: 16,
                              lineHeight: 1.45,
                              fontWeight: 800,
                              textAlign: "left",
                              flex: 1,
                              wordBreak: "break-word",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {text}
                          </div>

                          {ans === null && (
                            <div
                              className="quiz-option-help"
                              style={{
                                flexShrink: 0,
                                padding: "6px 9px",
                                borderRadius: 999,
                                background: "rgba(255,255,255,.08)",
                                border: "1px solid rgba(255,255,255,.08)",
                                color: "#D8E6FF",
                                fontSize: 11,
                                fontWeight: 900,
                              }}
                            >
                              {getOptionHint(index)}
                            </div>
                          )}
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
                ⌨️ Klavye ile oynanabilir
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
