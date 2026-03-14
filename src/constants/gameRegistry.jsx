/* eslint-disable react-refresh/only-export-components */
import Quiz from '../components/games/quiz/Quiz';
import Balloon from '../components/games/balloon/Balloon';
import Wheel from '../components/games/wheel/Wheel';
import Memory from '../components/games/memory/Memory';
import TrueFalse from '../components/games/truefalse/TrueFalse';
import Millionaire from '../components/games/millionaire/Millionaire';
import Whack from '../components/games/whack/Whack';
import Race from '../components/games/race/Race';
import Target from '../components/games/target/Target';
import Flashcard from '../components/games/flashcard/Flashcard';
import Dice from '../components/games/dice/Dice';
import OpenBox from '../components/games/openbox/OpenBox';
import Bomb from '../components/games/bomb/Bomb';
import Submarine from '../components/games/submarine/Submarine';
import Puzzle from '../components/games/puzzle/Puzzle';
import Treasure from '../components/games/treasure/Treasure';
import Monster from '../components/games/monster/Monster';
import Chef from '../components/games/chef/Chef';
import Hero from '../components/games/hero/Hero';
import Dino from '../components/games/dino/Dino';

export const GAME_DEFINITIONS = [
  { id: 'quiz', name: 'Zamana Karşı Quiz', icon: '⚡', desc: 'Klasik bilgi yarışması!', cat: 'Hız', color: '#6C5CE7', bg: 'linear-gradient(135deg,#667eea,#764ba2)', featured: true, audience: 'Tüm sınıf', energy: 'Yüksek' },
  { id: 'balloon', name: 'Balon Patlatma', icon: '🎈', desc: 'Doğru balonu patlat!', cat: 'Aksiyon', color: '#FF6B6B', bg: 'linear-gradient(135deg,#f093fb,#f5576c)', featured: true, audience: 'İlkokul', energy: 'Yüksek' },
  { id: 'wheel', name: 'Çarkıfelek', icon: '🎡', desc: 'Çevir, bil, kazan!', cat: 'Şans', color: '#FFB142', bg: 'linear-gradient(135deg,#f6d365,#fda085)', featured: true, audience: 'Tüm sınıf', energy: 'Orta' },
  { id: 'memory', name: 'Hafıza Kartları', icon: '🧠', desc: 'Eşleştir ve hatırla!', cat: 'Bulmaca', color: '#00CEC9', bg: 'linear-gradient(135deg,#89f7fe,#66a6ff)', audience: 'İlkokul', energy: 'Sakin' },
  { id: 'truefalse', name: 'Doğru / Yanlış', icon: '✅', desc: 'Hızlı karar ver!', cat: 'Hız', color: '#2ecc71', bg: 'linear-gradient(135deg,#11998e,#38ef7d)', audience: 'Tüm sınıf', energy: 'Orta' },
  { id: 'millionaire', name: 'Kim Milyoner', icon: '💰', desc: 'Joker haklarıyla!', cat: 'Yarışma', color: '#2d3436', bg: 'linear-gradient(135deg,#0c3483,#a2b6df)', featured: true, audience: 'Ortaokul+', energy: 'Odak' },
  { id: 'whack', name: 'Köstebek Vurma', icon: '🐹', desc: 'Doğru cevabı yakala!', cat: 'Aksiyon', color: '#e17055', bg: 'linear-gradient(135deg,#f38181,#fce38a)', audience: 'İlkokul', energy: 'Yüksek' },
  { id: 'race', name: 'Roket Yarışı', icon: '🚀', desc: 'Uzayda yarış!', cat: 'Macera', color: '#0984e3', bg: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)', featured: true, audience: 'Tüm sınıf', energy: 'Yüksek' },
  { id: 'target', name: 'Hedef Tahtası', icon: '🎯', desc: 'Hedefe isabet ettir!', cat: 'Aksiyon', color: '#d63031', bg: 'linear-gradient(135deg,#eb3349,#f45c43)', audience: 'Tüm sınıf', energy: 'Yüksek' },
  { id: 'flashcard', name: 'Bilgi Kartları', icon: '🃏', desc: 'Çevir ve öğren!', cat: 'Öğrenme', color: '#a29bfe', bg: 'linear-gradient(135deg,#a18cd1,#fbc2eb)', audience: 'İlkokul', energy: 'Sakin' },
  { id: 'dice', name: 'Zar Oyunu', icon: '🎲', desc: 'Zar at, kazan!', cat: 'Şans', color: '#fdcb6e', bg: 'linear-gradient(135deg,#f7971e,#ffd200)', audience: 'Tüm sınıf', energy: 'Orta' },
  { id: 'openbox', name: 'Gizemli Kutu', icon: '🎁', desc: 'Kutuda ne var?', cat: 'Şans', color: '#e84393', bg: 'linear-gradient(135deg,#f953c6,#b91d73)', audience: 'İlkokul', energy: 'Orta' },
  { id: 'bomb', name: 'Bomba', icon: '💣', desc: 'Patlamadan cevapla!', cat: 'Hız', color: '#ff7675', bg: 'linear-gradient(135deg,#cb2d3e,#ef473a)', audience: 'Tüm sınıf', energy: 'Yüksek' },
  { id: 'submarine', name: 'Denizaltı', icon: '🌊', desc: 'Derinlere dal!', cat: 'Macera', color: '#0984e3', bg: 'linear-gradient(135deg,#005c97,#363795)', audience: 'Tüm sınıf', energy: 'Orta' },
  { id: 'puzzle', name: 'Yapboz', icon: '🧩', desc: 'Parçaları birleştir!', cat: 'Bulmaca', color: '#00b894', bg: 'linear-gradient(135deg,#43e97b,#38f9d7)', audience: 'İlkokul', energy: 'Sakin' },
  { id: 'treasure', name: 'Hazine Avı', icon: '🗺️', desc: 'İpucunu bul, sandığı aç!', cat: 'Macera', color: '#F59E0B', bg: 'linear-gradient(135deg,#8B5E34,#F59E0B,#FFE66D)', isNew: true, audience: 'İlkokul', energy: 'Yüksek' },
  { id: 'monster', name: 'Canavar Yakalama', icon: '👾', desc: 'Sevimli yaratıkları takımına kat!', cat: 'Koleksiyon', color: '#A78BFA', bg: 'linear-gradient(135deg,#4C1D95,#7C3AED,#4ECDC4)', isNew: true, audience: 'İlkokul', energy: 'Yüksek' },
  { id: 'chef', name: 'Şef Yarışması', icon: '👨‍🍳', desc: 'Doğru tarifle tabağı tamamla!', cat: 'Eğlence', color: '#FF8BA7', bg: 'linear-gradient(135deg,#FF8BA7,#FFD166,#F59E0B)', isNew: true, audience: 'İlkokul', energy: 'Orta' },
  { id: 'hero', name: 'Kahraman Kurtarma', icon: '🦸', desc: 'Şehri kurtaran doğru kararı ver!', cat: 'Macera', color: '#60A5FA', bg: 'linear-gradient(135deg,#2563EB,#6C5CE7,#60A5FA)', isNew: true, audience: 'Tüm sınıf', energy: 'Yüksek' },
  { id: 'dino', name: 'Dino Parkı', icon: '🦖', desc: 'Sevimli dinozor görevine katıl!', cat: 'Keşif', color: '#22C55E', bg: 'linear-gradient(135deg,#14532D,#22C55E,#A3E635)', isNew: true, audience: 'İlkokul', energy: 'Orta' },
];

