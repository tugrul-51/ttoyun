/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
import { SFX } from "../../../utils/audio";

const SEGMENTS = [
  { points: 50, color1: "#FF6B6B", color2: "#C0392B", label: "Hız", icon: "⚡", mood: "Isınma" },
  { points: 100, color1: "#4ECDC4", color2: "#0077B6", label: "Akıl", icon: "🧠", mood: "Akıllı seçim" },
  { points: 150, color1: "#FFE66D", color2: "#F39C12", label: "Bonus", icon: "✨", mood: "Ekstra şans" },
  { points: 200, color1: "#6C5CE7", color2: "#4C3AC7", label: "Güç", icon: "💪", mood: "Güçlü tur" },
  { points: 250, color1: "#FD79A8", color2: "#D63384", label: "Mega", icon: "🌟", mood: "Parlak ödül" },
  { points: 300, color1: "#00B894", color2: "#008060", label: "Efsane", icon: "👑", mood: "Büyük sahne" },
  { points: 120, color1: "#E17055", color2: "#C44536", label: "Şans", icon: "🍀", mood: "Sürpriz tur" },
  { points: 220, color1: "#0984E3", color2: "#1D4ED8", label: "Usta", icon: "🎯", mood: "Net atış" },
];

const ANSWER_KEYS = ["A", "B", "C", "D"];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getTierLabel(index) {
  const n = (index || 0) + 1;
  if (n >= 10) return "Çark Efsanesi";
  if (n >= 7) return "Şans Kaptanı";
  if (n >= 4) return "Parlak Tur";
  return "Başlangıç Dönüşü";
}

function getRewardLabel(points) {
  if (points >= 300) return "Efsane Ödül";
  if (points >= 250) return "Büyük Ödül";
  if (points >= 180) return "Güçlü Ödül";
  if (points >= 100) return "Orta Ödül";
  return "Mini Ödül";
}

function getStatusText({ swq, ans, correctIndex, points, wheelReveal, spn }) {
  if (spn) return "Çark dönüyor... işaretçi sesiyle birlikte ödül dilimine yaklaşıyorsun 🎡";
  if (wheelReveal) return `${points} puanlık ödül geldi! Sahne açılıyor... ✨`;
  if (!swq) return "Önce çarkı çevir, sonra gelen ödül değerindeki soruyu çöz 🎯";
  if (ans === null) return `${points} puanlık soru aktif. Büyük soru paneline bak ve doğru şıkkı seç ⭐`;
  if (ans === correctIndex) return "Süper! Ödülü başarıyla topladın ve çark turunu kazandın ✅";
  return "Bu tur kaçtı ama sıradaki dönüşte daha parlak bir ödül gelebilir ✨";
}

function createSparkPack(seed, count, palette = ["#FFE66D", "#FD79A8", "#6C5CE7", "#7CF29A"]) {
  return Array.from({ length: count }).map((_, i) => ({
    id: `${seed}-${i}-${Date.now()}`,
    left: 6 + Math.random() * 88,
    top: 10 + Math.random() * 74,
    dx: -120 + Math.random() * 240,
    dy: -110 + Math.random() * 180,
    size: 8 + Math.random() * 14,
    rotate: Math.random() * 320,
    delay: Math.random() * 0.18,
    color: palette[i % palette.length],
  }));
}

function createPegDots() {
  return Array.from({ length: 24 }).map((_, i) => {
    const angle = ((i * 15) - 90) * (Math.PI / 180);
    return {
      id: i,
      x: 198 * Math.cos(angle),
      y: 198 * Math.sin(angle),
    };
  });
}

const PEGS = createPegDots();

