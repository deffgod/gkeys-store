import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiClock,
  FiSearch,
  FiXCircle,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiRefreshCw,
  FiAlertCircle
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

const G2AReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Array<{
    reservationId: string;
    orderId: string;
    productId: string;
    quantity: number;
    status: string;
    expiresAt: string;
    createdAt: string;
    order?: {
      id: string;
      status: string;
      total: number;
      user: {
        id: string;
        email: string;
        nickname: string;
      };
    };
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [status, setStatus] = useState('');

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const result = await adminApi.getG2AReservations({
        orderId: orderId || undefined,
        status: status || undefined,
        page,
        pageSize: 20,
      });
      setReservations(result.reservations);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (err) {
      console.error('Failed to fetch reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, orderId, status]);

  const handleCancel = async (reservationId: string) => {
    if (!confirm('Are you sure you want to cancel this reservation? Note: G2A API may not support direct cancellation.')) return;
    try {
      await adminApi.cancelG2AReservation(reservationId);
      await fetchReservations();
    } catch (err) {
      console.error('Failed to cancel reservation:', err);
      alert('Failed to cancel reservation. G2A API may not support direct cancellation.');
    }
  };

  const clearFilters = () => {
    setOrderId('');
    setStatus('');
    setPage(1);
  };

  const hasActiveFilters = orderId || status;

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'confirmed':
        return theme.colors.success;
      case 'pending':
        return theme.colors.warning;
      case 'expired':
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

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
          G2A Reservations
        </h1>
        <p style={{ 
          margin: 0, 
          color: theme.colors.textSecondary, 
          fontSize: '16px',
        }}>
          View and manage G2A order reservations
        </p>
      </div>

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <FiSearch style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: theme.colors.textSecondary,
              }} />
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Search by Order ID..."
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 40px',
                  backgroundColor: theme.colors.surfaceLight,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: '8px',
                  color: theme.colors.text,
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>
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
            <button
              type="button"
              onClick={fetchReservations}
              disabled={loading}
              style={{
                padding: '10px 16px',
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
                padding: '20px',
                backgroundColor: theme.colors.surfaceLight,
                borderRadius: '12px',
                border: `1px solid ${theme.colors.border}`,
              }}>
                <div>
                  <label htmlFor="filter-status-reservation" style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>
                    Status
                  </label>
                  <select
                    id="filter-status-reservation"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{
                      width: '100%',
                      maxWidth: '300px',
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
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
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
        ) : reservations.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            color: theme.colors.textSecondary,
          }}>
            <FiClock style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
            <div style={{ fontSize: '16px' }}>No reservations found</div>
            <div style={{ fontSize: '14px', marginTop: '8px', color: theme.colors.textSecondary }}>
              Note: Reservations are fetched from G2A API and may not be stored locally
            </div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: theme.colors.surfaceLight }}>
                    <th style={{ textAlign: 'left', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                      Reservation ID
                    </th>
                    <th style={{ textAlign: 'left', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                      Order
                    </th>
                    <th style={{ textAlign: 'left', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                      Product ID
                    </th>
                    <th style={{ textAlign: 'center', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                      Quantity
                    </th>
                    <th style={{ textAlign: 'center', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                      Status
                    </th>
                    <th style={{ textAlign: 'left', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                      Expires At
                    </th>
                    <th style={{ textAlign: 'right', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((reservation) => (
                    <motion.tr
                      key={reservation.reservationId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ borderBottom: `1px solid ${theme.colors.border}` }}
                    >
                      <td style={{ padding: '16px' }}>
                        <div style={{ color: theme.colors.text, fontSize: '14px', fontWeight: '500' }}>
                          {reservation.reservationId}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        {reservation.order ? (
                          <div>
                            <div style={{ color: theme.colors.text, fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                              {reservation.order.user.nickname || reservation.order.user.email}
                            </div>
                            <div style={{ color: theme.colors.textSecondary, fontSize: '12px' }}>
                              {reservation.orderId}
                            </div>
                          </div>
                        ) : (
                          <div style={{ color: theme.colors.text, fontSize: '14px' }}>
                            {reservation.orderId}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px', color: theme.colors.text, fontSize: '14px' }}>
                        {reservation.productId}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', color: theme.colors.text, fontSize: '14px' }}>
                        {reservation.quantity}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          padding: '4px 12px',
                          borderRadius: '6px',
                          backgroundColor: `${getStatusColor(reservation.status)}20`,
                          color: getStatusColor(reservation.status),
                          fontSize: '12px',
                          fontWeight: '600',
                        }}>
                          {reservation.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: theme.colors.textSecondary, fontSize: '13px' }}>
                        {new Date(reservation.expiresAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        {reservation.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleCancel(reservation.reservationId)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: `1px solid ${theme.colors.error}`,
                              backgroundColor: 'transparent',
                              color: theme.colors.error,
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '500',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <FiXCircle />
                            Cancel
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

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
                  Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} reservations
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: '16px',
          padding: '24px',
          border: `1px solid ${theme.colors.border}`,
          marginTop: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'start', gap: '12px', padding: '16px', backgroundColor: `${theme.colors.warning}20`, borderRadius: '8px', border: `1px solid ${theme.colors.warning}` }}>
          <FiAlertCircle style={{ color: theme.colors.warning, marginTop: '2px', flexShrink: 0 }} />
          <div>
            <div style={{ color: theme.colors.warning, fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
              Note about Reservations
            </div>
            <div style={{ color: theme.colors.textSecondary, fontSize: '13px', lineHeight: '1.6' }}>
              G2A API does not provide a direct endpoint to list all reservations. Reservations are typically managed per-order. 
              If you need to view reservations, they should be tracked through orders with G2A externalOrderId. 
              Reservation cancellation may not be supported by G2A API - reservations typically expire automatically after their expiration time.
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default G2AReservationsPage;

