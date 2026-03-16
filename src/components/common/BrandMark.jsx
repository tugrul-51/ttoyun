export default function BrandMark({ size = 56, subtle = false, title = 'TT Eğitsel Oyun Platformu' }) {
  return (
    <div
      title={title}
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(18, Math.round(size * 0.34)),
        padding: Math.max(8, Math.round(size * 0.12)),
        background: subtle
          ? 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03))'
          : 'linear-gradient(135deg, rgba(108,92,231,.24), rgba(78,205,196,.22))',
        border: '1px solid rgba(255,255,255,.10)',
        boxShadow: subtle
          ? '0 10px 24px rgba(0,0,0,.18)'
          : '0 16px 34px rgba(78,205,196,.14), 0 10px 24px rgba(108,92,231,.18)',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      <img
        src='tt-logo.png'
        alt='TT logo'
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.16))' }}
      />
    </div>
  );
}
