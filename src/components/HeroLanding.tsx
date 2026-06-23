'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useKudos } from '@/context/KudosContext';

const Hyperspeed = dynamic(() => import('@/components/Hyperspeed/Hyperspeed'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%', background: 'var(--surface-base)' }} />,
});

const affirmations = [
  'You are making a difference today',
  'Your energy is contagious',
  'Recognition is a superpower',
  'Great things happen with great teams',
  'Someone is waiting to hear from you',
  'One kind word can change everything',
];

export default function HeroLanding() {
  const [step, setStep] = useState<'affirmation' | 'login'>('affirmation');
  const [affirmation] = useState(() => affirmations[Math.floor(Math.random() * affirmations.length)]);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { login, currentUser } = useKudos();
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => setStep('login'), 2600);
    return () => clearTimeout(t);
  }, []);

  // Auto redirect if already logged in via Session
  useEffect(() => {
    if (currentUser?.name && !isSubmitting) {
      router.replace('/feed');
    }
  }, [currentUser, router, isSubmitting]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: 'var(--surface-base)',
      }}
    >
      {/* Hyperspeed WebGL background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.65 }}>
        <Hyperspeed
          effectOptions={{
            onSpeedUp: () => {},
            onSlowDown: () => {},
            distortion: 'turbulentDistortion',
            length: 400,
            roadWidth: 10,
            islandWidth: 2,
            lanesPerRoad: 3,
            fov: 90,
            fovSpeedUp: 150,
            speedUp: 2,
            carLightsFade: 0.4,
            totalSideLightSticks: 20,
            lightPairsPerRoadWay: 40,
            shoulderLinesWidthPercentage: 0.05,
            brokenLinesWidthPercentage: 0.1,
            brokenLinesLengthPercentage: 0.5,
            lightStickWidth: [0.12, 0.5],
            lightStickHeight: [1.3, 1.7],
            movingAwaySpeed: [60, 80],
            movingCloserSpeed: [-120, -160],
            carLightsLength: [400 * 0.03, 400 * 0.2],
            carLightsRadius: [0.05, 0.14],
            carWidthPercentage: [0.3, 0.5],
            carShiftX: [-0.8, 0.8],
            carFloorSeparation: [0, 5],
            colors: {
              roadColor: 0x0d0d12,
              islandColor: 0x0b0b0f,
              background: 0x000000,
              shoulderLines: 0x1a1a22,
              brokenLines: 0x1a1a22,
              leftCars: [0xd856bf, 0x6750a2, 0xc247ac],
              rightCars: [0x03b3c3, 0x0e5ea5, 0x324555],
              sticks: 0xe8b84b,  // accent color, not saturated yellow
            },
          }}
        />
      </div>

      {/* Vignette overlay */}
      <div
        style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'radial-gradient(ellipse at 50% 55%, rgba(11,11,15,0.15) 0%, rgba(11,11,15,0.88) 65%)',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 440, padding: '0 var(--space-4)' }}>
        <AnimatePresence mode="wait">
          {step === 'affirmation' ? (
            <motion.div
              key="affirmation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{ textAlign: 'center' }}
            >
              <h1
                style={{
                  color: 'var(--accent)',
                  fontSize: 'clamp(1.6rem, 5vw, var(--text-display))',
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                {affirmation}
              </h1>
            </motion.div>
          ) : (
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className="surface-overlay"
                style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
              >
                {/* Header */}
                <div style={{ textAlign: 'center' }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.15, type: 'spring', stiffness: 250, damping: 16 }}
                    style={{ fontSize: '2rem', lineHeight: 1, marginBottom: 'var(--space-3)' }}
                  >
                    ✦
                  </motion.div>
                  <h2
                    style={{
                      fontSize: 'var(--text-title)',
                      fontWeight: 700,
                      letterSpacing: '-0.03em',
                      color: 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    Glow Up Wall
                  </h2>
                  <p
                    style={{
                      marginTop: 'var(--space-1)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    Where recognition comes alive
                  </p>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'var(--surface-border)', opacity: 0.5 }} />

                {/* Submit — the ONE accent button on this screen */}
                <motion.button
                  type="button"
                  onClick={async () => {
                    setIsSubmitting(true);
                    try {
                      await login();
                    } catch (err: any) {
                      setError(err.message || 'Login failed');
                      setIsSubmitting(false);
                    }
                  }}
                  className="btn-primary"
                  disabled={isSubmitting}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{ width: '100%', padding: '13px', letterSpacing: '0.01em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {isSubmitting ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                        style={{ display: 'inline-block' }}
                      >
                        ✦
                      </motion.span>
                      Connecting…
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Continue with Google
                    </>
                  )}
                </motion.button>

                <p style={{ textAlign: 'center', fontSize: 'var(--text-label)', color: 'var(--text-tertiary)', margin: 0 }}>
                  Use your Google Workspace account
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
