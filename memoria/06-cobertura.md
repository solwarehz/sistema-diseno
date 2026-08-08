# Auditoría de cobertura

Qué elementos tiene el sistema y **qué le falta** para cubrir un sistema de
gestión completo. No es una lista genérica de librería: es lo que hacen falta
las pantallas de este proyecto.

**Estado:** 15 elementos construidos · 4 fundamentos · 0 pendientes en el menú.

---

## Lo que está

### Fundamentos

| | Estado |
|---|---|
| Color | ✅ 48 tokens, 136 pares verificados en dos modos |
| Tipografía | ✅ dos escalas, cuatro pesos |
| Espaciado | ✅ rejilla de 4 |
| Iconos | ✅ Lucide, trazo 1,5px |

### Elementos

| | Estado | Nota |
|---|---|---|
| Botón | ✅ | 6 variantes, tabla por acción |
| Enlace | ✅ | subrayado obligatorio, medido |
| Campo de texto | ✅ | anatomía, 6 estados, validación |
| Selector | ✅ | con búsqueda sin tildes |
| Interruptor | ✅ | con transición |
| Selección múltiple | ✅ | casillas y opción única |
| Fecha y rango | ✅ | calendario de dos meses |
| Chip de estado | ✅ | el filete es estructural |
| Tarjeta | ✅ | de persona y normal |
| Tabla de datos | ✅ | orden, filtros, columnas, CSV |
| Paginación | ✅ | componente compartido |
| Barra de progreso | ✅ | determinada, indeterminada y pasos |
| Aviso temporal | ✅ | cuatro tonos con duración |
| Confirmación | ✅ | en línea, sin diálogo |
| Estados de pantalla | ✅ | seis, con las tres parejas |

---

## Lo que falta — por retorno

### Alto · se necesitan ya

**C-01 · Pestañas.** Una ficha de estudiante tiene datos, asistencia, pagos y
documentos. Sin pestañas eso son cuatro pantallas o un scroll interminable.

**C-02 · Menú de acciones de fila.** Con más de dos acciones por fila, «Editar ·
Eliminar · Duplicar · Exportar» no cabe. El patrón es el «⋯» que despliega. MMI-DS
§9 autoriza Radix precisamente para menú.

**C-03 · Lista de detalle.** Pares etiqueta/valor para las pantallas de consulta:
«DNI 71234567 · Grado 5.º A · Ingreso 01/03/2026». Es la mitad de un sistema de
gestión y no existe.

**C-04 · Encabezado de pantalla.** Título, subtítulo con conteo y acción
principal. Está dibujado en las maquetas pero **no es un elemento**: cada pantalla
lo reinventaría.

**C-05 · Subida de archivo.** El propio catálogo demuestra una importación de 120
filas en la barra de progreso, pero **no hay componente para elegir el archivo**.

### Medio

**C-06 · Panel lateral.** Sustituto del diálogo para formularios cortos, coherente
con la decisión de no usar modales. Entra por el lado y empuja o superpone.

**C-07 · Acordeón.** Existe dentro de la tabla —filas desplegables— pero no como
elemento suelto para agrupar secciones de un formulario largo.

**C-08 · Ayuda emergente.** Para iconos sin texto y para abreviaturas. Hoy solo hay
`title`, que no se ve en móvil ni con teclado.

**C-09 · Avatar.** Se usa en tres sitios —tarjeta de persona, marco y menú de
usuario— con tres implementaciones distintas. **Es el mismo caso que la paginación
duplicada.**

**C-10 · Insignia.** El contador del icono de avisos. Existe en el marco, sin
documentar.

**C-11 · Migas de navegación.** Se usan en las 35 páginas del catálogo y **no están
documentadas como elemento**.

### Bajo

**C-12 · Separador.** Trivial, pero hoy cada bloque decide su propio divisor.

**C-13 · Barra de filtros.** Es una composición de campo y selectores, no un
elemento. Documentarla como composición bastaría.

**C-14 · Buscador global.** El del marco de aplicación, distinto del filtro de
tabla.

---

## Primitivas de dominio — siguen sin construir

Lo que ninguna librería trae y este sistema sí necesita. Ver P-09.

DNI y RUC con dígito verificador · nombres con dos apellidos · ubigeo en
cascada · moneda en soles · fechas peruanas · estados de trámite.

---

## Tres cosas que se usan y no están documentadas

Son deuda: existen en el cascarón pero **no tienen página**, así que nadie sabe
que existen ni cómo consumirlas.

1. **Marco de aplicación** — la lateral plegable con panel flotante, la barra
   superior y el menú de usuario. Es el componente más grande del sistema.
2. **Migas de navegación** (C-11).
3. **Menú de usuario** — avatar, tema y salida.
