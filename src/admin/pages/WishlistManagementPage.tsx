import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiHeart,
  FiSearch,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiFilter,
  FiTrendingUp,
  FiUsers
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

interface WishlistItem {
  gameId: string;
  game: {
    id: string;
    title: string;
    slug: string;
    image: string;
    price: number;
    inStock: boolean;
  };
  addedAt: string;
}

interface WishlistDetailModalProps {
  userId: string;
  userEmail: string;
  wishlist: { items: WishlistItem[] } | null;
  onClose: () => void;
}

const WishlistDetailModal: React.FC<WishlistDetailModalProps> = ({ userId, userEmail, wishlist, onClose }) => {
  if (!wishlist) return null;

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
                Wishlist Details
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

          <div style={{ marginBottom: '24px' }}>
            {wishlist.items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: theme.colors.textSecondary }}>
                Wishlist is empty
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {wishlist.items.map((item) => (
                  <motion.div
                    key={item.gameId}
                    whileHover={{ scale: 1.02 }}
                    style={{
                      backgroundColor: theme.colors.surfaceLight,
                      borderRadius: '12px',
                      padding: '16px',
                      border: `1px solid ${theme.colors.border}`,
                    }}
                  >
                    <img
                      src={item.game.image}
                      alt={item.game.title}
                      style={{
                        width: '100%',
                        aspectRatio: '16/9',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        marginBottom: '12px',
                      }}
                    />
                    <div style={{ color: theme.colors.text, fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                      {item.game.title}
                    </div>
                    <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '8px' }}>
                      {Number(item.game.price).toFixed(2)} EUR
                    </div>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: item.game.inStock ? `${theme.colors.success}20` : `${theme.colors.error}20`,
                      color: item.game.inStock ? theme.colors.success : theme.colors.error,
                      fontSize: '11px',
                      fontWeight: '500',
                    }}>
                      {item.game.inStock ? 'In Stock' : 'Out of Stock'}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const WishlistManagementPage: React.FC = () => {
  const [wishlists, setWishlists] = useState<Array<{
    userId: string;
    user: { id: string; email: string; nickname: string };
    itemCount: number;
    lastUpdated: string;
  }>>([]);
  const [statistics, setStatistics] = useState<{
    totalWishlists: number;
    totalItems: number;
    averageItemsPerWishlist: number;
    mostWishedGames: Array<{
      gameId: string;
      game: { id: string; title: string; slug: string };
      wishlistCount: number;
    }>;
    wishlistGrowth: Array<{ date: string; count: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [hasItems, setHasItems] = useState<boolean | undefined>(undefined);
  const [selectedWishlist, setSelectedWishlist] = useState<{ userId: string; userEmail: string; wishlist: { items: WishlistItem[] } | null } | null>(null);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  const fetchWishlists = async () => {
    try {
      setLoading(true);
      const result = await adminApi.getUserWishlists({
        email: search || undefined,
        hasItems,
        page,
        pageSize: 20,
      });
      setWishlists(result.wishlists);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (err) {
      console.error('Failed to fetch wishlists:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      setLoadingStats(true);
      const stats = await adminApi.getWishlistStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchWishlists();
    fetchStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, hasItems]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleViewWishlist = async (userId: string, userEmail: string) => {
    try {
      setLoadingWishlist(true);
      const wishlist = await adminApi.getUserWishlist(userId);
      setSelectedWishlist({ userId, userEmail, wishlist });
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
    } finally {
      setLoadingWishlist(false);
    }
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
          Wishlist Management
        </h1>
        <p style={{ 
          margin: 0, 
          color: theme.colors.textSecondary, 
          fontSize: '16px',
        }}>
          View user wishlists and analyze shopping behavior
        </p>
      </div>

      {/* Statistics Section */}
      {statistics && (
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
          <h2 style={{ margin: '0 0 20px 0', color: theme.colors.text, fontSize: '20px', fontWeight: '600' }}>
            Statistics
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              backgroundColor: theme.colors.surfaceLight,
              borderRadius: '12px',
              padding: '20px',
              border: `1px solid ${theme.colors.border}`,
            }}>
              <div style={{ color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>Total Wishlists</div>
              <div style={{ color: theme.colors.text, fontSize: '24px', fontWeight: '700' }}>{statistics.totalWishlists}</div>
            </div>
            <div style={{
              backgroundColor: theme.colors.surfaceLight,
              borderRadius: '12px',
              padding: '20px',
              border: `1px solid ${theme.colors.border}`,
            }}>
              <div style={{ color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>Total Items</div>
              <div style={{ color: theme.colors.text, fontSize: '24px', fontWeight: '700' }}>{statistics.totalItems}</div>
            </div>
            <div style={{
              backgroundColor: theme.colors.surfaceLight,
              borderRadius: '12px',
              padding: '20px',
              border: `1px solid ${theme.colors.border}`,
            }}>
              <div style={{ color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>Avg Items/Wishlist</div>
              <div style={{ color: theme.colors.primary, fontSize: '24px', fontWeight: '700' }}>{statistics.averageItemsPerWishlist}</div>
            </div>
          </div>

          {statistics.mostWishedGames.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 16px 0', color: theme.colors.text, fontSize: '16px', fontWeight: '600' }}>
                Most Wished Games
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {statistics.mostWishedGames.slice(0, 5).map((item, index) => (
                  <div
                    key={item.gameId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      backgroundColor: theme.colors.surfaceLight,
                      borderRadius: '8px',
                      border: `1px solid ${theme.colors.border}`,
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: theme.colors.primary,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: theme.colors.text, fontSize: '14px', fontWeight: '500' }}>
                        {item.game.title}
                      </div>
                      <div style={{ color: theme.colors.textSecondary, fontSize: '12px' }}>
                        {item.wishlistCount} wishlists
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

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
                <label htmlFor="filter-has-items-wishlist" style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>
                  Has Items
                </label>
                <select
                  id="filter-has-items-wishlist"
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
                  <option value="">All Wishlists</option>
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
        ) : wishlists.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            color: theme.colors.textSecondary,
          }}>
            <FiHeart style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
            <div style={{ fontSize: '16px' }}>No wishlists found</div>
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
                    <th style={{ textAlign: 'left', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                      Last Updated
                    </th>
                    <th style={{ textAlign: 'right', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {wishlists.map((wishlist) => (
                    <motion.tr
                      key={wishlist.userId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ borderBottom: `1px solid ${theme.colors.border}` }}
                    >
                      <td style={{ padding: '16px' }}>
                        <div>
                          <div style={{ color: theme.colors.text, fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                            {wishlist.user.nickname || wishlist.user.email}
                          </div>
                          <div style={{ color: theme.colors.textSecondary, fontSize: '12px' }}>
                            {wishlist.user.email}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', color: theme.colors.text, fontSize: '14px' }}>
                        {wishlist.itemCount}
                      </td>
                      <td style={{ padding: '16px', color: theme.colors.textSecondary, fontSize: '13px' }}>
                        {new Date(wishlist.lastUpdated).toLocaleDateString('en-GB', {
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
                          onClick={() => handleViewWishlist(wishlist.userId, wishlist.user.email)}
                          disabled={loadingWishlist}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: `1px solid ${theme.colors.primary}`,
                            backgroundColor: 'transparent',
                            color: theme.colors.primary,
                            cursor: loadingWishlist ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            fontWeight: '500',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            opacity: loadingWishlist ? 0.5 : 1,
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
                  Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} wishlists
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

      {selectedWishlist && (
        <WishlistDetailModal
          userId={selectedWishlist.userId}
          userEmail={selectedWishlist.userEmail}
          wishlist={selectedWishlist.wishlist}
          onClose={() => setSelectedWishlist(null)}
        />
      )}
    </div>
  );
};

export default WishlistManagementPage;

