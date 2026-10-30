# SPEC 02 — MEMORY.md: memoria de sesión del repositorio

> **Estado:** Borrador
> **Depende de:** ninguna (SPEC 01 no interviene)
> **Fecha:** 2026-10-30
> **Objetivo:** Crear `MEMORY.md` en la raíz, con un máximo de 50 líneas, para retomar el estado útil del proyecto. `CLAUDE.md` ordena leerlo al abrir sesión y actualizarlo solo cuando cambie información importante para continuar el trabajo.

## Por qué existe esta spec

`memoria/01-estado.md` tiene 3.376 líneas y `memoria/04-pendientes.md` 313. Son útiles como registro detallado, pero demasiado extensos para retomar una sesión rápidamente. Se necesita una memoria breve que sirva de primer punto de orientación, sin reemplazar ni modificar los registros existentes.

Hechos verificados el 2026-10-30:

- `MEMORY.md` no existe en la raíz del repositorio ni está en `.gitignore`.
- `sistema/tokens/generar.mjs` comprueba que `memoria/01-estado.md` contenga la versión `MMI-DS **vX**` y la compara con `package.json` y `CLAUDE.md`. Por eso esta spec no mueve ni vacía `memoria/`.
- `CLAUDE.md` ordena leer `memoria/` al abrir una sesión y también contiene referencias a archivos concretos de esa carpeta.
- El `MEMORY.md` versionado aquí es distinto de la memoria personal que Claude Code mantiene fuera del repositorio. Esta spec no modifica la memoria personal.
- `CLAUDE.md` se carga al iniciar Claude Code. La regla de esta spec debe indicar explícitamente que, después de cargarlo, también se lea el `MEMORY.md` del repositorio.

## Alcance

**Dentro:**

- Crear `MEMORY.md` en la raíz, versionado y limitado a **50 líneas físicas**.
- Incluir estado actual, trabajo en curso, siguiente paso o bloqueo, pendientes prioritarios, precauciones reutilizables y enlaces al detalle.
- Establecer en `CLAUDE.md` que se lea `MEMORY.md` al abrir cada sesión.
- Establecer que se actualice cuando cambie información importante para retomar o dirigir el trabajo, según los disparadores de esta spec.
- Mantener intactos `memoria/` y las fuentes detalladas del proyecto.

**Fuera de alcance:**

- Mover, borrar, recortar o reescribir `memoria/` o cambiar `generar.mjs`.
- Implementar un hook, un candado o una herramienta automática para comprobar el límite y los disparadores; eso se define en SPEC 03.
- Modificar las skills `/spec` o `/spec-impl`.
- Sustituir o modificar la memoria personal de Claude Code.

## Cuándo se actualiza

Actualizar `MEMORY.md` **después de verificar un cambio importante**, tan pronto como afecte la información necesaria para continuar el trabajo. Si el cambio ocurre durante una tarea aún abierta, registrar el nuevo estado antes de entregar, pausar o transferir esa tarea.

Se consideran importantes estos cambios:

1. Cambia el estado de un trabajo activo: se crea, aprueba, implementa, bloquea, retoma o completa una spec o entrega.
2. Cambia el siguiente paso concreto, aparece un bloqueo relevante o se resuelve uno existente.
3. Se toma o modifica una decisión técnica u operativa que afectará trabajo futuro.
4. Cambia la versión, la rama activa de trabajo o el estado de publicación que otra sesión necesitaría conocer para continuar con seguridad.
5. Se descubre o corrige un error con una regla preventiva reutilizable en este repositorio.
6. Al reabrir una sesión, se confirma que la memoria contradice una fuente vigente o está desactualizada de forma que pueda desviar el trabajo.

No se actualiza solo por iniciar o cerrar una sesión, iniciar o terminar `/spec` o `/spec-impl`, leer archivos, hacer una consulta de solo lectura, repetir una prueba que no cambió el estado ni aplicar formato sin efecto en el trabajo. Una prueba sí es motivo de actualización si cambia el estado, descubre un bloqueo o modifica el siguiente paso.

