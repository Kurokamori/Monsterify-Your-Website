/**
 * Evolution Cache Service
 * Caches evolution data to improve performance, especially for Digimon searches
 */

class EvolutionCacheService {
  constructor() {
    // Cache prefixes for localStorage
    this.EVOLUTION_PREFIX = 'evolution_cache_';
    this.REVERSE_PREFIX = 'reverse_cache_';
    this.IMAGE_PREFIX = 'image_cache_';
    this.SEARCH_PREFIX = 'search_cache_';
    this.STATS_KEY = 'evolution_cache_stats';
    
    // Cache expiry times (in milliseconds)
    this.CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours (increased for persistent storage)
    this.SEARCH_CACHE_DURATION = 60 * 60 * 1000; // 1 hour for searches
    this.IMAGE_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 1 week for images
    
    // Maximum cache sizes to prevent localStorage issues
    this.MAX_CACHE_SIZE = 2000;
    this.MAX_SEARCH_CACHE_SIZE = 1000;
    this.MAX_IMAGE_CACHE_SIZE = 5000;
    
    // Initialize and cleanup on startup
    this.initializeCache();
  }

  /**
   * Initialize cache and perform cleanup on startup
   */
  initializeCache() {
    try {
      this.cleanupExpiredEntries();
      this.updateStats();
    } catch (error) {
      console.warn('Error initializing evolution cache:', error);
    }
  }

