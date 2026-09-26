#!/usr/bin/env node
// Lusof Sweet — descubrimiento estático para agentes.
//
// Genera, a partir de la ÚNICA fuente (assets/js/catalogo.js + assets/js/pedido.js):
//   1. catalogo.json  — el menú, la billetera y la receta del pedido, para quien no
//      ejecuta JavaScript (agentes, curl, un lector de feeds).
//   2. llms.txt        — resumen en el formato de llmstxt.org.
//   3. el <script type="application/ld+json"> entre los marcadores «datos-estructurados»
//      de index.html (schema.org Store + OfferCatalog).
//
// Sin paquetes: solo node:fs, node:path, node:url y node:module. catalogo.js y
// pedido.js son scripts clásicos (globalThis.LUSOF / globalThis.LUSOF_PEDIDO); se
// cargan por su efecto secundario con `require` (CommonJS), tal como los carga
// <script defer> en el navegador.
//
// Modo `--comprobar`: no escribe nada; sale 1 y lista qué archivo difiere de lo que
// generaría este script (lo usa .github/workflows/comprobar.yml). Sin argumentos:
// escribe los tres archivos y dice qué cambió.
'use strict';

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const require = createRequire(import.meta.url);
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ruta = (...partes) => join(RAIZ, ...partes);

require(ruta('assets/js/catalogo.js')); // deja globalThis.LUSOF
require(ruta('assets/js/pedido.js')); // deja globalThis.LUSOF_PEDIDO (usa LUSOF_PEDIDO, no LUSOF)

const L = globalThis.LUSOF;
const P = globalThis.LUSOF_PEDIDO;

// Herramientas WebMCP: los `name:` del arreglo `herramientas` de assets/js/agentes.js,
// leído como texto (nunca ejecutado: ese archivo usa `window`/`document` y no corre en
// Node). Es obra de otro agente que puede terminar en paralelo con esta sesión; si
// todavía no existe en este checkout, se usa la lista planeada en
// tareas/2026-09-26-mcp-pedidos.md (paso 2) para no romper la generación.
function herramientasWebmcp() {
  const archivo = ruta('assets/js/agentes.js');
  if (!existsSync(archivo)) return ['ver_catalogo', 'agregar_al_pedido', 'ver_pedido', 'preparar_whatsapp'];
  const codigo = readFileSync(archivo, 'utf8');
  return [...codigo.matchAll(/\bname:\s*'([^']+)'/g)].map((m) => m[1]);
}
const HERRAMIENTAS_WEBMCP = herramientasWebmcp();

const DESCRIPCION_SITIO =
  'Fresas bañadas, masmelos, mini donas y cajas de regalo hechos a mano. Arma tu pedido y envíalo por WhatsApp al 300 750 3552.';
const TELEFONO = '+57 300 750 3552';
const IMAGEN_OG = `${L.sitio}assets/img/og-lusof.jpg`;
const LOGO = `${L.sitio}assets/img/logo-lusof.webp`;

// URL absoluta de la imagen de un producto: la foto si hay, si no la ilustración.
// L.sitio termina en «/» y las rutas de catalogo.js son relativas a la raíz.
const imagenAbsoluta = (p) => L.sitio + (p.foto || p.ilustracion);
const urlProducto = (id) => `${L.sitio}#/p/${id}`;
const categoriaLegible = (p) => (p.categoria === 'regalos' ? 'Regalo' : 'Antojo');

// ───────────────────────── catalogo.json ─────────────────────────

// Un pedido de ejemplo real, armado con la misma armarPedido() que usan la web y los
// agentes: `ejemplo` no se escribe a mano, sale de acá para no poder divergir del mensaje real.
const ENTRADA_EJEMPLO = {
  lineas: [
    { id: 'torre-eiffel', cantidad: 1 },
    { id: 'caja-corazon', cantidad: 1, letras: 'TE AMO' },
  ],
  nombre: 'Ana',
  cuando: 'mañana a las 3 pm',
  entrega: 'recoger',
  pago: 'acordar',
  nota: '',
};

