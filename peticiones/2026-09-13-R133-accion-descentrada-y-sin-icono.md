# R133 · Dialogo: la acción sale descentrada y no admite icono

**De:** Control Administrativos V2.0 · **Fecha:** 2026-09-13
**Comprobado contra:** v1.108.0, midiendo el DOM · **Prioridad:** media
**Atendido en:** v1.110.0

## R133.1 · El texto de la acción no está centrado

El hueco de 14 px del girador se reservaba **solo antes** del texto. Medido en
«Grabar»: botón 125 px, hueco izquierdo 39, derecho 17. Al lado de «Cancelar»
—que no tiene gerundio y sí está centrado— el pie se ve torcido.

**Sus dos huecos reproducen exactos desde la hoja**: `.btn` lleva
`padding: 8px 16px` y `border: 1px`, así que 1+16+14+8 = **39** por la
izquierda y 1+16 = **17** por la derecha. Una corrección al reporte: eso deja
el rótulo **11 px** a la derecha del centro, no 22 — los 22 son la diferencia
entre los dos huecos, y el desvío es la mitad.

**Atendido con la primera de sus dos salidas**, el hueco simétrico. Medido en
navegador: **22,00 px** exactos de crecimiento y desvío **0** en reposo y
ocupado, en `principal`, `destructiva`, `terciaria` y `mini`.

**Y la razón que dimos para descartar la segunda salida era falsa.** Dijimos que
sacar el girador del flujo haría caer la rueda encima del gerundio. Una
auditoría lo midió y **no cae**: en un `.btn` normal la rueda acaba en 15,67 y el
texto empieza en 16,67 — cabe, con 1 px de holgura, y encima no cuesta 22 px. Lo
que sí decide, y es lo que habría que haber escrito: **ese 1 px es inaceptable**
al lado de los 8 que el sistema usa en todas partes, y en `mini` la rueda **sí**
solapa 3 px. La decisión se queda; la razón, corregida.

**Dos casos siguen torcidos y se dicen**: sin `textoOcupado` el rótulo sigue a
11 px del centro y el botón sigue creciendo 22; con `icono` + `textoOcupado` va
a 13 px en reposo y el botón **encoge 4,00**. Ojo a la combinación: `accion.icono`
—lo que pide R133.2— es justo el caso que el espejo no centra.

**Con `icono` no se añade espejo**, y tiene su prueba: un icono no es un hueco
vacío, ocupa su sitio porque significa algo, y duplicarlo descentraría al revés.

## R133.2 · `Dialogo.accion` no admite icono

**Atendido:** `accion.icono`.

**Y el botón de cerrar no lo admite, como decisión escrita.** Ese botón siempre
dice lo mismo —«Cancelar» o «Cerrar»— y lo que hace es **irse**: un icono ahí no
añade información y compite con el de la acción, que sí la tiene. Si algún día un
pie necesita dos botones con icono, será porque el segundo dejó de ser una
salida, y entonces el sitio es `children`.
