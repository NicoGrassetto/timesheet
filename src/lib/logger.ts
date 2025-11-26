/**
 * Frontend logging utility
 * Provides consistent logging format with timestamps and log levels
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_STYLES: Record<LogLevel, string> = {
  debug: 'color: #06b6d4', // Cyan
  info: 'color: #22c55e',  // Green
  warn: 'color: #f59e0b',  // Yellow/Orange
  error: 'color: #ef4444', // Red
}

function formatTimestamp(): string {
  return new Date().toISOString()
}

export const logger = {
  debug(message: string, data?: unknown): void {
    if (import.meta.env.DEV) {
      console.log(`%c[${formatTimestamp()}] DEBUG`, LOG_STYLES.debug, message, data ?? '')
    }
  },

  info(message: string, data?: unknown): void {
    console.log(`%c[${formatTimestamp()}] INFO`, LOG_STYLES.info, message, data ?? '')
  },

  warn(message: string, data?: unknown): void {
    console.warn(`%c[${formatTimestamp()}] WARN`, LOG_STYLES.warn, message, data ?? '')
  },

  error(message: string, data?: unknown): void {
    console.error(`%c[${formatTimestamp()}] ERROR`, LOG_STYLES.error, message, data ?? '')
  },

  // Log API requests
  api(method: string, url: string, status?: number, error?: unknown): void {
    if (error) {
      this.error(`${method} ${url} failed`, error)
    } else if (status && status >= 400) {
      this.warn(`${method} ${url} ${status}`)
    } else {
      this.debug(`${method} ${url} ${status ?? ''}`)
    }
  },
}

export default logger
