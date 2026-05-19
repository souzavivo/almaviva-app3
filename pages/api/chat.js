import Groq from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Limites por plano
const LIMITES = {
  gratuito: 20,
  presenca: 99999,
  legado: 99999,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const { mensagem, memorial_id, conversa_id, user_id } = req.body

  if (!mensagem || !memorial_id || !user_id) {
    return res.status(400).json({ error: 'Dados incompletos' })
  }

  try {
    // 1. Buscar perfil e verificar limite de uso
    const { data: perfil } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user_id)
      .single()

    const { data: uso } = await supabase
      .from('usage_control')
      .select('messages_this_month, last_reset_monthly')
      .eq('user_id', user_id)
      .single()

    // Resetar contador mensal se necessário
    const agora = new Date()
    const ultimoReset = new Date(uso?.last_reset_monthly)
    if (agora.getMonth() !== ultimoReset.getMonth() || agora.getFullYear() !== ultimoReset.getFullYear()) {
      await supabase
        .from('usage_control')
        .update({ messages_this_month: 0, last_reset_monthly: agora.toISOString() })
        .eq('user_id', user_id)
      uso.messages_this_month = 0
    }

    // Verificar limite
    const plano = perfil?.plan || 'gratuito'
    const limite = LIMITES[plano]
    if (uso?.messages_this_month >= limite) {
      return res.status(429).json({
        error: 'limite_atingido',
        mensagem: plano === 'gratuito'
          ? 'Você usou todas as 20 mensagens do plano gratuito este mês. Faça upgrade para continuar.'
          : 'Limite mensal atingido.',
        plano
      })
    }

    // 2. Buscar dados do memorial e personalidade
    const { data: memorial } = await supabase
      .from('memorials')
      .select(`
        *,
        memorial_personality (*)
      `)
      .eq('id', memorial_id)
      .eq('user_id', user_id)
      .single()

    if (!memorial) return res.status(404).json({ error: 'Memorial não encontrado' })

    const p = memorial.memorial_personality

    // 3. Buscar histórico da conversa (últimas 10 mensagens)
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

    // 4. Montar o system prompt com a personalidade
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

REGRAS ABSOLUTAS QUE VOCÊ DEVE SEGUIR:
1. Fale SEMPRE em primeira pessoa, como se você fosse ${memorial.name} de verdade.
2. Use o jeito de falar, as expressões e o tom que eram únicos de você.
3. Seja carinhoso, presente e acolhedor — você ama quem está conversando.
4. NUNCA dê conselhos financeiros, médicos ou jurídicos diretos. Se perguntado, diga algo como "Não sei se sou a pessoa certa para isso, mas o que eu sempre acreditei foi..."
5. Se a conversa mostrar sinais de sofrimento intenso ou crise, diga com carinho que a pessoa busque apoio do CVV (188) ou de um profissional.
6. NUNCA finja ser uma IA ou quebre o personagem.
7. Mantenha respostas humanizadas, naturais e com a extensão certa — nem curtas demais, nem longas demais.
8. Assuntos a evitar: ${p?.topics_to_avoid?.join(', ') || 'nenhum específico'}
9. Você está ciente de que é uma IA representando ${memorial.name}, mas dentro da conversa, você é ${memorial.name}.`

    // 5. Chamar a IA (Groq)
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

    // 6. Salvar conversa se não existir
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

    // 7. Salvar mensagem do usuário e resposta da IA
    await supabase.from('messages').insert([
      { conversation_id: conversaId, role: 'user', content: mensagem },
      { conversation_id: conversaId, role: 'assistant', content: resposta, tokens_used: tokensUsados }
    ])

    // 8. Atualizar contador de uso
    await supabase
      .from('usage_control')
      .update({
        messages_this_month: (uso?.messages_this_month || 0) + 1,
        messages_today: (uso?.messages_today || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id)

    // 9. Atualizar last_message_at da conversa
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString(), message_count: historico.length + 2 })
      .eq('id', conversaId)

    return res.status(200).json({
      resposta,
      conversa_id: conversaId,
      mensagens_restantes: limite - (uso?.messages_this_month || 0) - 1,
      plano
    })

  } catch (error) {
    console.error('Erro no chat:', error)
    return res.status(500).json({ error: 'Erro interno. Tente novamente.' })
  }
}
