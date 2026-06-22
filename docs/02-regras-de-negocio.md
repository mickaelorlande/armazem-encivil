# Regras de Negócio — Controle Armazém ENCIVIL

---

## Produto

**RN-PROD-01** — Um produto tem sempre: código único, nome, categoria, unidade de medida, stock atual, stock mínimo e estado ativo/inativo.

**RN-PROD-02** — O código do produto é único no sistema e não pode ser reutilizado mesmo após desativação.

**RN-PROD-03** — O stock atual de um produto é **sempre** calculado pela soma algébrica dos movimentos associados. O campo `stock_atual` na tabela `produtos` é o valor em cache — deve ser atualizado atomicamente em cada movimento.

**RN-PROD-04** — Um produto ativo aparece na seleção de novos movimentos.

**RN-PROD-05** — Um produto desativado **não aparece** na seleção de novos movimentos.

**RN-PROD-06** — Um produto desativado **mantém** todo o histórico de movimentos associado.

**RN-PROD-07** — Produtos não são apagados fisicamente. A desativação é sempre lógica (`ativo = false`).

**RN-PROD-08** — Não é possível editar o stock atual diretamente. A correção é feita através de um movimento de ajuste.

---

## Categoria

**RN-CAT-01** — Categorias predefinidas no MVP: Agregados, Ligantes, Cerâmica, Tubagem, Ferramentas, Metais, Madeiras, Tintas e Vernizes, Outros.

**RN-CAT-02** — Um produto pertence obrigatoriamente a uma categoria.

**RN-CAT-03** — Gestão de categorias personalizadas é funcionalidade da Fase 2.

---

## Unidade de Medida

**RN-UNID-01** — Unidades suportadas no MVP: tonelada (t), quilograma (kg), metro cúbico (m³), metro linear (ml), metro quadrado (m²), unidade (un), saco (sc), caixa (cx), litro (L), rolo (rl), paletes (pal).

**RN-UNID-02** — A unidade de medida de um produto não deve ser alterada após o primeiro movimento registado.

---

## Stock Atual

**RN-STOCK-01** — O stock atual de um produto nunca pode ser inferior a zero no MVP.

**RN-STOCK-02** — Se uma saída for registada com quantidade superior ao stock disponível, a operação é bloqueada com mensagem: *"Stock insuficiente. Disponível: {stock_atual} {unidade}."*

**RN-STOCK-03** — O stock é atualizado de forma atómica com o registo do movimento (numa única transação).

---

## Stock Mínimo

**RN-STOCKMIN-01** — Cada produto tem um stock mínimo definido. O valor padrão é configurável nas Configurações.

**RN-STOCKMIN-02** — Stock baixo: `stock_atual <= stock_minimo` e `stock_atual > 0`.

**RN-STOCKMIN-03** — Sem stock: `stock_atual = 0`.

**RN-STOCKMIN-04** — O dashboard deve alertar visualmente para produtos em estado de stock baixo e sem stock.

---

## Movimento de Entrada

**RN-ENT-01** — A entrada soma a quantidade ao stock atual: `novo_stock = stock_atual + quantidade`.

**RN-ENT-02** — Campos obrigatórios: produto, quantidade, responsável.

**RN-ENT-03** — Campos opcionais: observação, referência de fornecedor.

**RN-ENT-04** — O destino/obra não é obrigatório para entradas.

---

## Movimento de Saída

**RN-SAI-01** — A saída subtrai a quantidade do stock atual: `novo_stock = stock_atual - quantidade`.

**RN-SAI-02** — Saída que resultaria em stock negativo é **bloqueada**.

**RN-SAI-03** — Campos obrigatórios: produto, quantidade, responsável, destino/obra.

**RN-SAI-04** — O destino/obra identifica para que obra ou cliente o material foi retirado.

**RN-SAI-05** — Campos opcionais: observação.

---

## Movimento de Ajuste

**RN-AJU-01** — O ajuste corrige o stock para o valor correto após contagem física ou erro detetado.

**RN-AJU-02** — O sistema regista a diferença (positiva ou negativa) entre o stock antes e o novo stock.

**RN-AJU-03** — Campos obrigatórios: produto, novo valor de stock (ou quantidade de diferença), responsável, observação (obrigatória para ajustes — deve explicar o motivo).

**RN-AJU-04** — Um ajuste pode resultar num stock inferior ao mínimo ou até a zero, mas não negativo.

---

## Histórico

**RN-HIST-01** — Cada movimento gera um registo imutável na tabela `movimentos_stock`.

**RN-HIST-02** — Registos de movimentos nunca são apagados fisicamente — nem por admin.

**RN-HIST-03** — Correções de registos errados fazem-se através de novo movimento de ajuste com observação explicativa.

**RN-HIST-04** — O histórico deve ser acessível mesmo para produtos desativados.

**RN-HIST-05** — Cada registo de histórico inclui: produto, tipo, quantidade, stock_antes, stock_depois, responsável, destino/obra, observação, data/hora.

---

## Relatórios

**RN-REL-01** — Todos os relatórios são calculados a partir de `movimentos_stock`. Nunca apenas de `produtos.stock_atual`.

**RN-REL-02** — O relatório diário mostra todos os movimentos do dia atual (00:00 a 23:59 Europe/Lisbon).

**RN-REL-03** — Relatórios por obra mostram o total de materiais consumidos (saídas) agrupado por produto.

**RN-REL-04** — Relatórios por categoria somam entradas e saídas de todos os produtos dessa categoria no período.

---

## Responsável

**RN-RESP-01** — O responsável é a pessoa física que executou o movimento.

**RN-RESP-02** — O responsável é registado como texto livre (nome), pré-preenchido automaticamente com o nome do utilizador autenticado (`useRole().nome`) mas editável — permite registar um movimento em nome de outro colega presente fisicamente no armazém.

**RN-RESP-03** — `created_by` (separado de `responsavel`) já associa o movimento ao utilizador autenticado que submeteu, para efeitos de auditoria — ver `docs/03-modelo-de-dados.md`.

---

## Destino/Obra

**RN-DEST-01** — O destino/obra identifica para onde o material foi (saída) ou de onde veio (entrada, opcional).

**RN-DEST-02** — No MVP, o destino/obra é texto livre.

**RN-DEST-03** — Na Fase 2, obras serão entidades cadastradas com referência própria.

---

## Data e Hora

**RN-DATA-01** — A data e hora de cada movimento é registada automaticamente no momento da submissão.

**RN-DATA-02** — O timezone obrigatório é `Europe/Lisbon` (UTC+0 inverno, UTC+1 verão — WEST/WET).

**RN-DATA-03** — Não é permitido ao utilizador alterar a data e hora de um movimento após o registo.
