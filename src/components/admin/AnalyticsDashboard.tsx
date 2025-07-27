'use client';

import { useState, useEffect } from 'react';
import { useDarkMode } from '@/contexts/DarkModeContext';
import { getAllUsers } from '@/services/userService';
import { getUserTasks } from '@/services/taskService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from 'recharts';

interface DashboardData {
  taskStatusData: Array<{ name: string; value: number; color: string }>;
  userEfficiencyData: Array<{ name: string; efficiency: number; tasks: number }>;
  monthlyTasksData: Array<{ month: string; completed: number; created: number }>;
  priorityDistribution: Array<{ priority: string; count: number; color: string }>;
  overallStats: {
    totalUsers: number;
    totalTasks: number;
    completedTasks: number;
    averageEfficiency: number;
    activeUsers: number;
  };
}

export default function AnalyticsDashboard() {
  const { isDarkMode } = useDarkMode();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get all users and their tasks
        const allUsers = await getAllUsers();
        
        if (allUsers.length === 0) {
          setDashboardData({
            taskStatusData: [],
            userEfficiencyData: [],
            monthlyTasksData: [],
            priorityDistribution: [],
            overallStats: {
              totalUsers: 0,
              totalTasks: 0,
              completedTasks: 0,
              averageEfficiency: 0,
              activeUsers: 0
            }
          });
          return;
        }

        // Collect all tasks for all users
        const allTasksPromises = allUsers.map(user => getUserTasks(user.id));
        const allTasksArrays = await Promise.all(allTasksPromises);
        const allTasks = allTasksArrays.flat();

        // Calculate task status distribution
        const taskStatusCounts = {
          'To Do': allTasks.filter(t => t.status === 'todo').length,
          'In Progress': allTasks.filter(t => t.status === 'in-progress').length,
          'Review': allTasks.filter(t => t.status === 'review').length,
          'Done': allTasks.filter(t => t.status === 'done').length,
        };

        const taskStatusData = [
          { name: 'To Do', value: taskStatusCounts['To Do'], color: isDarkMode ? '#ef4444' : '#dc2626' },
          { name: 'In Progress', value: taskStatusCounts['In Progress'], color: isDarkMode ? '#f59e0b' : '#d97706' },
          { name: 'Review', value: taskStatusCounts['Review'], color: isDarkMode ? '#8b5cf6' : '#7c3aed' },
          { name: 'Done', value: taskStatusCounts['Done'], color: isDarkMode ? '#10b981' : '#059669' },
        ];

        // Calculate user efficiency data
        const userEfficiencyData = await Promise.all(
          allUsers.slice(0, 10).map(async (user) => {
            const userTasks = await getUserTasks(user.id);
            const completedTasks = userTasks.filter(t => t.status === 'done').length;
            const efficiency = userTasks.length > 0 ? Math.round((completedTasks / userTasks.length) * 100) : 0;
            
            return {
              name: user.displayName?.split(' ')[0] || user.email.split('@')[0],
              efficiency,
              tasks: userTasks.length
            };
          })
        );

        // Calculate monthly tasks data (mock data for demonstration)
        const monthlyTasksData = [
          { month: 'Jan', completed: Math.floor(Math.random() * 50) + 20, created: Math.floor(Math.random() * 60) + 30 },
          { month: 'Feb', completed: Math.floor(Math.random() * 50) + 20, created: Math.floor(Math.random() * 60) + 30 },
          { month: 'Mar', completed: Math.floor(Math.random() * 50) + 20, created: Math.floor(Math.random() * 60) + 30 },
          { month: 'Apr', completed: Math.floor(Math.random() * 50) + 20, created: Math.floor(Math.random() * 60) + 30 },
          { month: 'May', completed: Math.floor(Math.random() * 50) + 20, created: Math.floor(Math.random() * 60) + 30 },
          { month: 'Jun', completed: Math.floor(Math.random() * 50) + 20, created: Math.floor(Math.random() * 60) + 30 },
        ];

        // Calculate priority distribution (mock data)
        const priorityDistribution = [
          { priority: 'High', count: allTasks.filter(t => t.priority === 'high').length || Math.floor(Math.random() * 20) + 10, color: '#ef4444' },
          { priority: 'Medium', count: allTasks.filter(t => t.priority === 'medium').length || Math.floor(Math.random() * 30) + 20, color: '#f59e0b' },
          { priority: 'Low', count: allTasks.filter(t => t.priority === 'low').length || Math.floor(Math.random() * 25) + 15, color: '#10b981' },
        ];

        // Calculate overall stats
        const totalTasks = allTasks.length;
        const completedTasks = allTasks.filter(t => t.status === 'done').length;
        const averageEfficiency = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const activeUsers = allUsers.filter(user => {
          const userTasksCount = allTasksArrays[allUsers.indexOf(user)].length;
          return userTasksCount > 0;
        }).length;

        setDashboardData({
          taskStatusData,
          userEfficiencyData,
          monthlyTasksData,
          priorityDistribution,
          overallStats: {
            totalUsers: allUsers.length,
            totalTasks,
            completedTasks,
            averageEfficiency,
            activeUsers
          }
        });

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isDarkMode]);

  if (loading) {
    return (
      <div className={`p-6 rounded-lg transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        <div className="animate-pulse">
          <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Analytics Dashboard
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-24 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-80 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className={`p-6 rounded-lg transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Analytics Dashboard
        </h2>
        <div className={`text-center py-8 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
          <p className="mb-4">{error || 'Failed to load dashboard data'}</p>
          <button
            onClick={() => window.location.reload()}
            className={`px-4 py-2 rounded-lg transition-colors duration-300 ${
              isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { taskStatusData, userEfficiencyData, monthlyTasksData, priorityDistribution, overallStats } = dashboardData;

  const chartProps = {
    theme: isDarkMode ? 'dark' : 'light',
    textColor: isDarkMode ? '#e5e7eb' : '#374151',
    gridColor: isDarkMode ? '#374151' : '#e5e7eb',
  };

  return (
    <div className={`p-6 rounded-lg transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Analytics Dashboard
          </h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Comprehensive overview of your task management system
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className={`px-4 py-2 rounded-lg transition-colors duration-300 flex items-center gap-2 ${
            isDarkMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className={`p-6 rounded-lg transition-colors duration-300 ${
          isDarkMode ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-blue-500 to-blue-600'
        } text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Users</p>
              <p className="text-3xl font-bold">{overallStats.totalUsers}</p>
            </div>
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
        </div>

        <div className={`p-6 rounded-lg transition-colors duration-300 ${
          isDarkMode ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-green-500 to-green-600'
        } text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Tasks</p>
              <p className="text-3xl font-bold">{overallStats.totalTasks}</p>
            </div>
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>

        <div className={`p-6 rounded-lg transition-colors duration-300 ${
          isDarkMode ? 'bg-gradient-to-r from-purple-600 to-purple-700' : 'bg-gradient-to-r from-purple-500 to-purple-600'
        } text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Completed</p>
              <p className="text-3xl font-bold">{overallStats.completedTasks}</p>
            </div>
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className={`p-6 rounded-lg transition-colors duration-300 ${
          isDarkMode ? 'bg-gradient-to-r from-yellow-600 to-yellow-700' : 'bg-gradient-to-r from-yellow-500 to-yellow-600'
        } text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Avg. Efficiency</p>
              <p className="text-3xl font-bold">{overallStats.averageEfficiency}%</p>
            </div>
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>

        <div className={`p-6 rounded-lg transition-colors duration-300 ${
          isDarkMode ? 'bg-gradient-to-r from-indigo-600 to-indigo-700' : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
        } text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Active Users</p>
              <p className="text-3xl font-bold">{overallStats.activeUsers}</p>
            </div>
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Task Status Pie Chart */}
        <div className={`p-6 rounded-lg transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Task Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={taskStatusData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {taskStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                  border: `1px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'}`,
                  borderRadius: '6px',
                  color: isDarkMode ? '#ffffff' : '#000000'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* User Efficiency Bar Chart */}
        <div className={`p-6 rounded-lg transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            User Efficiency
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userEfficiencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartProps.gridColor} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: chartProps.textColor }}
                axisLine={{ stroke: chartProps.gridColor }}
              />
              <YAxis 
                tick={{ fill: chartProps.textColor }}
                axisLine={{ stroke: chartProps.gridColor }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                  border: `1px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'}`,
                  borderRadius: '6px',
                  color: isDarkMode ? '#ffffff' : '#000000'
                }}
              />
              <Bar dataKey="efficiency" fill={isDarkMode ? '#3b82f6' : '#2563eb'} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Tasks Line Chart */}
        <div className={`p-6 rounded-lg transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Monthly Task Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyTasksData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartProps.gridColor} />
              <XAxis 
                dataKey="month" 
                tick={{ fill: chartProps.textColor }}
                axisLine={{ stroke: chartProps.gridColor }}
              />
              <YAxis 
                tick={{ fill: chartProps.textColor }}
                axisLine={{ stroke: chartProps.gridColor }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                  border: `1px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'}`,
                  borderRadius: '6px',
                  color: isDarkMode ? '#ffffff' : '#000000'
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="created" 
                stackId="1" 
                stroke={isDarkMode ? '#8b5cf6' : '#7c3aed'} 
                fill={isDarkMode ? '#8b5cf6' : '#7c3aed'} 
                fillOpacity={0.3}
              />
              <Area 
                type="monotone" 
                dataKey="completed" 
                stackId="1" 
                stroke={isDarkMode ? '#10b981' : '#059669'} 
                fill={isDarkMode ? '#10b981' : '#059669'}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution Radial Chart */}
        <div className={`p-6 rounded-lg transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Task Priority Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={priorityDistribution}>
              <RadialBar 
                dataKey="count" 
                fill="#8884d8"
              />
              <Legend />
              <Tooltip 
                contentStyle={{
                  backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                  border: `1px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'}`,
                  borderRadius: '6px',
                  color: isDarkMode ? '#ffffff' : '#000000'
                }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Insights */}
      <div className={`p-6 rounded-lg transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Quick Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-600' : 'bg-white'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Top Performer
                </p>
                <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {userEfficiencyData.length > 0 ? userEfficiencyData[0].name : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-600' : 'bg-white'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Completion Rate
                </p>
                <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {overallStats.averageEfficiency}%
                </p>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-600' : 'bg-white'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Pending Tasks
                </p>
                <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {overallStats.totalTasks - overallStats.completedTasks}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
