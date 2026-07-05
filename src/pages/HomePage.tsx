// src/pages/HomePage.tsx — Aniverse Home Page (Naruto Theme)

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  Play, Search, Info, Star, ChevronLeft, ChevronRight,
  Flame, Laugh, Ghost, Heart, Sparkles,
  Tv, Film, TrendingUp, X, Loader2, Swords,
} from 'lucide-react';
import { tmdb, getTMDBImage } from '@/lib/tmdb';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';

// ─── NARUTO DESIGN TOKENS ────────────────────────────────────────────────────
const C = {
  bg:        '#0A0A0F',           // deep void black
  surface:   '#0F0F1A',          // dark navy-black
  elevated:  '#16162A',          // elevated panel
  text:      '#F5F0E8',          // warm white (like scroll paper)
  textSub:   '#8A8090',          // muted lavender-grey
  accent:    '#FF6B00',          // Naruto orange (primary)
  accentDim: 'rgba(255,107,0,0.18)',
  accentGlow:'rgba(255,107,0,0.35)',
  gold:      '#E8A838',          // leaf village gold
  red:       '#CC2200',          // Akatsuki red
  border:    'rgba(255,107,0,0.12)',
  borderHov: 'rgba(255,107,0,0.28)',
  overlay:   'rgba(10,10,15,0.92)',
} as const;

