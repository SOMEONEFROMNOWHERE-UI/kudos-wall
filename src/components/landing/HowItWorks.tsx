'use client';

import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

const steps = [
  {
    num: '01',
    title: 'Give a Kudos',
    desc: 'Write appreciation and pick a vibe tag to set the mood.',
    icon: '✍️',
  },
  {
    num: '02',
    title: 'Watch It Land',
    desc: 'Your card flies onto the wall in real-time for everyone to see.',
    icon: '🚀',
  },
  {
    num: '03',
    title: 'Spread the Glow',
    desc: 'The team reacts, the wall gets brighter, and morale soars.',
    icon: '✨',
  },
];

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export default function HowItWorks() {
  return (
    <section
      style={{
        position: 'relative',
        padding: 'var(--space-10) var(--space-4)',
        maxWidth: 1200,
        margin: '0 auto',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}
      >
        <h2 style={{ fontSize: 'clamp(2rem, 3vw, 3rem)', fontWeight: 800, margin: 0 }}>
          How it <span style={{ color: 'var(--accent)' }}>Works</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginTop: 'var(--space-3)' }}>
          Three simple steps to build a culture of recognition.
        </p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-6)',
          position: 'relative',
        }}
      >
        {/* Animated Dashed Line connecting cards (Desktop only) */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: '15%',
            right: '15%',
            height: 2,
            zIndex: 0,
            display: 'none', // Hidden by default, shown via media query if needed
          }}
          className="dashed-path-container"
        >
          <svg width="100%" height="100%" preserveAspectRatio="none">
            <line
              x1="0"
              y1="0"
              x2="100%"
              y2="0"
              stroke="rgba(245,166,35,0.3)"
              strokeWidth="2"
              strokeDasharray="8"
              className="dashed-path"
            />
          </svg>
        </div>

        {steps.map((step) => (
          <motion.div key={step.num} variants={cardVariants} className="landing-glass-card">
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: 'rgba(245,166,35,0.1)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: 'var(--space-4)',
                border: '1px solid rgba(245,166,35,0.2)',
              }}
            >
              {step.num}
            </div>
            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>{step.icon}</div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 var(--space-2) 0' }}>
              {step.title}
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {step.desc}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick style for hiding the dashed line on mobile */}
      <style>{`
        @media (min-width: 900px) {
          .dashed-path-container { display: block !important; }
        }
      `}</style>
    </section>
  );
}
