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

Publicado el 2026-09-28 en <https://mcp.lusof.ynt.codes/mcp> (Worker `lusof-mcp`).
**La cuenta de Cloudflare es la de megaplex.med@gmail.com**, la que tiene la zona
`ynt.codes`; con otra, `wrangler deploy` sube el script pero falla la ruta con «Could not
find zone for `mcp.lusof.ynt.codes`».

```bash
cd ~/Developer/lusof/mcp
npx wrangler logout
npx wrangler login --device --use-keyring --browser=false
npx wrangler whoami         # debe decir «Megaplex.med@gmail.com's Account»
npx wrangler deploy         # publica en mcp.lusof.ynt.codes
```

- `--device`: el login por `localhost:8976` se cerraba antes de recibir la respuesta, y
  wrangler solo escucha en `[::1]` (IPv6).
- `--browser=false` + aprobar el código en una **ventana privada** entrando con la cuenta de
  megaplex: si no, el navegador aprueba con la sesión de Cloudflare que ya tenga abierta.
- `--use-keyring`: la credencial queda cifrada con la llave en el llavero de macOS, no en
  texto plano.
- El dominio nuevo tarda unos minutos en tener certificado TLS: mientras tanto el handshake
  se corta (ECONNRESET), no es el Worker.

`catalogo.json` (`agentes.mcp`) y `llms.txt` anuncian la URL; los escribe
`scripts/catalogo.mjs`, que toma las herramientas de los `name: 'lusof_…'` de `worker.mjs`.
Como `worker.mjs` empaqueta `../assets/js/pedido.js`, **un cambio del mensaje o del enlace
exige volver a desplegar el Worker**; si no, el MCP arma el pedido viejo.
