/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { SFX } from "../../../utils/audio";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getTierLabel(index) {
  const n = (index || 0) + 1;
  if (n >= 10) return "Karar Ustası";
  if (n >= 7) return "Doğruluk Avcısı";
  if (n >= 4) return "Hızlı Yorumcu";
  return "Başlangıç Kararı";
}

function cleanText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function capitalizeTR(text = "") {
  if (!text) return text;
  const map = { i: "İ", ı: "I", ş: "Ş", ğ: "Ğ", ü: "Ü", ö: "Ö", ç: "Ç" };
  const first = text.charAt(0);
  const upper = map[first] || first.toLocaleUpperCase("tr-TR");
  return upper + text.slice(1);
}

function removeQuestionTail(question = "") {
  let s = cleanText(question).replace(/[?？]+$/g, "");

  const patterns = [
    /\s+nedir$/i,
    /\s+hangisidir$/i,
    /\s+hangisi olur$/i,
    /\s+hangisi olabilir$/i,
    /\s+hangisidir\.$/i,
    /\s+olarak bilinir$/i,
  ];

  patterns.forEach((pattern) => {
    s = s.replace(pattern, "");
  });

  s = s.replace(/^aşağıdakilerden\s+/i, "");
  s = s.replace(/^hangisi\s+/i, "");
  s = s.replace(/^hangi\s+/i, ""); // kalan yapı bozulursa altta fallback var

  return cleanText(s);
}

function buildStatement(question, optionText) {
  const rawQuestion = cleanText(question).replace(/[?？]+$/g, "");
  const answer = cleanText(optionText);

  if (!rawQuestion) return answer ? `${answer}.` : "";
  if (!answer) return `${rawQuestion}.`;

  const lowered = rawQuestion.toLocaleLowerCase("tr-TR");
  let stem = removeQuestionTail(rawQuestion);

  if (!stem) stem = rawQuestion;

  const statementPatterns = [
    {
      test: /nedir$/i,
      make: () => `${capitalizeTR(stem)}: ${answer}.`,
    },
    {
      test: /hangisidir$/i,
      make: () => `${capitalizeTR(stem)}: ${answer}.`,
    },
    {
      test: /^hangi\s+/i,
      make: () => `${capitalizeTR(rawQuestion.replace(/^hangi\s+/i, ""))}: ${answer}.`,
    },
    {
      test: /^aşağıdakilerden hangisi/i,
      make: () => `${capitalizeTR(stem)}: ${answer}.`,
    },
    {
      test: /kimdir$/i,
      make: () => `${capitalizeTR(stem)}: ${answer}.`,
    },
    {
      test: /neresidir$/i,
      make: () => `${capitalizeTR(stem)}: ${answer}.`,
    },
  ];

  const matched = statementPatterns.find((item) => item.test.test(lowered));
  if (matched) return matched.make();

  return `${capitalizeTR(rawQuestion)} — ${answer}.`;
}

function getStatusText(ans, correctDecision, selectedDecision) {
  if (ans === null) return "İfadeyi dikkatlice oku ve doğru mu yanlış mı karar ver ⚖️";
  if (selectedDecision === correctDecision) return "Harika karar! Cevabın tamamen doğru ✅";
  if (correctDecision === "true") return "Bu ifade aslında doğruydu. Bir sonrakinde dikkatli bak ✨";
  return "Bu ifade aslında yanlıştı. Bir sonrakinde dikkatli bak ✨";
}

