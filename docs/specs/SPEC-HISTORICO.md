# SPEC-HISTORICO — Histórico de Movimentos

**Módulo:** Histórico  
**Versão:** 1.0

---

## Objetivo

Permitir consultar o histórico completo de movimentos com filtros avançados para rastreabilidade e auditoria.

## Escopo

- Listagem paginada de todos os movimentos
- Filtros por data, produto, tipo, responsável e destino/obra
- Visualização de stock_antes e stock_depois

## Fora de Escopo

- Edição ou apagamento de movimentos — nunca permitido
- Exportação (Fase 2)
- Agrupamento ou sumarização (ver Relatórios)

---

## Regras de Negócio

- RN-HIST-01 a RN-HIST-05 (ver `docs/02-regras-de-negocio.md`)
- Ordenação padrão: data decrescente (mais recente primeiro)
- Filtros são opcionais e combináveis
- Movimentos de produtos desativados devem aparecer no histórico

---

## Estados da Interface

| Estado | Descrição |
|--------|-----------|
| Lista com movimentos | Tabela paginada com todos os movimentos |
| Sem resultados | "Nenhum movimento encontrado para os filtros aplicados" + botão "Limpar filtros" |
| A carregar | Skeleton na tabela |
| Filtros aplicados | Badge com número de filtros ativos |

---

## Campos Exibidos na Tabela

| Coluna | Fonte | Formato |
|--------|-------|---------|
| Data/Hora | `created_at` | DD/MM/AAAA HH:MM |
| Produto | `produto.nome` | Texto |
| Tipo | `tipo` | Badge colorido |
| Quantidade | `quantidade + produto.unidade` | Número |
| Stock Antes | `stock_antes` | Número |
| Stock Depois | `stock_depois` | Número |
| Responsável | `responsavel` | Texto |
| Destino/Obra | `destino_obra` | Texto (vazio se entrada/ajuste) |
| Observação | `observacoes` | Texto truncado (hover para completo) |

---

## Filtros

| Filtro | Tipo | Notas |
|--------|------|-------|
| Data início | Date picker | Padrão: 30 dias atrás |
| Data fim | Date picker | Padrão: hoje |
| Produto | Select com pesquisa | Inclui produtos desativados |
| Tipo de movimento | Select | entrada / saida / ajuste / todos |
| Responsável | Text input | Pesquisa parcial |
| Destino/Obra | Text input | Pesquisa parcial |

---

## Fluxo Principal

1. Utilizador acede a `/historico`
2. Lista carrega com padrão: últimos 30 dias, todos os tipos
3. Utilizador aplica filtros conforme necessidade
4. Tabela atualiza com resultados filtrados

---

## Critérios de Aceitação

- [ ] Todos os movimentos visíveis em ordem decrescente
- [ ] Filtros combináveis e funcionais
- [ ] Movimentos de produtos desativados visíveis
- [ ] Tipo exibido com badge colorido correto
- [ ] stock_antes e stock_depois visíveis
- [ ] "Limpar filtros" restaura vista padrão

---

## Ficheiros Sugeridos

```
src/app/pages/HistoryPage.tsx
src/features/movimentos/
  hooks/useHistorico.ts
  services/historicoService.ts    # queries com filtros dinâmicos
  components/MovimentoFilters.tsx
  components/MovimentoTable.tsx
```

---

## Riscos

- Tabela muito grande (anos de dados): implementar paginação por cursor (não offset) no Supabase para performance

---

## Testes Mínimos

- T-HIST-01 a T-HIST-04 (ver `docs/08-testes.md`)
