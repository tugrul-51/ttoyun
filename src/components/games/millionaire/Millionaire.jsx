import { useEffect, useMemo, useState } from "react";
import { SFX } from "../../../utils/audio";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

const LETTERS = ["A", "B", "C", "D"];
const BASE_MONEY_TREE = [100, 200, 300, 500, 750, 1000, 1500, 2500, 5000, 10000];

function buildMoneyTree(total) {
  const target = Math.max(total || 1, 1);
  const ladder = [...BASE_MONEY_TREE];
  while (ladder.length < target) {
    const last = ladder[ladder.length - 1] || 10000;
    const multiplier = ladder.length < 12 ? 1.6 : ladder.length < 16 ? 1.45 : 1.35;
    ladder.push(Math.round(last * multiplier / 50) * 50);
  }
  return ladder.slice(0, target);
}

function getStageRatio(index, total) {
  const safeTotal = Math.max(total || 1, 1);
  return ((index || 0) + 1) / safeTotal;
}

function getTierLabel(index, total) {
  const ratio = getStageRatio(index, total);
  if (ratio >= 0.9) return "Büyük Final";
  if (ratio >= 0.65) return "Usta Seviye";
  if (ratio >= 0.35) return "Orta Seviye";
  return "Başlangıç";
}

function getMilestoneLabel(index, total) {
  const ratio = getStageRatio(index, total);
  if (ratio >= 0.95) return "👑 Şampiyonluk Sorusu";
  if (ratio >= 0.72) return "🔥 Kritik Bölge";
  if (ratio >= 0.45) return "⭐ Güvenli Bölge";
  return "🎯 Isınma Turu";
}

function getStatusText(ans, correctIndex, qi, total) {
  const ratio = getStageRatio(qi, total);
  if (ans === null) {
    if (ratio >= 0.9) return "Son soru bölgesindesin. Dikkatini topla ve en doğru kararı ver 👑";
    if (ratio >= 0.55) return "Harika gidiyorsun. Jokerlerini akıllı zamanda kullan ⭐";
    return "Büyük sahne seni bekliyor. Soruyu dikkatle okuyup doğru cevabı seç 💡";
  }

  if (ans === correctIndex) {
    if (ratio >= 0.9) return "Muhteşem! Final seviyesinde doğru cevap verdin 🎉";
    return "Harika seçim! Bir sonraki büyük soruya hazırsın ✅";
  }

  return "Yanlış cevap seçildi. Yarışma akışı devam ediyor, sahne hâlâ sende ✨";
}

function getStageMood(qi, total) {
  const ratio = getStageRatio(qi, total);
  if (ratio >= 0.9) return "Final Nabzı";
  if (ratio >= 0.65) return "Yüksek Gerilim";
  if (ratio >= 0.35) return "Yükselen Tempo";
  return "Sakin Başlangıç";
}

function getHostTip(qi, ans, total) {
  const ratio = getStageRatio(qi, total);
  if (ans !== null) return "Sunucu notu: Cevap açıklandı. Şimdi sıradaki sahneye hazırlan. 🎙️";
  if (ratio >= 0.82) return "Sunucu notu: Final yaklaşırken önce soruyu, sonra şıkları ikinci kez gözden geçir. 👑";
  if (ratio >= 0.52) return "Sunucu notu: Zorlaşan turdasın. Jokerleri son anda değil, gerçekten gerektiğinde kullan. ⭐";
  return "Sunucu notu: Önce büyük soru panelini oku, sonra şıkları tek tek karşılaştır. 💡";
}

function getQuestionPressure(qi, tm, total) {
  const ratio = getStageRatio(qi, total);
  const stagePressure = ratio >= 0.9 ? 92 : ratio >= 0.65 ? 78 : ratio >= 0.35 ? 58 : 36;
  const timerPressure = typeof tm === "number" && tm !== 9999 ? clamp((15 - tm) * 6.5, 0, 64) : 0;
  return clamp(stagePressure + timerPressure, 0, 100);
}

