'use client';

import React, { useEffect, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { expertTourSteps, customerTourSteps } from './tourSteps';
import { useAuthStore } from '@/store/auth-store';

interface OnboardingTourProps {
  userType: 'customer' | 'expert' | 'admin';
}

export default function OnboardingTour({ userType }: OnboardingTourProps) {
  const { user } = useAuthStore();
  const [isDesktop, setIsDesktop] = useState(false);

  // Check if desktop on mount and window resize
  useEffect(() => {
    const checkIfDesktop = () => {
      // Match your md: breakpoint (992px)
      const desktop = window.innerWidth >= 992;
      setIsDesktop(desktop);
      console.log('📱 Screen size check:', window.innerWidth, 'px -', desktop ? 'DESKTOP' : 'MOBILE');
    };

    // Check on mount
    checkIfDesktop();

    // Check on resize
    window.addEventListener('resize', checkIfDesktop);
    return () => window.removeEventListener('resize', checkIfDesktop);
  }, []);

  useEffect(() => {
    // Only run on desktop with authenticated user
    if (user?.id && isDesktop) {
      console.log('🎯 Desktop detected - checking onboarding status...');
      checkAndStartTour();
    } else if (user?.id && !isDesktop) {
      console.log('📱 Mobile detected - skipping onboarding tour (will show on desktop)');
    }
  }, [user?.id, userType, isDesktop]);

  const checkAndStartTour = async () => {
    if (!user?.id) return;

    try {
      // Check onboarding status via API
      const response = await fetch('/api/onboarding');
      const data = await response.json();

      console.log('📊 Onboarding status:', data);

      if (!data.completed) {
        console.log('🚀 Starting desktop tour!');
        
        // Create record if it doesn't exist
        if (!data.exists) {
          console.log('💾 Creating onboarding record...');
          await fetch('/api/onboarding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'start' }),
          });
        }

        // Set steps based on user type
        const steps = userType === 'expert' ? expertTourSteps : customerTourSteps;
        
        // Delay for DOM readiness
        setTimeout(() => {
          console.log('⏰ Starting tour now...');
          startTour(steps);
        }, 2000);
      } else {
        console.log('✅ Onboarding completed, skipping tour');
      }
    } catch (error) {
      console.error('❌ Error checking onboarding:', error);
    }
  };

  const startTour = (steps: any[]) => {
    try {
      const driverObj = driver({
        showProgress: true,
        steps: steps,
        allowClose: false,  // ← ADD THIS: Can't close with X button
        onDestroyed: async () => {
          console.log('🏁 Tour completed');
          // Mark as complete via API
          await fetch('/api/onboarding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'complete' }),
          });
        },
        popoverClass: 'driverjs-theme',
        nextBtnText: 'Next →',
        prevBtnText: '← Back',
        doneBtnText: 'Finish! 🎉',
      });
  
      driverObj.drive();
      console.log('✅ Tour started!');
    } catch (error) {
      console.error('❌ Error starting tour:', error);
    }
  };

  if (userType === 'admin') return null;
  return null;
}