'use client';

import { useState } from 'react';
import { useKudos } from '@/context/KudosContext';
import { LogOut, Users, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [logoSparkles, setLogoSparkles] = useState<{ id: number; x: number; y: number; size: number }[]>([]);

  const handleLogoMouseEnter = () => {
    setIsLogoHovered(true);
    const particles = Array.from({ length: 5 }).map((_, i) => {
      const angle = (i / 5) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const distance = 16 + Math.random() * 20;
      return {
        id: Date.now() + i + Math.random(),
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        size: 3 + Math.random() * 3,
      };
    });
    setLogoSparkles(particles);
  };

  const handleLogoMouseLeave = () => {
    setIsLogoHovered(false);
    setLogoSparkles([]);
  };

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
        <div
          onMouseEnter={handleLogoMouseEnter}
          onMouseLeave={handleLogoMouseLeave}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0,
            cursor: 'pointer',
            position: 'relative',
            paddingRight: '12px',
          }}
        >
          {/* Defs for Logo Sparkle Gradient */}
          <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
            <defs>
              <linearGradient id="logo-sparkle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF275" />
                <stop offset="60%" stopColor="#F5A623" />
                <stop offset="100%" stopColor="#FF5096" />
              </linearGradient>
            </defs>
          </svg>

          {/* Sparkle Icon Container */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Tiny floating hover sparkles */}
            <AnimatePresence>
              {logoSparkles.map(p => (
                <motion.svg
                  key={p.id}
                  viewBox="0 0 24 24"
                  fill="none"
                  initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                  animate={{ opacity: 0, scale: 1.2, x: p.x, y: p.y }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    width: p.size,
                    height: p.size,
                    pointerEvents: 'none',
                    zIndex: 10,
                  }}
                >
                  <path
                    d="M12 2C12 2 13.5 8.5 15.5 10.5C17.5 12.5 24 14 24 14C24 14 17.5 15.5 15.5 17.5C13.5 19.5 12 26 12 26C12 26 10.5 19.5 8.5 17.5C6.5 15.5 0 14 0 14C0 14 6.5 12.5 8.5 10.5C10.5 8.5 12 2 12 2Z"
                    fill="#FBBF24"
                  />
                </motion.svg>
              ))}
            </AnimatePresence>

            <motion.svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              animate={isLogoHovered ? {
                rotate: [0, 45, -15, 15, 0],
                scale: 1.2,
                filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.65))',
              } : {
                rotate: 0,
                scale: 1,
                filter: 'drop-shadow(0 0 0px rgba(0,0,0,0))',
              }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              style={{ width: '18px', height: '18px', display: 'block' }}
            >
              <path
                d="M12 2C12 2 13.5 8.5 15.5 10.5C17.5 12.5 24 14 24 14C24 14 17.5 15.5 15.5 17.5C13.5 19.5 12 26 12 26C12 26 10.5 19.5 8.5 17.5C6.5 15.5 0 14 0 14C0 14 6.5 12.5 8.5 10.5C10.5 8.5 12 2 12 2Z"
                fill="url(#logo-sparkle-grad)"
              />
            </motion.svg>
          </div>

          {/* Text Logo with metallic gradient sweep on hover */}
          <motion.span
            animate={isLogoHovered ? {
              backgroundPosition: ['0% 0%', '200% 0%'],
              textShadow: [
                '0 0 0px rgba(232,184,75,0)',
                '0 0 20px rgba(251,191,36,0.4)',
                '0 0 0px rgba(232,184,75,0)'
              ]
            } : {
              backgroundPosition: '0% 0%',
              textShadow: '0 0 0px rgba(0,0,0,0)'
            }}
            transition={isLogoHovered ? {
              backgroundPosition: { duration: 2, ease: 'linear', repeat: Infinity },
              textShadow: { duration: 2, ease: 'easeInOut', repeat: Infinity }
            } : { duration: 0.3 }}
            style={{
              fontSize: 'var(--text-title)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              backgroundImage: 'linear-gradient(90deg, #FFFFFF 0%, #FFE082 30%, #F5A623 50%, #FF70A6 70%, #FFFFFF 100%)',
              backgroundSize: '200% auto',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block',
            }}
          >
            Glow Up Wall
          </motion.span>
        </div>

        {/* ── Center: Live Pulse Counter ── */}
        <div className="desktop-only" style={{ display: 'flex', alignItems: 'center' }}>
          <motion.div
            key={totalCount}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 450, damping: 18 }}
            className="nav-btn-glassy"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid transparent',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              backdropFilter: 'blur(8px)',
              cursor: 'default',
              height: 36,
            }}
          >
            <div className="nav-btn-glow-border" style={{ opacity: 0.5 }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative', zIndex: 3 }}>
              {/* Premium Sparkles Icon */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  width: '13px',
                  height: '13px',
                  color: '#FBBF24',
                  filter: 'drop-shadow(0 0 5px rgba(251,191,36,0.45))',
                }}
              >
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.3-6.3l-.7.7M6.7 17.3l-.7.7m12.6 0l-.7-.7M6.7 6.7l-.7-.7" />
              </svg>

              {/* Counter Text */}
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#EDEDF0',
                  letterSpacing: '0.01em',
                }}
              >
                {totalCount > 0 ? (
                  <>
                    <strong style={{ color: '#FBBF24', fontWeight: 800, marginRight: '4px' }}>{totalCount}</strong>
                    kudos shared
                  </>
                ) : (
                  'Be the first to give kudos'
                )}
              </span>
            </div>
          </motion.div>
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
              {/* Avatar chip with glowing border animation */}
              <div
                className="nav-btn-glassy"
                onMouseEnter={() => setIsAvatarHovered(true)}
                onMouseLeave={() => setIsAvatarHovered(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 14px 4px 4px',
                  borderRadius: 9999,
                  background: isAvatarHovered ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid transparent',
                  transition: 'background-color 0.3s ease',
                  cursor: 'pointer',
                  height: 36,
                }}
              >
                <div className="nav-btn-glow-border" style={{ opacity: isAvatarHovered ? 1 : 0.45 }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', zIndex: 3 }}>
                  {currentUser.image ? (
                    <img
                      src={currentUser.image}
                      alt={currentUser.name}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: '1.5px solid rgba(255, 255, 255, 0.2)',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'var(--accent-muted)',
                        border: '1.5px solid var(--accent-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: 'var(--accent)',
                      }}
                    >
                      {getInitials(currentUser.name)}
                    </div>
                  )}
                  <span style={{ fontSize: '12px', color: '#EDEDF0', fontWeight: 600 }}>
                    {currentUser.name}
                  </span>
                </div>
              </div>

              {/* Sign out button with glassy border animation */}
              <button
                onClick={logout}
                className="nav-btn-glassy"
                aria-label="Sign out"
                title="Sign out"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid transparent',
                  padding: 0,
                }}
              >
                <div className="nav-btn-glow-border" style={{ borderRadius: '10px' }} />
                <LogOut size={13} style={{ position: 'relative', zIndex: 3 }} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
