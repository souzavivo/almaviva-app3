# Almaviva — Guia de Deploy Completo

## O que está neste projeto

```
almaviva-app/
├── pages/
│   ├── _app.js              ← Necessário para o Next.js
│   ├── login.js             ← Página de login e cadastro
│   ├── dashboard.js         ← Painel do usuário com memoriais
│   ├── criar-memorial.js    ← Formulário de criação (5 etapas)
│   └── chat/
│       └── [id].js          ← Chat com a IA
├── pages/api/
│   ├── chat.js              ← API da IA (Groq)
│   └── waitlist.js          ← API da lista de espera
├── lib/
│   └── supabase.js          ← Cliente do banco de dados
├── package.json
├── next.config.js
└── .env.example             ← Modelo das variáveis de ambiente
```

---

## PASSO A PASSO DE DEPLOY

### 1. Criar repositório no GitHub

1. Acesse github.com
2. Clique em **+** → **New repository**
3. Nome: `almaviva-app`
4. Visibility: **Public**
5. Clique em **Create repository**

### 2. Fazer upload de TODOS os arquivos

No repositório criado:
- Clique em **Add file** → **Upload files**
- Faça upload de TODOS os arquivos mantendo a estrutura de pastas
- Clique em **Commit changes**

**IMPORTANTE:** Mantenha a estrutura de pastas exatamente assim:
- `pages/` com todos os .js dentro
- `pages/api/` com chat.js e waitlist.js
- `pages/chat/` com [id].js
- `lib/` com supabase.js
- `package.json` e `next.config.js` na raiz

### 3. Publicar na Vercel

1. Acesse vercel.com → **Add New Project**
2. Importe o repositório `almaviva-app`
3. **NÃO clique em Deploy ainda**

### 4. Configurar variáveis de ambiente na Vercel

Antes de fazer deploy, adicione em **Environment Variables**:

```
NEXT_PUBLIC_SUPABASE_URL        = https://nqfldsqwwboixsivvsle.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY   = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY       = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GROQ_API_KEY                    = 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
```

Quando tiver o Stripe, adicione também:
```
STRIPE_SECRET_KEY               = sk_test_...
NEXT_PUBLIC_STRIPE_PUBLIC_KEY   = pk_test_...
STRIPE_PRICE_PRESENCA           = price_...
STRIPE_PRICE_LEGADO             = price_...
```

### 5. Fazer deploy

Clique em **Deploy** e aguarde ~2 minutos.

Seu site estará em: `almaviva-app.vercel.app`

---

## CONFIGURAR O SUPABASE

### Rodar o SQL do banco

1. Acesse supabase.com → seu projeto almaviva
2. Menu lateral → **SQL Editor**
3. Cole o conteúdo do arquivo `banco_de_dados.sql`
4. Clique em **Run**
5. Deve aparecer: `Success`

### Ativar o e-mail de confirmação (opcional no início)

Para facilitar os testes, você pode desativar a confirmação de e-mail:
1. Supabase → **Authentication** → **Settings**
2. Desmarque **Enable email confirmations**
3. Salve

---

## FLUXO DO USUÁRIO

```
/ (landing page index.html)
    ↓ clica em "Criar memorial grátis"
/login (cadastro)
    ↓ cria conta
/dashboard (lista de memoriais)
    ↓ clica em "Criar novo memorial"
/criar-memorial (formulário 5 etapas)
    ↓ salva
/chat/[id] (conversa com a IA)
```

---

## CUSTOS MENSAIS (MVP)

| Serviço | Plano | Custo |
|---------|-------|-------|
| Vercel | Hobby | R$ 0 |
| Supabase | Free | R$ 0 |
| Groq API | Free tier | R$ 0 |
| Domínio .com.br | - | R$ 50/ano |
| **TOTAL** | | **~R$ 4/mês** |

---

## PRÓXIMOS PASSOS

- [ ] Configurar Stripe para pagamentos
- [ ] Adicionar upload de áudios
- [ ] Integrar ElevenLabs para voz clonada
- [ ] Adicionar painel administrativo
