# R102 · Las tres cargas dejan de romper el formulario

**Para:** el área de sistemas y los equipos que consumen el sistema de diseño
**Versión:** v1.78.0 · 27 de agosto de 2026
**Afecta a:** `CargaImagen`, `CargaPdf`, `CargaId`

---

## En una línea

Subir imagen, subir archivo y subir ID **arrancan y terminan igual**: una fila
que mide lo que un campo, con el disparador y lo ya cargado **al costado**.
**El funcionamiento interno no cambia** — lo que cada una comprueba, comprime,
valida y entrega es exactamente lo de antes.

## Por qué

No era estética. Medido en el catálogo con el navegador, un `.campo` da
**36,45 px** de alto —13 px de texto con 18,85 de interlínea real, más 8+8 de
relleno y 1+1 de borde—. Contra esa medida:

| Componente | Qué hacía | Alto |
|---|---|---|
| `CargaImagen` | pintaba su caja de vista previa entre dos campos | **96 px** |
| `CargaPdf` | apilaba la lista de archivos **encima** del botón, así que la carga crecía hacia arriba y el formulario entero se movía al añadir uno | variable |
| `CargaId` | ponía las dos miniaturas al costado, pero de 76×48 | **48 px** |

Las tres rompían la rejilla del formulario, cada una a su manera **y con su
propio marcado**. Ahora las tres emiten la misma fila, así que no pueden
volver a separarse: no es que se parezcan, es que es la misma pieza.

## Qué van a ver

- La fila mide **36 px** y **no crece nunca**: con un archivo, con cinco y con
  ninguno ocupa lo mismo.
- Lo que no cabe **se cuenta** («+2») en vez de saltar a un segundo renglón.
- El **nombre** del archivo se recorta con puntos suspensivos; **la extensión,
  jamás** — cortar `boleta-…-2026.pdf` por el final se lleva justo el dato que
  dice qué es.
- La miniatura (22 px) sirve para saber que **hay algo puesto**, no para
  reconocerlo. Reconocerlo es del visor, que se abre pulsándola.

## Lo que tienen que hacer

**Si usan los componentes: nada.** Actualizan la versión y ya está.

```bash
npm install "github:solwarehz/sistema-diseno#v1.78.0"
```

**Con una excepción, y es la única que exige revisar pantallas:** `CargaImagen`
**cambia sola**. Pasa de la caja de 96 px a la fila de 36. Donde la caja era lo
correcto —una pantalla **dedicada** a poner esa foto o ese logo, porque ahí
enseña el hueco real donde la imagen va a vivir— hay que pedirla:

```jsx
<!-- En un formulario: no hay que pedir nada, la fila es el defecto -->
<CargaImagen etiqueta="Foto del trabajador" valor={ficha.foto}
  onCambio={({ archivo }) => subir(archivo)} onQuitar={() => borrar()} />

<!-- En una pantalla hecha para poner esa imagen -->
<CargaImagen etiqueta="Logo de la institución" presentacion="caja"
  formato="logo-extendido" valor={marca.logo}
  onCambio={({ archivo }) => subir(archivo)} />
```

Salió al revés en la v1.77.0 —`caja` por defecto— para no reformar nada en
silencio. Duró un día: así **solo dos de las tres cargas arrancaban iguales**, y
el anuncio decía una cosa y el código otra. Si se pide que las tres arranquen
igual, la que hay que pedir es la excepción.

## Lo que puede romperles

Lo primero ya está dicho arriba —`CargaImagen` cambia de forma sola—. El resto
solo aplica si **maquetaron a mano** con las clases de la hoja en vez de usar
los componentes de React.

0. **El rótulo va DENTRO de la fila**, en las tres cargas: rótulo, botón y lo
   cargado en un solo renglón. Quien lo tuviera colocado aparte con CSS propio
   lo verá moverse. Con rótulos de distinta longitud, dos filas seguidas ya no
   alinean sus botones: es la contrapartida de tenerlo todo en una línea.

1. **`CargaId` pierde sus clases propias.** `.cid`, `.cid-et`, `.cid-fila`,
   `.cid-minis`, `.cid-mini`, `.cid-mini-img`, `.cid-error` y `.cid-nota` pasan
   a ser `.cx-*`. Lo que queda de `.cid-*` es solo lo que vive dentro del
   diálogo (`.cid-paso`, `.cid-visor-img`).
