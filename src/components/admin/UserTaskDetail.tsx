import { useEffect, useState } from 'react';
import { useDarkMode } from '@/contexts/DarkModeContext';
import { getUserTasks } from '@/services/taskService';
import { Task, User } from '@/types';
import TaskCard from '../TaskCard';

export default function UserTaskDetail({ user, onBack }: { user: User; onBack: () => void }) {
  const { isDarkMode } = useDarkMode();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserTasks(user.id).then((tasks) => {
      setTasks(tasks);
      setLoading(false);
    });
  }, [user.id]);

  if (loading) return (
    <div className={`transition-colors duration-300 ${
      isDarkMode ? 'text-white' : 'text-gray-900'
    }`}>
      Loading tasks...
    </div>
  );

  // Group tasks by status
  const grouped = tasks.reduce<Record<string, Task[]>>((acc, task) => {
    acc[task.status] = acc[task.status] || [];
    acc[task.status].push(task);
    return acc;
  }, {});

  const statuses: { id: Task['status']; label: string }[] = [
    { id: 'todo', label: 'To Do' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'review', label: 'Review' },
    { id: 'done', label: 'Done' },
  ];

  return (
    <div>
      <button className="mb-4 text-blue-600 hover:text-blue-500 font-medium transition-colors duration-300" onClick={onBack}>
        ← Back to Efficiency
      </button>
      <h2 className={`text-xl font-bold mb-6 transition-colors duration-300 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>
        Tasks for {user.displayName || user.email}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statuses.map(({ id, label }) => (
          <div key={id} className={`rounded-lg shadow p-4 flex flex-col transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`font-semibold text-lg mb-3 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>{label}</h3>
            {grouped[id]?.length ? (
              <div className="flex flex-col gap-3">
                {grouped[id].map((task) => (
                  <TaskCard key={task.id} task={task} currentUserId={user.id} />
                ))}
              </div>
            ) : (
              <div className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>No tasks</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}