import { useEffect, useMemo, useState } from "react";
import { SFX } from "../../../utils/audio";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

const LETTERS = ["A", "B", "C", "D"];

function getTierLabel(index) {
  const n = (index || 0) + 1;
  if (n >= 10) return "Büyük Final";
  if (n >= 7) return "Usta Seviye";
  if (n >= 4) return "Orta Seviye";
  return "Başlangıç";
}

function getMilestoneLabel(index) {
  const n = (index || 0) + 1;
  if (n >= 10) return "👑 Şampiyonluk Sorusu";
  if (n >= 8) return "🔥 Kritik Bölge";
  if (n >= 5) return "⭐ Güvenli Bölge";
  return "🎯 Isınma Turu";
}

function getStatusText(ans, correctIndex, qi) {
  if (ans === null) {
    if (qi >= 9) return "Son soru bölgesindesin. Dikkatini topla ve en doğru kararı ver 👑";
    if (qi >= 5) return "Harika gidiyorsun. Jokerlerini akıllı zamanda kullan ⭐";
    return "Doğru cevabı seçerek büyük ödüle ilerle 💡";
  }

  if (ans === correctIndex) {
    if (qi >= 9) return "Muhteşem! Final seviyesinde doğru cevap verdin 🎉";
    return "Harika seçim! Bir sonraki büyük soruya hazırsın ✅";
  }

  return "Yanlış cevap seçildi. Yarışma devam ediyor, sahne hâlâ sende ✨";
}

function getStageMood(qi) {
  const n = (qi || 0) + 1;
  if (n >= 10) return "Final Nabzı";
  if (n >= 7) return "Yüksek Gerilim";
  if (n >= 4) return "Yükselen Tempo";
  return "Sakin Başlangıç";
}

