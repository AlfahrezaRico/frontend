import { useState, useEffect } from 'react';
import { LocalCache } from '@/lib/cache';

// Cache key untuk localStorage
const NIK_FORMAT_CACHE_KEY = 'nik_format_cache';

export const useNIKFormat = (departmentName: string) => {
  const [format, setFormat] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Fungsi untuk mendapatkan format dari cache
  const getFormatFromCache = (departmentName: string): string | null => {
    const cacheKey = `${NIK_FORMAT_CACHE_KEY}_${departmentName}`;
    const cached = LocalCache.get<string>(cacheKey);
    if (cached) {
      console.log(`Using cached NIK format for ${departmentName}:`, cached);
      return cached;
    }
    return null;
  };

  // Fungsi untuk menyimpan format ke cache
  const setCachedFormat = (departmentName: string, format: string) => {
    const cacheKey = `${NIK_FORMAT_CACHE_KEY}_${departmentName}`;
    LocalCache.set(cacheKey, format);
  };

  useEffect(() => {
    if (!departmentName) {
      setFormat('');
      return;
    }

    const fetchFormat = async () => {
      setLoading(true);

      try {
        // 1. Coba API terlebih dahulu
        const API_URL = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${API_URL}/api/department-nik-configs/check/${encodeURIComponent(departmentName)}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.nik_config) {
            const config = data.nik_config;
            let newFormat = '';
            
            if (config.format_pattern === 'PREFIX + SEQUENCE') {
              const exampleFormat = config.prefix + '001';
              newFormat = `${config.prefix} + ${config.sequence_length} angka (contoh: ${exampleFormat})`;
            } else {
              const exampleFormat = config.prefix + '001';
              newFormat = `${config.prefix} + ${config.sequence_length} angka (contoh: ${exampleFormat})`;
            }
            
            // Simpan hasil API ke cache
            setCachedFormat(departmentName, newFormat);
            setFormat(newFormat);
            console.log(`Fetched and cached NIK format for ${departmentName}:`, newFormat);
          } else {
            // Fallback jika tidak ada config
            const fallbackFormats: { [key: string]: string } = {
              'IT': 'IT + 3 angka (contoh: IT001)',
              'HR': 'HR + 3 angka (contoh: HR001)',
              'Finance': 'FN + 3 angka (contoh: FN001)',
              'Marketing': 'MK + 3 angka (contoh: MK001)',
              'Operational': 'OPS + 3 angka (contoh: OPS001)',
              'Bisnis': 'BIS + 3 angka (contoh: BIS001)',
            };
            const fallbackFormat = fallbackFormats[departmentName] || '2-3 huruf + 3 angka (contoh: EMP001)';
            setCachedFormat(departmentName, fallbackFormat);
            setFormat(fallbackFormat);
          }
        } else {
          // 2. Jika API gagal, coba cache
          console.log('API failed, trying cache...');
          const cachedFormat = getFormatFromCache(departmentName);
          if (cachedFormat) {
            setFormat(cachedFormat);
          } else {
            // 3. Jika cache juga tidak ada, gunakan fallback
            const fallbackFormats: { [key: string]: string } = {
              'IT': 'IT + 3 angka (contoh: IT001)',
              'HR': 'HR + 3 angka (contoh: HR001)',
              'Finance': 'FN + 3 angka (contoh: FN001)',
              'Marketing': 'MK + 3 angka (contoh: MK001)',
              'Operational': 'OPS + 3 angka (contoh: OPS001)',
              'Bisnis': 'BIS + 3 angka (contoh: BIS001)',
            };
            const fallbackFormat = fallbackFormats[departmentName] || '2-3 huruf + 3 angka (contoh: EMP001)';
            setFormat(fallbackFormat);
          }
        }
      } catch (err) {
        console.error('Error fetching NIK format:', err);
        // 4. Fallback ke cache atau hardcode jika API gagal
        const cachedFormat = getFormatFromCache(departmentName);
        if (cachedFormat) {
          setFormat(cachedFormat);
        } else {
          const fallbackFormats: { [key: string]: string } = {
            'IT': 'IT + 3 angka (contoh: IT001)',
            'HR': 'HR + 3 angka (contoh: HR001)',
            'Finance': 'FN + 3 angka (contoh: FN001)',
            'Marketing': 'MK + 3 angka (contoh: MK001)',
            'Operational': 'OPS + 3 angka (contoh: OPS001)',
            'Bisnis': 'BIS + 3 angka (contoh: BIS001)',
          };
          const fallbackFormat = fallbackFormats[departmentName] || '2-3 huruf + 3 angka (contoh: EMP001)';
          setFormat(fallbackFormat);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFormat();
  }, [departmentName]);

  return { format, loading };
}; 