import { useMemo, useState } from 'react';
import { GAME_CATEGORIES, MODES } from '../constants/gameRegistry';
import { SFX } from '../utils/audio';
import { shuffleArray } from '../utils/gameAnalytics';
import { buildQuestionSignature, buildUpdatedQuestionSettings, getGameQuestionProfile, getGameQuestionSummary } from '../utils/gameQuestionSelection';
import BrandMark from './common/BrandMark';

const DURATION_OPTIONS = [10, 15, 20, 30, 45, 60, 9999];
const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Kolay', desc: 'Daha uzun süre, daha affedici akış' },
  { value: 'medium', label: 'Orta', desc: 'Dengeli sınıf modu' },
  { value: 'hard', label: 'Zor', desc: 'Daha hızlı ve daha rekabetçi' },
];
const ROLE_OPTIONS = [
  { value: 'teacher', label: 'Öğretmen modu' },
  { value: 'student', label: 'Öğrenci modu' },
];
const TURN_OPTIONS = [
  { value: 'manual', label: 'Manuel sıra' },
  { value: 'auto', label: 'Otomatik sıra' },
  { value: 'random', label: 'Rastgele sıra' },
];
const SCORM_OPTIONS = [
  { value: '1.2', label: 'SCORM 1.2' },
  { value: '2004', label: 'SCORM 2004' },
];
const SOUND_OPTIONS = [
  { value: 'focused', label: 'Odak', desc: 'Daha sade ve düşük ses' },
  { value: 'balanced', label: 'Dengeli', desc: 'Sınıf için ideal' },
  { value: 'cinematic', label: 'Sinematik', desc: 'Daha güçlü premium his' },
  { value: 'off', label: 'Kapalı', desc: 'Sessiz kullanım' },
];
const THEME_OPTIONS = [
  { value: 'aurora', label: 'Aurora', icon: '🌌', desc: 'Mor ve turkuaz premium sahne' },
  { value: 'ocean', label: 'Okyanus', icon: '🌊', desc: 'Mavi ve derin deniz havası' },
  { value: 'candy', label: 'Şeker', icon: '🍭', desc: 'Çocuk dostu parlak renkler' },
  { value: 'jungle', label: 'Orman', icon: '🌴', desc: 'Yeşil ve macera odaklı görünüm' },
];
const TEAM_COLORS = ['#6C5CE7', '#4ECDC4', '#FF6B6B', '#FFE66D'];
const TEAM_AVATARS = ['🦊', '🐼', '🦁', '🐬', '🦉', '🐯'];
const EBA_UPLOAD_STEPS = [
  'Tüm oyunlar veya belirli oyunları seçeneği üzerinden SCORM olarak zip dosyasını indirin.',
  'EBA’da içerikler sayfasına gidin.',
  'Buradan içerik ekle diyerek indirdiğiniz zip dosyasını yükleyin ve sizden istenen bilgileri girerek yükleyin.',
];

function Tile({ title, desc, right, children, compact = false }) {
  return (
    <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: compact ? 20 : 22, padding: compact ? 14 : 16, border: '1px solid rgba(255,255,255,.08)', display: 'grid', gap: compact ? 10 : 12 }}>
      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 900 }}>{title}</div>
          <div style={{ color: '#8EA2BE', fontSize: 13, lineHeight: 1.5, marginTop: 4 }}>{desc}</div>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children, compact = false }) {
  return (
    <button onClick={onClick} style={{ padding: compact ? '9px 12px' : '11px 15px', borderRadius: 999, border: `1px solid ${active ? '#6C5CE7' : 'rgba(255,255,255,.1)'}`, background: active ? 'rgba(108,92,231,.24)' : 'rgba(255,255,255,.04)', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: compact ? 13 : 14 }}>
      {children}
    </button>
  );
}

function MiniStat({ value, label }) {
  return <div style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}><div style={{ fontWeight: 900, fontSize: 22 }}>{value}</div><div style={{ fontSize: 12, color: '#8EA2BE' }}>{label}</div></div>;
}

function MetaPill({ children, accent = 'rgba(255,255,255,.08)', color = '#E6EEFF' }) {
  return <div style={{ padding: '8px 10px', borderRadius: 999, background: accent, border: '1px solid rgba(255,255,255,.08)', color, fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>{children}</div>;
}

function SoftBadge({ children, tone = 'neutral' }) {
  const palette = {
    neutral: { bg: 'rgba(255,255,255,.10)', color: '#EAF2FF' },
    warm: { bg: 'rgba(255,230,109,.18)', color: '#FFF0A8' },
    cool: { bg: 'rgba(78,205,196,.20)', color: '#C9FFF8' },
  }[tone] || { bg: 'rgba(255,255,255,.10)', color: '#EAF2FF' };
  return <div style={{ padding: '5px 9px', borderRadius: 999, background: palette.bg, color: palette.color, fontSize: 11, fontWeight: 900 }}>{children}</div>;
}

function Leaderboard({ leaderboard = [] }) {
  if (!leaderboard.length) return <div style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,.03)', color: '#8EA2BE' }}>Henüz kayıtlı skor yok.</div>;
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {leaderboard.slice().sort((a, b) => b.total - a.total).map((entry, index) => (
        <div key={entry.id} style={{ display: 'grid', gridTemplateColumns: '52px 1fr 88px', gap: 10, alignItems: 'center', padding: '12px 14px', borderRadius: 16, background: index === 0 ? 'rgba(255,230,109,.10)' : 'rgba(255,255,255,.04)', border: index === 0 ? '1px solid rgba(255,230,109,.20)' : '1px solid rgba(255,255,255,.06)' }}>
          <div style={{ fontWeight: 900, color: index === 0 ? '#FFE66D' : '#9FB3CD' }}>#{index + 1}</div>
          <div><div style={{ fontWeight: 900 }}>{entry.name}</div><div style={{ fontSize: 12, color: '#8EA2BE' }}>{entry.badge || 'Katılım'}</div></div>
          <div style={{ textAlign: 'right', fontWeight: 900 }}>⭐ {entry.total}</div>
        </div>
      ))}
    </div>
  );
}

