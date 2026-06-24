'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useKudos } from '@/context/KudosContext';

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// HSL avatar color hashing for visual consistency
function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return {
    base: `hsl(${hue}, 70%, 60%)`,
    ring: `hsla(${hue}, 70%, 60%, 0.25)`,
    text: `hsl(${hue}, 80%, 15%)`,
  };
}

export default function LivePresenceStrip() {
  const { live, currentUser } = useKudos();
  const uniqueUsers = Array.from(new Set(live.presenceUsers));
  const others = uniqueUsers.filter(u => u !== currentUser?.name);
  const total = uniqueUsers.length;

  if (total < 1) return null;

  // Mobile: show max 3 avatars + overflow count
  const mobileMax = 3;
  const mobileVisible = uniqueUsers.slice(0, mobileMax);
  const mobileOverflow = Math.max(0, uniqueUsers.length - mobileMax);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="presence-strip"
      style={{
        padding: '8px var(--space-4)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}
      >
        {/* Live Status indicator */}
        <div style={{ position: 'relative', width: 8, height: 8, flexShrink: 0, marginRight: 4 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--positive)',
              position: 'absolute',
              inset: 0,
            }}
          />
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--positive)',
              position: 'absolute',
              inset: 0,
              animation: 'pulse-ring 1.8s ease-out infinite',
            }}
          />
        </div>

        {/* ── Desktop View: Overlapping avatar stack + clean label ── */}
        <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <AnimatePresence>
              {uniqueUsers.slice(0, 5).map((name, i) => {
                const colors = getAvatarColor(name);
                return (
                  <motion.div
                    key={name}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    title={name}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: colors.base,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 0 0 2px rgba(18, 18, 26, 0.8)', // premium overlapping overlap divider
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      color: colors.text,
                      marginLeft: i === 0 ? 0 : -8,
                      zIndex: 10 - i,
                      position: 'relative',
                    }}
                  >
                    {getInitials(name)}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          <span 
            style={{ 
              fontSize: '12px', 
              color: '#8888AA', 
              fontWeight: 500,
              letterSpacing: '0.01em',
              transition: 'color 0.2s',
            }}
          >
            {total === 1
              ? 'Just you here'
              : others.length === 1
              ? `${others[0]} is also here`
              : `${total} teammates online`}
          </span>
        </div>

        {/* ── Mobile View: Overlapping stack + compact count ── */}
        <div className="mobile-only" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {mobileVisible.map((name, i) => {
              const colors = getAvatarColor(name);
              return (
                <div
                  key={name}
                  title={name}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: colors.base,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 0 0 2px rgba(18, 18, 26, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.55rem',
                    fontWeight: 700,
                    color: colors.text,
                    marginLeft: i === 0 ? 0 : -6,
                    zIndex: 10 - i,
                    position: 'relative',
                  }}
                >
                  {getInitials(name)}
                </div>
              );
            })}
            {mobileOverflow > 0 && (
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'var(--surface-border)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.5rem',
                  fontWeight: 700,
                  color: '#8888AA',
                  marginLeft: -6,
                  position: 'relative',
                  zIndex: 0,
                  boxShadow: '0 0 0 2px rgba(18, 18, 26, 0.8)',
                }}
              >
                +{mobileOverflow}
              </div>
            )}
          </div>
          <span style={{ fontSize: '11px', color: '#8888AA', fontWeight: 500 }}>
            {total === 1 ? 'Just you' : `${total} online`}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
