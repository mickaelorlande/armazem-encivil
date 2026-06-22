# Implantação — Controle Armazém ENCIVIL

> **Estado: já implantado.** URL de produção: `armazem-encivil.vercel.app`. Este documento serve para reproduzir o setup ou recuperar de um desastre — não é mais um plano futuro.

---

## Pré-requisitos

- Conta Supabase (plano gratuito suficiente para MVP)
- Conta Vercel (gratuita)
- Repositório GitHub com o código do projeto
- Node.js 18+ e pnpm instalados localmente

---

## 1. Configurar Projeto Supabase (já feito — para novo ambiente)

1. Aceder a [supabase.com](https://supabase.com) e criar novo projeto
2. Anotar: **Project URL** e **Anon Key** (em Settings → API)
3. Aplicar **todas** as migrations de `supabase/migrations/` em ordem cronológica:
   ```bash
   supabase db push --db-url "postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres"
   ```
   (usar a conexão direta porta 5432, não o pooler 6543 — o CLI tem problemas com prepared statements no modo transaction do pooler)
4. Verificar tabelas: `profiles`, `produtos`, `movimentos_stock`, `configuracoes_empresa`, `audit_log`

---

## 2. Configurar Autenticação Supabase

1. Supabase Dashboard → Authentication → Settings
2. **Verificar que "Allow new users to sign up" está desativado** — contas só são criadas via convite (Authentication → Users → Invite user)
3. Criar utilizador administrador via convite — recebe role `gestor` por defeito (trigger `handle_new_user`)
4. Promover a `admin` via RPC (não via UPDATE direto — está bloqueado por GRANT):
   ```sql
   -- Correr autenticado como o próprio admin que já existe, ou via SQL direto na primeira vez:
   UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@encivil.pt';
   ```
   A partir do segundo admin em diante, usar a RPC `promover_role()` autenticado como um admin existente — nunca SQL direto.
5. Reforçar política de password (Authentication → Settings → Password requirements): mínimo 10-12 caracteres
6. MFA (TOTP): requer plano Supabase Pro — não disponível no plano atual. Compensado por auto-logout de 30 min no frontend.

---

## 3. Configurar RLS

Já aplicado via migrations. Para verificar:
```sql
-- Deve retornar true para cada tabela
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Confirmar que authenticated só pode UPDATE 'nome' em profiles
SELECT grantee, privilege_type, column_name
FROM information_schema.column_privileges
WHERE table_name = 'profiles' AND grantee = 'authenticated';
-- Esperado: UPDATE só aparece para column_name = 'nome'
```

---

## 4. Configurar Variáveis de Ambiente

### Para desenvolvimento local

```bash
cp .env.example .env.local
```

Editar `.env.local`:
```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

### Para Vercel (produção)

1. Aceder ao projeto na Vercel
2. Settings → Environment Variables
3. Adicionar:
   - `VITE_SUPABASE_URL` = URL do projeto Supabase
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = Anon Key do Supabase

---

## 5. Deploy na Vercel

### Primeira vez

1. Aceder a [vercel.com](https://vercel.com)
2. "Add New Project" → Importar repositório GitHub (`mickaelorlande/armazem-encivil`)
3. Framework Preset: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Adicionar variáveis de ambiente (passo 4)
7. Deploy

### Deploys subsequentes

Push para a branch `main` dispara deploy automático. `vercel.json` já inclui os headers de segurança (CSP, HSTS, X-Frame-Options, etc.) e os rewrites de SPA — não precisam de configuração manual no Dashboard da Vercel.

### Se aparecer "Failed to fetch dynamically imported module"

Não deve mais acontecer — o code-splitting por rota foi removido (ver ADR-007). Se reaparecer noutro contexto, o `vite:preloadError` handler em `main.tsx` já limpa o cache do service worker e recarrega automaticamente.

---

## 6. Configuração Inicial do Sistema

Após o primeiro deploy, aceder ao sistema e:

1. Fazer login com as credenciais criadas
2. Aceder a Configurações e preencher:
   - Nome da empresa: ENCIVIL
   - Responsável de armazém: [nome do encarregado]
   - Stock mínimo padrão: [valor definido internamente]
3. Aceder a Produtos e criar o catálogo inicial de materiais
4. Registar o stock atual de cada produto através de movimentos de entrada (ou ajustes com observação "Stock inicial")

---

## Checklist de Produção (estado atual)

### Base de dados
- [x] Todas as migrations executadas com sucesso
- [x] RLS ativa em todas as tabelas
- [x] GRANTs a nível de coluna em `profiles` (role/email/id só-leitura)
- [x] Utilizadores administrador e gestor criados
- [x] Registo inicial em `configuracoes_empresa`
- [x] Tabela `audit_log` para mudanças de role

### Segurança
- [x] Apenas `anon` key configurada (nunca `service-role`)
- [x] Variáveis de ambiente configuradas na Vercel
- [x] HTTPS + HSTS a funcionar
- [x] Headers de segurança completos (CSP, X-Frame-Options, etc.)
- [x] `npm audit` sem vulnerabilidades
- [x] Auto-logout por inatividade
- [ ] Signup público desativado no Dashboard (verificar)
- [ ] Política de password reforçada no Dashboard (verificar)

### Funcionalidades
- [x] Login/logout testados
- [x] CRUD de produtos (admin)
- [x] Registar entrada/saída/ajuste com stock atualizado atomicamente
- [x] Saída com stock insuficiente bloqueada
- [x] Histórico paginado com filtros
- [x] Relatórios calculados a partir de movimentos_stock
- [x] Dashboard com alertas de stock
- [x] PWA instalável (iOS + Android)
- [x] Role gestor sem acesso a configurações/CRUD produtos

### Operacional
- [x] Encarregados/gestores com conta criada
- [ ] Procedimento de backup periódico definido (exportar CSV do Supabase)
- [ ] Contacto de suporte definido para problemas técnicos

---

## Manutenção

### Monitorização
- Supabase Dashboard → Database → Performance (verificar queries lentas)
- Vercel Dashboard → Analytics (tempo de carregamento)

### Backups
- Supabase faz backup automático diário (plano Pro)
- Plano gratuito: exportar manualmente via Supabase Table Editor → Download CSV

### Atualizações
1. Fazer alterações em branch de desenvolvimento
2. Testar localmente
3. Abrir Pull Request
4. Merge para `main` → deploy automático na Vercel
