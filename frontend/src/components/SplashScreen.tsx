import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export default function SplashScreen({ isOpen, onClose, userName }: SplashScreenProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Show content after a brief delay
      const contentTimer = setTimeout(() => {
        setShowContent(true);
      }, 300);

      // Auto-close after 3 seconds
      const closeTimer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => {
        clearTimeout(contentTimer);
        clearTimeout(closeTimer);
      };
    } else {
      setShowContent(false);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-cyan-900"
      >
        <div className="flex flex-col items-center justify-center space-y-8">
          {/* Logo Icon */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 0.6, 
              delay: 0.1,
              type: "spring",
              stiffness: 200,
              damping: 20
            }}
          >
            <svg 
              width={200} 
              height={120} 
              viewBox="0 0 200 150" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-2xl"
            >
              <defs>
                <linearGradient id="barGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#C026D3', stopOpacity: 1 }} />
                  <stop offset="50%" style={{ stopColor: '#6366F1', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#0EA5E9', stopOpacity: 1 }} />
                </linearGradient>
                <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#0EA5E9', stopOpacity: 0.9 }} />
                  <stop offset="50%" style={{ stopColor: '#6366F1', stopOpacity: 0.9 }} />
                  <stop offset="100%" style={{ stopColor: '#10B981', stopOpacity: 0.9 }} />
                </linearGradient>
              </defs>
              
              {/* Background bars */}
              <motion.rect 
                x="30" y="80" width="16" height="60" rx="4" 
                fill="url(#barGradient)" 
                opacity="0.8"
                initial={{ height: 0, y: 140 }}
                animate={{ height: 60, y: 80 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              />
              <motion.rect 
                x="52" y="68" width="16" height="72" rx="4" 
                fill="url(#barGradient)" 
                opacity="0.85"
                initial={{ height: 0, y: 140 }}
                animate={{ height: 72, y: 68 }}
                transition={{ duration: 0.4, delay: 0.35 }}
              />
              <motion.rect 
                x="74" y="58" width="16" height="82" rx="4" 
                fill="url(#barGradient)" 
                opacity="0.9"
                initial={{ height: 0, y: 140 }}
                animate={{ height: 82, y: 58 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              />
              <motion.rect 
                x="96" y="48" width="16" height="92" rx="4" 
                fill="url(#barGradient)" 
                opacity="0.95"
                initial={{ height: 0, y: 140 }}
                animate={{ height: 92, y: 48 }}
                transition={{ duration: 0.4, delay: 0.45 }}
              />
              <motion.rect 
                x="118" y="72" width="16" height="68" rx="4" 
                fill="url(#barGradient)" 
                opacity="0.9"
                initial={{ height: 0, y: 140 }}
                animate={{ height: 68, y: 72 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              />
              <motion.rect 
                x="140" y="62" width="16" height="78" rx="4" 
                fill="url(#barGradient)" 
                opacity="0.85"
                initial={{ height: 0, y: 140 }}
                animate={{ height: 78, y: 62 }}
                transition={{ duration: 0.4, delay: 0.55 }}
              />
              <motion.rect 
                x="162" y="54" width="16" height="86" rx="4" 
                fill="url(#barGradient)" 
                opacity="0.8"
                initial={{ height: 0, y: 140 }}
                animate={{ height: 86, y: 54 }}
                transition={{ duration: 0.4, delay: 0.6 }}
              />
              
              {/* Growth curve */}
              <motion.path 
                d="M 30 120 Q 60 110, 80 85 T 140 45 L 180 20"
                stroke="url(#curveGradient)" 
                strokeWidth="10" 
                fill="none" 
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              />
              
              {/* Sparkles */}
              <motion.g 
                transform="translate(170, 15)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 1.2 }}
              >
                <path 
                  d="M 0,-10 L 2.5,-2.5 L 10,0 L 2.5,2.5 L 0,10 L -2.5,2.5 L -10,0 L -2.5,-2.5 Z" 
                  fill="#10B981" 
                  opacity="0.95"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 0 0"
                    to="360 0 0"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </path>
                <path 
                  d="M 14,-14 L 15.5,-11 L 18,-10 L 15.5,-9 L 14,-6 L 12.5,-9 L 10,-10 L 12.5,-11 Z" 
                  fill="#10B981" 
                  opacity="0.8"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="360 14 -10"
                    to="0 14 -10"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </path>
              </motion.g>
            </svg>
          </motion.div>

          {/* Brand Name */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <h1 className="text-7xl font-black text-white mb-4 tracking-tight" 
                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  Manny
                </h1>
                {userName && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl text-cyan-200 font-medium"
                  >
                    ¡Hola, {userName}!
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="flex space-x-2"
          >
            <motion.div
              className="w-3 h-3 bg-cyan-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: 0,
              }}
            />
            <motion.div
              className="w-3 h-3 bg-blue-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: 0.2,
              }}
            />
            <motion.div
              className="w-3 h-3 bg-purple-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: 0.4,
              }}
            />
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

