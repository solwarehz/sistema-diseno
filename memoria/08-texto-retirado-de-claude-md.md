# Texto retirado de CLAUDE.md el 2026-11-01

`CLAUDE.md` pasó de 562 a ≤200 líneas. Esto es lo que se quitó, **literal**, porque
era historia —el porqué de cada candado, narrativa de un estado ya superado— y no
una regla que un agente deba leer al abrir sesión. Las reglas siguen en `CLAUDE.md`.

## A · Estado «v1.148.3 / R162» (§1)

**Estado actual: v1.149.0** — **R162: el gancho que mide deja de depender de
que la caja ya exista**, reportado por el equipo contra la v1.147.0.

`useCapacidadTablero` recibía un `RefObject` y lo miraba **una vez**, dentro del
efecto. Cuando la caja se monta detrás de una condición —un cargador, una
consulta, un `Suspense`— en ese instante `caja.current` es `null`, el efecto se
rinde y **el observador no se suscribe nunca**: el tablero se queda con la
capacidad de una caja de 0×0. Sí volvía a medirse —en cada `resize` de
ventana—, y ese matiz es del equipo: por eso el defecto **se cura con el gesto
de ir a mirarlo** en escritorio y sobrevive entero en un teléfono, donde no se
redimensiona nunca. Lo que no ocurría era **suscribirse**.

**La v1.147.0 lo arregló a medias**, y eso es lo que hay que decir: hizo que
`medir` reintentara, pero dejó el `observe` detrás del mismo guardia. Medir una
vez más no es suscribirse. **Media corrección se lee en verde igual que una
entera.**

La causa de fondo es de **orden**, no de código: un `RefObject` solo tiene nodo
*después* de pintar, así que cualquier gancho que lo reciba tiene que adivinar
cuándo mirarlo, y esa adivinanza falla siempre en el mismo sitio. La forma que
no adivina es la contraria — que el gancho **devuelva** el `ref` y sea React
quien lo llame, con el nodo en la mano. `useCapacidadTablero()` ahora devuelve
`{ ...capacidad, ref }`, y **la firma vieja sigue funcionando**: quien ya pasa
un `RefObject` no tiene por qué enterarse de esto para dejar de estar roto.

**Y el primer arreglo tampoco estaba bien.** Salió en verde con 39 pruebas y una
auditoría lo tumbó por tres sitios —`StrictMode`, la caja que se desmonta y
vuelve, y la pérdida del rescate por `resize`—, los tres el mismo error:
**tratar el enganche como un suceso y no como un estado que hay que mantener**.
Ahora se reconcilia después de cada render.

El detalle vive en [`memoria/01-estado.md`](memoria/01-estado.md), que se
reescribe con cada cambio de estado — este número es lo único que se toca aquí.


