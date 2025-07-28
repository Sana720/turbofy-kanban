'use client';

import { Task } from '@/types';
import { useDarkMode } from '@/contexts/DarkModeContext';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskCardProps {
  task: Task;
  currentUserId?: string;
}

const priorityColors = {
  low: {
    light: 'bg-green-100 text-green-800 border-green-200',
    dark: 'bg-green-900 text-green-200 border-green-700'
  },
  medium: {
    light: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    dark: 'bg-yellow-900 text-yellow-200 border-yellow-700'
  },
  high: {
    light: 'bg-red-100 text-red-800 border-red-200',
    dark: 'bg-red-900 text-red-200 border-red-700'
  },
};

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const priorityIcons = {
  low: '▼',
  medium: '●',
  high: '▲',
};

export default function TaskCard({ task, currentUserId }: TaskCardProps) {
  const { isDarkMode } = useDarkMode();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Ensure priority has a valid value and exists in our colors object
  const taskPriority = (task.priority && priorityColors[task.priority as keyof typeof priorityColors]) 
    ? task.priority 
    : 'low';
  
  // Safe getter for priority colors
  const getPriorityColors = (priority: string, mode: 'light' | 'dark') => {
    const priorityKey = priority as keyof typeof priorityColors;
    return priorityColors[priorityKey]?.[mode] || priorityColors.low[mode];
  };
  
  const isOverdue = task.dueDate && new Date() > task.dueDate;
  const isDueSoon = task.dueDate && !isOverdue && 
    (task.dueDate.getTime() - new Date().getTime()) < (24 * 60 * 60 * 1000); // Due within 24 hours
  const isAssignedToCurrentUser = task.assignedTo === currentUserId;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        rounded-md shadow-sm p-2 mb-1.5 cursor-pointer transition-all duration-200
        ${isOverdue 
          ? isDarkMode 
            ? 'bg-red-900 border-2 border-red-600 hover:shadow-lg hover:border-red-500' 
            : 'bg-red-50 border-2 border-red-300 hover:shadow-lg hover:border-red-400'
          : isDueSoon 
            ? isDarkMode 
              ? 'bg-orange-900 border-2 border-orange-600 hover:shadow-md hover:border-orange-500'
              : 'bg-orange-50 border-2 border-orange-300 hover:shadow-md hover:border-orange-400'
            : isDarkMode 
              ? 'bg-gray-800 border border-gray-600 hover:shadow-md hover:border-gray-500'
              : 'bg-white border border-gray-200 hover:shadow-md'
        }
        ${isDragging ? 'opacity-50 shadow-lg scale-105' : ''}
        ${isAssignedToCurrentUser ? (isDarkMode ? 'ring-2 ring-blue-600' : 'ring-2 ring-blue-100') : ''}
      `}
    >
      {/* Header with priority */}
      <div className="flex justify-between items-start mb-1">
        <span
          className={`
            px-1.5 py-0.5 rounded-full text-xs font-medium border transition-colors duration-300
            ${isDarkMode 
              ? getPriorityColors(taskPriority, 'dark')
              : getPriorityColors(taskPriority, 'light')
            }
          `}
        >
          {priorityLabels[taskPriority as keyof typeof priorityLabels] || 'Low'}
        </span>
        {isOverdue && (
          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium border transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-red-900 text-red-200 border-red-700' 
              : 'bg-red-100 text-red-800 border-red-200'
          }`}>
            Overdue
          </span>
        )}
      </div>

      {/* Task title */}
      <h3 className={`font-medium mb-1 text-sm overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {task.title}
      </h3>

      {/* Task description */}
      {task.description && (
        <p className={`text-xs mb-1.5 overflow-hidden transition-colors duration-300 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-0.5 mb-1.5">
          {task.tags.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className={`px-1 py-0.5 text-xs rounded-sm transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-300' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 2 && (
            <span className={`px-1 py-0.5 text-xs rounded-sm transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-700 text-gray-300' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              +{task.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Footer with due date and assignment */}
      <div className="flex justify-between items-center text-xs mt-1.5">
        <div className="flex items-center space-x-1">
          {task.dueDate && (
            <div className={`flex items-center space-x-0.5 px-1 py-0.5 rounded-sm text-xs ${
              isOverdue 
                ? isDarkMode 
                  ? 'bg-red-800 text-red-200 font-medium' 
                  : 'bg-red-100 text-red-700 font-medium'
                : isDueSoon 
                  ? isDarkMode 
                    ? 'bg-orange-800 text-orange-200 font-medium'
                    : 'bg-orange-100 text-orange-700 font-medium'
                  : isDarkMode 
                    ? 'text-gray-400'
                    : 'text-gray-500'
            }`}>
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                {task.dueDate.toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-1">
          {task.assignedTo && (
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
              {isAssignedToCurrentUser ? 'Me' : task.assignedTo.slice(0, 1).toUpperCase()}
            </div>
          )}
          {task.comments && task.comments.length > 0 && (
            <span className={`flex items-center transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <svg className="w-2.5 h-2.5 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              {task.comments.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
