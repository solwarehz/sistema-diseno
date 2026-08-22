# Estado del proyecto

**Última actualización:** 21 de agosto de 2026
**Versión del sistema:** MMI-DS **v1.67.0** — el candado de ESLint no sabía
leer TypeScript: moría en el análisis antes de llegar a ninguna regla. Lo
teníamos resuelto para nosotros y entregábamos la versión sin resolver

> Este archivo se reescribe entero cuando cambia el estado. No se le añaden
> párrafos: un estado con capas es un estado que ya no se lee.
>
> **Y se reescribe SIEMPRE.** Van dos veces que no se hace: se quedó en v1.25.0
> con el repositorio en v1.38.0, y otra vez en v1.39.0 con el repositorio en
> v1.41.3 —tres versiones—. Un registro desfasado se lee como si fuera cierto,
> que es exactamente el defecto que este archivo debía evitar.

---

## Dónde estamos, en una frase

El sistema es un **paquete que un producto instala y consume** —31 componentes
publicados, la hoja que viaja, **doce candados**, 415 pruebas— y sigue
aprendiendo la misma lección por otro lado: los peores defectos no están en lo
que el catálogo enseña mal, sino en **lo que ningún candado estaba mirando**.
R86 es de ese tipo: la tabla declaraba una altura de fila de 34px desde la
v1.0.0 y **entregaba un mínimo**, porque nadie comprobaba que la celda no
partiera el texto. Se veía en cada producto y en el propio catálogo. Ahora lo
mira el candado de la cascada, a los once anchos y en los cinco casos.

---

## Qué está hecho y verificado

Cada cifra sale del comando que está al lado. **No se repiten de memoria.**

| Módulo | Estado | Cómo se comprobó |
|---|---|---|
| Motor de tokens | ✅ | `generar.mjs` — 56 semánticos + 5 de marca, claro y oscuro |
| Contrato `paleta.lock.json` | ✅ | Generado desde `fuente.mjs`, nunca a mano |
| Contraste en **los dos modos** | ✅ | `verificar-contraste` · 178 pares · 138 bloqueantes · **0 fallos** |
| Candado de lint | ✅ | `probar-candado` (62 casos) y `probar-con-eslint.sh` (3 pasos) en Docker |
| Componentes de React | ✅ | **415 pruebas en 28 archivos** · `tsc --noEmit` limpio |
| La hoja que viaja | ✅ | `extraer.mjs` · 790 reglas de 1274 · **566 clases, 0 huérfanas** |
| Catálogo navegable | ✅ | `cascaron/index.html` · 52 páginas · lo genera `generar-cascaron.mjs` |
| Iconografía | ✅ | **46 trazos** en `iconos.mjs`, React real · `informacion` entró con R83 |
| Entrega ZIP | ✅ | `sistema-diseno-v1.67.0.zip` · **53 archivos** · se publica con `npm run publicar` |
| Modo oscuro | ✅ | Aprobado 2026-08-09 · marco en escala de negros |
| Manual de aplicaciones | ✅ | **v1.3.0 sobre MMI-DS v1.58.0** · §5.5 manda a los componentes en vez de describir su anatomía |
| Guía de actualización | ✅ | `ACTUALIZAR.md` en **v1.67.0**, con el salto **desde la v1.19.0**, que es la instalada |
| Compresor de PDF propio | ✅ | Sin dependencias · **y desde hoy con su `.d.mts`** |

### Lo que cambió desde la v1.39.0

| Versión | Qué |
|---|---|
| v1.40.0 | `CargaPdf` cabe en un formulario: botón fuera, panel que empuja, borrador que confirma al Grabar |
| v1.40.1 | El botón fija su propio `line-height` — el CSV salía más alto en la entrega |
| v1.41.0 | El reset `box-sizing` por fin viaja, y **nace el candado promesa-vs-entrega** |
| v1.41.1 | El botón declara su propio `display` — sin `.btn-ic` el icono y el texto se apilaban |
| v1.41.2 | La tira de filtros de la tabla se entregaba vacía |
| v1.41.3 | R47 · el panel flotante del menú plegado cerraba en seco |
| v1.42.0 | **R48** · el menú seguía comprimido y sacaba a la vez las opciones de extendido · el candado de la promesa pasa a recorrer todo el marcado |
| v1.43.0 | **R49** · con la tabla ancha se desplazaba el componente entero, mandos incluidos |
| v1.44.0 | **R50** · la carga de imagen se centra, y sin foto de una persona el hueco lo ocupa su avatar |
| v1.45.0 | **R51** · nace `CargaId` — las dos caras del documento de identidad, con el mismo editor de encuadre |
| v1.46.0 | **R52** · todos los iconos de la entrega salían 2px más pequeños que en el catálogo |
| v1.47.0 | **R53** · el campo y el selector no se veían como los del catálogo: dos nombres, dos bloques de reglas |
| **v1.48.0** | **R54** · el selector en solo lectura mientras se consulta · **R55** · la foto de la persona con una sola prop |

