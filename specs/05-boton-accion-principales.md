# SPEC 05 — BotonAccion: las tres acciones principales con icono y rótulo fijos

> **Estado:** Draft
> **Depende de:** ninguna (SPEC 04 ya está implementada en v1.150.0; no interviene)
> **Fecha:** 2026-11-01
> **Objetivo:** Crear el componente `BotonAccion`, que fija rótulo, icono (siempre a la izquierda), variante principal y gerundio de las tres acciones principales —Aceptar, Guardar y Agregar—, para que se vean iguales en todas las pantallas que usan el sistema.

## Por qué existe esta spec

Petición del responsable (llegó por `/spec`, 2026-11-01). Sin requerimiento `R###` detrás: el número lo acuña el equipo que pide y esta spec no lo inventa (`CLAUDE.md` §4ter).

El problema: las pantallas de las apps que usan el sistema escriben a mano sus botones de acción. El **color** ya se respeta, pero no hay unidad en el contenido: unas muestran solo el nombre, otras icono y nombre, y el verbo cambia de una pantalla a otra («Guardar», «Grabar»).

El responsable quiere **ordenar para siempre** cómo se muestran los elementos que usan el sistema, **poco a poco**. Esta spec cubre **solo los botones principales**. Los secundarios, Cancelar y los demás vienen después, y quiere **ver primero cómo quedan** los principales: por eso el primer paso es un mockup que él aprueba antes de escribir código.

Hechos verificados en el repositorio el 2026-11-01 (rama `work`, versión 1.150.0 en `package.json` y `componentes/package.json`):

- `componentes/src/Boton.tsx` ya tiene la variante `principal` (clase `btn-1`), la prop `icono` y la prop `textoOcupado`. **Solo sabe pintar el icono a la izquierda**: el hijo con `aria-hidden` va antes del texto (línea 280). El rótulo lo escribe cada pantalla, y de ahí sale la deriva.
- `.btn-ic` (`componentes.css:111`) pone `display: inline-flex` y `gap: 8px`. `Boton` añade `btn-ic` cuando recibe `icono`.
- Los iconos que hacen falta **ya existen** en `componentes/src/Icono.tsx`: `visto`, `guardar` y `suma`. `mas` son tres puntos («más opciones»), no un signo de sumar; por eso Agregar usa `suma`. El tamaño por omisión de `Icono` es 18 px (`tam="texto"`); `control` es 16.
- El catálogo ya enseña la incoherencia: en la página «Botón» el ejemplo de estados de la principal es «Guardar» **sin** icono (`generar-cascaron.mjs`, ~línea 1093) y el de «Con icono» es «Nuevo estudiante» **con** icono (~línea 1137).
- **`Boton` no tiene sección propia en `comportamiento.md`**: sus reglas viven repartidas en «Diálogo modal» (10, 10b a 10f, 12, 13, 14) y «Lo deshabilitado». La regla **10f** dice, medido en navegador, que con `icono` + `textoOcupado` el botón **encoge 4,00 px** al ocuparse (el icono mide 18 y el giro 14) y el rótulo queda a 13 px del centro. `BotonAccion` lleva siempre las dos cosas, así que **hereda ese límite** (ver Riesgos y Decisiones).
- `index.ts` exporta cada componente a mano (por ejemplo `CuadroEstado`, línea 34). `sistema/candado/verificar-entrega.mjs` lista los pares `[componente, página del catálogo]` (línea 129: `['Boton', 'Botón']`).
- Hay un precedente de mockup aprobado antes del código: `cascaron/mockup-fecha-maxima.html` (SPEC 04).

## Alcance

**Dentro:**

