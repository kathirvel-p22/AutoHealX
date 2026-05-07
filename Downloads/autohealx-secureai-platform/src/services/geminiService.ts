import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

function getAI() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export async function analyzeIncident(logData: string) {
  const genAI = getAI();
  
  const prompt = `
    You are AutoHealX, an AI-driven Incident Response analyst. 
    Analyze the following system logs and provide a JSON response with:
    1. rootCause: A clear explanation of what went wrong.
    2. severity: One of ['low', 'medium', 'high', 'critical'].
    3. confidence: A number between 0 and 1.
    4. suggestedFix: A specific command or action to resolve the issue.
    5. riskLevel: One of ['low', 'medium', 'high'].

    Logs:
    ${logData}

    Return ONLY the JSON object.
  `;

  const response = await genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });
  
  const text = response.text || "{}";
  return JSON.parse(text);
}
