// ============================================================
// SOUNDWAVE — Offline Banner
// Shows at the top of the app when there's no internet.
// ============================================================
import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { isOnline, onNetworkChange } from '@/services/offlineService';

export function OfflineBanner() {
  const [online,  setOnline]  = useState(isOnline());
  const [justBack, setJustBack] = useState(false);

  useEffect(() => {
    return onNetworkChange(nowOnline => {
      setOnline(nowOnline);
      if (nowOnline) {
        setJustBack(true);
        setTimeout(() => setJustBack(false), 3000);
      }
    });
  }, []);

  if (online && !justBack) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: online
        ? 'linear-gradient(135deg,rgba(29,185,84,0.95),rgba(20,140,60,0.95))'
        : 'linear-gradient(135deg,rgba(255,80,80,0.97),rgba(200,40,40,0.97))',
      backdropFilter: 'blur(12px)',
      color: '#fff', fontSize: 13, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: '10px 20px',
      paddingTop: `calc(10px + env(safe-area-inset-top))`,
      transition: 'background 0.4s',
      animation: 'ob-slide 0.3s ease',
      boxShadow: '0 2px 20px rgba(0,0,0,0.4)',
    }}>
      {online
        ? <><Wifi size={15} /> Back online — you're all set!</>
        : <><WifiOff size={15} /> No internet — playing from offline cache</>
      }
      <style>{`@keyframes ob-slide{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}