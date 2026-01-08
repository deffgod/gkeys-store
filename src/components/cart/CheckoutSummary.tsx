import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api';
import type { CartResponse } from '../../services/cartApi';

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
    success: '#00C8C2',
    error: '#FF4444',
  },
};

const Icons = {
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <title>Check</title>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Wallet: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <title>Wallet</title>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
    </svg>
  ),
  CreditCard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <title>Credit Card</title>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  Tag: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <title>Tag</title>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
};

interface CheckoutSummaryProps {
  cart: CartResponse;
  promoCode?: string;
  onPromoCodeChange?: (code: string) => void;
  onPromoApply?: (code: string) => Promise<{ success: boolean; discount: number }>;
  onCreateOrder?: (promoCode?: string) => Promise<void>;
}

export const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({
  cart,
  promoCode: initialPromoCode = '',
  onPromoCodeChange,
  onPromoApply,
  onCreateOrder,
}) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [promoCode, setPromoCode] = useState(initialPromoCode);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'balance' | 'card'>('balance');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user balance
  useEffect(() => {
    const loadBalance = async () => {
      if (!isAuthenticated || !user) {
        setLoadingBalance(false);
        return;
      }
      try {
        const response = await apiClient.get<{ success: boolean; data: { balance: number; currency: string } }>(
          '/api/user/balance'
        );
        setUserBalance(response.data.balance);
      } catch (err) {
        console.error('Failed to load balance:', err);
        setUserBalance(0);
      } finally {
        setLoadingBalance(false);
      }
    };
    loadBalance();
  }, [isAuthenticated, user]);

  const subtotal = cart.total;
  const discount = promoApplied ? (subtotal * promoDiscount / 100) : 0;
  const total = subtotal - discount;
  const canPayWithBalance = userBalance !== null && userBalance >= total;

  const handlePromoApply = async () => {
    if (!promoCode.trim()) return;
    
    if (onPromoApply) {
      try {
        const result = await onPromoApply(promoCode);
        if (result.success) {
          setPromoApplied(true);
          setPromoDiscount(result.discount);
        }
      } catch (err) {
        console.error('Failed to apply promo:', err);
      }
    }
  };

  const handleCheckout = async () => {
    if (paymentMethod === 'balance' && !canPayWithBalance) {
      // Redirect to balance page
      navigate('/profile/balance');
      return;
    }

    if (!onCreateOrder) return;

    setProcessing(true);
    setError(null);
    try {
      await onCreateOrder(promoApplied ? promoCode : undefined);
      // Navigation is handled by onCreateOrder in CheckoutPage
    } catch (err) {
      console.error('Failed to create order:', err);
      // Extract user-friendly error message
      let errorMessage = 'Failed to create order. Please try again.';
      if (err instanceof Error) {
        errorMessage = err.message;
        // Handle specific error cases
        if (err.message.includes('Insufficient balance')) {
          errorMessage = 'Insufficient balance. Please top up your account.';
        } else if (err.message.includes('out of stock')) {
          errorMessage = 'One or more games are out of stock. Please remove them from your cart.';
        } else if (err.message.includes('not found')) {
          errorMessage = 'One or more games are no longer available. Please refresh your cart.';
        } else if (err.message.includes('Invalid promo code')) {
          errorMessage = 'Invalid promo code. Please check and try again.';
        }
      }
      setError(errorMessage);
      
      // Show error toast
      toast.error('Failed to create order', {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      style={{
        background: theme.colors.surface,
        borderRadius: '12px',
        padding: '24px',
        position: 'sticky',
        top: '100px',
        border: `1px solid ${theme.colors.border}`,
      }}
      className="order-summary"
    >
      <h2
        style={{
          fontSize: '18px',
          fontWeight: '700',
          marginBottom: '20px',
          color: theme.colors.text,
        }}
      >
        Order Summary
      </h2>

      {/* Promo Code */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Icons.Tag />
          <input
            type="text"
            placeholder="Promo code"
            value={promoCode}
            onChange={(e) => {
              setPromoCode(e.target.value);
              onPromoCodeChange?.(e.target.value);
            }}
            style={{
              width: '100%',
              background: theme.colors.surfaceLight,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '8px',
              padding: '12px 16px 12px 40px',
              color: theme.colors.text,
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>
        <button
          type="button"
          onClick={handlePromoApply}
          disabled={!promoCode.trim() || promoApplied}
          style={{
            background: theme.colors.surfaceLight,
            border: 'none',
            borderRadius: '8px',
            padding: '12px 16px',
            color: theme.colors.text,
            cursor: promoCode.trim() && !promoApplied ? 'pointer' : 'not-allowed',
            fontWeight: '500',
            opacity: promoCode.trim() && !promoApplied ? 1 : 0.5,
          }}
        >
          Apply
        </button>
      </div>

      {promoApplied && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: theme.colors.success,
            fontSize: '13px',
            marginBottom: '16px',
          }}
        >
          <Icons.Check />
          Promo code applied (-{promoDiscount}%)
        </div>
      )}

      {/* Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
        <span style={{ color: theme.colors.textSecondary }}>Subtotal</span>
        <span style={{ fontWeight: '500', color: theme.colors.text }}>€{subtotal.toFixed(2)}</span>
      </div>
      {promoApplied && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
          <span style={{ color: theme.colors.textSecondary }}>Promo discount</span>
          <span style={{ fontWeight: '500', color: theme.colors.success }}>-€{discount.toFixed(2)}</span>
        </div>
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          paddingTop: '16px',
          borderTop: `1px solid ${theme.colors.border}`,
          marginTop: '16px',
          marginBottom: '24px',
        }}
      >
        <span style={{ fontSize: '16px', fontWeight: '600', color: theme.colors.text }}>Total</span>
        <span style={{ fontSize: '24px', fontWeight: '700', color: theme.colors.primary }}>
          €{total.toFixed(2)}
        </span>
      </div>

      {/* Payment Method */}
      {isAuthenticated && (
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: theme.colors.text }}>
            Payment Method
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              background: paymentMethod === 'balance' ? theme.colors.surfaceLight : 'transparent',
              border: `1px solid ${paymentMethod === 'balance' ? theme.colors.primary : theme.colors.border}`,
              borderRadius: '10px',
              cursor: 'pointer',
              marginBottom: '8px',
              transition: 'all 0.2s',
            }}
            onClick={() => setPaymentMethod('balance')}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: `2px solid ${paymentMethod === 'balance' ? theme.colors.primary : theme.colors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {paymentMethod === 'balance' && (
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: theme.colors.primary,
                  }}
                />
              )}
            </div>
            <Icons.Wallet />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: '500', color: theme.colors.text }}>Account Balance</p>
              <p style={{ fontSize: '12px', color: theme.colors.textMuted }}>
                {loadingBalance ? 'Loading...' : `€${userBalance?.toFixed(2) || '0.00'} available`}
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              background: paymentMethod === 'card' ? theme.colors.surfaceLight : 'transparent',
              border: `1px solid ${paymentMethod === 'card' ? theme.colors.primary : theme.colors.border}`,
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onClick={() => setPaymentMethod('card')}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: `2px solid ${paymentMethod === 'card' ? theme.colors.primary : theme.colors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {paymentMethod === 'card' && (
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: theme.colors.primary,
                  }}
                />
              )}
            </div>
            <Icons.CreditCard />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: '500', color: theme.colors.text }}>Credit/Debit Card</p>
              <p style={{ fontSize: '12px', color: theme.colors.textMuted }}>Visa, Mastercard, etc.</p>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleCheckout}
        disabled={processing || (paymentMethod === 'balance' && !canPayWithBalance)}
        type="button"
        style={{
          width: '100%',
          background: paymentMethod === 'balance' && !canPayWithBalance
            ? theme.colors.surfaceLight
            : theme.colors.primary,
          color: paymentMethod === 'balance' && !canPayWithBalance ? theme.colors.textMuted : '#000',
          border: 'none',
          padding: '16px',
          borderRadius: '10px',
          fontSize: '16px',
          fontWeight: '700',
          cursor: processing || (paymentMethod === 'balance' && !canPayWithBalance)
            ? 'not-allowed'
            : 'pointer',
          opacity: processing ? 0.7 : 1,
        }}
      >
        {processing
          ? 'Processing...'
          : paymentMethod === 'balance'
          ? canPayWithBalance
            ? 'Pay with Balance'
            : 'Insufficient Balance'
          : 'Proceed to Payment'}
      </motion.button>

      {paymentMethod === 'balance' && !canPayWithBalance && userBalance !== null && (
        <p
          style={{
            color: theme.colors.error,
            fontSize: '13px',
            textAlign: 'center',
            marginTop: '12px',
          }}
        >
          Insufficient balance. Please{' '}
          <a
            href="/profile/balance"
            style={{ color: theme.colors.primary, textDecoration: 'underline' }}
          >
            top up
          </a>{' '}
          or use another payment method.
        </p>
      )}

      {/* Error Message */}
      {error && (
        <div
          style={{
            background: '#FF444420',
            border: '1px solid #FF4444',
            borderRadius: '8px',
            padding: '12px 16px',
            marginTop: '16px',
            color: '#FF4444',
            fontSize: '13px',
            textAlign: 'center',
          }}
        >
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};
