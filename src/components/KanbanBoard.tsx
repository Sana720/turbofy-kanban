'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useDarkMode } from '@/contexts/DarkModeContext';
import { Task, KanbanColumn as IKanbanColumn } from '@/types';
import { updateTask, updateMultipleTasks } from '@/services/taskService';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';

interface KanbanBoardProps {
  tasks: Task[];
  currentUserId?: string;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
}
export default function KanbanBoard({ tasks, currentUserId, onTaskUpdate }: KanbanBoardProps) {
  const COLUMNS: { id: Task['status']; title: string }[] = [
    { id: 'todo', title: 'To Do' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'review', title: 'Review' },
    { id: 'done', title: 'Done' },
  ];
  const { isDarkMode } = useDarkMode();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  // (Removed duplicate state declarations)
  const [priorityFilter, setPriorityFilter] = useState<Task['priority'] | 'all'>('all');
  const [dueDateFilter, setDueDateFilter] = useState<'all' | 'overdue' | 'due-soon' | 'no-due-date'>('all');
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Update local tasks when props change
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to activate drag
      },
    })
  );

  // Filter and group tasks by status into columns
  const filteredTasks = useMemo(() => {
    let filtered = localTasks;

    // Filter by priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => (task.priority || 'low') === priorityFilter);
    }

    // Filter by due date
    if (dueDateFilter !== 'all') {
      const now = new Date();
      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(task => {
        switch (dueDateFilter) {
          case 'overdue':
            return task.dueDate && task.dueDate < now;
          case 'due-soon':
            return task.dueDate && task.dueDate >= now && task.dueDate <= oneDayFromNow;
          case 'no-due-date':
            return !task.dueDate;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [localTasks, priorityFilter, dueDateFilter]);

  const columns: IKanbanColumn[] = useMemo(() => {
    return COLUMNS.map(column => ({
      id: column.id,
      title: column.title,
      status: column.id,
      tasks: filteredTasks
        .filter(task => task.status === column.id)
        .sort((a, b) => {
          // Sort by priority first (high -> medium -> low), then by order
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          if (a.priority !== b.priority) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          }
          return a.order - b.order;
        }),
    }));
  }, [filteredTasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = localTasks.find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeTaskId = active.id as string;
    const overColumnId = over.id as Task['status'];

    // Find the active task
    const activeTask = localTasks.find(t => t.id === activeTaskId);
    if (!activeTask) return;

    // If dropping on a column (not a task)
    if (COLUMNS.some(col => col.id === overColumnId)) {
      if (activeTask.status !== overColumnId) {
        setLocalTasks(prev => 
          prev.map(task => 
            task.id === activeTaskId 
              ? { ...task, status: overColumnId }
              : task
          )
        );
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) {
      // Always sync localTasks with latest tasks prop after drag ends
      setLocalTasks(tasks);
      return;
    }

    const activeTaskId = active.id as string;
    const activeTask = localTasks.find(t => t.id === activeTaskId);
    if (!activeTask) {
      setLocalTasks(tasks);
      return;
    }

    // Determine the target column
    let targetColumnId: Task['status'];
    let targetTaskId: string | null = null;

    if (COLUMNS.some(col => col.id === over.id)) {
      // Dropped on a column
      targetColumnId = over.id as Task['status'];
    } else {
      // Dropped on a task
      targetTaskId = over.id as string;
      const targetTask = localTasks.find(t => t.id === targetTaskId);
      if (!targetTask) return;
      targetColumnId = targetTask.status;
    }

    // Debug log to trace status change logic
    console.log('DragEnd: activeTask.status:', activeTask.status, 'targetColumnId:', targetColumnId, 'targetTaskId:', targetTaskId);
    // Always run update logic, even if status and position are unchanged

    // Get tasks in the target column
    const targetColumnTasks = localTasks
      .filter(t => t.status === targetColumnId)
      .sort((a, b) => a.order - b.order);

    let newOrder: number;
    let updatedTasks: Task[] = [...localTasks];

    if (targetTaskId) {
      // Dropped on a specific task - reorder within the column (or move between columns)
      // Always ensure activeTask is present in the newTargetColumnTasks for reordering
      let newTargetColumnTasks = [...targetColumnTasks];
      if (!newTargetColumnTasks.some(t => t.id === activeTaskId)) {
        // Insert activeTask just before the targetIndex (default to end if not found)
        const activeTaskObj = { ...activeTask, status: targetColumnId };
        const targetIndex = newTargetColumnTasks.findIndex(t => t.id === targetTaskId);
        if (targetIndex === -1) {
          newTargetColumnTasks.push(activeTaskObj);
        } else {
          newTargetColumnTasks.splice(targetIndex, 0, activeTaskObj);
        }
      }
      const targetIndex = newTargetColumnTasks.findIndex(t => t.id === targetTaskId);
      const activeIndex = newTargetColumnTasks.findIndex(t => t.id === activeTaskId);

      // Only skip if activeIndex or targetIndex is -1 (should never happen), otherwise always reorder if position changes
      if (activeIndex !== -1 && targetIndex !== -1 && activeIndex !== targetIndex) {
        const reorderedTasks = arrayMove(newTargetColumnTasks, activeIndex, targetIndex);

        // Always include status in update payload for all tasks in the column
        const taskUpdates: { id: string; order: number; status: Task['status'] }[] = [];

        reorderedTasks.forEach((task, index) => {
          const newTaskOrder = index * 1000; // Give some spacing
          updatedTasks = updatedTasks.map(t =>
            t.id === task.id
              ? { ...t, order: newTaskOrder, status: targetColumnId }
              : t
          );
          taskUpdates.push({
            id: task.id,
            order: newTaskOrder,
            status: targetColumnId // Always include status
          });
        });

        // Update local state immediately for reordering
        setLocalTasks(updatedTasks);

        // Show toast immediately for user feedback
        setToast('Task order updated!');
        setTimeout(() => setToast(null), 2000);

        // Batch update in Firestore
        try {
          console.log('[KanbanBoard] updateMultipleTasks payload:', taskUpdates);
          await updateMultipleTasks(taskUpdates);
          if (onTaskUpdate) {
            taskUpdates.forEach(update => {
              onTaskUpdate(update.id, update);
            });
          }
        } catch (err) {
          console.error('Error updating task order:', err);
          setError('Failed to update task order in Firestore. Check your permissions and network.');
          setToast('Failed to update task order!');
          setTimeout(() => setToast(null), 2000);
          setLocalTasks(tasks);
        }
      }
    } else {
      // Dropped on column - move to end
      newOrder = targetColumnTasks.length > 0 
        ? Math.max(...targetColumnTasks.map(t => t.order)) + 1000
        : 1000;

      updatedTasks = updatedTasks.map(task => 
        task.id === activeTaskId 
          ? { ...task, status: targetColumnId, order: newOrder }
          : task
      );

      // Update local state first for immediate UI response
      setLocalTasks(updatedTasks);

      // Show toast immediately for user feedback
      setToast('Task status updated!');
      setTimeout(() => setToast(null), 2000);

      // Then update Firestore
      try {
        console.log('[KanbanBoard] updateTask payload:', { activeTaskId, status: targetColumnId, order: newOrder });
        await updateTask(activeTaskId, { 
          status: targetColumnId, 
          order: newOrder 
        });
        if (onTaskUpdate) {
          onTaskUpdate(activeTaskId, { status: targetColumnId, order: newOrder });
        }
      } catch (err) {
        console.error('Error updating task:', err);
        setError('Failed to update task status in Firestore. Check your permissions and network.');
        setToast('Failed to update task status!');
        setTimeout(() => setToast(null), 2000);
        setLocalTasks(tasks);
        return;
      }
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Toast notification (always on top) */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100]" style={{ minWidth: 250 }} aria-live="polite">
        {toast && (
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg text-center animate-fade-in">
            <span>{toast}</span>
          </div>
        )}
        {/* Show error as toast if no toast is set */}
        {!toast && error && (
          <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg text-center animate-fade-in">
            <span>{error}</span>
            <button className="ml-4 underline" onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
      </div>
      <div className={`p-4 border-b transition-colors duration-300 ${
        isDarkMode ? 'border-gray-600' : 'border-gray-300'
      }`}>
        <div className="flex justify-between items-center">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            {/* Priority Filter */}
            <div className="flex items-center space-x-2">
              <label className={`text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-700'
              }`}>Priority:</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as Task['priority'] | 'all')}
                className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors duration-300 ${
                  isDarkMode 
                    ? 'border-gray-600 bg-gray-700 text-white' 
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
              >
                <option value="all">All Priorities</option>
                <option value="high">🔴 High Priority</option>
                <option value="medium">🟡 Medium Priority</option>
                <option value="low">🟢 Low Priority</option>
              </select>
            </div>
            
            {/* Due Date Filter */}
            <div className="flex items-center space-x-2">
              <label className={`text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Due Date:</label>
              <select
                value={dueDateFilter}
                onChange={(e) => setDueDateFilter(e.target.value as 'all' | 'overdue' | 'due-soon' | 'no-due-date')}
                className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors duration-300 ${
                  isDarkMode 
                    ? 'border-gray-600 bg-gray-700 text-white' 
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
              >
                <option value="all">All Tasks</option>
                <option value="overdue">⚠️ Overdue</option>
                <option value="due-soon">🔔 Due Soon (24h)</option>
                <option value="no-due-date">📅 No Due Date</option>
              </select>
            </div>
          </div>
          
          {/* Task Count Summary */}
          <div className={`flex items-center space-x-4 text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <span>Total: {filteredTasks.length} tasks</span>
            {priorityFilter !== 'all' && (
              <span className={`font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`}>
                Showing {priorityFilter} priority tasks
              </span>
            )}
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-2 overflow-x-auto overflow-y-hidden px-2 pb-2" style={{ height: 'calc(100vh - 140px)' }}>
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={column.tasks}
              currentUserId={currentUserId}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="transform rotate-3 opacity-90">
              <TaskCard task={activeTask} currentUserId={currentUserId} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
