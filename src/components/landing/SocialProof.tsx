'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

function Counter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (inView) {
      let start = 0;
      const duration = 2000;
      const increment = end / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [inView, end]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

const stats = [
  { num: 12000, suffix: '+', label: 'Kudos Sent' },
  { num: 98, suffix: '%', label: 'Feel More Motivated' },
  { num: 500, suffix: '+', label: 'Teams Glowing' },
];

const testimonials = [
  {
    quote: "It completely changed how our remote team interacts. We actually feel connected now.",
    author: "Sarah Jenkins",
    role: "VP of Engineering, TechFlow",
  },
  {
    quote: "The best tool we've added to our stack this year. It's so fast and people actually use it.",
    author: "Marcus Brown",
    role: "Product Manager, InnovateInc",
  },
  {
    quote: "Our eNPS score jumped 15 points within two months of using Glow Up Wall.",
    author: "Elena Rodriguez",
    role: "Head of People, Starlight",
  },
];

export default function SocialProof() {
  return (
    <section style={{ position: 'relative', padding: 'var(--space-10) 0' }}>
      {/* Subtle gold gradient strip */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: '200px',
          background: 'linear-gradient(90deg, transparent, rgba(245,166,35,0.05), transparent)',
          transform: 'translateY(-50%)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 var(--space-4)', position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--space-6)',
            textAlign: 'center',
            marginBottom: 'var(--space-10)',
          }}
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div
                style={{
                  fontSize: 'clamp(3rem, 5vw, 4rem)',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  fontVariantNumeric: 'tabular-nums',
                  textShadow: '0 0 20px rgba(245,166,35,0.2)',
                }}
              >
                <Counter end={stat.num} suffix={stat.suffix} />
              </div>
              <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="landing-glass-card"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontSize: '2rem', color: 'var(--accent)', marginBottom: 'var(--space-3)' }}>"</div>
              <p style={{ fontSize: '1.1rem', lineHeight: 1.6, color: 'var(--text-primary)', marginBottom: 'var(--space-4)', fontStyle: 'italic' }}>
                {t.quote}
              </p>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.author}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
