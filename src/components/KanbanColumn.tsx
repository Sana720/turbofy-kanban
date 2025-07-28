'use client';

import { Task } from '@/types';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDarkMode } from '@/contexts/DarkModeContext';
import TaskCard from './TaskCard';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  currentUserId?: string;
}

const columnColors = {
  todo: {
    light: 'bg-gradient-to-b from-gray-50 to-gray-100 border-gray-300',
    dark: 'bg-gradient-to-b from-gray-800 to-gray-900 border-gray-600'
  },
  'in-progress': {
    light: 'bg-gradient-to-b from-blue-50 to-blue-100 border-blue-300',
    dark: 'bg-gradient-to-b from-blue-900/40 to-blue-900/60 border-blue-600'
  },
  review: {
    light: 'bg-gradient-to-b from-yellow-50 to-yellow-100 border-yellow-300',
    dark: 'bg-gradient-to-b from-yellow-900/40 to-yellow-900/60 border-yellow-600'
  },
  done: {
    light: 'bg-gradient-to-b from-green-50 to-green-100 border-green-300',
    dark: 'bg-gradient-to-b from-green-900/40 to-green-900/60 border-green-600'
  },
};

const columnIcons = {
  todo: '📋',
  'in-progress': '⚡',
  review: '👀',
  done: '✅',
};

export default function KanbanColumn({ id, title, tasks, currentUserId }: KanbanColumnProps) {
  const { isDarkMode } = useDarkMode();
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const columnColorClass = isDarkMode 
    ? columnColors[id as keyof typeof columnColors]?.dark || columnColors.todo.dark
    : columnColors[id as keyof typeof columnColors]?.light || columnColors.todo.light;

  return (
    <div className="flex flex-col flex-1 min-w-64 max-w-80" style={{ maxHeight: 'calc(100vh - 180px)' }}>
      {/* Column Header */}
      <div className={`
        rounded-t-md border border-b-0 p-2 transition-all duration-300
        ${columnColorClass}
        ${isOver ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
      `}>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-1.5">
            <span className="text-sm">{columnIcons[id as keyof typeof columnIcons] || '📋'}</span>
            <h2 className={`text-sm font-semibold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>{title}</h2>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gray-700 text-gray-200 border-gray-600 shadow-sm' 
              : 'bg-white text-gray-600 border-gray-300 shadow-sm'
          }`}>
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Tasks Container */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 border border-t-0 rounded-b-md p-2 overflow-y-auto transition-all duration-300
          ${columnColorClass}
          ${isOver ? `ring-2 ring-blue-400 ring-opacity-50 ${
            isDarkMode ? 'bg-blue-900/50' : 'bg-blue-50'
          }` : ''}
        `}
        style={{ maxHeight: 'calc(100vh - 280px)', minHeight: '150px' }}
      >
        <SortableContext
          items={tasks.map(task => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <div className={`flex items-center justify-center h-24 text-xs transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-400'
            }`}>
              <div className="text-center">
                <svg className="w-6 h-6 mx-auto mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No tasks</p>
              </div>
            </div>
          ) : (
            tasks.map((task, index) => (
              <TaskCard
                key={`${id}-${task.id}-${index}`}
                task={task}
                currentUserId={currentUserId}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
