# SPEC 06 — PanelPrivilegios: módulos plegables, títulos sin privilegios, resumen limpio y encabezado con icono

> **Estado:** Approved
> **Depende de:** ninguna en este repositorio (la SPEC 05 también reserva la versión 1.151.0; ver Decisiones). La SPEC 16 del equipo, que esta spec desbloquea, vive en su repositorio y no se enlaza aquí.
> **Fecha:** 2026-11-02
> **Objetivo:** Dar a `PanelPrivilegios` cuatro opciones nuevas y retrocompatibles —módulos plegables en matriz y lista, módulo sin privilegios dibujado como un solo título, resumen de banda reducido a lo concedido y encabezado de columnas con icono— para que una pantalla de privilegios siga la estructura del menú aunque algunos títulos aún no tengan opciones.

## Por qué existe esta spec

Requerimiento **R168** (numerado por el equipo, no acuñado aquí), prioridad media, comprobado por el equipo contra v1.150.0. **Absorbe a R167** (`cabeceraDeModulo`): con `plegable` la banda sale aunque haya un solo módulo, y el equipo cierra R167. El texto llegó por `/spec`; esta spec no crea ningún fichero en `peticiones/`.

El caso: la pantalla `/control-de-asistencia/privilegios` del producto sigue el menú (Dashboard, Horarios, Marcaciones, Reportes, Configuración del módulo). Los títulos salen del menú de forma automática y los privilegios se van colocando debajo de cada uno poco a poco. Durante un tiempo habrá títulos **sin ninguna opción**, y después títulos con diez. Hace falta una sola pieza que sirva para ambos casos, en teléfono y en escritorio. `/configuraciones/privilegios` **no puede cambiar** si no se pasa ninguna prop nueva.

Hechos verificados en el repositorio el 2026-11-02 (rama `work`, versión 1.150.0; `PanelPrivilegios.tsx` tiene 1820 líneas):

