# TASKS.md — Backlog de Desenvolvimento

Sistema: Controle Armazém ENCIVIL  
Última atualização: 2026-06-11

---

## P0 — Essencial (MVP funcional)

### TASK-001 — Integração Supabase Client

**Objetivo:** Configurar o cliente Supabase com variáveis de ambiente e types gerados.

**Ficheiros prováveis:**
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`
- `.env.local`

**Critérios de aceite:**
- Cliente Supabase inicializado com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`
- Types gerados com `supabase gen types typescript`
- Sem `service_role` key no código

**Testes esperados:** Conexão bem-sucedida ao Supabase (ping ou select simples)

**Risco:** Baixo

---

### TASK-002 — Executar Migration SQL

**Objetivo:** Criar as tabelas e constraints na base de dados Supabase.

**Ficheiros prováveis:**
- `supabase/migrations/001_initial_schema.sql`

**Critérios de aceite:**
- Tabelas criadas: `profiles`, `produtos`, `movimentos_stock`, `configuracoes_empresa`
- Constraints ativos (CHECK stock >= 0, quantidade > 0, destino obrigatório em saída)
- Enumerações criadas: `tipo_movimento`, `role_utilizador`
- Triggers `updated_at` funcionais
- Índices criados

**Testes esperados:** Inserir produto de teste; verificar constraints com valor inválido

**Risco:** Médio (schema errado é difícil de corrigir em produção)

---

### TASK-003 — Configurar Auth Supabase + Proteção de Rotas

**Objetivo:** Auth real com Supabase; todas as rotas internas protegidas.

**Ficheiros prováveis:**
- `src/features/auth/services/authService.ts`
- `src/features/auth/hooks/useAuth.ts`
- `src/app/routes.tsx`

**Critérios de aceite:**
- Login com Supabase Auth funcional
- Logout funcional
- Rotas internas redirecionam para `/login` sem sessão
- Sessão persiste após F5

**Testes esperados:** T-AUTH-01 a T-AUTH-05

**Risco:** Médio

---

### TASK-004 — Configurar RLS

**Objetivo:** Ativar e testar Row Level Security em todas as tabelas.

**Ficheiros prováveis:**
- `supabase/migrations/002_rls_policies.sql`

**Critérios de aceite:**
- RLS ativa em todas as tabelas
- Utilizador não autenticado não consegue ler dados (verificar com Supabase API sem token)
- Policies de leitura e escrita corretas

**Testes esperados:** Chamada Supabase sem token → 401 ou dados vazios

**Risco:** Alto (RLS mal configurado pode bloquear utilizadores legítimos)

---

### TASK-005 — CRUD Produtos (Supabase real)

**Objetivo:** Substituir mockData por queries reais ao Supabase para o módulo de produtos.

**Ficheiros prováveis:**
- `src/features/produtos/services/produtosService.ts`
- `src/features/produtos/hooks/useProdutos.ts`
- `src/integrations/supabase/queries/produtos.ts`
- `src/app/pages/ProductsPage.tsx` (adaptar para usar hook)

**Critérios de aceite:**
- Listar, criar, editar, desativar produtos via Supabase
- Pesquisa e filtro por categoria funcionais
- Código duplicado bloqueado (constraint DB)

**Testes esperados:** T-PROD-01 a T-PROD-06

**Risco:** Baixo

---

### TASK-006 — Registo de Movimentos (Supabase real)

**Objetivo:** Registar entrada, saída e ajuste com atualização atómica de stock.

**Ficheiros prováveis:**
- `src/features/movimentos/services/movimentosService.ts`
- `src/features/movimentos/hooks/useMovimentos.ts`
- `src/utils/stock.ts`
- `src/app/pages/NewMovementPage.tsx`
- `supabase/functions/registar_movimento.sql` (RPC para atomicidade)

**Critérios de aceite:**
- Entrada/saída/ajuste registados e stock atualizado atomicamente
- Saída > stock bloqueada no frontend e backend
- `stock_antes` e `stock_depois` guardados corretamente

**Testes esperados:** T-MOV-01 a T-MOV-09

**Risco:** Alto (atomicidade é crítica — usar Supabase RPC ou transação)

---

### TASK-007 — Histórico (Supabase real)

**Objetivo:** Listar movimentos com filtros a partir do Supabase.

**Ficheiros prováveis:**
- `src/features/movimentos/services/historicoService.ts`
- `src/integrations/supabase/queries/movimentos.ts`
- `src/app/pages/HistoryPage.tsx`

**Critérios de aceite:**
- Lista paginada de movimentos
- Filtros por data, produto, tipo, responsável, destino/obra
- Movimentos de produtos desativados visíveis

**Testes esperados:** T-HIST-01 a T-HIST-04

**Risco:** Baixo

---

### TASK-008 — Dashboard (Supabase real)

**Objetivo:** Substituir dados mock do dashboard por queries reais.

**Ficheiros prováveis:**
- `src/features/dashboard/services/dashboardService.ts`
- `src/app/pages/DashboardPage.tsx`

**Critérios de aceite:**
- Stats corretas em tempo real
- Alertas de stock corretos
- Últimos movimentos reais

**Testes esperados:** T-ALERT-01, T-ALERT-02

**Risco:** Baixo

---

## P1 — Importante

### TASK-009 — Relatórios (Supabase real)

**Objetivo:** Implementar todos os relatórios com queries reais.

**Ficheiros prováveis:**
- `src/features/relatorios/services/relatoriosService.ts`
- `src/integrations/supabase/queries/relatorios.ts`
- `src/app/pages/ReportsPage.tsx`

**Critérios de aceite:** T-REL-01 a T-REL-03 passam  
**Risco:** Médio (queries complexas com agregações)

---

### TASK-010 — Configurações (Supabase real)

**Objetivo:** Guardar e carregar configurações da empresa do Supabase.

**Ficheiros prováveis:**
- `src/features/configuracoes/services/configuracoesService.ts`
- `src/app/pages/SettingsPage.tsx`

**Critérios de aceite:** Guardar e recarregar dados da empresa  
**Risco:** Baixo

---

### TASK-011 — Página de Detalhe do Produto

**Objetivo:** Página completa com dados do produto e histórico de movimentos associados.

**Ficheiros prováveis:**
- `src/app/pages/ProductDetailPage.tsx`

**Critérios de aceite:** Dados do produto + últimos movimentos reais  
**Risco:** Baixo

---

## P2 — Futuro (Fase 2+)

| ID | Tarefa | Fase |
|----|--------|------|
| TASK-020 | Exportação Excel (.xlsx) com SheetJS | 2 |
| TASK-021 | Exportação PDF com jsPDF | 2 |
| TASK-022 | Multiutilizador com perfis (admin, operador, visualizador) | 2 |
| TASK-023 | Leitura de código de barras | 2 |
| TASK-024 | Importação de produtos via CSV | 2 |
| TASK-025 | Obras como entidades cadastradas | 2 |
| TASK-026 | Notificações de stock baixo por e-mail | 2 |
| TASK-027 | PWA (Progressive Web App) com suporte offline | 3 |
| TASK-028 | Integração com sistema de faturação | 3 |
