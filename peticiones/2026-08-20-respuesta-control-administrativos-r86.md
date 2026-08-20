# Respuesta a Control Administrativos V2.0 — R86 · «un dato, una línea»

**Fecha:** 20 de agosto de 2026
**Pedido:** TablaDatos parte el texto y rompe la altura de fila
**Resuelto en:** **v1.61.0**
**Instalar:** `npm install "github:solwarehz/sistema-diseno#v1.61.0"`

---

## Resumen en una línea

**Aceptado y hecho** para la tabla de datos. **Rechazada** la parte de
`.tabla-simple`, y abajo está el porqué con la medida al lado.

---

## 1 · Su diagnóstico era correcto, y se comprobó antes de tocar nada

Dijeron que el producto no aplica ninguna clase de ajuste de texto en las celdas
y que el comportamiento salía entero de `componentes.css`. Es así.

Se montó un banco de medida con **las dos hojas que se les entregan** —`tokens.css`
y `componentes.css` de la v1.60.0, sin nada más— y se midió en un navegador de
verdad, con una columna estrecha y valores de ~35–42 caracteres:

| Caso | Altura declarada | Medido **antes** |
|---|---|---|
| Densidad cómoda, tres filas | 34 px | **54,7 · 34,0 · 72,3 px** |
| Densidad compacta, dos filas | 28 px | **36,7 · 28,0 px** |
| Sub-tabla del detalle plegado | 30 px | **46,7 · 30,0 px** |

La altura de fila no era una altura: era **un mínimo**.

Y hay una medida más que cierra su argumento mejor que el argumento mismo. En el
ejemplo compacto, la envoltura daba `scrollWidth` **419** sobre `clientWidth`
**419**: **ni siquiera se desplazaba**. El desbordamiento se estaba absorbiendo
hacia abajo, en el único eje donde el componente había prometido una medida.

---

## 2 · Qué cambia en la hoja

```css
.tb td        { white-space: nowrap; }   /* la celda de datos */
.tb-sub td    { white-space: nowrap; }   /* la sub-tabla del detalle plegado */

.tb td.tb-vacio    { white-space: normal; }   /* el estado vacío: es prosa */
.tb-detalle > td   { white-space: normal; }   /* el panel de detalle: lo llenan ustedes */
```

Dos cosas que no pidieron y van incluidas, con su razón:

- **`.tb-sub td`** — la sub-tabla del plegable tenía el **mismo defecto medido**
  (46,7 px con 30 declarados) y la **misma salida** (`.tb-sub` desplaza sola).
  Dejarla fuera habría arreglado la tabla y no el componente.
- **Las dos excepciones** — el estado vacío y el panel de detalle **no son
  datos**: son prosa, ya renunciaban a la altura de fila, y no hay medida que
  proteger ahí. Sin la excepción, «Prueba con menos filtros, o quítalos todos»
  salía en una línea y obligaba a desplazar una tabla sin ni una fila que mirar.

### Una nota que les puede servir

La excepción del vacío **no bastaba con declararla: había que ganarla**. Escrita
dentro de la regla `.tb-vacio` (una clase, 100) perdía contra `.tb td` (clase +
tipo, 101), y el vacío seguía saliendo en una línea. Lo sacó **nuestro candado de
la cascada en rojo, a los once anchos**, antes de que se viera en ninguna
pantalla. Es exactamente el tipo de detalle que ustedes señalaron en R85 —«el día
que cambiéis ese selector, se nos rompe y no nos vamos a enterar»—, y por eso va
comprobado y no leído.

---

## 3 · Medido después, en el navegador y en el catálogo real

| Caso | Declarado | Medido **después** |
|---|---|---|
| Densidad cómoda, tres filas | 34 px | **34,0 · 34,0 · 34,0** |
| Densidad compacta | 28 px | **28,0 · 28,0** |
| Sub-tabla del detalle | 30 px | **30,0 · 30,0** |
| Envoltura, compacta | — | **535 / 419 → desplaza** (antes 419/419) |

