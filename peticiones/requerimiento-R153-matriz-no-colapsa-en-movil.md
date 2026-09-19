# R153 · La matriz no colapsa en móvil, y lo pedimos mal

**Para:** equipo del sistema de diseño
**De:** Control Administrativos V2.0 — módulo de Privilegios
**Fecha:** 2026-09-19
**Comprobado contra:** `sistema-diseno-ae` **v1.130.0 instalada**, medido en la
pantalla real con el contenedor estrechado a 380 px.

**Es lo único que tenemos abierto.** R144 a R152 están cerradas — la última,
`claveGlobal`, llegó en esta misma v1.130.0 y por la puerta que preferíamos.

---

## Primero: esto es culpa nuestra, y conviene decirlo

En el R151 escribimos esto, **dentro de la sección «Lo que NO os pedimos»**:

> *«Que la matriz sea responsive por su cuenta. Bajo cierto ancho, caer al
> acordeón que ya tenéis nos parece la respuesta correcta — y resolvería de paso
> que nuestra pantalla no sea móvil primero, que es deuda nuestra.»*

Describimos la solución correcta y la pusimos en la lista de lo que no pedíamos.
No es un malentendido vuestro: entregasteis exactamente lo que estaba pedido.

Lo destapó el dueño comparando el catálogo con nuestra pantalla, con esta
pregunta: *«esa es la promesa del componente, todo se presenta en una sola
columna con opciones que se colapsan o se comprimen, ¿la entrega es igual a la
promesa?»*. La respuesta honesta es que él estaba mirando la **lista** y nosotros
usamos la **matriz**, y que la matriz no colapsa.

---

## Qué pasa, medido

Estrechando el contenedor de la matriz a **380 px** —un teléfono corriente— en
nuestra pantalla de Privilegios (11 módulos, 42 filas, 7 columnas):

| | |
|---|---|
| Ancho del contenedor | 379 px |
| Ancho de la tabla | **655 px** |
| ¿Se desplaza en horizontal? | **Sí** |
| Columnas visibles | las 7, ninguna se pliega |
| Ancho de la columna de nombre | `44vw` (`--pm-nom`, `componentes.css`) |
| ¿Hay `title` para leer el nombre cortado? | **No** |

El resultado concreto: la fila «Fijar sobre qué sedes alcanza un puesto» se lee
**«Fijar sobre qué sedes alcanza u…»**, y no hay forma de ver el resto — ni
pasando el cursor, porque en un teléfono no hay cursor.

Le pasa a todas las filas de nombre largo: «Comprobar la integridad del rastro»,
«Ver las alertas legales de la jornada», «Cambiar los catálogos de la empresa»,
«Encabezado y motivos · Ver».

## Por qué nos importa

**Una matriz que no se puede leer no se puede revisar**, y revisar
periódicamente quién tiene qué es obligación legal (D.S. 016-2024-JUS art.
46.1.c). Es el mismo argumento con el que pedimos la matriz en R151: si la
columna no se ve, la matriz deja de responder «¿a quién le he dado Crear?», que
es justo para lo que la pedimos.

Y hay un agravante nuestro: **nuestra pantalla de Privilegios lleva meses sin
ser móvil primero**, y ésta era la ocasión de cerrarlo sin escribir una línea de
CSS propio.

## Qué pedimos

**Que bajo cierto ancho la matriz caiga a la presentación en lista** — la misma
que ya tenéis, la del acordeón. No pedimos una tercera forma: pedimos que las
dos que existen se turnen solas.

    <PanelPrivilegios
      presentacion="matriz"
      /* Bajo este ancho, se pinta como lista. `false` lo desactiva. */
      listaBajo={640}
      …
    />

Nos vale igual si lo decidís sin prop, por la hoja, siempre que sea el
comportamiento por omisión y esté documentado.

**Y si eso no entra**, la alternativa mínima que nos desbloquea es mucho más
barata: **un `title` en el `th` de la fila con su nombre completo**, más
`white-space: normal` bajo 640 px para que el nombre envuelva en dos líneas en
vez de cortarse. Resuelve lo de leer; no resuelve lo de móvil primero.

## Lo que NO os pedimos

- **Cambiar el ancho de `--pm-nom`.** Estrechar la columna es lo correcto en un
  teléfono; el problema es que lo cortado no se puede recuperar.
- **Quitar el desplazamiento horizontal** si la matriz se queda. Con siete
  columnas es inevitable, y la primera columna anclada ya lo hace llevadero.
- **Que la lista y la matriz se vean igual.** Son dos lecturas distintas y está
  bien que lo parezcan.
