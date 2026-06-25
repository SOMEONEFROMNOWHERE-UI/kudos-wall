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
import GlowingRightNow from './GlowingRightNow';
import FriendsPanel from './FriendsPanel';
import EchoInsight from './EchoInsight';
import { Plus } from 'lucide-react';

export default function KudosFeed() {
  const { kudosList, currentUser, live } = useKudos();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJarOpen, setIsJarOpen] = useState(false);
  const [isFriendsPanelOpen, setIsFriendsPanelOpen] = useState(false);

  const uniqueUsers = Array.from(new Set(live?.presenceUsers || []));
  const others = uniqueUsers.filter(u => u !== currentUser?.name);
  const hasOthersOnline = others.length >= 1;

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--surface-base)' }}>
      {/* Weekly spotlight overlay (Monday only) */}
      <WeeklySpotlight />

      {/* Navigation */}
      <Navbar
        onOpenJar={() => setIsJarOpen(true)}
        onOpenComposer={() => setIsModalOpen(true)}
        onOpenFriends={() => setIsFriendsPanelOpen(true)}
      />

      {/* Live presence */}
      <LivePresenceStrip />

      {/* Main layout — feed + sidebar */}
      <div
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 1440,
          margin: '0 auto',
          padding: `${hasOthersOnline ? 'var(--space-3)' : 'var(--space-4)'} var(--space-4)`,
          paddingBottom: 120,
          display: 'grid',
          gridTemplateColumns: kudosList.length > 0 ? '1fr 320px' : '1fr',
          gap: 'var(--space-5)',
          alignItems: 'start',
        }}
      >
        {/* ── Left: Feed ── */}
        <main>
          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ marginBottom: 'var(--space-5)' }}
          >
            <h2 className="feed-header-title">
              Hey, <span className="feed-header-name">{currentUser?.name}</span> <span className="waving-hand">👋</span>
            </h2>
            <p className="feed-header-subtitle">
              <span className="presence-pulse-dot" /> See what your team has been celebrating
            </p>
          </motion.div>

          {/* Echo insight — appears after 8 given kudos */}
          <div style={{ marginBottom: kudosList.length > 0 ? 'var(--space-4)' : 0 }}>
            <EchoInsight />
          </div>

          {/* Mobile: Glowing Right Now pill */}
          {kudosList.length > 0 && (
            <div className="mobile-only" style={{ marginBottom: 'var(--space-3)' }}>
              <GlowingRightNow onOpenComposer={() => setIsModalOpen(true)} />
            </div>
          )}

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
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: '3.5rem', marginBottom: 'var(--space-4)', position: 'relative', zIndex: 1, lineHeight: 1 }}
              >
                ✦
              </motion.div>
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
              <motion.button
                className="btn-primary"
                onClick={() => setIsModalOpen(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                style={{ position: 'relative', zIndex: 1, padding: '13px 32px', fontSize: 'var(--text-body)', letterSpacing: '0.01em' }}
              >
                Send First Kudos →
              </motion.button>

              {/* Dashed invite prompt card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  marginTop: 'var(--space-5)',
                  width: '100%',
                  maxWidth: 440,
                  border: '1.5px dashed rgba(255,255,255,0.1)',
                  borderRadius: 16,
                  padding: 'var(--space-4)',
                  background: 'rgba(255,255,255,0.015)',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: 'var(--text-label)', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
                  💡 <strong style={{ color: 'var(--text-secondary)' }}>Be the first to drop kudos today.</strong>
                  {' '}Celebrate a win, shout out a teammate, or just say thanks.
                </p>
              </motion.div>
            </motion.div>
          ) : (
            /* Kudos Masonry Grid */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
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

        {/* ── Right: Sidebar (desktop only) ── */}
        {kudosList.length > 0 && (
          <aside className="desktop-only" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <GlowingRightNow onOpenComposer={() => setIsModalOpen(true)} />
          </aside>
        )}
      </div>


      {/* Desktop pulse — bottom-left ambient */}
      <div
        className="desktop-only"
        style={{ position: 'fixed', bottom: 'var(--space-4)', left: 'var(--space-4)', zIndex: 40 }}
      >
        <WorkspacePulse />
      </div>

      {/* Mobile nav */}
      <MobileBottomNav
        onOpenComposer={() => setIsModalOpen(true)}
        onOpenJar={() => setIsJarOpen(true)}
      />

      {/* Modals & panels */}
      <GiveKudosModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <KudosJar
        isOpen={isJarOpen}
        onClose={() => setIsJarOpen(false)}
        onPayItForward={() => { setIsJarOpen(false); setIsModalOpen(true); }}
      />
      <FriendsPanel isOpen={isFriendsPanelOpen} onClose={() => setIsFriendsPanelOpen(false)} />
    </div>
  );
}
