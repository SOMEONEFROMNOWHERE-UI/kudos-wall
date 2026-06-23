'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { KudosData, UserProfile } from '@/types';

interface LiveState {
  presenceUsers: string[];
  todayCount: number;
  reactions: Record<string, Record<string, number>>; // kudosId -> { emoji -> count }
}

interface KudosContextType {
  currentUser: UserProfile | null;
  kudosList: KudosData[];
  totalCount: number;
  isLoading: boolean;
  live: LiveState;
  login: (name: string) => Promise<void>;
  logout: () => void;
  addKudos: (kudos: Omit<KudosData, '_id' | 'createdAt'>) => Promise<void>;
  refreshKudos: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const KudosContext = createContext<KudosContextType | undefined>(undefined);

export const KudosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [kudosList, setKudosList] = useState<KudosData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [live, setLive] = useState<LiveState>({ presenceUsers: [], todayCount: 0, reactions: {} });
  const sseRef = useRef<EventSource | null>(null);
  const userRef = useRef<UserProfile | null>(null);

  // Keep ref in sync
  useEffect(() => { userRef.current = currentUser; }, [currentUser]);

  // Restore user from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('kudoswall_user');
    if (saved) {
      try { setCurrentUser(JSON.parse(saved)); } catch { localStorage.removeItem('kudoswall_user'); }
    }
    setIsLoading(false);
  }, []);

  // Fetch kudos
  const refreshKudos = useCallback(async () => {
    try {
      const res = await fetch('/api/kudos?limit=100');
      if (res.ok) setKudosList(await res.json());
    } catch (err) { console.error('Failed to fetch kudos:', err); }
  }, []);

  // Fetch total count
  const refreshCount = useCallback(async () => {
    try {
      const res = await fetch('/api/kudos?count=true');
      if (res.ok) { const d = await res.json(); setTotalCount(d.count); }
    } catch { /* ignore */ }
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    const u = userRef.current;
    if (!u?.name) return;
    try {
      const res = await fetch(`/api/users?name=${encodeURIComponent(u.name)}`);
      if (res.ok) {
        const data = await res.json();
        const updated: UserProfile = { _id: data._id, name: data.name, streak: data.streak, lastKudosGiven: data.lastKudosGiven };
        setCurrentUser(updated);
        localStorage.setItem('kudoswall_user', JSON.stringify(updated));
      }
    } catch { /* ignore */ }
  }, []);

  // SSE connection
  useEffect(() => {
    if (!currentUser?.name) return;

    const connect = () => {
      if (sseRef.current) sseRef.current.close();
      const es = new EventSource(`/api/events?user=${encodeURIComponent(currentUser.name)}`);
      sseRef.current = es;

      es.addEventListener('init', (e) => {
        const { presence, todayCount, reactions } = JSON.parse(e.data);
        setLive({ presenceUsers: presence, todayCount, reactions });
      });

      es.addEventListener('presence', (e) => {
        const { users } = JSON.parse(e.data);
        setLive(prev => ({ ...prev, presenceUsers: users }));
      });

      es.addEventListener('reaction', (e) => {
        const { kudosId, counts } = JSON.parse(e.data);
        setLive(prev => ({
          ...prev,
          reactions: { ...prev.reactions, [kudosId]: counts },
        }));
      });

      es.addEventListener('new_kudos', (e) => {
        const kudos = JSON.parse(e.data);
        setKudosList(prev => {
          if (prev.some(k => k._id === kudos._id)) return prev;
          return [kudos, ...prev];
        });
        setTotalCount(prev => prev + 1);
      });

      es.addEventListener('pulse', (e) => {
        const { todayCount } = JSON.parse(e.data);
        setLive(prev => ({ ...prev, todayCount }));
      });

      es.onerror = () => {
        es.close();
        // Reconnect after 5s
        setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      sseRef.current?.close();
      sseRef.current = null;
    };
  }, [currentUser?.name]);

  // Initial fetch + 30s poll fallback
  useEffect(() => {
    refreshKudos();
    refreshCount();
    const interval = setInterval(() => { refreshKudos(); refreshCount(); }, 30000);
    return () => clearInterval(interval);
  }, [refreshKudos, refreshCount]);

  const login = async (name: string) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      const user: UserProfile = { _id: data._id, name: data.name, streak: data.streak, lastKudosGiven: data.lastKudosGiven };
      setCurrentUser(user);
      localStorage.setItem('kudoswall_user', JSON.stringify(user));
    } else {
      throw new Error('Login failed');
    }
  };

  const logout = () => {
    sseRef.current?.close();
    sseRef.current = null;
    setCurrentUser(null);
    localStorage.removeItem('kudoswall_user');
  };

  const addKudos = async (kudosData: Omit<KudosData, '_id' | 'createdAt'>) => {
    const res = await fetch('/api/kudos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(kudosData),
    });
    if (res.ok) {
      const newKudos = await res.json();
      // Optimistic update
      setKudosList(prev => {
        if (prev.some(k => k._id === newKudos._id)) return prev;
        return [newKudos, ...prev];
      });
      setTotalCount(prev => prev + 1);
      setTimeout(refreshUser, 800);
    } else {
      const err = await res.json();
      throw new Error(err.error || 'Failed to send kudos');
    }
  };

  return (
    <KudosContext.Provider value={{ currentUser, kudosList, totalCount, isLoading, live, login, logout, addKudos, refreshKudos, refreshUser }}>
      {children}
    </KudosContext.Provider>
  );
};

export const useKudos = () => {
  const ctx = useContext(KudosContext);
  if (!ctx) throw new Error('useKudos must be used within KudosProvider');
  return ctx;
};
