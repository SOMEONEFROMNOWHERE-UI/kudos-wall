'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useKudos } from '@/context/KudosContext';
import { useState } from 'react';

interface PayItForwardProps {
  receiverName: string;
  onPay: (receiver: string, message: string) => void;
  onDismiss: () => void;
}

export default function PayItForward({ receiverName, onPay, onDismiss }: PayItForwardProps) {
  const [expanded, setExpanded] = useState(false);
  const [target, setTarget] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      style={{
        background: 'var(--surface-overlay)',
        border: '1px solid var(--accent-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        marginBottom: 'var(--space-4)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Warm tint */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(232,184,75,0.05) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 6 }}>
              <span style={{ fontSize: '1.25rem' }}>✨</span>
              <span style={{ fontSize: 'var(--text-label)', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Pay it forward
              </span>
            </div>
            <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              You just received kudos. Spread the energy — who else deserves a shoutout?
            </p>
          </div>
          <button
            onClick={onDismiss}
            style={{ color: 'var(--text-tertiary)', fontSize: '1.1rem', flexShrink: 0, padding: 4, lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <AnimatePresence>
          {!expanded ? (
            <motion.button
              key="trigger"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpanded(true)}
              className="btn-primary"
              style={{ marginTop: 'var(--space-3)', width: '100%' }}
            >
              Give kudos to someone →
            </motion.button>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ paddingTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)' }}>
                <input
                  type="text"
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                  placeholder="Their name…"
                  className="input-field"
                  style={{ flex: 1 }}
                  maxLength={50}
                  autoFocus
                />
                <button
                  className="btn-primary"
                  disabled={!target.trim()}
                  onClick={() => {
                    if (target.trim()) {
                      onPay(target.trim(), `Inspired by the kudos I just received — you deserve recognition too!`);
                    }
                  }}
                  style={{ flexShrink: 0, padding: '11px 20px' }}
                >
                  Go →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
