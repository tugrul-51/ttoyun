import { useEffect, useMemo, useRef, useState } from 'react';
import { SFX } from '../utils/audio';
import BrandMark from './common/BrandMark';

const LETTERS = ['A', 'B', 'C', 'D'];
const GAME_TYPES = ['quiz', 'balloon', 'wheel', 'memory', 'truefalse', 'millionaire', 'whack', 'race', 'dice', 'openbox', 'bomb', 'treasure', 'monster', 'chef', 'hero', 'dino'];

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

function buildQuestionFingerprint(question = {}) {
  return String(question.q || '').trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ');
}

function getQuestionIssues(question = {}, collection = [], index = -1) {
  const normalizedQuestion = normalizeQuestion(question);
  const issues = [];
  if (!normalizedQuestion.q.trim()) issues.push('Soru metni boş olamaz.');
  if (normalizedQuestion.o.some((option) => !String(option || '').trim())) issues.push('4 seçeneğin tamamı doldurulmalı.');
  if (!Number.isInteger(normalizedQuestion.a) || normalizedQuestion.a < 0 || normalizedQuestion.a > 3 || !String(normalizedQuestion.o[normalizedQuestion.a] || '').trim()) issues.push('Doğru cevap seçilmelidir.');
  const dedupedOptions = new Set(normalizedQuestion.o.map((option) => String(option || '').trim().toLocaleLowerCase('tr-TR')).filter(Boolean));
  if (dedupedOptions.size !== normalizedQuestion.o.map((option) => String(option || '').trim()).filter(Boolean).length) issues.push('Aynı seçenek iki kez kullanılamaz.');
  const fingerprint = buildQuestionFingerprint(normalizedQuestion);
  if (fingerprint) {
    const duplicateIndex = collection.findIndex((item, itemIndex) => itemIndex !== index && buildQuestionFingerprint(item) === fingerprint);
    if (duplicateIndex !== -1) issues.push(`Bu soru zaten listede var (S${duplicateIndex + 1}).`);
  }
  return issues;
}

function validateIncomingQuestions(importedQuestions = [], existingQuestions = []) {
  const errors = [];
  const prepared = [];
  importedQuestions.forEach((question, importedIndex) => {
    const normalizedQuestion = normalizeQuestion(question);
    const issues = getQuestionIssues(normalizedQuestion, [...existingQuestions, ...prepared], existingQuestions.length + prepared.length);
    if (issues.length) {
      errors.push(`Aktarılan S${importedIndex + 1}: ${issues.join(' ')}`);
      return;
    }
    prepared.push(normalizedQuestion);
  });
  return { prepared, errors };
}


function parseImportedQuestionPayload(rawText = '') {
  const parsed = JSON.parse(rawText);
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.questions)) return parsed.questions;
  if (Array.isArray(parsed?.payload?.questions)) return parsed.payload.questions;
  if (Array.isArray(parsed?.data?.questions)) return parsed.data.questions;
  throw new Error('unsupported-json-shape');
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

function StatCard({ big, small, accent = 'rgba(255,255,255,.045)' }) {
  return (
    <div style={{ padding: '14px 16px', borderRadius: 18, background: accent, border: '1px solid rgba(255,255,255,.08)' }}>
      <div style={{ fontWeight: 900, color: '#fff', fontSize: 20 }}>{big}</div>
      <div style={{ fontSize: 12, color: '#A3B6D4', marginTop: 4 }}>{small}</div>
    </div>
  );
}