## B · Por qué existe cada candado (§8)

  **El de ESLint es el más joven y nació de una ausencia.** §6 dice que el
  candado prohíbe ocho cosas «con fallo de build», y no había tal fallo: ESLint
  no se corría en ningún paso. Al correrlo salieron **dieciocho infracciones**,
  dieciséis de ellas desde la v1.123.0 — cinco versiones publicadas. Y su propio
  guion **salía en verde cuando ESLint no podía ejecutarse**: contaba cero y daba
  por bueno, que es el defecto que este archivo persigue, dentro del candado que
  comprueba el candado.

  Los dos últimos faltaban de esta lista y **la memoria los contaba entre los
  ocho**: el 2026-08-10 pasaron un día entero sin correrse por eso, y al
  correrlos salieron en rojo los dos. Una lista incompleta de candados es un
  candado abierto.

  El de la **promesa muerta** es el último, y el que enseña que quince no eran
  suficientes. El 2026-08-28 el equipo que usa el sistema reportó que el
  selector con búsqueda no se veía como el catálogo: tenían razón en **nueve**
  puntos, y **los quince estaban en verde**. Dos de los nueve eran reglas que
  viajaban en el paquete de todos los productos y que **ningún producto podía
  activar** —`.sel-caja.abierta`, con el componente sin emitir nunca `abierta`—.

  Ninguno de los otros podía verlo. El de huérfanas mira solo el **primer**
  nombre del selector, así que `.sel-caja.abierta` no le parece huérfana porque
  `.sel-caja` sí se usa: la ceguera de prefijo, la misma que dejó pasar
  `.sel-op.activa`. El de la omisión hace la pregunta **contraria** —«¿el
  catálogo enseña la base sin el modificador?»— y nadie hacía esta. Y el de la
  promesa barre el marcado **estático** del catálogo, donde la lista del
  selector es un `<ul hidden>` vacío que llena su guión: no había nada que
  comparar.

  Se ata **por archivo** y no en un montón común de clases. Fue la corrección
  que hizo falta nada más probarlo: `abierta` la emite `MarcoApp` en
  `.nav-rama.abierta`, así que con un montón global **el candado daba por viva
  la clase y salía en verde delante del defecto que nació para cazar**. La
  pregunta correcta no es «¿alguien emite esta clase?», es «¿alguien emite las
  dos **juntas**?».

  Y nada más escribirlo encontró un defecto que nadie buscaba: `Paginacion` no
  emitía `activa`, así que **la página en curso no se pintaba en ningún
  producto**. Lleva **deuda declarada** —nueve el día que nació, **siete** hoy, con su daño real— y falla
  también si una se arregla y no se poda.

  El de la cascada es el único que no lee lo que hay, sino lo que **falta**: el
  defecto R25 —dos iconos pintados a la vez— vivía en la ausencia de una regla,
  y por eso los otros seis no lo vieron en tres versiones.

  El del **elemento** cierra el hueco que dejaba el de la promesa, y nació de
  dos defectos de la misma semana: el catálogo pintaba la tarjeta pulsable como
  `<a>` y el componente la emitía como `<button>` (R56), y la hoja estilizaba
  `h4` donde el componente emitía `h3` (R58). En los dos, la tarjeta se veía
  perfecta en el catálogo y mal en cada producto. **El candado de la promesa no
  podía verlos**: resuelve la cascada sobre el MISMO marcado, así que cuando lo
  que difiere es el elemento, le das lo mismo a las dos hojas y las dos
  responden lo mismo. Verde, y la pantalla mal.

  Lleva **deuda declarada**: cinco divergencias que encontró el día que se
  escribió —hoy quedan **dos**—, verificadas a mano y escritas con su daño real. Protege ya de las
  nuevas y no finge que las viejas no existen. Arreglar una es quitar su línea
  —y si se arregla y no se quita, el candado también falla, porque una lista de
  excepciones que nadie poda vuelve a ser el inventario a mano de siempre.

  El de la **forma** es el más joven y el que menos se parece a los demás: no
  mira lo que el sistema dice, sino **cómo está empaquetado lo que dice**. Nació
  de un fallo propio. La v1.67.0 metió el analizador de TypeScript delante en el
  candado de ESLint, y con eso `candado[0].rules` pasó a ser `undefined`: un
  proyecto que copiaba a mano los cuatro campos de `candado[0]` se habría
  quedado **sin ninguna regla activa y en verde**, porque ESLint no protesta
  ante un bloque sin reglas — simplemente no comprueba nada.

  Lo cazó Control Administrativos yendo a mirar la forma antes de confiar en
  ella, **no porque algo fallara**. Nadie se habría enterado, y es la clase de
  defecto que este repositorio ya conoce: el `box-sizing` que no viajaba y el
  analizador que no se entregaba. Lo suyo lo resume mejor que nosotros:
  *«cambiar la forma de lo exportado rompe a quien lo desarma, y verificar-entrega
  comprueba que todo salga, no que la forma se mantenga»*.

  Lo correcto sigue siendo esparcir —`...candado`—, pero **un paquete no puede
  repartir la culpa**: si se puede desarmar, alguien lo desarmará.

  El del **empate** nació de comprobar el anterior. Al montar el mismo marcado
  con las dos hojas en un navegador —24.642 propiedades— el filtro de columna
  de la tabla salió a 12px y 26,73px de alto con la hoja entregada y a 13px y
  36,18 con la del catálogo. **Ninguna regla faltaba ni sobraba: las mismas, en
  distinto orden.** `.tb-f` y `.campo` empatan en especificidad, y cuando dos
  reglas empatan gana la última — pero el extractor agrupa por elemento y les
  cambia el orden relativo. Ninguno de los otros podía verlo: el de la promesa
  compara una lista de elementos escrita a mano y ése no estaba en ella; el de
  la cascada resuelve la hoja que viaja contra sí misma, no una contra otra; el
  del elemento compara etiquetas, no valores.

  Se mide **solo sobre las combinaciones de clases que existen de verdad** en el
  marcado. Sin ese filtro salen 25.823 pares teóricos —`.sr-solo` contra
  `.nav-grupo` y demás parejas que no coinciden jamás—, y una lista así no se
  lee: se ignora.

  El de la **promesa** es el que compara las dos hojas resolviendo la cascada
  sobre el mismo marcado. Existe porque «no veo el botón CSV como lo veo en el
  cascarón» no lo cazaba ninguno: el reset `box-sizing: border-box` estaba en
  el catálogo y **no viajaba**, así que cada producto maquetaba en
  `content-box`. No lleva lista de propiedades «importantes» —compara todo lo
  que cualquiera de las dos hojas declare— porque elegir qué mirar es dejarlo
  a criterio, y eso es lo que se pidió que no se hiciera.


