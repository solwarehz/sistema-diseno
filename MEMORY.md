# MEMORY.md

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.

## Estado actual (2026-10-31)

- Rama de trabajo: `feat/2026-10-30-horario-detalle-negrita`, subida a origin. Versión **v1.148.3**.
- **R163 — detalle del bloque del Horario en negrita** (lo pidió el equipo). Implementado:
  - Por omisión el detalle pesa 600; `detalleEnfasis={false}` emite `hor-det-normal` y vuelve a 400.
  - La regla va en `.hor-b span:not(.hor-rango)`, no en `.hor-b span`: el rango también es `span`.
  - Gana por especificidad (0,3,1 contra 0,2,1), no por orden, porque el extractor reordena.
  - Título, rango y tamaño del detalle no cambian. Contrato: regla 10 del Horario
    (`sistema/componentes/comportamiento.md`). Cambia el aspecto por omisión; está declarado en CAMBIOS.
- Commits: spec `c123e9f`, pruebas+CSS `b599759`, componente `d2a3786`, catálogo `4a629e6`,
  contrato `b0ad2aa`, versión `ee1294e`.

## Estado de R163 (2026-11-01)

- **Verificado en Chrome** (playwright-cli, catálogo en loopback): detalle 600 por omisión y 400 con
  `detalleEnfasis={false}`; título 600/13px y rango 400/12px intactos; la rejilla de 7 columnas mide
  igual con y sin negrita a 1280 y 360 px. Los 25 pasos de CLAUDE.md §8 y 1295 pruebas, en verde.
- Sin medir: si el tablero dice «dónde estás / cuántas paradas» a 360 px (hoy desliza dentro de `hor-env`).
- Subido a `main`. **Falta** `npm run publicar` (etiqueta `v1.148.3` + ZIP): requiere petición expresa.
- `memoria/01-estado.md` dice «Última actualización: 24 de septiembre de 2026»: revisarla al reescribirlo.

## Errores a evitar

- Comprobar la rama antes de editar; nunca commitear en `main` o `develop`.
- No acuñar números R###: el registro es del equipo.
