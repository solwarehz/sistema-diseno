# Pedido al sistema de diseño

**De:** Control Administrativos V2.0
**Versión evaluada:** v1.19.0 (instalada y en ejecución)
**Fecha:** 2026-08-09

---

## 🔴 RETIRAMOS R26 — el defecto no existe, y el fallo fue de nuestra medición

**Lo primero, porque os puede estar costando tiempo ahora mismo.**

Os reportamos que el lateral no encogía al plegarse: clase aplicada, regla
servida, elemento casando con el selector, y ancho calculado inmóvil en 236 px.
Dijimos que no teníamos diagnóstico. **Vuestro componente está bien; el que
medía mal era el nuestro.**

**La causa, y es instructiva:**

```
document.visibilityState                    →  "hidden"
transición de width, playState              →  "running"
transición, currentTime / duración          →  0 ms / 220 ms
```

Medíamos desde una pestaña **en segundo plano**. El navegador **no avanza las
transiciones CSS en una pestaña que no se pinta**, así que la de `width` se
quedaba congelada en el milisegundo cero — y en el milisegundo cero el ancho es
todavía el de partida, 236 px. Para siempre, mientras nadie mire.

**Forzando el final de la transición: 56 px.** Correcto. Y un elemento nuevo
con las mismas clases, creado en el mismo padre, ya daba 56 px desde el
principio —**esa era la pista que teníamos delante y no supimos leer**: si la
regla aplica a un elemento limpio y no al que lleva rato en pantalla, la
diferencia no está en la cascada, está en el tiempo.

**Lo que nos llevamos, y os puede servir:** una medición hecha en una pestaña
oculta **no vale para nada que dependa de animaciones, transiciones o
`requestAnimationFrame`**. Si vuestra comprobación futura monta componentes y
le pregunta al navegador —la que os sugerimos y aceptasteis—, **tendrá que
asegurarse de que la página está visible**, o desactivar las transiciones antes
de medir. Nosotros no lo hicimos y os mandamos un defecto inexistente.

**Disculpad el rodeo.**

---

## ✅ R25 — cerrado y verificado

El botón de plegar ya enseña un solo icono en escritorio:

```
.ic-escritorio   display: grid    ← visible
.ic-movil        display: none    ← oculto, correcto
```

Medido a 1440 px sobre el botón pintado.

---

## Lo que sigue esperando decisión, y no es vuestro

**Los seis tokens `--ambito-alt-*`.**

Nuestro responsable ha decidido **no autorizarlos por ahora**, y con un motivo
que conviene que sepáis para que no quede como un cajón abierto: **hoy es el
único integrante del equipo y no hay entorno de producción**, así que los cinco
casos que sostenían el pedido —operador frente a cliente, modo soporte,
entornos, privilegio elevado, datos de demostración— **no le aplican todavía**.

**El pedido no se retira: se aplaza.** El diagnóstico está aceptado por
vosotros y el nombre acordado, así que el día que exista el modo soporte —que
está en el plan— retomarlo será media conversación y no una nueva.

---

## Y una observación vuestra que nos hemos aplicado

Lo que escribisteis sobre los `.md` de memoria desfasados —*«un registro
desfasado es peor que ninguno, porque se lee como si fuera cierto»*— **nos ha
hecho revisar los nuestros**. Teníamos exactamente el mismo problema:
documentos que daban por pendientes cosas ya entregadas, y un documento de
requerimientos con **tres números repetidos** porque se refundieron dos y nadie
renumeró.

Y vuestra decisión de **no** reescribir el plan original, sino ponerle un aviso
que remite al estado real, es la correcta: cambiar sus cifras habría borrado lo
que el registro dice que se pensó entonces.

---

# Pedido del 2026-08-10 · sobre la v1.19.0

**Primero, un cierre que os debíamos:** hoy retiramos entera nuestra paleta
anterior al sistema —el `:root` institucional, su tabla de modo oscuro y la
capa de compatibilidad que traducía nombre viejo a token vuestro, unas 280
líneas—. Verificado antes de retirar: cero consumidores fuera de comentarios,
`tsc` limpio, el candado en 0 errores. Vuestros tokens ya visten la aplicación
sin intermediarios.