### Lo de hoy (v1.67.0), con detalle

**R92 · el candado de ESLint no sabía leer TypeScript.** Lo reportó Control
Administrativos con el caso exacto: *«no parsea `import { type X }`, que es
TypeScript estándar desde la 4.5»*. Reproducido montando el candado **a solas**,
como dice su propia cabecera que se use:

```
1:15  error  Parsing error: Unexpected token AjusteHorario
```

**El defecto era más ancho que el caso.** Sin analizador no se parseaba **nada**
de TypeScript; ese import es solo donde lo notaron. ESLint moría **antes de
llegar a ninguna regla del sistema**, y el error parecía del archivo del
consumidor.

**Y la ironía es la parte que enseña:** el `eslint.config.mjs` de *este*
repositorio lleva el parser desde hace versiones, con un comentario al lado que
explica exactamente este fallo. **Sabíamos el problema, lo resolvimos para
nosotros, y entregamos el candado sin él** — documentando el uso que no
funciona. Es el mismo defecto que el reset `box-sizing` que no viajaba: lo que
el sistema usa y no entrega, lo sufre el consumidor.

El analizador se carga con `await import`: si el consumidor no tiene
`typescript-eslint`, el candado sigue cubriendo su JavaScript **y avisa por
consola**, en vez de reventar o de fallar en silencio. Declarado como peer
opcional.

**Entra la prueba que faltaba** —el candado a solas sobre un `.tsx` real, tercer
paso de `probar-con-eslint.sh`—, vista en rojo con el candado desarmado antes de
verla en verde.

**Y se arregla el paso 1 de ese mismo script**, que exigía cero infracciones
habiendo dos declaradas como deuda: **fallaba siempre, y una prueba que falla
siempre nadie la corre.** Ahora tolera exactamente la deuda y falla con
cualquier otra.

### Lo de la v1.66.0, con detalle

**R91 · 42 de 105 exportaciones no llegaban al índice.** Lo reportó Control
Administrativos, y con la frase que lo resume: *«`AjusteHorario` no se exporta:
añadieron `onAjuste` pero dejaron su tipo dentro. Lo deduzco del propio
componente en vez de meter mano en el paquete»*. Tenían razón, y el fallo era
nuestro, de la v1.64.0 — de ayer.

**Pero no era un olvido puntual.** Al medirlo: **42 de 105**, y entre ellas los
`Props` de **todos y cada uno** de los componentes. Un paquete que obliga a
deducir el tipo de una prop **no ha publicado esa prop**.

Salen las 42, y el índice **deja de depender de acordarse**:
`verificar-entrega` falla si un componente exporta algo que no llega allí. Lo
que no quiera publicarse, que no se exporte del módulo — ahí la decisión se ve.
Un `export` que no llega al índice no es una decisión, es un olvido.

**Tercera lista escrita a mano que se queda corta el mismo día**: los casos de la
promesa sin el filtro (R87), los mismos sin el horario (R90), y este índice. Las
tres tenían la misma forma y ninguna avisaba de estar incompleta.

**Y el candado nuevo no cazó nada en su primera versión.** Buscaba el nombre en
todo el texto del índice y se daba por satisfecha al encontrarlo **en un
comentario** — el que cita `AjusteHorario` para explicar por qué existe el
candado. Se rompió a propósito, siguió verde, y se rehízo para leer los nombres
de las cláusulas `export`. Es el mismo error que ya había cometido la prueba de
R88, dos días seguidos.

### Lo de la v1.65.0, con detalle

**R90 · el candado estaba verde por no mirar.** Salió de una pregunta, no de un
reporte: *«¿la entrega es igual a la promesa?»*, después de publicar R88 y R89.
El candado decía que sí.

Y **era verdad** — se comprobó a mano montando el mismo marcado con las dos
hojas en un navegador: **19 elementos, 12.654 propiedades, cero diferencias**.
Pero el candado no lo sabía: en su lista de casos, escrita a mano, **no había ni
un elemento del horario**. Ni el bloque, ni la celda, ni el eje, ni la
envoltura.

**Es el mismo hueco que dejó pasar R87**, y por eso importa más que el defecto
que no había: una lista escrita a mano se queda corta en cuanto nace un
elemento, **y no avisa de que se ha quedado corta**. Van dos veces.