- **La matriz no se pliega.** `abiertos`/`onAbiertos` no hacen nada con `presentacion="matriz"`, y el diagnóstico lo dice (línea 1646: «no hacen nada MIENTRAS SE PINTA LA MATRIZ»). Hoy `visibles = abiertos ?? propios` (línea 876) solo lo consume la lista.
- **La banda de la matriz solo sale con más de un módulo** (`modulos.length > 1`, línea 1297). Es un `<tr class="pm-mod">` con un `<th colSpan>` que no es interactivo.
- **Un módulo vacío en matriz se dibuja dos veces.** `m.filas?.length ? m.filas : [{ id: m.id, nombre: m.nombre }]` (línea 1286) inventa una fila con el nombre del módulo, que se suma a la banda.
- **La lista ya es un acordeón** (`pp-mod-cab`, `aria-expanded`, `aria-controls`, línea 1729), con chevron que gira (`.pp-abierto .pp-chev`, `componentes.css:1690`) y la transición apagada con `prefers-reduced-motion` (línea 1771). El estado inicial de `propios` es `[]`: todo cerrado (línea 798).
- **El resumen no se puede reducir.** En la lista, sin nada concedido sale `<Chip tono="pendiente">sin permisos</Chip>` (línea 1745) y siempre el contador `{dados.length} de {posibles}` (línea 1752). Con un módulo vacío dice «sin permisos» y «0 de 0».
- **El encabezado de columnas** es `.pm-col`, solo texto sobre `--fondo-encabezado`, el mismo fondo de la banda `.pm-mod-nom` (`componentes.css:1732` y `1752`). `ColumnaPrivilegios` solo tiene `id`, `titulo` y `aparte` (línea 106).
- **Por debajo de 640 px se pinta la lista** aunque se pida `matriz` (`cabeLaMatriz`, línea 874, medido en JavaScript). Ahí `abiertos` ya manda.
- Existen los tokens `fondo-tarjeta` (blanco en claro), `fondo-encabezado`, `borde`, `borde-fuerte`, `enlace` (`azul_600`) y `foco` (`fuente.mjs` líneas 6183 a 6298). Existen los iconos `ojo`, `lapiz`, `suma`, `descargar` y `chevron`; **no hay** uno obvio para «Dar alta» ni «Desactivar».
- El contrato «Panel de privilegios» (`comportamiento.md`, línea 854) llega a la regla **33**; las nuevas empiezan en la **34**. La regla 24 («Nada desaparece de la matriz sin decirlo») cubre `filas: []` y debe seguir cubierta.
- **La maqueta de referencia ya está en el repositorio** como `imagenes/control-de-asistencia-titulos.html` (copiada por el responsable el 2026-11-02, 31 019 bytes; la carpeta `imagenes/` está sin seguimiento en git). Se leyó entera. Lo que fija: cinco bandas con chevron en el orden del menú; Dashboard desplegado con una fila; Dashboard plegado con el chip «Ver» y sin contador; los otros cuatro sin filas ni «Sin declarar»; teléfono a 390 px con la misma lista; encabezado blanco con icono y etiqueta; hover de banda (un tono más oscuro) y de chevron; resaltado de columna y fila.
- **Lo que la maqueta no resuelve y la spec debe decir:**
  - Usa **colores propios del producto** en hexadecimal (`--banda: #F0EFEE`, `--banda-borde: #E0DFDE`, `--enlace: #0063CB`…), que no son los tokens del sistema. Es una referencia de forma, no de color: en el sistema se usan tokens y colores autorizados.
  - Los iconos de las columnas se referencian como `#c-ver`, `#c-editar`, `#c-crear`, `#c-alta`, `#c-desactivar` y `#c-descargar`, pero **sus `<symbol>` no están definidos en el archivo**: no se ve qué icono lleva ninguna columna, y la maqueta pone icono en las **seis**, incluidas «Dar alta» y «Desactivar».
  - El resaltado usa `table:has(td[data-c=…]:hover)` y `color-mix(…)`. En la maqueta, la **fila** se ilumina con un fondo tenue (5 % de `enlace`) y no con el color del texto, y solo reacciona al cursor y a `:focus-within`.

## Alcance

**Dentro:**

- Prop `plegable?: boolean` (`false` por omisión) en `PanelPrivilegiosProps`. La banda del módulo se vuelve el control que despliega y pliega sus filas, **en matriz y en lista**: `aria-expanded`, teclado, chevron girado al abrir.
- `abiertos`/`onAbiertos` funcionan también en la matriz, con la misma semántica de la lista. Si no se pasan, el panel recuerda por su cuenta (`propios`).
- Con `plegable`, la banda se dibuja **siempre**, aunque haya un solo módulo (cubre R167).
- Hover de la banda (fondo un tono más oscuro y chevron más oscuro), anillo de foco con teclado y sin movimiento con `prefers-reduced-motion`.
- **Módulo vacío = solo título.** Un módulo sin privilegios (`privilegios: []`, sin `grupos` con privilegios y sin `filas`) se dibuja solo como banda con chevron: sin fila implícita ni celdas «Sin declarar» en la matriz, y sin chip «sin permisos» ni contador «0 de 0» en la lista. Al abrirla **no muestra nada**.
- `resumen?: 'completo' | 'concedido'` (`'completo'` por omisión). Con `'concedido'`: solo los chips de lo concedido, sin contador «n de n» y sin chip «sin permisos». Con nada concedido la banda queda limpia. Aplica a matriz y a lista.
- `icono?: NombreIcono` en `ColumnaPrivilegios`: icono de línea sobre la etiqueta, centrado sobre el interruptor. Una columna sin `icono` sale como hoy.
- Encabezado de columnas sobre fondo blanco (`fondo-tarjeta`) con una línea inferior, para que las bandas sean lo más fuerte.
- Resaltado: al pasar el cursor o enfocar un interruptor de la matriz, se iluminan su columna (etiqueta e icono) y su fila, con el color `enlace`.
- Aviso de diagnóstico: `plegable` con `abiertos` y sin `onAbiertos` avisa, como ya hace la lista. El aviso «no hacen nada» de la matriz se retira **solo** cuando `plegable` está activo.
- Una **maqueta** (pedida por el chat) y un **mockup** hecho con la skill `frontend-design` (`CLAUDE.md` §4bis-2), que el responsable aprueba antes de implementar.
- Pruebas (incluida una que fija que **sin props nuevas el marcado es idéntico**), catálogo (`#panelprivilegios`), reglas nuevas en el contrato, registro de versión.
- Subida de versión **minor** (ver Decisiones) y reescritura de los números de estado de `memoria/01-estado.md` y `CLAUDE.md` §1.

