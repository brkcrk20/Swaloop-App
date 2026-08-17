import React from 'react';

interface SwaloopLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon-only' | 'white';
  showSlogan?: boolean;
}

export const SwaloopLogo: React.FC<SwaloopLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  showSlogan = false,
}) => {
  const sizeMap = {
    sm: { height: '24px', fontSize: 'text-lg', iconSize: 22 },
    md: { height: '32px', fontSize: 'text-2xl', iconSize: 28 },
    lg: { height: '44px', fontSize: 'text-3xl', iconSize: 38 },
    xl: { height: '60px', fontSize: 'text-4xl', iconSize: 52 },
  };

  const isWhite = variant === 'white';
  const textColor = isWhite ? 'text-white' : 'text-emerald-950';

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <div className="inline-flex items-center gap-1.5 font-display font-extrabold tracking-tight select-none">
        {variant === 'icon-only' ? (
          <CircularExchangeIcon size={sizeMap[size].iconSize} />
        ) : (
          <div className="flex items-center">
            <span className={`${textColor} ${sizeMap[size].fontSize} tracking-tighter font-extrabold`}>
              swal
            </span>
            {/* The circular dual loop replaces "oo" */}
            <div className="inline-flex items-center mx-0.5 transform translate-y-[1px]">
              <CircularExchangeIcon size={sizeMap[size].iconSize} />
            </div>
            <span className={`${textColor} ${sizeMap[size].fontSize} tracking-tighter font-extrabold`}>
              p
            </span>
          </div>
        )}
      </div>
      {showSlogan && (
        <span
          className={`text-xs font-medium tracking-wide mt-0.5 ${
            isWhite ? 'text-emerald-100/90' : 'text-stone-600'
          }`}
        >
          Satma. Takas et. Yeniden kullan.
        </span>
      )}
    </div>
  );
};

export const CircularExchangeIcon: React.FC<{
  size?: number;
  className?: string;
  animate?: boolean;
}> = ({ size = 28, className = '', animate = false }) => {
  return (
    <svg
      width={size * 1.6}
      height={size}
      viewBox="0 0 54 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block ${animate ? 'animate-pulse' : ''} ${className}`}
    >
      {/* Left Loop: Natural Deep Emerald Green (#047857) */}
      <path
        d="M17 6C10.9249 6 6 10.4772 6 16C6 21.5228 10.9249 26 17 26C23.0751 26 27.5 19.5 32 12.5C36.5 5.5 40.9249 6 47 6"
        stroke="#047857"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right Loop: Warm Saffron Amber / Orange (#f59e0b) */}
      <path
        d="M37 26C43.0751 26 48 21.5228 48 16C48 10.4772 43.0751 6 37 6C30.9249 6 26.5 12.5 22 19.5C17.5 26.5 13.0751 26 7 26"
        stroke="#f59e0b"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Interlocking knot accents */}
      <circle cx="17" cy="16" r="3.2" fill="#047857" />
      <circle cx="37" cy="16" r="3.2" fill="#f59e0b" />
    </svg>
  );
};