2. **Las miniaturas del ID pasan de 76×48 a 35×22.** La proporción ID-1 se
   conserva: 1,5909 contra el 1,5858 nominal. El documento se lee donde se leía
   antes — en el visor, pulsando la miniatura.
3. **En `CargaPdf`, el resumen cambia de sitio.** `.cpdf-lista` y
   `.cpdf-puesto` siguen existiendo **dentro del panel**; fuera de él, lo
   cargado se pinta con `.cx-adj`, al costado del disparador.
4. **`.cpdf-compacta` y `.cpdf-ayuda` se retiran de la hoja.** Ya no las emite
   nadie; la ayuda del componente sale ahora por `.cx-nota`.
5. **El resumen de `CargaPdf` deja de repetir dos datos.** El **recuento de
   páginas** y —con `mostrarPesos` encendido— el **chip del ahorro**. El resumen
   anterior se apilaba en tres renglones y por eso los tenía; una fila de una
   línea, no: el chip son ~30 caracteres y en una columna de formulario se
   recortaría a la mitad, que es peor que tenerlo donde sí se lee. Los dos
   siguen en el panel y siguen viajando enteros en `onCambio`.

6. **`CargaImagen` pierde su juego propio de rótulos.** `.ci-et`, `.ci-nota`,
   `.ci-error` y `.ci-vacia` desaparecen de la hoja: pasan a `.cx-et`,
   `.cx-nota`, `.cx-error` y `.cx-vacio`, que es lo que ya usaban el PDF y el
   ID. `.ci-et` **ni siquiera fijaba el color**, así que en un mismo formulario
   el rótulo de la imagen podía salir de otro tono. El centrado del vacío
   dentro de la caja sigue, ahora como `.ci-caja .cx-vacio`.

Un séptimo detalle, menor: con el panel abierto, el botón «Subir PDF» **ya no
desaparece, queda apagado**. Antes se desmontaba y con él se iba el ancla de la
fila. Lo que decide qué pasa con el borrador siguen siendo «Grabar» y
«Cancelar», igual que antes.

## Lo que NO cambió, y conviene decirlo

Ninguna regla de comportamiento de las tres cargas se ha tocado:

- `CargaPdf` sigue comprobando **los bytes** (`%PDF-`), midiendo el peso máximo
  **después** de comprimir, devolviendo el original si no gana peso, y
  rechazando dos archivos a la vez en vez de coger el primero.
- Con el panel abierto la elección sigue siendo un **borrador**: `onCambio` se
  dispara **al Grabar**, y volver a abrir arranca de lo ya guardado.
- `CargaId` sigue pidiendo **anverso y después reverso en el mismo diálogo**,
  entregando las dos caras juntas y desactivando el botón al terminar.
- `CargaImagen` sigue encuadrando con teclado, exportando en WebP y cubriendo
  siempre el cuadro. Y con `presentacion="caja"` la vista previa es la de
  siempre: el círculo del avatar, los 212×44 del logo, el avatar de reserva
  cuando hay `persona` y todavía no hay foto.

## Cómo lo verificamos

- **13 candados en verde**, incluidos los cuatro que comparan el catálogo con la
  hoja que viaja: `verificar-promesa` (**1.065 elementos · 218.948 propiedades**
  a cinco anchos), `verificar-elemento`, `verificar-empate` y
  `verificar-cascada` (**963 reglas · 11 anchos**).
- **482 pruebas** en 33 archivos, **23 de ellas nuevas** para esta fila.
- `tsc --noEmit` limpio.
- Medido en el navegador sobre el catálogo: las **siete** filas visibles de la
  página nueva dan **36 px exactos**, ninguna desborda, la miniatura del ID mide
  35×22 y la de una foto sale con radio del 50 %.

## Dónde mirarlo

En el catálogo hay una página nueva, **Elementos › Formulario › Fila de carga**,
con las tres cargas en un mismo formulario y los estados uno debajo de otro.
Las páginas de `Carga de imagen`, `Carga de PDF` y `Carga de ID` siguen donde
estaban, cada una con su demostración funcionando.
