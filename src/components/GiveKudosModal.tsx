'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, MessageSquare, Sparkles, Eye, EyeOff, Infinity as InfinityIcon, Clock, Calendar, Hourglass, Send } from 'lucide-react';
import { useKudos } from '@/context/KudosContext';
import type { KudosCategory } from '@/types';
import { CATEGORIES } from '@/types';

interface GiveKudosModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillReceiver?: string;
  prefillMessage?: string;
}

type ModalStep = 'form' | 'success';

// Per-category emoji glow colors
const EMOJI_GLOWS: Record<string, string> = {
  '🔥': '0 0 8px rgba(251,146,60,0.8)',
  '💎': '0 0 8px rgba(86,180,232,0.8)',
  '🚀': '0 0 8px rgba(167,139,250,0.8)',
  '🧠': '0 0 8px rgba(111,207,151,0.8)',
  '🫂': '0 0 8px rgba(232,184,75,0.8)',
};

const PILL_ACCENT_COLORS: Record<string, string> = {
  '🔥': '#FF6B4A',
  '💎': '#56B4E8',
  '🚀': '#A78BFA',
  '🧠': '#6FCF97',
  '🫂': '#E8B84B',
};

const VIBE_BORDER_CLASSES: Record<string, string> = {
  '🔥': 'border-vibe-fire',
  '💎': 'border-vibe-gem',
  '🚀': 'border-vibe-rocket',
  '🧠': 'border-vibe-brain',
  '🫂': 'border-vibe-team',
};

const VIBE_THEME_VARIABLES: Record<string, Record<string, string>> = {
  '🔥': {
    '--vibe-accent': '#FF6B4A',
    '--vibe-accent-secondary': '#F59E0B',
    '--vibe-accent-border': 'rgba(255, 107, 74, 0.45)',
    '--vibe-accent-border-dim': 'rgba(255, 107, 74, 0.25)',
    '--vibe-accent-glow': 'rgba(255, 107, 74, 0.25)',
    '--vibe-accent-glow-dim': 'rgba(255, 107, 74, 0.1)',
  },
  '💎': {
    '--vibe-accent': '#56B4E8',
    '--vibe-accent-secondary': '#3B82F6',
    '--vibe-accent-border': 'rgba(86, 180, 232, 0.45)',
    '--vibe-accent-border-dim': 'rgba(86, 180, 232, 0.25)',
    '--vibe-accent-glow': 'rgba(86, 180, 232, 0.25)',
    '--vibe-accent-glow-dim': 'rgba(86, 180, 232, 0.1)',
  },
  '🚀': {
    '--vibe-accent': '#A78BFA',
    '--vibe-accent-secondary': '#EC4899',
    '--vibe-accent-border': 'rgba(167, 139, 250, 0.45)',
    '--vibe-accent-border-dim': 'rgba(167, 139, 250, 0.25)',
    '--vibe-accent-glow': 'rgba(167, 139, 250, 0.25)',
    '--vibe-accent-glow-dim': 'rgba(167, 139, 250, 0.1)',
  },
  '🧠': {
    '--vibe-accent': '#6FCF97',
    '--vibe-accent-secondary': '#10B981',
    '--vibe-accent-border': 'rgba(111, 207, 151, 0.45)',
    '--vibe-accent-border-dim': 'rgba(111, 207, 151, 0.25)',
    '--vibe-accent-glow': 'rgba(111, 207, 151, 0.25)',
    '--vibe-accent-glow-dim': 'rgba(111, 207, 151, 0.1)',
  },
  '🫂': {
    '--vibe-accent': '#E8B84B',
    '--vibe-accent-secondary': '#F59E0B',
    '--vibe-accent-border': 'rgba(232, 184, 75, 0.45)',
    '--vibe-accent-border-dim': 'rgba(232, 184, 75, 0.25)',
    '--vibe-accent-glow': 'rgba(232, 184, 75, 0.25)',
    '--vibe-accent-glow-dim': 'rgba(232, 184, 75, 0.1)',
  },
};

