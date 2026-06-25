'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAvatarColor, getInitials } from '@/lib/utils';

interface HofKudos {
  _id: string;
  sender: string;
  receiver: string;
  message: string;
  category: string;
  reactionCount: number;
  reactionBreakdown: Record<string, number>;
  createdAt: string;
}

const RANK_STYLES = [
  {
    emoji: '🥇',
    bg: 'linear-gradient(145deg,#1a1200,#0f0900)',
    border: 'rgba(212,160,50,0.5)',
    rankColor: '#D4A032',
  },
  {
    emoji: '🥈',
    bg: 'linear-gradient(145deg,#131313,#0a0a0a)',
    border: 'rgba(180,180,180,0.3)',
    rankColor: '#b4b4b4',
  },
  {
    emoji: '🥉',
    bg: 'linear-gradient(145deg,#140a00,#0a0500)',
    border: 'rgba(180,100,50,0.3)',
    rankColor: '#b46432',
  },
];

function HofAvatar({ name }: { name: string }) {
  const colors = getAvatarColor(name);
  const initials = getInitials(name);
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: colors.base,
        border: '1.5px solid rgba(255,255,255,0.12)',
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

export default function HallOfFame() {
  const [hofList, setHofList] = useState<HofKudos[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHof = async () => {
      try {
        const res = await fetch('/api/hall-of-fame');
        if (res.ok) {
          const data = await res.json();
          setHofList(data);
        }
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    };
    fetchHof();
  }, []);

  if (isLoading || hofList.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ marginBottom: 'var(--space-5)' }}
    >
      {/* Header */}
      <div style={{ marginBottom: 10 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#D4A032',
            letterSpacing: '-0.01em',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          🏆 Hall of Fame · All-time legends
        </div>
        <div style={{ fontSize: 9, color: '#666', marginTop: 3 }}>
          Kudos with 10+ reactions earn a permanent spot
        </div>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${hofList.length}, 1fr)`,
          gap: 8,
        }}
      >
        <AnimatePresence>
          {hofList.map((kudos, i) => {
            const rank = RANK_STYLES[i];
            const breakdown = kudos.reactionBreakdown || {};
            return (
              <motion.div
                key={kudos._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
                style={{
                  background: rank.bg,
                  border: `1px solid ${rank.border}`,
                  borderRadius: 10,
                  padding: 12,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Rank emoji */}
                <span
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 10,
                    fontSize: 14,
                    lineHeight: 1,
                  }}
                >
                  {rank.emoji}
                </span>

                {/* Avatar + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <HofAvatar name={kudos.receiver} />
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#fff',
                        lineHeight: 1.2,
                        maxWidth: 90,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {kudos.receiver}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: '#D4A032',
                        marginTop: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      ⭐ {kudos.reactionCount} reactions
                    </div>
                  </div>
                </div>

                {/* Message */}
                <p
                  style={{
                    fontSize: 9,
                    color: '#777',
                    fontStyle: 'italic',
                    lineHeight: 1.4,
                    margin: '0 0 8px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {kudos.message}
                </p>

                {/* Reaction breakdown pills */}
                {Object.keys(breakdown).length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {Object.entries(breakdown).map(([emoji, count]) => (
                      <span
                        key={emoji}
                        style={{
                          background: 'rgba(212,160,50,0.1)',
                          border: '1px solid rgba(212,160,50,0.2)',
                          borderRadius: 20,
                          padding: '1px 5px',
                          fontSize: 8,
                          color: '#D4A032',
                        }}
                      >
                        {emoji} {count}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
