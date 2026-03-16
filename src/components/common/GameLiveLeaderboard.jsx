function ScoreChip({ label, value, accent = false, compact = false }) {
  return (
    <div
      style={{
        padding: '8px 10px',
        borderRadius: 12,
        background: accent ? 'rgba(78,205,196,.12)' : 'rgba(255,255,255,.05)',
        border: `1px solid ${accent ? 'rgba(78,205,196,.22)' : 'rgba(255,255,255,.08)'}`,
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 11, color: '#9DB4D4', fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: compact ? 16 : 17, color: '#fff', fontWeight: 900, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
    </div>
  );
}

function LeaderboardCard({ entry, compact = false }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: compact ? '40px 1fr auto' : '48px 1fr auto',
        gap: compact ? 8 : 10,
        alignItems: 'center',
        padding: compact ? '9px 10px' : '10px 12px',
        borderRadius: compact ? 16 : 18,
        background: entry.active ? 'rgba(78,205,196,.12)' : 'rgba(255,255,255,.04)',
        border: `1px solid ${entry.active ? 'rgba(78,205,196,.24)' : 'rgba(255,255,255,.08)'}`,
        boxShadow: entry.active ? '0 12px 28px rgba(78,205,196,.12)' : 'none',
      }}
    >
      <div
        style={{
          width: compact ? 40 : 48,
          height: compact ? 40 : 48,
          borderRadius: compact ? 12 : 16,
          display: 'grid',
          placeItems: 'center',
          fontSize: compact ? 18 : 22,
          background: 'rgba(255,255,255,.07)',
          border: '1px solid rgba(255,255,255,.08)',
        }}
      >
        {entry.avatar || '👤'}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 900, color: '#fff', fontSize: compact ? 13 : 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</div>
          {entry.active ? <span style={{ padding: '4px 8px', borderRadius: 999, background: 'rgba(78,205,196,.16)', color: '#D9FFF9', fontSize: 11, fontWeight: 900 }}>Şu an oynuyor</span> : null}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
          <span style={{ color: '#AFC3DF', fontSize: 12 }}>Toplam: <strong style={{ color: '#fff' }}>{entry.total}</strong></span>
          {entry.liveGain > 0 ? <span style={{ color: '#8FF0D9', fontSize: 12 }}>Bu tur: +{entry.liveGain}</span> : null}
          {entry.badge ? <span style={{ color: '#FFE6A2', fontSize: 12 }}>{entry.badge}</span> : null}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ color: '#8CA6C8', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Sıra</div>
        <div style={{ fontWeight: 1000, fontSize: compact ? 19 : 22, color: entry.rank <= 3 ? '#FFE66D' : '#fff' }}>#{entry.rank}</div>
      </div>
    </div>
  );
}

export default function GameLiveLeaderboard({
  entries = [],
  competitionMode = false,
  currentPlayerName = '',
  currentPlayerScore = 0,
  questionIndex = 0,
  totalQuestions = 0,
  compact = false,
}) {
  const title = competitionMode ? 'Canlı skor tablosu' : 'Tur özeti';
  const subtitle = competitionMode
    ? 'Toplam skorlar ve aktif turun puanı.'
    : 'Bu turdaki puan ve ilerleme.';

  return (
    <aside
      style={{
        minWidth: 0,
        display: 'grid',
        gridTemplateRows: 'auto auto minmax(0, 1fr)',
        gap: 10,
        padding: compact ? '9px' : '11px',
        borderRadius: 20,
        background: 'linear-gradient(180deg, rgba(8,13,31,.88), rgba(8,13,31,.72))',
        border: '1px solid rgba(255,255,255,.08)',
        boxShadow: '0 16px 34px rgba(0,0,0,.20)',
        backdropFilter: 'blur(16px)',
        maxHeight: '100%',
        minHeight: 0,
      }}
    >
      <div>
        <div style={{ color: '#A8BCD9', fontSize: 11, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase' }}>{title}</div>
        <div style={{ color: '#fff', fontSize: compact ? 15 : 17, fontWeight: 900, marginTop: 4 }}>{competitionMode ? 'Oyuncuların toplam puanı' : (currentPlayerName || 'Tek oyuncu')}</div>
        <div style={{ color: '#B8CAE2', fontSize: 12, lineHeight: 1.5, marginTop: 5 }}>{subtitle}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 7 }}>
        <ScoreChip label='Aktif oyuncu' value={currentPlayerName || 'Tek oyuncu'} accent compact={compact} />
        <ScoreChip label='Canlı puan' value={currentPlayerScore} compact={compact} />
        <ScoreChip label='İlerleme' value={`${Math.min(questionIndex + 1, Math.max(totalQuestions, 1))}/${Math.max(totalQuestions, 1)}`} compact={compact} />
      </div>

      <div style={{ minHeight: 0, overflow: 'auto', display: 'grid', gap: 8, alignContent: 'start', paddingRight: 2 }}>
        {entries.length ? entries.map((entry) => <LeaderboardCard key={entry.id} entry={entry} compact={compact} />) : (
          <div style={{ padding: '16px 18px', borderRadius: compact ? 16 : 18, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#B7C7DD', lineHeight: 1.6 }}>
            Oyuncu listesi henüz oluşmadı. Yarışma modunda oyuncu eklendiğinde burada canlı toplam puan tablosu görünür.
          </div>
        )}
      </div>
    </aside>
  );
}
