# R43 · Carga de PDF · y R44 · Área de texto

**Fecha:** 11 de agosto de 2026
**Origen:** el responsable, por el chat. No viene de un producto.
**Resuelto en:** v1.39.0

---

## Lo que se pidió, literal

> «un componente Subir archivo pdf que solo admita pdf, y los comprima, debe ser
> configurable el label, y detalles que dan la idea al usuario que debe hacer,
> quiero probarlo en el cascaron, solo para el cascaron colocas informacion del
> peso inicial y peso final luego de comprimir el pdf»

Y a mitad de trabajo:

> «desarrolla el componente input text area»

---

## La decisión que había que tomar antes de escribir nada

**Comprimir un PDF de verdad no es gratis, y la vía normal era una
dependencia.** `pdf-lib` habría resuelto la mitad estructural en una tarde.

Se descartó, y el motivo no es purismo: **el paquete no tiene ni una dependencia
de ejecución** —viaja como fuente y lo único que pide es React—, así que la
dependencia no se la habría puesto el sistema, se la habría puesto **a cada
producto que lo instala**. Y `pdf-lib` no hace lo que de verdad hacía falta:
recomprimir las imágenes de un escaneo, que es el PDF que pesa en un colegio.

Se escribió el compresor a mano. Es una decisión técnica de dentro de la
carpeta, así que **se tomó y se reporta**, no se consultó.

### Lo que se descartó, y por qué

| Vía | Por qué no |
|---|---|
| `pdf-lib` | Primera dependencia de ejecución del paquete, para todos los productos. Y no recomprime imágenes: sobre un escaneo habría ganado ~0 % |
| `pdf.js` + volver a dibujar cada página | Gana mucho pero **pesa muchísimo** y convierte el texto en imagen: un acta deja de poderse buscar y de poderse leer con lector de pantalla |
| Ghostscript en el servidor | Es lo que mejor comprime, y **sigue siendo la respuesta correcta para un lote grande**. Pero no es un componente del sistema de diseño: es infraestructura del producto |

---

## Qué se entregó

### R43 · `CargaPdf` + `comprimirPdf`

Lo pedido, punto por punto:

| Pedido | Cómo quedó |
|---|---|
| Solo admita PDF | **Comprobado en los bytes** (`%PDF-`), no en la extensión ni en el `type`. `accept` filtra el diálogo y nada más: arrastrando entra cualquier cosa y un `.docx` renombrado se cuela |
| Que los comprima | Cinco pasadas. Medido: **88–91 %** en PDF crudo, **94 %** en un escaneo |
| Label configurable | `etiqueta` (obligatoria), y además `textoBoton` |
| Detalles que den la idea de qué hacer | `instrucciones` dentro de la zona, `pista` para las condiciones, `ayuda` bajo el control. Los tres con texto por defecto que ya dice qué hacer |
| Probarlo en el cascarón | Página «Carga de PDF», con un PDF de verdad |
| Peso inicial y final **solo en el cascarón** | `mostrarPesos`, **apagado por defecto**. Los dos pesos viajan siempre en `onCambio`, así que un producto que los quiera los tiene |

### R44 · `AreaTexto`

Compone el envoltorio de `Campo` —no lo reconstruye— y aporta las tres cosas
que un `<textarea>` hace distinto: crece con lo escrito (con CSS), el límite es
**blando**, y el contador solo se anuncia en el último tramo.

---

## Lo que NO hace, dicho antes de que lo pregunten

- **No comprime imágenes que no sean JPEG.** Un PDF con PNG incrustados apenas
  adelgaza. Se dice en `detalle`.
- **No toca las fuentes incrustadas.** Es el otro gran peso de un PDF.
- **En Node no toca ninguna imagen**: necesita `canvas`. Se declara en
  `detalle.imagenesOmitidas`, y las pruebas lo dicen en su cabecera.
- **Un PDF que ya pasó por un optimizador saldrá igual**, y devuelto tal cual.
- **Un PDF firmado no debe comprimirse**: reescribir el archivo invalida la
  firma. Por eso existe `comprimir={false}` — la decisión es del producto.

---

## Cómo se verificó

- **270 pruebas** en 20 archivos, todas en verde. **37 son nuevas**, en tres
  archivos: el compresor (14), `CargaPdf` (12) y `AreaTexto` (11).
- El camino de imágenes **no se puede probar en Node**, así que se probó en el
  navegador: se fabricó un A4 a 300 ppp con ruido en JPEG de calidad alta —un
  escaneo— y salió **3,6 MB → 223 KB, 94 %**.
- Y la comprobación que de verdad importaba: **el PDF resultante se abrió en el
  visor de Chrome**, con sus dos páginas intactas y legibles. Un compresor que
  solo sabe releerse a sí mismo no vale.
- Los **diez candados** en verde.
- Se rompieron dos garantías a propósito para ver las pruebas en rojo. **Una de
  las dos no se puso en rojo**: la de «nunca devuelve algo más grande» solo
  exigía «no mayor», y la segunda pasada salía exactamente del mismo tamaño. Se
  reescribió para exigir la promesa entera —o pesa menos, o vuelve el mismo
  archivo byte a byte— y entonces sí falló.
