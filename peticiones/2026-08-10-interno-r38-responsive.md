# Requerimiento interno · R38

**De:** el responsable del sistema, tras la verificación responsive
**Fecha:** 2026-08-10 · **Versión evaluada:** v1.31.0
**Principio:** el responsive **es comportamiento del componente**. Una regla
`@media` en la hoja que viaja es una promesa: a ese ancho, el componente se
comporta así. Si apunta a clases que el React no emite, el producto se ve
igual en el teléfono que en el escritorio y nadie lo nota hasta montarlo.

**Medido** con `auditorias/herramientas/responsive-vs-entrega.mjs`: 18 bloques
`@media` en la hoja, 9 clases señaladas, 2 falsos positivos por plantilla
(`av`, `cf-banda` — emitidas, verificado), **7 reales en 4 frentes**.

---

> **R38a RESUELTO en v1.34.0**, por el camino que disuelve el problema: el riel
> de tableta pasó de CSS forzado a **estado**. Al cruzar ≤900 el marco se
> pliega de verdad (matchMedia + `onPlegar`), `MarcaMenu` conmuta el logo solo
> y el aria dice la verdad; el bloque `:not(.colapsado)` de 701–900 se retiró
> con lápida explicativa. La referencia se actualizó al mecanismo real — la
> opción que el propio R34 sancionó. Regla 4 del contrato del marco.

## R38a · El marco en tableta no conmuta la marca — el más visible

Entre **701 y 900px** la hoja promete: la barra lateral se estrecha a 56px,
los textos de navegación se ocultan, la identidad del pie se reduce al
círculo, y **la marca conmuta del lockup al escudo a 40px**
(`.lat-lockup{display:none}` / `.lat-escudo{display:block}`).

El React no emite `lat-lockup` ni `lat-escudo`: `MarcaMenu` usa su propia
familia (`lat-marca-caja`, una sola imagen conmutada por la prop `plegado`).
Consecuencia en tableta: la barra sí se estrecha (esas clases sí existen),
pero **el logo ancho queda estrujado en 56px** — se encoge hasta la
ilegibilidad, el caso exacto contra el que `MarcaMenu` existe. Y el estado no
es coherente: visualmente estrecha, `aria-expanded` del botón de plegar dice
desplegada.

**Se pide:** que `MarcaMenu` conmute a `logoCompacto` también en ese rango —
resolviéndolo junto con la **unificación de la doble familia de marcado**
(hallazgo de la auditoría de entrega completa): una sola anatomía de marca,
con las reglas responsive apuntando a lo que el React emite. Y que el estado
estrechado sea coherente con lo anunciado al lector de pantalla.

## R38b · El calendario a ≤620px colapsa un cuerpo que no existe

`.fc-cal-cuerpo` pasa a una columna bajo 620px — pero es el envoltorio de los
**dos meses** que el React no entrega. Es la misma pieza de la **convergencia
de RangoFecha** ya abierta: al decidirla, esta regla responsive debe quedar
apuntando a marcado real o retirarse con la función.

## R38c · El apilado del campo a ≤700px aplica a la familia equivocada

`.cg` se apila bajo 700px — la familia que el `Campo` de React **no usa**
(usa `campo-*`). Un formulario React no gana el apilado prometido. Es la
**doble anatomía del campo** ya diagnosticada; la unificación debe dejar UNA
familia con las reglas responsive encima.

## R38d · `top-filtros`: comportamiento responsive de una ranura que no existe

La hoja promete que la zona de filtros del marco **se muda** al panel bajo
700px, y `MarcoApp` no tiene ranura de filtros. Decisión pendiente del
responsable: o la ranura entra al componente (como entró `acciones` a la
tabla en R32), o `top-filtros` se declara composición del catálogo y sus
reglas dejan de viajar.

---

## Criterio de terminado

- `responsive-vs-entrega.mjs` sale **a cero** (con las exenciones que se
  declaren por escrito, si alguna pieza se decide como solo-del-catálogo).
- Cada frente cerrado sube versión con su prueba, como todo.
- El candado de la cascada — que hoy vigila solo a MarcoApp a once anchos —
  queda como candidato a ampliarse por componente cuando el catálogo consuma
  el render real (fase 3).

## Nota de método (ampliada con R39)

**El sexto ojo que faltaba, señalado por Control Administrativos en R39:**
`responsive-vs-entrega.mjs` compara **clases**, no cajas. Un selector presente
en la hoja con **cero reglas de caja** (el velo: solo `display:none` en un
modo) se le escapa — la clase «existe» y el elemento mide 0×0. La detección
completa exige medir cajas montadas en navegador real: fase 3.



Los falsos positivos de la herramienta (`av`, `cf-banda`) vienen de clases en
plantilla (`` `av av-${tono}` ``): el literal no cierra antes del `${` y el
escáner no lo ve. Declarado en la propia herramienta — el mismo límite,
honesto, que sus dos hermanas de `auditorias/herramientas/`.
