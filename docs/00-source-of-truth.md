# Source of Truth — Controle Armazém ENCIVIL

Este documento é a verdade principal do projeto. Qualquer dúvida sobre o comportamento esperado do sistema deve ser resolvida aqui primeiro.

**Estado: sistema em produção** (Vercel + Supabase), usado pela equipa da ENCIVIL.

---

## Visão do Produto

Sistema web interno para controlo de materiais de armazém da ENCIVIL. Permite registar entradas e saídas de materiais de construção, consultar stock em tempo real e gerar relatórios de consumo por obra e período. Instalável como PWA em iOS e Android.

**Princípio orientador:** Um encarregado de armazém com pouca experiência informática deve conseguir registar uma saída em menos de 10 segundos.

---

## Escopo Atual

### O que o sistema FAZ

- Autenticação segura via Supabase Auth, com **dois roles**: `admin` e `gestor` (multiutilizador real, não é MVP de 1 utilizador)
- Gestão de produtos (criar, listar, editar, arquivar, eliminar — admin apenas)
- Registo de movimentos: entrada, saída e ajuste (admin e gestor)
- Atualização automática e atómica de stock após cada movimento (RPC `registar_movimento`)
- Histórico completo, imutável e paginado de todos os movimentos
- Alertas de stock baixo e sem stock
- Relatórios por período, produto, categoria e obra
- Interface mobile-first, responsiva (telemóvel, tablet, desktop)
- Instalável como PWA (ícone no ecrã inicial, funciona com conexão intermitente)
- Auto-logout por inatividade (30 min) — compensação por ausência de MFA
- Idioma: Português de Portugal

### O que o sistema NÃO FAZ (ainda)

- ❌ Não é ecommerce, não processa pagamentos, não é ERP completo
- ❌ Não controla faturação oficial
- ❌ Não gere fornecedores
- ❌ Não faz leitura de código de barras
- ❌ Não exporta PDF/Excel
- ❌ Não tem aplicação mobile nativa (usa PWA em vez disso — ver `docs/specs/SPEC-PWA.md`)
- ❌ Não tem MFA (indisponível no plano Supabase atual — compensado por auto-logout)

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
| Code-splitting por rota | Removido (bundle único) | Eliminar "stale chunk" após deploy — ver ADR-008 |
| Mudança de role | Apenas via RPC `promover_role()` | UPDATE direto na coluna `role` é bloqueado por GRANT — ver `docs/05-seguranca-e-acesso.md` |

---

## Restrições

- Deve funcionar em browsers modernos (Chrome, Edge, Firefox, Safari)
- Interface deve ser usável num ecrã de 1280px (desktop) e 768px (tablet)
- Tempo de resposta de operações normais < 2 segundos
- Sem dependência de internet constante (futuro: offline first na Fase 3)

---

## Prioridades

1. **P0 — Entregue:** Login, produtos, entrada, saída, stock atualizado, histórico, multiutilizador (admin/gestor), PWA
2. **P1 — Entregue:** Relatórios, filtros, detalhes produto, configurações, segurança hardened (RLS, RPCs auditadas, headers)
3. **P2 — Futuro:** Exportação Excel/PDF, código de barras, obras como entidades, MFA (requer plano Supabase Pro)

Backlog ativo de melhorias incrementais em `TASKS/` (SEGURANÇA / UX / PERFORMANCE).

---

## Critérios de Sucesso

- [x] Encarregado regista saída em < 10 segundos
- [x] Stock atualizado corretamente após cada movimento
- [x] Histórico imutável e consultável (paginado)
- [x] Alerta visual de stock baixo no dashboard
- [x] Relatório de consumo diário, semanal e mensal disponível
- [x] Sem stock negativo possível
- [x] Sistema usável sem formação técnica
- [x] Multiutilizador com dois roles (admin/gestor), aplicado via RLS
- [x] Instalável como PWA em iOS e Android
- [x] Sem vulnerabilidades de privilege escalation, headers de segurança aplicados, dependências sem CVEs
