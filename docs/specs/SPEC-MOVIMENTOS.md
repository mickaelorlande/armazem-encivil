# SPEC-MOVIMENTOS — Registo de Movimentos de Stock

**Módulo:** Movimentos  
**Versão:** 1.0

---

## Objetivo

Permitir o registo rápido de entradas, saídas e ajustes de stock, com validação automática e atualização imediata do stock.

## Escopo

- Registo de entrada (soma stock)
- Registo de saída (subtrai stock)
- Registo de ajuste (corrige stock)
- Validação de stock insuficiente
- Feedback imediato após registo

## Fora de Escopo

- Movimentos em lote (múltiplos produtos de uma vez) — Fase 2
- Importação de movimentos via CSV — Fase 2
- Aprovação de movimentos por gestor — Fase 2
- Edição ou anulação de movimentos — nunca (apenas ajuste)

---

## Regras de Negócio

- RN-ENT-01 a RN-ENT-04 (entradas)
- RN-SAI-01 a RN-SAI-05 (saídas)
- RN-AJU-01 a RN-AJU-04 (ajustes)
- RN-STOCK-01 a RN-STOCK-03 (stock)
- RN-DATA-01 a RN-DATA-03 (data/hora)

---

## Estados da Interface

| Estado | Descrição |
|--------|-----------|
| Formulário vazio | Tipo "Saída" selecionado por defeito (mais frequente) |
| Produto selecionado | Stock atual visível abaixo do campo |
| Quantidade > stock | Erro em tempo real "Stock insuficiente. Disponível: X" |
| A guardar | Botão desativado + spinner |
| Sucesso | Toast verde + formulário reset |
| Erro de servidor | Toast vermelho com mensagem |

---

## Campos

### Campos comuns

| Campo | Tipo | Obrigatório | Notas |
|-------|------|-------------|-------|
| tipo | RADIO/TAB | Sim | entrada / saida / ajuste |
| produto_id | SELECT com pesquisa | Sim | Apenas produtos ativos |
| quantidade | NUMERIC | Sim | > 0 |
| responsavel | TEXT | Sim | Nome do encarregado |
| observacoes | TEXTAREA | Não | Notas opcionais |

### Campos específicos por tipo

| Campo | Tipo | Obrigatório em | Notas |
|-------|------|----------------|-------|
| destino_obra | TEXT | Saída | Para que obra/cliente |
| observacoes | TEXTAREA | Ajuste | Obrigatório em ajuste (motivo) |

---

## Validações

- `tipo`: obrigatório
- `produto_id`: obrigatório, produto ativo
- `quantidade`: obrigatório, > 0, numérico
- `responsavel`: obrigatório, não vazio
- `destino_obra`: obrigatório se tipo = 'saida'
- `observacoes`: obrigatório se tipo = 'ajuste'
- Validação de stock: se tipo = 'saida' e quantidade > stock_atual → bloquear com mensagem

---

## Fluxo Principal — Saída (< 10 segundos)

1. Utilizador clica "Registar Saída" no Dashboard
2. Chega a `/novo-movimento` com tipo "saída" pré-selecionado
3. Seleciona produto (autocomplete por nome ou código)
4. Stock atual aparece: "Stock disponível: 150 kg"
5. Insere quantidade: 30
6. Insere destino/obra: "Obra Norte"
7. Responsável: pré-preenchido com utilizador logado (se disponível)
8. Clica "Confirmar"
9. Sistema: valida, calcula novo stock, grava movimento atomicamente
10. Toast: "Saída registada. Stock: 120 kg"
11. Formulário reset para novo registo

## Fluxo — Stock Insuficiente

1. Utilizador seleciona produto com 50 unidades
2. Insere quantidade 80
3. Sistema mostra imediatamente: "⚠️ Stock insuficiente. Disponível: 50 un."
4. Botão "Confirmar" desativado
5. Utilizador corrige quantidade ou cancela

## Fluxo — Ajuste

1. Selecionar tipo "Ajuste"
2. Selecionar produto
3. Inserir valor correto do stock (após contagem física)
4. Inserir observação: "Contagem física — diferença de 5 unidades"
5. Confirmar
6. Sistema calcula diferença e regista movimento de ajuste

---

## Critérios de Aceitação

- [ ] Saída diminui stock corretamente
- [ ] Entrada aumenta stock corretamente
- [ ] Ajuste corrige stock para valor correto
- [ ] Saída > stock → erro em tempo real antes de submeter
- [ ] `stock_antes` e `stock_depois` guardados corretamente
- [ ] `destino_obra` obrigatório em saídas
- [ ] `observacoes` obrigatório em ajustes
- [ ] Formulário reset após sucesso
- [ ] Toast de confirmação com stock resultante

---

## Ficheiros Sugeridos

```
src/app/pages/NewMovementPage.tsx
src/features/movimentos/
  components/MovementForm.tsx
  components/ProductSelector.tsx
  components/StockDisplay.tsx
  hooks/useMovimentos.ts
  services/movimentosService.ts    # validarSaida(), registarMovimento()
  types.ts
src/utils/stock.ts                 # calcularNovoStock(), validarStockSuficiente()
```

---

## Riscos

- Condição de corrida: dois utilizadores registam saída do mesmo produto simultaneamente → usar transação atómica no Supabase (RPC ou trigger)
- Stock negativo por bug: constraint CHECK na BD garante fallback de segurança

---

## Testes Mínimos

- T-MOV-01 a T-MOV-09 (ver `docs/08-testes.md`)
