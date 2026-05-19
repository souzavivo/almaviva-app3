import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Head from 'next/head'
import Link from 'next/link'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [memoriais, setMemoriais] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)

      const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setPerfil(p)

      const { data: m } = await supabase.from('memorials').select('*').eq('user_id', session.user.id).eq('is_active', true).order('created_at', { ascending: false })
      setMemoriais(m || [])
      setLoading(false)
    }
    init()
  }, [])

  async function sair() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const limiteMemoriais = { gratuito: 1, presenca: 3, legado: 999 }
  const podecriar = memoriais.length < (limiteMemoriais[perfil?.plan] || 1)

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F7F2EA',fontFamily:'DM Sans, sans-serif',color:'#7A6B5C'}}>
      Carregando seus memoriais...
    </div>
  )

  return (
    <>
      <Head>
        <title>Meus memoriais — Almaviva</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        * { margin:0; padding:0; box-sizing:border-box; }
        :root { --cream:#F7F2EA; --cream2:#EFE9DC; --ink:#18130E; --muted:#7A6B5C; --gold:#B8976A; --gold2:#D4B896; }
        body { background:var(--cream); font-family:'DM Sans',sans-serif; }
        nav { padding:0 48px; height:64px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(184,151,106,0.15); background:var(--cream); }
        .logo { font-family:'Cormorant Garamond',serif; font-size:22px; letter-spacing:3px; color:var(--ink); text-decoration:none; }
        .logo span { color:var(--gold); }
        .nav-right { display:flex; align-items:center; gap:20px; }
        .plan-badge { font-size:10px; letter-spacing:1.5px; text-transform:uppercase; padding:4px 12px; border-radius:20px; border:1px solid rgba(184,151,106,0.3); color:var(--gold); }
        .nav-user { font-size:13px; color:var(--muted); }
        .btn-sair { background:none; border:1px solid rgba(184,151,106,0.25); color:var(--muted); padding:8px 16px; border-radius:2px; font-size:12px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .25s; }
        .btn-sair:hover { border-color:var(--gold); color:var(--gold); }
        main { max-width:1000px; margin:0 auto; padding:48px; }
        .page-title { font-family:'Cormorant Garamond',serif; font-size:42px; font-weight:300; color:var(--ink); margin-bottom:8px; }
        .page-sub { font-size:14px; color:var(--muted); margin-bottom:40px; }
        .memoriais-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:20px; }
        .memorial-card { border:1px solid rgba(184,151,106,0.2); border-radius:8px; padding:28px; background:var(--cream); transition:all .3s; cursor:pointer; text-decoration:none; display:block; }
        .memorial-card:hover { border-color:var(--gold); transform:translateY(-2px); box-shadow:0 12px 32px rgba(18,13,8,0.08); }
        .memorial-avatar { width:56px; height:56px; border-radius:50%; border:2px solid var(--gold); display:flex; align-items:center; justify-content:center; font-family:'Cormorant Garamond',serif; font-size:22px; color:var(--gold); background:rgba(184,151,106,0.1); margin-bottom:16px; }
        .memorial-name { font-family:'Cormorant Garamond',serif; font-size:24px; font-weight:400; color:var(--ink); margin-bottom:4px; }
        .memorial-rel { font-size:12px; color:var(--muted); letter-spacing:1px; text-transform:uppercase; margin-bottom:16px; }
        .memorial-btn { display:inline-flex; align-items:center; gap:6px; font-size:12px; color:var(--gold); letter-spacing:1px; text-transform:uppercase; }
        .criar-card { border:1px dashed rgba(184,151,106,0.35); border-radius:8px; padding:28px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; cursor:pointer; transition:all .3s; text-decoration:none; min-height:160px; }
        .criar-card:hover { border-color:var(--gold); background:rgba(184,151,106,0.04); }
        .criar-icon { width:48px; height:48px; border-radius:50%; border:1.5px solid rgba(184,151,106,0.4); display:flex; align-items:center; justify-content:center; font-size:22px; }
        .criar-text { font-size:14px; color:var(--muted); text-align:center; }
        .criar-text strong { display:block; color:var(--ink); margin-bottom:4px; }
        .upgrade-banner { background:var(--ink); border-radius:8px; padding:20px 24px; margin-top:32px; display:flex; align-items:center; justify-content:space-between; gap:16px; }
        .upgrade-text h4 { font-family:'Cormorant Garamond',serif; font-size:20px; color:#F7F2EA; font-weight:400; margin-bottom:4px; }
        .upgrade-text p { font-size:12px; color:rgba(247,242,234,0.45); }
        .upgrade-btn { background:var(--gold); color:var(--ink); padding:12px 24px; border:none; border-radius:2px; font-size:11px; letter-spacing:2px; text-transform:uppercase; cursor:pointer; font-family:'DM Sans',sans-serif; white-space:nowrap; text-decoration:none; }
        @media(max-width:768px) { nav { padding:0 20px; } main { padding:24px; } }
      `}</style>

      <nav>
        <a href="/" className="logo">alma<span>viva</span></a>
        <div className="nav-right">
          <span className="plan-badge">{perfil?.plan || 'gratuito'}</span>
          <span className="nav-user">{perfil?.name || user?.email}</span>
          <button className="btn-sair" onClick={sair}>Sair</button>
        </div>
      </nav>

      <main>
        <h1 className="page-title">Seus memoriais</h1>
        <p className="page-sub">Cada memorial é uma presença única. Clique para conversar.</p>

        <div className="memoriais-grid">
          {memoriais.map(m => (
            <Link key={m.id} href={`/chat/${m.id}`} className="memorial-card">
              <div className="memorial-avatar">{m.name[0]}</div>
              <div className="memorial-name">{m.name}</div>
              <div className="memorial-rel">{m.relationship}</div>
              <div className="memorial-btn">Conversar →</div>
            </Link>
          ))}

          {podecriar ? (
            <Link href="/criar-memorial" className="criar-card">
              <div className="criar-icon">+</div>
              <div className="criar-text">
                <strong>Criar novo memorial</strong>
                Preserve mais uma presença
              </div>
            </Link>
          ) : (
            <div className="criar-card" style={{cursor:'default',opacity:.6}}>
              <div className="criar-icon">🔒</div>
              <div className="criar-text">
                <strong>Limite do plano atingido</strong>
                Faça upgrade para criar mais memoriais
              </div>
            </div>
          )}
        </div>

        {perfil?.plan === 'gratuito' && (
          <div className="upgrade-banner">
            <div className="upgrade-text">
              <h4>Quer mais memórias e mensagens ilimitadas?</h4>
              <p>Faça upgrade para o plano Presença por R$49/mês e desbloqueie tudo.</p>
            </div>
            <a href="/planos" className="upgrade-btn">Ver planos</a>
          </div>
        )}
      </main>
    </>
  )
}
