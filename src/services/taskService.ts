import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  writeBatch,
  and,
  or
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Task, TaskDoc } from '@/types';

const TASKS_COLLECTION = 'tasks';

// Create a new task
export const createTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const now = new Date();
    const taskData: any = {
      title: task.title,
      priority: task.priority,
      status: task.status,
      createdBy: task.createdBy,
      order: task.order,
      tags: task.tags || [],
      attachments: task.attachments || [],
      comments: task.comments || [],
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    };

    // Only add fields that are not undefined
    if (task.description !== undefined) {
      taskData.description = task.description;
    }
    if (task.assignedTo !== undefined) {
      taskData.assignedTo = task.assignedTo;
    }
    if (task.teamId !== undefined) {
      taskData.teamId = task.teamId;
    }
    if (task.dueDate !== undefined) {
      taskData.dueDate = Timestamp.fromDate(task.dueDate);
    }
    
    const docRef = await addDoc(collection(db, TASKS_COLLECTION), taskData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

// Update an existing task
export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<void> => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    const updateData: any = {
      updatedAt: Timestamp.fromDate(new Date())
    };

    // Only add defined fields to avoid Firestore undefined errors
    Object.keys(updates).forEach(key => {
      const value = updates[key as keyof Task];
      if (value !== undefined) {
        if (key === 'dueDate' && value instanceof Date) {
          updateData[key] = Timestamp.fromDate(value);
        } else if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
          updateData[key] = value;
        }
      }
    });
    console.log('[updateTask] Writing to Firestore:', { taskId, updateData });
    await updateDoc(taskRef, updateData);
    console.log('[updateTask] Firestore update successful:', { taskId });
  } catch (error) {
    console.error('[updateTask] Error updating task:', error);
    throw error;
  }
};

// Delete a task
export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    await deleteDoc(taskRef);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

// Get tasks created by a user
export const getUserCreatedTasks = async (userId: string): Promise<Task[]> => {
  try {
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('createdBy', '==', userId),
      orderBy('order', 'asc'),
      orderBy('createdAt', 'desc')
    );
    
    return await executeTaskQuery(q);
  } catch (error) {
    console.error('Error getting user created tasks:', error);
    throw error;
  }
};

// Get tasks assigned to a user
export const getUserAssignedTasks = async (userId: string): Promise<Task[]> => {
  try {
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('assignedTo', '==', userId),
      orderBy('order', 'asc'),
      orderBy('createdAt', 'desc')
    );
    
    return await executeTaskQuery(q);
  } catch (error) {
    console.error('Error getting user assigned tasks:', error);
    throw error;
  }
};

// Get all tasks for a user (created by or assigned to)
export const getUserTasks = async (userId: string): Promise<Task[]> => {
  try {
    // Get tasks created by user
    const createdTasks = await getUserCreatedTasks(userId);

    // Get tasks assigned to user
    const assignedTasks = await getUserAssignedTasks(userId);

    // Combine and deduplicate tasks
    const taskMap = new Map<string, Task>();
    [...createdTasks, ...assignedTasks].forEach(task => {
      taskMap.set(task.id, task);
    });

    return Array.from(taskMap.values()).sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  } catch (error) {
    console.error('Error getting user tasks:', error);
    throw error;
  }
};

// Get team tasks
export const getTeamTasks = async (teamId: string): Promise<Task[]> => {
  try {
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('teamId', '==', teamId),
      orderBy('order', 'asc'),
      orderBy('createdAt', 'desc')
    );
    
    return await executeTaskQuery(q);
  } catch (error) {
    console.error('Error getting team tasks:', error);
    throw error;
  }
};

// Helper function to execute task queries and convert data
const executeTaskQuery = async (q: any): Promise<Task[]> => {
  const querySnapshot = await getDocs(q);
  const tasks: Task[] = [];
  
  querySnapshot.forEach((doc) => {
    const data = doc.data() as TaskDoc;
    tasks.push({
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      dueDate: data.dueDate?.toDate(),
      comments: data.comments?.map(comment => ({
        ...comment,
        createdAt: comment.createdAt.toDate(),
        updatedAt: comment.updatedAt?.toDate()
      }))
    });
  });
  
  return tasks;
};

