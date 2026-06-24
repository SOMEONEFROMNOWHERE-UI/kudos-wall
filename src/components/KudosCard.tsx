'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKudos } from '@/context/KudosContext';
import type { KudosData } from '@/types';
import { CATEGORIES } from '@/types';
import { Pencil, Trash2, X, Check } from 'lucide-react';

interface KudosCardProps {
  kudos: KudosData;
  index: number;
  isNew?: boolean; // for Supabase Realtime new-card flash
}

// Accent gradients for the left-side colored border
const ACCENT_GRADIENTS: Record<string, string> = {
  '🔥': 'linear-gradient(180deg, #FB923C 0%, #EF4444 100%)',
  '💎': 'linear-gradient(180deg, #56B4E8 0%, #3B82F6 100%)',
  '🚀': 'linear-gradient(180deg, #818CF8 0%, #6366F1 100%)',
  '🧠': 'linear-gradient(180deg, #34D399 0%, #10B981 100%)',
  '🫂': 'linear-gradient(180deg, #E8B84B 0%, #F59E0B 100%)',
  '⭐': 'linear-gradient(180deg, #F5A623 0%, #D97706 100%)',
};

// Accent solid colors for soft glow shadows
const ACCENT_COLORS: Record<string, string> = {
  '🔥': '#FB923C',
  '💎': '#56B4E8',
  '🚀': '#818CF8',
  '🧠': '#34D399',
  '🫂': '#E8B84B',
  '⭐': '#F5A623',
};

// Vibe tag color system mapping
const VIBE_TAG_STYLING: Record<string, { bg: string; text: string; border: string; label: string }> = {
  '🔥': { bg: 'rgba(255,80,0,0.12)', text: '#FF6B35', border: 'rgba(255,107,53,0.3)', label: 'ON FIRE' },
  '💎': { bg: 'rgba(80,200,255,0.1)', text: '#50C8FF', border: 'rgba(80,200,255,0.25)', label: 'HIDDEN GEM' },
  '🚀': { bg: 'rgba(100,220,100,0.1)', text: '#64DC64', border: 'rgba(100,220,100,0.25)', label: 'ROCKET' },
  '🧠': { bg: 'rgba(150,100,255,0.12)', text: '#9664FF', border: 'rgba(150,100,255,0.3)', label: 'BIG BRAIN' },
  '🫂': { bg: 'rgba(255,80,150,0.1)', text: '#FF5096', border: 'rgba(255,80,150,0.25)', label: 'HEART OF TEAM' },
  '⭐': { bg: 'rgba(245,166,35,0.12)', text: '#F5A623', border: 'rgba(245,166,35,0.3)', label: 'STAR' },
};

