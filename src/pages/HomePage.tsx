// src/pages/HomePage.tsx
// Aniverse — Home Page
// Same visual language as Cineverse (glass navbar, dark surface, poster rails,
// skeleton shimmer, floating dock) but content + data sourced entirely from
// TMDB scoped to anime (genre 16 / Animation + original_language=ja).
// Browse & Player pages are intentionally NOT wired up yet.

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  Play, Search, Info, Star, ChevronLeft, ChevronRight,
  Home, Compass, Flame, Laugh, Ghost, Heart, Drama, Sparkles,
  Tv, Film, TrendingUp, X, Loader2,
} from 'lucide-react';
import { tmdb, getTMDBImage } from '@/lib/tmdb';

// ─── DESIGN TOKENS (matches Cineverse) ───────────────────────────────────────
const C = {
  bg:        '#07090D',
  surface:   '#0F1318',
  elevated:  '#181D24',
  text:      '#F8F9FB',
  textSub:   '#8792A0',
  accent:    '#CDD1D8',
  border:    'rgba(248,249,251,0.055)',
  borderHov: 'rgba(248,249,251,0.13)',
  overlay:   'rgba(7,9,13,0.9)',
} as const;

const G = {
  light: {
    background:           'rgba(15,19,24,0.45)',
    backdropFilter:        'blur(20px)',
    WebkitBackdropFilter:  'blur(20px)',
    border:                '1px solid rgba(248,249,251,0.07)',
  },
  strong: {
    background:           'rgba(7,9,13,0.62)',
    backdropFilter:        'blur(28px)',
    WebkitBackdropFilter:  'blur(28px)',
    border:                '1px solid rgba(255,255,255,0.13)',
    boxShadow:             '0 6px 28px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)',
  },
} as const;

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface AnimeItem {
  type:      'movie' | 'tv';
  title:     string;
  year:      number;
  overview:  string;
  rating:    number;
  genres:    string[];
  tmdb_id:   number;
  poster:    string;
  backdrop:  string;
}

const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 27: 'Horror',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 53: 'Thriller',
  10759: 'Action & Adventure', 10765: 'Sci-Fi & Fantasy',
};

function normItem(raw: any, type: 'movie' | 'tv'): AnimeItem {
  const isMovie = type === 'movie';
  const title   = isMovie ? (raw.title || raw.original_title) : (raw.name || raw.original_name);
  const dateStr = isMovie ? raw.release_date : raw.first_air_date;
  return {
    type,
    title:    title || 'Unknown',
    year:     dateStr ? parseInt(dateStr.slice(0, 4)) : 0,
    overview: raw.overview || '',
    rating:   raw.vote_average ?? 0,
    genres:   (raw.genre_ids || []).slice(0, 3).map((id: number) => GENRE_MAP[id]).filter(Boolean),
    tmdb_id:  raw.id,
    poster:   getTMDBImage(raw.poster_path, 'w500'),
    backdrop: getTMDBImage(raw.backdrop_path, 'backdrop'),
  };
}
function normPage(data: any, type: 'movie' | 'tv', limit = 20): AnimeItem[] {
  if (!data?.results) return [];
  return data.results.slice(0, limit)
    .map((r: any) => normItem(r, type))
    .filter((i: AnimeItem) => i.tmdb_id && i.poster);
}

// ─── SKELETONS ────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ flexShrink: 0, width: 'clamp(120px, calc((100vw - 8vw - 48px) / 4), 160px)', borderRadius: 14, overflow: 'hidden', background: C.surface }}>
      <div style={{ width: '100%', paddingTop: '142%' }} className="av-sk" />
    </div>
  );
}
function SkeletonHero() {
  return <div style={{ width: '100%', height: '78vh', background: C.surface }} className="av-sk" />;
}

