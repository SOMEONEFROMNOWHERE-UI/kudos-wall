'use client';

import { useKudos } from '@/context/KudosContext';
import { LogOut } from 'lucide-react';

interface NavbarProps {
  onOpenJar: () => void;
  onOpenComposer: () => void;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function Navbar({ onOpenJar, onOpenComposer }: NavbarProps) {
  const { currentUser, totalCount, logout } = useKudos();

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-navbar)' as unknown as number,
        borderBottom: '1px solid var(--surface-border)',
        padding: '0 var(--space-4)',
        background: 'rgba(11,11,15,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: 60,
          gap: 'var(--space-3)',
        }}
      >
        {/* ── Logo ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
          <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>✦</span>
          <span
            style={{
              fontSize: 'var(--text-title)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
            }}
          >
            Glow Up Wall
          </span>
        </div>

        {/* ── Center: Pulse counter — ambient, not prominent ── */}
        <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span
            style={{
              fontSize: 'var(--text-label)',
              color: 'var(--text-tertiary)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {totalCount > 0 ? `${totalCount} kudos shared` : 'Be the first to give kudos'}
          </span>
        </div>

        {/* ── Right side ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {/* Streak — only if earned */}
          {currentUser && currentUser.streak > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 9999,
                border: '1px solid rgba(255,107,74,0.25)',
                background: 'rgba(255,107,74,0.08)',
                fontSize: 'var(--text-label)',
              }}
            >
              <span>🔥</span>
              <span style={{ fontWeight: 700, color: 'var(--cat-fire)' }}>{currentUser.streak}</span>
            </div>
          )}

          {/* Give Kudos — ghost (outline), not accent filled */}
          <button
            className="btn-ghost desktop-only"
            onClick={onOpenComposer}
            style={{ borderRadius: 9999, padding: '8px 18px' }}
          >
            + Give Kudos
          </button>

          {/* My Jar — ghost */}
          <button
            className="btn-ghost"
            onClick={onOpenJar}
            style={{ borderRadius: 9999, padding: '8px 14px', minHeight: 40 }}
          >
            <span>🍯</span>
            <span className="desktop-only" style={{ marginLeft: 4 }}>My Jar</span>
          </button>

          {/* User + logout */}
          {currentUser && (
            <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              {/* Avatar chip */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: '4px 12px 4px 4px',
                  borderRadius: 9999,
                  border: '1px solid var(--surface-border)',
                  background: 'var(--surface-raised)',
                }}
              >
                {currentUser.image ? (
                  <img
                    src={currentUser.image}
                    alt={currentUser.name}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      border: '1px solid var(--surface-border)',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: 'var(--accent-muted)',
                      border: '1px solid var(--accent-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: 'var(--accent)',
                    }}
                  >
                    {getInitials(currentUser.name)}
                  </div>
                )}
                <span style={{ fontSize: 'var(--text-label)', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {currentUser.name}
                </span>
              </div>

              <button
                onClick={logout}
                className="btn-icon"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
