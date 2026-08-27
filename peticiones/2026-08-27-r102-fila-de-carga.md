# R102 · Las tres cargas dejan de romper el formulario

**Para:** el área de sistemas y los equipos que consumen el sistema de diseño
**Versión:** v1.77.0 · 27 de agosto de 2026
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
npm install "github:solwarehz/sistema-diseno#v1.77.0"
```

**Si quieren la carga de imagen en un formulario**, esto es nuevo y es opt-in:

```jsx
<CargaImagen
  etiqueta="Foto del trabajador"
  presentacion="fila"          // ← lo nuevo. Por omisión sigue siendo "caja"
  valor={ficha.foto}
  onCambio={({ archivo }) => subir(archivo)}
  onQuitar={() => borrar()}
/>
```

`caja` **sigue siendo el defecto a propósito**: en una pantalla dedicada a poner
una foto o un logo la caja no estorba, es el punto — enseña el hueco real donde
la imagen va a vivir. Cambiar el defecto habría reformado en silencio cada
selector de foto ya en producción.

## Lo que puede romperles — cinco cosas, todas de marcado

Solo aplican si **maquetaron a mano** con las clases de la hoja en vez de usar
los componentes de React.

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

Un sexto detalle, menor: con el panel abierto, el botón «Subir PDF» **ya no
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
  siempre el cuadro.

## Cómo lo verificamos

- **13 candados en verde**, incluidos los cuatro que comparan el catálogo con la
  hoja que viaja: `verificar-promesa` (**1.064 elementos · 218.743 propiedades**
  a cinco anchos), `verificar-elemento`, `verificar-empate` y
  `verificar-cascada` (**965 reglas · 11 anchos**).
- **478 pruebas** en 33 archivos, **18 de ellas nuevas** para esta fila.
- `tsc --noEmit` limpio.
- Medido en el navegador sobre el catálogo: las **siete** filas visibles de la
  página nueva dan **36 px exactos**, ninguna desborda, y la miniatura del ID
  mide 35×22.

## Dónde mirarlo

En el catálogo hay una página nueva, **Elementos › Formulario › Fila de carga**,
con las tres cargas en un mismo formulario y los estados uno debajo de otro.
Las páginas de `Carga de imagen`, `Carga de PDF` y `Carga de ID` siguen donde
estaban, cada una con su demostración funcionando.
