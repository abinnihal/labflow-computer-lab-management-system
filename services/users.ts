import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export const createUserProfile = async (
    uid: string,
    role: "student" | "faculty" | "admin",
    name: string
) => {
    await setDoc(doc(db, "users", uid), {
        role,
        name,
        createdAt: new Date(),
    });
};

export const getUserProfile = async (uid: string) => {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;
    return snap.data();
};
