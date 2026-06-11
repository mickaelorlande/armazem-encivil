import { useState } from 'react';
import {
  BookOpen,
  FileText,
  Database,
  Shield,
  Layout,
  BarChart2,
  FlaskConical,
  Rocket,
  Map,
  Bot,
  ListTodo,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Info,
  GitBranch,
} from 'lucide-react';

type DocSection = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  category?: string;
  content: React.ReactNode;
};

function Heading1({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-bold text-foreground mb-4 pb-2 border-b border-border">{children}</h2>;
}
function Heading2({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">{children}</h3>;
}
function Para({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground leading-relaxed mb-3">{children}</p>;
}
function Rule({ code, text, highlight }: { code: string; text: string; highlight?: boolean }) {
  return (
    <div className={`flex gap-3 p-3 rounded-lg mb-2 text-sm ${highlight ? 'bg-destructive/10 border border-destructive/20' : 'bg-accent/40 border border-border'}`}>
      <span className="font-mono text-xs text-primary shrink-0 pt-0.5">{code}</span>
      <span className="text-foreground">{text}</span>
    </div>
  );
}
function Tag({ children, color }: { children: React.ReactNode; color: 'blue' | 'green' | 'red' | 'yellow' | 'gray' }) {
  const colors = {
    blue: 'bg-primary/10 text-primary',
    green: 'bg-success/10 text-success',
    red: 'bg-destructive/10 text-destructive',
    yellow: 'bg-warning/10 text-warning',
    gray: 'bg-muted text-muted-foreground',
  };
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[color]} mr-1`}>{children}</span>;
}
function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-sidebar text-sidebar-foreground text-xs p-4 rounded-lg overflow-x-auto mb-4 border border-sidebar-border">
      <code>{children}</code>
    </pre>
  );
}
function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
        <thead className="bg-muted/50">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase border-b border-border">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-accent/30 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2 text-foreground text-xs">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Checklist({ items }: { items: { done: boolean; text: string }[] }) {
  return (
    <ul className="space-y-2 mb-4">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          {item.done ? (
            <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-border shrink-0 mt-0.5" />
          )}
          <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>{item.text}</span>
        </li>
      ))}
    </ul>
  );
}
function Alert({ type, children }: { type: 'info' | 'warning' | 'danger'; children: React.ReactNode }) {
  const styles = {
    info: 'bg-primary/10 border-primary/30 text-primary',
    warning: 'bg-warning/10 border-warning/30 text-warning',
    danger: 'bg-destructive/10 border-destructive/30 text-destructive',
  };
  const icons = { info: Info, warning: AlertTriangle, danger: AlertTriangle };
  const Icon = icons[type];
  return (
    <div className={`flex gap-3 p-4 rounded-lg border mb-4 ${styles[type]}`}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="text-sm">{children}</div>
    </div>
  );
}

const sections: DocSection[] = [
  {
    id: 'readme',
    label: 'README',
    icon: BookOpen,
    category: 'Geral',
    content: (
      <div>
        <Heading1>Controle Armazém ENCIVIL</Heading1>
        <Para>Sistema web interno para controlo de materiais de armazém da empresa ENCIVIL. Permite registar entradas e saídas de materiais de construção de forma rápida (menos de 10 segundos por operação).</Para>

        <Heading2>Stack Técnica</Heading2>
        <Table
          headers={['Componente', 'Tecnologia']}
          rows={[
            ['Frontend', 'React 18 + TypeScript + Vite'],
            ['Estilização', 'Tailwind CSS v4'],
            ['Roteamento', 'React Router v7'],
            ['Backend', 'Supabase (Auth + PostgreSQL + RLS)'],
            ['Deploy', 'Vercel'],
            ['Exportação', 'PDF/Excel (Fase 2)'],
          ]}
        />

        <Heading2>Estado Atual</Heading2>
        <Checklist
          items={[
            { done: true, text: 'Protótipo completo com React + TypeScript' },
            { done: true, text: 'Todas as 8 páginas navegáveis' },
            { done: true, text: 'Dados mock realistas' },
            { done: true, text: 'Design premium paleta ENCIVIL' },
            { done: true, text: 'Documentação técnica completa' },
            { done: false, text: 'Integração Supabase real' },
            { done: false, text: 'Supabase Auth real' },
            { done: false, text: 'RLS configurado' },
            { done: false, text: 'Deploy Vercel' },
          ]}
        />

        <Heading2>Variáveis de Ambiente</Heading2>
        <CodeBlock>{`VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...`}</CodeBlock>
        <Alert type="warning">Nunca usar a <strong>service_role key</strong> no frontend. Usar apenas a chave anon/publishable.</Alert>
      </div>
    ),
  },
  {
    id: 'source-of-truth',
    label: 'Source of Truth',
    icon: FileText,
    category: 'Geral',
    content: (
      <div>
        <Heading1>Source of Truth</Heading1>
        <Alert type="info">Este documento é a verdade principal do projeto. Qualquer dúvida sobre o comportamento esperado resolve-se aqui.</Alert>

        <Heading2>Princípio Orientador</Heading2>
        <Para>Um encarregado de armazém com pouca experiência informática deve conseguir registar uma saída em menos de 10 segundos.</Para>

        <Heading2>O que o Sistema FAZ</Heading2>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mb-4">
          {['Autenticação segura com 1 admin', 'Gestão de produtos (CRUD + desativação)', 'Registo de movimentos: entrada, saída e ajuste', 'Atualização automática de stock', 'Histórico completo e imutável', 'Alertas de stock baixo e sem stock', 'Relatórios por período, produto, categoria e obra'].map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>

        <Heading2>O que o Sistema NÃO FAZ</Heading2>
        <div className="flex flex-wrap gap-2 mb-4">
          {['❌ Ecommerce', '❌ Pagamentos', '❌ ERP completo', '❌ Faturação', '❌ Multiutilizador (MVP)', '❌ Código de barras (MVP)', '❌ Exportação PDF/Excel (MVP)'].map((t) => (
            <span key={t} className="text-xs bg-destructive/10 text-destructive px-3 py-1 rounded-full">{t}</span>
          ))}
        </div>

        <Heading2>Regras de Negócio Imutáveis</Heading2>
        <Rule code="RN-01" text="Entrada soma a quantidade ao stock atual" />
        <Rule code="RN-02" text="Saída subtrai a quantidade do stock atual" />
        <Rule code="RN-03" text="Ajuste corrige o stock para o valor definido explicitamente" />
        <Rule code="RN-04" text="Stock não pode ficar negativo no MVP — saída bloqueada" highlight />
        <Rule code="RN-05" text="Histórico de movimentos NUNCA é apagado fisicamente" highlight />
        <Rule code="RN-06" text="Correções fazem-se por novo movimento de ajuste" />
        <Rule code="RN-07" text="Data/hora registada automaticamente (Europe/Lisbon)" />
        <Rule code="RN-08" text="Quantidade > 0 obrigatório em qualquer movimento" />
        <Rule code="RN-09" text="Destino/obra obrigatório em saídas" />
        <Rule code="RN-12" text="Relatórios calculados de movimentos_stock, nunca só de stock_atual" highlight />
      </div>
    ),
  },
  {
    id: 'modelo-dados',
    label: 'Modelo de Dados',
    icon: Database,
    category: 'Técnico',
    content: (
      <div>
        <Heading1>Modelo de Dados</Heading1>
        <Para>Base de dados: Supabase / PostgreSQL</Para>

        <Heading2>Tabelas</Heading2>
        <Table
          headers={['Tabela', 'Descrição', 'Registos apagáveis?']}
          rows={[
            ['profiles', 'Perfis de utilizadores autenticados', 'Não (cascade auth.users)'],
            ['produtos', 'Materiais do armazém', 'Não (desativação lógica)'],
            ['movimentos_stock', 'Histórico imutável de movimentos', '❌ NUNCA'],
            ['configuracoes_empresa', 'Configurações do sistema (singleton)', 'Não'],
          ]}
        />

        <Heading2>Tabela: produtos</Heading2>
        <CodeBlock>{`id           UUID PK
codigo       TEXT UNIQUE NOT NULL
nome         TEXT NOT NULL
categoria    TEXT NOT NULL
unidade      TEXT NOT NULL
stock_atual  NUMERIC(12,3) DEFAULT 0  CHECK (>= 0)
stock_minimo NUMERIC(12,3) DEFAULT 0  CHECK (>= 0)
ativo        BOOLEAN DEFAULT true
observacoes  TEXT
created_at   TIMESTAMPTZ
updated_at   TIMESTAMPTZ`}</CodeBlock>

        <Heading2>Tabela: movimentos_stock</Heading2>
        <CodeBlock>{`id           UUID PK
produto_id   UUID FK → produtos.id
tipo         ENUM (entrada | saida | ajuste)
quantidade   NUMERIC(12,3) CHECK (> 0)
stock_antes  NUMERIC(12,3) NOT NULL
stock_depois NUMERIC(12,3) CHECK (>= 0)
responsavel  TEXT NOT NULL
destino_obra TEXT  -- obrigatório se tipo = 'saida'
observacoes  TEXT
created_at   TIMESTAMPTZ
created_by   UUID FK → auth.users.id`}</CodeBlock>

        <Alert type="danger">A tabela <strong>movimentos_stock</strong> não tem policy de DELETE no RLS. Nenhum utilizador consegue apagar movimentos.</Alert>
      </div>
    ),
  },
  {
    id: 'arquitetura',
    label: 'Arquitetura',
    icon: Layout,
    category: 'Técnico',
    content: (
      <div>
        <Heading1>Arquitetura</Heading1>
        <Para>SPA (Single Page Application) com backend gerido pelo Supabase. Sem servidor dedicado.</Para>

        <Heading2>Estrutura de Pastas</Heading2>
        <CodeBlock>{`src/
├── app/            # Páginas, layouts, componentes UI
│   ├── pages/      # LoginPage, DashboardPage, ...
│   ├── components/ # Sidebar, StatCard, StockBadge...
│   └── routes.tsx
├── features/       # Lógica de negócio por módulo
│   ├── auth/
│   ├── produtos/
│   ├── movimentos/ # services, hooks, types
│   └── relatorios/
├── integrations/
│   └── supabase/   # client.ts, types.ts, queries/
├── utils/          # date.ts, stock.ts (funções puras)
└── styles/         # theme.css, fonts.css`}</CodeBlock>

        <Heading2>Regra para Agents</Heading2>
        <Alert type="warning">Agents não devem misturar regra de negócio dentro de componentes visuais quando puder ser isolada em services/utils.</Alert>

        <Table
          headers={['Camada', 'Responsabilidade']}
          rows={[
            ['app/pages/', 'UI e navegação — sem lógica de negócio'],
            ['features/*/services/', 'Lógica de negócio + chamadas ao Supabase'],
            ['features/*/hooks/', 'Estado React + mutações'],
            ['integrations/supabase/', 'Client Supabase + queries SQL'],
            ['utils/', 'Funções puras (stock, datas, formatação)'],
          ]}
        />
      </div>
    ),
  },
  {
    id: 'seguranca',
    label: 'Segurança e Acesso',
    icon: Shield,
    category: 'Técnico',
    content: (
      <div>
        <Heading1>Segurança e Controlo de Acesso</Heading1>

        <Heading2>Modelo MVP</Heading2>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mb-4">
          <li>1 utilizador administrador único</li>
          <li>Login obrigatório para acesso a qualquer funcionalidade</li>
          <li>RLS ativa no Supabase em todas as tabelas</li>
          <li>Nenhuma chave secreta exposta no frontend</li>
        </ul>

        <Heading2>Variáveis de Ambiente — Regras</Heading2>
        <CodeBlock>{`# ✅ Usar no frontend (Vite):
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...

# ❌ NUNCA no frontend:
SUPABASE_SERVICE_ROLE_KEY=...   ← PROIBIDO
DATABASE_URL=...                ← PROIBIDO`}</CodeBlock>

        <Heading2>Checklist de Segurança</Heading2>
        <Checklist
          items={[
            { done: false, text: 'RLS ativa em todas as tabelas' },
            { done: false, text: 'Nenhuma service_role key no código Vite' },
            { done: false, text: 'HTTPS forçado (automático na Vercel)' },
            { done: false, text: 'Sem policy DELETE em movimentos_stock' },
            { done: false, text: 'Auth testado com credenciais inválidas' },
            { done: false, text: 'RLS testada sem token (deve bloquear)' },
          ]}
        />
      </div>
    ),
  },
  {
    id: 'ux-ui',
    label: 'UX / UI',
    icon: Layout,
    category: 'Design',
    content: (
      <div>
        <Heading1>Documentação UX/UI</Heading1>

        <Heading2>Princípios</Heading2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {[
            { n: '1', t: 'Rapidez', d: 'Registar saída < 10 segundos' },
            { n: '2', t: 'Clareza', d: 'Utilizador sem experiência entende' },
            { n: '3', t: 'Feedback', d: 'Cada ação confirma resultado' },
            { n: '4', t: 'Hierarquia', d: 'Ações frequentes sempre visíveis' },
            { n: '5', t: 'Alertas', d: 'Stock baixo visível sem procurar' },
          ].map((p) => (
            <div key={p.n} className="flex gap-3 p-3 bg-accent/40 rounded-lg border border-border">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center shrink-0 font-bold">{p.n}</span>
              <div>
                <div className="text-sm font-medium text-foreground">{p.t}</div>
                <div className="text-xs text-muted-foreground">{p.d}</div>
              </div>
            </div>
          ))}
        </div>

        <Heading2>Paleta de Cores ENCIVIL</Heading2>
        <Table
          headers={['Token', 'Uso', 'Cor']}
          rows={[
            ['--primary', 'Ações principais, sidebar ativa', 'Azul escuro #1e3a5f'],
            ['--success', 'Entradas, confirmações', 'Verde #16a34a'],
            ['--destructive', 'Saídas, erros', 'Vermelho #dc2626'],
            ['--warning', 'Stock baixo, alertas', 'Âmbar #d97706'],
            ['--background', 'Fundo da página', 'Branco #ffffff'],
          ]}
        />

        <Heading2>Telas — Fluxo Crítico: Novo Movimento</Heading2>
        <Para>A tela de Novo Movimento é o coração do sistema. O objetivo é permitir completar uma saída em menos de 10 segundos:</Para>
        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground mb-4">
          <li>Tipo pré-selecionado: Saída</li>
          <li>Pesquisa de produto por nome/código (autocomplete)</li>
          <li>Stock disponível visível em tempo real</li>
          <li>Campo quantidade grande e numérico</li>
          <li>Destino/obra (obrigatório)</li>
          <li>Confirmar → toast de sucesso → formulário reset</li>
        </ol>
      </div>
    ),
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    icon: BarChart2,
    category: 'Funcional',
    content: (
      <div>
        <Heading1>Relatórios</Heading1>
        <Alert type="info"><strong>Regra fundamental:</strong> Todos os relatórios são calculados a partir de <code>movimentos_stock</code>. Nunca apenas de <code>produtos.stock_atual</code>.</Alert>

        <Table
          headers={['Tipo', 'Objetivo', 'Filtros', 'Base de cálculo']}
          rows={[
            ['Diário', 'Movimentos do dia atual', 'Data', 'movimentos_stock WHERE date = hoje'],
            ['Semanal', 'Últimos 7 dias por dia', 'Semana', 'GROUP BY dia'],
            ['Mensal', 'Mês atual por produto', 'Mês/Ano', 'GROUP BY produto + mês'],
            ['Anual', 'Ano atual por mês', 'Ano', 'GROUP BY mês + tipo'],
            ['Por Produto', 'Historial de um produto', 'Produto + Período', 'WHERE produto_id = X'],
            ['Por Categoria', 'Consumo por categoria', 'Categoria + Período', 'JOIN produtos ON categoria'],
            ['Por Obra', 'Materiais consumidos por obra', 'Obra (texto)', 'WHERE tipo = saida AND destino_obra ILIKE'],
          ]}
        />

        <Heading2>Exemplo: Relatório por Obra</Heading2>
        <CodeBlock>{`SELECT
  p.nome, p.categoria, p.unidade,
  SUM(m.quantidade) AS total_consumido
FROM movimentos_stock m
JOIN produtos p ON m.produto_id = p.id
WHERE m.tipo = 'saida'
  AND m.destino_obra ILIKE '%' || :obra || '%'
GROUP BY p.id, p.nome, p.categoria, p.unidade
ORDER BY total_consumido DESC;`}</CodeBlock>
      </div>
    ),
  },
  {
    id: 'regras-negocio',
    label: 'Regras de Negócio',
    icon: FileText,
    category: 'Funcional',
    content: (
      <div>
        <Heading1>Regras de Negócio</Heading1>

        <Heading2>Produto</Heading2>
        <Rule code="RN-PROD-04" text="Produto ativo aparece na seleção de novos movimentos" />
        <Rule code="RN-PROD-05" text="Produto desativado NÃO aparece em novos movimentos" highlight />
        <Rule code="RN-PROD-06" text="Produto desativado mantém todo o histórico de movimentos" />
        <Rule code="RN-PROD-07" text="Produtos não são apagados fisicamente (desativação lógica)" highlight />
        <Rule code="RN-PROD-08" text="Stock atual não é editável diretamente — apenas via movimentos" highlight />

        <Heading2>Movimentos</Heading2>
        <Rule code="RN-ENT-01" text="Entrada: novo_stock = stock_atual + quantidade" />
        <Rule code="RN-SAI-01" text="Saída: novo_stock = stock_atual - quantidade" />
        <Rule code="RN-SAI-02" text="Saída que resulte em stock negativo é BLOQUEADA" highlight />
        <Rule code="RN-SAI-03" text="Destino/obra é obrigatório em saídas" />
        <Rule code="RN-AJU-01" text="Ajuste: stock corrigido para valor após contagem física" />
        <Rule code="RN-AJU-03" text="Observação é obrigatória em ajustes (explicar motivo)" />

        <Heading2>Stock</Heading2>
        <Rule code="RN-STOCK-01" text="Stock nunca pode ser inferior a zero (MVP)" highlight />
        <Rule code="RN-STOCKMIN-02" text="Stock baixo: stock_atual <= stock_minimo AND stock_atual > 0" />
        <Rule code="RN-STOCKMIN-03" text="Sem stock: stock_atual = 0" />

        <Heading2>Data/Hora</Heading2>
        <Rule code="RN-DATA-01" text="Data/hora registada automaticamente no momento da submissão" />
        <Rule code="RN-DATA-02" text="Timezone obrigatório: Europe/Lisbon" />
        <Rule code="RN-DATA-03" text="Utilizador não pode alterar data/hora após o registo" />
      </div>
    ),
  },
  {
    id: 'testes',
    label: 'Plano de Testes',
    icon: FlaskConical,
    category: 'Qualidade',
    content: (
      <div>
        <Heading1>Plano de Testes</Heading1>

        <Heading2>Cenários Críticos (P0)</Heading2>
        <Table
          headers={['Código', 'Cenário', 'Resultado esperado']}
          rows={[
            ['T-AUTH-01', 'Login com credenciais corretas', 'Redireciona para Dashboard'],
            ['T-MOV-01', 'Entrada de 50 un. num produto com 100', 'Stock passa para 150'],
            ['T-MOV-02', 'Saída de 30 un. num produto com 100', 'Stock passa para 70'],
            ['T-MOV-03', 'Saída de 200 un. num produto com 100', 'BLOQUEADO: "Stock insuficiente. Disponível: 100"'],
            ['T-MOV-04', 'Ajuste de produto com 100 un. para 80', 'Stock passa para 80'],
            ['T-PROD-04', 'Desativar produto existente', 'Some da seleção de movimentos; mantém histórico'],
            ['T-HIST-04', 'Produto desativado — ver histórico', 'Movimentos do produto visíveis no histórico'],
            ['T-ALERT-01', 'Produto com stock <= stock mínimo', 'Aparece nos alertas do Dashboard'],
          ]}
        />

        <Heading2>Unidade (Vitest)</Heading2>
        <CodeBlock>{`// utils/stock.test.ts
describe('calcularNovoStock', () => {
  it('entrada soma', () => expect(calcular(100, 50, 'entrada')).toBe(150));
  it('saída subtrai', () => expect(calcular(100, 30, 'saida')).toBe(70));
  it('saída > stock lança erro', () =>
    expect(() => calcular(50, 100, 'saida')).toThrow('Stock insuficiente'));
});`}</CodeBlock>
      </div>
    ),
  },
  {
    id: 'implantacao',
    label: 'Implantação',
    icon: Rocket,
    category: 'Operacional',
    content: (
      <div>
        <Heading1>Implantação</Heading1>

        <Heading2>Passos de Deploy</Heading2>
        <div className="space-y-3 mb-4">
          {[
            { n: '1', t: 'Criar projeto Supabase', d: 'supabase.com → Novo projeto → Anotar URL e Anon Key' },
            { n: '2', t: 'Executar migration SQL', d: 'SQL Editor Supabase → migration de docs/03-modelo-de-dados.md' },
            { n: '3', t: 'Configurar Auth', d: 'Criar utilizador admin → INSERT em profiles' },
            { n: '4', t: 'Ativar RLS', d: 'Executar policies de docs/05-seguranca-e-acesso.md' },
            { n: '5', t: 'Deploy Vercel', d: 'Importar repo GitHub → Adicionar variáveis de ambiente' },
            { n: '6', t: 'Configuração inicial', d: 'Login → Configurações → Produtos → Stock inicial' },
          ].map((s) => (
            <div key={s.n} className="flex gap-3 p-3 bg-accent/40 rounded-lg border border-border">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center shrink-0 font-bold">{s.n}</span>
              <div>
                <div className="text-sm font-medium text-foreground">{s.t}</div>
                <div className="text-xs text-muted-foreground">{s.d}</div>
              </div>
            </div>
          ))}
        </div>

        <Heading2>Checklist de Produção</Heading2>
        <Checklist
          items={[
            { done: false, text: 'Migration SQL executada com sucesso' },
            { done: false, text: 'RLS ativa em todas as tabelas' },
            { done: false, text: 'Utilizador admin criado' },
            { done: false, text: 'Login testado e funcional' },
            { done: false, text: 'Entrada e saída testadas' },
            { done: false, text: 'Saída com stock insuficiente bloqueada' },
            { done: false, text: 'Responsável de armazém treinado' },
            { done: false, text: 'Backup definido' },
          ]}
        />
      </div>
    ),
  },
  {
    id: 'roadmap',
    label: 'Roadmap',
    icon: Map,
    category: 'Operacional',
    content: (
      <div>
        <Heading1>Roadmap</Heading1>

        <Heading2>MVP — Fase 1</Heading2>
        <Checklist
          items={[
            { done: true, text: 'Autenticação' },
            { done: true, text: 'Dashboard com estatísticas' },
            { done: true, text: 'CRUD de Produtos' },
            { done: true, text: 'Registo de Entrada, Saída e Ajuste' },
            { done: true, text: 'Bloqueio de saída sem stock' },
            { done: true, text: 'Histórico de movimentos' },
            { done: true, text: 'Alertas de stock baixo' },
            { done: true, text: 'Relatórios básicos' },
            { done: false, text: 'Integração Supabase real' },
            { done: false, text: 'Deploy Vercel' },
          ]}
        />

        <Heading2>Fase 2 — Produtividade</Heading2>
        <div className="flex flex-wrap gap-2 mb-4">
          {['Multiutilizador', 'Exportação Excel', 'Exportação PDF', 'Código de barras', 'Importação CSV', 'Obras cadastradas', 'Notificações e-mail'].map((f) => (
            <Tag key={f} color="blue">{f}</Tag>
          ))}
        </div>

        <Heading2>Fase 3 — Integração</Heading2>
        <div className="flex flex-wrap gap-2 mb-4">
          {['Integração faturação', 'Integração compras', 'Alertas automáticos', 'App Mobile / PWA', 'Multi-armazém', 'Gestão fornecedores'].map((f) => (
            <Tag key={f} color="gray">{f}</Tag>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'agents',
    label: 'AGENTS.md',
    icon: Bot,
    category: 'Para Agents',
    content: (
      <div>
        <Heading1>Guia para Agents de IA</Heading1>
        <Alert type="warning">Ler este ficheiro antes de fazer qualquer alteração ao código.</Alert>

        <Heading2>Antes de Qualquer Alteração</Heading2>
        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground mb-4">
          <li>Ler <code>docs/00-source-of-truth.md</code></li>
          <li>Ler a SPEC do módulo em <code>docs/specs/SPEC-*.md</code></li>
          <li>Ler <code>docs/02-regras-de-negocio.md</code> para tarefas de stock</li>
          <li>Verificar a tarefa no <code>TASKS.md</code></li>
        </ol>

        <Heading2>Regras — O que FAZER</Heading2>
        <ul className="list-disc list-inside space-y-1 text-sm text-success mb-4">
          {['Alterações pequenas e isoladas', 'Separar UI de lógica de negócio', 'Funções puras em utils/', 'Preservar todos os movimentos', 'Validar stock antes de saída', 'Usar timezone Europe/Lisbon'].map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>

        <Heading2>Regras — O que NÃO FAZER</Heading2>
        <ul className="list-disc list-inside space-y-1 text-sm text-destructive mb-4">
          {['Inventar funcionalidades fora do escopo', 'Transformar em ERP', 'Apagar movimentos_stock', 'Editar stock_atual diretamente', 'Colocar service_role key no frontend', 'Misturar regra de negócio em componentes UI'].map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>

        <Heading2>Regras Críticas</Heading2>
        <CodeBlock>{`stock_novo = stock_atual + quantidade  // entrada
stock_novo = stock_atual - quantidade  // saída — bloquear se negativo
stock_novo = valor_definido            // ajuste

movimentos_stock: NUNCA DELETE, NUNCA UPDATE
produtos.stock_atual: NUNCA editar diretamente`}</CodeBlock>

        <Heading2>Ao Finalizar uma Tarefa, Reportar</Heading2>
        <CodeBlock>{`## Tarefa concluída: [título]

### Ficheiros alterados
- src/features/movimentos/services/movimentosService.ts

### Comportamento alterado
- [descrever o que mudou]

### Testes executados
- T-MOV-03 ✅

### Riscos conhecidos
- [ou "Nenhum identificado"]`}</CodeBlock>
      </div>
    ),
  },
  {
    id: 'tasks',
    label: 'TASKS.md',
    icon: ListTodo,
    category: 'Para Agents',
    content: (
      <div>
        <Heading1>Backlog de Desenvolvimento</Heading1>

        <Heading2>P0 — Essencial</Heading2>
        <Table
          headers={['ID', 'Tarefa', 'Risco']}
          rows={[
            ['TASK-001', 'Integração Supabase Client', 'Baixo'],
            ['TASK-002', 'Executar Migration SQL', 'Médio'],
            ['TASK-003', 'Auth Supabase + Proteção de Rotas', 'Médio'],
            ['TASK-004', 'Configurar RLS', 'Alto'],
            ['TASK-005', 'CRUD Produtos (Supabase real)', 'Baixo'],
            ['TASK-006', 'Registo de Movimentos (Supabase real)', 'Alto'],
            ['TASK-007', 'Histórico (Supabase real)', 'Baixo'],
            ['TASK-008', 'Dashboard (Supabase real)', 'Baixo'],
          ]}
        />

        <Heading2>P1 — Importante</Heading2>
        <Table
          headers={['ID', 'Tarefa']}
          rows={[
            ['TASK-009', 'Relatórios (Supabase real)'],
            ['TASK-010', 'Configurações (Supabase real)'],
            ['TASK-011', 'Página Detalhe do Produto'],
          ]}
        />

        <Heading2>P2 — Futuro (Fase 2+)</Heading2>
        <div className="flex flex-wrap gap-2">
          {['TASK-020: Exportação Excel', 'TASK-021: Exportação PDF', 'TASK-022: Multiutilizador', 'TASK-023: Código de barras', 'TASK-024: Importação CSV', 'TASK-025: Obras cadastradas', 'TASK-027: PWA offline', 'TASK-028: Integração faturação'].map((t) => (
            <Tag key={t} color="gray">{t}</Tag>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'adrs',
    label: 'ADRs',
    icon: GitBranch,
    category: 'Para Agents',
    content: (
      <div>
        <Heading1>Decisões Arquiteturais (ADRs)</Heading1>

        {[
          {
            id: 'ADR-001',
            title: 'Usar Supabase em vez de servidor local',
            decision: 'Usar Supabase como BaaS — backend gerido sem servidor dedicado.',
            why: 'ENCIVIL não tem infraestrutura e equipa técnica pequena.',
            tradeoff: 'Vendor lock-in vs zero gestão de infraestrutura.',
          },
          {
            id: 'ADR-002',
            title: 'React + TypeScript + Vite como frontend',
            decision: 'Stack frontend moderna com type-safety e build rápido.',
            why: 'TypeScript previne erros de runtime críticos para lógica de stock.',
            tradeoff: 'Mais verboso que JS puro, mas mais robusto.',
          },
          {
            id: 'ADR-003',
            title: 'Histórico de movimentos como fonte dos relatórios',
            decision: 'Relatórios calculados exclusivamente de movimentos_stock.',
            why: 'Auditabilidade total; consistência histórica mesmo se stock_atual for corrigido.',
            tradeoff: 'Queries mais complexas, mas dados sempre fiáveis.',
          },
          {
            id: 'ADR-004',
            title: 'MVP com apenas um utilizador administrador',
            decision: 'Sem multiutilizador no MVP.',
            why: 'Reduz complexidade significativamente; 1 encarregado de armazém.',
            tradeoff: 'Sem rastreabilidade por utilizador no MVP.',
          },
          {
            id: 'ADR-005',
            title: 'Bloquear stock negativo no MVP',
            decision: 'Saída que resultasse em stock negativo é rejeitada.',
            why: 'Integridade dos dados; evita relatórios com valores negativos confusos.',
            tradeoff: 'Menos flexível, mas dados sempre corretos.',
          },
          {
            id: 'ADR-006',
            title: 'Não apagar movimentos fisicamente',
            decision: 'Movimentos nunca são apagados. Correções via novo ajuste.',
            why: 'Auditabilidade total e integridade histórica do stock.',
            tradeoff: 'Utilizador precisa de aprender a corrigir via ajuste.',
          },
        ].map((adr) => (
          <div key={adr.id} className="p-4 bg-accent/40 rounded-lg border border-border mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Tag color="blue">{adr.id}</Tag>
              <span className="text-sm font-medium text-foreground">{adr.title}</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div><span className="font-medium text-foreground">Decisão:</span> {adr.decision}</div>
              <div><span className="font-medium text-foreground">Motivo:</span> {adr.why}</div>
              <div><span className="font-medium text-foreground">Trade-off:</span> {adr.tradeoff}</div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
];

const categories = ['Geral', 'Técnico', 'Design', 'Funcional', 'Qualidade', 'Operacional', 'Para Agents'];

export function DocsPage() {
  const [activeId, setActiveId] = useState('readme');
  const active = sections.find((s) => s.id === activeId)!;

  return (
    <div className="flex h-[calc(100vh-64px)] -mt-6 -mx-6 overflow-hidden">
      {/* Sidebar da documentação */}
      <aside className="w-56 border-r border-border bg-muted/30 flex flex-col overflow-y-auto shrink-0">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Documentação</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Projeto ENCIVIL v1.0</p>
        </div>

        <nav className="flex-1 p-3">
          {categories.map((cat) => {
            const catSections = sections.filter((s) => s.category === cat);
            if (!catSections.length) return null;
            return (
              <div key={cat} className="mb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase px-2 mb-1">{cat}</p>
                <ul className="space-y-0.5">
                  {catSections.map((s) => {
                    const Icon = s.icon;
                    const isActive = s.id === activeId;
                    return (
                      <li key={s.id}>
                        <button
                          onClick={() => setActiveId(s.id)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors ${isActive ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{s.label}</span>
                          {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 overflow-y-auto p-8 bg-background">
        <div className="max-w-3xl mx-auto">
          {active.content}
        </div>
      </main>
    </div>
  );
}
