import BrandMark from './BrandMark';

export default function GameHeader({ title, brandTitle, subtitle = '', right, compact = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
        <BrandMark size={compact ? 34 : 56} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: compact ? 9 : 12, fontWeight: 900, color: '#91A7C7', letterSpacing: '.08em', textTransform: 'uppercase' }}>{brandTitle}</div>
          <div style={{ fontSize: compact ? 'clamp(14px, 1.8vw, 18px)' : 'clamp(22px, 3vw, 28px)', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>{title}</div>
          {subtitle ? <div style={{ fontSize: compact ? 10 : 13, color: '#9FB3CD', marginTop: compact ? 2 : 4 }}>{subtitle}</div> : null}
        </div>
      </div>
      {right}
    </div>
  );
}
