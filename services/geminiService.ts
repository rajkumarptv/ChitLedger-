
import { GoogleGenAI, Type } from "@google/genai";
import { AppData } from "../types";

export const getAIInsights = async (data: AppData) => {
  // Initialize the Google GenAI client with the API key from environment variables.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const paymentMethodsUsed = data.payments
    .filter(p => p.status === 'PAID')
    .map(p => p.method)
    .reduce((acc, method) => {
      if (method) acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  // Fixed property access: using correct fields from ChitConfig interface.
  const prompt = `
    Analyze this chit fund data and provide a collection summary, risk assessment, and actionable advice.
    
    Chit Fund Configuration:
    - Name: ${data.config.name}
    - Total Value: ${data.config.totalChitValue}
    - Monthly Collection per Member: ${data.config.fixedMonthlyCollection}
    - Duration: ${data.config.durationMonths} months
    
    Members: ${data.members.map(m => m.name).join(', ')}
    
    Payment Stats:
    - Recorded Payments: ${data.payments.length}
    - Paid: ${data.payments.filter(p => p.status === 'PAID').length}
    - Pending: ${data.payments.filter(p => p.status === 'PENDING').length}
    - Methods Used: ${JSON.stringify(paymentMethodsUsed)}
    
    Please return a structured JSON response with:
    - summary: A brief summary of current collection status and payment method trends (e.g., if most people use GPay).
    - risks: List of specific risks found (if any).
    - advice: List of 3 actionable steps for the manager to improve collections or optimize for the preferred payment methods.
  `;

  try {
    // Generate content using the recommended Gemini 3 Flash model for text summary tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            risks: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            advice: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["summary", "risks", "advice"]
        }
      }
    });

    // Extract text from response. Note: .text is a property, not a method.
    return JSON.parse(response.text || '{}');
  } catch (error: any) {
    if (error.name === 'AbortError' || error.message?.includes('aborted') || error.code === 'cancelled') {
      return { summary: "", risks: [], advice: [] };
    }
    console.error("AI Insight Error:", error);
    return {
      summary: "Unable to generate insights at this moment.",
      risks: ["System connection error"],
      advice: ["Check your internet connection", "Try again later", "Verify API key status"]
    };
  }
};
