# Contrato de comportamiento

Qué **hace** cada elemento, no cómo se ve. El aspecto ya lo entrega
`componentes.css`; esto es la otra mitad, y es la que hoy se descubre pulsando.

Existe porque Control Administrativos V2.0 lo midió: **cinco reglas de la tabla,
cinco pruebas, un día** — y el siguiente proyecto las habría vuelto a descubrir
una por una. Cada regla de aquí está leída del código del catálogo, no de la
memoria de nadie.

> **Cómo leerlo.**
>
> · **Obligatorio** — del sistema, no se negocia, **y el componente lo hace**.
>   Si se cambia, dos productos dejan de comportarse igual.
> · **PENDIENTE** — está decidido y escrito, pero **el componente todavía no lo
>   hace**. Si su proyecto lo necesita hoy, lo resuelve usted y nos lo dice.
> · **Del proyecto** — lo decide cada aplicación.
>
> La segunda categoría existe desde la v1.13.2 y es una corrección, no una
> comodidad. Control Administrativos V2.0 encontró **cinco reglas que este
> documento daba por obligatorias y el código no cumplía**, y tenían razón en lo
> importante: si el documento al que les remitimos promete lo que no hay, no se
> puede confiar en él. Ahora lo comprueba un candado —`verificar-contrato.mjs`—
> que falla la publicación si una regla obligatoria no tiene prueba que la
> respalde.

---

## Concordancia de registros — léase antes de citar una «R»

**Hay dos registros de requerimientos y el solape llegó a SIETE versiones.** El
del equipo que pide —`requerimiento-R###-*.md`— y unos números que este sistema
acuñó por su cuenta. Acuñarlos fue un error: **el registro es de quien escribe
el requerimiento**, no de quien lo implementa.

| Publicado como | En el registro del equipo | Versión |
|---|---|---|
| **R118** · búsqueda contra el servidor | **R123** · selector búsqueda asíncrono | v1.97.0 |
| **R119** · el tercer rojo de la identidad | *(sin número: hallazgo interno, no pedido)* | v1.98.0 |
| **R118** · las cinco reglas del calendario | *(sin número: se acuñó otra vez, ya con la regla puesta)* | v1.101.0 |
| **R129** · cambiar de mes no desborda | *(sin número: acuñado por tercera vez)* | v1.103.0 |
| **R50** · la carga de imagen y su avatar | *(sin número: acuñado. El R50 **real** del equipo es el aviso que no se veía, v1.55.0)* | v1.44.0 |
| **R56** · la tarjeta pulsable es un `<button>` | *(sin número: «R56 no lo pidió nadie, apareció al ir a construir R57»)* | v1.49.0 |
| **R61** · la cuadrícula de tarjetas | *(sin número: lo consumió este sistema por un hallazgo propio)* | v1.51.0 |

Los siete números **se quedan como están** en lo ya publicado. Una etiqueta no se
mueve y un ZIP entregado no se reescribe: quien instale `v1.97.0` leerá R118 en
este mismo documento, y tiene que seguir cuadrando con lo que descargó.

**Desde la v1.99.0 manda el registro del equipo** —la política se había fijado ya el 2026-08-16, y se tardó—.** Este sistema no acuña
números: si un trabajo no tiene requerimiento, se describe por lo que hace y por
la versión en que entró, sin inventarle una «R».

**Y se volvió a saltar dos veces más.** En la v1.101.0, dos versiones después
de escribir esa frase: las cinco reglas de «Rango de fechas» citan
`(R118, v1.101.0)` y no hay tal requerimiento. Y en la v1.103.0 con
`(R129, v1.103.0)` — «cambiar de mes no desborda»—, que el **2026-09-13** chocó
de frente con el **R129 real del equipo**, el del calendario que se encoge.

Esa última colisión **hizo saltar en verde al candado de contrato**: las reglas
nuevas citaban `R129` y el candado las dio por respaldadas casando con las
pruebas del R129 viejo. Por eso las de la v1.108.0 citan **«R129 del equipo»** y
se atan por número de fila. Un registro compartido con quien no lo gobierna no
solo confunde a las personas: **engaña a los candados**.

Se deja como está por lo mismo que las otras, la etiqueta y el ZIP ya
entregados, y se apunta aquí.

**Y la tabla estaba incompleta hasta el 2026-09-13.** Una auditoría barrió las
146 citas de este documento contra los 43 de `peticiones/` y encontró tres más,
una de ellas —`R50`— **colisión consumada desde la v1.55.0**, diagnosticada en
`peticiones/2026-08-16-privilegios-r68-r69.md` y **64 versiones sin aviso al
lector**. La política `S-nn` para hallazgos internos se fijó ese mismo día, no
«desde la v1.99.0» como decía este párrafo.

**Desde la v1.108.0 esto no depende de que alguien se acuerde.** El candado de
contrato falla si un número se cita con **dos versiones distintas** y no está en
esta tabla.

> Cuidado con `R118` y `R119` a secas: en el registro del equipo son *diálogo
> con acción en gerundio* y *editor de texto con huecos*, dos cosas que nada
> tienen que ver con lo que este documento publica bajo esos números.

---

## Tabla simple · ancho mínimo

| | Regla |
|---|---|
| **1** | **Obligatorio.** (R85 · P3, v1.60.0) Dentro de `.tb-envoltura`, una `.tabla-simple` lleva un **suelo de 520 px**. Es un buen valor por omisión: por debajo, las columnas se apelmazan y se lee peor estrujada que desplazándola. |
| **2** | **Obligatorio.** (R85 · P3, v1.60.0) Se **renuncia al suelo diciéndolo**: la clase `tabla-libre`. Para **leer**, desplazar está bien; para **configurar** no —se pierde de vista la fila mientras se pulsa la columna—, y ésa es decisión de quien monta la pantalla, no del sistema. |
| **3** | **Obligatorio.** (R85 · P3, v1.60.0) Es **contrato, no un descubrimiento**. Lo pidieron así con razón: su apaño era sacar la tabla fuera de `.tb-envoltura` para no heredar el suelo, y eso depende de un detalle interno de la cascada — «el día que cambiéis ese selector, se nos rompe y no nos vamos a enterar». El candado de la cascada lo comprueba **a los once anchos y en las dos caras**: que `tabla-libre` reciba 0, **y** que sin declarar nada siga recibiendo 520. |
| **4** | Del proyecto: que las celdas puedan encoger. Sin suelo, el desbordamiento es suyo. |

---

## Tabla de datos

<!-- pruebas: TablaDatos.test.tsx, tabla-ancla.test.ts, tabla-orden-inicial.test.tsx, tabla-nowrap.test.ts, tabla-libre.test.ts, filtro-columna.test.ts, hoja.test.ts -->

Es el 80 % de la superficie del sistema. Si solo se lee una sección, esta.

### Filtros

| | Regla |
|---|---|
| **1** | **Obligatorio.** «Filtros» despliega **una fila de controles dentro del `<thead>`, uno por columna**. No es un panel aparte: el filtro vive sobre la columna que filtra, o hay que recordar cuál era cuál. |
| **2** | **Obligatorio.** Al plegar la fila, **los valores se conservan**. Plegar es dejar de ver el control, no dejar de filtrar. Limpiar al plegar hace que la tabla cambie de contenido por un gesto que parecía visual. |
| **3** | **Obligatorio.** Mientras haya algún filtro puesto, **el botón queda marcado** (`#tb-filtros-btn.activo`, borde y texto en `accion`). Con la fila plegada **nada más lo indicaría**, y una tabla filtrada que parece completa es un error de lectura, no de interfaz. |
| **4** | **Obligatorio.** Además del botón marcado, los filtros puestos se listan **encima de la tabla** (`.tb-activos`). Dos señales para lo mismo, y a propósito: el botón dice «hay filtros», la tira dice **cuáles**. Y **cada uno se quita desde ahí**: ficha `.tb-act` con el valor en negrita, su `.tb-act-x` —con el nombre de la columna en el rótulo, porque cuatro «Quitar» iguales no dicen cuál se llevan— y un «Quitar todos» que suelta también la búsqueda. La búsqueda global se lista igual que un filtro. Un listado de lo que está cribando que no deja describar obliga a volver a abrir la fila de filtros y borrar a mano. (v1.41.2: se entregaba solo la banda, sin contenido ni ×.) |
| **5** | **Obligatorio.** Al filtrar **se vuelve a la página 1**. Quedarse en la página 7 de un resultado que ahora tiene 2 muestra una tabla vacía que parece un fallo. |
| **6** | Del proyecto: qué columnas son filtrables y con qué control —texto, selector, rango—. |

### Paginación

| | Regla |
|---|---|
| **7** | **Obligatorio.** Con **una sola página no se pinta la paginación**, pero **el rango sí se queda** («1–8 de 8»). El número de resultados es información aunque no haya que navegar. |
| **8** | **PENDIENTE — el componente NO lo hace todavía.** El tamaño de página elegido **se recuerda**. Es una preferencia de la persona, no de la pantalla. |
| **9** | **Obligatorio.** La paginación es **un solo componente compartido** con el resto del sistema. Hubo dos y divergieron; no se vuelve a hacer. |
| **10** | Del proyecto: los tamaños ofrecidos. El catálogo usa 10 · 25 · 50 · todas. |

### Orden

| | Regla |
|---|---|
| **11** | **Obligatorio.** El disparador es un **`<button>` dentro del `<th>`**, y el `<th>` lleva `aria-sort` con `ascending` / `descending` / `none`. Un `<th>` con `onclick` no se anuncia ni se alcanza con teclado. |
| **12** | **Obligatorio.** La dirección se indica con **flecha además de color** (SC 1.4.1). |
| **13** | **Obligatorio.** Ordenar **no cambia de página** ni pierde los filtros. |

### Columnas y descarga

| | Regla |
|---|---|
| **14** | **PENDIENTE — el componente NO lo hace todavía.** Las columnas ocultas **se recuerdan**, como el tamaño de página. |
| **15** | **PENDIENTE — el componente NO lo hace todavía.** La descarga a CSV exporta **lo que se ve**: filtros aplicados y columnas visibles. Exportar todo cuando la pantalla muestra un subconjunto es el fallo clásico de este control. |

### Filas desplegables

| | Regla |
|---|---|
| **16** | **PENDIENTE — el componente NO lo hace todavía.** El chevron es un `<button>` con `aria-expanded` y `aria-controls`, y su nombre accesible **cambia** entre «Mostrar» y «Ocultar». |
| **17** | **PENDIENTE — el componente NO lo hace todavía.** El detalle plegado **se oculta de verdad** (`visibility: hidden`), no solo a altura cero. Con altura cero los enlaces siguen siendo paradas de tabulación invisibles y el lector de pantalla lee el contenido de todas las filas cerradas. |
| **17bis** | **Obligatorio.** (R101, v1.76.0) **La tabla arranca ORDENADA.** Sin declarar nada, por la primera columna ordenable y ascendente. El orden de llegada de la consulta no es un orden para quien mira la pantalla: hace que dos cargas de los mismos datos se vean distintas y que nadie sepa por dónde buscar. Se cambia con `ordenInicial`, y `null` arranca sin orden. **En `servidor` no se impone nada**: allí la tabla no puede ordenar, así que pintar la flecha sin que el backend haya ordenado sería mentir. |
| **17ter** | **Obligatorio.** (R101, v1.76.0) **Si no se declara `columnasSiempreVisibles`, la primera columna no se puede ocultar.** Antes el valor por omisión era «ninguna», y se podían ocultar todas hasta dejar una tabla de filas en blanco. Para renunciar hay que decirlo: `columnasSiempreVisibles={[]}`. (Se llamaba `columnasFijas` hasta la v1.124.0 — ver la regla 36.) |
| **17quater** | **Obligatorio.** (R101, v1.76.0) **La casilla de una columna fija va deshabilitada Y la columna se repone.** Las dos cosas, y no es redundancia: el `disabled` evita el gesto inútil —antes la casilla se desmarcaba y la columna seguía ahí, que es un control que miente— y reponerla protege el dato, porque un `disabled` se quita desde el inspector. |
| **18** | **Obligatorio.** (R31, v1.25.0) La elección de columnas **es una preferencia de la persona** y el producto debe poder honrarla: se siembra al montar con `ocultas` y se guarda con `onOcultas` — en el perfil, como manda la transversal 5. Pasada `ocultas`, esa es la verdad: la tabla no la duplica. |
| **19** | Del proyecto. (R32, v1.25.0) La ranura `acciones` pone la exportación o la acción por lotes **dentro de la barra**, junto a «Filtros» y «Columnas». El sitio es del sistema; el comportamiento, de quien la llena. |
| **20** | **Obligatorio.** (R33, v1.25.0) Columna con `opcionesFiltro` filtra con **selector** y casa por **igualdad**, no por texto contenido: «activo» está *contenido* en «inactivo», y quien teclea el sinónimo concluye que no hay resultados. |
| **21** | **Obligatorio.** (v1.25.0) La tabla vacía **dice por qué y da la salida**: con filtros puestos, «Prueba con menos filtros, o quítalos todos» en un clic; sin filtros, «No hay datos registrados todavía». El encabezado se queda — dice qué columnas habría. Cero filas sin explicación parece un fallo. |
| **22** | **Obligatorio.** (R34, v1.27.0) La **búsqueda global** mira todas las columnas —es para cuando no se sabe en cuál está lo que se busca—, se **suma** a los filtros de columna y vuelve a la página 1. En `servidor` solo se emite por `alCambiar`. |
| **23** | **Obligatorio.** (R34, v1.27.0) «Mostrar [N]» vive en la **barra**, con el recuento al lado y **con sustantivo** («38 trabajadores»). Con cualquier criba el recuento dice «X de Y» aunque X sea igual que Y: un filtro que no descarta nada parece no haber hecho nada. |
| **24** | **Obligatorio.** (R34, v1.27.0) La columna **N.º** es localizadora y **continua entre páginas**: «era la 34» sigue siendo la 34 en la página 4. No ordena ni filtra — no es un dato, es un dedo puesto en la fila. `numerada={false}` la quita. |
| **25** | **Obligatorio.** (R34, v1.27.0) El **pie** lleva el rango a la izquierda y la paginación a la derecha, como el catálogo. El tamaño de página no se repite ahí: ya vive arriba. |
| **26** | **Obligatorio.** (R42b, v1.38.0) En la **tabla simple**, la cabecera **cae sobre sus columnas**: cabecera y cuerpo comparten un solo layout de tabla — nunca dos tablas independientes repartiendo columnas por su cuenta. Suelta, la tabla es un bloque que se desplaza solo; **dentro de `.tb-envoltura`** es tabla plena a todo lo ancho, y la envoltura resuelve el desbordamiento. |
| **27** | **Obligatorio.** (R49, v1.43.0) Con la tabla ancha **solo se desplaza la tabla**. `.tb-envoltura` es el deslizador y **contiene la tabla y nada más**; la barra —buscar, «Mostrar», el recuento, Filtros, Columnas y las acciones del producto—, la tira de filtros activos y el pie —el rango y la paginación— son **hermanos suyos** dentro de `.tb-bloque`, y se quedan quietos. Cabecera y datos se mueven **juntos**, porque si no dejan de estar alineados. Lo que se arrastra a la derecha es la columna que se quiere leer, no los mandos que hacen falta para seguir trabajando. |
| **28** | **Obligatorio.** (R86, v1.61.0) **Un dato, una línea.** La celda de datos **no parte el texto**: `white-space: nowrap` en `.tb td` y en `.tb-sub td`. Lo pidió Control Administrativos con la medida hecha y aquí se midió otra vez sobre la hoja que viaja: en una columna estrecha, tres filas de la misma tabla daban **54,7 · 34,0 · 72,3 px con 34 declarados**, y **36,7 con 28** en compacta — la altura de fila no era una altura, era un mínimo. Como `.tb-envoltura` ya desplaza (regla 27), partir no gana espacio: solo rompe la altura. **Tres excepciones, y son prosa, no datos**: el estado vacío (`.tb td.tb-vacio`) y el panel de detalle (`.tb-detalle > td`) siguen partiendo, porque ya renunciaban a la altura de fila y no hay medida que proteger. La `.tabla-simple` **queda fuera a propósito**: no declara altura de fila, así que no hay nada que romper, y sus celdas son prosa por diseño (`vertical-align: top`, `line-height: 1.45`); su única celda que no parte sigue siendo `.num`. El candado de la cascada lo comprueba **a los once anchos y en los cinco casos**. |
| **29** | Del proyecto: una columna cuyo valor solo se entiende partido en varias líneas. Con la celda a una línea, ensancha la columna y la tabla se desplaza. Si aparece una así, dígannoslo y se declara la salida — no la improvisen con CSS propio, que es lo que este contrato existe para evitar. |
| **30** | **Obligatorio.** (R142, v1.124.0) **Con `anclarColumnas={1}`, la primera columna VISIBLE queda anclada al desplazar en horizontal** y el resto de la tabla pasa por debajo. Se resuelve contra `.tb-envoltura`, que es el deslizador desde la regla 27: media solución llevaba dos años puesta. Por omisión **0** — anclar repinta todas las tablas de todos los productos y eso se pide, no se impone. Se ancla también la celda de **filtro** de esa columna, o la fila de filtros se desplaza y el filtro deja de estar sobre su columna (regla 1); y **nunca** la celda con `colSpan` del estado vacío, que abarca la tabla entera. Ocultando la primera, **el anclaje se muda** a la que pasa a serlo: quedarse en una columna que ya no se pinta no ancla nada. |
| **31** | **Obligatorio.** (R142, v1.124.0) **Con `numerada`, la columna N.º se ancla con ella.** Una N.º que se va por la izquierda mientras el nombre se queda deja la fila **peor** identificada que sin anclar nada. Su desplazamiento sale de `--tb-indice`, **la misma declaración** que da ancho a `.tb-th-indice` y `.tb-indice`: tres sitios y un número, porque tres números que tienen que coincidir dejan de coincidir. **Y la N.º anclada no encoge ni crece**, con `min-width` y `max-width` a ese mismo valor: en una tabla más ancha que su contenedor, `width` en una celda de tabla **es una sugerencia**. Medido en Chrome sobre el catálogo: sin el suelo la N.º salía a **45,24 px** y quedaba una rendija de 7 px por la que se ve pasar el contenido; sin el techo, con cuatro cifras crecía a **55,21** y el nombre se montaba **encima** 3,21 px — y con cinco, once. Perder el nombre **y** el número es peor que la rendija. El relleno baja a 4 px solo anclada, y con eso caben **hasta 99.999 filas** sin recortar; por encima el número se corta en vez de montarse encima, que es la salida menos mala y queda dicha. **Ningún candado podía ver ninguno de los dos**: todos miran declaraciones, no cajas. Salió mirándolo. |
| **32** | **Obligatorio.** (R142, v1.124.0) **La celda anclada lleva fondo propio, y con él el rayado y el hover.** Una celda pegajosa transparente deja ver pasar el texto por debajo; y como `.tb-alt` y `:hover` pintan el `<tr>`, sin reglas propias la columna anclada saldría lisa sobre una tabla rayada. Las dos **empatan en especificidad (0,3,2)** y decide el orden: el hover va **después**. Y el filete del hover —`inset 3px 0 0 var(--accion)`— **se muda a la primera celda anclada**: en su sitio de siempre, el borde izquierdo de la fila, queda tapado en cuanto alguien desplaza. |
| **33** | **Obligatorio.** (R142, v1.124.0) **El separador es `::after`, no un borde**, y va en **una sola celda por fila**: la última anclada. Con `border-collapse: collapse` los bordes los pinta la tabla, no la celda, así que un borde puesto aquí no viajaría con ella. Y **`border-collapse` no se toca**: pasar a `separate` duplica filetes donde `td{border-top}` se encuentra con `th{border-bottom}` y cambia la altura de fila que la regla 28 protege con números medidos, a cambio de nada — hoy `.tb` **no declara ni un borde vertical en celdas**, así que no hay borde que perder. |
| **34** | **Obligatorio.** (R142, v1.124.0) **En el teléfono la columna anclada tiene techo:** a 640 px y por debajo, `max-width: 44vw` con recorte y puntos suspensivos. Sin él, un nombre largo con `nowrap` (regla 28) ocupa más que la pantalla y **no queda nada que desplazar**: el anclaje habría empeorado justo el caso que vino a arreglar. Recortar no es partir — la altura de fila de la regla 28 sigue intacta. En escritorio **no hay techo**, y al imprimir vuelve a `static`. |
| **35** | Del proyecto. (R142, v1.124.0) **Un `transform`, `filter`, `perspective`, `backdrop-filter` o `contain` en cualquier antepasado entre la celda y `.tb-envoltura` desactiva el anclaje**, sin error y sin consola: ese antepasado pasa a ser el bloque contenedor. Si su tabla vive dentro de una tarjeta animada, el anclaje no funcionará y **no es un fallo del sistema**. Dígannoslo y se busca salida; no lo tapen con CSS propio. |
| **36** | **Obligatorio.** (R142, v1.124.0) **`columnasFijas` pasa a llamarse `columnasSiempreVisibles`.** El nombre viejo era falso y lo marcaron ellos: «fija» invita a suponer «fija al desplazar», que es lo que hace `anclarColumnas` — y con las dos props juntas la confusión no se queda igual, **se duplica**. El alias sigue funcionando y **avisa en desarrollo**; quien no lo pase no toca nada. Pasar **las dos con valores distintos falla a propósito**: dos verdades no son una migración a medias, son un defecto que se descubre cuando alguien oculta una columna en producción. |

