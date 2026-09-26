# Investigación de base — 2026-09-26

Síntesis del workflow `lusof-research` (3 lectores + 1 síntesis): patrones de interacción de
`~/Developer/resplandor`, catálogo de transitions.dev y hechos verificados de CDN / View Transitions.
Es un registro de lo que se leyó ese día, no una verdad viva: las versiones se re-miden en el registro de npm.

## Resumen

I checked the three research reports against the primary sources and ran live tests. That meant the npm registry, jsDelivr file listings and SRI hashes, MDN browser-compat-data 8.1.3 (2026-09-24), the canonical transitions.dev repo (Jakubantalik/transitions.dev), and the source code of Lucide 1.48.0, Alpine 3.17.4 and @tailwindcss/browser 4.3.3. I also ran experiments in Chrome 152 and sent two GET requests to wa.me with a dummy number.

These are the conflicts between the reports and how each one resolved:
(1) landing.html does NOT use Lucide (0 hits). Lucide appears only in carta.html (0.475.0), index.html and menu.html (@latest), 911urban (1.31.0) and advance_fitness (@latest).
(2) Use Tailwind v4 (@tailwindcss/browser@4.3.3) rather than the v3 Play CDN. It is about 70 KB compressed against 126 KB, it is the owner's newest pattern, and lusof.css already needs the same browser baseline.
(3) Current versions: Alpine and its plugins 3.17.4, Lucide 1.48.0 (1.0 came out 2026-03-23 and removed brand icons, so there is no Instagram or Facebook icon), Tailwind browser 4.3.3.
(4) View Transitions support is the same in every source: Chrome/Edge 111, Safari 18.0, Firefox 144. One report missed that `types`, the `{update, types}` options object and `:active-view-transition-type()` need Chrome 125, Safari 18.2 and Firefox 147.
(5) transitions.dev "page side-by-side" stacks pages with `position:absolute; inset:0`, so it cannot drive full scrolling routes. It only suits fixed-height areas such as the steps inside the drawer.

The tests turned up these gaps, each verified:
(a) wa.me's redirect replaces emoji-type characters (🍫 ♥ ❤ ✨) with �. api.whatsapp.com/send keeps them.
(b) Inside startViewTransition, `await Alpine.nextTick()` is not enough for views shown with x-show, because x-show waits for the next animation frame before showing. It works for x-if and for `:hidden`.
(c) A transition that gets skipped rejects `ready` with an error nobody catches.
(d) Lucide's createIcons() redraws every icon each time it runs. A `:data-lucide` binding changes the attribute but the old drawing stays. Two patterns are safe: call createIcons({inTemplates:true}) once before Alpine starts, or use a small x-icon directive built on lucide.createElement.
(e) Tailwind v4 wraps its output in cascade layers, and an unlayered lusof.css beats every utility.
(f) 'es-CO' formats 4-digit prices with a dot (2.000); plain 'es' does not (2000).
(g) Alpine starts right after its own script runs, not at DOMContentLoaded, so script order matters.
(h) x-trap.inert only sets aria-hidden on the rest of the page; it does not add the real `inert` attribute.

One important piece of context: /Users/yonatan/Developer/lusof is not empty. It already has assets/js/catalogo.js (all 11 products as window.LUSOF, whatsapp '573007503552'), assets/css/lusof.css, a static QR, favicon and OG images, and .claude/launch.json (python3 http.server on port 8790). It became a git repo during the session (branch main, no commits). A parallel builder was also writing index.html and assets/js/app.js while I worked. That build already follows most of this brief, but it still uses wa.me and allows ♥ in the heart-box letters, and it never catches `transition.ready`.

Side effects to disclose:
- Browser tab: mid-test, someone else moved the shared Browser tab (tab-2) to the live http://localhost:8790 Lusof page. One of my scripts then ran on that page: it added a temporary test div and changed Alpine.store('ruta').vista to 'antojos'. I removed the div and set vista back to 'inicio' (the page hash was empty). No project files were touched, and a reload fully resets the page.
- Scratchpad: I saved reference files to the shared scratchpad and deleted them afterwards. That included alpine.js, which may have overwritten a file with the same name from another agent.
- WhatsApp requests: the two wa.me / api.whatsapp.com GET requests used a dummy number (15550001111), and nothing was sent.
- MCP servers: several MCP servers (asana, atlassian, datadog, github, linear, notion, pagerduty, slack) need authorization through /mcp or the claude.ai connector settings before they can be used.

## Hallazgos

