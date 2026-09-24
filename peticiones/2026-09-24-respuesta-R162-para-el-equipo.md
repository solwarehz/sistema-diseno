# Respuesta a R162 — el gancho no se suscribía si la caja aún no estaba montada

**24 de septiembre de 2026** · MMI-DS **v1.148.0**

```bash
npm install "github:solwarehz/sistema-diseno#v1.148.0"
```

**Tienen razón entera, y la parte que más duele es la suya: la v1.147.0 lo
arregló a medias.** Su §2 señala la línea exacta y es la que era. Va todo lo
que piden, incluido el aviso de consola del final.

---

## 1 · Lo que estaba mal, dicho por nosotros

En la v1.147.0 hicimos que `medir` no se rindiera con la caja sin montar
—el comentario que ustedes citan— y **dejamos el `observe` detrás del mismo
guardia**. Medir una vez más no es suscribirse: sin observador, la caja podía
cambiar de tamaño cuantas veces quisiera y nadie se enteraba.

Lo importante no es que fuera medio arreglo: es que **medio arreglo se lee en
verde exactamente igual que uno entero**. Los veintiún candados salieron en
verde con esto dentro, y salieron en verde porque ninguno pregunta *«¿llegó a
observar el nodo?»*.

Y su §3 acierta en algo que nos vamos a quedar: **es un defecto que se cura con
el gesto de ir a mirarlo.** Los dos oyentes de ventana sí quedaban puestos, así
que en escritorio basta mover el borde o abrir las herramientas para que se
arregle solo delante de quien lo busca. En un teléfono no se redimensiona nunca.
No se disculpen por haberlo probado donde no se ve: la forma del fallo lo
favorece, y por eso queda escrito en el contrato.

---

## 2 · Lo que entra: la opción (a), y sin romperles nada

Eligieron bien. **La causa de fondo es de orden, no de código**: un `RefObject`
sólo tiene nodo *después* de pintar, así que cualquier gancho que lo reciba
tiene que **adivinar cuándo mirarlo** — y esa adivinanza falla siempre en el
mismo sitio. La forma que no adivina es la contraria.

`useCapacidadTablero()` ahora devuelve también el `ref`:

```tsx
const { porPagina, columnas, filas, ref } = useCapacidadTablero();
…
<div className="sup sup-exito tbl-lleno" ref={ref}>
```

Lo llama React, con el nodo en la mano, cada vez que cambia. Mide y observa en
ese momento, y si el nodo cambia suelta el anterior antes de coger el nuevo.

**Y el enganche es un estado que se mantiene, no un suceso que ocurrió.** Esto
hay que contarlo porque es lo que hizo falta aprender dos veces: nuestro primer
arreglo se enganchaba **una vez** y se daba por hecho. Salió en verde con 39
pruebas y una auditoría lo tumbó por **tres** sitios, los tres medidos:

| Caso | Qué pasaba | Por qué |
|---|---|---|
| **`StrictMode`** | el camino que recomendamos se quedaba sordo | React vuelve a correr el efecto pero **no** vuelve a llamar la retrollamada del `ref`, y la limpieza anulaba el nodo |
| **la caja se desmonta y vuelve** | se seguía midiendo el nodo viejo, ya desprendido, que mide cero | el vigilante se desconectaba en cuanto enganchaba una vez |
| **el rescate por `resize`** | se perdió | `medir` pasó a leer sólo el nodo propio, y eso era una **regresión** contra la v1.147.0 |

El primero les afecta directamente: **ustedes usan modo estricto.**

**Y hubo un cuarto, que sólo vio una segunda auditoría.** Lo contamos entero
porque es el más instructivo de todos. Arreglamos los tres de arriba haciendo
que el gancho se **reconciliara después de cada render**, y escribimos —aquí
mismo, en la primera versión de esta carta— que con eso la forma con
`RefObject` «ya no tiene ese agujero». El razonamiento sonaba impecable y era
**falso**: el efecto corre después de cada render **del componente que llama al
gancho**, no del árbol. Si la caja la monta **otro** —un `Suspense`, un hijo
`memo` que guarda el `cargando`— ese componente no vuelve a renderizar y **nadie
reconcilia nada**.