Entran diez casos —envoltura, celda, celda vacía, eje, bloque, bloque con tono
de identidad, pila, hueco de la fracción, chip de identidad y punto de leyenda—.
El candado pasa de **921 a 971 elementos** y de **189.379 a 199.674
propiedades**. Visto en rojo a propósito antes de verlo en verde.

> **Pendiente que esto deja abierto.** Sigue siendo una lista a mano. Lo que
> haría falta es que el candado **descubra** los elementos del catálogo en vez
> de que alguien los recuerde — el mismo remedio que ya se aplicó al
> empaquetador y a la lista de candados. No se hace hoy porque no es un cambio
> pequeño; queda escrito para que la tercera vez no sea una sorpresa.

### Lo de la v1.64.0, con detalle

**R89 · la celda del horario deja de ser un interruptor.** Lo pidió Control
Administrativos con el argumento que lo cierra: **las 07:45**. Si un bloque solo
se dibuja cuando el paso divide sus horas, un trabajador que entre a menos
cuarto obliga a dibujar la semana entera en franjas de quince minutos, para
todos — 96 filas en vez de 24.

**Al sondear el motor apareció algo peor que lo que denunciaban.** Su premisa era
que un bloque desalineado no se dibuja. Medido con el componente real:

| Bloque, paso 60 | Qué hacía |
|---|---|
| `07:45 – 09:00` | Se dibujaba **en la fila de las 08:00** |
| `13:30 – 15:00` (su ejemplo) | Se dibujaba **de 14:00 a 16:00** |
| `07:25 – 07:50` | Desaparecía |
| Dos a la misma hora | **Ganaba el segundo**; el primero desaparecía sin rastro |

No es que no se viera: **se veía una hora que no era**, con el rótulo correcto al
lado. Y los silencios eran cuatro, no uno.

**Cómo se resolvió sin tocar la tabla.** Sombreado en **cuartos de franja** —la
resolución que ellos pidieron, no una rejilla de precisión— repartido con una
**pila flexible** dentro de la celda: hueco, bloque, hueco, con proporciones. Sin
una sola medida en píxeles. Y **sin sacar el bloque del flujo**: con
`position: absolute` la fila se quedaba sin nada que la empuje y el texto se
salía de una celda de 32 px. Los `th scope` y los `rowSpan`/`colSpan` intactos,
que era su condición.

**Se descartó el `style` en línea** con variables de geometría, que habría dado
el fraccionado exacto al minuto: relajaba §2.5.6 para toda una superficie y el
candado dejaría de proteger lo que hoy protege entero. Los cuartos bastan.

**Y la desviación se declara con su número:** donde tocaría 37,5 % sale
**35,5 %**, porque el bloque nunca se comprime por debajo de su texto. Es
deliberado —cortar el título para cuadrar un sombreado sería cambiar un dato por
un adorno— y es justo la razón de que el rótulo lleve la hora exacta.

### Lo de la v1.63.0, con detalle

**R88 · el color que agrupa, no el que avisa.** Control Administrativos pidió
que `Horario.tono` y `Chip.tono` aceptaran los cuatro colores de identidad que
el sistema ya tiene, para colorear cada bloque **por sede**. El diagnóstico era
suyo y era correcto: usar `error` como color decorativo **gasta el rojo** — el
mismo argumento que este sistema defiende en la `Nota`.

**No hay tokens nuevos.** `identidad-1..4` e `identidad-texto` existen desde la
v1.7.0, cableados solo a `.avatar-N`. Sus contrastes seguían medidos: **6,04 ·
7,41 · 6,47 · 7,52**, e iguales en los dos modos — porque el par es
texto-blanco-sobre-color y el modo no interviene. Eso responde su tercera
pregunta.

**La forma se decidió mirándola**, con la rejilla real y bloques de estado
mezclados:

| Probado | Qué pasó |
|---|---|
| Fondo macizo, texto blanco (lo pedido) | Cumple (6,05–7,53:1) y se lee rapidísimo, pero **cuatro cajas decorativas pesan más que el bloque de error** en rojo tenue: la alarma queda por debajo del adorno |
| Título en el color | 5,27–6,55:1, cumple. Pero aquí el **texto** de color ya significa estado: un título verde se lee como «bien» |
| **Filete de 6 px, fondo neutro** | **Elegido.** Los de estado llevan 3: **el grosor distinto es en sí la señal** de que es otra dimensión |

Va en `.hor-b.hor-identidad-N` y no en `.hor-identidad-N` a secas, para que el
ancho gane por **especificidad y no por orden**. Eso es R87 aplicado el día
siguiente.

