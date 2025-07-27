'use client';

import { useState, useEffect } from 'react';
import { useDarkMode } from '@/contexts/DarkModeContext';
import { Task } from '@/types';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar
} from 'recharts';

interface UserAnalyticsDashboardProps {
  tasks: Task[];
  currentUserId: string;
}

export default function UserAnalyticsDashboard({ tasks, currentUserId }: UserAnalyticsDashboardProps) {
  const { isDarkMode } = useDarkMode();
  
  // Filter tasks for current user only
  const userTasks = tasks.filter(task => task.createdBy === currentUserId || task.assignedTo === currentUserId);

  // Calculate task statistics
  const taskStats = {
    total: userTasks.length,
    todo: userTasks.filter(task => task.status === 'todo').length,
    inProgress: userTasks.filter(task => task.status === 'in-progress').length,
    review: userTasks.filter(task => task.status === 'review').length,
    done: userTasks.filter(task => task.status === 'done').length,
    overdue: userTasks.filter(task => task.dueDate && task.dueDate < new Date() && task.status !== 'done').length,
    dueSoon: userTasks.filter(task => {
      if (!task.dueDate || task.status === 'done') return false;
      const now = new Date();
      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      return task.dueDate >= now && task.dueDate <= oneDayFromNow;
    }).length,
  };

  // Calculate priority distribution
  const priorityData = [
    { name: 'High Priority', value: userTasks.filter(task => task.priority === 'high').length, color: '#ef4444' },
    { name: 'Medium Priority', value: userTasks.filter(task => task.priority === 'medium').length, color: '#f59e0b' },
    { name: 'Low Priority', value: userTasks.filter(task => (task.priority || 'low') === 'low').length, color: '#10b981' },
  ];

  // Calculate status distribution for pie chart
  const statusData = [
    { name: 'To Do', value: taskStats.todo, color: '#6b7280' },
    { name: 'In Progress', value: taskStats.inProgress, color: '#3b82f6' },
    { name: 'Review', value: taskStats.review, color: '#f59e0b' },
    { name: 'Done', value: taskStats.done, color: '#10b981' },
  ].filter(item => item.value > 0);

  // Calculate weekly progress (last 7 days)
  const getWeeklyProgress = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    return last7Days.map(date => {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const completedTasks = userTasks.filter(task => {
        if (!task.updatedAt || task.status !== 'done') return false;
        const taskDate = new Date(task.updatedAt);
        return taskDate.toDateString() === date.toDateString();
      }).length;

      return {
        day: dayName,
        completed: completedTasks,
        date: date.toDateString()
      };
    });
  };

  const weeklyData = getWeeklyProgress();

  // Calculate completion rate
  const completionRate = taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0;

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-lg shadow-lg border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-600 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        }`}>
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          My Analytics Dashboard
        </h1>
        <p className={`transition-colors duration-300 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Your personal task management insights and progress
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`rounded-xl p-6 transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
            : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
        } hover:shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Total Tasks</p>
              <p className="text-3xl font-bold text-blue-600">{taskStats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-6 transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
            : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
        } hover:shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Completed</p>
              <p className="text-3xl font-bold text-green-600">{taskStats.done}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-6 transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
            : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
        } hover:shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>In Progress</p>
              <p className="text-3xl font-bold text-yellow-600">{taskStats.inProgress}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-6 transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
            : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
        } hover:shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Completion Rate</p>
              <p className="text-3xl font-bold text-purple-600">{completionRate}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <div className={`rounded-xl p-6 transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
            : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Task Status Distribution</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className={`text-gray-500 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No tasks to display
              </p>
            </div>
          )}
        </div>

        {/* Priority Distribution */}
        <div className={`rounded-xl p-6 transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
            : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Priority Distribution</h3>
          {priorityData.some(item => item.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={priorityData}>
                <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </RadialBarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className={`text-gray-500 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No tasks to display
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Progress */}
      <div className={`rounded-xl p-6 transition-all duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
          : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>Weekly Progress (Tasks Completed)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
            <XAxis 
              dataKey="day" 
              stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
              fontSize={12}
            />
            <YAxis 
              stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="completed" 
              stroke="#3b82f6" 
              fill="#3b82f6" 
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Task Urgency */}
      {(taskStats.overdue > 0 || taskStats.dueSoon > 0) && (
        <div className={`rounded-xl p-6 transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-red-900/20 to-orange-900/20 border border-red-700/50' 
            : 'bg-gradient-to-br from-red-50 to-orange-50 border border-red-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>⚠️ Task Urgency Alert</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {taskStats.overdue > 0 && (
              <div className={`p-4 rounded-lg ${
                isDarkMode 
                  ? 'bg-red-900/30 border border-red-700' 
                  : 'bg-red-100 border border-red-300'
              }`}>
                <p className="text-red-600 font-semibold">Overdue Tasks</p>
                <p className="text-2xl font-bold text-red-700">{taskStats.overdue}</p>
                <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>
                  Need immediate attention
                </p>
              </div>
            )}
            {taskStats.dueSoon > 0 && (
              <div className={`p-4 rounded-lg ${
                isDarkMode 
                  ? 'bg-orange-900/30 border border-orange-700' 
                  : 'bg-orange-100 border border-orange-300'
              }`}>
                <p className="text-orange-600 font-semibold">Due Soon</p>
                <p className="text-2xl font-bold text-orange-700">{taskStats.dueSoon}</p>
                <p className={`text-sm ${isDarkMode ? 'text-orange-300' : 'text-orange-600'}`}>
                  Due within 24 hours
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
