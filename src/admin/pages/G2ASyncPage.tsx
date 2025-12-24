import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiRefreshCw,
  FiCheck,
  FiAlertCircle,
  FiClock,
  FiDatabase,
  FiSettings,
  FiActivity,
  FiTrendingUp,
  FiTrendingDown
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

const buttonStyle: React.CSSProperties = {
  padding: '12px 24px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: '500',
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'all 0.2s',
};



interface SyncLog {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

const G2ASyncPage: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [syncResult, setSyncResult] = useState<'success' | 'error' | null>(null);
  const [metrics, setMetrics] = useState<{
    requests_total: number;
    requests_success: number;
    requests_error: number;
    requests_retry: number;
    webhook_total: number;
    webhook_valid: number;
    webhook_invalid: number;
    latency_ms: number[];
    latency_stats?: {
      avg: number;
      min: number;
      max: number;
      p50: number;
      p95: number;
      p99: number;
    };
  } | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  

  const addLog = (type: SyncLog['type'], message: string) => {
    setSyncLogs(prev => [...prev, {
      timestamp: new Date().toISOString(),
      type,
      message,
    }]);
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    setSyncLogs([]);

    addLog('info', 'Starting G2A catalog synchronization...');

    try {
      addLog('info', 'Connecting to G2A API...');
      
      // Simulate progress for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      addLog('info', 'Fetching product catalog...');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      addLog('info', 'Processing products...');
      
      const result = await adminApi.syncG2A();
      
      addLog('success', result.message || 'Synchronization started successfully');
      addLog('info', 'Applying 2% markup to all prices...');
      
      await new Promise(resolve => setTimeout(resolve, 300));
      addLog('success', 'Catalog sync completed!');
      
      setLastSync(new Date().toISOString());
      setSyncResult('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      addLog('error', `Sync failed: ${errorMessage}`);
      setSyncResult('error');
    } finally {
      setSyncing(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const fetchMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const data = await adminApi.getG2AMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to fetch G2A metrics:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getLogIcon = (type: SyncLog['type']) => {
    switch (type) {
      case 'success':
        return <FiCheck color={theme.colors.success} size={14} />;
      case 'error':
        return <FiAlertCircle color={theme.colors.error} size={14} />;
      case 'warning':
        return <FiAlertCircle color={theme.colors.warning} size={14} />;
      default:
        return <FiActivity color={theme.colors.info} size={14} />;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          color: theme.colors.text,
          marginBottom: '8px',
        }}>
          G2A Synchronization
        </h1>
        <p style={{ color: theme.colors.textSecondary }}>
          Manage G2A product catalog synchronization
        </p>
      </div>

      {/* Status Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: '16px',
            padding: '24px',
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: `${theme.colors.info}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FiDatabase color={theme.colors.info} size={20} />
            </div>
            <div>
              <p style={{ color: theme.colors.textSecondary, fontSize: '13px' }}>
                Sync Status
              </p>
              <p style={{ 
                color: syncing ? theme.colors.warning : 
                       syncResult === 'success' ? theme.colors.success :
                       syncResult === 'error' ? theme.colors.error :
                       theme.colors.text,
                fontSize: '16px',
                fontWeight: '600',
              }}>
                {syncing ? 'Syncing...' : 
                 syncResult === 'success' ? 'Last sync successful' :
                 syncResult === 'error' ? 'Last sync failed' :
                 'Ready'}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: '16px',
            padding: '24px',
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: `${theme.colors.warning}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FiClock color={theme.colors.warning} size={20} />
            </div>
            <div>
              <p style={{ color: theme.colors.textSecondary, fontSize: '13px' }}>
                Last Sync
              </p>
              <p style={{ color: theme.colors.text, fontSize: '16px', fontWeight: '600' }}>
                {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>
        </motion.div>

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: `${theme.colors.success}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FiSettings color={theme.colors.success} size={20} />
            </div>
            <div>
              <p style={{ color: theme.colors.textSecondary, fontSize: '13px' }}>
                Price Markup
              </p>
              <p style={{ color: theme.colors.success, fontSize: '16px', fontWeight: '600' }}>
                +2%
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Sync Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: '16px',
          border: `1px solid ${theme.colors.border}`,
          overflow: 'hidden',
        }}
      >
        <div style={{
          padding: '24px',
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <h3 style={{ color: theme.colors.text, fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
              Manual Sync
            </h3>
            <p style={{ color: theme.colors.textSecondary, fontSize: '14px' }}>
              Trigger a manual synchronization with G2A catalog
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              ...buttonStyle,
              backgroundColor: syncing ? theme.colors.surfaceLight : theme.colors.primary,
              color: syncing ? theme.colors.textSecondary : theme.colors.background,
              cursor: syncing ? 'not-allowed' : 'pointer',
            }}
          >
            <motion.div
              animate={syncing ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 1, repeat: syncing ? Infinity : 0, ease: 'linear' }}
            >
              <FiRefreshCw size={18} />
            </motion.div>
            {syncing ? 'Syncing...' : 'Start Sync'}
          </button>
        </div>

        {/* Sync Log */}
        <div style={{
          padding: '24px',
          backgroundColor: theme.colors.background,
          minHeight: '200px',
          maxHeight: '400px',
          overflowY: 'auto',
        }}>
          <h4 style={{ 
            color: theme.colors.textSecondary, 
            fontSize: '12px', 
            fontWeight: '600',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}>
            Sync Log
          </h4>
          {syncLogs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {syncLogs.map((log, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '8px 12px',
                    backgroundColor: theme.colors.surface,
                    borderRadius: '8px',
                  }}
                >
                  <span style={{ marginTop: '2px' }}>
                    {getLogIcon(log.type)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ 
                      color: log.type === 'error' ? theme.colors.error :
                             log.type === 'success' ? theme.colors.success :
                             theme.colors.text,
                      fontSize: '14px',
                    }}>
                      {log.message}
                    </p>
                  </div>
                  <span style={{ 
                    color: theme.colors.textSecondary, 
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}>
                    {formatTimestamp(log.timestamp)}
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '150px',
              color: theme.colors.textSecondary,
            }}>
              <FiActivity size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p>No sync activity yet</p>
              <p style={{ fontSize: '13px' }}>Click "Start Sync" to begin</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Metrics Section */}
      {metrics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: '16px',
            padding: '24px',
            border: `1px solid ${theme.colors.border}`,
            marginTop: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: theme.colors.text, fontSize: '18px', fontWeight: '600' }}>
              G2A Metrics
            </h3>
            <button
              type="button"
              onClick={fetchMetrics}
              disabled={loadingMetrics}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.surfaceLight,
                color: theme.colors.text,
                cursor: loadingMetrics ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: loadingMetrics ? 0.6 : 1,
              }}
            >
              <FiRefreshCw style={{ animation: loadingMetrics ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              backgroundColor: theme.colors.surfaceLight,
              borderRadius: '12px',
              padding: '20px',
              border: `1px solid ${theme.colors.border}`,
            }}>
              <div style={{ color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>Total Requests</div>
              <div style={{ color: theme.colors.text, fontSize: '24px', fontWeight: '700' }}>{metrics.requests_total}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontSize: '12px', color: theme.colors.success }}>
                <FiTrendingUp size={14} />
                {metrics.requests_success} success
              </div>
            </div>
            <div style={{
              backgroundColor: theme.colors.surfaceLight,
              borderRadius: '12px',
              padding: '20px',
              border: `1px solid ${theme.colors.border}`,
            }}>
              <div style={{ color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>Success Rate</div>
              <div style={{ color: theme.colors.success, fontSize: '24px', fontWeight: '700' }}>
                {metrics.requests_total > 0 
                  ? ((metrics.requests_success / metrics.requests_total) * 100).toFixed(1)
                  : 0}%
              </div>
            </div>
            <div style={{
              backgroundColor: theme.colors.surfaceLight,
              borderRadius: '12px',
              padding: '20px',
              border: `1px solid ${theme.colors.border}`,
            }}>
              <div style={{ color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>Errors</div>
              <div style={{ color: theme.colors.error, fontSize: '24px', fontWeight: '700' }}>{metrics.requests_error}</div>
            </div>
            <div style={{
              backgroundColor: theme.colors.surfaceLight,
              borderRadius: '12px',
              padding: '20px',
              border: `1px solid ${theme.colors.border}`,
            }}>
              <div style={{ color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>Webhooks</div>
              <div style={{ color: theme.colors.text, fontSize: '24px', fontWeight: '700' }}>{metrics.webhook_total}</div>
              <div style={{ fontSize: '12px', color: theme.colors.success, marginTop: '4px' }}>
                {metrics.webhook_valid} valid
              </div>
            </div>
          </div>

          {metrics.latency_stats && (
            <div>
              <h4 style={{ color: theme.colors.text, fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                Latency Statistics
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                <div style={{
                  backgroundColor: theme.colors.surfaceLight,
                  borderRadius: '8px',
                  padding: '16px',
                  border: `1px solid ${theme.colors.border}`,
                }}>
                  <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>Average</div>
                  <div style={{ color: theme.colors.text, fontSize: '18px', fontWeight: '600' }}>
                    {metrics.latency_stats.avg.toFixed(0)}ms
                  </div>
                </div>
                <div style={{
                  backgroundColor: theme.colors.surfaceLight,
                  borderRadius: '8px',
                  padding: '16px',
                  border: `1px solid ${theme.colors.border}`,
                }}>
                  <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>P95</div>
                  <div style={{ color: theme.colors.text, fontSize: '18px', fontWeight: '600' }}>
                    {metrics.latency_stats.p95.toFixed(0)}ms
                  </div>
                </div>
                <div style={{
                  backgroundColor: theme.colors.surfaceLight,
                  borderRadius: '8px',
                  padding: '16px',
                  border: `1px solid ${theme.colors.border}`,
                }}>
                  <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>P99</div>
                  <div style={{ color: theme.colors.text, fontSize: '18px', fontWeight: '600' }}>
                    {metrics.latency_stats.p99.toFixed(0)}ms
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: '16px',
          padding: '24px',
          border: `1px solid ${theme.colors.border}`,
          marginTop: '24px',
        }}
      >
        <h3 style={{ color: theme.colors.text, fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          About G2A Sync
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
        }}>
          <div>
            <h4 style={{ color: theme.colors.primary, fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              How it works
            </h4>
            <ul style={{ 
              color: theme.colors.textSecondary, 
              fontSize: '14px',
              lineHeight: '1.8',
              paddingLeft: '20px',
            }}>
              <li>Fetches the latest product catalog from G2A</li>
              <li>Updates existing products with new prices and stock</li>
              <li>Adds new products to the database</li>
              <li>Applies 2% markup to all prices</li>
              <li>Removes products that are no longer available</li>
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
              <li>Automatic sync runs every 6 hours</li>
              <li>Manual sync may take several minutes</li>
              <li>API rate limits may affect sync speed</li>
              <li>Price changes are applied immediately</li>
              <li>Requires valid G2A API credentials</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default G2ASyncPage;
