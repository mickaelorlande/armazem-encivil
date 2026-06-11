# Arquitetura — Controle Armazém ENCIVIL

---

## Visão Geral

Arquitetura frontend-only (SPA) com backend gerido pelo Supabase. Sem servidor dedicado.

```
┌─────────────────────────────────────────┐
│               Browser                   │
│   React + TypeScript + Vite (SPA)       │
│                                         │
│  ┌──────────┐  ┌──────────────────────┐ │
│  │  React   │  │   React Router v7    │ │
│  │  Estado  │  │   (client-side)      │ │
│  └──────────┘  └──────────────────────┘ │
└────────────────────┬────────────────────┘
                     │ HTTPS / REST / WebSocket
                     ▼
┌─────────────────────────────────────────┐
│              Supabase                   │
│                                         │
│  ┌──────────┐  ┌──────────────────────┐ │
│  │  Auth    │  │  PostgreSQL + RLS    │ │
│  │ (JWT)    │  │  (Base de dados)     │ │
│  └──────────┘  └──────────────────────┘ │
│  ┌──────────┐                           │
│  │ Storage  │  (logótipo, futuro)       │
│  └──────────┘                           │
└─────────────────────────────────────────┘
                     │
                     ▼ Deploy
┌─────────────────────────────────────────┐
│                Vercel                   │
│  (CDN global, HTTPS automático, CI/CD)  │
└─────────────────────────────────────────┘
```

---

## Stack Completa

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| UI Framework | React | 18 |
| Linguagem | TypeScript | 5 |
| Build Tool | Vite | 6 |
| Estilização | Tailwind CSS | 4 |
| Roteamento | React Router | 7 |
| Backend | Supabase | Cloud |
| Autenticação | Supabase Auth | — |
| Base de dados | Supabase PostgreSQL | 15+ |
| Segurança | Supabase RLS | — |
| Deploy | Vercel | — |

---

## Organização do Código

```
src/
├── app/                          # Camada de aplicação
│   ├── App.tsx                   # Ponto de entrada React
│   ├── routes.tsx                # Definição de rotas
│   ├── types.ts                  # Tipos partilhados da app
│   ├── layouts/
│   │   └── MainLayout.tsx        # Layout com sidebar + header
│   ├── pages/                    # Páginas / rotas
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── ProductDetailPage.tsx
│   │   ├── NewMovementPage.tsx
│   │   ├── HistoryPage.tsx
│   │   ├── ReportsPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── DocsPage.tsx
│   ├── components/               # Componentes de UI reutilizáveis
│   │   ├── ui/                   # Primitivos (shadcn/ui + Radix)
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── StatCard.tsx
│   │   ├── StockBadge.tsx
│   │   └── MovementTypeBadge.tsx
│   └── data/
│       └── mockData.ts           # Dados mock (substituir por Supabase)
│
├── features/                     # Lógica de negócio por módulo
│   ├── auth/
│   │   ├── hooks/
│   │   │   └── useAuth.ts        # Hook de autenticação
│   │   └── services/
│   │       └── authService.ts    # Login, logout, sessão
│   ├── produtos/
│   │   ├── components/           # Componentes específicos de produtos
│   │   ├── hooks/
│   │   │   └── useProdutos.ts
│   │   ├── services/
│   │   │   └── produtosService.ts  # CRUD produtos
│   │   └── types.ts
│   ├── movimentos/
│   │   ├── components/
│   │   ├── hooks/
│   │   │   └── useMovimentos.ts
│   │   ├── services/
│   │   │   └── movimentosService.ts  # Registar entrada/saída/ajuste
│   │   └── types.ts
│   ├── relatorios/
│   │   ├── services/
│   │   │   └── relatoriosService.ts  # Queries de relatórios
│   │   └── types.ts
│   └── configuracoes/
│       └── services/
│           └── configuracoesService.ts
│
├── integrations/
│   └── supabase/
│       ├── client.ts             # Inicialização do cliente Supabase
│       ├── types.ts              # Tipos gerados (supabase gen types)
│       └── queries/              # Queries SQL reutilizáveis
│           ├── produtos.ts
│           ├── movimentos.ts
│           └── relatorios.ts
│
├── shared/
│   ├── hooks/
│   │   └── useDebounce.ts
│   └── components/
│       └── LoadingSpinner.tsx
│
├── utils/
│   ├── date.ts                   # Formatação de datas (Europe/Lisbon)
│   ├── stock.ts                  # Cálculos de stock
│   └── format.ts                 # Formatação de números e textos
│
└── styles/
    ├── theme.css                 # Tokens de design ENCIVIL
    └── fonts.css                 # Importações de fontes
```

---

## Responsabilidades por Camada

### `app/pages/`
- Páginas de alto nível; composição de componentes.
- **Não** contém lógica de negócio — delega para `features/`.
- Apenas UI, navegação e estado local de formulário.

### `app/components/`
- Componentes visuais reutilizáveis sem lógica de negócio.
- Aceitam dados por props; não chamam Supabase diretamente.

### `features/*/services/`
- Toda a lógica de negócio e comunicação com Supabase.
- Funções puras sempre que possível.
- Validações de regras de negócio aqui (ex: stock insuficiente).

### `features/*/hooks/`
- React hooks que encapsulam estado e chamadas aos services.
- Expõem `data`, `loading`, `error` e funções de mutação.

### `integrations/supabase/`
- Cliente Supabase configurado com variáveis de ambiente.
- Tipos gerados automaticamente pelo CLI Supabase.
- Queries SQL reutilizáveis (evitar SQL inline nos services).

### `utils/`
- Funções puras utilitárias sem dependências de React.
- Formatação, cálculos, manipulação de datas.

---

## Regra para Agents

> **Agents não devem misturar regra de negócio dentro de componentes visuais quando puder ser isolada em services/utils.**

Correto:
```ts
// features/movimentos/services/movimentosService.ts
export function validarSaida(quantidade: number, stockAtual: number) {
  if (quantidade > stockAtual) throw new Error('Stock insuficiente');
}
```

Errado:
```tsx
// app/pages/NewMovementPage.tsx — NÃO fazer isto
if (quantidade > produto.stock_atual) {
  setErro('Stock insuficiente');
}
```

---

## Fluxo de Dados

```
Utilizador interage com Page
  → Page chama hook (features/*/hooks/)
    → Hook chama service (features/*/services/)
      → Service chama Supabase (integrations/supabase/)
        → Supabase executa query + RLS
          → Resultado volta ao hook
            → Hook atualiza estado React
              → Page re-renderiza
```