const G = {
  light: {
    background:           'rgba(15,15,26,0.55)',
    backdropFilter:        'blur(20px)',
    WebkitBackdropFilter:  'blur(20px)',
    border:                `1px solid ${C.border}`,
  },
  strong: {
    background:           'rgba(10,10,15,0.75)',
    backdropFilter:        'blur(28px)',
    WebkitBackdropFilter:  'blur(28px)',
    border:                `1px solid rgba(255,107,0,0.18)`,
    boxShadow:             '0 6px 28px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,107,0,0.08)',
  },
  orange: {
    background:           `linear-gradient(135deg, ${C.accent}, #FF4500)`,
    border:                'none',
    boxShadow:             `0 4px 20px ${C.accentGlow}`,
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
    <div style={{ flexShrink: 0, width: 'clamp(120px, calc((100vw - 8vw - 48px) / 4), 155px)', borderRadius: 12, overflow: 'hidden', background: C.surface }}>
      <div style={{ width: '100%', paddingTop: '142%' }} className="av-sk" />
    </div>
  );
}
function SkeletonHero() {
  return <div style={{ width: '100%', height: '82vh', background: C.surface }} className="av-sk" />;
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
        flexShrink: 0, width: 'clamp(120px, calc((100vw - 8vw - 48px) / 4), 155px)',
        borderRadius: 12, overflow: 'hidden', background: 'transparent',
        border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left',
        transform: hov ? 'scale(1.05) translateY(-4px)' : 'scale(1)',
        transition: 'transform 0.28s cubic-bezier(0.2,0.8,0.2,1)',
        WebkitTapHighlightColor: 'transparent',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
      <div style={{
        width: '100%', paddingTop: '142%', position: 'relative', overflow: 'hidden',
        borderRadius: 10, background: C.surface,
        boxShadow: hov ? `0 16px 40px rgba(0,0,0,0.7), 0 0 0 1px ${C.borderHov}` : '0 4px 14px rgba(0,0,0,0.3)',
        transition: 'box-shadow 0.28s ease',
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
        {/* orange accent line on hover */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, ${C.accent}, #FF4500)`,
          opacity: hov ? 1 : 0, transition: 'opacity 0.2s ease',
        }} />
        {item.rating > 0 && (
          <div style={{ position: 'absolute', top: 7, right: 7, padding: '3px 7px', borderRadius: 6, ...G.strong, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Star size={9} color={C.gold} fill={C.gold} />
            <span style={{ fontSize: 10, fontWeight: 700, color: C.text }}>{item.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      <div style={{ paddingInline: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: hov ? C.accent : C.text, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.2s' }}>{item.title}</p>
        <p style={{ margin: 0, fontSize: 10, color: C.textSub, fontWeight: 500 }}>{item.year || '—'}</p>
      </div>
    </button>
  );
});

// ─── GLASS ARROW ──────────────────────────────────────────────────────────────
function GlassArrow({ dir, onClick }: { dir: 'l' | 'r'; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: hov ? C.accent : C.text,
        background: hov ? C.accentDim : 'rgba(10,10,15,0.7)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${hov ? C.borderHov : C.border}`,
        boxShadow: hov ? `0 0 16px ${C.accentGlow}` : '0 4px 16px rgba(0,0,0,0.5)',
        transition: 'all 0.18s ease',
      }}
    >
      {dir === 'l' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
    </button>
  );
}

// ─── RAIL ─────────────────────────────────────────────────────────────────────
function Rail({
  title, icon, items, loading, onItemClick, accentTag,
}: { title: string; icon?: React.ReactNode; items: AnimeItem[]; loading: boolean; onItemClick: (item: AnimeItem) => void; accentTag?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'l' | 'r') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'l' ? -scrollRef.current.clientWidth * 0.8 : scrollRef.current.clientWidth * 0.8, behavior: 'smooth' });
  };
  if (!loading && items.length === 0) return null;
  return (
    <section style={{ marginBottom: 44 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingInline: '4vw', marginBottom: 16 }}>
        {icon && <span style={{ color: C.accent }}>{icon}</span>}
        <h2 style={{ margin: 0, fontSize: 'clamp(14px, 3.8vw, 16px)', fontWeight: 800, color: C.text, letterSpacing: '-0.01em', fontFamily: '"Outfit", system-ui, sans-serif' }}>{title}</h2>
        {accentTag && (
          <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: C.accentDim, color: C.accent, border: `1px solid ${C.border}`, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{accentTag}</span>
        )}
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${C.border}, transparent)` }} />
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: '1vw', top: '42%', transform: 'translateY(-50%)', zIndex: 4 }}>
          <GlassArrow dir="l" onClick={() => scroll('l')} />
        </div>
        <div ref={scrollRef} style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingInline: '4vw', scrollSnapType: 'x proximity', paddingBottom: 4, scrollbarWidth: 'none' }}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : items.map(item => <PosterCard key={`${item.type}-${item.tmdb_id}`} item={item} onClick={onItemClick} />)}
        </div>
        <div style={{ position: 'absolute', right: '1vw', top: '42%', transform: 'translateY(-50%)', zIndex: 4 }}>
          <GlassArrow dir="r" onClick={() => scroll('r')} />
        </div>
      </div>
    </section>
  );
}

// Navbar and BottomNav are now separate components in src/components/

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero({ items, loading }: { items: AnimeItem[]; loading: boolean }) {
  const [idx, setIdx] = useState(0);
  const slides = items.slice(0, 7);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIdx(i => (i + 1) % slides.length), 6500);
    return () => clearInterval(t);
  }, [slides.length]);

  if (loading) return <SkeletonHero />;
  if (!slides.length) return null;
  const item = slides[idx];

  return (
    <section style={{ position: 'relative', width: '100%', height: '82vh', minHeight: 480, overflow: 'hidden' }}>
      {/* Backdrop images */}
      {slides.map((s, i) => (
        <img
          key={s.tmdb_id}
          src={s.backdrop || s.poster}
          alt={s.title}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            opacity: i === idx ? 1 : 0, transition: 'opacity 1.2s ease',
          }}
        />
      ))}

      {/* Gradients */}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(10,10,15,0.2) 0%, rgba(10,10,15,0.6) 55%, ${C.bg} 100%)` }} />
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, rgba(10,10,15,0.92) 0%, rgba(10,10,15,0.3) 50%, transparent 100%)` }} />
      {/* Orange accent glow at bottom left */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '40%', height: '30%', background: `radial-gradient(ellipse at bottom left, ${C.accentGlow} 0%, transparent 70%)`, pointerEvents: 'none' }} />

      {/* Content */}
      <div style={{ position: 'absolute', left: '4vw', right: '4vw', bottom: '10%', maxWidth: 600 }}>
        {/* Type badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999, background: C.accentDim, color: C.accent, border: `1px solid ${C.border}`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Flame size={10} /> {item.type === 'tv' ? 'Series' : 'Movie'}
          </span>
          {item.genres.slice(0, 2).map(g => (
            <span key={g} style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, color: C.textSub, ...G.light }}>{g}</span>
          ))}
          {item.rating > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: C.gold }}>
              <Star size={11} fill={C.gold} /> {item.rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 style={{
          margin: '0 0 14px', fontSize: 'clamp(30px, 7vw, 52px)', fontWeight: 900, lineHeight: 1.02,
          letterSpacing: '-0.035em', color: C.text, fontFamily: '"Outfit", system-ui, sans-serif',
          textShadow: '0 4px 24px rgba(0,0,0,0.6)',
        }}>{item.title}</h1>

        {/* Overview */}
        <p style={{
          margin: '0 0 24px', fontSize: 14, lineHeight: 1.6, color: 'rgba(245,240,232,0.7)', maxWidth: 500,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{item.overview}</p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '13px 24px', borderRadius: 10,
            ...G.orange, color: '#fff', border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer',
            fontFamily: '"Outfit", system-ui, sans-serif', transition: 'opacity 0.18s',
          }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.88'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
          >
            <Play size={16} fill="#fff" /> Watch Now
          </button>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '13px 20px', borderRadius: 10,
            color: C.text, fontWeight: 700, fontSize: 14, cursor: 'pointer', ...G.strong, border: `1px solid ${C.border}`,
          }}>
            <Info size={15} /> More Info
          </button>
        </div>
      </div>

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div style={{ position: 'absolute', right: '4vw', bottom: '10%', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} style={{
              width: 3, height: i === idx ? 24 : 8, borderRadius: 999, border: 'none', cursor: 'pointer',
              background: i === idx ? C.accent : 'rgba(255,107,0,0.25)',
              boxShadow: i === idx ? `0 0 8px ${C.accent}` : 'none',
              transition: 'all 0.3s ease', padding: 0,
            }} />
          ))}
        </div>
      )}

      {/* Slide thumb strip */}
      <div style={{ position: 'absolute', right: '4vw', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 8 }} className="av-desktop-nav">
        {slides.slice(0, 4).map((s, i) => (
          <button key={s.tmdb_id} onClick={() => setIdx(i)} style={{
            width: 52, height: 72, borderRadius: 6, overflow: 'hidden', border: `2px solid ${i === idx ? C.accent : 'transparent'}`,
            boxShadow: i === idx ? `0 0 12px ${C.accentGlow}` : 'none',
            padding: 0, cursor: 'pointer', background: C.surface, transition: 'all 0.25s ease',
            opacity: i === idx ? 1 : 0.5,
          }}>
            <img src={s.poster || s.backdrop} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </button>
        ))}
      </div>
    </section>
  );
}

// ─── SEARCH OVERLAY ───────────────────────────────────────────────────────────
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
        const filtered = raw.filter(r =>
          (r.media_type === 'tv' || r.media_type === 'movie') &&
          (r.original_language === 'ja' || (r.genre_ids || []).includes(16))
        );
        const items = filtered.map(r => normItem(r, r.media_type)).filter(i => i.tmdb_id && i.poster);
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: C.overlay, backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 4vw', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${C.border}`, background: C.surface }}>
        <Search size={17} color={C.accent} />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search anime titles…"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: C.text, fontSize: 16, fontWeight: 500, fontFamily: '"Outfit", system-ui, sans-serif',
          }}
        />
        {loading && <Loader2 size={16} color={C.accent} className="av-spin" />}
        <button onClick={onClose} style={{ background: C.accentDim, border: `1px solid ${C.border}`, color: C.accent, cursor: 'pointer', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
          <X size={14} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 4vw 80px' }}>
        {!query.trim() && (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p style={{ color: C.textSub, fontSize: 14, margin: 0 }}>Search for any anime by title</p>
          </div>
        )}
        {query.trim() && !loading && results.length === 0 && (
          <p style={{ color: C.textSub, fontSize: 13, marginTop: 20, textAlign: 'center' }}>No anime found for "{query}"</p>
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
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${C.accent}, #FF4500)` }} />
              </div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
              <p style={{ margin: 0, fontSize: 10, color: C.textSub }}>{item.year || '—'}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// BottomNav is now a separate component in src/components/BottomNav.tsx

// ─── SECTION DIVIDER ──────────────────────────────────────────────────────────
function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingInline: '4vw', marginBottom: 28, marginTop: 8 }}>
      <div style={{ width: 4, height: 20, borderRadius: 2, background: `linear-gradient(180deg, ${C.accent}, #FF4500)`, boxShadow: `0 0 8px ${C.accentGlow}` }} />
      <span style={{ fontSize: 11, fontWeight: 800, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${C.border}, transparent)` }} />
    </div>
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

  const [loadingHero, setLoadingHero]         = useState(true);
  const [loadingPopular, setLoadingPopular]   = useState(true);
  const [loadingTop, setLoadingTop]           = useState(true);
  const [loadingMovies, setLoadingMovies]     = useState(true);
  const [loadingGenres, setLoadingGenres]     = useState(true);

  useEffect(() => {
    (async () => {
      try { const data = await tmdb.getTrendingAnime(); setTrending(normPage(data, 'tv', 10)); }
      finally { setLoadingHero(false); }
    })();
    (async () => {
      try { const data = await tmdb.getPopularAnime(); setPopular(normPage(data, 'tv')); }
      finally { setLoadingPopular(false); }
    })();
    (async () => {
      try { const data = await tmdb.getTopRatedAnime(); setTopRated(normPage(data, 'tv')); }
      finally { setLoadingTop(false); }
    })();
    (async () => {
      try { const data = await tmdb.getAnimeMovies(); setMovies(normPage(data, 'movie')); }
      finally { setLoadingMovies(false); }
    })();
    (async () => {
      try {
        const [a, r, c, f] = await Promise.all([
          tmdb.getAnimeByGenre(28),
          tmdb.getAnimeByGenre(10749),
          tmdb.getAnimeByGenre(35),
          tmdb.getAnimeByGenre(14),
        ]);
        setAction(normPage(a, 'tv'));
        setRomance(normPage(r, 'tv'));
        setComedy(normPage(c, 'tv'));
        setFantasy(normPage(f, 'tv'));
      } finally { setLoadingGenres(false); }
    })();
  }, []);

  const handleItemClick = useCallback((item: AnimeItem) => {
    console.log('Selected:', item.title);
  }, []);

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, paddingBottom: 80 }}>
      <Navbar onSearchOpen={() => setSearchOpen(true)} />
      <Hero items={trending} loading={loadingHero} />

      <div style={{ paddingTop: 36 }}>
        <SectionDivider label="Trending & Popular" />
        <Rail title="Trending Now"       icon={<TrendingUp size={14} />} items={trending}  loading={loadingHero}    onItemClick={handleItemClick} accentTag="Live" />
        <Rail title="Most Popular"       icon={<Flame size={14} />}      items={popular}   loading={loadingPopular} onItemClick={handleItemClick} />
        <Rail title="Top Rated Series"  icon={<Star size={14} />}       items={topRated}  loading={loadingTop}     onItemClick={handleItemClick} />

        <SectionDivider label="By Category" />
        <Rail title="Anime Movies"       icon={<Film size={14} />}       items={movies}    loading={loadingMovies}  onItemClick={handleItemClick} />
        <Rail title="Action & Adventure" icon={<Swords size={14} />}    items={action}    loading={loadingGenres}  onItemClick={handleItemClick} />
        <Rail title="Romance"            icon={<Heart size={14} />}      items={romance}   loading={loadingGenres}  onItemClick={handleItemClick} />
        <Rail title="Comedy"             icon={<Laugh size={14} />}      items={comedy}    loading={loadingGenres}  onItemClick={handleItemClick} />
        <Rail title="Fantasy"            icon={<Ghost size={14} />}      items={fantasy}   loading={loadingGenres}  onItemClick={handleItemClick} />
      </div>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '28px 4vw 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: `linear-gradient(135deg, ${C.accent}, #FF4500)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#fff' }}>忍</div>
          <span style={{ fontSize: 15, fontWeight: 900, color: C.text, letterSpacing: '-0.04em', fontFamily: '"Outfit", system-ui, sans-serif' }}>
            ANI<span style={{ color: C.accent }}>VERSE</span>
          </span>
        </div>
        <p style={{ fontSize: 10, color: C.textSub, margin: 0 }}>© {new Date().getFullYear()} Aniverse. Metadata via TMDB. No content hosted.</p>
      </footer>

      <BottomNav onSearchOpen={() => setSearchOpen(true)} />
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} onSelect={handleItemClick} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        *:focus { outline: none; }
        ::-webkit-scrollbar { display: none; }
        @keyframes av-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        .av-sk {
          background: linear-gradient(90deg, #0F0F1A 25%, #16162A 50%, #0F0F1A 75%);
          background-size: 200% 100%;
          animation: av-shimmer 1.6s ease-in-out infinite;
        }
        @keyframes av-spin { to { transform: rotate(360deg); } }
        .av-spin { animation: av-spin 0.8s linear infinite; }

        /* Desktop: show nav links, hide bottom bar */
        @media (min-width: 768px) {
          .av-desktop-nav { display: flex !important; }
        }
        @media (max-width: 767px) {
          .av-desktop-nav { display: none !important; }
        }
      `}</style>
    </div>
  );
}
