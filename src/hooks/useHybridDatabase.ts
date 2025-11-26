import { useState, useEffect, useCallback } from 'react'
import { Project, TimeEntry, ActiveTimer } from '@/lib/types'
import { apiClient } from '@/services/apiClient'
import { logger } from '@/lib/logger'

const ACTIVE_TIMER_KEY = 'timesheet-active-timer'

export interface UseHybridDatabaseReturn {
  projects: Project[]
  entries: TimeEntry[]
  activeTimer: ActiveTimer | null
  isLoading: boolean
  isSyncing: boolean
  lastSyncTime: number | null
  error: string | null
  addProject: (project: Omit<Project, 'id'>) => Promise<void>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  addEntry: (entry: Omit<TimeEntry, 'id'>) => Promise<void>
  updateEntry: (id: string, updates: Partial<TimeEntry>) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  setActiveTimer: (timer: ActiveTimer | null) => Promise<void>
  syncNow: () => Promise<void>
  isConfigured: boolean
}

export function useHybridDatabase(): UseHybridDatabaseReturn {
  const [projects, setProjects] = useState<Project[]>([])
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [activeTimer, setActiveTimerState] = useState<ActiveTimer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isConfigured, setIsConfigured] = useState(false)

  // Check API connection on mount
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      await apiClient.health()
      setIsConfigured(true)
      setError(null)
      return true
    } catch (err) {
      logger.warn('API not available', err)
      setIsConfigured(false)
      setError('Cannot connect to API server. Make sure the backend is running.')
      return false
    }
  }, [])

  // Load data from API
  const loadData = useCallback(async () => {
    try {
      setIsSyncing(true)
      const [projectsData, entriesData] = await Promise.all([
        apiClient.getProjects(),
        apiClient.getEntries(),
      ])
      setProjects(projectsData)
      setEntries(entriesData)
      setLastSyncTime(Date.now())
      setError(null)
      logger.info('Data loaded from API')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data'
      logger.error('Failed to load data from API', err)
      setError(message)
    } finally {
      setIsSyncing(false)
    }
  }, [])

  // Initialize: Check connection and load data
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true)
      
      // Load active timer from localStorage (not synced to DB)
      const storedTimer = localStorage.getItem(ACTIVE_TIMER_KEY)
      if (storedTimer) {
        try {
          setActiveTimerState(JSON.parse(storedTimer))
        } catch {
          localStorage.removeItem(ACTIVE_TIMER_KEY)
        }
      }

      // Check API connection and load data
      const connected = await checkConnection()
      if (connected) {
        await loadData()
      }
      
      setIsLoading(false)
    }

    initialize()
  }, [checkConnection, loadData])

  // Manual sync function
  const syncNow = useCallback(async () => {
    const connected = await checkConnection()
    if (connected) {
      await loadData()
    }
  }, [checkConnection, loadData])

  // Project operations
  const addProject = useCallback(async (project: Omit<Project, 'id'>) => {
    const newProject: Project = { ...project, id: crypto.randomUUID() }
    
    // Optimistic update
    setProjects((prev) => [...prev, newProject])
    
    try {
      await apiClient.createProject(newProject)
      setLastSyncTime(Date.now())
      logger.info('Project created', { id: newProject.id, name: newProject.name })
    } catch (err) {
      // Rollback on failure
      setProjects((prev) => prev.filter((p) => p.id !== newProject.id))
      const message = err instanceof Error ? err.message : 'Failed to create project'
      setError(message)
      throw err
    }
  }, [])

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    // Store previous state for rollback
    const previousProjects = projects
    
    // Optimistic update
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
    
    try {
      await apiClient.updateProject(id, updates)
      setLastSyncTime(Date.now())
      logger.info('Project updated', { id })
    } catch (err) {
      // Rollback on failure
      setProjects(previousProjects)
      const message = err instanceof Error ? err.message : 'Failed to update project'
      setError(message)
      throw err
    }
  }, [projects])

  const deleteProject = useCallback(async (id: string) => {
    // Store previous state for rollback
    const previousProjects = projects
    const previousEntries = entries
    
    // Optimistic update - also remove entries for this project
    setProjects((prev) => prev.filter((p) => p.id !== id))
    setEntries((prev) => prev.filter((e) => e.projectId !== id))
    
    try {
      await apiClient.deleteProject(id)
      setLastSyncTime(Date.now())
      logger.info('Project deleted', { id })
    } catch (err) {
      // Rollback on failure
      setProjects(previousProjects)
      setEntries(previousEntries)
      const message = err instanceof Error ? err.message : 'Failed to delete project'
      setError(message)
      throw err
    }
  }, [projects, entries])

  // Entry operations
  const addEntry = useCallback(async (entry: Omit<TimeEntry, 'id'>) => {
    const newEntry: TimeEntry = { ...entry, id: crypto.randomUUID() }
    
    // Optimistic update
    setEntries((prev) => [...prev, newEntry])
    
    try {
      await apiClient.createEntry(newEntry)
      setLastSyncTime(Date.now())
      logger.info('Entry created', { id: newEntry.id })
    } catch (err) {
      // Rollback on failure
      setEntries((prev) => prev.filter((e) => e.id !== newEntry.id))
      const message = err instanceof Error ? err.message : 'Failed to create entry'
      setError(message)
      throw err
    }
  }, [])

  const updateEntry = useCallback(async (id: string, updates: Partial<TimeEntry>) => {
    // Store previous state for rollback
    const previousEntries = entries
    
    // Optimistic update
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)))
    
    try {
      await apiClient.updateEntry(id, updates)
      setLastSyncTime(Date.now())
      logger.info('Entry updated', { id })
    } catch (err) {
      // Rollback on failure
      setEntries(previousEntries)
      const message = err instanceof Error ? err.message : 'Failed to update entry'
      setError(message)
      throw err
    }
  }, [entries])

  const deleteEntry = useCallback(async (id: string) => {
    // Store previous state for rollback
    const previousEntries = entries
    
    // Optimistic update
    setEntries((prev) => prev.filter((e) => e.id !== id))
    
    try {
      await apiClient.deleteEntry(id)
      setLastSyncTime(Date.now())
      logger.info('Entry deleted', { id })
    } catch (err) {
      // Rollback on failure
      setEntries(previousEntries)
      const message = err instanceof Error ? err.message : 'Failed to delete entry'
      setError(message)
      throw err
    }
  }, [entries])

  // Active timer operations (stored locally only)
  const setActiveTimer = useCallback(async (timer: ActiveTimer | null) => {
    setActiveTimerState(timer)
    if (timer) {
      localStorage.setItem(ACTIVE_TIMER_KEY, JSON.stringify(timer))
    } else {
      localStorage.removeItem(ACTIVE_TIMER_KEY)
    }
  }, [])

  return {
    projects,
    entries,
    activeTimer,
    isLoading,
    isSyncing,
    lastSyncTime,
    error,
    addProject,
    updateProject,
    deleteProject,
    addEntry,
    updateEntry,
    deleteEntry,
    setActiveTimer,
    syncNow,
    isConfigured,
  }
}
