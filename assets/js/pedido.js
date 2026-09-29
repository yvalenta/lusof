/* Lusof Sweet — el pedido como dato: validar, sumar y armar el mensaje de WhatsApp.
 *
 * Una sola fuente para las tres puertas que arman un pedido: la web (app.js), los
 * agentes que navegan la página (agentes.js, WebMCP) y el MCP remoto (mcp/worker.mjs).
 * Si cambia el mensaje, cambia acá y sale igual en las tres.
 *
 * Sin DOM ni estado: todo entra por parámetro. Corre como <script defer> (antes de
 * app.js) y como módulo en Node y en el Worker; en los tres deja globalThis.LUSOF_PEDIDO.
 *
 * El texto que llega (nombre, nota, letras) es dato: se normaliza y se recorta igual
 * venga de un formulario o de un agente, y nunca se trata como HTML.
 */
(() => {
  'use strict';

  const MAX_LETRAS = 12;
  const MAX_CANTIDAD = 99;
  const MAX_TEXTO = 300;
  const ENTREGAS = ['recoger', 'domicilio'];
  const PAGOS = ['acordar', 'usdc']; // acordar = efectivo o transferencia; usdc = la billetera del catálogo

  // $4.000 — el mismo formato del flyer (es-CO usa punto de miles).
  const pesos = (n) => '$' + Number(n || 0).toLocaleString('es-CO');

  // Letras de chocolate: mayúsculas, números, ♥ y &; un solo espacio entre palabras.
  const normalizarLetras = (s) =>
    String(s || '')
      .toUpperCase()
      .replace(/[^A-ZÑÁÉÍÓÚÜ0-9♥& ]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/^ /, '')
      .slice(0, MAX_LETRAS);

  // Sin sustitutos UTF-16 sueltos (encodeURIComponent lanza con ellos) y recortado por puntos
  // de código, no por unidades: un emoji en el borde del tope no queda partido a la mitad.
  const sinSueltos = (s) => s.replace(/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g, '');
  const recortar = (s) => Array.from(s).slice(0, MAX_TEXTO).join('');
  // Campos de una línea (nombre, cuándo, dirección): sin saltos que imiten otra línea del mensaje.
  const unaLinea = (s) => recortar(sinSueltos(String(s ?? '')).replace(/[\u0000-\u001f\u007f\u0085\u2028\u2029]+/g, ' ').replace(/\s+/g, ' ').trim());
  // La nota admite saltos de línea; lo demás de control sale (NEL y los separadores Unicode pasan a \n).
  const nota = (s) => recortar(sinSueltos(String(s ?? '')).replace(/\r\n?|[\u0085\u2028\u2029]/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').trim());

  // api.whatsapp.com/send y no wa.me: la redirección de wa.me cambia cada emoji (y el ♥ de las
  // letras) por «�» — medido con curl el 2026-09-26 y el 2026-09-28; ver docs/investigacion-2026-09-26.md.
  const enlaceWhatsApp = (catalogo, texto) => `https://api.whatsapp.com/send?phone=${catalogo.whatsapp}&text=${encodeURIComponent(texto)}`;

  /* entrada: { lineas: [{ id, cantidad, letras }], nombre, cuando, entrega, direccion, pago, nota }
   * devuelve: { lineas, unidades, total, mensaje, enlace, avisos }
   * Las líneas que no valen no rompen el pedido: se omiten y quedan en `avisos`. */
  function armarPedido(catalogo, entrada = {}) {
    // Map y no objeto: un id como «constructor» o «__proto__» no debe parecer producto.
    const porId = new Map(catalogo.productos.map((p) => [p.id, p]));
    const avisos = [];
    const lineas = [];

    for (const [i, l] of (Array.isArray(entrada.lineas) ? entrada.lineas : []).entries()) {
      const p = l && porId.get(l.id);
      if (!p) {
        avisos.push(`Línea ${i + 1}: no hay producto con id «${String(l?.id ?? '')}». Omitida.`);
        continue;
      }
      let cantidad = Number(l.cantidad ?? 1);
      if (!Number.isInteger(cantidad) || cantidad < 1) {
        avisos.push(`Línea ${i + 1} (${p.id}): la cantidad debe ser un entero de 1 a ${MAX_CANTIDAD}. Omitida.`);
        continue;
      }
      const letras = p.letras ? normalizarLetras(l.letras).trim() : '';
      if (p.letras && l.letras && letras !== String(l.letras).trim()) avisos.push(`Línea ${i + 1} (${p.id}): las letras quedaron «${letras}» (solo A–Z, Ñ, tildes, números, ♥ y &; hasta ${MAX_LETRAS}).`);
      if (!p.letras && l.letras) avisos.push(`Línea ${i + 1} (${p.id}): este producto no lleva letras; se ignoraron.`);
      const clave = letras ? `${p.id}:${letras}` : p.id;
      const previa = lineas.find((x) => x.clave === clave);
      if (previa) cantidad += previa.cantidad;
      if (cantidad > MAX_CANTIDAD) {
        avisos.push(`${p.id}: la cantidad se limitó a ${MAX_CANTIDAD}.`);
        cantidad = MAX_CANTIDAD;
      }
      if (previa) previa.cantidad = cantidad;
      else lineas.push({ clave, id: p.id, cantidad, letras });
    }
    for (const l of lineas) {
      const p = porId.get(l.id);
      Object.assign(l, { nombre: p.nombre, precio: p.precio, subtotal: p.precio * l.cantidad });
    }

    let entrega = entrada.entrega ?? 'recoger';
    if (!ENTREGAS.includes(entrega)) {
      avisos.push(`Entrega «${String(entrega)}» no existe; quedó «recoger» (opciones: ${ENTREGAS.join(', ')}).`);
      entrega = 'recoger';
    }
    let pago = entrada.pago ?? 'acordar';
    if (!PAGOS.includes(pago) || (pago === 'usdc' && !catalogo.billetera)) {
      avisos.push(`Pago «${String(pago)}» no existe; quedó «acordar» (opciones: ${PAGOS.join(', ')}).`);
      pago = 'acordar';
    }
    const d = {
      nombre: unaLinea(entrada.nombre),
      cuando: unaLinea(entrada.cuando),
      direccion: unaLinea(entrada.direccion),
      nota: nota(entrada.nota),
    };

    const total = lineas.reduce((s, l) => s + l.subtotal, 0);
    // Formato de WhatsApp: *negrita*, _cursiva_ y un emoji por renglón para leerlo de un vistazo.
    // Lo que escribió la persona va sin marcas propias: es dato, no formato.
    const detalle = lineas.map((l) => {
      const letras = porId.get(l.id).letras ? ` _(letras: ${l.letras || 'por definir'})_` : '';
      return `• ${l.cantidad} × ${l.nombre}${letras} — *${pesos(l.subtotal)}*`;
    });
    const b = catalogo.billetera;
    const textoPago = pago === 'usdc' ? `🪙 *Pago:* ${b.moneda} en ${b.red} _(me confirman monto y dirección)_` : '💵 *Pago:* efectivo o transferencia';
    const textoEntrega = entrega === 'domicilio' ? `🛵 *Entrega:* a domicilio${d.direccion ? ', ' + d.direccion : ''}` : '🏪 *Entrega:* lo recojo';
    const mensaje = [
      `¡Hola, *${catalogo.marca}*! 🍫`,
      'Quiero hacer este pedido:',
      '',
      '🛍️ *Mi pedido*',
      ...detalle,
      '',
      `💰 *Total: ${pesos(total)}*`,
      '',
      d.nombre ? `👤 *A nombre de:* ${d.nombre}` : null,
      d.cuando ? `📅 *Para:* ${d.cuando}` : null,
      textoEntrega,
      textoPago,
      d.nota ? `📝 *Nota:* ${d.nota}` : null,
      '',
      '_¡Gracias!_ 💛',
    ]
      .filter((x) => x !== null)
      .join('\n');

    if (!lineas.length) avisos.push('El pedido no tiene productos.');
    return {
      lineas,
      unidades: lineas.reduce((s, l) => s + l.cantidad, 0),
      total,
      datos: { ...d, entrega, pago },
      mensaje,
      enlace: enlaceWhatsApp(catalogo, mensaje),
      avisos,
    };
  }

  /* El mensaje como lo pinta WhatsApp, para la vista previa: HTML escapado primero y después
   * *negrita* y _cursiva_ con la regla de WhatsApp (la marca pega a una palabra, no cruza
   * renglones). Escapar antes es lo que hace seguro usarlo con x-html aunque el texto
   * traiga lo que escribió la persona. */
  const escaparHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  // Primero la negrita (sobre texto ya escapado, sin etiquetas); la cursiva puede envolver una
  // negrita completa pero nunca media, así el HTML queda siempre bien anidado: *_a_*, _*a*_.
  const NEGRITA = /(^|[\s(¡¿_])\*(?=\S)([^*\n]+?)(?<=\S)\*(?=$|[\s.,:;!?)_])/gm;
  const CURSIVA = /(^|[\s(¡¿>])_(?=\S)((?:[^_\n<>]|<strong>[^<]*<\/strong>)+?)(?<=\S)_(?=$|[\s.,:;!?)<])/gm;
  const formatoWhatsApp = (texto) =>
    escaparHTML(texto)
      .replace(NEGRITA, '$1<strong>$2</strong>')
      .replace(CURSIVA, '$1<em>$2</em>');

  globalThis.LUSOF_PEDIDO = { MAX_LETRAS, MAX_CANTIDAD, MAX_TEXTO, ENTREGAS, PAGOS, pesos, normalizarLetras, enlaceWhatsApp, formatoWhatsApp, armarPedido };
})();
