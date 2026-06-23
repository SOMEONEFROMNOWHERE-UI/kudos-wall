'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKudos } from '@/context/KudosContext';

interface WeeklySpotlightProps {
  onOpen?: () => void;
}

function getLastMonday(): Date {
  const d = new Date();
  const day = d.getDay();
  // Offset to last Monday (0=Sun, 1=Mon, ...)
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isMonday(): boolean {
  return new Date().getDay() === 1;
}

function getTopReceiver(kudosList: { receiver: string; createdAt?: string }[]): { name: string; count: number } | null {
  if (kudosList.length === 0) return null;
  const lastMonday = getLastMonday();
  const lastWeekEnd = new Date(lastMonday);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1); // last Sunday
  const lastWeekStart = new Date(lastWeekEnd);
  lastWeekStart.setDate(lastWeekStart.getDate() - 6); // last Monday

  const tally: Record<string, number> = {};
  for (const k of kudosList) {
    if (!k.createdAt) continue;
    const d = new Date(k.createdAt);
    if (d >= lastWeekStart && d <= lastWeekEnd) {
      tally[k.receiver] = (tally[k.receiver] || 0) + 1;
    }
  }

  const entries = Object.entries(tally);
  if (entries.length === 0) {
    // Fallback: most-kudosed overall
    const overall: Record<string, number> = {};
    for (const k of kudosList) overall[k.receiver] = (overall[k.receiver] || 0) + 1;
    const best = Object.entries(overall).sort((a, b) => b[1] - a[1])[0];
    if (!best) return null;
    return { name: best[0], count: best[1] };
  }

  const best = entries.sort((a, b) => b[1] - a[1])[0];
  return { name: best[0], count: best[1] };
}

const DISMISS_KEY = 'kudoswall_spotlight_dismissed';

export default function WeeklySpotlight() {
  const { kudosList } = useKudos();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(true); // start hidden, reveal after check

  useEffect(() => {
    // Only show on Monday
    if (!isMonday()) return;
    const key = `${DISMISS_KEY}_${new Date().toISOString().split('T')[0]}`;
    if (sessionStorage.getItem(key)) return;
    if (kudosList.length === 0) return;
    setDismissed(false);
    setVisible(true);
    // Auto-dismiss after 5s
    const t = setTimeout(() => dismiss(), 5000);
    return () => clearTimeout(t);
  }, [kudosList.length]);

  const dismiss = () => {
    setVisible(false);
    const key = `${DISMISS_KEY}_${new Date().toISOString().split('T')[0]}`;
    sessionStorage.setItem(key, '1');
    setTimeout(() => setDismissed(true), 400);
  };

  if (dismissed) return null;

  const star = getTopReceiver(kudosList);
  if (!star) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 'var(--z-toast)' as unknown as number,
            background: 'linear-gradient(135deg, rgba(232,184,75,0.12) 0%, rgba(232,184,75,0.04) 100%)',
            borderBottom: '1px solid var(--accent-border)',
            padding: '14px var(--space-4)',
          }}
        >
          <div
            style={{
              maxWidth: 1280,
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <motion.span
                animate={{ rotate: [0, -12, 12, -8, 0] }}
                transition={{ delay: 0.5, duration: 0.7 }}
                style={{ fontSize: '1.5rem', lineHeight: 1 }}
              >
                🏆
              </motion.span>
              <div>
                <span style={{ fontSize: 'var(--text-label)', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Last week&apos;s spotlight
                </span>
                <div style={{ fontSize: 'var(--text-body)', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {star.name}
                  <span style={{ fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 6 }}>
                    received {star.count} kudos
                  </span>
                </div>
              </div>
            </div>

            {/* Progress + dismiss */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              {/* Progress bar */}
              <div style={{ width: 64, height: 2, background: 'var(--surface-border)', borderRadius: 2, overflow: 'hidden' }}>
                <motion.div
                  initial={{ scaleX: 1, originX: 0 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: 5, ease: 'linear' }}
                  style={{ height: '100%', background: 'var(--accent)', borderRadius: 2 }}
                />
              </div>
              <button
                onClick={dismiss}
                style={{
                  fontSize: 'var(--text-label)',
                  color: 'var(--text-tertiary)',
                  padding: '4px 10px',
                  border: '1px solid var(--surface-border)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: 'transparent',
                  transition: 'color 150ms',
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
