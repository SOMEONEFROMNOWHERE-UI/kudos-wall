'use client';

import { useKudos } from '@/context/KudosContext';
import { LogOut, Users, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavbarProps {
  onOpenJar: () => void;
  onOpenComposer: () => void;
  onOpenFriends?: () => void;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function Navbar({ onOpenJar, onOpenComposer, onOpenFriends }: NavbarProps) {
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
      {/* SVG Gradient Definition for Flame */}
      <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
        <defs>
          <linearGradient id="flame-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FF3300" />
            <stop offset="50%" stopColor="#FF7700" />
            <stop offset="100%" stopColor="#FFCC00" />
          </linearGradient>
        </defs>
      </svg>
      <div
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: 60,
          gap: 'var(--space-3)',
        }}
      >
        {/* ── Logo ── */}
        <motion.div 
          whileHover="hover"
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0, cursor: 'default' }}
        >
          <motion.span 
            variants={{
              hover: { rotate: 180, scale: 1.2, color: 'var(--accent)' }
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            style={{ fontSize: '1.25rem', lineHeight: 1, display: 'inline-flex', alignItems: 'center', transform: 'translateY(2px)' }}
          >
            ✦
          </motion.span>
          <motion.span
            variants={{
              hover: { textShadow: '0 0 16px rgba(232,184,75,0.4)' }
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
              fontSize: 'var(--text-title)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
            }}
          >
            Glow Up Wall
          </motion.span>
        </motion.div>

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
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="streak-badge"
              title={`${currentUser.streak} day streak!`}
            >
              <Flame size={14} className="streak-badge-flame-svg" />
              <span className="streak-badge-number">{currentUser.streak}</span>
            </motion.div>
          )}

          {/* Give Kudos — glassy, with spinning border laser */}
          <button
            className="nav-btn-glassy desktop-only"
            onClick={onOpenComposer}
            style={{ borderRadius: 9999, padding: '8px 18px' }}
          >
            <div className="nav-btn-glow-border" />
            <span style={{ position: 'relative', zIndex: 3 }}>+ Give Kudos</span>
          </button>

          {/* Friends — desktop only */}
          {onOpenFriends && (
            <button
              className="nav-btn-glassy desktop-only"
              onClick={onOpenFriends}
              aria-label="Friends & Groups"
              style={{ borderRadius: 9999, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <div className="nav-btn-glow-border" />
              <Users size={14} style={{ position: 'relative', zIndex: 3 }} />
              <span style={{ position: 'relative', zIndex: 3 }}>Friends</span>
            </button>
          )}

          {/* My Jar — glassy */}
          <button
            className="nav-btn-glassy"
            onClick={onOpenJar}
            style={{ borderRadius: 9999, padding: '8px 14px', minHeight: 40 }}
          >
            <div className="nav-btn-glow-border" />
            <span style={{ position: 'relative', zIndex: 3 }}>🍯</span>
            <span className="desktop-only" style={{ marginLeft: 4, position: 'relative', zIndex: 3 }}>My Jar</span>
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
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  background: 'rgba(255, 255, 255, 0.03)',
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
                      border: '1px solid rgba(255, 255, 255, 0.1)',
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