---

## Aviso temporal

<!-- pruebas: composicion.test.tsx, ZonaAvisos.test.tsx -->

| | Regla |
|---|---|
| **0** | **Obligatorio.** Los avisos viven en `ZonaAvisos`, que se monta **con la aplicación** — no cuando llega el primer aviso. Sus dos regiones (`alert` para error, `status` para el resto) existen desde la carga: una región viva creada en el momento del fallo no la anuncian la mayoría de lectores de pantalla. Dentro de la zona el aviso no lleva rol propio; suelto, lo conserva. |
| **0b** | Del proyecto: cuántos avisos a la vez. El criterio de referencia del cascarón: **tres, y el cuarto expulsa al más antiguo que no sea un error** — un error expulsado en silencio es un error que nadie leyó. |
| **1** | **Obligatorio.** Éxito, información y advertencia son **`aria-live="polite"`**. Confirman algo ya hecho; interrumpir la lectura para decir «se guardó» roba la frase que se estaba leyendo. |
| **2** | **Obligatorio.** El error es **`role="alert"`** y **no se va solo**: duración cero. Algo no se hizo, y anunciarlo tarde deja seguir adelante sobre un estado falso. |
| **3** | **Obligatorio.** El aviso **se pausa** al pasar el cursor o al recibir el foco. |
| **4** | **Obligatorio.** (v1.118.0) Los que sí se van **permanecen `--permanencia-aviso`, hoy 2 s**, sin contar la entrada ni la salida. Lo pidió el responsable el 2026-09-15: *«máximo que permanezcan en 2seg, creo está 5seg, es mucho, son muy intrusivas»*. Un aviso temporal confirma que algo pasó; no se lee dos veces, y cinco segundos flotando sobre el contenido son de estorbo, no de lectura. Lo que da tiempo cuando hace falta no es el reloj sino la **pausa** de la regla 3. **Y el número lo lee el componente de la hoja**: aquí decía «del proyecto, y el catálogo usa 4 a 10 s», y eran **tres fuentes sin ninguna que mandara** — el token `--permanencia-aviso` existía y el catálogo lo publicaba como «cuánto queda en pantalla un aviso», pero **no lo leía nadie**: cero usos en la hoja, con 5000 escritos dentro del componente y 4/5/7/10 s en la demostración. Ahora el componente lo lee al montar, el catálogo lee el mismo, y `duracion` sigue mandando sobre los dos cuando una pantalla necesite otra cosa. |
| **5** | **Obligatorio.** (v1.118.0) **Se va desvaneciéndose, no de golpe.** El temporizador no desmonta: quita `.av-dentro` y deja correr la transición que `.av` ya declara —la entrada al revés, sin clase nueva—, y avisa al producto cuando termina. Entraba animado y **salía de un fotograma a otro**, que se lee como un fallo de pintado: exactamente el motivo por el que se animó la entrada. **El catálogo llevaba el desvanecido desde el principio y la entrega no**, así que esta es otra promesa que el cartón enseñaba y el componente no hacía. Cerrar a mano usa el mismo camino: un aviso no puede irse de dos formas según quién lo cierre. El desmontaje espera al `transitionend` de la opacidad con un plazo de respaldo, para que un aviso se cierre igual si la transición no llega a correr. |

---

## Confirmación

| | Regla |
|---|---|
| **1** | **Obligatorio.** **Nunca un diálogo modal encima.** La banda empuja el contenido hacia abajo, no lo tapa. En un teléfono el modal rompe el botón «atrás» y atrapa el foco. |
| **2** | **Obligatorio.** El foco **va a la banda** al aparecer. |
| **3** | **Obligatorio.** Al cerrar —confirmando, cancelando o con Escape— el foco **vuelve al control que la abrió**. |
| **4** | Del proyecto: qué acciones piden confirmación. Regla del sistema: **solo lo irreversible**. Lo reversible se hace y se ofrece «Deshacer» en el aviso. |

---

## Diálogo modal

**No tenía sección.** `Dialogo` entró en la **v1.13.0** y llega aquí en la
v1.107.0: **111 versiones publicadas** sin una sola regla escrita
(`git log --follow --diff-filter=A`). Lo destapó R118, que pedía una propiedad y
encontró la sección vacía.

Lo que faltaba era el contrato **escrito**, no toda la defensa: las siete pruebas
que ya había cubrían el orden de los botones y la ida y vuelta del foco, y caen
en rojo si alguien los toca. Lo que no estaba escrito en ninguna parte —y por
tanto nadie tenía que respetar— es el rango de lo prometido: `showModal` y no
`show`, la intercepción de `cancel`, `cerrarAlPulsarFuera`, `deshabilitada`,
`destructiva`, y qué pasa al cerrar con la acción en vuelo.

**Y la primera versión de esta sección decía «v1.60.0» y «47 versiones».** Las
dos inventadas: el número se copió de la sección de arriba sin ir a mirar el
historial, que es el defecto exacto que esta sección dice estar corrigiendo. Lo
cazó una auditoría adversaria antes de publicar. Queda escrito porque el
registro de este repositorio sirve para eso.

Cuidado al citar: en el registro de este documento **R118** es *búsqueda contra
el servidor* (v1.97.0). Aquí se cita el **registro del equipo**, donde R118 es
*el diálogo que no puede decir el gerundio*. La concordancia está arriba.

<!-- pruebas: Dialogo.test.tsx, boton-ocupado-catalogo.test.tsx -->

| | Regla |
|---|---|
| **1** | **Obligatorio.** El diálogo lleva **nombre accesible** —`aria-labelledby` al título—. Sin él se anuncia «diálogo» a secas y no se sabe qué se ha abierto. |
| **2** | **Obligatorio.** Se abre con **`showModal()`**, no con `show()`: solo el primero hace inerte el resto de la página. Con `show()` el foco se pasea por detrás. |
| **3b** | **Obligatorio.** (v1.107.0) **El título NO lleva anillo de foco**, y es una decisión, no un descuido: `componentes.css` entrega `.dialogo-tit:focus{ outline: none }` mientras `CLAUDE.md` §6 prohíbe `outline-none`. Se admite **solo aquí** porque ese `<h2>` tiene `tabIndex={-1}`: no está en el recorrido del tabulador, así que nadie llega a él navegando y el anillo solo aparecería al abrir, señalando un texto que no es un control. La excepción vale para este caso y para ninguno más. |
| **3** | **Obligatorio.** Al abrir, el foco **entra en el TÍTULO** —`tabIndex={-1}`, fuera del recorrido del tabulador— y no en el primer control: lo primero que se oye es qué es esto, y no «campo de texto» sin contexto. **Y también en modo estricto**, que es el que traen Vite, CRA y Next por omisión: React monta, **limpia** y vuelve a montar, y la primera versión de la devolución del foco (v1.107.0, sin publicar) corría en esa limpieza falsa y se lo llevaba al origen — el efecto recreado ya veía el diálogo abierto y no volvía a enfocar. Diálogo abierto y foco fuera. La devolución se aplaza un turno y se cancela si el componente vuelve a montarse; es el mismo rodeo que `Boton` tiene documentado para `vivo`. |
| **4** | **Obligatorio.** (v1.107.0) Al cerrar, el foco **vuelve al elemento que lo abrió**, y con tres condiciones que costaron tres intentos: (a) por **los cuatro caminos** —botón, Escape, pulsar fuera, y el **cierre programático**, que es el que el contrato obliga a usar cuando la acción sale bien y el más frecuente en producción—; (b) **aunque el proyecto desmonte el diálogo** al cerrarlo, que es el patrón `{abierto && <Dialogo …/>}`; y (c) **sin robarlo**: si el foco no está ni dentro del diálogo ni caído en `<body>`, lo puso alguien a propósito —la fila recién creada— y no se toca. Se devuelve **después** de `close()`: `showModal()` hace inerte todo lo de fuera, así que enfocar el origen con el diálogo todavía abierto puede ignorarse en un navegador de verdad. En jsdom no, y por eso la versión vieja salía verde. |
| **5** | **Obligatorio.** Escape lo cierra el navegador solo, pero se intercepta `cancel`: sin eso el diálogo se cerraría y el proyecto **seguiría creyéndolo abierto**. |
| **6** | **Obligatorio.** **Cancelar a la izquierda y la acción a la derecha.** No es estética: es el orden documentado y el que ya está aprendido. Invertirlo hace que se pulse el que no era. |
| **7** | **Obligatorio.** La acción **no cierra el diálogo**. Cerrar lo decide el proyecto, que es el único que sabe si lo que se mandó salió bien. |
| **8** | **Obligatorio.** Pulsar el fondo cierra, y **se desactiva** con `cerrarAlPulsarFuera={false}` cuando hay datos sin guardar. «Fondo» es el propio `<dialog>`, y pulsar DENTRO no cierra. Eso lo sostienen **dos mecanismos, y cada uno basta por sí solo**: la guarda `e.target === dlg.current` y el `stopPropagation` de la caja. Se comprobó quitando cada uno por separado —la prueba siguió en verde las dos veces— y solo los dos a la vez la ponen en rojo. Se dice porque el comentario del componente llevaba **desde la v1.13.0** —desde el commit que lo creó— atribuyéndoselo solo al segundo, y **la prueba no distingue cuál trabaja**: comprueba el resultado. |
| **9** | **Obligatorio.** `accion.deshabilitada` deja el botón **a la vista y apagado**, que no es lo mismo que no pasar `accion`: un botón que aparece y desaparece según lo que haya dentro mueve el pie bajo el ratón y obliga a adivinar qué falta. |
| **10** | **Obligatorio.** (R118 del equipo, v1.107.0) **La acción puede decir el gerundio mientras trabaja**, con `accion.textoOcupado`. Hasta la v1.106.0 el diálogo pasaba `onClick` a solas, así que el doble envío **sí** estaba protegido —`Boton` espera la promesa— pero el botón **enmudecía**: se apagaba sin decir por qué. Se deja pasar lo que `Boton` ya hacía —los dos textos dibujados siempre, apilados, reservando el del más largo— y **sin `textoOcupado` no cambia nada** de lo que ya estaba. |
| **10b** | **Obligatorio.** (v1.107.0 · completada en v1.110.0) **El giro reserva su sitio, con `textoOcupado` y sin icono.** «El botón mide igual antes, durante y después» era falso y llevaba versiones escrito en cuatro sitios: se reservaba el ancho del TEXTO y luego se **insertaba** el giro como un hijo más del flex — 14 px de rueda y 8 de hueco, **22 px de salto**. La v1.107.0 reservó el hueco **solo delante**, que arregló el salto y **descentró el rótulo**: eso es la regla 10e. Y **el hueco no gira**: `visibility: hidden` no detiene una animación de CSS, así que la rueda daba vueltas invisible para siempre en cada botón con gerundio de cada pantalla hasta que se le puso `animation: none`. |
| **10c** | **Obligatorio.** (v1.107.0) **Un `textoOcupado` que no pinta texto se cae al comportamiento de siempre.** Muchos `ReactNode` son legales y no pintan una letra —`null`, `false`, **`true`**, `''`, espacios, `[]`, `[null, false]`, `<>{null}</>`, `<span>{t('clave.ausente')}</span>`, un `Set` vacío—, y con la guarda `=== undefined` **todos** pasaban: el texto de reposo quedaba con `aria-hidden`, el hueco del gerundio salía vacío y el «, enviando» se suprimía. El botón ocupado se quedaba **sin ningún nombre accesible**. La primera corrección comparaba **valores** y dejaba fuera seis de esas variantes; se mira dentro del árbol. **`soloIcono` ignora `textoOcupado` entero**: no tiene texto que sustituir, y el apilado le reservaba el ancho del gerundio al lado del icono. Sin cubrir, declarado: un componente que devuelve `null`, y un elemento sin prop `children` —`<span />`, `<Trans i18nKey="x" />`—, que se cuentan como texto a propósito porque `<Trans>` es el caso real. |
| **10d** | **Obligatorio.** (v1.107.0) **Una acción que falla no deja un rechazo sin manejar.** `.finally()` devuelve una promesa **derivada** que rechaza con la misma razón, y se tiraba sin `catch`: cada acción fallida producía un `unhandledRejection` **aunque el proyecto capturara la suya**, y en Node ≥15 eso tumba el proceso — y las pruebas de quien nos consume. **Lo que cuesta, dicho tal cual:** observar el rechazo es lo que libera el botón, y observarlo lo marca como manejado, así que `unhandledrejection` deja de dispararse. Para los vigilantes de errores eso es **un evento que baja a miga de pan** (`console.error`). Sí hay una forma de recuperarlo —re-elevar la razón desde un `setTimeout`, que el vigilante registra como error no capturado— y **no se toma**: vuelve a tumbar el proceso en Node, que es el defecto que esto vino a arreglar. Quien necesite el evento, que capture en su `onClick` y reporte — que además es donde sabe qué estaba guardando. |
| **10e** | **Obligatorio.** (R133 del equipo, v1.110.0) **El hueco del giro va a los DOS lados**, o el rótulo queda descentrado dentro de su propio botón. Reservarlo solo delante dejaba el hueco izquierdo en 39 px y el derecho en 17 —`.btn` lleva `padding: 8px 16px` y `border: 1px`—, así que el rótulo salía **11 px a la derecha del centro**, y al lado de un «Cancelar» centrado el pie del diálogo se veía torcido. Lo midió Control Administrativos sobre el DOM, y una auditoría lo confirmó en un navegador de verdad: con el espejo el desvío es **0** en reposo y ocupado, en `principal`, `destructiva`, `terciaria` y `mini`, y el botón crece **22,00 px exactos**. **El espejo NO se añade con `icono`**: un icono no es un hueco vacío —ocupa su sitio porque significa algo— y duplicarlo descentraría al revés. |
| **10f** | **Obligatorio.** (R133 del equipo, v1.110.0) **Dos casos siguen descentrados, y se dicen porque la regla anterior no los cubre.** Medidos en navegador: **sin `textoOcupado`** el rótulo sigue a 11 px del centro y el botón sigue creciendo 22 al ocuparse —reservarlo siempre cambiaría el ancho en reposo de todos los botones de texto de todos los productos, y eso es una versión mayor—; y con **`icono` + `textoOcupado`** el rótulo va a **13 px** en reposo y 11 ocupado, y el botón **encoge 4,00** porque el icono mide 18 y el giro 14. Ese encogimiento es anterior a R118 y esta versión no lo toca. **Ojo a la combinación:** `accion.icono` (regla 14) habilita justo el caso que la 10e no centra — quien añada un icono a su acción verá el rótulo **más** torcido que antes, no menos. |
| **11** | **Obligatorio.** (v1.107.0) **`accion.destructiva` pinta la variante destructiva.** No estaba en ninguna regla ni en ninguna prueba: ignorar la prop dejaba todo «Eliminar» pintado como acción principal y las quince pruebas de entonces en verde. |
| **12** | **Obligatorio.** (v1.107.0) **`accion.ocupado` existe, y casi nunca hace falta.** La protección del doble envío se apoya en que `onClick` **devuelva** la promesa. Si la acción hace el `fetch` sin `return` —que el tipo `() => void \| Promise<unknown>` permite y nada avisa— no hay gerundio, ni bloqueo, ni protección: tres clics llaman tres veces. Lo primero es devolver la promesa; cuando el estado vive fuera y no se puede, ésta es la salida, y `Boton` la tenía desde antes sin que el diálogo la dejara pasar. |
| **13** | **Obligatorio.** (v1.107.0) **Cerrar con la acción en vuelo conserva el estado ocupado mientras el diálogo siga MONTADO**, y en cuanto la promesa termina el botón se libera solo, con el diálogo abierto o cerrado. Esta versión llegó a montar el botón limpio al cerrar —para que un `fetch` abortado que no se resuelve nunca no lo dejara muerto— y **se retiró antes de publicar**: con el botón remontado, abrir · Guardar · Cancelar · abrir · Guardar disparaba la acción **dos veces con la primera todavía en vuelo**. **EL LÍMITE, medido y sin arreglo posible desde aquí:** si el proyecto **desmonta** el diálogo al cerrarlo —`{abierto && <Dialogo …/>}`, que la regla 4 bendice para el foco— el guardia del doble envío vive dentro de `Boton` y **muere con él**, así que el botón remontado acepta el segundo clic. Le pasa a cualquier estado de componente. Dos salidas: no desmontar (`abierto={abierto}` y ya está), o llevar el estado fuera con **`accion.ocupado`**. |
| **14** | **Obligatorio.** (R133 del equipo, v1.110.0) **`accion.icono` existe; el botón de cerrar NO lo admite, y es una decisión.** `Boton` acepta icono desde siempre y este diálogo no lo dejaba pasar: **ningún botón del pie de ningún diálogo podía llevarlo**, aunque el resto de los botones del sistema sí. El de cerrar se queda sin él a propósito — siempre dice lo mismo, «Cancelar» o «Cerrar», y lo que hace es **irse**: un icono ahí no añade información y compite con el de la acción, que sí la tiene. Si algún día un pie necesita dos botones con icono, será porque el segundo dejó de ser una salida, y entonces el sitio es `children`. |
| **15** | Del proyecto: **cuándo NO usarlo**, que importa más que cómo. Para confirmar una acción está `Confirmacion`, que es una banda en línea y no tapa. Un diálogo detiene la tarea entera, y eso solo se justifica cuando lo que hay dentro **es** la tarea. **Ojo:** `Confirmacion.onConfirmar` es `() => void` y no acepta promesa, así que en esa banda **la regla del gerundio de R118 no se puede cumplir**. Está declarado, no resuelto. |

**Cuatro huecos declarados, que ninguna prueba de aquí cubre:**

1. **El foco cuando el botón pasa a `disabled`.** Al ocuparse, `Boton` pone
   `disabled`. jsdom conserva el foco; **los navegadores reales lo mueven a
   `<body>`**, y entonces el cambio de texto al gerundio no se anuncia. Es la
   diferencia entre «se oye el gerundio» y «no se oye nada». **No hay navegador
   en este entorno para medirlo** y no se ha comprobado.
2. **La regla 8 no la puede hacer cumplir ningún candado.** Sus dos mecanismos
   son redundantes, así que cualquiera de los dos se puede borrar mañana con las
   30 pruebas en verde. Es el patrón «promesa muerta» que este repositorio ya se
   cazó dos veces.
3. **Los píxeles no los mide nada.** Los «22 px» de las reglas 10b y 10e y los «4 px» de la 10f
   son ciertos **por construcción** —`.btn{gap:8px}` más `.btn-giro{width:14px}`,
   y el icono a 18— pero **no hay navegador sin cabeza en este entorno** y jsdom
   no maqueta. Se comprobó lo que eso permite: cambiar
   `.btn-texto-oculto{visibility:hidden}` por `display:none` —que resucita a la
   vez el salto de 22 px y la inestabilidad del ancho— deja **los diecisiete
   pasos y las pruebas en verde**. **Desde el 2026-09-13 hay una medición de
   verdad**: una auditoría levantó la hoja entregada en un navegador y midió el
   marcado que emite `Boton` —22,00 px de crecimiento, 4,00 de encogimiento con
   icono, desvío 0 con el espejo—. No es un candado y no corre sola; es una
   medición fechada, y por eso las cifras de estas reglas están confirmadas y no
   solo calculadas. Lo que sí está atado en cada versión es la **anatomía**:
   que los dos estados tengan los mismos hijos, y que el catálogo emita lo
   mismo que el componente.
