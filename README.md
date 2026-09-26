# Lusof Sweet — la web

SPA promocional de **Lusof Sweet** («Chocolates hechos con amor», pedidos por WhatsApp
al 300 750 3552). Muestra los antojos y las cajas de regalo, deja armar un pedido y lo
manda armado a WhatsApp.

**Publicada** desde el 2026-09-26 (GO de Yonatan): repo público
[`yvalenta/lusof`](https://github.com/yvalenta/lusof), GitHub Pages desde `main` (raíz),
dominio <https://lusof.ynt.codes> (HTTPS forzado desde el 2026-09-26: con una dirección de
cobro publicada, el sitio no se sirve por HTTP) por el archivo `CNAME` y un registro CNAME
`lusof → yvalenta.github.io` en Cloudflare **sin proxy** (nube gris), igual que
resplandor. **Cada push a `main` sale al aire**: probar en local antes de empujar.

## Correrla

```bash
cd ~/Developer/lusof && python3 -m http.server 8790 --bind 127.0.0.1
```

y abrir <http://localhost:8790>. No usar `file://` (el pedido se guarda en
localStorage y Safari lo trata raro fuera de http). `.claude/launch.json` tiene la
misma configuración para el panel de vista previa.

Para tocar Tailwind, o para que `node --test 'scripts/pruebas/*.test.mjs'` corra la
prueba del CSS en vez de saltarla, `npm install` una vez en la raíz (ver «Tailwind
(compilado)» abajo).

## Stack (sin build — salvo Tailwind, que se compila)

| pieza | versión fija | para qué |
|---|---|---|
| `tailwindcss` + `@tailwindcss/cli` | 4.3.3 | utilidades de layout, **compiladas y commiteadas** en `assets/css/tailwind.css` — ver «Tailwind (compilado)» abajo |
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
View Transitions.

### Tailwind (compilado)

Hasta el 2026-09-26 Tailwind corría en el navegador (`@tailwindcss/browser`, CDN). Una
medición con Lighthouse (móvil, Moto G4 + Slow4G + CPU×4) mostró que el compilador JIT
del CDN le cuesta ~83ms de hilo principal en cada carga (TBT 114ms → 0ms al compilar,
supera el umbral de la casa de ≥100ms), así que se compiló:

- **Entrada, única fuente**: [`assets/css/entrada-tailwind.css`](assets/css/entrada-tailwind.css)
  — `@import "tailwindcss";` + el `@theme static` con la paleta (antes vivía en un
  `<style type="text/tailwindcss">` de `index.html`).
- **Salida commiteada**: `assets/css/tailwind.css` (minificada); es la que sirve
  `index.html` con un `<link>` normal. No se edita a mano.
- **Para compilar**: `npm install` (una vez; instala las devDependencies fijas de
  `package.json`, `tailwindcss`/`@tailwindcss/cli` 4.3.3 — nunca se comitea
  `node_modules`, ver `.gitignore`) y después `node scripts/css.mjs`.
- **`node scripts/css.mjs --comprobar`** compila a un archivo temporal y lo compara byte
  a byte con lo commiteado; sale 1 si difieren. Lo corre `.github/workflows/comprobar.yml`
  (con `npm ci` antes) y una prueba (`scripts/pruebas/css.test.mjs`).
- `package.json`/`package-lock.json` son **solo la herramienta de build**: el sitio
  publicado sigue sin build ni dependencias en runtime (el navegador nunca los carga).
  `entrada-tailwind.css` importa con `source(none)` y declara `@source` explícitos para
  `index.html` y `assets/js/`: Tailwind escanea *solo* ahí, nunca `tareas/`, `docs/`,
  `mcp/`, `scripts/`, el propio README ni `llms.txt` — si no fuera así, una palabra de una
  tarea que coincidiera con una utilidad (`bg-red-500`, `sticky`…) se colaría al CSS
  publicado y tumbaría `--comprobar` por un cambio que es solo de documentación. Ninguna
  clase literal del sitio se pierde con este método (comprobado).

## Estructura

