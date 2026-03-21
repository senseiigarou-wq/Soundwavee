// ============================================================
// SOUNDWAVE — App Root
// ============================================================

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useYouTubePlayer } from '@/hooks/useYoutubePlayer';
import { LoginPage } from '@/components/Auth/LoginPage';
import { AppLayout } from '@/components/Layout/Applayout';
import { ResetPasswordPage } from '@/components/Auth/Resetpasswordpage';
import { ToastProvider } from '@/components/common/Toast';
import { SoundwaveLogo } from '@/components/common/Soundwavelogo';
import { InstallPWA } from '@/components/common/Installpwa';
import { UpdateBanner } from '@/components/common/UpdateBanner';
import { useAppUpdate } from '@/hooks/useAppUpdate';

// ── Parse Firebase action URL params ─────────────────────────
function getFirebaseActionParams() {
  const p = new URLSearchParams(window.location.search);
  return { mode: p.get('mode'), oobCode: p.get('oobCode') ?? '' };
}

function AuthLoading() {
  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 1.5s ease-in-out infinite' }}>
        <SoundwaveLogo size={60} withBackground={true} />
      </div>
      <p style={{ color: '#535353', fontSize: 13 }}>Loading…</p>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}

function AppInner() {
  const { isAuthenticated } = useAuthStore();
  const { init } = useLibraryStore();
  useYouTubePlayer();
  useEffect(() => { init(); }, [init]);
  return isAuthenticated ? <AppLayout /> : <LoginPage />;
}

function AppWithUpdate() {
  const { updateReady, applyUpdate } = useAppUpdate();
  const [dismissed, setDismissed] = useState(false);
  const { isInitialized, handleRedirectResult } = useAuthStore();

  useEffect(() => { handleRedirectResult(); }, []);

  const { mode, oobCode } = getFirebaseActionParams();
  if (mode === 'resetPassword') {
    return (
      <ToastProvider>
        <ResetPasswordPage oobCode={oobCode} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      {isInitialized ? <AppInner /> : <AuthLoading />}
      <InstallPWA />
      {updateReady && !dismissed && (
        <UpdateBanner
          onUpdate={applyUpdate}
          onDismiss={() => setDismissed(true)}
        />
      )}
    </ToastProvider>
  );
}

export function App() {
  return <AppWithUpdate />;
}

export default App;
