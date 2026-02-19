import {
  collection,
  doc,
  getDocs,
  setDoc,
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
import {
  loginWithEmail,
  registerUser as authRegisterUser
} from './auth';

// Collection Reference
const USERS_COLLECTION = "users";

// --- Helper to ensure DB data matches App Types ---
const mapDocToUser = (docId: string, data: any): User => {
  return {
    id: docId,
    name: data.name || '',
    email: data.email || '',
    role: (data.role as string)?.toUpperCase() as UserRole,
    status: data.status,
    department: data.department,
    permissions: data.permissions || {},
    avatarUrl: data.avatarUrl,
    semester: data.semester,
    managedSemesters: data.managedSemesters,
    phone: data.phone,
    studentId: data.studentId,
    facultyId: data.facultyId,
    course: data.course
  } as User;
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    return querySnapshot.docs.map(doc => mapDocToUser(doc.id, doc.data()));
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
};

export const getPendingUsersByRole = async (role: UserRole, department?: string, managedSemesters?: string[]): Promise<User[]> => {
  try {
    const validRoles = [role.toLowerCase(), role.toUpperCase()];
    const q = query(
      collection(db, USERS_COLLECTION),
      where("role", "in", validRoles),
      where("status", "==", "PENDING")
    );

    const querySnapshot = await getDocs(q);
    let users = querySnapshot.docs.map(doc => mapDocToUser(doc.id, doc.data()));

    if (role === UserRole.STUDENT) {
      if (department) users = users.filter(u => u.department === department);
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

export const authenticateUser = async (email: string, password: string): Promise<User | null> => {
  try {
    const fbUser = await loginWithEmail(email, password);
    const userDocRef = doc(db, USERS_COLLECTION, fbUser.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) return null;
    return mapDocToUser(fbUser.uid, userDoc.data());
  } catch (error) {
    console.error("Authentication failed:", error);
    return null;
  }
};

/**
 * Register User with Pre-Approval Merge Logic
 */
export const registerUser = async (
  user: Omit<User, 'id' | 'status'>,
  password: string
): Promise<User | null> => {
  try {
    console.log(`[Register] Attempting to register: ${user.email}`);

    // 1. PRE-CHECK: Look for Pre-Approved Placeholder BEFORE creating auth
    // We query by email to see if Admin imported this user
    const q = query(
      collection(db, USERS_COLLECTION),
      where("email", "==", user.email.toLowerCase().trim())
    );

    const matchSnapshot = await getDocs(q);

    let finalStatus: 'APPROVED' | 'PENDING' = 'PENDING';
    let mergedData = {};
    let placeholderRef = null;

    if (!matchSnapshot.empty) {
      console.log(`[Register] Found ${matchSnapshot.size} matching docs for email.`);
      for (const d of matchSnapshot.docs) {
        // Check if this is an imported placeholder
        if (d.id.startsWith('imported-') || d.data().isImported === true) {
          console.log("[Register] Found Pre-Approved Placeholder:", d.id);
          const preData = d.data();

          finalStatus = 'APPROVED'; // <--- Auto-Approve Trigger

          // Keep the CSV data if available, otherwise use form data
          mergedData = {
            course: preData.course || user.course,
            semester: preData.semester || user.semester,
            department: preData.department || user.department,
            role: preData.role || user.role // Ensure role matches import
          };

          placeholderRef = d.ref; // Save ref to delete later
          break; // Found it, stop looking
        }
      }
    } else {
      console.log("[Register] No pre-existing doc found. Defaulting to PENDING.");
    }

    // 2. Create the Authentication User
    const roleEnum = user.role === UserRole.FACULTY ? UserRole.FACULTY : UserRole.STUDENT;

    const resultData = await authRegisterUser({
      email: user.email,
      name: user.name,
      role: roleEnum,
      phone: user.phone,
      department: user.department,
      semester: user.semester,
      studentId: user.studentId,
      course: user.course
    }, password);

    // 3. Delete Placeholder (if it existed)
    if (placeholderRef) {
      try {
        await deleteDoc(placeholderRef);
        console.log("[Register] Deleted placeholder doc.");
      } catch (e) {
        console.warn("[Register] Failed to delete placeholder (non-fatal):", e);
      }
    }

    // 4. Update/Set the Final User Document with correct status
    const finalUserDoc: User = {
      id: resultData.uid,
      ...user,
      ...mergedData, // This applies the CSV data
      status: finalStatus
    };

    console.log(`[Register] Saving final user doc with status: ${finalStatus}`);

    // We overwrite whatever authRegisterUser might have set to ensure status is correct
    await setDoc(doc(db, USERS_COLLECTION, resultData.uid), finalUserDoc);

    return finalUserDoc;

  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

export const updateUserStatus = async (userId: string, status: 'APPROVED' | 'REJECTED' | 'DEACTIVATED' | 'PENDING'): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, { status });

    if (status === 'APPROVED' || status === 'REJECTED') {
      const type = status === 'APPROVED' ? 'INFO' : 'ALERT';
      const msg = status === 'APPROVED'
        ? 'Your account has been approved. You can now access the full dashboard.'
        : 'Your registration request was rejected.';
      await sendNotification('SYSTEM', userId, msg, type);
    }
  } catch (error) {
    console.error(`Error updating status for user ${userId}:`, error);
  }
};

export const resetUserPassword = async (userId: string): Promise<string> => {
  return "Please use the 'Forgot Password' link on the login page.";
};

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
    await updateDoc(userRef, { [`permissions.${moduleName}`]: level });
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

// --- IMPORT / EXPORT ---

export const importUsersFromCSV = async (csvContent: string): Promise<{ count: number, errors: string[] }> => {
  const lines = csvContent.split('\n');
  let count = 0;
  const errors: string[] = [];
  const batch = writeBatch(db);

  // Expected Header: Name, Email, Role, Department, Course, Semester

  lines.forEach((line, idx) => {
    if (idx === 0 || !line.trim()) return; // Skip header and empty lines

    const cols = line.split(',').map(s => s.trim());
    const [name, email, roleStr, dept, course, semester] = cols;

    if (!name || !email || !roleStr) {
      errors.push(`Line ${idx + 1}: Missing required fields (Name, Email, Role)`);
      return;
    }

    const newId = `imported-${Date.now()}-${idx}`; // Placeholder ID
    const userRef = doc(db, USERS_COLLECTION, newId);

    const dbRole = roleStr.toUpperCase() === 'FACULTY' ? 'FACULTY' : 'STUDENT';
    const cleanEmail = email.toLowerCase();

    batch.set(userRef, {
      name,
      email: cleanEmail,
      role: dbRole,
      department: dept || 'General',
      course: course || '',
      semester: semester || '',
      status: 'APPROVED', // <--- PRE-APPROVE IMPORTED USERS
      isImported: true,   // <--- FLag to identify import
      createdAt: new Date().toISOString()
    });
    count++;
  });

  await batch.commit();
  return { count, errors };
};

export const exportUsersToCSV = async (): Promise<string> => {
  const users = await getAllUsers();
  const headers = "Name,Email,Role,Department,Course,Semester,Status,Student_ID";
  const rows = users.map(u =>
    `"${u.name}","${u.email}","${u.role}","${u.department || ''}","${u.course || ''}","${u.semester || ''}","${u.status}","${u.studentId || ''}"`
  ).join('\n');
  return `${headers}\n${rows}`;
};