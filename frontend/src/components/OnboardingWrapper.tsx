import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SplashScreen from './SplashScreen';

interface OnboardingWrapperProps {
  children: React.ReactNode;
}

// Key to track if splash was shown in this session
const SESSION_SPLASH_KEY = 'splash_shown_session_' + Date.now();

export default function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const { user, isAuthenticated } = useAuth();
  const [showSplash, setShowSplash] = useState(false);

  // Splash screen disabled
  // useEffect(() => {
  //   if (isAuthenticated && user) {
  //     // Check if splash was already shown in this session
  //     const splashShown = sessionStorage.getItem('splash_shown');
  //     
  //     // Check if user is not on the landing/login/register pages
  //     const isOnPublicPage = window.location.pathname === '/' || 
  //                            window.location.pathname === '/login' || 
  //                            window.location.pathname === '/register';
  //     
  //     console.log('OnboardingWrapper check:', {
  //       isAuthenticated,
  //       hasUser: !!user,
  //       splashShown,
  //       isOnPublicPage,
  //       currentPath: window.location.pathname
  //     });
  //     
  //     if (!splashShown && !isOnPublicPage) {
  //       console.log('Showing splash screen!');
  //       // Mark as shown in sessionStorage (clears on browser close/tab close)
  //       sessionStorage.setItem('splash_shown', 'true');
  //       
  //       // Longer delay to ensure smooth transition after login redirect
  //       const timer = setTimeout(() => {
  //         setShowSplash(true);
  //       }, 500);
  //       
  //       return () => clearTimeout(timer);
  //     }
  //   }
  // }, [isAuthenticated, user]);

  const handleCloseSplash = () => {
    setShowSplash(false);
  };

  return (
    <>
      {children}
      {/* Splash screen disabled */}
      {/* <SplashScreen
        isOpen={showSplash}
        onClose={handleCloseSplash}
        userName={user?.nombre || user?.username}
      /> */}
    </>
  );
}















