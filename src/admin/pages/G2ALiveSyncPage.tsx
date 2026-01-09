import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiRefreshCw, 
  FiPlay, 
  FiPause, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiInfo,
  FiActivity,
  FiDatabase,
  FiClock,
  FiTrendingUp,
  FiXCircle
} from 'react-icons/fi';
import { adminApi } from '../services/adminApi';
import { adminButtonStyle } from '../styles/adminStyles';

const theme = {
  colors: {
    primary: '#00C8C2',
    background: '#0D0D0D',
    surface: '#1A1A1A',
    surfaceLight: '#2A2A2A',
    text: '#FFFFFF',
    textSecondary: '#999999',
    border: '#333333',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
  },
};

interface SyncProgress {
  inProgress: boolean;
  currentPage: number;
  totalPages: number;
  productsProcessed: number;
  productsTotal: number;
  categoriesCreated: number;
  genresCreated: number;
  platformsCreated: number;
  errors: number;
  startedAt: string | null;
  estimatedCompletion: string | null;
}

interface SyncResult {
  synced: number;
  added: number;
  updated: number;
  removed: number;
  categoriesCreated: number;
  genresCreated: number;
  platformsCreated: number;
  errors: Array<{ productId: string; error: string }>;
}

const G2ALiveSyncPage: React.FC = () => {
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [g2aSettings, setG2aSettings] = useState<any>(null);
  const [g2aStats, setG2aStats] = useState<{
    totalProducts: number;
    inStock: number;
    outOfStock: number;
    lastSync: string | null;
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [syncOptions, setSyncOptions] = useState({
    fullSync: false,
    includeRelationships: true,
    categories: ['games'] as string[],
  });

  // Poll for sync progress
  const pollProgress = useCallback(async () => {
    try {
      const progress = await adminApi.getG2ASyncProgress();
      setSyncProgress(progress);
      
      if (!progress.inProgress && isSyncing) {
        setIsSyncing(false);
        // Fetch last sync result if available
        if (progress.productsProcessed > 0) {
          setLastSyncResult({
            synced: progress.productsProcessed,
            added: 0,
            updated: progress.productsProcessed,
            removed: 0,
            categoriesCreated: progress.categoriesCreated,
            genresCreated: progress.genresCreated,
            platformsCreated: progress.platformsCreated,
            errors: [],
          });
        }
      }
    } catch (err: any) {
      console.error('Error fetching sync progress:', err);
      if (isSyncing) {
        setIsSyncing(false);
        setError(err.message || 'Failed to fetch sync progress');
      }
    }
  }, [isSyncing]);

  // Load G2A settings and stats
  useEffect(() => {
    const loadData = async () => {
      try {
        const [settings, status] = await Promise.all([
          adminApi.getG2ASettings(),
          adminApi.getG2ASyncStatus(),
        ]);
        setG2aSettings(settings);
        setG2aStats({
          totalProducts: status.totalProducts,
          inStock: status.inStock,
          outOfStock: status.outOfStock,
          lastSync: status.lastSync,
        });
        setLoadingStats(false);
      } catch (err) {
        console.error('Error loading G2A data:', err);
        setLoadingStats(false);
      }
    };
    loadData();
  }, []);

  // Poll progress when syncing
  useEffect(() => {
    if (isSyncing) {
      const interval = setInterval(pollProgress, 2000); // Poll every 2 seconds
      return () => clearInterval(interval);
    } else {
      // Load initial progress
      pollProgress();
    }
  }, [isSyncing, pollProgress]);

  const startSync = async () => {
    try {
      setError(null);
      setIsSyncing(true);
      setLastSyncResult(null);
      
      const result = await adminApi.syncG2A({
        fullSync: syncOptions.fullSync,
        includeRelationships: syncOptions.includeRelationships,
        categories: syncOptions.categories,
      });

      setLastSyncResult(result.data);
      setIsSyncing(false);
      
      // Refresh progress
      await pollProgress();
    } catch (err: any) {
      setIsSyncing(false);
      setError(err.message || 'Failed to start sync');
      console.error('Sync error:', err);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const calculateProgress = () => {
    if (!syncProgress || !syncProgress.inProgress) return 0;
    if (syncProgress.totalPages === 0) return 0;
    return Math.round((syncProgress.currentPage / syncProgress.totalPages) * 100);
  };

  const calculateProductsProgress = () => {
    if (!syncProgress || !syncProgress.inProgress) return 0;
    if (syncProgress.productsTotal === 0) return 0;
    return Math.round((syncProgress.productsProcessed / syncProgress.productsTotal) * 100);
  };

  return (
    <div style={{ padding: '24px', color: theme.colors.text }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 'bold', 
          marginBottom: '8px',
          color: theme.colors.text 
        }}>
          G2A Live Sync
        </h1>
        <p style={{ color: theme.colors.textSecondary, fontSize: '14px' }}>
          Синхронизация продуктов G2A в реальном времени с production настройками
        </p>
      </div>

      {/* G2A Settings Info */}
      {g2aSettings && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <FiInfo style={{ color: theme.colors.primary }} />
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: theme.colors.text }}>
              Текущие настройки G2A
            </h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>
                Environment
              </div>
              <div style={{ color: theme.colors.text, fontSize: '14px', fontWeight: '500' }}>
                {g2aSettings.environment === 'production' ? 'Production' : 'Sandbox'}
              </div>
            </div>
            <div>
              <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>
                Client ID
              </div>
              <div style={{ color: theme.colors.text, fontSize: '14px', fontWeight: '500', fontFamily: 'monospace' }}>
                {g2aSettings.clientId.substring(0, 10)}...
              </div>
            </div>
            <div>
              <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>
                Email
              </div>
              <div style={{ color: theme.colors.text, fontSize: '14px', fontWeight: '500' }}>
                {g2aSettings.email}
              </div>
            </div>
            <div>
              <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>
                Status
              </div>
              <div style={{ 
                color: g2aSettings.isActive ? theme.colors.success : theme.colors.error, 
                fontSize: '14px', 
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {g2aSettings.isActive ? (
                  <>
                    <FiCheckCircle /> Active
                  </>
                ) : (
                  <>
                    <FiXCircle /> Inactive
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* G2A Statistics */}
      {g2aStats && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <FiDatabase style={{ color: theme.colors.primary }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: theme.colors.text }}>
              Статистика G2A
            </h3>
          </div>
          {loadingStats ? (
            <div style={{ color: theme.colors.textSecondary, fontSize: '14px' }}>
              Загрузка статистики...
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div style={{
                background: theme.colors.surfaceLight,
                borderRadius: '6px',
                padding: '16px',
              }}>
                <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '8px' }}>
                  Всего игр в наличии
                </div>
                <div style={{ color: theme.colors.text, fontSize: '28px', fontWeight: '700' }}>
                  {g2aStats.inStock.toLocaleString()}
                </div>
              </div>
              <div style={{
                background: theme.colors.surfaceLight,
                borderRadius: '6px',
                padding: '16px',
              }}>
                <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '8px' }}>
                  Всего игр (включая отсутствующие)
                </div>
                <div style={{ color: theme.colors.text, fontSize: '28px', fontWeight: '700' }}>
                  {g2aStats.totalProducts.toLocaleString()}
                </div>
              </div>
              <div style={{
                background: theme.colors.surfaceLight,
                borderRadius: '6px',
                padding: '16px',
              }}>
                <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '8px' }}>
                  Отсутствуют в наличии
                </div>
                <div style={{ color: theme.colors.warning, fontSize: '28px', fontWeight: '700' }}>
                  {g2aStats.outOfStock.toLocaleString()}
                </div>
              </div>
              {g2aStats.lastSync && (
                <div style={{
                  background: theme.colors.surfaceLight,
                  borderRadius: '6px',
                  padding: '16px',
                }}>
                  <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '8px' }}>
                    Последняя синхронизация
                  </div>
                  <div style={{ color: theme.colors.text, fontSize: '14px', fontWeight: '500' }}>
                    {new Date(g2aStats.lastSync).toLocaleString('ru-RU')}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Sync Options */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: theme.colors.text }}>
          Параметры синхронизации
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={syncOptions.fullSync}
              onChange={(e) => setSyncOptions({ ...syncOptions, fullSync: e.target.checked })}
              disabled={isSyncing}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <div>
              <div style={{ color: theme.colors.text, fontSize: '14px', fontWeight: '500' }}>
                Полная синхронизация
              </div>
              <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginTop: '4px' }}>
                Синхронизировать все продукты и пометить удаленные как недоступные
              </div>
            </div>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={syncOptions.includeRelationships}
              onChange={(e) => setSyncOptions({ ...syncOptions, includeRelationships: e.target.checked })}
              disabled={isSyncing}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <div>
              <div style={{ color: theme.colors.text, fontSize: '14px', fontWeight: '500' }}>
                Включить связи
              </div>
              <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginTop: '4px' }}>
                Создавать и связывать категории, жанры и платформы
              </div>
            </div>
          </label>
        </div>
      </motion.div>

      {/* Sync Control */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: theme.colors.text }}>
            Управление синхронизацией
          </h3>
          <button
            onClick={startSync}
            disabled={isSyncing || (g2aSettings && !g2aSettings.isActive)}
            style={{
              ...adminButtonStyle,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: (isSyncing || (g2aSettings && !g2aSettings.isActive)) ? 0.5 : 1,
              cursor: (isSyncing || (g2aSettings && !g2aSettings.isActive)) ? 'not-allowed' : 'pointer',
            }}
          >
            {isSyncing ? (
              <>
                <FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} />
                Синхронизация...
              </>
            ) : (
              <>
                <FiPlay />
                Начать синхронизацию
              </>
            )}
          </button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: `${theme.colors.error}20`,
              border: `1px solid ${theme.colors.error}`,
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: theme.colors.error,
            }}
          >
            <FiAlertCircle />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Progress */}
        {syncProgress && syncProgress.inProgress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              background: theme.colors.surfaceLight,
              borderRadius: '6px',
              padding: '16px',
              marginTop: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.colors.text }}>
                <FiActivity />
                <span style={{ fontWeight: '500' }}>Прогресс синхронизации</span>
              </div>
              <div style={{ color: theme.colors.textSecondary, fontSize: '14px' }}>
                {calculateProgress()}%
              </div>
            </div>
            
            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: '8px',
              background: theme.colors.border,
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '16px',
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${calculateProgress()}%` }}
                transition={{ duration: 0.3 }}
                style={{
                  height: '100%',
                  background: theme.colors.primary,
                }}
              />
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>
                  Страницы
                </div>
                <div style={{ color: theme.colors.text, fontSize: '18px', fontWeight: '600' }}>
                  {syncProgress.currentPage} / {syncProgress.totalPages}
                </div>
              </div>
              <div>
                <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>
                  Продукты
                </div>
                <div style={{ color: theme.colors.text, fontSize: '18px', fontWeight: '600' }}>
                  {syncProgress.productsProcessed.toLocaleString()} / {syncProgress.productsTotal.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>
                  Ошибки
                </div>
                <div style={{ color: syncProgress.errors > 0 ? theme.colors.error : theme.colors.text, fontSize: '18px', fontWeight: '600' }}>
                  {syncProgress.errors}
                </div>
              </div>
              {syncProgress.startedAt && (
                <div>
                  <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>
                    Время начала
                  </div>
                  <div style={{ color: theme.colors.text, fontSize: '14px', fontWeight: '500' }}>
                    {new Date(syncProgress.startedAt).toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Last Sync Result */}
        {lastSyncResult && !isSyncing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: theme.colors.surfaceLight,
              borderRadius: '6px',
              padding: '16px',
              marginTop: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: theme.colors.success }}>
              <FiCheckCircle />
              <span style={{ fontWeight: '600' }}>Синхронизация завершена</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>
                  Всего синхронизировано
                </div>
                <div style={{ color: theme.colors.text, fontSize: '20px', fontWeight: '600' }}>
                  {lastSyncResult.synced.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>
                  Добавлено
                </div>
                <div style={{ color: theme.colors.success, fontSize: '20px', fontWeight: '600' }}>
                  {lastSyncResult.added.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>
                  Обновлено
                </div>
                <div style={{ color: theme.colors.primary, fontSize: '20px', fontWeight: '600' }}>
                  {lastSyncResult.updated.toLocaleString()}
                </div>
              </div>
              {lastSyncResult.removed > 0 && (
                <div>
                  <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>
                    Удалено
                  </div>
                  <div style={{ color: theme.colors.error, fontSize: '20px', fontWeight: '600' }}>
                    {lastSyncResult.removed.toLocaleString()}
                  </div>
                </div>
              )}
              {lastSyncResult.categoriesCreated > 0 && (
                <div>
                  <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>
                    Категории
                  </div>
                  <div style={{ color: theme.colors.text, fontSize: '18px', fontWeight: '600' }}>
                    {lastSyncResult.categoriesCreated}
                  </div>
                </div>
              )}
              {lastSyncResult.genresCreated > 0 && (
                <div>
                  <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>
                    Жанры
                  </div>
                  <div style={{ color: theme.colors.text, fontSize: '18px', fontWeight: '600' }}>
                    {lastSyncResult.genresCreated}
                  </div>
                </div>
              )}
              {lastSyncResult.platformsCreated > 0 && (
                <div>
                  <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>
                    Платформы
                  </div>
                  <div style={{ color: theme.colors.text, fontSize: '18px', fontWeight: '600' }}>
                    {lastSyncResult.platformsCreated}
                  </div>
                </div>
              )}
            </div>

            {lastSyncResult.errors.length > 0 && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${theme.colors.border}` }}>
                <div style={{ color: theme.colors.error, fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  Ошибки ({lastSyncResult.errors.length})
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {lastSyncResult.errors.slice(0, 10).map((err, idx) => (
                    <div key={idx} style={{ 
                      padding: '8px', 
                      background: `${theme.colors.error}20`, 
                      borderRadius: '4px', 
                      marginBottom: '4px',
                      fontSize: '12px',
                      color: theme.colors.textSecondary
                    }}>
                      <strong>{err.productId}:</strong> {err.error}
                    </div>
                  ))}
                  {lastSyncResult.errors.length > 10 && (
                    <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginTop: '8px' }}>
                      ... и еще {lastSyncResult.errors.length - 10} ошибок
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default G2ALiveSyncPage;
