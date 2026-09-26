# Fotos de los productos

Mientras un producto no tenga foto, el sitio muestra su dibujo (`assets/img/antojos/`).
Para pasarlo a foto real son **dos pasos**:

1. Guardar la foto en esta carpeta con el nombre del producto (tabla abajo).
2. En `assets/js/catalogo.js`, en ese producto, cambiar `foto: null` por
   `foto: 'assets/fotos/<nombre>.webp'`.

Eso es todo: la foto aparece en todas partes a la vez (menú, detalle, «Súmale un
antojo», sugeridos y el cajón del pedido), porque todas usan la misma pieza
(`x-imagen` en `assets/js/app.js`). Si la ruta queda mal escrita, se sigue viendo el
dibujo, no un hueco.

## Cómo preparar la foto

- **Cuadrada**, con el producto al centro: los mosaicos recortan al centro
  (`object-fit: cover`). Las cajas de regalo se ven en 5:4 en su página, así que conviene
  dejar un poco de aire a los lados.
- **~900 × 900 px**, en `.webp` (o `.jpg`, cambiando la extensión en `foto`). En la Mac,
  con la foto ya recortada cuadrada:
  `cwebp -q 82 -resize 900 900 foto.jpg -o assets/fotos/torre-eiffel.webp`.
- Fondo claro o del color del producto: el mosaico pone su tono detrás mientras carga.

## Nombres

| archivo | producto |
|---|---|
| `caja-mini.webp` | Caja mini de chocolate relleno |
| `pincho-masmelos.webp` | Pincho de masmelos cubiertos de chocolate |
| `chocolatina-rellena.webp` | Chocolatina grande rellena |
| `vaso-fresas-avellana.webp` | Vaso de fresas con avellana |
| `vaso-mini-donas.webp` | Vaso de mini donas |
| `pincho-fuente.webp` | Pincho de masmelos en fuente |
| `torre-eiffel.webp` | Torre Eiffel de chocolate |
| `fresas-x4.webp` | Fresas bañadas en chocolate ×4 |
| `adiciones.webp` | Adiciones |
| `caja-corazon.webp` | Caja de corazón con letras |
| `caja-oso.webp` | Caja de oso |

La **caja de corazón** en su página muestra el corazón con las letras que la persona
escribe (no la foto): la foto sale en el menú, en regalos y en el cajón.

Fuera de esta carpeta quedan dibujos decorativos que no son la imagen de un producto
(la pegatina de la portada, el aviso «¿Es para regalar?», el cajón vacío): se cambian
en `index.html` si algún día se quiere.
