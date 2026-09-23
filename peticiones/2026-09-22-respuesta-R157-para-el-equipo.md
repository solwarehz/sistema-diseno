# Respuesta a R157 — piezas de tablero · para Control Administrativos V2.0

**22 de septiembre de 2026**, actualizado el **23** · MMI-DS **v1.145.0**

```bash
npm install "github:solwarehz/sistema-diseno#v1.145.0"
```

> **Instalen la v1.141.0.** La v1.133.0 publicó las siete piezas y
> **cuatro de ellas viajaban sin que nuestro catálogo las enseñara ni una vez**
> —el carril entero, los tres tonos de burbuja y dos tonos de superficie—. Lo
> encontró una auditoría nuestra, no ustedes, y el §7 cuenta qué falló.

**Entran los siete puntos.** Ninguno es de su pantalla: un tablero denso de
personas, un avatar con estado, una burbuja con tono, un indicador de conexión,
un carril con anclaje, una superficie tonal y un relieve de escala son piezas
que le faltaban al sistema, no a Tableros · En Vivo. Por eso se atienden.

Lo que **no** entra tal como lo pidieron está en el §3, con el porqué.

---

## 1 · Lo que se entrega

| Punto | Qué pidieron | Qué entra |
|---|---|---|
| **R157.1** | Rejilla densa | Clase **`tn-densa`** |
| **R157.2** | `Avatar` con estado | Prop **`estado`** — `exito \| aviso \| error \| info` |
| **R157.3** | Burbuja libre y con color | **`badge`** (la base, **roja** — la que pidieron para la tardanza) más **`badge-exito`**, **`badge-aviso`** y **`badge-info`**, publicada como pieza propia |
| **R157.4** | Indicador «en vivo» | Clase **`vivo`** con su punto |
| **R157.5** | Carril con anclaje | Clase **`car`** con `car-cuenta` y `car-punto` |
| **R157.6** | Fondo por grupo | Clase **`sup`** con `sup-exito \| sup-aviso \| sup-error \| sup-info` |
| **R157.7** | Relieve en el avatar | Prop **`elevacion="relieve"`** sobre **`--sombra-relieve`** |

Y un tamaño nuevo: **`tamano="fluido"`** en `Avatar`, que es lo que hace que la
rejilla densa no necesite un tamaño fijo por ancho de pantalla.

---

## 2 · Tres cosas que cambiaron respecto a lo que pidieron

### 2.1 · El estado del avatar no es `'presente' | 'ausente'`

Lo pidieron con los nombres de su dominio. Entra con los **tonos del sistema**:
`exito`, `aviso`, `error`, `info`.

El anillo no sabe de asistencia. El mismo verde sirve para «está dentro», «en
línea», «pagado» y «activo», y si el sistema publica `presente` la siguiente
pantalla que lo necesite para otra cosa tiene que elegir entre usar una palabra
que miente o pedir un cuarto nombre. La traducción es de ustedes y es una línea:

```ts
const TONO = { presente: 'exito', ausente: 'error' } as const;
<Avatar estado={TONO[persona.estado]} … />
```

### 2.2 · La rejilla no lleva un número de columnas, lleva un suelo

Pidieron **seis columnas en un teléfono**. Se escribió así y **se vio fallar en
nuestro propio catálogo**: con seis columnas y `gap: 8`, un contenedor de 260 px
da celdas de **36,7 px** —30 restándole la sangría de la `ul`—, y ahí un apellido
a 11 px no cabe. Un nombre que no cabe o se recorta o se parte, y la política de
móvil primero prohíbe las dos.

Así que lo fijo es **el suelo de la celda: 84 px** y el número de columnas es la
consecuencia: **las que quepan, repartiendo siempre todo el ancho**. Baja de
columnas antes que apretar.

