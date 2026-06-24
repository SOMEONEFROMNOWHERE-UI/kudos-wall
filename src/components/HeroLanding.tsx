'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import HeroSection from './landing/HeroSection';
import IntroAnimation from './landing/IntroAnimation';
import HowItWorks from './landing/HowItWorks';
import WallPreview from './landing/WallPreview';
import FeaturesGrid from './landing/FeaturesGrid';
import SocialProof from './landing/SocialProof';
import CTASection from './landing/CTASection';
import Footer from './landing/Footer';

export default function HeroLanding() {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem('hasSeenIntro');
    if (hasSeenIntro) {
      setShowIntro(false);
    }
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
    sessionStorage.setItem('hasSeenIntro', 'true');
  };

  return (
    <main style={{ backgroundColor: '#0a0a0f', color: '#fff', minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}>
      <AnimatePresence mode="wait">
        {showIntro && <IntroAnimation key="intro" onComplete={handleIntroComplete} />}
      </AnimatePresence>
      <HeroSection />
    </main>
  );
}
