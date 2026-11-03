# SPEC 07 — Piezas del tablero «General»: GraficoTendencia, MapaCalor, FranjaCifras, ListaRanking y jerarquía en SelectorBusqueda

> **Estado:** Implemented
> **Depende de:** SPEC 04 (`RangoFecha` con `fechaMaxima`, ya implementada). Ninguna otra en este repositorio. La SPEC 18 del equipo, que esta spec desbloquea, vive en su repositorio y no se enlaza aquí.
> **Fecha:** 2026-11-02
> **Objetivo:** Crear cuatro piezas nuevas —`GraficoTendencia`, `MapaCalor`, `FranjaCifras` con `CifraConDiferencia`, y `ListaRanking`—, dar árbol y cuenta a las opciones de `SelectorBusqueda` y comprobar con pruebas que `RangoFecha` ya cumple lo que el tablero necesita, para que una pantalla de asistencia dibuje tendencias, mapas, cifras y rankings sin escribir CSS propio.

## Por qué existe esta spec

Requerimiento **R169** (numerado por el equipo, no acuñado aquí), prioridad alta, comprobado por el equipo contra v1.152.0. El texto llegó por `/spec`; esta spec no crea ningún fichero en `peticiones/`. El equipo no escribe CSS ni piezas atómicas: pide las piezas, entrega los datos ya calculados y las piezas solo los dibujan. Lo más importante para el dueño son los dos gráficos de tendencia (tardanza y falta).

**Una sola spec, por decisión del responsable (2026-11-02), contra la recomendación del agente de partirla en dos** (gráfico primero, el resto después). Es una versión y un mockup de las piezas (no del tablero). El riesgo queda declarado abajo.

Hechos verificados en el repositorio el 2026-11-02 (rama `work`, versión 1.152.0):

- **No existe** ningún gráfico, mapa de calor, cifra con diferencia ni lista de ranking en `componentes/src/` (búsqueda por `grafico`, `heatmap`, `mapacalor` y `sparkline`: sin resultados).
- `OpcionBusqueda` es `{ valor: string; texto: string; ayuda?: string }` (`SelectorBusqueda.tsx:29`). El selector también acepta `onBuscar`, que devuelve opciones desde fuera (línea 150).
- `RangoFecha` tiene `maxDias` y `fechaMaxima` (R166). El techo de «Hasta» se calcula a partir del inicio elegido y «Mes siguiente» se apaga cuando el último mes visible contiene la máxima (`RangoFecha.tsx:529`, `774`). **No se ejecutó** para confirmar los tres comportamientos que pide el tablero: eso es el paso 1.
- `Avatar` existe con tamaños `s | m | l | xl | fluido` y anillo de estado (`Avatar.tsx:23`, `40`). `Tarjeta`, `TablaDatos` y `Chip` existen y **no se tocan**.
- El candado de ESLint prohíbe el atributo `style` en línea en el código del paquete, el hex crudo y `outline-none` (`candado.eslint.config.mjs`). `Estados.tsx:333` usa `style={{ width }}` en la barra de progreso; **no se comprobó** por qué pasa el candado, y el paso 4 lo averigua antes de diseñar las barras y las celdas.
- No hay `@container`: el ancho de un contenedor se mide en JavaScript (`CLAUDE.md` §4bis). El hueco de la rejilla del tablero ya se mide así en `tablero.ts`.
- **La maqueta de referencia** está publicada como artefacto (`https://claude.ai/artifact/WSPDFGdFnSyhCjBPY57Hzs`, «Tablero General de Asistencia», leída el 2026-11-02). **No está en el repositorio** y no es autoridad: el responsable la fijó como **referencia de forma**; el mockup de esta spec es propio y manda el sistema de diseño (componentes ya creados, colores autorizados, tokens, móvil primero). Lo que fija la maqueta y esta spec recoge:
  - Gráfico: eje vertical **con rótulos** (cero y cuatro marcas, tope redondeado hacia arriba), cuadrícula tenue, base más fuerte, área bajo la línea, línea de referencia punteada con su etiqueta a la derecha, punto 0 con halo y valor a la derecha, ventana al pasar, tabla desplegable con columnas «Semana atrás · Periodo · valor».
  - Cifra de comparación del gráfico: **tres** chips que arma la app («frente a la semana previa», «frente al promedio de las 6 previas», «semana más alta»).
  - Mapa: título, descripción y total sobre la cuadrícula; escala «Menos – Más» debajo (sin leyenda de «Pocos datos» ni del guion, por decisión del responsable); contenedor desplazable enfocable con su nombre.
  - Lista: posición, avatar, nombre que envuelve, unidad en gris, barra, valor; texto vacío «Nadie tiene … en esta unidad esta semana».
  - Selector: «Todas las unidades» primero; la búsqueda mantiene a la unidad padre cuando coincide un hijo; cuenta «N trab.» a la derecha; botón «Ver todas» aparte.
