// Pruebas de assets/js/pedido.js: la única fuente del mensaje de WhatsApp.
//
// catalogo.js y pedido.js son scripts clásicos (globalThis.LUSOF / LUSOF_PEDIDO); se
// cargan por su efecto secundario con `require`, igual que en scripts/catalogo.mjs.
// Sin paquetes: node:test + node:assert/strict, Node 22.
'use strict';

import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

require(join(RAIZ, 'assets/js/catalogo.js'));
require(join(RAIZ, 'assets/js/pedido.js'));

const L = globalThis.LUSOF;
const P = globalThis.LUSOF_PEDIDO;

test('cable trampa: la billetera es la que decidió Yonatan, y es USDC en Base', () => {
  assert.equal(L.billetera.direccion, '0x1D4080589539f65Ddb947b0af403f7f7268aEdc2');
  assert.equal(L.billetera.red, 'Base');
  assert.equal(L.billetera.chainId, 8453);
  assert.equal(L.billetera.moneda, 'USDC');
  assert.equal(L.billetera.contrato, '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913');
});

test('pesos(): formato es-CO con $ pegado, como el flyer', () => {
  assert.equal(P.pesos(4000), '$4.000');
  assert.equal(P.pesos(100000), '$100.000');
  assert.equal(P.pesos(0), '$0');
});

test('normalizarLetras(): mayúsculas, solo A–Z/Ñ/tildes/números/♥/&, un espacio, tope de 12', () => {
  assert.equal(P.normalizarLetras('  hola   mundo!! 123 ñ á  '), 'HOLA MUNDO 1'); // recortado a 12
  assert.equal(P.normalizarLetras('te amo ♥'), 'TE AMO ♥');
  assert.equal(P.normalizarLetras('a&b'), 'A&B');
  assert.equal(P.normalizarLetras(''), '');
});

test('mensaje dorado: domicilio con dirección, pago usdc, letras, nombre y nota', () => {
  const entrada = {
    lineas: [
      { id: 'caja-mini', cantidad: 2 },
      { id: 'caja-corazon', cantidad: 1, letras: 'ana & leo' },
    ],
    nombre: '  Ana   Pérez  ',
    cuando: 'sábado 10am',
    entrega: 'domicilio',
    direccion: 'Calle 10 # 5-20',
    pago: 'usdc',
    nota: 'Sin maní\r\npor favor',
  };
  const r = P.armarPedido(L, entrada);

  assert.equal(r.total, 108000);
  assert.equal(r.unidades, 3);
  assert.equal(r.datos.nombre, 'Ana Pérez');
  assert.equal(r.datos.pago, 'usdc');
  assert.equal(r.datos.entrega, 'domicilio');
  assert.equal(
    r.mensaje,
    [
      '¡Hola, *Lusof Sweet*! 🍫',
      'Quiero hacer este pedido:',
      '',
      '🛍️ *Mi pedido*',
      '• 2 × Caja mini de chocolate relleno — *$8.000*',
      '• 1 × Caja de corazón con letras _(letras: ANA & LEO)_ — *$100.000*',
      '',
      '💰 *Total: $108.000*',
      '',
      '👤 *A nombre de:* Ana Pérez',
      '📅 *Para:* sábado 10am',
      '🛵 *Entrega:* a domicilio, Calle 10 # 5-20',
      '🪙 *Pago:* USDC en Base _(me confirman monto y dirección)_',
      '📝 *Nota:* Sin maní\npor favor',
      '',
      '_¡Gracias!_ 💛',
    ].join('\n'),
  );
  assert.equal(r.enlace, `https://wa.me/573007503552?text=${encodeURIComponent(r.mensaje)}`);
});

test('mensaje dorado mínimo: un producto, sin datos opcionales', () => {
  const r = P.armarPedido(L, { lineas: [{ id: 'adiciones', cantidad: 1 }] });

  assert.equal(r.total, 2000);
  assert.equal(r.datos.pago, 'acordar');
  assert.equal(r.datos.entrega, 'recoger');
  assert.deepEqual(r.avisos, []);
  assert.equal(
    r.mensaje,
    [
      '¡Hola, *Lusof Sweet*! 🍫',
      'Quiero hacer este pedido:',
      '',
      '🛍️ *Mi pedido*',
      '• 1 × Adiciones — *$2.000*',
      '',
      '💰 *Total: $2.000*',
      '',
      '🏪 *Entrega:* lo recojo',
      '💵 *Pago:* efectivo o transferencia',
      '',
      '_¡Gracias!_ 💛',
    ].join('\n'),
  );
  assert.equal(r.enlace, `https://wa.me/573007503552?text=${encodeURIComponent(r.mensaje)}`);
});