- `componentes/src/BotonAccion.tsx` y su exportación (con sus tipos) en `componentes/src/index.ts`.
- Tres acciones, cerradas: `aceptar`, `guardar` y `agregar`. Cada una fija su rótulo, su icono, su gerundio y la variante `principal`.
- Prop `objeto` opcional: se añade al verbo («Agregar estudiante», «Guardar cambios»). El verbo y el icono no cambian nunca.
- Icono **siempre a la izquierda** del rótulo. Nunca solo icono: ni `soloIcono` ni icono sin rótulo.
- Gerundio por omisión mientras la acción trabaja, reutilizando `textoOcupado` de `Boton`. La pantalla puede sustituirlo.
- `BotonAccion` **se compone sobre `Boton`**: hereda doble envío, `aria-busy`, `disabled`, `ref` y `mini`. No reconstruye nada (`POLITICA-DE-CREACION.md`).
- **Mockup** `cascaron/mockup-boton-accion.html`, hecho con la skill `frontend-design` (`CLAUDE.md` §4bis-2), que el responsable aprueba **antes** de implementar.
- Pruebas, página «Botón» del catálogo, sección nueva del contrato en `comportamiento.md`, registro en `verificar-entrega.mjs`, entrada de versión.
- Subida de versión a **v1.151.0** (componente nuevo y público: minor, como v1.149.0) y reescritura de los números de estado de `memoria/01-estado.md` y `CLAUDE.md` §1.

**Fuera de alcance (para especs futuras):**

- Las demás acciones: Cancelar, Eliminar, Editar, Consultar, Exportar y Descargar. El responsable las hará «luego».
- Las variantes secundaria, neutra, terciaria y destructiva.
- **Migrar los botones que ya pintan `Dialogo`, `Confirmacion`, `CargaPdf` y otros** a `BotonAccion`. La intención es ir ordenando cada elemento poco a poco, pero tocar esos componentes cambia contratos con muchas pruebas (pie del diálogo, «Grabar» de `CargaPdf`) y es otro riesgo.
- Cambiar el aspecto de `.btn`, `.btn-1` o `.btn-ic`, o cualquier regla existente de la hoja.
- Un icono nuevo (dibujarlo es trabajo de diseñador) o un color nuevo.
- Cambiar `Boton`, incluido el encogimiento de 4 px de la regla 10f.
- Traducción del rótulo: el sistema habla español.
- La verificación en `devgestion` y la publicación (`npm run publicar`): son pasos posteriores y requieren petición expresa.

## Modelo de datos

Un componente nuevo y dos tipos nuevos; no cambia ningún tipo existente.

```ts
export type AccionPrincipal = 'aceptar' | 'guardar' | 'agregar';

export type BotonAccionProps = {
  accion: AccionPrincipal;
  /** Complemento del verbo: «estudiante» → «Agregar estudiante». */
  objeto?: string;
  /** Sustituye al gerundio por omisión. Solo texto. */
  textoOcupado?: string;
} & Omit<BotonProps, 'variante' | 'icono' | 'soloIcono' | 'children' | 'textoOcupado'>;
```

Tabla fija de las tres acciones (vive en el componente, no en la pantalla):

| `accion` | Rótulo | Icono | Gerundio |
|---|---|---|---|
| `aceptar` | Aceptar | `visto` | Aceptando… |
| `guardar` | Guardar | `guardar` | Guardando… |
| `agregar` | Agregar | `suma` | Agregando… |

Convenciones:

- **Emisión:** un `Boton` con `variante="principal"` y `icono={<Icono nombre=… />}`. El resultado es `<button class="btn btn-1 btn-ic">`, con el icono antes del texto. No se emite clase nueva.
- **Rótulo con objeto:** `rótulo + ' ' + objeto`. El gerundio con objeto es `gerundio sin '…' + ' ' + objeto + '…'` («Guardando cambios…»). Un `objeto` vacío o solo de espacios se ignora.
- **Nombre accesible:** el rótulo completo. El icono va oculto al lector.
- **Props que no existen:** `variante`, `icono`, `soloIcono` y `children` no se aceptan: el tipo los rechaza. El rótulo y el icono no se tocan desde la pantalla.
- **Acción desconocida** (un consumidor sin TypeScript): avisa por consola en desarrollo (`process.env.NODE_ENV !== 'production'`, el patrón de `Boton`) y **no pinta nada**. Un principal con un rótulo inventado reintroduciría la deriva que esta pieza viene a cerrar.
- **Tamaño del icono y separación:** se deciden en el mockup (paso 1). Por omisión, los de `Boton` (18 px y `gap: 8px`).

