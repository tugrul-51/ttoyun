import { useMemo, useRef, useState } from 'react';
import BrandMark from './common/BrandMark';

function formatDate(value) {
  if (!value) return 'Az önce';
  try {
    return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  } catch {
    return value;
  }
}

function summarizeSetReports(reports = [], item) {
  const rows = reports.filter((report) => report.questionSetId === item.id);
  const plays = rows.length;
  const avgScore = plays ? Math.round(rows.reduce((sum, report) => sum + (Number(report.score) || 0), 0) / plays) : 0;
  const avgAccuracy = plays ? Math.round(rows.reduce((sum, report) => sum + (Number(report.accuracy) || 0), 0) / plays) : 0;
  return { plays, avgScore, avgAccuracy, lastPlayedAt: rows[0]?.createdAt || '' };
}

const chipStyle = { padding: '6px 10px', borderRadius: 999, background: 'rgba(255,255,255,.05)', color: '#D8E6F7', fontSize: 12, fontWeight: 800 };

export default function SavedQuestionSets({ currentUser, questionSets = [], reports = [], onEdit, onDelete, onDuplicate, onExport, onPreview, onOpenMembership, onImport }) {
  const [query, setQuery] = useState('');
  const [folderFilter, setFolderFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const fileRef = useRef(null);

  const mine = useMemo(() => currentUser
    ? questionSets.filter((item) => item.ownerId === currentUser.id).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
    : [], [currentUser, questionSets]);
  const folders = useMemo(() => ['all', ...new Set(mine.map((item) => item.folder).filter(Boolean))], [mine]);
  const tags = useMemo(() => ['all', ...new Set(mine.flatMap((item) => item.tags || []).filter(Boolean))], [mine]);

  const filtered = mine.filter((item) => {
    const q = query.trim().toLowerCase();
    const textHit = !q || [item.name, item.topic, item.folder, ...(item.tags || []), item.notes].filter(Boolean).join(' ').toLowerCase().includes(q);
    const folderHit = folderFilter === 'all' || item.folder === folderFilter;
    const tagHit = tagFilter === 'all' || (item.tags || []).includes(tagFilter);
    return textHit && folderHit && tagHit;
  });

  return (
    <div style={{ width: '100%', maxWidth: 1420, margin: '0 auto', display: 'grid', gap: 18, alignContent: 'start' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <BrandMark size={78} />
          <div>
            <div style={{ color: '#A3B6D4', fontSize: 12, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' }}>Soru seti merkezi</div>
            <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', margin: '4px 0 6px', fontWeight: 900, color: '#fff' }}>📚 Sorularım</h1>
            <p style={{ color: '#94A6C4', fontSize: 16, margin: 0 }}>Klasörle, etiketle, ara, önizle, kopyala ve dışa aktar.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {currentUser ? <div style={{ padding: '12px 16px', borderRadius: 16, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', color: '#DCE8F7', fontWeight: 800 }}>👤 {currentUser.name}</div> : null}
          {currentUser ? <button onClick={() => fileRef.current?.click()} style={{ padding: '12px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>İçe Aktar</button> : null}
        </div>
        <input ref={fileRef} type='file' hidden accept='.json' onChange={(event) => { const file = event.target.files?.[0]; if (file) onImport?.(file); event.target.value = ''; }} />
      </div>

      {!currentUser ? (
        <div style={{ padding: 28, borderRadius: 28, background: 'linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))', border: '1px solid rgba(255,255,255,.08)', display: 'grid', gap: 14, maxWidth: 820 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>Kayıtlı sorularını görmek için giriş yap</div>
          <div style={{ color: '#AFC2DF', lineHeight: 1.65 }}>Öğretmen ya da öğrenci hesabınla giriş yaptıktan sonra hazırladığın soru setlerini isimleriyle saklayabilir, klasörleyebilir ve istediğinde tekrar düzenleyebilirsin.</div>
          <div><button onClick={onOpenMembership} style={{ padding: '14px 22px', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg,#6C5CE7,#4ECDC4)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>Giriş sayfasını aç</button></div>
        </div>
      ) : null}

      {currentUser ? (
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr repeat(2, minmax(160px, .4fr)) auto', gap: 10, alignItems: 'center', background: 'rgba(255,255,255,.04)', borderRadius: 20, padding: 14, border: '1px solid rgba(255,255,255,.08)' }}>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder='Set adı, konu, etiket veya not ara' style={{ width: '100%', padding: '12px 14px', borderRadius: 14, background: 'rgba(0,0,0,.24)', color: '#fff', border: '1px solid rgba(255,255,255,.1)', fontSize: 15, fontFamily: 'inherit' }} />
            <select value={folderFilter} onChange={(event) => setFolderFilter(event.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 14, background: 'rgba(0,0,0,.24)', color: '#fff', border: '1px solid rgba(255,255,255,.1)', fontSize: 15, fontFamily: 'inherit' }}>{folders.map((folder) => <option key={folder} value={folder}>{folder === 'all' ? 'Tüm klasörler' : folder}</option>)}</select>
            <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 14, background: 'rgba(0,0,0,.24)', color: '#fff', border: '1px solid rgba(255,255,255,.1)', fontSize: 15, fontFamily: 'inherit' }}>{tags.map((tag) => <option key={tag} value={tag}>{tag === 'all' ? 'Tüm etiketler' : tag}</option>)}</select>
            <div style={{ color: '#9FB3CD', fontWeight: 800, textAlign: 'right' }}>{filtered.length} set</div>
          </div>

          {filtered.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              {filtered.map((item) => {
                const selectedCount = Array.isArray(item.selectedIndexes) ? item.selectedIndexes.length : (item.questionCount || item.questions?.length || 0);
                const report = summarizeSetReports(reports, item);
                return (
                  <div key={item.id} style={{ padding: 20, borderRadius: 24, background: 'linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))', border: '1px solid rgba(255,255,255,.08)', display: 'grid', gap: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'start' }}>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>{item.name}</div>
                        <div style={{ marginTop: 6, color: '#9FB3CD', fontSize: 14 }}>{item.topic || 'Konu adı yok'}</div>
                      </div>
                      <div style={{ padding: '8px 12px', borderRadius: 999, background: item.publishMode === 'published' ? 'rgba(46,204,113,.14)' : 'rgba(78,205,196,.12)', color: item.publishMode === 'published' ? '#D9FFE8' : '#C9FFF8', fontWeight: 900, fontSize: 12 }}>{item.publishMode === 'published' ? 'Yayın modu' : 'Düzenleme modu'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {item.folder ? <span style={chipStyle}>📁 {item.folder}</span> : null}
                      {(item.tags || []).map((tag) => <span key={tag} style={chipStyle}>#{tag}</span>)}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10 }}>
                      <div style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}><div style={{ color: '#fff', fontWeight: 900, fontSize: 22 }}>{item.questionCount || item.questions?.length || 0}</div><div style={{ color: '#9FB3CD', fontSize: 12, marginTop: 4 }}>toplam soru</div></div>
                      <div style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}><div style={{ color: '#fff', fontWeight: 900, fontSize: 22 }}>{selectedCount}</div><div style={{ color: '#9FB3CD', fontSize: 12, marginTop: 4 }}>seçili soru</div></div>
                      <div style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}><div style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>{formatDate(item.updatedAt)}</div><div style={{ color: '#9FB3CD', fontSize: 12, marginTop: 4 }}>son güncelleme</div></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10 }}>
                      <div style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}><div style={{ color: '#fff', fontWeight: 900, fontSize: 20 }}>{report.plays}</div><div style={{ color: '#9FB3CD', fontSize: 12, marginTop: 4 }}>oyun raporu</div></div>
                      <div style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}><div style={{ color: '#fff', fontWeight: 900, fontSize: 20 }}>{report.avgScore}</div><div style={{ color: '#9FB3CD', fontSize: 12, marginTop: 4 }}>ortalama puan</div></div>
                      <div style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}><div style={{ color: '#fff', fontWeight: 900, fontSize: 20 }}>%{report.avgAccuracy}</div><div style={{ color: '#9FB3CD', fontSize: 12, marginTop: 4 }}>ortalama başarı</div></div>
                    </div>
                    {item.notes ? <div style={{ color: '#B8C8DE', fontSize: 14, lineHeight: 1.6, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,.04)' }}>🗒️ {item.notes}</div> : null}
                    <div style={{ color: '#B8C8DE', fontSize: 14, lineHeight: 1.6 }}>Açıldığında konu, soru listesi, seçili sorular ve oyun ayarları tekrar yüklenir.</div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button onClick={() => onEdit(item)} style={{ padding: '12px 18px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#6C5CE7,#a855f7)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>Düzenle</button>
                      <button onClick={() => onPreview?.(item)} style={{ padding: '12px 18px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Önizle</button>
                      <button onClick={() => onDuplicate?.(item)} style={{ padding: '12px 18px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Kopyala</button>
                      <button onClick={() => onExport?.(item, 'json')} style={{ padding: '12px 18px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>JSON</button>
                      <button onClick={() => onExport?.(item, 'csv')} style={{ padding: '12px 18px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>CSV</button>
                      <button onClick={() => onDelete(item)} style={{ padding: '12px 18px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Sil</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: 26, borderRadius: 28, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', color: '#DCE8F7', fontWeight: 700, lineHeight: 1.7 }}>Henüz kayıtlı soru setin yok. Soru editöründeki <b>Sorularını Kaydet</b> butonuyla ilk setini oluşturabilir veya JSON içe aktarabilirsin.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
