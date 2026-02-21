// --- Types ---

export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
}

export interface CacheStats {
  evolutionCache: number;
  reverseEvolutionCache: number;
  imageCache: number;
  searchCache: number;
  totalEntries: number;
  storageType: string;
  lastUpdated: number;
}

export interface StorageUsage {
  bytes: number;
  kilobytes: number;
  megabytes: number;
}

export interface BatchSpeciesData {
  species: string;
  evolutionData?: unknown;
  reverseData?: unknown;
  imageUrl?: string;
}

// --- Cache configuration ---

const CACHE_PREFIX = {
  EVOLUTION: 'evolution_cache_',
  REVERSE: 'reverse_cache_',
  IMAGE: 'image_cache_',
  SEARCH: 'search_cache_',
} as const;

const STATS_KEY = 'evolution_cache_stats';

// Cache expiry times (milliseconds)
const CACHE_DURATION = 24 * 60 * 60 * 1000;       // 24 hours
const SEARCH_CACHE_DURATION = 60 * 60 * 1000;      // 1 hour
const IMAGE_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 1 week

// Maximum cache sizes
const MAX_CACHE_SIZE = 2000;
const MAX_SEARCH_CACHE_SIZE = 1000;
const MAX_IMAGE_CACHE_SIZE = 5000;

// --- Storage helpers ---

function isLocalStorageAvailable(): boolean {
  try {
    const testKey = 'test_localStorage';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function getFromStorage<T>(key: string): CacheEntry<T> | null {
  if (!isLocalStorageAvailable()) return null;

  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as CacheEntry<T>) : null;
  } catch (error) {
    console.warn(`Error reading from localStorage key ${key}:`, error);
    return null;
  }
}

