| **7** | **Obligatorio.** (R102, v1.78.0) **El rótulo va DENTRO de la fila**, no encima: rótulo, disparador y lo cargado en **un solo renglón**. Lo pidió el responsable —«Foto del trabajador · Cambiar foto · Foto del trabajador, todo en una sola línea»—. Es la excepción declarada a la regla del formulario (la etiqueta va encima del campo) y se sostiene porque aquí el rótulo no encabeza una caja de escribir, encabeza un mando: el mismo trato que ya reciben el filtro de la barra (`.top-filtros`) y el tamaño de página de la paginación (`.pgn`). **Consecuencia declarada:** con rótulos de distinta longitud, los disparadores de dos filas seguidas no caen sobre la misma columna. |
| **8** | **Obligatorio.** (R102, v1.78.0) **Las tres cargas comparten rótulo, nota, error y vacío** — `.cx-et`, `.cx-nota`, `.cx-error`, `.cx-vacio`—, también `CargaImagen` en `caja`. Antes tenía los suyos: `.ci-et` **ni siquiera fijaba el color**, así que en un mismo formulario el rótulo de la imagen podía salir de otro tono que el del PDF y el del ID; `.ci-nota` y `.ci-error` eran declaraciones idénticas con otro nombre, y el vacío se llamaba `.ci-vacia` —hasta con otro género—. De `.ci-*` queda solo lo que de verdad es suyo: la caja, la máscara y el editor de encuadre. Dos nombres para el mismo estilo es la manera de que un día se separen. |
| **9** | Del proyecto: qué dice la nota y qué dice el estado vacío. El sistema decide dónde van y cuánto ocupan. |# Contrato de comportamiento

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

## Tabla simple · ancho mínimo

| | Regla |
|---|---|
| **1** | **Obligatorio.** (R85 · P3, v1.60.0) Dentro de `.tb-envoltura`, una `.tabla-simple` lleva un **suelo de 520 px**. Es un buen valor por omisión: por debajo, las columnas se apelmazan y se lee peor estrujada que desplazándola. |
| **2** | **Obligatorio.** (R85 · P3, v1.60.0) Se **renuncia al suelo diciéndolo**: la clase `tabla-libre`. Para **leer**, desplazar está bien; para **configurar** no —se pierde de vista la fila mientras se pulsa la columna—, y ésa es decisión de quien monta la pantalla, no del sistema. |
| **3** | **Obligatorio.** (R85 · P3, v1.60.0) Es **contrato, no un descubrimiento**. Lo pidieron así con razón: su apaño era sacar la tabla fuera de `.tb-envoltura` para no heredar el suelo, y eso depende de un detalle interno de la cascada — «el día que cambiéis ese selector, se nos rompe y no nos vamos a enterar». El candado de la cascada lo comprueba **a los once anchos y en las dos caras**: que `tabla-libre` reciba 0, **y** que sin declarar nada siga recibiendo 520. |
| **4** | Del proyecto: que las celdas puedan encoger. Sin suelo, el desbordamiento es suyo. |

---

## Tabla de datos

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
| **17ter** | **Obligatorio.** (R101, v1.76.0) **Si no se declara `columnasFijas`, la primera columna es fija.** Antes el valor por omisión era «ninguna», y se podían ocultar todas hasta dejar una tabla de filas en blanco. Para renunciar hay que decirlo: `columnasFijas={[]}`. |
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

---

## Aviso temporal

| | Regla |
|---|---|
| **0** | **Obligatorio.** Los avisos viven en `ZonaAvisos`, que se monta **con la aplicación** — no cuando llega el primer aviso. Sus dos regiones (`alert` para error, `status` para el resto) existen desde la carga: una región viva creada en el momento del fallo no la anuncian la mayoría de lectores de pantalla. Dentro de la zona el aviso no lleva rol propio; suelto, lo conserva. |
| **0b** | Del proyecto: cuántos avisos a la vez. El criterio de referencia del cascarón: **tres, y el cuarto expulsa al más antiguo que no sea un error** — un error expulsado en silencio es un error que nadie leyó. |
| **1** | **Obligatorio.** Éxito, información y advertencia son **`aria-live="polite"`**. Confirman algo ya hecho; interrumpir la lectura para decir «se guardó» roba la frase que se estaba leyendo. |
| **2** | **Obligatorio.** El error es **`role="alert"`** y **no se va solo**: duración cero. Algo no se hizo, y anunciarlo tarde deja seguir adelante sobre un estado falso. |
| **3** | **Obligatorio.** El aviso **se pausa** al pasar el cursor o al recibir el foco. |
| **4** | Del proyecto: la duración de los que sí se van. El catálogo usa 4 a 10 s según longitud. |

