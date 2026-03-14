function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getStageLabel(matches) {
  if (matches >= 6) return "Mükemmel Hafıza";
  if (matches >= 4) return "Süper Hafıza";
  if (matches >= 2) return "Güçlü Başlangıç";
  return "Kart Avı";
}

function getMoveMood(moves, matches) {
  if (matches >= 6) return "Görev tamamlandı";
  if (moves <= 4 && matches >= 2) return "Keskin hafıza";
  if (moves <= 8) return "İyi tempo";
  if (moves <= 12) return "Dikkatli ilerleme";
  return "Daha iyi odaklan";
}

export default function Memory({ mcs, mfl, mma, mmv, hMem }) {
  const matches = mma?.length || 0;
  const totalPairs = 6;
  const progress = clamp((matches / totalPairs) * 100, 0, 100);
  const stageLabel = getStageLabel(matches);
  const moveMood = getMoveMood(mmv || 0, matches);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "min(1720px, 98vw)",
        margin: "0 auto",
        position: "relative",
        animation: "memoryUltraEnter .45s ease",
      }}
    >
      <style>{`
        @keyframes memoryUltraEnter {
          from { opacity: 0; transform: translateY(18px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes memoryFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
          100% { transform: translateY(0px); }
        }

        @keyframes memoryGlowBar {
          from { filter: brightness(1); }
          to { filter: brightness(1.14); }
        }

        @keyframes memoryPulse {
          from { transform: scale(1); }
          to { transform: scale(1.04); }
        }

        @keyframes memoryMatchGlow {
          0% { box-shadow: 0 0 0 rgba(46,204,113,0); }
          50% { box-shadow: 0 0 30px rgba(46,204,113,.16); }
          100% { box-shadow: 0 0 0 rgba(46,204,113,0); }
        }

        .memory-shell {
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .memory-progress-glow {
          animation: memoryGlowBar .85s ease-in-out infinite alternate;
        }

        .memory-badge-pulse {
          animation: memoryPulse .8s ease-in-out infinite alternate;
        }

        .memory-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(140px, 1fr));
          gap: 18px;
        }

        .memory-card-wrap {
          perspective: 1200px;
          min-width: 0;
        }

        .memory-card {
          position: relative;
          width: 100%;
          min-height: 178px;
          transform-style: preserve-3d;
          transition: transform .45s cubic-bezier(.2,.8,.2,1), filter .2s ease, box-shadow .2s ease;
          cursor: pointer;
        }

        .memory-card:hover {
          filter: brightness(1.05);
        }

        .memory-card.flipped {
          transform: rotateY(180deg);
        }

        .memory-card.matched {
          animation: memoryFloat 2.3s ease-in-out infinite, memoryMatchGlow 2s ease-in-out infinite;
        }

        .memory-face {
          position: absolute;
          inset: 0;
          border-radius: 24px;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 18px 14px;
        }

        .memory-front {
          transform: rotateY(180deg);
        }

        .memory-content-text {
          display: -webkit-box;
          -webkit-line-clamp: 5;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        @media (max-width: 1360px) {
          .memory-layout {
            grid-template-columns: 380px minmax(0, 1fr) !important;
          }
          .memory-grid {
            grid-template-columns: repeat(4, minmax(124px, 1fr)) !important;
            gap: 16px !important;
          }
          .memory-card {
            min-height: 164px !important;
          }
        }

        @media (max-width: 1100px) {
          .memory-layout {
            grid-template-columns: 1fr !important;
          }
          .memory-grid {
            grid-template-columns: repeat(4, minmax(120px, 1fr)) !important;
          }
        }

        @media (max-width: 760px) {
          .memory-grid {
            grid-template-columns: repeat(3, minmax(110px, 1fr)) !important;
            gap: 14px !important;
          }
          .memory-card {
            min-height: 150px !important;
          }
          .memory-title {
            font-size: 24px !important;
          }
        }

        @media (max-width: 560px) {
          .memory-grid {
            grid-template-columns: repeat(2, minmax(120px, 1fr)) !important;
          }
          .memory-card {
            min-height: 142px !important;
          }
        }
      `}</style>

      <div
        className="memory-shell"
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 34,
          padding: 22,
          border: "1px solid rgba(255,255,255,.10)",
          background:
            "radial-gradient(circle at top left, rgba(108,92,231,.18), transparent 24%), radial-gradient(circle at top right, rgba(78,205,196,.14), transparent 20%), linear-gradient(180deg, rgba(9,14,28,.88), rgba(12,18,32,.97))",
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
            background: "rgba(108,92,231,.14)",
            filter: "blur(18px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -70,
            right: -20,
            width: 250,
            height: 250,
            borderRadius: "50%",
            background: "rgba(78,205,196,.10)",
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
                fontSize: 14,
                fontWeight: 900,
              }}
            >
              🧠 MEMORY
            </div>

            <div
              style={{
                padding: "11px 16px",
                borderRadius: 999,
                background: "rgba(255,230,109,.12)",
                border: "1px solid rgba(255,230,109,.18)",
                color: "#FFF4BF",
                fontSize: 14,
                fontWeight: 900,
              }}
            >
              EŞLEŞME {matches}/{totalPairs}
            </div>

            <div
              className={matches >= 2 ? "memory-badge-pulse" : ""}
              style={{
                padding: "11px 16px",
                borderRadius: 999,
                background:
                  matches >= 4
                    ? "linear-gradient(135deg,#FF6B6B,#FFE66D)"
                    : "linear-gradient(135deg,#6C5CE7,#4ECDC4)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 900,
                boxShadow:
                  matches >= 4
                    ? "0 10px 24px rgba(255,107,107,.22)"
                    : "0 10px 24px rgba(108,92,231,.22)",
              }}
            >
              ✨ {stageLabel}
            </div>
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
                padding: "11px 16px",
                borderRadius: 16,
                background: "rgba(255,255,255,.08)",
                border: "1px solid rgba(255,255,255,.08)",
                color: "#F4F8FF",
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              Hamle Sayısı: {mmv}
            </div>

            <div
              style={{
                padding: "11px 16px",
                borderRadius: 16,
                background: "rgba(78,205,196,.10)",
                border: "1px solid rgba(78,205,196,.16)",
                color: "#DDFDFC",
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              {moveMood}
            </div>
          </div>
        </div>

        <div
          className="memory-layout"
          style={{
            position: "relative",
            zIndex: 1,
            display: "grid",
            gridTemplateColumns: "minmax(360px, 430px) minmax(0, 1fr)",
            gap: 22,
            alignItems: "stretch",
          }}
        >
          <div
            className="memory-shell"
            style={{
              borderRadius: 30,
              padding: 22,
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
              🎯 Hafıza Görev Paneli
            </div>

            <div
              className="memory-title"
              style={{
                fontSize: "clamp(28px, 2vw, 42px)",
                lineHeight: 1.22,
                fontWeight: 900,
                color: "#fff",
                marginBottom: 18,
              }}
            >
              Aynı kart çiftlerini bul ve hafıza ustası ol
            </div>

            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                  fontSize: 13,
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
                  className="memory-progress-glow"
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
              }}
            >
              <div
                style={{
                  padding: "13px 15px",
                  borderRadius: 18,
                  background: "rgba(255,255,255,.06)",
                  border: "1px solid rgba(255,255,255,.08)",
                  color: "#EEF6FF",
                  fontSize: 15,
                  fontWeight: 800,
                }}
              >
                👀 Kartların yerini dikkatle hatırla
              </div>

              <div
                style={{
                  padding: "13px 15px",
                  borderRadius: 18,
                  background: "rgba(255,255,255,.06)",
                  border: "1px solid rgba(255,255,255,.08)",
                  color: "#EEF6FF",
                  fontSize: 15,
                  fontWeight: 800,
                }}
              >
                🧩 Soru ve cevap çiftlerini eşleştir
              </div>

              <div
                style={{
                  padding: "13px 15px",
                  borderRadius: 18,
                  background: "rgba(255,230,109,.08)",
                  border: "1px solid rgba(255,230,109,.12)",
                  color: "#FFF0BE",
                  fontSize: 15,
                  fontWeight: 800,
                }}
              >
                ⭐ Az hamleyle bitirirsen daha yüksek ustalık puanı kazanırsın
              </div>

              <div
                style={{
                  padding: "13px 15px",
                  borderRadius: 18,
                  background: "rgba(78,205,196,.08)",
                  border: "1px solid rgba(78,205,196,.12)",
                  color: "#D9FFFB",
                  fontSize: 15,
                  fontWeight: 800,
                }}
              >
                ⚡ Aynı anda en fazla iki kart açık tutarak hızlı düşün
              </div>
            </div>
          </div>

          <div
            className="memory-shell"
            style={{
              borderRadius: 30,
              padding: 24,
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
                width: 150,
                height: 150,
                borderRadius: "50%",
                background: "rgba(255,230,109,.08)",
                filter: "blur(14px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: -40,
                left: -20,
                width: 150,
                height: 150,
                borderRadius: "50%",
                background: "rgba(78,205,196,.08)",
                filter: "blur(14px)",
              }}
            />

            <div
              className="memory-grid"
              style={{
                position: "relative",
                zIndex: 1,
              }}
            >
              {mcs.map((c, i) => {
                const flipped = mfl.includes(i) || c.m;
                const matched = !!c.m;

                return (
                  <div key={c.id} className="memory-card-wrap">
                    <div
                      className={`memory-card ${flipped ? "flipped" : ""} ${matched ? "matched" : ""}`}
                      onClick={() => !matched && hMem(i)}
                      style={{
                        cursor: matched ? "default" : "pointer",
                        filter: matched ? "brightness(1.05)" : "none",
                      }}
                    >
                      <div
                        className="memory-face memory-back"
                        style={{
                          background:
                            "linear-gradient(145deg, rgba(108,92,231,.32), rgba(78,205,196,.16))",
                          border: "2px solid rgba(108,92,231,.24)",
                          boxShadow: "0 16px 34px rgba(108,92,231,.16)",
                        }}
                      >
                        <div style={{ textAlign: "center", maxWidth: "90%" }}>
                          <div
                            style={{
                              fontSize: 36,
                              marginBottom: 10,
                            }}
                          >
                            🧠
                          </div>
                          <div
                            style={{
                              color: "#E9E5FF",
                              fontSize: 14,
                              fontWeight: 900,
                              letterSpacing: ".4px",
                              lineHeight: 1.2,
                            }}
                          >
                            HAFIZA KARTI
                          </div>
                        </div>
                      </div>

                      <div
                        className="memory-face memory-front"
                        style={{
                          background: matched
                            ? "linear-gradient(145deg, rgba(46,204,113,.26), rgba(255,230,109,.12))"
                            : c.t === "q"
                              ? "linear-gradient(145deg, rgba(108,92,231,.18), rgba(255,255,255,.06))"
                              : "linear-gradient(145deg, rgba(78,205,196,.16), rgba(255,255,255,.06))",
                          border: matched
                            ? "2px solid rgba(46,204,113,.34)"
                            : "2px solid rgba(255,255,255,.12)",
                          boxShadow: matched
                            ? "0 16px 34px rgba(46,204,113,.14)"
                            : "0 16px 34px rgba(0,0,0,.14)",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            padding: "6px 10px",
                            borderRadius: 999,
                            background: matched
                              ? "rgba(46,204,113,.18)"
                              : c.t === "q"
                                ? "rgba(108,92,231,.16)"
                                : "rgba(78,205,196,.16)",
                            border: "1px solid rgba(255,255,255,.10)",
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 900,
                          }}
                        >
                          {matched ? "EŞLEŞTİ" : c.t === "q" ? "SORU" : "CEVAP"}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 10,
                            width: "100%",
                            maxWidth: "94%",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 22,
                              lineHeight: 1,
                              opacity: 0.96,
                            }}
                          >
                            {matched ? "✅" : c.t === "q" ? "❓" : "💡"}
                          </div>

                          <div
                            className="memory-content-text"
                            style={{
                              color: "#fff",
                              fontSize: 16,
                              lineHeight: 1.3,
                              fontWeight: 800,
                              textAlign: "center",
                              maxWidth: "100%",
                              textShadow: "0 2px 10px rgba(0,0,0,.16)",
                            }}
                          >
                            {c.x}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                position: "relative",
                zIndex: 1,
                marginTop: 20,
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
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
                🧠 Açık kartlar: {mfl.length}
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
                🎯 Hedef: 6 eşleşme
              </div>

              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: "rgba(108,92,231,.10)",
                  border: "1px solid rgba(108,92,231,.16)",
                  color: "#EEE7FF",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                📌 En iyi oyun: az hamle + yüksek eşleşme
              </div>

              {matches >= 3 && (
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
                  🔥 İyi gidiyorsun
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}