import {
    collection, addDoc, deleteDoc, doc, getDocs, query, where
} from 'firebase/firestore';
import { db } from './firebase';
import { TimeTableSlot } from '../types';

const TIMETABLE_COLLECTION = 'timetable';

// --- ADMIN: Create Slot ---
export const saveTimeTableSlot = async (slot: Omit<TimeTableSlot, 'id'>) => {
    const docRef = await addDoc(collection(db, TIMETABLE_COLLECTION), slot);
    return { id: docRef.id, ...slot };
};

// --- ADMIN: Delete Slot ---
export const deleteTimeTableSlot = async (slotId: string) => {
    await deleteDoc(doc(db, TIMETABLE_COLLECTION, slotId));
};

// --- STUDENT: Get My Class Schedule ---
export const getClassSchedule = async (course: string, semester: string) => {
    // Guard clause to prevent empty queries
    if (!course || !semester) return [];

    const q = query(
        collection(db, TIMETABLE_COLLECTION),
        where('course', '==', course),
        where('semester', '==', semester)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimeTableSlot));
};

// --- FACULTY: Get My Teaching Schedule ---
export const getFacultySchedule = async (facultyId: string) => {
    if (!facultyId) return [];

    const q = query(
        collection(db, TIMETABLE_COLLECTION),
        where('facultyId', '==', facultyId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimeTableSlot));
};

// --- SMART CHECK-IN LOGIC ---
export const getCurrentLabSession = async (course: string, semester: string): Promise<TimeTableSlot | null> => {
    if (!course || !semester) return null;

    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[now.getDay()];

    // Convert current time to minutes (e.g. 09:30 = 570)
    const currentVal = now.getHours() * 60 + now.getMinutes();

    // Fetch today's classes for this specific course/sem
    const q = query(
        collection(db, TIMETABLE_COLLECTION),
        where('course', '==', course),
        where('semester', '==', semester),
        where('dayOfWeek', '==', currentDay)
    );

    const snapshot = await getDocs(q);
    const todaysSlots = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TimeTableSlot));

    // Find the slot that is happening RIGHT NOW
    return todaysSlots.find(slot => {
        const [startH, startM] = slot.startTime.split(':').map(Number);
        const [endH, endM] = slot.endTime.split(':').map(Number);

        const startVal = startH * 60 + startM;
        const endVal = endH * 60 + endM;

        // Allow check-in 15 mins before start until end
        return currentVal >= (startVal - 15) && currentVal < endVal;
    }) || null;
};