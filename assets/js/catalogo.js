// Catálogo de Lusof Sweet — fuente: «Flyer Lusof Sweet v3» (claude.ai/design).
// Precios en pesos colombianos, sin decimales. Para cambiar un precio, un nombre o
// agregar la foto de un producto, se edita solo este archivo — y después hay que correr
// `node scripts/catalogo.mjs` para que catalogo.json, llms.txt y el JSON-LD de
// index.html (que agentes y buscadores leen, no este archivo) queden al día. Si te lo
// saltás, `node scripts/catalogo.mjs --comprobar` falla en cada push (ver
// .github/workflows/comprobar.yml).
//
//   foto:        ruta relativa a la raíz del sitio (p. ej. 'assets/fotos/torre-eiffel.webp').
//                Con null se muestra la ilustración. Poner la ruta basta para que la foto
//                salga en todas las vistas; si no carga, vuelve la ilustración. Guía y
//                nombres de archivo en assets/fotos/LEEME.md.
//   ilustracion: el dibujo SVG del producto (assets/img/antojos/), el respaldo de la foto.
//   tono:        fondo del mosaico: crema, rubor, coral u oro (clases .tono-* en lusof.css).
//   emoji:       solo para textos cortos; no se usa como imagen.

globalThis.LUSOF = { // globalThis: el mismo archivo lo leen la web, Node (scripts/) y el Worker (mcp/)
  whatsapp: '573007503552', // +57 300 750 3552, país + número, sin signos (como lo pide el enlace de WhatsApp)
  whatsappVisible: '300 750 3552',
  marca: 'Lusof Sweet',
  sitio: 'https://lusof.ynt.codes/',

  // Pago en USDC (decisión de Yonatan, 2026-09-26): solo USDC en Base; el monto en USDC
  // se acuerda por WhatsApp (los precios siguen en pesos). La dirección es pública.
  billetera: {
    direccion: '0x1D4080589539f65Ddb947b0af403f7f7268aEdc2',
    red: 'Base',
    chainId: 8453,
    moneda: 'USDC',
    contrato: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC nativo de Circle en Base
    // Va tal cual en las tres puertas que muestran la billetera (el cajón de la web,
    // ver_catalogo de WebMCP y catalogo.json): nadie debe pagar antes de que Lusof
    // confirme por WhatsApp el monto y la dirección (decisión de Yonatan, 2026-09-26: si alguien
    // cambiara la dirección en el camino, se nota ahí), así que nadie la muestra sin este aviso.
    nota: 'Solo USDC en Base. Antes de pagar, Lusof te confirma por WhatsApp el monto en USDC y la dirección; no pagues sin esa confirmación.',
  },

  productos: [
    {
      id: 'caja-mini',
      nombre: 'Caja mini de chocolate relleno',
      corto: 'Caja mini rellena',
      precio: 4000,
      categoria: 'antojos',
      emoji: '🍫',
      tono: 'oro',
      descripcion: 'Una cajita de chocolate con relleno por dentro. Cabe en la mano y alcanza para un antojo.',
      ilustracion: 'assets/img/antojos/caja-mini.svg',
      foto: null,
    },
    {
      id: 'pincho-masmelos',
      nombre: 'Pincho de masmelos cubiertos de chocolate',
      corto: 'Pincho de masmelos',
      precio: 5000,
      categoria: 'antojos',
      emoji: '🍡',
      tono: 'rubor',
      descripcion: 'Masmelos ensartados en un palito y cubiertos de chocolate.',
      ilustracion: 'assets/img/antojos/pincho-masmelos.svg',
      foto: null,
    },
    {
      id: 'chocolatina-rellena',
      nombre: 'Chocolatina grande rellena',
      corto: 'Chocolatina rellena',
      precio: 5000,
      categoria: 'antojos',
      emoji: '🍫',
      tono: 'crema',
      descripcion: 'Una chocolatina de buen tamaño, rellena, para partir y compartir (o no).',
      ilustracion: 'assets/img/antojos/chocolatina.svg',
      foto: null,
    },
    {
      id: 'vaso-fresas-avellana',
      nombre: 'Vaso de fresas con avellana',
      corto: 'Fresas con avellana',
      precio: 10000,
      categoria: 'antojos',
      emoji: '🍓',
      tono: 'rubor',
      descripcion: 'Fresas frescas en vaso con crema de avellana.',
      ilustracion: 'assets/img/antojos/vaso-fresas.svg',
      foto: null,
    },
    {
      id: 'vaso-mini-donas',
      nombre: 'Vaso de mini donas',
      corto: 'Mini donas',
      precio: 10000,
      categoria: 'antojos',
      emoji: '🍩',
      tono: 'oro',
      descripcion: 'Un vaso lleno de mini donas bañadas y decoradas.',
      ilustracion: 'assets/img/antojos/mini-donas.svg',
      foto: null,
    },
    {
      id: 'pincho-fuente',
      nombre: 'Pincho de masmelos en fuente',
      corto: 'Masmelos en fuente',
      precio: 7000,
      categoria: 'antojos',
      emoji: '🍡',
      tono: 'crema',
      descripcion: 'Masmelos pasados por la fuente de chocolate, recién bañados.',
      ilustracion: 'assets/img/antojos/pincho-fuente.svg',
      foto: null,
    },
    {
      id: 'torre-eiffel',
      nombre: 'Torre Eiffel de chocolate',
      corto: 'Torre Eiffel',
      precio: 7000,
      categoria: 'antojos',
      emoji: '🗼',
      tono: 'coral',
      destacado: true,
      descripcion: 'Una Torre Eiffel de chocolate blanco. Queda bonita en cualquier caja de regalo.',
      ilustracion: 'assets/img/antojos/torre-eiffel.svg',
      foto: null,
    },
    {
      id: 'fresas-x4',
      nombre: 'Fresas bañadas en chocolate ×4',
      corto: 'Fresas bañadas ×4',
      precio: 10000,
      categoria: 'antojos',
      emoji: '🍓',
      tono: 'rubor',
      destacado: true,
      descripcion: 'Cuatro fresas enteras bañadas en chocolate.',
      ilustracion: 'assets/img/antojos/fresas.svg',
      foto: null,
    },
    {
      id: 'adiciones',
      nombre: 'Adiciones',
      corto: 'Adición',
      precio: 2000,
      categoria: 'antojos',
      emoji: '✨',
      tono: 'oro',
      descripcion: 'Un extra para cualquier antojo. Cuéntanos en la nota del pedido cuál quieres.',
      ilustracion: 'assets/img/antojos/adiciones.svg',
      foto: null,
    },
    {
      id: 'caja-corazon',
      nombre: 'Caja de corazón con letras',
      corto: 'Caja de corazón',
      precio: 100000,
      categoria: 'regalos',
      emoji: '💝',
      tono: 'rubor',
      destacado: true,
      letras: true, // pide las letras que van dentro de la caja
      descripcion: 'Una caja en forma de corazón con letras de chocolate: un nombre, una fecha o un «TE AMO».',
      ilustracion: 'assets/img/antojos/caja-corazon.svg',
      foto: null,
    },
    {
      id: 'caja-oso',
      nombre: 'Caja de oso',
      corto: 'Caja de oso',
      precio: 50000,
      categoria: 'regalos',
      emoji: '🧸',
      tono: 'crema',
      destacado: true,
      descripcion: 'Una caja de regalo con un oso y chocolates, lista para entregar.',
      ilustracion: 'assets/img/antojos/caja-oso.svg',
      foto: null,
    },
  ],
};
