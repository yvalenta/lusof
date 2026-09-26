// Pruebas del MCP remoto (mcp/worker.mjs), sin red ni Worker real: `crearManejador`
// recibe un `cargarCatalogo` de mentira, así que solo se ejercita el transporte
// (JSON-RPC 2.0, errores, CORS) y las herramientas sobre un catálogo conocido.
//
// El catálogo de prueba: si ya existe catalogo.json en la raíz (lo genera
// scripts/catalogo.mjs, en paralelo, quizás en otra sesión) se usa tal cual. Si todavía
// no existe, se proyecta la misma forma acordada desde globalThis.LUSOF —para no
// depender de un archivo que otro agente puede no haber escrito aún.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import '../../assets/js/catalogo.js'; // side-effect: globalThis.LUSOF
import '../../assets/js/pedido.js'; // side-effect: globalThis.LUSOF_PEDIDO
import { crearManejador } from '../../mcp/worker.mjs';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const RUTA_CATALOGO = path.join(RAIZ, 'catalogo.json');

function proyectarCatalogoDesdeLusof() {
  const L = globalThis.LUSOF;
  const P = globalThis.LUSOF_PEDIDO;
  const sitio = L.sitio;
  const productos = L.productos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    corto: p.corto,
    precio: p.precio,
    precioTexto: P.pesos(p.precio),
    categoria: p.categoria,
    descripcion: p.descripcion,
    letras: !!p.letras,
    url: sitio + '#/p/' + p.id,
    imagen: new URL(p.foto || p.ilustracion, sitio).href,
  }));
  const catalogoParaArmar = { marca: L.marca, whatsapp: L.whatsapp, billetera: L.billetera, productos: L.productos };
  const entradaEjemplo = { lineas: [{ id: productos[0].id, cantidad: 1 }] };
  const ejemplo = P.armarPedido(catalogoParaArmar, entradaEjemplo);
  return {
    marca: L.marca,
    sitio,
    whatsapp: L.whatsapp,
    whatsappVisible: L.whatsappVisible,
    moneda: 'COP',
    generado_de: 'assets/js/catalogo.js',
    aviso:
      'Descripciones, letras que caben, domicilio, adiciones y medios de pago aún por confirmar con la dueña; los precios son los del flyer.',
    billetera: L.billetera, // ya trae `nota` (assets/js/catalogo.js): no se duplica el texto acá
    productos,
    pedido: {
      reglas: { maxLetras: P.MAX_LETRAS, maxCantidad: P.MAX_CANTIDAD, maxTexto: P.MAX_TEXTO, entregas: P.ENTREGAS, pagos: P.PAGOS },
      enlace: 'https://wa.me/<whatsapp>?text=<encodeURIComponent(mensaje)>',
      como: 'Elegí productos y cantidades, sumalos con armarPedido() y abrí el enlace de WhatsApp para mandarlo vos mismo/a.',
      ejemplo: { entrada: entradaEjemplo, mensaje: ejemplo.mensaje, enlace: ejemplo.enlace },
    },
    agentes: {
      webmcp: { donde: 'document.modelContext en ' + sitio, herramientas: ['ver_catalogo', 'agregar_al_pedido', 'ver_pedido', 'preparar_whatsapp'] },
      mcp: null,
    },
  };
}

async function catalogoDePrueba() {
  try {
    return JSON.parse(await readFile(RUTA_CATALOGO, 'utf8'));
  } catch {
    return proyectarCatalogoDesdeLusof();
  }
}

const catalogo = await catalogoDePrueba();
const idProducto = catalogo.productos[0].id;
const idConLetras = catalogo.productos.find((p) => p.letras)?.id;

const cargarOk = () => Promise.resolve(catalogo);
const cargarFalla = (mensaje = 'la red falló') => () => Promise.reject(new Error(mensaje));

const manejador = crearManejador({ cargarCatalogo: cargarOk });

function peticion(cuerpo, { ruta = '/mcp', metodo = 'POST' } = {}) {
  const init = { method: metodo };
  if (cuerpo !== undefined) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo);
  }
  return new Request('http://mcp.local' + ruta, init);
}

