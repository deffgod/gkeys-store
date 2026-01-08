import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiSearch,
  FiX,
  FiSave,
  FiPercent,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi';
import { adminApi } from '../services/adminApi';

const theme = {
  colors: {
    primary: '#10B981',
    background: '#0a0a0a',
    surface: '#141414',
    surfaceLight: '#1a1a1a',
    text: '#ffffff',
    textSecondary: '#a0a0a0',
    border: '#2a2a2a',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
  },
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  backgroundColor: theme.colors.surfaceLight,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: '8px',
  color: theme.colors.text,
  fontSize: '14px',
  outline: 'none',
};

const buttonStyle: React.CSSProperties = {
  padding: '12px 24px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: '500',
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'all 0.2s',
};

interface PromoCode {
  id: string;
  code: string;
  discount: number;
  maxUses: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  active: boolean;
  createdAt: string;
}

interface PromoCodeStatistics {
  totalCodes: number;
  activeCodes: number;
  expiredCodes: number;
  totalUses: number;
  totalDiscountGiven: number;
  mostUsedCode: {
    code: string;
    uses: number;
  } | null;
}

const PromoCodesPage: React.FC = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [statistics, setStatistics] = useState<PromoCodeStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPromoCode, setEditingPromoCode] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discount: '',
    maxUses: '',
    validFrom: '',
    validUntil: '',
    active: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPromoCodes = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getPromoCodes();
      setPromoCodes(data);
      
      const stats = await adminApi.getPromoCodeStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Failed to fetch promo codes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const filteredPromoCodes = promoCodes.filter(pc =>
    pc.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    setEditingPromoCode(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    setFormData({
      code: '',
      discount: '',
      maxUses: '',
      validFrom: tomorrow.toISOString().split('T')[0],
      validUntil: nextMonth.toISOString().split('T')[0],
      active: true,
    });
    setShowModal(true);
  };

  const handleEdit = (promoCode: PromoCode) => {
    setEditingPromoCode(promoCode);
    setFormData({
      code: promoCode.code,
      discount: promoCode.discount.toString(),
      maxUses: promoCode.maxUses?.toString() || '',
      validFrom: new Date(promoCode.validFrom).toISOString().split('T')[0],
      validUntil: new Date(promoCode.validUntil).toISOString().split('T')[0],
      active: promoCode.active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.code.trim() || !formData.discount || !formData.validFrom || !formData.validUntil) {
      return;
    }

    setSaving(true);
    try {
      const data = {
        code: formData.code.trim(),
        discount: parseFloat(formData.discount),
        maxUses: formData.maxUses ? parseInt(formData.maxUses, 10) : null,
        validFrom: formData.validFrom,
        validUntil: formData.validUntil,
        active: formData.active,
      };

      if (editingPromoCode) {
        await adminApi.updatePromoCode(editingPromoCode.id, data);
      } else {
        await adminApi.createPromoCode(data);
      }

      setShowModal(false);
      fetchPromoCodes();
    } catch (err) {
      console.error('Failed to save promo code:', err);
      alert(err instanceof Error ? err.message : 'Failed to save promo code');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await adminApi.deletePromoCode(id);
      setDeleteConfirm(null);
      fetchPromoCodes();
    } catch (err) {
      console.error('Failed to delete promo code:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete promo code');
    } finally {
      setDeleting(false);
    }
  };

  const getStatus = (promoCode: PromoCode) => {
    const now = new Date();
    const validFrom = new Date(promoCode.validFrom);
    const validUntil = new Date(promoCode.validUntil);
    
    if (!promoCode.active) {
      return { label: 'Inactive', color: theme.colors.textSecondary };
    }
    if (now < validFrom) {
      return { label: 'Scheduled', color: theme.colors.warning };
    }
    if (now > validUntil) {
      return { label: 'Expired', color: theme.colors.error };
    }
    if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
      return { label: 'Max Uses Reached', color: theme.colors.error };
    }
    return { label: 'Active', color: theme.colors.success };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ color: theme.colors.text, fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
            Promo Codes
          </h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: '14px' }}>
            Manage discount codes and track usage statistics
          </p>
        </div>
        <button
          onClick={handleCreate}
          style={{
            ...buttonStyle,
            backgroundColor: theme.colors.primary,
            color: theme.colors.background,
          }}
        >
          <FiPlus />
          Create Promo Code
        </button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: '12px',
              padding: '20px',
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <FiPercent size={20} color={theme.colors.primary} />
              <span style={{ color: theme.colors.textSecondary, fontSize: '13px' }}>Total Codes</span>
            </div>
            <div style={{ color: theme.colors.text, fontSize: '24px', fontWeight: '700' }}>
              {statistics.totalCodes}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: '12px',
              padding: '20px',
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <FiCheckCircle size={20} color={theme.colors.success} />
              <span style={{ color: theme.colors.textSecondary, fontSize: '13px' }}>Active Codes</span>
            </div>
            <div style={{ color: theme.colors.text, fontSize: '24px', fontWeight: '700' }}>
              {statistics.activeCodes}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: '12px',
              padding: '20px',
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <FiTrendingUp size={20} color={theme.colors.warning} />
              <span style={{ color: theme.colors.textSecondary, fontSize: '13px' }}>Total Uses</span>
            </div>
            <div style={{ color: theme.colors.text, fontSize: '24px', fontWeight: '700' }}>
              {statistics.totalUses}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: '12px',
              padding: '20px',
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <FiPercent size={20} color={theme.colors.primary} />
              <span style={{ color: theme.colors.textSecondary, fontSize: '13px' }}>Total Discount</span>
            </div>
            <div style={{ color: theme.colors.text, fontSize: '24px', fontWeight: '700' }}>
              {formatCurrency(statistics.totalDiscountGiven)}
            </div>
          </motion.div>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ position: 'relative' }}>
          <FiSearch
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: theme.colors.textSecondary,
            }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search promo codes..."
            style={{
              ...inputStyle,
              paddingLeft: '44px',
            }}
          />
        </div>
      </div>

      {/* Promo Codes Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: theme.colors.textSecondary }}>
          Loading...
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: '12px',
            border: `1px solid ${theme.colors.border}`,
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: theme.colors.surfaceLight }}>
                <th style={{ textAlign: 'left', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                  Code
                </th>
                <th style={{ textAlign: 'left', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                  Discount
                </th>
                <th style={{ textAlign: 'center', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                  Uses
                </th>
                <th style={{ textAlign: 'left', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                  Valid Period
                </th>
                <th style={{ textAlign: 'center', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                  Status
                </th>
                <th style={{ textAlign: 'right', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPromoCodes.map((promoCode) => {
                const status = getStatus(promoCode);
                return (
                  <tr 
                    key={promoCode.id}
                    style={{ borderTop: `1px solid ${theme.colors.border}` }}
                  >
                    <td style={{ padding: '16px', color: theme.colors.text, fontWeight: '600', fontFamily: 'monospace', fontSize: '14px' }}>
                      {promoCode.code}
                    </td>
                    <td style={{ padding: '16px', color: theme.colors.primary, fontSize: '16px', fontWeight: '600' }}>
                      {promoCode.discount}%
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', color: theme.colors.text }}>
                      {promoCode.usedCount}
                      {promoCode.maxUses && ` / ${promoCode.maxUses}`}
                    </td>
                    <td style={{ padding: '16px', color: theme.colors.textSecondary, fontSize: '13px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FiClock size={12} />
                          <span>From: {new Date(promoCode.validFrom).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FiClock size={12} />
                          <span>Until: {new Date(promoCode.validUntil).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: `${status.color}20`,
                          color: status.color,
                        }}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleEdit(promoCode)}
                          style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: theme.colors.surfaceLight,
                            color: theme.colors.text,
                            cursor: 'pointer',
                          }}
                          title="Edit"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(promoCode.id)}
                          style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: `${theme.colors.error}20`,
                            color: theme.colors.error,
                            cursor: 'pointer',
                          }}
                          title="Delete"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredPromoCodes.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ 
                    textAlign: 'center', 
                    padding: '60px',
                    color: theme.colors.textSecondary,
                  }}>
                    {search ? 'No promo codes found' : 'No promo codes yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px',
            }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ color: theme.colors.text, fontSize: '20px', fontWeight: '600' }}>
                  {editingPromoCode ? 'Edit Promo Code' : 'Create Promo Code'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: theme.colors.textSecondary,
                    cursor: 'pointer',
                  }}
                >
                  <FiX size={20} />
                </button>
              </div>

              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>
                    Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="PROMO2024"
                    style={inputStyle}
                    disabled={!!editingPromoCode}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>
                      Discount (%) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      step="0.01"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                      placeholder="10"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>
                      Max Uses (optional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxUses}
                      onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                      placeholder="Unlimited"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>
                      Valid From *
                    </label>
                    <input
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>
                      Valid Until *
                    </label>
                    <input
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.colors.textSecondary, fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      style={{ cursor: 'pointer' }}
                    />
                    Active
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    ...buttonStyle,
                    backgroundColor: theme.colors.surfaceLight,
                    color: theme.colors.text,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.code.trim() || !formData.discount || !formData.validFrom || !formData.validUntil}
                  style={{
                    ...buttonStyle,
                    backgroundColor: saving || !formData.code.trim() || !formData.discount || !formData.validFrom || !formData.validUntil
                      ? theme.colors.surface
                      : theme.colors.primary,
                    color: saving || !formData.code.trim() || !formData.discount || !formData.validFrom || !formData.validUntil
                      ? theme.colors.textSecondary
                      : theme.colors.background,
                    cursor: saving || !formData.code.trim() || !formData.discount || !formData.validFrom || !formData.validUntil
                      ? 'not-allowed'
                      : 'pointer',
                  }}
                >
                  <FiSave />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1001,
            }}
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '400px',
                width: '100%',
              }}
            >
              <h3 style={{ color: theme.colors.text, fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Delete Promo Code?
              </h3>
              <p style={{ color: theme.colors.textSecondary, fontSize: '14px', marginBottom: '24px' }}>
                This action cannot be undone. The promo code will be permanently deleted.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  style={{
                    ...buttonStyle,
                    backgroundColor: theme.colors.surfaceLight,
                    color: theme.colors.text,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={deleting}
                  style={{
                    ...buttonStyle,
                    backgroundColor: deleting ? theme.colors.surface : theme.colors.error,
                    color: deleting ? theme.colors.textSecondary : theme.colors.text,
                    cursor: deleting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PromoCodesPage;
