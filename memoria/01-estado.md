# Estado del proyecto

**Última actualización:** 22 de septiembre de 2026
**Versión del sistema:** MMI-DS **v1.138.0** — el cierre del R157: lo que
prometía y no entregaba, encontrado por una auditoría con todo en verde

> Este archivo se reescribe entero cuando cambia el estado. No se le añaden
> párrafos: un estado con capas es un estado que ya no se lee.
>
> **Y se reescribe SIEMPRE.** Van dos veces que no se hace: se quedó en v1.25.0
> con el repositorio en v1.38.0, y otra vez en v1.39.0 con el repositorio en
> v1.41.3 —tres versiones—. Un registro desfasado se lee como si fuera cierto,
> que es exactamente el defecto que este archivo debía evitar.

---

## Dónde estamos, en una frase

El sistema es un **paquete que un producto instala y consume** —35 componentes
publicados (`verificar-entrega`), la hoja que viaja, **veintiún pasos de
verificación** —los que corre `publicar.mjs`, más ESLint y las pruebas: veintidós
en total—, **1213 pruebas en 59 archivos**, todas en verde—.

**Tres días seguidos entregando a Control Administrativos, y los tres reportes
eran defectos reales del sistema, no de su pantalla.** R129: el calendario no
tenía suelo y se encogía con su disparador hasta que los días de dos cifras se
tocaban. R130: la etiqueta iba dentro del recuadro —la única del sistema— y la
fecha se mostraba en el formato de **guardar**. R131: el calendario **no se
podía cerrar** sin cambiar el rango.

**Lo que más enseña es lo que apareció alrededor.** El arreglo de R131 escribió
una **cuarta copia** de un comportamiento que `interno/desplegable.ts` ya tenía
—y cuya cabecera avisa: «dos copias de un comportamiento divergen»—. Divergía de
verdad: escuchaba en **captura** y paraba la propagación, así que le **robaba el
Escape** al menú de usuario, a los paneles de la barra y al selector con
búsqueda. Se cerraba la capa que la persona no estaba usando. Lo tumbó una
auditoría y se rehízo **componiendo**, que es lo que la política dice desde el
principio.

**Y un reporte que casi no llega.** El equipo actualizó a la v1.108.0, midió,
le salió idéntico, y estuvo a punto de reportar R129 como **no resuelto**: el
servidor seguía sirviendo el paquete viejo. La culpa era nuestra — la
comprobación que el manual publicaba mira **el disco**, no lo que la aplicación
sirve, y lo que cambió era **CSS**, que desde JavaScript no se podía preguntar.
Ahora las dos hojas llevan su versión en una variable de CSS.

---

## Qué está hecho y verificado

Cada cifra sale del comando que está al lado. **No se repiten de memoria.**

| Módulo | Estado | Cómo se comprobó |
|---|---|---|
| Motor de tokens | ✅ | `generar.mjs` — 56 semánticos + 5 de marca, claro y oscuro |
| Contrato `paleta.lock.json` | ✅ | Generado desde `fuente.mjs`, nunca a mano |
| Contraste en **los dos modos** | ✅ | `verificar-contraste` · **186 pares** · 146 bloqueantes · **0 fallos** |
| Candado de lint | ✅ | `probar-candado` (62 casos) y `probar-con-eslint.sh` (3 pasos) en Docker |
| Componentes de React | ✅ | **1213 pruebas en 59 archivos** · `tsc --noEmit` limpio |
| La hoja que viaja | ✅ | `extraer.mjs` · **1049 reglas de 1568** · **755 clases, 0 huérfanas** — y desde v1.77.0 el barrido mira también `interno/` |
| Catálogo navegable | ✅ | `cascaron/index.html` · **70 páginas** (`grep -c '<section class="pagina"'`) · lo genera `generar-cascaron.mjs` |
| Iconografía | ✅ | **62 trazos** en `iconos.mjs`, React real · los siete de edición entraron con R124 (v1.102.0) |
| Entrega ZIP | ✅ | `sistema-diseno-v1.134.0.zip` · **60 archivos** · **1.465 KB** · se publica con `npm run publicar` |
| Modo oscuro | ✅ | Aprobado 2026-08-09 · marco en escala de negros |
| Manual de aplicaciones | ✅ | **v1.3.0 sobre MMI-DS v1.58.0** · §5.5 manda a los componentes en vez de describir su anatomía |
| Guía de actualización | ✅ | `ACTUALIZAR.md` en **v1.134.0**, con el salto **desde la v1.19.0**, que es la instalada |
| Promesa muerta | ✅ | `verificar-promesa-muerta` — el **penúltimo** de los veintiún pasos · **178 unidades compuestas** · **7 de deuda declarada**, 0 nuevas |
| Desplegado del selector | ✅ | `selector-desplegado-catalogo.test.tsx` — el catálogo EJECUTÁNDOSE contra el componente · 7 comparaciones · visto en rojo con el catálogo roto |
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

### Lo de hoy (v1.133.0 y v1.134.0), con detalle

**R157 · siete piezas para un tablero denso**, pedidas por una pantalla que **no
se consulta, se vigila**: se deja abierta en un teléfono a las 7 de la mañana.

> **Ninguna de las siete es de esa pantalla**, y ésa es la única razón por la que
> entraron.

Una cuadrícula densa sirve a cualquier selector de iconos; un anillo de estado, a
«en línea» o «pagado»; una burbuja con tono, a cualquier contador; una superficie
tonal, a cualquier bloque que pertenezca entero a un estado.

**Dos cosas no entraron como las pidieron, y el motivo es el mismo las dos
veces:** el vocabulario. El anillo se pidió como `'presente' | 'ausente'` y entra
con los tonos del sistema —un tipo que dijera `presente` obligaría al siguiente
producto a llamar «presente» a una factura cobrada—. Y las seis columnas no son
un número elegido: son las que salen de la celda más estrecha en la que un avatar
sigue siendo reconocible dentro de 375 px.

**La forma del avatar no se tocó.** Se planteó el cuadrado redondeado y se
descartó **en los dos lados a la vez**: en una rejilla densa la forma es lo que
distingue una persona de una entidad. Lo que daba la sensación de «icono de app»
era el **relieve**, y eso sí entró — como **escala**, porque si cada pantalla
inventa su sombra, la misma rejilla acaba con tres profundidades.

**Y lo que cambia el sistema:** deslizar deja de ser siempre un defecto. La
política decía «nada se lee deslizando en horizontal»; ahora distingue
**desbordamiento** —el contenido no cupo— de **paginación por gesto** —cada
parada es una vista entera—, con tres condiciones que hay que ganarse. Sin las
tres, es desbordamiento con otro nombre.

**Dos candados salieron en rojo durante el trabajo y los dos tenían razón:** una
sombra partida en dos líneas le parecía al candado de color un `rgba()` suelto, y
un `animation: 2s` escrito a mano no pasaba por ningún token de duración.

### Lo de la v1.132.0, con detalle

**R156 · la fila de totales es DE la tabla.** Va en `tfoot`, y esa decisión hace
el resto sola: no la toca el orden, ni el filtro, ni la paginación **no porque se
le haga una excepción, sino porque no está donde se aplican**, y un lector la
anuncia como resumen sin que nadie se lo explique.

> La frase con la que el dueño cortó la solución provisional vale como regla:
> *«colocarlo dentro de la tabla pero no como una fila de la tabla es romper el
> componente tabla»*.

No es de una pantalla: historial de contratos, los tres reportes de asistencia y
pagos la usan igual — **es lo que permite ver que las filas cuadran sin
repasarlas una a una**. La aporta la pantalla, porque un «1 a 6 m 12 d» no es la
suma de una columna sino una cuenta de calendario.

**Y nace `verificar-copia`, el candado que faltaba.** `CLAUDE.md` §7 regla 3 dice
que lo único que se copia de un componente compartido es «la importación y las
props», y **esa superficie no la miraba nadie**: los diecisiete comparan CSS,
elementos, atributos, cascada e iconos, y ninguno pasa un compilador. Se declaró
abierto **tres versiones seguidas**.

Al escribirlo salió el daño acumulado: los **dieciocho** bloques importaban de
`@ae/sistema`, **un paquete que no existe**, y **diecisiete de dieciocho** no
compilan. El import ya está arreglado —era lo que hacía que ninguno resolviera— y
el resto entra como deuda declarada que **obliga a podar**.

Y algo que ninguna auditoría pudo ver, porque chocaba con lo mismo: **`tsc` no
emite ni un error de tipos si algún archivo no parsea**, así que dos bloques mal
envueltos tapaban los errores de los otros dieciséis. El candado salía casi verde
escondiendo justo lo que venía a mirar. Ahora compila uno a uno.

**La política de móvil primero estaba mal escrita**, y eso es peor que no
tenerla. Mandaba `title` como rescate de un texto recortado, y
`memoria/06-cobertura.md` (C-08) lleva versiones diciendo que *«no se ve en móvil
ni con teclado»*. Prescribía para el teléfono un remedio registrado como
inservible en el teléfono. Ahora dice el orden: **primero no recortar**; si hay
que recortar, el texto **alcanzable sin puntero**.

**Y 360 px entra en `verificar-promesa`, lo primero de la lista.** Empezaba en
390: el ancho que la política exige era el único que no miraba ningún candado, y
la lista iba de ancho a estrecho — escritorio primero hasta en el verificador.

**Se restaura una regla obligatoria que se había borrado sin querer** hace dos
versiones: al reescribir la regla 21 del panel, el reemplazo cogió la primera
coincidencia del archivo, que era la **regla 21 de `TablaDatos`**. Se perdió sin
que nada protestara, porque `verificar-contrato` sólo mira que el número tenga
una prueba detrás y el número seguía ahí.

### Lo de la v1.131.0, con detalle

**Móvil primero deja de ser una intención y pasa a ser política**, fijada por el
responsable el 19-09. Está en `CLAUDE.md` §4bis y en la política de creación §5,
con lo que significa en concreto: lo estrecho es el caso por omisión, nada se lee
deslizando en horizontal, ningún texto cortado sin forma de leerlo entero, y **se
verifica midiendo a 360 px en navegador**.

> Hizo falta escribirla porque **el sistema la estaba incumpliendo sin darse
> cuenta**.

El responsive de la matriz quedó fuera del R151 porque el equipo que la pidió lo
dejó como *deseable* —«caer al acordeón bajo cierto ancho nos parece la respuesta
correcta», escrito por ellos—. Se declaró abierto dos veces y **nunca se midió**.
Al medirlo: a 360 px la tabla ocupaba **687 px** y seguía siendo tabla, con el
nombre de fila recortado a 44vw **y sin `title`** — el nombre completo no estaba
en ninguna parte. Tres versiones diciendo «pendiente de medir» sobre algo que,
medido, no servía en un teléfono.

**Que el equipo no lo pidiera no lo saca de la política.** Un requisito de
producto puede faltar; una política del sistema, no.

**Lo implementado:** bajo 640 px de **contenedor** —no de ventana: una matriz
puede vivir en un panel estrecho dentro de una pantalla ancha— el panel pinta la
lista, agrupada y plegable. Se parte de lo estrecho y la matriz entra al
comprobar que cabe. **No hay prop para desactivarlo.**

**Y se mide a mano además de observar**, que salió de intentar verificarlo en el
navegador: `ResizeObserver` entrega sus avisos dentro del ciclo de pintado, y se
comprobó con uno **nativo** que hay situaciones en que ese ciclo no corre —cero
disparos en 600 ms sobre un elemento visible—. Con sólo el observador, el panel
se habría quedado en **lista para siempre** en una pantalla ancha.

**Lo que no se pudo verificar, y la propia política lo exige:** la medición **en
navegador** a 360 px. La pestaña de la sesión no ejecuta el ciclo de pintado —es
lo mismo que dejaba las capturas en blanco—, así que la caída a lista está
verificada en pruebas con anchos simulados y **no en navegador**.

### Lo de la v1.130.0, con detalle

**R152 · una llave que abre dos puertas.** El mismo permiso ofrecido desde dos
pantallas distintas eran **dos entradas del mapa**: encender una no encendía la
otra, y al aplanar para un PUT de juego completo ganaba la última que se leyera.

> El argumento de quien lo pidió no es de comodidad: *«un acto irreversible
> merece una sola llave. Con dos, quitar una da la sensación de haber cerrado
> sin haber cerrado»*.

**Entra porque no es suyo:** la misma acción peligrosa alcanzable desde dos
pantallas es el patrón de cualquier sistema de permisos que crezca. Y porque su
alternativa —sincronizar las dos entradas en su `onCambio`— es **reimplementar
`clave` por fuera**, que es de lo que venían huyendo desde el R151.

**Entra `claveGlobal` y NO se amplía `clave`**, que era la otra salida que
ofrecían y la de menos conceptos. Las claves son cadenas cortas y genéricas
—`editar`, `alta`— y hacerlas cruzar por omisión fundiría en **un** permiso dos
que sólo coinciden de nombre, en silencio, en productos que ya la usan: el daño
del R152 al revés. El ámbito va en el nombre y se elige a propósito.

**Su pregunta, respondida en código y no en prosa.** Preguntaron qué debe
devolver lo efectivo cuando un módulo de la llave se vacía, y pidieron que lo
decidiéramos nosotros *«porque si lo decidimos nosotros acertaremos hoy y
divergeremos en la próxima versión»*. `privilegiosEfectivos` **no cambia** —«el
módulo B no aplica nada» es una verdad sobre B— y entra `clavesEfectivas()`:
**una llave está concedida si sobrevive en al menos un módulo**. Exigirlo en
todos haría de un módulo sin su `base` un **revocador silencioso** de permisos
concedidos en otra pantalla.

**Dos mutaciones sobrevivieron a la primera batería y las dos eran huecos
reales:** `clave` podía contagiarse de módulo por llevar al lado una global, y
el aviso se comprobaba sobre el **montón** de avisos junto, así que bastaba con
que uno nombrara su módulo. Una tercera resultó **equivalente** —mutaba una rama
de un ternario cuya otra rama hacía lo mismo—, y se dice: una superviviente que
no es un hueco también hay que saber distinguirla.

### Lo de la v1.129.0, con detalle

**No se añade nada nuevo al R151: se comprueba si es verdad lo que dijimos.**
Tres auditorías adversarias sobre la v1.129.0 anterior —**ya publicada**, con los
veinte pasos en verde y las 1142 pruebas pasando—.

> Ninguna encontró nada mirando el código. Lo encontraron mirando **lo que nadie
> miraba**.

**1 · Toda la matriz estaba fuera del candado que compara las dos hojas.** Se
rompió `position: sticky` sólo en la hoja **entregada** —la regla 22, la columna
anclada— y los **ocho** candados de comparación salieron en verde; las 54 pruebas
también. El catálogo no pinta ni un `pm-*` estático: la matriz sólo existe
montada y viva, así que el barrido no tiene nada que comparar y nadie nombró sus
casos a mano. **El R142 sí los nombró**, y su comentario lo explica con todas las
letras — y la regla 22 dice «es el patrón del R142». Se repitió el patrón del
anclaje sin repetir lo único que hacía falta para que se vigilara.

**2 · `verificar-contrato` no ve una prueba apagada.** `describe.skip` sobre las
suites de la regla 23 dejaba **catorce** fuera, y el candado y la batería seguían
en verde: el patrón casa `describe` y los títulos de dentro conservan el número.

**3 · ESLint llevaba cinco versiones en rojo y no era ninguno de los veinte
pasos.** Dieciocho infracciones, dieciséis desde la v1.123.0. Y su propio guion
**salía verde cuando ESLint no podía ejecutarse**. Ahora es el paso veintiuno.

**Y cuatro formas de mover permisos sin que nadie lo viera.** Una es regresión
propia: `baseDe` preguntaba «¿hay privilegios con columna?» y debía preguntar
«¿existe una columna que se llame como el base?», así que un módulo de ids
`ver`/`editar` con columnas `consultar`/`modificar` **se vaciaba entero, también
en lista**. Otra la encontró una prueba escrita para otra cosa: **los dos puntos
fijos estaban separados y no se realimentaban**, y el comentario del segundo
decía «va dentro del punto fijo y no después» **estando después** — el comentario
correcto encima del código equivocado. Las otras dos: una clave guardada que ya
no es un privilegio viajaba **concedida**, y una `clave` repartida entre filas
encendía al compañero en pantalla sin que viajara.

**Cifras que mentían**, todas medidas: «las 39 páginas» con **70** —desfasado
desde la v1.14.0, ciento catorce versiones—, «cuarenta y cinco» iconos con 55, el
alto del marco «hoy 54px» con **64** entregados. Ahora se miden de la hoja que
viaja. `ACTUALIZAR.md` mandaba a **dos etiquetas que no existen**. Y este
directorio: `03-al-clonar.md`, el primer archivo que lee un clon nuevo, mandaba
**parar sobre un repositorio sano**.

### Lo de la v1.128.0, con detalle

**R151 · el panel de privilegios se presenta como matriz.** Control
Administrativos V2.0 fue a adoptarlo y su pantalla de permisos es una **rejilla**:
recursos en filas, acciones en columnas. El panel solo sabía ser lista.

> **Nunca nos lo pidieron, y la frase es suya:** *«habéis hecho siete cosas sobre
> una premisa que no os aclaramos»*.

Es la lección de la versión y no el código: **la forma del componente era una
decisión de producto que no estaba escrita en ninguna parte**, y las diecisiete
reglas anteriores se construyeron encima de ella. Un requerimiento no declarado
no sale en ningún candado: los veinte pasos llevaban diecisiete versiones en
verde sobre una lista que su pantalla no podía usar.

**Entra porque no es suyo.** Filas por recurso y columnas por acción es el patrón
estándar de una pantalla de permisos. Y lo que la lista no puede hacer no es
comodidad: la lista responde «¿qué puede hacer este cargo con Contratos?» y solo
la matriz responde «**¿quién** puede editar?», que se lee hacia abajo y es la
revisión periódica que a ellos les exige la norma.

**Es el mismo componente, no un hermano.** `presentacion="matriz"` con
`columnas`, y no un `MatrizPrivilegios` al lado: un hermano habría sido **dos
verdades sobre quién puede qué**, y la primera vez que las reglas 1-17 cambiaran
solo cambiaría una. Para garantizarlo, el estado de cada privilegio —dado, no
repartible, le falta un `depende`, arrastra el base, apagado— vivía dentro de la
función que dibuja la fila y **se sacó a un sitio único**. Lo único que cambia
entre lista y matriz es dónde se pinta. El criterio lo pusieron ellos: *«lo que
no queremos es reimplementar `depende` y los cuatro estados por nuestra cuenta
otra vez»*.

Cuatro decisiones más, tomadas aquí:

- **`noAplica`, el cuarto motivo, con motivo obligatorio.** Omitir el privilegio
  no es lo mismo que decir que no aplica: omitiendo, quien reparte nunca se
  entera de que esa acción existe para otros recursos y sí pregunta por qué le
  falta. La celda **sin** privilegio declarado se distingue de las cuatro y no
  dice nada. Y no se concede: `privilegiosEfectivos` lo limpia como a los otros
  tres.
- **Las filas las nombra el módulo** (`filas`). Su propuesta repartía los
  privilegios entre filas sin decir de dónde salía el nombre de cada una.
- **Se emite una `<table>` de verdad**, con `<th scope="col">` y
  `<th scope="row">`, y **cada interruptor se llama por su cruce** —«Contratos ·
  Editar»— con `etiquetaOculta`. Doscientos interruptores sin encabezados
  asociados son una pantalla que solo se puede usar mirándola, y un lector que
  anuncia doscientas veces «Editar» no informa de nada.
- **La primera columna se ancla**, que es el R142 otra vez: se reusa el **patrón**
  y no el código. Fondo propio, suelo **y techo** —en una tabla más ancha que su
  caja `width` es una sugerencia, y ahí se midió una rendija de 7 px en Chrome— y
  el hover **después** del rayado, que empatan en especificidad.

**Ocho reglas de contrato —18 a 25— con 54 pruebas.** Empezaron siendo cinco
reglas y trece pruebas, con quince mutaciones vistas en rojo. **Las tres últimas
reglas las escribieron dos auditorías adversarias**, y lo que encontraron vale
más que lo que entregamos:

1. **Con `filas` y el `base` por omisión, el módulo entero viajaba vacío.**
   `base` se buscaba por `id` literal, y con varios recursos por módulo los `id`
   son únicos —`trab-ver`, `cont-ver`—, así que **nunca existía uno llamado
   `ver`**. `privilegiosEfectivos` devolvía `{}` pasara lo que pasara con los
   interruptores, y con un backend de juego completo **eso borra permisos que
   nadie retiró**: el daño exacto que el R150 cerró. Nadie lo veía porque **las
   cuatro invocaciones de matriz que existían pasaban `base={null}`** — el
   camino por omisión no lo ejercía nadie.
2. **«Es el mismo código» era cierto al pie de la letra y falso en su
   propósito.** La matriz consumía cuatro de los seis campos del cálculo y
   tiraba `conQuien` (R99) y `arrastraElBase` (R149), y no llevaba `ayuda`
   (R148) a la celda. Una lógica, **dos pantallas diciendo cosas distintas sobre
   quién puede qué**. De paso salió que `Interruptor` nunca ató su `ayuda` al
   control: en la lista también, desde que R148 la puso ahí.
