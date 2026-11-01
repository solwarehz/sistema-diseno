# SPEC 03 — CuadroEstado: un cuadro de una letra con tono

> **Estado:** Approved
> **Depende de:** ninguna (SPEC 01 ya está implementada en v1.148.3; no interviene)
> **Fecha:** 2026-11-01
> **Objetivo:** Crear el componente `CuadroEstado`, un cuadrado de una letra con tono de estado (o «sin estado»), de 30 px en estrecho y 28 px en ancho, para mostrar una serie corta de estados en poco ancho.

## Por qué existe esta spec

Requerimiento **R165** (numerado por el equipo, no acuñado aquí), prioridad media, comprobado por el equipo contra v1.148.2. Bloquea su pantalla `/control-de-asistencia/tableros/clasificacion-semanal`: siete días por trabajador (`P` presente, `T` tardanza, `I` incompleto, `F` falta, «–» el día no cuenta) a 390 px. El texto del requerimiento llegó por `/spec`; no hay fichero `requerimiento-R165-*.md` en `peticiones/` y esta spec no lo crea.

Hechos verificados en el repositorio el 2026-11-01 (rama `feat/2026-10-30-horario-detalle-negrita`, versión 1.148.3 en `package.json`):

- `componentes/src/Chip.tsx`: píldora con texto y filete lateral de 3px (`.chip{ padding: 4px 8px; border-left: 3px solid }`, `componentes.css:793`). Diez tonos en `TonoChip`; los cinco de significado que pide el equipo existen (`exito`, `aviso`, `error`, `info`, `inactivo`). Las reglas 1 y 3 del contrato dicen que los de identidad «agrupan, no informan».
- `TablaDatos` **no tiene vista de fila apilada** para móvil: a ancho estrecho solo desplaza dentro de `.tb-envoltura`. Es la respuesta a la «pregunta» del requerimiento.
- Un componente nuevo se registra en: `componentes/src/index.ts`, `sistema/componentes/extraer.mjs` (lista `{ n, p }`, línea ~67 para `Chip`), `sistema/candado/verificar-entrega.mjs` (lista de pares, línea ~135), `sistema/cascaron/generar-cascaron.mjs`, `sistema/componentes/comportamiento.md` y `sistema/tokens/fuente.mjs`.
- Mapa de tokens semánticos: `sistema/tokens/fuente.mjs` (por ejemplo `'borde-campo'`, línea ~6174). Las primitivas están prohibidas dentro de un componente (§2.5.1).
- Corte ya usado por el sistema: **640 px**, escrito 33 veces en `componentes.css` como `@media (max-width: 640px)`, es decir, por **ventana**. La hoja no contiene ningún `@container` ni `container-type`; la regla 33 de la matriz de privilegios mide su contenedor con `ResizeObserver` en JavaScript (`PanelPrivilegios.tsx`), que es otro mecanismo.
- Escala tipográfica: `s-etiqueta` es 13px/500 (`tailwind-preset.ts:253`); `CLAUDE.md` §6 prohíbe `text-[Npx]`.

## Alcance

**Dentro:**

- `componentes/src/CuadroEstado.tsx` y su exportación en `componentes/src/index.ts`.
- Cinco tonos de significado, copiados de los de `Chip`: `exito`, `aviso`, `error`, `info`, `inactivo`.
- Una sexta variante `tono="ninguno"` («sin estado»): borde **punteado**, **sin relleno**, color de borde y de letra de un token semántico nuevo que apunta a `gris_700` (color ya autorizado).
- `letra` (un carácter, obligatoria) y `titulo` (nombre accesible, obligatorio).
- Tamaño por **ventana**: 30 px por omisión (móvil primero) y 28 px cuando la ventana supera los 640 px.
- Letra en el paso `s-etiqueta` de la escala (13px), con peso 600 (uno de los cuatro permitidos), para que quepa y se lea en 28 px.
- Esquinas apenas redondeadas (no círculo); mismo radio que `Chip` (3px), sin filete lateral.
- No interactivo: sin clic, sin foco, sin `tabindex`.
- Estilos en `sistema/componentes/componentes.css`, sin hex ni tamaños arbitrarios.
- Pruebas, catálogo (`/diseño`), registro en los listados anteriores, contrato en `comportamiento.md` y entrada de versión.
- Subida de versión a **v1.149.0** y reescritura de `memoria/01-estado.md` y del número de estado de `CLAUDE.md`.

**Fuera de alcance:**

