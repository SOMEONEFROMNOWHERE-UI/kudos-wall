'use client';

import { motion } from 'framer-motion';

export default function CTASection() {
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Attempt to focus the Google button for quick sign in
    setTimeout(() => {
      document.getElementById('google-signin-btn')?.focus();
    }, 800);
  };

  return (
    <section
      style={{
        position: 'relative',
        padding: 'var(--space-12) var(--space-4)',
        textAlign: 'center',
        overflow: 'hidden',
      }}
    >
      <div className="aurora-bg" style={{ height: '100%', top: 'auto', bottom: 0, transform: 'rotate(180deg)', opacity: 0.8 }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto' }}
      >
        <h2
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            marginBottom: 'var(--space-4)',
          }}
        >
          Ready to make your team <span style={{ color: 'var(--accent)', textShadow: '0 0 20px rgba(245,166,35,0.4)' }}>glow?</span>
        </h2>
        
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-8)' }}>
          Join thousands of teams spreading positivity every day.
        </p>

        <motion.button
          onClick={handleScrollToTop}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            boxShadow: [
              '0 0 0px rgba(245,166,35,0)',
              '0 0 20px rgba(245,166,35,0.5)',
              '0 0 0px rgba(245,166,35,0)'
            ]
          }}
          transition={{
            boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
          }}
          style={{
            background: 'var(--text-primary)',
            color: 'var(--surface-base)',
            border: 'none',
            padding: '16px 32px',
            borderRadius: '999px',
            fontSize: '1.2rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          Start Glowing — It's Free <span style={{ fontSize: '1.4rem' }}>✨</span>
        </motion.button>

        <p style={{ marginTop: 'var(--space-4)', fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>
          No credit card needed • Takes 30 seconds
        </p>
      </motion.div>
    </section>
  );
}
