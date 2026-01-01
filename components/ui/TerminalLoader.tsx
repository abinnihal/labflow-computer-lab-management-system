
import React, { useState, useEffect } from 'react';

interface TerminalLoaderProps {
  progress?: number;
  text?: string;
  duration?: number; // Duration in ms for the auto-loader to reach 100%
}

const TerminalLoader: React.FC<TerminalLoaderProps> = ({ progress, text = "Labflow", duration = 2000 }) => {
  const [internalProgress, setInternalProgress] = useState(0);

  useEffect(() => {
    // Only auto-animate if progress prop is not provided
    if (progress !== undefined) return;

    const startTime = Date.now();
    // Use a small buffer to ensure we hit 100% cleanly
    const totalDuration = duration; 

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const nextProgress = Math.min((elapsed / totalDuration) * 100, 100);
      
      setInternalProgress(nextProgress);

      if (nextProgress >= 100) {
        clearInterval(interval);
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [progress, duration]);

  const currentProgress = progress !== undefined ? progress : internalProgress;
  const clampedProgress = Math.min(Math.max(currentProgress, 0), 100);

  // SVG Wave Path
  // 1200x1200. Top half transparent, bottom half filled black.
  const wavePath = "M0 600 Q 150 400 300 600 T 600 600 T 900 600 T 1200 600 V 1200 H 0 Z";
  
  // Base64 SVG for CSS mask
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200" preserveAspectRatio="none"><path d="${wavePath}" fill="black"/></svg>`;
  const waveUrl = `url("data:image/svg+xml;base64,${btoa(svgString)}")`;

  return (
    <div className="flex flex-col items-center justify-center w-full py-8 min-h-[200px]">
      <style>
        {`
          @keyframes wave-front {
            0% { mask-position: 0% var(--mask-y); -webkit-mask-position: 0% var(--mask-y); }
            100% { mask-position: 100% var(--mask-y); -webkit-mask-position: 100% var(--mask-y); }
          }
          @keyframes wave-back {
            0% { mask-position: 100% var(--mask-y); -webkit-mask-position: 100% var(--mask-y); }
            100% { mask-position: 0% var(--mask-y); -webkit-mask-position: 0% var(--mask-y); }
          }
        `}
      </style>

      {/* 
         --mask-y controls the fill level.
         0% = Empty (Mask aligned to top/transparent part)
         100% = Full (Mask aligned to bottom/filled part)
      */}
      <div className="relative select-none" style={{ '--mask-y': `${clampedProgress}%` } as React.CSSProperties}>
        
        {/* Layer 1: Background Text (Empty State) */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter uppercase text-slate-200 dark:text-slate-800 transition-colors">
          {text}
        </h1>

        {/* Layer 2: Back Wave (Depth) */}
        <h1 
          className="absolute top-0 left-0 text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter uppercase text-blue-700 dark:text-blue-600 opacity-30"
          style={{
            maskImage: waveUrl,
            WebkitMaskImage: waveUrl,
            maskSize: '200% 200%',
            WebkitMaskSize: '200% 200%',
            maskRepeat: 'repeat-x no-repeat',
            WebkitMaskRepeat: 'repeat-x no-repeat',
            animation: 'wave-back 4s linear infinite',
          }}
          aria-hidden="true"
        >
          {text}
        </h1>

        {/* Layer 3: Front Wave (Main Fill) */}
        <h1 
          className="absolute top-0 left-0 text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter uppercase text-blue-500 dark:text-blue-400"
          style={{
            maskImage: waveUrl,
            WebkitMaskImage: waveUrl,
            maskSize: '200% 200%',
            WebkitMaskSize: '200% 200%',
            maskRepeat: 'repeat-x no-repeat',
            WebkitMaskRepeat: 'repeat-x no-repeat',
            animation: 'wave-front 2s linear infinite',
          }}
          aria-hidden="true"
        >
          {text}
        </h1>
      </div>

      {/* Percentage Indicator */}
      <div className="mt-6 font-mono text-xs sm:text-sm text-blue-500/80 dark:text-blue-400/80 tracking-[0.3em] font-bold animate-pulse">
        LOADING <span className="tabular-nums">{Math.round(clampedProgress)}%</span>
      </div>
    </div>
  );
};

export default TerminalLoader;
