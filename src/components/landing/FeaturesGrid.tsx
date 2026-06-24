'use client';

import { motion } from 'framer-motion';

const features = [
  {
    title: 'Real-time Recognition',
    desc: 'Instant delivery, no delay. Celebrate wins exactly when they happen.',
    icon: '⚡',
    colSpan: 2, // Spans 2 columns
    bg: 'rgba(245, 166, 35, 0.05)',
    border: 'rgba(245, 166, 35, 0.2)',
  },
  {
    title: 'Vibe Tags',
    desc: 'Express with personality, not just words.',
    icon: '🔥',
    colSpan: 1,
    bg: 'rgba(123, 94, 167, 0.05)',
    border: 'rgba(123, 94, 167, 0.2)',
  },
  {
    title: 'Kudos Jar',
    desc: 'Save your best moments privately.',
    icon: '🏺',
    colSpan: 1,
    bg: 'rgba(3, 179, 195, 0.05)',
    border: 'rgba(3, 179, 195, 0.2)',
  },
  {
    title: 'Weekly Spotlight',
    desc: 'Auto-celebrate the top glow-getter.',
    icon: '🌟',
    colSpan: 1,
    bg: 'rgba(245, 166, 35, 0.05)',
    border: 'rgba(245, 166, 35, 0.2)',
  },
  {
    title: 'Anonymous Mode',
    desc: 'Send love without revealing yourself.',
    icon: '🕵️',
    colSpan: 1,
    bg: 'rgba(123, 94, 167, 0.05)',
    border: 'rgba(123, 94, 167, 0.2)',
  },
  {
    title: 'AI Insights',
    desc: 'Understand your team’s energy trends.',
    icon: '🧠',
    colSpan: 1,
    bg: 'rgba(3, 179, 195, 0.05)',
    border: 'rgba(3, 179, 195, 0.2)',
  },
];

export default function FeaturesGrid() {
  return (
    <section
      style={{
        padding: 'var(--space-10) var(--space-4)',
        maxWidth: 1200,
        margin: '0 auto',
        position: 'relative',
      }}
    >
      <div className="aurora-bg" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}
      >
        <h2 style={{ fontSize: 'clamp(2rem, 3vw, 3rem)', fontWeight: 800, margin: 0 }}>
          Everything you need to <span style={{ color: 'var(--cat-gem)' }}>glow.</span>
        </h2>
      </motion.div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--space-4)',
        }}
        className="bento-grid"
      >
        {features.map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="landing-glass-card"
            style={{
              background: feature.bg,
              borderColor: feature.border,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              // Use gridColumn only if the viewport is wide enough, handled by media query below
            }}
            data-colspan={feature.colSpan}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>{feature.icon}</div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 var(--space-2) 0' }}>
              {feature.title}
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {feature.desc}
            </p>
          </motion.div>
        ))}
      </div>

      <style>{`
        @media (min-width: 768px) {
          .bento-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .landing-glass-card[data-colspan="2"] {
            grid-column: span 2;
          }
        }
      `}</style>
    </section>
  );
}
