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
  'Imprevistos', 'Otros', 'Sueldo', 'Negocio', 'Inversiones', 'Ahorro', 'Préstamo a mi favor'
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

async function classifyWithGemini(text: string, contextData: any) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Eres un asesor financiero inteligente. Tienes dos tareas:
1. Si el usuario reporta un movimiento de dinero (gasto, ingreso, guardar ahorro, retirar ahorro), clasifícalo.
2. Si el usuario te hace una pregunta sobre su estado financiero (ej: "¿cuánto dinero me queda?"), respóndele de forma natural usando su contexto real.

CONTEXTO FINANCIERO ACTUAL DEL USUARIO:
- Balance Disponible para gastar HOY: S/ ${contextData.available_balance}
- Ahorros actuales acumulados: S/ ${contextData.current_savings}
- Su Gran Meta de Ahorro: S/ ${contextData.savings_goal}

MENSAJE DEL USUARIO: "${text}"

Devuelve ÚNICAMENTE un objeto JSON con este esquema exacto (sin texto adicional ni formato markdown):
{
  "action": "record_transaction" o "answer_question",
  "reply": "Si action es answer_question, escribe aquí tu respuesta natural y directa. Si no, déjalo vacío.",
  "type": "Si action es record_transaction, pon uno de: expense (gasto normal), income (ingreso normal), savings_deposit (abonar a la meta de ahorro), savings_withdrawal (retirar del ahorro por emergencia).",
  "amount": número extraído (si aplica),
  "category": "Usa una de estas categorías exactas: ${CATEGORIES.join(', ')}",
  "description": "Descripción muy breve"
}`;

  const result = await model.generateContent(prompt);
  let responseText = result.response.text();
  
  // Limpieza robusta del JSON
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

        // 1. Obtener el contexto del usuario ANTES de llamar a Gemini
        const { data: contextData, error: contextError } = await supabase.rpc('get_financial_context_by_whatsapp', { p_phone: from });

        if (contextError || !contextData) {
          console.error("Usuario no encontrado:", contextError);
          await sendWhatsAppMessage(from, "❌ No encontré tu cuenta. Asegúrate de haberte registrado en la página web con tu número de WhatsApp exacto.");
          return new Response('OK', { status: 200 });
        }

        // 2. Llamar a Gemini inyectando el contexto real
        const classification = await classifyWithGemini(text, contextData);
        
        // 3. Evaluar el camino (Pregunta o Transacción)
        if (classification.action === 'answer_question') {
           await sendWhatsAppMessage(from, "🤖 " + classification.reply);
           return new Response('OK', { status: 200 });
        }

        // 4. Validaciones para que el usuario NO quede en negativo
        if (classification.type === 'savings_deposit' && classification.amount > contextData.available_balance) {
          await sendWhatsAppMessage(from, `❌ Movimiento denegado.\n\nEstás intentando guardar S/ ${classification.amount} en tu alcancía, pero tu balance disponible es de solo S/ ${contextData.available_balance}. ¡No puedes quedarte en números rojos!`);
          return new Response('OK', { status: 200 });
        }
        
        if (classification.type === 'savings_withdrawal' && classification.amount > contextData.current_savings) {
          await sendWhatsAppMessage(from, `❌ Movimiento denegado.\n\nEstás intentando retirar S/ ${classification.amount}, pero tu alcancía solo tiene S/ ${contextData.current_savings}.`);
          return new Response('OK', { status: 200 });
        }

        if (classification.type === 'expense' && classification.amount > contextData.available_balance) {
          await sendWhatsAppMessage(from, `❌ Gasto rechazado.\n\nTu gasto de S/ ${classification.amount} supera tu balance disponible (S/ ${contextData.available_balance}). ¡Cuidado con sobregirarte!`);
          return new Response('OK', { status: 200 });
        }

        // 5. Si pasa las validaciones, guardar transacción en DB
        const { error: insertError } = await supabase.from('transactions').insert({
          user_id: contextData.user_id,
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

        // Respuestas dinámicas según el tipo de movimiento
        if (classification.type === 'savings_deposit') {
          await sendWhatsAppMessage(from, `✅ ¡Perfecto! Recuerda guardar ese dinero en una cuenta aparte para que no tengas sorpresas en el futuro 🐷.\n\nAbono a tu ahorro registrado: S/ ${classification.amount}`);
        } else if (classification.type === 'savings_withdrawal') {
          await sendWhatsAppMessage(from, `⚠️ Retiro de emergencia registrado: S/ ${classification.amount}\nEse dinero ha vuelto a tu balance disponible para que puedas gastarlo.`);
        } else {
          const tipo = classification.type === 'expense' ? 'Gasto' : 'Ingreso';
          const icono = classification.type === 'expense' ? '📉' : '📈';
          await sendWhatsAppMessage(from, `✅ ¡Listo! ${icono} ${tipo} registrado:\n\n*Monto:* S/ ${classification.amount}\n*Categoría:* ${classification.category}\n*Descripción:* ${classification.description}\n\nRevisa tu Dashboard.`);
        }
      }
      return new Response('OK', { status: 200 })
    } catch (error) {
      console.error("ERROR CRITICO:", error)
      return new Response('OK', { status: 200 })
    }
  }

  return new Response('Method Not Allowed', { status: 405 })
})
