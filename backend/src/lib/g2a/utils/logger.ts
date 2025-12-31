/**
 * Structured logger for G2A Integration Client
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class G2ALogger {
  private maskSecrets: boolean;
  private level: LogLevel;

  constructor(level: LogLevel = 'info', maskSecrets: boolean = true) {
    this.level = level;
    this.maskSecrets = maskSecrets;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.level);
    const targetLevelIndex = levels.indexOf(level);
    return targetLevelIndex >= currentLevelIndex;
  }

  private maskSensitiveData(data: LogContext): LogContext {
    if (!this.maskSecrets) return data;

    const masked = { ...data };
    const sensitiveKeys = ['apiKey', 'apiHash', 'token', 'authorization', 'password', 'secret'];

    for (const key in masked) {
      if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
        masked[key] = '[REDACTED]';
      }
    }

    return masked;
  }

  private formatLog(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const maskedContext = context ? this.maskSensitiveData(context) : undefined;
    const contextStr = maskedContext ? ` ${JSON.stringify(maskedContext)}` : '';
    return `[G2A Client] [${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatLog('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.log(this.formatLog('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatLog('warn', message, context));
    }
  }

  error(message: string, context?: LogContext | Error): void {
    if (this.shouldLog('error')) {
      if (context instanceof Error) {
        console.error(
          this.formatLog('error', message, {
            error: context.message,
            stack: context.stack,
          })
        );
      } else {
        console.error(this.formatLog('error', message, context));
      }
    }
  }
}

export const createLogger = (level?: LogLevel, maskSecrets?: boolean): G2ALogger => {
  return new G2ALogger(level, maskSecrets);
};

export type { G2ALogger, LogLevel, LogContext };
