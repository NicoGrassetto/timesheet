import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We need to reset modules to properly test the logger
describe('Logger', () => {
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>
    log: ReturnType<typeof vi.spyOn>
    warn: ReturnType<typeof vi.spyOn>
    error: ReturnType<typeof vi.spyOn>
  }

  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should export a logger object with expected methods', async () => {
    const { logger } = await import('./logger')
    
    expect(logger).toHaveProperty('debug')
    expect(logger).toHaveProperty('info')
    expect(logger).toHaveProperty('warn')
    expect(logger).toHaveProperty('error')
  })

  it('should log info messages', async () => {
    const { logger } = await import('./logger')
    
    logger.info('Test message', { key: 'value' })
    
    expect(consoleSpy.log).toHaveBeenCalled()
    const call = consoleSpy.log.mock.calls[0][0]
    expect(call).toContain('[INFO]')
    expect(call).toContain('Test message')
  })

  it('should log warning messages', async () => {
    const { logger } = await import('./logger')
    
    logger.warn('Warning message')
    
    expect(consoleSpy.warn).toHaveBeenCalled()
    const call = consoleSpy.warn.mock.calls[0][0]
    expect(call).toContain('[WARN]')
    expect(call).toContain('Warning message')
  })

  it('should log error messages', async () => {
    const { logger } = await import('./logger')
    
    logger.error('Error message', new Error('Test error'))
    
    expect(consoleSpy.error).toHaveBeenCalled()
    const call = consoleSpy.error.mock.calls[0][0]
    expect(call).toContain('[ERROR]')
    expect(call).toContain('Error message')
  })

  it('should include context data in log output', async () => {
    const { logger } = await import('./logger')
    
    logger.info('Message with context', { userId: '123', action: 'test' })
    
    expect(consoleSpy.log).toHaveBeenCalled()
    const call = consoleSpy.log.mock.calls[0][0]
    expect(call).toContain('userId')
    expect(call).toContain('123')
  })
})
