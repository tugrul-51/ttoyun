import { useMemo, useState } from 'react';
import ResultModal from './common/ResultModal';
import BrandMark from './common/BrandMark';
import { SFX } from '../utils/audio';

function MiniStat({ label, value }) {
  return <div style={{ padding: '16px 18px', borderRadius: 20, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}><div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{value}</div><div style={{ fontSize: 12, color: '#8EA2BE', marginTop: 4 }}>{label}</div></div>;
}

export default function Results({
  mode,
  topic,
  sc,
  cor,
  wrong,
  gqs,
  mcb,
  tt,
  startG,
  competitionMode,
  currentPlayerName,
  onNextPlayer,
  hasNextPlayer,
  competitionPlayers = [],
  currentPlayerIndex = 0,
  onSelectPlayer,
  leaderboard,
  analytics,
  badge,
  answerLogs = [],
  onGoToGames,
  turnMode = 'manual',
}) {
  const [playerPickerOpen, setPlayerPickerOpen] = useState(false);
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 900 : false;
  const total = gqs?.length || 0;
  const attempted = answerLogs.length;
  const unanswered = Math.max(total - attempted, 0);
  const averageTimePerQuestion = attempted ? `${(tt / attempted).toFixed(1)} sn` : '—';
  const strongestRows = answerLogs.slice(0, 8);
  const nextPlayerName = useMemo(() => {
    if (!competitionMode || !competitionPlayers?.length) return '';
    if (turnMode === 'random') return 'Rastgele oyuncu';
    return competitionPlayers[currentPlayerIndex + 1]?.name || '';
  }, [competitionMode, competitionPlayers, currentPlayerIndex, turnMode]);

  const actions = [
    { label: '🔄 Tekrar Oyna', primary: true, onClick: () => startG(mode) },
    { label: '🎮 Başka Oyuna Geç', onClick: () => { onGoToGames?.(); SFX.click(); } },
  ];

  if (competitionMode) {
    actions.unshift({ label: playerPickerOpen ? '👥 Oyuncu listesini kapat' : '👥 Sıradaki kullanıcıyı seç', onClick: () => setPlayerPickerOpen((prev) => !prev) });
    if (hasNextPlayer) actions.unshift({ label: `➡️ Sıradaki: ${nextPlayerName || 'Hazır'}`, primary: true, onClick: onNextPlayer });
  }

  return (
    <div style={{ height: '100%', width: '100%', maxWidth: '1360px', margin: '0 auto', display: 'grid', gridTemplateRows: 'auto 1fr', gap: 18, padding: '8px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: 16 }}>
          <BrandMark size={isMobile ? 58 : 72} subtle />
          <div>
            <div style={{ color: '#A3B6D4', fontSize: 12, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' }}>Tur özeti ve final raporu</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>{competitionMode ? `${currentPlayerName} turunu tamamladı` : 'Oyun tamamlandı'}</div>
          </div>
        </div>
      </div>

      <div style={{ minHeight: 0, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(360px, .84fr) minmax(0, 1.16fr)', gap: 18 }}>
        <ResultModal
          open
          title={competitionMode ? `${currentPlayerName} turunu tamamladı` : 'Oyun Bitti'}
          subtitle={`${mode?.icon} ${mode?.name} • ${topic}`}
          stats={[
            { label: 'Puan', value: sc, icon: '⭐' },
            { label: 'Doğru', value: `${cor}/${total}`, icon: '✅' },
            { label: 'Yanlış', value: wrong, icon: '❌' },
            { label: 'Kombo', value: `${mcb}x`, icon: '🔥' },
            { label: 'Süre', value: `${tt}s`, icon: '⏱️' },
          ]}
          actions={actions}
        />

        <div style={{ minHeight: 0, display: 'grid', gridTemplateRows: 'auto auto 1fr', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0,1fr))' : 'repeat(4, minmax(0,1fr))', gap: 12 }}>
            <MiniStat label='en güçlü konu' value={analytics?.strongestTopic || '—'} />
            <MiniStat label='gelişim alanı' value={analytics?.weakestTopic || '—'} />
            <MiniStat label='başarı oranı' value={analytics?.accuracy ? `%${analytics.accuracy}` : '%0'} />
            <MiniStat label='rozet' value={badge?.name || 'Katılım'} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0,1fr))' : 'repeat(4, minmax(0,1fr))', gap: 12 }}>
            <MiniStat label='oynanan soru' value={attempted} />
            <MiniStat label='kalan soru' value={unanswered} />
            <MiniStat label='ortalama soru süresi' value={averageTimePerQuestion} />
            <MiniStat label='en iyi seri' value={`${mcb}x`} />
          </div>

          <div style={{ minHeight: 0, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : (competitionMode ? 'minmax(300px,.52fr) minmax(0,.48fr)' : '1fr'), gap: 16 }}>
            <div style={{ minHeight: 0, background: 'rgba(255,255,255,.04)', borderRadius: 24, padding: 20, border: '1px solid rgba(255,255,255,.08)', overflow: 'auto', display: 'grid', gap: 14, alignContent: 'start' }}>
              <div style={{ fontSize: 22, fontWeight: 900 }}>🧠 Ayrıntılı oyun raporu</div>
              <div style={{ color: '#DCE7F7', lineHeight: 1.65 }}>
                Bu turda <b>{analytics?.strongestTopic || 'genel içerik'}</b> alanında daha güçlü performans görüldü. Bir sonraki turda <b>{analytics?.weakestTopic || 'zaman yönetimi'}</b> başlığına biraz daha odaklanmak faydalı olur.
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {strongestRows.length ? strongestRows.map((entry, index) => (
                  <div key={`${entry.q}-${index}`} style={{ padding: '12px 14px', borderRadius: 16, background: entry.correct ? 'rgba(46,204,113,.10)' : 'rgba(255,107,107,.10)', border: entry.correct ? '1px solid rgba(46,204,113,.18)' : '1px solid rgba(255,107,107,.18)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                      <div style={{ color: '#fff', fontWeight: 800 }}>{entry.correct ? '✅ Doğru' : '❌ Yanlış'}</div>
                      <div style={{ color: '#BFD1E8', fontSize: 12 }}>{entry.topic || 'genel'}</div>
                    </div>
                    <div style={{ color: '#EAF2FF', marginTop: 8, lineHeight: 1.55 }}>{entry.q}</div>
                  </div>
                )) : <div style={{ color: '#8EA2BE' }}>Bu tur için ayrıntılı soru kaydı oluşmadı.</div>}
              </div>
            </div>

            {competitionMode ? (
              <div id='results-player-picker' style={{ minHeight: 0, background: 'rgba(255,255,255,.04)', borderRadius: 24, padding: 20, border: '1px solid rgba(255,255,255,.08)', overflow: 'auto', display: 'grid', gap: 14, alignContent: 'start' }}>
                <div style={{ fontSize: 22, fontWeight: 900 }}>👥 Oyuncu geçiş merkezi</div>
                <div style={{ color: '#D9E4F5', lineHeight: 1.6 }}>Tur bittiğinde sıradaki oyuncuya geçebilir veya listedeki bir oyuncuyu doğrudan seçebilirsin.</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={onNextPlayer} disabled={!hasNextPlayer} style={{ padding: '12px 16px', borderRadius: 14, border: 'none', background: hasNextPlayer ? 'linear-gradient(135deg,#6C5CE7,#4ECDC4)' : 'rgba(255,255,255,.08)', color: '#fff', fontWeight: 900, cursor: hasNextPlayer ? 'pointer' : 'default', opacity: hasNextPlayer ? 1 : .55 }}>➡️ {hasNextPlayer ? `Sıradaki: ${nextPlayerName || 'Hazır'}` : 'Başka oyuncu yok'}</button>
                  <button onClick={() => setPlayerPickerOpen((prev) => !prev)} style={{ padding: '12px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.05)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>{playerPickerOpen ? 'Seçici gizle' : 'Oyuncu seçiciyi aç'}</button>
                </div>
                {playerPickerOpen ? (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {(competitionPlayers || []).map((player, index) => {
                      const active = index === currentPlayerIndex;
                      return (
                        <button key={player.id || `${player.name}-${index}`} onClick={() => onSelectPlayer?.(index)} style={{ display: 'grid', gridTemplateColumns: '56px 1fr auto', gap: 10, alignItems: 'center', padding: '12px 14px', borderRadius: 16, border: `1px solid ${active ? 'rgba(78,205,196,.30)' : 'rgba(255,255,255,.08)'}`, background: active ? 'rgba(78,205,196,.12)' : 'rgba(255,255,255,.03)', color: '#fff', cursor: 'pointer', textAlign: 'left' }}>
                          <div style={{ width: 44, height: 44, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.07)', fontSize: 22 }}>{player.avatar || '👤'}</div>
                          <div>
                            <div style={{ fontWeight: 900 }}>{player.name}</div>
                            <div style={{ fontSize: 12, color: '#A8BCD8' }}>{active ? 'Şu anki oyuncu' : 'Bu oyuncu ile yeni tur başlat'}</div>
                          </div>
                          <div style={{ padding: '8px 10px', borderRadius: 12, background: active ? 'rgba(78,205,196,.20)' : 'rgba(255,255,255,.05)', fontWeight: 900 }}>{active ? 'Aktif' : 'Seç'}</div>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
                <div style={{ display: 'grid', gap: 10, marginTop: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#A3B6D4', letterSpacing: '.08em', textTransform: 'uppercase' }}>Skor tablosu</div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {(leaderboard || []).length ? leaderboard.slice().sort((a, b) => b.total - a.total).map((entry, index) => (
                      <div key={entry.id} style={{ display: 'grid', gridTemplateColumns: '44px 1fr auto', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 14, background: index === 0 ? 'rgba(255,230,109,.10)' : 'rgba(255,255,255,.03)', border: index === 0 ? '1px solid rgba(255,230,109,.20)' : '1px solid rgba(255,255,255,.06)' }}>
                        <div style={{ color: index === 0 ? '#FFE66D' : '#A6BAD6', fontWeight: 900 }}>#{index + 1}</div>
                        <div>
                          <div style={{ fontWeight: 900 }}>{entry.name}</div>
                          <div style={{ fontSize: 12, color: '#8EA2BE' }}>{Object.keys(entry.games || {}).length} oyun • {entry.badge || 'Rozet bekliyor'}</div>
                        </div>
                        <div style={{ fontWeight: 900, color: '#fff' }}>⭐ {entry.total}</div>
                      </div>
                    )) : <div style={{ color: '#8EA2BE' }}>Henüz skor tablosu oluşmadı.</div>}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {playerPickerOpen ? (
        <div style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'rgba(3,8,20,.62)', backdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center', padding: 18 }}>
          <div style={{ width: 'min(640px, 100%)', maxHeight: '80vh', overflow: 'auto', borderRadius: 26, background: 'linear-gradient(180deg, rgba(12,18,34,.98), rgba(8,13,28,.98))', border: '1px solid rgba(255,255,255,.10)', boxShadow: '0 24px 70px rgba(0,0,0,.40)', padding: 22, display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: '#A3B6D4', fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' }}>Oyuncu seçici</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>Bir sonraki tur oyuncusunu seç</div>
              </div>
              <button onClick={() => setPlayerPickerOpen(false)} style={{ width: 42, height: 42, borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.05)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {(competitionPlayers || []).map((player, index) => {
                const active = index === currentPlayerIndex;
                return (
                  <button key={`picker-${player.id || index}`} onClick={() => { onSelectPlayer?.(index); setPlayerPickerOpen(false); }} style={{ display: 'grid', gridTemplateColumns: '56px 1fr auto', gap: 10, alignItems: 'center', padding: '12px 14px', borderRadius: 16, border: `1px solid ${active ? 'rgba(78,205,196,.30)' : 'rgba(255,255,255,.08)'}`, background: active ? 'rgba(78,205,196,.12)' : 'rgba(255,255,255,.03)', color: '#fff', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.07)', fontSize: 22 }}>{player.avatar || '👤'}</div>
                    <div>
                      <div style={{ fontWeight: 900 }}>{player.name}</div>
                      <div style={{ fontSize: 12, color: '#A8BCD8' }}>{active ? 'Şu anki oyuncu' : 'Bu oyuncu ile yeni tur başlat'}</div>
                    </div>
                    <div style={{ padding: '8px 10px', borderRadius: 12, background: active ? 'rgba(78,205,196,.20)' : 'rgba(255,255,255,.05)', fontWeight: 900 }}>{active ? 'Aktif' : 'Seç'}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