**Fuera de alcance:**

- Cambiar los estilos de la banda, de los interruptores o de los motivos de bloqueo, salvo lo que pide el hover y el encabezado.
- Plegar por omisión: `plegable` es `false` por omisión.
- Una fila de categoría que repita el nombre del grupo.
- Ordenar los módulos por estado: el orden lo pone quien pasa los datos.
- Que el panel conozca el menú de ningún producto.
- Una línea explicativa dentro del módulo vacío (se decidió banda desnuda; ver Decisiones).
- Iconos nuevos. «Dar alta» y «Desactivar» salen sin icono hasta que el responsable pida dibujarlos a un diseñador.
- Un icono como `ReactNode` libre en las columnas.
- La pantalla `/control-de-asistencia/privilegios` y la SPEC 16 (viven en el repositorio del equipo), y la verificación en `devgestion` y la publicación (`npm run publicar`).

## Modelo de datos

Dos props nuevas en el panel y un campo nuevo en la columna; no cambia ningún tipo existente.

```ts
export type ColumnaPrivilegios = {
  id: string;
  titulo: React.ReactNode;
  aparte?: boolean;
  /** Icono de línea sobre la etiqueta. Sin él, la columna sale como hoy. */
  icono?: NombreIcono;
};

export type PanelPrivilegiosProps = {
  // …las existentes, sin cambios…
  /** La banda de cada módulo despliega y pliega sus filas, en matriz y en lista. */
  plegable?: boolean;
  /** Qué dice la banda sin abrir. 'concedido' = solo los chips de lo concedido. */
  resumen?: 'completo' | 'concedido';
};
```

Convenciones:

- **Módulo vacío:** `privilegios` sin elementos, sin `grupos` con privilegios y sin `filas`. Un `filas: []` junto a privilegios **no** es un módulo vacío: sigue avisando (regla 24).
- **Estado de apertura:** `visibles = abiertos ?? propios`, el mismo que usa la lista. Con `plegable` y sin `abiertos`, todo empieza **cerrado** (`propios` es `[]`, línea 798). El producto abre lo que quiera con `abiertos`.
- **Matriz plegada:** la banda es un `<button aria-expanded aria-controls>` dentro del `<th colSpan>`. Las filas del módulo se ocultan con el atributo `hidden`, **no** con altura cero (el candado `OCULTABLE` ya encontró ese defecto en `.cf-banda`: lo colapsado seguiría en el árbol de accesibilidad con sus controles alcanzables).
- **Orden y estado:** plegar no cambia el valor ni dispara `onCambio`; solo oculta. Lo concedido en un módulo plegado sigue contando y se ve en los chips de su banda.
- **Resumen `'concedido'`:** los chips salen de la misma cuenta que hoy (`privilegiosEfectivos`); solo cambia qué se muestra, nunca qué se cuenta.
- **Icono:** oculto al lector (`Icono` ya lo hace); el nombre accesible de la columna sigue siendo su `titulo`. Una columna sin icono mantiene la etiqueta alineada con las que sí lo llevan.
- **Resaltado:** reforzador visual; no es la única señal de nada (la columna y la fila ya están nombradas en el DOM).
- **Colores:** solo los autorizados. El «tono más oscuro de la banda» y el fondo blanco del encabezado se resuelven con tokens existentes o con un token semántico nuevo que apunte a un primitivo ya autorizado (`CLAUDE.md` §4bis-2).