**Y se corrige la doctrina del token.** Decía «nunca informan, agrupan ni
filtran», escrito pensando solo en el avatar. Ahora: **agrupar sí, informar no**
—lo agrupado va también en texto y con leyenda, SC 1.4.1—, **filtrar no**. Seis
reglas de contrato, cuatro obligatorias.

**Una prueba que no se vio fallar no protege nada, otra vez.** El aserto de «no
fondo macizo» exigía una coma en el selector, así que miraba la regla agrupada y
se le escapaba la individual: se rompió a propósito metiendo el fondo macizo y
**las seis pruebas siguieron verdes**. Corregido para mirar todas las reglas del
bloque, y vuelto a romper hasta verlo en rojo.

### Lo de la v1.62.0, con detalle

**R87 · las mismas reglas, en distinto orden.** No lo reportó nadie: salió de
comprobar R86. Al montar el **mismo marcado** con las dos hojas en un navegador
y compararlo propiedad a propiedad —**37 elementos, 24.642 propiedades**—, 27
elementos salieron idénticos y 10 distintos. Los 10 eran el **filtro de columna**
de la tabla y lo que arrastra por altura:

| | catálogo | entrega |
|---|---|---|
| `font-size` | 13px | **12px** |
| Alto del control | 36,18 px | **26,73 px** |
| Alto de la fila de filtros | 44,84 px | **35,40 px** |
| Flecha del select | 16px | **13px** |

**Ninguna regla faltaba ni sobraba.** `.tb-f` y `.campo` empatan en
especificidad —una clase contra una clase— y cuando dos reglas empatan **gana la
última**. El extractor agrupa por elemento, así que `.campo` (Campo de texto)
pasa a ir *antes* que `.tb-f` (Tabla de datos) y el empate se resuelve al revés a
cada lado.

**Y la decisión no era «12 o 13».** Preguntándole al navegador qué reglas tocan
el control *en el catálogo*, las tres de `.tb-f` **pierden allí**: son
declaraciones que esa página no ha mostrado nunca. Muertas en el catálogo y
vivas en la entrega por accidente de orden. Se borran, y las dos hojas coinciden
**por construcción**. Darle más especificidad a la que pierde habría congelado
en la hoja un valor que el catálogo no enseña.

Quien usa `<TablaDatos>` **no ve ningún cambio**: el componente monta `<Campo>`,
que emite `.campo` sin `.tb-f`, así que su filtro ya estaba a 13px y 36,18.

**Nace el candado del empate**, el duodécimo. Se mide solo sobre las **292
combinaciones de clases que existen de verdad** en el marcado —del catálogo y de
los componentes—: sin ese filtro salen **25.823** pares teóricos, y una lista así
no se lee, se ignora. Quedan **53 empates reales** y ninguno cambia de ganador.

**Un hueco que este trabajo deja abierto, declarado.** El troceador de `parsear`
corta por `;` sin mirar si está dentro de unas comillas, y los seis
`background-image: url("data:image/svg+xml;utf8,…")` salen partidos: un
`background-image` truncado y una propiedad llamada `utf8,<svg xmlns='http`. El
candado del empate los descarta por nombre imposible. **El defecto es del motor y
lo comparten los candados de la cascada y de la promesa**: no dan falso rojo
—el corte es igual en las dos hojas— pero dejan un punto ciego en el icono del
select y el del calendario, que es justo donde hubo un defecto en la v1.28.0.

### Lo de la v1.61.0, con detalle

**R86 · un dato, una línea.** Lo reportó Control Administrativos V2.0, con el
diagnóstico hecho y correcto: el producto no aplica ninguna clase de ajuste de
texto en las celdas, así que el comportamiento salía entero de nuestra hoja.

Medido aquí en un navegador, sobre la hoja **que viaja** y **antes** de tocar
nada: en una columna estrecha, tres filas de la misma tabla daban **54,7 · 34,0
· 72,3 px con 34 declarados**, y **36,7 con 28** en compacta. La altura de fila
no era una altura: era un mínimo. Y la medida que cierra el argumento es la del
desplazamiento — el ejemplo en compacta daba `scrollWidth` 419 sobre
`clientWidth` 419: el desbordamiento se estaba absorbiendo **hacia abajo**, en
el único eje donde el componente había prometido una medida.

Entra `white-space: nowrap` en `.tb td` y en `.tb-sub td` —la sub-tabla plegable
tenía el mismo defecto medido: 46,7 px con 30 declarados—, y **dos excepciones
que son prosa, no datos**: el estado vacío y el panel de detalle siguen
partiendo. Después: **34,0 en las tres filas** y **28,0 en compacta**, con la
envoltura desplazando en vez de crecer.

