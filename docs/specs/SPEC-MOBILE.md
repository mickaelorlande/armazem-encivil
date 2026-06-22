# SPEC-MOBILE — Estratégia Mobile-First

## Filosofia
A interface é desenhada primeiro para ecrãs pequenos (iPhone) e expande progressivamente para tablet e desktop. Não é "responsivo" no sentido de adaptar uma UI desktop — é mobile-first de raiz.

## Breakpoints (Tailwind CSS v4)
| Prefixo | Largura | Dispositivo |
|---------|---------|-------------|
| (base) | 0px+ | iPhone, telemóvel Android |
| `md:` | 768px+ | Tablet, iPad |
| `lg:` | 1024px+ | Desktop, laptop |

## Navegação

### Mobile (< 768px)
- **Bottom navigation bar** fixada em baixo (`MobileBottomNav.tsx`)
- 5 itens: Dashboard, Produtos, **+ Movimento** (destaque), Histórico, Relatórios
- Botão central "Novo Movimento" elevado com cor primária
- Sidebar escondida (`hidden md:flex`)
- Header compacto com hamburger → abre drawer lateral

### Desktop (≥ 768px)
- Sidebar fixa à esquerda (256px)
- Header com data e info do utilizador
- Bottom nav escondida (`md:hidden`)

## Componentes adicionados
| Componente | Ficheiro | Propósito |
|-----------|---------|-----------|
| MobileBottomNav | `src/app/components/MobileBottomNav.tsx` | Nav inferior mobile |
| PWAInstallHint | `src/app/components/PWAInstallHint.tsx` | Instrução iOS install |

## Padrão de páginas: dual-view

Páginas com listas/tabelas usam dual-view:
```
Mobile (< md):  Cards verticais, toque fácil, informação resumida
Desktop (≥ md): Tabela completa com todas as colunas
```

Implementado em: `ProductsPage`, `HistoryPage`, `DashboardPage`

## Perfil Gestor/Encarregado (iPhone)
Role `gestor` implementado e em produção (RLS + RoleGuard, não apenas UI):
- Dashboard prioriza leitura (stats, alertas, movimentos recentes)
- Ações de saída/entrada no topo (atalhos rápidos) — `MobileBottomNav` mostra o botão "+" central também para gestor
- Alertas de stock baixo visíveis imediatamente
- Botões de criar/editar/ajustar produto e Configurações **não aparecem** (RLS bloquearia mesmo que aparecessem)
- Pode registar movimentos (entrada/saída/ajuste) normalmente

## Perfil Administrador do Armazém
Otimizado para velocidade operacional:
- Botão "Registar Saída" com destaque visual (destrutivo/vermelho)
- Botão "Registar Entrada" com destaque (verde)
- Formulário de novo movimento com:
  - Input de quantidade grande (toque fácil, `inputMode="decimal"`)
  - Botão sticky no fundo (sempre acessível sem scroll)
  - Toast de erro em vez de `alert()`
  - Info do stock atual visível antes de confirmar

## Touch & Acessibilidade
- Todos os botões primários ≥ 48px de altura
- Tap areas generosas em cards
- `active:scale-95` em botões (feedback tátil)
- `inputMode="decimal"` em campos numéricos (teclado correto no iOS)
- `autocomplete` em campos de email/password
- `safe-area-inset-*` para iPhone com notch/Dynamic Island

## Checklist de validação mobile
- [ ] Sidebar escondida em viewport < 768px
- [ ] Bottom nav visível e funcional em iPhone
- [ ] Hamburger abre drawer lateral
- [ ] Dashboard mostra cards em 2 colunas no mobile
- [ ] Últimos movimentos em cards (não tabela) no mobile
- [ ] Produtos em cards no mobile, tabela no desktop
- [ ] Histórico em cards no mobile, tabela no desktop
- [ ] Formulário de novo movimento com botão sticky
- [ ] Input de quantidade grande e com teclado decimal
- [ ] Toast em vez de alert() para erros
- [ ] Safe area respeitada (notch iPhone)
