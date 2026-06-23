# Setup — Signum Inspeções

## 1. Criar projeto no Supabase

1. Aceder a https://supabase.com e criar conta com Google
2. Clicar em **New project**
3. Dar um nome (ex: `signum-inspecoes`) e escolher região Europa
4. Guardar a palavra-passe do projeto

## 2. Criar as tabelas

1. No painel do Supabase, ir a **SQL Editor**
2. Clicar em **New query**
3. Copiar o conteúdo de `supabase/schema.sql` e executar

## 3. Configurar variáveis de ambiente

1. No Supabase, ir a **Settings → API**
2. Copiar:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Editar o ficheiro `.env.local` com os valores reais

## 4. Criar o primeiro utilizador (admin)

1. No Supabase, ir a **Authentication → Users**
2. Clicar em **Add user → Create new user**
3. Preencher email e palavra-passe
4. Após criação, ir a **Table Editor → profiles**
5. Encontrar o utilizador e mudar o campo `role` para `admin`

## 5. Correr localmente

```bash
npm run dev
```

Aceder a http://localhost:3000

## 6. Deploy no Vercel

1. Aceder a https://vercel.com e criar conta com GitHub
2. Importar o repositório
3. Em **Environment Variables**, adicionar as mesmas variáveis do `.env.local`
4. Deploy automático a cada push para o repositório