## C · «Móvil primero»: historia y anécdotas (§4bis)

## 4bis · Tres reglas que el usuario fijó expresamente

**MÓVIL PRIMERO. No es una preferencia: es política de diseño y se cumple.**
La fijó el responsable el 2026-09-19, y entra aquí porque el sistema la estaba
incumpliendo sin darse cuenta.

Qué significa, en concreto y sin margen:

- **Lo estrecho es el caso por omisión, no la excepción.** Un componente se
  diseña para la pantalla pequeña y **gana** cosas cuando hay sitio; no se
  diseña ancho y se le recorta. Cuando el componente decide su forma en tiempo
  de ejecución, **el estado inicial es el de móvil** y la forma ancha aparece al
  comprobar que cabe — no al revés.
- **Nada obliga a deslizar en horizontal para leer lo que la pantalla tiene que
  decir.** Si a un ancho de teléfono hay que arrastrar para ver una columna,
  eso es un defecto del componente, no del teléfono.
  **Deslizar sí puede ser la forma** —un tablero que se pasa como las páginas de
  iconos de un teléfono—, y entonces hacen falta las tres condiciones de la
  política de creación §5: alcanzable con teclado, que diga dónde estás y
  cuántas paradas hay, y que **nada quede sólo ahí**. Sin las tres, es
  desbordamiento con otro nombre.
- **Ningún texto queda cortado sin forma de leerlo entero — y `title` NO basta
  en un teléfono.** El recorte con puntos suspensivos es presentación; si el
  texto completo no se puede recuperar, la información **no está**.
  **Esta regla se escribió mal la primera vez** y lo cazó una auditoría: decía
  «si no está en `title`… no está», mandando como rescate justo lo que este
  repositorio ya tenía registrado como inservible ahí —`memoria/06-cobertura.md`,
  ficha C-08: *«Hoy solo hay `title`, que no se ve en móvil ni con teclado»*—.
  En una pantalla táctil no hay puntero que pasar por encima.
  Así que el orden es éste: **primero, no recortar** —envolver en dos líneas,
  apilar, dar una presentación estrecha—; si hay que recortar, el texto entero
  tiene que estar **alcanzable sin puntero**: al tocar, en una fila de detalle o
  en el propio contenido. `title` es el suelo para ratón y lector, **no el
  techo**, y por sí solo no cumple esta política.
