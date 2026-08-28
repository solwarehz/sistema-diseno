# Actualizar al sistema de diseño v1.79.0

Para el área de sistemas. Esto es todo lo que cambia y todo lo que hay que
hacer, vengas de la **v1.7.0** —la que se entregó en su momento— o de la
**v1.19.0**, que es la que hay instalada. El §4 tiene un apartado para cada una.

---

## 1 · Instalar

```bash
npm install "github:solwarehz/sistema-diseno#v1.79.0"
```

**Usa la etiqueta.** Sin ella npm instala `main`, que hoy tiene esta misma
versión pero avanzará: quedarías atado a «lo último», y una actualización que no
decidiste tú puede entrar en un despliegue sin que nadie la revise. La etiqueta
fija la versión y la hace reproducible.

Para actualizar más adelante, cambia el número de la etiqueta. **No uses
rangos** (`^1.13.0`): npm no los resuelve en dependencias de GitHub, y creerías
estar en una versión distinta de la real.

Si el comando falla con `404` o `repository not found`, no es un problema del
comando: es acceso al repositorio, que es privado. Pídelo.

Comprueba que quedó lo que esperabas:

```bash
node -p "require('sistema-diseno-ae/package.json').version"   # 1.79.0
```

### 1bis · Si no instalas por npm: la descarga

Cada versión se publica también como ZIP, adjunto a su publicación en GitHub:

**<https://github.com/solwarehz/sistema-diseno/releases/tag/v1.79.0>**

O desde la línea de órdenes:

```bash
gh release download v1.79.0 --repo solwarehz/sistema-diseno
```

Son 53 archivos —tokens, hoja de estilos, los treinta componentes de React, el
contrato de comportamiento y los candados— y trae el catálogo dentro, así que
se puede abrir sin conexión.

**Solo la última versión conserva su ZIP.** Al publicar una nueva, el adjunto de
la anterior se borra. La etiqueta y la publicación se quedan, así que
`npm install` de una versión vieja sigue funcionando; lo que desaparece es la
descarga directa de las viejas. Si necesitas el ZIP de una anterior, pídelo: se
reconstruye desde su etiqueta.

**Las dos vías entregan lo mismo.** La diferencia es que npm te deja actualizar
cambiando un número, y el ZIP no: si bajas el ZIP, la próxima actualización es
otra descarga y otra copia a mano. Por eso npm es la vía recomendada, y el ZIP
está para cuando no se puede instalar desde un repositorio privado.

> **Aviso sobre versiones anteriores.** Las etiquetas entre la **v1.39.0** y la
> **v1.50.0** no existen: se dejaron de crear durante doce versiones y el aviso
> saltó al comprobarlo. Lo que hay es **v1.38.0 y anteriores**, y de la **v1.49.0 en adelante**.
> Si necesitas una intermedia, pídela y se etiqueta — el commit está, es la
> etiqueta lo que falta.

---

## 2 · Lo primero que cambia para ti: ya no reconstruyes componentes

Hasta la v1.9.0 la entrega llevaba **el estilo** y tú ponías el comportamiento.
Esa es la razón de las 3.983 líneas que costó la tabla. **Desde la v1.50.0
viajan los TREINTA componentes de React**, con el comportamiento dentro — y desde
esa misma versión el paquete no se arma con una lista escrita a mano, así que
lo publicado y lo entregado no pueden volver a separarse.

```jsx
import 'sistema-diseno-ae/tokens.css';       // SIEMPRE primero
import 'sistema-diseno-ae/componentes.css';  // después: depende de las variables

import { TablaDatos, Boton, Chip, Campo, Paginacion } from 'sistema-diseno-ae/componentes';
```

El orden de los dos `import` de CSS no es estilo: `componentes.css` usa las
variables que declara `tokens.css`. Al revés, no hay ningún color definido.

Lo que traen dentro y ya no tienes que escribir:

