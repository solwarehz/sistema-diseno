# Auditoría de entrega completa: la enfermedad R34, medida en todo el sistema

**Fecha:** 2026-08-10 · **Versión auditada:** v1.27.0
**Pregunta del responsable:** ¿qué componentes no hacen entrega completa —
qué pinta el catálogo que el React no entrega?

Herramienta: [`herramientas/promesa-vs-entrega.mjs`](herramientas/promesa-vs-entrega.mjs)
— compara las clases que el catálogo **pinta** (marcado + cadenas de su JS)
contra las que cada TSX **emite**. Salida cruda: 188 clases. Lo que sigue es el
juicio a mano de esas 188, verificado contra el fuente — **cero invención**:
cada afirmación de ausencia se comprobó con `grep` contra el TSX.

---

## Veredicto en una línea

Tras R34 la tabla quedó alineada, pero la enfermedad es **sistémica**: hay
promesa sin entregar en **ocho componentes más**, un caso con el cerebro
partido (RangoFecha: el catálogo tiene funciones que el React no, y el React
correcciones que el catálogo no), y **dos dobles familias de marcado** para la
misma pieza conviviendo en la hoja.

---

## 🔴 Promesa sin entregar — silenciosa (nada la declara)

| Componente | El catálogo pinta | El React entrega | Verificado |
|---|---|---|---|
| **RangoFecha** | **Dos meses** (`fc-cal-cuerpo` a dos columnas), **atajos** («últimos 30 días», `fc-atajos`), **previsualización del extremo** al pasar el cursor (`fc-previo`), **resumen** (`fc-resumen`) | Un mes, sin atajos, sin previo, sin resumen | `grep fc-atajos src/` → 0 |
| **MarcoApp** | Navegación de **tres niveles** (`nav-rama` → grupo → `nav-nietos`, con su animación y sus reglas de plegado en la hoja) | Dos niveles: grupo → hijos. El tercero no existe | `grep nav-nieto MarcoApp.tsx` → 0 |
| **Progreso** | **Progreso por pasos** — el stepper entero: `pr-pasos`, `pr-paso`, `pr-punto`, `pr-hecho`, `pr-curso`, `pr-pie-error` | Solo la barra | `grep pr-paso Estados.tsx` → 0 |
| **EstadoPantalla** | **Icono por caso** (`ep-ico-sin-resultados`, `-sin-permiso`, `-error`, `-primera-vez`…) y la marca de **cuándo** (`ep-cuando`) | Texto y acción, sin icono ni cuándo | `grep ep-ico Estados.tsx` → 0 |
| **SeleccionMultiple** | **«Todas»** (`ms-todas`) y el **conteo** («3 de 7», `ms-conteo`) | Ni conmutador global ni conteo | `grep ms-todas Interruptor.tsx` → 0 |
| **SelectorBusqueda** | **Visto en la opción elegida** (`sel-check`) y chevron (`sel-chev`) | Sin marca de selección visible en la lista | `grep sel-check SelectorBusqueda.tsx` → 0 |
| **Chip** | **Chip con punto** (`chip-con-punto`, «el punto acompaña, no sustituye») | Solo texto | `grep chip-punto Chip.tsx` → 0 |
| **Aviso** | **Entra deslizando** 16px desde arriba (`av-dentro`; «aparecer de golpe se percibe como fallo de pintado») | Aparece de golpe: nadie añade `av-dentro` | `grep av-dentro src/` → 0 |

El caso de **RangoFecha es el peor porque va en las dos direcciones**: el
catálogo promete funciones que el React no tiene, y el React tiene las cuatro
correcciones críticas de accesibilidad (teclado APG, roving tabindex, foco,
`aria-current`) que **el widget del catálogo sigue sin tener** — la referencia
enseña hoy el widget viejo (`id="fc-prev"`, dos meses) que la v1.19.0 declaró
reconstruido. La promesa está desactualizada y la entrega incompleta a la vez.

---

## 🟠 Dobles familias: dos marcados para la misma pieza, los dos en la hoja

