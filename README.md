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
| `alpinejs` | 3.17.4 | estado (`Alpine.store`), vistas (`x-if`), directivas propias (`x-imagen`, `x-pop`, `x-inclinar`) |
| íconos de Lucide | 1.48.0 | los 15 que se usan, copiados como sprite SVG al inicio del `<body>` (ISC); sin script |
| Gluten + Figtree (Google Fonts) | — | titulares / texto |

Eran la última versión del registro de npm el 2026-09-26 (medido dos veces ese día).
`@alpinejs/focus` y el UMD de Lucide (~444 KB) salieron ese día: el cajón es un
`<dialog>` nativo y los íconos van en el sprite. Para sumar un ícono: copiar su `<path>`
de `https://cdn.jsdelivr.net/npm/lucide-static@1.48.0/icons/<nombre>.svg` a un
`<symbol id="i-<nombre>">` del sprite y usarlo con `<svg class="icono" width="24"
height="24" aria-hidden="true"><use href="#i-<nombre>"/></svg>`.

CSS de plataforma que el sitio usa (navegadores de 2025 en adelante; donde falta, se
degrada sin romper): `<dialog>` + `showModal()` y `closedby`, `@starting-style` con
`transition-behavior: allow-discrete` (entrada y salida del cajón y de la dirección),
`interpolate-size` (altura hasta `auto`), `field-sizing: content` (la nota), color
relativo `rgb(from var(--color-cacao) r g b / α)`, `view-transition-class` y tipos de
View Transitions. Tailwind en el
navegador es «solo para desarrollo» según su documentación: para un sitio local está
bien; el día que se publique conviene compilarlo (Tailwind CLI) y el `@theme` pasa casi
igual.

## Estructura

```
index.html               todas las vistas (plantillas x-if), sprite de íconos, barra, goteo, pie, cajón
assets/js/catalogo.js    productos y precios — lo único que hay que tocar para cambiar el menú
assets/js/app.js         rutas por hash, Alpine.store('pedido'), mensaje de WhatsApp, efectos
assets/css/lusof.css     marca, mosaicos, cajón, transiciones y «reducir movimiento»
assets/img/antojos/      11 ilustraciones SVG propias (respaldo mientras no haya fotos)
assets/fotos/            fotos reales de producto, cuando lleguen (ver LEEME.md)
assets/img/              logo recortado, favicon, QR de WhatsApp, imagen para compartir
docs/                    investigación de base (Resplandor, transitions.dev, CDN)
```

## Contratos que no se rompen

- **Orden de scripts** en `<head>`: catalogo.js → app.js → alpine, todos `defer`.
  `app.js` registra stores y directivas en `alpine:init`, así que debe correr antes que
  Alpine.
- **La paleta vive en un solo lugar**: el `@theme static` de `index.html`. `lusof.css` la
  lee como `var(--color-*)`; `static` es lo que garantiza que Tailwind publique todas las
  variables aunque ninguna utilidad las use.
- **El cajón es un `<dialog>` modal** gobernado por `$store.pedido.abierto` (`x-effect`
  llama `showModal()`/`close()`); Escape y el toque en el fondo cierran por el evento
  `close`, que avisa al store. Foco atrapado, fondo inerte y devolución del foco son del
  navegador.
- **Imágenes de producto solo por `x-imagen="producto"`**: decide foto o ilustración en
  todas las vistas. No poner `<img>` de producto a mano.
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

Pensado para cambiar los dibujos por fotos reales de a una: guardar la foto en
`assets/fotos/<id>.webp` y poner esa ruta en `foto` del producto en `catalogo.js`. La
foto sale a la vez en el menú, el detalle, los sugeridos y el cajón (`x-imagen`), y si
la ruta falla se sigue viendo el dibujo. Guía completa, tamaños y nombres exactos:
[`assets/fotos/LEEME.md`](assets/fotos/LEEME.md). El flyer tiene una foto de la Torre
Eiffel que vale la pena traer.

## Tareas

Viven en `tareas/` (formato: `~/Developer/sigilo/TAREAS.md`).
