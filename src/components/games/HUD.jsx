import BackButton from '../common/BackButton';
import GameHeader from '../common/GameHeader';
import ScorePanel from '../common/ScorePanel';
import TimerBar from '../common/TimerBar';

function Pill({ children, tone = 'default', compact = false }) {
  const tones = {
    default: { bg: 'rgba(255,255,255,.06)', border: 'rgba(255,255,255,.08)', color: '#E8EEFF' },
    accent: { bg: 'rgba(78,205,196,.12)', border: 'rgba(78,205,196,.24)', color: '#CFFFF9' },
    warn: { bg: 'rgba(255,230,109,.12)', border: 'rgba(255,230,109,.20)', color: '#FFF6BE' },
    danger: { bg: 'rgba(255,107,107,.12)', border: 'rgba(255,107,107,.20)', color: '#FFC4C4' },
  };
  const t = tones[tone] || tones.default;
  return <div style={{ padding: compact ? '8px 12px' : '10px 14px', borderRadius: 14, background: t.bg, border: `1px solid ${t.border}`, color: t.color, fontWeight: 900, fontSize: compact ? 12 : 13 }}>{children}</div>;
}

export default function HUD({
  mode,
  mmt,
  bombT,
  tm,
  lv,
  sc,
  cb,
  cor,
  glow,
  onBackToModes,
  brandTitle,
  topic,
  currentPlayerName,
  currentPlayerIndex,
  totalPlayers,
  competitionMode,
  duration,
  difficulty,
  userRole,
  bonusState,
  quickActions,
  lockPresentation,
  presentationLocked,
  turnMode,
  compact = false,
}) {
  const tv = mode?.id === 'memory' ? mmt : mode?.id === 'bomb' ? bombT : tm;
  const maxTv = mode?.id === 'memory' ? Math.max(duration * 6, 30) : duration;
  const low = tv <= Math.max(5, Math.floor(maxTv * 0.2));

  return (
    <div style={{ display: 'grid', gap: compact ? 4 : 12, padding: compact ? '4px 6px' : '14px 18px', background: 'linear-gradient(180deg, rgba(8,13,31,.88), rgba(8,13,31,.60))', backdropFilter: 'blur(18px)', borderRadius: 22, marginBottom: 4, border: '1px solid rgba(255,255,255,.08)', boxShadow: '0 14px 26px rgba(0,0,0,.18)' }}>
      <div style={{ display: 'flex', gap: compact ? 8 : 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <BackButton onClick={presentationLocked ? undefined : onBackToModes} compact={compact} />
        <GameHeader
          compact={compact}
          title={mode?.name || 'Oyun'}
          brandTitle={brandTitle}
          subtitle={competitionMode ? `Sıradaki oyuncu: ${currentPlayerName} • ${currentPlayerIndex + 1}/${totalPlayers}` : topic}
          right={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <Pill compact={compact} tone='accent'>{difficulty === 'easy' ? 'Kolay' : difficulty === 'hard' ? 'Zor' : 'Orta'} mod</Pill>
              <Pill compact={compact}>{userRole === 'teacher' ? 'Öğretmen modu' : 'Öğrenci modu'}</Pill>
              <Pill compact={compact} tone={presentationLocked ? 'warn' : 'default'}>{presentationLocked ? 'Sunum kilitli' : 'Sunum açık'}</Pill>
            </div>
          }
        />
      </div>

      <div style={{ display: 'flex', gap: compact ? 10 : 14, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <TimerBar compact={compact} value={tv} max={maxTv} icon={mode?.id === 'bomb' ? '💣' : '⏱'} danger={low} label='Kalan süre' />
        <ScorePanel compact={compact} score={sc} combo={cb} lives={lv} glow={glow} correct={cor} playerName={competitionMode ? currentPlayerName : ''} />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Pill compact={compact} tone='accent'>{mode?.icon} {mode?.cat || 'Oyun'}</Pill>
          <Pill compact={compact}>{turnMode === 'random' ? 'Rastgele sıra' : turnMode === 'auto' ? 'Otomatik sıra' : 'Manuel sıra'}</Pill>
          {!compact && !!bonusState?.label && <Pill compact={compact} tone='warn'>{bonusState.label}</Pill>}
          {!compact && competitionMode && currentPlayerName ? <Pill compact={compact} tone='accent'>👤 {currentPlayerName}</Pill> : null}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {(quickActions || []).map((action) => (
            <button key={action.label} onClick={action.onClick} disabled={action.disabled} style={{ padding: compact ? '9px 11px' : '12px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: action.primary ? 'linear-gradient(135deg,#6C5CE7,#4ECDC4)' : 'rgba(255,255,255,.05)', color: '#fff', fontWeight: 900, cursor: action.disabled ? 'default' : 'pointer', opacity: action.disabled ? .55 : 1, fontSize: compact ? 12 : 16 }}>
              {action.label}
            </button>
          ))}
          <button onClick={lockPresentation} style={{ padding: compact ? '9px 11px' : '12px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: presentationLocked ? 'rgba(255,230,109,.16)' : 'rgba(255,255,255,.05)', color: '#fff', fontWeight: 900, cursor: 'pointer', fontSize: compact ? 12 : 16 }}>
            {presentationLocked ? '🔓 Kilidi Aç' : '🔒 Kilitle'}
          </button>
        </div>
      </div>
    </div>
  );
}
