# Respuesta a Control Administrativos V2.0

**De:** equipo del sistema de diseño
**Sobre:** «Requerimientos al sistema de diseño», 2026-08-09
**Versión que responde:** **v1.11.0** — publicada hoy

---

Gracias por el documento. La nota sobre el método es la parte más útil de todo
lo que mandaron: **el defecto del candado no se veía leyéndolo, se vio
ejecutándolo.** Lo tomamos.

Resumen: **de once puntos, ocho resueltos, uno rechazado con medición y tres ya
estaban hechos y no los encontraron.**

---

## Antes de nada: ningún color se crea fuera del sistema

Lo decimos aquí porque afecta a todo lo que sigue y a lo que pidan mañana.

**No se crea ningún color fuera del sistema de diseño.** Ni en su proyecto, ni
en el nuestro por petición suya. Los colores autorizados son **114**, están
congelados en `autorizados.lock.json`, y ampliarlos **no es decisión del equipo
de diseño**: la toma el responsable, caso por caso.

Si necesitan un tono que no existe, se pide y se mide. Lo que **no** hay es la
salida de escribirlo a mano «solo esta vez»: un color literal en una hoja de
estilos no pasa por ningún par verificado, así que su contraste no lo comprueba
nadie y sale en verde mientras la pantalla incumple.

Ya está bloqueado, no solo escrito. `verificar-color.mjs` recorre el
repositorio entero —hojas de estilo, HTML, atributos `style`, `.tsx`— y **falla
el build** ante un hexadecimal, un `rgb()` o un `hsl()` que no pertenezca a una
familia. Pueden pasarlo sobre su propio proyecto:

```bash
node node_modules/sistema-diseno-ae/sistema/candado/verificar-color.mjs
```

Esto es también la respuesta a su R3, y por eso va antes que él.

---

## 1 · Bloqueantes

### 🔴 R1 · Contrato de datos de `TablaDatos` — **resuelto**

Respondemos punto por punto, como pidieron.

**¿Dónde ordena y filtra?** Hasta la v1.10.7, **en el navegador sobre las filas
recibidas**. Tenían razón en que eso rompe con paginación de servidor, y la
razón que dan es la correcta: filtrando sobre la página traída, el pie diría
«3 de 38» con 10 filas delante.

**Desde la v1.11.0 se declara:**

```jsx
<TablaDatos
  modo="servidor"      // la tabla NO toca los datos
  total={380}          // obligatorio: cuántas hay EN TOTAL, no en esta página
  filas={paginaActual} // lo recibido ES la página; no se recorta
  alCambiar={(estado) => consultar(estado)}
/>
```

En `modo="servidor"` la tabla no ordena, no filtra y no recorta: solo emite el
estado por `alCambiar` y pinta lo que le den. El pie cuenta con `total`.

**¿Con qué forma exacta viaja la consulta?** Con la que ustedes quieran. El
componente no impone nombres de parámetros ni codificación del orden: les
entrega el estado y **la consulta la arman ustedes**. Es deliberado — el día que
el sistema decidiera cómo se llaman los parámetros de su API, dejaría de servir
para el siguiente producto. `alCambiar` recibe:

```ts
{ orden: { clave: string; dir: 'asc' | 'desc' } | null,
  filtros: Record<string, string>,
  pagina: number,
  porPagina: number }
```

**¿Se puede declarar una columna como no ordenable o no filtrable?** **Sí, y ya
se podía en la v1.10.6 que evaluaron.** Está en el tipo `Columna`:

```ts
{ clave: 'horas', titulo: 'Horas', valor: (f) => f.horas,
  ordenable: false, filtrable: false }
```

Con `filtrable: false` la celda de filtro sale vacía. Coincidimos con ustedes:
mejor una celda vacía que un control que engaña.

**¿Qué hace cuando la página traída es menor que el total?** Antes, mentir. Ese
era exactamente el punto que señalaron, y es lo que arregla `modo="servidor"`.

### 🔴 R2 · Foco inicial de `Confirmacion` — **resuelto, y les damos la razón**

Miramos el código antes de responder: **el foco arrancaba en el botón que
confirma.** En una confirmación destructiva, eso es el botón que borra.

