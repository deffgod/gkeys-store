import redisClient from '../config/redis.js';

interface G2AMetrics {
  requests_total: number;
  requests_success: number;
  requests_error: number;
  requests_retry: number;
  webhook_total: number;
  webhook_valid: number;
  webhook_invalid: number;
  latency_ms: number[];
}

const METRICS_KEY = 'g2a:metrics';
const METRICS_TTL = 7 * 24 * 60 * 60; // 7 days

/**
 * Get current G2A metrics
 */
export const getG2AMetrics = async (): Promise<G2AMetrics> => {
  try {
    if (redisClient.isOpen) {
      const cached = await redisClient.get(METRICS_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    }
  } catch (err) {
    console.error('Error getting G2A metrics', err);
  }
  
  // Default metrics
  return {
    requests_total: 0,
    requests_success: 0,
    requests_error: 0,
    requests_retry: 0,
    webhook_total: 0,
    webhook_valid: 0,
    webhook_invalid: 0,
    latency_ms: [],
  };
};

/**
 * Increment metric counter
 */
export const incrementMetric = async (metric: keyof Omit<G2AMetrics, 'latency_ms'>): Promise<void> => {
  try {
    const metrics = await getG2AMetrics();
    metrics[metric] = (metrics[metric] as number) + 1;
    
    if (redisClient.isOpen) {
      await redisClient.setEx(METRICS_KEY, METRICS_TTL, JSON.stringify(metrics));
    }
  } catch (err) {
    console.error(`Error incrementing metric ${metric}`, err);
  }
};

/**
 * Record latency
 */
export const recordLatency = async (latencyMs: number): Promise<void> => {
  try {
    const metrics = await getG2AMetrics();
    metrics.latency_ms.push(latencyMs);
    
    // Keep only last 1000 latency measurements
    if (metrics.latency_ms.length > 1000) {
      metrics.latency_ms = metrics.latency_ms.slice(-1000);
    }
    
    if (redisClient.isOpen) {
      await redisClient.setEx(METRICS_KEY, METRICS_TTL, JSON.stringify(metrics));
    }
  } catch (err) {
    console.error('Error recording latency', err);
  }
};

/**
 * Get latency statistics
 */
export const getLatencyStats = async (): Promise<{
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
}> => {
  const metrics = await getG2AMetrics();
  const latencies = metrics.latency_ms.sort((a, b) => a - b);
  
  if (latencies.length === 0) {
    return { avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 };
  }
  
  const sum = latencies.reduce((a, b) => a + b, 0);
  const avg = sum / latencies.length;
  const min = latencies[0];
  const max = latencies[latencies.length - 1];
  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];
  
  return { avg, min, max, p50, p95, p99 };
};
