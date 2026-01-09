import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiPlay, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiInfo,
  FiClock,
  FiTerminal,
  FiRefreshCw
} from 'react-icons/fi';
import { adminApi } from '../services/adminApi';
import { adminButtonStyle } from '../styles/adminStyles';
import { toast } from 'sonner';

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

interface ScriptResult {
  success: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  duration: number;
  error?: string;
}

const G2AScriptsPage: React.FC = () => {
  // Test G2A Export API
  const [testApiParams, setTestApiParams] = useState({ page: 1, perPage: 20, debug: false });
  const [testApiResult, setTestApiResult] = useState<ScriptResult | null>(null);
  const [testApiLoading, setTestApiLoading] = useState(false);

  // Sync All G2A Games
  const [syncParams, setSyncParams] = useState({ limit: undefined as number | undefined, dryRun: false, filters: false });
  const [syncResult, setSyncResult] = useState<ScriptResult | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);

  const handleTestG2AExportAPI = async () => {
    setTestApiLoading(true);
    setTestApiResult(null);
    try {
      const result = await adminApi.executeTestG2AExportAPI(testApiParams);
      setTestApiResult(result.data);
      if (result.success) {
        toast.success('Test G2A Export API completed successfully');
      } else {
        toast.error(`Test failed with exit code ${result.data.exitCode}`);
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message || 'Failed to execute script'}`);
      setTestApiResult({
        success: false,
        exitCode: null,
        stdout: '',
        stderr: error.message || 'Unknown error',
        duration: 0,
        error: error.message,
      });
    } finally {
      setTestApiLoading(false);
    }
  };

  const handleSyncAllG2AGames = async () => {
    setSyncLoading(true);
    setSyncResult(null);
    try {
      const result = await adminApi.executeSyncAllG2AGames(syncParams);
      setSyncResult(result.data);
      if (result.success) {
        toast.success('Sync All G2A Games completed successfully');
      } else {
        toast.error(`Sync failed with exit code ${result.data.exitCode}`);
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message || 'Failed to execute script'}`);
      setSyncResult({
        success: false,
        exitCode: null,
        stdout: '',
        stderr: error.message || 'Unknown error',
        duration: 0,
        error: error.message,
      });
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', color: theme.colors.text }}>
      <h1 style={{ marginBottom: '32px', fontSize: '28px', fontWeight: 600 }}>
        G2A Scripts Execution
      </h1>

      {/* Test G2A Export API */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: theme.colors.surface,
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <FiTerminal size={24} style={{ marginRight: '12px', color: theme.colors.primary }} />
          <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Test G2A Export API</h2>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: theme.colors.textSecondary }}>
            Page:
            <input
              type="number"
              min="1"
              value={testApiParams.page}
              onChange={(e) => setTestApiParams({ ...testApiParams, page: parseInt(e.target.value) || 1 })}
              style={{
                marginLeft: '8px',
                padding: '8px 12px',
                background: theme.colors.surfaceLight,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '6px',
                color: theme.colors.text,
                width: '80px',
              }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: '8px', color: theme.colors.textSecondary }}>
            Per Page:
            <input
              type="number"
              min="1"
              max="100"
              value={testApiParams.perPage}
              onChange={(e) => setTestApiParams({ ...testApiParams, perPage: parseInt(e.target.value) || 20 })}
              style={{
                marginLeft: '8px',
                padding: '8px 12px',
                background: theme.colors.surfaceLight,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '6px',
                color: theme.colors.text,
                width: '80px',
              }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', marginTop: '12px', color: theme.colors.textSecondary }}>
            <input
              type="checkbox"
              checked={testApiParams.debug}
              onChange={(e) => setTestApiParams({ ...testApiParams, debug: e.target.checked })}
              style={{ marginRight: '8px' }}
            />
            Debug Mode (show full JSON)
          </label>
        </div>

        <button
          onClick={handleTestG2AExportAPI}
          disabled={testApiLoading}
          style={{
            ...adminButtonStyle,
            opacity: testApiLoading ? 0.6 : 1,
            cursor: testApiLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {testApiLoading ? (
            <>
              <FiRefreshCw size={16} style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} />
              Running...
            </>
          ) : (
            <>
              <FiPlay size={16} style={{ marginRight: '8px' }} />
              Run Test
            </>
          )}
        </button>

        {testApiResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: '20px',
              padding: '16px',
              background: testApiResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${testApiResult.success ? theme.colors.success : theme.colors.error}`,
              borderRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              {testApiResult.success ? (
                <FiCheckCircle size={20} style={{ color: theme.colors.success, marginRight: '8px' }} />
              ) : (
                <FiAlertCircle size={20} style={{ color: theme.colors.error, marginRight: '8px' }} />
              )}
              <strong>
                {testApiResult.success ? 'Success' : 'Failed'} 
                {testApiResult.exitCode !== null && ` (Exit Code: ${testApiResult.exitCode})`}
              </strong>
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', color: theme.colors.textSecondary }}>
                <FiClock size={14} style={{ marginRight: '4px' }} />
                {(testApiResult.duration / 1000).toFixed(2)}s
              </span>
            </div>

            {testApiResult.stdout && (
              <div style={{ marginTop: '12px' }}>
                <strong style={{ color: theme.colors.textSecondary }}>Output:</strong>
                <pre style={{
                  marginTop: '8px',
                  padding: '12px',
                  background: theme.colors.background,
                  borderRadius: '6px',
                  overflow: 'auto',
                  maxHeight: '300px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}>
                  {testApiResult.stdout}
                </pre>
              </div>
            )}

            {testApiResult.stderr && (
              <div style={{ marginTop: '12px' }}>
                <strong style={{ color: theme.colors.error }}>Errors:</strong>
                <pre style={{
                  marginTop: '8px',
                  padding: '12px',
                  background: theme.colors.background,
                  borderRadius: '6px',
                  overflow: 'auto',
                  maxHeight: '200px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: theme.colors.error,
                }}>
                  {testApiResult.stderr}
                </pre>
              </div>
            )}

            {testApiResult.error && (
              <div style={{ marginTop: '12px', color: theme.colors.error }}>
                <strong>Error:</strong> {testApiResult.error}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Sync All G2A Games */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: theme.colors.surface,
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <FiRefreshCw size={24} style={{ marginRight: '12px', color: theme.colors.primary }} />
          <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Sync All G2A Games</h2>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: theme.colors.textSecondary }}>
            Limit (optional, leave empty for all):
            <input
              type="number"
              min="1"
              value={syncParams.limit || ''}
              onChange={(e) => setSyncParams({ ...syncParams, limit: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="No limit"
              style={{
                marginLeft: '8px',
                padding: '8px 12px',
                background: theme.colors.surfaceLight,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '6px',
                color: theme.colors.text,
                width: '120px',
              }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', marginTop: '12px', color: theme.colors.textSecondary }}>
            <input
              type="checkbox"
              checked={syncParams.dryRun}
              onChange={(e) => setSyncParams({ ...syncParams, dryRun: e.target.checked })}
              style={{ marginRight: '8px' }}
            />
            Dry Run (don't save to database)
          </label>

          <label style={{ display: 'flex', alignItems: 'center', marginTop: '12px', color: theme.colors.textSecondary }}>
            <input
              type="checkbox"
              checked={syncParams.filters}
              onChange={(e) => setSyncParams({ ...syncParams, filters: e.target.checked })}
              style={{ marginRight: '8px' }}
            />
            Apply Filters (minQty=1, only in stock)
          </label>
        </div>

        <div style={{ 
          padding: '12px', 
          background: theme.colors.surfaceLight, 
          borderRadius: '6px', 
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'start',
        }}>
          <FiInfo size={16} style={{ color: theme.colors.warning, marginRight: '8px', marginTop: '2px' }} />
          <span style={{ fontSize: '14px', color: theme.colors.textSecondary }}>
            This script will sync games from G2A Export API. It may take a long time for full sync (93,000+ products).
            Use limit parameter for testing.
          </span>
        </div>

        <button
          onClick={handleSyncAllG2AGames}
          disabled={syncLoading}
          style={{
            ...adminButtonStyle,
            opacity: syncLoading ? 0.6 : 1,
            cursor: syncLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {syncLoading ? (
            <>
              <FiRefreshCw size={16} style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} />
              Syncing...
            </>
          ) : (
            <>
              <FiPlay size={16} style={{ marginRight: '8px' }} />
              Start Sync
            </>
          )}
        </button>

        {syncResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: '20px',
              padding: '16px',
              background: syncResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${syncResult.success ? theme.colors.success : theme.colors.error}`,
              borderRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              {syncResult.success ? (
                <FiCheckCircle size={20} style={{ color: theme.colors.success, marginRight: '8px' }} />
              ) : (
                <FiAlertCircle size={20} style={{ color: theme.colors.error, marginRight: '8px' }} />
              )}
              <strong>
                {syncResult.success ? 'Success' : 'Failed'} 
                {syncResult.exitCode !== null && ` (Exit Code: ${syncResult.exitCode})`}
              </strong>
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', color: theme.colors.textSecondary }}>
                <FiClock size={14} style={{ marginRight: '4px' }} />
                {(syncResult.duration / 1000).toFixed(2)}s
              </span>
            </div>

            {syncResult.stdout && (
              <div style={{ marginTop: '12px' }}>
                <strong style={{ color: theme.colors.textSecondary }}>Output:</strong>
                <pre style={{
                  marginTop: '8px',
                  padding: '12px',
                  background: theme.colors.background,
                  borderRadius: '6px',
                  overflow: 'auto',
                  maxHeight: '400px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}>
                  {syncResult.stdout}
                </pre>
              </div>
            )}

            {syncResult.stderr && (
              <div style={{ marginTop: '12px' }}>
                <strong style={{ color: theme.colors.error }}>Errors:</strong>
                <pre style={{
                  marginTop: '8px',
                  padding: '12px',
                  background: theme.colors.background,
                  borderRadius: '6px',
                  overflow: 'auto',
                  maxHeight: '200px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: theme.colors.error,
                }}>
                  {syncResult.stderr}
                </pre>
              </div>
            )}

            {syncResult.error && (
              <div style={{ marginTop: '12px', color: theme.colors.error }}>
                <strong>Error:</strong> {syncResult.error}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default G2AScriptsPage;
