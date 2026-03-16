/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { SFX } from "../../../utils/audio";

const LETTERS = ["A", "B", "C", "D"];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getTierLabel(index) {
  const n = (index || 0) + 1;
  if (n >= 10) return "Galaksi Şampiyonu";
  if (n >= 7) return "Turbo Pilot";
  if (n >= 4) return "Hızlı Kaşif";
  return "Kalkış Ekibi";
}

function getStatusText(ans, correctIndex) {
  if (ans === null) return "Doğru cevabı seç ve roketini turbo çizgisine fırlat.";
  if (ans === correctIndex) return "Harika seçim! Roketin turbo ile hedefe uçuyor.";
  return "Yanlış rota! Roketin savruldu, tekrar toparlanmak gerek.";
}

function getEnergyLabel(progress) {
  if (progress >= 84) return "Maksimum Turbo";
  if (progress >= 56) return "Hızlı İtiş";
  if (progress >= 28) return "Isınma Turu";
  return "Kalkış Hazırlığı";
}

function getFlightScene(ans, correctIndex) {
  if (ans === null) {
    return {
      rocketLeft: 18,
      rocketBottom: 17,
      rocketRotate: -6,
      rocketScale: 1,
      glow: 0.42,
      thrust: 0.55,
      success: false,
      crash: false,
      finishPulse: 0.42,
      badge: "Hazır",
    };
  }

  if (ans === correctIndex) {
    return {
      rocketLeft: 82,
      rocketBottom: 68,
      rocketRotate: -12,
      rocketScale: 1.16,
      glow: 1,
      thrust: 1,
      success: true,
      crash: false,
      finishPulse: 1,
      badge: "Turbo",
    };
  }

  return {
    rocketLeft: 49,
    rocketBottom: 4,
    rocketRotate: 122,
    rocketScale: 0.94,
    glow: 0.16,
    thrust: 0.18,
    success: false,
    crash: true,
    finishPulse: 0.15,
    badge: "Savruldu",
  };
}

function getRivals(progress, ans, correctIndex) {
  const base = clamp(progress, 6, 94);
  if (ans === correctIndex) {
    return [
      { id: "r1", icon: "🛸", color: "#74F9FF", left: clamp(base + 1, 18, 88), bottom: 56, scale: 0.98 },
      { id: "r2", icon: "🚁", color: "#FFD66D", left: clamp(base - 10, 10, 84), bottom: 39, scale: 0.92 },
      { id: "r3", icon: "🛰️", color: "#A78BFA", left: clamp(base - 18, 8, 80), bottom: 22, scale: 0.88 },
    ];
  }

  if (ans !== null && ans !== correctIndex) {
    return [
      { id: "r1", icon: "🛸", color: "#74F9FF", left: clamp(base + 18, 20, 90), bottom: 56, scale: 1.02 },
      { id: "r2", icon: "🚁", color: "#FFD66D", left: clamp(base + 8, 16, 88), bottom: 39, scale: 0.94 },
      { id: "r3", icon: "🛰️", color: "#A78BFA", left: clamp(base - 4, 10, 82), bottom: 22, scale: 0.88 },
    ];
  }

  return [
    { id: "r1", icon: "🛸", color: "#74F9FF", left: clamp(base + 8, 18, 86), bottom: 56, scale: 0.98 },
    { id: "r2", icon: "🚁", color: "#FFD66D", left: clamp(base - 1, 12, 82), bottom: 39, scale: 0.92 },
    { id: "r3", icon: "🛰️", color: "#A78BFA", left: clamp(base - 11, 8, 78), bottom: 22, scale: 0.88 },
  ];
}

function makeParticles(prefix, palette) {
  return Array.from({ length: 22 }).map((_, i) => ({
    id: `${prefix}-${i}-${Date.now()}`,
    left: 16 + Math.random() * 70,
    top: 10 + Math.random() * 70,
    dx: -100 + Math.random() * 200,
    dy: -110 + Math.random() * 180,
    size: 10 + Math.random() * 16,
    delay: Math.random() * 0.15,
    rotate: -160 + Math.random() * 320,
    bg: palette[i % palette.length],
  }));
}

