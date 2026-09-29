---
estado: hecha
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
- 2026-09-28: empujado `ce4bfbc`; Pages lo sirvió a los ~20 s (6 archivos idénticos al commit).
  Medido en producción: 1440×880 cajón 12–868 px, cuerpo 599/1140 con scroll, «Enviar» visible;
  375×812 cajón 65–812 px, «Enviar» visible; la burbuja pinta `<strong>`/`<em>` y escapa HTML.
- 2026-09-28: revisión adversarial del diff (workflow `wf_b5253bb7-0ff`, 12 agentes) — 7
  confirmados. **Alto**: `wa.me` redirige a `api.whatsapp.com/send/` cambiando cada emoji por
  `%EF%BF%BD` (reproducido con curl: `🍫`, `♥` → `�`); ya estaba medido en
  `docs/investigacion-2026-09-26.md`. Bajos: el recorte por unidades UTF-16 podía partir un
  emoji y hacer lanzar `encodeURIComponent` (previo a este cambio, solo por agentes); un segundo
  dedo rompía el arrastre; el agarre quedó con tope plano; `cursor: grab` sin gesto con mouse;
  la prueba de NEL se debilitó; la vista previa anidaba mal marcas combinadas. Arreglados todos:
  enlace `https://api.whatsapp.com/send?phone=…&text=…` (curl con el mensaje real: 0 `�` en
  escritorio; en iPhone el `whatsapp://send` conserva los bytes, solo la página intermedia
  pinta `�` en su texto de muestra), `sinSueltos` + recorte por puntos de código, arrastre
  atado a su `pointerId`, agarre de vuelta a píldora. 65/65 pruebas, `--comprobar` de catálogo
  y CSS en verde; en el panel: el botón abre api.whatsapp.com y un segundo dedo se ignora.
- 2026-09-28: el Worker del MCP nunca estuvo desplegado (`mcp.lusof.ynt.codes` no resuelve,
  `agentes.mcp: null`). `wrangler deploy --dry-run` empaqueta bien (20 KiB) y `wrangler dev`
  contra el catálogo de producción da el mismo mensaje y enlace que la web. Falta la sesión de
  Cloudflare: `wrangler login` se cerró sin levantar el callback en :8976 (visto en su
  terminal); paso de Yonatan con `--device`.
- 2026-09-28: hecha. Yonatan dio el GO para publicar el arreglo («go push»). Empujado `95aeba8`;
  Pages lo sirvió a los ~25 s (9 archivos idénticos al commit). En producción el botón «Enviar»
  abre `api.whatsapp.com/send` con 🍫 🛍️ 💰 🏪 💵 💛 en el `text` y 0 `�`. Queda para Yonatan
  mirarlo en su celular (el panel no trae fuente de emojis ni probé el gesto con un dedo real).
  El despliegue del Worker sigue en `tareas/2026-09-28-desplegar-mcp.md`.
