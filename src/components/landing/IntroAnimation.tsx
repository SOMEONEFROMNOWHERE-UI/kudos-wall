'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroAnimationProps {
  onComplete: () => void;
}

export default function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [phase, setPhase] = useState<'spark' | 'beam' | 'reveal' | 'exit'>('spark');

  useEffect(() => {
    // Cinematic timeline
    // 0s - 0.8s: Spark appears and pulses
    // 0.8s - 1.5s: Beam expands horizontally
    // 1.5s - 2.8s: Text reveals and glows
    // 2.8s: Exit
    const t1 = setTimeout(() => setPhase('beam'), 800);
    const t2 = setTimeout(() => setPhase('reveal'), 1500);
    const t3 = setTimeout(() => {
      setPhase('exit');
      setTimeout(() => onComplete(), 800); // 800ms for exit animation
    }, 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== 'exit' && (
        <motion.div
          exit={{ opacity: 0, filter: 'blur(10px)', transition: { duration: 0.8, ease: 'easeInOut' } }}
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#050510',
            zIndex: 9999,
            overflow: 'hidden',
          }}
        >
          {/* Subtle background glow that reacts to the phase */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: phase === 'reveal' ? 0.4 : phase === 'beam' ? 0.2 : 0,
              scale: phase === 'reveal' ? 1.5 : 1
            }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: '50vw',
              height: '50vw',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(232, 184, 75, 0.15) 0%, rgba(168, 85, 247, 0.05) 50%, transparent 70%)',
              filter: 'blur(40px)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            
            {/* The Spark & Beam Layer */}
            <motion.div
              initial={{ width: '0px', height: '2px', opacity: 0 }}
              animate={
                phase === 'spark' 
                  ? { width: '8px', height: '8px', borderRadius: '4px', opacity: 1, boxShadow: '0 0 20px 5px #fb923c' }
                  : phase === 'beam' || phase === 'reveal'
                  ? { width: '300px', height: '2px', borderRadius: '1px', opacity: phase === 'reveal' ? 0 : 1, boxShadow: '0 0 40px 10px #fb923c' }
                  : {}
              }
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute',
                background: '#fff',
                zIndex: 2,
              }}
            />

            {/* The Text Reveal Layer */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={
                phase === 'reveal' 
                  ? { opacity: 1, scale: 1, y: 0 }
                  : { opacity: 0, scale: 0.9, y: 10 }
              }
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 3,
              }}
            >
              <div
                style={{
                  fontSize: '2.5rem',
                  lineHeight: 1,
                  marginBottom: '1rem',
                  color: '#e8b84b',
                  textShadow: '0 0 40px rgba(232,184,75,0.8)',
                }}
              >
                ✦
              </div>
              <h1
                style={{
                  fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  color: '#fff',
                  margin: 0,
                  textAlign: 'center',
                  background: 'linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0.6) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Glow Up Wall
              </h1>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
