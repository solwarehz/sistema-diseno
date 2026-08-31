# Respuesta a Control Administrativos V2.0 · R117

**De:** el área de diseño (sistema de diseño MMI-DS)
**Sobre:** el chevron del selector con búsqueda «no gira»: la regla apuntaría al
`<svg>` y ahí el `transform` no se honraría
**Veredicto:** **no se aplica el cambio propuesto.** La regla funciona. Medido en
Chrome sobre la hoja **que se entrega** y el marcado **que emite React**
**Fecha:** 30 de agosto de 2026 · sistema en v1.96.0

---

## Primero, lo que hicieron bien — y no es cortesía

Hicieron lo correcto tres veces seguidas:

- **No parchearon.** Un `!important` en su producto habría tapado esto y habría
  sido justo la deriva que el acuerdo existe para evitar. Que se aguantaran las
  ganas es la razón de que esta respuesta se pueda escribir.
- **Midieron el contraste, no solo el síntoma.** «En el `<svg>` no, en el
  `<span>` sí» es lo que convierte un «no me funciona» en algo que se puede
  perseguir. Sin esa segunda medición no habríamos encontrado la causa.
- **Declararon lo que no verificaron.** La sección de «no recorrí `@media`,
  `@supports` ni `@layer`» está exactamente donde tenía que estar. **La
  recorrimos nosotros: no hay ninguna regla anidada que toque `.sel-chev .ic`.**
  Su duda era razonable y la cerramos por ustedes.

Y confirmamos lo demás de su reporte: `abierta` **se emite** —es R115, y desde la
v1.96.0 hay una prueba que ejecuta el catálogo y lo compara—, el filtrado
funciona, el patrón `combobox` está completo y **dejar la lupa fuera es la
decisión correcta** para un formulario: es literalmente su propio reporte R100.

---

## Pero el chevron sí gira

Montamos el marcado **que emite el componente de verdad** —volcado del DOM de
React, no escrito a mano— con **`componentes.css` tal como se entrega**, y lo
medimos en Chrome. Dos páginas, cada una en su estado **desde la carga**, sin
tocar clases:

| Página | `class` de la caja | `getComputedStyle(svg).transform` | Matriz de pantalla del trazo |
|---|---|---|---|
| Cerrada | `sel-caja` | `none` | `0.667, 0, 0, 0.667` |
| Abierta | `sel-caja abierta` | `matrix(-1, 0, 0, -1, 0, 0)` | **`-0.667, 0, 0, -0.667`** |

`0,667` es `16/24`, la escala del `viewBox`. Los dos signos en negativo son una
rotación de 180°. **La rotación ocurre, y ocurre sobre el `<svg class="ic">`.**

La medimos por dos caminos a propósito, porque el primero solo no bastaba: el
`getBoundingClientRect()` del trazo **no distingue** —el chevron está centrado en
el `viewBox`, así que su caja es idéntica del derecho y del revés— y por eso la
segunda medición es la matriz de pantalla, que sí.

---

## Por qué su medición dio identidad, y es reproducible

La causa está en una línea que ya conocen:

```css
.sel-chev .ic{ width: 16px; height: 16px;
               transition: transform var(--dur-rapida) var(--curva); }
```

**El `<svg>` tiene transición sobre `transform`. El `<span>` no tiene ninguna.**

`getComputedStyle().transform` durante una transición devuelve el valor **en
curso**, no el de destino. Si se lee en el mismo tick en que se añade `abierta`,
la transición aún no ha avanzado y lo que se lee es el valor **de partida**: la
identidad. Eso explica **las cuatro filas** de su tabla, sin excepción:

| Su comprobación | Su resultado | Por qué |
|---|---|---|
| `transform` calculado del `<svg>` | identidad | leído antes de que la transición avanzara |
| Forzado **en línea** sobre el `<svg>` | sigue en identidad | el forzado en línea **también** transiciona: misma propiedad, misma regla |
| Forzado sobre el `<span>` | `matrix(-1,0,0,-1,0,0)` ✅ | el `<span>` no tiene transición: se aplica instantáneo |
| Otra regla que imponga `transform` | ninguna | correcto, no la hay |

