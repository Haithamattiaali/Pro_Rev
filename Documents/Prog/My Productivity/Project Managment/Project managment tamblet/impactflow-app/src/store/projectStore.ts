import { create } from 'zustand'
import { Task, Project, Update } from '@/types/project'

interface ProjectStore {
  // State
  currentProject: Project | null
  tasks: Task[]
  updates: Update[]
  isLoading: boolean
  error: string | null

  // Actions
  setCurrentProject: (project: Project | null) => void
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  deleteTask: (taskId: string) => void
  setUpdates: (updates: Update[]) => void
  addUpdate: (update: Update) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearStore: () => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
  // Initial state
  currentProject: null,
  tasks: [],
  updates: [],
  isLoading: false,
  error: null,

  // Actions
  setCurrentProject: (project) => set({ currentProject: project, error: null }),
  
  setTasks: (tasks) => set({ tasks, error: null }),
  
  addTask: (task) => set((state) => ({ 
    tasks: [...state.tasks, task],
    error: null 
  })),
  
  updateTask: (taskId, updates) => set((state) => ({
    tasks: state.tasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ),
    error: null
  })),
  
  deleteTask: (taskId) => set((state) => ({
    tasks: state.tasks.filter(task => task.id !== taskId),
    error: null
  })),
  
  setUpdates: (updates) => set({ updates, error: null }),
  
  addUpdate: (update) => set((state) => ({
    updates: [...state.updates, update],
    error: null
  })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error, isLoading: false }),
  
  clearStore: () => set({
    currentProject: null,
    tasks: [],
    updates: [],
    isLoading: false,
    error: null
  }),
}))