// ───────────────────────── initialize ─────────────────────────

test('initialize devuelve la versión pedida cuando está soportada', async () => {
  const resp = await manejador.fetch(peticion({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } }));
  assert.equal(resp.status, 200);
  assert.equal(resp.headers.get('Content-Type'), 'application/json');
  const cuerpo = await resp.json();
  assert.equal(cuerpo.result.protocolVersion, '2025-06-18');
  assert.deepEqual(cuerpo.result.capabilities, { tools: {} });
  assert.deepEqual(cuerpo.result.serverInfo, { name: 'lusof-sweet', version: cuerpo.result.serverInfo.version });
  assert.match(cuerpo.result.instructions, /WhatsApp/);
  assert.match(cuerpo.result.instructions, /never sends/i);
});

test('initialize con una versión no soportada devuelve la más nueva', async () => {
  const resp = await manejador.fetch(peticion({ jsonrpc: '2.0', id: 2, method: 'initialize', params: { protocolVersion: '1999-01-01' } }));
  const cuerpo = await resp.json();
  assert.equal(cuerpo.result.protocolVersion, '2025-11-25');
});

test('initialize sin protocolVersion no revienta: devuelve la más nueva', async () => {
  const resp = await manejador.fetch(peticion({ jsonrpc: '2.0', id: 3, method: 'initialize' }));
  const cuerpo = await resp.json();
  assert.equal(cuerpo.result.protocolVersion, '2025-11-25');
});

// ───────────────────────── notificaciones y ping ─────────────────────────

test('una notificación (sin id) responde 202 sin cuerpo', async () => {
  const resp = await manejador.fetch(peticion({ jsonrpc: '2.0', method: 'notifications/initialized' }));
  assert.equal(resp.status, 202);
  assert.equal(await resp.text(), '');
});

test('ping responde {}', async () => {
  const resp = await manejador.fetch(peticion({ jsonrpc: '2.0', id: 4, method: 'ping' }));
  const cuerpo = await resp.json();
  assert.deepEqual(cuerpo.result, {});
});

// ───────────────────────── tools/list ─────────────────────────

test('tools/list expone las dos herramientas con las anotaciones acordadas', async () => {
  const resp = await manejador.fetch(peticion({ jsonrpc: '2.0', id: 5, method: 'tools/list' }));
  const cuerpo = await resp.json();
  const nombres = cuerpo.result.tools.map((t) => t.name).sort();
  assert.deepEqual(nombres, ['lusof_preparar_pedido', 'lusof_ver_catalogo']);
  for (const t of cuerpo.result.tools) {
    assert.deepEqual(t.annotations, { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false });
    assert.equal(t.outputSchema, undefined);
  }
  const preparar = cuerpo.result.tools.find((t) => t.name === 'lusof_preparar_pedido');
  assert.ok(preparar.inputSchema.properties.lineas.items.properties.id.enum.includes(idProducto));
  assert.deepEqual(preparar.inputSchema.properties.entrega.enum, catalogo.pedido?.reglas?.entregas ?? globalThis.LUSOF_PEDIDO.ENTREGAS);
  assert.deepEqual(preparar.inputSchema.properties.pago.enum, catalogo.pedido?.reglas?.pagos ?? globalThis.LUSOF_PEDIDO.PAGOS);
});

test('tools/list no revienta si el catálogo no carga (esquema con id en texto libre)', async () => {
  const manejadorRoto = crearManejador({ cargarCatalogo: cargarFalla() });
  const resp = await manejadorRoto.fetch(peticion({ jsonrpc: '2.0', id: 6, method: 'tools/list' }));
  assert.equal(resp.status, 200);
  const cuerpo = await resp.json();
  const preparar = cuerpo.result.tools.find((t) => t.name === 'lusof_preparar_pedido');
  assert.equal(preparar.inputSchema.properties.lineas.items.properties.id.enum, undefined);
});

// ───────────────────────── tools/call: lusof_ver_catalogo ─────────────────────────