function construirCatalogo() {
  const armado = P.armarPedido(L, ENTRADA_EJEMPLO);
  return {
    marca: L.marca,
    sitio: L.sitio,
    whatsapp: L.whatsapp,
    whatsappVisible: L.whatsappVisible,
    moneda: 'COP',
    generado_de: 'assets/js/catalogo.js',
    aviso:
      'Las descripciones de cada producto, cuántas letras caben en la caja de corazón, si hay domicilio y ' +
      'cómo se cobra, qué son las adiciones y los medios de pago, todavía los confirma la dueña del negocio. ' +
      'Los precios son los del flyer.',
    billetera: {
      direccion: L.billetera.direccion,
      red: L.billetera.red,
      chainId: L.billetera.chainId,
      moneda: L.billetera.moneda,
      contrato: L.billetera.contrato,
      nota: L.billetera.nota, // misma nota que ven el cajón y ver_catalogo (WebMCP): no pagues sin confirmar
    },
    productos: L.productos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      corto: p.corto,
      precio: p.precio,
      precioTexto: P.pesos(p.precio),
      categoria: p.categoria,
      descripcion: p.descripcion,
      letras: Boolean(p.letras),
      url: urlProducto(p.id),
      imagen: imagenAbsoluta(p),
    })),
    pedido: {
      reglas: {
        maxLetras: P.MAX_LETRAS,
        maxCantidad: P.MAX_CANTIDAD,
        maxTexto: P.MAX_TEXTO,
        entregas: P.ENTREGAS,
        pagos: P.PAGOS,
      },
      // Receta general, no atada a un pedido: la misma fórmula de LUSOF_PEDIDO.enlaceWhatsApp.
      enlace: 'https://wa.me/<whatsapp>?text=<encodeURIComponent(mensaje)>',
      como:
        'Sumá las líneas del pedido (cantidad × precio), agregá los datos de quien pide y el pago elegido, ' +
        'armá el mensaje (ver armarPedido en assets/js/pedido.js) y abrí el enlace wa.me con ese mensaje ' +
        'codificado con encodeURIComponent. La persona lo envía desde WhatsApp; ni el sitio ni un agente lo mandan.',
      ejemplo: { entrada: ENTRADA_EJEMPLO, mensaje: armado.mensaje, enlace: armado.enlace },
    },
    agentes: {
      webmcp: { donde: `document.modelContext en ${L.sitio}`, herramientas: HERRAMIENTAS_WEBMCP },
      mcp: null, // todavía no hay Worker desplegado: no anunciar un endpoint que no existe
    },
  };
}

// ───────────────────────── llms.txt ─────────────────────────

function construirLlmsTxt(catalogo) {
  const lineasMenu = catalogo.productos.map((p) => `- [${p.nombre}](${p.url}): ${p.precioTexto} — ${p.descripcion}`);
  return [
    `# ${catalogo.marca}`,
    '',
    `> Chocolates hechos con amor: antojos y cajas de regalo hechos a mano, con pedido armado que sale por WhatsApp al ${catalogo.whatsappVisible}.`,
    '',
    '## Cómo pedir',
    '',
    `Arma el mensaje con las líneas del pedido, el total en pesos, los datos de quien pide y el pago elegido — ` +
      `la misma receta de \`armarPedido\` en assets/js/pedido.js — y abrí \`https://wa.me/${catalogo.whatsapp}?text=\` ` +
      'más el mensaje codificado con `encodeURIComponent`. Ni el sitio ni un agente envían el pedido: la persona ' +
      'lo manda desde WhatsApp.',
    '',
    '## Pago',
    '',
    `Los precios están en pesos colombianos (${catalogo.moneda}) y se pagan en efectivo o transferencia. ` +
      `${catalogo.marca} también acepta ${catalogo.billetera.moneda} en ${catalogo.billetera.red} ` +
      `(chainId ${catalogo.billetera.chainId}, contrato \`${catalogo.billetera.contrato}\`) a la dirección ` +
      `\`${catalogo.billetera.direccion}\`. El monto en ${catalogo.billetera.moneda} se acuerda por WhatsApp: ` +
      'no pagues antes de que Lusof te confirme por WhatsApp el monto y la dirección.',
    '',
    '## Menú',
    '',
    ...lineasMenu,
    '',
    '## Archivos',
    '',
    `- [catalogo.json](catalogo.json): el menú completo, la billetera y la receta del pedido, en JSON.`,
    '',
    '## Agentes',
    '',
    `Herramientas WebMCP en \`${catalogo.agentes.webmcp.donde}\`: ${catalogo.agentes.webmcp.herramientas.join(', ')}. ` +
      'Un MCP remoto para agentes fuera del navegador todavía no está desplegado.',
    '',
    '## Aviso',
    '',
    catalogo.aviso,
  ].join('\n');
}

