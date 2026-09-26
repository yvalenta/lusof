---
estado: hecha
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
- 2026-09-26: en curso. Arreglo = opción 3 (repetir en vez de estirar), sin tocar el CSS ni el
  alto: el `viewBox` del goteo pasa a `-1440 0 4320 150`, con el tramo de 1440 tres veces (las
  copias con `--i` corrido, para que las gemelas no caigan a la vez). Con `slice` la escala queda
  en `alto/150` hasta ~3974 px, así que recorta a lo ancho. Medido con playwright-core
  (Chromium headless), HEAD contra el árbol, en `#/`, `#/antojos` y `#/p/torre-eiffel`: gotas
  cortadas abajo a 768/1280/1440/1920/2735/3840 px, antes 1/1/1/4/8/11 → ahora 0 en todos
  (holgura ≥ 4,5 px); ninguna gota pisa texto ni controles, ni antes ni ahora; la franja del
  goteo a 360/390/414 sale idéntica píxel a píxel (0 px distintos). De paso: antes de ~1494 px
  la gota más larga ya salía recortada 2–4 px (768–1440). `css.mjs --comprobar`,
  `catalogo.mjs --comprobar` y 61/61 pruebas en verde. Falta el visto de Yonatan y su GO para
  empujar (empujar publica).
- 2026-09-26: hecha. Yonatan dio el GO para publicar y cerrar («push deploy y cierra sesion»)
  sobre el informe con las capturas antes/después a 1440, 1920 y 2735. Empujado `aa2b130`;
  GitHub Pages lo sirvió al ~30 s (`viewBox="-1440 0 4320 150"` en <https://lusof.ynt.codes>).
  La misma medición contra producción, a 360/390/414/768/1280/1440/1920/2735/3840 en `#/`,
  `#/antojos` y `#/p/torre-eiffel`: 0 gotas cortadas, holgura ≥ 3,9 px, ninguna pisa texto ni
  controles. Límite conocido: pasado ~3974 px de ancho vuelve a recortar a lo alto.
