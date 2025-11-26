import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TimerComponent } from '@/components/TimerComponent'
import { ManualEntryForm } from '@/components/ManualEntryForm'
import { WeeklyTimesheet } from '@/components/WeeklyTimesheet'
import { ReportsView } from '@/components/ReportsView'
import { ProjectManager } from '@/components/ProjectManager'
import { Clock, CalendarBlank, ChartBar, FolderOpen, ArrowsClockwise } from '@phosphor-icons/react'
import { useHybridDatabase } from '@/hooks/useHybridDatabase'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

function App() {
  const database = useHybridDatabase()
  const { 
    projects, 
    isLoading, 
    isSyncing, 
    lastSyncTime, 
    error,
    syncNow,
    isConfigured 
  } = database

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your timesheet...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Timesheet</h1>
            <p className="text-muted-foreground">Track time, manage projects, analyze productivity</p>
          </div>
          <div className="flex items-center gap-4">
            {isConfigured && (
              <Button
                variant="outline"
                size="sm"
                onClick={syncNow}
                disabled={isSyncing}
                className="gap-2"
              >
                <ArrowsClockwise className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? 'Syncing...' : 'Refresh'}
              </Button>
            )}
            {lastSyncTime && (
              <span className="text-xs text-muted-foreground">
                Last updated: {new Date(lastSyncTime).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {!isConfigured && (
          <Alert className="mb-6">
            <AlertDescription>
              ⚠️ <strong>Cannot connect to API server.</strong> Make sure the backend is running with <code>npm run dev</code>.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
              <TimerComponent database={database} />
              <div className="space-y-4">
                <ManualEntryForm database={database} />
                <div className="text-sm text-muted-foreground">
                  Start a timer to track time automatically, or add entries manually for past work.
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timesheet">
            <WeeklyTimesheet database={database} />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsView database={database} />
          </TabsContent>

          <TabsContent value="projects">
            <ProjectManager database={database} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App