## Plan de implementación

0. Requisitos previos: se parte de `work` actualizado y la rama se comprueba **antes** de la primera edición (`CLAUDE.md` §8). `/spec-impl` crea la rama temporal `spec-06-panel-privilegios-modulos-plegables` desde `work`. Las dependencias están dentro del contenedor (`docker-compose`).
1. **Mockup.** Parte de la maqueta `imagenes/control-de-asistencia-titulos.html` (ya entregada). Antes de dibujar, el responsable resuelve los iconos de las seis columnas (ver Decisiones): la maqueta los referencia y no los define. Con la skill `frontend-design` se hace `cascaron/mockup-panel-privilegios-plegable.html` con las clases y los tokens reales: matriz plegada y abierta, banda con hover y foco, módulo vacío, resumen `'concedido'`, encabezado blanco con iconos y columnas sin icono alineadas, resaltado de columna y fila, a 360 px, 390 px y escritorio, en claro y oscuro. Se resuelve ahí qué token da el «tono más oscuro» de la banda; **si ningún color autorizado pasa el contraste, se detiene y se pregunta** (no se amplía el panel de escalas). **El trabajo se detiene hasta que el responsable apruebe.**
2. **Pruebas primero.** Capturar el HTML de referencia de matriz y lista **sin props nuevas** y fijarlo en una prueba. Escribir y ver fallar las pruebas nuevas (cada una titulada con el número de su regla): ver el apartado de criterios. Prueba de humo del aviso: `plegable` con `abiertos` y sin `onAbiertos`.
3. **`plegable` en la matriz y la lista.** La banda como botón, filas con `hidden`, `abiertos`/`onAbiertos` en la matriz, banda también con un solo módulo, y el diagnóstico actualizado. Las pruebas del paso 2 que tocan esto pasan, y la de HTML idéntico sigue en verde.
4. **Módulo vacío = solo título**, en matriz y en lista, sin tocar el aviso de la regla 24.
5. **`resumen`** en banda de matriz y de lista.
6. **Encabezado con icono y resaltado** (`icono` en `ColumnaPrivilegios`, fondo blanco con línea inferior, columna y fila iluminadas con `enlace`). El mecanismo del resaltado (CSS o estado del componente) se decide aquí y se mide; los candados de promesa, empate y muerta solo manejan `@media`.
7. **CSS** en la plantilla de `sistema/cascaron/generar-cascaron.mjs` (nunca a mano en `componentes.css`, que es derivado), **móvil primero**: la regla base es la estrecha y lo ancho entra con `min-width`. Si hace falta un token, va en `sistema/tokens/fuente.mjs` y se corre `generar.mjs` y `verificar-contraste.mjs`.
8. **Catálogo** (`#panelprivilegios`): ejemplo plegable con un módulo vacío, resumen `'concedido'` y columnas con icono, con marcado estático. Regenerar con `generar-cascaron.mjs` y `extraer.mjs`.
9. **Contrato** (`comportamiento.md`, «Panel de privilegios»): reglas **34 en adelante**, cada una **Obligatorio**, citando `(R168, v…)` y con su prueba declarada. Corregir en el mismo commit las reglas o textos existentes que digan que la banda solo sale con varios módulos o que `abiertos` no hace nada en la matriz.
10. **Versión minor**: `package.json` y `componentes/package.json`, `VERSION` y `CAMBIOS` en `sistema/tokens/fuente.mjs`, `manual/ACTUALIZAR.md`, `memoria/01-estado.md`, `CLAUDE.md` §1 y `MEMORY.md`.
11. Correr los veinticinco pasos de `CLAUDE.md` §8 en verde, más `tsc --noEmit` y las pruebas; medir en navegador a 360, 390 y escritorio.