**La excepción hubo que ganarla, no solo declararla.** Escrito como `.tb-vacio`
(100) perdía contra `.tb td` (101) y el vacío salía en una línea. Lo sacó el
candado de la cascada **en rojo, a los once anchos**, antes de que se viera en
ninguna pantalla. Es la primera vez que ese candado caza algo de esta familia
—una excepción que existe pero no gana— y por eso vale escribirlo.

**Se rechazó la otra mitad del pedido**, y con su razón: `.tabla-simple td` no
lleva `nowrap`. Ahí no hay altura declarada que romper y sus celdas son prosa
por diseño (`vertical-align: top`, `line-height: 1.45`). Está escrito como
prueba, así que si alguien se la pone «por simetría», sale en rojo.

> **Deuda de este archivo.** Las secciones históricas de abajo siguen siendo las
> de la v1.48.0: llevan trece versiones sin reescribirse, que es exactamente el
> defecto contra el que avisa la cabecera. Hoy se han puesto al día la cabecera,
> la frase, las cifras y los números verificados —todos regenerados, ninguno de
> memoria—, y el rótulo «lo de hoy» de la sección vieja, que decía una mentira.
> La reescritura completa queda **declarada y pendiente**.

### Lo de la v1.48.0, con detalle

**El manual, que llevaba 37 versiones sin tocarse.** Iba por la v1.1.0 sobre
MMI-DS **v1.11.1** con el sistema en v1.48.0 — el mismo defecto que este archivo
tuvo dos veces, en el documento al que se remite a los proyectos. Pasa a
**v1.2.0** y entran las decisiones que hoy tiene que tomar quien construye una
pantalla: el error con icono, **solo lectura no es deshabilitado** con el caso
del selector de documento, los tres componentes de carga y sus tres reglas
comunes, **foto si la hay y avatar si no** con una sola prop, y §9ter de tablas
—la unidad en la cabecera, la celda numérica sin segunda línea y que con la
tabla ancha solo se desplaza la tabla—.

`ACTUALIZAR.md` estaba en v1.19.0: ahora apunta a la v1.48.0 y estrena el §4.2,
**el salto desde la v1.19.0**, que es la que el área de sistemas tiene
instalada. La lista sale de los `rompe` declarados en `fuente.mjs`, no de la
memoria de nadie.

**R54 · solo lectura, que no es deshabilitado.** Pedido para el selector de
documento mientras se consulta a la API: cambiar el tipo a mitad tira el
resultado. Entra la prop `soloLectura`, y **no** es `disabled` — deshabilitado
se sale del tabulador y **el navegador no lo envía con el formulario**, que es
justo el dato que hay que conservar.

**HTML no tiene `readonly` para `<select>`**, solo para `input` y `textarea`, así
que el componente lo construye: `aria-readonly` para el lector y bloqueo de lo
que abre o cambia la lista, dejando pasar Tab y Escape porque salir nunca se
bloquea. Además, el estilo de solo lectura solo existía para `.cg-in`: un campo
`readonly` del producto —que emite `.campo`— no se veía distinto de uno
editable.

**R55 · la foto de la persona.** «En contrato, al buscar el DNI del trabajador
lo muestra con avatar, pero el trabajador ya tiene foto». Trampa mía: `persona`
llevaba quién es —id y nombre— pero **no su retrato**, así que al enganchar el
resultado de la consulta lo natural era pasar `persona` y dejarse `valor`. Ahora
la regla se cumple con **una sola prop**: foto si la hay, avatar si no. `valor`
sigue mandando cuando llega, porque es el recorte recién hecho.

**R53 · el campo y el selector.** «La entrega del selector no es igual que la
promesa». La causa: el grupo de campo tenía **dos nombres y dos bloques de
reglas** — `.cg-*` en las páginas de campo, selector, fecha y maquetas, y
`.campo-*` en área de texto, casos y **todos** los componentes de React. Con el
tiempo se separaron también por dentro.

Medido, catálogo contra entrega:

| | Catálogo | Entrega |
|---|---|---|
| Color de la etiqueta | `rgb(44,42,37)` | `rgb(0,0,0)` — heredado |
| Renglón de error | `flex`, con icono de 14px | `block`, **sin icono** |

Lo de la etiqueta es la enfermedad del `line-height` del botón otra vez: una
propiedad que el sistema no declara y decide la página que lo monta.

