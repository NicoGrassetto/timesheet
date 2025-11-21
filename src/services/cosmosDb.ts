import { Project, TimeEntry, ActiveTimer } from '../lib/types'

// Backend API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Helper to check if backend API is available
export function isCosmosDBAvailable(): boolean {
  return true // Now using backend API
}

// Projects CRUD Operations
export async function getProjects(): Promise<Project[]> {
  if (!initializeClient() || !projectsContainer) {
    throw new Error('Cosmos DB not initialized')
  }

  try {
    const { resources } = await projectsContainer.items
      .query('SELECT * FROM c ORDER BY c._ts DESC')
      .fetchAll()
    return resources
  } catch (error) {
    console.error('Error fetching projects:', error)
    throw error
  }
}

export async function getProject(id: string): Promise<Project | null> {
  if (!initializeClient() || !projectsContainer) {
    throw new Error('Cosmos DB not initialized')
  }

  try {
    const { resource } = await projectsContainer.item(id, id).read<Project>()
    return resource || null
  } catch (error: any) {
    if (error.code === 404) {
      return null
    }
    console.error('Error fetching project:', error)
    throw error
  }
}

export async function createProject(project: Project): Promise<Project> {
  if (!initializeClient() || !projectsContainer) {
    throw new Error('Cosmos DB not initialized')
  }

  try {
    const { resource } = await projectsContainer.items.create(project)
    return resource as Project
  } catch (error) {
    console.error('Error creating project:', error)
    throw error
  }
}

export async function updateProject(project: Project): Promise<Project> {
  if (!initializeClient() || !projectsContainer) {
    throw new Error('Cosmos DB not initialized')
  }

  try {
    const { resource } = await projectsContainer
      .item(project.id, project.id)
      .replace(project)
    return resource as Project
  } catch (error) {
    console.error('Error updating project:', error)
    throw error
  }
}

export async function deleteProject(id: string): Promise<void> {
  if (!initializeClient() || !projectsContainer) {
    throw new Error('Cosmos DB not initialized')
  }

  try {
    await projectsContainer.item(id, id).delete()
  } catch (error) {
    console.error('Error deleting project:', error)
    throw error
  }
}

// Time Entries CRUD Operations
export async function getEntries(): Promise<TimeEntry[]> {
  if (!initializeClient() || !entriesContainer) {
    throw new Error('Cosmos DB not initialized')
  }

  try {
    const { resources } = await entriesContainer.items
      .query('SELECT * FROM c ORDER BY c.date DESC, c._ts DESC')
      .fetchAll()
    return resources
  } catch (error) {
    console.error('Error fetching entries:', error)
    throw error
  }
}

export async function getEntriesByProject(projectId: string): Promise<TimeEntry[]> {
  if (!initializeClient() || !entriesContainer) {
    throw new Error('Cosmos DB not initialized')
  }

  try {
    const { resources } = await entriesContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.projectId = @projectId ORDER BY c.date DESC',
        parameters: [{ name: '@projectId', value: projectId }]
      })
      .fetchAll()
    return resources
  } catch (error) {
    console.error('Error fetching entries by project:', error)
    throw error
  }
}

export async function getEntriesByDateRange(startDate: string, endDate: string): Promise<TimeEntry[]> {
  if (!initializeClient() || !entriesContainer) {
    throw new Error('Cosmos DB not initialized')
  }

  try {
    const { resources } = await entriesContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.date >= @startDate AND c.date <= @endDate ORDER BY c.date DESC',
        parameters: [
          { name: '@startDate', value: startDate },
          { name: '@endDate', value: endDate }
        ]
      })
      .fetchAll()
    return resources
  } catch (error) {
    console.error('Error fetching entries by date range:', error)
    throw error
  }
}

export async function createEntry(entry: TimeEntry): Promise<TimeEntry> {
  if (!initializeClient() || !entriesContainer) {
    throw new Error('Cosmos DB not initialized')
  }

  try {
    const { resource } = await entriesContainer.items.create(entry)
    return resource as TimeEntry
  } catch (error) {
    console.error('Error creating entry:', error)
    throw error
  }
}

export async function updateEntry(entry: TimeEntry): Promise<TimeEntry> {
  if (!initializeClient() || !entriesContainer) {
    throw new Error('Cosmos DB not initialized')
  }

  try {
    const { resource } = await entriesContainer
      .item(entry.id, entry.projectId)
      .replace(entry)
    return resource as TimeEntry
  } catch (error) {
    console.error('Error updating entry:', error)
    throw error
  }
}

export async function deleteEntry(id: string, projectId: string): Promise<void> {
  if (!initializeClient() || !entriesContainer) {
    throw new Error('Cosmos DB not initialized')
  }

  try {
    await entriesContainer.item(id, projectId).delete()
  } catch (error) {
    console.error('Error deleting entry:', error)
    throw error
  }
}

// Active Timer (stored as a special document in entries container)
const ACTIVE_TIMER_ID = 'active-timer-singleton'

export async function getActiveTimer(): Promise<ActiveTimer | null> {
  if (!initializeClient() || !entriesContainer) {
    throw new Error('Cosmos DB not initialized')
  }

  try {
    const { resource } = await entriesContainer
      .item(ACTIVE_TIMER_ID, ACTIVE_TIMER_ID)
      .read<{ id: string, timer: ActiveTimer }>()
    return resource?.timer || null
  } catch (error: any) {
    if (error.code === 404) {
      return null
    }
    console.error('Error fetching active timer:', error)
    throw error
  }
}

export async function setActiveTimer(timer: ActiveTimer | null): Promise<void> {
  if (!initializeClient() || !entriesContainer) {
    throw new Error('Cosmos DB not initialized')
  }

  try {
    if (timer === null) {
      // Delete the timer document
      try {
        await entriesContainer.item(ACTIVE_TIMER_ID, ACTIVE_TIMER_ID).delete()
      } catch (error: any) {
        if (error.code !== 404) {
          throw error
        }
      }
    } else {
      // Upsert the timer document
      await entriesContainer.items.upsert({
        id: ACTIVE_TIMER_ID,
        projectId: ACTIVE_TIMER_ID,
        timer
      })
    }
  } catch (error) {
    console.error('Error setting active timer:', error)
    throw error
  }
}

// Initialize default projects if none exist
export async function initializeDefaultProjects(): Promise<void> {
  if (!initializeClient() || !projectsContainer) {
    return
  }

  try {
    const projects = await getProjects()
    if (projects.length === 0) {
      const defaultProjects: Project[] = [
        { id: crypto.randomUUID(), name: 'Development', color: '#3b82f6' },
        { id: crypto.randomUUID(), name: 'Meetings', color: '#8b5cf6' },
        { id: crypto.randomUUID(), name: 'Research', color: '#10b981' }
      ]

      for (const project of defaultProjects) {
        await createProject(project)
      }
    }
  } catch (error) {
    console.error('Error initializing default projects:', error)
  }
}
