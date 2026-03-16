/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react';
import { SFX } from '../../../utils/audio';
import PremiumIntro from '../PremiumIntro';

const LETTERS = ['A', 'B', 'C', 'D'];
const CHESTS = ['🧰', '💎', '🪙', '🗝️', '📜', '🏺'];
const KEY_LOOKUP = { a: 0, b: 1, c: 2, d: 3 };

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function makeBurst(prefix, count, palette) {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i}-${Math.random().toString(36).slice(2, 8)}`,
    left: 6 + Math.random() * 88,
    top: 8 + Math.random() * 78,
    dx: -100 + Math.random() * 200,
    dy: -70 + Math.random() * 160,
    size: 10 + Math.random() * 28,
    rotate: Math.random() * 360,
    color: palette[Math.floor(Math.random() * palette.length)],
    duration: 0.8 + Math.random() * 0.7,
    emoji: Math.random() > 0.5 ? '✨' : '💎',
  }));
}

function makeBubbleTrail(prefix, count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-bubble-${i}-${Math.random().toString(36).slice(2, 8)}`,
    left: 10 + Math.random() * 80,
    delay: Math.random() * 0.8,
    duration: 2 + Math.random() * 1.5,
    size: 18 + Math.random() * 32,
    opacity: 0.1 + Math.random() * 0.18,
  }));
}