### Existing project state (the site is not starting from zero)

/Users/yonatan/Developer/lusof already has: assets/js/catalogo.js (window.LUSOF = { whatsapp:'573007503552', whatsappVisible, marca, productos[11] with id/nombre/corto/precio/categoria antojos|regalos/emoji/tono/destacado/letras/descripcion/foto:null }). It also has assets/css/lusof.css (brand tokens --crema/--nata/--arena/--rubor/--durazno/--cacao/--coral/--coral-tinta/--oro, drawer, qty, toast, View Transitions and reduced-motion rules; fonts Figtree + Gluten), plus assets/img/{qr-whatsapp.svg, favicon.svg, apple-touch-icon.png, logo-lusof.webp/png, og-lusof.jpg}. .claude/launch.json runs `python3 -m http.server 8790 --bind 127.0.0.1`. The folder became a git repo (main, no commits) during the session, and index.html (40 KB) and assets/js/app.js (22 KB) were being written by a parallel builder while I worked. Because the QR is a static SVG, qrcode-generator is not needed. It is 25 modules (QR version 2) with a 1-module margin and could not be decoded locally, so scan it once to confirm it opens chat with 573007503552.

Fuente: ls/stat/cat of /Users/yonatan/Developer/lusof (read-only)

### Resolved: pinned versions and exact CDN tags (with SRI)

npm 'latest' on 2026-09-26: alpinejs, @alpinejs/focus, @alpinejs/intersect and @alpinejs/collapse = 3.17.4; lucide = 1.48.0; @tailwindcss/browser = 4.3.3. All return HTTP 200 with ACAO:* and immutable caching. Compressed sizes: Tailwind v4 about 70 KB (v3.4.17 Play CDN is 126 KB), Lucide 1.48 about 104 KB (444 KB raw), Alpine about 20 KB, focus plugin about 9 KB, intersect 2 KB. The bare URL `@tailwindcss/browser@4.3.3` serves jsDelivr's auto-generated `/dist/index.global.min.js`, which should not get SRI. The package's only real file is dist/index.global.js (282 KB, already minified), so pin that path when using integrity. The hashes below were computed from the served bytes.

Fuente: registry.npmjs.org/<pkg>/latest; data.jsdelivr.com/v1/packages/npm/@tailwindcss/browser@4.3.3; curl | openssl dgst -sha384

```
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.3.3/dist/index.global.js" integrity="sha384-2ql948lIdLcGEE0/qxNiudyTjgauA3RDJERu5xW75kFCvSl5a9odyQYCb6tEjnmB" crossorigin="anonymous"></script>
<style type="text/tailwindcss">@theme inline { --color-crema: var(--crema); --color-cacao: var(--cacao); --color-coral: var(--coral); /* … */ --font-sans: 'Figtree', ui-sans-serif, system-ui, sans-serif; --font-display: 'Gluten', 'Figtree', system-ui, sans-serif; }</style>
<link rel="stylesheet" href="assets/css/lusof.css">
<!-- ORDER IS THE CONTRACT: everything Alpine needs at init goes BEFORE alpinejs -->
<script defer src="https://cdn.jsdelivr.net/npm/lucide@1.48.0/dist/umd/lucide.min.js" integrity="sha384-Hh7C333mXel+qppGoFs4qAOXp7h67eur4XsQVF2bvHAM3MQ4DX4cQI7oRCzb98J4" crossorigin="anonymous"></script>
<script defer src="assets/js/catalogo.js"></script>
<script defer src="assets/js/app.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/focus@3.17.4/dist/cdn.min.js" integrity="sha384-ysJcnHb6oCzqAGKdoTm+IqKqmPKgxHT+ApZCawkyWOJfMq15WvzW3RRmHl7tWpEY" crossorigin="anonymous"></script>
<!-- optional --><script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/intersect@3.17.4/dist/cdn.min.js" integrity="sha384-2xKHWSjeeiB/MQGC0Cs4HQ3mYVvbQP7a/mdjP1d6A1AKxER75HPZwrofpbWfx0b6" crossorigin="anonymous"></script>
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.17.4/dist/cdn.min.js" integrity="sha384-5/joNqFnRyVWzXp99bHot6RHG+EksGp+USSgZwPar7T9SD9PKKER37n/8bXBAZGd" crossorigin="anonymous"></script>
```

### Resolved: Tailwind v3 Play CDN vs v4 browser build

