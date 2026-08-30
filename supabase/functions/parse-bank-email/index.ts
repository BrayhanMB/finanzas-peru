import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get('user_id')

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing user_id parameter' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const { sender, subject, body_text } = await req.json()

    if (!sender || !body_text) {
      return new Response(JSON.stringify({ error: 'Missing sender or body_text' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Inicializar cliente de Supabase (Service Role para poder insertar)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let amount = 0;
    let description = '';
    let category = 'Otros'; // Categoría por defecto
    let type = 'expense';
    let bank = '';

    const textToParse = `${subject} ${body_text}`.toLowerCase();

    // ==========================================
    // PARSER: YAPE
    // ==========================================
    if (sender.includes('yape') || textToParse.includes('yapeaste')) {
      bank = 'Yape';
      // Extraer monto: "S/ 15.00" o "S/15.00"
      const amountMatch = textToParse.match(/s\/\s*(\d+(?:,\d+)*(?:\.\d+)?)/);
      if (amountMatch) {
        amount = parseFloat(amountMatch[1].replace(',', ''));
      }
      
      // Intentar extraer el nombre del destinatario ("a Maria Perez")
      const nameMatch = textToParse.match(/a\s+([a-záéíóúñ\s]+)\s+el/i) || textToParse.match(/yapeaste.*?a\s+([a-záéíóúñ\s]+)/i);
      if (nameMatch) {
        description = `Yape a ${nameMatch[1].trim()}`.substring(0, 50);
      } else {
        description = 'Pago con Yape';
      }
      category = 'Transferencias';
    }
    // ==========================================
    // PARSER: BCP (Consumos o transferencias)
    // ==========================================
    else if (sender.includes('bcp') || sender.includes('viabcp')) {
      bank = 'BCP';
      const amountMatch = textToParse.match(/s\/\s*(\d+(?:,\d+)*(?:\.\d+)?)/) || textToParse.match(/monto:\s*s\/\s*(\d+(?:,\d+)*(?:\.\d+)?)/);
      if (amountMatch) {
        amount = parseFloat(amountMatch[1].replace(',', ''));
      }

      if (textToParse.includes('consumo') || textToParse.includes('compra')) {
        description = 'Consumo BCP';
        category = 'Gastos Varios';
      } else if (textToParse.includes('transferencia')) {
        description = 'Transferencia BCP';
        category = 'Transferencias';
      } else {
        description = 'Movimiento BCP';
      }
    }
    // ==========================================
    // PARSER: BBVA
    // ==========================================
    else if (sender.includes('bbva')) {
      bank = 'BBVA';
      const amountMatch = textToParse.match(/s\/\s*(\d+(?:,\d+)*(?:\.\d+)?)/) || textToParse.match(/importe:\s*s\/\s*(\d+(?:,\d+)*(?:\.\d+)?)/);
      if (amountMatch) {
        amount = parseFloat(amountMatch[1].replace(',', ''));
      }
      description = textToParse.includes('cargo') ? 'Cargo BBVA' : 'Movimiento BBVA';
      category = 'Gastos Varios';
    } else {
      return new Response(JSON.stringify({ message: 'Banco no reconocido o no soportado aún', sender }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (amount <= 0) {
      return new Response(JSON.stringify({ error: 'No se pudo extraer un monto válido', bank, text: textToParse.substring(0, 100) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Insertar en la base de datos
    const { data, error } = await supabaseClient
      .from('transactions')
      .insert([
        {
          user_id: userId,
          type: type,
          amount: amount,
          category: category,
          description: description + ' (Automático)',
        }
      ])

    if (error) throw error

    return new Response(JSON.stringify({ success: true, bank, amount, description }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
