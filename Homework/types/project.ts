export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  dueDate?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  progress: number; // 0 to 100
  tasksCount: number;
  completedTasks: number;
  lastAccessed: string;
  color: string;
}
