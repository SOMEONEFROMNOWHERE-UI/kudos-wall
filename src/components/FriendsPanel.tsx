'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Users } from 'lucide-react';

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

export default function FriendsPanel({ isOpen, onClose }: FriendsPanelProps) {
  const [tab, setTab] = useState<'friends' | 'groups'>('friends');
  const [friends, setFriends] = useState<string[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [addName, setAddName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              zIndex: 'var(--z-modal-backdrop)' as unknown as number,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
            }}
          />
          <motion.div
            key="panel"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: Math.min(380, window.innerWidth - 32),
              zIndex: 'var(--z-modal)' as unknown as number,
              background: 'var(--surface-overlay)',
              borderLeft: '1px solid var(--surface-border)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--space-4)',
                borderBottom: '1px solid var(--surface-border)',
                position: 'sticky',
                top: 0,
                background: 'var(--surface-overlay)',
                zIndex: 1,
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: 'var(--text-title)',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
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
              <button
                onClick={onClose}
                className="btn-icon"
                aria-label="Close panel"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tab switcher */}
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-1)',
                padding: 'var(--space-3) var(--space-4)',
                borderBottom: '1px solid var(--surface-border)',
              }}
            >
              {(['friends', 'groups'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: tab === t ? 'var(--surface-raised)' : 'transparent',
                    color: tab === t ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    fontSize: 'var(--text-label)',
                    fontWeight: tab === t ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 160ms',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    minHeight: 44,
                  }}
                >
                  {t === 'friends' ? <UserPlus size={14} /> : <Users size={14} />}
                  {t === 'friends' ? 'Friends' : 'Groups'}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* Feedback messages */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--positive-muted)', border: '1px solid rgba(111,207,151,0.2)', fontSize: 'var(--text-label)', color: 'var(--positive)' }}
                  >
                    {success}
                  </motion.div>
                )}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'rgba(255,107,74,0.08)', border: '1px solid rgba(255,107,74,0.2)', fontSize: 'var(--text-label)', color: 'var(--cat-fire)' }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {tab === 'friends' ? (
                <>
                  {/* Add friend input */}
                  <div>
                    <label
                      htmlFor="add-friend-input"
                      style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-label)', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}
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
                        style={{ flex: 1 }}
                      />
                      <button
                        onClick={addFriend}
                        disabled={!addName.trim() || isLoading}
                        className="btn-primary"
                        style={{ flexShrink: 0, padding: '0 var(--space-3)' }}
                        aria-label="Add friend"
                      >
                        <UserPlus size={15} />
                      </button>
                    </div>
                    <p style={{ marginTop: 'var(--space-1)', fontSize: 'var(--text-label)', color: 'var(--text-tertiary)' }}>
                      Only people in your workspace
                    </p>
                  </div>

                  {/* Friends list */}
                  <div>
                    <div style={{ fontSize: 'var(--text-label)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {friends.length > 0 ? `${friends.length} friend${friends.length !== 1 ? 's' : ''}` : 'No friends yet'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <AnimatePresence>
                        {friends.map((name, i) => (
                          <motion.div
                            key={name}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -12 }}
                            transition={{ delay: i * 0.04 }}
                            className="friend-chip"
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                              <div
                                style={{
                                  width: 28, height: 28, borderRadius: '50%',
                                  background: `${AVATAR_COLORS[i % AVATAR_COLORS.length]}18`,
                                  border: `1.5px solid ${AVATAR_COLORS[i % AVATAR_COLORS.length]}44`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '0.6rem', fontWeight: 700,
                                  color: AVATAR_COLORS[i % AVATAR_COLORS.length],
                                  flexShrink: 0,
                                }}
                              >
                                {getInitials(name)}
                              </div>
                              <span style={{ fontSize: 'var(--text-label)', color: 'var(--text-primary)', fontWeight: 500 }}>
                                {name}
                              </span>
                            </div>
                            <button
                              onClick={() => removeFriend(name)}
                              className="btn-icon"
                              aria-label={`Remove ${name} from friends`}
                              style={{ width: 24, height: 24, border: 'none', color: 'var(--text-tertiary)' }}
                              title="Remove friend"
                            >
                              <X size={12} />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Create group */}
                  <div>
                    <label
                      htmlFor="create-group-input"
                      style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-label)', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}
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
                        style={{ flex: 1 }}
                        maxLength={50}
                      />
                      <button
                        onClick={createGroup}
                        disabled={!groupName.trim() || isLoading}
                        className="btn-primary"
                        style={{ flexShrink: 0, padding: '0 var(--space-3)' }}
                        aria-label="Create group"
                      >
                        <Users size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Groups list */}
                  <div>
                    <div style={{ fontSize: 'var(--text-label)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {groups.length > 0 ? `${groups.length} group${groups.length !== 1 ? 's' : ''}` : 'No groups yet'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <AnimatePresence>
                        {groups.map((group, i) => (
                          <motion.div
                            key={group._id}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            style={{
                              padding: 'var(--space-3)',
                              background: 'var(--surface-raised)',
                              border: '1px solid var(--surface-border)',
                              borderRadius: 'var(--radius-md)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                              <Users size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                              <div>
                                <div style={{ fontSize: 'var(--text-label)', fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {group.name}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 1 }}>
                                  {group.memberIds.length} member{group.memberIds.length !== 1 ? 's' : ''}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
