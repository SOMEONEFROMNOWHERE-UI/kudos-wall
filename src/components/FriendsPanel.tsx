'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Users, Trash2 } from 'lucide-react';
import { useKudos } from '@/context/KudosContext';
import { getAvatarColor, getInitials } from '@/lib/utils';

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

function FriendAvatar({ name, isOnline }: { name: string; isOnline: boolean }) {
  const initials = getInitials(name);
  const colors = getAvatarColor(name);
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
          background: colors.base,
          border: '1.5px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.72rem',
          fontWeight: 700,
          color: colors.text,
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

function GroupAvatar({ name }: { name: string }) {
  const initials = getInitials(name);
  const colors = getAvatarColor(name);
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: colors.base,
        border: '1.5px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.72rem',
        fontWeight: 700,
        color: colors.text,
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

  const { live, currentUser } = useKudos();
  const presenceUsers = live?.presenceUsers || [];

  const [chatTarget, setChatTarget] = useState<{ id: string; name: string; isGroup: boolean } | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentGroup = chatTarget?.isGroup ? groups.find(g => g._id === chatTarget.id) : null;

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/groups');
      if (res.ok) setGroups(await res.json());
    } catch { /* ignore */ }
  };

  const [friendRequests, setFriendRequests] = useState<any[]>([]);

  const fetchFriendRequests = async () => {
    try {
      const res = await fetch('/api/friend-requests');
      if (res.ok) setFriendRequests(await res.json());
    } catch { /* ignore */ }
  };

  // Lock body scroll when panel is open & fetch updates
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      fetchFriends();
      fetchGroups();
      fetchFriendRequests();
    } else {
      document.body.style.overflow = '';
      setChatTarget(null);
      setTypedMessage('');
      setMessages([]);
      setSelectedFriends([]);
      setShowGroupSettings(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
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

  const addFriend = async () => {
    if (!addName.trim() || isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/friend-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: addName.trim() }),
      });
      if (res.ok) {
        setSuccess(`Request sent to ${addName.trim()}!`);
        setAddName('');
        setTimeout(() => setSuccess(''), 2000);
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to send request');
      }
    } catch {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequest = async (requestId: string, action: 'accepted' | 'declined') => {
    try {
      const res = await fetch('/api/friend-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      if (res.ok) {
        fetchFriendRequests();
        if (action === 'accepted') fetchFriends();
      }
    } catch { /* ignore */ }
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
        body: JSON.stringify({ name: groupName.trim(), memberIds: selectedFriends }),
      });
      if (res.ok) {
        setSuccess('Group created!');
        setGroupName('');
        setSelectedFriends([]);
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

  const fetchMessages = async () => {
    if (!chatTarget) return;
    try {
      const res = await fetch(`/api/messages?receiverId=${encodeURIComponent(chatTarget.id)}&isGroup=${chatTarget.isGroup}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch { /* ignore */ }
  };

  const sendMessage = async () => {
    if (!typedMessage.trim() || !chatTarget || isSending) return;
    setIsSending(true);
    const content = typedMessage.trim();
    setTypedMessage('');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: chatTarget.id,
          isGroup: chatTarget.isGroup,
          content
        }),
      });
      if (res.ok) {
        const newMsg = await res.json();
        setMessages(prev => {
          if (prev.some(m => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
      }
    } catch {
      setError('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const addGroupMember = async (friendName: string) => {
    if (!currentGroup) return;
    try {
      const res = await fetch('/api/groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: currentGroup._id,
          addMembers: [friendName]
        }),
      });
      if (res.ok) {
        fetchGroups();
      }
    } catch { /* ignore */ }
  };

  const removeGroupMember = async (friendName: string) => {
    if (!currentGroup) return;
    try {
      const res = await fetch('/api/groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: currentGroup._id,
          removeMembers: [friendName]
        }),
      });
      if (res.ok) {
        fetchGroups();
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!chatTarget) {
      setMessages([]);
      return;
    }
    fetchMessages();
  }, [chatTarget]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isOpen || !chatTarget || !currentUser?.name) return;

    const connectSSE = () => {
      const es = new EventSource(`/api/events?user=${encodeURIComponent(currentUser.name)}`);
      
      es.addEventListener('new_message', (e) => {
        try {
          const msg = JSON.parse(e.data);
          const isRelevant = chatTarget.isGroup 
            ? (msg.isGroup && msg.receiverId === chatTarget.id)
            : (!msg.isGroup && (
                (msg.senderId === currentUser.name && msg.receiverId === chatTarget.id) ||
                (msg.senderId === chatTarget.id && msg.receiverId === currentUser.name)
              ));
          
          if (isRelevant) {
            setMessages(prev => {
              if (prev.some(m => m._id === msg._id)) return prev;
              return [...prev, msg];
            });
          }
        } catch { /* ignore */ }
      });

      es.onerror = () => {
        es.close();
      };

      return es;
    };

    const es = connectSSE();
    return () => {
      es?.close();
    };
  }, [isOpen, chatTarget, currentUser?.name]);

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

            {chatTarget ? (
              /* ── Chat Screen UI ── */
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                {/* Chat Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 'var(--space-4)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(0,0,0,0.15)',
                    flexShrink: 0,
                  }}
                >
                  <button
                    onClick={() => { setChatTarget(null); setShowGroupSettings(false); }}
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    ← Back
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, overflow: 'hidden' }}>
                    {chatTarget.isGroup ? (
                      <GroupAvatar name={chatTarget.name} />
                    ) : (
                      <FriendAvatar name={chatTarget.name} isOnline={presenceUsers.some(u => u.toLowerCase() === chatTarget.name.toLowerCase())} />
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ fontSize: 'var(--text-body)', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {chatTarget.name}
                      </span>
                      {chatTarget.isGroup ? (
                        <button
                          onClick={() => setShowGroupSettings(v => !v)}
                          style={{
                            fontSize: '10px',
                            color: 'var(--accent)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          {currentGroup ? `${currentGroup.memberIds.length} members` : 'Manage'} • {showGroupSettings ? 'Hide Details' : 'View Details'}
                        </button>
                      ) : (
                        <span style={{ fontSize: '10px', color: presenceUsers.some(u => u.toLowerCase() === chatTarget.name.toLowerCase()) ? '#34d399' : 'var(--text-tertiary)' }}>
                          {presenceUsers.some(u => u.toLowerCase() === chatTarget.name.toLowerCase()) ? 'Online' : 'Offline'}
                        </span>
                      )}
                    </div>
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
                      cursor: 'pointer',
                    }}
                  >
                    <X size={16} />
                  </motion.button>
                </div>

                {/* Group Details Settings Pane */}
                {chatTarget.isGroup && showGroupSettings && currentGroup && (
                  <div
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      maxHeight: '40%',
                      overflowY: 'auto',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Group Members
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {currentGroup.memberIds.map(mem => (
                        <div key={mem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                          <span style={{ color: 'var(--text-primary)' }}>
                            {mem} {mem === currentGroup.createdBy && <span style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>(Creator)</span>}
                          </span>
                          {currentGroup.createdBy === currentUser?.name && mem !== currentUser?.name && (
                            <button
                              onClick={() => removeGroupMember(mem)}
                              style={{ color: 'var(--cat-fire)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '11px' }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {currentGroup.createdBy === currentUser?.name && (
                      <>
                        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Add Friends to Group
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {friends.filter(f => !currentGroup.memberIds.includes(f)).length === 0 ? (
                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>All friends are in the group.</span>
                          ) : (
                            friends.filter(f => !currentGroup.memberIds.includes(f)).map(friend => (
                              <div key={friend} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{friend}</span>
                                <button
                                  onClick={() => addGroupMember(friend)}
                                  style={{ color: 'var(--accent)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
                                >
                                  Add
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Messages Timeline */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 'var(--space-4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  {messages.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                      No messages yet. Say hello! 👋
                    </div>
                  ) : (
                    messages.map((msg, i) => {
                      const isMe = msg.senderId === currentUser?.name;
                      return (
                        <div
                          key={msg._id || i}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isMe ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                          }}
                        >
                          {!isMe && chatTarget.isGroup && (
                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: 2, paddingLeft: 4 }}>
                              {msg.senderId}
                            </span>
                          )}
                          <div
                            style={{
                              background: isMe
                                ? 'linear-gradient(135deg, rgba(232, 184, 75, 0.25) 0%, rgba(232, 184, 75, 0.15) 100%)'
                                : 'rgba(255, 255, 255, 0.05)',
                              border: isMe
                                ? '1px solid rgba(232, 184, 75, 0.3)'
                                : '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                              padding: '10px 14px',
                              color: 'var(--text-primary)',
                              fontSize: 'var(--text-body)',
                              lineHeight: 1.4,
                              wordBreak: 'break-word',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            }}
                          >
                            {msg.content}
                          </div>
                          <span style={{ fontSize: '9px', color: 'var(--text-tertiary)', marginTop: 2, padding: '0 4px' }}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input Footer */}
                <div
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(0,0,0,0.15)',
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <input
                    type="text"
                    value={typedMessage}
                    onChange={e => setTypedMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                    placeholder="Type a message…"
                    className="input-field"
                    style={{
                      flex: 1,
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 'var(--radius-md)',
                      minHeight: 40,
                    }}
                  />
                  <motion.button
                    onClick={sendMessage}
                    disabled={!typedMessage.trim() || isSending}
                    whileHover={typedMessage.trim() && !isSending ? { scale: 1.03 } : {}}
                    whileTap={typedMessage.trim() && !isSending ? { scale: 0.98 } : {}}
                    style={{
                      padding: '0 16px',
                      borderRadius: 'var(--radius-md)',
                      border: 'none',
                      background: typedMessage.trim() ? 'linear-gradient(135deg, var(--accent) 0%, #D4A33B 100%)' : 'rgba(255, 255, 255, 0.02)',
                      color: typedMessage.trim() ? 'var(--accent-text-on)' : 'var(--text-tertiary)',
                      fontWeight: 600,
                      cursor: typedMessage.trim() ? 'pointer' : 'not-allowed',
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    Send
                  </motion.button>
                </div>
              </div>
            ) : (
              /* ── Normal Lists UI ── */
              <>
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
                        {friends.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>SELECT MEMBERS:</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 60, overflowY: 'auto' }}>
                              {friends.map(friend => {
                                const selected = selectedFriends.includes(friend);
                                return (
                                  <button
                                    key={friend}
                                    type="button"
                                    onClick={() => {
                                      setSelectedFriends(prev =>
                                        prev.includes(friend) ? prev.filter(f => f !== friend) : [...prev, friend]
                                      );
                                    }}
                                    style={{
                                      fontSize: '10px',
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      border: selected ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)',
                                      background: selected ? 'var(--accent-muted)' : 'rgba(255,255,255,0.02)',
                                      color: selected ? 'var(--accent)' : 'var(--text-secondary)',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {friend}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
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
                      {/* PENDING REQUESTS SECTION */}
                      {friendRequests.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <div style={{
                            fontSize: '11px',
                            color: 'var(--accent)',
                            marginBottom: 'var(--space-2)',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                          }}>
                            Pending Requests ({friendRequests.length})
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {friendRequests.map(req => (
                              <div
                                key={req._id}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '10px 12px',
                                  borderRadius: 'var(--radius-md)',
                                  background: 'rgba(232, 184, 75, 0.05)',
                                  border: '1px solid rgba(232, 184, 75, 0.2)',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                  <FriendAvatar name={req.senderId} isOnline={false} />
                                  <span style={{ fontSize: 'var(--text-body)', color: 'var(--text-primary)', fontWeight: 600 }}>
                                    {req.senderId}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button
                                    onClick={() => handleRequest(req._id, 'accepted')}
                                    style={{
                                      padding: '4px 10px',
                                      borderRadius: 6,
                                      background: 'rgba(52, 211, 153, 0.15)',
                                      color: '#34d399',
                                      border: '1px solid rgba(52, 211, 153, 0.3)',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleRequest(req._id, 'declined')}
                                    style={{
                                      padding: '4px 10px',
                                      borderRadius: 6,
                                      background: 'rgba(255, 107, 74, 0.15)',
                                      color: 'var(--cat-fire)',
                                      border: '1px solid rgba(255, 107, 74, 0.3)',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Decline
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* YOUR FRIENDS SECTION */}
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
                                  onClick={() => setChatTarget({ id: name, name, isGroup: false })}
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
                                    cursor: 'pointer',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                    <FriendAvatar name={name} isOnline={isOnline} />
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
                                    onClick={(e) => { e.stopPropagation(); removeFriend(name); }}
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
                                onClick={() => setChatTarget({ id: group._id, name: group.name, isGroup: true })}
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
                                  cursor: 'pointer',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                  <GroupAvatar name={group.name} />
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
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
