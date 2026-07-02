# Arquitetura — ENCIVIL Gestão

> A **constituição** do sistema. Qualquer decisão de estrutura, novo módulo ou
> alteração de fronteiras deve respeitar este documento. Se algo aqui deixar de
> fazer sentido, atualiza-se este ficheiro **primeiro**, depois o código.

---

## 1. Filosofia: Monólito Modular (não microserviços)

Uma aplicação, uma base de dados, **módulos de fronteiras claras**. Ganha-se a
separação ("cada coisa no seu sítio, não misturar") sem a complexidade
operacional dos microserviços (rede entre serviços, consistência eventual,
múltiplos deploys, observabilidade distribuída) — que não se justifica para uma
PME com um responsável técnico.

> **Regra de ouro:** modular por dentro, monólito por fora. Separação lógica
> forte, deploy simples. Só se separa um módulo em serviço próprio quando *esse*
> módulo o exigir (ex.: faturação certificada pela AT).

---

## 2. Mapa de Módulos

A **OBRA é a entidade central** — quase tudo se liga a uma obra (`obra_id`).

```
              ┌──────────────────── NÚCLEO ────────────────────┐
              │  Auth · Perfis · Permissões · Config · Auditoria │
              │            Notificações · Relatórios             │
              └───────────────────────┬─────────────────────────┘
                      ╔═══════════════╧═══════════════╗
                      ║      OBRAS (entidade central)  ║
                      ╚═══════════════╤═══════════════╝
      ┌──────────┬───────────┬────────┼─────────┬────────────┬──────────┐
   Armazém   Ferramentas  Subempreit. Combustível  Frota      RH / Horas
   (stock)   (empréstimos) (autos)    (abastec.)  (futuro)    (futuro)
      └──────────┴───────────┴────CUSTOS POR OBRA──┴────────────┴─────────┘
                         (job costing — consolida tudo)
```

| Módulo | Estado | Tabelas (prefixo) |
|---|---|---|
| Núcleo (auth, perfis, config, auditoria) | ✅ | `profiles`, `configuracoes_empresa`, `audit_log` |
| Obras | ✅ | `obras` |
| Armazém | ✅ | `produtos`, `movimentos_stock` |
| Ferramentas | ✅ | `ferramentas`, `emprestimos_ferramentas` |
| Subempreitadas | ✅ | `subempreiteiros`, `subempreiteiro_artigos`, `autos_medicao`, `auto_linhas` |
| Combustível | 🔜 | `comb_*` |
| Custos por Obra (job costing) | ⭐ | (vista/consolidação — sem tabelas próprias) |
| Frota, RH/Horas, Compras | 🔮 | futuro |

⭐ **Custos por Obra** é a joia da coroa: consolida materiais + subempreiteiros +
combustível + mão-de-obra de uma obra e compara com o orçamento → custo real vs.
previsto. É o que dá consciência de margem ao dono.

---

## 3. Fronteiras de Código (frontend)

```
src/
  shared/        ← kernel comum: ui/, lib/ (format...), auth/, cliente Supabase, tipos base
  features/
    <módulo>/    ← services/, hooks/, components/ próprios do módulo
  app/           ← rotas, layout, páginas (COMPOSIÇÃO — sem lógica de negócio)
```

**Leis de fronteira:**
1. Um módulo **nunca** importa de dentro de outro módulo. Partilha → `shared/`.
2. Um módulo pode referenciar outro **só por id** (ex.: `obra_id`) e através dos
   *services públicos* do outro, nunca dos seus internos.
3. `app/pages/` compõe UI; a lógica vive nos `hooks`/`services` do módulo.
4. A fronteira é a **pasta**. Se dois módulos começam a importar-se, ou há um
   `shared/` em falta, ou a fronteira está errada.

---

## 4. Backend — as leis invioláveis

1. **Uma verdade por facto.** Zero duplicação. `obra_id` liga tudo.
2. **Escritas multi-tabela só via RPC `SECURITY DEFINER`** (transação atómica).
   Ex.: `registar_movimento`, `registar_emprestimo_ferramenta`, `validar_auto`.
