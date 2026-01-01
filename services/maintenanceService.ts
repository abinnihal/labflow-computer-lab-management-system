
import { Feedback, MaintenanceRequest, Lab } from '../types';
import { LABS } from '../constants';
import { sendNotification } from './notificationService';

// Empty Data
let FEEDBACKS: Feedback[] = [];
let MAINTENANCE_REQUESTS: MaintenanceRequest[] = [];

// --- Functions ---

export const getStudentFeedbacks = (target?: 'FACULTY' | 'ADMIN'): Feedback[] => {
  let filtered = [...FEEDBACKS];
  if (target) {
    filtered = filtered.filter(f => f.target === target || !f.target);
  }
  return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getFeedbackByStudent = (studentId: string): Feedback[] => {
  return FEEDBACKS.filter(f => f.studentId === studentId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const createFeedback = (feedback: Omit<Feedback, 'id' | 'date' | 'status' | 'isArchived'>): Feedback => {
  const newFeedback: Feedback = {
    ...feedback,
    id: `fb-${Date.now()}`,
    date: new Date().toISOString(),
    status: 'PENDING',
    isArchived: false
  };
  FEEDBACKS.unshift(newFeedback);
  
  if (feedback.target === 'ADMIN') {
      sendNotification('SYSTEM', 'ADMIN_GROUP', `New feedback from ${feedback.studentName}: ${feedback.category}`, 'INFO');
  } else {
      console.log(`Notification to Faculty: New Feedback from ${feedback.studentName}`);
  }
  
  return newFeedback;
};

export const getMaintenanceRequests = (facultyId?: string): MaintenanceRequest[] => {
  if (facultyId) {
    return MAINTENANCE_REQUESTS.filter(r => r.facultyId === facultyId);
  }
  return [...MAINTENANCE_REQUESTS];
};

export const getPendingMaintenanceCount = (facultyId: string): number => {
  return MAINTENANCE_REQUESTS.filter(r => r.facultyId === facultyId && r.status !== 'RESOLVED').length;
};

export const getPendingFeedbackCount = (): number => {
  return FEEDBACKS.filter(f => f.target === 'ADMIN' && f.status === 'PENDING').length;
};

export const createMaintenanceRequest = (request: Omit<MaintenanceRequest, 'id' | 'date' | 'status' | 'labName' | 'isArchived'>): MaintenanceRequest => {
  const lab = LABS.find(l => l.id === request.labId);
  
  const newRequest: MaintenanceRequest = {
    ...request,
    id: `mr-${Date.now()}`,
    date: new Date().toISOString(),
    status: 'PENDING',
    labName: lab ? lab.name : 'Unknown Lab',
    isArchived: false
  };
  
  MAINTENANCE_REQUESTS.unshift(newRequest);
  return newRequest;
};

export const updateMaintenanceRequestStatus = (id: string, status: MaintenanceRequest['status']) => {
  const index = MAINTENANCE_REQUESTS.findIndex(r => r.id === id);
  if (index !== -1) {
    MAINTENANCE_REQUESTS[index].status = status;
  }
};

// --- Admin Actions ---

export const replyToFeedback = (id: string, reply: string, adminId: string) => {
  const fb = FEEDBACKS.find(f => f.id === id);
  if (fb) {
    fb.adminReply = reply;
    fb.status = 'RESOLVED';
    sendNotification(adminId, fb.studentId, `Admin replied to your feedback: "${reply}"`, 'INFO');
  }
};

export const resolveFeedback = (id: string, adminId: string) => {
  const fb = FEEDBACKS.find(f => f.id === id);
  if (fb) {
    fb.status = 'RESOLVED';
    sendNotification(adminId, fb.studentId, `Your feedback regarding "${fb.category}" has been marked as resolved.`, 'INFO');
  }
};

export const archiveFeedback = (id: string) => {
  const fb = FEEDBACKS.find(f => f.id === id);
  if (fb) {
    fb.isArchived = true;
  }
};

export const replyToMaintenance = (id: string, reply: string, adminId: string) => {
  const mr = MAINTENANCE_REQUESTS.find(m => m.id === id);
  if (mr) {
    mr.adminReply = reply;
    sendNotification(adminId, mr.facultyId, `Admin updated your maintenance request: "${reply}"`, 'INFO');
  }
};

export const resolveMaintenance = (id: string, adminId: string) => {
  const mr = MAINTENANCE_REQUESTS.find(m => m.id === id);
  if (mr) {
    mr.status = 'RESOLVED';
    sendNotification(adminId, mr.facultyId, `Maintenance request "${mr.issueTitle}" marked as resolved.`, 'INFO');
  }
};

export const archiveMaintenance = (id: string) => {
  const mr = MAINTENANCE_REQUESTS.find(m => m.id === id);
  if (mr) {
    mr.isArchived = true;
  }
};
