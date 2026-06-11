# SPEC-DASHBOARD — Dashboard

**Módulo:** Dashboard  
**Versão:** 1.0

---

## Objetivo

Dar ao utilizador uma visão geral imediata do estado do armazém e acesso rápido às ações mais frequentes.

## Escopo

- 4 cartões de estatísticas (totais)
- Alertas de stock baixo e sem stock
- Últimos movimentos
- Ações rápidas (entrada/saída)

## Fora de Escopo

- Gráficos históricos (Fase 2)
- Comparação com períodos anteriores (Fase 2)
- Previsão de stock (Fase 3)

---

## Regras de Negócio

- RN-DASH-01: Total de produtos conta apenas produtos ativos
- RN-DASH-02: Entradas/saídas de hoje baseiam-se em `movimentos_stock.created_at` do dia atual (timezone Europe/Lisbon)
- RN-DASH-03: Stock baixo: `stock_atual <= stock_minimo AND stock_atual > 0`
- RN-DASH-04: Sem stock: `stock_atual = 0`
- RN-DASH-05: Últimos movimentos: os 8 mais recentes de qualquer produto

---

## Estados da Interface

| Estado | Descrição |
|--------|-----------|
| A carregar | Skeletons nos cartões e tabela |
| Dados normais | Todos os cartões e tabela preenchidos |
| Sem movimentos hoje | Cartões de entradas/saídas com 0 |
| Sem alertas de stock | Mensagem "Todos os produtos com stock adequado" |
| Sem movimentos (sistema novo) | Tabela com estado vazio + botão "Registar primeiro movimento" |

---

## Componentes

| Componente | Dados |
|------------|-------|
| StatCard (Total Produtos) | COUNT(produtos WHERE ativo=true) |
| StatCard (Entradas Hoje) | COUNT(movimentos WHERE tipo='entrada' AND data=hoje) |
| StatCard (Saídas Hoje) | COUNT(movimentos WHERE tipo='saida' AND data=hoje) |
| StatCard (Alertas) | COUNT(produtos WHERE stock_atual <= stock_minimo) |
| Tabela de movimentos | 8 mais recentes de movimentos_stock |
| Widget de alertas | Produtos com stock baixo ou sem stock |

---

## Fluxo Principal

1. Utilizador autentica-se e acede a `/`
2. Dashboard carrega em paralelo: stats, alertas, movimentos recentes
3. Utilizador vê o estado geral do armazém
4. Clica em "Registar Saída" → navega para `/novo-movimento?tipo=saida`
5. Ou clica num alerta de produto → navega para `/produtos/:id`

---

## Critérios de Aceitação

- [ ] 4 cartões de stats visíveis e com dados corretos
- [ ] Alertas de stock em destaque visual
- [ ] Últimos 8 movimentos com data, produto, tipo, quantidade, responsável
- [ ] Botões de ação rápida funcionais
- [ ] Carrega em < 2 segundos

---

## Ficheiros Sugeridos

```
src/app/pages/DashboardPage.tsx
src/app/components/StatCard.tsx
src/app/components/StockBadge.tsx
src/features/dashboard/
  hooks/useDashboard.ts
  services/dashboardService.ts
```

---

## Testes Mínimos

- T-ALERT-01, T-ALERT-02 (ver `docs/08-testes.md`)
