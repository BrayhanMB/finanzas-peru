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

async function getWhatsAppMedia(mediaId: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    // 1. Obtener la URL del archivo multimedia de WhatsApp
    const mediaUrlRes = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      }
    });
    const mediaData = await mediaUrlRes.json();
    if (!mediaData.url) {
      console.error("No se pudo obtener URL multimedia:", mediaData);
      return null;
    }

    // 2. Descargar los bytes de la imagen
    const fileRes = await fetch(mediaData.url, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      }
    });
    const arrayBuffer = await fileRes.arrayBuffer();
    const mimeType = mediaData.mime_type || 'image/jpeg';
    
    // Convertir a base64 (Deno compatible)
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);

    return { base64, mimeType };
  } catch (err) {
    console.error("Error descargando media de WhatsApp:", err);
    return null;
  }
}

async function classifyImageWithGemini(imageBase64: string, mimeType: string, caption: string | undefined, contextData: any) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Eres un asesor financiero inteligente y extractor experto de comprobantes bancarios, billeteras digitales (Yape, Plin, transferencias BCP, BBVA, Interbank, etc.).
El usuario acaba de enviar una imagen/captura de pantalla (probablemente una constancia de Yape, Plin o pago).

CONTEXTO FINANCIERO ACTUAL DEL USUARIO:
- Balance Disponible para gastar HOY: S/ ${contextData.available_balance}
- Ahorros actuales acumulados: S/ ${contextData.current_savings}
- Su Gran Meta de Ahorro: S/ ${contextData.savings_goal}
- Gastos por categoría ESTE MES: ${JSON.stringify(contextData.expenses_by_category_this_month)}

TEXTO / COMENTARIO ADJUNTO DEL USUARIO (si hay): "${caption || ''}"

INSTRUCCIONES DE EXTRACCIÓN:
1. Revisa detenidamente la imagen. Identifica si es un comprobante de Yape o pago similar:
   - Identifica el MONTO exacto (ejemplo: S/ 15.00, 25, 4.50).
   - Identifica si es un GASTO / ENVÍO ("¡Yapeaste!", "Enviaste a...", "Pago realizado") o un INGRESO / RECEPCIÓN ("Te yapearon", "Recibiste").
   - Identifica el destinatario o concepto ("A Juan Perez", mensaje de nota, etc.).
   - Asigna la CATEGORÍA más apropiada entre: ${CATEGORIES.join(', ')}. Si en la nota o destinatario dice comida, mercado, taxi, etc., úsalo. Si no es claro el rubro específico, clasifícalo en "Otros" o "Gustos / Antojos" o lo que mejor calce.
   - Si el usuario colocó un comentario adjunto (caption), úsalo como prioridad para la categoría o descripción.
2. Si la imagen NO es un comprobante de pago o no se reconoce monto alguno:
   - "action": "not_receipt"
   - "reply": "Mensaje corto indicando que no se pudo detectar un comprobante o monto claro."

Devuelve ÚNICAMENTE un objeto JSON válido (sin formato markdown ni texto adicional):
{
  "action": "record_transaction" o "not_receipt",
  "reply": "Si action es not_receipt, explica brevemente qué pasó.",
  "type": "expense" (si yapeó / pagó) o "income" (si recibió dinero / le yapearon),
  "amount": número extraído (ej: 15.50),
  "category": "Una de: ${CATEGORIES.join(', ')}",
  "description": "Breve detalle (ej: Yape a Carlos / Almuerzo)"
}`;

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType: mimeType
    }
  };

  const result = await model.generateContent([prompt, imagePart]);
  let responseText = result.response.text();
  responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(responseText);
}

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

  const prompt = `Eres un asesor financiero inteligente, directo y conciso. Tienes tres tareas principales:
1. Si el usuario reporta un movimiento de dinero (gasto, ingreso, guardar ahorro, retirar ahorro), clasifícalo.
2. Si el usuario hace una pregunta analítica sobre sus gastos (ej: "¿en qué gasté más este mes?"), responde usando la data exacta del contexto.
3. AL DAR CONSEJOS: Sé directo, corto y claro. Tu objetivo es crear consciencia financiera. Hazle notar si está gastando mucho en cosas innecesarias para evitar que llegue a fin de mes ajustado. No uses rodeos ni textos largos.

CONTEXTO FINANCIERO ACTUAL DEL USUARIO:
- Balance Disponible para gastar HOY: S/ ${contextData.available_balance}
- Ahorros actuales acumulados: S/ ${contextData.current_savings}
- Su Gran Meta de Ahorro: S/ ${contextData.savings_goal}
- Gastos por categoría ESTE MES: ${JSON.stringify(contextData.expenses_by_category_this_month)}

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
        const messageType = message.type
        const text = message.text?.body
        const image = message.image

        if (!text && !image) return new Response('OK', { status: 200 })

        console.log(`Nuevo mensaje de ${from}. Tipo: ${messageType}`)

        // 1. Obtener el contexto del usuario ANTES de llamar a Gemini
        const { data: contextData, error: contextError } = await supabase.rpc('get_financial_context_by_whatsapp', { p_phone: from });

        if (contextError || !contextData) {
          console.error("Usuario no encontrado:", contextError);
          await sendWhatsAppMessage(from, "❌ No encontré tu cuenta. Asegúrate de haberte registrado en la página web con tu número de WhatsApp exacto.");
          return new Response('OK', { status: 200 });
        }

        // Interceptor de Bienvenida para usuarios nuevos (solo si es texto)
        if (text && (text.toLowerCase().includes('nuevo por aquí') || text.toLowerCase().includes('nuevo por aqui'))) {
          await sendWhatsAppMessage(from, "¡Hola! Soy Pingu 🐧, tu asistente financiero. Ya tengo tu cuenta configurada. A partir de ahora, cada vez que gastes, ganes o ahorres dinero, cuéntamelo por aquí o envíame la captura de tu Yape / Plin 📲 ¡Yo me encargo de registrarlo!");
          return new Response('OK', { status: 200 });
        }

        let classification: any;

        // 2. Procesamiento según el tipo de mensaje: Imagen (Yape/Comprobante) o Texto
        if (image) {
          console.log(`Procesando imagen ID: ${image.id}`);
          const media = await getWhatsAppMedia(image.id);
          if (!media) {
            await sendWhatsAppMessage(from, "❌ No pude descargar la imagen enviada. Por favor, intenta enviarla de nuevo.");
            return new Response('OK', { status: 200 });
          }

          classification = await classifyImageWithGemini(media.base64, media.mimeType, image.caption, contextData);

          if (classification.action === 'not_receipt') {
            await sendWhatsAppMessage(from, `🤖 ${classification.reply || "No logré identificar los datos de un pago en esta imagen. Asegúrate de que se vea nítido el monto y destinatario."}`);
            return new Response('OK', { status: 200 });
          }
        } else {
          // Procesamiento de mensaje de texto habitual
          classification = await classifyWithGemini(text, contextData);
          
          // Evaluar camino de pregunta analítica
          if (classification.action === 'answer_question') {
             await sendWhatsAppMessage(from, "🤖 " + classification.reply);
             return new Response('OK', { status: 200 });
          }
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