export default function Wheel({
  q,
  qi,
  gqs,
  ans,
  hWhlAns,
  swq,
  wa,
  spn,
  wp,
  hWhlSpin,
  wsi,
  wheelReveal,
}) {
  const [hovered, setHovered] = useState(null);
  const [burst, setBurst] = useState(false);
  const [shakeWrong, setShakeWrong] = useState(false);
  const [spinFxOn, setSpinFxOn] = useState(false);
  const [sparkles, setSparkles] = useState([]);
  const [rewardEchoes, setRewardEchoes] = useState([]);
  const [questionPulse, setQuestionPulse] = useState(false);

  useEffect(() => {
    setHovered(null);
    setBurst(false);
    setShakeWrong(false);
    setSpinFxOn(false);
    setSparkles([]);
    setRewardEchoes([]);
    setQuestionPulse(false);
  }, [qi, swq, wheelReveal]);

  useEffect(() => {
    if (!spn) return undefined;
    setSpinFxOn(true);

    let delay = 150;
    let cancelled = false;
    let timer = null;

    const tick = () => {
      if (cancelled) return;
      SFX.spin?.();
      delay = Math.min(delay + 16, 260);
      timer = setTimeout(tick, delay);
    };

    tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      setSpinFxOn(false);
    };
  }, [spn]);

  useEffect(() => {
    if (!wheelReveal) return undefined;
    setRewardEchoes(createSparkPack(`reward-${qi}`, 28, ["#FFF8C4", "#FFE66D", "#FFFFFF", "#9ED7FF"]));
    SFX.reveal?.();

    const pulseTimer = setTimeout(() => setQuestionPulse(true), 760);
    const cleanTimer = setTimeout(() => setRewardEchoes([]), 1300);

    return () => {
      clearTimeout(pulseTimer);
      clearTimeout(cleanTimer);
    };
  }, [wheelReveal, qi]);

  useEffect(() => {
    if (!q || ans === null) return undefined;

    if (ans === q.a) {
      setBurst(true);
      setSparkles(createSparkPack(`ok-${qi}`, 34));
      const clearTimer = setTimeout(() => {
        setBurst(false);
        setSparkles([]);
      }, 1150);
      return () => clearTimeout(clearTimer);
    }

    setShakeWrong(true);
    setSparkles(createSparkPack(`no-${qi}`, 14, ["#FF9A9A", "#FF6B6B", "#FBC2EB"]));
    const clearTimer = setTimeout(() => {
      setShakeWrong(false);
      setSparkles([]);
    }, 720);
    return () => clearTimeout(clearTimer);
  }, [ans, q, qi]);

  function handleSpin() {
    if (spn || wheelReveal) return;
    SFX.whoosh?.();
    hWhlSpin();
  }

  function handleAnswer(index) {
    if (ans !== null) return;
    SFX.click?.();
    hWhlAns(index);
  }

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.repeat) return;
      const tag = event.target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      if (!swq && !spn && !wheelReveal && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        handleSpin();
        return;
      }

      if (swq && ans === null) {
        const key = event.key.toUpperCase();
        const alphaIndex = ANSWER_KEYS.indexOf(key);
        if (alphaIndex >= 0) {
          event.preventDefault();
          handleAnswer(alphaIndex);
          return;
        }

        const num = Number(event.key);
        if (num >= 1 && num <= 4) {
          event.preventDefault();
          handleAnswer(num - 1);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [swq, spn, wheelReveal, ans, handleSpin, handleAnswer]);

  const total = gqs?.length || 1;
  const current = (qi || 0) + 1;
  const progress = clamp((current / total) * 100, 0, 100);
  const points = Number(wp) || 0;
  const tier = getTierLabel(qi || 0);
  const rewardLabel = getRewardLabel(points);
  const correctRatio = total > 0 ? clamp(((qi || 0) / total) * 100, 0, 100) : 0;

  const activeSegment = useMemo(() => {
    if (typeof wsi === "number" && SEGMENTS[wsi]) return SEGMENTS[wsi];
    return SEGMENTS.find((s) => s.points === points) || SEGMENTS[0];
  }, [wsi, points]);

  const statusText = getStatusText({
    swq,
    ans,
    correctIndex: q?.a,
    points,
    wheelReveal,
    spn,
  });

  if (!q && swq) return null;

  const isJackpot = points >= 250;

  return (
    <div
      style={{
        maxWidth: 1420,
        margin: "0 auto",
        position: "relative",
        animation: "wheelUltraEnter .45s ease",
      }}
    >
      <style>{`
        @keyframes wheelUltraEnter {
          from { opacity: 0; transform: translateY(18px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes wheelPulse {
          from { transform: scale(1); }
          to { transform: scale(1.04); }
        }

        @keyframes wheelGlowBar {
          from { filter: brightness(1); }
          to { filter: brightness(1.15); }
        }

        @keyframes wheelShake {
          0% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }

        @keyframes wheelSpark {
          0% { opacity: 1; transform: translate(0,0) scale(.45) rotate(0deg); }
          100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(1.18) rotate(var(--rot)); }
        }

        @keyframes wheelBadgeFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }

        @keyframes wheelRewardPop {
          0% { opacity: 0; transform: translateY(24px) scale(.82); }
          60% { opacity: 1; transform: translateY(0) scale(1.03); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes wheelRewardRing {
          0% { transform: scale(.85); opacity: .9; }
          100% { transform: scale(1.18); opacity: 0; }
        }

        @keyframes wheelPremiumGlow {
          from { box-shadow: 0 20px 60px rgba(0,0,0,.32), 0 0 0 rgba(255,255,255,0); }
          to { box-shadow: 0 20px 60px rgba(0,0,0,.32), 0 0 30px rgba(255,255,255,.12); }
        }

        @keyframes wheelQuestionPulse {
          0% { box-shadow: 0 0 0 rgba(255,230,109,0); }
          100% { box-shadow: 0 0 24px rgba(255,230,109,.18); }
        }

        @keyframes wheelPointerTick {
          0% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.08); }
          100% { transform: translateX(-50%) scale(1); }
        }

        .wheel-shell {
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .wheel-progress-glow {
          animation: wheelGlowBar .85s ease-in-out infinite alternate;
        }

        .wheel-pulse {
          animation: wheelPulse .8s ease-in-out infinite alternate;
        }

        .wheel-float {
          animation: wheelBadgeFloat 2.6s ease-in-out infinite;
        }

        .wheel-shake {
          animation: wheelShake .46s ease;
        }

        .wheel-answer-btn {
          width: 100%;
          cursor: pointer;
          transition: transform .22s ease, box-shadow .22s ease, opacity .22s ease, border-color .22s ease;
        }

        .wheel-answer-btn:hover {
          transform: translateY(-2px) scale(1.01);
        }

        .wheel-answer-btn:disabled {
          cursor: default;
        }

        .wheel-spin-btn {
          cursor: pointer;
          transition: transform .22s ease, box-shadow .22s ease, opacity .22s ease;
        }

        .wheel-spin-btn:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.02);
        }

        .wheel-spark {
          position: absolute;
          border-radius: 999px;
          animation: wheelSpark .84s ease forwards;
          pointer-events: none;
          z-index: 4;
        }

        .wheel-global-reward-overlay {
          position: absolute;
          inset: 0;
          z-index: 60;
          display: grid;
          place-items: center;
          background: rgba(7,10,22,.30);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          pointer-events: none;
        }

        .wheel-reward-card {
          position: relative;
          width: min(92vw, 740px);
          min-height: 320px;
          border-radius: 40px;
          padding: 38px 32px;
          text-align: center;
          color: #fff;
          border: 1px solid rgba(255,255,255,.18);
          box-shadow: 0 28px 70px rgba(0,0,0,.35);
          animation: wheelRewardPop .42s ease forwards, wheelPremiumGlow 1s ease-in-out infinite alternate;
          overflow: hidden;
        }

        .wheel-reward-ring {
          position: absolute;
          inset: 16px;
          border-radius: 34px;
          border: 2px solid rgba(255,255,255,.25);
          animation: wheelRewardRing 1s ease-out infinite;
          pointer-events: none;
        }

        .wheel-question-panel-pulse {
          animation: wheelQuestionPulse .8s ease-in-out infinite alternate;
        }

        .wheel-pointer-active {
          animation: wheelPointerTick .18s ease-in-out infinite;
        }

        @media (max-width: 1320px) {
          .wheel-layout {
            grid-template-columns: 1fr !important;
          }
          .wheel-side-panel {
            order: 2;
          }
          .wheel-main-panel {
            order: 1;
          }
        }

        @media (max-width: 760px) {
          .wheel-answers-grid {
            grid-template-columns: 1fr !important;
          }

          .wheel-question-title {
            font-size: 28px !important;
          }

          .wheel-question-card {
            padding: 18px !important;
          }

          .wheel-svg-wrap {
            width: 300px !important;
            height: 300px !important;
          }

          .wheel-reward-card {
            width: min(94vw, 440px) !important;
            min-height: 250px !important;
            padding: 26px 18px !important;
          }
        }
      `}</style>

      <div
        className={`wheel-shell ${shakeWrong ? "wheel-shake" : ""}`}
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 36,
          padding: 18,
          border: "1px solid rgba(255,255,255,.10)",
          background:
            "radial-gradient(circle at top left, rgba(108,92,231,.18), transparent 24%), radial-gradient(circle at top right, rgba(255,230,109,.14), transparent 20%), linear-gradient(180deg, rgba(11,14,28,.90), rgba(14,18,32,.98))",
          boxShadow: "0 20px 64px rgba(0,0,0,.30)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -60,
            left: -50,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "rgba(108,92,231,.16)",
            filter: "blur(16px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -70,
            right: -20,
            width: 240,
            height: 240,
            borderRadius: "50%",
            background: "rgba(255,230,109,.12)",
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
            marginBottom: 18,
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
              className={spn ? "wheel-pulse" : ""}
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                background: "linear-gradient(135deg,#6C5CE7,#FD79A8)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 900,
                boxShadow: "0 10px 24px rgba(108,92,231,.22)",
              }}
            >
              🎡 {tier}
            </div>

            {(swq || wheelReveal) && (
              <div
                className="wheel-float"
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: `linear-gradient(135deg, ${activeSegment.color1}, ${activeSegment.color2})`,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 900,
                  boxShadow: `0 10px 24px ${activeSegment.color1}44`,
                }}
              >
                {activeSegment.icon} {points} PUAN
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
            className="wheel-layout"
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gridTemplateColumns: "340px minmax(0, 1.25fr)",
              gap: 18,
              alignItems: "stretch",
            }}
          >
            <div
              className="wheel-shell wheel-side-panel"
              style={{
                borderRadius: 30,
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
                🎯 Çark Görev Paneli
              </div>

              <div
                style={{
                  fontSize: "clamp(26px, 2vw, 32px)",
                  lineHeight: 1.28,
                  fontWeight: 900,
                  color: "#fff",
                  marginBottom: 16,
                }}
              >
                Çarkı çevir, büyük ödülü gör, sonra soruyu çöz
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
                    className="wheel-progress-glow"
                    style={{
                      width: `${progress}%`,
                      height: "100%",
                      borderRadius: 999,
                      transition: "width .35s ease",
                      background: "linear-gradient(90deg,#6C5CE7,#FD79A8,#FFE66D)",
                      boxShadow: "0 0 18px rgba(108,92,231,.22)",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
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
                  🔊 Dönüş boyunca işaretçi sesi çalışır
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
                  🪄 Ödül gelince tam ekran sahne açılır
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
                  🎮 Boşluk / Enter ile çarkı çevirebilirsin
                </div>
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                {SEGMENTS.map((seg, i) => {
                  const active = typeof wsi === "number" && wsi === i;
                  return (
                    <div
                      key={`${seg.points}-${seg.label}-${i}`}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 16,
                        background: active
                          ? `linear-gradient(135deg, ${seg.color1}, ${seg.color2})`
                          : "rgba(255,255,255,.05)",
                        border: active
                          ? "1px solid rgba(255,255,255,.34)"
                          : "1px solid rgba(255,255,255,.08)",
                        color: "#F6F7FB",
                        fontSize: 13,
                        fontWeight: 800,
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <span>
                        {seg.icon} {seg.label}
                      </span>
                      <span>{seg.points}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              className="wheel-shell wheel-main-panel"
              style={{
                borderRadius: 30,
                padding: 24,
                border: "1px solid rgba(255,255,255,.08)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))",
                minHeight: 560,
                display: "grid",
                placeItems: "center",
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

              <div
                className="wheel-svg-wrap"
                style={{
                  position: "relative",
                  width: 460,
                  height: 460,
                  marginBottom: 20,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <div
                  className={spinFxOn ? "wheel-pointer-active" : ""}
                  style={{
                    position: "absolute",
                    top: 6,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: 46,
                    zIndex: 12,
                    filter: "drop-shadow(0 6px 10px rgba(0,0,0,.22))",
                  }}
                >
                  🔻
                </div>

                <svg
                  width="430"
                  height="430"
                  viewBox="-220 -220 440 440"
                  style={{
                    transform: `rotate(${wa}deg)`,
                    transition: spn
                      ? "transform 3.5s cubic-bezier(.17,.67,.12,.99)"
                      : "none",
                    filter: "drop-shadow(0 20px 30px rgba(0,0,0,.24))",
                  }}
                >
                  <circle cx="0" cy="0" r="208" fill="rgba(255,255,255,.05)" />
                  {PEGS.map((peg) => (
                    <circle
                      key={peg.id}
                      cx={peg.x}
                      cy={peg.y}
                      r="6"
                      fill="rgba(255,255,255,.88)"
                      opacity="0.85"
                    />
                  ))}

                  {SEGMENTS.map((seg, i) => {
                    const a = i * 45;
                    const r1 = ((a - 90) * Math.PI) / 180;
                    const r2 = ((a + 45 - 90) * Math.PI) / 180;
                    const ta = a + 22.5;
                    const tr = ((ta - 90) * Math.PI) / 180;
                    const radius = 188;
                    const x1 = radius * Math.cos(r1);
                    const y1 = radius * Math.sin(r1);
                    const x2 = radius * Math.cos(r2);
                    const y2 = radius * Math.sin(r2);
                    const tx = 124 * Math.cos(tr);
                    const ty = 124 * Math.sin(tr);
                    const isActive = typeof wsi === "number" && i === wsi && (wheelReveal || swq);

                    return (
                      <g key={i}>
                        <defs>
                          <linearGradient id={`wheelGrad${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={seg.color1} />
                            <stop offset="100%" stopColor={seg.color2} />
                          </linearGradient>
                        </defs>

                        <path
                          d={`M0,0 L${x1},${y1} A${radius},${radius} 0 0,1 ${x2},${y2} Z`}
                          fill={`url(#wheelGrad${i})`}
                          stroke={isActive ? "#FFF7C2" : "#1a1a2e"}
                          strokeWidth={isActive ? "6" : "3"}
                          style={{
                            filter: isActive
                              ? "drop-shadow(0 0 18px rgba(255,230,109,.45))"
                              : "none",
                          }}
                        />

                        <text
                          x={tx}
                          y={ty - 16}
                          fill="#fff"
                          fontWeight="900"
                          fontSize="24"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`rotate(${ta},${tx},${ty - 16})`}
                        >
                          {seg.icon}
                        </text>

                        <text
                          x={tx}
                          y={ty + 12}
                          fill="#fff"
                          fontWeight="1000"
                          fontSize="24"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`rotate(${ta},${tx},${ty + 12})`}
                        >
                          {seg.points}
                        </text>

                        <text
                          x={tx}
                          y={ty + 40}
                          fill="rgba(255,255,255,.94)"
                          fontWeight="800"
                          fontSize="13"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`rotate(${ta},${tx},${ty + 40})`}
                        >
                          {seg.label}
                        </text>
                      </g>
                    );
                  })}

                  <circle cx="0" cy="0" r="42" fill="#1a1a2e" stroke="#FFE66D" strokeWidth="8" />
                  <circle cx="0" cy="0" r="18" fill="#fff" opacity="0.94" />
                </svg>
              </div>

              <div
                style={{
                  marginBottom: 12,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,.08)",
                    border: "1px solid rgba(255,255,255,.08)",
                    color: "#EEF6FF",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  🎯 Her turda yeni ödül değeri
                </div>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,.08)",
                    border: "1px solid rgba(255,255,255,.08)",
                    color: "#EEF6FF",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  🔊 Dönüşte peg tık sesi
                </div>
              </div>

              <button
                className="wheel-spin-btn"
                onClick={handleSpin}
                disabled={spn || wheelReveal}
                style={{
                  padding: "18px 48px",
                  borderRadius: 999,
                  border: "none",
                  background:
                    spn || wheelReveal
                      ? "rgba(255,255,255,.10)"
                      : "linear-gradient(135deg,#FFE66D,#FFA502)",
                  color: "#1B1F2A",
                  fontSize: 22,
                  fontWeight: 900,
                  cursor: spn || wheelReveal ? "default" : "pointer",
                  boxShadow: spn || wheelReveal ? "none" : "0 14px 30px rgba(255,230,109,.22)",
                  opacity: spn || wheelReveal ? 0.72 : 1,
                }}
              >
                {spn ? "🎡 Çevriliyor..." : wheelReveal ? "🏆 Ödül Açılıyor..." : "🎡 ÇARKI ÇEVİR"}
              </button>
            </div>
          </div>
        ) : (
          <div
            className="wheel-layout"
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gridTemplateColumns: "320px minmax(0, 1.25fr)",
              gap: 18,
              alignItems: "stretch",
            }}
          >
            <div
              className="wheel-shell wheel-side-panel"
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
                🏆 Çark Ödülü
              </div>

              <div
                style={{
                  borderRadius: 24,
                  padding: 18,
                  background: `linear-gradient(135deg, ${activeSegment.color1}, ${activeSegment.color2})`,
                  color: "#fff",
                  boxShadow: `0 18px 40px ${activeSegment.color1}55`,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 900,
                    marginBottom: 6,
                    opacity: 0.92,
                  }}
                >
                  GELEN ÖDÜL
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 30 }}>{activeSegment.icon}</span>
                  <div
                    style={{
                      fontSize: 46,
                      fontWeight: 900,
                      lineHeight: 1,
                    }}
                  >
                    {points}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 4,
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                >
                  {rewardLabel} · {activeSegment.label}
                </div>

                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    fontWeight: 800,
                    opacity: 0.92,
                  }}
                >
                  {activeSegment.mood}
                </div>
              </div>

              <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
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
                  🎯 Soruyu doğru cevapla
                </div>

                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 18,
                    background: isJackpot ? "rgba(255,230,109,.12)" : "rgba(255,255,255,.06)",
                    border: isJackpot
                      ? "1px solid rgba(255,230,109,.22)"
                      : "1px solid rgba(255,255,255,.08)",
                    color: isJackpot ? "#FFF3C7" : "#EEF6FF",
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                >
                  ⭐ Bu tur {points} puan değerinde
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
                  ⌨️ 1-4 veya A-D ile cevap verebilirsin
                </div>
              </div>

              <div
                style={{
                  borderRadius: 22,
                  padding: 14,
                  background: "rgba(255,255,255,.05)",
                  border: "1px solid rgba(255,255,255,.08)",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: "#BFD6FF",
                    fontWeight: 900,
                    letterSpacing: ".08em",
                    marginBottom: 8,
                  }}
                >
                  AKIŞ REHBERİ
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ color: "#F7FBFF", fontSize: 13, fontWeight: 800 }}>1. Büyük soru panelini oku</div>
                  <div style={{ color: "#F7FBFF", fontSize: 13, fontWeight: 800 }}>2. Şıkları tek bakışta karşılaştır</div>
                  <div style={{ color: "#F7FBFF", fontSize: 13, fontWeight: 800 }}>3. Ödülü toplamak için doğru seç</div>
                </div>
              </div>
            </div>

            <div
              className="wheel-shell wheel-main-panel"
              style={{
                borderRadius: 30,
                padding: 22,
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

              <div style={{ position: "relative", zIndex: 1, marginBottom: 18 }}>
                <div
                  className={`wheel-question-card ${questionPulse ? "wheel-question-panel-pulse" : ""}`}
                  style={{
                    borderRadius: 28,
                    padding: 22,
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))",
                    border: "1px solid rgba(255,255,255,.10)",
                    boxShadow: "0 12px 34px rgba(0,0,0,.16)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
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
                      🧩 Şimdi cevaplanacak soru
                    </div>

                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: 999,
                        background: `linear-gradient(135deg, ${activeSegment.color1}, ${activeSegment.color2})`,
                        color: "#fff",
                        fontSize: 13,
                        fontWeight: 900,
                      }}
                    >
                      {activeSegment.icon} {rewardLabel}
                    </div>
                  </div>

                  <div
                    className="wheel-question-title"
                    style={{
                      fontSize: "clamp(30px, 2.6vw, 42px)",
                      lineHeight: 1.28,
                      fontWeight: 1000,
                      color: "#fff",
                      textShadow: "0 2px 12px rgba(0,0,0,.22)",
                      maxWidth: 960,
                      maxHeight: 190,
                      overflowY: "auto",
                      paddingRight: 6,
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {q.q}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                    marginTop: 14,
                  }}
                >
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: 18,
                      background: "rgba(255,255,255,.05)",
                      border: "1px solid rgba(255,255,255,.08)",
                      color: "#EEF6FF",
                      fontSize: 14,
                      fontWeight: 800,
                    }}
                  >
                    🎯 Soru cümlesi üst panelde sürekli görünür
                  </div>
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: 18,
                      background: "rgba(255,255,255,.05)",
                      border: "1px solid rgba(255,255,255,.08)",
                      color: "#EEF6FF",
                      fontSize: 14,
                      fontWeight: 800,
                    }}
                  >
                    📌 Her şık büyük kart olarak gösterilir
                  </div>
                </div>
              </div>

              <div
                className="wheel-answers-grid"
                style={{
                  position: "relative",
                  zIndex: 1,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
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
                    : "linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.04))";

                  const border = isAnswered
                    ? isCorrect
                      ? "1px solid rgba(46,204,113,.38)"
                      : isSelected
                      ? "1px solid rgba(231,76,60,.34)"
                      : "1px solid rgba(255,255,255,.06)"
                    : hovered === i
                    ? `1px solid ${activeSegment.color1}`
                    : "1px solid rgba(108,92,231,.18)";

                  return (
                    <button
                      key={i}
                      className="wheel-answer-btn"
                      disabled={isAnswered}
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => handleAnswer(i)}
                      style={{
                        minHeight: 118,
                        borderRadius: 24,
                        border,
                        background: bg,
                        padding: "18px 18px",
                        textAlign: "left",
                        boxShadow:
                          hovered === i && !isAnswered
                            ? `0 14px 28px ${activeSegment.color1}22`
                            : "none",
                        opacity: isAnswered && !isCorrect && !isSelected ? 0.72 : 1,
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
                            width: 50,
                            minWidth: 50,
                            height: 50,
                            borderRadius: 16,
                            display: "grid",
                            placeItems: "center",
                            background: isAnswered
                              ? isCorrect
                                ? "rgba(46,204,113,.22)"
                                : isSelected
                                ? "rgba(231,76,60,.22)"
                                : "rgba(255,255,255,.06)"
                              : `linear-gradient(135deg, ${activeSegment.color1}, ${activeSegment.color2})`,
                            color: "#fff",
                            fontWeight: 1000,
                            fontSize: 18,
                            border: "1px solid rgba(255,255,255,.10)",
                            flexShrink: 0,
                          }}
                        >
                          {ANSWER_KEYS[i] || i + 1}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              color: "#fff",
                              fontSize: 18,
                              lineHeight: 1.45,
                              fontWeight: 900,
                            }}
                          >
                            {opt}
                          </div>

                          <div
                            style={{
                              marginTop: 10,
                              fontSize: 12,
                              fontWeight: 900,
                              color: isAnswered
                                ? isCorrect
                                  ? "#CFF7DE"
                                  : isSelected
                                  ? "#FFD1CC"
                                  : "#AFC8F2"
                                : "#BFD6FF",
                            }}
                          >
                            {isAnswered
                              ? isCorrect
                                ? "✅ Doğru cevap"
                                : isSelected
                                ? "❌ Seçilen cevap"
                                : "·"
                              : `⌨️ ${ANSWER_KEYS[i]} veya ${i + 1}`}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {(burst || sparkles.length > 0) &&
                sparkles.map((spark) => (
                  <span
                    key={spark.id}
                    className="wheel-spark"
                    style={{
                      left: `${spark.left}%`,
                      top: `${spark.top}%`,
                      width: spark.size,
                      height: spark.size,
                      background: spark.color,
                      boxShadow: `0 0 16px ${spark.color}`,
                      "--dx": `${spark.dx}px`,
                      "--dy": `${spark.dy}px`,
                      "--rot": `${spark.rotate}deg`,
                      animationDelay: `${spark.delay}s`,
                    }}
                  />
                ))}
            </div>
          </div>
        )}

        {wheelReveal && (
          <div className="wheel-global-reward-overlay">
            <div
              className="wheel-reward-card"
              style={{
                background: `linear-gradient(135deg, ${activeSegment.color1}, ${activeSegment.color2})`,
              }}
            >
              <div className="wheel-reward-ring" />

              <div
                style={{
                  fontSize: 15,
                  fontWeight: 900,
                  letterSpacing: ".14em",
                  opacity: 0.94,
                  marginBottom: 10,
                }}
              >
                GELEN ÖDÜL
              </div>

              <div style={{ fontSize: 54, marginBottom: 8 }}>{activeSegment.icon}</div>

              <div
                style={{
                  fontSize: "clamp(68px, 10vw, 110px)",
                  fontWeight: 1000,
                  lineHeight: 1,
                  textShadow: "0 8px 24px rgba(0,0,0,.20)",
                }}
              >
                {points}
              </div>

              <div
                style={{
                  marginTop: 12,
                  fontSize: "clamp(22px, 3vw, 30px)",
                  fontWeight: 900,
                }}
              >
                {rewardLabel} · {activeSegment.label}
              </div>

              <div
                style={{
                  marginTop: 14,
                  fontSize: 16,
                  fontWeight: 800,
                  opacity: 0.96,
                }}
              >
                Şimdi bu ödül değerindeki büyük soru paneli geliyor
              </div>

              {isJackpot && (
                <div
                  style={{
                    marginTop: 18,
                    display: "inline-flex",
                    padding: "10px 16px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,.18)",
                    border: "1px solid rgba(255,255,255,.26)",
                    fontSize: 13,
                    fontWeight: 900,
                  }}
                >
                  🔥 Büyük ödül turu açıldı
                </div>
              )}

              {rewardEchoes.map((spark) => (
                <span
                  key={spark.id}
                  className="wheel-spark"
                  style={{
                    left: `${spark.left}%`,
                    top: `${spark.top}%`,
                    width: spark.size,
                    height: spark.size,
                    background: spark.color,
                    boxShadow: `0 0 14px ${spark.color}`,
                    "--dx": `${spark.dx}px`,
                    "--dy": `${spark.dy}px`,
                    "--rot": `${spark.rotate}deg`,
                    animationDelay: `${spark.delay}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div
          style={{
            position: "relative",
            zIndex: 1,
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "1fr minmax(220px, 280px)",
            gap: 14,
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 20,
              background: "rgba(255,255,255,.05)",
              border: "1px solid rgba(255,255,255,.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 8,
              }}
            >
              <div style={{ color: "#DCEBFF", fontSize: 13, fontWeight: 900, letterSpacing: ".08em" }}>
                SAHNE ENERJİSİ
              </div>
              <div style={{ color: "#F7FBFF", fontSize: 13, fontWeight: 900 }}>{Math.round(correctRatio)}% ilerleme hissi</div>
            </div>
            <div
              style={{
                width: "100%",
                height: 10,
                background: "rgba(255,255,255,.08)",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${correctRatio}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${activeSegment.color1}, ${activeSegment.color2})`,
                  boxShadow: `0 0 18px ${activeSegment.color1}55`,
                }}
              />
            </div>
          </div>

          <div
            style={{
              padding: "14px 16px",
              borderRadius: 20,
              background: "rgba(255,255,255,.05)",
              border: "1px solid rgba(255,255,255,.08)",
              color: "#F7FBFF",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            {spn
              ? "🎡 Çark dönerken işaretçi sesleri sahne heyecanını artırır."
              : swq
              ? "🧠 Büyük soru paneli açık. Şimdi gözünü soru cümlesine ve cevap kartlarına ver."
              : "🎯 Boşluk veya Enter ile yeni dönüş başlat."}
          </div>
        </div>
      </div>
    </div>
  );
}
