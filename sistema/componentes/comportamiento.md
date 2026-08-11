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
| **18** | **Obligatorio.** (R31, v1.25.0) La elección de columnas **es una preferencia de la persona** y el producto debe poder honrarla: se siembra al montar con `ocultas` y se guarda con `onOcultas` — en el perfil, como manda la transversal 5. Pasada `ocultas`, esa es la verdad: la tabla no la duplica. |
| **19** | Del proyecto. (R32, v1.25.0) La ranura `acciones` pone la exportación o la acción por lotes **dentro de la barra**, junto a «Filtros» y «Columnas». El sitio es del sistema; el comportamiento, de quien la llena. |
| **20** | **Obligatorio.** (R33, v1.25.0) Columna con `opcionesFiltro` filtra con **selector** y casa por **igualdad**, no por texto contenido: «activo» está *contenido* en «inactivo», y quien teclea el sinónimo concluye que no hay resultados. |
| **21** | **Obligatorio.** (v1.25.0) La tabla vacía **dice por qué y da la salida**: con filtros puestos, «Prueba con menos filtros, o quítalos todos» en un clic; sin filtros, «No hay datos registrados todavía». El encabezado se queda — dice qué columnas habría. Cero filas sin explicación parece un fallo. |
| **22** | **Obligatorio.** (R34, v1.27.0) La **búsqueda global** mira todas las columnas —es para cuando no se sabe en cuál está lo que se busca—, se **suma** a los filtros de columna y vuelve a la página 1. En `servidor` solo se emite por `alCambiar`. |
| **23** | **Obligatorio.** (R34, v1.27.0) «Mostrar [N]» vive en la **barra**, con el recuento al lado y **con sustantivo** («38 trabajadores»). Con cualquier criba el recuento dice «X de Y» aunque X sea igual que Y: un filtro que no descarta nada parece no haber hecho nada. |
| **24** | **Obligatorio.** (R34, v1.27.0) La columna **N.º** es localizadora y **continua entre páginas**: «era la 34» sigue siendo la 34 en la página 4. No ordena ni filtra — no es un dato, es un dedo puesto en la fila. `numerada={false}` la quita. |
| **25** | **Obligatorio.** (R34, v1.27.0) El **pie** lleva el rango a la izquierda y la paginación a la derecha, como el catálogo. El tamaño de página no se repite ahí: ya vive arriba. |
| **26** | **Obligatorio.** (R42b, v1.38.0) En la **tabla simple**, la cabecera **cae sobre sus columnas**: cabecera y cuerpo comparten un solo layout de tabla — nunca dos tablas independientes repartiendo columnas por su cuenta. Suelta, la tabla es un bloque que se desplaza solo; **dentro de `.tb-envoltura`** es tabla plena a todo lo ancho, y la envoltura resuelve el desbordamiento. |

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

## Carga de imagen

