# Anuncio a los equipos · R118 — el selector con búsqueda ya busca contra el servidor

**De:** el área de diseño (sistema de diseño MMI-DS)
**Para:** Control Administrativos V2.0 · área de sistemas · cualquier producto que
consuma `sistema-diseno-ae`
**Sobre:** `SelectorBusqueda` gana `modo="servidor"`
**Fecha:** 9 de septiembre de 2026 · sistema en **v1.97.0**

---

## Lo primero: si no lo usan, no tienen que tocar nada

`modo` vale `'navegador'` por omisión. Sin esa prop, el componente filtra en
local exactamente igual que ayer —sin tildes, sin mayúsculas, con `includes`—.
**Cero cambios obligatorios.** Esta versión no rompe nada.

Instalar:

```bash
npm install "github:solwarehz/sistema-diseno#v1.97.0"
```

---

## Qué faltaba, y por qué es raro que faltara

La página del selector en el catálogo publica esta tabla desde que existe:

| Opciones | Componente |
|---|---|
| 9 o más | `Selector` con búsqueda |
| **Cientos o miles** | **Con búsqueda contra el servidor** |

Esa última fila era una promesa **sin nada detrás**. El componente tenía catorce
props y **ninguna asíncrona**: `filtradas` era `normalizar(o.texto).includes(q)`
sobre el array que le pasaran. Para buscar entre miles de apoderados había que
traerse los miles al navegador.

**Ningún candado podía verlo.** Los quince comparan el catálogo contra el
componente, y aquí lo que faltaba no estaba en ninguno de los dos: estaba en la
prosa. Es una clase de hueco nueva para este repositorio, y conviene anotarla.

---

## Cómo se usa

```tsx
<SelectorBusqueda
  etiqueta="Apoderado"
  modo="servidor"
  opciones={recientes}          // las de PARTIDA, no el universo
  valor={valor}
  onCambio={setValor}
  onBuscar={(texto, senal) =>
    fetch(`/api/apoderados?q=${texto}`, { signal: senal }).then((r) => r.json())
  }
/>
```

Eso es todo lo que hay que escribir. **No hay que poner rebote, ni un estado de
«cargando», ni cancelar nada.**

`modo` es **la misma palabra que en `TablaDatos`** y significa lo mismo: en
`servidor` el componente no toca los datos. No inventamos vocabulario nuevo para
una distinción que el sistema ya nombraba.

### Tres cosas que cambian de significado en este modo

| | En `navegador` | En `servidor` |
|---|---|---|
| `opciones` | **Todas**: son las que se filtran | Las **de partida** — lo que se ve antes de teclear. Ahí van las recientes o las frecuentes |
| El filtrado | Lo hace el componente | **No lo hace nadie más que ustedes.** Se pinta lo que devuelva `onBuscar` |
| El campo vacío | Enseña todas | No se pregunta nada: vuelve a las de partida |

**Y el componente no vuelve a filtrar la respuesta.** Si su buscador devuelve un
registro por DNI, por alias o por coincidencia aproximada, se pinta. Filtrar otra
vez aquí escondería justo lo que ustedes devolvieron a propósito, y dejaría al
buscador contradiciéndose sin que nada falle.

---

## Qué se queda el componente, y por qué no ustedes

Se decidió que **el ciclo entero de la consulta es del componente**: el rebote,
la cancelación de la anterior y el descarte de la que llegue fuera de orden.

La alternativa era que `onBuscar` solo avisara y ustedes actualizaran `opciones`.
Se descartó por una razón concreta: **la carrera es un fallo silencioso.**

> Se teclea `ana`. Sale la consulta de `an`, sale la de `ana`. La de `an` tarda
> más y **llega después**. La lista enseña los resultados de `an` mientras el
> campo dice `ana`. Nada falla, nada avisa, y quien lo mire no verá un error:
> verá una lista equivocada.

Escribir eso bien en cada pantalla es escribirlo bien **cada vez**, y lo que hay
que acordarse de hacer es lo que un día no se hace. Es el mismo argumento por el
que MMI-DS §9 acepta ayuda externa justo en este patrón y no en los demás.

Concretamente, el componente hace tres cosas que ustedes ya no tienen que hacer:

| | Cuánto | Desde dónde cuenta |
|---|---|---|
| **Rebote** | 300 ms (ajustable con `rebote`) | Desde la última tecla. Sin él son seis consultas para escribir «Quispe» y cinco se tiran |
| **Umbral del esqueleto** | 300 ms | Desde que la consulta **sale**, no desde la tecla |
| **Cancelación** | — | `AbortSignal` sobre la consulta anterior, en cuanto hay otra |

**Pásenle la señal a `fetch`.** Es el segundo argumento de `onBuscar` y es lo
único que se les pide:

