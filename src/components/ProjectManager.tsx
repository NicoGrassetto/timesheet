import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash } from '@phosphor-icons/react'
import type { Project } from '@/lib/types'
import type { UseHybridDatabaseReturn } from '@/hooks/useHybridDatabase'

interface ProjectManagerProps {
  database: UseHybridDatabaseReturn
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
]

export function ProjectManager({ database }: ProjectManagerProps) {
  const { projects, isLoading: loading, error, addProject, deleteProject: removeProject } = database
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name) return

    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      color
    }

    try {
      await addProject(newProject)
      setName('')
      setColor(PRESET_COLORS[0])
      setOpen(false)
    } catch (err) {
      console.error('Failed to add project:', err)
    }
  }

  const handleDeleteProject = async (id: string) => {
    try {
      await removeProject(id)
    } catch (err) {
      console.error('Failed to delete project:', err)
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Projects</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Project</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter project name"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="grid grid-cols-8 gap-2">
                    {PRESET_COLORS.map((presetColor) => (
                      <button
                        key={presetColor}
                        type="button"
                        onClick={() => setColor(presetColor)}
                        className="w-8 h-8 rounded border-2 transition-all"
                        style={{
                          backgroundColor: presetColor,
                          borderColor: color === presetColor ? '#000' : 'transparent'
                        }}
                      />
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={!name}>
                  Add Project
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Loading projects...
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive text-sm">
            Error: {error}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No projects yet. Add one to start tracking time.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {projects.map((project) => (
              <Badge key={project.id} variant="secondary" className="gap-2 pr-1 text-sm py-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                {project.name}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 ml-1"
                  onClick={() => handleDeleteProject(project.id)}
                >
                  <Trash className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
