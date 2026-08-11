# Control Administrativos · dos hallazgos suyos, verificados

**Fecha:** 11 de agosto de 2026
**Origen:** el equipo del producto, por el chat del responsable
**Resuelto en:** v1.41.1 (el primero, ya publicado) y v1.42.0 (el segundo)

---

## 1 · El botón de CSV que mide 54px — **ya está arreglado; hay que actualizar**

Lo que reportaron, literal:

> «El botón CSV mide 54 px y sus vecinos 36: el icono se apila sobre el texto.
> La causa es que `AccionServidor` pasa el icono dentro de `children`, así que
> `Boton` no añade `btn-ic`, y el `svg { display: block }` de Tailwind parte la
> línea. No lo causó la actualización — el `Boton.tsx` de nuestro pin anterior
> tiene ese mismo camino, comprobado con `git show`.»

**El diagnóstico es correcto en las tres partes**, y la conclusión —que no lo
causó la actualización— también. Lo que falta es que **eso se corrigió el mismo
día por la mañana**, en `v1.41.1` (commit `683a91a`, 09:50), a partir del
diagnóstico anterior del responsable, que era el mismo:

> «El `.btn` que entrega el paquete no declara `display`. Filtros y Columnas se
> alinean porque llevan `.btn-ic` (inline-flex); nuestro CSV no la lleva…»

Desde esa versión **la alineación es del botón, no de `.btn-ic`**:

```css
.btn{ … display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      line-height: 18px; … }
```

`.btn-ic` sigue existiendo —hay productos que ya la usan— pero **dejó de ser
imprescindible**. El `line-height` propio entró una versión antes (`v1.40.1`) y
es lo que fija los 36px lleve icono o no.

**Verificado, no supuesto.** Medido en el navegador con la hoja que viaja
(`tokens.css` + `componentes.css` de v1.42.0) y con el *preflight* de Tailwind
aplicado a propósito —`svg { display: block }` activo y comprobado en el
`getComputedStyle`—, sobre el marcado exacto del caso: icono **dentro de
`children`** y **sin** `.btn-ic`.

| Botón | Clases | Alto medido |
|---|---|---|
| Vecino con icono | `btn btn-neutro btn-ic` | 35,6px |
| **CSV, sin `btn-ic`** | `btn btn-2` | **35,6px** |
| Solo texto | `btn btn-neutro` | 35,6px |

Los tres iguales. (35,6 y no 36 es el redondeo del factor de escala de la
pantalla donde se midió; el cálculo del sistema es 18 + 8 + 8 + 2 = 36.)

**Qué tienen que hacer:** subir el pin a **≥ v1.41.1** —mejor a v1.42.0— y nada
más. No hay que tocar `AccionServidor`, ni añadir `btn-ic`, ni envolver el
icono. Si tras actualizar el CSV sigue midiendo 54px, entonces es otra causa y
queremos verla.

---

## 2 · El apaño del `tsconfig.json` — **el arreglo bueno va en v1.42.0**

Lo que reportaron:

> «El paquete exporta `comprimirPdf` desde un `.mjs` sin declaración de tipos, y
> `tsc` caía con TS7016 dentro de su propio `index.ts` aunque nosotros no usemos
> el compresor. Lo he resuelto nombrando ese archivo en `files` —que `exclude`
> no filtra— en vez de tocar el paquete (D93). El arreglo bueno es un
> `comprimir-pdf.d.mts` suyo.»

**Tienen razón entera, y es defecto nuestro.** El paquete se compilaba limpio
sólo porque *nuestro* `tsconfig.json` lleva `allowJs: true`; cualquiera que
compile sin él —lo normal— se lo comía **desde nuestro propio `index.ts`**, sin
haber tocado el compresor.

**Reproducido antes de arreglar**, con un `tsconfig` de consumidor
(`strict`, sin `allowJs`) apuntado a `componentes/src/index.ts`:

```
src/index.ts(18,60):   error TS7016: Could not find a declaration file for
                       module './interno/comprimir-pdf.mjs'
src/CargaPdf.tsx(61,60): error TS7016: (el mismo)
```

Con la declaración presente: **cero**. Y `tsc --noEmit` del paquete sigue
limpio, que es la comprobación de que la declaración **no miente** — al existir
el `.d.mts`, TypeScript deja de mirar el `.mjs` y todo el paquete y sus 295
pruebas se comprueban contra ella.

Viaja en `componentes/src/interno/comprimir-pdf.d.mts` y declara **todo** lo que
el módulo exporta, no sólo las cuatro funciones públicas. Los tipos que les
sirven:

```ts
comprimirPdf(entrada: Blob | ArrayBuffer | Uint8Array,
             opciones?: OpcionesCompresion): Promise<ResultadoCompresion>
formatearPeso(bytes: number): string
ahorro(pesoInicial: number, pesoFinal: number): number
esPdf(archivo: Blob): Promise<boolean>
```

**Qué tienen que hacer:** actualizar a v1.42.0 y **retirar la línea de `files`**
(D93). Si al retirarla vuelve TS7016, queremos el `tsconfig.json` para verlo.

---

## Lo que nos llevamos de los dos

Los dos son la misma familia: **lo que el paquete promete y lo que el paquete
entrega no se comprobaban en el borde**. El primero ya tiene candado
—`verificar-promesa`, que compara la hoja del catálogo contra la que viaja, y en
v1.42.0 cubre también el marco—. El segundo **no tiene ninguno**: nada comprueba
hoy que el paquete compile en un producto que no comparte nuestro `tsconfig`.
Queda anotado como hueco declarado, no como cosa hecha.
