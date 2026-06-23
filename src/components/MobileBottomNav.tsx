'use client';

import { motion } from 'framer-motion';
import { Home, Plus, Archive, LogOut } from 'lucide-react';
import { useKudos } from '@/context/KudosContext';
import WorkspacePulse from './WorkspacePulse';

interface MobileBottomNavProps {
  onOpenComposer: () => void;
  onOpenJar: () => void;
}

export default function MobileBottomNav({ onOpenComposer, onOpenJar }: MobileBottomNavProps) {
  const { currentUser, logout } = useKudos();

  const tab = (icon: React.ReactNode, label: string, onClick?: () => void, active?: boolean) => (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        padding: '8px 14px',
        color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
        minWidth: 48,
        minHeight: 48,
        background: 'transparent',
        transition: 'color 150ms',
      }}
    >
      {icon}
      <span style={{ fontSize: '0.65rem', fontWeight: 500, lineHeight: 1 }}>{label}</span>
    </button>
  );

  return (
    <nav
      className="mobile-only"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 'var(--z-navbar)' as unknown as number,
        background: 'rgba(11,11,15,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--surface-border)',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom, 0px))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
      }}
    >
      {tab(<Home size={18} />, 'Feed', undefined, true)}
      {tab(<Archive size={18} />, 'My Jar', onOpenJar)}

      {/* Center FAB — THE one accent element on mobile screens */}
      <motion.button
        onClick={onOpenComposer}
        whileTap={{ scale: 0.88 }}
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'var(--accent)',
          color: 'var(--accent-text-on)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: -18,
          border: '3px solid var(--surface-base)',
          boxShadow: '0 4px 16px rgba(232,184,75,0.3)',
          flexShrink: 0,
        }}
      >
        <Plus size={22} strokeWidth={2.5} />
      </motion.button>

      {tab(<span style={{ fontSize: '0.8rem', fontWeight: 700 }}>✦</span>, 'Pulse', undefined)}
      {tab(<LogOut size={16} />, 'Leave', logout)}
    </nav>
  );
}
