'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
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
  login: () => Promise<void>;
  logout: () => Promise<void>;
  addKudos: (kudos: Omit<KudosData, '_id' | 'createdAt'>) => Promise<void>;
  updateKudos: (id: string, message: string) => Promise<void>;
  deleteKudos: (id: string) => Promise<void>;
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

  const { data: session, status } = useSession();

  // Keep ref in sync
  useEffect(() => { userRef.current = currentUser; }, [currentUser]);

  // Restore user from session
  useEffect(() => {
    if (status === 'loading') return;
    if (session?.user?.name) {
      fetch(`/api/users?name=${encodeURIComponent(session.user.name)}`)
        .then(res => res.json())
        .then(data => {
          setCurrentUser({
            _id: data._id,
            name: session.user!.name!,
            image: session.user!.image || undefined,
            streak: data.streak,
            lastKudosGiven: data.lastKudosGiven
          });
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    } else {
      setCurrentUser(null);
      setIsLoading(false);
    }
  }, [session, status]);

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
        const updated: UserProfile = { 
          _id: data._id, 
          name: u.name,
          image: u.image,
          streak: data.streak, 
          lastKudosGiven: data.lastKudosGiven 
        };
        setCurrentUser(updated);
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

  const login = async () => {
    await signIn('google');
  };

  const logout = async () => {
    sseRef.current?.close();
    sseRef.current = null;
    setCurrentUser(null);
    await signOut();
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

  const updateKudos = async (id: string, message: string) => {
    const res = await fetch(`/api/kudos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (res.ok) {
      const updated = await res.json();
      setKudosList(prev => prev.map(k => k._id === id ? { ...k, message: updated.message } : k));
    } else {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update kudos');
    }
  };

  const deleteKudos = async (id: string) => {
    const res = await fetch(`/api/kudos/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setKudosList(prev => prev.filter(k => k._id !== id));
      setTotalCount(prev => prev - 1);
    } else {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete kudos');
    }
  };

  return (
    <KudosContext.Provider value={{ currentUser, kudosList, totalCount, isLoading, live, login, logout, addKudos, updateKudos, deleteKudos, refreshKudos, refreshUser }}>
      {children}
    </KudosContext.Provider>
  );
};

export const useKudos = () => {
  const ctx = useContext(KudosContext);
  if (!ctx) throw new Error('useKudos must be used within KudosProvider');
  return ctx;
};
