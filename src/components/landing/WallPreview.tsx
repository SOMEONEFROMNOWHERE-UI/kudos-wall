'use client';

import { motion } from 'framer-motion';

const mockKudos = [
  {
    sender: 'Alex M.',
    receiver: 'Sarah J.',
    vibe: '🔥 On Fire',
    color: 'var(--cat-fire)',
    msg: 'Absolutely crushed the Q3 presentation today! The design team is lucky to have you.',
    reactions: '👏 x4',
    delay: 0,
  },
  {
    sender: 'David K.',
    receiver: 'Elena R.',
    vibe: '💎 Hidden Gem',
    color: 'var(--cat-gem)',
    msg: 'Thanks for staying late to help me debug that nasty race condition. You saved the release!',
    reactions: '🙌 x2',
    delay: 1.5,
  },
  {
    sender: 'Jessica T.',
    receiver: 'Marcus B.',
    vibe: '🚀 Rocket Energy',
    color: 'var(--cat-rocket)',
    msg: 'Your onboarding documentation is a lifesaver. So much clearer now!',
    reactions: '🔥 x7',
    delay: 0.5,
  },
  {
    sender: 'Anonymous',
    receiver: 'The Support Team',
    vibe: '✨ Pure Magic',
    color: 'var(--cat-magic)',
    msg: 'Handling that 3-hour outage with a smile and perfect communication. Yall are amazing.',
    reactions: '💖 x12',
    delay: 2,
  },
  {
    sender: 'Sam L.',
    receiver: 'Alex M.',
    vibe: '🧠 Galaxy Brain',
    color: 'var(--cat-brain)',
    msg: 'That database optimization query is insane. Load times dropped by 40%!',
    reactions: '🤯 x3',
    delay: 1,
  },
  {
    sender: 'Elena R.',
    receiver: 'Sarah J.',
    vibe: '🏆 MVP',
    color: 'var(--cat-fire)',
    msg: 'Consistently delivering top-tier UI components. The new dashboard looks flawless.',
    reactions: '🎉 x5',
    delay: 2.5,
  },
];

export default function WallPreview() {
  return (
    <section
      style={{
        padding: 'var(--space-10) var(--space-4)',
        maxWidth: 1200,
        margin: '0 auto',
        position: 'relative',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <h2 style={{ fontSize: 'clamp(2rem, 3vw, 3rem)', fontWeight: 800, margin: 0 }}>
          See the Wall <span style={{ color: 'var(--accent)' }}>Come Alive</span>
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              backgroundColor: 'var(--accent)',
              borderRadius: '50%',
              marginLeft: '12px',
              boxShadow: '0 0 10px var(--accent)',
            }}
          />
        </h2>
      </div>

      <div
        style={{
          columnCount: 3,
          columnGap: 'var(--space-4)',
        }}
        className="masonry-grid"
      >
        {mockKudos.map((kudo, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            style={{
              breakInside: 'avoid',
              marginBottom: 'var(--space-4)',
              display: 'inline-block',
              width: '100%',
            }}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: kudo.delay,
              }}
              className="landing-glass-card"
              style={{ padding: 'var(--space-5)', borderTop: `2px solid ${kudo.color}` }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--space-3)',
                }}
              >
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'var(--surface-overlay)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.8rem',
                    }}
                  >
                    {kudo.sender[0]}
                  </div>
                  <div style={{ fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>From </span>
                    <span style={{ fontWeight: 600 }}>{kudo.sender}</span>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    color: kudo.color,
                  }}
                >
                  {kudo.vibe}
                </div>
              </div>

              <div style={{ marginBottom: 'var(--space-2)', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>To </span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{kudo.receiver}</span>
              </div>

              <p style={{ lineHeight: 1.5, marginBottom: 'var(--space-4)' }}>{kudo.msg}</p>

              <div
                style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  background: 'var(--surface-overlay)',
                  fontSize: '0.8rem',
                  border: '1px solid var(--surface-border)',
                }}
              >
                {kudo.reactions}
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .masonry-grid { column-count: 2 !important; }
        }
        @media (max-width: 600px) {
          .masonry-grid { column-count: 1 !important; }
        }
      `}</style>
    </section>
  );
}