4. **`verificar-elemento` compara conjuntos, no la página.** Hasta la v1.106.0
   la página del catálogo dibujaba `.dlg`, `.dlg-cuerpo` y `.dlg-pie` —clases de
   demostración de otra página, que **no viajan**—, así que los candados que
   comparan las dos superficies no tenían nada real que medir aquí. **Corregido
   en la v1.107.0**: la página emite ahora `.dialogo-caja`, `.dialogo-cab`,
   `.dialogo-cuerpo` y `.dialogo-pie`.
   Lo que **sigue abierto** se midió al comprobar el arreglo: poner un `<h3>` en
   el título de esa página **no pone el candado en rojo**, porque `.dialogo-tit`
   ya sale como `<h2>` en las demostraciones de `CargaImagen` y `CargaId`, y el
   candado pregunta «¿la etiqueta del componente está entre las que usa el
   catálogo?», no «¿usa el catálogo alguna otra?». Un elemento correcto en una
   página tapa uno incorrecto en otra.
   Y lo mismo pasaba con **el botón ocupado**: `.btn-giro`, `.btn-textos` y
   `.btn-texto-oculto` existían solo como reglas CSS y **nunca en marcado**, así
   que cinco candados no medían ese estado en absoluto. La página del botón
   dibuja ahora los tres estados —reposo con gerundio, ocupado, y ocupado sin
   gerundio—, **y eso por sí solo no compró nada**: borrar la sección entera
   dejaba los diecisiete pasos en verde, porque los candados comparan conjuntos
   de clases y de etiquetas y `<span>` está en todas partes. Lo que sí lo
   cubre es `boton-ocupado-catalogo.test.tsx`, que **ejecuta el catálogo** y
   compara el árbol con el que emite `Boton` — el método de R116 y R126. Cinco
   mutaciones que antes pasaban sin rojo ahora caen.

---

## Estados de pantalla

| | Regla |
|---|---|
| **1** | **Obligatorio.** Son **siete y no son intercambiables**: cargando, nunca consultado, sin resultados, primera vez, error, sin permiso y fallo de dibujado. |
| **2** | **Obligatorio.** «Sin resultados» y «primera vez» **no son lo mismo**: uno ofrece quitar filtros, el otro crear el primer registro. Confundirlos ofrece un botón que no resuelve nada. |
| **3** | **Obligatorio.** «Error» ofrece **Reintentar**; «fallo de dibujado» ofrece **Recargar**. Reintentar un dibujado que reventó vuelve a reventar. |
| **4** | **Obligatorio.** Bajo 300 ms **no se muestra nada**. Un parpadeo se lee como fallo. |
| **5** | **Obligatorio.** Ningún estado es un callejón: todos dicen **qué hacer a continuación**. |

---

## Interruptor cerrado por regla

| | Regla |
|---|---|
| **1** | **Obligatorio.** (R66, v1.58.0) `cerrado` **no es `deshabilitado`**, y confundirlos tiene consecuencia. Deshabilitado se lee como «ahora no, vuelve luego» — gris, apagado, temporal— y eso **invita a buscar la forma de encenderlo**. Cerrado dice lo contrario: no se va a poder mientras la regla siga. El caso que lo motiva es de seguridad: quien reparte privilegios no puede conceder los que él mismo no tiene. |
| **2** | **Obligatorio.** (R66, v1.58.0) **El interruptor desaparece** y en su hueco va un candado del mismo tamaño, para que la columna no baile. Un control que no puede cambiar nunca no es un interruptor: dejarlo puesto y apagado es prometer una interacción que no existe. |
| **3** | **Obligatorio.** (R66, v1.58.0) Se pasa **el motivo**, no un booleano. El motivo es la mitad del estado: un candado sin explicación se lee como un fallo del sistema. Y **la opción no se oculta** — si el privilegio no aparece, quien reparte no entiende por qué su lista no coincide con la de al lado. |
| **4** | **Obligatorio.** (R66, v1.58.0) `cerrado` **manda sobre `deshabilitado`**: lo permanente gana a lo temporal. |
| **5** | **Obligatorio.** (R41, v1.58.0) El interruptor **deshabilitado se ve deshabilitado**. Las reglas existían pero pedían el atributo `disabled`, y el componente usa `aria-disabled` a propósito —el nativo sale del tabulador y su estado se vuelve indescubrible con teclado—, así que **no casaban nunca**: conservaba su color de encendido y solo se apagaba el rótulo. |

---

## Segmentado

| | Regla |
|---|---|
| **1** | **Obligatorio.** (R69, v1.59.0) Existe `Segmentado`: **dos o tres opciones excluyentes en una línea**. Existe porque hay datos que no se ven o no se ven — tienen un **punto medio**, y es el que hace útil el sistema—. Con el interruptor, de dos posiciones, ese punto medio no se puede expresar sin mentir. La regla que lo gobierna la escribió Control Administrativos V2.0 y cabe en una frase: **cada dato sensible tiene una versión reducida que sirve para trabajar, pero no para suplantar.** |
| **2** | **Obligatorio.** (R69, v1.59.0) El **ejemplo va en cada opción**, no solo en la elegida. El ejemplo es la *definición* del nivel: si solo se viera bajo la activa, para saber qué concede «parcial» habría que **concederlo primero** — cambiar un privilegio real de un cargo real para aprender qué significa—. Una definición se lee antes de elegir, no después. |
| **3** | **Obligatorio.** (R69, v1.59.0) El nombre accesible es **el rótulo solo**; el ejemplo va de **descripción**. El `<label>` envuelve a los dos, así que sin `aria-labelledby` el lector anuncia «Completo 71602303» y acto seguido «71602303» otra vez. |
| **4** | **Obligatorio.** (R69, v1.59.0) Botones de opción **nativos** dentro de un `fieldset`, y el control se **tapa, no se quita**: con `display:none` se van las flechas del teclado y el foco itinerante, y un grupo de diez pasa a ser treinta tabulaciones. |
| **5** | **Obligatorio.** (R69, v1.59.0) Los segmentos **reparten el ancho a partes iguales** (`flex: 1 1 0` con `min-width: 0`). Sin ello un ejemplo largo empuja y a 390 px la barra desborda la página, que es justo lo que la matriz de privilegios no admite. |
| **6** | **Obligatorio.** (R69 · R66, v1.59.0) **Cerrado por regla, aquí por nivel.** Quien reparte privilegios no puede conceder uno que lo iguale a él mismo, y eso casi nunca cierra el campo: cierra **un nivel**. El nivel **no desaparece** —desaparecido, la lista no coincide con la de al lado y se lee como una carga a medias—, **no se pinta apagado** —apagado invita a encenderlo— y va **con su motivo**. Deja de ser un control: no es un botón de opción desactivado, es texto. |
| **7** | **Obligatorio.** (R69, v1.59.0) Un nivel que **no aplica no se pasa**, y el componente no lo inventa: la dirección no tiene punto medio —media dirección ya dice el barrio— y el documento no puede ocultarse del todo —sin él, dos personas con el mismo apellido son indistinguibles—. Dos opciones es un caso normal, no un componente a medias. |
| **8** | Del proyecto: qué niveles tiene cada dato, y qué se muestra en cada uno. |

---

## Mensaje en flujo

| | Regla |
|---|---|
| **1** | **Obligatorio.** (R83, v1.57.0) Existe `Mensaje`: mensaje **en flujo y con tono**, el hueco que faltaba entre los otros dos. `Aviso` flota, tiene tono y **se va solo**. `Nota` está en flujo y se queda, pero es **neutra**: explica, no señala. `Mensaje` está en flujo, se queda y tiene tono. Existía el CSS de los cuatro tonos y no existía la pieza, así que cada pantalla dibujaba su caja a mano — **seis mensajes en tres pantallas**, medido por Control Administrativos V2.0. |
| **2** | **Obligatorio.** (R83, v1.57.0) Cada intención lleva su **glifo**, y los cuatro son distintos: `visto` ✓, `alerta` !, `cerrar` ✕ e `informacion` i. Es la señal **no cromática** que exige SC 1.4.1: sin ella, quien no distingue el rojo del ámbar no sabe si lo que lee es un fallo o una advertencia. El glifo va **oculto al lector** —regla de significado de la iconografía—; para quien usa lector, el canal equivalente es el `role`. |
| **3** | **Obligatorio.** (R83, v1.57.0) El `role` es **elegible**: `status` espera turno, `alert` interrumpe. Por omisión el error interrumpe y el resto espera. Se puede forzar en los dos sentidos, y hay casos legítimos para ambos: un error ya leído que solo se repite no debe volver a interrumpir, y un aviso de que la sesión caduca en un minuto sí. |
| **4** | Del proyecto: qué dice el mensaje. **Cuándo aparece, no**, y hasta la v1.118.0 esto decía «y cuándo aparece», que es dejar sin criterio lo que más se equivoca. **Un mensaje responde a algo: a una acción de quien mira, a una que el sistema acaba de hacer, o a una condición que cambia lo que esa persona puede hacer ahora.** Lo que solo **describe lo que ya está en pantalla no es un mensaje: es la pantalla**. Si la tabla enseña una marcación, escribir encima «hay 1 marcación» no informa: repite, y gasta la atención que hará falta el día que el mensaje sí importe. Lo pidió el responsable el 2026-09-15 con un caso del equipo consumidor delante: *«la muestra cuando consulto, ya se sabe que está la marcación, la alerta está de más»*. **Consultar no es una acción que merezca respuesta**: la respuesta a consultar son los datos. El caso límite y su salida: una condición que **bloquea** —la sede suspendida, el periodo cerrado— sí aparece al llegar, porque cambia lo que se puede hacer; y si lo que hay que decir es que **los datos están raros**, el sitio es el dato —una fila marcada, un chip— y no una banda encima. **El sistema no puede hacer cumplir esto**: es criterio de uso, no marcado, y no hay candado que lo vea. Se escribe para que sea una decisión y no un descuido. |

---

## Lo deshabilitado

| | Regla |
|---|---|
| **1** | **Obligatorio.** (R41, v1.56.0) Un control deshabilitado **se ve deshabilitado**. El botón usa `accion-deshabilitada` de fondo y `accion-texto-desh` de texto; el campo de texto, el mismo trato que ya tenía el del grupo. Es una corrección de algo que estuvo mal desde el principio: `.btn` **no tenía ninguna regla `:disabled`**, así que un botón principal apagado se pintaba con el mismo azul que uno activo y solo se descubría al pulsarlo. Lo pidieron **tres veces**. |
| **2** | **Obligatorio.** (R41, v1.56.0) El `hover` **no lo resucita**, y se cubre también `[aria-disabled='true']` — no solo el atributo—, porque el sistema prefiere `aria-disabled` donde el control tiene que seguir siendo alcanzable y anunciable. |
| **3** | **Obligatorio.** (R41, v1.56.0) El **terciario no se rellena**: es un botón de texto, y darle fondo gris lo convertiría en sólido justo cuando deja de poder pulsarse. Recibe solo el color de texto apagado. |

---

## Estados de pantalla — acceso suspendido

| | Regla |
|---|---|
| **1** | **Obligatorio.** (R81, v1.55.0) Existe el tipo **`acceso-suspendido`**, distinto de `sin-permiso`. `sin-permiso` significa «tu cuenta no tiene este privilegio» y su salida es quien administra la aplicación. `acceso-suspendido` significa que el privilegio **existe y está suspendido** por algo ajeno a la aplicación —un contrato, un pago, una vigencia— y **el administrador no puede levantarlo**. Confundirlos manda a la persona a la puerta equivocada, y el componente ya exigía que ningún estado sea un callejón sin salida: con el tipo equivocado, la línea de salida dice a quién acudir **mal**. |
| **2** | Del proyecto: **a quién hay que acudir**. El sistema obliga a decirlo en la `línea`; quién es —tesorería, dirección, el área comercial— lo sabe cada aplicación y no lo nombra el sistema. |

---

## Aviso temporal — visibilidad

| | Regla |
|---|---|
| **1** | **Obligatorio.** (R50, v1.55.0) El aviso **se hace visible solo**. `.av` nace con `opacity: 0` y `translateY(-16px)` para poder entrar deslizando, y `.av-dentro` es lo que lo trae a la vista: el componente la añade en el fotograma siguiente al montaje. Es una corrección de un defecto que dejaba el componente **inservible**: no la añadía nadie, así que en cada producto el aviso se montaba, ocupaba su sitio, se anunciaba al lector de pantalla **y no se veía. Ni uno.** En el catálogo sí se veía, porque allí la pone el guion de la página. Va en un fotograma aparte a propósito: puesta en el mismo en que se inserta el elemento, el navegador no llega a ver el estado inicial y no anima. |

---

## Campo, selector y formulario


| | Regla |
|---|---|
| **1** | **Obligatorio.** **La etiqueta siempre visible.** El placeholder es solo ejemplo de formato, nunca etiqueta: desaparece al escribir y con él la pregunta. |
| **2** | **Obligatorio.** El error se muestra **junto al campo** y el campo lleva `aria-describedby`. Un resumen arriba sin vínculo obliga a buscar. |
| **3** | **Obligatorio.** El selector con búsqueda **ignora tildes**: «jose» encuentra «José». |
| **4** | **Obligatorio.** El interruptor **surte efecto al instante**. Si hace falta «Guardar», es una casilla, no un interruptor. |
| **5** | **Obligatorio.** Todo icono va `aria-hidden`; **quien nombra es el control**. |
| **6** | **Obligatorio.** (v1.37.0) `Campo` **recorta al salir**, nunca al teclear: la persona ve lo que escribe, y el espacio accidental —el copy-paste con cola— se va al abandonar el campo, emitiendo por `onChange` para que el estado se entere. Solo los extremos: los espacios internos son contenido. |
| **7** | **Obligatorio.** (v1.37.0) `CampoContrasena` **jamás normaliza**: ni trim ni caja — un espacio en una contraseña puede ser deliberado, y «limpiarlo» es cambiar la llave sin avisar. El conmutador ver/no ver lleva `aria-pressed` y **es solo pantalla** (el valor no cambia); el `autoComplete` es `current-password`, o `new-password` con la prop `nueva`; y **pegar no se bloquea**: quien pega desde su gestor hace lo correcto. |

---

### Selector con búsqueda · la lupa

| | Regla |
|---|---|
| **1** | **Obligatorio.** (R100, v1.75.0) **Por omisión no lleva lupa**, y así se ve igual que el `Selector`: mismo alto, mismo ancho y **el texto empieza en el mismo sitio**. Con la lupa siempre puesta, el campo sangraba 32 px mientras el resto del formulario empezaba en 8, y en una columna de campos el suyo se salía de la alineación. |
| **2** | **Obligatorio.** (R100, v1.75.0) **El chevron va siempre.** Es lo que dice «esto se despliega», y es lo que iguala este control con el `Selector`. |
| **3** | **Obligatorio.** (R100, v1.75.0) **`conLupa` se enciende donde de verdad se BUSCA y no se elige**: el buscador de una tabla, una caja de búsqueda global. Elegir de una lista es el mismo gesto en los dos componentes; que además se filtre escribiendo es un detalle de interacción, no otra clase de campo. |
| **4** | **Obligatorio.** (R103, v1.79.0) **Se puede volver a «sin elegir», y por el mismo gesto que en `Selector`: su opción vacía.** `vacio` es el texto de esa fila; **sin `vacio` no se puede vaciar**, y así se queda lo que ya está en producción. Va **la primera** de la lista, solo cuando hay algo que vaciar, y **se retira al escribir** —es un mando, no un resultado: ofrecer «Todos» mientras se busca «Ancash» no significa nada y empuja la primera coincidencia fuera del sitio donde el dedo ya va—. Hasta aquí, `onCambio` **nunca** emitía `null` aunque su firma dijera `(valor: string \| null) => void`: solo salía de `elegir()`, siempre con un valor real. El defecto no era la falta, era que **el tipo documentaba un camino que no existía**, y eso lo bloqueaba en cualquier campo opcional. Lo reportó Control Administrativos V2.0. |
| **5** | **Obligatorio.** (R103, v1.79.0) **Retroceso sobre el campo vacío vacía la elección**, y solo con `vacio` puesto: es el mismo permiso, expresado con la misma prop. «Vacío» es lo **tecleado**, no lo que se ve —con la lista cerrada el campo enseña lo elegido—. Es un **acelerador, no la única puerta**: un gesto que solo existe en el teclado deja fuera a quien usa el ratón, y por eso el mando de la lista es el camino principal. |
| **6** | **Obligatorio.** (R103, v1.79.0) **`etiquetaOculta` existe aquí también.** La tenían `Campo` y `Selector` y faltaba solo en este, así que bajo una cabecera de columna el rótulo se anunciaba dos veces y había que apañarse con `Selector`. Oculta la etiqueta **a la vista, no al lector**, y sigue siendo obligatoria: es la diferencia entre no mostrarla y no tenerla. |
| **7** | **Obligatorio.** (R103, v1.79.0) **Con `onCrear`, la fila de «no hay coincidencias» deja de ser un cartel y pasa a ser el camino**: recibe **lo tecleado** y se activa con el ratón y con **Enter** —sin lista no hay opción activa que Enter pudiera elegir, así que ahí esa tecla está libre—. **Tab no lo dispara**: salir de un campo no es pedir un alta. El componente **no crea nada** y **no elige ni limpia** al pulsarlo: el alta es del producto y puede tardar o cancelarse, y cerrar dando por hecho un registro que quizá no ocurre dejaría el campo en blanco a quien vuelve de cancelar. |
| **8** | Del proyecto: si hace falta decir que se puede escribir, se dice en el **`placeholder`** — es texto y no roba sangrado. Y qué significa el estado vacío: «Todos», «Sin asignar» y «Cualquiera» no dicen lo mismo, y por eso `vacio` pide el texto en vez de ser un booleano. |

#### El teclado — y por qué esta tabla vive AQUÍ

Hasta la v1.94.0 esta tabla existía **solo en el catálogo**, y por eso cuatro de
sus siete filas llevaban tiempo sin cumplirse sin que nada lo notara: el candado
del contrato lee este documento, no el catálogo. Un contrato publicado donde
ningún candado mira no es un contrato, es una intención.

