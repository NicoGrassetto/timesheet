/**
 * Projects API routes
 * CRUD operations for project management
 */

import { Router, Request, Response } from 'express'
import { query } from '../db.js'
import { logger } from '../lib/logger.js'

const router = Router()

interface Project {
  id: string
  name: string
  color: string
}

// GET /api/projects - List all projects
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await query<Project>('SELECT id, name, color FROM Projects ORDER BY name')
    res.json(result.recordset)
  } catch (error) {
    logger.error('Failed to fetch projects', error)
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

// GET /api/projects/:id - Get a single project
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await query<Project>(
      'SELECT id, name, color FROM Projects WHERE id = @id',
      { id: req.params.id }
    )
    
    if (result.recordset.length === 0) {
      res.status(404).json({ error: 'Project not found' })
      return
    }
    
    res.json(result.recordset[0])
  } catch (error) {
    logger.error('Failed to fetch project', error)
    res.status(500).json({ error: 'Failed to fetch project' })
  }
})

// POST /api/projects - Create a new project
router.post('/', async (req: Request, res: Response) => {
  const { id, name, color } = req.body

  if (!id || !name || !color) {
    res.status(400).json({ error: 'Missing required fields: id, name, color' })
    return
  }

  try {
    await query(
      `INSERT INTO Projects (id, name, color) VALUES (@id, @name, @color)`,
      { id, name, color }
    )
    
    logger.info('Created project', { id, name })
    res.status(201).json({ id, name, color })
  } catch (error) {
    logger.error('Failed to create project', error)
    res.status(500).json({ error: 'Failed to create project' })
  }
})

// PUT /api/projects/:id - Update a project
router.put('/:id', async (req: Request, res: Response) => {
  const { name, color } = req.body
  const { id } = req.params

  if (!name && !color) {
    res.status(400).json({ error: 'At least one field (name or color) is required' })
    return
  }

  try {
    const updates: string[] = []
    const params: Record<string, unknown> = { id }

    if (name) {
      updates.push('name = @name')
      params.name = name
    }
    if (color) {
      updates.push('color = @color')
      params.color = color
    }
    updates.push('updatedAt = GETUTCDATE()')

    const result = await query(
      `UPDATE Projects SET ${updates.join(', ')} WHERE id = @id`,
      params
    )

    if (result.rowsAffected[0] === 0) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    logger.info('Updated project', { id })
    res.json({ id, ...req.body })
  } catch (error) {
    logger.error('Failed to update project', error)
    res.status(500).json({ error: 'Failed to update project' })
  }
})

// DELETE /api/projects/:id - Delete a project
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await query(
      'DELETE FROM Projects WHERE id = @id',
      { id: req.params.id }
    )

    if (result.rowsAffected[0] === 0) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    logger.info('Deleted project', { id: req.params.id })
    res.status(204).send()
  } catch (error) {
    logger.error('Failed to delete project', error)
    res.status(500).json({ error: 'Failed to delete project' })
  }
})

export default router
