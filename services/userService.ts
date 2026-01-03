import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  getDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { User, UserRole, PermissionLevel } from '../types';
import { sendNotification } from './notificationService';
import { loginWithEmail, registerWithEmail } from './auth';

// Collection Reference
const USERS_COLLECTION = "users";

// --- Helper to ensure DB data matches App Types ---
const mapDocToUser = (docId: string, data: any): User => {
  return {
    id: docId,
    name: data.name || '',
    email: data.email || '',
    // CRITICAL FIX: Convert DB lowercase "admin" -> App uppercase "ADMIN"
    role: (data.role as string)?.toUpperCase() as UserRole,
    status: data.status,
    department: data.department,
    permissions: data.permissions || {},
    avatarUrl: data.avatarUrl,
    semester: data.semester,
    managedSemesters: data.managedSemesters,
    phone: data.phone,
    studentId: data.studentId,
    facultyId: data.facultyId
  } as User;
};

/**
 * Fetch all users from Firestore
 */
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    return querySnapshot.docs.map(doc => mapDocToUser(doc.id, doc.data()));
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
};

/**
 * Fetch pending users based on Role and Department
 */
export const getPendingUsersByRole = async (role: UserRole, department?: string, managedSemesters?: string[]): Promise<User[]> => {
  try {
    // CRITICAL FIX: Query Firestore using lowercase "student"/"faculty"
    const dbRole = role.toLowerCase();

    const q = query(
      collection(db, USERS_COLLECTION),
      where("role", "==", dbRole),
      where("status", "==", "PENDING")
    );

    const querySnapshot = await getDocs(q);
    let users = querySnapshot.docs.map(doc => mapDocToUser(doc.id, doc.data()));

    // Client-side filtering for Department & Semester
    if (role === UserRole.STUDENT) {
      if (department) {
        users = users.filter(u => u.department === department);
      }
      if (managedSemesters && managedSemesters.length > 0) {
        users = users.filter(u => u.semester && managedSemesters.includes(u.semester));
      }
    }

    return users;
  } catch (error) {
    console.error("Error fetching pending users:", error);
    return [];
  }
};

/**
 * Authentication Wrapper
 */
export const authenticateUser = async (
  email: string,
  password: string
): Promise<User | null> => {
  try {
    // 1. Firebase Auth Login
    const fbUser = await loginWithEmail(email, password);

    // 2. Fetch User Profile from Firestore
    const userDocRef = doc(db, USERS_COLLECTION, fbUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) return null;

    // 3. Return mapped User object (handles the Role casing)
    return mapDocToUser(fbUser.uid, userDoc.data());
  } catch (error) {
    console.error("Authentication failed:", error);
    return null;
  }
};

/**
 * Register User (Wrapper for auth.ts service)
 */
export const registerUser = async (
  user: Omit<User, 'id' | 'status'>,
  password: string
): Promise<User | null> => {
  try {
    const firebaseUser = await registerWithEmail(
      user.email,
      password,
      // Ensure we pass lowercase to auth service
      user.role === UserRole.FACULTY ? "faculty" : "student",
      {
        name: user.name,
        department: user.department
      }
    );

    const userDoc = await getDoc(doc(db, USERS_COLLECTION, firebaseUser.uid));
    if (userDoc.exists()) {
      return mapDocToUser(firebaseUser.uid, userDoc.data());
    }
    return null;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

/**
 * Update User Status (Approve/Reject)
 */
export const updateUserStatus = async (userId: string, status: 'APPROVED' | 'REJECTED' | 'DEACTIVATED' | 'PENDING'): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, { status });

    // Send Notification
    if (status === 'APPROVED' || status === 'REJECTED') {
      const type = status === 'APPROVED' ? 'INFO' : 'ALERT';
      const msg = status === 'APPROVED'
        ? 'Your account has been approved. You can now access the full dashboard.'
        : 'Your registration request was rejected. Please contact support.';

      await sendNotification('SYSTEM', userId, msg, type);
    }
  } catch (error) {
    console.error(`Error updating status for user ${userId}:`, error);
  }
};

export const resetUserPassword = async (userId: string): Promise<string> => {
  return "Please use the 'Forgot Password' link on the login page.";
};

/**
 * Update User Details
 */
export const updateUser = async (userId: string, updates: Partial<User>): Promise<User | null> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, updates);

    const updatedSnap = await getDoc(userRef);
    return updatedSnap.exists() ? mapDocToUser(updatedSnap.id, updatedSnap.data()) : null;
  } catch (error) {
    console.error("Error updating user:", error);
    return null;
  }
};

export const updatePermissions = async (userId: string, moduleName: string, level: PermissionLevel): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      [`permissions.${moduleName}`]: level
    });
  } catch (error) {
    console.error("Error updating permissions:", error);
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, userId));
  } catch (error) {
    console.error("Error deleting user:", error);
  }
};

/**
 * Batch Import Users
 */
export const importUsersFromCSV = async (csvContent: string): Promise<number> => {
  const lines = csvContent.split('\n');
  let count = 0;
  const batch = writeBatch(db);

  lines.forEach((line, idx) => {
    if (idx === 0) return; // Skip header
    const [name, email, roleStr, dept] = line.split(',');

    if (name && email) {
      const newId = `imported-${Date.now()}-${idx}`;
      const userRef = doc(db, USERS_COLLECTION, newId);

      // CRITICAL: Save role as lowercase to match DB convention
      const dbRole = roleStr?.trim().toUpperCase() === 'FACULTY' ? 'faculty' : 'student';

      batch.set(userRef, {
        name: name.trim(),
        email: email.trim(),
        role: dbRole,
        department: dept?.trim() || 'General',
        status: 'APPROVED',
        createdAt: new Date()
      });
      count++;
    }
  });

  await batch.commit();
  return count;
};

export const exportUsersToCSV = async (): Promise<string> => {
  const users = await getAllUsers();
  const headers = "ID,Name,Email,Role,Department,Status";
  const rows = users.map(u =>
    `${u.id},"${u.name}",${u.email},${u.role},"${u.department || ''}",${u.status}`
  ).join('\n');
  return `${headers}\n${rows}`;
};