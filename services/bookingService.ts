import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  query,
  where,
  deleteDoc
} from "firebase/firestore";
import { db } from "./firebase";
import { Booking, BookingLog, UserRole, BookingRequest, ConflictResult } from '../types';
import { sendNotification } from './notificationService';
import { getAllLabs } from './labService';

// Collection Reference
const BOOKINGS_COLLECTION = 'bookings';

// Helper: Add log to local object
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
    startTime: data.startTime?.toDate ? data.startTime.toDate().toISOString() : data.startTime,
    endTime: data.endTime?.toDate ? data.endTime.toDate().toISOString() : data.endTime,
  } as Booking;
};

// --- FETCHING FUNCTIONS ---

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

// Alias for compatibility with new components
export const getBookings = getAllBookings;

export const getBookingsByDate = async (date: string): Promise<Booking[]> => {
  try {
    const q = query(collection(db, BOOKINGS_COLLECTION), where("date", "==", date));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(mapDocToBooking);
  } catch (error) {
    console.error("Error fetching bookings by date:", error);
    return [];
  }
};

export const getBookingsByUser = async (userId: string): Promise<Booking[]> => {
  try {
    const q = query(collection(db, BOOKINGS_COLLECTION), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(mapDocToBooking);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return [];
  }
};

export const getNextLabSession = async (studentId: string): Promise<Booking | null> => {
  const now = new Date();
  const bookings = await getAllBookings();

  const upcoming = bookings
    .filter(b => b.status === 'APPROVED' && new Date(b.endTime) > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return upcoming.length > 0 ? upcoming[0] : null;
};

// --- LOGIC & CREATION ---

export const checkConflict = async (req: BookingRequest, excludeBookingId?: string): Promise<ConflictResult> => {
  const labs = await getAllLabs();
  const lab = labs.find(l => l.id === req.labId);

  if (!lab) return { hasConflict: true, message: "Invalid Lab ID" };

  // --- MAINTENANCE LOGIC ---
  if (lab.status === 'OFFLINE') {
    return { hasConflict: true, message: `Lab is permanently offline.` };
  }

  if (lab.status === 'MAINTENANCE') {
    if (lab.maintenanceUntil) {
      const maintenanceEnd = new Date(lab.maintenanceUntil);
      const bookingStart = new Date(`${req.date}T${req.startTime}:00`);

      if (bookingStart < maintenanceEnd) {
        const untilStr = maintenanceEnd.toLocaleString();
        return { hasConflict: true, message: `Lab is under maintenance until ${untilStr}.` };
      }
    } else {
      return { hasConflict: true, message: `Lab is currently under maintenance.` };
    }
  }
  // -----------------------------

  const startDateTime = new Date(`${req.date}T${req.startTime}:00`);
  const endDateTime = new Date(`${req.date}T${req.endTime}:00`);

  if (startDateTime >= endDateTime) {
    return { hasConflict: true, message: "End time must be after start time." };
  }

  if (req.systemCount > lab.capacity) {
    return { hasConflict: true, message: `Requested systems (${req.systemCount}) exceed lab capacity (${lab.capacity}).` };
  }

  const allBookings = await getAllBookings();
  const conflict = allBookings.find(b => {
    if (b.id === excludeBookingId) return false;
    if (b.labId !== req.labId) return false;

    // FIX: Cast status to string to prevent TS error if 'CANCELLED' is not in Booking type
    const status = b.status as string;
    if (status === 'REJECTED' || status === 'COMPLETED' || status === 'CANCELLED') return false;

    const existingStart = new Date(b.startTime);
    const existingEnd = new Date(b.endTime);

    return startDateTime < existingEnd && endDateTime > existingStart;
  });

  if (conflict) {
    return { hasConflict: true, message: `Conflict: Lab occupied by ${conflict.userName}.` };
  }

  return { hasConflict: false };
};

export const createBooking = async (req: BookingRequest, isOverride: boolean = false): Promise<Booking> => {
  if (!isOverride) {
    const conflict = await checkConflict(req);
    if (conflict.hasConflict) throw new Error(conflict.message);
  }

  const initialStatus = req.userRole === UserRole.ADMIN ? 'APPROVED' : 'PENDING';

  // FIX: Explicitly extract course/semester so they are saved to DB
  const userEmail = (req as any).userEmail || '';
  const course = (req as any).course || '';
  const semester = (req as any).semester || '';

  const bookingData = {
    labId: req.labId,
    userId: req.userId,
    userName: req.userName,
    userEmail: userEmail,
    subject: req.subject,

    // CRITICAL FIX: Saving these ensures Student Dashboard can filter for them
    course: course,
    semester: semester,

    date: req.date,
    startTime: new Date(`${req.date}T${req.startTime}:00`).toISOString(),
    endTime: new Date(`${req.date}T${req.endTime}:00`).toISOString(),
    status: initialStatus,
    type: 'EXTRA',
    systemCount: req.systemCount,
    purpose: req.subject,
    reminder: req.reminder,
    createdAt: new Date().toISOString(),
    logs: [createLogEntry(isOverride ? 'OVERRIDE' : 'CREATED', req.userId, req.userName, isOverride ? 'Admin forced booking' : 'Booking requested')]
  };

  const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), bookingData);

  if (initialStatus === 'PENDING') {
    await sendNotification('SYSTEM', 'ADMIN_GROUP', `New booking request from ${req.userName} for ${req.subject}.`, 'INFO');
  } else if (req.userRole === UserRole.ADMIN && req.userId !== 'a-demo') {
    await sendNotification('ADMIN', req.userId, `Admin booked "${req.subject}" for you.`, 'INFO');
  }

  return { id: docRef.id, ...bookingData } as unknown as Booking;
};

// --- MODIFICATION FUNCTIONS ---

export const updateBooking = async (bookingId: string, req: BookingRequest, editorId: string, editorName: string): Promise<Booking | null> => {
  const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
  const bookingSnap = await getDoc(bookingRef);

  if (!bookingSnap.exists()) return null;

  const oldBooking = bookingSnap.data() as Booking;

  const updates = {
    labId: req.labId,
    subject: req.subject,
    purpose: req.subject,
    date: req.date,
    startTime: new Date(`${req.date}T${req.startTime}:00`).toISOString(),
    endTime: new Date(`${req.date}T${req.endTime}:00`).toISOString(),
    systemCount: req.systemCount,
    reminder: req.reminder,
    // Ensure updates capture course/sem too if provided
    course: (req as any).course || oldBooking.course || '',
    semester: (req as any).semester || oldBooking.semester || '',
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

    // Mapped to REJECTED logic since 'CANCELLED' might not be in type
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

// --- NEW MANAGEMENT FUNCTIONS (For Admin Tables) ---

export const deleteBooking = async (id: string) => {
  try {
    await deleteDoc(doc(db, BOOKINGS_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting booking:", error);
    throw error;
  }
};

export const updateBookingStatus = async (id: string, status: 'APPROVED' | 'REJECTED' | 'CANCELLED') => {
  try {
    const bookingRef = doc(db, BOOKINGS_COLLECTION, id);
    await updateDoc(bookingRef, { status });
  } catch (error) {
    console.error("Error updating booking status:", error);
    throw error;
  }
};