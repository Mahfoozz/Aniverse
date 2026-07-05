// src/components/BottomNav.tsx
import { useState } from 'react';
import { Home, Compass, Search, Sparkles, Swords } from 'lucide-react';

const C = {
  accent:    '#FF6B00',
  accentGlow:'rgba(255,107,0,0.35)',
  border:    'rgba(255,107,0,0.12)',
  textSub:   '#8A8090',
} as const;

const TABS = [
  { label: 'Home',   icon: <Home size={20} />,    id: 'home' },
  { label: 'Browse', icon: <Compass size={20} />, id: 'browse' },
  { label: 'Battle', icon: <Swords size={20} />,  id: 'battle' },
  { label: 'Genres', icon: <Sparkles size={20} />, id: 'genres' },
  { label: 'Search', icon: <Search size={20} />,  id: 'search' },
];

interface BottomNavProps {
  onSearchOpen: () => void;
}

export default function BottomNav({ onSearchOpen }: BottomNavProps) {
  const [active, setActive] = useState('home');

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
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => { setActive(tab.id); if (tab.id === 'search') onSearchOpen(); }}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 4, padding: '10px 0 8px', border: 'none', background: 'transparent',
              color: isActive ? C.accent : C.textSub,
              cursor: 'pointer', position: 'relative', transition: 'color 0.18s',
            }}
          >
            {isActive && (
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 32, height: 2, borderRadius: 999,
                background: `linear-gradient(90deg, ${C.accent}, #FF4500)`,
                boxShadow: `0 0 8px ${C.accent}`,
              }} />
            )}
            <div style={{ transform: isActive ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.18s' }}>
              {tab.icon}
            </div>
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, letterSpacing: '0.01em' }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
