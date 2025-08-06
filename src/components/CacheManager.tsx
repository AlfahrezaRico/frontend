import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { LocalCache } from '@/lib/cache';

export const CacheManager = () => {
  const [loading, setLoading] = useState(false);

  const clearAllCache = () => {
    setLoading(true);
    try {
      const keys = Object.keys(localStorage);
      let clearedCount = 0;
      
      keys.forEach(key => {
        if (key.includes('_cache')) {
          localStorage.removeItem(key);
          clearedCount++;
        }
      });
      
      console.log(`Cleared ${clearedCount} cache items`);
      alert(`Cache berhasil dibersihkan! ${clearedCount} item dihapus.`);
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('Error saat membersihkan cache');
    } finally {
      setLoading(false);
    }
  };

  const clearNIKValidationCache = () => {
    setLoading(true);
    try {
      const keys = Object.keys(localStorage);
      let clearedCount = 0;
      
      keys.forEach(key => {
        if (key.includes('nik_validation_cache')) {
          localStorage.removeItem(key);
          clearedCount++;
        }
      });
      
      console.log(`Cleared ${clearedCount} NIK validation cache items`);
      alert(`NIK validation cache berhasil dibersihkan! ${clearedCount} item dihapus.`);
    } catch (error) {
      console.error('Error clearing NIK validation cache:', error);
      alert('Error saat membersihkan NIK validation cache');
    } finally {
      setLoading(false);
    }
  };

  const clearNIKFormatCache = () => {
    setLoading(true);
    try {
      const keys = Object.keys(localStorage);
      let clearedCount = 0;
      
      keys.forEach(key => {
        if (key.includes('nik_format_cache')) {
          localStorage.removeItem(key);
          clearedCount++;
        }
      });
      
      console.log(`Cleared ${clearedCount} NIK format cache items`);
      alert(`NIK format cache berhasil dibersihkan! ${clearedCount} item dihapus.`);
    } catch (error) {
      console.error('Error clearing NIK format cache:', error);
      alert('Error saat membersihkan NIK format cache');
    } finally {
      setLoading(false);
    }
  };

  const clearSpecificNIKCache = () => {
    setLoading(true);
    try {
      const keys = Object.keys(localStorage);
      let clearedCount = 0;
      
      // Hapus cache untuk NIK yang bermasalah
      const problematicNIKs = ['OPS19001', 'OPS19002', 'OPS19003', 'OPS19004', 'OPS19005', 'OPS19006'];
      
      keys.forEach(key => {
        if (key.includes('nik_validation_cache')) {
          // Cek apakah key mengandung NIK yang bermasalah
          const hasProblematicNIK = problematicNIKs.some(nik => key.includes(nik));
          if (hasProblematicNIK) {
            localStorage.removeItem(key);
            clearedCount++;
            console.log('Removed problematic cache:', key);
          }
        }
      });
      
      console.log(`Cleared ${clearedCount} problematic NIK cache items`);
      alert(`Cache NIK bermasalah berhasil dibersihkan! ${clearedCount} item dihapus.`);
    } catch (error) {
      console.error('Error clearing specific NIK cache:', error);
      alert('Error saat membersihkan cache NIK spesifik');
    } finally {
      setLoading(false);
    }
  };

  const showCacheInfo = () => {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.includes('_cache'));
      
      let info = 'Cache Info:\n';
      cacheKeys.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const parsed = JSON.parse(item);
            info += `${key}: ${JSON.stringify(parsed)}\n`;
          } catch (e) {
            info += `${key}: ${item}\n`;
          }
        }
      });
      
      console.log(info);
      alert(info);
    } catch (error) {
      console.error('Error showing cache info:', error);
      alert('Error saat menampilkan info cache');
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Cache Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          Gunakan tools ini untuk membersihkan cache yang bermasalah
        </div>
        
        <div className="space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearSpecificNIKCache}
            disabled={loading}
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Problematic NIK Cache
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearNIKValidationCache}
            disabled={loading}
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear NIK Validation Cache
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearNIKFormatCache}
            disabled={loading}
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear NIK Format Cache
          </Button>
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={clearAllCache}
            disabled={loading}
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Cache
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={showCacheInfo}
            disabled={loading}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Show Cache Info
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center">
          Cache yang bermasalah dapat menyebabkan validasi NIK gagal
        </div>
      </CardContent>
    </Card>
  );
}; 