| | Regla |
|---|---|
| **9** | **Obligatorio.** (R115, v1.95.0) **Abajo y Arriba abren la lista si está cerrada**, las dos. Abajo ya lo hacía; **Arriba no**, y era la misma tecla muerta en la otra dirección: se pulsaba y no pasaba nada, que es como se ve un control roto. |
| **10** | **Obligatorio.** (R115, v1.95.0) **Las dos flechas ciclan**: de la última a la primera y al revés. Topar en el extremo obliga a recorrer la lista entera para llegar a la última, y en una lista filtrada la última suele estar a una tecla de la primera. Es lo que el catálogo demuestra desde el principio. |
| **11** | **Obligatorio.** (R115, v1.95.0) **Inicio y Fin llevan a la primera y a la última.** Estaban publicadas y **no existían**. |
| **12** | **Obligatorio.** (R115, v1.95.0) **Tab elige lo marcado y NO devuelve el foco.** El catálogo lo publica —«sale del campo; si había una marcada, la elige»— y el componente solo cerraba: `onCambio` no se llamaba ni una vez, así que quien tecleaba, veía su coincidencia marcada y tabulaba al siguiente campo **se llevaba el campo vacío**. Devolver el foco lo anularía igual: se elegiría y el cursor volvería al campo del que la persona está saliendo. **Tab no dispara `onCrear`**: salir de un campo no es pedir un alta. |
| **13** | **Obligatorio.** (R115, v1.95.0) **Escape cierra la lista, no el diálogo**, y devuelve el valor anterior sin vaciar la elección. Ya se cumplía; se escribe porque estaba publicado en el mismo sitio sin candado. |
| **14** | **Obligatorio.** (R115, v1.95.0) **El visto de la opción elegida va DETRÁS del texto**, y el nombre y su `ayuda` van dentro de una envoltura `.sel-op-txt`. No es cosmética: `.sel-op` reparte con `space-between`, así que el orden decide el lado. Con el visto delante salía a 8 px en vez de a 306,4, y con el nombre y la ayuda sueltos el nombre de la fila elegida se iba al centro —98,3 px contra los 8 de sus vecinas— y la lista salía escalonada. |
| **15** | **Obligatorio.** (R115, v1.95.0) **Mientras la lista está abierta, `.sel-caja` lleva la clase `abierta`.** La hoja gira el chevron con ella, y sin emitirla esa regla viajaba en el paquete sin que ningún producto pudiera activarla: el control perdía su única señal visual de estar desplegado. Misma familia que `.sel-op.activa` de la v1.83.0. |
| **16** | **Obligatorio.** (R115, v1.95.0) **`textoVacio` recibe lo tecleado.** Admite cadena —nadie tiene que cambiar nada— o función, y **por omisión dice qué se buscó**: hasta aquí entregaba «No hay coincidencias», que es literalmente el patrón que el catálogo enseña como el ejemplo malo, con su etiqueta roja y todo. |
| **17** | **Obligatorio.** (R118, v1.97.0) **Con `modo="servidor"` el componente NO filtra.** Pregunta con `onBuscar` y pinta lo que le devuelvan, case o no con lo tecleado: un alias, un DNI o una coincidencia aproximada los devuelve el servidor sabiendo por qué, y volver a filtrarlos aquí los escondería —el buscador contradiciéndose a sí mismo sin que nada falle—. Es la misma palabra y el mismo significado que en `TablaDatos`. **Con el campo vacío no se pregunta**: se ven las `opciones`, que en este modo son las **de partida** —las recientes, las frecuentes— y no el universo. Sin `modo`, todo sigue exactamente como estaba: se filtra en local e ignorando tildes. |
| **18** | **Obligatorio.** (R118, v1.97.0) **El ciclo de la consulta es del componente, no del producto**: el rebote (300 ms desde la última tecla), la **cancelación** de la consulta anterior por `AbortSignal`, y el **descarte** de la respuesta que llegue fuera de orden. Las tres o ninguna: la carrera es un fallo **silencioso** —se teclea «ana», la respuesta de «an» llega después y la lista enseña otra búsqueda sin que nada avise—, y repartirla por cada pantalla es repartir el mismo defecto. **Abortar pide que se pare, no garantiza que no llegue**, así que además se descarta por bandera. Y `onBuscar` se lee por **referencia viva**: escrita en línea —que es como se escribe— no puede disparar un bucle de peticiones. |
| **19** | **Obligatorio.** (R118, v1.97.0) **La elección sobrevive a la siguiente búsqueda.** `elegida` salía de buscar el valor dentro de `opciones`; contra el servidor eso se rompe solo, porque al teclear otra cosa la opción elegida **deja de estar en ninguna lista** y el campo se quedaba **en blanco con un valor puesto**. El componente recuerda la última opción que casaba con `valor`: no es una caché, es la única copia que queda de su texto. Se arregla dentro y no pidiéndole al producto que pase el texto — lo que el producto no puede olvidarse de hacer es lo que no se le pide. Misma familia que el `null` que la firma prometía y no emitía (R103). |
| **20** | **Obligatorio.** (R118, v1.97.0) **Mientras se busca: esqueleto, y solo pasado el umbral.** Tres renglones con la clase `.esqueleto` del sistema —no un giro, que la tabla del catálogo reserva para «cuando no se puede dibujar el esqueleto»— y **no antes de 300 ms desde que la consulta sale**, no desde la tecla: un parpadeo por pulsación se percibe como un fallo. El campo lleva `aria-busy` mientras tanto, o el lector anuncia una lista vacía y da por hecho que no hay resultados. **El fallo de la consulta no reaprovecha `textoVacio`** —«no hay resultados» y «no se pudo preguntar» mandan a sitios distintos— y es una fila **pulsable que reintenta**, con el ratón y con Enter. Sobre un fallo **no se ofrece «Crear»**: ahí no se sabe si existe o no. |


## Rango de fechas

**No tenía sección.** Era el componente con más promesa publicada —dos meses,
panel de periodos, resumen— y **cero contrato**, así que nada impedía que la
próxima versión cambiara el valor por omisión de `meses` o el orden de los
atajos sin registrarlo. Lo destapó una auditoría adversaria el 2026-09-11,
cuatro días después de que Control Administrativos reportara que el componente
no se podía usar (R126).

<!-- pruebas: RangoFecha.test.tsx, rango-fecha-anatomia.test.tsx, calendario-catalogo.test.tsx -->

> **R129 lo vigila el candado de la cascada, no una prueba.** Es una regla sobre
> qué declaración GANA a cada ancho, y eso es precisamente lo que
> `verificar-cascada` resuelve; jsdom no maqueta y no podría verlo. La
> afirmación `R129` de ese candado sale en **rojo contra la v1.107.0**, que es
> como se comprobó que protege algo.

| | Regla |
|---|---|
| **1** | **Obligatorio.** (R126, v1.103.0) **Cada semana es una FILA propia** —`role="row"`— y no una celda suelta. El patrón `grid` de ARIA las exige, y la hoja las reparte: cada fila ocupa las siete columnas y es a su vez rejilla de siete. Hasta la v1.103.0 la hoja daba `grid-template-columns: repeat(7,1fr)` solo a `.fc-dias`, que con el marcado anidado repartía **las siete semanas** en siete columnas de ~33 px: cabeceras «LMXJVSD» pegadas y días de dos en dos. Desde la v1.105.0 el catálogo emite **la misma anatomía** —contenedor con `role="grid"`, cabecera como una fila más dentro, celdas `role="gridcell"`, filas rellenadas a siete—, así que la hoja describe UNA superficie y no dos. Y la celda de rejilla se estira: sin eso el día quedaba inline dentro de su columna, el tramo se pintaba a trozos y los redondeos de `.fc-ini`/`.fc-fin` no encajaban. |
| **2** | **Obligatorio.** (R130 del equipo, v1.108.0) **El rótulo va FUERA del recuadro, en su `.cg`, igual que en cualquier otro campo del sistema.** Iba **dentro** del botón y era el único del sistema que lo hacía: `Campo` compone `.campo-grupo` > `.campo-etiqueta` + `.campo`, con el rótulo encima de la caja. Puestos en la misma fila —que es lo normal— el rótulo de uno salía arriba y el del otro dentro, y **las cajas ni siquiera medían lo mismo**, porque el disparador apilaba dos líneas. La hoja **ya lo preveía**: `.fc-campos .cg{ width: 172px }` viajaba en el paquete desde siempre y **ningún producto podía activarla**, porque el componente no emitía ningún `.cg` ahí dentro — una promesa muerta que el candado no vio por ser un descendiente y no dos clases juntas. El rótulo se ata al botón con `aria-labelledby` (un `<label>` no nombra a un botón) y el nombre accesible sigue siendo «Desde 05/03/2026». El disparador declara su propio `line-height: 20px`: con sus 16 de relleno son los **36 px de un campo, exactos**, que es la lección de la v1.40.1 con `.btn`. |
| **2b** | **Obligatorio.** (R130 del equipo, v1.108.0) **En el disparador la fecha se muestra en formato peruano, no en ISO.** La tabla «Formato» del catálogo lo dice desde siempre —se muestra `31/03/2026`, se guarda `2026-03-31`— y el disparador imprimía el valor tal cual: el formato de **guardar**, enseñado a quien mira. Lo grave no es el despiste: **este mismo componente ya formateaba** para el resumen y no para el disparador. El contrato de la propiedad sigue siendo ISO —es lo que se guarda— y **el formateo al pintar es del componente**: si lo hace cada pantalla, habrá tantos formatos como pantallas. |
| **3** | **Obligatorio.** (R118, v1.101.0) **Dos meses a la vista por omisión.** Elegir un rango con un solo mes obliga a navegar a ciegas. `meses={1}` vuelve a uno, y las columnas salen del número de meses — no cableadas a dos, que dejaba media rejilla en blanco. |
| **4** | **Obligatorio.** (R118, v1.101.0) **No se pintan días del mes vecino: huecos.** Con dos meses a la vista el mismo día saldría dos veces y no se sabría cuál vale. |
| **5** | **Obligatorio.** (R118, v1.101.0) **El panel de periodos va con cuatro por omisión** —«Este mes», «Mes pasado», «Últimos 2 meses», «Este año»—, se sustituye entero con `atajos` y se quita con `atajos={[]}`. Un colegio piensa en bimestres, no en trimestres naturales. Elegir un periodo fija los dos extremos y cierra. |
| **6** | **Obligatorio.** (R118, v1.101.0 · matizada en v1.108.0) **El resumen dice lo elegido en palabras**, no en ISO. Dos fechas `2026-03-05 / 2026-03-12` no se leen de un vistazo, y esa línea es además **la que anuncia el cambio al lector**. **Sin rango, calla** —decía «Sin rango elegido.» y era una tercera frase para lo mismo, con los dos disparadores ya diciendo «Elegir fecha»—, **pero no desaparece**: el elemento se queda siempre en el árbol y lo que se vacía es su texto. Una región viva creada en el momento no la anuncian la mayoría de lectores, así que quitarla rompería el anuncio de la **primera** elección; es la regla 0 de «Aviso temporal». Y **no lleva propiedad para apagarla**, a propósito: esa línea es el anuncio, y dejarlo a criterio de cada pantalla es dejar el componente mudo. |
| **7** | **Obligatorio.** (R118, v1.101.0) **Sobrevolar enseña el rango que SALDRÍA.** Sin ello no se ve qué se está a punto de elegir hasta después de elegirlo. **Se suelta al cerrar y al cambiar de mes.** Solo se limpiaba con `mouseleave`, así que salir con Escape dejaba medio mes pintado como «dentro del rango» sin nadie encima. Al cambiar de mes el foco se mueve al día equivalente y ese día pasa a ser el sobrevolado — el tramo que se ve es el que se elegiría, no un resto del mes anterior. |
| **8** | **Obligatorio.** (v1.39.0) **Abrir NO borra el rango.** El del catálogo hacía `ini = null; fin = null` al abrir, así que un Shift+Tab de vuelta destruía la selección en silencio. Abrir es abrir. |
| **9** | **Obligatorio.** (v1.39.0) **El teclado completo del patrón**: flechas, Inicio y Fin de **semana**, RePág/AvPág de mes —con Shift, de año—, Escape, y **roving tabindex** (un solo día alcanzable con Tab, no los sesenta). |
| **10** | **Obligatorio.** (R129, v1.103.0) **Cambiar de mes no desborda.** `new Date(a, m+n, 31)` con destino en un mes de 30 salta al siguiente: AvPág desde el 31 de enero aterrizaba el **3 de marzo** —febrero entero saltado— y RePág desde el 31 de marzo no se movía. El día se recorta al último del mes destino. |
| **11** | **Obligatorio.** (v1.39.0) **Elegir un final anterior al inicio reinicia el rango**, no produce un rango invertido. Y el interior del rango se dice en el nombre accesible, no solo con color (SC 1.4.1). |
| **12** | **Obligatorio.** (R129 del equipo, v1.108.0) **La celda del día tiene ancho mínimo propio: `min-width: 30px`.** `width: 100%` **no aporta ancho intrínseco** dentro de una rejilla: las siete columnas se dimensionan por el contenido, y el contenido es un número. Control Administrativos midió el DOM y salían a **16,16 px** — los días de dos cifras se tocaban (`141516171819 20`) y ninguna columna cuadraba con su cabecera `LMXJVSD`. Los 30 px son la altura que la celda ya tenía: la celda cuadrada que este componente siempre quiso ser. |
| **13** | **Obligatorio.** (R129 del equipo, v1.108.0) **El tope del calendario no puede quedar por debajo de lo que el contenido pide, que son 626 px**: 472 los dos meses (7×30 ×2 + 20 de hueco + 32 de relleno) + 152 la barra de periodos (su `min-width`, que con `box-sizing: border-box` ya incluye sus 32 de relleno) + 2 de bordes. Topaba en **560** y encima lleva `overflow: hidden`, así que la columna del domingo del segundo mes salía cortada y **la barra de periodos desaparecía entera** — los cuatro periodos dejaban de existir para quien mira, **sin ningún aviso**. El `overflow` se queda: hace falta para que los fondos cuadrados de cabecera, periodos y pie no asomen por las esquinas redondeadas. Lo que se arregla es la caja, no el recorte. El tope se ata a la ventana con `min(640px, calc(100vw - 24px))`, que es el único límite real de una capa flotante. |
| **14** | **Obligatorio.** (R129 del equipo, v1.108.0) **La reserva que apila entra ANTES de que el tope por ventana recorte.** Cortaba en 620 px y el contenido pide 626: entre esos dos números volvía a recortar en silencio. Corta en **660**. Control Administrativos lo reportó como «la reserva mira la ventana y no el calendario», y tenían razón en el síntoma: con una ventana de 918 px y un calendario de 432, no entraba nunca. **El diagnóstico se queda corto**, y la diferencia importa: la causa era la regla 12. Sin ancho intrínseco el calendario se encogía al ancho de su **disparador**; con él, la fórmula de ajuste de una caja absoluta toma el máximo entre lo disponible y su mínimo de contenido, así que ya no depende del disparador y **medir la ventana vuelve a ser lo correcto para el caso que reportaron**. `@container` no haría falta **ahí**, y conviene no decirlo más fuerte: cuando lo que recorta no es la ventana sino un antecesor —un panel lateral, un diálogo, una columna de una rejilla—, el tope por ventana da 640 y el sitio real es menor, y ni `@container` lo resuelve, porque un contenedor no se consulta a sí mismo. Está al pie de esta sección. |
| **15** | **Obligatorio.** (R131 del equipo, v1.109.0) **El calendario se cierra**, y con las cuatro cosas con que se cierra cualquier capa: **clic fuera**, **Escape desde donde sea**, **volver a pulsar el disparador** —es un interruptor— y elegir el rango. Hasta la v1.108.0 solo cerraba **eligiendo un rango completo**: `cerrar()` existía desde siempre y no había quién lo llamara. `onKeyDown` colgaba de la rejilla, así que Escape solo funcionaba con el foco **dentro**, y en cuanto se pulsa fuera el foco cae a `<body>`. Quien abría para mirar otro periodo y cambiaba de idea se quedaba con **626 px flotando sobre los resultados que acababa de pedir**. Tres detalles que no son detalle: se escucha **`pointerdown`** y no `click`, porque con `click` el cierre llega después de que el navegador decida el foco y se pelean; al cerrar **por clic fuera NO se devuelve el foco**, que se lo quitaría al sitio donde se acaba de pulsar —con Escape sí, ahí no hay otro sitio—; y **cerrar no descarta nada**, o rozar la pantalla costaría el rango. El Escape **se detiene aquí**: dentro de un `Dialogo`, la primera cierra el calendario y no el diálogo. |
| **17** | **Obligatorio.** (R139 del equipo, v1.122.0) **`desde` y `hasta` MANDAN, no siembran.** Hasta la v1.121.0 eran el valor inicial —`useState(desdeProp)` las leía **una vez**— y el producto no podía mover el rango tras montar: devolverle por `onCambio` un rango corregido **no lo movía**. Consecuencia, en palabras del equipo: *«esto pasa de avisar a impedir y las líneas se borran»* — quien rechaza una selección no tenía forma de devolver el valor anterior, así que solo podía avisar **después** de que alguien ya eligió mal. Mismo patrón que `plegado`/`onPlegar` del marco: **sin pasarlas, el componente se gobierna solo**; pasadas, mandan. No se hacen obligatorias porque ya estaban publicadas como opcionales desde la v1.39.0 y eso sería un error de compilación en cada consumidor. **El control se decide con `!== undefined`, no con `??`**: `desde={null}` es un vacío deliberado y tiene que mandar igual, o el control se pierde **justo al vaciar** — la familia del R103 del selector. |
| **18** | **Obligatorio.** (R139 del equipo, v1.122.0) **El calendario sigue al rango que QUEDA, no al que se pide.** Es la regla 7 del marco, aquí. Encadenar al segundo extremo, mover la ventana al aplicar un periodo y **cerrar la capa** cuelgan de que el cambio se haya aplicado. Sin esto, controlado y con el producto rechazando, el calendario **se cerraba y el valor volvía atrás**: la pantalla no hace nada y nadie sabe por qué. |
| **19** | **Obligatorio.** (R139 del equipo, v1.122.0) **`maxDias` IMPIDE mientras se elige y AVISA cuando ya viene puesto.** Es un número cualquiera —7 en un sitio, 30 en otro— y **sin pasarlo no hay tope**; lo pidió así el responsable: *«si la consulta es máximo 30 días debe funcionar igual, si es libre sin límite debe funcionar igual»*. Eligiendo el final, los días pasados del techo van `aria-disabled` y no se eligen. Pero un rango que **llega de fuera** ya pasado **no se recorta ni se rechaza**: se pinta y se dice, como hace `maximo` en el editor, que cuenta «N de más» y no trunca una letra. **El componente no reescribe un valor que le dieron** — recortarlo sería cambiar el dato de alguien en silencio; rechazarlo, negarse a pintar un rango que ya está guardado. **Y GUARDA LOS DOS EXTREMOS.** Hasta la v1.124.0 solo miraba el final: eligiendo primero «Hasta» y después «Desde» salían **treinta días con `maxDias={7}`** y el calendario no apagaba **ni un solo día**. Lo reprodujo el responsable, y el producto tuvo que volver a poner su red —error en el campo y «Consultar» apagado— para tapar lo que el componente prometía impedir. El argumento con el que nació la asimetría —que un rango ya pasado no se podría arreglar moviendo su inicio— sigue en pie, y por eso el suelo se calcula **contra el final que hay**: **el tope nunca bloquea el gesto que lo arregla**. Con inicio 01/03, final 14/03 y tope 7, del **8 al 14** se arregla y del **15 en adelante** se reinicia el rango, que es cómo se mueve un periodo hacia delante; y «Limpiar» es la tercera salida. Lo que se apaga es solo lo que produciría un rango más largo que el tope, que es literalmente lo que `maxDias` promete. El error del producto manda sobre el del tope. **`aria-disabled` y no `disabled`**: apagado de verdad, el día sale del roving tabindex y quien navega con teclado se queda sin saber por qué no responde. |
| **20** | **Obligatorio.** (R140 del equipo, v1.122.0) **Con `error`, el par entero se marca.** El mensaje va **una vez** bajo los campos, en `.cg-error` con su icono —un renglón rojo suelto se confunde con una ayuda—, y los **dos** disparadores llevan `cg-mal`, `aria-invalid` y `aria-describedby`. **`cg-mal` y no `campo-mal`**: es la clase que `verificar-altura` ya medía para este componente, y la que **viajaba en la hoja desde siempre sin que ningún componente la emitiera** — invisible a `verificar-promesa-muerta`, que solo mira unidades de dos clases o más. Emitirla **paga** esa deuda. El `.fc-resumen` **no** entra en `aria-describedby`: es una región viva y se leería dos veces. |
| **21** | **Obligatorio.** (R140 del equipo, v1.122.0) **`deshabilitado` apaga de verdad.** `disabled` nativo en los dos disparadores: sale del tabulador y no viaja con el formulario. El equipo lo rodeaba con `pointer-events: none` y opacidad, y lo marcó ellos mismos en rojo: **apagar con CSS no saca el control del recorrido del teclado** — quien navega con tabulador llega a un calendario visualmente apagado, lo abre y elige una fecha que la pantalla dice que no se puede elegir. **No es solo lectura** (transversal 0c): si lo que hace falta es que se vea, se lea, se enfoque y **se envíe** mientras una consulta está en curso, esto NO sirve, y **este control no tiene esa variante**. Se declara en vez de fingir que cubre los dos casos. |
| **22** | **Obligatorio.** (Añadido al R139 del equipo, v1.123.0) **Un periodo que no cabe en el tope NO SE PINTA.** Los cuatro de omisión van de un mes a un año: con `maxDias={7}` los cuatro eran botones que solo sabían dar un aviso, y el responsable **tuvo que quitarlos a mano** en su producto — si hay que quitarlos fuera, es que el componente no los tenía que haber puesto. Se **esconden** y no se apagan, y la diferencia es la de la regla 19 al revés: un día va `aria-disabled` porque su disponibilidad **cambia** con el inicio elegido, y eso hay que explicarlo; un periodo mide siempre lo mismo contra el mismo tope, así que no es un control apagado sino uno que en esta pantalla **no existe**. Si no queda ninguno, **el rótulo «Periodos» también se va**: una sección con título y sin contenido es peor que no tenerla. La guarda de `aplicarAtajo` se queda como **defensa** —`rango` es código del producto y puede no devolver siempre lo mismo— y está declarada como tal. |
| **23** | Del proyecto: **con tope, los periodos se pasan.** `atajosDeDias(1, 3, 7)` construye «Hoy», «Últimos 3 días» y «Últimos 7 días» contando **inclusive**, igual que `maxDias`. Está exportada para que cada producto no vuelva a escribir la misma aritmética de fechas —que es lo que §4bis llama reconstruir—, y no es obligatoria: quien piense en bimestres pasa los suyos. |
| **16** | Del proyecto: de dónde salen las fechas, qué significan y qué se hace con ellas. El sistema entrega el control y su comportamiento. |

