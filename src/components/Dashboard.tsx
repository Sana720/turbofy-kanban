'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDarkMode } from '@/contexts/DarkModeContext';
import { Task, User } from '@/types';
import { subscribeToUserTasks, getAllTasksCount, updateTask } from '@/services/taskService';
import { createSampleTasks } from '@/utils/sampleTasks';
import { runFirestoreDiagnostics } from '@/utils/firestoreDiagnostics';
import KanbanBoard from './KanbanBoard';
import TaskForm from './TaskForm';
import Sidebar from './Sidebar';
import { getAllUsersCount, getAllUsers } from '@/services/userService'; // Add this import
import UserCrud from './admin/UserCrud'; // Add this import
import UserEfficiency from './admin/UserEfficiency';
import UserTaskDetail from './admin/UserTaskDetail';
import AnalyticsDashboard from './admin/AnalyticsDashboard';
import UserAnalyticsDashboard from './UserAnalyticsDashboard';

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userCount, setUserCount] = useState<number>(0);
  const [totalTasks, setTotalTasks] = useState<number>(0);
  const [adminPage, setAdminPage] = useState<string | null>(null);
  const [currentMenuItem, setCurrentMenuItem] = useState<string>('dashboard');
  const [allUsers, setAllUsers] = useState<{ id: string; displayName?: string; email: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  // Example: determine if user is admin (adjust this logic to your app)
  const isAdmin = currentUser?.role === 'admin';

  // Subscribe to user's personal tasks
  useEffect(() => {
    if (!currentUser) return;

    console.log('Setting up task subscription for user:', currentUser.id);
    const unsubscribe = subscribeToUserTasks(currentUser.id, (incomingTasks) => {
      console.log('Received tasks update:', incomingTasks.length, 'tasks');
      
      // Only update if it's been more than 1 second since last manual update
      // This prevents real-time updates from overriding immediate UI changes
      const timeSinceLastUpdate = Date.now() - lastUpdateTime.getTime();
      if (timeSinceLastUpdate > 1000) {
        setUserTasks(incomingTasks);
        setTasks(incomingTasks); // Only use personal tasks
      } else {
        // If recent update, schedule a delayed sync to ensure consistency
        setTimeout(() => {
          setUserTasks(incomingTasks);
          setTasks(incomingTasks);
        }, 1500);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser, lastUpdateTime]);

  // Fetch admin stats
  useEffect(() => {
    if (isAdmin) {
      getAllUsersCount().then(setUserCount);
      getAllTasksCount().then(setTotalTasks);
      getAllUsers().then(setAllUsers);
    }
  }, [isAdmin]);

  const handleTaskCreated = (newTask: Task) => {
    // Don't manually add to local state - let the real-time listener handle it
    // This prevents duplicate tasks
  };

    const handleTaskUpdate = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      const updatedTask = { 
        ...updates, 
        id: taskId, 
        updatedAt: new Date() 
      };

      // Update timestamp to prevent real-time overrides
      setLastUpdateTime(new Date());

      // Immediately update local state for responsive UI
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, ...updatedTask }
            : task
        )
      );
      setUserTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, ...updatedTask }
            : task
        )
      );

      await updateTask(taskId, updates);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }, []);

  if (!currentUser) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Please sign in</h2>
          <p className="text-gray-600">You need to be signed in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  // If user is not active, show limited dashboard
  if (!currentUser.isActive) {
    return (
      <div className="h-screen flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isAdmin={false}
          onAdminNavigate={setAdminPage}
          onMenuItemChange={setCurrentMenuItem}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">Task Manager</h1>
              </div>
              <div>
                <p className="text-gray-600">
                  Welcome, {currentUser.displayName || currentUser.email}!
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="inline-block h-10 w-10 rounded-full bg-blue-100 text-blue-700 font-bold text-lg flex items-center justify-center">
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : currentUser.email[0].toUpperCase()}
                </span>
              </div>
            </div>
          </header>
          <main className="flex-1 flex flex-col items-center justify-center">
            <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-6 py-4 rounded-lg mt-12 text-center max-w-md">
              <h2 className="text-xl font-semibold mb-2">Your account is not active</h2>
              <p className="mb-2">You cannot access tasks or create new tasks until an admin activates your account.</p>
              <p className="text-sm text-yellow-700">Please contact your administrator for activation.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-100'
    }`}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isAdmin={isAdmin}
        onAdminNavigate={setAdminPage}
        onMenuItemChange={setCurrentMenuItem}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className={`shadow-sm border-b px-6 py-4 transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {/* Mobile sidebar open button */}
              <button
                className={`lg:hidden p-2 rounded-md focus:outline-none transition-colors duration-300 ${
                  isDarkMode 
                    ? 'text-gray-300 hover:text-white' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setSidebarOpen(true)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className={`text-2xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Task Manager
              </h1>
            </div>
            <div>
              <p className={`transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Welcome back, {currentUser.displayName || currentUser.email}!
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowTaskForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Task</span>
              </button>
              {tasks.length === 0 && (
                <button
                  onClick={() => createSampleTasks(currentUser.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                  <span>Add Sample Tasks</span>
                </button>
              )}
              <div className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>
                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
              </div>
              
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className={`flex-1 transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
        } ${currentMenuItem === 'kanban' && !adminPage ? '' : 'p-6'}`}>
          {!adminPage && currentMenuItem === 'dashboard' && (
            <>
              {isAdmin ? (
                <AnalyticsDashboard />
              ) : (
                <UserAnalyticsDashboard tasks={tasks} currentUserId={currentUser.id} />
              )}
            </>
          )}

          {!adminPage && !isAdmin && currentMenuItem === 'kanban' && (
            <KanbanBoard
              tasks={tasks}
              currentUserId={currentUser.id}
              onTaskUpdate={handleTaskUpdate}
            />
          )}

          {!adminPage && currentMenuItem === 'profile' && (
            <div className={`rounded-lg shadow p-6 transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <h1 className={`text-3xl font-bold mb-6 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>Profile</h1>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Email</label>
                  <input
                    type="email"
                    value={currentUser?.email || ''}
                    disabled
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm transition-colors duration-300 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-700 text-gray-300' 
                        : 'border-gray-300 bg-gray-50 text-gray-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Display Name</label>
                  <input
                    type="text"
                    value={currentUser?.displayName || ''}
                    disabled
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm transition-colors duration-300 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-700 text-gray-300' 
                        : 'border-gray-300 bg-gray-50 text-gray-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Role</label>
                  <input
                    type="text"
                    value={currentUser?.role || 'Loading...'}
                    disabled
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm transition-colors duration-300 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-700 text-gray-300' 
                        : 'border-gray-300 bg-gray-50 text-gray-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {!adminPage && currentMenuItem === 'settings' && (
            <div className={`rounded-lg shadow p-6 transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <h1 className={`text-3xl font-bold mb-6 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>Settings</h1>
              <div className="space-y-6">
                <div>
                  <h3 className={`text-lg font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-900'
                  }`}>Notifications</h3>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className={`rounded transition-colors duration-300 ${
                          isDarkMode 
                            ? 'border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500' 
                            : 'border-gray-300'
                        }`} 
                        defaultChecked 
                      />
                      <span className={`ml-2 text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Email notifications for new tasks</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className={`rounded transition-colors duration-300 ${
                          isDarkMode 
                            ? 'border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500' 
                            : 'border-gray-300'
                        }`} 
                        defaultChecked 
                      />
                      <span className={`ml-2 text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Push notifications for updates</span>
                    </label>
                  </div>
                </div>
                <div>
                  <h3 className={`text-lg font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-900'
                  }`}>Preferences</h3>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className={`rounded transition-colors duration-300 ${
                          isDarkMode 
                            ? 'border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500' 
                            : 'border-gray-300'
                        }`} 
                      />
                      <span className={`ml-2 text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Dark mode</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className={`rounded transition-colors duration-300 ${
                          isDarkMode 
                            ? 'border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500' 
                            : 'border-gray-300'
                        }`} 
                        defaultChecked 
                      />
                      <span className={`ml-2 text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Auto-save drafts</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!adminPage && currentMenuItem === 'change-password' && (
            <div className={`rounded-lg shadow p-6 transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <h1 className={`text-3xl font-bold mb-6 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>Change Password</h1>
              <form className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Current Password</label>
                  <input
                    type="password"
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>New Password</label>
                  <input
                    type="password"
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Confirm New Password</label>
                  <input
                    type="password"
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300"
                >
                  Update Password
                </button>
              </form>
            </div>
          )}

          {adminPage && (
            <>
              {adminPage === 'users' && <UserCrud />}
              {adminPage === 'efficiency' && <UserEfficiency />}
              {adminPage === 'user-tasks' && selectedUser && (
                <UserTaskDetail 
                  user={selectedUser} 
                  onBack={() => {
                    setAdminPage('efficiency');
                    setSelectedUser(null);
                  }} 
                />
              )}
            </>
          )}
        </main>

        {/* Task Creation Modal */}
        {showTaskForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <TaskForm
              currentUserId={currentUser.id}
              users={isAdmin ? allUsers : undefined} // Pass users only for admin
              onTaskCreated={handleTaskCreated}
              onClose={() => setShowTaskForm(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
