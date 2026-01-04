import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProfileLayout from '../components/profile/ProfileLayout';
import { ProfileStats } from '../components/profile/ProfileStats';
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
  },
};


export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const profileData = await userApi.getProfile();
        setProfile(profileData);
      } catch (err) {
        console.error('Failed to load profile:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
        setError(errorMessage);
        // Set default profile data to prevent UI breaking
        setProfile({
          id: '',
          email: '',
          nickname: 'Newbie Guy',
          firstName: null,
          lastName: null,
          avatar: null,
          createdAt: new Date().toISOString(),
          stats: {
            gamesPurchased: 0,
            totalSaved: 0,
            daysSinceRegistration: 0,
            emptyFieldsCount: 0,
          },
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Extract stats from profile
  const gamesPurchased = profile?.stats?.gamesPurchased || 0;
  const totalSaved = profile?.stats?.totalSaved || 0;
  const daysSinceRegistration = profile?.stats?.daysSinceRegistration || 0;
  const nickname = profile?.nickname || 'Newbie Guy';

  return (
    <ProfileLayout>
      {error ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px',
            color: '#FF4444',
            fontSize: '16px',
          }}
        >
          {error}
        </div>
      ) : (
        <>
          {/* Display nickname */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              textAlign: 'center',
              marginBottom: '32px',
            }}
          >
            <h1
              style={{
                fontSize: '32px',
                fontWeight: '700',
                color: theme.colors.text,
                margin: 0,
              }}
            >
              {nickname}
            </h1>
          </motion.div>

          {/* Display stats */}
          <ProfileStats
            gamesPurchased={gamesPurchased}
            totalSaved={totalSaved}
            daysSinceRegistration={daysSinceRegistration}
            loading={loading}
          />
        </>
      )}
    </ProfileLayout>
  );
}
