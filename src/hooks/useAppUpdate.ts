// ============================================================
// SOUNDWAVE — PWA Auto-Update Hook
// Detects when a new version is available and either:
//   1. Silently applies it on next page load (if user is idle)
//   2. Shows a toast prompt so user can apply immediately
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function useAppUpdate() {
  const [updateReady, setUpdateReady] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    // Check for updates every 60 seconds while app is open
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;
      intervalRef.current = setInterval(async () => {
        if (!registration.installing && navigator.onLine) {
          await registration.update();
        }
      }, 60 * 1000);
    },

    onNeedRefresh() {
      setUpdateReady(true);
    },

    onOfflineReady() {
      console.log('[PWA] App ready for offline use');
    },
  });

  // Auto-apply update if user is idle (no interaction for 30s)
  useEffect(() => {
    if (!needRefresh) return;

    let idleTimer: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        // User has been idle — silently apply update
        updateServiceWorker(true);
      }, 30 * 1000);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(idleTimer);
      clearInterval(intervalRef.current!);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [needRefresh, updateServiceWorker]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const applyUpdate = () => updateServiceWorker(true);

  return { updateReady, applyUpdate };
}