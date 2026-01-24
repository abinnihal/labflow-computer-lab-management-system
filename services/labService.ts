import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { Lab, LabInventoryItem, RecurringSlot, TimeSlotRule } from '../types';
import { LABS as DEFAULT_LABS } from '../constants';

const LABS_COLLECTION = 'labs';
const SETTINGS_COLLECTION = 'settings';
const RULES_DOC_ID = 'slot_rules';

// --- LABS CRUD ---

export const getAllLabs = async (): Promise<Lab[]> => {
  try {
    const snapshot = await getDocs(collection(db, LABS_COLLECTION));
    if (snapshot.empty) {
      // Optional: Seed if empty
      return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lab));
  } catch (error) {
    console.error("Error getting labs:", error);
    return [];
  }
};

export const createLab = async (lab: Omit<Lab, 'id'>): Promise<Lab> => {
  const docRef = await addDoc(collection(db, LABS_COLLECTION), {
    ...lab,
    inventory: [] // Initialize empty inventory
  });
  return { id: docRef.id, ...lab, inventory: [] };
};

export const updateLab = async (id: string, updates: Partial<Lab>): Promise<void> => {
  const labRef = doc(db, LABS_COLLECTION, id);
  await updateDoc(labRef, updates);
};

export const deleteLab = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, LABS_COLLECTION, id));
};

// --- INVENTORY MANAGEMENT (Stored as array in Lab Document) ---

export const getLabInventory = async (labId: string): Promise<LabInventoryItem[]> => {
  const labRef = doc(db, LABS_COLLECTION, labId);
  const snap = await getDoc(labRef);
  if (snap.exists()) {
    const data = snap.data() as Lab;
    return data.inventory || [];
  }
  return [];
};

export const addInventoryItem = async (labId: string, item: Omit<LabInventoryItem, 'id'>): Promise<void> => {
  const labRef = doc(db, LABS_COLLECTION, labId);
  const snap = await getDoc(labRef);

  if (snap.exists()) {
    const lab = snap.data() as Lab;
    const currentInv = lab.inventory || [];
    const newItem = { ...item, id: `inv-${Date.now()}` };

    await updateDoc(labRef, {
      inventory: [...currentInv, newItem]
    });
  }
};

export const removeInventoryItem = async (labId: string, itemId: string): Promise<void> => {
  const labRef = doc(db, LABS_COLLECTION, labId);
  const snap = await getDoc(labRef);

  if (snap.exists()) {
    const lab = snap.data() as Lab;
    const currentInv = lab.inventory || [];
    const updatedInv = currentInv.filter(i => i.id !== itemId);

    await updateDoc(labRef, { inventory: updatedInv });
  }
};

// --- RULES & SLOTS (Mock/Local Storage for now to save complexity) ---
// Note: In a full production app, these should also be in Firestore.
// We will use a simple local variable for the demo session or fetch from a 'settings' collection.

let LOCAL_SLOTS: RecurringSlot[] = [];
let LOCAL_RULES: TimeSlotRule = {
  id: 'default',
  startTime: '09:00',
  endTime: '17:00',
  slotDuration: 60,
  blackoutDates: []
};

export const getRecurringSlots = (): RecurringSlot[] => {
  return LOCAL_SLOTS;
};

export const addRecurringSlot = (slot: Omit<RecurringSlot, 'id'>): void => {
  LOCAL_SLOTS.push({ ...slot, id: `slot-${Date.now()}` });
};

export const removeRecurringSlot = (id: string): void => {
  LOCAL_SLOTS = LOCAL_SLOTS.filter(s => s.id !== id);
};

export const getSlotRules = (): TimeSlotRule => {
  return LOCAL_RULES;
};

export const updateSlotRules = (rules: Partial<TimeSlotRule>): void => {
  LOCAL_RULES = { ...LOCAL_RULES, ...rules };
};