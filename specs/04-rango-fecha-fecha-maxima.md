# SPEC 04 — RangoFecha: una fecha máxima (`fechaMaxima`)

> **Estado:** Borrador
> **Depende de:** ninguna (SPEC 03 ya está implementada en v1.149.0; no interviene)
> **Fecha:** 2026-11-01
> **Objetivo:** Añadir a `RangoFecha` la prop opcional `fechaMaxima`, que apaga en el calendario los días posteriores a ella, en los dos extremos, y que se combina con `maxDias`.

## Por qué existe esta spec

Requerimiento **R166** (numerado por el equipo, no acuñado aquí), prioridad media, comprobado por el equipo contra v1.148.2. Bloquea su tablero `/control-de-asistencia/tableros/clasificacion-semanal` (SPEC 14 del equipo) y sirve igual a los reportes diario, semanal y mensual.

El caso: las consultas sobre **hechos ya ocurridos** no tienen respuesta para el futuro. En el reporte de asistencia, un día futuro con horario y sin marcas sale como **falta**, que es una afirmación falsa. El dueño pidió que el calendario **impida** elegirlos, no que avise después: la fecha final llega como máximo a hoy, y inicio y final pueden ser los dos hoy.

El texto del requerimiento llegó por `/spec`; no hay fichero `requerimiento-R166-*.md` en `peticiones/` y esta spec no lo crea.

Hechos verificados en el repositorio el 2026-11-01 (rama `work`, versión 1.149.0 en `package.json`; `RangoFecha.tsx` no cambió desde v1.124.0):

- `componentes/src/RangoFecha.tsx` tiene `maxDias` (línea 70), que limita la **longitud** del rango y no una fecha. La prop `hoy` (línea 28) solo calcula los atajos y el mes de apertura; **no bloquea ningún día**.
- `maxDias` **impide** al elegir —`fueraDeAlcance` (línea 534), días con `aria-disabled` y nombre accesible que dice por qué (línea 925-933)— y **avisa sin reescribir** cuando el rango llega ya puesto por props (`excede`, línea 537; el aviso entra en `elError`, línea 562). Sanea **su propio argumento**: un valor que no es tope avisa en desarrollo y se ignora (líneas 436-447).
- **No hay campo de texto**: los dos extremos son botones que abren el calendario. «Al escribir» de la petición no aplica; el único camino de entrada de un valor es `desde`/`hasta` por props.
- Los atajos que no caben en `maxDias` no se pintan (`atajosQueCaben`, línea 493). Los cuatro de `ATAJOS_POR_OMISION` van de un mes a un año y casi todos terminan en el futuro: con `fechaMaxima` en hoy, la mayoría **desaparecería** del panel.
- Los botones de mes (`Mes anterior` / `Mes siguiente`, líneas 843-852) no tienen tope. Las fechas se leen con `deIso` (formato ISO `AAAA-MM-DD`).
- El contrato «Rango de fechas» (`sistema/componentes/comportamiento.md`, línea 429) llega a la regla **11** y declara sus archivos de prueba: `RangoFecha.test.tsx`, `rango-fecha-anatomia.test.tsx`, `calendario-catalogo.test.tsx`.

## Alcance

**Dentro:**

- Prop opcional `fechaMaxima?: string | Date` en `RangoFechaProps` (cadena ISO `AAAA-MM-DD`, o `Date`; se toma el día local, sin hora).
- Los días **posteriores** a `fechaMaxima` salen apagados (`aria-disabled`) en el calendario, en «Desde» **y** en «Hasta». `fechaMaxima` en sí se puede elegir, como inicio y como final a la vez (un rango de un día).
- El nombre accesible de un día apagado por la máxima dice por qué («, posterior al máximo del …»), como ya hace el de `maxDias`.
- Los atajos (`atajos`, `ATAJOS_POR_OMISION`, `atajosDeDias`) cuyo `hasta` pasa de `fechaMaxima` **no se pintan**, igual que los que no caben en `maxDias`.
- Un rango que llega ya puesto por `desde`/`hasta` con una fecha posterior: **se avisa con error y no se reescribe** (como `excede` con `maxDias`). El `error` del producto manda sobre este aviso.
- Se sanea el propio argumento: una `fechaMaxima` que no es fecha válida avisa en desarrollo (mismo patrón que `maxDias`, `process.env.NODE_ENV !== 'production'`) y se ignora.
- **Navegación acotada:** los botones de mes no permiten mostrar meses **enteramente posteriores** a `fechaMaxima`. `Mes siguiente` se apaga con `aria-disabled` cuando el último mes visible ya contiene la máxima (o es posterior); el teclado (PageDown, flechas) no sale de esos meses. La apertura se ajusta para que no se vea un mes entero posterior a la máxima.
- Combinación con `maxDias`: **ambos topes valen a la vez**; en «Hasta», el techo es el menor de los dos.
- Sin la prop, el comportamiento actual **no cambia**.
- Pruebas, contrato en `comportamiento.md` (reglas nuevas, cada una con su prueba), catálogo (texto, código y fila de props de la página «Fecha y rango»), entrada de versión.
- Subida de versión a **v1.150.0** (prop nueva y opcional: minor) y reescritura de los números de estado de `memoria/01-estado.md` y `CLAUDE.md` §1.

