# Actualizar al sistema de diseño v1.55.0

Para el área de sistemas. Esto es todo lo que cambia y todo lo que hay que
hacer, vengas de la **v1.7.0** —la que se entregó en su momento— o de la
**v1.19.0**, que es la que hay instalada. El §4 tiene un apartado para cada una.

---

## 1 · Instalar

```bash
npm install "github:solwarehz/sistema-diseno#v1.55.0"
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
node -p "require('sistema-diseno-ae/package.json').version"   # 1.55.0
```

### 1bis · Si no instalas por npm: la descarga

Cada versión se publica también como ZIP, adjunto a su publicación en GitHub:

**<https://github.com/solwarehz/sistema-diseno/releases/tag/v1.55.0>**

O desde la línea de órdenes:

```bash
gh release download v1.55.0 --repo solwarehz/sistema-diseno
```

Son 51 archivos —tokens, hoja de estilos, los treinta componentes de React, el
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
> saltó al comprobarlo. Lo que hay es **v1.38.0 y anteriores**, y **v1.55.0**.
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

Son 29 versiones. Esto es **solo lo que cambia algo que ya tenías**; lo demás
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
