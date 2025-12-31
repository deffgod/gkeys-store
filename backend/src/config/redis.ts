import { createClient } from 'redis';

// Support both REDIS_URL and REDIS_GKEYS_REDIS_URL for flexibility
// REDIS_GKEYS_REDIS_URL takes precedence if both are set
const redisUrl =
  process.env.REDIS_GKEYS_REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({
  url: redisUrl,
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis connected');
});

// Connect to Redis
if (!redisClient.isOpen) {
  redisClient.connect().catch(console.error);
}

export default redisClient;
