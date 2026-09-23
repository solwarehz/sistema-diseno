# R158 · El marco de aplicación y el alto del tablero

**De:** Control Administrativos V2.0 · **Fecha:** 2026-09-22
**Comprobado contra:** `sistema-diseno-ae` **v1.136.0** instalada.

---

## R158.1 · El encabezado de la aplicación se parte en dos filas bajo 640 px. **Prioridad: alta.**

**Lo vio el responsable en su teléfono**, a unos 481 px: el plegador queda solo
arriba y el selector de sede y el avatar caen a una segunda fila, desalineados
entre sí.

No es nuestra pantalla —no pintamos nada en esa barra— y está en la hoja del
paquete. Tres reglas, citadas literales:

```css
@media (max-width: 640px) { .top { flex-wrap: wrap; height: auto; } }
@media (max-width: 700px) { .top-plegar { display: none; } }
@media (max-width: 640px) { .top-plegar { background: transparent; border: 0; … } }
```

Dos cosas que pedimos que miren juntas:

1. `flex-wrap: wrap` + `height: auto` en `.top` es lo que parte el encabezado.
   Envolver reparte los hijos en filas, y como tienen alturas distintas —el
   plegador mide 26 px y `.top-acciones` 32— el `align-items: center` los centra
   dentro de su fila, no entre ellas. De ahí el desalineado.
2. Dos puntos de ruptura discuten sobre el mismo elemento. A 700 px
   `.top-plegar` se oculta; a 640 px se le vuelve a dar estilo completo —fondo,
   borde, cursor, relleno, radio— sin devolverle `display`. Una de las dos reglas
   sobra, y saber cuál es decisión suya: no sabemos si la intención era ocultarlo
   en móvil o mostrarlo con otro aspecto.

Afecta a **todas las pantallas del producto** en ese ancho, no solo al tablero.
Por eso va como requerimiento y no como arreglo nuestro.

---

## R158.2 · `tbl-marco` no tiene de dónde tomar el alto. **Prioridad: alta — hoy rompe la regla 2.**

El contrato dice, con razón, que el alto lo pone el padre y que el sistema no
fija ningún `100vh` porque no le toca decidir el alto de una pantalla ajena. De
acuerdo. **El problema es que no hay ninguna pieza publicada que lo dé**: el
marco de aplicación no ofrece cadena de alto —la página se desplaza entera—, así
que `tbl-marco` degrada a bloque normal y `tbl-crece` no desplaza nada.

La consecuencia no es estética, **es la regla 2**. Sin cuerpo que se desplace por
dentro, el `Segmentado` que sostiene el color se va de pantalla en cuanto se
desliza — y ustedes lo escribieron así: *«si el rótulo que sostiene el color se
va al desplazar mientras la rejilla sigue visible, el color se queda solo y la
regla se rompe sin que nada cambie en el código»*. Es exactamente lo que pasa.

**Llegamos a resolverlo y lo hemos retirado a propósito.** Había aquí un gancho
que medía dónde empieza el marco y le daba `calc(100dvh - <top>)`. Funcionaba, y
aun así es código del producto decidiendo maquetación — lo que estas piezas
vienen a evitar. Si cada producto escribe su medición, la misma pantalla acaba
con tres altos distintos, que es el argumento con el que ustedes sacaron el
relieve a un token. **Preferimos la pantalla con el defecto declarado a la
pantalla parcheada.**

Lo que pedimos es **la pieza, no el valor**: una forma publicada de que una
pantalla ocupe el alto disponible bajo el encabezado —una clase en el marco, un
contenedor que dé la cadena de alto, o el `dvh` menos la barra resuelto por el
sistema, que es quien conoce su propia altura—. **`dvh` y no `vh`**: en un
teléfono la barra del navegador aparece y desaparece, y con `vh` el pie queda
debajo.

---

## Lo verificado por nuestra parte

- Las **17 clases** que usa la pantalla existen en `componentes.css` de la
  v1.136.0: contadas, no supuestas.
- **Cero reglas de CSS propias y cero estilos en línea**: comprobado sobre el
  archivo.
- El **contrato de marcado se cumple entero**, incluido lo que no se ve: el
  `sr-solo` con nombre y hora en cada celda, la hora visible en `aria-hidden`
  para que un lector no la diga dos veces, y el carril con `tabindex`,
  `role="region"` y su `aria-label` con el número de paradas.
- El desalineado del encabezado **no lo hemos reproducido nosotros**: nuestra
  ventana de pruebas no baja de 1265 px. Lo reportó el responsable con captura, y
  las tres reglas citadas explican lo que se ve. Si al medirlo les sale otra
  cosa, dígannoslo.

---

## Fuera de alcance de R158, y lo decimos

El «No asistió 0» **no es de diseño: es backend.** El filtro por sede pregunta
por `Trabajador.sedeId`, que está en NULL en 164 de 167 filas, y en SQL `IN`
descarta los NULL. Verificado llamando a la API dos veces: sin sede, 7 filas; con
Sede 1, cero. Afecta igual a Consulta diaria, porque es el mismo servicio. Ese
arreglo es otra rama y necesita decisión del responsable, porque cambia qué ve un
administrador de sede.
