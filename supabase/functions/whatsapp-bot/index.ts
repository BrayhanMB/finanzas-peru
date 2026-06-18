import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI, SchemaType } from "https://esm.sh/@google/generative-ai"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_TOKEN')!
const PHONE_NUMBER_ID = Deno.env.get('PHONE_NUMBER_ID')!
const VERIFY_TOKEN = Deno.env.get('VERIFY_TOKEN')!
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

const CATEGORIES = [
  'Alquiler', 'Servicios del Hogar', 'Internet y Celular', 'Suscripciones',
  'Mercado', 'Gustos / Antojos', 'Transporte', 'Cuidado personal',
  'Salud', 'Entretenimiento / Salidas', 'Pago de deuda', 'Mascotas',
  'Imprevistos', 'Otros', 'Sueldo', 'Negocio', 'Inversiones'
];

async function sendWhatsAppMessage(to: string, text: string) {
  const url = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      type: "text",
      text: { body: text }
    })
  });
  return response.json();
}

async function classifyWithGemini(text: string) {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          amount: { type: SchemaType.NUMBER, description: "El monto del gasto o ingreso" },
          type: { type: SchemaType.STRING, description: "Debe ser 'expense' para gastos o 'income' para ingresos" },
          category: { type: SchemaType.STRING, description: `Clasifica estrictamente en UNA de estas categorías exactas: ${CATEGORIES.join(', ')}` },
          description: { type: SchemaType.STRING, description: "Una breve descripción de 2 a 5 palabras" }
        },
        required: ["amount", "type", "category", "description"]
      }
    }
  });

  const prompt = `Eres un asistente financiero en Perú. El usuario envía un mensaje de voz/texto. 
Extrae los datos solicitados basándote en este mensaje: "${text}"`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  return JSON.parse(responseText);
}

serve(async (req) => {
  if (req.method === 'GET') {
    // WhatsApp Webhook Verification
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 })
    }
    return new Response('Forbidden', { status: 403 })
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json()
      
      // Extract message info from WhatsApp payload
      if (body.object && body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        const message = body.entry[0].changes[0].value.messages[0]
        const from = message.from // User's WhatsApp number (e.g. 51999888777)
        const text = message.text?.body

        if (!text) return new Response('OK', { status: 200 }) // Ignore non-text for now

        console.log(`Received message from ${from}: ${text}`)

        // 1. Classify text using Gemini
        const classification = await classifyWithGemini(text);
        
        // 2. Find User ID based on their WhatsApp number
        const { data: userId, error: userError } = await supabase.rpc('get_user_id_by_whatsapp', { phone: from });

        if (userError || !userId) {
          console.error("User not found or error:", userError);
          await sendWhatsAppMessage(from, "❌ No pude encontrar tu cuenta. Asegúrate de haber completado el Onboarding en la aplicación con tu número de WhatsApp.");
          return new Response('OK', { status: 200 });
        }

        // 3. Insert Transaction
        const { error: insertError } = await supabase.from('transactions').insert({
          user_id: userId,
          type: classification.type,
          amount: classification.amount,
          category: classification.category,
          description: classification.description
        });

        if (insertError) {
          console.error("Insert error:", insertError);
          await sendWhatsAppMessage(from, "❌ Hubo un error al guardar tu movimiento en la base de datos.");
          return new Response('OK', { status: 200 });
        }

        // 4. Success reply
        const tipo = classification.type === 'expense' ? 'Gasto' : 'Ingreso';
        const icono = classification.type === 'expense' ? '📉' : '📈';
        const successMsg = `✅ ¡Listo! ${icono} ${tipo} registrado:\n\n*Monto:* S/ ${classification.amount}\n*Categoría:* ${classification.category}\n*Descripción:* ${classification.description}\n\nRevisa tu Dashboard para ver tu nuevo balance.`;
        
        await sendWhatsAppMessage(from, successMsg);
      }
      
      return new Response('OK', { status: 200 })
    } catch (error) {
      console.error(error)
      return new Response('Error', { status: 500 })
    }
  }

  return new Response('Method Not Allowed', { status: 405 })
})
