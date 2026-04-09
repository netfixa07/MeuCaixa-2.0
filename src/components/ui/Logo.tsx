import React from 'react';
import { cn } from '../../lib/utils';

interface LogoProps {
  className?: string;
  iconClassName?: string;
  showText?: boolean;
}

export const Logo = ({ className = "w-full h-full", showText = true }: LogoProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <svg viewBox="0 0 100 130" className="w-full h-full drop-shadow-sm" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
        {/* Feet */}
        <path d="M 28 80 L 28 84 Q 28 86 31 86 L 37 86 Q 40 86 40 84 L 40 80 Z" fill="#2a486a" />
        <path d="M 60 80 L 60 84 Q 60 86 63 86 L 69 86 Q 72 86 72 84 L 72 80 Z" fill="#2a486a" />
        
        {/* Main Safe Body (Outer) */}
        <rect x="15" y="15" width="70" height="65" rx="14" fill="#39628b" />
        
        {/* Main Safe Body (Inner) */}
        <rect x="20" y="20" width="60" height="55" rx="10" fill="#2a486a" />
        
        {/* White Outline */}
        <rect x="23" y="23" width="54" height="49" rx="7" fill="none" stroke="#ffffff" strokeWidth="2.5" />
        
        {/* Hinges */}
        <rect x="19" y="32" width="5" height="10" rx="2" fill="#ffffff" />
        <rect x="19" y="53" width="5" height="10" rx="2" fill="#ffffff" />
        
        {/* Green Bars */}
        <rect x="33" y="52" width="8" height="20" rx="3" fill="#6eb473" />
        <rect x="46" y="42" width="8" height="30" rx="3" fill="#6eb473" />
        <rect x="59" y="32" width="8" height="40" rx="3" fill="#6eb473" />

        {/* Text */}
        {showText && (
          <>
            <text x="50" y="105" fontFamily="Playfair Display, serif" fontSize="22" fontWeight="bold" fill="currentColor" textAnchor="middle" className="text-[#0d2b4b] dark:text-blue-50">MEU</text>
            <text x="50" y="125" fontFamily="Playfair Display, serif" fontSize="24" fontWeight="bold" fill="currentColor" textAnchor="middle" className="text-[#0d2b4b] dark:text-blue-50">CAIXA</text>
          </>
        )}
      </svg>
    </div>
  );
};
