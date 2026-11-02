# MEMORY.md

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.

## Estado actual (2026-11-02)

- **v1.151.0 PUBLICADA** por las dos vías (etiqueta `v1.151.0` + release con ZIP, 2026-11-02):
  `npm install "github:solwarehz/sistema-diseno#v1.151.0"`. `main` = `work` = `cdfe262` al publicar. No probada la
  instalación desde un proyecto limpio. El ZIP de v1.150.0 se borró (flujo normal); su etiqueta y release siguen.
- **SPEC 06 (R168, `PanelPrivilegios` plegable) en «Implemented»**, reglas 34-40, 1399 pruebas, 198 pares de contraste
  (158 bloqueantes). `plegable` (cabecera de columnas dentro de cada módulo), `resumen` `'completo'|'ninguno'` (el equipo
  pidió `'concedido'`; el sistema es para todos y se simplificó: **avisarles**), `icono` por columna y por fila,
  `posicionIconoFila`. Un criterio sin marcar: el mockup previo (la demo del catálogo hizo de mockup).
  - Pendiente del responsable: iconos de «Dar alta» y «Desactivar» (sin icono hoy).
- `verificar-color` salta lo que git ignora; `/imagenes` está en `.gitignore` (maquetas de otros equipos: referencia, no sistema).
- **SPEC 05** (`BotonAccion`: Aceptar/Guardar/Agregar) sigue en Draft; reservaba 1.151.0, tomará 1.152.0.
- La skill `/spec` pide en toda spec el criterio «entrega = promesa» (modificación local de una skill externa de
  `Klerith/fernando-skills`; una actualización desde su origen la sobrescribiría). El `computedHash` del lock no se tocó.
- Para publicar la siguiente: PR rama → `work` → `main` (pedir permiso, es despliegue), luego `npm run publicar`.

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
