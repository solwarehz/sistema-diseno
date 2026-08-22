# Respuesta a Control Administrativos V2.0 — R94 · el bucle de `onAjuste` y el desalineado

**Fecha:** 21 de agosto de 2026 · **Resuelto en:** **v1.69.0**
**Instalar:** `npm install "github:solwarehz/sistema-diseno#v1.69.0"`

---

## Los dos son nuestros, de la v1.64.0. Y el primero es grave

### 1 · `onAjuste` se llamaba durante el render

Estaba en el cuerpo del componente. Quien hiciera **lo natural** —guardar los
avisos en un estado para enseñarlos, que es exactamente lo que ustedes hacen—
entraba en **bucle infinito**: `setState` durante el render provoca otro render,
que vuelve a avisar.

**La prueba que lo reprodujo se colgó diez minutos** antes de que la matáramos.
No hay mejor demostración que esa.

Ahora sale de un `useEffect`, y solo cuando los avisos cambian **de contenido**.
Ese detalle importa: `avisos` es un array nuevo en cada render, así que un
efecto que dependiera de su identidad se dispararía siempre y **el bucle
volvería un paso más allá**.

**Su blindaje puede quedarse o retirarse**: ya no estorba ni hace falta.

### 2 · El sombreado desalineaba las columnas

Tenían razón y se veía en la captura. El hueco se repartía con `flex-grow`, y
`flex-grow` reparte **lo que sobra**. Sobra distinto en cada celda —una con
línea de detalle tiene más contenido que una sin ella— así que dos bloques de la
**misma hora** en la **misma fila** empezaban a alturas distintas.

| | antes | ahora |
|---|---|---|
| Inicio donde toca 37,5 % | 35,5 % | **37,6 %** |
| Desalineación entre columnas | variable según contenido | **0,00 px** |

Medido con cinco columnas del mismo horario, dos con línea de detalle y tres
sin ella: **las cinco empiezan en el mismo píxel**. Y nada se recorta — el
bloque sigue sin poder comprimirse por debajo de su texto.

Las clases pasan de `hor-fr-{n}` a `hor-q{cuartos}-{celdas}`. Solo les afecta si
escriben el marcado del horario a mano en vez de usar `<Horario>`.

---

## Lo que este fallo nos enseña, y va escrito en la memoria

La v1.64.0 **ya había medido esto a medias**. Declaramos: *«donde tocaría 37,5 %
sale 35,5 %»* y lo dimos por aproximación aceptable, escrita en el contrato.

Lo que no comprobamos es que **la desviación no era uniforme**. Y ahí está la
lección:

> **Una desviación que cambia con el contenido no es aproximar: es desalinear.**
> Declarar un número medido no basta si no se comprueba que sea **el mismo en
> todos los casos**.

Es el tercer día seguido que la enseñanza va en la misma dirección: medir una
vez no es medir.

---

## Y un pendiente que esto destapó

Al cambiar las clases, **el ejemplo del catálogo se quedó con las viejas** y el
sombreado dejó de verse. Lo detectamos midiendo, no por un aviso: el candado de
las clases huérfanas mira los componentes de React, **no el marcado del
catálogo**. Queda anotado como pendiente — es de la misma familia que las tres
listas a mano de ayer.

---

## Verificación

- **Trece candados en verde** · **419 pruebas**, 4 nuevas · `tsc --noEmit`
  limpio (comprobado de verdad: la primera vez mi comando medía el código de
  salida equivocado y se me escapó un error de tipos).
- La prueba del bucle lleva **tope de renders**: si el arreglo se deshace, falla
  en vez de colgar el CI.
- Alineación medida en el catálogo real y en un banco de cinco columnas.