| Componente | Lo que resuelve por ti |
|---|---|
| `TablaDatos` | Ordenar, filtrar, paginar, plegar la fila de filtros conservando valores, volver a la página 1 al filtrar |
| `RangoFecha` | El calendario entero por teclado, el anuncio del cambio de mes, el foco al abrir y al cerrar |
| `Confirmacion` | La devolución del foco al elemento que la abrió, y el anuncio a lector de pantalla |
| `Horario` | Ejes rotables, 12/24 h y la preferencia recordada |
| `SelectorBusqueda` | El patrón `combobox` de ARIA completo. **Sin umbral**: si busca, busca siempre |
| `MarcoApp` `MenuUsuario` `MarcaMenu` | **El marco entero**: menú lateral, barra, menú de usuario con tema y salida, y el logo del cliente que no puede romper el diseño. Con `vista="app"`, pestañas abajo respetando las zonas del teléfono |
| `Dialogo` | Modal con el foco atrapado, Escape y devolución del foco al cerrar |
| `Migas` | Migas de pan con el `aria-current` y las barras que el lector no lee |
| `Nota` | Texto que explica y se queda. **No es un aviso**: si el ámbar siempre está, deja de significar «mira esto» |
| `Boton` `Campo` `Chip` `Avatar` `Interruptor` `Paginacion` `Tarjeta` `Enlace` `Estados` | El anillo de foco, los estados, la etiqueta vinculada, el tamaño táctil |

### Cuatro cosas nuevas que conviene que sepas

**El botón impide el doble envío solo.** Si `onClick` devuelve una promesa, se
deshabilita, gira y se libera al terminar —resuelva o falle—. Y descarta los
clics que lleguen mientras tanto: entre pulsar y repintar caben dos clics de
alguien impaciente. No hace falta poner nada.

```jsx
<Boton variante="principal" onClick={() => fetch('/api/guardar', {...})}>
  Guardar
</Boton>
```

No es otro componente a propósito. Un `BotonServidor` aparte sería una garantía
de la que se puede salir eligiendo el otro botón, y entonces no garantiza nada.

**La confirmación arranca el foco en «Cancelar».** Cambia para todos los
proyectos, no solo para quien lo pida: con el foco en la acción, el Enter que
acababas de pulsar para llegar ahí ejecuta lo irreversible. Si de verdad
necesitas lo contrario, `focoInicial="accion"`.

**El botón puede decir QUÉ está haciendo.** `textoOcupado="Guardando…"`. Los dos
textos se dibujan apilados desde el principio, así que el ancho no salta. Sin
esa propiedad, el comportamiento es el de siempre.

**La tabla tiene modo servidor.** `modo="servidor"` + `total`: la tabla deja de
tocar los datos, solo emite el estado por `alCambiar` y pinta lo que le des. Y
`columnasFijas` marca la columna que identifica cada fila para que el selector
de columnas no pueda quitarla.

### Los archivos viajan como `.tsx` sin compilar

Decir «Vite y Next lo entienden» era **inexacto y costaba una tarde**: lo
entienden en el código del proyecto, **no dentro de `node_modules`**, que es
donde va a estar esto. Hay que decírselo. Lo reportó Control Administrativos
V2.0 tras chocarse.

**Next** — sin esto el import falla:

```js
// next.config.mjs
const nextConfig = { transpilePackages: ['sistema-diseno-ae'] };
export default nextConfig;
```

**Vite** — no excluye la dependencia del proceso de compilación:

```js
// vite.config.ts
export default defineConfig({
  optimizeDeps: { exclude: ['sistema-diseno-ae'] },
});
```

**Webpack** — la regla de TS suele excluir `node_modules`; hay que dejar pasar
este paquete:

```js
{ test: /\.tsx?$/, include: [/src/, /node_modules\/sistema-diseno-ae/], use: 'ts-loader' }
```

Si tu proyecto no compila TypeScript, usa `componentes.css` con el marcado de
`comportamiento.md`.

### El nombre del repositorio y el del paquete no son el mismo