// ─── POSTER CARD ──────────────────────────────────────────────────────────────
const PosterCard = memo(function PosterCard({
  item, onClick,
}: { item: AnimeItem; onClick: (item: AnimeItem) => void }) {
  const [hov, setHov] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return (
    <button
      onClick={() => onClick(item)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flexShrink: 0, width: 'clamp(120px, calc((100vw - 8vw - 48px) / 4), 160px)',
        borderRadius: 14, overflow: 'hidden', background: 'transparent',
        border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left',
        transform: hov ? 'scale(1.04)' : 'scale(1)',
        transition: 'transform 0.25s cubic-bezier(0.2,0.8,0.2,1)',
        WebkitTapHighlightColor: 'transparent',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
      <div style={{
        width: '100%', paddingTop: '142%', position: 'relative', overflow: 'hidden',
        borderRadius: 12, background: C.surface,
        boxShadow: hov ? '0 16px 40px rgba(0,0,0,0.6)' : '0 4px 14px rgba(0,0,0,0.25)',
        transition: 'box-shadow 0.25s ease',
      }}>
        {item.poster ? (
          <img
            src={item.poster} alt={item.title} loading="lazy"
            onLoad={() => setLoaded(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: loaded ? 1 : 0, transition: 'opacity 0.2s ease' }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Tv size={24} color={C.textSub} style={{ opacity: 0.2 }} />
          </div>
        )}
        {item.rating > 0 && (
          <div style={{ position: 'absolute', bottom: 8, right: 8, padding: '3px 6px', borderRadius: 6, ...G.strong, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Star size={10} color="#FBBF24" fill="#FBBF24" />
            <span style={{ fontSize: 10, fontWeight: 700, color: C.text }}>{item.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      <div style={{ paddingInline: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: hov ? C.text : C.accent, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
        <p style={{ margin: 0, fontSize: 11, color: C.textSub, fontWeight: 500 }}>{item.year || '—'}</p>
      </div>
    </button>
  );
});

// ─── GLASS ARROW ──────────────────────────────────────────────────────────────
function GlassArrow({ dir, onClick, style = {} }: { dir: 'l' | 'r'; onClick: () => void; style?: React.CSSProperties }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: 38, height: 38, borderRadius: '50%', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text,
        background: hov ? 'rgba(248,249,251,0.14)' : 'rgba(7,9,13,0.6)',
        backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
        border: `1px solid ${hov ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.11)'}`,
        boxShadow: hov ? '0 0 0 1px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.6)' : '0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        transition: 'all 0.18s ease', ...style,
      }}
    >
      {dir === 'l' ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}
    </button>
  );
}

// ─── RAIL ─────────────────────────────────────────────────────────────────────
function Rail({
  title, icon, items, loading, onItemClick,
}: { title: string; icon?: React.ReactNode; items: AnimeItem[]; loading: boolean; onItemClick: (item: AnimeItem) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'l' | 'r') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'l' ? -scrollRef.current.clientWidth * 0.8 : scrollRef.current.clientWidth * 0.8, behavior: 'smooth' });
  };
  if (!loading && items.length === 0) return null;
  return (
    <section style={{ marginBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingInline: '4vw', marginBottom: 14 }}>
        {icon && <span style={{ color: C.textSub }}>{icon}</span>}
        <h2 style={{ margin: 0, fontSize: 'clamp(14px, 3.8vw, 17px)', fontWeight: 700, color: C.text, letterSpacing: '-0.02em', fontFamily: '"Outfit", "Inter", system-ui, sans-serif' }}>{title}</h2>
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: '1vw', top: '50%', transform: 'translateY(-50%)', zIndex: 4 }}>
          <GlassArrow dir="l" onClick={() => scroll('l')} />
        </div>
        <div ref={scrollRef} style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingInline: '4vw', scrollSnapType: 'x proximity', paddingBottom: 4 }}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : items.map(item => <PosterCard key={`${item.type}-${item.tmdb_id}`} item={item} onClick={onItemClick} />)}
        </div>
        <div style={{ position: 'absolute', right: '1vw', top: '50%', transform: 'translateY(-50%)', zIndex: 4 }}>
          <GlassArrow dir="r" onClick={() => scroll('r')} />
        </div>
      </div>
    </section>
  );
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar({ onSearchOpen }: { onSearchOpen: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div style={{ position: 'fixed', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 50, width: 'min(94vw, 1100px)' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 10px 10px 18px', borderRadius: 999,
        ...(scrolled ? G.strong : G.light), transition: 'background 0.25s ease',
      }}>
        <span style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.04em', fontFamily: '"Outfit","Inter",system-ui,sans-serif', color: C.text }}>
          AN<span style={{ color: C.textSub, fontWeight: 400 }}>!</span>VERSE
        </span>
        <div style={{ display: 'none' }} />
        <button
          onClick={onSearchOpen}
          aria-label="Search"
          style={{
            width: 38, height: 38, borderRadius: '50%', border: `1px solid ${C.borderHov}`,
            background: C.elevated, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <Search size={16} />
        </button>
      </nav>
    </div>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero({ items, loading }: { items: AnimeItem[]; loading: boolean }) {
  const [idx, setIdx] = useState(0);
  const slides = items.slice(0, 6);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIdx(i => (i + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (loading) return <SkeletonHero />;
  if (!slides.length) return null;
  const item = slides[idx];

  return (
    <section style={{ position: 'relative', width: '100%', height: '78vh', minHeight: 420, overflow: 'hidden' }}>
      {slides.map((s, i) => (
        <img
          key={s.tmdb_id}
          src={s.backdrop || s.poster}
          alt={s.title}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            opacity: i === idx ? 1 : 0, transition: 'opacity 1s ease',
          }}
        />
      ))}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(7,9,13,0.15) 0%, rgba(7,9,13,0.55) 60%, ${C.bg} 100%)` }} />
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, rgba(7,9,13,0.85) 0%, rgba(7,9,13,0.1) 55%, transparent 100%)` }} />

      <div style={{ position: 'absolute', left: '4vw', right: '4vw', bottom: '8%', maxWidth: 620 }}>
        {item.genres.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {item.genres.map(g => (
              <span key={g} style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, color: C.text, ...G.strong }}>{g}</span>
            ))}
          </div>
        )}
        <h1 style={{
          margin: '0 0 12px', fontSize: 'clamp(28px, 6.5vw, 48px)', fontWeight: 900, lineHeight: 1.05,
          letterSpacing: '-0.03em', color: C.text, fontFamily: '"Outfit","Inter",system-ui,sans-serif',
          textShadow: '0 4px 24px rgba(0,0,0,0.5)',
        }}>{item.title}</h1>
        <p style={{
          margin: '0 0 22px', fontSize: 14, lineHeight: 1.55, color: C.accent, maxWidth: 520,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{item.overview}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 12,
            background: C.text, color: C.bg, border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer',
          }}>
            <Play size={16} fill={C.bg} /> Watch Now
          </button>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12,
            color: C.text, fontWeight: 700, fontSize: 14, cursor: 'pointer', ...G.strong,
          }}>
            <Info size={16} /> Details
          </button>
        </div>
      </div>

      {slides.length > 1 && (
        <div style={{ position: 'absolute', right: '4vw', bottom: '8%', display: 'flex', gap: 6 }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} aria-label={`Slide ${i + 1}`} style={{
              width: i === idx ? 22 : 7, height: 7, borderRadius: 999, border: 'none', cursor: 'pointer',
              background: i === idx ? C.text : 'rgba(248,249,251,0.3)', transition: 'all 0.3s ease',
            }} />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── SEARCH OVERLAY (TMDB-powered) ───────────────────────────────────────────
function SearchOverlay({ onClose, onSelect }: { onClose: () => void; onSelect: (item: AnimeItem) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AnimeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await tmdb.searchAnime(query.trim());
        const raw: any[] = data?.results || [];
        // Keep only tv/movie results that are actually anime-shaped:
        // Japanese origin OR tagged with the Animation genre (16).
        const filtered = raw.filter(r =>
          (r.media_type === 'tv' || r.media_type === 'movie') &&
          (r.original_language === 'ja' || (r.genre_ids || []).includes(16))
        );
        const items = filtered
          .map(r => normItem(r, r.media_type))
          .filter(i => i.tmdb_id && i.poster);
        setResults(items);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: C.overlay, backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '18px 4vw', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${C.border}` }}>
        <Search size={18} color={C.textSub} />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search anime titles…"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: C.text, fontSize: 16, fontWeight: 500,
          }}
        />
        {loading && <Loader2 size={16} color={C.textSub} className="av-spin" />}
        <button onClick={onClose} aria-label="Close search" style={{ background: 'none', border: 'none', color: C.textSub, cursor: 'pointer', padding: 6 }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 4vw 60px' }}>
        {!query.trim() && (
          <p style={{ color: C.textSub, fontSize: 13, marginTop: 20 }}>Start typing to search anime via TMDB.</p>
        )}
        {query.trim() && !loading && results.length === 0 && (
          <p style={{ color: C.textSub, fontSize: 13, marginTop: 20 }}>No anime found for "{query}".</p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 14 }}>
          {results.map(item => (
            <button
              key={`${item.type}-${item.tmdb_id}`}
              onClick={() => onSelect(item)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ width: '100%', paddingTop: '142%', position: 'relative', borderRadius: 10, overflow: 'hidden', background: C.surface, marginBottom: 6 }}>
                {item.poster && <img src={item.poster} alt={item.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.accent, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
              <p style={{ margin: 0, fontSize: 10, color: C.textSub }}>{item.year || '—'}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── FLOATING BOTTOM DOCK ─────────────────────────────────────────────────────
function FloatingBottomDock({ onSearchOpen }: { onSearchOpen: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div style={{
      position: 'fixed', bottom: 18, left: '50%', transform: `translateX(-50%) translateY(${visible ? '0' : '120%'})`,
      opacity: visible ? 1 : 0, transition: 'all 0.3s ease', zIndex: 50,
      display: 'flex', gap: 6, padding: 8, borderRadius: 999, ...G.strong,
    }}>
      {[{ icon: <Home size={17} />, label: 'Home' }, { icon: <Compass size={17} />, label: 'Discover' }].map(b => (
        <button key={b.label} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 999,
          background: 'transparent', border: 'none', color: C.text, fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>{b.icon}{b.label}</button>
      ))}
      <button onClick={onSearchOpen} style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 999,
        background: C.text, border: 'none', color: C.bg, fontSize: 12, fontWeight: 800, cursor: 'pointer',
      }}><Search size={15} /> Search</button>
    </div>
  );
}

// ─── DISCLAIMER ───────────────────────────────────────────────────────────────
function DisclaimerSection() {
  return (
    <section style={{ marginInline: '4vw', marginBottom: 40, padding: 20, borderRadius: 16, ...G.light }}>
      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: C.textSub }}>
        Aniverse indexes publicly available anime metadata via TMDB for discovery purposes only.
        This page does not host, stream, or store any video content. Playback features are coming soon.
      </p>
    </section>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [searchOpen, setSearchOpen] = useState(false);

  const [trending, setTrending]   = useState<AnimeItem[]>([]);
  const [popular, setPopular]     = useState<AnimeItem[]>([]);
  const [topRated, setTopRated]   = useState<AnimeItem[]>([]);
  const [movies, setMovies]       = useState<AnimeItem[]>([]);
  const [action, setAction]       = useState<AnimeItem[]>([]);
  const [romance, setRomance]     = useState<AnimeItem[]>([]);
  const [comedy, setComedy]       = useState<AnimeItem[]>([]);
  const [fantasy, setFantasy]     = useState<AnimeItem[]>([]);

  const [loadingHero, setLoadingHero]     = useState(true);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [loadingTop, setLoadingTop]       = useState(true);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [loadingGenres, setLoadingGenres] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await tmdb.getTrendingAnime();
        setTrending(normPage(data, 'tv', 10));
      } finally { setLoadingHero(false); }
    })();
    (async () => {
      try {
        const data = await tmdb.getPopularAnime();
        setPopular(normPage(data, 'tv'));
      } finally { setLoadingPopular(false); }
    })();
    (async () => {
      try {
        const data = await tmdb.getTopRatedAnime();
        setTopRated(normPage(data, 'tv'));
      } finally { setLoadingTop(false); }
    })();
    (async () => {
      try {
        const data = await tmdb.getAnimeMovies();
        setMovies(normPage(data, 'movie'));
      } finally { setLoadingMovies(false); }
    })();
    (async () => {
      try {
        const [a, r, c, f] = await Promise.all([
          tmdb.getAnimeByGenre(28), // Action
          tmdb.getAnimeByGenre(10749), // Romance
          tmdb.getAnimeByGenre(35), // Comedy
          tmdb.getAnimeByGenre(14), // Fantasy
        ]);
        setAction(normPage(a, 'tv'));
        setRomance(normPage(r, 'tv'));
        setComedy(normPage(c, 'tv'));
        setFantasy(normPage(f, 'tv'));
      } finally { setLoadingGenres(false); }
    })();
  }, []);

  // Player page isn't built yet — clicking a card is a friendly no-op for now.
  const handleItemClick = useCallback((item: AnimeItem) => {
    console.log('Selected (player page coming soon):', item.title);
  }, []);

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text }}>
      <Navbar onSearchOpen={() => setSearchOpen(true)} />
      <Hero items={trending} loading={loadingHero} />

      <div style={{ paddingTop: 40 }}>
        <Rail title="Trending Now"      icon={<TrendingUp size={14} />} items={trending}  loading={loadingHero}    onItemClick={handleItemClick} />
        <Rail title="Popular Anime"     icon={<Flame size={14} />}      items={popular}   loading={loadingPopular} onItemClick={handleItemClick} />
        <Rail title="Top Rated"         icon={<Star size={14} />}       items={topRated}  loading={loadingTop}     onItemClick={handleItemClick} />
        <Rail title="Anime Movies"      icon={<Film size={14} />}       items={movies}    loading={loadingMovies}  onItemClick={handleItemClick} />
        <Rail title="Action & Adventure" icon={<Sparkles size={14} />} items={action}    loading={loadingGenres}  onItemClick={handleItemClick} />
        <Rail title="Romance"           icon={<Heart size={14} />}      items={romance}   loading={loadingGenres}  onItemClick={handleItemClick} />
        <Rail title="Comedy"            icon={<Laugh size={14} />}      items={comedy}    loading={loadingGenres}  onItemClick={handleItemClick} />
        <Rail title="Fantasy"           icon={<Ghost size={14} />}      items={fantasy}   loading={loadingGenres}  onItemClick={handleItemClick} />

        <DisclaimerSection />
      </div>

      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '32px 4vw 96px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 900, color: C.text, letterSpacing: '-0.05em', fontFamily: '"Outfit","Inter",system-ui,sans-serif' }}>
          AN<span style={{ color: C.textSub, fontWeight: 300 }}>!</span>VERSE
        </span>
        <p style={{ fontSize: 10, color: C.textSub, margin: 0 }}>© {new Date().getFullYear()} Aniverse. All rights reserved.</p>
      </footer>

      <FloatingBottomDock onSearchOpen={() => setSearchOpen(true)} />
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} onSelect={handleItemClick} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        *:focus { outline: none; }
        @keyframes av-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .av-sk { background: linear-gradient(90deg, #0F1318 25%, #181D24 50%, #0F1318 75%); background-size: 200% 100%; animation: av-shimmer 1.6s ease-in-out infinite; }
        @keyframes av-spin { to { transform: rotate(360deg); } }
        .av-spin { animation: av-spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
}