Medido: la caja existe, **cero observadores**, capacidad **1×1**. Es el síntoma
exacto de su parte, en el caso exacto que su parte nombra — *«un cargador, una
consulta, un `Suspense`»*. Y ninguna de nuestras pruebas lo veía, porque
**todas** cambiaban el estado en el mismo componente del gancho: un fixture
cómodo es un fixture que miente.

Así que el `MutationObserver` **vuelve**, y esta vez bien: armado **mientras el
gancho viva** —no una sola vez, que fue el segundo error— y sólo para la forma
con `RefObject`. Hace falta mirar el documento porque **un `RefObject` no avisa
cuando se llena**, y eso no se puede arreglar desde dentro. El `ref` de retorno
no necesita nada de esto.

Una cosa más, pequeña y con dientes: **lo que devuelve el gancho se memoriza.**
Envolver la capacidad para añadirle el `ref` hacía que cambiara de identidad en
cada render, y eso dispara los `useEffect`/`useMemo` que dependan de ella — con
un `setState` dentro de uno de ellos, es un bucle.

**La versión es la v1.148.0 y no tienen que cambiarla el mismo día**, que era su
oferta: la firma es **aditiva**. `useCapacidadTablero(caja)` con su `RefObject`
sigue funcionando y el objeto devuelto sigue trayendo `columnas`, `filas` y
`porPagina`, así que un `destructuring` existente no se entera. Si no tocan
nada, **dejan de estar rotos igual**: para esa forma —y sólo para ella— el
gancho mantiene un `MutationObserver` sobre el documento **mientras vive**, y se
engancha en cuanto la caja aparece. Cámbienlo cuando les venga bien; la forma
recomendada es la de arriba y es la que usa nuestro propio catálogo desde esta
versión.

---

## 3 · El aviso que pedían al final

Lo pedían «más barato» y es el que hacía falta. Cuando se pasa un `RefObject` y
la caja aparece **después** del montaje sin que hubiera observador enganchado,
en desarrollo sale, literal:

> `useCapacidadTablero: la caja aparecio DESPUES del montaje y no habia
> observador enganchado; se ha enganchado ahora. Funciona, pero para llegar
> hasta aqui hay que vigilar el documento entero. El camino sin rodeos es el
> «ref» que devuelve el gancho: const { porPagina, ref } =
> useCapacidadTablero() y <div className="… tbl-lleno" ref={ref}>, que React
> llama con el nodo en la mano y no necesita que nadie lo vaya a buscar.`

No sale nunca con el `ref` de retorno, porque ahí el caso no puede darse.

**Y el aviso de la cadena de alto cambió en esta versión**, cosa que conviene
que sepan porque puede empezar a salirles donde antes callaba: su umbral eran
**114** —lo que mide la celda— y ahora son **124**, porque la rejilla reserva
10 px por arriba para que la burbuja no se corte. En esos diez píxeles el
defecto existía y el aviso no decía nada. Lo que no cambia: **un alto de cero
sigue sin avisar**, porque no es una caja corta sino una caja **sin maquetar**
—`display: none`, render en servidor—, y avisar ahí sería ruido en cada pestaña
que nadie mira.

---

## 4 · Lo que hicieron ustedes mientras tanto: déjenlo

Montar el `.sup` y el `.tbl-lleno` siempre, con el spinner **dentro** de la
caja, es lo correcto y lo seguirá siendo. No es el producto decidiendo
maquetación — es el producto dejando de destruir el nodo que la pieza mide. No
hay nada que revertir.

---

## 5 · Cómo lo comprobamos, y qué NO pudimos comprobar

**La prueba se ató al invariante, no al número.** En jsdom no hay maquetado y la
capacidad sale siempre 1×1, así que una prueba que mirara la cifra **habría
salido en verde con el defecto puesto** — que es justo cómo se nos escapó.
Se espía el observador y se pregunta lo único que importa: *¿llegó a observar
ese nodo?* — y, después de la auditoría, también *¿lo sigue observando?*, que es
otra pregunta y es la que faltaba. Con el código de la v1.147.0 devuelto a su
sitio caen **once** pruebas de ese archivo. Este informe llegó a decir «dos» y
después «seis»: las dos eran cifras sin contar, y las dos se corrigieron al
medirlas. Lo decimos en vez de borrarlo porque es el mismo defecto que les
estamos reportando, en pequeño. Cada arreglo tiene además su
mutación: rompimos el código a propósito y vimos caer **la suya**, una por una.

