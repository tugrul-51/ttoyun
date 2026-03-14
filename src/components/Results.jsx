import { useState } from 'react';
import { SFX } from '../utils/audio';
import ResultModal from './common/ResultModal';
import BrandMark from './common/BrandMark';

function downloadCertificate(summary) {
  const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"/><title>Sertifika</title><style>body{font-family:Segoe UI,system-ui,sans-serif;background:#0f172a;color:#fff;display:grid;place-items:center;height:100vh;margin:0}.card{width:min(900px,92vw);padding:48px;border-radius:36px;background:linear-gradient(135deg,#1e293b,#0f766e);border:2px solid rgba(255,255,255,.16);box-shadow:0 24px 80px rgba(0,0,0,.35)}h1{font-size:54px;margin:0 0 12px}.name{font-size:42px;font-weight:800;margin:26px 0;color:#ffe66d}.meta{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:24px}.meta div{padding:16px;border-radius:20px;background:rgba(255,255,255,.09)}</style></head><body><div class="card"><div style="letter-spacing:.18em;text-transform:uppercase;opacity:.72;font-weight:800">Başarı Sertifikası</div><h1>${summary.title}</h1><div>${summary.subtitle}</div><div class="name">${summary.name}</div><div>${summary.description}</div><div class="meta"><div><b>Puan</b><br/>${summary.score}</div><div><b>Rozet</b><br/>${summary.badge}</div><div><b>Tarih</b><br/>${new Date().toLocaleDateString('tr-TR')}</div></div></div></body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${summary.name || 'oyuncu'}_sertifika.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

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
  setScr,
  competitionMode,
  currentPlayerName,
  onNextPlayer,
  hasNextPlayer,
  leaderboard,
  analytics,
  badge,
  onDownloadBadge,
}) {
  const [showDetails, setShowDetails] = useState(false);
  const total = mode?.id === 'memory' ? 6 : gqs?.length || 0;

  const actions = [
    { label: '🔄 Tekrar Oyna', primary: true, onClick: () => startG(mode) },
    { label: '🎮 Mod Değiştir', onClick: () => { setScr('modes'); SFX.click(); } },
    { label: '🏅 Rozet İndir', onClick: onDownloadBadge },
    { label: '📜 Sertifika', onClick: () => downloadCertificate({ title: 'T~T Eğitsel Oyunlar', subtitle: `${mode?.name} • ${topic}`, name: currentPlayerName || 'Katılımcı', description: 'Bu sertifika premium eğitim platformundaki performans başarısını belgelemek için üretilmiştir.', score: sc, badge: badge?.name || 'Katılım Rozeti' }) },
  ];

  if (competitionMode && hasNextPlayer) actions.unshift({ label: '➡️ Sıradaki Oyuncu', primary: true, onClick: onNextPlayer });

  return (
    <div style={{ height: '100%', width: '100%', maxWidth: '1320px', margin: '0 auto', display: 'grid', gridTemplateRows: 'auto 1fr', gap: 18, padding: '8px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <BrandMark size={72} subtle />
          <div>
            <div style={{ color: '#A3B6D4', fontSize: 12, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' }}>Tur özeti</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>{competitionMode ? `${currentPlayerName} turunu tamamladı` : 'Oyun tamamlandı'}</div>
          </div>
        </div>
        <button onClick={() => setShowDetails((v) => !v)} style={{ padding: '12px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.05)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>{showDetails ? 'Ayrıntıyı Gizle' : 'Ayrıntıyı Göster'}</button>
      </div>

      <div style={{ minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(380px, .88fr) minmax(0, 1.12fr)', gap: 18 }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
            <MiniStat label='en güçlü konu' value={analytics?.strongestTopic || '—'} />
            <MiniStat label='gelişim alanı' value={analytics?.weakestTopic || '—'} />
            <MiniStat label='başarı oranı' value={analytics?.accuracy ? `%${analytics.accuracy}` : '%0'} />
            <MiniStat label='rozet' value={badge?.name || 'Katılım'} />
          </div>

          <div style={{ padding: 18, borderRadius: 24, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', display: 'grid', gap: 10 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>🎓 Kısa değerlendirme</div>
            <div style={{ color: '#DCE7F7', lineHeight: 1.65 }}>Bu turda <b>{analytics?.strongestTopic || 'genel içerik'}</b> alanında daha güçlü performans görüldü. Bir sonraki turda <b>{analytics?.weakestTopic || 'zaman yönetimi'}</b> başlığına biraz daha odaklanmak faydalı olur.</div>
          </div>

          <div style={{ minHeight: 0, background: 'rgba(255,255,255,.04)', borderRadius: 24, padding: 20, border: '1px solid rgba(255,255,255,.08)', overflow: 'auto', display: 'grid', gap: 14, alignContent: 'start' }}>
            <div style={{ fontSize: 22, fontWeight: 900 }}>🏁 Genel Sıralama</div>
            {leaderboard?.length ? leaderboard.slice().sort((a, b) => b.total - a.total).map((entry, index) => (
              <div key={entry.id} style={{ display: 'grid', gridTemplateColumns: '64px 1fr 110px', gap: 10, alignItems: 'center', padding: '14px 16px', borderRadius: 18, background: index === 0 ? 'rgba(255,230,109,.10)' : 'rgba(255,255,255,.04)', border: index === 0 ? '1px solid rgba(255,230,109,.20)' : '1px solid rgba(255,255,255,.06)' }}>
                <div style={{ fontWeight: 900, color: index === 0 ? '#FFE66D' : '#9FB3CD' }}>#{index + 1}</div>
                <div>
                  <div style={{ fontWeight: 900 }}>{entry.name}</div>
                  <div style={{ fontSize: 12, color: '#8EA2BE' }}>{Object.keys(entry.games || {}).length} oyun • {entry.badge || 'Rozet bekliyor'}</div>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 900 }}>⭐ {entry.total}</div>
              </div>
            )) : <div style={{ color: '#8EA2BE' }}>Henüz skor tablosu oluşmadı.</div>}

            {showDetails ? (
              <div style={{ paddingTop: 8, display: 'grid', gap: 12 }}>
                <div style={{ fontSize: 18, fontWeight: 900 }}>Ayrıntılı ödüller</div>
                {[
                  { icon: '🏆', title: badge?.name || 'Katılım Rozeti', desc: 'Bu tur sonunda açılan ana başarı rozeti.' },
                  { icon: analytics?.accuracy >= 85 ? '🌟' : '💡', title: analytics?.accuracy >= 85 ? 'Parlak Seri' : 'Gelişim Işığı', desc: analytics?.accuracy >= 85 ? 'Yüksek başarı oranı ile yıldız paketi açıldı.' : 'Bir sonraki tur için öğretici ipucu kartı açıldı.' },
                  { icon: competitionMode ? '🤝' : '🎯', title: competitionMode ? 'Takım Enerjisi' : 'Odak Görevi', desc: competitionMode ? 'Sınıf akışında takım bonusu aktif.' : 'Bireysel odak görevi vitrinde.' },
                ].map((item) => (
                  <div key={item.title} style={{ padding: '14px 16px', borderRadius: 18, background: 'linear-gradient(135deg, rgba(255,255,255,.07), rgba(255,255,255,.03))', border: '1px solid rgba(255,255,255,.08)' }}>
                    <div style={{ fontSize: 26, marginBottom: 8 }}>{item.icon}</div>
                    <div style={{ fontWeight: 900, color: '#fff', marginBottom: 6 }}>{item.title}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.5, color: '#C9D8EA' }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
