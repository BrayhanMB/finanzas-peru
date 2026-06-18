import { GoogleGenerativeAI, SchemaType } from "https://esm.sh/@google/generative-ai@0.24.1"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

async function testGemini() {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: "Eres un experto asistente financiero en Perú. Tu única tarea es extraer datos financieros de mensajes de texto, identificando monto, tipo, categoría y descripción.",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            amount: { type: SchemaType.NUMBER, description: "Monto numérico extraído del mensaje" }
          },
          required: ["amount"]
        }
      }
    });

    const result = await model.generateContent(`Mensaje del usuario: "10"`);
    console.log(result.response.text());
  } catch (e) {
    console.error("Error:", e);
  }
}

testGemini();