Su salvaguarda es mejor que la nuestra, así que **no la hacemos opcional: la
hacemos el valor por omisión para todos los proyectos.** Desde la v1.11.0 el
foco arranca en «Cancelar». Quien necesite lo contrario lo pide expresamente:

```jsx
<Confirmacion focoInicial="accion" … />
```

Va con tres pruebas. Una comprueba literalmente que **un Enter nada más abrir no
ejecuta la acción destructiva**.

Esto es un cambio que rompe si alguien dependía del comportamiento anterior.
Está declarado como tal en el registro de cambios.

### 🔴 R3 · Marco de plataforma — **no**

Es el único que rechazamos, y les debemos el porqué completo.

**El caso es suyo, no del sistema.** Este sistema de diseño es el del Colegio
Albert Einstein. Un marco de plataforma frente a marco de cliente es una
necesidad de **producto multiempresa**, y el colegio no lo es. Aceptarlo
metería en el sistema una distinción que el 100 % de sus otros consumidores no
usa, y que además hay que mantener y medir en cada versión.

**Y su propia medición dice que tampoco lo resolvería.** Lo escriben ustedes:
*«ninguna de las tres cifras llega a 3:1»*. Ni con nuestros tokens ni con el
color literal. Darles tres tokens nuevos les daría un separador que **tampoco
cumple**, con el agravante de que llevaría nuestro sello y parecería verificado.

Lo que hace falta no son tres variables: es **diseñar una segunda paleta de
marco completa y medirla** contra todo lo que se pone encima. Eso es trabajo de
paleta, no de tokens, y **crea colores nuevos** — que, como dijimos arriba, no
es decisión del equipo de diseño.

**Qué pueden hacer mientras tanto, sin salirse del sistema:** la señal de
contexto no tiene que ser el color del marco. Un `Chip` en la barra superior con
el nombre del entorno, o el escudo sustituido por el nombre de la plataforma,
distinguen igual de bien y usan componentes que ya tienen. El color como único
portador de significado además incumple SC 1.4.1, así que la señal no debería
ser solo cromática en ningún caso.

Si el responsable autoriza la paleta, se hace y se mide. Se lo hemos elevado.

---

## 2 · Componentes atómicos

### 🟠 R4 · Los cinco iconos — **ya estaban**

Los cinco existen y `iconos.mjs` los publica. Sospechamos que buscaron otros
nombres, porque el conjunto está en español:

| Piden | Se llama |
|---|---|
| Candado | `candado` |
| Lupa | `lupa` |
| ✕ de cerrar | `cerrar` |
| ✓ | `visto` |
| Triángulo de alarma | `alerta` |

Son 39 en total. Si les faltó alguno más, dígannos cuál.

### 🟠 R5 · Columna que no se puede ocultar — **resuelto**

No existía porque **no existía el selector de columnas**. Ahora existen los dos:

```jsx
<TablaDatos columnasFijas={['documento']} … />
```

Las fijas **se reponen siempre**, no se deshabilita el control: un `disabled` se
quita desde el inspector y esto es un mínimo de la tabla, no una sugerencia.

Coincidimos con su responsable en que no es un tope. Cuántos datos quiere ver
cada persona es decisión suya; lo que no puede es quedarse sin saber **de quién**
es cada fila.

El selector se compuso con `SeleccionMultiple`, que ya existía. No se escribió
un panel de casillas nuevo.

---

## 3 · Composiciones

| Composición | Veredicto |
|---|---|
| **Listado** | **Suyo.** Con `TablaDatos` en modo servidor, lo que queda es integración con su API, y eso no puede vivir aquí |
| **Selector con búsqueda** | **Nuestro, y ya está.** `SelectorBusqueda`, v1.11.0. **Sin umbral**, como pedían: un control que cambia de forma según cuántos datos haya ese día se usa distinto el lunes y el martes |
| **Sistema de avisos** | **Nuestro, y `Aviso` lo cubre.** Cuatro tonos, `role="alert"` para el error y `status` para el resto, y el error **no se va solo** —uno que desaparece es uno que nadie leyó—. Si les falta un caso, dígannos cuál |
| **Acción de servidor** | **Nuestro, y ya está.** Ver abajo |
| **Cascada de ubigeo** | **Suya, y coincidimos con su argumento.** Un sistema de diseño que conoce el ubigeo peruano deja de servir para el siguiente producto |

