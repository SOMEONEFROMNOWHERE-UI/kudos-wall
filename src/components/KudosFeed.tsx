'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useKudos } from '@/context/KudosContext';
import KudosCard from './KudosCard';
import GiveKudosModal from './GiveKudosModal';
import KudosJar from './KudosJar';
import Navbar from './Navbar';
import MobileBottomNav from './MobileBottomNav';
import LivePresenceStrip from './LivePresenceStrip';
import WorkspacePulse from './WorkspacePulse';
import WeeklySpotlight from './WeeklySpotlight';
import { Plus } from 'lucide-react';

export default function KudosFeed() {
  const { kudosList, currentUser } = useKudos();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJarOpen, setIsJarOpen] = useState(false);

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--surface-base)' }}>
      {/* Weekly spotlight overlay (Monday only) */}
      <WeeklySpotlight />

      {/* Navigation */}
      <Navbar onOpenJar={() => setIsJarOpen(true)} onOpenComposer={() => setIsModalOpen(true)} />

      {/* Live presence */}
      <LivePresenceStrip />

      {/* Main */}
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 1280,
          margin: '0 auto',
          padding: 'var(--space-5) var(--space-4)',
          paddingBottom: 120,
        }}
      >
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ marginBottom: 'var(--space-5)' }}
        >
          <h2
            style={{
              fontSize: 'var(--text-title)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Hey, <span style={{ color: 'var(--accent)' }}>{currentUser?.name}</span> 👋
          </h2>
          <p style={{ marginTop: 4, fontSize: 'var(--text-body)', color: 'var(--text-tertiary)' }}>
            See what your team has been celebrating
          </p>
        </motion.div>

        {/* Empty state */}
        {kudosList.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-6) var(--space-4)',
              textAlign: 'center',
              minHeight: '50vh',
              position: 'relative',
            }}
          >
            {/* Depth gradient behind icon */}
            <div
              style={{
                position: 'absolute',
                width: 280,
                height: 280,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(21,21,28,0.8) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: '3.5rem', marginBottom: 'var(--space-4)', position: 'relative', zIndex: 1, lineHeight: 1 }}
            >
              ✦
            </motion.div>
            {/* ONE display-size line on the screen */}
            <h1
              style={{
                position: 'relative',
                zIndex: 1,
                fontSize: 'var(--text-display)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                margin: '0 0 var(--space-3)',
                maxWidth: 480,
              }}
            >
              This wall is waiting for its first story
            </h1>
            <p
              style={{
                position: 'relative',
                zIndex: 1,
                fontSize: 'var(--text-body)',
                color: 'var(--text-secondary)',
                maxWidth: 380,
                margin: '0 0 var(--space-5)',
                lineHeight: 1.65,
              }}
            >
              Recognition compounds. The first kudos on this wall starts a chain that never ends.
            </p>
            {/* THE one accent button on this screen */}
            <motion.button
              className="btn-primary"
              onClick={() => setIsModalOpen(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{ position: 'relative', zIndex: 1, padding: '13px 32px', fontSize: 'var(--text-body)', letterSpacing: '0.01em' }}
            >
              Send First Kudos →
            </motion.button>
          </motion.div>
        ) : (
          /* Kudos Grid */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
              gap: 'var(--space-3)',
              alignItems: 'start',
            }}
          >
            {kudosList.map((kudos, i) => (
              <KudosCard key={kudos._id || i} kudos={kudos} index={i} />
            ))}
          </div>
        )}
      </main>

      {/* Desktop FAB — THE one accent element on the populated feed screen */}
      {kudosList.length > 0 && (
        <motion.button
          className="desktop-only"
          onClick={() => setIsModalOpen(true)}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          style={{
            position: 'fixed',
            bottom: 'var(--space-5)',
            right: 'var(--space-5)',
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--accent)',
            color: 'var(--accent-text-on)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            border: 'none',
            boxShadow: '0 4px 20px rgba(232,184,75,0.3)',
          }}
          title="Give kudos"
        >
          <Plus size={22} strokeWidth={2.5} />
        </motion.button>
      )}

      {/* Desktop pulse — bottom-left corner, ambient */}
      <div
        className="desktop-only"
        style={{
          position: 'fixed',
          bottom: 'var(--space-4)',
          left: 'var(--space-4)',
          zIndex: 40,
        }}
      >
        <WorkspacePulse />
      </div>

      {/* Mobile nav */}
      <MobileBottomNav onOpenComposer={() => setIsModalOpen(true)} onOpenJar={() => setIsJarOpen(true)} />

      {/* Modals */}
      <GiveKudosModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <KudosJar isOpen={isJarOpen} onClose={() => setIsJarOpen(false)} onPayItForward={(r, m) => { setIsJarOpen(false); setIsModalOpen(true); }} />
    </div>
  );
}
