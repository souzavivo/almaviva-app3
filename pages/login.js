import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Head from 'next/head'

export default function Login() {
  const [modo, setModo] = useState('login') // 'login' | 'cadastro' | 'recuperar'
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState(null)
  const [erro, setErro] = useState(null)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setErro(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

    if (error) {
      setErro('E-mail ou senha incorretos.')
    } else {
      window.location.href = '/dashboard'
    }
    setLoading(false)
  }

  async function handleCadastro(e) {
    e.preventDefault()
    setLoading(true)
    setErro(null)

    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { name: nome } }
    })

    if (error) {
      setErro(error.message === 'User already registered' ? 'Este e-mail já está cadastrado.' : 'Erro ao criar conta.')
    } else {
      setMensagem('Conta criada! Verifique seu e-mail para confirmar.')
    }
    setLoading(false)
  }

  async function handleRecuperar(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nova-senha`
    })
    setLoading(false)
    if (!error) setMensagem('E-mail de recuperação enviado! Verifique sua caixa de entrada.')
    else setErro('Erro ao enviar e-mail.')
  }

  return (
    <>
      <Head>
        <title>{modo === 'login' ? 'Entrar' : 'Criar conta'} — Almaviva</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root { --cream: #F7F2EA; --ink: #18130E; --muted: #7A6B5C; --gold: #B8976A; --gold2: #D4B896; --warm: #E8DDD0; }
        body { background: var(--cream); font-family: 'DM Sans', sans-serif; min-height: 100vh; display: flex; }
        
        .split { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; }
        
        .left { background: var(--ink); display: flex; flex-direction: column; justify-content: center; padding: 64px; position: relative; overflow: hidden; }
        .left-deco { position: absolute; font-family: 'Cormorant Garamond', serif; font-size: 300px; color: rgba(184,151,106,0.05); top: -60px; left: -40px; line-height: 1; pointer-events: none; }
        .left-logo { font-family: 'Cormorant Garamond', serif; font-size: 28px; letter-spacing: 3px; color: var(--cream); margin-bottom: 64px; position: relative; z-index: 1; text-decoration: none; display: block; }
        .left-logo span { color: var(--gold); }
        .left h2 { font-family: 'Cormorant Garamond', serif; font-size: 48px; font-weight: 300; line-height: 1.15; color: var(--cream); margin-bottom: 20px; position: relative; z-index: 1; }
        .left h2 em { font-style: italic; color: var(--gold); }
        .left p { font-size: 15px; color: rgba(247,242,234,0.45); line-height: 1.8; font-weight: 300; max-width: 360px; position: relative; z-index: 1; }
        
        .right { display: flex; flex-direction: column; justify-content: center; padding: 64px; }
        .form-wrap { max-width: 400px; width: 100%; }
        .form-title { font-family: 'Cormorant Garamond', serif; font-size: 36px; font-weight: 400; color: var(--ink); margin-bottom: 8px; }
        .form-sub { font-size: 13px; color: var(--muted); margin-bottom: 36px; }
        
        .field { margin-bottom: 18px; }
        label { display: block; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
        input { width: 100%; padding: 14px 16px; border: 1px solid rgba(184,151,106,0.25); border-radius: 2px; background: transparent; font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink); outline: none; transition: border-color .25s; }
        input:focus { border-color: var(--gold); }
        input::placeholder { color: var(--muted); opacity: .5; }
        
        .btn { width: 100%; padding: 15px; background: var(--ink); color: var(--cream); border: none; border-radius: 2px; font-family: 'DM Sans', sans-serif; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; transition: background .3s; margin-top: 8px; }
        .btn:hover:not(:disabled) { background: var(--gold); color: var(--ink); }
        .btn:disabled { opacity: .6; cursor: not-allowed; }
        
        .divider { display: flex; align-items: center; gap: 16px; margin: 24px 0; }
        .divider-line { flex: 1; height: 1px; background: rgba(184,151,106,0.2); }
        .divider span { font-size: 11px; color: var(--muted); letter-spacing: 1px; }
        
        .toggle { text-align: center; font-size: 13px; color: var(--muted); }
        .toggle button { background: none; border: none; color: var(--gold); cursor: pointer; font-size: 13px; font-family: 'DM Sans', sans-serif; text-decoration: underline; }
        
        .erro { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 4px; padding: 12px 14px; font-size: 13px; color: #991B1B; margin-bottom: 16px; }
        .sucesso { background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 4px; padding: 12px 14px; font-size: 13px; color: #166534; margin-bottom: 16px; }
        
        @media(max-width: 768px) {
          .split { grid-template-columns: 1fr; }
          .left { display: none; }
          .right { padding: 32px 24px; justify-content: flex-start; padding-top: 64px; }
        }
      `}</style>

      <div className="split">
        <div className="left">
          <div className="left-deco">♡</div>
          <a href="/" className="left-logo">alma<span>viva</span></a>
          <h2>A presença de quem<br />você ama, <em>sempre</em><br />ao seu lado.</h2>
          <p>Crie seu memorial e converse com quem partiu. Uma experiência única de memória, amor e tecnologia.</p>
        </div>

        <div className="right">
          <div className="form-wrap">
            {modo === 'login' && (
              <>
                <h1 className="form-title">Bem-vindo de volta</h1>
                <p className="form-sub">Entre na sua conta para acessar seus memoriais.</p>
                {erro && <div className="erro">{erro}</div>}
                {mensagem && <div className="sucesso">{mensagem}</div>}
                <form onSubmit={handleLogin}>
                  <div className="field">
                    <label>E-mail</label>
                    <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="field">
                    <label>Senha</label>
                    <input type="password" placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)} required />
                  </div>
                  <div style={{textAlign:'right', marginBottom:'8px'}}>
                    <button type="button" onClick={() => setModo('recuperar')} style={{background:'none',border:'none',color:'var(--muted)',fontSize:'12px',cursor:'pointer',textDecoration:'underline'}}>Esqueci minha senha</button>
                  </div>
                  <button className="btn" type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
                </form>
                <div className="divider"><div className="divider-line"></div><span>ou</span><div className="divider-line"></div></div>
                <div className="toggle">Não tem conta? <button onClick={() => { setModo('cadastro'); setErro(null); setMensagem(null) }}>Criar agora — é grátis</button></div>
              </>
            )}

            {modo === 'cadastro' && (
              <>
                <h1 className="form-title">Criar sua conta</h1>
                <p className="form-sub">Grátis. Sem cartão. Comece agora.</p>
                {erro && <div className="erro">{erro}</div>}
                {mensagem && <div className="sucesso">{mensagem}</div>}
                <form onSubmit={handleCadastro}>
                  <div className="field">
                    <label>Seu nome</label>
                    <input type="text" placeholder="Como você se chama?" value={nome} onChange={e => setNome(e.target.value)} required />
                  </div>
                  <div className="field">
                    <label>E-mail</label>
                    <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="field">
                    <label>Senha</label>
                    <input type="password" placeholder="Mínimo 6 caracteres" value={senha} onChange={e => setSenha(e.target.value)} minLength={6} required />
                  </div>
                  <button className="btn" type="submit" disabled={loading}>{loading ? 'Criando conta...' : 'Criar conta grátis →'}</button>
                </form>
                <div className="divider"><div className="divider-line"></div><span>ou</span><div className="divider-line"></div></div>
                <div className="toggle">Já tem conta? <button onClick={() => { setModo('login'); setErro(null); setMensagem(null) }}>Entrar</button></div>
              </>
            )}

            {modo === 'recuperar' && (
              <>
                <h1 className="form-title">Recuperar senha</h1>
                <p className="form-sub">Enviamos um link para você criar uma nova senha.</p>
                {erro && <div className="erro">{erro}</div>}
                {mensagem && <div className="sucesso">{mensagem}</div>}
                <form onSubmit={handleRecuperar}>
                  <div className="field">
                    <label>E-mail</label>
                    <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <button className="btn" type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Enviar link de recuperação'}</button>
                </form>
                <div className="divider"><div className="divider-line"></div></div>
                <div className="toggle"><button onClick={() => { setModo('login'); setErro(null); setMensagem(null) }}>← Voltar para o login</button></div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
