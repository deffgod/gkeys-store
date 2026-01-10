import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiKey, FiCopy, FiCheck, FiSave, FiTrash2, FiEdit2, FiAlertCircle, FiRefreshCw, FiDownload, FiInfo, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { adminApi } from '../services/adminApi';
import { adminInputStyle, adminButtonStyle } from '../styles/adminStyles';

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

interface G2ASettings {
  id: string;
  clientId: string;
  email: string;
  clientSecret: string;
  apiKey: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const G2AKeyManagerPage: React.FC = () => {
  const [settings, setSettings] = useState<G2ASettings | null>(null);
  const [allSettings, setAllSettings] = useState<G2ASettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    clientId: '',
    email: '',
    clientSecret: '',
    apiKey: '',
    environment: 'sandbox' as 'sandbox' | 'production',
  });

  // Generated API key state
  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null);
  
  // Testing state
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Token state
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenData, setTokenData] = useState<G2ATokenResponse | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const [current, all] = await Promise.all([
        adminApi.getG2ASettings(),
        adminApi.getAllG2ASettings(),
      ]);
      setSettings(current);
      setAllSettings(all);
      if (current) {
        setFormData({
          clientId: current.clientId,
          email: current.email,
          clientSecret: current.clientSecret,
          apiKey: current.apiKey || '',
          environment: (current.environment as 'sandbox' | 'production') || 'sandbox',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load G2A settings');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    if (!formData.clientId || !formData.email || !formData.clientSecret) {
      setError('Please fill in ClientId, Email, and ClientSecret to generate API key');
      return;
    }

    try {
      setError(null);
      const result = await adminApi.generateG2AApiKey({
        clientId: formData.clientId,
        email: formData.email,
        clientSecret: formData.clientSecret,
      });
      setGeneratedApiKey(result.apiKey);
      setFormData(prev => ({ ...prev, apiKey: result.apiKey }));
      setSuccess('API key generated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to generate API key');
    }
  };

  const handleSave = async () => {
    if (!formData.clientId || !formData.email || !formData.clientSecret) {
      setError('ClientId, Email, and ClientSecret are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const result = await adminApi.upsertG2ASettings({
        clientId: formData.clientId,
        email: formData.email,
        clientSecret: formData.clientSecret,
        apiKey: formData.apiKey || undefined,
        environment: formData.environment,
        isActive: true,
      });
      setSettings(result);
      setSuccess('G2A settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
      await loadSettings();
    } catch (err: any) {
      setError(err.message || 'Failed to save G2A settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleEdit = (setting: G2ASettings) => {
    setFormData({
      clientId: setting.clientId,
      email: setting.email,
      clientSecret: setting.clientSecret,
      apiKey: setting.apiKey || '',
      environment: (setting.environment as 'sandbox' | 'production') || 'sandbox',
    });
    setGeneratedApiKey(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete these G2A settings?')) {
      return;
    }

    try {
      await adminApi.deleteG2ASettings(id);
      setSuccess('G2A settings deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
      await loadSettings();
    } catch (err: any) {
      setError(err.message || 'Failed to delete G2A settings');
    }
  };

  const handleTestKey = async () => {
    if (!formData.clientId || !formData.email || !formData.clientSecret) {
      setError('Please fill in all required fields to test the API key');
      return;
    }

    try {
      setTestingKey(true);
      setError(null);
      setTestResult(null);
      
      // Generate key first
      const result = await adminApi.generateG2AApiKey({
        clientId: formData.clientId,
        email: formData.email,
        clientSecret: formData.clientSecret,
      });

      // Test the key by making a simple API call (this would need a backend endpoint)
      // For now, we'll just validate the key format
      const apiKey = result.apiKey;
      if (apiKey && apiKey.length === 64 && /^[a-f0-9]+$/.test(apiKey)) {
        setTestResult({
          success: true,
          message: 'API key format is valid (64 character hex string)',
        });
      } else {
        setTestResult({
          success: false,
          message: 'API key format is invalid',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to test API key',
      });
    } finally {
      setTestingKey(false);
    }
  };

  const handleExportSettings = () => {
    if (!settings) {
      setError('No settings to export');
      return;
    }

    const exportData = {
      clientId: settings.clientId,
      email: settings.email,
      apiKey: settings.apiKey,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `g2a-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setSuccess('Settings exported successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: theme.colors.text }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '32px' }}
      >
        <h1
          style={{
            fontSize: '32px',
            fontWeight: '700',
            color: theme.colors.text,
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <FiKey color={theme.colors.primary} size={32} />
          G2A API Key Manager
        </h1>
        <p style={{ color: theme.colors.textSecondary }}>
          Generate and manage G2A API keys for data parsing
        </p>
      </motion.div>

      {/* Error/Success Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '16px',
            backgroundColor: theme.colors.error + '20',
            border: `1px solid ${theme.colors.error}`,
            borderRadius: '8px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: theme.colors.error,
          }}
        >
          <FiAlertCircle size={20} />
          {error}
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '16px',
            backgroundColor: theme.colors.success + '20',
            border: `1px solid ${theme.colors.success}`,
            borderRadius: '8px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: theme.colors.success,
          }}
        >
          <FiCheck size={20} />
          {success}
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Generate API Key Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: '16px',
            padding: '24px',
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: theme.colors.text, marginBottom: '24px' }}>
            Generate API Key
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: theme.colors.textSecondary }}>
                Client ID
              </label>
              <input
                type="text"
                value={formData.clientId}
                onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                placeholder="qdaiciDiyMaTjxMt"
                style={adminInputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: theme.colors.textSecondary }}>
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="sandboxapitest@g2a.com"
                style={adminInputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: theme.colors.textSecondary }}>
                Client Secret
              </label>
              <input
                type="password"
                value={formData.clientSecret}
                onChange={(e) => setFormData(prev => ({ ...prev, clientSecret: e.target.value }))}
                placeholder="Enter client secret"
                style={adminInputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: theme.colors.textSecondary }}>
                Environment
              </label>
              <select
                value={formData.environment}
                onChange={(e) => setFormData(prev => ({ ...prev, environment: e.target.value as 'sandbox' | 'production' }))}
                style={adminInputStyle}
              >
                <option value="sandbox">Sandbox (https://sandboxapi.g2a.com)</option>
                <option value="production">Production (https://api.g2a.com/v1/products)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleGenerateKey}
                disabled={!formData.clientId || !formData.email || !formData.clientSecret}
                style={{
                  ...adminButtonStyle,
                  backgroundColor: theme.colors.primary,
                  opacity: (!formData.clientId || !formData.email || !formData.clientSecret) ? 0.5 : 1,
                  flex: 1,
                }}
              >
                <FiKey size={18} style={{ marginRight: '8px' }} />
                Generate API Key
              </button>
              <button
                onClick={handleTestKey}
                disabled={testingKey || !formData.clientId || !formData.email || !formData.clientSecret}
                style={{
                  ...adminButtonStyle,
                  backgroundColor: theme.colors.info || '#3B82F6',
                  opacity: (testingKey || !formData.clientId || !formData.email || !formData.clientSecret) ? 0.5 : 1,
                  flex: 1,
                }}
              >
                <FiRefreshCw size={18} style={{ marginRight: '8px' }} />
                {testingKey ? 'Testing...' : 'Test Key'}
              </button>
            </div>

            {testResult && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: testResult.success ? theme.colors.success + '20' : theme.colors.error + '20',
                  border: `1px solid ${testResult.success ? theme.colors.success : theme.colors.error}`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: testResult.success ? theme.colors.success : theme.colors.error,
                  fontSize: '13px',
                }}
              >
                {testResult.success ? <FiCheckCircle size={16} /> : <FiXCircle size={16} />}
                {testResult.message}
              </div>
            )}

            {generatedApiKey && (
              <div
                style={{
                  padding: '16px',
                  backgroundColor: theme.colors.background,
                  borderRadius: '8px',
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ color: theme.colors.textSecondary, fontSize: '14px' }}>
                    Generated API Key:
                  </label>
                  <button
                    onClick={() => handleCopy(generatedApiKey, 'generated')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: theme.colors.primary,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {copied === 'generated' ? <FiCheck size={16} /> : <FiCopy size={16} />}
                  </button>
                </div>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: theme.colors.text,
                    wordBreak: 'break-all',
                  }}
                >
                  {generatedApiKey}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Save Settings Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: '16px',
            padding: '24px',
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: theme.colors.text, marginBottom: '24px' }}>
            Save Settings
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: theme.colors.textSecondary }}>
                API Key (optional, will be generated if empty)
              </label>
              <input
                type="text"
                value={formData.apiKey}
                onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Generated API key or enter manually"
                style={adminInputStyle}
              />
            </div>

            <div style={{ 
              padding: '12px', 
              backgroundColor: theme.colors.background, 
              borderRadius: '8px', 
              fontSize: '12px', 
              color: theme.colors.textSecondary,
              border: `1px solid ${theme.colors.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FiInfo size={14} />
                <strong>Formula:</strong>
              </div>
              <div style={{ fontFamily: 'monospace', marginLeft: '22px', color: theme.colors.text }}>
                SHA256(ClientId + Email + ClientSecret)
              </div>
              <div style={{ marginTop: '8px', fontSize: '11px', color: theme.colors.textMuted }}>
                The generated key is a 64-character hexadecimal string used in the Authorization header.
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !formData.clientId || !formData.email || !formData.clientSecret}
              style={{
                ...adminButtonStyle,
                backgroundColor: theme.colors.success,
                opacity: (saving || !formData.clientId || !formData.email || !formData.clientSecret) ? 0.5 : 1,
              }}
            >
              <FiSave size={18} style={{ marginRight: '8px' }} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Current Settings */}
      {settings && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: '16px',
            padding: '24px',
            border: `1px solid ${theme.colors.border}`,
            marginBottom: '32px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: theme.colors.text }}>
              Current Active Settings
            </h2>
            <button
              onClick={handleExportSettings}
              style={{
                ...adminButtonStyle,
                backgroundColor: 'transparent',
                border: `1px solid ${theme.colors.border}`,
                padding: '8px 16px',
              }}
            >
              <FiDownload size={16} style={{ marginRight: '8px' }} />
              Export
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', color: theme.colors.textSecondary, fontSize: '12px' }}>
                Client ID
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontFamily: 'monospace', color: theme.colors.text, fontSize: '14px' }}>
                  {settings.clientId}
                </div>
                <button
                  onClick={() => handleCopy(settings.clientId, 'clientId')}
                  style={{ background: 'none', border: 'none', color: theme.colors.primary, cursor: 'pointer' }}
                >
                  {copied === 'clientId' ? <FiCheck size={16} /> : <FiCopy size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', color: theme.colors.textSecondary, fontSize: '12px' }}>
                Email
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontFamily: 'monospace', color: theme.colors.text, fontSize: '14px' }}>
                  {settings.email}
                </div>
                <button
                  onClick={() => handleCopy(settings.email, 'email')}
                  style={{ background: 'none', border: 'none', color: theme.colors.primary, cursor: 'pointer' }}
                >
                  {copied === 'email' ? <FiCheck size={16} /> : <FiCopy size={16} />}
                </button>
              </div>
            </div>

            {settings.apiKey && (
              <div>
                <label style={{ display: 'block', marginBottom: '4px', color: theme.colors.textSecondary, fontSize: '12px' }}>
                  API Key
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontFamily: 'monospace', color: theme.colors.text, fontSize: '12px', wordBreak: 'break-all' }}>
                    {settings.apiKey.substring(0, 20)}...
                  </div>
                  <button
                    onClick={() => handleCopy(settings.apiKey!, 'apiKey')}
                    style={{ background: 'none', border: 'none', color: theme.colors.primary, cursor: 'pointer' }}
                  >
                    {copied === 'apiKey' ? <FiCheck size={16} /> : <FiCopy size={16} />}
                  </button>
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '4px', color: theme.colors.textSecondary, fontSize: '12px' }}>
                Environment
              </label>
              <div style={{ 
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '6px',
                backgroundColor: settings.environment === 'production' ? theme.colors.success + '20' : theme.colors.warning + '20',
                color: settings.environment === 'production' ? theme.colors.success : theme.colors.warning,
                fontSize: '12px',
                fontWeight: '600',
              }}>
                {settings.environment === 'production' ? 'Production' : 'Sandbox'}
              </div>
            </div>
          </div>

          {/* Token Display */}
          {tokenData && (
            <div style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: theme.colors.background,
              borderRadius: '8px',
              border: `1px solid ${theme.colors.border}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: theme.colors.text }}>
                  OAuth2 Token
                </h3>
                <button
                  onClick={() => handleCopy(tokenData.access_token, 'token')}
                  style={{ background: 'none', border: 'none', color: theme.colors.primary, cursor: 'pointer' }}
                >
                  {copied === 'token' ? <FiCheck size={16} /> : <FiCopy size={16} />}
                </button>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '4px', color: theme.colors.textSecondary, fontSize: '12px' }}>
                  Access Token
                </label>
                <div style={{ fontFamily: 'monospace', color: theme.colors.text, fontSize: '12px', wordBreak: 'break-all', padding: '8px', backgroundColor: theme.colors.surface, borderRadius: '4px' }}>
                  {tokenData.access_token}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', color: theme.colors.textSecondary }}>
                    Expires In
                  </label>
                  <div style={{ color: theme.colors.text }}>
                    {tokenData.expires_in} seconds ({Math.floor(tokenData.expires_in / 60)} minutes)
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', color: theme.colors.textSecondary }}>
                    Expires At
                  </label>
                  <div style={{ color: theme.colors.text }}>
                    {new Date(tokenData.expiresAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tokenError && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: theme.colors.error + '20',
              border: `1px solid ${theme.colors.error}`,
              borderRadius: '8px',
              color: theme.colors.error,
              fontSize: '13px',
            }}>
              <FiAlertCircle size={16} style={{ marginRight: '8px', display: 'inline' }} />
              {tokenError}
            </div>
          )}
        </motion.div>
      )}

      {/* All Settings History */}
      {allSettings.length > 0 && (
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
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: theme.colors.text, marginBottom: '24px' }}>
            All Settings
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {allSettings.map((setting) => (
              <div
                key={setting.id}
                style={{
                  padding: '16px',
                  backgroundColor: setting.isActive ? theme.colors.primary + '20' : theme.colors.background,
                  borderRadius: '8px',
                  border: `1px solid ${setting.isActive ? theme.colors.primary : theme.colors.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ fontFamily: 'monospace', color: theme.colors.text, fontWeight: '600' }}>
                      {setting.clientId}
                    </div>
                    {setting.isActive && (
                      <span
                        style={{
                          padding: '2px 8px',
                          backgroundColor: theme.colors.success,
                          color: '#000',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '600',
                        }}
                      >
                        ACTIVE
                      </span>
                    )}
                    <span
                      style={{
                        padding: '2px 8px',
                        backgroundColor: setting.environment === 'production' ? theme.colors.success + '20' : theme.colors.warning + '20',
                        color: setting.environment === 'production' ? theme.colors.success : theme.colors.warning,
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600',
                      }}
                    >
                      {setting.environment === 'production' ? 'PROD' : 'SANDBOX'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: theme.colors.textSecondary }}>
                    {setting.email} • Updated: {new Date(setting.updatedAt).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleGetToken(setting.id)}
                    disabled={tokenLoading}
                    style={{
                      padding: '8px',
                      backgroundColor: theme.colors.primary + '20',
                      border: `1px solid ${theme.colors.primary}`,
                      borderRadius: '6px',
                      color: theme.colors.primary,
                      cursor: tokenLoading ? 'not-allowed' : 'pointer',
                      opacity: tokenLoading ? 0.5 : 1,
                    }}
                    title="Get Token"
                  >
                    <FiRefreshCw size={16} />
                  </button>
                  <button
                    onClick={() => handleEdit(setting)}
                    style={{
                      padding: '8px',
                      backgroundColor: theme.colors.surfaceLight,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: '6px',
                      color: theme.colors.text,
                      cursor: 'pointer',
                    }}
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(setting.id)}
                    style={{
                      padding: '8px',
                      backgroundColor: theme.colors.error + '20',
                      border: `1px solid ${theme.colors.error}`,
                      borderRadius: '6px',
                      color: theme.colors.error,
                      cursor: 'pointer',
                    }}
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default G2AKeyManagerPage;
