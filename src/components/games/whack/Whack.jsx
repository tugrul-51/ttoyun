/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useRef, useState } from "react";
import { spawnConfetti, spawnEmoji } from "../../../utils/effects";
import { SFX } from "../../../utils/audio";

const SPEED_PRESETS = {
  slow: {
    label: "Yavaş",
    popUpMs: 340,
    visibleMs: 1500,
    hideMs: 320,
  },
  normal: {
    label: "Normal",
    popUpMs: 260,
    visibleMs: 1100,
    hideMs: 260,
  },
  fast: {
    label: "Hızlı",
    popUpMs: 190,
    visibleMs: 800,
    hideMs: 190,
  },
};

const OPTION_BADGES = ["A", "B", "C", "D", "E", "F"];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getTierLabel(index) {
  const n = (index || 0) + 1;
  if (n >= 10) return "Refleks Ustası";
  if (n >= 7) return "Süper Avcı";
  if (n >= 4) return "Turbo Vuruş";
  return "Başlangıç Arenası";
}

function getStatusText(ans, visibleCount, correctVisible) {
  if (ans === null) {
    if (correctVisible) return "Doğru cevap sahnede! Hemen doğru köstebeği vur 🔨";
    if (visibleCount > 0) return "Köstebekleri dikkatle izle. Doğru cevap her an ortaya çıkabilir 👀";
    return "Hazır ol. Delikler birazdan hareketlenecek 🕳️";
  }
  return "Tur sonuçlandı. Doğru cevap sahnede işaretlendi ✨";
}

function getMoleMood(visibleCount, correctVisible, ans) {
  if (ans !== null) return "Tur Sonuçlandı";
  if (correctVisible) return "Hedef Açık";
  if (visibleCount >= 3) return "Yoğun Arena";
  if (visibleCount >= 1) return "Hareket Var";
  return "Sakin Alan";
}

function cleanLabel(text = "") {
  return String(text).replace(/\s+/g, " ").trim();
}

