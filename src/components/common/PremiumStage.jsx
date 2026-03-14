const PREMIUM_STAGE_THEMES = {
  quiz: { icon: '🧠', title: 'Bilgi Şöleni', accent: '#6C5CE7', accent2: '#4ECDC4', mascot: '✨', chips: ['Parlak Kartlar', 'Akıllı Seçim', 'Yıldız Puanı'] },
  balloon: { icon: '🎈', title: 'Balon Şenliği', accent: '#FF6B6B', accent2: '#FFE66D', mascot: '🎉', chips: ['Uçan Sürpriz', 'Renk Patlaması', 'Mutlu Dokunuş'] },
  wheel: { icon: '🎡', title: 'Şans Sahnesi', accent: '#FD79A8', accent2: '#6C5CE7', mascot: '🌟', chips: ['Dönen Işıklar', 'Parlak Ödül', 'Renkli Tur'] },
  memory: { icon: '🃏', title: 'Hafıza Adası', accent: '#4ECDC4', accent2: '#6C5CE7', mascot: '🫧', chips: ['Parlayan Kartlar', 'Tatlı Eşleşme', 'Seri Bonus'] },
  truefalse: { icon: '⚖️', title: 'Karar Sahnesi', accent: '#10B981', accent2: '#3B82F6', mascot: '💡', chips: ['Doğru Parıltı', 'Net Karar', 'Hızlı Seçim'] },
  millionaire: { icon: '👑', title: 'Altın Final', accent: '#FFD166', accent2: '#F39C12', mascot: '🏆', chips: ['Spot Işıkları', 'Büyük Sahne', 'Şampiyon Hissi'] },
  whack: { icon: '🔨', title: 'Eğlence Arenası', accent: '#22C55E', accent2: '#F59E0B', mascot: '🐹', chips: ['Hızlı Refleks', 'Neşeli Arena', 'Patlayan Etki'] },
  race: { icon: '🚀', title: 'Roket Galerisi', accent: '#60A5FA', accent2: '#A78BFA', mascot: '🌠', chips: ['Uzay Işığı', 'Turbo Etki', 'Hedef Pisti'] },
  flashcard: { icon: '📘', title: 'Parlak Kart Stüdyosu', accent: '#06B6D4', accent2: '#A78BFA', mascot: '🌈', chips: ['Canlı Kartlar', 'Tatlı Dönüş', 'Öğrenme Işığı'] },
  openbox: { icon: '🎁', title: 'Sürpriz Kutular', accent: '#FB7185', accent2: '#F59E0B', mascot: '🎊', chips: ['Hediye Patlaması', 'Parlak Kutu', 'Mutlu Sürpriz'] },
  treasure: { icon: '🗺️', title: 'Hazine Haritası', accent: '#F59E0B', accent2: '#FFE66D', mascot: '💰', chips: ['İpucu Yolu', 'Parlak Sandık', 'Macera Hissi'] },
  monster: { icon: '👾', title: 'Yaratık Kulübü', accent: '#A78BFA', accent2: '#4ECDC4', mascot: '🦕', chips: ['Sevimli Takım', 'Yakalama Coşkusu', 'Koleksiyon Hissi'] },
  chef: { icon: '👨‍🍳', title: 'Mini Şef Stüdyosu', accent: '#FF8BA7', accent2: '#FFD166', mascot: '🍰', chips: ['Lezzetli Kartlar', 'Tatlı Mutfak', 'Renkli Menü'] },
  hero: { icon: '🦸', title: 'Kurtarma Merkezi', accent: '#60A5FA', accent2: '#6C5CE7', mascot: '🏅', chips: ['Görev Sahnesi', 'Parlak Zafer', 'Şehir Macerası'] },
  dino: { icon: '🦖', title: 'Dino Keşif Parkı', accent: '#22C55E', accent2: '#A3E635', mascot: '🥚', chips: ['Tatlı Dino', 'Keşif Etkisi', 'Yumurta Sürprizi'] },
};

