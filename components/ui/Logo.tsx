
import React from 'react';

interface LogoProps {
  className?: string; // Dimensions for the icon container, e.g., "w-10 h-10"
  textClassName?: string; // Classes for the text (size, color overrides)
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10", textClassName = "text-2xl", showText = true }) => {
  return (
    <div className="flex items-center gap-3">
      <div className={`${className} flex items-center justify-center`}>
         <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm transform transition-transform hover:scale-105 duration-300">
            <defs>
               <linearGradient id="gradL" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1e40af" /> {/* Dark Blue */}
                  <stop offset="100%" stopColor="#172554" />
               </linearGradient>
               <linearGradient id="gradF" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" /> {/* Light Blue */}
                  <stop offset="100%" stopColor="#2563eb" />
               </linearGradient>
            </defs>
            
            <g transform="skewX(-10) translate(15, 5)">
               {/* L Shape - Darker */}
               <path 
                 d="M 30 20 V 85 Q 30 100 45 100 H 90" 
                 stroke="url(#gradL)" 
                 strokeWidth="16" 
                 strokeLinecap="round" 
                 strokeLinejoin="round"
               />
               
               {/* F Shape - Lighter */}
               {/* Top & Vertical */}
               <path 
                 d="M 95 20 H 65 Q 55 20 55 30 V 65" 
                 stroke="url(#gradF)" 
                 strokeWidth="16" 
                 strokeLinecap="round" 
                 strokeLinejoin="round"
               />
               {/* Middle Bar */}
               <path 
                 d="M 55 60 H 85" 
                 stroke="url(#gradF)" 
                 strokeWidth="16" 
                 strokeLinecap="round" 
                 strokeLinejoin="round"
               />
            </g>
         </svg>
      </div>
      {showText && (
        <span className={`font-sans font-bold tracking-tight text-slate-900 dark:text-white select-none ${textClassName}`}>
          Labflow
        </span>
      )}
    </div>
  );
};

export default Logo;
