import {
    signInWithEmailAndPassword,
    signOut,
    createUserWithEmailAndPassword,
    updateProfile
} from "firebase/auth";
import { doc, setDoc, addDoc, collection } from "firebase/firestore";
import { auth, db } from "./firebase";
import { User, UserRole } from "../types";

// --- LOGIN ---
export const loginWithEmail = async (
    email: string,
    password: string
) => {
    const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
    );
    return userCredential.user;
};

// --- LOGOUT ---
export const logout = async () => {
    await signOut(auth);
};

// --- FACULTY REGISTRATION ---
export const registerFaculty = async (
    email: string,
    pass: string,
    name: string,
    facultyId: string,
    designation: string,
    selectedSemesters: string[],
    selectedSubjects: { name: string; code: string; semester: string }[],
    isClassAdvisor?: boolean,
    advisorSemester?: string
) => {
    // 1. Create Auth User
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;

    await updateProfile(user, { displayName: name });

    // 2. Create User Profile
    const userData: any = {
        uid: user.uid,
        id: user.uid,
        name,
        email,
        role: UserRole.FACULTY,
        status: 'PENDING',
        facultyId,
        designation,
        managedSemesters: selectedSemesters,
        createdAt: new Date().toISOString()
    };

    if (isClassAdvisor) userData.isClassAdvisor = isClassAdvisor;
    if (advisorSemester) userData.advisorSemester = advisorSemester;

    await setDoc(doc(db, 'users', user.uid), userData);

    // 3. Create Subject Documents
    const subjectPromises = selectedSubjects.map(sub => {
        return addDoc(collection(db, 'subjects'), {
            name: sub.name,
            code: sub.code,
            semester: sub.semester,
            facultyId: user.uid,
            facultyName: name,
            batchId: new Date().getFullYear().toString()
        });
    });

    await Promise.all(subjectPromises);

    return userData;
};

// --- STUDENT / GENERIC REGISTRATION ---
export const registerUser = async (
    userData: {
        email: string;
        name: string;
        role: UserRole;
        phone?: string;
        studentId?: string;
        programType?: string;
        course?: string;
        semester?: string;
        department?: string;
        avatarUrl?: string;
        idProofUrl?: string;
    },
    password?: string
) => {
    try {
        if (!password) throw new Error("Password is required for registration");

        // 1. Create Auth User
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: userData.name });

        // 2. Prepare Firestore Data
        const firestoreData: any = {
            uid: user.uid,
            id: user.uid,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            status: 'APPROVED',
            createdAt: new Date().toISOString(),
        };

        if (userData.phone) firestoreData.phone = userData.phone;
        if (userData.studentId) firestoreData.studentId = userData.studentId;
        if (userData.programType) firestoreData.programType = userData.programType;
        if (userData.course) firestoreData.course = userData.course;
        if (userData.semester) firestoreData.semester = userData.semester;
        if (userData.department) firestoreData.department = userData.department;
        if (userData.avatarUrl) firestoreData.avatarUrl = userData.avatarUrl;
        if (userData.idProofUrl) firestoreData.idProofUrl = userData.idProofUrl;

        // 3. Save to Firestore
        await setDoc(doc(db, "users", user.uid), firestoreData);

        return firestoreData;
    } catch (error) {
        console.error("Error in registerUser:", error);
        throw error;
    }
};

// --- [FIX] BACKWARD COMPATIBILITY ---
// This function was missing, causing userService.ts to crash.
export const registerWithEmail = async (
    email: string,
    password: string,
    role: UserRole,
    extraData?: any
) => {
    // We map the old style call to the new registerUser function
    return registerUser({
        email,
        name: extraData?.name || '',
        role,
        ...extraData
    }, password);
};