3. **Cinco formas de perder un privilegio sin un solo aviso**, y en dos de ellas
   el permiso **seguía concedido** y viajando al backend.
4. **«Quince mutaciones en rojo» no era cobertura.** Sobrevivían **23**, y la
   peor dejaba la matriz **sin poder retirar un permiso**: ninguna de las trece
   pruebas pulsaba un interruptor encendido.

Y cinco de la primera tanda de mutaciones no tuvieron efecto: el patrón no
coincidía con el texto real. **Una mutación que no muta no prueba nada**, y si no
se comprueba se lee como una prueba superada. Esa es la versión pequeña de lo
mismo: **una cifra de mutaciones rojas no mide lo que queda sin mirar.**

### Lo de la v1.127.0, con detalle

**Esta versión no añade nada al código.** Es lo que salió al preguntar en serio
si lo que se **entrega** es lo que se **promete**. Los veinte pasos estaban en
verde todo el tiempo.

> **El LEEME del ZIP decía que los componentes de React «todavía no existen».**

Es el **primer documento** que abre quien recibe la entrega, y lo decía desde la
**v1.39.0**: ochenta y siete versiones afirmando que lo más grande del paquete no
está. Dentro van 34 componentes, su hoja y su contrato. Y arrastraba cuatro cosas
más: el inventario no los listaba, el §3 **no importaba la hoja en ningún paso**
—quien lo siguiera al pie de la letra montaba los componentes sin estilo—, la
Ruta A dejaba los componentes congelados en la versión vieja, y las cifras eran
de hace ochenta versiones. **Ahora se cuentan**: una cifra a mano dentro de un
documento generado es la única parte que envejece.

`ACTUALIZAR.md` **se contradecía consigo mismo** en la misma sección —«las dos
vías NO entregan lo mismo» cuatro párrafos antes de «las dos vías entregan lo
mismo»—, y daba 79 archivos y «quince candados dentro de dieciocho pasos» cuando
son 82 y diecisiete dentro de veinte, **con un `CLAUDE.md` en el mismo paquete
diciendo veinte**.

Y **el catálogo publicaba como abiertos dos defectos ya cerrados**, con sus
cifras: R146 y R144. Los dos llevaban meses ahí escritos como «queda abierto» —y
fue leyendo esa página como el equipo los encontró—. Más la maqueta del panel,
que **enseñaba el defecto que el R148 cerró**: un privilegio concedido y
deshabilitado contado como «sin permisos».

### Lo que sí salió limpio, y por qué importa decirlo

Se resolvieron las dos hojas sobre **el marcado que los componentes emiten** —no
el del catálogo, que es lo que `verificar-promesa` ya hace—: el panel en sus ocho
estados, la tabla anclada, el rango con tope y los diez chips.

**227 elementos · 101.696 propiedades a cuatro anchos · cero divergencias.**

Y la instalación por las dos vías coincide **byte a byte** con la etiqueta. El
código estaba bien. Lo que mentía era lo que se lee.

### Lo de la v1.126.0, con detalle

**Las tres que bloqueaban**, y las tres se resumen en una frase suya: *«con ellas
abiertas, adoptar el panel significa repartir permisos que nadie concedió y
borrar permisos que nadie retiró»*.

- **R148** · no se podía enseñar un privilegio **concedido** que quien mira no
  puede repartir. Lo único por fila era `cerrado`, y `cerrado` **sustituye el
  interruptor por un chip**: el on/off desaparecía y el «4 de 6» contaba de
  menos. Entra `deshabilitado`, que es `soloLectura` por fila, **sigue contando**
  y se apaga con `aria-disabled`.
- **R149** · el `base` concedía de rebote y **nadie lo decía**. El daño no es
  «conceder de más»: con un PUT de juego completo y una regla anti-escalada, un
  `ver` que el repartidor no posee hace que el servidor **rechace el guardado
  entero**. Se dice en la etiqueta, que es lo que `clave` ya hacía.
- **R150** · `privilegiosEfectivos` tenía un `base` **independiente del panel**:
  con `base={null}` y la llamada corta, **vaciaba todos los módulos sin `ver`**.
  Ahora `onCambio` entrega lo efectivo y el parámetro pierde su valor por
  omisión: la combinación es **un error de compilación**.

### Y lo que una auditoría encontró MUERTO en la v1.125.0, antes de publicarla

**La v1.125.0 no existe como versión instalable.** Se commiteó, la auditoría la
paró, y se corrigió antes de etiquetar: las etiquetas van de la **v1.124.0** a la
**v1.126.0**. Conviene que quede escrito, porque el primer informe que salió al
equipo afirmaba que «existe y está etiquetada» — **y nadie lo había comprobado**.
Lo encontró el paso de garantizar entrega contra promesa.

**El entregable del R145 no funcionaba.** `:nth-child(n+3)` **cuenta como
clase**, así que la regla que oculta (0,3,0) le ganaba a la que enseña (0,2,0) y
el «+N» —que siempre cae en posición tercera o más— **no se veía en ningún
ancho**. Medido en los siete.

Y los veinte pasos salían en verde por una razón que vale para todo el sistema:

> `casa()` descartaba **todo** selector con un `+` o un `~` —«hermanos: no se
> soportan»— sin mirar si estaba dentro de un paréntesis.

El sistema estrenó su primer `nth-child(n+…)` y lo metió justo en el punto ciego
de **cuatro** candados, porque `verificar-promesa`, `-altura` y `-tono` importan
ese motor. *(El registro dijo «cinco» e incluía `verificar-empate`, que solo
importa `parsear` y `especificidad` y nunca llamó a `casa()`. Lo corrigió una
auditoría.)* Ahora se enmascaran los paréntesis antes de buscar el
combinador, y **lo que de verdad se salta se cuenta y se imprime**: un límite
declarado en un comentario que nadie imprime es un límite que nadie conoce.

Más **dos regresiones del R144** —el aviso colgaba de que la fila del base
exista, y un `base` dentro de un grupo se acarrilaba a sí mismo—, el carril a ras
del borde bajo 560 px, el chip fuera del nombre accesible, y **una cifra que solo
vivía en un mensaje de commit**: el 14,33:1 no estaba en ningún archivo del
repositorio. Ahora está en la regla 11, con su par y su superficie.

### Lo de la v1.125.0, con detalle

**Las cuatro salieron de LEER EL CONTRATO, no de una pantalla rota.** El panel
nació por petición de Control Administrativos —R97, v1.72.0— y llegó a su forma
actual en la v1.91.0. **Nunca lo adoptaron:** su pantalla sigue siendo una tabla
a medida de 27×7 con seis apaños, y **cinco de los seis son cosas que el panel ya
resuelve**.

> Un componente entregado y no adoptado durante dos meses es un componente que no
> se entregó del todo.

Y hay una segunda lección, más incómoda: **dos de las cuatro las llevaba
declaradas abiertas este mismo repositorio desde la v1.91.0**, con sus cifras,
sin que nadie volviera a ellas. **Declarar no es arreglar.** Declarar y no volver
es una deuda que envejece sola — y aquí la encontró el consumidor, que es
exactamente a quien la declaración pretendía proteger.

### R144 · el apagado a medias, que era el estado inicial

`opacity: .5` con el nombre a **2,07:1**, el icono a **2,03:1** y **los
interruptores aún pulsables**: la excepción de WCAG para controles inactivos no
aplicaba. Las dos cifras son nuestras, de la entrada de la v1.91.0.

Lo que lo vuelve urgente es el dato que traen ellos: **«sin base» no es un caso
raro, es el punto de partida del trabajo.** Repartir privilegios a un cargo
empieza, por definición, con los diez módulos sin su «ver», así que abrir un
cargo nuevo era abrirlo **entero** a 2,07:1.

**La señal era correcta y el canal no.** Ahora es un carril de 3 px en
`aviso-acento` —el mismo del aviso que hay encima— y **ninguna relación de
contraste se toca**. De las tres salidas que ofrecían **no se toma la de bloquear
las filas**: encender algo antes de conceder el base es legítimo, y bloquearlo le
quitaría a quien reparte el orden en que quiere trabajar.

Y el aviso sube a ir **justo debajo del base**. Estaba después de las seis filas
que describe: se leían seis permisos antes de enterarse de que ninguno se aplica.

### R145 · en el teléfono sobrevivía el número y se iba la respuesta

El comentario que lo justificaba —«el conteo 4 de 6 dice lo mismo en una línea»—
**era falso**: dice **cuántos**, no **cuáles**. Y el argumento que lo vuelve grave
es suyo: el acordeón plegado **es** la vista de repaso, así que en el teléfono
había que abrir los diez módulos uno por uno para responder «¿qué puede hacer
este cargo?» — justo el trabajo que el plegado venía a ahorrar. De las dos cosas
de la cabecera, se conservaba **la que no lleva información**.

Ahora bajan a una segunda línea con los dos primeros y un «+N». **El resumen lo
emite el componente siempre y lo enseña solo la hoja**: un componente no puede
preguntar cuánto mide la pantalla sin medir, y medir para decidir marcado es lo
que hace que el servidor y el navegador pinten cosas distintas.

### R146 · el cuarto bloqueado, que era el discutible

La v1.91.0 dejó escrito que los cuatro salían del orden de tabulación y que era
«defendible en tres, **discutible en el cuarto**». Ellos traen el dato que decide:
el bloqueado por `depende` es el **único transitorio** — se desbloquea sin
recargar en cuanto se enciende el otro—, así que quien reparte con teclado veía
aparecer en el recorrido una fila que un segundo antes no podía alcanzar, sin
nada que lo anunciara, y no tenía forma de llegar a ella para saber qué le falta.

`role="switch"` con **`aria-disabled` y no `disabled`**, que es la misma decisión
que el calendario tomó en el R139: apagado de verdad vuelve a salir del recorrido,
y volveríamos al defecto.

### R147 · la guía decía lo contrario que el código

`ACTUALIZAR.md` afirmaba que un privilegio con `depende` **deja** de encender el
`base` de rebote. El componente lleva escrito desde la v1.91.0 que **sí lo
enciende**, y que la primera redacción de esa documentación **se midió que era
falsa**. La corrección se registró en `fuente.mjs` y la guía conservó el texto
viejo **dos meses**.

Iban a programar la cascada contra la frase equivocada, y el error habría sido
silencioso: «a veces el ver se enciende y a veces no».

### Lo de la v1.124.0, con detalle

**R142 · una fila desplazada no dice de quién es.** Lo pidió Control
Administrativos V2.0 con 31, 22 y 76 columnas sobre la mesa, y el responsable lo
resumió: *«es lo que haría el móvil cómodo en vez de solo usable»*. Con
`anclarColumnas={1}` la primera columna visible —y la N.º con ella— se queda
quieta al desplazar en horizontal.

**No hizo falta contenedor nuevo:** `.tb-envoltura` es el deslizador desde el
R49, así que media solución llevaba dos años puesta. **El trabajo de verdad es el
fondo**: una celda pegajosa transparente deja ver pasar el texto de las otras
columnas, y como el rayado y el hover pintan el `<tr>`, sin reglas propias la
columna anclada saldría lisa sobre una tabla rayada. Las dos reglas **empatan en
especificidad (0,3,2)** y decide el orden — el defecto de `.tb-f` contra `.campo`
que parió `verificar-empate`.

El tipo es **`0 | 1` y no `number`**, a propósito: anclar la columna N necesita
**medir** lo que miden las N-1 de su izquierda, y el atributo `style` en línea
está prohibido por el candado. Prometer `number` hoy sería publicar una API que
no existe, que es el defecto que la v1.122.0 acaba de cerrar en otro componente.

### Y el catálogo monta la tabla de verdad — con lo que eso destapó

El anclaje reparte **tres clases** entre celdas según `numerada` y según cuál sea
la última anclada: escrito a mano diverge a la primera, y la demo de cartón **ya
divergía**.

Al montarla salió un defecto que llevaba **desde la v1.117.0**: el paquete de los
componentes vivos es un `<script>`, React lleva dentro la cadena
`"<script><\/script>"`, y con eso el candado del **elemento** daba por «pintada
por el guion» —o sea, **no comparable**— cada clase que el paquete nombrara.
Comparaba **148**; ahora compara **199**.

> Un candado que se apaga solo según crece lo que vigila es peor que ninguno,
> porque el verde se lee igual.

Lo delató la deuda de `.ms-ayuda`, que apareció como «ya no diverge» cuando sigue
divergiendo igual. Se corta **por posición**, no con una expresión regular.

Y `.tb-col-op` **deja de viajar**: tres reglas de mobiliario del catálogo
entregándose como sistema, que ningún componente podía activar —el menú de
columnas lo pinta `SeleccionMultiple`— y que se salvaban porque **ninguna de las
dos clases** de `.tb-col-op.fija` se emitía.

### R139 (continuación) · el tope guardaba un solo extremo

Lo reprodujo el responsable: con `maxDias={7}`, eligiendo primero «Hasta» y
después «Desde» salían **treinta días** y el calendario **no apagaba ni un solo
día**. El tope miraba `modo === 'hasta'`, así que guardaba el final y dejaba el
principio abierto; su producto tuvo que **volver a poner la red que había
quitado** para tapar lo que el componente prometía impedir.

El argumento con el que nació la asimetría —que un rango ya pasado no se podría
arreglar moviendo su inicio— sigue en pie, y por eso el suelo se calcula **contra
el final que hay**: los días posteriores a `hasta` se eligen igual y reinician el
rango.

Y hay una lección de método: **la prueba que decía «eligiendo el inicio no puede
haber techo» ERA el defecto, escrito como garantía.** Se ha rehecho para sostener
lo que hay que sostener —que siempre quede salida— y no una forma concreta de
conseguirlo.

### Lo de la v1.123.0, con detalle

**R143 · cinco de los diez tonos de `Chip` eran uno solo.** Control
Administrativos V2.0 lo midió en el navegador: su registro diario clasifica cada
fila con cinco estados a la vez y solo encontraban **cuatro** tonos que se
distinguieran. Tenían razón, y era peor de lo que contaban: los cuatro
`chip-identidad-N` **y** `chip-pend` pintaban el mismo relleno
—`fondo-encabezado`—, a **0,0** de distancia perceptual.

El origen está escrito en la propia hoja. El arreglo del **R95** pintó el
*filete* de cada identidad y dejó el relleno común; y la decisión de «no macizo»
es la **regla 3 del contrato, que es del HORARIO**: allí una rejilla entera de
cajas decorativas ahoga a un bloque de error. En una columna de estado hay **un
chip por fila**. Se copió sin volver a pensarla, y así se quedó desde la v1.63.0.

**No entra ningún color nuevo.** `identidad-1..4` con `identidad-texto` es el par
que el avatar, el punto de leyenda y la portada de la landing ya usaban,
verificado a **6,05 · 7,42 · 6,47 y 7,53:1**. El chip era el único sitio donde la
identidad estaba y no se pintaba. Lo preguntó el responsable con estas palabras:
*«¿se puede usar un color ya definido?, ¿para qué crear otro color?»*. El peor
par del componente pasa de **0,0 a 3,5**.

### El candado del tono, paso 20 — y lo que de verdad enseña

Los diecinueve anteriores comparan el sistema **consigo mismo**: que las dos
hojas digan lo mismo, que el catálogo enseñe lo que se entrega, que el orden no
decida distinto. Los cuatro chips de identidad **pasaban todos**, porque los dos
lados coincidían perfectamente en pintarlos iguales.

> Una divergencia no es la única forma de estar mal. **También se puede estar mal
> de forma consistente.**

El de contraste tampoco podía verlo: mide **texto sobre fondo**, y los cuatro lo
pasaban a 12,48:1 en claro y 12,19:1 en oscuro *precisamente por ser el mismo*. La
razón de contraste de WCAG
no responde a la otra pregunta —«¿se distinguen estos dos rellenos entre sí?»—:
dos colores de la misma claridad y distinto tono dan 1,00:1 y esa vara no sabe
decir si uno es gris y el otro magenta.

Se mide en **CIEDE2000**, cuyo umbral de percepción está publicado en **2,3**. Y
tres decisiones que lo hacen durar:

- **Los tonos se leen del propio componente** —el mapa `CLASE` de `Chip.tsx`—,
  así que uno nuevo entra vigilado el día que nace.
- Se resuelve la cascada en **las dos hojas** y se mide en **los dos modos**.
- **Vuelve a calcular todas las cifras que el catálogo publica.** La página del
  chip publica la distancia de cada tono a su vecino más cercano; ninguna está
  escrita a mano. Una cifra publicada que nadie recalcula envejece sola, que es
  lo que le pasó a «34 pruebas» y a «los 17 candados».

Visto en rojo con tres mutaciones: devolver un chip al gris, mentir sobre el
token de un relleno, y añadir un tono que el catálogo no publica.

### Añadido al R139 · un periodo que no cabe en el tope no se pinta

Los cuatro periodos por omisión van de un mes a un año, así que con
`maxDias={7}` los cuatro eran **botones que solo sabían dar un aviso**. Lo
reportó el responsable **después de quitarlos a mano** en su producto, que es la
prueba de que sobraban: si hay que quitarlos fuera, es que el componente no los
tenía que haber puesto. Y en sus palabras, *«cualquiera que use maxDias se va a
encontrar con lo mismo»*.

**Se esconden, no se apagan**, y es al revés que los días: un día va
`aria-disabled` porque su disponibilidad **cambia** con el inicio elegido y eso
hay que explicarlo; un periodo mide siempre lo mismo contra el mismo tope, así
que no es un control apagado sino uno que en esta pantalla **no existe**. Si no
queda ninguno, se va también el rótulo «Periodos».

Entra **`atajosDeDias`**, exportada, para que cada producto con tope no reescriba
la misma aritmética de fechas — que es lo que §4bis llama reconstruir. Y la
guarda de `aplicarAtajo` se queda como **defensa** del `rango` ajeno, declarada
como tal y con una prueba que la alcanza de verdad.

### R141 · el tope de 172 px se levanta en móvil

A 400 px los campos del filtro de fechas se apilan, el control se estira al ancho
y la flecha de unión desaparece. Se levanta **el tope del control** y no solo el
del contenedor —que era el arreglo a medias— y el campo de fecha suelto entra por
`:not(.fc-campo)`. Resuelto a cuatro anchos, con tres mutaciones en rojo; la
última necesitó mutar **las dos** apariciones de la regla.

### Lo de la v1.122.0, con detalle

**R139 y R140 · `RangoFecha` se comporta por fin como un campo.** Tres huecos
anotados del **mismo** componente por Control Administrativos V2.0, y los tres
eran el mismo: era el único campo del sistema que no se comportaba como un
campo.

**No estaba controlado, y era peor de lo que su nota sugería.**
`useState(desdeProp)` leía la prop **una vez**: `desde` y `hasta` no eran «poco
controladas», eran **el valor inicial**. Devolverle por `onCambio` un rango
corregido **no lo movía**, así que solo podían avisar *después* de que alguien
ya eligió mal:

> *«Esto pasa de avisar a impedir y las líneas se borran.»*

El caso real lo explica: su reporte semanal existe por el tope de **48 h, que es
semanal**. Sobre nueve días esa columna no significa nada.

**Y el calendario sigue ahora al rango que QUEDA, no al que se pide** — es la
regla 7 del marco con otro valor. Encadenar al segundo extremo, mover la ventana
y **cerrar la capa** cuelgan de que el cambio se haya aplicado. Sin eso,
controlado y con el producto rechazando, el calendario **se cerraba y el valor
volvía atrás**: la pantalla no hace nada y nadie sabe por qué.

### `maxDias` impide, y sin pasarlo no hay tope

Es un número cualquiera. Lo fijó el responsable: *«si la consulta es máximo 30
días debe funcionar igual, si es libre sin límite debe funcionar igual»*.

Dos mitades que no son una concesión:

- **Impide** mientras se elige el final: los días pasados del techo van
  `aria-disabled` — **y no `disabled`**, porque apagado de verdad el día sale
  del roving tabindex y quien navega con teclado se queda sin saber por qué no
  responde.
- **Avisa** cuando el rango **llega ya puesto**: se pinta y se dice, **no se
  recorta**. El componente no reescribe un valor que le dieron — recortarlo
  sería cambiar el dato de alguien en silencio; rechazarlo, negarse a pintar un
  rango que ya está guardado en su base de datos. Es lo mismo que hace `maximo`
  en el editor, que cuenta «N de más» y no trunca una letra.

Y **el tope nunca bloquea el gesto que lo arregla**: eligiendo el inicio no hay
techo, y «Limpiar» sigue vivo. Un tope aplicado a los dos extremos deja el rango
largo inarreglable.

### R140 · y el rodeo del equipo tenía un fallo que ellos mismos marcaron

Envolvían `RangoFecha` en un `Campo` para tener error, y lo apagaban con
`pointer-events: none` y opacidad. Lo escribieron en rojo y tienen razón:
**apagar con CSS no saca el control del recorrido del teclado.** Quien navega
con tabulador llegaba a un calendario visualmente apagado, lo abría y elegía una
fecha que la pantalla rechaza.