Si no ocurrió ninguno de los cambios importantes anteriores, `MEMORY.md` permanece intacto. No es una bitácora de cada comando ni una lista de actividad diaria.

## Modelo de contenido

`MEMORY.md` es una nota de traspaso breve. Su estructura recomendada es:

```markdown
# MEMORY — Sistema de diseño AE
Actualizado: AAAA-MM-DD · versión vX · rama <nombre>
## Estado y trabajo en curso
(qué está activo, en qué estado verificado y cuál es el siguiente paso)
## Pendientes prioritarios
(hasta 10 líneas; enlaces al detalle en memoria/04-pendientes.md)
## Precauciones reutilizables
(hasta 10 líneas; solo errores verificados y reglas preventivas duraderas)
## Fuentes de detalle
(memoria/00-INDICE.md, memoria/01-estado.md, specs/, CLAUDE.md)
```

Convenciones:

- Una idea por línea; sin tablas ni bloques extensos.
- La fecha, versión y rama se obtienen con herramientas, no se deducen de memoria.
- Actualizar la fecha solo cuando cambie el contenido de forma importante.
- Registrar hechos verificados y el siguiente paso accionable; enlazar la fuente cuando exista.
- No copiar historial extenso, resultados rutinarios ni errores pasajeros. Conservar una precaución solo si ayuda a evitar que otro trabajo repita un daño relevante.
- Mantener como máximo 10 líneas de pendientes y 10 de precauciones.
- Tras cada actualización, comprobar con `wc -l MEMORY.md` que no supere 50 líneas y que termine con salto de línea. Si excede el límite, resumir o quitar información obsoleta; el límite no se amplía.
- El detalle histórico o un pendiente que ya no sea prioritario permanece en su documento fuente, no se traslada automáticamente a la memoria corta.

## Autoridad y coherencia

`MEMORY.md` es un resumen de navegación, nunca reemplaza una fuente de verdad. Las reglas operativas se consultan en `CLAUDE.md`; el estado completo y las decisiones del sistema, en `memoria/01-estado.md` y `memoria/02-decisiones.md`; y el inventario de pendientes, en `memoria/04-pendientes.md`. Para una spec activa, manda su propio texto vigente.

Si la memoria corta contradice la fuente correspondiente, verificar la fuente, corregir `MEMORY.md` y no ejecutar acciones basadas únicamente en el resumen. La autoridad se determina por el tema; `memoria/01-estado.md` no reemplaza las reglas operativas ni el contenido de una spec.

## Plan de implementación

1. Trabajar en la rama autorizada existente; no crear ni cambiar a otra rama para esta tarea.
2. Crear `MEMORY.md` con información vigente comprobada desde el repositorio y la rama de trabajo. Medir el archivo con `wc -l`.
3. Incluir solo precauciones reutilizables verificadas en el repositorio. No convertir incidentes pasajeros o desacuerdos no resueltos en reglas.
4. En `CLAUDE.md`, reemplazar la orden inicial de leer `memoria/` entera por la lectura de `MEMORY.md`, y enlazar `memoria/` como consulta. Añadir en el flujo de inicio la lectura de `MEMORY.md` después de actualizar el repositorio y antes de trabajar.
5. Añadir a `CLAUDE.md` los disparadores de actualización, los casos que no requieren actualización y la comprobación de las 50 líneas. No exigir cambios por el mero inicio o cierre de `/spec` o `/spec-impl`.
6. Ejecutar `node sistema/tokens/generar.mjs` y `node sistema/candado/verificar-contraste.mjs`. No modificar la versión del sistema ni `memoria/01-estado.md` por esta documentación, y confirmar que los generadores siguen validando el cruce de versión.
7. Revisar el diff y confirmar que el commit de esta tarea solo incluya los archivos autorizados, sin secretos. Crear un commit atómico y hacer push a la misma rama autorizada existente; no crear ni cambiar de rama ni actualizar `main`.

