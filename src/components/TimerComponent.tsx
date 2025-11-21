import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Play, Pause, Square, Plus } from '@phosphor-icons/react'
import { formatTime } from '@/lib/utils.helpers'
import type { Project, ActiveTimer, TimeEntry } from '@/lib/types'
import type { UseHybridDatabaseReturn } from '@/hooks/useHybridDatabase'

interface TimerComponentProps {
  database: UseHybridDatabaseReturn
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
]

export function TimerComponent({ database }: TimerComponentProps) {
  const { projects, activeTimer, setActiveTimer, addEntry, addProject: createProject } = database
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [selectedProject, setSelectedProject] = useState('')
  const [task, setTask] = useState('')
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectColor, setNewProjectColor] = useState(PRESET_COLORS[0])

  useEffect(() => {
    if (activeTimer && !isPaused) {
      const startTime = activeTimer.startTime
      const interval = setInterval(() => {
        const now = Date.now()
        setElapsedSeconds(Math.floor((now - startTime) / 1000))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [activeTimer, isPaused])

  useEffect(() => {
    if (activeTimer) {
      const now = Date.now()
      setElapsedSeconds(Math.floor((now - activeTimer.startTime) / 1000))
    } else {
      setElapsedSeconds(0)
    }
  }, [activeTimer])

  const handleStart = async () => {
    if (!selectedProject) return
    
    try {
      await setActiveTimer({
        projectId: selectedProject,
        task,
        startTime: Date.now()
      })
      setIsPaused(false)
    } catch (err) {
      console.error('Failed to start timer:', err)
    }
  }

  const handlePause = () => {
    setIsPaused(!isPaused)
  }

  const handleStop = async () => {
    if (!activeTimer) return

    const endTime = Date.now()
    const hours = (endTime - activeTimer.startTime) / (1000 * 60 * 60)

    const newEntry: TimeEntry = {
      id: crypto.randomUUID(),
      projectId: activeTimer.projectId,
      task: activeTimer.task,
      date: new Date().toISOString().split('T')[0],
      hours: Math.round(hours * 100) / 100,
      startTime: activeTimer.startTime,
      endTime
    }

    try {
      await addEntry(newEntry)
      await setActiveTimer(null)
      setElapsedSeconds(0)
      setTask('')
      setIsPaused(false)
    } catch (err) {
      console.error('Failed to stop timer:', err)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName) return

    const newProject: Project = {
      id: crypto.randomUUID(),
      name: newProjectName,
      color: newProjectColor
    }

    try {
      await createProject(newProject)
      setSelectedProject(newProject.id)
      setNewProjectName('')
      setNewProjectColor(PRESET_COLORS[0])
      setShowCreateProject(false)
    } catch (err) {
      console.error('Failed to create project:', err)
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Timer</h2>
          {activeTimer && (
            <div className={`text-3xl font-mono font-bold ${isPaused ? 'text-muted-foreground' : 'text-accent'}`}>
              {formatTime(elapsedSeconds)}
            </div>
          )}
        </div>

        {!activeTimer ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timer-project">Project</Label>
              <div className="flex gap-2">
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger id="timer-project" className="flex-1">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.length === 0 ? (
                      <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        No projects yet
                      </div>
                    ) : (
                      projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                            {project.name}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowCreateProject(true)}
                  title="Create New Project"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timer-task">Task (optional)</Label>
              <Input
                id="timer-task"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="What are you working on?"
              />
            </div>

            <Button onClick={handleStart} disabled={!selectedProject} className="w-full">
              <Play className="mr-2" />
              Start Timer
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: projects.find(p => p.id === activeTimer.projectId)?.color }} 
                />
                <span className="font-medium">
                  {projects.find(p => p.id === activeTimer.projectId)?.name}
                </span>
              </div>
              {activeTimer.task && <div className="text-muted-foreground">{activeTimer.task}</div>}
            </div>

            <div className="flex gap-2">
              <Button onClick={handlePause} variant="secondary" className="flex-1">
                <Pause className="mr-2" />
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button onClick={handleStop} variant="destructive" className="flex-1">
                <Square className="mr-2" />
                Stop
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-project-name">Project Name</Label>
              <Input
                id="new-project-name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter project name"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="grid grid-cols-8 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewProjectColor(color)}
                    className="w-8 h-8 rounded border-2 transition-all"
                    style={{
                      backgroundColor: color,
                      borderColor: newProjectColor === color ? '#000' : 'transparent'
                    }}
                  />
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={!newProjectName}>
              Create Project
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
