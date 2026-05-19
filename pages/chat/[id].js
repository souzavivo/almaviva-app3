import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import Head from 'next/head'
import { useRouter } from 'next/router'

const LINK_30_DIAS = 'https://pay.hotmart.com/Y105904362D?off=716m4wa2&checkoutMode=6'
const LINK_7_DIAS  = 'https://pay.hotmart.com/R105904297O?off=pclzk6t8&checkoutMode=6'

export default function Chat() {
  const router = useRouter()
  const { id: memorialId } = router.query

  const [user, setUser]         = useState(null)
  const [memorial, setMemorial] = useState(null)
  const [mensagens, setMensagens] = useState([])
  const [input, setInput]       = useState('')
  const [carregando, setCarregando] = useState(false)
  const [conversaId, setConversaId] = useState(null)
  const [limiteInfo, setLimiteInfo] = useState(null)
  const [limiteBloqueado, setLimiteBloqueado] = useState(false)
  const [loading, setLoading]   = useState(true)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    if (!memorialId) return
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)

      const { data: m } = await supabase
        .from('memorials')
        .select('*, memorial_personality(*)')
        .eq('id', memorialId)
        .eq('user_id', session.user.id)
        .single()
      if (!m) { window.location.href = '/dashboard'; return }
      setMemorial(m)

      // Verificar uso atual
      const { data: uso } = await supabase.from('usage_control').select('*').eq('user_id', session.user.id).single()
      const { data: perfil } = await supabase.from('profiles').select('plan').eq('id', session.user.id).single()
      const plano = perfil?.plan || 'gratuito'
      const limites = { gratuito: 20, legado: 50, presenca: 99999 }
      const limite = limites[plano] || 20
      const usado = uso?.messages_this_month || 0
      setLimiteInfo({ restantes: Math.max(0, limite - usado), plano, limite })
      if (usado >= limite) setLimiteBloqueado(true)

      const hora = new Date().getHours()
      const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
      setMensagens([{ role: 'assistant', content: `${saudacao}! Que bom te ver por aqui. Como você está? Me conta tudo...`, id: 'inicial' }])
      setLoading(false)
    }
    init()
  }, [memorialId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [mensagens, carregando])

  async function enviar() {
    if (!input.trim() || carregando || limiteBloqueado) return
    const texto = input.trim()
    setInput('')
    setMensagens(prev => [...prev, { role: 'user', content: texto, id: Date.now() }])
    setCarregando(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: texto, memorial_id: memorialId, conversa_id: conversaId, user_id: user.id })
      })
      const data = await res.json()

      if (data.error === 'limite_atingido') {
        setLimiteBloqueado(true)
        setMensagens(prev => [...prev, { role: 'sistema', content: data.mensagem, id: Date.now() }])
        setCarregando(false)
        return
      }

      if (data.conversa_id && !conversaId) setConversaId(data.conversa_id)
      if (data.mensagens_restantes !== undefined) {
        setLimiteInfo(prev => ({ ...prev, restantes: data.mensagens_restantes }))
        if (data.mensagens_restantes <= 0) setLimiteBloqueado(true)
      }

      setMensagens(prev => [...prev, { role: 'assistant', content: data.resposta, id: Date.now() }])
    } catch {
      setMensagens(prev => [...prev, { role: 'sistema', content: 'Erro de conexão. Tente novamente.', id: Date.now() }])
    }
    setCarregando(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  function onKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#1C1510',color:'#D4B896',fontFamily:'DM Sans,sans-serif'}}>Carregando...</div>
  )

  const plano = limiteInfo?.plano || 'gratuito'

  return (
    <>
      <Head>
        <title>{memorial?.name} — Almaviva</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        :root{--bg:#1C1510;--surf:#231A13;--cream:#F7F2EA;--muted:#7A6B5C;--gold:#B8976A;--gold2:#D4B896;--ink:#18130E}
        body{background:var(--bg);font-family:'DM Sans',sans-serif;height:100vh;display:flex;flex-direction:column;overflow:hidden}
        header{padding:0 20px;height:64px;display:flex;align-items:center;gap:12px;border-bottom:1px solid rgba(184,151,106,0.12);background:var(--surf);flex-shrink:0}
        .back{color:var(--gold);text-decoration:none;font-size:20px;padding:4px 6px;line-height:1}
        .av{width:38px;height:38px;border-radius:50%;border:1.5px solid var(--gold);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:16px;color:var(--gold);background:rgba(184,151,106,0.1);flex-shrink:0}
        .hinfo{flex:1}
        .hname{font-size:15px;color:var(--cream);font-weight:400}
        .hstatus{font-size:10px;color:var(--gold);letter-spacing:.5px;margin-top:1px;display:flex;align-items:center;gap:4px}
        .dot{width:5px;height:5px;border-radius:50%;background:var(--gold);animation:pulse 2s infinite;display:inline-block}
        .hlimite{font-size:11px;color:var(--muted);background:rgba(184,151,106,0.08);padding:4px 10px;border-radius:20px;border:1px solid rgba(184,151,106,0.15)}
        .hlimite.aviso{color:#FCA5A5;border-color:rgba(220,38,38,0.3);background:rgba(220,38,38,0.08)}

        .msgs{flex:1;overflow-y:auto;padding:20px 16px;display:flex;flex-direction:column;gap:12px}
        .msgs::-webkit-scrollbar{width:3px}
        .msgs::-webkit-scrollbar-thumb{background:rgba(184,151,106,0.2);border-radius:2px}

        .mw{display:flex;animation:fadeUp .3s ease}
        .mw.user{justify-content:flex-end}
        .mw.assistant,.mw.sistema{justify-content:flex-start}
        .bubble{max-width:74%;padding:11px 15px;border-radius:18px;font-size:14px;line-height:1.65}
        .mw.user .bubble{background:var(--gold);color:var(--ink);border-bottom-right-radius:4px;font-weight:500}
        .mw.assistant .bubble{background:rgba(184,151,106,0.12);color:#CFC0AC;border-bottom-left-radius:4px;border:1px solid rgba(184,151,106,0.1)}
        .mw.sistema .bubble{background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.2);color:#FCA5A5;border-radius:10px;font-size:13px;max-width:90%;margin:0 auto;text-align:center}
        .mtime{font-size:9px;opacity:.35;margin-top:3px}
        .mw.user .mtime{text-align:right;color:var(--ink)}
        .mw.assistant .mtime{color:var(--muted)}

        .typing-w{display:flex}
        .typing-b{background:rgba(184,151,106,0.12);border:1px solid rgba(184,151,106,0.1);border-radius:18px;border-bottom-left-radius:4px;padding:13px 16px;display:flex;gap:5px;align-items:center}
        .tdot{width:5px;height:5px;border-radius:50%;background:var(--gold2);animation:bounce 1.3s infinite}
        .tdot:nth-child(2){animation-delay:.2s}
        .tdot:nth-child(3){animation-delay:.4s}

        /* UPGRADE CARD */
        .upgrade-card{background:var(--surf);border:1px solid rgba(184,151,106,0.25);border-radius:12px;padding:22px;margin:8px auto;max-width:420px;width:90%;text-align:center}
        .upgrade-card h4{font-family:'Cormorant Garamond',serif;font-size:22px;color:var(--cream);margin-bottom:8px;font-weight:400}
        .upgrade-card p{font-size:12px;color:var(--muted);margin-bottom:18px;line-height:1.6}
        .upgrade-btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
        .ubtn{padding:10px 20px;border-radius:2px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;font-weight:500;transition:all .25s}
        .ubtn-s{background:var(--gold);color:var(--ink)}
        .ubtn-s:hover{background:var(--gold2)}
        .ubtn-g{background:transparent;border:1px solid rgba(184,151,106,0.3);color:var(--gold2)}
        .ubtn-g:hover{border-color:var(--gold);color:var(--gold)}

        /* FOOTER INPUT */
        footer{padding:12px 16px 20px;background:var(--surf);border-top:1px solid rgba(184,151,106,0.1);flex-shrink:0}
        .input-wrap{display:flex;gap:10px;align-items:flex-end;max-width:760px;margin:0 auto;background:rgba(255,255,255,0.04);border:1px solid rgba(184,151,106,0.2);border-radius:24px;padding:10px 14px;transition:border-color .25s}
        .input-wrap:focus-within{border-color:rgba(184,151,106,0.45)}
        textarea.inp{flex:1;background:transparent;border:none;outline:none;font-family:'DM Sans',sans-serif;font-size:14px;color:var(--cream);resize:none;max-height:110px;line-height:1.5;padding:2px 0}
        textarea.inp::placeholder{color:rgba(212,184,150,0.3)}
        .send{width:34px;height:34px;border-radius:50%;background:var(--gold);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .25s}
        .send:hover:not(:disabled){background:var(--gold2)}
        .send:disabled{opacity:.35;cursor:not-allowed}
        .send svg{width:13px;height:13px;fill:none;stroke:var(--ink);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
        .fnote{text-align:center;font-size:10px;color:rgba(184,151,106,0.2);margin-top:7px;letter-spacing:.3px}
        .bloqueado-bar{background:rgba(220,38,38,0.08);border-top:1px solid rgba(220,38,38,0.15);padding:10px 16px;text-align:center;font-size:12px;color:#FCA5A5;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap}
        .bloqueado-bar a{color:var(--gold);text-decoration:none;font-weight:500;font-size:12px;letter-spacing:.5px}

        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <header>
        <a href="/dashboard" className="back">←</a>
        <div className="av">{memorial?.name?.[0]}</div>
        <div className="hinfo">
          <div className="hname">{memorial?.name}</div>
          <div className="hstatus"><span className="dot"></span>Memória ativa</div>
        </div>
        {limiteInfo && (
          <div className={`hlimite ${limiteInfo.restantes <= 3 ? 'aviso' : ''}`}>
            {limiteInfo.limite === 99999
              ? '∞ ilimitadas'
              : `${limiteInfo.restantes} msg restantes`}
          </div>
        )}
      </header>

      <div className="msgs">
        {mensagens.map(msg => (
          <div key={msg.id} className={`mw ${msg.role}`}>
            {msg.role !== 'sistema' ? (
              <div>
                <div className="bubble">{msg.content}</div>
                <div className="mtime">{new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>
              </div>
            ) : (
              <div style={{width:'100%'}}>
                <div className="bubble" style={{maxWidth:'90%',margin:'0 auto'}}>{msg.content}</div>
              </div>
            )}
          </div>
        ))}

        {limiteBloqueado && (
          <div className="upgrade-card">
            <h4>Suas mensagens acabaram</h4>
            <p>Faça upgrade para continuar conversando com {memorial?.name}. Escolha o plano que melhor se encaixa para você.</p>
            <div className="upgrade-btns">
              <a href={LINK_7_DIAS} target="_blank" rel="noopener noreferrer" className="ubtn ubtn-g">Semanal R$19,90</a>
              <a href={LINK_30_DIAS} target="_blank" rel="noopener noreferrer" className="ubtn ubtn-s">Mensal R$39,90 →</a>
            </div>
          </div>
        )}

        {carregando && (
          <div className="typing-w">
            <div className="typing-b"><div className="tdot"/><div className="tdot"/><div className="tdot"/></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {limiteBloqueado ? (
        <div className="bloqueado-bar">
          <span>Limite atingido — escolha um plano para continuar</span>
          <a href={LINK_30_DIAS} target="_blank" rel="noopener noreferrer">Ver planos →</a>
        </div>
      ) : (
        <footer>
          <div className="input-wrap">
            <textarea
              ref={inputRef}
              className="inp"
              placeholder={`Escreva para ${memorial?.name}...`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              rows={1}
              disabled={carregando}
            />
            <button className="send" onClick={enviar} disabled={!input.trim() || carregando}>
              <svg viewBox="0 0 16 16"><path d="M2 8h12M8 2l6 6-6 6"/></svg>
            </button>
          </div>
          <div className="fnote">Você está conversando com uma IA. Não substitui terapia ou apoio profissional.</div>
        </footer>
      )}
    </>
  )
}