**Cuántas salen, medido y no calculado.** A 360 px de ventana, con los rellenos
reales de nuestro propio catálogo encadenados —página 16, bloque 20, superficie
12— la rejilla recibe 261,3 px y da **dos columnas de 126,7**. Si el `.sup`
cuelga directo del contenido de la aplicación, **tres de 95,3**. A sangre, sin
relleno ninguno, cuatro. Dijimos «cuatro en un teléfono» sin encadenar los
rellenos: **depende de dónde lo monten**, y por eso el suelo es lo que se fija y
las columnas lo que sale.

Esto cambió después de que el responsable mirara el tablero montado y dijera
*«las veo muy apretadas que no se leen los datos»*. Es el mismo criterio que
piden ustedes —densidad— aplicado al revés: **una rejilla que no se lee no es
densa, es ilegible.**

### 2.3 · El anillo va por fuera, no como borde

`box-shadow`, no `border`. Un borde come del tamaño de la foto, y a 48 px eso se
nota: dos avatares con y sin estado salen de distinto tamaño y la fila baila.

---

## 3 · Las dos preguntas de norma

### 3.1 · El color sin texto — **su razonamiento es correcto, y se adopta**

Lo que proponen cumple la regla de `TarjetaPersona`, y por las cuatro razones
que dan. La que más pesa es la primera: **nunca se ven los dos grupos a la vez**.
El `Segmentado` con recuento —«Asistió 30» / «No asistió 11»— es el texto que
sostiene el color, y la hora bajo cada icono es el dato que distingue persona a
persona. El anillo **refuerza**; no porta nada él solo.

No hace falta un glifo por icono. **Sí hace falta que el `Segmentado` esté
siempre visible cuando la rejilla lo está** — si se queda fuera de pantalla al
desplazar, el color se queda solo y la regla se rompe. Queda escrito en la regla
2 de «Piezas de tablero».

### 3.2 · Los rótulos — **es decisión de su dueño y no la tocamos**

«Asistió» / «No asistió» los fijó su dueño el 22/09/2026. No es materia del
sistema de diseño: son las palabras de su negocio.

Sobre lo que anotan —que por la tarde la paridad de marcas mete en «No asistió»
a quien sí asistió— tienen razón y no es un problema de rótulo, es que **el
tablero está nombrando el estado presente con una palabra en pasado**. Si
quieren una fórmula que sirva a las dos horas, la que no se alarga es **«Dentro»
/ «Fuera»**: describe dónde está la persona ahora, que es lo que la paridad de
marcas realmente calcula. Se lo dejamos como sugerencia; la decisión es de su
dueño.

---

## 4 · Un defecto que encontramos mirando, y que les habría llegado

`tn-densa` se pone sobre una `<ul>` —es una lista de personas—. El navegador le
mete **40 px de sangría** propios de la lista, y eso sale del ancho con el que la
rejilla maqueta.

Medido en el catálogo a 333 px de ventana, sobre un contenedor de **234,7 px**:
con la sangría dentro, la rejilla repartía **194,7 px** y daba dos celdas de
**93,3**; con el reset, el mismo contenedor da dos de **113,3**. **Veinte píxeles
por celda.**

No se ve como un fallo. Se ve como un tablero apretado.

La clase ahora anula `margin`, `padding` y `list-style`.

> Este párrafo decía «dos columnas de 93 donde caben tres de 113» y mezclaba dos
> medidas de contenedores distintos. Lo cazó la misma auditoría. Lo decimos
> porque una cifra mal dada en un informe se convierte en una decisión de diseño
> en la pantalla de otro.

---

## 5 · Cómo se monta

**Reescrita el 23/09 por segunda vez**, y conviene decir por qué: la primera
versión enseñaba `tbl-crece` —que se desplaza en vertical— y la segunda ponía la
referencia **en el carril**, que es lo que deja la cuenta clavada en la primera
fila. Las dos fueron correctas en su día y las dos dejaron de serlo. Ésta es la
composición de la v1.145.0, y es la misma que monta nuestro catálogo.

