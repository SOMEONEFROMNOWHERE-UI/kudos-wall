'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKudos } from '@/context/KudosContext';

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

// Avatar with an animated conic-gradient "live" ring and online status indicator dot
function LiveAvatar({ name, color, glowScore, isOnline }: { name: string; color: string; glowScore: number; isOnline: boolean }) {
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

      {/* Pulsing online status indicator dot */}
      {isOnline && (
        <span
          style={{
            position: 'absolute',
            bottom: -1,
            right: -1,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#34d399',
            border: '2px solid #16161A', // match sidebar background
            boxShadow: '0 0 8px #34d399, 0 0 2px #34d399',
            zIndex: 10,
            animation: 'presencePulse 2s infinite',
          }}
        />
      )}
    </div>
  );
}

export default function GlowingRightNow() {
  const { live } = useKudos();
  const presenceUsers = live.presenceUsers || [];

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

  if (isLoading) return null;

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
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* SECTION 1: Online Now */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className="presence-pulse-dot" style={{ width: 8, height: 8, background: '#34d399', boxShadow: '0 0 10px #34d399' }} />
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#34D399',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                Online Now ({presenceUsers.length})
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {presenceUsers.length === 0 ? (
                <span style={{ fontSize: '11px', color: '#65656F', fontStyle: 'italic', paddingLeft: 4 }}>
                  Nobody online right now
                </span>
              ) : (
                <AnimatePresence>
                  {presenceUsers.map((name, i) => {
                    const color = GLOW_COLORS[i % GLOW_COLORS.length];
                    return (
                      <motion.div
                        key={name}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 12px',
                          borderRadius: 10,
                          border: '1px solid rgba(52, 211, 153, 0.08)',
                          background: 'rgba(52, 211, 153, 0.02)',
                        }}
                      >
                        <LiveAvatar name={name} color={color} glowScore={0.2} isOnline={true} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: '#EDEDF0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {name}
                          </div>
                          <div style={{ fontSize: '10px', color: '#34d399', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>●</span> Active
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.04)' }} />

          {/* SECTION 2: Glowing Right Now */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
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
              {trending.length === 0 ? (
                <span style={{ fontSize: '11px', color: '#65656F', fontStyle: 'italic', paddingLeft: 4 }}>
                  No recent kudos trending
                </span>
              ) : (
                <AnimatePresence>
                  {trending.map((person, i) => {
                    const color = GLOW_COLORS[i % GLOW_COLORS.length];
                    const isOnline = presenceUsers.some(u => u.toLowerCase() === person.name.toLowerCase());
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
                        }}
                      >
                        <LiveAvatar name={person.name} color={color} glowScore={person.glowScore} isOnline={isOnline} />

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
              )}
            </div>
          </div>

          <p style={{ marginTop: 6, fontSize: '11px', color: '#65656F', lineHeight: 1.5 }}>
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
              aria-label="Show who is glowing and online"
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399', animation: 'presencePulse 2s infinite' }} />
              <span style={{ fontSize: '0.8rem', color: '#9A9AA8', fontWeight: 600 }}>
                {presenceUsers.length} Online Now · {trending.length} Glowing
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
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9A9AA8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Who's Online & Glowing
                    </span>
                    <button onClick={() => setIsExpanded(false)} style={{ fontSize: '0.75rem', color: '#65656F', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} aria-label="Collapse">✕</button>
                  </div>

                  {/* Mobile Online Section */}
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#34D399', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Online Now ({presenceUsers.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {presenceUsers.length === 0 ? (
                        <span style={{ fontSize: '11px', color: '#65656F', fontStyle: 'italic' }}>Nobody online</span>
                      ) : (
                        presenceUsers.map((name, i) => {
                          const color = GLOW_COLORS[i % GLOW_COLORS.length];
                          return (
                            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                              <LiveAvatar name={name} color={color} glowScore={0.1} isOnline={true} />
                              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#EDEDF0' }}>{name}</div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div style={{ height: 1, background: 'rgba(255,255,255,0.04)' }} />

                  {/* Mobile Trending Section */}
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9A9AA8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Glowing Right Now
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {trending.map((person, i) => {
                        const color = GLOW_COLORS[i % GLOW_COLORS.length];
                        const isOnline = presenceUsers.some(u => u.toLowerCase() === person.name.toLowerCase());
                        return (
                          <div key={person.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: i < trending.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                            <LiveAvatar name={person.name} color={color} glowScore={person.glowScore * 0.7} isOnline={isOnline} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#EDEDF0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{person.name}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
}
