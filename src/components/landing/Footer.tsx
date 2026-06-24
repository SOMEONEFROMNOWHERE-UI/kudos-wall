'use client';

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: 'var(--space-6) var(--space-4)',
        background: 'var(--surface-base)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', fontWeight: 700 }}>
          <span style={{ color: 'var(--accent)' }}>✦</span> Glow Up Wall
        </div>

        <div
          style={{
            display: 'flex',
            gap: 'var(--space-4)',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
          }}
        >
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>About</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Features</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Contact</a>
        </div>

        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: 'var(--space-2)' }}>
          Made with ✨ for teams who care.
        </div>
      </div>
    </footer>
  );
}