**Fuera de alcance:**

- `fechaMinima` (el equipo no la necesita; si la quieren por simetría, es otra spec).
- Que el componente conozca «hoy» o la zona horaria de la empresa: la app pasa la fecha, como hace con `hoy`.
- Cambiar `maxDias`, los atajos por omisión o el aspecto.
- Un calendario interactivo nuevo en el catálogo con `fechaMaxima` (el catálogo documenta la prop; ver Decisiones).
- La pantalla `clasificacion-semanal` y su API (viven en el repositorio del equipo).
- La verificación en `devgestion` y la publicación (`npm run publicar`): son pasos posteriores.

## Modelo de datos

Una prop nueva; no cambia ningún tipo existente.

```ts
export type RangoFechaProps = {
  // …las existentes, sin cambios…
  /**
   * R166 · Último día elegible, **inclusive**. Los posteriores salen apagados en
   * los dos extremos. Sin pasarla no hay límite. Se combina con `maxDias`.
   * El componente no conoce «hoy»: la app pasa la fecha.
   */
  fechaMaxima?: string | Date;
};
```

Convenciones:

- **Lectura:** cadena con `deIso`; `Date` normalizado a medianoche local. Una cadena que no es fecha, o un `Date` inválido, no es un tope: avisa en desarrollo y se ignora, sin romper el render.
- **Techo de «Hasta»:** `min(inicio + maxDias − 1, fechaMaxima)`. **«Desde»:** el día elegible más tardío es `fechaMaxima`; con `maxDias` y un final elegido, además `final − (maxDias − 1)` es el suelo (sin cambios).
- **Aviso de rango ya puesto:** «La fecha no puede ser posterior al dd/mm/aaaa.» Entra en `elError` después del `error` del producto y de los avisos que hoy lo preceden, y no reescribe `desde`/`hasta`.
- **Nombre accesible del día apagado por la máxima:** `, posterior al máximo del <fecha en palabras>`. Si lo apagan los dos topes, dice el que corresponde sin mezclarlos.
- **Navegación:** `Mes siguiente` usa `aria-disabled` y no `disabled`, para no perder el foco al llegar al último mes permitido (mismo criterio que los días apagados).

## Plan de implementación

