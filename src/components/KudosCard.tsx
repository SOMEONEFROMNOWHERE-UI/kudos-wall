'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKudos } from '@/context/KudosContext';
import type { KudosData } from '@/types';
import { CATEGORIES } from '@/types';

interface KudosCardProps {
  kudos: KudosData;
  index: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  '🔥': 'var(--cat-fire)',
  '💎': 'var(--cat-gem)',
  '🚀': 'var(--cat-rocket)',
  '🧠': 'var(--cat-brain)',
  '🫂': 'var(--cat-heart)',
};

function timeAgo(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function Avatar({ name, color, size = 28 }: { name: string; color?: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color ? `${color}22` : 'var(--surface-border)',
        border: `1px solid ${color ? `${color}44` : 'var(--surface-border)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.33 + 'px',
        fontWeight: 600,
        color: color || 'var(--text-secondary)',
        flexShrink: 0,
        letterSpacing: '-0.02em',
      }}
    >
      {getInitials(name)}
    </div>
  );
}

const REACTION_EMOJIS = ['🌟', '🔥', '🫂'] as const;
type Reaction = typeof REACTION_EMOJIS[number];

export default function KudosCard({ kudos, index }: KudosCardProps) {
  const category = CATEGORIES.find(c => c.icon === kudos.category) || CATEGORIES[0];
  const accentColor = CATEGORY_COLORS[kudos.category] || 'var(--cat-heart)';

  const { live } = useKudos();

  const [reactions, setReactions] = useState<Record<Reaction, number>>({ '🌟': 0, '🔥': 0, '🫂': 0 });
  const [myReactions, setMyReactions] = useState<Record<Reaction, boolean>>({ '🌟': false, '🔥': false, '🫂': false });
  const [animating, setAnimating] = useState<Reaction | null>(null);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`kudos_rx_${kudos._id}`);
      if (saved) {
        setMyReactions(JSON.parse(saved));
      }
    } catch { /* ignore */ }
  }, [kudos._id]);

  // Sync from live context
  useEffect(() => {
    if (kudos._id && live.reactions[kudos._id]) {
      setReactions(prev => ({ ...prev, ...live.reactions[kudos._id!] }));
    }
  }, [live.reactions, kudos._id]);

  const handleReaction = async (emoji: Reaction) => {
    const isUndo = myReactions[emoji];
    
    const nextMyReactions = { ...myReactions, [emoji]: !isUndo };
    setMyReactions(nextMyReactions);
    localStorage.setItem(`kudos_rx_${kudos._id}`, JSON.stringify(nextMyReactions));

    setReactions(prev => ({
      ...prev,
      [emoji]: Math.max(0, prev[emoji] + (isUndo ? -1 : 1)),
    }));
    setAnimating(emoji);
    setTimeout(() => setAnimating(null), 500);

    // Fire-and-forget to API
    try {
      await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kudosId: kudos._id!, emoji, undo: isUndo }),
      });
    } catch { /* optimistic, ignore errors */ }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.45,
        delay: Math.min(index * 0.05, 0.4),
        ease: [0.16, 1, 0.3, 1],
      }}
      className="surface-card card-lift"
      style={{
        padding: 'var(--space-4)',
        borderLeft: `2px solid ${accentColor}`,
        cursor: 'default',
        transition: 'transform 0.28s var(--ease-out-expo), box-shadow 0.28s, border-color 0.28s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Category tint — very subtle, only behind left third */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(105deg, ${accentColor}07 0%, transparent 45%)`,
          pointerEvents: 'none',
          borderRadius: 'inherit',
        }}
      />

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{kudos.category}</span>
          <span
            style={{
              fontSize: 'var(--text-label)',
              color: accentColor,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {category.label}
          </span>
        </div>
        <span className="text-label">{timeAgo(kudos.createdAt)}</span>
      </div>

      {/* Message */}
      <p
        style={{
          fontSize: 'var(--text-body)',
          color: 'var(--text-primary)',
          lineHeight: 1.7,
          marginBottom: 'var(--space-4)',
          fontStyle: 'italic',
          fontWeight: 400,
          position: 'relative',
        }}
      >
        &ldquo;{kudos.message}&rdquo;
      </p>

      {/* People row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        {/* To */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Avatar name={kudos.receiver} color={accentColor} />
          <div>
            <div style={{ fontSize: 'var(--text-label)', color: 'var(--text-tertiary)', lineHeight: 1, marginBottom: 2 }}>To</div>
            <div style={{ fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1 }}>{kudos.receiver}</div>
          </div>
        </div>

        {/* From */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 'var(--text-label)', color: 'var(--text-tertiary)', lineHeight: 1, marginBottom: 2 }}>From</div>
            <div style={{ fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1 }}>
              {kudos.isAnonymous ? '🥷 Anonymous' : kudos.sender}
            </div>
          </div>
          {!kudos.isAnonymous && <Avatar name={kudos.sender} />}
        </div>
      </div>

      {/* Reaction divider */}
      <div
        style={{
          height: 1,
          background: 'var(--surface-border)',
          margin: 'var(--space-3) 0 var(--space-2)',
          opacity: 0.6,
        }}
      />

      {/* Reaction Bar */}
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        {REACTION_EMOJIS.map(emoji => {
          const active = myReactions[emoji];
          const count = reactions[emoji];
          const isAnimating = animating === emoji;
          return (
            <motion.button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              whileTap={{ scale: 0.85 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 9999,
                border: `1px solid ${active ? 'var(--accent-border)' : 'var(--surface-border)'}`,
                background: active ? 'var(--accent-muted)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-tertiary)',
                fontSize: 'var(--text-label)',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 180ms var(--ease-smooth)',
                minHeight: 30,
              }}
            >
              <motion.span
                animate={isAnimating ? { scale: [1, 1.5, 1] } : {}}
                transition={{ duration: 0.35 }}
                style={{ fontSize: '0.95rem', lineHeight: 1, display: 'inline-block' }}
              >
                {emoji}
              </motion.span>
              <AnimatePresence mode="popLayout">
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.2 }}
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