export default function Treasure({ q, qi, gqs, ans, hAns }) {
  const [hovered, setHovered] = useState(null);
  const [sparkles, setSparkles] = useState([]);
  const [burst, setBurst] = useState([]);
  const [answerGlow, setAnswerGlow] = useState(null);
  const [waveMode, setWaveMode] = useState('idle');
  const [bubbleTrail, setBubbleTrail] = useState(() => makeBubbleTrail('init', 8));

  useEffect(() => {
    setHovered(null);
    setSparkles([]);
    setBurst([]);
    setAnswerGlow(null);
    setWaveMode('idle');
    setBubbleTrail(makeBubbleTrail(`trail-${qi}`, 8));
  }, [qi]);

  useEffect(() => {
    if (!q || ans === null) return;

    if (ans === q.a) {
      const sparkleItems = Array.from({ length: 18 }, (_, i) => ({
        id: `${qi}-spark-${i}`,
        left: 12 + Math.random() * 76,
        top: 16 + Math.random() * 56,
        dx: -80 + Math.random() * 160,
        dy: -50 + Math.random() * 110,
      }));
      setSparkles(sparkleItems);
      setBurst(makeBurst(`correct-${qi}`, 18, ['#FFE66D', '#FFD166', '#F59E0B', '#FFF7CC']));
      setAnswerGlow('correct');
      setWaveMode('correct');
      SFX.successTreasure?.();
      SFX.treasureChest?.();
      const t = setTimeout(() => {
        setSparkles([]);
        setBurst([]);
        setAnswerGlow(null);
      }, 1200);
      return () => clearTimeout(t);
    }

    setBurst(makeBurst(`wrong-${qi}`, 14, ['#FF7B7B', '#FFB4A2', '#FFD6D6', '#FF9F68']));
    setAnswerGlow('wrong');
    setWaveMode('wrong');
    SFX.treasureWrong?.();
    const t = setTimeout(() => {
      setBurst([]);
      setAnswerGlow(null);
    }, 1100);
    return () => clearTimeout(t);
  }, [ans, q, qi]);

  useEffect(() => {
    if (!q || ans !== null) return undefined;

    const onKeyDown = (event) => {
      if (event.repeat) return;
      const key = event.key.toLowerCase();
      if (key in KEY_LOOKUP && typeof hAns === 'function') {
        hAns(KEY_LOOKUP[key]);
        return;
      }
      const number = Number(event.key);
      if (number >= 1 && number <= 4 && typeof hAns === 'function') {
        hAns(number - 1);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [ans, hAns, q]);

  const total = gqs?.length || 1;
  const progress = clamp(((qi + 1) / total) * 100, 0, 100);
  const treasureProgress = clamp((qi / Math.max(1, total - 1)) * 100, 0, 100);

  const status = ans === null
    ? 'Haritayı takip et, en güvenilir ipucunu seç ve sandığa giden yolu bul.'
    : ans === q.a
      ? 'Harika! Doğru ipucuyla rotayı tamamladın ve hazine sandığını açtın.'
      : 'Bu ipucu yanıltıcıydı. Harita sallandı ama yeni sandık turunda tekrar deneyebilirsin.';

  const clueCards = useMemo(() => q.o.map((option, index) => ({
    index,
    option,
    correct: index === q.a,
    state: ans === null ? 'idle' : index === q.a ? 'correct' : ans === index ? 'wrong' : 'muted',
  })), [ans, q]);

  if (!q) return null;

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', animation: 'treasureEnter .45s ease' }}>
      <style>{`
        @keyframes treasureEnter { from {opacity:0; transform: translateY(16px) scale(.985);} to {opacity:1; transform: translateY(0) scale(1);} }
        @keyframes treasureFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes treasureCompass { 0%,100%{transform:rotate(-7deg)} 50%{transform:rotate(7deg)} }
        @keyframes treasureSpark { from { opacity:1; transform:translate(0,0) scale(.4) rotate(0deg);} to { opacity:0; transform:translate(var(--dx), var(--dy)) scale(1.2) rotate(220deg);} }
        @keyframes treasureWave { from { background-position:0% 50%; } to { background-position:100% 50%; } }
        @keyframes treasureGlow { 0%,100% { box-shadow: 0 0 0 rgba(245,158,11,0); } 50% { box-shadow: 0 0 0 10px rgba(245,158,11,.12); } }
        @keyframes treasureBurst { from { opacity: 1; transform: translate(0,0) scale(.4) rotate(0deg); } to { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(1.25) rotate(var(--rot)); } }
        @keyframes treasureBubble { 0% { transform: translateY(12px) scale(.7); opacity: 0; } 15% { opacity: var(--op); } 100% { transform: translateY(-160px) scale(1.15); opacity: 0; } }
        @keyframes treasureFlash { 0% { opacity: 0; } 18% { opacity: .92; } 100% { opacity: 0; } }
        @keyframes treasureWrongFlash { 0% { opacity: 0; } 16% { opacity: .85; } 100% { opacity: 0; } }
        @keyframes treasureMarker { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes treasurePulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.03)} }
        @media (max-width: 1240px) {
          .treasure-layout { grid-template-columns: 1fr !important; }
          .treasure-answer-grid { grid-template-columns: 1fr !important; }
          .treasure-clue-strip { grid-template-columns: repeat(3, minmax(0,1fr)) !important; }
        }
        @media (max-width: 720px) {
          .treasure-clue-strip { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
          .treasure-question-text { font-size: 28px !important; }
          .treasure-stage-title { font-size: 26px !important; }
          .treasure-answer-grid button { min-height: 136px !important; }
        }
      `}</style>

      <PremiumIntro
        questionKey={qi}
        title="Hazine Avı"
        subtitle="Parlayan sandık görevi"
        mascot="🧭"
        accent="#F59E0B"
        accent2="#FFE66D"
        onIntro={() => SFX.introTreasure?.()}
        introLine="Kaptan Pusula diyor ki: doğru ipucunu bul, sandığı birlikte açalım!"
        successLine="Altın kıvılcımlar geldi, sandık açılıyor!"
        failureLine="Bu rota çıkmaz sokak oldu ama yeni ipucu seni bekliyor."
        answerState={ans === null ? 'idle' : ans === q.a ? 'correct' : 'wrong'}
      />

      <div
        style={{
          marginBottom: 18,
          borderRadius: 30,
          padding: '18px 20px 22px',
          background: 'linear-gradient(135deg, rgba(255,232,163,.18), rgba(245,158,11,.16), rgba(107,79,26,.16))',
          border: '1px solid rgba(255,255,255,.14)',
          boxShadow: '0 20px 48px rgba(0,0,0,.16)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 0% 50%, rgba(255,255,255,.18), transparent 28%), radial-gradient(circle at 100% 0%, rgba(255,214,102,.24), transparent 30%)' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 560px' }}>
            <div style={{ fontSize: 13, fontWeight: 1000, color: '#FFF0B8', textTransform: 'uppercase', letterSpacing: '.11em', marginBottom: 8 }}>
              Görev sorusu · ilk bakışta görülecek alan
            </div>
            <div className="treasure-question-text" style={{ fontSize: 36, lineHeight: 1.16, fontWeight: 1000, color: '#fff', textShadow: '0 4px 16px rgba(0,0,0,.22)' }}>
              {q.q}
            </div>
            <div style={{ marginTop: 12, color: 'rgba(255,248,231,.9)', fontWeight: 700, lineHeight: 1.5 }}>
              Önce bu soruya odaklan. Sonra aşağıdaki ipuçlarından en doğru rotayı seç ve sandığa ulaş.
            </div>
          </div>
          <div style={{ display: 'grid', gap: 10, minWidth: 220 }}>
            <div style={{ padding: '10px 14px', borderRadius: 999, background: 'rgba(0,0,0,.18)', color: '#FFF6D1', fontWeight: 900, textAlign: 'center' }}>
              Adım {(qi || 0) + 1} / {total}
            </div>
            <div style={{ padding: '10px 14px', borderRadius: 18, background: 'rgba(255,255,255,.09)', color: '#fff3cf', fontWeight: 800, textAlign: 'center' }}>
              Klavye: A-D veya 1-4
            </div>
          </div>
        </div>
      </div>

      <div className="treasure-layout" style={{ display: 'grid', gridTemplateColumns: '1.06fr .94fr', gap: 18 }}>
        <div
          style={{
            padding: 22,
            borderRadius: 30,
            background: 'linear-gradient(180deg, rgba(255,230,160,.16), rgba(107,79,26,.14))',
            border: '1px solid rgba(255,255,255,.10)',
            position: 'relative',
            overflow: 'hidden',
            minHeight: 560,
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 10% 10%, rgba(255,255,255,.18), transparent 28%), radial-gradient(circle at 90% 18%, rgba(255,209,102,.22), transparent 30%), linear-gradient(135deg, rgba(120,84,32,.10), rgba(255,232,163,.04))' }} />
          {bubbleTrail.map((bubble) => (
            <div
              key={bubble.id}
              style={{
                position: 'absolute',
                left: `${bubble.left}%`,
                bottom: -22,
                width: bubble.size,
                height: bubble.size,
                borderRadius: 999,
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,.26), rgba(255,255,255,.06))',
                border: '1px solid rgba(255,255,255,.12)',
                ['--op']: bubble.opacity,
                animation: `treasureBubble ${bubble.duration}s linear ${bubble.delay}s infinite`,
                pointerEvents: 'none',
              }}
            />
          ))}
          {waveMode === 'correct' && (
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(255,242,163,.45), rgba(255,194,62,.22), transparent 65%)', animation: 'treasureFlash .9s ease-out forwards', pointerEvents: 'none' }} />
          )}
          {waveMode === 'wrong' && (
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(255,140,140,.42), rgba(255,90,90,.18), transparent 68%)', animation: 'treasureWrongFlash .85s ease-out forwards', pointerEvents: 'none' }} />
          )}

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#FFE8A3', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                  Hazine Avı
                </div>
                <div className="treasure-stage-title" style={{ fontSize: 32, fontWeight: 1000, color: '#fff' }}>
                  Kayıp sandığın izini sür
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ padding: '10px 14px', borderRadius: 999, background: 'rgba(0,0,0,.16)', color: '#FFF4D6', fontWeight: 900 }}>
                  İlerleme %{Math.round(progress)}
                </div>
                <div style={{ padding: '10px 14px', borderRadius: 999, background: 'rgba(255,255,255,.08)', color: '#FFF4D6', fontWeight: 900 }}>
                  Bulunan parça {Math.min(qi + (ans === q.a ? 1 : 0), total)}
                </div>
              </div>
            </div>

            <div style={{ height: 14, borderRadius: 999, background: 'rgba(255,255,255,.08)', overflow: 'hidden', marginBottom: 18 }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#FFD166,#F59E0B,#FFF1A8)', backgroundSize: '200% 100%', animation: 'treasureWave 2.4s linear infinite' }} />
            </div>

            <div style={{ position: 'relative', minHeight: 320, borderRadius: 28, background: 'linear-gradient(180deg, rgba(92,55,18,.26), rgba(37,24,9,.22))', border: '1px solid rgba(255,255,255,.08)', overflow: 'hidden', marginBottom: 18 }}>
              <div style={{ position: 'absolute', inset: '18px 20px 18px', borderRadius: 26, background: 'linear-gradient(135deg,#D8B46A,#8B5E34)', boxShadow: 'inset 0 0 0 4px rgba(255,255,255,.12)' }} />
              <div style={{ position: 'absolute', left: '6%', top: '11%', fontSize: 18, color: 'rgba(255,249,224,.9)', fontWeight: 900 }}>Harita yolu</div>
              <svg viewBox="0 0 1000 420" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                <path d="M90 300 C170 250, 230 200, 310 228 S420 316, 530 252 S680 124, 850 150" fill="none" stroke="rgba(82,50,22,.65)" strokeWidth="20" strokeDasharray="16 20" strokeLinecap="round" />
                {[0, 1, 2, 3, 4].map((i) => (
                  <g key={i}>
                    <circle cx={110 + i * 165} cy={292 - i * 30} r="20" fill="rgba(255,245,200,.32)" />
                    <circle cx={110 + i * 165} cy={292 - i * 30} r="10" fill="rgba(255,255,255,.38)" />
                  </g>
                ))}
              </svg>
              <div
                style={{
                  position: 'absolute',
                  left: `calc(${treasureProgress}% - 34px)`,
                  bottom: '96px',
                  width: 68,
                  height: 68,
                  borderRadius: 22,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 36,
                  background: 'linear-gradient(135deg,#fff6cc,#f59e0b)',
                  boxShadow: '0 18px 30px rgba(245,158,11,.28)',
                  animation: 'treasureCompass 2.6s ease-in-out infinite',
                }}
              >
                🧭
              </div>
              <div style={{ position: 'absolute', left: '8%', bottom: '12%', display: 'flex', gap: 10, alignItems: 'center', color: '#fff6db', fontWeight: 900 }}>
                <div style={{ width: 14, height: 14, borderRadius: 999, background: '#FFF1A8', animation: 'treasureMarker 1.5s ease-in-out infinite' }} />
                Başlangıç kıyısı
              </div>
              <div style={{ position: 'absolute', right: '8%', top: '15%', width: 110, height: 110, borderRadius: 28, display: 'grid', placeItems: 'center', fontSize: 52, background: ans === q.a ? 'linear-gradient(135deg,#FFE66D,#F59E0B)' : 'linear-gradient(135deg,#8C6239,#5B3C22)', boxShadow: ans === q.a ? '0 22px 36px rgba(245,158,11,.34)' : '0 14px 24px rgba(0,0,0,.24)', animation: ans === q.a ? 'treasureGlow 1.1s ease-in-out 2' : 'none' }}>
                {ans === q.a ? '💰' : ans !== null ? '🪤' : '🗝️'}
              </div>
              <div style={{ position: 'absolute', right: '8%', top: '50%', transform: 'translateY(-50%)', padding: '12px 14px', borderRadius: 18, background: 'rgba(255,255,255,.12)', color: '#fff8e1', fontWeight: 800, maxWidth: 180, lineHeight: 1.4 }}>
                {ans === null ? 'Doğru ipucunu bulunca sandık parlar ve açılır.' : ans === q.a ? 'Sandık açıldı! Altınlar ve mücevherler etrafa saçıldı.' : 'Tuzak aktif oldu ama bir sonraki sandık seni bekliyor.'}
              </div>
              {sparkles.map((s) => (
                <div key={s.id} style={{ position: 'absolute', left: `${s.left}%`, top: `${s.top}%`, width: 16, height: 16, borderRadius: 999, background: 'rgba(255,241,168,.96)', boxShadow: '0 0 20px rgba(255,214,102,.85)', ['--dx']: `${s.dx}px`, ['--dy']: `${s.dy}px`, animation: 'treasureSpark .95s ease-out forwards', pointerEvents: 'none' }} />
              ))}
              {burst.map((piece) => (
                <div
                  key={piece.id}
                  style={{
                    position: 'absolute',
                    left: `${piece.left}%`,
                    top: `${piece.top}%`,
                    width: piece.size,
                    height: piece.size,
                    borderRadius: 999,
                    background: piece.color,
                    boxShadow: `0 0 18px ${piece.color}`,
                    display: 'grid',
                    placeItems: 'center',
                    color: '#5B3700',
                    fontSize: Math.max(10, piece.size * 0.65),
                    ['--dx']: `${piece.dx}px`,
                    ['--dy']: `${piece.dy}px`,
                    ['--rot']: `${piece.rotate}deg`,
                    animation: `treasureBurst ${piece.duration}s ease-out forwards`,
                    pointerEvents: 'none',
                  }}
                >
                  {piece.emoji}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 14 }}>
              <div style={{ padding: '18px 18px', borderRadius: 22, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.10)', color: '#FFF6E8', fontWeight: 700, lineHeight: 1.55 }}>
                <div style={{ fontSize: 13, color: '#FFE5A5', fontWeight: 1000, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.08em' }}>Kaptan notu</div>
                <div style={{ fontSize: 22, fontWeight: 1000, lineHeight: 1.3, marginBottom: 8 }}>Soruyu unutma: {q.q}</div>
                <div style={{ color: 'rgba(255,248,231,.9)' }}>{status}</div>
              </div>
              <div style={{ padding: '18px 18px', borderRadius: 22, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.10)', color: '#FFF6E8' }}>
                <div style={{ fontSize: 13, color: '#FFE5A5', fontWeight: 1000, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.08em' }}>Mini görev paneli</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><span>Doğru rota</span><strong>{ans === null ? '?' : LETTERS[q.a]}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><span>Sandık durumu</span><strong>{ans === null ? 'Kilitli' : ans === q.a ? 'Açıldı' : 'Tuzak'}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><span>Macera tonu</span><strong>{ans === null ? 'Keşif' : ans === q.a ? 'Kutlama' : 'Dikkat'}</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateRows: 'auto auto 1fr', gap: 16 }}>
          <div className="treasure-clue-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {CHESTS.map((chest, i) => (
              <div key={i} style={{ padding: '14px 10px', borderRadius: 20, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', textAlign: 'center', color: '#FFF2D3' }}>
                <div style={{ fontSize: 28 }}>{chest}</div>
                <div style={{ fontSize: 12, fontWeight: 800, marginTop: 6 }}>İpucu {i + 1}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: '18px 18px', borderRadius: 24, background: 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.045))', border: '1px solid rgba(255,255,255,.10)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 12, color: '#FFE8A3', fontWeight: 1000, letterSpacing: '.08em', textTransform: 'uppercase' }}>İpucu panosu</div>
                <div style={{ fontSize: 24, color: '#fff', fontWeight: 1000 }}>Seçenekler burada kaybolmuyor</div>
              </div>
              <div style={{ padding: '10px 14px', borderRadius: 999, background: ans === null ? 'rgba(245,158,11,.16)' : ans === q.a ? 'rgba(46,204,113,.18)' : 'rgba(255,107,107,.18)', color: '#fff5d0', fontWeight: 900 }}>
                {ans === null ? 'İpucu seç' : ans === q.a ? 'Sandık açıldı' : 'Tuzak tetiklendi'}
              </div>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {clueCards.map((clue) => {
                const border = clue.state === 'correct'
                  ? 'rgba(46,204,113,.42)'
                  : clue.state === 'wrong'
                    ? 'rgba(255,107,107,.42)'
                    : 'rgba(255,255,255,.12)';
                const background = clue.state === 'correct'
                  ? 'linear-gradient(135deg, rgba(46,204,113,.24), rgba(46,204,113,.1))'
                  : clue.state === 'wrong'
                    ? 'linear-gradient(135deg, rgba(255,107,107,.2), rgba(255,107,107,.08))'
                    : 'rgba(255,255,255,.04)';
                return (
                  <div key={clue.index} style={{ display: 'grid', gridTemplateColumns: '52px 1fr auto', gap: 12, alignItems: 'center', padding: '12px 14px', borderRadius: 18, border: `1px solid ${border}`, background }}>
                    <div style={{ width: 46, height: 46, borderRadius: 16, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,.16)', color: '#fff', fontWeight: 1000 }}>{LETTERS[clue.index]}</div>
                    <div style={{ color: '#fff', fontWeight: 800, lineHeight: 1.45 }}>{clue.option}</div>
                    <div style={{ color: '#fff6db', fontWeight: 900, minWidth: 90, textAlign: 'right' }}>
                      {clue.state === 'correct' ? 'Doğru rota' : clue.state === 'wrong' ? 'Tuzak' : 'İpucu'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="treasure-answer-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignContent: 'start' }}>
            {q.o.map((option, index) => {
              const correct = index === q.a;
              const selected = ans === index;
              const idle = ans === null;
              const background = idle
                ? hovered === index
                  ? 'linear-gradient(180deg, rgba(255,209,102,.26), rgba(245,158,11,.14))'
                  : 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))'
                : correct
                  ? 'linear-gradient(180deg, rgba(46,204,113,.34), rgba(46,204,113,.14))'
                  : selected
                    ? 'linear-gradient(180deg, rgba(255,107,107,.34), rgba(255,107,107,.14))'
                    : 'rgba(255,255,255,.035)';

              const helperText = idle
                ? 'Bu rotayı seç'
                : correct
                  ? 'Doğru rota bulundu'
                  : selected
                    ? 'Bu rota çıkmaz sokak'
                    : 'Diğer ipucu';

              return (
                <button
                  key={index}
                  onClick={() => ans === null && hAns(index)}
                  onMouseEnter={() => setHovered(index)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    minHeight: 164,
                    borderRadius: 24,
                    border: `1px solid ${correct && ans !== null ? 'rgba(46,204,113,.44)' : selected ? 'rgba(255,107,107,.44)' : 'rgba(255,255,255,.10)'}`,
                    background,
                    color: '#fff',
                    cursor: ans === null ? 'pointer' : 'default',
                    padding: '18px 18px',
                    textAlign: 'left',
                    boxShadow: hovered === index && idle ? '0 16px 34px rgba(245,158,11,.18)' : '0 12px 26px rgba(0,0,0,.16)',
                    transition: 'all .22s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    animation: answerGlow === (correct ? 'correct' : selected ? 'wrong' : null) ? 'treasurePulse .5s ease-out 2' : 'none',
                  }}
                >
                  <div style={{ position: 'absolute', right: -14, top: -14, width: 88, height: 88, borderRadius: 999, background: correct && ans !== null ? 'rgba(46,204,113,.16)' : selected ? 'rgba(255,107,107,.16)' : 'rgba(255,209,102,.12)', filter: 'blur(4px)' }} />
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 10 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,.16)', fontWeight: 1000, fontSize: 18 }}>{LETTERS[index]}</div>
                      <div style={{ fontSize: 26 }}>{correct && ans !== null ? '🗝️' : selected ? '🪤' : '🧩'}</div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 1000, lineHeight: 1.34, marginTop: 18 }}>{option}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,.8)', marginTop: 10, fontWeight: 700 }}>{helperText}</div>
                    <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,.08)', color: '#FFF1CF', fontWeight: 800, fontSize: 12 }}>
                      {idle ? `Kısayol: ${LETTERS[index]} / ${index + 1}` : correct ? 'Sandığa giden güvenli yol' : selected ? 'Haritada yanlış kırılma noktası' : 'Haritada diğer seçenek'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
