import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPackage,
  FiSearch,
  FiEye,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiCheck,
  FiXCircle,
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

interface G2AOffer {
  id: string;
  type: string;
  productId: string;
  productName?: string;
  price: number;
  visibility: string;
  status: string;
  active: boolean;
  inventory?: {
    size: number;
    sold: number;
    type: string;
  };
  createdAt?: string;
  updatedAt?: string;
  promoStatus?: string;
}

interface OfferDetailModalProps {
  offer: G2AOffer | null;
  onClose: () => void;
}

const OfferDetailModal: React.FC<OfferDetailModalProps> = ({ offer, onClose }) => {
  if (!offer) return null;

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Active':
        return theme.colors.success;
      case 'New':
      case 'Accepted':
        return theme.colors.info;
      case 'Rejected':
      case 'Cancelled':
      case 'Banned':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
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
            maxWidth: '700px',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, color: theme.colors.text, fontSize: '24px', fontWeight: '600' }}>
              Offer Details
            </h2>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div style={{ color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>Product</div>
              <div style={{ color: theme.colors.text, fontSize: '16px', fontWeight: '500' }}>
                {offer.productName || offer.productId}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <div style={{ color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>Type</div>
                <div style={{ color: theme.colors.text, fontSize: '14px' }}>{offer.type}</div>
              </div>
              <div>
                <div style={{ color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>Price</div>
                <div style={{ color: theme.colors.text, fontSize: '14px', fontWeight: '600' }}>
                  {offer.price.toFixed(2)} EUR
                </div>
              </div>
              <div>
                <div style={{ color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>Visibility</div>
                <div style={{ color: theme.colors.text, fontSize: '14px' }}>{offer.visibility}</div>
              </div>
              <div>
                <div style={{ color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>Status</div>
                <span style={{
                  display: 'inline-flex',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  backgroundColor: `${getStatusColor(offer.status)}20`,
                  color: getStatusColor(offer.status),
                  fontSize: '12px',
                  fontWeight: '600',
                }}>
                  {offer.status}
                </span>
              </div>
            </div>

            {offer.inventory && (
              <div>
                <div style={{ color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '12px' }}>Inventory</div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: theme.colors.surfaceLight,
                  borderRadius: '8px',
                  border: `1px solid ${theme.colors.border}`,
                }}>
                  <div>
                    <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>Size</div>
                    <div style={{ color: theme.colors.text, fontSize: '16px', fontWeight: '600' }}>
                      {offer.inventory.size}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>Sold</div>
                    <div style={{ color: theme.colors.text, fontSize: '16px', fontWeight: '600' }}>
                      {offer.inventory.sold}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>Available</div>
                    <div style={{ color: theme.colors.success, fontSize: '16px', fontWeight: '600' }}>
                      {offer.inventory.size - offer.inventory.sold}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {offer.createdAt && (
              <div>
                <div style={{ color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>Created</div>
                <div style={{ color: theme.colors.text, fontSize: '14px' }}>
                  {new Date(offer.createdAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const G2AOffersPage: React.FC = () => {
  const [offers, setOffers] = useState<G2AOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [productId, setProductId] = useState('');
  const [status, setStatus] = useState('');
  const [offerType, setOfferType] = useState('');
  const [active, setActive] = useState<boolean | undefined>(undefined);
  const [selectedOffer, setSelectedOffer] = useState<G2AOffer | null>(null);
  const [loadingOffer, setLoadingOffer] = useState(false);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const result = await adminApi.getG2AOffers({
        productId: productId || undefined,
        status: status || undefined,
        offerType: offerType || undefined,
        active,
        page,
        perPage: 20,
      });
      setOffers(result.data || []);
      setTotalPages(result.meta?.lastPage || 1);
      setTotal(result.meta?.total || 0);
    } catch (err) {
      console.error('Failed to fetch offers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, productId, status, offerType, active]);

  const handleViewOffer = async (offerId: string) => {
    try {
      setLoadingOffer(true);
      const offer = await adminApi.getG2AOfferById(offerId);
      setSelectedOffer(offer);
    } catch (err) {
      console.error('Failed to fetch offer:', err);
    } finally {
      setLoadingOffer(false);
    }
  };

  const clearFilters = () => {
    setProductId('');
    setStatus('');
    setOfferType('');
    setActive(undefined);
    setPage(1);
  };

  const hasActiveFilters = productId || status || offerType || active !== undefined;

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Active':
        return theme.colors.success;
      case 'New':
      case 'Accepted':
        return theme.colors.info;
      case 'Rejected':
      case 'Cancelled':
      case 'Banned':
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
          G2A Offers
        </h1>
        <p style={{ 
          margin: 0, 
          color: theme.colors.textSecondary, 
          fontSize: '16px',
        }}>
          View and manage G2A marketplace offers
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
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                placeholder="Search by Product ID..."
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
              onClick={fetchOffers}
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
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                padding: '20px',
                backgroundColor: theme.colors.surfaceLight,
                borderRadius: '12px',
                border: `1px solid ${theme.colors.border}`,
              }}>
                <div>
                  <label htmlFor="filter-status-offer" style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>
                    Status
                  </label>
                  <select
                    id="filter-status-offer"
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
                    <option value="New">New</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Active">Active</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Finished">Finished</option>
                    <option value="Banned">Banned</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="filter-type-offer" style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>
                    Type
                  </label>
                  <select
                    id="filter-type-offer"
                    value={offerType}
                    onChange={(e) => setOfferType(e.target.value)}
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
                    <option value="">All Types</option>
                    <option value="dropshipping">Dropshipping</option>
                    <option value="promo">Promo</option>
                    <option value="steamgift">Steam Gift</option>
                    <option value="game">Game</option>
                    <option value="preorder">Preorder</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="filter-active-offer" style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>
                    Active
                  </label>
                  <select
                    id="filter-active-offer"
                    value={active === undefined ? '' : active.toString()}
                    onChange={(e) => setActive(e.target.value === '' ? undefined : e.target.value === 'true')}
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
                    <option value="">All</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
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
        ) : offers.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            color: theme.colors.textSecondary,
          }}>
            <FiPackage style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
            <div style={{ fontSize: '16px' }}>No offers found</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: theme.colors.surfaceLight }}>
                    <th style={{ textAlign: 'left', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                      Product
                    </th>
                    <th style={{ textAlign: 'left', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                      Type
                    </th>
                    <th style={{ textAlign: 'right', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                      Price
                    </th>
                    <th style={{ textAlign: 'center', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                      Status
                    </th>
                    <th style={{ textAlign: 'center', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                      Inventory
                    </th>
                    <th style={{ textAlign: 'right', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((offer) => (
                    <motion.tr
                      key={offer.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ borderBottom: `1px solid ${theme.colors.border}` }}
                    >
                      <td style={{ padding: '16px' }}>
                        <div>
                          <div style={{ color: theme.colors.text, fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                            {offer.productName || offer.productId}
                          </div>
                          <div style={{ color: theme.colors.textSecondary, fontSize: '12px' }}>
                            ID: {offer.productId}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          padding: '4px 12px',
                          borderRadius: '6px',
                          backgroundColor: `${theme.colors.info}20`,
                          color: theme.colors.info,
                          fontSize: '12px',
                          fontWeight: '600',
                        }}>
                          {offer.type}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', color: theme.colors.text, fontSize: '14px', fontWeight: '600' }}>
                        {offer.price.toFixed(2)} EUR
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          padding: '4px 12px',
                          borderRadius: '6px',
                          backgroundColor: `${getStatusColor(offer.status)}20`,
                          color: getStatusColor(offer.status),
                          fontSize: '12px',
                          fontWeight: '600',
                        }}>
                          {offer.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        {offer.inventory ? (
                          <div>
                            <div style={{ color: theme.colors.text, fontSize: '14px', fontWeight: '600' }}>
                              {offer.inventory.size - offer.inventory.sold} / {offer.inventory.size}
                            </div>
                            <div style={{ color: theme.colors.textSecondary, fontSize: '11px' }}>
                              {offer.inventory.sold} sold
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: theme.colors.textSecondary, fontSize: '12px' }}>N/A</span>
                        )}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleViewOffer(offer.id)}
                          disabled={loadingOffer}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: `1px solid ${theme.colors.primary}`,
                            backgroundColor: 'transparent',
                            color: theme.colors.primary,
                            cursor: loadingOffer ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            fontWeight: '500',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            opacity: loadingOffer ? 0.5 : 1,
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
                  Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} offers
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

      {selectedOffer && (
        <OfferDetailModal
          offer={selectedOffer}
          onClose={() => setSelectedOffer(null)}
        />
      )}
    </div>
  );
};

export default G2AOffersPage;

