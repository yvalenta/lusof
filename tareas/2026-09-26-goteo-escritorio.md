---
estado: propuesta
dueño: sesión
fecha: 2026-09-26
tema: el goteo de chocolate sale cortado plano en escritorio ancho (≳1500 px)
criterio_cierre: a 1440, 1920 y 2735 px de ancho las gotas terminan redondas y no pisan títulos ni «← Antojos»; celular (360–414) queda igual que hoy; visto de Yonatan
---

Pedido de Yonatan (2026-09-26): «arregla el goteo ya». El bug del toque (el contenedor
`.vt-goteo` se comía el clic de «← Antojos») ya está arreglado y publicado en `173623e`,
verificado en su Chrome. Lo que queda es estético y solo de escritorio.

## Lo medido (sesión del 2026-09-26)

- `.goteo` (SVG, `viewBox 0 0 1440 150`, `preserveAspectRatio="xMidYMin slice"`) tiene
  `height: clamp(64px, 9.5vw, 138px)` y `overflow: hidden`. Pasado ~1494 px de ancho la
  escala horizontal (ancho/1440) alarga las gotas más allá de los 138 px de alto y el SVG las
  recorta: terminan planas justo donde empieza el contenido (captura a 2735 px en el scratch
  de esa sesión). Ya pasaba antes de hoy.
- Las vistas tienen `pt-[clamp(18px,3.5vw,36px)]`, igual al margen negativo del goteo.

## Opciones a medir antes de elegir

1. Subir el tope del alto (p. ej. `clamp(64px, 9.5vw, 190px)`) y compensar el `pt` de las
   vistas: gotas completas hasta ~2000 px, a costa de bajar el contenido.
2. Un segundo SVG (o `<symbol>`) para ≥1500 px con gotas más cortas en el `viewBox`.
3. Dejar de escalar con el ancho pasado cierto punto (repetir el patrón en vez de estirarlo).

Probar con el harness de celular/escritorio (playwright-core) a 360, 390, 414, 1280, 1440,
1920 y 2735, y mirar las capturas.

## Bitácora

- 2026-09-26: declarada, sin desarrollar (la sesión que la vio iba en 270k; regla de corte).
