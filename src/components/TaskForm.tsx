'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import { useDarkMode } from '@/contexts/DarkModeContext';
import { Task } from '@/types';
import { createTask } from '@/services/taskService';

interface TaskFormProps {
  currentUserId: string;
  teamId?: string;
  users?: { id: string; displayName?: string; email: string }[]; // Add this
  onTaskCreated?: (task: Task) => void;
  onClose?: () => void;
}

export default function TaskForm({ currentUserId, teamId, users, onTaskCreated, onClose }: TaskFormProps) {
  const { isDarkMode } = useDarkMode();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    status: 'todo' as Task['status'],
    dueDate: '',
    tags: '',
    assignedTo: '', // Added assignedTo field
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
        title: formData.title,
        priority: formData.priority,
        status: formData.status,
        createdBy: currentUserId,
        order: Date.now(), // Simple ordering by creation time
      };

      // Only add assignedTo if it's set
      if (formData.assignedTo) {
        taskData.assignedTo = formData.assignedTo;
      }

      // Only add non-empty optional fields
      if (formData.description && formData.description.trim()) {
        taskData.description = formData.description.trim();
      }
      if (formData.dueDate) {
        taskData.dueDate = new Date(formData.dueDate);
      }
      if (teamId) {
        taskData.teamId = teamId;
      }
      if (formData.tags && formData.tags.trim()) {
        const tags = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
        if (tags.length > 0) {
          taskData.tags = tags;
        }
      }

      const taskId = await createTask(taskData);

      if (onTaskCreated) {
        onTaskCreated({
          ...taskData,
          id: taskId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      toast.success('Task created successfully!');

      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        dueDate: '',
        tags: '',
        assignedTo: '',
      });

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className={`rounded-md shadow-lg p-4 max-w-sm w-full transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-800' : 'bg-white'
    }`}>
      <div className="flex justify-between items-center mb-3">
        <h2 className={`text-lg font-semibold transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>Create New Task</h2>
        {onClose && (
          <button
            onClick={onClose}
            className={`transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="title" className={`block text-xs font-medium mb-1 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-colors duration-300 ${
              isDarkMode 
                ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                : 'border-gray-300 bg-gray-100 text-gray-900 placeholder-gray-400'
            }`}
            placeholder="Enter task title"
          />
        </div>

        <div>
          <label htmlFor="description" className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-colors duration-300 ${
              isDarkMode 
                ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                : 'border-gray-300 bg-gray-100 text-gray-900 placeholder-gray-400'
            }`}
            placeholder="Enter task description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="priority" className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                isDarkMode 
                  ? 'border-gray-600 bg-gray-700 text-white' 
                  : 'border-gray-300 bg-gray-100 text-gray-900'
              }`}
            >
              <option value="low">🟢 Low Priority</option>
              <option value="medium">🟡 Medium Priority</option>
              <option value="high">🔴 High Priority</option>
            </select>
          </div>

          <div>
            <label htmlFor="status" className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                isDarkMode 
                  ? 'border-gray-600 bg-gray-700 text-white' 
                  : 'border-gray-300 bg-gray-100 text-gray-900'
              }`}
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="dueDate" className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Due Date
          </label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-colors duration-300 ${
              isDarkMode 
                ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                : 'border-gray-300 bg-gray-100 text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>

        <div>
          <label htmlFor="tags" className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Tags
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
              isDarkMode 
                ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                : 'border-gray-300 bg-gray-100 text-gray-900 placeholder-gray-400'
            }`}
            placeholder="Enter tags separated by commas"
          />
        </div>

        {users && users.length > 0 && (
          <div>
            <label htmlFor="assignedTo" className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Assign To
            </label>
            <select
              id="assignedTo"
              name="assignedTo"
              value={formData.assignedTo || ''}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                isDarkMode 
                  ? 'border-gray-600 bg-gray-700 text-white' 
                  : 'border-gray-300 bg-gray-100 text-gray-900'
              }`}
            >
              <option value="">Unassigned</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.displayName || user.email}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-300 ${
                isDarkMode 
                  ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !formData.title.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors duration-300"
          >
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
}