## Plan de implementación

0. Requisitos previos: se parte de `work` actualizado y la rama se comprueba **antes** de la primera edición (`CLAUDE.md` §8). `/spec-impl` crea la rama temporal `spec-05-boton-accion-principales` desde `work`. Las dependencias están dentro del contenedor (`docker-compose`).
1. **Mockup** `cascaron/mockup-boton-accion.html`, con la skill `frontend-design` antes de proponer nada. Enseña las tres acciones con las clases reales (`btn btn-1 btn-ic`) y tokens, sin hex ni `style` en línea: en reposo, hover, foco, deshabilitado, ocupado, con y sin `objeto`, con `mini`, en claro y oscuro, y a 360 px. **Mide** el ancho en reposo contra ocupado (la regla 10f dice que encoge 4 px) y lo reporta. El aspecto de `.btn-1` no cambia. **Aquí se detiene el trabajo hasta que el responsable apruebe.**
2. Escribir `componentes/pruebas/BotonAccion.test.tsx` y verlas fallar: tabla de las tres acciones, icono antes del texto, `objeto`, gerundio con y sin `objeto`, doble clic descartado mientras trabaja, `textoOcupado` propio, acción desconocida que avisa y no pinta, y que el tipo rechaza `variante`, `icono`, `soloIcono` y `children` (comprobado con `tsc`).
3. Crear `componentes/src/BotonAccion.tsx` sobre `Boton` y exportarlo, con sus tipos, en `componentes/src/index.ts`. Las pruebas del paso 2 pasan.
4. Actualizar el catálogo (`sistema/cascaron/generar-cascaron.mjs`, página «Botón»): las tres acciones con marcado estático y con la importación y las props (no el marcado interno), con y sin `objeto`. El ejemplo de «Guardar» sin icono de la página se reemplaza por el que enseña `BotonAccion`. Registrar `['BotonAccion', 'Botón']` en `sistema/candado/verificar-entrega.mjs`. Regenerar con `generar-cascaron.mjs` y `extraer.mjs`. Si hace falta CSS, va en la plantilla del generador, **no** en `componentes.css` (es derivado).
5. Escribir la sección «Botón de acción · las principales» en `sistema/componentes/comportamiento.md` (sin reglas previas: empieza en la **1**), cada regla **Obligatorio** y con su prueba declarada en el comentario `<!-- pruebas: -->`. Reglas: (1) rótulo, icono y variante son de la acción y la pantalla no los cambia; (2) el icono va a la izquierda y nunca se pinta solo; (3) `objeto` complementa y no sustituye el verbo; (4) gerundio por omisión y el límite medido de la regla 10f, declarado tal cual; (5) una principal por pantalla: `BotonAccion` es siempre principal, así que dos en la misma pantalla son dos principales.
6. Subir la versión a 1.151.0 (`package.json` y `componentes/package.json`), cambiar `VERSION` y añadir la entrada en `CAMBIOS` de `sistema/tokens/fuente.mjs` (sin tokens), actualizar `manual/ACTUALIZAR.md`, corregir los números de `memoria/01-estado.md` y de `CLAUDE.md` §1, dejar anotada en `memoria/04-pendientes.md` la continuación (el resto de botones) y actualizar `MEMORY.md`.
7. Correr los veinticinco pasos de `CLAUDE.md` §8 en verde, más `tsc --noEmit` y las pruebas; medir en navegador a 360 px.

## Criterios de aceptación

