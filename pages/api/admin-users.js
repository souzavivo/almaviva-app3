import { createClient } from '@supabase/supabase-js'

// Usa service_role para ver todos os dados sem restrição de RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  // Verificar se é admin pelo header de autorização
  const adminEmail = req.headers['x-admin-email']
  if (adminEmail !== 'juninhozika510@gmail.com') {
    return res.status(403).json({ error: 'Acesso negado' })
  }

  try {
    const { data: perfis, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        id, name, email, plan, created_at,
        usage_control (messages_this_month, messages_today),
        memorials (count)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return res.status(200).json({ perfis })
  } catch (err) {
    console.error('Erro admin:', err)
    return res.status(500).json({ error: 'Erro ao buscar usuários' })
  }
}