```tsx
import { useRef, useState } from 'react';
import {
  Avatar, Segmentado,
  useCapacidadTablero, enPaginas, cuentaBurbuja,
} from 'sistema-diseno-ae/componentes';
import 'sistema-diseno-ae/tokens.css';        // SIEMPRE primero
import 'sistema-diseno-ae/componentes.css';   // al revés, no hay ningún color

// `gente`, `grupo`, `onGrupo` y `ultima` son de su pantalla, no del sistema.
function Tablero({ gente, grupo, onGrupo, ultima }: Props) {
  const caja = useRef<HTMLDivElement>(null);
  const { porPagina } = useCapacidadTablero(caja);
  const paginas = enPaginas(gente, porPagina);

  // En qué pantalla está. Se lee del propio desplazamiento porque aquí se pasa
  // de página DESLIZANDO: un estado que sólo cambie al pulsar diría lo que el
  // usuario no hizo.
  const [actual, setActual] = useState(0);
  const alDeslizar = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const i = Math.round(el.scrollLeft / (el.clientWidth || 1));
    setActual((v) => (v === i ? v : i));
  };

  return (
    // El alto lo pone el padre: <MarcoApp altoCompleto> (ver §5bis).
    <div className="tbl-marco">
      {/* `etiquetaOculta` esconde el rótulo A LA VISTA, no del lector: el
          `legend` sigue nombrando al grupo. En un tablero esa línea son
          personas que dejan de verse. */}
      <Segmentado
        etiquetaOculta
        etiqueta="Grupo"
        valor={grupo}
        onCambio={(v) => onGrupo(v as 'dentro' | 'fuera')}
        opciones={[
          { valor: 'dentro', texto: `Asistió ${dentro.length}` },
          { valor: 'fuera',  texto: `No asistió ${fuera.length}` },
        ]} />

      {/* LA REFERENCIA VA AQUÍ, NO EN EL CARRIL. El carril es `height: 100%` y
          su alto puede depender del contenido: entonces la cuenta se queda
          clavada en la primera fila —tres tarjetas y el resto de la pantalla
          vacío—. `tbl-lleno` lleva `overflow: hidden`, así que su tamaño nunca
          lo decide lo que hay dentro. */}
      <div className={`sup sup-${grupo === 'dentro' ? 'exito' : 'error'} tbl-lleno`}
           ref={caja}>
        <div className="car car-pagina" onScroll={alDeslizar}
             tabIndex={0} role="region"
             aria-label={`Personas, ${paginas.length} pantallas`}>
          {paginas.map((pagina, i) => (
            <ul className="tn-densa tn-densa-llena" key={i}>
              {pagina.map((p) => (
                <li key={p.id} className="tbl-persona">
                  <span className="tbl-foto">
                    <Avatar id={p.id} nombre={p.nombre} tamano="fluido"
                            estado={grupo === 'dentro' ? 'exito' : 'error'}
                            elevacion="relieve" />
                    {/* `badge` a secas es la ROJA, que es la que pidieron para
                        la tardanza. La burbuja necesita un ancestro POSICIONADO,
                        y `tbl-foto` lo es: dentro del <Avatar> no vale, porque
                        `.avatar` lleva `overflow: hidden` y la recortaría. */}
                    {p.tarde > 0 && (
                      <span className="badge">{cuentaBurbuja(p.tarde, '+')}</span>
                    )}
                  </span>
                  {/* EL NOMBRE COMPLETO NO ES OPCIONAL: ver §5bis. */}
                  <span className="sr-solo">{p.nombre} {p.apellido} · {p.hora}</span>
                  <span className="tbl-nom">{p.nombre}</span>
                  <span className="tbl-ape">{p.apellido}</span>
                  <span className="tbl-hora" aria-hidden="true">{p.hora}</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      {paginas.length > 1 && (
        <p className="car-cuenta" aria-live="polite">
          {paginas.map((_, i) => (
            <span key={i} className={`car-punto${i === actual ? ' car-punto-aqui' : ''}`} />
          ))}
          <span className="sr-solo">Pantalla {actual + 1} de {paginas.length}</span>
        </p>
      )}

      <p className="vivo"><span className="vivo-punto" /> En vivo · último dato {ultima}</p>
    </div>
  );
}
```