function chunkItems(items = [], size = 7) {
  if (!items.length) return [];
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size));
}

function GameQuestionPickerModal({ openGame, onClose, questions = [], settings, updateSettings }) {
  if (!openGame) return null;

  const total = questions.length;
  const summary = getGameQuestionSummary(openGame.id, questions, settings);
  const profile = getGameQuestionProfile(openGame.id, settings);
  const questionLimit = summary.limit;
  const recommendedCount = questionLimit || summary.randomCount || Math.min(total || 0, 10);
  const questionEntries = questions.map((question, index) => ({ question, index, key: buildQuestionSignature(question) }));
  const validKeySet = new Set(questionEntries.map((entry) => entry.key));
  const selectedKeys = (profile.questionKeys || []).filter((key) => validKeySet.has(key)).slice(0, questionLimit || undefined);
  const selectedSet = new Set(selectedKeys);
  const selectionMode = profile.mode;

  const patchSettings = (partial) => updateSettings(buildUpdatedQuestionSettings(openGame.id, settings, partial));
  const setSelectionMode = (mode) => patchSettings({ mode });
  const setSelectedKeys = (keys) => patchSettings({ questionKeys: questionLimit ? keys.slice(0, questionLimit) : keys });
  const toggleQuestion = (key) => {
    if (selectedSet.has(key)) {
      setSelectedKeys(selectedKeys.filter((item) => item !== key));
      return;
    }
    if (questionLimit && selectedKeys.length >= questionLimit) return;
    setSelectedKeys([...selectedKeys, key]);
  };
  const autoPickKeys = questionEntries.slice(0, recommendedCount).map((entry) => entry.key);
  const randomPickKeys = shuffleArray(questionEntries.map((entry) => entry.key)).slice(0, recommendedCount);
  const allKeys = questionEntries.map((entry) => entry.key);
  const helperText = questionLimit
    ? total > questionLimit
      ? `${openGame.name} oyununda en fazla ${questionLimit} soru kullanılır. İstersen rastgele seçim kullan, istersen bu oyun için özel soru listesini elle belirle.`
      : `${questionLimit} soru veya altında olduğun için hazır soruların tamamı otomatik kullanılabilir.`
    : `Bu oyun için tüm soruları kullanabilir, önerilen hızlı akış için rastgele ${recommendedCount} soru seçebilir ya da oyuna özel manuel soru listesi oluşturabilirsin.`;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(3,6,18,.76)', backdropFilter: 'blur(12px)', display: 'grid', placeItems: 'center', padding: 18 }}>
      <div style={{ width: 'min(980px, 100%)', maxHeight: 'min(88vh, 980px)', overflow: 'hidden', borderRadius: 28, background: 'linear-gradient(180deg, rgba(13,18,38,.98), rgba(10,14,30,.98))', border: '1px solid rgba(255,255,255,.08)', boxShadow: '0 30px 80px rgba(0,0,0,.42)', padding: 22, display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, color: '#A8B8D2', fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' }}>{openGame.name} • oyun soru seti</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginTop: 6 }}>{summary.buttonLabel}</div>
            <div style={{ color: '#D5E2F5', marginTop: 8, lineHeight: 1.6 }}>{helperText}</div>
          </div>
          <button onClick={onClose} style={{ width: 44, height: 44, borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 900 }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
          <MiniStat value={total} label='hazır soru' />
          <MiniStat value={questionLimit || total} label={questionLimit ? 'oyunda kullanılacak üst sınır' : 'önerilen hızlı akış'} />
          <MiniStat value={selectionMode === 'manual' ? selectedKeys.length : summary.effectiveCount} label={selectionMode === 'manual' ? 'seçili soru' : 'aktif soru sayısı'} />
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Chip active={selectionMode === 'all'} onClick={() => setSelectionMode('all')}>Tüm sorular</Chip>
            <Chip active={selectionMode === 'random'} onClick={() => setSelectionMode('random')}>Rastgele {recommendedCount} soru</Chip>
            <Chip active={selectionMode === 'manual'} onClick={() => setSelectionMode('manual')}>{summary.buttonLabel}</Chip>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setSelectedKeys(autoPickKeys)} style={{ padding: '9px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.05)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>İlk {recommendedCount}&apos;i seç</button>
            <button onClick={() => setSelectedKeys(randomPickKeys)} style={{ padding: '9px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.05)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Rastgele {recommendedCount} seç</button>
            {!questionLimit ? <button onClick={() => setSelectedKeys(allKeys)} style={{ padding: '9px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.05)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Tümünü seç</button> : null}
            <button onClick={() => setSelectedKeys([])} style={{ padding: '9px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.05)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Seçimi temizle</button>
          </div>
        </div>

        <div style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#E5EEFF', lineHeight: 1.65 }}>
          {selectionMode === 'manual'
            ? <><strong style={{ color: '#fff' }}>Manuel soru listesi açık.</strong> {questionLimit ? `En fazla ${questionLimit} soru seçebilirsin.` : 'İstediğin kadar soru seçebilirsin.'} Oyun bu seçili sorularla başlayacak.</>
            : selectionMode === 'random'
              ? <><strong style={{ color: '#fff' }}>Rastgele akış açık.</strong> Oyun her açılışta hazır sorular içinden rastgele seçim yapacak.</>
              : <><strong style={{ color: '#fff' }}>Tam soru havuzu açık.</strong> Bu oyun, seçtiğin ders sorularının tamamını kullanacak.</>}
        </div>

        <div style={{ display: 'grid', gap: 10, minHeight: 0 }}>
          <div style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', color: '#AFC3DF', fontSize: 13, fontWeight: 700 }}>
            Soru listesi aşağı kaydırılabilir. Fare tekeri, touchpad ya da sağdaki kaydırma çubuğunu kullanarak tüm soruları görebilirsin.
          </div>
          <div style={{ minHeight: 0, maxHeight: '42vh', overflowY: 'auto', overflowX: 'hidden', display: 'grid', gap: 8, paddingRight: 6, borderRadius: 18, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.02)' }}>
            <div style={{ display: 'grid', gap: 8, padding: 8 }}>
          {questionEntries.map((entry) => {
            const active = selectedSet.has(entry.key);
            const disabled = selectionMode === 'manual' && !!questionLimit && !active && selectedKeys.length >= questionLimit;
            return (
              <button
                key={entry.key + entry.index}
                type='button'
                onClick={() => selectionMode === 'manual' && toggleQuestion(entry.key)}
                style={{
                  textAlign: 'left',
                  padding: '12px 14px',
                  borderRadius: 16,
                  border: `1px solid ${active ? 'rgba(78,205,196,.28)' : 'rgba(255,255,255,.08)'}`,
                  background: active ? 'rgba(78,205,196,.10)' : 'rgba(255,255,255,.04)',
                  color: '#fff',
                  cursor: selectionMode === 'manual' ? 'pointer' : 'default',
                  opacity: disabled ? 0.5 : 1,
                  display: 'grid',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 900, color: '#fff' }}>#{entry.index + 1} • {entry.question.q || 'Soru metni boş'}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <SoftBadge tone={active ? 'cool' : 'neutral'}>{active ? 'Seçili' : selectionMode === 'manual' ? 'Seç' : 'Önizleme'}</SoftBadge>
                    <SoftBadge tone='warm'>Doğru: {entry.question.o?.[entry.question.a] || '—'}</SoftBadge>
                  </div>
                </div>
                {(entry.question.hint || entry.question.explanation) ? <div style={{ color: '#AFC3DF', fontSize: 13, lineHeight: 1.55 }}>{entry.question.hint ? `İpucu: ${entry.question.hint}` : entry.question.explanation}</div> : null}
              </button>
            );
          })}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={onClose} style={{ padding: '12px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Kapat</button>
        </div>
      </div>
    </div>
  );
}

function ScormStudioModal({ open, onClose, onExport, topic, questionCount, scormExportState, settings, availableGames = MODES }) {
  const [exportMode, setExportMode] = useState('all');
  const [selectedGameIds, setSelectedGameIds] = useState([]);
  const [showEbaHelp, setShowEbaHelp] = useState(false);

  if (!open) return null;

  const effectiveSelectedGameIds = exportMode === 'all' ? availableGames.map((game) => game.id) : selectedGameIds;
  const selectedGames = availableGames.filter((game) => effectiveSelectedGameIds.includes(game.id));
  const toggleGame = (gameId) => {
    setSelectedGameIds((prev) => prev.includes(gameId) ? prev.filter((id) => id !== gameId) : [...prev, gameId]);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(3,6,18,.72)', backdropFilter: 'blur(12px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div style={{ width: 'min(980px, 100%)', borderRadius: 30, background: 'linear-gradient(180deg, rgba(13,18,38,.96), rgba(10,14,30,.98))', border: '1px solid rgba(255,255,255,.08)', boxShadow: '0 30px 80px rgba(0,0,0,.42)', padding: 28, display: 'grid', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><BrandMark size={60} /><div><div style={{ fontSize: 12, color: '#97A8C4', fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' }}>SCORM Studio</div><div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>SCORM paketi oluştur</div></div></div>
          <button onClick={onClose} style={{ width: 44, height: 44, borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 900 }}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
          <MiniStat value={topic || 'Başlıksız'} label='içerik adı' />
          <MiniStat value={questionCount} label='toplam soru' />
          <MiniStat value={selectedGames.length} label='oyun sayısı' />
          <MiniStat value={settings.scormVersion} label='SCORM profili' />
        </div>
        <div style={{ padding: 18, borderRadius: 22, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#D8E3F5', lineHeight: 1.7, display: 'grid', gap: 14 }}>
          <div>Bu sürümde SCORM paketi, üretilen güncel soruları gömülü şekilde taşır ve içerik açıldığında yalnızca seçtiğin oyunları gösterir.</div>
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ fontSize: 13, color: '#8EA2BE', fontWeight: 800 }}>Oyun kapsamı</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Chip active={exportMode === 'all'} onClick={() => setExportMode('all')}>Tüm oyunlar</Chip>
              <Chip active={exportMode === 'selected'} onClick={() => { setExportMode('selected'); setSelectedGameIds([]); }}>Oyun seç</Chip>
            </div>
          </div>
          {exportMode === 'selected' ? (
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 13, color: '#8EA2BE', fontWeight: 800 }}>SCORM içinde görünecek oyunlar</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => setSelectedGameIds(availableGames.map((game) => game.id))} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Tümünü seç</button>
                  <button onClick={() => setSelectedGameIds([])} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Temizle</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 10, maxHeight: 320, overflow: 'auto', paddingRight: 4, alignItems: 'stretch' }}>
                {availableGames.map((game) => {
                  const active = selectedGameIds.includes(game.id);
                  return (
                    <button key={game.id} onClick={() => toggleGame(game.id)} style={{ padding: '12px 14px', minHeight: 104, borderRadius: 16, border: `1px solid ${active ? '#4ECDC4' : 'rgba(255,255,255,.10)'}`, background: active ? 'rgba(78,205,196,.14)' : 'rgba(255,255,255,.03)', color: '#fff', textAlign: 'left', cursor: 'pointer', display: 'grid', gap: 10, alignContent: 'space-between' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '32px minmax(0,1fr)', gap: 10, alignItems: 'start' }}>
                        <span style={{ fontSize: 20, lineHeight: 1, marginTop: 2 }}>{game.icon}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 900, fontSize: 15, lineHeight: 1.25, wordBreak: 'break-word' }}>{game.name}</div>
                          <div style={{ fontSize: 11, color: '#9FB3CD', marginTop: 6 }}>{game.cat}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: 11, fontWeight: 900, color: active ? '#C9FFF8' : '#8EA2BE', whiteSpace: 'nowrap' }}>{active ? 'SEÇİLDİ' : 'PASİF'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          {scormExportState?.message ? <div style={{ color: scormExportState.status === 'error' ? '#FFB3B3' : '#C9FFF8' }}>{scormExportState.message}</div> : null}
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ color: '#8EA2BE', fontSize: 13 }}>Profil: {settings.scormVersion} • Zorluk: {settings.difficulty} • Paket: {exportMode === 'all' ? 'Tüm oyunlar' : `${selectedGames.length} oyun`}</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => setShowEbaHelp((prev) => !prev)} style={{ padding: '14px 18px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.05)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>{showEbaHelp ? 'EBA yardımını gizle' : 'EBA’ya nasıl yüklenir?'}</button>
              <button onClick={() => onExport({ selectedGameIds: effectiveSelectedGameIds })} disabled={scormExportState?.status === 'loading' || !selectedGames.length} style={{ padding: '14px 18px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#2ecc71,#4ecdc4)', color: '#fff', fontWeight: 900, cursor: scormExportState?.status === 'loading' || !selectedGames.length ? 'not-allowed' : 'pointer', minWidth: 220, opacity: scormExportState?.status === 'loading' || !selectedGames.length ? 0.55 : 1 }}>{scormExportState?.status === 'loading' ? 'Hazırlanıyor...' : '📦 SCORM Paketini Üret'}</button>
            </div>
          </div>
          {showEbaHelp ? (
            <div style={{ padding: 18, borderRadius: 20, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#DCE8F7', lineHeight: 1.7 }}>
              <div style={{ fontSize: 13, color: '#8EA2BE', fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>EBA yükleme adımları</div>
              <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 8 }}>
                {EBA_UPLOAD_STEPS.map((step, index) => <li key={index}>{step}</li>)}
              </ol>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function Modes({
  topic,
  fqs,
  setScr,
  startG,
  dlSCORM,
  isScormContentMode = false,
  branding,
  settings,
  updateSettings,
  scormStudioOpen,
  openScormStudio,
  closeScormStudio,
  scormExportState,
  competition,
  updateCompetition,
  resetLeaderboard,
  view = 'settings',
  availableGameIds = null,
}) {
  const [fcat, setFcat] = useState('all');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedGameId, setFocusedGameId] = useState('');
  const [questionPickerGameId, setQuestionPickerGameId] = useState('');
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const isMobile = viewportWidth < 900;
  const visibleModes = useMemo(() => {
    const allowed = Array.isArray(availableGameIds) && availableGameIds.length ? new Set(availableGameIds) : null;
    return allowed ? MODES.filter((game) => allowed.has(game.id)) : MODES;
  }, [availableGameIds]);
  const gameQuestionSummaries = useMemo(() => Object.fromEntries(visibleModes.map((game) => [game.id, getGameQuestionSummary(game.id, fqs, settings)])), [visibleModes, fqs, settings]);
  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return visibleModes.filter((game) => {
      const inCategory = fcat === 'all' || game.cat === fcat;
      if (!inCategory) return false;
      if (!query) return true;
      return [game.name, game.desc, game.cat, game.audience, game.energy].filter(Boolean).join(' ').toLowerCase().includes(query);
    });
  }, [fcat, searchTerm, visibleModes]);
  const cats = useMemo(() => GAME_CATEGORIES, []);
  const activePlayer = (competition.players || [])[competition.currentPlayerIndex] || null;
  const playerColumns = chunkItems(competition.players || [], 7);
  const playerGridColumns = `repeat(${Math.max(playerColumns.length, 1)}, minmax(160px, 1fr))`;

  const updateSetting = (key, value) => updateSettings({ [key]: value });

  const addPlayer = () => {
    const name = newPlayerName.trim();
    if (!name) return;
    const players = [...(competition.players || []), { id: Date.now().toString(36), name, avatar: TEAM_AVATARS[(competition.players || []).length % TEAM_AVATARS.length] }];
    updateCompetition({ ...competition, players, enabled: players.length > 0, currentPlayerIndex: 0 });
    setNewPlayerName('');
    SFX.click();
  };

  const addTeam = () => {
    const name = newTeamName.trim();
    if (!name) return;
    const teams = [...(competition.teams || []), { id: Date.now().toString(36), name, color: TEAM_COLORS[(competition.teams || []).length % TEAM_COLORS.length], avatar: TEAM_AVATARS[(competition.teams || []).length % TEAM_AVATARS.length] }];
    updateCompetition({ ...competition, teams, playerMode: 'team' });
    setNewTeamName('');
    SFX.click();
  };

  const removePlayer = (id) => {
    const players = (competition.players || []).filter((p) => p.id !== id);
    updateCompetition({ ...competition, players, currentPlayerIndex: Math.min(competition.currentPlayerIndex || 0, Math.max(0, players.length - 1)), enabled: players.length > 0 && competition.enabled });
  };

  const setActivePlayer = (index) => updateCompetition({ ...competition, currentPlayerIndex: index, enabled: true });

  const compactGamesGrid = typeof window !== 'undefined' && window.innerWidth >= 1660 ? 'repeat(5, minmax(0,1fr))' : typeof window !== 'undefined' && window.innerWidth >= 1360 ? 'repeat(4, minmax(0,1fr))' : typeof window !== 'undefined' && window.innerWidth >= 980 ? 'repeat(3, minmax(0,1fr))' : typeof window !== 'undefined' && window.innerWidth >= 680 ? 'repeat(2, minmax(0,1fr))' : 'minmax(0,1fr)';

  const getUsageLabel = (game) => gameQuestionSummaries[game.id]?.detailLabel || `${fqs.length} sorunun tamamı kullanılacak`;

  const openGamePicker = (gameId) => {
    setQuestionPickerGameId(gameId);
    SFX.click();
  };

  const inspectorGame = visibleModes.find((game) => game.id === focusedGameId) || visibleModes[0] || MODES[0] || null;
  const inspectorSummary = inspectorGame ? gameQuestionSummaries[inspectorGame.id] : null;
  const questionPickerGame = MODES.find((game) => game.id === questionPickerGameId) || null;

  return (
    <>
      <div style={{ display: 'grid', gap: 16, minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: 16 }}>
            <BrandMark size={isMobile ? 54 : 64} />
            <div>
              <div style={{ color: '#A3B6D4', fontSize: 12, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' }}>{isScormContentMode ? 'SCORM içerik modu' : view === 'games' ? 'Oyunlar' : 'Oyun ayarları'}</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#fff' }}>{branding?.title || 'T-T Eğitsel Oyunlar'}</div>
              <div style={{ color: '#8EA2BE', marginTop: 4 }}>{topic || 'Konu seçilmedi'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {!isScormContentMode && <button onClick={() => setScr('editor')} style={{ padding: '14px 18px', borderRadius: 16, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.05)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>📝 Editöre Dön</button>}
            <button onClick={() => setScr('games')} style={{ padding: '14px 18px', borderRadius: 16, border: '1px solid rgba(78,205,196,.22)', background: 'linear-gradient(135deg, rgba(108,92,231,.22), rgba(78,205,196,.18))', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>🎮 Oyunlara geç</button>
            {!isScormContentMode && <button onClick={openScormStudio} style={{ padding: '14px 18px', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg,#FF6B6B,#2ecc71)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>🚀 SCORM Studio</button>}
          </div>
        </div>

        {view === 'settings' ? (
          <div style={{ display: 'grid', gridTemplateColumns: viewportWidth < 1180 ? '1fr' : 'minmax(0,1.08fr) minmax(280px,.82fr)', gap: 14, alignItems: 'start' }}>
            <div style={{ display: 'grid', gap: 14, alignItems: 'start' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0,1fr))', gap: 12, alignItems: 'stretch' }}>
                <Tile compact title='🎚 Zorluk' desc='Süre oyunlara göre uyarlanır.'>
                  <div style={{ display: 'grid', gap: 8 }}>{DIFFICULTY_OPTIONS.map((option) => <Chip compact key={option.value} active={settings.difficulty === option.value} onClick={() => updateSetting('difficulty', option.value)}>{option.label}</Chip>)}</div>
                </Tile>
                <Tile compact title='👤 Rol' desc='Öğretmen ya da öğrenci profili.'>
                  <div style={{ display: 'grid', gap: 8 }}>{ROLE_OPTIONS.map((option) => <Chip compact key={option.value} active={settings.userRole === option.value} onClick={() => updateSetting('userRole', option.value)}>{option.label}</Chip>)}</div>
                </Tile>
                <Tile compact title='📺 Akıllı tahta' desc='Tam ekran sınıf kullanımı.'>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <Chip compact active={settings.smartboardMode} onClick={() => updateSetting('smartboardMode', true)}>Akıllı tahta açık</Chip>
                    <Chip compact active={!settings.smartboardMode} onClick={() => updateSetting('smartboardMode', false)}>Normal görünüm</Chip>
                  </div>
                </Tile>
                <Tile compact title='⏱ Süre' desc='Varsayılan tur zamanı.'>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0,1fr))' : 'repeat(3, minmax(0,1fr))', gap: 8 }}>{DURATION_OPTIONS.map((seconds) => <Chip compact key={seconds} active={settings.duration === seconds} onClick={() => updateSetting('duration', seconds)}>{seconds === 9999 ? 'Sınırsız' : `${seconds} sn`}</Chip>)}</div>
                </Tile>
                <Tile compact title='🎨 Tema' desc='Genel sahne görünümü.'>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0,1fr))', gap: 8 }}>{THEME_OPTIONS.map((option) => <Chip compact key={option.value} active={settings.themeFamily === option.value} onClick={() => updateSetting('themeFamily', option.value)}>{option.icon} {option.label}</Chip>)}</div>
                </Tile>
                <Tile compact title='🎯 Sıra tipi' desc='Oyuncu akışını belirle.'>
                  <div style={{ display: 'grid', gap: 8 }}>{TURN_OPTIONS.map((option) => <Chip compact key={option.value} active={settings.turnMode === option.value} onClick={() => updateSetting('turnMode', option.value)}>{option.label}</Chip>)}</div>
                </Tile>
                <Tile compact title='📦 SCORM' desc='LMS dışa aktarma profili.'>
                  <div style={{ display: 'grid', gap: 8 }}>{SCORM_OPTIONS.map((option) => <Chip compact key={option.value} active={settings.scormVersion === option.value} onClick={() => updateSetting('scormVersion', option.value)}>{option.label}</Chip>)}</div>
                </Tile>
                <Tile compact title='✅ Final kalite özeti' desc='Aktif ortak kalite kontrolleri.'>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#fff', fontWeight: 800 }}>Büyük soru alanı aktif</div>
                    <div style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#fff', fontWeight: 800 }}>Oyun başlatma perdesi aktif</div>
                    <div style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#fff', fontWeight: 800 }}>Detaylı sonuç raporu aktif</div>
                  </div>
                </Tile>
              </div>

              <Tile compact title='🔊 Ses merkezi' desc='Efekt, müzik ve genel ses düzeyi.'>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{SOUND_OPTIONS.map((option) => <Chip compact key={option.value} active={settings.soundProfile === option.value} onClick={() => updateSetting('soundProfile', option.value)}>{option.label}</Chip>)}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Chip compact active={!!settings.effectsEnabled} onClick={() => updateSetting('effectsEnabled', !settings.effectsEnabled)}>{settings.effectsEnabled ? 'Efekt açık' : 'Efekt kapalı'}</Chip>
                    <Chip compact active={!!settings.musicEnabled} onClick={() => updateSetting('musicEnabled', !settings.musicEnabled)}>{settings.musicEnabled ? 'Müzik açık' : 'Müzik kapalı'}</Chip>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div style={{ display: 'grid', gap: 6 }}>
                      <label style={{ color: '#DDE8F8', fontSize: 13, fontWeight: 800 }}>Genel ses • %{Math.round((settings.masterVolume || 0) * 100)}</label>
                      <input type='range' min='0' max='1' step='0.01' value={settings.masterVolume ?? 0.58} onChange={(e) => updateSetting('masterVolume', Number(e.target.value))} />
                    </div>
                    <div style={{ display: 'grid', gap: 6 }}>
                      <label style={{ color: '#DDE8F8', fontSize: 13, fontWeight: 800 }}>Efekt seviyesi • %{Math.round((settings.effectsVolume || 0) * 100)}</label>
                      <input type='range' min='0' max='1' step='0.01' value={settings.effectsVolume ?? 0.92} onChange={(e) => updateSetting('effectsVolume', Number(e.target.value))} />
                    </div>
                    <div style={{ display: 'grid', gap: 6 }}>
                      <label style={{ color: '#DDE8F8', fontSize: 13, fontWeight: 800 }}>Müzik seviyesi • %{Math.round((settings.musicVolume || 0) * 100)}</label>
                      <input type='range' min='0' max='1' step='0.01' value={settings.musicVolume ?? 0.56} onChange={(e) => updateSetting('musicVolume', Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              </Tile>
            </div>

            <div style={{ display: 'grid', gap: 14, alignItems: 'start' }}>
              <Tile compact title='🎯 Oyun bazlı soru seçimi' desc='Her oyun kendi soru akışını kullanabilir.' right={<SoftBadge tone='cool'>{inspectorGame?.name || 'Oyun'}</SoftBadge>}>
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {inspectorGame?.maarifFocus?.slice(0, 2).map((item) => <MetaPill key={`maarif-${item}`} accent='rgba(108,92,231,.18)' color='#F1EDFF'>🎯 {item}</MetaPill>)}
                    {inspectorGame?.sdoFocus?.slice(0, 2).map((item) => <MetaPill key={`sdo-${item}`} accent='rgba(78,205,196,.18)' color='#D8FFFB'>🤝 {item}</MetaPill>)}
                  </div>
                  <div style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#DCE7F7', lineHeight: 1.6 }}>
                    <strong style={{ color: '#fff' }}>{inspectorSummary?.modeLabel || 'Tüm sorular'}</strong><br />
                    {inspectorSummary?.detailLabel || 'Bu oyun için soru özeti hazır değil.'}
                  </div>
                  <button onClick={() => inspectorGame && openGamePicker(inspectorGame.id)} style={{ padding: '12px 14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#6C5CE7,#4ECDC4)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>{inspectorSummary?.buttonLabel || 'Soru setini seç'}</button>
                </div>
              </Tile>
              <Tile compact title='🤝 Oyuncular' desc='Manuel, otomatik veya rastgele sıra.'>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addPlayer()} placeholder='Oyuncu adı' style={{ flex: 1, padding: '12px 13px', borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.25)', color: '#fff', fontSize: 15, fontWeight: 700 }} />
                  <button onClick={addPlayer} style={{ padding: '12px 14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#6C5CE7,#4ECDC4)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Ekle</button>
                </div>
                <div style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#DCE7F7', fontWeight: 800 }}>{activePlayer ? `Sıradaki oyuncu: ${activePlayer.name}` : 'Henüz aktif oyuncu yok.'}</div>
                <div style={{ display: 'grid', gridTemplateColumns: playerGridColumns, gap: 8, alignItems: 'start', overflowX: 'auto', paddingBottom: 2 }}>
                  {playerColumns.length ? playerColumns.map((column, columnIndex) => (
                    <div key={`player-column-${columnIndex}`} style={{ display: 'grid', gap: 8, minWidth: 0 }}>
                      {column.map((player) => {
                        const index = (competition.players || []).findIndex((entry) => entry.id === player.id);
                        const active = index === competition.currentPlayerIndex;
                        return (
                          <div key={player.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto', gap: 6, alignItems: 'center', padding: '8px 10px', borderRadius: 14, background: active ? 'rgba(78,205,196,.12)' : 'rgba(255,255,255,.04)', minWidth: 0 }}>
                            <div style={{ fontWeight: 900, fontSize: 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.avatar || '👤'} {player.name}</div>
                            <button onClick={() => setActivePlayer(index)} style={{ minWidth: 54, padding: '7px 8px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.05)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>{active ? 'Aktif' : 'Seç'}</button>
                            <button onClick={() => removePlayer(player.id)} style={{ minWidth: 40, padding: '7px 8px', borderRadius: 10, border: 'none', background: 'rgba(255,107,107,.14)', color: '#FF9A9A', fontWeight: 800, cursor: 'pointer' }}>Sil</button>
                          </div>
                        );
                      })}
                    </div>
                  )) : <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,.04)', color: '#AFC3DF' }}>Henüz oyuncu eklenmedi.</div>}
                </div>
              </Tile>
              <Tile compact title='🛡 Takımlar' desc='Takım modu için renk ve avatar.' right={<div style={{ padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', fontWeight: 800 }}>{competition.playerMode === 'team' ? 'Takım modu' : 'Bireysel mod'}</div>}>
                <div style={{ display: 'flex', gap: 8 }}><input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTeam()} placeholder='Takım adı' style={{ flex: 1, padding: '13px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.25)', color: '#fff', fontSize: 15, fontWeight: 700 }} /><button onClick={addTeam} style={{ padding: '12px 16px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#FF6B6B,#FDCB6E)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Takım Ekle</button></div>
                <div style={{ display: 'grid', gap: 8 }}>{(competition.teams || []).map((team) => <div key={team.id} style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ fontWeight: 900 }}>{team.avatar} {team.name}</div><div style={{ width: 16, height: 16, borderRadius: '50%', background: team.color }} /></div>)}</div>
              </Tile>
              <Tile compact title='🏅 Genel skor tablosu' desc='Toplam yarışma puanları.' right={<button onClick={resetLeaderboard} style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Sıfırla</button>}>
                <Leaderboard leaderboard={competition.leaderboard || []} />
              </Tile>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14, minHeight: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 10, alignItems: 'start' }}>
              <div style={{ borderRadius: 24, padding: 14, background: 'linear-gradient(135deg, rgba(108,92,231,.20), rgba(78,205,196,.14), rgba(255,255,255,.03))', border: '1px solid rgba(255,255,255,.10)', boxShadow: '0 18px 40px rgba(5,10,30,.18)', display: 'grid', gap: 10, alignContent: 'start' }}>
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#C7D5EB', letterSpacing: '.08em', textTransform: 'uppercase' }}>Oyun merkezi</div>
                    <div style={{ fontSize: 22, lineHeight: 1.08, fontWeight: 900, color: '#fff' }}>Sade seçim, daha geniş oyun alanı</div>
                    <div style={{ color: '#DBE7F8', maxWidth: 760, lineHeight: 1.55, fontSize: 14 }}>Karttan oyunu incele ve tek dokunuşla başlat. Her oyun kendi soru akışını ve pedagojik odağını kullanır.</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <SoftBadge tone='cool'>{fqs.length} soru hazır</SoftBadge>
                    <SoftBadge tone='warm'>{visibleModes.length} aktif oyun</SoftBadge>
                    <SoftBadge>{settings.duration === 9999 ? 'Sınırsız tur' : `${settings.duration} sn tur`}</SoftBadge>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <MetaPill accent='rgba(255,255,255,.12)'>🎮 {filtered.length} görünen oyun</MetaPill>
                  <MetaPill accent='rgba(255,255,255,.12)'>⭐ {settings.difficulty === 'easy' ? 'Kolay' : settings.difficulty === 'hard' ? 'Zor' : 'Orta'} seviye</MetaPill>
                  <MetaPill accent='rgba(255,255,255,.12)'>👥 {settings.turnMode === 'manual' ? 'Manuel sıra' : settings.turnMode === 'auto' ? 'Otomatik sıra' : 'Rastgele sıra'}</MetaPill>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 12, minHeight: 0, background: 'rgba(255,255,255,.04)', borderRadius: 24, padding: 12, border: '1px solid rgba(255,255,255,.08)' }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#C7D5EB', letterSpacing: '.08em', textTransform: 'uppercase' }}>Kategori ve arama</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{cats.map((c) => <Chip key={c} active={fcat === c} onClick={() => setFcat(c)}>{c === 'all' ? 'Tümü' : c}</Chip>)}</div>
                </div>
                <div style={{ minWidth: 260, flex: '1 1 320px', maxWidth: 420, display: 'grid', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#C7D5EB' }}>Oyun ara</div>
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder='Oyun adı, kategori veya açıklama ara'
                    style={{ width: '100%', padding: '14px 16px', borderRadius: 16, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(8,12,28,.45)', color: '#fff', fontSize: 15, fontWeight: 700 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: compactGamesGrid, gap: 10 }}>
                {filtered.map((m) => {
                  const active = focusedGameId === m.id;
                  return (
                    <div key={m.id} onClick={() => setFocusedGameId(m.id)} style={{ padding: 12, borderRadius: 20, border: `1px solid ${active ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.10)'}`, background: m.bg || 'rgba(255,255,255,.05)', textAlign: 'left', cursor: 'pointer', minHeight: 188, display: 'grid', gap: 10, alignContent: 'space-between', boxShadow: active ? '0 20px 40px rgba(0,0,0,.22)' : '0 10px 24px rgba(0,0,0,.14)', transform: active ? 'translateY(-2px)' : 'none' }}>
                      <div style={{ display: 'grid', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ width: 54, height: 54, borderRadius: 16, background: 'rgba(255,255,255,.16)', display: 'grid', placeItems: 'center', fontSize: 28, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18)' }}>{m.icon}</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {m.featured ? <SoftBadge tone='warm'>Vitrin</SoftBadge> : null}
                            {m.isNew ? <SoftBadge tone='cool'>Yeni</SoftBadge> : null}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: '#fff', fontWeight: 900, fontSize: 18, lineHeight: 1.1 }}>{m.name}</div>
                          <div style={{ color: 'rgba(255,255,255,.86)', fontSize: 12.5, marginTop: 6, lineHeight: 1.5, minHeight: 38 }}>{m.desc}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <MetaPill accent='rgba(255,255,255,.12)'>⚡ {m.energy || 'Orta'}</MetaPill>
                          {m.maarifFocus?.[0] ? <MetaPill accent='rgba(108,92,231,.18)' color='#F1EDFF'>🎯 {m.maarifFocus[0]}</MetaPill> : null}
                          {m.sdoFocus?.[0] ? <MetaPill accent='rgba(78,205,196,.18)' color='#D8FFFB'>🤝 {m.sdoFocus[0]}</MetaPill> : null}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, color: 'rgba(255,255,255,.94)', fontWeight: 800, fontSize: 12 }}>
                          <span>{getUsageLabel(m)}</span>
                          <span>{active ? 'İnceleniyor' : 'İncele'}</span>
                        </div>
                        <div style={{ display: 'grid', gap: 8 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); openGamePicker(m.id); }}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.10)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}
                          >
                            🧩 {gameQuestionSummaries[m.id]?.buttonLabel || 'Soru setini seç'}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); startG(m); }}
                            style={{ width: '100%', padding: '13px 14px', borderRadius: 16, border: 'none', background: 'rgba(8,12,28,.82)', color: '#fff', fontWeight: 900, cursor: 'pointer', boxShadow: '0 12px 24px rgba(0,0,0,.18)' }}
                          >
                            Oyunu başlat →
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!filtered.length ? (
                <div style={{ padding: 20, borderRadius: 18, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', color: '#D9E7FA', lineHeight: 1.7 }}>Hiç oyun bulunamadı. Filtreyi <strong>Tümü</strong> konumuna getirip arama kutusunu temizleyerek tüm oyunları tekrar görebilirsin.</div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <GameQuestionPickerModal openGame={questionPickerGame} onClose={() => setQuestionPickerGameId('')} questions={fqs} settings={settings} updateSettings={updateSettings} />
      {!isScormContentMode ? <ScormStudioModal open={scormStudioOpen} onClose={closeScormStudio} onExport={dlSCORM} topic={topic} questionCount={fqs.length} scormExportState={scormExportState} settings={settings} availableGames={visibleModes} /> : null}
    </>
  );
}
