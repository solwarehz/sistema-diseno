# Respuesta a Control Administrativos V2.0 — segunda revisión

**De:** equipo del sistema de diseño
**Sobre:** «Requerimientos al sistema de diseño», 2026-08-09 · segunda revisión
**Versión que responde:** v1.11.1, la que ya tienen

---

Gracias por el §0. Un requerimiento cerrado también informa, y dejarlo escrito
ahorra la siguiente ronda.

Empezamos por lo que les va a desbloquear hoy mismo, sin esperar a nada nuestro.

---

## 1 · R4 · Los cinco iconos **ya los tienen**, y les explicamos cómo verlos

Es la tercera vez que lo piden y los cinco están publicados desde antes de la
versión que evaluaron. Los comprobamos uno a uno antes de escribir esto:

| Icono | Nombre | Bytes |
|---|---|---|
| Candado | `candado` | 287 |
| Lupa | `lupa` | 259 |
| ✕ de cerrar | `cerrar` | 234 |
| ✓ | `visto` | 228 |
| Triángulo de alarma | `alerta` | 264 |

**No es culpa suya.** Están buscando por el dibujo —«✕ de cerrar», «✓»,
«triángulo de alarma»— y el conjunto se nombra **en español y por lo que
significa**. Ese `✓` se llama `visto`, y el triángulo se llama `alerta` porque
lo que importa es qué dice, no qué forma tiene. Ese criterio no lo habíamos
explicado, y es nuestro fallo.

### Cómo se usan

```jsx
import { ICONOS, icono, TAMANOS } from 'sistema-diseno-ae/iconos';

// La cadena SVG lista para insertar, al tamaño que toca:
<span dangerouslySetInnerHTML={{ __html: icono('candado', TAMANOS.control) }} />
```

`icono(nombre, tamaño)` devuelve el SVG completo. `ICONOS` es el mapa ya
renderizado al tamaño por omisión, por si prefieren tirar de él directamente.

**Los cuatro tamaños, y no hay más:**

| Constante | px | Para |
|---|---|---|
| `TAMANOS.etiqueta` | 14 | Dentro de una etiqueta o un chip |
| `TAMANOS.control` | 16 | Botones, campos, controles |
| `TAMANOS.texto` | 18 | Junto a texto corrido |
| `TAMANOS.estado` | 32 | Estados de pantalla |

### Cómo verlos todos

Están los **39** en el catálogo, en **Fundamentos → Iconos**, con su nombre al
lado para copiar. El catálogo viaja en el ZIP como `catalogo/index.html`.

O desde código, sin abrir nada:

```bash
node -e "import('sistema-diseno-ae/iconos').then(m => console.log(Object.keys(m.ICONOS).join('\n')))"
```

Y aquí los tienen de una vez, para que no haya que buscarlos nunca más:

```
academico       administracion  alerta          asistencia
atras           camara          campana         candado
capas           cerrar          chevron         chevronDer
chevronIzq      columnas        comunicaciones  configuracion
descargar       descargar2      escritorio      filas
filasFinas      filtro          hamburguesa     libro
luna            lupa            mas             matricula
movil           ordenar         panel           panelIzq
roto            salir           sobre           sol
tesoreria       usuarios        visto
```

Si después de esto les sigue faltando alguno, dígannos **qué acción** necesita
icono y lo dibujamos nosotros. Hicieron bien en no dibujarlo: un trazo a mano se
separa del conjunto a la primera revisión.

> **Una cosa que sí arreglamos por esto.** Al comprobarlo encontramos que el
> catálogo dibujaba ocho iconos como constantes escritas a mano en vez de
> consumir `iconos.mjs`. Hoy los trazos coinciden exactamente —lo medimos—, pero
> son dos fuentes para lo mismo y mañana podrían no coincidir. Lo quitamos.

---

## 2 · Su §6 ya está resuelto, en la versión que tienen

R6, R7 y R8 de esa sección salieron en la **v1.11.0**, que es la que evaluaron.
Ustedes mismos los dan por cerrados en su §0 — creemos que esa parte del
documento se quedó sin actualizar al refundirlo. Lo señalamos sin reproche, solo
para que no lo esperen:

