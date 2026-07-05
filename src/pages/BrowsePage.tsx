// src/pages/BrowsePage.tsx — Browse all animated/cartoon content

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  Search, Star, Tv, Film, Filter, ChevronDown,
  Flame, TrendingUp, Trophy, Loader2, X,
} from 'lucide-react';
import { tmdb, getTMDBImage, isAnimation } from '@/lib/tmdb';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';

const C = {
  bg:        '#0A0A0F',
  surface:   '#0F0F1A',
  elevated:  '#16162A',
  text:      '#F5F0E8',
  textSub:   '#8A8090',
  accent:    '#FF6B00',
  accentDim: 'rgba(255,107,0,0.18)',
  accentGlow:'rgba(255,107,0,0.35)',
  gold:      '#E8A838',
  border:    'rgba(255,107,0,0.12)',
  borderHov: 'rgba(255,107,0,0.28)',
} as const;

const G = {
  strong: {
    background:           'rgba(10,10,15,0.75)',
    backdropFilter:        'blur(28px)',
    WebkitBackdropFilter:  'blur(28px)',
    border:                `1px solid rgba(255,107,0,0.18)`,
    boxShadow:             '0 6px 28px rgba(0,0,0,0.65)',
  },
} as const;

export interface AnimeItem {
  type:     'movie' | 'tv';
  title:    string;
  year:     number;
  overview: string;
  rating:   number;
  genres:   string[];
  tmdb_id:  number;
  poster:   string;
  backdrop: string;
}

const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  18: 'Drama', 10751: 'Family', 14: 'Fantasy', 27: 'Horror',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 53: 'Thriller',
  10759: 'Action & Adventure', 10765: 'Sci-Fi & Fantasy',
};

// Genre filter options (always AND'd with genre 16 on API side)
const GENRE_FILTERS = [
  { id: 0,     label: 'All' },
  { id: 28,    label: 'Action' },
  { id: 35,    label: 'Comedy' },
  { id: 14,    label: 'Fantasy' },
  { id: 18,    label: 'Drama' },
  { id: 10749, label: 'Romance' },
  { id: 878,   label: 'Sci-Fi' },
  { id: 10751, label: 'Family' },
  { id: 12,    label: 'Adventure' },
];

const SORT_OPTIONS = [
  { value: 'popularity.desc',    label: 'Most Popular' },
  { value: 'vote_average.desc',  label: 'Top Rated' },
  { value: 'vote_count.desc',    label: 'Most Voted' },
  { value: 'first_air_date.desc',label: 'Newest' },
];

