import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Trash2, Database } from 'lucide-react';
import { LocalCache } from '@/lib/cache';

export const CacheStats = () => {
  const [stats, setStats] = useState<{ totalItems: number; totalSize: number; expiredItems: number }>({
    totalItems: 0,
    totalSize: 0,
    expiredItems: 0
  });
  const [loading, setLoading] = useState(false);

  const updateStats = () => {
    const newStats = LocalCache.getStats();
    setStats(newStats);
  };

  const clearCache = () => {
    setLoading(true);
    try {
      // Hapus semua cache yang kita buat
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('_cache')) {
          localStorage.removeItem(key);
        }
      });
      updateStats();
    } catch (error) {
      console.error('Error clearing cache:', error);
    } finally {
      setLoading(false);
    }
  };

  const cleanupExpired = () => {
    setLoading(true);
    try {
      LocalCache.cleanup();
      updateStats();
    } catch (error) {
      console.error('Error cleaning up cache:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    updateStats();
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Cache Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalItems}</div>
            <div className="text-sm text-gray-500">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{formatBytes(stats.totalSize)}</div>
            <div className="text-sm text-gray-500">Total Size</div>
          </div>
        </div>
        
        {stats.expiredItems > 0 && (
          <div className="text-center">
            <Badge variant="destructive">
              {stats.expiredItems} Expired Items
            </Badge>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={updateStats}
            disabled={loading}
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={cleanupExpired}
            disabled={loading}
            className="flex-1"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Cleanup
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center">
          Cache expires after 24 hours
        </div>
      </CardContent>
    </Card>
  );
}; 