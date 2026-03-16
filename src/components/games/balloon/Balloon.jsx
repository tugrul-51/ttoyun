/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useRef, useState } from "react";
import { SFX } from "../../../utils/audio";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function pick(array, indexSeed = 0) {
  if (!array.length) return null;
  return array[Math.abs(indexSeed) % array.length];
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
      glow: "0 18px 34px rgba(59,167,255,.30)",
      shadow: "rgba(59,167,255,.24)",
    };
  }

  if (balloon.kind === "gold") {
    return {
      bg: "radial-gradient(circle at 30% 28%, #fffdf1 0%, #FFE66D 18%, #F5B700 64%, #D97706 100%)",
      glow: "0 18px 34px rgba(245,183,0,.30)",
      shadow: "rgba(245,183,0,.24)",
    };
  }

  if (balloon.kind === "heart") {
    return {
      bg: "radial-gradient(circle at 30% 28%, #fff4f6 0%, #FF8FAB 20%, #FF4D6D 66%, #D90429 100%)",
      glow: "0 18px 34px rgba(255,77,109,.28)",
      shadow: "rgba(255,77,109,.22)",
    };
  }

  if (balloon.kind === "rainbow") {
    return {
      bg: "linear-gradient(145deg, #FF6B6B 0%, #FFE66D 22%, #4ECDC4 45%, #6C5CE7 70%, #FF8E53 100%)",
      glow: "0 18px 36px rgba(108,92,231,.30)",
      shadow: "rgba(108,92,231,.22)",
    };
  }

  if (balloon.kind === "bomb") {
    return {
      bg: "radial-gradient(circle at 30% 28%, #f7f7f7 0%, #666 24%, #222 70%, #000 100%)",
      glow: "0 18px 36px rgba(0,0,0,.36)",
      shadow: "rgba(0,0,0,.24)",
    };
  }

  return {
    bg: balloon.c
      ? `radial-gradient(circle at 30% 28%, #ffffff 0%, ${balloon.c} 22%, ${balloon.cDark || balloon.c} 100%)`
      : "radial-gradient(circle at 30% 28%, #ffffff 0%, #6C5CE7 20%, #3B2B98 100%)",
    glow: balloon.cGlow ? `0 18px 34px ${balloon.cGlow}` : "0 18px 34px rgba(108,92,231,.28)",
    shadow: balloon.cGlow || "rgba(108,92,231,.20)",
  };
}

function getHintText(ans, combo, bonusCount) {
  if (ans !== null) return "Patlama tamamlandı. Sonuç ekranda parlıyor ✨";
  if (combo >= 6) return "Efsane seri! Balon fırtınasını sürdür 🔥";
  if (bonusCount >= 6) return "Sahne bonus dolu. Önce doğru balonu gözle 🎯";
  if (combo >= 3) return "Süper gidiyorsun, doğru balonu dikkatle seç 🌟";
  return "Soru cümlesine bak, doğru cevabı taşıyan balonu patlat 🎈";
}

function getImpactPalette(type) {
  switch (type) {
    case "correct":
      return {
        flash: "radial-gradient(circle, rgba(126,245,184,.42) 0%, rgba(126,245,184,.18) 24%, rgba(255,255,255,0) 72%)",
        ring: "rgba(126,245,184,.95)",
        textBg: "linear-gradient(135deg, rgba(23,130,84,.92), rgba(126,245,184,.92))",
        text: "#F4FFF8",
        label: "Doğru Balon!",
        emoji: "🎉",
        particles: ["#7EF5B8", "#FFE66D", "#4ECDC4", "#FFFFFF"],
      };
    case "wrong":
      return {
        flash: "radial-gradient(circle, rgba(255,166,158,.38) 0%, rgba(255,107,107,.18) 26%, rgba(255,255,255,0) 72%)",
        ring: "rgba(255,166,158,.92)",
        textBg: "linear-gradient(135deg, rgba(153,27,27,.92), rgba(231,76,60,.92))",
        text: "#FFF7F7",
        label: "Yanlış Balon",
        emoji: "💥",
        particles: ["#FFA69E", "#FF6B6B", "#FFD3CE", "#FFFFFF"],
      };
    case "bomb":
      return {
        flash: "radial-gradient(circle, rgba(255,193,7,.26) 0%, rgba(255,87,34,.18) 26%, rgba(255,255,255,0) 72%)",
        ring: "rgba(255,193,7,.92)",
        textBg: "linear-gradient(135deg, rgba(73,30,0,.92), rgba(255,126,95,.92))",
        text: "#FFF8EE",
        label: "Tehlikeli Patlama",
        emoji: "⚠️",
        particles: ["#FFB703", "#FB8500", "#FFD166", "#FFFFFF"],
      };
    default:
      return {
        flash: "radial-gradient(circle, rgba(255,255,255,.28) 0%, rgba(255,255,255,.12) 20%, rgba(255,255,255,0) 72%)",
        ring: "rgba(255,255,255,.82)",
        textBg: "linear-gradient(135deg, rgba(80,120,255,.88), rgba(120,170,255,.88))",
        text: "#FFFFFF",
        label: "Bonus Yakalandı",
        emoji: "✨",
        particles: ["#FFFFFF", "#A7F3D0", "#93C5FD", "#FDE68A"],
      };
  }
}

