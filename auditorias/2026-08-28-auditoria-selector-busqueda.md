# Selector con búsqueda: la promesa no es la entrega — y los quince candados en verde

**Fecha:** 2026-08-28 · **Versión auditada:** v1.94.0
**Origen:** el equipo que lo usa en un sistema reporta que, con la v1.94
instalada, **lo que ve no es lo que enseña el catálogo**.

**El reporte es correcto.** Hay **nueve** divergencias reales entre lo que el
catálogo promete y lo que el paquete entrega: cinco se ven y cuatro se teclean.
Ninguna la ve ningún candado, y la razón es una sola y es estructural.

Primero, la comprobación que descarta la causa fácil — que tengan otra cosa
instalada:

```
b1eb435bad754b549ac1d4e706188753  ZIP v1.94.0 · sistema/componentes/componentes.css
b1eb435bad754b549ac1d4e706188753  repo        · sistema/componentes/componentes.css
e92bda8ebee90a38abe3c86389d0b68e  ZIP v1.94.0 · componentes/SelectorBusqueda.tsx
e92bda8ebee90a38abe3c86389d0b68e  repo        · componentes/src/SelectorBusqueda.tsx
```

Byte a byte, lo que tienen es lo que medí. No es su instalación.

Y los quince candados, corridos hoy sobre este árbol: **los quince en verde.**
186 pares de contraste con 0 fallos · 691 clases y 0 huérfanas · 1.397 elementos
y 286.776 propiedades en el de la promesa, «idénticas» · 54 empates y ningún
cambio de ganador · 86 reglas compuestas y toda variante comparable.

---

## A · Lo que se PINTA distinto

Medido en Chrome sobre la hoja **que viaja** (`sistema/componentes/componentes.css`
de la v1.94.0) más `tokens.css`, montando el marcado del catálogo y el marcado
real que emite React —copiado del DOM, no escrito a mano—.

### A1 · El chevron no gira nunca

| | `transform` de `.sel-chev .ic` con la lista abierta |
|---|---|
| Catálogo | `matrix(-1, 0, 0, -1, 0, 0)` — es `rotate(180deg)` |
| Componente | `none` |

La hoja entregada trae, en la línea 396:

```css
.sel-caja.abierta .sel-chev .ic{ transform: rotate(180deg); }
```

Y el componente **nunca añade `abierta`**:

```tsx
<div className={['sel-caja', conLupa ? 'sel-con-lupa' : ''].filter(Boolean).join(' ')}>
```

El guión del catálogo sí la pone y la quita (`caja.classList.add('abierta')`).

**Daño:** el control pierde la única señal visual de que está desplegado. Y es
**exactamente la misma familia** que el defecto de la v1.83.0 —el React marcaba
con `activa` y la hoja estiliza `.sel-op.marcado`—: una clase que la hoja
estiliza y el React no emite jamás.

### A2 · El visto ✓ está en el lado contrario

| | x del `.sel-check` desde el borde izquierdo de la opción |
|---|---|
| Catálogo | **306,4 px** (pegado a la derecha) |
| Componente | **8,0 px** (pegado a la izquierda) |

**298,4 px de desplazamiento** en una opción de 330,4 px de ancho.

La causa es el **orden de los hijos**, no el CSS. El catálogo emite
`texto + <span class="sel-check">`; el componente emite
`<span class="sel-check"> + texto`. Con `.sel-op { justify-content: space-between }`
el orden decide el lado, y las dos hojas están de acuerdo en la regla.

Por eso el candado de la promesa no puede verlo aunque le dieras la lista
abierta: resuelve la cascada sobre **el mismo** marcado.

### A3 · La opción elegida desalinea su propio nombre

Con `ayuda` puesta, la opción tiene **tres** hijos flex y `space-between` los
separa. Medido, en una lista de 330 px:

| Hijo | x |
|---|---|
| `.sel-check` | 8,0 px |
| *(texto)* «Pérez Salazar, Ana» | **98,3 px** |
| `.sel-notas` «3.º B» | 291,9 px |

Una opción **sin** ayuda empieza su texto en 8,0 px. La lista sale escalonada:
la fila elegida arranca 90,3 px a la derecha de sus vecinas.

### A4 · La ayuda de la opción no recibe NINGÚN estilo

`.sel-notas` medido en el producto: **`font-size: 15px`** — el mismo cuerpo que
el nombre de la opción, con el que se confunde.

La hoja que viaja declara solo esto:

```css
.sel-notas p{ margin: 0 0 8px; font-size: 13px; line-height: 1.6; color: var(--texto-secundario); }
.sel-notas strong{ color: var(--texto-principal); }
```

Y el componente emite `<span class="sel-notas">3.º B</span>` **sin ningún `<p>`
dentro**: las dos reglas viajan en el paquete y **no pueden casar jamás**.