The owner's sites are split. resplandor index/menu/carta/resplandor.html and advance_fitness/index.html use cdn.tailwindcss.com (v3); resplandor/landing.html uses @tailwindcss/browser@4. Choose v4.3.3 for four reasons. It is smaller (70 KB vs 126 KB compressed). It is the owner's newest pattern. Its CSS-first @theme maps directly onto lusof.css's custom properties. Its minimum browsers (Chrome 111 / Safari 16.4 / Firefox 128, per tailwindcss.com/docs/compatibility) are already required by lusof.css, which uses color-mix (Safari 16.2+), dvh and :has(). The browser build watches class-attribute changes across the whole document (a MutationObserver on documentElement filtered to 'class'), so Alpine :class and x-for output get compiled automatically. Class names still have to appear as literal strings. It appends its generated <style> at the END of <head> (`document.head.append`), and that CSS starts with `@layer theme, base, components, utilities;`.

Fuente: grep of CDN tags across ~/Developer/*; @tailwindcss/browser@4.3.3 dist/index.global.js source; https://tailwindcss.com/docs/compatibility

### NEW: Tailwind v4 cascade layers vs an unlayered lusof.css

Tailwind v4 puts utilities in @layer utilities and preflight in @layer base. Normal declarations outside any layer beat all layered ones. So if lusof.css stays unlayered, `.boton{display:inline-flex}` beats `hidden`/`max-sm:hidden` on the same element, and the element stays visible. The naive fix makes things worse: wrap lusof.css in `@layer components{}` without declaring the order first, and because the <link> comes before Tailwind's style, `components` becomes the FIRST, lowest-priority layer. Preflight's `button,input,select,textarea{border-radius:0;background-color:transparent;color:inherit}` (verified in the bundled preflight) then wipes out .boton-cacao and .agregar. Correct setup: put `@layer theme, base, components, utilities;` as the first line of lusof.css, wrap component classes in `@layer components{…}`, and keep :root tokens, @keyframes, [x-cloak], ::view-transition rules and the reduced-motion block unlayered. Preflight also ships `[hidden]:where(:not([hidden='until-found'])){display:none !important}`, so the `hidden` attribute always wins over display classes. That makes `:hidden` bindings safe for views. A scan of the in-progress index.html found only one element that mixes a lusof.css display class with a Tailwind display utility (line 119, `.linea` + `flex`). It only conflicts if that element sits inside `.titular`.

Fuente: @tailwindcss/browser@4.3.3 bundled preflight text; CSS Cascade Layers semantics; python scan of /Users/yonatan/Developer/lusof/index.html vs lusof.css

```
/* lusof.css line 1 */
@layer theme, base, components, utilities;
@layer components { .boton{…} .mosaico{…} .cantidad{…} .cajon{…} }
```

### NEW (verified live): wa.me corrupts emoji; use api.whatsapp.com/send

I sent GET requests with a dummy number (15550001111). wa.me answers with a 302 whose Location replaces 🍫 (U+1F36B), ♥ (U+2665), ❤ (U+2764) and ✨ (U+2728) with %EF%BF%BD (�). These pass through unchanged: • × — $ © → ✓ ★ ¡ ñ á and %0A newlines. `https://api.whatsapp.com/send?phone=…&text=…` returns 200 with no redirect, and its page keeps ♥ and 🍫 intact. So resplandor's recipe (emoji labels 👋📅👥 sent via wa.me) garbles messages on desktop and in in-app browsers like Instagram's. The in-progress lusof app.js uses `https://wa.me/${L.whatsapp}?text=` and lets ♥ into the heart-box letters, so 'TE AMO ♥' would arrive as 'TE AMO �'.

Fuente: curl -D - https://wa.me/15550001111?text=… and https://api.whatsapp.com/send?phone=15550001111&text=…; corroborated by several GitHub PRs found via WebSearch (e.g. NexusForgeIA/WHITEMOON-PELUQUERIAS#21)