- Una **vista de fila apilada** en `TablaDatos`. No existe hoy; el equipo la pide aparte y su número R### lo acuña el equipo.
- Tonos nuevos de significado. Para «incompleto» el equipo usa `info`; si prefiere un tono entre `aviso` y `error`, es otra petición.
- Interactividad, foco o un `title` como único medio de lectura.
- Una **leyenda** (P = presente…): la pone la pantalla consumidora. El sistema solo garantiza que cada cuadro lleve su nombre completo.
- Una columna específica de `TablaDatos`.
- Un círculo, o cualquier forma que no sea el cuadrado.
- La pantalla `clasificacion-semanal` y su maqueta (viven en el repositorio del equipo consumidor).
- La verificación en `devgestion` y la publicación (`npm run publicar`): son pasos posteriores.

## Modelo de datos

Un componente nuevo y un tipo nuevo; no cambia ningún tipo existente.

```ts
export type TonoCuadro = 'exito' | 'aviso' | 'error' | 'info' | 'inactivo' | 'ninguno';

export type CuadroEstadoProps = {
  /** Un solo carácter. Es lo que informa; el tono lo acompaña (SC 1.4.1). */
  letra: string;
  tono: TonoCuadro;
  /** Nombre accesible completo, p. ej. «Presente, lunes 26». */
  titulo: string;
  className?: string;
};
```

Token semántico nuevo en `sistema/tokens/fuente.mjs`, con par claro y oscuro (el oscuro se elige entre colores ya autorizados y se mide; no se escribe a mano):

```js
'sin-estado': { claro: 'gris_700', oscuro: /* a medir */, uso: 'Borde y letra del cuadro sin estado' }
```

Convenciones:

- **Emisión:** `<span class="cuadro cuadro-<tono>" role="img" aria-label={titulo}>{letra}</span>`. `role="img"` hace que el lector anuncie `titulo` completo y no solo «P». El prefijo de clases es `cuadro`, que `extraer.mjs` debe reconocer.
- **Letra:** si `letra` no tiene exactamente un carácter, en desarrollo se avisa por consola con el mismo patrón que `TablaDatos` (`process.env.NODE_ENV !== 'production'`); en producción se pinta lo recibido.
- **Colores:** los cinco tonos de significado reutilizan los tokens `--<tono>-fondo`, `--<tono>-texto` y `--<tono>-acento` que ya usa `Chip`. `inactivo` reutiliza los de `.chip-inact`. No se añade ningún escalón a `autorizados.lock.json`.
- **Distinción sin color:** `ninguno` se distingue por la **forma** (borde punteado, sin relleno), no por el tono; es lo que cumple SC 1.4.1 aunque el gris se parezca al de `inactivo`.
- **Contraste:** el borde de `ninguno` debe cumplir 3:1 (SC 1.4.11) y su letra 4,5:1 contra `fondo-pagina` y `fondo-tarjeta`, en claro y oscuro. Los pares nuevos entran en `verificar-contraste.mjs` como bloqueantes.
- **Tamaño:** la regla base fija 30 px (móvil primero, §4bis) y la de 28 px va en `@media (min-width: 641px)`, de modo que 640 px exactos sigue siendo 30 px, igual que `@media (max-width: 640px)` en las otras 33 reglas. No se usa `@container`: la hoja no lo emplea y el cuadro, que es una hoja del árbol, no puede consultar a un contenedor que nadie declara.
- **Letra:** `font-size` y `font-weight` salen de la escala (`s-etiqueta`, 600); sin tamaños arbitrarios. Centrada con `display: inline-flex`; el cuadro no recorta la letra.

## Plan de implementación

