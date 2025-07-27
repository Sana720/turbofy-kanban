'use client';

import { useState, useEffect } from 'react';
import { useDarkMode } from '@/contexts/DarkModeContext';
import { getAllUsers } from '@/services/userService';
import { getUserTasks } from '@/services/taskService';
import { User, Task } from '@/types';

interface UserEfficiencyData {
  id: string;
  name: string;
  email: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  efficiency: number;
  averageCompletionTime: string;
}

export default function UserEfficiency() {
  const { isDarkMode } = useDarkMode();
  const [users, setUsers] = useState<UserEfficiencyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserEfficiencyData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get all users
        const allUsers = await getAllUsers();
        console.log('Fetched users:', allUsers.length);
        
        if (allUsers.length === 0) {
          setUsers([]);
          return;
        }
        
        // Calculate efficiency data for each user
        const efficiencyPromises = allUsers.map(async (user) => {
          try {
            // Get all tasks for this user
            const userTasks = await getUserTasks(user.id);
            console.log(`User ${user.displayName || user.email} has ${userTasks.length} tasks`);
            
            // Calculate task statistics
            const totalTasks = userTasks.length;
            const completedTasks = userTasks.filter(task => task.status === 'done').length;
            const pendingTasks = userTasks.filter(task => 
              task.status === 'todo' || task.status === 'in-progress' || task.status === 'review'
            ).length;
            
            // Calculate overdue tasks
            const now = new Date();
            const overdueTasks = userTasks.filter(task => 
              task.dueDate && task.dueDate < now && task.status !== 'done'
            ).length;
            
            // Calculate efficiency percentage
            const efficiency = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            
            // Calculate average completion time for completed tasks
            const completedTasksWithDueDate = userTasks.filter(task => 
              task.status === 'done' && task.dueDate && task.updatedAt
            );
            
            let averageCompletionTime = 'N/A';
            if (completedTasksWithDueDate.length > 0) {
              const totalCompletionDays = completedTasksWithDueDate.reduce((sum, task) => {
                const completionTime = task.updatedAt.getTime() - task.createdAt.getTime();
                return sum + (completionTime / (1000 * 60 * 60 * 24)); // Convert to days
              }, 0);
              
              const avgDays = totalCompletionDays / completedTasksWithDueDate.length;
              averageCompletionTime = avgDays < 1 
                ? `${Math.round(avgDays * 24)} hours`
                : `${avgDays.toFixed(1)} days`;
            }

            return {
              id: user.id,
              name: user.displayName || 'Unnamed User',
              email: user.email,
              totalTasks,
              completedTasks,
              pendingTasks,
              overdueTasks,
              efficiency,
              averageCompletionTime
            };
          } catch (userError) {
            console.error(`Error calculating efficiency for user ${user.displayName || user.email}:`, userError);
            // Return default data for this user if there's an error
            return {
              id: user.id,
              name: user.displayName || 'Unnamed User',
              email: user.email,
              totalTasks: 0,
              completedTasks: 0,
              pendingTasks: 0,
              overdueTasks: 0,
              efficiency: 0,
              averageCompletionTime: 'N/A'
            };
          }
        });

        // Wait for all user data to be processed
        const efficiencyData = await Promise.all(efficiencyPromises);

        // Sort by efficiency (highest first)
        efficiencyData.sort((a, b) => b.efficiency - a.efficiency);
        
        setUsers(efficiencyData);
      } catch (err) {
        console.error('Error fetching user efficiency data:', err);
        setError('Failed to load user efficiency data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserEfficiencyData();
  }, []);

  if (loading) {
    return (
      <div className={`p-6 rounded-lg transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-800 text-white' 
          : 'bg-white text-gray-900'
      }`}>
        <div className="animate-pulse">
          <h2 className={`text-2xl font-bold mb-6 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>User Efficiency Report</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-16 rounded ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 rounded-lg transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-800 text-white' 
          : 'bg-white text-gray-900'
      }`}>
        <h2 className={`text-2xl font-bold mb-6 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>User Efficiency Report</h2>
        <div className={`text-center py-8 transition-colors duration-300 ${
          isDarkMode ? 'text-red-400' : 'text-red-600'
        }`}>
          <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className={`px-4 py-2 rounded-lg transition-colors duration-300 ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-lg transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-800 text-white' 
        : 'bg-white text-gray-900'
    }`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-bold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>User Efficiency Report</h2>
        <button
          onClick={() => window.location.reload()}
          disabled={loading}
          className={`px-4 py-2 rounded-lg transition-colors duration-300 flex items-center gap-2 ${
            isDarkMode
              ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Summary Statistics */}
      {users.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-lg transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className={`text-2xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {users.length}
            </div>
            <div className={`text-sm ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Total Users
            </div>
          </div>
          <div className={`p-4 rounded-lg transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className={`text-2xl font-bold ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`}>
              {users.reduce((sum, user) => sum + user.totalTasks, 0)}
            </div>
            <div className={`text-sm ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Total Tasks
            </div>
          </div>
          <div className={`p-4 rounded-lg transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className={`text-2xl font-bold ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`}>
              {users.reduce((sum, user) => sum + user.completedTasks, 0)}
            </div>
            <div className={`text-sm ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Completed Tasks
            </div>
          </div>
          <div className={`p-4 rounded-lg transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className={`text-2xl font-bold ${
              isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
            }`}>
              {Math.round(users.reduce((sum, user) => sum + user.efficiency, 0) / users.length) || 0}%
            </div>
            <div className={`text-sm ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Avg. Efficiency
            </div>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className={`min-w-full rounded-lg overflow-hidden transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <thead className={`transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>User</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>Total Tasks</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>Completed</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>Pending</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>Overdue</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>Efficiency</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>Avg. Completion</th>
            </tr>
          </thead>
          <tbody className={`divide-y transition-colors duration-300 ${
            isDarkMode ? 'divide-gray-600' : 'divide-gray-200'
          }`}>
            {users.map((user, index) => (
              <tr key={user.id} className={`transition-colors duration-300 hover:${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <td className={`px-6 py-4 whitespace-nowrap transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="ml-4">
                      <div className={`text-sm font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{user.name}</div>
                      <div className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-900'
                }`}>{user.totalTasks}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-green-400' : 'text-green-600'
                }`}>{user.completedTasks}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                }`}>{user.pendingTasks}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`}>{user.overdueTasks}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`text-sm font-medium transition-colors duration-300 ${
                      user.efficiency >= 80 
                        ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                        : user.efficiency >= 60 
                        ? (isDarkMode ? 'text-yellow-400' : 'text-yellow-600')
                        : (isDarkMode ? 'text-red-400' : 'text-red-600')
                    }`}>
                      {user.efficiency}%
                    </div>
                    <div className={`ml-2 w-16 h-2 rounded-full transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                    }`}>
                      <div 
                        className={`h-2 rounded-full transition-colors duration-300 ${
                          user.efficiency >= 80 
                            ? 'bg-green-500'
                            : user.efficiency >= 60 
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${user.efficiency}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-900'
                }`}>{user.averageCompletionTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && !loading && !error && (
        <div className={`text-center py-8 transition-colors duration-300 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-lg font-medium mb-2">No users found</p>
          <p className="text-sm">There are no registered users in the system yet.</p>
        </div>
      )}
    </div>
  );
}