```
const enlaceWA = (texto) => `https://api.whatsapp.com/send?phone=${LUSOF.whatsapp}&text=${encodeURIComponent(texto)}`;
```

### NEW (verified): Lucide 1.48 re-render behavior in Alpine

From the source: createIcons() runs root.querySelectorAll('[data-lucide]') and replaceElement(). That copies EVERY attribute of the <i>, including Alpine directives, onto a new <svg> that keeps data-lucide. Tested in Chrome 152 with Alpine 3.17.4:
(1) A second createIcons() call replaced already-rendered SVGs with new nodes, so repeated calls churn every icon on the page (resplandor calls it after every state change).
(2) With `<i :data-lucide="it.icon">`, changing the icon from heart to star updated the attribute to 'star', but the SVG still DRAWS the heart.
(3) Rows added by x-for after the call stay as empty <i> until the next call.
Two patterns were verified safe. A: call `lucide.createIcons({inTemplates:true})` ONCE before Alpine starts. It renders inside <template> content, recursively, so every x-for/x-if clone already contains the SVG. Directives on the icon, such as x-show, keep working because Alpine initializes the SVG itself. This handles static names only. B: an `x-icon` directive that builds `lucide.createElement(lucide.icons[Pascal])` into its host element. It is reactive, works in x-for, and was verified through add, remove, reorder and rename. createElement does NOT add aria-hidden, so pass it yourself. Icons checked as present in 1.48: shopping-bag, plus, minus, x, heart, gift, send, message-circle, message-circle-heart, candy, cake, cake-slice, cookie, donut, dessert, cherry, sparkles, store, bike, truck, map-pin, clock, chevron-down/right/up, arrow-left, trash-2 (an alias of Trash), party-popper, circle-check. Missing: Instagram, Facebook (brand icons removed in v1) and Strawberry.

Fuente: cdn.jsdelivr.net/npm/lucide@1.48.0/dist/umd/lucide.js (replaceElement / createIcons / createElement / exports.icons); Chrome 152 experiment in the Browser pane; lucide.dev/guide/version-1 + InfoQ (brand icons removed)

```
document.addEventListener('alpine:init', () => {
  const pascal = (n) => n.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
  Alpine.directive('icon', (el, { expression }, { evaluateLater, effect }) => {
    const get = /^[a-z0-9-]+$/.test(expression) ? (cb) => cb(expression) : evaluateLater(expression);
    effect(() => get((name) => {
      const node = lucide.icons[pascal(String(name))];
      if (node) el.replaceChildren(lucide.createElement(node, { 'aria-hidden': 'true', class: 'lucide lucide-' + name }));
    }));
  });
});
// <span x-icon="heart"></span>   <span x-icon="item.icono"></span>
```

### NEW (verified): Alpine + View Transitions, x-show is the trap

Alpine's reactive DOM updates run in a microtask (queueJob -> queueMicrotask(flushJobs)), and Alpine.nextTick resolves after that. So `await Alpine.nextTick()` inside the update callback is enough for x-if, x-text, :class and :hidden. x-show is different. Its show step goes through _x_toggleAndCascadeWithTransitions, which defers `show` to requestAnimationFrame when the tab is visible (setTimeout when hidden). In the test, the target view was still display:none after nextTick inside startViewTransition, so the 'new' snapshot can be captured before the view appears. Switch routed views with <template x-if> (as the in-progress index.html does) or `:hidden`, never x-show. Also, do not put x-transition on anything that changes inside the update callback, or the new snapshot captures its enter-start state. Alpine's CDN build starts via queueMicrotask right after its own script runs, so anything needed at init must come before it in document order.

Fuente: alpinejs@3.17.4/dist/cdn.js (queueFlush, nextTick, _x_toggleAndCascadeWithTransitions, cdn.js tail `queueMicrotask(() => src_default.start())`); Chrome 152 experiment

```
async function navegar(nueva, origen) {
  const aplicar = async () => { Object.assign(Alpine.store('ruta'), nueva); await Alpine.nextTick(); scrollTo(0, 0); };
  if (!document.startViewTransition || menosMovimiento.matches) { await aplicar(); return enfocarTitulo(); }
  if (origen) origen.style.viewTransitionName = 'producto';
  document.documentElement.dataset.nav = nueva.vista === 'producto' ? 'adelante' : 'lado';
  const vt = document.startViewTransition(async () => { if (origen) origen.style.viewTransitionName = ''; await aplicar(); });
  vt.ready.catch(() => {});            // skipped transitions reject `ready` (verified: unhandled InvalidStateError otherwise)
  await vt.finished.catch(() => {});
  delete document.documentElement.dataset.nav; enfocarTitulo();
}
addEventListener('hashchange', () => navegar(leerRuta()));
```

### Resolved + corrected: View Transitions support matrix

From MDN browser-compat-data 8.1.3 (2026-09-24) and caniuse. startViewTransition(callback) and view-transition-name: Chrome/Edge/Chrome Android 111, Safari and iOS 18.0, Firefox 144, Samsung 22, about 91.8% global usage. view-transition-class: Chrome 125, Safari 18.2, Firefox 144. The options object {update, types}, ViewTransition.types and :active-view-transition-type(): Chrome 125, Safari 18.2, Firefox 147. Engines that only accept the callback form throw a TypeError when given an object, so wrap that call in try/catch, or better, mark direction with a data attribute on <html> (e.g. html[data-nav=atras]::view-transition-old(root)), which works everywhere. If two rendered elements share a view-transition-name, the transition is skipped. A hidden document aborts with InvalidStateError. Starting a second transition skips the first (its `ready` rejects with AbortError; verified). The page is frozen during the update callback, so keep it quick.

Fuente: @mdn/browser-compat-data data.json (api.Document.startViewTransition[.options_parameter], api.ViewTransition.types, css.properties.view-transition-class, css.selectors.active-view-transition-type); https://caniuse.com/view-transitions; developer.chrome.com/docs/web-platform/view-transitions/same-document; Chrome 152 experiments

### Resolved: transitions.dev source and what fits this SPA

The canonical repo is Jakubantalik/transitions.dev: skills/transitions-dev/01…32 .md, _root.css and SKILL.md, last pushed 2026-09-21, and the GitHub API reports NO license. The researcher's m1ckc3s repo is a mirror, and its token values match the canonical _root.css exactly. The workhorse curve is cubic-bezier(0.22,1,0.36,1). Durations: 250 ms open, 150 ms close, 400/350 ms panel, 500 ms emphasis. Blur: 2–3 px. Every snippet has its own reduced-motion guard and lists `transition` properties explicitly (never `all`). 08-page-side-by-side stacks `.t-page{position:absolute;inset:0}` inside a `position:relative` container that has no height of its own, so it is wrong for full-length routes. Use it only for fixed-height step panes, and reproduce its values on ::view-transition-old/new(root) for routes. 19-card-tilt: MAX = 14°, 1000 ms return, 400 ms follow, glare opacity 0.32. It tracks the pointer on a flat `.t-tilt` wrapper, but it also sets `.t-tilt{touch-action:none}` and does tilt-on-drag for touch, which blocks page scrolling when a swipe starts on a card. SKILL.md's 'common mistakes': forced reflow (`void el.offsetWidth`) to replay; clean up `.is-closing`; animate the badge dot, not its trigger; use the real `getTotalLength()` for the success-check stroke.

Fuente: https://transitions.dev/skill.html; api.github.com/repos/Jakubantalik/transitions.dev (license:null); raw.githubusercontent.com/Jakubantalik/transitions.dev/main/skills/transitions-dev/{_root.css,SKILL.md,06,07,08,19,22,03,02,23,10,18}.md

### Recommended architecture (no build step)

Files: index.html (head as in the pinned-tags finding; header with vt-barra; <main> with one <template x-if> per view: inicio / antojos / regalos / producto; a drawer <section> as a DIRECT child of body; one always-present sr-only role=status live region). assets/css/lusof.css (tokens plus layered components). assets/js/catalogo.js (data only; the owner edits prices here). assets/js/app.js (an IIFE that defines helpers, then `alpine:init` registering stores, the x-icon directive if used, and the router, WAAPI effects and tilt). Routes: `#/`, `#/antojos`, `#/regalos`, `#/p/<id>`. Treat only hashes that start with '#/' as routes and let others act as normal in-page anchors. On each route change: set document.title and aria-current on the nav, move focus to the view's <h1 tabindex=-1> with preventScroll, and restore the list's scroll position when coming back from a detail view. Stores: Alpine.store('ruta', { vista, id, seccion }) and Alpine.store('pedido', { lineas: [{ clave, id, cantidad, letras }], datos: { nombre, cuando, entrega:'recoger'|'domicilio', direccion, nota }, abierto, anuncio, get unidades, get total, get mensaje, get enlace, sumar(id, letras?), cambiar(clave, ±1), quitar(clave), vaciar(), abrir(), cerrar() }). Use clave = id + '|' + letras so two heart boxes with different letters stay separate lines. Persist with Alpine.effect -> localStorage inside try/catch. On load, drop unknown ids and clamp quantities to 1–99. Stores are justified even though resplandor's promo pages skip them: the hash router runs outside any component, and the header bubble, cards, drawer and live region all read the order. The owner's POS already uses Alpine.store('pos').

