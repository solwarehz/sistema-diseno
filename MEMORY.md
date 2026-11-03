# MEMORY.md

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.

## Estado actual (2026-11-02)

- **v1.152.0 PUBLICADA** (2026-11-02, etiqueta + release con ZIP; `main` = `14d3acf`) lleva la SPEC 06 (`PanelPrivilegios`
  plegable). La v1.151.0 tenía el mismo código; etiquetas y releases no se tocan.
- **v1.153.0 PUBLICADA** (etiqueta `v1.153.0` + ZIP; mergeada en `main`): SPEC 07 (R169), `FranjaCifras`+`CifraConDiferencia`,
  `ListaRanking`, `MapaCalor`, `GraficoTendencia` y `nivel`/`cuenta` en `SelectorBusqueda`; 20 tokens (`grafico-*`, `barra-*`,
  `mapa-*`) sobre primitivos ya autorizados; contraste **242 pares, 184 bloqueantes, 92 por modo**, 0 fallos. Sin `style` en
  línea: barras en SVG (atributos) y celdas por clases `-p1`…`-p5`. No probada la instalación limpia.
- **v1.153.1 PREPARADA, NO PUBLICADA** (parche sin R, rama `work`; falta PR y `npm run publicar`): la etiqueta de la referencia
  de `GraficoTendencia` ya no se solapa con trazo, puntos ni valores (`posicionEtiquetaReferencia`, regla 16; ancho de glifo 7 px
  medido en navegador; el catálogo la repite y una prueba compara ambos a 280-520 px).
  - Pendiente del responsable: iconos de «Dar alta» y «Desactivar» del panel de privilegios (sin icono hoy).
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