Esto ya está declarado como deuda en `verificar-elemento`, pero **declarado
corto**. No es «enseña div · emite span». Es una **colisión de nombre**: en el
catálogo `.sel-notas` es la **columna de notas de la demostración** —un `<div>`
con tres `<p>` de prosa al lado del control—, no la ayuda de una opción. Son dos
piezas distintas compartiendo clase.

Y hay una consecuencia peor: **la prop `ayuda` de `OpcionBusqueda` no se pinta en
ninguna demostración del catálogo.** No tiene promesa contra la que comparar.

### A5 · La fila de «sin resultados» entrega la mitad

| | Alto | Líneas | Color de la 1.ª línea |
|---|---|---|---|
| Catálogo | **64,3 px** | 2 (negrita + salida) | `rgb(44, 42, 37)` — `--texto-principal` |
| Componente | **44,15 px** | 1 | `rgb(106, 104, 100)` — `--texto-secundario` |

`.sel-vacio strong` viaja en la hoja y tampoco casa nunca: el componente emite
`{textoVacio}` como texto pelado.

Y el valor por omisión es `textoVacio = 'No hay coincidencias'` — el mismo
patrón seco que el propio catálogo enseña **como el ejemplo malo**, dos
secciones más abajo: *«No hay datos — Callejón. Ni dice qué se buscó ni qué
hacer»*. Lo que se entrega por omisión es lo que el catálogo señala con la
etiqueta roja.

---

## B · Lo que se COMPORTA distinto

El catálogo publica una tabla titulada **«Teclado — es donde se cae este
componente»**. Medida tecla por tecla contra el componente real, con
`@testing-library`:

| Tecla | El catálogo promete | El componente hace | |
|---|---|---|---|
| ↓ | Mueve. Abre la lista si está cerrada | Abre y mueve | ✅ |
| ↑ | Mueve. **Abre la lista si está cerrada** | Con la lista cerrada **no hace nada** | ❌ |
| ↓ ↑ | **Ciclan** (`(i+1) % visibles.length`) | **Topan**: 5×↓ sobre 3 opciones se queda en la 3.ª; ↑ desde la 1.ª se queda en la 1.ª | ❌ |
| Enter | Elige la marcada y cierra | Igual | ✅ |
| Esc | Cierra sin elegir. **Devuelve el valor anterior** | Igual: el input vuelve a «Dos», `onCambio` no se llama | ✅ |
| Tab | Sale del campo. **Si había una marcada, la elige** | Solo cierra. `onCambio` llamado **0 veces** | ❌ |
| Inicio · Fin | Primera y última opción | **No implementadas** | ❌ |

El caso de Tab es el que más cuesta: alguien que teclea, ve la coincidencia
marcada y tabula al siguiente campo se lleva **el campo vacío**, porque en el
catálogo eso elige y aquí no.

---

## C · Por qué NINGUNO de los quince candados lo vio

Este es el hallazgo de verdad, y no es sobre el selector.

**El candado de la promesa** barre el marcado **estático** del catálogo — 1.397
elementos. Pero en el catálogo la lista del selector es:

```html
<ul class="sel-lista" id="sel-lista" role="listbox" aria-labelledby="sel-et" hidden></ul>
```

**Vacía.** La llena su guión cuando el usuario la abre. Así que `.sel-op`,
`.sel-check`, `.sel-vacio` y `.sel-caja.abierta` **no existen en el marcado que
el candado lee**, y ninguno de sus 50 estados fijados a mano es del selector —
son botones, campos, tabla, horario, marco, diálogo—. Comparó el campo con
esmero; **la lista no la comparó nunca.**

Los demás, uno a uno:

- **Elemento** — sí vio `.sel-notas`; está en la deuda declarada desde R62, con
  el daño escrito corto (no dice que sea una colisión de nombre).
- **Huérfanas** (691 clases · 0) — pregunta si toda clase **declarada** se usa
  en algún sitio. `.sel-caja.abierta` no es huérfana: `.sel-caja` se usa. **La
  ceguera de prefijo, otra vez** — la misma que dejó pasar `.sel-op.activa`.
- **Omisión** — `.sel-caja.abierta` **sí** entra en sus 86 reglas de dos clases,
  pero su pregunta es *«¿el catálogo enseña la base sin el modificador?»*, y la
  respuesta es sí (seis demos de `.sel-caja` sin `abierta`). **Nadie pregunta lo
  contrario:** el catálogo enseña el modificador, ¿lo emite el componente alguna
  vez?
- **Empate, cascada, elemento, iconos** — miran lo pintado, sus valores, su
  orden o sus etiquetas. Aquí no hay nada pintado que mirar.
- **Contrato** — comprueba que toda regla «Obligatorio» de `comportamiento.md`
  tenga prueba detrás, y lo hace bien. Pero **la tabla de teclado no está en
  `comportamiento.md`**: vive solo en el catálogo. Las ocho reglas del selector
  que sí están ahí hablan de la lupa, del chevron, de `vacio`, de
  `etiquetaOculta` y de `onCrear` — **ninguna del teclado**. El contrato de
  teclado se publica en un sitio que ningún candado lee.

