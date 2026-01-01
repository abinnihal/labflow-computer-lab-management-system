
import { Lab, LabInventoryItem, RecurringSlot, TimeSlotRule } from '../types';
import { LABS as INITIAL_LABS } from '../constants';

// Initialize with constant infrastructure
let LABS_DATA: Lab[] = [...INITIAL_LABS.map(l => ({ ...l, inventory: [] }))];

// Mock Inventory - Empty for final output
if (LABS_DATA[0]) {
  LABS_DATA[0].inventory = [];
}

let RECURRING_SLOTS: RecurringSlot[] = [];

let SLOT_RULES: TimeSlotRule = {
  id: 'rules-1',
  startTime: '08:00',
  endTime: '18:00',
  slotDuration: 60,
  blackoutDates: []
};

// --- Lab CRUD ---
export const getAllLabs = (): Lab[] => {
  return LABS_DATA;
};

export const createLab = (lab: Omit<Lab, 'id'>): Lab => {
  const newLab = { ...lab, id: `l-${Date.now()}`, inventory: [] };
  LABS_DATA.push(newLab);
  return newLab;
};

export const updateLab = (id: string, updates: Partial<Lab>): Lab | null => {
  const idx = LABS_DATA.findIndex(l => l.id === id);
  if (idx !== -1) {
    LABS_DATA[idx] = { ...LABS_DATA[idx], ...updates };
    return LABS_DATA[idx];
  }
  return null;
};

export const deleteLab = (id: string): void => {
  LABS_DATA = LABS_DATA.filter(l => l.id !== id);
};

// --- Inventory ---
export const getLabInventory = (labId: string): LabInventoryItem[] => {
  const lab = LABS_DATA.find(l => l.id === labId);
  return lab?.inventory || [];
};

export const addInventoryItem = (labId: string, item: Omit<LabInventoryItem, 'id'>): void => {
  const lab = LABS_DATA.find(l => l.id === labId);
  if (lab) {
    if (!lab.inventory) lab.inventory = [];
    lab.inventory.push({ ...item, id: `inv-${Date.now()}` });
  }
};

export const removeInventoryItem = (labId: string, itemId: string): void => {
  const lab = LABS_DATA.find(l => l.id === labId);
  if (lab && lab.inventory) {
    lab.inventory = lab.inventory.filter(i => i.id !== itemId);
  }
};

// --- Rules & Slots ---
export const getRecurringSlots = (): RecurringSlot[] => {
  return RECURRING_SLOTS;
};

export const addRecurringSlot = (slot: Omit<RecurringSlot, 'id'>): void => {
  RECURRING_SLOTS.push({ ...slot, id: `rs-${Date.now()}` });
};

export const removeRecurringSlot = (id: string): void => {
  RECURRING_SLOTS = RECURRING_SLOTS.filter(s => s.id !== id);
};

export const getSlotRules = (): TimeSlotRule => {
  return SLOT_RULES;
};

export const updateSlotRules = (rules: Partial<TimeSlotRule>): void => {
  SLOT_RULES = { ...SLOT_RULES, ...rules };
};
