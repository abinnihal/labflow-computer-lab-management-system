
import { Task, Submission, User } from '../types';
import { sendNotification } from './notificationService';

// Initialize with Empty Data
let TASKS: Task[] = [];
let SUBMISSIONS: Submission[] = [];

// --- Helpers ---

export const getAllTasks = (): Task[] => {
  return [...TASKS];
};

export const getAllSubmissions = (): Submission[] => {
  return [...SUBMISSIONS];
};

export const getTasksForStudent = (studentId: string): { task: Task, submission: Submission | null }[] => {
  return TASKS.map(task => {
    const sub = SUBMISSIONS.find(s => s.taskId === task.id && s.studentId === studentId) || null;
    return { task, submission: sub };
  });
};

export const getTasksByFaculty = (facultyId: string): Task[] => {
  return TASKS.filter(t => t.assignedById === facultyId);
};

export const getSubmissionsForTask = (taskId: string): Submission[] => {
  return SUBMISSIONS.filter(s => s.taskId === taskId);
};

export const getPendingSubmissionsCount = (facultyId: string): number => {
  const facultyTaskIds = TASKS.filter(t => t.assignedById === facultyId).map(t => t.id);
  // Count submissions that are submitted but not yet approved/rejected (or explicitly SUBMITTED status)
  return SUBMISSIONS.filter(s => facultyTaskIds.includes(s.taskId) && s.status === 'SUBMITTED').length;
};

export const createTask = (taskData: Omit<Task, 'id' | 'createdAt'>): Task => {
  const newTask: Task = {
    ...taskData,
    id: `t-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  TASKS.unshift(newTask);
  
  // Notify Student (Broadcasting to 's-demo' for simplicity in demo)
  sendNotification(taskData.assignedById, 's-demo', `New Assignment Posted: ${taskData.title}`, 'INFO');
  
  return newTask;
};

export const submitTask = (studentId: string, studentName: string, taskId: string, data: { text?: string, code?: string, files?: string[] }): Submission => {
  SUBMISSIONS = SUBMISSIONS.filter(s => !(s.taskId === taskId && s.studentId === studentId));

  const newSub: Submission = {
    id: `sub-${Date.now()}`,
    taskId,
    studentId,
    studentName,
    submittedAt: new Date().toISOString(),
    status: 'SUBMITTED',
    textResponse: data.text,
    codeSnippet: data.code,
    files: data.files
  };
  SUBMISSIONS.push(newSub);

  // Notify Faculty
  const task = TASKS.find(t => t.id === taskId);
  if (task) {
      sendNotification(studentId, task.assignedById, `${studentName} submitted task: ${task.title}`, 'INFO');
  }

  return newSub;
};

export const updateSubmissionStatus = (submissionId: string, status: 'APPROVED' | 'REJECTED', feedback?: string) => {
  const sub = SUBMISSIONS.find(s => s.id === submissionId);
  if (sub) {
    sub.status = status;
    sub.feedback = feedback;
    
    // Notify Student
    const notifType = status === 'APPROVED' ? 'INFO' : 'ALERT';
    const notifMsg = `Your submission has been ${status}. ${feedback ? 'Feedback: ' + feedback : ''}`;
    sendNotification('FACULTY', sub.studentId, notifMsg, notifType);
  }
};

export const getTaskStats = (taskId: string) => {
  const subs = getSubmissionsForTask(taskId);
  const totalStudents = 30; // Mock total capacity
  return {
    submitted: subs.length,
    pending: Math.max(0, totalStudents - subs.length),
    approved: subs.filter(s => s.status === 'APPROVED').length,
    rejected: subs.filter(s => s.status === 'REJECTED').length
  };
};

export const getStudentTaskHistory = (studentId: string): { task: Task, status: string, grade?: string, submittedAt?: string }[] => {
  return TASKS.map(task => {
    const sub = SUBMISSIONS.find(s => s.taskId === task.id && s.studentId === studentId);
    let status = 'PENDING';
    if (sub) {
      status = sub.status;
    } else {
      const dueDate = new Date(task.dueDate);
      const now = new Date();
      dueDate.setHours(0,0,0,0);
      now.setHours(0,0,0,0);
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
