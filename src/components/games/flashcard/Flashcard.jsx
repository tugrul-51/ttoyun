/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { SFX } from "../../../utils/audio";
import { spawnConfetti } from "../../../utils/effects";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getCoachMessage({
  stage,
  guessedIndex,
  isCorrectGuess,
  streak,
  canRetry,
  attemptCount,
}) {
  if (stage === "question") {
    if (guessedIndex === null) return "Önce tahminini seç, sonra sonucu gör 🧠";
    return "Tahmin hazır. Sonucu görmek için devam et 🔄";
  }

  if (stage === "result") {
    if (isCorrectGuess) {
      if (streak >= 5) return "Harika seri. Bilgiyi güçlü şekilde hatırlıyorsun 🔥";
      return "Doğru tahmin. Bilgiyi doğru hatırladın ✅";
    }

    if (canRetry && attemptCount <= 1) {
      return "Yanlış tahmin. Doğru cevap henüz gizli, istersen tekrar dene ✨";
    }

    if (canRetry) {
      return "Hâlâ deneyebilirsin ya da çözümü görüp devam edebilirsin 📘";
    }

    return "Çözüm açıldı. Doğru cevabı inceleyip devam et 📘";
  }

  if (stage === "review") {
    return "Doğru cevabı gördün. Hazırsan sıradaki karta geç ✨";
  }

  return "";
}

