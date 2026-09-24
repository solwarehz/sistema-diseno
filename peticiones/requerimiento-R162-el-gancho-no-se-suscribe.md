# R162 — `useCapacidadTablero` no se suscribe si la caja aún no está montada

**24 de septiembre de 2026** · contra **MMI-DS v1.147.0** · severidad: **alta**
· reproducido **en producción**, en un teléfono

---

## 1 · Lo que se ve

Tablero En Vivo con 27 personas dentro. El rótulo dice «Dentro 27» y la
pantalla enseña **una sola tarjeta**, arriba a la izquierda, con el resto de la
superficie tonal vacía. El carril tiene **27 paradas de una persona**.

No es la cadena de alto: esa está bien y la medimos. `.tbl-lleno` mide
**317 × 572 px** a 390 × 844, que son exactamente **3 columnas × 4 filas = 12
por página**. La caja está bien. Lo que está mal es **cuándo** se la mide.

---

## 2 · La causa, en una línea

`componentes/src/tablero.ts`, dentro del efecto de `useCapacidadTablero`:

```js
const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(medir) : null;
if (caja.current) ro?.observe(caja.current);   // ← si es null, no observa NUNCA
…
}, [caja]);                                     // ← ref estable: el efecto corre UNA vez
```

En la v1.147.0 arreglaron que **`medir` no se rindiera** con la caja sin montar
—el comentario lo cuenta: *«NO SE SALE SI LA CAJA AUN NO EXISTE»*— pero **el
mismo agujero siguió en la suscripción**. Y es la suscripción la que tenía que
traer la segunda oportunidad.

La cadena completa:

1. La pantalla monta el carril de forma condicional: mientras `cargando`, el
   `.sup` con `.tbl-lleno` dentro **no existe**.
2. El efecto corre en el montaje. `caja.current` es `null`, así que `medir()`
   vuelve sin medir **y** `ro.observe()` no llega a llamarse.
3. `[caja]` es un objeto ref estable: **el efecto no vuelve a correr jamás**.
4. Llega la respuesta, el `.tbl-lleno` aparece… y no lo observa nadie.
5. La capacidad se queda en el `capacidadDeRejilla(0, 0)` del `useState`
   inicial: **1 × 1**.

Y la rejilla es `auto-fill`, así que dibuja sus tres columnas igualmente aunque
solo le entregues un elemento. De ahí la tarjeta suelta con el hueco al lado.

---

## 3 · Por qué costó verlo, y por qué nos parece lo más importante de este parte

Los dos oyentes de ventana **sí** quedan registrados:

```js
window.addEventListener('resize', medir);
window.visualViewport?.addEventListener('resize', medir);
```

Así que **el primer redimensionado de ventana lo arregla solo**. En escritorio
basta con mover el borde de la ventana una vez —o abrir las herramientas de
desarrollo— para que la capacidad salte a su valor bueno y el defecto
desaparezca delante de quien lo está buscando.

En un teléfono no se redimensiona nunca. La capacidad se queda en 1 × 1 **toda
la sesión**.

Es un defecto que **se cura con el gesto de ir a mirarlo**. Lo decimos porque
creemos que es lo que hizo que R161 se diera por cerrado: se verificó en
escritorio, y en escritorio no se manifiesta. La culpa de eso es nuestra, no
suya —lo probamos donde no se ve—, pero la forma del fallo lo favorece y vale
la pena que quede escrita.

---

## 4 · Lo medido

Con **su** CSS y **su** contrato de marcado, a 390 × 844, con la misma caja de
317 × 572 px en los dos casos:

| Cuándo se monta `.tbl-lleno` | Capacidad que acaba usando la pantalla |
|---|---|
| **Después** del efecto (montaje condicional) | **1 × 1** |
| **Antes** del efecto (caja siempre presente) | **3 × 4 = 12** |

Y con la caja siempre presente, la medida inicial ya es correcta **incluso con
un spinner dentro**: `.tbl-lleno` lleva `overflow: hidden`, así que su tamaño no
lo decide su contenido. 27 personas → 3 paradas, rejilla pintada de 3 columnas
× 4 filas, sin desbordar.

---

## 5 · Lo que pedimos

**Que el observador se enganche cuando la caja aparece, no solo si ya
existía.** No pedimos un valor ni una regla de CSS: pedimos que la pieza
cumpla lo que su propio comentario ya promete para `medir`.

Dos formas, y la elección es suya:

**a) Un ref de retrollamada.** `useCapacidadTablero` devuelve también el ref que
hay que colgar del nodo, y mide y observa en el momento en que React se lo
entrega. Es la que resuelve el problema de raíz, porque deja de depender de que
el nodo exista en un instante concreto.

**b) Observar un antepasado estable además de la caja**, o re-observar cuando
`caja.current` pase de `null` a nodo. Menos limpio, pero no cambia la firma
pública y no rompe a nadie.

Si eligen **(a)**, la firma cambia y nosotros la adoptamos sin problema: dígannos
la versión y la cambiamos el mismo día.

**Y una segunda cosa, más barata:** el aviso de consola que ya existe para la
cadena de alto rota nos habría ahorrado este viaje si también cubriera este
caso. Hoy solo salta cuando la caja mide poco; aquí la caja medía **bien** y lo
que fallaba era que nadie la miraba. Un aviso en desarrollo del tipo «la caja
apareció después del montaje y no hay observador enganchado» sería exactamente
el que hacía falta.

---

## 6 · Lo que hemos hecho nosotros mientras tanto

Montamos el `.sup` y el `.tbl-lleno` **siempre**, y metimos el spinner y los
estados vacíos **dentro** de la caja en vez de en su lugar.

Queremos ser explícitos en que **no hemos tocado ni una regla de CSS ni hemos
puesto ningún valor propio**: no es el producto decidiendo maquetación —que es
justo lo que retiramos en R158.2 y por lo que nos dieron la razón—, es el
producto dejando de destruir el nodo que la pieza necesita medir. Si la pieza se
arregla, nuestro cambio sigue siendo correcto y no hay nada que revertir.

Lo dejamos anotado ahí mismo, en el comentario de la pantalla, con la fecha y
las medidas, para que el siguiente que lo lea no lo deshaga sin saber.
