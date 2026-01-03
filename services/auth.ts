import {
    signInWithEmailAndPassword,
    signOut,
    createUserWithEmailAndPassword
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth } from "./firebase";
import { db } from "./firebase";

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

export const logout = async () => {
    await signOut(auth);
};

export const registerWithEmail = async (
    email: string,
    password: string,
    role: "student" | "faculty",
    extraData?: {
        name?: string;
        department?: string;
    }
) => {
    const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
    );

    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
        name: extraData?.name || "",
        email,
        role,
        status: "PENDING",
        department: extraData?.department || "",
        createdAt: new Date()
    });

    return user;
};
