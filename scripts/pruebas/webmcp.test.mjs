// Prueba assets/js/agentes.js (WebMCP) cargando los archivos REALES del sitio
// (catalogo.js, pedido.js, app.js, agentes.js) dentro de un contexto `vm` de Node, con
// un `document` falso (un EventTarget de verdad) y un `Alpine` falso que reproduce lo
// mínimo de Alpine.store/data/directive/effect/nextTick que app.js necesita para armar
// Alpine.store('pedido') tal cual lo arma la web. Así la prueba corre contra el store
// real (mismo código, mismos getters `armado`/`mensaje`/`enlace`), no contra una
// reimplementación de agentes.js.
//
// Corre con: node --test scripts/pruebas/*.test.mjs   (desde la raíz del repo; sin
// paquetes). El directorio a secas (sin el glob) revienta acá con MODULE_NOT_FOUND en
// vez de recorrerlo — ver el comentario de .github/workflows/comprobar.yml.
//
// Qué NO prueba este archivo (documentado, no verificado acá):
//   - que document.modelContext exista de verdad en algún Chrome: eso depende del
//     origin trial (Chrome 149–156) o de chrome://flags/#enable-webmcp-testing, no de
//     este repo;
//   - cómo serializa a JSON el resultado de `execute` un host real de WebMCP, ni cómo
//     usa `annotations` o el `signal` de cancelación: acá se llama `execute` directo,
//     como lo haría cualquier host que respete la interfaz descrita en la tarea;
//   - Alpine de verdad (reactividad, `x-if`, el `<dialog>`): el `Alpine` de esta prueba
//     es un doble mínimo, documentado arriba, que solo entiende store/data/directive/
//     effect/nextTick lo justo para que app.js arme el store del pedido.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ARCHIVOS = ['assets/js/catalogo.js', 'assets/js/pedido.js', 'assets/js/app.js', 'assets/js/agentes.js'];
const NOMBRES_ESPERADOS = ['abrir_pedido', 'agregar_al_pedido', 'anotar_datos', 'cambiar_cantidad', 'ver_catalogo', 'ver_pedido'];

// Alpine falso: guarda el objeto de cada store (llamando a su init(), como el Alpine de
// verdad) y lo devuelve cuando lo piden solo por nombre. data/directive no hacen falta
// sin DOM real: basta con que existan para que app.js no truene al llamarlas.
function alpineFalso() {
  const stores = new Map();
  return {
    store(nombre, definicion) {
      if (definicion === undefined) return stores.get(nombre);
      stores.set(nombre, definicion);
      if (typeof definicion.init === 'function') definicion.init();
      return definicion;
    },
    data() {},
    directive() {},
    effect(fn) {
      fn(); // sin reactividad real: alcanza con correr el efecto una vez, como al iniciar
    },
    nextTick(fn) {
      if (fn) fn();
      return Promise.resolve();
    },
    reactive(x) {
      return x;
    },
  };
}

// Arma una «página» nueva: un contexto vm con los cuatro scripts reales ya cargados y
// los eventos 'alpine:init' + 'alpine:initialized' ya disparados sobre `document`,
// igual que pasaría en el sitio (los <script defer> registran sus listeners primero;
// Alpine, al iniciar, dispara los dos eventos sobre document).
function crearPagina({ conModelContext = true, modelContext } = {}) {
  const document = new EventTarget();
  document.title = '';
  document.documentElement = { classList: { add() {}, remove() {} } };
  document.getElementById = () => null;
  document.querySelector = () => null;
  document.querySelectorAll = () => [];

  const llamadasRegistro = [];
  if (modelContext) {
    document.modelContext = modelContext;
  } else if (conModelContext) {
    document.modelContext = {
      registerTool(tool) {
        llamadasRegistro.push(tool);
        return Promise.resolve();
      },
    };
  }
  // sin conModelContext y sin modelContext: document.modelContext queda undefined,
  // como en cualquier navegador de hoy sin el origin trial ni el flag.

  const avisos = []; // console.warn del sandbox: para comprobar que nada se queja sin razón
  const sandbox = {
    console: { ...console, warn: (...a) => avisos.push(a) },
    document,
    location: { hash: '' },
    history: {},
    matchMedia: () => ({ matches: false }),
    requestAnimationFrame: (fn) => (fn(), 0),
    cancelAnimationFrame: () => {},
    setTimeout: (fn) => (typeof fn === 'function' && fn(), 0), // sin demora: nada que colgar la prueba
    clearTimeout: () => {},
    Alpine: alpineFalso(),
    addEventListener: () => {}, // window.addEventListener('hashchange', …): no se dispara acá
  };
  sandbox.window = sandbox; // window === globalThis, como en un navegador de verdad
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);

  for (const archivo of ARCHIVOS) {
    const codigo = fs.readFileSync(path.join(RAIZ, archivo), 'utf8');
    vm.runInContext(codigo, sandbox, { filename: archivo });
  }

  document.dispatchEvent(new Event('alpine:init'));
  document.dispatchEvent(new Event('alpine:initialized'));

  return { sandbox, document, llamadasRegistro, avisos };
}

