import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    updateDoc,
    doc,
    increment,
    deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { Material } from '../types';

const MATERIALS_COLLECTION = 'materials';

// Helper to clean data
const mapDocToMaterial = (doc: any): Material => ({ id: doc.id, ...doc.data() });

// 1. Upload New Material
export const addMaterial = async (data: Omit<Material, 'id' | 'createdAt' | 'downloadCount'>) => {
    const newMaterial = {
        ...data,
        downloadCount: 0,
        createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, MATERIALS_COLLECTION), newMaterial);
    return { id: docRef.id, ...newMaterial } as Material;
};

// 2. Get All Materials (Faculty View)
export const getMaterialsByFaculty = async (facultyId: string) => {
    const q = query(collection(db, MATERIALS_COLLECTION), where('uploadedBy', '==', facultyId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDocToMaterial).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// 3. Get Materials for Student (Filtered by Semester)
export const getMaterialsForStudent = async (semester: string) => {
    // In a real app, you might filter by 'batch' too.
    // For now, we fetch all and let the UI filter or fetch by Subject.
    const snapshot = await getDocs(collection(db, MATERIALS_COLLECTION));

    // Client-side filter for simplicity (Firestore 'array-contains' limits)
    const all = snapshot.docs.map(mapDocToMaterial);
    return all.filter(m => m.semester === semester || m.semester === 'ALL');
};

// 4. Track Downloads (Analytics)
export const incrementDownloadCount = async (materialId: string) => {
    const ref = doc(db, MATERIALS_COLLECTION, materialId);
    await updateDoc(ref, {
        downloadCount: increment(1)
    });
};

// 5. Delete Material
export const deleteMaterial = async (materialId: string) => {
    await deleteDoc(doc(db, MATERIALS_COLLECTION, materialId));
};