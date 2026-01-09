import React, { useState, useEffect } from 'react';
import { colors, spacing, borderRadius } from '../../styles/design-tokens';

const theme = {
  colors: {
    primary: colors.primary,
    background: colors.background,
    surface: colors.surface,
    surfaceLight: colors.surfaceLight,
    text: colors.text,
    textSecondary: colors.textSecondary,
    border: colors.border,
    error: colors.error,
    success: colors.success,
  },
};

interface MenuItem {
  id: string;
  label: string;
  path: string;
  visible: boolean;
  order: number;
}

const MenuSettingsPage: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Загружаем настройки меню из localStorage
  useEffect(() => {
    loadMenuSettings();
  }, []);

  const loadMenuSettings = () => {
    const saved = localStorage.getItem('adminMenuSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMenuItems(parsed);
      } catch (e) {
        console.error('Failed to parse menu settings:', e);
        initializeDefaultMenu();
      }
    } else {
      initializeDefaultMenu();
    }
  };

  const initializeDefaultMenu = () => {
    const defaultItems: MenuItem[] = [
      { id: 'dashboard', label: 'Dashboard', path: '/admin', visible: true, order: 0 },
      { id: 'games', label: 'Games', path: '/admin/games', visible: true, order: 1 },
      { id: 'users', label: 'Users', path: '/admin/users', visible: true, order: 2 },
      { id: 'orders', label: 'Orders', path: '/admin/orders', visible: true, order: 3 },
      { id: 'blog', label: 'Blog Posts', path: '/admin/blog', visible: true, order: 4 },
      { id: 'transactions', label: 'Transactions', path: '/admin/transactions', visible: true, order: 5 },
      { id: 'payments', label: 'Payments', path: '/admin/payments', visible: true, order: 6 },
      { id: 'carts', label: 'Carts', path: '/admin/carts', visible: true, order: 7 },
      { id: 'wishlists', label: 'Wishlists', path: '/admin/wishlists', visible: true, order: 8 },
      { id: 'faqs', label: 'FAQs', path: '/admin/faqs', visible: true, order: 9 },
      { id: 'g2a', label: 'G2A Sync', path: '/admin/g2a', visible: true, order: 10 },
      { id: 'g2a-live-sync', label: 'G2A Live Sync', path: '/admin/g2a/live-sync', visible: true, order: 11 },
      { id: 'g2a-scripts', label: 'G2A Scripts', path: '/admin/g2a/scripts', visible: true, order: 12 },
      { id: 'g2a-offers', label: 'G2A Offers', path: '/admin/g2a/offers', visible: true, order: 13 },
      { id: 'g2a-reservations', label: 'G2A Reservations', path: '/admin/g2a/reservations', visible: true, order: 14 },
      { id: 'g2a-env-setup', label: 'G2A Env Setup', path: '/admin/g2a/env-setup', visible: true, order: 15 },
      { id: 'g2a-key-manager', label: 'G2A Key Manager', path: '/admin/g2a/key-manager', visible: true, order: 16 },
      { id: 'cache', label: 'Cache', path: '/admin/cache', visible: true, order: 17 },
      { id: 'categories', label: 'Categories', path: '/admin/categories', visible: true, order: 18 },
      { id: 'genres', label: 'Genres', path: '/admin/genres', visible: true, order: 19 },
      { id: 'platforms', label: 'Platforms', path: '/admin/platforms', visible: true, order: 20 },
      { id: 'tags', label: 'Tags', path: '/admin/tags', visible: true, order: 21 },
      { id: 'email-templates', label: 'Email Templates', path: '/admin/email-templates', visible: true, order: 22 },
      { id: 'email-settings', label: 'Email Settings', path: '/admin/email-settings', visible: true, order: 23 },
      { id: 'promo-codes', label: 'Promo Codes', path: '/admin/promo-codes', visible: true, order: 24 },
      { id: 'game-keys', label: 'Game Keys', path: '/admin/game-keys', visible: true, order: 25 },
      { id: 'menu-settings', label: 'Menu Settings', path: '/admin/menu-settings', visible: true, order: 26 },
    ];
    setMenuItems(defaultItems);
  };

  const saveMenuSettings = () => {
    localStorage.setItem('adminMenuSettings', JSON.stringify(menuItems));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // Перезагружаем страницу чтобы применить изменения
    window.location.reload();
  };

  const toggleVisibility = (id: string) => {
    setMenuItems(items =>
      items.map(item =>
        item.id === id ? { ...item, visible: !item.visible } : item
      )
    );
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const draggedIndex = menuItems.findIndex(item => item.id === draggedItem);
    const targetIndex = menuItems.findIndex(item => item.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newItems = [...menuItems];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);

    // Обновляем порядок
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      order: index,
    }));

    setMenuItems(updatedItems);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const resetToDefault = () => {
    if (window.confirm('Are you sure you want to reset menu settings to default?')) {
      localStorage.removeItem('adminMenuSettings');
      initializeDefaultMenu();
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        window.location.reload();
      }, 1000);
    }
  };

  const sortedItems = [...menuItems].sort((a, b) => a.order - b.order);

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: spacing.lg,
    },
    header: {
      marginBottom: spacing.xl,
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: spacing.sm,
    },
    description: {
      color: theme.colors.textSecondary,
      fontSize: '14px',
    },
    actions: {
      display: 'flex',
      gap: spacing.md,
      marginBottom: spacing.lg,
      flexWrap: 'wrap' as const,
    },
    button: {
      padding: `${spacing.sm} ${spacing.md}`,
      borderRadius: borderRadius.md,
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.2s ease',
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
      color: '#000',
    },
    resetButton: {
      backgroundColor: 'transparent',
      color: theme.colors.text,
      border: `1px solid ${theme.colors.border}`,
    },
    successMessage: {
      backgroundColor: theme.colors.success,
      color: '#000',
      padding: `${spacing.sm} ${spacing.md}`,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
      fontSize: '14px',
      fontWeight: '600',
    },
    list: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.lg,
      border: `1px solid ${theme.colors.border}`,
      overflow: 'hidden',
    },
    item: (isDragging: boolean, isOver: boolean) => ({
      display: 'flex',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderBottom: `1px solid ${theme.colors.border}`,
      backgroundColor: isDragging
        ? theme.colors.surfaceLight
        : isOver
        ? theme.colors.surfaceLight
        : 'transparent',
      cursor: 'move',
      transition: 'all 0.2s ease',
      opacity: isDragging ? 0.5 : 1,
    }),
    dragHandle: {
      display: 'flex',
      alignItems: 'center',
      color: theme.colors.textSecondary,
      cursor: 'grab',
      fontSize: '18px',
      userSelect: 'none' as const,
    },
    itemInfo: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '4px',
    },
    itemLabel: {
      color: theme.colors.text,
      fontSize: '14px',
      fontWeight: '500',
    },
    itemPath: {
      color: theme.colors.textSecondary,
      fontSize: '12px',
    },
    toggle: {
      position: 'relative' as const,
      width: '44px',
      height: '24px',
      borderRadius: '12px',
      backgroundColor: theme.colors.border,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    toggleActive: {
      backgroundColor: theme.colors.primary,
    },
    toggleThumb: (active: boolean) => ({
      position: 'absolute' as const,
      top: '2px',
      left: active ? '22px' : '2px',
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      backgroundColor: '#fff',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    }),
    emptyState: {
      padding: spacing.xl,
      textAlign: 'center' as const,
      color: theme.colors.textSecondary,
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Menu Settings</h1>
        <p style={styles.description}>
          Customize your admin menu by reordering items and hiding/showing menu entries.
          Drag items to reorder them.
        </p>
      </div>

      {saved && (
        <div style={styles.successMessage}>
          ✓ Settings saved successfully! Page will reload...
        </div>
      )}

      <div style={styles.actions}>
        <button
          style={{ ...styles.button, ...styles.saveButton }}
          onClick={saveMenuSettings}
        >
          Save Changes
        </button>
        <button
          style={{ ...styles.button, ...styles.resetButton }}
          onClick={resetToDefault}
        >
          Reset to Default
        </button>
      </div>

      <div style={styles.list}>
        {sortedItems.length === 0 ? (
          <div style={styles.emptyState}>No menu items found</div>
        ) : (
          sortedItems.map((item, index) => {
            const isDragging = draggedItem === item.id;
            return (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, item.id)}
                onDragEnd={handleDragEnd}
                style={styles.item(isDragging, false)}
              >
                <div style={styles.dragHandle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="5" r="1"/>
                    <circle cx="9" cy="12" r="1"/>
                    <circle cx="9" cy="19" r="1"/>
                    <circle cx="15" cy="5" r="1"/>
                    <circle cx="15" cy="12" r="1"/>
                    <circle cx="15" cy="19" r="1"/>
                  </svg>
                </div>
                <div style={styles.itemInfo}>
                  <div style={styles.itemLabel}>{item.label}</div>
                  <div style={styles.itemPath}>{item.path}</div>
                </div>
                <div
                  style={{
                    ...styles.toggle,
                    ...(item.visible ? styles.toggleActive : {}),
                  }}
                  onClick={() => toggleVisibility(item.id)}
                >
                  <div style={styles.toggleThumb(item.visible)} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MenuSettingsPage;