function timeAgo(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// Consistent user avatar HSL color generator
function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return {
    base: `hsl(${hue}, 70%, 60%)`,
    ring: `hsla(${hue}, 70%, 60%, 0.2)`,
    hoverRing: `hsla(${hue}, 70%, 60%, 0.4)`,
    text: `hsl(${hue}, 80%, 15%)`,
  };
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const colors = getAvatarColor(name);
  const initials = getInitials(name);

  return (
    <motion.div
      whileHover={{ 
        scale: 1.1, 
        boxShadow: `0 0 0 6px ${colors.hoverRing}` 
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: colors.base,
        border: '2px solid rgba(255,255,255,0.1)',
        boxShadow: `0 0 0 3px ${colors.ring}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '13px',
        fontWeight: 700,
        color: colors.text,
        flexShrink: 0,
        cursor: 'pointer',
      }}
    >
      <span>{initials}</span>
    </motion.div>
  );
}

const REACTION_EMOJIS = ['🌟', '🔥', '🫂'] as const;
type Reaction = typeof REACTION_EMOJIS[number];

// Active styling properties per reaction emoji
const REACTION_STYLING: Record<Reaction, { activeColor: string; activeBorder: string; activeBg: string; activeBgHover: string }> = {
  '🌟': { activeColor: '#F5A623', activeBorder: 'rgba(245, 166, 35, 0.35)', activeBg: 'rgba(245, 166, 35, 0.12)', activeBgHover: 'rgba(245, 166, 35, 0.22)' },
  '🔥': { activeColor: '#FF6B35', activeBorder: 'rgba(255, 107, 53, 0.35)', activeBg: 'rgba(255, 80, 0, 0.12)', activeBgHover: 'rgba(255, 80, 0, 0.22)' },
  '🫂': { activeColor: '#FF5096', activeBorder: 'rgba(255, 80, 150, 0.3)', activeBg: 'rgba(255, 80, 150, 0.1)', activeBgHover: 'rgba(255, 80, 150, 0.18)' },
};

// Upgraded color-matched reaction burst
function ReactionBurst({ active, emoji }: { active: boolean; emoji: Reaction }) {
  const dots = [0, 60, 120, 180, 240, 300];
  if (!active) return null;

  const particleColor =
    emoji === '🌟' ? '#FFD000' :
    emoji === '🔥' ? '#FF6B35' :
    '#FF5096';

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 }}>
      {dots.map((deg, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: particleColor,
            boxShadow: `0 0 8px ${particleColor}`,
            animation: `burst-dot 0.5s cubic-bezier(0.1, 0.8, 0.3, 1) forwards`,
            animationDelay: `${i * 15}ms`,
            transformOrigin: '0 0',
            ['--deg' as any]: `${deg}deg`,
          }}
        />
      ))}
    </div>
  );
}

// Gorgeous high-quality custom SVGs replacing plain emojis
function StarIcon({ isHovered, isActive }: { isHovered: boolean; isActive: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '18px', height: '18px', display: 'block', overflow: 'visible' }}
      animate={isHovered ? {
        scale: [1, 1.25, 0.95, 1.1, 1],
        rotate: [0, 15, -15, 0],
      } : {}}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    >
      <defs>
        <linearGradient id="star-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF275" />
          <stop offset="40%" stopColor="#FFD000" />
          <stop offset="100%" stopColor="#FF8C00" />
        </linearGradient>
        <filter id="star-glow-filter" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {isHovered && (
        <>
          <motion.circle
            cx="4" cy="4" r="1.2"
            fill="#FFF275"
            animate={{ scale: [0, 1.3, 0], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0.1 }}
          />
          <motion.circle
            cx="20" cy="5" r="1.5"
            fill="#FFD000"
            animate={{ scale: [0, 1.3, 0], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8, delay: 0.3 }}
          />
          <motion.circle
            cx="21" cy="18" r="1"
            fill="#FFF275"
            animate={{ scale: [0, 1.3, 0], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1.2, delay: 0.5 }}
          />
        </>
      )}
      <path
        d="M12 2L14.85 8.4L21.9 9.01L16.55 13.7L18.18 20.6L12 16.85L5.82 20.6L7.45 13.7L2.1 9.01L9.15 8.4L12 2Z"
        fill="url(#star-gradient)"
        stroke={isActive ? '#FFE066' : 'rgba(255,208,0,0.4)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          filter: isActive ? 'url(#star-glow-filter)' : 'none',
        }}
      />
    </motion.svg>
  );
}

function FlameIcon({ isHovered, isActive }: { isHovered: boolean; isActive: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '18px', height: '18px', display: 'block', overflow: 'visible' }}
      animate={isHovered ? {
        scale: [1, 1.2, 0.9, 1.1, 1],
        y: [0, -2, 1, 0],
      } : isActive ? {
        scale: [1, 1.05, 1],
      } : {}}
      transition={isHovered ? {
        duration: 0.5,
        ease: 'easeInOut',
      } : isActive ? {
        repeat: Infinity,
        duration: 1.5,
        ease: 'easeInOut',
      } : {}}
    >
      <defs>
        <linearGradient id="flame-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="40%" stopColor="#F97316" />
          <stop offset="85%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#FFFbeb" />
        </linearGradient>
        <filter id="flame-glow-filter" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
        fill="url(#flame-gradient)"
        stroke={isActive ? '#FFFBEB' : 'rgba(249,115,22,0.4)'}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          filter: isActive ? 'url(#flame-glow-filter)' : 'none',
        }}
      />
    </motion.svg>
  );
}

function HugIcon({ isHovered, isActive }: { isHovered: boolean; isActive: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '18px', height: '18px', display: 'block', overflow: 'visible' }}
      animate={isHovered ? {
        scale: [1, 1.25, 0.9, 1.15, 1],
      } : isActive ? {
        scale: [1, 1.1, 1],
      } : {}}
      transition={isHovered ? {
        duration: 0.5,
        ease: 'easeInOut',
      } : isActive ? {
        repeat: Infinity,
        duration: 1.2,
        ease: 'easeInOut',
      } : {}}
    >
      <defs>
        <linearGradient id="hug-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="50%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
        <filter id="hug-glow-filter" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g style={{ filter: isActive ? 'url(#hug-glow-filter)' : 'none' }}>
        <path
          d="M6 18C6 14.5 7.5 13 10 13C10.8 13 11.5 13.2 12 13.6C11.5 14 11 14.7 10.8 15.5C10 15.8 9.5 16 9 16.5C8.3 17.2 8.3 18 8.3 18"
          stroke="url(#hug-gradient)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M18 18C18 14.5 16.5 13 14 13C13.2 13 12.5 13.2 12 13.6C12.5 14 13 14.7 13.2 15.5C14 15.8 14.5 16 15 16.5C15.7 17.2 15.7 18 15.7 18"
          stroke="url(#hug-gradient)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="9.5" cy="9" r="2.2" fill="url(#hug-gradient)" />
        <circle cx="14.5" cy="9" r="2.2" fill="url(#hug-gradient)" />
        <path
          d="M12 13.5C11 12.5 9.5 12.5 9 13.5C8.5 14.5 10 16.5 12 18C14 16.5 15.5 14.5 15 13.5C14.5 12.5 13 12.5 12 13.5Z"
          fill="url(#hug-gradient)"
          stroke="#FFF"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </g>
    </motion.svg>
  );
}

function ReactionIcon({ emoji, isHovered, isActive }: { emoji: Reaction; isHovered: boolean; isActive: boolean }) {
  switch (emoji) {
    case '🌟':
      return <StarIcon isHovered={isHovered} isActive={isActive} />;
    case '🔥':
      return <FlameIcon isHovered={isHovered} isActive={isActive} />;
    case '🫂':
      return <HugIcon isHovered={isHovered} isActive={isActive} />;
    default:
      return <span style={{ fontSize: '1.1rem' }}>{emoji}</span>;
  }
}

// Confetti burst for new cards
function ConfettiBurst() {
  const particles = Array.from({ length: 20 }).map((_, i) => {
    const angle = (i / 20) * 360 + (Math.random() * 15 - 7.5);
    const distance = 40 + Math.random() * 60;
    const rad = (angle * Math.PI) / 180;
    return {
      x: Math.cos(rad) * distance,
      y: Math.sin(rad) * distance,
      color: Math.random() > 0.5 ? '#F5A623' : '#7B5EA7', // gold + purple dots
      size: Math.random() * 5 + 3,
      delay: Math.random() * 0.1,
    };
  });

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible', zIndex: 50 }}>
      {particles.map((p, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
          animate={{ 
            opacity: [1, 1, 0],
            scale: [0, 1.2, 0.5],
            x: p.x,
            y: p.y
          }}
          transition={{
            duration: 0.8,
            ease: 'easeOut',
            delay: p.delay
          }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            backgroundColor: p.color,
            boxShadow: `0 0 6px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}

export default function KudosCard({ kudos, index, isNew = false }: KudosCardProps) {
  const accentGradient = ACCENT_GRADIENTS[kudos.category] || ACCENT_GRADIENTS['🫂'];
  const tagInfo = VIBE_TAG_STYLING[kudos.category] || VIBE_TAG_STYLING['🫂'];

  const { live, currentUser, updateKudos, deleteKudos } = useKudos();

  const [reactions, setReactions] = useState<Record<Reaction, number>>({ '🌟': 0, '🔥': 0, '🫂': 0 });
  const [myReactions, setMyReactions] = useState<Record<Reaction, boolean>>({ '🌟': false, '🔥': false, '🫂': false });
  const [bursting, setBursting] = useState<Reaction | null>(null);
  const [animating, setAnimating] = useState<Reaction | null>(null);
  const [hoveredReaction, setHoveredReaction] = useState<Reaction | null>(null);
  const [floatingPlusOnes, setFloatingPlusOnes] = useState<{ id: number; emoji: Reaction }[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [showConfetti, setShowConfetti] = useState(isNew);

  const [isEditing, setIsEditing] = useState(false);
  const [editMessage, setEditMessage] = useState(kudos.message);
  const [isDeleting, setIsDeleting] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const isOwner = currentUser?.name === kudos.sender && !kudos.isAnonymous;

  // Unmount confetti after 2 seconds
  useEffect(() => {
    if (isNew) {
      const t = setTimeout(() => setShowConfetti(false), 2000);
      return () => clearTimeout(t);
    }
  }, [isNew]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`kudos_rx_${kudos._id}`);
      if (saved) setMyReactions(JSON.parse(saved));
    } catch { /* ignore */ }
  }, [kudos._id]);

  useEffect(() => {
    if (kudos._id && live.reactions[kudos._id]) {
      setReactions(prev => ({ ...prev, ...live.reactions[kudos._id!] }));
    }
  }, [live.reactions, kudos._id]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    // Apply 3D tilt: max 4 degrees
    const rX = -(mouseY / (height / 2)) * 4;
    const rY = (mouseX / (width / 2)) * 4;
    setRotateX(rX);
    setRotateY(rY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  const handleReaction = async (emoji: Reaction) => {
    const isUndo = myReactions[emoji];
    const nextMyReactions = { ...myReactions, [emoji]: !isUndo };
    setMyReactions(nextMyReactions);
    localStorage.setItem(`kudos_rx_${kudos._id}`, JSON.stringify(nextMyReactions));
    setReactions(prev => ({ ...prev, [emoji]: Math.max(0, prev[emoji] + (isUndo ? -1 : 1)) }));

    if (!isUndo) {
      setBursting(emoji);
      setTimeout(() => setBursting(null), 600);

      // Add a floating +1 particle
      const newId = Date.now() + Math.random();
      setFloatingPlusOnes(prev => [...prev, { id: newId, emoji }]);
      setTimeout(() => {
        setFloatingPlusOnes(prev => prev.filter(item => item.id !== newId));
      }, 1000);
    }
    setAnimating(emoji);
    setTimeout(() => setAnimating(null), 500);

    try {
      await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kudosId: kudos._id!, emoji, undo: isUndo }),
      });
    } catch { /* optimistic */ }
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.34, 1.56, 0.64, 1], // Springy easing
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="kudos-card-wrapper"
      style={{
        transform: isHovered 
          ? `perspective(1000px) translateY(-4px) scale(1.01) rotateX(${rotateX}deg) rotateY(${rotateY}deg)` 
          : `perspective(1000px) translateY(0px) scale(1) rotateX(0deg) rotateY(0deg)`,
        filter: isHovered
          ? 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 15px rgba(103, 80, 162, 0.25)) drop-shadow(0 0 4px rgba(3, 179, 195, 0.15))'
          : 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2))',
        transition: isHovered 
          ? 'transform 0.1s ease-out, filter 0.3s ease'
          : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.3s ease',
      }}
    >
      {/* Glassy rotating border laser */}
      <div className="kudos-card-glow-border" />

      {/* Main card body with true glassmorphism */}
      <div className="kudos-card-inner">
        {/* Confetti Burst */}
        {showConfetti && <ConfettiBurst />}

        {/* Floating Glow Accent Left Border */}
        <div
          style={{
            position: 'absolute',
            left: 8,
            top: 16,
            bottom: 16,
            width: 4,
            borderRadius: '999px',
            background: accentGradient,
            boxShadow: `0 0 12px ${ACCENT_COLORS[kudos.category] || ACCENT_COLORS['🫂']}`,
          }}
        />

        {/* Subtle corner light tint */}
        <div
          style={{
            position: 'absolute',
            top: -40,
            left: -20,
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: accentGradient,
            opacity: 0.04,
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }}
        />

        {/* ── Header row ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          {/* Vibe tag top left badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '999px',
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              background: tagInfo.bg,
              color: tagInfo.text,
              border: `1px solid ${tagInfo.border}`,
              textShadow: `0 0 12px ${tagInfo.text}`,
            }}
          >
            <span style={{ filter: `drop-shadow(0 0 4px ${tagInfo.text})` }}>
              {kudos.category}
            </span>
            <span>{tagInfo.label}</span>
          </div>

          {/* Right actions and timestamp */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span 
              style={{ 
                fontSize: '12px', 
                color: isHovered ? '#8888AA' : '#555570', 
                letterSpacing: '0.01em',
                transition: 'color 0.2s ease',
              }}
            >
              {timeAgo(kudos.createdAt)}
            </span>
            {isOwner && !isEditing && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <motion.button
                  onClick={() => setIsEditing(true)}
                  animate={{
                    opacity: isHovered ? 1 : 0,
                    color: isHovered ? '#8888BB' : '#444460',
                  }}
                  whileHover={{
                    color: '#F5A623',
                    scale: 1.1,
                  }}
                  transition={{ duration: 0.2 }}
                  style={{
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Pencil size={13} />
                </motion.button>
                <motion.button
                  onClick={async () => {
                    if (confirm('Delete this kudos?')) {
                      setIsDeleting(true);
                      try { await deleteKudos(kudos._id!); }
                      catch { setIsDeleting(false); }
                    }
                  }}
                  disabled={isDeleting}
                  className="delete-btn-wiggle"
                  animate={{
                    opacity: isHovered ? 1 : 0,
                    color: isHovered ? '#8888BB' : '#444460',
                  }}
                  whileHover={{
                    color: '#FF5555',
                    scale: 1.1,
                  }}
                  transition={{ duration: 0.2 }}
                  style={{
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: 'none',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Trash2 size={13} style={{ color: isDeleting ? '#65656F' : undefined }} />
                </motion.button>
              </div>
            )}
          </div>
        </div>

        {/* ── Message ── */}
        {isEditing ? (
          <div style={{ marginBottom: 16 }}>
            <textarea
              className="input-field"
              value={editMessage}
              onChange={e => setEditMessage(e.target.value)}
              style={{ minHeight: 80, fontSize: '0.9375rem', padding: 12 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button 
                onClick={() => { setIsEditing(false); setEditMessage(kudos.message); }} 
                className="btn-ghost" 
                style={{ minHeight: 32, padding: '4px 12px' }}
              >
                <X size={13} /> Cancel
              </button>
              <button
                onClick={async () => {
                  if (!editMessage.trim()) return;
                  try { await updateKudos(kudos._id!, editMessage); setIsEditing(false); }
                  catch { alert('Failed to update'); }
                }}
                className="btn-primary"
                style={{ minHeight: 32, padding: '4px 12px' }}
              >
                <Check size={13} /> Save
              </button>
            </div>
          </div>
        ) : (
          <p
            style={{
              fontSize: '18px',
              fontStyle: 'italic',
              fontWeight: 500,
              color: '#E8E8F0',
              borderLeft: '2px solid rgba(245,166,35,0.4)',
              paddingLeft: '12px',
              margin: '12px 0',
              letterSpacing: '0.01em',
              lineHeight: '1.6',
            }}
          >
            {kudos.message}
          </p>
        )}

        {/* ── People row ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {/* To */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name={kudos.receiver} />
            <div>
              <div style={{ fontSize: '10px', color: '#666680', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>To</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#E0E0F0', lineHeight: 1 }}>{kudos.receiver}</div>
            </div>
          </div>
          {/* From */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: '#666680', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>From</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#E0E0F0', lineHeight: 1 }}>
                {kudos.isAnonymous ? '🥷 Anonymous' : kudos.sender}
              </div>
            </div>
            {!kudos.isAnonymous && <Avatar name={kudos.sender} />}
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 12 }} />

        {/* ── Reaction Pills ── */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {REACTION_EMOJIS.map(emoji => {
            const active = myReactions[emoji];
            const count = reactions[emoji];
            const isAnimating = animating === emoji;
            const isBursting = bursting === emoji;

            const styleInfo = REACTION_STYLING[emoji];

            return (
              <div key={emoji} style={{ position: 'relative' }}>
                <ReactionBurst active={isBursting} emoji={emoji} />

                {/* Floating +1 animation */}
                <AnimatePresence>
                  {floatingPlusOnes
                    .filter(item => item.emoji === emoji)
                    .map(item => (
                      <motion.span
                        key={item.id}
                        initial={{ opacity: 1, y: 0, scale: 0.8 }}
                        animate={{ opacity: 0, y: -30, scale: 1.3, x: (Math.random() - 0.5) * 12 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        style={{
                          position: 'absolute',
                          top: -12,
                          left: '40%',
                          color: styleInfo.activeColor,
                          fontWeight: 800,
                          fontSize: '13px',
                          pointerEvents: 'none',
                          zIndex: 30,
                          textShadow: `0 0 8px ${styleInfo.activeColor}`,
                        }}
                      >
                        +1
                      </motion.span>
                    ))}
                </AnimatePresence>

                {/* Custom animated glassmorphic tooltip */}
                <AnimatePresence>
                  {hoveredReaction === emoji && (
                    <motion.span
                      initial={{ opacity: 0, y: 8, scale: 0.9, x: '-50%' }}
                      animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                      exit={{ opacity: 0, y: 4, scale: 0.9, x: '-50%' }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 8px)',
                        left: '50%',
                        background: 'rgba(20, 20, 28, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: active ? styleInfo.activeColor : '#B5B5D2',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        boxShadow: `0 8px 16px rgba(0, 0, 0, 0.5), 0 0 10px ${active ? styleInfo.activeBorder : 'rgba(255, 255, 255, 0.02)'}`,
                        zIndex: 100,
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      {active ? 'You reacted' : `React with ${emoji === '🌟' ? 'Star' : emoji === '🔥' ? 'Fire' : 'Hug'}`}
                    </motion.span>
                  )}
                </AnimatePresence>

                <motion.button
                  onClick={() => handleReaction(emoji)}
                  onMouseEnter={() => setHoveredReaction(emoji)}
                  onMouseLeave={() => setHoveredReaction(null)}
                  animate={isAnimating ? { scale: [1, 1.3, 0.92, 1] } : {}}
                  whileHover={{
                    scale: 1.06,
                    y: -1,
                    backgroundColor: active ? styleInfo.activeBgHover : 'rgba(255,255,255,0.08)',
                    borderColor: active ? styleInfo.activeColor : 'rgba(255,255,255,0.18)',
                    boxShadow: active 
                      ? `0 6px 20px rgba(0,0,0,0.45), 0 0 12px ${styleInfo.activeBorder}`
                      : '0 6px 16px rgba(0,0,0,0.3)',
                  }}
                  transition={{ duration: 0.2 }}
                  title={`React with ${emoji}`}
                  aria-label={`${emoji} reaction${count > 0 ? `, ${count} reactions` : ''}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    padding: '8px 16px',
                    borderRadius: '999px',
                    background: active 
                      ? styleInfo.activeBg 
                      : count > 0 
                        ? 'rgba(255,255,255,0.04)' 
                        : 'rgba(255,255,255,0.02)',
                    border: active 
                      ? `1px solid ${styleInfo.activeBorder}` 
                      : count > 0 
                        ? '1px solid rgba(255,255,255,0.08)' 
                        : '1px solid rgba(255,255,255,0.04)',
                    color: active 
                      ? styleInfo.activeColor 
                      : count > 0 
                        ? '#C2C2DF' 
                        : '#6B6B83',
                    cursor: 'pointer',
                    position: 'relative',
                    zIndex: 1,
                    backdropFilter: 'blur(8px)',
                    transition: 'background-color 0.25s, border-color 0.25s, color 0.25s',
                  }}
                >
                  <ReactionIcon emoji={emoji} isHovered={hoveredReaction === emoji} isActive={active} />
                  <AnimatePresence mode="popLayout">
                    {count > 0 && (
                      <motion.span
                        key={count}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        style={{ fontWeight: active ? 800 : 600, fontSize: '0.85rem' }}
                        transition={{ type: 'spring', stiffness: 450, damping: 14 }}
                      >
                        {count}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
