/**
 * Metrics collection for G2A Integration Client
 */

interface MetricData {
  count: number;
  lastValue?: number;
  lastUpdate: number;
}

class G2AMetrics {
  private metrics: Map<string, MetricData> = new Map();
  private enabled: boolean;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  increment(metric: string, value: number = 1): void {
    if (!this.enabled) return;

    const existing = this.metrics.get(metric);
    if (existing) {
      existing.count += value;
      existing.lastUpdate = Date.now();
    } else {
      this.metrics.set(metric, {
        count: value,
        lastUpdate: Date.now(),
      });
    }
  }

  set(metric: string, value: number): void {
    if (!this.enabled) return;

    const existing = this.metrics.get(metric);
    if (existing) {
      existing.lastValue = value;
      existing.lastUpdate = Date.now();
    } else {
      this.metrics.set(metric, {
        count: 0,
        lastValue: value,
        lastUpdate: Date.now(),
      });
    }
  }

  get(metric: string): MetricData | undefined {
    return this.metrics.get(metric);
  }

  getAll(): Record<string, MetricData> {
    const result: Record<string, MetricData> = {};
    this.metrics.forEach((data, key) => {
      result[key] = data;
    });
    return result;
  }

  reset(metric?: string): void {
    if (metric) {
      this.metrics.delete(metric);
    } else {
      this.metrics.clear();
    }
  }
}

export const createMetrics = (enabled?: boolean): G2AMetrics => {
  return new G2AMetrics(enabled);
};

export type { G2AMetrics, MetricData };
