'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKudos } from '@/context/KudosContext';

interface EchoData {
  content: string;
  generatedAt: string;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function EchoInsight() {
  const { currentUser, kudosList } = useKudos();
  const [insight, setInsight] = useState<EchoData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [revealedPhrases, setRevealedPhrases] = useState<string[]>([]);
  const [isDismissed, setIsDismissed] = useState(false);
  const [notEnoughKudos, setNotEnoughKudos] = useState(false);

  // How many kudos has this user given?
  const givenCount = kudosList.filter(k => k.sender === currentUser?.name).length;
  const MINIMUM_KUDOS = 8;

  // Check dismissal from localStorage
  useEffect(() => {
    if (!currentUser) return;
    const dismissed = localStorage.getItem(`echo_dismissed_${currentUser.name}`);
    if (dismissed) setIsDismissed(true);
  }, [currentUser]);

  // Load existing insight on mount
  const loadInsight = useCallback(async () => {
    if (!currentUser || isDismissed) return;
    if (givenCount < MINIMUM_KUDOS) {
      setNotEnoughKudos(true);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/echo');
      if (res.ok) {
        const data = await res.json();
        if (data.insight) {
          setInsight(data.insight);
          startReveal(data.insight.content);
        }
      }
    } catch { /* ignore */ } finally {
      setIsLoading(false);
    }
  }, [currentUser, isDismissed, givenCount]);

  useEffect(() => {
    loadInsight();
  }, [loadInsight]);

  // Split content into phrases for slow reveal
  const startReveal = (content: string) => {
    const sentences = content
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 0);

    setRevealedPhrases([]);
    sentences.forEach((sentence, i) => {
      setTimeout(() => {
        setRevealedPhrases(prev => [...prev, sentence]);
      }, i * 600 + 300);
    });
  };

  const handleDismiss = () => {
    if (currentUser) {
      localStorage.setItem(`echo_dismissed_${currentUser.name}`, 'true');
    }
    setIsDismissed(true);
  };

  const handleRefresh = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setRevealedPhrases([]);
    try {
      const res = await fetch('/api/echo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.insight) {
          setInsight(data.insight);
          startReveal(data.insight.content);
        }
      }
    } catch { /* ignore */ } finally {
      setIsLoading(false);
    }
  };

  // Don't render if dismissed, not enough kudos, still loading (first time), or no insight
  if (isDismissed) return null;
  if (notEnoughKudos) return null;
  if (!insight && isLoading) return null;
  if (!insight && !isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="echo-container"
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: '1.1rem' }}>🪞</span>
          <div>
            <div
              style={{
                fontSize: 'var(--text-label)',
                fontWeight: 700,
                color: 'var(--cat-gem)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Echo · Your Mirror
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
              What you&apos;ve been noticing lately
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
          {insight?.generatedAt && (
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
              {formatDate(insight.generatedAt)}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="btn-icon"
            aria-label="Refresh Echo insight"
            title="Refresh"
            style={{ width: 26, height: 26, border: 'none', fontSize: '0.8rem' }}
          >
            {isLoading ? '⟳' : '↺'}
          </button>
          <button
            onClick={handleDismiss}
            className="btn-icon"
            aria-label="Dismiss Echo insight"
            title="Dismiss"
            style={{ width: 26, height: 26, border: 'none' }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* The slow reveal — phrase by phrase */}
      <div
        style={{
          fontSize: 'var(--text-body)',
          color: 'var(--text-primary)',
          lineHeight: 1.75,
          fontStyle: 'italic',
        }}
      >
        <AnimatePresence>
          {revealedPhrases.map((phrase, i) => (
            <motion.span
              key={`${i}-${phrase.slice(0, 10)}`}
              initial={{ opacity: 0, y: 4, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'inline' }}
            >
              {phrase}{i < revealedPhrases.length - 1 ? ' ' : ''}
            </motion.span>
          ))}
        </AnimatePresence>

        {/* Typing cursor while revealing */}
        {revealedPhrases.length > 0 &&
          insight &&
          revealedPhrases.join(' ').length < insight.content.length && (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              style={{ display: 'inline-block', width: 2, height: '1em', background: 'var(--cat-gem)', marginLeft: 2, verticalAlign: 'middle', borderRadius: 1 }}
            />
          )}
      </div>

      {/* Attribution */}
      {revealedPhrases.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          style={{
            marginTop: 'var(--space-3)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
          }}
        >
          <div
            style={{
              height: 1,
              flex: 1,
              background: 'var(--surface-border)',
              opacity: 0.5,
            }}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            Echo — reflecting your giving patterns
          </span>
          <div
            style={{
              height: 1,
              flex: 1,
              background: 'var(--surface-border)',
              opacity: 0.5,
            }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
