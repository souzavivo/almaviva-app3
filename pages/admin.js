import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Head from 'next/head'

// ⚠️ COLOQUE SEU EMAIL AQUI — só você terá acesso
const ADMIN_EMAIL = 'juninhozika510@gmail.com'

const PLANOS = ['gratuito', 'presenca', 'legado']
const LABEL_PLANO = {
  gratuito: { label: 'Gratuito',    cor: '#7A6B5C', bg: 'rgba(122,107,92,0.1)'  },
  presenca:  { label: 'Mensal 30d', cor: '#B8976A', bg: 'rgba(184,151,106,0.15)' },
  legado:    { label: 'Semanal 7d', cor: '#D4B896', bg: 'rgba(212,184,150,0.15)' },
}

export default function Admin() {
  const [user, setUser]           = useState(null)
  const [autorizado, setAutorizado] = useState(false)
  const [usuarios, setUsuarios]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [busca, setBusca]         = useState('')
  const [salvando, setSalvando]   = useState(null)
  const [toast, setToast]         = useState(null)
  const [filtroPlano, setFiltroPlano] = useState('todos')
  const [stats, setStats]         = useState(null)

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)

      if (session.user.email !== ADMIN_EMAIL) {
        setAutorizado(false)
        setLoading(false)
        return
      }
      setAutorizado(true)
      await carregarDados()
    }
    init()
  }, [])

  async function carregarDados() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin-users', {
        headers: { 'x-admin-email': ADMIN_EMAIL }
      })
      const data = await res.json()
      const perfis = data.perfis || []
      setUsuarios(perfis)
      const total = perfis.length
      const gratuitos = perfis.filter(p => !p.plan || p.plan === 'gratuito').length
      const pagantes  = perfis.filter(p => p.plan && p.plan !== 'gratuito').length
      const mensagensHoje = perfis.reduce((acc, p) => acc + (p.usage_control?.[0]?.messages_today || 0), 0)
      setStats({ total, gratuitos, pagantes, mensagensHoje })
    } catch(err) {
      console.error('Erro admin:', err)
    }
    setLoading(false)
  }

  async function mudarPlano(userId, novoPlano) {
    setSalvando(userId)
    const { error } = await supabase
      .from('profiles')
      .update({ plan: novoPlano, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (!error) {
      setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, plan: novoPlano } : u))
      mostrarToast(`Plano atualizado para ${LABEL_PLANO[novoPlano].label}!`, 'ok')
    } else {
      mostrarToast('Erro ao atualizar plano.', 'erro')
    }
    setSalvando(null)
  }

  async function resetarMensagens(userId, nome) {
    if (!confirm(`Resetar contador de mensagens de ${nome}?`)) return
    setSalvando(userId)
    const { error } = await supabase
      .from('usage_control')
      .update({ messages_this_month: 0, messages_today: 0 })
      .eq('user_id', userId)

    if (!error) {
      setUsuarios(prev => prev.map(u =>
        u.id === userId
          ? { ...u, usage_control: [{ ...u.usage_control?.[0], messages_this_month: 0, messages_today: 0 }] }
          : u
      ))
      mostrarToast('Mensagens resetadas!', 'ok')
    }
    setSalvando(null)
  }

  function mostrarToast(msg, tipo) {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  const usuariosFiltrados = usuarios.filter(u => {
    const buscaOk = busca === '' ||
      u.name?.toLowerCase().includes(busca.toLowerCase()) ||
      u.email?.toLowerCase().includes(busca.toLowerCase())
    const planoOk = filtroPlano === 'todos' || u.plan === filtroPlano
    return buscaOk && planoOk
  })

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F7F2EA',fontFamily:'DM Sans,sans-serif',color:'#7A6B5C'}}>
      Carregando painel...
    </div>
  )

  if (!autorizado) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F7F2EA',fontFamily:'DM Sans,sans-serif',flexDirection:'column',gap:'12px'}}>
      <div style={{fontSize:'32px'}}>🔒</div>
      <div style={{fontSize:'16px',color:'#18130E'}}>Acesso restrito</div>
      <a href="/dashboard" style={{fontSize:'13px',color:'#B8976A'}}>Voltar ao dashboard</a>
    </div>
  )

  return (
    <>
      <Head>
        <title>Admin — Almaviva</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        :root{--cream:#F7F2EA;--cream2:#EFE9DC;--ink:#18130E;--muted:#7A6B5C;--gold:#B8976A;--gold2:#D4B896}
        body{background:var(--cream);font-family:'DM Sans',sans-serif;min-height:100vh}
        nav{padding:0 40px;height:60px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(184,151,106,0.15);background:var(--ink);position:sticky;top:0;z-index:50}
        .logo{font-family:'Cormorant Garamond',serif;font-size:20px;letter-spacing:3px;color:#F7F2EA;text-decoration:none}
        .logo span{color:var(--gold)}
        .nav-r{display:flex;align-items:center;gap:12px}
        .nav-badge{font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:3px 10px;border-radius:20px;background:rgba(184,151,106,0.2);color:var(--gold);border:1px solid rgba(184,151,106,0.3)}
        .nav-link{font-size:12px;color:rgba(247,242,234,0.5);text-decoration:none;transition:color .2s}
        .nav-link:hover{color:var(--gold)}

        main{max-width:1200px;margin:0 auto;padding:36px 40px}

        /* STATS */
        .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:32px}
        .stat{background:white;border:1px solid rgba(184,151,106,0.15);border-radius:10px;padding:20px 22px}
        .stat-n{font-family:'Cormorant Garamond',serif;font-size:44px;font-weight:300;color:var(--ink);line-height:1;margin-bottom:4px}
        .stat-l{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted)}
        .stat-sub{font-size:12px;color:var(--gold);margin-top:4px}

        /* FILTROS */
        .filtros{display:flex;gap:12px;margin-bottom:20px;align-items:center;flex-wrap:wrap}
        .busca{flex:1;min-width:200px;padding:10px 14px;border:1px solid rgba(184,151,106,0.25);border-radius:6px;background:white;font-family:'DM Sans',sans-serif;font-size:14px;color:var(--ink);outline:none;transition:border-color .2s}
        .busca:focus{border-color:var(--gold)}
        .busca::placeholder{color:var(--muted);opacity:.6}
        .filtro-btns{display:flex;gap:6px}
        .fb{padding:8px 14px;border-radius:6px;font-size:12px;letter-spacing:.5px;cursor:pointer;border:1px solid rgba(184,151,106,0.2);background:white;color:var(--muted);font-family:'DM Sans',sans-serif;transition:all .2s}
        .fb.ativo{background:var(--ink);color:var(--gold);border-color:var(--ink)}
        .btn-refresh{padding:9px 16px;background:transparent;border:1px solid rgba(184,151,106,0.3);border-radius:6px;color:var(--muted);font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s}
        .btn-refresh:hover{border-color:var(--gold);color:var(--gold)}

        /* TABELA */
        .tabela-wrap{background:white;border:1px solid rgba(184,151,106,0.15);border-radius:10px;overflow:hidden}
        .tabela-header{display:grid;grid-template-columns:2fr 1.2fr 1fr 1fr 1.5fr 1fr;gap:0;padding:12px 20px;background:var(--cream2);border-bottom:1px solid rgba(184,151,106,0.15)}
        .th{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);font-weight:500}
        .linha{display:grid;grid-template-columns:2fr 1.2fr 1fr 1fr 1.5fr 1fr;gap:0;padding:14px 20px;border-bottom:1px solid rgba(184,151,106,0.08);align-items:center;transition:background .2s}
        .linha:last-child{border-bottom:none}
        .linha:hover{background:rgba(184,151,106,0.03)}
        .user-info{}
        .user-name{font-size:14px;font-weight:500;color:var(--ink);margin-bottom:2px}
        .user-email{font-size:12px;color:var(--muted)}
        .plano-tag{display:inline-block;font-size:10px;letter-spacing:1px;text-transform:uppercase;padding:3px 10px;border-radius:20px;font-weight:500}
        .msgs-num{font-size:14px;color:var(--ink);font-weight:500}
        .msgs-sub{font-size:11px;color:var(--muted);margin-top:1px}
        .data{font-size:12px;color:var(--muted)}
        .acoes{display:flex;gap:6px;flex-wrap:wrap}

        /* SELECT DE PLANO */
        .plano-select{padding:6px 10px;border:1px solid rgba(184,151,106,0.25);border-radius:6px;font-family:'DM Sans',sans-serif;font-size:12px;color:var(--ink);background:white;cursor:pointer;outline:none;transition:border-color .2s}
        .plano-select:focus{border-color:var(--gold)}
        .btn-salvar{padding:6px 12px;background:var(--gold);color:var(--ink);border:none;border-radius:6px;font-size:11px;font-family:'DM Sans',sans-serif;cursor:pointer;font-weight:500;transition:background .2s;letter-spacing:.5px}
        .btn-salvar:hover{background:var(--gold2)}
        .btn-salvar:disabled{opacity:.5;cursor:not-allowed}
        .btn-reset{padding:6px 10px;background:transparent;color:var(--muted);border:1px solid rgba(184,151,106,0.2);border-radius:6px;font-size:11px;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .2s}
        .btn-reset:hover{border-color:#DC2626;color:#DC2626}

        /* TOAST */
        .toast{position:fixed;bottom:28px;right:28px;padding:13px 20px;border-radius:8px;font-size:13px;font-weight:500;z-index:200;animation:slideIn .3s ease;box-shadow:0 8px 24px rgba(0,0,0,0.15)}
        .toast.ok{background:var(--ink);color:var(--gold)}
        .toast.erro{background:#DC2626;color:white}
        .vazio{padding:48px;text-align:center;color:var(--muted);font-size:14px}

        @keyframes slideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:900px){
          main{padding:20px}
          .stats{grid-template-columns:1fr 1fr}
          .tabela-header,.linha{grid-template-columns:1.5fr 1fr 1fr 1.2fr;gap:8px}
          .th:nth-child(4),.linha>div:nth-child(4),.th:last-child,.linha>div:last-child{display:none}
          nav{padding:0 20px}
        }
      `}</style>

      {toast && <div className={`toast ${toast.tipo}`}>{toast.msg}</div>}

      <nav>
        <a href="/dashboard" className="logo">alma<span>viva</span> <span style={{fontSize:'13px',letterSpacing:'1px',opacity:.5}}>/ admin</span></a>
        <div className="nav-r">
          <span className="nav-badge">Painel Admin</span>
          <a href="/dashboard" className="nav-link">← Dashboard</a>
        </div>
      </nav>

      <main>
        {/* STATS */}
        {stats && (
          <div className="stats">
            <div className="stat">
              <div className="stat-n">{stats.total}</div>
              <div className="stat-l">Total de usuários</div>
            </div>
            <div className="stat">
              <div className="stat-n">{stats.pagantes}</div>
              <div className="stat-l">Usuários pagantes</div>
              <div className="stat-sub">R${(stats.pagantes * 39.90).toFixed(2).replace('.',',')} MRR estimado</div>
            </div>
            <div className="stat">
              <div className="stat-n">{stats.gratuitos}</div>
              <div className="stat-l">Plano gratuito</div>
              <div className="stat-sub">{stats.total > 0 ? Math.round((stats.gratuitos/stats.total)*100) : 0}% dos usuários</div>
            </div>
            <div className="stat">
              <div className="stat-n">{stats.mensagensHoje}</div>
              <div className="stat-l">Mensagens hoje</div>
            </div>
          </div>
        )}

        {/* FILTROS */}
        <div className="filtros">
          <input
            className="busca"
            placeholder="Buscar por nome ou e-mail..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
          <div className="filtro-btns">
            {['todos','gratuito','presenca','legado'].map(p => (
              <button key={p} className={`fb ${filtroPlano === p ? 'ativo' : ''}`} onClick={() => setFiltroPlano(p)}>
                {p === 'todos' ? 'Todos' : LABEL_PLANO[p]?.label}
              </button>
            ))}
          </div>
          <button className="btn-refresh" onClick={carregarDados}>↻ Atualizar</button>
        </div>

        {/* TABELA */}
        <div className="tabela-wrap">
          <div className="tabela-header">
            <div className="th">Usuário</div>
            <div className="th">Plano atual</div>
            <div className="th">Mensagens</div>
            <div className="th">Cadastro</div>
            <div className="th">Mudar plano</div>
            <div className="th">Ações</div>
          </div>

          {usuariosFiltrados.length === 0 && (
            <div className="vazio">Nenhum usuário encontrado.</div>
          )}

          {usuariosFiltrados.map(u => {
            const plano = u.plan || 'gratuito'
            const info  = LABEL_PLANO[plano] || LABEL_PLANO.gratuito
            const msgs  = u.usage_control?.[0]?.messages_this_month || 0
            const hoje  = u.usage_control?.[0]?.messages_today || 0
            const data  = u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '—'

            return (
              <div key={u.id} className="linha">
                <div className="user-info">
                  <div className="user-name">{u.name || '—'}</div>
                  <div className="user-email">{u.email}</div>
                </div>

                <div>
                  <span className="plano-tag" style={{background: info.bg, color: info.cor}}>
                    {info.label}
                  </span>
                </div>

                <div>
                  <div className="msgs-num">{msgs}</div>
                  <div className="msgs-sub">{hoje} hoje</div>
                </div>

                <div className="data">{data}</div>

                <div className="acoes">
                  <PlanoSelector
                    planoAtual={plano}
                    salvando={salvando === u.id}
                    onSalvar={(novo) => mudarPlano(u.id, novo)}
                  />
                </div>

                <div>
                  <button className="btn-reset" onClick={() => resetarMensagens(u.id, u.name || u.email)} disabled={salvando === u.id}>
                    Reset msgs
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{marginTop:'16px',fontSize:'12px',color:'var(--muted)',textAlign:'right'}}>
          {usuariosFiltrados.length} de {usuarios.length} usuários
        </div>
      </main>
    </>
  )
}

function PlanoSelector({ planoAtual, salvando, onSalvar }) {
  const [selecionado, setSelecionado] = useState(planoAtual)

  useEffect(() => { setSelecionado(planoAtual) }, [planoAtual])

  const mudou = selecionado !== planoAtual

  return (
    <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
      <select className="plano-select" value={selecionado} onChange={e => setSelecionado(e.target.value)}>
        <option value="gratuito">Gratuito</option>
        <option value="presenca">Mensal 30d</option>
        <option value="legado">Semanal 7d</option>
      </select>
      {mudou && (
        <button className="btn-salvar" onClick={() => onSalvar(selecionado)} disabled={salvando}>
          {salvando ? '...' : 'Salvar'}
        </button>
      )}
    </div>
  )
}