function herramientasPor(sandbox) {
  const lista = sandbox.window.LUSOF_AGENTES?.herramientas ?? [];
  return Object.fromEntries(lista.map((h) => [h.name, h]));
}

test('siempre expone window.LUSOF_AGENTES con las 6 herramientas, y las registra en modelContext', () => {
  const { sandbox, llamadasRegistro } = crearPagina({ conModelContext: true });
  const lista = sandbox.window.LUSOF_AGENTES.herramientas;
  assert.equal(lista.length, 6);

  const nombreValido = /^[A-Za-z0-9_.-]{1,128}$/;
  for (const h of lista) {
    assert.match(h.name, nombreValido, `nombre inválido: ${h.name}`);
    assert.equal(typeof h.description, 'string');
    assert.ok(h.description.length > 0, `${h.name} sin description`);
    assert.equal(typeof h.execute, 'function');
  }
  // Array.from (del realm de la prueba) para no comparar un array del vm-context ajeno
  // contra uno propio: assert.deepEqual los trata como distintos aunque el contenido
  // se vea igual (prototipos de Array de dos realms distintos).
  assert.deepEqual(Array.from(lista, (h) => h.name).sort(), [...NOMBRES_ESPERADOS].sort());

  // Cada una se registró en document.modelContext, una sola vez.
  assert.equal(llamadasRegistro.length, 6);
  assert.deepEqual(llamadasRegistro.map((t) => t.name).sort(), [...NOMBRES_ESPERADOS].sort());

  // Las de solo lectura llevan su annotation; ver_pedido además untrustedContentHint
  // (lleva texto que escribió la persona).
  const porNombre = herramientasPor(sandbox);
  assert.equal(porNombre.ver_catalogo.annotations.readOnlyHint, true);
  assert.equal(porNombre.ver_pedido.annotations.readOnlyHint, true);
  assert.equal(porNombre.ver_pedido.annotations.untrustedContentHint, true);
});

test('sin document.modelContext no registra nada y no lanza (la página no se rompe)', () => {
  const { sandbox, llamadasRegistro, avisos } = crearPagina({ conModelContext: false });
  assert.equal(llamadasRegistro.length, 0);
  assert.equal(sandbox.window.LUSOF_AGENTES.herramientas.length, 6); // se expone igual, para depurar
  assert.deepEqual(avisos, []); // sin la API no hay nada que advertir
});

test('una herramienta que falla al registrarse (throw síncrono) no tumba a las demás', () => {
  const registradas = [];
  const { avisos } = crearPagina({
    modelContext: {
      registerTool(tool) {
        if (tool.name === 'ver_catalogo') throw new Error('registro roto a propósito');
        registradas.push(tool.name);
        return Promise.resolve();
      },
    },
  });
  assert.equal(registradas.length, 5);
  assert.ok(!registradas.includes('ver_catalogo'));
  assert.equal(avisos.length, 1);
  assert.match(avisos[0][0], /\[lusof\]/);
  assert.match(avisos[0][0], /ver_catalogo/);
});

test('una promesa de registro rechazada (falla async) también queda advertida, no revienta', async () => {
  const { avisos } = crearPagina({
    modelContext: {
      registerTool(tool) {
        return tool.name === 'ver_pedido' ? Promise.reject(new Error('rechazo async')) : Promise.resolve();
      },
    },
  });
  await Promise.resolve();
  await Promise.resolve(); // dejar correr el microtask del .catch antes de mirar `avisos`
  assert.equal(avisos.length, 1);
  assert.match(avisos[0][0], /ver_pedido/);
});

test('ver_catalogo trae los productos del catálogo real, sin montos ni tasas en USDC', async () => {
  const { sandbox } = crearPagina();
  const { ver_catalogo } = herramientasPor(sandbox);

  const todo = await ver_catalogo.execute({});
  assert.equal(todo.productos.length, sandbox.window.LUSOF.productos.length);
  const corazon = todo.productos.find((p) => p.id === 'caja-corazon');
  assert.equal(corazon.letras, true);
  assert.equal(corazon.precioTexto, sandbox.window.LUSOF_PEDIDO.pesos(corazon.precio));
  assert.equal(corazon.url, `${sandbox.window.LUSOF.sitio}#/p/caja-corazon`);
  assert.equal(todo.billetera.direccion, sandbox.window.LUSOF.billetera.direccion);
  assert.match(todo.billetera.nota, /no pagues/i); // el «no pagues todavía» viaja con la billetera, no solo en el cajón
  assert.doesNotMatch(todo.aviso, /usdc/i); // el aviso de contenido no habla de montos

  const soloRegalos = await ver_catalogo.execute({ categoria: 'regalos' });
  assert.ok(soloRegalos.productos.length > 0);
  assert.ok(soloRegalos.productos.every((p) => p.categoria === 'regalos'));

  await assert.rejects(() => ver_catalogo.execute({ categoria: 'no-existe' }), /categoría/i);
});

