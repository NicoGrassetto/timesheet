/**
 * Express API Server for Timesheet Tracker
 * Connects to Azure SQL Database and provides REST API endpoints
 */

import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { initializeSchema, closePool } from './db.js'
import { logger } from './lib/logger.js'
import projectsRouter from './routes/projects.js'
import entriesRouter from './routes/entries.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}))
app.use(express.json())

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    logger.request(req.method, req.path, res.statusCode, duration)
  })
  next()
})

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api/projects', projectsRouter)
app.use('/api/entries', entriesRouter)

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' })
})

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', { message: err.message, stack: err.stack })
  res.status(500).json({ error: 'Internal server error' })
})

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down server...')
  await closePool()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

// Start server
async function start() {
  try {
    // Initialize database schema on startup
    await initializeSchema()
    
    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`)
      logger.info('API endpoints:')
      logger.info('  GET    /api/health')
      logger.info('  GET    /api/projects')
      logger.info('  POST   /api/projects')
      logger.info('  PUT    /api/projects/:id')
      logger.info('  DELETE /api/projects/:id')
      logger.info('  GET    /api/entries')
      logger.info('  POST   /api/entries')
      logger.info('  PUT    /api/entries/:id')
      logger.info('  DELETE /api/entries/:id')
    })
  } catch (error) {
    logger.error('Failed to start server', error)
    process.exit(1)
  }
}

start()
