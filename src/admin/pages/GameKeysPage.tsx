import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiSearch,
  FiX,
  FiSave,
  FiKey,
  FiPackage,
  FiCheckCircle,
  FiXCircle,
  FiCopy,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiCheck
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

interface GameKey {
  id: string;
  gameId: string;
  key: string;
  orderId: string | null;
  activated: boolean;
  activationDate: string | null;
  createdAt: string;
  game?: {
    id: string;
    title: string;
    slug: string;
    image: string;
  };
  order?: {
    id: string;
    userId: string;
    total: number;
    status: string;
    createdAt: string;
    user?: {
      id: string;
      email: string;
      nickname: string;
    };
  };
}

interface GameKeyStatistics {
  totalKeys: number;
  activatedKeys: number;
  unactivatedKeys: number;
  keysByGame: Array<{
    gameId: string;
    gameTitle: string;
    total: number;
    activated: number;
    unactivated: number;
  }>;
  keysByOrder: Array<{
    orderId: string;
    total: number;
    activated: number;
    unactivated: number;
  }>;
}

interface Game {
  id: string;
  title: string;
  slug: string;
}

const GameKeysPage: React.FC = () => {
  const [gameKeys, setGameKeys] = useState<GameKey[]>([]);
  const [statistics, setStatistics] = useState<GameKeyStatistics | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    gameId: '',
    orderId: '',
    activated: undefined as boolean | undefined,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingGameKey, setEditingGameKey] = useState<GameKey | null>(null);
  const [viewingGameKey, setViewingGameKey] = useState<GameKey | null>(null);
  const [formData, setFormData] = useState({
    gameId: '',
    key: '',
    orderId: '',
    activated: false,
  });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchGameKeys = async () => {
    try {
      setLoading(true);
      const result = await adminApi.getGameKeys(page, 50, {
        gameId: filters.gameId || undefined,
        orderId: filters.orderId || undefined,
        activated: filters.activated,
        search: search || undefined,
      });
      setGameKeys(result.keys);
      setTotalPages(result.totalPages);
      setTotal(result.total);
      
      const stats = await adminApi.getGameKeyStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Failed to fetch game keys:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGames = async () => {
    try {
      const result = await adminApi.getGames(1, 1000);
      setGames(result.games);
    } catch (err) {
      console.error('Failed to fetch games:', err);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  useEffect(() => {
    fetchGameKeys();
  }, [page, filters, search]);

  const handleCreate = () => {
    setEditingGameKey(null);
    setFormData({
      gameId: '',
      key: '',
      orderId: '',
      activated: false,
    });
    setShowModal(true);
  };

  const handleEdit = (gameKey: GameKey) => {
    setEditingGameKey(gameKey);
    setFormData({
      gameId: gameKey.gameId,
      key: gameKey.key,
      orderId: gameKey.orderId || '',
      activated: gameKey.activated,
    });
    setShowModal(true);
  };

  const handleView = (gameKey: GameKey) => {
    setViewingGameKey(gameKey);
  };

  const handleCopy = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSave = async () => {
    if (!formData.gameId || !formData.key) {
      return;
    }

    setSaving(true);
    try {
      const data = {
        gameId: formData.gameId,
        key: formData.key.trim(),
        orderId: formData.orderId || null,
        activated: formData.activated,
      };

      if (editingGameKey) {
        await adminApi.updateGameKey(editingGameKey.id, data);
      } else {
        await adminApi.createGameKey(data);
      }

      setShowModal(false);
      fetchGameKeys();
    } catch (err) {
      console.error('Failed to save game key:', err);
      alert(err instanceof Error ? err.message : 'Failed to save game key');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await adminApi.deleteGameKey(id);
      setDeleteConfirm(null);
      fetchGameKeys();
    } catch (err) {
      console.error('Failed to delete game key:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete game key');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return key;
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ color: theme.colors.text, fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
            Game Keys
          </h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: '14px' }}>
            Manage game keys, track activations, and view statistics
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
          Add Game Key
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
              <FiKey size={20} color={theme.colors.primary} />
              <span style={{ color: theme.colors.textSecondary, fontSize: '13px' }}>Total Keys</span>
            </div>
            <div style={{ color: theme.colors.text, fontSize: '24px', fontWeight: '700' }}>
              {statistics.totalKeys}
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
              <span style={{ color: theme.colors.textSecondary, fontSize: '13px' }}>Activated</span>
            </div>
            <div style={{ color: theme.colors.text, fontSize: '24px', fontWeight: '700' }}>
              {statistics.activatedKeys}
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
              <FiXCircle size={20} color={theme.colors.warning} />
              <span style={{ color: theme.colors.textSecondary, fontSize: '13px' }}>Unactivated</span>
            </div>
            <div style={{ color: theme.colors.text, fontSize: '24px', fontWeight: '700' }}>
              {statistics.unactivatedKeys}
            </div>
          </motion.div>
        </div>
      )}

      {/* Search and Filters */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
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
            placeholder="Search by key, game title, or user email..."
            style={{
              ...inputStyle,
              paddingLeft: '44px',
            }}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            ...buttonStyle,
            backgroundColor: showFilters ? theme.colors.primary : theme.colors.surfaceLight,
            color: showFilters ? theme.colors.background : theme.colors.text,
          }}
        >
          <FiFilter />
          Filters
        </button>
        {(filters.gameId || filters.orderId || filters.activated !== undefined) && (
          <button
            onClick={() => setFilters({ gameId: '', orderId: '', activated: undefined })}
            style={{
              ...buttonStyle,
              backgroundColor: theme.colors.surfaceLight,
              color: theme.colors.text,
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>
                Game
              </label>
              <select
                value={filters.gameId}
                onChange={(e) => setFilters({ ...filters, gameId: e.target.value })}
                style={inputStyle}
              >
                <option value="">All Games</option>
                {games.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>
                Order ID
              </label>
              <input
                type="text"
                value={filters.orderId}
                onChange={(e) => setFilters({ ...filters, orderId: e.target.value })}
                placeholder="Filter by order ID"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>
                Activation Status
              </label>
              <select
                value={filters.activated === undefined ? '' : filters.activated.toString()}
                onChange={(e) => setFilters({ ...filters, activated: e.target.value === '' ? undefined : e.target.value === 'true' })}
                style={inputStyle}
              >
                <option value="">All</option>
                <option value="true">Activated</option>
                <option value="false">Unactivated</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {/* Game Keys Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: theme.colors.textSecondary }}>
          Loading...
        </div>
      ) : (
        <>
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
                    Key
                  </th>
                  <th style={{ textAlign: 'left', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                    Game
                  </th>
                  <th style={{ textAlign: 'left', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
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
                {gameKeys.map((gameKey) => (
                  <tr 
                    key={gameKey.id}
                    style={{ borderTop: `1px solid ${theme.colors.border}` }}
                  >
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: theme.colors.text, fontFamily: 'monospace', fontSize: '13px' }}>
                          {maskKey(gameKey.key)}
                        </span>
                        <button
                          onClick={() => handleCopy(gameKey.key)}
                          style={{
                            padding: '4px',
                            borderRadius: '4px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: copied === gameKey.key ? theme.colors.success : theme.colors.textSecondary,
                            cursor: 'pointer',
                          }}
                          title="Copy key"
                        >
                          {copied === gameKey.key ? <FiCheck size={14} /> : <FiCopy size={14} />}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: theme.colors.text }}>
                      {gameKey.game ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {gameKey.game.image && (
                            <img
                              src={gameKey.game.image}
                              alt={gameKey.game.title}
                              style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }}
                            />
                          )}
                          <span>{gameKey.game.title}</span>
                        </div>
                      ) : (
                        <span style={{ color: theme.colors.textSecondary }}>Unknown Game</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', color: theme.colors.textSecondary, fontSize: '13px' }}>
                      {gameKey.order ? (
                        <div>
                          <div style={{ color: theme.colors.text, fontWeight: '500' }}>
                            #{gameKey.order.id.substring(0, 8)}
                          </div>
                          {gameKey.order.user && (
                            <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginTop: '4px' }}>
                              {gameKey.order.user.email}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: gameKey.activated ? `${theme.colors.success}20` : `${theme.colors.warning}20`,
                          color: gameKey.activated ? theme.colors.success : theme.colors.warning,
                        }}
                      >
                        {gameKey.activated ? 'Activated' : 'Unactivated'}
                      </span>
                      {gameKey.activationDate && (
                        <div style={{ color: theme.colors.textSecondary, fontSize: '11px', marginTop: '4px' }}>
                          {formatDate(gameKey.activationDate)}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px', color: theme.colors.textSecondary, fontSize: '13px' }}>
                      {formatDate(gameKey.createdAt)}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleView(gameKey)}
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
                          onClick={() => handleEdit(gameKey)}
                          disabled={gameKey.activated && gameKey.orderId !== null}
                          style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: gameKey.activated && gameKey.orderId !== null ? theme.colors.surface : theme.colors.surfaceLight,
                            color: gameKey.activated && gameKey.orderId !== null ? theme.colors.textSecondary : theme.colors.text,
                            cursor: gameKey.activated && gameKey.orderId !== null ? 'not-allowed' : 'pointer',
                            opacity: gameKey.activated && gameKey.orderId !== null ? 0.5 : 1,
                          }}
                          title={gameKey.activated && gameKey.orderId !== null ? 'Cannot edit activated key assigned to order' : 'Edit'}
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(gameKey.id)}
                          disabled={gameKey.activated && gameKey.orderId !== null}
                          style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: gameKey.activated && gameKey.orderId !== null ? theme.colors.surface : `${theme.colors.error}20`,
                            color: gameKey.activated && gameKey.orderId !== null ? theme.colors.textSecondary : theme.colors.error,
                            cursor: gameKey.activated && gameKey.orderId !== null ? 'not-allowed' : 'pointer',
                            opacity: gameKey.activated && gameKey.orderId !== null ? 0.5 : 1,
                          }}
                          title={gameKey.activated && gameKey.orderId !== null ? 'Cannot delete activated key assigned to order' : 'Delete'}
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {gameKeys.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ 
                      textAlign: 'center', 
                      padding: '60px',
                      color: theme.colors.textSecondary,
                    }}>
                      {search || filters.gameId || filters.orderId || filters.activated !== undefined
                        ? 'No game keys found matching filters'
                        : 'No game keys yet'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  ...buttonStyle,
                  backgroundColor: page === 1 ? theme.colors.surface : theme.colors.surfaceLight,
                  color: page === 1 ? theme.colors.textSecondary : theme.colors.text,
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  padding: '8px 16px',
                }}
              >
                <FiChevronLeft />
                Previous
              </button>
              <span style={{ color: theme.colors.textSecondary, fontSize: '14px' }}>
                Page {page} of {totalPages} ({total} total)
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  ...buttonStyle,
                  backgroundColor: page === totalPages ? theme.colors.surface : theme.colors.surfaceLight,
                  color: page === totalPages ? theme.colors.textSecondary : theme.colors.text,
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  padding: '8px 16px',
                }}
              >
                Next
                <FiChevronRight />
              </button>
            </div>
          )}
        </>
      )}

      {/* View Details Modal */}
      <AnimatePresence>
        {viewingGameKey && (
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
            onClick={() => setViewingGameKey(null)}
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
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ color: theme.colors.text, fontSize: '20px', fontWeight: '600' }}>
                  Game Key Details
                </h2>
                <button
                  onClick={() => setViewingGameKey(null)}
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
                    Key
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="text"
                      value={viewingGameKey.key}
                      readOnly
                      style={{
                        ...inputStyle,
                        fontFamily: 'monospace',
                        flex: 1,
                      }}
                    />
                    <button
                      onClick={() => handleCopy(viewingGameKey.key)}
                      style={{
                        ...buttonStyle,
                        backgroundColor: copied === viewingGameKey.key ? theme.colors.success : theme.colors.surfaceLight,
                        color: copied === viewingGameKey.key ? theme.colors.background : theme.colors.text,
                        padding: '12px',
                      }}
                    >
                      {copied === viewingGameKey.key ? <FiCheck /> : <FiCopy />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>
                    Game
                  </label>
                  <div style={{ color: theme.colors.text }}>
                    {viewingGameKey.game ? viewingGameKey.game.title : 'Unknown Game'}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>
                    Order
                  </label>
                  <div style={{ color: theme.colors.text }}>
                    {viewingGameKey.order ? (
                      <div>
                        <div>Order #{viewingGameKey.order.id.substring(0, 8)}</div>
                        {viewingGameKey.order.user && (
                          <div style={{ color: theme.colors.textSecondary, fontSize: '13px', marginTop: '4px' }}>
                            User: {viewingGameKey.order.user.email}
                          </div>
                        )}
                      </div>
                    ) : (
                      'Not assigned'
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>
                    Status
                  </label>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: viewingGameKey.activated ? `${theme.colors.success}20` : `${theme.colors.warning}20`,
                      color: viewingGameKey.activated ? theme.colors.success : theme.colors.warning,
                    }}
                  >
                    {viewingGameKey.activated ? 'Activated' : 'Unactivated'}
                  </span>
                  {viewingGameKey.activationDate && (
                    <div style={{ color: theme.colors.textSecondary, fontSize: '13px', marginTop: '8px' }}>
                      Activated: {formatDate(viewingGameKey.activationDate)}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>
                    Created
                  </label>
                  <div style={{ color: theme.colors.text }}>
                    {formatDate(viewingGameKey.createdAt)}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              zIndex: 1001,
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
                  {editingGameKey ? 'Edit Game Key' : 'Create Game Key'}
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
                    Game *
                  </label>
                  <select
                    value={formData.gameId}
                    onChange={(e) => setFormData({ ...formData, gameId: e.target.value })}
                    style={inputStyle}
                    disabled={!!editingGameKey}
                  >
                    <option value="">Select a game</option>
                    {games.map((game) => (
                      <option key={game.id} value={game.id}>
                        {game.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>
                    Key *
                  </label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    placeholder="Enter game key"
                    style={{
                      ...inputStyle,
                      fontFamily: 'monospace',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>
                    Order ID (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.orderId}
                    onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                    placeholder="Order ID"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.colors.textSecondary, fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.activated}
                      onChange={(e) => setFormData({ ...formData, activated: e.target.checked })}
                      style={{ cursor: 'pointer' }}
                    />
                    Activated
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
                  disabled={saving || !formData.gameId || !formData.key}
                  style={{
                    ...buttonStyle,
                    backgroundColor: saving || !formData.gameId || !formData.key
                      ? theme.colors.surface
                      : theme.colors.primary,
                    color: saving || !formData.gameId || !formData.key
                      ? theme.colors.textSecondary
                      : theme.colors.background,
                    cursor: saving || !formData.gameId || !formData.key
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
              zIndex: 1002,
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
                Delete Game Key?
              </h3>
              <p style={{ color: theme.colors.textSecondary, fontSize: '14px', marginBottom: '24px' }}>
                This action cannot be undone. The game key will be permanently deleted.
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

export default GameKeysPage;
