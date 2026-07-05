// src/components/Navbar.tsx
import { useState, useEffect } from 'react';
import { Search, Bell, Home, Compass, Film, BookOpen } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const C = {
  bg:        '#0A0A0F',
  surface:   '#0F0F1A',
  elevated:  '#16162A',
  text:      '#F5F0E8',
  textSub:   '#8A8090',
  accent:    '#FF6B00',
  accentDim: 'rgba(255,107,0,0.18)',
  accentGlow:'rgba(255,107,0,0.35)',
  border:    'rgba(255,107,0,0.12)',
} as const;

const NAV_LINKS = [
  { label: 'Home',   icon: <Home size={14} />,    path: '/' },
  { label: 'Browse', icon: <Compass size={14} />, path: '/browse' },
  { label: 'Movies', icon: <Film size={14} />,    path: '/browse?type=movie' },
  { label: 'Series', icon: <BookOpen size={14} />,path: '/browse?type=tv' },
];

interface NavbarProps {
  onSearchOpen: () => void;
}

export default function Navbar({ onSearchOpen }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path.split('?')[0]);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
      <nav style={{
        display: 'flex', alignItems: 'center',
        padding: '0 20px', height: 60,
        background: scrolled ? 'rgba(10,10,15,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom: scrolled ? `1px solid ${C.border}` : 'none',
        transition: 'all 0.3s ease',
      }}>
        {/* Logo */}
        <div
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 32, flexShrink: 0, cursor: 'pointer' }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `linear-gradient(135deg, ${C.accent}, #FF4500)`,
            boxShadow: `0 0 16px ${C.accentGlow}`,
            fontSize: 14, fontWeight: 900, color: '#fff',
          }}>忍</div>
          <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.04em', fontFamily: '"Outfit", system-ui, sans-serif', color: C.text }}>
            ANI<span style={{ color: C.accent }}>VERSE</span>
          </span>
        </div>

        {/* Nav Links — desktop only */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }} className="av-desktop-nav">
          {NAV_LINKS.map(link => {
            const active = isActive(link.path);
            return (
              <button
                key={link.label}
                onClick={() => navigate(link.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8, border: 'none',
                  background: active ? C.accentDim : 'transparent',
                  color: active ? C.accent : C.textSub,
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.18s ease',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = C.text; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = C.textSub; }}
              >
                {link.icon}{link.label}
              </button>
            );
          })}
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <button
            onClick={onSearchOpen}
            style={{
              width: 36, height: 36, borderRadius: '50%', border: `1px solid ${C.border}`,
              background: C.accentDim, color: C.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.18s ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = C.accent; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = C.accentDim; (e.currentTarget as HTMLButtonElement).style.color = C.accent; }}
          >
            <Search size={15} />
          </button>
          <button style={{
            width: 36, height: 36, borderRadius: '50%', border: `1px solid ${C.border}`,
            background: C.elevated, color: C.textSub,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <Bell size={15} />
          </button>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', cursor: 'pointer',
            background: `linear-gradient(135deg, ${C.accent}, #FF4500)`,
            border: `2px solid ${C.accent}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 900, color: '#fff',
            boxShadow: `0 0 12px ${C.accentGlow}`,
          }}>七</div>
        </div>
      </nav>
    </div>
  );
}