export default function PremiumStage({ mode, children, compact = false }) {
  const theme = PREMIUM_STAGE_THEMES[mode?.id];
  if (!theme) return children;

  const particles = Array.from({ length: 10 }, (_, index) => ({
    id: `${mode.id}-${index}`,
    left: 4 + ((index * 9.5) % 88),
    top: 10 + ((index * 7.25) % 72),
    size: 16 + (index % 4) * 8,
    duration: 5 + (index % 5),
    delay: index * 0.25,
    opacity: 0.12 + (index % 3) * 0.06,
  }));

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: compact ? 22 : 34, padding: compact ? 6 : 14, background: `linear-gradient(135deg, color-mix(in srgb, ${theme.accent} 16%, rgba(7,12,28,.94)), color-mix(in srgb, ${theme.accent2} 18%, rgba(7,12,28,.94)))`, border: '1px solid rgba(255,255,255,.10)', boxShadow: `0 24px 60px color-mix(in srgb, ${theme.accent} 18%, rgba(0,0,0,.38))`, minHeight: 0, height: '100%' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {particles.map((particle) => (
          <span key={particle.id} style={{ position: 'absolute', left: `${particle.left}%`, top: `${particle.top}%`, width: particle.size, height: particle.size, borderRadius: 999, background: `radial-gradient(circle, color-mix(in srgb, ${theme.accent2} 60%, white) 0%, transparent 72%)`, opacity: particle.opacity, filter: 'blur(1px)', animation: `ttFloat ${particle.duration}s ease-in-out ${particle.delay}s infinite` }} />
        ))}
      </div>
      <div style={{ position: 'relative', display: 'grid', gap: compact ? 4 : 12, minHeight: 0, height: '100%', gridTemplateRows: compact ? 'auto 1fr' : 'auto auto 1fr' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: compact ? 6 : 12, padding: compact ? '6px 8px' : '14px 16px', borderRadius: compact ? 18 : 24, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: compact ? 40 : 64, height: compact ? 40 : 64, borderRadius: compact ? 16 : 22, display: 'grid', placeItems: 'center', fontSize: compact ? 18 : 30, background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, boxShadow: `0 18px 30px color-mix(in srgb, ${theme.accent} 34%, transparent)` }}>{theme.icon}</div>
            <div>
              <div style={{ fontSize: compact ? 8 : 12, textTransform: 'uppercase', letterSpacing: '.14em', fontWeight: 900, color: '#CFE1FF' }}>Premium sahne modu</div>
              <div style={{ marginTop: 2, fontSize: compact ? 'clamp(13px, 1.9vw, 17px)' : 'clamp(22px, 3.6vw, 34px)', color: '#fff', fontWeight: 900 }}>{theme.title}</div>
              <div style={{ marginTop: compact ? 2 : 6, color: '#D6E6FF', lineHeight: 1.4, fontSize: compact ? 10 : 14 }}>Çocuk dostu görseller, güçlü geri bildirim ve akıllı tahta uyumlu sahne düzeni aktif.</div>
            </div>
          </div>
          <div style={{ minWidth: compact ? 100 : 150, alignSelf: 'stretch', padding: compact ? '6px 8px' : '12px 14px', borderRadius: compact ? 14 : 18, background: 'rgba(0,0,0,.16)', border: '1px solid rgba(255,255,255,.08)', display: 'grid', alignContent: 'center', gap: 4 }}>
            <div style={{ color: '#D5E7FF', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8, fontSize: compact ? 11 : 16 }}><span style={{ fontSize: compact ? 14 : 22 }}>{theme.mascot}</span> Sahne koçu</div>
            <div style={{ color: '#AEC4E3', fontSize: compact ? 9 : 13, lineHeight: 1.35 }}>Doğru cevaplarda parlayan sahne, yanlış cevapta öğretici geri bildirim ve özet ekranı hazır.</div>
          </div>
        </div>
        {!compact && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingInline: 4 }}>
          {theme.chips.map((chip) => (
            <div key={chip} style={{ padding: '10px 14px', borderRadius: 999, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.08)', color: '#fff', fontWeight: 800, fontSize: 13 }}>{chip}</div>
          ))}
        </div>}
        <div style={{ minHeight: 0 }}>{children}</div>
      </div>
    </div>
  );
}
