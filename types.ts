
export enum UserRole {
  ADMIN = 'ADMIN',
  FACULTY = 'FACULTY',
  STUDENT = 'STUDENT'
}

export type PermissionLevel = 'READ' | 'WRITE' | 'NONE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  department?: string;
  programType?: 'UG' | 'PG' | 'PHD' | 'BOTH'; // Added for UG/PG selection
  course?: string;
  semester?: string;
  studentId?: string;
  facultyId?: string;
  phone?: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'DEACTIVATED';
  permissions?: Record<string, PermissionLevel>; // e.g., { 'CALENDAR': 'WRITE' }
  idProofUrl?: string;
  registrationDate?: string;
  managedSemesters?: string[]; // For Faculty: List of semesters they approve (e.g. ["1st", "3rd"])
}

export interface LabInventoryItem {
  id: string;
  name: string;
  type: 'SYSTEM' | 'PROJECTOR' | 'SOFTWARE' | 'OTHER';
  quantity: number;
  status: 'WORKING' | 'DEFECTIVE' | 'MAINTENANCE';
  purchaseDate?: string;
}

export interface RecurringSlot {
  id: string;
  labId: string;
  dayOfWeek: number; // 0=Sun, 1=Mon...
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  label: string;
  isBlocked: boolean;
}

export interface TimeSlotRule {
  id: string;
  startTime: string; // Global Open Time
  endTime: string; // Global Close Time
  slotDuration: number; // minutes
  blackoutDates: string[]; // ISO Date strings
}

export interface Lab {
  id: string;
  name: string;
  capacity: number;
  location: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE';
  features: string[];
  assignedFacultyId?: string;
  assignedFacultyName?: string;
  inventory?: LabInventoryItem[];
}

export interface BookingLog {
  action: 'CREATED' | 'UPDATED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'OVERRIDE';
  byUserId: string;
  byUserName: string;
  timestamp: string;
  details?: string;
}

export interface Booking {
  id: string;
  labId: string;
  userId: string; // Faculty ID usually
  userName: string;
  subject: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  type: 'REGULAR' | 'EXTRA' | 'EVENT' | 'MAINTENANCE';
  systemCount?: number;
  reminder?: boolean;
  logs?: BookingLog[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedBy: string; // Faculty Name
  assignedById: string;
  course: string; // e.g., "B.Tech CSE"
  dueDate: string; // YYYY-MM-DD
  instructions?: string;
  hints?: string[];
  questions?: string[]; // Specific questions to answer
  attachments?: string[]; // Mock URLs
  createdAt: string;
  status?: string; // Optional status for mock data context (e.g., 'PENDING' | 'SUBMITTED')
}

export interface Submission {
  id: string;
  taskId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  textResponse?: string;
  codeSnippet?: string;
  files?: string[]; // Mock file names
  feedback?: string;
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  timestamp: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatar?: string;
  content: string; // Text content
  timestamp: string;
  likes: number;
  comments: number;
  commentsList?: Comment[]; // Array of comments
  tags: string[];
  scope: 'CLASS' | 'GLOBAL';
  type: 'TEXT' | 'MEDIA' | 'CODE' | 'POLL' | 'FILE';
  
  // Type specific fields
  mediaUrls?: string[]; // Images/Videos
  mediaType?: 'IMAGE' | 'VIDEO';
  codeSnippet?: string;
  codeLanguage?: string;
  pollOptions?: PollOption[];
  fileUrl?: string;
  fileName?: string;
  
  isLiked?: boolean; // UI state
}

export interface AttendanceLog {
  id: string;
  bookingId: string;
  studentId: string;
  checkInTime: string;
  checkOutTime?: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  labId?: string;
  systemNumber?: number;
}

export interface Notification {
  id: string;
  recipientId: string | 'ALL' | 'CLASS';
  senderId: string;
  message: string;
  type: 'REMINDER' | 'ALERT' | 'INFO';
  timestamp: string;
  read: boolean;
}

export interface NotificationLog {
  id: string;
  targetGroup: string;
  title: string;
  message: string;
  type: 'REMINDER' | 'ALERT' | 'INFO';
  sentAt: string;
  sentBy: string;
  deliveryCount: number;
  readCount: number;
}

export interface Feedback {
  id: string;
  studentId: string;
  studentName: string;
  labId?: string;
  content: string;
  date: string;
  rating?: number; // 1-5
  category: 'GENERAL' | 'LAB_ISSUE' | 'TEACHING';
  target?: 'FACULTY' | 'ADMIN'; // New field to specify recipient
  status?: 'PENDING' | 'RESOLVED';
  adminReply?: string;
  isArchived?: boolean;
}

export interface MaintenanceRequest {
  id: string;
  facultyId: string;
  facultyName: string;
  labId: string;
  labName: string;
  issueTitle: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  date: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  adminReply?: string;
  isArchived?: boolean;
}