No es un error: **se instala desde el repositorio y se importa por el nombre del
paquete.** npm resuelve el segundo leyendo el `package.json` del primero.

| | |
|---|---|
| Repositorio en GitHub | `solwarehz/sistema-diseno` |
| Nombre del paquete | `sistema-diseno-ae` |

Así que se instala `github:solwarehz/sistema-diseno#v…` y se importa de
`sistema-diseno-ae`. Las dos cosas son correctas a la vez.

### Los componentes se componen entre ellos

`TablaDatos` **importa** `Boton`, `Chip`, `Campo` y `Paginacion` en vez de
rehacerlos. Consecuencia para ti: cuando el botón mejore, el de dentro de la
tabla mejora con él. Si estabas parcheando el botón de la tabla por separado,
puedes quitar ese parche.

---

## 3 · El color: qué puedes usar y qué no

Hay **114 colores autorizados** y **9 conocidos pero prohibidos**. La diferencia
importa:

- **Autorizado** — puede vivir en el sistema. Se nombra `familia_paso`:
  `azul_600`, `ambar_900`, `negro_1000`.
- **Conocido y no autorizado** — la familia `marca`. Existe **para poder
  bloquearla**: lo que no tiene nombre no se puede vigilar. Un valor de marca
  fuera de su propia variable **falla el build**.

En un componente **no uses ni el escalón ni el hexadecimal**: usa el **token
semántico**, que es el que está medido contra un fondo concreto.

```jsx
// NO — la primitiva no sabe sobre qué fondo la vas a poner
<div className="bg-[#0063CB]">     <div style={{ background: 'var(--azul_600)' }}>

// SÍ
<div className="bg-accion">        <div style={{ background: 'var(--accion)' }}>
```

Un color escrito a mano en cualquier hoja del proyecto lo caza el candado:

```bash
node node_modules/sistema-diseno-ae/sistema/candado/verificar-color.mjs
```

---

## 3bis · El modo oscuro ya está aprobado

Hasta la v1.18.0 el manual decía «calculado, **no aprobado**, no implementar».
**Se aprobó el 2026-08-09.** Ya podéis ofrecerlo.

```jsx
<MenuUsuario id={u.id} nombre={u.nombre} tema={tema} onTema={setTema} onSalir={salir} />
```

Sin `tema` y `onTema` el selector **no se pinta**, y eso sigue igual — pero por
otra razón que la de antes. **La preferencia la guardáis vosotros**, porque el
sistema no sabe dónde vive vuestra sesión. Si el componente la guardara por su
cuenta y vosotros ya la tenéis en el perfil, habría dos fuentes de verdad y la
pantalla parpadearía al cargar.

Aplicad el modo poniendo `data-tema="oscuro"` en `<html>`. Los tokens hacen el
resto: **no hay una segunda hoja que cargar**.

Dos cosas que conviene que sepáis antes de encenderlo:

- **El marco va en escala de negros, no en el azul del colegio.** Un azul
  saturado sobre una página casi negra no lee como modo oscuro. El acento
  dorado se queda: es lo único que sigue diciendo de quién es el producto.
- **Los 178 pares están medidos en los dos modos**, no solo en claro. Si un
  color vuestro falla en oscuro, es vuestro: pasadle el candado de contraste.

---

## 4 · Lo que se rompe

### 4.1 Si vienes de la v1.7.0

Poco, y todo es renombrado:

| Antes | Ahora | Por qué |
|---|---|---|
| `.av-` en el avatar | `.avatar-` | Chocaba con el aviso temporal y heredaba su relleno |
| El interruptor usaba `error-*` | `apagado-fondo` `apagado-borde` `apagado-bolita` | «Apagado» es una elección, no un fallo |
| Sombras sin declarar | Vienen en `componentes.css` | `--sombra-capa` y `--sombra-aviso` no llegaban: la capa flotante salía plana |

