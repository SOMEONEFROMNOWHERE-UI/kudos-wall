'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Users, Trash2 } from 'lucide-react';
import { useKudos } from '@/context/KudosContext';

interface FriendsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Group {
  _id: string;
  name: string;
  memberIds: string[];
  createdBy: string;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ['#E8B84B', '#6FCF97', '#56B4E8', '#A78BFA', '#FF6B4A'];

function FriendAvatar({ name, isOnline, index }: { name: string; isOnline: boolean; index: number }) {
  const initials = getInitials(name);
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
      {isOnline && (
        <motion.div
          animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0.3, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: -2,
            borderRadius: '50%',
            border: '2px solid #34d399',
            zIndex: 0,
            transform: 'translateZ(0)',
          }}
        />
      )}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: isOnline ? 'rgba(52, 211, 153, 0.08)' : `${color}14`,
          border: `1.5px solid ${isOnline ? '#34d399' : `${color}33`}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.72rem',
          fontWeight: 700,
          color: isOnline ? '#34d399' : color,
          boxShadow: isOnline ? '0 0 10px rgba(52, 211, 153, 0.2)' : 'none',
        }}
      >
        {initials}
      </div>
      {isOnline && (
        <span
          style={{
            position: 'absolute',
            bottom: -1,
            right: -1,
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: '#34d399',
            border: '1.5px solid #14141c',
            boxShadow: '0 0 4px #34d399',
            zIndex: 2,
          }}
        />
      )}
    </div>
  );
}

function GroupAvatar({ name, index }: { name: string; index: number }) {
  const initials = getInitials(name);
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${color}1e, ${color}08)`,
        border: `1.5px solid ${color}33`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.72rem',
        fontWeight: 700,
        color: color,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function EmptyState({ type }: { type: 'friends' | 'groups' }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      whileHover={{
        borderColor: 'rgba(232, 184, 75, 0.25)',
        background: 'rgba(232, 184, 75, 0.015)',
        y: -2,
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6) var(--space-4)',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed rgba(255, 255, 255, 0.08)',
        background: 'rgba(255, 255, 255, 0.01)',
        textAlign: 'center',
        marginTop: 'var(--space-2)',
        cursor: 'default',
        transition: 'border-color 200ms ease, background 200ms ease',
        transform: 'translateZ(0)',
      }}
    >
      <div style={{ position: 'relative', marginBottom: 'var(--space-3)' }}>
        <div
          style={{
            position: 'absolute',
            inset: -12,
            borderRadius: '50%',
            background: 'rgba(232, 184, 75, 0.04)',
            filter: 'blur(10px)',
            animation: 'breathe 3s ease-in-out infinite',
          }}
        />
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {type === 'friends' ? (
            <UserPlus size={20} style={{ color: 'var(--accent)' }} />
          ) : (
            <Users size={20} style={{ color: 'var(--accent)' }} />
          )}
        </div>
      </div>
      <h3 style={{ fontSize: 'var(--text-body)', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
        {type === 'friends' ? 'No friends yet' : 'No groups yet'}
      </h3>
      <p style={{ fontSize: 'var(--text-label)', color: 'var(--text-secondary)', marginTop: 6, maxWidth: 240, lineHeight: 1.4 }}>
        {type === 'friends'
          ? 'Add your teammates to quickly keep track of your core circle!'
          : 'Create a group to organise team members and send bulk kudos.'}
      </p>
    </motion.div>
  );
}

