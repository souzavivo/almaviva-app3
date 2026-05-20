import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Head from 'next/head'
import Link from 'next/link'

const LINK_30_DIAS = 'https://pay.hotmart.com/Y105904362D?off=716m4wa2&checkoutMode=6'
const LINK_7_DIAS  = 'https://pay.hotmart.com/R105904297O?off=pclzk6t8&checkoutMode=6'

const INFO_PLANO = {
  gratuito: { label: 'Gratuito',         limite: 20    },
  presenca:  { label: 'Mensal — 30 dias', limite: 99999 },
  legado:    { label: 'Semanal — 7 dias', limite: 50    },
}

export default function Dashboard() {
  const [user, setUser]           = useState(null)
  const [perfil, setPerfil]       = useState(null)
  const [memoriais, setMemoriais] = useState([])
  const [uso, setUso]             = useState(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)
      const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setPerfil(p)
      const { data: u } = await supabase.from('usage_control').select('*').eq('user_id', session.user.id).single()
      setUso(u)
      const { data: m } = await supabase.from('memorials').select('*').eq('user_id', session.user.id).eq('is_active', true).order('created_at', { ascending: false })
      setMemoriais(m || [])
      setLoading(false)
    }
    init()
  }, [])

  async function sair() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const planoAtual = perfil?.plan || 'gratuito'
  const info       = INFO_PLANO[planoAtual] || INFO_PLANO.gratuito
  const msgsUsadas = uso?.messages_this_month || 0
  const msgsLimite = info.limite
  const pct        = msgsLimite === 99999 ? 8 : Math.min(100, (msgsUsadas / msgsLimite) * 100)
  const podecriar  = planoAtual !== 'gratuito' || memoriais.length < 1

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F7F2EA',fontFamily:'DM Sans,sans-serif',color:'#7A6B5C'}}>Carregando...</div>
  )

  return (
    <>
      <Head>
        <title>Meus memoriais — Almaviva</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        :root{--cream:#F7F2EA;--cream2:#EFE9DC;--ink:#18130E;--muted:#7A6B5C;--gold:#B8976A;--gold2:#D4B896}
        body{background:var(--cream);font-family:'DM Sans',sans-serif}
        nav{padding:0 48px;height:64px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(184,151,106,0.15)}
        /* FIX 4: logo como link simples sem erro */
        .logo{font-family:'Cormorant Garamond',serif;font-size:22px;letter-spacing:3px;color:var(--ink);text-decoration:none;cursor:pointer}
        .logo span{color:var(--gold)}
        .nav-r{display:flex;align-items:center;gap:16px}
        .badge{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;padding:4px 12px;border-radius:20px;border:1px solid var(--gold);color:var(--gold)}
        .nav-u{font-size:13px;color:var(--muted)}
        .btn-sair{background:none;border:1px solid rgba(184,151,106,0.25);color:var(--muted);padding:8px 16px;border-radius:2px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .25s}
        .btn-sair:hover{border-color:var(--gold);color:var(--gold)}
        main{max-width:1000px;margin:0 auto;padding:48px}
        .uso{background:var(--cream2);border:1px solid rgba(184,151,106,0.2);border-radius:10px;padding:20px 24px;margin-bottom:32px;display:flex;align-items:center;gap:24px;flex-wrap:wrap}
        .uso-info{flex:1;min-width:180px}
        .uso-label{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:6px}
        .uso-num{font-family:'Cormorant Garamond',serif;font-size:28px;color:var(--ink);font-weight:300}
        .uso-num span{font-size:13px;color:var(--muted);font-family:'DM Sans',sans-serif}
        .barra-wrap{flex:2;min-width:180px}
        .barra-bg{height:6px;background:rgba(184,151,106,0.15);border-radius:3px;overflow:hidden;margin-bottom:6px}
        .barra-fill{height:100%;border-radius:3px;transition:width .5s}
        .barra-txt{font-size:11px;color:var(--muted)}
        h1{font-family:'Cormorant Garamond',serif;font-size:40px;font-weight:300;color:var(--ink);margin-bottom:8px}
        .sub{font-size:14px;color:var(--muted);margin-bottom:28px}
        .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:20px}
        .mcard{border:1px solid rgba(184,151,106,0.2);border-radius:8px;padding:24px;background:var(--cream);transition:all .3s;text-decoration:none;display:block}
        .mcard:hover{border-color:var(--gold);transform:translateY(-2px);box-shadow:0 12px 28px rgba(18,13,8,0.08)}
        .av{width:48px;height:48px;border-radius:50%;border:2px solid var(--gold);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:18px;color:var(--gold);background:rgba(184,151,106,0.1);margin-bottom:12px}
        .mname{font-family:'Cormorant Garamond',serif;font-size:22px;color:var(--ink);margin-bottom:3px}
        .mrel{font-size:11px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:12px}
        .mbtn{font-size:12px;color:var(--gold);letter-spacing:1px;text-transform:uppercase}
        .criar{border:1px dashed rgba(184,151,106,0.3);border-radius:8px;padding:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-decoration:none;min-height:148px;transition:all .3s}
        .criar:hover{border-color:var(--gold);background:rgba(184,151,106,0.04)}
        .ci{width:42px;height:42px;border-radius:50%;border:1.5px solid rgba(184,151,106,0.35);display:flex;align-items:center;justify-content:center;font-size:18px}
        .ct{font-size:13px;color:var(--muted);text-align:center}
        .ct strong{display:block;color:var(--ink);margin-bottom:2px}
        .planos{margin-top:48px}
        .planos h2{font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:300;color:var(--ink);margin-bottom:6px}
        .planos p{font-size:13px;color:var(--muted);margin-bottom:22px}
        .pgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .pc{border:1px solid rgba(184,151,106,0.2);border-radius:8px;padding:24px;transition:border-color .3s}
        .pc.dest{background:var(--ink);border-color:var(--gold)}
        .pn{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--gold);margin-bottom:10px}
        .pp{font-family:'Cormorant Garamond',serif;font-size:38px;font-weight:300;color:var(--ink);line-height:1;margin-bottom:3px}
        .pc.dest .pp{color:var(--cream)}
        .per{font-size:12px;color:var(--muted);margin-bottom:14px}
        .pc.dest .per{color:rgba(247,242,234,0.4)}
        .pf{list-style:none;display:flex;flex-direction:column;gap:8px;margin-bottom:18px}
        .pf li{font-size:13px;color:var(--muted);display:flex;gap:7px;line-height:1.5}
        .pc.dest .pf li{color:var(--gold2)}
        .ck{color:var(--gold);flex-shrink:0}
        .pb{display:block;width:100%;padding:13px;text-align:center;border-radius:2px;font-family:'DM Sans',sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;transition:all .3s}
        .pb-g{background:transparent;border:1px solid rgba(184,151,106,0.3);color:var(--ink)}
        .pb-g:hover{border-color:var(--gold);color:var(--gold)}
        .pb-s{background:var(--gold);color:var(--ink);font-weight:500}
        .pb-s:hover{background:var(--gold2)}
        @media(max-width:700px){nav{padding:0 20px}main{padding:24px}.pgrid{grid-template-columns:1fr}}
      `}</style>

      <nav>
        {/* FIX 4: logo sem erro — só texto sem link quebrado */}
        <span className="logo">alma<span>viva</span></span>
        <div className="nav-r">
          <span className="badge">{info.label}</span>
          <span className="nav-u">{perfil?.name || user?.email?.split('@')[0]}</span>
          <button className="btn-sair" onClick={sair}>Sair</button>
        </div>
      </nav>

      <main>
        <div className="uso">
          <div className="uso-info">
            <div className="uso-label">Mensagens usadas</div>
            <div className="uso-num">{msgsUsadas} <span>/ {msgsLimite === 99999 ? '∞' : msgsLimite}</span></div>
          </div>
          <div className="barra-wrap">
            <div className="barra-bg">
              <div className="barra-fill" style={{width:`${pct}%`,background:pct>80?'#DC2626':'var(--gold)'}} />
            </div>
            <div className="barra-txt">
              {msgsLimite === 99999 ? '✓ Mensagens ilimitadas ativas' : `${Math.max(0,msgsLimite-msgsUsadas)} mensagens restantes`}
            </div>
          </div>
          {planoAtual === 'gratuito' && (
            <a href={LINK_30_DIAS} target="_blank" rel="noopener noreferrer"
              style={{background:'var(--gold)',color:'var(--ink)',padding:'10px 18px',borderRadius:'2px',fontSize:'11px',letterSpacing:'1.5px',textTransform:'uppercase',textDecoration:'none',fontWeight:'500',whiteSpace:'nowrap'}}>
              Upgrade →
            </a>
          )}
        </div>

        <h1>Seus memoriais</h1>
        <p className="sub">Clique para conversar.</p>
        <div className="grid">
          {memoriais.map(m => (
            <Link key={m.id} href={`/chat/${m.id}`} className="mcard">
              <div className="av">{m.name[0]}</div>
              <div className="mname">{m.name}</div>
              <div className="mrel">{m.relationship}</div>
              <div className="mbtn">Conversar →</div>
            </Link>
          ))}
          {podecriar ? (
            <Link href="/criar-memorial" className="criar">
              <div className="ci">+</div>
              {/* FIX 5: texto atualizado */}
              <div className="ct"><strong>Criar meu memorial grátis</strong>Preserve mais uma presença</div>
            </Link>
          ) : (
            <div className="criar" style={{cursor:'default',opacity:.5}}>
              <div className="ci">🔒</div>
              <div className="ct"><strong>Limite atingido</strong>Faça upgrade para criar mais</div>
            </div>
          )}
        </div>

        {planoAtual === 'gratuito' && (
          <div className="planos">
            <h2>Escolha seu plano</h2>
            <p>Desbloqueie mais mensagens e recursos.</p>
            <div className="pgrid">
              <div className="pc">
                <div className="pn">Semanal</div>
                <div className="pp">R$19<span style={{fontSize:'16px',color:'var(--muted)'}}>,90</span></div>
                <div className="per">7 dias · 50 mensagens</div>
                <ul className="pf">
                  <li><span className="ck">✓</span>50 mensagens por semana</li>
                  <li><span className="ck">✓</span>Memoriais ilimitados</li>
                  <li><span className="ck">✓</span>Histórico completo</li>
                </ul>
                <a href={LINK_7_DIAS} target="_blank" rel="noopener noreferrer" className="pb pb-g">Assinar semanal</a>
              </div>
              <div className="pc dest">
                <div className="pn">Mensal ⭐ Mais popular</div>
                <div className="pp">R$39<span style={{fontSize:'16px',color:'var(--gold2)'}}>,90</span></div>
                <div className="per">30 dias · mensagens ilimitadas</div>
                <ul className="pf">
                  <li><span className="ck">✓</span>Mensagens ilimitadas</li>
                  <li><span className="ck">✓</span>Memoriais ilimitados</li>
                  <li><span className="ck">✓</span>Upload de áudios e fotos</li>
                  <li><span className="ck">✓</span>Compartilhar com família</li>
                </ul>
                <a href={LINK_30_DIAS} target="_blank" rel="noopener noreferrer" className="pb pb-s">Assinar mensal →</a>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
