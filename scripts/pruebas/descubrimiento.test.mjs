// Pruebas del descubrimiento estático (scripts/catalogo.mjs): catalogo.json, llms.txt
// y el JSON-LD de index.html no pueden divergir de assets/js/catalogo.js.
'use strict';

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';

const require = createRequire(import.meta.url);
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ruta = (...p) => join(RAIZ, ...p);

require(ruta('assets/js/catalogo.js'));
require(ruta('assets/js/pedido.js'));
const L = globalThis.LUSOF;
const P = globalThis.LUSOF_PEDIDO;

test('node scripts/catalogo.mjs --comprobar sale 0 (los tres archivos están generados y al día)', () => {
  // Si esto falla, corré `node scripts/catalogo.mjs` para regenerarlos antes de investigar.
  execFileSync(process.execPath, [ruta('scripts/catalogo.mjs'), '--comprobar'], { cwd: RAIZ });
});

const catalogo = JSON.parse(readFileSync(ruta('catalogo.json'), 'utf8'));

test('catalogo.json: mismos ids, precios y billetera que LUSOF', () => {
  assert.equal(catalogo.marca, L.marca);
  assert.equal(catalogo.sitio, L.sitio);
  assert.equal(catalogo.whatsapp, L.whatsapp);
  assert.equal(catalogo.moneda, 'COP');

  assert.deepEqual(
    catalogo.productos.map((p) => p.id),
    L.productos.map((p) => p.id),
  );
  for (const p of L.productos) {
    const enJson = catalogo.productos.find((x) => x.id === p.id);
    assert.ok(enJson, `falta ${p.id} en catalogo.json`);
    assert.equal(enJson.precio, p.precio);
    assert.equal(enJson.precioTexto, P.pesos(p.precio));
    assert.equal(enJson.categoria, p.categoria);
    assert.equal(enJson.letras, Boolean(p.letras));
    assert.equal(enJson.url, `${L.sitio}#/p/${p.id}`);
    assert.equal(enJson.imagen, L.sitio + (p.foto || p.ilustracion));
  }

  assert.equal(catalogo.billetera.direccion, L.billetera.direccion);
  assert.equal(catalogo.billetera.red, L.billetera.red);
  assert.equal(catalogo.billetera.chainId, L.billetera.chainId);
  assert.equal(catalogo.billetera.moneda, L.billetera.moneda);
  assert.equal(catalogo.billetera.contrato, L.billetera.contrato);
  assert.equal(catalogo.billetera.nota, L.billetera.nota);
});

test('catalogo.json: reglas del pedido iguales a LUSOF_PEDIDO', () => {
  assert.equal(catalogo.pedido.reglas.maxLetras, P.MAX_LETRAS);
  assert.equal(catalogo.pedido.reglas.maxCantidad, P.MAX_CANTIDAD);
  assert.equal(catalogo.pedido.reglas.maxTexto, P.MAX_TEXTO);
  assert.deepEqual(catalogo.pedido.reglas.entregas, P.ENTREGAS);
  assert.deepEqual(catalogo.pedido.reglas.pagos, P.PAGOS);
});

test('catalogo.json: el ejemplo del pedido sale de armarPedido(), no está escrito a mano', () => {
  const armado = P.armarPedido(L, catalogo.pedido.ejemplo.entrada);
  assert.equal(catalogo.pedido.ejemplo.mensaje, armado.mensaje);
  assert.equal(catalogo.pedido.ejemplo.enlace, armado.enlace);
});

test('catalogo.json: el MCP anunciado es el dominio del Worker y sus herramientas son las de mcp/worker.mjs', () => {
  assert.equal(catalogo.agentes.mcp.url, 'https://lusof-mcp.ynt.codes/mcp');
  const reales = [...readFileSync(ruta('mcp/worker.mjs'), 'utf8').matchAll(/\bname:\s*'(lusof_[^']+)'/g)].map((m) => m[1]);
  assert.deepEqual(catalogo.agentes.mcp.herramientas, reales);
  assert.deepEqual(reales, ['lusof_ver_catalogo', 'lusof_preparar_pedido']);
});

test('catalogo.json: las herramientas WebMCP son las que de verdad registra agentes.js', () => {
  const archivoAgentes = ruta('assets/js/agentes.js');
  assert.ok(Array.isArray(catalogo.agentes.webmcp.herramientas) && catalogo.agentes.webmcp.herramientas.length > 0);
  if (!existsSync(archivoAgentes)) return; // todavía no existe en este checkout: nada que cruzar
  const codigo = readFileSync(archivoAgentes, 'utf8');
  const reales = [...codigo.matchAll(/\bname:\s*'([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual(catalogo.agentes.webmcp.herramientas, reales);
});

test('index.html: el JSON-LD entre los marcadores parsea y sus precios coinciden con LUSOF', () => {
  const html = readFileSync(ruta('index.html'), 'utf8');
  const inicio = html.indexOf('datos-estructurados:inicio');
  const fin = html.indexOf('datos-estructurados:fin');
  assert.ok(inicio !== -1 && fin !== -1 && inicio < fin, 'faltan los marcadores datos-estructurados');
  const bloque = html.slice(inicio, fin);

  const m = bloque.match(/<script type="application\/ld\+json">([\s\S]*)<\/script>/);
  assert.ok(m, 'no hay <script type="application/ld+json"> entre los marcadores');
  const datos = JSON.parse(m[1]);

  assert.equal(datos['@type'], 'Store');
  assert.equal(datos.name, L.marca);
  assert.equal(datos.currenciesAccepted, 'COP');
  assert.equal(datos.address['@type'], 'PostalAddress');
  assert.equal(datos.address.addressCountry, 'CO');
  assert.equal(datos.hasOfferCatalog.itemListElement.length, L.productos.length);

  for (const p of L.productos) {
    const oferta = datos.hasOfferCatalog.itemListElement.find((o) => o.url === `${L.sitio}#/p/${p.id}`);
    assert.ok(oferta, `falta la oferta de ${p.id} en el JSON-LD`);
    assert.equal(oferta.price, p.precio);
    assert.equal(oferta.priceCurrency, 'COP');
    assert.equal(oferta.itemOffered.name, p.nombre);
  }
});

test('llms.txt: nombra la dirección de la billetera y «Base»', () => {
  const txt = readFileSync(ruta('llms.txt'), 'utf8');
  assert.ok(txt.includes(L.billetera.direccion), 'llms.txt no tiene la dirección de la billetera');
  assert.ok(txt.includes('Base'), 'llms.txt no menciona «Base»');
  assert.ok(txt.startsWith('# '), 'llms.txt debe empezar con un H1 (llmstxt.org)');
});
