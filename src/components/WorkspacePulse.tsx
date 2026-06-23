'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useKudos } from '@/context/KudosContext';

interface WorkspacePulseProps {
  className?: string;
}

export default function WorkspacePulse({ className }: WorkspacePulseProps) {
  const { live } = useKudos();
  const count = live.todayCount;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <span style={{ fontSize: 'var(--text-label)', color: 'var(--text-tertiary)' }}>
        Today:
      </span>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={count}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.25 }}
          style={{
            fontSize: 'var(--text-label)',
            color: 'var(--text-secondary)',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {count}
        </motion.span>
      </AnimatePresence>
      <span style={{ fontSize: 'var(--text-label)', color: 'var(--text-tertiary)' }}>
        kudos
      </span>
    </div>
  );
}
