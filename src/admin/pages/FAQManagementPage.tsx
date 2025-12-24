import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiHelpCircle,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiCheck,
  FiXCircle,
  FiSearch
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

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  order: number;
  active: boolean;
  createdAt: string;
}

interface FAQFormModalProps {
  faq: FAQItem | null;
  categories: Array<{ name: string; slug: string; count: number }>;
  onClose: () => void;
  onSave: (data: {
    category: string;
    question: string;
    answer: string;
    order?: number;
    active?: boolean;
  }) => Promise<void>;
}

const FAQFormModal: React.FC<FAQFormModalProps> = ({ faq, categories, onClose, onSave }) => {
  const [category, setCategory] = useState(faq?.category || '');
  const [question, setQuestion] = useState(faq?.question || '');
  const [answer, setAnswer] = useState(faq?.answer || '');
  const [order, setOrder] = useState(faq?.order?.toString() || '');
  const [active, setActive] = useState(faq?.active !== undefined ? faq.active : true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!category || !question || !answer) {
      setError('Category, question, and answer are required');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        category,
        question,
        answer,
        order: order ? parseInt(order) : undefined,
        active,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save FAQ');
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
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, color: theme.colors.text, fontSize: '24px', fontWeight: '600' }}>
              {faq ? 'Edit FAQ' : 'Create FAQ'}
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

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="faq-category" style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>
                Category *
              </label>
              <select
                id="faq-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
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
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name} ({cat.count})
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Or enter new category"
                style={{
                  width: '100%',
                  marginTop: '8px',
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

            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="faq-question" style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>
                Question *
              </label>
              <input
                id="faq-question"
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
                placeholder="Enter FAQ question"
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

            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="faq-answer" style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>
                Answer *
              </label>
              <textarea
                id="faq-answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                required
                placeholder="Enter FAQ answer"
                rows={6}
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

            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="faq-order" style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>
                Display Order (optional)
              </label>
              <input
                id="faq-order"
                type="number"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                placeholder="Auto-assigned if empty"
                min="0"
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
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                  }}
                />
                <span style={{ color: theme.colors.text, fontSize: '14px' }}>Published (Active)</span>
              </label>
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

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
                type="submit"
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
                {loading ? 'Saving...' : faq ? 'Update FAQ' : 'Create FAQ'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const FAQManagementPage: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [categories, setCategories] = useState<Array<{ name: string; slug: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [active, setActive] = useState<boolean | undefined>(undefined);
  const [formModal, setFormModal] = useState<FAQItem | null>(null);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const result = await adminApi.getFAQs({
        category: category || undefined,
        search: search || undefined,
        active,
        page,
        pageSize: 20,
      });
      setFaqs(result.faqs);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (err) {
      console.error('Failed to fetch FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const cats = await adminApi.getFAQCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchFAQs();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, category, search, active]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleSave = async (data: {
    category: string;
    question: string;
    answer: string;
    order?: number;
    active?: boolean;
  }) => {
    if (formModal) {
      await adminApi.updateFAQ(formModal.id, data);
    } else {
      await adminApi.createFAQ(data);
    }
    await fetchFAQs();
    await fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await adminApi.deleteFAQ(id);
      await fetchFAQs();
      await fetchCategories();
    } catch (err) {
      console.error('Failed to delete FAQ:', err);
      alert('Failed to delete FAQ');
    }
  };

  const handleToggleActive = async (faq: FAQItem) => {
    try {
      await adminApi.updateFAQ(faq.id, { active: !faq.active });
      await fetchFAQs();
    } catch (err) {
      console.error('Failed to update FAQ:', err);
    }
  };

  const clearFilters = () => {
    setCategory('');
    setSearch('');
    setSearchInput('');
    setActive(undefined);
    setPage(1);
  };

  const hasActiveFilters = category || search || active !== undefined;

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
          FAQ Management
        </h1>
        <p style={{ 
          margin: 0, 
          color: theme.colors.textSecondary, 
          fontSize: '16px',
        }}>
          Create and manage frequently asked questions
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
                placeholder="Search FAQs..."
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
              onClick={() => setFormModal(null)}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: theme.colors.primary,
                color: '#ffffff',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <FiPlus />
              Create FAQ
            </button>
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
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                padding: '20px',
                backgroundColor: theme.colors.surfaceLight,
                borderRadius: '12px',
                border: `1px solid ${theme.colors.border}`,
              }}>
                <div>
                  <label htmlFor="filter-category" style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>
                    Category
                  </label>
                  <select
                    id="filter-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
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
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="filter-active" style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>
                    Status
                  </label>
                  <select
                    id="filter-active"
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
                    <option value="true">Published</option>
                    <option value="false">Unpublished</option>
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
        ) : faqs.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            color: theme.colors.textSecondary,
          }}>
            <FiHelpCircle style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
            <div style={{ fontSize: '16px' }}>No FAQs found</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: theme.colors.surfaceLight }}>
                    <th style={{ textAlign: 'left', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                      Category
                    </th>
                    <th style={{ textAlign: 'left', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                      Question
                    </th>
                    <th style={{ textAlign: 'center', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                      Order
                    </th>
                    <th style={{ textAlign: 'center', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                      Status
                    </th>
                    <th style={{ textAlign: 'left', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                      Created
                    </th>
                    <th style={{ textAlign: 'right', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {faqs.map((faq) => (
                    <motion.tr
                      key={faq.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ borderBottom: `1px solid ${theme.colors.border}` }}
                    >
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
                          {faq.category}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ color: theme.colors.text, fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                          {faq.question}
                        </div>
                        <div style={{ color: theme.colors.textSecondary, fontSize: '12px', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {faq.answer}
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', color: theme.colors.text, fontSize: '14px' }}>
                        {faq.order}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(faq)}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: faq.active ? `${theme.colors.success}20` : `${theme.colors.error}20`,
                            color: faq.active ? theme.colors.success : theme.colors.error,
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          {faq.active ? <FiCheck /> : <FiXCircle />}
                          {faq.active ? 'Published' : 'Unpublished'}
                        </button>
                      </td>
                      <td style={{ padding: '16px', color: theme.colors.textSecondary, fontSize: '13px' }}>
                        {new Date(faq.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => setFormModal(faq)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: `1px solid ${theme.colors.primary}`,
                              backgroundColor: 'transparent',
                              color: theme.colors.primary,
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '500',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <FiEdit />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(faq.id)}
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
                            <FiTrash2 />
                            Delete
                          </button>
                        </div>
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
                  Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} FAQs
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

      {formModal !== null && (
        <FAQFormModal
          faq={formModal}
          categories={categories}
          onClose={() => setFormModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default FAQManagementPage;

