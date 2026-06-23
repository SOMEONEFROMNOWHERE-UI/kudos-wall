'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useKudos } from '@/context/KudosContext';

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ['#E8B84B', '#6FCF97', '#56B4E8', '#A78BFA', '#FF6B4A', '#E0A85C'];

export default function LivePresenceStrip() {
  const { live, currentUser } = useKudos();
  const uniqueUsers = Array.from(new Set(live.presenceUsers));
  const others = uniqueUsers.filter(u => u !== currentUser?.name);
  const total = uniqueUsers.length;

  if (total < 1) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'var(--surface-raised)',
        borderBottom: '1px solid var(--surface-border)',
        padding: '7px var(--space-4)',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}
      >
        {/* Live dot */}
        <div style={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}>
          <div
            style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--positive)',
              position: 'absolute', inset: 0,
            }}
          />
          <div
            style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--positive)',
              position: 'absolute', inset: 0,
              animation: 'pulse-ring 1.8s ease-out infinite',
            }}
          />
        </div>

        {/* Avatar stack */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <AnimatePresence>
            {Array.from(new Set(live.presenceUsers)).slice(0, 5).map((name, i) => (
              <motion.div
                key={name}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                title={name}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: `${AVATAR_COLORS[i % AVATAR_COLORS.length]}22`,
                  border: `1.5px solid ${AVATAR_COLORS[i % AVATAR_COLORS.length]}55`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  color: AVATAR_COLORS[i % AVATAR_COLORS.length],
                  marginLeft: i === 0 ? 0 : -6,
                  zIndex: 5 - i,
                  position: 'relative',
                }}
              >
                {getInitials(name)}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Label */}
        <span
          style={{
            fontSize: 'var(--text-label)',
            color: 'var(--text-tertiary)',
          }}
        >
          {total === 1
            ? 'Just you here'
            : others.length === 1
            ? `${others[0]} is also here`
            : `${total} teammates here now`}
        </span>
      </div>
    </motion.div>
  );
}
