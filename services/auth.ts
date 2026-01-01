import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./firebase";

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

import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

export const registerWithEmail = async (
    email: string,
    password: string
) => {
    const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
    );
    return userCredential.user;
};
