# R127 · «Por revisar»: los avisos de la maqueta llevan acciones que no existen

**De:** Control Administrativos V2.0 · **Fecha:** 2026-09-10
**Prioridad:** media · No bloquea; hoy los avisos van sin acción
**Recibido por el chat el 2026-09-11 y guardado aquí.**

La maqueta pinta dos franjas con una acción cada una:

1. **«Descargar lista»** — «se corrigen en el enrolamiento del reloj. Descarga la lista y
   entrégala a sistemas del colegio.»
2. **«Ir a Relojes»** — para el reloj sin vincular a ninguna sede.

**La 1 es una contradicción** y por eso el texto se cambió: no hay ruta CSV detrás de esta
pantalla, así que la maqueta daba una instrucción que ella misma imposibilita. Hoy el aviso
dice lo que sí se puede hacer y no promete una descarga.

**A decidir:** si se construye la descarga. El remitente la construiría, con datos: de las
152 marcaciones con documento imposible, **138 son de dos personas** a las que les sobra un
dígito —`724552996 → 72455296` (LEÓN TUYA, Mayori Elizabeth) y `744935888 → 74493588`
(MANRIQUE PARIAMACHI, Tony)—. Una lista con esas dos correcciones es lo que sistemas
necesita, y **recupera el 91 %** de esas marcaciones.

> **Las cifras se quedaron cortas.** Están medidas al 04/09; el 11/09 ya eran 89 y 69, y el
> total **172**. El argumento no cambia, se refuerza: siguen llegando porque el enrolamiento
> del reloj aún no se ha corregido.

**La 2** es un enlace a `/marcaciones/relojes`, que ya existe.

## Lo único de esto que es del sistema de diseño

La maqueta pide estas franjas como **`Aviso`**; se implementaron como **`Nota`** porque
`Aviso` flota y se desvanece a los cinco segundos, y esto no es el resultado de una
operación: es cómo está el sistema mientras esas marcaciones sigan retenidas.

**La pieza correcta es `Mensaje`**, y su propia cabecera lo dice:

> `Aviso` flota, tiene tono y SE VA solo · `Nota` está en flujo y se queda, pero es NEUTRA ·
> `Mensaje` está en flujo, se queda, y TIENE tono. **Es el hueco que faltaba.**

Se creó en R83 a petición de este mismo equipo, que midió seis mensajes dibujados a mano en
tres pantallas.

**Lo que `Mensaje` no tiene es `accion`.** Hoy la acción se compone dentro con `children`
—un `Enlace` o un `Boton`—, que es lo que la política de creación prefiere. Si se quiere
que el sitio de la acción sea siempre el mismo, hace falta la prop, y eso es una decisión:
añadirla obliga a decidir cuántas acciones caben y dónde, para las tres superficies.
