import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiSearch,
  FiX,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiPackage
} from 'react-icons/fi';
import { adminApi } from '../services/adminApi';
import type { GameItem, GameCreateInput } from '../services/adminApi';

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
  padding: '14px 16px', // Increased for better touch targets
  backgroundColor: theme.colors.surfaceLight,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: '8px',
  color: theme.colors.text,
  fontSize: '16px', // Prevent zoom on iOS (minimum 16px)
  outline: 'none',
  minHeight: '44px', // Minimum touch target size for mobile
  boxSizing: 'border-box' as const,
  WebkitAppearance: 'none' as const,
};

const buttonStyle: React.CSSProperties = {
  padding: '14px 24px', // Increased for better touch targets
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: '500',
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'all 0.2s',
  minHeight: '44px', // Minimum touch target size for mobile
  minWidth: '44px',
  WebkitTapHighlightColor: 'transparent',
  userSelect: 'none' as const,
};

interface GameFormData {
  title: string;
  slug: string;
  description: string;
  price: string;
  originalPrice: string;
  imageUrl: string;
  platform: string;
  platforms: string[];
  genre: string;
  genres: string[];
  tags: string[];
  categories: string[];
  publisher: string;
  developer: string;
  releaseDate: string;
  isPreorder: boolean;
  inStock: boolean;
}

const emptyForm: GameFormData = {
  title: '',
  slug: '',
  description: '',
  price: '',
  originalPrice: '',
  imageUrl: '',
  platform: 'PC',
  platforms: [],
  genre: '',
  genres: [],
  tags: [],
  categories: [],
  publisher: '',
  developer: '',
  releaseDate: '',
  isPreorder: false,
  inStock: true,
};