export default function Millionaire({ q, qi, gqs, ans, hAns, jk, useJk: onUseJoker }) {
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
          left: 12 + Math.random() * 76,
          top: 16 + Math.random() * 54,
          dx: -64 + Math.random() * 128,
          dy: -46 + Math.random() * 92,
          delay: Math.random() * 0.16,
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

  const total = gqs?.length || 1;
  const current = (qi || 0) + 1;
  const progress = clamp((current / total) * 100, 0, 100);
  const tierLabel = getTierLabel(qi || 0);
  const milestoneLabel = getMilestoneLabel(qi || 0);
  const stageMood = getStageMood(qi || 0);
  const statusText = getStatusText(ans, q?.a, qi || 0);

  const moneyLadder = useMemo(() => {
    const base = [100, 200, 300, 500, 750, 1000, 1500, 2500, 5000, 10000];
    return base.slice(0, total).map((v, i) => ({
      value: v,
      active: i === qi,
      passed: i < qi,
      safe: i === 4 || i === 7 || i === total - 1,
    }));
  }, [qi, total]);

  if (!q) return null;

  const handleJoker = (type) => {
    if (!jk?.[type] || ans !== null) return;
    SFX.whoosh?.();
    onUseJoker?.(type);
  };

  const handleAnswer = (index) => {
    if (ans !== null) return;
    SFX.click?.();
    hAns(index);
  };

  const getAnswerState = (i) => {
    const isAnswered = ans !== null;
    const isCorrect = i === q.a;
    const isSelected = ans === i;

    if (!isAnswered) {
      return {
        bg:
          hovered === i
            ? "linear-gradient(135deg, rgba(255,215,130,.14), rgba(108,92,231,.10))"
            : "linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.04))",
        border:
          hovered === i
            ? "1px solid rgba(247,215,116,.26)"
            : "1px solid rgba(212,175,55,.16)",
        boxShadow:
          hovered === i
            ? "0 18px 36px rgba(212,175,55,.16)"
            : "0 10px 20px rgba(0,0,0,.16)",
        opacity: 1,
      };
    }

    if (isCorrect) {
      return {
        bg: "linear-gradient(135deg, rgba(46,204,113,.26), rgba(46,204,113,.12))",
        border: "1px solid rgba(46,204,113,.38)",
        boxShadow:
          "0 0 0 3px rgba(46,204,113,.08), 0 18px 32px rgba(46,204,113,.12)",
        opacity: 1,
      };
    }

    if (isSelected) {
      return {
        bg: "linear-gradient(135deg, rgba(231,76,60,.26), rgba(231,76,60,.12))",
        border: "1px solid rgba(231,76,60,.34)",
        boxShadow:
          "0 0 0 3px rgba(231,76,60,.08), 0 18px 32px rgba(231,76,60,.12)",
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
        maxWidth: "min(1480px, 98vw)",
        margin: "0 auto",
        position: "relative",
        animation: "millUltraEnter .45s ease",
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
            radial-gradient(circle at 50% 0%, rgba(247,215,116,.08), transparent 30%),
            radial-gradient(circle at 50% 100%, rgba(108,92,231,.06), transparent 28%);
          pointer-events: none;
        }

        @media (max-width: 1120px) {
          .mill-layout {
            grid-template-columns: 1fr !important;
          }
          .mill-ladder {
            order: 3;
          }
        }

        @media (max-width: 640px) {
          .mill-answers-grid {
            grid-template-columns: 1fr !important;
          }
          .mill-question-title {
            font-size: 24px !important;
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
            "radial-gradient(circle at top left, rgba(212,175,55,.18), transparent 24%), radial-gradient(circle at top right, rgba(108,92,231,.14), transparent 20%), linear-gradient(180deg, rgba(8,10,24,.92), rgba(10,14,28,.98))",
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
              maxWidth: 470,
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
            gridTemplateColumns: "300px minmax(0, 1fr) 270px",
            gap: 18,
            alignItems: "stretch",
          }}
        >
          <div
            className="mill-shell"
            style={{
              borderRadius: 30,
              padding: 20,
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
                marginBottom: 16,
              }}
            >
              🎁 Joker Paneli
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
                  boxShadow:
                    !jk?.fifty || ans !== null
                      ? "none"
                      : "0 14px 28px rgba(212,175,55,.14)",
                }}
              >
                ☯️ 50:50
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    opacity: 0.92,
                    marginTop: 6,
                  }}
                >
                  İki yanlış seçeneği kaldır
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
                  boxShadow:
                    !jk?.skip || ans !== null
                      ? "none"
                      : "0 14px 28px rgba(108,92,231,.14)",
                }}
              >
                ⏭ Soruyu Geç
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    opacity: 0.92,
                    marginTop: 6,
                  }}
                >
                  Bu turu güvenle atla
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
                🧠 Soruyu dikkatlice oku
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
                🎯 Jokerleri doğru zamanda kullan
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
                👑 Final sorularında baskı artar
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 18,
                  background: "rgba(108,92,231,.10)",
                  border: "1px solid rgba(108,92,231,.14)",
                  color: "#EDE9FF",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                🎙️ Premium sahne modu açık
              </div>
            </div>
          </div>

          <div
            className="mill-shell mill-stage-pulse mill-question-box"
            style={{
              borderRadius: 30,
              padding: 22,
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
                inset: 0,
                background:
                  "radial-gradient(circle at center, rgba(255,255,255,.05), transparent 42%)",
                pointerEvents: "none",
              }}
            />

            <div style={{ position: "relative", zIndex: 1, marginBottom: 20 }}>
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
                💡 Büyük Ödül Sorusu
              </div>

              <div
                className="mill-question-title"
                style={{
                  fontSize: "clamp(30px, 2.4vw, 40px)",
                  lineHeight: 1.34,
                  fontWeight: 900,
                  color: "#fff",
                  textAlign: "center",
                  textShadow: "0 2px 12px rgba(0,0,0,.22)",
                  padding: "20px 16px 10px",
                  maxWidth: 840,
                  margin: "0 auto",
                }}
              >
                {q.q}
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
                        minHeight: 104,
                        borderRadius: 26,
                        border: "1px dashed rgba(255,255,255,.10)",
                        background: "rgba(255,255,255,.035)",
                        display: "grid",
                        placeItems: "center",
                        color: "rgba(255,255,255,.38)",
                        fontWeight: 800,
                        fontSize: 14,
                      }}
                    >
                      Kaldırılan seçenek
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
                      minHeight: 104,
                      borderRadius: 26,
                      border: state.border,
                      background: state.bg,
                      boxShadow: state.boxShadow,
                      padding: "18px 18px",
                      textAlign: "left",
                      opacity: state.opacity,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 14,
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          minWidth: 48,
                          height: 48,
                          borderRadius: 17,
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
                          style={{
                            color: "#fff",
                            fontSize: 18,
                            lineHeight: 1.42,
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
                  className="mill-spark"
                  style={{
                    left: `${spark.left}%`,
                    top: `${spark.top}%`,
                    background:
                      Math.random() > 0.5
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
            className="mill-shell mill-ladder"
            style={{
              borderRadius: 30,
              padding: 20,
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
                    boxShadow: item.active
                      ? "0 12px 24px rgba(212,175,55,.20)"
                      : "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span>{item.value}</span>
                  <span style={{ fontSize: 12, opacity: 0.92 }}>
                    {item.active
                      ? "ŞU AN"
                      : item.passed
                        ? "GEÇİLDİ"
                        : item.safe
                          ? "GÜVENLİ"
                          : ""}
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
              👑 Güvenli seviyeler ve aktif basamak burada vurgulanır.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}