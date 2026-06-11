# Controle Armazém ENCIVIL

Sistema web interno para controlo de materiais de armazém da empresa ENCIVIL.

---

## Objetivo do Sistema

Permitir que encarregados de armazém registem entradas e saídas de materiais de construção de forma rápida (menos de 10 segundos por operação), controlando stock em tempo real e gerando relatórios operacionais.

## Problema que Resolve

A ENCIVIL geria o stock de materiais em folhas de cálculo e registos manuais em papel, causando:

- Erros de contagem e stock incorreto
- Impossibilidade de rastrear quem levou o quê e para que obra
- Sem alertas de stock mínimo, levando a paragens de obra por falta de material
- Sem histórico fiável para relatórios de consumo por obra

## Público-alvo

- Encarregado de armazém (utilizador principal, pouca experiência informática)
- Gestor da empresa (consulta relatórios)

---

## Stack Técnica

| Componente       | Tecnologia                 |
|-----------------|---------------------------|
| Frontend        | React 18 + TypeScript + Vite |
| Estilização     | Tailwind CSS v4            |
| Roteamento      | React Router v7            |
| Backend         | Supabase                   |
| Autenticação    | Supabase Auth              |
| Base de dados   | Supabase PostgreSQL + RLS  |
| Deploy          | Vercel                     |
| Exportação      | PDF/Excel (Fase 2)         |

---

## Módulos Principais

| Módulo         | Descrição                                           |
|---------------|-----------------------------------------------------|
| Autenticação  | Login/logout com sessão protegida                   |
| Dashboard     | Visão geral: stats, alertas e últimos movimentos    |
| Produtos      | CRUD de materiais com stock atual e mínimo          |
| Movimentos    | Registo de entradas, saídas e ajustes              |
| Histórico     | Listagem completa de movimentos com filtros         |
| Relatórios    | Consumo por período, produto, categoria e obra      |
| Configurações | Dados da empresa e parâmetros do sistema            |

---

## Fluxo Principal do Sistema

```
Login
  → Dashboard (visão geral)
    → Novo Movimento (entrada/saída/ajuste)
      → Stock atualizado automaticamente
        → Histórico regista o movimento
          → Relatórios calculados sobre o histórico
```

---

## Regras Críticas

1. Entrada **soma** ao stock atual.
2. Saída **subtrai** do stock atual.
3. Saída não pode ser superior ao stock disponível (MVP bloqueia).
4. Ajuste corrige o stock para um valor ou aplica uma correção explícita.
5. Histórico de movimentos **nunca é apagado fisicamente**.
6. Todos os relatórios são calculados a partir de `movimentos_stock`, não de `produtos.stock_atual`.
7. Data/hora registada automaticamente com timezone `Europe/Lisbon`.
8. Destino/obra é **obrigatório** para saídas.
9. Produto desativado não aparece em novos movimentos, mas mantém-se no histórico.

---

## Como Executar Localmente

### Pré-requisitos

- Node.js 18+
- pnpm 8+
- Conta Supabase

### Instalação

```bash
git clone https://github.com/encivil/armazem.git
cd armazem
pnpm install
```

### Configuração

```bash
cp .env.example .env.local
# Editar .env.local com as variáveis Supabase
```

### Executar em desenvolvimento

```bash
pnpm dev
```

---

## Variáveis de Ambiente

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

> **Atenção:** Nunca usar `service_role` key no frontend. Usar apenas a `anon/publishable` key.

---

## Estrutura de Pastas Recomendada

```
src/
├── app/
│   ├── App.tsx
│   ├── routes.tsx
│   ├── layouts/
│   │   └── MainLayout.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── ProductDetailPage.tsx
│   │   ├── NewMovementPage.tsx
│   │   ├── HistoryPage.tsx
│   │   ├── ReportsPage.tsx
│   │   └── SettingsPage.tsx
│   ├── components/
│   │   ├── ui/           # Componentes base (shadcn/ui)
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── StatCard.tsx
│   │   ├── StockBadge.tsx
│   │   └── MovementTypeBadge.tsx
│   └── data/
│       └── mockData.ts
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── produtos/
│   │   ├── components/
│   │   ├── services/
│   │   └── types.ts
│   ├── movimentos/
│   │   ├── components/
│   │   ├── services/
│   │   └── types.ts
│   ├── relatorios/
│   └── configuracoes/
├── integrations/
│   └── supabase/
│       ├── client.ts
│       ├── types.ts
│       └── queries/
├── shared/
│   └── hooks/
├── utils/
│   ├── date.ts
│   └── stock.ts
└── styles/
    ├── theme.css
    └── fonts.css
```

---

## Estado Atual do Projeto

- [x] Protótipo completo com React + TypeScript
- [x] Todas as 8 páginas navegáveis
- [x] Dados mock realistas
- [x] Design premium paleta ENCIVIL (azul escuro, branco, amarelo/laranja)
- [x] Componentes reutilizáveis
- [x] Responsivo desktop e tablet
- [x] Documentação técnica completa
- [ ] Integração Supabase
- [ ] Supabase Auth real
- [ ] RLS configurado
- [ ] Deploy Vercel

---

## Próximos Passos

1. Criar projeto no Supabase
2. Executar migrações SQL (`docs/03-modelo-de-dados.md`)
3. Configurar Auth e RLS
4. Substituir `mockData.ts` por queries reais ao Supabase
5. Configurar deploy na Vercel
6. Treinar responsável de armazém

---

*Documentação completa em `/docs/`. Ler `AGENTS.md` antes de contribuir.*