**Los 626 px son con los valores por omisión.** Con `meses={1}` o `atajos={[]}` —las dos son props públicas— el contenido pide 396 o 474, así que el corte en 660 apila antes de lo necesario; y un atajo con una etiqueta muy larga empuja `.fc-atajos` por encima de sus 152 y se come la holgura hasta 640. El candado los tiene clavados como si el contenido fuera fijo, y se dice.

**Un límite declarado, medido el 2026-09-13 por una auditoría de familia.** Con
el suelo de la regla 13 el calendario ya no se encoge, pero **tampoco cabe en
cualquier sitio**: pide 626 px y hay contenedores del propio sistema que
recortan por debajo de eso. El caso medido es `Dialogo`: `.dialogo-caja` mide
`min(520px, …)` y `.dialogo-cuerpo` lleva `overflow-y: auto` —que en CSS hace
computar también `overflow-x` a `auto`—, así que el interior son **480 px** y
sobran 146.

Qué pasa ahí, exactamente: el calendario **se ve entero y se llega a los
periodos desplazando**. Es mejor que antes, cuando a ese mismo ancho se encogía
a columnas de 16 px y la barra de periodos **se perdía sin recuperación**; pero
no es bueno. La reserva que apila **no puede entrar**, porque mide la ventana y
la ventana es grande.

**No se arregla con CSS**, y conviene decirlo en vez de fingir: una capa
posicionada no puede preguntar cuánto mide el antecesor que la recorta. `@container`
tampoco sirve —un contenedor no se consulta a sí mismo, y el único consultable
es `.fc-zona`, que es el disparador, no el espacio disponible—. La salida es
sacar la capa a la **capa superior** del navegador (`popover`), que es trabajo
de otra versión. **Mientras tanto: si se monta un `RangoFecha` dentro de un
`Dialogo`, cuéntese con el desplazamiento horizontal.** Lo mismo vale para
cualquier antecesor que recorte —`.app-contenido`, `.tb-envoltura`,
`.cf-banda-in`—, y para cualquier otra capa flotante del sistema.

**Y hay un coste que esta versión introduce, medido:** la capa pasó de 560 a 626 px reales, así que el desbordamiento por el **canto derecho** creció 66 px para todos. `.fc-cal` es `position: absolute; left: 0` **sin lógica de volteo**, y el `min()` acota el **ancho**, no la **posición**. Aparece una franja nueva —ventana de ~661 a ~690 con la columna de contenido a 606— donde el calendario se sale por la derecha y antes no lo hacía, porque el tope de 560 lo tapaba. Es el mismo problema de fondo que el del pie: sin capa superior, una capa anclada no sabe dónde está el borde.

---

## Fila de carga

El arranque y el final **comunes** de las tres cargas —imagen, PDF e ID—. No se
instancia suelta: la emiten las tres, y por eso no pueden divergir.

| | Regla |
|---|---|
| **1** | **Obligatorio.** (R102, v1.77.0) **La fila mide lo que mide un `.campo` y no crece nunca.** Medido en el catálogo con el navegador: un `.campo` da **36,45 px** —13 px de texto con **18,85** de interlínea real, más 8+8 de relleno y 1+1 de borde— y la fila se fija en **36**. La cifra exacta depende de la interlínea que herede el producto, así que lo que la regla garantiza no es un número: es que **la fila no crece con lo que se cargue** — con uno, con cinco y con ninguno mide lo mismo. Nada de lo que entre puede pasar de ahí: el disparador es `mini` (27,6), la miniatura 22 y el adjunto 27. Antes la carga de imagen pintaba una caja de **96**, la de PDF apilaba la lista **encima** del botón y la de ID ponía miniaturas de **48**: las tres rompían la rejilla del formulario, cada una a su manera. |
| **2** | **Obligatorio.** (R102, v1.77.0) **Lo cargado va AL COSTADO del disparador**, en la misma línea — nunca encima ni debajo. Es lo que hace que la fila no se mueva al añadir o quitar: el mando de cargar y lo que ya hay se leen de una vez y ocupan el mismo alto con uno, con cinco y con ninguno. |
| **3** | **Obligatorio.** (R102, v1.77.0) **Lo que no cabe se cuenta, no se envuelve.** Se pintan tres adjuntos y el resto va en un contador `+N`. Envolver en dos renglones vuelve a romper la estática, solo que hacia abajo; y una tira que se saliera por el borde no diría cuánto falta. Lo contado sigue alcanzable donde se administra: el panel, o el propio disparador. |
| **4** | **Obligatorio.** (R102, v1.77.0) **El nombre del archivo se recorta; la extensión, jamás.** Cortar `boleta-…-2026.pdf` por el final se lleva justo el dato que dice qué es el archivo. El corte es por el último punto, y solo si no es el primer carácter: `.gitignore` no tiene extensión, tiene nombre. |
| **5** | **Obligatorio.** (R102, v1.77.0) **La miniatura no sirve para reconocer**, sirve para saber que hay algo puesto y cuál de los dos es: a 22 px no se lee un documento. Reconocerlo es trabajo del visor, que se abre pulsándola — y entonces la miniatura **es un botón**, no una imagen con `onClick`, así que se alcanza con el tabulador y se abre con Enter. |
| **6** | **Obligatorio.** (R102, v1.77.0) **El comportamiento no cambió con la forma.** Lo que cada carga comprueba, comprime, borronea y entrega es exactamente lo de antes: R102 solo cambia cómo se presenta al empezar y qué forma tiene el resultado. Ninguna regla de las tres secciones siguientes se toca. |
| **7** | **Obligatorio.** (R102, v1.78.0) **El rótulo va DENTRO de la fila**, no encima: rótulo, disparador y lo cargado en **un solo renglón**. Lo pidió el responsable —«Foto del trabajador · Cambiar foto · Foto del trabajador, todo en una sola línea»—. Es la excepción declarada a la regla del formulario (la etiqueta va encima del campo) y se sostiene porque aquí el rótulo no encabeza una caja de escribir, encabeza un mando: el mismo trato que ya reciben el filtro de la barra (`.top-filtros`) y el tamaño de página de la paginación (`.pgn`). **Consecuencia declarada:** con rótulos de distinta longitud, los disparadores de dos filas seguidas no caen sobre la misma columna. |
| **8** | **Obligatorio.** (R102, v1.78.0) **Las tres cargas comparten rótulo, nota, error y vacío** — `.cx-et`, `.cx-nota`, `.cx-error`, `.cx-vacio`—, también `CargaImagen` en `caja`. Antes tenía los suyos: `.ci-et` **ni siquiera fijaba el color**, así que en un mismo formulario el rótulo de la imagen podía salir de otro tono que el del PDF y el del ID; `.ci-nota` y `.ci-error` eran declaraciones idénticas con otro nombre, y el vacío se llamaba `.ci-vacia` —hasta con otro género—. De `.ci-*` queda solo lo que de verdad es suyo: la caja, la máscara y el editor de encuadre. Dos nombres para el mismo estilo es la manera de que un día se separen. |
| **9** | Del proyecto: qué dice la nota y qué dice el estado vacío. El sistema decide dónde van y cuánto ocupan. |

---

## Carga de imagen

| | Regla |
|---|---|
| **1** | **Obligatorio.** Es la **pieza visual**: entrega el recorte cuadrado como `Blob` + URL local por `onCambio`. El recorte sale en **WebP** (calidad 0,85) para que pese menos; donde el navegador no sepa producirlo cae a PNG por especificación, así que el producto lee `blob.type` y **no asume extensión**. La subida —ruta, momento, reintentos— es del producto. |
| **2** | **Obligatorio.** El encuadre se maneja **también con teclado**: el lienzo es enfocable, las flechas mueven, y acercar/alejar son botones. Un recorte solo-ratón deja gente fuera. |
| **3** | **Obligatorio.** El editor vive en `Dialogo` con «pulsar fuera» **apagado**: un encuadre a medias no se pierde por un clic. Cancelar sí lo descarta, y elegir el mismo archivo después vuelve a abrir. |
| **4** | **Obligatorio.** La imagen **cubre siempre el cuadro**: la escala mínima es la que lo llena y el desplazamiento se acota — centrar es mover hasta el borde, no sacar la foto del marco. |
| **5** | Del proyecto: el peso y formato máximos y su validación. El componente da la ranura `error` y la `nota` para decirlos. |
| **6** | **Obligatorio.** (v1.30.0) Los **formatos son cerrados** y llevan la proporción del **hueco real**: `foto` 1:1 mostrada en círculo (y encuadrada con máscara circular — el recorte exportado sigue siendo rectangular), `logo-extendido` **212×44** (el hueco de la marca del lateral: 236 − 24 de relleno), `logo-comprimido` 1:1. El editor adopta la proporción del formato: encuadrar un logo apaisado en un cuadro cuadrado es encuadrar a ciegas. La vista previa **es** el hueco — se ve cómo va a quedar, no una aproximación. |
| **7** | **Obligatorio.** (R50, v1.44.0) **Sin foto pero con persona detrás, el hueco lo ocupa el `Avatar`**, no el texto «Sin foto»: las iniciales con su color dicen **de quién** es el hueco, y «Sin foto» no dice nada que no se sepa. Es **el mismo `Avatar` del sistema** —mismo color por identificador estable, mismas iniciales—, así que la ficha, la tabla y esta carga pintan a la misma persona igual. Se activa con la prop `persona` y **solo con `formato="foto"`**: un logo no tiene iniciales, y ponerle un avatar sería inventar una persona donde hay una institución. En cuanto llega la foto, **la foto manda**. El estado sigue anunciándose para lector de pantalla: el avatar se ve, pero no dice que la foto falte. |
| **8** | **Obligatorio.** (R50, v1.44.0) Con `presentacion="caja"`, la columna **se centra sobre su caja**: rótulo, vista previa y botón caen sobre el mismo eje. Alineados a la izquierda, los tres miden distinto y salía una escalera. |
| **9** | **Obligatorio.** (R71, v1.54.0) La **`nota` se retira cuando ya hay imagen.** Es instrucción para **elegir** un archivo —qué se sube, dónde se ve, cuánto puede pesar—, y cumplida esa función se queda debajo de cada campo lleno ocupando sitio sin decir nada nuevo. Se retira con la imagen presente, **no** con el avatar de reserva: ese significa que la foto todavía falta, y ahí la instrucción sigue haciendo falta. **No se mueve al diálogo**, aunque es lo que pide la intuición: el orden real es clic → selector de archivos → diálogo, así que una nota que viviera ahí diría «hasta 8 MB» *después* de elegir el archivo. La restricción se lee **antes** de elegir o no sirve. |
| **10** | **Obligatorio.** (R102, v1.77.0) **`presentacion` decide la forma, y desde la v1.78.0 el defecto es `fila`.** `fila` mete la carga en la fila común de las tres, que es lo que va **en un formulario**: la caja de 96 px rompía la rejilla contra los 36,45 de un campo. `caja` pinta la vista previa a tamaño real —el círculo del avatar, el hueco de 212×44 del logo— y se pide para la pantalla **dedicada** a poner esa imagen: ahí no estorba, es el punto. En la v1.77.0 salió al revés, y con eso **de las tres cargas solo dos arrancaban iguales**; el responsable lo revisó en el catálogo y decidió que la que hay que pedir es la excepción, no la regla. En `fila` no hay avatar de reserva —a 22 px unas iniciales no se leen— y la foto de una persona se ve **redonda**, como en el resto del sistema. |
| **11** | Del proyecto: **qué dice la nota, y que sea corta.** El sistema decide cuándo se ve; la redacción es de cada aplicación. Tres frases no caben debajo de una vista previa de 96px. |

---

## Tarjeta

| | Regla |
|---|---|
| **1** | **Obligatorio.** (R56, v1.49.0) La tarjeta pulsable es un **`<button>`**, y la hoja **le resetea la tipografía**: `font: inherit`, `text-align: left`, `padding: 0`, `margin: 0`. No es cosmética. Durante 48 versiones el catálogo la pintó como `<a href="#">` y el componente la emitió como `<button>`: un ancla hereda tipografía y un botón no, así que en cada producto salía con la fuente del navegador (~13,3px Arial), el texto centrado y relleno de más — y en el catálogo se veía perfecta. El catálogo pasa a enseñar el `<button>` que se entrega. |
| **2** | **Obligatorio.** (R57, v1.49.0) El **medio** va **antes del título**, no dentro del cuerpo. Es la disposición normal de una tarjeta con imagen —catálogo, galería, menú de secciones— y sin la ranura el producto tenía que reconstruir el `<article class="tn">` a mano, perdiendo con ello `tn-pulsable` y el `<button>` accesible. La ausencia de la ranura *producía* marcado propio: eso es lo que se corrige. |
| **3** | **Obligatorio.** (R57, v1.49.0) La **proporción la declara el sistema: 16:9**, no cada producto. Con imagen dentro, un recorte mal elegido deforma o corta la cara, y esa es la decisión que más caro sale repartida. La imagen **cubre** el hueco (`object-fit: cover`) en vez de deformarse. |
| **4** | **Obligatorio.** (R57, v1.49.0) `CargaImagen` gana el formato **`medio-tarjeta`**, 320×180 —16:9 exacto—, para que **las dos piezas encajen**: lo que se recorta allí entra aquí sin reencuadrar, y sale en WebP como todo lo demás. Se sale de los 318 px de los otros tres a propósito: aquí el hueco no es fijo, así que lo que tiene que casar es la proporción. |
| **5** | **Obligatorio.** (R57, v1.49.0) Al pasar el cursor sobre una tarjeta pulsable, el medio **se acerca dentro de su marco** (`scale(1.04)`), con `var(--dur-media)` y `var(--curva)` — nunca una cifra a mano. El acercamiento va **contenido**: el medio recorta, así que la tarjeta no empuja a las de al lado. Con `prefers-reduced-motion` el `transform` se apaga del todo: los tokens de duración ya caen a 0,01 ms, pero `transform` no es una duración y seguiría ocurriendo, solo que de golpe. |
| **6** | **Obligatorio.** (R57, v1.49.0) **Sin imagen no sale un agujero:** el hueco se reserva igual y se rotula, como ya hace `.ci-vacia`. Se pide con `conMedio`, y en un catálogo se pasa **siempre**: sin eso, las tarjetas sin foto salen más bajas y el borde inferior de la cuadrícula queda dentado. |
| **7** | **Obligatorio.** (R57, v1.49.0) El `alt` del medio es **vacío por omisión**: en una tarjeta la imagen ilustra lo que el título ya nombra, y con `alt` el lector lo diría dos veces. Se rellena con `medioAlt` solo cuando la imagen aporta algo que el texto no dice. |
| **8** | Del proyecto: qué imagen va en cada tarjeta, de dónde sale y cuándo se sube. |
| **9** | **Obligatorio.** (R58, v1.50.0) El **nivel del encabezado lo pone el producto** con `nivelTitulo` (2, 3 o 4), porque la jerarquía de la página la conoce él y no el sistema. La hoja **estiliza los tres igual**. Es una corrección: la hoja estilizaba `h4`, el componente emitía `h3` y el catálogo usaba `h4`, así que el título salía **sin ningún estilo** en cada producto —con el `h3` por defecto del navegador— mientras el catálogo se veía bien. Mismo origen que R56: la hoja se escribió mirando el catálogo. Ahora la hoja no elige el nivel, estiliza la ranura. |

---

## Tarjeta de acción

| | Regla |
|---|---|
| **1** | **Obligatorio.** (R59, v1.50.0) **Una sola acción, cuatro sitios donde pulsarla.** La imagen, el título, el texto y el botón llevan **al mismo sitio**. Y hay **un único control real** —el título—, cuya zona pulsable se estira sobre toda la tarjeta con `::after`. La forma directa —tres `<button>` con el mismo `onClick`— es la mala: son **tres paradas de tabulador y tres anuncios para una sola acción**, y en una cuadrícula de veinte tarjetas, sesenta paradas para veinte destinos. |
| **2** | **Obligatorio.** (R59, v1.50.0) El **botón del pie es la señal de la acción, no un control aparte**: va `aria-hidden` y fuera del tabulador, y el clic lo recoge la zona que tiene debajo. Se ve y se pulsa como un botón; lo que no hace es duplicar la parada de tabulador. |
| **3** | **Obligatorio.** (R59, v1.50.0) El **anillo de foco rodea la tarjeta entera**, no las dos palabras del título: lo que se activa con Enter es la tarjeta, y el foco tiene que decir eso. Se hace sobre el `::after`, nunca apagando el contorno. |
| **4** | **Obligatorio.** (R59, v1.50.0) **Por omisión no se puede editar.** El producto la manda editable cuando toca. Y **bloquear la edición no apaga la navegación**: en solo lectura se sigue entrando igual — lo único que desaparece es poder cambiar la foto. |
| **5** | **Obligatorio.** (R59, v1.50.0) Cuando sí se puede editar, el control de la foto va **por encima** de la zona pulsable (`z-index`), porque es **la única acción de la tarjeta que no es _la_ acción de la tarjeta**. Sin eso, el `::after` se lo come y cambiar la foto abriría la página. No sale si falta `onEditarFoto`: un botón que no hace nada es peor que no tenerlo. |
| **6** | Del proyecto: a dónde lleva la acción, qué imagen va en cada tarjeta y cuándo se puede editar. |
| **7** | **Obligatorio.** (R61, v1.51.0) La **disposición en cuadrícula se entrega**: clase `tn-cuadricula`, columnas de 230 px mínimo y 12 px de separación, con `min-width: 0` en los hijos para que un título largo no estire su columna. Estaba resuelta en el catálogo y **no viajaba** —se llamaba `.tn-rejilla`, y el extractor trata como andamiaje toda clase acabada en `-rejilla`—, así que cada producto la rehacía. Es `auto-fill` y no `auto-fit` a propósito: con `auto-fit`, dos tarjetas sueltas se estiran a media pantalla cada una. |

---

## Carga de documento de identidad

| | Regla |
|---|---|
| **1** | **Obligatorio.** (R51, v1.45.0) El marco de encuadre lleva la **proporción real del documento**: tarjeta **ID-1** (ISO/IEC 7810), **85,60 × 53,98 mm** → 1,5858:1. El editor mide 428×270 px (1,5852:1). Encuadrar un carné en un cuadrado es encuadrar a ciegas — la misma razón por la que `CargaImagen` cerró sus tres formatos. |
| **2** | **Obligatorio.** (R51, v1.45.0) **Primero el anverso, después el reverso, en el MISMO diálogo.** Grabado el anverso, el diálogo pide el reverso sin cerrarse: son dos caras de un trámite, no dos trámites. Al grabar el reverso se cierra. |
| **3** | **Obligatorio.** (R51, v1.45.0) Hasta que el reverso está grabado, el anverso es un **borrador**: `onCambio` se dispara **una sola vez y con las dos caras**. Cancelar a mitad lo tira. Un anverso suelto en el expediente es un documento a medias que nadie pidió — la misma regla que `CargaPdf` (R46). |
| **4** | **Obligatorio.** (R51, v1.45.0) Entregadas las dos caras, **el botón se desactiva**. Volver a subir **se autoriza desde atrás**: el producto baja `bloqueado` cuando su back se lo indica. Un documento de identidad ya entregado no se reemplaza porque a alguien se le ocurra. |
| **5** | **Obligatorio.** (R51, v1.45.0) Las miniaturas van **al costado del botón** —desde v1.77.0 a 35×22, que conserva la ID-1 (1,5909 contra 1,5858) y cabe en la fila; medían 76×48 y una fila de 48 entre campos de 36 rompía la rejilla (R102)— y son **botones**, no imágenes con `onClick`: se alcanzan con el tabulador y se abren con Enter. Pulsar una la abre en grande; al cerrar el visor, **el foco vuelve a la miniatura pulsada**. |
| **6** | **Obligatorio.** (R51, v1.45.0) El encuadre es **el mismo `EditorEncuadre` que usa `CargaImagen`** — arrastrar, acercar, flechas, acotado y salida en WebP—, extraído allí al necesitarse dos veces. Aquí no hay ni un lienzo propio: dos editores parecidos acaban con el defecto arreglado en uno solo. |
| **7** | Del proyecto: el peso y formato máximos, la subida y la custodia del dato. El componente da `error` y `nota` para decirlos. |

