// ============================================================
// SOUNDWAVE — Privacy Policy Page
// Accessible from Login page footer + Settings → About
// ============================================================
import React, { useEffect } from 'react';
import { ArrowLeft, Shield, Eye, Lock, Database, Globe, Mail, UserCheck, AlertCircle } from 'lucide-react';
import { SoundwaveLogo } from '@/components/common/Soundwavelogo';

interface PrivacyPolicyPageProps {
  onBack: () => void;
}

const LAST_UPDATED  = 'March 18, 2026';
const CONTACT_EMAIL = 'privacy@soundwavee.pages.dev';
const APP_URL       = 'https://soundwavee.pages.dev';

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,107,157,0.12)', border: '1px solid rgba(255,107,157,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pink)', flexShrink: 0 }}>
          {icon}
        </div>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.2px' }}>{title}</h2>
      </div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)', lineHeight: 1.75, paddingLeft: 46 }}>
        {children}
      </div>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
      <span style={{ color: 'var(--pink)', flexShrink: 0, marginTop: 2 }}>•</span>
      <span>{children}</span>
    </div>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <p style={{ fontWeight: 700, color: '#fff', marginTop: 16, marginBottom: 8 }}>{children}</p>;
}

export function PrivacyPolicyPage({ onBack }: PrivacyPolicyPageProps) {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#000', fontFamily: "'DM Sans',-apple-system,sans-serif", color: 'rgba(255,255,255,0.75)' }}>

      {/* ── Sticky Header ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 20px', paddingTop: 'max(16px, calc(env(safe-area-inset-top) + 10px))', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={onBack} style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0 }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Privacy Policy</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Last updated {LAST_UPDATED}</div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* ── Hero ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 44, padding: '32px 20px', background: 'linear-gradient(135deg,rgba(255,107,157,0.08),rgba(126,208,236,0.05))', borderRadius: 24, border: '1px solid rgba(255,107,157,0.12)' }}>
          <SoundwaveLogo size={56} />
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginTop: 16, marginBottom: 8, letterSpacing: '-0.5px' }}>Soundwave Privacy Policy</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, maxWidth: 480 }}>
            We are committed to protecting your personal information and your right to privacy. This policy explains what information we collect, how we use it, and what rights you have.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['No data selling', 'Encrypted storage', 'Your data, your control'].map(tag => (
              <span key={tag} style={{ padding: '5px 12px', borderRadius: 999, background: 'rgba(255,107,157,0.1)', border: '1px solid rgba(255,107,157,0.2)', fontSize: 12, fontWeight: 600, color: 'var(--pink)' }}>{tag}</span>
            ))}
          </div>
        </div>

        <Section icon={<Eye size={18} />} title="Information We Collect">
          <SubHeading>Information you provide directly:</SubHeading>
          <Bullet><strong style={{ color: '#fff' }}>Account information</strong> — your name and email address via Google Sign-In or email/password authentication.</Bullet>
          <Bullet><strong style={{ color: '#fff' }}>Profile information</strong> — display name and profile picture you optionally upload or choose.</Bullet>
          <SubHeading>Information collected automatically:</SubHeading>
          <Bullet><strong style={{ color: '#fff' }}>Usage data</strong> — songs you play, search queries, liked songs, playlists, and listening history.</Bullet>
          <Bullet><strong style={{ color: '#fff' }}>Device information</strong> — browser type, operating system, and device type for compatibility.</Bullet>
          <Bullet><strong style={{ color: '#fff' }}>Log data</strong> — IP address, access times, and pages viewed, collected by Cloudflare for security.</Bullet>
          <SubHeading>Information we do NOT collect:</SubHeading>
          <Bullet>Payment information (Soundwave is completely free).</Bullet>
          <Bullet>Precise location data or biometric data.</Bullet>
        </Section>

        <Section icon={<Database size={18} />} title="How We Use Your Information">
          <Bullet><strong style={{ color: '#fff' }}>Provide the service</strong> — to authenticate you and sync your library across devices.</Bullet>
          <Bullet><strong style={{ color: '#fff' }}>Personalize experience</strong> — to show music recommendations based on listening history.</Bullet>
          <Bullet><strong style={{ color: '#fff' }}>Display advertisements</strong> — Google AdSense may show personalized ads. Opt out at <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--pink)' }}>adssettings.google.com</a>.</Bullet>
          <Bullet><strong style={{ color: '#fff' }}>Security</strong> — to detect and prevent fraudulent activity.</Bullet>
        </Section>

        <Section icon={<Globe size={18} />} title="Third-Party Services">
          <p style={{ marginBottom: 12 }}>Soundwave integrates with the following services, each with their own privacy policies:</p>
          {[
            { name: 'Google Firebase',  purpose: 'Authentication and cloud data storage',          link: 'https://firebase.google.com/support/privacy' },
            { name: 'YouTube Data API', purpose: 'Music search and playback',                      link: 'https://policies.google.com/privacy' },
            { name: 'Google AdSense',   purpose: 'Advertising — may use cookies for personalization', link: 'https://policies.google.com/privacy' },
            { name: 'Cloudflare',       purpose: 'Hosting, CDN, DDoS protection, and API proxy',  link: 'https://www.cloudflare.com/privacypolicy/' },
            { name: 'DiceBear',         purpose: 'Avatar generation (no personal data sent)',      link: 'https://dicebear.com/legal/privacy-policy' },
          ].map(svc => (
            <div key={svc.name} style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 }}>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: 14, marginBottom: 3 }}>{svc.name}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 5 }}>{svc.purpose}</div>
              <a href={svc.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--pink)', textDecoration: 'none' }}>View privacy policy →</a>
            </div>
          ))}
        </Section>

        <Section icon={<Lock size={18} />} title="Data Storage & Security">
          <Bullet><strong style={{ color: '#fff' }}>Local storage</strong> — library and preferences cached in your browser for fast access.</Bullet>
          <Bullet><strong style={{ color: '#fff' }}>Cloud storage</strong> — account data stored in Firebase Firestore with encryption at rest and in transit (TLS 1.3).</Bullet>
          <Bullet><strong style={{ color: '#fff' }}>API keys</strong> — YouTube API keys stored server-side in Cloudflare Workers secrets, never exposed to browsers.</Bullet>
          <Bullet><strong style={{ color: '#fff' }}>Passwords</strong> — hashed by Firebase Authentication. We never see or store plain-text passwords.</Bullet>
          <p style={{ marginTop: 14, padding: '12px 16px', borderRadius: 10, background: 'rgba(255,165,0,0.07)', border: '1px solid rgba(255,165,0,0.15)', color: 'rgba(255,200,100,0.85)', fontSize: 13 }}>
            ⚠️ No method of Internet transmission is 100% secure. While we implement commercially acceptable security measures, we cannot guarantee absolute security.
          </p>
        </Section>

        <Section icon={<UserCheck size={18} />} title="Your Rights & Choices">
          <Bullet><strong style={{ color: '#fff' }}>Access</strong> — request a copy of personal data we hold about you.</Bullet>
          <Bullet><strong style={{ color: '#fff' }}>Correction</strong> — update your name and profile picture in Settings → Edit Profile.</Bullet>
          <Bullet><strong style={{ color: '#fff' }}>Deletion</strong> — delete your account and all data in Settings → Privacy &amp; Security → Delete Account. This is permanent.</Bullet>
          <Bullet><strong style={{ color: '#fff' }}>Opt out of ads</strong> — visit <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--pink)' }}>Google Ad Settings</a> to control ad personalization.</Bullet>
          <SubHeading>Cookies:</SubHeading>
          <p>Soundwave itself does not use tracking cookies. Google AdSense and Firebase may set cookies for authentication and ad personalization, controllable through your browser settings.</p>
        </Section>

        <Section icon={<Shield size={18} />} title="Children's Privacy">
          <p>Soundwave is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe your child has provided us with personal information, please contact us and we will delete it immediately.</p>
        </Section>

        <Section icon={<Globe size={18} />} title="International Data Transfers">
          <p>Soundwave is operated from the Philippines. Accessing the service from other regions may involve data transfer to servers in different countries (including the US via Google Firebase and Cloudflare). By using Soundwave you consent to this transfer.</p>
        </Section>

        <Section icon={<AlertCircle size={18} />} title="Changes to This Policy">
          <p>We may update this Privacy Policy periodically. We will notify you of significant changes by updating the date above and displaying a notice in the app. Continued use of Soundwave after changes constitutes acceptance of the updated policy.</p>
        </Section>

        <Section icon={<Mail size={18} />} title="Contact Us">
          <p>For questions, concerns, or data requests regarding this Privacy Policy:</p>
          <div style={{ marginTop: 14, padding: '16px 20px', borderRadius: 14, background: 'rgba(255,107,157,0.06)', border: '1px solid rgba(255,107,157,0.15)' }}>
            <div style={{ fontWeight: 700, color: '#fff', marginBottom: 4 }}>Soundwave Privacy Team</div>
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--pink)', textDecoration: 'none', fontSize: 14 }}>{CONTACT_EMAIL}</a>
            <div style={{ marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>We aim to respond within 5 business days.</div>
          </div>
        </Section>

        {/* Footer */}
        <div style={{ textAlign: 'center', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
          <SoundwaveLogo size={28} />
          <p style={{ marginTop: 10 }}>© {new Date().getFullYear()} Soundwave · {APP_URL}</p>
          <p style={{ marginTop: 4 }}>Effective as of {LAST_UPDATED}</p>
        </div>
      </div>
    </div>
  );
}