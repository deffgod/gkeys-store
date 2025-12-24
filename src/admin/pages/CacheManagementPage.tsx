import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiDatabase,
  FiRefreshCw,
  FiTrash2,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiActivity,
  FiHardDrive
} from 'react-icons/fi';
import { adminApi } from '../services/adminApi';

const theme = {
  colors: {
    primary: '#10B981',
    primaryDark: '#059669',
    background: '#0a0a0a',
    surface: '#141414',
    surfaceLight: '#1a1a1a',
    text: '#ffffff',
    textSecondary: '#a0a0a0',
    border: '#2a2a2a',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
};

const CacheManagementPage: React.FC = () => {
  const [statistics, setStatistics] = useState<{
    totalKeys: number;
    memoryUsage: number;
    redisStatus: 'connected' | 'disconnected' | 'error';
    keysByPattern: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalidating, setInvalidating] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [pattern, setPattern] = useState('');
  const [lastAction, setLastAction] = useState<{ type: 'invalidate' | 'clear'; message: string } | null>(null);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const stats = await adminApi.getCacheStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Failed to fetch cache statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
    const interval = setInterval(fetchStatistics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInvalidate = async () => {
    if (!pattern.trim()) {
      alert('Please enter a cache key pattern');
      return;
    }

    if (!confirm(`Are you sure you want to invalidate cache keys matching pattern: ${pattern}?`)) {
      return;
    }

    try {
      setInvalidating(true);
      const result = await adminApi.invalidateCache(pattern);
      setLastAction({ type: 'invalidate', message: result.message });
      setPattern('');
      await fetchStatistics();
    } catch (err) {
      console.error('Failed to invalidate cache:', err);
      alert('Failed to invalidate cache');
    } finally {
      setInvalidating(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear ALL cache? This action cannot be undone.')) {
      return;
    }

    try {
      setClearing(true);
      const result = await adminApi.clearAllCache();
      setLastAction({ type: 'clear', message: result.message });
      await fetchStatistics();
    } catch (err) {
      console.error('Failed to clear cache:', err);
      alert('Failed to clear cache');
    } finally {
      setClearing(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'connected':
        return theme.colors.success;
      case 'disconnected':
        return theme.colors.warning;
      case 'error':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <FiCheckCircle color={theme.colors.success} />;
      case 'disconnected':
        return <FiAlertCircle color={theme.colors.warning} />;
      case 'error':
        return <FiXCircle color={theme.colors.error} />;
      default:
        return <FiActivity color={theme.colors.textSecondary} />;
    }
  };

  const commonPatterns = [
    { pattern: 'home:*', label: 'Home Page Cache' },
    { pattern: 'game:*', label: 'Game Details Cache' },
    { pattern: 'catalog:*', label: 'Catalog Cache' },
    { pattern: 'user:*', label: 'User Data Cache' },
    { pattern: 'g2a:*', label: 'G2A Cache' },
    { pattern: 'session:*', label: 'Session Cache' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          margin: 0, 
          color: theme.colors.text, 
          fontSize: '32px', 
          fontWeight: '700',
          marginBottom: '8px',
        }}>
          Cache Management
        </h1>
        <p style={{ 
          margin: 0, 
          color: theme.colors.textSecondary, 
          fontSize: '16px',
        }}>
          View cache statistics and manage cache invalidation
        </p>
      </div>

      {/* Statistics Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: '16px',
          padding: '24px',
          border: `1px solid ${theme.colors.border}`,
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: theme.colors.text, fontSize: '20px', fontWeight: '600' }}>
            Cache Statistics
          </h2>
          <button
            type="button"
            onClick={fetchStatistics}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.surfaceLight,
              color: theme.colors.text,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <FiRefreshCw style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '32px',
                height: '32px',
                border: `3px solid ${theme.colors.border}`,
                borderTopColor: theme.colors.primary,
                borderRadius: '50%',
              }}
            />
          </div>
        ) : statistics ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{
                backgroundColor: theme.colors.surfaceLight,
                borderRadius: '12px',
                padding: '20px',
                border: `1px solid ${theme.colors.border}`,
              }}>
                <div style={{ color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>Total Keys</div>
                <div style={{ color: theme.colors.text, fontSize: '24px', fontWeight: '700' }}>{statistics.totalKeys}</div>
              </div>
              <div style={{
                backgroundColor: theme.colors.surfaceLight,
                borderRadius: '12px',
                padding: '20px',
                border: `1px solid ${theme.colors.border}`,
              }}>
                <div style={{ color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>Memory Usage</div>
                <div style={{ color: theme.colors.text, fontSize: '24px', fontWeight: '700' }}>
                  {formatBytes(statistics.memoryUsage)}
                </div>
              </div>
              <div style={{
                backgroundColor: theme.colors.surfaceLight,
                borderRadius: '12px',
                padding: '20px',
                border: `1px solid ${theme.colors.border}`,
              }}>
                <div style={{ color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>Redis Status</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getStatusIcon(statistics.redisStatus)}
                  <span style={{ 
                    color: getStatusColor(statistics.redisStatus), 
                    fontSize: '16px', 
                    fontWeight: '600',
                    textTransform: 'capitalize',
                  }}>
                    {statistics.redisStatus}
                  </span>
                </div>
              </div>
            </div>

            {Object.keys(statistics.keysByPattern).length > 0 && (
              <div>
                <h3 style={{ margin: '0 0 16px 0', color: theme.colors.text, fontSize: '16px', fontWeight: '600' }}>
                  Keys by Pattern
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {Object.entries(statistics.keysByPattern).map(([pattern, count]) => (
                    <div
                      key={pattern}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        backgroundColor: theme.colors.surfaceLight,
                        borderRadius: '8px',
                        border: `1px solid ${theme.colors.border}`,
                      }}
                    >
                      <div>
                        <div style={{ color: theme.colors.text, fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                          {pattern}
                        </div>
                        <div style={{ color: theme.colors.textSecondary, fontSize: '12px' }}>
                          {count} keys
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: theme.colors.textSecondary }}>
            Failed to load cache statistics
          </div>
        )}
      </motion.div>

      {/* Cache Invalidation Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: '16px',
          padding: '24px',
          border: `1px solid ${theme.colors.border}`,
          marginBottom: '24px',
        }}
      >
        <h2 style={{ margin: '0 0 20px 0', color: theme.colors.text, fontSize: '20px', fontWeight: '600' }}>
          Invalidate Cache by Pattern
        </h2>

        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="cache-pattern" style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>
            Cache Key Pattern (supports wildcards: *, ?)
          </label>
          <input
            id="cache-pattern"
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="e.g., game:*, user:*, home:*"
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: theme.colors.surfaceLight,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '8px',
              color: theme.colors.text,
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <div style={{ marginTop: '8px', fontSize: '12px', color: theme.colors.textSecondary }}>
            Examples: <code style={{ backgroundColor: theme.colors.surfaceLight, padding: '2px 6px', borderRadius: '4px' }}>game:*</code>, <code style={{ backgroundColor: theme.colors.surfaceLight, padding: '2px 6px', borderRadius: '4px' }}>user:123:*</code>, <code style={{ backgroundColor: theme.colors.surfaceLight, padding: '2px 6px', borderRadius: '4px' }}>home:*</code>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '12px', fontWeight: '500' }}>
            Common Patterns
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {commonPatterns.map((item) => (
              <button
                key={item.pattern}
                type="button"
                onClick={() => setPattern(item.pattern)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: pattern === item.pattern ? theme.colors.primary : theme.colors.surfaceLight,
                  color: pattern === item.pattern ? '#ffffff' : theme.colors.text,
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleInvalidate}
          disabled={invalidating || !pattern.trim()}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: invalidating || !pattern.trim() ? theme.colors.surfaceLight : theme.colors.warning,
            color: invalidating || !pattern.trim() ? theme.colors.textSecondary : '#ffffff',
            cursor: invalidating || !pattern.trim() ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: invalidating || !pattern.trim() ? 0.6 : 1,
          }}
        >
          <FiTrash2 />
          {invalidating ? 'Invalidating...' : 'Invalidate Cache'}
        </button>
      </motion.div>

      {/* Clear All Cache Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: '16px',
          padding: '24px',
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0', color: theme.colors.text, fontSize: '20px', fontWeight: '600' }}>
              Clear All Cache
            </h2>
            <p style={{ margin: 0, color: theme.colors.textSecondary, fontSize: '14px' }}>
              This will remove all cached data. Use with caution.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={clearing}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: `1px solid ${theme.colors.error}`,
              backgroundColor: clearing ? theme.colors.surfaceLight : 'transparent',
              color: clearing ? theme.colors.textSecondary : theme.colors.error,
              cursor: clearing ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: clearing ? 0.6 : 1,
            }}
          >
            <FiTrash2 />
            {clearing ? 'Clearing...' : 'Clear All Cache'}
          </button>
        </div>

        {lastAction && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            backgroundColor: lastAction.type === 'clear' ? `${theme.colors.error}20` : `${theme.colors.warning}20`,
            border: `1px solid ${lastAction.type === 'clear' ? theme.colors.error : theme.colors.warning}`,
            borderRadius: '8px',
            color: lastAction.type === 'clear' ? theme.colors.error : theme.colors.warning,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            {lastAction.type === 'clear' ? <FiTrash2 /> : <FiActivity />}
            {lastAction.message}
          </div>
        )}
      </motion.div>

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: '16px',
          padding: '24px',
          border: `1px solid ${theme.colors.border}`,
          marginTop: '24px',
        }}
      >
        <h3 style={{ margin: '0 0 16px 0', color: theme.colors.text, fontSize: '18px', fontWeight: '600' }}>
          About Cache Management
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
        }}>
          <div>
            <h4 style={{ color: theme.colors.primary, fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              Cache Patterns
            </h4>
            <ul style={{ 
              color: theme.colors.textSecondary, 
              fontSize: '14px',
              lineHeight: '1.8',
              paddingLeft: '20px',
            }}>
              <li><code style={{ backgroundColor: theme.colors.surfaceLight, padding: '2px 6px', borderRadius: '4px' }}>home:*</code> - Home page caches</li>
              <li><code style={{ backgroundColor: theme.colors.surfaceLight, padding: '2px 6px', borderRadius: '4px' }}>game:*</code> - Game detail caches</li>
              <li><code style={{ backgroundColor: theme.colors.surfaceLight, padding: '2px 6px', borderRadius: '4px' }}>user:*</code> - User-specific caches</li>
              <li><code style={{ backgroundColor: theme.colors.surfaceLight, padding: '2px 6px', borderRadius: '4px' }}>g2a:*</code> - G2A integration caches</li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: theme.colors.warning, fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              Important Notes
            </h4>
            <ul style={{ 
              color: theme.colors.textSecondary, 
              fontSize: '14px',
              lineHeight: '1.8',
              paddingLeft: '20px',
            }}>
              <li>Cache invalidation is non-blocking</li>
              <li>System continues to work if Redis is unavailable</li>
              <li>Clearing all cache may impact performance temporarily</li>
              <li>Pattern matching supports wildcards (*, ?)</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CacheManagementPage;

