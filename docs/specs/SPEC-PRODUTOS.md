# SPEC-PRODUTOS — Gestão de Produtos

**Módulo:** Produtos  
**Versão:** 1.0

---

## Objetivo

Permitir a gestão completa do catálogo de materiais: criar, listar, editar, ver detalhe e desativar produtos.

## Escopo

- CRUD de produtos
- Pesquisa e filtro
- Detalhe com histórico de movimentos
- Desativação lógica

## Fora de Escopo

- Importação em massa CSV (Fase 2)
- Gestão de preços (Fase 3)
- Fotos/anexos de produtos (Fase 2)
- Código de barras (Fase 2)

---

## Regras de Negócio

- RN-PROD-01 a RN-PROD-08 (ver `docs/02-regras-de-negocio.md`)
- Código do produto: único, imutável após criação
- Stock atual: não editável diretamente — apenas via movimentos
- Desativação: lógica (`ativo = false`), nunca física

---

## Estados da Interface

| Estado | Descrição |
|--------|-----------|
| Lista normal | Produtos ativos com stock e badge de estado |
| Lista vazia | Estado vazio + botão "Criar primeiro produto" |
| Sem resultados de pesquisa | "Nenhum produto encontrado para '{termo}'" |
| Produto com stock baixo | Badge amarelo "Stock Baixo" |
| Produto sem stock | Badge vermelho "Sem Stock" |
| Produto inativo | Badge cinza "Inativo" |

---

## Campos do Produto

| Campo | Tipo | Obrigatório | Notas |
|-------|------|-------------|-------|
| codigo | TEXT | Sim | Único; gerado automaticamente ou manual |
| nome | TEXT | Sim | Nome do material |
| categoria | SELECT | Sim | Lista predefinida |
| unidade | SELECT | Sim | Lista predefinida |
| stock_minimo | NUMERIC | Sim | Padrão das configurações |
| observacoes | TEXTAREA | Não | Notas internas |

---

## Validações

- `codigo`: obrigatório, único no sistema
- `nome`: obrigatório, mínimo 3 caracteres
- `categoria`: obrigatório, valor da lista
- `unidade`: obrigatório, valor da lista
- `stock_minimo`: obrigatório, >= 0
- `stock_atual`: não editável no formulário de produto

---

## Fluxo Principal — Criar Produto

1. Utilizador clica "Novo Produto"
2. Preenche formulário
3. Sistema valida
4. Produto criado com `stock_atual = 0` e `ativo = true`
5. Utilizador pode registar entrada para definir stock inicial

## Fluxo — Desativar Produto

1. Utilizador abre detalhe do produto
2. Clica "Desativar"
3. Dialog de confirmação: "Produto desativado não poderá ser selecionado em novos movimentos, mas o histórico é mantido."
4. Confirmar → `ativo = false`

---

## Critérios de Aceitação

- [ ] Criar produto com todos os campos válidos → aparece na lista
- [ ] Código duplicado → erro "Código já existe"
- [ ] Editar produto → alterações guardadas sem alterar stock
- [ ] Desativar produto → desaparece da seleção de movimentos
- [ ] Desativar produto → mantém histórico de movimentos
- [ ] Pesquisa por nome filtra em tempo real
- [ ] Filtro por categoria funcional

---

## Ficheiros Sugeridos

```
src/app/pages/ProductsPage.tsx
src/app/pages/ProductDetailPage.tsx
src/features/produtos/
  components/ProductForm.tsx
  components/ProductCard.tsx
  hooks/useProdutos.ts
  services/produtosService.ts
  types.ts
```

---

## Riscos

- Código duplicado: verificar unicidade antes de guardar (constraint DB + validação frontend)
- Unidade alterada após movimentos: bloquear alteração de unidade após primeiro movimento

---

## Testes Mínimos

- T-PROD-01 a T-PROD-06 (ver `docs/08-testes.md`)
