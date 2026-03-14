import { useMemo, useRef, useState } from 'react';
import { SFX } from '../utils/audio';
import BrandMark from './common/BrandMark';

const LETTERS = ['A', 'B', 'C', 'D'];
const GAME_TYPES = ['quiz', 'balloon', 'wheel', 'memory', 'truefalse', 'millionaire', 'whack', 'race', 'target', 'flashcard', 'dice', 'openbox', 'bomb', 'submarine', 'puzzle', 'treasure', 'monster', 'chef', 'hero', 'dino'];

function normalizeQuestion(question = {}) {
  return {
    q: question.q || '',
    o: Array.isArray(question.o) ? [...question.o, '', '', '', ''].slice(0, 4) : ['', '', '', ''],
    a: Number.isInteger(question.a) ? question.a : 0,
    hint: question.hint || '',
    explanation: question.explanation || '',
    media: {
      image: question.media?.image || question.image || '',
      audio: question.media?.audio || question.audio || '',
      video: question.media?.video || question.video || '',
    },
    type: question.type || 'multiple-choice',
    topicTag: question.topicTag || '',
    games: Array.isArray(question.games) && question.games.length ? question.games : GAME_TYPES.slice(0, 6),
  };
}

function createBlankQuestion() {
  return normalizeQuestion({});
}

function parseDelimited(text, delimiter = ',') {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [];
  const rows = lines.map((line) => line.split(delimiter).map((part) => part.trim()));
  const hasHeader = rows[0].some((cell) => /soru|question|a\)|seçenek|option/i.test(cell));
  const body = hasHeader ? rows.slice(1) : rows;
  return body
    .filter((row) => row.length >= 6)
    .map((row) => normalizeQuestion({
      q: row[0],
      o: row.slice(1, 5),
      a: Math.max(0, Math.min(3, Number(row[5]) || 0)),
      hint: row[6] || '',
      explanation: row[7] || '',
      topicTag: row[8] || '',
    }));
}

