# R131 · RangoFecha: el calendario no se puede cerrar

**De:** Control Administrativos V2.0 · **Fecha:** 2026-09-13
**Comprobado contra:** v1.108.0, con ratón y teclado reales
**Prioridad:** alta · **Atendido en:** v1.109.0

Con el calendario abierto, **no hay forma de cerrarlo sin cambiar el rango**.
Probado una a una:

| Acción | Resultado |
|---|---|
| Clic fuera del calendario | sigue abierto |
| Escape | sigue abierto |
| Pulsar el disparador otra vez | sigue abierto |
| Pulsar un botón de la página (Buscar) | sigue abierto |
| Elegir un rango completo | cierra |

El caso real: se consulta un rango, se abre el calendario para mirar otro, se
cambia de idea, y ya no se puede volver. El calendario queda flotando sobre la
tabla —626 px de ancho— **tapando las primeras filas de los resultados**.

## Por qué pasa

`cerrar()` existe y funciona. Lo que falta es **quién lo llame**: no hay
escucha de clic fuera; `onKeyDown` cuelga de la rejilla, así que Escape solo
dispara con el foco dentro —y al pulsar fuera el foco cae a `<body>`—; y el
disparador no es un interruptor.

## Atendido

Un efecto que, mientras está abierto, escucha `pointerdown` y `keydown` en
`document`. Sus tres advertencias se siguieron al pie y se probaron:

- **`pointerdown` y no `click`.** Con `click`, el cierre llega después de que el
  navegador decida el foco.
- **El clic fuera no devuelve el foco**; Escape sí. Medir esto costó una
  segunda vuelta: con un clic entero la aserción no distinguía, porque el
  navegador enfoca el destino igualmente. Se mide sobre el `pointerdown` solo.
- **Cerrar no descarta nada.** Tiene su prueba.

Y una cuarta que no venía: el Escape **se detiene ahí**, así que dentro de un
`Dialogo` la primera cierra el calendario y no el diálogo.
