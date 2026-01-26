import { GoogleGenerativeAI } from "@google/generative-ai";
import { ACADEMIC_SYSTEM_PROMPT } from '../constants';

// Access the key safely from .env
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

let model: any = null;

if (apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  // Using 'gemini-1.5-flash' because it is free, fast, and good at following instructions
  model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: ACADEMIC_SYSTEM_PROMPT
  });
}

export const sendMessageToAI = async (message: string): Promise<string> => {
  // 1. Safety Check: If no key or model, return fallback immediately.
  if (!model) {
    console.warn("AI Key missing or model not initialized.");
    return "⚠️ System Mode: AI is currently offline. Please refer to your Lab Manual for assistance.";
  }

  try {
    // 2. The Real Call
    const result = await model.generateContent(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI Service Error:", error);
    return "I'm having trouble connecting to the knowledge base right now. Please consult your Faculty supervisor.";
  }
};