# SPEC 02 — MEMORY.md: memoria de sesión del repositorio

> **Estado:** Borrador
> **Depende de:** ninguna (SPEC 01 existe, pero no interviene)
> **Fecha:** 2026-10-30
> **Objetivo:** Crear `MEMORY.md` en la raíz (máximo 50 líneas) con en qué estamos, qué queda pendiente y los errores a evitar, y fijar en `CLAUDE.md` que se lee al abrir sesión y se actualiza al iniciar y al terminar `/spec` y `/spec-impl`.

## Por qué existe esta spec

`memoria/01-estado.md` tiene 3.376 líneas y `memoria/04-pendientes.md` 313: sirven para el detalle, no para retomar una sesión en un minuto. Se pide una memoria corta que sustituya a `memoria/` **en el papel de lo primero que se lee**, sin tocar sus archivos.

Hechos verificados el 2026-10-30:

- `MEMORY.md` no existe en la raíz del repo y no está en `.gitignore`.
- `sistema/tokens/generar.mjs:222` exige que `memoria/01-estado.md` contenga `MMI-DS **vX**` y lo cruza con `package.json` y `CLAUDE.md` (paso 1 de los 25). Por eso `memoria/` no se mueve ni se vacía.
- `CLAUDE.md` tiene 4 referencias a `memoria/`, entre ellas la orden «Y después lee `memoria/`» de la sección 1.
- Hay un `MEMORY.md` del agente en `~/.claude/projects/...`: es **otro archivo**, no se clona y no se toca.
- `.claude/skills/spec-impl/SKILL.md` no menciona `CLAUDE.md`, así que la regla no puede depender de que esa skill lo lea; `CLAUDE.md` se carga solo al abrir sesión.

## Alcance

**Dentro:**

- Archivo nuevo `MEMORY.md` en la raíz, de **50 líneas como máximo**, con cinco bloques: estado actual, en qué estamos, pendientes, errores a evitar (máx. 10 líneas) y enlaces a `memoria/`.
- Regla nueva en `CLAUDE.md`: leer `MEMORY.md` al abrir sesión, y actualizarlo al iniciar y al finalizar cada `/spec` y `/spec-impl`.
- En `CLAUDE.md` sección 1, la orden «Y después lee `memoria/`» pasa a «Lee `MEMORY.md`; `memoria/` es el archivo de consulta por enlace».
- Sembrar «errores a evitar» con los de esta sesión, cada uno verificado en el repo.

**Fuera de alcance (para otras specs):**

- Mover, borrar, recortar o reescribir `memoria/` y cambiar `generar.mjs`.
- Editar `.claude/skills/spec` o `.claude/skills/spec-impl`, y cualquier hook en `settings`.
- Un candado nuevo (paso 26) que valide el límite de 50 líneas.
- Sustituir el `MEMORY.md` del agente en `~/.claude`.

## Modelo de datos

Esta spec no introduce estructuras de datos. Es un archivo de texto con esta forma:

```markdown
# MEMORY — Sistema de diseño AE
Última actualización: AAAA-MM-DD · v1.148.2 · rama <nombre>

## En qué estamos
(3-8 líneas: spec activa, rama, qué sigue)

## Pendiente
(máx. 10 líneas, una por pendiente, con enlace a memoria/04-pendientes.md)

## Errores a evitar
(máx. 10 líneas: qué pasó → regla)

## Detalle
(enlaces: memoria/00-INDICE.md, specs/, CLAUDE.md)
```

Convenciones:

- Una idea por línea; sin tablas ni bloques de código largos.
- La fecha y la versión se leen con una herramienta (`date`, `package.json`), no se escriben de memoria.
- Al superar 50 líneas se poda lo más viejo hacia `memoria/`; no se amplía el límite.

## Plan de implementación