---

## Carga de PDF

| | Regla |
|---|---|
| **1** | **Obligatorio.** (R43, v1.39.0) **Solo PDF, y se comprueba en los bytes.** El `accept` del navegador filtra el diálogo de archivos y nada más: arrastrando entra cualquier cosa, y un `.docx` renombrado a `.pdf` se cuela. Se leen los primeros bytes y se exige `%PDF-`. |
| **2** | **Obligatorio.** (R43, v1.39.0) **El peso máximo se mide DESPUÉS de comprimir.** Al revés se rechazan archivos que sí habrían cabido, y la persona ve «pesa demasiado» en algo que el sistema mismo podía arreglar. |
| **3** | **Obligatorio.** (R43, v1.39.0) **Si no se gana peso, viaja el original.** El compresor nunca devuelve algo más grande, nunca devuelve algo que no sepa volver a leer —relee su propia salida y exige el mismo número de páginas— y **nunca toca un PDF cifrado**: lo devuelve intacto con su `motivo`. |
| **4** | **Obligatorio.** (R43, v1.39.0) **Soltar es un atajo de ratón**, así que el control accesible es el `Boton`: la zona no se tabula y el `input[type=file]` va fuera del tabulador. Un gesto de ratón no puede ser la única forma de hacer algo. |
| **5** | **Obligatorio.** (R43, v1.39.0) **Dos archivos a la vez se rechazan** en vez de coger el primero: en silencio, quien soltó tres se queda creyendo que subió tres. |
| **6** | **Obligatorio.** (R43, v1.39.0) Los dos pesos viajan **siempre** en `onCambio`, pero **no se pintan por defecto** (`mostrarPesos`). A quien sube un acta no le importa cuánto adelgazó, le importa que se subió; en el catálogo sí se pintan, porque ahí la cifra es la demostración de que la compresión ocurre. |
| **7** | **Obligatorio.** (R46, v1.40.0) **En un formulario el componente es UN BOTÓN**, y el recuadro de soltar vive en un panel que se despliega **en su sitio**, empujando hacia abajo lo que venga después. **Nunca una ventana flotante**: lo fijó el responsable —«nosotros no trabajamos con pop up»— y además un recuadro de 100px entre dos campos de 34px rompe la rejilla del formulario. Al cerrar, todo vuelve a su sitio con la información puesta. `presentacion="en-linea"` deja el recuadro a la vista, para una pantalla dedicada a subir. |
| **8** | **Obligatorio.** (R46, v1.40.0) Con el panel abierto la elección es un **borrador**: `onCambio` **no** se dispara al elegir, sino **al Grabar**. Si emitiera al elegir, cancelar dejaría el formulario ya cambiado. Y volver a abrir **arranca de lo ya guardado**, no en blanco: empezar vacío haría creer que se perdió. **En modo controlado esto no se cumple** — ver la regla 13. |
| **9** | **Obligatorio.** (R46, v1.40.0) El panel lleva **exactamente dos botones**, y el disparador de fuera queda **apagado** mientras está abierto — hasta la v1.76.0 se retiraba, y con él se iba el ancla de la fila (R102); lo que hace el panel no cambia. **«Subir» está siempre**: es lo que trae el archivo. **El segundo muta**: «Cancelar» —terciario, plano— mientras no hay contenido válido o hay error; «Grabar» —principal, macizo— en cuanto lo hay. Lo decidió el responsable con el riesgo delante: un botón que cambia de significado puede confirmar cuando se iba a descartar. Se amortigua haciendo que los dos estados **no se parezcan**, para que el cambio se vea y no solo se lea. **Consecuencia declarada:** con un PDF válido puesto ya no hay «Cancelar»; salir sin guardar son dos pasos —quitar el archivo con el tachito, y entonces el botón vuelve a ser «Cancelar»—. |
| **10** | **Obligatorio.** (R46, v1.40.0) El panel **se monta y se desmonta**, no se colapsa con CSS. Colapsado a altura cero seguiría en el árbol de accesibilidad con sus botones alcanzables por el tabulador — el defecto que el candado `OCULTABLE` encontró en `.cf-banda`. |
| **11** | **Obligatorio.** (R45, v1.40.0) `maximoArchivos` fija cuántos caben: 1 —lo normal, y elegir otro **sustituye**—, N, o `'sin-limite'`. Si se sueltan más de los que caben **se rechazan todos**, no se cogen los que quepan en silencio: quien soltó cinco se quedaría creyendo que subió cinco. El tachito va **en la línea del nombre** y lleva el nombre en su rótulo accesible. |
| **12** | Del proyecto: a dónde se sube, el peso máximo, cuántos archivos, y si se apaga la compresión —un PDF **firmado** hay que dejarlo intacto o la firma deja de validar. |
| **13** | **PENDIENTE.** (v1.77.0) **En modo controlado, el borrador arranca vacío** aunque `valor` traiga archivos, y por eso la regla 8 —«volver a abrir arranca de lo ya guardado»— **solo se cumple en modo no controlado**. La causa no es un descuido: `valor` es `{nombre, peso}[]` y el borrador necesita `PdfListo`, con su `File` dentro; el componente **no tiene los archivos del producto** y no puede reconstruirlos. Con `maximoArchivos: 1` no hay daño —elegir otro sustituye, que es lo documentado—, pero **con más de uno, grabar emite solo lo recién elegido y el producto pierde lo que ya tenía**. Se declara en vez de fingir que no pasa: cerrarlo pide decidir la forma de `valor` —que cargue el `File`, o que el quitar se haga solo por `onQuitar`—, y eso es una decisión de API, no del componente. Lo encontró la revisión de R102 y **es anterior a ella** (v1.40.0). |

## Editor de texto con huecos

**La pieza no es un editor: es la garantía.** `AreaTexto` es texto plano; esto
es lo que hace falta cuando el texto **viaja a otro formato** —un PDF, una
impresora, un correo— y por el camino hay un saneador que admite muchísimo menos
de lo que un editor de navegador emite. Lo dijo quien lo pidió mejor que
nosotros: *«lo que el editor ofrece de más se guarda sin error y desaparece en
el destino»*.

> **De dónde sale este contrato, porque no está archivado.** El R119 del equipo
> llegó **por el chat**, no como archivo: en `peticiones/` no hay ningún
> `*R119*`, y la única constancia escrita es la fila «parado por vuestra
> prioridad» del informe de la v1.107.0. Lo que el equipo pidió está
> **transcrito en esta tabla** —las tres listas de entrada, la invariante de
> salida, las siete etiquetas, los cuatro huecos y el tope de 2500—, y ésta es
> la fuente. Se dice porque una cita sin fuente archivada se lee como si la
> tuviera.

<!-- pruebas: sanear.test.ts, EditorTexto.test.tsx -->

| | Regla |
|---|---|
| **1** | **Obligatorio.** (R119 del equipo, v1.111.0) **LA INVARIANTE, que es todo el valor de la pieza:** lo que llega a `onCambio` **siempre** está dentro de `etiquetas` y `huecos` — **y lo que ENTRA por `valor` también se sanea**, que la primera versión no hacía: un valor guardado por otra versión, por otro editor o a mano se metía crudo en la caja, y en un navegador de verdad un `<img onerror>` **se ejecuta** al asignar `innerHTML`. La garantía tiene un solo sentido si solo cubre la salida — venga de teclear, de pegar, de arrastrar o de deshacer. Si eso se cumple, el mismo componente sirve para un memorándum de 2 500 caracteres, para una carta de diez páginas, para el cuerpo de un correo o para una plantilla de SMS. Si no se cumple, **no sirve para ninguno**: cada producto tendría que volver a sanear lo que el editor le entrega. |
| **1c** | **Obligatorio.** (R119 del equipo, v1.112.0) **Lo saneado vuelve IDÉNTICO de un `innerHTML`, y el cursor sobrevive a una reescritura.** No es cosmética: el editor decide si reescribe la caja comparando lo que sanea con lo que `innerHTML` le devuelve, y **reasignar `innerHTML` destruye todos los nodos y con ellos la selección**. Si los dos serializadores difieren en **un solo carácter**, la respuesta es «cambió» siempre, la caja se reescribe en cada tecla y el cursor vuelve al principio: **no se puede escribir de corrido**. Eso se publicó. El espacio duro salía crudo y `innerHTML` lo devuelve como `&nbsp;` — y el navegador mete uno **cada vez que se teclea un espacio al final**. Lo reportó el responsable el 2026-09-14 con la v1.111.0 en producción, y **ninguna de las 49 pruebas lo vio, porque todas escribían el HTML a mano y a mano nadie escribe un espacio duro: lo pone el navegador.** Se cierra por los dos lados: se escapan los **cuatro** caracteres de la norma de serialización —`&`, `<`, `>` y U+00A0—, y cuando la reescritura hace falta de verdad **el cursor se conserva**, contado en caracteres de texto. Así una quinta diferencia futura costaría una posición de cursor por un instante, no el componente. **Y la posición se resuelve hacia el nodo SIGUIENTE cuando cae justo en una frontera**: con la regla contraria, pulsar Intro y escribir metía la letra **en la línea de arriba** y la nueva se quedaba vacía — el flujo por omisión de Chrome, cuyo Intro deja un `<div><br></div>` que el saneador desenvuelve, y desenvolver es reescribir. Lo cazó una auditoría sobre el arreglo del primer defecto, el mismo día. **Verificado tecleando en Chrome**, no solo en jsdom: escribir de corrido, Intro, negrita y botón de hueco. |
| **2** | **Obligatorio.** (R119 del equipo, v1.111.0) **Las tres listas entran desde FUERA** —`etiquetas`, `huecos`, `maximo`— y no es configurabilidad por gusto. Tres motivos, los tres vividos por quien lo pidió: la lista **cambia sin que este sistema publique** —retiraron tres huecos un martes porque salían impresos como «[falta jornada]»—; **cada producto admite cosas distintas** —uno no tiene cursiva porque su destino embebe dos fuentes—; y el componente **no debe saber qué hay al otro lado**, ni PDF ni impresora ni correo, solo el conjunto que le dan. |
| **3** | **Obligatorio.** (R119 del equipo, v1.111.0) **La barra se dibuja DESDE `etiquetas`**, no es un juego fijo con botones apagados. El motivo es de fondo: **una etiqueta que el destino IGNORA es peor que una que rechaza**. Rechazada, quien escribe se entera; ignorada, guarda sin error y lo descubre **cuando ya firmó el papel**. Un botón apagado promete que algún día valdrá. El icono `cursiva` existe en el sistema y aun así no sale si `em` no está en la lista. |
| **4** | **Obligatorio.** (R119 del equipo, v1.111.0) **Cero atributos, siempre**, ni en las etiquetas permitidas: ni `class`, ni `style`, ni `id`, ni `data-*`. **No es la rareza de un producto**: es lo que pasa siempre que el HTML se **traduce** a otro formato en vez de renderizarse. Un atributo no significa nada para quien dibuja un PDF, y admitirlo solo sirve para que alguien lo escriba y no pase nada. |
| **5** | **Obligatorio.** (R119 del equipo, v1.111.0) **Se quita la etiqueta y se CONSERVA el contenido.** Quien pega desde Word trae cada párrafo envuelto en tres `<span>`: tirar el contenido con ellos dejaría el documento vacío, que es peor que perder el formato. **Las dos excepciones son `script` y `style`**, que se van con lo suyo. |
| **6** | **Obligatorio.** (R119 del equipo, v1.111.0) **Se sanea recorriendo el DOM, no con expresiones sobre el texto.** Un troceador por texto se engaña con `<p title="<strong>">`, con los comentarios condicionales de Word y con cualquier `<` dentro de un atributo. El navegador ya sabe parsear HTML; lo que no sabe es qué hay que tirar. |
| **7** | **Obligatorio.** (R119 del equipo, v1.111.0) **Los huecos son `{{nombre}}`, texto literal**, con la expresión `/\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g`: se admite espacio dentro y **distingue mayúsculas**. Lo guardado es el texto, **no un marcado propio** — un `<span data-hueco>` se rechazaría por el atributo (regla 4) y además **ata el documento al editor que lo escribió**; el texto literal lo lee cualquier motor de plantillas, hoy y dentro de cinco años. |
| **8** | **Obligatorio.** (R119 del equipo, v1.111.0) **Un hueco desconocido se RETIRA, y se dice cuál era. Y el aviso NO SE BORRA SOLO.** Esto último costó dos rondas: el aviso lo ponía un camino y lo borraba el siguiente paso que no retirara nada — y esos pasos llegan siempre, porque el navegador despacha un `input` **después** de `execCommand`, y pulsar un botón de la barra desenfoca la caja antes. **El gesto natural de reaccionar al aviso lo destruía.** Ahora el aviso recuerda **de qué contenido habla**, y un paso que no retira nada solo lo calla si el contenido ya no es aquél. La invariante no admite que salga: el destino lo rechazaría y quien escribe perdería el documento al guardar. Y no se quita en silencio — **quitar en silencio es lo que hace el destino**, y es justo lo que esta pieza viene a evitar. |
| **9** | **Obligatorio.** (R119 del equipo, v1.111.0) **Pegar se limpia EN EL MOMENTO, no al guardar**, y es la función más valiosa de la pieza: es el camino por el que de verdad entra el contenido. Quien redacta lo tiene en Word, en Docs o en un correo, y lo que llega trae `<span style>`, `<o:p>`, `<font>`, clases y comentarios condicionales. Al guardar, quien escribe **pierde lo pegado en el peor momento posible**. |
| **10** | **Obligatorio.** (R119 del equipo, v1.111.0) **El tope cuenta el HTML, no el texto visible**, porque es lo que mide el saneador del otro lado. Un texto que se ve corto puede pasarse de largo por las etiquetas, y contando lo visible **se avisa tarde**. |
| **11** | **Obligatorio.** (R119 del equipo, v1.111.0) **El saneo es IDEMPOTENTE**, y se llega al punto fijo **a nivel de documento**, no solo de texto. Dos defectos, los dos medidos: borrar un hueco desconocido **fabricaba otro** juntando las llaves de los lados —`{{ {{documento}}sede}}` → `{{ sede}}` → `{{sede}}`—, así que el documento guardado **cambiaba solo** entre sesiones. Y peor: cada nodo de texto se sanea por separado, así que un hueco **partido por una etiqueta que se desenvuelve** nunca se veía como hueco y **aparecía entero en la salida** —`{{doc<b>umento</b>}}` con `b` fuera de la lista daba `{{documento}}`, y `huecosFuera` salía **vacío**, así que ni se podía decir—. Era el único camino por el que la garantía se rompía de verdad, y sobrevivió a 43 pruebas en verde. **El tope de vueltas sale del contenido**, no de un número a ojo: cada vuelta que cambia algo retira contenido, así que converger está garantizado; un tope fijo entregaba algo inestable, y sin avisar, en cuanto alguien anidaba más capas. **Y el motivo que esta regla daba era falso:** decía «sin eso el editor entra en bucle», y asignar `innerHTML` **no dispara `input`**. |
| **11b** | **Obligatorio.** (R119 del equipo, v1.111.0) **Lo que emite el navegador se TRADUCE, no se añade a la lista.** `execCommand('bold')` emite `<b>` y la lista blanca tiene `strong`: el saneador lo desenvolvía, **el botón «Negrita» no ponía negrita**, y el aviso decía «se quitó el formato que no se admite (b)» — el componente **acusaba de meter un formato prohibido a quien había pulsado su propio botón**. Es el modo de fallo que esta pieza existe para impedir, reproducido dentro de ella. Se normaliza **antes** de mirar la lista —`b`→`strong`, `i`→`em`, `strike`/`del`→`s`, `ins`→`u`— y el argumento es del equipo: **la lista blanca es el contrato**, y `<b>` es un detalle de implementación de `execCommand`, que está obsoleto y puede cambiar de salida sin avisar. **La lista sigue mandando**: sin `strong`, un `<b>` se va igual. Y el aviso nombra lo que se escribió, no su traducción. |
| **12** | **Obligatorio.** (R119 del equipo, v1.111.0) **La ficha es INDIVISIBLE:** un `{{trabajador}}` es una cosa, no trece caracteres. Un Retroceso al lado se lleva el hueco entero, nunca `{{trabajado}}`; Suprimir hace lo mismo por el otro lado; y si el cursor acaba dentro —pegando, o con el ratón— el borrado tampoco lo parte. Si se pudiera partir, el guardado falla y quien escribe no entiende por qué: **en la pantalla ve una ficha con el nombre puesto**. La primera versión de este componente **lo afirmó en tres sitios sin construir nada**, y lo cazó una auditoría. Se escucha `beforeinput` **nativo** y no `keydown` ni el `onBeforeInput` de React —que React 18 **no conecta** al del navegador—, y eso cubre también el gesto del teléfono y lo que mande un lector. **Se interceptan el carácter y la palabra, y NO la línea:** un borrado de línea se lleva la línea entera, huecos incluidos, así que no puede partir una ficha — y meterlo en el mismo saco **rompía el borrado de línea**, que dejaba `Hola ` donde se pedía vaciar. **Lo que NO cubre, dicho:** el corte y el arrastre (`deleteByCut`, `deleteByDrag`) llevan un rango y no un cursor, y un hueco repartido entre dos nodos de texto no lo ve la decisión, que mira uno solo. En los dos casos **la invariante sigue en pie** —lo que quede es texto plano y se entrega tal cual—; lo que se pierde es comodidad. |
| **13** | **Obligatorio.** (R119 del equipo, v1.111.0) **No se pinta lo que el destino no puede prometer.** Un `h3` sale aquí **en negrita y del mismo cuerpo**, no a 24 px: este editor enseña **estructura**, no apariencia final — la apariencia final la decide un destino que el componente no conoce. Pintar una jerarquía que el papel no tiene es la misma mentira que ofrecer una etiqueta que el destino ignora. |
| **14** | **Obligatorio.** (R119 del equipo, v1.111.0) **La caja tiene NOMBRE ACCESIBLE propio**, con `aria-label`. Un `<label for>` **no nombra** a un elemento que no es etiquetable, y `div[role=textbox]` no lo es: HTML-AAM no calcula el nombre por ahí. `Campo` ata el rótulo con `htmlFor`, que sirve para llevar el foco al pulsar y **no** para el nombre. Sin esto la caja salía **sin nombre**: medido, cero coincidencias buscando el `textbox` por su rótulo. Este sistema ya lo tenía escrito **dos veces** —en `Interruptor` y en `RangoFecha`— y aun así se incumplió, que es el motivo de que ahora sea regla y no comentario. |
| **15** | **Obligatorio.** (R119 del equipo, v1.111.0) **La barra es un `toolbar` DE VERDAD: una sola parada de tabulador y las flechas recorren.** El `role` es un atributo; el patrón lo implementa quien lo escribe, y la primera versión puso el atributo y **ninguna de las dos cosas**: los botones eran paradas de tabulador una a una, y la configuración del catálogo —cuatro etiquetas con control más cuatro huecos— eran **ocho tabulaciones antes de llegar al texto**. Flecha izquierda y derecha recorren dando la vuelta, `Home` y `End` van a los extremos, y el `tabindex` viaja con el foco. Con **cero** mandos la barra no se pinta: un `toolbar` vacío con nombre es ruido para el lector. |
| **16** | **Obligatorio.** (R119 del equipo, v1.111.0) **Se puede renderizar en SERVIDOR.** `DOMParser` no existe en Node y el saneo corría en el render, así que un producto con renderizado de servidor —Next, Remix— moría con `ReferenceError: DOMParser is not defined` y **la página entera no se pintaba**. Ninguna prueba podía verlo: jsdom **sí** tiene `DOMParser`. Lo cierra una regla entera y no un parche — **nada que dependa del contenido de la caja se pinta hasta que la caja existe**: el texto ya era así (lo escribe un efecto por `innerHTML`, no React), y ahora el contador y la lista de huecos también. El servidor y el primer render del cliente emiten lo mismo, que es lo que evita el desfase de hidratación; **el contador aparece al montar**, y eso es el precio. |
| **17** | Del proyecto: **qué admite su destino**. Las tres listas son suyas, y el componente no opina. |

**Seis huecos declarados.**

