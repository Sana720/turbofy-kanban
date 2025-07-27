import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  Timestamp,
  arrayUnion,
  arrayRemove,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, UserDoc } from '@/types';

const USERS_COLLECTION = 'users';

// Create or update user profile
export const createUserProfile = async (userId: string, userData: Partial<User>): Promise<void> => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const existingDoc = await getDoc(docRef);
    
    if (existingDoc.exists()) {
      // User profile already exists - only update basic fields, don't overwrite role or other important data
      const updateData: Partial<UserDoc> = {
        email: userData.email || existingDoc.data().email,
        displayName: userData.displayName || existingDoc.data().displayName,
        photoURL: userData.photoURL || existingDoc.data().photoURL,
        updatedAt: Timestamp.fromDate(new Date())
      };
      await updateDoc(docRef, updateData);
    } else {
      // New user - create full profile with isActive: false by default
      const now = new Date();
      const userDoc: Partial<UserDoc> = {
        email: userData.email || '',
        displayName: userData.displayName || '',
        photoURL: userData.photoURL,
        role: userData.role || 'member',
        isActive: userData.isActive === false ? false : false, // always false for new users
        createdAt: Timestamp.fromDate(userData.createdAt || now),
        updatedAt: Timestamp.fromDate(now),
        lastLoginAt: Timestamp.fromDate(now)
      };
      await setDoc(docRef, userDoc);
    }
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

// Get user profile by ID
export const getUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    
    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data() as UserDoc;
    return {
      id: userDoc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      lastLoginAt: data.lastLoginAt?.toDate()
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
  try {
    // Convert any Date fields in updates to Timestamp and filter out undefined values
    const updateData: Partial<UserDoc> = {};
    
    // Only add fields that are not undefined
    Object.keys(updates).forEach(key => {
      const value = (updates as any)[key];
      if (value !== undefined) {
        if (key === 'createdAt' && value instanceof Date) {
          updateData.createdAt = Timestamp.fromDate(value);
        } else if (key === 'lastLoginAt' && value instanceof Date) {
          updateData.lastLoginAt = Timestamp.fromDate(value);
        } else if (key !== 'id' && key !== 'createdAt') {
          // Don't allow updating id or createdAt
          (updateData as any)[key] = value;
        }
      }
    });

    // Always update the updatedAt timestamp
    updateData.updatedAt = Timestamp.fromDate(new Date());

    await updateDoc(doc(db, USERS_COLLECTION, userId), updateData);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Update last login time
export const updateLastLogin = async (userId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      lastLoginAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date())
    });
  } catch (error) {
    console.error('Error updating last login:', error);
    throw error;
  }
};

// Get user by email (for team invitations)
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where('email', '==', email.toLowerCase())
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const userDoc = querySnapshot.docs[0];
    const data = userDoc.data() as UserDoc;
    
    return {
      id: userDoc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      lastLoginAt: data.lastLoginAt?.toDate()
    };
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

// Get multiple users by IDs
export const getUsersByIds = async (userIds: string[]): Promise<User[]> => {
  try {
    if (userIds.length === 0) return [];

    const users: User[] = [];
    
    // Firestore 'in' queries are limited to 10 items, so we batch them
    const batches = [];
    for (let i = 0; i < userIds.length; i += 10) {
      const batch = userIds.slice(i, i + 10);
      batches.push(batch);
    }

    for (const batch of batches) {
      const q = query(
        collection(db, USERS_COLLECTION),
        where('__name__', 'in', batch)
      );
      
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as UserDoc;
        users.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          lastLoginAt: data.lastLoginAt?.toDate()
        });
      });
    }

    return users;
  } catch (error) {
    console.error('Error getting users by IDs:', error);
    throw error;
  }
};



// Real-time subscription to user profile
export const subscribeToUserProfile = (
  userId: string,
  callback: (user: User | null) => void
): (() => void) => {
  return onSnapshot(doc(db, USERS_COLLECTION, userId), (doc) => {
    if (!doc.exists()) {
      callback(null);
      return;
    }

    const data = doc.data() as UserDoc;
    const user: User = {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      lastLoginAt: data.lastLoginAt?.toDate()
    };

    callback(user);
  });
};

// Get all users count
export const getAllUsersCount = async (): Promise<number> => {
  try {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));
    return snapshot.size;
  } catch (error) {
    console.error('Error getting all users count:', error);
    throw error;
  }
};

// Get all users
export const getAllUsers = async (): Promise<{ id: string; displayName?: string; email: string }[]> => {
  const snapshot = await getDocs(collection(db, USERS_COLLECTION));
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as any[];
};

// Delete user
export const deleteUser = async (userId: string): Promise<void> => {
  await deleteDoc(doc(db, USERS_COLLECTION, userId));
};
