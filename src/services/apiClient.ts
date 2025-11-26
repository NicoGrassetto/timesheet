/**
 * API Client for Timesheet Backend
 * Provides typed HTTP methods for interacting with the Express API
 */

import { logger } from '@/lib/logger'
import type { Project, TimeEntry } from '@/lib/types'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

interface ApiError {
  error: string
}

class ApiClient {
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${API_BASE}${path}`
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      logger.api(method, path, response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' })) as ApiError
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T
      }

      return response.json()
    } catch (error) {
      logger.api(method, path, undefined, error)
      throw error
    }
  }

  // Health check
  async health(): Promise<{ status: string; timestamp: string }> {
    return this.request('GET', '/health')
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return this.request('GET', '/projects')
  }

  async getProject(id: string): Promise<Project> {
    return this.request('GET', `/projects/${id}`)
  }

  async createProject(project: Project): Promise<Project> {
    return this.request('POST', '/projects', project)
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    return this.request('PUT', `/projects/${id}`, updates)
  }

  async deleteProject(id: string): Promise<void> {
    return this.request('DELETE', `/projects/${id}`)
  }

  // Time Entries
  async getEntries(filters?: {
    startDate?: string
    endDate?: string
    projectId?: string
  }): Promise<TimeEntry[]> {
    const params = new URLSearchParams()
    if (filters?.startDate) params.set('startDate', filters.startDate)
    if (filters?.endDate) params.set('endDate', filters.endDate)
    if (filters?.projectId) params.set('projectId', filters.projectId)
    
    const queryString = params.toString()
    return this.request('GET', `/entries${queryString ? `?${queryString}` : ''}`)
  }

  async getEntry(id: string): Promise<TimeEntry> {
    return this.request('GET', `/entries/${id}`)
  }

  async createEntry(entry: TimeEntry): Promise<TimeEntry> {
    return this.request('POST', '/entries', entry)
  }

  async updateEntry(id: string, updates: Partial<TimeEntry>): Promise<TimeEntry> {
    return this.request('PUT', `/entries/${id}`, updates)
  }

  async deleteEntry(id: string): Promise<void> {
    return this.request('DELETE', `/entries/${id}`)
  }
}

export const apiClient = new ApiClient()
export default apiClient