const DEFAULT_THEME_VARIABLES: Record<string, string> = {
  '--vibe-accent': '#FB923C',
  '--vibe-accent-secondary': '#F59E0B',
  '--vibe-accent-border': 'rgba(255, 255, 255, 0.12)',
  '--vibe-accent-border-dim': 'rgba(255, 255, 255, 0.06)',
  '--vibe-accent-glow': 'rgba(255, 255, 255, 0.05)',
  '--vibe-accent-glow-dim': 'rgba(255, 255, 255, 0.01)',
};

const FORM_CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    }
  }
};

const FORM_ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 20 } as const }
};

export default function GiveKudosModal({
  isOpen,
  onClose,
  prefillReceiver = '',
  prefillMessage = '',
}: GiveKudosModalProps) {
  const { currentUser, addKudos } = useKudos();
  const [receiver, setReceiver] = useState(prefillReceiver);
  const [message, setMessage] = useState(prefillMessage);
  const [category, setCategory] = useState<KudosCategory | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<ModalStep>('form');
  const [arrowHovered, setArrowHovered] = useState(false);
  const [lastSelected, setLastSelected] = useState<KudosCategory | null>(null);
  const [isReceiverFocused, setIsReceiverFocused] = useState(false);
  const [isMessageFocused, setIsMessageFocused] = useState(false);
  const receiverRef = useRef<HTMLInputElement>(null);

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [isVibing, setIsVibing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sentimentWarning, setSentimentWarning] = useState<string | null>(null);
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState(false);

  const handleEnhance = async () => {
    if (isEnhancing || message.trim().length < 5) return;
    setIsEnhancing(true);
    setSentimentWarning(null); // Clear any previous warning
    const rawKudosText = message;
    try {
      const response = await fetch("/api/enhance-kudos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: rawKudosText })
      });
      if (!response.ok) {
        throw new Error("API request failed");
      }
      const data = await response.json();
      if (data && data.enhanced) {
        setMessage(data.enhanced);
        setIsEnhanced(true);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Enhancement failed:", error);
      setToastMessage("Couldn't enhance right now");
      setTimeout(() => {
        setToastMessage(null);
      }, 3000);
    } finally {
      setIsEnhancing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setReceiver(prefillReceiver);
      setMessage(prefillMessage);
      setCategory(null);
      setIsAnonymous(false);
      setDuration(0);
      setStep('form');
      setIsSubmitting(false);
      setLastSelected(null);
      setIsEnhanced(false);
      setIsEnhancing(false);
      setToastMessage(null);
      setSentimentWarning(null);
      setIsAnalyzingSentiment(false);
      setTimeout(() => receiverRef.current?.focus(), 150);
    }
  }, [isOpen, prefillReceiver, prefillMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiver.trim() || !message.trim() || !category || !currentUser || isSubmitting || isVibing || isAnalyzingSentiment) return;
    
    setSentimentWarning(null);
    setIsAnalyzingSentiment(true);
    
    try {
      const sentRes = await fetch('/api/analyze-sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() })
      });
      if (sentRes.ok) {
        const sentimentData = await sentRes.json();
        if (sentimentData.sentiment === 'negative') {
          setIsAnalyzingSentiment(false);
          setSentimentWarning(`⚠️ Your message seems negative. Kudos should be uplifting! Try rephrasing. (Reason: ${sentimentData.reason})`);
          return;
        } else if (sentimentData.sentiment === 'neutral') {
          setToastMessage('💡 Tip: More specific praise makes kudos more meaningful!');
          setTimeout(() => setToastMessage(null), 4000);
        }
      }
    } catch (e) {
      console.error('Sentiment check failed', e);
    }
    
    setIsAnalyzingSentiment(false);
    setIsVibing(true);
    let classification = { passed: true, badge: 'GOOD_VIBES', reason: '' };
    try {
      const vibeRes = await fetch('/api/classify-vibe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() })
      });
      if (vibeRes.ok) {
        classification = await vibeRes.json();
      }
    } catch (e) {
      console.error('Vibe classification failed', e);
    }
    setIsVibing(false);

    if (!classification.passed) {
      setToastMessage('Message blocked: ' + (classification.reason || 'inappropriate content'));
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setIsSubmitting(true);
    try {
      await addKudos({
        sender: currentUser.name,
        receiver: receiver.trim(),
        message: message.trim(),
        category,
        isAnonymous,
        duration,
        badge: classification.badge,
      });
      setStep('success');
      setTimeout(() => onClose(), 1800);
    } catch (error: any) {
      setIsSubmitting(false);
      setToastMessage(error.message || 'Failed to send kudos.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const isValid = receiver.trim() && message.trim() && category;
  const themeVariables = (category && VIBE_THEME_VARIABLES[category]) || DEFAULT_THEME_VARIABLES;




  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 'var(--z-modal-backdrop)' as unknown as number,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />

          {/* ── Centering wrapper ── */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 'var(--z-modal)' as unknown as number,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              padding: 20,
            }}
          >
            {/* ── Modal ── */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 16 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`modal-wrapper ${category ? VIBE_BORDER_CLASSES[category] : 'modal-border-default'}`}
              style={{
                pointerEvents: 'auto',
                ...themeVariables as React.CSSProperties,
              }}
            >

              <div className="modal-inner" style={{ position: 'relative', overflowX: 'hidden', overflowY: 'auto' }}>
                {/* Static ambient colored glow in modal corner */}
                <div
                  style={{
                    position: 'absolute',
                    top: -100,
                    right: -100,
                    width: 320,
                    height: 320,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, var(--vibe-accent, #FB923C) 0%, transparent 70%)',
                    filter: 'blur(65px)',
                    opacity: 0.06,
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                />
                <AnimatePresence mode="wait">
                {step === 'success' ? (
                  /* ── Success State ── */
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    style={{
                      padding: '64px 40px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 16,
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.05 }}
                      style={{ fontSize: '3.5rem', lineHeight: 1 }}
                    >
                      🎉
                    </motion.div>
                    <motion.h3
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      style={{ fontSize: '1.25rem', fontWeight: 700, color: '#EDEDF0', letterSpacing: '-0.02em' }}
                    >
                      Kudos launched! ✨
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      style={{ fontSize: '0.9375rem', color: '#9CA3AF', lineHeight: 1.6 }}
                    >
                      {receiver} just got a reason to smile.
                    </motion.p>
                    <motion.div
                      style={{ width: 80, height: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginTop: 8 }}
                    >
                      <motion.div
                        initial={{ scaleX: 1, originX: 0 }}
                        animate={{ scaleX: 0 }}
                        transition={{ duration: 1.8, ease: 'linear' }}
                        style={{ height: '100%', background: 'linear-gradient(90deg, var(--vibe-accent), var(--vibe-accent-secondary))', borderRadius: 2 }}
                      />
                    </motion.div>
                  </motion.div>
                ) : (
                  /* ── Form State ── */
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -16 }}
                  >
                    {/* ── Header ── */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        padding: '28px 28px 20px 28px',
                        position: 'relative',
                      }}
                    >
                      <div>
                        <h2
                          style={{
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            color: '#EDEDF0',
                            letterSpacing: '-0.03em',
                            lineHeight: 1.2,
                            margin: 0,
                          }}
                        >
                          Craft a Kudos
                        </h2>
                        <p
                          style={{
                            fontSize: '0.95rem',
                            fontStyle: 'italic',
                            color: '#9CA3AF',
                            marginTop: 6,
                            fontWeight: 400,
                          }}
                        >
                          Make it genuine — they&apos;ll keep it forever
                        </p>
                      </div>

                      {/* Ghost close button */}
                      <motion.button
                        onClick={onClose}
                        whileHover={{ rotate: 90, background: 'rgba(255,255,255,0.1)', opacity: 1 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        aria-label="Close"
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.05)',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#9CA3AF',
                          opacity: 0.7,
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        <X size={16} />
                      </motion.button>
                    </div>

                    {/* Gradient divider */}
                    <div
                      style={{
                        height: 1,
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                        margin: '0 28px',
                      }}
                    />

                    {/* ── Form Body ── */}
                    <motion.form
                      variants={FORM_CONTAINER_VARIANTS}
                      initial="hidden"
                      animate="show"
                      onSubmit={handleSubmit}
                      style={{
                        padding: '28px 28px 28px 28px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 28,
                        position: 'relative',
                        zIndex: 1,
                      }}
                    >
                      {/* WHO SHINES TODAY */}
                      <motion.div variants={FORM_ITEM_VARIANTS}>
                        <label htmlFor="kudos-receiver" className="kudos-section-label">
                          Who Shines Today?
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <User
                            size={16}
                            style={{
                              position: 'absolute',
                              left: 16,
                              color: isReceiverFocused ? 'var(--vibe-accent)' : 'rgba(255, 255, 255, 0.35)',
                              transition: 'color 0.2s ease',
                              pointerEvents: 'none',
                            }}
                          />
                          <input
                            ref={receiverRef}
                            id="kudos-receiver"
                            type="text"
                            className="kudos-modal-input"
                            value={receiver}
                            onChange={e => setReceiver(e.target.value)}
                            onFocus={() => setIsReceiverFocused(true)}
                            onBlur={() => setIsReceiverFocused(false)}
                            placeholder="Their name…"
                            maxLength={50}
                            required
                            style={{
                              paddingLeft: 46,
                            }}
                          />
                        </div>
                      </motion.div>

                      {/* VIBE CHECK PILLS — 3-column premium grid */}
                      <motion.div variants={FORM_ITEM_VARIANTS}>
                        <div className="kudos-section-label">Vibe Check</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                          {CATEGORIES.map(cat => {
                            const selected = category === cat.icon;
                            const isJustSelected = lastSelected === cat.icon;
                            const accentColor = PILL_ACCENT_COLORS[cat.icon];

                            return (
                              <motion.button
                                key={cat.icon}
                                type="button"
                                onClick={() => {
                                  setCategory(cat.icon);
                                  setLastSelected(cat.icon);
                                  setTimeout(() => setLastSelected(null), 400);
                                }}
                                whileTap={{ scale: 0.94 }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 7,
                                  padding: '11px 10px',
                                  borderRadius: 12,
                                  border: selected
                                    ? `1.5px solid ${accentColor}`
                                    : '1px solid rgba(255,255,255,0.07)',
                                  background: selected
                                    ? `linear-gradient(145deg, ${accentColor}22 0%, ${accentColor}0E 100%)`
                                    : 'rgba(255,255,255,0.025)',
                                  color: selected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.55)',
                                  fontSize: '0.845rem',
                                  fontWeight: selected ? 700 : 500,
                                  letterSpacing: '-0.01em',
                                  cursor: 'pointer',
                                  transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                                  boxShadow: selected
                                    ? `0 4px 18px ${accentColor}30, inset 0 1px 0 rgba(255,255,255,0.1)`
                                    : 'inset 0 1px 0 rgba(255,255,255,0.03)',
                                  WebkitFontSmoothing: 'antialiased',
                                }}
                                onMouseEnter={e => {
                                  if (!selected) {
                                    const el = e.currentTarget as HTMLButtonElement;
                                    el.style.background = `rgba(255,255,255,0.06)`;
                                    el.style.borderColor = 'rgba(255,255,255,0.14)';
                                    el.style.color = 'rgba(255,255,255,0.85)';
                                    el.style.transform = 'translateY(-1px)';
                                  }
                                }}
                                onMouseLeave={e => {
                                  if (!selected) {
                                    const el = e.currentTarget as HTMLButtonElement;
                                    el.style.background = 'rgba(255,255,255,0.025)';
                                    el.style.borderColor = 'rgba(255,255,255,0.07)';
                                    el.style.color = 'rgba(255,255,255,0.55)';
                                    el.style.transform = 'translateY(0)';
                                  }
                                }}
                              >
                                <motion.span
                                  animate={isJustSelected ? { scale: [1, 1.35, 1] } : {}}
                                  transition={{ duration: 0.28, ease: 'easeOut' }}
                                  style={{
                                    fontSize: '1.05rem',
                                    lineHeight: 1,
                                    filter: selected ? `drop-shadow(${EMOJI_GLOWS[cat.icon]})` : 'none',
                                    flexShrink: 0,
                                  }}
                                >
                                  {cat.icon}
                                </motion.span>
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.label}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>

                      {/* YOUR WORDS TEXTAREA */}
                      <motion.div variants={FORM_ITEM_VARIANTS}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 13,
                          }}
                        >
                          <label htmlFor="kudos-message" className="kudos-section-label" style={{ marginBottom: 0 }}>
                            Your Words
                          </label>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: message.length > 1800 ? 'var(--vibe-accent)' : '#6B7280',
                              transition: 'color 0.2s ease',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {message.length}/2000
                          </span>
                        </div>
                        <div style={{ position: 'relative', display: 'flex' }}>
                          <MessageSquare
                            size={16}
                            style={{
                              position: 'absolute',
                              left: 16,
                              top: 16,
                              color: isMessageFocused ? 'var(--vibe-accent)' : 'rgba(255, 255, 255, 0.35)',
                              transition: 'color 0.2s ease',
                              pointerEvents: 'none',
                              zIndex: 10,
                            }}
                          />
                          <textarea
                            id="kudos-message"
                            className={`kudos-modal-input ${isEnhancing ? 'ai-enhancing' : ''}`}
                            value={message}
                            onChange={e => {
                              setMessage(e.target.value);
                              if (e.target.value.trim() === '') {
                                setIsEnhanced(false);
                              }
                            }}
                            onFocus={() => setIsMessageFocused(true)}
                            onBlur={() => setIsMessageFocused(false)}
                            placeholder="Be specific — what exactly did they do that made a difference?"
                            rows={4}
                            maxLength={2000}
                            required
                            style={{
                              paddingLeft: 46,
                              paddingTop: 14,
                              transition: 'all 0.3s ease',
                              ...(sentimentWarning ? {
                                borderColor: 'rgba(249, 115, 22, 0.8)',
                                boxShadow: '0 0 15px rgba(249, 115, 22, 0.25)',
                              } : {})
                            }}
                          />
                        </div>
                        {sentimentWarning && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                              color: '#F97316', // Orange accent
                              fontSize: '0.85rem',
                              fontWeight: 500,
                              marginTop: 8,
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 6
                            }}
                          >
                            <span>{sentimentWarning}</span>
                          </motion.div>
                        )}
                        {/* Kudos Auto-Enhancer */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, minHeight: 32 }}>
                          <div>
                            {message.trim().length >= 5 && (
                              <motion.button
                                type="button"
                                onClick={handleEnhance}
                                disabled={isEnhancing}
                                whileHover={!isEnhancing ? {
                                  scale: 1.02,
                                  boxShadow: '0 0 12px rgba(167, 139, 250, 0.4)',
                                  borderColor: 'rgba(167, 139, 250, 0.6)',
                                  backgroundColor: 'rgba(167, 139, 250, 0.15)',
                                } : {}}
                                whileTap={!isEnhancing ? { scale: 0.98 } : {}}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '6px 12px',
                                  borderRadius: 8,
                                  border: '1px solid rgba(167, 139, 250, 0.3)',
                                  backgroundColor: 'rgba(167, 139, 250, 0.05)',
                                  color: '#C084FC', // Purple/Pink text
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  cursor: isEnhancing ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.2s ease',
                                  opacity: isEnhancing ? 0.7 : 1,
                                }}
                              >
                                {isEnhancing ? (
                                  <>
                                    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center', marginRight: 4 }}>
                                      <motion.span
                                        animate={{ scale: [0.6, 1.2, 0.6], opacity: [0.4, 1, 0.4] }}
                                        transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut', times: [0, 0.5, 1] }}
                                        style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#A78BFA', display: 'inline-block' }}
                                      />
                                      <motion.span
                                        animate={{ scale: [0.6, 1.2, 0.6], opacity: [0.4, 1, 0.4] }}
                                        transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut', delay: 0.2, times: [0, 0.5, 1] }}
                                        style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#A78BFA', display: 'inline-block' }}
                                      />
                                      <motion.span
                                        animate={{ scale: [0.6, 1.2, 0.6], opacity: [0.4, 1, 0.4] }}
                                        transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut', delay: 0.4, times: [0, 0.5, 1] }}
                                        style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#A78BFA', display: 'inline-block' }}
                                      />
                                    </span>
                                    Enhancing…
                                  </>
                                ) : isEnhanced ? (
                                  <>
                                    <span>🔄</span> Try Again
                                  </>
                                ) : (
                                  <>
                                    <Sparkles size={13} /> Enhance with AI
                                  </>
                                )}
                              </motion.button>
                            )}
                          </div>
                          
                          {isEnhanced && (
                            <motion.span
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              style={{
                                fontSize: '0.75rem',
                                color: '#9CA3AF',
                                fontStyle: 'italic',
                              }}
                            >
                              AI enhanced · tap to edit
                            </motion.span>
                          )}
                        </div>
                      </motion.div>

                      {/* SEND ANONYMOUSLY TOGGLE */}
                      <motion.div variants={FORM_ITEM_VARIANTS}>
                        <label
                          htmlFor="kudos-anon"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 12,
                            cursor: 'pointer',
                            userSelect: 'none',
                            alignSelf: 'flex-start',
                          }}
                        >
                          {/* Animated toggle track */}
                          <div
                            style={{
                              width: 44,
                              height: 24,
                              borderRadius: 12,
                              background: isAnonymous
                                ? 'linear-gradient(135deg, var(--vibe-accent), var(--vibe-accent-secondary))'
                                : 'rgba(255,255,255,0.1)',
                              position: 'relative',
                              transition: 'background 0.25s ease',
                              flexShrink: 0,
                              boxShadow: isAnonymous ? '0 0 10px var(--vibe-accent-glow)' : 'none',
                            }}
                          >
                            {/* Knob */}
                            <motion.div
                              animate={{ x: isAnonymous ? 22 : 2 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              style={{
                                position: 'absolute',
                                top: 2,
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                background: '#fff',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                              }}
                            />
                          </div>
                          <input
                            type="checkbox"
                            id="kudos-anon"
                            checked={isAnonymous}
                            onChange={() => setIsAnonymous(v => !v)}
                            style={{ display: 'none' }}
                          />
                          <span
                            style={{
                              fontSize: '0.95rem',
                              color: '#D1D5DB',
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            {isAnonymous ? <EyeOff size={15} style={{ color: 'var(--vibe-accent)' }} /> : <Eye size={15} style={{ color: 'rgba(255,255,255,0.4)' }} />}
                            <span>{isAnonymous ? 'Sending anonymously' : 'Visible sender'}</span>
                          </span>
                        </label>
                      </motion.div>

                      {/* KUDOS LIFESPAN PICKER */}
                      <motion.div variants={FORM_ITEM_VARIANTS}>
                        <label className="kudos-section-label">
                          Kudos Lifespan
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginTop: 2 }}>
                          {[
                            { label: 'Keep Forever', value: 0, icon: <InfinityIcon size={14} /> },
                            { label: '1 Hour', value: 60, icon: <Clock size={14} /> },
                            { label: '24 Hours', value: 1440, icon: <Calendar size={14} /> },
                            { label: '3 Days', value: 4320, icon: <Hourglass size={14} /> },
                          ].map(opt => {
                            const selected = duration === opt.value;
                            return (
                              <motion.button
                                key={opt.value}
                                type="button"
                                onClick={() => setDuration(opt.value)}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                  padding: '10px 14px',
                                  borderRadius: 10,
                                  border: selected
                                    ? '1.5px solid var(--vibe-accent)'
                                    : '1px solid rgba(255,255,255,0.06)',
                                  background: selected
                                    ? 'var(--vibe-accent-glow)'
                                    : 'rgba(255,255,255,0.03)',
                                  color: selected ? 'var(--vibe-accent)' : 'rgba(255, 255, 255, 0.65)',
                                  fontSize: '0.85rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                  boxShadow: selected ? '0 4px 12px var(--vibe-accent-glow)' : 'none',
                                  WebkitFontSmoothing: 'antialiased',
                                }}
                                onMouseEnter={e => {
                                  if (!selected) {
                                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
                                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.15)';
                                    (e.currentTarget as HTMLButtonElement).style.color = '#FFFFFF';
                                  }
                                }}
                                onMouseLeave={e => {
                                  if (!selected) {
                                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
                                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.06)';
                                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255, 255, 255, 0.65)';
                                  }
                                }}
                              >
                                {opt.icon}
                                <span>{opt.label}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>

                      {/* Gradient divider */}
                      <motion.div
                        variants={FORM_ITEM_VARIANTS}
                        style={{
                          height: 1,
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                        }}
                      />

                      {/* SEND KUDOS BUTTON */}
                      <motion.button
                        variants={FORM_ITEM_VARIANTS}
                        type="submit"
                        disabled={!isValid || isSubmitting || isVibing}
                        whileTap={isValid ? { scale: 0.98 } : {}}
                        onHoverStart={() => setArrowHovered(true)}
                        onHoverEnd={() => setArrowHovered(false)}
                        className={isValid ? 'btn-submit-premium' : ''}
                        style={{
                          width: '100%',
                          padding: '16px 24px',
                          borderRadius: 14,
                          border: 'none',
                          background: isValid
                            ? 'linear-gradient(135deg, var(--vibe-accent) 0%, var(--vibe-accent-secondary) 100%)'
                            : 'rgba(255,255,255,0.08)',
                          color: isValid ? '#0B0B0F' : '#6B7280',
                          fontSize: '1.05rem',
                          fontWeight: 700,
                          cursor: isValid && !isSubmitting ? 'pointer' : 'not-allowed',
                          opacity: isValid ? 1 : 0.5,
                          boxShadow: isValid ? '0 4px 20px var(--vibe-accent-glow)' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          letterSpacing: '0.01em',
                          transition: 'filter 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
                          ...(isValid && !isSubmitting
                            ? {
                                filter: arrowHovered ? 'brightness(1.08)' : 'brightness(1)',
                                transform: arrowHovered ? 'translateY(-2px)' : 'translateY(0px)',
                                boxShadow: arrowHovered
                                  ? '0 6px 28px var(--vibe-accent-shadow)'
                                  : '0 4px 20px var(--vibe-accent-glow)',
                              }
                            : {}),
                        }}
                      >
                        {isSubmitting || isVibing || isAnalyzingSentiment ? (
                          <>
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                              style={{ display: 'inline-block', fontSize: '1rem' }}
                            >
                              ✦
                            </motion.span>
                            {isAnalyzingSentiment ? 'Analyzing...' : isVibing ? '✨ Checking vibes…' : 'Sending…'}
                          </>
                        ) : (
                          <>
                            <span>Send Kudos</span>
                            <motion.span
                              animate={{ x: arrowHovered && isValid ? 4 : 0 }}
                              transition={{ duration: 0.2, ease: 'easeOut' }}
                              style={{ display: 'flex', alignItems: 'center' }}
                            >
                              <Send size={15} />
                            </motion.span>
                          </>
                        )}
                      </motion.button>
                    </motion.form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Toast Notification */}
              <AnimatePresence>
                {toastMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      position: 'absolute',
                      bottom: 24,
                      left: 24,
                      right: 24,
                      background: 'rgba(239, 68, 68, 0.95)',
                      color: '#ffffff',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      textAlign: 'center',
                      zIndex: 999,
                      pointerEvents: 'none',
                    }}
                  >
                    {toastMessage}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