- **Lo que la maqueta resuelve mal o no resuelve, y esta spec corrige:**
  - Todos sus colores son hexadecimales propios del producto (`#0A2433`, `#4FE0CF`, `#0E6F78`…). En el sistema se usan tokens; el panel oscuro, el tono del mapa y el de la línea se resuelven en el mockup con colores ya autorizados.
  - La intensidad del mapa es **continua** (`color-mix` de 10 % a 90 %): genera colores que ningún candado conoce. Aquí es una escala de **pasos discretos** (ver Decisiones).
  - «Pocos datos» se dice solo con `title`, que en un teléfono no se lee (`CLAUDE.md` §4bis). Aquí lleva borde punteado y nombre accesible en la celda; la leyenda que lo explicaba se quitó por decisión del responsable (ver Riesgos).
  - Los rótulos de los puntos 1 a 6 solo aparecen en ancho; en móvil la fecha de cada punto no aparece, y hay que poder leerla sin puntero (tabla desplegable y ventana por teclado).
  - Su gráfico se pinta con `innerHTML`; el nuestro es un componente de React.

## Alcance

**Dentro:**

- **`GraficoTendencia`**: panel con título, valor grande del punto 0 con su unidad, hueco para los chips de comparación que arma la app, línea de siete puntos sobre un eje de «semanas atrás» y sus pies. SVG propio, sin librería de gráficos.
  - El punto 0 va **pegado al eje vertical**; el 6, el más alejado. Etiqueta numérica bajo cada punto y «actual» bajo el 0.
  - Eje vertical con rótulos y cuadrícula; línea de referencia punteada opcional con su etiqueta.
  - Punto 0 destacado con anillo (sin repetir el valor, que ya está en grande arriba); el valor de los demás puntos sobre el punto solo con ancho de la pieza ≥ 520 px (medido en JavaScript sobre el propio contenedor).
  - Etiquetas del eje: el número bajo cada punto y «actual» bajo el 0; las fechas de cada semana salen en la ventana y en la tabla, no bajo el eje.
  - Cursor, toque y teclado: guía vertical, punto resaltado y ventana con la semana, su rango de fechas y el valor; las flechas recorren los puntos, y Inicio y Fin saltan a los extremos.
  - Alternativa en tabla («Ver las cifras de cada semana») con una fila por punto, y texto alternativo del gráfico con el valor actual y la referencia.
  - Se redibuja al cambiar el ancho. El trazo se anima **una sola vez al abrir** (no al redibujar, ni al cambiar los datos) y no se anima con `prefers-reduced-motion`.
  - Panel oscuro en los dos temas, único bloque oscuro de la pantalla en claro.
- **`MapaCalor`**: cuadrícula filas × columnas con título, descripción, total y escala «Menos – Más» propios. Cada celda lleva el valor y «n trab.». Intensidad por pasos de un solo tono. «Pocos datos» (n ≤ `pocosDatosHasta`, 2 por omisión) con borde punteado y nombre accesible. Celda con n = 0 vacía, con «—» y «0 trab.». Estructura de tabla con cabeceras de fila y de columna. En móvil, ancho mínimo (~350 px) y desplazamiento horizontal **dentro** del contenedor, nunca de la página.
- **`FranjaCifras`** y **`CifraConDiferencia`**: franja de cifras separadas por línea fina, sin tarjetas sueltas: dos columnas en móvil (la última ocupa el ancho completo si el total es impar) y hasta cinco en escritorio. Cada cifra: título, número grande tabular, unidad pequeña, diferencia y línea de detalle. La diferencia llega **ya calculada** y se dibuja con flecha, signo y texto accesible.
- **`ListaRanking`**: lista corta (hasta cinco filas, las que pase la app) con posición, `Avatar`, nombre que envuelve, valor con su unidad y barra proporcional al primero; texto propio cuando está vacía.
- **`SelectorBusqueda` con jerarquía**: `nivel?` (sangrado) y `cuenta?` (a la derecha, tabular) en `OpcionBusqueda`; el filtrado conserva a los ancestros de las coincidencias.
- **`RangoFecha`: comprobación**, con pruebas, de los tres comportamientos del tablero (ver Criterios). Si ya los cumple, solo se prueban y se documentan; si no, se ajusta.
- Mockup propio `cascaron/mockup-piezas-tablero.html`, hecho con la skill `frontend-design` (`CLAUDE.md` §4bis-2) y la skill `dataviz` para el gráfico y el mapa, que el responsable aprueba **antes** de implementar.
- Pruebas, páginas del catálogo (una por pieza nueva y la del selector actualizada), reglas nuevas del contrato, registro en `verificar-entrega.mjs`, entrada de versión.
- Subida de versión **minor** (ver Decisiones) y reescritura de los números de estado de `memoria/01-estado.md` y `CLAUDE.md` §1.

**Fuera de alcance:**

