import React from 'react';

export interface DormiqaLogoProps {
  variant?: 'full' | 'icon';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showSubtext?: boolean;
  className?: string;
  pinColor?: string;
  roofColor?: string;
  textColor?: string;
}

export const DormiqaLogo: React.FC<DormiqaLogoProps> = ({
  variant = 'full',
  size = 'md',
  showSubtext = true,
  className = '',
  pinColor,
  roofColor = '#ffffff',
  textColor
}) => {
  const iconSizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-16 h-16'
  };

  const textSizes = {
    xs: 'text-base',
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl'
  };

  const subtextSizes = {
    xs: 'text-[7px]',
    sm: 'text-[8px]',
    md: 'text-[9px]',
    lg: 'text-[10px]',
    xl: 'text-[12px]'
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Location Pin Logo Icon */}
      <div className={`${iconSizes[size]} shrink-0 transition-transform group-hover:scale-105`}>
        <svg
          viewBox="50 10 400 500"
          className="w-full h-full drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Location Pin Marker */}
          <path
            fill={pinColor || 'currentColor'}
            d="M 250 20 C 145 20 60 105 60 210 C 60 335 225 488 243 504 C 247 508 253 508 257 504 C 275 488 440 335 440 210 C 440 105 355 20 250 20 Z"
            className={!pinColor ? 'text-slate-900 dark:text-emerald-500' : ''}
          />

          {/* Top Inner Circle Arch */}
          <path
            fill="none"
            stroke={roofColor}
            strokeWidth="20"
            strokeLinecap="round"
            d="M 148 212 A 102 102 0 0 1 352 212"
          />

          {/* Main Top Roof Gable */}
          <path
            fill={roofColor}
            d="M 250 115 L 350 195 L 332 210 L 250 145 L 168 210 L 150 195 Z"
          />

          {/* Secondary Lower Roof Line */}
          <path
            fill={roofColor}
            d="M 250 156 L 318 210 L 302 223 L 250 181 L 198 223 L 182 210 Z"
          />

          {/* Chimney */}
          <rect
            fill={roofColor}
            x="290"
            y="138"
            width="18"
            height="34"
            rx="2"
          />
        </svg>
      </div>

      {/* Brand Wordmark & Tagline */}
      {variant === 'full' && (
        <div className="flex flex-col leading-none">
          <span
            className={`${textSizes[size]} font-black tracking-tight uppercase ${
              textColor || 'text-black dark:text-white'
            }`}
          >
            DORMIQA
          </span>
          {showSubtext && (
            <span
              className={`${subtextSizes[size]} font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-0.5`}
            >
              Student Housing
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export const CamporaLogo = DormiqaLogo;
