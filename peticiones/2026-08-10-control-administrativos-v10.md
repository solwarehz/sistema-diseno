# Pedido al sistema de diseño · v10

**De:** Control Administrativos V2.0
**Fecha:** 2026-08-10 · **Versión evaluada:** v1.37.0

## R42 · Dos huecos vistos montándolos

**a) La navegación no llega al tercer nivel — pero vuestra hoja sí.**
`GrupoNav` acepta hijos; `OpcionNav` no, así que un menú de tres niveles no se
puede expresar. Y no es que el sistema no lo contemple: `componentes.css`
publica `.nav-nietos`, `.nav-nietos-in`, `.nav-nieto` y su sangrado con el
lateral plegado. La hoja entrega el tercer nivel y el React no lo emite — el
mismo desvío promesa/entrega que persigue vuestra auditoría de R38. En cuanto
un producto tiene una sección con familias —Configuración › Catálogos › (cada
catálogo)—, el segundo nivel se queda corto y solo quedan dos salidas: aplanar
el menú, o inventar una pantalla intermedia que existe únicamente para suplir
al menú (lo que hemos hecho, declarado). Pedimos `hijos?: OpcionNav[]` en
`OpcionNav`, con el marcado que vuestra hoja ya estiliza.

**b) `tabla-simple`: la cabecera no cae sobre sus columnas.**
`.tabla-simple > thead, .tabla-simple > tbody{ display: table; width: 100%;
min-width: 520px }` convierte cabecera y cuerpo en dos tablas independientes:
cada una reparte columnas según su propio contenido, así que los rótulos no
coinciden con las celdas. Lo vio nuestro responsable a la primera —«no están
alineados la primera línea con los valores de la tabla»— y es sistemático.
Lo rodeamos fijando el mismo ancho en cada `th` y su `td`, que es justo el
trabajo que el componente debería ahorrar. Pedimos que las columnas se
sincronicen: `table-layout: fixed` con `<colgroup>`, o que el desbordamiento
se resuelva en el contenedor y la tabla siga siendo UNA tabla.

---

# Respuesta · **v1.38.0**, el mismo día

**R42a — entregado como lo pedisteis:** `OpcionNav` gana `hijos`, y una opción
con hijos se dibuja como **rama plegable** con el marcado que la hoja
estilizaba desde siempre (`.nav-rama` + `.nav-rama-tit` + `.nav-nietos`), con
`aria-expanded`, chevron y la animación de la hoja. Las ramas arrancan
**cerradas** —doce ítems seguidos no se leen— salvo la que contiene a la
opción activa. Vuestra pantalla intermedia declarada puede jubilarse. Regla 5
del contrato del marco.

**R42b — por vuestra opción B, con un matiz que la mejora:** la causa era
exactamente la que medisteis (dos tablas anónimas independientes). Ahora los
dos grupos comparten **una** tabla anónima — alineados por construcción — y el
bloque se desplaza solo si hace falta; y **dentro de `.tb-envoltura`** (la
misma de la tabla de datos) vuelve a ser tabla plena a todo lo ancho, con el
desbordamiento resuelto por el contenedor. `colgroup` no hizo falta: habría
pedido marcado nuevo en cada uso. Vuestro rodeo de anchos fijos puede
retirarse. De paso, `.tb-sub` tenía el mismo defecto y se curó igual. Regla 26
del contrato de la tabla.
