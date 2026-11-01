# MEMORY.md

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.

## Estado actual (2026-11-01)

- Versión **v1.149.0** en la rama `feat/2026-11-01-cuadro-estado`. **Sin subir a `main`, sin
  `npm run publicar`** (etiqueta + ZIP): ambos requieren petición expresa. `main` sigue en v1.148.3.
- **SPEC 03 (R165, `CuadroEstado`) implementada**, los 8 pasos y los 18 criterios marcados `[x]`.
  La spec sigue en «Approved»: pasarla a «Implemented» es del responsable.
  - Componente, token `sin-estado` (gris_700 / negro_100; mínimos 6,06:1 y 6,82:1; pares 196, 156
    bloqueantes), página `cuadro` del catálogo y 7 reglas de contrato en `comportamiento.md`.
  - Tamaño por ventana: 30 px base, 28 px en `min-width: 641px`. El contrato exige leyenda visible.
  - Medido en navegador (playwright-cli): 30×30 a 640 y 28×28 a 641; siete cuadros = 234 px; leyenda
    sin cortes y sin desplazamiento a 360 y 390 px; caja de 200 px → 2 filas; sin foco; `ninguno`
    dashed y transparente. Los 25 pasos de CLAUDE.md §8 y 1327 pruebas, en verde.
  - Fuera de ella: fila apilada de `TablaDatos` (no existe; la pide el equipo aparte).
- Para subir: revisar el diff, pedir permiso de merge a `main` (el merge es despliegue) y luego publicar.

## Errores a evitar

- `componentes.css` es DERIVADO: lo regenera `extraer.mjs` desde `cascaron/index.html`. El CSS se
  escribe en la plantilla de `generar-cascaron.mjs` y se registra el prefijo en `extraer.mjs`;
  editarlo directo se pierde (la spec lo decía mal).
- Un precedente se lee, no se cita: la spec 03 contó 33 reglas de 640 px y eran 8 (`CLAUDE.md` §4bis).
- No hay `@container` en la hoja; el móvil se escribe base estrecha + `min-width`.
- Medir las tablas del catálogo a 360 px: `tabla-simple` con 4 columnas obliga a deslizar.
- Comprobar la rama antes de editar; nunca commitear en `main` o `develop`. Falta el hook `pre-commit`
  que exige CLAUDE.md §19.1: no está instalado en `.git/hooks`.
- No acuñar números R###: el registro es del equipo.
- La extensión de Chrome puede no estar conectada: `playwright-cli` + `servir.mjs` (loopback) sirve.
