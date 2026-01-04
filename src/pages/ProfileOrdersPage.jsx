import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import ProfileLayout from '../components/profile/ProfileLayout';
import { orderApi } from '../services/orderApi';

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

const StatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return { bg: 'rgba(0, 200, 194, 0.15)', text: theme.colors.primary };
      case 'PENDING':
        return { bg: 'rgba(255, 217, 61, 0.15)', text: '#FFD93D' };
      case 'PROCESSING':
        return { bg: 'rgba(255, 217, 61, 0.15)', text: '#FFD93D' };
      case 'CANCELLED':
      case 'FAILED':
        return { bg: 'rgba(255, 68, 68, 0.15)', text: '#FF4444' };
      default:
        return { bg: theme.colors.surfaceLight, text: theme.colors.textSecondary };
    }
  };

  const colors = getStatusColor(status);
  const displayStatus = status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() || 'Unknown';
  return (
    <span
      style={{
        padding: '4px 12px',
        backgroundColor: colors.bg,
        color: colors.text,
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '500',
      }}
    >
      {displayStatus}
    </span>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function ProfileOrdersPage() {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderCreated, setOrderCreated] = useState(false);

  useEffect(() => {
    // Check if we just created an order
    if (location.state?.orderCreated) {
      setOrderCreated(true);
      // Clear the state after showing message
      setTimeout(() => setOrderCreated(false), 5000);
    }
  }, [location.state]);

  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await orderApi.getOrders(1, 50); // Get up to 50 orders
        setOrders(result.orders);
      } catch (err) {
        console.error('Failed to load orders:', err);
        setError(err instanceof Error ? err.message : 'Failed to load orders');
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  if (isLoading) {
    return (
      <ProfileLayout>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid ' + theme.colors.border,
              borderTopColor: theme.colors.primary,
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>
            {`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout>
      {/* Success message for newly created order */}
      {orderCreated && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          style={{
            padding: '16px 24px',
            backgroundColor: 'rgba(0, 200, 194, 0.15)',
            border: `1px solid ${theme.colors.primary}`,
            borderRadius: '8px',
            color: theme.colors.primary,
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '24px',
          }}
        >
          ✅ Order created successfully! Your game keys will be sent to your email.
        </motion.div>
      )}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {error ? (
          <motion.div
            variants={itemVariants}
            style={{
              textAlign: 'center',
              padding: '48px',
              backgroundColor: theme.colors.surface,
              borderRadius: '16px',
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <p style={{ color: '#FF4444', fontSize: '16px' }}>
              {error}
            </p>
          </motion.div>
        ) : orders.length === 0 ? (
          <motion.div
            variants={itemVariants}
            style={{
              textAlign: 'center',
              padding: '48px',
              backgroundColor: theme.colors.surface,
              borderRadius: '16px',
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <p style={{ color: theme.colors.textSecondary, fontSize: '16px' }}>
              You don't have any orders yet
            </p>
            <Link
              to="/catalog"
              style={{
                display: 'inline-block',
                marginTop: '16px',
                padding: '12px 24px',
                backgroundColor: theme.colors.primary,
                color: '#000',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
              }}
            >
              Browse Games
            </Link>
          </motion.div>
        ) : (
          orders.map((order) => (
            <motion.div
              key={order.id}
              variants={itemVariants}
              whileHover={{ scale: 1.01 }}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '20px 24px',
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              {/* Order Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <StatusBadge status={order.status} />
                  <div style={{ marginTop: '12px' }}>
                    <h3
                      style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: theme.colors.text,
                        margin: 0,
                      }}
                    >
                      Order №{' '}
                      <span style={{ color: theme.colors.primary }}>{order.id}</span>
                    </h3>
                    <p
                      style={{
                        fontSize: '14px',
                        color: theme.colors.textSecondary,
                        margin: '4px 0 0 0',
                      }}
                    >
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: theme.colors.primary,
                    minWidth: '80px',
                    textAlign: 'right',
                  }}
                >
                  €{order.total.toFixed(2)}
                </div>
              </div>

              {/* Order Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {order.items && order.items.length > 0 ? (
                  order.items.map((item) => (
                    <div
                      key={item.id || item.gameId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '12px',
                        backgroundColor: theme.colors.surfaceLight,
                        borderRadius: '8px',
                      }}
                    >
                      {/* Game Thumbnail - Clickable */}
                      {item.game && (
                        <Link
                          to={`/game/${item.game.slug}`}
                          style={{
                            width: '60px',
                            height: '75px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            flexShrink: 0,
                            textDecoration: 'none',
                          }}
                        >
                          <img
                            src={item.game.image}
                            alt={item.game.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/60x75?text=Game';
                            }}
                          />
                        </Link>
                      )}

                      {/* Game Info */}
                      <div style={{ flex: 1 }}>
                        {item.game ? (
                          <Link
                            to={`/game/${item.game.slug}`}
                            style={{
                              textDecoration: 'none',
                              color: 'inherit',
                            }}
                          >
                            <h4
                              style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                color: theme.colors.text,
                                margin: '0 0 4px 0',
                              }}
                            >
                              {item.game.title}
                            </h4>
                          </Link>
                        ) : (
                          <h4
                            style={{
                              fontSize: '16px',
                              fontWeight: '600',
                              color: theme.colors.text,
                              margin: '0 0 4px 0',
                            }}
                          >
                            Game ID: {item.gameId}
                          </h4>
                        )}
                        <p
                          style={{
                            fontSize: '13px',
                            color: theme.colors.textMuted,
                            margin: 0,
                          }}
                        >
                          Quantity: {item.quantity} × €{item.price.toFixed(2)} = €{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      {/* Item Price */}
                      <div
                        style={{
                          fontSize: '18px',
                          fontWeight: '700',
                          color: theme.colors.text,
                          minWidth: '80px',
                          textAlign: 'right',
                        }}
                      >
                        €{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: theme.colors.textMuted, fontSize: '14px' }}>
                    No items in this order
                  </p>
                )}
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </ProfileLayout>
  );
}