  /**
   * Check if localStorage is available
   */
  isLocalStorageAvailable() {
    try {
      const testKey = 'test_localStorage';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get item from localStorage with error handling
   */
  getFromStorage(key) {
    if (!this.isLocalStorageAvailable()) return null;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn(`Error reading from localStorage key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set item to localStorage with error handling
   */
  setToStorage(key, value) {
    if (!this.isLocalStorageAvailable()) return false;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Error writing to localStorage key ${key}:`, error);
      // If storage is full, try to clear some space
      if (error.name === 'QuotaExceededError') {
        this.clearOldestEntries();
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch (retryError) {
          console.error('Failed to store after cleanup:', retryError);
          return false;
        }
      }
      return false;
    }
  }

  /**
   * Remove item from localStorage
   */
  removeFromStorage(key) {
    if (!this.isLocalStorageAvailable()) return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Error removing from localStorage key ${key}:`, error);
    }
  }

  /**
   * Get all keys with a specific prefix
   */
  getKeysWithPrefix(prefix) {
    if (!this.isLocalStorageAvailable()) return [];
    
    const keys = [];
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

  /**
   * Clean up expired entries on startup
   */
  cleanupExpiredEntries() {
    const prefixes = [
      { prefix: this.EVOLUTION_PREFIX, maxAge: this.CACHE_DURATION },
      { prefix: this.REVERSE_PREFIX, maxAge: this.CACHE_DURATION },
      { prefix: this.IMAGE_PREFIX, maxAge: this.IMAGE_CACHE_DURATION },
      { prefix: this.SEARCH_PREFIX, maxAge: this.SEARCH_CACHE_DURATION }
    ];

    const now = Date.now();
    
    prefixes.forEach(({ prefix, maxAge }) => {
      const keys = this.getKeysWithPrefix(prefix);
      keys.forEach(key => {
        const cached = this.getFromStorage(key);
        if (cached && (now - cached.timestamp > maxAge)) {
          this.removeFromStorage(key);
        }
      });
    });
  }

  /**
   * Clear oldest entries when storage is full
   */
  clearOldestEntries() {
    const allKeys = this.getKeysWithPrefix('evolution_cache_');
    const entries = [];
    
    allKeys.forEach(key => {
      const cached = this.getFromStorage(key);
      if (cached && cached.timestamp) {
        entries.push({ key, timestamp: cached.timestamp });
      }
    });
    
    // Sort by timestamp and remove oldest 20%
    entries.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = Math.ceil(entries.length * 0.2);
    
    for (let i = 0; i < toRemove; i++) {
      this.removeFromStorage(entries[i].key);
    }
    
    console.log(`Cleared ${toRemove} oldest cache entries to free up storage space`);
  }

  /**
   * Generate cache key for evolution data
   */
  getEvolutionKey(speciesName) {
    return `${this.EVOLUTION_PREFIX}${speciesName.toLowerCase()}`;
  }

  /**
   * Generate cache key for reverse evolution data
   */
  getReverseEvolutionKey(speciesName) {
    return `${this.REVERSE_PREFIX}${speciesName.toLowerCase()}`;
  }

  /**
   * Generate cache key for species image
   */
  getImageKey(speciesName) {
    return `${this.IMAGE_PREFIX}${speciesName.toLowerCase()}`;
  }

  /**
   * Generate cache key for species search
   */
  getSearchKey(searchTerm) {
    return `${this.SEARCH_PREFIX}${searchTerm.toLowerCase()}`;
  }

  /**
   * Check if cache entry is expired
   */
  isExpired(cacheEntry, maxAge) {
    return Date.now() - cacheEntry.timestamp > maxAge;
  }

  /**
   * Clean up entries from localStorage by prefix
   */
  cleanupCacheByPrefix(prefix, maxAge, maxSize) {
    const keys = this.getKeysWithPrefix(prefix);
    const now = Date.now();
    const entries = [];
    
    // Collect all entries with timestamps
    keys.forEach(key => {
      const cached = this.getFromStorage(key);
      if (cached && cached.timestamp) {
        if (now - cached.timestamp > maxAge) {
          // Remove expired entries immediately
          this.removeFromStorage(key);
        } else {
          entries.push({ key, timestamp: cached.timestamp });
        }
      } else {
        // Remove entries without proper timestamp
        this.removeFromStorage(key);
      }
    });
    
    // If still over max size, remove oldest entries
    if (entries.length > maxSize) {
      entries.sort((a, b) => a.timestamp - b.timestamp);
      const entriesToRemove = entries.length - maxSize;
      
      for (let i = 0; i < entriesToRemove; i++) {
        this.removeFromStorage(entries[i].key);
      }
    }
  }

  /**
   * Get cached evolution data
   */
  getEvolutionData(speciesName) {
    const key = this.getEvolutionKey(speciesName);
    const cached = this.getFromStorage(key);
    
    if (cached && !this.isExpired(cached, this.CACHE_DURATION)) {
      return cached.data;
    }
    
    return null;
  }

  /**
   * Cache evolution data
   */
  setEvolutionData(speciesName, data) {
    const key = this.getEvolutionKey(speciesName);
    
    const cacheEntry = {
      data: data,
      timestamp: Date.now()
    };
    
    if (this.setToStorage(key, cacheEntry)) {
      // Cleanup if needed (check periodically)
      if (Math.random() < 0.1) { // 10% chance to trigger cleanup
        this.cleanupCacheByPrefix(this.EVOLUTION_PREFIX, this.CACHE_DURATION, this.MAX_CACHE_SIZE);
      }
    }
  }

  /**
   * Get cached reverse evolution data
   */
  getReverseEvolutionData(speciesName) {
    const key = this.getReverseEvolutionKey(speciesName);
    const cached = this.getFromStorage(key);
    
    if (cached && !this.isExpired(cached, this.CACHE_DURATION)) {
      return cached.data;
    }
    
    return null;
  }

  /**
   * Cache reverse evolution data
   */
  setReverseEvolutionData(speciesName, data) {
    const key = this.getReverseEvolutionKey(speciesName);
    
    const cacheEntry = {
      data: data,
      timestamp: Date.now()
    };
    
    if (this.setToStorage(key, cacheEntry)) {
      // Cleanup if needed (check periodically)
      if (Math.random() < 0.1) { // 10% chance to trigger cleanup
        this.cleanupCacheByPrefix(this.REVERSE_PREFIX, this.CACHE_DURATION, this.MAX_CACHE_SIZE);
      }
    }
  }

  /**
   * Get cached species image
   */
  getImageData(speciesName) {
    const key = this.getImageKey(speciesName);
    const cached = this.getFromStorage(key);
    
    if (cached && !this.isExpired(cached, this.IMAGE_CACHE_DURATION)) {
      return cached.data;
    }
    
    return null;
  }

  /**
   * Cache species image data
   */
  setImageData(speciesName, imageUrl) {
    const key = this.getImageKey(speciesName);
    
    const cacheEntry = {
      data: imageUrl,
      timestamp: Date.now()
    };
    
    if (this.setToStorage(key, cacheEntry)) {
      // Cleanup if needed (check periodically)
      if (Math.random() < 0.05) { // 5% chance to trigger cleanup
        this.cleanupCacheByPrefix(this.IMAGE_PREFIX, this.IMAGE_CACHE_DURATION, this.MAX_IMAGE_CACHE_SIZE);
      }
    }
  }

  /**
   * Get cached search results
   */
  getSearchResults(searchTerm) {
    const key = this.getSearchKey(searchTerm);
    const cached = this.getFromStorage(key);
    
    if (cached && !this.isExpired(cached, this.SEARCH_CACHE_DURATION)) {
      return cached.data;
    }
    
    return null;
  }

  /**
   * Cache search results
   */
  setSearchResults(searchTerm, results) {
    const key = this.getSearchKey(searchTerm);
    
    const cacheEntry = {
      data: results,
      timestamp: Date.now()
    };
    
    if (this.setToStorage(key, cacheEntry)) {
      // Cleanup if needed (check periodically)
      if (Math.random() < 0.2) { // 20% chance to trigger cleanup
        this.cleanupCacheByPrefix(this.SEARCH_PREFIX, this.SEARCH_CACHE_DURATION, this.MAX_SEARCH_CACHE_SIZE);
      }
    }
  }

  /**
   * Clear all caches
   */
  clearAll() {
    this.clearEvolutionCache();
    this.clearReverseEvolutionCache();
    this.clearImageCache();
    this.clearSearchCache();
    this.removeFromStorage(this.STATS_KEY);
    console.log('Evolution cache cleared - all data will be fetched fresh');
  }

  /**
   * Clear specific cache types
   */
  clearEvolutionCache() {
    const keys = this.getKeysWithPrefix(this.EVOLUTION_PREFIX);
    keys.forEach(key => this.removeFromStorage(key));
    console.log(`Evolution cache cleared (${keys.length} entries removed)`);
  }

  clearReverseEvolutionCache() {
    const keys = this.getKeysWithPrefix(this.REVERSE_PREFIX);
    keys.forEach(key => this.removeFromStorage(key));
    console.log(`Reverse evolution cache cleared (${keys.length} entries removed)`);
  }

  clearImageCache() {
    const keys = this.getKeysWithPrefix(this.IMAGE_PREFIX);
    keys.forEach(key => this.removeFromStorage(key));
    console.log(`Image cache cleared (${keys.length} entries removed)`);
  }

  clearSearchCache() {
    const keys = this.getKeysWithPrefix(this.SEARCH_PREFIX);
    keys.forEach(key => this.removeFromStorage(key));
    console.log(`Search cache cleared (${keys.length} entries removed)`);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const evolutionKeys = this.getKeysWithPrefix(this.EVOLUTION_PREFIX);
    const reverseKeys = this.getKeysWithPrefix(this.REVERSE_PREFIX);
    const imageKeys = this.getKeysWithPrefix(this.IMAGE_PREFIX);
    const searchKeys = this.getKeysWithPrefix(this.SEARCH_PREFIX);
    
    const stats = {
      evolutionCache: evolutionKeys.length,
      reverseEvolutionCache: reverseKeys.length,
      imageCache: imageKeys.length,
      searchCache: searchKeys.length,
      totalEntries: evolutionKeys.length + reverseKeys.length + imageKeys.length + searchKeys.length,
      storageType: 'localStorage',
      lastUpdated: Date.now()
    };
    
    this.updateStats(stats);
    return stats;
  }

  /**
   * Update cached stats
   */
  updateStats(stats = null) {
    if (!stats) {
      stats = this.getStats();
    }
    this.setToStorage(this.STATS_KEY, stats);
  }

  /**
   * Batch cache multiple species data
   */
  batchSetEvolutionData(speciesDataArray) {
    let successCount = 0;
    let failCount = 0;
    
    speciesDataArray.forEach(({ species, evolutionData, reverseData, imageUrl }) => {
      try {
        if (evolutionData !== undefined) {
          this.setEvolutionData(species, evolutionData);
          successCount++;
        }
        if (reverseData !== undefined) {
          this.setReverseEvolutionData(species, reverseData);
          successCount++;
        }
        if (imageUrl !== undefined) {
          this.setImageData(species, imageUrl);
          successCount++;
        }
      } catch (error) {
        console.warn(`Failed to cache data for species ${species}:`, error);
        failCount++;
      }
    });
    
    if (failCount > 0) {
      console.warn(`Batch cache completed with ${successCount} successes and ${failCount} failures`);
    }
    
    // Update stats after batch operation
    this.updateStats();
  }

  /**
   * Get estimated localStorage usage for evolution cache
   */
  getStorageUsage() {
    if (!this.isLocalStorageAvailable()) return null;
    
    let totalSize = 0;
    const prefixes = [
      this.EVOLUTION_PREFIX,
      this.REVERSE_PREFIX,
      this.IMAGE_PREFIX,
      this.SEARCH_PREFIX
    ];
    
    try {
      prefixes.forEach(prefix => {
        const keys = this.getKeysWithPrefix(prefix);
        keys.forEach(key => {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += key.length + value.length;
          }
        });
      });
      
      return {
        bytes: totalSize,
        kilobytes: Math.round(totalSize / 1024 * 100) / 100,
        megabytes: Math.round(totalSize / (1024 * 1024) * 100) / 100
      };
    } catch (error) {
      console.warn('Error calculating storage usage:', error);
      return null;
    }
  }

  /**
   * Check if cache is healthy (not corrupted)
   */
  isHealthy() {
    try {
      // Try to read and validate a few cache entries
      const evolutionKeys = this.getKeysWithPrefix(this.EVOLUTION_PREFIX).slice(0, 5);
      for (const key of evolutionKeys) {
        const cached = this.getFromStorage(key);
        if (cached && (!cached.data || !cached.timestamp)) {
          return false;
        }
      }
      return true;
    } catch (error) {
      console.warn('Cache health check failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const evolutionCacheService = new EvolutionCacheService();

export default evolutionCacheService;