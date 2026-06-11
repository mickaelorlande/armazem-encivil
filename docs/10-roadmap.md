# Roadmap — Controle Armazém ENCIVIL

---

## MVP — Fase 1 (Estado atual)

Objetivo: Sistema funcional mínimo para substituir registo em papel/Excel.

| # | Funcionalidade | Estado |
|---|---------------|--------|
| 1 | Autenticação (login/logout) | ✅ Protótipo |
| 2 | Dashboard com estatísticas | ✅ Protótipo |
| 3 | CRUD de Produtos | ✅ Protótipo |
| 4 | Registo de Entrada de stock | ✅ Protótipo |
| 5 | Registo de Saída de stock | ✅ Protótipo |
| 6 | Registo de Ajuste de stock | ✅ Protótipo |
| 7 | Bloqueio de saída sem stock | ✅ Protótipo |
| 8 | Histórico de movimentos | ✅ Protótipo |
| 9 | Alertas de stock baixo | ✅ Protótipo |
| 10 | Relatórios básicos | ✅ Protótipo |
| 11 | Configurações da empresa | ✅ Protótipo |
| 12 | Integração Supabase real | ⏳ Pendente |
| 13 | Auth real (Supabase Auth) | ⏳ Pendente |
| 14 | RLS configurado | ⏳ Pendente |
| 15 | Deploy Vercel | ⏳ Pendente |

---

## Fase 2 — Produtividade e Multiutilizador

Estimativa: 1–3 meses após MVP em produção.

| # | Funcionalidade | Prioridade |
|---|---------------|------------|
| 1 | Múltiplos utilizadores com perfis de acesso (admin, operador, visualizador) | P1 |
| 2 | Exportação para Excel (.xlsx) | P1 |
| 3 | Exportação para PDF | P1 |
| 4 | Leitura de código de barras (câmara do telemóvel) | P1 |
| 5 | Importação de produtos em massa (CSV) | P1 |
| 6 | Obras cadastradas como entidades (não texto livre) | P1 |
| 7 | Anexos e fotos em movimentos | P2 |
| 8 | Histórico de alterações de produtos | P2 |
| 9 | Notificações de stock baixo por e-mail | P2 |
| 10 | Dashboard de gestão com KPIs avançados | P2 |

---

## Fase 3 — Integração e Mobilidade

Estimativa: 6–12 meses após Fase 2.

| # | Funcionalidade | Notas |
|---|---------------|-------|
| 1 | Integração com sistema de faturação (ex: Moloni, InvoiceXpress) | API externa |
| 2 | Integração com módulo de compras (encomendas automáticas ao atingir stock mínimo) | Workflow |
| 3 | Alertas automáticos (SMS, WhatsApp) para stock crítico | Twilio/Z-API |
| 4 | Aplicação mobile (PWA ou React Native) | Offline-first |
| 5 | Relatórios avançados com filtros e dashboards personalizáveis | BI lite |
| 6 | Multi-armazém (ex: armazém central + armazéns de obra) | Nova entidade |
| 7 | Gestão de fornecedores e histórico de preços | Nova entidade |
| 8 | Rastreabilidade de lotes (especialmente para materiais com validade) | Novo campo |
