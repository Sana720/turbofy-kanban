'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDarkMode } from '@/contexts/DarkModeContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  onAdminNavigate?: (page: string | null) => void;
  onMenuItemChange?: (menuItem: string) => void;
}

export default function Sidebar({ isOpen, onClose, isAdmin, onAdminNavigate, onMenuItemChange }: SidebarProps) {
  const { currentUser, logout } = useAuth();
  const [activeMenuItem, setActiveMenuItem] = useState<string>('dashboard');
  const { isDarkMode } = useDarkMode();

  if (!currentUser) return null;

  // Admin menu items
  const adminMenuItems = isAdmin
    ? [
        {
          id: 'user-management',
          label: 'User Management',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          ),
          action: () => {
            setActiveMenuItem('user-management');
            if (onAdminNavigate) onAdminNavigate('users');
            if (onMenuItemChange) onMenuItemChange('admin'); // Clear regular menu
            onClose();
          }
        },
        {
          id: 'user-efficiency',
          label: 'User Efficiency',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
          action: () => {
            setActiveMenuItem('user-efficiency');
            if (onAdminNavigate) onAdminNavigate('efficiency');
            if (onMenuItemChange) onMenuItemChange('admin'); // Clear regular menu
            onClose();
          }
        }
      ]
    : [];

  // Regular menu items
  const regularMenuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
        </svg>
      ),
      action: () => {
        setActiveMenuItem('dashboard');
        if (onMenuItemChange) onMenuItemChange('dashboard');
        if (onAdminNavigate) onAdminNavigate(null);
        onClose();
      }
    },
    // Only show Kanban Board for non-admin users
    ...(isAdmin ? [] : [{
      id: 'kanban',
      label: 'Kanban Board',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      ),
      action: () => {
        setActiveMenuItem('kanban');
        if (onMenuItemChange) onMenuItemChange('kanban');
        if (onAdminNavigate) onAdminNavigate(null);
        onClose();
      }
    }]),
    {
      id: 'profile',
      label: 'Profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      action: () => {
        setActiveMenuItem('profile');
        if (onMenuItemChange) onMenuItemChange('profile');
        if (onAdminNavigate) onAdminNavigate(null);
        onClose();
      }
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      action: () => {
        setActiveMenuItem('settings');
        if (onMenuItemChange) onMenuItemChange('settings');
        if (onAdminNavigate) onAdminNavigate(null);
        onClose();
      }
    },
    {
      id: 'change-password',
      label: 'Change Password',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      action: () => {
        setActiveMenuItem('change-password');
        if (onMenuItemChange) onMenuItemChange('change-password');
        if (onAdminNavigate) onAdminNavigate(null);
        onClose();
      }
    }
  ];

  const allMenuItems = [...regularMenuItems, ...adminMenuItems];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-40 w-72 h-screen transition-transform lg:relative lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
        sm:translate-x-0
      `}>
        <div className={`h-full flex flex-col transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-gray-900 border-gray-700' 
            : 'bg-gradient-to-b from-slate-50 to-white border-gray-200'
        } border-r shadow-lg`}>
          {/* Header */}
          <div className={`flex items-center justify-center h-16 px-6 border-b transition-colors duration-300 ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <span className={`text-xl font-bold transition-colors duration-300 hidden sm:block ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Turbofy
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-3 overflow-y-auto">
            {allMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={item.action}
                className={`
                  group w-full flex items-center p-4 rounded-xl transition-all duration-300 transform hover:scale-105
                  ${activeMenuItem === item.id 
                    ? isDarkMode
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                    : isDarkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
                      : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 border border-gray-200 shadow-sm'
                  }
                `}
              >
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-lg mr-4 transition-all duration-300
                  ${activeMenuItem === item.id 
                    ? 'bg-white/20 text-white' 
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-400 group-hover:bg-gray-600 group-hover:text-white'
                      : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700'
                  }
                `}>
                  {item.icon}
                </div>
                <div className="flex-1 text-left">
                  <span className="text-sm font-semibold">{item.label}</span>
                  {activeMenuItem === item.id && (
                    <div className="w-full h-0.5 bg-white/30 rounded-full mt-1"></div>
                  )}
                </div>
                {activeMenuItem === item.id && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </button>
            ))}
            
            {/* Logout Button */}
            <button
              onClick={logout}
              className={`
                group w-full flex items-center p-4 rounded-xl transition-all duration-300 transform hover:scale-105 mt-6
                ${isDarkMode
                  ? 'bg-red-900/50 text-red-400 hover:bg-red-900 hover:text-red-300 border border-red-800'
                  : 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200'
                }
              `}
            >
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-lg mr-4 transition-all duration-300
                ${isDarkMode
                  ? 'bg-red-800 text-red-400 group-hover:bg-red-700 group-hover:text-red-300'
                  : 'bg-red-100 text-red-500 group-hover:bg-red-200 group-hover:text-red-600'
                }
              `}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <span className="text-sm font-semibold">Sign Out</span>
            </button>
          </nav>

          {/* User Profile Section */}
          <div className={`border-t p-4 transition-colors duration-300 ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : currentUser.email[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {currentUser.displayName || 'User'}
                </p>
                <p className={`text-xs truncate transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {currentUser.email}
                </p>
                <div className={`flex items-center mt-1`}>
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className={`text-xs font-medium ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`}>
                    Online
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
