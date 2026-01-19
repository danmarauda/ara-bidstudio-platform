'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function TombBackground({
  showAccentGlow = true,
}: {
  showAccentGlow?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch by not rendering theme-dependent content until mounted
  if (!mounted) {
    return null;
  }

  const isDark = resolvedTheme === 'dark';

  const getBackgroundGradient = () => {
    if (isDark) {
      // Dark tomb stone gradient
      return `linear-gradient(
        135deg,
        #2c1810 0%,
        #3d2415 25%,
        #4a2c1a 50%,
        #3d2415 75%,
        #2c1810 100%
      )`;
    }
    // Light sandy stone gradient
    return `linear-gradient(
        135deg,
        #F5F2E8 0%,
        #EDE7D3 25%,
        #E8DCC0 50%,
        #DDD4B8 75%,
        #D4C8A8 100%
      )`;
  };

  const getTextureOverlay = () => {
    if (isDark) {
      return `
        radial-gradient(ellipse at 20% 50%, rgba(139, 106, 74, 0.3) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 20%, rgba(160, 122, 87, 0.2) 0%, transparent 50%),
        radial-gradient(ellipse at 40% 80%, rgba(120, 89, 60, 0.25) 0%, transparent 50%),
        linear-gradient(
          90deg,
          rgba(92, 69, 47, 0.1) 0%,
          rgba(120, 89, 60, 0.15) 50%,
          rgba(92, 69, 47, 0.1) 100%
        )
      `;
    }
    return `
        radial-gradient(ellipse at 20% 50%, rgba(205, 133, 63, 0.15) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 20%, rgba(180, 135, 81, 0.12) 0%, transparent 50%),
        radial-gradient(ellipse at 40% 80%, rgba(160, 120, 87, 0.18) 0%, transparent 50%),
        linear-gradient(
          90deg,
          rgba(139, 119, 89, 0.08) 0%,
          rgba(180, 135, 81, 0.12) 50%,
          rgba(139, 119, 89, 0.08) 100%
        )
      `;
  };

  const getRidgeGradient = () => {
    if (isDark) {
      return `linear-gradient(
        90deg,
        transparent 0%,
        rgba(0, 0, 0, 0.5) 10%,
        rgba(0, 0, 0, 0.3) 50%,
        rgba(0, 0, 0, 0.5) 90%,
        transparent 100%
      )`;
    }
    return `linear-gradient(
        90deg,
        transparent 0%,
        rgba(139, 119, 89, 0.3) 10%,
        rgba(139, 119, 89, 0.15) 50%,
        rgba(139, 119, 89, 0.3) 90%,
        transparent 100%
      )`;
  };

  const getWeatheringColor = (alpha: number) => {
    if (isDark) {
      return `rgba(0, 0, 0, ${alpha})`;
    }
    return `rgba(139, 119, 89, ${alpha * 0.6})`;
  };

  const getCrackStroke = (alpha: number) => {
    if (isDark) {
      return `rgba(0, 0, 0, ${alpha})`;
    }
    return `rgba(139, 119, 89, ${alpha * 0.8})`;
  };

  return (
    <div className="absolute inset-0 z-0 transition-all duration-700">
      {/* Base tomb wall gradient */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: getBackgroundGradient(),
        }}
      />

      {/* Stone texture overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${isDark ? 'opacity-20' : 'opacity-15'}`}
        style={{
          background: getTextureOverlay(),
        }}
      />

      {/* Carved stone ridges */}
      <div className="absolute inset-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            className={`absolute w-full transition-opacity duration-700 ${isDark ? 'opacity-10' : 'opacity-8'}`}
            key={i}
            style={{
              height: '2px',
              top: `${12 + i * 12}%`,
              background: getRidgeGradient(),
              transform: `translateX(${Math.sin(i * 0.5) * 20}px)`,
            }}
          />
        ))}
      </div>

      {/* Ancient weathering marks */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${isDark ? 'opacity-30' : 'opacity-20'}`}
      >
        <div
          className="absolute transition-all duration-700"
          style={{
            top: '15%',
            left: '10%',
            width: '15%',
            height: '8%',
            background: `radial-gradient(ellipse, ${getWeatheringColor(0.2)} 0%, transparent 70%)`,
            transform: 'rotate(-15deg)',
          }}
        />
        <div
          className="absolute transition-all duration-700"
          style={{
            top: '60%',
            right: '15%',
            width: '20%',
            height: '12%',
            background: `radial-gradient(ellipse, ${getWeatheringColor(0.15)} 0%, transparent 70%)`,
            transform: 'rotate(25deg)',
          }}
        />
        <div
          className="absolute transition-all duration-700"
          style={{
            bottom: '20%',
            left: '20%',
            width: '25%',
            height: '10%',
            background: `radial-gradient(ellipse, ${getWeatheringColor(0.1)} 0%, transparent 70%)`,
            transform: 'rotate(-8deg)',
          }}
        />
      </div>

      {/* Subtle crack patterns */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${isDark ? 'opacity-20' : 'opacity-15'}`}
      >
        <svg
          aria-hidden="true"
          className="h-full w-full transition-all duration-700"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <path
            className="transition-all duration-700"
            d="M15,10 Q25,15 35,12 T55,18 L65,25 Q70,30 75,28"
            fill="none"
            stroke={getCrackStroke(0.3)}
            strokeWidth="0.1"
          />
          <path
            className="transition-all duration-700"
            d="M80,40 Q75,50 70,55 T50,65 L40,75 Q35,80 30,78"
            fill="none"
            stroke={getCrackStroke(0.2)}
            strokeWidth="0.1"
          />
          <path
            className="transition-all duration-700"
            d="M5,60 Q15,65 25,62 T45,68 L55,75"
            fill="none"
            stroke={getCrackStroke(0.25)}
            strokeWidth="0.1"
          />
        </svg>
      </div>

      {/* Optional accent glow layer (can be disabled) */}
      {showAccentGlow && (
        <div
          className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${isDark ? 'opacity-5' : 'opacity-3'}`}
        >
          <div
            className="absolute top-1/4 left-1/3 h-32 w-32 blur-3xl transition-all duration-1000"
            style={{
              background:
                'radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%)',
              animation: 'pulse 4s ease-in-out infinite',
            }}
          />
          <div
            className="absolute right-1/4 bottom-1/3 h-40 w-40 blur-3xl transition-all duration-1000"
            style={{
              background:
                'radial-gradient(circle, rgba(205, 133, 63, 0.08) 0%, transparent 70%)',
              animation: 'pulse 6s ease-in-out infinite reverse',
            }}
          />
        </div>
      )}
    </div>
  );
}