test('lusof_ver_catalogo trae productos, billetera y aviso', async () => {
  const resp = await manejador.fetch(peticion({ jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'lusof_ver_catalogo', arguments: {} } }));
  const cuerpo = await resp.json();
  assert.equal(cuerpo.result.isError, undefined);
  assert.ok(Array.isArray(cuerpo.result.structuredContent.productos));
  assert.equal(cuerpo.result.structuredContent.productos.length, catalogo.productos.length);
  assert.deepEqual(cuerpo.result.structuredContent.billetera, catalogo.billetera);
  assert.equal(cuerpo.result.content[0].type, 'text');
  assert.deepEqual(JSON.parse(cuerpo.result.content[0].text), cuerpo.result.structuredContent);
});

test('lusof_ver_catalogo filtra por categoría', async () => {
  const resp = await manejador.fetch(
    peticion({ jsonrpc: '2.0', id: 8, method: 'tools/call', params: { name: 'lusof_ver_catalogo', arguments: { categoria: 'regalos' } } }),
  );
  const cuerpo = await resp.json();
  assert.ok(cuerpo.result.structuredContent.productos.length > 0);
  assert.ok(cuerpo.result.structuredContent.productos.every((p) => p.categoria === 'regalos'));
});

test('si el catálogo no carga, lusof_ver_catalogo responde isError con mensaje claro', async () => {
  const manejadorRoto = crearManejador({ cargarCatalogo: cargarFalla('boom de red') });
  const resp = await manejadorRoto.fetch(
    peticion({ jsonrpc: '2.0', id: 9, method: 'tools/call', params: { name: 'lusof_ver_catalogo', arguments: {} } }),
  );
  const cuerpo = await resp.json();
  assert.equal(cuerpo.result.isError, true);
  assert.match(cuerpo.result.content[0].text, /boom de red/);
});

// ───────────────────────── tools/call: lusof_preparar_pedido ─────────────────────────

test('lusof_preparar_pedido arma exactamente el mismo mensaje que armarPedido()', async () => {
  const entrada = { lineas: [{ id: idProducto, cantidad: 2 }], nombre: 'Ana', entrega: 'recoger', pago: 'acordar' };
  const resp = await manejador.fetch(
    peticion({ jsonrpc: '2.0', id: 10, method: 'tools/call', params: { name: 'lusof_preparar_pedido', arguments: entrada } }),
  );
  const cuerpo = await resp.json();
  const esperado = globalThis.LUSOF_PEDIDO.armarPedido(catalogo, entrada);
  assert.equal(cuerpo.result.isError, undefined);
  assert.equal(cuerpo.result.structuredContent.mensaje, esperado.mensaje);
  assert.equal(cuerpo.result.structuredContent.enlace, esperado.enlace);
  assert.equal(cuerpo.result.structuredContent.total, esperado.total);
  assert.match(cuerpo.result.structuredContent.aviso, /no se envió nada/i);
});

test('lusof_preparar_pedido con letras normaliza igual que la web', { skip: !idConLetras && 'ningún producto del catálogo pide letras' }, async () => {
  const entrada = { lineas: [{ id: idConLetras, letras: 'te amo mucho!!' }] };
  const resp = await manejador.fetch(
    peticion({ jsonrpc: '2.0', id: 11, method: 'tools/call', params: { name: 'lusof_preparar_pedido', arguments: entrada } }),
  );
  const cuerpo = await resp.json();
  const esperado = globalThis.LUSOF_PEDIDO.armarPedido(catalogo, entrada);
  assert.equal(cuerpo.result.structuredContent.mensaje, esperado.mensaje);
  assert.equal(cuerpo.result.structuredContent.lineas[0].letras, globalThis.LUSOF_PEDIDO.normalizarLetras('te amo mucho!!'));
});

