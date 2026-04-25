import { GoogleGenAI } from "@google/genai";
import { Employee } from "../types";

// Always use process.env.GEMINI_API_KEY for the Gemini API.
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateLifecycleSummary(employees: Employee[]) {
  try {
    if (!process.env.GEMINI_API_KEY) return "AI Insights unavailable. Please configure API Key.";

    const prompt = `
      Analyze the following employee lifecycle data for a global marketing company. 
      Identify:
      1. Key BGV SLA breaches (Overdue status).
      2. Training compliance gaps (specifically Gemini and AI Ethics).
      3. Regional hotspots where attrition risk (flight_risk) is high.
      
      Data Summary:
      ${JSON.stringify(employees.map(e => ({ 
        name: `${e.firstname} ${e.lastname}`,
        country: e.country,
        bgv: e.bgv_status,
        compliance: e.compliance_pct,
        risk: e.flight_risk
      })))}

      Format the response as a bulleted report suitable for a dashboard "AI Insight" panel. 
      Be concise and professional. Use emojis for categories.
    `;

    const result = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    return result.text || "No insights generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating AI report. Please try again later.";
  }
}
