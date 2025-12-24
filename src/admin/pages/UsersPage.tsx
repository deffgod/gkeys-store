import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch,
  FiX,
  FiDollarSign,
  FiShoppingBag,
  FiDownload,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiCalendar,
  FiEdit,
  FiSave,
  FiActivity,
  FiShield,
  FiLogIn,
  FiCreditCard,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi';
import { adminApi } from '../services/adminApi';
import type { UserSearchResult, UserDetails } from '../services/adminApi';

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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case 'COMPLETED':
      return theme.colors.success;
    case 'PENDING':
      return theme.colors.warning;
    case 'CANCELLED':
    case 'FAILED':
      return theme.colors.error;
    default:
      return theme.colors.info;
  }
};

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserSearchResult['users']>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [userActivity, setUserActivity] = useState<{
    userId: string;
    loginHistory: Array<{
      id: string;
      ipAddress?: string;
      userAgent?: string;
      success: boolean;
      createdAt: string;
    }>;
    orders: Array<{
      id: string;
      status: string;
      total: number;
      createdAt: string;
    }>;
    transactions: Array<{
      id: string;
      type: string;
      amount: number;
      status: string;
      createdAt: string;
    }>;
  } | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [updatingBalance, setUpdatingBalance] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'USER' | 'ADMIN' | null>(null);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const result = await adminApi.searchUsers({
        query: search || undefined,
        page,
        pageSize: 20,
      });
      setUsers(result.users);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleViewUser = async (userId: string) => {
    setLoadingDetails(true);
    setSelectedUser(null);
    setUserActivity(null);
    setActiveTab('details');
    setBalanceAmount('');
    setBalanceReason('');
    setSelectedRole(null);
    try {
      const [details, activity] = await Promise.all([
        adminApi.getUserDetails(userId),
        adminApi.getUserActivity(userId),
      ]);
      setSelectedUser(details);
      setUserActivity(activity);
      setSelectedRole(details.role as 'USER' | 'ADMIN');
    } catch (err) {
      console.error('Failed to fetch user details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpdateBalance = async (userId: string) => {
    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount === 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (!balanceReason.trim()) {
      alert('Please enter a reason for the balance update');
      return;
    }

    if (!confirm(`Update balance by ${amount > 0 ? '+' : ''}${formatCurrency(amount)}?`)) {
      return;
    }

    try {
      setUpdatingBalance(true);
      const result = await adminApi.updateUserBalance(userId, amount, balanceReason);
      alert(`Balance updated successfully. New balance: ${formatCurrency(result.newBalance)}`);
      setBalanceAmount('');
      setBalanceReason('');
      await handleViewUser(userId); // Refresh user details
    } catch (err) {
      console.error('Failed to update balance:', err);
      alert('Failed to update balance');
    } finally {
      setUpdatingBalance(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'USER' | 'ADMIN') => {
    if (!confirm(`Change user role to ${newRole}?`)) {
      return;
    }

    try {
      setUpdatingRole(true);
      await adminApi.updateUserRole(userId, newRole);
      alert(`User role updated to ${newRole}`);
      await handleViewUser(userId); // Refresh user details
    } catch (err) {
      console.error('Failed to update role:', err);
      alert('Failed to update role');
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleExport = async (userId: string) => {
    try {
      const blob = await adminApi.exportUserReport(userId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-report-${userId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export user report:', err);
    }
  };

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: theme.colors.text,
            marginBottom: '8px',
          }}>
            Users Management
          </h1>
          <p style={{ color: theme.colors.textSecondary }}>
            {total} users total
          </p>
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} style={{ marginBottom: '24px' }}>
        <div style={{ 
          display: 'flex', 
          gap: '12px',
          maxWidth: '500px',
        }}>
          <div style={{ position: 'relative', flex: 1 }}>
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
              placeholder="Search by email, name, or nickname..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                ...inputStyle,
                paddingLeft: '44px',
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              ...buttonStyle,
              backgroundColor: theme.colors.primary,
              color: theme.colors.background,
            }}
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); }}
              style={{
                ...buttonStyle,
                backgroundColor: 'transparent',
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.text,
              }}
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: '16px',
          border: `1px solid ${theme.colors.border}`,
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: '60px',
          }}>
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
        ) : (
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
                    Email
                  </th>
                  <th style={{ 
                    textAlign: 'right', 
                    padding: '16px', 
                    color: theme.colors.textSecondary,
                    fontSize: '13px',
                    fontWeight: '600',
                  }}>
                    Balance
                  </th>
                  <th style={{ 
                    textAlign: 'center', 
                    padding: '16px', 
                    color: theme.colors.textSecondary,
                    fontSize: '13px',
                    fontWeight: '600',
                  }}>
                    Orders
                  </th>
                  <th style={{ 
                    textAlign: 'center', 
                    padding: '16px', 
                    color: theme.colors.textSecondary,
                    fontSize: '13px',
                    fontWeight: '600',
                  }}>
                    Role
                  </th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '16px', 
                    color: theme.colors.textSecondary,
                    fontSize: '13px',
                    fontWeight: '600',
                  }}>
                    Registered
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
                {users.map((user) => (
                  <tr 
                    key={user.id}
                    style={{ borderTop: `1px solid ${theme.colors.border}` }}
                  >
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: theme.colors.primary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: theme.colors.background,
                          fontWeight: '600',
                          fontSize: '14px',
                        }}>
                          {user.nickname?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ color: theme.colors.text, fontWeight: '500' }}>
                            {user.nickname}
                          </p>
                          {(user.firstName || user.lastName) && (
                            <p style={{ color: theme.colors.textSecondary, fontSize: '12px' }}>
                              {[user.firstName, user.lastName].filter(Boolean).join(' ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: theme.colors.text }}>
                      {user.email}
                    </td>
                    <td style={{ 
                      padding: '16px', 
                      textAlign: 'right',
                      color: theme.colors.success,
                      fontWeight: '600',
                    }}>
                      {formatCurrency(user.balance)}
                    </td>
                    <td style={{ 
                      padding: '16px', 
                      textAlign: 'center',
                      color: theme.colors.text,
                    }}>
                      {user.ordersCount}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        backgroundColor: user.role === 'ADMIN' 
                          ? `${theme.colors.warning}20`
                          : `${theme.colors.info}20`,
                        color: user.role === 'ADMIN' 
                          ? theme.colors.warning
                          : theme.colors.info,
                        textTransform: 'uppercase',
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ 
                      padding: '16px',
                      color: theme.colors.textSecondary,
                      fontSize: '13px',
                    }}>
                      {formatDate(user.createdAt)}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleViewUser(user.id)}
                          style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: theme.colors.surfaceLight,
                            color: theme.colors.text,
                            cursor: 'pointer',
                          }}
                          title="View Details"
                        >
                          <FiEye size={16} />
                        </button>
                        <button
                          onClick={() => handleExport(user.id)}
                          style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: `${theme.colors.info}20`,
                            color: theme.colors.info,
                            cursor: 'pointer',
                          }}
                          title="Export Report"
                        >
                          <FiDownload size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ 
                      textAlign: 'center', 
                      padding: '60px',
                      color: theme.colors.textSecondary,
                    }}>
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            borderTop: `1px solid ${theme.colors.border}`,
          }}>
            <p style={{ color: theme.colors.textSecondary, fontSize: '14px' }}>
              Page {page} of {totalPages}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: 'transparent',
                  color: page === 1 ? theme.colors.textSecondary : theme.colors.text,
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <FiChevronLeft size={16} />
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: 'transparent',
                  color: page === totalPages ? theme.colors.textSecondary : theme.colors.text,
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Next
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* User Details Modal */}
      <AnimatePresence>
        {(selectedUser || loadingDetails) && (
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
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: '16px',
                width: '100%',
                maxWidth: '800px',
                maxHeight: '90vh',
                overflow: 'auto',
              }}
            >
              {loadingDetails ? (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  padding: '60px',
                }}>
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
              ) : selectedUser && (
                <>
                  <div style={{
                    padding: '24px',
                    borderBottom: `1px solid ${theme.colors.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: theme.colors.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: theme.colors.background,
                        fontWeight: '700',
                        fontSize: '20px',
                      }}>
                        {selectedUser.nickname?.charAt(0).toUpperCase() || selectedUser.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 style={{ color: theme.colors.text, fontSize: '20px', fontWeight: '600' }}>
                          {selectedUser.nickname}
                        </h2>
                        <p style={{ color: theme.colors.textSecondary, fontSize: '14px' }}>
                          {selectedUser.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedUser(null)}
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

                  <div style={{ padding: '24px' }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: `1px solid ${theme.colors.border}` }}>
                      <button
                        type="button"
                        onClick={() => setActiveTab('details')}
                        style={{
                          padding: '12px 24px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: activeTab === 'details' ? theme.colors.primary : theme.colors.textSecondary,
                          borderBottom: activeTab === 'details' ? `2px solid ${theme.colors.primary}` : '2px solid transparent',
                          cursor: 'pointer',
                          fontWeight: activeTab === 'details' ? '600' : '400',
                          fontSize: '14px',
                        }}
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('activity')}
                        style={{
                          padding: '12px 24px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: activeTab === 'activity' ? theme.colors.primary : theme.colors.textSecondary,
                          borderBottom: activeTab === 'activity' ? `2px solid ${theme.colors.primary}` : '2px solid transparent',
                          cursor: 'pointer',
                          fontWeight: activeTab === 'activity' ? '600' : '400',
                          fontSize: '14px',
                        }}
                      >
                        Activity
                      </button>
                    </div>

                    {activeTab === 'details' && (
                      <>
                        {/* User Info Cards */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                          gap: '16px',
                          marginBottom: '32px',
                        }}>
                          <div style={{
                            backgroundColor: theme.colors.surfaceLight,
                            borderRadius: '12px',
                            padding: '16px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <FiDollarSign color={theme.colors.success} />
                              <span style={{ color: theme.colors.textSecondary, fontSize: '13px' }}>Balance</span>
                            </div>
                            <p style={{ color: theme.colors.success, fontSize: '24px', fontWeight: '600' }}>
                              {formatCurrency(selectedUser.balance)}
                            </p>
                          </div>
                          <div style={{
                            backgroundColor: theme.colors.surfaceLight,
                            borderRadius: '12px',
                            padding: '16px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <FiShoppingBag color={theme.colors.info} />
                              <span style={{ color: theme.colors.textSecondary, fontSize: '13px' }}>Orders</span>
                            </div>
                            <p style={{ color: theme.colors.text, fontSize: '24px', fontWeight: '600' }}>
                              {selectedUser.orders.length}
                            </p>
                          </div>
                          <div style={{
                            backgroundColor: theme.colors.surfaceLight,
                            borderRadius: '12px',
                            padding: '16px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <FiShield color={theme.colors.warning} />
                              <span style={{ color: theme.colors.textSecondary, fontSize: '13px' }}>Role</span>
                            </div>
                            <p style={{ color: theme.colors.text, fontSize: '14px', fontWeight: '500', textTransform: 'uppercase' }}>
                              {selectedUser.role}
                            </p>
                          </div>
                          <div style={{
                            backgroundColor: theme.colors.surfaceLight,
                            borderRadius: '12px',
                            padding: '16px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <FiCalendar color={theme.colors.warning} />
                              <span style={{ color: theme.colors.textSecondary, fontSize: '13px' }}>Registered</span>
                            </div>
                            <p style={{ color: theme.colors.text, fontSize: '14px', fontWeight: '500' }}>
                              {formatDate(selectedUser.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Balance Update Form */}
                        <div style={{
                          backgroundColor: theme.colors.surfaceLight,
                          borderRadius: '12px',
                          padding: '20px',
                          marginBottom: '24px',
                        }}>
                          <h3 style={{ color: theme.colors.text, fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                            Update Balance
                          </h3>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '12px', alignItems: 'end' }}>
                            <div>
                              <label htmlFor="balance-amount" style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>
                                Amount (EUR)
                              </label>
                              <input
                                id="balance-amount"
                                type="number"
                                step="0.01"
                                value={balanceAmount}
                                onChange={(e) => setBalanceAmount(e.target.value)}
                                placeholder="e.g., 50.00 or -25.00"
                                style={{
                                  ...inputStyle,
                                  width: '100%',
                                }}
                              />
                            </div>
                            <div>
                              <label htmlFor="balance-reason" style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>
                                Reason
                              </label>
                              <input
                                id="balance-reason"
                                type="text"
                                value={balanceReason}
                                onChange={(e) => setBalanceReason(e.target.value)}
                                placeholder="Reason for balance update"
                                style={{
                                  ...inputStyle,
                                  width: '100%',
                                }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleUpdateBalance(selectedUser.id)}
                              disabled={updatingBalance || !balanceAmount || !balanceReason}
                              style={{
                                ...buttonStyle,
                                backgroundColor: updatingBalance || !balanceAmount || !balanceReason ? theme.colors.surface : theme.colors.primary,
                                color: updatingBalance || !balanceAmount || !balanceReason ? theme.colors.textSecondary : theme.colors.background,
                                cursor: updatingBalance || !balanceAmount || !balanceReason ? 'not-allowed' : 'pointer',
                                opacity: updatingBalance || !balanceAmount || !balanceReason ? 0.6 : 1,
                              }}
                            >
                              <FiSave />
                              {updatingBalance ? 'Updating...' : 'Update'}
                            </button>
                          </div>
                        </div>

                        {/* Role Update */}
                        <div style={{
                          backgroundColor: theme.colors.surfaceLight,
                          borderRadius: '12px',
                          padding: '20px',
                          marginBottom: '24px',
                        }}>
                          <h3 style={{ color: theme.colors.text, fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                            Update Role
                          </h3>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <select
                              value={selectedRole || selectedUser.role}
                              onChange={(e) => setSelectedRole(e.target.value as 'USER' | 'ADMIN')}
                              style={{
                                ...inputStyle,
                                width: '200px',
                              }}
                            >
                              <option value="USER">USER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => selectedRole && handleUpdateRole(selectedUser.id, selectedRole)}
                              disabled={updatingRole || !selectedRole || selectedRole === selectedUser.role}
                              style={{
                                ...buttonStyle,
                                backgroundColor: updatingRole || !selectedRole || selectedRole === selectedUser.role ? theme.colors.surface : theme.colors.warning,
                                color: updatingRole || !selectedRole || selectedRole === selectedUser.role ? theme.colors.textSecondary : '#ffffff',
                                cursor: updatingRole || !selectedRole || selectedRole === selectedUser.role ? 'not-allowed' : 'pointer',
                                opacity: updatingRole || !selectedRole || selectedRole === selectedUser.role ? 0.6 : 1,
                              }}
                            >
                              <FiSave />
                              {updatingRole ? 'Updating...' : 'Update Role'}
                            </button>
                          </div>
                        </div>

                        {/* Orders */}
                        <div style={{ marginBottom: '32px' }}>
                          <h3 style={{ 
                            color: theme.colors.text, 
                            fontSize: '16px', 
                            fontWeight: '600',
                            marginBottom: '16px',
                          }}>
                            Recent Orders
                          </h3>
                          {selectedUser.orders.length > 0 ? (
                            <div style={{ 
                              backgroundColor: theme.colors.surfaceLight,
                              borderRadius: '12px',
                              overflow: 'hidden',
                            }}>
                              {selectedUser.orders.slice(0, 5).map((order, index) => (
                                <div 
                                  key={order.id}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px 16px',
                                    borderTop: index > 0 ? `1px solid ${theme.colors.border}` : 'none',
                                  }}
                                >
                                  <div>
                                    <p style={{ color: theme.colors.text, fontSize: '14px' }}>
                                      Order #{order.id.slice(0, 8)}
                                    </p>
                                    <p style={{ color: theme.colors.textSecondary, fontSize: '12px' }}>
                                      {formatDate(order.createdAt)}
                                    </p>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <p style={{ color: theme.colors.text, fontWeight: '600' }}>
                                      {formatCurrency(order.total)}
                                    </p>
                                    <span style={{
                                      fontSize: '11px',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      backgroundColor: `${getStatusColor(order.status)}20`,
                                      color: getStatusColor(order.status),
                                    }}>
                                      {order.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ color: theme.colors.textSecondary, textAlign: 'center', padding: '20px' }}>
                              No orders yet
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {activeTab === 'activity' && userActivity && (
                      <div>
                        {/* Login History */}
                        <div style={{ marginBottom: '32px' }}>
                          <h3 style={{ 
                            color: theme.colors.text, 
                            fontSize: '16px', 
                            fontWeight: '600',
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}>
                            <FiLogIn />
                            Login History
                          </h3>
                          {userActivity.loginHistory.length > 0 ? (
                            <div style={{ 
                              backgroundColor: theme.colors.surfaceLight,
                              borderRadius: '12px',
                              overflow: 'hidden',
                            }}>
                              {userActivity.loginHistory.slice(0, 10).map((login, index) => (
                                <div 
                                  key={login.id}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px 16px',
                                    borderTop: index > 0 ? `1px solid ${theme.colors.border}` : 'none',
                                  }}
                                >
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                      {login.success ? (
                                        <FiCheckCircle color={theme.colors.success} size={16} />
                                      ) : (
                                        <FiXCircle color={theme.colors.error} size={16} />
                                      )}
                                      <p style={{ color: theme.colors.text, fontSize: '14px' }}>
                                        {login.success ? 'Successful login' : 'Failed login'}
                                      </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: theme.colors.textSecondary }}>
                                      {login.ipAddress && <span>IP: {login.ipAddress}</span>}
                                      <span>{new Date(login.createdAt).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ color: theme.colors.textSecondary, textAlign: 'center', padding: '20px' }}>
                              No login history
                            </p>
                          )}
                        </div>

                        {/* Orders Activity */}
                        <div style={{ marginBottom: '32px' }}>
                          <h3 style={{ 
                            color: theme.colors.text, 
                            fontSize: '16px', 
                            fontWeight: '600',
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}>
                            <FiShoppingBag />
                            Orders Activity
                          </h3>
                          {userActivity.orders.length > 0 ? (
                            <div style={{ 
                              backgroundColor: theme.colors.surfaceLight,
                              borderRadius: '12px',
                              overflow: 'hidden',
                            }}>
                              {userActivity.orders.slice(0, 10).map((order, index) => (
                                <div 
                                  key={order.id}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px 16px',
                                    borderTop: index > 0 ? `1px solid ${theme.colors.border}` : 'none',
                                  }}
                                >
                                  <div>
                                    <p style={{ color: theme.colors.text, fontSize: '14px' }}>
                                      Order #{order.id.slice(0, 8)}
                                    </p>
                                    <p style={{ color: theme.colors.textSecondary, fontSize: '12px' }}>
                                      {new Date(order.createdAt).toLocaleString()}
                                    </p>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <p style={{ color: theme.colors.text, fontWeight: '600' }}>
                                      {formatCurrency(order.total)}
                                    </p>
                                    <span style={{
                                      fontSize: '11px',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      backgroundColor: `${getStatusColor(order.status)}20`,
                                      color: getStatusColor(order.status),
                                    }}>
                                      {order.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ color: theme.colors.textSecondary, textAlign: 'center', padding: '20px' }}>
                              No orders
                            </p>
                          )}
                        </div>

                        {/* Transactions Activity */}
                        <div>
                          <h3 style={{ 
                            color: theme.colors.text, 
                            fontSize: '16px', 
                            fontWeight: '600',
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}>
                            <FiCreditCard />
                            Transactions Activity
                          </h3>
                          {userActivity.transactions.length > 0 ? (
                            <div style={{ 
                              backgroundColor: theme.colors.surfaceLight,
                              borderRadius: '12px',
                              overflow: 'hidden',
                            }}>
                              {userActivity.transactions.slice(0, 10).map((transaction, index) => (
                                <div 
                                  key={transaction.id}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px 16px',
                                    borderTop: index > 0 ? `1px solid ${theme.colors.border}` : 'none',
                                  }}
                                >
                                  <div>
                                    <p style={{ color: theme.colors.text, fontSize: '14px' }}>
                                      {transaction.type}
                                    </p>
                                    <p style={{ color: theme.colors.textSecondary, fontSize: '12px' }}>
                                      {new Date(transaction.createdAt).toLocaleString()}
                                    </p>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <p style={{ 
                                      color: transaction.amount > 0 ? theme.colors.success : theme.colors.error, 
                                      fontWeight: '600' 
                                    }}>
                                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                                    </p>
                                    <span style={{
                                      fontSize: '11px',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      backgroundColor: `${getStatusColor(transaction.status)}20`,
                                      color: getStatusColor(transaction.status),
                                    }}>
                                      {transaction.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ color: theme.colors.textSecondary, textAlign: 'center', padding: '20px' }}>
                              No transactions
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Transactions */}
                    <div>
                      <h3 style={{ 
                        color: theme.colors.text, 
                        fontSize: '16px', 
                        fontWeight: '600',
                        marginBottom: '16px',
                      }}>
                        Recent Transactions
                      </h3>
                      {selectedUser.transactions.length > 0 ? (
                        <div style={{ 
                          backgroundColor: theme.colors.surfaceLight,
                          borderRadius: '12px',
                          overflow: 'hidden',
                        }}>
                          {selectedUser.transactions.slice(0, 5).map((tx, index) => (
                            <div 
                              key={tx.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px 16px',
                                borderTop: index > 0 ? `1px solid ${theme.colors.border}` : 'none',
                              }}
                            >
                              <div>
                                <p style={{ color: theme.colors.text, fontSize: '14px' }}>
                                  {tx.type}
                                </p>
                                <p style={{ color: theme.colors.textSecondary, fontSize: '12px' }}>
                                  {formatDate(tx.createdAt)}
                                </p>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <p style={{ 
                                  color: tx.type === 'TOP_UP' ? theme.colors.success : theme.colors.text, 
                                  fontWeight: '600' 
                                }}>
                                  {tx.type === 'TOP_UP' ? '+' : ''}{formatCurrency(tx.amount)}
                                </p>
                                <span style={{
                                  fontSize: '11px',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: `${getStatusColor(tx.status)}20`,
                                  color: getStatusColor(tx.status),
                                }}>
                                  {tx.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: theme.colors.textSecondary, textAlign: 'center', padding: '20px' }}>
                          No transactions yet
                        </p>
                      )}
                    </div>

                    {/* Export Button */}
                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleExport(selectedUser.id)}
                        style={{
                          ...buttonStyle,
                          backgroundColor: theme.colors.info,
                          color: theme.colors.text,
                        }}
                      >
                        <FiDownload size={18} />
                        Export Full Report
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UsersPage;
