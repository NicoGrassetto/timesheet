import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CaretLeft, CaretRight, Trash, FileArrowDown } from '@phosphor-icons/react'
import { format, parseISO, isWithinInterval } from 'date-fns'
import { getWeekDays, getCurrentWeekRange, formatDuration, calculateTotalHours } from '@/lib/utils.helpers'
import type { Project, TimeEntry } from '@/lib/types'
import type { UseHybridDatabaseReturn } from '@/hooks/useHybridDatabase'
import { exportWeeklyTimesheet } from '@/services/exportService'

interface WeeklyTimesheetProps {
  database: UseHybridDatabaseReturn
}

export function WeeklyTimesheet({ database }: WeeklyTimesheetProps) {
  const { projects, entries, deleteEntry: removeEntry } = database
  const [weekOffset, setWeekOffset] = useState(0)

  const weekDays = getWeekDays(weekOffset)
  const { start, end } = getCurrentWeekRange(weekOffset)

  const weekEntries = entries.filter(entry => {
    const entryDate = parseISO(entry.date)
    return isWithinInterval(entryDate, { start, end })
  })

  const getProjectById = (id: string) => projects.find(p => p.id === id)

  const getDayEntries = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd')
    return weekEntries.filter(entry => entry.date === dayStr)
  }

  const getDayTotal = (day: Date) => {
    return calculateTotalHours(getDayEntries(day))
  }

  const handleDeleteEntry = async (id: string, projectId: string) => {
    try {
      await removeEntry(id, projectId)
    } catch (err) {
      console.error('Failed to delete entry:', err)
    }
  }

  const handleExport = async () => {
    try {
      await exportWeeklyTimesheet(weekEntries, projects, start, end)
    } catch (err) {
      console.error('Failed to export timesheet:', err)
      alert('Failed to export timesheet. Please try again.')
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Weekly Timesheet</h2>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExport}
              disabled={weekEntries.length === 0}
            >
              <FileArrowDown className="mr-2" />
              Export to Word
            </Button>
            <Button variant="outline" size="icon" onClick={() => setWeekOffset(weekOffset - 1)}>
              <CaretLeft />
            </Button>
            <span className="text-sm font-medium min-w-[200px] text-center">
              {format(start, 'MMM d')} - {format(end, 'MMM d, yyyy')}
            </span>
            <Button variant="outline" size="icon" onClick={() => setWeekOffset(weekOffset + 1)}>
              <CaretRight />
            </Button>
          </div>
        </div>

        {weekEntries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No entries for this week
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weekDays.map((day) => {
                  const dayEntries = getDayEntries(day)
                  const dayTotal = getDayTotal(day)
                  
                  if (dayEntries.length === 0) return null
                  
                  return (
                    <>
                      {dayEntries.map((entry, idx) => {
                        const project = getProjectById(entry.projectId)
                        return (
                          <TableRow key={entry.id}>
                            {idx === 0 && (
                              <TableCell rowSpan={dayEntries.length} className="font-medium align-top">
                                {format(day, 'EEE, MMM d')}
                              </TableCell>
                            )}
                            <TableCell>
                              {project && (
                                <Badge variant="secondary" className="gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                                  {project.name}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {entry.task || '-'}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {entry.hours.toFixed(2)}h
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteEntry(entry.id, entry.projectId)}
                              >
                                <Trash className="text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={3} className="text-right font-medium">
                          Day Total
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          {dayTotal.toFixed(2)}h
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </>
                  )
                })}
                <TableRow className="bg-primary/5">
                  <TableCell colSpan={3} className="text-right font-bold">
                    Week Total
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-lg">
                    {calculateTotalHours(weekEntries).toFixed(2)}h
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Card>
  )
}