Una cosa más de ese rodeo, que no vieron: `Campo` emite `<label htmlFor={id}>`
apuntando a un `id` que su hijo no tiene. No sale doble rótulo porque
`RangoFecha` no pinta su título — pero **el vínculo estaba roto**.

**El error es del PAR**, no de un extremo: marca los dos disparadores y sale una
vez, con su icono. Y usa **`cg-mal`**, que resultó ser una deuda escondida: esa
clase **viajaba en la hoja desde siempre sin que ningún componente la
emitiera**, invisible a `verificar-promesa-muerta` porque solo mira unidades de
**dos clases o más** (`enUnidad.length < 2 → continue`) y `.cg-mal` es suelta.
Emitirla **paga** esa deuda en vez de añadir otra. Y no la elegí yo:
`verificar-altura` ya medía la fila «Rango en error» con esa clase, contra
marcado que nadie emitía.

### Y el catálogo publicaba una API que no existe

Su bloque de «copia esto» decía `RangoFechas` en plural, con `etiquetaInicio`,
`etiquetaFin`, `valor` y `permitirAbierto`. **No compilaba**, y ningún candado lo
miraba: todos comparan marcado y clases, no el texto del bloque de código.

Lo irónico es lo útil: **llevaba versiones prometiendo un `valor` controlado**.
R139 no añade API nueva — **cierra la que esa página ya había publicado**.

Y el catálogo no enseñaba **ni un `RangoFecha` en error ni apagado**, mientras
`verificar-altura` ya medía esa fila. Ahora enseña los dos.

### Lo de hoy (v1.121.0), con detalle

**«Garantiza la entrega y la promesa».** Lo pidió el responsable dos veces, y la
respuesta honesta era que **no estaba garantizado**:

| | |
|---|---|
| Componentes publicados | **35** |
| Con una prueba que compare catálogo y componente | **6** |
| Y los seis la tienen porque **primero se reportó un defecto ahí** | |

En esta sesión se cerraron **siete** divergencias de esa familia —el `title` del
marco, el señalizador de la barra, los tiempos del aviso, su ✕, su «Deshacer», y
en el horario el `title` y la `.hor-pila`—, **una cada vez que alguien miró**.
Eso no es una garantía: es suerte dirigida.

### El candado del atributo, paso 19

Para cada clase que los componentes emiten, deduce del **JSX** qué atributos
lleva **siempre**, y comprueba que el catálogo los pinte. No renderiza React —un
candado es un script suelto—: lee el JSX con un escáner que cuenta llaves y
comillas, porque `onClick={() => a > b}` mete un `>` dentro de la etiqueta.
Tarda **0,1 s**.

**La precisión fue lo que costó.** Empezó con 26 avisos y **15 eran ruido**. Sus
cinco reglas nacieron cada una de un falso positivo medido: solo valores
literales; el spread contamina la clase entera; nada que sea instancia (`id`,
`href`, `aria-controls`…); `title`/`alt`/`aria-label` por **presencia** y no por
valor —un catálogo que enseña «Densidad de las tablas» donde el componente dice
«Modo de color» está haciendo su trabajo—; y **todo o nada**, que suprime diez
ausencias parciales y es un falso negativo **declarado**.

**Nació con once divergencias, todas verificadas a mano, y las once se pagaron en
el mismo commit.** Su lista de deuda queda vacía, y falla también si alguien paga
una y no poda su línea.

Siete de las once estaban en el montón de **133 clases que `verificar-elemento`
se salta** porque el guion del catálogo las nombra. Con ellas dentro, ese candado
sale en verde.

### Y un barrido de los 35 encontró dos peores: la entrega era peor que la promesa

- **La paginación no dibujaba el chevron.** El comentario del propio componente
  decía *«el texto acompaña al chevron»* y **no había chevron**, mientras la hoja
  viajaba con `.pgn-flecha .ic{ width:14px }` que ningún producto podía activar.
  La variante «Móvil» que el catálogo enseña —flecha sola, sin texto— era
  **imposible** de montar.
- **Los estados de pantalla salían sin icono.** `ep-ico` aparecía **18 veces** en
  el catálogo y **cero** en los componentes, con cuatro reglas muertas en la
  hoja — dos de ellas, `.ep-ico-error` y `.ep-ico-sin-permiso`, la **única señal
  cromática** que distingue un error de un vacío corriente. Los siete estados
  salían tipográficamente idénticos en todos los productos.

Para eso entran **dos iconos que el catálogo ya dibujaba a mano** en SVG sueltos:
`calendario` y `suma`. Ahora son **62 en las dos superficies, mismo trazo**.
`suma` y no `mas` porque `mas` ya existe y son **tres puntos** —«más opciones»—,
no un signo de sumar: dos nombres que se leen igual y dibujan cosas distintas es
como se acaba pintando el icono equivocado.

Y el marcado de la paginación en el catálogo estaba **cruzado** —
`<span>Siguiente</button>…</span>`— con el icono **fuera** del botón.

### Lo de hoy (v1.120.0), con detalle

**R138 · Una celda del horario lleva una pila de bloques, no uno.** Lo reportó
Control Administrativos V2.0 con el horario de un profesor real: **S3 de 09:00 a
12:20 y S1 de 12:20 a 13:55 no comparten un minuto**, y el segundo se descartaba
con *«se solapa con otro bloque ya colocado»*.

**No se solapaban: compartían fila.** Con franjas de dos horas, S3 acaba dentro
de la fila 12:00–14:00 y S1 empieza en esa misma fila. El bucle reservaba **filas
enteras** —`tapada[dia][fila] = true`— así que cualquiera que empezara ahí se
caía. Reproducido con el componente: **un bloque pintado** y el aviso literal.

**Una corrección a su documento, medida.** Dicen que pasa a 120, 60, 30 y 20, y
que por eso no es cuestión de resolución:

| `paso` | S3 filas | S1 filas | Choque |
|---|---|---|---|
| 120 | 4,5,6 | 6 | **6** → descartado |
| 60 | 9–12 | 12,13 | **12** → descartado |
| 30 | 18–24 | 24–27 | **24** → descartado |
| 20 | 27–36 | 37–41 | ninguno → **se pinta** |

A paso 20 **sí** se pinta: ahí el borde de fila cae exacto en 12:20. Lo que
tienen razón es en lo que importa —**cualquier hora que no caiga en un borde lo
reproduce**—, y la regla real es peor que «depende de la resolución»: **un bloque
que acaba a media fila se queda la fila entera**.

**Ahora el choque se mide en cuartos**, que es donde de verdad ocurre, y los
bloques que comparten filas sin compartir minutos van **en la misma celda**. La
celda abarca la **unión** de las filas de todos sus bloques. El descarte no
desaparece: **cambia de criterio** —antes por fila, que es geometría; ahora por
tiempo, que es lo que de verdad no cabe— y el aviso dice **con cuál**.

**Y el bloque también se mide en cuartos.** Llevaba `flex: 1 0 auto` —todo lo que
sobre— y con un bloque por celda bastaba; con varios, «lo que sobra» es ambiguo y
dos bloques de duraciones distintas se repartirían el sobrante a partes iguales.
Es exactamente lo que el equipo anticipó al mandarlo:

> *«Si dejan que una celda lleve dos bloques, el hueco en cuartos tendrá que
> contar todos los bloques de la pila, no uno.»*

Tenían razón, y **el R137 lo dejó más fácil, no más difícil**: con porcentajes,
repartir una pila de varios habría sido el mismo defecto multiplicado.

**Las clases cambian de nombre.** `hor-q{cuartos}-{celdas}` pasa a
`hor-h{cuartos}` en el hueco, y el bloque gana `hor-d{cuartos}`. El segundo
número dejó de significar nada en la v1.119.0 —un cuarto de hora es un cuarto de
hora— y lo señaló la auditoría: eran 18 clases con **tres valores distintos**,
byte a byte iguales entre sí.

### Lo que encontró la auditoría del R138, y entró antes de publicar

**El arreglo no estaba arreglado a paso 30.** El grupo abarca diez franjas, pasa
el tope de seis, y la primera versión **descartaba a todos menos el primero** —
así que el caso que trajo el R138 seguía roto mientras **cuatro superficies**
decían que estaba cerrado, sin salvedad. Es exactamente la contradicción que
este repositorio prohíbe dejar viva, y apuntaba al equipo que lo reportó.

Ahora **pasado el tope no se descarta a nadie**: la pieza que no cabe en el juego
de clases sale **sin clase de tamaño** y hereda `flex: 1 0 auto`, que es lo que
«a celda entera» siempre quiso decir. Se pierde la proporción, **no el bloque**,
y se avisa. Un bloque que desaparece no deja hueco visible y nadie lo echa en
falta; uno mal proporcionado se ve.

| `paso` | Antes del R138 | Primera versión | Ahora |
|---|---|---|---|
| 120 | S3 | S3, S1 | S3, S1 |
| 60 | S3 | S3, S1 | S3, S1 |
| 30 | S3 | **S3** ← seguía roto | **S3, S1** |
| 20 | S3, S1 | S3, S1 | S3, S1 |

**Y emitía clases que la hoja no atiende.** A paso 30 salía `hor-d40` y la hoja
declara hasta `hor-d24`: una clase que nadie atiende coloca el bloque donde
caiga. Ahora no se emite.

**El `sort` sostenía todo el agrupador con cobertura cero.** Quitarlo dejaba las
**912 en verde**, y con la entrada invertida el bloque se pintaba **tres franjas
más abajo de su hora**, con la celda a `rowspan` 1 y catorce cuartos dentro de
cuatro. Un producto que traiga los bloques de una consulta sin `ORDER BY` lo
reproduce. Ya tiene prueba.

**Y la afirmación `R137` se conformaba con tres cosas que no bastan:**

- la satisfacía **la regla de densidad compacta**, así que se podía quitar la
  variable de la regla que aplica **siempre** y quedaba en verde con el
  sombreado desaparecido en la densidad normal;
- comprobaba **presencia y no valor**: las 48 reglas a `0px`, o las 48 al mismo
  cuarto, pasaban en verde con el R137 de vuelta entero.

Las tres, cazadas ahora.

**Cuatro cifras de este archivo** se habían quedado en la versión anterior, todas
por el mismo delta de +30 reglas: 980→**1010** de 1495→**1525**, 701→**731**
clases, y 143→**173** unidades compuestas. La tabla lleva escrito encima que cada
cifra sale del comando que tiene al lado.

**Y una contradicción viva en el contrato**: la regla 8bis seguía diciendo *«como
el hueco es porcentual»* una versión después de que el R137 demostrara que eso
**era el defecto**. La frase sobrevivió a su propio arreglo.

### Y se cierran dos cosas que la auditoría del R137 había dejado abiertas

- **El hueco de abajo no tenía ni una prueba.** Ponerlo a cero dejaba **903 en
  verde**, y es la mitad simétrica del defecto: un bloque que acaba a media
  franja se dibujaría hasta el fondo y parecería acabar en punto.
- **La afirmación `R137` solo prohibía.** Borrar **todas** las reglas del hueco,
  o declarar `--alto-franja` aparte de `height`, dejaba los 18 candados en verde
  **con el sombreado fraccionado entero desaparecido** — en el segundo caso
  porque el `calc` queda inválido y el atajo `flex` cae a `0 1 auto`. Ahora
  **exige en positivo**: que las 48 clases tengan regla, y que la variable y la
  altura las declare la **misma** regla.

### Lo de hoy (v1.119.0), con detalle

**R137 · El hueco del horario se medía contra lo que él mismo dimensionaba.** Lo
reportó Control Administrativos V2.0 con el diagnóstico hecho, y era exacto. Se
reprodujo **en su navegador**, sobre el horario de un trabajador real:

| Bloque | `rowSpan` | Hueco | Contenido | Se sale |
|---|---|---|---|---|
| 12:20 – 13:55 | 1 | **11,38** (25 % de 45,5) | 45,5 | **11,04 px** |
| 10:35 – 13:55 | 2 | 9,69 | 67,81 | 0 |

**La causa es circular.** El alto de `.hor-pila` lo decide su contenido —el
bloque lleva `flex: 1 0 auto` y **no puede encoger**— y el hueco era un
**porcentaje de ese mismo alto**. Así que el hueco se come su fracción de lo que
el bloque necesitaba, y el bloque se sale por abajo **exactamente esa fracción**.

Tienen razón en las dos cosas que dicen: **estirar la fila no sirve** —el hueco
crece con ella— y **no existe altura que cumpla las dos condiciones**. Y en que
un horario que empieza a las 12:20 es de lo más normal.

**Por qué nadie lo había visto:** con `rowSpan` 2 el bloque cabe. Y el catálogo
enseñaba **tres bloques con fracción, los tres de `rowSpan` 2**. El único caso
que falla —una celda con fracción y dos líneas de texto— no estaba en ninguna
página. Ya está.

**Y el porcentaje no era un descuido.** Era el arreglo del R94 (v1.69.0), que
venía a quitar una desviación que cambiaba con el contenido. No llegaba a
conseguirlo: con porcentaje, **dos bloques que empiezan los dos «y cuarto» se
desplazan distinto si sus filas miden distinto** — la misma enfermedad que decía
haber curado. El comentario del código decía además `flex: 1 1 auto` mientras la
regla dice `1 0 auto`: describía un bloque que puede encoger, que habría
recortado el texto en vez de desbordar. Ni una cosa ni la otra cabe.

**Ahora el hueco es una longitud**: tantos cuartos de `--alto-franja`, que es la
altura de una franja y hasta hoy era un `32` literal en un sitio y un `28`
literal en otro. Deja de depender del contenido, y **el largo del bloque deja de
importar**: un cuarto de hora es un cuarto de hora.

**Verificado en el navegador del equipo**, inyectando la hoja nueva sobre su
propia pantalla: los dos bloques pasan a desbordar **cero** y los dos quedan
dentro de su celda. La hoja de ensayo se retiró y su página quedó como estaba.

### Y al ir a garantizar la promesa, el horario tenía dos divergencias más

El responsable lo pidió con esas palabras —*«garantiza la entrega y la
promesa»*— y la respuesta correcta no era mirarlo una vez: era ver **qué lo
sujeta**. Resultado: de los cinco archivos de prueba que ejecutan el catálogo y
lo comparan con los componentes, **ninguno era el del horario**. Lo único que lo
cubría era `verificar-promesa`, y ése resuelve las dos hojas **sobre el mismo
marcado**: por construcción no puede ver que el marcado del catálogo sea otro.
Es el hueco exacto que hizo nacer `verificar-elemento`.

Al mirarlo aparecieron dos:

1. **Nueve de diez bloques sin `title`.** El componente lo emite siempre
   —«Lunes, 07:45 – 09:00»— y la maqueta no lo llevaba. Es **R135(c) otra vez**:
   el catálogo incumpliendo la regla del globito que él mismo publica.
2. **Cinco bloques fuera de `.hor-pila`.** El componente la emite **siempre**, y
   sin ella el bloque recibe `height: 100%` en vez de
   `flex: 1 0 auto; height: auto`. El catálogo demostraba **una caja que el
   componente no produce jamás** — y justo en el componente cuyo defecto de
   altura acabábamos de arreglar.

Las dos corregidas, y **nace `horario-catalogo.test.tsx`**: cinco pruebas que
comparan la anatomía de un bloque en las dos superficies, y que se vieron en
rojo reponiendo cada divergencia. Ya no depende de que alguien vaya a mirar.

### El candado que ninguno de los otros podía ser

Nace la afirmación **`R137`** en `verificar-cascada`. Ninguno lo veía, y no por
descuido:

- aquí **no falta ninguna regla ni sobra** — un porcentaje es una declaración
  perfectamente válida;
- **las dos hojas dicen lo mismo**, así que el de la promesa y el del empate
  aciertan los dos;
- **el elemento emitido es el correcto**, así que el del elemento también.

Lo que estaba mal es **contra qué se mide**, y eso solo se ve sabiendo qué
dimensiona a qué.

### Lo de hoy (v1.118.0), con detalle

**R136 · Una fila de controles es una fila.** Lo reportó Control Administrativos
V2.0 midiendo en su producto sobre la v1.117.0 ya instalada: una barra de
filtros —una fecha, un selector y el botón que dispara la consulta— entregaba
los **bordes superiores escalonados**. Tienen razón, y lo dicen mejor:

> *«Con tres alturas distintas, no hay alineación que salve la fila.»*

**La causa no era una diferencia de píxeles: era que `.campo` no tenía altura
propia.** `.btn` declaraba su interlineado —18 px, que es además el tamaño del
icono de interfaz, y por eso un botón mide lo mismo lleve icono o no—; `.campo`
**no declaraba ninguno**, así que su altura era la que heredase la hoja del
producto. La hoja que viaja **no declara ningún interlineado ambiente** —cero
reglas, comprobado—, y el catálogo corre a 1,45: ahí un campo medía **36,45**.
En cada proyecto, otra cosa.

Y estaba escrito desde la v1.102.0, en `FilaCarga`, leído como un detalle:

> *«La cifra exacta depende de la interlínea que herede el producto.»*

| Control | Interlineado | Alto |
|---|---|---|
| `.btn` | 18 declarado | **36** |
| `.campo` | **ninguno** | **lo que herede** — 36,45 en el catálogo |
| `button.fc-campo` | 20 declarado | **38** |
| `input[type=date].campo` | — | +2 px del reloj nativo |

El disparador del rango declaraba 20 **con el razonamiento escrito al lado**
—«con sus 16 de relleno son los 36 px de un campo, exactos»—, una suma que se
dejaba fuera el borde.

**Los 2 px de la fecha son del reloj nativo** y se quitan donde nacen: es el
relleno que WebKit y Blink ponen en `::-webkit-datetime-edit`, y cuadra exacto
con los 39 contra 37 que midió el equipo. **No se ha podido medir aquí** —en el
contenedor no hay navegador— y por eso se elige la forma que no puede empeorar
nada: si no bastara, la fecha se queda como estaba en vez de recortarse.

**Y el error deja de mover la fila:** el filete pasa de 1 a 2 px —señal no
cromática, SC 1.4.1— y ahora se los devuelve al relleno.

### Y aparte: el aviso temporal duraba 5 s y su token no lo leía nadie

Lo pidió el responsable el 2026-09-15 con el sistema delante: *«máximo que
permanezcan en 2seg, creo está 5seg, es mucho, son muy intrusivas»*. Tenía razón
en el número, y debajo había algo peor: **tres fuentes de verdad y ninguna
mandando.**

| | Decía |
|---|---|
| `--permanencia-aviso` | 5s, y **cero usos en toda la hoja** |
| El componente | `5000` escrito dentro |
| El catálogo | 4, 5, 7 y 10 s, uno por demostración |

El token estaba publicado en la tabla del manual como *«cuánto queda en pantalla
un aviso temporal»* — un mando que no gobernaba nada. Ahora el token baja a
**2 s**, **el componente lo lee al montar**, el catálogo lee el mismo, y la prop
`duracion` sigue mandando sobre los dos.

**Y se va desvaneciéndose.** Entraba animado y **salía de un fotograma a otro**:
se llamaba a `onCerrar` y el producto lo desmontaba de golpe, que se lee como un
fallo de pintado — el motivo exacto por el que se animó la entrada. La salida es
la entrada al revés, sin clase nueva: se quita `.av-dentro` y corre la transición
que `.av` ya declaraba. **El catálogo lo hacía desde el principio y la entrega
no**: otra promesa que el cartón enseñaba y el componente no cumplía.

Y al arreglarlo salió otra: las pruebas del aviso llamaban a `useRealTimers()`
**al final, sin `try/finally`**, así que una sola prueba rota se dejaba los
temporizadores falsos puestos y envenenaba a las siguientes del archivo — seis
de *Tarjetas* cayeron con «Test timed out» sin tener nada que ver. El
diagnóstico que se lee entonces es el equivocado.

### Y la auditoría del aviso encontró que nada de eso estaba probado

Los 18 candados y las 885 pruebas estaban en verde **delante de una máquina de
cierre entera sin tocar**. jsdom **no despacha `transitionend`**, así que cada
prueba del aviso recorría el respaldo de 400 ms y ninguna entraba por el camino
normal. Siete mutaciones sobrevivían:

| Mutación | Resultado entonces |
|---|---|
| borrar el oyente de `transitionend` | todo en verde |
| invertir su filtro (`transform` en vez de `opacity`) | todo en verde |
| quitar el guardia de doble cierre | todo en verde |
| recortar el respaldo de 400 a 100 ms | todo en verde |
| **apagar la pausa por cursor y foco** | **18 candados y 885 pruebas en verde** |

La última es la que más duele: **la regla 3 lleva versiones siendo obligatoria y
no tenía una sola prueba** — y es la que justifica bajar de 5 s a 2 s, porque lo
que da tiempo no es el reloj sino la pausa. Se compró la bajada con una garantía
que nada verificaba.

Y `verificar-contrato` lo daba por bueno porque la sección **no declaraba sus
archivos de prueba**: caía en el montón común y le valía cualquier prueba con un
`[N]` que coincidiera. Al declararlos saltaron además las reglas **1 y 2**, que
llevaban desde su nacimiento sin una prueba que las nombrara.