Y **una corrección que quizá notes en pantalla**: el aviso temporal ahora lleva
fondo teñido además del filete. Antes era una tarjeta blanca con una raya de
color, que no es lo que la documentación describía.

### 4.2 Si vienes de la v1.19.0 — que es la que instaló el área de sistemas

Son 56 versiones. Esto es **solo lo que cambia algo que ya tenías**; lo demás
son piezas nuevas, y una pieza nueva no rompe nada.

**Cambios de API — el compilador te los dirá:**

| Versión | Qué cambió |
|---|---|
| 1.20.0 | `RangoFecha`: las clases de celda se acortan (`fc-dia` → `fc-d`, y `fc-extremo` se parte en dos) |
| 1.36.0 | `alGuardar` y `TipoDato` **se retiran** del paquete. Entraron en la 1.35.0 y salieron en la siguiente: la frontera de escritura es del producto |
| 1.40.0 | **`CargaPdf.onCambio` recibe ahora la lista entera** (`PdfListo[]`), no un archivo suelto |
| 1.43.0 | **El árbol de `TablaDatos` cambia**: el contenedor pasa a ser `.tb-bloque` y `.tb-envoltura` queda **solo alrededor de la tabla**. Si enganchaste CSS propio a `.tb-envoltura` contando con que envolvía todo, muévelo a `.tb-bloque` |

**Cambios que se ven en pantalla:**

