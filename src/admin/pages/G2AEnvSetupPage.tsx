import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiCheck,
  FiCopy,
  FiKey,
  FiMail,
  FiGlobe,
  FiCode,
  FiAlertCircle,
  FiInfo,
  FiChevronRight,
  FiChevronDown
} from 'react-icons/fi';

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

interface EnvVar {
  name: string;
  description: string;
  required: boolean;
  example: string;
  note?: string;
}

const envVars: EnvVar[] = [
  {
    name: 'G2A_API_KEY',
    description: 'G2A Client ID (API Key) - получается в G2A Seller Panel',
    required: true,
    example: 'qdaiciDiyMaTjxMt',
    note: 'Также поддерживается старое название: G2A_CLIENT_ID'
  },
  {
    name: 'G2A_API_HASH',
    description: 'G2A Client Secret - получается в G2A Seller Panel вместе с API Key',
    required: true,
    example: 'b0d293f6-e1d2-4629-8264-fd63b5af3207b0d293f6-e1d2-4629-8264-fd63b5af3207',
    note: 'Также поддерживается: G2A_API_SECRET или G2A_CLIENT_SECRET'
  },
  {
    name: 'G2A_EMAIL',
    description: 'Email адрес, связанный с G2A аккаунтом',
    required: true,
    example: 'sandboxapitest@g2a.com',
    note: 'Используется для генерации API ключа'
  },
  {
    name: 'G2A_ENV',
    description: 'Окружение G2A API',
    required: false,
    example: 'sandbox',
    note: 'Возможные значения: sandbox или live (production)'
  },
  {
    name: 'G2A_API_URL',
    description: 'Базовый URL для G2A API',
    required: false,
    example: 'https://sandboxapi.g2a.com',
    note: 'Для sandbox: https://sandboxapi.g2a.com, для production: https://api.g2a.com'
  },
];

