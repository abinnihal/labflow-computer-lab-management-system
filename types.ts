export enum UserRole {
  ADMIN = 'ADMIN',
  FACULTY = 'FACULTY',
  STUDENT = 'STUDENT'
}

// Global Status Type for consistency
export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DEACTIVATED';

// Updated Permission Levels to include ADMIN capability
export type PermissionLevel = 'READ' | 'WRITE' | 'ADMIN' | 'NONE';

export interface User {
  // --- Common Fields (All Users) ---
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  phone?: string;
  department?: string;
  createdAt?: string; // Firestore Timestamp converted to ISO string
  lastLogin?: string;

  // --- Student Specific Fields ---
  studentId?: string;       // College Roll No (e.g., "BCA22055")
  programType?: 'UG' | 'PG' | 'PHD' | 'BOTH';
  course?: string;          // e.g., "B.Tech CSE"
  semester?: string;        // e.g., "S5"
  batchYear?: string;       // e.g., "2023-2027" (New Field)

  // --- Faculty Specific Fields ---
  facultyId?: string;       // Employee ID (e.g., "FAC-001")
  designation?: string;     // e.g., "Assistant Professor" (New Field)
  managedSemesters?: string[]; // Semesters they oversee (e.g. ["S1", "S3"])

  // --- Admin / Security ---
  idProofUrl?: string;
  permissions?: Record<string, PermissionLevel>; // e.g., { 'CALENDAR': 'WRITE' }
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
  maintenanceUntil?: string; // ISO Date String
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
  userId: string;
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
  assignedBy: string;
  assignedByName?: string; // Ensure this is here
  assignedById: string;    // Ensure this is here
  course: string;
  courseId?: string;
  dueDate: string;
  type: 'ASSIGNMENT' | 'LAB_EXAM' | 'PROJECT';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
  attachmentUrl?: string; // (Faculty uploads this)
  duration?: string;      // (Exam duration in minutes)
  subjectId: string;
  subjectName: string; // For display (e.g., "Java Lab")
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
  files?: string[];
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
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  commentsList?: Comment[];
  tags: string[];
  scope: 'CLASS' | 'GLOBAL';
  type: 'TEXT' | 'MEDIA' | 'CODE' | 'POLL' | 'FILE';
  mediaUrls?: string[];
  mediaType?: 'IMAGE' | 'VIDEO';
  codeSnippet?: string;
  codeLanguage?: string;
  pollOptions?: PollOption[];
  fileUrl?: string;
  fileName?: string;
  isLiked?: boolean;
}

export interface AttendanceLog {
  id: string;
  bookingId?: string;
  studentId: string;
  studentName?: string; // Optional for easier display
  checkInTime: string;
  checkOutTime?: string;
  // FIX: Added 'COMPLETED' and 'PENDING' to allowed statuses
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'COMPLETED' | 'PENDING';
  labId?: string;
  systemNumber?: number;
  date?: string;
  proofUrl?: string;
  subjectId: string;
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
  rating?: number;
  category: 'GENERAL' | 'LAB_ISSUE' | 'TEACHING';
  target?: 'FACULTY' | 'ADMIN';
  status?: 'PENDING' | 'RESOLVED';
  adminReply?: string;
  isArchived?: boolean;
}

export interface MaintenanceRequest {
  id: string;
  facultyId: string;
  facultyName: string;
  labId: string;
  labName?: string;
  issueTitle: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  date: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  adminReply?: string;
  isArchived?: boolean;
}

export interface BookingRequest {
  subject: string;
  labId: string;
  date: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  systemCount: number;
  reminder: boolean;
  userId: string;
  userName: string;
  userRole?: UserRole;
}

export interface ConflictResult {
  hasConflict: boolean;
  message?: string;
  conflictingBooking?: Booking;
}

export interface Material {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: string; // 'PDF', 'PPT', 'ZIP', 'IMG'

  // Metadata
  subject: string;
  semester: string;    // e.g., "S5"
  batch: string[];     // ["Batch A", "Batch B"] or ["ALL"]
  tags: string[];      // ["React", "Hooks"]

  // Smart Linking
  relatedTaskId?: string; // Optional: Link to a specific assignment ID

  // Analytics
  downloadCount: number;
  uploadedBy: string;     // Faculty ID
  uploadedByName: string;
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;        // e.g., "Advanced Java Lab"
  code: string;        // e.g., "BCA-502"
  batchId: string;     // e.g., "BCA-S5-2026" (Who studies this?)
  facultyId: string;   // e.g., "fac123" (Who teaches this?)
  facultyName: string; // Cached for display
  semester: string;    // e.g., "S5"
}