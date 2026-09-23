# Aviso de las v1.139.0 a v1.145.0 — para Control Administrativos V2.0

**23 de septiembre de 2026** · MMI-DS **v1.145.0**

```bash
npm install "github:solwarehz/sistema-diseno#v1.145.0"
```

**Esto no responde a ningún requerimiento suyo: son seis versiones seguidas que
salieron de mirar su pantalla, y cuatro de ellas les cambian lo que ven al
actualizar.** Va aparte para que no se pierda dentro de las respuestas a R157 y
R158.

> **Una advertencia sobre este documento.** Se escribió cuando el sistema iba
> por la v1.141.0 y se ha reescrito entero: la versión anterior traía una tabla
> de recortes de foto que el propio sistema retiró después, y un párrafo que
> desaconsejaba justo lo que la v1.143.0 acabó haciendo. Lo cazó una auditoría
> antes de que saliera. Lo decimos porque es exactamente el defecto que estas
> cartas existen para no cometer.

---

## 1 · Lo que cambia sin que toquen nada

**Las fotos de los avatares se reencuadran.** `.avatar img` pasa de recortar por
el centro a `object-position: 50% 10%`. Ninguna API cambia: al instalar, las
caras suben. Afecta a **todo avatar con foto del producto**, no sólo al tablero.

Medido, con la cabeza empezando al 5 % del alto y una caja de 48 px — cuánta
cabeza se corta:

| Foto | Antes (el centro) | v1.140.0 (30 %) | **Ahora (10 %)** |
|---|---|---|---|
| Carnet 3:4 | 4,8 px | 1,6 | **no corta** |
| Vertical 2:3 | 8,4 | 3,6 | **no corta** |
| Vertical de móvil | 14,4 | 6,9 | **no corta** |

La v1.140.0 lo dejó en 30 % y aquí les dijimos que *«lo reduce a la mitad y no lo
elimina»*. Era cierto y no bastaba: **se volvió a ver en un teléfono**. Bajar al
10 % no tiene coste — en una foto cuadrada o apaisada no hay recorte vertical que
repartir, así que ese valor sólo actúa donde hay un problema.

**El arreglo de raíz sigue siendo otro**, y es suyo: `CargaImagen formato="foto"`
recorta **1:1 al subir**. Si las fotos llegan importadas sin pasar por ahí, el
tablero encuadra lo mejor que puede sobre un original que no da más.

**Y la burbuja se muda a la esquina del disco.** Estaba en la esquina de la
*caja*, y el avatar es un círculo **inscrito** en ella: su centro caía **dentro**
del disco y se comía la foto. Ahora apoya en el borde y el solape es **0,15 de su
diámetro** — 2,3 px con «1», 3,2 con «+26», 4,1 con «+120». De paso centra bien
su número: heredaba `line-height: 0` y la cifra quedaba descolocada.

**El círculo lo dibuja el texto**, no al revés: el ancho sale del contenido y el
alto lo copia. 16 px con «1», 22 con «+26», 28 con «+120». No hay tope de ancho.

---

## 2 · Lo que cambia si adoptan el tablero que llena

**Primero llena el área, y sólo después desliza.** Salió de ver su pantalla
dejando media pantalla en blanco y pidiendo deslizar igual — eso convierte la
paginación por gesto en desbordamiento con otro nombre.

| Pieza | Qué hace |
|---|---|
| `tbl-lleno` | El cuerpo llena el alto y **no se desplaza en vertical** |
| `tn-densa-llena` | La rejilla reparte **filas** además de columnas |
| `car-pagina` | Cada parada del carril ocupa el alto completo |
| `useCapacidadTablero` | Mide el área y dice **cuántas caben** |
| `enPaginas` | Trocea la lista en pantallas |
| `cuentaBurbuja` | Acorta un número largo a tres caracteres |

**La capacidad la calcula el sistema, no ustedes** — si cada pantalla la mide por
su cuenta, la misma rejilla acaba con tres respuestas. Y **publicamos el gancho,
no sólo la cuenta**: publicar la mitad les habría dejado escribiendo su propio
`ResizeObserver`, que es el `useEffect` que ustedes retiraron por ser «código del
producto decidiendo maquetación».

### Y aquí va lo único que pueden montar mal

