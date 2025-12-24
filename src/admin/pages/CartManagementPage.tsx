import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiShoppingCart,
  FiSearch,
  FiX,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiMinus,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiFilter,
  FiRefreshCw
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

interface CartItem {
  gameId: string;
  quantity: number;
  game: {
    id: string;
    title: string;
    slug: string;
    image: string;
    price: number;
    inStock: boolean;
  };
}

interface CartDetailModalProps {
  userId: string;
  userEmail: string;
  cart: { items: CartItem[]; total: number } | null;
  onClose: () => void;
  onUpdate: (items: Array<{ gameId: string; quantity: number }>) => Promise<void>;
  onClear: () => Promise<void>;
}

const CartDetailModal: React.FC<CartDetailModalProps> = ({ userId, userEmail, cart, onClose, onUpdate, onClear }) => {
  const [items, setItems] = useState<Array<{ gameId: string; quantity: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (cart) {
      setItems(cart.items.map(item => ({ gameId: item.gameId, quantity: item.quantity })));
    }
  }, [cart]);

  const handleQuantityChange = (gameId: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.gameId === gameId) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleRemove = (gameId: string) => {
    setItems(prev => prev.filter(item => item.gameId !== gameId));
  };

  const handleSave = async () => {
    setError('');
    setLoading(true);
    try {
      await onUpdate(items);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update cart');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear this cart?')) return;
    setError('');
    setLoading(true);
    try {
      await onClear();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cart');
    } finally {
      setLoading(false);
    }
  };

  if (!cart) return null;

  const total = items.reduce((sum, item) => {
    const game = cart.items.find(c => c.gameId === item.gameId)?.game;
    return sum + (game ? Number(game.price) * item.quantity : 0);
  }, 0);

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
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ margin: 0, color: theme.colors.text, fontSize: '24px', fontWeight: '600' }}>
                Cart Details
              </h2>
              <p style={{ margin: '4px 0 0 0', color: theme.colors.textSecondary, fontSize: '14px' }}>
                {userEmail}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
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

          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: `${theme.colors.error}20`,
              border: `1px solid ${theme.colors.error}`,
              borderRadius: '8px',
              color: theme.colors.error,
              fontSize: '14px',
              marginBottom: '20px',
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: theme.colors.textSecondary }}>
                Cart is empty
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {items.map((item) => {
                  const game = cart.items.find(c => c.gameId === item.gameId)?.game;
                  if (!game) return null;
                  return (
                    <div
                      key={item.gameId}
                      style={{
                        display: 'flex',
                        gap: '16px',
                        padding: '16px',
                        backgroundColor: theme.colors.surfaceLight,
                        borderRadius: '12px',
                        border: `1px solid ${theme.colors.border}`,
                      }}
                    >
                      <img
                        src={game.image}
                        alt={game.title}
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: theme.colors.text, fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                          {game.title}
                        </div>
                        <div style={{ color: theme.colors.textSecondary, fontSize: '14px', marginBottom: '8px' }}>
                          {Number(game.price).toFixed(2)} EUR
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.gameId, -1)}
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              border: `1px solid ${theme.colors.border}`,
                              backgroundColor: theme.colors.surface,
                              color: theme.colors.text,
                              cursor: 'pointer',
                            }}
                          >
                            <FiMinus />
                          </button>
                          <span style={{ color: theme.colors.text, fontSize: '16px', fontWeight: '600', minWidth: '40px', textAlign: 'center' }}>
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.gameId, 1)}
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              border: `1px solid ${theme.colors.border}`,
                              backgroundColor: theme.colors.surface,
                              color: theme.colors.text,
                              cursor: 'pointer',
                            }}
                          >
                            <FiPlus />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemove(item.gameId)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: `1px solid ${theme.colors.error}`,
                              backgroundColor: 'transparent',
                              color: theme.colors.error,
                              cursor: 'pointer',
                              marginLeft: 'auto',
                            }}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '20px',
            borderTop: `1px solid ${theme.colors.border}`,
            marginBottom: '20px',
          }}>
            <div>
              <div style={{ color: theme.colors.textSecondary, fontSize: '14px' }}>Total</div>
              <div style={{ color: theme.colors.text, fontSize: '24px', fontWeight: '700' }}>
                {total.toFixed(2)} EUR
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleClear}
              disabled={loading || items.length === 0}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: `1px solid ${theme.colors.error}`,
                backgroundColor: 'transparent',
                color: theme.colors.error,
                cursor: loading || items.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                fontSize: '14px',
                opacity: loading || items.length === 0 ? 0.5 : 1,
              }}
            >
              Clear Cart
            </button>
            <button
              type="button"
              onClick={onClose}
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
              type="button"
              onClick={handleSave}
              disabled={loading}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: theme.colors.primary,
                color: '#ffffff',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                fontSize: '14px',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const CartManagementPage: React.FC = () => {
  const [carts, setCarts] = useState<Array<{
    userId: string;
    user: { id: string; email: string; nickname: string };
    itemCount: number;
    total: number;
    lastUpdated: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [hasItems, setHasItems] = useState<boolean | undefined>(undefined);
  const [selectedCart, setSelectedCart] = useState<{ userId: string; userEmail: string; cart: { items: CartItem[]; total: number } | null } | null>(null);
  const [loadingCart, setLoadingCart] = useState(false);

  const fetchCarts = async () => {
    try {
      setLoading(true);
      const result = await adminApi.getUserCarts({
        email: search || undefined,
        hasItems,
        page,
        pageSize: 20,
      });
      setCarts(result.carts);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (err) {
      console.error('Failed to fetch carts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, hasItems]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleViewCart = async (userId: string, userEmail: string) => {
    try {
      setLoadingCart(true);
      const cart = await adminApi.getUserCart(userId);
      setSelectedCart({ userId, userEmail, cart });
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoadingCart(false);
    }
  };

  const handleUpdateCart = async (items: Array<{ gameId: string; quantity: number }>) => {
    if (!selectedCart) return;
    await adminApi.updateUserCart(selectedCart.userId, items);
    await fetchCarts();
    const cart = await adminApi.getUserCart(selectedCart.userId);
    setSelectedCart({ ...selectedCart, cart });
  };

  const handleClearCart = async () => {
    if (!selectedCart) return;
    await adminApi.clearUserCart(selectedCart.userId);
    await fetchCarts();
    setSelectedCart({ ...selectedCart, cart: { items: [], total: 0 } });
  };

  const clearFilters = () => {
    setSearch('');
    setSearchInput('');
    setHasItems(undefined);
    setPage(1);
  };

  const hasActiveFilters = search || hasItems !== undefined;

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
          Cart Management
        </h1>
        <p style={{ 
          margin: 0, 
          color: theme.colors.textSecondary, 
          fontSize: '16px',
        }}>
          View and manage user shopping carts
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
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px' }}>
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
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by email..."
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
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: theme.colors.primary,
                color: '#ffffff',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px',
              }}
            >
              Search
            </button>
          </form>
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
                <label htmlFor="filter-has-items" style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>
                  Has Items
                </label>
                <select
                  id="filter-has-items"
                  value={hasItems === undefined ? '' : hasItems.toString()}
                  onChange={(e) => setHasItems(e.target.value === '' ? undefined : e.target.value === 'true')}
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
                  <option value="">All Carts</option>
                  <option value="true">With Items</option>
                  <option value="false">Empty</option>
                </select>
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
        ) : carts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            color: theme.colors.textSecondary,
          }}>
            <FiShoppingCart style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
            <div style={{ fontSize: '16px' }}>No carts found</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: theme.colors.surfaceLight }}>
                    <th style={{ textAlign: 'left', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                      User
                    </th>
                    <th style={{ textAlign: 'center', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                      Items
                    </th>
                    <th style={{ textAlign: 'right', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                      Total
                    </th>
                    <th style={{ textAlign: 'left', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                      Last Updated
                    </th>
                    <th style={{ textAlign: 'right', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {carts.map((cart) => (
                    <motion.tr
                      key={cart.userId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ borderBottom: `1px solid ${theme.colors.border}` }}
                    >
                      <td style={{ padding: '16px' }}>
                        <div>
                          <div style={{ color: theme.colors.text, fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                            {cart.user.nickname || cart.user.email}
                          </div>
                          <div style={{ color: theme.colors.textSecondary, fontSize: '12px' }}>
                            {cart.user.email}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', color: theme.colors.text, fontSize: '14px' }}>
                        {cart.itemCount}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', color: theme.colors.text, fontSize: '14px', fontWeight: '600' }}>
                        {cart.total.toFixed(2)} EUR
                      </td>
                      <td style={{ padding: '16px', color: theme.colors.textSecondary, fontSize: '13px' }}>
                        {new Date(cart.lastUpdated).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleViewCart(cart.userId, cart.user.email)}
                          disabled={loadingCart}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: `1px solid ${theme.colors.primary}`,
                            backgroundColor: 'transparent',
                            color: theme.colors.primary,
                            cursor: loadingCart ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            fontWeight: '500',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            opacity: loadingCart ? 0.5 : 1,
                          }}
                        >
                          <FiEye />
                          View
                        </button>
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
                  Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} carts
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

      {selectedCart && (
        <CartDetailModal
          userId={selectedCart.userId}
          userEmail={selectedCart.userEmail}
          cart={selectedCart.cart}
          onClose={() => setSelectedCart(null)}
          onUpdate={handleUpdateCart}
          onClear={handleClearCart}
        />
      )}
    </div>
  );
};

export default CartManagementPage;

