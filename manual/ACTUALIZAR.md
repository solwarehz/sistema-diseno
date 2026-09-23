# Actualizar al sistema de diseño v1.143.0

Para el área de sistemas. Esto es todo lo que cambia y todo lo que hay que
hacer, vengas de la **v1.7.0** —la que se entregó en su momento— o de la
**v1.19.0**, que es la que hay instalada. El §4 tiene un apartado para cada una.

---

## 1 · Instalar

```bash
npm install "github:solwarehz/sistema-diseno#v1.143.0"
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

### 1bis · Instalar NO es servir. Reinicien el servidor.

**Léanlo antes de medir nada**, porque ya costó un reporte en falso. El
2026-09-13 Control Administrativos actualizó, midió, le salió **idéntico a
antes**, y estuvo a punto de reportar un defecto ya corregido como no resuelto.
El paquete estaba bien: **el servidor de desarrollo seguía sirviendo el
anterior**. Hizo falta reiniciar el contenedor.

Le pasa a Next, a Vite y a cualquiera con caché de módulos: el proceso que ya
está en marcha tiene el código viejo en memoria, y su caché de compilación no
se entera de que cambió algo dentro de `node_modules`.

```bash
npm install "github:solwarehz/sistema-diseno#v1.143.0"
# y ENTONCES, sin excepción:
docker compose restart <su-servicio>     # o el reinicio que usen
# si aun así ven lo de antes, tiren la caché de compilación —y reinicien OTRA
# VEZ: borrarla con el servidor en marcha no basta, la tiene en memoria.
rm -rf .next            # Next
rm -rf node_modules/.vite   # Vite
```

**Y comprueben lo que se SIRVE, no lo que hay en disco.** Ésta es la parte que
este manual daba mal hasta la v1.109.0: mandaba leer `package.json` con `node`,
que mira **el disco** y **desde otro proceso**, así que salía en verde mientras
el navegador recibía la versión anterior.

```js
const v = (n) => getComputedStyle(document.documentElement)
  .getPropertyValue(n).trim();
```

| Qué se comprueba | Cómo |
|---|---|
| El **disco** — que npm hizo su trabajo | `node -p "require('sistema-diseno-ae/package.json').version"` |
| El **JavaScript que se sirve** | `import { VERSION } from 'sistema-diseno-ae'` |
| **La hoja de tokens** que se sirve | `v('--mmi-version')` |
| **La hoja de componentes** que se sirve | `v('--mmi-componentes')` |

**Las cuatro tienen que decir lo mismo.** Si el primero dice `1.111.0` y
cualquiera de los otros dice `1.108.0`, **no es un defecto del componente: es
la caché**.

Son **cuatro y no tres** porque `tokens.css` y `componentes.css` son dos
importaciones distintas y se pueden servir por separado — y **la mayoría de las
versiones de este sistema cambian la segunda**. Si lo que van a medir son
anchos, alturas o alineaciones, la fila que responde por eso es
**`--mmi-componentes`**.

> **El `.trim()` no es adorno** y el valor **no lleva comillas** a propósito:
> entrecomillado, `getPropertyValue` devuelve la comilla dentro y un `===`
> falla siempre; y el minificador reescribe la comilla simple en doble, así que
> quien la recorte a mano se rompe al desplegar.

### 1ter · La tipografía NO viaja, y hay que cargarla

La hoja pide **`IBM Plex Sans`** y **`IBM Plex Mono`** en seis reglas, y la
entrega **no trae `@font-face` ni `@import`**: el catálogo la carga con un
`<link>` a Google Fonts que no viaja. Sin cargarla, la tabla numérica y los
bloques monoespaciados caen al `monospace` del navegador y las columnas de
cifras dejan de alinearse.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap">
```

Es el mismo modo de fallo silencioso que los `@keyframes` que faltaban: se
declara algo que no está, y el navegador **no protesta** — se cae al recurso de
reserva y nadie se entera. Lo encontró una auditoría el 2026-09-11 buscando la
familia entera de ese defecto.

### 1bis · Si no instalas por npm: la descarga

Cada versión se publica también como ZIP, adjunto a su publicación en GitHub:

**<https://github.com/solwarehz/sistema-diseno/releases/tag/v1.143.0>**

O desde la línea de órdenes:

```bash
gh release download v1.143.0 --repo solwarehz/sistema-diseno
```

Son **60 archivos**: tokens, hoja de estilos, los **43 módulos de componente**
—34 en la raíz, `index.ts`, y ocho de `interno/`—, el contrato de
comportamiento, y **el catálogo**, que se abre sin conexión.

Los 43 módulos entregan **35 componentes con página en el catálogo** y **131
exportaciones** en total: algunos módulos exportan más de un componente, y los
de `interno/` no tienen página porque no se usan sueltos.

Las tres cifras **las imprime `verificar-entrega`, y aquí están copiadas a
mano**. Esta línea decía que no lo estaban, y decía 127 con 131 entregadas: una
cifra a mano dentro de un documento que presume de no tenerlas es peor que la
cifra sola, porque desactiva la comprobación de quien lo lee. Si no cuadran,
manda el candado:

```bash
node sistema/candado/verificar-entrega.mjs
```

**Las dos vías NO entregan lo mismo, y conviene saberlo antes de elegir.** Se
midió el 2026-09-11 y hasta entonces este apartado daba a entender que sí:

| | `npm install` | ZIP |
|---|---|---|
| Archivos | **82** | **60** |
| **El catálogo** | **no** | **sí** (`catalogo/index.html`) |
| **Los candados** | **los 17**, y 2 de los 3 generadores | **4** (contraste, color, lint y su configuración) |
| `package.json` | sí | **no** — por eso el comando de comprobación del §1 no sirve aquí |
| Componentes, tokens, hoja y contrato | sí | sí, **byte a byte lo mismo** |

Son **diecisiete candados dentro de veinte pasos**: los otros tres son
generadores, y de ésos **`generar-cascaron.mjs` no viaja por ninguna de las dos
vías**. *(Esta línea decía «quince dentro de dieciocho» y se quedó en la
v1.120.0 — el mismo paquete lleva un `CLAUDE.md` que dice veinte, así que dos
documentos de la misma versión daban números distintos.)* Tiene consecuencia y conviene decirla: varios candados sí viajan
—`verificar-promesa`, `verificar-elemento`, `verificar-empate`— y **leen
`cascaron/index.html`**, que tampoco viaja. Correrlos fuera de este repositorio
no mide nada.

Lo que se **usa** está en las dos. Lo que cambia es lo que se usa para
**verificar**: quien instala por npm puede correr los **diecisiete** candados
contra su propio proyecto —con el límite de arriba— y quien baja el ZIP tiene el
catálogo para mirar.

**Solo la última versión conserva su ZIP.** Al publicar una nueva, el adjunto de
la anterior se borra. La etiqueta y la publicación se quedan, así que
`npm install` de una versión vieja sigue funcionando; lo que desaparece es la
descarga directa de las viejas. Si necesitas el ZIP de una anterior, pídelo: se
reconstruye desde su etiqueta.

**Lo que se USA es lo mismo en las dos** —componentes, tokens, hoja y contrato,
byte a byte—; lo que cambia es lo que se usa para verificar, que es la tabla de
arriba. *(Aquí ponía «las dos vías entregan lo mismo», a cuatro párrafos de la
frase que dice lo contrario. Era el texto viejo que la corrección del 2026-09-11
no llegó a borrar, y lo cazó la verificación del 2026-09-18.)* La diferencia
práctica es que npm te deja actualizar cambiando un número, y el ZIP no: si bajas el ZIP, la próxima actualización es
otra descarga y otra copia a mano. Por eso npm es la vía recomendada, y el ZIP
está para cuando no se puede instalar desde un repositorio privado.