1. **El campo tiene dos anatomías.** El catálogo pinta `cg` + `cg-et` +
   `cg-in` (línea 261 del generador) **y también** `campo-grupo` +
   `campo-etiqueta` (línea 466). El React usa `campo-*` en `Campo` y `cg-*` en
   RangoFecha. Las dos viajan en la hoja. Dos nombres para lo mismo es la
   deriva que el sistema existe para impedir.
2. **La marca del lateral tiene dos marcados.** El catálogo usa
   `lat-lockup`/`lat-escudo` (dos `<img>` que el plegado conmuta) y de respaldo
   `lat-id`/`lat-colegio`/`lat-nombre`; el React (`MarcaMenu`) usa
   `lat-marca-caja` con una sola imagen conmutada por prop y
   `lat-marca-texto` de respaldo. Ambas familias con reglas en la hoja.
3. **El panel de columnas de la tabla.** El catálogo lo pinta como menú
   anclado (`tb-cols-menu`/`tb-cols-panel`/`tb-col-op`/`tb-col-reset`); el
   React como bloque `tb-columnas` con `SeleccionMultiple`. Mismo derecho,
   distinta forma — quedó fuera de R34 y es de la misma clase.

---

## 🟢 Huecos declarados — la parte honesta

Ya estaban dichos y siguen siendo verdad: **selección múltiple de filas**
(`tb-act*`) y **filas plegables** (`tb-chev`/`tb-detalle`/`tb-sub`, reglas 16 y
17 del contrato marcadas PENDIENTE), y el **encabezado fijo** (manual §10).
Un hueco declarado no es un defecto: es un pendiente que dice la verdad.

---

## 🔵 Mobiliario o por decidir (no bloquea, se decide)

- `btn-op*`, `btn-oro`, `btn-marco` — aparecen en las escenas-maqueta del
  catálogo; si son variantes del sistema, faltan en `Boton`; si son de escena,
  que lleven marca de andamiaje.
- `hor-barra`/`hor-botones`/`hor-grupo`/`hor-tit` — la envoltura del horario
  (título + botones). ¿Componente o composición del producto?
- `ep-mini` — el estado vacío «mini» aparece en una tabla de documentación.
- `cf-lista`/`cf-item`/`cf-marcada`, `pg-pos`, `tp-opaca`, `migas-grupo`,
  `enl-desh`/`enl-en-marco` — variantes menores por confirmar una a una.
- `us-zip`, `pb-msj`/`pb-not`, `top-filtros` — composiciones propias del
  catálogo; correcto que no estén en React, conviene marcarlas.
- **Colisión de prefijo:** `av-ini` (iniciales del avatar) viaja clasificada
  bajo «Aviso temporal» porque empieza por `av-`. Nombre o lista, pero que no
  quede mintiendo de familia.

---

## Límites de la herramienta — declarados

Las clases emitidas por plantilla (`avatar-${tamano}`, `tp-${tono}`) salen
como falsos «sin entregar» (los `avatar-1..4`, `avatar-s/m/l/xl`, `tp-exito`…
de la salida cruda **sí se entregan** — verificado a mano). Los `id=` del
catálogo capturados desde su JS (`tb-cab`, `fc-prev`…) son ruido de
identificadores, no clases prometidas. Por eso la salida es materia prima y
esta auditoría es el juicio.

---

## Recomendación, por retorno

1. **RangoFecha converge** (el más dañino: dos verdades a la vez): el catálogo
   adopta el widget React —con sus correcciones— y las cuatro funciones del
   viejo (atajos, dos meses, previo, resumen) entran al componente o se
   declaran fuera. Decisión del responsable sobre cuáles.
2. **Los ocho silenciosos** se convierten en pedidos con número (como R34) y
   se cierran por versión, o se declaran PENDIENTE en el contrato — cualquiera
   de las dos es honesta; el silencio no.
3. **Las dobles familias se unifican** (campo primero: es el corazón de los
   formularios).
4. **El candado de la fase 3** de la auditoría de composición sigue siendo la
   cura de raíz: cuando el catálogo consuma el render real de los componentes,
   esta clase entera de defecto deja de poder existir. Todo lo anterior son
   tratamientos; eso es la vacuna.
