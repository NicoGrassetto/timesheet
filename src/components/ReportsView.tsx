import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { FileArrowDown } from '@phosphor-icons/react'
import { groupEntriesByProject, calculateTotalHours } from '@/lib/utils.helpers'
import type { Project, TimeEntry } from '@/lib/types'
import type { UseHybridDatabaseReturn } from '@/hooks/useHybridDatabase'
import { exportAllEntries } from '@/services/exportService'

interface ReportsViewProps {
  database: UseHybridDatabaseReturn
}

export function ReportsView({ database }: ReportsViewProps) {
  const { projects, entries } = database

  const groupedEntries = groupEntriesByProject(entries)
  const totalHours = calculateTotalHours(entries)

  const handleExport = async () => {
    try {
      await exportAllEntries(entries, projects)
    } catch (err) {
      console.error('Failed to export report:', err)
      alert('Failed to export report. Please try again.')
    }
  }

  const projectStats = projects.map(project => {
    const projectEntries = groupedEntries[project.id] || []
    const hours = calculateTotalHours(projectEntries)
    const percentage = totalHours > 0 ? (hours / totalHours) * 100 : 0
    
    return {
      project,
      hours,
      percentage,
      entryCount: projectEntries.length
    }
  }).filter(stat => stat.hours > 0)
    .sort((a, b) => b.hours - a.hours)

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-2">Reports & Analytics</h2>
            <p className="text-sm text-muted-foreground">Time distribution across projects</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExport}
            disabled={entries.length === 0}
          >
            <FileArrowDown className="mr-2" />
            Export to Word
          </Button>
        </div>

        {projectStats.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No entries yet. Start tracking time to see reports.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Total Hours</div>
                <div className="text-3xl font-bold font-mono mt-1">{totalHours.toFixed(2)}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Projects</div>
                <div className="text-3xl font-bold font-mono mt-1">{projectStats.length}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Entries</div>
                <div className="text-3xl font-bold font-mono mt-1">{entries.length}</div>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Time by Project</h3>
              {projectStats.map(({ project, hours, percentage, entryCount }) => (
                <div key={project.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                      <span className="font-medium">{project.name}</span>
                      <Badge variant="secondary" className="text-xs">{entryCount} entries</Badge>
                    </div>
                    <div className="text-sm font-mono">
                      {hours.toFixed(2)}h <span className="text-muted-foreground">({percentage.toFixed(0)}%)</span>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" style={{ 
                    ['--progress-background' as string]: project.color 
                  }} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
