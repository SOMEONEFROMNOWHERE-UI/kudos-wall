'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKudos } from '@/context/KudosContext';
import { getAvatarColor, getInitials } from '@/lib/utils';
import { Flame, Sparkles, Activity, Plus } from 'lucide-react';
import TeamHeartbeat from './TeamHeartbeat';
import ProfileModal from './ProfileModal';

interface TrendingPerson {
  name: string;
  kudosCount: number;
  glowScore: number;
  latestAt: string;
}

interface GlowingRightNowProps {
  onOpenComposer?: () => void;
}

// Avatar with matching HSL backdrop-glow and presence indicators
function LiveAvatar({ name, glowScore, isOnline }: { name: string; glowScore: number; isOnline: boolean }) {
  const initials = getInitials(name);
  const colors = getAvatarColor(name);
  const rgbColor = colors.rgb;
  
  // Outer glow size based on trending glowScore or online status
  const glow = isOnline ? 12 : 6 + glowScore * 14;
  const glowOpacity = isOnline ? 0.35 : 0.15 + glowScore * 0.35;

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {/* Dynamic Colored Glowing Aura */}
      <motion.div
        animate={isOnline ? {
          scale: [0.95, 1.06, 0.95],
          opacity: [glowOpacity * 0.7, glowOpacity, glowOpacity * 0.7],
        } : {}}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          inset: -2,
          borderRadius: '50%',
          background: `rgba(${rgbColor}, 1)`,
          filter: `blur(${glow}px)`,
          opacity: glowOpacity,
          zIndex: 0,
        }}
      />
      
      {/* Inner fill to mask background blur */}
      <div
        style={{
          position: 'absolute',
          inset: 1,
          borderRadius: '50%',
          background: '#15151C', // Match parent surface color
          zIndex: 1,
        }}
      />

      {/* Actual Avatar circle */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: colors.base,
          border: '1.5px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.72rem',
          fontWeight: 700,
          color: colors.text,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 6px rgba(0,0,0,0.3)`,
        }}
      >
        {initials}
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
            border: '2px solid #16161A',
            boxShadow: '0 0 6px #34d399, 0 0 2px #34d399',
            zIndex: 10,
            animation: 'presencePulse 2s infinite',
          }}
        />
      )}
    </div>
  );
}

export default function GlowingRightNow({ onOpenComposer }: GlowingRightNowProps) {
  const { live } = useKudos();
  const presenceUsers = live?.presenceUsers || [];

  const [trending, setTrending] = useState<TrendingPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');

  const handleProfileClick = (username: string) => {
    setSelectedUser(username);
    setIsProfileModalOpen(true);
  };

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
      {/* ── Desktop: sticky sidebar panel wrapped in conic rotating borders ── */}
      <div className="desktop-only" style={{ position: 'sticky', top: 24, zIndex: 10 }}>
        <div className="kudos-card-wrapper" style={{ width: '100%' }}>
          {/* Animated Conic Rainbow Border for the entire Sidebar box */}
          <div className="kudos-card-glow-border" style={{ borderRadius: 16 }} />
          
          <motion.div
            className="kudos-card-inner"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              borderRadius: 16,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              background: 'rgba(18, 18, 26, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
            }}
          >
            {/* Quick Action Compose Block (Glassy, Rainbow Glowing border) */}
            {onOpenComposer && (
              <div className="kudos-card-wrapper" style={{ width: '100%' }}>
                <div className="kudos-card-glow-border" style={{ borderRadius: 12 }} />
                
                <motion.div
                  className="kudos-card-inner"
                  style={{
                    borderRadius: 12,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    background: 'rgba(24, 24, 35, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                      <Sparkles size={13} /> Recognize Teammates
                    </h4>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 5, marginBottom: 0, lineHeight: 1.45 }}>
                      Celebrate a win, shout out a colleague, or say thanks to make them glow!
                    </p>
                  </div>
                  
                  {/* Premium Rotating Border Glassy Button */}
                  <button
                    onClick={onOpenComposer}
                    className="nav-btn-glassy"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      width: '100%',
                      height: 38,
                      borderRadius: 8,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    <div className="nav-btn-glow-border" style={{ borderRadius: 8 }} />
                    <span style={{ position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Plus size={14} strokeWidth={2.5} />
                      Give Kudos
                    </span>
                  </button>
                </motion.div>
              </div>
            )}

            {/* SECTION 1: Online Now */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Activity size={14} style={{ color: '#34d399', filter: 'drop-shadow(0 0 4px rgba(52,211,153,0.3))' }} />
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 750,
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
                  <AnimatePresence initial={false}>
                    {presenceUsers.map((name) => (
                      <div key={name} className="kudos-card-wrapper" style={{ width: '100%' }}>
                        <div className="kudos-card-glow-border" style={{ borderRadius: 10 }} />
                        
                        <div
                          className="kudos-card-inner"
                          onClick={() => handleProfileClick(name)}
                          style={{
                            borderRadius: 10,
                            padding: '8px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            background: 'rgba(24, 24, 35, 0.65)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                            willChange: 'transform',
                            cursor: 'pointer',
                          }}
                        >
                          <LiveAvatar name={name} glowScore={0.1} isOnline={true} />
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
                            <div style={{ fontSize: '10px', color: '#34d399', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 550 }}>
                              <span>●</span> Active
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* Premium Gold/Glass Separator Divider */}
            <div style={{
              height: 1,
              background: 'linear-gradient(to right, rgba(255, 255, 255, 0.01) 0%, rgba(255, 255, 255, 0.08) 20%, rgba(232, 184, 75, 0.15) 50%, rgba(255, 255, 255, 0.08) 80%, rgba(255, 255, 255, 0.01) 100%)'
            }} />

            {/* Team Heartbeat Graph (Only shows if in group) */}
            <TeamHeartbeat />

            {/* Premium Gold/Glass Separator Divider */}
            <div style={{
              height: 1,
              background: 'linear-gradient(to right, rgba(255, 255, 255, 0.01) 0%, rgba(255, 255, 255, 0.08) 20%, rgba(232, 184, 75, 0.15) 50%, rgba(255, 255, 255, 0.08) 80%, rgba(255, 255, 255, 0.01) 100%)'
            }} />

            {/* SECTION 2: Glowing Right Now */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Flame size={14} style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 4px rgba(232,184,75,0.3))' }} />
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 750,
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
                  <AnimatePresence initial={false}>
                    {trending.map((person, i) => {
                      const isOnline = presenceUsers.some(u => u.toLowerCase() === person.name.toLowerCase());
                      const avatarColors = getAvatarColor(person.name);
                      const rgbColor = avatarColors.rgb;

                      return (
                        <div key={person.name} className="kudos-card-wrapper" style={{ width: '100%' }}>
                          <div className="kudos-card-glow-border" style={{ borderRadius: 10 }} />
                          
                          <div
                            className="kudos-card-inner"
                            onClick={() => handleProfileClick(person.name)}
                            style={{
                              borderRadius: 10,
                              padding: '8px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              background: 'rgba(24, 24, 35, 0.65)',
                              border: '1px solid rgba(255, 255, 255, 0.05)',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                              willChange: 'transform',
                              cursor: 'pointer',
                            }}
                          >
                            <LiveAvatar name={person.name} glowScore={person.glowScore} isOnline={isOnline} />

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
                              <div style={{ fontSize: '10px', color: '#65656F', marginTop: 2 }}>
                                {person.kudosCount} kudos this week
                              </div>
                            </div>

                            {/* Interactive Spark Badge */}
                            <div
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: `rgba(${rgbColor}, 1)`,
                                background: `rgba(${rgbColor}, 0.08)`,
                                border: `1px solid rgba(${rgbColor}, 0.18)`,
                                padding: '3px 8px',
                                borderRadius: 9999,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                flexShrink: 0,
                                boxShadow: `0 2px 6px rgba(0,0,0,0.15)`,
                              }}
                            >
                              <Flame size={11} fill={`rgba(${rgbColor}, 0.2)`} />
                              <span>{person.kudosCount}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </div>

            <p style={{ marginTop: 2, fontSize: '10px', color: '#555562', lineHeight: 1.5, fontStyle: 'italic', textAlign: 'center' }}>
              Glow reflects recent recognition intensity.
            </p>
          </motion.div>
        </div>
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
                background: 'rgba(21, 21, 28, 0.75)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
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
                  background: 'rgba(21, 21, 28, 0.85)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16,
                  padding: 16,
                  marginTop: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 750, color: '#9A9AA8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Activity size={12} /> Team Status
                    </span>
                    <button onClick={() => setIsExpanded(false)} style={{ fontSize: '0.75rem', color: '#65656F', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} aria-label="Collapse">✕</button>
                  </div>

                  {/* Mobile Online Section */}
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 750, color: '#34D399', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Online Now ({presenceUsers.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {presenceUsers.length === 0 ? (
                        <span style={{ fontSize: '11px', color: '#65656F', fontStyle: 'italic' }}>Nobody online</span>
                      ) : (
                        presenceUsers.map((name) => (
                          <div key={name} onClick={() => handleProfileClick(name)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', cursor: 'pointer' }}>
                            <LiveAvatar name={name} glowScore={0.1} isOnline={true} />
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#EDEDF0' }}>{name}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div style={{ height: 1, background: 'rgba(255,255,255,0.04)' }} />

                  {/* Mobile Trending Section */}
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 750, color: '#9A9AA8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Glowing Right Now
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {trending.map((person) => {
                        const isOnline = presenceUsers.some(u => u.toLowerCase() === person.name.toLowerCase());
                        const avatarColors = getAvatarColor(person.name);
                        const rgbColor = avatarColors.rgb;
                        
                        return (
                          <div key={person.name} onClick={() => handleProfileClick(person.name)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <LiveAvatar name={person.name} glowScore={person.glowScore} isOnline={isOnline} />
                              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#EDEDF0' }}>{person.name}</div>
                            </div>
                            <div
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                color: `rgba(${rgbColor}, 1)`,
                                background: `rgba(${rgbColor}, 0.08)`,
                                border: `1px solid rgba(${rgbColor}, 0.18)`,
                                padding: '2px 8px',
                                borderRadius: 9999,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                              }}
                            >
                              <Flame size={10} fill={`rgba(${rgbColor}, 0.2)`} />
                              <span>{person.kudosCount}</span>
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

      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        username={selectedUser} 
      />
    </>
  );
}
