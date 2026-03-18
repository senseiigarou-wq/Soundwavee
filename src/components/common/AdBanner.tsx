// ============================================================
// SOUNDWAVE — Google AdSense Banner
// Auto-format ad that only loads in production.
// ============================================================
import { useEffect, useRef } from 'react';

interface AdBannerProps {
  slot: string;        // Your Ad Unit ID e.g. "1234567890"
  style?: React.CSSProperties;
}

// Publisher ID — falls back to the hardcoded one if env var not set
const PUB_ID = import.meta.env.VITE_ADSENSE_PUB_ID || 'ca-pub-9263325326966562';
const IS_PROD = import.meta.env.PROD; // true only on npm run build

declare global {
  interface Window { adsbygoogle: unknown[]; }
}

export function AdBanner({ slot, style }: AdBannerProps) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    // Never show ads in dev / Bolt.new / StackBlitz
    if (!IS_PROD || !PUB_ID || pushed.current) return;

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      pushed.current = true;
    } catch (e) {
      console.warn('[AdSense]', e);
    }
  }, []);

  // Don't render at all in dev or if publisher ID is missing
  if (!IS_PROD || !PUB_ID) return null;

  return (
    <div style={{
      width: '100%',
      overflow: 'hidden',
      borderRadius: 12,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      minHeight: 100,
      ...style,
    }}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={PUB_ID}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}