export default function BackButton({ onClick, label = 'Oyunlara Dön', compact = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: compact ? '8px 10px' : '12px 16px',
        borderRadius: '14px',
        fontSize: compact ? '12px' : '14px',
        fontWeight: '800',
        background: 'rgba(255,255,255,.08)',
        border: '1px solid rgba(255,255,255,.14)',
        color: '#fff',
        cursor: 'pointer',
        minWidth: compact ? '106px' : '152px',
      }}
    >
      ← {label}
    </button>
  );
}
