// ============================================================
// SOUNDWAVE — Official Brand Logo SVG
// ============================================================
import React from 'react';

interface SoundwaveLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Show the circular cyan background (default: true for large, false for small) */
  withBackground?: boolean;
}

export function SoundwaveLogo({ size = 32, className, style, withBackground = true }: SoundwaveLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-56.32 -56.32 624.64 624.64"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      {/* Circular cyan background */}
      {withBackground && (
        <rect
          x="-56.32" y="-56.32"
          width="624.64" height="624.64"
          rx="312.32"
          fill="#7ed0ec"
        />
      )}

      {/* Headphone arc — dark navy */}
      <path
        fill="#1B3954"
        d="M256,86.4c-83.6,0-151.7,68-151.7,151.7v160.8h36.6V238.1
           c0-63.5,51.6-115.1,115.1-115.1c63.5,0,115.1,51.6,115.1,115.1v160.8h36.6
           V238.1C407.7,154.5,339.6,86.4,256,86.4z"
      />

      {/* Left ear cup */}
      <path
        fill="#16ADE1"
        d="M41.9,336.3c0,31.1,22.7,56.9,52.4,61.8V274.4
           c-13.2,2.2-25,8.5-34,17.5C48.9,303.3,41.9,318.9,41.9,336.3z"
      />

      {/* Right ear cup */}
      <path
        fill="#16ADE1"
        d="M451.7,291.9c-9.1-9-20.9-15.4-34.1-17.5v123.7
           c29.7-4.9,52.4-30.7,52.4-61.8C470.1,318.9,463.1,303.3,451.7,291.9z"
      />

      {/* Center badge with soundwave mark */}
      <path
        fill="#16ADE1"
        d="M256.9,247.9c-49.1,0-88.8,39.8-88.8,88.8c0,49.1,39.8,88.8,88.8,88.8
           s88.8-39.8,88.8-88.8C345.7,287.7,306,247.9,256.9,247.9z
           M326.4,357.8c-1,1-2.3,1.5-3.5,1.5s-2.6-0.5-3.5-1.5l-31.5-31.5
           l-27.4,27.4c-2,2-5.1,2-7.1,0L226,326.3l-31.5,31.5c-2,2-5.1,2-7.1,0
           c-2-2-2-5.1,0-7.1l35-35c2-2,5.1-2,7.1,0l27.4,27.4l27.4-27.4
           c2-2,5.1-2,7.1,0l35,35C328.3,352.7,328.3,355.8,326.4,357.8z"
      />
    </svg>
  );
}

/** Small inline icon — no background, just the headphone shape */
export function SoundwaveIcon({ size = 20, style }: { size?: number; color?: string; style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-56.32 -56.32 624.64 624.64"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
    >
      <path
        fill="#1B3954"
        d="M256,86.4c-83.6,0-151.7,68-151.7,151.7v160.8h36.6V238.1
           c0-63.5,51.6-115.1,115.1-115.1c63.5,0,115.1,51.6,115.1,115.1v160.8h36.6
           V238.1C407.7,154.5,339.6,86.4,256,86.4z"
      />
      <path fill="#16ADE1" d="M41.9,336.3c0,31.1,22.7,56.9,52.4,61.8V274.4c-13.2,2.2-25,8.5-34,17.5C48.9,303.3,41.9,318.9,41.9,336.3z"/>
      <path fill="#16ADE1" d="M451.7,291.9c-9.1-9-20.9-15.4-34.1-17.5v123.7c29.7-4.9,52.4-30.7,52.4-61.8C470.1,318.9,463.1,303.3,451.7,291.9z"/>
      <path
        fill="#16ADE1"
        d="M256.9,247.9c-49.1,0-88.8,39.8-88.8,88.8c0,49.1,39.8,88.8,88.8,88.8
           s88.8-39.8,88.8-88.8C345.7,287.7,306,247.9,256.9,247.9z
           M326.4,357.8c-1,1-2.3,1.5-3.5,1.5s-2.6-0.5-3.5-1.5l-31.5-31.5
           l-27.4,27.4c-2,2-5.1,2-7.1,0L226,326.3l-31.5,31.5c-2,2-5.1,2-7.1,0
           c-2-2-2-5.1,0-7.1l35-35c2-2,5.1-2,7.1,0l27.4,27.4l27.4-27.4
           c2-2,5.1-2,7.1,0l35,35C328.3,352.7,328.3,355.8,326.4,357.8z"
      />
    </svg>
  );
}