```
index.html                        todas las vistas (plantillas x-if), sprite de íconos, barra, goteo, pie, cajón
assets/js/catalogo.js             productos, precios y billetera — lo único que hay que editar para cambiar el menú
assets/js/pedido.js               el pedido como dato: reglas, armarPedido() y el mensaje de WhatsApp (una sola fuente)
assets/js/agentes.js              WebMCP: herramientas para agentes que navegan la página (document.modelContext)
catalogo.json, llms.txt           para agentes (generados; no editar a mano)
mcp/                              MCP remoto en un Cloudflare Worker (mcp.lusof.ynt.codes) — ver mcp/LEEME.md
assets/js/app.js                  rutas por hash, Alpine.store('pedido'), mensaje de WhatsApp, efectos
scripts/catalogo.mjs              genera catalogo.json, llms.txt y el JSON-LD desde catalogo.js/pedido.js — correr
                                   después de tocar cualquiera de los dos (si no, --comprobar falla en CI)
assets/css/entrada-tailwind.css   entrada de Tailwind: @import + el @theme static con la paleta (única fuente)
assets/css/tailwind.css           Tailwind compilado y minificado; lo sirve index.html — no editar a mano
scripts/css.mjs                   compila (o --comprobar) assets/css/tailwind.css desde la entrada
package.json, package-lock.json   SOLO la herramienta de build de Tailwind — no es una dependencia del sitio
assets/css/lusof.css              marca, mosaicos, cajón, transiciones y «reducir movimiento»
assets/img/antojos/               11 ilustraciones SVG propias (respaldo mientras no haya fotos)
assets/fotos/                     fotos reales de producto, cuando lleguen (ver LEEME.md)
assets/img/                       logo recortado, favicon, QR de WhatsApp, imagen para compartir
docs/                             investigación de base (Resplandor, transitions.dev, CDN)
```

## Contratos que no se rompen

- **Orden de scripts** en `<head>`: catalogo.js → app.js → alpine, todos `defer`.
  `app.js` registra stores y directivas en `alpine:init`, así que debe correr antes que
  Alpine.
- **La paleta vive en un solo lugar**: el `@theme static` de
  [`assets/css/entrada-tailwind.css`](assets/css/entrada-tailwind.css). `lusof.css` la lee
  como `var(--color-*)`; `static` es lo que garantiza que Tailwind publique todas las
  variables aunque ninguna utilidad las use. Después de tocarla, `node scripts/css.mjs`.
- **El cajón es un `<dialog>` modal** gobernado por `$store.pedido.abierto` (`x-effect`
  llama `showModal()`/`close()`); Escape y el toque en el fondo cierran por el evento
  `close`, que avisa al store. Foco atrapado, fondo inerte y devolución del foco son del
  navegador.
- **Imágenes de producto solo por `x-imagen="producto"`**: decide foto o ilustración en
  todas las vistas. No poner `<img>` de producto a mano.
- **Los decorativos que se superponen (`.vt-goteo`, `aria-hidden`) llevan `pointer-events:
  none` en el contenedor**, no solo en el dibujo de adentro: por el margen negativo que
  hace que las gotas «cuelguen» sobre el contenido, la caja del `<div>` mide el alto
  completo del SVG y, sin eso, tapaba el toque de lo que sigue (el bug de «← Antojos»).
- **Rutas**: `#/`, `#/antojos`, `#/regalos`, `#/como-pedir`, `#/p/<id>`. Cada cambio pasa
  por `document.startViewTransition` y espera `Alpine.nextTick()` antes de la foto nueva;
  el mosaico del producto viaja entre lista y detalle (`view-transition-name: producto`).
- **WhatsApp**: `https://wa.me/573007503552?text=…` con `encodeURIComponent`. El sitio
  nunca envía nada: abre WhatsApp con el mensaje listo y la persona lo manda.
- **El CSS carga en dos hojas, en este orden**: `assets/css/tailwind.css` (utilidades)
  y después `assets/css/lusof.css` (marca) — un mismo selector definido en ambas gana
  `lusof.css`. Ojo con declarar ahí una propiedad que una utilidad de Tailwind también
  controle sobre el mismo elemento (típicamente `display`, por un `hidden`/`max-*:hidden`):
  las utilidades viven en `@layer utilities` y `lusof.css` no está en capa, así que
  `lusof.css` gana siempre, sin importar especificidad ni orden, y puede tapar sin querer un
  `display:none` (pasó con `.nav-enlace` y `.max-md:hidden` en «Cómo pedir»: se resolvió
  agrandando el toque por `padding`, sin tocar `display`).