- **Se verifica midiendo, no mirando.** A 360 px como mínimo, y en navegador.
- **Cómo se escribe en la hoja.** La regla base es la estrecha, fuera de toda
  `@media`; lo ancho entra con `min-width`. La hoja heredó consultas `max-width`
  (escritas al revés): no se copian en piezas nuevas. **No hay `@container`** en
  la hoja y no se introduce sin más: necesita un ancestro que declare el
  contenedor y los candados de promesa, empate y muerta solo manejan `@media`.
  El ancho de un contenedor se mide en JS (`ResizeObserver`, regla 33 de la
  matriz de privilegios).
- **Evitar al diseñar para un teléfono pequeño:**
  - **Medir al ancho de la maqueta.** El mínimo es 360 px (arriba). Un criterio
    escrito a 390 px —el ancho de la maqueta del R165— deja fuera los teléfonos
    que la política protege. Se escribe y se mide a 360.
  - **Dar por buena la pantalla porque cabe la pieza.** Que siete cuadros midan
    ~234 px no dice nada de la fila con foto y nombre: eso cabe o no según el
    sitio que deja el resto. La pieza cumple lo suyo; la pantalla se mide entera.
  - **Una letra, una sigla o un icono como única información.** `aria-label`
    sirve al lector de pantalla, no a quien ve «P» sin saber qué es: sin puntero
    no hay `title`. Si el significado no está a la vista, hace falta una leyenda
    visible y alcanzable sin puntero, o el dato no está (política de arriba).
  - **Recortar o deslizar lo que puede envolver.** Una serie que no cabe pasa a
    la línea siguiente; deslizar solo cumple con las tres condiciones de arriba.
  - **Escribir lo estrecho como excepción** (`max-width`): la base es la estrecha.
- **Un precedente se lee, no se cita de memoria.** La spec 03 llamó «33 reglas de
  640 px» a lo que eran las 33 `@media` de la hoja (8 de 640 px), y presentó
  como CSS de contenedor la regla 33, que mide en JavaScript. Lo cazó la
  evaluación de factibilidad, no el autor. Contar con `grep -c` y leer el
  mecanismo antes de escribir «el sistema ya hace X».

Lo que la hizo falta escribir: el R151 trajo la matriz de privilegios y su
responsive quedó **fuera de alcance por petición del equipo** —lo pusieron como
deseable, no como requisito—. Se declaró abierto dos veces y nunca se midió. Al
medirlo: a 360 px la tabla ocupa **687 px** y sigue siendo tabla, con el nombre
de fila recortado **y sin `title`**. Tres versiones diciendo «pendiente de
medir» sobre algo que, medido, no servía en un teléfono.

> Que el equipo no lo pida **no lo saca de la política**. Un requisito de
> producto puede faltar; una política del sistema, no.


## D · Correcciones aplicadas sobre MMI-DS v1.0.0 (§10)

### Correcciones aplicadas sobre MMI-DS v1.0.0

v1.0.0 declara «26 pares verificados, cero fallos». Al verificar los 46 que exige
la composición base (§5.1) aparecieron dos tokens fuera de norma. Ninguno estaba
entre los 26 originales:

| Token | Antes | Ahora | Medido | Norma |
|---|---|---|---|---|
| `borde-campo` | `#C8C6C4` | `#8B8985` | 1,70:1 → **3,48:1** | SC 1.4.11 |
| `texto-pista` | `#8B8985` | `#6A6864` | 3,49:1 → **5,55:1** | SC 1.4.3 |

El contorno de los campos a 1,70:1 era imperceptible: los inputs no se distinguían
del fondo.

En `texto-pista`, el gris más claro que alcanza 4,5:1 queda a **1,06:1** de
`texto-secundario` — indistinguible. La jerarquía del placeholder no se puede
expresar con color sin incumplir AA, así que pasó a regla de composición:
**etiqueta siempre visible, placeholder solo como ejemplo de formato.**