export default function FriendsPanel({ isOpen, onClose }: FriendsPanelProps) {
  const [tab, setTab] = useState<'friends' | 'groups'>('friends');
  const [friends, setFriends] = useState<string[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [addName, setAddName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isFriendInputFocused, setIsFriendInputFocused] = useState(false);
  const [isGroupInputFocused, setIsGroupInputFocused] = useState(false);

  const { live } = useKudos();
  const presenceUsers = live?.presenceUsers || [];

  // Lock body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    fetchFriends();
    fetchGroups();
  }, [isOpen]);

  const fetchFriends = async () => {
    try {
      const res = await fetch('/api/friends');
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
      }
    } catch { /* ignore */ }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/groups');
      if (res.ok) setGroups(await res.json());
    } catch { /* ignore */ }
  };

  const addFriend = async () => {
    if (!addName.trim() || isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendName: addName.trim() }),
      });
      if (res.ok) {
        setSuccess(`${addName.trim()} added!`);
        setAddName('');
        fetchFriends();
        setTimeout(() => setSuccess(''), 2000);
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to add');
      }
    } catch {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFriend = async (friendName: string) => {
    try {
      await fetch(`/api/friends?friendId=${encodeURIComponent(friendName)}`, { method: 'DELETE' });
      setFriends(prev => prev.filter(f => f !== friendName));
    } catch { /* ignore */ }
  };

  const createGroup = async () => {
    if (!groupName.trim() || isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName.trim(), memberIds: [] }),
      });
      if (res.ok) {
        setSuccess('Group created!');
        setGroupName('');
        fetchGroups();
        setTimeout(() => setSuccess(''), 2000);
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to create');
      }
    } catch {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  // Sort friends: online users rise to the top, then sorted alphabetically
  const sortedFriends = [...friends].sort((a, b) => {
    const aOnline = presenceUsers.some(u => u.toLowerCase() === a.toLowerCase());
    const bOnline = presenceUsers.some(u => u.toLowerCase() === b.toLowerCase());
    if (aOnline && !bOnline) return -1;
    if (!aOnline && bOnline) return 1;
    return a.localeCompare(b);
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 'var(--z-modal-backdrop)' as unknown as number,
              background: 'rgba(8, 8, 12, 0.65)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* Sliding Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: Math.min(400, window.innerWidth - 32),
              zIndex: 'var(--z-modal)' as unknown as number,
              background: 'var(--surface-overlay)', // Solid high-performance overlay surface
              boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.45)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Crisp edge border */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 1.5,
                background: 'linear-gradient(to bottom, #6750a2, #03b3c3, #e8b84b, #c247ac, #6750a2)',
                backgroundSize: '100% 300%',
                animation: 'border-cycle 8s ease infinite',
                zIndex: 10,
                pointerEvents: 'none',
                opacity: 0.8,
                transform: 'translateZ(0)',
                willChange: 'background-position',
              }}
            />

            {/* Pinned Top Container: Header, Tab Switcher, Action Inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-4) var(--space-4) var(--space-3) var(--space-4)',
                  position: 'relative',
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: 'var(--text-title)',
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #EDEDF0 0%, #A0A0B0 100%)',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                      WebkitTextFillColor: 'transparent',
                      margin: 0,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Friends & Groups
                  </h2>
                  <p style={{ fontSize: 'var(--text-label)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                    Your workspace circle
                  </p>
                </div>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-primary)' }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'border-color 200ms, color 200ms',
                    cursor: 'pointer',
                    zIndex: 2,
                  }}
                  aria-label="Close panel"
                >
                  <X size={16} />
                </motion.button>
                {/* Fade out bottom divider */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 'var(--space-4)',
                    right: 'var(--space-4)',
                    height: 1,
                    background: 'linear-gradient(to right, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.06) 50%, rgba(255, 255, 255, 0.02) 100%)',
                  }}
                />
              </div>

              {/* Tab switcher */}
              <div
                style={{
                  display: 'flex',
                  background: 'rgba(0, 0, 0, 0.25)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 4,
                  margin: 'var(--space-3) var(--space-4) 0 var(--space-4)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                {(['friends', 'groups'] as const).map(t => (
                  <div key={t} style={{ position: 'relative', flex: 1, display: 'flex' }}>
                    {tab === t && (
                      <motion.div
                        layoutId="active-panel-tab"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(135deg, rgba(232, 184, 75, 0.14) 0%, rgba(232, 184, 75, 0.06) 100%)',
                          border: '1px solid rgba(232, 184, 75, 0.2)',
                          borderRadius: 'var(--radius-md)',
                          zIndex: 0,
                        }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <button
                      onClick={() => setTab(t)}
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        flex: 1,
                        padding: '8px',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        background: 'transparent',
                        color: tab === t ? 'var(--accent)' : 'rgba(255, 255, 255, 0.45)',
                        fontSize: 'var(--text-label)',
                        fontWeight: tab === t ? 600 : 500,
                        cursor: 'pointer',
                        transition: 'color 160ms',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        minHeight: 40,
                      }}
                    >
                      {t === 'friends' ? <UserPlus size={14} /> : <Users size={14} />}
                      {t === 'friends' ? 'Friends' : 'Groups'}
                    </button>
                  </div>
                ))}
              </div>

              {/* Action input form container */}
              <div
                style={{
                  padding: 'var(--space-4) var(--space-4) var(--space-3) var(--space-4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                }}
              >
                {/* Feedback messages */}
                <AnimatePresence mode="wait">
                  {success && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--positive-muted)',
                        border: '1px solid rgba(111,207,151,0.2)',
                        fontSize: 'var(--text-label)',
                        color: 'var(--positive)',
                        fontWeight: 500,
                      }}
                    >
                      {success}
                    </motion.div>
                  )}
                  {error && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255,107,74,0.08)',
                        border: '1px solid rgba(255,107,74,0.2)',
                        fontSize: 'var(--text-label)',
                        color: 'var(--cat-fire)',
                        fontWeight: 500,
                      }}
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {tab === 'friends' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <label
                      htmlFor="add-friend-input"
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      Add a teammate
                    </label>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <input
                        id="add-friend-input"
                        type="text"
                        value={addName}
                        onChange={e => { setAddName(e.target.value); setError(''); }}
                        onKeyDown={e => { if (e.key === 'Enter') addFriend(); }}
                        placeholder="Their display name…"
                        className="input-field"
                        style={{
                          flex: 1,
                          background: 'rgba(0, 0, 0, 0.25)',
                          border: isFriendInputFocused 
                            ? '1px solid var(--accent)' 
                            : '1px solid rgba(255, 255, 255, 0.08)',
                          boxShadow: isFriendInputFocused 
                            ? '0 0 12px rgba(232, 184, 75, 0.15)' 
                            : 'none',
                          transition: 'all 200ms ease',
                        }}
                        onFocus={() => setIsFriendInputFocused(true)}
                        onBlur={() => setIsFriendInputFocused(false)}
                      />
                      <motion.button
                        onClick={addFriend}
                        disabled={!addName.trim() || isLoading}
                        whileHover={addName.trim() && !isLoading ? { scale: 1.03, filter: 'brightness(1.08)' } : {}}
                        whileTap={addName.trim() && !isLoading ? { scale: 0.98 } : {}}
                        style={{
                          flexShrink: 0,
                          padding: '0 var(--space-4)',
                          borderRadius: 'var(--radius-md)',
                          border: 'none',
                          background: addName.trim() ? 'linear-gradient(135deg, var(--accent) 0%, #D4A33B 100%)' : 'rgba(255, 255, 255, 0.02)',
                          color: addName.trim() ? 'var(--accent-text-on)' : 'var(--text-tertiary)',
                          fontWeight: 600,
                          cursor: addName.trim() ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          transition: 'background 200ms, color 200ms, box-shadow 200ms',
                          minHeight: 44,
                          boxShadow: addName.trim() ? '0 4px 12px rgba(232, 184, 75, 0.15)' : 'none',
                        }}
                        aria-label="Add friend"
                      >
                        <UserPlus size={15} />
                      </motion.button>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                      Only people in your workspace
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <label
                      htmlFor="create-group-input"
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      Create a group
                    </label>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <input
                        id="create-group-input"
                        type="text"
                        value={groupName}
                        onChange={e => { setGroupName(e.target.value); setError(''); }}
                        onKeyDown={e => { if (e.key === 'Enter') createGroup(); }}
                        placeholder="Group name…"
                        className="input-field"
                        style={{
                          flex: 1,
                          background: 'rgba(0, 0, 0, 0.25)',
                          border: isGroupInputFocused 
                            ? '1px solid var(--accent)' 
                            : '1px solid rgba(255, 255, 255, 0.08)',
                          boxShadow: isGroupInputFocused 
                            ? '0 0 12px rgba(232, 184, 75, 0.15)' 
                            : 'none',
                          transition: 'all 200ms ease',
                        }}
                        onFocus={() => setIsGroupInputFocused(true)}
                        onBlur={() => setIsGroupInputFocused(false)}
                        maxLength={50}
                      />
                      <motion.button
                        onClick={createGroup}
                        disabled={!groupName.trim() || isLoading}
                        whileHover={groupName.trim() && !isLoading ? { scale: 1.03, filter: 'brightness(1.08)' } : {}}
                        whileTap={groupName.trim() && !isLoading ? { scale: 0.98 } : {}}
                        style={{
                          flexShrink: 0,
                          padding: '0 var(--space-4)',
                          borderRadius: 'var(--radius-md)',
                          border: 'none',
                          background: groupName.trim() ? 'linear-gradient(135deg, var(--accent) 0%, #D4A33B 100%)' : 'rgba(255, 255, 255, 0.02)',
                          color: groupName.trim() ? 'var(--accent-text-on)' : 'var(--text-tertiary)',
                          fontWeight: 600,
                          cursor: groupName.trim() ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          transition: 'background 200ms, color 200ms, box-shadow 200ms',
                          minHeight: 44,
                          boxShadow: groupName.trim() ? '0 4px 12px rgba(232, 184, 75, 0.15)' : 'none',
                        }}
                        aria-label="Create group"
                      >
                        <Users size={15} />
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>

              {/* Separator between action input form and list */}
              <div
                style={{
                  height: 1,
                  background: 'linear-gradient(to right, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.06) 50%, rgba(255, 255, 255, 0.02) 100%)',
                  margin: '0 var(--space-4) 0 var(--space-4)',
                }}
              />
            </div>

            {/* Scrollable Content Container */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                willChange: 'scroll-position',
                padding: 'var(--space-3) var(--space-4) var(--space-4) var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
              }}
            >
              {tab === 'friends' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--space-1)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <span>{friends.length > 0 ? `${friends.length} friend${friends.length !== 1 ? 's' : ''}` : 'No friends'}</span>
                    {friends.length > 0 && (
                      <span style={{
                        fontSize: '10px',
                        color: '#34d399',
                        fontWeight: 600,
                        background: 'rgba(52, 211, 153, 0.08)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid rgba(52, 211, 153, 0.15)',
                      }}>
                        {friends.filter(f => presenceUsers.some(u => u.toLowerCase() === f.toLowerCase())).length} Online
                      </span>
                    )}
                  </div>
                  {friends.length === 0 ? (
                    <EmptyState type="friends" />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <AnimatePresence initial={false}>
                        {sortedFriends.map((name, i) => {
                          const isOnline = presenceUsers.some(u => u.toLowerCase() === name.toLowerCase());
                          return (
                            <motion.div
                              key={name}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={{ duration: 0.2 }}
                              whileHover={{
                                x: 2,
                                background: 'rgba(255, 255, 255, 0.04)',
                                borderColor: 'rgba(232, 184, 75, 0.2)',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                              }}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 12px',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(255, 255, 255, 0.015)',
                                border: '1px solid rgba(255, 255, 255, 0.04)',
                                transition: 'background 200ms, border-color 200ms, box-shadow 200ms',
                                transform: 'translateZ(0)',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                <FriendAvatar name={name} isOnline={isOnline} index={i} />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontSize: 'var(--text-body)', color: 'var(--text-primary)', fontWeight: 600 }}>
                                    {name}
                                  </span>
                                  <span style={{ fontSize: '11px', color: isOnline ? '#34d399' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 1, fontWeight: 550 }}>
                                    <span style={{ color: isOnline ? '#34d399' : 'rgba(255,255,255,0.2)' }}>●</span>
                                    {isOnline ? 'Online' : 'Offline'}
                                  </span>
                                </div>
                              </div>
                              <motion.button
                                onClick={() => removeFriend(name)}
                                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 107, 74, 0.08)', color: 'var(--cat-fire)' }}
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: 'transparent',
                                  color: 'var(--text-tertiary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'color 200ms',
                                  cursor: 'pointer',
                                }}
                                title="Remove friend"
                              >
                                <Trash2 size={13} />
                              </motion.button>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--space-1)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}>
                    {groups.length > 0 ? `${groups.length} group${groups.length !== 1 ? 's' : ''}` : 'No groups'}
                  </div>
                  {groups.length === 0 ? (
                    <EmptyState type="groups" />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <AnimatePresence initial={false}>
                        {groups.map((group, i) => (
                          <motion.div
                            key={group._id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            whileHover={{
                              x: 2,
                              background: 'rgba(255, 255, 255, 0.04)',
                              borderColor: 'rgba(232, 184, 75, 0.2)',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            }}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '12px 14px',
                              borderRadius: 'var(--radius-md)',
                              background: 'rgba(255, 255, 255, 0.015)',
                              border: '1px solid rgba(255, 255, 255, 0.04)',
                              transition: 'background 200ms, border-color 200ms, box-shadow 200ms',
                              transform: 'translateZ(0)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                              <GroupAvatar name={group.name} index={i} />
                              <div>
                                <div style={{ fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {group.name}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Users size={10} />
                                  {group.memberIds.length} member{group.memberIds.length !== 1 ? 's' : ''}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