**El alto lo pone el padre.** Dentro no hay ningún `100vh`: el sistema no decide
el alto de una pantalla ajena. Si el padre es a su vez un contenedor flex, el
marco necesita además `flex: 1 1 auto; min-height: 0` de su lado.

---

## 5-alfa · Y esto contesta su R157.1, que llevaba sin respuesta

Pidieron **«6 columnas y 5 filas, sino no podré ver a todos»** — treinta personas
sin desplazar. El §2.2 explicaba por qué no fijamos seis columnas y **nunca les
dijimos cuántas van a ver**. Aquí está, recalculado con la función que se
publica:

| Área disponible para la rejilla | Por pantalla | 30 personas |
|---|---|---|
| 293 × 477 (teléfono de 360) | **9** | 4 pantallas |
| 323 × 621 (teléfono de 390) | **15** | 2 |
| 701 × 277 (tablet apaisada) | **14** | 3 |
| 957 × 531 (escritorio 1024) | **40** | **1** |
| 1213 × 631 (escritorio 1280) | **60** | **1** |

**En escritorio caben las treinta de una vez**, y con holgura. En un teléfono no,
y ahí el sistema no las aprieta hasta que dejen de leerse: **pasan a la siguiente
pantalla**, y la cuenta de puntos dice cuántas hay.

**Y no lo fija nadie: lo calcula la pantalla.** `useCapacidadTablero` mide el
área real y devuelve cuántas caben; `enPaginas` trocea. Si el área cambia —gira
el móvil, se pliega el lateral— se recalcula solo.

**Dos cosas más de su R157.1 que no les contestamos**: `tn-densa` **sí** lleva
`min-width: 0` en sus hijos, igual que `tn-cuadricula` —es lo que impide que un
apellido largo ensanche su columna—; y **no hay techo de columnas**: las doce
que pedían salen solas en cuanto hay sitio, y en 1280 salen doce exactas.

---

## 5bis · El nombre largo, y por qué el `sr-solo` no es opcional

**En el tablero que llena el área** —el que monta el §5— la celda es así:

- **El nombre va a una línea.** No es un recorte disfrazado: ese hueco recibe el
  nombre **corto**, y el completo vive en el `sr-solo`.
- **El apellido envuelve, con tope de dos líneas.** Medido a 11 px: de catorce
  apellidos de la zona, **trece entran en una sola**. El que se sale es el
  compuesto —«Villanueva-Bustamante», 115,2 px de texto— y **envuelve sin perder
  una letra**.
- **El suelo de fila son 114 px**, y es un **suelo, no un techo**: la fila se
  estira para llenar el área. Cabe el peor caso que la celda puede producir —48
  de foto + 10 de separación + una línea de nombre + dos de apellido + una de
  hora = **113 px**.

Ese suelo subió de 100 a 114 en la v1.142.0, y **cuesta densidad**: en un
teléfono de 360 se pasa de 12 personas por pantalla a **9**. Se paga porque con
100 la fila se quedaba corta y **los hijos se encogían en silencio**: un apellido
de dos líneas se pintaba a 13 px donde pide 27,5 — una línea entera desaparecida,
y nada lo denunciaba.

**Y cuando algo se recorta, el nombre completo sigue en la celda**, en ese
`sr-solo`. Nuestra política no prohíbe recortar: prohíbe recortar **sin forma de
leer el resto**. Si lo quitan, se llevan el recorte sin el rescate — y además el
lector de pantalla deletrea «Rosa Quispe 06:48» en vez de decir la persona.

---

## 5ter · Tres cosas que preguntaron y no les habíamos contestado

**El tope de `tamano="fluido"` son 48 px.** Pidieron el número («~46 px») y no se
lo dimos. Es el mayor de la escala —`avatar-xl`— a propósito: un tope suelto
dejaría que en una pantalla ancha el avatar creciera hasta ser un retrato.