function createImpactParticles(type, seed = 0) {
  const palette = getImpactPalette(type);
  return Array.from({ length: 26 }).map((_, index) => {
    const angle = ((index + 1) / 26) * Math.PI * 2;
    const radius = 70 + ((index + seed) % 8) * 22;
    return {
      id: `${type}-${seed}-${index}`,
      size: 10 + ((index + seed) % 5) * 3,
      dx: `${Math.cos(angle) * radius}px`,
      dy: `${Math.sin(angle) * radius + (index % 3 === 0 ? 18 : -10)}px`,
      delay: `${index * 12}ms`,
      rotate: `${(index * 37 + seed * 11) % 360}deg`,
      color: pick(palette.particles, index) || "#FFFFFF",
    };
  });
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
  const [screenBursts, setScreenBursts] = useState([]);
  const burstCounterRef = useRef(0);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    setPoppedUid(null);
    setBursts([]);
    setScreenBursts([]);
    setHovered(null);
  }, [qi]);

  const total = gqs?.length || 1;
  const current = (qi || 0) + 1;
  const progress = clamp((current / total) * 100, 0, 100);
  const combo = cb || 0;
  const bonusCount = useMemo(
    () => blns.filter((balloon) => balloon.kind !== "answer").length,
    [blns],
  );

  const laidOutBalloons = useMemo(() => {
    const items = blns.slice(0, 12);
    const count = items.length;

    if (!count) return [];

    let columns = 4;
    if (count <= 4) columns = 2;
    else if (count <= 8) columns = 3;

    const rows = Math.ceil(count / columns);
    const leftPadding = columns >= 4 ? 8 : 10;
    const rightPadding = columns >= 4 ? 8 : 10;
    const topPadding = 12;
    const bottomPadding = 18;
    const usableWidth = 100 - leftPadding - rightPadding;
    const usableHeight = 100 - topPadding - bottomPadding;
    const colStep = usableWidth / Math.max(columns, 1);
    const rowStep = usableHeight / Math.max(rows, 1);
    const dense = count >= 10;

    return items.map((balloon, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const isAnswer = balloon.kind === "answer";
      const baseLeft = leftPadding + col * colStep + colStep / 2;
      const baseTop = topPadding + row * rowStep + rowStep / 2;
      const jitterX = ((index % 2 === 0 ? -1 : 1) * Math.min(columns >= 4 ? 1.8 : 2.8, colStep * 0.09));
      const jitterY = (((index + 1) % 2 === 0 ? -1 : 1) * Math.min(dense ? 1.5 : 2.1, rowStep * 0.08));
      const baseAnswerSize = dense ? 104 : columns >= 4 ? 112 : 120;
      const baseBonusSize = dense ? 92 : columns >= 4 ? 98 : 106;

      return {
        ...balloon,
        pos: {
          left: clamp(baseLeft + jitterX, 8, 92),
          top: clamp(baseTop + jitterY, 12, 84),
        },
        bob: 2.8 + (index % 4) * 0.32,
        sway: 3.2 + (index % 5) * 0.22,
        rotate: index % 2 === 0 ? -2.6 : 2.6,
        size: isAnswer ? baseAnswerSize : baseBonusSize,
        height: isAnswer ? baseAnswerSize + 30 : baseBonusSize + 28,
        z: 12 + index,
      };
    });
  }, [blns]);

  function handlePick(balloon) {
    if (ans !== null || balloon.popped) return;

    setPoppedUid(balloon.uid);

    burstCounterRef.current += 1;
    const burstId = `${balloon.uid}-${burstCounterRef.current}`;
    const burstType = balloon.kind === "answer" ? (balloon.ok ? "correct" : "wrong") : balloon.kind === "bomb" ? "bomb" : "bonus";

    setBursts((prev) => [
      ...prev,
      {
        id: burstId,
        left: balloon.pos.left,
        top: balloon.pos.top,
        type: burstType,
      },
    ]);

    if (balloon.kind === "bomb") {
      SFX.balloonOops?.();
      SFX.explosion?.();
    } else if (balloon.kind === "answer" && balloon.ok) {
      SFX.balloonParty?.();
    } else if (balloon.kind === "answer") {
      SFX.balloonOops?.();
    } else {
      SFX.balloonBonus?.();
    }

    if (balloon.kind === "answer" || balloon.kind === "bomb") {
      const screenId = `${burstId}-screen`;
      setScreenBursts((prev) => [
        ...prev,
        {
          id: screenId,
          left: balloon.pos.left,
          top: balloon.pos.top,
          type: burstType,
          particles: createImpactParticles(burstType, burstCounterRef.current),
        },
      ]);
      setTimeout(() => {
        setScreenBursts((prev) => prev.filter((entry) => entry.id !== screenId));
      }, 980);
    }

    hBalloonPick?.(balloon);

    setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== burstId));
    }, 900);
  }

  useEffect(() => {
    if (!laidOutBalloons.length || ans !== null) return undefined;

    const handleKeyDown = (event) => {
      const key = event.key?.toLowerCase?.();
      const answerMap = { "1": 0, "2": 1, "3": 2, "4": 3, a: 0, b: 1, c: 2, d: 3 };
      if (!(key in answerMap)) return;
      const target = laidOutBalloons.find(
        (balloon) => balloon.kind === "answer" && balloon.id === answerMap[key],
      );
      if (target) {
        event.preventDefault();
        handlePick(target);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [laidOutBalloons, ans, handlePick]);

  const skyDecor = useMemo(
    () =>
      Array.from({ length: 9 }).map((_, index) => ({
        id: `spark-${qi}-${index}`,
        left: `${10 + ((index * 11) % 76)}%`,
        top: `${8 + ((index * 17) % 68)}%`,
        delay: `${index * 0.18}s`,
        duration: `${2.1 + (index % 3) * 0.45}s`,
        size: 6 + (index % 4) * 3,
      })),
    [qi],
  );

  if (!q) return null;

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

        @keyframes balloonSway {
          0% { transform: translateX(0px); }
          50% { transform: translateX(3px); }
          100% { transform: translateX(0px); }
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
            opacity: .92;
            transform: translate(-50%, -50%) scale(.42);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.82);
          }
        }

        @keyframes confettiFly {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(.6) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translate(var(--dx), var(--dy)) scale(1.18) rotate(240deg);
          }
        }

        @keyframes glowBar {
          from { filter: brightness(1); }
          to { filter: brightness(1.16); }
        }

        @keyframes sparkleTwinkle {
          0%, 100% { opacity: .18; transform: scale(.72); }
          50% { opacity: .95; transform: scale(1.14); }
        }

        @keyframes impactFlash {
          0% { opacity: 0; transform: scale(.78); }
          18% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.22); }
        }

        @keyframes impactBanner {
          0% { opacity: 0; transform: translate(-50%, -12px) scale(.9); }
          20% { opacity: 1; transform: translate(-50%, 0px) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -8px) scale(1.03); }
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
          filter: brightness(1.08);
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
          width: 128px;
          height: 128px;
          border-radius: 50%;
          border: 6px solid rgba(255,255,255,.88);
          animation: burstRing .7s ease forwards;
          pointer-events: none;
        }

        .balloon-frag {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 4px;
          animation: confettiFly .86s ease forwards;
          pointer-events: none;
        }

        .balloon-screen-impact {
          position: absolute;
          inset: -8%;
          pointer-events: none;
          animation: impactFlash .96s ease forwards;
          mix-blend-mode: screen;
        }

        .balloon-vh-fit {
          height: min(80vh, 780px);
          min-height: 640px;
        }

        .balloon-title-lines {
          max-height: min(32vh, 260px);
          overflow-y: auto;
          padding-right: 6px;
          word-break: break-word;
          overflow-wrap: anywhere;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,.26) transparent;
        }

        .balloon-title-lines::-webkit-scrollbar {
          width: 8px;
        }

        .balloon-title-lines::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,.20);
          border-radius: 999px;
        }

        .balloon-sparkle {
          position: absolute;
          border-radius: 999px;
          background: rgba(255,255,255,.8);
          animation: sparkleTwinkle var(--dur) ease-in-out infinite;
          animation-delay: var(--delay);
          pointer-events: none;
        }

        @media (max-width: 1480px) {
          .balloon-main-layout {
            grid-template-columns: 360px minmax(0, 1fr) !important;
          }
          .balloon-vh-fit {
            height: min(78vh, 740px) !important;
            min-height: 620px !important;
          }
        }

        @media (max-width: 1280px) {
          .balloon-main-layout {
            grid-template-columns: 1fr !important;
          }
          .balloon-vh-fit {
            height: auto !important;
            min-height: 620px !important;
          }
        }

        @media (max-width: 760px) {
          .balloon-shell {
            padding: 14px !important;
            border-radius: 24px !important;
          }
          .balloon-title {
            font-size: 26px !important;
          }
          .balloon-vh-fit {
            min-height: 720px !important;
          }
        }

        @media (max-width: 560px) {
          .balloon-vh-fit {
            min-height: 760px !important;
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

        {skyDecor.map((sparkle) => (
          <span
            key={sparkle.id}
            className="balloon-sparkle"
            style={{
              left: sparkle.left,
              top: sparkle.top,
              width: sparkle.size,
              height: sparkle.size,
              "--delay": sparkle.delay,
              "--dur": sparkle.duration,
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
              🎈 Balon Avı Sahnesi
            </div>

            <div
              style={{
                padding: "9px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,.10)",
                border: "1px solid rgba(255,255,255,.10)",
                color: "#DFF4FF",
                fontSize: 13,
                fontWeight: 900,
              }}
            >
              {laidOutBalloons.length} Balon Aktif
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
            {getHintText(ans, combo, bonusCount)}
          </div>
        </div>

        <div
          className="balloon-main-layout"
          style={{
            position: "relative",
            zIndex: 1,
            display: "grid",
            gridTemplateColumns: "minmax(340px, 400px) minmax(0, 1fr)",
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
              🧠 Şimdi Patlatılacak Soru
            </div>

            <div
              style={{
                padding: "14px 16px",
                borderRadius: 22,
                background: "linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.05))",
                border: "1px solid rgba(255,255,255,.11)",
                marginBottom: 14,
                boxShadow: "0 18px 36px rgba(0,0,0,.18)",
              }}
            >
              <div
                className="balloon-title balloon-title-lines"
                style={{
                  fontSize: "clamp(22px, 1.9vw, 30px)",
                  lineHeight: 1.18,
                  fontWeight: 950,
                  color: "#fff",
                  textShadow: "0 2px 12px rgba(0,0,0,.24)",
                }}
              >
                {q.q}
              </div>
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
                marginBottom: 10,
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
                🎯 Cevabı taşıyan balonu patlat. Dilersen <b>1-4</b> veya <b>A-D</b> ile de seçebilirsin.
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
                ✨ Altın, kalp ve sürpriz balonlar sana ekstra destek verir.
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 18,
                  background: "rgba(255,107,107,.10)",
                  border: "1px solid rgba(255,107,107,.15)",
                  color: "#FFE1DD",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                💥 Bomba balonu süreyi sarsar. Patlatmadan önce dikkat et.
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 8,
                marginTop: "auto",
              }}
            >
              {[
                { k: "answer", t: "Doğru cevap balonları" },
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
                      padding: "10px 12px",
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
                height: 86,
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

            {screenBursts.map((impact) => {
              const palette = getImpactPalette(impact.type);
              return (
                <div key={impact.id} className="balloon-screen-impact">
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: palette.flash,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: `${impact.left}%`,
                      top: `${impact.top}%`,
                      width: 220,
                      height: 220,
                      borderRadius: "50%",
                      border: `8px solid ${palette.ring}`,
                      transform: "translate(-50%, -50%)",
                      animation: "burstRing .88s ease forwards",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: `${impact.left}%`,
                      top: `${impact.top}%`,
                      width: 360,
                      height: 360,
                      borderRadius: "50%",
                      border: `4px solid ${palette.ring}`,
                      transform: "translate(-50%, -50%)",
                      animation: "burstRing 1s ease forwards",
                      opacity: .66,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: 18,
                      transform: "translateX(-50%)",
                      padding: "12px 18px",
                      borderRadius: 999,
                      background: palette.textBg,
                      color: palette.text,
                      fontWeight: 900,
                      fontSize: 18,
                      letterSpacing: .2,
                      boxShadow: "0 12px 28px rgba(0,0,0,.24)",
                      animation: "impactBanner .92s ease forwards",
                    }}
                  >
                    {palette.emoji} {palette.label}
                  </div>
                  {impact.particles.map((particle) => (
                    <span
                      key={particle.id}
                      className="balloon-frag"
                      style={{
                        left: `${impact.left}%`,
                        top: `${impact.top}%`,
                        width: particle.size,
                        height: particle.size,
                        background: particle.color,
                        borderRadius: particle.size > 14 ? "50%" : "4px",
                        boxShadow: `0 0 18px ${particle.color}`,
                        "--dx": particle.dx,
                        "--dy": particle.dy,
                        animationDelay: particle.delay,
                        transform: `rotate(${particle.rotate})`,
                      }}
                    />
                  ))}
                </div>
              );
            })}

            {laidOutBalloons.map((balloon) => {
              const dn = ans !== null;
              const selected = poppedUid === balloon.uid || balloon.popped;
              const visual = getBalloonVisual(balloon);
              const isCorrectAnswer = dn && balloon.kind === "answer" && balloon.ok;
              const isWrongPicked = dn && balloon.kind === "answer" && ans === balloon.id && !balloon.ok;
              const isFaded = dn && !isCorrectAnswer && !isWrongPicked && balloon.kind === "answer";
              const labelBadge = balloon.kind === "answer" ? ["A", "B", "C", "D"][balloon.id] : null;

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
                    opacity: isFaded ? 0.22 : selected ? 0.12 : 1,
                    transform:
                      hovered === balloon.uid && !dn
                        ? "translate(-50%, -50%) translateY(-7px) scale(1.05)"
                        : "translate(-50%, -50%) scale(1)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: 16,
                      width: (balloon.size || 112) + 14,
                      height: (balloon.size || 112) + 14,
                      borderRadius: "50%",
                      background: `radial-gradient(circle, ${visual.shadow || "rgba(255,255,255,.16)"} 0%, rgba(255,255,255,0) 70%)`,
                      transform: "translate(-50%, -50%)",
                      opacity: hovered === balloon.uid ? .9 : .55,
                      filter: "blur(10px)",
                    }}
                  />

                  <div
                    style={{
                      width: balloon.size || 112,
                      minHeight: balloon.height || 142,
                      padding: "14px 11px",
                      borderRadius: "50% 50% 48% 52% / 60% 60% 40% 40%",
                      background:
                        isCorrectAnswer
                          ? "radial-gradient(circle at 30% 28%, #ffffff 0%, #7EF5B8 18%, #2ECC71 68%, #15803D 100%)"
                          : isWrongPicked
                            ? "radial-gradient(circle at 30% 28%, #fff2f2 0%, #FFA69E 18%, #E74C3C 68%, #991B1B 100%)"
                            : visual.bg,
                      boxShadow:
                        isCorrectAnswer
                          ? "0 18px 36px rgba(46,204,113,.30)"
                          : isWrongPicked
                            ? "0 18px 36px rgba(231,76,60,.26)"
                            : visual.glow,
                      border: "3px solid rgba(255,255,255,.24)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      position: "relative",
                      color: "#fff",
                      textShadow: "0 2px 7px rgba(0,0,0,.42)",
                      fontWeight: 900,
                      fontSize: balloon.kind === "answer" ? 14 : 13,
                      lineHeight: 1.1,
                      animation:
                        dn || selected
                          ? "none"
                          : `balloonBob ${balloon.bob}s ease-in-out infinite, balloonSway ${balloon.sway}s ease-in-out infinite`,
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

                    {labelBadge && (
                      <div
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: "rgba(8,16,38,.42)",
                          border: "1px solid rgba(255,255,255,.2)",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 12,
                          fontWeight: 900,
                          color: "#FFFFFF",
                          boxShadow: "0 8px 14px rgba(0,0,0,.18)",
                        }}
                      >
                        {labelBadge}
                      </div>
                    )}

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

            {bursts.map((burst, i) => {
              const palette = getImpactPalette(burst.type);
              return (
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
                  <div className="balloon-ring" style={{ borderColor: palette.ring }} />
                  {Array.from({ length: 14 }).map((_, idx) => (
                    <span
                      key={idx}
                      className="balloon-frag"
                      style={{
                        left: 0,
                        top: 0,
                        background: pick(palette.particles, idx) || "#FFFFFF",
                        boxShadow: `0 0 18px ${pick(palette.particles, idx) || "#FFFFFF"}`,
                        width: 8 + (idx % 4) * 3,
                        height: 8 + (idx % 4) * 3,
                        borderRadius: idx % 2 === 0 ? "50%" : "4px",
                        "--dx": `${Math.cos((idx / 14) * Math.PI * 2) * (68 + (idx % 3) * 14)}px`,
                        "--dy": `${Math.sin((idx / 14) * Math.PI * 2) * (68 + (idx % 3) * 14)}px`,
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