export default function Millionaire({ q, qi, gqs, ans, hAns, jk, useJk: onUseJoker, tm = 9999 }) {
  const [hovered, setHovered] = useState(null);
  const [shakeWrong, setShakeWrong] = useState(false);
  const [burst, setBurst] = useState(false);
  const [sparkles, setSparkles] = useState([]);
  const [answerFlash, setAnswerFlash] = useState(null);

  useEffect(() => {
    setHovered(null);
    setShakeWrong(false);
    setBurst(false);
    setSparkles([]);
    setAnswerFlash(null);
    if ((qi || 0) > 0) {
      SFX.levelUp?.();
    }
  }, [qi]);

  useEffect(() => {
    if (!q || ans === null) return undefined;

    if (ans === q.a) {
      setBurst(true);
      setSparkles(
        Array.from({ length: 18 }).map((_, i) => ({
          id: `${qi}-${i}-${Date.now()}`,
          left: 8 + Math.random() * 84,
          top: 14 + Math.random() * 60,
          dx: -82 + Math.random() * 164,
          dy: -54 + Math.random() * 108,
          delay: Math.random() * 0.18,
        }))
      );
      SFX.reveal?.();

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

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!q) return;
      const key = event.key.toLowerCase();

      if (ans === null) {
        if (["1", "2", "3", "4"].includes(key)) {
          const index = Number(key) - 1;
          if (!q.hid?.includes(index) && q.o[index]) {
            event.preventDefault();
            setAnswerFlash(index);
            SFX.click?.();
            hAns(index);
          }
          return;
        }

        const letterIndex = LETTERS.findIndex((letter) => letter.toLowerCase() === key);
        if (letterIndex !== -1 && !q.hid?.includes(letterIndex) && q.o[letterIndex]) {
          event.preventDefault();
          setAnswerFlash(letterIndex);
          SFX.click?.();
          hAns(letterIndex);
          return;
        }

        if (key === "f" && jk?.fifty) {
          event.preventDefault();
          SFX.whoosh?.();
          onUseJoker?.("fifty");
          return;
        }

        if ((key === "g" || key === "s") && jk?.skip) {
          event.preventDefault();
          SFX.whoosh?.();
          onUseJoker?.("skip");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [ans, hAns, jk, onUseJoker, q]);

  const total = gqs?.length || 1;
  const current = (qi || 0) + 1;
  const progress = clamp((current / total) * 100, 0, 100);
  const tierLabel = getTierLabel(qi || 0, total);
  const milestoneLabel = getMilestoneLabel(qi || 0, total);
  const stageMood = getStageMood(qi || 0, total);
  const statusText = getStatusText(ans, q?.a, qi || 0, total);
  const hostTip = getHostTip(qi || 0, ans, total);
  const pressure = getQuestionPressure(qi || 0, tm, total);
  const isUrgent = typeof tm === "number" && tm !== 9999 && tm <= 5;
  const timerProgress = typeof tm === "number" && tm !== 9999 ? clamp((tm / 30) * 100, 0, 100) : 100;

  const moneyLadder = useMemo(() => {
    return buildMoneyTree(total).map((value, i) => ({
      value,
      active: i === qi,
      passed: i < qi,
      safe: i === 4 || i === 7 || i === total - 1,
    }));
  }, [qi, total]);

  const stageLights = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => ({
        id: `light-${i}`,
        left: 6 + i * 13.8,
        delay: i * 0.18,
        duration: 3.8 + (i % 3) * 0.7,
      })),
    []
  );

  if (!q) return null;

  const handleJoker = (type) => {
    if (!jk?.[type] || ans !== null) return;
    SFX.whoosh?.();
    onUseJoker?.(type);
  };

  const handleAnswer = (index) => {
    if (ans !== null) return;
    setAnswerFlash(index);
    SFX.click?.();
    hAns(index);
  };

  const getAnswerState = (i) => {
    const isAnswered = ans !== null;
    const isCorrect = i === q.a;
    const isSelected = ans === i;
    const isFlashing = answerFlash === i && ans === null;

    if (!isAnswered) {
      return {
        bg:
          hovered === i || isFlashing
            ? "linear-gradient(135deg, rgba(255,215,130,.18), rgba(108,92,231,.12))"
            : "linear-gradient(135deg, rgba(255,255,255,.09), rgba(255,255,255,.04))",
        border:
          hovered === i || isFlashing
            ? "1px solid rgba(247,215,116,.34)"
            : "1px solid rgba(212,175,55,.18)",
        boxShadow:
          hovered === i || isFlashing
            ? "0 18px 36px rgba(212,175,55,.22), 0 0 0 3px rgba(247,215,116,.08)"
            : "0 10px 20px rgba(0,0,0,.16)",
        opacity: 1,
      };
    }

    if (isCorrect) {
      return {
        bg: "linear-gradient(135deg, rgba(46,204,113,.28), rgba(46,204,113,.12))",
        border: "1px solid rgba(46,204,113,.42)",
        boxShadow: "0 0 0 3px rgba(46,204,113,.10), 0 18px 32px rgba(46,204,113,.14)",
        opacity: 1,
      };
    }

    if (isSelected) {
      return {
        bg: "linear-gradient(135deg, rgba(231,76,60,.28), rgba(231,76,60,.12))",
        border: "1px solid rgba(231,76,60,.36)",
        boxShadow: "0 0 0 3px rgba(231,76,60,.08), 0 18px 32px rgba(231,76,60,.12)",
        opacity: 1,
      };
    }

    return {
      bg: "linear-gradient(135deg, rgba(255,255,255,.04), rgba(255,255,255,.025))",
      border: "1px solid rgba(255,255,255,.06)",
      boxShadow: "none",
      opacity: 0.72,
    };
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "min(1500px, 98vw)",
        margin: "0 auto",
        position: "relative",
        animation: "millUltraEnter .48s ease",
      }}
    >
      <style>{`
        @keyframes millUltraEnter {
          from { opacity: 0; transform: translateY(18px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes millPulse {
          from { transform: scale(1); }
          to { transform: scale(1.04); }
        }

        @keyframes millGlowBar {
          from { filter: brightness(1); }
          to { filter: brightness(1.15); }
        }

        @keyframes millShake {
          0% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }

        @keyframes millSpark {
          0% {
            opacity: 1;
            transform: translate(0,0) scale(.55) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translate(var(--dx), var(--dy)) scale(1.18) rotate(220deg);
          }
        }

        @keyframes millStagePulse {
          0% { box-shadow: 0 0 0 rgba(247,215,116,0); }
          50% { box-shadow: 0 0 44px rgba(247,215,116,.08); }
          100% { box-shadow: 0 0 0 rgba(247,215,116,0); }
        }

        @keyframes millLightSweep {
          0% { opacity: .16; transform: translateX(-8px) rotate(8deg) scaleY(.92); }
          50% { opacity: .34; transform: translateX(8px) rotate(-8deg) scaleY(1.03); }
          100% { opacity: .16; transform: translateX(-8px) rotate(8deg) scaleY(.92); }
        }

        @keyframes millAudienceBounce {
          0%, 100% { transform: scaleY(.38); opacity: .46; }
          50% { transform: scaleY(1); opacity: .92; }
        }

        @keyframes millTimerGlow {
          0% { box-shadow: 0 0 0 rgba(255,120,91,0); }
          50% { box-shadow: 0 0 26px rgba(255,120,91,.28); }
          100% { box-shadow: 0 0 0 rgba(255,120,91,0); }
        }

        .mill-shell {
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .mill-progress-glow {
          animation: millGlowBar .85s ease-in-out infinite alternate;
        }

        .mill-pulse {
          animation: millPulse .8s ease-in-out infinite alternate;
        }

        .mill-shake {
          animation: millShake .46s ease;
        }

        .mill-stage-pulse {
          animation: millStagePulse 2.8s ease-in-out infinite;
        }

        .mill-answer-btn {
          width: 100%;
          cursor: pointer;
          transition: transform .22s ease, box-shadow .22s ease, opacity .22s ease, filter .22s ease;
        }

        .mill-answer-btn:hover {
          transform: translateY(-2px) scale(1.01);
        }

        .mill-answer-btn:disabled {
          cursor: default;
        }

        .mill-joker-btn {
          cursor: pointer;
          transition: transform .2s ease, box-shadow .2s ease, opacity .2s ease;
        }

        .mill-joker-btn:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.02);
        }

        .mill-spark {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 4px;
          animation: millSpark .8s ease forwards;
          pointer-events: none;
        }

        .mill-question-box {
          position: relative;
          overflow: hidden;
        }

        .mill-question-box::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 50% 0%, rgba(247,215,116,.09), transparent 30%),
            radial-gradient(circle at 50% 100%, rgba(108,92,231,.08), transparent 28%);
          pointer-events: none;
        }

        .mill-light-beam {
          position: absolute;
          top: -20px;
          width: 90px;
          height: 240px;
          background: linear-gradient(180deg, rgba(255,230,151,.30), rgba(255,230,151,.05), transparent 82%);
          clip-path: polygon(44% 0, 56% 0, 100% 100%, 0 100%);
          filter: blur(1px);
          transform-origin: top center;
          animation: millLightSweep var(--dur) ease-in-out infinite;
          animation-delay: var(--delay);
          pointer-events: none;
        }

        .mill-timer-urgent {
          animation: millTimerGlow .9s ease-in-out infinite;
        }

        .mill-audience-bar {
          transform-origin: bottom center;
          animation: millAudienceBounce var(--dur) ease-in-out infinite;
          animation-delay: var(--delay);
        }

        @media (max-width: 1320px) {
          .mill-layout {
            grid-template-columns: 1fr !important;
          }
          .mill-ladder {
            order: 3;
          }
          .mill-side-panel {
            order: 2;
          }
        }

        @media (max-width: 760px) {
          .mill-answers-grid {
            grid-template-columns: 1fr !important;
          }
          .mill-question-title {
            font-size: 28px !important;
          }
          .mill-stage-header {
            flex-direction: column;
            align-items: flex-start !important;
          }
        }

        @media (max-width: 560px) {
          .mill-question-title {
            font-size: 25px !important;
            line-height: 1.34 !important;
          }
          .mill-option-text {
            font-size: 16px !important;
          }
          .mill-shell-card {
            border-radius: 24px !important;
          }
        }
      `}</style>

      <div
        className={`mill-shell ${shakeWrong ? "mill-shake" : ""}`}
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 34,
          padding: 20,
          border: "1px solid rgba(255,255,255,.10)",
          background:
            "radial-gradient(circle at top left, rgba(212,175,55,.18), transparent 24%), radial-gradient(circle at top right, rgba(108,92,231,.16), transparent 20%), linear-gradient(180deg, rgba(6,10,24,.94), rgba(10,14,28,.985))",
          boxShadow: "0 22px 70px rgba(0,0,0,.34)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -60,
            left: -45,
            width: 190,
            height: 190,
            borderRadius: "50%",
            background: "rgba(212,175,55,.12)",
            filter: "blur(18px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -70,
            right: -20,
            width: 230,
            height: 230,
            borderRadius: "50%",
            background: "rgba(108,92,231,.10)",
            filter: "blur(20px)",
          }}
        />

        {stageLights.map((light) => (
          <span
            key={light.id}
            className="mill-light-beam"
            style={{
              left: `${light.left}%`,
              "--delay": `${light.delay}s`,
              "--dur": `${light.duration}s`,
            }}
          />
        ))}

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
                padding: "11px 16px",
                borderRadius: 999,
                background: "rgba(255,255,255,.08)",
                border: "1px solid rgba(255,255,255,.08)",
                color: "#EEF4FF",
                fontSize: 13,
                fontWeight: 900,
              }}
            >
              SORU {current}/{total}
            </div>

            <div
              className={qi >= 4 ? "mill-pulse" : ""}
              style={{
                padding: "11px 16px",
                borderRadius: 999,
                background: "linear-gradient(135deg,#D4AF37,#F7D774)",
                color: "#1B1F2A",
                fontSize: 13,
                fontWeight: 900,
                boxShadow: "0 10px 24px rgba(212,175,55,.24)",
              }}
            >
              {milestoneLabel}
            </div>

            <div
              style={{
                padding: "11px 16px",
                borderRadius: 999,
                background: "rgba(108,92,231,.14)",
                border: "1px solid rgba(108,92,231,.18)",
                color: "#EAE4FF",
                fontSize: 13,
                fontWeight: 900,
              }}
            >
              ✨ {tierLabel}
            </div>

            <div
              style={{
                padding: "11px 16px",
                borderRadius: 999,
                background: "rgba(255,255,255,.08)",
                border: "1px solid rgba(255,255,255,.08)",
                color: "#FFF4C9",
                fontSize: 13,
                fontWeight: 900,
              }}
            >
              🎙️ {stageMood}
            </div>
          </div>

          <div
            style={{
              padding: "11px 16px",
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

        <div
          className="mill-layout"
          style={{
            position: "relative",
            zIndex: 1,
            display: "grid",
            gridTemplateColumns: "300px minmax(0, 1fr) 280px",
            gap: 18,
            alignItems: "stretch",
          }}
        >
          <div
            className="mill-shell mill-shell-card mill-side-panel"
            style={{
              borderRadius: 30,
              padding: 20,
              border: "1px solid rgba(255,255,255,.08)",
              background: "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))",
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
                marginBottom: 16,
              }}
            >
              🎁 Joker Paneli
            </div>

            <div
              className={isUrgent ? "mill-timer-urgent" : ""}
              style={{
                padding: 16,
                borderRadius: 24,
                border: isUrgent ? "1px solid rgba(255,120,91,.34)" : "1px solid rgba(255,255,255,.08)",
                background: isUrgent
                  ? "linear-gradient(135deg, rgba(255,120,91,.18), rgba(212,175,55,.12))"
                  : "linear-gradient(135deg, rgba(255,255,255,.07), rgba(255,255,255,.04))",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div>
                  <div style={{ color: "#DCEBFF", fontWeight: 800, fontSize: 12, marginBottom: 4 }}>⏱️ Sahne Süresi</div>
                  <div style={{ color: "#fff", fontWeight: 900, fontSize: 30, lineHeight: 1 }}>
                    {tm === 9999 ? "∞" : tm}
                  </div>
                </div>
                <div
                  style={{
                    width: 62,
                    height: 62,
                    borderRadius: "50%",
                    background: `conic-gradient(${isUrgent ? "#FF785B" : "#FFD166"} ${timerProgress}%, rgba(255,255,255,.08) ${timerProgress}% 100%)`,
                    display: "grid",
                    placeItems: "center",
                    boxShadow: isUrgent ? "0 0 22px rgba(255,120,91,.22)" : "0 0 18px rgba(255,209,102,.16)",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: "rgba(8,12,24,.96)",
                      display: "grid",
                      placeItems: "center",
                      color: "#fff",
                      fontWeight: 900,
                      fontSize: 13,
                    }}
                  >
                    {tm === 9999 ? "Süre" : `${Math.max(0, timerProgress | 0)}%`}
                  </div>
                </div>
              </div>

              <div style={{ width: "100%", height: 10, borderRadius: 999, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${timerProgress}%`,
                    height: "100%",
                    borderRadius: 999,
                    transition: "width .35s ease",
                    background: isUrgent ? "linear-gradient(90deg,#FF785B,#FFD166)" : "linear-gradient(90deg,#6C5CE7,#D4AF37,#FFE66D)",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gap: 14, marginBottom: 18 }}>
              <button
                className="mill-joker-btn"
                onClick={() => handleJoker("fifty")}
                disabled={!jk?.fifty || ans !== null}
                style={{
                  padding: "18px 16px",
                  borderRadius: 22,
                  border: "1px solid rgba(212,175,55,.24)",
                  background:
                    !jk?.fifty || ans !== null
                      ? "rgba(255,255,255,.05)"
                      : "linear-gradient(135deg, rgba(212,175,55,.22), rgba(247,215,116,.10))",
                  color: "#FFF4C9",
                  fontSize: 15,
                  fontWeight: 900,
                  opacity: !jk?.fifty || ans !== null ? 0.45 : 1,
                  boxShadow: !jk?.fifty || ans !== null ? "none" : "0 14px 28px rgba(212,175,55,.14)",
                }}
              >
                ☯️ 50:50
                <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.92, marginTop: 6 }}>
                  İki yanlış seçeneği kaldır · Kısayol: F
                </div>
              </button>

              <button
                className="mill-joker-btn"
                onClick={() => handleJoker("skip")}
                disabled={!jk?.skip || ans !== null}
                style={{
                  padding: "18px 16px",
                  borderRadius: 22,
                  border: "1px solid rgba(108,92,231,.24)",
                  background:
                    !jk?.skip || ans !== null
                      ? "rgba(255,255,255,.05)"
                      : "linear-gradient(135deg, rgba(108,92,231,.22), rgba(78,205,196,.10))",
                  color: "#ECE8FF",
                  fontSize: 15,
                  fontWeight: 900,
                  opacity: !jk?.skip || ans !== null ? 0.45 : 1,
                  boxShadow: !jk?.skip || ans !== null ? "none" : "0 14px 28px rgba(108,92,231,.14)",
                }}
              >
                ⏭ Soruyu Geç
                <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.92, marginTop: 6 }}>
                  Turu güvenle atla · Kısayol: G
                </div>
              </button>
            </div>

            <div style={{ marginBottom: 18 }}>
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
                  className="mill-progress-glow"
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    borderRadius: 999,
                    transition: "width .35s ease",
                    background: "linear-gradient(90deg,#6C5CE7,#D4AF37,#FFE66D)",
                    boxShadow: "0 0 18px rgba(212,175,55,.24)",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                padding: "14px 14px",
                borderRadius: 18,
                background: "rgba(255,255,255,.06)",
                border: "1px solid rgba(255,255,255,.08)",
                color: "#EEF6FF",
                fontSize: 14,
                fontWeight: 800,
                lineHeight: 1.5,
                marginBottom: 12,
              }}
            >
              {hostTip}
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
                ⌨️ A-B-C-D veya 1-2-3-4 ile hızlı cevap ver
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 18,
                  background: "rgba(212,175,55,.08)",
                  border: "1px solid rgba(212,175,55,.14)",
                  color: "#FFF3CB",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                👑 Final sorularında baskı artar, önce soru panelini tekrar oku
              </div>
            </div>
          </div>

          <div
            className="mill-shell mill-stage-pulse mill-question-box mill-shell-card"
            style={{
              borderRadius: 30,
              padding: 22,
              border: "1px solid rgba(255,255,255,.08)",
              background: "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "radial-gradient(circle at center, rgba(255,255,255,.05), transparent 42%)",
                pointerEvents: "none",
              }}
            />

            <div className="mill-stage-header" style={{ position: "relative", zIndex: 1, marginBottom: 20, display: "flex", justifyContent: "space-between", gap: 16, alignItems: "stretch", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 260 }}>
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
                  💡 Şimdi cevaplanacak büyük soru
                </div>

                <div
                  style={{
                    padding: "16px 16px 10px",
                    borderRadius: 24,
                    background: "linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.04))",
                    border: "1px solid rgba(255,255,255,.10)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,.05)",
                  }}
                >
                  <div style={{ color: "#FFE8A3", fontSize: 12, fontWeight: 900, letterSpacing: ".08em", marginBottom: 10 }}>
                    SORU CÜMLESİ · OYUNCU ÖNCE BURAYA BAKMALI
                  </div>
                  <div
                    className="mill-question-title"
                    style={{
                      fontSize: "clamp(28px, 2.35vw, 40px)",
                      lineHeight: 1.32,
                      fontWeight: 900,
                      color: "#fff",
                      textAlign: "left",
                      textShadow: "0 2px 12px rgba(0,0,0,.22)",
                      maxHeight: 220,
                      overflowY: "auto",
                      paddingRight: 8,
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {q.q}
                  </div>
                </div>
              </div>

              <div
                style={{
                  width: 220,
                  minWidth: 220,
                  padding: 16,
                  borderRadius: 24,
                  background: "linear-gradient(135deg, rgba(255,255,255,.07), rgba(255,255,255,.04))",
                  border: "1px solid rgba(255,255,255,.08)",
                }}
              >
                <div style={{ color: "#DCEBFF", fontWeight: 900, fontSize: 12, marginBottom: 8 }}>🎚️ Sahne Baskısı</div>
                <div style={{ width: "100%", height: 14, borderRadius: 999, overflow: "hidden", background: "rgba(255,255,255,.08)", marginBottom: 10 }}>
                  <div
                    style={{
                      width: `${pressure}%`,
                      height: "100%",
                      borderRadius: 999,
                      transition: "width .35s ease",
                      background: pressure >= 80
                        ? "linear-gradient(90deg,#FF785B,#FFD166)"
                        : pressure >= 55
                          ? "linear-gradient(90deg,#F7D774,#D4AF37)"
                          : "linear-gradient(90deg,#4ECDC4,#6C5CE7)",
                    }}
                  />
                </div>
                <div style={{ color: "#fff", fontWeight: 900, fontSize: 28, marginBottom: 12 }}>{pressure}%</div>

                <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 6, height: 62 }}>
                  {[0, 1, 2, 3, 4].map((bar) => (
                    <span
                      key={bar}
                      className="mill-audience-bar"
                      style={{
                        width: 24,
                        height: `${28 + ((bar * 13 + current * 5) % 32)}px`,
                        borderRadius: 999,
                        background: bar % 2 === 0 ? "linear-gradient(180deg,#FFD166,#D4AF37)" : "linear-gradient(180deg,#7C6BFF,#4ECDC4)",
                        "--delay": `${bar * 0.12}s`,
                        "--dur": `${1.3 + bar * 0.16}s`,
                        boxShadow: "0 8px 16px rgba(0,0,0,.14)",
                      }}
                    />
                  ))}
                </div>
                <div style={{ color: "#EAE4FF", fontWeight: 800, fontSize: 12, marginTop: 10 }}>
                  Sahne ışıkları ve seyirci temposu aktif
                </div>
              </div>
            </div>

            <div
              className="mill-answers-grid"
              style={{
                position: "relative",
                zIndex: 1,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              {q.o.map((opt, i) => {
                if (q.hid && q.hid.includes(i)) {
                  return (
                    <div
                      key={i}
                      style={{
                        minHeight: 112,
                        borderRadius: 26,
                        border: "1px dashed rgba(255,255,255,.10)",
                        background: "rgba(255,255,255,.035)",
                        display: "grid",
                        placeItems: "center",
                        color: "rgba(255,255,255,.42)",
                        fontWeight: 800,
                        fontSize: 14,
                      }}
                    >
                      50:50 ile kaldırılan seçenek
                    </div>
                  );
                }

                const state = getAnswerState(i);
                const isAnswered = ans !== null;
                const isCorrect = i === q.a;
                const isSelected = ans === i;

                return (
                  <button
                    key={i}
                    className="mill-answer-btn"
                    disabled={isAnswered}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => handleAnswer(i)}
                    style={{
                      minHeight: 112,
                      borderRadius: 26,
                      border: state.border,
                      background: state.bg,
                      boxShadow: state.boxShadow,
                      padding: "18px 18px",
                      textAlign: "left",
                      opacity: state.opacity,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                      <div
                        style={{
                          width: 50,
                          minWidth: 50,
                          height: 50,
                          borderRadius: 18,
                          display: "grid",
                          placeItems: "center",
                          background: isAnswered
                            ? isCorrect
                              ? "rgba(46,204,113,.22)"
                              : isSelected
                                ? "rgba(231,76,60,.22)"
                                : "rgba(255,255,255,.06)"
                            : "linear-gradient(135deg,#D4AF37,#F7D774)",
                          color: isAnswered ? "#fff" : "#1B1F2A",
                          fontWeight: 900,
                          fontSize: 16,
                          border: "1px solid rgba(255,255,255,.10)",
                          flexShrink: 0,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,.08)",
                        }}
                      >
                        {LETTERS[i]}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div
                          className="mill-option-text"
                          style={{
                            color: "#fff",
                            fontSize: 18,
                            lineHeight: 1.42,
                            fontWeight: 800,
                          }}
                        >
                          {opt}
                        </div>

                        {!isAnswered && (
                          <div style={{ marginTop: 9, fontSize: 12, fontWeight: 800, color: "#CFE2FF", opacity: 0.9 }}>
                            Kısayol: {LETTERS[i]} / {i + 1}
                          </div>
                        )}

                        {isAnswered && isCorrect && (
                          <div style={{ marginTop: 8, fontSize: 12, fontWeight: 900, color: "#CFF7DE" }}>
                            ✅ Doğru cevap
                          </div>
                        )}

                        {isAnswered && isSelected && !isCorrect && (
                          <div style={{ marginTop: 8, fontSize: 12, fontWeight: 900, color: "#FFD1CC" }}>
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
                  className="mill-spark"
                  style={{
                    left: `${spark.left}%`,
                    top: `${spark.top}%`,
                    background: Math.random() > 0.5
                      ? "linear-gradient(135deg,#FFE66D,#D4AF37)"
                      : "linear-gradient(135deg,#6C5CE7,#4ECDC4)",
                    "--dx": `${spark.dx}px`,
                    "--dy": `${spark.dy}px`,
                    animationDelay: `${spark.delay}s`,
                  }}
                />
              ))}
          </div>

          <div
            className="mill-shell mill-ladder mill-shell-card"
            style={{
              borderRadius: 30,
              padding: 20,
              border: "1px solid rgba(255,255,255,.08)",
              background: "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))",
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
                marginBottom: 16,
              }}
            >
              💰 Ödül Merdiveni
            </div>

            <div style={{ display: "grid", gap: 9 }}>
              {[...moneyLadder].reverse().map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "13px 14px",
                    borderRadius: 17,
                    background: item.active
                      ? "linear-gradient(135deg,#D4AF37,#F7D774)"
                      : item.passed
                        ? "rgba(46,204,113,.12)"
                        : "rgba(255,255,255,.05)",
                    border: item.active
                      ? "1px solid rgba(247,215,116,.30)"
                      : item.safe
                        ? "1px solid rgba(255,230,109,.16)"
                        : "1px solid rgba(255,255,255,.08)",
                    color: item.active ? "#1B1F2A" : "#F4F8FF",
                    fontSize: 14,
                    fontWeight: 900,
                    boxShadow: item.active ? "0 12px 24px rgba(212,175,55,.20)" : "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span>{item.value}</span>
                  <span style={{ fontSize: 12, opacity: 0.92 }}>
                    {item.active ? "ŞU AN" : item.passed ? "GEÇİLDİ" : item.safe ? "GÜVENLİ" : ""}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 16,
                padding: "12px 14px",
                borderRadius: 18,
                background: "rgba(212,175,55,.08)",
                border: "1px solid rgba(212,175,55,.14)",
                color: "#FFF3CB",
                fontSize: 13,
                fontWeight: 800,
                lineHeight: 1.45,
              }}
            >
              ⭐ 5. ve 8. basamaklar ile son soru güvenli / kritik bölge gibi vurgulanır.
            </div>

            <div
              style={{
                marginTop: 12,
                padding: "12px 14px",
                borderRadius: 18,
                background: "rgba(108,92,231,.10)",
                border: "1px solid rgba(108,92,231,.14)",
                color: "#EDE9FF",
                fontSize: 13,
                fontWeight: 800,
                lineHeight: 1.45,
              }}
            >
              🎇 Sahne ışıkları, süre baskısı ve belirgin soru paneli çocukların odaklanmasını destekler.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
