import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import express, { Express } from 'express'
import request from 'supertest'
import { projectsRouter } from './projects'

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

describe('Projects API', () => {
  let app: Express

  beforeEach(() => {
    vi.clearAllMocks()
    app = express()
    app.use(express.json())
    app.use('/api/projects', projectsRouter)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /api/projects', () => {
    it('should return all projects', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1', color: '#ff0000', rate: 100 },
        { id: '2', name: 'Project 2', color: '#00ff00', rate: 150 },
      ]

      const mockRequest = {
        input: vi.fn().mockReturnThis(),
        query: vi.fn().mockResolvedValue({ recordset: mockProjects }),
      }

      vi.mocked(getPool).mockReturnValue({
        request: vi.fn(() => mockRequest),
      } as any)

      const response = await request(app).get('/api/projects')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockProjects)
    })

    it('should handle database errors', async () => {
      const mockRequest = {
        input: vi.fn().mockReturnThis(),
        query: vi.fn().mockRejectedValue(new Error('Database error')),
      }

      vi.mocked(getPool).mockReturnValue({
        request: vi.fn(() => mockRequest),
      } as any)

      const response = await request(app).get('/api/projects')

      expect(response.status).toBe(500)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      const newProject = {
        id: '123',
        name: 'New Project',
        color: '#0000ff',
        rate: 200,
      }

      const mockRequest = {
        input: vi.fn().mockReturnThis(),
        query: vi.fn().mockResolvedValue({ rowsAffected: [1] }),
      }

      vi.mocked(getPool).mockReturnValue({
        request: vi.fn(() => mockRequest),
      } as any)

      const response = await request(app)
        .post('/api/projects')
        .send(newProject)
        .set('Content-Type', 'application/json')

      expect(response.status).toBe(201)
      expect(response.body).toEqual(newProject)
    })

    it('should return 400 for invalid project data', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({ name: '' }) // Missing required fields
        .set('Content-Type', 'application/json')

      expect(response.status).toBe(400)
    })
  })

  describe('PUT /api/projects/:id', () => {
    it('should update an existing project', async () => {
      const updatedProject = { name: 'Updated Project' }

      const mockRequest = {
        input: vi.fn().mockReturnThis(),
        query: vi.fn().mockResolvedValue({ rowsAffected: [1] }),
      }

      vi.mocked(getPool).mockReturnValue({
        request: vi.fn(() => mockRequest),
      } as any)

      const response = await request(app)
        .put('/api/projects/123')
        .send(updatedProject)
        .set('Content-Type', 'application/json')

      expect(response.status).toBe(200)
    })

    it('should return 404 for non-existent project', async () => {
      const mockRequest = {
        input: vi.fn().mockReturnThis(),
        query: vi.fn().mockResolvedValue({ rowsAffected: [0] }),
      }

      vi.mocked(getPool).mockReturnValue({
        request: vi.fn(() => mockRequest),
      } as any)

      const response = await request(app)
        .put('/api/projects/nonexistent')
        .send({ name: 'Updated' })
        .set('Content-Type', 'application/json')

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/projects/:id', () => {
    it('should delete a project and its entries', async () => {
      const mockRequest = {
        input: vi.fn().mockReturnThis(),
        query: vi.fn().mockResolvedValue({ rowsAffected: [1] }),
      }

      vi.mocked(getPool).mockReturnValue({
        request: vi.fn(() => mockRequest),
      } as any)

      const response = await request(app).delete('/api/projects/123')

      expect(response.status).toBe(204)
    })

    it('should return 404 for non-existent project', async () => {
      const mockRequest = {
        input: vi.fn().mockReturnThis(),
        query: vi.fn()
          .mockResolvedValueOnce({ rowsAffected: [0] }) // Delete entries
          .mockResolvedValueOnce({ rowsAffected: [0] }), // Delete project
      }

      vi.mocked(getPool).mockReturnValue({
        request: vi.fn(() => mockRequest),
      } as any)

      const response = await request(app).delete('/api/projects/nonexistent')

      expect(response.status).toBe(404)
    })
  })
})