| Versión | Qué se ve distinto |
|---|---|
| 1.21.0 | La hoja pierde 27 clases de andamiaje del catálogo que nunca debieron viajar |
| 1.22.0 | Las duraciones pasan a tokens: `.14/.15s` → 140ms, y `prefers-reduced-motion` se resuelve una vez |
| 1.27.0 | La barra de la tabla se reordena: los mandos a la derecha, el rango al pie |
| 1.28.0 | Llegan las reglas estructurales de **modo oscuro** que faltaban (flecha del select, icono del calendario) |
| 1.29.0 | `CargaImagen` entrega **WebP** donde el navegador sabe, no PNG. **Lee `blob.type`, no asumas extensión** |
| 1.40.1 · 1.41.1 | El botón fija su propio `line-height` y su propio `display`: pasa a **36px exactos** (mini, 28) y deja de necesitar `.btn-ic` para alinear |
| 1.41.0 | El reset **`box-sizing: border-box`** por fin viaja. Si lo compensaste a mano, quítalo |
| 1.44.0 | La columna de `CargaImagen` **se centra** |
| 1.46.0 | **Los iconos pasan de 16 a 18px** — el tamaño que el catálogo enseñó siempre. Los botones con icono ganan ~2px de ancho; la altura no cambia |
| 1.47.0 | La etiqueta del campo lleva **color propio** en vez de heredarlo, y el renglón de error **gana su icono** |
| 1.48.0 | El panel de `PanelBarra` pasa a 248px de ancho mínimo, como en el catálogo (venía a 320) |
| 1.49.0 | **La tarjeta pulsable deja de heredar la fuente del navegador.** Si la compensaste a mano —forzando `font-family`, `text-align: left` o `padding: 0` sobre `.tn`—, **quítalo**: ahora lo trae la hoja y tu parche pelea contra ella |
| 1.50.0 | **El título de la tarjeta pasa a llevar estilo.** La hoja estilizaba `h4` y el componente emitía `h3`, así que salía con el tamaño por defecto del navegador. Si lo compensaste, quítalo. El nivel se elige con `nivelTitulo` |
| 1.50.0 | **Seis componentes que se publicaban y no viajaban** —`AreaTexto`, `CampoContrasena`, `CargaId`, `CargaImagen`, `CargaPdf`, `ZonaAvisos`— ya están en el paquete. Si los reconstruiste, **cámbialos por los del sistema** |
| 1.51.0 | La **cuadrícula de tarjetas se entrega**: clase `tn-cuadricula`. Si maquetaste el `grid-template-columns` a mano, cámbialo por la clase |
| 1.61.0 | **La celda de la tabla de datos deja de partir el texto.** Un valor largo ya no baja a la línea siguiente: ensancha su columna y la tabla se desplaza en horizontal, que es lo que `.tb-envoltura` hace desde la 1.43.0. A cambio, **todas las filas conservan su altura declarada** (34px, 28 en compacta). Si tienes una columna cuyo valor **necesita** ir partido, dínoslo: se declara la salida en el contrato, no la improvises con CSS propio. El estado vacío, el panel de detalle plegado y la `.tabla-simple` **no cambian** |
| 1.62.0 | **Solo si copian el marcado del catálogo** (`class="campo tb-f"`) en vez de usar `<TablaDatos>`: el filtro de columna pasa de 12px a 13px y de 26,73 a 36,18 px de alto, y la fila de filtros de 35,40 a 44,84. Es el tamaño que el catálogo enseña desde siempre, y el que ya tenían quienes usan el componente: la hoja llevaba tres declaraciones que **el catálogo nunca mostró** y que solo se veían en la entrega, por el orden en que quedaban. **Quien usa `<TablaDatos>` no ve ningún cambio** |
| 1.63.0 | **Nada se rompe: se añade.** `Horario` y `Chip` aceptan cuatro tonos más — `identidad-1` a `identidad-4` —, los mismos colores que ya usaba el avatar. Son **decorativos**: agrupan (una sede, un turno) y **no significan nada**. Condición del sistema: lo agrupado va **también en texto** y con **leyenda** al lado (`chip-punto` con el tono de identidad), porque el color nunca puede ser el único medio |
| 1.64.0 | **`Horario` cambia de sitio algunos bloques, y a mejor.** Un bloque desalineado —07:45 con paso de 60— se dibujaba **en la fila de las 08:00** con el rótulo «07:45» al lado. Ahora se ancla donde **cae** su inicio y el resto lo resuelve el **sombreado en cuartos**: 13:30–15:00 es media celda de las 13:00 más la de las 14:00. Además, en un solapamiento **gana el primer bloque** (antes, el último), y los bloques más cortos que medio paso, que desaparecían, ahora se dibujan. **Nuevo `onAjuste`**: todo lo que no se pueda dibujar tal cual se anuncia con su motivo, en vez de desaparecer |
| 1.66.0 | **Nada se rompe: ahora se puede importar lo que ya existía.** Las **42 exportaciones** que un componente declaraba y el índice no sacaba ya salen — entre ellas los `Props` de **todos** los componentes y `AjusteHorario`, que reportaron ustedes. Si dedujeron algún tipo del componente para no tocar el paquete, **ya pueden importarlo** |
| 1.67.0 | **El candado de ESLint ya sabe leer TypeScript.** Antes moría con `Parsing error` ante cualquier sintaxis de TS —`import { type X }`, una anotación de tipo, lo que fuera— **antes de llegar a ninguna regla**, y el error parecía de su archivo. Si lo tenían apagado o con excepciones por esto, **pueden quitarlas**. Necesita `typescript-eslint` instalado (peer opcional); si no está, avisa por consola y cubre solo el JavaScript |
| 1.68.0 | **Si desarmaban el candado, léanlo.** En la 1.67.0 el bloque de reglas dejó de ser `candado[0]`, así que un proyecto que copiara sus campos a mano se habría quedado **sin ninguna regla activa y en verde**. Ya vuelve a ser `[0]` y un candado nuevo vigila que la forma no cambie sin decirlo. **Lo recomendado sigue siendo esparcir**: `export default [ ...candado ]` — así el día que añadamos un bloque entra solo |
| 1.69.0 | **Dos fallos nuestros de la 1.64.0, corregidos.** (1) **`onAjuste` se llamaba durante el render**: guardar los avisos en un estado entraba en **bucle infinito**. Ahora sale de un efecto y solo cuando los avisos cambian de contenido — si se blindaron por su cuenta, el blindaje ya no estorba. (2) **El sombreado desalineaba las columnas**: el hueco se repartía con lo que sobraba, y sobra distinto según el contenido, así que el mismo horario se dibujaba a alturas distintas si un bloque llevaba línea de detalle. Medido ahora: **0,00 px** de desalineación. Las clases `hor-fr-N` pasan a `hor-q{cuartos}-{celdas}` — solo afecta a quien escriba el marcado a mano |
| 1.70.0 | **Los cuatro tonos de identidad del `Chip` ya se pintan.** Salían del color del texto: `.chip` declara el atajo `border-left: 3px solid currentcolor` más abajo en la hoja, empata en especificidad y **el atajo reescribe el color**. Se arregla con `.chip.chip-identidad-N` y `border-left-color`. De paso, **todos** los tonos de `Chip` y `Mensaje` pasan a ganar por especificidad en vez de por el orden — antes los semánticos se salvaban por una duplicación afortunada. **Cambio visible**: los chips `pendiente` e `inactivo` pasan del gris del texto a `borde-fuerte`, que es lo que siempre debieron ser |
| 1.71.0 | **Nada que hacer de su lado.** La versión del paquete se declaraba en cinco sitios y dos se habían quedado atrás; ahora el generador los cruza y falla si discrepan. Si alguna vez leyeron una versión rara en `componentes/package.json`, era eso |
| 1.72.0 | **Componente nuevo: `PanelPrivilegios`.** Reparte permisos por módulo — es el de su pantalla de privilegios por cargo, hecho general. Recibe `modulos` y `valor`, emite `onCambio`; el selector del cargo lo ponen ustedes por `children`. Trae dentro la regla de que **«ver» manda sobre el resto** y el **motivo** de lo que no se puede conceder. Nada existente cambia |
| 1.73.0 | **`PanelPrivilegios`: niveles por campo, y apagar «ver» ya no borra.** Un privilegio puede declarar `niveles` —documento completo · parcial · oculto— que se reparten con `Segmentado` y se guardan bajo `privilegio:nivel`. **Cambio de comportamiento**: apagar el privilegio que manda **conserva** lo configurado en vez de ponerlo a `false`; para saber qué se aplica de verdad, `privilegiosEfectivos()`. Verificado a 390 px |
| 1.74.0 | **Aditivo, nada que tocar.** `cerrado` admite ahora **tres motivos** en vez de uno: `cerrado` (nunca), `ajeno` (existe, pero usted no lo tiene) y `pendiente` (todavía no está). `cerrado: 'texto'` sigue valiendo. Y varios privilegios con la misma **`clave`** son el mismo permiso: se mueven juntos y se avisa en la etiqueta |
| 1.75.0 | **`SelectorBusqueda` ya se ve como `Selector`.** Se veía distinto por la lupa, que sangraba el texto 32 px cuando el resto de los campos empieza en 8. **La lupa pasa a ser opcional** (`conLupa`) y por omisión no está: si la quieren —en un buscador de verdad— hay que pedirla. El buscador de `TablaDatos` la pide por su cuenta y no cambia |
| 1.76.0 | **La tabla arranca ordenada y su primera columna no se puede quitar.** Sin declarar nada: orden alfabético por la primera columna ordenable, y esa columna deja de poder ocultarse — **antes su casilla se desmarcaba y no pasaba nada**. **Dos cambios visibles**: si alguna tabla dependía del orden de llegada de la consulta, pásenle `ordenInicial={null}`; si querían poder ocultar la primera columna, `columnasFijas={[]}`. En `modo="servidor"` no se impone orden |
| 1.77.0 | **Las tres cargas dejan de romper el formulario.** `CargaImagen`, `CargaPdf` y `CargaId` arrancan y terminan igual: una fila que mide **lo que un campo** (36 px), con el disparador y lo ya cargado **al costado**, nunca encima ni debajo. **El funcionamiento interno no cambia** —lo que cada una comprueba, comprime y entrega es idéntico—; cambia cómo se presenta al empezar y qué forma tiene el resultado. **Tres cambios visibles**: en `CargaPdf` el resumen pasa de encima del botón a su lado (y el recuento de páginas y el chip del ahorro se quedan solo en el panel); en `CargaId` las miniaturas pasan de 76×48 a 35×22, con su proporción ID-1 intacta; en `CargaImagen` no cambia nada salvo que pidan la nueva `presentacion="fila"` |
| 1.78.0 | **`CargaImagen` deja de ser la excepción, y ahora sí cambia sola.** En la 1.77.0 era la única de las tres que no usaba la fila por omisión; ahora **la fila es el defecto**, así que un `<CargaImagen>` que no toquen pasa de la caja de 96 px a la fila de 36. **Si esa pantalla está hecha para poner esa imagen** —el selector de foto del legajo, el logo de la marca—, pidan `presentacion="caja"` y queda como estaba. Además: el **rótulo pasa dentro de la fila** en las tres cargas (todo en un renglón), la **foto de una persona se ve redonda** en la miniatura, y `.ci-et`, `.ci-nota`, `.ci-error` y `.ci-vacia` **desaparecen de la hoja** — pasan a `.cx-*`, que es lo que ya usaban el PDF y el ID |

