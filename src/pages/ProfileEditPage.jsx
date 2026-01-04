import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProfileLayout from '../components/profile/ProfileLayout';
import { useAuth } from '../hooks/useAuth';
import { userApi } from '../services/userApi';

const theme = {
  colors: {
    primary: '#00C8C2',
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// Help icon
const HelpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <title>Help</title>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// Input field component
const InputField = ({ label, type = 'text', value, onChange, placeholder, disabled = false, helpText, id }) => {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        htmlFor={inputId}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          color: theme.colors.textSecondary,
          marginBottom: '8px',
        }}
      >
        {label}
        {helpText && (
          <span
            style={{
              cursor: 'help',
              color: theme.colors.textMuted,
              display: 'flex',
              alignItems: 'center',
            }}
            title={helpText}
          >
            <HelpIcon />
          </span>
        )}
      </label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '14px 16px',
          backgroundColor: theme.colors.surfaceLight,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '8px',
          color: disabled ? theme.colors.textMuted : theme.colors.text,
          fontSize: '14px',
          outline: 'none',
          boxSizing: 'border-box',
          cursor: disabled ? 'not-allowed' : 'text',
          transition: 'border-color 0.2s ease',
        }}
        onFocus={(e) => {
          if (!disabled) {
            e.target.style.borderColor = theme.colors.primary;
          }
        }}
        onBlur={(e) => {
          e.target.style.borderColor = theme.colors.border;
        }}
      />
    </div>
  );
};

