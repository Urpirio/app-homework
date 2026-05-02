export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  type?: 'ASSIGNMENT' | 'EXAM' | 'NOTE' | 'QUIZ';
  maxGrade?: number;
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