test('lusof_preparar_pedido con pago usdc suma la billetera y el aviso de no pagar antes', async () => {
  const entrada = { lineas: [{ id: idProducto }], pago: 'usdc' };
  const resp = await manejador.fetch(
    peticion({ jsonrpc: '2.0', id: 12, method: 'tools/call', params: { name: 'lusof_preparar_pedido', arguments: entrada } }),
  );
  const cuerpo = await resp.json();
  assert.deepEqual(cuerpo.result.structuredContent.billetera, catalogo.billetera);
  assert.match(cuerpo.result.structuredContent.aviso, /no pagues/i);
  assert.doesNotMatch(cuerpo.result.structuredContent.aviso, /\d+([.,]\d+)?\s*(USDC)?\s*(=|≈)/);
});

test('una línea con id inexistente no rompe el pedido: queda en avisos', async () => {
  const entrada = { lineas: [{ id: 'no-existe' }] };
  const resp = await manejador.fetch(
    peticion({ jsonrpc: '2.0', id: 13, method: 'tools/call', params: { name: 'lusof_preparar_pedido', arguments: entrada } }),
  );
  const cuerpo = await resp.json();
  assert.equal(cuerpo.result.isError, undefined);
  assert.equal(cuerpo.result.structuredContent.lineas.length, 0);
  assert.ok(cuerpo.result.structuredContent.avisos.some((a) => a.includes('no-existe')));
});

test('si el catálogo no carga, lusof_preparar_pedido responde isError', async () => {
  const manejadorRoto = crearManejador({ cargarCatalogo: cargarFalla('sin red') });
  const resp = await manejadorRoto.fetch(
    peticion({ jsonrpc: '2.0', id: 14, method: 'tools/call', params: { name: 'lusof_preparar_pedido', arguments: { lineas: [{ id: idProducto }] } } }),
  );
  const cuerpo = await resp.json();
  assert.equal(cuerpo.result.isError, true);
  assert.match(cuerpo.result.content[0].text, /sin red/);
});

test('si catalogo.json trae reglas de pedido que ya no son las del bundle, isError pide redesplegar', async () => {
  // Ejemplo real: alguien suma 'nequi' a PAGOS en pedido.js y corre scripts/catalogo.mjs,
  // pero nadie redespliega este Worker — sigue con el PAGOS viejo congelado en el bundle.
  const catalogoDesactualizado = {
    ...catalogo,
    pedido: { ...catalogo.pedido, reglas: { ...catalogo.pedido.reglas, pagos: [...catalogo.pedido.reglas.pagos, 'nequi'] } },
  };
  const manejadorViejo = crearManejador({ cargarCatalogo: () => Promise.resolve(catalogoDesactualizado) });
  const resp = await manejadorViejo.fetch(
    peticion({ jsonrpc: '2.0', id: 15, method: 'tools/call', params: { name: 'lusof_preparar_pedido', arguments: { lineas: [{ id: idProducto }] } } }),
  );
  const cuerpo = await resp.json();
  assert.equal(cuerpo.result.isError, true);
  assert.match(cuerpo.result.content[0].text, /redesplegar/i);
});

test('lusof_ver_catalogo no revienta aunque pedido.reglas esté desactualizado (no las usa)', async () => {
  const catalogoDesactualizado = { ...catalogo, pedido: { ...catalogo.pedido, reglas: { ...catalogo.pedido.reglas, maxCantidad: 5 } } };
  const manejadorViejo = crearManejador({ cargarCatalogo: () => Promise.resolve(catalogoDesactualizado) });
  const resp = await manejadorViejo.fetch(peticion({ jsonrpc: '2.0', id: 16, method: 'tools/call', params: { name: 'lusof_ver_catalogo', arguments: {} } }));
  const cuerpo = await resp.json();
  assert.equal(cuerpo.result.isError, undefined);
});

// ───────────────────────── errores JSON-RPC ─────────────────────────

test('JSON inválido responde -32700', async () => {
  const resp = await manejador.fetch(peticion('{ esto no es json', {}));
  const cuerpo = await resp.json();
  assert.equal(cuerpo.error.code, -32700);
});

test('un lote (batch) responde -32600', async () => {
  const resp = await manejador.fetch(peticion([{ jsonrpc: '2.0', id: 1, method: 'ping' }]));
  const cuerpo = await resp.json();
  assert.equal(cuerpo.error.code, -32600);
});

