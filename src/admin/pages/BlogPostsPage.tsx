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
  FiEye,
  FiEyeOff,
  FiBold,
  FiItalic,
  FiLink,
  FiList,
  FiImage
} from 'react-icons/fi';
import { adminApi } from '../services/adminApi';
import type { BlogPostItem, BlogPostCreateInput } from '../services/adminApi';

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

interface BlogFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  imageUrl: string;
  category: string;
  tags: string;
  published: boolean;
}

const emptyForm: BlogFormData = {
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  imageUrl: '',
  category: '',
  tags: '',
  published: false,
};

const BlogPostsPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPostItem | null>(null);
  const [formData, setFormData] = useState<BlogFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const result = await adminApi.getBlogPosts(page, 20);
      setPosts(result.posts);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (err) {
      console.error('Failed to fetch blog posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page]);

  const handleCreate = () => {
    setEditingPost(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const handleEdit = async (post: BlogPostItem) => {
    try {
      // Fetch full blog post data
      const fullPost = await adminApi.getBlogPost(post.id);
      setEditingPost(post);
      setFormData({
        title: fullPost.title,
        slug: fullPost.slug,
        content: fullPost.content,
        excerpt: fullPost.excerpt,
        imageUrl: fullPost.coverImage || '',
        category: fullPost.category,
        tags: Array.isArray(fullPost.tags) ? fullPost.tags.join(', ') : '',
        published: fullPost.published,
      });
      setShowModal(true);
    } catch (err) {
      console.error('Failed to fetch blog post:', err);
      alert('Failed to load blog post data');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteBlogPost(id);
      setDeleteConfirm(null);
      fetchPosts();
    } catch (err) {
      console.error('Failed to delete blog post:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data: BlogPostCreateInput = {
        title: formData.title,
        slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-'),
        content: formData.content,
        excerpt: formData.excerpt,
        imageUrl: formData.imageUrl || undefined,
        category: formData.category,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        published: formData.published,
      };

      if (editingPost) {
        await adminApi.updateBlogPost(editingPost.id, data);
      } else {
        await adminApi.createBlogPost(data);
      }

      setShowModal(false);
      fetchPosts();
    } catch (err) {
      console.error('Failed to save blog post:', err);
    } finally {
      setSaving(false);
    }
  };

  const insertFormat = (format: string) => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    let newText = '';

    switch (format) {
      case 'bold':
        newText = `**${selectedText || 'text'}**`;
        break;
      case 'italic':
        newText = `*${selectedText || 'text'}*`;
        break;
      case 'link':
        newText = `[${selectedText || 'link text'}](url)`;
        break;
      case 'list':
        newText = `\n- ${selectedText || 'item'}\n`;
        break;
      case 'image':
        newText = `![${selectedText || 'alt text'}](image-url)`;
        break;
      case 'h2':
        newText = `\n## ${selectedText || 'Heading'}\n`;
        break;
      case 'h3':
        newText = `\n### ${selectedText || 'Subheading'}\n`;
        break;
      default:
        return;
    }

    const newContent = 
      formData.content.substring(0, start) + 
      newText + 
      formData.content.substring(end);
    
    setFormData({ ...formData, content: newContent });
  };

  const filteredPosts = search
    ? posts.filter(p => 
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
      )
    : posts;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
            Blog Posts
          </h1>
          <p style={{ color: theme.colors.textSecondary }}>
            {total} posts total
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
          New Post
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
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
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              ...inputStyle,
              paddingLeft: '44px',
            }}
          />
        </div>
      </div>

      {/* Posts Table */}
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
                    Title
                  </th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '16px', 
                    color: theme.colors.textSecondary,
                    fontSize: '13px',
                    fontWeight: '600',
                  }}>
                    Category
                  </th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '16px', 
                    color: theme.colors.textSecondary,
                    fontSize: '13px',
                    fontWeight: '600',
                  }}>
                    Author
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
                    textAlign: 'left', 
                    padding: '16px', 
                    color: theme.colors.textSecondary,
                    fontSize: '13px',
                    fontWeight: '600',
                  }}>
                    Date
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
                {filteredPosts.map((post) => (
                  <tr 
                    key={post.id}
                    style={{ borderTop: `1px solid ${theme.colors.border}` }}
                  >
                    <td style={{ padding: '16px' }}>
                      <div>
                        <p style={{ color: theme.colors.text, fontWeight: '500' }}>
                          {post.title}
                        </p>
                        <p style={{ 
                          color: theme.colors.textSecondary, 
                          fontSize: '12px',
                          marginTop: '4px',
                          maxWidth: '300px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {post.excerpt}
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        fontSize: '12px',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        backgroundColor: `${theme.colors.info}20`,
                        color: theme.colors.info,
                      }}>
                        {post.category}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: theme.colors.textSecondary }}>
                      {post.author}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      {post.published ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          backgroundColor: `${theme.colors.success}20`,
                          color: theme.colors.success,
                        }}>
                          <FiEye size={12} />
                          Published
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          backgroundColor: `${theme.colors.warning}20`,
                          color: theme.colors.warning,
                        }}>
                          <FiEyeOff size={12} />
                          Draft
                        </span>
                      )}
                    </td>
                    <td style={{ 
                      padding: '16px',
                      color: theme.colors.textSecondary,
                      fontSize: '13px',
                    }}>
                      {formatDate(post.createdAt)}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleEdit(post)}
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
                          onClick={() => setDeleteConfirm(post.id)}
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
                {filteredPosts.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ 
                      textAlign: 'center', 
                      padding: '60px',
                      color: theme.colors.textSecondary,
                    }}>
                      No posts found
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
              <div style={{
                padding: '24px',
                borderBottom: `1px solid ${theme.colors.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <h2 style={{ color: theme.colors.text, fontSize: '20px', fontWeight: '600' }}>
                  {editingPost ? 'Edit Post' : 'Create New Post'}
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

              <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gap: '20px' }}>
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
                        Category *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="e.g. News, Guide, Review"
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
                      Excerpt *
                    </label>
                    <textarea
                      required
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      rows={2}
                      placeholder="Brief description for post listings"
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      color: theme.colors.textSecondary, 
                      fontSize: '13px',
                      marginBottom: '8px',
                    }}>
                      Content * (Markdown supported)
                    </label>
                    
                    {/* Toolbar */}
                    <div style={{
                      display: 'flex',
                      gap: '4px',
                      padding: '8px',
                      backgroundColor: theme.colors.surfaceLight,
                      borderRadius: '8px 8px 0 0',
                      border: `1px solid ${theme.colors.border}`,
                      borderBottom: 'none',
                    }}>
                      <button
                        type="button"
                        onClick={() => insertFormat('bold')}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: theme.colors.text,
                          cursor: 'pointer',
                        }}
                        title="Bold"
                      >
                        <FiBold size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormat('italic')}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: theme.colors.text,
                          cursor: 'pointer',
                        }}
                        title="Italic"
                      >
                        <FiItalic size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormat('link')}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: theme.colors.text,
                          cursor: 'pointer',
                        }}
                        title="Link"
                      >
                        <FiLink size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormat('list')}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: theme.colors.text,
                          cursor: 'pointer',
                        }}
                        title="List"
                      >
                        <FiList size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormat('image')}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: theme.colors.text,
                          cursor: 'pointer',
                        }}
                        title="Image"
                      >
                        <FiImage size={16} />
                      </button>
                      <div style={{ 
                        borderLeft: `1px solid ${theme.colors.border}`, 
                        margin: '0 4px' 
                      }} />
                      <button
                        type="button"
                        onClick={() => insertFormat('h2')}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: theme.colors.text,
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '14px',
                        }}
                        title="Heading 2"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormat('h3')}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: theme.colors.text,
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '13px',
                        }}
                        title="Heading 3"
                      >
                        H3
                      </button>
                    </div>
                    
                    <textarea
                      id="content-editor"
                      required
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={12}
                      placeholder="Write your post content here..."
                      style={{ 
                        ...inputStyle, 
                        resize: 'vertical',
                        borderRadius: '0 0 8px 8px',
                        fontFamily: 'Monaco, Consolas, monospace',
                        fontSize: '13px',
                        lineHeight: '1.6',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      color: theme.colors.textSecondary, 
                      fontSize: '13px',
                      marginBottom: '8px',
                    }}>
                      Featured Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
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
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="news, updates, gaming"
                      style={inputStyle}
                    />
                  </div>

                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    color: theme.colors.text,
                    cursor: 'pointer',
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.published}
                      onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: theme.colors.primary }}
                    />
                    Publish immediately
                  </label>
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
                        {editingPost ? 'Save Changes' : 'Create Post'}
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
                Delete Post?
              </h3>
              <p style={{ color: theme.colors.textSecondary, marginBottom: '24px' }}>
                This action cannot be undone. The post will be permanently removed.
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

export default BlogPostsPage;
