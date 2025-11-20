import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Play, Pause, Square } from '@phosphor-icons/react'
import { formatTime } from '@/lib/utils.helpers'
import type { Project, ActiveTimer, TimeEntry } from '@/lib/types'

interface TimerComponentProps {
  projects: Project[]
}

export function TimerComponent({ projects }: TimerComponentProps) {
  const [activeTimer, setActiveTimer] = useKV<ActiveTimer | null>('active-timer', null)
  const [entries, setEntries] = useKV<TimeEntry[]>('time-entries', [])
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [selectedProject, setSelectedProject] = useState('')
  const [task, setTask] = useState('')

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

  const handleStart = () => {
    if (!selectedProject) return
    
    setActiveTimer({
      projectId: selectedProject,
      task,
      startTime: Date.now()
    })
    setIsPaused(false)
  }

  const handlePause = () => {
    setIsPaused(!isPaused)
  }

  const handleStop = () => {
    if (!activeTimer) return

    const endTime = Date.now()
    const hours = (endTime - activeTimer.startTime) / (1000 * 60 * 60)

    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      projectId: activeTimer.projectId,
      task: activeTimer.task,
      date: new Date().toISOString().split('T')[0],
      hours: Math.round(hours * 100) / 100,
      startTime: activeTimer.startTime,
      endTime
    }

    setEntries((current) => [...(current || []), newEntry])
    setActiveTimer(null)
    setElapsedSeconds(0)
    setTask('')
    setIsPaused(false)
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
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger id="timer-project">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
    </Card>
  )
}
