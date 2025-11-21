import { useState, useEffect, useCallback } from 'react'
import { Project, TimeEntry, ActiveTimer } from '../lib/types'
import * as cosmosDb from '../services/cosmosDb'

// Hook for managing projects
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (cosmosDb.isCosmosDBAvailable()) {
        await cosmosDb.initializeDefaultProjects()
        const data = await cosmosDb.getProjects()
        setProjects(data)
      } else {
        // Fallback to local storage if Cosmos DB not configured
        const stored = localStorage.getItem('projects')
        const data = stored ? JSON.parse(stored) : []
        
        // Initialize with default projects if empty
        if (data.length === 0) {
          const defaultProjects: Project[] = [
            { id: crypto.randomUUID(), name: 'Development', color: '#3b82f6' },
            { id: crypto.randomUUID(), name: 'Meetings', color: '#8b5cf6' },
            { id: crypto.randomUUID(), name: 'Research', color: '#10b981' }
          ]
          localStorage.setItem('projects', JSON.stringify(defaultProjects))
          setProjects(defaultProjects)
        } else {
          setProjects(data)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
      console.error('Error loading projects:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const addProject = useCallback(async (project: Project) => {
    try {
      if (cosmosDb.isCosmosDBAvailable()) {
        const created = await cosmosDb.createProject(project)
        setProjects(prev => [created, ...prev])
      } else {
        const updated = [project, ...projects]
        localStorage.setItem('projects', JSON.stringify(updated))
        setProjects(updated)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add project')
      throw err
    }
  }, [projects])

  const updateProject = useCallback(async (project: Project) => {
    try {
      if (cosmosDb.isCosmosDBAvailable()) {
        const updated = await cosmosDb.updateProject(project)
        setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))
      } else {
        const updated = projects.map(p => p.id === project.id ? project : p)
        localStorage.setItem('projects', JSON.stringify(updated))
        setProjects(updated)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project')
      throw err
    }
  }, [projects])

  const deleteProject = useCallback(async (id: string) => {
    try {
      if (cosmosDb.isCosmosDBAvailable()) {
        await cosmosDb.deleteProject(id)
        setProjects(prev => prev.filter(p => p.id !== id))
      } else {
        const updated = projects.filter(p => p.id !== id)
        localStorage.setItem('projects', JSON.stringify(updated))
        setProjects(updated)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project')
      throw err
    }
  }, [projects])

  return {
    projects,
    loading,
    error,
    addProject,
    updateProject,
    deleteProject,
    refresh: loadProjects
  }
}

// Hook for managing time entries
export function useEntries() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (cosmosDb.isCosmosDBAvailable()) {
        const data = await cosmosDb.getEntries()
        setEntries(data)
      } else {
        const stored = localStorage.getItem('entries')
        setEntries(stored ? JSON.parse(stored) : [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entries')
      console.error('Error loading entries:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  const addEntry = useCallback(async (entry: TimeEntry) => {
    try {
      if (cosmosDb.isCosmosDBAvailable()) {
        const created = await cosmosDb.createEntry(entry)
        setEntries(prev => [created, ...prev])
      } else {
        const updated = [entry, ...entries]
        localStorage.setItem('entries', JSON.stringify(updated))
        setEntries(updated)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add entry')
      throw err
    }
  }, [entries])

  const updateEntry = useCallback(async (entry: TimeEntry) => {
    try {
      if (cosmosDb.isCosmosDBAvailable()) {
        const updated = await cosmosDb.updateEntry(entry)
        setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
      } else {
        const updated = entries.map(e => e.id === entry.id ? entry : e)
        localStorage.setItem('entries', JSON.stringify(updated))
        setEntries(updated)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update entry')
      throw err
    }
  }, [entries])

  const deleteEntry = useCallback(async (id: string, projectId: string) => {
    try {
      if (cosmosDb.isCosmosDBAvailable()) {
        await cosmosDb.deleteEntry(id, projectId)
        setEntries(prev => prev.filter(e => e.id !== id))
      } else {
        const updated = entries.filter(e => e.id !== id)
        localStorage.setItem('entries', JSON.stringify(updated))
        setEntries(updated)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry')
      throw err
    }
  }, [entries])

  return {
    entries,
    loading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    refresh: loadEntries
  }
}

// Hook for managing active timer
export function useActiveTimer() {
  const [activeTimer, setActiveTimerState] = useState<ActiveTimer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadActiveTimer = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (cosmosDb.isCosmosDBAvailable()) {
        const timer = await cosmosDb.getActiveTimer()
        setActiveTimerState(timer)
      } else {
        const stored = localStorage.getItem('active-timer')
        setActiveTimerState(stored ? JSON.parse(stored) : null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load active timer')
      console.error('Error loading active timer:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadActiveTimer()
  }, [loadActiveTimer])

  const setActiveTimer = useCallback(async (timer: ActiveTimer | null) => {
    try {
      if (cosmosDb.isCosmosDBAvailable()) {
        await cosmosDb.setActiveTimer(timer)
        setActiveTimerState(timer)
      } else {
        if (timer) {
          localStorage.setItem('active-timer', JSON.stringify(timer))
        } else {
          localStorage.removeItem('active-timer')
        }
        setActiveTimerState(timer)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set active timer')
      throw err
    }
  }, [])

  return {
    activeTimer,
    loading,
    error,
    setActiveTimer,
    refresh: loadActiveTimer
  }
}