- [ ] El mockup `cascaron/mockup-boton-accion.html` existe y el responsable lo aprobó **antes** del paso 3.
- [ ] `<BotonAccion accion="guardar" />` renderiza un único `<button>` con clases `btn btn-1 btn-ic`, y su nombre accesible es «Guardar».
- [ ] Las tres acciones usan exactamente el rótulo, el icono y el gerundio de la tabla del modelo de datos, comprobado por prueba.
- [ ] En las tres, el icono es el primer hijo del botón y el texto va después. Se comprueba por el orden en el DOM y por la posición medida en navegador.
- [ ] `<BotonAccion accion="agregar" objeto="estudiante" />` dice «Agregar estudiante» en el rótulo y en el nombre accesible; el icono sigue siendo `suma`.
- [ ] El tipo rechaza `variante`, `icono`, `soloIcono` y `children` (comprobado con `tsc`).
- [ ] Con `onClick` que devuelve una promesa, el botón pasa a «Guardando…» (o «Guardando cambios…» con `objeto`), tiene `aria-busy` y descarta el segundo clic; al terminar o fallar vuelve a reposo.
- [ ] Una `accion` desconocida avisa por consola en desarrollo y no pinta nada.
- [ ] La diferencia de ancho entre reposo y ocupado está **medida en navegador** y declarada en el contrato; si no es cero, la decide el responsable al aprobar el mockup.
- [ ] A 360 px, las tres acciones con un `objeto` de 30 caracteres no desbordan ni obligan a deslizar y no tienen texto cortado (ningún elemento con `scrollWidth` mayor que `clientWidth`), medido en navegador.
- [ ] Ninguna regla existente de `.btn`, `.btn-1` ni `.btn-ic` cambia: el diff de la hoja no las toca. No se añade ningún color ni token.
- [ ] El componente no contiene hex, primitivas, `style` en línea ni `outline-none`; el candado de ESLint sale en 0.
- [ ] La página «Botón» del catálogo enseña las tres acciones con marcado estático, y `verificar-entrega` incluye el par `['BotonAccion', 'Botón']` y sale en verde.
- [ ] Cada regla de la sección nueva del contrato tiene su prueba declarada y `verificar-contrato` sale en verde.
- [ ] Los veinticinco pasos de `CLAUDE.md` §8, `tsc --noEmit` y la suite de `componentes/` salen en verde.
- [ ] Las pruebas nuevas se vieron fallar antes de la implementación (paso 2).
- [ ] La versión es 1.151.0 en `package.json`, `componentes/package.json`, `VERSION`, `CAMBIOS`, `memoria/01-estado.md` y `CLAUDE.md` §1, y coincide en todos.

## Decisiones tomadas y descartadas

