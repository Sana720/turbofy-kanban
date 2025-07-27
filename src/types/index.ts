import { Timestamp } from 'firebase/firestore';

// User interface
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string| null;
  role: 'admin' | 'member';
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  teamIds: string[]; // Teams the user belongs to
}

// Team interface
export interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string; // User who created the team
  memberIds: string[]; // Array of user IDs
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  settings: {
    isPublic: boolean;
    allowMemberInvites: boolean;
  };
}

// Task interface
export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'review' | 'done';
  dueDate?: Date;
  createdBy: string; // User ID who created the task
  assignedTo?: string; // User ID assigned to the task
  teamId?: string; // Team ID (optional for personal tasks)
  createdAt: Date;
  updatedAt: Date;
  order: number; // For drag and drop ordering
  tags?: string[]; // Optional tags for categorization
  attachments?: string[]; // URLs to attached files
  comments?: TaskComment[];
}

// Kanban column interface
export interface KanbanColumn {
  id: string;
  title: string;
  status: Task['status'];
  tasks: Task[];
}

// Task comment interface
export interface TaskComment {
  id: string;
  content: string;
  authorId: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Team invitation interface
export interface TeamInvitation {
  id: string;
  teamId: string;
  invitedEmail: string;
  invitedBy: string; // User ID
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

// Firestore document types (with Timestamp instead of Date)
export interface UserDoc extends Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLoginAt'> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
}

export interface TeamDoc extends Omit<Team, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TaskDoc extends Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'dueDate' | 'comments'> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  dueDate?: Timestamp;
  comments?: TaskCommentDoc[];
}

export interface TaskCommentDoc extends Omit<TaskComment, 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface TeamInvitationDoc extends Omit<TeamInvitation, 'id' | 'createdAt' | 'expiresAt'> {
  createdAt: Timestamp;
  expiresAt: Timestamp;
}
