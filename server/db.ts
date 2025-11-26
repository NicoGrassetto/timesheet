/**
 * Azure SQL Database connection and schema management
 * Uses mssql package with Azure AD authentication via DefaultAzureCredential
 */

import sql from 'mssql'
import { DefaultAzureCredential } from '@azure/identity'
import { logger } from './lib/logger.js'

// Azure AD scope for Azure SQL
const AZURE_SQL_SCOPE = 'https://database.windows.net/.default'

// Database configuration from environment variables
const getConfig = async (): Promise<sql.config> => {
  const server = process.env.DB_SERVER || ''
  const database = process.env.DB_NAME || 'timesheetdb'

  // Use Azure AD authentication
  const credential = new DefaultAzureCredential()
  const token = await credential.getToken(AZURE_SQL_SCOPE)

  return {
    server,
    database,
    authentication: {
      type: 'azure-active-directory-access-token',
      options: {
        token: token.token,
      },
    },
    options: {
      encrypt: true, // Required for Azure SQL
      trustServerCertificate: false,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  }
}

// Global connection pool
let pool: sql.ConnectionPool | null = null

/**
 * Get or create the database connection pool
 */
export async function getPool(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool
  }

  try {
    logger.info('Connecting to Azure SQL Database with Azure AD...')
    const config = await getConfig()
    pool = await sql.connect(config)
    logger.info('Connected to Azure SQL Database successfully')
    return pool
  } catch (error) {
    logger.error('Failed to connect to Azure SQL Database', error)
    throw error
  }
}

/**
 * Close the database connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close()
    pool = null
    logger.info('Database connection pool closed')
  }
}

/**
 * Initialize database schema - creates tables if they don't exist
 */
export async function initializeSchema(): Promise<void> {
  const pool = await getPool()
  
  logger.info('Initializing database schema...')

  // Create Projects table
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Projects')
    BEGIN
      CREATE TABLE Projects (
        id NVARCHAR(36) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        color NVARCHAR(7) NOT NULL,
        createdAt DATETIME2 DEFAULT GETUTCDATE(),
        updatedAt DATETIME2 DEFAULT GETUTCDATE()
      );
      CREATE INDEX IX_Projects_name ON Projects(name);
    END
  `)
  logger.info('Projects table ready')

  // Create TimeEntries table
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TimeEntries')
    BEGIN
      CREATE TABLE TimeEntries (
        id NVARCHAR(36) PRIMARY KEY,
        projectId NVARCHAR(36) NOT NULL,
        task NVARCHAR(500) NOT NULL,
        date NVARCHAR(10) NOT NULL,
        hours DECIMAL(10, 2) NOT NULL,
        startTime BIGINT NULL,
        endTime BIGINT NULL,
        createdAt DATETIME2 DEFAULT GETUTCDATE(),
        updatedAt DATETIME2 DEFAULT GETUTCDATE(),
        FOREIGN KEY (projectId) REFERENCES Projects(id) ON DELETE CASCADE
      );
      CREATE INDEX IX_TimeEntries_projectId ON TimeEntries(projectId);
      CREATE INDEX IX_TimeEntries_date ON TimeEntries(date);
    END
  `)
  logger.info('TimeEntries table ready')

  logger.info('Database schema initialization complete')
}

/**
 * Execute a query with parameters
 */
export async function query<T>(
  queryString: string,
  params?: Record<string, unknown>
): Promise<sql.IResult<T>> {
  const pool = await getPool()
  const request = pool.request()

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value)
    }
  }

  return request.query<T>(queryString)
}

export { sql }