- Una librería de gráficos genérica y otros tipos de gráfico (barras, pastel, dispersión). Si el tablero necesita otro, es otra spec.
- Exportar el gráfico como imagen o PDF.
- Cálculos dentro de las piezas: promedios, diferencias, edades, agrupaciones, redondeos del eje de valor y formato de números. Los hace la app. (La pieza solo reparte lo que recibe en el espacio: posición de los puntos, escala de la barra frente al primero, paso de color.)
- Cambiar `Tarjeta`, `TablaDatos`, `Chip` ni `Avatar`. Se componen con ellos tal cual.
- La opción «Todas las unidades» y el botón «Ver todas»: los pone la pantalla del equipo con `Boton`.
- Que las piezas conozcan el tablero, la sede, la unidad organizativa o la asistencia: son genéricas.
- El período en días o meses: `GraficoTendencia` habla de **semanas** (ver Decisiones).
- **Armar el tablero**: el sistema entrega las piezas; el área de desarrollo las une, decide su disposición (por ejemplo, dos gráficos lado a lado) y construye la pantalla `/control-de-asistencia/tableros/general`. Tampoco la SPEC 18 y la verificación en `devgestion`, y la publicación (`npm run publicar`).
- Iconos nuevos y colores nuevos en el panel de escalas (`CLAUDE.md` §4bis-2).

## Modelo de datos

Piezas nuevas con sus tipos, y dos campos opcionales nuevos en `OpcionBusqueda`; no cambia ningún tipo existente. **Los nombres son una propuesta del agente; el mockup los confirma** (R169 los deja a diseño).

```ts
// ── GraficoTendencia ─────────────────────────────────────────────
export type PuntoTendencia = {
  /** Número que se dibuja. El índice 0 del arreglo es el periodo consultado. */
  valor: number;
  /** Rango de fechas, ya escrito: «19 oct – 25 oct». Sale en la ventana y en la tabla. */
  detalle: string;
};

export type GraficoTendenciaProps = {
  titulo: string;
  /** Siete en el tablero. El primero es el periodo actual y va pegado al eje. */
  puntos: PuntoTendencia[];
  /** Cómo se escribe un número en el eje, sobre los puntos y en la ventana: min o h:mm. */
  formato: (valor: number) => string;
  /** «min» o «hrs»: va junto al valor grande. */
  unidad: string;
  /** Unidad base del eje vertical: 1 por omisión; 60 con minutos escritos como h:mm, para que las marcas caigan en horas enteras. */
  base?: number;
  /** Chips que arma la app («▲ +72 min frente a la semana previa»). */
  comparaciones?: React.ReactNode;
  /** Línea punteada opcional. El valor y la etiqueta los calcula la app. */
  referencia?: { valor: number; etiqueta: string };
  /** Rótulo de la última columna de la tabla («Minutos», «Horas»). */
  columnaValor: string;
};

// ── MapaCalor ────────────────────────────────────────────────────
export type CeldaMapaCalor = { valor: number; n: number };

export type MapaCalorProps = {
  titulo: string;
  descripcion?: React.ReactNode;
  /** Total del mapa, ya escrito: «327 min». */
  total?: string;
  filas: string[];
  columnas: string[];
  /** celdas[fila][columna]. */
  celdas: CeldaMapaCalor[][];
  formato?: (valor: number) => string;
  /** n ≤ este valor = «Pocos datos». 2 por omisión. */
  pocosDatosHasta?: number;
};

// ── FranjaCifras / CifraConDiferencia ────────────────────────────
export type DiferenciaCifra = {
  /** La magnitud, sin signo ni flecha: «72 min», «3 trab.», «0:45». */
  cantidad: string;
  /** La app ya comparó actual y anterior. */
  direccion: 'sube' | 'baja' | 'igual';
  /** Cómo se lee subir: 'subir-es-peor' (todas las del tablero) o 'subir-es-mejor'. */
  sentido: 'subir-es-peor' | 'subir-es-mejor';
};

export type CifraConDiferenciaProps = {
  titulo: string;
  /** Ya formateado: «612», «37:50». */
  valor: string;
  unidad?: string;
  diferencia?: DiferenciaCifra;
  detalle?: React.ReactNode;
};
// FranjaCifras recibe CifraConDiferencia como hijos.

// ── ListaRanking ─────────────────────────────────────────────────
export type FilaRanking = {
  id: string;
  /** Apellidos y nombres. Puede ser largo y envuelve. */
  nombre: string;
  /** Solo para la proporción de la barra. El primero es el 100 %. */
  valor: number;
  /** Lo que se lee: «74 min», «2 días». */
  texto: string;
  /** Foto o, sin ella, iniciales (lo decide `Avatar`). */
  foto?: string;
  /** Una línea gris bajo el nombre (la unidad organizativa). */
  detalle?: string;
};

export type ListaRankingProps = {
  titulo: string;
  filas: FilaRanking[];
  /** Texto cuando no hay filas: «Nadie tiene faltas en esta unidad esta semana». */
  textoVacio: string;
};

// ── SelectorBusqueda ─────────────────────────────────────────────
export type OpcionBusqueda = {
  valor: string;
  texto: string;
  ayuda?: string;
  /** Sangrado a la izquierda. 0 o ausente = raíz. */
  nivel?: number;
  /** A la derecha, tabular: «12 trab.». */
  cuenta?: string | number;
};
```

