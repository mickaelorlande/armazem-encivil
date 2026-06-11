# SPEC-CONFIGURACOES — Configurações do Sistema

**Módulo:** Configurações  
**Versão:** 1.0

---

## Objetivo

Permitir ao administrador configurar dados da empresa e parâmetros operacionais do sistema.

## Escopo

- Nome da empresa
- Logótipo (Fase 2)
- Responsável de armazém
- Stock mínimo padrão para novos produtos

## Fora de Escopo

- Gestão de utilizadores (Fase 2)
- Notificações por e-mail (Fase 2)
- Integração com sistemas externos (Fase 3)
- Categorias personalizadas (Fase 2)

---

## Regras de Negócio

- RN-CONF-01: Existe sempre exatamente 1 registo em `configuracoes_empresa` (singleton)
- RN-CONF-02: Stock mínimo padrão aplica-se a novos produtos criados após a alteração; não retroativo
- RN-CONF-03: Nome da empresa é obrigatório
- RN-CONF-04: Stock mínimo padrão >= 0

---

## Campos

| Campo | Tipo | Obrigatório | Notas |
|-------|------|-------------|-------|
| nome_empresa | TEXT | Sim | Máx 100 caracteres |
| logo_url | URL | Não | Upload Supabase Storage (Fase 2) |
| responsavel_armazem | TEXT | Não | Nome do responsável principal |
| stock_minimo_padrao | NUMERIC | Sim | Padrão: 10; >= 0 |

---

## Fluxo Principal

1. Utilizador acede a `/configuracoes`
2. Formulário carrega dados atuais da tabela `configuracoes_empresa`
3. Utilizador edita campos
4. Clica "Guardar alterações"
5. Sistema valida e atualiza registo

---

## Critérios de Aceitação

- [ ] Formulário carrega dados atuais
- [ ] Guardar altera os dados corretamente
- [ ] Toast de sucesso após guardar
- [ ] Stock mínimo padrão aplicado a novos produtos
- [ ] Nome empresa obrigatório (não vazio)

---

## Ficheiros Sugeridos

```
src/app/pages/SettingsPage.tsx
src/features/configuracoes/
  hooks/useConfiguracoes.ts
  services/configuracoesService.ts
```

---

## Testes Mínimos

- Guardar configurações → dados persistidos
- Stock mínimo padrão → aplicado ao criar produto
