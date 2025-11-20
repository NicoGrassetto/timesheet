import { startOfWeek, endOfWeek, addWeeks, format, parseISO, eachDayOfInterval } from 'date-fns'
import type { TimeEntry } from './types'

export function getCurrentWeekRange(offset: number = 0) {
  const today = new Date()
  const targetDate = addWeeks(today, offset)
  const start = startOfWeek(targetDate, { weekStartsOn: 1 })
  const end = endOfWeek(targetDate, { weekStartsOn: 1 })
  return { start, end }
}

export function getWeekDays(weekOffset: number = 0) {
  const { start, end } = getCurrentWeekRange(weekOffset)
  return eachDayOfInterval({ start, end })
}

export function formatDuration(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}h ${m}m`
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function groupEntriesByProject(entries: TimeEntry[]): Record<string, TimeEntry[]> {
  return entries.reduce((acc, entry) => {
    if (!acc[entry.projectId]) {
      acc[entry.projectId] = []
    }
    acc[entry.projectId].push(entry)
    return acc
  }, {} as Record<string, TimeEntry[]>)
}

export function calculateTotalHours(entries: TimeEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.hours, 0)
}