Convenciones:

- **Eje horizontal:** el punto 0 es el más cercano al eje vertical; los siguientes se alejan hacia la derecha. El orden del arreglo **es** el orden de «semanas atrás».
- **Eje vertical:** la pieza elige el tope y las marcas con un redondeo hacia arriba a un número «bonito» y llama a `formato` para escribirlas. El cero siempre está.
- **Escala de la barra:** `valor / valor del primero`. Con `valor` 0 en el primero no hay barra.
- **Intensidad del mapa:** paso entero dentro del propio mapa, de un solo tono, calculado sobre las celdas con `n > 0`. Una celda con `n = 0` nunca recibe paso.
- **Nombre accesible de la celda:** el valor, los trabajadores y, si aplica, «Pocos datos: n trabajadores» (singular con 1).
- **Ancestros:** son, para una opción, la cadena de opciones anteriores cuyo `nivel` es estrictamente menor, hasta la raíz. Una opción sin `nivel` cuenta como 0.
- **Sin props nuevas, nada cambia:** `SelectorBusqueda`, `Tarjeta`, `TablaDatos`, `Chip`, `Avatar` y `RangoFecha` producen el mismo marcado que en v1.152.0.
- **Colores:** solo los autorizados. El panel oscuro, la escala del mapa y los fondos de la diferencia se resuelven con tokens existentes o con tokens semánticos nuevos que apunten a un primitivo ya autorizado.

## Plan de implementación