Fuente: Synthesis of resplandor patterns (landing/carta/index.html), existing lusof assets, and the verified behaviors above

```
const pesos = (n) => '$' + Number(n || 0).toLocaleString('es-CO'); // 'es' alone gives 2000, 'es-CO' gives 2.000 (verified)
get mensaje() {
  const t = (s) => String(s || '').trim(), d = this.datos;
  return [
    `¡Hola, ${L.marca}! Quiero hacer este pedido:`, '',
    ...this.lineas.map(l => { const p = porId[l.id]; return `• ${l.cantidad} × ${p.nombre}${p.letras ? ` (letras: ${(l.letras || 'por definir').replace(/♥/g, '<3')})` : ''}: ${pesos(p.precio * l.cantidad)}`; }),
    '', `*Total: ${pesos(this.total)}*`, '',
    t(d.nombre) ? `A nombre de: ${t(d.nombre)}` : null,
    `Entrega: ${d.entrega === 'domicilio' ? 'a domicilio' + (t(d.direccion) ? ', ' + t(d.direccion) : '') : 'lo recojo'}`,
    t(d.nota) ? `Nota: ${t(d.nota)}` : null,
  ].filter(x => x !== null).join('\n');   // NOT .filter(Boolean): that also deletes the intentional '' blank lines
},
get enlace() { return `https://api.whatsapp.com/send?phone=${L.whatsapp}&text=${encodeURIComponent(this.mensaje)}`; }
// template: <a :href="$store.pedido.enlace" target="_blank" rel="noopener" @click="$store.pedido.marcarEnviado()">  (an <a>, not window.open: no popup blocker, long-press copy works)
```

### Order drawer accessibility (verified plugin behavior)

@alpinejs/focus 3.17.4 x-trap modifiers: .inert sets aria-hidden='true' on every sibling while walking up to <body> (crawlSiblingsUp). It does NOT set the real `inert` attribute, so the backdrop has to block pointer input. .noscroll sets overflow:hidden plus scrollbar padding-right on <html>. .noreturn skips returning focus, and .noautofocus skips focusing the first focusable element. By default focus goes to the first focusable element and returns to the trigger on close. Alpine x-transition reads only the FIRST comma-separated transition-duration from computed style and finishes with setTimeout, not transitionend. List the longest property first; setting durations to 0 or 0.01 ms is safe.

Fuente: https://alpinejs.dev/plugins/focus; @alpinejs/focus@3.17.4/dist/cdn.js lines ~1558-1650; alpinejs@3.17.4 cdn.js transition code (~1500-1515)

```
<button type="button" aria-haspopup="dialog" aria-controls="cajon" :aria-expanded="$store.pedido.abierto" @click="$store.pedido.abrir()">…<span class="sr-only" x-text="$store.pedido.unidades + ' productos'"></span></button>
<div class="cajon-fondo" x-show="$store.pedido.abierto" @click="$store.pedido.cerrar()" aria-hidden="true" x-transition.opacity x-cloak></div>
<section id="cajon" class="cajon" role="dialog" aria-modal="true" aria-labelledby="t-pedido" x-cloak
  x-show="$store.pedido.abierto" x-trap.inert.noscroll="$store.pedido.abierto" @keydown.escape.window="$store.pedido.cerrar()"
  x-transition:enter="cajon-entra" x-transition:enter-start="cajon-fuera" x-transition:enter-end="cajon-dentro"
  x-transition:leave="cajon-sale" x-transition:leave-start="cajon-dentro" x-transition:leave-end="cajon-fuera">