| | Dónde está |
|---|---|
| **R6** · `transpilePackages` | `manual/ACTUALIZAR.md` §2, con Next, Vite y Webpack |
| **R7** · nombre del paquete | `manual/ACTUALIZAR.md` §2. Se instala desde el repositorio y se importa por el nombre del paquete; npm resuelve el segundo leyendo el `package.json` del primero |
| **R8** · reglas de comportamiento | `sistema/componentes/comportamiento.md`, en el ZIP y en npm |

Sobre R8: sus cinco reglas de la tabla están ahí **literalmente**, cada una
marcada «obligatorio del sistema» o «del proyecto». Viaja desde la v1.9.0. Que
las descubrieran pulsando es un fallo nuestro de comunicación, no suyo de
lectura — el archivo estaba y no les dijimos que estaba.

**D1 · `.tb-activos`** también está cerrado: `.tb-activos[hidden] { display:
none }`. Pueden marcarlo.

---

## 3 · R3 · Marcar que una pantalla opera en otro ámbito — **cambiamos de
respuesta**

Lo rechazamos dos veces con este argumento: *«es multiempresa, y el colegio no lo
es»*. **Ese argumento ya no vale, y la reformulación es la razón.**

Cuando lo pedían como «marco de plataforma», el caso era suyo. Al enumerar los
cinco, se ve que **cuatro aplican a cualquier producto**, incluido el colegio:
entornos, modo soporte, privilegio elevado, y datos reales frente a
demostración. Solo el primero —plataforma frente a cliente— es de un producto
multiempresa.

Tienen razón en las tres cosas que sostienen el pedido:

- **Un aviso de texto no sirve.** Se lee una vez y se vuelve invisible.
- **Tiene que ser periférico**, algo que esté a la vista sin mirarlo. Eso es lo
  que hace el marco, y por eso pedir tokens de marco es correcto.
- **Una diferencia que no se mide desaparece** en la siguiente revisión de
  paleta. Es exactamente el motivo por el que existe nuestro candado de
  contraste.

**Y su sugerencia de nombre es mejor que la nuestra.** `--ambito-alt-*` en vez de
`--plataforma-*`: si se llama «plataforma» sirve para un caso y hay que
reinventarlo para los otros cuatro. Lo adoptamos tal cual, con sus dos niveles
—«ámbito distinto» y «ámbito peligroso»—.

**Está elevado a nuestro responsable y esperando su autorización.** No es una
demora administrativa: ampliar la lista de colores autorizados no lo decide el
equipo de diseño, y esto son seis tokens nuevos que hay que diseñar y medir. Les
avisaremos con la decisión.

Cuando se haga, llevará una condición que conviene que sepan desde ya: **el color
no podrá ser el único portador de la señal.** SC 1.4.1 lo prohíbe, y quien no
distingue esos dos azules se quedaría sin la pista de seguridad justo por ser la
persona que más la necesita. El marco alterno vendrá con etiqueta de texto
obligatoria.

---

## 4 · R5 y R6 · **hechos**, en la v1.11.1

No esperaban autorización, así que salen ya.

### `Campo` acepta contenido propio

Tienen razón en el diagnóstico —ante ese 10 %, las dos salidas eran malas— y en
el precedente: `TablaDatos` compone en vez de rehacer.

```jsx
<Campo etiqueta="Ubicación" ayuda="Elige hasta llegar al distrito" error={err}>
  {({ id, 'aria-describedby': descrito, 'aria-invalid': malo }) => (
    <MiControlCompuesto id={id} aria-describedby={descrito} aria-invalid={malo} />
  )}
</Campo>
```

El envoltorio les entrega el `id` que hay que poner en su control y los
`aria-describedby` de la ayuda y el error **ya calculados**. Poniéndolos, para
el lector de pantalla sigue siendo el mismo campo del sistema.

### `Nota` · texto que explica y se queda

Coincidimos con el razonamiento completo: usar un aviso para algo permanente
**le quita el significado al color de aviso**. Si el ámbar siempre está, deja de
querer decir «mira esto».

```jsx
import { Nota } from 'sistema-diseno-ae/componentes';

<Nota titulo="Cómo se calcula:">
  Las horas se redondean al bloque de 15 minutos más cercano.
</Nota>
```

Superficie neutra, sin tono de estado, **sin `role`** —una nota permanente no es
una región viva; anunciarla como tal la haría interrumpir en cada repintado— y
sin comportamiento temporal: no se cierra ni se desvanece.

