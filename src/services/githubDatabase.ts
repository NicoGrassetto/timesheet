import { Project, TimeEntry } from '@/lib/types'

export interface GitHubConfig {
  owner: string
  repo: string
  token: string
  branch?: string
  dataPath?: string
}

export interface DatabaseData {
  projects: Project[]
  entries: TimeEntry[]
  lastModified: number
}

export class GitHubDatabase {
  private owner: string
  private repo: string
  private token: string
  private branch: string
  private dataPath: string
  private apiBase = 'https://api.github.com'

  constructor(config: GitHubConfig) {
    this.owner = config.owner
    this.repo = config.repo
    this.token = config.token
    this.branch = config.branch || 'main'
    this.dataPath = config.dataPath || 'data/timesheet.json'
  }

  /**
   * Fetch data from GitHub repository
   */
  async getData(): Promise<{ data: DatabaseData; sha: string } | null> {
    try {
      const response = await fetch(
        `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/${this.dataPath}?ref=${this.branch}`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      )

      if (response.status === 404) {
        // File doesn't exist yet
        return null
      }

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`)
      }

      const fileData = await response.json()
      const content = atob(fileData.content.replace(/\n/g, ''))
      const data = JSON.parse(content) as DatabaseData

      return { data, sha: fileData.sha }
    } catch (error) {
      console.error('Failed to fetch from GitHub:', error)
      throw error
    }
  }

  /**
   * Save data to GitHub repository
   */
  async saveData(data: DatabaseData, sha?: string): Promise<{ sha: string }> {
    try {
      const content = btoa(JSON.stringify(data, null, 2))
      const timestamp = new Date().toISOString()

      const body: any = {
        message: `Update timesheet data - ${timestamp}`,
        content,
        branch: this.branch,
      }

      // Include SHA if updating existing file
      if (sha) {
        body.sha = sha
      }

      const response = await fetch(
        `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/${this.dataPath}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            Accept: 'application/vnd.github.v3+json',
          },
          body: JSON.stringify(body),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `GitHub API error: ${response.status}`
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage += ` - ${errorJson.message || errorText}`
        } catch {
          errorMessage += ` - ${errorText}`
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      return { sha: result.content?.sha || sha || '' }
    } catch (error) {
      console.error('Failed to save to GitHub:', error)
      throw error
    }
  }

  /**
   * Check if the repository and path are accessible
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBase}/repos/${this.owner}/${this.repo}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      })
      return response.ok
    } catch {
      return false
    }
  }
}
