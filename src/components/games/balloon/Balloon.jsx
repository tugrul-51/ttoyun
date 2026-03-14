/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useRef, useState } from "react";
import { SFX } from "../../../utils/audio";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getBalloonLabel(balloon) {
  if (balloon.kind === "time") return "⏱️ +Zaman";
  if (balloon.kind === "gold") return "💰 Altın";
  if (balloon.kind === "heart") return "❤️ Can";
  if (balloon.kind === "rainbow") return "🌈 Sürpriz";
  if (balloon.kind === "bomb") return "💥 Tehlike";
  return balloon.t;
}

function getBalloonVisual(balloon) {
  if (balloon.kind === "time") {
    return {
      bg: "radial-gradient(circle at 30% 28%, #ffffff 0%, #9BE7FF 20%, #3BA7FF 68%, #2563EB 100%)",
      glow: "0 16px 30px rgba(59,167,255,.28)",
    };
  }

  if (balloon.kind === "gold") {
    return {
      bg: "radial-gradient(circle at 30% 28%, #fffdf1 0%, #FFE66D 18%, #F5B700 64%, #D97706 100%)",
      glow: "0 16px 30px rgba(245,183,0,.30)",
    };
  }

  if (balloon.kind === "heart") {
    return {
      bg: "radial-gradient(circle at 30% 28%, #fff4f6 0%, #FF8FAB 20%, #FF4D6D 66%, #D90429 100%)",
      glow: "0 16px 30px rgba(255,77,109,.28)",
    };
  }

  if (balloon.kind === "rainbow") {
    return {
      bg: "linear-gradient(145deg, #FF6B6B 0%, #FFE66D 22%, #4ECDC4 45%, #6C5CE7 70%, #FF8E53 100%)",
      glow: "0 16px 32px rgba(108,92,231,.30)",
    };
  }

  if (balloon.kind === "bomb") {
    return {
      bg: "radial-gradient(circle at 30% 28%, #f7f7f7 0%, #666 24%, #222 70%, #000 100%)",
      glow: "0 16px 32px rgba(0,0,0,.35)",
    };
  }

  return {
    bg: balloon.c
      ? `radial-gradient(circle at 30% 28%, #ffffff 0%, ${balloon.c} 22%, ${balloon.cDark || balloon.c} 100%)`
      : "radial-gradient(circle at 30% 28%, #ffffff 0%, #6C5CE7 20%, #3B2B98 100%)",
    glow: balloon.cGlow ? `0 16px 30px ${balloon.cGlow}` : "0 16px 30px rgba(108,92,231,.28)",
  };
}

function getHintText(ans, combo) {
  if (ans !== null) return "Seçim yapıldı. Sonuç parlıyor ✨";
  if (combo >= 6) return "Harika seri! Doğru balonu yakalamaya devam et 🔥";
  if (combo >= 3) return "Süper gidiyorsun, dikkatli seç 🌟";
  return "Doğru cevabı taşıyan balonu patlat 🎈";
}

