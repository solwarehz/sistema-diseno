# R118 · `Dialogo.accion` no puede decir el gerundio

**De:** Control Administrativos V2.0 — módulo de Marcaciones
**Fecha:** 2026-09-09 · **Comprobado contra:** v1.96.0, leyendo el paquete instalado
**Prioridad:** alta · **Bloquea:** Corregir marcaciones (dos diálogos), Generar memorándum
**Recibido por el chat el 2026-09-11 y guardado aquí.**

`Dialogo.tsx:150-153` pasa `onClick={accion.onClick}` a `Boton` **sin `textoOcupado`**. El
doble envío sí está protegido —`Boton` espera la promesa— pero el botón **enmudece**: no
dice «Grabando…», solo se apaga.

La regla de producto del remitente no admite excepciones: toda acción contra el servidor
muestra gerundio, queda deshabilitada y no se dispara dos veces. `Boton` ya resolvió el
problema de fondo —`textoOcupado` reserva el ancho del texto más largo y el botón no
baila—; solo faltaba exponerlo en `accion`.

**Entregado en v1.107.0.** `accion.textoOcupado?: React.ReactNode`. Sin la prop, nada
cambia de lo que ya estaba.
