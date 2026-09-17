# Añadido al R139 · los periodos que no caben en `maxDias`

> **Llegó por el chat**, dentro del repaso de pendientes del 16 de septiembre de
> 2026. Se archiva por lo mismo que el R143 y el R119: una cita sin fuente
> archivada se lee como si la tuviera.

**De:** el responsable del sistema de diseño
**Fecha:** 2026-09-16

---

## Lo que dijo, literal

> Añadido al R139 — que RangoFecha no pinte los atajos que no caben en su propio
> `maxDias`. Hoy los pinta sin mirar, y por eso tuve que quitarlos yo.
>
> Ese último es el que más les conviene arreglar: cualquiera que use `maxDias` se
> va a encontrar con lo mismo.

---

## Por qué entra, y por qué no es «cosa de su proyecto»

Los cuatro periodos por omisión —«Este mes», «Mes pasado», «Últimos 2 meses»,
«Este año»— van de **un mes a un año**. Con `maxDias={7}`, los cuatro son
**imposibles**: el panel enseñaba cuatro botones que solo sabían dar un aviso.

**Le pasa a cualquiera que use `maxDias`**, que es lo que lo hace un defecto del
sistema y no de una pantalla. Y la prueba de que sobraban la dio él mismo al
tener que quitarlos a mano: si hay que quitarlos fuera, es que el componente no
los tenía que haber puesto.

## Atendido en la v1.123.0

Los que no caben **no se pintan**, y si no queda ninguno se va también el rótulo
«Periodos». Entra `atajosDeDias(1, 3, 7)`, exportada, para que cada producto con
tope no vuelva a escribir la misma aritmética de fechas.

Reglas **22** y **23** de «Rango de fechas» en `comportamiento.md`.
