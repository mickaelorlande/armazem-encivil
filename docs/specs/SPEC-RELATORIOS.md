# SPEC-RELATORIOS — Relatórios

**Módulo:** Relatórios  
**Versão:** 1.0

---

## Objetivo

Fornecer relatórios de consumo e movimentos por período, produto, categoria e obra para apoio à gestão do armazém.

## Escopo

- Relatório diário, semanal, mensal, anual
- Relatório por produto
- Relatório por categoria
- Relatório por obra/destino

## Fora de Escopo

- Exportação PDF/Excel (Fase 2)
- Relatórios personalizados ad-hoc (Fase 3)
- Análises preditivas (Fase 3)
- Custo/preço de materiais (Fase 3)

---

## Regra Fundamental

> Todos os relatórios calculam-se a partir de `movimentos_stock`. Nunca apenas de `produtos.stock_atual`.

---

## Estados da Interface

| Estado | Descrição |
|--------|-----------|
| Sem filtro | Mostra tipo de relatório padrão (mensal) |
| A carregar | Skeleton nos dados |
| Sem dados no período | "Sem movimentos no período selecionado" |
| Com dados | Tabela e/ou gráfico |

---

## Tipos de Relatório

Ver `docs/07-relatorios.md` para cálculos SQL detalhados.

| Tipo | Selector | Filtros |
|------|----------|---------|
| Diário | Tab | Data |
| Semanal | Tab | Semana |
| Mensal | Tab | Mês/Ano |
| Anual | Tab | Ano |
| Por Produto | Tab | Produto + Período |
| Por Categoria | Tab | Categoria + Período |
| Por Obra | Tab | Obra (texto) + Período |

---

## Fluxo Principal

1. Utilizador acede a `/relatorios`
2. Seleciona tipo de relatório (tabs)
3. Define filtros se necessário
4. Sistema executa query sobre `movimentos_stock`
5. Exibe tabela e totais
6. (Fase 2) Clica "Exportar Excel"

---

## Critérios de Aceitação

- [ ] Relatório diário mostra movimentos do dia
- [ ] Totais corretos (entradas vs saídas)
- [ ] Por obra mostra apenas saídas (consumo)
- [ ] Períodos sem dados mostram estado vazio
- [ ] Calculado de movimentos_stock (não stock_atual)

---

## Ficheiros Sugeridos

```
src/app/pages/ReportsPage.tsx
src/features/relatorios/
  hooks/useRelatorios.ts
  services/relatoriosService.ts
  components/RelatorioTabela.tsx
  components/RelatorioGrafico.tsx
  types.ts
src/integrations/supabase/queries/relatorios.ts
```

---

## Riscos

- Queries pesadas em períodos longos: adicionar índice em `created_at` + paginação
- Totais inconsistentes se filtros mal aplicados: testar com dados conhecidos

---

## Testes Mínimos

- T-REL-01, T-REL-02, T-REL-03 (ver `docs/08-testes.md`)
