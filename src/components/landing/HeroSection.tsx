'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Zap, Sparkles, Gift } from 'lucide-react';
import { useKudos } from '@/context/KudosContext';
import type { HyperspeedHandle } from '@/components/Hyperspeed/Hyperspeed';
import AnimatedParticles from './AnimatedParticles';

// Lazy-load Hyperspeed — its Three.js + postprocessing bundle is heavy and
// must NEVER load for users who are already logged in (they skip this screen).
const Hyperspeed = dynamic(
  () => import('@/components/Hyperspeed/Hyperspeed'),
  {
    ssr: false,
    loading: () => <div style={{ width: '100%', height: '100%', background: 'var(--surface-base)' }} />,
  }
);

const affirmations = [
  'You are making a difference today',
  'Your energy is contagious',
  'Recognition is a superpower',
  'Great things happen with great teams',
  'Someone is waiting to hear from you',
  'One kind word can change everything',
];

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return reduced;
}

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

// Memoized effect options — MUST be stable (defined outside component) to avoid
// recreating the entire WebGL scene on every render. Per Hyperspeed's own docs.
const EFFECT_OPTIONS = {
  onSpeedUp: () => {},
  onSlowDown: () => {},
  distortion: 'turbulentDistortion' as const,
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
  lightStickWidth: [0.12, 0.5] as [number, number],
  lightStickHeight: [1.3, 1.7] as [number, number],
  movingAwaySpeed: [60, 80] as [number, number],
  movingCloserSpeed: [-120, -160] as [number, number],
  carLightsLength: [400 * 0.03, 400 * 0.2] as [number, number],
  carLightsRadius: [0.05, 0.14] as [number, number],
  carWidthPercentage: [0.3, 0.5] as [number, number],
  carShiftX: [-0.8, 0.8] as [number, number],
  carFloorSeparation: [0, 5] as [number, number],
  colors: {
    roadColor: 0x0d0d12,
    islandColor: 0x0b0b0f,
    background: 0x000000,
    shoulderLines: 0x1a1a22,
    brokenLines: 0x1a1a22,
    leftCars: [0xd856bf, 0x6750a2, 0xc247ac] as number[],
    rightCars: [0x03b3c3, 0x0e5ea5, 0x324555] as number[],
    sticks: 0xe8b84b,
  },
};

