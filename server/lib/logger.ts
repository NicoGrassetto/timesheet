/**
 * Server-side structured logging utility
 * Provides consistent logging format with timestamps and log levels
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: unknown
}

const LOG_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
}

const RESET = '\x1b[0m'

function formatLog(entry: LogEntry): string {
  const color = LOG_COLORS[entry.level]
  const levelStr = entry.level.toUpperCase().padEnd(5)
  const dataStr = entry.data !== undefined ? ` ${JSON.stringify(entry.data)}` : ''
  return `${color}[${entry.timestamp}] ${levelStr}${RESET} ${entry.message}${dataStr}`
}

function createLogEntry(level: LogLevel, message: string, data?: unknown): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
  }
}

export const logger = {
  debug(message: string, data?: unknown): void {
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(formatLog(createLogEntry('debug', message, data)))
    }
  },

  info(message: string, data?: unknown): void {
    console.log(formatLog(createLogEntry('info', message, data)))
  },

  warn(message: string, data?: unknown): void {
    console.warn(formatLog(createLogEntry('warn', message, data)))
  },

  error(message: string, data?: unknown): void {
    console.error(formatLog(createLogEntry('error', message, data)))
  },

  // Log HTTP requests
  request(method: string, path: string, statusCode: number, durationMs: number): void {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'
    this[level](`${method} ${path} ${statusCode} ${durationMs}ms`)
  },
}

export default logger