// ───────────────────────── JSON-LD (schema.org) ─────────────────────────

function construirJsonLd() {
  const datos = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: L.marca,
    description: DESCRIPCION_SITIO,
    url: L.sitio,
    telephone: TELEFONO,
    image: IMAGEN_OG,
    logo: LOGO,
    currenciesAccepted: 'COP',
    paymentAccepted: 'Efectivo, transferencia, USDC (Base)',
    address: { '@type': 'PostalAddress', addressCountry: 'CO' }, // no se inventa ciudad
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Menú',
      itemListElement: L.productos.map((p) => ({
        '@type': 'Offer',
        price: p.precio,
        priceCurrency: 'COP',
        url: urlProducto(p.id),
        itemOffered: {
          '@type': 'Product',
          name: p.nombre,
          description: p.descripcion,
          image: imagenAbsoluta(p),
          category: categoriaLegible(p),
        },
      })),
    },
  };
  // '<' escapado a < (válido dentro de un string JSON) para que un «</script>»
  // dentro de un texto no cierre la etiqueta de verdad.
  const json = JSON.stringify(datos, null, 2).replace(/</g, '\\u003c');
  const indentado = json
    .split('\n')
    .map((l) => '  ' + l)
    .join('\n');
  return `  <script type="application/ld+json">\n${indentado}\n  </script>`;
}

const MARCADOR_INICIO = '<!-- datos-estructurados:inicio — lo escribe `node scripts/catalogo.mjs` desde catalogo.js; no editar a mano -->';
const MARCADOR_FIN = '<!-- datos-estructurados:fin -->';

// Reemplaza lo que hay entre los marcadores por el bloque nuevo; conserva el resto del
// archivo intacto. Devuelve null si no encuentra los dos marcadores (contrato roto).
function conBloqueJsonLd(html, bloque) {
  const i = html.indexOf(MARCADOR_INICIO);
  if (i === -1) return null;
  const j = html.indexOf(MARCADOR_FIN, i);
  if (j === -1) return null;
  const antes = html.slice(0, i + MARCADOR_INICIO.length);
  const despues = html.slice(j);
  return `${antes}\n${bloque}\n  ${despues}`;
}

// ───────────────────────── escribir / comprobar ─────────────────────────

const comprobar = process.argv.includes('--comprobar');

const catalogo = construirCatalogo();
const catalogoJson = JSON.stringify(catalogo, null, 2) + '\n';
const llmsTxt = construirLlmsTxt(catalogo) + '\n';
const htmlActual = readFileSync(ruta('index.html'), 'utf8');
const htmlNuevo = conBloqueJsonLd(htmlActual, construirJsonLd());
if (htmlNuevo === null) {
  console.error(
    `index.html no tiene los marcadores «${MARCADOR_INICIO}» … «${MARCADOR_FIN}»: contrato roto, no genero nada.`,
  );
  process.exit(1);
}

const objetivos = [
  { archivo: 'catalogo.json', contenido: catalogoJson },
  { archivo: 'llms.txt', contenido: llmsTxt },
  { archivo: 'index.html', contenido: htmlNuevo },
];

if (comprobar) {
  const difieren = objetivos.filter((o) => !existsSync(ruta(o.archivo)) || readFileSync(ruta(o.archivo), 'utf8') !== o.contenido);
  if (difieren.length) {
    console.error('Desactualizado respecto de assets/js/catalogo.js y assets/js/pedido.js:');
    for (const o of difieren) console.error(`  - ${o.archivo}`);
    console.error('Corré `node scripts/catalogo.mjs` para regenerarlos.');
    process.exit(1);
  }
  console.log('catalogo.json, llms.txt y el JSON-LD de index.html están al día.');
  process.exit(0);
}

for (const o of objetivos) {
  const previo = existsSync(ruta(o.archivo)) ? readFileSync(ruta(o.archivo), 'utf8') : null;
  if (previo === o.contenido) {
    console.log(`${o.archivo}: sin cambios.`);
    continue;
  }
  writeFileSync(ruta(o.archivo), o.contenido);
  console.log(`${o.archivo}: ${previo === null ? 'creado' : 'actualizado'}.`);
}
