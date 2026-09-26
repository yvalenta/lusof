# Lusof Sweet — la web

SPA promocional de **Lusof Sweet** («Chocolates hechos con amor», pedidos por WhatsApp
al 300 750 3552). Muestra los antojos y las cajas de regalo, deja armar un pedido y lo
manda armado a WhatsApp.

**Publicada** desde el 2026-09-26 (GO de Yonatan): repo público
[`yvalenta/lusof`](https://github.com/yvalenta/lusof), GitHub Pages desde `main` (raíz),
dominio <https://lusof.ynt.codes> por el archivo `CNAME` y un registro CNAME
`lusof → yvalenta.github.io` en Cloudflare **sin proxy** (nube gris), igual que
resplandor. **Cada push a `main` sale al aire**: probar en local antes de empujar.

## Correrla

```bash
cd ~/Developer/lusof && python3 -m http.server 8790 --bind 127.0.0.1
```

y abrir <http://localhost:8790>. No usar `file://` (el pedido se guarda en
localStorage y Safari lo trata raro fuera de http). `.claude/launch.json` tiene la
misma configuración para el panel de vista previa.

## Stack (sin build)

| pieza | versión fija | para qué |
|---|---|---|
| `@tailwindcss/browser` | 4.3.3 | utilidades de layout; tokens de marca en `@theme` dentro de `index.html` |
| `alpinejs` + `@alpinejs/focus` | 3.17.4 | estado (`Alpine.store`), vistas (`x-if`), foco atrapado en el cajón (`x-trap`) |
| `lucide` (UMD) | 1.48.0 | íconos |
| Gluten + Figtree (Google Fonts) | — | titulares / texto |

Las cuatro eran la última versión del registro de npm el 2026-09-26. Tailwind en el
navegador es «solo para desarrollo» según su documentación: para un sitio local está
bien; el día que se publique conviene compilarlo (Tailwind CLI) y el `@theme` pasa casi
igual.

## Estructura

```
index.html               todas las vistas (plantillas x-if), barra, goteo, pie, cajón del pedido
assets/js/catalogo.js    productos y precios — lo único que hay que tocar para cambiar el menú
assets/js/app.js         rutas por hash, Alpine.store('pedido'), mensaje de WhatsApp, efectos
assets/css/lusof.css     marca, mosaicos, cajón, transiciones y «reducir movimiento»
assets/img/antojos/      11 ilustraciones SVG propias (respaldo mientras no haya fotos)
assets/img/              logo recortado, favicon, QR de WhatsApp, imagen para compartir
docs/                    investigación de base (Resplandor, transitions.dev, CDN)
```

## Contratos que no se rompen

- **Orden de scripts** en `<head>`: lucide → catalogo.js → app.js → focus → alpine, todos
  `defer`. `app.js` registra stores y directivas en `alpine:init`, así que debe correr
  antes que Alpine.
- **Lucide se llama una sola vez** (`createIcons({ inTemplates: true })` al tope de
  `app.js`), antes de que Alpine clone plantillas. El `<svg>` que deja conserva
  `data-lucide`: volver a llamarlo reemplaza íconos ya pintados.
- **Rutas**: `#/`, `#/antojos`, `#/regalos`, `#/como-pedir`, `#/p/<id>`. Cada cambio pasa
  por `document.startViewTransition` y espera `Alpine.nextTick()` antes de la foto nueva;
  el mosaico del producto viaja entre lista y detalle (`view-transition-name: producto`).
- **WhatsApp**: `https://wa.me/573007503552?text=…` con `encodeURIComponent`. El sitio
  nunca envía nada: abre WhatsApp con el mensaje listo y la persona lo manda.
- **Precios** con `toLocaleString('es-CO')` y `$` pegado, como en el flyer ($4.000).
- **Reducir movimiento** apaga goteo, vuelos, inclinaciones y transiciones de vista; el
  estado cambia igual.

## Contenido por confirmar con la dueña del negocio

Salió del flyer v3 (claude.ai/design, «Flyer Lusof Sweet v3»). Lo que el flyer no dice y
el sitio supone, marcado para revisar:

- las descripciones de cada producto (redactadas a partir del nombre);
- cuántas letras caben en la caja de corazón (el sitio permite 12);
- si hay domicilio y cómo se cobra (el sitio ofrece «a domicilio» y dice que el costo
  se acuerda por WhatsApp);
- qué son exactamente las «adiciones» ($2.000).

## Fotos

Cada producto tiene `foto: null` en `catalogo.js`. Para usar una foto real: guardarla en
`assets/fotos/<id>.webp` (cuadrada, ~900 px) y poner la ruta en `foto`. Mientras tanto se
ve la ilustración. El flyer tiene una foto de la Torre Eiffel que vale la pena traer.

## Tareas

Viven en `tareas/` (formato: `~/Developer/sigilo/TAREAS.md`).
