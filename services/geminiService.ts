import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
// NOTE: In a real production app, this key should be proxied through a backend
// to avoid exposing it to the client. For this demo, we assume process.env.API_KEY is available.
const apiKey = process.env.API_KEY || ''; 
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const sendMessageToGemini = async (message: string, systemInstruction?: string): Promise<string> => {
  if (!ai) {
    // Fallback if no API key is present for the demo
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("I'm the Lab Assistant AI. To enable my full capabilities, please configure the `API_KEY` in the environment. For now, I can tell you that the labs are open from 8 AM to 6 PM.");
      }, 1000);
    });
  }

  try {
    const model = 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
      model: model,
      contents: message,
      config: {
        systemInstruction: systemInstruction || "You are a helpful Lab Assistant for a Computer Lab Management System. Help students and faculty with scheduling, technical issues, and general inquiries.",
      }
    });
    
    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I'm having trouble connecting to the AI service right now.";
  }
};