**Tres defectos reales**, aparte de la cobertura:

1. **`transitionend` burbujea**, y el filtro miraba la propiedad pero no el
   `target`: la transición de un botón que el producto meta dentro del aviso
   —su «Deshacer» es un nodo suyo— lo cerraba antes de tiempo. Con la hoja que
   viaja hoy no pasa, porque ningún hijo transiciona la opacidad; pasaría con
   cualquier hoja propia que lo hiciera.
2. **`onCerrar` se quedaba viejo**: el efecto de salida capturaba el de su
   render, así que un producto que lo cambiara durante el desvanecido recibía
   el anterior.
3. **«Deshacer» cerraba el aviso en el catálogo y no en la entrega.** El mismo
   botón hacía dos cosas según dónde se mirara. Cierra, que es lo correcto:
   deshacer deja de ser verdad lo que el aviso dice.

Y dos divergencias más viejas que nadie podía ver: **la ✕ era el carácter `×` en
la entrega y un SVG en el catálogo** —con `.av-x .ic` viajando en la hoja sin que
ningún producto pudiera activarla—, y el «Deshacer» entregado arrastra las clases
de `Boton` que el del catálogo no tenía. Al igualar el catálogo saltó
**`verificar-empate`**: `.av-accion` empata con `.btn-terc` y `.btn-mini` sobre el
mismo elemento, y cada hoja lo resolvía al revés —azul de enlace a 13 px en el
producto, negro a 12 px en el catálogo—. Se ancla al aviso, `.av .av-accion`, que
es donde esa regla tiene sentido.

### El candado quince mide FILAS, y no un número

Un sistema no tiene **una** altura de control: tiene **filas**, y lo que importa
es que los que se ponen juntos midan igual. `verificar-altura` comprueba tres
sobre la hoja que viaja —normal 36, en error 36, compacta 28— y lleva **deuda
declarada** de dos que hoy no cuadran, con sus números.

**La fila compacta tampoco cuadraba, y nadie lo había mirado:** el botón mini
medía 28 y el filtro de columna 29,5. Ahora los dos 28.

Ninguno de los catorce anteriores podía verlo, y no por descuido: el de la
**cascada** busca reglas que **faltan**, y aquí no faltaba ninguna —sobraban
tres, cada una correcta por su cuenta—; el del **empate** busca quién gana un
desempate, y `.btn` y `.campo` no empatan porque caen sobre elementos distintos;
el de la **promesa** resuelve las dos hojas sobre el **mismo** marcado, así que
las dos responden lo mismo y **las dos aciertan**. La pregunta que faltaba no
era sobre un componente: era **entre** componentes.

### Dos auditorías pararon el primer arreglo, y tenían razón

La primera versión puso **altura fija** a todos los controles y **mínimo** a
todos los botones. Con eso:

- el **botón mini** pasaba de 28 a 36 —66 en el catálogo—, la barra del editor
  crecía 8 px por fila, y el disparador de las cargas pasaba de 1 a 9 px de
  desnivel con su chip, contradiciendo la medida sobre la que está construida
  esa fila;
- los **filtros compactos** de tabla y de la barra, que declaran `padding: 4px`
  a propósito, saltaban de 28 a 36;
- **recortaba 2 px el campo en error**, que lleva borde de 2 px — justo el caso
  que el docstring del candado decía temer, y que el candado no miraba;
- dejaba muerto el `min-height: 0` del área de texto.

**Una altura fija no arregla una altura mal calculada: la tapa.** El candado
nació sin ver ninguna de esas tres cosas; ahora las caza, vistas en rojo una a
una.

Y la prueba que ata la lista del candado **no ataba nada**: emparejaba por
subconjunto, así que la entrada genérica `input.campo` cubría también al de
contraseña y al del selector con búsqueda, y se podían borrar del candado sin
que nada se pusiera en rojo. Ahora la pregunta es **por componente**.

### Y un defecto en el resolutor compartido, que usan otros cuatro

Al escribirlo apareció: el resolutor de cascada **aplicaba al elemento las
reglas de sus pseudo-elementos**. Respondía que un campo de fecha tiene relleno
`0` y altura `100%` —los valores del iconito del reloj— y habría dado el color
del texto de pista como color del campo. Corregido, y **comprobado que los otros
cuatro candados dan exactamente la misma salida que antes**: gana precisión sin
perder cobertura.

### La ceguera que se cerró

**El catálogo no enseñaba una barra de filtros en ninguna página.** Es de lo más
común que monta nadie, y el caso exacto del R136. Ahora está en *La entrega
real*, que es donde se pinta **solo con la hoja que viaja**: ahí se habría visto
a simple vista.

### Lo de hoy (v1.117.0), con detalle

Dos cosas, y **la segunda es la que impide que la primera vuelva a pasar**.

#### Cambia el criterio del menú

Lo decidió el responsable con el menú delante: *«mostrar un menú corto y solo
donde estoy ahora»*. Desplegado, los grupos llegaban **todos abiertos** y el
cursor no los tocaba: con cuatro grupos de cinco opciones son veinte renglones
siempre a la vista, y ninguno dice dónde estás mejor que los otros.

Ahora llegan plegados; solo está abierto el de la pantalla en curso, que lleva
`.fijo` y su título en el acento; **el cursor revela** cualquier otro y al salir
se pliega; y **elegir una opción mueve el fijado**, plegando el anterior.
Plegado no cambia nada.

**Esto deroga la regla 9**, que escribí yo hace tres versiones —*«desplegado el
cursor NO abre los grupos»*— y que el equipo consumidor **respaldó por escrito**
en R135. Su argumento era que abrir al pasar por encima *cuando ya se lee todo*
es ruido, y se apoyaba en que **ya se leía todo**. Con un menú corto deja de
sostenerse. La regla vieja se queda escrita como derogada, con su motivo: una
regla que desaparece sin rastro obliga a redescubrir por qué se pensó lo
contrario.

**Y resucita `.nav-grupo.fijo`**, que la hoja estilizaba desde hacía versiones y
que **ningún producto podía activar** — deuda declarada en
`verificar-promesa-muerta`, podada hoy porque se diseñó para exactamente esto.
El modelo no es nuevo: **es el que la barra del catálogo llevaba funcionando
desde el principio, a mano.**

#### El catálogo monta el componente de verdad

Lo pidió el responsable: *«en el cascarón usa tus componentes, así podré
detectar algún cambio no solicitado»*. Y es lo que MMI-DS §9.1 dice desde el
principio —*«el catálogo importa los componentes reales y no puede divergir»*—
y lo que no se estaba haciendo: había un HTML escrito a mano que **sí puede
divergir, y divergió cuatro versiones seguidas**:

| Versión | Lo que divergía |
|---|---|
| v1.114.0 | el `title` que el catálogo pintaba y el componente no emitía |
| v1.114.0 | el hover que el catálogo demostraba y el componente no hacía |
| v1.115.0 | la maqueta con enlaces y chevron, marcado que el componente no produce |
| v1.116.0 | la regla 12, que entró en el componente y no en el catálogo |

`sistema/cascaron/marco-vivo.tsx` es código real que importa `MarcoApp`. El
generador lo empaqueta con esbuild **dentro del contenedor** y lo incrusta:
**162,9 KB** minificados, y el catálogo pasa de **2 360 605** a **2 543 235
bytes** — **+178 KiB**. La primera cifra que se escribió aquí —«de 2,30 a
2,38 MB»— **no la había medido nadie**, y las dos estaban mal; lo cazó una
auditoría. Medir ésta tiene un pliegue que conviene contar: **el texto que dice
el tamaño vive dentro del archivo que mide**, así que la cifra se mueve al
escribirla. Se regeneró hasta el punto fijo y se comprobó que la segunda vuelta
daba el mismo número. **Si el empaquetado falla, el generador para** — un catálogo sin el componente vivo que no lo dijera
sería la misma mentira que esto viene a cerrar.

Está en *Maquetas*, debajo de las tres de cartón, con el aviso de cuál manda.

**Verificado con el ratón en el componente real**, no en el cascarón: al cargar,
solo el grupo de la pantalla en curso abierto y fijo; pasar el ratón revela
otro; pulsar una opción mueve el bloqueo y el anterior se pliega solo.

### Lo que encontró la auditoría de la v1.117.0 — y entró antes de publicar

Seis cosas, y la primera bloqueaba la entrega.

**1 · Con teclado, el título de un grupo no lo cerraba nunca.** `alternarGrupo`
soltaba el fijado y dejaba vivo el cursor, así que el grupo seguía abierto y
`aria-expanded` respondía `"true"` **justo después de pulsarlo para cerrarlo**.
Con ratón se disimulaba —el `mouseleave` llegaba al apartarlo—; con teclado no
hay `mouseleave`. Es **WCAG 4.1.2**: el estado que se anuncia no es el que hay.
Ahora soltar limpia también el cursor, y hay dos pruebas, una por cada entrada.

**2 · La barra del catálogo no sincronizaba el atributo de ocultar** de los
hijos. Sus ocho grupos cerrados lo llevaban **ausente** mientras `MarcoApp` lo
emite siempre — y el manejador de rama, diez líneas más abajo en el mismo
archivo, sí lo sincronizaba, con un comentario que llama a ese estado *«uno que
MarcoApp no produce jamás»*. La función de al lado lo producía.

**3 · La misma barra marcaba el cursor con una clase `.hover`** que **ninguna
regla de la hoja atiende**, que `MarcoApp` no emite, y que además **choca de
nombre** con `.s-tabla tbody tr.hover`, que sí existe y es de la tabla. Era
estado interno disfrazado de clase. Ahora es `data-cursor`, un atributo.

**4 · Las maquetas de cartón pintaban la opción activa sin `aria-current`.**
El componente lo emite desde siempre; la maqueta enseñaba el color y callaba lo
que oye un lector de pantalla — que es justo el defecto de R135(c) otra vez.

**5 · El empaquetado del marco vivo se tragaba el error real de esbuild** con
`>/dev/null 2>&1`, así que un fallo de tipos en `marco-vivo.tsx` se anunciaba
como «levanta el contenedor»: el consejo equivocado, y el que más tiempo hace
perder. Ahora los diagnósticos van a la salida de errores, heredada.

**6 · El generador no podía correrse dentro del contenedor.** Llamaba a
`docker-compose`, que ahí dentro no existe — y correr los generadores dentro es
**exactamente lo que manda `LEVANTAR-EN-WINDOWS.md`**, porque en esa máquina no
hay `node`. Ahora pregunta dónde está (`/.dockerenv`) y llama a `npx esbuild`
directamente. Al arreglarlo apareció un segundo fallo que el primero tapaba:
`--outfile=/dev/stdout` no funciona cuando la salida estándar es una tubería.

Y de regalo, **la lista de candados de `LEVANTAR-EN-WINDOWS.md` decía DIECISÉIS
y le faltaba `generar-cascaron.mjs`** — el mismo hueco que `CLAUDE.md` §8
registra de sí mismo desde la v1.107.0, arreglado allí y no aquí. Es la cuarta
vez que esa lista se queda corta. Quien siguiera esas instrucciones corría los
candados del catálogo contra el catálogo de la versión **anterior**, en verde.

**Y las notas de la publicación de GitHub eran una plantilla fija** —la misma en
las 117 versiones—. `fuente.mjs` lleva por cada versión qué cambió, por qué, y
una lista `rompe` con lo que puede romperle a quien actualiza; el catálogo la
pinta y **la publicación no decía una palabra**. Quien entra por ahí, que es la
puerta que abre `npm install`, recibía el aviso de cambio de comportamiento sólo
si además se le ocurría abrir el catálogo. Ahora salen de `CAMBIOS`, con su
sección «⚠️ Puede romperte», y se reescriben también si la publicación ya existía.

Tres cifras de la documentación **no coincidían con lo que miden las
herramientas** —§9 «cero invención»—: la deuda declarada decía 8 y son **7** en
dos sitios, y el tamaño del catálogo estaba mal en los dos que lo citaban.

### La SEGUNDA auditoría de la v1.117.0 — la que encontró un defecto de verdad

La primera ronda encontró huecos. La segunda, con el trabajo ya corregido,
encontró **un defecto funcional nuevo que la primera no vio**, y por eso la
entrega no salió ese día.

**EL RATÓN EXPULSABA EL FOCO DEL TECLADO.** Al reescribir el menú, «qué grupo
está revelado» pasó de ser un conjunto a **un solo valor**, movido a la vez por
el ratón y por el foco. Con eso, pasar el cursor por un grupo **desalojaba al
anterior en el acto** aunque el anterior estuviera abierto porque **ahí vivía el
foco de alguien**. Y como `.nav-hijos[hidden]` es `display:none`, el navegador
**expulsa ese foco al `<body>`**: quien navega con teclado perdía el sitio
porque otra persona movió el ratón, con `aria-expanded` diciendo `"false"` sobre
el grupo donde estaba. **WCAG 2.4.3 y 4.1.2**, y pasaba con el riel extendido y
también plegado.

Era **nuevo de esta versión** —hasta la v1.116.0 era un conjunto y nadie
desalojaba a nadie— y **ninguna de las 870 pruebas lo miraba**.

El arreglo es **dos señalizadores en vez de uno**: el ratón está en un sitio y
el foco en otro, son dos hechos independientes, y un grupo se ve abierto si lo
reclama cualquiera de los dos. Los 220 ms de gracia son **solo del cursor** —
existen porque el ratón tiene que cruzar los 56 px del carril, y el foco salta
sin recorrer nada.

**Siete mutaciones sobrevivían en verde**, y las siete son ahora rojo:

| Pieza | La mutación que pasaba desapercibida |
|---|---|
| `aria-expanded` | `{estaFijo}` en vez de `{abierto}` — 70/70 y 8/8 en verde |
| `onBlur` entero | vaciarlo: tabular dejaba **todos** los grupos abiertos |
| la guarda `contains` del `onBlur` | quitarla: ir del título a una opción de dentro cerraba el panel **bajo el foco** |
| la clase `.fijo` | pintarla sobre `abierto`: **dos acentos a la vez** |
| `sincronizarGrupos`, rama controlada | borrarla entera |
| `GRACIA_SALIDA` | 220 → 120, o → 101: el número no estaba sujeto por abajo |
| `navegar` | el respaldo `?? clave` era **rama inalcanzable** — código muerto, retirado |

**Y el catálogo tenía tres cosas más**, todas del mismo patrón —el catálogo
incumpliendo lo que él mismo publica—:

1. **`#lateral` no emitía `aria-current` en ninguna parte.** Marcaba la página
   en curso solo con la clase, mientras la página de *Paginación* de ese mismo
   catálogo publica como regla que *«la página actual lleva `aria-current`;
   **el color solo no la marca**»*. Es R135c otra vez, cerrado para el rótulo
   del ratón y no para esto.
2. **Soltar un grupo con el cursor encima dejaba resultados distintos**: el
   componente cerraba, la barra del catálogo no. El mismo gesto, dos entregas.
3. **El HTML estático nacía incoherente**: nueve grupos diciendo
   `aria-expanded="true"` sin el atributo de ocultar, y solo el guion los
   cerraba al cargar. El archivo que se entrega decía «todos abiertos» — el
   criterio que la regla 9 deroga.

**Y una prueba que no se corría sin decirlo.** Al añadir las pruebas nuevas del
catálogo, la suite empezó a responder:

```
Error: Worker exited unexpectedly
Test Files  49 passed (50)
Tests  857 passed (870)
```

Ningún fallo, ninguna prueba en rojo, y **trece pruebas que no se ejecutaron**;
el archivo que faltaba no aparece por ninguna parte del resumen. Cada catálogo
vivo cuesta **unos 150 MB** medidos —32 MB → 187 → 314 → 476 con tres—, y con
seis *workers* en paralelo el contenedor se quedaba sin memoria. **Lo cazó
`publicar.mjs`**, que juzga por código de salida y no por el texto: la
corrección que le hizo una auditoría el 2026-09-11, demostrando aquí para qué
servía. `fileParallelism: false` — 50 de 50 y 875 de 875, en 82 s en vez de 24.

**Y ocho cifras más de la documentación que no coincidían** con lo que miden las
herramientas: 846 pruebas eran **870** el día que se midió —y **875** al cerrar la versión, con las cinco que trajo la tercera auditoría— en tres sitios, «178 pares en vez de 89»
son **186 en vez de 93**, «9 conocidos pero prohibidos» son **10**, la tabla de
las dos vías decía 77 y 59 archivos y son **78 y 60** —y el 59 se contradecía
con el «60 archivos» de catorce líneas antes—, «los diecisiete candados» son
**catorce** *ocho líneas después de corregir exactamente eso*, y «son 56
versiones» desde la v1.19.0 son **112**.

**Lo que se deja como está, y por qué:** la entrada de `CAMBIOS` de la v1.19.0
dice «178 pares en vez de 89» y **no se toca**. Es el registro de lo que se midió
el 2026-08-09; hoy son 186 porque en 98 versiones se añadieron pares. Reescribir
una medición fechada es peor que tenerla vieja.

### La TERCERA auditoría — la que auditó la corrección

Se auditó el arreglo, no solo el trabajo. Encontró **dos defectos más**, y el
primero es el que este repositorio declara fatal.

**1 · La corrección no había llegado al catálogo.** Se arreglaron los dos
señalizadores en `MarcoApp` y **la barra propia del catálogo se quedó con uno**,
puesto y quitado por el ratón *y* por el foco. Midiendo **el mismo gesto en las
dos hojas**:

| gesto | barra del catálogo | componente |
|---|---|---|
| foco dentro del grupo, el ratón pasa por encima y se va | `abierto:false · aria:"false" · oculto:true` | `abierto:true · aria:"true" · oculto:false` |
| ratón encima, el foco sale del grupo | `abierto:false · aria:"false" · oculto:true` | `abierto:true · aria:"true" · oculto:false` |

Es el defecto cartón/entrega **sobre el punto exacto que define la versión**, y
en la versión que se publica para cerrarlo. Ningún candado podía verlo: los
estáticos no ejecutan y los de cascada comparan estilos, no gestos. Ahora la
barra lleva `data-cursor` y `data-foco`, y hay dos pruebas que ejecutan el
catálogo y hacen ese gesto.

**2 · Plegar el riel expulsaba el foco del teclado.** `sincronizarGrupos` suelta
los grupos, y cerrar un grupo le pone `hidden` a su panel: `display:none`. Con
el foco dentro, el navegador lo tira al `<body>`. Llegaba por **las dos puertas
que nadie miraba** —la ventana cruzando los 900 px sola, y el producto plegando
desde fuera (R21)—; las otras dos ya movían el foco antes, y por eso no se veía:
el clic en el botón se lo lleva y Escape lo devuelve a mano. **Es preexistente**
—la v1.116.0 vaciaba su conjunto igual— y se cierra aquí porque esta versión se
publica precisamente por este daño. Ahora el foco se va al botón de plegar.

**Tres mutaciones más sobrevivían en verde** con 90 pruebas: `sincronizarGrupos`
soltando solo el cursor y no el foco —que es justo el hueco del defecto 2—, la
limpieza de temporizadores al desmontar, y el rescate del foco. Las tres están
en rojo.

Y dos cosas menores: un señalizador podía quedarse **rancio** si cambiaba la
navegación —un grupo que volviera a montarse con la misma clave llegaba revelado
sin que nadie lo tocara—, y una prueba se titulaba *«SIN RATÓN se llega a todas
las pantallas»* midiendo solo que el grupo se abre. **El título prometía más de
lo que la prueba mide**, que es el mismo defecto que esta versión persigue,
cometido en el sitio donde más engaña.

**Lo que la auditoría confirmó que sí funciona**, midiendo en vez de razonar: las
ocho combinaciones de ratón y foco, el recorrido con teclado en los dos estados
del riel —18 paradas, `aria-expanded` sin mentir en ninguna—, y que los
temporizadores no se fugan al desmontar.

**Sobre serializar las pruebas:** se midió que `maxWorkers: 3` pasa cuatro de
cuatro en 32 s, y que con **4 muere**. El margen es de un obrero, y eso no se
escribe en un archivo que viaja a máquinas con otra memoria. Se queda
serializado.

### Lo de la v1.116.0, con detalle

**La regla 12 entró en el componente y no en la barra del catálogo.** La
v1.115.0 publicó *plegado, las ramas del panel flotante llegan abiertas*, y lo
metió en `MarcoApp` y en la maqueta. La **barra propia del catálogo** —la que la
gente recorre, y la que los pasos de reproducción del equipo señalan— se quedó
atrás.

Medido con el ratón en Chrome el 2026-09-15, **con la regla ya publicada**: el
panel abría y las ramas seguían cerradas, nietos a 0 px y `visibility: hidden`.
Exactamente el defecto que R135b reportó, **vivo después de arreglarlo**.

Es el patrón de esta casa en su forma más pura: se arregla el componente, se
escribe la regla, y la superficie que la gente toca se queda atrás. Ahora
`plegarLateral` abre las ramas al plegar y las cierra al desplegar, salvo la que
lleva la página en curso, donde manda la regla 6.