export default function ProfileEditPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoadingProfile(true);
        const profileData = await userApi.getProfile();
        setProfile(profileData);
        setProfileForm({
          nickname: profileData.nickname || 'Newbie Guy',
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          email: profileData.email || '',
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, []);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    nickname: 'Newbie Guy',
    firstName: '',
    lastName: '',
    email: '',
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    repeatPassword: '',
  });

  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);

  const handleProfileChange = (field) => (e) => {
    setProfileForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // Calculate field completion counter (nickname, firstName, lastName)
  const completedFields = [
    profileForm.nickname && profileForm.nickname.trim() !== '' && profileForm.nickname !== 'Newbie Guy',
    profileForm.firstName && profileForm.firstName.trim() !== '',
    profileForm.lastName && profileForm.lastName.trim() !== '',
  ].filter(Boolean).length;
  
  const totalFields = 3;

  const handlePasswordChange = (field) => (e) => {
    setPasswordForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleProfileSubmit = async () => {
    // Validation
    if (!profileForm.nickname || profileForm.nickname.trim() === '' || profileForm.nickname === 'Newbie Guy') {
      setProfileMessage({ type: 'error', text: 'Please enter a valid nickname' });
      return;
    }

    setIsProfileSubmitting(true);
    setProfileMessage(null);

    try {
      const updatedProfile = await userApi.updateProfile({
        nickname: profileForm.nickname.trim() || undefined,
        firstName: profileForm.firstName?.trim() || undefined,
        lastName: profileForm.lastName?.trim() || undefined,
      });
      
      // Update local state
      setProfile(updatedProfile);
      setProfileForm({
        nickname: updatedProfile.nickname || 'Newbie Guy',
        firstName: updatedProfile.firstName || '',
        lastName: updatedProfile.lastName || '',
        email: updatedProfile.email || '',
      });
      
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setProfileMessage({ 
        type: 'error', 
        text: errorMessage
      });
    } finally {
      setIsProfileSubmitting(false);
    }
  };

  const handlePasswordSubmit = async () => {
    // Validation
    if (!passwordForm.oldPassword) {
      setPasswordMessage({ type: 'error', text: 'Please enter your current password' });
      return;
    }
    if (!passwordForm.newPassword) {
      setPasswordMessage({ type: 'error', text: 'Please enter a new password' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.repeatPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match!' });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 8 characters!' });
      return;
    }

    setIsPasswordSubmitting(true);
    setPasswordMessage(null);

    try {
      await userApi.changePassword({
        currentPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      
      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordForm({ oldPassword: '', newPassword: '', repeatPassword: '' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setPasswordMessage(null), 3000);
    } catch (err) {
      console.error('Failed to change password:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password';
      setPasswordMessage({ 
        type: 'error', 
        text: errorMessage
      });
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  return (
    <ProfileLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          maxWidth: '500px',
          margin: '0 auto',
        }}
      >
        {/* Profile Edit Section */}
        <motion.div variants={itemVariants}>
          <InputField
            label="Nickname"
            value={profileForm.nickname}
            onChange={handleProfileChange('nickname')}
            placeholder="Nickname"
          />
          <InputField
            label="First Name"
            value={profileForm.firstName}
            onChange={handleProfileChange('firstName')}
            placeholder="First Name"
          />
          <InputField
            label="Last Name"
            value={profileForm.lastName}
            onChange={handleProfileChange('lastName')}
            placeholder="Last Name"
          />
          <InputField
            label="Email"
            type="email"
            value={profileForm.email}
            disabled={true}
            placeholder="Email"
          />

          {/* Profile Message */}
          {profileMessage && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor:
                  profileMessage.type === 'success'
                    ? 'rgba(0, 200, 194, 0.1)'
                    : 'rgba(255, 68, 68, 0.1)',
                borderRadius: '8px',
                marginBottom: '16px',
                color: profileMessage.type === 'success' ? theme.colors.primary : theme.colors.error,
                fontSize: '14px',
              }}
            >
              {profileMessage.text}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            {/* Field Completion Counter */}
            <div
              style={{
                fontSize: '13px',
                color: theme.colors.textSecondary,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>Profile completion:</span>
              <span
                style={{
                  color: theme.colors.primary,
                  fontWeight: '600',
                }}
              >
                {completedFields}/{totalFields}
              </span>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleProfileSubmit}
              disabled={isProfileSubmitting || loadingProfile}
              type="button"
              style={{
                padding: '12px 48px',
                backgroundColor: theme.colors.primary,
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isProfileSubmitting || loadingProfile ? 'not-allowed' : 'pointer',
                opacity: isProfileSubmitting || loadingProfile ? 0.6 : 1,
              }}
            >
              {isProfileSubmitting ? 'Saving...' : loadingProfile ? 'Loading...' : 'Edit Profile'}
            </motion.button>
          </div>
        </motion.div>

        {/* Password Change Section */}
        <motion.div variants={itemVariants}>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: theme.colors.text,
              margin: '0 0 20px 0',
            }}
          >
            Change password
          </h2>
          <InputField
            label="Old Password"
            type="password"
            value={passwordForm.oldPassword}
            onChange={handlePasswordChange('oldPassword')}
            placeholder="Enter Old Password"
          />
          <InputField
            label="New Password"
            type="password"
            value={passwordForm.newPassword}
            onChange={handlePasswordChange('newPassword')}
            placeholder="Enter New Password"
            helpText="Password must be at least 6 characters"
          />
          <InputField
            label="Repeat New Password"
            type="password"
            value={passwordForm.repeatPassword}
            onChange={handlePasswordChange('repeatPassword')}
            placeholder="Repeat New Password"
          />

          {/* Password Message */}
          {passwordMessage && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor:
                  passwordMessage.type === 'success'
                    ? 'rgba(0, 200, 194, 0.1)'
                    : 'rgba(255, 68, 68, 0.1)',
                borderRadius: '8px',
                marginBottom: '16px',
                color: passwordMessage.type === 'success' ? theme.colors.primary : theme.colors.error,
                fontSize: '14px',
              }}
            >
              {passwordMessage.text}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePasswordSubmit}
              disabled={isPasswordSubmitting || !passwordForm.oldPassword || !passwordForm.newPassword}
              style={{
                padding: '12px 48px',
                backgroundColor: theme.colors.primary,
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                fontSize: '14px',
                fontWeight: '600',
                cursor:
                  isPasswordSubmitting || !passwordForm.oldPassword || !passwordForm.newPassword
                    ? 'not-allowed'
                    : 'pointer',
                opacity:
                  isPasswordSubmitting || !passwordForm.oldPassword || !passwordForm.newPassword
                    ? 0.6
                    : 1,
              }}
            >
              {isPasswordSubmitting ? 'Saving...' : 'Edit'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </ProfileLayout>
  );
}
