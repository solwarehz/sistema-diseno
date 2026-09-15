# Respuesta a R135 — para Control Administrativos V2.0

**15 de septiembre de 2026** · atendido en **v1.115.0** y **v1.116.0**, las dos
publicadas y verificadas por las dos vías de instalación.

```bash
npm install "github:solwarehz/sistema-diseno#v1.116.0"
```

Y **reinicien el servidor**. Comprueben con `--mmi-version` y
`--mmi-componentes`: las dos tienen que decir `1.116.0`.

---

## Primero, gracias por el informe

Los tres puntos estaban bien medidos y los tres eran ciertos. El (a) llevaba tres
días en su conversación sin llegar a papel y lo dicen ustedes mismos; nosotros
sacamos otra lección de eso: **el catálogo no enseñaba el tercer nivel del marco
en ninguna parte**, así que ese defecto solo se podía descubrir montándolo. La
culpa de que tardara no es suya.

---

## (a) El icono que no cabía — corregido

Tenían razón y era exactamente el desvío que nombran. `.nav-nieto` era
`display: block` mientras `.nav-hijo` es `flex`.

Ahora es `flex` con `align-items: center` y `gap: 8px`. **El sangrado de 56 px y
el cuerpo de 12 px no se han tocado** — lo pidieron expresamente y hacen su
trabajo.

**Pueden devolver el icono del tercer nivel.** Medido en Chrome sobre el catálogo
v1.116.0: icono y rótulo en la misma línea, y la fila mide **26 px** — una sola
línea, no el doble.

Un detalle que quizá les sirva: dentro del panel flotante el sangrado es de
**28 px**, no 56. Lo pone una regla anterior y es correcto — ahí no hay carril
que compensar.

---

## (b) El tercer nivel con el riel plegado — decisión tomada

De sus tres salidas, la **2: el panel llega desplegado.**

Dos motivos, y el primero es suyo:

- El panel existe **porque ahí el rótulo no se ve**, así que se enseña todo. Su
  razonamiento vale igual un nivel más abajo, y tienen razón.
- Anidar un segundo «abrir al pasar» **dentro de un panel que se cierra al
  salir** es una trampa de temporización, no una función. Y el clic, como dicen,
  es delicado ahí dentro.

**Un resumen con secciones plegadas no resume.**

No contradice a R42a: aquélla cierra las ramas porque *doce ítems seguidos no se
leen*, y eso vale para el riel **extendido**, donde el menú es una columna larga.
Dentro del panel de un grupo la lista es corta y acotada.

**Extendido no cambia nada**, y el mando de la rama sigue vivo: se pueden cerrar
a mano.

Es ahora la **regla 12** del contrato, con prueba. Ya no queda a criterio de cada
producto, que era lo que pedían evitar.

---

## (c) Los globitos del catálogo — corregido

16 de 86 elementos sin `title`. Ahora **0 de 86**.

Tienen razón en lo que significa, y por eso lo agradecemos más que el arreglo:
esta vez **le tocó al catálogo** ser el que promete lo que no hace.

---

## Su divergencia: quédense el icono

El sistema **admite** icono en los hijos y en los nietos — es `OpcionNav.icono`,
la regla 17. Quien no lo quiera, no lo pasa.

El defecto no era su criterio: era que **el catálogo no lo demostraba**. Ahora la
maqueta enseña el tercer nivel con icono en los tres niveles, así que su
decisión y la del sistema coinciden y queda a la vista para el siguiente
producto.

---

## Y una cosa que conviene que sepan: la v1.115.0 no bastaba

Si después de actualizar volvieron al catálogo a verificar el (b) y les pareció
que **no estaba hecho, tenían razón** — y era del catálogo, no del componente.

La regla 12 entró en la v1.115.0 **solo en `MarcoApp` y en la maqueta**. La
**barra propia del catálogo** —la que ustedes recorrieron, la de sus pasos de
reproducción— se quedó atrás: plegada, el panel abría y las ramas seguían
cerradas.

Lo cazamos pasando el ratón, como hicieron ustedes. Está en la **v1.116.0**.

`MarcoApp` ya lo hacía desde la v1.115.0, así que **en su código no hay nada que
cambiar** por esto.

---

## Qué cambia en la hoja, por si miden

| | |
|---|---|
| `.nav-nieto` | `display: block` → `flex`, con `align-items: center` y `gap: 8px` |
| `.nav-nieto .nav-txt` | recorta con puntos suspensivos, también dentro del panel flotante |
| `.nav-rama-tit` del catálogo | gana `aria-controls`; sus nietos ganan `id` y el atributo de ocultar |

Nada de esto toca a ningún otro componente: `.nav-*` solo la emite `MarcoApp`.

---

## Lo que declaramos, porque nos lo cazó una auditoría

**Dijimos que el recorte con puntos suspensivos funcionaba dentro del panel
flotante y no era cierto.** `white-space: normal` ganaba la cascada, y con
`normal` los puntos solo actúan sobre lo que no se puede partir: un rótulo de
varias palabras **envuelve** en vez de recortarse. Con rótulos cortos no se nota,
y por eso lo vimos bien en el navegador y lo dimos por bueno. Ya está arreglado
en la hoja, pero lo contamos porque el error fue de método: **mirar no es
medir**.

---

## Lo que sigue abierto

1. **ESLint no se corre en ninguno de los diecisiete pasos.** Al correrlo salen
   **dos errores que viajan hoy en el paquete**: `Estados.tsx` usa el atributo
   `style` en línea en dos sitios, que es lo que nuestra propia norma prohíbe.
   No les afecta al usarlo; lo decimos porque es una regla escrita que nadie
   ejecuta.
2. **Ningún candado compara atributos de marcado** entre el catálogo y el
   componente — y `title`, `aria-controls` y `hidden` son atributos. Es la
   ceguera por la que los tres puntos de R135 llegaron a producción. Lo tapa de
   momento una prueba nueva, `marco-catalogo.test.tsx`, que compara el menú
   atributo a atributo **y ejecuta el catálogo**; el candado general está por
   escribir.

---

**Estado de la entrega:** 17 pasos en verde · 846 pruebas en 50 archivos ·
`tsc --noEmit` limpio · las dos vías verificadas descargando e instalando.