0. Requisitos previos: se parte de `work` actualizado y la rama se comprueba **antes** de la primera edición (`CLAUDE.md` §8). `/spec-impl` crea la rama temporal `spec-07-piezas-tablero-general-asistencia` desde `work`. Las dependencias están dentro del contenedor (`docker-compose`).
1. **`RangoFecha`: comprobar antes de construir.** Escribir las pruebas de los tres comportamientos (con `maxDias={7}` y `fechaMaxima` = hoy): tras elegir el inicio solo quedan habilitados los siete días siguientes, nunca uno posterior a hoy; inicio = final = hoy es válido; no se puede avanzar de mes más allá del mes de hoy. Si pasan sin cambiar el componente, el paso termina con una nota en el contrato; si alguna falla, se corrige en un commit aparte y se declara en la versión. No toca el aspecto.
2. **Mockup** `cascaron/mockup-piezas-tablero.html`, con la skill `frontend-design` y la skill `dataviz` **antes de proponer nada**, y partiendo de la maqueta del equipo (referencia de forma, no de color). Con las clases reales y tokens, sin hex ni `style` en línea: las cinco piezas **sueltas, cada una en su propia sección y con datos de ejemplo; no se maqueta el tablero ni se decide cómo se reparten en la pantalla (eso lo arma el área de desarrollo)**, a 360 px, 390 px y escritorio, en claro y oscuro. Casos que debe enseñar: punto 0 contra el eje; ventana abierta; tabla desplegada; mapa con celda «Pocos datos» y celda vacía; diferencia que sube, baja e iguala en los dos sentidos; ranking vacío; selector con árbol, filtrado y ancestros conservados; foco visible en todo. Se resuelve ahí: qué colores autorizados dan el panel oscuro, la línea y el área, la escala de pasos del mapa (cuántos pasos) con el cambio de texto claro/oscuro, y los fondos de la diferencia; la relación del panel con `Tarjeta` (variante o superficie propia, sin cambiar `Tarjeta`); los nombres definitivos de las props; el alto del gráfico en estrecho y en ancho; el punto de corte de la franja a cinco columnas. **Si ningún color autorizado da contraste suficiente, se detiene y se pregunta** (no se amplía el panel de escalas). **El trabajo se detiene hasta que el responsable apruebe.**
3. **Pruebas primero.** Capturar el HTML de `SelectorBusqueda` **sin props nuevas** y fijarlo; escribir y ver fallar las pruebas de cada pieza (cada una titulada con el número de su regla del contrato): la geometría de `GraficoTendencia` como funciones puras (posición de cada punto, marcas del eje), `MapaCalor` (pasos, pocos datos, vacío), `CifraConDiferencia` (flecha, signo y texto en las seis combinaciones de dirección y sentido), `ListaRanking`, y el filtrado con ancestros.
4. **Mecanismo para lo que no puede ir en `style`.** Averiguar cómo `Estados.tsx:333` pasa el candado y decidir, midiendo, cómo se dibujan la anchura de la barra y el paso de color: clases por paso para el mapa; y para la barra, el mismo mecanismo que admita el candado o atributos de SVG. Si el candado se opone y no hay salida limpia, **se detiene y se pregunta**; no se silencia.
5. **Tokens.** Si el mockup aprobado necesita tokens semánticos nuevos (panel del gráfico, pasos del mapa, fondos de la diferencia), van en `sistema/tokens/fuente.mjs` y en `grupos` de `generar.mjs`; se corren `generar.mjs` y `verificar-contraste.mjs` (0 fallos). Ningún primitivo nuevo en `autorizados.lock.json`.
6. **`CifraConDiferencia` y `FranjaCifras`** (la pieza más pequeña, para fijar el patrón). Componente, CSS en la plantilla de `sistema/cascaron/generar-cascaron.mjs` (nunca a mano en `componentes.css`, que es derivado), móvil primero, exportación con sus tipos en `index.ts`. Las pruebas del paso 3 de estas piezas pasan.
7. **`ListaRanking`**, sobre `Avatar`. Misma disciplina.
8. **`MapaCalor`**: tabla accesible, pasos de color, pocos datos, celda vacía, escala, contenedor desplazable enfocable y con nombre.
9. **`SelectorBusqueda`: `nivel` y `cuenta`**, con los ancestros conservados en el filtrado local. La prueba de HTML idéntico sin props nuevas sigue en verde.
10. **`GraficoTendencia`, en tres partes commiteables:** (a) geometría y dibujo estático: ejes, cuadrícula, línea, área, referencia, puntos y etiquetas, con medida de ancho en JavaScript y redibujado al cambiar; (b) interacción: ventana, guía vertical, punto resaltado, teclado, `aria-live` para anunciar el punto; (c) tabla desplegable, texto alternativo y animación única de entrada con `prefers-reduced-motion`.
11. **Catálogo.** Una página por pieza nueva y la del selector actualizada, con marcado estático, bloque «Cómo se usa» (importación y props, nunca el marcado interno) y tablas de configuración. Regenerar con `generar-cascaron.mjs` y `extraer.mjs`. Registrar los pares `[componente, página]` de cada pieza nueva en `sistema/candado/verificar-entrega.mjs`.
12. **Contrato** (`sistema/componentes/comportamiento.md`): una sección por pieza nueva, con sus reglas empezando en la 1, y reglas nuevas en la sección de `SelectorBusqueda` a continuación de la última que tenga. Cada regla **Obligatorio**, citando `(R169, v…)` y con su prueba declarada. Corregir en el mismo commit lo existente que diga que las opciones del selector no tienen árbol.
13. **Versión minor**: `package.json` y `componentes/package.json`, `VERSION` y `CAMBIOS` en `sistema/tokens/fuente.mjs`, `manual/ACTUALIZAR.md`, `memoria/01-estado.md`, `CLAUDE.md` §1 y `MEMORY.md`.
14. **Entrega.** Correr los veinticinco pasos de `CLAUDE.md` §8 en verde, más `tsc --noEmit` y las pruebas; construir el paquete y el ZIP; correr contra **lo entregado** el criterio «Entrega = promesa» de abajo; medir en navegador a 360, 390 y escritorio, en claro y oscuro (los anchos, en iframe: la pestaña automatizada no observa `ResizeObserver`).

## Criterios de aceptación

