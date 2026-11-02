# MEMORY.md

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.

## Estado actual (2026-11-01)

- Versión **v1.150.0**, **ya en `main` (PR #4, merge `f80a46e`) y PUBLICADA** por las dos vías
  (etiqueta `v1.150.0` + release con ZIP): `npm install "github:solwarehz/sistema-diseno#v1.150.0"`.
  No probada la instalación desde un proyecto limpio. `work` = `main` = `f80a46e`.
- **SPEC 04 (R166, `fechaMaxima` en `RangoFecha`) implementada**, los 6 pasos y los 14 criterios
  marcados `[x]`. Los 25 pasos de CLAUDE.md §8, `tsc` y 1362 pruebas, en verde; medido a 360 px en
  navegador con el componente real (sin desborde). La spec sigue en «Aprobada»: pasarla a
  «Implemented» es del responsable.
  - Último día elegible, inclusive, en los dos extremos; `string` ISO o `Date`; validador propio
    (`deIso` no valida: `2026-02-31` pasaba a ser el 3 de marzo). Reglas 24 a 32 del contrato.
  - Periodos que la pasan no se pintan (y `aplicarAtajo` tiene su guarda). Rango ya puesto posterior:
    aviso, no se reescribe. «Mes siguiente» `aria-disabled` y teclado acotado al mes de la máxima.
  - Decisiones del responsable (mockup aprobado): foco dentro del último mes, el nombre accesible dice
    solo la máxima si apagan los dos topes, un rango puesto más allá no arrastra la ventana.
  - Impide ELEGIR; no impide que el producto consulte un rango futuro por otro camino.
- SPEC 03 (R165, `CuadroEstado`) ya está «Implemented».
- Lo siguiente en `RangoFecha`: nada pendiente. El equipo consumidor (SPEC 14) probará en pantalla y
  abrirá petición si algo falla. Sin medir: teclado en navegador real, modo oscuro, ancho de escritorio.
- Para subir: PR `work` → `main`, pedir permiso de merge (es despliegue); luego `npm run publicar`.

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
  `/spec` no crea rama, pero `/spec-impl` SÍ la pide (`spec-NN-slug`, Phase 3) y eso es solicitud expresa: se crea. Falta el hook `pre-commit`
  que exige CLAUDE.md §19.1: no está instalado en `.git/hooks`.
- No acuñar números R###: el registro es del equipo.
- La extensión de Chrome puede no estar conectada: `playwright-cli` + `servir.mjs` (loopback) sirve.