---

## Confirmación

| | Regla |
|---|---|
| **1** | **Obligatorio.** **Nunca un diálogo modal encima.** La banda empuja el contenido hacia abajo, no lo tapa. En un teléfono el modal rompe el botón «atrás» y atrapa el foco. |
| **2** | **Obligatorio.** El foco **va a la banda** al aparecer. |
| **3** | **Obligatorio.** Al cerrar —confirmando, cancelando o con Escape— el foco **vuelve al control que la abrió**. |
| **4** | Del proyecto: qué acciones piden confirmación. Regla del sistema: **solo lo irreversible**. Lo reversible se hace y se ofrece «Deshacer» en el aviso. |

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
| **4** | Del proyecto: qué dice el mensaje y cuándo aparece. |

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
| **4** | Del proyecto: si hace falta decir que se puede escribir, se dice en el **`placeholder`** — es texto y no roba sangrado. |


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
| **7** | Del proyecto: qué dice la nota y qué dice el estado vacío. El sistema decide dónde van y cuánto ocupan. |

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

| | Regla |
|---|---|
| **1** | **Obligatorio.** El marco **envuelve a la aplicación entera** —el enrutador vive DENTRO de su zona de contenido—, no se monta uno por página. Montado por página, cada navegación crea un marco nuevo y **el plegado del lateral se olvida**: el usuario lo pliega, elige una opción y lo encuentra desplegado sin haberlo pedido. El estado interno de React no sobrevive al remontaje, y no debe: la corrección es dónde se monta, no un parche de persistencia. |
| **2** | Del proyecto: si el plegado debe **recordarse entre sesiones**, se controla con las props `plegado`/`onPlegar` y se guarda donde diga la regla transversal 5 — en el perfil, no en el navegador. |
| **3** | **Obligatorio.** (R39, v1.33.0) En la banda del cajón (≤700px) el velo **existe de verdad** —oscurece, cubre y se puede pulsar— y pulsarlo pliega: es la salida con el ratón, porque el botón de plegar queda debajo del propio cajón. Y al **cruzar** de ancho a angosto el marco **se pliega solo**, avisando por `onPlegar`: un cajón que nadie abrió no se queda plantado sobre el contenido. |
| **4** | **Obligatorio.** (R38a, v1.34.0) La banda del **riel** (≤900px) es **estado, no CSS forzado**: al cruzarla el marco se pliega de verdad — la clase, el `aria-expanded` y el logo compacto de `MarcaMenu` salen del mismo estado. Quien quiera re-desplegar a ese ancho, puede: los 236px caben en línea. La hoja pinta estados; no los impone a espaldas del componente. |
| **5** | **Obligatorio.** (R47, v1.41.3) **Plegado, el panel flotante se cierra CON MARGEN**: 220 ms desde que el cursor sale del grupo, y volver a entrar dentro de ese margen lo cancela. No es un adorno: el panel nace al otro lado del carril y el cursor tiene que **cruzar sus 56 px** para alcanzarlo — cerrando en seco desaparece por el camino y no hay forma de elegir nada. El catálogo lo llevaba desde el principio; la entrega cerraba al instante. Y **con teclado abre al enfocar dentro**: sin ratón, el panel era inalcanzable. |
| **6** | **Obligatorio.** (R42a, v1.38.0) La navegación llega al **tercer nivel**: una `OpcionNav` con `hijos` se dibuja como **rama plegable** (`aria-expanded`, chevron), no como enlace. Las ramas arrancan **cerradas** —doce ítems seguidos no se leen— salvo la que contiene a la opción activa: llegar a una pantalla y no ver dónde estás en el menú es peor que un clic de más. |
| **7** | **Obligatorio.** (R48, v1.42.0) La apertura de los grupos sigue al plegado que **queda**, no al que se **pide**. Controlado (regla 2), el que manda es el producto: si no devuelve el valor nuevo, el carril sigue plegado — y los grupos **no se abren**. Abrirlos igual dejaba los paneles flotantes de **todos** los grupos encima del contenido con la barra todavía a 56 px, que es justo el estado que la regla 4 existe para evitar. Por lo mismo, un marco que **nace plegado** nace con los grupos cerrados. |