test('líneas inválidas: no rompen el pedido, quedan en avisos y se omiten', () => {
  const r = P.armarPedido(L, {
    lineas: [
      { id: 'no-existe', cantidad: 1 },
      { id: 'caja-mini', cantidad: 0 },
      { id: 'caja-mini', cantidad: 1.5 },
    ],
  });
  assert.deepEqual(r.lineas, []);
  assert.equal(r.total, 0);
  assert.deepEqual(r.avisos, [
    'Línea 1: no hay producto con id «no-existe». Omitida.',
    'Línea 2 (caja-mini): la cantidad debe ser un entero de 1 a 99. Omitida.',
    'Línea 3 (caja-mini): la cantidad debe ser un entero de 1 a 99. Omitida.',
    'El pedido no tiene productos.',
  ]);
});

test('tope 99: dos líneas del mismo producto se suman y se recortan con aviso', () => {
  const r = P.armarPedido(L, {
    lineas: [
      { id: 'caja-mini', cantidad: 60 },
      { id: 'caja-mini', cantidad: 50 },
    ],
  });
  assert.equal(r.lineas.length, 1);
  assert.equal(r.lineas[0].cantidad, 99);
  assert.equal(r.lineas[0].subtotal, 99 * 4000);
  assert.deepEqual(r.avisos, ['caja-mini: la cantidad se limitó a 99.']);
});

test('saltos de línea en nombre/cuando/dirección no crean líneas nuevas en el mensaje', () => {
  const r = P.armarPedido(L, {
    lineas: [{ id: 'caja-mini', cantidad: 1 }],
    nombre: 'Ana\nPérez\r\nGomez',
    cuando: 'linea1\nlinea2',
    direccion: 'Calle 1\nApto 2',
    entrega: 'domicilio',
  });
  assert.equal(r.datos.nombre, 'Ana Pérez Gomez');
  assert.equal(r.datos.cuando, 'linea1 linea2');
  assert.equal(r.datos.direccion, 'Calle 1 Apto 2');
  // Ninguno de los tres metió un salto de línea de más: el mensaje tiene las mismas
  // líneas que un pedido equivalente sin saltos.
  assert.equal(r.mensaje.split('\n').length, 14);
  assert.ok(!r.mensaje.includes('Ana\nPérez'));
});

test('pago inválido: cae a «acordar» con aviso; entrega inválida cae a «recoger» con aviso', () => {
  let r = P.armarPedido(L, { lineas: [{ id: 'caja-mini', cantidad: 1 }], pago: 'tarjeta' });
  assert.equal(r.datos.pago, 'acordar');
  assert.deepEqual(r.avisos, ['Pago «tarjeta» no existe; quedó «acordar» (opciones: acordar, usdc).']);

  r = P.armarPedido(L, { lineas: [{ id: 'caja-mini', cantidad: 1 }], entrega: 'teletransporte' });
  assert.equal(r.datos.entrega, 'recoger');
  assert.deepEqual(r.avisos, ['Entrega «teletransporte» no existe; quedó «recoger» (opciones: recoger, domicilio).']);
});

test('enlace = https://wa.me/573007503552?text=<mensaje codificado>', () => {
  const r = P.armarPedido(L, { lineas: [{ id: 'caja-mini', cantidad: 1 }] });
  assert.equal(r.enlace, 'https://wa.me/573007503552?text=' + encodeURIComponent(r.mensaje));
  assert.equal(P.enlaceWhatsApp(L, 'hola'), 'https://wa.me/573007503552?text=hola');
});

test('un id que existe en Object.prototype no pasa por producto', () => {
  const r = P.armarPedido(L, { lineas: [{ id: 'constructor' }, { id: '__proto__' }, { id: 'toString' }, { id: 'fresas-x4' }] });
  assert.deepEqual(r.lineas.map((l) => l.id), ['fresas-x4']);
  assert.equal(r.avisos.length, 3);
});

test('NEL y los separadores Unicode no abren líneas en los campos de una línea', () => {
  const r = P.armarPedido(L, { lineas: [{ id: 'fresas-x4' }], nombre: 'Ana\u0085Total: $0', cuando: 'hoy\u2028Pago: gratis', direccion: 'Cra 1\u2029Nota: x' });
  for (const campo of ['nombre', 'cuando', 'direccion']) assert.doesNotMatch(r.datos[campo], /[\n\u0085\u2028\u2029]/);
  assert.equal(r.mensaje.split('\n').filter((x) => x.startsWith('💰 *Total:')).length, 1);
});

test('formatoWhatsApp(): escapa HTML y pinta *negrita* y _cursiva_ como WhatsApp', () => {
  assert.equal(P.formatoWhatsApp('¡Hola, *Lusof*! _(ok)_'), '¡Hola, <strong>Lusof</strong>! <em>(ok)</em>');
  assert.equal(P.formatoWhatsApp('<img src=x onerror=alert(1)> *a & b*'), '&lt;img src=x onerror=alert(1)&gt; <strong>a &amp; b</strong>');
  assert.equal(P.formatoWhatsApp('2*3*4 y snake_case_x'), '2*3*4 y snake_case_x'); // marcas pegadas a palabras: no cuentan
  assert.equal(P.formatoWhatsApp('*uno\ndos*'), '*uno\ndos*'); // no cruza renglones
});