```tsx
onBuscar={(texto, senal) => fetch(url, { signal: senal }).then(r => r.json())}
```

Si no la pasan, el descarte sigue funcionando —la respuesta vieja no pinta— pero
la petición se queda en vuelo consumiendo su servidor para nada.

**Pueden escribir `onBuscar` en línea.** Se lee por referencia viva, así que
cambiar de identidad en cada dibujado no dispara un bucle de peticiones. Era la
trampa clásica de este patrón y está cerrada.

---

## Lo que se ve mientras tanto

**Buscando:** tres renglones de esqueleto —la clase `.esqueleto` que ya viajaba
en el paquete, no una nueva— y el campo con `aria-busy`. **No aparece antes de
300 ms desde que la consulta sale**, porque la tabla «Cargando: esqueleto, giro
o nada» del catálogo lo dice: bajo ese umbral no se enseña nada, *«un parpadeo
se percibe como un fallo»*. Un giro habría sido usar el último recurso como
primero.

**Si la consulta se cae:** una fila que **reintenta**, con el ratón y con Enter.
No es el texto de «sin resultados» reaprovechado, y eso es deliberado: «no hay
resultados» y «no se pudo preguntar» mandan a sitios distintos. Con el primero
se prueba con menos letras; con el segundo **no hay nada que reescribir**, y
decirle a alguien que pruebe otra cosa es mandarlo a dar vueltas. Se personaliza
con `textoFallo`.

Sobre un fallo **no se ofrece «Crear»**: ahí no se sabe si el registro existe o
no, y ofrecer un alta sería invitar a duplicar a alguien.

---

## Un defecto que este modo destapó, y que les afectaba sin saberlo

`elegida` salía de buscar `valor` dentro de `opciones`. Contra el servidor eso se
rompe solo:

> Se elige a Ana. Se teclea otra cosa. La lista se reemplaza por la respuesta
> nueva y **Ana ya no está en ninguna parte**. El campo se queda **en blanco con
> un valor puesto**.

Es la misma familia que el `null` que la firma prometía y no emitía, el que
reportaron ustedes en R103: **el estado interno diciendo una cosa y la pantalla
otra.**

Se arregló **dentro del componente** —recuerda la última opción que casaba con
`valor`— y no pidiéndoles que pasaran el texto por otra prop. Lo que el producto
no puede olvidarse de hacer es lo que no se le pide.

---

## Verificado

| | |
|---|---|
| Candados | **15 en verde**, la lista completa de `CLAUDE.md` §8 |
| Pruebas | **594** en 40 archivos — 13 nuevas para esto |
| Tipos | `tsc --noEmit` limpio |
| Contrato | Cuatro reglas nuevas (17 a 20) en `comportamiento.md`, cada una con su prueba |

**Vistas en rojo**, como exige el §9 —una prueba que no se ha visto fallar no
protege nada—:

| Rotura a propósito | Qué salió |
|---|---|
| Quitar la bandera que cierra la carrera | Pintó «An la vieja»: la respuesta vieja pisó a la nueva |
| Devolver `elegida` a `opciones.find(...)` | El campo salió vacío con el valor puesto |

---

## Dos cosas que anotamos de paso

**El candado de la omisión salió en rojo, y tenía razón.** `.sel-op` no se veía
sin modificador en **ningún** marcado estático del catálogo: todas las filas las
pinta su guion. Ahora hay tres paradas quietas —la fila por omisión, la marcada
por teclado y la elegida con su visto—, que no existían en ninguna versión
anterior. Si alguna vez compararon su lista contra el catálogo y no encontraron
contra qué, era por esto.

**Aviso para quien escriba pruebas en este repositorio:** `vi.useFakeTimers()`
**no funciona con `userEvent`** en la versión de `@testing-library/dom` que
tenemos. Su `jestFakeTimersAreEnabled()` detecta relojes falsos con
`typeof jest !== 'undefined'`, que bajo vitest da **siempre falso**: la librería
toma su camino de relojes reales, espera un `setTimeout(…, 0)` que los relojes
falsos ya no van a disparar, y la prueba se cuelga. Comprobado con un `<button>`
pelado y un solo `click`. Las trece pruebas de R118 nacieron así y se
reescribieron con relojes de verdad.

---

## Pendiente declarado

Tres errores de ESLint **preexistentes**, que no vienen de este cambio y siguen
ahí: `Estados.tsx:67` y `:195` usan el atributo `style`, que el propio candado
prohíbe (§2.5.6), y `Horario.tsx:172` referencia `react-hooks/exhaustive-deps`,
una regla que no está instalada. `npm run lint` no está entre los candados de
§8, así que no bloqueaba la subida — pero un sistema que incumple su propio
candado es algo que hay que cerrar. **No se tocó por estar fuera del alcance de
esta petición.**