```

### Chosen transitions with vanilla/Alpine wiring

1 Route change: View Transitions on root, using 08's values (old: 150 ms fade + translateX(∓8px) + blur(3px); new: 250 ms cubic-bezier(.22,1,.36,1)). Give the header and mobile order bar a view-transition-name so they don't fade.
2 Card→detail: shared element 'producto'. Set it inline on the clicked tile only, clear it inside the update callback, set it on the destination tile when navigating back, and clear everything in finally.
3 Drawer: 07 panel-reveal timing (400 ms open / 350 ms close, cubic-bezier(.22,1,.36,1)). Mobile is a translateY(100%) bottom sheet, desktop slides with translateX, driven by x-transition classes.
4 Drawer steps (Pedido ↔ Datos/preview): 08 side-by-side, pasted as-is, inside a fixed-height pane (optional).
5 Cart count: 03 notification badge (260 ms slide, 500 ms pop, cubic-bezier(.34,1.36,.64,1)). Animate the dot, not the button.
6 Totals: 02 number pop-in (500 ms, cubic-bezier(.34,1.45,.64,1), 8 px, blur 2 px). The Alpine replay trick needs no reflow code: `<template x-for="v in [total]" :key="v"><span class="pop" x-text="pesos(v)"></span></template>` recreates the node whenever the value changes.
7 Add feedback: 22 toast (350 ms open / 250 ms close, 16 px, scale .97, blur 2 px) inside an always-mounted role=status. 23 like-burst (8 particles, 600 ms, recolored coral) for gift boxes only; keep the transform on a wrapper, never on an inline <svg> (Chromium rasterizes it at 1x).
8 Hero: 18 texts reveal (500 ms, 12 px, 3 px blur, 40 ms stagger), on load only.
9 Tilt on featured cards: 19 at MAX 14°, only under (hover:hover) and (pointer:fine), tracking the flat wrapper, with no touch-action:none on touch screens.
10 After the WhatsApp handoff: 10 success check (500 ms; stroke-dasharray = ceil(path.getTotalLength()) + 1).
Skip: spinning counter (too showy), skeleton (every product still has foto:null), banner stacking (only documented for toasts), card resize (animates layout properties).

Fuente: Jakubantalik/transitions.dev skill files (values verified); lusof.css existing classes

### Reduced-motion policy (fills the gap across the three reports)

CSS: in @media (prefers-reduced-motion: reduce), set `animation-duration:.01ms !important; animation-iteration-count:1 !important; transition-duration:.01ms !important` on the motion classes. Use .01 ms rather than `none` so animationend/transitionend still fire and Alpine still finishes. Add `::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*){animation:none !important}`, and keep each transitions.dev snippet's own guard. JS: CSS rules do NOT affect el.animate() (WAAPI), inline tilt custom properties, startViewTransition or smooth scrolling. Gate each of those on `matchMedia('(prefers-reduced-motion: reduce)').matches`, read at call time so toggling the OS setting live works. Reduced motion does not mean no feedback: keep live-region text, count changes and instant state swaps. resplandor landing.html's AOS setup ignored this preference, which is one more reason not to bring in AOS.

Fuente: transitions.dev SKILL.md; Alpine transition source; developer.chrome.com view-transitions guidance; resplandor landing.html review

## Recomendaciones

- Use the pinned head from the 'pinned versions' finding exactly: Tailwind browser 4.3.3 (blocking) + <style type=text/tailwindcss> @theme inline mapping lusof.css tokens, then lusof.css, then lucide@1.48.0, catalogo.js and app.js (all defer), then @alpinejs/focus@3.17.4, then alpinejs@3.17.4 LAST. Add SRI only to real package files (Tailwind: use /dist/index.global.js, not the bare URL).
- Make the first line of lusof.css `@layer theme, base, components, utilities;` and wrap component classes in `@layer components{}`. Keep tokens, keyframes, [x-cloak], ::view-transition rules and the reduced-motion block unlayered. Otherwise Tailwind display utilities silently lose to .boton, .fila and similar classes, or preflight's button reset wipes brand buttons.
- Build the WhatsApp link as `https://api.whatsapp.com/send?phone=573007503552&text=${encodeURIComponent(msg)}` rather than wa.me (verified: wa.me turns 🍫 ♥ ❤ ✨ into �). Also keep the message text emoji-free (• × — ✓ are safe), and write the heart-box ♥ as '<3' or 'corazón' in the message. Tell the parallel builder that assets/js/app.js lines ~376-379 need this change.
- Keep message assembly as an array of lines joined with '\n', filtering only null (not .filter(Boolean), which also removes intentional blank lines). Format prices with `'$' + Number(n||0).toLocaleString('es-CO')`, never plain 'es' (which gives 2000 instead of 2.000). Render the link as <a :href target=_blank rel=noopener>, not window.open.
- Switch routed views with <template x-if> or :hidden, never x-show. Inside startViewTransition do `Object.assign(store, next); await Alpine.nextTick();`, then always `vt.ready.catch(()=>{})` and `await vt.finished.catch(()=>{})`. Mark direction with html[data-nav] instead of `types`, or try/catch the {update, types} call. Skip the transition entirely when reduced motion is on.
- Icons: either call `lucide.createIcons({inTemplates:true})` exactly once before Alpine starts (static names only; the in-progress app.js does this correctly), or use the x-icon directive (lucide.createElement) for dynamic names. Never bind :data-lucide, and never call createIcons again after state changes (verified: it redraws every icon, and bound names keep the old drawing). There are no brand icons in Lucide 1.x, so use a hand-drawn or Simple Icons SVG for Instagram or WhatsApp logos if they're needed.
- Drawer accessibility: role=dialog + aria-modal + aria-labelledby, x-trap.inert.noscroll, Escape to close, a separate backdrop that closes on click, a close button with aria-label, and qty buttons labelled per product. Keep the role=status live region permanently mounted and change only its text. When removing the last unit deletes a row, move focus to the drawer heading or the next row's control so focus doesn't fall to <body>. Give the list overflow-y:auto with overscroll-behavior:contain, and pad the send button with env(safe-area-inset-bottom) (needs viewport-fit=cover, which the in-progress page already has).
- Motion: use the transitions.dev tokens (cubic-bezier(.22,1,.36,1); 250/150 ms open/close; 400/350 ms panel; 500 ms emphasis; 2–3 px blur). Use View Transitions for routes and page-side-by-side only for fixed-height drawer steps. Enable tilt only for (hover:hover) and (pointer:fine) at 14°. Gate every WAAPI effect, the tilt handler and smooth scrolling on prefers-reduced-motion in JS.
- Serve through the existing .claude/launch.json (`python3 -m http.server 8790 --bind 127.0.0.1`) rather than file://, so localStorage and a future fetch() behave like production. Make the first commit once index.html and app.js settle (the repo is initialized with no commits).
- Ask the owner three things before finishing: whether the heart box's price depends on the number of letters and what the maximum length is (the in-progress code caps it at 12); delivery rules and zones for 'a domicilio'; and whether 'Adiciones' should become a list of named extras instead of a free-text note.

