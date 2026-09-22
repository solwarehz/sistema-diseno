# R157 · Tableros · En Vivo — faltan piezas para una rejilla densa de personas

**Para:** equipo del sistema de diseño
**De:** Control Administrativos V2.0 — grupo nuevo «Tableros»
**Fecha:** 2026-09-22
**Comprobado contra:** `sistema-diseno-ae` v1.132.0, leyendo el paquete instalado

## Qué es la pantalla

Un tablero que se deja abierto en el **celular** y se mira: a las 7:15 dice quién ya
marcó y quién no, y al cierre quién no marcó su salida. No se consulta, se vigila.
Se actualiza sola. Sin fecha: solo el ahora.

**Lo que se reutiliza sin cambios:** `MarcoApp`, `Segmentado`, `SelectorBusqueda`,
`Chip`, `ZonaAvisos`, `EstadoPantalla`.

**Ni `Migas` ni `CabeceraPantalla`, y es deliberado.** Esta pantalla no lleva h1 ni
migas: se deja abierta en un teléfono a las 7 de la mañana y cada línea de cabecera es
una fila de personas que deja de verse. El sitio ya lo dice el menú, que queda marcado
en «Tableros · En Vivo». `AppShell` lo permite sin forzar nada —la prop `titulo` es
opcional, *«se OMITE en los listados»*—, pero **queremos que diseño confirme la
excepción**: si la anatomía de pantalla admite un tipo «tablero» sin encabezado,
mejor escrito en el manual que repetido a mano en cada uno.

## R157.1 · No hay rejilla densa. `tn-cuadricula` no sirve aquí. **Prioridad: alta.**

Necesitamos **6 columnas a 375px** — unos 52px de columna — para que entren 30
personas sin desplazar. Es el requisito del dueño, textual: *«las cards más pequeñas,
que entren más en la pantalla de celular, 6 columnas y 5 filas, sino no podré ver a
todos»*.

`tn-cuadricula` reparte en **columnas de 230px mínimo**: a 375px da **1 columna**.
No es adaptable a este caso, es otro caso.

El manual (§5.5) dice *«No se rehace con `grid-template-columns` en el producto: eso
es exactamente lo que esta clase existe para no repetir»*. Por eso **pedimos la clase
en vez de maquetarla**. Propuesta: `tn-cuadricula-densa`, 6 columnas en móvil y hasta
12 en escritorio, con el mismo `min-width: 0` que ya trae la otra.

`TarjetaPersona` tampoco encaja: es una **fila horizontal** (avatar izquierda, texto
derecha, chip y dato). Lo que hace falta es **vertical y diminuto** — icono arriba,
nombre, apellido y hora debajo.

## R157.2 · `Avatar` no admite estado. **Prioridad: alta.**

Hoy: `{ id, nombre, foto, tamano: 's'|'m'|'l'|'xl', className }`, `border-radius: 50%`,
tamaños fijos 24/32/40/48px.

Nos faltan dos cosas:

1. **Un anillo de estado.** Verde = está dentro, rojo = no está. Propuesta:
   `estado?: 'presente' | 'ausente'`.
2. **Tamaño fluido.** En una rejilla de 6 columnas la celda manda: hace falta
   `width: 100%` con tope (~46px). Los cuatro tamaños fijos no llegan.

**La forma NO se toca: sigue circular.** Llegamos a plantear una variante de cuadrado
redondeado, por aquello de *«así como los iconos de las aplicaciones»*, y el dueño lo
cerró el 22/09/2026: *«el avatar está definido circular, que siga circular, es lo
usual»*. El `border-radius: 50%` del sistema se queda como está y nuestro CSS no lo
sobrescribe — solo ajusta tamaño y márgenes.

## R157.3 · La burbuja existe pero está encerrada y solo es roja. **Prioridad: media.**

`.badge` ya está (`componentes.css`, min-width 15px, radio 6px, esquina superior
derecha) y es exactamente la pieza. Dos problemas:

- Vive bajo **MARCO DE APLICACIÓN** (`.badge-*`), pensada para el icono de
  notificaciones del marco. No hay forma publicada de ponerla sobre un `Avatar`
  cualquiera.
- Va fija a `var(--error-acento)`. Necesitamos **dos tonos**: rojo para los minutos
  de tardanza (`+9`) y **verde** para los minutos de anticipo (`−30`).

Propuesta: sacarla a componente propio con `tono: 'error' | 'exito'`, o un prop
`burbuja?: { tono, texto }` en `Avatar`.

## R157.4 · No existe indicador de «en vivo». **Prioridad: baja.**

