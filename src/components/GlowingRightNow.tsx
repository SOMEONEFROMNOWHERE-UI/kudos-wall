'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TrendingPerson {
  name: string;
  kudosCount: number;
  glowScore: number;
  latestAt: string;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const GLOW_COLORS = [
  '232, 184, 75',   // gold
  '167, 139, 250',  // purple
  '86, 180, 232',   // cyan
  '111, 207, 151',  // green
  '224, 168, 92',   // amber
];

// Avatar with an animated conic-gradient "live" ring
function LiveAvatar({ name, color, glowScore }: { name: string; color: string; glowScore: number }) {
  const rgbColor = color;
  const opacity = 0.3 + glowScore * 0.5;
  const glow = 6 + glowScore * 16;

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {/* Rotating conic ring — the "live" indicator */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          inset: -2,
          borderRadius: '50%',
          background: `conic-gradient(
            rgba(${rgbColor}, ${opacity}) 0deg,
            rgba(${rgbColor}, ${opacity * 0.3}) 120deg,
            transparent 180deg,
            rgba(${rgbColor}, ${opacity * 0.5}) 280deg,
            rgba(${rgbColor}, ${opacity}) 360deg
          )`,
          zIndex: 0,
        }}
      />
      {/* Inner fill to mask the ring into a border */}
      <div
        style={{
          position: 'absolute',
          inset: 1.5,
          borderRadius: '50%',
          background: '#15151C',
          zIndex: 1,
        }}
      />
      {/* Avatar circle */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: `rgba(${rgbColor}, 0.12)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.68rem',
          fontWeight: 700,
          color: `rgba(${rgbColor}, 1)`,
          boxShadow: `0 0 ${glow}px rgba(${rgbColor}, ${0.2 + glowScore * 0.35})`,
        }}
      >
        {getInitials(name)}
      </div>
    </div>
  );
}

export default function GlowingRightNow() {
  const [trending, setTrending] = useState<TrendingPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetch('/api/trending')
      .then(res => res.ok ? res.json() : [])
      .then(setTrending)
      .catch(() => setTrending([]))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || trending.length === 0) return null;

  return (
    <>
      {/* ── Desktop: sticky sidebar panel ── */}
      <div className="desktop-only">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: 'linear-gradient(135deg, #1A1A1F 0%, #16161A 100%)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            padding: 20,
            position: 'sticky',
            top: 24,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            {/* Pulsing live dot */}
            <div style={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--accent)',
                position: 'absolute', inset: 0,
              }} />
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--accent)',
                position: 'absolute', inset: 0,
                animation: 'pulse-ring 1.8s ease-out infinite',
              }} />
            </div>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#9A9AA8',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              Glowing Right Now
            </span>
          </div>

          {/* People list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <AnimatePresence>
              {trending.map((person, i) => {
                const color = GLOW_COLORS[i % GLOW_COLORS.length];
                return (
                  <motion.div
                    key={person.name}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ delay: i * 0.07, duration: 0.35 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.04)',
                      background: 'rgba(255,255,255,0.02)',
                      transition: 'background 200ms',
                    }}
                  >
                    <LiveAvatar name={person.name} color={color} glowScore={person.glowScore} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#EDEDF0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {person.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#65656F', marginTop: 2 }}>
                        {person.kudosCount} kudos this week
                      </div>
                    </div>

                    {/* Glow intensity bar */}
                    <div style={{
                      width: 3,
                      height: 26,
                      borderRadius: 2,
                      background: `rgba(${color}, ${0.3 + person.glowScore * 0.7})`,
                      boxShadow: `0 0 6px rgba(${color}, ${person.glowScore * 0.6})`,
                      flexShrink: 0,
                    }} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <p style={{ marginTop: 14, fontSize: '11px', color: '#65656F', lineHeight: 1.5 }}>
            Glow intensity reflects recent recognition — not a ranking.
          </p>
        </motion.div>
      </div>

      {/* ── Mobile: tap-to-expand pill ── */}
      <div className="mobile-only">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {!isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #1A1A1F 0%, #16161A 100%)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 9999,
                cursor: 'pointer',
                width: '100%',
                justifyContent: 'center',
                minHeight: 44,
              }}
              aria-label="Show who is glowing right now"
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px rgba(232,184,75,0.6)', animation: 'pulse-ring 1.8s ease-out infinite' }} />
              <span style={{ fontSize: '0.8rem', color: '#9A9AA8', fontWeight: 600 }}>
                Glowing Right Now · {trending.length} people
              </span>
            </button>
          )}

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  background: 'linear-gradient(135deg, #1A1A1F 0%, #16161A 100%)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16,
                  padding: 16,
                  marginTop: 8,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9A9AA8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Glowing Right Now
                    </span>
                    <button onClick={() => setIsExpanded(false)} style={{ fontSize: '0.75rem', color: '#65656F', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} aria-label="Collapse">✕</button>
                  </div>
                  {trending.map((person, i) => {
                    const color = GLOW_COLORS[i % GLOW_COLORS.length];
                    return (
                      <div key={person.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: i < trending.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                        <LiveAvatar name={person.name} color={color} glowScore={person.glowScore * 0.7} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#EDEDF0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{person.name}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
}