La suite entera: **1282 pruebas en 60 archivos, todas en verde**, más los
veintiún candados, ESLint y `tsc --noEmit` limpio.

En el catálogo, el tablero vive dentro de una sección `display: none` hasta que
se navega a ella —el mismo montaje tardío que ustedes describen—. Medido con la
sección ya visible, en los dos montajes que usan el gancho:

Y se midió en **ocho anchuras**, en los **dos** montajes, con los datos
moviéndose debajo. En las ocho: la primera página pinta **exactamente** la
capacidad, las paradas son **exactamente** `techo(total/capacidad)`, **cero**
desplazamiento vertical dentro del tablero y **cero** desplazamiento horizontal
de la página.

| Ancho | Caja (marco) | Capacidad | Caja (padre liso) | Capacidad |
|---|---|---|---|---|
| 320 | 221 × 146 | 2 × 1 | 221 × 275 | 2 × 2 |
| 360 | 261 × 285 | 2 × 2 | 261 × 275 | 2 × 2 |
| 390 | 291 × 357 | 3 × 2 | 291 × 275 | 3 × 2 |
| 412 | 313 × 387 | 3 × 3 | 313 × 275 | 3 × 2 |
| 768 | 433 × 387 | 4 × 3 | 433 × 275 | 4 × 2 |
| 1024 | 657 × 304 | 6 × 2 | 657 × 275 | 6 × 2 |
| 1280 | 913 × 327 | 9 × 2 | 913 × 275 | 9 × 2 |
| 1440 | 989 × 387 | 10 × 3 | 989 × 275 | 10 × 2 |

**Cómo se tomaron, porque importa:** cada ancho es un **iframe** de ese tamaño
—un iframe es un viewport de verdad para su contenido, con sus media queries y
su `innerWidth`— cargado de cero, **no** la misma ventana redimensionada. Lo
decimos porque redimensionar dispara el rescate por `resize`, que es justo el
trampantojo que su parte denuncia: la medida saldría bien **por el gesto de
medirla**.

**Y lo que no pudimos verificar, lo decimos, con su razón:** en nuestra pestaña
de automatización `document.hidden` es `true` y `requestAnimationFrame` **no
corre** —cero llamadas en 500 ms—, así que el navegador **suspende la entrega
de `ResizeObserver`**: cero disparos incluso con un `div` suelto pasando de 10 a
300 px. Los eventos de `scroll` tampoco llegan. **No es un defecto del
navegador ni del producto: es que la pestaña está oculta**, y lo escribimos
porque sin la razón suena a lo primero. Así que «la caja cambia de tamaño → el observador reacciona» y
«deslizas → la tira dice dónde estás» están probados en pruebas unitarias pero
**no medidos en navegador**. Si en su pantalla ven que al aparecer la caja la
capacidad no salta, díganlo y vamos directos ahí.

---

## 5 bis · Tres defectos que salieron al medir TODAS las pantallas, y no eran del R162

No los buscábamos. Salieron de medir el catálogo a ocho anchos, y los tres
afectan a lo que ustedes instalan:

**(a) `.sr-solo` se escapaba de los contenedores que desplazan.** Es
`position: absolute` con desplazamientos `auto`, y su padre es estático: su
bloque contenedor quedaba **fuera** del carril, así que el recorte no le
aplicaba y **la página entera se desplazaba en horizontal** — medido, **554 px**
a 1024 px (`scrollWidth` 1579 contra 1024). Y esto es lo que lo hace difícil:
**ningún elemento «se salía»**. Todos estaban dentro de algo que recorta; el
recorte no les llegaba.

La hoja declara desplazamiento en **quince** selectores; dos ya eran bloque
contenedor y a los **trece** restantes se les añade `position: relative` — una
línea cada uno y **ningún cambio visual**. Lo vigila una prueba que barre la
hoja entregada regla a regla, no una lista escrita a mano. **Si tienen texto
para lector dentro de una tabla, un diálogo, un panel o un carril, esto les
afectaba**, y les afectaba en silencio.

Y se comprobó donde sí podía romper: el panel flotante de la lateral plegada
sale a propósito del carril de 56 px. Medido, **se sigue pintando 20 px más
allá del borde**, igual que antes.