// Real-time subscription to user tasks
export const subscribeToUserTasks = (
  userId: string,
  callback: (tasks: Task[]) => void
): (() => void) => {
  // Listen for tasks created by the user
  const createdByQuery = query(
    collection(db, TASKS_COLLECTION),
    where('createdBy', '==', userId),
    orderBy('order', 'asc'),
    orderBy('createdAt', 'desc')
  );

  // Listen for tasks assigned to the user
  const assignedToQuery = query(
    collection(db, TASKS_COLLECTION),
    where('assignedTo', '==', userId),
    orderBy('order', 'asc'),
    orderBy('createdAt', 'desc')
  );

  let createdByTasks: Task[] = [];
  let assignedToTasks: Task[] = [];

  const mergeAndCallback = () => {
    // Merge and deduplicate by task id
    const all = [...createdByTasks, ...assignedToTasks];
    const unique = all.filter((task, idx, arr) =>
      arr.findIndex(t => t.id === task.id) === idx
    );
    callback(unique);
  };

  const unsubCreatedBy = onSnapshot(createdByQuery, (snapshot) => {
    createdByTasks = snapshot.docs.map(doc => {
      const data = doc.data() as TaskDoc;
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        dueDate: data.dueDate?.toDate(),
        comments: data.comments?.map(comment => ({
          ...comment,
          createdAt: comment.createdAt.toDate(),
          updatedAt: comment.updatedAt?.toDate()
        }))
      };
    });
    mergeAndCallback();
  });

  const unsubAssignedTo = onSnapshot(assignedToQuery, (snapshot) => {
    assignedToTasks = snapshot.docs.map(doc => {
      const data = doc.data() as TaskDoc;
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        dueDate: data.dueDate?.toDate(),
        comments: data.comments?.map(comment => ({
          ...comment,
          createdAt: comment.createdAt.toDate(),
          updatedAt: comment.updatedAt?.toDate()
        }))
      };
    });
    mergeAndCallback();
  });

  // Return a function to unsubscribe both listeners
  return () => {
    unsubCreatedBy();
    unsubAssignedTo();
  };
};

// Real-time subscription to team tasks
export const subscribeToTeamTasks = (
  teamId: string,
  callback: (tasks: Task[]) => void,
  errorCallback?: (error: Error) => void
): (() => void) => {
  const q = query(
    collection(db, TASKS_COLLECTION),
    where('teamId', '==', teamId),
    orderBy('order', 'asc'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (querySnapshot) => {
      const tasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as TaskDoc;
        tasks.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          dueDate: data.dueDate?.toDate(),
          comments: data.comments?.map(comment => ({
            ...comment,
            createdAt: comment.createdAt.toDate(),
            updatedAt: comment.updatedAt?.toDate()
          }))
        });
      });
      callback(tasks);
    },
    (error) => {
      console.error(`Error in team tasks subscription for team ${teamId}:`, error);
      if (errorCallback) {
        errorCallback(error);
      }
    }
  );
};

// Update task order (for drag and drop)
export const updateTaskOrder = async (taskId: string, newOrder: number): Promise<void> => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    await updateDoc(taskRef, {
      order: newOrder,
      updatedAt: Timestamp.fromDate(new Date())
    });
  } catch (error) {
    console.error('Error updating task order:', error);
    throw error;
  }
};

// Update multiple tasks using batch
export const updateMultipleTasks = async (updates: { id: string; [key: string]: any }[]): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const now = Timestamp.fromDate(new Date());
    console.log('[updateMultipleTasks] Writing batch to Firestore:', updates);
    updates.forEach(({ id, ...updateData }) => {
      const taskRef = doc(db, TASKS_COLLECTION, id);
      batch.update(taskRef, {
        ...updateData,
        updatedAt: now
      });
    });
    await batch.commit();
    console.log('[updateMultipleTasks] Batch Firestore update successful');
  } catch (error) {
    console.error('[updateMultipleTasks] Error updating multiple tasks:', error);
    throw error;
  }
};

