import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus } from '@phosphor-icons/react'
import type { Project, TimeEntry } from '@/lib/types'
import type { UseHybridDatabaseReturn } from '@/hooks/useHybridDatabase'

interface ManualEntryFormProps {
  database: UseHybridDatabaseReturn
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
]

export function ManualEntryForm({ database }: ManualEntryFormProps) {
  const { projects, addEntry, addProject: createProject } = database
  const [open, setOpen] = useState(false)
  const [projectId, setProjectId] = useState('')
  const [task, setTask] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [hours, setHours] = useState('')
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectColor, setNewProjectColor] = useState(PRESET_COLORS[0])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!projectId || !hours) return

    const newEntry: TimeEntry = {
      id: crypto.randomUUID(),
      projectId,
      task,
      date,
      hours: parseFloat(hours)
    }

    try {
      await addEntry(newEntry)
      setProjectId('')
      setTask('')
      setHours('')
      setDate(new Date().toISOString().split('T')[0])
      setOpen(false)
    } catch (err) {
      console.error('Failed to add entry:', err)
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
      setProjectId(newProject.id)
      setNewProjectName('')
      setNewProjectColor(PRESET_COLORS[0])
      setShowCreateProject(false)
    } catch (err) {
      console.error('Failed to create project:', err)
    }
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
            <div className="flex gap-2">
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger id="entry-project" className="flex-1">
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

      <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-project-name-entry">Project Name</Label>
              <Input
                id="new-project-name-entry"
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
    </Dialog>
  )
}
