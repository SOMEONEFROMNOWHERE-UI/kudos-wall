'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKudos } from '@/context/KudosContext';
import type { KudosData } from '@/types';
import { CATEGORIES } from '@/types';
import { Pencil, Trash2, X, Check } from 'lucide-react';
import { getAvatarColor, getInitials } from '@/lib/utils';
import ProfileModal from './ProfileModal';

interface KudosCardProps {
  kudos: KudosData;
  index: number;
  onProfileClick?: (username: string) => void;
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

const BADGE_MAP: Record<string, { emoji: string; label: string; color: string }> = {
  'CLUTCH_MOVE': { emoji: '⚡', label: 'Clutch', color: '#eab308' },
  'BIG_BRAIN': { emoji: '🧠', label: 'Big Brain', color: '#8b5cf6' },
  'CARRIED_TEAM': { emoji: '🏋️', label: 'Carried', color: '#ef4444' },
  'GROWTH_MODE': { emoji: '🌱', label: 'Growth', color: '#22c55e' },
  'ON_FIRE': { emoji: '🔥', label: 'On Fire', color: '#f97316' },
  'ROCKET': { emoji: '🚀', label: 'Rocket', color: '#3b82f6' },
  'GOOD_VIBES': { emoji: '✨', label: 'Vibes', color: '#ec4899' },
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


function Avatar({ name, size = 36, onClick }: { name: string; size?: number; onClick?: () => void }) {
  const colors = getAvatarColor(name);
  const initials = getInitials(name);

  return (
    <motion.div
      onClick={onClick}
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

const AvatarMemo = memo(Avatar);
const ReactionBurstMemo = memo(ReactionBurst);
const ReactionIconMemo = memo(ReactionIcon);
const ConfettiBurstMemo = memo(ConfettiBurst);

const VIBE_BORDER_CLASSES: Record<string, string> = {
  '🔥': 'border-vibe-fire',
  '💎': 'border-vibe-gem',
  '🚀': 'border-vibe-rocket',
  '🧠': 'border-vibe-brain',
  '🫂': 'border-vibe-team',
};

function formatTimeLeft(ms: number | null): string {
  if (ms === null) return '';
  if (ms <= 0) return 'Expired';
  const totalSecs = Math.floor(ms / 1000);
  const secs = totalSecs % 60;
  const totalMins = Math.floor(totalSecs / 60);
  const mins = totalMins % 60;
  const hours = Math.floor(totalMins / 60);

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 || hours > 0) parts.push(`${mins}m`);
  parts.push(`${secs}s`);
  return parts.join(' ');
}

export default function KudosCard({ kudos, index, onProfileClick, isNew = false }: KudosCardProps) {
  const accentGradient = ACCENT_GRADIENTS[kudos.category] || ACCENT_GRADIENTS['🫂'];
  const accentColor = ACCENT_COLORS[kudos.category] || ACCENT_COLORS['🫂'];
  const tagInfo = VIBE_TAG_STYLING[kudos.category] || VIBE_TAG_STYLING['🫂'];

  const { live, currentUser, updateKudos, deleteKudos } = useKudos();

  const [reactions, setReactions] = useState<Record<Reaction, number>>({ '🌟': 0, '🔥': 0, '🫂': 0 });
  const [myReactions, setMyReactions] = useState<Record<Reaction, boolean>>({ '🌟': false, '🔥': false, '🫂': false });
  const [bursting, setBursting] = useState<Reaction | null>(null);
  const [animating, setAnimating] = useState<Reaction | null>(null);
  const [hoveredReaction, setHoveredReaction] = useState<Reaction | null>(null);
  const [floatingPlusOnes, setFloatingPlusOnes] = useState<{ id: number; emoji: Reaction }[]>([]);
  const [showConfetti, setShowConfetti] = useState(isNew);

  const isAdmin = currentUser?.email === 'vijayvisal2710@gmail.com';
  const isOwner = (currentUser?.name === kudos.sender && !kudos.isAnonymous) || isAdmin;

  const [isEditing, setIsEditing] = useState(false);
  const [editMessage, setEditMessage] = useState(kudos.message);
  const [isDeleting, setIsDeleting] = useState(false);

  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [pctLeft, setPctLeft] = useState<number>(100);

  const handleProfileClick = (username: string) => {
    if (onProfileClick) onProfileClick(username);
  };

  useEffect(() => {
    if (!kudos.expiresAt) return;
    const expiry = new Date(kudos.expiresAt).getTime();
    const created = kudos.createdAt ? new Date(kudos.createdAt).getTime() : Date.now();
    const totalDuration = expiry - created;

    const updateTimer = () => {
      const remaining = expiry - Date.now();
      if (remaining <= 0) {
        setTimeLeft(0);
        setPctLeft(0);
        return false;
      }
      setTimeLeft(remaining);
      if (totalDuration > 0) {
        const pct = Math.max(0, Math.min(100, (remaining / totalDuration) * 100));
        setPctLeft(pct);
      }
      return true;
    };

    updateTimer();
    const interval = setInterval(() => {
      const active = updateTimer();
      if (!active) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [kudos.expiresAt, kudos.createdAt]);

  // Unmount confetti after 2 seconds
  useEffect(() => {
    if (isNew) {
      const t = setTimeout(() => setShowConfetti(false), 2000);
      return () => clearTimeout(t);
    }
  }, [isNew]);

  useEffect(() => {
    if (kudos.reactions) {
      const parsedReactions: Record<Reaction, number> = { '🌟': 0, '🔥': 0, '🫂': 0 };
      const myParsedReactions: Record<Reaction, boolean> = { '🌟': false, '🔥': false, '🫂': false };
      
      for (const emoji of REACTION_EMOJIS) {
        const users = kudos.reactions[emoji] || [];
        parsedReactions[emoji] = users.length;
        if (currentUser?.name && users.includes(currentUser.name)) {
          myParsedReactions[emoji] = true;
        }
      }
      
      setReactions(prev => ({ ...prev, ...parsedReactions }));
      setMyReactions(myParsedReactions);
    }
  }, [kudos.reactions, currentUser?.name]);

  useEffect(() => {
    if (kudos._id && live.reactions[kudos._id]) {
      setReactions(prev => ({ ...prev, ...live.reactions[kudos._id!] }));
    }
  }, [live.reactions, kudos._id]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    // Cap tilt at max 8 degrees
    const rX = -(mouseY / (height / 2)) * 8;
    const rY = (mouseX / (width / 2)) * 8;
    setRotateX(rX);
    setRotateY(rY);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  const handleReaction = async (emoji: Reaction) => {
    if (!currentUser) return; // must be logged in
    const isUndo = myReactions[emoji];
    const nextMyReactions = { ...myReactions, [emoji]: !isUndo };
    setMyReactions(nextMyReactions);
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

  const isExpired = timeLeft !== null && timeLeft <= 0;

  return (
    <>
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={isExpired
        ? { scale: 0, opacity: 0, height: 0, padding: 0, margin: 0, overflow: 'hidden' }
        : { opacity: 1, y: 0, scale: 1, rotateX, rotateY }
      }
      transition={isExpired
        ? { duration: 0.5, ease: 'easeOut' }
        : {
            opacity: { duration: 0.5, delay: index * 0.05 },
            y: { duration: 0.5, delay: index * 0.05, ease: [0.34, 1.56, 0.64, 1] },
            scale: { duration: 0.5, delay: index * 0.05, ease: [0.34, 1.56, 0.64, 1] },
            rotateX: { type: 'spring', stiffness: 200, damping: 25 },
            rotateY: { type: 'spring', stiffness: 200, damping: 25 },
          }
      }
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="kudos-card-wrapper"
      style={{
        transform: isExpired ? 'scale(0)' : 'none',
        filter: isExpired
          ? 'none'
          : isHovered
            ? `drop-shadow(0 12px 24px rgba(0, 0, 0, 0.45)) drop-shadow(0 0 16px ${accentColor}28)`
            : 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2))',
        transition: 'filter 0.3s ease',
        perspective: 1000,
        transformStyle: 'preserve-3d',
        borderRadius: '24px',
      }}
    >
      {/* Glassy rotating border laser */}
      <div className={`kudos-card-glow-border ${VIBE_BORDER_CLASSES[kudos.category] || 'border-vibe-team'}`} style={{ borderRadius: 'inherit' }} />

      {/* Main card body with true glassmorphism */}
      <div className="kudos-card-inner" style={{ transformStyle: 'preserve-3d', borderRadius: 'calc(24px - 2px)' }}>
        {/* Confetti Burst */}
        {showConfetti && <ConfettiBurstMemo />}

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
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.04, 0.08, 0.04],
            x: [0, 8, 0],
            y: [0, -8, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            top: -40,
            left: -20,
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: accentGradient,
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }}
        />

        {/* ── Header row ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, transform: 'translateZ(15px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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
                transform: 'translateZ(10px)',
              }}
            >
              <span style={{ filter: `drop-shadow(0 0 4px ${tagInfo.text})` }}>
                {kudos.category}
              </span>
              <span>{tagInfo.label}</span>
            </div>

            {/* AI Vibe Badge */}
            {kudos.badge && BADGE_MAP[kudos.badge] && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  borderRadius: '999px',
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  background: 'rgba(255,255,255,0.05)',
                  color: BADGE_MAP[kudos.badge].color,
                  border: `1px solid ${BADGE_MAP[kudos.badge].color}40`,
                  boxShadow: `0 0 8px ${BADGE_MAP[kudos.badge].color}20`,
                }}
              >
                <span>{BADGE_MAP[kudos.badge].emoji}</span>
                <span>{BADGE_MAP[kudos.badge].label}</span>
                <span style={{ fontSize: '8px', opacity: 0.5, marginLeft: 4 }}>✦ AI</span>
              </div>
            )}
          </div>

          {/* Right actions and timestamp */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {kudos.expiresAt && timeLeft !== null && (
              <span 
                style={{ 
                  fontSize: '11px', 
                  fontWeight: 600,
                  color: timeLeft <= 600000 ? '#EF4444' : '#F59E0B', 
                  background: timeLeft <= 600000 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  padding: '3px 8px',
                  borderRadius: '999px',
                  border: timeLeft <= 600000 ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: timeLeft <= 600000 ? '0 0 10px rgba(239, 68, 68, 0.15)' : 'none',
                }}
              >
                <span>⏳</span>
                <span>{formatTimeLeft(timeLeft)}</span>
              </span>
            )}
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
            {(isOwner || isAdmin) && !isEditing && (
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
          <div style={{ marginBottom: 16, transform: 'translateZ(25px)' }}>
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
          <div style={{ position: 'relative', margin: '18px 0', paddingLeft: 16, transform: 'translateZ(25px)' }}>
            {/* Translucent giant quote icon in the background */}
            <span style={{
              position: 'absolute',
              left: -4,
              top: -14,
              fontSize: '3.5rem',
              fontWeight: 800,
              fontFamily: 'serif',
              color: accentColor,
              opacity: 0.12,
              lineHeight: 1,
              pointerEvents: 'none',
              userSelect: 'none',
            }}>
              “
            </span>
            <p
              style={{
                fontSize: '1.05rem',
                fontStyle: 'italic',
                fontWeight: 500,
                color: isHovered ? '#FFFFFF' : '#EDEDF0',
                letterSpacing: '0.015em',
                lineHeight: '1.65',
                transition: 'color 0.3s ease',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {kudos.message}
            </p>
            {/* Shimmering left accent bar */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 4,
                bottom: 4,
                width: 3,
                background: accentGradient,
                borderRadius: 2,
                boxShadow: isHovered ? `0 0 10px ${accentColor}` : 'none',
                transition: 'box-shadow 0.3s ease',
              }}
            />
          </div>
        )}

        {/* ── People row ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16, transform: 'translateZ(18px)' }}>
          {/* To */}
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
            onClick={() => {
              if (onProfileClick) onProfileClick(kudos.receiver);
            }}
          >
            <AvatarMemo name={kudos.receiver} />
            <div>
              <div style={{ fontSize: '10px', color: '#666680', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>To</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#E0E0F0', lineHeight: 1, cursor: 'pointer' }}>{kudos.receiver}</div>
            </div>
          </div>
          {/* From */}
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: kudos.isAnonymous ? 'default' : 'pointer' }}
            onClick={() => {
              if (!kudos.isAnonymous && onProfileClick) {
                onProfileClick(kudos.sender);
              }
            }}
          >
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: '#666680', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>From</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#E0E0F0', lineHeight: 1 }}>
                {kudos.isAnonymous ? '🥷 Anonymous' : kudos.sender}
              </div>
            </div>
            {!kudos.isAnonymous && <AvatarMemo name={kudos.sender} />}
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 12 }} />

        {/* ── Reaction Pills ── */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', transform: 'translateZ(15px)' }}>
          {REACTION_EMOJIS.map(emoji => {
            const active = myReactions[emoji];
            const count = reactions[emoji] || 0;
            const hasCount = count > 0;
            const isAnimating = animating === emoji;
            const isBursting = bursting === emoji;

            const styleInfo = REACTION_STYLING[emoji];

            return (
              <div key={emoji} style={{ position: 'relative' }}>
                <ReactionBurstMemo active={isBursting} emoji={emoji} />

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
                    scale: 1.08,
                    y: -1.5,
                    backgroundColor: active 
                      ? styleInfo.activeBgHover 
                      : hasCount 
                        ? 'rgba(255,255,255,0.08)' 
                        : 'rgba(255,255,255,0.05)',
                    borderColor: active 
                      ? styleInfo.activeColor 
                      : hasCount 
                        ? styleInfo.activeColor 
                        : 'rgba(255,255,255,0.2)',
                    boxShadow: active 
                      ? `0 6px 20px rgba(0,0,0,0.45), 0 0 12px ${styleInfo.activeBorder}`
                      : hasCount 
                        ? `0 6px 16px rgba(0,0,0,0.35), 0 0 8px ${styleInfo.activeBorder}`
                        : '0 6px 16px rgba(0,0,0,0.25)',
                  }}
                  transition={{ duration: 0.2 }}
                  title={`React with ${emoji}`}
                  aria-label={`${emoji} reaction${hasCount ? `, ${count} reactions` : ''}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    padding: '6px 14px',
                    width: 'auto',
                    height: '34px',
                    minWidth: '64px',
                    borderRadius: '999px',
                    background: active 
                      ? styleInfo.activeBg 
                      : hasCount 
                        ? 'rgba(255,255,255,0.03)' 
                        : 'rgba(255,255,255,0.015)',
                    border: active 
                      ? `1.5px solid ${styleInfo.activeColor}` 
                      : hasCount 
                        ? `1px solid ${styleInfo.activeBorder}` 
                        : '1px solid rgba(255,255,255,0.04)',
                    color: active 
                      ? styleInfo.activeColor 
                      : hasCount 
                        ? '#C2C2DF' 
                        : '#6B6B83',
                    cursor: 'pointer',
                    position: 'relative',
                    zIndex: 1,
                    backdropFilter: 'blur(8px)',
                    transition: 'background-color 0.25s, border-color 0.25s, color 0.25s, width 0.25s, padding 0.25s, gap 0.25s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', gap: hasCount ? '6px' : '0' }}>
                    <ReactionIconMemo emoji={emoji} isHovered={hoveredReaction === emoji} isActive={active} />
                    {hasCount && (
                      <span style={{ fontWeight: active ? 800 : 600, fontSize: '0.85rem' }}>
                        {count}
                      </span>
                    )}
                  </div>
                </motion.button>
              </div>
            );
          })}
        </div>

        {/* Expiration Progress Bar at bottom */}
        {kudos.expiresAt && timeLeft !== null && timeLeft > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 12,
              right: 12,
              height: '3px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '999px',
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
          >
            <motion.div
              style={{
                height: '100%',
                width: `${pctLeft}%`,
                background: `linear-gradient(90deg, ${tagInfo.text}, ${ACCENT_COLORS[kudos.category] || '#F5A623'})`,
                boxShadow: `0 0 8px ${tagInfo.text}`,
              }}
              transition={{ ease: 'linear' }}
            />
          </div>
        )}
      </div>
    </motion.div>
  </>
  );
}