0. Requisitos previos, que no son parte del cambio: se parte de `main` actualizado, la rama de trabajo es una `feat/*` nueva (por ejemplo `feat/2026-11-01-cuadro-estado`) y se crea **antes** de la primera edición, y las dependencias están instaladas **dentro del contenedor** (`memoria/03-al-clonar.md`).
1. Escribir `componentes/pruebas/CuadroEstado.test.tsx` y verlas fallar: emite `role="img"` con `aria-label` igual a `titulo`; clase por tono; `ninguno` sin relleno y con borde punteado; no es focalizable; el aviso de desarrollo con letra de longitud distinta de 1.
2. Añadir el token `sin-estado` en `sistema/tokens/fuente.mjs` y correr `node sistema/tokens/generar.mjs` y `node sistema/candado/verificar-contraste.mjs`: los pares nuevos salen en verde en claro y oscuro.
3. Añadir las reglas `.cuadro*` a `sistema/componentes/componentes.css` (30 px por omisión, 28 px bajo `@media (min-width: 641px)`; letra en `s-etiqueta`/600). Sin hex, sin `style` en línea, sin `outline-none`. Correr `verificar-promesa`, `verificar-empate` y `verificar-cascada` en ese paso para confirmar que resuelven el `min-width`.
4. Crear `componentes/src/CuadroEstado.tsx` y exportarlo en `componentes/src/index.ts`. Las pruebas del paso 1 pasan.
5. Registrar el componente en `sistema/componentes/extraer.mjs`, `sistema/candado/verificar-entrega.mjs` y `sistema/cascaron/generar-cascaron.mjs`. El catálogo muestra los seis tonos, una fila de siete cuadros y los dos tamaños, con marcado estático (si no, los candados de promesa no lo ven).
6. Escribir el contrato en `sistema/componentes/comportamiento.md` (reglas **Obligatorio**, cada una con su prueba declarada): letra + `titulo` obligatorios, la forma distingue `ninguno`, no interactivo, tamaño por contenedor.
7. Subir la versión a 1.149.0 (`package.json`), añadir la entrada en `sistema/tokens/fuente.mjs` y `manual/ACTUALIZAR.md`, y reescribir `memoria/01-estado.md` y el número de estado de `CLAUDE.md`.
8. Correr los veinticinco pasos de `CLAUDE.md` §8 en verde, más las pruebas, y medir en navegador a 360 y 390 px.

## Criterios de aceptación

- [ ] `<CuadroEstado letra="P" tono="exito" titulo="Presente, lunes 26" />` renderiza un único elemento con `role="img"` y `aria-label="Presente, lunes 26"`.
- [ ] El tipo rechaza una llamada sin `titulo` o sin `tono` (comprobado con `tsc`).
- [ ] Los cinco tonos de significado usan los mismos tokens de fondo, texto y acento que `Chip`; ningún hex ni primitiva aparece en el componente ni en su CSS.
- [ ] `tono="ninguno"` se renderiza con `border-style: dashed` y fondo transparente, medido en el estilo computado en navegador.
- [ ] En escala de grises, `ninguno` se distingue de `inactivo` por la forma (comprobado a ojo y por el estilo computado, no por el tono).
- [ ] El cuadro mide 30×30 px con una ventana de 640 px y 28×28 px con una de 641 px, medido en navegador.
- [ ] Móvil primero (§4bis): la regla de 30 px está fuera de toda `@media`, la de 28 px es la única que va dentro (`min-width: 641px`), y el cuadro no usa ninguna `max-width`. Con la hoja sin consultas, el cuadro sale a 30 px.
- [ ] La letra usa 13px y peso 600 computados, y no se corta dentro de 28×28 px.
- [ ] Siete cuadros en fila miden **menos de 360 px** de ancho sin desplazamiento horizontal a 360 y a 390 px, medido en navegador.
- [ ] El cuadro no recibe foco con tabulador y no tiene manejador de clic.
- [ ] Los pares de contraste de `sin-estado` (borde 3:1, letra 4,5:1) en claro y oscuro salen en verde en `verificar-contraste.mjs`, y `verificar-tono.mjs` sigue en verde.
- [ ] Un `letra` de longitud distinta de 1 dispara el aviso de desarrollo y no rompe el render.
- [ ] Los veinticinco pasos de `CLAUDE.md` §8 salen en verde, incluidos `verificar-promesa`, `verificar-omision`, `verificar-promesa-muerta` y `verificar-contrato`.
- [ ] Las pruebas nuevas se vieron fallar antes de la implementación (paso 1).

## Decisiones tomadas y descartadas

