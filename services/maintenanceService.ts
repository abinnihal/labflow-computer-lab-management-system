import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where
} from 'firebase/firestore';
import { db } from './firebase';
import { Feedback, MaintenanceRequest } from '../types';
import { sendNotification } from './notificationService';
import { getAllLabs } from './labService';

const FEEDBACK_COLLECTION = 'feedbacks';
const MAINTENANCE_COLLECTION = 'maintenance_requests';

// --- HELPERS ---
const mapDocToFeedback = (doc: any): Feedback => ({ id: doc.id, ...doc.data() });
const mapDocToRequest = (doc: any): MaintenanceRequest => ({ id: doc.id, ...doc.data() });

// --- FEEDBACK FUNCTIONS ---

export const getStudentFeedbacks = async (target?: 'FACULTY' | 'ADMIN'): Promise<Feedback[]> => {
  try {
    const q = target
      ? query(collection(db, FEEDBACK_COLLECTION), where('target', '==', target))
      : collection(db, FEEDBACK_COLLECTION);

    const snapshot = await getDocs(q);
    const feedbacks = snapshot.docs.map(mapDocToFeedback);
    return feedbacks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    return [];
  }
};

export const getFeedbackByStudent = async (studentId: string): Promise<Feedback[]> => {
  try {
    const q = query(collection(db, FEEDBACK_COLLECTION), where('studentId', '==', studentId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDocToFeedback).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error("Error fetching student feedback:", error);
    return [];
  }
};

export const createFeedback = async (feedback: Omit<Feedback, 'id' | 'date' | 'status' | 'isArchived'>): Promise<Feedback> => {
  const newFeedback = {
    ...feedback,
    date: new Date().toISOString(),
    status: 'PENDING',
    isArchived: false
  };

  const docRef = await addDoc(collection(db, FEEDBACK_COLLECTION), newFeedback);

  if (feedback.target === 'ADMIN') {
    await sendNotification('SYSTEM', 'ADMIN_GROUP', `New feedback from ${feedback.studentName}: ${feedback.category}`, 'INFO');
  }

  return { id: docRef.id, ...newFeedback } as Feedback;
};

export const getPendingFeedbackCount = async (): Promise<number> => {
  const feedbacks = await getStudentFeedbacks('ADMIN');
  return feedbacks.filter(f => f.status === 'PENDING').length;
};

// --- MAINTENANCE REQUEST FUNCTIONS ---

export const getMaintenanceRequests = async (facultyId?: string): Promise<MaintenanceRequest[]> => {
  try {
    const q = facultyId
      ? query(collection(db, MAINTENANCE_COLLECTION), where('facultyId', '==', facultyId))
      : collection(db, MAINTENANCE_COLLECTION);

    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDocToRequest).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error("Error fetching maintenance requests:", error);
    return [];
  }
};

export const getPendingMaintenanceCount = async (facultyId: string): Promise<number> => {
  const requests = await getMaintenanceRequests(facultyId);
  return requests.filter(r => r.status !== 'RESOLVED').length;
};

export const createMaintenanceRequest = async (request: Omit<MaintenanceRequest, 'id' | 'date' | 'status' | 'labName' | 'isArchived'>): Promise<MaintenanceRequest> => {
  // Fetch lab name for better context
  const labs = await getAllLabs();
  const lab = labs.find(l => l.id === request.labId);

  const newRequest = {
    ...request,
    date: new Date().toISOString(),
    status: 'PENDING',
    labName: lab ? lab.name : 'Unknown Lab',
    isArchived: false
  };

  const docRef = await addDoc(collection(db, MAINTENANCE_COLLECTION), newRequest);
  return { id: docRef.id, ...newRequest } as MaintenanceRequest;
};

export const updateMaintenanceRequestStatus = async (id: string, status: MaintenanceRequest['status']): Promise<void> => {
  const ref = doc(db, MAINTENANCE_COLLECTION, id);
  await updateDoc(ref, { status });
};

// --- ADMIN ACTIONS ---

export const replyToFeedback = async (id: string, reply: string, adminId: string): Promise<void> => {
  const ref = doc(db, FEEDBACK_COLLECTION, id);
  await updateDoc(ref, {
    adminReply: reply,
    status: 'RESOLVED'
  });
  // Note: In real app, fetch doc first to get studentId for notification
};

export const resolveFeedback = async (id: string, adminId: string): Promise<void> => {
  const ref = doc(db, FEEDBACK_COLLECTION, id);
  await updateDoc(ref, { status: 'RESOLVED' });
};

export const archiveFeedback = async (id: string): Promise<void> => {
  const ref = doc(db, FEEDBACK_COLLECTION, id);
  await updateDoc(ref, { isArchived: true });
};

export const replyToMaintenance = async (id: string, reply: string, adminId: string): Promise<void> => {
  const ref = doc(db, MAINTENANCE_COLLECTION, id);
  await updateDoc(ref, { adminReply: reply });
};

export const resolveMaintenance = async (id: string, adminId: string): Promise<void> => {
  const ref = doc(db, MAINTENANCE_COLLECTION, id);
  await updateDoc(ref, { status: 'RESOLVED' });
};

export const archiveMaintenance = async (id: string): Promise<void> => {
  const ref = doc(db, MAINTENANCE_COLLECTION, id);
  await updateDoc(ref, { isArchived: true });
};