**La prueba nueva ejecuta el catálogo**, no lee su marcado en reposo: el defecto
no estaba en el HTML, estaba en lo que el HTML hace al plegarse.

**De paso, verificado en navegador lo de la v1.115.0**, que hasta ahora era
cascada resuelta y no pintado: el tercer nivel sale en `flex`, icono y rótulo en
la misma línea, y la fila mide 26 px. El sangrado dentro del panel es de 28 px y
no 56, por una regla anterior y correcta: ahí no hay carril que compensar.

**Y la auditoría cazó una afirmación falsa mía**: dije que el recorte con puntos
suspensivos funcionaba dentro del panel. No funcionaba — `white-space: normal`
ganaba la cascada, y con `normal` los puntos solo actúan sobre lo que no se
puede partir, así que un rótulo de varias palabras **envuelve**. Con los rótulos
cortos de hoy no se nota, y por eso lo vi bien en Chrome. Arreglado en la hoja.

La barra del catálogo divergía además en cinco atributos del componente:
`aria-controls`, `id` en los nietos, `hidden`, `aria-hidden` en el chevron.
Un botón que anuncia `aria-expanded` y no dice **qué** controla deja al lector
sin el otro extremo. Corregidos.

### Lo de la v1.115.0, con detalle

**R135, de Control Administrativos V2.0, sobre la v1.114.0 ya instalada.** Tres
cosas medidas, y una de ellas la tenían desde el 11/09 sin mandar.

**(a) El icono caía encima del rótulo.** `.nav-nieto` era `display: block`
mientras `.nav-hijo` es `flex`, así que cualquier icono en el **tercer** nivel se
apilaba sobre el texto y la fila medía el doble. Lo descubrieron montando
*Marcaciones › Configuración* y **tuvieron que quitar el icono**: un menú con
icono en los niveles 1 y 2 y sin él en el 3, sin que ninguna regla del sistema
dijera que así debía ser. El sangrado de 56 px y el cuerpo de 12 px **no se
tocan**: lo pidieron expresamente y hacen su trabajo.

**(b) Con el riel plegado no se llegaba al tercer nivel.** Dentro del panel
flotante, una rama cerrada **no se abre al pasar por encima** —solo el grupo lo
hace—, así que quedaba detrás de un clic **dentro de un panel que solo vive
mientras el puntero esté encima**. Pidieron una decisión explícita entre tres y
se toma la segunda: **el panel llega desplegado**. Un resumen con secciones
plegadas no resume, y anidar un segundo «abrir al pasar» dentro de un panel que
se cierra al salir es una trampa de temporización, no una función. Extendido no
cambia nada: la regla 6 sigue.

**(c) Los globitos que el resumen promete no estaban en el catálogo**, y éste va
al revés de lo habitual: su producto los tenía y el catálogo no. 16 de 86.

**Y el catálogo no enseñaba el tercer nivel del marco en ninguna parte**, por eso
(a) solo se descubría montándolo.

**La auditoría tumbó la primera versión de este arreglo, otra vez**, y encontró
cinco cosas que no protegía nada — entre ellas **la razón de ser del efecto**:
las dependencias son solo `plegado`, y con `navegacion` dentro —un array literal
en cada render del producto— se reabriría todo lo que el usuario cierre. Estaba
escrito en el componente y **las 57 pruebas seguían en verde** al romperlo.
También: el tercer nivel de la maqueta estaba en el marcado y en `display:none`,
y el recorte con puntos suspensivos se perdía dentro del panel flotante.

Nace `marco-catalogo.test.tsx`: el menú del catálogo contra el que emite el
componente, **atributo a atributo**. Es lo que ningún candado mira.

### Lo de la v1.114.0, con detalle

**El menú plegado era una fila de iconos mudos, y el catálogo prometía un hover
que la entrega no tenía.** Lo pidió el responsable con una frase que es el método
entero: *«quiero que pases el mouse sobre el menu extendido y comprimido, y me
digas si esa forma de prometer el funcionamiento del menu esta en la entrega»*.
Se pasó el ratón en Chrome, en los dos estados, y la respuesta era **no** en tres
puntos.

**1 · El icono mudo.** Plegado, `.nav-txt` iba a `display:none` —que lo saca
también del árbol de accesibilidad— y el `<svg>` va `aria-hidden`. Una opción
**sin hijos** se quedaba sin rótulo de ninguna clase, y tampoco abre panel
flotante, que es lo que identifica a las que sí los tienen. **El catálogo lo
rotulaba con `title` desde siempre y el componente no emitía ninguno**: cero
coincidencias de `title=` en `MarcoApp.tsx`.

**2 · El hover que no existe.** La barra del catálogo abría los grupos al pasar
el ratón con el menú **desplegado**; el componente solo lo hace plegado. Estaba
decidido y probado, pero **no escrito**, así que el catálogo podía contradecirlo
sin que nada fallara.

**3 · La maqueta no enseñaba un solo grupo.** Pintaba ocho enlaces con un chevron
dentro —marcado que `MarcoApp` **no produce nunca**— y con eso el panel flotante
no se demostraba en ninguna parte del catálogo.

**Y en cuanto la maqueta empezó a emitir grupos de verdad, `verificar-cascada`
destapó un cuarto**: `.nav-hijos` declara `display:grid`, que gana a la regla
`[hidden]` del navegador, así que el atributo que el componente emite **no
ocultaba nada**. Un guion del catálogo reventó además entero, porque construía
el menú móvil desde `.lat-nav .nav-grupo` y ese selector no decía de qué
mobiliario hablaba.

**Por qué no lo vio ninguno de los candados de entonces.** Dos cegueras que se cruzan
justo aquí: `verificar-promesa` **descarta todos los estados** —hay una línea que
salta `:hover`, `:focus` y compañía— y **ninguno compara atributos de marcado**
entre catálogo y componente. `title` es un atributo. Nace `CARRIL-CON-NOMBRE` en
`verificar-cascada`, que resuelve la hoja **que viaja** y falla si el rótulo del
carril plegado sale del árbol.

Tres reglas de contrato nuevas —**8, 9 y 10**— con sus pruebas.

**Y dos auditorías tumbaron la primera versión de este arreglo**, que es lo que
más enseña de la versión:

- **El guard del hover miraba el elemento equivocado**: preguntaba por el lateral
  del *catálogo* y no por el de la maqueta. Resultado: la maqueta plegada no
  abría panel y la desplegada sí — lo contrario de lo que el arreglo decía hacer.
- **Los guiones del catálogo gobernaban las maquetas** con selectores globales:
  las cerraban al cargar —el componente las abre—, las dejaban sin poder pulsar,
  y con un estado que `MarcoApp` no produce jamás. Ya están todos acotados.
- Las dos maquetas **repetían cuatro `id`**.
- **Dos de los cinco `title` no estaban protegidos**: la prueba montaba un menú
  sin tercer nivel, así que no había rama ni nieto que mirar.
- Y la prueba del árbol de accesibilidad **no podía ver nada** —jsdom no carga la
  hoja—: era verde con el rótulo y sin él. Se reescribió para decir lo que sí
  comprueba, y esa mitad la protege `CARRIL-CON-NOMBRE`.

**Al declarar la sección del contrato salió a la luz otra cosa:** las reglas
**transversales** vivían pegadas a la tabla del marco **sin título propio**, así
que el candado las daba por del marco y su respaldo salía de una coincidencia de
número. Ya tienen sección, con sus tres archivos de prueba declarados.

### Lo de la v1.113.0, con detalle

**La letra escrita al final de un párrafo se salía del párrafo.** Lo cazó una
auditoría sobre el arreglo de la v1.112.0, y es el mismo error dos veces
seguidas: **una posición contada en caracteres es ambigua en toda frontera**. En
`<p>uno</p><p>dos</p>`, el 3 es a la vez «al final de uno» y «al principio de
dos», y las dos resoluciones son correctas la mitad de las veces. Se probaron las
dos y **las dos se publicaron**: hacia atrás mete la letra en la línea de arriba
tras un Intro; hacia delante la saca del párrafo al escribir al final.

No se puede resolver la ambigüedad con el dato que la produce, así que ahora se
guarda también **de qué lado** estaba el cursor. Solo se nota cuando el saneo
reescribe —al pegar, al abrir un documento sucio o al escribir dentro de un
hueco—: teclear normal no reescribe nada.

Verificado tecleando en Chrome otra vez, comprobando además que el cursor queda
**dentro** de su párrafo.

**Hueco declarado y sin cerrar:** si el saneo retira texto **por delante** del
cursor, el cursor se corre esos caracteres. Arreglarlo pide comparar el antes y
el después, y eso es otra pieza. Hay una prueba que fija lo que hace hoy.

### Lo de la v1.112.0, con detalle

**El editor de texto no se podía usar.** Lo reportó el responsable con la
v1.111.0 ya publicada: *«cada vez que digito un caracter, el cursor pasa a
ocupar el primer caracter, no es posible escribir textos continuos»*.

La causa era **un carácter**. El saneador serializaba el espacio duro como
carácter crudo y `innerHTML` lo devuelve como `&nbsp;`: dos cadenas distintas
para el mismo contenido. El componente decide si reescribe la caja comparando
las dos, así que la respuesta era «cambió» siempre; reasignar `innerHTML`
destruye todos los nodos y con ellos la selección. Y el navegador mete un
espacio duro **cada vez que se teclea un espacio al final**, así que desde la
primera palabra la pieza quedaba inservible.

**Lo que esto enseña es más caro que el arreglo.** Tres rondas de auditoría
adversaria, diecisiete pasos en verde y 787 pruebas no cazaron que el componente
no se pudiera usar. Ninguna prueba escribía: todas montaban estados y comparaban
HTML escrito a mano — y a mano nadie escribe un espacio duro, lo pone el
navegador. **Una pieza que se teclea hay que probarla tecleando.**

Se cierra por los dos lados: `escapar` escapa los **cuatro** caracteres de la
norma de serialización —eran tres—, y nace `interno/cursor.ts`, que conserva el
cursor cuando la reescritura hace falta de verdad. La segunda mitad importa más
que la primera: una quinta diferencia futura costaría una posición de cursor por
un instante, no el componente.

**Y una auditoría encontró un defecto EN EL ARREGLO**: `ponerElCursor` resolvía
una posición en la frontera entre dos nodos hacia atrás, así que tras Intro la
letra siguiente entraba en la línea de arriba. Un `>=` que tenía que ser `>`.

**Verificado tecleando en Chrome**, con el componente real empaquetado y servido
en loopback: escribir de corrido 157 caracteres por encima de un `&nbsp;`, Intro
y seguir en la línea nueva, el botón de negrita —que emite `<strong>`, no `<b>`—
y el botón de hueco. Es la primera vez que esta pieza se prueba en un navegador,
y es la lección de la versión.

Quedan **seis huecos declarados**, tres nuevos: `etiquetas` sin `br` deja Intro
inservible y el componente no avisa; escribir dentro de un `{{hueco}}` lo borra
entero (avisando); y un padre con un `debounce` ingenuo puede revertir lo
tecleado.

### Lo de la v1.111.0, con detalle

**El editor de texto con huecos (R119 del equipo). La pieza no es un editor: es
la garantía de que lo que sale cabe en el destino.** Tres listas entran desde
fuera —`etiquetas`, `huecos`, `maximo`—, una invariante sale: lo que llega a
`onCambio` **siempre** está dentro de ellas, venga de teclear, de pegar, de
arrastrar o de deshacer. Y lo que **entra** por `valor` se sanea igual.

La garantía vive en una función pura —`interno/sanear.ts`— que se prueba entera
sin navegador: **49 pruebas**. El componente aporta 54 más y la comparación
contra el catálogo 4.

**Lo importante de esta entrega no es lo que se construyó, sino lo que hizo
falta tumbar antes de publicarlo.** Dos rondas de auditoría adversaria, y la
segunda encontró, entre otras cosas, **un defecto que ninguna prueba podía ver**:
el saneo llamaba a `DOMParser` dentro del render, y `DOMParser` no existe en
Node — así que cualquier producto con renderizado de servidor moría con
`ReferenceError` y **la página entera no se pintaba**. Las 787 pruebas corren en
jsdom, donde `DOMParser` sí existe. Lo cazó un `renderToStaticMarkup`, no una
prueba.

El patrón que se repite en casi todos los hallazgos es el mismo de siempre en
esta casa: **se afirma un comportamiento que no está construido, o que está
construido y no se ejecuta.** Las tres formas que tomó aquí:

- «la ficha es indivisible» escrito en tres sitios **sin una línea de código**;
  luego construido con `onBeforeInput` de React, que React 18 **no conecta** al
  `beforeinput` nativo, así que seguía sin correr;
- el aviso de «esto se retiró al pegar», que se borraba **en el mismo cuadro en
  que se ponía** — dos veces, por dos caminos distintos: el `input` que el
  navegador despacha tras `execCommand`, y el `blur` de irse a pulsar la barra.
  **El gesto natural de reaccionar al aviso lo destruía**;
- una prueba cuyo título decía comprobar el origen del aviso y cuya única
  aserción era otra cosa: **se le quitó entero el mecanismo que nombraba y
  siguió en verde**.

También cayeron cifras publicadas que no eran ciertas, y una de ellas enseñó
algo de método: el tiempo de pegado se daba como **un número solo** —«4,3 MB en
2,3 s»— y **depende tanto del contenido que un número solo engaña**. Con HTML
sucio de Word medimos 3,0 s; una auditoría con otro corpus midió 2,7 s; con HTML
limpio del mismo tamaño las dos medidas ni siquiera coinciden en el orden. El
2,3 s es anterior y **no dejó escrito con qué se midió**. Ahora el apartado dice
las tres, con su corpus, y lo único que las tres sostienen: **bloquea el hilo
segundos**.

Y una que es del sistema entero, no del editor: **ESLint no se corre en ninguno
de los diecinueve pasos.** Solo corre `probar-candado.mjs`, que prueba los
patrones contra casos sintéticos. Al correrlo sobre el repositorio salen **dos
errores que viajan hoy en el paquete**: `Estados.tsx` usa el atributo `style` en
línea en dos sitios, que es justo lo que §2.5.6 prohíbe. **Queda declarado y sin
cerrar**: no se toca un componente publicado la víspera de una entrega, y el
arreglo de fondo —que el paso de lint exista— es trabajo con nombre propio.

### Lo de la v1.101.0, con detalle

**El equipo dijo «hay un error» en fecha y rango. No era un error suelto:
`RangoFecha` entregaba la mitad del calendario que el catálogo enseña.** La hoja
que viaja estilizaba **24** clases `fc-*` y el componente emitía **14**. Once
viajaban sin que ningún producto pudiera activarlas: el marco, la rejilla de dos
meses, el panel de periodos, el resumen, el guion, la vista previa y el campo
activo.

Y la regla de `≤620px` que colapsa el calendario a una columna **cuelga de
`.fc-cal-cuerpo`**, que nadie emitía: en un teléfono salía a dos columnas
apretadas y nadie sabía por qué.

Encima, las reglas del campo iban atadas a `input.fc-campo` mientras el
componente emite `<button class="campo fc-campo">` —decisión suya, defendida en
su cabecera—, así que el campo de fecha salía **sin icono de calendario, sin
tope de ancho y sin estado activo**. La hoja pasa a seguir al componente.

**Ningún candado podía verlo**, y es la misma familia que R116: el cuerpo del
calendario del catálogo es un `<div id="fc-cuerpo">` **vacío** que rellena su
guion. Los que leen marcado estático no tenían con qué comparar.

Arreglarlo **podó dos deudas declaradas** que ya no divergen y destapó un
defecto propio del foco: al saltar un año el foco se perdía, porque mover la
ventana de meses es un dibujado más y la bandera de enfocar ya se había
consumido.

---

### Lo de ayer (v1.100.0), con detalle

**Auditar los documentos contra el código, con cinco agentes en paralelo.** Los
35 documentos de `peticiones/` se leyeron enteros y cada afirmación verificable
se comprobó contra el árbol de hoy. El resultado no fue una lista de erratas:
fueron **dos defectos vivos en produccion desde la v1.7.0**, los dos en el
`Avatar`, los dos prometidos por escrito y ninguno cumplido.

**1 · La foto que no carga no caía a las iniciales.** No había `onError`, y con
`foto` puesta las iniciales **ni siquiera estaban en el DOM**. Una URL firmada
caducada pintaba el icono de imagen rota del navegador dentro del círculo, en la
barra superior de todas las pantallas. El JSDoc del propio tipo lo prometía, así
que la fuente instalada mentía sobre sí misma.

**2 · El recorte apuntaba a la clase equivocada.** `.av img` —el **aviso**
temporal— en vez de `.avatar img`. Una letra. Y `.av img` no casaba con nada en
ninguna parte: el aviso no lleva imágenes. Regla muerta de un lado y ausente del
otro. Una foto de 400×400 se pintaba a tamaño natural dentro de un círculo con
`overflow:hidden`: un trozo de la cara, ampliado.

**Por qué duró 1,7 años:** el catálogo **no pinta ni un solo avatar con `<img>`**
—solo la silueta en SVG, que sí estaba cubierta por esa misma regla— y no había
ninguna prueba de `Avatar`. Es, otra vez, «lo que el catálogo no pinta no lo
compara nadie».

---

### Lo de la v1.99.0, con detalle

**Dos defectos de papeles, y los dos en documentos que VIAJAN.**

**1 · El contrato de comportamiento estaba roto desde la v1.78.0.** Empezaba con
tres filas de tabla sueltas, sin cabecera, y el titular `# Contrato de
comportamiento` pegado al final de la tercera **sin salto de línea** — es decir,
no era un titular: era texto dentro de una celda. La edición de la v1.78.0 quiso
insertar dos reglas en «Fila de carga» y renumerar la vieja 7 a 9; el bloque
aterrizó en la línea 1 del archivo. **Veintiuna versiones así.**

Y el candado no podía verlo: `verificar-contrato` localiza las filas por su
número con una expresión regular y **le da igual dónde estén**, así que las tres
contaban como reglas válidas y salía en verde. Es la misma familia que todo lo
demás de este repositorio — un candado solo dice que lo que ese candado mira
está bien.

**2 · Este sistema acuñó números de requerimiento que no le pertenecían.** El
registro lo escribe el equipo que pide, y `R123 · selector búsqueda asíncrono`
ya existía a las 16:52 del 09/09 cuando el trabajo se publicó a las 20:27 como
**R118** — número sacado de mirar el `R117` del historial de git. Choca con el
R118 real (diálogo con acción en gerundio) y con el R119 (editor de texto con
huecos). Se declara una **tabla de concordancia** en vez de renombrar: renombrar
dejaría `main` diciendo una cosa y el ZIP ya descargado otra. Regla nueva en
CLAUDE.md §4ter: **el agente no acuña números.**

---

### Lo de la v1.98.0, con detalle

**R119 · Los activos de marca, medidos en vez de recordados.** El encargo era
pasarle requerimientos al equipo de diseño. Al escribirlos se decodificaron los
PNG con un lector escrito a mano —no hay ImageMagick ni se instala nada— y
aparecieron tres correcciones a lo que este repositorio afirmaba:

| Lo que se decía | Lo que hay |
|---|---|
| «El escudo suelto **no existe**; solo está incrustado en los lockups» (`LEEME.md`) | **Sí existe**: `imagenes/AE.png`, 1063 × 1291, fondo transparente. Lo que no existe es el **juego de tamaños** de §10 |
| «§8.5: **dos** rojos en la identidad» | **Tres.** `#E30613` (escudo suelto), `#EC2027` (wordmark) y `#EC1C24` (el escudo **dentro** del lockup) |
| «`#1D1D1B` es el texto del lockup» | Lo es, pero **no el wordmark**: «ALBERT EINSTEIN» es rojo. El casi-negro son dos bandas de 7 px — «COLEGIO» arriba e «UN EINSTINO: UN TRIUNFADOR» abajo |

**El tercer rojo es el hallazgo, y su forma importa.** Localizado por su caja:
x 23-53, y 32-71, que cae **dentro** de la zona del escudo (x 0-66) y no en
ningún texto. Cuatro unidades de verde y tres de azul de diferencia con
`#E30613` no son una decisión de diseño: son la huella de un recoloreado o de un
perfil de color distinto. Entra en `categoricas.marca` como
`rojo_escudo_lockup` — **conocido y no autorizado**, que es lo que la regla del
usuario permite hacer sin consultar. Nombrarlo lo mete bajo el candado de color;
autorizarlo no lo decide el agente.

**Y una corrección a un documento propio, ya publicado.** El anuncio de
requerimientos decía que el `#1D1D1B` era el wordmark y que el caso era un
«incumplimiento de SC 1.4.3». Las dos cosas mal: el wordmark es rojo, y **WCAG
2.1 exime expresamente a los logotipos** del mínimo de contraste. Sigue siendo
un problema real de legibilidad —«COLEGIO» y el lema desaparecen sobre la
lateral— pero **no es un incumplimiento normativo**, y llamarlo así era
sobreactuar. Corregido en el repositorio y en la página que se pasó al equipo.

---

### Lo de la v1.97.0, con detalle

