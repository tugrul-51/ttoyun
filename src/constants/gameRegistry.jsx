/* eslint-disable react-refresh/only-export-components */
import Quiz from '../components/games/quiz/Quiz';
import Balloon from '../components/games/balloon/Balloon';
import Wheel from '../components/games/wheel/Wheel';
import Memory from '../components/games/memory/Memory';
import TrueFalse from '../components/games/truefalse/TrueFalse';
import Millionaire from '../components/games/millionaire/Millionaire';
import Whack from '../components/games/whack/Whack';
import Race from '../components/games/race/Race';
import Dice from '../components/games/dice/Dice';
import OpenBox from '../components/games/openbox/OpenBox';
import Bomb from '../components/games/bomb/Bomb';
import Treasure from '../components/games/treasure/Treasure';
import Monster from '../components/games/monster/Monster';
import Chef from '../components/games/chef/Chef';
import Hero from '../components/games/hero/Hero';
import Dino from '../components/games/dino/Dino';

export const GAME_DEFINITIONS = [
  { id: 'quiz', name: 'Zamana Karşı Quiz', icon: '⚡', desc: 'Klasik bilgi yarışması!', cat: 'Hız', color: '#6C5CE7', bg: 'linear-gradient(135deg,#667eea,#764ba2)', featured: true, audience: 'Tüm sınıf', energy: 'Yüksek', maarifFocus: ['Kavramsal anlama', 'Akıl yürütme'], sdoFocus: ['Öz düzenleme', 'Özgüven'], reflectionPrompt: 'Cevap verirken hangi ipuçları sana yardımcı oldu?', questionSelection: { mode: 'all', recommendedCount: 12, buttonLabel: 'Soru setini seç' } },
  { id: 'balloon', name: 'Balon Patlatma', icon: '🎈', desc: 'Doğru balonu patlat!', cat: 'Aksiyon', color: '#FF6B6B', bg: 'linear-gradient(135deg,#f093fb,#f5576c)', featured: true, audience: 'İlkokul', energy: 'Yüksek', maarifFocus: ['Seçici dikkat', 'Hızlı ayırt etme'], sdoFocus: ['Dürtü kontrolü', 'Odaklanma'], reflectionPrompt: 'Hızlı seçim yaparken nasıl sakin kaldın?', questionSelection: { mode: 'all', recommendedCount: 12, buttonLabel: 'Soru setini seç' } },
  { id: 'wheel', name: 'Çarkıfelek', icon: '🎡', desc: 'Çevir, bil, kazan!', cat: 'Şans', color: '#FFB142', bg: 'linear-gradient(135deg,#f6d365,#fda085)', featured: true, audience: 'Tüm sınıf', energy: 'Orta', maarifFocus: ['Strateji kurma', 'Karar verme'], sdoFocus: ['Sabır', 'Duygu yönetimi'], reflectionPrompt: 'Şans ve bilgi birlikteyken nasıl karar verdin?', questionSelection: { mode: 'all', recommendedCount: 12, buttonLabel: 'Soru setini seç' } },
  { id: 'memory', name: 'Hafıza Kartları', icon: '🧠', desc: 'Eşleştir ve hatırla!', cat: 'Bulmaca', color: '#00CEC9', bg: 'linear-gradient(135deg,#89f7fe,#66a6ff)', audience: 'İlkokul', energy: 'Sakin', maarifFocus: ['Dikkat sürdürme', 'Bellek stratejisi'], sdoFocus: ['Sabır', 'Öz düzenleme'], reflectionPrompt: 'Kartları hatırlamak için hangi yöntemi kullandın?', questionSelection: { mode: 'random', limit: 10, recommendedCount: 10, buttonLabel: 'Kart sorularını seç' } },
  { id: 'truefalse', name: 'Doğru / Yanlış', icon: '✅', desc: 'Hızlı karar ver!', cat: 'Hız', color: '#2ecc71', bg: 'linear-gradient(135deg,#11998e,#38ef7d)', audience: 'Tüm sınıf', energy: 'Orta', maarifFocus: ['Kanıt temelli düşünme', 'Hızlı muhakeme'], sdoFocus: ['Sorumlu karar alma', 'Öz farkındalık'], reflectionPrompt: 'Karar verirken hangi kanıtı kullandın?', questionSelection: { mode: 'all', recommendedCount: 12, buttonLabel: 'Soru setini seç' } },
  { id: 'millionaire', name: 'Kim Milyoner', icon: '💰', desc: 'Joker haklarıyla!', cat: 'Yarışma', color: '#2d3436', bg: 'linear-gradient(135deg,#0c3483,#a2b6df)', featured: true, audience: 'Ortaokul+', energy: 'Odak', maarifFocus: ['Derinlemesine düşünme', 'Kanıt değerlendirme'], sdoFocus: ['Stres yönetimi', 'Özgüven'], reflectionPrompt: 'Zor soruda hangi düşünme adımını izledin?', questionSelection: { mode: 'all', recommendedCount: 15, buttonLabel: 'Yarışma sorularını seç' } },
  { id: 'whack', name: 'Köstebek Vurma', icon: '🐹', desc: 'Doğru cevabı yakala!', cat: 'Aksiyon', color: '#e17055', bg: 'linear-gradient(135deg,#f38181,#fce38a)', audience: 'İlkokul', energy: 'Yüksek', maarifFocus: ['Hızlı ayırt etme', 'Dikkat yönetimi'], sdoFocus: ['Dürtü kontrolü', 'Odaklanma'], reflectionPrompt: 'Hızlı tepki verirken doğru seçimi nasıl korudun?', questionSelection: { mode: 'all', recommendedCount: 12, buttonLabel: 'Soru setini seç' } },
  { id: 'race', name: 'Roket Yarışı', icon: '🚀', desc: 'Uzayda yarış!', cat: 'Macera', color: '#0984e3', bg: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)', featured: true, audience: 'Tüm sınıf', energy: 'Yüksek', maarifFocus: ['Hedefe odaklanma', 'Stratejik ilerleme'], sdoFocus: ['Azim', 'Motivasyonu sürdürme'], reflectionPrompt: 'Geride kalsan bile oyuna devam etmeni ne sağladı?', questionSelection: { mode: 'all', recommendedCount: 12, buttonLabel: 'Soru setini seç' } },
  { id: 'dice', name: 'Zar Oyunu', icon: '🎲', desc: 'Zar at, kazan!', cat: 'Şans', color: '#fdcb6e', bg: 'linear-gradient(135deg,#f7971e,#ffd200)', audience: 'Tüm sınıf', energy: 'Orta', maarifFocus: ['Olasılık sezgisi', 'Karar verme'], sdoFocus: ['Esneklik', 'Hayal kırıklığını yönetme'], reflectionPrompt: 'Beklenmedik sonuçlar geldiğinde ne yaptın?', questionSelection: { mode: 'all', recommendedCount: 10, buttonLabel: 'Soru setini seç' } },
  { id: 'openbox', name: 'Gizemli Kutu', icon: '🎁', desc: 'Kutuda ne var?', cat: 'Şans', color: '#e84393', bg: 'linear-gradient(135deg,#f953c6,#b91d73)', audience: 'İlkokul', energy: 'Orta', maarifFocus: ['Tahmin yürütme', 'İpucu kullanma'], sdoFocus: ['Merak', 'Sabır'], reflectionPrompt: 'İpucundan sonuca nasıl ulaştın?', questionSelection: { mode: 'all', recommendedCount: 10, buttonLabel: 'Soru setini seç' } },
  { id: 'bomb', name: 'Bomba', icon: '💣', desc: 'Patlamadan cevapla!', cat: 'Hız', color: '#ff7675', bg: 'linear-gradient(135deg,#cb2d3e,#ef473a)', audience: 'Tüm sınıf', energy: 'Yüksek', maarifFocus: ['Önceliklendirme', 'Baskı altında muhakeme'], sdoFocus: ['Stres yönetimi', 'Öz düzenleme'], reflectionPrompt: 'Zaman baskısında düşünmeni ne düzenledi?', questionSelection: { mode: 'all', recommendedCount: 12, buttonLabel: 'Soru setini seç' } },
  { id: 'treasure', name: 'Hazine Avı', icon: '🗺️', desc: 'İpucunu bul, sandığı aç!', cat: 'Macera', color: '#F59E0B', bg: 'linear-gradient(135deg,#8B5E34,#F59E0B,#FFE66D)', isNew: true, audience: 'İlkokul', energy: 'Yüksek', maarifFocus: ['Problem çözme', 'İpucu birleştirme'], sdoFocus: ['İş birliği', 'Azim'], reflectionPrompt: 'Doğru ipucunu bulmak için hangi adımı izledin?', questionSelection: { mode: 'all', recommendedCount: 12, buttonLabel: 'Soru setini seç' } },
  { id: 'monster', name: 'Canavar Yakalama', icon: '👾', desc: 'Sevimli yaratıkları takımına kat!', cat: 'Koleksiyon', color: '#A78BFA', bg: 'linear-gradient(135deg,#4C1D95,#7C3AED,#4ECDC4)', isNew: true, audience: 'İlkokul', energy: 'Yüksek', maarifFocus: ['Sınıflama', 'Doğru seçeneği ayırt etme'], sdoFocus: ['Aidiyet', 'Motivasyon'], reflectionPrompt: 'Takımına kimi katacağına nasıl karar verdin?', questionSelection: { mode: 'all', recommendedCount: 12, buttonLabel: 'Soru setini seç' } },
  { id: 'chef', name: 'Şef Yarışması', icon: '👨‍🍳', desc: 'Doğru tarifle tabağı tamamla!', cat: 'Eğlence', color: '#FF8BA7', bg: 'linear-gradient(135deg,#FF8BA7,#FFD166,#F59E0B)', isNew: true, audience: 'İlkokul', energy: 'Orta', maarifFocus: ['İlişki kurma', 'Planlı seçim'], sdoFocus: ['Sorumluluk', 'Planlama'], reflectionPrompt: 'Tarifi tamamlarken hangi sırayı izledin?', questionSelection: { mode: 'all', recommendedCount: 12, buttonLabel: 'Soru setini seç' } },
  { id: 'hero', name: 'Kahraman Kurtarma', icon: '🦸', desc: 'Şehri kurtaran doğru kararı ver!', cat: 'Macera', color: '#60A5FA', bg: 'linear-gradient(135deg,#2563EB,#6C5CE7,#60A5FA)', isNew: true, audience: 'Tüm sınıf', energy: 'Yüksek', maarifFocus: ['Sonuçları değerlendirme', 'Etik karar'], sdoFocus: ['Empati', 'Sorumluluk alma'], reflectionPrompt: 'Kahramanca karar verirken kimi düşündün?', questionSelection: { mode: 'all', recommendedCount: 12, buttonLabel: 'Soru setini seç' } },
  { id: 'dino', name: 'Dino Parkı', icon: '🦖', desc: 'Sevimli dinozor görevine katıl!', cat: 'Keşif', color: '#22C55E', bg: 'linear-gradient(135deg,#14532D,#22C55E,#A3E635)', isNew: true, audience: 'İlkokul', energy: 'Orta', maarifFocus: ['Gözlem', 'Keşfetme'], sdoFocus: ['Merak', 'Sabır'], reflectionPrompt: 'Yeni bir şeyi keşfederken hangi ayrıntıya dikkat ettin?', questionSelection: { mode: 'all', recommendedCount: 12, buttonLabel: 'Soru setini seç' } },
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
  dice: Dice,
  openbox: OpenBox,
  bomb: Bomb,
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