export default function Flashcard({
  q,
  qi,
  gqs,
  setFc2,
  nxtQ,
  setCor,
  setSc,
}) {
  const [stage, setStage] = useState("question"); // question | result | review
  const [pulseGood, setPulseGood] = useState(false);
  const [pulseBad, setPulseBad] = useState(false);
  const [localStreak, setLocalStreak] = useState(0);
  const [sparkles, setSparkles] = useState([]);
  const [guessedIndex, setGuessedIndex] = useState(null);
  const [resultBadge, setResultBadge] = useState("");
  const [hardCard, setHardCard] = useState(false);
  const [awarded, setAwarded] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  useEffect(() => {
    setStage("question");
    setPulseGood(false);
    setPulseBad(false);
    setSparkles([]);
    setGuessedIndex(null);
    setResultBadge("");
    setHardCard(false);
    setAwarded(false);
    setAttemptCount(0);
    setFc2(false);
  }, [qi, setFc2]);

  const total = gqs?.length || 1;
  const current = (qi || 0) + 1;
  const progress = clamp((current / total) * 100, 0, 100);
  const correctAnswerIndex = q?.a ?? -1;
  const isCorrectGuess = guessedIndex !== null && guessedIndex === correctAnswerIndex;
  const canRetry = stage === "result" && !isCorrectGuess;

  const stars = useMemo(() => {
    if (localStreak >= 6) return 3;
    if (localStreak >= 3) return 2;
    return 1;
  }, [localStreak]);

  const coachMessage = getCoachMessage({
    stage,
    guessedIndex,
    isCorrectGuess,
    streak: localStreak,
    canRetry,
    attemptCount,
  });

  if (!q) return null;

  const createSuccessSparkles = () => {
    setSparkles(
      Array.from({ length: 18 }).map((_, i) => ({
        id: `${qi}-${i}-${Date.now()}`,
        left: 8 + Math.random() * 84,
        top: 10 + Math.random() * 74,
        dx: -60 + Math.random() * 120,
        dy: -45 + Math.random() * 90,
        delay: Math.random() * 0.16,
      }))
    );
  };

  const showResult = () => {
    if (guessedIndex === null) {
      SFX.wrong?.();
      setPulseBad(true);
      setTimeout(() => setPulseBad(false), 380);
      return;
    }

    setStage("result");
    setFc2(true);
    setAttemptCount((prev) => prev + 1);
    SFX.flip?.();

    if (isCorrectGuess) {
      setResultBadge("DOĞRU TAHMİN");
      setHardCard(false);
      setPulseGood(true);

      if (!awarded) {
        setAwarded(true);
        setLocalStreak((s) => s + 1);
        setCor((c) => c + 1);
        setSc((s) => s + 70);
        SFX.correct?.();
        spawnConfetti?.(24);
        createSuccessSparkles();
      }

      setTimeout(() => setPulseGood(false), 760);
    } else {
      setResultBadge("YANLIŞ TAHMİN");
      setHardCard(true);
      setLocalStreak(0);
      setPulseBad(true);
      SFX.wrong?.();
      setTimeout(() => setPulseBad(false), 760);
    }
  };

  const handleRetry = () => {
    SFX.click?.();
    setStage("question");
    setFc2(false);
    setPulseBad(false);
    setResultBadge("");
  };

  const handleRevealAnswer = () => {
    SFX.reveal?.();
    setStage("review");
    setFc2(true);
    setResultBadge("ÇÖZÜM AÇILDI");
  };

  const handleContinue = () => {
    SFX.click?.();
    setSparkles([]);
    setStage("question");
    setFc2(false);
    nxtQ();
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1480,
        margin: "0 auto",
        padding: "0 8px",
        boxSizing: "border-box",
        position: "relative",
        animation: "flashUltraEnter .45s ease",
      }}
    >
      <style>{`
        @keyframes flashUltraEnter {
          from { opacity: 0; transform: translateY(18px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes flashPulseGood {
          0% { transform: scale(1); box-shadow: 0 0 0 rgba(46,204,113,0); }
          100% { transform: scale(1.01); box-shadow: 0 0 36px rgba(46,204,113,.18); }
        }

        @keyframes flashPulseBad {
          0% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }

        @keyframes flashGlowBar {
          from { filter: brightness(1); }
          to { filter: brightness(1.15); }
        }

        @keyframes flashSpark {
          0% {
            opacity: 1;
            transform: translate(0,0) scale(.55) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translate(var(--dx), var(--dy)) scale(1.15) rotate(220deg);
          }
        }

        @keyframes flashRibbonIn {
          0% { opacity: 0; transform: translateY(-10px) scale(.92); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        .flash-shell {
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .flash-progress-glow {
          animation: flashGlowBar .85s ease-in-out infinite alternate;
        }

        .flash-good {
          animation: flashPulseGood .45s ease;
        }

        .flash-bad {
          animation: flashPulseBad .45s ease;
        }

        .flash-spark {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 4px;
          animation: flashSpark .8s ease forwards;
          pointer-events: none;
        }

        .flash-guess-btn {
          width: 100%;
          text-align: left;
          cursor: pointer;
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
        }

        .flash-guess-btn:hover {
          transform: translateY(-2px);
        }

        .flash-result-ribbon {
          animation: flashRibbonIn .28s ease;
        }

        .flash-question-box {
          min-height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .flash-options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .flash-bottom-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          align-items: stretch;
        }

        .flash-result-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 1180px) {
          .flash-layout {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 820px) {
          .flash-options-grid,
          .flash-result-grid,
          .flash-bottom-row {
            grid-template-columns: 1fr !important;
          }

          .flash-question-text {
            font-size: 30px !important;
          }

          .flash-answer-text {
            font-size: 18px !important;
          }
        }
      `}</style>

      <div
        className="flash-shell"
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 34,
          padding: 18,
          border: "1px solid rgba(255,255,255,.10)",
          background:
            "radial-gradient(circle at top left, rgba(108,92,231,.18), transparent 24%), radial-gradient(circle at top right, rgba(78,205,196,.14), transparent 20%), linear-gradient(180deg, rgba(10,14,28,.88), rgba(14,18,32,.97))",
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
              KART {current}/{total}
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
              {"⭐".repeat(stars)} HAFIZA MODU
            </div>

            {localStreak > 1 && (
              <div
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
                🔥 Seri: {localStreak}
              </div>
            )}

            {hardCard && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: "linear-gradient(135deg,#6C5CE7,#2D3436)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 900,
                }}
              >
                🧩 Zor Kart
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
            {coachMessage}
          </div>
        </div>

        <div
          className="flash-layout"
          style={{
            position: "relative",
            zIndex: 1,
            display: "grid",
            gridTemplateColumns: "340px minmax(0, 1fr)",
            gap: 18,
            alignItems: "stretch",
            width: "100%",
          }}
        >
          <div
            className="flash-shell"
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
              📘 Flashcard Paneli
            </div>

            <div
              style={{
                fontSize: "clamp(28px, 2.5vw, 34px)",
                lineHeight: 1.35,
                fontWeight: 900,
                color: "#fff",
                marginBottom: 16,
              }}
            >
              Oku, tahmin et, çevir, sonucu gör
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
                  className="flash-progress-glow"
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
                1️⃣ Önce tahminini seç
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
                2️⃣ Sonucu incele, gerekirse tekrar dene
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
                3️⃣ Doğru tahminde +70 puan kazan
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 18,
                  background:
                    guessedIndex === null
                      ? "rgba(255,255,255,.06)"
                      : "rgba(78,205,196,.10)",
                  border:
                    guessedIndex === null
                      ? "1px solid rgba(255,255,255,.08)"
                      : "1px solid rgba(78,205,196,.18)",
                  color: guessedIndex === null ? "#EEF6FF" : "#CFFCF9",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                {guessedIndex === null
                  ? "🎯 Henüz tahmin seçilmedi"
                  : `🎯 Seçilen tahmin: ${["A", "B", "C", "D"][guessedIndex]}`}
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 18,
                  background: "rgba(108,92,231,.10)",
                  border: "1px solid rgba(108,92,231,.16)",
                  color: "#E7E0FF",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                🧠 Öğrenme skoru: {localStreak * 10}
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 18,
                  background: hardCard
                    ? "rgba(255,107,107,.12)"
                    : "rgba(255,255,255,.06)",
                  border: hardCard
                    ? "1px solid rgba(255,107,107,.18)"
                    : "1px solid rgba(255,255,255,.08)",
                  color: hardCard ? "#FFD8D8" : "#EEF6FF",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                {hardCard
                  ? `📌 Bu kartta ${attemptCount} deneme yapıldı`
                  : "📘 Her kart mini öğrenme turu oluşturur"}
              </div>
            </div>
          </div>

          <div
            className={`flash-shell ${pulseGood ? "flash-good" : ""} ${pulseBad ? "flash-bad" : ""}`}
            style={{
              borderRadius: 28,
              padding: 22,
              border: "1px solid rgba(255,255,255,.08)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))",
              position: "relative",
              overflow: "hidden",
              minHeight: 760,
              width: "100%",
              minWidth: 0,
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

            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
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
                  }}
                >
                  {stage === "question"
                    ? "❓ Soru Yüzü"
                    : stage === "result"
                    ? "⚠️ Tahmin Sonucu"
                    : "✅ Çözüm Yüzü"}
                </div>

                {stage !== "question" && (
                  <div
                    className="flash-result-ribbon"
                    style={{
                      padding: "10px 14px",
                      borderRadius: 999,
                      background:
                        stage === "review"
                          ? "linear-gradient(135deg, rgba(78,205,196,.20), rgba(78,205,196,.10))"
                          : isCorrectGuess
                          ? "linear-gradient(135deg, rgba(46,204,113,.22), rgba(46,204,113,.12))"
                          : "linear-gradient(135deg, rgba(231,76,60,.22), rgba(231,76,60,.12))",
                      border:
                        stage === "review"
                          ? "1px solid rgba(78,205,196,.26)"
                          : isCorrectGuess
                          ? "1px solid rgba(46,204,113,.30)"
                          : "1px solid rgba(231,76,60,.30)",
                      color:
                        stage === "review"
                          ? "#D8FFFA"
                          : isCorrectGuess
                          ? "#D8FBE7"
                          : "#FFD7D2",
                      fontSize: 13,
                      fontWeight: 900,
                    }}
                  >
                    {resultBadge}
                  </div>
                )}
              </div>

              {stage === "question" ? (
                <div
                  style={{
                    padding: 26,
                    borderRadius: 34,
                    background:
                      "linear-gradient(145deg, rgba(108,92,231,.24), rgba(78,205,196,.10))",
                    border: "3px solid rgba(108,92,231,.24)",
                    boxShadow: "0 18px 42px rgba(108,92,231,.18)",
                    minHeight: 680,
                    display: "grid",
                    gridTemplateRows: "auto auto auto 1fr auto",
                    gap: 18,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        color: "#CFC6FF",
                        fontSize: 13,
                        fontWeight: 900,
                        letterSpacing: "1.2px",
                      }}
                    >
                      ÖNCE TAHMİNİNİ SEÇ
                    </div>

                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: 999,
                        background: "rgba(255,255,255,.10)",
                        border: "1px solid rgba(255,255,255,.10)",
                        color: "#EDEBFF",
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      SORU
                    </div>
                  </div>

                  <div className="flash-question-box">
                    <div
                      className="flash-question-text"
                      style={{
                        fontSize: "clamp(34px, 3vw, 48px)",
                        lineHeight: 1.24,
                        fontWeight: 900,
                        color: "#fff",
                        textAlign: "center",
                        textShadow: "0 2px 12px rgba(0,0,0,.20)",
                        maxWidth: 980,
                        margin: "0 auto",
                        wordBreak: "break-word",
                      }}
                    >
                      {q.q}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "14px 16px",
                      borderRadius: 18,
                      background:
                        guessedIndex === null
                          ? "rgba(255,255,255,.07)"
                          : "rgba(78,205,196,.12)",
                      border:
                        guessedIndex === null
                          ? "1px solid rgba(255,255,255,.08)"
                          : "1px solid rgba(78,205,196,.18)",
                      color: guessedIndex === null ? "#E0E7F4" : "#D8FFFA",
                      fontSize: 15,
                      fontWeight: 800,
                      textAlign: "center",
                    }}
                  >
                    {guessedIndex === null
                      ? "Henüz bir tahmin seçmedin"
                      : `Seçtiğin cevap: ${["A", "B", "C", "D"][guessedIndex]}`}
                  </div>

                  <div className="flash-options-grid">
                    {q.o?.map((opt, i) => {
                      const selected = guessedIndex === i;
                      return (
                        <button
                          key={i}
                          className="flash-guess-btn"
                          onClick={() => {
                            setGuessedIndex(i);
                            SFX.click?.();
                          }}
                          style={{
                            minHeight: 110,
                            padding: "16px",
                            borderRadius: 20,
                            border: selected
                              ? "1px solid rgba(255,230,109,.35)"
                              : "1px solid rgba(255,255,255,.08)",
                            background: selected
                              ? "linear-gradient(135deg, rgba(255,230,109,.18), rgba(108,92,231,.18))"
                              : "rgba(255,255,255,.06)",
                            color: "#fff",
                            fontSize: 16,
                            fontWeight: 800,
                            boxShadow: selected
                              ? "0 10px 24px rgba(255,230,109,.14)"
                              : "none",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: 12,
                              alignItems: "flex-start",
                            }}
                          >
                            <div
                              style={{
                                width: 40,
                                minWidth: 40,
                                height: 40,
                                borderRadius: 13,
                                display: "grid",
                                placeItems: "center",
                                background: selected
                                  ? "linear-gradient(135deg,#FFE66D,#FFA502)"
                                  : "rgba(255,255,255,.08)",
                                color: selected ? "#1B1F2A" : "#fff",
                                fontWeight: 900,
                                fontSize: 15,
                              }}
                            >
                              {["A", "B", "C", "D"][i]}
                            </div>

                            <div
                              style={{
                                lineHeight: 1.4,
                                fontSize: 19,
                                fontWeight: 800,
                                wordBreak: "break-word",
                              }}
                            >
                              {opt}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flash-bottom-row">
                    <div
                      style={{
                        padding: "16px 18px",
                        borderRadius: 18,
                        border:
                          guessedIndex === null
                            ? "1px solid rgba(255,255,255,.08)"
                            : "1px solid rgba(78,205,196,.24)",
                        background:
                          guessedIndex === null
                            ? "rgba(255,255,255,.07)"
                            : "rgba(78,205,196,.10)",
                        color: guessedIndex === null ? "#DDE7F7" : "#D6FFFA",
                        fontSize: 15,
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                      }}
                    >
                      {guessedIndex === null
                        ? "Bir cevap seçmeden sonuç ekranı açılmaz"
                        : "Tahmin seçildi, artık sonucu görebilirsin"}
                    </div>

                    <button
                      onClick={showResult}
                      style={{
                        padding: "16px 26px",
                        borderRadius: 18,
                        border:
                          guessedIndex === null
                            ? "1px solid rgba(255,255,255,.08)"
                            : "1px solid rgba(78,205,196,.24)",
                        background:
                          guessedIndex === null
                            ? "rgba(255,255,255,.07)"
                            : "linear-gradient(135deg, rgba(78,205,196,.24), rgba(108,92,231,.18))",
                        color: "#fff",
                        fontSize: 16,
                        fontWeight: 900,
                        cursor: "pointer",
                        opacity: guessedIndex === null ? 0.82 : 1,
                        minWidth: 230,
                      }}
                    >
                      🔄 Sonucu Göster
                    </button>
                  </div>
                </div>
              ) : stage === "result" ? (
                <div
                  style={{
                    padding: 26,
                    borderRadius: 34,
                    background: isCorrectGuess
                      ? "linear-gradient(145deg, rgba(46,204,113,.24), rgba(255,230,109,.10))"
                      : "linear-gradient(145deg, rgba(231,76,60,.20), rgba(255,230,109,.10))",
                    border: isCorrectGuess
                      ? "3px solid rgba(46,204,113,.24)"
                      : "3px solid rgba(231,76,60,.22)",
                    boxShadow: isCorrectGuess
                      ? "0 18px 42px rgba(46,204,113,.18)"
                      : "0 18px 42px rgba(231,76,60,.14)",
                    minHeight: 680,
                    display: "grid",
                    gridTemplateRows: "auto auto 1fr auto",
                    gap: 18,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        color: isCorrectGuess ? "#D7FFE8" : "#FFD4CE",
                        fontSize: 13,
                        fontWeight: 900,
                        letterSpacing: "1.2px",
                      }}
                    >
                      {isCorrectGuess ? "TAHMİNİN DOĞRUYDU" : "TAHMİNİN YANLIŞTI"}
                    </div>

                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: 999,
                        background: "rgba(255,255,255,.10)",
                        border: "1px solid rgba(255,255,255,.10)",
                        color: "#EFFFF6",
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      SONUÇ
                    </div>
                  </div>

                  <div
                    style={{
                      textAlign: "center",
                      fontSize: "clamp(30px, 2.6vw, 40px)",
                      lineHeight: 1.3,
                      fontWeight: 900,
                      color: "#fff",
                    }}
                  >
                    {isCorrectGuess
                      ? "Harika, doğru bildin!"
                      : "Bu tahmin yanlış oldu"}
                  </div>

                  {isCorrectGuess ? (
                    <div className="flash-result-grid">
                      <div
                        style={{
                          padding: "20px",
                          borderRadius: 20,
                          background: "rgba(255,255,255,.08)",
                          border: "1px solid rgba(255,255,255,.08)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 900,
                            opacity: 0.85,
                            marginBottom: 8,
                            color: "#F4F8FF",
                          }}
                        >
                          SENİN TAHMİNİN
                        </div>
                        <div
                          className="flash-answer-text"
                          style={{
                            fontSize: 24,
                            lineHeight: 1.45,
                            fontWeight: 900,
                            color: "#fff",
                            wordBreak: "break-word",
                          }}
                        >
                          {q.o?.[guessedIndex]}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: "20px",
                          borderRadius: 20,
                          background: "rgba(255,255,255,.08)",
                          border: "1px solid rgba(255,255,255,.08)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 900,
                            opacity: 0.85,
                            marginBottom: 8,
                            color: "#F4F8FF",
                          }}
                        >
                          DOĞRU CEVAP
                        </div>
                        <div
                          className="flash-answer-text"
                          style={{
                            fontSize: 24,
                            lineHeight: 1.45,
                            fontWeight: 900,
                            color: "#fff",
                            wordBreak: "break-word",
                          }}
                        >
                          {q.o?.[q.a]}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "24px",
                        borderRadius: 24,
                        background: "rgba(255,255,255,.08)",
                        border: "1px solid rgba(255,255,255,.08)",
                        display: "grid",
                        gap: 18,
                        alignContent: "start",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 900,
                          color: "#FFD9D3",
                          letterSpacing: ".06em",
                        }}
                      >
                        DOĞRU CEVAP ŞU AN GİZLİ
                      </div>

                      <div
                        style={{
                          fontSize: "clamp(22px, 2vw, 30px)",
                          lineHeight: 1.4,
                          fontWeight: 900,
                          color: "#fff",
                        }}
                      >
                        İstersen başka bir tahmin yapabilir, istersen çözümü açıp doğru cevabı görebilirsin.
                      </div>

                      <div
                        style={{
                          padding: "16px 18px",
                          borderRadius: 18,
                          background: "rgba(255,255,255,.06)",
                          border: "1px solid rgba(255,255,255,.08)",
                          color: "#FFE7E2",
                          fontSize: 16,
                          fontWeight: 800,
                        }}
                      >
                        Son seçimin: {guessedIndex !== null ? q.o?.[guessedIndex] : "Seçilmedi"}
                      </div>
                    </div>
                  )}

                  <div className="flash-bottom-row">
                    {isCorrectGuess ? (
                      <>
                        <button
                          onClick={handleContinue}
                          style={{
                            padding: "16px 18px",
                            borderRadius: 20,
                            border: "1px solid rgba(46,204,113,.28)",
                            background:
                              "linear-gradient(135deg, rgba(46,204,113,.24), rgba(46,204,113,.12))",
                            color: "#fff",
                            fontSize: 17,
                            fontWeight: 900,
                            cursor: "pointer",
                            boxShadow: "0 14px 28px rgba(46,204,113,.14)",
                          }}
                        >
                          ✅ Sıradaki Soru
                        </button>

                        <div
                          style={{
                            padding: "14px 20px",
                            borderRadius: 18,
                            border: "1px solid rgba(46,204,113,.18)",
                            background: "rgba(46,204,113,.08)",
                            color: "#D8FBE7",
                            fontSize: 15,
                            fontWeight: 800,
                            minWidth: 220,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                          }}
                        >
                          +70 puan kazanıldı
                        </div>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleRetry}
                          style={{
                            padding: "16px 18px",
                            borderRadius: 20,
                            border: "1px solid rgba(255,255,255,.12)",
                            background: "rgba(255,255,255,.08)",
                            color: "#fff",
                            fontSize: 17,
                            fontWeight: 900,
                            cursor: "pointer",
                          }}
                        >
                          🔁 Başka Tahmin Yap
                        </button>

                        <button
                          onClick={handleRevealAnswer}
                          style={{
                            padding: "14px 20px",
                            borderRadius: 18,
                            border: "1px solid rgba(231,76,60,.24)",
                            background:
                              "linear-gradient(135deg, rgba(231,76,60,.18), rgba(231,76,60,.10))",
                            color: "#fff",
                            fontSize: 15,
                            fontWeight: 800,
                            cursor: "pointer",
                            minWidth: 220,
                          }}
                        >
                          👁️ Vazgeç ve Doğru Cevabı Gör
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: 26,
                    borderRadius: 34,
                    background:
                      "linear-gradient(145deg, rgba(78,205,196,.20), rgba(108,92,231,.12))",
                    border: "3px solid rgba(78,205,196,.24)",
                    boxShadow: "0 18px 42px rgba(78,205,196,.14)",
                    minHeight: 680,
                    display: "grid",
                    gridTemplateRows: "auto auto 1fr auto",
                    gap: 18,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        color: "#D8FFFA",
                        fontSize: 13,
                        fontWeight: 900,
                        letterSpacing: "1.2px",
                      }}
                    >
                      ÇÖZÜM AÇILDI
                    </div>

                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: 999,
                        background: "rgba(255,255,255,.10)",
                        border: "1px solid rgba(255,255,255,.10)",
                        color: "#EFFFF6",
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      ÇÖZÜM
                    </div>
                  </div>

                  <div
                    style={{
                      textAlign: "center",
                      fontSize: "clamp(30px, 2.6vw, 40px)",
                      lineHeight: 1.3,
                      fontWeight: 900,
                      color: "#fff",
                    }}
                  >
                    Doğru cevap burada
                  </div>

                  <div className="flash-result-grid">
                    <div
                      style={{
                        padding: "20px",
                        borderRadius: 20,
                        background: "rgba(255,255,255,.08)",
                        border: "1px solid rgba(255,255,255,.08)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 900,
                          opacity: 0.85,
                          marginBottom: 8,
                          color: "#F4F8FF",
                        }}
                      >
                        SON TAHMİNİN
                      </div>
                      <div
                        className="flash-answer-text"
                        style={{
                          fontSize: 24,
                          lineHeight: 1.45,
                          fontWeight: 900,
                          color: "#fff",
                          wordBreak: "break-word",
                        }}
                      >
                        {guessedIndex !== null ? q.o?.[guessedIndex] : "Tahmin seçilmedi"}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "20px",
                        borderRadius: 20,
                        background: "rgba(255,255,255,.08)",
                        border: "1px solid rgba(255,255,255,.08)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 900,
                          opacity: 0.85,
                          marginBottom: 8,
                          color: "#F4F8FF",
                        }}
                      >
                        DOĞRU CEVAP
                      </div>
                      <div
                        className="flash-answer-text"
                        style={{
                          fontSize: 24,
                          lineHeight: 1.45,
                          fontWeight: 900,
                          color: "#fff",
                          wordBreak: "break-word",
                        }}
                      >
                        {q.o?.[q.a]}
                      </div>
                    </div>
                  </div>

                  <div className="flash-bottom-row">
                    <button
                      onClick={handleContinue}
                      style={{
                        padding: "16px 18px",
                        borderRadius: 20,
                        border: "1px solid rgba(78,205,196,.24)",
                        background:
                          "linear-gradient(135deg, rgba(78,205,196,.20), rgba(108,92,231,.12))",
                        color: "#fff",
                        fontSize: 17,
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                    >
                      ➡️ Sıradaki Soru
                    </button>

                    <button
                      onClick={handleRetry}
                      style={{
                        padding: "14px 20px",
                        borderRadius: 18,
                        border: "1px solid rgba(255,255,255,.10)",
                        background: "rgba(255,255,255,.06)",
                        color: "#EAF2FF",
                        fontSize: 15,
                        fontWeight: 800,
                        cursor: "pointer",
                        minWidth: 220,
                      }}
                    >
                      🔁 Tekrar Tahmin Et
                    </button>
                  </div>
                </div>
              )}
            </div>

            {sparkles.map((spark) => (
              <span
                key={spark.id}
                className="flash-spark"
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