- **Sí:** componente nuevo `CuadroEstado` y no una variante de `Chip`. El filete de `Chip` es estructural y está pensado para texto (regla ya documentada); una letra suelta necesita otra forma. Se compone con los mismos tokens, no se reconstruye (política de creación, reglas 1 y 4).
- **No:** reutilizar `Chip` con un `chip-sin-filete` y ancho fijo. Obligaría a deshacer padding, filete y radio, y el resultado sería CSS propio sobre una pieza ajena.
- **Sí:** «sin estado» como un sexto tono, `ninguno`, y no como prop booleana ni como carácter mágico. Un solo eje decide el aspecto, sin combinaciones contradictorias. Decisión del responsable el 2026-11-01 (pidió un color autorizado que no se parezca a los demás estados).
- **Sí:** color de `ninguno` = `gris_700` mediante un token semántico nuevo. Decisión del responsable el 2026-11-01. Es un color ya autorizado, no amplía la lista.
- **No:** `identidad-2` (morado). Es el más lejano de los cinco estados, pero la identidad «agrupa, no informa» y ese morado ya marca una sede o turno en la misma pantalla. Se confundiría con un grupo.
- **No:** `identidad-1` (verde azulado). Queda a 18,4 CIEDE2000 de `exito`: se leería como «presente».
- **Reconocido:** el gris de `ninguno` es de la familia del gris de `inactivo`. Lo que los separa es la forma (punteado, sin relleno), no el tono; es lo que pide SC 1.4.1.
- **Sí:** `tono` y `titulo` obligatorios. Sin `titulo` el lector de pantalla solo diría «P»; sin `tono` el cuadro sería color-nada. Misma lógica que el texto obligatorio de `Chip`. Decisión del responsable el 2026-11-01.
- **Sí:** tamaño por **ventana**, con base de 30 px y 28 px desde 641 px. Decisión del responsable el 2026-11-01, que **sustituye** a la de contenedor tomada ese mismo día tras evaluar la factibilidad: la hoja no usa `@container` en ningún sitio, el cuadro no puede consultar un contenedor que nadie declara, y los candados de promesa, empate y muerta solo manejan `@media`. Respeta «móvil primero» (§4bis): el estado inicial es el estrecho.
- **No:** `@container`. Exigiría una pieza nueva que declare el contenedor, o que cada pantalla lo haga, y verificar o ampliar tres candados. Para una diferencia de 2 px en una pieza no interactiva no compensa.
- **Reconocido:** un panel estrecho dentro de una pantalla ancha recibe 28 px y no 30. Se acepta; la diferencia no afecta a la lectura ni al toque, porque el cuadro no es interactivo.
- **No:** prop `tamano`. Cada pantalla tendría que repetir la decisión y podría olvidarla.
- **Sí:** `role="img"` con `aria-label`. El cuadro es una imagen con nombre, no un control. **No** `title` como única vía: no se ve en un teléfono (§4bis).
- **Sí:** la leyenda queda fuera. Los usuarios táctiles solo ven la letra; que la pantalla explique «P = presente» es parte de su diseño, no de la pieza.
- **Sí:** la fila apilada de `TablaDatos` fuera de esta spec; se declara al equipo que hoy no existe y se pide aparte. Decisión del responsable el 2026-11-01. Mezclarla tocaría más de tres áreas.
- **Sí:** v1.149.0 (minor). Un componente nuevo y público; así se numeraron las piezas nuevas anteriores (v1.133.0, v1.140.0).
- **Sí:** 30 px es tamaño visual, no objetivo táctil: el cuadro no es interactivo, así que 2.5.8 no aplica. Se declara para que nadie lo lea como si lo fuera.
- **Sí:** nombre `CuadroEstado` y prefijo `cuadro`. Decisión técnica del agente; se reporta, no se consulta (`CLAUDE.md` §3).

## Riesgos

| Riesgo | Mitigación |
|---|---|
| El gris de `ninguno` se confunde con el de `inactivo` si alguien mira solo el color | La forma lo separa (punteado, sin relleno); criterio de aceptación en escala de grises |
| El par oscuro de `sin-estado` no alcanza 3:1 con `fondo-tarjeta` | Se elige entre colores autorizados y se mide en el paso 2, antes de escribir el componente; si ninguno alcanza, se detiene y se avisa |
| Un nuevo token cambia el recuento de pares del candado de contraste | La cifra publicada en `CLAUDE.md` se corrige con lo que mida el candado, no con una estimación |
| Siete cuadros no caben junto a la foto y el nombre a 390 px | La pieza mide ~234 px por sí sola (7×30 + 6 huecos de 4 px, a confirmar al medir); la maquetación de la fila es de la pantalla consumidora. Sin vista apilada, se pide aparte |
| El catálogo no pinta el componente en estático y los candados no lo ven | El paso 5 exige marcado estático (`pieza-sin-componente-no-esta-entregada`) |
| Los candados de promesa, empate o cascada no resuelven bien `@media (min-width: 641px)` (la hoja usa `max-width`) | El paso 3 los corre antes de seguir; si alguno la ignora, se detiene y se avisa en vez de pasar a `max-width` por comodidad |
| `verificar-forma` marca el componente y el tipo nuevos | Es una adición; se declara en el mismo commit, no se silencia |
| Versión mayor sin publicar | La publicación (`npm run publicar`) es un paso posterior y requiere petición expresa |

## Lo que **no** está en esta spec

- Una fila apilada para móvil en `TablaDatos`.
- Tonos nuevos de significado o una excepción a la regla de identidad.
- Interactividad, foco, menú o descripción emergente.
- La leyenda de letras y la pantalla `clasificacion-semanal`.
- Un círculo u otra forma.
- Verificación en `devgestion` y publicación.