**La burbuja va sobre cualquier `Avatar`, con una condición**: necesita un
ancestro **posicionado**. `.tbl-foto` lo es. No vale meterla dentro del
`<Avatar>` — `.avatar` lleva `overflow: hidden` y la recortaría.

**«En vivo» no usa `Chip` ni gasta un tono de estado.** Preguntaron con qué tono
sería si fuera un `Chip`: usa `--accion`, el acento de acción. Un `Chip` dice el
estado de un **dato**; esto dice el estado de la **conexión**, y en un tablero
los tonos de estado están ocupados por lo que se vigila.

---

## 5quater · Y cuatro cosas más suyas que no habíamos contestado

**«La forma NO se toca: sigue circular»** — **confirmado, y no se tocó.** Se
planteó el cuadrado redondeado y se descartó: en una rejilla densa la forma es lo
que distingue una persona de una entidad, y cambiarla ahí la habría roto en todo
el sistema. Lo que daba sensación de icono de aplicación era el **relieve**.

**«¿El sistema tiene ya una escala de sombras? No la hemos encontrado en los
tokens»** — **no la encontraron porque no está donde buscaron**, y eso es cosa
nuestra. `--sombra-relieve` vive en `componentes.css`, no en `tokens.css`, igual
que `--sombra-marco` y `--sombra-barra`. Son tres sombras actuando como una:
contacto, difusa y luz interior.

**Su composición provisional de tres sombras + `inset`** era la idea correcta:
la que entra hace exactamente eso. Lo único que cambió es que **es un token**,
no tres valores en cada pantalla.

**Y queda una cosa abierta, medida y sin resolver**: `--sombra-relieve` **no
tiene variante oscura**. Nuestras otras dos sombras sí, con esta razón escrita:
«sobre negro, una sombra al 18 % no existe». El relieve usa ese mismo 18 %. No
lo hemos medido en oscuro y **no les decimos que funcione**.

---

## 6 · Las dos confirmaciones que pidieron, y no les habíamos contestado

**«queremos que diseño confirme la excepción»** de cabecera —un tablero sin `h1`
ni migas—. **Confirmada y escrita en el manual**: «El tablero: una pantalla que
no lleva título». Cada línea de cabecera es una fila de datos que deja de verse.
Pero **no puede quedarse sin nombre accesible** ni fiar al color lo que se
vigila: eso no es negociable.

**«Y si el manual §5.4 […] cubre también a los tableros, díganlo»** — sí, y con una
distinción nueva que trajo su requerimiento. **Y ya está escrita donde ustedes fueron a
mirar**: el §5.4 del manual dice hoy «una excepción, y sólo una: la paginación
por gesto», con las tres condiciones y citándoles a ustedes. Tardó tres
versiones en llegar ahí —se escribió antes en la política y en el contrato— y
eso fue cosa nuestra.

- **Desbordamiento**: el contenido no cupo y se sale. Sigue siendo un defecto.
- **Paginación por gesto**: cada parada es una vista entera. **Legítimo, con tres
  condiciones y sin ninguna de propina**:
  1. **Alcanzable con teclado** — `tabindex="0"` y `role="region"` con nombre. Va
     en el marcado que publicamos; no es del producto.
  2. **Dice dónde estás y cuántas paradas hay.** Los puntos solos no lo dicen: se
     distinguen únicamente por color. Por eso la parada en curso **cambia de
     forma** además de color, y la cuenta lleva su texto para lector.
  3. **Nada queda sólo ahí.** Lo que haya que poder leer sin deslizar, se lee sin
     deslizar.

Sin las tres, es desbordamiento con otro nombre.

---

## 7 · Lo que falló por nuestra parte, contado entero

Ustedes no vieron nada de esto porque lo encontramos antes. Lo contamos porque
es la clase de cosa que decide si se fían de lo que publicamos.

**Cuatro piezas viajaban sin que el catálogo las enseñara.** El carril completo
—`car`, `car-cuenta`, `car-punto`, `car-punto-aqui`—, los tres tonos de burbuja
y dos tonos de superficie salían en la hoja de todos los productos y **no había
ni un ejemplo que copiar**. La pieza con la que su requerimiento nos hizo cambiar
la política de móvil primero era la que menos se podía usar.