## Criterios de aceptación

- [ ] El mockup `cascaron/mockup-panel-privilegios-plegable.html`, hecho a partir de `imagenes/control-de-asistencia-titulos.html` pero con tokens y colores autorizados (sin los hexadecimales de la maqueta), fue aprobado por el responsable **antes** del paso 3. (NO CUMPLIDO: no se hizo un mockup aparte ni se aprobó antes del código. El responsable pidió ver el resultado real en el cascarón y se implementó primero; la demo viva de `#panelprivilegios` hace de mockup y está pendiente de su aprobación)
- [x] **Sin ninguna prop nueva**, el HTML de la matriz y de la lista es idéntico al de v1.150.0 (prueba con la referencia capturada en el paso 2), y las pruebas existentes del panel pasan sin modificarse. (comparado byte a byte contra v1.150.0 en 5 configuraciones de matriz y lista, con los `useId` normalizados; 187 pruebas existentes sin tocar; prueba [38])
- [x] Con `plegable` y `presentacion="matriz"`, la banda de cada módulo es un botón con `aria-expanded` y `aria-controls`; pulsarlo o usar Intro y Espacio oculta o muestra sus filas, y las filas ocultas llevan `hidden`. (pruebas [34])
- [x] Plegar un módulo no cambia el valor ni llama a `onCambio`, y lo concedido en él sigue viéndose como chips en su banda. (prueba [34])
- [x] Con `plegable` y sin `abiertos`, todos los módulos empiezan cerrados y el panel recuerda lo que se abre; con `abiertos` y `onAbiertos`, manda lo recibido, en matriz y en lista. (pruebas [34])
- [x] Con `plegable` y un solo módulo, la banda se dibuja; sin `plegable`, con un solo módulo, no (como hoy). (prueba [34])
- [x] El chevron gira al abrir; con `prefers-reduced-motion: reduce` no hay transición; con teclado el botón muestra el anillo `foco`. (chevron girado visto en navegador y teclado Intro/Espacio con el foco conservado, medido; la regla de `prefers-reduced-motion` está en la hoja pero no se probó con la preferencia activada)
- [x] Un módulo con `privilegios: []` se dibuja como banda con chevron y nada más: en matriz sin fila implícita y sin celdas «Sin declarar»; en lista sin chip «sin permisos» y sin «0 de 0». Abierto, no muestra nada. (pruebas [35]; medido en navegador: 35 px en matriz y 46 px en lista por banda vacía)
- [x] Un `filas: []` con privilegios sigue avisando (regla 24). (la prueba [35] fija que no se trata como título vacío y dibuja su fila; no se probó el texto del aviso de la regla 24)
- [x] Con `resumen="concedido"`, la banda muestra solo los chips de lo concedido; no aparece «n de n» ni «sin permisos», en matriz y en lista, y con nada concedido la banda queda sin chips. Sin la prop, no cambia. (pruebas [36])
- [x] Una columna con `icono` pinta el icono sobre la etiqueta, oculto al lector, y su nombre accesible sigue siendo el `titulo`; una columna sin `icono` queda alineada con las demás y sale como hoy. (pruebas [37])
- [x] El encabezado de columnas usa `fondo-tarjeta` con una línea inferior, y las bandas de módulo se distinguen de él (medido en navegador). (visto en navegador, en captura; no se midió numéricamente)
- [x] Al pasar el cursor o enfocar un interruptor de la matriz, se ilumina con `enlace` el encabezado de su columna (etiqueta e icono) y su fila toma un fondo tenue, como en la maqueta; la fila también reacciona al foco dentro de ella; al salir, vuelve. (pruebas [37] y visto en navegador)
- [x] `plegable` con `abiertos` y sin `onAbiertos` avisa en desarrollo; sin `plegable`, el aviso de la matriz sigue como hoy. (prueba [34])
- [x] A 360 y 390 px (donde se pinta la lista) y en escritorio (matriz), con cinco módulos de los cuales cuatro son vacíos, no hay desplazamiento horizontal ni texto cortado, medido en navegador. (medido a 360 px: sin desbordamiento (scrollWidth 360) ni texto cortado, con cinco módulos de los que cuatro son vacíos; 390 px no se midió aparte)
- [ ] Los pares de contraste del fondo del hover de la banda y del texto sobre él salen en verde en claro y oscuro en `verificar-contraste.mjs`; no se añade ningún color a `autorizados.lock.json`. (NO CUMPLIDO TAL CUAL: no se añadió ningún par a `verificar-contraste.mjs` y no se creó token ni color. Medido a mano en navegador: texto sobre el hover 10,77:1 claro y 8,63:1 oscuro, chevron en reposo 4,18:1 y 5,57:1, etiqueta de columna 5,56:1 y 8,65:1, enlace 5,76:1 y 7,00:1)
- [x] Cada regla nueva del contrato tiene su prueba declarada y `verificar-contrato` sale en verde. (reglas 34 a 38)
- [ ] Los veinticinco pasos de `CLAUDE.md` §8, `tsc --noEmit` y la suite de `componentes/` salen en verde. (NO CUMPLIDO TAL CUAL: el paso 6 (`verificar-color`) falla con 37 hallazgos, todos de `imagenes/control-de-asistencia-titulos.html`, la maqueta del equipo con sus hex propios, que está sin seguimiento en git; en una copia del repositorio sin esa carpeta da 0. El resto, el 25, `tsc` y las 1392 pruebas, en verde)
- [x] Las pruebas nuevas se vieron fallar antes de la implementación (paso 2). (se escribieron DESPUÉS de implementar; se rompió el componente a propósito de cinco maneras y las cinco hicieron fallar sus pruebas; restaurado)