function setToStorage<T>(key: string, value: CacheEntry<T>): boolean {
  if (!isLocalStorageAvailable()) return false;

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    const storageError = error as { name?: string };
    if (storageError.name === 'QuotaExceededError') {
      clearOldestEntries();
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

function removeFromStorage(key: string): void {
  if (!isLocalStorageAvailable()) return;

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Error removing from localStorage key ${key}:`, error);
  }
}

function getKeysWithPrefix(prefix: string): string[] {
  if (!isLocalStorageAvailable()) return [];

  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key);
      }
    }
  } catch (error) {
    console.warn('Error getting keys from localStorage:', error);
  }
  return keys;
}

function isExpired(entry: CacheEntry, maxAge: number): boolean {
  return Date.now() - entry.timestamp > maxAge;
}

function clearOldestEntries(): void {
  const allKeys = getKeysWithPrefix(CACHE_PREFIX.EVOLUTION);
  const entries: { key: string; timestamp: number }[] = [];

  for (const key of allKeys) {
    const cached = getFromStorage(key);
    if (cached?.timestamp) {
      entries.push({ key, timestamp: cached.timestamp });
    }
  }

  entries.sort((a, b) => a.timestamp - b.timestamp);
  const toRemove = Math.ceil(entries.length * 0.2);

  for (let i = 0; i < toRemove; i++) {
    removeFromStorage(entries[i].key);
  }
}

function cleanupCacheByPrefix(prefix: string, maxAge: number, maxSize: number): void {
  const keys = getKeysWithPrefix(prefix);
  const now = Date.now();
  const entries: { key: string; timestamp: number }[] = [];

  for (const key of keys) {
    const cached = getFromStorage(key);
    if (cached?.timestamp) {
      if (now - cached.timestamp > maxAge) {
        removeFromStorage(key);
      } else {
        entries.push({ key, timestamp: cached.timestamp });
      }
    } else {
      removeFromStorage(key);
    }
  }

  if (entries.length > maxSize) {
    entries.sort((a, b) => a.timestamp - b.timestamp);
    const entriesToRemove = entries.length - maxSize;
    for (let i = 0; i < entriesToRemove; i++) {
      removeFromStorage(entries[i].key);
    }
  }
}

// --- Service ---

const evolutionCacheService = {
  // Initialize and cleanup on startup
  initialize: (): void => {
    try {
      evolutionCacheService.cleanupExpiredEntries();
    } catch (error) {
      console.warn('Error initializing evolution cache:', error);
    }
  },

  // Clean up all expired entries
  cleanupExpiredEntries: (): void => {
    const prefixes = [
      { prefix: CACHE_PREFIX.EVOLUTION, maxAge: CACHE_DURATION },
      { prefix: CACHE_PREFIX.REVERSE, maxAge: CACHE_DURATION },
      { prefix: CACHE_PREFIX.IMAGE, maxAge: IMAGE_CACHE_DURATION },
      { prefix: CACHE_PREFIX.SEARCH, maxAge: SEARCH_CACHE_DURATION },
    ];

    const now = Date.now();

    for (const { prefix, maxAge } of prefixes) {
      const keys = getKeysWithPrefix(prefix);
      for (const key of keys) {
        const cached = getFromStorage(key);
        if (cached && now - cached.timestamp > maxAge) {
          removeFromStorage(key);
        }
      }
    }
  },

  // ── Evolution data ────────────────────────────────────────────────

  getEvolutionData: (speciesName: string): unknown | null => {
    const key = `${CACHE_PREFIX.EVOLUTION}${speciesName.toLowerCase()}`;
    const cached = getFromStorage(key);

    if (cached && !isExpired(cached, CACHE_DURATION)) {
      return cached.data;
    }
    return null;
  },

  setEvolutionData: (speciesName: string, data: unknown): void => {
    const key = `${CACHE_PREFIX.EVOLUTION}${speciesName.toLowerCase()}`;
    const entry: CacheEntry = { data, timestamp: Date.now() };

    if (setToStorage(key, entry) && Math.random() < 0.1) {
      cleanupCacheByPrefix(CACHE_PREFIX.EVOLUTION, CACHE_DURATION, MAX_CACHE_SIZE);
    }
  },

  // ── Reverse evolution data ────────────────────────────────────────

  getReverseEvolutionData: (speciesName: string): unknown | null => {
    const key = `${CACHE_PREFIX.REVERSE}${speciesName.toLowerCase()}`;
    const cached = getFromStorage(key);

    if (cached && !isExpired(cached, CACHE_DURATION)) {
      return cached.data;
    }
    return null;
  },

  setReverseEvolutionData: (speciesName: string, data: unknown): void => {
    const key = `${CACHE_PREFIX.REVERSE}${speciesName.toLowerCase()}`;
    const entry: CacheEntry = { data, timestamp: Date.now() };

    if (setToStorage(key, entry) && Math.random() < 0.1) {
      cleanupCacheByPrefix(CACHE_PREFIX.REVERSE, CACHE_DURATION, MAX_CACHE_SIZE);
    }
  },

  // ── Image data ────────────────────────────────────────────────────

  getImageData: (speciesName: string): string | null => {
    const key = `${CACHE_PREFIX.IMAGE}${speciesName.toLowerCase()}`;
    const cached = getFromStorage<string>(key);

    if (cached && !isExpired(cached, IMAGE_CACHE_DURATION)) {
      return cached.data;
    }
    return null;
  },

  setImageData: (speciesName: string, imageUrl: string): void => {
    const key = `${CACHE_PREFIX.IMAGE}${speciesName.toLowerCase()}`;
    const entry: CacheEntry<string> = { data: imageUrl, timestamp: Date.now() };

    if (setToStorage(key, entry) && Math.random() < 0.05) {
      cleanupCacheByPrefix(CACHE_PREFIX.IMAGE, IMAGE_CACHE_DURATION, MAX_IMAGE_CACHE_SIZE);
    }
  },

  // ── Search results ────────────────────────────────────────────────

  getSearchResults: <T = unknown>(searchTerm: string): T | null => {
    const key = `${CACHE_PREFIX.SEARCH}${searchTerm.toLowerCase()}`;
    const cached = getFromStorage<T>(key);

    if (cached && !isExpired(cached, SEARCH_CACHE_DURATION)) {
      return cached.data;
    }
    return null;
  },

  setSearchResults: <T = unknown>(searchTerm: string, results: T): void => {
    const key = `${CACHE_PREFIX.SEARCH}${searchTerm.toLowerCase()}`;
    const entry: CacheEntry<T> = { data: results, timestamp: Date.now() };

    if (setToStorage(key, entry) && Math.random() < 0.2) {
      cleanupCacheByPrefix(CACHE_PREFIX.SEARCH, SEARCH_CACHE_DURATION, MAX_SEARCH_CACHE_SIZE);
    }
  },

  // ── Batch operations ──────────────────────────────────────────────

  batchSetEvolutionData: (speciesDataArray: BatchSpeciesData[]): void => {
    for (const { species, evolutionData, reverseData, imageUrl } of speciesDataArray) {
      try {
        if (evolutionData !== undefined) {
          evolutionCacheService.setEvolutionData(species, evolutionData);
        }
        if (reverseData !== undefined) {
          evolutionCacheService.setReverseEvolutionData(species, reverseData);
        }
        if (imageUrl !== undefined) {
          evolutionCacheService.setImageData(species, imageUrl);
        }
      } catch (error) {
        console.warn(`Failed to cache data for species ${species}:`, error);
      }
    }
  },

  // ── Cache clearing ────────────────────────────────────────────────

  clearAll: (): void => {
    evolutionCacheService.clearEvolutionCache();
    evolutionCacheService.clearReverseEvolutionCache();
    evolutionCacheService.clearImageCache();
    evolutionCacheService.clearSearchCache();
    removeFromStorage(STATS_KEY);
  },

  clearEvolutionCache: (): void => {
    const keys = getKeysWithPrefix(CACHE_PREFIX.EVOLUTION);
    for (const key of keys) removeFromStorage(key);
  },

  clearReverseEvolutionCache: (): void => {
    const keys = getKeysWithPrefix(CACHE_PREFIX.REVERSE);
    for (const key of keys) removeFromStorage(key);
  },

  clearImageCache: (): void => {
    const keys = getKeysWithPrefix(CACHE_PREFIX.IMAGE);
    for (const key of keys) removeFromStorage(key);
  },

  clearSearchCache: (): void => {
    const keys = getKeysWithPrefix(CACHE_PREFIX.SEARCH);
    for (const key of keys) removeFromStorage(key);
  },

  // ── Statistics & health ───────────────────────────────────────────

  getStats: (): CacheStats => {
    const evolutionKeys = getKeysWithPrefix(CACHE_PREFIX.EVOLUTION);
    const reverseKeys = getKeysWithPrefix(CACHE_PREFIX.REVERSE);
    const imageKeys = getKeysWithPrefix(CACHE_PREFIX.IMAGE);
    const searchKeys = getKeysWithPrefix(CACHE_PREFIX.SEARCH);

    const stats: CacheStats = {
      evolutionCache: evolutionKeys.length,
      reverseEvolutionCache: reverseKeys.length,
      imageCache: imageKeys.length,
      searchCache: searchKeys.length,
      totalEntries: evolutionKeys.length + reverseKeys.length + imageKeys.length + searchKeys.length,
      storageType: 'localStorage',
      lastUpdated: Date.now(),
    };

    setToStorage(STATS_KEY, { data: stats, timestamp: Date.now() });
    return stats;
  },

  getStorageUsage: (): StorageUsage | null => {
    if (!isLocalStorageAvailable()) return null;

    let totalSize = 0;
    const prefixes = Object.values(CACHE_PREFIX);

    try {
      for (const prefix of prefixes) {
        const keys = getKeysWithPrefix(prefix);
        for (const key of keys) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += key.length + value.length;
          }
        }
      }

      return {
        bytes: totalSize,
        kilobytes: Math.round((totalSize / 1024) * 100) / 100,
        megabytes: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
      };
    } catch (error) {
      console.warn('Error calculating storage usage:', error);
      return null;
    }
  },

  isHealthy: (): boolean => {
    try {
      const evolutionKeys = getKeysWithPrefix(CACHE_PREFIX.EVOLUTION).slice(0, 5);
      for (const key of evolutionKeys) {
        const cached = getFromStorage(key);
        if (cached && (!cached.data || !cached.timestamp)) {
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  },
};

// Initialize on module load
evolutionCacheService.initialize();

export default evolutionCacheService;