function SaveQuestionsDialog({
  open,
  name,
  setName,
  saveMeta,
  setSaveMeta,
  onClose,
  onSave,
  currentUser,
  activeSavedQuestionSet,
  topic,
  totalQuestions,
  selectedCount,
}) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'grid', placeItems: 'center', background: 'rgba(2,6,23,.52)', backdropFilter: 'blur(10px)', padding: 18 }}>
      <div style={{ width: 'min(760px, 100%)', borderRadius: 28, padding: 24, background: 'linear-gradient(180deg, rgba(10,16,38,.96), rgba(10,16,38,.9))', border: '1px solid rgba(255,255,255,.10)', boxShadow: '0 30px 80px rgba(0,0,0,.38)', display: 'grid', gap: 16, maxHeight: '92vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: '#A3B6D4', fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' }}>Üyelik ile kayıt</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: '#fff', marginTop: 6 }}>💾 Sorularını Kaydet</div>
            <div style={{ color: '#AFC2DF', marginTop: 8, lineHeight: 1.65 }}>{currentUser?.name || 'Üye'} hesabına bağlı bir isim ver. Klasör, etiket, oyun ayarı ve yayın moduyla birlikte saklanır.</div>
          </div>
          <button onClick={onClose} style={{ width: 44, height: 44, borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0,1fr))', gap: 10 }}>
          <StatCard big={totalQuestions} small='toplam soru' />
          <StatCard big={selectedCount} small='seçili soru' />
          <StatCard big={topic || 'Konu adı yok'} small='konu' />
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          <label style={{ color: '#E4ECFF', fontWeight: 800 }}>Soru seti adı</label>
          <input autoFocus value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') onSave(); }} placeholder='Örn: 5. sınıf peygamberler ünitesi - deneme 1' style={{ width: '100%', padding: '15px 16px', fontSize: 17, fontWeight: 700, background: 'rgba(0,0,0,.34)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 16, color: '#fff', outline: 'none', fontFamily: 'inherit' }} />
          {activeSavedQuestionSet?.id ? <div style={{ color: '#8EECC8', fontSize: 13, fontWeight: 700 }}>Bu kayıt daha önce açıldı. Aynı isimle kaydedersen mevcut set güncellenir.</div> : null}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
          <input value={saveMeta.folder} onChange={(event) => setSaveMeta((prev) => ({ ...prev, folder: event.target.value }))} placeholder='Klasör (örn. 5. Sınıf)' style={{ width: '100%', padding: '14px 16px', fontSize: 15, fontWeight: 700, background: 'rgba(0,0,0,.34)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 16, color: '#fff', outline: 'none', fontFamily: 'inherit' }} />
          <input value={saveMeta.tags} onChange={(event) => setSaveMeta((prev) => ({ ...prev, tags: event.target.value }))} placeholder='Etiketler (virgülle)' style={{ width: '100%', padding: '14px 16px', fontSize: 15, fontWeight: 700, background: 'rgba(0,0,0,.34)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 16, color: '#fff', outline: 'none', fontFamily: 'inherit' }} />
        </div>

        <textarea value={saveMeta.notes} onChange={(event) => setSaveMeta((prev) => ({ ...prev, notes: event.target.value }))} placeholder='Öğretmen notu / açıklama' rows={3} style={{ width: '100%', padding: '14px 16px', fontSize: 15, fontWeight: 700, background: 'rgba(0,0,0,.34)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 16, color: '#fff', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setSaveMeta((prev) => ({ ...prev, publishMode: 'edit' }))} style={{ padding: '12px 16px', borderRadius: 14, border: `1px solid ${saveMeta.publishMode === 'edit' ? '#6C5CE7' : 'rgba(255,255,255,.1)'}`, background: saveMeta.publishMode === 'edit' ? 'rgba(108,92,231,.22)' : 'rgba(255,255,255,.05)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Düzenleme modu</button>
          <button onClick={() => setSaveMeta((prev) => ({ ...prev, publishMode: 'published' }))} style={{ padding: '12px 16px', borderRadius: 14, border: `1px solid ${saveMeta.publishMode === 'published' ? '#2ecc71' : 'rgba(255,255,255,.1)'}`, background: saveMeta.publishMode === 'published' ? 'rgba(46,204,113,.2)' : 'rgba(255,255,255,.05)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Yayın modu</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={onClose} style={{ padding: '13px 18px', borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>İptal</button>
          <button onClick={onSave} style={{ padding: '13px 22px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#6C5CE7,#4ECDC4)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>{activeSavedQuestionSet?.id ? 'Kaydı Güncelle' : 'Kaydet'}</button>
        </div>
      </div>
    </div>
  );
}

export default function Editor({
  topic,
  qs,
  setQs,
  sel,
  setSel,
  setFqs,
  setScr,
  currentUser,
  onRequireMembership,
  onSaveQuestionSet,
  activeSavedQuestionSet,
  savePromptTicket,
  onPreview,
  onExportCurrentSet,
  autoDraft,
  onRestoreDraft,
  onDismissDraft,
  settings,
}) {
  const [workspace, setWorkspace] = useState('questions');
  const [editIdx, setEditIdx] = useState(null);
  const [editForm, setEditForm] = useState(createBlankQuestion());
  const [newQuestion, setNewQuestion] = useState(createBlankQuestion());
  const [bulkText, setBulkText] = useState('');
  const [dragIndex, setDragIndex] = useState(null);
  const [err, setErr] = useState('');
  const [importInfo, setImportInfo] = useState('CSV / JSON / TSV ve Excel uyumlu kopyala-yapıştır desteklenir.');
  const [successMessage, setSuccessMessage] = useState('');
  const [recentIndexes, setRecentIndexes] = useState([]);
  const [recentActionLabel, setRecentActionLabel] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState(activeSavedQuestionSet?.name || '');
  const [saveMeta, setSaveMeta] = useState({ folder: activeSavedQuestionSet?.folder || '', tags: (activeSavedQuestionSet?.tags || []).join(', '), publishMode: activeSavedQuestionSet?.publishMode || 'edit', notes: activeSavedQuestionSet?.notes || '' });
  const fileRef = useRef(null);
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 900 : false;

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    fontSize: '17px',
    fontWeight: '700',
    background: 'rgba(0,0,0,.34)',
    border: '1px solid rgba(255,255,255,.15)',
    borderRadius: '14px',
    color: '#fff',
    outline: 'none',
    fontFamily: 'inherit',
  };

  const normalized = useMemo(() => qs.map((q) => normalizeQuestion(q)), [qs]);
  const questionIssueMap = useMemo(() => normalized.map((question, index) => getQuestionIssues(question, normalized, index)), [normalized]);
  const blockingIssueCount = questionIssueMap.filter((issues) => issues.length).length;
  const selectedCount = sel.size;
  const announceQuestionSync = (label, indexes = [], badgeLabel = 'Yeni eklendi') => {
    setSuccessMessage(label);
    setRecentIndexes(indexes);
    setRecentActionLabel(badgeLabel);
    setErr('');
  };

  const extendSelectionWithIndexes = (indexes = []) => {
    if (!indexes.length) return;
    setSel((prev) => {
      const next = new Set(prev);
      indexes.forEach((index) => next.add(index));
      return next;
    });
  };

  const qualityChecks = useMemo(() => normalized.flatMap((question, index) => {
    const warnings = [];
    if ((question.q || '').length > 120) warnings.push(`S${index + 1}: soru metni çok uzun`);
    if ((question.o || []).some((option) => String(option || '').length > 42)) warnings.push(`S${index + 1}: bazı seçenekler ekranda taşabilir`);
    if (questionIssueMap[index]?.length) warnings.push(...questionIssueMap[index].map((issue) => `S${index + 1}: ${issue}`));
    return warnings;
  }), [normalized, questionIssueMap]);

  useEffect(() => {
    setSaveName(activeSavedQuestionSet?.name || (topic ? `${topic} soru seti` : 'Yeni soru seti'));
    setSaveMeta({
      folder: activeSavedQuestionSet?.folder || '',
      tags: (activeSavedQuestionSet?.tags || []).join(', '),
      publishMode: activeSavedQuestionSet?.publishMode || 'edit',
      notes: activeSavedQuestionSet?.notes || '',
    });
  }, [activeSavedQuestionSet?.id, activeSavedQuestionSet?.name, activeSavedQuestionSet?.folder, activeSavedQuestionSet?.tags, activeSavedQuestionSet?.publishMode, activeSavedQuestionSet?.notes, topic]);

  useEffect(() => {
    if (!savePromptTicket || !currentUser) return;
    setSaveDialogOpen(true);
  }, [savePromptTicket, currentUser]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timeoutId = setTimeout(() => setSuccessMessage(''), 3200);
    return () => clearTimeout(timeoutId);
  }, [successMessage]);

  useEffect(() => {
    if (!recentIndexes.length) return undefined;
    const timeoutId = setTimeout(() => {
      setRecentIndexes([]);
      setRecentActionLabel('');
    }, 4200);
    return () => clearTimeout(timeoutId);
  }, [recentIndexes]);

  const updateEditOption = (index, value, targetSetter, source) => {
    const next = [...source.o];
    next[index] = value;
    targetSetter({ ...source, o: next });
  };

  const toggleSelect = (i) => setSel((prev) => {
    const next = new Set(prev);
    next.has(i) ? next.delete(i) : next.add(i);
    return next;
  });

  const startEdit = (i) => {
    setEditIdx(i);
    setEditForm(normalizeQuestion(normalized[i]));
    setWorkspace('questions');
  };

  const saveEdit = () => {
    const candidate = normalizeQuestion(editForm);
    const issues = getQuestionIssues(candidate, normalized, editIdx);
    if (issues.length) {
      setErr(`Düzenlenen soru kaydedilemedi: ${issues.join(' ')}`);
      setSuccessMessage('');
      SFX.wrong();
      return;
    }
    const updated = [...normalized];
    updated[editIdx] = candidate;
    setQs(updated);
    setEditIdx(null);
    setErr('');
    announceQuestionSync('Soru güncellendi ve kalite kontrolünden geçti.', [editIdx], 'Güncellendi');
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
    const candidate = normalizeQuestion(newQuestion);
    const issues = getQuestionIssues(candidate, normalized, -1);
    if (issues.length) {
      setErr(`Yeni soru eklenemedi: ${issues.join(' ')}`);
      setSuccessMessage('');
      SFX.wrong();
      return;
    }
    const addedIndex = normalized.length;
    setQs([...normalized, candidate]);
    extendSelectionWithIndexes([addedIndex]);
    setNewQuestion(createBlankQuestion());
    setWorkspace('questions');
    announceQuestionSync('Yeni eklenen soru ana editöre eklendi ve seçili hale getirildi.', [addedIndex], 'Manuel eklendi');
    SFX.correct();
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    let imported = [];
    try {
      if (file.name.endsWith('.json')) imported = parseImportedQuestionPayload(text).map((item) => normalizeQuestion(item));
      else if (file.name.endsWith('.tsv') || file.type.includes('tab')) imported = parseDelimited(text, '	');
      else imported = parseDelimited(text, ',');
      if (!imported.length) throw new Error('İçerik okunamadı');
      const { prepared, errors } = validateIncomingQuestions(imported, normalized);
      if (errors.length) throw new Error(errors.slice(0, 3).join(' • '));
      const startIndex = normalized.length;
      const importedIndexes = Array.from({ length: prepared.length }, (_, offset) => startIndex + offset);
      setQs([...normalized, ...prepared]);
      extendSelectionWithIndexes(importedIndexes);
      setImportInfo(`${imported.length} soru içe aktarıldı.`);
      setWorkspace('questions');
      announceQuestionSync(`${imported.length} soru ana editöre aktarıldı ve seçildi.`, importedIndexes, 'İçe aktarıldı');
      SFX.win();
    } catch {
      setImportInfo('Dosya okunamadı. JSON dizi veya CSV/TSV deneyin.');
      setErr('Dosya okunamadı. JSON dizi veya CSV/TSV deneyin.');
      setSuccessMessage('');
      SFX.wrong();
    }
    event.target.value = '';
  };

  const applyBulkPaste = () => {
    let imported = [];
    try {
      if (/^[[{]/.test(bulkText.trim())) imported = parseImportedQuestionPayload(bulkText).map((item) => normalizeQuestion(item));
      else imported = bulkText.includes('	') ? parseDelimited(bulkText, '	') : parseDelimited(bulkText, ',');
      if (!imported.length) throw new Error('empty');
      const { prepared, errors } = validateIncomingQuestions(imported, normalized);
      if (errors.length) throw new Error(errors.slice(0, 3).join(' • '));
      const startIndex = normalized.length;
      const importedIndexes = Array.from({ length: prepared.length }, (_, offset) => startIndex + offset);
      setQs([...normalized, ...prepared]);
      extendSelectionWithIndexes(importedIndexes);
      setBulkText('');
      setImportInfo(`${imported.length} soru toplu olarak eklendi.`);
      setWorkspace('questions');
      announceQuestionSync(`${imported.length} soru ana editöre aktarıldı ve seçildi.`, importedIndexes, 'İçe aktarıldı');
      SFX.win();
    } catch {
      setErr('Toplu veri okunamadı. JSON / CSV / TSV biçimini kontrol et.');
      setSuccessMessage('');
      SFX.wrong();
    }
  };

  const confirmQuestions = () => {
    const selectedIndexes = Array.from(sel).sort((a, b) => a - b);
    const chosen = normalized.filter((_, i) => sel.has(i));
    if (chosen.length < 4) {
      setErr('Devam etmek için en az 4 soru seç.');
      return;
    }
    const invalidSelected = selectedIndexes.map((index) => ({ index, issues: questionIssueMap[index] || [] })).filter((entry) => entry.issues.length);
    if (invalidSelected.length) {
      setErr(`Seçili sorular içinde düzeltilmesi gereken alanlar var: ${invalidSelected.slice(0, 3).map((entry) => `S${entry.index + 1}`).join(', ')}`);
      SFX.wrong();
      return;
    }
    setFqs(chosen);
    setScr('game-settings');
    SFX.win();
  };

  const handleOpenSaveDialog = () => {
    if (!currentUser) {
      onRequireMembership?.();
      return;
    }
    setSaveName(activeSavedQuestionSet?.name || (topic ? `${topic} soru seti` : 'Yeni soru seti'));
    setSaveDialogOpen(true);
  };

  const handleSaveQuestionSet = () => {
    const selectedIndexes = Array.from(sel).sort((a, b) => a - b);
    const invalidSelected = selectedIndexes.filter((index) => (questionIssueMap[index] || []).length);
    if (invalidSelected.length) {
      setErr(`Kayıttan önce bu soruları düzelt: ${invalidSelected.slice(0, 4).map((index) => `S${index + 1}`).join(', ')}`);
      SFX.wrong();
      return;
    }
    const result = onSaveQuestionSet?.({
      id: activeSavedQuestionSet?.id,
      name: saveName,
      topic,
      questions: normalized,
      selectedIndexes,
      folder: saveMeta.folder,
      tags: saveMeta.tags,
      publishMode: saveMeta.publishMode,
      notes: saveMeta.notes,
      settingsSnapshot: settings,
    });
    if (result?.id) {
      setSaveDialogOpen(false);
      setErr('');
      SFX.win();
      return;
    }
    if (!saveName.trim()) setErr('Kaydetmek için soru setine bir isim ver.');
  };

  const renderForm = (form, setForm) => (
    <div style={{ display: 'grid', gap: 10 }}>
      <textarea value={form.q} onChange={(e) => setForm({ ...form, q: e.target.value })} placeholder='Soru metni' rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0,1fr))', gap: 10 }}>
        {form.o.map((option, index) => (
          <div key={index} style={{ display: 'grid', gridTemplateColumns: '48px 1fr', gap: 10, alignItems: 'center' }}>
            <button onClick={() => setForm({ ...form, a: index })} style={{ height: 48, borderRadius: 14, border: '2px solid', borderColor: form.a === index ? '#2ecc71' : 'rgba(255,255,255,.15)', background: form.a === index ? 'rgba(46,204,113,.26)' : 'transparent', cursor: 'pointer', color: '#fff', fontWeight: 900 }}>{LETTERS[index]}</button>
            <input value={option} onChange={(e) => updateEditOption(index, e.target.value, setForm, form)} placeholder={`Seçenek ${index + 1}`} style={inputStyle} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
        <input value={form.hint} onChange={(e) => setForm({ ...form, hint: e.target.value })} placeholder='İpucu' style={inputStyle} />
        <input value={form.topicTag} onChange={(e) => setForm({ ...form, topicTag: e.target.value })} placeholder='Konu etiketi' style={inputStyle} />
      </div>
      <textarea value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} placeholder='Açıklama / öğretici geri bildirim' rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0,1fr))', gap: 10 }}>
        <input value={form.media.image} onChange={(e) => setForm({ ...form, media: { ...form.media, image: e.target.value } })} placeholder='Görsel URL' style={inputStyle} />
        <input value={form.media.audio} onChange={(e) => setForm({ ...form, media: { ...form.media, audio: e.target.value } })} placeholder='Ses URL' style={inputStyle} />
        <input value={form.media.video} onChange={(e) => setForm({ ...form, media: { ...form.media, video: e.target.value } })} placeholder='Video URL' style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0,1fr))' : 'repeat(5, minmax(0,1fr))', gap: 8 }}>
        {GAME_TYPES.map((game) => {
          const active = form.games.includes(game);
          return (
            <button key={game} onClick={() => setForm({ ...form, games: active ? form.games.filter((x) => x !== game) : [...form.games, game] })} style={{ padding: '10px 12px', borderRadius: 12, border: `1px solid ${active ? 'rgba(78,205,196,.34)' : 'rgba(255,255,255,.10)'}`, background: active ? 'rgba(78,205,196,.12)' : 'rgba(255,255,255,.04)', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 12 }}>{game}</button>
          );
        })}
      </div>
    </div>
  );

  const tabs = [
    { id: 'questions', label: '📝 Soru Editörü', desc: 'Yapay zekanın ürettiği sorular doğrudan burada.' },
    { id: 'add', label: '➕ Soru Ekle', desc: 'Yeni soruyu ayrı sayfada ekle.' },
    { id: 'import', label: '📥 İçe Aktar', desc: 'CSV / JSON / TSV dosyalarını ayrı sayfada al.' },
  ];

  const questionPreviewSource = normalized[0] || newQuestion;
  const remainingUnselected = normalized.length - selectedCount;
  const invalidSelectedCount = Array.from(sel).filter((index) => (questionIssueMap[index] || []).length).length;

  return (
    <>
      <SaveQuestionsDialog
        open={saveDialogOpen}
        name={saveName}
        setName={setSaveName}
        saveMeta={saveMeta}
        setSaveMeta={setSaveMeta}
        onClose={() => setSaveDialogOpen(false)}
        onSave={handleSaveQuestionSet}
        currentUser={currentUser}
        activeSavedQuestionSet={activeSavedQuestionSet}
        topic={topic}
        totalQuestions={normalized.length}
        selectedCount={selectedCount}
      />

      {autoDraft ? (
        <div style={{ width: '100%', maxWidth: '1450px', margin: '0 auto', padding: '12px 14px', borderRadius: 18, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ color: '#DCE8F7', fontWeight: 800 }}>📝 Otomatik taslak bulundu: {autoDraft.sourceName || autoDraft.topic || 'Adsız taslak'} • {new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(autoDraft.updatedAt))}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => onRestoreDraft?.(autoDraft)} style={{ padding: '10px 14px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#6C5CE7,#4ECDC4)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>Taslağı Geri Yükle</button>
            <button onClick={() => onDismissDraft?.(autoDraft.id)} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.05)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Taslağı Kapat</button>
          </div>
        </div>
      ) : null}

      <div style={{ height: '100%', width: '100%', maxWidth: '1450px', margin: '0 auto', display: 'grid', gridTemplateRows: 'auto auto auto 1fr auto', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <BrandMark size={80} />
            <div>
              <div style={{ color: '#A3B6D4', fontSize: 12, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' }}>Final kalite soru merkezi</div>
              <h1 style={{ fontSize: 'clamp(28px,4vw,40px)', margin: '4px 0 6px', fontWeight: 900, color: '#fff' }}>📝 Soru Editörü</h1>
              <p style={{ color: '#94A6C4', fontSize: 16, margin: 0 }}>{topic || 'Konu bekleniyor'} • {normalized.length} soru • Sorular doğrudan burada • Ekle ve içe aktar ayrı sayfalarda</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0,1fr))' : 'repeat(4, minmax(120px, 1fr))', gap: 10, minWidth: 0, width: isMobile ? '100%' : 'auto' }}>
            <StatCard big={selectedCount} small='seçili soru' />
            <StatCard big={normalized.length} small='toplam soru' />
            <StatCard big={remainingUnselected} small='pasif soru' accent='rgba(255,255,255,.03)' />
            <StatCard big={blockingIssueCount} small='düzeltilecek soru' accent={blockingIssueCount ? 'rgba(255,107,107,.12)' : 'rgba(46,204,113,.10)'} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
          {tabs.map((tab) => {
            const active = workspace === tab.id;
            return (
              <button key={tab.id} onClick={() => setWorkspace(tab.id)} style={{ padding: '14px 16px', borderRadius: 18, border: `1px solid ${active ? 'rgba(78,205,196,.34)' : 'rgba(255,255,255,.08)'}`, background: active ? 'linear-gradient(135deg, rgba(108,92,231,.22), rgba(78,205,196,.18))' : 'rgba(255,255,255,.04)', color: '#fff', textAlign: 'left', cursor: 'pointer', display: 'grid', gap: 6 }}>
                <div style={{ fontWeight: 900, fontSize: 17 }}>{tab.label}</div>
                <div style={{ color: '#B9C8DD', fontSize: 13, lineHeight: 1.45 }}>{tab.desc}</div>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', background: 'rgba(255,255,255,.04)', borderRadius: 20, padding: 14, border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ color: '#8EA2BE', fontWeight: 700, lineHeight: 1.6 }}>{workspace === 'questions' ? `Yapay zekadan gelen sorular burada açılır. İstersen sırala, seç, düzenle veya sil. ${blockingIssueCount ? `${blockingIssueCount} soru kalite kontrolü bekliyor.` : 'Tüm sorular şu anda geçerli görünüyor.'}` : workspace === 'add' ? 'Bu sayfa yalnızca yeni soru eklemek için ayrıldı. Eklediğin soru doğrudan ana editör listesine düşer.' : importInfo}</div>
          {successMessage ? <div style={{ padding: '10px 14px', borderRadius: 14, background: 'rgba(46,204,113,.12)', border: '1px solid rgba(46,204,113,.24)', color: '#B8F7D1', fontWeight: 800 }}>✅ {successMessage}</div> : null}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => setSel(new Set(normalized.map((_, i) => i)))} style={{ padding: '12px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>✅ Tümünü Seç</button>
            <button onClick={() => setSel(new Set())} style={{ padding: '12px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>⬜ Temizle</button>
            {workspace === 'import' ? <button onClick={() => fileRef.current?.click()} style={{ padding: '12px 16px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#6C5CE7,#4ECDC4)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>📁 Dosya Seç</button> : null}
            <input ref={fileRef} type='file' accept='.json,.csv,.tsv,.txt' onChange={handleImportFile} style={{ display: 'none' }} />
          </div>
        </div>

        <div style={{ minHeight: 0 }}>
          {workspace === 'questions' ? (
            <div style={{ minHeight: 0, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.25fr .75fr', gap: 16 }}>
              <div style={{ minHeight: 0, background: 'linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.03))', borderRadius: 24, border: '1px solid rgba(255,255,255,.08)', overflow: 'auto', padding: 16, display: 'grid', gap: 12 }}>
                {normalized.length ? normalized.map((q, i) => (
                  <div key={i} draggable onDragStart={() => setDragIndex(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragIndex !== null && dragIndex !== i) moveQuestion(dragIndex, i); setDragIndex(null); }} style={{ background: recentIndexes.includes(i) ? 'rgba(46,204,113,.10)' : sel.has(i) ? 'rgba(108,92,231,.12)' : 'rgba(255,255,255,.035)', border: recentIndexes.includes(i) ? '2px solid rgba(46,204,113,.34)' : sel.has(i) ? '2px solid rgba(108,92,231,.34)' : '2px solid rgba(255,255,255,.06)', borderRadius: 20, padding: 16, boxShadow: recentIndexes.includes(i) ? '0 0 0 1px rgba(46,204,113,.08), 0 16px 32px rgba(46,204,113,.08)' : 'none' }}>
                    {editIdx === i ? (
                      <div style={{ display: 'grid', gap: 10 }}>
                        {renderForm(editForm, setEditForm)}
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <button onClick={saveEdit} style={{ padding: '12px 20px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#2ecc71,#27ae60)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>Kaydet</button>
                          <button onClick={() => setEditIdx(null)} style={{ padding: '12px 20px', borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>İptal</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '36px 36px minmax(0,1fr)' : '36px 36px 1fr auto', gap: 12, alignItems: 'start' }}>
                        <div style={{ display: 'grid', gap: 6 }}>
                          <button onClick={() => moveQuestion(i, i - 1)} disabled={i === 0} style={{ height: 28, borderRadius: 10, border: 'none', background: i === 0 ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.08)', color: i === 0 ? '#4d5a73' : '#cdd9ee', cursor: i === 0 ? 'default' : 'pointer', fontWeight: 900 }}>▲</button>
                          <button onClick={() => moveQuestion(i, i + 1)} disabled={i === normalized.length - 1} style={{ height: 28, borderRadius: 10, border: 'none', background: i === normalized.length - 1 ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.08)', color: i === normalized.length - 1 ? '#4d5a73' : '#cdd9ee', cursor: i === normalized.length - 1 ? 'default' : 'pointer', fontWeight: 900 }}>▼</button>
                        </div>
                        <button onClick={() => toggleSelect(i)} style={{ height: 38, borderRadius: 12, border: '2px solid', borderColor: sel.has(i) ? '#6C5CE7' : 'rgba(255,255,255,.15)', background: sel.has(i) ? 'rgba(108,92,231,.35)' : 'transparent', cursor: 'pointer', color: '#fff', fontWeight: 900 }}>{sel.has(i) ? '✓' : ''}</button>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: 21, lineHeight: 1.35, color: '#fff', marginBottom: 10 }}><span style={{ color: '#A78BFA' }}>S{i + 1}.</span> {q.q}</div>
                          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0,1fr))', gap: 8 }}>
                            {q.o.map((option, oi) => <div key={oi} style={{ padding: '10px 12px', borderRadius: 14, fontSize: 15, fontWeight: 700, background: oi === q.a ? 'rgba(46,204,113,.15)' : 'rgba(255,255,255,.04)', color: oi === q.a ? '#8CF0B9' : '#D7E3F7', border: oi === q.a ? '1px solid rgba(46,204,113,.24)' : '1px solid rgba(255,255,255,.06)' }}>{LETTERS[oi]}. {option}</div>)}
                          </div>
                          {questionIssueMap[i]?.length ? (
                            <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
                              {questionIssueMap[i].map((issue) => <div key={issue} style={{ padding: '8px 10px', borderRadius: 12, background: 'rgba(255,107,107,.10)', border: '1px solid rgba(255,107,107,.16)', color: '#FFD5D5', fontSize: 13, fontWeight: 700 }}>⚠️ {issue}</div>)}
                            </div>
                          ) : null}
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                            {recentIndexes.includes(i) ? <span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(46,204,113,.16)', border: '1px solid rgba(46,204,113,.28)', fontSize: 12, color: '#B8F7D1', fontWeight: 800 }}>{recentActionLabel || 'Yeni eklendi'}</span> : null}
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
                )) : <div style={{ padding: 22, borderRadius: 20, background: 'rgba(255,255,255,.04)', color: '#D7E3F7', fontWeight: 700, lineHeight: 1.7 }}>Henüz soru yok. Konuyu ana sayfadan yapay zekaya ver veya bu editörde <strong>Soru Ekle</strong> / <strong>İçe Aktar</strong> sayfalarını kullan.</div>}
              </div>
              <div style={{ minHeight: 0, display: 'grid', gap: 16, alignContent: 'start' }}>
                <div style={{ padding: 18, borderRadius: 24, background: 'linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.03))', border: '1px solid rgba(255,255,255,.08)', display: 'grid', gap: 12 }}>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>🧭 Editör özeti</div>
                  <div style={{ color: '#AFC2DF', lineHeight: 1.65 }}>Bu ana sayfa yalnızca sorularını görmen, seçmen ve düzenlemen için ayrıldı. Yeni soru ekleme ve içe aktarma ayrı çalışma alanlarında yapılır; eklenen her soru otomatik olarak bu listeye düşer ve seçili hale gelir.</div>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                    <StatCard big={selectedCount} small='oyuna gidecek soru' accent='rgba(108,92,231,.12)' />
                    <StatCard big={normalized.length} small='editörde görünen soru' />
                  </div>
                </div>
                <div style={{ padding: 18, borderRadius: 24, background: 'linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.03))', border: '1px solid rgba(255,255,255,.08)', display: 'grid', gap: 12 }}>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>🔎 Canlı önizleme</div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{questionPreviewSource.q || 'Soru metni burada görünecek'}</div>
                  <div style={{ display: 'grid', gap: 8 }}>{questionPreviewSource.o.map((option, index) => <div key={index} style={{ padding: '10px 12px', borderRadius: 12, background: index === questionPreviewSource.a ? 'rgba(46,204,113,.12)' : 'rgba(255,255,255,.04)', color: index === questionPreviewSource.a ? '#9FF3C2' : '#D7E3F7' }}>{LETTERS[index]}. {option || 'Boş seçenek'}</div>)}</div>
                </div>
                <div style={{ padding: 18, borderRadius: 24, background: 'linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.03))', border: '1px solid rgba(255,255,255,.08)', display: 'grid', gap: 12 }}>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>🛡 Kalite kontrolü</div>
                  {qualityChecks.length ? <div style={{ display: 'grid', gap: 6 }}>{qualityChecks.slice(0, 8).map((warning) => <div key={warning} style={{ color: '#FFD7A8', fontSize: 13 }}>• {warning}</div>)}{qualityChecks.length > 8 ? <div style={{ color: '#9FB3CD', fontSize: 12 }}>+{qualityChecks.length - 8} ek uyarı</div> : null}</div> : <div style={{ color: '#9FF3C2', fontSize: 14 }}>Belirgin kalite uyarısı bulunmuyor.</div>}
                </div>
              </div>
            </div>
          ) : null}

          {workspace === 'add' ? (
            <div style={{ minHeight: 0, display: 'grid', gridTemplateColumns: '1.08fr .92fr', gap: 16 }}>
              <div style={{ minHeight: 0, background: 'linear-gradient(180deg, rgba(46,204,113,.10), rgba(46,204,113,.04))', border: '1px solid rgba(46,204,113,.22)', borderRadius: 24, padding: 18, overflow: 'auto', display: 'grid', alignContent: 'start', gap: 12 }}>
                <div style={{ fontSize: 25, fontWeight: 900, color: '#fff' }}>➕ Yeni Soru Ekle</div>
                <div style={{ color: '#B5F5D1', fontSize: 14, lineHeight: 1.55 }}>Bu sayfa yalnızca yeni soru hazırlamak için ayrıldı. Sorunu, 4 şıkkı, ipucu ve açıklamayı doldur. Kaydettiğinde ana editöre geri düşer.</div>
                {renderForm(newQuestion, setNewQuestion)}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button onClick={addQuestion} style={{ marginTop: 4, padding: '15px 18px', borderRadius: 16, fontWeight: 900, fontSize: 16, background: 'linear-gradient(135deg,#2ecc71,#27ae60)', color: '#fff', border: 'none', cursor: 'pointer' }}>Soruyu Ekle</button>
                  <button onClick={() => setWorkspace('questions')} style={{ marginTop: 4, padding: '15px 18px', borderRadius: 16, fontWeight: 900, fontSize: 16, background: 'rgba(108,92,231,.18)', color: '#fff', border: '1px solid rgba(108,92,231,.24)', cursor: 'pointer' }}>Ana Editöre Dön</button>
                  <button onClick={() => { setNewQuestion(createBlankQuestion()); setErr(''); setSuccessMessage(''); }} style={{ marginTop: 4, padding: '15px 18px', borderRadius: 16, fontWeight: 900, fontSize: 16, background: 'rgba(255,255,255,.05)', color: '#fff', border: '1px solid rgba(255,255,255,.10)', cursor: 'pointer' }}>Formu Temizle</button>
                </div>
              </div>
              <div style={{ minHeight: 0, display: 'grid', gap: 16, alignContent: 'start' }}>
                <div style={{ padding: 18, borderRadius: 24, background: 'linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.03))', border: '1px solid rgba(255,255,255,.08)', display: 'grid', gap: 12 }}>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>👀 Ekleme önizlemesi</div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{newQuestion.q || 'Burada yeni soru metni görünür.'}</div>
                  <div style={{ display: 'grid', gap: 8 }}>{newQuestion.o.map((option, index) => <div key={index} style={{ padding: '10px 12px', borderRadius: 12, background: index === newQuestion.a ? 'rgba(46,204,113,.12)' : 'rgba(255,255,255,.04)', color: index === newQuestion.a ? '#9FF3C2' : '#D7E3F7' }}>{LETTERS[index]}. {option || 'Boş seçenek'}</div>)}</div>
                </div>
                <div style={{ padding: 18, borderRadius: 24, background: 'linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.03))', border: '1px solid rgba(255,255,255,.08)', display: 'grid', gap: 10 }}>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>📌 İpucu</div>
                  <div style={{ color: '#BFD1E8', lineHeight: 1.65 }}>Soru eklendiğinde otomatik olarak ana soru editörüne düşer, seçili hale gelir ve yeşil vurgu ile görünür. Böylece manuel eklenen sorunun listeye gelip gelmediğini hemen anlarsın.</div>
                </div>
              </div>
            </div>
          ) : null}

          {workspace === 'import' ? (
            <div style={{ minHeight: 0, display: 'grid', gridTemplateColumns: '1.08fr .92fr', gap: 16 }}>
              <div style={{ minHeight: 0, background: 'linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.03))', borderRadius: 24, border: '1px solid rgba(255,255,255,.08)', overflow: 'auto', padding: 18, display: 'grid', gap: 12, alignContent: 'start' }}>
                <div style={{ fontSize: 25, fontWeight: 900, color: '#fff' }}>📥 Soru İçe Aktar</div>
                <div style={{ color: '#8EA2BE', lineHeight: 1.6 }}>JSON dizisi, bu editörden dışa aktarılan JSON dosyası ya da CSV/TSV biçimindeki veriyi buraya yapıştır. Excel’den kopyalanan satırlar sekmeli olarak da çalışır.</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => fileRef.current?.click()} style={{ padding: '13px 18px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#6C5CE7,#4ECDC4)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>📁 Dosya İçe Aktar</button>
                  <button onClick={applyBulkPaste} style={{ padding: '13px 18px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#6C5CE7,#a855f7)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>Toplu Veriyi Ekle</button>
                  <button onClick={() => setWorkspace('questions')} style={{ padding: '13px 18px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>Ana Editöre Dön</button>
                </div>
                <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder='Soru,Seçenek1,Seçenek2,Seçenek3,Seçenek4,0,İpucu,Açıklama,Konu' rows={14} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ minHeight: 0, display: 'grid', gap: 16, alignContent: 'start' }}>
                <div style={{ padding: 18, borderRadius: 24, background: 'linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.03))', border: '1px solid rgba(255,255,255,.08)', display: 'grid', gap: 12 }}>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>🗂 Desteklenen biçimler</div>
                  <div style={{ color: '#D7E3F7', lineHeight: 1.65 }}>JSON dizi, bu editörden dışa aktarılan JSON dosyası, CSV, TSV ve Excel’den kopyala-yapıştır desteklenir. İçe aktardığında sorular ana soru editörüne aktarılır, seçili hale gelir ve yeşil vurgu ile görünür.</div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {['JSON dizi', 'CSV tablo', 'TSV / Excel yapıştırma'].map((item) => <div key={item} style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,.04)', color: '#E9F0FF', fontWeight: 700 }}>{item}</div>)}
                  </div>
                </div>
                <div style={{ padding: 18, borderRadius: 24, background: 'linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.03))', border: '1px solid rgba(255,255,255,.08)', display: 'grid', gap: 12 }}>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>🛡 Kalite kontrolü</div>
                  {qualityChecks.length ? <div style={{ display: 'grid', gap: 6 }}>{qualityChecks.slice(0, 8).map((warning) => <div key={warning} style={{ color: '#FFD7A8', fontSize: 13 }}>• {warning}</div>)}{qualityChecks.length > 8 ? <div style={{ color: '#9FB3CD', fontSize: 12 }}>+{qualityChecks.length - 8} ek uyarı</div> : null}</div> : <div style={{ color: '#9FF3C2', fontSize: 14 }}>Belirgin kalite uyarısı bulunmuyor.</div>}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', background: 'rgba(8,13,31,.72)', padding: '14px 16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ color: err ? '#FF9A9A' : '#9FB3CD', fontWeight: 800, fontSize: 15 }}>{err || (invalidSelectedCount ? `${invalidSelectedCount} seçili soru önce düzeltme bekliyor.` : 'Hazırsan seçili soruları oyun modlarına taşı veya hesabına kaydet.')}</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => { setScr('home'); SFX.click(); }} style={{ padding: '12px 18px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>← Geri</button>
            <button onClick={() => onPreview?.()} style={{ padding: '12px 18px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>👁️ Önizleme</button>
            <button onClick={() => onExportCurrentSet?.('json')} style={{ padding: '12px 18px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>JSON Dışa Aktar (İçe Aktar Uyumlu)</button>
            <button onClick={handleOpenSaveDialog} style={{ padding: '12px 18px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.06)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>💾 Sorularını Kaydet</button>
            <button onClick={confirmQuestions} style={{ padding: '14px 26px', borderRadius: '16px', fontSize: '17px', fontWeight: '900', background: selectedCount >= 4 ? 'linear-gradient(135deg,#6C5CE7,#a855f7)' : 'rgba(255,255,255,.06)', color: selectedCount >= 4 ? '#fff' : '#555', border: 'none', cursor: selectedCount >= 4 ? 'pointer' : 'default' }}>🎮 Oyun ayarlarını aç</button>
          </div>
        </div>
      </div>
    </>
  );
}