test('flujo agregar → anotar (pago usdc) → ver_pedido da el mismo mensaje que armarPedido', async () => {
  const { sandbox } = crearPagina();
  const { agregar_al_pedido, anotar_datos, ver_pedido } = herramientasPor(sandbox);

  await agregar_al_pedido.execute({ id: 'torre-eiffel', cantidad: 2 });
  await anotar_datos.execute({ nombre: 'Ana', pago: 'usdc', entrega: 'domicilio', direccion: 'Cra 1 # 2-3' });
  const pedido = await ver_pedido.execute();

  const esperado = sandbox.window.LUSOF_PEDIDO.armarPedido(sandbox.window.LUSOF, {
    lineas: [{ id: 'torre-eiffel', cantidad: 2 }],
    nombre: 'Ana',
    pago: 'usdc',
    entrega: 'domicilio',
    direccion: 'Cra 1 # 2-3',
  });

  assert.equal(pedido.mensaje, esperado.mensaje);
  assert.equal(pedido.enlace, esperado.enlace);
  assert.equal(pedido.total, esperado.total);
  assert.match(pedido.recordatorio, /whatsapp/i);
  assert.match(pedido.recordatorio, /usdc/i); // con pago usdc, el recordatorio lo menciona
  assert.doesNotMatch(pedido.recordatorio, /\$\d/); // pero nunca con un monto en USDC
});

test('agregar_al_pedido sin pago dado deja «acordar»: el recordatorio no menciona usdc', async () => {
  const { sandbox } = crearPagina();
  const { agregar_al_pedido, ver_pedido } = herramientasPor(sandbox);
  await agregar_al_pedido.execute({ id: 'caja-mini' }); // cantidad por defecto: 1
  const pedido = await ver_pedido.execute();
  assert.equal(pedido.datos.pago, 'acordar');
  assert.doesNotMatch(pedido.recordatorio, /usdc/i);
});

test('cambiar_cantidad ajusta la línea, y a 0 la quita', async () => {
  const { sandbox } = crearPagina();
  const { agregar_al_pedido, cambiar_cantidad, ver_pedido } = herramientasPor(sandbox);

  await agregar_al_pedido.execute({ id: 'caja-mini', cantidad: 3 });
  const [linea] = (await ver_pedido.execute()).lineas;
  assert.equal(linea.cantidad, 3);

  await cambiar_cantidad.execute({ clave: linea.clave, cantidad: 5 });
  assert.equal((await ver_pedido.execute()).lineas[0].cantidad, 5);

  await cambiar_cantidad.execute({ clave: linea.clave, cantidad: 0 });
  assert.equal((await ver_pedido.execute()).lineas.length, 0);
});

test('abrir_pedido abre el cajón del store real', async () => {
  const { sandbox } = crearPagina();
  const { abrir_pedido } = herramientasPor(sandbox);
  assert.equal(sandbox.Alpine.store('pedido').abierto, false);
  const r = await abrir_pedido.execute();
  assert.equal(r.abierto, true);
  assert.equal(sandbox.Alpine.store('pedido').abierto, true);
});

test('entradas inválidas lanzan Error en español, y no dejan el store a medio cambiar', async () => {
  const { sandbox } = crearPagina();
  const { agregar_al_pedido, cambiar_cantidad, anotar_datos } = herramientasPor(sandbox);

  await assert.rejects(() => agregar_al_pedido.execute({ id: 'no-existe' }), /no hay ningún producto/i);
  await assert.rejects(() => agregar_al_pedido.execute({ id: 'torre-eiffel', cantidad: 0 }), /entero/i);
  await assert.rejects(() => agregar_al_pedido.execute({ id: 'torre-eiffel', cantidad: 1.5 }), /entero/i);
  await assert.rejects(() => agregar_al_pedido.execute({ id: 'torre-eiffel', cantidad: 1000 }), /entero/i);
  await assert.rejects(() => agregar_al_pedido.execute({ id: 'torre-eiffel', letras: 42 }), /texto/i);
  assert.equal(sandbox.Alpine.store('pedido').lineas.length, 0); // ninguna entrada inválida agregó nada

  await assert.rejects(() => cambiar_cantidad.execute({ clave: 'no-existe', cantidad: 1 }), /no hay ninguna línea/i);

  await assert.rejects(() => anotar_datos.execute({ entrega: 'volando' }), /entrega/i);
  await assert.rejects(() => anotar_datos.execute({ pago: 'tarjeta' }), /pago/i);
  await assert.rejects(() => anotar_datos.execute({ nota: 42 }), /texto/i);
});
