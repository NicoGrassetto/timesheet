import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus } from '@phosphor-icons/react'
import type { Project, TimeEntry } from '@/lib/types'

interface ManualEntryFormProps {
  projects: Project[]
}

export function ManualEntryForm({ projects }: ManualEntryFormProps) {
  const [entries, setEntries] = useKV<TimeEntry[]>('time-entries', [])
  const [open, setOpen] = useState(false)
  const [projectId, setProjectId] = useState('')
  const [task, setTask] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [hours, setHours] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!projectId || !hours) return

    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      projectId,
      task,
      date,
      hours: parseFloat(hours)
    }

    setEntries((current) => [...(current || []), newEntry])
    
    setProjectId('')
    setTask('')
    setHours('')
    setDate(new Date().toISOString().split('T')[0])
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2" />
          Add Entry
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Time Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="entry-project">Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger id="entry-project">
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
            <Label htmlFor="entry-task">Task</Label>
            <Input
              id="entry-task"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Task description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entry-date">Date</Label>
            <Input
              id="entry-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entry-hours">Hours</Label>
            <Input
              id="entry-hours"
              type="number"
              step="0.25"
              min="0"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <Button type="submit" className="w-full" disabled={!projectId || !hours}>
            Save Entry
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
