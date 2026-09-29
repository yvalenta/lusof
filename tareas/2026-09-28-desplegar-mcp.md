---
estado: bloqueada
dueño: yonatan
fecha: 2026-09-28
tema: publicar el Worker del MCP en mcp.lusof.ynt.codes y anunciarlo en catalogo.json y llms.txt
criterio_cierre: POST https://mcp.lusof.ynt.codes/mcp responde initialize y lusof_preparar_pedido da el mismo mensaje y enlace que armarPedido(); catalogo.json trae agentes.mcp con esa URL; GO de Yonatan
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
