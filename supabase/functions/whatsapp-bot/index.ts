import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai"

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
  try {
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
    const json = await response.json();
    if (!response.ok) console.error("WhatsApp Error:", json);
    return json;
  } catch(e) {
    console.error("WhatsApp Fetch Error:", e);
  }
}

async function classifyWithGemini(text: string) {
  // Usamos gemini-2.5-flash que es el soportado por tu API Key actualmente (2026)
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Eres un asistente financiero rápido. Extrae los datos de este mensaje: "${text}"
Devuelve ÚNICAMENTE un objeto JSON con 4 campos exactos (sin explicaciones ni formato Markdown):
- "amount": número (el monto extraído)
- "type": "expense" o "income"
- "category": Usa una sola de estas categorías exactas: ${CATEGORIES.join(', ')}
- "description": Descripción breve`;

  const result = await model.generateContent(prompt);
  let responseText = result.response.text();
  
  // Limpieza robusta del JSON por si el modelo devuelve backticks
  responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(responseText);
}

serve(async (req) => {
  if (req.method === 'GET') {
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
      
      if (body.object && body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        const message = body.entry[0].changes[0].value.messages[0]
        const from = message.from
        const text = message.text?.body

        if (!text) return new Response('OK', { status: 200 })

        console.log(`Nuevo mensaje de ${from}: ${text}`)

        const classification = await classifyWithGemini(text);
        
        const { data: userId, error: userError } = await supabase.rpc('get_user_id_by_whatsapp', { p_phone: from });

        if (userError || !userId) {
          console.error("Usuario no encontrado:", userError);
          await sendWhatsAppMessage(from, "❌ No encontré tu cuenta. Asegúrate de haberte registrado en la página web con tu número de WhatsApp exacto.");
          return new Response('OK', { status: 200 });
        }

        const { error: insertError } = await supabase.from('transactions').insert({
          user_id: userId,
          type: classification.type,
          amount: classification.amount,
          category: classification.category,
          description: classification.description
        });

        if (insertError) {
          console.error("Error insertando en DB:", insertError);
          await sendWhatsAppMessage(from, "❌ Hubo un error guardando tu registro.");
          return new Response('OK', { status: 200 });
        }

        const tipo = classification.type === 'expense' ? 'Gasto' : 'Ingreso';
        const icono = classification.type === 'expense' ? '📉' : '📈';
        await sendWhatsAppMessage(from, `✅ ¡Listo! ${icono} ${tipo} registrado:\n\n*Monto:* S/ ${classification.amount}\n*Categoría:* ${classification.category}\n*Descripción:* ${classification.description}\n\nRevisa tu Dashboard.`);
      }
      return new Response('OK', { status: 200 })
    } catch (error) {
      console.error("ERROR CRITICO:", error)
      return new Response('OK', { status: 200 })
    }
  }

  return new Response('Method Not Allowed', { status: 405 })
})
