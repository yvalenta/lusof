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