export default function Editor({ topic, qs, setQs, sel, setSel, setFqs, setScr }) {
  const [editIdx, setEditIdx] = useState(null);
  const [editForm, setEditForm] = useState(createBlankQuestion());
  const [newQuestion, setNewQuestion] = useState(createBlankQuestion());
  const [showAdd, setShowAdd] = useState(true);
  const [bulkText, setBulkText] = useState('');
  const [dragIndex, setDragIndex] = useState(null);
  const [err, setErr] = useState('');
  const [importInfo, setImportInfo] = useState('CSV / JSON / TSV ve Excel uyumlu kopyala-yapıştır desteklenir.');
  const fileRef = useRef(null);

  const inputStyle = {
    width: '100%', padding: '14px 16px', fontSize: '17px', fontWeight: '700', background: 'rgba(0,0,0,.34)', border: '1px solid rgba(255,255,255,.15)', borderRadius: '14px', color: '#fff', outline: 'none', fontFamily: 'inherit',
  };

  const normalized = useMemo(() => qs.map((q) => normalizeQuestion(q)), [qs]);
  const selectedCount = sel.size;

  const updateEditOption = (index, value, targetSetter, source) => {
    const next = [...source.o];
    next[index] = value;
    targetSetter({ ...source, o: next });
  };

  const toggleSelect = (i) => setSel((prev) => {
    const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next;
  });

  const startEdit = (i) => { setEditIdx(i); setEditForm(normalizeQuestion(normalized[i])); };

  const saveEdit = () => {
    const updated = [...normalized];
    updated[editIdx] = normalizeQuestion(editForm);
    setQs(updated);
    setEditIdx(null);
    SFX.correct();
  };

  const deleteQuestion = (i) => {
    setQs(normalized.filter((_, j) => j !== i));
    setSel((prev) => {
      const next = new Set();
      prev.forEach((x) => { if (x < i) next.add(x); else if (x > i) next.add(x - 1); });
      return next;
    });
    if (editIdx === i) setEditIdx(null);
  };

  const moveQuestion = (from, to) => {
    if (to < 0 || to >= normalized.length) return;
    const arr = [...normalized];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    setQs(arr);
  };

  const addQuestion = () => {
    if (!newQuestion.q.trim() || newQuestion.o.some((o) => !o.trim())) return setErr('Soru ve tüm seçenekler doldurulmalı.');
    setQs([...normalized, normalizeQuestion(newQuestion)]);
    setNewQuestion(createBlankQuestion());
    setErr('');
    SFX.correct();
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    let imported = [];
    try {
      if (file.name.endsWith('.json')) imported = JSON.parse(text).map((item) => normalizeQuestion(item));
      else if (file.name.endsWith('.tsv') || file.type.includes('tab')) imported = parseDelimited(text, '\t');
      else imported = parseDelimited(text, ',');
      if (!imported.length) throw new Error('İçerik okunamadı');
      setQs([...normalized, ...imported]);
      setImportInfo(`${imported.length} soru içe aktarıldı.`);
      SFX.win();
    } catch {
      setImportInfo('Dosya okunamadı. JSON dizi veya CSV/TSV deneyin.');
      SFX.wrong();
    }
    event.target.value = '';
  };

  const applyBulkPaste = () => {
    let imported = [];
    try {
      if (bulkText.trim().startsWith('[')) imported = JSON.parse(bulkText).map((item) => normalizeQuestion(item));
      else imported = bulkText.includes('\t') ? parseDelimited(bulkText, '\t') : parseDelimited(bulkText, ',');
      if (!imported.length) throw new Error('empty');
      setQs([...normalized, ...imported]);
      setBulkText('');
      setImportInfo(`${imported.length} soru toplu olarak eklendi.`);
      SFX.win();
    } catch {
      setErr('Toplu veri okunamadı. JSON / CSV / TSV biçimini kontrol et.');
      SFX.wrong();
    }
  };

  const confirmQuestions = () => {
    const chosen = normalized.filter((_, i) => sel.has(i));
    if (chosen.length < 4) return setErr('Devam etmek için en az 4 soru seç.');
    setFqs(chosen);
    setScr('modes');
    SFX.win();
  };

  const renderForm = (form, setForm) => (
    <div style={{ display: 'grid', gap: 10 }}>
      <textarea value={form.q} onChange={(e) => setForm({ ...form, q: e.target.value })} placeholder='Soru metni' rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
        {form.o.map((option, index) => (
          <div key={index} style={{ display: 'grid', gridTemplateColumns: '48px 1fr', gap: 10, alignItems: 'center' }}>
            <button onClick={() => setForm({ ...form, a: index })} style={{ height: 48, borderRadius: 14, border: '2px solid', borderColor: form.a === index ? '#2ecc71' : 'rgba(255,255,255,.15)', background: form.a === index ? 'rgba(46,204,113,.26)' : 'transparent', cursor: 'pointer', color: '#fff', fontWeight: 900 }}>{LETTERS[index]}</button>
            <input value={option} onChange={(e) => updateEditOption(index, e.target.value, setForm, form)} placeholder={`Seçenek ${index + 1}`} style={inputStyle} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <input value={form.hint} onChange={(e) => setForm({ ...form, hint: e.target.value })} placeholder='İpucu' style={inputStyle} />
        <input value={form.topicTag} onChange={(e) => setForm({ ...form, topicTag: e.target.value })} placeholder='Konu etiketi' style={inputStyle} />
      </div>
      <textarea value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} placeholder='Açıklama / öğretici geri bildirim' rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10 }}>
        <input value={form.media.image} onChange={(e) => setForm({ ...form, media: { ...form.media, image: e.target.value } })} placeholder='Görsel URL' style={inputStyle} />
        <input value={form.media.audio} onChange={(e) => setForm({ ...form, media: { ...form.media, audio: e.target.value } })} placeholder='Ses URL' style={inputStyle} />
        <input value={form.media.video} onChange={(e) => setForm({ ...form, media: { ...form.media, video: e.target.value } })} placeholder='Video URL' style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 8 }}>
        {GAME_TYPES.map((game) => {
          const active = form.games.includes(game);
          return <button key={game} onClick={() => setForm({ ...form, games: active ? form.games.filter((x) => x !== game) : [...form.games, game] })} style={{ padding: '10px 12px', borderRadius: 12, border: `1px solid ${active ? 'rgba(78,205,196,.34)' : 'rgba(255,255,255,.10)'}`, background: active ? 'rgba(78,205,196,.12)' : 'rgba(255,255,255,.04)', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 12 }}>{game}</button>;
        })}
      </div>
    </div>
  );

  return (
    <div style={{ height: '100%', width: '100%', maxWidth: '1450px', margin: '0 auto', display: 'grid', gridTemplateRows: 'auto auto 1fr auto', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <BrandMark size={80} />
          <div>
            <div style={{ color: '#A3B6D4', fontSize: 12, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' }}>Premium öğretmen paneli</div>
            <h1 style={{ fontSize: 'clamp(28px,4vw,40px)', margin: '4px 0 6px', fontWeight: 900, color: '#fff' }}>📝 Soru Editörü</h1>
            <p style={{ color: '#94A6C4', fontSize: 16, margin: 0 }}>{topic} • {normalized.length} soru • Büyük yazılar • Önizleme • İçe aktarma</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(120px, 1fr))', gap: 10, minWidth: 'min(100%, 520px)' }}>
          {[[`${selectedCount}`, 'seçili soru'], ['CSV/JSON', 'içe aktar'], ['Görsel/Ses', 'medya alanı'], ['Canlı', 'önizleme']].map(([big, small]) => <div key={big + small} style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,.045)', border: '1px solid rgba(255,255,255,.08)' }}><div style={{ fontWeight: 900, color: '#fff', fontSize: 20 }}>{big}</div><div style={{ fontSize: 12, color: '#A3B6D4', marginTop: 4 }}>{small}</div></div>)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto auto', gap: 10, alignItems: 'center', background: 'rgba(255,255,255,.04)', borderRadius: 20, padding: 14, border: '1px solid rgba(255,255,255,.08)' }}>
        <button onClick={() => fileRef.current?.click()} style={{ padding: '12px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>📁 Dosya İçe Aktar</button>
        <input ref={fileRef} type='file' accept='.json,.csv,.tsv,.txt' onChange={handleImportFile} style={{ display: 'none' }} />
        <div style={{ color: '#8EA2BE', fontWeight: 700 }}>{importInfo}</div>
        <button onClick={() => setSel(new Set(normalized.map((_, i) => i)))} style={{ padding: '12px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>✅ Tümünü Seç</button>
        <button onClick={() => setSel(new Set())} style={{ padding: '12px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>⬜ Temizle</button>
        <button onClick={() => setShowAdd((p) => !p)} style={{ padding: '12px 16px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#6C5CE7,#4ECDC4)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>{showAdd ? 'Formu Kapat' : 'Yeni Soru Formu'}</button>
      </div>

      <div style={{ minHeight: 0, display: 'grid', gridTemplateColumns: '1.25fr .95fr .85fr', gap: 16 }}>
        <div style={{ minHeight: 0, background: 'linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.03))', borderRadius: 24, border: '1px solid rgba(255,255,255,.08)', overflow: 'auto', padding: 16, display: 'grid', gap: 12 }}>
          {normalized.map((q, i) => (
            <div key={i} draggable onDragStart={() => setDragIndex(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragIndex !== null && dragIndex !== i) moveQuestion(dragIndex, i); setDragIndex(null); }} style={{ background: sel.has(i) ? 'rgba(108,92,231,.12)' : 'rgba(255,255,255,.035)', border: sel.has(i) ? '2px solid rgba(108,92,231,.34)' : '2px solid rgba(255,255,255,.06)', borderRadius: 20, padding: 16 }}>
              {editIdx === i ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  {renderForm(editForm, setEditForm)}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={saveEdit} style={{ padding: '12px 20px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#2ecc71,#27ae60)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>Kaydet</button>
                    <button onClick={() => setEditIdx(null)} style={{ padding: '12px 20px', borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>İptal</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '36px 36px 1fr auto', gap: 12, alignItems: 'start' }}>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <button onClick={() => moveQuestion(i, i - 1)} disabled={i === 0} style={{ height: 28, borderRadius: 10, border: 'none', background: i === 0 ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.08)', color: i === 0 ? '#4d5a73' : '#cdd9ee', cursor: i === 0 ? 'default' : 'pointer', fontWeight: 900 }}>▲</button>
                    <button onClick={() => moveQuestion(i, i + 1)} disabled={i === normalized.length - 1} style={{ height: 28, borderRadius: 10, border: 'none', background: i === normalized.length - 1 ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.08)', color: i === normalized.length - 1 ? '#4d5a73' : '#cdd9ee', cursor: i === normalized.length - 1 ? 'default' : 'pointer', fontWeight: 900 }}>▼</button>
                  </div>
                  <button onClick={() => toggleSelect(i)} style={{ height: 38, borderRadius: 12, border: '2px solid', borderColor: sel.has(i) ? '#6C5CE7' : 'rgba(255,255,255,.15)', background: sel.has(i) ? 'rgba(108,92,231,.35)' : 'transparent', cursor: 'pointer', color: '#fff', fontWeight: 900 }}>{sel.has(i) ? '✓' : ''}</button>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 21, lineHeight: 1.35, color: '#fff', marginBottom: 10 }}><span style={{ color: '#A78BFA' }}>S{i + 1}.</span> {q.q}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
                      {q.o.map((option, oi) => <div key={oi} style={{ padding: '10px 12px', borderRadius: 14, fontSize: 15, fontWeight: 700, background: oi === q.a ? 'rgba(46,204,113,.15)' : 'rgba(255,255,255,.04)', color: oi === q.a ? '#8CF0B9' : '#D7E3F7', border: oi === q.a ? '1px solid rgba(46,204,113,.24)' : '1px solid rgba(255,255,255,.06)' }}>{LETTERS[oi]}. {option}</div>)}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                      {q.topicTag ? <span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(255,255,255,.06)', fontSize: 12 }}>{q.topicTag}</span> : null}
                      {q.hint ? <span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(78,205,196,.12)', fontSize: 12 }}>İpucu var</span> : null}
                      {q.explanation ? <span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(255,230,109,.12)', fontSize: 12 }}>Açıklama var</span> : null}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <button onClick={() => startEdit(i)} style={{ width: 42, height: 42, borderRadius: 14, border: 'none', background: 'rgba(108,92,231,.22)', cursor: 'pointer', fontSize: 16 }}>✏️</button>
                    <button onClick={() => deleteQuestion(i)} style={{ width: 42, height: 42, borderRadius: 14, border: 'none', background: 'rgba(231,76,60,.18)', cursor: 'pointer', fontSize: 16 }}>🗑</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ minHeight: 0, background: 'linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.03))', borderRadius: 24, border: '1px solid rgba(255,255,255,.08)', overflow: 'auto', padding: 18, display: 'grid', gap: 12, alignContent: 'start' }}>
          <div style={{ fontSize: 22, fontWeight: 900 }}>📥 Toplu ekleme</div>
          <div style={{ color: '#8EA2BE', lineHeight: 1.55 }}>JSON dizisi ya da CSV/TSV biçiminde veriyi buraya yapıştır. Excel'den kopyalanan satırlar sekmeli olarak da çalışır.</div>
          <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder='Soru,Seçenek1,Seçenek2,Seçenek3,Seçenek4,0,İpucu,Açıklama,Konu' rows={10} style={{ ...inputStyle, resize: 'vertical' }} />
          <button onClick={applyBulkPaste} style={{ padding: '14px 18px', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg,#6C5CE7,#a855f7)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>Toplu Veriyi Ekle</button>
          <div style={{ padding: 14, borderRadius: 16, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Canlı önizleme</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{(normalized[0] || newQuestion).q || 'Soru metni burada görünecek'}</div>
            <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>{(normalized[0] || newQuestion).o.map((option, index) => <div key={index} style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,.04)' }}>{LETTERS[index]}. {option || 'Boş seçenek'}</div>)}</div>
          </div>
        </div>

        <div style={{ minHeight: 0, background: 'linear-gradient(180deg, rgba(46,204,113,.10), rgba(46,204,113,.04))', border: '1px solid rgba(46,204,113,.22)', borderRadius: 24, padding: 18, overflow: 'auto', display: showAdd ? 'grid' : 'none', alignContent: 'start', gap: 10 }}>
          <div style={{ fontSize: 25, fontWeight: 900, color: '#fff' }}>➕ Yeni Soru</div>
          <div style={{ color: '#B5F5D1', fontSize: 14, lineHeight: 1.55 }}>Sürükle bırak, medya alanları, ipucu ve oyun tipi etiketleri ile premium soru hazırlama.</div>
          {renderForm(newQuestion, setNewQuestion)}
          <button onClick={addQuestion} style={{ marginTop: 4, padding: '15px 18px', borderRadius: 16, fontWeight: 900, fontSize: 16, background: 'linear-gradient(135deg,#2ecc71,#27ae60)', color: '#fff', border: 'none', cursor: 'pointer' }}>Soruyu Ekle</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', background: 'rgba(8,13,31,.72)', padding: '14px 16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,.08)' }}>
        <div style={{ color: err ? '#FF9A9A' : '#9FB3CD', fontWeight: 800, fontSize: 15 }}>{err || 'Hazırsan seçili soruları oyun modlarına taşı.'}</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => { setScr('home'); SFX.click(); }} style={{ padding: '12px 18px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>← Geri</button>
          <button onClick={confirmQuestions} style={{ padding: '14px 26px', borderRadius: '16px', fontSize: '17px', fontWeight: '900', background: selectedCount >= 4 ? 'linear-gradient(135deg,#6C5CE7,#a855f7)' : 'rgba(255,255,255,.06)', color: selectedCount >= 4 ? '#fff' : '#555', border: 'none', cursor: selectedCount >= 4 ? 'pointer' : 'default' }}>🎮 {selectedCount} Soru ile Devam</button>
        </div>
      </div>
    </div>
  );
}