### La acción de servidor, con un matiz que les interesa

No es un componente aparte. **Está dentro de `Boton`**, y la razón es la que
ustedes mismos plantean: es prevención de doble envío. Un `BotonServidor` aparte
sería una garantía de la que se puede salir eligiendo el otro botón — y el día
que alguien pone el botón normal en «Guardar», el doble envío vuelve.

```jsx
<Boton variante="principal" onClick={() => fetch('/api/guardar', {…})}>
  Guardar
</Boton>
```

Si `onClick` devuelve una promesa, el botón se ocupa, gira, marca `aria-busy` y
se libera al terminar — **resuelva o falle**. Sin lo segundo, un error de red
dejaría el botón muerto y habría que recargar la pantalla.

Y descarta los clics que lleguen mientras tanto, que es el caso real: entre
pulsar y repintar caben dos clics de alguien impaciente. **No hay que poner
nada.**

Cinco pruebas. Una comprueba que un `disabled={false}` del proyecto **no** puede
quitar el bloqueo.

---

## 4 · Sus comportamientos de producto

Nos llevamos **dos** al manual, como reglas de composición. No pueden imponerse
con código, así que van escritas:

- **El diálogo no nombra a la persona.** Es protección de datos y vale para
  todos: el diálogo puede quedar a la vista de quien pase por detrás.
- **Quien no puede hacer algo, no ve el botón** — ausente, no deshabilitado.
  Añadimos la distinción con el caso que sí se deshabilita: un «Guardar» que
  espera a que el formulario sea válido, porque eso la persona lo resuelve sola.

Los otros dos —el detalle que empuja la tabla, el retorno arriba al cerrar— son
decisiones de composición de su producto y ahí se quedan. Están bien razonados;
simplemente no son generales.

---

## 5 · Defectos

**D1 · `.tb-activos`** — arreglado, y no murió solo: `.tb-activos[hidden] {
display: none }`. Se les dio la razón en su momento. Lo damos por cerrado.

---

## 6 · Documentación

**R6 · Next** — **era un fallo nuestro y les costó una tarde.** Decíamos que
Next entiende TSX; lo entiende en el código del proyecto, **no en
`node_modules`**. Ya están las tres configuraciones —Next, Vite y Webpack— en
`manual/ACTUALIZAR.md`, sección 2.

**R7 · Nombre del paquete** — no es incoherencia: **se instala desde el
repositorio y se importa por el nombre del paquete.** npm resuelve el segundo
leyendo el `package.json` del primero. Documentado.

**R8 · Reglas de comportamiento** — **ya estaban escritas.** `comportamiento.md`
viaja en la entrega desde la v1.9.0 y contiene literalmente sus cinco reglas de
la tabla, cada una marcada «obligatorio del sistema» o «del proyecto». Las
descubrieron pulsando porque no supieron que el archivo estaba ahí, y eso es un
fallo nuestro de comunicación, no suyo de lectura.

---

## Sobre su nota del método

Tienen razón y la aceptamos: **hay que integrar el sistema en un producto de
principio a fin antes de cada versión mayor.** Ustedes son hoy ese producto, y
lo que sale de ahí no lo encuentra ninguna revisión de escritorio.

Este ciclo lo demuestra: de los once puntos, **dos eran defectos reales que
nadie había visto** —el foco en el botón destructivo y la tabla que ordena solo
la página visible— y los dos salieron de usar el sistema, no de leerlo.

Sigan reportando. Y por su regla nueva, sigan mandando requerimientos en lugar
de escribir CSS: es más lento para ustedes en una versión y más barato para
todos en cinco proyectos.

---

## Cómo instalarlo

```bash
npm install "github:solwarehz/sistema-diseno#v1.11.0"
```

Antes de dar por buena la integración, los cuatro en cero:

```bash
node node_modules/sistema-diseno-ae/sistema/candado/verificar-contraste.mjs
node node_modules/sistema-diseno-ae/sistema/candado/verificar-color.mjs
node node_modules/sistema-diseno-ae/sistema/candado/probar-candado.mjs
npx eslint --config node_modules/sistema-diseno-ae/sistema/candado/candado.eslint.config.mjs .
```