export default function HeroSection() {
  const [step, setStep] = useState<'affirmation' | 'login'>('affirmation');
  const [affirmation] = useState(
    () => affirmations[Math.floor(Math.random() * affirmations.length)]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [canvasOpacity, setCanvasOpacity] = useState(1);
  const [showHyperspeed, setShowHyperspeed] = useState(true);
  const [hasWebGL, setHasWebGL] = useState(true);

  const { login, currentUser } = useKudos();
  const router = useRouter();
  const hyperspeedRef = useRef<HyperspeedHandle>(null);
  const reducedMotion = useReducedMotion();

  // WebGL detection on mount
  useEffect(() => {
    setHasWebGL(detectWebGL());
  }, []);

  // Advance from affirmation → login card after 2.6s
  useEffect(() => {
    const t = setTimeout(() => setStep('login'), 2600);
    return () => clearTimeout(t);
  }, []);

  // When user returns from Google OAuth and session is established,
  // trigger canvas fade-out → navigate to feed
  useEffect(() => {
    if (currentUser?.name && !isSubmitting) {
      // Cross-fade: canvas fades out, app comes in underneath
      setCanvasOpacity(0);
      setTimeout(() => {
        setShowHyperspeed(false); // Fully unmount WebGL context
        router.replace('/feed');
      }, 500);
    }
  }, [currentUser, router, isSubmitting]);

  const handleLogin = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');

    try {
      // Step 1: Trigger speedUp immediately (before the redirect)
      if (!reducedMotion && hasWebGL && hyperspeedRef.current) {
        hyperspeedRef.current.speedUp();
      }

      // Step 2: Wait 800ms for the warp to feel real
      await new Promise<void>((resolve) => setTimeout(resolve, 800));

      // Step 3: Fade canvas before redirect for a cleaner exit
      setCanvasOpacity(0);
      await new Promise<void>((resolve) => setTimeout(resolve, 200));

      // Step 4: Trigger OAuth redirect (signIn navigates away from this page)
      await login();
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Login failed — please try again');
      setIsSubmitting(false);
      setCanvasOpacity(1);
      if (hyperspeedRef.current) hyperspeedRef.current.slowDown();
    }
  }, [isSubmitting, reducedMotion, hasWebGL, login]);

  const useWebGL = !reducedMotion && hasWebGL;

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: 'var(--surface-base)',
      }}
    >
      {/* ── Animated Particles ── */}
      <AnimatedParticles count={40} />
      {/* ── Hyperspeed WebGL background ── */}
      {useWebGL && showHyperspeed && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            opacity: canvasOpacity,
            transition: 'opacity 400ms ease',
          }}
        >
          <Hyperspeed ref={hyperspeedRef} effectOptions={EFFECT_OPTIONS} />
        </div>
      )}

      {/* ── Static gradient fallback (reduced-motion / no WebGL) ── */}
      {!useWebGL && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            background:
              'radial-gradient(ellipse 120% 80% at 60% 40%, #1a0a2e 0%, #0a1628 40%, #0B0B0F 100%)',
          }}
        />
      )}

      {/* ── Gradient Overlay — hides chaotic lines behind text and darkens edges ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background:
            'linear-gradient(90deg, rgba(11,11,15,0.95) 0%, rgba(11,11,15,0.8) 40%, transparent 65%), radial-gradient(ellipse at 50% 55%, rgba(11,11,15,0.15) 0%, rgba(11,11,15,0.88) 65%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Content ── */}
      <div className="hero-grid">
        {/* Left Column: Value Proposition (Desktop only) */}
        <div className="hero-left">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1
              className="hero-title transition-transform duration-150 ease-out hover:scale-105 cursor-pointer"
              style={{
                fontSize: 'clamp(1.8rem,3.5vw,2.5rem)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                color: '#FFFFFF',
                margin: '0 0 var(--space-4) 0',
                marginTop: 'var(--space-2)',
              }}
            >
              The recognition platform for<br />
              <span style={{
                background: 'linear-gradient(90deg, #FB923C, #F59E0B)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                modern teams.
              </span>
            </h1>
            <p
              style={{
                fontSize: '1.25rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                maxWidth: 460,
                margin: '0 0 var(--space-8) 0',
                fontWeight: 400,
              }}
            >
              Boost morale, celebrate wins, and build a culture of appreciation at hyperspeed. Ensure every contribution is seen, valued, and instantly rewarded.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {[
                { icon: <Zap size={20} color="var(--cat-rocket)" />, title: 'Real-time peer-to-peer recognition', desc: 'Instantly celebrate wins with beautiful animated reactions and instant feedback.', glow: 'rgba(236, 72, 153, 0.15)' },
                { icon: <Sparkles size={20} color="var(--cat-gem)" />, title: 'AI-powered team insights', desc: 'Discover hidden connections, track contributions, and gain actionable analytics across your organization.', glow: 'rgba(56, 189, 248, 0.15)' },
                { icon: <Gift size={20} color="#a855f7" />, title: 'Custom Rewards & Perks', desc: 'Exchange your well-earned kudos for real-world rewards, gift cards, and exclusive company swag.', glow: 'rgba(168, 85, 247, 0.15)' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ x: 6, scale: 1.01 }}
                  transition={{ duration: 0.3, ease: 'easeOut', delay: 0.4 + i * 0.1 }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    cursor: 'default',
                  }}
                >
                  <span
                    style={{
                      width: 42,
                      height: 42,
                      flexShrink: 0,
                      marginTop: '2px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.01))',
                      boxShadow: `inset 0 1px 1px rgba(255,255,255,0.15), inset 0 0 0 1px rgba(255,255,255,0.05), 0 4px 12px rgba(0,0,0,0.3), 0 0 20px ${item.glow}`,
                      backdropFilter: 'blur(8px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em', lineHeight: 1.3 }}>{item.title}</div>
                    <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.55, maxWidth: 380 }}>{item.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Login Card */}
        <AnimatePresence mode="wait">
          {step === 'affirmation' ? (
            <motion.div
              key="affirmation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{ textAlign: 'center', position: 'relative' }}
            >
              {/* Soft radial scrim BEHIND headline text — atmospheric, not a box */}
              <div
                style={{
                  position: 'absolute',
                  inset: '-60px -80px',
                  background:
                    'radial-gradient(ellipse at 50% 50%, rgba(11,11,15,0.42) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />
              <h2
                style={{
                  position: 'relative',
                  color: 'var(--accent)',
                  fontSize: 'clamp(1.6rem, 5vw, var(--text-display))',
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.2,
                  margin: 0,
                  // Text-glow in a darker amber — belongs in the scene, not on top of it
                  textShadow:
                    '0 0 40px rgba(180, 120, 20, 0.55), 0 2px 8px rgba(100, 60, 0, 0.4)',
                }}
              >
                {affirmation}
              </h2>
            </motion.div>
          ) : (
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Login card with animated gradient border */}
              <div 
                className="login-card"
                onMouseEnter={() => {
                  if (useWebGL && hyperspeedRef.current && !isSubmitting) {
                    hyperspeedRef.current.speedUp();
                  }
                }}
                onMouseLeave={() => {
                  if (useWebGL && hyperspeedRef.current && !isSubmitting) {
                    hyperspeedRef.current.slowDown();
                  }
                }}
              >
                {/* Decorative glow behind card — ties card to scene energy */}
                <div
                  style={{
                    position: 'absolute',
                    inset: '-20px',
                    borderRadius: 'var(--radius-xl)',
                    background:
                      'radial-gradient(ellipse at 50% 50%, rgba(100,30,180,0.08) 0%, transparent 70%)',
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                />

                <div
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    padding: 'var(--space-5)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-4)',
                  }}
                >
                  {/* Header */}
                  <div style={{ textAlign: 'center' }}>
                    <motion.div
                      initial={{ scale: 0, rotate: 0 }}
                      animate={{ scale: 1, rotate: 360 }}
                      transition={{
                        scale: { delay: 0.15, type: 'spring', stiffness: 250, damping: 16 },
                        rotate: { duration: 12, repeat: Infinity, ease: 'linear' },
                      }}
                      style={{
                        display: 'inline-block',
                        fontSize: '2rem',
                        lineHeight: 1,
                        marginBottom: 'var(--space-3)',
                        color: 'var(--accent)',
                        textShadow: '0 0 16px rgba(232,184,75,0.5)',
                      }}
                    >
                      ✦
                    </motion.div>
                    <motion.h2
                      animate={{
                        textShadow: [
                          '0 0 8px rgba(255,255,255,0.1)',
                          '0 0 24px rgba(255,255,255,0.4)',
                          '0 0 8px rgba(255,255,255,0.1)',
                        ],
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      style={{
                        fontSize: 'var(--text-title)',
                        fontWeight: 700,
                        letterSpacing: '-0.03em',
                        color: 'var(--text-primary)',
                        margin: 0,
                      }}
                    >
                      Glow Up Wall
                    </motion.h2>
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
                  <div
                    style={{
                      height: 1,
                      background: 'var(--surface-border)',
                      opacity: 0.5,
                    }}
                  />

                  {/* Google sign-in button — the ONE CTA, with spring hover */}
                  <button
                    id="google-signin-btn"
                    type="button"
                    onClick={handleLogin}
                    disabled={isSubmitting}
                    className="google-btn"
                    aria-label="Continue with Google"
                  >
                    {isSubmitting ? (
                      <>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.2,
                            ease: 'linear',
                          }}
                          style={{ display: 'inline-block' }}
                        >
                          ✦
                        </motion.span>
                        <span>Launching…</span>
                      </>
                    ) : (
                      <>
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                        >
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                        <span>Continue with Google</span>
                      </>
                    )}
                  </button>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        textAlign: 'center',
                        fontSize: 'var(--text-label)',
                        color: 'var(--negative)',
                        margin: 0,
                      }}
                    >
                      {error}
                    </motion.p>
                  )}

                  <p
                    style={{
                      textAlign: 'center',
                      fontSize: 'var(--text-label)',
                      color: 'var(--text-tertiary)',
                      margin: 0,
                    }}
                  >
                    Use your Google Workspace account
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
