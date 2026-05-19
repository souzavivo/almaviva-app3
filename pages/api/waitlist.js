import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { nome, email, plano, source } = req.body

  if (!email) return res.status(400).json({ error: 'E-mail obrigatório' })

  const { error } = await supabase.from('waitlist').insert({
    name: nome,
    email,
    plan_interest: plano || 'gratuito',
    source: source || 'landing'
  })

  if (error && error.code === '23505') {
    return res.status(200).json({ ok: true, message: 'Você já está na lista!' })
  }

  if (error) return res.status(500).json({ error: 'Erro ao salvar' })

  return res.status(200).json({ ok: true, message: 'Cadastrado com sucesso!' })
}