1. **Lo que no existe en jsdom**: `contenteditable`, la selección y
   `execCommand`. **Y quitar la demostración viva del catálogo tuvo un coste**:
   era un `contenteditable` sin saneador —mentía— pero era el único sitio donde
   pulsar «Negrita» habría enseñado que no hacía nada. Lo ocupa ahora la tabla
   de la regla 11b, que encierra lo que cada comando emite **en un navegador
   real**, medido por el equipo; es mejor, porque corre sola. Por eso lo que se
   prueba a conciencia son las **dos funciones puras** —el saneador y la
   decisión de qué borra un Retroceso, 49 pruebas— y del componente se prueba lo
   que no depende del navegador. **Lo sin probar es el `execCommand` real**, no
   la costura del rango: ésa sí tiene prueba —se monta un `Range` de verdad
   sobre el nodo de texto, se fija con `getSelection`, se despacha un
   `beforeinput` nativo y se comprueba que la ficha se fue entera—. La
   declaración anterior era **más pesimista que la realidad**, y una declaración
   falsa por abajo también es falsa.
2. **`document.execCommand` está obsoleto** en la norma y sigue siendo la única
   forma de hacer esto sin librería. El día que un navegador lo retire, esta
   pieza necesita una versión mayor. Se dice ahora en vez de descubrirlo
   entonces.
3. **`etiquetas` sin `br` deja Intro inservible, y el componente no avisa.** Todo
   navegador rellena una línea vacía con un `<br>`; si `br` no está en la lista,
   el saneador se lo lleva y queda un `<p></p>` **sin altura**, inalcanzable. Y
   sin `p` ni `br` —plausible para un destino muy cerrado— Intro no hace nada en
   absoluto. Quien configure la lista tiene que incluir `br` si quiere párrafos.
4. **Escribir DENTRO de un `{{hueco}}` lo borra entero.** Una sola tecla en medio
   convierte `{{sede}}` en `{{seXde}}`, que ya no es un hueco conocido, así que
   se retira con todo su texto. **Se avisa** —«Del texto, el hueco {{seXde}},
   que no existe»— y es el contrato funcionando, pero `tramoDeHueco` protege el
   **borrado** y no la escritura. Se dice para que nadie lo descubra guardando.
5. **Un padre que devuelve un `valor` viejo revierte lo tecleado.** Es la regla
   «el valor MANDA» y con un `debounce` correcto no pasa; con uno ingenuo —un
   temporizador por pulsación sin cancelar el anterior— sí. No hay guarda.
6. **Pegar un documento muy grande bloquea el hilo, varios segundos.** Medido:
   4,30 MB de HTML **sucio de Word** —`<p class="MsoNormal" style>`,
   `<span style>`, `<o:p>`— tardan **3,0 s** (3,02 / 2,88 / 3,03 en tres
   pasadas), síncrono y sin tope.

   **Y la cifra depende tanto del contenido que dar una sola es engañoso.** Una
   auditoría repitió la medida el 2026-09-13 con **otro** corpus de Word y midió
   2,7 s; con HTML ya limpio del mismo tamaño, su medida y la nuestra **no
   coinciden ni en el orden** —el saneo recorre hasta el punto fijo, y el sucio
   encoge en la primera vuelta mientras el limpio se recorre entero—. La cifra
   que este apartado traía antes, **2,3 s**, es anterior y **no dejó escrito con
   qué se midió**, así que no se puede comparar con ninguna de las tres: se dice
   en vez de inventarle una explicación. Lo que sostienen las tres mediciones es
   lo único que aquí importa: **un documento de ese tamaño bloquea el hilo
   segundos**.

   La medida es con `jsdom` **dentro del contenedor**, que no es un navegador: en
   uno real será otra, y **ahí no se ha medido**. `maximo` avisa **después**, no
   impide. Si algún producto pega documentos de ese tamaño, hace falta trocear el
   saneo — y entonces deja de ser una función pura, que es lo que hoy la hace
   demostrable.

---

## Área de texto

| | Regla |
|---|---|
| **1** | **Obligatorio.** (R44, v1.39.0) El envoltorio **es** `Campo`, no se le parece: rótulo obligatorio y siempre visible, ayuda, error y los `aria-describedby` que los enlazan salen de su ranura de contenido propio. |
| **2** | **Obligatorio.** (R44, v1.39.0) **El límite es blando.** `maxlength` corta al pegar, en silencio y sin deshacer. Aquí el texto entra entero, el campo se marca inválido y se dice cuánto sobra. **Bloquear el envío es del producto**, que es quien sabe si ese texto se puede guardar a medias. |
| **3** | **Obligatorio.** (R44, v1.39.0) **Crece con lo escrito** hasta un tope, y a partir de ahí se desplaza. Se hace **con CSS** —copia invisible del texto en `::after` sobre la misma celda de rejilla—, no escribiendo la altura desde JavaScript: eso exigiría el atributo `style`, que el candado prohíbe (§2.5.6). |
| **4** | **Obligatorio.** (R44, v1.39.0) El contador está **siempre** en el `aria-describedby` —se lee al entrar al campo— pero la **región viva solo habla en los últimos 20 caracteres y al pasarse**. Un contador que dicta un número por cada tecla no informa: tapa lo que se escribe. |
| **5** | **Obligatorio.** (R44, v1.39.0) **Recorta al salir**, como `Campo` y por lo mismo —el copy-paste con cola—, y **solo los extremos**: los saltos de línea de dentro son el texto, no basura. |
| **6** | Del proyecto: `filas` de arranque, el `maximo`, y si el campo debe medir lo mismo que sus vecinos (`autoCrecer` apagado). |

---

## Marco de aplicación

<!-- pruebas: MarcoApp.test.tsx -->

| | Regla |
|---|---|
| **1** | **Obligatorio.** El marco **envuelve a la aplicación entera** —el enrutador vive DENTRO de su zona de contenido—, no se monta uno por página. Montado por página, cada navegación crea un marco nuevo y **el plegado del lateral se olvida**: el usuario lo pliega, elige una opción y lo encuentra desplegado sin haberlo pedido. El estado interno de React no sobrevive al remontaje, y no debe: la corrección es dónde se monta, no un parche de persistencia. |
| **2** | Del proyecto: si el plegado debe **recordarse entre sesiones**, se controla con las props `plegado`/`onPlegar` y se guarda donde diga la regla transversal 5 — en el perfil, no en el navegador. |
| **3** | **Obligatorio.** (R39, v1.33.0) En la banda del cajón (≤700px) el velo **existe de verdad** —oscurece, cubre y se puede pulsar— y pulsarlo pliega: es la salida con el ratón, porque el botón de plegar queda debajo del propio cajón. Y al **cruzar** de ancho a angosto el marco **se pliega solo**, avisando por `onPlegar`: un cajón que nadie abrió no se queda plantado sobre el contenido. |
| **4** | **Obligatorio.** (R38a, v1.34.0) La banda del **riel** (≤900px) es **estado, no CSS forzado**: al cruzarla el marco se pliega de verdad — la clase, el `aria-expanded` y el logo compacto de `MarcaMenu` salen del mismo estado. Quien quiera re-desplegar a ese ancho, puede: los 236px caben en línea. La hoja pinta estados; no los impone a espaldas del componente. |
| **5** | **Obligatorio.** (R47, v1.41.3) **Plegado, el panel flotante se cierra CON MARGEN**: 220 ms desde que el cursor sale del grupo, y volver a entrar dentro de ese margen lo cancela. No es un adorno: el panel nace al otro lado del carril y el cursor tiene que **cruzar sus 56 px** para alcanzarlo — cerrando en seco desaparece por el camino y no hay forma de elegir nada. El catálogo lo llevaba desde el principio; la entrega cerraba al instante. Y **con teclado abre al enfocar dentro**: sin ratón, el panel era inalcanzable. |
| **6** | **Obligatorio.** (R42a, v1.38.0) La navegación llega al **tercer nivel**: una `OpcionNav` con `hijos` se dibuja como **rama plegable** (`aria-expanded`, chevron), no como enlace. Las ramas arrancan **cerradas** —doce ítems seguidos no se leen— salvo la que contiene a la opción activa: llegar a una pantalla y no ver dónde estás en el menú es peor que un clic de más. |
| **8** | **Obligatorio.** (v1.114.0) **El carril plegado NO es una fila de iconos mudos.** Plegado, `.nav-txt` no se ve y el `<svg>` va `aria-hidden`, así que una opción **sin hijos** se quedaba **sin rótulo de ninguna clase** —ni visual ni para un lector— y tampoco abre panel flotante, que es lo que identifica a las que sí los tienen. Se cierra por los dos lados: cada elemento de navegación emite **`title`** con su texto —el globito del ratón, que es como el catálogo lo prometía desde siempre— y el rótulo, en vez de borrarse con `display:none`, se **esconde a la vista** con el tratamiento de `.sr-solo` —ocho de sus nueve declaraciones; sobra `border: 0`, que un `<span>` no necesita—, de modo que **sigue en el árbol de accesibilidad**. Dentro del panel flotante vuelve entero, y hay que deshacer **siete de las ocho** declaraciones y no solo el `display`: una regla más específica solo gana en lo que declara. (`padding: 0` se queda, y es inocuo: `.nav-txt` no tiene relleno propio.) **El componente no emitía ni un solo `title`**: la promesa se quedaba en la demostración, y lo midió el responsable pasando el ratón el 2026-09-14. |
| **9** | **Obligatorio.** (v1.117.0) **UN MENÚ CORTO QUE ENSEÑA DÓNDE ESTÁS.** Desplegado, los grupos llegan **plegados**; solo está abierto el de la pantalla en curso, que además lleva **`.fijo`** y su título en el color de acento. **`.fijo` es «el grupo retenido abierto», no «dónde estoy»** — las dos cosas coinciden al llegar y después de elegir una opción, pero **pulsar el título de otro grupo mueve la retención** sin cambiar de pantalla, y entonces el acento del título se va con ella. Quien pregunte por la pantalla en curso tiene `aria-current="page"` y `.nav-item.activo`, que **no** se mueven; ésa es la señal que no miente. Se dice porque la redacción anterior decía «el de la pantalla en curso» a secas y con eso el nombre prometía más de lo que hace. **El cursor revela cualquier otro** mientras esté encima, con el mismo margen de 220 ms que el panel flotante, y al salir se pliega solo. **El cursor y el foco del teclado son DOS señalizadores independientes**, y un grupo se ve abierto si lo reclama cualquiera de los dos: el ratón está en un sitio y el foco en otro, y ninguno puede desalojar al otro. Se escribe porque el primer intento usaba **uno solo**, y con eso pasar el ratón por un grupo cerraba el panel **donde vivía el foco de alguien** — y como `.nav-hijos[hidden]` es `display:none`, el navegador expulsa ese foco al `<body>`: quien navega con teclado perdía el sitio porque otra persona movió el ratón, con `aria-expanded` diciendo `"false"` sobre el grupo donde estaba. **WCAG 2.4.3 y 4.1.2.** Lo cazó una auditoría adversaria el 2026-09-15, antes de publicar; hasta la v1.116.0 esto era un conjunto y nadie desalojaba a nadie. **El margen de 220 ms es solo del cursor**: existe porque el ratón tiene que cruzar los 56 px del carril, y el foco salta al destino sin recorrer nada. **Y soltar a mano apaga los dos revelados**, o el mando no haría nada visible con el ratón encima —ni con el foco en el propio botón, que es donde el teclado lo deja—; se vuelve a revelar saliendo y volviendo a entrar, que es lo que significa soltar. **Elegir una opción mueve el fijado**, y el anterior se pliega. El título del grupo **fija y suelta** a mano. Plegado no cambia: ahí el fijado **no** abre —si no, elegir una opción dejaría el panel flotante reabriéndose solo— y manda únicamente el cursor. Lo pidió el responsable el 2026-09-15 con el menú delante: *«mostrar un menú corto y solo donde estoy ahora»*. **Y esto resucita `.nav-grupo.fijo`**, que la hoja estilizaba desde hacía versiones y **ningún producto podía activar**: era deuda declarada en `verificar-promesa-muerta`, y era exactamente esto lo que se diseñó para hacer. El modelo no es nuevo: **es el que la barra del catálogo lleva funcionando desde el principio**, a mano. |
| **9 (derogada)** | *Vigente de la v1.114.0 a la v1.116.0.* Decía: **desplegado, el cursor NO abre los grupos; se gobiernan con el clic**, y el argumento era que *abrir cosas al pasar por encima cuando ya se lee todo es ruido*. **El argumento se apoyaba en «ya se lee todo»** —con los grupos abiertos— y al pasar a un menú corto dejó de sostenerse: con el grupo plegado, el cursor es justo lo que hace falta para mirar dentro sin perder el sitio. Se deja escrita porque el equipo consumidor la respaldó por escrito en R135 y tiene derecho a saber que cambió, y porque una regla que desaparece sin rastro obliga a redescubrir por qué se pensó lo contrario. |
| **10** | **Obligatorio.** (v1.114.0) **El `hidden` de los hijos oculta de verdad.** `.nav-hijos` declara `display: grid`, que **gana a la regla `[hidden]`** del navegador: el atributo que el componente emite **no ocultaba nada** y la apertura la hacía solo `.abierto`. **El grupo sí se cerraba** —lo cierran `grid-template-rows: 0fr` y el `visibility: hidden` de `.nav-hijos-in`—, así que el daño no era «no se cierra»: era que el atributo **mentía**, y quien se apoyara en él para ocultarlo por su cuenta no obtenía nada. La hoja lleva ahora `.nav-hijos[hidden]` **y `.nav-nietos[hidden]`**, y el componente emite el atributo en los dos niveles: sin eso, la segunda era una regla que viaja y nadie puede activar. Lo destapó `verificar-cascada` en cuanto la maqueta del catálogo empezó a emitir **grupos de verdad** en vez de enlaces con un chevron dentro — marcado que el componente **no produce nunca**. |
| **11** | **Obligatorio.** (R135a del equipo, v1.115.0) **El tercer nivel se compone como el segundo.** `.nav-nieto` era `display: block` mientras `.nav-hijo` es `flex`, así que **cualquier icono en ese nivel caía encima del rótulo** y la fila medía el doble. Control Administrativos lo midió montando *Marcaciones › Configuración* y tuvo que **quitar el icono** para que no se partiera: un menú con icono en los niveles 1 y 2 y sin él en el 3, **sin que ninguna regla dijera que así debía ser**. Ahora es `flex` con `align-items: center`. El sangrado de 56 px y el cuerpo de 12 px **no se tocan**: hacen su trabajo. El recorte con puntos suspensivos pasa al rótulo, que es quien desborda cuando la fila es flex. Es el desvío promesa/entrega de siempre: **la hoja admitía un tercer nivel que no podía llevar icono como los otros dos**. |
| **12** | **Obligatorio.** (R135b del equipo, v1.115.0) **Plegado, las ramas del panel flotante llegan ABIERTAS.** Dentro del panel, una rama cerrada **no se abría al pasar por encima** —solo el grupo lo hace—, así que el tercer nivel quedaba detrás de un clic **dentro de un panel que solo vive mientras el puntero esté encima**: un gesto delicado, y distinto del que rige en todo el resto del panel. De las tres salidas que planteó el equipo se toma ésta, y por dos motivos: el panel existe **porque ahí el rótulo no se ve**, así que se enseña todo; y anidar un segundo «abrir al pasar» dentro de un panel que se cierra al salir es una **trampa de temporización**, no una función. **Un resumen con secciones plegadas no resume.** No contradice a la regla 6: aquélla las cierra porque *doce ítems seguidos no se leen*, y eso vale para el riel **extendido**, donde el menú es una columna larga; dentro del panel de UN grupo la lista es corta. El mando sigue vivo: se pueden cerrar a mano. |
| **7** | **Obligatorio.** (R48, v1.42.0 · reescrita en v1.117.0) La apertura de los grupos sigue al plegado que **queda**, no al que se **pide**. Controlado (regla 2), el producto puede no honrar el cambio, y entonces nada debe moverse: pedir no es aplicar. **Plegar no deja el foco dentro de lo que oculta**: cerrar un grupo le pone `hidden` —`display:none`— a su panel, y el navegador tira al `<body>` el foco que hubiera dentro; si eso va a pasar, el foco se va al botón de plegar, que es la misma salida que usa Escape. Faltaba por dos puertas —la ventana cruzando los 900 px sola y el producto plegando desde fuera—, porque las otras dos ya movían el foco antes y por eso no se veía. Lo que se re-sincroniza al plegar son **los dos señalizadores, el del cursor y el del foco** —si no, queda un panel flotante atascado, abierto sin que nadie lo pidiera—; **la retención se conserva**, porque plegar es un cambio de ancho y no de sitio. Hasta la v1.116.0 aquí se reabrían **todos** los grupos al desplegar; con la regla 9 nueva vuelve **solo el retenido** — que es el de la pantalla en curso salvo que alguien haya pulsado a mano el título de otro. Aquí decía «el de la pantalla en curso» a secas, que es la misma imprecisión que la regla 9 viene a corregir, cometida una línea más abajo. |

## Reglas transversales

Estas **no son del marco**, aunque vivían pegadas a su tabla sin título propio y
el candado del contrato las daba por suyas: al declarar la sección del marco se
quedaron sin respaldo, porque sus pruebas están en `TablaDatos.test.tsx`,
`basicos.test.tsx` y `CargaImagen.test.tsx`. Una tabla sin encabezado es una
sección que no existe, y lo que no existe no se puede atar.

<!-- pruebas: TablaDatos.test.tsx, basicos.test.tsx, CargaImagen.test.tsx -->

| | Regla |
|---|---|
| **0** | **Obligatorio.** (R52, v1.46.0) **El icono de la interfaz mide 18px** — el paso «texto», que es el que `Icono` da por omisión. Es el mismo número que el `line-height` del botón, y por eso un botón mide lo mismo lleve icono o no. `control` (16px) y `etiqueta` (14px) son para huecos que ya miden eso —la paginación—, y `estado` (32px) para el hueco vacío. La entrega los pasaba a `control` en 24 sitios y el catálogo los dibuja a 18: **todo icono salía 2px más pequeño en el producto**. Ningún candado lo ve: es un atributo del `<svg>`, no una declaración de la hoja. |
| **0b** | **Obligatorio.** (R53, v1.47.0) El **grupo de campo tiene un solo aspecto**, se llame `.cg-*` o `.campo-*`: **comparten declaración en la hoja**, no son dos bloques parecidos. Habían derivado —la etiqueta perdía su color y el error perdía su icono— y por eso el selector de la entrega no se veía como el del catálogo. El **error lleva icono**: un renglón rojo suelto se confunde con una ayuda, y el color por sí solo no dice que algo falla (SC 1.4.1). |
| **0c** | **Obligatorio.** (R54, v1.48.0) **Solo lectura no es deshabilitado.** Mientras una consulta está en curso —el tipo de documento mientras se pregunta a la API—, el control va en **solo lectura**: se ve, se lee, se enfoca y **viaja con el formulario**, pero no cambia. Deshabilitado diría «esto no es para ti», se saldría del tabulador y **el navegador no lo enviaría**, que es justo el dato que hay que conservar. HTML **no tiene `readonly` para `<select>`**: el sistema lo construye con `aria-readonly` y bloqueando lo que abre o cambia la lista — Tab y Escape siguen pasando, porque salir nunca se bloquea. |
| **0d** | **Obligatorio.** (R55, v1.48.0) Donde se pinta a una persona: **foto si la hay, avatar si no**, y con **una sola prop**. `persona` lleva su retrato además de su identidad; si el producto tiene que acordarse de rellenar dos props para que salga la foto, la mitad de las pantallas enseñará iniciales de gente que sí tiene retrato — que es exactamente lo que pasó en la pantalla de contrato. |
| **0e** | **Obligatorio.** (R136 del equipo, v1.118.0) **UNA FILA DE CONTROLES ES UNA FILA.** Los controles que se ponen juntos miden lo mismo, y lo miden **por declaración, no por herencia**. Hay tres filas: la **normal** —botón, campo, selector, fecha, contraseña, selector con búsqueda, disparador de rango— a **`--alto-control`, 36 px**; la **de error**, también a 36; y la **compacta** —botón mini y los filtros densos de tabla y de la barra— a **28**. Lo reportó Control Administrativos V2.0 midiendo una barra de filtros en su producto, con los bordes superiores escalonados, y tienen razón: *«con tres alturas distintas, no hay alineación que salve la fila»*. **La causa no era una diferencia de píxeles: era que `.campo` no tenía altura propia.** `.btn` declaraba su interlineado —18 px, que es además el tamaño del icono de interfaz, y por eso un botón mide lo mismo lleve icono o no (regla 0)—; `.campo` **no declaraba ninguno**, así que su altura era la que heredara la hoja del producto: 36,45 en el catálogo con su interlínea de 1,45, y otra cosa en cada proyecto. Estaba escrito en `FilaCarga` desde la v1.102.0 —*«la cifra exacta depende de la interlínea que herede el producto»*— y se leía como un detalle. **Los 2 px de la fecha son del reloj nativo** y se quitan donde nacen, en `::-webkit-datetime-edit`, no recortando la caja. **El error no mueve la fila**: el filete pasa de 1 a 2 px —señal no cromática, SC 1.4.1— y se los devuelve al relleno. **El área de texto queda fuera**: es de varias líneas y conserva su interlineado de lectura. **Nada de altura fija.** El primer arreglo la puso y dos auditorías lo pararon: aplastaba las variantes que existen a propósito —el botón mini de 28 a 36— y **recortaba 2 px el campo en error**. Una altura fija no arregla una altura mal calculada: la tapa. Lo vigila `verificar-altura`, que mide filas y lleva **deuda declarada** de las dos que hoy no cuadran. |
| **1** | **Obligatorio.** Nunca `outline: none` sin reemplazo. El candado lo corta. |
| **2** | **Obligatorio.** Nada se distingue **solo por color** (SC 1.4.1). Los chips llevan texto, el orden lleva flecha, los filtros llevan tira. |
| **3** | **Obligatorio.** Nunca se atenúa texto con `opacity`: lo saca del contrato de contraste. |
| **4** | **Obligatorio.** En pantalla estrecha el contenido ancho **se desplaza dentro de su marco**, con `tabindex="0"` para que el desplazamiento también se alcance con teclado. Nunca se encoge la letra. |
| **5** | **Obligatorio.** Tema, densidad y formato horario **se recuerdan**. Del proyecto: **dónde**. Recomendación firme: en el perfil del usuario, no en el navegador, o la preferencia no le sigue entre dispositivos. |

