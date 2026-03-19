// ============================================================
// SOUNDWAVE — Google AdSense Banner
// Auto-format ad that only loads in production.
// ============================================================
import { useEffect, useRef } from 'react';

interface AdBannerProps {
  slot: string;        // Your Ad Unit ID e.g. "1234567890"
  style?: React.CSSProperties;
}

// Publisher ID and default slot
const PUB_ID      = import.meta.env.VITE_ADSENSE_PUB_ID  || 'ca-pub-9263325326966562';
const DEFAULT_SLOT = import.meta.env.VITE_ADSENSE_SLOT_LIBRARY || '6203471608';
const IS_PROD = import.meta.env.PROD; // true only on npm run build

declare global {
  interface Window { adsbygoogle: unknown[]; }
}

export function AdBanner({ slot, style }: AdBannerProps) {
  const adSlot = slot || DEFAULT_SLOT;
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!IS_PROD || !PUB_ID || pushed.current) return;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      pushed.current = true;
    } catch (e) {
      console.warn('[AdSense]', e);
    }
  }, []);

  if (!IS_PROD || !PUB_ID) return null;

  return (
    <div style={{
      width: '100%',
      overflow: 'hidden',
      borderRadius: 12,
      minHeight: 90,
      ...style,
    }}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client={PUB_ID}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
