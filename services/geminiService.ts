import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Initialize Gemini
// Note: In a production app, never expose keys on the client. 
// This is for demonstration purposes using the environment variable injection.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateFabricAdvice = async (
  query: string, 
  history: string[] = []
): Promise<string> => {
  try {
    const modelId = 'gemini-2.5-flash'; 
    
    // Construct a context-aware prompt
    const systemInstruction = `You are Finovex's expert textile consultant. 
    You help wholesale customers choose threads, fabrics, and materials.
    Keep answers concise, professional, and helpful for bulk buyers.
    If asked about prices, give estimates but refer them to the catalog.
    Tone: Helpful, Sophisticated, Industrial knowledge.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: query,
      config: {
        systemInstruction,
      }
    });

    return response.text || "I apologize, I couldn't generate a response at this moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I am currently having trouble connecting to the textile database. Please try again later.";
  }
};