# Controle Armazém ENCIVIL

Sistema web interno para controlo de materiais de armazém da empresa ENCIVIL.

**Estado: em produção.** [armazem-encivil.vercel.app](https://armazem-encivil.vercel.app)

---

## Objetivo do Sistema

Permitir que encarregados de armazém registem entradas e saídas de materiais de construção de forma rápida (menos de 10 segundos por operação), controlando stock em tempo real e gerando relatórios operacionais.

## Problema que Resolve

A ENCIVIL geria o stock de materiais em folhas de cálculo e registos manuais em papel, causando:

- Erros de contagem e stock incorreto
- Impossibilidade de rastrear quem levou o quê e para que obra
- Sem alertas de stock mínimo, levando a paragens de obra por falta de material
- Sem histórico fiável para relatórios de consumo por obra

## Público-alvo e Roles

| Role | Quem | Pode |
|------|------|------|
| `admin` | Administrador de TI / direção | Tudo: CRUD de produtos, configurações, promover/despromover roles, ver audit log |
| `gestor` | Encarregado de armazém, CEO (consulta) | Ver dashboard/produtos/histórico/relatórios, registar movimentos (entrada/saída/ajuste). Sem acesso a Configurações nem CRUD de produtos |

Role é definida na tabela `profiles` e aplicada via Row Level Security — não é apenas uma restrição de UI. Ver `docs/05-seguranca-e-acesso.md`.

---

## Stack Técnica

| Componente | Tecnologia |
|---|---|
| Frontend | React 18 + TypeScript + Vite 6 |
| Estilização | Tailwind CSS v4 |
| Roteamento | React Router v7 (bundle único, sem code-splitting por rota — ver ADR-008) |
| PWA | vite-plugin-pwa / Workbox — instalável em iOS e Android |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Hospedagem | Vercel (deploy automático em push para `main`) |

## Módulos Implementados

| Módulo | Descrição | Estado |
|---|---|---|
| Autenticação | Login/logout, sessão JWT, auto-logout por inatividade (30 min) | ✅ |
| Dashboard | Stats, alertas de stock, últimos movimentos | ✅ |
| Produtos | CRUD completo (admin), listagem com paginação, tab de arquivados | ✅ |
| Movimentos | Registo de entrada/saída/ajuste via RPC atómica | ✅ |
| Histórico | Listagem paginada (50/página) com filtros, incl. por produto via URL | ✅ |
| Relatórios | Consumo por período, produto, categoria e obra | ✅ |
| Configurações | Dados da empresa (admin apenas) | ✅ |
| PWA | Instalável, ícone, offline shell | ✅ |

---

## Como Executar Localmente

### Pré-requisitos

- Node.js 18+
- npm
- Conta Supabase com acesso ao projeto

### Instalação

```bash
git clone https://github.com/mickaelorlande/armazem-encivil.git
cd armazem-encivil
npm install
```

### Configuração

```bash
cp .env.example .env.local
# Editar .env.local com VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY
```

### Executar em desenvolvimento

```bash
npm run dev
```

### Build de produção

```bash
npm run build
```

---

## Variáveis de Ambiente

```env
VITE_SUPABASE_URL=https://wuruhxmbueeyhiqgvlxu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

> **Regra inegociável:** nunca usar a `service-role`/`secret` key no frontend. Apenas a `anon`/`publishable` key, que é segura para expor — a RLS + GRANTs a nível de coluna garantem o controlo de acesso real. Ver `docs/05-seguranca-e-acesso.md`.

---

## Estrutura do Código

Ver `docs/04-arquitetura.md` para a árvore completa e responsabilidades por camada. Resumo:

```
src/
├── app/          # Páginas, rotas, layout, componentes de UI
├── features/     # Lógica de negócio por módulo (auth, produtos, movimentos, dashboard, notificacoes, configuracoes)
├── integrations/supabase/   # Cliente Supabase + tipos gerados
├── hooks/        # Hooks partilhados (useCountUp, etc.)
└── styles/       # Tokens de tema ENCIVIL
supabase/
└── migrations/   # Todas as migrations SQL aplicadas em produção
```

---

## Regras Críticas de Negócio

1. Entrada **soma** ao stock atual. Saída **subtrai**. Ajuste define o valor exato.
2. Saída não pode ser superior ao stock disponível — bloqueada pela RPC `registar_movimento`.
3. Histórico de movimentos **nunca é apagado fisicamente**.
4. Todos os relatórios são calculados a partir de `movimentos_stock`, não de `produtos.stock_atual`.
5. Destino/obra é **obrigatório** para saídas.
6. Produto desativado não aparece em novos movimentos, mas mantém-se no histórico.
7. Mudança de role de utilizador só acontece via RPC `promover_role()` (admin-only, auditada) — nunca por update direto.

Detalhe completo em `docs/02-regras-de-negocio.md`.

---

## Segurança

Resumo — ver `docs/05-seguranca-e-acesso.md` para o detalhe completo:

- RLS ativa em todas as tabelas; GRANTs a nível de coluna em `profiles` (utilizador só edita `nome`, nunca `role`)
- RPCs sensíveis (`registar_movimento`, `promover_role`) verificam role no servidor com `SECURITY DEFINER`
- `audit_log` regista mudanças de role
- Headers de segurança no Vercel: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Auto-logout após 30 min de inatividade (compensação por falta de MFA no plano atual)
- Dependências sem CVEs conhecidos (`npm audit` limpo)
- Pre-commit hook bloqueia commits com padrões de segredo (`sb_secret-`, `service-role`, JWTs longos)

---

## Documentação

```
docs/
  00-source-of-truth.md       ← Ler sempre primeiro
  01-requisitos-funcionais.md
  02-regras-de-negocio.md
  03-modelo-de-dados.md
  04-arquitetura.md
  05-seguranca-e-acesso.md     ← Modelo de roles, RLS, RPCs, audit log
  06-ux-ui.md
  07-relatorios.md
  08-testes.md
  09-implantacao.md
  10-roadmap.md
  specs/SPEC-*.md              ← Spec funcional por módulo
  adrs/ADR-*.md                ← Decisões arquiteturais
TASKS/                          ← Backlog ativo (SEGURANÇA / UX / PERFORMANCE)
```

Ler `AGENTS.md` antes de contribuir com IA.
