
import { User, UserRole, Lab, Booking, Task, Post } from './types';

// Minimal Demo User Definitions
export const CURRENT_USER_MOCK_STUDENT: User = {
  id: 's-demo',
  name: 'Demo Student',
  email: '1', // Using '1' as requested for demo login
  role: UserRole.STUDENT,
  avatarUrl: 'https://ui-avatars.com/api/?name=Demo+Student',
  department: 'Computer Science',
  course: 'BCA',
  semester: '3rd',
  studentId: 'STU001',
  status: 'APPROVED'
};

export const CURRENT_USER_MOCK_FACULTY: User = {
  id: 'f-demo',
  name: 'Demo Faculty',
  email: '2', // Using '2' as requested for demo login
  role: UserRole.FACULTY,
  avatarUrl: 'https://ui-avatars.com/api/?name=Demo+Faculty',
  department: 'Computer Science',
  facultyId: 'FAC001',
  status: 'APPROVED'
};

export const CURRENT_USER_MOCK_ADMIN: User = {
  id: 'a-demo',
  name: 'System Admin',
  email: 'admin@123',
  role: UserRole.ADMIN,
  avatarUrl: 'https://ui-avatars.com/api/?name=System+Admin',
  status: 'APPROVED'
};

// Infrastructure Data (Labs need to exist for the system to work)
export const LABS: Lab[] = [
  { id: 'l1', name: 'Lab 1 - Programming', capacity: 60, location: 'Block A, 1st Floor', status: 'ACTIVE', features: ['High Perf PCs', 'Projector'] },
  { id: 'l2', name: 'Lab 2 - AI/ML', capacity: 40, location: 'Block B, 2nd Floor', status: 'ACTIVE', features: ['GPU Workstations'] },
  { id: 'l3', name: 'Lab 3 - Networking', capacity: 50, location: 'Block A, 3rd Floor', status: 'MAINTENANCE', features: ['Cisco Routers'] },
];

// Empty Mock Data for clean start
export const MOCK_BOOKINGS: Booking[] = [];
export const MOCK_TASKS: Task[] = [];
export const MOCK_POSTS: Post[] = [];

// Minimal Roster containing only the demo student
export const MOCK_ROSTER = [
  { id: 's-demo', name: 'Demo Student', email: '1' }
];