const GamesPage: React.FC = () => {
  const [games, setGames] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGame, setEditingGame] = useState<GameItem | null>(null);
  const [formData, setFormData] = useState<GameFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const result = await adminApi.getGames(page, 20);
      setGames(result.games);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (err) {
      console.error('Failed to fetch games:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, [page]);

  const handleCreate = () => {
    setEditingGame(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const handleEdit = async (game: GameItem) => {
    setEditingGame(game);
    try {
      // Load full game data including description, relationships, etc.
      const fullGame = await adminApi.getGameById(game.id);
      setFormData({
        title: fullGame.title,
        slug: fullGame.slug,
        description: fullGame.description || '',
        price: fullGame.price.toString(),
        originalPrice: fullGame.originalPrice?.toString() || '',
        imageUrl: fullGame.imageUrl,
        platform: fullGame.platform || fullGame.platforms[0] || 'PC',
        platforms: fullGame.platforms || [],
        genre: fullGame.genre || fullGame.genres[0] || '',
        genres: fullGame.genres || [],
        tags: fullGame.tags || [],
        categories: fullGame.categories || [],
        publisher: fullGame.publisher || '',
        developer: fullGame.developer || '',
        releaseDate: fullGame.releaseDate || '',
        isPreorder: fullGame.isPreorder,
        inStock: fullGame.inStock,
      });
    } catch (err) {
      console.error('Failed to load game details:', err);
      // Fallback to basic data
      setFormData({
        title: game.title,
        slug: game.slug,
        description: '',
        price: game.price.toString(),
        originalPrice: game.originalPrice?.toString() || '',
        imageUrl: game.imageUrl,
        platform: game.platform,
        platforms: [],
        genre: game.genre,
        genres: [],
        tags: [],
        categories: [],
        publisher: '',
        developer: '',
        releaseDate: '',
        isPreorder: game.isPreorder,
        inStock: game.inStock,
      });
    }
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteGame(id);
      setDeleteConfirm(null);
      fetchGames();
    } catch (err) {
      console.error('Failed to delete game:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data: GameCreateInput = {
        title: formData.title,
        slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        imageUrl: formData.imageUrl,
        platform: formData.platform || formData.platforms[0] || 'PC',
        genre: formData.genre || formData.genres[0] || '',
        tags: Array.isArray(formData.tags) ? formData.tags : formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        categories: formData.categories || [],
        publisher: formData.publisher || undefined,
        developer: formData.developer || undefined,
        releaseDate: formData.releaseDate || undefined,
        isPreorder: formData.isPreorder,
        inStock: formData.inStock,
      };

      if (editingGame) {
        await adminApi.updateGame(editingGame.id, data);
      } else {
        await adminApi.createGame(data);
      }

      setShowModal(false);
      fetchGames();
    } catch (err) {
      console.error('Failed to save game:', err);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const filteredGames = search
    ? games.filter(g => 
        g.title.toLowerCase().includes(search.toLowerCase()) ||
        g.slug.toLowerCase().includes(search.toLowerCase())
      )
    : games;

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
            Games Management
          </h1>
          <p style={{ color: theme.colors.textSecondary }}>
            {total} games total
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
          <FiPlus size={18} />
          Add Game
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px' }}>
        <div className="admin-search-input" style={{ position: 'relative', maxWidth: '400px', width: '100%' }}>
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
            placeholder="Search games..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              ...inputStyle,
              paddingLeft: '44px',
            }}
          />
        </div>
      </div>

      {/* Games Table */}
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
          <div className="admin-table-wrapper" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ backgroundColor: theme.colors.surfaceLight }}>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '16px', 
                    color: theme.colors.textSecondary,
                    fontSize: '13px',
                    fontWeight: '600',
                  }}>
                    Game
                  </th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '16px', 
                    color: theme.colors.textSecondary,
                    fontSize: '13px',
                    fontWeight: '600',
                  }}>
                    Platform
                  </th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '16px', 
                    color: theme.colors.textSecondary,
                    fontSize: '13px',
                    fontWeight: '600',
                  }}>
                    Genre
                  </th>
                  <th style={{ 
                    textAlign: 'right', 
                    padding: '16px', 
                    color: theme.colors.textSecondary,
                    fontSize: '13px',
                    fontWeight: '600',
                  }}>
                    Price
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
                    textAlign: 'center', 
                    padding: '16px', 
                    color: theme.colors.textSecondary,
                    fontSize: '13px',
                    fontWeight: '600',
                  }}>
                    Sales
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
                {filteredGames.map((game) => (
                  <tr 
                    key={game.id}
                    style={{ borderTop: `1px solid ${theme.colors.border}` }}
                  >
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '8px',
                          backgroundColor: theme.colors.surfaceLight,
                          backgroundImage: game.imageUrl ? `url(${game.imageUrl})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {!game.imageUrl && <FiPackage color={theme.colors.textSecondary} />}
                        </div>
                        <div>
                          <p style={{ color: theme.colors.text, fontWeight: '500' }}>
                            {game.title}
                          </p>
                          <p style={{ color: theme.colors.textSecondary, fontSize: '12px' }}>
                            {game.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: theme.colors.text }}>
                      {game.platform}
                    </td>
                    <td style={{ padding: '16px', color: theme.colors.textSecondary }}>
                      {game.genre}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <span style={{ color: theme.colors.success, fontWeight: '600' }}>
                        {formatCurrency(game.price)}
                      </span>
                      {game.originalPrice && game.originalPrice > game.price && (
                        <span style={{ 
                          color: theme.colors.textSecondary, 
                          textDecoration: 'line-through',
                          fontSize: '12px',
                          marginLeft: '8px',
                        }}>
                          {formatCurrency(game.originalPrice)}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {game.inStock ? (
                          <span style={{
                            fontSize: '11px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: `${theme.colors.success}20`,
                            color: theme.colors.success,
                          }}>
                            In Stock
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '11px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: `${theme.colors.error}20`,
                            color: theme.colors.error,
                          }}>
                            Out of Stock
                          </span>
                        )}
                        {game.isPreorder && (
                          <span style={{
                            fontSize: '11px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: `${theme.colors.warning}20`,
                            color: theme.colors.warning,
                          }}>
                            Preorder
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ 
                      padding: '16px', 
                      textAlign: 'center',
                      color: theme.colors.text,
                    }}>
                      {game.salesCount}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleEdit(game)}
                          style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: theme.colors.surfaceLight,
                            color: theme.colors.text,
                            cursor: 'pointer',
                          }}
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(game.id)}
                          style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: `${theme.colors.error}20`,
                            color: theme.colors.error,
                            cursor: 'pointer',
                          }}
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredGames.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ 
                      textAlign: 'center', 
                      padding: '60px',
                      color: theme.colors.textSecondary,
                    }}>
                      No games found
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
              className="admin-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: '16px',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflow: 'auto',
              }}
            >
              <div className="admin-modal-content" style={{
                padding: '24px',
                borderBottom: `1px solid ${theme.colors.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <h2 style={{ color: theme.colors.text, fontSize: '20px', fontWeight: '600' }}>
                  {editingGame ? 'Edit Game' : 'Add New Game'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: theme.colors.textSecondary,
                    cursor: 'pointer',
                    minHeight: '44px',
                    minWidth: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FiX size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="admin-modal-content" style={{ padding: '24px' }}>
                <div className="admin-form-grid" style={{ display: 'grid', gap: '20px' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      color: theme.colors.textSecondary, 
                      fontSize: '13px',
                      marginBottom: '8px',
                    }}>
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        color: theme.colors.textSecondary, 
                        fontSize: '13px',
                        marginBottom: '8px',
                      }}>
                        Slug
                      </label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="auto-generated"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        color: theme.colors.textSecondary, 
                        fontSize: '13px',
                        marginBottom: '8px',
                      }}>
                        Platform *
                      </label>
                      <select
                        required
                        value={formData.platform}
                        onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                        style={inputStyle}
                      >
                        <option value="PC">PC</option>
                        <option value="PlayStation">PlayStation</option>
                        <option value="Xbox">Xbox</option>
                        <option value="Nintendo">Nintendo</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      color: theme.colors.textSecondary, 
                      fontSize: '13px',
                      marginBottom: '8px',
                    }}>
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        color: theme.colors.textSecondary, 
                        fontSize: '13px',
                        marginBottom: '8px',
                      }}>
                        Price *
                      </label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        color: theme.colors.textSecondary, 
                        fontSize: '13px',
                        marginBottom: '8px',
                      }}>
                        Original Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      color: theme.colors.textSecondary, 
                      fontSize: '13px',
                      marginBottom: '8px',
                    }}>
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        color: theme.colors.textSecondary, 
                        fontSize: '13px',
                        marginBottom: '8px',
                      }}>
                        Genre
                      </label>
                      <input
                        type="text"
                        value={formData.genre}
                        onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        color: theme.colors.textSecondary, 
                        fontSize: '13px',
                        marginBottom: '8px',
                      }}>
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={Array.isArray(formData.tags) ? formData.tags.join(', ') : formData.tags}
                        onChange={(e) => {
                          const tagsArray = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                          setFormData({ ...formData, tags: tagsArray });
                        }}
                        placeholder="action, adventure, rpg"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      color: theme.colors.textSecondary, 
                      fontSize: '13px',
                      marginBottom: '8px',
                    }}>
                      Categories (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={Array.isArray(formData.categories) ? formData.categories.join(', ') : ''}
                      onChange={(e) => {
                        const categoriesArray = e.target.value.split(',').map(c => c.trim()).filter(Boolean);
                        setFormData({ ...formData, categories: categoriesArray });
                      }}
                      placeholder="new releases, best sellers, featured"
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        color: theme.colors.textSecondary, 
                        fontSize: '13px',
                        marginBottom: '8px',
                      }}>
                        Publisher
                      </label>
                      <input
                        type="text"
                        value={formData.publisher}
                        onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        color: theme.colors.textSecondary, 
                        fontSize: '13px',
                        marginBottom: '8px',
                      }}>
                        Developer
                      </label>
                      <input
                        type="text"
                        value={formData.developer}
                        onChange={(e) => setFormData({ ...formData, developer: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      color: theme.colors.textSecondary, 
                      fontSize: '13px',
                      marginBottom: '8px',
                    }}>
                      Release Date
                    </label>
                    <input
                      type="date"
                      value={formData.releaseDate}
                      onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '24px' }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      color: theme.colors.text,
                      cursor: 'pointer',
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.inStock}
                        onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: theme.colors.primary }}
                      />
                      In Stock
                    </label>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      color: theme.colors.text,
                      cursor: 'pointer',
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.isPreorder}
                        onChange={(e) => setFormData({ ...formData, isPreorder: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: theme.colors.primary }}
                      />
                      Preorder
                    </label>
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  gap: '12px',
                  marginTop: '32px',
                }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      ...buttonStyle,
                      backgroundColor: 'transparent',
                      border: `1px solid ${theme.colors.border}`,
                      color: theme.colors.text,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      ...buttonStyle,
                      backgroundColor: theme.colors.primary,
                      color: theme.colors.background,
                      opacity: saving ? 0.7 : 1,
                    }}
                  >
                    {saving ? 'Saving...' : (
                      <>
                        <FiCheck size={18} />
                        {editingGame ? 'Save Changes' : 'Create Game'}
                      </>
                    )}
                  </button>
                </div>
              </form>
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
              zIndex: 1000,
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
                padding: '32px',
                maxWidth: '400px',
                textAlign: 'center',
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: `${theme.colors.error}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <FiTrash2 size={24} color={theme.colors.error} />
              </div>
              <h3 style={{ color: theme.colors.text, fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                Delete Game?
              </h3>
              <p style={{ color: theme.colors.textSecondary, marginBottom: '24px' }}>
                This action cannot be undone. All associated data will be permanently removed.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  style={{
                    ...buttonStyle,
                    backgroundColor: 'transparent',
                    border: `1px solid ${theme.colors.border}`,
                    color: theme.colors.text,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  style={{
                    ...buttonStyle,
                    backgroundColor: theme.colors.error,
                    color: theme.colors.text,
                  }}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GamesPage;
