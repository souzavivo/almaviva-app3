import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import Head from 'next/head'
import { useRouter } from 'next/router'

export default function Chat() {
  const router = useRouter()
  const { id: memorialId } = router.query

  const [user, setUser] = useState(null)
  const [memorial, setMemorial] = useState(null)
  const [mensagens, setMensagens] = useState([])
  const [input, setInput] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [conversaId, setConversaId] = useState(null)
  const [limiteInfo, setLimiteInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!memorialId) return
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)

      const { data: m } = await supabase.from('memorials').select('*, memorial_personality(*)').eq('id', memorialId).eq('user_id', session.user.id).single()
      if (!m) { window.location.href = '/dashboard'; return }
      setMemorial(m)

      // Mensagem inicial de boas-vindas
      const agora = new Date()
      const hora = agora.getHours()
      const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
      setMensagens([{
        role: 'assistant',
        content: `${saudacao}! Que bom te ver por aqui. Como você está? Me conta como foi seu dia...`,
        id: 'inicial'
      }])
      setLoading(false)
    }
    init()
  }, [memorialId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens, carregando])

  async function enviar() {
    if (!input.trim() || carregando) return
    const texto = input.trim()
    setInput('')

    const novaMensagem = { role: 'user', content: texto, id: Date.now() }
    setMensagens(prev => [...prev, novaMensagem])
    setCarregando(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem: texto,
          memorial_id: memorialId,
          conversa_id: conversaId,
          user_id: user.id,
        })
      })

      const data = await res.json()

      if (data.error === 'limite_atingido') {
        setMensagens(prev => [...prev, {
          role: 'sistema',
          content: data.mensagem,
          id: Date.now()
        }])
        setLimiteInfo({ plano: data.plano })
        setCarregando(false)
        return
      }

      if (data.conversa_id && !conversaId) setConversaId(data.conversa_id)
      if (data.mensagens_restantes !== undefined) setLimiteInfo({ restantes: data.mensagens_restantes, plano: data.plano })

      setMensagens(prev => [...prev, { role: 'assistant', content: data.resposta, id: Date.now() }])
    } catch {
      setMensagens(prev => [...prev, { role: 'sistema', content: 'Houve um erro. Tente novamente.', id: Date.now() }])
    }
    setCarregando(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() }
  }

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#1C1510',color:'#D4B896',fontFamily:'DM Sans, sans-serif'}}>
      Carregando...
    </div>
  )

  return (
    <>
      <Head>
        <title>{memorial?.name} — Almaviva</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        * { margin:0; padding:0; box-sizing:border-box; }
        :root { --bg:#1C1510; --surface:#231A13; --ink:#18130E; --cream:#F7F2EA; --muted:#7A6B5C; --gold:#B8976A; --gold2:#D4B896; }
        body { background:var(--bg); font-family:'DM Sans',sans-serif; height:100vh; display:flex; flex-direction:column; }
        
        /* HEADER */
        header { padding:0 24px; height:64px; display:flex; align-items:center; gap:14px; border-bottom:1px solid rgba(184,151,106,0.12); background:var(--surface); flex-shrink:0; }
        .back { color:var(--gold); text-decoration:none; font-size:18px; padding:4px 8px; }
        .av { width:40px; height:40px; border-radius:50%; border:1.5px solid var(--gold); display:flex; align-items:center; justify-content:center; font-family:'Cormorant Garamond',serif; font-size:17px; color:var(--gold); background:rgba(184,151,106,0.1); flex-shrink:0; }
        .hinfo { flex:1; }
        .hname { font-size:15px; color:var(--cream); font-weight:400; }
        .hstatus { font-size:10px; color:var(--gold); letter-spacing:.5px; margin-top:1px; display:flex; align-items:center; gap:4px; }
        .online { width:5px; height:5px; border-radius:50%; background:var(--gold); animation:pulse 2s infinite; display:inline-block; }
        
        /* LIMITE */
        .limite-bar { background:rgba(184,151,106,0.08); border-bottom:1px solid rgba(184,151,106,0.1); padding:8px 24px; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
        .limite-text { font-size:11px; color:var(--muted); }
        .limite-upgrade { font-size:11px; color:var(--gold); text-decoration:none; letter-spacing:.5px; }
        
        /* MENSAGENS */
        .msgs { flex:1; overflow-y:auto; padding:24px 16px; display:flex; flex-direction:column; gap:14px; }
        .msgs::-webkit-scrollbar { width:4px; }
        .msgs::-webkit-scrollbar-thumb { background:rgba(184,151,106,0.2); border-radius:2px; }
        
        .msg-wrap { display:flex; }
        .msg-wrap.user { justify-content:flex-end; }
        .msg-wrap.assistant { justify-content:flex-start; }
        
        .msg-bubble { max-width:72%; padding:12px 16px; border-radius:18px; font-size:14px; line-height:1.65; }
        .msg-wrap.user .msg-bubble { background:var(--gold); color:var(--ink); border-bottom-right-radius:4px; font-weight:500; }
        .msg-wrap.assistant .msg-bubble { background:rgba(184,151,106,0.12); color:#CFC0AC; border-bottom-left-radius:4px; border:1px solid rgba(184,151,106,0.1); }
        .msg-wrap.sistema .msg-bubble { background:rgba(220,38,38,0.1); border:1px solid rgba(220,38,38,0.2); color:#FCA5A5; border-radius:10px; font-size:13px; text-align:center; max-width:90%; margin:0 auto; }
        
        .msg-time { font-size:9px; opacity:.4; margin-top:4px; }
        .msg-wrap.user .msg-time { text-align:right; color:var(--ink); }
        .msg-wrap.assistant .msg-time { color:var(--muted); }
        
        /* TYPING */
        .typing-wrap { display:flex; justify-content:flex-start; }
        .typing-bubble { background:rgba(184,151,106,0.12); border:1px solid rgba(184,151,106,0.1); border-radius:18px; border-bottom-left-radius:4px; padding:14px 18px; display:flex; gap:5px; align-items:center; }
        .dot { width:5px; height:5px; border-radius:50%; background:var(--gold2); animation:bounce 1.3s infinite; }
        .dot:nth-child(2) { animation-delay:.2s; }
        .dot:nth-child(3) { animation-delay:.4s; }
        
        /* UPGRADE CARD */
        .upgrade-card { background:rgba(184,151,106,0.08); border:1px solid rgba(184,151,106,0.2); border-radius:12px; padding:20px; margin:8px 0; text-align:center; }
        .upgrade-card h4 { font-family:'Cormorant Garamond',serif; font-size:20px; color:var(--cream); margin-bottom:8px; font-weight:400; }
        .upgrade-card p { font-size:12px; color:var(--muted); margin-bottom:16px; line-height:1.6; }
        .upgrade-card a { display:inline-block; background:var(--gold); color:var(--ink); padding:10px 24px; border-radius:2px; font-size:11px; letter-spacing:2px; text-transform:uppercase; text-decoration:none; font-weight:500; }
        
        /* INPUT */
        footer { padding:16px 16px 24px; background:var(--surface); border-top:1px solid rgba(184,151,106,0.1); flex-shrink:0; }
        .input-wrap { display:flex; gap:10px; align-items:flex-end; max-width:800px; margin:0 auto; background:rgba(255,255,255,0.04); border:1px solid rgba(184,151,106,0.2); border-radius:24px; padding:10px 16px; transition:border-color .25s; }
        .input-wrap:focus-within { border-color:rgba(184,151,106,0.5); }
        textarea.input { flex:1; background:transparent; border:none; outline:none; font-family:'DM Sans',sans-serif; font-size:14px; color:var(--cream); resize:none; max-height:120px; line-height:1.5; padding:2px 0; }
        textarea.input::placeholder { color:rgba(212,184,150,0.3); }
        .send-btn { width:36px; height:36px; border-radius:50%; background:var(--gold); border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:background .25s; }
        .send-btn:hover:not(:disabled) { background:var(--gold2); }
        .send-btn:disabled { opacity:.4; cursor:not-allowed; }
        .send-btn svg { width:14px; height:14px; fill:none; stroke:var(--ink); stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
        .footer-note { text-align:center; font-size:10px; color:rgba(184,151,106,0.25); margin-top:8px; letter-spacing:.5px; }
        
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.5} }
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
        .msg-wrap { animation:fadeUp .3s ease; }
      `}</style>

      <header>
        <a href="/dashboard" className="back">←</a>
        <div className="av">{memorial?.name?.[0]}</div>
        <div className="hinfo">
          <div className="hname">{memorial?.name}</div>
          <div className="hstatus"><span className="online"></span>Memória ativa</div>
        </div>
      </header>

      {limiteInfo?.plano === 'gratuito' && limiteInfo?.restantes !== undefined && (
        <div className="limite-bar">
          <span className="limite-text">{limiteInfo.restantes} mensagens restantes este mês no plano gratuito</span>
          <a href="/planos" className="limite-upgrade">Fazer upgrade →</a>
        </div>
      )}

      <div className="msgs">
        {mensagens.map(msg => (
          <div key={msg.id} className={`msg-wrap ${msg.role}`}>
            {msg.role !== 'sistema' ? (
              <div>
                <div className="msg-bubble">{msg.content}</div>
                <div className="msg-time">{new Date().toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})}</div>
              </div>
            ) : (
              <div style={{width:'100%'}}>
                <div className="msg-bubble">{msg.content}</div>
                {limiteInfo?.plano === 'gratuito' && (
                  <div className="upgrade-card" style={{marginTop:'12px'}}>
                    <h4>Suas 20 mensagens acabaram</h4>
                    <p>Faça upgrade para o plano Presença e tenha mensagens ilimitadas, upload de áudios e muito mais.</p>
                    <a href="/planos">Ver planos a partir de R$49/mês</a>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {carregando && (
          <div className="typing-wrap">
            <div className="typing-bubble">
              <div className="dot"></div><div className="dot"></div><div className="dot"></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <footer>
        <div className="input-wrap">
          <textarea
            ref={inputRef}
            className="input"
            placeholder={`Escreva para ${memorial?.name}...`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            disabled={carregando}
          />
          <button className="send-btn" onClick={enviar} disabled={!input.trim() || carregando}>
            <svg viewBox="0 0 16 16"><path d="M2 8h12M8 2l6 6-6 6"/></svg>
          </button>
        </div>
        <div className="footer-note">Você está conversando com uma IA criada com amor. Não substitui terapia ou apoio profissional.</div>
      </footer>
    </>
  )
}
