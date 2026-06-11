# Source of Truth — Controle Armazém ENCIVIL

Este documento é a verdade principal do projeto. Qualquer dúvida sobre o comportamento esperado do sistema deve ser resolvida aqui primeiro.

---

## Visão do Produto

Sistema web interno simples para controlo de materiais de armazém da ENCIVIL. Permite registar entradas e saídas de materiais de construção, consultar stock em tempo real e gerar relatórios de consumo por obra e período.

**Princípio orientador:** Um encarregado de armazém com pouca experiência informática deve conseguir registar uma saída em menos de 10 segundos.

---

## Escopo do MVP

### O que o sistema FAZ

- Autenticação segura com 1 utilizador administrador
- Gestão de produtos (criar, listar, editar, desativar)
- Registo de movimentos: entrada, saída e ajuste
- Atualização automática de stock após cada movimento
- Histórico completo e imutável de todos os movimentos
- Alertas de stock baixo e sem stock
- Relatórios por período, produto, categoria e obra
- Interface simples, responsiva (desktop e tablet)
- Idioma: Português de Portugal

### O que o sistema NÃO FAZ

- ❌ Não é ecommerce
- ❌ Não processa pagamentos
- ❌ Não é ERP completo
- ❌ Não controla faturação oficial
- ❌ Não gere fornecedores (MVP)
- ❌ Não tem multiutilizador (MVP)
- ❌ Não faz leitura de código de barras (MVP)
- ❌ Não exporta PDF/Excel (MVP)
- ❌ Não tem aplicação mobile nativa (MVP)

---

## Regras de Negócio Imutáveis

| # | Regra |
|---|-------|
| RN-01 | Entrada **soma** a quantidade ao stock atual do produto |
| RN-02 | Saída **subtrai** a quantidade do stock atual do produto |
| RN-03 | Ajuste corrige o stock para o valor definido explicitamente |
| RN-04 | Stock não pode ficar negativo no MVP — saída com quantidade > stock_atual é bloqueada |
| RN-05 | Histórico de movimentos nunca é apagado fisicamente da base de dados |
| RN-06 | Correções de registos errados fazem-se através de novo movimento de ajuste |
| RN-07 | Data e hora são registadas automaticamente com timezone Europe/Lisbon |
| RN-08 | Quantidade de qualquer movimento deve ser maior que zero |
| RN-09 | Destino/obra é obrigatório para movimentos de saída |
| RN-10 | Produto desativado não aparece na seleção de novos movimentos |
| RN-11 | Produto desativado mantém todo o histórico de movimentos associado |
| RN-12 | Todos os relatórios calculam-se a partir de movimentos_stock, não de produtos.stock_atual |
| RN-13 | Responsável pelo movimento é obrigatório |

---

## Entidades Principais

### Produto
Representa um material de armazém (ex: cimento, areia, tijolos). Tem código único, nome, categoria, unidade de medida, stock atual e stock mínimo.

### Movimento de Stock
Registo imutável de uma alteração de stock (entrada, saída ou ajuste). Contém o produto, tipo, quantidade, stock antes, stock depois, responsável, destino/obra e observação.

### Categoria
Agrupamento de produtos (ex: Agregados, Ligantes, Cerâmica, Tubagem, Ferramentas).

### Configuração da Empresa
Dados institucionais: nome, logótipo, responsável de armazém, stock mínimo padrão.

---

## Fluxos Principais

### Registar Saída (fluxo crítico — deve ser < 10s)
1. Utilizador clica "Registar Saída" (ou acede a Novo Movimento)
2. Seleciona produto (pesquisa por nome ou código)
3. Insere quantidade
4. Insere destino/obra
5. Confirma
6. Sistema valida stock disponível
7. Sistema subtrai do stock e regista movimento

### Registar Entrada
1. Utilizador acede a Novo Movimento
2. Seleciona tipo "Entrada"
3. Seleciona produto
4. Insere quantidade
5. Confirma
6. Sistema soma ao stock e regista movimento

### Registar Ajuste
1. Utilizador acede a Novo Movimento
2. Seleciona tipo "Ajuste"
3. Seleciona produto
4. Insere novo valor de stock ou diferença
5. Insere observação obrigatória (ex: "Contagem física — diferença de inventário")
6. Confirma
7. Sistema atualiza stock e regista movimento

---

## Decisões Técnicas

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Backend | Supabase | BaaS gerido, auth + DB + RLS integrados, sem servidor |
| Frontend | React + TypeScript + Vite | Stack moderna, type-safe, ecossistema rico |
| Deploy | Vercel | Integração direta com GitHub, HTTPS automático |
| Relatórios | Calculados de movimentos | Garante auditabilidade e consistência histórica |
| Deletar movimentos | Nunca fisicamente | Auditabilidade e integridade do stock histórico |

---

## Restrições

- Deve funcionar em browsers modernos (Chrome, Edge, Firefox, Safari)
- Interface deve ser usável num ecrã de 1280px (desktop) e 768px (tablet)
- Tempo de resposta de operações normais < 2 segundos
- Sem dependência de internet constante (futuro: offline first na Fase 3)

---

## Prioridades

1. **P0 — Crítico:** Login, produtos, entrada, saída, stock atualizado, histórico
2. **P1 — Importante:** Relatórios, filtros, detalhes produto, configurações
3. **P2 — Futuro:** Exportação, multiutilizador, código de barras, mobile

---

## Critérios de Sucesso do MVP

- [x] Encarregado regista saída em < 10 segundos
- [x] Stock atualizado corretamente após cada movimento
- [x] Histórico imutável e consultável
- [x] Alerta visual de stock baixo no dashboard
- [x] Relatório de consumo diário, semanal e mensal disponível
- [x] Sem stock negativo possível
- [x] Sistema usável sem formação técnica
