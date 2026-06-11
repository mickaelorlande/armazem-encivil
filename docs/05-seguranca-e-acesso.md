# Segurança e Controlo de Acesso — Controle Armazém ENCIVIL

---

## Modelo de Segurança do MVP

- 1 utilizador administrador único
- Login obrigatório para acesso a qualquer funcionalidade
- Todas as rotas internas protegidas por verificação de sessão
- RLS (Row Level Security) ativa no Supabase para todas as tabelas
- Nenhuma chave secreta exposta no frontend

---

## Autenticação

### Supabase Auth

O sistema usa Supabase Auth com autenticação por e-mail e palavra-passe.

**Fluxo:**
1. Utilizador submete e-mail + palavra-passe em `/login`
2. Supabase Auth valida credenciais
3. Supabase devolve JWT (access_token + refresh_token)
4. Token guardado no `localStorage` pelo SDK Supabase
5. Todas as chamadas à API incluem o token no header `Authorization`
6. RLS valida o token em cada operação na base de dados

**Proteção de rotas (frontend):**
```tsx
// Verificar sessão antes de renderizar rotas internas
const { data: { session } } = await supabase.auth.getSession();
if (!session) navigate('/login');
```

---

## Políticas RLS (Row Level Security)

### Tabela: profiles

```sql
-- Utilizador autenticado pode ler o próprio perfil
CREATE POLICY "profiles_select_own"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Apenas admin pode inserir perfis (via Supabase Admin ou trigger)
CREATE POLICY "profiles_insert_admin"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);
```

### Tabela: produtos

```sql
-- Apenas utilizadores autenticados podem ler produtos
CREATE POLICY "produtos_select_auth"
ON produtos FOR SELECT
USING (auth.role() = 'authenticated');

-- Apenas admin pode criar/editar/desativar produtos
CREATE POLICY "produtos_insert_admin"
ON produtos FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "produtos_update_admin"
ON produtos FOR UPDATE
USING (auth.role() = 'authenticated');

-- Nenhum utilizador pode apagar produtos fisicamente
-- (sem policy de DELETE = ninguém pode apagar)
```

### Tabela: movimentos_stock

```sql
-- Apenas utilizadores autenticados podem ler movimentos
CREATE POLICY "movimentos_select_auth"
ON movimentos_stock FOR SELECT
USING (auth.role() = 'authenticated');

-- Apenas utilizadores autenticados podem criar movimentos
CREATE POLICY "movimentos_insert_auth"
ON movimentos_stock FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = created_by);

-- Ninguém pode alterar ou apagar movimentos (auditabilidade)
-- (sem policies UPDATE/DELETE = operações bloqueadas)
```

### Tabela: configuracoes_empresa

```sql
-- Apenas utilizadores autenticados podem ler configurações
CREATE POLICY "config_select_auth"
ON configuracoes_empresa FOR SELECT
USING (auth.role() = 'authenticated');

-- Apenas utilizadores autenticados podem atualizar configurações
CREATE POLICY "config_update_auth"
ON configuracoes_empresa FOR UPDATE
USING (auth.role() = 'authenticated');
```

---

## Variáveis de Ambiente

### O que usar no frontend

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...anon_key...
```

### O que NUNCA colocar no frontend

```env
# NUNCA expor no frontend:
SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role...  ← PROIBIDO NO VITE
SUPABASE_JWT_SECRET=...                           ← PROIBIDO NO VITE
DATABASE_URL=postgresql://...                     ← PROIBIDO NO VITE
```

> **Regra:** Variáveis com prefixo `VITE_` são incluídas no bundle e ficam visíveis no browser. Usar apenas a chave `anon`/`publishable` que é segura para expor — a RLS garante que cada utilizador só acede ao que tem permissão.

---

## Cuidados de Segurança

| Risco | Mitigação |
|-------|-----------|
| Acesso sem autenticação | RLS ativa + verificação de sessão nas rotas |
| Exposição de chaves secretas | Apenas `anon` key no frontend; service role nunca no Vite |
| Apagar dados de auditoria | Sem policy DELETE em `movimentos_stock` |
| Stock negativo | Constraint CHECK na BD + validação no service |
| XSS | React escapa HTML por defeito; evitar `dangerouslySetInnerHTML` |
| Injeção SQL | Supabase SDK usa queries parametrizadas |

---

## Backup e Exportação

- Supabase inclui backups automáticos diários (plano Pro)
- Recomendado exportar `movimentos_stock` semanalmente em CSV como backup adicional
- Exportação para Excel/PDF na Fase 2 permitirá cópias manuais
- No MVP: acesso ao dashboard Supabase para exportação manual se necessário

---

## Checklist de Segurança para Deploy

- [ ] RLS ativa em todas as tabelas
- [ ] Nenhuma `service_role` key no código ou variáveis de ambiente Vercel (apenas `anon`)
- [ ] HTTPS forçado na Vercel
- [ ] Auth configurado com e-mail verificado
- [ ] Palavra-passe forte para o admin
- [ ] Políticas RLS testadas com utilizador não autenticado (deve falhar tudo)
- [ ] Sem `console.log` com dados sensíveis no código de produção