| 1.79.0 | **`SelectorBusqueda` ya se puede vaciar — y no rompe nada.** Tres props nuevas, las tres apagadas por omisión. **`vacio="Todos"`**: añade la fila para volver a *sin elegir* y con ella `onCambio(null)` **empieza a emitirse de verdad** — hasta ahora la firma decía `string \| null` y el componente **nunca** mandaba `null`, lo que lo bloqueaba en cualquier campo opcional. Con `vacio` puesto, **Retroceso** sobre el campo vacío hace lo mismo. **`etiquetaOculta`**: la que ya tenían `Campo` y `Selector` y faltaba solo aquí. **`onCrear`**: recibe lo tecleado y convierte la fila de «no hay coincidencias» en un «Crear …», con ratón y con Enter. **Aviso de lectura**: si tenían un `if (valor === null)` sobre este componente, esa rama nunca se ejecutaba y ahora puede |

**Lo que no rompe pero conviene aprovechar:** `soloLectura` en `Selector`
(§6.5 del manual), `persona.foto` en `CargaImagen` (§6.7), `CargaId` para el
documento de identidad (§6.6), `AreaTexto`, `CampoContrasena`, y el tercer nivel
del menú en `MarcoApp`.

---

## 5 · Antes de dar por buena la integración

```bash
node node_modules/sistema-diseno-ae/sistema/candado/verificar-contraste.mjs
node node_modules/sistema-diseno-ae/sistema/candado/verificar-color.mjs
npx eslint --config node_modules/sistema-diseno-ae/sistema/candado/candado.eslint.config.mjs .
```

Los tres tienen que salir en cero. **Si el candado de contraste falla, el
candado tiene razón**: no lo desactives, avisa.

> El candado de ESLint **no funcionaba** tal como se distribuyó entre la v1.1.0 y
> la v1.8.0: duplicaba las barras invertidas y siete de sus ocho patrones
> cambiaban de significado. Si lo instalaste en ese periodo, creías estar
> protegido y no lo estabas. **Vuelve a pasarlo ahora**: es probable que
> aparezcan infracciones que llevaban meses ahí.

---

## 6 · Cómo pedir algo que falta

Si necesitas un elemento que no existe, **no lo construyas en tu proyecto**: eso
deja al sistema sin enterarse y al siguiente proyecto reconstruyéndolo. Manda el
requerimiento y se decide si es del sistema o tuyo. Los criterios están en
`sistema/componentes/POLITICA-DE-CREACION.md`, que viaja en la entrega.

Lo que sí es tuyo y el sistema no va a decidir: qué datos muestras, qué permisos
tiene cada rol, y las reglas de negocio de tu pantalla.
