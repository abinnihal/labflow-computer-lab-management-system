import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { Subject } from '../types';

// 1. Get subjects a specific Faculty teaches
export const getFacultySubjects = async (facultyId: string) => {
    try {
        const q = query(collection(db, 'subjects'), where('facultyId', '==', facultyId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
    } catch (error) {
        console.error("Error fetching faculty subjects:", error);
        return [];
    }
};

// 2. Get subjects a Student is enrolled in (by their Semester)
export const getStudentSubjects = async (semester: string) => {
    try {
        const q = query(collection(db, 'subjects'), where('semester', '==', semester));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
    } catch (error) {
        console.error("Error fetching student subjects:", error);
        return [];
    }
};