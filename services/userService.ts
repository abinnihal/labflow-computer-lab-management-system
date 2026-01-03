
import { User, UserRole, PermissionLevel } from '../types';
import { CURRENT_USER_MOCK_ADMIN, CURRENT_USER_MOCK_FACULTY, CURRENT_USER_MOCK_STUDENT } from '../constants';
import { sendNotification } from './notificationService';
import { loginWithEmail } from './auth';
import { createUserProfile, getUserProfile } from './users';


// Initial User Store
let USERS: User[] = [
  CURRENT_USER_MOCK_ADMIN,
  { ...CURRENT_USER_MOCK_FACULTY, department: 'Computer Science', managedSemesters: ['1st', '3rd', '5th'] },
  CURRENT_USER_MOCK_STUDENT
];

export const getAllUsers = (): User[] => {
  return [...USERS];
};

export const getPendingUsersByRole = (role: UserRole, department?: string, managedSemesters?: string[]): User[] => {
  let pending = USERS.filter(u => u.role === role && u.status === 'PENDING');

  if (role === UserRole.STUDENT) {
    if (department) {
      // Strict department matching for Faculty
      pending = pending.filter(u => u.department === department);
    }
    if (managedSemesters && managedSemesters.length > 0) {
      pending = pending.filter(u => u.semester && managedSemesters.includes(u.semester));
    }
  }

  return pending;
};


//firebase authentication
export const authenticateUser = async (
  email: string,
  password: string
): Promise<User | null> => {
  try {
    // 1️⃣ Firebase authentication
    const fbUser = await loginWithEmail(email, password);

    // 2️⃣ Fetch Firestore profile
    const profile = await getUserProfile(fbUser.uid);
    if (!profile) return null;

    // 3️⃣ Build User object from Firestore (NOT from dummy USERS)
    const user: User = {
      id: fbUser.uid,
      name: profile.name,
      email: email,
      role: profile.role.toUpperCase(), // map 'admin' → 'ADMIN'
      status: profile.status,
      department: profile.department,
      permissions: {},
    };

    return user;
  } catch {
    return null;
  }
};

//firebase authentication
export const registerUser = async (
  user: Omit<User, 'id' | 'status'>,
  password: string
): Promise<User> => {
  // Registration handled by Firebase Auth UI
  // Here we only create Firestore profile

  const newUser: User = {
    ...user,
    id: `u-${Date.now()}`,
    status: 'PENDING',
    registrationDate: new Date().toISOString(),
    department: user.department || 'Computer Science'
  };

  USERS.push(newUser);

  return newUser;
};



export const updateUserStatus = (userId: string, status: 'APPROVED' | 'REJECTED' | 'DEACTIVATED' | 'PENDING'): void => {
  const user = USERS.find(u => u.id === userId);
  if (user) {
    user.status = status;

    // Notify User
    if (status === 'APPROVED' || status === 'REJECTED') {
      const type = status === 'APPROVED' ? 'INFO' : 'ALERT';
      const msg = status === 'APPROVED'
        ? 'Your account has been approved. You can now access the full dashboard.'
        : 'Your registration request was rejected. Please contact support.';
      sendNotification('SYSTEM', userId, msg, type);
    }
  }
};

export const resetUserPassword = (userId: string): string => {
  return "TempPass123!";
};

export const updateUser = (userId: string, updates: Partial<User>): User | null => {
  const index = USERS.findIndex(u => u.id === userId);
  if (index !== -1) {
    USERS[index] = { ...USERS[index], ...updates };
    return USERS[index];
  }
  return null;
};

export const updatePermissions = (userId: string, moduleName: string, level: PermissionLevel): void => {
  const user = USERS.find(u => u.id === userId);
  if (user) {
    if (!user.permissions) user.permissions = {};
    user.permissions[moduleName] = level;
  }
};

export const deleteUser = (userId: string): void => {
  USERS = USERS.filter(u => u.id !== userId);
};

export const importUsersFromCSV = (csvContent: string): number => {
  const lines = csvContent.split('\n');
  let count = 0;
  lines.forEach((line, idx) => {
    if (idx === 0) return;
    const [name, email, roleStr, dept] = line.split(',');
    if (name && email) {
      USERS.push({
        id: `imported-${Date.now()}-${idx}`,
        name: name.trim(),
        email: email.trim(),
        role: roleStr?.trim().toUpperCase() === 'FACULTY' ? UserRole.FACULTY : UserRole.STUDENT,
        department: dept?.trim() || 'General',
        status: 'APPROVED'
      });



      count++;
    }
  });
  return count;
};

export const exportUsersToCSV = (): string => {
  const headers = "ID,Name,Email,Role,Department,Status";
  const rows = USERS.map(u =>
    `${u.id},"${u.name}",${u.email},${u.role},"${u.department || ''}",${u.status}`
  ).join('\n');
  return `${headers}\n${rows}`;
};