**R118 · El selector busca contra el servidor.** Sus props eran catorce y
ninguna asíncrona: `filtradas` era `normalizar(o.texto).includes(q)` sobre el
array recibido. Sin `onBuscar`, sin `cargando`, sin rebote y sin cancelación.

Lo que decidió la forma fue mirar el repositorio antes de inventar nada:

| Se encontró | Y por eso |
|---|---|
| `TablaDatos` ya tiene `modo: 'navegador' \| 'servidor'` | La palabra no se inventa: se reutiliza, con el mismo significado |
| El catálogo publica «Cargando: esqueleto, giro o nada» | El aspecto ya estaba decidido: **esqueleto**, y nada bajo 300 ms. El giro es «el último recurso, no el primero» |
| `.esqueleto` ya existe y ya viaja | No nace otra clase para lo mismo (POLÍTICA, regla 1) |
| La tabla «Cuál de los dos» ya mandaba al servidor | Esto no es una función nueva: es **cumplir lo publicado** |

**Quién se queda el ciclo — lo decidió el responsable.** Las dos opciones eran
`onBuscar` avisando y el producto actualizando `opciones`, o `onBuscar`
devolviendo una promesa y el componente quedándose con todo. Se eligió lo
segundo, y el argumento es el mismo por el que MMI-DS §9 acepta ayuda externa
justo en este patrón: **la carrera es un fallo silencioso**, y lo que cada
producto tiene que acordarse de hacer es lo que un día no hace.

**Un defecto que el modo destapó, y que no estaba en la petición.** `elegida`
salía de buscar `valor` dentro de `opciones`. Contra el servidor eso se rompe
solo: se elige a Ana, se teclea otra cosa, la lista se reemplaza y **Ana ya no
está en ninguna parte** — el campo en blanco con un valor puesto. Misma familia
que el `null` que la firma prometía y no emitía (R103). Se arregla dentro y no
pidiéndole al producto que pase el texto.

**Visto en rojo, que es lo que exige el §9:**

| Rotura | Qué salió |
|---|---|
| Quitar la bandera `vivo` que cierra la carrera | «una respuesta vieja que llega tarde NO pisa a la nueva» en rojo: pintó «An la vieja» |
| Devolver `elegida` a `opciones.find(...)` | «la elección sobrevive» en rojo: el campo salió vacío |

**Y una lección del arnés, no del componente.** Las trece pruebas nacieron con
`vi.useFakeTimers()` y **las trece se colgaron**. No era el componente: el
`@testing-library/dom` instalado detecta relojes falsos con
`typeof jest !== 'undefined'`, que bajo vitest da **siempre falso**; la librería
toma su camino de relojes reales y se queda esperando un `setTimeout(…, 0)` que
esos relojes ya no van a disparar. Comprobado con un `<button>` pelado y un solo
`click`. Se reescribieron con relojes de verdad y el rebote acortado por la prop
—que existe—, midiendo contra el reloj de pared solo los dos umbrales, con
margen de 150 ms contra 300.

**Lo que se añadió al catálogo, y por qué el candado de la omisión tenía razón.**
Al montar la demostración salió en rojo: `.sel-op` **nunca se veía sin
modificador** en ningún marcado estático, porque todas las filas del catálogo
las pinta su guion. Ahora hay tres paradas quietas —la fila por omisión, la
`marcado` y la elegida con su visto—, que no existían en ninguna versión
anterior.

---

### Lo de la v1.96.0, con detalle

**R116 · Lo que R115 dejó abierto: quién vigila que no vuelvan.** Las nueve
divergencias del selector se arreglaron a mano y se fijaron con diecisiete
pruebas — pero esas diecisiete **escriben a mano lo que el catálogo enseñaba ese
día**. Protegen del olvido, no de la deriva: el día que alguien toque el guion
del catálogo, siguen en verde con las dos superficies otra vez distintas. Que es
exactamente cómo nacieron las nueve.

Ahora **el catálogo se ejecuta dentro de las pruebas**: `cascaron/index.html`
entero, con su guion, en jsdom. Se despliega su lista y se compara árbol contra
árbol con la del componente, alimentado con **los datos del propio catálogo** —
`OPCIONES`, `AYUDA` y `VACIO` se leen del HTML generado, no se copian—. Siete
comparaciones: lista abierta sin texto, con una opción elegida (el mando de
vaciar, el visto **y su lado**), texto sin coincidencia, texto con coincidencia,
las clases de la caja abierta y cerrada, y el orden de sus hijos.

**Visto en rojo tres veces**, que es lo que exige el §9:

| Rotura | Qué salió |
|---|---|
| El visto ✓ delante del texto en el **componente** (defecto A2) | B en rojo |
| Sin la clase `abierta` en el **componente** (defecto A1) | E en rojo |
| El visto ✓ delante del texto en el **catálogo** | B en rojo — **y las 34 pruebas anteriores en verde** |

La tercera es la que justifica que exista. Ninguna prueba escrita a mano puede
ver que el catálogo se movió.

**Comprobado además, y esto sí es una garantía sobre lo entregado:** las dos
hojas declaran **22 reglas `.sel-*` contra 22**, declaración por declaración
idénticas. Las 4 que solo están en el catálogo son `sel-demo-*` — el mobiliario
de la demostración, que por diseño no viaja desde el renombrado de R115. Con el
mismo árbol y las mismas reglas, lo que se pinta es lo mismo.

**Queda declarado y sin cerrar:** el vacío **por omisión**. El guion del catálogo
añade la fila de «crear» siempre que hay texto sin coincidencias, y sin texto
trae las 19 opciones: su rama de `.sel-vacio` está escrita y **es inalcanzable**.
El componente sí llega a ella —`onCrear` es opcional, así que un producto que no
lo pase ve `.sel-vacio`—, y la hoja le entrega `.sel-vacio` y `.sel-vacio
strong`. **Dos reglas que viajan sin ninguna demo que las prometa.** Es la misma
familia que R104, la variante sin lupa. Mientras no haya demo, la prueba G fija
lo único que se puede fijar sin inventar la promesa: que el componente emite el
`<strong>` que la hoja estiliza — y **falla el día que el catálogo sí alcance
`.sel-vacio`**, para que entonces se compare de verdad.

**Y lo que esto NO garantiza, dicho con todas las letras:** solo cubre el
`SelectorBusqueda`. Cualquier otro componente cuya pieza principal aparezca al
desplegar sigue exactamente igual de descubierto que el selector el día 28.

### Lo de la v1.95.0, con detalle

**R115 · El selector con búsqueda: la promesa no era la entrega, en nueve
puntos.** Lo reportó el equipo que lo usa en un sistema — *«tengo la v1.94 y es
con los estilos de la entrega»*—. Tenían razón, y lo primero fue descartar la
causa fácil: **md5 del ZIP publicado contra el repositorio**, idénticos byte a
byte. No era su instalación.

**Cinco se veían**, medidas en Chrome sobre la hoja que viaja:

| | Catálogo | Producto |
|---|---|---|
| chevron al abrir | `rotate(180deg)` | **`none`** — no giraba nunca |
| el visto ✓ | x = 306,4 px | **x = 8,0 px** — al otro lado |
| nombre de la fila elegida | 8,0 px | **98,3 px** — desalineado de sus vecinas |
| `.sel-notas` | 13 px secundario | **15 px** — sin estilo ninguno |
| fila de «sin resultados» | 64,3 px, dos líneas | **44,15 px**, una línea gris |

Dos de ellas eran **CSS muerto que viajaba en el paquete de todos los
productos**: `.sel-caja.abierta` sin que nadie emitiera `abierta`, y
`.sel-notas p` sobre un `<span>` sin ningún `<p>` dentro. Y esa segunda no era
un descuido de marcado: **`.sel-notas` nombraba dos piezas distintas** —la ayuda
de la opción y la columna de notas de la demostración—. La que se renombró fue
**la de la demostración** (`sel-demo-notas`, que ya no viaja): el nombre público
se queda donde estaba y **ningún producto tiene que tocar nada**.

La del visto no la decidía el CSS —las dos hojas declaran lo mismo— sino **el
orden de los hijos** bajo `justify-content: space-between`. Por eso el candado
de la promesa no podría haberla visto ni dándole la lista abierta: resuelve la
cascada sobre el **mismo** marcado.

**Cuatro se tecleaban**, contra la tabla de teclado que el catálogo publica: ↑
no abría la lista, las flechas topaban en vez de ciclar, Inicio y Fin no
existían, y **Tab no elegía lo marcado** —`onCambio`, cero veces—, así que quien
tecleaba, veía su coincidencia y tabulaba al siguiente campo **se llevaba el
campo vacío**.

**Lo que más importa no es ninguno de los nueve: es que los quince candados
estaban en verde.** En el catálogo la lista del selector es un `<ul hidden>`
**vacío** que llena su guión al abrirla, así que `.sel-op`, `.sel-check`,
`.sel-vacio` y `.sel-caja.abierta` no existen en el marcado estático que el
candado de la promesa lee, y ninguno de sus 50 estados fijados a mano es del
selector. El de huérfanas no ve `.sel-caja.abierta` porque `.sel-caja` sí se usa
—**la ceguera de prefijo, otra vez**, la misma de `.sel-op.activa`—. El de la
omisión hace la pregunta contraria. Y **la tabla de teclado no estaba en
`comportamiento.md`**, sino solo en el catálogo, así que el del contrato no
podía leerla: *un contrato publicado donde ningún candado mira no es un
contrato, es una intención*. Ahora está ahí, como ocho reglas Obligatorio.

**Nace `verificar-promesa-muerta`, el candado dieciséis.** Su pregunta: toda
regla de la hoja **que viaja** que exija dos clases sobre el **mismo** elemento,
donde el componente emite la base y **nadie** emite el modificador. Se ata **por
archivo** y no en un montón común, y esa fue la corrección que hizo falta nada
más probarlo: `abierta` la emite `MarcoApp` en `.nav-rama.abierta`, así que un
montón global **daba por viva `.sel-caja.abierta`** y el candado salía en verde
delante del defecto que nació para cazar. Visto en rojo contra el código de
ayer.

**Y encontró un décimo defecto que nadie buscaba:** `Paginacion` no emitía
`activa`, así que **la página en curso no se pintaba en ningún producto** — el
lector se enteraba por `aria-current` y la vista no. Arreglado en la misma
versión.

**Lleva deuda declarada:** nueve promesas muertas más —`chip-punto`,
`fc-activo`, `tb-detalle`…—, verificadas a mano con `grep` contra
`componentes/src` y escritas con su daño real. El candado **falla también si una
se arregla y no se poda**.

**Queda declarado y sin resolver:** el candado del contrato empareja la regla
con su prueba por **número global** —`R9` en cualquier prueba respalda la regla
9 de cualquier sección—, así que las ocho reglas nuevas del selector están
**débilmente atadas** ahí. Quien las sostiene de verdad son sus diecisiete
pruebas y el candado nuevo. Arreglarlo pide numerar por sección.

### Lo de la v1.94.0, con detalle

**R114 · La acción secundaria de la cabecera.** Control Administrativos la pidió
para Trabajadores —«Agregar» principal y «Carga masiva» secundaria— y con una
pregunta honesta: *si dos acciones en la cabecera está mal, dígannos dónde va la
segunda, porque el hueco lo hemos buscado y no lo hay*.

**No estaba mal el caso: estaba mal el contrato.** El componente decía «una
sola: si hay dos, ninguna es la principal». La página de Acciones —escrita
antes— dice **«una sola PRINCIPAL por pantalla; el resto son secundarias o
neutras»**. El contrato había estrechado «una principal» hasta «una acción», y
el producto llevaba razón sin saber que **el sistema ya se contradecía consigo
mismo**. La regla de una sola principal no cambia.

Y traían un defecto medido: la única regla de `.pant-accion` era el `width: 100%`
del móvil, así que **no tenía ni `display` ni `gap`**: dos botones salían pegados.

**Queda declarado y sin resolver:** la demo de esa página pinta un `h2` con estilo
en línea para imitar el `h1` que emite el componente —hay un solo `h1` por
documento—, así que `.pant-cab h1` **viaja sin que ninguna pantalla la
demuestre**. Es R58 con una razón legítima detrás, y no lo ve ningún candado.

### Lo de anteayer (v1.93.0), con detalle

**R113 · El color de los iconos de redes.** Se pidió pintarlos con los colores
de marca. Se midió antes de tocar nada, y la medida cambió la pregunta: **de los
cinco colores de marca, solo uno sirve para pintar un icono**.

| | claro | oscuro | ¿varía con el modo? |
|---|---|---|---|
| `marca-rojo` | 4,88:1 | 4,69:1 | **sí** |
| `marca-oro` | **1,81:1** | 8,58:1 | no |
| `marca-celeste` | **2,56:1** | 6,07:1 | no |
| `marca-amarillo` | **1,17:1** | 13,24:1 | no |
| `marca-rojo-panel` | 4,88:1 | **1,66:1** | sí |

Los cuatro que fallan **valen lo mismo en los dos modos**: cuando el fondo
cambia, ellos no. Lo mismo les pasa a los `identidad-*` —2,07 a 2,57 en
oscuro—, y de ahí salió el 1,91:1 de R107.

**Autorizado el 2026-08-28 por el responsable**, con alcance escrito: solo los
iconos de redes. Sigue prohibido como texto y como superficie.

**Y para poder vigilarlo hubo que abrir dos herramientas** que solo sabían mirar
los semánticos: el generador y el candado de contraste devolvían `undefined` con
un token de marca. O sea que el sistema **no podía vigilar un color de marca
aunque se autorizara**. Autorizar sin poder medir habría sido repetir R107.

### Lo de ayer (v1.92.0), con detalle

**R112 · Redes sociales.** Siete iconos —Facebook, Instagram, YouTube, TikTok,
WhatsApp, X y LinkedIn— dibujados en el estilo del sistema, y un componente con
tres formas (suelto, círculo, cuadro), relleno o contorno, tres tamaños, con
nombre y con cuenta, en fila y en columna.

**Los colores de marca no entran**, y no es gusto: §2.5.5 dice que ampliar los
colores autorizados no lo decide quien escribe un componente. Los iconos heredan
`currentColor`, lo que además les hace funcionar en los dos modos. Si el colegio
quiere sus colores de marca, **eso es una autorización**, no un arreglo.

**El candado quince, que es el hallazgo de verdad.** El sistema dibuja cada
icono **dos veces** —`TRAZOS` para el catálogo, `TRAZOS_REACT` para los
productos— y **nada comprobaba que dijeran lo mismo**. Se compararon los 45 que
había antes de tocar nada: coincidían los 45. O sea que el sistema llevaba **111
versiones dependiendo de que nadie se equivocara al copiar, y acertando**. Eso
no es una garantía, es una racha. Ninguno de los doce podía verlo: uno compara
propiedades CSS y otro compara etiquetas, y `svg` contra `svg` es igual.

### Lo de ayer (v1.91.0), con detalle

Se encargó a dos agentes auditar que la promesa fuera igual a la entrega en
R109 y R110. **Con los doce candados en verde, volvieron con catorce hallazgos.**

1. **Nueve iconos publicados como `<svg>` vacíos.** `ic()` recibe el trazo y
   `icono()` el nombre; nueve llamadas de la página del panel le pasaban el
   nombre a `ic()`. Cuatro entraron esta mañana; **cinco llevaban ahí desde
   R97**. Ningún candado puede verlo: `verificar-elemento` compara etiquetas
   —`svg` contra `svg`— y `verificar-promesa` compara propiedades, no si el
   elemento tiene hijos. Es el hueco de R56 y R58 corrido un nivel: ya no es la
   etiqueta, es el **contenido**.
2. **Dos afirmaciones falsas escritas por nosotros**, las dos medidas: que
   `depende` desactiva el encendido de rebote del `base` —no lo hace— y que el
   aviso de `accept` iba al revés. Corregidas donde se leen, **y también en la
   nota de versión de la v1.90.0**, que las publicaba como ciertas.
3. **`textoBoton` se ignoraba en silencio** en `en-linea`. Entran `nombreTipo`
   e `icono`.
4. **La rama `en-linea` entera faltaba del catálogo** —van cinco veces el mismo
   defecto— y `.cpdf-panel` era CSS muerto que viajaba.
5. **`privilegiosEfectivos` no filtraba lo cerrado.**

**Lo que salió bien:** el contraste del icono nuevo **cumple** (4,81 claro /
5,30 oscuro). No había un R107 repetido. Pero **nadie medía ese par**: se
declaran `aviso-acento` e `info-acento` contra `fondo-tarjeta`.

**Queda abierto y escrito en el catálogo:** los cuatro estados bloqueados salen
del orden de tabulación, y `.pp-sin-base` deja el nombre a **2,07:1** con los
interruptores **aún pulsables**, así que la excepción de WCAG no aplica.

### Lo de ayer (v1.90.0), con detalle

**R109 · `CargaPdf` deja de decidir qué acepta.** El PDF estaba clavado en tres
sitios; el peor era `type: 'application/pdf'` al reconstruir el `File`, que hacía
que el archivo **mintiera sobre sí mismo** en cuanto salía del componente. Entran
`accept` —que ya existía con ese nombre en `CargaImagen` y `CargaId`— y
`validar`. **No se hizo componente nuevo**, que es lo que pidieron y es lo
correcto: el que existe ya resuelve arrastrar y soltar, la lista, los rechazos y
el reset del `<input>`.

De camino, dos cosas que el caso destapó: comprimir solo se intenta si los bytes
son un PDF, y el progreso decía «Comprimiendo» también con `comprimir={false}`
—mentira desde que existe esa prop—.

**R110 · `PanelPrivilegios` gana `depende`.** El `base` es uno solo y de un
salto, así que no sabe expresar `leer → crear → carga-masiva`. Con `depende` se
ve bloqueado y dice cuál falta, encender arrastra la cadena entera, apagar no
borra —R98 sigue en pie— y `privilegiosEfectivos` le quita el efecto.

**Consecuencia que hay que saber:** un privilegio con `depende` deja de encender
el base de rebote.

**Y una clase muerta desde R99.** Al sacar el ternario anidado fuera del
`className` —el candado de huérfanas leía trozos sueltos y se inventaba `.no` y
`.falta`— salió `.pp-no`, emitida en cada fila bloqueada **desde R99** y que
ninguna regla define. Además, las cuatro `pp-no-*` **viajaban sin que el catálogo
pintara ninguna**: el defecto de `cpe-no-imprime` de ayer, tres veces y más
viejo. Ahora se pintan las cuatro juntas.

### Lo de ayer (v1.89.0), con detalle

**R108 · EFACT.** Se pidió buscar su documentación como segundo proveedor. Tres
cosas que quedan escritas:

1. **La primera lectura de su tabla de productos fue incorrecta**, y produjo la
   conclusión de que EFACT solo acepta XML. Releída celda por celda: son **tres
   productos**. «Validación simple» es XML UBL 2.1 por SOAP; **«Dynamic+» acepta
   JSON, TXT y CSV por REST y SFTP**; «Efact Web» es un portal que no integra
   con nada. La corrección está escrita **dentro de la página**, porque la
   conclusión errónea era la que decidía si las siete pantallas de este grupo
   servían o había que rehacerlas.
2. **De Dynamic+ no existe ni una línea de especificación pública.** Ni esquema,
   ni URL de homologación, ni autenticación, ni catálogo de errores: llega
   después de firmar. Con Nubefact la integración se evalúa antes de
   comprometerse; aquí no.
3. **Dos cosas que la página se niega a afirmar:** quién firma en Dynamic+ —dos
   lecturas de la misma celda se contradicen, y eso decide si hay que custodiar
   el certificado del colegio— y si EFACT tiene modelo revendedor, del que no se
   encontró ninguna mención ni a favor ni en contra.

Lo único verificado de verdad: el WSDL responde en
`ose.efact.pe/ol-ti-itcpe/billService` y es el de SUNAT sin modificar.

La página **no aporta ni una regla de CSS**: se compone entera con lo que ya
existía. Es la política de creación funcionando sin que nadie la empuje.

### Lo de ayer (v1.88.0), con detalle

**R107 · una auditoría encontró lo que catorce candados en verde no veían.**

El responsable pidió encargar a un agente que auditara si la promesa es igual a
la entrega en `psl-*` y `cpe-*`. Los catorce estaban en verde y aun así
aparecieron tres cosas. **Ninguna se veía fallando.**

1. **Un contraste de 1,91:1 en oscuro, ya publicado.** `.psl-sdk-et` usaba
   `identidad-2` como **color de texto**. Ese token vale lo mismo en los dos
   modos —su uso declarado es «Decorativo»— así que daba 6,46 en claro y **1,91
   en oscuro**; SC 1.4.3 pide 4,5. Era el **único sitio de toda la hoja** donde
   un token de identidad se usaba como texto, y **el candado de contraste no lo
   vio porque solo mide los pares declarados**: un par que nadie declara no se
   mide.
2. **Los candados de cascada medían ` print` como si fuera pantalla.**
   `mediaCasa` no encontraba ningún `max/min-width` en «print» y devolvía
   `true`, así que medían `.cpe-impresa` **en pantalla con sus valores de
   impresión**. No daba rojo porque el error era **simétrico**, y ese es justo
   el verde que este repositorio no admite.