export default function Race({ q, qi, gqs, ans, hAns }) {
  const [hovered, setHovered] = useState(null);
  const [shakeWrong, setShakeWrong] = useState(false);
  const [particles, setParticles] = useState([]);
  const [impactFlash, setImpactFlash] = useState(null);
  const [speedLines, setSpeedLines] = useState(false);
  const [buttonPulse, setButtonPulse] = useState(null);

  useEffect(() => {
    setHovered(null);
    setShakeWrong(false);
    setParticles([]);
    setImpactFlash(null);
    setSpeedLines(false);
    setButtonPulse(null);
  }, [qi]);

  useEffect(() => {
    if (!q || ans === null) return undefined;

    if (ans === q.a) {
      setImpactFlash("success");
      setSpeedLines(true);
      setParticles(
        makeParticles(`${qi}-success`, [
          "linear-gradient(135deg,#FFE66D,#FFB347)",
          "linear-gradient(135deg,#4ECDC4,#6C5CE7)",
          "linear-gradient(135deg,#9BE15D,#00E3AE)",
        ])
      );
      SFX.rocket?.();
      setTimeout(() => SFX.combo?.(), 70);
      setTimeout(() => SFX.win?.(), 180);

      const t1 = setTimeout(() => setImpactFlash(null), 900);
      const t2 = setTimeout(() => setSpeedLines(false), 1050);
      const t3 = setTimeout(() => setParticles([]), 1100);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }

    setShakeWrong(true);
    setImpactFlash("fail");
    setParticles(
      makeParticles(`${qi}-fail`, [
        "linear-gradient(135deg,#FF8A80,#FF5252)",
        "linear-gradient(135deg,#FFD180,#FF6E40)",
        "linear-gradient(135deg,#F48FB1,#E53935)",
      ])
    );
    SFX.wrong?.();
    setTimeout(() => SFX.explosion?.(), 80);

    const t1 = setTimeout(() => setShakeWrong(false), 520);
    const t2 = setTimeout(() => setImpactFlash(null), 900);
    const t3 = setTimeout(() => setParticles([]), 980);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [ans, q, qi]);

  function handleAnswer(index) {
    if (ans !== null) return;
    setButtonPulse(index);
    SFX.click?.();
    if (index === q.a) {
      setSpeedLines(true);
      setTimeout(() => setSpeedLines(false), 1050);
    }
    hAns(index);
  }


  useEffect(() => {
    if (!q || ans !== null) return undefined;

    const onKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const map = {
        "1": 0,
        "2": 1,
        "3": 2,
        "4": 3,
        a: 0,
        b: 1,
        c: 2,
        d: 3,
      };

      if (Object.prototype.hasOwnProperty.call(map, key)) {
        const next = map[key];
        if (next < (q.o?.length || 0)) {
          event.preventDefault();
          setButtonPulse(next);
          setTimeout(() => setButtonPulse(null), 180);
          handleAnswer(next);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [q, ans]);

  if (!q) return null;

  const total = gqs?.length || 1;
  const current = (qi || 0) + 1;
  const progress = clamp((current / total) * 100, 0, 100);
  const tier = getTierLabel(qi || 0);
  const statusText = getStatusText(ans, q.a);
  const energyLabel = getEnergyLabel(progress);
  const scene = getFlightScene(ans, q.a);
  const rivals = getRivals(progress, ans, q.a);
  const boostLevel = ans === q.a ? 100 : ans === null ? clamp(progress + 18, 24, 82) : 18;
  const speedLevel = ans === q.a ? 96 : ans === null ? clamp(36 + progress * 0.45, 32, 84) : 22;
  const choiceHint = ans === null ? "1-4 veya A-D ile de cevap verebilirsin" : ans === q.a ? "Turbo seçim tamamlandı" : "Roket sarsıldı, sıradaki turda toparlan";

  function getOptionState(index) {
    const isAnswered = ans !== null;
    const isCorrect = index === q.a;
    const isSelected = ans === index;
    const isPulse = buttonPulse === index;

    if (!isAnswered) {
      return {
        border: hovered === index || isPulse ? "1px solid rgba(116,249,255,.34)" : "1px solid rgba(255,255,255,.10)",
        background:
          hovered === index || isPulse
            ? "linear-gradient(180deg, rgba(108,92,231,.30), rgba(78,205,196,.16))"
            : "linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.05))",
        boxShadow:
          hovered === index || isPulse
            ? "0 18px 34px rgba(78,205,196,.18), 0 0 0 2px rgba(116,249,255,.08)"
            : "0 12px 26px rgba(0,0,0,.15)",
        opacity: 1,
      };
    }

    if (isCorrect) {
      return {
        border: "1px solid rgba(46,204,113,.42)",
        background: "linear-gradient(180deg, rgba(46,204,113,.24), rgba(46,204,113,.10))",
        boxShadow: "0 0 0 3px rgba(46,204,113,.08), 0 14px 28px rgba(46,204,113,.16)",
        opacity: 1,
      };
    }

    if (isSelected) {
      return {
        border: "1px solid rgba(231,76,60,.42)",
        background: "linear-gradient(180deg, rgba(231,76,60,.22), rgba(231,76,60,.10))",
        boxShadow: "0 0 0 3px rgba(231,76,60,.08), 0 14px 28px rgba(231,76,60,.16)",
        opacity: 1,
      };
    }

    return {
      border: "1px solid rgba(255,255,255,.06)",
      background: "rgba(255,255,255,.035)",
      boxShadow: "none",
      opacity: 0.72,
    };
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "min(1380px, 98vw)",
        margin: "0 auto",
        position: "relative",
        animation: "raceUltraEnter .45s ease",
      }}
    >
      <style>{`
        @keyframes raceUltraEnter {
          from { opacity: 0; transform: translateY(18px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes raceLaneMove {
          from { transform: translateX(0); }
          to { transform: translateX(-120px); }
        }
        @keyframes raceSpeedLines {
          from { transform: translateX(0); opacity: 0; }
          25% { opacity: .55; }
          to { transform: translateX(-180px); opacity: 0; }
        }
        @keyframes raceRocketIdle {
          0% { transform: translateY(0px) rotate(-6deg); }
          50% { transform: translateY(-8px) rotate(-4deg); }
          100% { transform: translateY(0px) rotate(-6deg); }
        }
        @keyframes raceGlowBar {
          from { filter: brightness(1); }
          to { filter: brightness(1.16); }
        }
        @keyframes raceShake {
          0% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }
        @keyframes raceParticle {
          0% { opacity: 1; transform: translate(0,0) scale(.5) rotate(0deg); }
          100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(1.12) rotate(var(--rot)); }
        }
        @keyframes raceTargetPulse {
          0% { transform: translateX(-50%) scale(1); opacity: .75; }
          50% { transform: translateX(-50%) scale(1.08); opacity: 1; }
          100% { transform: translateX(-50%) scale(1); opacity: .75; }
        }
        @keyframes raceFlashSuccess {
          0% { opacity: 0; transform: scale(.9); }
          25% { opacity: .88; }
          100% { opacity: 0; transform: scale(1.08); }
        }
        @keyframes raceFlashFail {
          0% { opacity: 0; transform: scale(.92); }
          25% { opacity: .82; }
          100% { opacity: 0; transform: scale(1.04); }
        }
        @keyframes racePulseCard {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        .race-shell {
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        .race-shake { animation: raceShake .5s ease; }
        .race-progress-glow { animation: raceGlowBar .85s ease-in-out infinite alternate; }
        .race-rocket-idle { animation: raceRocketIdle 2.2s ease-in-out infinite; }
        .race-answer-btn {
          width: 100%;
          cursor: pointer;
          transition: transform .22s ease, box-shadow .22s ease, opacity .22s ease;
        }
        .race-answer-btn:hover { transform: translateY(-2px) scale(1.01); }
        .race-answer-btn:disabled { cursor: default; }
        .race-track-lane::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: linear-gradient(90deg, rgba(255,255,255,.20) 0 22px, transparent 22px 110px);
          opacity: .18;
          animation: raceLaneMove 2.8s linear infinite;
        }
        .race-speedlines {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }
        .race-speedlines span {
          position: absolute;
          width: 180px;
          height: 2px;
          background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.85), rgba(255,255,255,0));
          animation: raceSpeedLines .72s linear infinite;
        }
        .race-speedlines span:nth-child(1) { top: 16%; left: 55%; animation-delay: .02s; }
        .race-speedlines span:nth-child(2) { top: 28%; left: 60%; animation-delay: .12s; }
        .race-speedlines span:nth-child(3) { top: 42%; left: 58%; animation-delay: .19s; }
        .race-speedlines span:nth-child(4) { top: 56%; left: 62%; animation-delay: .28s; }
        .race-speedlines span:nth-child(5) { top: 70%; left: 57%; animation-delay: .38s; }
        .race-target-pulse { animation: raceTargetPulse 2s ease-in-out infinite; }
        .race-particle {
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
          animation: raceParticle .9s ease forwards;
        }
        .race-impact-success,
        .race-impact-fail {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          z-index: 7;
          mix-blend-mode: screen;
        }
        .race-impact-success {
          background: radial-gradient(circle at 50% 45%, rgba(110,255,189,.58), rgba(110,255,189,.08) 38%, transparent 68%);
          animation: raceFlashSuccess .9s ease forwards;
        }
        .race-impact-fail {
          background: radial-gradient(circle at 50% 62%, rgba(255,120,100,.52), rgba(255,120,100,.08) 40%, transparent 70%);
          animation: raceFlashFail .9s ease forwards;
        }
        .race-question-panel {
          animation: racePulseCard 3.2s ease-in-out infinite;
        }
        @media (max-width: 1200px) {
          .race-layout { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 760px) {
          .race-grid { grid-template-columns: 1fr !important; }
          .race-question-title { font-size: 26px !important; }
          .race-track { min-height: 330px !important; }
          .race-topbar { gap: 10px !important; }
        }
      `}</style>

      <div
        className={`race-shell ${shakeWrong ? "race-shake" : ""}`}
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 34,
          padding: 18,
          border: "1px solid rgba(255,255,255,.10)",
          background:
            "radial-gradient(circle at top left, rgba(78,205,196,.16), transparent 24%), radial-gradient(circle at top right, rgba(108,92,231,.16), transparent 22%), linear-gradient(180deg, rgba(8,12,26,.90), rgba(11,18,32,.98))",
          boxShadow: "0 24px 72px rgba(0,0,0,.32)",
        }}
      >
        {impactFlash === "success" && <div className="race-impact-success" />}
        {impactFlash === "fail" && <div className="race-impact-fail" />}

        <div
          style={{
            position: "absolute",
            top: -62,
            left: -50,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(108,92,231,.12)",
            filter: "blur(18px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            right: -26,
            width: 240,
            height: 240,
            borderRadius: "50%",
            background: "rgba(78,205,196,.10)",
            filter: "blur(18px)",
          }}
        />

        <div
          className="race-topbar"
          style={{
            position: "relative",
            zIndex: 2,
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
              ETAP {current}/{total}
            </div>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                background: "linear-gradient(135deg,#6C5CE7,#4ECDC4)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 900,
                boxShadow: "0 10px 24px rgba(108,92,231,.22)",
              }}
            >
              🚀 {tier}
            </div>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                background:
                  ans === null
                    ? "rgba(255,230,109,.12)"
                    : ans === q.a
                      ? "rgba(46,204,113,.12)"
                      : "rgba(231,76,60,.12)",
                border:
                  ans === null
                    ? "1px solid rgba(255,230,109,.18)"
                    : ans === q.a
                      ? "1px solid rgba(46,204,113,.18)"
                      : "1px solid rgba(231,76,60,.18)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 900,
              }}
            >
              ⚡ {scene.badge}
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
              maxWidth: 460,
            }}
          >
            {statusText}
          </div>
        </div>

        <div
          className="race-question-panel"
          style={{
            position: "relative",
            zIndex: 2,
            borderRadius: 30,
            padding: "20px 22px",
            border: "1px solid rgba(116,249,255,.18)",
            background:
              "linear-gradient(180deg, rgba(116,249,255,.08), rgba(108,92,231,.10) 55%, rgba(255,255,255,.04))",
            boxShadow: "0 18px 40px rgba(0,0,0,.20), inset 0 1px 0 rgba(255,255,255,.05)",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 999,
              background: "rgba(255,255,255,.08)",
              border: "1px solid rgba(255,255,255,.08)",
              color: "#DCEBFF",
              fontSize: 13,
              fontWeight: 900,
              marginBottom: 14,
            }}
          >
            🏁 ŞİMDİ CEVAPLANACAK SORU
          </div>

          <div
            className="race-question-title"
            style={{
              fontSize: "clamp(30px, 3vw, 40px)",
              lineHeight: 1.28,
              fontWeight: 900,
              color: "#fff",
              textShadow: "0 3px 18px rgba(0,0,0,.24)",
              wordBreak: "break-word",
              overflowWrap: "anywhere",
              marginBottom: 14,
            }}
          >
            {q.q}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: 12,
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
              🚦 Hız Durumu: {energyLabel}
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
              ⌨️ {choiceHint}
            </div>
          </div>
        </div>

        <div
          className="race-layout"
          style={{
            position: "relative",
            zIndex: 2,
            display: "grid",
            gridTemplateColumns: "320px 1fr",
            gap: 18,
            alignItems: "stretch",
          }}
        >
          <div
            className="race-shell"
            style={{
              borderRadius: 30,
              padding: 18,
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
                marginBottom: 14,
              }}
            >
              🛰️ Yarış Kontrol Paneli
            </div>

            <div
              style={{
                fontSize: "clamp(24px, 2.2vw, 32px)",
                lineHeight: 1.28,
                fontWeight: 900,
                color: "#fff",
                marginBottom: 16,
              }}
            >
              Doğru cevap roketi ileri taşır, yanlış cevap savurur.
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
                <span>Galaksi Parkuru</span>
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
                  className="race-progress-glow"
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

            <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 18,
                  background: "rgba(255,255,255,.06)",
                  border: "1px solid rgba(255,255,255,.08)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, color: "#F5FBFF", fontSize: 13, fontWeight: 900 }}>
                  <span>Turbo Deposu</span>
                  <span>%{Math.round(boostLevel)}</span>
                </div>
                <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
                  <div style={{ width: `${boostLevel}%`, height: "100%", background: "linear-gradient(90deg,#FFE66D,#FF9F43)", borderRadius: 999, transition: "width .4s ease" }} />
                </div>
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 18,
                  background: "rgba(255,255,255,.06)",
                  border: "1px solid rgba(255,255,255,.08)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, color: "#F5FBFF", fontSize: 13, fontWeight: 900 }}>
                  <span>Hız Göstergesi</span>
                  <span>{Math.round(speedLevel)} km/s</span>
                </div>
                <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
                  <div style={{ width: `${speedLevel}%`, height: "100%", background: "linear-gradient(90deg,#74F9FF,#4ECDC4)", borderRadius: 999, transition: "width .4s ease" }} />
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ padding: "12px 14px", borderRadius: 18, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)", color: "#EEF6FF", fontSize: 14, fontWeight: 800 }}>
                🟢 Doğru cevap = turbo çizgisi + hedefe sıçrama
              </div>
              <div style={{ padding: "12px 14px", borderRadius: 18, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)", color: "#EEF6FF", fontSize: 14, fontWeight: 800 }}>
                🔴 Yanlış cevap = savrulma + hız kaybı
              </div>
              <div style={{ padding: "12px 14px", borderRadius: 18, background: "rgba(255,230,109,.08)", border: "1px solid rgba(255,230,109,.12)", color: "#FFF0BE", fontSize: 14, fontWeight: 800 }}>
                🧒 Büyük soru paneli sayesinde oyuncu soruyu aramaz
              </div>
            </div>
          </div>

          <div
            className="race-shell"
            style={{
              borderRadius: 30,
              padding: 20,
              border: "1px solid rgba(255,255,255,.08)",
              background: "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -44,
                right: -32,
                width: 124,
                height: 124,
                borderRadius: "50%",
                background: "rgba(255,230,109,.08)",
                filter: "blur(12px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: -42,
                left: -18,
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: "rgba(78,205,196,.08)",
                filter: "blur(12px)",
              }}
            />

            <div style={{ position: "relative", zIndex: 1, marginBottom: 18 }}>
              <div
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
                  🌌 Uzay Yarışı
                </div>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,.06)",
                    border: "1px solid rgba(255,255,255,.08)",
                    color: "#F4F8FF",
                    fontSize: 13,
                    fontWeight: 900,
                  }}
                >
                  {ans === null ? "Turbo pedleri hazır" : ans === q.a ? "Bitiş çizgisine sıçrama" : "Denge kaybı algılandı"}
                </div>
              </div>

              <div
                className="race-track"
                style={{
                  minHeight: 360,
                  borderRadius: 26,
                  border: "1px solid rgba(255,255,255,.10)",
                  background: "linear-gradient(180deg, rgba(5,8,18,.92), rgba(10,18,34,.98))",
                  padding: "18px 18px 16px",
                  position: "relative",
                  overflow: "hidden",
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "radial-gradient(circle at 50% 10%, rgba(255,255,255,.08), transparent 18%), radial-gradient(circle at 80% 28%, rgba(255,255,255,.05), transparent 12%), radial-gradient(circle at 15% 40%, rgba(255,255,255,.04), transparent 10%)",
                    pointerEvents: "none",
                  }}
                />

                {speedLines && (
                  <div className="race-speedlines">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                )}

                {[0, 1, 2].map((lane) => (
                  <div
                    key={`lane-${lane}`}
                    className="race-track-lane"
                    style={{
                      position: "absolute",
                      left: 18,
                      right: 18,
                      top: 34 + lane * 92,
                      height: 64,
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,.08)",
                      background: "linear-gradient(90deg, rgba(255,255,255,.04), rgba(255,255,255,.02))",
                      overflow: "hidden",
                    }}
                  />
                ))}

                {[28, 52, 76].map((left, idx) => (
                  <div
                    key={`boost-${left}`}
                    style={{
                      position: "absolute",
                      left: `${left}%`,
                      top: 56 + (idx % 2) * 94,
                      transform: "translateX(-50%)",
                      width: 34,
                      height: 12,
                      borderRadius: 999,
                      background: "linear-gradient(90deg,#74F9FF,#4ECDC4)",
                      boxShadow: "0 0 14px rgba(116,249,255,.32)",
                      opacity: ans === q.a ? 1 : 0.68,
                    }}
                  />
                ))}

                <div
                  className="race-target-pulse"
                  style={{
                    position: "absolute",
                    left: "86%",
                    top: 16,
                    width: 114,
                    height: 114,
                    transform: "translateX(-50%)",
                    borderRadius: "50%",
                    background: `radial-gradient(circle, rgba(255,230,109,${scene.finishPulse}) 0%, rgba(255,159,67,.28) 28%, rgba(255,255,255,.02) 70%)`,
                    filter: "blur(0.4px)",
                    boxShadow: `0 0 38px rgba(255,230,109,${scene.finishPulse * 0.45})`,
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    left: "88%",
                    top: 22,
                    bottom: 18,
                    width: 18,
                    transform: "translateX(-50%)",
                    borderRadius: 18,
                    background:
                      "repeating-linear-gradient(180deg, rgba(255,255,255,.96) 0 14px, rgba(20,20,24,.94) 14px 28px)",
                    boxShadow: "0 0 16px rgba(255,255,255,.12)",
                    opacity: .92,
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    left: "86%",
                    top: 44,
                    transform: "translateX(-50%)",
                    display: "grid",
                    placeItems: "center",
                    width: 78,
                    height: 78,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(255,230,109,.22), rgba(255,255,255,.08))",
                    border: "1px solid rgba(255,230,109,.28)",
                    boxShadow: "0 0 18px rgba(255,230,109,.18)",
                    color: "#FFF5CF",
                    fontSize: 28,
                    fontWeight: 900,
                  }}
                >
                  🏁
                </div>

                <div
                  style={{
                    position: "absolute",
                    left: 28,
                    right: 28,
                    bottom: 18,
                    height: 26,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(35,26,18,.88), rgba(10,8,8,1))",
                    boxShadow: "inset 0 8px 18px rgba(0,0,0,.44)",
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    left: "14%",
                    bottom: 18,
                    transform: "translateX(-50%)",
                    color: "#CFE2FF",
                    fontSize: 12,
                    fontWeight: 900,
                    opacity: 0.95,
                  }}
                >
                  START
                </div>

                <div
                  style={{
                    position: "absolute",
                    left: "88%",
                    top: 120,
                    transform: "translateX(-50%)",
                    color: "#FFF5CF",
                    fontSize: 12,
                    fontWeight: 900,
                    opacity: 0.95,
                  }}
                >
                  FINISH
                </div>

                {rivals.map((rival) => (
                  <div
                    key={rival.id}
                    style={{
                      position: "absolute",
                      left: `${rival.left}%`,
                      bottom: `${rival.bottom}%`,
                      transform: `translateX(-50%) scale(${rival.scale})`,
                      transition: "left .8s ease, bottom .8s ease, transform .6s ease",
                      zIndex: 2,
                      filter: `drop-shadow(0 10px 18px ${rival.color}33)`,
                    }}
                  >
                    <div style={{ fontSize: 34, lineHeight: 1 }}>{rival.icon}</div>
                  </div>
                ))}

                <div
                  style={{
                    position: "absolute",
                    left: `${scene.rocketLeft}%`,
                    bottom: `${scene.rocketBottom}%`,
                    transform: `translateX(-50%) rotate(${scene.rocketRotate}deg) scale(${scene.rocketScale})`,
                    transition:
                      ans === null
                        ? "left .35s ease, bottom .35s ease, transform .35s ease"
                        : ans === q.a
                          ? "left .92s cubic-bezier(.2,.8,.2,1), bottom .92s cubic-bezier(.2,.8,.2,1), transform .8s ease"
                          : "left .74s ease, bottom .9s cubic-bezier(.35,.02,.8,.2), transform .78s ease",
                    zIndex: 4,
                    filter:
                      ans === q.a
                        ? "drop-shadow(0 18px 24px rgba(46,204,113,.26))"
                        : scene.crash
                          ? "drop-shadow(0 16px 22px rgba(231,76,60,.24))"
                          : "drop-shadow(0 14px 20px rgba(78,205,196,.22))",
                  }}
                  className={ans === null ? "race-rocket-idle" : ""}
                >
                  <div style={{ fontSize: 58, lineHeight: 1 }}>🚀</div>
                </div>

                <div
                  style={{
                    position: "absolute",
                    left: `${scene.rocketLeft - 6}%`,
                    bottom: `${Math.max(scene.rocketBottom - 1, 4)}%`,
                    transform: "translateX(-50%)",
                    transition:
                      ans === null
                        ? "left .35s ease, bottom .35s ease, opacity .35s ease"
                        : "left .9s ease, bottom .9s ease, opacity .4s ease",
                    opacity: scene.thrust,
                    zIndex: 3,
                    fontSize: ans === q.a ? 24 : ans === null ? 18 : 14,
                    letterSpacing: "2px",
                  }}
                >
                  {ans === q.a ? "✨🔥✨" : ans === null ? "✨✨" : "💨"}
                </div>

                {scene.crash && (
                  <div
                    style={{
                      position: "absolute",
                      left: `${scene.rocketLeft}%`,
                      bottom: "7%",
                      transform: "translateX(-50%)",
                      width: 90,
                      height: 90,
                      borderRadius: "50%",
                      border: "6px solid rgba(255,120,100,.58)",
                      zIndex: 1,
                    }}
                  />
                )}

                <div
                  style={{
                    position: "absolute",
                    right: 18,
                    bottom: 18,
                    display: "grid",
                    gap: 8,
                    zIndex: 5,
                  }}
                >
                  <div style={{ padding: "8px 12px", borderRadius: 14, background: "rgba(8,16,28,.82)", border: "1px solid rgba(255,255,255,.08)", color: "#F6FBFF", fontSize: 12, fontWeight: 900 }}>
                    🏎️ Rakipler görünür: yarış hissi güçlendi
                  </div>
                  <div style={{ padding: "8px 12px", borderRadius: 14, background: "rgba(8,16,28,.82)", border: "1px solid rgba(255,255,255,.08)", color: "#F6FBFF", fontSize: 12, fontWeight: 900 }}>
                    {ans === q.a ? "🌟 Turbo çizgisi aşıldı" : ans === null ? "💫 Boost pedlerini hedefle" : "🧯 Roketi toparla"}
                  </div>
                </div>
              </div>
            </div>

            <div
              className="race-grid"
              style={{
                position: "relative",
                zIndex: 1,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
              }}
            >
              {q.o.map((opt, i) => {
                const state = getOptionState(i);
                const isCorrect = ans !== null && i === q.a;
                const isSelected = ans === i;
                return (
                  <button
                    key={i}
                    className="race-answer-btn"
                    disabled={ans !== null}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => handleAnswer(i)}
                    style={{
                      minHeight: 108,
                      borderRadius: 24,
                      padding: "18px 18px",
                      textAlign: "left",
                      ...state,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div
                        style={{
                          width: 44,
                          minWidth: 44,
                          height: 44,
                          borderRadius: 14,
                          display: "grid",
                          placeItems: "center",
                          background:
                            ans !== null && i === q.a
                              ? "linear-gradient(135deg,#2ecc71,#27ae60)"
                              : ans !== null && ans === i && i !== q.a
                                ? "linear-gradient(135deg,#ff7675,#e74c3c)"
                                : "linear-gradient(135deg,#6C5CE7,#4ECDC4)",
                          color: "#fff",
                          fontWeight: 900,
                          fontSize: 16,
                          border: "1px solid rgba(255,255,255,.10)",
                          flexShrink: 0,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)",
                        }}
                      >
                        {LETTERS[i]}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ color: "#fff", fontSize: 17, lineHeight: 1.45, fontWeight: 800 }}>{opt}</div>
                        <div style={{ marginTop: 8, fontSize: 12, fontWeight: 900, color: "#CFE2FF" }}>
                          {ans === null ? "Seç ve roketi hareket ettir" : isCorrect ? "✅ Roketi bitişe götüren cevap" : isSelected ? "❌ Roketi savuran seçim" : "·"}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {particles.map((particle) => (
              <span
                key={particle.id}
                className="race-particle"
                style={{
                  left: `${particle.left}%`,
                  top: `${particle.top}%`,
                  width: particle.size,
                  height: particle.size,
                  background: particle.bg,
                  "--dx": `${particle.dx}px`,
                  "--dy": `${particle.dy}px`,
                  "--rot": `${particle.rotate}deg`,
                  animationDelay: `${particle.delay}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
