# Controle de Ativos — Moby Tecnologia

Sistema de gestão de ativos corporativos. Stack: **Next.js** (frontend) + **Express + Mongoose** (backend) + **MongoDB Atlas**.

---

## Pré-requisitos

- Node.js 20+
- Conta no [MongoDB Atlas](https://cloud.mongodb.com) (free tier — 512MB)
- Conta no [Vercel](https://vercel.com) (deploy)

---

## 1. Configurar o Backend

```bash
cd backend
npm install

# Copie e edite o .env
cp .env.example .env
# Edite: MONGODB_URI, JWT_SECRET, FRONTEND_URL
```

Inicie o backend localmente:

```bash
npm run dev
# Rodando em http://localhost:3001
# Teste: GET http://localhost:3001/api/health
```

**Primeiro acesso criado automaticamente:**
- E-mail: `admin@mobyweb.com.br`
- Senha: `admin@123`

---

## 2. Configurar o Frontend

```bash
cd frontend
npm install

# Copie e edite o .env.local
cp .env.local.example .env.local
# Edite: NEXT_PUBLIC_API_URL=http://localhost:3001
```

Inicie o frontend:

```bash
npm run dev
# Acessar: http://localhost:3000
```

---

## 3. Testar o Setup

1. Acesse `http://localhost:3000` → redireciona para `/login`
2. Faça login com `admin@mobyweb.com.br` / `admin@123`
3. Dashboard deve carregar ✓

---

## 4. Deploy no Vercel

### Backend
```bash
cd backend
npx vercel --prod
# Defina as variáveis de ambiente no painel Vercel:
# MONGODB_URI, JWT_SECRET, FRONTEND_URL
```

### Frontend
```bash
cd frontend
npx vercel --prod
# Defina: NEXT_PUBLIC_API_URL=https://<seu-backend>.vercel.app
```

---

## Estrutura

```
controle-ativos/
├── backend/
│   ├── api/index.ts          # Entry point Vercel
│   ├── src/
│   │   ├── app.ts            # Express app
│   │   ├── server.ts         # Dev local
│   │   ├── config/           # DB + Seed
│   │   ├── controllers/      # Lógica das rotas
│   │   ├── middleware/       # Auth + Erros
│   │   ├── models/           # Mongoose schemas
│   │   ├── routes/           # Routers Express
│   │   └── types/            # Interfaces TS
│   └── vercel.json
└── frontend/
    └── src/
        ├── app/              # Páginas (Next.js App Router)
        ├── components/       # UI + Layout
        ├── context/          # AuthContext
        ├── lib/              # API client + auth helpers
        └── types/            # Interfaces TS compartilhadas
```
