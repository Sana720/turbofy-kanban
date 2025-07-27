'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserCrud from './admin/UserCrud'; 

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

  if (!currentUser) return null;

  // Navigation menu items
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900" fill="currentColor" viewBox="0 0 22 21">
          <path d="M16.975 11H10V4.025a1 1 0 0 0-1.066-.998 8.5 8.5 0 1 0 9.039 9.039.999.999 0 0 0-1-1.066h.002Z"/>
          <path d="M12.5 0c-.157 0-.311.01-.565.027A1 1 0 0 0 11 1.02V10h8.975a1 1 0 0 0 1-.935c.013-.188.028-.374.028-.565A8.51 8.51 0 0 0 12.5 0Z"/>
        </svg>
      ),
      action: () => {
        setActiveMenuItem('dashboard');
        if (onAdminNavigate) onAdminNavigate(null);
        if (onMenuItemChange) onMenuItemChange('dashboard');
        onClose();
      }
    },
    {
      id: 'kanban',
      label: 'Kanban Board',
      icon: (
        <svg className="shrink-0 w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900" fill="currentColor" viewBox="0 0 18 18">
          <path d="M6.143 0H1.857A1.857 1.857 0 0 0 0 1.857v4.286C0 7.169.831 8 1.857 8h4.286A1.857 1.857 0 0 0 8 6.143V1.857A1.857 1.857 0 0 0 6.143 0Zm10 0h-4.286A1.857 1.857 0 0 0 10 1.857v4.286C10 7.169 10.831 8 11.857 8h4.286A1.857 1.857 0 0 0 18 6.143V1.857A1.857 1.857 0 0 0 16.143 0Zm-10 10H1.857A1.857 1.857 0 0 0 0 11.857v4.286C0 17.169.831 18 1.857 18h4.286A1.857 1.857 0 0 0 8 16.143v-4.286A1.857 1.857 0 0 0 6.143 10Zm10 0h-4.286A1.857 1.857 0 0 0 10 11.857v4.286c0 1.026.831 1.857 1.857 1.857h4.286A1.857 1.857 0 0 0 18 16.143v-4.286A1.857 1.857 0 0 0 16.143 10Z"/>
        </svg>
      ),
      action: () => {
        setActiveMenuItem('kanban');
        if (onMenuItemChange) onMenuItemChange('kanban');
        onClose();
      }
    },
    // Admin-only menu items
    ...(isAdmin
      ? [
          {
            id: 'user-management',
            label: 'User Management',
            icon: (
              <svg className="shrink-0 w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900" fill="currentColor" viewBox="0 0 20 18">
                <path d="M14 2a3.963 3.963 0 0 0-1.4.267 6.439 6.439 0 0 1-1.331 6.638A4 4 0 1 0 14 2Zm1 9h-1.264A6.957 6.957 0 0 1 15 15v2a2.97 2.97 0 0 1-.184 1H19a1 1 0 0 0 1-1v-1a5.006 5.006 0 0 0-5-5ZM6.5 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 10H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Z"/>
              </svg>
            ),
            action: () => {
              setActiveMenuItem('user-management');
              if (onAdminNavigate) onAdminNavigate('users');
              if (onMenuItemChange) onMenuItemChange('user-management');
              onClose();
            }
          },
          {
            id: 'user-efficiency',
            label: 'User Efficiency',
            icon: (
              <svg className="shrink-0 w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11 17a4 4 0 01-4-4V5a4 4 0 018 0v8a4 4 0 01-4 4zm0 0v4m0 0h2m-2 0H9"/>
              </svg>
            ),
            action: () => {
              setActiveMenuItem('user-efficiency');
              if (onAdminNavigate) onAdminNavigate('efficiency');
              if (onMenuItemChange) onMenuItemChange('user-efficiency');
              onClose();
            }
          }
        ]
      : []),
    {
      id: 'profile',
      label: 'Profile',
      icon: (
        <svg className="shrink-0 w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      action: () => {
        setActiveMenuItem('profile');
        if (onMenuItemChange) onMenuItemChange('profile');
        onClose();
      }
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg className="shrink-0 w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      action: () => {
        setActiveMenuItem('settings');
        if (onMenuItemChange) onMenuItemChange('settings');
        onClose();
      }
    },
    {
      id: 'change-password',
      label: 'Change Password',
      icon: (
        <svg className="shrink-0 w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6a2 2 0 012-2m0 0V7a2 2 0 012-2m0 0a2 2 0 012-2v2m0 0V7a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      action: () => {
        setActiveMenuItem('change-password');
        if (onMenuItemChange) onMenuItemChange('change-password');
        onClose();
      }
    },
    {
      id: 'logout',
      label: 'Sign Out',
      icon: (
        <svg className="shrink-0 w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
      action: logout,
      className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
    }
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setActiveMenuItem(activeMenuItem === 'menu' ? 'dashboard' : 'menu')}
        type="button"
        className="inline-flex items-center p-2 mt-2 ms-3 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
      >
        <span className="sr-only">Open sidebar</span>
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path clipRule="evenodd" fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"></path>
        </svg>
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden" 
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-40 w-64 h-screen transition-transform lg:relative lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
        sm:translate-x-0
      `}>
        <div className="h-full px-3 py-4 overflow-y-auto bg-gray-50">
          {/* Logo/Brand */}
          <div className="flex items-center ps-2.5 mb-5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <span className="self-center text-xl font-semibold whitespace-nowrap text-gray-900">
              Turbofy
            </span>
          </div>

          {/* Navigation Menu */}
          <ul className="space-y-2 font-medium">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={item.action}
                  className={`
                    w-full flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group text-left transition-colors
                    ${activeMenuItem === item.id ? 'bg-gray-100' : ''}
                    ${item.className || ''}
                  `}
                >
                  {item.icon}
                  <span className="flex-1 ms-3 whitespace-nowrap">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>

          {/* User Profile Section at Bottom */}
          <div className="absolute bottom-4 left-3 right-3 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt="User Avatar" 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  currentUser.displayName?.charAt(0).toUpperCase() || currentUser.email?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {currentUser.displayName || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {currentUser.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Content area with proper margin for sidebar */}
    </>
  );
}
