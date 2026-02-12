import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { AttendanceLog, User } from '../types';

const ATTENDANCE_COLLECTION = 'attendance_logs';
const ACTIVITIES_COLLECTION = 'student_activities';

// --- Interfaces ---
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

export interface AttendanceRecord extends AttendanceLog {
  labName?: string; // Helper for UI
}

// --- Helpers ---
const mapDocToLog = (doc: any): AttendanceRecord => ({ id: doc.id, ...doc.data() });
const mapDocToActivity = (doc: any): StudentActivity => ({ id: doc.id, ...doc.data() });

// --- Attendance Functions ---

export const getAttendanceLogs = async (): Promise<AttendanceRecord[]> => {
  try {
    const q = query(collection(db, ATTENDANCE_COLLECTION), orderBy('checkInTime', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDocToLog);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return [];
  }
};

export const getLogsByStudent = async (studentId: string): Promise<AttendanceRecord[]> => {
  try {
    const q = query(
      collection(db, ATTENDANCE_COLLECTION),
      where('studentId', '==', studentId)
    );
    const snapshot = await getDocs(q);
    // Sort in memory if index is missing, or use orderBy if index exists
    return snapshot.docs
      .map(mapDocToLog)
      .sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime());
  } catch (error) {
    return [];
  }
};

// Alias for getLogsByStudent to satisfy some components
export const getStudentAttendance = getLogsByStudent;

export const getStudentStatus = async (studentId: string): Promise<{ isCheckedIn: boolean, currentRecord: AttendanceRecord | null }> => {
  try {
    const q = query(
      collection(db, ATTENDANCE_COLLECTION),
      where('studentId', '==', studentId),
      where('status', 'in', ['PRESENT', 'LATE'])
    );
    const snapshot = await getDocs(q);

    // Find one that hasn't checked out
    const activeDoc = snapshot.docs.find(d => !d.data().checkOutTime);

    if (activeDoc) {
      return { isCheckedIn: true, currentRecord: mapDocToLog(activeDoc) };
    }
    return { isCheckedIn: false, currentRecord: null };
  } catch (error) {
    return { isCheckedIn: false, currentRecord: null };
  }
};

// --- UPDATED CHECK-IN FUNCTION ---
export const checkInStudent = async (
  user: User,
  labId: string,
  systemNumber: number,
  proofUrl?: string,
  labName?: string, // <--- NEW PARAM
  isAdHoc: boolean = false // <--- NEW PARAM
): Promise<AttendanceLog> => {

  const newLog = {
    studentId: user.id,
    studentName: user.name,
    labId,
    labName: labName || labId, // Save the Name, fallback to ID if missing
    systemNumber,
    checkInTime: new Date().toISOString(),
    status: 'PRESENT',
    date: new Date().toLocaleDateString(),
    proofUrl: proofUrl || '',
    isAdHoc: isAdHoc // Save the flag to DB
  };

  // Cast to 'any' briefly to avoid type conflict if types.ts isn't fully refreshed by VS Code yet
  const docRef = await addDoc(collection(db, ATTENDANCE_COLLECTION), newLog);
  return { id: docRef.id, ...newLog } as any as AttendanceLog;
};

// NEW: Manual Entry for Faculty Dashboard
export const manualCheckIn = async (studentId: string, labId: string, status: 'PRESENT' | 'LATE'): Promise<void> => {
  // We need to fetch the student name for the log
  let studentName = 'Unknown';
  try {
    const userDoc = await getDoc(doc(db, 'users', studentId));
    if (userDoc.exists()) studentName = userDoc.data().name;
  } catch (e) { console.error("Error fetching user for manual checkin", e); }

  const newLog = {
    studentId,
    studentName,
    labId,
    systemNumber: 0, // Manual entry
    checkInTime: new Date().toISOString(),
    status: status,
    date: new Date().toLocaleDateString(),
    labName: labId
  };

  await addDoc(collection(db, ATTENDANCE_COLLECTION), newLog);
};

// --- UPDATED CHECKOUT FUNCTION ---
export const checkOutStudent = async (
  studentId: string,
  status: 'COMPLETED' | 'EARLY_LEAVE' = 'COMPLETED' // Default to COMPLETED
): Promise<void> => {

  const q = query(
    collection(db, ATTENDANCE_COLLECTION),
    where('studentId', '==', studentId),
    where('status', 'in', ['PRESENT', 'LATE']) // Only close active sessions
  );

  const snapshot = await getDocs(q);
  const activeDoc = snapshot.docs.find(d => !d.data().checkOutTime);

  if (activeDoc) {
    await updateDoc(doc(db, ATTENDANCE_COLLECTION, activeDoc.id), {
      checkOutTime: new Date().toISOString(),
      status: status // <--- Saves 'EARLY_LEAVE' or 'COMPLETED'
    });
  }
};

export const updateAttendanceRecord = async (logId: string, updates: Partial<AttendanceLog>): Promise<void> => {
  await updateDoc(doc(db, ATTENDANCE_COLLECTION, logId), updates);
};

export const deleteAttendanceRecord = async (logId: string): Promise<void> => {
  await deleteDoc(doc(db, ATTENDANCE_COLLECTION, logId));
};

// --- Activity Functions ---

export const submitActivity = async (
  user: User,
  type: StudentActivity['activityType'],
  payload: any
): Promise<void> => {
  let status: 'present' | 'late' | undefined = undefined;
  if (type === 'checkin') {
    const nowMinutes = new Date().getMinutes();
    status = nowMinutes > 10 ? 'late' : 'present';
  }

  const newActivity = {
    studentId: user.id,
    studentName: user.name,
    department: user.department || 'General',
    semester: user.semester || '1st',
    activityType: type,
    activityPayload: payload,
    timestamp: new Date().toISOString(),
    status: status || 'present'
  };

  try {
    await addDoc(collection(db, ACTIVITIES_COLLECTION), newActivity);
  } catch (e) {
    console.error("Failed to log activity", e);
  }
};

// NEW: Activity Fetcher for Faculty Dashboard
export const getActivitiesForFaculty = async (department: string, managedSemesters: string[]): Promise<StudentActivity[]> => {
  try {
    const q = query(
      collection(db, ACTIVITIES_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    const allActivities = snapshot.docs.map(mapDocToActivity);

    // Filter by Semester
    return allActivities.filter(act =>
      (act.department === department || !department) &&
      (managedSemesters && managedSemesters.includes(act.semester))
    );
  } catch (error) {
    console.error("Error fetching activities:", error);
    return [];
  }
};