'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useKudos } from '@/context/KudosContext';
import LoadingScreen from '@/components/LoadingScreen';
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
    return <LoadingScreen />;
  }

  if (!currentUser) {
    return null; // Redirecting
  }

  return <KudosFeed />;
}