export default function Balloon({
  q,
  qi,
  gqs,
  ans,
  cb,
  blns = [],
  hBalloonPick,
}) {
  const [poppedUid, setPoppedUid] = useState(null);
  const [bursts, setBursts] = useState([]);
  const burstCounterRef = useRef(0);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    setPoppedUid(null);
    setBursts([]);
    setHovered(null);
  }, [qi]);

  const total = gqs?.length || 1;
  const current = (qi || 0) + 1;
  const progress = clamp((current / total) * 100, 0, 100);
  const combo = cb || 0;

  const laidOutBalloons = useMemo(() => {
    const items = blns.slice(0, 9);
    const count = items.length;

    if (!count) return [];

    let columns = 3;
    if (count <= 2) columns = count;
    else if (count <= 4) columns = 2;
    else columns = 3;

    const rows = Math.ceil(count / columns);

    const leftPadding = 9;
    const rightPadding = 9;
    const topPadding = 12;
    const bottomPadding = 18;

    const usableWidth = 100 - leftPadding - rightPadding;
    const usableHeight = 100 - topPadding - bottomPadding;

    const colStep = usableWidth / Math.max(columns, 1);
    const rowStep = usableHeight / Math.max(rows, 1);

    return items.map((balloon, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const isAnswer = balloon.kind === "answer";

      const baseLeft = leftPadding + col * colStep + colStep / 2;
      const baseTop = topPadding + row * rowStep + rowStep / 2;

      const jitterX = ((index % 2 === 0 ? -1 : 1) * Math.min(2.8, colStep * 0.08));
      const jitterY = (((index + 1) % 2 === 0 ? -1 : 1) * Math.min(2.1, rowStep * 0.07));

      return {
        ...balloon,
        pos: {
          left: clamp(baseLeft + jitterX, 9, 91),
          top: clamp(baseTop + jitterY, 12, 83),
        },
        bob: 3 + (index % 4) * 0.35,
        rotate: index % 2 === 0 ? -2 : 2,
        size: isAnswer ? 118 : 108,
        height: isAnswer ? 148 : 136,
        z: 10 + index,
      };
    });
  }, [blns]);

  if (!q) return null;

  const handlePick = (balloon) => {
    if (ans !== null || balloon.popped) return;

    setPoppedUid(balloon.uid);

    burstCounterRef.current += 1;
    const burstId = `${balloon.uid}-${burstCounterRef.current}`;
    setBursts((prev) => [
      ...prev,
      {
        id: burstId,
        left: balloon.pos.left,
        top: balloon.pos.top,
      },
    ]);

    if (balloon.kind === "bomb") SFX.explosion?.();
    else if (balloon.kind === "answer") SFX.pop?.();
    else SFX.reveal?.();

    hBalloonPick?.(balloon);

    setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== burstId));
    }, 800);
  };

  const comboTitle =
    combo >= 8
      ? "Efsane Seri"
      : combo >= 5
        ? "Mega Seri"
        : combo >= 3
          ? "Süper Seri"
          : null;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "min(1700px, 98vw)",
        margin: "0 auto",
        position: "relative",
        animation: "balloonUltraEnter .45s ease",
      }}
    >
      <style>{`
        @keyframes balloonUltraEnter {
          from { opacity: 0; transform: translateY(18px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes balloonBob {
          0% { transform: translateY(0) rotate(var(--rot)); }
          50% { transform: translateY(-14px) rotate(calc(var(--rot) * -1)); }
          100% { transform: translateY(0) rotate(var(--rot)); }
        }

        @keyframes cloudMove {
          from { transform: translateX(-8px); }
          to { transform: translateX(8px); }
        }

        @keyframes balloonPulse {
          from { transform: scale(1); }
          to { transform: scale(1.03); }
        }

        @keyframes burstRing {
          0% {
            opacity: .9;
            transform: translate(-50%, -50%) scale(.45);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.55);
          }
        }

        @keyframes confettiFly {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(.6) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translate(var(--dx), var(--dy)) scale(1.15) rotate(220deg);
          }
        }

        @keyframes glowBar {
          from { filter: brightness(1); }
          to { filter: brightness(1.14); }
        }

        .balloon-plate {
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .balloon-item {
          position: absolute;
          cursor: pointer;
          transition: transform .22s ease, filter .22s ease, opacity .22s ease;
          user-select: none;
          will-change: transform;
        }

        .balloon-item:hover {
          filter: brightness(1.06);
        }

        .balloon-item-disabled {
          cursor: default;
        }

        .balloon-combo {
          animation: balloonPulse .75s ease-in-out infinite alternate;
        }

        .balloon-progress-glow {
          animation: glowBar .85s ease-in-out infinite alternate;
        }

        .balloon-ring {
          position: absolute;
          width: 114px;
          height: 114px;
          border-radius: 50%;
          border: 6px solid rgba(255,255,255,.85);
          animation: burstRing .65s ease forwards;
          pointer-events: none;
        }

        .balloon-frag {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 4px;
          animation: confettiFly .8s ease forwards;
          pointer-events: none;
        }

        .balloon-vh-fit {
          height: min(78vh, 760px);
          min-height: 620px;
        }

        .balloon-title-lines {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        @media (max-width: 1360px) {
          .balloon-main-layout {
            grid-template-columns: 350px minmax(0, 1fr) !important;
          }
          .balloon-vh-fit {
            height: min(76vh, 720px) !important;
            min-height: 600px !important;
          }
        }

        @media (max-width: 1100px) {
          .balloon-main-layout {
            grid-template-columns: 1fr !important;
          }
          .balloon-vh-fit {
            height: auto !important;
            min-height: 560px !important;
          }
        }

        @media (max-width: 760px) {
          .balloon-shell {
            padding: 14px !important;
            border-radius: 24px !important;
          }
          .balloon-title {
            font-size: 24px !important;
          }
          .balloon-vh-fit {
            min-height: 620px !important;
          }
        }

        @media (max-width: 560px) {
          .balloon-vh-fit {
            min-height: 700px !important;
          }
        }
      `}</style>

      <div
        className="balloon-plate balloon-shell balloon-vh-fit"
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 30,
          padding: 18,
          border: "1px solid rgba(255,255,255,.12)",
          background:
            "linear-gradient(180deg, rgba(98,172,255,.20), rgba(72,120,255,.10)), linear-gradient(180deg, rgba(8,16,38,.88), rgba(11,18,32,.96))",
          boxShadow: "0 20px 64px rgba(0,0,0,.28)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 10% 8%, rgba(255,255,255,.16), transparent 18%), radial-gradient(circle at 86% 12%, rgba(255,255,255,.13), transparent 14%), radial-gradient(circle at 50% 0%, rgba(255,230,109,.08), transparent 18%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 28,
            left: 24,
            width: 126,
            height: 42,
            borderRadius: 999,
            background: "rgba(255,255,255,.14)",
            filter: "blur(1px)",
            animation: "cloudMove 4.2s ease-in-out infinite alternate",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 78,
            right: 68,
            width: 164,
            height: 48,
            borderRadius: 999,
            background: "rgba(255,255,255,.12)",
            animation: "cloudMove 5s ease-in-out infinite alternate",
          }}
        />

        <div
          style={{
            position: "absolute",
            bottom: -50,
            left: -10,
            width: 240,
            height: 120,
            borderRadius: "50%",
            background: "rgba(78,205,196,.12)",
            filter: "blur(22px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            right: 0,
            width: 240,
            height: 120,
            borderRadius: "50%",
            background: "rgba(108,92,231,.14)",
            filter: "blur(24px)",
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
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <div
              style={{
                padding: "9px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,.10)",
                border: "1px solid rgba(255,255,255,.10)",
                color: "#EEF6FF",
                fontSize: 13,
                fontWeight: 900,
              }}
            >
              GÖREV {current}/{total}
            </div>

            <div
              style={{
                padding: "9px 14px",
                borderRadius: 999,
                background: "rgba(255,230,109,.14)",
                border: "1px solid rgba(255,230,109,.18)",
                color: "#FFF4BF",
                fontSize: 13,
                fontWeight: 900,
              }}
            >
              🎈 Balon Avı
            </div>

            {comboTitle && (
              <div
                className="balloon-combo"
                style={{
                  padding: "9px 14px",
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
            style={{
              padding: "9px 14px",
              borderRadius: 14,
              background: "rgba(255,255,255,.08)",
              border: "1px solid rgba(255,255,255,.10)",
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            {getHintText(ans, combo)}
          </div>
        </div>

        <div
          className="balloon-main-layout"
          style={{
            position: "relative",
            zIndex: 1,
            display: "grid",
            gridTemplateColumns: "minmax(330px, 390px) minmax(0, 1fr)",
            gap: 16,
            alignItems: "stretch",
            height: "calc(100% - 58px)",
          }}
        >
          <div
            className="balloon-plate"
            style={{
              borderRadius: 26,
              padding: 16,
              border: "1px solid rgba(255,255,255,.10)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                padding: "8px 12px",
                borderRadius: 999,
                background: "rgba(255,255,255,.08)",
                border: "1px solid rgba(255,255,255,.10)",
                color: "#DCEBFF",
                fontSize: 12,
                fontWeight: 900,
                marginBottom: 12,
                alignSelf: "flex-start",
              }}
            >
              🧠 Soru Balonu
            </div>

            <div
              className="balloon-title balloon-title-lines"
              style={{
                fontSize: "clamp(21px, 1.9vw, 30px)",
                lineHeight: 1.18,
                fontWeight: 900,
                color: "#fff",
                textShadow: "0 2px 12px rgba(0,0,0,.22)",
                marginBottom: 14,
              }}
            >
              {q.q}
            </div>

            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#CFE2FF",
                }}
              >
                <span>Görev İlerlemesi</span>
                <span>%{Math.round(progress)}</span>
              </div>

              <div
                style={{
                  width: "100%",
                  height: 12,
                  background: "rgba(255,255,255,.08)",
                  borderRadius: 999,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,.08)",
                }}
              >
                <div
                  className="balloon-progress-glow"
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
                gap: 8,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  padding: "11px 13px",
                  borderRadius: 16,
                  background: "rgba(255,255,255,.06)",
                  border: "1px solid rgba(255,255,255,.08)",
                  color: "#EEF6FF",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                🎯 Doğru cevabı taşıyan balonu patlat
              </div>

              <div
                style={{
                  padding: "11px 13px",
                  borderRadius: 16,
                  background: "rgba(255,255,255,.06)",
                  border: "1px solid rgba(255,255,255,.08)",
                  color: "#EEF6FF",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                ✨ Bonus balonlar sürpriz ödül verebilir
              </div>

              <div
                style={{
                  padding: "11px 13px",
                  borderRadius: 16,
                  background: "rgba(255,107,107,.08)",
                  border: "1px solid rgba(255,107,107,.12)",
                  color: "#FFE1DD",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                💥 Bomba balonundan uzak dur
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 7,
                marginTop: "auto",
              }}
            >
              {[
                { k: "answer", t: "Doğru / yanlış cevap balonları" },
                { k: "time", t: "Süre bonusu" },
                { k: "gold", t: "Ekstra puan" },
                { k: "heart", t: "Can desteği" },
                { k: "rainbow", t: "Sürpriz ödül" },
                { k: "bomb", t: "Tehlikeli balon" },
              ].map((item) => {
                const visual = getBalloonVisual({ kind: item.k, c: "#6C5CE7" });

                return (
                  <div
                    key={item.k}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      padding: "9px 11px",
                      borderRadius: 14,
                      background: "rgba(255,255,255,.05)",
                      border: "1px solid rgba(255,255,255,.08)",
                    }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: visual.bg,
                        boxShadow: visual.glow,
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        color: "#EAF3FF",
                        fontSize: 13,
                        fontWeight: 700,
                        lineHeight: 1.15,
                      }}
                    >
                      {item.t}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="balloon-plate"
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 26,
              border: "1px solid rgba(255,255,255,.10)",
              background:
                "linear-gradient(180deg, rgba(117,197,255,.16), rgba(95,145,255,.10) 35%, rgba(16,26,56,.20) 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)",
              minHeight: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: "auto 0 0 0",
                height: 76,
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0), rgba(20,34,60,.12)), linear-gradient(180deg, rgba(80,200,120,.08), rgba(70,160,110,.18))",
              }}
            />

            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at 20% 18%, rgba(255,255,255,.12), transparent 12%), radial-gradient(circle at 68% 10%, rgba(255,255,255,.08), transparent 10%), radial-gradient(circle at 80% 35%, rgba(255,255,255,.06), transparent 12%)",
                pointerEvents: "none",
              }}
            />

            {laidOutBalloons.map((balloon) => {
              const dn = ans !== null;
              const selected = poppedUid === balloon.uid || balloon.popped;
              const visual = getBalloonVisual(balloon);
              const isCorrectAnswer =
                dn && balloon.kind === "answer" && balloon.ok;
              const isWrongPicked =
                dn &&
                balloon.kind === "answer" &&
                ans === balloon.id &&
                !balloon.ok;

              const isFaded =
                dn &&
                !isCorrectAnswer &&
                !isWrongPicked &&
                balloon.kind === "answer";

              return (
                <div
                  key={balloon.uid}
                  className={`balloon-item ${dn ? "balloon-item-disabled" : ""}`}
                  onClick={() => handlePick(balloon)}
                  onMouseEnter={() => setHovered(balloon.uid)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    left: `${balloon.pos.left}%`,
                    top: `${balloon.pos.top}%`,
                    zIndex: balloon.z || 1,
                    opacity: isFaded ? 0.24 : selected ? 0.16 : 1,
                    transform:
                      hovered === balloon.uid && !dn
                        ? "translate(-50%, -50%) translateY(-6px) scale(1.04)"
                        : "translate(-50%, -50%) scale(1)",
                  }}
                >
                  <div
                    style={{
                      width: balloon.size || 118,
                      minHeight: balloon.height || 148,
                      padding: "16px 12px",
                      borderRadius: "50% 50% 48% 52% / 60% 60% 40% 40%",
                      background:
                        isCorrectAnswer
                          ? "radial-gradient(circle at 30% 28%, #ffffff 0%, #7EF5B8 18%, #2ECC71 68%, #15803D 100%)"
                          : isWrongPicked
                            ? "radial-gradient(circle at 30% 28%, #fff2f2 0%, #FFA69E 18%, #E74C3C 68%, #991B1B 100%)"
                            : visual.bg,
                      boxShadow:
                        isCorrectAnswer
                          ? "0 18px 34px rgba(46,204,113,.30)"
                          : isWrongPicked
                            ? "0 18px 34px rgba(231,76,60,.26)"
                            : visual.glow,
                      border: "3px solid rgba(255,255,255,.22)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      position: "relative",
                      color: "#fff",
                      textShadow: "0 2px 6px rgba(0,0,0,.40)",
                      fontWeight: 900,
                      fontSize: balloon.kind === "answer" ? 14 : 13,
                      lineHeight: 1.12,
                      animation:
                        dn || selected
                          ? "none"
                          : `balloonBob ${balloon.bob}s ease-in-out infinite`,
                      "--rot": `${balloon.rotate}deg`,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 16,
                        left: 16,
                        width: 26,
                        height: 16,
                        borderRadius: 999,
                        background: "rgba(255,255,255,.34)",
                        transform: "rotate(-22deg)",
                        filter: "blur(.3px)",
                      }}
                    />

                    <div
                      style={{
                        position: "relative",
                        zIndex: 1,
                        maxWidth: "84%",
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {balloon.icon ? (
                        <div style={{ fontSize: 24, marginBottom: 6 }}>
                          {balloon.icon}
                        </div>
                      ) : null}

                      <div>{getBalloonLabel(balloon)}</div>

                      {isCorrectAnswer && (
                        <div
                          style={{
                            marginTop: 7,
                            fontSize: 10,
                            color: "#D8FFE8",
                          }}
                        >
                          ✅ Doğru seçim
                        </div>
                      )}

                      {isWrongPicked && (
                        <div
                          style={{
                            marginTop: 7,
                            fontSize: 10,
                            color: "#FFE1DD",
                          }}
                        >
                          ❌ Yanlış seçim
                        </div>
                      )}
                    </div>

                    {!selected && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: -28,
                          left: "50%",
                          width: 2,
                          height: 36,
                          background: "rgba(255,255,255,.48)",
                          transform: "translateX(-50%)",
                          borderRadius: 999,
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}

            {bursts.map((burst, i) => (
              <div
                key={burst.id + i}
                style={{
                  position: "absolute",
                  left: `${burst.left}%`,
                  top: `${burst.top}%`,
                  width: 1,
                  height: 1,
                  pointerEvents: "none",
                }}
              >
                <div className="balloon-ring" />
                {Array.from({ length: 8 }).map((_, idx) => (
                  <span
                    key={idx}
                    className="balloon-frag"
                    style={{
                      left: 0,
                      top: 0,
                      background:
                        idx % 3 === 0
                          ? "#FFE66D"
                          : idx % 3 === 1
                            ? "#4ECDC4"
                            : "#FF6B6B",
                      "--dx": `${Math.cos((idx / 8) * Math.PI * 2) * 58}px`,
                      "--dy": `${Math.sin((idx / 8) * Math.PI * 2) * 58}px`,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}