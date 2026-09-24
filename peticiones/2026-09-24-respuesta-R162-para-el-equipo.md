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

El primero les afecta directamente: **ustedes usan modo estricto.** Ahora el
gancho se **reconcilia después de cada render** —una comparación de
referencias, sin forzar maquetado cuando no hay nada que cambiar—, y el
`MutationObserver` sobre el documento entero sobra y se ha ido.

Una cosa más, pequeña y con dientes: **lo que devuelve el gancho se memoriza.**
Envolver la capacidad para añadirle el `ref` hacía que cambiara de identidad en
cada render, y eso dispara los `useEffect`/`useMemo` que dependan de ella — con
un `setState` dentro de uno de ellos, es un bucle.

**La versión es la v1.148.0 y no tienen que cambiarla el mismo día**, que era su
oferta: la firma es **aditiva**. `useCapacidadTablero(caja)` con su `RefObject`
sigue funcionando y el objeto devuelto sigue trayendo `columnas`, `filas` y
`porPagina`, así que un `destructuring` existente no se entera. Si no tocan
nada, **dejan de estar rotos igual**: cuando al montar la caja no está, el
gancho pone un `MutationObserver`, se engancha en cuanto aparece y se
desconecta. Cámbienlo cuando les venga bien; la forma recomendada es la de
arriba y es la que usa nuestro propio catálogo desde esta versión.

---

## 3 · El aviso que pedían al final, palabra por palabra

Lo pedían «más barato» y es el que hacía falta. Cuando se pasa un `RefObject` y
al montar la caja todavía no está, en desarrollo sale:

> `useCapacidadTablero: la caja todavia no esta montada. Se vigilara hasta que
> aparezca, pero el camino sin rodeos es el `ref` que devuelve el gancho:
> `const { porPagina, ref } = useCapacidadTablero()` y
> `<div className="… tbl-lleno" ref={ref}>`.`

No sale nunca con el `ref` de retorno, porque ahí el caso no puede darse.

Y el aviso viejo —el de la cadena de alto— sigue donde estaba, con una cosa que
conviene que sepan: **sólo salta con alto mayor que cero**. Un alto de cero no
es una caja pequeña, es una caja **sin maquetar** —`display: none`, render en
servidor—, y avisar ahí sería ruido en cada pestaña oculta.

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
sitio caen **seis** pruebas; la primera redacción de este informe decía «dos» y
era una cifra sin contar, corregida al medirla. Cada arreglo tiene además su
mutación: rompimos el código a propósito y vimos caer **la suya**, una por una.

La suite entera: **1278 pruebas en 60 archivos, todas en verde**, más los
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

**Y lo que no pudimos verificar, lo decimos:** en nuestra pestaña de
automatización `ResizeObserver` **no dispara nunca** —cero llamadas incluso con
un `div` suelto al que le cambiamos el ancho— y los eventos de **`scroll`
tampoco**. Así que «la caja cambia de tamaño → el observador reacciona» y
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

**(d) Y el aviso de caja corta callaba en diez píxeles.** Su umbral eran **114**
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