Y sobre la tabla del catálogo, la de 38 trabajadores, con su propio caso metido
en una celda: **«SIFUENTES DE PINEDA, Julia Trinidad» → la fila sigue en 34,00 px**
y las diez filas visibles miden lo mismo; la envoltura pasa de 1001 a 1079 px de
`scrollWidth` y desplaza. El estado vacío sigue partiendo en dos líneas y **no**
provoca desplazamiento (913/913).

---

## 4 · La parte que se rechaza: `.tabla-simple td`

**No lleva `nowrap`, y no es por prudencia.** El argumento que sostiene el cambio
en `.tb` no se traslada:

1. **No hay altura que romper.** `.tabla-simple` no declara altura de fila. Lo
   que en la tabla de datos rompía un contrato, aquí no rompe nada.
2. **Sus celdas son prosa por diseño**, y está escrito en la propia regla:
   `vertical-align: top` y `line-height: 1.45`. En nuestro catálogo la usan
   columnas con frases enteras (`.motivo`). Con `nowrap`, cada tabla de
   documentación se convierte en un deslizador.
3. **Su celda de una sola línea ya está**: `.tabla-simple .num`, que es la que sí
   es un dato.

Queda escrito como prueba: si alguien le pone `nowrap` «por simetría», sale en
rojo. Si tienen un caso concreto en el producto donde una `.tabla-simple`
necesite no partir, mándenlo con la pantalla y se declara una salida con nombre
—como se hizo con `tabla-libre`—, no un cambio global.

---

## 5 · Una corrección a su nota de «dónde se toca»

Dicen: *«El cambio va en el catálogo (`cascaron/index.html`) y se vuelca con
`node sistema/componentes/extraer.mjs`»*.

`cascaron/index.html` **también es un archivo generado** — lo emite
`sistema/cascaron/generar-cascaron.mjs`. La cadena real es:

```
generar-cascaron.mjs  →  cascaron/index.html  →  extraer.mjs  →  componentes.css
```

Editarlo directamente funciona hasta que alguien regenera el catálogo, y entonces
el cambio desaparece sin ruido. No afecta a lo que ustedes hacen; lo decimos por
si alguna vez toca proponer un parche.

---

## 6 · Lo que tienen que hacer

Lo que dijeron: **subir la versión en `package.json` y reinstalar**. Nada más.

```bash
npm install "github:solwarehz/sistema-diseno#v1.61.0"
node -p "require('sistema-diseno-ae/package.json').version"   # 1.61.0
```

**Y lo que conviene mirar una vez**, porque cambia una pantalla ya montada: una
columna cuyo valor hoy **necesite** ir partido en varias líneas dejará de
partirse y ensanchará su columna; la tabla se desplaza en horizontal. Si aparece
una así en Trabajadores, Contratos, Locales, Organigrama, Accesos o Privilegios,
**dígannoslo** y se declara la salida en el contrato (regla 29). No la resuelvan
con CSS propio sobre `.tb td`: eso es justo lo que este contrato existe para
evitar.

---

## 7 · Cómo lo comprobamos, por si quieren repetirlo

- **Contrato:** regla **28** (obligatoria) y **29** (del proyecto) en
  `comportamiento.md`.
- **Candado de la cascada:** afirmación `UN-DATO-UNA-LINEA` — **cinco casos a los
  once anchos**, resolviendo la cascada de la hoja que viaja. Se vio en rojo
  antes de verla en verde.
- **Pruebas:** `componentes/pruebas/tabla-nowrap.test.ts`, **6 nuevas** — 394 en
  total, todas verdes.
- **Candado de la promesa:** «Celda de la tabla · 208 propiedades, idénticas».
  Lo que se ve en el catálogo es lo que viaja.
- **Los once candados en verde** antes de subir a `main` y publicar.