> **Aviso sobre versiones anteriores.** Hay **dos huecos** de etiquetas, los dos
> comprobados hoy contra el remoto:
>
> - **De la v1.39.0 a la v1.50.0** no existe ninguna. Lo que hay es la
>   **v1.38.0** y, saltando el hueco, la **v1.51.0 en adelante**. Esta misma
>   frase decía «de la v1.49.0 en adelante» y mandaba a dos etiquetas que **no
>   existen** — se contradecía con su propia línea anterior, y la mitad falsa
>   era la accionable.
> - **La v1.125.0 nunca se etiquetó**: se corrigió y salió dentro de la
>   **v1.126.0**.
>
> Y la etiqueta más antigua del repositorio es la **v1.10.5**, no «v1.38.0 y
> anteriores»: por debajo de ésa no hay nada que instalar.
>
> Si necesitas una intermedia, pídela y se etiqueta — el commit está, es la
> etiqueta lo que falta.

---

## 2 · Lo primero que cambia para ti: ya no reconstruyes componentes

Hasta la v1.9.0 la entrega llevaba **el estilo** y tú ponías el comportamiento.
Esa es la razón de las 3.983 líneas que costó la tabla. **Desde la v1.50.0
viajan los **34 componentes de React**, con el comportamiento dentro — y desde
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
`columnasSiempreVisibles` marca la columna que identifica cada fila para que el
selector de columnas no pueda quitarla. **Se llamaba `columnasFijas` hasta la
v1.127.0**; el nombre viejo sigue funcionando y avisa en desarrollo.

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

**Y dos cosas que el `tsconfig` tiene que traer**, medidas una a una con `tsc`
sobre el paquete instalado el 2026-09-18. **No estaban documentadas**, y no lo
habían notado porque Next las trae por omisión; un proyecto Vite o con
configuración propia sí choca:

| Falta | Qué pasa |
|---|---|
| `@types/node` | **9 errores `TS2580: Cannot find name 'process'`** en `Boton.tsx`, `MarcaMenu.tsx`, `RangoFecha.tsx`, `SelectorBusqueda.tsx` y `TablaDatos.tsx` — los avisos de desarrollo del sistema leen `process.env.NODE_ENV` |
| `"DOM.Iterable"` en `lib` | **3 errores `TS2488`** en `CargaPdf.tsx` e `interno/sanear.ts` |

```jsonc
// tsconfig.json
{ "compilerOptions": { "lib": ["ES2022", "DOM", "DOM.Iterable"], "types": ["node"] } }
```

Es el mismo género que lo de arriba: el paquete entrega `.tsx` sin compilar, así
que **su compilación es la del proyecto** y lo que él necesita hay que decirlo.

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

Hay **114 colores autorizados** y **10 conocidos pero prohibidos**. La diferencia
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
- **Los 186 pares están medidos en los dos modos** —146 bloqueantes, 73 por modo—, no solo en claro. Si un
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