3. **`.cpe-no-imprime` viajaba sin demostrarse** — el mismo defecto que
   `sel-con-lupa` esta mañana.

**Queda declarado y sin resolver:** lo impreso no lo comprueba ningún candado
—solo se excluye de las mediciones de pantalla—, `verificar-omision` es ciego a
estas dos familias por cómo escriben sus modificadores, y no hay componente de
React detrás, así que su marcado no tiene contrato.

### Lo de la v1.87.0, con detalle

**Nace «Boleta electrónica» sobre Nubefact — y la primera hoja de impresión.**

Siete páginas: Nubefact, emitir, notas, anulación, cotización, guía de remisión
e impresión. Un agente leyó su documentación entera —cuatro manuales y sesenta
ejemplos JSON— y el inventario salió con **14 operaciones, 6 tipos de
comprobante, 19 tipos de IGV, 13 motivos de nota de crédito y 5 de débito**.

**Tres hallazgos cambian el diseño más que cualquier campo:**

1. **El modelo revendedor.** Cada empresa emisora —y cada local— tiene **su
   propia ruta y su propio token**; el RUC **no viaja en el JSON**. De ahí sale
   una regla de **seguridad**: el selector de empresa emisora **no puede existir
   en la pantalla del colegio**, porque un descuido emitiría un documento
   tributario bajo el RUC de otro cliente. El rol se enciende por configuración y
   decide qué piezas **ni siquiera se montan**.
2. **Una boleta recién emitida sale «no aceptada» y eso es normal**: viaja en un
   resumen diario a las 24 h, con plazo de hasta 7 días. Si la pantalla lo pinta
   en rojo, el colegio llamará por teléfono todos los días.
3. **La cotización no es un comprobante.** No está entre las 14 operaciones. Si
   compartiera la maquinaria, la pantalla **mentiría**: enseñaría un estado ante
   SUNAT que no existe y un botón de anular que no anula nada.

**Anular no es borrar**, y la pantalla no debe preguntarlo: dentro de 7 días es
comunicación de baja —asíncrona, con ticket—; pasados, nota de crédito. Con la
fecha delante el sistema sabe cuál toca. Y **la guía de remisión ni siquiera se
anula por API**: solo desde SUNAT con la Clave SOL.

**Piezas nuevas que viajan** (familia `cpe-*`, 29 reglas): las **líneas** del
documento —tabla de verdad, no rejilla de divs, porque son datos tabulares—, el
**estado ante SUNAT** con sus cuatro caras, y la **representación impresa**. Esa
última estrena la **primera regla ` print` del sistema**: hasta hoy no
había ninguna.

### Lo de la v1.86.0, con detalle

**Niubiz — la quinta y última, y el eje del rechazo no es el código.**

Con esta quedan **las cinco pasarelas conocidas del Perú** en el catálogo, todas
con el mismo andamiaje y todas con sus huecos declarados.

Publica **77 códigos de acción**: solo **dos** son aprobación (`000` y `010`) y
75 son rechazo. Pero cada uno trae una columna **`TIPO DE RECHAZO`** —`APROBADO`,
`TEMPORAL`, `PERMANENTE`—, y **ese** es el eje que debe gobernar la pantalla: 77
pantallas sería absurdo y una sola haría reintentar tarjetas robadas.

**Es la que menos se puede parecer a nosotros.** `buttoncolor` solo admite `NAVY`
o `GRAY` —no un hexadecimal— y el texto del botón de pagar es **blanco
impuesto**: ese par de contraste **no lo controlamos y no puede entrar en nuestro
candado**. La vía para que se vea nuestro es el formulario desacoplado, que a
cambio mete la hoja de estilos de un tercero en nuestra página.

**Sus textos no son para quien paga**, y la prueba está en el encabezado de su
propia tabla: «RESPUESTA QUE SE VISUALIZA EN **BACKOFFICE Y REPORTES**». Hablan
al comercio del comprador en tercera persona, y algunos mandan llamar a su
central.

Y pide **dos pantallas que ninguna otra pedía**: la de «**ya está pagado**» —su
código `300` y el HTTP 406 por idempotencia significan que el pedido ya se cobró,
no que falló— y la de **Yape**, que es un flujo aparte con celular y OTP y por
tanto se diseña entera.

### Lo de la v1.85.0, con detalle

**Mercado Pago Perú — y el rechazo deja de ser una pantalla para ser tres.**

La documentación la leyó un agente y trajo dos cosas que cambian el diseño de
las cuatro páginas, no solo de esta.

**Su propia documentación agrupa los rechazos en tres familias** por lo que la
persona tiene que hacer: corregir aquí mismo, hacer algo fuera, o **no
reintentar**. Y en la tercera pide expresamente impedir nuevos intentos con los
mismos datos. Así que la pantalla de rechazo se parte en tres, y **la tercera no
lleva botón de reintentar**: esa ausencia es la decisión de diseño. Un botón de
reintentar donde no se debe reintentar encadena rechazos y deja a la familia
creyendo que es culpa suya.

**Sus treinta mensajes vienen en inglés** incluso en la documentación en
español —comprobado pidiendo la página en `/es/` y volviendo idéntica— y llevan
variables dentro. Redactarlos es trabajo del sistema, no de la integración. Es
lo contrario de Culqi.

De paso es la primera con **tema oscuro documentado** y la primera que deja
poner **nuestro anillo de foco** dentro de su formulario por variable — §2.5.7
cumplido en territorio ajeno. Y seis huecos declarados en la página, incluida
una **contradicción suya**: clasifica Yape como `bank_transfer` en una página y
como `debit_card` en otra.

### Lo de la v1.84.0, con detalle

**Openpay Perú — y rompe el patrón de las otras dos.**

Mismo andamiaje `psl-*`, ni una clase nueva. Pero su integración se hace con
`Openpay.js`, que **tokeniza desde nuestro propio formulario**: el navegador de
la familia habla con Openpay, el colegio nunca ve la tarjeta, y aun así **los
campos son `Campo` del sistema**. Su documentación lo dice: la librería «minimiza
el alcance de la certificación PCI». Con Izipay y Culqi el formulario lo pinta su
SDK; **aquí no hay trama a rayas**. Consecuencia útil: el **modo oscuro**, que
quedó abierto con Izipay y sin comprobar con Culqi, aquí **está resuelto** —es
nuestro CSS—.

**De su documentación peruana:** las agencias por su nombre —BBVA, BCP,
Interbank, Kasnet, Caja Arequipa, Caja Huancayo— y Yape; y las cuotas sin
intereses **solo con tarjetas BBVA y DINERS**. Eso último no es dato de backend:
ofrecer «paga en cuotas» a quien trae una Visa de otro banco es prometer lo que
no se le va a dar.

**Y lo que no se pudo verificar va escrito, no rellenado.** La tabla de códigos
de rechazo de Openpay **no se pudo leer**: sus páginas devuelven contenido vacío
a una lectura automática porque se pintan con JavaScript. De la serie 3000 solo
se confirmaron `3004` y `3005`, y ni siquiera desde su documentación peruana. En
la de Izipay hay diez códigos literales y en la de Culqi doce con el texto del
pagador ya redactado; aquí hay que pedirla. **Un código de rechazo inventado
manda a una familia a llamar al banco equivocado.**

### Lo de la v1.83.0, con detalle

**Nace la página de Culqi, debajo de Izipay y con el mismo andamiaje.**

El encargo pedía «mantener los colores de Izipay», y eso no es estética: **dos
pasarelas distintas no pueden dar dos pantallas distintas a quien paga.** Por eso
la página **no trae ni una clase nueva** — reúsa entera la familia `psl-*` que la
de Izipay dejó viajando en la v1.82.0, y con ella hereda la garantía de
promesa=entrega sin pedir nada.

**Tres diferencias reales con Izipay, y las tres cambian decisiones:**

1. **Culqi deja estilar mucho más.** Variables CSS y `appearance.rules` sobre
   **30+ clases suyas y sus estados** — así que el anillo de foco del sistema
   puede entrar en su formulario, que con Izipay no se podía. Y el **modo
   oscuro parece resoluble**, aunque sin comprobar.
2. **El texto del rechazo lo redacta Culqi.** Su respuesta trae `user_message`
   escrito para quien paga. Con Izipay tuvimos que redactar esa columna
   nosotros.
3. **Agente y billetera no terminan en el acto**: devuelven un código para pagar
   después, así que hay un **quinto estado** que en Izipay no existe — y detrás,
   un **webhook**. Sin él, la familia paga y el colegio no se entera. Eso no es
   una pantalla, es negocio, y va declarado en la página.

### Lo de la v1.82.0, con detalle

**R105 · la pasarela de pagos viaja, y sin eso su promesa no valía.**

Corrección de una decisión mía de la v1.80.0. La página de Izipay nació como
«composición, solo catálogo», así que sus clases `psl-*` **no viajaban**. El
responsable pidió mirarlo y la consecuencia es exacta: **lo que no viaja,
`verificar-promesa` no lo compara.** Un producto que montara la pantalla del
cobro tenía que rehacer el andamiaje **a ojo** — que es literalmente el defecto
que este sistema existe para eliminar, y el que ya costó 3.983 líneas con la
tabla.

**Ahora viaja: 26 reglas.** Con ellas, el candado de la promesa compara siete
superficies nuevas del cobro a cinco anchos, y el barrido pasa de **1.065 a
1.144 elementos** y de **218.948 a 235.237 propiedades**. El de la cascada las
resuelve además a los **once anchos**, que es lo que responde a si la página
aguanta en estrecho.

**Lo que no viaja es deliberado**: todo lo que se llama `psl-demo-*` — el
navegador dibujado, el marco de 390 y, sobre todo, **el formulario falso de
tarjeta**. Ese marcado imita el que pinta el SDK de Izipay, y entregarlo sería
invitar a un producto a maquetar campos de tarjeta propios. Los campos de
tarjeta los pinta Izipay o no los pinta nadie.

**Visto fallar:** se cambió a mano un color de `.psl-hero` en la hoja entregada
y el candado salió en rojo señalando esa banda. Restaurada, verde.

### Lo de la v1.81.0, con detalle

**R104 · el catálogo enseñaba solo la excepción, no lo que se entrega.**

Lo reportó Control Administrativos V2.0, y **no viéndolo fallar: contándolo**.
En el catálogo había **seis** demostraciones de `.sel-caja` y las seis llevaban
`sel-con-lupa`; **cero** enseñaban el estado por omisión. Pero `conLupa` vale
`false` desde R100, así que lo que recibe quien no pide nada es el selector
**sin** lupa.

**Lo que costó:** compararon su pantalla contra el catálogo y concluyeron que al
componente le faltaba CSS —«no tiene la lupa»—. No era cierto: pintaban las
clases exactas contra la hoja exacta. **El catálogo no daba forma de
comprobarlo.** Una tarde ajena por una demo que faltaba.

Ahora se enseñan **las dos**: la de por omisión primero y la variante al lado,
etiquetada con su caso. Quedan **6 sin lupa y 2 con ella**, contra 6 y 0. **No
se cambió el defecto**: `conLupa = false` es correcto y sale de su propio R100.

**Y nace el catorceavo candado**, porque su petición era una regla general y no
un arreglo: *«si una prop cambia lo que se VE y tiene un valor por omisión, el
catálogo debería enseñar el valor por omisión»*. `verificar-omision.mjs` lo
comprueba **sin lista**: toda regla de la hoja que exija dos clases en el mismo
elemento declara un modificador sobre una base, y si el catálogo enseña esa base
siempre con su modificador y nunca sin él, el estado por omisión no se puede
mirar. **80 reglas compuestas, 0 falsos positivos**, y visto en rojo contra el
catálogo de ayer: encuentra exactamente `.sel-caja` sin `.sel-con-lupa`.

**Por qué hacía falta uno nuevo.** El de la promesa compara las propiedades de
lo que **se pinta**; el del elemento, sus etiquetas; el del empate, el orden de
sus reglas. Los tres miran lo pintado — y esto era una variante que existe en el
código y **no se pintaba en ninguna demo**. No hay nada que comparar, y por eso
los tres salían en verde con el defecto delante.

### Lo de la v1.80.0, con detalle

**El catálogo estrena grupo: «Pasarela de pagos».**

Encargo del responsable: las pantallas del cobro con **Izipay**, con nuestro
sistema de diseño. Antes de dibujar se leyó **su** documentación — no se inventó
ni un campo ni un código.

**Lo primero cambia el encargo: el formulario de tarjeta no lo pintamos
nosotros.** Lo pinta su SDK dentro de un `container` que le damos, y su
documentación lo dice: «el ancho y el alto del formulario se ajustan a las
medidas del elemento contenedor». Lo único que se le puede pasar son nuestros
colores, por `appearance.customTheme`. En la página, **la trama a rayas marca
dónde acaba nuestro terreno** — no es un adorno, es la frontera.

Lo que sí es nuestro, y es la mayor parte: el resumen del cobro, los cinco
estados, la constancia, y **el botón de pagar** — con
`showButtonProcessForm: false` el SDK deja de pintar el suyo y el pago se
dispara con `checkout.form.events.submit()`, así que puede ser nuestro `Boton`.

**Es una composición, no un elemento**, y por eso sus clases `psl-*` son
`SOLO_CATALOGO` y no viajan: la página se arma con `Tarjeta`, `Mensaje`,
`Progreso`, `Boton`, `Campo` y `Chip`, que sí viajan. Lo que se copia son los
componentes, no ese marcado.

**El color sale de `identidad-1..4` con `identidad-texto`**, que es un par
**verificado a 4,5:1 en los dos modos**. No se autorizó ningún color nuevo:
cobrar dinero es la pantalla donde menos se puede improvisar un color que nadie
midió.

Y el nombre es **Izipay**, con i. El encargo llegó como «IzyPay»; un nombre de
proveedor mal escrito en el catálogo se copia.

### Lo de la v1.79.0, con detalle

**R103 · el selector con búsqueda prometía un `null` que nunca emitía.**

Lo reportó Control Administrativos V2.0 **leyendo el código**, no viéndolo
fallar. Y el defecto principal no era una falta: era una **mentira**. `onCambio`
solo salía de `elegir()`, siempre con un valor real, así que el componente
**jamás emitía `null`** aunque su firma dijera `(valor: string | null) => void`.

Su planteamiento cerraba la cuestión mejor que cualquier discusión: **o sobra el
`| null`, o falta el camino**. Falta el camino — un tipo que documenta algo que
no existe bloquea el componente en todo campo opcional, porque quien lo lee
espera poder recibir `null` y no puede.

**Se resuelve con el mismo gesto que el `Selector`**, su opción vacía, y **no**
con la prop booleana que ellos propusieron (`permiteVaciar`). Dos razones: el
vocabulario ya existe y se llama `vacio`, y pedir el **texto** obliga a nombrar
el estado vacío. «Todos», «Sin asignar» y «Cualquiera» no significan lo mismo, y
un booleano los borra todos en un «— Ninguno —» genérico que no dice qué pasa al
elegirlo. Sin `vacio` no se puede vaciar, que era su condición: **nada de lo que
está en producción cambia.**

El **Retroceso** que pidieron está, pero como **acelerador y no como única
puerta**: un gesto que solo existe en el teclado deja fuera a quien usa el ratón.

**Y los dos huecos que seguían abiertos, cerrados de paso.** `etiquetaOculta`
—su «hueco 16»— la tenían `Campo` y `Selector` y faltaba solo aquí, así que se
estaban apañando con `Selector` para no anunciar el rótulo dos veces bajo una
cabecera de columna. Y `onCrear` recibe **lo tecleado**: la fila de «no hay
coincidencias» deja de ser un cartel y pasa a ser el camino, con ratón y con
Enter —sin lista no hay opción activa que Enter pudiera elegir, así que ahí esa
tecla estaba libre—. Tab no lo dispara: salir de un campo no es pedir un alta.

### Lo de la v1.78.0, con detalle

**R102, segunda parte · la carga de imagen deja de ser la excepción.**

La v1.77.0 dejó `caja` como defecto de `CargaImagen` para no reformar en
silencio los selectores de foto y de logo ya en producción. El responsable lo
revisó **en el catálogo** y la medición le dio la razón: de las tres cargas,
**solo dos arrancaban iguales sin tocar nada**. El anuncio decía una cosa y el
comportamiento por omisión otra. Si se pidió que las tres arrancaran igual, **la
que hay que pedir es la excepción, no la regla.**

Tres cosas más, y las tres suyas:

- **Todo en un solo renglón, también el rótulo.** Pasa dentro de la fila. Es la
  excepción declarada a la regla del formulario —la etiqueta va encima del
  campo— y se sostiene porque aquí no encabeza una caja de escribir: encabeza un
  mando, como ya hacen `.top-filtros` y `.pgn`. **Coste declarado:** con
  rótulos de distinta longitud, dos filas seguidas no alinean sus disparadores.
- **La foto de una persona, redonda en la miniatura**, y sin crecer: 22 px como
  las demás, solo cambia el radio. Un logo no — el círculo mentiría sobre su
  forma.
- **Tres duplicados que la revisión midió sobre el paquete instalado.**
  `.ci-et` **no fijaba el color**, así que en un mismo formulario el rótulo de
  la imagen podía salir de otro tono que el del PDF y el del ID. `.ci-nota` y
  `.ci-error` eran declaraciones **idénticas** a las `.cx-*` con otro nombre. Y
  el vacío se llamaba `.ci-vacia` — otro nombre, otro género y otro
  comportamiento. El propio R102 había retirado `.cpdf-ayuda` diciendo que dos
  nombres para el mismo estilo es la manera de que un día se separen, y no lo
  había aplicado aquí. De `.ci-*` queda solo lo suyo: la caja, la máscara y el
  editor de encuadre.

### Lo de la v1.77.0, con detalle

**R102 · las tres cargas arrancan y terminan igual, y dejan de romper el
formulario.**

Lo pidió el responsable con estas palabras: *«subir id, subir archivo, subir
imagen, todas inician y terminan de forma similar sin romper el flujo»*. Y lo
acotó después, que es lo que decidió el alcance: *«el funcionamiento interno
sigue igual, solo cambias la forma como se presenta al inicio y como es el
resultado final»*.

**El defecto era medible, no de gusto.** Medido en el catálogo con el navegador,
un `.campo` da **36,45 px** —13 px de texto con **18,85** de interlínea real,
más 8+8 de relleno y 1+1 de borde—. Contra eso:

| | Qué hacía | Alto |
|---|---|---|
| `CargaImagen` | una caja de vista previa entre dos campos | **96 px** |
| `CargaPdf` | apilaba la lista **encima** del botón, así que crecía hacia arriba al añadir | variable |
| `CargaId` | dos miniaturas al costado, pero de 76×48 | **48 px** |

Las tres rompían la rejilla, cada una a su manera **y con su propio marcado**.

**Ahora las tres emiten la misma fila** (`interno/FilaCarga`), así que no pueden
divergir: no es que se parezcan, es que es la misma. La fila se fija en 36 px y
no crece con nada — con uno, con cinco y con ninguno mide lo mismo. Lo que no
cabe **se cuenta** («+2») en vez de saltar de línea, porque envolver es romper
la estática otra vez, solo que hacia abajo.

**Dos decisiones que conviene recordar:**

- **La extensión del archivo no se recorta jamás.** El nombre sí. Cortar
  `boleta-…-2026.pdf` por el final se lleva justo el dato que dice qué es.
- **`CargaImagen` conserva `caja` como defecto** —**y duró una versión**: en la
  v1.78.0 se invirtió, porque así solo dos de las tres cargas arrancaban
  iguales. Lo que sigue es por qué se decidió entonces. Cambiarlo habría reformado en
  silencio cada selector de foto y de logo ya en producción, donde la caja no
  estorba sino que es el punto: enseña el hueco real donde la imagen va a vivir.
  La fila se pide con `presentacion="fila"`.

**Un agujero propio, encontrado de paso.** El candado de huérfanas leía solo los
`.tsx` sueltos de `componentes/src`, así que **todo lo extraído a `interno/`
salía de su alcance justo al extraerse** — que es cuando más falta hace, porque
una pieza interna la comparten varios componentes y su clase huérfana rompe en
todos. Las catorce clases `cx-*` no las miraba nadie, y `EditorEncuadre` llevaba
ahí desde la v1.45.0. Ampliado y **visto fallar a propósito** antes de confiar
en él.

**Y el candado que llevaba tiempo en rojo sin que nadie lo mirara.**
`probar-candado.mjs` leía las reglas en `config.at(-1)`, y desde que el bloque
del analizador de TypeScript pasó a ir el último encontraba **0 selectores donde
esperaba 8**. Es exactamente el defecto del que nació `verificar-forma` —buscar
por posición dentro de algo que se puede reordenar—, y le había tocado al propio
candado que comprueba el candado. La corrección no es correr el índice: es dejar
de usar índices y buscar el bloque **que tiene la regla**.

### Lo de la v1.76.0, con detalle

**R101 · dos comportamientos por omisión que faltaban, y un control que mentía.**

