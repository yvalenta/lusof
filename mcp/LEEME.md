# MCP remoto de Lusof Sweet

Un Worker de Cloudflare, sin dependencias ni SDK, que expone dos herramientas de solo
lectura para agentes que no navegan la página: ver el catálogo y preparar un pedido con
su enlace de WhatsApp. **Nunca envía nada ni cobra**: arma el mensaje y la persona lo
manda ella misma (la misma decisión que la web — ver `README.md` de la raíz). Con pago
en USDC (Base), el monto se acuerda por WhatsApp antes de pagar.

Nada acá es secreto: el repo es público y GitHub Pages sirve `mcp/` igual que el resto.

## Piezas

- `worker.mjs` — el servidor: transporte MCP Streamable HTTP a mano (JSON-RPC 2.0,
  `POST /mcp`) y las dos herramientas (`lusof_ver_catalogo`, `lusof_preparar_pedido`).
  Importa `../assets/js/pedido.js` por su efecto de lado (deja `globalThis.LUSOF_PEDIDO`):
  el pedido se arma con el mismo código que usa la web, no una copia.
- `wrangler.toml` — nombre, `CATALOGO_URL` (por defecto `catalogo.json` en producción) y
  la ruta al dominio `mcp.lusof.ynt.codes`.

El catálogo **siempre se pide en vivo** a `CATALOGO_URL` (con caché corta de borde); si
la red falla, la herramienta responde con un error claro en vez de servir datos viejos.

## Probarlo en local

```bash
# 1) servir el sitio (para que catalogo.json exista en algún lado)
cd ~/Developer/lusof && python3 -m http.server 8790 --bind 127.0.0.1 &

# 2) el Worker, apuntando ahí en vez de a producción
cd ~/Developer/lusof/mcp
CATALOGO_URL=http://127.0.0.1:8790/catalogo.json npx wrangler dev
```

Y probar con `curl` (el Worker queda en `http://127.0.0.1:8787` por defecto):

```bash
curl -s http://127.0.0.1:8787/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18"}}'

curl -s http://127.0.0.1:8787/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"lusof_ver_catalogo","arguments":{}}}'
```

Las pruebas automáticas (sin red, con un catálogo inyectado) están en
`scripts/pruebas/mcp.test.mjs` y corren con `node --test scripts/pruebas/*.test.mjs` desde
la raíz del repo (el directorio a secas, sin el glob, revienta con MODULE_NOT_FOUND en vez
de recorrerlo — ver el comentario de `.github/workflows/comprobar.yml`).

## Desplegarlo (pasos de Yonatan — nadie más hace esto)

```bash
cd ~/Developer/lusof/mcp
npx wrangler login          # una vez, por navegador
npx wrangler deploy         # publica en mcp.lusof.ynt.codes
```

Después de desplegar:

1. Poner la URL real (`https://mcp.lusof.ynt.codes/mcp`) en `agentes.mcp` de
   `catalogo.json`, vía `scripts/catalogo.mjs` (no a mano: es el generador el que
   escribe ese archivo).
2. Sumarla a `llms.txt` en la raíz del sitio.

Hasta que eso pase, `catalogo.json` trae `agentes.mcp: null` a propósito — mejor no
anunciar un endpoint que todavía no existe.
