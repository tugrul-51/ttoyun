import BackButton from '../common/BackButton';
import GameHeader from '../common/GameHeader';

function Pill({ children, tone = 'default', compact = false }) {
  const palette = {
    default: { bg: 'rgba(255,255,255,.07)', border: 'rgba(255,255,255,.09)', color: '#EAF2FF' },
    accent: { bg: 'rgba(78,205,196,.16)', border: 'rgba(78,205,196,.22)', color: '#D8FFFB' },
    warn: { bg: 'rgba(255,230,109,.16)', border: 'rgba(255,230,109,.24)', color: '#FFF5B7' },
    danger: { bg: 'rgba(255,107,107,.16)', border: 'rgba(255,107,107,.24)', color: '#FFD5D5' },
  }[tone] || { bg: 'rgba(255,255,255,.07)', border: 'rgba(255,255,255,.09)', color: '#EAF2FF' };

  return (
    <div style={{ padding: compact ? '6px 9px' : '8px 11px', borderRadius: 999, background: palette.bg, border: `1px solid ${palette.border}`, color: palette.color, fontSize: compact ? 11 : 12, fontWeight: 900, whiteSpace: 'nowrap' }}>
      {children}
    </div>
  );
}

function ActionButton({ onClick, children, disabled = false, primary = false, compact = false, tone = 'default' }) {
  const palette = primary
    ? { bg: 'linear-gradient(135deg,#6C5CE7,#4ECDC4)', border: 'transparent', color: '#fff' }
    : tone === 'danger'
      ? { bg: 'rgba(255,107,107,.12)', border: 'rgba(255,107,107,.18)', color: '#FFDADA' }
      : { bg: 'rgba(255,255,255,.05)', border: 'rgba(255,255,255,.09)', color: '#fff' };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: compact ? '8px 10px' : '10px 13px',
        borderRadius: 12,
        border: `1px solid ${palette.border}`,
        background: palette.bg,
        color: palette.color,
        fontWeight: 900,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? .55 : 1,
        fontSize: compact ? 12 : 13,
        whiteSpace: 'nowrap',
        boxShadow: primary ? '0 12px 28px rgba(78,205,196,.18)' : 'none',
      }}
    >
      {children}
    </button>
  );
}

export default function HUD({
  mode,
  bonusState,
  onBackToModes,
  brandTitle,
  topic,
  currentPlayerName,
  currentPlayerIndex,
  totalPlayers,
  competitionMode,
  difficulty,
  userRole,
  quickActions,
  lockPresentation,
  presentationLocked,
  turnMode,
  compact = false,
}) {
  const titleSub = competitionMode ? `Oyuncu: ${currentPlayerName} • ${currentPlayerIndex + 1}/${totalPlayers}` : topic;
  const difficultyLabel = difficulty === 'easy' ? 'Kolay' : difficulty === 'hard' ? 'Zor' : 'Orta';
  const turnLabel = turnMode === 'random' ? 'Rastgele sıra' : turnMode === 'auto' ? 'Otomatik sıra' : 'Manuel sıra';

  return (
    <div style={{ display: 'grid', gap: 8, padding: compact ? '8px 10px' : '10px 12px', background: 'linear-gradient(180deg, rgba(8,13,31,.92), rgba(8,13,31,.78))', backdropFilter: 'blur(18px)', borderRadius: 18, marginBottom: 6, border: '1px solid rgba(255,255,255,.08)', boxShadow: '0 14px 34px rgba(0,0,0,.20)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 420px' }}>
          <BackButton onClick={presentationLocked ? undefined : onBackToModes} compact />
          <GameHeader compact title={mode?.name || 'Oyun'} brandTitle={brandTitle} subtitle={titleSub} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {(quickActions || []).map((action) => (
            <ActionButton key={action.label} onClick={action.onClick} disabled={action.disabled} primary={action.primary} compact>
              {action.label}
            </ActionButton>
          ))}
          <ActionButton onClick={lockPresentation} compact>
            {presentationLocked ? '🔓 Kilidi Aç' : '🔒 Kilitle'}
          </ActionButton>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Pill compact tone='accent'>{difficultyLabel} mod</Pill>
          <Pill compact>{userRole === 'teacher' ? 'Öğretmen modu' : 'Öğrenci modu'}</Pill>
          <Pill compact>{turnLabel}</Pill>
          {!!bonusState?.label && <Pill compact tone='warn'>{bonusState.label}</Pill>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Pill compact tone='accent'>⚡ {mode?.energy || 'Hız'}</Pill>
          <Pill compact tone={presentationLocked ? 'warn' : 'default'}>{presentationLocked ? 'Sunum kilitli' : 'Sunum açık'}</Pill>
        </div>
      </div>
    </div>
  );
}
