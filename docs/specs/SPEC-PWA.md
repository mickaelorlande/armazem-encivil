# SPEC-PWA — Progressive Web App

## Objetivo
Permitir que o Gestor/CEO instale o sistema no iPhone como se fosse uma app nativa, sem passar pela App Store.

## Configuração implementada

### Manifest (`/manifest.webmanifest`)
| Campo | Valor |
|-------|-------|
| name | Controle Armazém ENCIVIL |
| short_name | Armazém ENCIVIL |
| display | standalone |
| orientation | portrait-primary |
| start_url | / |
| theme_color | #1e3a8a |
| background_color | #1e3a8a |

### Ícones gerados (`public/`)
- `favicon.ico` — browser tab
- `icon.svg` — source SVG (ENCIVIL brand)
- `pwa-64x64.png` — browser pequeno
- `pwa-192x192.png` — Android + manifest
- `pwa-512x512.png` — splash screen
- `maskable-icon-512x512.png` — Android adaptive icon
- `apple-touch-icon-180x180.png` — iOS home screen

### Service Worker (Workbox via vite-plugin-pwa)
Estratégia de cache (`vite.config.ts`):

| Recurso | Estratégia | TTL |
|---------|-----------|-----|
| JS/CSS | StaleWhileRevalidate | 7 dias |
| PNG/SVG/ICO/WOFF (imutáveis) | Cache-First | 30 dias |
| Supabase REST/Auth/Storage | Network-First | timeout 10s, fallback 5 min |
| Navegação (HTML) | `navigateFallback: /index.html` | — |

**Importante:** Dados de stock (`supabase.co/rest/**`) nunca são servidos apenas do cache. Network-First garante que o utilizador vê dados reais.

**Bundle único desde 2026-06-22 (ADR-008):** o app deixou de usar `lazy()` por rota — não há mais chunks JS separados por página, só um bundle (~300 KB gzip) + CSS. Isto eliminou por completo o erro "Failed to fetch dynamically imported module" que ocorria nos minutos seguintes a um deploy, quando o service worker tinha o `index.html` antigo em cache com referências a chunks que a Vercel já não servia. `skipWaiting: true` + `clientsClaim: true` continuam ativos para que o novo service worker assuma controlo imediatamente após cada deploy.

### Meta tags iOS (`index.html`)
```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-title" content="Armazém ENCIVIL" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" />
```

## Como instalar no iPhone

1. Abrir `https://[url-do-sistema]` no **Safari** (não Chrome/Firefox)
2. Tocar no botão de **Partilhar** (ícone de caixa com seta para cima)
3. Selecionar **"Adicionar ao Ecrã Inicial"**
4. Confirmar **"Adicionar"**

A app abre em modo standalone (sem barra de URL), com ícone ENCIVIL no home screen.

> O componente `PWAInstallHint` mostra estas instruções automaticamente no Safari iOS se a app ainda não estiver instalada.

## Limitações conhecidas

| Limitação | Detalhe |
|-----------|---------|
| iOS não suporta push notifications via PWA (iOS < 16.4) | Notificações via email/SMS se necessário |
| Offline total não disponível | Dados de stock exigem conexão; apenas shell visual em cache |
| Safari no iOS não suporta todos os recursos PWA | Funcionalidade básica garantida |
| Auto-update do SW pode demorar até ao próximo reload | `registerType: 'autoUpdate'` tenta atualizar automaticamente |

## Checklist de validação
- [ ] Manifest acessível em `/manifest.webmanifest`
- [ ] Ícone aparece no home screen do iPhone
- [ ] App abre em modo standalone (sem barra URL)
- [ ] Status bar respeita `black-translucent`
- [ ] Dados de stock carregam da rede (não do cache)
- [ ] App funciona após reload offline (shell visual apenas)
- [ ] Service worker registado (DevTools → Application → Service Workers)
