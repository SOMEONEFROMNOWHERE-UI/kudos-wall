'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useKudos } from '@/context/KudosContext';
import LoadingScreen from '@/components/LoadingScreen';
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
    return <LoadingScreen />;
  }

  if (currentUser) {
    return null; // Redirecting
  }

  return <HeroLanding />;
}
