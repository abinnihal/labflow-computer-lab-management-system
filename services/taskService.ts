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
// This automatically maps ALL fields (including the new 'duration') from Firestore
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
    console.error("Error fetching submissions:", error);
    return [];
  }
};

export const getTasksForStudent = async (studentId: string): Promise<{ task: Task, submission: Submission | null }[]> => {
  // 1. Get Student Details
  let studentSemester = '';
  try {
    const userRef = doc(db, 'users', studentId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      studentSemester = userSnap.data().semester || '';
    }
  } catch (e) { console.error("Error fetching student profile", e); }

  const allTasks = await getAllTasks();

  // 2. Filter Tasks
  const relevantTasks = allTasks.filter(t => {
    if (t.course && studentSemester) {
      return t.course === studentSemester || t.course === 'ALL';
    }
    return true;
  });

  // 3. Fetch submissions
  const q = query(collection(db, SUBMISSIONS_COLLECTION), where('studentId', '==', studentId));
  const subSnap = await getDocs(q);
  const submissions = subSnap.docs.map(mapDocToSubmission);

  return relevantTasks.map(task => {
    const sub = submissions.find(s => s.taskId === task.id) || null;
    return { task, submission: sub };
  });
};

export const getStudentTaskHistory = async (studentId: string): Promise<{ task: Task, status: string, grade?: string, submittedAt?: string }[]> => {
  const data = await getTasksForStudent(studentId);

  return data.map(({ task, submission }) => {
    let status = 'PENDING';
    if (submission) {
      status = submission.status;
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
      grade: submission?.status === 'APPROVED' ? 'A' : undefined,
      submittedAt: submission?.submittedAt
    };
  });
};

export const getTasksByFaculty = async (facultyId: string): Promise<Task[]> => {
  const q = query(collection(db, TASKS_COLLECTION), where('assignedById', '==', facultyId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDocToTask).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getPendingSubmissionsCount = async (facultyId: string): Promise<number> => {
  const myTasks = await getTasksByFaculty(facultyId);
  if (myTasks.length === 0) return 0;

  const taskIds = myTasks.map(t => t.id);

  const q = query(collection(db, SUBMISSIONS_COLLECTION), where('status', '==', 'SUBMITTED'));
  const snapshot = await getDocs(q);

  const pending = snapshot.docs.filter(doc => {
    const sub = doc.data() as Submission;
    return taskIds.includes(sub.taskId);
  });

  return pending.length;
};

export const getSubmissionsForTask = async (taskId: string): Promise<Submission[]> => {
  const q = query(collection(db, SUBMISSIONS_COLLECTION), where('taskId', '==', taskId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDocToSubmission);
};

export const createTask = async (taskData: Omit<Task, 'id' | 'createdAt'>): Promise<Task> => {
  // SPREAD OPERATOR NOTE: The '...taskData' line below automatically includes 'duration'
  // if it was passed from the Faculty Page. No extra code needed!
  const newTask = {
    ...taskData,
    createdAt: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, TASKS_COLLECTION), newTask);
  await sendNotification(taskData.assignedById, 'ALL', `New Assignment: ${taskData.title}`, 'INFO');
  return { id: docRef.id, ...newTask } as Task;
};

export const submitTask = async (studentId: string, studentName: string, taskId: string, data: { text?: string, code?: string, files?: string[] }): Promise<Submission> => {
  const q = query(
    collection(db, SUBMISSIONS_COLLECTION),
    where('taskId', '==', taskId),
    where('studentId', '==', studentId)
  );
  const snapshot = await getDocs(q);

  const submissionData = {
    taskId,
    studentId,
    studentName,
    submittedAt: new Date().toISOString(),
    status: 'SUBMITTED',
    textResponse: data.text || '',
    codeSnippet: data.code || '',
    files: data.files || []
  };

  let submissionId = '';

  if (!snapshot.empty) {
    const docId = snapshot.docs[0].id;
    await updateDoc(doc(db, SUBMISSIONS_COLLECTION, docId), submissionData);
    submissionId = docId;
  } else {
    const docRef = await addDoc(collection(db, SUBMISSIONS_COLLECTION), submissionData);
    submissionId = docRef.id;
  }

  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    const taskSnap = await getDoc(taskRef);
    if (taskSnap.exists()) {
      const task = taskSnap.data() as Task;
      await sendNotification(studentId, task.assignedById, `${studentName} submitted: ${task.title}`, 'INFO');
    }
  } catch (err) { console.warn("Notify failed", err); }

  return { id: submissionId, ...submissionData } as any as Submission;
};

export const updateSubmissionStatus = async (submissionId: string, status: 'APPROVED' | 'REJECTED', feedback?: string) => {
  const subRef = doc(db, SUBMISSIONS_COLLECTION, submissionId);
  await updateDoc(subRef, { status, feedback });

  const subSnap = await getDoc(subRef);
  if (subSnap.exists()) {
    const sub = subSnap.data() as Submission;
    await sendNotification('FACULTY', sub.studentId, `Submission ${status}: ${feedback || ''}`, status === 'APPROVED' ? 'INFO' : 'ALERT');
  }
};

export const getTaskStats = async (taskId: string) => {
  const subs = await getSubmissionsForTask(taskId);
  return {
    submitted: subs.length,
    pending: 0,
    approved: subs.filter(s => s.status === 'APPROVED').length,
    rejected: subs.filter(s => s.status === 'REJECTED').length
  };
};