export default function Whack({ q, qi, gqs, ans, hAns, moles = [] }) {
  const [hovered, setHovered] = useState(null);
  const [shakeWrong, setShakeWrong] = useState(false);
  const [burst, setBurst] = useState(false);
  const [sparkles, setSparkles] = useState([]);
  const [uiMoles, setUiMoles] = useState({});
  const [speedKey, setSpeedKey] = useState("normal");
  const [successWave, setSuccessWave] = useState(false);
  const [failWave, setFailWave] = useState(false);
  const [impactBursts, setImpactBursts] = useState([]);
  const timersRef = useRef({});
  const lastCueRef = useRef(0);
  const prevVisibleRef = useRef(0);

  const speed = SPEED_PRESETS[speedKey];
  const MOLE_POP_UP_MS = speed.popUpMs;
  const MOLE_MIN_VISIBLE_MS = speed.visibleMs;
  const MOLE_HIDE_MS = speed.hideMs;

  useEffect(() => {
    setHovered(null);
    setShakeWrong(false);
    setBurst(false);
    setSuccessWave(false);
    setFailWave(false);
    setSparkles([]);
    setImpactBursts([]);
    Object.values(timersRef.current).forEach((t) => {
      clearTimeout(t.hideDelay);
      clearTimeout(t.removeDelay);
    });
    timersRef.current = {};
    prevVisibleRef.current = 0;
    setUiMoles({});
  }, [qi]);

  useEffect(() => {
    setUiMoles((prev) => {
      const reset = {};
      Object.values(prev).forEach((item) => {
        if (item?.visible) {
          reset[item.id] = {
            ...item,
            phase: "idle",
          };
        }
      });
      return reset;
    });
  }, [speedKey]);

  useEffect(() => {
    const now = Date.now();

    setUiMoles((prev) => {
      const next = { ...prev };

      moles.forEach((m) => {
        const existing = next[m.id];

        if (m.vis) {
          const oldTimers = timersRef.current[m.id];
          if (oldTimers) {
            clearTimeout(oldTimers.hideDelay);
            clearTimeout(oldTimers.removeDelay);
            delete timersRef.current[m.id];
          }

          next[m.id] = {
            ...existing,
            id: m.id,
            t: m.t,
            ok: m.ok,
            mounted: true,
            visible: true,
            phase: existing?.mounted ? "idle" : "up",
            since: existing?.visible ? existing.since : now,
          };
          return;
        }

        if (existing?.mounted && existing.visible) {
          const shownFor = now - (existing.since || now);
          const waitBeforeHide = Math.max(0, MOLE_MIN_VISIBLE_MS - shownFor);

          if (!timersRef.current[m.id]) timersRef.current[m.id] = {};

          clearTimeout(timersRef.current[m.id].hideDelay);
          clearTimeout(timersRef.current[m.id].removeDelay);

          timersRef.current[m.id].hideDelay = setTimeout(() => {
            setUiMoles((curr) => {
              const item = curr[m.id];
              if (!item) return curr;
              return {
                ...curr,
                [m.id]: {
                  ...item,
                  visible: false,
                  phase: "down",
                },
              };
            });

            timersRef.current[m.id].removeDelay = setTimeout(() => {
              setUiMoles((curr) => {
                const item = curr[m.id];
                if (!item) return curr;
                const clone = { ...curr };
                delete clone[m.id];
                return clone;
              });
              delete timersRef.current[m.id];
            }, MOLE_HIDE_MS);
          }, waitBeforeHide);
        }
      });

      moles.forEach((m) => {
        if (!m.vis && !next[m.id]?.mounted) {
          delete next[m.id];
        }
      });

      return next;
    });
  }, [moles, MOLE_MIN_VISIBLE_MS, MOLE_HIDE_MS]);

  const displayMoles = useMemo(() => {
    return moles.map((m) => {
      const ui = uiMoles[m.id];
      return {
        ...m,
        displayVisible: !!ui?.mounted,
        phase: ui?.phase || "hidden",
        displayText: cleanLabel(ui?.t ?? m.t),
        displayOk: ui?.ok ?? m.ok,
      };
    });
  }, [moles, uiMoles]);

  const visibleCount = useMemo(
    () => displayMoles.filter((m) => m.displayVisible).length,
    [displayMoles]
  );

  const correctVisible = useMemo(
    () => displayMoles.some((m) => m.displayVisible && m.displayOk),
    [displayMoles]
  );

  const correctMole = useMemo(
    () => displayMoles.find((m) => m.displayOk) || null,
    [displayMoles]
  );

  useEffect(() => {
    if (ans !== null) return;
    if (visibleCount > prevVisibleRef.current) {
      const now = Date.now();
      if (now - lastCueRef.current > 280) {
        SFX.mole?.();
        lastCueRef.current = now;
      }
    }
    prevVisibleRef.current = visibleCount;
  }, [visibleCount, ans]);

  useEffect(() => {
    if (ans === null) return undefined;

    const picked = moles.find((m) => m.id === ans);
    const impactSeed = Date.now();

    if (picked?.ok) {
      setBurst(true);
      setSuccessWave(true);
      setSparkles(
        Array.from({ length: 18 }).map((_, i) => ({
          id: `${qi}-${i}-${impactSeed}`,
          left: 10 + Math.random() * 78,
          top: 18 + Math.random() * 56,
          dx: -70 + Math.random() * 140,
          dy: -70 + Math.random() * 120,
          delay: Math.random() * 0.18,
          size: 10 + Math.random() * 10,
        }))
      );
      setImpactBursts([
        { id: `success-${impactSeed}`, type: "success" },
        { id: `success-ring-${impactSeed}`, type: "ring" },
      ]);
      spawnConfetti(42);
      spawnEmoji("⭐", 50, 22);
      SFX.correct?.();
      setTimeout(() => SFX.combo?.(), 70);
      setTimeout(() => SFX.win?.(), 150);

      const t = setTimeout(() => {
        setBurst(false);
        setSuccessWave(false);
        setSparkles([]);
        setImpactBursts([]);
      }, 1100);

      return () => clearTimeout(t);
    }

    setFailWave(true);
    setShakeWrong(true);
    setImpactBursts([
      { id: `fail-${impactSeed}`, type: "danger" },
      { id: `fail-ring-${impactSeed}`, type: "shock" },
    ]);
    spawnEmoji("💥", 50, 28);
    SFX.wrong?.();
    setTimeout(() => SFX.explosion?.(), 40);

    const t = setTimeout(() => {
      setShakeWrong(false);
      setFailWave(false);
      setImpactBursts([]);
    }, 720);
    return () => clearTimeout(t);
  }, [ans, moles, qi]);

  const total = gqs?.length || 1;
  const current = (qi || 0) + 1;
  const progress = clamp((current / total) * 100, 0, 100);
  const tier = getTierLabel(qi || 0);
  const statusText = getStatusText(ans, visibleCount, correctVisible);
  const mood = getMoleMood(visibleCount, correctVisible, ans);

  function handleHit(m) {
    if (!m.displayVisible || ans !== null) return;
    SFX.whoosh?.();
    hAns(m.id);
  }

  useEffect(() => {
    if (ans !== null) return undefined;

    const onKeyDown = (event) => {
      const key = String(event.key || "").toLowerCase();
      let index = -1;
      if (["1", "2", "3", "4", "5", "6"].includes(key)) index = Number(key) - 1;
      if (["a", "b", "c", "d", "e", "f"].includes(key)) index = key.charCodeAt(0) - 97;
      if (index < 0) return;
      const target = displayMoles[index];
      if (!target?.displayVisible) return;
      event.preventDefault();
      handleHit(target);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [ans, displayMoles, handleHit]);

  if (!q) return null;

  const arenaGlow =
    ans === null
      ? "0 20px 64px rgba(0,0,0,.30)"
      : moles.find((m) => m.id === ans)?.ok
        ? "0 20px 64px rgba(46,204,113,.18)"
        : "0 20px 64px rgba(231,76,60,.18)";

  const visibleIds = new Set(displayMoles.filter((m) => m.displayVisible).map((m) => m.id));

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "min(1540px, 98vw)",
        margin: "0 auto",
        position: "relative",
        animation: "whackUltraEnter .45s ease",
      }}
    >
      <style>{`
        @keyframes whackUltraEnter {
          from { opacity: 0; transform: translateY(18px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes whackBounce {
          0% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0); }
        }

        @keyframes whackRiseInner {
          0% { transform: translateY(110%) scale(.82); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }

        @keyframes whackHideInner {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(110%) scale(.84); opacity: 0; }
        }

        @keyframes whackPulse {
          from { transform: scale(1); }
          to { transform: scale(1.04); }
        }

        @keyframes whackShake {
          0% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }

        @keyframes whackGlowBar {
          from { filter: brightness(1); }
          to { filter: brightness(1.14); }
        }

        @keyframes whackSpark {
          0% {
            opacity: 1;
            transform: translate(0,0) scale(.55) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translate(var(--dx), var(--dy)) scale(1.18) rotate(220deg);
          }
        }

        @keyframes whackWave {
          0% { opacity: 0; transform: scale(.72); }
          20% { opacity: .9; }
          100% { opacity: 0; transform: scale(1.7); }
        }

        @keyframes whackHudFloat {
          from { transform: translateY(0); }
          to { transform: translateY(-4px); }
        }

        @keyframes whackArenaSweep {
          0% { transform: translateX(-110%) skewX(-18deg); opacity: 0; }
          30% { opacity: .7; }
          100% { transform: translateX(220%) skewX(-18deg); opacity: 0; }
        }

        .whack-shell {
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .whack-shake {
          animation: whackShake .46s ease;
        }

        .whack-progress-glow {
          animation: whackGlowBar .85s ease-in-out infinite alternate;
        }

        .whack-pulse {
          animation: whackPulse .8s ease-in-out infinite alternate;
        }

        .whack-floating-chip {
          animation: whackHudFloat 1.2s ease-in-out infinite alternate;
        }

        .whack-hole-btn {
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: transform .2s ease, box-shadow .2s ease, opacity .2s ease, filter .2s ease;
        }

        .whack-hole-btn:hover {
          transform: translateY(-3px) scale(1.01);
        }

        .whack-hole-btn:disabled {
          cursor: default;
        }

        .whack-hole-btn::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.12), transparent);
          opacity: 0;
          pointer-events: none;
        }

        .whack-hole-btn:hover::after {
          animation: whackArenaSweep .9s ease;
          opacity: 1;
        }

        .whack-mole-actor {
          position: absolute;
          left: 50%;
          bottom: 26px;
          width: calc(100% - 28px);
          transform: translateX(-50%);
          display: flex;
          justify-content: center;
          pointer-events: none;
        }

        .whack-mole-inner {
          text-align: center;
          width: 100%;
          max-width: 100%;
        }

        .whack-mole-up .whack-mole-inner {
          animation:
            whackRiseInner ${MOLE_POP_UP_MS}ms ease-out,
            whackBounce 1.45s ease-in-out infinite ${MOLE_POP_UP_MS}ms;
        }

        .whack-mole-idle .whack-mole-inner {
          animation: whackBounce 1.45s ease-in-out infinite;
        }

        .whack-mole-down .whack-mole-inner {
          animation: whackHideInner ${MOLE_HIDE_MS}ms ease-in forwards;
        }

        .whack-spark {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 5px;
          animation: whackSpark .8s ease forwards;
          pointer-events: none;
        }

        .whack-impact {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          pointer-events: none;
          z-index: 7;
        }

        .whack-impact-core {
          width: min(40vw, 320px);
          aspect-ratio: 1;
          border-radius: 50%;
          animation: whackWave .9s ease forwards;
          border: 10px solid rgba(255,255,255,.24);
          box-shadow: 0 0 60px rgba(255,255,255,.15), inset 0 0 26px rgba(255,255,255,.12);
        }

        .whack-label-box {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 11px 16px;
          border-radius: 16px;
          min-width: min(220px, 88%);
          max-width: 90%;
          min-height: 58px;
          text-align: center;
        }

        .whack-label-text {
          display: block;
          width: 100%;
          white-space: normal;
          word-break: normal;
          overflow-wrap: break-word;
          text-wrap: balance;
          line-height: 1.22;
        }

        .whack-speed-btn {
          border: none;
          cursor: pointer;
          transition: transform .18s ease, box-shadow .18s ease, opacity .18s ease;
        }

        .whack-speed-btn:hover {
          transform: translateY(-1px);
        }

        @media (max-width: 1240px) {
          .whack-layout {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 760px) {
          .whack-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .whack-question-title {
            font-size: 28px !important;
          }
          .whack-question-main {
            font-size: 30px !important;
          }
          .whack-hole-btn {
            min-height: 180px !important;
          }
          .whack-label-box {
            min-width: 82% !important;
            max-width: 90% !important;
            min-height: 60px !important;
            padding: 10px 14px !important;
          }
          .whack-label-text {
            font-size: 16px !important;
          }
        }

        @media (max-width: 560px) {
          .whack-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div
        className={`whack-shell ${shakeWrong ? "whack-shake" : ""}`}
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 34,
          padding: 18,
          border: "1px solid rgba(255,255,255,.10)",
          background:
            "radial-gradient(circle at top left, rgba(46,204,113,.12), transparent 24%), radial-gradient(circle at top right, rgba(255,230,109,.10), transparent 22%), linear-gradient(180deg, rgba(18,24,16,.92), rgba(20,16,12,.98))",
          boxShadow: arenaGlow,
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
            background: "rgba(255,230,109,.08)",
            filter: "blur(18px)",
          }}
        />

        {impactBursts.map((item) => (
          <div key={item.id} className="whack-impact">
            <div
              className="whack-impact-core"
              style={{
                background:
                  item.type === "success"
                    ? "radial-gradient(circle, rgba(255,230,109,.35), rgba(46,204,113,.12), transparent 70%)"
                    : item.type === "ring"
                      ? "radial-gradient(circle, rgba(255,255,255,.12), rgba(46,204,113,.06), transparent 70%)"
                      : item.type === "danger"
                        ? "radial-gradient(circle, rgba(255,99,99,.30), rgba(231,76,60,.12), transparent 70%)"
                        : "radial-gradient(circle, rgba(255,255,255,.10), rgba(231,76,60,.08), transparent 70%)",
                borderColor:
                  item.type === "success" || item.type === "ring"
                    ? "rgba(255,245,170,.42)"
                    : "rgba(255,120,120,.38)",
              }}
            />
          </div>
        ))}

        {successWave && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 6,
              background:
                "radial-gradient(circle at center, rgba(255,230,109,.18), rgba(46,204,113,.12), transparent 64%)",
            }}
          />
        )}

        {failWave && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 6,
              background:
                "radial-gradient(circle at center, rgba(255,120,120,.14), rgba(231,76,60,.10), transparent 62%)",
            }}
          />
        )}

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
              className={`whack-floating-chip ${visibleCount > 0 ? "whack-pulse" : ""}`}
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                background: "linear-gradient(135deg,#2ecc71,#f1c40f)",
                color: "#1B1F2A",
                fontSize: 13,
                fontWeight: 900,
                boxShadow: "0 10px 24px rgba(46,204,113,.22)",
              }}
            >
              🔨 {tier}
            </div>

            <div
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                background: correctVisible ? "rgba(46,204,113,.18)" : "rgba(255,255,255,.08)",
                border: `1px solid ${correctVisible ? "rgba(46,204,113,.28)" : "rgba(255,255,255,.08)"}`,
                color: correctVisible ? "#EAFFF3" : "#FFF4BF",
                fontSize: 13,
                fontWeight: 900,
              }}
            >
              🕳️ Açık Delik: {visibleCount}
            </div>

            <div
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,.08)",
                border: "1px solid rgba(255,255,255,.08)",
                color: "#DDFDFC",
                fontSize: 13,
                fontWeight: 900,
              }}
            >
              ⌨️ Hızlı Seçim: 1-4 veya A-D
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
          className="whack-shell"
          style={{
            position: "relative",
            zIndex: 1,
            overflow: "hidden",
            borderRadius: 30,
            padding: 20,
            marginBottom: 18,
            border: "1px solid rgba(255,255,255,.08)",
            background:
              "linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.04))",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "auto -10% -55% auto",
              width: "38%",
              aspectRatio: 1,
              borderRadius: "50%",
              background: "rgba(255,230,109,.11)",
              filter: "blur(26px)",
            }}
          />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                width: "fit-content",
                padding: "10px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,.08)",
                border: "1px solid rgba(255,255,255,.10)",
                color: "#DCEBFF",
                fontSize: 13,
                fontWeight: 900,
              }}
            >
              ❓ Şimdi Vurulacak Soru
            </div>

            <div
              className="whack-question-main"
              style={{
                fontSize: "clamp(34px, 3vw, 52px)",
                lineHeight: 1.18,
                fontWeight: 900,
                color: "#fff",
                textShadow: "0 4px 20px rgba(0,0,0,.26)",
                maxWidth: 1200,
                textWrap: "balance",
              }}
            >
              {q.q}
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: "rgba(46,204,113,.10)",
                  border: "1px solid rgba(46,204,113,.14)",
                  color: "#E8FFF0",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                🎯 Hedef: Doğru cevabın yazdığı köstebeği vur
              </div>
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: "rgba(255,230,109,.10)",
                  border: "1px solid rgba(255,230,109,.14)",
                  color: "#FFF0BE",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                ⚡ Görünür olduğunda hızlı karar ver
              </div>
            </div>
          </div>
        </div>

        <div
          className="whack-layout"
          style={{
            position: "relative",
            zIndex: 1,
            display: "grid",
            gridTemplateColumns: "minmax(320px, 390px) minmax(0, 1fr)",
            gap: 18,
            alignItems: "stretch",
          }}
        >
          <div
            className="whack-shell"
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
              🎮 Görev Merkezi
            </div>

            <div
              style={{
                fontSize: "clamp(28px, 2.2vw, 38px)",
                lineHeight: 1.22,
                fontWeight: 900,
                color: "#fff",
                marginBottom: 16,
              }}
            >
              Ekranda görünen doğru cevabı kaçırmadan vur
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
                  className="whack-progress-glow"
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    borderRadius: 999,
                    transition: "width .35s ease",
                    background: "linear-gradient(90deg,#2ecc71,#f1c40f,#ff9f43)",
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
                  background: correctVisible ? "rgba(46,204,113,.12)" : "rgba(255,255,255,.06)",
                  border: `1px solid ${correctVisible ? "rgba(46,204,113,.18)" : "rgba(255,255,255,.08)"}`,
                  color: "#EEF6FF",
                  fontSize: 15,
                  fontWeight: 800,
                }}
              >
                👀 Sahnede açık köstebek sayısı: {visibleCount}
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 18,
                  background: "rgba(255,255,255,.06)",
                  border: "1px solid rgba(255,255,255,.08)",
                  color: "#EEF6FF",
                  fontSize: 15,
                  fontWeight: 800,
                }}
              >
                ⚡ Doğru cevap görünür görünmez tıkla veya klavyeden seç
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 18,
                  background: "rgba(255,230,109,.08)",
                  border: "1px solid rgba(255,230,109,.12)",
                  color: "#FFF0BE",
                  fontSize: 15,
                  fontWeight: 800,
                }}
              >
                ⏱️ Hız ayarını üstten anında değiştirebilirsin
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 18,
                  background: "rgba(46,204,113,.08)",
                  border: "1px solid rgba(46,204,113,.12)",
                  color: "#E6FFF0",
                  fontSize: 15,
                  fontWeight: 800,
                }}
              >
                🎯 Arena modu: {mood}
              </div>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {displayMoles.map((m, idx) => {
                const visible = visibleIds.has(m.id);
                const isAnswer = correctMole?.id === m.id;
                return (
                  <div
                    key={`side-${m.id}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "38px 1fr auto",
                      gap: 10,
                      alignItems: "center",
                      padding: "12px 12px",
                      borderRadius: 18,
                      background: visible
                        ? isAnswer
                          ? "rgba(46,204,113,.14)"
                          : "rgba(255,255,255,.10)"
                        : "rgba(255,255,255,.05)",
                      border: `1px solid ${
                        visible
                          ? isAnswer
                            ? "rgba(46,204,113,.18)"
                            : "rgba(255,255,255,.12)"
                          : "rgba(255,255,255,.08)"
                      }`,
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        display: "grid",
                        placeItems: "center",
                        background: visible
                          ? "linear-gradient(135deg,#FFE66D,#FF9F43)"
                          : "rgba(255,255,255,.08)",
                        color: visible ? "#1B1F2A" : "#fff",
                        fontWeight: 900,
                        fontSize: 14,
                      }}
                    >
                      {OPTION_BADGES[idx] || idx + 1}
                    </div>
                    <div
                      style={{
                        color: "#F7FBFF",
                        fontSize: 14,
                        fontWeight: 800,
                        lineHeight: 1.3,
                      }}
                    >
                      {m.displayText || cleanLabel(m.t)}
                    </div>
                    <div
                      style={{
                        minWidth: 74,
                        textAlign: "right",
                        color: visible ? "#EAFBF2" : "#B7C7DA",
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      {visible ? "Açık" : "Bekliyor"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="whack-shell"
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
                background: "rgba(46,204,113,.08)",
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
                🐹 Vuruş Arenası
              </div>

              <div
                className="whack-question-title"
                style={{
                  fontSize: "clamp(32px, 2.6vw, 42px)",
                  lineHeight: 1.24,
                  fontWeight: 900,
                  color: "#fff",
                  textShadow: "0 2px 12px rgba(0,0,0,.22)",
                  marginBottom: 10,
                }}
              >
                Doğru seçeneğin yazdığı köstebeği vur
              </div>

              <div
                style={{
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
                    color: "#EAF3FF",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  👁️ Görünen hedef: {visibleCount}
                </div>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 999,
                    background: correctVisible ? "rgba(46,204,113,.12)" : "rgba(255,230,109,.08)",
                    border: `1px solid ${correctVisible ? "rgba(46,204,113,.16)" : "rgba(255,230,109,.12)"}`,
                    color: correctVisible ? "#E8FFF0" : "#FFF0BE",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  {correctVisible ? "✅ Doğru cevap sahnede" : "🎬 Yeni köstebek dalgası geliyor"}
                </div>
              </div>
            </div>

            <div
              className="whack-grid"
              style={{
                position: "relative",
                zIndex: 1,
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 18,
              }}
            >
              {displayMoles.map((m, idx) => {
                const isPicked = ans === m.id;
                const showCorrect = ans !== null && m.ok;
                const wrongPicked = ans !== null && isPicked && !m.ok;
                const canHit = m.displayVisible && ans === null;
                const isAnswerVisible = m.displayVisible && m.displayOk && ans === null;

                return (
                  <button
                    key={m.id}
                    className="whack-hole-btn"
                    disabled={!canHit}
                    onMouseEnter={() => setHovered(m.id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => handleHit(m)}
                    style={{
                      minHeight: 200,
                      borderRadius: 24,
                      padding: 0,
                      border:
                        showCorrect
                          ? "1px solid rgba(46,204,113,.38)"
                          : wrongPicked
                            ? "1px solid rgba(231,76,60,.38)"
                            : isAnswerVisible
                              ? "1px solid rgba(255,230,109,.38)"
                              : "1px solid rgba(139,90,43,.24)",
                      background:
                        "linear-gradient(180deg, rgba(103,58,29,.24), rgba(56,35,20,.40))",
                      boxShadow:
                        hovered === m.id && canHit
                          ? "0 16px 28px rgba(241,196,15,.18)"
                          : isAnswerVisible
                            ? "0 14px 34px rgba(255,230,109,.18)"
                            : "0 12px 24px rgba(0,0,0,.18)",
                      opacity:
                        ans !== null && !showCorrect && !wrongPicked && !m.displayVisible
                          ? 0.75
                          : 1,
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        minHeight: 200,
                        overflow: "hidden",
                        borderRadius: 24,
                        background:
                          "linear-gradient(180deg, rgba(95,156,76,.18), rgba(65,108,54,.11) 34%, transparent 34%)",
                      }}
                    >
                      {isAnswerVisible && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background:
                              "radial-gradient(circle at center, rgba(255,230,109,.16), transparent 62%)",
                          }}
                        />
                      )}

                      <div
                        style={{
                          position: "absolute",
                          inset: "auto 16px 12px 16px",
                          height: 40,
                          borderRadius: "50%",
                          background:
                            showCorrect
                              ? "radial-gradient(circle, rgba(46,204,113,.35), rgba(30,40,20,.95))"
                              : wrongPicked
                                ? "radial-gradient(circle, rgba(231,76,60,.35), rgba(30,20,20,.95))"
                                : "radial-gradient(circle, rgba(40,25,15,.95), rgba(15,10,8,1))",
                          boxShadow: "inset 0 8px 14px rgba(0,0,0,.42)",
                        }}
                      />

                      {m.displayVisible ? (
                        <div
                          className={`whack-mole-actor whack-mole-${m.phase === "hidden" ? "down" : m.phase}`}
                        >
                          <div className="whack-mole-inner">
                            <div
                              style={{
                                fontSize: 62,
                                marginBottom: 8,
                                filter: "drop-shadow(0 10px 12px rgba(0,0,0,.20))",
                                lineHeight: 1,
                              }}
                            >
                              {showCorrect ? "✅" : wrongPicked ? "💥" : isAnswerVisible ? "⭐" : "🐹"}
                            </div>

                            <div
                              className="whack-label-box"
                              style={{
                                background:
                                  showCorrect
                                    ? "rgba(46,204,113,.22)"
                                    : wrongPicked
                                      ? "rgba(231,76,60,.22)"
                                      : isAnswerVisible
                                        ? "rgba(255,230,109,.24)"
                                        : "rgba(255,255,255,.14)",
                                border: "1px solid rgba(255,255,255,.16)",
                                color: "#fff",
                                fontSize: 17,
                                fontWeight: 900,
                                boxShadow: "0 10px 24px rgba(0,0,0,.14)",
                              }}
                            >
                              <span className="whack-label-text">{m.displayText}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "grid",
                            placeItems: "center",
                            color: "rgba(255,255,255,.20)",
                            fontSize: 42,
                          }}
                        >
                          🕳️
                        </div>
                      )}

                      <div
                        style={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          minWidth: 38,
                          height: 34,
                          padding: "0 10px",
                          borderRadius: 999,
                          display: "grid",
                          placeItems: "center",
                          background: "rgba(255,255,255,.10)",
                          border: "1px solid rgba(255,255,255,.08)",
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 900,
                        }}
                      >
                        {OPTION_BADGES[idx] || idx + 1}
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
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                  padding: "6px 8px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,.08)",
                  border: "1px solid rgba(255,255,255,.08)",
                }}
              >
                <span
                  style={{
                    color: "#DDFDFC",
                    fontSize: 12,
                    fontWeight: 900,
                    padding: "0 6px",
                  }}
                >
                  Hız
                </span>

                {Object.entries(SPEED_PRESETS).map(([key, preset]) => {
                  const active = speedKey === key;
                  return (
                    <button
                      key={key}
                      className="whack-speed-btn"
                      onClick={() => setSpeedKey(key)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 999,
                        background: active
                          ? "linear-gradient(135deg,#FFE66D,#FF9F43)"
                          : "rgba(255,255,255,.08)",
                        color: active ? "#1B1F2A" : "#F4F8FF",
                        fontSize: 12,
                        fontWeight: 900,
                        boxShadow: active ? "0 8px 18px rgba(255,159,67,.20)" : "none",
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,.06)",
                  border: "1px solid rgba(255,255,255,.08)",
                  color: "#EAF3FF",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                ⏱️ Çıkış: {MOLE_POP_UP_MS}ms • Kalış: {MOLE_MIN_VISIBLE_MS}ms • İniş: {MOLE_HIDE_MS}ms
              </div>
            </div>

            {burst &&
              sparkles.map((spark) => (
                <span
                  key={spark.id}
                  className="whack-spark"
                  style={{
                    left: `${spark.left}%`,
                    top: `${spark.top}%`,
                    width: spark.size,
                    height: spark.size,
                    background:
                      Number(String(spark.id).split("-").pop()) % 2 === 0
                        ? "linear-gradient(135deg,#FFE66D,#FF9F43)"
                        : "linear-gradient(135deg,#2ecc71,#4ecdc4)",
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
