# R125 · «Por revisar»: tres cosas que la maqueta da por hechas y no lo están

**De:** Control Administrativos V2.0 · **Fecha:** 2026-09-10
**Comprobado contra:** el backend a 2026-09-10 y `maquetas/marcaciones/por-revisar.html`
**Recibido por el chat el 2026-09-11 y guardado aquí.**

Ninguna bloquea: en las tres se tomó una decisión por defecto para no dejar la pantalla
parada, y las tres se cambian con una línea. Hace falta **confirmarlas o corregirlas**.

## R125.1 · El privilegio de «ver el documento completo» — media

La maqueta nombra `documentoSegunPermiso`. Existe, pero sin privilegio devuelve el
documento **vacío**, no `1234••••`. Y lo gobierna `personal.sensibles.leer`, el mismo del
padrón y del tablero: no hay ninguno específico de marcaciones.

Vaciarlo no vale aquí: esta pantalla existe para las marcaciones cuyo documento **no
corresponde a nadie**, así que la columna Trabajador sale vacía y el documento es lo único
que queda para saber a quién buscar. Vaciarlo deja filas mudas.

**Decidido por defecto:** enmascarado a cuatro dígitos **en el servidor** —antes la
respuesta llevaba los 888 documentos enteros y el navegador los pintaba con puntos, que no
protege nada—, gobernado por `personal.sensibles.leer`.
**A confirmar:** que ése es el privilegio correcto y no uno nuevo para esta pantalla.

## R125.2 · «ID reloj» — baja

La maqueta pinta 16, 15, 14, 99. El agente manda `CodEquipo` (1, 2, 3), que es otro número
del mismo aparato. En el colegio se refieren a él por el **EquipoID**.

**Decidido por defecto:** se enseña el EquipoID y, cuando no está medido para esa
instalación, se cae al código que sí existe. Un hueco no ayudaría a encontrar el reloj.
**A confirmar:** que el número de la maqueta es el EquipoID, y si la caída es aceptable o
se prefiere una marca visual de «sin medir».

## R125.3 · «Sin contrato vigente» ya se produce — media

Estaba en la maqueta y el sistema no podía generarlo: la derivación no consultaba Contrato
ni una vez. Implementado. Sobre datos reales salen **29 marcaciones de tres personas**
(TREJO ALVARADO, AGUILAR EMILIANO, LARA ABAN) cuyo contrato terminó el 31/08 y siguieron
marcando en septiembre. **Antes entraban al motor como buenas.**

**A decidir:** qué se espera que haga RRHH con esa fila. Hoy es informativa. La lista de
acciones de la maqueta no contempla «registrar la renovación», que es probablemente lo que
hace falta — y es una acción de otro módulo. Cambia qué botones lleva la fila.

## Menor

La maqueta pinta `08/09/2026` y el servidor devuelve `2026-09-08`. Si el formateo es del
frontend no hay nada que pedir; si se esperaba del servidor, decidlo.