- [x] `RangoFecha` con `maxDias={7}` y `fechaMaxima` = hoy, comprobado por prueba: tras elegir el inicio solo los siete días siguientes quedan habilitados y ninguno posterior a hoy; inicio = final = hoy es válido; «Mes siguiente» está apagado en el mes de hoy.
- [x] El mockup `cascaron/mockup-piezas-tablero.html` existe, usa solo tokens y colores autorizados (sin los hexadecimales de la maqueta) y el responsable lo aprobó **antes** del paso 6. (aprobado por el responsable el 2026-11-02, tras 17 revisiones; el paso 2 está hecho y el trabajo sigue en el paso 3)
- [x] **Sin ninguna prop nueva**, el HTML de `SelectorBusqueda` es idéntico al de v1.152.0, y las pruebas existentes de `SelectorBusqueda`, `RangoFecha`, `Tarjeta`, `TablaDatos`, `Chip` y `Avatar` pasan sin modificarse. `git diff --stat` contra v1.152.0 no muestra cambios en `Tarjeta.tsx`, `TablaDatos.tsx`, `Chip.tsx` ni `Avatar.tsx`.
- [x] `GraficoTendencia` dibuja siete puntos para siete valores; el punto 0 es el más cercano al eje vertical (a no más de 16 px de él) y el 6 el más alejado, medido en navegador a 360, 390 y escritorio. *(Medido en navegador con los componentes reales en iframes de 360, 390 y 1280 px, no sobre el catálogo, que pinta marcado estático.)*
- [x] La ventana de un punto y la fila de la tabla muestran el mismo texto de rango y el mismo valor para los siete puntos, comprobado por prueba.
- [x] Con el cursor, el toque o las flechas aparecen la guía vertical, el punto resaltado y la ventana; Inicio y Fin saltan a los extremos; el punto activo se anuncia por `aria-live`, y el foco es visible. *(Verificado: flechas, Inicio, Fin y Escape en navegador, y `aria-live` y foco; cursor y toque, solo por prueba en jsdom. No se midió el toque en un dispositivo real.)*
- [x] Con ancho de la pieza menor de 520 px ningún punto muestra su valor encima; con 520 px o más lo muestran los puntos 1 a 6 (el 0 no lo repite). Se redibuja al cambiar el ancho sin recargar.
- [x] El texto alternativo del gráfico dice el valor actual y, si hay referencia, la referencia; con `referencia` ausente no sale la línea punteada ni su etiqueta.
- [x] El trazo se anima una sola vez al abrir: la clase de animación está en el primer dibujo y **no** reaparece al redibujar por ancho ni al cambiar `puntos`. Con `prefers-reduced-motion: reduce` emulada en navegador, el trazo no tiene animación (`getComputedStyle`). *(`prefers-reduced-motion: reduce` emulado en navegador con `playwright-cli`: sin animación.)*
- [x] `MapaCalor` es una tabla con cabeceras de fila y de columna; una celda con `n ≤ pocosDatosHasta` tiene borde punteado (`border-style` medido), nombre accesible «Pocos datos: n trabajadores»; una celda con `n = 0` muestra «—» y «0 trab.» y no recibe paso de color; la suma de los valores de las celdas coincide con el `total` de ejemplo del catálogo.
- [x] A 360 px el mapa se desplaza horizontalmente **dentro** de su contenedor y la página no: `document.documentElement.scrollWidth` es igual al ancho de la ventana; el contenedor es alcanzable con teclado y tiene nombre.
- [x] `CifraConDiferencia`, en las seis combinaciones de `direccion` y `sentido`, pinta flecha, signo y un nombre accesible («empeoró: +72 min», «mejoró: −3 trab.», «sin cambio»), de modo que se entiende en escala de grises. `FranjaCifras` pone dos columnas en móvil con la última a ancho completo si el total es impar, y cinco columnas en escritorio, medido en navegador.
- [x] `ListaRanking` con un nombre de 60 caracteres envuelve a 360 px sin desbordar ni cortar texto (ningún elemento con `scrollWidth` mayor que `clientWidth`); la barra del primero mide el 100 % y la de los demás `valor / primero`; sin filas muestra `textoVacio` y no una lista vacía.
- [x] `SelectorBusqueda` con `nivel` sangra por nivel y con `cuenta` la pone a la derecha, tabular. Al buscar un hijo, el padre y los ancestros siguen en la lista (comprobado por prueba con tres niveles); con `onBuscar`, la lista que devuelve la app se muestra tal cual.
- [x] Teclado completo en gráfico, selector y calendario, con foco visible, comprobado por prueba y en navegador. *(Verificado en navegador: el gráfico. Selector y calendario, por prueba. Sin lector de pantalla real.)*
- [x] Todos los pares de texto nuevos (panel oscuro, escala del mapa con su cambio de texto, fondos de diferencia) salen en verde en claro y en oscuro en `verificar-contraste`, a 4,5:1 como mínimo, y no se añade ningún color a `autorizados.lock.json`. Las cifras de pares se corrigen con lo que mida el candado. *(Cifras reales del candado: 242 pares, 184 bloqueantes, 92 por modo.)*
- [x] Los componentes nuevos no contienen hex, `rgb()`, primitivas, `style` en línea ni `outline-none`; el candado de ESLint sale en 0.
- [x] Cada regla nueva del contrato tiene su prueba declarada y `verificar-contrato` sale en verde.
- [x] Los veinticinco pasos de `CLAUDE.md` §8, `tsc --noEmit` y la suite de `componentes/` salen en verde.
- [x] Las pruebas nuevas se vieron fallar antes de la implementación (paso 3).
- [x] La versión es la misma en `package.json`, `componentes/package.json`, `VERSION`, `CAMBIOS`, `memoria/01-estado.md` y `CLAUDE.md` §1.
- [x] **Entrega = promesa.** *Promesa:* las páginas del catálogo de las cuatro piezas nuevas y la del selector (marcado estático, bloque «Cómo se usa» y tablas de configuración), las reglas nuevas del contrato y esta spec. *Entregado:* `cascaron/sistema-diseno-v<versión>.zip` desempaquetado, y por la vía npm los mismos `componentes/src`, `sistema/componentes` y `manual` de la lista `files`. *Comprobación:* `verificar-promesa`, `verificar-entrega` (con los pares nuevos), `verificar-ciegas`, `verificar-promesa-muerta` y `verificar-copia` (compila el bloque «Cómo se usa» contra el paquete), todos permanentes dentro de los 25 pasos, más una comprobación de un solo uso fuera del repositorio que compara cada clase que emiten los componentes nuevos con su regla en la hoja entregada y cada prop de las tablas de configuración con el tipo del código entregado. *Visto fallar:* se cambia una declaración de la hoja entregada y se inventa una prop en un bloque «Cómo se usa», y las dos comprobaciones salen en rojo antes de restaurar.