## Trampas

- Several claims in the transitions report were wrong: landing.html has NO Lucide (0 hits), and 'page side-by-side unmodified for routes' does not work because it stacks pages with position:absolute; inset:0. The canonical source is Jakubantalik/transitions.dev (no LICENSE file on GitHub), not the m1ckc3s mirror, although the mirror's values do match.
- x-show defers showing to requestAnimationFrame, so views switched with x-show inside a startViewTransition update are not visible when the 'new' snapshot is captured, even after `await Alpine.nextTick()` (verified). Use x-if or :hidden.
- A skipped view transition (hidden tab, a second navigation starting mid-transition, or a duplicate view-transition-name) rejects `transition.ready`. If nothing catches it, Chrome logs an unhandled InvalidStateError/AbortError (verified). The in-progress app.js only awaits `finished`.
- startViewTransition({update, types}) throws a TypeError on Chrome 111–124, Safari 18.0–18.1 and Firefox 144–146. `types` and :active-view-transition-type() need Chrome 125, Safari 18.2 and Firefox 147.
- wa.me's redirect replaces emoji-type characters, including ♥ (U+2665), with U+FFFD. It's the redirect hop, not your encoding. api.whatsapp.com/send avoids it. On phones with WhatsApp installed, the OS may intercept the link before the redirect, so the bug looks intermittent.
- Alpine's CDN build calls Alpine.start() in a microtask right after its script executes. Any `alpine:init` listener, window.LUSOF, Lucide or plugin placed after the alpinejs <script> is too late.
- x-trap.inert only sets aria-hidden on everything outside the dialog. It does not make the background truly inert for pointer input, so the backdrop must cover the page.
- Alpine x-transition uses only the FIRST value of a comma-separated transition-duration. `transition: opacity .2s, transform .45s` cuts the transform short on leave, so list the longest property first.
- Tailwind v4 browser build: unlayered custom CSS beats all utilities, while custom CSS placed in a layer that comes before 'base' loses to preflight. Class names must still be literal strings, so don't build Tailwind classes by concatenation. Plain lusof.css classes like 'tono-' + p.tono are fine.
- Lucide 1.x removed brand icons (Instagram and Facebook are not in 1.48; they were in 0.475). createElement() does not add aria-hidden, but replaceElement() does. The canonical card-tilt snippet sets touch-action:none, which blocks vertical scrolling when a finger lands on a card.
- A cached <img> can fire `load` before Alpine attaches @load, leaving a skeleton up forever. Check `$el.complete && $el.naturalWidth` in x-init when real photos replace the emoji tiles.
- toLocaleString('es') leaves 4-digit amounts ungrouped (2000). Only 'es-CO' gives 2.000 (verified on Node 22, ICU 77).
- Side effects of this research: my JS ran briefly on the live Lusof page in the shared Browser tab (tab-2), adding a test div and setting Alpine.store('ruta').vista to 'antojos'. Both were reverted (div removed, vista back to 'inicio'), and a reload fully resets the page. I saved temporary downloads to the shared scratchpad and deleted them afterwards; alpine.js there may have overwritten another agent's file with the same name.