test('una petición sin jsonrpc "2.0" responde -32600', async () => {
  const resp = await manejador.fetch(peticion({ id: 1, method: 'ping' }));
  const cuerpo = await resp.json();
  assert.equal(cuerpo.error.code, -32600);
});

test('método desconocido responde -32601', async () => {
  const resp = await manejador.fetch(peticion({ jsonrpc: '2.0', id: 15, method: 'no/existe' }));
  const cuerpo = await resp.json();
  assert.equal(cuerpo.error.code, -32601);
});

test('tools/call con nombre de herramienta desconocido responde -32602', async () => {
  const resp = await manejador.fetch(peticion({ jsonrpc: '2.0', id: 16, method: 'tools/call', params: { name: 'no_existe', arguments: {} } }));
  const cuerpo = await resp.json();
  assert.equal(cuerpo.error.code, -32602);
});

test('lusof_preparar_pedido sin "lineas" responde -32602', async () => {
  const resp = await manejador.fetch(
    peticion({ jsonrpc: '2.0', id: 17, method: 'tools/call', params: { name: 'lusof_preparar_pedido', arguments: {} } }),
  );
  const cuerpo = await resp.json();
  assert.equal(cuerpo.error.code, -32602);
});

test('lusof_preparar_pedido con más de 30 líneas responde -32602', async () => {
  const lineas = Array.from({ length: 31 }, () => ({ id: idProducto }));
  const resp = await manejador.fetch(
    peticion({ jsonrpc: '2.0', id: 18, method: 'tools/call', params: { name: 'lusof_preparar_pedido', arguments: { lineas } } }),
  );
  const cuerpo = await resp.json();
  assert.equal(cuerpo.error.code, -32602);
});

// ───────────────────────── CORS y GET ─────────────────────────

test('OPTIONS responde con CORS abierto', async () => {
  const resp = await manejador.fetch(peticion(undefined, { metodo: 'OPTIONS' }));
  assert.equal(resp.status, 204);
  assert.equal(resp.headers.get('Access-Control-Allow-Origin'), '*');
  assert.match(resp.headers.get('Access-Control-Allow-Headers') || '', /Mcp-Protocol-Version/);
  assert.match(resp.headers.get('Access-Control-Allow-Headers') || '', /Mcp-Session-Id/);
});

test('las respuestas normales también llevan CORS abierto', async () => {
  const resp = await manejador.fetch(peticion({ jsonrpc: '2.0', id: 19, method: 'ping' }));
  assert.equal(resp.headers.get('Access-Control-Allow-Origin'), '*');
});

test('GET /mcp responde 405 con Allow: POST', async () => {
  const resp = await manejador.fetch(peticion(undefined, { metodo: 'GET' }));
  assert.equal(resp.status, 405);
  assert.equal(resp.headers.get('Allow'), 'POST');
});

test('GET / explica qué es y dónde está el catálogo', async () => {
  const resp = await manejador.fetch(peticion(undefined, { ruta: '/', metodo: 'GET' }));
  assert.equal(resp.status, 200);
  const cuerpo = await resp.json();
  assert.match(cuerpo.catalogo, /catalogo\.json/);
  assert.match(cuerpo.que_es, /solo lectura/i);
});

test('los errores de transporte salen con HTTP 400, no 200', async () => {
  assert.equal((await manejador.fetch(peticion('{no es json'))).status, 400);
  assert.equal((await manejador.fetch(peticion([{ jsonrpc: '2.0', id: 1, method: 'ping' }]))).status, 400);
  assert.equal((await manejador.fetch(peticion({ jsonrpc: '2.0', id: null, method: 'ping' }))).status, 400);
});

test('una MCP-Protocol-Version no soportada responde 400; una soportada pasa', async () => {
  const conVersion = (v) => new Request('http://mcp.local/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json', 'MCP-Protocol-Version': v }, body: JSON.stringify({ jsonrpc: '2.0', id: 9, method: 'ping' }) });
  assert.equal((await manejador.fetch(conVersion('1999-01-01'))).status, 400);
  assert.equal((await manejador.fetch(conVersion('2025-06-18'))).status, 200);
});
