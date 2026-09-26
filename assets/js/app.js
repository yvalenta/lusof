/* Lusof Sweet — la interacción: rutas, pedido por WhatsApp y movimiento.
 *
 * Sin build: este archivo corre con `defer` DESPUÉS de catalogo.js y ANTES de Alpine
 * (el orden de los <script> en index.html es parte del contrato).
 *
 *   rutas      #/  #/antojos  #/regalos  #/como-pedir  #/p/<id>
 *   estado     Alpine.store('ruta')  y  Alpine.store('pedido')  (el pedido se guarda en localStorage)
 *   salida     un enlace https://wa.me/573007503552?text=… con el mensaje armado
 *
 * Movimiento (tokens de transitions.dev): salida cubic-bezier(.22,1,.36,1), rebote
 * cubic-bezier(.34,1.45,.64,1). Con «reducir movimiento» se quita todo lo decorativo
 * y el estado cambia igual.
 */
(() => {
  'use strict';

  const L = window.LUSOF;
  const productos = L.productos;
  const porId = Object.fromEntries(productos.map((p) => [p.id, p]));
  const menosMovimiento = matchMedia('(prefers-reduced-motion: reduce)');
  const punteroFino = matchMedia('(hover: hover) and (pointer: fine)');
  const GUARDADO = 'lusof-pedido-v1';
  const MAX_LETRAS = 12;
  const MAX_CANTIDAD = 99;
  const REBOTE = 'cubic-bezier(.34,1.45,.64,1)';

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

  // ───────────────────────── Rutas ─────────────────────────
  function leerRuta(hash = location.hash) {
    const [a, b] = hash.replace(/^#\/?/, '').split('/');
    if (a === 'antojos' || a === 'regalos') return { vista: a, id: null, seccion: null };
    if (a === 'como-pedir') return { vista: 'inicio', id: null, seccion: 'como-pedir' };
    if (a === 'p' && porId[b]) return { vista: 'producto', id: b, seccion: null };
    return { vista: 'inicio', id: null, seccion: null };
  }
  const TITULOS = {
    inicio: 'Lusof Sweet | Chocolates hechos con amor',
    antojos: 'Antojos | Lusof Sweet',
    regalos: 'Regalos | Lusof Sweet',
  };
  const tituloDe = (r) => (r.vista === 'producto' ? `${porId[r.id].nombre} | Lusof Sweet` : TITULOS[r.vista]);
  const claveDe = (r) => r.vista + (r.id ? '/' + r.id : '');

  const scrolls = new Map();
  const compartidos = [];

  // El primer elemento que coincide y que se ve en pantalla (o null).
  function visibleEnPantalla(selector) {
    for (const el of document.querySelectorAll(selector)) {
      const r = el.getBoundingClientRect();
      if (r.width && r.bottom > 0 && r.top < innerHeight) return el;
    }
    return null;
  }

  function irASeccion(id, suave = true) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: suave && !menosMovimiento.matches ? 'smooth' : 'auto', block: 'start' });
  }

  // Tras navegar, el foco va al título de la vista nueva (lectores de pantalla y teclado).
  function enfocarTitulo() {
    document.querySelector('main [data-titulo]')?.focus({ preventScroll: true });
  }

  async function cambiarRuta() {
    const ruta = Alpine.store('ruta');
    const antes = { vista: ruta.vista, id: ruta.id, seccion: ruta.seccion };
    const despues = leerRuta();
    scrolls.set(claveDe(antes), scrollY);
    ruta.navegaciones++;

    // Misma vista (p. ej. de #/ a #/como-pedir): solo se desplaza.
    if (claveDe(antes) === claveDe(despues)) {
      ruta.seccion = despues.seccion;
      if (despues.seccion) irASeccion(despues.seccion);
      else scrollTo({ top: 0, behavior: menosMovimiento.matches ? 'auto' : 'smooth' });
      return;
    }

    const actualizar = async () => {
      Object.assign(ruta, despues);
      await Alpine.nextTick(); // Alpine parcha el DOM en la siguiente vuelta: esperar antes de la foto «nueva»
      document.title = tituloDe(despues);
      if (despues.seccion) irASeccion(despues.seccion, false);
      else if (antes.vista === 'producto' && scrolls.has(claveDe(despues))) scrollTo(0, scrolls.get(claveDe(despues)));
      else scrollTo(0, 0);
    };

    if (!document.startViewTransition || menosMovimiento.matches) {
      await actualizar();
      enfocarTitulo();
      return;
    }

    // Elemento compartido: el mosaico del producto viaja entre la lista y el detalle.
    const haciaDetalle = despues.vista === 'producto';
    const desdeDetalle = antes.vista === 'producto';
    let fuente = null;
    if (haciaDetalle && !desdeDetalle) {
      fuente = visibleEnPantalla(`[data-mosaico="${despues.id}"]`);
      if (fuente) fuente.style.viewTransitionName = 'producto';
    }
    const actualizarConNombres = async () => {
      if (fuente) fuente.style.viewTransitionName = '';
      await actualizar();
      if (desdeDetalle && !haciaDetalle) {
        const destino = visibleEnPantalla(`[data-mosaico="${antes.id}"]`);
        if (destino) {
          destino.style.viewTransitionName = 'producto';
          compartidos.push(destino);
        }
      }
    };

    const tipo = haciaDetalle ? 'adelante' : desdeDetalle ? 'atras' : 'lado';
    let transicion;
    try {
      transicion = document.startViewTransition({ update: actualizarConNombres, types: [tipo] });
    } catch {
      transicion = document.startViewTransition(actualizarConNombres); // navegadores sin `types`
    }
    try {
      await transicion.finished;
    } catch {
      /* una transición saltada no es un error: el DOM ya cambió */
    } finally {
      compartidos.splice(0).forEach((el) => (el.style.viewTransitionName = ''));
      enfocarTitulo();
    }
  }

  // ───────────────────────── Efectos que responden a una acción ─────────────────────────
  const efectos = {
    // El dibujo del producto vuela en arco desde el botón hasta la bolsa: dice dónde quedó.
    volar(origen, imagen) {
      const destino = visibleEnPantalla('[data-destino-pedido]');
      if (!origen || !destino || !imagen || menosMovimiento.matches || !origen.isConnected) return;
      const a = origen.getBoundingClientRect();
      const b = destino.getBoundingClientRect();
      const x0 = a.left + a.width / 2 - 22;
      const y0 = a.top + a.height / 2 - 22;
      const x1 = b.left + b.width / 2 - 22;
      const y1 = b.top + b.height / 2 - 22;
      const cima = Math.min(y0, y1) - Math.max(60, Math.abs(x1 - x0) * 0.18);

      const eje = document.createElement('div'); // eje X lineal…
      const bola = document.createElement('img'); // …y eje Y con su propia curva = arco
      eje.className = 'volador';
      eje.setAttribute('aria-hidden', 'true');
      bola.src = imagen;
      bola.alt = '';
      bola.width = bola.height = 44;
      eje.append(bola);
      document.body.append(eje);

      const ms = 720;
      eje.animate([{ transform: `translateX(${x0}px)` }, { transform: `translateX(${x1}px)` }], {
        duration: ms,
        easing: 'cubic-bezier(.3,0,.6,1)',
        fill: 'forwards',
      });
      const vuelo = bola.animate(
        [
          { transform: `translateY(${y0}px) scale(1)`, easing: 'cubic-bezier(.2,.7,.4,1)' },
          { transform: `translateY(${cima}px) scale(1.25)`, offset: 0.42, easing: 'cubic-bezier(.6,0,.9,.5)' },
          { transform: `translateY(${y1}px) scale(.35)`, opacity: 0.35 },
        ],
        { duration: ms, fill: 'forwards' },
      );
      vuelo.onfinish = () => eje.remove();
      vuelo.oncancel = () => eje.remove();
    },

    // Estallido de corazones (patrón «like button» de transitions.dev), solo para regalos.
    chispas(origen) {
      if (!origen || menosMovimiento.matches || !origen.isConnected) return;
      const r = origen.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const n = 8;
      for (let i = 0; i < n; i++) {
        const ang = (Math.PI * 2 * i) / n + (i % 2 ? 0.25 : -0.1);
        const dist = 38 + (i % 3) * 12;
        const c = document.createElement('i');
        c.className = 'chispa';
        c.setAttribute('aria-hidden', 'true');
        c.style.left = `${cx - 5}px`;
        c.style.top = `${cy - 5}px`;
        document.body.append(c);
        c.animate(
          [
            { transform: 'translate(0,0) rotate(-45deg) scale(.4)', opacity: 0 },
            { opacity: 1, offset: 0.2 },
            { transform: `translate(${Math.cos(ang) * dist}px, ${Math.sin(ang) * dist}px) rotate(-45deg) scale(${i % 2 ? 0.7 : 1})`, opacity: 0 },
          ],
          { duration: 560 + (i % 3) * 60, easing: 'cubic-bezier(.16,1,.3,1)' },
        ).onfinish = () => c.remove();
      }
    },

    // La bolsa del pedido «late» cuando cambia la cantidad (patrón «notification badge»).
    latir() {
      if (menosMovimiento.matches) return;
      document.querySelectorAll('[data-late]').forEach((el) => {
        if (!el.getClientRects().length) return;
        el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.16)', offset: 0.35 }, { transform: 'scale(1)' }], {
          duration: 480,
          easing: 'cubic-bezier(.34,1.56,.64,1)',
        });
      });
    },
  };

  // ───────────────────────── Alpine ─────────────────────────
  document.addEventListener('alpine:init', () => {
    const Alpine = window.Alpine;

    Alpine.store('ruta', {
      ...leerRuta(),
      navegaciones: 0,
      // qué enlace del menú queda marcado (un producto marca su categoría)
      get seccionMenu() {
        if (this.vista === 'producto') return porId[this.id]?.categoria;
        return this.vista;
      },
    });

    Alpine.store('pedido', {
      lineas: [], // { clave, id, cantidad, letras }
      datos: { nombre: '', cuando: '', entrega: 'recoger', direccion: '', nota: '' },
      abierto: false,
      confirmandoVaciar: false,
      enviado: false,
      anuncio: '',

      init() {
        try {
          const g = JSON.parse(localStorage.getItem(GUARDADO) || 'null');
          if (g && Array.isArray(g.lineas)) {
            this.lineas = g.lineas
              .filter((l) => l && porId[l.id] && Number.isInteger(l.cantidad) && l.cantidad > 0)
              .map((l) => {
                const letras = porId[l.id].letras ? normalizarLetras(l.letras) : '';
                return { clave: letras ? `${l.id}:${letras}` : l.id, id: l.id, cantidad: Math.min(l.cantidad, MAX_CANTIDAD), letras };
              });
          }
          if (g && g.datos && typeof g.datos === 'object') {
            for (const k of Object.keys(this.datos)) {
              if (typeof g.datos[k] === 'string') this.datos[k] = g.datos[k].slice(0, 300);
            }
            if (!['recoger', 'domicilio'].includes(this.datos.entrega)) this.datos.entrega = 'recoger';
          }
        } catch {
          /* sin localStorage (modo privado, bloqueado): el pedido vive solo en esta pestaña */
        }

        let previas = this.unidades;
        Alpine.effect(() => {
          const copia = JSON.stringify({ lineas: this.lineas, datos: this.datos });
          try {
            localStorage.setItem(GUARDADO, copia);
          } catch {
            /* idem */
          }
          const u = this.unidades;
          if (u !== previas) {
            if (u > previas) efectos.latir();
            this.enviado = false; // el pedido cambió: el mensaje enviado ya no es este
            previas = u;
          }
        });
      },

      producto: (id) => porId[id],
      get unidades() {
        return this.lineas.reduce((s, l) => s + l.cantidad, 0);
      },
      get total() {
        return this.lineas.reduce((s, l) => s + porId[l.id].precio * l.cantidad, 0);
      },
      cantidadDe(id) {
        return this.lineas.reduce((s, l) => (l.id === id ? s + l.cantidad : s), 0);
      },

      agregar(id, { cantidad = 1, letras = '', origen = null } = {}) {
        const p = porId[id];
        if (!p) return;
        const l = p.letras ? normalizarLetras(letras).trim() : '';
        const clave = l ? `${id}:${l}` : id;
        const linea = this.lineas.find((x) => x.clave === clave);
        if (linea) linea.cantidad = Math.min(linea.cantidad + cantidad, MAX_CANTIDAD);
        else this.lineas.push({ clave, id, cantidad: Math.min(cantidad, MAX_CANTIDAD), letras: l });
        const n = this.cantidadDe(id);
        this.anuncio = `${p.corto} agregado. Llevas ${n} en tu pedido, total ${pesos(this.total)}.`;
        efectos.volar(origen, p.foto || p.ilustracion);
      },

      cambiar(clave, delta) {
        const linea = this.lineas.find((x) => x.clave === clave);
        if (!linea) return;
        linea.cantidad = Math.min(linea.cantidad + delta, MAX_CANTIDAD);
        const p = porId[linea.id];
        if (linea.cantidad <= 0) {
          this.quitar(clave);
          return;
        }
        this.anuncio = `${p.corto}: ${linea.cantidad}. Total ${pesos(this.total)}.`;
      },

      quitar(clave) {
        const linea = this.lineas.find((x) => x.clave === clave);
        this.lineas = this.lineas.filter((x) => x.clave !== clave);
        if (linea) this.anuncio = `${porId[linea.id].corto} quitado del pedido. Total ${pesos(this.total)}.`;
      },

      vaciar() {
        if (!this.confirmandoVaciar) {
          this.confirmandoVaciar = true;
          setTimeout(() => (this.confirmandoVaciar = false), 4000);
          return;
        }
        this.lineas = [];
        this.confirmandoVaciar = false;
        this.enviado = false;
        this.anuncio = 'Pedido vacío.';
      },

      abrir() {
        this.abierto = true;
      },
      cerrar() {
        this.abierto = false;
        this.confirmandoVaciar = false;
      },

      get mensaje() {
        const d = this.datos;
        const t = (s) => String(s || '').trim();
        const lineas = this.lineas.map((l) => {
          const p = porId[l.id];
          const letras = p.letras ? ` (letras: ${l.letras || 'por definir'})` : '';
          return `• ${l.cantidad} × ${p.nombre}${letras}: ${pesos(p.precio * l.cantidad)}`;
        });
        const entrega = d.entrega === 'domicilio' ? `a domicilio${t(d.direccion) ? ', ' + t(d.direccion) : ''}` : 'lo recojo';
        return [
          `¡Hola, ${L.marca}! Quiero hacer este pedido:`,
          '',
          ...lineas,
          '',
          `Total: ${pesos(this.total)}`,
          '',
          t(d.nombre) ? `A nombre de: ${t(d.nombre)}` : null,
          t(d.cuando) ? `Para: ${t(d.cuando)}` : null,
          `Entrega: ${entrega}`,
          t(d.nota) ? `Nota: ${t(d.nota)}` : null,
        ]
          .filter((x) => x !== null)
          .join('\n');
      },
      get enlace() {
        return `https://wa.me/${L.whatsapp}?text=${encodeURIComponent(this.mensaje)}`;
      },
      get enlaceSaludo() {
        return `https://wa.me/${L.whatsapp}?text=${encodeURIComponent(`¡Hola, ${L.marca}! Quiero hacer un pedido.`)}`;
      },
      marcarEnviado() {
        this.enviado = true;
        this.anuncio = 'Abrimos WhatsApp con tu pedido. Falta que lo envíes desde allá.';
      },
    });

    // Raíz de la página: catálogo y utilidades que usan las plantillas.
    Alpine.data('tienda', () => ({
      whatsappVisible: L.whatsappVisible,
      antojos: productos.filter((p) => p.categoria === 'antojos'),
      regalos: productos.filter((p) => p.categoria === 'regalos'),
      destacados: productos.filter((p) => p.destacado),
      pesos,
      desde(categoria) {
        return Math.min(...productos.filter((p) => p.categoria === categoria).map((p) => p.precio));
      },
      // Sumar desde una fila o tarjeta y dejar el foco en el control que aparece.
      sumar(id, boton) {
        const fila = boton.closest('[data-fila]');
        this.$store.pedido.agregar(id, { origen: boton });
        this.$nextTick(() => fila?.querySelector('[data-mas]')?.focus());
      },
      restar(clave, boton) {
        const fila = boton.closest('[data-fila]');
        this.$store.pedido.cambiar(clave, -1);
        this.$nextTick(() => {
          const mas = fila?.querySelector('[data-mas]');
          if (!mas || !mas.getClientRects().length) fila?.querySelector('[data-agregar]')?.focus();
        });
      },
      // Toque en el fondo del cajón: el clic llega al <dialog> pero cae fuera de su caja.
      // Respaldo de `closedby="any"` para los navegadores que aún no lo tienen.
      cerrarSiFuera(e) {
        const d = e.currentTarget;
        if (e.target !== d) return;
        const r = d.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) this.$store.pedido.cerrar();
      },
      mas(clave, boton) {
        this.$store.pedido.cambiar(clave, 1);
        const p = porId[clave.split(':')[0]];
        if (p) efectos.volar(boton, p.foto || p.ilustracion);
      },
    }));

    // Vista de detalle de un producto.
    Alpine.data('detalle', () => ({
      cantidad: 1,
      letras: '',
      agregado: false,
      temporizador: 0,
      init() {
        this.$watch('$store.ruta.id', () => {
          this.cantidad = 1;
          this.letras = '';
          this.agregado = false;
        });
      },
      get p() {
        return porId[this.$store.ruta.id] || productos[0];
      },
      get vistaLetras() {
        const s = normalizarLetras(this.letras).trim();
        return [...(s || 'TE AMO')];
      },
      get letrasVacias() {
        return !normalizarLetras(this.letras).trim();
      },
      normalizar() {
        this.letras = normalizarLetras(this.letras);
      },
      corazon() {
        if (normalizarLetras(this.letras + '♥').length > this.letras.length) this.letras = normalizarLetras(this.letras + '♥');
      },
      get sugeridos() {
        const misma = productos.filter((x) => x.categoria === 'antojos' && x.id !== this.p.id);
        const i = Math.max(0, productos.indexOf(this.p));
        return [...misma.slice(i % misma.length), ...misma.slice(0, i % misma.length)].slice(0, 3);
      },
      get volverHref() {
        return this.p.categoria === 'regalos' ? '#/regalos' : '#/antojos';
      },
      volver(e) {
        // Si llegó navegando dentro del sitio, «volver» es volver (y recupera el scroll).
        if (this.$store.ruta.navegaciones > 0) {
          e.preventDefault();
          history.back();
        }
      },
      agregar(boton) {
        this.$store.pedido.agregar(this.p.id, { cantidad: this.cantidad, letras: this.letras, origen: boton });
        if (this.p.letras) efectos.chispas(boton);
        this.agregado = true;
        clearTimeout(this.temporizador);
        this.temporizador = setTimeout(() => {
          this.agregado = false;
          this.cantidad = 1;
        }, 1800);
      },
    }));

    // x-inclinar: inclinación 3D con reflejo (patrón «card tilt» de transitions.dev).
    // El puntero se lee en el elemento plano (el que lleva la directiva) y se inclina
    // su hijo .inclinable, para que el borde que gira no se escape del cursor.
    Alpine.directive('inclinar', (el, _, { cleanup }) => {
      const tarjeta = el.querySelector('.inclinable');
      if (!tarjeta) return;
      const MAX = 9;
      let cuadro = 0;
      const mover = (e) => {
        if (e.pointerType !== 'mouse' || !punteroFino.matches || menosMovimiento.matches) return;
        const r = tarjeta.parentElement.getBoundingClientRect();
        cancelAnimationFrame(cuadro);
        cuadro = requestAnimationFrame(() => {
          const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
          const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
          tarjeta.classList.add('inclinando');
          tarjeta.style.setProperty('--rx', `${((0.5 - py) * MAX).toFixed(2)}deg`);
          tarjeta.style.setProperty('--ry', `${((px - 0.5) * MAX).toFixed(2)}deg`);
          tarjeta.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
          tarjeta.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
        });
      };
      const soltar = () => {
        cancelAnimationFrame(cuadro);
        tarjeta.classList.remove('inclinando');
        for (const v of ['--rx', '--ry', '--gx', '--gy']) tarjeta.style.removeProperty(v);
      };
      el.addEventListener('pointermove', mover);
      el.addEventListener('pointerleave', soltar);
      cleanup(() => {
        el.removeEventListener('pointermove', mover);
        el.removeEventListener('pointerleave', soltar);
        cancelAnimationFrame(cuadro);
      });
    });

    // x-imagen="producto": el único lugar que decide qué imagen lleva un mosaico. Con
    // `foto` en catalogo.js va la foto (entra con fundido al cargar); sin foto, o si la
    // foto no carga (ruta mal escrita, archivo que falta), va la ilustración. Así una
    // foto real aparece en TODAS las vistas —lista, detalle, sugeridos, cajón— con
    // editar una sola línea. `.ansiosa` para la imagen principal (sin carga diferida).
    // Con null no pone imagen (la caja de corazón dibuja sus letras en su lugar).
    Alpine.directive('imagen', (el, { expression, modifiers }, { effect, evaluateLater, cleanup }) => {
      const leer = evaluateLater(expression);
      const ansiosa = modifiers.includes('ansiosa');
      let img = null;
      const ilustrar = (i, p) => {
        i.className = 'ilustracion';
        i.width = i.height = 160;
        i.removeAttribute('loading');
        i.onload = i.onerror = null;
        i.src = p.ilustracion;
      };
      effect(() =>
        leer((p) => {
          if (!p) {
            img?.remove();
            img = null;
            return;
          }
          if (!img) {
            img = document.createElement('img');
            img.alt = '';
            img.decoding = 'async';
            el.prepend(img);
          }
          const i = img;
          if (!p.foto) return ilustrar(i, p);
          i.className = 'foto';
          i.removeAttribute('width');
          i.removeAttribute('height');
          if (ansiosa) i.fetchPriority = 'high';
          else i.loading = 'lazy';
          i.onload = () => i.classList.add('cargada');
          i.onerror = () => ilustrar(i, p);
          i.src = p.foto;
        }),
      );
      cleanup(() => img?.remove());
    });

    // x-pop="valor": cuando el valor cambia, la cifra entra desde abajo (patrón «number pop-in»).
    Alpine.directive('pop', (el, { expression }, { effect, evaluateLater }) => {
      const leer = evaluateLater(expression);
      let previo;
      let primero = true;
      effect(() =>
        leer((v) => {
          if (!primero && v !== previo && !menosMovimiento.matches && el.getClientRects().length) {
            el.animate(
              [
                { transform: 'translateY(.45em)', opacity: 0, filter: 'blur(2px)' },
                { transform: 'none', opacity: 1, filter: 'blur(0)' },
              ],
              { duration: 500, easing: REBOTE },
            );
          }
          primero = false;
          previo = v;
        }),
      );
    });
  });

  // Primera pintura: se muestra la página cuando Tailwind (CDN) ya compiló y Alpine pintó.
  document.addEventListener('alpine:initialized', () => {
    document.title = tituloDe(window.Alpine.store('ruta'));
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('cargando');
        const r = window.Alpine.store('ruta');
        if (r.seccion) irASeccion(r.seccion, false);
        // el goteo y el titular se animan solo en la primera carga
        setTimeout(() => document.documentElement.classList.remove('primera'), 2600);
      }),
    );
  });

  window.addEventListener('hashchange', () => cambiarRuta());
})();
