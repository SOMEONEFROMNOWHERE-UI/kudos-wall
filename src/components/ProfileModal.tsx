'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit2, Check, User as UserIcon, Heart, Award, Zap, Camera } from 'lucide-react';
import { useKudos } from '@/context/KudosContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
}

interface UserProfile {
  name: string;
  streak: number;
  bio: string;
  title: string;
  stats: {
    kudosReceived: number;
    kudosGiven: number;
    likesReceived: number;
  };
}

export default function ProfileModal({ isOpen, onClose, username }: ProfileModalProps) {
  const { currentUser } = useKudos();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBio, setEditBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      fetchProfile();
    } else {
      document.body.style.overflow = '';
      setIsEditing(false);
      setError('');
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, username]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const query = username ? `?username=${encodeURIComponent(username)}` : '';
      const res = await fetch(`/api/users/profile${query}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setEditTitle(data.title || '');
        setEditBio(data.bio || '');
      } else {
        setError('Failed to load profile');
      }
    } catch {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, bio: editBio }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(prev => prev ? { ...prev, title: data.title, bio: data.bio } : null);
        setIsEditing(false);
      } else {
        setError('Failed to save changes');
      }
    } catch {
      setError('Network error');
    } finally {
      setIsSaving(false);
    }
  };

  function getInitials(name: string) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
          <style>{`
            @keyframes spin-gradient {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes glow-pulse {
              0% { opacity: 0.4; transform: translate(-50%, -50%) scale(1.0); }
              100% { opacity: 0.85; transform: translate(-50%, -50%) scale(1.12); }
            }
            @keyframes modal-glow {
              0%, 100% { 
                box-shadow: 0 24px 64px rgba(0,0,0,0.85),
                            0 0 35px rgba(139, 92, 246, 0.08); 
              }
              50% { 
                box-shadow: 0 24px 64px rgba(0,0,0,0.95),
                            0 0 50px rgba(232, 184, 75, 0.15); 
              }
            }
          `}</style>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 480,
              borderRadius: '24px',
              padding: '1.5px', // Border thickness
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'stretch',
              animation: 'modal-glow 6s ease-in-out infinite',
            }}
          >
            {/* Rotating Conic Gradient for Card Border */}
            <div style={{
              position: 'absolute',
              inset: '-150%',
              background: 'conic-gradient(from 0deg, #D4A032, #8b5cf6, #FF6B4A, #D4A032)',
              animation: 'spin-gradient 8s linear infinite',
              zIndex: 0,
            }} />

            {/* Inner Content Container */}
            <div
              style={{
                position: 'relative',
                flex: 1,
                background: 'rgba(20, 20, 20, 0.98)',
                borderRadius: '22.5px',
                overflow: 'hidden',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
            {/* Header Background Gradient */}
            <div style={{
              height: 140,
              background: 'linear-gradient(135deg, rgba(232, 184, 75, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
              position: 'relative',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            }}>
              <button
                onClick={onClose}
                className="nav-btn-glassy"
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.3)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  zIndex: 10,
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '0 32px 32px 32px', position: 'relative' }}>
              {/* Avatar */}
              <div style={{
                marginTop: -48,
                marginBottom: 16,
                position: 'relative',
                display: 'inline-flex',
              }}>
                {/* Glow container that pulses */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 102,
                  height: 102,
                  zIndex: 0,
                  animation: 'glow-pulse 3s ease-in-out infinite alternate',
                  pointerEvents: 'none',
                }}>
                  {/* Rotating glow child */}
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'conic-gradient(from 0deg, #D4A032, #8b5cf6, #FF6B4A, #D4A032)',
                    filter: 'blur(14px)',
                    animation: 'spin-gradient 6s linear infinite',
                  }} />
                </div>

                {/* Rotating Border Wrapper */}
                <div style={{
                  position: 'relative',
                  width: 102,
                  height: 102,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(20, 20, 20, 1)',
                  zIndex: 1,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                }}>
                  {/* Rotating Conic Gradient Element */}
                  <div style={{
                    position: 'absolute',
                    width: '150%',
                    height: '150%',
                    background: 'conic-gradient(from 0deg, #D4A032, #8b5cf6, #FF6B4A, #D4A032)',
                    animation: 'spin-gradient 4s linear infinite',
                  }} />
                  
                  {/* Inner Mask / Container for Avatar */}
                  <div style={{
                    position: 'absolute',
                    inset: 3,
                    borderRadius: '50%',
                    background: 'rgba(20, 20, 20, 1)',
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    {(!username || username === currentUser?.name) && currentUser?.image ? (
                      <img
                        src={currentUser.image}
                        alt={currentUser.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        background: 'var(--accent-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: 'var(--accent)',
                      }}>
                        {getInitials(profile?.name || username || 'U')}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Streak Badge */}
                {profile && profile.streak > 0 && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    right: -4,
                    zIndex: 10,
                    background: 'linear-gradient(135deg, #FF6B4A 0%, #FF3300 100%)',
                    border: '3px solid rgba(20, 20, 20, 1)',
                    borderRadius: 999,
                    padding: '4px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 800,
                    boxShadow: '0 4px 12px rgba(255, 107, 74, 0.4)',
                  }}>
                    <Zap size={10} fill="currentColor" /> {profile.streak}
                  </div>
                )}
              </div>

              {isLoading ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  Loading profile...
                </div>
              ) : profile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  
                  {/* Name and Title and Edit button */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                          {profile.name}
                        </h2>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Add a title (e.g. Product Designer)"
                            maxLength={50}
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: 8,
                              padding: '6px 12px',
                              color: 'var(--text-secondary)',
                              fontSize: '14px',
                              width: '100%',
                              outline: 'none',
                              marginTop: 4,
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {profile.title || 'Team Member'}
                          </span>
                        )}
                      </div>

                      {!isEditing && (!username || username === currentUser?.name) && (
                        <button
                          onClick={() => setIsEditing(true)}
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            padding: '6px 12px',
                            color: 'var(--text-secondary)',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Bio</label>
                        <textarea
                          value={editBio}
                          onChange={(e) => setEditBio(e.target.value)}
                          placeholder="Write a short bio..."
                          maxLength={160}
                          rows={3}
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            padding: '10px 12px',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            width: '100%',
                            outline: 'none',
                            resize: 'none',
                            fontFamily: 'inherit',
                          }}
                        />
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'right' }}>
                          {editBio.length}/160
                        </div>
                      </div>
                    ) : (
                      <p style={{ 
                        fontSize: '14px', 
                        color: profile.bio ? 'var(--text-primary)' : 'var(--text-tertiary)', 
                        lineHeight: 1.5, 
                        margin: 0,
                        fontStyle: profile.bio ? 'normal' : 'italic'
                      }}>
                        {profile.bio || "No bio added yet."}
                      </p>
                    )}
                  </div>

                  {/* Actions for Editing */}
                  {isEditing && (
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
                      <button
                        onClick={() => { setIsEditing(false); setEditTitle(profile.title || ''); setEditBio(profile.bio || ''); }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: '8px 16px',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{
                          background: 'linear-gradient(135deg, var(--accent) 0%, #D4A33B 100%)',
                          border: 'none',
                          borderRadius: 8,
                          color: 'var(--accent-text-on)',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: isSaving ? 'not-allowed' : 'pointer',
                          padding: '8px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          opacity: isSaving ? 0.7 : 1,
                        }}
                      >
                        {isSaving ? 'Saving...' : <><Check size={14} /> Save</>}
                      </button>
                    </div>
                  )}

                  {error && <div style={{ color: 'var(--cat-fire)', fontSize: '13px', textAlign: 'center' }}>{error}</div>}

                  {/* Stats Grid */}
                  {!isEditing && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 12,
                      marginTop: 8,
                    }}>
                      <motion.div
                        whileHover={{ scale: 1.05, y: -4, borderColor: 'rgba(232, 184, 75, 0.4)', boxShadow: '0 8px 24px rgba(232,184,75,0.15)' }}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          borderRadius: 16,
                          padding: 16,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 8,
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                        }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(232, 184, 75, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                          <Award size={16} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{profile.stats.kudosReceived}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Received</span>
                        </div>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.05, y: -4, borderColor: 'rgba(52, 211, 153, 0.4)', boxShadow: '0 8px 24px rgba(52,211,153,0.15)' }}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          borderRadius: 16,
                          padding: 16,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 8,
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                        }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(52, 211, 153, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                          <UserIcon size={16} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{profile.stats.kudosGiven}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Given</span>
                        </div>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.05, y: -4, borderColor: 'rgba(255, 107, 74, 0.4)', boxShadow: '0 8px 24px rgba(255,107,74,0.15)' }}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          borderRadius: 16,
                          padding: 16,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 8,
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                        }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255, 107, 74, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cat-fire)' }}>
                          <Heart size={16} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{profile.stats.likesReceived}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Likes</span>
                        </div>
                      </motion.div>
                    </div>
                  )}

                </div>
              ) : null}
            </div>
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