### El hueco, en una frase

> Los quince candados miran **lo que el catálogo pinta en reposo**. El selector
> con búsqueda es el único componente cuya pieza principal —la lista— **solo
> existe cuando alguien la abre**, y ahí no llega ninguno.

Es el mismo defecto de forma que R104: *«no hay nada que comparar, y por eso
salían en verde con el defecto delante»*. Aquello era una **variante** que no se
pintaba; esto es un **estado** que no se pinta.

---

## D · Lo que NO diverge — para no gastar tiempo ahí

- Las clases `.sel`, `.sel-caja`, `.sel-lupa`, `.sel-chev`, `.sel-in`,
  `.sel-lista`, `.sel-op`, `.sel-op.marcado`, `.sel-op[aria-selected="true"]`,
  `.sel-check`: **declaradas idénticas** en el catálogo y en la hoja entregada.
  El CSS no es el problema.
- `.cg*` contra `.campo*` (el componente usa `campo-grupo`/`campo-etiqueta`/
  `campo-ayuda`/`campo-error` y el catálogo `cg`/`cg-et`/`cg-ayuda`/`cg-error`):
  **son alias reales** en la hoja, líneas 212–219. No es divergencia.
- `conLupa = false` por omisión: correcto, y bien enseñado desde R104.
- `.tb-buscar .sel-caja` y `.tb-buscar input.campo.sel-in` salieron marcadas en
  el primer barrido: **falso positivo mío**, la prueba no montaba `TablaDatos`.
  Verificado: `TablaDatos.tsx:341` emite `tb-mini tb-buscar` con
  `sel-caja sel-con-lupa` dentro, igual que el catálogo. Casan.
- La lista se oculta bien con `hidden` (`.sel-lista` no fija `display`).

---

## E · Lo que hay que hacer

Nueve arreglos y un candado. En este orden:

**1 · Los cuatro que la hoja ya paga y nadie cobra** (CSS muerto que viaja en el
paquete):

| Arreglo | Dónde |
|---|---|
| Añadir `abierta` a `.sel-caja` cuando `abierto` | `SelectorBusqueda.tsx` |
| Mover el `.sel-check` **detrás** del texto | `SelectorBusqueda.tsx` |
| `.sel-notas` deja de ser un `<span>` suelto **o** la hoja deja de exigir `p` | decidir cuál manda |
| La fila vacía admite el patrón de dos líneas del catálogo | `textoVacio` pasa a `ReactNode` |

`.sel-notas` es el único que **no es decisión de agente**: hay que elegir si la
ayuda de la opción se renombra (`.sel-op-ayuda`, y `.sel-notas` se queda como
mobiliario del catálogo, que es lo que era) o si la hoja cambia. Renombrar es lo
correcto —son dos piezas distintas— pero es un cambio de clase pública y **rompe
a quien ya la esté usando**.

**2 · Las cuatro teclas.** ↑ abre · ciclo en ambas · Inicio/Fin · Tab elige.
Y la tabla de teclado **sube a `comportamiento.md` como reglas Obligatorio**,
que es lo que la mete bajo el candado del contrato.

**3 · El candado que falta.** Ninguno de los quince cubre esto, y el patrón se
repetirá con el diálogo, el menú de usuario y el panel plegable — todo lo que
solo existe abierto. La forma que propongo, sin lista a mano:

> Toda regla de la hoja **que viaja** cuyo selector exija una clase que **ningún
> TSX emite nunca** es promesa muerta, y falla.

Es la pregunta inversa a la del candado de la omisión, se resuelve leyendo los
`className` de los TSX contra los selectores de la hoja, y con `.sel-caja.abierta`
delante **sale en rojo hoy**. Habría cazado también `.sel-op.activa` en la
v1.82.0 y `.sel-notas p` desde R62.

---

## F · Qué no se pudo verificar

- **No se midió el modo oscuro** de la lista abierta. Las divergencias A1–A5 son
  de estructura y de orden, así que no dependen del modo; el contraste de
  `.sel-notas` a 15 px en oscuro **no está comprobado**.
- **No se midió a los once anchos.** Las medidas de A2 y A3 son a 340 px de
  ancho de control, que es el del catálogo. El desplazamiento del ✓ crece con el
  ancho; el del texto de A3 también.
- **No se probó con Radix.** El catálogo dice que en producción el
  comportamiento lo resuelve una primitiva (MMI-DS §9), y el componente lo tiene
  escrito a mano. Si algún producto lo envuelve, las divergencias de la sección
  B pueden ser otras.
- **No se revisaron los otros dos casos de §9** —diálogo y menú— en busca del
  mismo hueco de «solo existe abierto». Es lo siguiente que hay que mirar.