**La tabla arranca ordenada.** Empezaba sin orden, así que lo que se veía era el
orden de llegada de la consulta — que para quien mira la pantalla **no es
ningún orden**: dos cargas de los mismos datos se ven distintas y nadie sabe por
dónde buscar. Ahora, por la primera columna ordenable, ascendente. El comparador
ya estaba bien: `localeCompare` en español con `numeric`, así que la Ñ cae donde
debe y «zapata» en minúscula no se va al final.

**En `servidor` no se impone nada**, y es deliberado: allí la tabla no ordena, y
pintar la flecha sin que el backend haya ordenado sería mentir.

**La primera columna, fija por omisión.** `columnasFijas` existía desde la
v1.25.0, pero su defecto era «ninguna» — se podían ocultar **todas** y quedarse
con una tabla de filas en blanco.

**Y el control que mentía**, que nadie había reportado: la casilla de una
columna fija **se podía desmarcar** y la columna seguía ahí, porque la lógica la
reponía. El código lo justificaba —*«no se confía en deshabilitar el control: un
`disabled` se quita desde el inspector»*— y el argumento es bueno, pero
planteaba una falsa disyuntiva. Ahora se hacen **las dos cosas**: la casilla va
deshabilitada, que evita el gesto inútil, y la columna se repone igual, que
protege el dato.

### Lo de la v1.75.0, con detalle

**R100 · «se ve distinto a los demás».** Control Administrativos lo reportó
empezando por descartar la causa fácil: en su código **ya usaban
`SelectorBusqueda` del sistema**, no un `<select>` nativo. El problema era
nuestro.

Medido contra un `Selector`, propiedad a propiedad en el navegador: **mismo alto
(32,7 px) y mismo ancho**. De las nueve propiedades que diferían, **ocho son
intrínsecas del `<select>` nativo** —su flecha de fondo, el ajuste de línea— y
ni se pueden igualar ni tiene sentido intentarlo.

**La única que se veía era el sangrado: 32 px contra 8**, por la lupa. En una
columna de formulario, ese campo empezaba el texto bastante más a la derecha que
todos los demás.

**La lupa no se retira**: en el buscador de una tabla es correcta, porque allí
se busca de verdad. Se vuelve opcional con `conLupa` y por omisión no está. El
chevron sigue siendo obligatorio — es lo que dice «esto se despliega».

### Lo de la v1.74.0, con detalle

**R99 · dos huecos, y el primero lo argumentaron citando nuestro propio código.**

**Tres motivos, no uno.** Su matriz distinguía tres cosas que el panel colapsaba
en `cerrado`:

| | Qué dice | Qué se hace |
|---|---|---|
| `cerrado` | no se podrá conceder nunca | olvidarlo |
| `ajeno` | existe, pero **quien reparte no lo tiene** | hablar con quien sí |
| `pendiente` | todavía no existe en el sistema | esperar |

*«Un apagado invita a encenderlo»* — está escrito en el `Interruptor` desde que
se hizo, y con un solo estado las tres invitaban a lo mismo. Ahora cada una
lleva icono, etiqueta y motivo propios.

**Privilegios que comparten clave.** Un permiso puede cubrir varias acciones;
su ejemplo lo explica mejor que una definición: *«organigrama no tiene opción de
interruptor de crear»*. Colapsarlos en un control lo probaron y lo descartaron
ellos —la acción desaparecía y nadie sabía que existía—, así que se quedan los
dos interruptores, se mueven juntos y el aviso va **en la etiqueta**: «Editar ·
va con Crear».

Que sea la etiqueta y no un texto aparte tiene una consecuencia buena que no
buscábamos: **es también el nombre accesible**, así que un lector de pantalla
anuncia el enlace antes de que se pulse. Lo descubrimos porque una prueba falló
—`/Editar/` casaba dos interruptores, el de Editar y el de Crear—.

Los dos cambios son **aditivos**: quien ya integró la v1.73.0 no toca nada.

### Lo de la v1.73.0, con detalle

**R98 · tres peticiones sobre el panel, y la primera bloqueaba.**

**Niveles por campo.** Un cargo no solo concede «ver trabajadores»: define
**cuánto** ve del documento —completo, parcial, oculto—. No hubo que inventar
nada: el `Segmentado` (R69) nació para este caso exacto y con **este mismo
ejemplo**, `71602303` contra `*****303`. Se conectan bajo la clave
`privilegio:nivel` en el mismo mapa, y solo se reparten si el privilegio está
concedido.

**Apagar el base ya no borra.** La pregunta la hicieron ellos: *«guardamos en
cada pulsación, no hay botón de guardar»*. Hasta ayer, apagar «ver» ponía todo
el módulo a `false` — con niveles, eso destruye configuración en el acto y sin
vuelta atrás. Ahora se conserva, que es **la misma decisión que ya tomó la tabla
con sus filtros**: «plegar es dejar de ver el control, no dejar de filtrar». Lo
que no se conserva es el efecto: nace `privilegiosEfectivos()`.

**Móvil**, que era su motivo principal para dejar la tabla. Verificado a 390 px
de **viewport real** — en un marco con su propio viewport, porque medir un
contenedor estrecho dentro de una ventana ancha **no evalúa las consultas de
medios** y da un verde falso. Nada desborda; la cabecera mide 68 px de blanco
táctil.

**Y la captura destapó un defecto publicado ayer.** Cinco iconos de la página
del panel salían como **texto crudo** —`${ic('chevron', 18)}`— por una barra
invertida de más. **Ningún candado lo veía.** Ahora el generador falla si queda
plantilla sin resolver en el marcado, excluyendo el script del catálogo y los
ejemplos de código: sin esa exclusión daba **trece falsos positivos**, y un
candado con falsos positivos se acaba ignorando entero.

### Lo de la v1.72.0, con detalle

**R97 · nace `PanelPrivilegios`.** Lo pidió Control Administrativos para su
pantalla de privilegios por cargo, y se hizo **del sistema y no del producto**
por una razón: repartir permisos no es un problema de ese producto, es un
problema de cualquier aplicación con roles.

**No sabe de negocio.** Ni cargos, ni sedes, ni trabajadores: recibe módulos con
privilegios y devuelve qué está concedido. El selector del cargo lo pone el
producto por `children`. El día que sirva para los permisos de una clave de API,
no habrá que tocarlo.

**Se compone**, que es la regla 1 de la política: Interruptor, Chip y Botón son
los del sistema; lo único propio son **27 reglas de andamiaje**. Y el caso
difícil ya estaba resuelto — el `cerrado` del Interruptor (R66) nació
literalmente para esto: *«quien reparte privilegios no puede conceder los que él
mismo no tiene»*.

**Cinco decisiones**, que son las que hacen que dos productos repartan permisos
igual:

1. **Hay un privilegio que manda** (`base`, «ver» por omisión). «Editar sin ver»
   no significa nada, y sin la regla cada backend lo resolvería a su manera.
2. **Lo cerrado lleva el motivo en texto**, no un booleano.
3. **Lo que no aplica no se pasa**: una casilla vacía y un permiso denegado no
   son lo mismo.
4. **Lo concedido se ve sin abrir**: abrir es para cambiar, no para enterarse.
5. **Con `preset`, lo modificado se marca** y se puede volver.

**Y lo que no hace, también decidido:** no ordena por estado. Subir los
concedidos al principio movería la fila justo después de tocarla y borraría el
orden que traen los datos, que suele ser una escalera de riesgo.

**Y de paso se cerró una trampa que ya había mordido tres veces.** Los cortes de
`ramas` en el catálogo son **índices** sobre `items`, así que meter un elemento
al final lo deja fuera del menú. El propio comentario del código contaba dos
víctimas —Carga de ID y Segmentado—; el Panel de privilegios fue la tercera.
Ahora el último tramo es `Infinity` —llega siempre al final— y una comprobación
nueva exige que los tramos cubran todas las páginas sin huecos ni solapes.

**Esa comprobación encontró un defecto que llevaba tiempo ahí y que no había
reportado nadie:** el grupo «Manual de uso» tenía dos tramos hasta el índice 12
y **dieciséis** páginas, así que las cuatro últimas —`9bis`, `9ter`, «Lo que
este manual todavía no cubre» e «Historial»— **no aparecían en ningún menú**.
Existían y no se podía llegar a ellas.

### Lo de la v1.71.0, con detalle

**R96 · la versión decía cosas distintas según dónde se mirara.** Salió de una
revisión de coherencia, no de un fallo:

| Archivo | Decía | Era |
|---|---|---|
| `componentes/package.json` | 1.58.1 | 1.70.0 — **doce versiones atrás** |
| `CLAUDE.md`, «Estado actual» | 1.62.0 | 1.70.0 — **ocho** |

Lo de `CLAUDE.md` es lo peor de los dos: es **el archivo que viaja con el
repositorio y lo primero que lee quien clona**, y él mismo avisa de que ese
número «es lo único que se toca aquí».

Ahora el generador cruza **los cinco sitios** donde vive la versión y falla si
alguno discrepa. Es la misma familia que llenó el 21 de agosto —listas y
números que dependen de que alguien se acuerde— y por eso se cierra igual: con
una comprobación, no con un recordatorio.

### Lo de la v1.70.0, con detalle

**R95 · el atajo que borraba el color.** Control Administrativos lo midió hasta
el último detalle: `.chip-identidad-N` ponía `border-color` y `.chip`, más abajo,
`border-left: 3px solid currentcolor`. Misma especificidad, gana la última, y
**el atajo no solo pone grosor y estilo: reescribe el color**. Los cuatro tonos
salían en `rgb(44,42,37)` y se veían idénticos entre sí.

Es **la lección de R87 aplicada a nuestro propio código**, dos días después de
escribirla.

**Y los semánticos se salvaban por accidente.** El extractor emite
`.chip-exito` dos veces y la segunda copia cae después de `.chip`. Apoyarse en
eso no es tener una regla: es tener suerte. Así que se arreglan **todos** por
especificidad —`.chip.chip-X`, `.msj.msj-X`—, no solo los de identidad.

**El candado del empate no lo cazaba**, y esa es la parte que importa:

- comparaba propiedades **por nombre**, y `border-left` no se parece a
  `border-color`;
- solo miraba divergencias **entre las dos hojas**, y este defecto estaba igual
  en las dos.

Ahora expande los atajos a las longhands que de verdad se pisan, y añade una
regla dentro de **una misma hoja**: *un modificador no puede perder contra su
propia clase base*.

**Al estrenarla salieron 26 casos y 17 eran ruido.** Se indexaba la **primera**
aparición de cada regla cuando en CSS manda la última; y faltaba descartar los
que declaran el **mismo valor** —`.btn-ic` repite el `display` de `.btn`— y los
que llevan `!important`, como `.chip-sin-filete`. **Un candado que grita por lo
que funciona se acaba ignorando entero.**

**Los que quedaron eran reales y no los había reportado nadie:** `.chip-pend` y
`.chip-inact` perdían su `borde-fuerte` igual que identidad, y `.app-cascaron`
pedía `100vh` recibiendo los `520px` de `.app`.

### Lo de la v1.69.0, con detalle

**R94 · dos fallos nuestros de la v1.64.0**, los dos reportados por Control
Administrativos, que además tuvo que blindarse el bucle por su cuenta.

**El bucle.** `onAjuste` se llamaba en el cuerpo del componente, o sea
**durante el render**. Un consumidor que hiciera lo natural —guardar los avisos
en un estado para enseñarlos— entraba en **bucle infinito**. La prueba que lo
reprodujo **se colgó diez minutos** antes de matarla. Ahora sale de un
`useEffect`, y solo cuando los avisos cambian **de contenido**: comparar la
identidad del array no vale, porque es uno nuevo en cada render y el bucle
volvería un paso más allá. La prueba que lo vigila lleva **tope de renders**,
para fallar en vez de colgar.

**El desalineado.** El hueco se repartía con `flex-grow`, y `flex-grow` reparte
**lo que sobra**. Sobra distinto en cada celda —una con línea de detalle tiene
más contenido—, así que dos bloques de la misma hora en la misma fila empezaban
a alturas distintas. Lo vieron en pantalla: martes y jueves más abajo que lunes,
miércoles y viernes con el mismo horario.

**Y esto ya estaba medido a medias**, que es la parte que enseña. La v1.64.0
declaró *«donde tocaría 37,5 % sale 35,5 %»* y lo dio por aproximación
aceptable. Lo que no se comprobó es que **la desviación no es uniforme**. Una
desviación que cambia con el contenido no es aproximar: es desalinear.
**Declarar un número medido no basta si no se comprueba que sea el mismo en
todos los casos.**

| | antes | ahora |
|---|---|---|
| Inicio donde toca 37,5 % | 35,5 % | **37,6 %** |
| Desalineación entre columnas | variable | **0,00 px** |

**Pendiente que esto destapó:** al cambiar las clases, el ejemplo del catálogo
se quedó con las viejas y el sombreado dejó de verse. **No lo caza nadie** — el
candado de las clases huérfanas mira los componentes de React, no el marcado del
catálogo. Queda anotado.

### Lo de la v1.68.0, con detalle

**R93 · la v1.67.0 habría apagado el candado en silencio.** Lo cazó Control
Administrativos **al actualizar**, y es el más grave de los tres que reportaron
hoy — porque no lo reportó un fallo, lo reportó una sospecha.

Hasta la v1.66.0 el candado de ESLint era **un** bloque, y su proyecto copiaba a
mano los cuatro campos de `candado[0]`. La v1.67.0 —nuestra, de ayer— metió el
analizador delante, y con eso `candado[0].rules` pasó a ser `undefined`. **La
actualización les habría dejado el candado sin ninguna regla activa y en
verde**: ESLint no se queja de un bloque con `rules: undefined`, sencillamente
no comprueba nada.

> *«Lo vi porque fui a mirar la forma de la exportación antes de confiar en
> ella, no porque nada fallara.»*

Nadie se habría enterado.

**Dos arreglos.** El bloque de reglas vuelve a ser `candado[0]` y el analizador
va detrás —para ESLint el orden da igual, y delante le quitaba el sitio—. Lo
correcto sigue siendo esparcir el array, y así lo dice la documentación, pero
**un paquete no puede repartir la culpa**: si se puede desarmar, alguien lo
desarmará, y romperle el suelo en una versión menor es fallo nuestro.

**Y nace el candado de la forma**, con la frase de ellos por bandera:
*«`verificar-entrega` comprueba que todo salga, no que la forma se mantenga»*.
Fija en un lock lo que un consumidor puede desarmar —cuántos bloques, cuál lleva
las reglas, qué rutas se publican— y cambiarlo exige `--sellar`, así que el
cambio aparece en el diff y toca decidir si va en `rompe`.

**El bloque del analizador no cuenta como forma**, y esa decisión importa: es
condicional a que el consumidor tenga `typescript-eslint`, así que contarlo
haría que el lock dijera una cosa dentro del contenedor y otra fuera. **Un
candado que depende de dónde se ejecute no vale.** Se comprueba aparte que,
cuando exista, vaya detrás.

Visto en rojo reintroduciendo el defecto exacto de la v1.67.0. Y su primera
salida **mentía** —decía «presente, y detrás» con el analizador delante—, porque
el rótulo se calculaba antes de la comprobación. Corregido: un candado no puede
mentir en su propio informe.

**Una corrección que ellos mismos hicieron y conviene registrar:** su proyecto
**no** tenía el candado apagado — su `eslint.config.mjs` ya componía el
analizador. Lo que fallaba era la **invocación suelta**, que es justo la que
manda nuestro `ACTUALIZAR.md`. El defecto era de lo que documentamos, no de lo
que ellos habían montado.

### Lo de la v1.67.0, con detalle

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

## Los diecisiete pasos, y lo que ninguno alcanza

**Los diecisiete son exactamente los de `sistema/paquete/publicar.mjs`, y en su
orden: tres generadores y catorce candados.** Esta tabla decía diecisiete y
**contaba otra cosa**: metía ESLint y `tsc --noEmit` —que el publicador **no
corre**— y se dejaba fuera `generar.mjs` y `generar-cascaron.mjs`. Lo cazó una
auditoría el 2026-09-13, y el error importa porque los dos colados **son justo
los que no se pasan**: hoy ESLint sale en **rojo** con dos errores en
`Estados.tsx`, que viajan en el paquete.

Los diecisiete se pasan todos antes de subir a `main`. Ninguna versión sube con
uno en rojo. Los dos de abajo de la tabla **no son de los diecisiete** y se
marcan como lo que son.

| Paso | Qué impide | Se ha visto en rojo |
|---|---|---|
| `generar.mjs` *(generador)* | Que el contrato de color se escriba a mano | — |
| `generar-cascaron.mjs` *(generador)* | Que los candados midan el catálogo de la versión anterior | — |
| `verificar-contraste` | Que el contrato mienta sobre un par | ✅ |
| `verificar-color` | Un hexadecimal, `rgb()` o `hsl()` suelto | ✅ |
| `auditar-cascaron` | Estilo en línea, marcado fuera de norma y duraciones a mano | ✅ |
| `probar-candado` | Que las reglas de ESLint no hagan nada | ✅ |
| `verificar-contrato` | Una regla obligatoria sin prueba que la nombre | ✅ |
| `verificar-entrega` | Que el catálogo enseñe lo que no viaja, y al revés | ✅ |
| `extraer.mjs` *(generador)* + huérfanas | Clase emitida sin regla | ✅ |
| `verificar-cascada` | Lo que NO se escribió, a once anchos | ✅ |
| `verificar-promesa` | Que lo entregado no se vea como lo enseñado | ✅ |
| `verificar-elemento` | Que el catálogo enseñe un elemento y el componente emita otro | ✅ reproduciendo R56 |
| `verificar-empate` | Que el ORDEN decida distinto en cada hoja | ✅ |
| `verificar-forma` | Que lo publicado cambie de FORMA sin decirlo | ✅ |
| `verificar-omision` | Que el catálogo no enseñe lo que se entrega por omisión | ✅ |
| `verificar-iconos` | Que el catálogo y el producto dibujen distinto icono | ✅ |
| `verificar-promesa-muerta` | Una regla que viaja y que nadie puede activar | ✅ reproduciendo R115 |
| ~~ESLint~~ **FUERA de los diecisiete** | El atributo `style`, el hex crudo, `outline:none` | ✅ — pero **no se corre**, y hoy está en rojo |
| ~~`tsc --noEmit`~~ **FUERA de los diecisiete** | Tipos | ✅ · limpio, se corre a mano |

**Los nueve que leen marcado lo leen ESTÁTICO** —`auditar-cascaron`,
`verificar-cascada`, `verificar-entrega`, `verificar-promesa`,
`verificar-elemento`, `verificar-empate`, `verificar-omision`,
`verificar-iconos`, `verificar-promesa-muerta`—. Los otros cinco no miran
marcado: miran pares de color, la tabla del contrato, la forma de lo exportado y
casos sintéticos. Decía «los dieciséis» y era falso por los dos lados. Lo que
solo existe al desplegar no lo alcanza ninguno, y por eso R115 pasó. Esa mitad la cubren las pruebas que
ejecutan el catálogo (`selector-desplegado-catalogo.test.tsx`), **hoy solo para
el selector con búsqueda**: los demás componentes con estado desplegado siguen
sin comparar.

---

## Números verificados

No los repitas de memoria: **regenéralos**.

```
Versión                      1.117.0
Tokens semánticos                56   + 5 de marca
Pares de contraste              186   (146 bloqueantes · 40 informativos,
                                      0 fallos)
Pruebas                         892   en 50 archivos
Reglas que viajan               1010   de 1525 · 731 clases, 0 huérfanas
                                      — el barrido mira tambien interno/
Reglas con `sel-` en las hojas   26   contra 26 (mas 6 de `sel-demo-*` en el
                                      catalogo, que por diseño NO viajan).
                                      Contadas por bloque de regla cuyo
                                      selector menciona `sel-`, en las dos
Comparaciones del desplegado      7   catalogo ejecutado contra componente
Componentes publicados           35
Módulos que viajan               43   + 17 archivos de sistema = 60 en el ZIP
Exportaciones de componente     127   todas salen por el índice
Unidades compuestas             143   dos clases sobre el MISMO elemento
Páginas del catálogo             70
Fila de un campo, medida      36,45   px · la fila de carga se fija en 36
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
| **Lo que el catálogo no pinta, no se compara** | Los **50** estados fijados a mano existen por eso (eran 29 el día que nació el candado; la cifra estaba en presente y desfasada). Un estado nuevo que nadie fije ni el catálogo enseñe, no lo mira nadie |
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
- Se trabaja contra `main`, **únicamente con los diecisiete pasos y las
  pruebas en verde**. Es de donde instala el área de sistemas: un `main` roto es
  un proyecto ajeno roto.
- Hay **dos** máquinas. En la de Windows están las notas de
  `LEVANTAR-EN-WINDOWS.md`; en la de macOS el demonio de Docker es **Colima**
  (`colima start`) y el comando lleva guion: **`docker-compose`**, no
  `docker compose`.
- Nunca `--force`. Nunca `checkout` ni `stash` sobre el árbol compartido.
- `.gitattributes` fija LF; los binarios de diseño no suben.
- Notas de esta máquina: `LEVANTAR-EN-WINDOWS.md`.