- **Después de tocar `assets/css/entrada-tailwind.css`, o de sumar clases de Tailwind
  nuevas en el HTML/JS, correr `node scripts/css.mjs`**: regenera `assets/css/tailwind.css`.
  `node scripts/css.mjs --comprobar` (lo corre `.github/workflows/comprobar.yml`, con
  `npm ci` antes) falla si quedó desactualizado.
- **Después de tocar `catalogo.js` o `pedido.js`, correr `node scripts/catalogo.mjs`**:
  regenera `catalogo.json`, `llms.txt` y el JSON-LD de `index.html` desde esa única
  fuente. `node scripts/catalogo.mjs --comprobar` (lo corre `.github/workflows/comprobar.yml`
  en cada push) falla si alguno quedó desactualizado.
- **Precios** con `toLocaleString('es-CO')` y `$` pegado, como en el flyer ($4.000).
- **Reducir movimiento** apaga goteo, vuelos, inclinaciones y transiciones de vista; el
  estado cambia igual.

## Agentes y pago en USDC

Decisiones de Yonatan (2026-09-26; detalle en `tareas/2026-09-26-mcp-pedidos.md`):

- **Nadie envía ni cobra por la persona.** Web, WebMCP y MCP arman el mismo pedido con
  `armarPedido()` de `pedido.js` y devuelven el enlace `wa.me`; la persona lo manda.
- **Tres puertas para agentes**: `catalogo.json` + `llms.txt` + JSON-LD schema.org (estático,
  generado por `scripts/catalogo.mjs`); WebMCP en `assets/js/agentes.js` (6 herramientas
  sobre el mismo `Alpine.store('pedido')`); y el MCP remoto de `mcp/` (Streamable HTTP, sin
  estado; lee `catalogo.json` en vivo y lleva `pedido.js` empaquetado: **si cambia
  `pedido.js`, hay que redesplegar el Worker**, y el Worker lo avisa con un error si sus
  reglas no coinciden con `catalogo.json`).
- **WebMCP necesita token.** En Chrome estable `document.modelContext` solo existe con el
  token del origin trial (Chrome 149–156, termina el 16-nov-2026), que se pide para
  `https://lusof.ynt.codes` en <https://developer.chrome.com/origintrials> y va como
  `<meta http-equiv="origin-trial" content="…">`. Sin él, las herramientas no se registran y
  el sitio sigue igual. Probar en local: `chrome://flags/#enable-webmcp-testing`.
- **El MCP remoto no está desplegado**: lo despliega Yonatan (`mcp/LEEME.md`) y después su URL
  va a `agentes.mcp` vía `scripts/catalogo.mjs`. Hasta entonces `catalogo.json` dice `null`.
- **Billetera**: `LUSOF.billetera` en `catalogo.js` es la única fuente (dirección, red Base,
  chainId 8453, contrato USDC). Solo USDC en Base; los precios siguen en pesos y **Lusof
  confirma por WhatsApp el monto en USDC y la dirección antes de que la persona pague**
  (si alguien cambiara la dirección en el camino, se nota ahí). Ningún texto muestra un monto
  en USDC ni una tasa. Una prueba (`pedido.test.mjs`) hace de cable trampa sobre la dirección.

## Contenido por confirmar con la dueña del negocio

Salió del flyer v3 (claude.ai/design, «Flyer Lusof Sweet v3»). Lo que el flyer no dice y
el sitio supone, marcado para revisar:

- las descripciones de cada producto (redactadas a partir del nombre);
- cuántas letras caben en la caja de corazón (el sitio permite 12);
- si hay domicilio y cómo se cobra (el sitio ofrece «a domicilio» y dice que el costo
  se acuerda por WhatsApp);
- qué son exactamente las «adiciones» ($2.000);
- los medios de pago (el sitio ofrece «efectivo o transferencia» y USDC en Base).

## Fotos

Pensado para cambiar los dibujos por fotos reales de a una: guardar la foto en
`assets/fotos/<id>.webp` y poner esa ruta en `foto` del producto en `catalogo.js`. La
foto sale a la vez en el menú, el detalle, los sugeridos y el cajón (`x-imagen`), y si
la ruta falla se sigue viendo el dibujo. Guía completa, tamaños y nombres exactos:
[`assets/fotos/LEEME.md`](assets/fotos/LEEME.md). El flyer tiene una foto de la Torre
Eiffel que vale la pena traer.

## Tareas

Viven en `tareas/` (formato: `~/Developer/sigilo/TAREAS.md`).