// Assign task to user
export const assignTask = async (taskId: string, assignedTo: string): Promise<void> => {
  try {
    await updateTask(taskId, { assignedTo });
  } catch (error) {
    console.error('Error assigning task:', error);
    throw error;
  }
};

// Unassign task
export const unassignTask = async (taskId: string): Promise<void> => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    await updateDoc(taskRef, {
      assignedTo: null,
      updatedAt: Timestamp.fromDate(new Date())
    });
  } catch (error) {
    console.error('Error unassigning task:', error);
    throw error;
  }
};

// Add comment to task
export const addTaskComment = async (taskId: string, comment: { content: string; authorId: string }): Promise<void> => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    const taskDoc = await getDoc(taskRef);
    
    if (!taskDoc.exists()) {
      throw new Error('Task not found');
    }
    
    const currentData = taskDoc.data() as TaskDoc;
    const currentComments = currentData.comments || [];
    const now = new Date();
    
    const newComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: comment.content,
      authorId: comment.authorId,
      createdAt: Timestamp.fromDate(now)
    };
    
    await updateDoc(taskRef, {
      comments: [...currentComments, newComment],
      updatedAt: Timestamp.fromDate(now)
    });
  } catch (error) {
    console.error('Error adding task comment:', error);
    throw error;
  }
};

// Add attachment to task
export const addTaskAttachment = async (taskId: string, attachment: { url: string; name: string; type: 'link' | 'file' }): Promise<void> => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    const taskDoc = await getDoc(taskRef);
    
    if (!taskDoc.exists()) {
      throw new Error('Task not found');
    }
    
    const currentData = taskDoc.data() as TaskDoc;
    const currentAttachments = currentData.attachments || [];
    
    const newAttachment = {
      id: `attachment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: attachment.url,
      name: attachment.name,
      type: attachment.type,
      addedAt: Timestamp.fromDate(new Date())
    };
    
    await updateDoc(taskRef, {
      attachments: [...currentAttachments, newAttachment],
      updatedAt: Timestamp.fromDate(new Date())
    });
  } catch (error) {
    console.error('Error adding task attachment:', error);
    throw error;
  }
};

// Remove attachment from task
export const removeTaskAttachment = async (taskId: string, attachmentId: string): Promise<void> => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    const taskDoc = await getDoc(taskRef);
    
    if (!taskDoc.exists()) {
      throw new Error('Task not found');
    }
    
    const currentData = taskDoc.data() as TaskDoc;
    const currentAttachments = currentData.attachments || [];
    
    const updatedAttachments = currentAttachments.filter((att: any) => att.id !== attachmentId);
    
    await updateDoc(taskRef, {
      attachments: updatedAttachments,
      updatedAt: Timestamp.fromDate(new Date())
    });
  } catch (error) {
    console.error('Error removing task attachment:', error);
    throw error;
  }
};

// Get task by ID
export const getTask = async (taskId: string): Promise<Task | null> => {
  try {
    const taskDoc = await getDoc(doc(db, TASKS_COLLECTION, taskId));
    
    if (!taskDoc.exists()) {
      return null;
    }
    
    const data = taskDoc.data() as TaskDoc;
    return {
      id: taskDoc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      dueDate: data.dueDate?.toDate(),
      comments: data.comments?.map(comment => ({
        ...comment,
        createdAt: comment.createdAt.toDate(),
        updatedAt: comment.updatedAt?.toDate()
      }))
    };
  } catch (error) {
    console.error('Error getting task:', error);
    throw error;
  }
};

// Get all tasks count
export const getAllTasksCount = async (): Promise<number> => {
  try {
    const snapshot = await getDocs(collection(db, TASKS_COLLECTION));
    return snapshot.size;
  } catch (error) {
    console.error('Error getting all tasks count:', error);
    throw error;
  }
};
