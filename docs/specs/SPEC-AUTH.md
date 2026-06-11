# SPEC-AUTH — Autenticação

**Módulo:** Autenticação  
**Versão:** 1.0

---

## Objetivo

Garantir que apenas utilizadores autorizados acedem ao sistema, com sessão segura e persistente.

## Escopo

- Login com e-mail e palavra-passe
- Logout
- Proteção de todas as rotas internas
- Persistência de sessão entre recarregamentos

## Fora de Escopo

- Registo de novos utilizadores (admin cria manualmente via Supabase)
- Recuperação de palavra-passe via e-mail (MVP)
- Autenticação social (Google, Microsoft, etc.)
- 2FA (Fase 2)

---

## Regras de Negócio

- RN-AUTH-01: E-mail e palavra-passe são obrigatórios
- RN-AUTH-02: Credenciais inválidas devem mostrar mensagem de erro (sem revelar qual campo está errado)
- RN-AUTH-03: Sessão válida enquanto token JWT não expirar (padrão Supabase: 1 hora, com refresh automático)
- RN-AUTH-04: Qualquer rota além de `/login` exige sessão ativa
- RN-AUTH-05: Logout invalida a sessão localmente e no Supabase

---

## Estados da Interface

| Estado | Descrição |
|--------|-----------|
| Inicial | Formulário vazio, botão "Entrar" ativo |
| Submetendo | Botão desativado, spinner visível |
| Erro | Mensagem de erro vermelha abaixo do formulário |
| Sucesso | Redireciona para Dashboard |
| Sem sessão (rotas internas) | Redireciona para `/login` |

---

## Campos

| Campo | Tipo | Obrigatório | Validação |
|-------|------|-------------|-----------|
| E-mail | Email input | Sim | Formato de e-mail válido |
| Palavra-passe | Password input | Sim | Não vazia |

---

## Validações

- E-mail: formato válido (RFC 5322 básico)
- Palavra-passe: não vazia, sem limite mínimo no frontend (Supabase valida)
- Ambos obrigatórios antes de submeter

---

## Fluxo Principal

1. Utilizador acede a `/login`
2. Preenche e-mail e palavra-passe
3. Clica "Entrar"
4. Frontend valida campos localmente
5. Chama `supabase.auth.signInWithPassword()`
6. Se sucesso: guarda sessão, redireciona para `/`
7. Se erro: mostra mensagem de erro

## Fluxos Alternativos

- **Sessão já ativa:** Aceder a `/login` redireciona para `/`
- **Token expirado:** Supabase SDK faz refresh automático; se falhar, redireciona para `/login`
- **Botão Sair:** Chama `supabase.auth.signOut()`, limpa estado, redireciona para `/login`

---

## Critérios de Aceitação

- [ ] Login com credenciais corretas → Dashboard
- [ ] Login com credenciais erradas → mensagem de erro
- [ ] Acesso a rota interna sem sessão → `/login`
- [ ] F5 com sessão ativa → mantém sessão
- [ ] Logout → redireciona para `/login`
- [ ] Campos obrigatórios validados antes de submeter

---

## Ficheiros Sugeridos

```
src/features/auth/
  services/authService.ts     # signIn, signOut, getSession
  hooks/useAuth.ts            # hook de estado de autenticação
src/app/pages/
  LoginPage.tsx               # UI da página de login
src/app/
  routes.tsx                  # Proteção de rotas (PrivateRoute)
```

---

## Riscos

- Token JWT expirado silenciosamente → Supabase SDK lida com refresh; testar cenário de expiração
- Utilizador com sessão em dois tabs → comportamento padrão Supabase (ok)

---

## Testes Mínimos

- T-AUTH-01, T-AUTH-02, T-AUTH-03, T-AUTH-04, T-AUTH-05 (ver `docs/08-testes.md`)