Un punto que late + hora, para que se vea que el tablero está conectado y no colgado.
No hay nada equivalente en el paquete. Si diseño prefiere resolverlo con `Chip`, nos
vale — pero entonces digan con qué tono, porque verde y rojo ya están ocupados por el
estado de las personas.

## R157.5 · Carril horizontal con anclaje. **Prioridad: media.**

El dueño lo dejó claro: *«no se pagina, es scroll horizontal»*. El tablero se desliza
como las páginas de iconos de un teléfono — cada parada es una pantalla completa de
6×5 y el anclaje evita quedarse a medio camino entre dos personas.

Ojo a un detalle que no es evidente y que obliga a partir la lista en bloques en vez
de usar una sola rejilla que fluya en horizontal: **el orden se lee por filas** (el
último arriba a la izquierda, el anterior a su derecha). Una rejilla con
`grid-auto-flow: column` pondría al segundo DEBAJO del primero, no a su lado.

Hoy lo resolvemos con un `flex` + `scroll-snap-type: x mandatory` y un `<ul>` por
pantalla. Si diseño publica el carril, esto se borra. Y si el manual §5.4 —*«En móvil
la tabla se convierte en tarjetas. No se hace scroll horizontal»*— cubre también a los
tableros, **díganlo**: aquí el deslizamiento es la forma pedida, no un desbordamiento
accidental, pero preferimos que la excepción la firmen ustedes.

## R157.6 · El grupo necesita fondo propio. **Prioridad: media.**

*«Para adentro con su fondito característico, que hagan una cosa profesional»*
(dueño, 22/09/2026). El panel entero se tiñe con el grupo que se está mirando, de modo
que no haga falta leer la pestaña para saber dónde estás.

Lo hemos hecho con `--exito-fondo` / `--error-fondo` y el acento del sistema en el
borde — **tokens publicados, ningún color inventado**. Lo que pedimos es la pieza:
una superficie de estado con su tono (`exito` / `error`), reutilizable. Hoy el sistema
publica el tono para `Chip` y para el filete de `TarjetaPersona`, pero no hay un
contenedor tonal.

## R157.7 · `Avatar` sin relieve. **Prioridad: media.**

*«Las fotos con sombra, que parezca 3D»*. Hoy `Avatar` es plano: ni elevación ni
prop para pedirla.

Lo que hemos montado provisionalmente son tres sombras que actúan como una: el anillo
de estado, una sombra de contacto corta y pegada, y otra larga y difusa que despega el
icono del fondo, más un `inset` claro arriba que simula la luz sobre un botón físico.
Es exactamente lo que hace que una rejilla de fotos pequeñas deje de parecer una hoja
de cálculo.

Propuesta: `elevacion?: 'plana' | 'relieve'` en `Avatar`, o una clase publicada. Si el
sistema tiene ya una escala de sombras (no la hemos encontrado en los tokens), que
salga de ahí y no de valores nuestros.

## Dos preguntas de norma, no de componente

### La primera: el color sin texto

`TarjetaPersona` lleva esta regla en el código: *«El chip con TEXTO acompaña siempre al
filete: el color solo no distingue nada»*. En una celda de 52px **no cabe un chip de
texto por persona**.

Cómo creemos que se cumple igual, y queremos que diseño lo confirme o lo corrija:

- Nunca se ven los dos grupos a la vez. El `Segmentado` de arriba dice cuál se está
  mirando, con texto y recuento: **«Asistió 30» / «No asistió 11»**.
- Cada icono lleva **su hora debajo**, en texto.
- El panel entero se tiñe con el grupo (R157.6).
- El color es refuerzo, no el único portador.

Si aun así hace falta algo por icono, díganlo y rediseñamos: a 52px la alternativa
sería un glifo, no texto.

### La segunda: los rótulos de los dos grupos

El dueño los fijó el 22/09/2026: **«Asistió» / «No asistió»**. Los guardamos en una
constante para que se cambien en una línea.

Dejamos anotado, sin discutir lo decidido, que la pertenencia al grupo la da la
**paridad de las marcas** —1.ª entró, 2.ª se fue, 3.ª volvió…—, así que a las 17:20
quien fichó su salida cae en «No asistió» habiendo asistido. Por la mañana, que es
cuando se mira el tablero, el rótulo es exacto. Si diseño tiene una fórmula que sirva
a las dos horas sin alargarse, la escuchamos.

## Verificado por nuestra parte

- **Nada desborda a 375px.** Medido elemento a elemento: 0 desbordes fuera de
  contenedores con `overflow-x` intencionado. (Checklist §6 del manual.)
- Maqueta con los 8 pasos, para ver los componentes en contexto.