const G2AEnvSetupPage: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    formula: true,
    php: false,
    typescript: false,
    usage: true,
  });

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const phpExample = `<?php
$envDomain = 'sandboxapi.g2a.com'; // для production будет другой домен
$g2aEmail = 'sandboxapitest@g2a.com'; // email клиента
$clientId = 'qdaiciDiyMaTjxMt'; // API Client ID
$clientSecret = 'b0d293f6-e1d2-4629-8264-fd63b5af3207b0d293f6-e1d2-4629-8264-fd63b5af3207'; // Client secret

// Генерация API ключа
$apiKey = hash('sha256', $clientId . $g2aEmail . $clientSecret);

echo 'Authorization: ' . $clientId . ', ' . $apiKey . PHP_EOL;

// Использование в запросе
$productsApiUrl = 'https://' . $envDomain . '/v1/products';
$curl = curl_init();
curl_setopt_array($curl, array(
    CURLOPT_URL => $productsApiUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING => "",
    CURLOPT_TIMEOUT => 30,
    CURLOPT_CUSTOMREQUEST => "GET",
    CURLOPT_HTTPHEADER => array(
        "Authorization: $clientId, $apiKey",
        "Content-Type: application/json",
    ),
));

$response = curl_exec($curl);
$err = curl_error($curl);
curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  echo $response;
}
?>`;

  const typescriptExample = `import crypto from 'crypto';

// Переменные окружения
const clientId = process.env.G2A_API_KEY || '';
const email = process.env.G2A_EMAIL || '';
const clientSecret = process.env.G2A_API_HASH || '';
const envDomain = process.env.G2A_ENV === 'live' 
  ? 'api.g2a.com' 
  : 'sandboxapi.g2a.com';

// Генерация API ключа
function generateG2AApiKey(
  clientId: string,
  email: string,
  clientSecret: string
): string {
  return crypto
    .createHash('sha256')
    .update(clientId + email + clientSecret)
    .digest('hex');
}

const apiKey = generateG2AApiKey(clientId, email, clientSecret);

// Использование в запросе
const productsApiUrl = \`https://\${envDomain}/v1/products\`;

const response = await fetch(productsApiUrl, {
  method: 'GET',
  headers: {
    'Authorization': \`\${clientId}, \${apiKey}\`,
    'Content-Type': 'application/json',
  },
});

const data = await response.json();
console.log(data);`;

  const usageExample = `// Пример использования в Authorization header
Authorization: ClientId, ApiKey

// Конкретный пример:
Authorization: qdaiciDiyMaTjxMt, a1b2c3d4e5f6... (64 символа hex)

// В cURL:
curl -X GET "https://sandboxapi.g2a.com/v1/products" \\
  -H "Authorization: qdaiciDiyMaTjxMt, a1b2c3d4e5f6..." \\
  -H "Content-Type: application/json"

// В fetch API:
fetch('https://sandboxapi.g2a.com/v1/products', {
  headers: {
    'Authorization': 'qdaiciDiyMaTjxMt, a1b2c3d4e5f6...',
    'Content-Type': 'application/json'
  }
})`;

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
          <FiKey color={theme.colors.primary} size={28} />
          Настройка переменных окружения G2A
        </h1>
        <p style={{ color: theme.colors.textSecondary }}>
          Пошаговое руководство по настройке переменных окружения для работы с G2A API
        </p>
      </div>

      {/* Formula Section */}
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
        <button
          onClick={() => toggleSection('formula')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'none',
            border: 'none',
            color: theme.colors.text,
            cursor: 'pointer',
            padding: 0,
            marginBottom: expandedSections.formula ? '20px' : 0,
          }}
        >
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <FiCode color={theme.colors.primary} size={20} />
            Формула генерации API ключа
          </h2>
          {expandedSections.formula ? (
            <FiChevronDown size={20} />
          ) : (
            <FiChevronRight size={20} />
          )}
        </button>

        {expandedSections.formula && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div style={{
              backgroundColor: theme.colors.background,
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '16px',
            }}>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '18px',
                color: theme.colors.primary,
                textAlign: 'center',
                marginBottom: '16px',
                fontWeight: '600',
              }}>
                apiKey = SHA256(ClientId + Email + ClientSecret)
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginTop: '20px',
              }}>
                <div style={{
                  backgroundColor: theme.colors.surface,
                  padding: '16px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.colors.border}`,
                }}>
                  <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>
                    ClientId
                  </div>
                  <div style={{ color: theme.colors.text, fontSize: '14px', fontFamily: 'monospace' }}>
                    qdaiciDiyMaTjxMt
                  </div>
                </div>
                <div style={{
                  backgroundColor: theme.colors.surface,
                  padding: '16px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.colors.border}`,
                }}>
                  <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>
                    Email
                  </div>
                  <div style={{ color: theme.colors.text, fontSize: '14px', fontFamily: 'monospace' }}>
                    sandboxapitest@g2a.com
                  </div>
                </div>
                <div style={{
                  backgroundColor: theme.colors.surface,
                  padding: '16px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.colors.border}`,
                }}>
                  <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>
                    ClientSecret
                  </div>
                  <div style={{ color: theme.colors.text, fontSize: '14px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    b0d293f6-e1d2-4629-8264-fd63b5af3207...
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: `${theme.colors.info}15`,
              border: `1px solid ${theme.colors.info}40`,
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              gap: '12px',
            }}>
              <FiInfo color={theme.colors.info} size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ color: theme.colors.text, fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                  Важно
                </div>
                <div style={{ color: theme.colors.textSecondary, fontSize: '13px', lineHeight: '1.6' }}>
                  API ключ генерируется путем конкатенации ClientId, Email и ClientSecret, 
                  затем применяется SHA256 хеширование. Результат - 64-символьная hex строка.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Environment Variables Section */}
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
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600',
          color: theme.colors.text,
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <FiKey color={theme.colors.primary} size={20} />
          Необходимые переменные окружения
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {envVars.map((envVar, index) => (
            <motion.div
              key={envVar.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              style={{
                backgroundColor: theme.colors.background,
                borderRadius: '12px',
                padding: '20px',
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <code style={{
                      color: theme.colors.primary,
                      fontSize: '16px',
                      fontWeight: '600',
                      fontFamily: 'monospace',
                    }}>
                      {envVar.name}
                    </code>
                    {envVar.required && (
                      <span style={{
                        backgroundColor: theme.colors.error,
                        color: '#fff',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                      }}>
                        ОБЯЗАТЕЛЬНО
                      </span>
                    )}
                  </div>
                  <p style={{ color: theme.colors.textSecondary, fontSize: '14px', marginBottom: '8px' }}>
                    {envVar.description}
                  </p>
                  {envVar.note && (
                    <div style={{
                      backgroundColor: `${theme.colors.warning}15`,
                      border: `1px solid ${theme.colors.warning}40`,
                      borderRadius: '6px',
                      padding: '8px 12px',
                      marginTop: '8px',
                    }}>
                      <div style={{ color: theme.colors.warning, fontSize: '12px' }}>
                        <FiAlertCircle size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                        {envVar.note}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div style={{
                backgroundColor: theme.colors.surface,
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '12px',
              }}>
                <code style={{
                  color: theme.colors.text,
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                }}>
                  {envVar.example}
                </code>
                <button
                  onClick={() => copyToClipboard(envVar.example, index)}
                  style={{
                    backgroundColor: theme.colors.surfaceLight,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: '6px',
                    padding: '6px 12px',
                    color: theme.colors.text,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    marginLeft: '12px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.primary;
                    e.currentTarget.style.color = theme.colors.background;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.surfaceLight;
                    e.currentTarget.style.color = theme.colors.text;
                  }}
                >
                  {copiedIndex === index ? (
                    <>
                      <FiCheck size={14} />
                      Скопировано
                    </>
                  ) : (
                    <>
                      <FiCopy size={14} />
                      Копировать
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* PHP Example Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: '16px',
          padding: '24px',
          border: `1px solid ${theme.colors.border}`,
          marginBottom: '24px',
        }}
      >
        <button
          onClick={() => toggleSection('php')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'none',
            border: 'none',
            color: theme.colors.text,
            cursor: 'pointer',
            padding: 0,
            marginBottom: expandedSections.php ? '20px' : 0,
          }}
        >
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <FiCode color={theme.colors.primary} size={20} />
            Пример на PHP
          </h2>
          {expandedSections.php ? (
            <FiChevronDown size={20} />
          ) : (
            <FiChevronRight size={20} />
          )}
        </button>

        {expandedSections.php && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div style={{
              position: 'relative',
              backgroundColor: theme.colors.background,
              borderRadius: '12px',
              padding: '20px',
              overflow: 'auto',
            }}>
              <button
                onClick={() => copyToClipboard(phpExample, 100)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: theme.colors.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  zIndex: 10,
                }}
              >
                {copiedIndex === 100 ? (
                  <>
                    <FiCheck size={14} />
                    Скопировано
                  </>
                ) : (
                  <>
                    <FiCopy size={14} />
                    Копировать
                  </>
                )}
              </button>
              <pre style={{
                color: theme.colors.text,
                fontSize: '13px',
                fontFamily: 'monospace',
                lineHeight: '1.6',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                <code>{phpExample}</code>
              </pre>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* TypeScript Example Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: '16px',
          padding: '24px',
          border: `1px solid ${theme.colors.border}`,
          marginBottom: '24px',
        }}
      >
        <button
          onClick={() => toggleSection('typescript')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'none',
            border: 'none',
            color: theme.colors.text,
            cursor: 'pointer',
            padding: 0,
            marginBottom: expandedSections.typescript ? '20px' : 0,
          }}
        >
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <FiCode color={theme.colors.primary} size={20} />
            Пример на TypeScript/JavaScript
          </h2>
          {expandedSections.typescript ? (
            <FiChevronDown size={20} />
          ) : (
            <FiChevronRight size={20} />
          )}
        </button>

        {expandedSections.typescript && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div style={{
              position: 'relative',
              backgroundColor: theme.colors.background,
              borderRadius: '12px',
              padding: '20px',
              overflow: 'auto',
            }}>
              <button
                onClick={() => copyToClipboard(typescriptExample, 101)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: theme.colors.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  zIndex: 10,
                }}
              >
                {copiedIndex === 101 ? (
                  <>
                    <FiCheck size={14} />
                    Скопировано
                  </>
                ) : (
                  <>
                    <FiCopy size={14} />
                    Копировать
                  </>
                )}
              </button>
              <pre style={{
                color: theme.colors.text,
                fontSize: '13px',
                fontFamily: 'monospace',
                lineHeight: '1.6',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                <code>{typescriptExample}</code>
              </pre>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Usage Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: '16px',
          padding: '24px',
          border: `1px solid ${theme.colors.border}`,
          marginBottom: '24px',
        }}
      >
        <button
          onClick={() => toggleSection('usage')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'none',
            border: 'none',
            color: theme.colors.text,
            cursor: 'pointer',
            padding: 0,
            marginBottom: expandedSections.usage ? '20px' : 0,
          }}
        >
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <FiGlobe color={theme.colors.primary} size={20} />
            Использование в HTTP запросах
          </h2>
          {expandedSections.usage ? (
            <FiChevronDown size={20} />
          ) : (
            <FiChevronRight size={20} />
          )}
        </button>

        {expandedSections.usage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div style={{
              position: 'relative',
              backgroundColor: theme.colors.background,
              borderRadius: '12px',
              padding: '20px',
              overflow: 'auto',
            }}>
              <button
                onClick={() => copyToClipboard(usageExample, 102)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: theme.colors.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  zIndex: 10,
                }}
              >
                {copiedIndex === 102 ? (
                  <>
                    <FiCheck size={14} />
                    Скопировано
                  </>
                ) : (
                  <>
                    <FiCopy size={14} />
                    Копировать
                  </>
                )}
              </button>
              <pre style={{
                color: theme.colors.text,
                fontSize: '13px',
                fontFamily: 'monospace',
                lineHeight: '1.6',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                <code>{usageExample}</code>
              </pre>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Summary Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: '16px',
          padding: '24px',
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600',
          color: theme.colors.text,
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <FiInfo color={theme.colors.info} size={20} />
          Краткая инструкция
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
        }}>
          <div style={{
            backgroundColor: theme.colors.background,
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${theme.colors.border}`,
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: `${theme.colors.primary}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}>
              <span style={{ color: theme.colors.primary, fontSize: '20px', fontWeight: '700' }}>1</span>
            </div>
            <h3 style={{ color: theme.colors.text, fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              Получите учетные данные
            </h3>
            <p style={{ color: theme.colors.textSecondary, fontSize: '14px', lineHeight: '1.6' }}>
              Войдите в G2A Seller Panel и получите Client ID и Client Secret
            </p>
          </div>

          <div style={{
            backgroundColor: theme.colors.background,
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${theme.colors.border}`,
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: `${theme.colors.primary}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}>
              <span style={{ color: theme.colors.primary, fontSize: '20px', fontWeight: '700' }}>2</span>
            </div>
            <h3 style={{ color: theme.colors.text, fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              Установите переменные
            </h3>
            <p style={{ color: theme.colors.textSecondary, fontSize: '14px', lineHeight: '1.6' }}>
              Установите G2A_API_KEY, G2A_API_HASH, G2A_EMAIL и другие переменные окружения
            </p>
          </div>

          <div style={{
            backgroundColor: theme.colors.background,
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${theme.colors.border}`,
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: `${theme.colors.primary}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}>
              <span style={{ color: theme.colors.primary, fontSize: '20px', fontWeight: '700' }}>3</span>
            </div>
            <h3 style={{ color: theme.colors.text, fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              Сгенерируйте API ключ
            </h3>
            <p style={{ color: theme.colors.textSecondary, fontSize: '14px', lineHeight: '1.6' }}>
              Используйте формулу SHA256(ClientId + Email + ClientSecret) для генерации ключа
            </p>
          </div>

          <div style={{
            backgroundColor: theme.colors.background,
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${theme.colors.border}`,
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: `${theme.colors.primary}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}>
              <span style={{ color: theme.colors.primary, fontSize: '20px', fontWeight: '700' }}>4</span>
            </div>
            <h3 style={{ color: theme.colors.text, fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              Используйте в запросах
            </h3>
            <p style={{ color: theme.colors.textSecondary, fontSize: '14px', lineHeight: '1.6' }}>
              Добавьте заголовок Authorization: "ClientId, ApiKey" в HTTP запросы
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default G2AEnvSetupPage;
