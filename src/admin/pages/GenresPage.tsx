import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiSearch,
  FiX,
  FiSave,
  FiMusic
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

interface Genre {
  id: string;
  name: string;
  slug: string;
  description?: string;
  gamesCount: number;
  createdAt: string;
  updatedAt: string;
}

const GenresPage: React.FC = () => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchGenres = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getGenres();
      setGenres(data);
    } catch (err) {
      console.error('Failed to fetch genres:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenres();
  }, []);

  const filteredGenres = genres.filter(genre =>
    genre.name.toLowerCase().includes(search.toLowerCase()) ||
    genre.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    setEditingGenre(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  const handleEdit = (genre: Genre) => {
    setEditingGenre(genre);
    setFormData({ name: genre.name, description: genre.description || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Name is required');
      return;
    }

    try {
      setSaving(true);
      if (editingGenre) {
        await adminApi.updateGenre(editingGenre.id, formData);
        alert('Genre updated successfully');
      } else {
        await adminApi.createGenre(formData);
        alert('Genre created successfully');
      }
      setShowModal(false);
      fetchGenres();
    } catch (err: any) {
      console.error('Failed to save genre:', err);
      alert(err?.response?.data?.error?.message || 'Failed to save genre');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this genre? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      await adminApi.deleteGenre(id);
      alert('Genre deleted successfully');
      setDeleteConfirm(null);
      fetchGenres();
    } catch (err: any) {
      console.error('Failed to delete genre:', err);
      alert(err?.response?.data?.error?.message || 'Failed to delete genre');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '32px',
      }}>
        <div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: theme.colors.text,
            marginBottom: '8px',
          }}>
            Genres Management
          </h1>
          <p style={{ color: theme.colors.textSecondary }}>
            {genres.length} genres total
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
          Create Genre
        </button>
      </div>

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
            placeholder="Search genres..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              ...inputStyle,
              paddingLeft: '48px',
            }}
          />
        </div>
      </div>

      {/* Genres List */}
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
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: '16px',
            overflow: 'hidden',
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                <th style={{ textAlign: 'left', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                  Name
                </th>
                <th style={{ textAlign: 'left', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                  Slug
                </th>
                <th style={{ textAlign: 'left', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                  Description
                </th>
                <th style={{ textAlign: 'center', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                  Games
                </th>
                <th style={{ textAlign: 'right', padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontWeight: '600' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredGenres.map((genre) => (
                <tr 
                  key={genre.id}
                  style={{ borderTop: `1px solid ${theme.colors.border}` }}
                >
                  <td style={{ padding: '16px', color: theme.colors.text, fontWeight: '500' }}>
                    {genre.name}
                  </td>
                  <td style={{ padding: '16px', color: theme.colors.textSecondary, fontSize: '13px', fontFamily: 'monospace' }}>
                    {genre.slug}
                  </td>
                  <td style={{ padding: '16px', color: theme.colors.textSecondary, fontSize: '13px' }}>
                    {genre.description || '—'}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', color: theme.colors.text }}>
                    {genre.gamesCount}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleEdit(genre)}
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
                        onClick={() => setDeleteConfirm(genre.id)}
                        disabled={genre.gamesCount > 0}
                        style={{
                          padding: '8px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: genre.gamesCount > 0 ? theme.colors.surface : `${theme.colors.error}20`,
                          color: genre.gamesCount > 0 ? theme.colors.textSecondary : theme.colors.error,
                          cursor: genre.gamesCount > 0 ? 'not-allowed' : 'pointer',
                          opacity: genre.gamesCount > 0 ? 0.5 : 1,
                        }}
                        title={genre.gamesCount > 0 ? 'Cannot delete genre with games' : 'Delete'}
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredGenres.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ 
                    textAlign: 'center', 
                    padding: '60px',
                    color: theme.colors.textSecondary,
                  }}>
                    {search ? 'No genres found' : 'No genres yet'}
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
                maxWidth: '500px',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ color: theme.colors.text, fontSize: '20px', fontWeight: '600' }}>
                  {editingGenre ? 'Edit Genre' : 'Create Genre'}
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
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Genre name"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Genre description (optional)"
                    rows={3}
                    style={{
                      ...inputStyle,
                      resize: 'vertical',
                    }}
                  />
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
                  disabled={saving || !formData.name.trim()}
                  style={{
                    ...buttonStyle,
                    backgroundColor: saving || !formData.name.trim() ? theme.colors.surface : theme.colors.primary,
                    color: saving || !formData.name.trim() ? theme.colors.textSecondary : theme.colors.background,
                    cursor: saving || !formData.name.trim() ? 'not-allowed' : 'pointer',
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
              zIndex: 1000,
              padding: '20px',
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
              <h3 style={{ color: theme.colors.error, fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                Delete Genre
              </h3>
              <p style={{ color: theme.colors.textSecondary, fontSize: '14px', marginBottom: '24px' }}>
                Are you sure you want to delete this genre? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  style={{
                    ...buttonStyle,
                    backgroundColor: theme.colors.surfaceLight,
                    color: theme.colors.text,
                    padding: '10px 20px',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={deleting}
                  style={{
                    ...buttonStyle,
                    backgroundColor: deleting ? theme.colors.surface : theme.colors.error,
                    color: deleting ? theme.colors.textSecondary : '#ffffff',
                    padding: '10px 20px',
                    cursor: deleting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {deleting ? 'Deleting...' : 'Delete Genre'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GenresPage;