Ahora los dos nombres **comparten declaración** — es el mismo bloque, no un
alias que haya que acordarse de mantener— y el error lleva su icono también en
React: un renglón rojo suelto se confunde con una ayuda, y el color por sí solo
no dice que algo falla (SC 1.4.1). El candado de la cascada volvió a cazar lo
suyo: al pasar el error a `flex`, `[hidden]` dejaba de ocultarlo.

**R52 · el tamaño del icono.** Lo vio el responsable mirando la barra de la
tabla: «los botones filtro, columnas, CSV ¿tienen el mismo ancho? En la entrega
el CSV es más ancho».

**No tienen el mismo ancho, y no deben**: cada uno mide lo que mide su texto —
medido en el catálogo, **97, 119 y 84 px**—. Pero el CSV *parecía* más grande, y
la causa era otra y peor: **el catálogo dibuja todos los iconos a 18px** —el
paso «texto», el que `Icono` da por omisión— y la entrega los pasaba a
`tam="control"`, **16px**, en 24 sitios. Como el botón de CSV lo pone el
producto siguiendo el catálogo, su icono salía 2px mayor que el de sus dos
vecinos, que son nuestros.

El 18 no es un gusto: es el mismo número que el `line-height` del botón
(v1.40.1), y por eso un botón mide lo mismo lleve icono o no.

**Ningún candado podía verlo**: el de la promesa compara la cascada, y esto es
un atributo del `<svg>`. Es la segunda vez en dos días que el hueco es el mismo
—R49 fue estructura, esto es markup—. Lo fijan dos pruebas de la tabla y la
regla transversal 0.

**R51 · `CargaId`.** Las dos caras del documento de identidad, encuadradas con
**su proporción real** y entregadas en WebP. El guion es el que se pidió: botón
«Subir ID» → diálogo → **anverso** → Grabar → el **mismo** diálogo pide el
reverso → Grabar → se cierra. Las miniaturas quedan al costado, el botón se
desactiva, y pulsar una miniatura la abre en grande.

La proporción no es un número elegido: el documento es una tarjeta **ID-1**
(ISO/IEC 7810), **85,60 × 53,98 mm** = 1,5858:1. El marco mide 428×270 px
(1,5852:1) y una prueba comprueba que no se aleja más de una milésima.

**Antes de escribirlo se extrajo el editor.** El lienzo, el arrastre, el zoom,
las flechas, el acotado y la salida en WebP vivían dentro de `CargaImagen`.
Copiarlos habría dado dos editores parecidos —el día que uno arregle el
acotado, el otro se queda con el defecto—, así que ahora hay **uno solo**:
`interno/EditorEncuadre`. Las 13 pruebas de `CargaImagen` pasaron **sin tocar
ni una**: esa es la comprobación de que la extracción no cambió nada.

Volver a subir **se autoriza desde atrás**: con las dos caras el botón se
cierra, y solo vuelve cuando el producto baja `bloqueado` porque su back se lo
dijo. Hasta grabar el reverso el anverso es un **borrador** y no se avisa.

Medido en el navegador, el guion entero: diálogo con el anverso primero, lienzo
428×270 (1,5852), tras grabar sigue abierto pidiendo el reverso, al grabarlo se
cierra con **2 miniaturas de 76×48**, el botón **desactivado**, el visor abre y
al cerrarlo **el foco vuelve a la miniatura pulsada**.

Dos candados en rojo por el camino, los dos con razón: **la entrega**, porque
meter la página nueva corrió los índices del menú y tiró «Panel de la barra»
fuera de su tramo —una página publicada que dejaba de verse—; y **la cascada**,
porque `.btn` declara su `display` desde v1.41.1 y sin `.btn[hidden]` un
`<Boton hidden>` se seguía viendo. Las dos correcciones viajan.

**R50 · la carga de imagen.** Dos cosas. La columna **se centra sobre su caja**
—estaba en `flex-start` y el rótulo, la vista previa y el botón miden cada uno
una cosa: salía una escalera—. Y **sin foto pero con persona detrás, el hueco lo
ocupa el `Avatar` de esa persona**: «Sin foto» no dice nada que no se sepa, y
las iniciales con su color dicen **de quién** es el hueco. Es el mismo `Avatar`
del sistema, compuesto y no rehecho, así que la ficha, la tabla y esta carga
pintan a la misma persona igual. Se activa con la prop `persona` y **solo con
`formato="foto"`**. En cuanto llega la foto, la foto manda.

El catálogo estrena la tarjeta con el avatar en la misma fila de muestras, así
que el estado **se puede ver** y el candado de la promesa lo compara como a
cualquier otro elemento. Medido en el navegador: las cinco tarjetas con
desviación **0px** entre el eje del rótulo, el de la caja y el del botón.