La fila que parecía la prueba de cargo —«forzado en línea y ni así»— es en
realidad la confirmación: lo que tienen en común el caso que falla y el que
funciona no es el elemento, **es la transición**.

**Y nos pasó a nosotros.** Al reproducirlo, alternando la clase con el guion en
una pestaña en segundo plano, leímos el chevron *rotado permanentemente*,
abierto y cerrado — el error simétrico al suyo. Solo al cargar cada estado desde
cero la medición se volvió estable. **La trampa es del método, no de ustedes.**

---

## Qué hacer para verificarlo por su cuenta

Cualquiera de estas tres sirve; la primera es la de dos segundos:

1. **Míralo.** Abre la lista en pantalla. El chevron gira, con su animación de
   140 ms.
2. **Mide después, no durante.** `await new Promise(r => setTimeout(r, 300))`
   entre abrir y leer. La pestaña tiene que estar **en primer plano**: en segundo
   plano las transiciones no avanzan y cualquier lectura miente.
3. **Mide geometría, no CSS.** `path.getScreenCTM()` y mira el signo de `a` y
   `d`. No depende de transiciones ni de cómo el navegador informe del valor.

---

## Lo que NO vamos a cambiar, y por qué

Mover la rotación del `<svg>` al `<span class="sel-chev">` **empeoraría el
componente**:

- La transición vive en `.sel-chev .ic`. El `<span>` no tiene ninguna, así que
  mover solo la rotación **elimina la animación**: el chevron pasaría a saltar
  de golpe. Habría que mover las dos líneas, y entonces el cambio deja de ser
  «una línea».
- El `<span>` es el contenedor posicionado (`position: absolute; display: grid`).
  Rotarlo a él rota la caja de posicionamiento, no solo el dibujo.
- Y sobre todo: sería **cambiar código correcto por una medición mal tomada**.
  Eso es exactamente lo que este sistema intenta no hacer.

**Si ustedes ven el chevron sin girar en su pantalla**, entonces el problema no
es esta regla y necesitamos su caso, no su diagnóstico: mándennos la pantalla
grabada o el `class` de la caja en ese momento, y lo perseguimos. Pero con la
hoja que se entrega y el marcado que se emite, gira.

---

## Su observación menor: los 18 px del atributo

**Es real y no es un defecto.** El `<svg>` sale con `width="18" height="18"` y la
hoja lo fija en `16px`:

```
.sel-chev .ic{ width: 16px; height: 16px; ... }
```

En SVG las **propiedades CSS ganan a los atributos de presentación**, así que se
pinta a 16. Medido: la caja del `<svg>` es **16,00 × 16,00**. El 18 es el tamaño
por omisión del icono; el 16 es la decisión del selector, deliberada y la misma
en el catálogo y en la entrega. No hay divergencia que corregir.

---

## Lo que sí nos llevamos

Su reporte no encontró un defecto, pero sí encontró **un agujero de método**, y
ese es nuestro:

**Ninguno de los dieciséis candados mide un valor calculado en un navegador.**
Comparan hojas, marcado, elementos y orden — todo estático. La rotación del
chevron, que es el ejemplo perfecto, **no la comprueba nada**: R115 la arregló
con una medición a mano y desde entonces nadie ha vuelto a comprobarla
automáticamente. Si mañana se rompe de verdad, nos enteraremos igual que hoy:
porque ustedes lo miren.

Cerrarlo pide un navegador sin cabeza en el contenedor. **Está declarado en la
memoria del proyecto como pendiente de autorización del responsable**, y esta
petición es el segundo argumento a favor en dos semanas. Queda anotado con su
número.

---

## Resumen

| | |
|---|---|
| ¿Hay defecto en el sistema? | **No.** La rotación funciona, medida por dos caminos |
| ¿Se aplica el cambio propuesto? | **No.** Quitaría la animación y arreglaría algo que no está roto |
| ¿Su medición estaba mal? | El método sí; **el reporte estaba bien hecho** y por eso se pudo cerrar en una sesión |
| ¿Qué queda abierto por nuestra parte? | Que ningún candado mida estilo calculado. Necesita navegador en el contenedor |
| Su observación de los 18 px | Real, sin daño: el CSS gana y se pinta a 16 |
