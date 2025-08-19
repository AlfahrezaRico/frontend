import { useState } from 'react';
import { LocalCache } from '@/lib/cache';

// Cache key untuk localStorage
const NIK_VALIDATION_CACHE_KEY = 'nik_validation_cache';

interface ValidationResult {
  isValid: boolean;
  expectedFormat: string;
}

export const useNIKValidation = () => {
  const [validating, setValidating] = useState(false);

  // Fungsi untuk menyimpan validasi ke cache
  const setCachedValidation = (nikInput: string, departmentName: string, isValid: boolean, expectedFormat: string) => {
    const cacheKey = `${NIK_VALIDATION_CACHE_KEY}_${departmentName}_${nikInput}`;
    const validationResult: ValidationResult = { isValid, expectedFormat };
    LocalCache.set(cacheKey, validationResult);
  };

  // Fungsi untuk mendapatkan validasi dari cache
  const getValidationFromCache = (nikInput: string, departmentName: string): ValidationResult | null => {
    const cacheKey = `${NIK_VALIDATION_CACHE_KEY}_${departmentName}_${nikInput}`;
    const cached = LocalCache.get<ValidationResult>(cacheKey);
    if (cached) {
      return cached;
    }
    return null;
  };

  // Fungsi untuk validasi NIK dengan strategi API First
  const validateNIK = async (nikInput: string, departmentName: string): Promise<{ isValid: boolean; expectedFormat: string }> => {
    setValidating(true);

    try {
      // 1. Coba API terlebih dahulu
      const API_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_URL}/api/department-nik-configs/validate-format`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          nik_input: nikInput, 
          department_name: departmentName 
        }),
      });

      if (response.ok) {
        const validationResult = await response.json();
        
        // Simpan hasil API ke cache
        setCachedValidation(nikInput, departmentName, validationResult.is_valid, validationResult.expected_format);
        
        setValidating(false);
        return {
          isValid: validationResult.is_valid,
          expectedFormat: validationResult.expected_format
        };
      } else {
        // 2. Jika API gagal, coba cache
        const cachedValidation = getValidationFromCache(nikInput, departmentName);
        if (cachedValidation) {
          setValidating(false);
          return cachedValidation;
        }
        
        // 3. Jika cache juga tidak ada, gunakan fallback
        throw new Error('API dan cache tidak tersedia');
      }
    } catch (error) {
      console.error('Error validating NIK format:', error);
      
      // 4. Fallback ke validasi hardcode jika API dan cache gagal
      const cachedValidation = getValidationFromCache(nikInput, departmentName);
      if (cachedValidation) {
        setValidating(false);
        return cachedValidation;
      }
      
      // Fallback ke validasi hardcode
      let isValid = false;
      let expectedFormat = '';
      
      if (departmentName === 'IT') {
        isValid = /^IT[0-9]{3}$/.test(nikInput);
        expectedFormat = 'IT001';
      } else if (departmentName === 'HR') {
        isValid = /^HR[0-9]{3}$/.test(nikInput);
        expectedFormat = 'HR001';
      } else if (departmentName === 'Finance') {
        isValid = /^FN[0-9]{3}$/.test(nikInput);
        expectedFormat = 'FN001';
      } else if (departmentName === 'Marketing') {
        isValid = /^MK[0-9]{3}$/.test(nikInput);
        expectedFormat = 'MK001';
      } else if (departmentName === 'Operational') {
        // Untuk Operational, format bisa OPS + 3 angka atau OPS19 + 3 angka
        isValid = /^OPS[0-9]{3}$/.test(nikInput) || /^OPS19[0-9]{3}$/.test(nikInput);
        expectedFormat = 'OPS001 atau OPS19001';
      } else if (departmentName === 'Bisnis') {
        isValid = /^BIS[0-9]{3}$/.test(nikInput);
        expectedFormat = 'BIS001';
      } else {
        isValid = /^[A-Z]{2,3}[0-9]{3}$/.test(nikInput);
        expectedFormat = 'EMP001';
      }
      
      setValidating(false);
      return { isValid, expectedFormat };
    }
  };

  // Fungsi untuk membersihkan cache validasi yang salah
  const clearValidationCache = (departmentName?: string) => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes(NIK_VALIDATION_CACHE_KEY)) {
          if (departmentName) {
            // Hapus cache untuk departemen tertentu
            if (key.includes(departmentName)) {
              localStorage.removeItem(key);
            }
          } else {
            // Hapus semua cache validasi
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.error('Error clearing validation cache:', error);
    }
  };

  return { validateNIK, validating, clearValidationCache };
}; 