0. Requisitos previos: se parte de `work` actualizado y la rama se comprueba **antes** de la primera edición (`CLAUDE.md` §8); la rama de trabajo es una temporal que sale de `work` (por ejemplo `feat/2026-11-01-fecha-maxima`); las dependencias están dentro del contenedor.
1. Escribir las pruebas y verlas fallar, en `RangoFecha.test.tsx` y `rango-fecha-anatomia.test.tsx` (titulándolas `R166 · …` para que el candado del contrato las ate): con `fechaMaxima` en hoy se puede elegir hoy como inicio y como final, y no mañana en ninguno de los dos; con `Date` y con cadena; los atajos que pasan de la máxima no se pintan; rango ya puesto posterior avisa y no se reescribe; `error` del producto manda; argumento inválido avisa en desarrollo y se ignora; combinada con `maxDias={7}` valen los dos; `Mes siguiente` apagado en el último mes permitido y el teclado no sale; sin la prop, nada cambia (las pruebas existentes pasan sin tocarse).
2. Implementar `fechaMaxima` en `RangoFecha.tsx`: lectura y saneo del argumento, `fueraDeAlcance` combinando ambos topes, filtro de atajos, aviso de rango ya puesto, nombre accesible del día apagado, y `aria-disabled` en `Mes siguiente` con el límite en la navegación por botón y por teclado. Las pruebas del paso 1 pasan.
3. Actualizar el catálogo (`sistema/cascaron/generar-cascaron.mjs`, página «Fecha y rango»): párrafo, ejemplo de código con `fechaMaxima` y su fila en la tabla de props, con marcado estático. Regenerar con `generar-cascaron.mjs` y `extraer.mjs`. Si se necesita CSS, va en la plantilla del generador, **no** en `componentes.css` (es derivado).
4. Escribir las reglas nuevas en la sección «Rango de fechas» de `comportamiento.md`, continuando la numeración (12 en adelante), cada una **Obligatorio**, citando `(R166, v1.150.0)` y con su prueba. El comentario `<!-- pruebas: -->` de la sección ya incluye los archivos necesarios.
5. Subir la versión a 1.150.0 (`package.json` y `componentes/package.json`), añadir la entrada en `CAMBIOS` de `sistema/tokens/fuente.mjs` (sin tokens), actualizar `manual/ACTUALIZAR.md`, corregir los números de `memoria/01-estado.md` y de `CLAUDE.md` §1, y `MEMORY.md`.
6. Correr los veinticinco pasos de `CLAUDE.md` §8 en verde, más `tsc --noEmit` y las pruebas; medir en navegador a 360 px.

## Criterios de aceptación

- [ ] Con `fechaMaxima` en hoy, el calendario de «Desde» y el de «Hasta» dejan elegir **hoy** y apagan **mañana** (`aria-disabled`), medido en navegador y por prueba.
- [ ] Hoy se puede elegir como inicio y como final a la vez: el rango resultante es de un día y `onCambio` lo entrega.
- [ ] `fechaMaxima` acepta `string` ISO y `Date`, con el mismo resultado; una hora dentro del `Date` no mueve el día.
- [ ] Un atajo cuyo `hasta` pasa de `fechaMaxima` no se pinta; uno que cabe sí. Con la máxima en hoy, «Hoy» (de `atajosDeDias(1)`) sigue pintado.
- [ ] Un rango que llega ya puesto con `hasta` (o `desde`) posterior a la máxima muestra el aviso y **no se reescribe**: `onCambio` no se llama y los valores mostrados son los recibidos. Un `error` del producto manda sobre él.
- [ ] Una `fechaMaxima` inválida avisa en desarrollo, se ignora y no rompe el render.
- [ ] Con `fechaMaxima` y `maxDias={7}` a la vez, los dos topes se cumplen: no se puede elegir mañana ni un final a más de siete días del inicio; el techo de «Hasta» es el menor de los dos.
- [ ] El nombre accesible de un día apagado por la máxima dice que es posterior al máximo, y el de uno apagado por `maxDias` sigue diciendo lo de siempre.
- [ ] `Mes siguiente` queda apagado (`aria-disabled`, sin perder el foco) cuando el último mes visible contiene la máxima, y PageDown / flechas no muestran un mes entero posterior. Con `meses={1}` y con `meses={2}`.
- [ ] Sin `fechaMaxima`, el componente se comporta como antes: las pruebas existentes de `RangoFecha` pasan sin modificarse, y `verificar-promesa` y `verificar-forma` siguen en verde.
- [ ] A 360 px, con `fechaMaxima`, el calendario no desborda ni obliga a deslizar, medido en navegador.
- [ ] Cada regla nueva del contrato tiene su prueba declarada y `verificar-contrato` sale en verde.
- [ ] Los veinticinco pasos de `CLAUDE.md` §8 salen en verde, y `tsc --noEmit` y la suite de `componentes/` también.
- [ ] Las pruebas nuevas se vieron fallar antes de la implementación (paso 1).

## Decisiones tomadas y descartadas

