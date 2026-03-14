import { useMemo, useState } from 'react';
import { FEATURED_GAMES, GAME_CATEGORIES, getModesByCategory, MODES, NEW_GAMES } from '../constants/gameRegistry';
import { SFX } from '../utils/audio';
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

function Tile({ title, desc, right, children }) {
  return (
    <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 22, padding: 18, border: '1px solid rgba(255,255,255,.08)', display: 'grid', gap: 14 }}>
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

function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{ padding: '11px 15px', borderRadius: 999, border: `1px solid ${active ? '#6C5CE7' : 'rgba(255,255,255,.1)'}`, background: active ? 'rgba(108,92,231,.24)' : 'rgba(255,255,255,.04)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
      {children}
    </button>
  );
}

function MiniStat({ value, label }) {
  return <div style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}><div style={{ fontWeight: 900, fontSize: 22 }}>{value}</div><div style={{ fontSize: 12, color: '#8EA2BE' }}>{label}</div></div>;
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

function ScormStudioModal({ open, onClose, onExport, topic, questionCount, scormExportState, settings, availableGames = MODES }) {
  const [exportMode, setExportMode] = useState('all');
  const [selectedGameIds, setSelectedGameIds] = useState([]);

  if (!open) return null;

  const effectiveSelectedGameIds = exportMode === 'all' ? availableGames.map((game) => game.id) : selectedGameIds;
  const selectedGames = availableGames.filter((game) => effectiveSelectedGameIds.includes(game.id));
  const toggleGame = (gameId) => {
    setSelectedGameIds((prev) => prev.includes(gameId) ? prev.filter((id) => id !== gameId) : [...prev, gameId]);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(3,6,18,.72)', backdropFilter: 'blur(12px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div style={{ width: 'min(780px, 100%)', borderRadius: 30, background: 'linear-gradient(180deg, rgba(13,18,38,.96), rgba(10,14,30,.98))', border: '1px solid rgba(255,255,255,.08)', boxShadow: '0 30px 80px rgba(0,0,0,.42)', padding: 28, display: 'grid', gap: 18 }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, maxHeight: 280, overflow: 'auto', paddingRight: 4 }}>
                {availableGames.map((game) => {
                  const active = selectedGameIds.includes(game.id);
                  return (
                    <button key={game.id} onClick={() => toggleGame(game.id)} style={{ padding: '12px 12px', borderRadius: 14, border: `1px solid ${active ? '#4ECDC4' : 'rgba(255,255,255,.10)'}`, background: active ? 'rgba(78,205,196,.14)' : 'rgba(255,255,255,.03)', color: '#fff', textAlign: 'left', cursor: 'pointer', display: 'grid', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontSize: 20 }}>{game.icon}</span>
                        <span style={{ fontSize: 11, fontWeight: 900, color: active ? '#C9FFF8' : '#8EA2BE' }}>{active ? 'SEÇİLDİ' : 'PASİF'}</span>
                      </div>
                      <div style={{ fontWeight: 900, fontSize: 14 }}>{game.name}</div>
                      <div style={{ fontSize: 11, color: '#9FB3CD' }}>{game.cat}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          {scormExportState?.message ? <div style={{ color: scormExportState.status === 'error' ? '#FFB3B3' : '#C9FFF8' }}>{scormExportState.message}</div> : null}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ color: '#8EA2BE', fontSize: 13 }}>Profil: {settings.scormVersion} • Zorluk: {settings.difficulty} • Paket: {exportMode === 'all' ? 'Tüm oyunlar' : `${selectedGames.length} oyun`}</div>
          <button onClick={() => onExport({ selectedGameIds: effectiveSelectedGameIds })} disabled={scormExportState?.status === 'loading' || !selectedGames.length} style={{ padding: '14px 18px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#2ecc71,#4ecdc4)', color: '#fff', fontWeight: 900, cursor: scormExportState?.status === 'loading' || !selectedGames.length ? 'not-allowed' : 'pointer', minWidth: 220, opacity: scormExportState?.status === 'loading' || !selectedGames.length ? 0.55 : 1 }}>{scormExportState?.status === 'loading' ? 'Hazırlanıyor...' : '📦 SCORM Paketini Üret'}</button>
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
  const visibleModes = useMemo(() => {
    const allowed = Array.isArray(availableGameIds) && availableGameIds.length ? new Set(availableGameIds) : null;
    return allowed ? MODES.filter((game) => allowed.has(game.id)) : MODES;
  }, [availableGameIds]);
  const filtered = useMemo(() => visibleModes.filter((game) => fcat === 'all' || game.cat === fcat), [fcat, visibleModes]);
  const cats = useMemo(() => GAME_CATEGORIES, []);
  const activePlayer = (competition.players || [])[competition.currentPlayerIndex] || null;

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

  const compactGamesGrid = typeof window !== 'undefined' && window.innerWidth >= 1500 ? 'repeat(6, minmax(0,1fr))' : typeof window !== 'undefined' && window.innerWidth >= 1260 ? 'repeat(5, minmax(0,1fr))' : typeof window !== 'undefined' && window.innerWidth >= 900 ? 'repeat(4, minmax(0,1fr))' : 'repeat(3, minmax(0,1fr))';

  return (
    <>
      <div style={{ display: 'grid', gap: 16, minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <BrandMark size={64} />
            <div>
              <div style={{ color: '#A3B6D4', fontSize: 12, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' }}>{isScormContentMode ? 'SCORM içerik modu' : view === 'games' ? 'Oyunlar' : 'Oyun ayarları'}</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#fff' }}>{branding?.title || 'T~T Eğitsel Çevrimiçi Oyunlar'}</div>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.18fr) minmax(320px,.82fr)', gap: 16, alignItems: 'start' }}>
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 16 }}>
                <Tile title='🎚 Zorluk' desc='Süre oyunlara göre uyarlanır.'>
                  <div style={{ display: 'grid', gap: 8 }}>{DIFFICULTY_OPTIONS.map((option) => <Chip key={option.value} active={settings.difficulty === option.value} onClick={() => updateSetting('difficulty', option.value)}>{option.label}</Chip>)}</div>
                </Tile>
                <Tile title='👤 Rol' desc='Öğretmen ya da öğrenci profili.'>
                  <div style={{ display: 'grid', gap: 8 }}>{ROLE_OPTIONS.map((option) => <Chip key={option.value} active={settings.userRole === option.value} onClick={() => updateSetting('userRole', option.value)}>{option.label}</Chip>)}</div>
                </Tile>
                <Tile title='📺 Akıllı tahta' desc='Tam ekran sınıf kullanımı.'>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <Chip active={settings.smartboardMode} onClick={() => updateSetting('smartboardMode', true)}>Akıllı tahta açık</Chip>
                    <Chip active={!settings.smartboardMode} onClick={() => updateSetting('smartboardMode', false)}>Normal görünüm</Chip>
                  </div>
                </Tile>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 16 }}>
                <Tile title='⏱ Süre' desc='Varsayılan tur zamanı.'>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{DURATION_OPTIONS.map((seconds) => <Chip key={seconds} active={settings.duration === seconds} onClick={() => updateSetting('duration', seconds)}>{seconds === 9999 ? 'Sınırsız' : `${seconds} sn`}</Chip>)}</div>
                </Tile>
                <Tile title='🔊 Ses' desc='Ses profilini seç.'>
                  <div style={{ display: 'grid', gap: 8 }}>{SOUND_OPTIONS.map((option) => <Chip key={option.value} active={settings.soundProfile === option.value} onClick={() => updateSetting('soundProfile', option.value)}>{option.label}</Chip>)}</div>
                </Tile>
                <Tile title='🎨 Tema' desc='Genel sahne görünümü.'>
                  <div style={{ display: 'grid', gap: 8 }}>{THEME_OPTIONS.map((option) => <Chip key={option.value} active={settings.themeFamily === option.value} onClick={() => updateSetting('themeFamily', option.value)}>{option.icon} {option.label}</Chip>)}</div>
                </Tile>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 16 }}>
                <Tile title='🎯 Sıra tipi' desc='Oyuncu akışını belirle.'>
                  <div style={{ display: 'grid', gap: 8 }}>{TURN_OPTIONS.map((option) => <Chip key={option.value} active={settings.turnMode === option.value} onClick={() => updateSetting('turnMode', option.value)}>{option.label}</Chip>)}</div>
                </Tile>
                <Tile title='📦 SCORM' desc='LMS dışa aktarma profili.'>
                  <div style={{ display: 'grid', gap: 8 }}>{SCORM_OPTIONS.map((option) => <Chip key={option.value} active={settings.scormVersion === option.value} onClick={() => updateSetting('scormVersion', option.value)}>{option.label}</Chip>)}</div>
                </Tile>
                <Tile title='⚡ Hızlı akış' desc='Aktif özet.'>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <MiniStat value={settings.userRole === 'teacher' ? 'Öğretmen' : 'Öğrenci'} label='aktif rol' />
                  </div>
                </Tile>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              <Tile title='🤝 Oyuncular' desc='Manuel, otomatik veya rastgele sıra.'>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addPlayer()} placeholder='Oyuncu adı' style={{ flex: 1, padding: '13px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.25)', color: '#fff', fontSize: 15, fontWeight: 700 }} />
                  <button onClick={addPlayer} style={{ padding: '12px 16px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#6C5CE7,#4ECDC4)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Ekle</button>
                </div>
                <div style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#DCE7F7', fontWeight: 800 }}>{activePlayer ? `Sıradaki oyuncu: ${activePlayer.name}` : 'Henüz aktif oyuncu yok.'}</div>
                <div style={{ display: 'grid', gap: 8 }}>{(competition.players || []).map((player, index) => <div key={player.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center', padding: '10px 12px', borderRadius: 14, background: index === competition.currentPlayerIndex ? 'rgba(78,205,196,.12)' : 'rgba(255,255,255,.04)' }}><div style={{ fontWeight: 900 }}>{player.avatar || '👤'} {player.name}</div><button onClick={() => setActivePlayer(index)} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.05)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>{index === competition.currentPlayerIndex ? 'Aktif' : 'Seç'}</button><button onClick={() => removePlayer(player.id)} style={{ padding: '8px 10px', borderRadius: 10, border: 'none', background: 'rgba(255,107,107,.14)', color: '#FF9A9A', fontWeight: 800, cursor: 'pointer' }}>Sil</button></div>)}</div>
              </Tile>
              <Tile title='🛡 Takımlar' desc='Takım modu için renk ve avatar.' right={<div style={{ padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', fontWeight: 800 }}>{competition.playerMode === 'team' ? 'Takım modu' : 'Bireysel mod'}</div>}>
                <div style={{ display: 'flex', gap: 10 }}><input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTeam()} placeholder='Takım adı' style={{ flex: 1, padding: '13px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.25)', color: '#fff', fontSize: 15, fontWeight: 700 }} /><button onClick={addTeam} style={{ padding: '12px 16px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#FF6B6B,#FDCB6E)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Takım Ekle</button></div>
                <div style={{ display: 'grid', gap: 8 }}>{(competition.teams || []).map((team) => <div key={team.id} style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ fontWeight: 900 }}>{team.avatar} {team.name}</div><div style={{ width: 16, height: 16, borderRadius: '50%', background: team.color }} /></div>)}</div>
              </Tile>
              <Tile title='🏅 Genel skor tablosu' desc='Toplam yarışma puanları.' right={<button onClick={resetLeaderboard} style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Sıfırla</button>}>
                <Leaderboard leaderboard={competition.leaderboard || []} />
              </Tile>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12, minHeight: 0 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{cats.map((c) => <Chip key={c} active={fcat === c} onClick={() => setFcat(c)}>{c === 'all' ? 'Tümü' : c}</Chip>)}</div>
              <div style={{ color: '#8EA2BE', fontSize: 12 }}>{filtered.length} oyun • kaydırmalı galeri • kompakt kartlar</div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <MiniStat value={filtered.length} label='görünen oyun' />
              <MiniStat value={fqs.length} label='hazır soru' />
              <MiniStat value={settings.difficulty === 'easy' ? 'Kolay' : settings.difficulty === 'hard' ? 'Zor' : 'Orta'} label='zorluk' />
              <MiniStat value={settings.turnMode === 'manual' ? 'Manuel' : settings.turnMode === 'auto' ? 'Otomatik' : 'Rastgele'} label='oyuncu sırası' />
            </div>
            <div style={{ minHeight: 0, background: 'rgba(255,255,255,.04)', borderRadius: 24, padding: 10, border: '1px solid rgba(255,255,255,.08)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: compactGamesGrid, gap: 10 }}>
                {filtered.map((m) => (
                  <button key={m.id} onClick={() => startG(m)} style={{ padding: '10px 10px 12px', borderRadius: 18, border: '1px solid rgba(255,255,255,.10)', background: m.bg || 'rgba(255,255,255,.04)', textAlign: 'left', cursor: 'pointer', minHeight: 110, display: 'grid', gap: 6, alignContent: 'space-between', boxShadow: '0 8px 18px rgba(0,0,0,.14)' }}>
                    <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 6 }}><div style={{ fontSize: 24 }}>{m.icon}</div><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>{m.featured ? <div style={{ padding: '4px 7px', borderRadius: 999, background: 'rgba(255,230,109,.22)', color: '#FFF0A8', fontSize: 9, fontWeight: 900 }}>Vitrin</div> : null}{m.isNew ? <div style={{ padding: '4px 7px', borderRadius: 999, background: 'rgba(78,205,196,.20)', color: '#C9FFF8', fontSize: 9, fontWeight: 900 }}>Yeni</div> : null}</div></div>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 900, fontSize: 16, lineHeight: 1.05 }}>{m.name}</div>
                      <div style={{ color: 'rgba(255,255,255,.80)', fontSize: 11, marginTop: 3, minHeight: 28 }}>{m.desc}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'rgba(255,255,255,.92)', fontWeight: 800, fontSize: 10.5 }}><span>{m.cat}</span><span>Başlat →</span></div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {!isScormContentMode ? <ScormStudioModal open={scormStudioOpen} onClose={closeScormStudio} onExport={dlSCORM} topic={topic} questionCount={fqs.length} scormExportState={scormExportState} settings={settings} availableGames={visibleModes} /> : null}
    </>
  );
}
