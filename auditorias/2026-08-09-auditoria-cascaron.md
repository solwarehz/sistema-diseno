# Auditoría del cascarón y del sistema

**Fecha:** 2026-08-09 · **Versión auditada:** v1.15.0
**Alcance:** código suelto que debería ser componente, duplicación, y reglas del
sistema que el propio sistema se salta.

Todo lo que sigue está **medido**, no estimado. Los números salen de ejecutar,
no de leer.

---

## Lo que se arregló en esta pasada

### 🔴 El auditor tenía un agujero del tamaño de un atributo

**El hallazgo más grave, y es sobre el propio candado.** `auditar-cascaron.mjs`
leía **solo la hoja de estilos**. Todo lo escrito en `style=` le era invisible.

Medido en cuanto se amplió:

| | |
|---|---|
| Espaciados fuera de la rejilla de 4 | **11** — `margin-top: 10px`, `margin-top: 14px` |
| Pesos tipográficos prohibidos | **5** |
| Tamaños fuera de la escala | **1** — `font-size: 14px` |

Llevaban meses ahí, con el auditor diciendo **cero**.

Es el mismo fallo que ya cerró el candado de color, que también empezó mirando
solo la hoja. Y es peor que no auditar: **un auditor que revisa una parte y
reporta cero da menos confianza que ninguno, porque el cero se cree.**

Corregido: el auditor lee ahora los `style=` del marcado con los mismos
criterios. Los pesos del muestrario tipográfico se exceptúan a mano —esa página
existe para enseñar cuáles no se usan—.

### 🟠 197 estilos en línea, de los cuales 85 eran color

El catálogo pintaba cada muestra con `style="background: var(--token)"`. **Un
catálogo que se salta la regla de los estilos en línea no puede exigirla.**

Se generan ahora **56 clases de token semántico** —`.token-accion`— con el mismo
criterio que las 119 de escalón: una sola forma de nombrar, y el marcado limpio.

| | Antes | Ahora |
|---|---|---|
| Estilos en línea | 197 | **112** |
| Con color dentro | 90 | **0** |

Los 112 que quedan son **geometría de demostración** —altos y anchos de una sola
vez— y **están todos en la rejilla**, ahora que el auditor los mira. Convertir 68
medidas irrepetibles en 68 clases sería peor que dejarlas.

### 🟠 La misma decisión escrita dos veces

`.chip-exito` y `.msj-exito` declaraban lo mismo, y así los cuatro estados. **No
es un ahorro de líneas: la pareja fondo/texto/filete de un estado es UNA
decisión, y una decisión escrita dos veces se separa** el día que una cambie.

Fundidas. Igual el árbol de navegación, que repetía `.nav-hijos` / `.nav-nietos`
y `.nav-grupo-tit` / `.nav-rama-tit`.

### 🟡 Un componente sin pruebas

`Nota` se publicó sin ninguna. **Un componente sin pruebas es un componente que
nadie sabe si sigue haciendo lo que dice.** Cuatro pruebas, incluida la que
comprueba que no es una región viva.

---

## Lo que se midió y se decide NO tocar

Un informe que solo lista lo malo invita a arreglarlo todo, y no todo debe
arreglarse.

### Las otras 20 duplicaciones de CSS

Son **coincidencia, no duplicación**. `.sw-txt`, `.ms-lista`, `.tb-mini`, `.cg` y
`.campo-grupo` declaran los mismos tres valores porque apilar dos cosas con 4px
de separación es lo normal, no porque sean lo mismo.

**Fundirlas las acoplaría:** cambiar el interruptor movería el campo. La
duplicación aquí es más barata que el acoplamiento.

### Los 112 estilos en línea restantes

Geometría de una sola vez en demostraciones: la altura de una caja de ejemplo, el
ancho de un esqueleto. No son decisiones de diseño y no se repiten.

### CSS muerto

**Cero de 612 clases.** Se comprobó cruzando el marcado, el generador y los 22
componentes. El primer recuento dio 84, todas falsos positivos: las usan los
componentes de React o se arman dinámicamente.

---

## Lo que queda abierto, con su tamaño

### 🟠 71 tablas de reglas escritas a mano

El patrón `| Regla | Por qué |` aparece **71 veces**, con 53 cabeceras escritas
una a una. El generador ya tiene 29 funciones de ayuda —`caso`, `chip`, `sw`,
`campoDemo`— pero **ninguna para la tabla que más se repite**.

No es un defecto de producto: es del catálogo, y no llega a nadie. Pero es
exactamente el tipo de repetición que este sistema le pide a los demás que no
tengan.

**Coste:** una función y 71 sustituciones. **Riesgo:** bajo, es mecánico.

### 🟡 Un `style={{}}` en `Estados.tsx`

La anchura de las cuatro barras del esqueleto. Son cuatro valores fijos —38, 64,
52, 70 %— y podrían ser cuatro clases. Es la última infracción del candado de
lint que queda dentro de los componentes.

### ⛔ Lo que espera decisión ajena

| | |
|---|---|
| **R3** · los seis `--ambito-alt-*` | Colores nuevos: lo autoriza el responsable |
| **Cinco reglas `PENDIENTE`** | Declaradas en el contrato y sin implementar |

---

## Estado tras la auditoría

| | |
|---|---|
| Candados | **7**, todos en verde |
| Pruebas | **164** |
| CSS muerto | 0 de 612 |
| Color en estilos en línea | 0 |
| Clases huérfanas | 0 |
| Componentes sin página | 0 |
| Componentes sin prueba | 0 |

**La lección de esta auditoría no es ninguno de los hallazgos: es que el
auditor no se auditaba a sí mismo.** Doce infracciones vivieron meses detrás de
un cero que nadie dudó. Lo mismo puede estar pasando ahora con lo que ningún
candado mira todavía.
