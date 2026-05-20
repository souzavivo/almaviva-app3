import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  try {
    const { data: perfis, error } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, plan, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Buscar usage_control separado
    const { data: usos } = await supabaseAdmin
      .from('usage_control')
      .select('user_id, messages_this_month, messages_today')

    // Combinar os dados
    const perfisComUso = perfis.map(p => ({
      ...p,
      usage_control: usos?.filter(u => u.user_id === p.id) || []
    }))

    return res.status(200).json({ perfis: perfisComUso })
  } catch (err) {
    console.error('Erro admin:', err)
    return res.status(500).json({ error: err.message })
  }
}
