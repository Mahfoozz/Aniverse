// src/lib/tmdb.ts

const BASE_URL = '/api/tmdb'; // proxied through Vercel — avoids ISP blocks & hides key

interface CacheEntry {
  data: any;
  timestamp: number;
}

class TmdbClient {
  private cache: Map<string, CacheEntry> = new Map();
  private requestQueue: Array<{
    url: string;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
  }> = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private MIN_DELAY = 350;
  private CACHE_EXPIRY = 48 * 60 * 60 * 1000; // 48 hours

  constructor() {
    this.loadCache();
  }

  private loadCache() {
    try {
      const saved = localStorage.getItem('aniverse_tmdb_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        const now = Date.now();
        Object.keys(parsed).forEach(key => {
          if (now - parsed[key].timestamp < this.CACHE_EXPIRY) {
            this.cache.set(key, parsed[key]);
          }
        });
      }
    } catch (e) {
      console.error('Failed to load TMDB cache', e);
    }
  }

  private saveCache() {
    try {
      const obj: Record<string, CacheEntry> = {};
      this.cache.forEach((val, key) => { obj[key] = val; });
      localStorage.setItem('aniverse_tmdb_cache', JSON.stringify(obj));
    } catch (e) {
      console.warn('Failed to save TMDB cache', e);
    }
  }

  private async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return;
    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceLast = now - this.lastRequestTime;
      if (timeSinceLast < this.MIN_DELAY) {
        await new Promise(r => setTimeout(r, this.MIN_DELAY - timeSinceLast));
      }

      const request = this.requestQueue.shift();
      if (request) {
        try {
          const data = await this.performFetch(request.url);
          this.lastRequestTime = Date.now();
          request.resolve(data);
        } catch (error) {
          this.lastRequestTime = Date.now();
          request.reject(error);
        }
      }
    }

    this.isProcessing = false;
  }

  private async performFetch(url: string, retries = 2): Promise<any> {
    let response: Response;
    try {
      response = await fetch(url);
    } catch (networkErr) {
      throw networkErr;
    }

    if (response.status === 401 || response.status === 403) {
      const e: any = new Error(`TMDB_AUTH_ERROR:${response.status}`);
      e.status = response.status;
      throw e;
    }

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '5');
      await new Promise(r => setTimeout(r, retryAfter * 1000));
      return this.performFetch(url, retries);
    }

    if (!response.ok) {
      if (retries > 0) {
        const delay = (3 - retries) * 2000;
        await new Promise(r => setTimeout(r, delay));
        return this.performFetch(url, retries - 1);
      }
      throw new Error(`TMDB API Error: ${response.status}`);
    }

    const data = await response.json();
    if (data && data.success !== false) {
      this.cache.set(url, { data, timestamp: Date.now() });
      this.saveCache();
    }
    return data;
  }

  public async fetch(endpoint: string, params: Record<string, string | number> = {}): Promise<any> {
    const queryParams = new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    );

    const url = `${BASE_URL}${endpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const cached = this.cache.get(url);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_EXPIRY)) {
      return cached.data;
    }

    return new Promise((resolve, reject) => {
      this.requestQueue.push({ url, resolve, reject });
      this.processQueue();
    });
  }
}

const client = new TmdbClient();

export type PingResult = 'ok' | 'network_error' | 'auth_error' | 'no_key';

export async function pingTmdb(timeoutMs = 10_000): Promise<PingResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch('/api/tmdb/configuration', { signal: controller.signal });
    clearTimeout(timer);
    if (res.status === 401 || res.status === 403) return 'auth_error';
    if (res.ok) return 'ok';
    return 'network_error';
  } catch {
    clearTimeout(timer);
    return 'network_error';
  }
}

// ─── ANIME-FOCUSED TMDB HELPERS ───────────────────────────────────────────────
// Aniverse is anime-only, so every query is scoped to genre 16 (Animation)
// + original_language=ja (Japanese origin) to keep results anime-specific.
const ANIME_BASE = { with_genres: '16', with_original_language: 'ja' };

export const tmdb = {
  getTrendingAnime: (page = 1) =>
    client.fetch('/discover/tv', { ...ANIME_BASE, page, sort_by: 'popularity.desc' }),

  getPopularAnime: (page = 1) =>
    client.fetch('/discover/tv', { ...ANIME_BASE, page, sort_by: 'vote_count.desc' }),

  getTopRatedAnime: (page = 1) =>
    client.fetch('/discover/tv', { ...ANIME_BASE, page, sort_by: 'vote_average.desc', 'vote_count.gte': 200 }),

  getAnimeMovies: (page = 1) =>
    client.fetch('/discover/movie', { ...ANIME_BASE, page, sort_by: 'popularity.desc' }),

  getUpcomingAnime: (page = 1) => {
    const today = new Date().toISOString().slice(0, 10);
    return client.fetch('/discover/tv', {
      ...ANIME_BASE, page,
      sort_by: 'first_air_date.desc',
      'first_air_date.gte': today,
    });
  },

  getAnimeByGenre: (genreId: number, page = 1) =>
    client.fetch('/discover/tv', { with_genres: `16,${genreId}`, with_original_language: 'ja', page, sort_by: 'popularity.desc' }),

  // Multi-search, then filtered client-side down to anime-shaped results
  searchAnime: (query: string, page = 1) =>
    client.fetch('/search/multi', { query, page, include_adult: 'false' }),

  getDetails: (type: 'movie' | 'tv', id: string | number) =>
    client.fetch(`/${type}/${id}`, { append_to_response: 'videos,credits,recommendations,external_ids' }),
};

export const getTMDBImage = (
  path: string | null | undefined,
  size: 'poster' | 'backdrop' | 'w500' | 'w185' | 'w92' | 'original' = 'w500'
) => {
  if (!path) return '';
  const sizes = { poster: 'w500', backdrop: 'original', w500: 'w500', w185: 'w185', w92: 'w92', original: 'original' };
  return `https://image.tmdb.org/t/p/${sizes[size] || 'w500'}${path}`;
};
