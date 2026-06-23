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

export default function GiveKudosModal({ isOpen, onClose, prefillReceiver = '', prefillMessage = '' }: GiveKudosModalProps) {
  const { currentUser, addKudos } = useKudos();
  const [receiver, setReceiver] = useState(prefillReceiver);
  const [message, setMessage] = useState(prefillMessage);
  const [category, setCategory] = useState<KudosCategory | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<ModalStep>('form');
  const receiverRef = useRef<HTMLInputElement>(null);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setReceiver(prefillReceiver);
      setMessage(prefillMessage);
      setCategory(null);
      setIsAnonymous(false);
      setStep('form');
      setIsSubmitting(false);
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
      });
      setStep('success');
      // Auto-close after success moment
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch {
      setIsSubmitting(false);
    }
  };

  const isValid = receiver.trim() && message.trim() && category;

  const CATEGORY_COLORS: Record<string, string> = {
    '🔥': 'var(--cat-fire)',
    '💎': 'var(--cat-gem)',
    '🚀': 'var(--cat-rocket)',
    '🧠': 'var(--cat-brain)',
    '🫂': 'var(--cat-heart)',
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
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          />

          {/* ── Modal Centering Wrapper ── */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 'var(--z-modal)' as unknown as number,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              padding: 'var(--space-4)',
            }}
          >
            {/* ── Modal ── */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 32, scale: 0.97 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="surface-overlay"
              style={{
                width: '100%',
                maxWidth: 500,
                maxHeight: '92dvh',
                overflowY: 'auto',
                overflowX: 'hidden',
                pointerEvents: 'auto',
              }}
            >
            <AnimatePresence mode="wait">
              {step === 'success' ? (
                /* ── Success State ── */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  style={{
                    padding: 'var(--space-6) var(--space-5)',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
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
                    className="text-title"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Kudos launched! ✨
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-body"
                  >
                    {receiver} just got a reason to smile.
                  </motion.p>
                  {/* Progress bar for auto-close */}
                  <motion.div
                    style={{
                      width: '80px',
                      height: 2,
                      background: 'var(--surface-border)',
                      borderRadius: 2,
                      overflow: 'hidden',
                      marginTop: 'var(--space-2)',
                    }}
                  >
                    <motion.div
                      initial={{ scaleX: 1, originX: 0 }}
                      animate={{ scaleX: 0 }}
                      transition={{ duration: 1.8, ease: 'linear' }}
                      style={{ height: '100%', background: 'var(--accent)', borderRadius: 2 }}
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
                  {/* Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '32px 32px 24px 32px',
                      borderBottom: '1px solid var(--surface-border)',
                    }}
                  >
                    <div>
                      <h2 className="text-title" style={{ color: 'var(--text-primary)', lineHeight: 1.2 }}>
                        Craft a Kudos
                      </h2>
                      <p style={{ fontSize: 'var(--text-label)', color: 'var(--text-tertiary)', marginTop: 6 }}>
                        Make it genuine — they&apos;ll keep it forever
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="btn-icon"
                      aria-label="Close"
                      style={{ marginTop: -4, marginRight: -8 }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Form Body */}
                  <form
                    onSubmit={handleSubmit}
                    style={{
                      margin: 0,
                      padding: '24px 32px 32px 32px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '24px',
                    }}
                  >
                    {/* Who shines? */}
                    <div>
                      <label
                        htmlFor="kudos-receiver"
                        style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-label)', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}
                      >
                        Who shines today?
                      </label>
                      <input
                        ref={receiverRef}
                        id="kudos-receiver"
                        type="text"
                        value={receiver}
                        onChange={e => setReceiver(e.target.value)}
                        placeholder="Their name…"
                        className="input-field"
                        maxLength={50}
                        required
                      />
                    </div>

                    {/* Category — Vibe Check */}
                    <div>
                      <div style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--text-label)', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Vibe check
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                        {CATEGORIES.map(cat => {
                          const selected = category === cat.icon;
                          const catColor = CATEGORY_COLORS[cat.icon];
                          return (
                            <motion.button
                              key={cat.icon}
                              type="button"
                              onClick={() => setCategory(cat.icon)}
                              whileTap={{ scale: 0.93 }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-1)',
                                padding: '7px 14px',
                                borderRadius: 9999,
                                border: selected ? `1.5px solid ${catColor}` : '1px solid var(--surface-border)',
                                background: selected ? `${catColor}15` : 'transparent',
                                color: selected ? catColor : 'var(--text-tertiary)',
                                fontSize: 'var(--text-body)',
                                fontWeight: selected ? 600 : 400,
                                cursor: 'pointer',
                                transition: 'all 160ms var(--ease-smooth)',
                                minHeight: 38,
                              }}
                            >
                              <span style={{ fontSize: '1rem' }}>{cat.icon}</span>
                              <span>{cat.label}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', alignItems: 'baseline' }}>
                        <label
                          htmlFor="kudos-message"
                          style={{ fontSize: 'var(--text-label)', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}
                        >
                          Your words
                        </label>
                        <span
                          style={{
                            fontSize: 'var(--text-label)',
                            color: message.length > 1800 ? '#E07070' : 'var(--text-tertiary)',
                          }}
                        >
                          {message.length}/2000
                        </span>
                      </div>
                      <textarea
                        id="kudos-message"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Be specific — what exactly did they do that made a difference?"
                        className="input-field"
                        rows={4}
                        maxLength={2000}
                        required
                        style={{ resize: 'none' }}
                      />
                    </div>

                    {/* Anonymous toggle */}
                    <label
                      htmlFor="kudos-anon"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', userSelect: 'none', alignSelf: 'flex-start' }}
                    >
                      {/* Custom toggle */}
                      <div
                        style={{
                          width: 40,
                          height: 22,
                          borderRadius: 11,
                          background: isAnonymous ? 'var(--accent-muted)' : 'var(--surface-border)',
                          border: `1px solid ${isAnonymous ? 'var(--accent-border)' : 'var(--surface-border)'}`,
                          position: 'relative',
                          transition: 'all 200ms',
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            top: 2,
                            left: isAnonymous ? 20 : 2,
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            background: isAnonymous ? 'var(--accent)' : 'var(--text-tertiary)',
                            transition: 'left 250ms cubic-bezier(0.16, 1, 0.3, 1), background 250ms',
                          }}
                        />
                      </div>
                      <input type="checkbox" id="kudos-anon" checked={isAnonymous} onChange={() => setIsAnonymous(v => !v)} style={{ display: 'none' }} />
                      <span style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
                        Send anonymously <span style={{ opacity: 0.6 }}>🥷</span>
                      </span>
                    </label>

                    {/* Divider */}
                    <div style={{ height: 1, background: 'var(--surface-border)', opacity: 0.5 }} />

                    {/* Submit — THE ONE accent element in this modal */}
                    <motion.button
                      type="submit"
                      className="btn-primary"
                      disabled={!isValid || isSubmitting}
                      whileTap={isValid ? { scale: 0.97 } : {}}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      style={{ width: '100%', fontSize: 'var(--text-body)', padding: '13px', letterSpacing: '0.01em' }}
                    >
                      {isSubmitting ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            style={{ display: 'inline-block', fontSize: '1rem' }}
                          >
                            ✦
                          </motion.span>
                          Sending…
                        </span>
                      ) : (
                        'Send Kudos →'
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
        </>
      )}
    </AnimatePresence>
  );
}
