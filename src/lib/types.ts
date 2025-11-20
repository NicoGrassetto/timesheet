export interface Project {
  id: string
  name: string
  color: string
}

export interface TimeEntry {
  id: string
  projectId: string
  task: string
  date: string
  hours: number
  startTime?: number
  endTime?: number
}

export interface ActiveTimer {
  projectId: string
  task: string
  startTime: number
}