3. **RLS em todas as tabelas + GRANT explícito** (o projeto tem "expose new
   tables" OFF — cada tabela/sequência/RPC nova exige GRANT na mesma migration).
4. **Imutabilidade onde importa** via RLS por estado: movimentos são imutáveis;
   contratos e autos ficam imutáveis após `validado` (UPDATE/DELETE só em
   `rascunho`; a passagem a `validado` só pela RPC de validação, admin-only).
5. **Auditoria** (`audit_log`) nas ações sensíveis (validações, alterações de
   papel, apagamentos).
6. **Migrations** versionadas, para a frente, auto-contidas (schema + RLS +
   grants juntos).
7. **Dinheiro em `NUMERIC`, nunca float.** Enums de estado consistentes
   (`rascunho`/`validado`).
8. **Organização por convenção de nomes** (`stock_*`, `ferramentas_*`, `obra*`,
   `subemp*`, `comb_*`) em vez de schemas Postgres separados — no Supabase,
   schemas separados custam configuração de exposição sem ganho a esta escala.

---

## 5. Segurança & Permissões (RBAC)

**A RLS é a segurança real; a UI (esconder/desativar botões) é só conforto.**
Nunca confiar apenas na UI.

### Papéis

| Papel | Descrição |
|---|---|
| `admin` | Tudo + gestão de utilizadores + **validações** |
| `gestor` | Opera todos os módulos (sem gestão de utilizadores nem validação) |
| `armazem` | Armazém + Ferramentas (escrita); resto leitura |
| `medicoes` | Subempreitadas + Autos (escrita); resto leitura |
| `leitura` | Só ver + relatórios |

### Matriz (papéis × módulos × ações)

| Papel | Armazém | Ferramentas | Subempr./Autos | Combustível | Validar | Utilizadores |
|---|---|---|---|---|---|---|
| admin | ✏️ | ✏️ | ✏️ | ✏️ | ✅ | ✅ |
| gestor | ✏️ | ✏️ | ✏️ | ✏️ | — | — |
| armazem | ✏️ | ✏️ | 👁️ | ✏️ | — | — |
| medicoes | 👁️ | 👁️ | ✏️ | 👁️ | — | — |
| leitura | 👁️ | 👁️ | 👁️ | 👁️ | — | — |

- **Menor privilégio:** cada papel só o que precisa.
- **Validação = cadeado do admin** (padrão rascunho→validado já implementado).
- Fonte única da verdade: função SQL `tem_papel(...)` / helper de capacidades no
  frontend (`features/auth`). RLS e UI leem a mesma matriz conceptual.
- *(Futuro)* âmbito por obra: um utilizador só vê as obras que lhe são atribuídas.

---

## 6. UX / Usabilidade

1. **Duas lentes:** por módulo (menu lateral) **e** por obra (**Ficha de Obra**
   agregadora — tudo de uma obra num só ecrã).
2. **Menu agrupado por secções** (Operação · Obras · Gestão) — escala para 15+
   módulos sem virar uma lista infinita.
3. **Consistência = velocidade.** Todos os módulos seguem o mesmo padrão:
   `Lista → Detalhe → Formulário`, pesquisa com combobox, fluxo
   `Rascunho → Validado`, mobile-first, operação em <10s.
4. **Menu por papel:** cada utilizador só vê os módulos que pode usar.
5. **Resiliência offline** para operações de campo (fila local já existe nos
   movimentos; padrão a reutilizar).

---

## 7. Roadmap

1. **Fundação** — menu por secções · RBAC (papéis por módulo) · Ficha de Obra. ← *em curso*
2. **Combustível** — viaturas/máquinas + abastecimentos por obra.
3. **Custos por Obra** — job costing (consolida materiais + subempreiteiros +
   combustível + mão-de-obra vs. orçamento).
4. **Manutenção** — corrigir hook de secrets (falsos positivos em docs), concluir
   rename da página de Documentação.
5. **Futuro** — Frota, RH/Horas, Compras/Fornecedores.

---

## 8. Hospedagem (nota de longo prazo)

O plano gratuito da Vercel (Hobby) é só para uso não-comercial. Caminhos:
- **Imediato/barato:** frontend estático no Cloudflare Pages (permite uso
  comercial no plano grátis) + Supabase gerido.
- **Longo prazo:** VPS única (ex.: OVH) a consolidar todos os sistemas, com
  Docker + Caddy (HTTPS) + firewall + backups automáticos fora do servidor +
  atualizações automáticas. Dados na UE (RGPD). Só quando houver 2+ sistemas a
  justificar e alguém a manter o servidor.
- ⚠️ Software que **emite faturas legais** pode exigir certificação pela AT —
  questão legal independente do hosting.
