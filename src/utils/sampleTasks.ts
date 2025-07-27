import { Task } from '@/types';
import { createTask } from '@/services/taskService';

export const createSampleTasks = async (userId: string): Promise<void> => {
  const sampleTasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      title: 'Design system documentation',
      description: 'Create comprehensive documentation for our design system components',
      priority: 'high',
      status: 'todo',
      createdBy: userId,
      order: 1000,
      tags: ['documentation', 'design', 'frontend'],
    },
    {
      title: 'Fix login form validation',
      description: 'Address the validation issues in the user authentication flow',
      priority: 'high',
      status: 'in-progress',
      createdBy: userId,
      order: 2000,
      tags: ['bug', 'frontend', 'auth'],
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    },
    {
      title: 'Code review for API endpoints',
      description: 'Review the new REST API endpoints for the user management system',
      priority: 'medium',
      status: 'review',
      createdBy: userId,
      order: 3000,
      tags: ['code-review', 'backend', 'api'],
    },
    {
      title: 'Deploy staging environment',
      description: 'Set up and configure the staging environment for testing',
      priority: 'medium',
      status: 'done',
      createdBy: userId,
      order: 4000,
      tags: ['devops', 'deployment'],
    },
    {
      title: 'Update user profile component',
      description: 'Add support for profile picture uploads and bio sections',
      priority: 'low',
      status: 'todo',
      createdBy: userId,
      order: 5000,
      tags: ['frontend', 'feature'],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
    },
    {
      title: 'Database optimization',
      description: 'Optimize database queries for better performance on large datasets',
      priority: 'high',
      status: 'in-progress',
      createdBy: userId,
      order: 6000,
      tags: ['backend', 'performance', 'database'],
    },
  ];

  try {
    console.log('Creating sample tasks...');
    for (const task of sampleTasks) {
      await createTask(task);
      console.log(`Created task: ${task.title}`);
    }
    console.log('Sample tasks created successfully!');
  } catch (error) {
    console.error('Error creating sample tasks:', error);
  }
};

// Helper function to clear all tasks (use with caution!)
export const clearAllUserTasks = async (userId: string): Promise<void> => {
  // This would require additional implementation in taskService
  console.warn('Clear tasks function not implemented for safety reasons');
};
