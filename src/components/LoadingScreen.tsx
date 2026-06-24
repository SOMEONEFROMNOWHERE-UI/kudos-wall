'use client';

import { motion } from 'framer-motion';

export default function LoadingScreen() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#07070F', // Premium dark background
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {/* Immersive background glow */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.15, 0.28, 0.15],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232, 184, 75, 0.2) 0%, rgba(244, 63, 94, 0.05) 50%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />

      {/* Sparkle container */}
      <div style={{ position: 'relative', width: '80px', height: '80px' }}>
        
        {/* Main Sparkle */}
        <motion.svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          animate={{
            scale: [0.85, 1.08, 0.85],
            rotate: [0, 45, 90, 135, 180, 225, 270, 315, 360],
          }}
          transition={{
            scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
            rotate: { duration: 10, repeat: Infinity, ease: 'linear' },
          }}
          style={{
            position: 'absolute',
            width: '48px',
            height: '48px',
            top: '16px',
            left: '24px',
            filter: 'drop-shadow(0 0 12px rgba(232, 184, 75, 0.6))',
          }}
        >
          <defs>
            <linearGradient id="loader-spark-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFE07D" />
              <stop offset="50%" stopColor="#F5A623" />
              <stop offset="100%" stopColor="#E03C7A" />
            </linearGradient>
          </defs>
          <path
            d="M12 2C12 2 13.5 8.5 15.5 10.5C17.5 12.5 24 14 24 14C24 14 17.5 15.5 15.5 17.5C13.5 19.5 12 26 12 26C12 26 10.5 19.5 8.5 17.5C6.5 15.5 0 14 0 14C0 14 6.5 12.5 8.5 10.5C10.5 8.5 12 2 12 2Z"
            fill="url(#loader-spark-gradient)"
          />
        </motion.svg>

        {/* Small sparkle Top Left */}
        <motion.svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          animate={{
            scale: [0.5, 1.2, 0.5],
            opacity: [0.4, 1, 0.4],
            y: [0, -3, 0],
            x: [0, -2, 0],
          }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.3,
          }}
          style={{
            position: 'absolute',
            width: '16px',
            height: '16px',
            top: '8px',
            left: '10px',
            filter: 'drop-shadow(0 0 6px rgba(232, 184, 75, 0.5))',
          }}
        >
          <path
            d="M12 2C12 2 13.5 8.5 15.5 10.5C17.5 12.5 24 14 24 14C24 14 17.5 15.5 15.5 17.5C13.5 19.5 12 26 12 26C12 26 10.5 19.5 8.5 17.5C6.5 15.5 0 14 0 14C0 14 6.5 12.5 8.5 10.5C10.5 8.5 12 2 12 2Z"
            fill="url(#loader-spark-gradient)"
          />
        </motion.svg>

        {/* Small sparkle Bottom Left */}
        <motion.svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          animate={{
            scale: [0.4, 1.1, 0.4],
            opacity: [0.3, 1, 0.3],
            y: [0, 3, 0],
            x: [0, -1, 0],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.6,
          }}
          style={{
            position: 'absolute',
            width: '18px',
            height: '18px',
            bottom: '12px',
            left: '6px',
            filter: 'drop-shadow(0 0 6px rgba(244, 63, 94, 0.5))',
          }}
        >
          <path
            d="M12 2C12 2 13.5 8.5 15.5 10.5C17.5 12.5 24 14 24 14C24 14 17.5 15.5 15.5 17.5C13.5 19.5 12 26 12 26C12 26 10.5 19.5 8.5 17.5C6.5 15.5 0 14 0 14C0 14 6.5 12.5 8.5 10.5C10.5 8.5 12 2 12 2Z"
            fill="url(#loader-spark-gradient)"
          />
        </motion.svg>
      </div>

      {/* Subtle loader text */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 0.6, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        style={{
          marginTop: '20px',
          fontSize: '11px',
          fontWeight: 600,
          color: '#A5A5C0',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}
      >
        Loading wall
      </motion.div>
    </div>
  );
}