**(b) La demostración de «padre hostil» era marcado escrito a mano.** Seis
celdas fijas en una caja fija. A 360 px la caja da para 2×2 y las seis seguían
ahí: **la demostración de la regla incumplía la regla.** Ahora monta el gancho
de verdad. Es la misma lección que nos dieron ustedes en el R161, aplicada a
nosotros otra vez.

**(c) La barra del catálogo se salía 22 px a 768.** Envolvía sólo por debajo de
700, un umbral elegido a ojo. Ahora envuelve siempre que haga falta: un umbral
acierta en el ancho en que se miró y falla en el siguiente.

**(d) El índice de parada se desvió 301 px, y lo causó el arreglo (a).** Al
hacer el carril bloque contenedor, el carril pasó a ser el `offsetParent` de sus
paradas — y la cuenta del índice restaba además el sitio del carril, que antes
compensaba y ahora es **sesgo puro**. Medido en nuestro catálogo: **301 px sobre
un paso de 543**, más de media página, así que **en reposo en la página 1 la
tira decía «Pantalla 2 de 4»** dentro de un `aria-live` que lo anuncia. La regla
17(b) del contrato decía que buscar por `offsetLeft` «no se puede equivocar»;
sí puede, y ya no lo dice. **Un arreglo puede abrir un defecto en otro sitio**,
y éste lo destapó la auditoría mirando precisamente lo que el cambio había
movido.

**(e) Y el aviso de caja corta callaba en diez píxeles.** Su umbral eran **114**
—lo que mide la celda— pero la rejilla reserva **10** por arriba para que la
burbuja no se corte, así que una fila pide **124**. En esa franja el defecto
existe y nadie lo dice. Lo encontró **el propio catálogo con el flujo en vivo
corriendo**: caja de 121, fila de 124, **3 px fuera**, el carril desplazándose
en vertical —lo que el sistema promete que no pasa— y el aviso en silencio. Un
umbral que ignora la reserva que la propia cuenta descuenta **miente justo en el
margen donde hace falta**. Si su caja anda cerca de esa medida, ahora se lo
dirá, y con el número correcto.

---

## 5 ter · El tablero con los datos cambiando debajo

Nos lo pidió el responsable —«que funcione como si tuviera socketio»— y lo
decimos con claridad: **el sistema no trae socket.io ni ningún transporte.** De
dónde salen los datos es de ustedes. Lo que sí es del sistema es que la pieza no
mienta cuando la lista se mueve, y eso **no se ve en una demostración estática**.

El catálogo monta ahora un flujo simulado: la gente marca, pasa de «no asistió»
a «asistió», la cuenta se mueve y al completarse el turno la lista **vuelve a
empezar** — que es el caso importante, porque ahí el grupo **encoge** de 24 a 18
y es donde el carril podría quedarse señalando una parada que ya no existe. Se
puede pausar.

Tres cosas que sólo aparecieron con los datos en marcha, y que ya están:

- La clave de cada celda es el **nombre completo**, no el índice. Con el índice,
  al cambiar alguien de grupo React reutiliza el nodo y **la foto de una persona
  se queda puesta en otra**.
- El rótulo dice la **hora real** del último dato. Estaba escrita a mano —
  «07:15» fijo— y con el flujo en marcha eso es una cifra inventada en pantalla.
- El reloj **no retrocede**. La primera versión sacaba una hora al azar y el
  rótulo llegó a decir 07:42 y después 07:29.

---

## 6 · Una corrección nuestra que les afecta al citar

La v1.147.0 publicó cuatro reglas de contrato firmadas **«R162»**. Ese número es
suyo y lo acuñamos nosotros por nuestra cuenta — **la cuarta vez que nos pasa**,
y está registrado como tal en la tabla de concordancia del contrato. Aquellas
cuatro reglas pasan a decir «auditoría de 28 tamaños, v1.147.0», y **R162 es
sólo lo de ustedes**. Las etiquetas y el ZIP de la v1.147.0 no se tocan, así que
si citan aquel documento, es ahí donde está la discrepancia.

---

## 7 · Lo que sigue abierto, y no es nuevo

Dos defectos del tablero siguen **declarados y sin arreglar** en el contrato
(reglas 20 y 21 de «Piezas de tablero»): el alto sin usar cuando hay menos gente
que capacidad, y el nombre compuesto de tres o más raíces que pierde una línea
sin rescate alcanzable sin puntero. Están escritos con su medición al lado
porque preferimos que se lean a que se supongan.
