# Plano de Testes — Controle Armazém ENCIVIL

---

## Testes Manuais

### Módulo: Autenticação

| Código | Cenário | Passos | Resultado Esperado | Prioridade |
|--------|---------|--------|--------------------|------------|
| T-AUTH-01 | Login com sucesso | 1. Aceder a `/login` 2. Inserir e-mail e palavra-passe corretos 3. Clicar "Entrar" | Redireciona para Dashboard; sessão ativa | P0 |
| T-AUTH-02 | Login com credenciais inválidas | 1. Inserir e-mail ou palavra-passe incorretos 2. Clicar "Entrar" | Mensagem de erro visível; sem redirecionamento | P0 |
| T-AUTH-03 | Acesso sem sessão | 1. Sem sessão ativa, aceder a `/` | Redireciona para `/login` | P0 |
| T-AUTH-04 | Logout | 1. Sessão ativa 2. Clicar "Sair" | Sessão terminada; redireciona para `/login` | P0 |
| T-AUTH-05 | Persistência de sessão | 1. Login 2. Recarregar página (F5) | Utilizador mantém sessão | P1 |

---

### Módulo: Produtos

| Código | Cenário | Passos | Resultado Esperado | Prioridade |
|--------|---------|--------|--------------------|------------|
| T-PROD-01 | Produto criado com sucesso | 1. Aceder a Produtos 2. Clicar "Novo Produto" 3. Preencher campos obrigatórios 4. Guardar | Produto aparece na lista; stock = 0 | P0 |
| T-PROD-02 | Produto editado com sucesso | 1. Abrir produto existente 2. Alterar nome 3. Guardar | Alteração refletida na lista e detalhe | P0 |
| T-PROD-03 | Campos obrigatórios validados | 1. Abrir formulário de produto 2. Submeter sem preencher | Erros de validação por campo | P0 |
| T-PROD-04 | Produto desativado | 1. Desativar produto existente | Produto desaparece da seleção de movimentos; mantém histórico | P0 |
| T-PROD-05 | Pesquisa por nome | 1. Ir a Produtos 2. Escrever parte do nome | Lista filtra em tempo real | P1 |
| T-PROD-06 | Filtro por categoria | 1. Selecionar categoria "Agregados" | Apenas produtos da categoria aparecem | P1 |

---

### Módulo: Movimentos

| Código | Cenário | Passos | Resultado Esperado | Prioridade |
|--------|---------|--------|--------------------|------------|
| T-MOV-01 | Entrada aumenta stock | 1. Registo de entrada de 50 unidades num produto com 100 | Stock passa de 100 para 150 | P0 |
| T-MOV-02 | Saída diminui stock | 1. Registo de saída de 30 unidades num produto com 100 | Stock passa de 100 para 70 | P0 |
| T-MOV-03 | Saída maior que stock é bloqueada | 1. Tentar saída de 200 unidades num produto com 100 | Erro "Stock insuficiente. Disponível: 100" | P0 |
| T-MOV-04 | Ajuste corrige stock | 1. Produto com 100 unidades 2. Ajuste para 80 | Stock passa para 80; movimento de ajuste registado | P0 |
| T-MOV-05 | Destino obrigatório em saída | 1. Tentar guardar saída sem destino/obra | Erro de validação no campo destino/obra | P0 |
| T-MOV-06 | Quantidade zero bloqueada | 1. Tentar submeter movimento com quantidade 0 | Erro "Quantidade deve ser maior que zero" | P0 |
| T-MOV-07 | Produto desativado excluído | 1. Produto desativado 2. Abrir Novo Movimento | Produto desativado não aparece na seleção | P0 |
| T-MOV-08 | Responsável obrigatório | 1. Submeter sem responsável | Erro de validação no campo responsável | P0 |
| T-MOV-09 | Stock antes e depois guardados | 1. Fazer qualquer movimento | `stock_antes` e `stock_depois` no registo corretos | P1 |

---

### Módulo: Histórico

