# Deuda abierta de móvil primero — medida, no estimada

**22 de septiembre de 2026** · encontrado por la auditoría de la v1.134.0

**Esto no se entrega a nadie: es registro interno.** La política de móvil primero
es vinculante desde el 19/09/2026 y dice que *lo que no la cumpla no entra en la
entrega*. Lo que sigue **ya estaba dentro** y no se midió al escribirla. Se anota
con su daño real para que la próxima versión no vuelva a decir «pendiente de
medir» sobre algo que, medido, no sirve en un teléfono.

Medido con el catálogo dentro de un marco de **360 px** de ancho real.

---

## 1 · Quince recortes sin rescate de ninguna clase

`sistema/componentes/componentes.css` tiene **15** `text-overflow: ellipsis` y
**3** `-webkit-line-clamp`: **18 reglas en 9 componentes**. De las 18, **15 no
tienen ni `title`**, y las 3 que lo tienen no cumplen igual, porque la política
dice que `title` no basta en un teléfono.

Ordenado por daño medido:

| Clase | Componente | Medido a 360 px | Qué se pierde |
|---|---|---|---|
| `.cx-nombre` | `FilaCarga` | **29 px de caja para 128 px de texto** | `acta-bimestre-III-2026.pdf` → `ac….pdf`. Quedan ~4 letras del nombre del archivo |
| `.tb-ancla` | `TablaDatos` | **158,4 px para 228-246 px** | El **nombre de la persona a la que pertenece la fila**. Es la columna que siempre se ve |
| `.pb-det` | `PanelBarra` | clamp a 2 líneas | El cuerpo de la notificación: el motivo por el que se abre el panel |
| `.tp-nom`, `.tp-cargo` | `TarjetaPersona` | — | Nombre y cargo. El `title` del avatar hermano **no** cubre estos nodos |
| `.us-nom`, `.us-mail` | `MenuUsuario` | — | **Con qué cuenta se está operando** |
| `.lat-user-nom`, `.lat-user-mail` | `MarcoApp` | no recorta con el dato de muestra | Daño latente: depende del dato |
| `.cx-et` | `FilaCarga`, `CargaImagen` | `min-width: 3ch` | Qué se está adjuntando |
| `.sg-ej` | `Segmentado` | — | El ejemplo de formato: lo que dice cómo escribir el dato |
| `.app-tab-txt` | `MarcoApp` | — | **El rótulo de la barra inferior del móvil.** La clase más expuesta al teléfono de toda la lista |
| `.app-lista-tx` | `MarcoApp` | — | Rótulo en la lista de «Más» |
| `.lat-marca-texto` (×2) | `MarcaMenu` | clamp 2 y 1 | Nombre del colegio sin logo |
| `.nav-nieto .nav-txt` (×2) | `MarcoApp` | sólo `title` | Opción de tercer nivel del menú |
| `.pm-nom-txt` | `PanelPrivilegios` | sólo `title` | Nombre de fila de la matriz — **el defecto original del R151** |

---

## 2 · `MarcoApp` arranca ancho, y se ve

`componentes/src/MarcoApp.tsx:151` → `useState(false)`, y el repliegue vive en un
`useEffect` que React ejecuta **después de pintar**. El propio comentario dice
«montado ya en angosto, arranca plegado», pero eso ocurre un cuadro más tarde.

Medido: el estado inicial da un lateral de **236 px sobre una pantalla de
360 — el 65,6 %** con el velo visible; el estado al que llega es **56 px**. Y
`.lat` lleva `transition: width var(--dur-lenta)` = **220 ms**, así que no es un
salto invisible: **es una animación de 236 a 56 px que se ve en cada carga en un
teléfono.**

Es exactamente «escritorio primero con un parche», el caso que la política §5.1
nombra y prohíbe.

**No se arregla en la v1.134.0 a propósito:** toca el primer pintado de todos los
productos y no es del R157. Entra como trabajo propio, con esta medición delante.

---

## 3 · Dos desbordamientos que no son paginación por gesto

- **`TablaDatos` a 360 px**: visible 285 px, contenido **1.517 px** → **5,3×**,
  con `tabIndex = -1`, sin `role` y sin rótulo. Falla las tres condiciones: es
  desbordamiento puro.
- **`Horario` a 360 px**: visible 327 px, contenido 592 px → **1,81×**. Tiene la
  condición (a) —`tabIndex={0}`, `role="region"`, `aria-label`— pero **no la (b)
  ni la (c)**. Es el «a medias» que la propia política ya le reconoce.

---

## 4 · Dos cosas del R157 que quedaron sin medir

- **`--sombra-relieve` no tiene variante oscura.** `--sombra-marco` y
  `--sombra-barra` sí la tienen, con esta razón escrita en la hoja: *«sobre
  negro, una sombra al 18 % no existe»*. El relieve usa ese 18 %. Y su tercera
  capa es una luz interior (`inset`), que un avatar **con foto** podría tapar
  —`.avatar img` va en `position:absolute; inset:0`—, y es justo la capa que
  sostendría el efecto en oscuro.
- **Los pares de contraste de `.sup`** —texto sobre fondo tonal— no están en el
  contrato de contraste. Medidos a mano: el peor da **4,67:1**, que pasa AA, pero
  **nadie los vigila**.

---

## 5 · Por qué esto no lo ve ningún candado

Ninguno mira `manual/`, ninguno mira `peticiones/`, y **ninguno mide en un
navegador**. La política dice «se verifica midiendo, no mirando» y no hay paso
del publicador que mida nada: los 21 leen archivos. El candado que faltaría es el
que abre la hoja entregada a 360 px y comprueba que ningún texto que el
componente tiene que decir queda sin forma de leerse.

Eso necesita un navegador sin cabeza dentro del contenedor, que es **instalar
software** y por tanto **decisión del responsable, no del agente**. Queda
propuesto, no aplicado.
