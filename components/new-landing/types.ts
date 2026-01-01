export enum ModuleRole {
  STUDENT = 'Student Module',
  FACULTY = 'Faculty Module',
  ADMIN = 'Admin Module'
}

export interface ModuleDetails {
  role: ModuleRole;
  description: string;
  features: string[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface TechItem {
  category: string;
  stack: string;
}