| Código | Cenário | Passos | Resultado Esperado | Prioridade |
|--------|---------|--------|--------------------|------------|
| T-HIST-01 | Histórico mostra movimento criado | 1. Criar movimento 2. Ir a Histórico | Movimento aparece no topo da lista | P0 |
| T-HIST-02 | Filtro por data | 1. Definir data início e fim 2. Aplicar | Apenas movimentos do intervalo visíveis | P1 |
| T-HIST-03 | Filtro por tipo | 1. Selecionar "Saída" | Apenas saídas visíveis | P1 |
| T-HIST-04 | Histórico mantém produto desativado | 1. Desativar produto 2. Consultar histórico | Movimentos do produto mantêm-se no histórico | P0 |

---

### Módulo: Relatórios

| Código | Cenário | Passos | Resultado Esperado | Prioridade |
|--------|---------|--------|--------------------|------------|
| T-REL-01 | Relatório diário mostra movimentos do dia | 1. Criar movimento hoje 2. Abrir relatório diário | Movimento aparece no relatório | P1 |
| T-REL-02 | Relatório não usa stock_atual diretamente | 1. Consultar qualquer relatório | Totais calculados a partir de movimentos_stock | P0 |
| T-REL-03 | Relatório por obra correto | 1. Registar saída para obra "Obra Norte" 2. Filtrar por obra | Apenas materiais da obra aparecem | P1 |

---

### Módulo: Segurança e Acesso

| Código | Cenário | Passos | Resultado Esperado | Prioridade |
|--------|---------|--------|--------------------|------------|
| T-SEC-01 | Gestor não pode auto-promover a admin | 1. Login como gestor 2. `supabase.from('profiles').update({role:'admin'}).eq('id', meuId)` na consola | Erro de permissão (GRANT bloqueia a coluna `role`) | P0 |
| T-SEC-02 | Gestor não pode criar produto via API direta | 1. Login como gestor 2. `supabase.from('produtos').insert({...})` na consola | RLS rejeita; produto não é criado | P0 |
| T-SEC-03 | Gestor não acede a `/configuracoes` | 1. Login como gestor 2. Navegar para `/configuracoes` | Redireciona para `/` (RoleGuard) | P0 |
| T-SEC-04 | `promover_role` só funciona para admin | 1. Login como gestor 2. Chamar RPC `promover_role` | RPC lança exceção "Autorização negada" | P0 |
| T-SEC-05 | Admin não consegue auto-despromover via RPC | 1. Login como admin 2. `promover_role(meuId, 'gestor')` | RPC lança exceção (evita lockout) | P1 |
| T-SEC-06 | Sessão expira por inatividade | 1. Login 2. Não interagir por 30 min | Logout automático + toast informativo | P1 |
| T-SEC-07 | Headers de segurança presentes | 1. Inspecionar resposta HTTP de qualquer página | CSP, X-Frame-Options, HSTS, etc. presentes | P1 |
| T-SEC-08 | Utilizador não autenticado não lê nenhuma tabela | 1. Chamada à API Supabase sem token (anon) | RLS bloqueia tudo, dados vazios ou 401 | P0 |

---

### Módulo: Alertas

| Código | Cenário | Passos | Resultado Esperado | Prioridade |
|--------|---------|--------|--------------------|------------|
| T-ALERT-01 | Alerta de stock baixo no dashboard | 1. Produto com stock <= stock mínimo | Produto aparece na lista de alertas do dashboard | P0 |
| T-ALERT-02 | Alerta de sem stock | 1. Produto com stock = 0 | Badge "Sem Stock" visível; aparece no topo dos alertas | P0 |

---

## Testes Automatizados (Fase 2)

### Unit Tests (Vitest)

```ts
// utils/stock.test.ts
describe('calcularNovoStock', () => {
  it('entrada soma ao stock', () => {
    expect(calcularNovoStock(100, 50, 'entrada')).toBe(150);
  });
  it('saída subtrai do stock', () => {
    expect(calcularNovoStock(100, 30, 'saida')).toBe(70);
  });
  it('lança erro se saída > stock', () => {
    expect(() => calcularNovoStock(50, 100, 'saida')).toThrow('Stock insuficiente');
  });
  it('stock não pode ser negativo', () => {
    expect(() => calcularNovoStock(0, 1, 'saida')).toThrow();
  });
});
```

### Integration Tests

- Criar produto → aparece na lista
- Registar entrada → stock atualizado
- Registar saída → stock atualizado; saída > stock bloqueia
- Relatório diário → contém movimentos do dia
