# MEMORY.md

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.

## Estado actual (2026-11-02)

- `main` = `work` = `f80a46e`, v1.150.0 PUBLICADA (SPEC 04, R166 `fechaMaxima`). SPEC 03 «Implemented».
- **SPEC 05** (`BotonAccion`: Aceptar/Guardar/Agregar) en `work`, estado Draft, sin implementar. Reserva 1.151.0.
- **SPEC 06 (R168, `PanelPrivilegios` plegable) IMPLEMENTADA en la rama `spec-06-panel-privilegios-modulos-plegables`**
  (v1.151.0, reglas 34-38; NO en `main`, sin PR, sin publicar). 1392 pruebas, `tsc` y el 25 en verde; marcado
  idéntico a v1.150.0 sin props nuevas (comparado byte a byte). Demo viva en `#panelprivilegios`.
  - `plegable`, `resumen="ninguno"` (sin chips; el equipo pidió «concedido» y se simplificó, el sistema es para todos) e `icono` por columna. Vacío y resumen en matriz solo con `plegable`.
  - **Pendiente del responsable:** aprobar la demo (no hubo mockup previo, se saltó el paso 1), decidir iconos
    de «Dar alta» y «Desactivar» (sin icono hoy), y qué hacer con `imagenes/control-de-asistencia-titulos.html`:
    `verificar-color` falla con 37 hallazgos por sus hex y por eso el paso 6 de §8 NO sale verde en el árbol
    real (sí en una copia sin `imagenes/`). No lo toqué ni excluí la carpeta del candado.
  - Contraste del hover de la banda medido a mano (no hay par declarado en `verificar-contraste`).
- Para subir: PR rama → `work` → `main`, pedir permiso de merge (es despliegue); luego `npm run publicar`.

## Errores a evitar

- El candado de eslint escanea TODO el repo, incluido `.playwright-cli/`: un arnés de prueba con
  `style` en línea dejado ahí tumbó la publicación («eslint en rojo»). Los temporales van fuera del repo.
- `npm run publicar` en seco tarda ~4 min (corre las pruebas); salida en segundo plano.

- `componentes.css` es DERIVADO: lo regenera `extraer.mjs` desde `cascaron/index.html`. El CSS se
  escribe en la plantilla de `generar-cascaron.mjs` y se registra el prefijo en `extraer.mjs`;
  editarlo directo se pierde (la spec lo decía mal).
- Un precedente se lee, no se cita: la spec 03 contó 33 reglas de 640 px y eran 8 (`CLAUDE.md` §4bis).
- No hay `@container` en la hoja; el móvil se escribe base estrecha + `min-width`.
- Medir las tablas del catálogo a 360 px: `tabla-simple` con 4 columnas obliga a deslizar.
- Se trabaja directo en `work`, sin ramas `feat/*` salvo que el usuario las pida; nunca en `main` o `develop`.
  Tras `/spec-impl` se trabaja en `spec-NN-slug` y el usuario dijo que la rama es obligatoria.
  `/spec` no crea rama, pero `/spec-impl` SÍ la pide (`spec-NN-slug`, Phase 3) y eso es solicitud expresa: se crea. Falta el hook `pre-commit`
  que exige CLAUDE.md §19.1: no está instalado en `.git/hooks`.
- No acuñar números R###: el registro es del equipo.
- La extensión de Chrome puede no estar conectada: `playwright-cli` + `servir.mjs` (loopback) sirve.
- Los backticks dentro de comentarios CSS de la plantilla de `generar-cascaron.mjs` rompen el build (pasó en SPEC 06).
- Para comparar marcado entre dos versiones, normalizar `useId` (`:r0:`): su contador es global y todo sale distinto.
