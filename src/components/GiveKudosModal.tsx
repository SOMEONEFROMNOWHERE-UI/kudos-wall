'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
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
  const receiverRef = useRef<HTMLInputElement>(null);

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
      setTimeout(() => receiverRef.current?.focus(), 150);
    }
  }, [isOpen, prefillReceiver, prefillMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiver.trim() || !message.trim() || !category || !currentUser || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addKudos({
        sender: currentUser.name,
        receiver: receiver.trim(),
        message: message.trim(),
        category,
        isAnonymous,
        duration,
      });
      setStep('success');
      setTimeout(() => onClose(), 1800);
    } catch {
      setIsSubmitting(false);
    }
  };

  const isValid = receiver.trim() && message.trim() && category;
  const themeVariables = (category && VIBE_THEME_VARIABLES[category]) || DEFAULT_THEME_VARIABLES;

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 10,
    WebkitFontSmoothing: 'antialiased',
  };


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
              <div className="modal-glow-border" />
              <div className="modal-inner">
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
                        style={{ height: '100%', background: 'linear-gradient(90deg, #FB923C, #F59E0B)', borderRadius: 2 }}
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
                    <form
                      onSubmit={handleSubmit}
                      style={{
                        padding: '28px 28px 28px 28px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 28,
                      }}
                    >
                      {/* WHO SHINES TODAY */}
                      <div>
                        <label htmlFor="kudos-receiver" style={labelStyle}>
                          Who Shines Today?
                        </label>
                        <input
                          ref={receiverRef}
                          id="kudos-receiver"
                          type="text"
                          className="kudos-modal-input"
                          value={receiver}
                          onChange={e => setReceiver(e.target.value)}
                          placeholder="Their name…"
                          maxLength={50}
                          required
                        />
                      </div>

                      {/* VIBE CHECK PILLS */}
                      <div>
                        <div style={labelStyle}>Vibe Check</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                          {CATEGORIES.map(cat => {
                            const selected = category === cat.icon;
                            const accentColor = PILL_ACCENT_COLORS[cat.icon];
                            const isJustSelected = lastSelected === cat.icon;

                            return (
                              <motion.button
                                key={cat.icon}
                                type="button"
                                onClick={() => {
                                  setCategory(cat.icon);
                                  setLastSelected(cat.icon);
                                  setTimeout(() => setLastSelected(null), 400);
                                }}
                                whileTap={{ scale: 0.93 }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  padding: '10px 18px',
                                  borderRadius: 9999,
                                  border: selected
                                    ? `1.5px solid ${accentColor}`
                                    : '1px solid rgba(255,255,255,0.08)',
                                  background: selected
                                    ? `linear-gradient(135deg, ${accentColor}33, ${accentColor}22)`
                                    : 'rgba(255,255,255,0.04)',
                                  color: selected ? '#FED7AA' : '#E5E7EB',
                                  fontSize: '0.9rem',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  boxShadow: selected ? `0 0 16px ${accentColor}40` : 'none',
                                  WebkitFontSmoothing: 'antialiased',
                                }}
                                onMouseEnter={e => {
                                  if (!selected) {
                                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
                                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.16)';
                                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                                  }
                                }}
                                onMouseLeave={e => {
                                  if (!selected) {
                                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)';
                                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0px)';
                                  }
                                }}
                              >
                                <motion.span
                                  animate={isJustSelected ? { scale: [1, 1.3, 1] } : {}}
                                  transition={{ duration: 0.3, ease: 'easeOut' }}
                                  style={{
                                    fontSize: '1rem',
                                    lineHeight: 1,
                                    filter: selected ? `drop-shadow(${EMOJI_GLOWS[cat.icon]})` : 'none',
                                    display: 'inline-block',
                                  }}
                                >
                                  {cat.icon}
                                </motion.span>
                                <span>{cat.label}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      {/* YOUR WORDS TEXTAREA */}
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                            marginBottom: 10,
                          }}
                        >
                          <label htmlFor="kudos-message" style={{ ...labelStyle, marginBottom: 0 }}>
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
                        <textarea
                          id="kudos-message"
                          className="kudos-modal-input"
                          value={message}
                          onChange={e => setMessage(e.target.value)}
                          placeholder="Be specific — what exactly did they do that made a difference?"
                          rows={4}
                          maxLength={2000}
                          required
                        />
                      </div>

                      {/* SEND ANONYMOUSLY TOGGLE */}
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
                            fontWeight: 400,
                          }}
                        >
                          Send anonymously{' '}
                          <span style={{ fontSize: 20, verticalAlign: 'middle', lineHeight: 1 }}>🥷</span>
                        </span>
                      </label>

                      {/* KUDOS LIFESPAN PICKER */}
                      <div>
                        <label style={labelStyle}>
                          Kudos Lifespan
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 2 }}>
                          {[
                            { label: 'Keep Forever', value: 0, icon: '♾️' },
                            { label: '1 Hour', value: 60, icon: '🕐' },
                            { label: '24 Hours', value: 1440, icon: '📅' },
                            { label: '3 Days', value: 4320, icon: '⏳' },
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
                                  gap: 6,
                                  padding: '8px 14px',
                                  borderRadius: 999,
                                  border: selected
                                    ? '1.5px solid var(--vibe-accent)'
                                    : '1px solid rgba(255,255,255,0.08)',
                                  background: selected
                                    ? 'var(--vibe-accent-glow)'
                                    : 'rgba(255,255,255,0.04)',
                                  color: selected ? 'var(--vibe-accent)' : '#9CA3AF',
                                  fontSize: '0.85rem',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  boxShadow: selected ? '0 0 12px var(--vibe-accent-glow)' : 'none',
                                  WebkitFontSmoothing: 'antialiased',
                                }}
                                onMouseEnter={e => {
                                  if (!selected) {
                                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
                                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.16)';
                                  }
                                }}
                                onMouseLeave={e => {
                                  if (!selected) {
                                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)';
                                  }
                                }}
                              >
                                <span>{opt.icon}</span>
                                <span>{opt.label}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Gradient divider */}
                      <div
                        style={{
                          height: 1,
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                        }}
                      />

                      {/* SEND KUDOS BUTTON */}
                      <motion.button
                        type="submit"
                        disabled={!isValid || isSubmitting}
                        whileTap={isValid ? { scale: 0.98 } : {}}
                        onHoverStart={() => setArrowHovered(true)}
                        onHoverEnd={() => setArrowHovered(false)}
                        style={{
                          width: '100%',
                          padding: '16px 24px',
                          borderRadius: 14,
                          border: 'none',
                          background: isValid
                            ? 'linear-gradient(135deg, var(--vibe-accent) 0%, var(--vibe-accent-secondary) 100%)'
                            : 'rgba(255,255,255,0.08)',
                          color: isValid ? '#1A1208' : '#6B7280',
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
                        {isSubmitting ? (
                          <>
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                              style={{ display: 'inline-block', fontSize: '1rem' }}
                            >
                              ✦
                            </motion.span>
                            Sending…
                          </>
                        ) : (
                          <>
                            Send Kudos
                            <motion.span
                              animate={{ x: arrowHovered && isValid ? 4 : 0 }}
                              transition={{ duration: 0.2, ease: 'easeOut' }}
                              style={{ display: 'inline-block' }}
                            >
                              →
                            </motion.span>
                          </>
                        )}
                      </motion.button>
                    </form>
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