**Ningún color nuevo:** usa `fondo-encabezado`, `texto-secundario` y
`borde-fuerte`, que ya estaban autorizados.

---

## 5 · Lo que se queda en su lado, y con qué construirlo

Aquí no les decimos «es suyo» y les dejamos solos. Es suyo, **y esto es lo que
tienen para hacerlo sin escribir CSS**.

### Listado

Suyo, y coincidimos en que la mayor parte debería morir. Lo que queda es atar
`TablaDatos` a su API:

```jsx
<TablaDatos
  modo="servidor"
  total={respuesta.total}
  filas={respuesta.filas}
  columnasFijas={['documento']}
  alCambiar={(estado) => consultar(estado)}
/>
```

`alCambiar` les entrega `{ orden, filtros, pagina, porPagina }`. La consulta la
arman ustedes: el sistema no impone nombres de parámetros a propósito.

### Cascada de ubigeo — **con `SelectorBusqueda`, no con CSS**

Es suya, y su argumento es el correcto: un sistema de diseño que conoce el
ubigeo peruano deja de servir para el siguiente producto. Pero **la cascada no
necesita ni una línea de CSS suyo**: son tres `SelectorBusqueda` encadenados.

```jsx
<SelectorBusqueda
  etiqueta="Departamento"
  opciones={departamentos}
  valor={dep}
  onCambio={(v) => { setDep(v); setProv(null); setDist(null); }}
/>

<SelectorBusqueda
  etiqueta="Provincia"
  opciones={provinciasDe(dep)}
  valor={prov}
  onCambio={(v) => { setProv(v); setDist(null); }}
  deshabilitado={!dep}
/>

<SelectorBusqueda
  etiqueta="Distrito"
  opciones={distritosDe(prov)}
  valor={dist}
  onCambio={setDist}
  deshabilitado={!prov}
/>
```

**Con 1.891 distritos, `SelectorBusqueda` es justo el control que necesitan**, y
sin umbral: busca siempre. La normalización ya está dentro — `ancash` encuentra
«Áncash», igual que en la tabla.

Lo que es suyo es el **dato** y la **regla de dependencia** —al cambiar el
departamento se limpian provincia y distrito—. El control, el teclado, el
anuncio a lector de pantalla y el estilo son nuestros.

### Sistema de avisos

Nuestro, y **`Aviso` ya lo cubre**: cuatro tonos, `role="alert"` para el error y
`role="status"` para el resto, y el error **no se va solo** —uno que desaparece
es uno que nadie leyó—. La duración de error es `0` y el componente la fuerza
aunque se le pase otra.

Si les falta un caso concreto de los tres sitios que mencionan, dígannos cuál.

### Acción de servidor

Nuestro, y ya está dentro de `Boton`. Nada que hacer de su lado.

### Los dos comportamientos de §4 que no adoptamos

El detalle que se abre arriba empujando la tabla, y el retorno arriba al cerrar.
**Están bien razonados y se quedan en su producto** — pero tampoco necesitan CSS
suyo: son composición de `Tarjeta` con `Estados`, más su animación. Si al
montarlo les falta una pieza, es requerimiento.

---

## 6 · Sobre su nota del método

La aceptamos y la aplicamos. **De sus dos documentos salieron dos defectos que
ninguna revisión de escritorio había encontrado**: el foco en el botón
destructivo y la tabla que ordena solo la página visible. Los dos salieron de
usar el sistema.

Este ciclo lo prueba otra vez: comprobar su R4 nos hizo mirar los iconos, y
mirando encontramos ocho dibujados dos veces. Nadie lo había visto.

Sigan reportando.

---

## Estado de sus once puntos

| | Estado |
|---|---|
| R3 · ámbito alternativo | **Aceptado el diagnóstico.** Esperando autorización de la paleta |
| R4 · cinco iconos | **Ya los tienen.** Guía arriba |
| R5 · contenedor con contenido propio | **Se hace** |
| R6 (§2) · texto explicativo | **Se hace** |
| R6 R7 R8 (§6) | **Ya resueltos en la v1.11.1** que evaluaron |
| D1 · `.tb-activos` | **Cerrado** |
| Listado · ubigeo · §4 | Suyos, con las piezas de arriba |
| Selector con búsqueda · avisos · acción de servidor | Nuestros, **ya publicados** |
