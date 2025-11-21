import { useState, useEffect, useCallback, useRef } from 'react'
import { Project, TimeEntry, ActiveTimer } from '@/lib/types'
import { GitHubDatabase, DatabaseData } from '@/services/githubDatabase'

const STORAGE_KEY = 'timesheet-data'
const TIMESTAMP_KEY = 'timesheet-timestamp'
const SHA_KEY = 'timesheet-sha'
const ACTIVE_TIMER_KEY = 'timesheet-active-timer'
const SYNC_INTERVAL = 30000 // 30 seconds

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

  const githubDbRef = useRef<GitHubDatabase | null>(null)
  const syncTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const pendingSyncRef = useRef(false)

  // Initialize GitHub database if configured
  useEffect(() => {
    const owner = import.meta.env.VITE_GITHUB_OWNER
    const repo = import.meta.env.VITE_GITHUB_REPO
    const token = import.meta.env.VITE_GITHUB_TOKEN

    if (owner && repo && token) {
      githubDbRef.current = new GitHubDatabase({ owner, repo, token })
      setIsConfigured(true)
    } else {
      console.warn('GitHub not configured. Add VITE_GITHUB_OWNER, VITE_GITHUB_REPO, and VITE_GITHUB_TOKEN to .env')
      setIsConfigured(false)
    }
  }, [])

  // Load data from localStorage
  const loadLocalData = useCallback((): DatabaseData => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load local data:', error)
    }
    return { projects: [], entries: [], lastModified: Date.now() }
  }, [])

  // Save data to localStorage
  const saveLocalData = useCallback((data: DatabaseData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      localStorage.setItem(TIMESTAMP_KEY, Date.now().toString())
    } catch (error) {
      console.error('Failed to save local data:', error)
    }
  }, [])

  // Sync to GitHub (debounced)
  const scheduleSyncToGitHub = useCallback(() => {
    if (!githubDbRef.current) return

    // Mark that we have a pending sync
    pendingSyncRef.current = true

    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    // Schedule sync
    syncTimeoutRef.current = setTimeout(() => {
      syncToGitHub()
    }, 2000) // 2 second debounce
  }, [])

  // Sync data to GitHub
  const syncToGitHub = useCallback(async () => {
    if (!githubDbRef.current || !pendingSyncRef.current) return

    try {
      setIsSyncing(true)
      setError(null) // Clear previous errors
      const data = loadLocalData()
      const sha = localStorage.getItem(SHA_KEY) || undefined

      const result = await githubDbRef.current.saveData(data, sha)
      
      // Update SHA for next sync
      if (result.sha) {
        localStorage.setItem(SHA_KEY, result.sha)
      }
      
      setLastSyncTime(Date.now())
      pendingSyncRef.current = false
      console.log('✓ Synced to GitHub')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Failed to sync to GitHub:', errorMessage)
      setError(`Failed to sync to GitHub: ${errorMessage}`)
      // Keep pending flag so it retries later
    } finally {
      setIsSyncing(false)
    }
  }, [loadLocalData])

  // Manual sync function
  const syncNow = useCallback(async () => {
    pendingSyncRef.current = true
    await syncToGitHub()
  }, [syncToGitHub])

  // Initialize: Load from localStorage and sync with GitHub
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true)
      try {
        // Load local data first (instant)
        const localData = loadLocalData()
        setProjects(localData.projects)
        setEntries(localData.entries)
        
        // Load active timer
        const storedTimer = localStorage.getItem(ACTIVE_TIMER_KEY)
        if (storedTimer) {
          setActiveTimerState(JSON.parse(storedTimer))
        }

        // If GitHub is configured, try to sync
        if (githubDbRef.current) {
          try {
            const remoteResult = await githubDbRef.current.getData()
            
            if (remoteResult) {
              const { data: remoteData, sha } = remoteResult
              const localTimestamp = parseInt(localStorage.getItem(TIMESTAMP_KEY) || '0')

              // Use remote data if it's newer
              if (remoteData.lastModified > localTimestamp) {
                setProjects(remoteData.projects)
                setEntries(remoteData.entries)
                saveLocalData(remoteData)
                localStorage.setItem(SHA_KEY, sha)
                console.log('✓ Synced from GitHub (remote was newer)')
              } else {
                // Local is newer or same, save SHA for next sync
                localStorage.setItem(SHA_KEY, sha)
                console.log('✓ Local data is up to date, using local version')
              }
              
              setLastSyncTime(Date.now())
            } else {
              // No remote data yet, will create on first sync
              console.log('No remote data found, will create on first save')
              // Trigger initial sync to create the file
              pendingSyncRef.current = true
              scheduleSyncToGitHub()
            }
          } catch (error) {
            console.warn('Could not sync from GitHub on startup:', error)
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            setError(`Working offline - could not sync with GitHub: ${errorMessage}`)
          }
        }
      } catch (error) {
        console.error('Failed to initialize:', error)
        setError('Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [loadLocalData, saveLocalData])

  // Periodic sync to GitHub
  useEffect(() => {
    if (!githubDbRef.current) return

    const interval = setInterval(() => {
      if (pendingSyncRef.current) {
        syncToGitHub()
      }
    }, SYNC_INTERVAL)

    return () => clearInterval(interval)
  }, [syncToGitHub])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [])

  // Helper to update data and trigger sync
  const updateData = useCallback(
    (updater: (data: DatabaseData) => DatabaseData) => {
      const currentData = { projects, entries, lastModified: Date.now() }
      const newData = updater(currentData)
      
      setProjects(newData.projects)
      setEntries(newData.entries)
      saveLocalData(newData)
      scheduleSyncToGitHub()
    },
    [projects, entries, saveLocalData, scheduleSyncToGitHub]
  )

  // Project operations
  const addProject = useCallback(
    async (project: Omit<Project, 'id'>) => {
      updateData((data) => ({
        ...data,
        projects: [...data.projects, { ...project, id: crypto.randomUUID() }],
      }))
    },
    [updateData]
  )

  const updateProject = useCallback(
    async (id: string, updates: Partial<Project>) => {
      updateData((data) => ({
        ...data,
        projects: data.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      }))
    },
    [updateData]
  )

  const deleteProject = useCallback(
    async (id: string) => {
      updateData((data) => ({
        ...data,
        projects: data.projects.filter((p) => p.id !== id),
        entries: data.entries.filter((e) => e.projectId !== id),
      }))
    },
    [updateData]
  )

  // Entry operations
  const addEntry = useCallback(
    async (entry: Omit<TimeEntry, 'id'>) => {
      updateData((data) => ({
        ...data,
        entries: [...data.entries, { ...entry, id: crypto.randomUUID() }],
      }))
    },
    [updateData]
  )

  const updateEntry = useCallback(
    async (id: string, updates: Partial<TimeEntry>) => {
      updateData((data) => ({
        ...data,
        entries: data.entries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      }))
    },
    [updateData]
  )

  const deleteEntry = useCallback(
    async (id: string) => {
      updateData((data) => ({
        ...data,
        entries: data.entries.filter((e) => e.id !== id),
      }))
    },
    [updateData]
  )

  // Active timer operations
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
