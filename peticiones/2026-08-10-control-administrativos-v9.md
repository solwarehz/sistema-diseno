# Pedido al sistema de diseño · v9

**De:** Control Administrativos V2.0
**Fecha:** 2026-08-10 · **Versión evaluada:** v1.31.0

## R39 · El cajón de ≤700px no tiene velo NI salida con el ratón

Un cajón que tapa el contenido necesita un velo que lo diga y un cierre que se
alcance. Visto al estrechar la ventana con el menú extendido (captura
2026-08-10 21:09); medido contra v1.31.0: MarcoApp pinta
`<div className="velo">` y su comentario promete «cierra al pulsarlo» — pero
la hoja no trae ni una regla `.velo{…}` (única mención:
`.app-marco .velo{display:none}`); un div sin reglas mide 0×0 — ni vela ni se
puede pulsar. El único cierre con ratón, `.top-plegar` (z-index:10), queda
tapado por el propio cajón (`.lat`, z-index:60, 236px): con el cajón abierto
solo salva Escape, que nadie descubre. Y al cruzar de ancho a angosto con el
menú extendido nadie pliega: el cajón queda plantado sobre el contenido.

Pedimos: (1) las reglas del velo — fondo que oscurece, inset:0, z-index bajo
`.lat`, clicable; (2) cierre alcanzable con el cajón abierto (el velo clicable
lo resuelve); (3) pliegue automático al entrar en la banda del cajón. Mientras
llega lo hacemos por fuera con vuestra API `plegado`/`onPlegar` — rodeo
declarado que retiraremos. Encaja como quinto y sexto ojo de vuestra auditoría
R38: este tampoco lo ve una herramienta de `@media`.

---

# Respuesta · **v1.33.0**, el mismo día

Las tres, y confirmado vuestro diagnóstico línea por línea — el velo era un
div de 0×0 con un `onClick` que nadie podía pulsar.

1. **El velo existe**: `position:fixed; inset:0`, fondo del marco con opacidad
   (la receta del velo de siempre), **z-index 55** — bajo el cajón (60), sobre
   todo lo demás incluida la barra — y `cursor:pointer`. Vive en el mismo
   bloque `@media (max-width:700px)` que el cajón, en la hoja que viaja.
2. **Pulsarlo pliega** — el `onClick` que ya existía por fin tiene dónde caer.
3. **Cruzar a la banda pliega solo**, con `matchMedia('(max-width:700px)')`, y
   **avisa por `onPlegar`**: vuestro producto que persiste la preferencia se
   entera. Montado ya en angosto, arranca plegado. Podéis retirar el rodeo.

Regla 3 del contrato del marco, cuatro pruebas nuevas (222). Y tenéis razón en
lo del sexto ojo: `responsive-vs-entrega.mjs` compara clases, no cajas — un
selector presente con cero reglas de caja se le escapa. Queda anotado en R38
como límite de la herramienta; la cura de raíz sigue siendo el candado que
monte los componentes de verdad (fase 3).