- **Sí:** componente nuevo `BotonAccion` que envuelve a `Boton`. Fija rótulo, icono, variante y gerundio, y se compone con lo ya creado en vez de reconstruir. Decisión del responsable el 2026-11-01.
- **No:** presets dentro de `Boton` con una prop `accion`. `Boton` ya acumula contratos (R118, R133) y un preset podría chocar con sus props libres.
- **No:** solo reglas y catálogo, sin componente. Cada pantalla seguiría escribiéndolo a mano y la deriva volvería.
- **Sí:** icono **siempre a la izquierda**. Decisión del responsable el 2026-11-01. Es lo único que `Boton` sabe hacer, y un botón que a veces lleva el icono a la derecha es la inconsistencia que se quiere cerrar.
- **No:** icono a la derecha, ni «sin icono en las de texto largo»: la regla pasaría a ser «depende».
- **Sí:** rótulo fijo con `objeto` opcional. Decisión del responsable el 2026-11-01. El verbo y el icono son del sistema; el objeto es de la pantalla.
- **No:** rótulo totalmente fijo (pierde claridad con varias entidades) ni rótulo libre (el verbo vuelve a variar).
- **Sí:** solo las tres principales ahora. Decisión del responsable el 2026-11-01: quiere ver primero cómo quedan. El resto de botones se hará después, cada uno con su propia spec.
- **Sí:** iconos `visto`, `guardar` y `suma`. Decisión del responsable el 2026-11-01. Ya existen: no se dibuja ninguno. `suma` y no `mas`.
- **Sí:** gerundio por omisión. Decisión del responsable el 2026-11-01. Evita que el botón baile y deja claro **cuál** acción trabaja cuando hay dos cerca (la razón de R118).
- **Sí:** mockup con `frontend-design` primero, con el aspecto de `.btn-1` sin cambiar. Decisión del responsable el 2026-11-01. La skill aconseja y las reglas del repo mandan (`CLAUDE.md` §4bis-2): colores autorizados, tokens y móvil primero.
- **No:** un aspecto propio para `BotonAccion` ni rehacer `.btn-1`. Habría dos principales distintas en la misma pantalla, o un cambio visual para todos los productos a la vez.
- **Sí:** no migrar `Dialogo`, `Confirmacion` ni `CargaPdf` en esta spec. Decisión del responsable el 2026-11-01. La meta es ordenar todo poco a poco, pero esta spec crea y documenta la pieza.
- **Sí:** nunca solo icono. Un icono como única información no sirve a quien ve el botón sin leyenda; `aria-label` no ayuda a quien ve (`CLAUDE.md` §4bis).
- **Sí:** acción desconocida: avisa en desarrollo y no pinta. Decisión técnica del agente; se reporta. Es mejor un hueco que un principal con un rótulo inventado.
- **Pendiente de decidir con el mockup:** el encogimiento de 4 px entre reposo y ocupado (regla 10f). Se mide en el paso 1 y el responsable lo ve en el mockup. Si no se quiere, la solución debe vivir en `BotonAccion` y no en `Boton` ni en `.btn-1`, que esta spec no toca; si se acepta, se declara en el contrato como ya hace la regla 10f.
- **Sí:** v1.151.0 (minor). Es un componente nuevo y público, y así se numeraron los anteriores (v1.133.0, v1.140.0, v1.149.0).
- **Sí:** nombre `BotonAccion` y tipos `AccionPrincipal` y `BotonAccionProps`. Decisión técnica del agente; se reporta.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Con icono y gerundio a la vez, el botón encoge 4 px al ocuparse y el rótulo se descentra (regla 10f); `BotonAccion` lo lleva siempre | Se mide en el mockup y se muestra al responsable; decisión pendiente declarada arriba. Sin tocar `Boton` ni `.btn-1` |
| Un `objeto` largo desborda a 360 px | Criterio de aceptación medido a 360 px con 30 caracteres; si hace falta, envolver el texto (nunca recortar) con CSS en la plantilla del generador |
| Dos `BotonAccion` en la misma pantalla son dos principales (rompe «una por pantalla») | Regla 5 del contrato; el componente no puede saberlo, es de la pantalla |
| Los productos seguirán usando `<Boton variante="principal">` a mano hasta que se migre | Declarado fuera de alcance; se anota en `memoria/04-pendientes.md` para las siguientes specs |
| `verificar-forma` marca el componente y los tipos nuevos | Es una adición; se declara en el mismo commit, no se silencia |
| El catálogo no pinta el componente en estático y los candados no lo ven | El paso 4 exige marcado estático (`pieza-sin-componente-no-esta-entregada`) |
| Se aprueba el mockup y luego el aspecto real difiere del dibujo | El mockup usa las clases y los tokens reales; el paso 7 mide en navegador el componente entregado, no el mockup (`el-catalogo-y-el-paquete-son-dos-hojas`) |
| Versión nueva sin publicar | La publicación (`npm run publicar`) es posterior y requiere petición expresa |

## Lo que **no** está en esta spec

- Cancelar, Eliminar, Editar, Consultar, Exportar y Descargar; las variantes secundaria, neutra, terciaria y destructiva.
- Migrar `Dialogo`, `Confirmacion`, `CargaPdf` ni ningún otro componente al nuevo botón.
- Cambios en `Boton`, `.btn`, `.btn-1` o `.btn-ic`, y el arreglo del encogimiento de la regla 10f dentro de `Boton`.
- Iconos o colores nuevos.
- Verificación en `devgestion` y publicación.
