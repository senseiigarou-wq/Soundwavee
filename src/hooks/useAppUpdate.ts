// ============================================================
// SOUNDWAVE — PWA Auto-Update Hook
// Uses native Service Worker API — no virtual module needed.
// ============================================================
import { useEffect, useRef, useState } from 'react';

export function useAppUpdate() {
  const [updateReady, setUpdateReady] = useState(false);
  const newWorkerRef = useRef<ServiceWorker | null>(null);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleUpdate = (registration: ServiceWorkerRegistration) => {
      const newWorker = registration.installing ?? registration.waiting;
      if (!newWorker) return;

      newWorkerRef.current = newWorker;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // A new SW is installed and waiting — prompt user
          setUpdateReady(true);
        }
      });

      // If already waiting (page reloaded after update downloaded)
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        setUpdateReady(true);
      }
    };

    navigator.serviceWorker.ready.then(registration => {
      // Check immediately
      if (registration.waiting) {
        newWorkerRef.current = registration.waiting;
        setUpdateReady(true);
      }

      // Listen for future updates
      registration.addEventListener('updatefound', () => {
        handleUpdate(registration);
      });

      // Poll for updates every 60 seconds
      intervalRef.current = setInterval(() => {
        if (navigator.onLine) {
          registration.update().catch(() => {});
        }
      }, 60 * 1000);
    }).catch(() => {});

    // When SW controller changes (update activated), reload the page
    let refreshing = false;
    const onControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  // Auto-apply if user is idle for 30 seconds
  useEffect(() => {
    if (!updateReady) return;

    let idleTimer: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => applyUpdate(), 30_000);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const;
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(idleTimer);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [updateReady]);

  const applyUpdate = () => {
    if (newWorkerRef.current) {
      // Tell the waiting SW to take control immediately
      newWorkerRef.current.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  };

  return { updateReady, applyUpdate };
}
