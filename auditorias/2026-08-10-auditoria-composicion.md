# Auditoría de composición: componentes que usan componentes

**Fecha:** 2026-08-10 · **Versión auditada:** v1.19.0 (main, siete candados en verde)
**Alcance:** las tres reglas que pidió el responsable — (1) los componentes se
componen de componentes, (2) no existe CSS que no forme parte del sistema,
(3) el cascarón también debe consumir solo componentes.

Todo lo que sigue está **medido**, no estimado. La herramienta nueva vive en
[`herramientas/clases-tsx-vs-hoja.mjs`](herramientas/clases-tsx-vs-hoja.mjs) y
sus salidas se citan textuales.

---

## Veredicto en una línea

La composición entre componentes React está **sana con dos excepciones** (una
rota, una reconstruida); la hoja que viaja **lleva CSS de demostración que no
es del sistema**; y el cascarón **no consume componentes: los replica a mano**
— por diseño de una época que ya terminó, porque hoy hay contenedor con node.

---

## 🔴 1 · El calendario de RangoFecha sale SIN ESTILO donde se importe

**El hallazgo grave.** El componente React emite tres clases que **no tienen
regla en ninguna hoja**:

```
RangoFecha.tsx         .fc-dia
RangoFecha.tsx         .fc-otro-mes
RangoFecha.tsx         .fc-extremo
```

El catálogo pinta las celdas del calendario con **otras clases** — `fc-d`,
`fc-ini`, `fc-fin`, `fc-dentro`, `fc-previo`, `fc-vacio` — y de ahí extrae la
hoja que viaja. El React y el catálogo **divergieron en el nombre de las celdas
del día**: cualquier proyecto que importe `RangoFecha` recibe un calendario con
los días sin altura, sin hover, sin marcar el rango. Las 180 pruebas pasan
porque prueban comportamiento, no estilo.

**Por qué ningún candado lo vio.** Es exactamente el punto ciego que
`extraer.mjs` declara en su propio código (líneas 297–302): su candado de
huérfanas ve `className="x"` pero **no las clases dentro de un array** —
`className={['fc-dia', otroMes ? 'fc-otro-mes' : '', ...]}` — que es la forma
en que RangoFecha las emite. El límite estaba documentado con honestidad; esta
auditoría es la primera vez que se materializa. La lección de R25 otra vez: el
defecto vivía en lo que **falta**, no en lo que hay.

**Qué decidir antes de arreglar:** cuál de los dos lados gana el nombre. La
hoja se extrae del catálogo, así que lo barato es que el TSX emita las clases
que ya existen (`fc-d` y compañía); lo legible es renombrar en el catálogo a
`fc-dia`. Cualquiera de los dos exige regenerar, pasar los siete candados y
subir versión.

---

## 🟠 2 · SelectorBusqueda reconstruye Campo en vez de componerlo

`SelectorBusqueda.tsx` no importa ningún componente y arma a mano el envoltorio
completo del campo con **las clases de Campo**: `campo-grupo`,
`campo-etiqueta`, `campo`, `campo-mal`, `campo-error`, `campo-ayuda`.

Que el `<input role="combobox">` sea suyo es correcto — un combobox necesita
controlar su input. Pero `Campo` expone desde su creación un **render-prop
exactamente para esto** (`Campo.tsx:48`): `children` recibe `{ id,
aria-describedby, aria-invalid }` y deja poner el control que sea dentro del
envoltorio real, con la etiqueta vinculada y los mensajes cableados por el
componente dueño. Es el mismo antipatrón que Paginación ya corrigió y dejó
comentado en su código («reusaba la clase del campo pero no el componente»).

**Contraste con el caso bien resuelto:** `RangoFecha.tsx:181–186` también usa
la clase `.campo` en crudo — pero sus disparadores son botones que *parecen*
campo (un input no abre un diálogo), la excepción está **escrita en el código
para que se discuta**, y Campo no puede expresarla ni con render-prop. Eso no
es deuda: es una decisión razonada esperando ratificación. Se ratifica o se
revierte, pero no se confunde con el caso de SelectorBusqueda, que sí pudo
componer.

---

## 🟠 3 · La hoja que viaja lleva CSS que no es del sistema

`componentes.css` — la hoja de ENTREGA — contiene **≈109 líneas** de andamiaje
del catálogo que ningún componente emite: `chip-fila-demo`, `sel-demo-fila`,
`cf-demo`, `ep-marco-demo`, `anatomia`, `avatar-rejilla`, `estado-rejilla`,
`sw-rejilla`, `tp-rejilla`, `mal-rejilla`, `tabla-manual`, `top-cascaron`…

La causa es estructural: la lista blanca de `extraer.mjs` filtra por
**prefijo** (`chip`, `sel`, `avatar`…), y las clases de demostración del
catálogo comparten prefijo con las reales, así que viajan de polizón. El
proyecto consumidor instala reglas como `.top.top-cascaron{ position: sticky }`
que solo existen para la página de exhibición.

**Y el defecto tiene dos caras.** El mismo día de esta auditoría, Control
Administrativos pidió (R28, `peticiones/2026-08-10-control-administrativos-v5.md`)
que `.bloque` viaje: el catálogo lo usa para el marco de barra + tabla + pie,
pero `bloque` está en la lista de **exclusión** de `extraer.mjs:80` y sus
declaraciones no se publican, así que cada consumidor las copia a mano. La
ironía, medida: la única regla con `.bloque` que hoy SÍ viaja es
`.cat-cuerpo, .pagina, .bloque, .app-main{ min-width: 0; }` — andamiaje del
catálogo. **Viaja lo que no debe y no viaja lo que sí**: la clasificación por
prefijo falla en ambas direcciones y hace falta la marca explícita.

