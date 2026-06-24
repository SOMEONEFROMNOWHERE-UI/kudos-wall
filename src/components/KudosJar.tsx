'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useKudos } from '@/context/KudosContext';
import KudosCard from './KudosCard';
import PayItForward from './PayItForward';

interface KudosJarProps {
  isOpen: boolean;
  onClose: () => void;
  onPayItForward?: () => void;
}

export default function KudosJar({ isOpen, onClose, onPayItForward }: KudosJarProps) {
  const { currentUser, kudosList } = useKudos();
  const [showPayItForward, setShowPayItForward] = useState(true);

  const myKudos = kudosList.filter(
    k => k.receiver.toLowerCase() === currentUser?.name.toLowerCase()
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="jar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              zIndex: 'var(--z-modal-backdrop)' as unknown as number,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />

          <motion.aside
            key="jar-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
            style={{
              position: 'fixed',
              top: 0, right: 0, bottom: 0,
              width: 'min(100vw, 420px)',
              zIndex: 'var(--z-modal)' as unknown as number,
              background: 'var(--surface-raised)',
              borderLeft: '1px solid var(--surface-border)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
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
                flexShrink: 0,
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: 'var(--text-title)',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                  }}
                >
                  <span>🍯</span> My Kudos Jar
                </h2>
                <p style={{ fontSize: 'var(--text-label)', color: 'var(--text-tertiary)', marginTop: 3 }}>
                  Private — only you can see this
                </p>
              </div>
              <button onClick={onClose} className="btn-icon" aria-label="Close jar">
                <X size={15} />
              </button>
            </div>

            {/* Count */}
            {myKudos.length > 0 && (
              <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--surface-border)', flexShrink: 0 }}>
                <span style={{ fontSize: 'var(--text-label)', color: 'var(--text-tertiary)' }}>
                  {myKudos.length} kudos received
                </span>
              </div>
            )}

            {/* Scrollable content */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {/* Pay It Forward prompt */}
              {myKudos.length > 0 && showPayItForward && (
                <PayItForward
                  receiverName={currentUser?.name || ''}
                  onPay={() => {
                    onPayItForward?.();
                    setShowPayItForward(false);
                  }}
                  onDismiss={() => setShowPayItForward(false)}
                />
              )}

              {/* Empty state */}
              {myKudos.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ textAlign: 'center', padding: 'var(--space-6) var(--space-4)' }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)', lineHeight: 1 }}>🍯</div>
                  <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    Your jar is empty.
                    <br />Keep shining — the kudos will come.
                  </p>
                </motion.div>
              ) : (
                myKudos.map((kudos, i) => (
                  <motion.div
                    key={kudos._id || i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <KudosCard kudos={kudos} index={0} />
                  </motion.div>
                ))
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