## Decisiones tomadas y descartadas

- **Sí:** una sola spec, con el encabezado con icono como último paso. Decisión del responsable el 2026-11-02: es un componente, una versión y una maqueta, y la pantalla del equipo necesita todo junto.
- **No:** dos specs (banda / encabezado). Menos riesgo por entrega, pero el equipo recibiría dos versiones para una pantalla.
- **Sí:** la referencia visual es la maqueta del equipo, ya copiada a `imagenes/`; el mockup parte de ella. Decisión del responsable el 2026-11-02. Es referencia de forma, no de color.
- **Sí:** módulo vacío = banda desnuda, sin línea explicativa. Decisión del responsable el 2026-11-02, que es lo que la petición ya permitía. Riesgo conocido: quien la abre ve un hueco.
- **No:** una línea tipo «Aún sin opciones». Si se quiere más adelante es otra spec, con su texto aprobado en un mockup.
- **Sí:** `icono: NombreIcono`. Decisión del responsable el 2026-11-02. Mantiene el juego cerrado y coherente.
- **No:** `icono: ReactNode`. Cada pantalla podría dibujar uno distinto.
- **Sí:** nombres `plegable`, `resumen` (`'completo'` | `'concedido'`) e `icono`, los sugeridos por el equipo («los decide diseño»). Decisión técnica del agente; se reporta (`CLAUDE.md` §3).
- **Sí:** con `plegable` y sin `abiertos`, todo empieza cerrado. Es el comportamiento de la lista hoy (`propios` es `[]`, línea 798) y la petición pide «el mismo gesto en escritorio». No se había preguntado y se reporta: si se prefiere abierto por omisión, es un cambio pequeño y se decide en el mockup.
- **Sí:** el aviso «no hacen nada» de la matriz solo se retira con `plegable` activo; sin él, `abiertos` sigue sin hacer nada en matriz y el aviso se conserva, para no cambiar el comportamiento por omisión.
- **Sí:** las filas plegadas se ocultan con `hidden`, no con CSS de altura cero: si no, quedarían en el árbol de accesibilidad.
- **Sí:** el «tono más oscuro» y el fondo blanco usan colores ya autorizados, mediante tokens existentes o un token semántico nuevo que apunte a un primitivo autorizado. **No** se amplía el panel de escalas sin permiso del responsable.
- **Sí:** versión **minor** (props nuevas y opcionales, sin cambio por omisión). El número lo fija la implementación: si la SPEC 05 ya se implementó, 1.152.0; si no, 1.151.0. Las dos reservan hoy 1.151.0 y la que se implemente segunda sube un número.
- **Pendiente del responsable (antes del paso 1):** «Dar alta» y «Desactivar» no tienen icono obvio en el juego, y la maqueta aprobada pone icono en las seis columnas. Opciones: (a) elegir para esas dos un icono existente de `Icono.tsx`, (b) dejarlas sin icono, o (c) pedir los dos a un diseñador (fuera de esta spec). Mientras no se decida, la spec funciona con (b): `icono` es opcional y una columna sin él sale como hoy.
- **Sí:** el resaltado reproduce la maqueta (columna con `enlace`, fila con fondo tenue). Si `:has()` no pasa los candados, el paso 6 lo resuelve con estado del componente.