1. Crear la rama `feat/*` (CLAUDE.md §8) **antes** de editar.
2. Crear `MEMORY.md` con las cinco secciones y contenido real: versión de `package.json`, rama y spec activa leídas con herramienta. Comprobar con `wc -l MEMORY.md`.
3. Sembrar «errores a evitar» con los verificados en esta sesión: citar una sección que no está en el `CLAUDE.md` del repo (la §19.1 es del manual general del VPS); dar por listo Docker con el volumen `node_modules` vacío; crear una rama `docs/...` donde el repo manda `feat/*`.
4. En `CLAUDE.md`, añadir una sección corta «Memoria de sesión» con la regla de leer y actualizar, y cambiar la orden de la sección 1. No tocar la línea `MMI-DS **vX**` ni el número de estado.
5. Correr `node sistema/tokens/generar.mjs` y `node sistema/candado/verificar-contraste.mjs`: siguen en verde, porque `CLAUDE.md` y `memoria/01-estado.md` mantienen la versión.
6. Commit y push de la rama.

## Criterios de aceptación

- [ ] `MEMORY.md` existe en la raíz y `wc -l MEMORY.md` da 50 o menos.
- [ ] `MEMORY.md` tiene los bloques «En qué estamos», «Pendiente», «Errores a evitar» y «Detalle».
- [ ] «Errores a evitar» tiene como máximo 10 líneas y cada una nombra qué pasó y la regla.
- [ ] La versión y la fecha de `MEMORY.md` coinciden con `package.json` y con `date`.
- [ ] `CLAUDE.md` contiene la regla de leer `MEMORY.md` al abrir sesión y de actualizarlo al iniciar y finalizar `/spec` y `/spec-impl`.
- [ ] `CLAUDE.md` ya no manda leer `memoria/` entera al abrir sesión y la enlaza como consulta.
- [ ] `git diff --stat` no muestra cambios en `memoria/`, en `.claude/skills/` ni en `sistema/`.
- [ ] `node sistema/tokens/generar.mjs` sale con 0 fallos.
- [ ] El commit no contiene `.env`, claves ni credenciales.

## Decisiones tomadas y descartadas

- **Sí:** `MEMORY.md` en la raíz, versionado. Decisión del responsable el 2026-10-30; viaja con git y se lee en cualquier máquina.
- **No:** ponerlo dentro de `memoria/`: menos visible.
- **Sí:** `MEMORY.md` sustituye a `memoria/` como lo primero que se lee; `memoria/` queda intacta como archivo histórico. Decisión del responsable el 2026-10-30, con esa acotación para no romper `generar.mjs`.
- **No:** mover o recortar `memoria/` en esta spec; exige tocar el generador y aprobar cada borrado (§15 del manual general); va en otra spec.
- **Sí:** solo regla en `CLAUDE.md` para forzar la actualización. Decisión del responsable el 2026-10-30.
- **No:** editar las skills ni añadir un hook. Más superficie y las skills aún no están versionadas.
- **Sí:** errores a evitar, máximo 10 líneas y solo de este proyecto. Decisión del responsable.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| La regla «depende de acordarse»: el repo ya sufrió pasos que nadie ejecutaba | Riesgo aceptado por el responsable. Verificación manual: al cerrar un `/spec` o `/spec-impl`, comprobar con `git diff` que `MEMORY.md` cambió |
| `MEMORY.md` y `memoria/01-estado.md` se contradicen | `MEMORY.md` solo resume y enlaza; ante contradicción gana `memoria/01-estado.md` y se corrige `MEMORY.md` |
| Editar `CLAUDE.md` rompe el cruce de versiones de `generar.mjs` | El paso 5 lo ejecuta; no se tocan la línea de estado ni el número de versión |
| 50 líneas se quedan cortas | Se poda hacia `memoria/04-pendientes.md`; no se sube el límite sin otra spec |
| Confusión con el `MEMORY.md` del agente en `~/.claude` | El archivo lo aclara en su cabecera: este viaja con git, aquel no |

## Lo que **no** está en esta spec

- Mover, borrar o recortar `memoria/`.
- Cambiar `generar.mjs` o cualquier candado, incluido uno para el límite de 50 líneas.
- Modificar las skills `/spec` y `/spec-impl` o añadir hooks.
- Tocar el `MEMORY.md` del agente en `~/.claude`.
