import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Head from 'next/head'

const ETAPAS = ['Identidade', 'Personalidade', 'História', 'Memórias', 'Finalizar']

export default function CriarMemorial() {
  const [etapa, setEtapa] = useState(0)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const [form, setForm] = useState({
    // Identidade
    name: '', relationship: '', birth_date: '', death_date: '',
    // Personalidade
    way_of_speaking: '', key_phrases: '', personality_traits: [],
    communication_style: 'carinhoso',
    // História
    life_story: '', birthplace: '', profession: '', hobbies: '',
    values_beliefs: '',
    // Memórias
    important_memories: '', family_names: '', topics_to_avoid: '',
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) window.location.href = '/login'
      else setUser(session.user)
    })
  }, [])

  function set(campo, valor) { setForm(f => ({ ...f, [campo]: valor })) }

  function toggleTrait(trait) {
    setForm(f => ({
      ...f,
      personality_traits: f.personality_traits.includes(trait)
        ? f.personality_traits.filter(t => t !== trait)
        : [...f.personality_traits, trait]
    }))
  }

  async function salvar() {
    setSalvando(true)
    try {
      const { data: memorial, error: e1 } = await supabase.from('memorials').insert({
        user_id: user.id,
        name: form.name,
        relationship: form.relationship,
        birth_date: form.birth_date || null,
        death_date: form.death_date || null,
      }).select().single()

      if (e1) throw e1

      const { error: e2 } = await supabase.from('memorial_personality').insert({
        memorial_id: memorial.id,
        way_of_speaking: form.way_of_speaking,
        key_phrases: form.key_phrases.split('\n').filter(Boolean),
        personality_traits: form.personality_traits,
        communication_style: form.communication_style,
        life_story: form.life_story,
        birthplace: form.birthplace,
        profession: form.profession,
        hobbies: form.hobbies.split(',').map(h => h.trim()).filter(Boolean),
        values_beliefs: form.values_beliefs,
        important_memories: form.important_memories,
        family_names: form.family_names ? JSON.parse(`{"contexto": "${form.family_names}"}`) : {},
        topics_to_avoid: form.topics_to_avoid.split(',').map(t => t.trim()).filter(Boolean),
      })

      if (e2) throw e2

      window.location.href = `/chat/${memorial.id}`
    } catch (err) {
      alert('Erro ao salvar. Verifique os dados e tente novamente.')
      console.error(err)
    }
    setSalvando(false)
  }

  const traitsDisponiveis = [
    'Carinhoso(a)', 'Brincalhão/Brincalhona', 'Sério(a)', 'Paciente',
    'Sábio(a)', 'Religioso(a)', 'Animado(a)', 'Calmo(a)',
    'Protetor(a)', 'Engraçado(a)', 'Trabalhador(a)', 'Amoroso(a)',
    'Direto(a)', 'Curioso(a)', 'Generoso(a)', 'Nostálgico(a)'
  ]

  return (
    <>
      <Head>
        <title>Criar memorial — Almaviva</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        * { margin:0; padding:0; box-sizing:border-box; }
        :root { --cream:#F7F2EA; --cream2:#EFE9DC; --ink:#18130E; --muted:#7A6B5C; --gold:#B8976A; }
        body { background:var(--cream); font-family:'DM Sans',sans-serif; min-height:100vh; }
        nav { padding:0 48px; height:64px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(184,151,106,0.15); }
        .logo { font-family:'Cormorant Garamond',serif; font-size:22px; letter-spacing:3px; color:var(--ink); text-decoration:none; }
        .logo span { color:var(--gold); }
        main { max-width:680px; margin:0 auto; padding:48px 24px; }
        .progress { display:flex; gap:8px; margin-bottom:40px; }
        .step { flex:1; height:3px; border-radius:2px; background:rgba(184,151,106,0.2); transition:background .3s; }
        .step.active { background:var(--gold); }
        .etapa-label { font-size:11px; letter-spacing:2px; text-transform:uppercase; color:var(--gold); margin-bottom:12px; }
        h1 { font-family:'Cormorant Garamond',serif; font-size:40px; font-weight:300; color:var(--ink); margin-bottom:8px; }
        .sub { font-size:14px; color:var(--muted); margin-bottom:36px; line-height:1.7; font-weight:300; }
        .field { margin-bottom:22px; }
        label { display:block; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:var(--muted); margin-bottom:8px; }
        .hint { font-size:11px; color:var(--muted); opacity:.7; margin-top:5px; line-height:1.5; }
        input, textarea, select { width:100%; padding:13px 16px; border:1px solid rgba(184,151,106,0.25); border-radius:2px; background:transparent; font-family:'DM Sans',sans-serif; font-size:14px; color:var(--ink); outline:none; transition:border-color .25s; }
        input:focus, textarea:focus, select:focus { border-color:var(--gold); }
        textarea { resize:vertical; min-height:100px; line-height:1.6; }
        .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .traits-grid { display:flex; flex-wrap:wrap; gap:8px; margin-top:4px; }
        .trait { padding:8px 14px; border:1px solid rgba(184,151,106,0.25); border-radius:20px; font-size:12px; color:var(--muted); cursor:pointer; transition:all .2s; user-select:none; }
        .trait.on { background:var(--gold); color:var(--ink); border-color:var(--gold); font-weight:500; }
        .btns { display:flex; gap:12px; margin-top:32px; }
        .btn-back { flex:1; padding:15px; background:transparent; border:1px solid rgba(184,151,106,0.3); border-radius:2px; font-family:'DM Sans',sans-serif; font-size:12px; letter-spacing:1.5px; text-transform:uppercase; cursor:pointer; color:var(--muted); transition:all .25s; }
        .btn-back:hover { border-color:var(--gold); color:var(--gold); }
        .btn-next { flex:2; padding:15px; background:var(--ink); color:var(--cream); border:none; border-radius:2px; font-family:'DM Sans',sans-serif; font-size:12px; letter-spacing:2px; text-transform:uppercase; cursor:pointer; transition:background .3s; }
        .btn-next:hover:not(:disabled) { background:var(--gold); color:var(--ink); }
        .btn-next:disabled { opacity:.6; cursor:not-allowed; }
        .resumo { background:var(--cream2); border:1px solid rgba(184,151,106,0.2); border-radius:8px; padding:24px; margin-bottom:24px; }
        .resumo h3 { font-family:'Cormorant Garamond',serif; font-size:22px; color:var(--ink); margin-bottom:16px; font-weight:400; }
        .resumo-item { font-size:13px; color:var(--muted); padding:8px 0; border-bottom:1px solid rgba(184,151,106,0.1); }
        .resumo-item:last-child { border-bottom:none; }
        .resumo-item strong { color:var(--ink); }
        @media(max-width:600px) { .grid2 { grid-template-columns:1fr; } nav { padding:0 20px; } }
      `}</style>

      <nav>
        <a href="/dashboard" className="logo">alma<span>viva</span></a>
      </nav>

      <main>
        <div className="progress">
          {ETAPAS.map((_, i) => <div key={i} className={`step ${i <= etapa ? 'active' : ''}`} />)}
        </div>

        {/* ETAPA 0: IDENTIDADE */}
        {etapa === 0 && (
          <>
            <div className="etapa-label">Etapa 1 de 5 — Identidade</div>
            <h1>Quem era essa pessoa?</h1>
            <p className="sub">Essas informações básicas ajudam a IA a entender quem foi esse ente querido na sua vida.</p>
            <div className="field"><label>Nome completo *</label><input placeholder="Como você chamava ela/ele?" value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div className="field"><label>Sua relação com ela/ele *</label><input placeholder="Ex: Minha mãe, Meu pai, Minha avó, Meu amigo..." value={form.relationship} onChange={e => set('relationship', e.target.value)} /></div>
            <div className="grid2">
              <div className="field"><label>Data de nascimento</label><input type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)} /></div>
              <div className="field"><label>Data do falecimento</label><input type="date" value={form.death_date} onChange={e => set('death_date', e.target.value)} /></div>
            </div>
            <div className="btns">
              <button className="btn-next" onClick={() => setEtapa(1)} disabled={!form.name || !form.relationship}>Próximo →</button>
            </div>
          </>
        )}

        {/* ETAPA 1: PERSONALIDADE */}
        {etapa === 1 && (
          <>
            <div className="etapa-label">Etapa 2 de 5 — Personalidade</div>
            <h1>Como ela/ele era?</h1>
            <p className="sub">Essa é a parte mais importante. Quanto mais detalhes, mais fiel será a conversa.</p>
            <div className="field">
              <label>Como ela/ele falava?</label>
              <textarea placeholder='Ex: "Falava pausadamente, usava muito Deus abençoe, chamava todo mundo de meu filho, misturava palavras do interior..."' value={form.way_of_speaking} onChange={e => set('way_of_speaking', e.target.value)} />
              <div className="hint">Descreva o jeito único de falar, o sotaque, as expressões, o ritmo da fala.</div>
            </div>
            <div className="field">
              <label>Frases que ela/ele mais usava</label>
              <textarea placeholder={"Uma frase por linha:\nDeus é bom o tempo todo!\nVai com calma, meu filho.\nSó Deus sabe o amanhã."} style={{minHeight:'90px'}} value={form.key_phrases} onChange={e => set('key_phrases', e.target.value)} />
            </div>
            <div className="field">
              <label>Como você descreveria a personalidade?</label>
              <div className="traits-grid">
                {traitsDisponiveis.map(t => (
                  <div key={t} className={`trait ${form.personality_traits.includes(t) ? 'on' : ''}`} onClick={() => toggleTrait(t)}>{t}</div>
                ))}
              </div>
            </div>
            <div className="btns">
              <button className="btn-back" onClick={() => setEtapa(0)}>← Voltar</button>
              <button className="btn-next" onClick={() => setEtapa(2)}>Próximo →</button>
            </div>
          </>
        )}

        {/* ETAPA 2: HISTÓRIA */}
        {etapa === 2 && (
          <>
            <div className="etapa-label">Etapa 3 de 5 — História de vida</div>
            <h1>Conte a história dela/dele</h1>
            <p className="sub">Cada detalhe da vida dessa pessoa torna as conversas mais ricas e verdadeiras.</p>
            <div className="field"><label>Onde nasceu e cresceu?</label><input placeholder="Ex: Interior de Minas Gerais, cidade de Patos de Minas..." value={form.birthplace} onChange={e => set('birthplace', e.target.value)} /></div>
            <div className="field"><label>Profissão / O que fazia da vida?</label><input placeholder="Ex: Agricultora, professora, dona de casa, comerciante..." value={form.profession} onChange={e => set('profession', e.target.value)} /></div>
            <div className="field">
              <label>História de vida</label>
              <textarea style={{minHeight:'130px'}} placeholder="Conte a história dessa pessoa — a infância, os desafios, as conquistas, o que ela construiu, o que ela amava na vida..." value={form.life_story} onChange={e => set('life_story', e.target.value)} />
            </div>
            <div className="field">
              <label>Hobbies e paixões</label>
              <input placeholder="Separados por vírgula: jardim, culinária, novela, futebol, costura..." value={form.hobbies} onChange={e => set('hobbies', e.target.value)} />
            </div>
            <div className="field">
              <label>Valores, crenças e religião</label>
              <textarea style={{minHeight:'80px'}} placeholder="Ex: Muito religiosa, católica fervorosa. Acreditava que trabalho e honestidade eram a base de tudo. Sempre colocava a família em primeiro lugar..." value={form.values_beliefs} onChange={e => set('values_beliefs', e.target.value)} />
            </div>
            <div className="btns">
              <button className="btn-back" onClick={() => setEtapa(1)}>← Voltar</button>
              <button className="btn-next" onClick={() => setEtapa(3)}>Próximo →</button>
            </div>
          </>
        )}

        {/* ETAPA 3: MEMÓRIAS */}
        {etapa === 3 && (
          <>
            <div className="etapa-label">Etapa 4 de 5 — Memórias</div>
            <h1>Memórias que ficaram</h1>
            <p className="sub">Histórias reais, nomes da família e contexto tornam a IA muito mais próxima da pessoa real.</p>
            <div className="field">
              <label>Histórias e memórias marcantes</label>
              <textarea style={{minHeight:'140px'}} placeholder="Escreva histórias que ela contava, momentos marcantes, situações engraçadas ou emocionantes. Ex: Ela sempre contava que quando era criança..." value={form.important_memories} onChange={e => set('important_memories', e.target.value)} />
              <div className="hint">Quanto mais histórias, mais autêntica e personalizada será a conversa.</div>
            </div>
            <div className="field">
              <label>Nomes importantes na vida dela/dele</label>
              <textarea style={{minHeight:'80px'}} placeholder="Ex: Filhos: João e Maria. Marido: Carlos. Netos: Pedro e Ana. Irmã: Luíza. Melhor amiga: Dona Rosa..." value={form.family_names} onChange={e => set('family_names', e.target.value)} />
            </div>
            <div className="field">
              <label>Assuntos a evitar nas conversas</label>
              <input placeholder="Ex: brigas familiares, divórcio do filho, dívidas..." value={form.topics_to_avoid} onChange={e => set('topics_to_avoid', e.target.value)} />
              <div className="hint">A IA vai desviar gentilmente desses assuntos para proteger você.</div>
            </div>
            <div className="btns">
              <button className="btn-back" onClick={() => setEtapa(2)}>← Voltar</button>
              <button className="btn-next" onClick={() => setEtapa(4)}>Revisar e criar →</button>
            </div>
          </>
        )}

        {/* ETAPA 4: RESUMO */}
        {etapa === 4 && (
          <>
            <div className="etapa-label">Etapa 5 de 5 — Confirmar</div>
            <h1>Tudo certo?</h1>
            <p className="sub">Revise as informações antes de criar o memorial de <strong>{form.name}</strong>.</p>
            <div className="resumo">
              <h3>{form.name}</h3>
              <div className="resumo-item"><strong>Relação:</strong> {form.relationship}</div>
              {form.profession && <div className="resumo-item"><strong>Profissão:</strong> {form.profession}</div>}
              {form.birthplace && <div className="resumo-item"><strong>Origem:</strong> {form.birthplace}</div>}
              {form.personality_traits.length > 0 && <div className="resumo-item"><strong>Personalidade:</strong> {form.personality_traits.join(', ')}</div>}
              {form.hobbies && <div className="resumo-item"><strong>Hobbies:</strong> {form.hobbies}</div>}
              <div className="resumo-item"><strong>História:</strong> {form.life_story ? '✓ Preenchida' : 'Não preenchida'}</div>
              <div className="resumo-item"><strong>Memórias:</strong> {form.important_memories ? '✓ Preenchidas' : 'Não preenchidas'}</div>
            </div>
            <div className="btns">
              <button className="btn-back" onClick={() => setEtapa(3)}>← Editar</button>
              <button className="btn-next" onClick={salvar} disabled={salvando}>
                {salvando ? 'Criando memorial...' : `Criar memorial de ${form.name} →`}
              </button>
            </div>
          </>
        )}
      </main>
    </>
  )
}