export const GAME_COMPONENTS = {
  quiz: Quiz,
  balloon: Balloon,
  wheel: Wheel,
  memory: Memory,
  truefalse: TrueFalse,
  millionaire: Millionaire,
  whack: Whack,
  race: Race,
  target: Target,
  flashcard: Flashcard,
  dice: Dice,
  openbox: OpenBox,
  bomb: Bomb,
  submarine: Submarine,
  puzzle: Puzzle,
  treasure: Treasure,
  monster: Monster,
  chef: Chef,
  hero: Hero,
  dino: Dino,
};

export const GAME_MAP = Object.fromEntries(GAME_DEFINITIONS.map((game) => [game.id, game]));
export const GAME_CATEGORIES = ['all', ...new Set(GAME_DEFINITIONS.map((game) => game.cat))];
export const MODES = GAME_DEFINITIONS;
export const FEATURED_GAMES = GAME_DEFINITIONS.filter((game) => game.featured);
export const NEW_GAMES = GAME_DEFINITIONS.filter((game) => game.isNew);

export const getGameMeta = (gameId) => GAME_MAP[gameId] || null;
export const getModesByCategory = (category = 'all') => GAME_DEFINITIONS.filter((game) => category === 'all' || game.cat === category);

export function renderGameByMode(modeId, sharedProps, extraProps) {
  const Component = GAME_COMPONENTS[modeId];
  if (!Component) return null;
  const gameRunId = extraProps?.gameRunId || 0;
  return <Component key={`${modeId}-${gameRunId}`} {...sharedProps} {...extraProps} />;
}
