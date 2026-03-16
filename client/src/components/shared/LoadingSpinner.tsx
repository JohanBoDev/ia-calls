export function LoadingSpinner(_props?: { className?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 0',
        gap: 10,
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: '2px solid var(--border)',
          borderTopColor: 'var(--accent)',
          animation: 'spin 0.65s linear infinite',
        }}
      />
      <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
        cargando...
      </span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
