import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProfileLayout from '../components/profile/ProfileLayout';
import { paymentApi } from '../services/paymentApi';
import apiClient from '../services/api';

const theme = {
  colors: {
    primary: '#00C8C2',
    background: '#0D0D0D',
    surface: '#1A1A1A',
    surfaceLight: '#2A2A2A',
    text: '#FFFFFF',
    textSecondary: '#999999',
    textMuted: '#666666',
    border: '#333333',
  },
};

const paymentMethods = [
  { id: 'trustly', label: 'Trustly', icon: null },
  { id: 'card', label: 'Visa, Mastercard', icon: null },
  { id: 'klarna', label: 'Klarna', icon: null },
  { id: 'apple', label: 'Apple Pay', icon: null },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// Credit Card Icon
const CreditCardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <title>Credit Card</title>
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

export default function ProfileBalancePage() {
  const [promoCode, setPromoCode] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('trustly');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [error, setError] = useState(null);

  // Load current balance
  useEffect(() => {
    const loadBalance = async () => {
      try {
        setLoadingBalance(true);
        const response = await apiClient.get('/api/user/balance');
        const balance = response.success ? response.data.balance : (response.data?.balance || 0);
        setCurrentBalance(balance);
      } catch (err) {
        console.error('Failed to load balance:', err);
        setError(err instanceof Error ? err.message : 'Failed to load balance');
        setCurrentBalance(0);
      } finally {
        setLoadingBalance(false);
      }
    };
    loadBalance();
  }, []);

  const handlePromoSubmit = async () => {
    if (!promoCode.trim()) return;
    // Handle promo code submission
    console.log('Applying promo code:', promoCode);
  };

  const handlePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const intent = await paymentApi.createBalanceTopUp({
        amount: parseFloat(amount),
        currency: 'EUR',
        paymentMethod: selectedPaymentMethod,
        promoCode: promoCode.trim() || undefined,
      });
      
      // Redirect to payment gateway
      if (intent.redirectUrl) {
        window.location.href = intent.redirectUrl;
      } else {
        setError('Payment gateway URL not available');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Failed to create payment intent:', err);
      setError(err instanceof Error ? err.message : 'Failed to create payment');
      setIsSubmitting(false);
    }
  };

  return (
    <ProfileLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          maxWidth: '500px',
          margin: '0 auto',
        }}
      >
        {/* Balance Card */}
        <motion.div
          variants={itemVariants}
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: '16px',
            padding: '24px',
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          {/* Balance Info Section */}
          <div style={{ marginBottom: '24px' }}>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: theme.colors.text,
                margin: '0 0 16px 0',
              }}
            >
              Your Balance Info
            </h2>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: `1px solid ${theme.colors.border}`,
              }}
            >
              <span style={{ color: theme.colors.textSecondary, fontSize: '14px' }}>
                Current balance
              </span>
              <span
                style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: theme.colors.text,
                }}
              >
                {loadingBalance ? 'Loading...' : currentBalance !== null ? `${currentBalance.toFixed(2)}€` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Promo Code Section */}
          <div style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: '500',
                color: theme.colors.text,
                margin: '0 0 12px 0',
              }}
            >
              Do you have a promo code?
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Your promo code"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  backgroundColor: theme.colors.surfaceLight,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: '8px',
                  color: theme.colors.text,
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePromoSubmit}
                style={{
                  padding: '12px 24px',
                  backgroundColor: theme.colors.surfaceLight,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: '8px',
                  color: theme.colors.textSecondary,
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Use
              </motion.button>
            </div>
          </div>

          {/* Top Up Section */}
          <div>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: '500',
                color: theme.colors.text,
                margin: '0 0 12px 0',
              }}
            >
              Top up your balance
            </h3>
            {/* Amount Input */}
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="1"
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: theme.colors.surfaceLight,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '8px',
                color: theme.colors.text,
                fontSize: '14px',
                outline: 'none',
                marginBottom: '16px',
                boxSizing: 'border-box',
              }}
            />
            {/* Payment Methods */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '24px',
              }}
            >
              {paymentMethods.map((method) => (
                <label
                  key={method.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 0',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: `2px solid ${
                        selectedPaymentMethod === method.id
                          ? theme.colors.primary
                          : theme.colors.border
                      }`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {selectedPaymentMethod === method.id && (
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: theme.colors.primary,
                        }}
                      />
                    )}
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={selectedPaymentMethod === method.id}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    style={{ display: 'none' }}
                  />
                  <span
                    style={{
                      fontSize: '14px',
                      color: theme.colors.text,
                    }}
                  >
                    {method.label}
                  </span>
                </label>
              ))}
            </div>
            {/* Error Message */}
            {error && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: 'rgba(255, 68, 68, 0.1)',
                  border: `1px solid #FF4444`,
                  borderRadius: '8px',
                  color: '#FF4444',
                  fontSize: '14px',
                  marginBottom: '16px',
                }}
              >
                {error}
              </div>
            )}

            {/* Proceed to Pay Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePayment}
              disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
              type="button"
              style={{
                width: '100%',
                padding: '14px 24px',
                backgroundColor: theme.colors.primary,
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isSubmitting || !amount || parseFloat(amount) <= 0 ? 'not-allowed' : 'pointer',
                opacity: isSubmitting || !amount || parseFloat(amount) <= 0 ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <CreditCardIcon />
              {isSubmitting ? 'Processing...' : 'Proceed to pay'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </ProfileLayout>
  );
}
