# R161 · La cadena de alto se rompe cuando el padre no es flex

**De:** Control Administrativos V2.0 · **Fecha:** 2026-09-23
**Comprobado contra:** `sistema-diseno-ae` **v1.145.0** instalada, en producción.

---

## La regla exacta y la cadena rota

`tbl-lleno` y `tbl-crece` declaran `flex: 1 1 auto`, y **eso no hace nada si el
padre no es un contenedor flex**. Cuando la cadena se rompe, la caja mide su
propio contenido y `useCapacidadTablero` entra en un **lazo circular**:

> capacidad de una fila → se pinta una fila → el contenido sigue midiendo una
> fila → la capacidad sigue siendo una.

Es estable, es silencioso, y en pantalla es un tablero de **una sola fila** con
el resto en blanco.

## La prueba

Forzando `display: flex; flex-direction: column` en el `.sup`:

| | Caja medida | Capacidad |
|---|---|---|
| Como está | **100 px** | 7 × **1** |
| Con el padre en flex column | **220,7 px** | 7 × **2** |

Con eso su auditoría sabe dónde mirar, en vez de volver a medir síntomas.

---

## Y algo que les va a servir más que el arreglo

**Su auditoría no puede encontrar esto midiendo el catálogo**, porque el defecto
sólo aparece cuando el padre del `.tbl-crece` **no** es flex — y eso depende de
dónde lo monte cada producto.

Es el mismo agujero de siempre con otra cara: **la pieza se valida en el único
sitio donde funciona.**

---

## Lo que hacemos mientras tanto

Aplicamos **la línea provisional, marcada y con fecha**, como hicimos con la
rejilla densa —que se borró entera el día que la publicaron—. No vamos a dejar
producción con el tablero de una fila esperando cuatro versiones más.
