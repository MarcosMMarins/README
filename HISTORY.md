# Histórico de Desenvolvimento — Controle de Ativos Corporativos

**Projeto:** Sistema de Gestão de Ativos Corporativos  
**Empresa:** Moby Tecnologia  
**Período:** Julho de 2026  
**Responsável:** Marcos Miguel  

---

## Visão Geral

Sistema web completo para gestão de ativos corporativos, substituindo planilhas fragmentadas por uma plataforma centralizada com rastreabilidade, histórico de movimentações, controle de custódia e alertas de contratos.

**URLs de Produção**
- Frontend: https://frontend-wine-eight-90.vercel.app
- Backend API: https://backend-nu-eight-39.vercel.app
- Repositório: https://github.com/MarcosMMarins/README

---

## Stack Tecnológica

| Camada | Tecnologias |
|---|---|
| Frontend | Next.js 14 (App Router) · TypeScript · Tailwind CSS · TanStack React Query v5 |
| Backend | Node.js · Express · TypeScript · Mongoose |
| Banco de dados | MongoDB Atlas M0 (dev-cluster) |
| Autenticação | JWT 24h · bcryptjs |
| Formulários | react-hook-form · zod · @hookform/resolvers |
| Gráficos | recharts (PieChart, ResponsiveContainer) |
| UI | lucide-react · sonner · clsx |
| Deploy | Vercel (frontend + backend serverless) |

---

## Etapas de Desenvolvimento

### Etapa 1 — Setup e Autenticação
- Estrutura monorepo: `controle-ativos/backend` + `controle-ativos/frontend`
- Modelos Mongoose: `Usuario`, `Ativo`, `Movimentacao`, `Contrato`
- Backend: `POST /api/auth/login`, `GET /api/auth/me`, middleware `autenticar`, `apenasAdmin`
- Seed automático do admin (`admin@mobyweb.com.br` / `admin@123`) na primeira inicialização
- Frontend: página de login com react-hook-form + zod, `AuthContext`, sidebar, layout do dashboard
- Middleware Next.js para proteção de rotas privadas

### Etapa 2 — CRUD de Ativos
- Backend: listagem com filtros (status, categoria, busca por regex) e paginação, `GET /:id`, `POST` (auto-geração de código `MOB-001`, `MOB-002`…), `PUT /:id`, `DELETE /:id` (soft delete — status `baixado`)
- Cada operação registra `Movimentacao` de auditoria automaticamente
- Frontend: `/ativos` (tabela com search, filtros, paginação), `/ativos/novo`, `/ativos/[id]` (detalhe + edição inline + modal de baixa)
- Componentes: `StatusBadge`, `CategoriaBadge`, `Button`, `AtivoForm`
- Hooks: `useAtivos`, `useAtivo`, `useCriarAtivo`, `useAtualizarAtivo`, `useDarBaixa`

### Etapa 3 — Custódia e Alocação
- Backend: `PUT /api/ativos/:id/custodiar` (valida usuário ativo, registra transferência ou atualização), `GET /api/custodias/resumo` (ativos agrupados por responsável com valor total), CRUD `/api/usuarios`
- Frontend: `/custodias` (cards expansíveis por responsável, seção sem custódia, modal de atribuição rápida)
- Detalhe do ativo: modal para atribuir, transferir ou liberar custódia
- Hooks: `useUsuarios`, `useCustodiar`

### Etapa 4 — Histórico de Movimentações
- Backend: `GET /api/movimentacoes` com filtros (tipo, ativoId, intervalo de datas, paginação), `GET /api/ativos/:id/movimentacoes`
- Frontend: `/historico` com timeline agrupada por dia, filtros de tipo e datas
- Detalhe do ativo: seção de histórico com mini-timeline das últimas 10 movimentações
- Componentes: `TipoBadge`, mapa de cores `TIPO_DOT_CLS`
- Hook: `useMovimentacoes`