---

## Horario · sombreado fraccionado y descarte

| | Regla |
|---|---|
| **1** | **Obligatorio.** (R89, v1.64.0) **La celda no es un interruptor.** Un bloque se pinta en **cuartos de franja**: 13:30–15:00 con paso de 60 es media celda de las 13:00 más la de las 14:00 entera. Es lo que permite que la rejilla se quede en 24 filas aunque alguien entre a las 07:45 — antes, un solo turno a menos cuarto obligaba a dibujar la semana entera en franjas de quince minutos, para todos. |
| **2** | **Obligatorio.** (R89, v1.64.0) **El relleno redondea; el rótulo no.** El sombreado se cuantiza a cuartos, pero la hora exacta viaja siempre en el texto del bloque. Una entrada de 07:25 sombreada como «casi media celda» no miente, porque el minuto está escrito dentro. Por eso no hace falta una rejilla de precisión. |
| **3** | **Obligatorio.** (R89, v1.64.0) **La tabla no cambia.** Sigue siendo una tabla de verdad: `th scope`, `rowSpan` y `colSpan` intactos. El reparto se hace **dentro** de la celda con una pila de proporciones, sin sacar el bloque del flujo — si el texto no cabe, la fila crece, como siempre. |
| **4** | **Obligatorio.** (R89, v1.64.0) **El bloque se ancla donde CAE su inicio**, no en la franja más cercana. Hasta la v1.63.0 se redondeaba, y un bloque de las 07:45 con paso de una hora se dibujaba **en la fila de las 08:00** con el rótulo «07:45» al lado: se veía una hora que no era. |
| **4bis** | **Obligatorio.** (R94, v1.69.0) **`onAjuste` se llama desde un efecto, nunca durante el render.** Y solo cuando los avisos **cambian de contenido**, no cuando cambia la identidad del array. Salió del render en la v1.64.0 y era un **bucle infinito** para quien hiciera lo natural —guardar los avisos en un estado para enseñarlos—: `setState` durante el render provoca otro render, que vuelve a avisar. La prueba que lo reprodujo se colgó diez minutos; la que lo vigila lleva tope para fallar en vez de colgar. |
| **4b** | **Obligatorio.** (R138 del equipo, v1.120.0) **UNA CELDA LLEVA UNA PILA DE BLOQUES, NO UNO, y el choque se mide EN CUARTOS.** Dos bloques que comparten franja **sin compartir un minuto** caben los dos, apilados con sus huecos; la celda abarca la **unión** de las franjas de todos ellos. Lo reportó Control Administrativos V2.0 con un horario real —S3 de 09:00 a 12:20 y S1 de 12:20 a 13:55— y el segundo se descartaba diciendo que se solapaba. **No se solapaban: compartían fila.** El bucle reservaba **franjas enteras**, así que **un bloque que acaba a media franja se queda la franja entera** y cualquiera que empiece ahí se cae. No es cuestión de resolución —a paso 20 se pinta, porque ahí el borde cae exacto en 12:20—: **cualquier hora que no caiga en un borde lo reproduce**. **El descarte no desaparece, cambia de criterio**: antes por franja, que es geometría; ahora por tiempo, que es lo que de verdad no cabe — y el aviso dice **con cuál** se solapa. **Y el bloque se mide también en cuartos** (`hor-d{cuartos}`, como el hueco lleva `hor-h{cuartos}`): con `flex: 1 0 auto` —«todo lo que sobre»— dos bloques de duraciones distintas se repartirían el sobrante a partes iguales y el de una hora se vería como el de tres. Lo anticipó el propio equipo al mandarlo: *«el hueco en cuartos tendrá que contar todos los bloques de la pila, no uno»*. **Y pasado el tope de la regla 7 no se descarta a nadie**: la pieza que no cabe en el juego de clases sale **sin clase de tamaño** —hereda `flex: 1 0 auto`, que es lo que «a celda entera» siempre quiso decir— y se avisa con `span-largo`. **Se pierde la proporción, no el bloque.** La primera versión de esta regla sí descartaba, y con eso el caso que trajo el R138 seguía roto a paso 30 mientras el contrato decía que estaba cerrado; lo cazó una auditoría antes de publicar. Un bloque que desaparece no deja hueco visible y nadie lo echa en falta; uno mal proporcionado se ve. |
| **5** | **Obligatorio.** (R89, v1.64.0) **Nada se descarta en silencio.** `onAjuste` recibe todo lo que no se pudo dibujar tal cual, con su motivo: `fuera-de-rango`, `dia-inexistente`, `duracion-nula`, `sin-sitio`, `span-largo`. No avisar es peor que fallar: una celda vacía es un estado normal, así que un bloque que desaparece **no deja hueco visible** y nadie lo echa en falta hasta que alguien pregunta por su clase. |
| **6** | **Obligatorio.** (R89, v1.64.0) **En un solapamiento gana el primero**, y el segundo se anuncia. Antes ganaba el último y el anterior desaparecía sin rastro. |
| **7** | **Obligatorio.** (R89, v1.64.0 · precisada en v1.120.0) El sombreado **proporcional** llega hasta **seis franjas**. Por encima, la pieza ocupa **lo que quede de la celda** —`flex: 1 0 auto`, que es lo que «celda entera» siempre quiso decir— **y se avisa** con motivo `span-largo`. **Lo que se pierde es la proporción, no el bloque**: desde el R138 no se descarta a nadie por pasar el tope, y la regla 4b lo desarrolla. Aquí ponía «celda entera y aviso» a secas, que con un bloque por celda era exacto y con una pila se leía como si el resto se cayera — lo señaló una verificación independiente. Un límite que no se dice es un descarte silencioso, que es justo lo que esta regla viene a quitar. |
| **8** | **Obligatorio.** (R94, v1.69.0 · corregida en v1.119.0 por el **R137**) **El hueco mide una fracción de la CELDA, y se expresa en LONGITUD: tantos cuartos de `--alto-franja`.** Hasta la v1.68.0 se repartía con `flex-grow`, que reparte lo que *sobra* —y sobra distinto en cada celda—, así que el mismo horario se dibujaba a alturas distintas según el contenido; estaba declarado como «aproximación de 2 puntos» y era peor que eso, porque **una desviación que cambia con el contenido no es aproximar, es desalinear**. Se arregló con un **porcentaje del contenedor**, y eso era **circular**: el alto de la pila lo decide su contenido —el bloque lleva `flex: 1 0 auto` y no puede encoger— y el hueco era un porcentaje de ese mismo alto, así que **se comía su fracción de lo que el bloque necesitaba y el bloque se salía por abajo exactamente esa fracción**. Lo midió Control Administrativos V2.0 en el horario de un trabajador real y se reprodujo en su navegador: bloque de 12:20 a 13:55, contenido 45,5 px, hueco **11,38** —el 25 % de 45,5— y **11,04 px pisando la fila siguiente**; el de 10:35 a 13:55, con `rowSpan` 2, cabía y no se salía, y por eso **parecía acabar más tarde** que uno que acaba a la misma hora. Tienen razón en que **estirar la fila no sirve**: el hueco crece con ella, y no hay altura que cumpla las dos condiciones. En longitud deja de depender del contenido —que es lo que la v1.69.0 perseguía y no llegaba a conseguir: con porcentaje, dos bloques que empiezan los dos «y cuarto» se desplazaban distinto si sus filas medían distinto—. El `largo` del bloque deja de importar: **un cuarto de hora es un cuarto de hora**. Lo vigila `verificar-cascada`, afirmación `R137`. |
| **8bis** | **Obligatorio.** (R94, v1.69.0) **El bloque no se comprime por debajo de su texto.** Si no cabe, crece la fila — y como el hueco se mide en **cuartos de `--alto-franja`**, una longitud que no depende del alto de la celda, el reparto es idéntico en todas aunque una crezca. Aquí decía *«como el hueco es porcentual»*, que dejó de ser cierto en la v1.119.0 y era **justo el defecto** que el R137 vino a cerrar: la frase sobrevivió a su propio arreglo una versión entera. Recortar el título para cuadrar un sombreado sería cambiar un dato por un adorno. |
| **9** | Del proyecto: **qué se hace con los avisos**. El sistema los entrega; registrarlos, enseñarlos o corregir el dato es de cada aplicación. |

---

## Panel de privilegios

Reparte permisos por módulo. **No sabe de negocio**: recibe módulos con
privilegios y devuelve qué está concedido, así que sirve igual para un cargo,
una persona o una clave de API.

| | Regla |
|---|---|
| **1** | **Obligatorio.** (R97, v1.72.0) **Hay un privilegio que manda.** `base` —`ver` por omisión— gobierna a los demás de su módulo: apagarlo apaga el módulo entero, y encender cualquier otro lo enciende solo. Sin esto se puede guardar «editar sin ver», y entonces cada producto decide por su cuenta qué significa eso. Se desactiva con `base={null}` cuando el dominio no funcione así. |
| **2** | **Obligatorio.** (R99, v1.74.0) **Hay TRES motivos por los que un privilegio no se reparte, y se leen distinto.** `cerrado` — no se podrá nunca, olvídelo. `ajeno` — existe y se concede, pero **quien reparte no lo tiene**, así que hable con quien sí. `pendiente` — todavía no está en el sistema, espere. Con un solo estado los tres invitan a lo mismo: a insistir. Cada uno lleva icono, etiqueta y motivo propios, y **ninguno se pinta como interruptor apagado**, porque «un apagado invita a encenderlo». `cerrado: 'texto'` sigue significando `cerrado`. |
| **2bis** | **Obligatorio.** (R99, v1.74.0) **Varios privilegios con la misma `clave` son el mismo permiso**: se encienden y se apagan juntos, y **se dice antes de pulsar** —«Editar · va con Crear»— en la propia etiqueta, que es también el nombre accesible. Colapsarlos en un solo control se probó y se descartó: la acción desaparecía de la lista y nadie sabía que existía. |
| **2ter** | **Obligatorio.** (R99, v1.74.0) **Lo que no se puede repartir no cuenta en el «4 de 6».** Contarlo haría que un cargo pareciera incompleto por reglas que no dependen de él. |
| **2quater** | **Obligatorio.** (R97, v1.72.0) **Lo cerrado dice por qué.** Un privilegio que no se puede conceder lleva `cerrado` con el **motivo en texto**, no un booleano. Es el `cerrado` del Interruptor: un candado sin explicación se lee como un fallo del sistema, y quien reparte permisos no entiende por qué su lista no coincide con la de al lado. |
| **3** | **Obligatorio.** (R97, v1.72.0) **Lo que no aplica no se pasa.** Si un módulo no tiene «descargar», ese privilegio no está en su lista — no hay estado «no aplica» que pintar. Una casilla vacía y un permiso denegado no son lo mismo, y confundirlos hace que se conceda lo que no existe. |
| **4** | **Obligatorio.** (R97, v1.72.0) **Lo concedido se ve sin abrir.** El resumen y el conteo están en la cabecera del módulo: **abrir es para cambiar, no para enterarse**. Con diez módulos, obligar a abrirlos uno por uno para saber qué hay concedido es diez veces el mismo gesto. |
| **5** | **Obligatorio.** (R97, v1.72.0) **Sin el privilegio base, el resto se atenúa pero NO se oculta.** Siguen ahí, apagados y visibles, con un aviso que lo explica. Hacerlos desaparecer haría pensar que se perdió lo que estaba concedido. |
| **5bis** | **Obligatorio.** (R98, v1.73.0) **Y tampoco se borra.** Apagar el base deja el módulo tal cual: lo configurado se conserva para cuando se vuelva a encender. Es la misma decisión que la tabla tomó con sus filtros —«plegar es dejar de ver el control, no dejar de filtrar»— y aquí pesa más, porque un panel que guarda en cada pulsación pierde en el acto y sin vuelta atrás. **Lo que no se conserva es el efecto**: sin el base, el módulo no concede nada, y eso lo resuelve `privilegiosEfectivos()` para quien tenga que mandarlo al backend. Hasta la v1.72.0 se ponía todo a `false`. |
| **5ter** | **Obligatorio.** (R98, v1.73.0) **Un privilegio puede declarar niveles por campo**: cuánto se ve de un dato sensible —documento completo, parcial u oculto—. Son dos o tres estados excluyentes, así que van en `Segmentado`, no en interruptores; y viven **dentro del privilegio**, no del módulo, porque de él dependen: sin «ver» concedido, elegir cuánto se ve no significa nada. Se guardan bajo la clave `privilegio:nivel` en el mismo mapa, para que el producto persista un solo objeto. |
| **6** | **Obligatorio.** (R97, v1.72.0) **El panel no ordena por estado.** Subir los concedidos al principio movería la fila justo después de tocarla y borraría el orden que traen los datos, que suele ser una escalera de riesgo (ver → editar → crear → desactivar). El orden lo decide quien pasa los módulos. |
| **7** | Del proyecto: **cuándo se guarda**. El panel es controlado —recibe `valor`, emite `onCambio`— y no persiste nada. |
| **8** | Del proyecto: **de dónde salen los motivos** de lo cerrado. El sistema los muestra; calcularlos es del backend. Un `bloqueado` sin explicación devuelve el candado mudo. |
| **9** | Del proyecto: **el encabezado**. El selector de cargo, el buscador o lo que haga falta va por `children`. El panel no sabe qué se está configurando. |
| **10** | Del proyecto: **qué se guarda y qué se envía**. Lo natural es guardar el mapa completo —para no perder lo configurado— y mandar al backend el resultado de `privilegiosEfectivos()`. Guardar lo efectivo pierde el trabajo; enviar lo completo concede lo que no se concedió. |

---

## Color de identidad · Horario y Chip

<!-- pruebas: identidad-tono.test.ts, distancia.test.ts, Avatar.test.tsx -->

Los cuatro colores decorativos que ya usaba el avatar, disponibles desde la
v1.63.0 como `tono` en `Horario` y en `Chip`.

| | Regla |
|---|---|
| **1** | **Obligatorio.** (R88, v1.63.0) **Agrupan, no informan.** Sirven para marcar a qué grupo pertenece algo —una sede, un turno, un responsable— y **no significan nada**: ni bien, ni mal, ni pendiente. Existen porque la paleta de estado no se puede reutilizar para esto: usar `error` como color decorativo **gasta el rojo**, y un rojo que siempre está deja de querer decir «mira esto». |
| **2** | **Obligatorio.** (R88, v1.63.0) **Lo agrupado va también en texto, y con leyenda.** El color acompaña; nunca es el único medio (SC 1.4.1). En el horario, el bloque dice su sede; junto a la rejilla, una leyenda dice qué color es cada una — `chip-punto` con el tono de identidad es la pieza. Sin las dos cosas no se usa: cuatro colores sin leyenda son cuatro adornos, y quien no distinga dos de ellos se queda sin el dato. |
| **3** | **Obligatorio.** (R88, v1.63.0) En el **horario** el color va en el **filete, a 6 px** — los tonos de estado llevan 3, y **el grosor distinto es en sí la señal** de que esto es otra dimensión. No va en el fondo: se probó macizo con texto blanco, cumple el contraste (6,05–7,53:1) pero **cuatro cajas decorativas pesan más que un bloque de error** en rojo tenue, y la alarma queda por debajo del adorno. Tampoco en el texto (5,27–6,55:1): aquí el texto de color ya significa estado. |
| **4** | **Obligatorio.** (R88, v1.63.0) **Son cuatro y no más.** Es lo que la paleta de estado deja libre: cada uno queda a 30° o más del tono de estado más cercano, salvo pizarra, que va al 17 % de saturación. Una paleta larga de colores decorativos acaba con dos tonos que nadie distingue. |
| **5** | Del proyecto: **el reparto**. Qué grupo se lleva cada color lo decide quien monta la pantalla. `colorIdentidad(id)` da un reparto estable por identificador y está exportada, pero no es obligatoria: para sedes con nombre suele quererse un orden fijo. |
| **6** | Del proyecto: **no se ordena ni se criba por el color**. No es un valor. |
| **7** | **Obligatorio.** (R143, v1.123.0) **En el chip el color va MACIZO**, con `identidad-texto` — el mismo par que el avatar, verificado a 6,05 · 7,42 · 6,47 y 7,53:1. La regla 3 dice lo contrario **y es del horario**: allí una rejilla entera de cajas decorativas ahoga a un bloque de error, y en una columna de estado hay **un chip por fila**. Copiar aquella decisión sin volver a pensarla es lo que dejó los cuatro tonos pintando `fondo-encabezado`, **el mismo relleno que `chip-pend`**: cinco de los diez tonos publicados eran uno solo, medido a **0,0** de distancia perceptual. El chip de identidad **pesa más** que un chip de estado; ése es el precio de que se distinga, y por eso no se mezcla con la escala de estado esperando que pesen igual. |
| **8** | **Obligatorio.** (R143, v1.123.0) **Dos tonos que no se distinguen son un tono con dos nombres.** Ningún par de los rellenos que publica `Chip` puede caer por debajo de **2,3 de CIEDE2000** —el umbral de percepción publicado— en ninguno de los dos modos ni en ninguna de las dos hojas. Lo mide `verificar-tono`, que lee los tonos **del propio componente** para que uno nuevo entre vigilado el día que nace, y que vuelve a calcular sobre el HTML entregado **todas** las cifras que el catálogo publica. La razón de contraste de WCAG no responde a esto: mide texto sobre fondo, y dos rellenos de la misma claridad y distinto tono dan 1,00:1. |
| **9** | Del proyecto: **cuando hacen falta cinco categorías a la vez**, la quinta sale de identidad y no de un color nuevo. Son categorías, no grados: la escala de estado tiene seis peldaños con significado y no admite un séptimo sin significado. El texto del chip sigue siendo obligatorio (SC 1.4.1): la distancia medida es un suelo, no un certificado, y no sabe de daltonismo. |

---

## Lo que este documento todavía no cubre

Declarado en vez de omitido:

- ~~**El teclado del calendario.**~~ **Cubierto desde que RangoFecha se rehízo
  en React**: flechas, Home/End de semana, PageUp/PageDown de mes —con Shift,
  de año—, Escape y roving tabindex, cada uno con su prueba en
  `componentes/pruebas/RangoFecha.test.tsx`. La entrada anterior decía que no
  existía y llevaba razón entonces; se tacha en vez de borrarse.
- **La gestión de foco del menú de usuario.** Sigue sin cubrirse aquí.
- **El comportamiento en lector de pantalla real.** Todo lo de aquí se verificó
  por marcado y por medición, no escuchándolo con NVDA ni VoiceOver.