Dos candados salieron en rojo por el camino y los dos tenían razón: el auditor,
porque 36px y 52px no son pasos de la escala (§3.4) —van 34 y 56—; y el de la
promesa, porque `.ci-avatar` y `.avatar-xl` pesan lo mismo y ganaba la que cada
hoja pusiera después. **Es el mismo defecto que `.us-menu` ayer**: se resolvió
con el antepasado delante, `.ci-caja .ci-avatar`, que gana en las dos hojas se
ordenen como se ordenen.

**R49 · la tabla ancha.** `.tb-envoltura` es el deslizador —lleva el
`overflow-x`— y en el componente envolvía el árbol **entero**: arrastrar a la
derecha se llevaba el buscador, el «Mostrar», el recuento, Filtros, Columnas,
CSV, el rango y la paginación. El catálogo nunca lo hizo así: allí la barra, la
envoltura y el pie son hermanos. Ahora el componente emite `.tb-bloque` y
`.tb-envoltura` envuelve **la tabla y nada más**; la cabecera va dentro a
propósito, porque columnas y datos tienen que moverse juntos.

Medido con la hoja que viaja —tabla de 1145px en una caja de 650—: al desplazar
400px, cabecera y celdas se mueven **−400** y la barra, el pie y la paginación
se mueven **0**. El catálogo, medido igual, hace lo mismo.

**Ningún candado podía verlo**: el de la promesa resuelve la cascada sobre el
marcado del catálogo y no mira el árbol que emite el componente. Lo fijan tres
pruebas del componente, vistas en rojo con la estructura vieja.

**R48.** Reportado a 900px: «está el menú comprimido, pero el botón de expandir
se muestra; al dar clic sigue comprimido pero se ven las opciones de extendido».
Reproducido en el navegador con la hoja que viaja: la lateral seguía en 56px con
su clase de plegada y **los cuatro paneles flotantes** encima del contenido.

La causa: el clic re-sincronizaba la apertura de los grupos con el valor
**pedido**. Sin control de fuera da igual —pedir es aplicar—, pero **controlado**
(R21) manda el producto: si no devuelve el valor nuevo, el carril sigue plegado
y los grupos se abrían igual. Y plegado, un grupo abierto **es** un panel
flotante. No hace falta que el producto se equivoque: guardar la preferencia en
el perfil —lo que el sistema recomienda— hace que el valor vuelva tarde.

**Y la promesa no enseñaba ese ancho.** R38a movió el riel de ≤900 al componente
y el catálogo se quedó sin él. Medido antes de tocar nada, a 900px: catálogo
desplegado a 236px, entrega plegada a 56px. Ahora el catálogo lleva las dos
bandas, su botón gana el `aria-expanded` que nunca tuvo, y plegar pasa por un
solo sitio.

**El candado de la promesa deja de mirar una lista a mano.** El marco no tenía
ni un caso, y eso es lo que pasa con una lista que alguien escribe: vigila lo
que alguien se acordó de mirar. Ahora **se recorre el marcado del catálogo** y
se compara cada elemento que pinta, con su cadena de antepasados real —
**832 elementos · 171.025 propiedades resueltas a cinco anchos**, más 29 estados
fijados a mano que el marcado no tiene abiertos (la lateral plegada, su panel
flotante, el velo). Se dice además cuántos elementos se saltan por ser
mobiliario de la página, para que el verde no se lea como lo que no es.

En su primera pasada completa **sacó un defecto que la lista a mano no veía**:
`PanelBarra` emite `us-menu` y `pb-panel`, pesan igual, y gana la que va
después — en el catálogo `.us-menu`, en la entrega `.pb-panel`—, así que el
panel de notificaciones salía en el producto con 320px de ancho mínimo y otro
relleno del que se enseñaba. Las dos declaraciones muertas se retiraron.

Y se le vio en rojo a propósito: bajando el relleno del botón de 16px a 15px,
36 elementos en rojo.

**El compresor de PDF ya viaja con tipos.** `componentes/src/interno/comprimir-pdf.d.mts`.
Sin él, un producto que compile sin `allowJs` se caía con **TS7016** desde
nuestro propio `index.ts`, sin usar el compresor. Reproducido con un `tsconfig`
de consumidor: dos errores sin la declaración, cero con ella.

---

## Los once candados

Se pasan **todos** antes de subir a `main`. Ninguna versión sube con uno en rojo.

