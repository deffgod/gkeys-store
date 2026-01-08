import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiMail, 
  FiEdit2, 
  FiSave, 
  FiX,
  FiEye,
  FiCode,
  FiFileText,
  FiRefreshCw,
  FiSend,
  FiSmartphone,
  FiMonitor
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

interface EmailTemplate {
  name: string;
  filename: string;
  description: string;
  variables: string[];
  subject: string;
  content?: string;
}

const EmailTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewView, setPreviewView] = useState<'desktop' | 'mobile'>('desktop');
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});
  const [testEmail, setTestEmail] = useState<string>('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminApi.getEmailTemplates();
      setTemplates(Array.isArray(response) ? response : (response as any).data || []);
    } catch (err) {
      console.error('Failed to load templates:', err);
      setError('Failed to load email templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = async (template: EmailTemplate) => {
    try {
      setError(null);
      const response = await adminApi.getEmailTemplate(template.name);
      const fullTemplate = (response as any).data || response;
      setSelectedTemplate(fullTemplate);
      setEditingContent(fullTemplate.content);
      setIsEditing(false);
      setPreviewMode(false);
      
      // Initialize preview variables with default values
      const defaultVars: Record<string, string> = {
        username: 'John Doe',
        gameTitle: 'Cyberpunk 2077',
        key: 'XXXX-XXXX-XXXX-XXXX',
        platform: 'Steam',
        amount: '50.00',
        currency: 'EUR',
        newBalance: '150.00',
        date: new Date().toLocaleDateString('en-GB').replace(/\//g, '.'),
        paymentMethod: 'Trustly',
        newPassword: 'NewSecurePass123!',
        verificationCode: '123456',
      };
      
      const initialVars: Record<string, string> = {};
      fullTemplate.variables?.forEach((varName: string) => {
        initialVars[varName] = defaultVars[varName] || '';
      });
      setPreviewVariables(initialVars);
      setTestEmail('');
    } catch (err) {
      console.error('Failed to load template:', err);
      setError('Failed to load template content');
    }
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;

    try {
      setIsSaving(true);
      setError(null);
      await adminApi.updateEmailTemplate(selectedTemplate.name, editingContent);
      setSuccessMessage('Template saved successfully!');
      setIsEditing(false);
      
      // Reload templates to get updated content
      await loadTemplates();
      
      // Update selected template
      const response = await adminApi.getEmailTemplate(selectedTemplate.name);
      setSelectedTemplate((response as any).data || response);
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to save template:', err);
      setError('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (selectedTemplate) {
      setEditingContent(selectedTemplate.content || '');
      setIsEditing(false);
      setPreviewMode(false);
    }
  };

  const renderPreview = (content: string) => {
    // Replace variables with preview variables
    let previewContent = content;
    Object.entries(previewVariables).forEach(([key, value]) => {
      previewContent = previewContent.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
    });

    return previewContent;
  };

  const handleSendTestEmail = async () => {
    if (!selectedTemplate || !testEmail) {
      setError('Please enter an email address');
      return;
    }

    if (!testEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setIsSendingTest(true);
      setError(null);
      await adminApi.sendTestEmail(selectedTemplate.name, testEmail, previewVariables);
      setSuccessMessage(`Test email sent successfully to ${testEmail}`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Failed to send test email:', err);
      setError(err.response?.data?.message || 'Failed to send test email');
    } finally {
      setIsSendingTest(false);
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
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          color: theme.colors.text,
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <FiMail size={28} />
          Email Templates
        </h1>
        <p style={{ color: theme.colors.textSecondary }}>
          Manage email templates for different scenarios
        </p>
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

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
        {/* Templates List */}
        <div style={{
          backgroundColor: theme.colors.surface,
          borderRadius: '12px',
          border: `1px solid ${theme.colors.border}`,
          padding: '16px',
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}>
            <h2 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: theme.colors.text,
            }}>
              Templates
            </h2>
            <button
              type="button"
              onClick={loadTemplates}
              style={{
                padding: '6px',
                backgroundColor: 'transparent',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '6px',
                color: theme.colors.textSecondary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Refresh"
            >
              <FiRefreshCw size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {templates.map((template) => (
              <button
                type="button"
                key={template.name}
                onClick={() => handleSelectTemplate(template)}
                style={{
                  padding: '12px',
                  backgroundColor: selectedTemplate?.name === template.name 
                    ? theme.colors.surfaceLight 
                    : 'transparent',
                  border: `1px solid ${selectedTemplate?.name === template.name 
                    ? theme.colors.primary 
                    : theme.colors.border}`,
                  borderRadius: '8px',
                  color: theme.colors.text,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (selectedTemplate?.name !== template.name) {
                    e.currentTarget.style.backgroundColor = theme.colors.surfaceLight;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedTemplate?.name !== template.name) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '600',
                  marginBottom: '4px',
                }}>
                  {template.name}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: theme.colors.textSecondary,
                }}>
                  {template.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Template Editor/Viewer */}
        {selectedTemplate ? (
          <div style={{
            backgroundColor: theme.colors.surface,
            borderRadius: '12px',
            border: `1px solid ${theme.colors.border}`,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              paddingBottom: '16px',
              borderBottom: `1px solid ${theme.colors.border}`,
            }}>
              <div>
                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: '600', 
                  color: theme.colors.text,
                  marginBottom: '8px',
                }}>
                  {selectedTemplate.name}
                </h2>
                <p style={{ 
                  fontSize: '14px', 
                  color: theme.colors.textSecondary,
                  marginBottom: '8px',
                }}>
                  {selectedTemplate.description}
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{
                    fontSize: '12px',
                    color: theme.colors.textMuted,
                  }}>
                    <strong>Subject:</strong> {selectedTemplate.subject}
                  </div>
                  {selectedTemplate.variables.length > 0 && (
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.textMuted,
                    }}>
                      <strong>Variables:</strong> {selectedTemplate.variables.join(', ')}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {!isEditing && (
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
                        fontWeight: '500',
                      }}
                    >
                      <FiEdit2 size={16} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode(!previewMode)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: previewMode ? theme.colors.surfaceLight : 'transparent',
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                      }}
                    >
                      <FiEye size={16} />
                      {previewMode ? 'Code' : 'Preview'}
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
                        fontWeight: '500',
                        opacity: isSaving ? 0.6 : 1,
                      }}
                    >
                      <FiSave size={16} />
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
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
                        fontWeight: '500',
                      }}
                    >
                      <FiX size={16} />
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Preview Variables Editor */}
            {previewMode && !isEditing && selectedTemplate.variables.length > 0 && (
              <div style={{
                padding: '16px',
                backgroundColor: theme.colors.surfaceLight,
                borderRadius: '8px',
                border: `1px solid ${theme.colors.border}`,
                marginBottom: '16px',
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: theme.colors.text,
                  marginBottom: '12px',
                }}>
                  Preview Variables:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {selectedTemplate.variables.map((variable) => (
                    <div key={variable}>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        color: theme.colors.textSecondary,
                        marginBottom: '4px',
                      }}>
                        {variable}:
                      </label>
                      <input
                        type="text"
                        value={previewVariables[variable] || ''}
                        onChange={(e) => setPreviewVariables({
                          ...previewVariables,
                          [variable]: e.target.value,
                        })}
                        style={{
                          width: '100%',
                          padding: '8px',
                          backgroundColor: theme.colors.background,
                          border: `1px solid ${theme.colors.border}`,
                          borderRadius: '6px',
                          color: theme.colors.text,
                          fontSize: '14px',
                        }}
                        placeholder={`Enter ${variable}...`}
                      />
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: theme.colors.background,
                  borderRadius: '6px',
                  border: `1px solid ${theme.colors.border}`,
                }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: theme.colors.textSecondary,
                    marginBottom: '6px',
                  }}>
                    Test Email Address:
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="test@example.com"
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: theme.colors.surface,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: '6px',
                        color: theme.colors.text,
                        fontSize: '14px',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSendTestEmail}
                      disabled={isSendingTest || !testEmail}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: isSendingTest || !testEmail ? theme.colors.border : theme.colors.info,
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: isSendingTest || !testEmail ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        opacity: isSendingTest || !testEmail ? 0.6 : 1,
                      }}
                    >
                      <FiSend size={16} />
                      {isSendingTest ? 'Sending...' : 'Send Test'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Content Editor/Viewer */}
            {previewMode && !isEditing ? (
              <div style={{
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                padding: '0',
                overflow: 'hidden',
                border: `1px solid ${theme.colors.border}`,
                position: 'relative',
              }}>
                {/* Preview View Toggle */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  backgroundColor: theme.colors.surface,
                  borderBottom: `1px solid ${theme.colors.border}`,
                }}>
                  <button
                    type="button"
                    onClick={() => setPreviewView('desktop')}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: previewView === 'desktop' ? theme.colors.primary : 'transparent',
                      color: previewView === 'desktop' ? '#000' : theme.colors.textSecondary,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                    }}
                  >
                    <FiMonitor size={14} />
                    Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewView('mobile')}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: previewView === 'mobile' ? theme.colors.primary : 'transparent',
                      color: previewView === 'mobile' ? '#000' : theme.colors.textSecondary,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                    }}
                  >
                    <FiSmartphone size={14} />
                    Mobile
                  </button>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: previewView === 'mobile' ? '20px' : '40px',
                  backgroundColor: '#e5e5e5',
                  minHeight: '600px',
                }}>
                  <div style={{
                    width: previewView === 'mobile' ? '375px' : '100%',
                    maxWidth: previewView === 'mobile' ? '375px' : '600px',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    borderRadius: previewView === 'mobile' ? '8px' : '0',
                    overflow: 'hidden',
                  }}>
                    <iframe
                      srcDoc={renderPreview(selectedTemplate.content || '')}
                      style={{
                        width: '100%',
                        height: previewView === 'mobile' ? '600px' : '600px',
                        border: 'none',
                        backgroundColor: '#ffffff',
                      }}
                      title="Email Preview"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  disabled={!isEditing}
                  style={{
                    width: '100%',
                    minHeight: '500px',
                    padding: '16px',
                    backgroundColor: isEditing ? theme.colors.surfaceLight : theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: '8px',
                    color: theme.colors.text,
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    resize: 'vertical',
                    outline: 'none',
                    cursor: isEditing ? 'text' : 'default',
                    lineHeight: '1.6',
                    tabSize: 2,
                  }}
                  placeholder="Template content..."
                  spellCheck={false}
                />
                {isEditing && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    fontSize: '11px',
                    color: theme.colors.textMuted,
                    backgroundColor: theme.colors.surface,
                    padding: '4px 8px',
                    borderRadius: '4px',
                  }}>
                    {editingContent.split('\n').length} lines
                  </div>
                )}
              </div>
            )}

            {/* Variables Help */}
            {selectedTemplate.variables.length > 0 && (
              <div style={{
                padding: '16px',
                backgroundColor: theme.colors.surfaceLight,
                borderRadius: '8px',
                border: `1px solid ${theme.colors.border}`,
              }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: theme.colors.text,
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <FiCode size={16} />
                  Available Variables:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {selectedTemplate.variables.map((variable) => (
                    <code
                      key={variable}
                      onClick={() => {
                        if (isEditing) {
                          const textarea = document.querySelector('textarea');
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const text = textarea.value;
                            const before = text.substring(0, start);
                            const after = text.substring(end);
                            const newText = before + `{{${variable}}}` + after;
                            setEditingContent(newText);
                            setTimeout(() => {
                              textarea.focus();
                              const newPos = start + variable.length + 4;
                              textarea.setSelectionRange(newPos, newPos);
                            }, 0);
                          }
                        }
                      }}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: theme.colors.background,
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: theme.colors.primary,
                        fontFamily: 'monospace',
                        border: `1px solid ${theme.colors.border}`,
                        cursor: isEditing ? 'pointer' : 'default',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (isEditing) {
                          e.currentTarget.style.backgroundColor = theme.colors.primary + '20';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isEditing) {
                          e.currentTarget.style.backgroundColor = theme.colors.background;
                        }
                      }}
                      title={isEditing ? 'Click to insert' : undefined}
                    >
                      {`{{${variable}}}`}
                    </code>
                  ))}
                </div>
                {isEditing && (
                  <div style={{
                    fontSize: '11px',
                    color: theme.colors.textMuted,
                    fontStyle: 'italic',
                  }}>
                    💡 Click on a variable to insert it into the template
                  </div>
                )}
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
            <FiFileText size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>Select a template to view and edit</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailTemplatesPage;
