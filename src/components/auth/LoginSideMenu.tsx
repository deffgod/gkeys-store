import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { validateLoginForm } from '../../utils/authValidation';
import { getAuthErrorMessage } from '../../utils/authErrors';


const theme = {
  colors: {
    primary: '#00C8C2',
    primaryDark: '#00CC52',
    background: '#0D0D0D',
    surface: '#1A1A1A',
    surfaceLight: '#2A2A2A',
    text: '#FFFFFF',
    textSecondary: '#999999',
    textMuted: '#666666',
    border: '#333333',
    error: '#FF4444',
  },
};

const Icons = {
  X: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Eye: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  Mail: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  Lock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3, delay: 0.2 },
  },
};

const menuVariants = {
  hidden: {
    x: '100%',
  },
  visible: {
    x: 0,
    transition: {
      type: 'spring' as const,
      damping: 30,
      stiffness: 300,
    },
  },
  exit: {
    x: '100%',
    transition: {
      type: 'spring' as const,
      damping: 30,
      stiffness: 300,
    },
  },
};

interface LoginSideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister?: () => void;
}

export default function LoginSideMenu({ isOpen, onClose, onSwitchToRegister }: LoginSideMenuProps) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  // Prevent body scroll when menu is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const validationResult = validateLoginForm(formData.email, formData.password);
    setErrors(validationResult.errors);
    return validationResult.isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage('');

    try {
      await login(formData.email, formData.password);
      setSuccessMessage('Login successful!');
      
      // Migrate cart and wishlist after login
      try {
        const { cartApi } = await import('../../services/cartApi');
        const { wishlistApi } = await import('../../services/wishlistApi');
        await Promise.all([
          cartApi.migrateCart().catch(() => {}),
          wishlistApi.migrateWishlist().catch(() => {}),
        ]);
      } catch (migrationError) {
        console.warn('Cart/wishlist migration failed:', migrationError);
      }

      setTimeout(() => {
        onClose();
        navigate('/');
      }, 500);
    } catch (error: unknown) {
      const errorMessage = getAuthErrorMessage(error, 'Login failed. Please check your credentials.');
      setErrors({
        submit: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(4px)',
              zIndex: 1200,
            }}
          />

          {/* Side Menu Panel */}
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '400px',
              maxWidth: '90vw',
              backgroundColor: theme.colors.surface,
              zIndex: 1201,
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
              overflowY: 'auto',
              boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                }}
              >
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: theme.colors.text }}>
                  Log in
                </h2>
                <button
                  onClick={onClose}
                  style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.colors.surfaceLight,
                    border: 'none',
                    borderRadius: '8px',
                    color: theme.colors.text,
                    cursor: 'pointer',
                  }}
                  type="button"
                  aria-label="Close"
                >
                  <Icons.X />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Email Field */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  htmlFor="login-email"
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: theme.colors.text,
                    marginBottom: '8px',
                  }}
                >
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: theme.colors.textSecondary,
                    }}
                  >
                    <Icons.Mail />
                  </div>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 44px',
                      backgroundColor: theme.colors.background,
                      border: `1px solid ${errors.email ? theme.colors.error : theme.colors.border}`,
                      borderRadius: '8px',
                      color: theme.colors.text,
                      fontSize: '14px',
                      outline: 'none',
                    }}
                    required
                  />
                </div>
                {errors.email && (
                  <p style={{ color: theme.colors.error, fontSize: '12px', marginTop: '4px' }}>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  htmlFor="login-password"
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: theme.colors.text,
                    marginBottom: '8px',
                  }}
                >
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: theme.colors.textSecondary,
                    }}
                  >
                    <Icons.Lock />
                  </div>
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    style={{
                      width: '100%',
                      padding: '12px 44px 12px 44px',
                      backgroundColor: theme.colors.background,
                      border: `1px solid ${errors.password ? theme.colors.error : theme.colors.border}`,
                      borderRadius: '8px',
                      color: theme.colors.text,
                      fontSize: '14px',
                      outline: 'none',
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: theme.colors.textSecondary,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                  </button>
                </div>
                {errors.password && (
                  <p style={{ color: theme.colors.error, fontSize: '12px', marginTop: '4px' }}>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: theme.colors.textSecondary,
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer',
                    }}
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/forgot-password');
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: theme.colors.primary,
                    fontSize: '14px',
                    cursor: 'pointer',
                    textDecoration: 'none',
                  }}
                >
                  Forgot password?
                </button>
              </div>

              {/* Error Message */}
              {errors.submit && (
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: `${theme.colors.error}20`,
                    border: `1px solid ${theme.colors.error}`,
                    borderRadius: '8px',
                    color: theme.colors.error,
                    fontSize: '14px',
                    marginBottom: '20px',
                  }}
                >
                  {errors.submit}
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: `${theme.colors.primary}20`,
                    border: `1px solid ${theme.colors.primary}`,
                    borderRadius: '8px',
                    color: theme.colors.primary,
                    fontSize: '14px',
                    marginBottom: '20px',
                  }}
                >
                  {successMessage}
                </div>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: isSubmitting ? theme.colors.textMuted : theme.colors.primary,
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  marginBottom: '16px',
                }}
              >
                {isSubmitting ? 'Logging in...' : 'Log in'}
              </motion.button>

              {/* Switch to Register */}
              <div style={{ textAlign: 'center', marginTop: 'auto', paddingTop: '24px' }}>
                <p style={{ color: theme.colors.textSecondary, fontSize: '14px', marginBottom: '8px' }}>
                  Don't have an account?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onSwitchToRegister) {
                      onSwitchToRegister();
                    }
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: theme.colors.primary,
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Sign up
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
