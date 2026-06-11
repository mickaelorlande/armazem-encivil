# Implantação — Controle Armazém ENCIVIL

---

## Pré-requisitos

- Conta Supabase (plano gratuito suficiente para MVP)
- Conta Vercel (gratuita)
- Repositório GitHub com o código do projeto
- Node.js 18+ e pnpm instalados localmente

---

## 1. Configurar Projeto Supabase

1. Aceder a [supabase.com](https://supabase.com) e criar novo projeto
2. Anotar: **Project URL** e **Anon Key** (em Settings → API)
3. Aceder ao **SQL Editor** e executar a migration completa de `docs/03-modelo-de-dados.md`
4. Verificar que as tabelas foram criadas: `profiles`, `produtos`, `movimentos_stock`, `configuracoes_empresa`

---

## 2. Configurar Autenticação Supabase

1. Supabase Dashboard → Authentication → Settings
2. Desativar "Enable email confirmations" para MVP (utilizador criado manualmente)
3. Criar utilizador administrador:
   - Authentication → Users → Add User
   - E-mail: `armazem@encivil.pt` (ou o desejado)
   - Palavra-passe forte (mínimo 12 caracteres, maiúscula, número, símbolo)
4. Criar perfil manualmente na tabela `profiles`:
   ```sql
   INSERT INTO profiles (id, nome, email, role)
   SELECT id, 'Administrador ENCIVIL', email, 'admin'
   FROM auth.users
   WHERE email = 'armazem@encivil.pt';
   ```

---

## 3. Configurar RLS

Executar as políticas RLS de `docs/05-seguranca-e-acesso.md` no SQL Editor do Supabase.

Verificar que RLS está ativa:
```sql
-- Deve retornar true para cada tabela
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
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
2. "Add New Project" → Importar repositório GitHub
3. Framework Preset: **Vite**
4. Build Command: `pnpm build`
5. Output Directory: `dist`
6. Adicionar variáveis de ambiente (passo 4)
7. Deploy

### Deploys subsequentes

Push para a branch `main` dispara deploy automático.

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

## Checklist de Produção

### Base de dados
- [ ] Migration SQL executada com sucesso
- [ ] RLS ativa em todas as tabelas
- [ ] Utilizador administrador criado na `auth.users`
- [ ] Perfil criado na tabela `profiles`
- [ ] Registo inicial criado em `configuracoes_empresa`

### Segurança
- [ ] Apenas `anon` key configurada (nunca `service_role`)
- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] HTTPS a funcionar (automático na Vercel)
- [ ] RLS testada com utilizador não autenticado (deve bloquear tudo)

### Funcionalidades
- [ ] Login testado e a funcionar
- [ ] Logout testado
- [ ] Criar produto funciona
- [ ] Registar entrada funciona e stock atualizado
- [ ] Registar saída funciona e stock atualizado
- [ ] Saída com stock insuficiente bloqueada com mensagem
- [ ] Histórico mostra movimentos corretamente
- [ ] Relatório diário mostra movimentos do dia
- [ ] Dashboard com alertas de stock a funcionar

### Operacional
- [ ] Responsável de armazém treinado (demonstração de 30 minutos)
- [ ] Procedimento de backup definido (exportar CSV mensalmente do Supabase)
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