- **Sí:** en la matriz la banda lleva el chevron **a la izquierda**, como la lista del sistema, y no a la derecha como la maqueta del equipo: es el mismo gesto en las dos presentaciones. Decisión técnica del agente; se reporta.
- **Sí:** el hover de la banda usa el escalón `borde` de los grises, sin token nuevo ni color nuevo; si el responsable prefiere un token propio, es un cambio pequeño.
- **Sí:** `gap` de 8 px y no los 10 px de la maqueta: el candado de espaciado exige múltiplos de 4 y tiene razón.
- **Sí:** el resaltado de columna es estado del componente (no `:has()`) y resuelve la columna por los `headers` de la celda, no por su posición. Lo señaló la revisión independiente.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Sin props nuevas, algo cambia en `/configuraciones/privilegios` | Prueba de HTML idéntico capturada antes de editar (paso 2); las pruebas existentes no se modifican |
| Las filas ocultas siguen alcanzables por teclado o por lector | Atributo `hidden` y prueba de que sus interruptores no son enfocables mientras el módulo está plegado |
| Un módulo plegado oculta un permiso concedido y quien revisa no se entera | La banda muestra siempre los chips de lo concedido; el criterio los exige |
| Un módulo vacío se confunde con un `filas: []` roto, o al revés | Definición explícita de «vacío» y prueba de que la regla 24 sigue avisando |
| Ningún color autorizado da el «tono más oscuro» con contraste suficiente | El paso 1 lo resuelve en el mockup; si no hay, se detiene y se pregunta al responsable |
| El resaltado de columna y fila exige selectores que los candados no manejan (solo `@media`) | El paso 6 lo mide; si un candado no lo resuelve, se detiene y se avisa en vez de silenciarlo |
| Columnas con y sin icono desalinean las etiquetas | Criterio de aceptación y caso en el mockup |
| Dos specs reservan la misma versión | Se numera al implementar, no antes; declarado en Decisiones |
| El mockup se aparta de lo que aprobó el dueño al pasar de los colores del producto a los tokens | El responsable aprueba el mockup comparándolo con la maqueta; las diferencias de color son esperadas y se listan |
| La maqueta no define los iconos de columna | Decisión pendiente declarada; `icono` es opcional |

## Lo que **no** está en esta spec

- Cambios en los estilos de la banda, los interruptores o los motivos de bloqueo más allá del hover, el foco y el encabezado.
- Plegar por omisión, una fila de categoría repetida, ordenar módulos o que el panel conozca el menú.
- Una línea explicativa en el módulo vacío.
- Iconos nuevos, o `icono` como elemento libre de React.
- La pantalla `/control-de-asistencia/privilegios`, la SPEC 16 y la verificación en `devgestion`.
- La publicación (`npm run publicar`).