| Candado | Qué impide | Se ha visto en rojo |
|---|---|---|
| `verificar-contraste` | Que el contrato mienta sobre un par | ✅ |
| `verificar-color` | Un hexadecimal, `rgb()` o `hsl()` suelto | ✅ |
| `auditar-cascaron` | Estilo en línea, marcado fuera de norma y duraciones a mano | ✅ |
| `probar-candado` | Que las reglas de ESLint no hagan nada | ✅ |
| `verificar-contrato` | Una regla obligatoria sin prueba que la nombre | ✅ |
| `verificar-entrega` | Que el catálogo enseñe lo que no viaja, y al revés | ✅ |
| huérfanas (en `extraer.mjs`) | Clase emitida sin regla | ✅ |
| `verificar-cascada` | Lo que NO se escribió, a once anchos | ✅ |
| `verificar-promesa` | Que lo entregado no se vea como lo enseñado | ✅ |
| `verificar-elemento` | Que el catálogo enseñe un elemento y el componente emita otro | ✅ reproduciendo R56 |
| ESLint | El atributo `style`, el hex crudo, `outline:none` | ✅ el mismo día: cazó una comilla invertida que rompía el generador |
| `tsc --noEmit` | Tipos | ✅ |

---

## Números verificados

No los repitas de memoria: **regenéralos**.

```
Versión                      1.67.0
Tokens semánticos                56   + 5 de marca
Pares de contraste              178   (69 bloqueantes por modo, 0 fallos)
Pruebas                         415   en 28 archivos
Reglas que viajan               790   de 1274 · 566 clases, 0 huérfanas
Candado de la cascada           867   reglas leidas · 11 anchos
Candado del empate              292   combinaciones reales · 53 empates
                                      · 0 cambian de ganador
Candado de la promesa           971   elementos · 199.674 propiedades
                                      a 5 anchos (1440, 1024, 900, 700, 390)
Candado del elemento            145   clases comparadas · 5 divergencias
                                      DECLARADAS · 100 las pinta el guion
Contrato de comportamiento      156   reglas · 130 obligatorias · 5 PENDIENTE
Componentes publicados           31   36 módulos viajan en el paquete
Iconos                           46
Páginas del catálogo             52
```

```powershell
docker compose exec ds node sistema/candado/verificar-contraste.mjs
docker compose exec ds sh -c "cd componentes && npm run probar"
```

---

## Lo que NO está hecho — declarado

| Qué | Por qué |
|---|---|
| **El marco abre TODOS los grupos al desplegar; el catálogo abre solo el de la página** | Divergencia medida hoy y **no resuelta**: son dos modelos de navegación distintos, los dos escritos y defendidos. Decidirlo cambia el menú de todos los productos o la documentación: **es del responsable** |
| **El candado de la promesa compara CSS, no comportamiento** | Y es el hueco que queda abierto. R38, R42, R47 y R48 fueron **comportamiento** —qué se abre, qué se cierra, qué se pliega—, y ahí no hay nada que compare el catálogo con el componente: lo único que los caza son las pruebas del componente, que sólo miran un lado. Cerrarlo pide ejecutar las dos superficies en un navegador y comparar estados; **eso necesita un navegador sin cabeza en el contenedor, y eso es autorización del responsable** |
| **Lo que el catálogo no pinta, no se compara** | Los 29 estados fijados a mano existen por eso. Un estado nuevo que nadie fije ni el catálogo enseñe, no lo mira nadie |
| Compresión de imágenes que no sean JPEG | El compresor solo toca `/DCTDecode` |
| El compresor en Node no toca imágenes | Necesita `canvas`; lo de imágenes se verificó en el navegador |
| Fuentes incrustadas | No se tocan. Es el otro gran peso de un PDF |
| Los seis `--ambito-alt-*` | Aplazado por el responsable del producto (2026-08-10) |
| R8, R14–R17 | Marcados `PENDIENTE` en `comportamiento.md` |
| Selección múltiple y encabezado fijo en la tabla | Declarado en manual §10 |
| Escudo suelto e isotipo simplificado | **Trabajo de diseñador, no de código** |
| ESLint: 2 errores en `Estados.tsx` (67 y 195) — ahora tolerados como deuda por `probar-con-eslint.sh` | `style=` dinámico de esqueleto y progreso; la decisión **es del responsable** y sigue sin tomarse |

---

## Repositorio

- **`solwarehz/sistema-diseno`** · privado · https://github.com/solwarehz/sistema-diseno
- En esta máquina (Windows) se trabaja en `main` directo, **únicamente con los
  once candados y las pruebas en verde**. Es de donde instala el área de
  sistemas: un `main` roto es un proyecto ajeno roto.
- Nunca `--force`. Nunca `checkout` ni `stash` sobre el árbol compartido.
- `.gitattributes` fija LF; los binarios de diseño no suben.
- Notas de esta máquina: `LEVANTAR-EN-WINDOWS.md`.
