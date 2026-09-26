---
estado: hecha
dueño: sesión
fecha: 2026-09-26
tema: que los agentes encuentren a Lusof Sweet y armen pedidos (MCP y descubrimiento por agentes)
criterio_cierre: un agente sin contexto previo llega al catálogo desde lusof.ynt.codes, arma un pedido válido y obtiene el enlace wa.me con el mensaje exacto que armaría la web; la persona sigue siendo quien lo envía; visto de Yonatan
---

Pedido de Yonatan (2026-09-26): «adicionale mcp para que sea rastreable via agente y
puedan hacer sus pedidos». Llegó en la sesión de la web ya sobre 200k de contexto: se
declara acá y arranca en sesión nueva (`/casa tareas/2026-09-26-mcp-pedidos.md`).

## Primero: decisión de Yonatan — ¿quién envía el pedido?

- **A. La persona, como hoy (recomendado).** El agente arma el pedido y devuelve el
  enlace `wa.me` con el mensaje; la persona lo manda. Conserva el contrato «el sitio
  nunca envía nada» (README), sin servidor ni datos personales guardados. Es el patrón
  de `ynt_prepare_service_request` del MCP de la casa: preparar, nunca enviar.
- **B. El agente lo envía directo.** Exige recibir pedidos en un servidor (Worker u
  homelab), avisar a Lusof (API de WhatsApp Business o correo) y guardar datos
  personales: otro producto, con costo, y cae en la línea roja (hablar hacia afuera).

## Lo que falta (con A, de menor a mayor)

1. **Descubrimiento estático** (funciona en Pages, sin servidor): `llms.txt` en la raíz,
   `catalogo.json` que sale del mismo `assets/js/catalogo.js` (una sola fuente, con una
   comprobación que falle si divergen), JSON-LD schema.org (`Store`, `Product`, `Offer`
   en COP) en `index.html`, y la receta del enlace `wa.me` documentada para que un agente
   lo arme igual que `get mensaje()` de `app.js`.
2. **WebMCP** en `app.js` para agentes que navegan la página: herramientas tipo
   `ver_catalogo`, `agregar_al_pedido`, `ver_pedido`, `preparar_whatsapp` sobre el mismo
   `Alpine.store('pedido')`. Medir antes de escribir: soporte real en navegadores y la
   forma vigente de la API (`navigator.modelContext` u otra), no recordarla.
3. **MCP remoto** para agentes fuera del navegador. Pages no corre código, así que:
   sumar herramientas `lusof_*` al MCP de la casa (repo `ynt-labs` → **tarea aparte en
   ese repo**, en su propia sesión) o un Worker propio (`mcp.lusof.ynt.codes`). Solo
   lectura + preparar el enlace; nunca envía.

## Riesgos

- Dos catálogos que divergen: un precio distinto entre la web y lo que dice un agente.
- El texto que manda un agente (nombre, nota, letras) es dato: mismas normalizaciones y
  topes que la web, nunca HTML.
- El contenido aún no lo confirmó la dueña (README, «Contenido por confirmar»): un
  agente lo citaría como cierto. Conviene confirmarlo antes de anunciarlo a agentes.

## Bitácora

- 2026-09-26: declarada, sin desarrollar (sesión de la web en 209k, regla de corte).
  Pendiente además de la otra tarea: el CNAME `lusof` en Cloudflare (la pestaña quedó en
  el login; Yonatan inicia sesión).
- 2026-09-26: Yonatan decide **A** (la persona envía), alcance **1, 2 y Worker propio**
  (`mcp.lusof.ynt.codes`), y **empujar a `main` si pasa la prueba en local**. En curso.
- 2026-09-26: Yonatan suma la **billetera de Lusof** `0x1D4080589539f65Ddb947b0af403f7f7268aEdc2`
  («haz todo para vincular, adiciona a web»). Medido: checksum EIP-55 válido; nonce 0 y sin
  saldo en Ethereum, Base, Arbitrum, Polygon y Optimism (sin estrenar). Decide: **solo USDC
  en Base**, el monto en USDC **se acuerda por WhatsApp** (sin tasa en el sitio), y el
  pedido gana un campo **Pago** (efectivo o transferencia / USDC en Base) que va en el
  mensaje. Nadie cobra ni verifica pagos en el sitio: sigue siendo A.
- 2026-09-26: **cerrada.** Hecho y verificado (61/61 pruebas, `catalogo.mjs --comprobar` y
  `css.mjs --comprobar` en verde; recorrido por toque en Chrome emulado a 360/390/414/844×390
  y 1280): `pedido.js` como única fuente del mensaje; campo **Pago** y billetera USDC en Base
  en el cajón y en «Así pides» (copiar dirección; «no pagues todavía: te confirmamos monto y
  dirección»); `catalogo.json`, `llms.txt` y JSON-LD generados con `--comprobar` en CI;
  WebMCP (`agentes.js`, API `document.modelContext` del draft CG del 26-sep-2026); MCP remoto
  en `mcp/` (probado local y `wrangler deploy --dry-run`, **sin desplegar**). Refutado dos
  veces; lo medio o peor, arreglado. Mismo push: **pase móvil** pedido por Yonatan
  («optimízalo a mobile») — el goteo tapaba el toque de «← Antojos» (bug en producción,
  `pointer-events` en `.vt-goteo`), cajón inalcanzable con el celular acostado, campo tapado
  por el teclado, botones de cantidad y menú bajo 44 px, «Cómo pedir» sin enlace en celular;
  y **Tailwind compilado** (Yonatan: «compila si la medición lo confirma»; Lighthouse móvil
  TBT 114→0 ms, JS 143→73 KB, 0 clases perdidas). HTTPS: el certificado de Pages no salía;
  con GO de Yonatan se quitó y repuso el dominio (2 commits de GitHub al CNAME), salió
  `approved` y se forzó HTTPS (http → 301) **antes** de publicar la billetera.
  **Queda para Yonatan:** desplegar el Worker (`mcp/LEEME.md`) y luego poner su URL con
  `scripts/catalogo.mjs`; pedir el token del origin trial de WebMCP y ponerlo en `index.html`;
  confirmar con la dueña contenido y medios de pago. **Anotado sin hacer:** en escritorio
  ≥ ~1500 px las gotas salen cortadas planas (el SVG recorta; ya pasaba antes); enlaces de
  texto y «Vaciar pedido» bajo 44 px (bajo). Recomendaciones del WhatsApp de pedidos: en
  `docs/whatsapp-pedidos.md`, **local y fuera de git** por pedido de Yonatan.
