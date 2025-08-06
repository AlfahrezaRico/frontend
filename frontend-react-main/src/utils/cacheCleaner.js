// Utility untuk membersihkan cache yang bermasalah
// Jalankan script ini di browser console untuk membersihkan cache

export const clearProblematicCache = () => {
    try {
        const keys = Object.keys(localStorage);
        let clearedCount = 0;

        // NIK yang bermasalah
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

        console.log(`✅ Cleared ${clearedCount} problematic NIK cache items`);
        alert(`Cache NIK bermasalah berhasil dibersihkan! ${clearedCount} item dihapus.`);

        return clearedCount;
    } catch (error) {
        console.error('❌ Error clearing problematic cache:', error);
        alert('Error saat membersihkan cache NIK bermasalah');
        return 0;
    }
};

export const clearAllNIKCache = () => {
    try {
        const keys = Object.keys(localStorage);
        let clearedCount = 0;

        keys.forEach(key => {
            if (key.includes('nik_validation_cache') || key.includes('nik_format_cache')) {
                localStorage.removeItem(key);
                clearedCount++;
                console.log('Removed cache:', key);
            }
        });

        console.log(`✅ Cleared ${clearedCount} NIK cache items`);
        alert(`Cache NIK berhasil dibersihkan! ${clearedCount} item dihapus.`);

        return clearedCount;
    } catch (error) {
        console.error('❌ Error clearing NIK cache:', error);
        alert('Error saat membersihkan cache NIK');
        return 0;
    }
};

export const showCacheInfo = () => {
    try {
        const keys = Object.keys(localStorage);
        const cacheKeys = keys.filter(key => key.includes('_cache'));

        console.log('📋 Cache Info:');
        cacheKeys.forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                try {
                    const parsed = JSON.parse(item);
                    console.log(`${key}:`, parsed);
                } catch (e) {
                    console.log(`${key}:`, item);
                }
            }
        });

        return cacheKeys.length;
    } catch (error) {
        console.error('❌ Error showing cache info:', error);
        return 0;
    }
};

// Auto-clear problematic cache saat script dimuat
if (typeof window !== 'undefined') {
    console.log('🔧 Cache Cleaner loaded. Available functions:');
    console.log('- clearProblematicCache()');
    console.log('- clearAllNIKCache()');
    console.log('- showCacheInfo()');

    // Auto-clear problematic cache
    const cleared = clearProblematicCache();
    if (cleared > 0) {
        console.log('🔄 Auto-cleared problematic cache. Please refresh the page.');
    }
}