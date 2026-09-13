# R129 · RangoFecha: el calendario se encoge hasta que las cifras se tocan

**Para:** equipo del sistema de diseño
**De:** Control Administrativos V2.0 — módulo de Marcaciones
**Fecha:** 2026-09-13
**Comprobado contra:** `sistema-diseno-ae` v1.107.0, midiendo el DOM en `/marcaciones/por-revisar`
**Prioridad:** alta. Es la pantalla de trabajo diario de RRHH.

---

## R129.1 · `.fc-d` no tiene ancho mínimo, y la rejilla colapsa

`.fc-d` declara `height: 30px; width: 100%`. Dentro de una rejilla, `width:
100%` **no aporta ancho intrínseco**: las siete columnas se dimensionan por el
contenido, y el contenido es un número.

**Medido:** `grid-template-columns` resuelve a `16.1625px 16.175px × 6`. Los días
de dos cifras se tocan —`14 15 16 17 18 19 20` se lee `141516171819 20`— y
ninguna columna cuadra con su cabecera `L M X J V S D`.

**Arreglo, una línea:** `.fc-d { min-width: 30px; }`. Las columnas pasan a 30 px,
que es exactamente la altura que ustedes ya les dan: la celda cuadrada que el
componente siempre quiso ser. Comprobado en vivo.

## R129.2 · `max-width: 560px` es menor que lo que el contenido pide

Con R129.1 resuelto, el contenido natural mide **626 px**: 472 los dos meses
(`.fc-cal-cuerpo`) + 152 la barra de atajos (`.fc-atajos`, que ya declara
`min-width: 152px`) + bordes.

`.fc-cal` topa en 560 px y tiene `overflow: hidden`. Resultado: la columna del
domingo del segundo mes queda cortada y **`.fc-atajos` desaparece entera**. Los
cuatro atajos —«Este mes», «Mes pasado», «Últimos 2 meses», «Este año»— dejan de
existir para el usuario, **sin ningún aviso**.

**Arreglo:** subir el tope a 640 px, o quitar el `overflow: hidden` que lo oculta
en silencio.

## R129.3 · La reserva responsive mira la ventana, no el calendario

`@media (max-width: 620px)` apila los meses y pone la barra abajo — la solución
correcta para poco espacio. Pero mide el ancho de **la ventana**.

El calendario es `position: absolute` dentro de `.fc-zona`, así que su ancho lo
marca el **disparador**, no la ventana. En nuestro caso: ventana de **918 px**,
calendario de **432**. La reserva nunca entra, justo cuando hace falta.

**Sugerencia:** `@container` sobre el propio calendario, o un `min-width` en
`.fc-cal` que fuerce el ancho que el contenido necesita.

## Por qué no lo ven en su catálogo

Ahí el disparador ocupa el ancho de la página. Nosotros ponemos `RangoFecha`
junto a un botón «Buscar» en una fila de **606 px**, y de ahí sale un `.fc-zona`
de **449** y un calendario de **432**. El componente **no tiene suelo**: se
encoge tanto como le deje su contenedor, y a partir de cierto punto deja de ser
legible sin que nada falle.

Mientras tanto llevamos `min-width: 30px` y `max-width: 640px` en nuestra hoja,
marcadas para retirarse con la versión que traiga esto.