**Arreglo propuesto:** sufijo reservado. Toda clase de andamiaje del catálogo
pasa a llevar `-demo` (o prefijo `cat-`), y `extraer.mjs` las excluye por regla
única en vez de por enumeración. El extractor ya grita ante prefijos sin
clasificar; esta sería la misma disciplina para el andamiaje.

---

## 🔵 4 · El cascarón no usa componentes — y ya no tiene excusa técnica

La regla que pidió el responsable — «incluso en el cascarón debemos usar solo
componentes» — hoy **no se cumple ni puede cumplirse sin obra**, porque la
arquitectura actual es la inversa:

```
HOY:      generar-cascaron.mjs (7.769 líneas, HTML a mano)
             └── escribe el CSS y el marcado del catálogo
                    └── extraer.mjs EXTRAE componentes.css (la hoja que viaja)
                           └── los componentes React CONSUMEN esas clases
```

El catálogo no importa los componentes: **es su origen**. Los replica a mano, y
la réplica es donde nació el hallazgo 1. `prueba-componentes.html` agrava el
patrón: marcado copiado a mano, **ningún script la genera**, nadie la vigila.

Esto fue una decisión honesta en su momento — está escrita en `extraer.mjs`:
«Escribir React que no se puede compilar en esta máquina sería entregar código
nunca ejecutado». **Esa premisa ya no es cierta:** el contenedor `ds` compila y
prueba React desde el 2026-08-10, con autorización permanente de Docker.

**Camino propuesto** (por fases, cada una con su versión y sus candados):

1. **Invertir la prueba, no la arquitectura:** un candado nuevo renderiza los
   23 componentes reales (`renderToStaticMarkup` en el contenedor) y cruza
   **todas** las clases emitidas contra la hoja que viaja. Es el hallazgo 1
   convertido en candado permanente, y cubre a los 23 lo que hoy la cascada
   solo cubre para MarcoApp. Barato y de retorno inmediato.
   *Advertencia heredada de R26 (retirado el 2026-08-10 por el propio
   consumidor): si esta comprobación algún día pregunta a un navegador de
   verdad en vez de a `renderToStaticMarkup`, tiene que asegurar página
   visible o transiciones desactivadas — una pestaña oculta congela las
   transiciones en el milisegundo cero y produce defectos que no existen.*
2. **`prueba-componentes.html` se genera desde los componentes** con ese mismo
   render — deja de ser una réplica a mano que nadie vigila.
3. **El catálogo consume el render real** sección a sección: cada muestra del
   cascarón pasa de HTML a mano a marcado emitido por el componente. El CSS
   deja de autorarse «en el catálogo» y pasa a autorarse «junto al
   componente»; `extraer.mjs` deja de extraer y pasa a **verificar**.

La fase 3 es obra mayor (el generador tiene 7.769 líneas) y no se empieza sin
decidirla; las fases 1 y 2 son pequeñas y eliminan ya la clase entera del
hallazgo 1.

---

## 🟢 5 · Lo que está sano — medido, no supuesto

**La matriz de composición.** 11 de 23 componentes importan a otros, y las
puntas están bien puestas:

| Compone | De qué |
|---|---|
| TablaDatos | Boton · Chip · Campo · Paginacion · SeleccionMultiple |
| MarcoApp | MenuUsuario · MarcaMenu · Icono |
| MenuUsuario | Avatar · Icono · usarDesplegable |
| Tarjeta | Avatar · Chip |
| Dialogo / Confirmacion / Estados / RangoFecha | Boton |
| Paginacion | Selector (tras corregir el antipatrón, y lo dejó comentado) |
| CabeceraPantalla | Migas |
| PanelBarra | Icono · usarDesplegable |

**Los `<button>`/`<input>` nativos restantes son legítimos:** o el componente
ES la primitiva (Boton, Campo, Interruptor), o son piezas propias con clase
propia (los botones del paginador `pgn-btn`, los del marco `top-btn`, las
celdas del calendario). MenuUsuario incluso lo comenta: «el disparador ENVUELVE
al avatar en vez de repetir sus clases».

**Migas no reconstruye Enlace:** sus `<a>` reciben color de enlace, hover y
anillo de foco desde `.migas a` en la hoja del sistema — estilo contextual del
componente, no una copia.

**Ningún color fuera del sistema:** `verificar-color.mjs` recorre 100 archivos
y sale limpio; las únicas menciones de hexadecimales fuera de tokens son prosa
que documenta, no pintura.

**Pendientes ya conocidos, sin cambio:** los dos `style=` dinámicos de
`Estados.tsx` (45 y 144, ancho de esqueleto y de barra de progreso — resolubles
con una variable CSS) y la regla de elevación sin definir que reporta el
auditor del cascarón.

---

## Los números de la pasada

| | |
|---|---|
| Componentes auditados | 23 |
| Que componen a otros | 11 |
| Clases emitidas sin regla (rotas) | **3** — todas en RangoFecha |
| Reconstrucciones donde cabía componer | **1** — SelectorBusqueda |
| Excepciones escritas y razonadas | 1 — RangoFecha, pendiente de ratificar |
| Líneas de CSS de demostración en la hoja de entrega | ≈109 |
| Reglas del catálogo que no viajan | 416 de 1.127 |
| Páginas replicadas a mano sin generador | 1 — `prueba-componentes.html` |
