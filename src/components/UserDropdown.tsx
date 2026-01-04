import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

const theme = {
  colors: {
    primary: '#00C8C2',
    background: '#0D0D0D',
    surface: '#1A1A1A',
    surfaceLight: '#2A2A2A',
    surfaceHover: '#333333',
    text: '#FFFFFF',
    textSecondary: '#999999',
    border: '#333333',
    error: '#FF4444',
  },
};

interface UserDropdownProps {
  userName: string;
  userAvatar?: string;
  onLogout: () => void;
}

const Icons = {
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  ShoppingBag: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  Heart: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  Wallet: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  ),
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3m15.364 6.364l-4.243-4.243m-6.364 0L3.636 17.364m12.728 0l-4.243-4.243m-6.364 0L3.636 6.636" />
    </svg>
  ),
  LogOut: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  ChevronDown: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
};

const dropdownVariants = {
  hidden: {
    opacity: 0,
    y: -10,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.15,
    },
  },
};

export default function UserDropdown({ userName, userAvatar, onLogout }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const menuItems = [
    { icon: <Icons.User />, label: 'Profile', path: '/profile/orders' },
    { icon: <Icons.ShoppingBag />, label: 'Orders', path: '/profile/orders' },
    { icon: <Icons.Heart />, label: 'Wishlist', path: '/wishlist' },
    { icon: <Icons.Wallet />, label: 'Balance', path: '/profile/balance' },
    // Settings button removed - page is empty
  ];

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* User Avatar Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '50px',
          color: theme.colors.text,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        {userAvatar ? (
          <img
            src={userAvatar}
            alt={userName}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: theme.colors.primary,
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
        )}
        <span style={{ fontSize: '14px', fontWeight: '500' }}>{userName}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <Icons.ChevronDown />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '240px',
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '12px',
              padding: '8px',
              zIndex: 1000,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Menu Items */}
            {menuItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: 'transparent',
                  borderRadius: '8px',
                  color: theme.colors.text,
                  textDecoration: 'none',
                  transition: 'background-color 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.surfaceLight;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {item.icon}
                <span style={{ fontSize: '14px' }}>{item.label}</span>
              </Link>
            ))}

            {/* Divider */}
            <div
              style={{
                height: '1px',
                backgroundColor: theme.colors.border,
                margin: '8px 0',
              }}
            />

            {/* Logout Button */}
            <button
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: theme.colors.error,
                textDecoration: 'none',
                transition: 'background-color 0.2s ease',
                cursor: 'pointer',
                fontSize: '14px',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.surfaceLight;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Icons.LogOut />
              <span>Log out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