| | Regla |
|---|---|
| **1** | **Obligatorio.** Es la **pieza visual**: entrega el recorte cuadrado como `Blob` + URL local por `onCambio`. El recorte sale en **WebP** (calidad 0,85) para que pese menos; donde el navegador no sepa producirlo cae a PNG por especificación, así que el producto lee `blob.type` y **no asume extensión**. La subida —ruta, momento, reintentos— es del producto. |
| **2** | **Obligatorio.** El encuadre se maneja **también con teclado**: el lienzo es enfocable, las flechas mueven, y acercar/alejar son botones. Un recorte solo-ratón deja gente fuera. |
| **3** | **Obligatorio.** El editor vive en `Dialogo` con «pulsar fuera» **apagado**: un encuadre a medias no se pierde por un clic. Cancelar sí lo descarta, y elegir el mismo archivo después vuelve a abrir. |
| **4** | **Obligatorio.** La imagen **cubre siempre el cuadro**: la escala mínima es la que lo llena y el desplazamiento se acota — centrar es mover hasta el borde, no sacar la foto del marco. |
| **5** | Del proyecto: el peso y formato máximos y su validación. El componente da la ranura `error` y la `nota` para decirlos. |
| **6** | **Obligatorio.** (v1.30.0) Los **formatos son cerrados** y llevan la proporción del **hueco real**: `foto` 1:1 mostrada en círculo (y encuadrada con máscara circular — el recorte exportado sigue siendo rectangular), `logo-extendido` **212×44** (el hueco de la marca del lateral: 236 − 24 de relleno), `logo-comprimido` 1:1. El editor adopta la proporción del formato: encuadrar un logo apaisado en un cuadro cuadrado es encuadrar a ciegas. La vista previa **es** el hueco — se ve cómo va a quedar, no una aproximación. |

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
| **8** | **Obligatorio.** (R46, v1.40.0) Con el panel abierto la elección es un **borrador**: `onCambio` **no** se dispara al elegir, sino **al Grabar**. Si emitiera al elegir, cancelar dejaría el formulario ya cambiado. Y volver a abrir **arranca de lo ya guardado**, no en blanco: empezar vacío haría creer que se perdió. |
| **9** | **Obligatorio.** (R46, v1.40.0) El panel lleva **exactamente dos botones**, y el disparador de fuera se retira mientras está abierto. **«Subir» está siempre**: es lo que trae el archivo. **El segundo muta**: «Cancelar» —terciario, plano— mientras no hay contenido válido o hay error; «Grabar» —principal, macizo— en cuanto lo hay. Lo decidió el responsable con el riesgo delante: un botón que cambia de significado puede confirmar cuando se iba a descartar. Se amortigua haciendo que los dos estados **no se parezcan**, para que el cambio se vea y no solo se lea. **Consecuencia declarada:** con un PDF válido puesto ya no hay «Cancelar»; salir sin guardar son dos pasos —quitar el archivo con el tachito, y entonces el botón vuelve a ser «Cancelar»—. |
| **10** | **Obligatorio.** (R46, v1.40.0) El panel **se monta y se desmonta**, no se colapsa con CSS. Colapsado a altura cero seguiría en el árbol de accesibilidad con sus botones alcanzables por el tabulador — el defecto que el candado `OCULTABLE` encontró en `.cf-banda`. |
| **11** | **Obligatorio.** (R45, v1.40.0) `maximoArchivos` fija cuántos caben: 1 —lo normal, y elegir otro **sustituye**—, N, o `'sin-limite'`. Si se sueltan más de los que caben **se rechazan todos**, no se cogen los que quepan en silencio: quien soltó cinco se quedaría creyendo que subió cinco. El tachito va **en la línea del nombre** y lleva el nombre en su rótulo accesible. |
| **12** | Del proyecto: a dónde se sube, el peso máximo, cuántos archivos, y si se apaga la compresión —un PDF **firmado** hay que dejarlo intacto o la firma deja de validar. |

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
| **5** | **Obligatorio.** (R42a, v1.38.0) La navegación llega al **tercer nivel**: una `OpcionNav` con `hijos` se dibuja como **rama plegable** (`aria-expanded`, chevron), no como enlace. Las ramas arrancan **cerradas** —doce ítems seguidos no se leen— salvo la que contiene a la opción activa: llegar a una pantalla y no ver dónde estás en el menú es peor que un clic de más. |

---

## Reglas transversales

| | Regla |
|---|---|
| **1** | **Obligatorio.** Nunca `outline: none` sin reemplazo. El candado lo corta. |
| **2** | **Obligatorio.** Nada se distingue **solo por color** (SC 1.4.1). Los chips llevan texto, el orden lleva flecha, los filtros llevan tira. |
| **3** | **Obligatorio.** Nunca se atenúa texto con `opacity`: lo saca del contrato de contraste. |
| **4** | **Obligatorio.** En pantalla estrecha el contenido ancho **se desplaza dentro de su marco**, con `tabindex="0"` para que el desplazamiento también se alcance con teclado. Nunca se encoge la letra. |
| **5** | **Obligatorio.** Tema, densidad y formato horario **se recuerdan**. Del proyecto: **dónde**. Recomendación firme: en el perfil del usuario, no en el navegador, o la preferencia no le sigue entre dispositivos. |

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
