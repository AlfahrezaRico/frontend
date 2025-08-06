// Utility untuk mengelola cache lokal

export interface CacheItem<T> {
  data: T;
  timestamp: number;
}

export interface CacheConfig {
  expiryHours?: number;
  key: string;
}

export class LocalCache {
  private static readonly DEFAULT_EXPIRY_HOURS = 24;

  /**
   * Menyimpan data ke localStorage dengan timestamp
   */
  static set<T>(key: string, data: T, expiryHours: number = this.DEFAULT_EXPIRY_HOURS): void {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(cacheItem));
      console.log(`Cache saved for key: ${key}`);
    } catch (error) {
      console.error(`Error saving cache for key ${key}:`, error);
    }
  }

  /**
   * Mengambil data dari localStorage dengan validasi expiry
   */
  static get<T>(key: string, expiryHours: number = this.DEFAULT_EXPIRY_HOURS): T | null {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      const now = Date.now();
      const expiryMs = expiryHours * 60 * 60 * 1000;

      if (now - cacheItem.timestamp > expiryMs) {
        // Cache expired, hapus dari localStorage
        localStorage.removeItem(key);
        console.log(`Cache expired for key: ${key}`);
        return null;
      }

      console.log(`Cache hit for key: ${key}`);
      return cacheItem.data;
    } catch (error) {
      console.error(`Error reading cache for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Menghapus cache untuk key tertentu
   */
  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
      console.log(`Cache removed for key: ${key}`);
    } catch (error) {
      console.error(`Error removing cache for key ${key}:`, error);
    }
  }

  /**
   * Membersihkan semua cache yang expired
   */
  static cleanup(): void {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();
      let cleanedCount = 0;

      keys.forEach(key => {
        if (key.includes('_cache')) { // Hanya bersihkan cache yang kita buat
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const cacheItem = JSON.parse(cached);
              const expiryMs = this.DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000;
              
              if (now - cacheItem.timestamp > expiryMs) {
                localStorage.removeItem(key);
                cleanedCount++;
              }
            }
          } catch (error) {
            // Jika ada error parsing, hapus item tersebut
            localStorage.removeItem(key);
            cleanedCount++;
          }
        }
      });

      if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} expired cache items`);
      }
    } catch (error) {
      console.error('Error during cache cleanup:', error);
    }
  }

  /**
   * Mendapatkan ukuran cache dalam bytes
   */
  static getSize(): number {
    try {
      let totalSize = 0;
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.includes('_cache')) {
          const item = localStorage.getItem(key);
          if (item) {
            totalSize += new Blob([item]).size;
          }
        }
      });

      return totalSize;
    } catch (error) {
      console.error('Error calculating cache size:', error);
      return 0;
    }
  }

  /**
   * Mendapatkan statistik cache
   */
  static getStats(): { totalItems: number; totalSize: number; expiredItems: number } {
    try {
      const keys = Object.keys(localStorage);
      let totalItems = 0;
      let expiredItems = 0;
      let totalSize = 0;
      const now = Date.now();
      const expiryMs = this.DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000;

      keys.forEach(key => {
        if (key.includes('_cache')) {
          totalItems++;
          const item = localStorage.getItem(key);
          if (item) {
            totalSize += new Blob([item]).size;
            try {
              const cacheItem = JSON.parse(item);
              if (now - cacheItem.timestamp > expiryMs) {
                expiredItems++;
              }
            } catch (error) {
              expiredItems++;
            }
          }
        }
      });

      return { totalItems, totalSize, expiredItems };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { totalItems: 0, totalSize: 0, expiredItems: 0 };
    }
  }
}

// Auto cleanup saat aplikasi dimuat
if (typeof window !== 'undefined') {
  LocalCache.cleanup();
} 