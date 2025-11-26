/**
 * Time Entries API routes
 * CRUD operations for time entry management
 */

import { Router, Request, Response } from 'express'
import { query } from '../db.js'
import { logger } from '../lib/logger.js'

const router = Router()

interface TimeEntry {
  id: string
  projectId: string
  task: string
  date: string
  hours: number
  startTime?: number
  endTime?: number
}

// GET /api/entries - List all entries (with optional date filters)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, projectId } = req.query
    
    let queryStr = 'SELECT id, projectId, task, date, hours, startTime, endTime FROM TimeEntries WHERE 1=1'
    const params: Record<string, unknown> = {}

    if (startDate) {
      queryStr += ' AND date >= @startDate'
      params.startDate = startDate
    }
    if (endDate) {
      queryStr += ' AND date <= @endDate'
      params.endDate = endDate
    }
    if (projectId) {
      queryStr += ' AND projectId = @projectId'
      params.projectId = projectId
    }

    queryStr += ' ORDER BY date DESC, createdAt DESC'

    const result = await query<TimeEntry>(queryStr, params)
    res.json(result.recordset)
  } catch (error) {
    logger.error('Failed to fetch entries', error)
    res.status(500).json({ error: 'Failed to fetch entries' })
  }
})

// GET /api/entries/:id - Get a single entry
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await query<TimeEntry>(
      'SELECT id, projectId, task, date, hours, startTime, endTime FROM TimeEntries WHERE id = @id',
      { id: req.params.id }
    )
    
    if (result.recordset.length === 0) {
      res.status(404).json({ error: 'Entry not found' })
      return
    }
    
    res.json(result.recordset[0])
  } catch (error) {
    logger.error('Failed to fetch entry', error)
    res.status(500).json({ error: 'Failed to fetch entry' })
  }
})

// POST /api/entries - Create a new entry
router.post('/', async (req: Request, res: Response) => {
  const { id, projectId, task, date, hours, startTime, endTime } = req.body

  if (!id || !projectId || !date || hours === undefined) {
    res.status(400).json({ error: 'Missing required fields: id, projectId, date, hours' })
    return
  }

  try {
    await query(
      `INSERT INTO TimeEntries (id, projectId, task, date, hours, startTime, endTime)
       VALUES (@id, @projectId, @task, @date, @hours, @startTime, @endTime)`,
      { 
        id, 
        projectId, 
        task: task || '', 
        date, 
        hours,
        startTime: startTime ?? null,
        endTime: endTime ?? null
      }
    )
    
    logger.info('Created time entry', { id, projectId, date, hours })
    res.status(201).json({ id, projectId, task, date, hours, startTime, endTime })
  } catch (error) {
    logger.error('Failed to create entry', error)
    res.status(500).json({ error: 'Failed to create entry' })
  }
})

// PUT /api/entries/:id - Update an entry
router.put('/:id', async (req: Request, res: Response) => {
  const { projectId, task, date, hours, startTime, endTime } = req.body
  const { id } = req.params

  try {
    const updates: string[] = []
    const params: Record<string, unknown> = { id }

    if (projectId !== undefined) {
      updates.push('projectId = @projectId')
      params.projectId = projectId
    }
    if (task !== undefined) {
      updates.push('task = @task')
      params.task = task
    }
    if (date !== undefined) {
      updates.push('date = @date')
      params.date = date
    }
    if (hours !== undefined) {
      updates.push('hours = @hours')
      params.hours = hours
    }
    if (startTime !== undefined) {
      updates.push('startTime = @startTime')
      params.startTime = startTime
    }
    if (endTime !== undefined) {
      updates.push('endTime = @endTime')
      params.endTime = endTime
    }
    updates.push('updatedAt = GETUTCDATE()')

    if (updates.length === 1) {
      res.status(400).json({ error: 'At least one field is required to update' })
      return
    }

    const result = await query(
      `UPDATE TimeEntries SET ${updates.join(', ')} WHERE id = @id`,
      params
    )

    if (result.rowsAffected[0] === 0) {
      res.status(404).json({ error: 'Entry not found' })
      return
    }

    logger.info('Updated time entry', { id })
    res.json({ id, ...req.body })
  } catch (error) {
    logger.error('Failed to update entry', error)
    res.status(500).json({ error: 'Failed to update entry' })
  }
})

// DELETE /api/entries/:id - Delete an entry
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await query(
      'DELETE FROM TimeEntries WHERE id = @id',
      { id: req.params.id }
    )

    if (result.rowsAffected[0] === 0) {
      res.status(404).json({ error: 'Entry not found' })
      return
    }

    logger.info('Deleted time entry', { id: req.params.id })
    res.status(204).send()
  } catch (error) {
    logger.error('Failed to delete entry', error)
    res.status(500).json({ error: 'Failed to delete entry' })
  }
})

export default router
