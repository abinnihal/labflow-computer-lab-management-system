
import { Booking, Lab, BookingLog, UserRole } from '../types';
import { sendNotification } from './notificationService';
import { getAllLabs } from './labService';

// Initialize with empty data for reset
let CURRENT_BOOKINGS: Booking[] = [];

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

const addLog = (booking: Booking, action: BookingLog['action'], userId: string, userName: string, details?: string) => {
  if (!booking.logs) booking.logs = [];
  booking.logs.push({
    action,
    byUserId: userId,
    byUserName: userName,
    timestamp: new Date().toISOString(),
    details
  });
};

export const getAllBookings = (): Booking[] => {
  return CURRENT_BOOKINGS.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
};

export const getLabs = (): Lab[] => {
  return getAllLabs();
};

// Simulates: GET /api/student/<id>/next-lab
export const getNextLabSession = (studentId: string): Booking | null => {
  const now = new Date();
  
  // logic: Find the first approved booking in the future.
  const upcoming = CURRENT_BOOKINGS
    .filter(b => b.status === 'APPROVED' && new Date(b.endTime) > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
  return upcoming.length > 0 ? upcoming[0] : null;
};

export const checkConflict = (req: BookingRequest, excludeBookingId?: string): ConflictResult => {
  const labs = getAllLabs();
  const lab = labs.find(l => l.id === req.labId);
  if (!lab) return { hasConflict: true, message: "Invalid Lab ID" };

  if (lab.status === 'MAINTENANCE' || lab.status === 'OFFLINE') {
      return { hasConflict: true, message: `Maintenance Undergoing: ${lab.name} is currently unavailable for bookings.` };
  }

  const startDateTime = new Date(`${req.date}T${req.startTime}:00`);
  const endDateTime = new Date(`${req.date}T${req.endTime}:00`);

  if (startDateTime >= endDateTime) {
    return { hasConflict: true, message: "End time must be after start time." };
  }

  if (req.systemCount > lab.capacity) {
      return { hasConflict: true, message: `Requested systems (${req.systemCount}) exceed lab capacity (${lab.capacity}).` };
  }

  const conflict = CURRENT_BOOKINGS.find(b => {
    if (b.id === excludeBookingId) return false;
    if (b.labId !== req.labId) return false;
    if (b.status === 'REJECTED' || b.status === 'COMPLETED') return false;

    // Very simple overlap check
    // Parse existing ISO dates
    const existingStart = new Date(b.startTime);
    const existingEnd = new Date(b.endTime);

    // Simple date string compare for day match
    const reqDay = req.date;
    const existingDay = existingStart.toISOString().split('T')[0];
    
    if (reqDay !== existingDay) return false;

    // Time compare
    return startDateTime < existingEnd && endDateTime > existingStart;
  });

  if (conflict) {
    const startStr = new Date(conflict.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const endStr = new Date(conflict.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    return { 
        hasConflict: true, 
        message: `Conflict detected: Lab is occupied by ${conflict.userName} for "${conflict.subject}" (${startStr} - ${endStr}).`,
        conflictingBooking: conflict
    };
  }

  return { hasConflict: false };
};

export const createBooking = (req: BookingRequest, isOverride: boolean = false): Booking => {
  const labs = getAllLabs();
  const lab = labs.find(l => l.id === req.labId);
  
  if ((lab?.status === 'MAINTENANCE' || lab?.status === 'OFFLINE') && !isOverride) {
      throw new Error(`Maintenance Undergoing: ${lab?.name} is unavailable.`);
  }

  const initialStatus = req.userRole === UserRole.ADMIN ? 'APPROVED' : 'PENDING';

  const newBooking: Booking = {
    id: `b-${Date.now()}`,
    labId: req.labId,
    userId: req.userId,
    userName: req.userName,
    subject: req.subject,
    startTime: new Date(`${req.date}T${req.startTime}:00`).toISOString(),
    endTime: new Date(`${req.date}T${req.endTime}:00`).toISOString(),
    status: initialStatus, 
    type: 'EXTRA',
    systemCount: req.systemCount,
    reminder: req.reminder,
    logs: []
  };
  
  addLog(newBooking, isOverride ? 'OVERRIDE' : 'CREATED', req.userId, req.userName, isOverride ? 'Admin forced booking over conflict' : 'Booking requested');
  
  CURRENT_BOOKINGS.push(newBooking);

  if (initialStatus === 'PENDING') {
      sendNotification('SYSTEM', 'ADMIN_GROUP', `New booking request from ${req.userName} for ${req.subject}.`, 'INFO');
  } else if (req.userRole === UserRole.ADMIN) {
      // Notify faculty if admin booked it for them (edge case, but good to have)
      if (req.userId !== 'a-demo') {
         sendNotification('ADMIN', req.userId, `Admin booked "${req.subject}" for you.`, 'INFO');
      }
  }

  return newBooking;
};

export const updateBooking = (bookingId: string, req: BookingRequest, editorId: string, editorName: string): Booking | null => {
  const index = CURRENT_BOOKINGS.findIndex(b => b.id === bookingId);
  if (index === -1) return null;

  const oldBooking = CURRENT_BOOKINGS[index];
  const updatedBooking: Booking = {
    ...oldBooking,
    labId: req.labId,
    subject: req.subject,
    startTime: new Date(`${req.date}T${req.startTime}:00`).toISOString(),
    endTime: new Date(`${req.date}T${req.endTime}:00`).toISOString(),
    systemCount: req.systemCount,
    reminder: req.reminder
  };

  addLog(updatedBooking, 'UPDATED', editorId, editorName, `Changed details. Prev: ${oldBooking.subject}`);
  
  if (oldBooking.userId !== editorId) {
      sendNotification(editorId, oldBooking.userId, `Your booking for ${oldBooking.subject} has been modified by ${editorName}.`, 'ALERT');
  }

  CURRENT_BOOKINGS[index] = updatedBooking;
  return updatedBooking;
};

export const cancelBooking = (bookingId: string, actorId: string, actorName: string): void => {
  const index = CURRENT_BOOKINGS.findIndex(b => b.id === bookingId);
  if (index !== -1) {
    const booking = CURRENT_BOOKINGS[index];
    booking.status = 'REJECTED'; 
    addLog(booking, 'CANCELLED', actorId, actorName, 'Booking cancelled');
    
    // Notify if someone else cancelled it (e.g. Admin cancelled Faculty booking)
    if (booking.userId !== actorId) {
        sendNotification(actorId, booking.userId, `Your booking "${booking.subject}" was cancelled by ${actorName}.`, 'ALERT');
    }
  }
};

export const approveBooking = (bookingId: string, adminId: string, adminName: string): void => {
    const booking = CURRENT_BOOKINGS.find(b => b.id === bookingId);
    if (booking) {
        booking.status = 'APPROVED';
        addLog(booking, 'APPROVED', adminId, adminName, 'Request approved');
        sendNotification(adminId, booking.userId, `Your booking request for "${booking.subject}" has been APPROVED.`, 'INFO');
    }
};

export const rejectBooking = (bookingId: string, adminId: string, adminName: string): void => {
    const booking = CURRENT_BOOKINGS.find(b => b.id === bookingId);
    if (booking) {
        booking.status = 'REJECTED';
        addLog(booking, 'REJECTED', adminId, adminName, 'Request rejected');
        sendNotification(adminId, booking.userId, `Your booking request for "${booking.subject}" has been REJECTED.`, 'ALERT');
    }
};
