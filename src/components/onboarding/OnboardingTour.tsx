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

  useEffect(() => {
    const checkIfDesktop = () => {
      const desktop = window.innerWidth >= 992;
      setIsDesktop(desktop);
      console.log('📱 Screen size check:', window.innerWidth, 'px -', desktop ? 'DESKTOP' : 'MOBILE');
    };

    checkIfDesktop();
    window.addEventListener('resize', checkIfDesktop);
    return () => window.removeEventListener('resize', checkIfDesktop);
  }, []);

  useEffect(() => {
    if (user?.id && isDesktop) {
      console.log('🎯 Desktop detected - checking onboarding status...');
      checkAndStartTour();
    } else if (user?.id && !isDesktop) {
      console.log('📱 Mobile detected - skipping onboarding tour');
    }
  }, [user?.id, userType, isDesktop]);

  const checkAndStartTour = async () => {
    if (!user?.id) return;

    try {
      // Pass user ID in query
      const response = await fetch(`/api/onboarding?userId=${user.id}`);
      const data = await response.json();
      console.log('📊 Onboarding status:', data);

      if (!data.completed) {
        console.log('🚀 Starting tour!');
        
        if (!data.exists) {
          console.log('💾 Creating onboarding record...');
          await fetch('/api/onboarding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'start',
              userId: user.id,
            }),
          });
        }

        const steps = userType === 'expert' ? expertTourSteps : customerTourSteps;
        
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
        allowClose: false,
        onDestroyed: async () => {
          console.log('🏁 Tour completed');
          if (!user?.id) return;
          
          await fetch('/api/onboarding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'complete',
              userId: user.id,
              userName: (user as any).user_metadata?.display_name || user.email?.split('@')[0],
              userEmail: user.email,
              userType: (user as any).user_metadata?.user_type || userType,
            }),
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