'use client';

import React, { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { expertTourSteps, customerTourSteps } from './tourSteps';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface OnboardingTourProps {
  userType: 'customer' | 'expert' | 'admin';
}

export default function OnboardingTour({ userType }: OnboardingTourProps) {
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkAndStartTour();
  }, [userType]);

  const checkAndStartTour = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if onboarding completed
      const { data: onboarding } = await supabase
        .from('user_onboarding')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .single();

      // If no record or not completed, start tour
      if (!onboarding || !onboarding.onboarding_completed) {
        // Create onboarding record if it doesn't exist
        if (!onboarding) {
          await supabase
            .from('user_onboarding')
            .insert({
              user_id: user.id,
              onboarding_started_at: new Date().toISOString(),
            });
        }

        // Set appropriate steps based on user type
        const steps = userType === 'expert' ? expertTourSteps : customerTourSteps;
        
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          startTour(steps, user.id);
        }, 1500);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const startTour = (steps: any[], userId: string) => {
    const driverObj = driver({
      showProgress: true,
      steps: steps,
      onDestroyed: async () => {
        // Mark onboarding as completed when tour ends
        try {
          await supabase
            .from('user_onboarding')
            .update({
              onboarding_completed: true,
              onboarding_completed_at: new Date().toISOString(),
            })
            .eq('user_id', userId);
        } catch (error) {
          console.error('Error marking onboarding complete:', error);
        }
      },
      popoverClass: 'driverjs-theme',
      nextBtnText: 'Next →',
      prevBtnText: '← Back',
      doneBtnText: 'Finish! 🎉',
    });

    driverObj.drive();
  };

  // Don't render for admin
  if (userType === 'admin') return null;

  return null; // Driver.js handles its own rendering
}