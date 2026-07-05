// src/components/BottomNav.tsx
import { Home, Compass, Search, Sparkles, Swords } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const C = {
  accent:    '#FF6B00',
  accentGlow:'rgba(255,107,0,0.35)',
  border:    'rgba(255,107,0,0.12)',
  textSub:   '#8A8090',
} as const;

const TABS = [
  { label: 'Home',   icon: <Home size={20} />,    id: 'home',   path: '/' },
  { label: 'Browse', icon: <Compass size={20} />, id: 'browse', path: '/browse' },
  { label: 'Battle', icon: <Swords size={20} />,  id: 'battle', path: '/browse?genre=28' },
  { label: 'Genres', icon: <Sparkles size={20} />, id:'genres', path: '/browse' },
  { label: 'Search', icon: <Search size={20} />,  id: 'search', path: null },
];

interface BottomNavProps {
  onSearchOpen: () => void;
}

export default function BottomNav({ onSearchOpen }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string | null) => {
    if (!path) return false;
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path.split('?')[0]);
  };

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60,
      background: 'rgba(10,10,15,0.95)',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      borderTop: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'stretch',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {TABS.map(tab => {
        const active = isActive(tab.path);
        return (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === 'search') { onSearchOpen(); return; }
              if (tab.path) navigate(tab.path);
            }}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 4, padding: '10px 0 8px', border: 'none', background: 'transparent',
              color: active ? C.accent : C.textSub,
              cursor: 'pointer', position: 'relative', transition: 'color 0.18s',
            }}
          >
            {active && (
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 32, height: 2, borderRadius: 999,
                background: `linear-gradient(90deg, ${C.accent}, #FF4500)`,
                boxShadow: `0 0 8px ${C.accent}`,
              }} />
            )}
            <div style={{ transform: active ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.18s' }}>
              {tab.icon}
            </div>
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, letterSpacing: '0.01em' }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
