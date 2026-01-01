
import { User } from '../types';
import { LABS, MOCK_ROSTER } from '../constants';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  course: string;
  checkInTime: string; // ISO string
  checkOutTime: string | null; // ISO string or null if currently active
  date: string; // YYYY-MM-DD
  status: 'PRESENT' | 'COMPLETED' | 'LATE' | 'ABSENT';
  labId?: string;
  labName?: string;
  systemNumber?: number;
}

export interface StudentActivity {
  id: string;
  studentId: string;
  studentName: string;
  department: string;
  semester: string;
  activityType: 'checkin' | 'checkout' | 'task' | 'complaint' | 'feedback';
  activityPayload: any;
  timestamp: string;
  status?: 'present' | 'late' | 'absent';
}

// Empty Data
let ATTENDANCE_LOGS: AttendanceRecord[] = [];
let ACTIVITIES: StudentActivity[] = [];

export const getAttendanceLogs = (): AttendanceRecord[] => {
  return [...ATTENDANCE_LOGS];
};

export const getStudentStatus = (studentId: string): { isCheckedIn: boolean, currentRecord: AttendanceRecord | null } => {
  const activeRecord = ATTENDANCE_LOGS.find(r => r.studentId === studentId && r.checkOutTime === null);
  return {
    isCheckedIn: !!activeRecord,
    currentRecord: activeRecord || null
  };
};

export const checkInStudent = (user: User, labId: string, systemNumber: number): AttendanceRecord => {
  const now = new Date();
  const lab = LABS.find(l => l.id === labId);
  const newRecord: AttendanceRecord = {
    id: `att-${Date.now()}`,
    studentId: user.id,
    studentName: user.name,
    course: user.course && user.semester ? `${user.course} - ${user.semester}` : 'General',
    checkInTime: now.toISOString(),
    checkOutTime: null,
    date: now.toISOString().split('T')[0],
    status: 'PRESENT',
    labId: labId,
    labName: lab ? lab.name : 'Unknown Lab',
    systemNumber: systemNumber
  };
  ATTENDANCE_LOGS.push(newRecord);
  return newRecord;
};

// --- New: Manual Entry for Faculty ---
export const manualCheckIn = (studentId: string, labId: string, status: 'PRESENT' | 'LATE'): AttendanceRecord => {
  const student = MOCK_ROSTER.find(s => s.id === studentId);
  const lab = LABS.find(l => l.id === labId);
  const now = new Date();
  
  const newRecord: AttendanceRecord = {
    id: `att-manual-${Date.now()}`,
    studentId: studentId,
    studentName: student?.name || 'Unknown Student',
    course: 'Manual Entry',
    checkInTime: now.toISOString(),
    checkOutTime: null, // Still active
    date: now.toISOString().split('T')[0],
    status: status,
    labId: labId,
    labName: lab ? lab.name : 'Unknown Lab',
    systemNumber: 0 // Indicates manual/no specific system
  };
  ATTENDANCE_LOGS.unshift(newRecord); // Add to top
  return newRecord;
};

// --- New: Update/Correction for Admin ---
export const updateAttendanceRecord = (id: string, updates: Partial<AttendanceRecord>): void => {
  const index = ATTENDANCE_LOGS.findIndex(r => r.id === id);
  if (index !== -1) {
    ATTENDANCE_LOGS[index] = { ...ATTENDANCE_LOGS[index], ...updates };
  }
};

export const deleteAttendanceRecord = (id: string): void => {
  ATTENDANCE_LOGS = ATTENDANCE_LOGS.filter(r => r.id !== id);
};

export const checkOutStudent = (studentId: string): AttendanceRecord | null => {
  const recordIndex = ATTENDANCE_LOGS.findIndex(r => r.studentId === studentId && r.checkOutTime === null);
  if (recordIndex !== -1) {
    const now = new Date();
    ATTENDANCE_LOGS[recordIndex].checkOutTime = now.toISOString();
    ATTENDANCE_LOGS[recordIndex].status = 'COMPLETED';
    return ATTENDANCE_LOGS[recordIndex];
  }
  return null;
};

export const getLogsByStudent = (studentId: string): AttendanceRecord[] => {
  return ATTENDANCE_LOGS.filter(r => r.studentId === studentId).sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime());
};

export const getLogsByDate = (date: string): AttendanceRecord[] => {
  return ATTENDANCE_LOGS.filter(r => r.date === date);
};

export const submitActivity = (
  user: User, 
  type: StudentActivity['activityType'], 
  payload: any
): void => {
  let status: 'present' | 'late' | undefined = undefined;
  if (type === 'checkin') {
    const nowMinutes = new Date().getMinutes();
    status = nowMinutes > 10 ? 'late' : 'present';
  }

  const newActivity: StudentActivity = {
    id: `act-${Date.now()}`,
    studentId: user.id,
    studentName: user.name,
    department: user.department || 'General',
    semester: user.semester || '1st',
    activityType: type,
    activityPayload: payload,
    timestamp: new Date().toISOString(),
    status: status
  };
  
  ACTIVITIES.unshift(newActivity);
  console.log('[Background Activity Routing] Sent to Faculty:', newActivity);
};

export const getActivitiesForFaculty = (department: string, managedSemesters: string[]): StudentActivity[] => {
  return ACTIVITIES.filter(act => 
    (act.department === department || department === 'Computer Science') && 
    (managedSemesters.includes(act.semester))
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};