## Criterios de aceptación

- [ ] `MEMORY.md` existe en la raíz, está versionado y tiene 50 líneas físicas o menos según `wc -l`.
- [ ] El archivo incluye estado/trabajo en curso, siguiente paso o bloqueo, pendientes prioritarios, precauciones reutilizables y enlaces a las fuentes.
- [ ] Las secciones de pendientes y precauciones tienen como máximo 10 líneas cada una.
- [ ] La fecha, versión y rama coinciden con los valores que entregan las herramientas en la rama activa.
- [ ] `CLAUDE.md` manda leer `MEMORY.md` al abrir sesión, después de actualizar el repositorio y antes de realizar trabajo.
- [ ] `CLAUDE.md` manda actualizar la memoria cuando se confirma uno de los cambios importantes de esta spec, y no solo por iniciar o cerrar una sesión, `/spec` o `/spec-impl`.
- [ ] Una prueba positiva confirma que un cambio de estado —por ejemplo, aprobar una spec o resolver un bloqueo— actualiza el resumen y el siguiente paso.
- [ ] Una prueba negativa confirma que una consulta de solo lectura o una prueba rutinaria sin cambio relevante deja `MEMORY.md` intacto.
- [ ] La regla ordena actualizar la memoria antes de pausar o entregar una tarea si el trabajo produjo un cambio importante.
- [ ] Ante una discrepancia, la regla exige comprobar la fuente correspondiente y corregir el resumen; no atribuye autoridad universal a `memoria/01-estado.md`.
- [ ] `CLAUDE.md` conserva los enlaces a `memoria/` como fuentes de detalle, sin mandar leerla completa en cada inicio de sesión.
- [ ] `node sistema/tokens/generar.mjs` y `node sistema/candado/verificar-contraste.mjs` terminan sin fallos.
- [ ] El diff y el commit no incluyen cambios no autorizados, `.env`, claves ni credenciales.

## Decisiones tomadas y descartadas

- **Sí:** `MEMORY.md` en la raíz y versionado, para que viaje con el repositorio y sirva de orientación compartida.
- **Sí:** la memoria breve resume y enlaza; `memoria/` permanece intacta como fuente histórica y de detalle.
- **Sí:** la lectura ocurre al abrir sesión; la escritura ocurre solo si cambió información importante para continuar.
- **No:** actualizar al inicio o al final de cada `/spec` o `/spec-impl` por rutina. La actualización depende del cambio real de estado, no del nombre del procedimiento.
- **No:** registrar cada comando, consulta, ejecución rutinaria o incidente pasajero.
- **No:** crear en esta spec el hook o la herramienta que verifique automáticamente el límite y la actualización; su diseño queda para SPEC 03.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| «Importante» puede interpretarse de forma distinta | La lista de disparadores y los ejemplos positivos/negativos de esta spec delimitan cuándo actualizar |
| Claude no actualiza la memoria después de un cambio relevante | `CLAUDE.md` debe exigir actualizar antes de pausar o entregar; la detección automática se define por separado en SPEC 03 |
| La memoria se vuelve una bitácora y supera 50 líneas | Mantener solo estado vigente, limitar pendientes y precauciones, podar lo obsoleto y medir las líneas tras cada actualización |
| La memoria contradice una fuente vigente | Corregirla tras verificar la fuente correspondiente y definir autoridad por tema |
| Los campos fecha, versión o rama quedan desactualizados | Obtenerlos con herramientas cuando se actualice la memoria; una nueva versión o cambio de rama es un disparador importante |

## Lo que **no** está en esta spec

- Mover, borrar o recortar `memoria/`.
- Cambiar `generar.mjs` o cualquier candado, incluido uno para el límite de 50 líneas.
- Modificar las skills `/spec` y `/spec-impl` o añadir hooks.
- Tocar el `MEMORY.md` del agente en `~/.claude`.