## Decisiones tomadas y descartadas

- **Sí:** una sola spec para todo R169. Decisión del responsable el 2026-11-02, contra la recomendación del agente.
- **No:** partir en dos (gráfico primero) o en tres. El equipo recibiría lo más importante antes y el riesgo se aislaría; se descartó porque el tablero necesita todo junto y es una versión, un mockup y una reunión de aprobación.
- **Sí:** la maqueta publicada es **referencia de forma**; el mockup es propio y manda el sistema de diseño. Decisión del responsable el 2026-11-02.
- **Sí:** la diferencia llega **ya calculada** (`cantidad`, `direccion`, `sentido`); la pieza no resta ni formatea, solo dibuja flecha, signo, color y texto accesible. Decisión del responsable el 2026-11-02.
- **No:** pasar `(actual, anterior)` y dejar que la pieza reste, ni admitir las dos formas. Contradecía «sin cálculos dentro de las piezas» y obligaba a decidir qué pasa con anterior = 0.
- **Sí:** `MapaCalor` dibuja su título, descripción, total y escala. Decisión del responsable el 2026-11-02. Los tres mapas salen idénticos y 
- **No:** que la app envuelva el mapa en su propia tarjeta.
- **Sí:** intensidad del mapa en **pasos discretos** de un solo tono, no continua. Decisión técnica del agente; se reporta. La maqueta usa `color-mix` continuo, que produce colores no autorizados y que ningún candado puede medir por par; con pasos, cada par fondo-texto se mide en los dos modos. El número de pasos y el umbral del cambio de texto los fija el mockup.
- **No:** la mezcla continua, aunque se vea más fina.
- **Sí:** `GraficoTendencia` habla de **semanas** (la ventana dice «Esta semana» / «Hace N semanas», el eje numerado de 0 a 6). Decisión técnica del agente; se reporta. Otro periodo es otra spec, porque el vocabulario y las subetiquetas cambian.
- **Sí:** la pieza acepta los puntos que reciba y no fija siete; los siete son lo que usa el tablero.
- **Sí:** el eje vertical lleva rótulos y cuadrícula, como la maqueta. La pieza elige el tope y las marcas (redondeo hacia arriba); la app solo pasa `formato`. No es un cálculo de negocio.
- **Sí:** el título del gráfico es corto («Tardanza», «Falta»), va como `h2` y es lo más fuerte del panel junto al valor grande; la unidad («min», «h») dice la medida. Decisión del responsable el 2026-11-02.
- **Sí:** los títulos de las medidas son solo «Tardanzas» y «Faltas» en todo rótulo (gráfico, mapa, cifra y ranking). La cifra «Faltas» cuenta **trabajadores** con falta, con unidad «trab.» y diferencia en «trab.» («7 trab.», «▼ −3 trab.»), no días. Decisión del responsable el 2026-11-02. La cifra de horas también se titula «Faltas», con el valor `38:20` y la unidad «hrs» (así también en el gráfico de faltas); en la franja del ejemplo hay entonces dos «Faltas», una en trabajadores y otra en horas, y las distingue la unidad. «Días incompletos» y «Memorándums cerrados» son de la pantalla: el sistema no fija sus rótulos.
- **Sí:** el mockup `cascaron/mockup-piezas-tablero.html` queda aprobado el 2026-11-02 y es la referencia visual de las cinco piezas; incluye el prop `base` del gráfico, el panel que cambia de color entre claro y oscuro (índigo suave con línea índigo oscuro; marino con línea de oro), la escala de cinco pasos del mapa sin leyenda de «Pocos datos», y las cifras sin línea de detalle.
- **Sí:** gráfico limpio (decisión del responsable el 2026-11-02): sin subetiquetas de fecha bajo los puntos, sin valor repetido en el punto 0, un solo chip de comparación por gráfico en el ejemplo y la referencia rotulada «Promedio: N».
- **No:** descripción bajo el título del gráfico («Todas las unidades · del 26 oct al 1 nov…»), ni pie explicativo («Eje horizontal: semanas atrás…») («Eje horizontal: semanas atrás…»). Decisión del responsable el 2026-11-02: el gráfico va limpio. El significado del eje lo dan las etiquetas bajo cada punto, la ventana y la tabla desplegable.
- **Sí:** los chips de comparación son un hueco (`comparaciones: ReactNode`). La app arma qué se compara y con qué tono; ver `Chip`.
- **Sí:** ancestros por `nivel` y orden, no por un `padre` explícito: la cadena es de opciones anteriores con `nivel` menor. Decisión técnica del agente; se reporta. Evita un campo más y una lista que se pueda contradecir a sí misma. **No** se muestran los descendientes de una coincidencia: lo pedido es conservar el contexto hacia arriba.
- **Sí:** con `onBuscar` el selector muestra la lista que devuelve la app sin añadir ancestros: es el servidor quien decide qué devuelve.
- **Sí:** la barra del ranking es `valor / valor del primero`, calculada por la pieza. Es presentación, no negocio; la app no tendría cómo expresarla de otro modo.
- **Sí:** «Pocos datos» no depende solo del color ni solo de `title`: borde punteado y nombre accesible. Sin leyenda: la quitó el responsable el 2026-11-02 («quita esta leyenda e iconos»).
- **Sí:** el ancho de 520 px para mostrar los valores sobre los puntos se mide sobre el contenedor de la pieza, no sobre la ventana, porque en escritorio el panel va a la mitad de la pantalla.
- **Sí:** versión **minor** (cuatro piezas nuevas públicas y dos campos opcionales; sin cambio por omisión). El número lo fija la implementación: la siguiente a la publicada, **v1.153.0** si nada se publica antes. La SPEC 05, todavía en Draft, también reservó una versión y se numera al implementar, no antes.
- **Sí:** se compone con lo que ya existe: `Avatar` para el ranking, `Tarjeta` si el mockup lo permite sin cambiarla, `Chip` para los chips que arma la app. **No** se reconstruye (`POLITICA-DE-CREACION.md`).
- **No:** `Chip`, `Tarjeta`, `TablaDatos` ni `Avatar` se modifican. Si el mockup descubre que algo no se puede componer sin tocarlos, se detiene y se pregunta.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Una sola spec con cuatro piezas nuevas es grande y el gráfico puede retrasar al resto | El plan ordena de lo pequeño a lo grande (cifras, ranking, mapa, selector, gráfico) y cada paso es commiteable; si el gráfico se alarga, las otras piezas ya están en la rama y se puede proponer partir la versión |
| Ningún color autorizado da el panel oscuro, la línea, el área o los pasos del mapa con contraste suficiente | El paso 2 lo resuelve en el mockup; si no hay, se detiene y se pregunta (no se amplía el panel de escalas) |
| El candado de `style` impide la barra y las celdas dinámicas | El paso 4 lo averigua antes de implementar; clases por paso para el mapa, y para la barra el mecanismo que admita el candado o atributos de SVG. Si no hay salida limpia, se pregunta |
| `prefers-reduced-motion` no se puede emular con la herramienta de navegador | Se prueba en la hoja generada (la animación vive solo fuera de la consulta) y, si la emulación no es posible, se declara **no verificado** en el reporte |
| La pestaña automatizada no dispara `ResizeObserver` | Medir en iframes de ancho fijo (`pestana-automatizacion-sin-observadores`) y probar el redibujado con una prueba que simule el cambio de medida |
| El trazo se anima otra vez al cambiar el filtro | Prueba explícita: segundo dibujo con otros `puntos` y otro ancho, sin la clase de animación |
| El texto de la ventana y el de la tabla divergen | Los dos salen de la misma función; prueba que compara los siete pares |
| El catálogo no pinta una pieza en estático y los candados no la ven | Cada página lleva marcado estático (`pieza-sin-componente-no-esta-entregada`) y los pares se registran en `verificar-entrega` |
| El mapa desplaza la página en 360 px | Contenedor propio con `overflow-x`, medido con `scrollWidth` a 360 y a 390 |
| `RangoFecha` no cumple alguno de los tres comportamientos | El paso 1 lo prueba primero; si falla, se ajusta en un commit aparte y se declara |
| El aspecto aprobado en el mockup difiere de lo que se entrega | El mockup usa las clases y los tokens reales y el paso 14 mide el paquete entregado, no el mockup (`el-catalogo-y-el-paquete-son-dos-hojas`) |
| Sin leyenda, el borde punteado de «Pocos datos» no se explica a la vista; solo lo dice el texto accesible | Decisión del responsable. Si quien lee el tablero no entiende el punteado, se vuelve a poner la leyenda; el nombre accesible ya cubre al lector de pantalla |
| Dos specs reservan la misma versión | Se numera al implementar, no antes |

## Lo que **no** está en esta spec

- Una librería de gráficos genérica, otros tipos de gráfico y exportar el gráfico.
- Cálculos dentro de las piezas (promedios, diferencias, edades, agrupaciones, formato de números).
- Cambios en `Tarjeta`, `TablaDatos`, `Chip` o `Avatar`.
- «Todas las unidades» y «Ver todas» (los pone la pantalla), la pantalla del tablero, la SPEC 18 y la verificación en `devgestion`.
- Periodos que no sean semanas, iconos nuevos y colores nuevos en el panel de escalas.
- La publicación (`npm run publicar`).