export default function TrueFalse({ q, qi, gqs, ans, hAns }) {
  const [hovered, setHovered] = useState(null);
  const [shakeWrong, setShakeWrong] = useState(false);
  const [burst, setBurst] = useState(false);
  const [sparkles, setSparkles] = useState([]);

  const wrongOptionIndex = useMemo(() => {
    if (!q?.o?.length) return 1;
    const idx = q.o.findIndex((_, i) => i !== q.a);
    return idx === -1 ? (q.a === 0 ? 1 : 0) : idx;
  }, [q]);

  const statementIsTrue = useMemo(() => {
    const seed = ((qi || 0) + cleanText(q?.q).length) % 2;
    return seed === 0;
  }, [qi, q]);

  const shownOptionIndex = statementIsTrue ? q?.a ?? 0 : wrongOptionIndex;
  const correctDecision = statementIsTrue ? "true" : "false";

  const statementText = useMemo(() => {
    if (!q) return "";
    return buildStatement(q.q, q.o?.[shownOptionIndex] || "");
  }, [q, shownOptionIndex]);

  const selectedDecision = useMemo(() => {
    if (ans === null) return null;
    return ans === q?.a ? correctDecision : correctDecision === "true" ? "false" : "true";
  }, [ans, q, correctDecision]);

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
        Array.from({ length: 12 }).map((_, i) => ({
          id: `${qi}-${i}-${Date.now()}`,
          left: 18 + Math.random() * 64,
          top: 18 + Math.random() * 56,
          dx: -55 + Math.random() * 110,
          dy: -40 + Math.random() * 80,
          delay: Math.random() * 0.14,
        }))
      );
      SFX.reveal?.();

      const t = setTimeout(() => {
        setBurst(false);
        setSparkles([]);
      }, 900);

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
  const statusText = getStatusText(ans, correctDecision, selectedDecision);

  const decisionMode = useMemo(() => {
    if (ans === null) return "Karar Bekleniyor";
    return selectedDecision === correctDecision ? "Doğru Karar" : "Yanlış Karar";
  }, [ans, selectedDecision, correctDecision]);

  if (!q) return null;

  const buttons = [
    {
      key: "true",
      label: "DOĞRU",
      emoji: "✅",
      color: "#2ecc71",
      dark: "#15803d",
      glow: "rgba(46,204,113,.24)",
      desc: "İfade doğruysa bunu seç",
    },
    {
      key: "false",
      label: "YANLIŞ",
      emoji: "❌",
      color: "#e74c3c",
      dark: "#991b1b",
      glow: "rgba(231,76,60,.24)",
      desc: "İfade yanlışsa bunu seç",
    },
  ];

  const handleChoice = (decisionKey) => {
    if (ans !== null) return;

    const wrongIndex = wrongOptionIndex;
    const selectedOptionIndex =
      decisionKey === correctDecision ? q.a : wrongIndex;

    SFX.whoosh?.();
    hAns(selectedOptionIndex);
  };

  const getChoiceState = (btn) => {
    const isAnswered = ans !== null;
    const isCorrect = btn.key === correctDecision;
    const isSelected = selectedDecision === btn.key;

    if (!isAnswered) {
      return {
        border: `1px solid ${btn.glow.replace(".24", ".30")}`,
        background:
          hovered === btn.key
            ? `linear-gradient(180deg, ${btn.color}33, ${btn.dark}26)`
            : `linear-gradient(180deg, ${btn.color}22, ${btn.dark}18)`,
        boxShadow:
          hovered === btn.key
            ? `0 18px 32px ${btn.glow}`
            : `0 10px 22px ${btn.glow}`,
        opacity: 1,
        transform: hovered === btn.key ? "translateY(-4px) scale(1.02)" : "scale(1)",
      };
    }

    if (isCorrect) {
      return {
        border: "1px solid rgba(46,204,113,.42)",
        background:
          "linear-gradient(180deg, rgba(46,204,113,.28), rgba(46,204,113,.12))",
        boxShadow:
          "0 0 0 3px rgba(46,204,113,.08), 0 16px 30px rgba(46,204,113,.16)",
        opacity: 1,
        transform: "scale(1.01)",
      };
    }

    if (isSelected) {
      return {
        border: "1px solid rgba(231,76,60,.42)",
        background:
          "linear-gradient(180deg, rgba(231,76,60,.28), rgba(231,76,60,.12))",
        boxShadow:
          "0 0 0 3px rgba(231,76,60,.08), 0 16px 30px rgba(231,76,60,.16)",
        opacity: 1,
        transform: "scale(1)",
      };
    }

    return {
      border: "1px solid rgba(255,255,255,.06)",
      background: "rgba(255,255,255,.03)",
      boxShadow: "none",
      opacity: 0.72,
      transform: "scale(1)",
    };
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1180,
        margin: "0 auto",
        position: "relative",
        animation: "tfUltraEnter .45s ease",
      }}
    >
      <style>{`
        @keyframes tfUltraEnter {
          from { opacity: 0; transform: translateY(18px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes tfFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }

        @keyframes tfPulse {
          from { transform: scale(1); }
          to { transform: scale(1.04); }
        }

        @keyframes tfShake {
          0% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }

        @keyframes tfGlowBar {
          from { filter: brightness(1); }
          to { filter: brightness(1.14); }
        }

        @keyframes tfSpark {
          0% {
            opacity: 1;
            transform: translate(0,0) scale(.55) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translate(var(--dx), var(--dy)) scale(1.18) rotate(220deg);
          }
        }

        .tf-shell {
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .tf-shake {
          animation: tfShake .46s ease;
        }

        .tf-progress-glow {
          animation: tfGlowBar .85s ease-in-out infinite alternate;
        }

        .tf-pulse {
          animation: tfPulse .8s ease-in-out infinite alternate;
        }

        .tf-float {
          animation: tfFloat 2.6s ease-in-out infinite;
        }

        .tf-choice-btn {
          width: 100%;
          cursor: pointer;
          transition: transform .22s ease, box-shadow .22s ease, opacity .22s ease;
        }

        .tf-choice-btn:disabled {
          cursor: default;
        }

        .tf-spark {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 4px;
          animation: tfSpark .8s ease forwards;
          pointer-events: none;
        }

        .tf-statement-text {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        @media (max-width: 920px) {
          .tf-layout {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 640px) {
          .tf-grid {
            grid-template-columns: 1fr !important;
          }
          .tf-question-title {
            font-size: 24px !important;
          }
        }
      `}</style>

      <div
        className={`tf-shell ${shakeWrong ? "tf-shake" : ""}`}
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 32,
          padding: 18,
          border: "1px solid rgba(255,255,255,.10)",
          background:
            "radial-gradient(circle at top left, rgba(46,204,113,.12), transparent 24%), radial-gradient(circle at top right, rgba(231,76,60,.12), transparent 22%), linear-gradient(180deg, rgba(10,14,28,.90), rgba(14,18,32,.98))",
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
            background: "rgba(46,204,113,.10)",
            filter: "blur(18px)",
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
            background: "rgba(231,76,60,.10)",
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
              className={qi >= 3 ? "tf-pulse" : ""}
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                background: "linear-gradient(135deg,#2ecc71,#27ae60)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 900,
                boxShadow: "0 10px 24px rgba(46,204,113,.22)",
              }}
            >
              ⚖️ {tier}
            </div>

            <div
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                background:
                  ans === null
                    ? "rgba(255,230,109,.12)"
                    : selectedDecision === correctDecision
                      ? "rgba(46,204,113,.12)"
                      : "rgba(231,76,60,.12)",
                border:
                  ans === null
                    ? "1px solid rgba(255,230,109,.18)"
                    : selectedDecision === correctDecision
                      ? "1px solid rgba(46,204,113,.18)"
                      : "1px solid rgba(231,76,60,.18)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 900,
              }}
            >
              🧠 {decisionMode}
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
              maxWidth: 470,
            }}
          >
            {statusText}
          </div>
        </div>

        <div
          className="tf-layout"
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
            className="tf-shell"
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
              🧭 Karar Paneli
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
              İfadeyi oku, doğru mu yanlış mı karar ver
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
                  className="tf-progress-glow"
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    borderRadius: 999,
                    transition: "width .35s ease",
                    background: "linear-gradient(90deg,#2ecc71,#f1c40f,#e74c3c)",
                    boxShadow: "0 0 18px rgba(46,204,113,.18)",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 10,
                marginBottom: 16,
              }}
            >
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
                📖 Bu turda bir ifade gösterilir
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
                ⚖️ İfade doğruysa onayla, yanlışsa reddet
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
                ✨ Her turda ifade bazen doğru bazen yanlış olabilir
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 8,
              }}
            >
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 16,
                  background: "rgba(255,255,255,.05)",
                  border: "1px solid rgba(255,255,255,.08)",
                  color: "#F6F7FB",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                ✅ Doğru = Onay
              </div>

              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 16,
                  background: "rgba(255,255,255,.05)",
                  border: "1px solid rgba(255,255,255,.08)",
                  color: "#F6F7FB",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                ❌ Yanlış = Red
              </div>
            </div>
          </div>

          <div
            className="tf-shell"
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
                background: "rgba(46,204,113,.08)",
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
                background: "rgba(231,76,60,.08)",
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
                🧠 Karar Sahnesi
              </div>

              <div
                style={{
                  minHeight: 220,
                  borderRadius: 24,
                  border: "1px solid rgba(255,255,255,.10)",
                  background:
                    ans === null
                      ? "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))"
                      : selectedDecision === correctDecision
                        ? "linear-gradient(180deg, rgba(46,204,113,.14), rgba(46,204,113,.05))"
                        : "linear-gradient(180deg, rgba(231,76,60,.14), rgba(231,76,60,.05))",
                  position: "relative",
                  overflow: "hidden",
                  marginBottom: 18,
                  display: "grid",
                  placeItems: "center",
                  padding: 22,
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
                  className={ans === null ? "tf-float" : ""}
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    background:
                      ans === null
                        ? "linear-gradient(135deg,#6c5ce7,#4ecdc4)"
                        : selectedDecision === correctDecision
                          ? "linear-gradient(135deg,#2ecc71,#27ae60)"
                          : "linear-gradient(135deg,#ff7675,#e74c3c)",
                    color: "#fff",
                    fontSize: 52,
                    boxShadow:
                      ans === null
                        ? "0 18px 34px rgba(108,92,231,.20)"
                        : selectedDecision === correctDecision
                          ? "0 18px 34px rgba(46,204,113,.20)"
                          : "0 18px 34px rgba(231,76,60,.20)",
                    marginBottom: 18,
                  }}
                >
                  {ans === null ? "?" : selectedDecision === correctDecision ? "✓" : "!"}
                </div>

                <div
                  className="tf-question-title tf-statement-text"
                  style={{
                    fontSize: "clamp(28px, 2.6vw, 36px)",
                    lineHeight: 1.42,
                    fontWeight: 900,
                    color: "#fff",
                    textAlign: "center",
                    textShadow: "0 2px 12px rgba(0,0,0,.22)",
                    maxWidth: 760,
                  }}
                >
                  {statementText}
                </div>
              </div>
            </div>

            <div
              className="tf-grid"
              style={{
                position: "relative",
                zIndex: 1,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              {buttons.map((btn) => {
                const state = getChoiceState(btn);
                const isCorrect = ans !== null && btn.key === correctDecision;
                const isSelected = selectedDecision === btn.key;

                return (
                  <button
                    key={btn.key}
                    className="tf-choice-btn"
                    disabled={ans !== null}
                    onMouseEnter={() => setHovered(btn.key)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => handleChoice(btn.key)}
                    style={{
                      minHeight: 170,
                      borderRadius: 28,
                      padding: "20px 18px",
                      textAlign: "center",
                      color: "#fff",
                      ...state,
                    }}
                  >
                    <div
                      style={{
                        width: 78,
                        height: 78,
                        borderRadius: "50%",
                        margin: "0 auto 14px",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 36,
                        background:
                          ans !== null && btn.key === correctDecision
                            ? "linear-gradient(135deg,#2ecc71,#27ae60)"
                            : ans !== null && isSelected && btn.key !== correctDecision
                              ? "linear-gradient(135deg,#ff7675,#e74c3c)"
                              : `linear-gradient(135deg, ${btn.color}, ${btn.dark})`,
                        boxShadow: `0 12px 26px ${btn.glow}`,
                      }}
                    >
                      {btn.emoji}
                    </div>

                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 900,
                        letterSpacing: ".3px",
                        marginBottom: 8,
                      }}
                    >
                      {btn.label}
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "rgba(255,255,255,.88)",
                        lineHeight: 1.4,
                      }}
                    >
                      {btn.desc}
                    </div>

                    {isCorrect && (
                      <div
                        style={{
                          marginTop: 10,
                          fontSize: 12,
                          fontWeight: 900,
                          color: "#CFF7DE",
                        }}
                      >
                        ✅ Doğru karar
                      </div>
                    )}

                    {ans !== null && isSelected && !isCorrect && (
                      <div
                        style={{
                          marginTop: 10,
                          fontSize: 12,
                          fontWeight: 900,
                          color: "#FFE1DD",
                        }}
                      >
                        ❌ Yanlış karar
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {burst && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              >
                {sparkles.map((s, i) => (
                  <span
                    key={s.id + i}
                    className="tf-spark"
                    style={{
                      left: `${s.left}%`,
                      top: `${s.top}%`,
                      background:
                        i % 3 === 0
                          ? "#FFE66D"
                          : i % 3 === 1
                            ? "#4ECDC4"
                            : "#FF6B6B",
                      "--dx": `${s.dx}px`,
                      "--dy": `${s.dy}px`,
                      animationDelay: `${s.delay}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}