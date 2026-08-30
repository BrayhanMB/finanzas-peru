import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') ?? ''
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? ''

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Obtener todas las integraciones activas
    const { data: integrations, error: intError } = await supabaseClient
      .from('user_integrations')
      .select('*')
      .eq('provider', 'google')

    if (intError) throw intError

    let totalProcessed = 0;

    for (const integration of integrations) {
      const { user_id, refresh_token } = integration

      // 2. Obtener nuevo Access Token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: refresh_token,
          grant_type: 'refresh_token'
        })
      })

      if (!tokenRes.ok) {
        console.error(`Error refrescando token para user ${user_id}`)
        continue
      }

      const tokenData = await tokenRes.json()
      const accessToken = tokenData.access_token

      // 3. Buscar correos recientes (últimas 24h) de bancos
      const query = "from:(yape@bcp.com.pe OR notificaciones@bcp.com.pe OR viabcp.com OR bbva) newer_than:1d"
      const mailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })

      if (!mailRes.ok) continue

      const mailData = await mailRes.json()
      const messages = mailData.messages || []

      for (const msg of messages) {
        // Verificar si ya fue procesado
        const { data: existingLog } = await supabaseClient
          .from('email_sync_logs')
          .select('message_id')
          .eq('message_id', msg.id)
          .single()

        if (existingLog) continue; // Ya procesamos este correo

        // Obtener detalles del correo
        const msgDetailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        const msgDetail = await msgDetailRes.json()

        const subjectHeader = msgDetail.payload?.headers?.find((h: any) => h.name === 'Subject')
        const fromHeader = msgDetail.payload?.headers?.find((h: any) => h.name === 'From')
        
        const subject = subjectHeader ? subjectHeader.value : ''
        const sender = fromHeader ? fromHeader.value : ''
        
        // Extraer texto (puede estar en parts o body)
        let body_text = ''
        if (msgDetail.payload?.parts) {
          const textPart = msgDetail.payload.parts.find((p: any) => p.mimeType === 'text/plain')
          if (textPart && textPart.body?.data) {
            body_text = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'))
          }
        } else if (msgDetail.payload?.body?.data) {
          body_text = atob(msgDetail.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))
        }

        // ==========================================
        // LÓGICA DE PARSEO (Reutilizada)
        // ==========================================
        let amount = 0;
        let description = '';
        let category = 'Otros';
        const textToParse = `${subject} ${body_text}`.toLowerCase();

        if (sender.includes('yape') || textToParse.includes('yapeaste')) {
          const amountMatch = textToParse.match(/s\/\s*(\d+(?:,\d+)*(?:\.\d+)?)/);
          if (amountMatch) amount = parseFloat(amountMatch[1].replace(',', ''));
          const nameMatch = textToParse.match(/a\s+([a-záéíóúñ\s]+)\s+el/i) || textToParse.match(/yapeaste.*?a\s+([a-záéíóúñ\s]+)/i);
          description = nameMatch ? `Yape a ${nameMatch[1].trim()}`.substring(0, 50) : 'Pago con Yape';
          category = 'Transferencias';
        }
        else if (sender.includes('bcp') || sender.includes('viabcp')) {
          const amountMatch = textToParse.match(/s\/\s*(\d+(?:,\d+)*(?:\.\d+)?)/) || textToParse.match(/monto:\s*s\/\s*(\d+(?:,\d+)*(?:\.\d+)?)/);
          if (amountMatch) amount = parseFloat(amountMatch[1].replace(',', ''));
          if (textToParse.includes('consumo') || textToParse.includes('compra')) {
            description = 'Consumo BCP'; category = 'Gastos Varios';
          } else if (textToParse.includes('transferencia')) {
            description = 'Transferencia BCP'; category = 'Transferencias';
          } else {
            description = 'Movimiento BCP';
          }
        }
        else if (sender.includes('bbva')) {
          const amountMatch = textToParse.match(/s\/\s*(\d+(?:,\d+)*(?:\.\d+)?)/) || textToParse.match(/importe:\s*s\/\s*(\d+(?:,\d+)*(?:\.\d+)?)/);
          if (amountMatch) amount = parseFloat(amountMatch[1].replace(',', ''));
          description = textToParse.includes('cargo') ? 'Cargo BBVA' : 'Movimiento BBVA';
          category = 'Gastos Varios';
        }

        if (amount > 0) {
          // Insertar transacción
          await supabaseClient.from('transactions').insert([{
            user_id: user_id,
            type: 'expense',
            amount: amount,
            category: category,
            description: description + ' (Auto)'
          }])
          totalProcessed++;
        }

        // Marcar como procesado independientemente de si hubo monto, para no volver a leerlo
        await supabaseClient.from('email_sync_logs').insert([{
          message_id: msg.id,
          user_id: user_id
        }])
      }
    }

    return new Response(JSON.stringify({ success: true, processed: totalProcessed }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