function normItem(raw: any, type: 'movie' | 'tv'): AnimeItem {
  const isMovie = type === 'movie';
  const title   = isMovie ? (raw.title || raw.original_title) : (raw.name || raw.original_name);
  const dateStr = isMovie ? raw.release_date : raw.first_air_date;
  return {
    type, title: title || 'Unknown',
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
  return data.results
    .filter((r: any) => isAnimation(r)) // strict client-side animation gate
    .slice(0, limit)
    .map((r: any) => normItem(r, type))
    .filter((i: AnimeItem) => i.tmdb_id && i.poster);
}

// ─── BROWSE CARD ──────────────────────────────────────────────────────────────
const BrowseCard = memo(function BrowseCard({ item }: { item: AnimeItem }) {
  const [hov, setHov] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 12, overflow: 'hidden', background: C.surface, cursor: 'pointer',
        border: `1px solid ${hov ? C.borderHov : C.border}`,
        boxShadow: hov ? `0 16px 40px rgba(0,0,0,0.6), 0 0 0 1px ${C.borderHov}` : '0 4px 12px rgba(0,0,0,0.3)',
        transform: hov ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.25s cubic-bezier(0.2,0.8,0.2,1)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Poster */}
      <div style={{ width: '100%', paddingTop: '140%', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {item.poster ? (
          <img
            src={item.poster} alt={item.title} loading="lazy"
            onLoad={() => setLoaded(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: loaded ? 1 : 0, transition: 'opacity 0.25s' }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Tv size={28} color={C.textSub} style={{ opacity: 0.2 }} />
          </div>
        )}
        {/* Orange hover overlay */}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 50%, rgba(10,10,15,0.9) 100%)`, opacity: hov ? 1 : 0.4, transition: 'opacity 0.25s' }} />
        {/* Type badge */}
        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4 }}>
          <span style={{
            fontSize: 9, fontWeight: 800, padding: '3px 7px', borderRadius: 999,
            background: item.type === 'tv' ? 'rgba(255,107,0,0.85)' : 'rgba(200,34,0,0.85)',
            color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>{item.type === 'tv' ? 'Series' : 'Movie'}</span>
        </div>
        {/* Rating */}
        {item.rating > 0 && (
          <div style={{ position: 'absolute', top: 8, right: 8, padding: '3px 7px', borderRadius: 6, ...G.strong, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Star size={9} color={C.gold} fill={C.gold} />
            <span style={{ fontSize: 10, fontWeight: 700, color: C.text }}>{item.rating.toFixed(1)}</span>
          </div>
        )}
        {/* Orange bottom line on hover */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${C.accent}, #FF4500)`, opacity: hov ? 1 : 0, transition: 'opacity 0.2s' }} />
      </div>

      {/* Info */}
      <div style={{ padding: '10px 10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: hov ? C.accent : C.text, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.2s' }}>{item.title}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: C.textSub }}>{item.year || '—'}</span>
          {item.genres[0] && (
            <>
              <span style={{ fontSize: 10, color: C.border }}>·</span>
              <span style={{ fontSize: 10, color: C.textSub }}>{item.genres[0]}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

// ─── SKELETON GRID CARD ───────────────────────────────────────────────────────
function SkeletonGridCard() {
  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', background: C.surface }}>
      <div style={{ width: '100%', paddingTop: '140%' }} className="av-sk" />
      <div style={{ padding: '10px 10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ height: 12, borderRadius: 4, width: '75%' }} className="av-sk" />
        <div style={{ height: 10, borderRadius: 4, width: '40%' }} className="av-sk" />
      </div>
    </div>
  );
}

// ─── SEARCH OVERLAY ───────────────────────────────────────────────────────────
function SearchOverlay({ onClose }: { onClose: () => void }) {
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
        // Strict: must have genre 16 (Animation) — no exceptions
        const items = raw
          .filter(r => (r.media_type === 'tv' || r.media_type === 'movie') && isAnimation(r))
          .map(r => normItem(r, r.media_type))
          .filter(i => i.tmdb_id && i.poster);
        setResults(items);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(10,10,15,0.96)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 4vw', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${C.border}`, background: C.surface }}>
        <Search size={17} color={C.accent} />
        <input
          ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search animated shows & movies…"
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: C.text, fontSize: 16, fontWeight: 500, fontFamily: '"Outfit", system-ui, sans-serif' }}
        />
        {loading && <Loader2 size={16} color={C.accent} className="av-spin" />}
        <button onClick={onClose} style={{ background: C.accentDim, border: `1px solid ${C.border}`, color: C.accent, cursor: 'pointer', padding: '6px 10px', borderRadius: 8 }}>
          <X size={14} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 4vw 80px' }}>
        {!query.trim() && (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎌</div>
            <p style={{ color: C.textSub, fontSize: 14, margin: 0 }}>Search animated series & movies</p>
          </div>
        )}
        {query.trim() && !loading && results.length === 0 && (
          <p style={{ color: C.textSub, fontSize: 13, marginTop: 20, textAlign: 'center' }}>No animated titles found for "{query}"</p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 14 }}>
          {results.map(item => <BrowseCard key={`${item.type}-${item.tmdb_id}`} item={item} />)}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN BROWSE PAGE ─────────────────────────────────────────────────────────
export default function BrowsePage() {
  const [mediaType, setMediaType] = useState<'tv' | 'movie' | 'all'>('all');
  const [genreId, setGenreId] = useState(0);
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [items, setItems] = useState<AnimeItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(async (pg: number, reset: boolean) => {
    if (reset) setLoading(true); else setLoadingMore(true);
    try {
      let tvData: any = null;
      let movieData: any = null;

      const sortParam = sortBy as string;
      // TV sort param — TMDB uses first_air_date for TV, release_date for movies
      const tvSort = sortParam === 'first_air_date.desc' ? 'first_air_date.desc' : sortParam;
      const movieSort = sortParam === 'first_air_date.desc' ? 'release_date.desc' : sortParam;

      if (mediaType === 'tv' || mediaType === 'all') {
        tvData = genreId
          ? await tmdb.getAnimeByGenre(genreId, pg)
          : await (async () => {
              // use custom sort
              const { tmdb: t, ..._ } = await import('@/lib/tmdb');
              return t.getTrendingAnime(pg);
            })();
        // Re-fetch with correct sort when not default
        if (sortParam !== 'popularity.desc' && !genreId) {
          const params: any = { with_genres: '16', page: pg, sort_by: tvSort };
          if (sortParam === 'vote_average.desc') params['vote_count.gte'] = 200;
          tvData = await (await import('@/lib/tmdb')).tmdb.getTopRatedAnime(pg);
          if (sortParam === 'vote_count.desc') tvData = await (await import('@/lib/tmdb')).tmdb.getPopularAnime(pg);
        }
      }
      if (mediaType === 'movie' || mediaType === 'all') {
        movieData = genreId
          ? await tmdb.getMoviesByGenre(genreId, pg)
          : await tmdb.getAnimeMovies(pg);
      }

      const tvItems   = tvData    ? normPage(tvData,    'tv',    20) : [];
      const movieItems= movieData ? normPage(movieData, 'movie', 20) : [];

      // Merge and de-dupe
      const merged = [...tvItems, ...movieItems]
        .filter((item, idx, arr) => arr.findIndex(x => x.tmdb_id === item.tmdb_id && x.type === item.type) === idx)
        .sort((a, b) => b.rating - a.rating);

      setItems(prev => reset ? merged : [...prev, ...merged]);
      setHasMore(merged.length >= 10);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [mediaType, genreId, sortBy]);

  // Reset on filter change
  useEffect(() => {
    setPage(1);
    setItems([]);
    fetchPage(1, true);
  }, [mediaType, genreId, sortBy]);

  // Infinite scroll
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loadingMore && !loading && hasMore) {
        const next = page + 1;
        setPage(next);
        fetchPage(next, false);
      }
    }, { threshold: 0.1 });
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [loadingMore, loading, hasMore, page, fetchPage]);

  const currentSortLabel = SORT_OPTIONS.find(s => s.value === sortBy)?.label || 'Sort';

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, paddingBottom: 100 }}>
      <Navbar onSearchOpen={() => setSearchOpen(true)} />

      {/* Page header */}
      <div style={{ paddingTop: 80, paddingInline: '4vw', marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 'clamp(22px, 5vw, 32px)', fontWeight: 900, letterSpacing: '-0.03em', fontFamily: '"Outfit", system-ui, sans-serif' }}>
          Browse <span style={{ color: C.accent }}>Animated</span>
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: C.textSub }}>Every result is animated — cartoons, anime, and beyond.</p>
      </div>

      {/* Filter bar */}
      <div style={{ paddingInline: '4vw', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Media type tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {([['all', 'All', <Filter size={13} />], ['tv', 'Series', <Tv size={13} />], ['movie', 'Movies', <Film size={13} />]] as const).map(([val, label, icon]) => (
            <button key={val} onClick={() => setMediaType(val as any)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: mediaType === val ? C.accent : C.elevated,
              color: mediaType === val ? '#fff' : C.textSub,
              fontSize: 13, fontWeight: mediaType === val ? 800 : 500,
              boxShadow: mediaType === val ? `0 0 16px ${C.accentGlow}` : 'none',
              transition: 'all 0.18s ease',
            }}>{icon}{label}</button>
          ))}

          {/* Sort dropdown */}
          <div style={{ marginLeft: 'auto', position: 'relative' }}>
            <button
              onClick={() => setShowSortMenu(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999,
                border: `1px solid ${C.border}`, background: C.elevated, color: C.text,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {currentSortLabel} <ChevronDown size={12} />
            </button>
            {showSortMenu && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 20, borderRadius: 12, overflow: 'hidden',
                ...G.strong, minWidth: 160,
              }}>
                {SORT_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }} style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', border: 'none',
                    background: sortBy === opt.value ? C.accentDim : 'transparent',
                    color: sortBy === opt.value ? C.accent : C.text,
                    fontSize: 13, fontWeight: sortBy === opt.value ? 700 : 400, cursor: 'pointer',
                  }}>{opt.label}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Genre chips */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
          {GENRE_FILTERS.map(g => (
            <button key={g.id} onClick={() => setGenreId(g.id)} style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: 999, border: `1px solid ${genreId === g.id ? C.accent : C.border}`,
              background: genreId === g.id ? C.accentDim : 'transparent',
              color: genreId === g.id ? C.accent : C.textSub,
              fontSize: 12, fontWeight: genreId === g.id ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s',
            }}>{g.label}</button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      {!loading && items.length > 0 && (
        <div style={{ paddingInline: '4vw', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 3, height: 16, borderRadius: 2, background: `linear-gradient(180deg, ${C.accent}, #FF4500)` }} />
            <span style={{ fontSize: 12, color: C.textSub, fontWeight: 600 }}>{items.length}+ titles</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { icon: <TrendingUp size={11} />, label: `${items.filter(i => i.type === 'tv').length} Series` },
              { icon: <Film size={11} />,       label: `${items.filter(i => i.type === 'movie').length} Movies` },
              { icon: <Trophy size={11} />,     label: `Avg ${(items.reduce((s, i) => s + i.rating, 0) / items.length).toFixed(1)}★` },
            ].map(s => (
              <span key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.textSub, padding: '3px 8px', borderRadius: 999, background: C.elevated }}>
                {s.icon}{s.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      <div style={{ paddingInline: '4vw' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
            {Array.from({ length: 18 }).map((_, i) => <SkeletonGridCard key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎌</div>
            <p style={{ color: C.textSub, fontSize: 14 }}>No animated titles found for these filters.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
            {items.map(item => <BrowseCard key={`${item.type}-${item.tmdb_id}`} item={item} />)}
          </div>
        )}

        {/* Infinite scroll loader */}
        <div ref={loaderRef} style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
          {loadingMore && <Loader2 size={20} color={C.accent} className="av-spin" />}
        </div>
      </div>

      <BottomNav onSearchOpen={() => setSearchOpen(true)} />
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        *:focus { outline: none; }
        ::-webkit-scrollbar { display: none; }
        @keyframes av-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .av-sk { background: linear-gradient(90deg, #0F0F1A 25%, #16162A 50%, #0F0F1A 75%); background-size: 200% 100%; animation: av-shimmer 1.6s ease-in-out infinite; }
        @keyframes av-spin { to { transform: rotate(360deg); } }
        .av-spin { animation: av-spin 0.8s linear infinite; }
        @media (min-width: 768px) { .av-desktop-nav { display: flex !important; } }
        @media (max-width: 767px) { .av-desktop-nav { display: none !important; } }
      `}</style>
    </div>
  );
}
