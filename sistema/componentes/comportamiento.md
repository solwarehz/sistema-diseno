# Contrato de comportamiento

Qué **hace** cada elemento, no cómo se ve. El aspecto ya lo entrega
`componentes.css`; esto es la otra mitad, y es la que hoy se descubre pulsando.

Existe porque Control Administrativos V2.0 lo midió: **cinco reglas de la tabla,
cinco pruebas, un día** — y el siguiente proyecto las habría vuelto a descubrir
una por una. Cada regla de aquí está leída del código del catálogo, no de la
memoria de nadie.

> **Cómo leerlo.** Lo que dice «obligatorio» es del sistema y no se negocia: si
> se cambia, dos productos dejan de comportarse igual. Lo que dice «del
> proyecto» lo decide cada aplicación.

---

## Tabla de datos

Es el 80 % de la superficie del sistema. Si solo se lee una sección, esta.

### Filtros

| | Regla |
|---|---|
| **1** | **Obligatorio.** «Filtros» despliega **una fila de controles dentro del `<thead>`, uno por columna**. No es un panel aparte: el filtro vive sobre la columna que filtra, o hay que recordar cuál era cuál. |
| **2** | **Obligatorio.** Al plegar la fila, **los valores se conservan**. Plegar es dejar de ver el control, no dejar de filtrar. Limpiar al plegar hace que la tabla cambie de contenido por un gesto que parecía visual. |
| **3** | **Obligatorio.** Mientras haya algún filtro puesto, **el botón queda marcado** (`#tb-filtros-btn.activo`, borde y texto en `accion`). Con la fila plegada **nada más lo indicaría**, y una tabla filtrada que parece completa es un error de lectura, no de interfaz. |
| **4** | **Obligatorio.** Además del botón marcado, los filtros puestos se listan **encima de la tabla** (`.tb-activos`). Dos señales para lo mismo, y a propósito: el botón dice «hay filtros», la tira dice **cuáles**. |
| **5** | **Obligatorio.** Al filtrar **se vuelve a la página 1**. Quedarse en la página 7 de un resultado que ahora tiene 2 muestra una tabla vacía que parece un fallo. |
| **6** | Del proyecto: qué columnas son filtrables y con qué control —texto, selector, rango—. |

### Paginación

| | Regla |
|---|---|
| **7** | **Obligatorio.** Con **una sola página no se pinta la paginación**, pero **el rango sí se queda** («1–8 de 8»). El número de resultados es información aunque no haya que navegar. |
| **8** | **Obligatorio.** El tamaño de página elegido **se recuerda**. Es una preferencia de la persona, no de la pantalla. |
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
| **14** | **Obligatorio.** Las columnas ocultas **se recuerdan**, como el tamaño de página. |
| **15** | **Obligatorio.** La descarga a CSV exporta **lo que se ve**: filtros aplicados y columnas visibles. Exportar todo cuando la pantalla muestra un subconjunto es el fallo clásico de este control. |

### Filas desplegables

| | Regla |
|---|---|
| **16** | **Obligatorio.** El chevron es un `<button>` con `aria-expanded` y `aria-controls`, y su nombre accesible **cambia** entre «Mostrar» y «Ocultar». |
| **17** | **Obligatorio.** El detalle plegado **se oculta de verdad** (`visibility: hidden`), no solo a altura cero. Con altura cero los enlaces siguen siendo paradas de tabulación invisibles y el lector de pantalla lee el contenido de todas las filas cerradas. |

---

## Aviso temporal

| | Regla |
|---|---|
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

- **El teclado del calendario.** Hoy no implementa el patrón de rejilla —sin
  flechas ni Home/End— y sería deshonesto escribirlo como si lo hiciera. Está
  en la lista de correcciones abiertas.
- **La gestión de foco del menú de usuario**, por el mismo motivo.
- **El comportamiento en lector de pantalla real.** Todo lo de aquí se verificó
  por marcado y por medición, no escuchándolo con NVDA ni VoiceOver.
