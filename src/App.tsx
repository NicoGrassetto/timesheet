import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TimerComponent } from '@/components/TimerComponent'
import { ManualEntryForm } from '@/components/ManualEntryForm'
import { WeeklyTimesheet } from '@/components/WeeklyTimesheet'
import { ReportsView } from '@/components/ReportsView'
import { ProjectManager } from '@/components/ProjectManager'
import { Clock, CalendarBlank, ChartBar, FolderOpen } from '@phosphor-icons/react'
import type { Project } from '@/lib/types'

function App() {
  const [projects] = useKV<Project[]>('projects', [])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Timesheet</h1>
          <p className="text-muted-foreground">Track time, manage projects, analyze productivity</p>
        </div>

        <Tabs defaultValue="timer" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="timer" className="gap-2">
              <Clock />
              <span className="hidden sm:inline">Timer</span>
            </TabsTrigger>
            <TabsTrigger value="timesheet" className="gap-2">
              <CalendarBlank />
              <span className="hidden sm:inline">Timesheet</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <ChartBar />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-2">
              <FolderOpen />
              <span className="hidden sm:inline">Projects</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timer" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TimerComponent projects={projects || []} />
              <div className="space-y-4">
                <ManualEntryForm projects={projects || []} />
                <div className="text-sm text-muted-foreground">
                  Start a timer to track time automatically, or add entries manually for past work.
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timesheet">
            <WeeklyTimesheet projects={projects || []} />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsView projects={projects || []} />
          </TabsContent>

          <TabsContent value="projects">
            <ProjectManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App