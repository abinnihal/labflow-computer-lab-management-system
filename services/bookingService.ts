import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  Timestamp,
  getDoc
} from "firebase/firestore";
import { db } from "./firebase";
import { Booking, Lab, BookingLog, UserRole, BookingRequest, ConflictResult } from '../types';
import { sendNotification } from './notificationService';
import { getAllLabs } from './labService';

// Collection Reference
const BOOKINGS_COLLECTION = 'bookings';

// Helper: Add log to local object (Persistence handled in update/create)
const createLogEntry = (action: BookingLog['action'], userId: string, userName: string, details?: string): BookingLog => ({
  action,
  byUserId: userId,
  byUserName: userName,
  timestamp: new Date().toISOString(),
  details
});

// Helper: Convert Firestore doc to Booking type
const mapDocToBooking = (doc: any): Booking => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    // Ensure dates are converted back to ISO strings if they are Timestamps
    startTime: data.startTime?.toDate ? data.startTime.toDate().toISOString() : data.startTime,
    endTime: data.endTime?.toDate ? data.endTime.toDate().toISOString() : data.endTime,
  } as Booking;
};

export const getAllBookings = async (): Promise<Booking[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, BOOKINGS_COLLECTION));
    const bookings = querySnapshot.docs.map(mapDocToBooking);
    return bookings.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return [];
  }
};

export const getLabs = (): Lab[] => {
  // Note: This still calls the synchronous labService. 
  // We will fix labService in the next step.
  return getAllLabs();
};

export const getNextLabSession = async (studentId: string): Promise<Booking | null> => {
  const now = new Date();
  const bookings = await getAllBookings();

  const upcoming = bookings
    .filter(b => b.status === 'APPROVED' && new Date(b.endTime) > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return upcoming.length > 0 ? upcoming[0] : null;
};

export const checkConflict = async (req: BookingRequest, excludeBookingId?: string): Promise<ConflictResult> => {
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

  // Fetch all bookings for this lab to check overlap
  // Optimization: In a real app, use a Firestore query for the specific date range.
  const allBookings = await getAllBookings();

  const conflict = allBookings.find(b => {
    if (b.id === excludeBookingId) return false;
    if (b.labId !== req.labId) return false;
    if (b.status === 'REJECTED' || b.status === 'COMPLETED') return false;

    const existingStart = new Date(b.startTime);
    const existingEnd = new Date(b.endTime);

    // Check overlap
    return startDateTime < existingEnd && endDateTime > existingStart;
  });

  if (conflict) {
    const startStr = new Date(conflict.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endStr = new Date(conflict.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      hasConflict: true,
      message: `Conflict detected: Lab is occupied by ${conflict.userName} for "${conflict.subject}" (${startStr} - ${endStr}).`,
      conflictingBooking: conflict
    };
  }

  return { hasConflict: false };
};

export const createBooking = async (req: BookingRequest, isOverride: boolean = false): Promise<Booking> => {
  // Verify conflict again server-side (optional but recommended)
  if (!isOverride) {
    const conflict = await checkConflict(req);
    if (conflict.hasConflict) throw new Error(conflict.message);
  }

  const initialStatus = req.userRole === UserRole.ADMIN ? 'APPROVED' : 'PENDING';

  const bookingData = {
    labId: req.labId,
    userId: req.userId,
    userName: req.userName,
    subject: req.subject,
    // Store as Firestore Timestamp or ISO string. Using Date object lets Firestore convert to Timestamp automatically.
    startTime: new Date(`${req.date}T${req.startTime}:00`),
    endTime: new Date(`${req.date}T${req.endTime}:00`),
    status: initialStatus,
    type: 'EXTRA',
    systemCount: req.systemCount,
    reminder: req.reminder,
    logs: [createLogEntry(isOverride ? 'OVERRIDE' : 'CREATED', req.userId, req.userName, isOverride ? 'Admin forced booking' : 'Booking requested')]
  };

  const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), bookingData);

  // Notification Logic
  if (initialStatus === 'PENDING') {
    await sendNotification('SYSTEM', 'ADMIN_GROUP', `New booking request from ${req.userName} for ${req.subject}.`, 'INFO');
  } else if (req.userRole === UserRole.ADMIN && req.userId !== 'a-demo') {
    await sendNotification('ADMIN', req.userId, `Admin booked "${req.subject}" for you.`, 'INFO');
  }

  // Return the new booking object
  return { id: docRef.id, ...bookingData, startTime: bookingData.startTime.toISOString(), endTime: bookingData.endTime.toISOString() } as unknown as Booking;
};

export const updateBooking = async (bookingId: string, req: BookingRequest, editorId: string, editorName: string): Promise<Booking | null> => {
  const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
  const bookingSnap = await getDoc(bookingRef);

  if (!bookingSnap.exists()) return null;

  const oldBooking = bookingSnap.data() as Booking;

  const updates = {
    labId: req.labId,
    subject: req.subject,
    startTime: new Date(`${req.date}T${req.startTime}:00`),
    endTime: new Date(`${req.date}T${req.endTime}:00`),
    systemCount: req.systemCount,
    reminder: req.reminder,
    // Append log
    logs: [...(oldBooking.logs || []), createLogEntry('UPDATED', editorId, editorName, `Changed details.`)]
  };

  await updateDoc(bookingRef, updates);

  if (oldBooking.userId !== editorId) {
    await sendNotification(editorId, oldBooking.userId, `Your booking for ${oldBooking.subject} has been modified by ${editorName}.`, 'ALERT');
  }

  return { ...oldBooking, ...updates, id: bookingId } as unknown as Booking;
};

export const cancelBooking = async (bookingId: string, actorId: string, actorName: string): Promise<void> => {
  const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
  const bookingSnap = await getDoc(bookingRef);

  if (bookingSnap.exists()) {
    const booking = bookingSnap.data() as Booking;
    const logs = [...(booking.logs || []), createLogEntry('CANCELLED', actorId, actorName, 'Booking cancelled')];

    await updateDoc(bookingRef, { status: 'REJECTED', logs });

    if (booking.userId !== actorId) {
      await sendNotification(actorId, booking.userId, `Your booking "${booking.subject}" was cancelled by ${actorName}.`, 'ALERT');
    }
  }
};

export const approveBooking = async (bookingId: string, adminId: string, adminName: string): Promise<void> => {
  const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
  const bookingSnap = await getDoc(bookingRef);

  if (bookingSnap.exists()) {
    const booking = bookingSnap.data() as Booking;
    const logs = [...(booking.logs || []), createLogEntry('APPROVED', adminId, adminName, 'Request approved')];

    await updateDoc(bookingRef, { status: 'APPROVED', logs });
    await sendNotification(adminId, booking.userId, `Your booking request for "${booking.subject}" has been APPROVED.`, 'INFO');
  }
};

export const rejectBooking = async (bookingId: string, adminId: string, adminName: string): Promise<void> => {
  const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
  const bookingSnap = await getDoc(bookingRef);

  if (bookingSnap.exists()) {
    const booking = bookingSnap.data() as Booking;
    const logs = [...(booking.logs || []), createLogEntry('REJECTED', adminId, adminName, 'Request rejected')];

    await updateDoc(bookingRef, { status: 'REJECTED', logs });
    await sendNotification(adminId, booking.userId, `Your booking request for "${booking.subject}" has been REJECTED.`, 'ALERT');
  }
};