| | Regla |
|---|---|
| **0** | **Obligatorio.** (R52, v1.46.0) **El icono de la interfaz mide 18px** — el paso «texto», que es el que `Icono` da por omisión. Es el mismo número que el `line-height` del botón, y por eso un botón mide lo mismo lleve icono o no. `control` (16px) y `etiqueta` (14px) son para huecos que ya miden eso —la paginación—, y `estado` (32px) para el hueco vacío. La entrega los pasaba a `control` en 24 sitios y el catálogo los dibuja a 18: **todo icono salía 2px más pequeño en el producto**. Ningún candado lo ve: es un atributo del `<svg>`, no una declaración de la hoja. |
| **0b** | **Obligatorio.** (R53, v1.47.0) El **grupo de campo tiene un solo aspecto**, se llame `.cg-*` o `.campo-*`: **comparten declaración en la hoja**, no son dos bloques parecidos. Habían derivado —la etiqueta perdía su color y el error perdía su icono— y por eso el selector de la entrega no se veía como el del catálogo. El **error lleva icono**: un renglón rojo suelto se confunde con una ayuda, y el color por sí solo no dice que algo falla (SC 1.4.1). |
| **0c** | **Obligatorio.** (R54, v1.48.0) **Solo lectura no es deshabilitado.** Mientras una consulta está en curso —el tipo de documento mientras se pregunta a la API—, el control va en **solo lectura**: se ve, se lee, se enfoca y **viaja con el formulario**, pero no cambia. Deshabilitado diría «esto no es para ti», se saldría del tabulador y **el navegador no lo enviaría**, que es justo el dato que hay que conservar. HTML **no tiene `readonly` para `<select>`**: el sistema lo construye con `aria-readonly` y bloqueando lo que abre o cambia la lista — Tab y Escape siguen pasando, porque salir nunca se bloquea. |
| **0d** | **Obligatorio.** (R55, v1.48.0) Donde se pinta a una persona: **foto si la hay, avatar si no**, y con **una sola prop**. `persona` lleva su retrato además de su identidad; si el producto tiene que acordarse de rellenar dos props para que salga la foto, la mitad de las pantallas enseñará iniciales de gente que sí tiene retrato — que es exactamente lo que pasó en la pantalla de contrato. |
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
| **5** | **Obligatorio.** (R89, v1.64.0) **Nada se descarta en silencio.** `onAjuste` recibe todo lo que no se pudo dibujar tal cual, con su motivo: `fuera-de-rango`, `dia-inexistente`, `duracion-nula`, `sin-sitio`, `span-largo`. No avisar es peor que fallar: una celda vacía es un estado normal, así que un bloque que desaparece **no deja hueco visible** y nadie lo echa en falta hasta que alguien pregunta por su clase. |
| **6** | **Obligatorio.** (R89, v1.64.0) **En un solapamiento gana el primero**, y el segundo se anuncia. Antes ganaba el último y el anterior desaparecía sin rastro. |
| **7** | **Obligatorio.** (R89, v1.64.0) El sombreado llega hasta **seis franjas de span**. Por encima, celda entera **y aviso** — un límite que no se dice es un descarte silencioso, que es justo lo que esta regla viene a quitar. |
| **8** | **Obligatorio.** (R94, v1.69.0) **El hueco mide una fracción de la CELDA, no del espacio sobrante.** Medido: donde toca 37,5 % sale **37,6 %**, y **dos bloques de la misma hora en la misma fila empiezan a la misma altura aunque uno lleve línea de detalle y el otro no** — desalineación **0,00 px**. Hasta la v1.68.0 se repartía con `flex-grow`, que reparte lo que sobra; sobra distinto en cada celda, así que el mismo horario se dibujaba a alturas distintas según el contenido. Estaba declarado como «aproximación de 2 puntos» y era peor que eso: **una desviación que cambia con el contenido no es aproximar, es desalinear**. |
| **8bis** | **Obligatorio.** (R94, v1.69.0) **El bloque no se comprime por debajo de su texto.** Si no cabe, crece la fila — y como el hueco es porcentual y todas las celdas de una fila miden lo mismo, el reparto sigue siendo idéntico en todas. Recortar el título para cuadrar un sombreado sería cambiar un dato por un adorno. |
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
