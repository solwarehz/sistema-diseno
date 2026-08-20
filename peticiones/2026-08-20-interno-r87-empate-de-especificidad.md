# R87 · interno — el filtro de columna, o cuando el ORDEN decide

**Fecha:** 20 de agosto de 2026 · **Cerrado en:** v1.62.0
**Origen:** no lo reportó nadie. Salió de **verificar** R86.

---

## Cómo apareció

Al cerrar R86 se pidió comprobar que la entrega se ve igual que la promesa. Los
candados del repo salían verdes, así que se montó una comprobación
**independiente**: el mismo marcado en dos iframes —izquierda la hoja del
catálogo, derecha `tokens.css` + `componentes.css`—, igualando el contexto de
montaje, comparando con el motor del navegador.

**37 elementos · 24.642 propiedades · 27 idénticos · 10 distintos.**

Los 10 eran el filtro de columna y lo que arrastra por altura:

| | catálogo | entrega |
|---|---|---|
| `font-size` | 13px | **12px** |
| `padding` vertical | 8px | **4px** |
| Alto del control | 36,18 px | **26,73 px** |
| Alto de la fila de filtros | 44,84 px | **35,40 px** |
| Flecha del `select` | 16px · a 12px del borde | **13px · a 7px** |

---

## La causa: no falta ni sobra ninguna regla

```
.tb-f  { font-size: 12px }     una clase → (0,1,0)
.campo { font-size: 13px }     una clase → (0,1,0)
```

Empatan, así que **gana la última**. Y el extractor agrupa por elemento —Campo
de texto, Tabla de datos…—, así que al reagrupar invierte el orden relativo:

- **catálogo:** `.tb-f` (97.600) → `.campo` (142.381) → gana `.campo` · **13px**
- **entrega:** `.campo` (8.752) → `.tb-f` (46.055) → gana `.tb-f` · **12px**

Preexistente: idéntico en la v1.60.0, comprobado con `git show`.

---

## Por qué no lo veía ningún candado

| Candado | Por qué no |
|---|---|
| **Promesa** | Compara elementos de una lista escrita a mano. `input.campo.tb-f` no estaba en ella, y lo que no está en la lista no se compara |
| **Cascada** | Resuelve la hoja que viaja **contra sí misma**: mira que lo emitido reciba lo que debe, no que las dos hojas coincidan |
| **Elemento** | Compara **qué etiqueta** emite cada lado, no qué valor gana |

---

## Por qué no se eligió entre 12 y 13

Porque la pregunta estaba mal planteada. Le preguntamos al navegador qué reglas
tocan ese control **en el catálogo**, y las tres de `.tb-f` **pierden allí**:
`font-size`, `padding` y la flecha del select **no se han visto nunca** en la
página que enseña el componente. Eran **declaraciones muertas** que la entrega
resucitaba por accidente de orden.

Y el tercer dato lo cerró: se midieron los **tres** sitios donde vive el filtro.

| | font-size | alto | flecha |
|---|---|---|---|
| Catálogo (promesa) | 13px | 36,18 px | 16px |
| Hoja-sola (copian el marcado) | **12px** | **26,73 px** | **13px** |
| Producto (usan `TablaDatos`) | 13px | 36,18 px | 16px |

`TablaDatos` monta `<Campo>`, que emite `.campo` **sin `.tb-f`** — así que el
producto ya veía la promesa. El único que veía otra cosa es quien copia el
marcado con la hoja entregada.

**Arreglo:** borrar lo muerto. `.tb-f{ width: 100% }` y `select.tb-f` fuera.
Sin empate, el orden no decide nada. Darle más especificidad a la que pierde
habría congelado en la hoja un valor que el catálogo no enseña.

---

## El candado del empate

`sistema/candado/verificar-empate.mjs` — el duodécimo.

> Ningún par de reglas que empate en especificidad puede cambiar de ganador
> entre las dos hojas.

**La mitad que lo hace útil es el filtro.** Solo mira las **292 combinaciones de
clases que existen de verdad** en el marcado —el del catálogo y el que emiten
los componentes—. Sin él salen **25.823** pares teóricos (`.sr-solo` contra
`.nav-grupo` y demás parejas que no coinciden jamás), y una lista de 25.823
avisos no se lee: se ignora, y el candado deja de proteger aunque siga verde.

Quedan **53 empates reales**; ninguno cambia de ganador. Se vio **en rojo con
los 5 de verdad** antes de verlo en verde.

**No se tocó el extractor**, que era el arreglo de raíz, porque se midió antes:
los 6 empates que fallaban eran todos este mismo elemento. Reordenar su salida
habría movido la hoja entera para arreglar un control.

---

## Lo que queda abierto, declarado

**El troceador parte mal los `;` que van dentro de comillas.** Los seis
`background-image: url("data:image/svg+xml;utf8,…")` del sistema salen partidos
en un `background-image` truncado y una propiedad llamada `utf8,<svg
xmlns='http`. El candado del empate los descarta por nombre imposible y lo dice
en sus límites.

**El defecto es de `parsear`, y lo comparten los candados de la cascada y de la
promesa.** No dan falso rojo —el corte es igual en las dos hojas— pero dejan un
**punto ciego en el icono del select y en el del calendario**, que es justo
donde hubo un defecto en la v1.28.0. Arreglarlo es no cortar por `;` dentro de
comillas; el riesgo es que toca el motor de tres candados. **Pendiente, con su
daño escrito.**

**Y aparte:** el catálogo pinta el filtro como `<input class="campo tb-f">`
desnudo y el componente monta `<Campo>` entero (`.campo-grupo` + etiqueta
oculta). Aquí **el componente tiene razón** —un control sin etiqueta accesible
no vale—, así que lo que hay que corregir es el catálogo. Medido: el ancho no se
resiente, el flex de `.campo-grupo` lo estira igual (100% en los tres casos).
