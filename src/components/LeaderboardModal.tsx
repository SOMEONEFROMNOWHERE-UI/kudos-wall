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
    if (users.length === 0) return <div style={{ textAlign: 'center', color: '#888' }}>No data yet</div>;

    // Ordered for podium: 2nd, 1st, 3rd
    const podium = [
      users[1] && { ...users[1], rank: 2, color: '#C0C0C0', height: 100 },
      users[0] && { ...users[0], rank: 1, color: '#FFD700', height: 140 },
      users[2] && { ...users[2], rank: 3, color: '#CD7F32', height: 80 }
    ].filter(Boolean) as any[];

    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 16, height: 200, marginBottom: 32 }}>
        {podium.map((u, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              {u.rank === 1 && <Trophy size={20} color={u.color} style={{ position: 'absolute', top: -24, left: '50%', transform: 'translateX(-50%)' }} />}
              <div style={{
                width: 48, height: 48, borderRadius: '50%', background: getAvatarColor(u.name).base,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: getAvatarColor(u.name).text,
                fontWeight: 'bold', fontSize: '18px', border: `2px solid ${u.color}`
              }}>
                {getInitials(u.name)}
              </div>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFF' }}>{u.name}</div>
            <div style={{ fontSize: '12px', color: '#AAA' }}>{u.score}</div>
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: u.height }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{ width: 60, background: `linear-gradient(to top, rgba(255,255,255,0.05), ${u.color}40)`, borderTopLeftRadius: 8, borderTopRightRadius: 8, marginTop: 8 }}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderList = (users: LeaderboardUser[]) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {users.slice(3).map((u, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#666', width: 20 }}>{idx + 4}</span>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: getAvatarColor(u.name).base, display: 'flex', alignItems: 'center', justifyContent: 'center', color: getAvatarColor(u.name).text, fontWeight: 'bold', fontSize: '12px' }}>
                {getInitials(u.name)}
              </div>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#EEE' }}>{u.name}</span>
            </div>
            <div style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{u.score}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            style={{
              position: 'relative', width: '100%', maxWidth: 500, background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 24, padding: 32, maxHeight: '80vh', overflowY: 'auto'
            }}
          >
            <button onClick={onClose} style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', cursor: 'pointer' }}>
              <X size={16} />
            </button>

            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Medal color="var(--accent)" /> Leaderboard
            </h2>

            <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 12 }}>
              <button onClick={() => setActiveTab('received')} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: activeTab === 'received' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === 'received' ? '#FFF' : '#888', fontWeight: 600, cursor: 'pointer' }}>Most Loved</button>
              <button onClick={() => setActiveTab('given')} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: activeTab === 'given' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === 'given' ? '#FFF' : '#888', fontWeight: 600, cursor: 'pointer' }}>Top Givers</button>
              <button onClick={() => setActiveTab('posts')} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: activeTab === 'posts' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === 'posts' ? '#FFF' : '#888', fontWeight: 600, cursor: 'pointer' }}>Top Posts</button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>Loading rankings...</div>
            ) : (
              <div>
                {activeTab === 'received' && data && (
                  <>
                    {renderTop3(data.topReceived)}
                    {renderList(data.topReceived)}
                  </>
                )}
                {activeTab === 'given' && data && (
                  <>
                    {renderTop3(data.topGiven)}
                    {renderList(data.topGiven)}
                  </>
                )}
                {activeTab === 'posts' && data && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {data.topPosts.length === 0 ? <div style={{ textAlign: 'center', color: '#888' }}>No posts yet</div> : null}
                    {data.topPosts.map((post, i) => (
                      <div key={i} style={{ padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: '13px', color: '#888' }}>From <strong>{post.sender}</strong> to <strong>{post.receiver}</strong></span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)', fontWeight: 'bold' }}><Star size={14} fill="currentColor" /> {post.score}</span>
                        </div>
                        <p style={{ fontStyle: 'italic', color: '#CCC', fontSize: '15px' }}>"{post.message}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
