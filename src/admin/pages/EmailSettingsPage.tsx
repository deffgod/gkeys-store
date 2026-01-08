import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiMail, 
  FiSave, 
  FiX,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiAlertCircle,
  FiSend,
  FiSettings
} from 'react-icons/fi';
import { adminApi } from '../services/adminApi';

const theme = {
  colors: {
    primary: '#00C8C2',
    primaryDark: '#059669',
    background: '#0a0a0a',
    surface: '#141414',
    surfaceLight: '#1a1a1a',
    text: '#ffffff',
    textSecondary: '#a0a0a0',
    textMuted: '#666666',
    border: '#2a2a2a',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
};

interface EmailSettings {
  id: string;
  name: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const EmailSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<EmailSettings[]>([]);
  const [selectedSetting, setSelectedSetting] = useState<EmailSettings | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showBulkSend, setShowBulkSend] = useState(false);
  const [bulkEmails, setBulkEmails] = useState<string>('');
  const [bulkTemplate, setBulkTemplate] = useState<string>('');
  const [bulkVariables, setBulkVariables] = useState<Record<string, string>>({});
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ sent: number; failed: number; errors: Array<{ email: string; error: string }> } | null>(null);
  const [templates, setTemplates] = useState<Array<{ name: string; description: string }>>([]);

  const [formData, setFormData] = useState({
    name: 'default',
    host: '',
    port: 587,
    secure: false,
    user: '',
    password: '',
    fromEmail: '',
    fromName: '',
    isActive: true,
  });

  useEffect(() => {
    loadSettings();
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await adminApi.getEmailTemplates();
      const data = Array.isArray(response) ? response : (response as any).data || [];
      setTemplates(data.map((t: any) => ({ name: t.name, description: t.description })));
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminApi.getEmailSettings();
      const data = (response as any).data || response;
      setSettings(Array.isArray(data) ? data : [data].filter(Boolean));
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError('Failed to load email settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSetting = (setting: EmailSettings) => {
    setSelectedSetting(setting);
    setFormData({
      name: setting.name,
      host: setting.host,
      port: setting.port,
      secure: setting.secure,
      user: setting.user,
      password: '', // Don't show password
      fromEmail: setting.fromEmail,
      fromName: setting.fromName || '',
      isActive: setting.isActive,
    });
    setIsEditing(false);
  };

  const handleCreateNew = () => {
    setSelectedSetting(null);
    setFormData({
      name: 'default',
      host: '',
      port: 587,
      secure: false,
      user: '',
      password: '',
      fromEmail: '',
      fromName: '',
      isActive: true,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      if (selectedSetting) {
        await adminApi.updateEmailSettings(selectedSetting.id, formData);
        setSuccessMessage('Email settings updated successfully!');
      } else {
        await adminApi.upsertEmailSettings(formData);
        setSuccessMessage('Email settings created successfully!');
      }

      setIsEditing(false);
      await loadSettings();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setError(err.response?.data?.message || 'Failed to save email settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete these email settings?')) {
      return;
    }

    try {
      await adminApi.deleteEmailSettings(id);
      setSuccessMessage('Email settings deleted successfully!');
      if (selectedSetting?.id === id) {
        setSelectedSetting(null);
      }
      await loadSettings();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete email settings');
    }
  };

  const handleTest = async (id: string) => {
    try {
      setIsTesting(true);
      setError(null);
      await adminApi.testEmailSettings(id);
      setSuccessMessage('Email settings test successful!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email settings test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const handleBulkSend = async () => {
    if (!bulkTemplate || !bulkEmails) {
      setError('Please select a template and enter email addresses');
      return;
    }

    const emails = bulkEmails.split('\n').map(e => e.trim()).filter(e => e && e.includes('@'));

    if (emails.length === 0) {
      setError('Please enter at least one valid email address');
      return;
    }

    try {
      setIsSendingBulk(true);
      setError(null);
      const response = await adminApi.sendBulkEmails(bulkTemplate, emails, bulkVariables, 10);
      setBulkResult((response as any).data);
      setSuccessMessage(`Sent ${(response as any).data.sent} emails, ${(response as any).data.failed} failed`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send bulk emails');
    } finally {
      setIsSendingBulk(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        color: theme.colors.textSecondary,
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${theme.colors.border}`,
            borderTopColor: theme.colors.primary,
            borderRadius: '50%',
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: theme.colors.text,
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <FiSettings size={28} />
            Email Settings
          </h1>
          <p style={{ color: theme.colors.textSecondary }}>
            Manage SMTP server settings and email addresses
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={() => setShowBulkSend(!showBulkSend)}
            style={{
              padding: '10px 20px',
              backgroundColor: showBulkSend ? theme.colors.surfaceLight : theme.colors.info,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            <FiSend size={18} />
            Bulk Send
          </button>
          <button
            type="button"
            onClick={handleCreateNew}
            style={{
              padding: '10px 20px',
              backgroundColor: theme.colors.primary,
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            <FiPlus size={18} />
            New Settings
          </button>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${theme.colors.error}`,
            borderRadius: '8px',
            color: theme.colors.error,
            fontSize: '14px',
            marginBottom: '24px',
          }}
        >
          {error}
        </motion.div>
      )}

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${theme.colors.success}`,
            borderRadius: '8px',
            color: theme.colors.success,
            fontSize: '14px',
            marginBottom: '24px',
          }}
        >
          {successMessage}
        </motion.div>
      )}

      {showBulkSend && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '24px',
            backgroundColor: theme.colors.surface,
            borderRadius: '12px',
            border: `1px solid ${theme.colors.border}`,
            marginBottom: '24px',
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: theme.colors.text, marginBottom: '20px' }}>
            Bulk Email Send
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: theme.colors.textSecondary, fontSize: '14px' }}>
                Template:
              </label>
              <select
                value={bulkTemplate}
                onChange={(e) => setBulkTemplate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: theme.colors.background,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: '8px',
                  color: theme.colors.text,
                  fontSize: '14px',
                }}
              >
                <option value="">Select a template...</option>
                {templates.map((template) => (
                  <option key={template.name} value={template.name}>
                    {template.name} - {template.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: theme.colors.textSecondary, fontSize: '14px' }}>
                Email Addresses (one per line):
              </label>
              <textarea
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                placeholder="email1@example.com&#10;email2@example.com&#10;..."
                rows={6}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: theme.colors.background,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: '8px',
                  color: theme.colors.text,
                  fontSize: '14px',
                  fontFamily: 'monospace',
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleBulkSend}
              disabled={isSendingBulk}
              style={{
                padding: '12px 24px',
                backgroundColor: isSendingBulk ? theme.colors.border : theme.colors.success,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: isSendingBulk ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: isSendingBulk ? 0.6 : 1,
              }}
            >
              {isSendingBulk ? 'Sending...' : 'Send Bulk Emails'}
            </button>
            {bulkResult && (
              <div style={{
                padding: '16px',
                backgroundColor: theme.colors.surfaceLight,
                borderRadius: '8px',
                border: `1px solid ${theme.colors.border}`,
              }}>
                <div style={{ color: theme.colors.text, marginBottom: '8px' }}>
                  <strong>Results:</strong> {bulkResult.sent} sent, {bulkResult.failed} failed
                </div>
                {bulkResult.errors.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <strong style={{ color: theme.colors.error }}>Errors:</strong>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px', color: theme.colors.textSecondary }}>
                      {bulkResult.errors.slice(0, 10).map((err, idx) => (
                        <li key={idx}>{err.email}: {err.error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
        {/* Settings List */}
        <div style={{
          backgroundColor: theme.colors.surface,
          borderRadius: '12px',
          border: `1px solid ${theme.colors.border}`,
          padding: '16px',
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto',
        }}>
          <h2 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: theme.colors.text,
            marginBottom: '16px',
          }}>
            SMTP Settings
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {settings.map((setting) => (
              <div
                key={setting.id}
                style={{
                  padding: '12px',
                  backgroundColor: selectedSetting?.id === setting.id 
                    ? theme.colors.surfaceLight 
                    : 'transparent',
                  border: `1px solid ${selectedSetting?.id === setting.id 
                    ? theme.colors.primary 
                    : theme.colors.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => handleSelectSetting(setting)}
              >
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '600',
                  marginBottom: '4px',
                  color: theme.colors.text,
                }}>
                  {setting.name}
                  {setting.isActive && (
                    <span style={{
                      marginLeft: '8px',
                      padding: '2px 6px',
                      backgroundColor: theme.colors.success,
                      color: '#fff',
                      borderRadius: '4px',
                      fontSize: '10px',
                    }}>
                      Active
                    </span>
                  )}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: theme.colors.textSecondary,
                }}>
                  {setting.host}:{setting.port}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: theme.colors.textMuted,
                  marginTop: '4px',
                }}>
                  From: {setting.fromEmail}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings Editor */}
        {(selectedSetting || isEditing) ? (
          <div style={{
            backgroundColor: theme.colors.surface,
            borderRadius: '12px',
            border: `1px solid ${theme.colors.border}`,
            padding: '24px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: `1px solid ${theme.colors.border}`,
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: theme.colors.text }}>
                {selectedSetting ? 'Edit Settings' : 'New Settings'}
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedSetting && !isEditing && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: theme.colors.primary,
                        color: '#000',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px',
                      }}
                    >
                      <FiEdit2 size={16} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTest(selectedSetting.id)}
                      disabled={isTesting}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: theme.colors.info,
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: isTesting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px',
                        opacity: isTesting ? 0.6 : 1,
                      }}
                    >
                      <FiCheck size={16} />
                      {isTesting ? 'Testing...' : 'Test'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(selectedSetting.id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: 'transparent',
                        color: theme.colors.error,
                        border: `1px solid ${theme.colors.error}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px',
                      }}
                    >
                      <FiTrash2 size={16} />
                      Delete
                    </button>
                  </>
                )}
                {isEditing && (
                  <>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: theme.colors.success,
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px',
                        opacity: isSaving ? 0.6 : 1,
                      }}
                    >
                      <FiSave size={16} />
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        if (selectedSetting) {
                          handleSelectSetting(selectedSetting);
                        }
                      }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: 'transparent',
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px',
                      }}
                    >
                      <FiX size={16} />
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            {isEditing && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: theme.colors.textSecondary, fontSize: '14px' }}>
                      Name:
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: theme.colors.background,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: '8px',
                        color: theme.colors.text,
                        fontSize: '14px',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: theme.colors.textSecondary, fontSize: '14px' }}>
                      SMTP Host:
                    </label>
                    <input
                      type="text"
                      value={formData.host}
                      onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                      placeholder="smtp.sendgrid.net"
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: theme.colors.background,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: '8px',
                        color: theme.colors.text,
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: theme.colors.textSecondary, fontSize: '14px' }}>
                      Port:
                    </label>
                    <input
                      type="number"
                      value={formData.port}
                      onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 587 })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: theme.colors.background,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: '8px',
                        color: theme.colors.text,
                        fontSize: '14px',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.colors.textSecondary, fontSize: '14px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.secure}
                        onChange={(e) => setFormData({ ...formData, secure: e.target.checked })}
                        style={{ cursor: 'pointer' }}
                      />
                      Use SSL/TLS
                    </label>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: theme.colors.textSecondary, fontSize: '14px' }}>
                      Username:
                    </label>
                    <input
                      type="text"
                      value={formData.user}
                      onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: theme.colors.background,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: '8px',
                        color: theme.colors.text,
                        fontSize: '14px',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: theme.colors.textSecondary, fontSize: '14px' }}>
                      Password:
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={selectedSetting ? 'Leave empty to keep current' : ''}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: theme.colors.background,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: '8px',
                        color: theme.colors.text,
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: theme.colors.textSecondary, fontSize: '14px' }}>
                      From Email:
                    </label>
                    <input
                      type="email"
                      value={formData.fromEmail}
                      onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                      placeholder="noreply@gkeys.store"
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: theme.colors.background,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: '8px',
                        color: theme.colors.text,
                        fontSize: '14px',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: theme.colors.textSecondary, fontSize: '14px' }}>
                      From Name (optional):
                    </label>
                    <input
                      type="text"
                      value={formData.fromName}
                      onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                      placeholder="GKEYS Store"
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: theme.colors.background,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: '8px',
                        color: theme.colors.text,
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.colors.textSecondary, fontSize: '14px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      style={{ cursor: 'pointer' }}
                    />
                    Set as active (will deactivate other settings)
                  </label>
                </div>
              </div>
            )}

            {!isEditing && selectedSetting && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '16px', backgroundColor: theme.colors.surfaceLight, borderRadius: '8px' }}>
                  <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>SMTP Host</div>
                  <div style={{ color: theme.colors.text }}>{selectedSetting.host}:{selectedSetting.port}</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: theme.colors.surfaceLight, borderRadius: '8px' }}>
                  <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>Username</div>
                  <div style={{ color: theme.colors.text }}>{selectedSetting.user}</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: theme.colors.surfaceLight, borderRadius: '8px' }}>
                  <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>From Email</div>
                  <div style={{ color: theme.colors.text }}>{selectedSetting.fromEmail}</div>
                  {selectedSetting.fromName && (
                    <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginTop: '4px' }}>
                      Name: {selectedSetting.fromName}
                    </div>
                  )}
                </div>
                <div style={{ padding: '16px', backgroundColor: theme.colors.surfaceLight, borderRadius: '8px' }}>
                  <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>Security</div>
                  <div style={{ color: theme.colors.text }}>{selectedSetting.secure ? 'SSL/TLS' : 'None'}</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{
            backgroundColor: theme.colors.surface,
            borderRadius: '12px',
            border: `1px solid ${theme.colors.border}`,
            padding: '48px',
            textAlign: 'center',
            color: theme.colors.textSecondary,
          }}>
            <FiSettings size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>Select settings to view or create new ones</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailSettingsPage;
