import { createClient } from 'redis';

// Support both REDIS_URL and REDIS_GKEYS_REDIS_URL for flexibility
// REDIS_GKEYS_REDIS_URL takes precedence if both are set
const redisUrl =
  process.env.REDIS_GKEYS_REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.warn('Redis: Max reconnection attempts reached, giving up');
        return false; // Stop reconnecting
      }
      return Math.min(retries * 100, 3000); // Exponential backoff, max 3s
    },
  },
});

// Handle Redis connection errors gracefully - prevent process crash
redisClient.on('error', (err: any) => {
  // Log error but don't crash the process
  console.warn('Redis Client Error (non-fatal):', err.message || err);
  if (err.code) {
    console.warn('Redis Error Code:', err.code);
  }
  // Don't throw - let the application continue without Redis
});

redisClient.on('connect', () => {
  console.log('✅ Redis connected');
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

redisClient.on('ready', () => {
  console.log('✅ Redis ready');
});

redisClient.on('end', () => {
  console.warn('⚠️  Redis connection ended');
});

// Connect to Redis with error handling
if (!redisClient.isOpen) {
  redisClient.connect().catch((err) => {
    // Don't crash if Redis is unavailable
    console.warn('Redis: Failed to connect (will retry automatically):', err.message || err);
  });
}

export default redisClient;
