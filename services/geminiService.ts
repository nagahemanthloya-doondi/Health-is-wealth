import { GoogleGenAI, Type } from "@google/genai";
import { HealthyReport } from "../types";

const PRODUCT_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    productName: { type: Type.STRING },
    barcode: { type: Type.STRING, nullable: true },
    score: { type: Type.NUMBER, description: "Health score from 0 (worst) to 100 (best)" },
    sugar_g: { type: Type.NUMBER, nullable: true, description: "Total sugar in grams per serving" },
    protein_g: { type: Type.NUMBER, nullable: true, description: "Total protein in grams per serving" },
    ingredients: { 
      type: Type.ARRAY, 
      items: { 
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          risk: { type: Type.STRING, enum: ["SAFE", "CAUTION", "DANGER"] },
          reason: { type: Type.STRING, nullable: true, description: "Why is it dangerous or caution?" }
        },
        required: ["name", "risk"]
      },
      description: "List of main ingredients with health risk assessment"
    },
    nutritional_analysis: { type: Type.STRING, description: "A short, punchy paragraph analyzing the health benefits and risks." },
    verdict: { type: Type.STRING, description: "A one or two word neo-brutalist style verdict (e.g. 'PURE TRASH', 'GOLD TIER', 'MID', 'POISON')." }
  },
  required: ["productName", "score", "ingredients", "nutritional_analysis", "verdict"]
};

// Simplified JSON parser since we are using responseSchema now
const parseJSON = (text: string): HealthyReport => {
  try {
    return JSON.parse(text) as HealthyReport;
  } catch (e) {
    console.error("Failed to parse JSON directly:", e);
    // Fallback cleanup if model decides to wrap in markdown despite schema
    const match = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    if (match) {
      try {
        return JSON.parse(match[1]) as HealthyReport;
      } catch (e2) {
        throw new Error("Invalid JSON format");
      }
    }
    // Try to find first { and last }
    const firstOpen = text.indexOf('{');
    const lastClose = text.lastIndexOf('}');
    if (firstOpen !== -1 && lastClose !== -1) {
       return JSON.parse(text.substring(firstOpen, lastClose + 1));
    }
    throw new Error("Could not parse response");
  }
};

const SYSTEM_INSTRUCTION = "You are the 'HealthyInformer'. You are a neo-brutalist nutritionist. You do not sugarcoat. You value high protein and low processed sugar. Your verdicts are short, loud, and aggressive. For ingredients, you must classify them as SAFE, CAUTION (for mild additives/sugar), or DANGER (for harmful chemicals, trans fats, high fructose corn syrup).";

export const analyzeProductImage = async (apiKey: string, base64Image: string, offContext?: string | null): Promise<HealthyReport> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    
    let prompt = `Analyze this product image.
    1. Identify the product name.
    2. List main ingredients and classify their risk (SAFE/CAUTION/DANGER).
    3. Calculate a health score (0-100) based on sugar, additives, and nutritional value. Be harsh.
    4. Provide a brutal, honest verdict.`;

    if (offContext) {
      prompt = `I have scanned this product's barcode and retrieved the following data from Open Food Facts:
      ${offContext}
      
      Using the image for visual confirmation and the DATA provided above for accuracy:
      1. Analyze the ingredients and nutritional values from the data.
      2. List ingredients and classify their risk (SAFE/CAUTION/DANGER).
      3. Calculate a health score (0-100).
      4. Provide a brutal, honest verdict.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: PRODUCT_ANALYSIS_SCHEMA,
        systemInstruction: SYSTEM_INSTRUCTION
      }
    });

    const outputText = response.text || "";
    if (!outputText) throw new Error("No data returned from Gemini");
    
    return parseJSON(outputText);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze product. Please try again.");
  }
};

export const analyzeProductText = async (apiKey: string, text: string): Promise<HealthyReport> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [{ text: `Analyze this product text/name: "${text}". Infer nutritional data, list ingredients with risk (SAFE/CAUTION/DANGER), score it 0-100, and give a brutal verdict.` }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: PRODUCT_ANALYSIS_SCHEMA,
        systemInstruction: SYSTEM_INSTRUCTION
      }
    });

    const outputText = response.text || "";
    if (!outputText) throw new Error("No data returned from Gemini");
    
    return parseJSON(outputText);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze text. Please try again.");
  }
};