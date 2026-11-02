# MEMORY.md

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.

## Estado actual (2026-11-02)

- **v1.152.0 PUBLICADA** (2026-11-02, etiqueta + release con ZIP; `main` = `14d3acf`) y lleva la SPEC 06 (la que el responsable asignó: «corresponde la 152»). La **v1.151.0 ya estaba publicada con el
  mismo código** (2026-11-02; etiqueta y release no se tocan): `npm install "github:solwarehz/sistema-diseno#v1.152.0"`.
  No probada la instalación desde un proyecto limpio. Los ZIP de v1.150.0 y v1.151.0 se borraron (flujo normal: solo queda el de la última); sus etiquetas y releases siguen.
- **SPEC 06 (R168, `PanelPrivilegios` plegable) en «Implemented»**, reglas 34-40, 1399 pruebas, 198 pares de contraste
  (158 bloqueantes). `plegable` (cabecera de columnas dentro de cada módulo), `resumen` `'completo'|'ninguno'` (el equipo
  pidió `'concedido'`; el sistema es para todos y se simplificó: **avisarles**), `icono` por columna y por fila,
  `posicionIconoFila`. Un criterio sin marcar: el mockup previo (la demo del catálogo hizo de mockup).
  - Pendiente del responsable: iconos de «Dar alta» y «Desactivar» (sin icono hoy).
- `verificar-color` salta lo que git ignora; `/imagenes` está en `.gitignore` (maquetas de otros equipos: referencia, no sistema).
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
- **Ramas:** se está sobre `work` y solo existen `main` y `work`. Una rama temporal (`spec-NN-slug` tras `/spec-impl`,
  que es obligatoria; `fix/`, `docs/`, `chore/`…) sale de `work`, se mergea por PR y **se borra** (local y remota, `-d`).
  Nunca se trabaja en `main`. `/spec` no crea rama. Falta el hook `pre-commit` de CLAUDE.md §19.1: no está instalado.
- No acuñar números R###: el registro es del equipo.
- La extensión de Chrome puede no estar conectada: `playwright-cli` + `servir.mjs` (loopback) sirve.
- Los backticks dentro de comentarios CSS de la plantilla de `generar-cascaron.mjs` rompen el build (pasó en SPEC 06).
- Para comparar marcado entre dos versiones, normalizar `useId` (`:r0:`): su contador es global y todo sale distinto.
- `.claude/skills/spec` es un enlace a `.agents/skills/spec`: se edita el destino. Un `cp -R` del enlace sale roto.
- Con `/imagenes` ignorada, `git add -A -- . ':!imagenes'` falla y corta la cadena `&&`: usar `git add -A`.
- zsh no separa una variable por espacios en un `for`: listar los nombres a mano.
- Al cambiar de rama con `git switch` puede que el editor del usuario recree un archivo (pasó con la spec 06 →
  «Implemented»): mirar `git status` y no pisarlo; apartarlo, cambiar de rama y restaurarlo.
