import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { Task, Submission } from '../types';
import { sendNotification } from './notificationService';

const TASKS_COLLECTION = 'tasks';
const SUBMISSIONS_COLLECTION = 'submissions';

// --- Helpers ---

const mapDocToTask = (doc: any): Task => ({ id: doc.id, ...doc.data() });
const mapDocToSubmission = (doc: any): Submission => ({ id: doc.id, ...doc.data() });

export const getAllTasks = async (): Promise<Task[]> => {
  try {
    const snapshot = await getDocs(collection(db, TASKS_COLLECTION));
    return snapshot.docs.map(mapDocToTask).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
};

export const getAllSubmissions = async (): Promise<Submission[]> => {
  try {
    const snapshot = await getDocs(collection(db, SUBMISSIONS_COLLECTION));
    return snapshot.docs.map(mapDocToSubmission);
  } catch (error) {
    return [];
  }
};

export const getTasksForStudent = async (studentId: string): Promise<{ task: Task, submission: Submission | null }[]> => {
  const tasks = await getAllTasks();

  // Fetch only this student's submissions
  const q = query(collection(db, SUBMISSIONS_COLLECTION), where('studentId', '==', studentId));
  const subSnap = await getDocs(q);
  const submissions = subSnap.docs.map(mapDocToSubmission);

  return tasks.map(task => {
    const sub = submissions.find(s => s.taskId === task.id) || null;
    return { task, submission: sub };
  });
};

export const getTasksByFaculty = async (facultyId: string): Promise<Task[]> => {
  const q = query(collection(db, TASKS_COLLECTION), where('assignedById', '==', facultyId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDocToTask).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getSubmissionsForTask = async (taskId: string): Promise<Submission[]> => {
  const q = query(collection(db, SUBMISSIONS_COLLECTION), where('taskId', '==', taskId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDocToSubmission);
};

export const getPendingSubmissionsCount = async (facultyId: string): Promise<number> => {
  // 1. Get all tasks by this faculty
  const tasks = await getTasksByFaculty(facultyId);
  const taskIds = tasks.map(t => t.id);

  if (taskIds.length === 0) return 0;

  // 2. Get all submissions (Firestore doesn't support "whereIn" with > 10 IDs easily, so we fetch 'SUBMITTED' and filter)
  const q = query(collection(db, SUBMISSIONS_COLLECTION), where('status', '==', 'SUBMITTED'));
  const snapshot = await getDocs(q);

  // 3. Filter client-side
  const pending = snapshot.docs.filter(doc => taskIds.includes(doc.data().taskId));
  return pending.length;
};

export const createTask = async (taskData: Omit<Task, 'id' | 'createdAt'>): Promise<Task> => {
  const newTask = {
    ...taskData,
    createdAt: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, TASKS_COLLECTION), newTask);

  // Notify Student (Broadcasting to 's-demo' for simplicity, or use topic)
  // In real app: send to specific group/semester
  await sendNotification(taskData.assignedById, 's-demo', `New Assignment Posted: ${taskData.title}`, 'INFO');

  return { id: docRef.id, ...newTask } as Task;
};

export const submitTask = async (studentId: string, studentName: string, taskId: string, data: { text?: string, code?: string, files?: string[] }): Promise<Submission> => {
  // Check if already submitted
  const q = query(
    collection(db, SUBMISSIONS_COLLECTION),
    where('taskId', '==', taskId),
    where('studentId', '==', studentId)
  );
  const snapshot = await getDocs(q);

  // FIX: Use || '' (OR Empty String) to prevent 'undefined' errors
  const submissionData = {
    taskId,
    studentId,
    studentName,
    submittedAt: new Date().toISOString(),
    status: 'SUBMITTED',
    textResponse: data.text || '',    // <--- FIX HERE
    codeSnippet: data.code || '',     // <--- FIX HERE
    files: data.files || []           // <--- FIX HERE
  };

  let submissionId = '';

  if (!snapshot.empty) {
    // Update existing
    const docId = snapshot.docs[0].id;
    await updateDoc(doc(db, SUBMISSIONS_COLLECTION, docId), submissionData);
    submissionId = docId;
  } else {
    // Create new
    const docRef = await addDoc(collection(db, SUBMISSIONS_COLLECTION), submissionData);
    submissionId = docRef.id;
  }

  // Notify Faculty
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    const taskSnap = await getDoc(taskRef);
    if (taskSnap.exists()) {
      const task = taskSnap.data() as Task;
      await sendNotification(studentId, task.assignedById, `${studentName} submitted task: ${task.title}`, 'INFO');
    }
  } catch (err) {
    console.warn("Notification failed (non-fatal):", err);
  }

  return { id: submissionId, ...submissionData } as any as Submission;
};

export const updateSubmissionStatus = async (submissionId: string, status: 'APPROVED' | 'REJECTED', feedback?: string) => {
  const subRef = doc(db, SUBMISSIONS_COLLECTION, submissionId);

  await updateDoc(subRef, { status, feedback });

  // Notify Student
  const subSnap = await getDoc(subRef);
  if (subSnap.exists()) {
    const sub = subSnap.data() as Submission;
    const notifType = status === 'APPROVED' ? 'INFO' : 'ALERT';
    const notifMsg = `Your submission has been ${status}. ${feedback ? 'Feedback: ' + feedback : ''}`;
    await sendNotification('FACULTY', sub.studentId, notifMsg, notifType);
  }
};

export const getTaskStats = async (taskId: string) => {
  const subs = await getSubmissionsForTask(taskId);
  const totalStudents = 30; // Mock total capacity or fetch actual count
  return {
    submitted: subs.length,
    pending: Math.max(0, totalStudents - subs.length),
    approved: subs.filter(s => s.status === 'APPROVED').length,
    rejected: subs.filter(s => s.status === 'REJECTED').length
  };
};

export const getStudentTaskHistory = async (studentId: string): Promise<{ task: Task, status: string, grade?: string, submittedAt?: string }[]> => {
  const tasks = await getAllTasks();
  const q = query(collection(db, SUBMISSIONS_COLLECTION), where('studentId', '==', studentId));
  const subSnap = await getDocs(q);
  const submissions = subSnap.docs.map(mapDocToSubmission);

  return tasks.map(task => {
    const sub = submissions.find(s => s.taskId === task.id);
    let status = 'PENDING';
    if (sub) {
      status = sub.status;
    } else {
      const dueDate = new Date(task.dueDate);
      const now = new Date();
      dueDate.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      if (now > dueDate) status = 'OVERDUE';
    }

    return {
      task,
      status,
      grade: sub?.status === 'APPROVED' ? 'A' : undefined,
      submittedAt: sub?.submittedAt
    };
  });
};