Son **112 versiones**. Esto es **solo lo que cambia algo que ya tenías**; lo demás
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
| 1.80.0 | **Nada que hacer: no cambia ni una línea de código.** El catálogo estrena un grupo, **Pasarela de pagos**, con la página de **Izipay**: las pantallas del cobro armadas con `Tarjeta`, `Mensaje`, `Progreso`, `Boton`, `Campo` y `Chip`. Es una **composición, no un elemento**, así que sus clases no viajan en la hoja — lo que se copia son los componentes. Trae, sacado de su documentación: los métodos con sus topes, los diez códigos de rechazo con sus mensajes, y el `appearance.customTheme` relleno con nuestros tokens |
| 1.82.0 | **La pasarela de pagos ya viaja en la hoja — nada que tocar.** Las clases `psl-*` de la página de Izipay pasan a la entrega (26 reglas), así que quien monte la pantalla del cobro la ve **idéntica** a la del catálogo: el candado de la promesa compara siete de sus superficies a cinco anchos, y el de la cascada las resuelve a once. **No viaja** lo que se llama `psl-demo-*`: el navegador dibujado y **el formulario falso de tarjeta** — ese lo pinta el SDK de Izipay, y entregar una imitación sería invitar a maquetar campos de tarjeta propios |
| 1.83.0 | **Nada que tocar: es catálogo.** Nueva página **Pasarela de pagos › Culqi**, debajo de la de Izipay y con **el mismo andamiaje** — no trae ni una clase nueva. Trae, de su documentación: los seis métodos con sus claves de `paymentMethods`, los doce `decline_code` con sus dos mensajes literales, y el mapeo de nuestros tokens a `appearance.variables` y `appearance.rules`. **Tres diferencias con Izipay que conviene leer antes de elegir**: Culqi deja estilar mucho más (incluidos los estados, así que el anillo de foco del sistema entra en su formulario), trae el texto del rechazo ya redactado para quien paga (`user_message`), y **agente y billetera no terminan en el acto** — necesitan un webhook o la familia paga y nadie se entera |
| 1.84.0 | **Nada que tocar: es catálogo.** Nueva página **Pasarela de pagos › Openpay Perú**, debajo de Culqi. **La única de las tres en la que el formulario de tarjeta puede ser nuestro**: `Openpay.js` tokeniza desde nuestros propios `Campo` y manda los datos directo a Openpay, así que ahí el modo oscuro, la alineación y el anillo de foco son los del sistema. Trae sus agencias peruanas por nombre y el aviso de que **las cuotas solo van con BBVA y DINERS**. **Lo que NO trae, y está dicho en la página**: su tabla de códigos de rechazo, que no se pudo leer — hay que pedírsela antes de escribir un mensaje de error |
| 1.85.0 | **Nada que tocar: es catálogo.** Nueva página **Pasarela de pagos › Mercado Pago**. Lo que conviene leer aunque no usen MP: **el rechazo se parte en tres pantallas** según lo que la persona pueda hacer, y en la de fraude **no hay botón de reintentar** — su documentación pide impedir nuevos intentos. Además es la primera pasarela con **tema oscuro documentado** y la primera que deja meter **nuestro anillo de foco** en su formulario. Aviso: sus treinta mensajes de rechazo **vienen en inglés**, así que redactarlos en español es trabajo nuestro |
| 1.86.0 | **Nada que tocar: es catálogo.** Nueva página **Pasarela de pagos › Niubiz**, y con ella **las cinco pasarelas conocidas del Perú** quedan documentadas. Lo que conviene leer aunque no usen Niubiz: publica **77 códigos de rechazo**, y el eje que debe gobernar la pantalla **no es el código sino su `TIPO DE RECHAZO`** — `TEMPORAL` se reintenta, `PERMANENTE` no. Y sus textos **no son para quien paga**: su propia tabla los titula «respuesta que se visualiza en backoffice y reportes» |
| 1.87.0 | **Nace un módulo entero: «Boleta electrónica»**, sobre Nubefact. Siete páginas —emitir, notas de crédito y débito, anulación, cotización, guía de remisión e impresión— y **una familia de clases nueva que SÍ viaja**, `cpe-*` (29 reglas): las **líneas del documento**, el **estado ante SUNAT** y la **representación impresa**. Con ella entra la **primera regla ` print`** del sistema: al imprimir un comprobante, la aplicación desaparece. Nada de lo anterior cambia |
| 1.88.0 | **Un fallo de contraste corregido, y les afecta si copiaron marcado a mano.** `.psl-sdk-et` usaba un token de identidad como color de texto: **1,91:1 en modo oscuro**, cuando SC 1.4.3 pide 4,5. Pasa a `texto-secundario`, que sí está medido. Lo encontró una auditoría, **no un fallo visible** — y el candado de contraste no podía verlo porque solo mide los pares declarados. Si usan los componentes, no hay nada que hacer |
| 1.89.0 | **Una página nueva en el catálogo y nada más: «Boleta electrónica → EFACT».** El segundo proveedor evaluado. **No cambia ni una regla de CSS ni un componente** — se compone entera con lo que ya existía, así que no hay nada que hacer al actualizar. Se lee si alguien tiene que decidir proveedor: EFACT vende **tres productos distintos**, y del que se parece a Nubefact **no hay especificación pública** |
| 1.90.0 | **Dos props nuevas y una clase que desaparece.** `CargaPdf` gana `accept` y `validar`: deja de imponer PDF, y **el `File` que entrega conserva su `type`** en vez de reetiquetarlo. `PanelPrivilegios` gana `depende`, para cadenas que el `base` no sabe expresar. **Lo que puede romperles:** las filas bloqueadas ya no llevan `.pp-no` —ninguna regla la definía, así que no cambia el aspecto, pero era un gancho de CSS posible—, y un privilegio con `depende` **sigue encendiendo el `base` de rebote** — esta línea decía lo contrario y **era falsa**: se midió al escribir la v1.91.0 y el componente lo lleva escrito desde entonces, pero esta guía conservó el texto viejo **hasta la v1.127.0**. Lo cazó Control Administrativos V2.0 al ir a programar la cascada contra ella (R147), y el error habría sido silencioso: se habría notado como «a veces el ver se enciende y a veces no» |
| 1.91.0 | **Correcciones de una auditoría, y una les afecta si copiaron marcado.** Nueve iconos del catálogo se publicaban como `<svg>` **vacíos** —cuatro nuevos y cinco desde R97—; ya se dibujan. `CargaPdf` gana `nombreTipo` e `icono`, y **`textoBoton` ahora sí vale en `presentacion="en-linea"`**, donde se ignoraba. `privilegiosEfectivos()` **deja de devolver lo marcado `cerrado`**. Y el texto del progreso pasa a decir «el archivo» en vez de «el PDF» salvo que pasen `nombreTipo` |
| 1.92.0 | **Componente nuevo: `RedesSociales`.** Siete redes, tres formas, tres tamaños, con nombre y con cuenta. **No añade ningún color**: los iconos heredan `currentColor`, así que los de marca **no** están —eso sería una autorización, no un arreglo—. **No rompe nada de lo anterior** |
| 1.93.0 | **`RedesSociales` pinta los iconos con el rojo del escudo por omisión.** `marca-rojo` queda **autorizado solo para eso** — sigue prohibido como texto y como superficie. Si los ponen sobre un fondo que no sea la tarjeta o la página, usen `color="heredado"`: los 4,88:1 y 4,69:1 están medidos contra esos dos y **sobre el encabezado no ha medido nadie**. No rompe nada |
| 1.94.0 | **`CabeceraPantalla` gana `accionSecundaria`.** Se pinta a la izquierda de `accion`, con 8px de separación, y en estrecho las dos se reparten el ancho. **Les afecta aunque no la usen:** `.pant-accion` no tenía ni `display` ni `gap`, así que si metieron dos botones ahí a mano, salían pegados y ahora se separan. Y la documentación del componente decía «una sola acción»: era un error de redacción, la regla es **una sola principal** |
| 1.95.0 | **`SelectorBusqueda` entrega por fin lo que el catálogo enseña, en nueve puntos.** Se ven cuatro: el chevron **ahora gira** al abrir la lista, el visto ✓ de la opción elegida pasa **a la derecha** (estaba a la izquierda, 298,4 px de diferencia), la ayuda de la opción recibe su tipografía —13 px, secundario— y deja de salir del mismo cuerpo que el nombre, y la fila de «sin resultados» **dice qué se buscó** en vez de «No hay coincidencias». Se teclean cuatro: **↑ abre la lista**, las flechas **ciclan**, **Inicio y Fin** funcionan, y **Tab elige lo marcado** — antes tabular con una coincidencia marcada dejaba el campo **vacío**. **Nada rompe:** ninguna clase pública cambia de nombre y `textoVacio` sigue admitiendo una cadena. **Y les afecta aunque no usen el selector:** `Paginacion` no emitía `activa`, así que **la página en curso no se pintaba en ninguna pantalla** — ahora sí |
| 1.128.0 | **R151 · `PanelPrivilegios` se presenta como MATRIZ.** Su pantalla de permisos es una rejilla —recursos en filas, acciones en columnas— y el panel solo sabía ser lista. **Es el mismo componente**: `presentacion="matriz"` con `columnas`, y `columna`/`fila` en cada privilegio; `depende`, `base`, `cerrado` y `deshabilitado` se comportan igual porque **es el mismo código**. El módulo nombra sus filas con `filas`. Nace **`noAplica`**, el cuarto motivo por el que algo no se reparte, con motivo obligatorio: omitir la casilla no es lo mismo que decir que no aplica. Cada interruptor se llama por su cruce —«Contratos · Editar»— con `Interruptor``.etiquetaOculta`, y la columna de nombres se queda quieta al deslizar. **Lo que puede tocarles:** si hacen un `switch` exhaustivo sobre `cerrado.tipo`, contemplen `noAplica`; y las clases `.pm-*` son nuevas en la hoja. **Y una que sí les toca aunque no usen la matriz:** `Interruptor` ata por fin su `ayuda` al control con `aria-describedby` — hasta ahora el texto se pintaba al lado y **ningún atributo lo unía al interruptor**, así que un lector decía «Editar, interruptor, desactivado» y se dejaba el porqué. Si su hoja apuntaba a `.sw-ayuda` por posición, ahora lleva `id`. La presentación en lista no cambia en nada más |
| 1.127.0 | **Garantizar entrega contra promesa.** **No añade nada al código**: es lo que salió al preguntar en serio si lo que se entrega es lo que se promete. **El LEEME del ZIP decía que los componentes de React «todavía no existen»** —lo decía desde la v1.39.0, con 34 dentro—, su §3 **no importaba `componentes.css` en ningún paso** (quien lo siguiera montaba los componentes sin estilo) y su Ruta A mandaba reemplazar dos carpetas cuando son cuatro. Esta guía **se contradecía consigo misma** en la misma sección, y daba 79 archivos y «quince candados dentro de dieciocho pasos» cuando son **82** y **diecisiete dentro de veinte**. **Y se documentan dos requisitos de compilación que faltaban**: sin `@types/node` son nueve errores de tipos, sin `DOM.Iterable` otros tres. En el catálogo, **dos defectos ya cerrados seguían publicados como abiertos** (R144 y R146) y la maqueta del panel **enseñaba el defecto que R148 cerró**. **Lo que puede tocarles:** si se guiaron por el §3 del LEEME, les faltaba importar la hoja; y si actualizan copiando carpetas, ahora son cuatro |
| 1.126.0 | **R148–R150 · las tres que bloqueaban la adopción del panel.** **`deshabilitado` por privilegio**: apaga el control **sin esconder el estado** y **sigue contando** en el «4 de 6» — antes lo único por fila era `cerrado`, que sustituye el interruptor por un chip, así que un permiso concedido se veía como si no lo tuviera. **El `base` se anuncia antes de pulsar** («· enciende también «Ver»»): encender de rebote lo que su servidor no exige les tumbaba el PUT entero con 403. Y **`privilegiosEfectivos` exige su tercer parámetro**, sin valor por omisión: con `base={null}` en el panel y la llamada corta, **vaciaba todos los módulos sin `ver` en silencio**. Ahora **`onCambio` entrega también lo efectivo**, calculado con el `base` que el panel tiene, así que no puede discrepar. ⚠️ **Lo efectivo puede ser un BORRADO**: un módulo sin su base sale como `{}`, y con un PUT de juego completo eso borra sus filas. **Lo que puede tocarles:** llamar a `privilegiosEfectivos` con dos argumentos es ahora **error de compilación**; el nombre accesible de un interruptor puede llevar el aviso del arrastre; y la última fila de un módulo sin base pierde su línea inferior. **La v1.125.0 no llegó a publicarse**: se commiteó con el «+N» muerto por especificidad —no se veía en ningún ancho—, una auditoría lo cazó y se corrigió antes de etiquetar. Lo del R144 al R147 entra aquí |
| 1.125.0 | **NUNCA PUBLICADA** — se corrigió y salió dentro de la v1.127.0. **R144–R147 · las cuatro de `PanelPrivilegios`, encontradas al ir a adoptarlo.** **Las filas sin `base` dejan de estar al 50 % de opacidad** —el nombre caía a 2,07:1 con los interruptores **aún pulsables**, y no es un caso raro: es el estado **inicial** de la pantalla— y pasan a llevar un filete de 3 px; el aviso sube a ir **justo debajo del base**, no al final. **En el teléfono la cabecera conserva qué, no solo cuántos**: los chips bajan a una segunda línea con los dos primeros y un «+N», en vez de ocultarse. **La fila bloqueada por `depende` entra en el orden de tabulación** —es la única transitoria— como `role="switch"` con `aria-disabled`; las otras tres no cambian. Y **se corrige la línea de la v1.90.0 de esta misma guía**, que decía lo contrario que el código sobre `depende` y `base`. **Lo que puede tocarles:** el aviso ya no es el último hijo de `.pp-mod-cuerpo`; `.pp-tags` emite un chip más, invisible en escritorio, así que quien cuente chips debe filtrar `:not(.pp-tags-mas)`; y hay una parada de tabulador más por cada dependencia sin resolver |
| 1.124.0 | **R142 · la columna anclada.** Con **`anclarColumnas={1}`** la primera columna visible —y la N.º con ella— **se queda quieta al desplazar en horizontal**. Con 31, 22 o 76 columnas, una fila desplazada no dice de quién es. **Por omisión 0: sin pedirlo no cambia ni una clase ni un píxel.** **Y `columnasFijas` pasa a llamarse `columnasSiempreVisibles`** — nunca significó «fija al desplazar», que es lo que hace `anclarColumnas`; el alias sigue funcionando y avisa en desarrollo, así que **quien no lo pase no toca nada**. **Lo que puede tocarles:** si su hoja aprieta `.tb td` o `.tb-th` con `position` o `z-index` propios, gana la suya y el anclaje no funciona; la celda anclada lleva **fondo en la celda**, no en la fila; y un `transform`, `filter` o `contain` en cualquier antepasado **lo desactiva en silencio**. `.tb-col-op*` deja de viajar: era mobiliario del catálogo. **Y `maxDias` guarda ahora LOS DOS EXTREMOS** — eligiendo primero «Hasta» y después «Desde» salían treinta días con un tope de siete, y el calendario no apagaba ni un solo día |
| 1.123.0 | **R143 · el chip de identidad deja de ser gris.** Los cuatro `identidad-N` y `pendiente` pintaban **el mismo relleno** —`fondo-encabezado`—, así que de los diez tonos que `Chip` publica solo había **seis** distinguibles: medido, **0,0** de distancia perceptual entre ellos. Ahora cada identidad pinta su color con texto blanco, **el mismo par que el avatar**, y **sin ningún color nuevo**. **Lo que puede tocarles:** el chip de identidad **pesa más** que uno de estado; si los mezclan en la misma columna, ya no pesan igual. El del **horario no cambia** — allí el color sigue en el filete a 6 px. Y nace **`verificar-tono`**, el paso **20**: ningún par de tonos puede caer por debajo del umbral de percepción, en ninguna hoja ni modo. **Añadido al R139 · con `maxDias`, los periodos que no caben no se pintan** — los cuatro de omisión van de un mes a un año, así que con un tope corto el panel «Periodos» desaparece entero; para recuperarlo, `atajos={atajosDeDias(1, 3, 7)}`, exportada y contando inclusive. **R141 · a 640 px y por debajo el filtro de fechas se apila y ocupa el ancho**, y se va la flecha de unión |
| 1.122.0 | **R139 y R140 · `RangoFecha` se comporta por fin como un campo.** **`desde`/`hasta` pasan de sembrar a MANDAR** — eran el valor inicial, así que devolverles un rango corregido no lo movía y solo podían avisar *después*. Entra **`maxDias`**, que **impide en vez de avisar**: los días de más van `aria-disabled` mientras se elige el final. Es un número cualquiera y **sin pasarlo no hay tope**. Un rango que **llega** ya pasado **se pinta y se dice, no se recorta**. Y entran **`error`** y **`deshabilitado`**, que les permiten retirar el envoltorio de `Campo` y las dos líneas de CSS — y cierran el fallo que ustedes mismos marcaron: **apagar con CSS no saca el control del tabulador**. **Lo que puede tocarles:** si pasan `desde`/`hasta` y **no** guardan lo que llega por `onCambio`, el calendario queda **congelado**; la migración es de una línea. Quien no las pasa no toca nada. En desarrollo sale un aviso por consola si se pasan sin `onCambio`. Y el bloque «copia esto» de la página del calendario **no compilaba** —decía `RangoFechas`, `etiquetaInicio`, `permitirAbierto`—: corregido, y la página enseña ya el error, el apagado y el tope |
| 1.121.0 | **Dos cosas que la entrega llevaba versiones sin dar.** **La paginación ya dibuja su chevron** —el comentario del propio componente lo prometía, la hoja traía `.pgn-flecha .ic` preparada, y no había chevron; la variante «Móvil» que el catálogo enseña era imposible—. Y **los estados de pantalla llevan icono**: `ep-ico` salía 18 veces en el catálogo y **cero** en los componentes, con cuatro reglas muertas en la hoja, dos de ellas la única señal cromática que distingue un error de un vacío. **Lo que puede tocarles:** «Anterior» y «Siguiente» crecen lo que mide el icono, los siete estados crecen por arriba lo que mide el glifo, y el juego de iconos pasa de **60 a 62** (`calendario` y `suma`, que el catálogo ya dibujaba a mano). Y por debajo, nace **`verificar-atributo`**, el paso **19**: comprueba que lo que un componente emite siempre, el catálogo lo enseñe. Nació con once divergencias —entre ellas cabeceras de tabla sin `scope` y atajos del calendario que eran `submit` dentro de un formulario— y las once están pagadas |
| 1.120.0 | **R138 · dos clases que no comparten un minuto se descartaban. Tenían razón, y no era la resolución.** Su S3 de 09:00–12:20 y su S1 de 12:20–13:55 **compartían fila**, no minutos: el bucle reservaba **filas enteras**, así que un bloque que acaba a media fila se queda la fila entera y cualquiera que empiece ahí se cae. **Una corrección a su documento, medida:** a paso 20 **sí** se pinta — ahí el borde de fila cae exacto en 12:20. La regla real es peor que «depende de la resolución»: **cualquier hora que no caiga en un borde lo reproduce**. Ahora el choque se mide **en cuartos** y los bloques que comparten filas sin compartir minutos van **en la misma celda**, apilados; la celda abarca la **unión** de sus filas. **Lo que puede tocarles:** dos bloques que antes se descartaban ahora se pintan, así que si contaban bloques dibujados o se apoyaban en el aviso «se solapa con otro bloque ya colocado», ese aviso ya no sale cuando no comparten minutos — y cuando sale dice **«se solapa en el tiempo con «X»»**. Y las clases internas del hueco cambian de nombre: `hor-q{cuartos}-{celdas}` pasa a **`hor-h{cuartos}`** y el bloque gana **`hor-d{cuartos}`**. Tenían razón en lo que anticiparon: el hueco en cuartos **tenía** que contar todos los bloques de la pila. **Un límite que conviene que sepan:** el sombreado proporcional llega hasta **seis franjas**; por encima el bloque se pinta ocupando lo que quede de la celda y **se avisa por `onAjuste`** con motivo `span-largo`. Con franjas de dos horas no lo van a tocar; con franjas de 30 min, su propio caso lo alcanza. **Los bloques no se pierden** — lo que se pierde es que la altura sea proporcional al tiempo |
| 1.119.0 | **R137 · el bloque del horario que se salía de su celda. Tenían razón, y el diagnóstico era exacto.** El hueco fraccionado era un **porcentaje del contenedor**, y eso es **circular**: el alto de la pila lo decide su contenido —el bloque no puede encoger— y el hueco era un porcentaje de ese mismo alto, así que se comía su fracción de lo que el bloque necesitaba. Medido en su pantalla: bloque de 12:20 a 13:55, hueco **11,38 px** y **11,04 px pisando la fila siguiente**; el de 10:35, con `rowSpan` 2, cabía — por eso uno *parecía* acabar más tarde que el otro. **Estirar la fila no sirve**, como decían: el hueco crece con ella. Ahora el hueco es una **longitud** —cuartos de `--alto-franja`— y deja de depender del contenido. **Verificado en su navegador** inyectando la hoja nueva: los dos bloques pasan a desbordar **cero**. **Lo que puede tocarles:** el hueco ya no escala con la fila, así que un bloque con mucho texto empieza donde toca y no más abajo; y si su hoja fija `.hor-c` a otra altura, pónganle también `--alto-franja`. Nace la afirmación `R137` en `verificar-cascada`, y el catálogo enseña ya el caso que fallaba: **una sola celda con fracción**, que no estaba en ninguna página. Y al ir a garantizar que la maqueta iguala al componente salieron **dos divergencias más del catálogo**: nueve de diez bloques **sin `title`** —que el componente emite siempre— y cinco **fuera de `.hor-pila`**, que el componente emite siempre y sin la cual la caja es otra. Corregidas, y con prueba que las sujeta |
| 1.118.0 | **Una fila de controles es una fila. R136, y tenían razón.** La causa no era una diferencia de píxeles: **`.campo` no tenía altura propia**. `.btn` declaraba su interlineado (18 px) y `.campo` **no declaraba ninguno**, así que su altura era **la que heredase la hoja de ustedes** — 36,45 en nuestro catálogo, y lo que dictara su hoja en su producto. Por eso el escalón. Ahora se declara: la fila normal mide **36 px** (`--alto-control`), la compacta **28**, y **el estado de error ya no crece 2 px** al engrosar su filete. **Los 2 px de más de la fecha eran del reloj nativo** y se quitan donde nacen, en `::-webkit-datetime-edit` — cuadra exacto con los 39 contra 37 que midieron ustedes; **no lo hemos podido medir en navegador** y se lo decimos: si siguen viendo el escalón en la fecha, dígannoslo. **Lo que puede tocarles:** si su hoja fijaba una interlínea propia y contaban con que los campos la siguieran, ahora son 36 fijos. Un **área de texto no cambia**. Nace `verificar-altura`, el candado quince, que mide **filas** y no un número, y lleva **deuda declarada**: en móvil el campo sube a 42 px y el botón sigue en 36 — está medido y escrito, y no lo arreglamos aún porque las dos salidas son decisiones de diseño. Y el catálogo enseña ya **una barra de filtros** en *La entrega real*, que es el caso exacto que reportaron y que no estaba en ninguna página. **Y aparte, el aviso temporal: dura 2 s, no 5, y se va desvaneciéndose.** Tenían razón en que era intrusivo. El 5000 estaba escrito dentro del componente mientras el token `--permanencia-aviso` decía 5s **sin que nadie lo leyera** y el catálogo demostraba 4, 5, 7 y 10 s: tres fuentes y ninguna mandando. Ahora **el componente lee el token**, así que si quieren otro tiempo para todos sus avisos lo cambian en su hoja; `duracion` sigue mandando por pantalla. El **error no cambia**: no se va solo. **Lo que puede tocarles:** `onCerrar` llega más tarde, porque ahora espera a que termine el desvanecido: **~220 ms** si la transición corre, y **hasta 400 ms** si no corre —un producto con `transition: none`, o el aviso oculto—, que es el plazo de respaldo para que un aviso nunca se quede en pantalla. Y **pulsar la acción («Deshacer») ahora cierra el aviso**: antes se quedaba diciendo algo que ya no era verdad. El catálogo lo cerraba desde el principio |
| 1.117.0 | **CAMBIA EL COMPORTAMIENTO DEL MENÚ DESPLEGADO. Léanlo antes de actualizar.** Hasta ahora los grupos llegaban **todos abiertos** y el cursor no los tocaba. Ahora llegan **plegados**: solo está abierto el de la pantalla en curso, que además lleva `.fijo` y su título en el color de acento; **el cursor revela** cualquier otro y al salir se pliega; y **elegir una opción mueve el bloqueo**, plegando el anterior. **Plegado no cambia nada.** Lo decidió el responsable del sistema: *«mostrar un menú corto y solo donde estoy ahora»*. **Esto deroga la regla 9**, que ustedes respaldaron por escrito en R135 —y tienen razón en que decía lo contrario—: aquel argumento (*abrir al pasar por encima cuando ya se lee todo es ruido*) se apoyaba en que **ya se leía todo**, y con un menú corto deja de sostenerse. La regla vieja queda escrita como derogada, con su motivo. **En su código no hay nada que tocar**: ninguna prop cambia. **Y el catálogo monta ahora `MarcoApp` de verdad**, no una maqueta: en *Maquetas*, debajo de las tres de cartón. Si algo se comporta distinto entre las dos, manda la de abajo. |
| 1.116.0 | **Nada que cambiar en su código: es el catálogo el que no cumplía.** La regla 12 de la v1.115.0 —plegado, las ramas del panel flotante llegan abiertas— entró en el componente y **no en la barra propia del catálogo**, que es la que ustedes recorrieron para reproducir R135b. Comprobado pasando el ratón: el panel abría y las cinco ramas seguían cerradas. Si volvieron al catálogo a verificar y les pareció que no estaba hecho, **tenían razón y era del catálogo, no del componente**. `MarcoApp` ya lo hacía desde la v1.115.0. |
| 1.115.0 | **R135, y es para ustedes si montan un menú de tres niveles.** **(a)** `.nav-nieto` era `display: block` mientras `.nav-hijo` es `flex`: **cualquier icono en el tercer nivel caía encima del rótulo** y la fila medía el doble. Ya es `flex`; **el sangrado de 56 px y el cuerpo de 12 px no se tocan**. Si quitaron el icono de ese nivel para que no se partiera, pueden devolverlo. **(b)** Con el riel plegado, una rama dentro del panel flotante **no se abría al pasar el ratón** y quedaba detrás de un clic en un panel que solo vive mientras el puntero está encima. **Decisión tomada: el panel llega desplegado.** Un resumen con secciones plegadas no resume, y anidar un segundo «abrir al pasar» dentro de un panel que se cierra al salir es una trampa de temporización. Extendido **no cambia nada**: las ramas siguen arrancando cerradas. **(c)** Los 16 títulos de grupo y de rama de la barra del **catálogo** no tenían globito; ya lo llevan los 86 elementos. Y la maqueta del catálogo **enseña ahora el tercer nivel**, con icono en los tres. |
| 1.114.0 | **Lean esto si usan `MarcoApp`: el menú plegado era una fila de iconos mudos.** Plegado, el rótulo iba a `display:none` —que lo saca también del árbol de accesibilidad— y el icono va `aria-hidden`: una opción **sin hijos** se quedaba **sin nombre de ninguna clase**, ni para el ratón ni para un lector de pantalla. El catálogo la rotulaba con `title` desde siempre y **el componente no emitía ninguno**. Ahora lo emite en los cinco sitios y el rótulo se **esconde a la vista** en vez de borrarse. **Tres cosas más, y les tocan aunque no toquen nada:** (1) el `hidden` de `.nav-hijos` **no ocultaba** —`display:grid` gana a la regla del navegador—, así que un grupo cerrado seguía pintado si copiaron el marcado a mano; ya está en la hoja. (2) La barra del catálogo abría los grupos **al pasar el ratón con el menú desplegado** y el componente no lo hace: ahora las dos hacen lo mismo, y es regla de contrato. (3) La maqueta del catálogo pintaba los grupos como enlaces con un chevron dentro —marcado que el componente **no produce nunca**— y con eso **el panel flotante del menú plegado no se demostraba en ninguna parte**. Ya se demuestra. **No cambia ninguna prop ni ninguna firma.** |
| 1.113.0 | **Si probaron la v1.112.0, actualicen también.** Escribir de corrido ya funcionaba, pero la letra escrita **al final de un párrafo** podía salirse del párrafo cuando el saneo reescribía la caja —al pegar, al abrir un documento sucio o al escribir dentro de un `{{hueco}}`—. El fondo era el mismo error dos veces: **una posición contada en caracteres es ambigua en toda frontera**, y las dos formas de resolverla rompen algo (hacia atrás, la letra va a la línea de arriba tras un Intro; hacia delante, se sale del párrafo). Ahora se guarda **de qué lado** estaba el cursor. **Al teclear normal no se notaba nada**, porque teclear no reescribe. **Queda declarado y sin cerrar:** si el saneo retira texto **por delante** del cursor, el cursor se corre esos caracteres. |
| 1.112.0 | **Si instalaron la v1.111.0, actualicen: el editor de texto NO SE PODÍA USAR.** El cursor volvía al principio **en cada tecla** y no se podía escribir de corrido. La causa era **un carácter**: el saneador serializaba el espacio duro como carácter crudo y `innerHTML` lo devuelve como `&nbsp;`, así que las dos cadenas nunca coincidían, el componente reescribía la caja en cada pulsación y con ella se iba la selección. Y el navegador mete un espacio duro **cada vez que se teclea un espacio al final**, así que fallaba desde la primera palabra. **Se cierra por los dos lados:** se escapan los cuatro caracteres de la norma —eran tres—, y cuando la reescritura hace falta de verdad —al pegar, o al abrir un documento sucio— **el cursor se conserva**. Si guardaron texto con la v1.111.0 no hay nada que migrar: lo que se emitía era HTML válido, solo que escrito de otra forma. **No afecta a ningún otro componente.** |
| 1.111.0 | **Componente nuevo: `EditorTexto`** — el editor de texto con huecos. **No es un editor: es la garantía.** Cuando el texto viaja a otro formato —un PDF, una impresora, un correo— por el camino hay un saneador que admite mucho menos de lo que un editor de navegador emite, y **lo que el editor ofrece de más se guarda sin error y desaparece en el destino**. Lo que esta pieza promete cabe en una frase: **lo que llega a `onCambio` siempre está dentro de `etiquetas` y `huecos`**, venga de teclear, de pegar, de arrastrar o de deshacer. **Las tres listas entran desde fuera** (`etiquetas`, `huecos`, `maximo`), así que la lista cambia sin que nosotros publiquemos, y **la barra se dibuja desde la lista** — no hay botones apagados, porque una etiqueta que el destino *ignora* es peor que una que rechaza. **Cero atributos**, ni en las permitidas. **Pegar se limpia en el momento**, no al guardar: es el camino por el que de verdad entra el contenido. El tope cuenta **el HTML**, no el texto visible. Y un `h3` sale del **mismo cuerpo** en negrita, porque el editor enseña estructura y no apariencia final. **Sí se puede renderizar en servidor**, y eso costó una ronda: el saneo corría en el render y `DOMParser` no existe en Node, así que un producto con Next o Remix moría con `ReferenceError` y **la página entera no se pintaba**. Ninguna prueba podía verlo —corren en jsdom, que sí lo tiene—. **Lo que ven en pantalla no cambia, con un matiz:** el contador y la lista de huecos aparecen **al montar**, no en el HTML del servidor, porque los dos dependen del contenido de la caja. **De lo suyo, solo cambia un archivo y no cambia de comportamiento:** el contador de `AreaTexto` se sacó a un módulo compartido —`interno/contador.tsx`— para que el editor lo **componga** en vez de copiarlo; comparado declaración por declaración contra la versión anterior, es idéntico. **Y hay dos arreglos en la hoja que sí les tocan aunque no usen el editor:** el buscador de `TablaDatos` declaraba `min-width` **dos veces** en el mismo selector y ganaba el 230px, así que **no bajaba de ahí** y empujaba la barra de filtros en anchos estrechos; ahora encoge como dice su regla. Páginas: **Editor de texto**, **La entrega real** y, dentro de ésta, **Editor de texto en error**. |
| 1.110.0 | **El botón de la acción del diálogo ya sale centrado, y admite icono** (R133). **(1)** El hueco del girador se reservaba **solo delante**, así que el rótulo quedaba **11 px a la derecha del centro** de su propio botón —huecos de 39 y 17— y al lado de un «Cancelar» centrado el pie se veía torcido. Desde R118 eso son **todos los diálogos que escriben**. Ahora el hueco va a los dos lados: medido en navegador, el botón crece **22,00 px** y el desvío pasa a **0** en reposo y ocupado, también en `mini`, `destructiva` y `terciaria`. **Es un cambio de ancho**: si compensaron el desvío a mano, **quítenlo**. **Dos casos NO se centran, y conviene saberlo antes de actualizar:** *sin* `textoOcupado` el rótulo sigue a 11 px y el botón sigue creciendo 22 al ocuparse; y **con `icono`** va a **13 px** en reposo y el botón **encoge 4 px** (el icono mide 18 y el girador 14, y eso viene de antes). **(2) `accion.icono`**, que `Boton` aceptaba desde siempre y el diálogo no dejaba pasar. **Ojo a la combinación**: es justo el caso que (1) no centra, así que una acción con icono queda **más** torcida que antes, no menos. **El botón de cerrar no lo admite, a propósito**: siempre dice lo mismo y lo que hace es irse; un icono ahí compite con el de la acción, que sí informa. Está escrito en el contrato para que no haya que volver a preguntarlo. |
| 1.109.0 | **`RangoFecha` ya se puede cerrar** (R131), **y lean lo de la caché aunque no usen el rango.** **(R131)** Con el calendario abierto no había forma de cerrarlo sin cambiar el rango: clic fuera, Escape, volver a pulsar el disparador y pulsar otro botón de la página **dejaban los 626 px flotando sobre los resultados**. Ahora cierra con las cuatro. El clic fuera **no** devuelve el foco —se lo quitaría a donde acaban de pulsar—, Escape sí, y **cerrar no descarta el rango**. Dentro de un `Dialogo`, la primera Escape cierra el calendario y no el diálogo. **(Caché) `npm install` no basta: reinicien el servidor.** El 13/09 este mismo equipo actualizó, midió, le salió **idéntico a antes** y estuvo a punto de reportar un defecto ya corregido como no resuelto. La culpa era nuestra: la comprobación que dábamos —leer `package.json` con `node`— mira **el disco**, así que pasa en verde mientras el navegador recibe lo anterior. Y lo que cambia en la mayoría de versiones es **CSS**, que desde JavaScript no se podía preguntar. Ahora sí: `tokens.css` declara **`--mmi-version`** y **`--mmi-componentes`** en `:root`, legibles con `getComputedStyle`. **Son dos** porque `tokens.css` y `componentes.css` son dos importaciones distintas y **la mayoría de las versiones cambian la segunda**: si van a medir anchos o alineaciones, la que responde por eso es `--mmi-componentes`. Van **sin comillas** a propósito —entrecomilladas, `getPropertyValue` devuelve la comilla dentro y un `===` falla siempre—, así que hace falta `.trim()`. El **§1bis** trae el reinicio como paso obligatorio, el recordatorio de reiniciar **otra vez** tras borrar la caché, y las **cuatro** comprobaciones. Si discrepan, **es la caché, no el componente**. |
| 1.108.0 | **`RangoFecha`: cuatro cosas, y dos se ven.** **(R129) El calendario tenía suelo de mentira.** En una fila estrecha —junto a un botón, dentro de una columna— las siete columnas de días se encogían con el disparador hasta **16 px**: los días de dos cifras **se tocaban** (`141516171819 20`) y la **barra de periodos desaparecía entera**, **sin aviso**. `.fc-d` gana `min-width: 30px`; el tope de `.fc-cal` sube de 560 a `min(640px, calc(100vw - 24px))` porque el contenido pide **626 px** y hay `overflow: hidden`; y la reserva que apila corta en **660** en vez de 620. **Si llevan el apaño en su hoja, ya lo pueden quitar.** **(R130.1) La etiqueta sale del recuadro.** Era la única del sistema puesta dentro: ahora va encima, en su `.cg`, como en `Campo`, y el disparador mide **los 36 px de un campo, exactos**. **Cambio visible**: si alinearon a mano la altura del rango con la de un campo vecino, **quítenlo**. El marcado cambia —`.fc-campos > .cg > .cg-et + button.fc-campo`— así que si lo copiaron a mano, actualícenlo. **(R130.2) La fecha ya no sale en ISO.** Se mostraba `2026-09-01` contra la tabla «Formato» del propio catálogo; ahora `01/09/2026`. La propiedad **sigue siendo ISO**: lo que cambia es lo que se pinta. Si formateaban por su cuenta leyendo el DOM, sobra. **(R130.3) Sin rango, el resumen calla.** Decía «Sin rango elegido.»; ahora queda vacío. El elemento **no desaparece**, para no romper el anuncio de la primera elección. **Un límite declarado**: el calendario pide 626 px, así que dentro de un `Dialogo` (480 px de interior) se ve entero pero **con desplazamiento horizontal**. Es mejor que encogerse hasta ser ilegible, y no se arregla con CSS — la salida es la capa superior del navegador, en otra versión. |
| 1.107.0 | **Lean esto aunque no usen `Dialogo`: hay cinco arreglos en `Boton` y tres en la hoja.** Lo pedido era R118 —`accion.textoOcupado`, para que la acción del pie diga «Grabando…» en vez de apagarse muda—; auditarlo destapó el resto. **En la hoja:** (1) **no llevaba ni un `@keyframes`**, así que `animation: btn-girar` viajaba sin definición y el navegador la ignora **en silencio** — el giro del botón ocupado y la barra indeterminada estaban **quietos** en su producto. Ya viajan; si copiaron los `@keyframes` a mano, **quítenlo**. (2) `.btn-ocupado{cursor:progress}` era **regla muerta** —`.btn:disabled` le ganaba—, así que un botón ocupado mostraba el cursor de *prohibido*; **ahora muestra el de espera**. Cambio visible en todos los productos. (3) El hueco del giro dejó de **girar invisible para siempre** en cada botón con gerundio. **En `Boton`:** (4) un `textoOcupado` que no pinta texto —`null`, `false`, `''`, `<span>{t('clave.ausente')}</span>`, un generador vacío— dejaba el botón ocupado **sin nombre accesible**; ahora se cae al comportamiento de siempre. (5) Cada acción que fallaba dejaba un **rechazo sin manejar**; ahora se reporta por `console.error` — **ojo: eso lo baja de evento a miga de pan** en Sentry y compañía, así que si dependían de `unhandledrejection`, **capturen en su `onClick` y reporten ustedes**. (6) Con `textoOcupado` y **sin icono**, el botón **crecía 22 px** al ocuparse; ya no. *Sin* `textoOcupado` sigue creciendo igual que antes. Con `icono`, encoge 4 px (el icono mide 18 y el giro 14), tampoco cambia. (7) `soloIcono` **ignora** `textoOcupado`: no tiene texto que sustituir. (8) Un `throw` **síncrono** en `onClick` **sí** llega a su vigilante como error no capturado — lo que no ocurre es que el botón se entere: ni se ocupa ni protege del doble envío. **Devuelvan la promesa.** **En `Dialogo`:** el foco **no volvía** al cerrar por código —el camino más frecuente—, ni si desmontaban el diálogo al cerrarlo, ni en **modo estricto** (Vite, CRA y Next lo traen puesto); y ahora **no se lo quita** a quien ya lo colocó. Nuevas: `accion.ocupado` y `accion.destructiva` documentada. **Un límite que no podemos cerrar:** si montan el diálogo como `{abierto && <Dialogo …/>}`, cerrarlo con la acción en vuelo **mata el guardia del doble envío** y el botón vuelve pulsable. O no lo desmontan, o llevan el estado con `accion.ocupado`. Y el contrato estrena **sección de Diálogo**: **dieciocho reglas** y **veinticuatro pruebas nuevas** —de 7 a 31—, más un archivo de pruebas que **ejecuta el catálogo** |
| 1.106.0 | **Nueva página del catálogo: «La entrega real».** Pinta los componentes con `tokens.css` y `componentes.css` **y nada más**, en un marco aislado, con el marcado que emiten los componentes. Si algo se ve mal ahí, así se ve en su producto. **Encontró un defecto a la primera:** la foto del `Avatar` salía **32×39 en un círculo de 32×32** — el `overflow:hidden` la recortaba, así que parecía correcta. Si muestran fotos de personas, actualicen |
| 1.105.0 | **Cierra R126 del todo, y esta vez con candado.** El arreglo anterior dejaba el día **inline dentro de su columna** —la celda de rejilla no tenía ninguna regla—, así que el tramo se pintaba a trozos. Ahora el catálogo emite **el mismo marcado** que el componente, y hay una prueba que **ejecuta el catálogo** y compara el árbol: si las dos superficies se separan, sale en rojo. Corregido además un defecto de accesibilidad del catálogo: marcaba los extremos del rango con `aria-current="date"`, que significa **hoy**. Y el publicador **corre los diecisiete candados por su cuenta** y se niega si alguno está en rojo — la v1.103.0 salió rota porque correrlos dependía de acordarse |
| 1.104.0 | **R126 de verdad: el arreglo anterior estaba a medias.** Se añadió la regla nueva y **no se retiró la vieja**, así que `.fc-dias` seguía repartiendo las siete semanas en siete columnas de 9,26 px. Ahora está medido en el DOM del catálogo real: `.fc-dias` es **una** columna, sus hijos son filas, y cada fila tiene siete columnas de 26,4 px. **Pueden migrar sus dos `Campo tipo="date"` al componente.** Cierra además cuatro defectos: `.fc-otro-mes` retirada, `meses = 1` ya no deja media rejilla vacía, cambiar de mes **ya no desborda** (31-ene + 1 mes daba 3 de marzo), y la vista previa se suelta al cerrar. Y `RangoFecha` **gana contrato**: doce reglas donde no tenía ninguna |
| 1.103.0 | **Actualicen. Cierra R126 y siete defectos nuestros.** **`RangoFecha`**: el calendario repartía las **siete semanas en siete columnas** —cabeceras «LMXJVSD» pegadas— porque el componente anida filas (ARIA lo exige) y la hoja esperaba celdas planas; y el campo se leía «DesdeElegir fecha». **`SelectorBusqueda`**: el esqueleto salía **con umbral cero desde la segunda consulta** (parpadeo por pulsación), un `AbortError` **del producto** dejaba el control colgado sin salida, Escape dejaba `aria-busy` puesto, y «reintentar» no daba acuse. **Candado de color**: nombrar un color de marca lo **debilitaba** —cualquier `--marca-*` servía de coartada—; ahora compara el nombre completo. **Iconos**: el filete del lápiz sobresalía 1,41 unidades. Y si leyeron «1.100.1» en el registro de cambios, **esa versión nunca existió** — no la busquen |
| 1.102.0 | **Siete iconos nuevos, para la barra de edición.** `negrita`, `cursiva`, `lista`, `deshacer`, `rehacer`, `guardar` y `lapiz`. Se pidieron seis; `rehacer` entra igual porque deshacer sin su par es media función. Se usan como cualquier otro: `<Icono nombre="negrita" />`. **Nada que cambiar**: solo hay siete más donde había 53 |
| 1.101.0 | **Si usan `RangoFecha`, actualicen: les faltaba medio calendario.** La hoja estilizaba **24** clases `fc-*` y el componente emitía **14**. No existían: la rejilla de **dos meses**, el **panel de periodos** («Este mes», «Mes pasado», «Últimos 2 meses», «Este año»), el **resumen** en palabras, el **guion** entre los dos campos, la vista previa del rango al sobrevolar y el resaltado del campo activo. Y la regla de **≤620px** que colapsa el calendario a una columna cuelga de `.fc-cal-cuerpo`: sin esa clase **no podía dispararse nunca**, así que en un teléfono salía a dos columnas apretadas. Además las reglas del campo iban atadas a `input.fc-campo` y el componente emite `<button>`, así que el campo salía **sin icono de calendario y sin tope de ancho**. Nuevas props: `atajos` (sustituibles, o `[]` para quitarlos) y `meses` (2 por omisión). **Nada que cambiar en su código**: lo que ya pasaban sigue igual |
| 1.100.0 | **Si muestran fotos de personas, actualicen.** Dos defectos del `Avatar` desde la **v1.7.0**, encontrados auditando nuestros propios documentos contra el código. **(1)** La foto que no carga **no caía a las iniciales**: no había `onError` y las iniciales ni siquiera estaban en el DOM, así que una URL caducada o un 403 pintaba el icono de imagen rota del navegador dentro del círculo — en la barra superior de todas las pantallas. **(2)** La regla que da tamaño y recorte se llamaba `.av img` —el **aviso** temporal— y no `.avatar img`: una letra, y con ella la foto se pintaba a tamaño natural dentro de un círculo recortado, un trozo de la cara ampliado. Nuestro catálogo no podía enseñarlo porque no pinta ni un avatar con `<img>`, y no había ninguna prueba de `Avatar`. Ahora hay siete |
| 1.99.0 | **Nada que cambiar en su código: son dos papeles, pero de los que viajan.** **(1)** `comportamiento.md` —el contrato al que les remitimos— empezaba con **tres filas de tabla sueltas y sin cabecera**, y su titular estaba pegado al final de la tercera sin salto de línea, dentro de una celda. La edición de la v1.78.0 quiso insertar dos reglas en «Fila de carga» y el bloque aterrizó en la línea 1 del archivo. **Lleva así veintiuna versiones** y ningún candado lo veía: `verificar-contrato` lee las filas por su número y no le importa dónde estén. Ya están en su sección, que vuelve a ir del 1 al 9. **(2)** Se declara la **concordancia de registros**: lo que publicamos como **R118** es su **R123** (selector búsqueda asíncrono). Acuñamos ese número sin que nos correspondiera y choca con su R118 y su R119 reales. Los números publicados **no se mueven** —una etiqueta movida entrega cosas distintas—, así que la tabla vive en `comportamiento.md`. De aquí en adelante manda su registro |
| 1.98.0 | **Nada que cambiar en su código: es vigilancia, no una función.** MMI-DS §8.5 declara **dos** rojos en la identidad; midiendo los PNG píxel a píxel hay **tres**. El tercero, `#EC1C24`, está **dentro del escudo que el lockup lleva incrustado** —y el escudo suelto pinta ese mismo escudo en `#E30613`—, así que el defecto no es «el escudo usa un rojo y el lockup otro»: es que **el mismo escudo sale de dos rojos distintos** según de qué archivo se saque. Entra en la familia `marca` como `marca_rojo_escudo_lockup`: **conocido y NO autorizado**, igual que `marca_rojo_lockup`. Si lo escriben a mano en un producto, el candado de color ahora lo ve. Corregidas de paso dos cosas que este repositorio daba por ciertas: el escudo suelto **sí existe** (`AE.png`, 1063×1291, fondo transparente), y el casi-negro `#1D1D1B` **no es** el wordmark «ALBERT EINSTEIN» —ese es rojo— sino «COLEGIO» y el lema |
| 1.97.0 | **`SelectorBusqueda` sabe buscar contra el servidor.** Nuevo `modo="servidor"` —la misma palabra que en `TablaDatos`— con `onBuscar(texto, senal) => Promise<OpcionBusqueda[]>`. **Nada que cambiar en su código si no lo usa:** sin `modo`, todo sigue filtrando en local exactamente igual. Esta página lo prometía desde su primera versión en la tabla «Cuál de los dos» —«cientos o miles: con búsqueda **contra el servidor**»— y no había con qué cumplirlo. **El ciclo entero es del componente**, no suyo: rebote de 300 ms, cancelación de la consulta anterior con `AbortSignal` y descarte de la respuesta que llegue fuera de orden —esa carrera es un fallo silencioso, y repartirla por cada pantalla es repartir el mismo defecto—. Mientras busca pinta **esqueleto** (nunca antes de 300 ms) con `aria-busy`; si la consulta se cae, la fila **reintenta** con ratón y con Enter. Y arregla un defecto que este modo destapó: **la elección ya no se evapora** al seguir buscando |
| 1.96.0 | **Nada que cambiar en su código: es una garantía, no una función.** La v1.95.0 arregló a mano las nueve divergencias del `SelectorBusqueda`, pero lo que las fijaba eran pruebas **escritas a mano** con lo que el catálogo enseñaba ese día: el día que el catálogo cambie, seguirían en verde y las dos superficies otra vez distintas. Ahora el catálogo **se ejecuta** dentro de las pruebas, se despliega su lista, y se compara árbol contra árbol con la que emite el componente **alimentado con los mismos datos**. Verificado en rojo reintroduciendo dos de los nueve defectos, y también rompiendo **el catálogo**: ahí las 34 pruebas anteriores seguían en verde. **Queda declarado y sin cerrar:** el vacío por omisión (`.sel-vacio`, cuando no se pasa `onCrear`) **no tiene demo en el catálogo** y por tanto no tiene promesa con la que compararse |

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
