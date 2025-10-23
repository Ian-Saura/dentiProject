import React from 'react';

interface MannyLogoProps {
  width?: number;
  height?: number;
  showText?: boolean;
  className?: string;
}

const MannyLogo: React.FC<MannyLogoProps> = ({ 
  width = 200, 
  height = 200, 
  showText = true,
  className = "" 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Logo Icon */}
      <svg 
        width={width} 
        height={height * 0.6} 
        viewBox="0 0 200 150" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="barGradientLogo" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#C026D3', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#6366F1', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#0EA5E9', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="curveGradientLogo" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#0EA5E9', stopOpacity: 0.9 }} />
            <stop offset="50%" style={{ stopColor: '#6366F1', stopOpacity: 0.9 }} />
            <stop offset="100%" style={{ stopColor: '#10B981', stopOpacity: 0.9 }} />
          </linearGradient>
        </defs>
        
        {/* Background bars */}
        <rect x="30" y="80" width="16" height="60" rx="4" fill="url(#barGradientLogo)" opacity="0.8"/>
        <rect x="52" y="68" width="16" height="72" rx="4" fill="url(#barGradientLogo)" opacity="0.85"/>
        <rect x="74" y="58" width="16" height="82" rx="4" fill="url(#barGradientLogo)" opacity="0.9"/>
        <rect x="96" y="48" width="16" height="92" rx="4" fill="url(#barGradientLogo)" opacity="0.95"/>
        <rect x="118" y="72" width="16" height="68" rx="4" fill="url(#barGradientLogo)" opacity="0.9"/>
        <rect x="140" y="62" width="16" height="78" rx="4" fill="url(#barGradientLogo)" opacity="0.85"/>
        <rect x="162" y="54" width="16" height="86" rx="4" fill="url(#barGradientLogo)" opacity="0.8"/>
        
        {/* Growth curve */}
        <path 
          d="M 30 120 Q 60 110, 80 85 T 140 45 L 180 20" 
          stroke="url(#curveGradientLogo)" 
          strokeWidth="10" 
          fill="none" 
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
        
        {/* Sparkles */}
        <g transform="translate(170, 15)">
          {/* Main sparkle */}
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
          {/* Small sparkle */}
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
        </g>
      </svg>
      
      {/* Text */}
      {showText && (
        <div className="mt-2 text-center">
          <h1 className="text-5xl font-black text-gray-900" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            Manny
          </h1>
          <p className="text-lg text-gray-500 mt-1" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '0.05em' }}>
            www.manny.com.ar
          </p>
        </div>
      )}
    </div>
  );
};

export default MannyLogo;







