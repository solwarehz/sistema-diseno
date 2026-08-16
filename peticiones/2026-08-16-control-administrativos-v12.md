# Pedido de Control Administrativos V2.0 — y respuesta

**Fecha:** 14 a 16 de agosto de 2026
**Origen:** Control Administrativos V2.0, por el chat del responsable
**Resuelto en:** v1.53.2 a v1.58.0

> **Por qué existe este documento.** Los pedidos de estos tres días llegaron por
> chat y ninguno quedó escrito. Un requerimiento que solo vive en una
> conversación no se clona: mañana alguien lee `Mensaje` y no sabe por qué el
> `role` es elegible. Aquí queda lo pedido, lo entregado, lo corregido y lo que
> falta.

---

## Lo entregado

| | Qué se pidió | Versión |
|---|---|---|
| **R41** | Lo deshabilitado no se distingue de lo normal | v1.56.0 · y v1.58.0 |
| **R50** | El aviso nace invisible | v1.55.0 |
| **R65** | `Interruptor.etiqueta` no acepta marcado | v1.57.0 |
| **R66** | Falta el estado «cerrado por regla» | v1.58.0 |
| **R70** | La tarjeta pulsable no marca el foco del teclado | v1.53.2 |
| **R81** | No hay tipo para «acceso suspendido por contrato» | v1.55.0 |
| **R82** | `.enlace` no tiene foco de teclado propio | v1.55.0 |
| **R83** | No hay mensaje en flujo con tono | v1.57.0 |

### R50 · El peor defecto que este sistema ha entregado

`.av` nace con `opacity: 0` y `translateY(-16px)` para poder entrar deslizando,
y `.av-dentro` es lo que lo trae a la vista. **El componente no la añadía
nunca.** En el catálogo se veía porque allí la pone el guion de la página; en
cada producto el aviso se montaba, ocupaba su sitio, se anunciaba al lector de
pantalla **y no se veía. Ni uno.**

Lo habían reportado antes y se quedó sin respuesta. Su apaño —una pieza que
recorre el DOM añadiendo la clase desde fuera— era imprescindible, y ahora
sobra: **no chocan**, porque React manda en `className` y añadir una clase que
ya está no hace nada.

### R41 · Tres veces pedido, tres sitios distintos

`.btn` no tenía **ninguna** regla `:disabled`: un botón principal apagado se
pintaba con el mismo `--accion` que uno activo. El campo de texto igual — solo
`select` tenía trato—. Y en el interruptor las reglas **sí existían**, pero
pedían el atributo `disabled` mientras el componente emite `aria-disabled`, así
que no casaban nunca.

Lo revelador: el par `accion-texto-desh` / `accion-deshabilitada` ya estaba en
el contrato de contraste, medido y declarado como «Botón deshabilitado. Exento
por 1.4.3». **Se documentó el color de un botón que la hoja nunca pintó.**

---

## Lo que se corrigió de sus premisas

Con evidencia, y por el mismo criterio con el que ellos corrigen las nuestras.

| Su premisa | Lo medido |
|---|---|
| «Los 30 iconos no traen ✕ / ! / ✓ / i» | Eran **45**, ahora 46. **Tres ya existían**: `visto`, `alerta` y `cerrar`. Solo faltaba la **i** |
| «El paquete publica el CSS de los cinco tonos» | **Correcta.** Lo negamos al principio por buscarlos mal: comparten selector con `.chip-*` |
| «`candado` no existe» (implícito en R84) | **Existe** desde antes. Ese trozo de R84 estaba resuelto |

---

## Lo que se les debe, y por qué no está hecho

**R84 · `OpcionNav` bloqueado.** Aceptado. No entró a la carrera porque toca el
marco de aplicación y hay que resolver bien el caso plegado: al plegar el
lateral desaparece el rótulo y el icono es lo único que identifica la opción, así
que un candado que **sustituya** al icono deja la opción sin identidad. Ese es
el problema de diseño real, y merece resolverse, no despacharse.

**R58 / R59 · Columna identificadora y encabezado fijos.** Aceptados los dos, y
su argumento de no resolverlo por su cuenta es correcto: CSS propio sobre
nuestro marcado se rompe en cuanto cambiamos el árbol, como ya les pasó con R49.
Es lo más grande de la cola — `position: sticky` sobre celdas, con fondo propio
para que lo que pasa por debajo no se transparente, verificado a los once
anchos.

---

## Lo que esto nos enseñó, y es lo que más vale

Tres de los defectos de esta tanda —R50, R41 y el `aria-disabled` del
interruptor— **pasaron por los once candados en verde**.

No es casualidad. Son defectos que **el catálogo no puede enseñar**: allí el
aviso lo hace visible el guion de la página, y nadie deshabilita un botón de
muestra. El candado de la promesa compara la cascada sobre el mismo marcado, y
si el estado no existe en ninguno de los dos lados, no hay nada que comparar.

Nació `verificar-elemento` (R62) para cerrar la parte que sí se puede leer del
texto: cuando el catálogo enseña un elemento y el componente emite otro. Encontró
**cinco divergencias más** el día que se escribió, declaradas con su daño real
—la peor, `.sel-notas`, una regla que el componente no puede casar nunca—.

Lo que queda abierto es la otra mitad: **comparar comportamiento y estados**, no
marcado. Eso pide montar los componentes en un navegador de verdad, y eso
necesita autorización.
