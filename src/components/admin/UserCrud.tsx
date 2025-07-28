import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getAllUsers, updateUserProfile, deleteUser } from '@/services/userService';
import { getUserTasks } from '@/services/taskService';
import { useAuth } from '@/contexts/AuthContext';
import { useDarkMode } from '@/contexts/DarkModeContext';
import { User } from '@/types';
import Swal from 'sweetalert2';

interface UserWithStats extends User {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function formatDate(date: any) {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? new Date(date) : date.toDate ? date.toDate() : date;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

// Modal for add/edit user
function UserModal({ user, onClose, onSave }: { user: UserWithStats | null, onClose: () => void, onSave: (user: UserWithStats) => void }) {
  const { isDarkMode } = useDarkMode();
  const [form, setForm] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    role: user?.role || 'member',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ ...user, ...form, totalTasks: 0, completedTasks: 0, pendingTasks: 0 } as UserWithStats);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className={`rounded-xl shadow-xl border w-full max-w-md transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        <div className={`px-6 py-5 border-b transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className={`text-xl font-semibold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>{user ? 'Edit User' : 'Add User'}</h3>
          <p className={`text-sm mt-1 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {user ? 'Update user information and permissions' : 'Create a new team member account'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className={`block text-sm mb-2 font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>Full Name</label>
            <input
              name="displayName"
              value={form.displayName}
              onChange={handleChange}
              required
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300 ${
                isDarkMode 
                  ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:bg-gray-700' 
                  : 'border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500 focus:bg-white'
              }`}
              placeholder="Enter full name"
            />
          </div>
          <div>
            <label className={`block text-sm mb-2 font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>Email Address</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300 ${
                isDarkMode 
                  ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:bg-gray-700' 
                  : 'border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500 focus:bg-white'
              }`}
              placeholder="Enter email address"
            />
          </div>
          <div>
            <label className={`block text-sm mb-2 font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300 ${
                isDarkMode 
                  ? 'border-gray-600 bg-gray-700 text-white focus:bg-gray-700' 
                  : 'border-gray-200 bg-gray-50 text-gray-900 focus:bg-white'
              }`}
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
            </select>
          </div>
          <div className={`flex justify-end gap-3 pt-6 border-t transition-colors duration-300 ${
            isDarkMode ? 'border-gray-700' : 'border-gray-100'
          }`}>
            <button 
              type="button" 
              onClick={onClose} 
              className={`px-5 py-2.5 rounded-lg font-medium transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving} 
              className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors duration-300 shadow-sm"
            >
              {saving ? 'Saving...' : 'Save User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UserCrud() {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithStats | null>(null);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [togglingUsers, setTogglingUsers] = useState<Set<string>>(new Set());
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  // Filtered users
  const filteredUsers = users.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Handlers
  async function fetchUsers() {
    setLoading(true);
    setError('');
    try {
      const data = await getAllUsers();
      console.log('Fetched users:', data.length);
      
      if (data.length === 0) {
        setUsers([]);
        return;
      }

      // Get user statistics for each user
      const usersWithStats = await Promise.all(
        data.map(async (u: any) => {
          try {
            // Get tasks for this user
            const userTasks = await getUserTasks(u.id);
            
            // Calculate statistics
            const totalTasks = userTasks.length;
            const completedTasks = userTasks.filter(task => task.status === 'done').length;
            const pendingTasks = userTasks.filter(task => 
              task.status === 'todo' || task.status === 'in-progress' || task.status === 'review'
            ).length;

            return {
              id: u.id,
              displayName: u.displayName || '',
              email: u.email || '',
              role: u.role || 'member',
              createdAt: u.createdAt || new Date(),
              updatedAt: u.updatedAt || new Date(),
              isActive: typeof u.isActive === 'boolean' ? u.isActive : true,
              teamIds: u.teamIds || [],
              lastLoginAt: u.lastLoginAt,
              photoURL: u.photoURL,
              totalTasks,
              completedTasks,
              pendingTasks,
            } as UserWithStats;
          } catch (userError) {
            console.error(`Error fetching tasks for user ${u.displayName || u.email}:`, userError);
            // Return user with zero task counts if there's an error
            return {
              id: u.id,
              displayName: u.displayName || '',
              email: u.email || '',
              role: u.role || 'member',
              createdAt: u.createdAt || new Date(),
              updatedAt: u.updatedAt || new Date(),
              isActive: typeof u.isActive === 'boolean' ? u.isActive : true,
              teamIds: u.teamIds || [],
              lastLoginAt: u.lastLoginAt,
              photoURL: u.photoURL,
              totalTasks: 0,
              completedTasks: 0,
              pendingTasks: 0,
            } as UserWithStats;
          }
        })
      );

      setUsers(usersWithStats);
    } catch (e) {
      console.error('Error fetching users:', e);
      setError('Failed to fetch users. Please try again.');
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(user: UserWithStats) {
    setLoading(true);
    try {
      // Clean the user object to remove undefined fields
      const cleanUser = {
        ...user,
        // Remove undefined fields that cause Firestore errors
        ...(user.lastLoginAt !== undefined && { lastLoginAt: user.lastLoginAt }),
        // Ensure required fields are present
        displayName: user.displayName || '',
        email: user.email || '',
        role: user.role || 'member',
        isActive: typeof user.isActive === 'boolean' ? user.isActive : true,
        teamIds: user.teamIds || [],
        updatedAt: new Date(),
      };
      
      await updateUserProfile(cleanUser.id, cleanUser);
      toast.success('User updated');
      fetchUsers();
      setShowModal(false);
      setEditingUser(null);
    } catch (e) {
      toast.error('Failed to update user');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(user: UserWithStats) {
    const result = await Swal.fire({
      title: 'Delete User?',
      text: `Are you sure you want to delete ${user.displayName || user.email}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete user',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      focusCancel: true
    });

    if (!result.isConfirmed) return;
    
    setLoading(true);
    try {
      await deleteUser(user.id);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (e) {
      toast.error('Failed to delete user');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(user: UserWithStats) {
    // Add user to toggling set
    setTogglingUsers(prev => new Set([...prev, user.id]));
    
    try {
      const updatedUser = {
        ...user,
        isActive: !user.isActive,
        updatedAt: new Date(),
      };
      
      await updateUserProfile(user.id, updatedUser);
      toast.success(`User ${!user.isActive ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (e) {
      toast.error('Failed to update user status');
    } finally {
      // Remove user from toggling set
      setTogglingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(user.id);
        return newSet;
      });
    }
  }

  function handleEdit(user: UserWithStats) {
    setEditingUser(user);
    setShowModal(true);
  }

  // Loading state
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
          }`}>User Management</h2>
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

  // Error state
  if (error) {
    return (
      <div className={`p-6 rounded-lg transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-800 text-white' 
          : 'bg-white text-gray-900'
      }`}>
        <h2 className={`text-2xl font-bold mb-6 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>User Management</h2>
        <div className={`text-center py-8 transition-colors duration-300 ${
          isDarkMode ? 'text-red-400' : 'text-red-600'
        }`}>
          <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => fetchUsers()}
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

  // UI
  return (
    <div className={`p-6 rounded-lg transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-800 text-white' 
        : 'bg-white text-gray-900'
    }`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-bold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>User Management</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchUsers()}
            disabled={loading}
            className={`px-4 py-2 rounded-lg transition-colors duration-300 flex items-center gap-2 ${
              isDarkMode
                ? 'bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white'
                : 'bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => { setEditingUser(null); setShowModal(true); }}
            className={`px-4 py-2 rounded-lg transition-colors duration-300 flex items-center gap-2 ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </button>
        </div>
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
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`}>
              {users.filter(user => user.isActive).length}
            </div>
            <div className={`text-sm ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Active Users
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
              isDarkMode ? 'text-purple-400' : 'text-purple-600'
            }`}>
              {users.filter(user => user.role === 'admin').length}
            </div>
            <div className={`text-sm ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Admin Users
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <svg className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300 ${
              isDarkMode 
                ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:bg-gray-700' 
                : 'border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500 focus:bg-white'
            }`}
          />
        </div>
      </div>
      {/* Users Table */}
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
              }`}>Role</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>Tasks</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>Status</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>Joined</th>
              <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y transition-colors duration-300 ${
            isDarkMode ? 'divide-gray-600' : 'divide-gray-200'
          }`}>
            {currentUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className={`text-center py-8 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {search ? 'No users found matching your search.' : 'No users found.'}
                </td>
              </tr>
            ) : (
              currentUsers.map(user => (
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
                        {getInitials(user.displayName || user.email)}
                      </div>
                      <div className="ml-4">
                        <div className={`text-sm font-medium transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{user.displayName || 'Unnamed User'}</div>
                        <div className={`text-sm transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      user.role === 'admin' 
                        ? (isDarkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-800')
                        : user.role === 'member' 
                        ? (isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800')
                        : (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800')
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className={`font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {user.totalTasks} total
                      </div>
                      <div className={`transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {user.completedTasks} completed, {user.pendingTasks} pending
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={togglingUsers.has(user.id)}
                        className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          togglingUsers.has(user.id)
                            ? 'opacity-50 cursor-not-allowed bg-gray-500'
                            : user.isActive
                              ? isDarkMode ? 'bg-green-600' : 'bg-green-400'
                              : isDarkMode ? 'bg-red-700' : 'bg-red-400'
                        }`}
                        style={{ borderRadius: '999px', padding: 0, border: 'none' }}
                      >
                        <span
                          className={`absolute left-1 top-1/2 transform -translate-y-1/2 h-4 w-4 rounded-full transition-transform duration-300 bg-white shadow-md ${
                            user.isActive
                              ? 'translate-x-6'
                              : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className={`text-xs font-medium transition-colors duration-300 select-none ${
                        user.isActive
                          ? isDarkMode ? 'text-green-400' : 'text-green-600'
                          : isDarkMode ? 'text-red-400' : 'text-red-600'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-900'
                  }`}>
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="group relative">
                        <button
                          onClick={() => handleEdit(user)}
                          disabled={loading}
                          className={`p-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                            isDarkMode
                              ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/50'
                              : 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'
                          }`}
                          title="Edit user"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none ${
                          isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-800 text-white'
                        }`}>
                          Edit User
                        </div>
                      </div>
                      <div className="group relative">
                        <button
                          onClick={() => handleDelete(user)}
                          disabled={loading}
                          className={`p-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                            isDarkMode
                              ? 'text-red-400 hover:text-red-300 hover:bg-red-900/50'
                              : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                          }`}
                          title="Delete user"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none ${
                          isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-800 text-white'
                        }`}>
                          Delete User
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={`flex items-center justify-between mt-6 p-4 rounded-lg transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <div className={`text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-lg border transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                isDarkMode
                  ? 'border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-300 ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : isDarkMode
                        ? 'border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-lg border transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                isDarkMode
                  ? 'border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
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

      {/* Modal */}
      {showModal && (
        <UserModal
          user={editingUser}
          onClose={() => { setShowModal(false); setEditingUser(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}