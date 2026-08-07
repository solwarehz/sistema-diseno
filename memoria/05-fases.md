# Fases de trabajo

Una fase se cierra cuando **tú la apruebas viéndola**, no cuando yo digo que está
lista. Nada avanza a la siguiente sin eso.

Cada fase tiene: **qué necesita para empezar · qué se hace · qué ves tú para
aprobar · qué queda escrito al cerrar.**

---

## Compuerta de cierre — igual en todas

Antes de pasar a la siguiente fase:

1. El candado de contraste en verde.
2. Lo visible, revisado por ti en el cascarón.
3. El capítulo del manual escrito **en ese momento**, no al final del proyecto.
   Es el único momento en que alguien recuerda por qué las cosas son como son.
4. Las decisiones nuevas anotadas en [`02-decisiones.md`](02-decisiones.md) con su
   porqué y qué las revertiría.

---

## Fase 0 · Motor de tokens y candado — ✅ CERRADA

**Qué se hizo:** fuente única de color, generación de contrato, CSS y preset.
Candado que recalcula los contrastes y falla el build.

**Verificado:** 70 pares bloqueantes en dos modos, 0 fallos. El candado se
saboteó a propósito y lo detectó.

---

## Fase 1 · Color y casos de uso — 🔵 EN CURSO, esperando tu aprobación

**Qué se hizo:**

- Los 38 tokens semánticos en modo claro **y oscuro**.
- Las 4 escalas primitivas.
- Los 5 colores de marca con sus prohibiciones.
- Seis casos de uso: acciones, estados, campos, foco, filas de tabla y los tres
  estados de pantalla.
- Cuatro comparaciones **bien / mal** con su medición.
- Tres maquetas: web, sistema y móvil.

**Qué apruebas tú:**

| Decisión | Dónde mirarlo |
|---|---|
| ¿El azul `#0063CB` como acción principal? | Casos de uso → Acciones |
| ¿El oro `#655000` como acción secundaria? | Casos de uso → Acciones |
| ¿El marco `#2C3D71`, ni muy fuerte ni muy débil? | Maquetas → Sistema |
| ¿El rojo solo en landing y en errores? | Maquetas → Web vs Sistema |
| ¿Los cuatro estados se distinguen de un vistazo? | Casos de uso → Estados |
| **¿Modo oscuro sí o no?** | Conmutador arriba a la derecha |

**La decisión que más pesa:** el modo oscuro está calculado y verificado, pero
**duplica la superficie de prueba** en todo lo que venga después. Si lo apruebas,
cada componente de las fases 4 y 5 se prueba dos veces. Si lo descartas ahora,
se descarta barato.

Mi recomendación: **descartarlo por ahora**. Es un sistema de gestión interno y
ese esfuerzo rinde más en densidad. Pero mira la maqueta antes de decidir.

**Al cerrar:** capítulo de color del manual — ya escrito, §2 del manual.

---

## Fase 2 · Tipografía

**Necesita:** la fase 1 aprobada.

**Qué se hace:** las dos escalas (landing hasta 56px, sistema hasta 28px) puestas
en las maquetas, con IBM Plex Sans y Mono servidas **desde el proyecto**, no desde
Google Fonts.

> El cascarón carga hoy las fuentes desde Google. Para producción hay que
> descargarlas y servirlas locales: privacidad y velocidad.

**Qué apruebas tú:** que 15px de interfaz no se quede corto en una tabla de
doscientas filas, y que 28px de título no se quede grande.

**Al cerrar:** §3 del manual — escrito.

---

## Fase 3 · Iconografía y densidad

**Necesita:** fase 2 aprobada.

**Qué se hace:** sustituir los emoji por Lucide (trazo 1,5px a 18px) y cablear el
conmutador de densidad, cómoda 34px / compacta 28px, que se recuerde por sesión.

**Qué apruebas tú:** el grosor del trazo. Es lo que hace que un sistema se sienta
ligero o denso, y no se ve hasta que está puesto.

**Al cerrar:** capítulo nuevo del manual — iconografía y densidad.

---

## Fase 4 · Componentes base

**Necesita:** fases 1 a 3 aprobadas. Los colores no se tocan a partir de aquí.

**Qué se hace:** los diez componentes reales en React + TypeScript, más la ruta
`/diseño` que los importa —no Storybook, §9— con copiar la **importación y las
props**, no el markup interno.

Radix solo para diálogo, menú y selector con búsqueda.

**Qué apruebas tú:** cada componente en la ruta `/diseño`.

**Aquí sí hace falta Docker.** Sin contenedor no se compila React.

---

## Fase 5 · Tabla de datos — contrato completo

**Necesita:** fase 4 aprobada.

**La de mayor retorno del proyecto.** Es el 80 % de la superficie del sistema.

Orden por columna, filtros, paginación, selección múltiple con acciones en lote,
encabezado fijo, desborde horizontal, columnas visibles, y los tres estados de
pantalla resueltos también fuera de la tabla.

**Al cerrar:** capítulo propio del manual.

---

## Fase 6 · Primitivas de dominio

**Necesita:** fase 5 aprobada.

**El activo que ninguna librería puede dar.** DNI y RUC con dígito verificador,
nombres con dos apellidos, ubigeo en cascada, soles, fechas peruanas.

Y documentar como **contrato de componente** que `perez` encuentre a `Pérez`
depende de `unaccent` y `pg_trgm`: es una promesa de interfaz, no un detalle de
base de datos.

---

## Fase 7 · Empaquetado y consumo

**Necesita:** fase 6 aprobada.

El ZIP que se descomprime en cada proyecto nuevo, y **probarlo de verdad** en un
proyecto real. Un paquete que nunca se ha consumido no está terminado.

---

## Lo que no está en ninguna fase

| Qué | Por qué |
|---|---|
| Storybook | Prohibido por §9. El catálogo es `/diseño` |
| Librería de componentes general | Prohibido por §9. Solo Radix para 3 casos |
| Escudo e isotipo | Trabajo de diseñador. Bloquean el favicon y el marco a 40px |
| Corrección del lockup | Trabajo de diseñador. `#EC2027` debe pasar a `#E30613` |