Lo que queda en nuestro CSS ya no es preferencia: es lo que el paquete no
publica todavía. Son tres pedidos, cada uno desde el caso general.

## R27 · Tokens de movimiento

Todo consumidor anima algo: un panel que se despliega, un diálogo que aparece,
un aviso que permanece. El sistema define color, tipografía y espacio, pero no
tiempo, así que cada producto inventa duraciones y curva y reimplementa
`prefers-reduced-motion` regla a regla — la misma divergencia que los hex a
mano que vuestra paleta eliminó. Hoy tenemos en literales: `0.2s` y
`cubic-bezier(0.16, 0.84, 0.44, 1)` para paneles, `0.16s` para diálogos, `5s`
de permanencia de aviso. **Pedimos una escala corta de duraciones, una curva
estándar y la política de movimiento reducido resuelta una sola vez.**

## R28 · Publicar la tarjeta que el catálogo ya tiene

Cualquier consumidor con una tabla necesita el marco que encierra barra + tabla
+ pie. El catálogo lo resuelve con `.bloque`, pero `componentes.css` publica
**0 reglas** para ella, así que cada consumidor copia las cuatro declaraciones
a mano y las copias divergen en vuestra primera revisión. **Pedimos que la
tarjeta viaje en el paquete** — regla `.bloque` o componente `Tarjeta`, como os
encaje.

## R29 · El contenedor de los avisos

El `Aviso` está publicado y lo usamos; **dónde vive, no**. La zona apilada del
viewport tiene dos exigencias que no son de estilo y que cada consumidor puede
perder al reescribirla: debe existir desde la carga aunque esté vacía (una
región viva creada en el momento del fallo no la anuncian la mayoría de
lectores de pantalla) y bajo ~760px deja de flotar y ocupa el ancho inferior.
**Pedimos el contenedor publicado** con anclaje, apilado y respuesta móvil
resueltos.

## R30 · El pie del lateral: el cascarón lo tiene, `MarcoApp` no

Vuestro cascarón de referencia pinta al pie del menú lateral la identidad de la
sesión —avatar, nombre y correo—. **`MarcoApp` v1.19.0 no lo renderiza ni tiene
ranura para él** (leído en el fuente: el `aside` lleva solo navegación; la
identidad vive únicamente en el `MenuUsuario` de la barra). Nuestro responsable
lo detectó a la vista, comparando el producto con el cascarón.

El caso general: en cualquier producto con varios perfiles, saber quién está
dentro **de un vistazo y en permanencia** evita operar con la sesión
equivocada; el avatar de la barra lo dice solo tras un clic. El cascarón ya
tomó la decisión — pedimos el componente, no el criterio. Los datos ya viajan
en la propiedad `usuario`, así que probablemente no haga falta ni una propiedad
nueva. Con el lateral plegado, adoptamos lo que el cascarón haga.

## R31 · Columnas visibles controladas

La elección de columnas es una preferencia de la persona, y una que no persiste
no es una preferencia. En TablaDatos, `ocultas` es estado interno: no se puede
sembrar al montar y `alCambiar` no lo emite, así que cualquier producto que
guarde la elección en el perfil no puede honrarla. Pedimos la pareja controlada
(`ocultas`/`onOcultas`), o un valor inicial + el dato en `alCambiar`.

## R32 · Una ranura de acciones en la barra

La tabla casi nunca viaja sola: junto a «Filtros» y «Columnas» los productos
ponen su exportación, su impresión, su acción por lotes. Hoy no hay ranura y
esas acciones se pintan fuera de la tarjeta — nuestro CSV flota encima y se
nota que no pertenece. Pedimos una ranura (`acciones?: ReactNode`) en la barra.
Sin comportamiento: solo el sitio.

## R33 · Filtros de columna con dominio cerrado

Hay columnas cuyo dominio es cerrado — un estado, un tipo, una sede — y su
filtro natural es elegir, no adivinar el texto: quien teclea «vigente» porque
recuerda el sinónimo y no el literal concluye que no hay resultados. Pedimos
que `Columna` admita opciones de filtro y la fila pinte un selector en esas
columnas, con texto libre para el resto.
