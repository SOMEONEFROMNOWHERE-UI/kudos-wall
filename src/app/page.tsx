'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useKudos } from '@/context/KudosContext';
import HeroLanding from '@/components/HeroLanding';

export default function HomePage() {
  const { currentUser, isLoading } = useKudos();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && currentUser) {
      router.replace('/feed');
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

  if (currentUser) {
    return null; // Redirecting
  }

  return <HeroLanding />;
}