### Etapa 5 — Contratos, Garantias e Alertas
- Backend: CRUD completo `/api/contratos`, `GET /api/ativos/:id/contratos`, `GET /api/contratos/resumo`
- Status de vencimento calculado server-side: `vencido` · `critico` (≤7d) · `alerta` (≤15d) · `atencao` (≤30d) · `normal`
- Campo `diasParaVencer` retornado em todos os endpoints de contratos
- Frontend: `/contratos` com filtros rápidos (Vencidos / 7 dias / 30 dias), tabela, modais criar/editar/excluir
- Detalhe do ativo: seção de contratos com form inline e badges de vencimento coloridos
- Componente reutilizável `ContratoForm` com validação zod
- Hooks: `useContratos`, `useResumoContratos`, `useContratosAtivo`, `useCriarContrato`, `useAtualizarContrato`, `useRemoverContrato`

### Etapa 6 — Dashboard Executivo
- Backend: `GET /api/dashboard` — 12 queries paralelas via `Promise.all`
  - KPIs: total de ativos, valor total do parque (BRL), ativos sem custódia, total de usuários
  - Distribuição por status e por categoria (aggregates MongoDB)
  - Resumo de contratos: total, vencidos, críticos, em atenção, alertas (vencendo em 15d)
  - Movimentações recentes (últimas 8)
- Frontend: `/dashboard`
  - 4 cards KPI com links para páginas relevantes
  - Faixa de alerta para contratos críticos
  - Donut chart de categorias (recharts PieChart com legenda e percentuais)
  - Barras de progresso animadas por status
  - Tabela de movimentações recentes com timestamps relativos
  - Painel de resumo de contratos + contagem de usuários
- Hook `useDashboard` com `refetchInterval` de 5 minutos

### Etapa 7 — Deploy no Vercel
- `backend/vercel.json` configurado com `@vercel/node` + `maxDuration: 30` via `config` do builder
- `backend/.env.example` documentando as duas variantes de connection string (SRV para cloud, direta para rede corporativa)
- Monorepo único no GitHub — dois projetos Vercel separados com `Root Directory` apontando para `backend/` e `frontend/`
- Variáveis de ambiente configuradas via API REST do Vercel (evita problemas de encoding do pipe PowerShell)
- Atlas Network Access: `0.0.0.0/0` liberado para IPs dinâmicos do Vercel

---

## Decisões Técnicas Relevantes

### Conexão MongoDB — Rede Corporativa vs. Vercel
A rede corporativa da Moby (DNS `172.16.30.30`) bloqueia consultas DNS TCP, impedindo o uso da string `mongodb+srv://`. Solução: string de conexão direta com os 3 shards do Atlas:
```
mongodb://user:pass@ac-65sjrv9-shard-00-{00,01,02}.o9sa3dz.mongodb.net:27017/controle-ativos?ssl=true&authSource=admin
```
No Vercel (cloud), o DNS funciona normalmente — a mesma string direta também funciona.

### Serverless DB Pattern
Flag `isConnected` em `database.ts` reutiliza a conexão Mongoose entre invocações serverless, evitando abrir nova conexão a cada request.

### Autenticação — localStorage + Cookie
Token JWT armazenado no `localStorage` (para leitura client-side) e também como cookie `token` (para o middleware Next.js, que roda server-side e não tem acesso ao localStorage).

### next.config
Next.js 14.2.5 não suporta `next.config.ts`. Arquivo renomeado para `next.config.mjs`.

### vercel.json — builds vs. functions
Vercel CLI v55 não aceita `builds` e `functions` no mesmo arquivo. `maxDuration` configurado dentro do `config` do builder `@vercel/node`.

---

## Correções Aplicadas em Produção

| Data | Problema | Solução |
|---|---|---|
| 10/07/2026 | Formulário de login submetia como GET (hidratação quebrada por extensão do browser) | `suppressHydrationWarning` no `<html>` e `<body>` do layout |
| 10/07/2026 | Login bem-sucedido redirecionava de volta para `/login` | `salvarSessao` passou a gravar também cookie `token` lido pelo middleware |
| 10/07/2026 | `vercel.json` com `builds` + `functions` causava erro no deploy | `maxDuration` movido para `config` dentro de `builds` |
| 10/07/2026 | Variáveis de ambiente com caracteres inválidos no CORS header | Vars reconfiguradas via API REST do Vercel (evita encoding CRLF do PowerShell) |

---

## Credenciais Padrão

| Campo | Valor |
|---|---|
| E-mail admin | `admin@mobyweb.com.br` |
| Senha admin | `admin@123` |

> As credenciais reais do banco e o JWT secret ficam exclusivamente no `backend/.env` (não versionado) e nas variáveis de ambiente do projeto Vercel.