- **Sí:** prop `fechaMaxima`, nombre propuesto por el equipo («por ejemplo»); `string | Date` porque `desde`/`hasta` son cadenas y `hoy` es `Date`, y la app ya tiene a mano cualquiera de los dos. Decisión técnica del agente; se reporta (`CLAUDE.md` §3).
- **Sí:** inclusiva (`fechaMaxima` se puede elegir). Es lo que pide el equipo y coincide con cómo cuenta `maxDias`.
- **Sí:** un rango que llega ya puesto con fecha posterior se **avisa y no se reescribe**. Decisión del responsable el 2026-11-01. El «se sanea igual que `maxDias`» de la petición se lee así porque es lo que `maxDias` hace de verdad: sanea su argumento y avisa sobre el rango ya puesto; recortarlo cambiaría el dato de alguien en silencio.
- **No:** recortar el rango al máximo. Cambia un dato guardado sin que nadie lo haya elegido.
- **No:** ignorar el rango ya puesto. Es el fallo silencioso que la petición quiere evitar.
- **Sí:** los atajos que pasan de la máxima **no se pintan**. Decisión del responsable el 2026-11-01; es lo que pide el equipo y lo que ya hace `maxDias`. **Consecuencia aceptada:** con la máxima en hoy, los cuatro atajos de omisión casi desaparecen y la app pasa los suyos con `atajosDeDias`; se declara en el catálogo.
- **No:** recortar los atajos a la máxima («Este mes» pasaría a ser «del 1 a hoy»): cambia lo que el atajo significa.
- **Sí:** `Mes siguiente` se apaga cuando el último mes visible contiene la máxima. Decisión del responsable el 2026-11-01. Evita enseñar meses enteros vacíos. Implica tocar la navegación por botón y por teclado y sus pruebas.
- **No:** dejar navegar a meses futuros con los días apagados (era la alternativa mínima y la recomendada por el agente; el responsable eligió la otra).
- **Sí:** `aria-disabled` y no `disabled` en `Mes siguiente`: un botón `disabled` pierde el foco cuando se alcanza el último mes permitido, y quien navega con teclado se queda sin sitio. Es el mismo criterio que ya fundamenta los días apagados (línea 910-914).
- **Sí:** el nombre accesible del día apagado dice por qué. Un día que «no responde» sin razón es lo que la nota de la línea 910 ya prohíbe.
- **No:** `fechaMinima`: sin caso hoy.
- **No:** que el componente conozca «hoy» o la zona horaria: la app lo pasa.
- **Sí:** v1.150.0 (minor). Es una prop nueva y opcional, sin cambio de comportamiento por omisión; así se numeraron las adiciones anteriores.
- **Sí:** el catálogo **documenta** la prop (texto, código y fila de props), pero no estrena un calendario interactivo nuevo. El calendario del catálogo es su propio guion y no el componente (`memoria`, «el catálogo no puede enseñarlo todo»): la prueba real de la prop es la suite del componente.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Apagar `Mes siguiente` y acotar el teclado rompe pruebas de navegación existentes | Las pruebas existentes no pasan `fechaMaxima` y no deben cambiar; el paso 1 incluye «sin la prop, nada cambia» |
| `Mes siguiente` apagado deja a un usuario de teclado sin foco | `aria-disabled` y no `disabled`; criterio de aceptación explícito con foco |
| Combinar dos topes con un orden equivocado deja pasar un día | Prueba de los cuatro casos: solo máxima, solo `maxDias`, los dos con una más estricta que la otra, y los dos a la vez |
| Con la máxima anterior a `hoy` el calendario abriría en meses enteros apagados | La apertura se ajusta para no mostrar un mes enteramente posterior; prueba en el paso 1 |
| Un rango guardado ayer con `hasta` = mañana avisa hoy sin que el usuario lo sepa | Es el comportamiento elegido; el aviso lo dice y el producto decide qué hacer (`error` manda) |
| Hora dentro de un `Date` mueve el día según la zona horaria | Se normaliza a medianoche local; prueba con `Date` a las 23:59 |
| El catálogo no enseña la prop funcionando | Se declara; la suite de `RangoFecha` es la prueba real |
| Los atajos de omisión desaparecen con la máxima en hoy y el equipo no lo espera | Declarado en el catálogo y en el contrato; `atajosDeDias` lo resuelve en una línea |

## Lo que **no** está en esta spec

- Una `fechaMinima`.
- Que el componente conozca «hoy» o la zona horaria de la empresa.
- Cambios en `maxDias`, en los atajos por omisión o en el aspecto.
- Un calendario interactivo nuevo en el catálogo.
- La pantalla `clasificacion-semanal`, su API y la verificación en `devgestion`.
- La publicación (`npm run publicar`).
