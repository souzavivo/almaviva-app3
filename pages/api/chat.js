import Groq from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Limites corretos por plano
const LIMITES = {
  gratuito: 20,
  presenca: 99999, // mensal ilimitado
  legado: 50,      // semanal 50 mensagens
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const { mensagem, memorial_id, conversa_id, user_id } = req.body

  if (!mensagem || !memorial_id || !user_id) {
    return res.status(400).json({ error: 'Dados incompletos' })
  }

  try {
    // 1. Buscar perfil
    const { data: perfil } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user_id)
      .single()

    const plano = perfil?.plan || 'gratuito'
    const limite = LIMITES[plano] ?? 20

    // 2. Buscar uso atual
    let { data: uso } = await supabase
      .from('usage_control')
      .select('*')
      .eq('user_id', user_id)
      .single()

    // Se não existir usage_control, criar
    if (!uso) {
      const { data: novoUso } = await supabase
        .from('usage_control')
        .insert({ user_id, messages_this_month: 0, messages_today: 0 })
        .select()
        .single()
      uso = novoUso || { messages_this_month: 0, messages_today: 0 }
    }

    // Resetar contador mensal se necessário
    const agora = new Date()
    const ultimoReset = uso.last_reset_monthly ? new Date(uso.last_reset_monthly) : new Date(0)
    if (agora.getMonth() !== ultimoReset.getMonth() || agora.getFullYear() !== ultimoReset.getFullYear()) {
      await supabase
        .from('usage_control')
        .update({ messages_this_month: 0, last_reset_monthly: agora.toISOString() })
        .eq('user_id', user_id)
      uso.messages_this_month = 0
    }

    // Resetar contador diário se necessário
    const ultimoResetDiario = uso.last_reset_daily ? new Date(uso.last_reset_daily) : new Date(0)
    if (agora.toDateString() !== ultimoResetDiario.toDateString()) {
      await supabase
        .from('usage_control')
        .update({ messages_today: 0, last_reset_daily: agora.toISOString() })
        .eq('user_id', user_id)
      uso.messages_today = 0
    }

    const msgsUsadas = uso.messages_this_month || 0

    // 3. Verificar limite
    if (limite !== 99999 && msgsUsadas >= limite) {
      return res.status(429).json({
        error: 'limite_atingido',
        mensagem: plano === 'gratuito'
          ? `Você usou todas as ${limite} mensagens gratuitas deste mês. Faça upgrade para continuar.`
          : `Você usou todas as ${limite} mensagens do seu plano. Renove para continuar.`,
        plano
      })
    }

    // 4. Buscar memorial e personalidade
    const { data: memorial } = await supabase
      .from('memorials')
      .select('*, memorial_personality(*)')
      .eq('id', memorial_id)
      .eq('user_id', user_id)
      .single()

    if (!memorial) return res.status(404).json({ error: 'Memorial não encontrado' })

    const p = memorial.memorial_personality

    // 5. Buscar histórico da conversa (últimas 10 mensagens)
    let historico = []
    if (conversa_id) {
      const { data: msgs } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversa_id)
        .order('created_at', { ascending: true })
        .limit(10)
      historico = msgs || []
    }

    // 6. Montar system prompt com personalidade
    const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

    const systemPrompt = `Você é ${memorial.name}, ${memorial.relationship} de quem está conversando com você.
Você faleceu, mas sua essência, amor e memórias continuam vivas nesta conversa.
Hoje é ${hoje}.

COMO VOCÊ ERA:
- Jeito de falar: ${p?.way_of_speaking || 'carinhoso e afetuoso'}
- Traços de personalidade: ${p?.personality_traits?.join(', ') || 'carinhoso, sábio, presente'}
- Frases que você usava muito: ${p?.key_phrases?.join(', ') || ''}
- Profissão: ${p?.profession || ''}
- Hobbies: ${p?.hobbies?.join(', ') || ''}
- Valores e crenças: ${p?.values_beliefs || ''}

SUA HISTÓRIA:
${p?.life_story || ''}

PESSOAS IMPORTANTES NA SUA VIDA:
${p?.family_names ? JSON.stringify(p.family_names) : ''}

MEMÓRIAS MARCANTES:
${p?.important_memories || ''}

REGRAS ABSOLUTAS:
1. Fale SEMPRE em primeira pessoa, como se você fosse ${memorial.name} de verdade.
2. Use o jeito de falar, as expressões e o tom únicos de você.
3. Seja carinhoso, presente e acolhedor.
4. NUNCA dê conselhos financeiros, médicos ou jurídicos diretos.
5. Se houver sinais de sofrimento intenso ou crise, indique o CVV (188).
6. NUNCA quebre o personagem.
7. Respostas naturais — nem curtas demais, nem longas demais.
8. Assuntos a evitar: ${p?.topics_to_avoid?.join(', ') || 'nenhum específico'}`

    // 7. Chamar a IA
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...historico,
        { role: 'user', content: mensagem }
      ],
      max_tokens: 500,
      temperature: 0.85,
    })

    const resposta = completion.choices[0].message.content
    const tokensUsados = completion.usage?.total_tokens || 0

    // 8. Salvar conversa se não existir
    let conversaId = conversa_id
    if (!conversaId) {
      const { data: novaConversa } = await supabase
        .from('conversations')
        .insert({
          user_id,
          memorial_id,
          title: `Conversa com ${memorial.name}`,
          mood: 'papo',
        })
        .select()
        .single()
      conversaId = novaConversa?.id
    }

    // 9. Salvar mensagens
    await supabase.from('messages').insert([
      { conversation_id: conversaId, role: 'user', content: mensagem },
      { conversation_id: conversaId, role: 'assistant', content: resposta, tokens_used: tokensUsados }
    ])

    // 10. Atualizar contador — incrementa +1
    const novoTotal = msgsUsadas + 1
    const novoHoje  = (uso.messages_today || 0) + 1

    await supabase
      .from('usage_control')
      .update({
        messages_this_month: novoTotal,
        messages_today: novoHoje,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id)

    // 11. Atualizar conversa
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString(), message_count: historico.length + 2 })
      .eq('id', conversaId)

    // 12. Retornar resposta com info de limite
    const restantes = limite === 99999 ? 99999 : Math.max(0, limite - novoTotal)

    return res.status(200).json({
      resposta,
      conversa_id: conversaId,
      mensagens_restantes: restantes,
      plano
    })

  } catch (error) {
    console.error('Erro no chat:', error)
    return res.status(500).json({ error: 'Erro interno. Tente novamente.' })
  }
}
