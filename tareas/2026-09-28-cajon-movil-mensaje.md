---
estado: en-curso
dueño: sesión
fecha: 2026-09-28
tema: cajón del pedido — mensaje de WhatsApp con negrita, cursiva y emojis; interacción móvil (deslizar para cerrar, teclado, toques)
criterio_cierre: producción sirve el pedido.js nuevo; en 1440×880 y 375×812 el cuerpo del cajón hace scroll y «Enviar pedido» queda visible; la burbuja pinta <strong>/<em> y escapa el texto de la persona; pruebas y comprobaciones en verde; GO de Yonatan para publicar
---

Pedido de Yonatan (2026-09-28), con captura: «no tiene scroll la ventana derecha, no puedo
finalizar la compra»; «el texto debería ser más dinámico con negrita, cursiva e íconos»;
«optimiza para móvil la interacción al usuario».

## Lo medido

- El «sin scroll» de la captura era una versión vieja en caché de su navegador (no tenía
  «¿Cómo pagas?», que entró en `173623e`); esa versión traía `max-height: none` en el cajón
  de escritorio. El `lusof.css` de producción es idéntico al del repo (diff vacío). En local a
  1440×880: cajón 856 px, cuerpo 603/1036 px con scroll, pie visible.

## Qué cambia

- `assets/js/pedido.js`: el mensaje usa el formato de WhatsApp (`*negrita*`, `_cursiva_`) y
  un emoji por renglón; `formatoWhatsApp()` escapa HTML y pinta la vista previa igual. Lo
  escrito por la persona va sin marcas propias.
- `index.html`: la burbuja usa `x-html="formatoWhatsApp(…)"`; campos con `autocapitalize` y
  `enterkeyhint`; «Vaciar pedido» a 44 px; burbuja con menos sangría en pantallas chicas.
- `assets/js/app.js` + `assets/css/lusof.css`: deslizar hacia abajo el agarre o la cabecera
  cierra la hoja (solo táctil y < 768 px); el radio de «Efectivo o transferencia» no se achica.

## Bitácora

- 2026-09-28: en curso. 62/62 pruebas, `catalogo.mjs --comprobar` y `css.mjs --comprobar` en
  verde. En el panel (Chromium, 375×812): burbuja con `<strong>`/`<em>`; gesto con toques
  simulados — arrastre lento de 60 px vuelve, 140 px cierra, toque no cierra, mouse no aplica.
  Sin probar con un dedo real ni con fuente de emojis (el panel no la trae). Pendiente fuera
  de la web: el Worker del MCP empaqueta `pedido.js` y sigue con el mensaje viejo hasta que
  se redespliegue. Yonatan dio el GO para commit y push («dale, haz commit y push a main»).
