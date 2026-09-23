# Aviso de las v1.139.0 y v1.140.0 — para Control Administrativos V2.0

**23 de septiembre de 2026** · MMI-DS **v1.141.0**

```bash
npm install "github:solwarehz/sistema-diseno#v1.141.0"
```

**Esto no responde a ningún requerimiento suyo: son dos cambios que salieron de
mirar su pantalla, y uno de ellos les cambia lo que ven al actualizar.** Va
aparte porque no queríamos que se perdiera dentro de las respuestas a R157 y
R158.

---

## 1 · Lo que cambia sin que toquen nada

**Las fotos de los avatares se reencuadran.** `.avatar img` pasa de recortar por
el centro a `object-position: 50% 30%`. No cambia ninguna API: al instalar, las
caras suben.

El motivo: `object-fit: cover` recorta, y con el punto por omisión una foto
vertical **pierde la parte de arriba** — se corta la cabeza y sobra pecho. Se vio
en la primera fila de su tablero, que es donde se mira primero.

Medido con tres proporciones, cuánta cabeza se corta:

| Foto | Antes (centro) | Ahora (30 %) |
|---|---|---|
| Carnet 3:4 | **5,4 px** | **2,2** |
| Vertical 2:3 | **9,1** | **4,3** |
| Vertical de móvil | **15,2** | **7,8** |

**Lo reduce a la mitad y no lo elimina, y no queremos vendérselo de otra
manera.** Ninguna cifra sirve para todas las proporciones: para no cortar nunca
en un 3:4 haría falta el 16 %, en una vertical de móvil el 9 %, y con eso una
foto ya ajustada pierde la barbilla.

**El arreglo de raíz ya existe en el sistema y sus fotos no están pasando por
él**: `CargaImagen formato="foto"` recorta **1:1 al subir**. Si esas fotos vienen
importadas de otro sitio sin recortar, el tablero está encuadrando lo mejor que
puede sobre un original que no da más. Esa decisión es suya.

**Y las burbujas centran bien su número**, con un anillo claro alrededor.
`.tbl-foto` declara `line-height: 0` para matar el hueco de línea del avatar, y
**la burbuja lo heredaba**: su caja de texto medía cero de alto, así que el
número quedaba descolocado dentro del círculo. Con una cifra casi no se nota;
con dos —`+26`, `+91`— sí. Ahora lo declara ella, porque la burbuja se pone sobre
cualquier contenedor posicionado y no puede depender de lo que ése le herede.

---

## 2 · Lo que cambia si lo adoptan: el tablero llena el área antes de deslizar

Esto salió de una observación sobre su propia pantalla: **el tablero dejaba
media pantalla en blanco y aun así pedía deslizar**. Eso convierte la paginación
por gesto en desbordamiento con otro nombre, que es justo la distinción que les
escribimos en el R157.

Entran tres clases y dos funciones:

| Pieza | Qué hace |
|---|---|
| `tbl-lleno` | El cuerpo llena el alto y **no se desplaza en vertical** |
| `tn-densa-llena` | La rejilla reparte **filas** además de columnas: las celdas se estiran |
| `car-pagina` | Cada parada del carril ocupa el alto completo |
| `useCapacidadTablero` | Mide el área y dice **cuántas caben** |
| `enPaginas` | Trocea la lista en pantallas |

**La capacidad la calcula el sistema, no ustedes.** Es el mismo argumento con el
que el relieve salió a un token: si cada pantalla la mide por su cuenta, la
misma rejilla acaba con tres respuestas. Y **publicamos el gancho, no sólo la
cuenta** — publicar la mitad les habría dejado escribiendo su propio
`ResizeObserver`, que es exactamente el `useEffect` que ustedes retiraron por ser
«código del producto decidiendo maquetación».

El montaje está en el §5 de la respuesta a R157.

Medido en cuatro áreas:

| Área | Pantallas | Reparto | ¿Scroll vertical? |
|---|---|---|---|
| 541 × 131 | 4 | 5+5+5+3 | **no** |
| 293 × 477 (teléfono) | 2 | 12+6 | **no** |
| 753 × 391 (tablet) | **1** | 18 | **no** |
| 1133 × 591 | **1** | 18 | **no** |

---

## 3 · Dos decisiones que descartamos, y por qué

**`grid-auto-flow: column`** habría sido una línea y resolvía el desbordamiento
solo. Cambia el orden de lectura a **columnas**: el segundo cae debajo del
primero, no a su lado. En una lista ordenada por hora es ilegible — y lo avisaron
ustedes cuando pidieron el carril.

**Medir la superficie en vez del carril.** La primera versión medía la caja de
fuera (566 × 156) cuando la rejilla vive en 541 × 131, y **la última fila salía
cortada**. La superficie le quita su relleno y su borde: 26 px medidos.

---

## 4 · Lo que falló por nuestra parte

**La misma ceguera, por tercera vez.** Las clases nuevas entraron pintándose sólo
desde el guion del catálogo, y para cuatro de nuestros candados eso es invisible.
Pasó en la v1.133.0, en la v1.136.0 y otra vez en la v1.139.0 — **las tres veces
con todos los candados en verde**.

Esta vez no se arregló a mano: **se escribió el candado que faltaba**. Un defecto
que vuelve tres veces no es un descuido, es un candado que falta.

**Y el candado nuevo encontró algo peor el día que nació:** la **celda** del
tablero —`tbl-persona`, `tbl-nom`, `tbl-ape`, `tbl-hora`— y la propia `tn-densa`
llevaban ciegas **desde que nacieron**. El arreglo de la v1.134.0 añadió la
superficie, la burbuja, el carril y el avatar, y se dejó justo lo que va dentro.
Ocho versiones entregándoles la pieza central del tablero sin que nadie
comprobara nunca que se entrega igual que se enseña.

Comprobado rompiéndolo a propósito: sacar la celda de la hoja que viaja da
**378 diferencias** donde antes daba verde. Ahora está vigilada.

---

## 5 · Verificación

- Los **24 pasos** del publicador en verde —veinte candados, tres generadores y
  ESLint—, y **1241 pruebas** en 60 archivos.
- Las medidas de este aviso son de navegador, sobre el catálogo.
- **No verificado, y lo decimos:** el `ResizeObserver` no se dispara en el
  navegador de nuestra sesión —comprobado con un observador de prueba: cero
  disparos—, así que la readaptación al cambiar de tamaño la verificamos por el
  respaldo de `resize`, que sí se dispara. En un navegador normal funcionan las
  dos vías; si ven que al girar el teléfono no recalcula, **es esto** y queremos
  saberlo.
