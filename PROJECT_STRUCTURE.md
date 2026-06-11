# Controle Armazém ENCIVIL - Estrutura do Projeto

## Visão Geral
Sistema interno de controle de armazém para a ENCIVIL, empresa de construção civil em Portugal. Sistema profissional e navegável para gerir entradas, saídas e stock de materiais.

## Estrutura de Diretórios

```
src/app/
├── components/          # Componentes reutilizáveis
│   ├── Sidebar.tsx           # Menu lateral de navegação
│   ├── Header.tsx            # Cabeçalho com perfil e notificações
│   ├── StatCard.tsx          # Cartão de estatísticas
│   ├── StockBadge.tsx        # Badge de estado do stock
│   ├── MovementTypeBadge.tsx # Badge de tipo de movimento
│   └── EmptyState.tsx        # Estado vazio (sem dados)
│
├── layouts/            # Layouts principais
│   └── MainLayout.tsx        # Layout com sidebar + header
│
├── pages/              # Páginas do sistema
│   ├── LoginPage.tsx         # Tela de autenticação
│   ├── DashboardPage.tsx     # Dashboard principal
│   ├── ProductsPage.tsx      # Listagem e gestão de produtos
│   ├── ProductDetailPage.tsx # Detalhes e histórico de produto
│   ├── NewMovementPage.tsx   # Registo de movimentos
│   ├── HistoryPage.tsx       # Histórico completo
│   ├── ReportsPage.tsx       # Relatórios e gráficos
│   ├── SettingsPage.tsx      # Configurações do sistema
│   └── NotFoundPage.tsx      # Página 404
│
├── data/               # Dados mock e helpers
│   └── mockData.ts           # Produtos e movimentos de exemplo
│
├── types.ts            # Tipos TypeScript
├── routes.tsx          # Configuração das rotas
└── App.tsx             # Componente raiz
```

## Rotas do Sistema

| Rota                  | Página                | Descrição                           |
|-----------------------|-----------------------|-------------------------------------|
| `/login`              | LoginPage             | Autenticação                        |
| `/`                   | DashboardPage         | Dashboard principal                 |
| `/produtos`           | ProductsPage          | Listagem de produtos                |
| `/produtos/:id`       | ProductDetailPage     | Detalhes do produto                 |
| `/novo-movimento`     | NewMovementPage       | Registo de entrada/saída/ajuste     |
| `/historico`          | HistoryPage           | Histórico de movimentos             |
| `/relatorios`         | ReportsPage           | Relatórios e gráficos               |
| `/configuracoes`      | SettingsPage          | Configurações do sistema            |
| `*`                   | NotFoundPage          | Página não encontrada               |

## Tipos de Dados Principais

### Product
- `id`: string
- `code`: string (código único)
- `name`: string
- `category`: ProductCategory
- `unit`: Unit
- `currentStock`: number
- `minStock`: number
- `status`: 'normal' | 'baixo' | 'sem-stock'

### Movement
- `id`: string
- `productId`: string
- `type`: 'entrada' | 'saida' | 'ajuste'
- `quantity`: number
- `responsible`: string
- `destination`: string (fornecedor ou obra)
- `date`: Date
- `previousStock`: number
- `newStock`: number

## Paleta de Cores (Tema ENCIVIL)

### Cores Principais
- **Primary (Azul ENCIVIL)**: `#1e3a8a`
- **Success (Verde)**: `#16a34a`
- **Warning (Amarelo)**: `#f59e0b`
- **Destructive (Vermelho)**: `#dc2626`
- **Secondary (Cinza)**: `#64748b`

### Cores de Fundo
- **Background**: `#f5f6f8`
- **Card**: `#ffffff`
- **Sidebar**: `#1a1d29`

## Funcionalidades Principais

### 1. Dashboard
- Estatísticas rápidas (total produtos, entradas/saídas do dia, stock baixo)
- Últimos 10 movimentos
- Alertas de stock baixo
- Botões rápidos para registar entrada/saída

### 2. Produtos
- Listagem completa com filtro de pesquisa
- Adicionar novo produto (modal)
- Ver detalhes do produto
- Indicadores visuais de estado do stock

### 3. Novo Movimento
- Interface rápida (objetivo: < 10 segundos)
- 3 tipos: Entrada, Saída, Ajuste
- Validação de stock insuficiente
- Stock atual visível antes de confirmar
- Feedback visual de sucesso

### 4. Histórico
- Todos os movimentos com filtros
- Filtro por período (hoje, semana, mês, todos)
- Filtro por tipo de movimento
- Exportação de dados

### 5. Relatórios
- Gráficos de produtos mais consumidos
- Distribuição por categoria
- Estatísticas do período
- Exportação para PDF/Excel

### 6. Configurações
- Dados da empresa
- Configurações de stock mínimo padrão
- Preferências de notificações

## Como Adicionar Novas Funcionalidades

### Adicionar Nova Página
1. Criar componente em `src/app/pages/NomePage.tsx`
2. Adicionar rota em `src/app/routes.tsx`
3. Adicionar item ao menu em `src/app/components/Sidebar.tsx`

### Adicionar Novo Tipo de Produto
1. Atualizar `ProductCategory` em `src/app/types.ts`
2. Adicionar label em `getCategoryLabel()` em `src/app/data/mockData.ts`

### Adicionar Nova Unidade
1. Atualizar `Unit` em `src/app/types.ts`
2. Adicionar label em `getUnitLabel()` em `src/app/data/mockData.ts`

## Próximos Passos (Integração Backend)

Para converter em sistema real com Supabase:

1. **Criar tabelas no Supabase:**
   - `products` (produtos)
   - `movements` (movimentos)
   - `users` (utilizadores)
   - `settings` (configurações)

2. **Substituir mockData:**
   - Criar hooks para fetch de dados
   - Implementar mutations para criar/atualizar
   - Adicionar loading states

3. **Autenticação:**
   - Implementar login real com Supabase Auth
   - Proteger rotas privadas
   - Gerir sessão do utilizador

4. **Real-time:**
   - Subscrições Supabase para atualizações em tempo real
   - Notificações de stock baixo

## Ícones Utilizados (Lucide React)

- `LayoutDashboard` - Dashboard
- `Package` - Produtos
- `Plus` - Novo movimento
- `History` - Histórico
- `FileBarChart` - Relatórios
- `Settings` - Configurações
- `Warehouse` - Logo ENCIVIL
- `ArrowDownCircle` - Entrada
- `ArrowUpCircle` - Saída
- `Edit3` - Ajuste
- `AlertTriangle` - Alertas

## Dependências Principais

- `react-router` - Navegação
- `recharts` - Gráficos
- `lucide-react` - Ícones
- `date-fns` - Manipulação de datas
- Tailwind CSS v4 - Estilos

## Notas de Design

- Sistema otimizado para desktop e tablet
- Menu lateral fixo em desktop
- Foco em velocidade operacional (< 10 segundos para registar saída)
- Feedback visual imediato
- Português de Portugal em toda interface
- Design empresarial profissional