**La referencia de `useCapacidadTablero` va en el `tbl-lleno`, NO en el carril.**

```tsx
<div className="sup sup-exito tbl-lleno" ref={caja}>   // ← aquí
  <div className="car car-pagina">                     // ← NO aquí
```

El carril es `height: 100%`, y si su padre no tiene alto definido eso resuelve al
alto del **contenido**: capacidad de una fila → se pintan tres personas → el
contenido sigue midiendo una fila. **Estable en el sitio equivocado.** Si ven
tres tarjetas y el resto de la pantalla vacío, es esto. `tbl-lleno` no puede caer
ahí porque lleva `overflow: hidden`.

El montaje completo está en el §5 de la respuesta a R157.

### Cuántas personas por pantalla, recalculado

| Área de la rejilla | Por pantalla |
|---|---|
| 293 × 477 (teléfono de 360) | 9 |
| 323 × 621 (teléfono de 390) | 15 |
| 701 × 277 (tablet apaisada) | 14 |
| 957 × 531 (escritorio) | **40** |

---

## 3 · Menos gente por pantalla, y por qué lo pagamos

El suelo de fila pasó de 100 a **114 px** en la v1.142.0, y el nombre va a **una
línea** en este modo. **En un teléfono de 360 se pasa de 12 personas por pantalla
a 9.**

Se paga porque con 100 la fila se quedaba corta y los hijos **se encogían en
silencio**: un apellido de dos líneas se pintaba a 13 px donde pide 27,5 — una
línea entera desaparecida, y `scrollHeight` no lo denunciaba. Un recorte que ni
siquiera se veía como recorte.

Se midieron también los 128 px que cubrirían el nombre a dos líneas y se
descartaron: bajaban el escritorio de 40 personas a 30 para cubrir un caso que el
nombre **corto** no produce.

---

## 4 · Dos decisiones que descartamos, y por qué

**`grid-auto-flow: column`** habría sido una línea. Cambia el orden de lectura a
**columnas**: el segundo cae debajo del primero, no a su lado. En una lista
ordenada por hora es ilegible — y lo avisaron ustedes.

**Un tope de ancho en la burbuja.** Se puso y se quitó en la misma versión: un
tope es un círculo fijo dentro del cual meter el número, que es lo contrario de
dibujar el círculo sobre el texto.

---

## 5 · Lo que falló por nuestra parte

**La misma ceguera, tres veces.** Las clases nuevas entraron pintándose sólo
desde el guion del catálogo, y para cuatro de nuestros candados eso es invisible.
Pasó en la v1.133.0, la v1.136.0 y la v1.139.0 — **las tres con todo en verde**.
La tercera vez no se arregló a mano: se escribió el candado que faltaba.

**Y el candado nuevo encontró algo peor el día que nació:** la **celda** del
tablero y la propia `tn-densa` llevaban ciegas **desde que nacieron**. Ocho
versiones entregándoles la pieza central del tablero sin que nadie comprobara que
se entrega igual que se enseña.

**Después, tres auditorías en paralelo encontraron nueve defectos más**, ocho en
código escrito ese mismo día — entre ellos que la cuenta elegía mal el hueco y
dejaba cuatro celdas fuera de la pantalla, y que la lista entera podía
desaparecer sin error con un valor no numérico.

**Y dos contradicciones en nuestra propia documentación**: el contrato titulaba
un valor de encuadre que la hoja ya no entregaba, y afirmaba un `line-height` que
la hoja nunca tuvo. Ninguna la veía un candado. Ahora sí: **lo que el contrato
cita, la hoja tiene que entregarlo.**

---

## 6 · Verificación

- Los **25 pasos** del publicador en verde —veintiún candados, tres generadores y
  ESLint—, y **1257 pruebas** en 60 archivos.
- Las medidas de este aviso son de navegador, sobre el catálogo, salvo las
  capacidades, que salen de la función que ustedes van a usar.
- **No verificado, y lo decimos:** el `ResizeObserver` no se dispara en el
  navegador de nuestra sesión —comprobado con un observador de prueba: cero
  disparos—, así que la readaptación al cambiar de tamaño la verificamos por el
  respaldo de `resize`, que sí se dispara. En un navegador normal funcionan las
  dos vías; si ven que al girar el teléfono no recalcula, **es esto** y queremos
  saberlo.
