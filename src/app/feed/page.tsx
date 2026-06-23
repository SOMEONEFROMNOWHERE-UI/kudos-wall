'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useKudos } from '@/context/KudosContext';
import KudosFeed from '@/components/KudosFeed';

export default function FeedPage() {
  const { currentUser, isLoading } = useKudos();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace('/');
    }
  }, [currentUser, isLoading, router]);

  if (isLoading) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#050510',
        }}
      >
        <div className="animate-breathe" style={{ fontSize: '2rem' }}>
          ✨
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null; // Redirecting
  }

  return <KudosFeed />;
}
