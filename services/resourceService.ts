import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';

// --- CONFIGURATION ---
// Replace these with your actual Cloudinary details
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/ddihd0l4n/auto/upload";
const UPLOAD_PRESET = "labflow_upload";

// --- TYPE DEFINITION ---
export interface ResourceFile {
    id: string;
    title: string;
    description: string;
    subjectId: string;
    subjectName: string;
    semester: string;
    type: 'PDF' | 'IMAGE' | 'LINK' | 'OTHER';
    url: string;
    uploadedBy: string;
    uploadedAt: string;
}

// --- HELPER: Upload to Cloudinary ---
const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    // Optional: Organize files by folder in Cloudinary
    formData.append('folder', 'labflow_resources');

    try {
        const response = await fetch(CLOUDINARY_URL, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Upload failed");
        }

        const data = await response.json();
        return data.secure_url; // This is the URL we save to Firestore
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        throw error;
    }
};

// --- 1. UPLOAD RESOURCE (Faculty) ---
export const uploadResource = async (
    file: File,
    metadata: {
        title: string;
        description: string;
        subjectId: string;
        subjectName: string;
        semester: string;
        uploadedBy: string;
    }
) => {
    try {
        // 1. Upload File to Cloudinary
        const downloadUrl = await uploadToCloudinary(file);

        // 2. Determine File Type
        let fileType: ResourceFile['type'] = 'OTHER';
        if (file.type.includes('pdf')) fileType = 'PDF';
        else if (file.type.includes('image')) fileType = 'IMAGE';

        // 3. Save Metadata to Firestore
        const docData = {
            ...metadata,
            type: fileType,
            url: downloadUrl,
            uploadedAt: new Date().toISOString(),
            // Note: We don't save storagePath anymore since it's not in Firebase Storage
        };

        const docRef = await addDoc(collection(db, 'resources'), docData);
        return { id: docRef.id, ...docData };

    } catch (error) {
        console.error("Error uploading resource:", error);
        throw error;
    }
};

// --- 2. FETCH RESOURCES (Student) ---
export const getResourcesBySubject = async (semester: string, subjectId?: string) => {
    try {
        const resourcesRef = collection(db, 'resources');
        let q;

        if (subjectId && subjectId !== 'ALL') {
            q = query(
                resourcesRef,
                where('subjectId', '==', subjectId),
                orderBy('uploadedAt', 'desc')
            );
        } else {
            q = query(
                resourcesRef,
                where('semester', '==', semester),
                orderBy('uploadedAt', 'desc')
            );
        }

        const snapshot = await getDocs(q);
        // Use 'as any' to avoid spread type errors
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as ResourceFile));

    } catch (error) {
        console.error("Error fetching resources:", error);
        return [];
    }
};

// --- 3. DELETE RESOURCE (Faculty) ---
export const deleteResource = async (resourceId: string, _storagePath?: string) => {
    try {
        // NOTE: We cannot easily delete from Cloudinary using client-side code 
        // without a secure backend signature. 
        // For now, we only remove the link from Firestore. The file stays in Cloudinary.

        // 1. Delete from Firestore
        await deleteDoc(doc(db, 'resources', resourceId));
        return true;
    } catch (error) {
        console.error("Error deleting resource:", error);
        throw error;
    }
};