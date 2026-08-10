# Pedido al sistema de diseño · v6

**De:** Control Administrativos V2.0
**Versión evaluada:** v1.26.0 (montada)
**Fecha:** 2026-08-10

## R34 · La tabla no pinta lo que su catálogo promete

Nuestro responsable puso lado a lado la tabla del producto (v1.26.0 montada) y
vuestra «Tabla de datos» del catálogo, y no se ven iguales. Verificado contra
el fuente instalado: es del componente, no de nuestro montaje. El caso general:
el catálogo es la promesa y el componente es la entrega — cada pieza que el
catálogo muestra y el componente no trae, cada consumidor la reconstruye a mano
(justo lo que el componente existe para evitar) o la pierde. Medido:

| Vuestro catálogo muestra | El componente entrega |
|---|---|
| «Buscar en toda la tabla», campo con lupa en la barra | No existe (0 apariciones en el fuente) |
| «Mostrar [N]» + recuento con sustantivo («38 trabajadores») | No existe — el tamaño de página solo vive en la paginación del pie |
| «Filtros»/«Columnas» con icono, mandos a la DERECHA | Sin iconos (no importa Icono), y al revés: mandos a la izquierda |
| Columna «N.º» localizadora, continua entre páginas | No existe |
| Pie: «1–10 de 38» a la izquierda, paginación a la derecha | El rango va arriba; el pie solo lleva paginación |

Pedimos que TablaDatos pinte lo que el catálogo pinta — búsqueda global,
«Mostrar» con recuento, iconos y disposición de la barra, N.º y el rango en el
pie. Si alguna pieza es deliberadamente del catálogo y no del componente,
decidlo y actualizamos la referencia; lo que no puede quedar es la promesa y la
entrega contándose distinto.

---

# Respuesta · **v1.27.0**, el mismo día

Teníais razón en las cinco. **Ninguna era deliberada del catálogo**: eran
entrega incompleta, y entraron todas.

- **Búsqueda global** — mira todas las columnas, se **suma** a los filtros y
  vuelve a la página 1. En `servidor` se emite por `alCambiar`
  (`EstadoTabla.busqueda`).
- **«Mostrar [N]» + recuento** — en la barra, con sustantivo
  (`sustantivo="trabajadores"`). Con criba dice «X de Y» aunque X = Y.
- **Iconos y disposición** — Filtros y Columnas con su icono, a la derecha,
  con la ranura `acciones` donde el catálogo pone su CSV.
- **N.º** — continua entre páginas; `numerada={false}` para quitarla.
- **Pie** — rango a la izquierda, paginación a la derecha; el tamaño de página
  ya no se repite abajo.

**Rompe, al actualizar:** la barra cambia de disposición; N.º y búsqueda vienen
puestos por omisión (es lo que el catálogo prometía — `numerada={false}` /
`buscable={false}` para quitarlos); el selector «Filas» del pie desaparece;
`porPagina=0` significa «Todas».

Reglas 22–25 del contrato, diez pruebas nuevas (205 en total), ocho candados en
verde. Etiqueta `v1.27.0` publicada.
