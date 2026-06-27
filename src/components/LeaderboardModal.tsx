'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, TrendingUp, Heart, Medal, Star } from 'lucide-react';
import { getAvatarColor, getInitials } from '@/lib/utils';
import type { KudosData } from '@/types';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LeaderboardUser {
  name: string;
  score: number;
}

export default function LeaderboardModal({ isOpen, onClose }: LeaderboardModalProps) {
  const [data, setData] = useState<{
    topReceived: LeaderboardUser[];
    topGiven: LeaderboardUser[];
    topPosts: (KudosData & { score: number })[];
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'received' | 'given' | 'posts'>('received');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      fetch('/api/leaderboard')
        .then(res => res.json())
        .then(d => {
          setData(d);
          setLoading(false);
        });
    } else {
      document.body.style.overflow = '';
      setLoading(true);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const renderTop3 = (users: LeaderboardUser[]) => {
    if (users.length === 0) return <div style={{ textAlign: 'center', color: '#888', padding: '40px 0' }}>No data yet</div>;

    // Ordered for podium: 2nd, 1st, 3rd
    const podium = [
      users[1] && { ...users[1], rank: 2, color: '#C0C0C0', height: 110, gradient: 'linear-gradient(180deg, rgba(192,192,192,0.3) 0%, rgba(192,192,192,0) 100%)' },
      users[0] && { ...users[0], rank: 1, color: '#FFD700', height: 160, gradient: 'linear-gradient(180deg, rgba(255,215,0,0.3) 0%, rgba(255,215,0,0) 100%)' },
      users[2] && { ...users[2], rank: 3, color: '#CD7F32', height: 90, gradient: 'linear-gradient(180deg, rgba(205,127,50,0.3) 0%, rgba(205,127,50,0) 100%)' }
    ].filter(Boolean) as any[];

    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 32, marginBottom: 40, marginTop: 64 }}>
        {podium.map((u, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              {u.rank === 1 && <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }} style={{ position: 'absolute', top: -36, left: '50%', transform: 'translateX(-50%)' }}><Trophy size={32} color={u.color} fill={u.color} style={{ filter: 'drop-shadow(0 0 12px rgba(255,215,0,0.6))' }} /></motion.div>}
              <div style={{
                width: u.rank === 1 ? 72 : 56, height: u.rank === 1 ? 72 : 56, borderRadius: '50%', background: getAvatarColor(u.name).base,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: getAvatarColor(u.name).text,
                fontWeight: 'bold', fontSize: u.rank === 1 ? '22px' : '18px', border: `3px solid ${u.color}`,
                boxShadow: `0 0 20px ${u.color}40`, zIndex: 10, position: 'relative'
              }}>
                {getInitials(u.name)}
              </div>
              <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', background: u.color, color: '#000', width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', border: '2px solid var(--bg-card)', zIndex: 11 }}>
                {u.rank}
              </div>
            </div>
            <div style={{ fontSize: u.rank === 1 ? '16px' : '14px', fontWeight: '800', color: '#FFF', marginTop: 8, whiteSpace: 'nowrap', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>{u.name}</div>
            <div style={{ fontSize: '14px', color: u.color, fontWeight: 'bold', marginTop: 4 }}>{u.score}</div>
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: u.height }}
              transition={{ type: 'spring', stiffness: 50, damping: 15, delay: 0.2 }}
              style={{ width: u.rank === 1 ? 72 : 60, background: u.gradient, borderTopLeftRadius: 12, borderTopRightRadius: 12, marginTop: 12, border: `1px solid ${u.color}30`, borderBottom: 'none', position: 'relative' }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${u.color}, transparent)` }} />
            </motion.div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderList = (users: LeaderboardUser[]) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {users.slice(3).map((u, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * idx }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', transition: 'transform 0.2s, background 0.2s', cursor: 'default' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.background = 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0px)'; e.currentTarget.style.background = 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)'; }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#666', width: 24 }}>{idx + 4}</span>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: getAvatarColor(u.name).base, display: 'flex', alignItems: 'center', justifyContent: 'center', color: getAvatarColor(u.name).text, fontWeight: 'bold', fontSize: '13px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                {getInitials(u.name)}
              </div>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#EEE' }}>{u.name}</span>
            </div>
            <div style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '16px', background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: 20 }}>{u.score}</div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            style={{
              position: 'relative', width: '100%', maxWidth: 540, background: 'linear-gradient(180deg, rgba(30,30,30,0.95) 0%, rgba(20,20,20,0.95) 100%)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 24, padding: 32, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}
          >
            <button onClick={onClose} style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
              <X size={18} />
            </button>

            <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12, color: '#FFF', letterSpacing: '-0.02em' }}>
              <div style={{ background: 'linear-gradient(135deg, #FFD700, #FDB931)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex' }}><Trophy size={28} color="#FFD700" /></div> Leaderboard
            </h2>

            <div style={{ display: 'flex', gap: 8, marginBottom: 32, background: 'rgba(0,0,0,0.3)', padding: 6, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
              <button onClick={() => setActiveTab('received')} style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: 'none', background: activeTab === 'received' ? 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))' : 'transparent', color: activeTab === 'received' ? '#FFF' : '#888', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeTab === 'received' ? '0 4px 12px rgba(0,0,0,0.2)' : 'none' }}>Most Loved</button>
              <button onClick={() => setActiveTab('given')} style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: 'none', background: activeTab === 'given' ? 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))' : 'transparent', color: activeTab === 'given' ? '#FFF' : '#888', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeTab === 'given' ? '0 4px 12px rgba(0,0,0,0.2)' : 'none' }}>Top Givers</button>
              <button onClick={() => setActiveTab('posts')} style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: 'none', background: activeTab === 'posts' ? 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))' : 'transparent', color: activeTab === 'posts' ? '#FFF' : '#888', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeTab === 'posts' ? '0 4px 12px rgba(0,0,0,0.2)' : 'none' }}>Top Posts</button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#888', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: 24, height: 24, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
                <span style={{ fontSize: '14px', fontWeight: 500 }}>Loading rankings...</span>
              </div>
            ) : (
              <div>
                {activeTab === 'received' && data && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    {renderTop3(data.topReceived)}
                    {renderList(data.topReceived)}
                  </motion.div>
                )}
                {activeTab === 'given' && data && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    {renderTop3(data.topGiven)}
                    {renderList(data.topGiven)}
                  </motion.div>
                )}
                {activeTab === 'posts' && data && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {data.topPosts.length === 0 ? <div style={{ textAlign: 'center', color: '#888', padding: '40px 0' }}>No posts yet</div> : null}
                    {data.topPosts.map((post, i) => (
                      <div key={i} style={{ padding: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' }}>
                        {i === 0 && <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: 'var(--cat-fire)', boxShadow: '0 0 12px var(--cat-fire)' }} />}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: getAvatarColor(post.sender).base, display: 'flex', alignItems: 'center', justifyContent: 'center', color: getAvatarColor(post.sender).text, fontSize: '10px', fontWeight: 'bold' }}>{getInitials(post.sender)}</div>
                            <span style={{ fontSize: '14px', color: '#AAA' }}><span style={{ color: '#FFF', fontWeight: 600 }}>{post.sender === 'Anonymous' ? '🥷 Anonymous' : post.sender}</span> to <span style={{ color: '#FFF', fontWeight: 600 }}>{post.receiver}</span></span>
                          </div>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--cat-fire)', fontWeight: 'bold', background: 'rgba(255, 107, 74, 0.1)', padding: '4px 10px', borderRadius: 20, fontSize: '13px' }}><Heart size={14} fill="currentColor" /> {post.score}</span>
                        </div>
                        <p style={{ fontStyle: 'italic', color: '#EEE', fontSize: '15px', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>"{post.message}"</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