**Y sus tres condiciones eran afirmaciones, no construcciones.** La de teclado la
delegaba un comentario a «quien lo use», así que entregábamos el anillo de foco
de un elemento que nadie hacía enfocable —una regla `:focus-visible` sobre algo
no enfocable no se dispara jamás—. La de «dónde estás» la sostenían seis puntos
que sólo se distinguen por color, contra nuestra propia regla.

**La causa común.** Todo el R157 se pintaba desde un guion, y tres de nuestros
candados cortan el documento justo ahí: para ellos el tablero no existía. El que
compara catálogo y paquete tampoco lo miraba — su lista de casos está escrita a
mano, tenía 63 entradas y ninguna del R157. **Veintiún pasos en verde sobre una
pieza que ninguno estaba mirando.**

Arreglado: el catálogo lo monta también en estático, entran 22 casos, y el
marcado entra en el contrato. Comprobado rompiéndolo: sacar la celda de tablero
de la hoja que viaja da **138 diferencias** donde antes daba verde.

**Dos pruebas estaban verdes sobre mutaciones que rompen su regla.** Una
comprobaba una lista de dos tonos prohibidos habiendo cuatro; la otra, que
`max-width` existiera —puesto en 400 px, el retrato que la regla dice evitar,
seguía en verde—. Ahora se comparan contra lo exigido.

**Y cinco afirmaciones nuestras eran falsas**: dos cifras que mezclaban medidas,
«la burbuja sale del marco» con la burbuja aún dentro del marco en la hoja
entregada, un pendiente dado por cerrado que nuestro auditor sigue imprimiendo, y
un comentario que decía enseñar un carril que no monta.

**El contrato de marcado no viajaba.** Estas piezas no tienen componente: las
compone la pantalla, así que el marcado **es** la interfaz. No estaba en ningún
archivo del paquete — sólo en el borrador de esta carta, que no entra ni en el
ZIP ni en npm. Ahora es una tabla en `comportamiento.md`. Y la cabecera de la
hoja remitía ese contrato a `componentes.md`, **un archivo que no existe**.

---

## 8 · Verificación

- Los **22 pasos** del publicador en verde, incluidas las pruebas y ESLint.
- El tablero **montado y vivo** en el catálogo con 24 personas, **y además en
  estático** — que es lo único que los candados pueden leer.
- Las **33** clases de la familia tienen marcado en el catálogo —las 28 de la
  v1.134.0, más `tbl-marco` y `tbl-crece`, más `tbl-lleno`, `tn-densa-llena` y
  `car-pagina`—: comprobado contando, no suponiendo.
- Las reglas viven en `sistema/componentes/comportamiento.md`, sección **«Piezas
  de tablero»**, con la tabla de marcado.

## 9 · Lo que NO está verificado, y lo decimos

- **La medición en navegador a 360 px de las piezas nuevas la hizo una auditoría
  nuestra**, con el catálogo dentro de un marco de 360 px. Las cifras del §2.2
  salen de ahí.
- **`--sombra-relieve` no tiene variante oscura.** Nuestras otras dos sombras sí
  la tienen, con esta razón escrita: «sobre negro, una sombra al 18 % no
  existe». El relieve usa ese mismo 18 %. **No lo hemos medido en oscuro** y
  queda abierto por nuestra parte.
- ~~«Los pares de contraste de `.sup` no están vigilados»~~ — **esto lo
  escribimos y era falso.** Están: `paleta.lock.json` lleva los **16** pares
  —`texto-principal` y `texto-secundario` sobre los cuatro fondos tonales, en
  los dos modos—, todos **bloqueantes** con mínimo 4,5 y todos cumpliendo. El
  peor es `texto-secundario` sobre `error-fondo` en claro: **4,66**. Lo cazó una
  auditoría nuestra antes de mandarles esto.
