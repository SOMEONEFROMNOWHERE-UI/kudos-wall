'use client';

import { useState, useEffect, useRef } from 'react';
import { useKudos } from '@/context/KudosContext';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];

const HB_PULSE_STYLE = `
  @keyframes hbPulse {
    0%, 100% { opacity: 1; r: 3; }
    50% { opacity: 0.35; r: 4.5; }
  }
`;

export default function TeamHeartbeat() {
  const { currentUser } = useKudos();
  const [isInGroup, setIsInGroup] = useState(false);
  const [counts, setCounts] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check group membership
  useEffect(() => {
    if (!currentUser?.name) return;
    const checkGroups = async () => {
      try {
        const res = await fetch('/api/groups');
        if (res.ok) {
          const groups = await res.json();
          setIsInGroup(Array.isArray(groups) && groups.length > 0);
        }
      } catch {
        setIsInGroup(false);
      }
    };
    checkGroups();
  }, [currentUser?.name]);

  const fetchActivity = async () => {
    try {
      const res = await fetch('/api/heartbeat');
      if (res.ok) {
        const data = await res.json();
        setCounts(data.counts || [0, 0, 0, 0, 0, 0, 0]);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isInGroup) return;
    fetchActivity();
    intervalRef.current = setInterval(fetchActivity, 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isInGroup]);

  if (!isInGroup || isLoading) return null;

  const maxCount = Math.max(...counts, 1);
  const points = counts.map((c, i) => ({
    x: (i / 6) * 162 + 2,
    y: 44 - (c / maxCount) * 40,
  }));
  const pathD = points.map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x},${p.y}`).join(' ');
  const lastPt = points[points.length - 1];
  const peakIdx = counts.indexOf(Math.max(...counts));
  const totalKudos = counts.reduce((a, b) => a + b, 0);

  return (
    <>
      <style>{HB_PULSE_STYLE}</style>
      <div
        style={{
          background: 'rgba(20,10,35,0.8)',
          border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: 10,
          padding: 11,
          marginBottom: 10,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#a78bfa',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            💓 Team Heartbeat
          </span>
          <span
            style={{
              fontSize: 9,
              color: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#22c55e',
                display: 'inline-block',
                boxShadow: '0 0 4px #22c55e',
                animation: 'hbPulse 1.5s ease-in-out infinite',
              }}
            />
            Live
          </span>
        </div>

        {/* SVG Graph */}
        <svg
          viewBox="0 0 166 48"
          width="100%"
          height="48"
          style={{ display: 'block', overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="hb-fill-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Fill area */}
          <path
            d={`${pathD} L166,48 L0,48 Z`}
            fill="url(#hb-fill-grad)"
          />

          {/* Line */}
          <path
            d={pathD}
            stroke="#8b5cf6"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Animated dot at last point */}
          <circle
            cx={lastPt.x}
            cy={lastPt.y}
            r="3"
            fill="#a78bfa"
            style={{ animation: 'hbPulse 1.5s ease-in-out infinite' }}
          />
        </svg>

        {/* Day labels */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 4,
          }}
        >
          {DAY_LABELS.map((label) => (
            <span key={label} style={{ fontSize: 8, color: '#555' }}>
              {label}
            </span>
          ))}
        </div>

        {/* Peak */}
        {totalKudos > 0 && (
          <div
            style={{
              fontSize: 8,
              color: '#a78bfa',
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            ⚡ Peak · {DAY_LABELS[peakIdx]} · {Math.max(...counts)} kudos
          </div>
        )}
      </div>
    </>
  );
}
