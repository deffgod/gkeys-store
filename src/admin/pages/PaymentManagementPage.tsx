import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiCreditCard,
  FiDollarSign,
  FiFilter,
  FiX,
  FiRefreshCw,
  FiCheck,
  FiXCircle,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle
} from 'react-icons/fi';
import { adminApi } from '../services/adminApi';
import type { TransactionResult } from '../services/adminApi';

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

interface PaymentMethod {
  id: string;
  name: string;
  type: 'stripe' | 'paypal' | 'mollie' | 'terminal';
  icon?: string;
  available: boolean;
  order: number;
  config?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface RefundModalProps {
  transaction: TransactionResult['transactions'][0] | null;
  onClose: () => void;
  onConfirm: (amount?: number, reason?: string) => Promise<void>;
}

const RefundModal: React.FC<RefundModalProps> = ({ transaction, onClose, onConfirm }) => {
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  if (!transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const refundAmount = amount ? parseFloat(amount) : undefined;
      await onConfirm(refundAmount, reason || undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process refund');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: '16px',
            padding: '32px',
            width: '90%',
            maxWidth: '500px',
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, color: theme.colors.text, fontSize: '24px', fontWeight: '600' }}>
              Process Refund
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              style={{
                background: 'none',
                border: 'none',
                color: theme.colors.textSecondary,
                cursor: 'pointer',
                fontSize: '24px',
                padding: '4px',
              }}
            >
              <FiX />
            </button>
          </div>

          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: theme.colors.surfaceLight, borderRadius: '8px' }}>
            <div style={{ color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '4px' }}>Transaction</div>
            <div style={{ color: theme.colors.text, fontSize: '16px', fontWeight: '500' }}>
              {transaction.user.email} - {transaction.type}
            </div>
            <div style={{ color: theme.colors.textSecondary, fontSize: '14px', marginTop: '4px' }}>
              Amount: {transaction.amount} {transaction.currency}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="refund-amount" style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>
                Refund Amount (optional - leave empty for full refund)
              </label>
              <input
                id="refund-amount"
                type="number"
                step="0.01"
                min="0"
                max={Math.abs(transaction.amount)}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Max: ${Math.abs(transaction.amount)} ${transaction.currency}`}
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
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="refund-reason" style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>
                Reason (optional)
              </label>
              <textarea
                id="refund-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter refund reason..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: theme.colors.surfaceLight,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: '8px',
                  color: theme.colors.text,
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '12px',
                backgroundColor: `${theme.colors.error}20`,
                border: `1px solid ${theme.colors.error}`,
                borderRadius: '8px',
                color: theme.colors.error,
                fontSize: '14px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <FiAlertCircle />
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: 'transparent',
                  color: theme.colors.text,
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: theme.colors.error,
                  color: '#ffffff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  fontSize: '14px',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'Processing...' : 'Process Refund'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'COMPLETED':
      return theme.colors.success;
    case 'PENDING':
    case 'PROCESSING':
      return theme.colors.warning;
    case 'FAILED':
    case 'CANCELLED':
      return theme.colors.error;
    default:
      return theme.colors.textSecondary;
  }
};

const getTypeColor = (type: string): string => {
  switch (type) {
    case 'TOP_UP':
      return theme.colors.success;
    case 'PURCHASE':
      return theme.colors.info;
    case 'REFUND':
      return theme.colors.error;
    default:
      return theme.colors.textSecondary;
  }
};

const PaymentManagementPage: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<TransactionResult['transactions']>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [refundModal, setRefundModal] = useState<TransactionResult['transactions'][0] | null>(null);
  
  // Filters
  const [method, setMethod] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const methods = await adminApi.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (err) {
      console.error('Failed to fetch payment methods:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoadingTransactions(true);
      const result = await adminApi.getPaymentTransactions({
        method: method || undefined,
        status: status || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        pageSize: 20,
      });
      setTransactions(result.transactions);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, method, status, startDate, endDate]);

  const handleRefund = async (transactionId: string, amount?: number, reason?: string) => {
    try {
      await adminApi.refundTransaction(transactionId, amount, reason);
      await fetchTransactions();
      setRefundModal(null);
    } catch (err) {
      throw err;
    }
  };

  const clearFilters = () => {
    setMethod('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasActiveFilters = method || status || startDate || endDate;

  // Calculate totals
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  const completedCount = transactions.filter(t => t.status === 'COMPLETED').length;

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
          Payment Management
        </h1>
        <p style={{ 
          margin: 0, 
          color: theme.colors.textSecondary, 
          fontSize: '16px',
        }}>
          Manage payment methods and process refunds
        </p>
      </div>

      {/* Payment Methods Section */}
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
            Payment Methods
          </h2>
          <button
            type="button"
            onClick={fetchPaymentMethods}
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
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
            {paymentMethods.map((method) => (
              <motion.div
                key={method.id}
                whileHover={{ scale: 1.02 }}
                style={{
                  backgroundColor: theme.colors.surfaceLight,
                  borderRadius: '12px',
                  padding: '20px',
                  border: `1px solid ${theme.colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: method.available ? `${theme.colors.success}20` : `${theme.colors.error}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                }}>
                  <FiCreditCard style={{ color: method.available ? theme.colors.success : theme.colors.error }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: theme.colors.text, fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                    {method.name}
                  </div>
                  <div style={{ color: theme.colors.textSecondary, fontSize: '13px' }}>
                    {method.type.toUpperCase()}
                  </div>
                  <div style={{
                    marginTop: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    backgroundColor: method.available ? `${theme.colors.success}20` : `${theme.colors.error}20`,
                    color: method.available ? theme.colors.success : theme.colors.error,
                    fontSize: '12px',
                    fontWeight: '500',
                  }}>
                    {method.available ? <FiCheck /> : <FiXCircle />}
                    {method.available ? 'Available' : 'Unavailable'}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Transactions Section */}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <h2 style={{ margin: 0, color: theme.colors.text, fontSize: '20px', fontWeight: '600' }}>
            Payment Transactions
          </h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: showFilters ? theme.colors.primary : theme.colors.surfaceLight,
                color: showFilters ? '#ffffff' : theme.colors.text,
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '500',
              }}
            >
              <FiFilter />
              Filters
              {hasActiveFilters && (
                <span style={{
                  backgroundColor: showFilters ? 'rgba(255,255,255,0.2)' : theme.colors.primary,
                  color: '#ffffff',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '12px',
                  fontWeight: '600',
                }}>
                  {[method, status, startDate, endDate].filter(Boolean).length}
                </span>
              )}
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: 'transparent',
                  color: theme.colors.textSecondary,
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden', marginBottom: '20px' }}
            >
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                padding: '20px',
                backgroundColor: theme.colors.surfaceLight,
                borderRadius: '12px',
                border: `1px solid ${theme.colors.border}`,
              }}>
                <div>
                  <label htmlFor="filter-method" style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>
                    Payment Method
                  </label>
                  <select
                    id="filter-method"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: theme.colors.surface,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: '8px',
                      color: theme.colors.text,
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  >
                    <option value="">All Methods</option>
                    <option value="stripe">Stripe</option>
                    <option value="paypal">PayPal</option>
                    <option value="mollie">Mollie</option>
                    <option value="terminal">Terminal</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="filter-status" style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>
                    Status
                  </label>
                  <select
                    id="filter-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: theme.colors.surface,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: '8px',
                      color: theme.colors.text,
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  >
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="FAILED">Failed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="filter-start-date" style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>
                    Start Date
                  </label>
                  <input
                    id="filter-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: theme.colors.surface,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: '8px',
                      color: theme.colors.text,
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="filter-end-date" style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>
                    End Date
                  </label>
                  <input
                    id="filter-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: theme.colors.surface,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: '8px',
                      color: theme.colors.text,
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{
            backgroundColor: theme.colors.surfaceLight,
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${theme.colors.border}`,
          }}>
            <div style={{ color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>Total Transactions</div>
            <div style={{ color: theme.colors.text, fontSize: '24px', fontWeight: '700' }}>{total}</div>
          </div>
          <div style={{
            backgroundColor: theme.colors.surfaceLight,
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${theme.colors.border}`,
          }}>
            <div style={{ color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>Total Amount</div>
            <div style={{ color: theme.colors.text, fontSize: '24px', fontWeight: '700' }}>
              {totalAmount.toFixed(2)} EUR
            </div>
          </div>
          <div style={{
            backgroundColor: theme.colors.surfaceLight,
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${theme.colors.border}`,
          }}>
            <div style={{ color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>Completed</div>
            <div style={{ color: theme.colors.success, fontSize: '24px', fontWeight: '700' }}>{completedCount}</div>
          </div>
        </div>

        {loadingTransactions ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
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
        ) : transactions.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            color: theme.colors.textSecondary,
          }}>
            <FiDollarSign style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
            <div style={{ fontSize: '16px' }}>No transactions found</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: theme.colors.surfaceLight }}>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '16px', 
                      color: theme.colors.textSecondary,
                      fontSize: '13px',
                      fontWeight: '600',
                    }}>
                      User
                    </th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '16px', 
                      color: theme.colors.textSecondary,
                      fontSize: '13px',
                      fontWeight: '600',
                    }}>
                      Type
                    </th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '16px', 
                      color: theme.colors.textSecondary,
                      fontSize: '13px',
                      fontWeight: '600',
                    }}>
                      Method
                    </th>
                    <th style={{ 
                      textAlign: 'right', 
                      padding: '16px', 
                      color: theme.colors.textSecondary,
                      fontSize: '13px',
                      fontWeight: '600',
                    }}>
                      Amount
                    </th>
                    <th style={{ 
                      textAlign: 'center', 
                      padding: '16px', 
                      color: theme.colors.textSecondary,
                      fontSize: '13px',
                      fontWeight: '600',
                    }}>
                      Status
                    </th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '16px', 
                      color: theme.colors.textSecondary,
                      fontSize: '13px',
                      fontWeight: '600',
                    }}>
                      Date
                    </th>
                    <th style={{ 
                      textAlign: 'right', 
                      padding: '16px', 
                      color: theme.colors.textSecondary,
                      fontSize: '13px',
                      fontWeight: '600',
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <motion.tr
                      key={transaction.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        borderBottom: `1px solid ${theme.colors.border}`,
                      }}
                    >
                      <td style={{ padding: '16px' }}>
                        <div>
                          <div style={{ color: theme.colors.text, fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                            {transaction.user.nickname || transaction.user.email}
                          </div>
                          <div style={{ color: theme.colors.textSecondary, fontSize: '12px' }}>
                            {transaction.user.email}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 12px',
                          borderRadius: '6px',
                          backgroundColor: `${getTypeColor(transaction.type)}20`,
                          color: getTypeColor(transaction.type),
                          fontSize: '12px',
                          fontWeight: '600',
                        }}>
                          {transaction.type}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: theme.colors.text, fontSize: '14px' }}>
                        {transaction.method || 'N/A'}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ 
                          color: transaction.amount >= 0 ? theme.colors.success : theme.colors.error,
                          fontSize: '14px',
                          fontWeight: '600',
                        }}>
                          {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toFixed(2)} {transaction.currency}
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 12px',
                          borderRadius: '6px',
                          backgroundColor: `${getStatusColor(transaction.status)}20`,
                          color: getStatusColor(transaction.status),
                          fontSize: '12px',
                          fontWeight: '600',
                        }}>
                          {transaction.status === 'PENDING' && <FiClock />}
                          {transaction.status === 'COMPLETED' && <FiCheck />}
                          {transaction.status === 'FAILED' && <FiXCircle />}
                          {transaction.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: theme.colors.textSecondary, fontSize: '13px' }}>
                        {new Date(transaction.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        {transaction.type !== 'REFUND' && 
                         transaction.status === 'COMPLETED' && 
                         (transaction.type === 'TOP_UP' || transaction.type === 'PURCHASE') && (
                          <button
                            type="button"
                            onClick={() => setRefundModal(transaction)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: `1px solid ${theme.colors.error}`,
                              backgroundColor: 'transparent',
                              color: theme.colors.error,
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '500',
                            }}
                          >
                            Refund
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '24px',
                paddingTop: '24px',
                borderTop: `1px solid ${theme.colors.border}`,
              }}>
                <div style={{ color: theme.colors.textSecondary, fontSize: '14px' }}>
                  Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} transactions
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${theme.colors.border}`,
                      backgroundColor: page === 1 ? theme.colors.surfaceLight : theme.colors.surface,
                      color: page === 1 ? theme.colors.textSecondary : theme.colors.text,
                      cursor: page === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      opacity: page === 1 ? 0.5 : 1,
                    }}
                  >
                    <FiChevronLeft />
                  </button>
                  <div style={{ color: theme.colors.text, fontSize: '14px', padding: '0 12px' }}>
                    Page {page} of {totalPages}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${theme.colors.border}`,
                      backgroundColor: page === totalPages ? theme.colors.surfaceLight : theme.colors.surface,
                      color: page === totalPages ? theme.colors.textSecondary : theme.colors.text,
                      cursor: page === totalPages ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      opacity: page === totalPages ? 0.5 : 1,
                    }}
                  >
                    <FiChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Refund Modal */}
      <RefundModal
        transaction={refundModal}
        onClose={() => setRefundModal(null)}
        onConfirm={(amount, reason) => handleRefund(refundModal!.id, amount, reason)}
      />
    </div>
  );
};

export default PaymentManagementPage;

