---
estado: hecha
dueño: yonatan
fecha: 2026-09-28
tema: publicar el Worker del MCP en lusof-mcp.ynt.codes y anunciarlo en catalogo.json y llms.txt
criterio_cierre: POST https://lusof-mcp.ynt.codes/mcp responde initialize y lusof_preparar_pedido da el mismo mensaje y enlace que armarPedido(); catalogo.json trae agentes.mcp con esa URL; GO de Yonatan
---

Pedido de Yonatan (2026-09-28): «despliega el worker del MCP también». El Worker nunca había
salido (`mcp.lusof.ynt.codes` no resolvía; `agentes.mcp: null` a propósito). Pasos en
`mcp/LEEME.md`.

## Bitácora

- 2026-09-28: `wrangler deploy --dry-run` empaqueta (20 KiB) y `wrangler dev` contra el
  catálogo de producción da el mismo mensaje y enlace que la web. Yonatan inició sesión con
  `wrangler login --device --use-keyring` (el login por localhost se cerraba antes del callback,
  y wrangler solo escucha en `[::1]:8976`). `wrangler deploy` desde `95aeba8` **subió el script
  `lusof-mcp`** a la cuenta «Yo.valenciat@gmail.com's Account» (60439750…) pero falló la ruta:
  «Could not find zone for `mcp.lusof.ynt.codes`». La zona `ynt.codes` está en Cloudflare
  (NS norah/amos) pero en otra cuenta. **Bloqueada**: la desbloquea Yonatan iniciando sesión
  con la cuenta que tiene `ynt.codes` (o sumando esta cuenta a esa zona). El script subido sin
  ruta queda en la cuenta equivocada; borrarlo (`wrangler delete`) es decisión de Yonatan.
- 2026-09-28: con `wrangler login --device --use-keyring --browser=false` aprobado en ventana
  privada, `whoami` = «Megaplex.med@gmail.com's Account» (253ab884…), la que tiene `ynt.codes`.
  `wrangler deploy` publicó `lusof-mcp` (versión `dcc09b60…`) con el custom domain
  `mcp.lusof.ynt.codes`; el DNS resuelve (104.21.77.75 / 172.67.205.97). **Pero el TLS falla**
  (`sslv3 alert handshake failure`, >15 min): el certificado del borde cubre solo `ynt.codes` y
  `*.ynt.codes` (SAN medido con openssl), y `mcp.lusof` es de dos niveles. Para un certificado
  propio, la búsqueda CAA sube a `lusof.ynt.codes` = CNAME a `yvalenta.github.io`, que hereda el
  CAA de GitHub (solo letsencrypt, sectigo, digicert) — posible bloqueo de la emisión.
  **Bloqueada** en una decisión de Yonatan: (a) usar un subdominio de un nivel
  (p. ej. `lusof-mcp.ynt.codes`, cubierto ya por `*.ynt.codes`): cambiar `routes` en
  `mcp/wrangler.toml` y `MCP_URL` en la rama, redesplegar y quitar el dominio viejo; o (b) mirar
  en el panel (Workers → lusof-mcp → Domains) el estado del certificado de `mcp.lusof` y
  esperar/forzar su emisión. El anuncio (`catalogo.json`, `llms.txt`, prueba, README, LEEME)
  está listo en la rama local **`anunciar-mcp`** (65/65 pruebas); fusionarlo solo cuando el
  dominio responda. Sigue en la cuenta Yo.valenciat un `lusof-mcp` sin ruta del primer intento:
  borrarlo es decisión de Yonatan.
- 2026-09-28: Yonatan eligió (a). El dominio pasó a **`lusof-mcp.ynt.codes`** (un nivel, cubierto
  por `*.ynt.codes`) en `mcp/wrangler.toml`, `MCP_URL` de `scripts/catalogo.mjs`, la prueba,
  README y LEEME (la cita del error viejo en LEEME queda como estaba); `catalogo.json` y `llms.txt`
  regenerados; 65/65 pruebas y `--comprobar` al día. `wrangler deploy` (cuenta de megaplex) publicó la
  versión `feaac317…` y **quitó solo** el custom domain `mcp.lusof` (la API de Workers Domains lista
  solo `lusof-mcp.ynt.codes`; `mcp.lusof` ya no resuelve). Medido en vivo: el SAN es
  `ynt.codes, *.ynt.codes`, `initialize` responde y `lusof_preparar_pedido` da **el mismo mensaje,
  enlace y total** que `armarPedido()` sobre el `catalogo.json` de producción (caja-mini ×2, $8.000).
  Ojo al medir desde la Mac: un `dig` hecho antes del deploy dejó la respuesta negativa en la caché
  del sistema y `curl` no resolvía (con `--resolve` al IP de Cloudflare anda). **Falta**: el GO de
  Yonatan para fusionar `anunciar-mcp` a `main` (sale al aire) y confirmar en producción que
  `catalogo.json` trae `agentes.mcp` con la URL nueva. Sigue en la cuenta Yo.valenciat el
  `lusof-mcp` sin ruta del primer intento (borrarlo es decisión de Yonatan).
- 2026-09-28: **GO de Yonatan.** `anunciar-mcp` fusionada a `main` por fast-forward (`8d9aa44`) y
  empujada; CI `comprobar` y el deploy de Pages en verde. Medido en producción:
  `https://lusof.ynt.codes/catalogo.json` trae `agentes.mcp.url = https://lusof-mcp.ynt.codes/mcp`
  y `llms.txt` la anuncia. Criterio de cierre cumplido. **Hecha.** Queda fuera de esta tarea, a
  decisión de Yonatan: el `lusof-mcp` sin ruta en la cuenta Yo.valenciat.
- 2026-09-29: a pedido de Yonatan, borrado el `lusof-mcp` sin ruta de la cuenta Yo.valenciat
  (60439750…): antes de borrar, la API mostró el script (200) sin dominios; después, 404. El de
  producción (megaplex) sigue respondiendo `ping`. Wrangler quedó con la sesión de Yo.valenciat:
  para redesplegar, volver a iniciar sesión con megaplex (`mcp/LEEME.md`).
- 2026-09-29: Yonatan consideró `https://lusof.ynt.codes/mcp` y **decidió quedarse con
  `lusof-mcp.ynt.codes`**. Por qué: `/mcp` en el mismo host exige poner `lusof` con proxy (nube
  naranja) delante de GitHub Pages — depende del modo SSL de la zona (Full, no Flexible; wrangler no
  tiene permiso para leerlo: 9109) y arriesga la renovación del certificado de Pages. En el panel
  (Edge Certificates), `lusof-mcp.ynt.codes` tiene certificado *Advanced* propio, activo y
  administrado (vence 2026-12-27, se renueva solo). Wrangler quedó otra vez con megaplex.
