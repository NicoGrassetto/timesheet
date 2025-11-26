import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import express, { Express } from 'express'
import request from 'supertest'
import { entriesRouter } from './entries'

// Mock the database module
vi.mock('../db', () => ({
  getPool: vi.fn(() => ({
    request: vi.fn(() => ({
      input: vi.fn().mockReturnThis(),
      query: vi.fn(),
    })),
  })),
}))

import { getPool } from '../db'

describe('Entries API', () => {
  let app: Express

  beforeEach(() => {
    vi.clearAllMocks()
    app = express()
    app.use(express.json())
    app.use('/api/entries', entriesRouter)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /api/entries', () => {
    it('should return all entries', async () => {
      const mockEntries = [
        {
          id: '1',
          projectId: 'proj-1',
          date: '2024-01-15',
          hours: 8,
          description: 'Work on feature',
        },
        {
          id: '2',
          projectId: 'proj-1',
          date: '2024-01-16',
          hours: 4,
          description: 'Bug fixes',
        },
      ]

      const mockRequest = {
        input: vi.fn().mockReturnThis(),
        query: vi.fn().mockResolvedValue({ recordset: mockEntries }),
      }

      vi.mocked(getPool).mockReturnValue({
        request: vi.fn(() => mockRequest),
      } as any)

      const response = await request(app).get('/api/entries')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockEntries)
    })

    it('should filter entries by projectId', async () => {
      const mockEntries = [
        { id: '1', projectId: 'proj-1', date: '2024-01-15', hours: 8 },
      ]

      const mockRequest = {
        input: vi.fn().mockReturnThis(),
        query: vi.fn().mockResolvedValue({ recordset: mockEntries }),
      }

      vi.mocked(getPool).mockReturnValue({
        request: vi.fn(() => mockRequest),
      } as any)

      const response = await request(app).get('/api/entries?projectId=proj-1')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockEntries)
    })
  })

  describe('POST /api/entries', () => {
    it('should create a new entry', async () => {
      const newEntry = {
        id: '123',
        projectId: 'proj-1',
        date: '2024-01-15',
        hours: 8,
        description: 'New work',
      }

      const mockRequest = {
        input: vi.fn().mockReturnThis(),
        query: vi.fn().mockResolvedValue({ rowsAffected: [1] }),
      }

      vi.mocked(getPool).mockReturnValue({
        request: vi.fn(() => mockRequest),
      } as any)

      const response = await request(app)
        .post('/api/entries')
        .send(newEntry)
        .set('Content-Type', 'application/json')

      expect(response.status).toBe(201)
      expect(response.body).toEqual(newEntry)
    })

    it('should return 400 for invalid entry data', async () => {
      const response = await request(app)
        .post('/api/entries')
        .send({ projectId: '' }) // Missing required fields
        .set('Content-Type', 'application/json')

      expect(response.status).toBe(400)
    })
  })

  describe('PUT /api/entries/:id', () => {
    it('should update an existing entry', async () => {
      const updatedEntry = { hours: 6, description: 'Updated work' }

      const mockRequest = {
        input: vi.fn().mockReturnThis(),
        query: vi.fn().mockResolvedValue({ rowsAffected: [1] }),
      }

      vi.mocked(getPool).mockReturnValue({
        request: vi.fn(() => mockRequest),
      } as any)

      const response = await request(app)
        .put('/api/entries/123')
        .send(updatedEntry)
        .set('Content-Type', 'application/json')

      expect(response.status).toBe(200)
    })

    it('should return 404 for non-existent entry', async () => {
      const mockRequest = {
        input: vi.fn().mockReturnThis(),
        query: vi.fn().mockResolvedValue({ rowsAffected: [0] }),
      }

      vi.mocked(getPool).mockReturnValue({
        request: vi.fn(() => mockRequest),
      } as any)

      const response = await request(app)
        .put('/api/entries/nonexistent')
        .send({ hours: 6 })
        .set('Content-Type', 'application/json')

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/entries/:id', () => {
    it('should delete an entry', async () => {
      const mockRequest = {
        input: vi.fn().mockReturnThis(),
        query: vi.fn().mockResolvedValue({ rowsAffected: [1] }),
      }

      vi.mocked(getPool).mockReturnValue({
        request: vi.fn(() => mockRequest),
      } as any)

      const response = await request(app).delete('/api/entries/123')

      expect(response.status).toBe(204)
    })

    it('should return 404 for non-existent entry', async () => {
      const mockRequest = {
        input: vi.fn().mockReturnThis(),
        query: vi.fn().mockResolvedValue({ rowsAffected: [0] }),
      }

      vi.mocked(getPool).mockReturnValue({
        request: vi.fn(() => mockRequest),
      } as any)

      const response = await request(app).delete('/api/entries/nonexistent')

      expect(response.status).toBe(404)
    })
  })
})
