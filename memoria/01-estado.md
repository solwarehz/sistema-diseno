# Estado del proyecto

**Última actualización:** 11 de agosto de 2026
**Versión del sistema:** MMI-DS **v1.45.0** — nace `CargaId`: las dos caras del
documento de identidad con su proporción real; antes, la carga de imagen
centrada con avatar y la tabla ancha que solo desplaza la tabla

> Este archivo se reescribe entero cuando cambia el estado. No se le añaden
> párrafos: un estado con capas es un estado que ya no se lee.
>
> **Y se reescribe SIEMPRE.** Van dos veces que no se hace: se quedó en v1.25.0
> con el repositorio en v1.38.0, y otra vez en v1.39.0 con el repositorio en
> v1.41.3 —tres versiones—. Un registro desfasado se lee como si fuera cierto,
> que es exactamente el defecto que este archivo debía evitar.

---

## Dónde estamos, en una frase

El sistema es un **paquete que un producto instala y consume** —35 funciones de
componente, la hoja que viaja, once candados, 312 pruebas— y el candado de la
promesa ya no mira una lista escrita a mano: **recorre todo lo que el catálogo
pinta**, 832 elementos, y en dos días ha sacado tres defectos que nadie veía.

---

## Qué está hecho y verificado

Cada cifra sale del comando que está al lado. **No se repiten de memoria.**

| Módulo | Estado | Cómo se comprobó |
|---|---|---|
| Motor de tokens | ✅ | `generar.mjs` — 56 semánticos + 5 de marca, claro y oscuro |
| Contrato `paleta.lock.json` | ✅ | Generado desde `fuente.mjs`, nunca a mano |
| Contraste en **los dos modos** | ✅ | `verificar-contraste` · 178 pares · 138 bloqueantes · **0 fallos** |
| Candado de lint | ✅ | `probar-candado` en Docker |
| Componentes de React | ✅ | **312 pruebas en 21 archivos** · `tsc --noEmit` limpio |
| La hoja que viaja | ✅ | `extraer.mjs` · 725 reglas de 1210 · **529 clases, 0 huérfanas** |
| Catálogo navegable | ✅ | `cascaron/index.html` · 50 páginas · lo genera `generar-cascaron.mjs` |
| Iconografía | ✅ | 45 trazos en `iconos.mjs`, React real |
| Entrega ZIP | ✅ | `sistema-diseno-v1.45.0.zip` · 44 archivos |
| Modo oscuro | ✅ | Aprobado 2026-08-09 · marco en escala de negros |
| Compresor de PDF propio | ✅ | Sin dependencias · **y desde hoy con su `.d.mts`** |

### Lo que cambió desde la v1.39.0

| Versión | Qué |
|---|---|
| v1.40.0 | `CargaPdf` cabe en un formulario: botón fuera, panel que empuja, borrador que confirma al Grabar |
| v1.40.1 | El botón fija su propio `line-height` — el CSV salía más alto en la entrega |
| v1.41.0 | El reset `box-sizing` por fin viaja, y **nace el candado promesa-vs-entrega** |
| v1.41.1 | El botón declara su propio `display` — sin `.btn-ic` el icono y el texto se apilaban |
| v1.41.2 | La tira de filtros de la tabla se entregaba vacía |
| v1.41.3 | R47 · el panel flotante del menú plegado cerraba en seco |
| v1.42.0 | **R48** · el menú seguía comprimido y sacaba a la vez las opciones de extendido · el candado de la promesa pasa a recorrer todo el marcado |
| v1.43.0 | **R49** · con la tabla ancha se desplazaba el componente entero, mandos incluidos |
| v1.44.0 | **R50** · la carga de imagen se centra, y sin foto de una persona el hueco lo ocupa su avatar |
| **v1.45.0** | **R51** · nace `CargaId` — las dos caras del documento de identidad, con el mismo editor de encuadre |

### Lo de hoy, con detalle

**R51 · `CargaId`.** Las dos caras del documento de identidad, encuadradas con
**su proporción real** y entregadas en WebP. El guion es el que se pidió: botón
«Subir ID» → diálogo → **anverso** → Grabar → el **mismo** diálogo pide el
reverso → Grabar → se cierra. Las miniaturas quedan al costado, el botón se
desactiva, y pulsar una miniatura la abre en grande.

La proporción no es un número elegido: el documento es una tarjeta **ID-1**
(ISO/IEC 7810), **85,60 × 53,98 mm** = 1,5858:1. El marco mide 428×270 px
(1,5852:1) y una prueba comprueba que no se aleja más de una milésima.

**Antes de escribirlo se extrajo el editor.** El lienzo, el arrastre, el zoom,
las flechas, el acotado y la salida en WebP vivían dentro de `CargaImagen`.
Copiarlos habría dado dos editores parecidos —el día que uno arregle el
acotado, el otro se queda con el defecto—, así que ahora hay **uno solo**:
`interno/EditorEncuadre`. Las 13 pruebas de `CargaImagen` pasaron **sin tocar
ni una**: esa es la comprobación de que la extracción no cambió nada.

Volver a subir **se autoriza desde atrás**: con las dos caras el botón se
cierra, y solo vuelve cuando el producto baja `bloqueado` porque su back se lo
dijo. Hasta grabar el reverso el anverso es un **borrador** y no se avisa.

Medido en el navegador, el guion entero: diálogo con el anverso primero, lienzo
428×270 (1,5852), tras grabar sigue abierto pidiendo el reverso, al grabarlo se
cierra con **2 miniaturas de 76×48**, el botón **desactivado**, el visor abre y
al cerrarlo **el foco vuelve a la miniatura pulsada**.

Dos candados en rojo por el camino, los dos con razón: **la entrega**, porque
meter la página nueva corrió los índices del menú y tiró «Panel de la barra»
fuera de su tramo —una página publicada que dejaba de verse—; y **la cascada**,
porque `.btn` declara su `display` desde v1.41.1 y sin `.btn[hidden]` un
`<Boton hidden>` se seguía viendo. Las dos correcciones viajan.

**R50 · la carga de imagen.** Dos cosas. La columna **se centra sobre su caja**
—estaba en `flex-start` y el rótulo, la vista previa y el botón miden cada uno
una cosa: salía una escalera—. Y **sin foto pero con persona detrás, el hueco lo
ocupa el `Avatar` de esa persona**: «Sin foto» no dice nada que no se sepa, y
las iniciales con su color dicen **de quién** es el hueco. Es el mismo `Avatar`
del sistema, compuesto y no rehecho, así que la ficha, la tabla y esta carga
pintan a la misma persona igual. Se activa con la prop `persona` y **solo con
`formato="foto"`**. En cuanto llega la foto, la foto manda.

El catálogo estrena la tarjeta con el avatar en la misma fila de muestras, así
que el estado **se puede ver** y el candado de la promesa lo compara como a
cualquier otro elemento. Medido en el navegador: las cinco tarjetas con
desviación **0px** entre el eje del rótulo, el de la caja y el del botón.

Dos candados salieron en rojo por el camino y los dos tenían razón: el auditor,
porque 36px y 52px no son pasos de la escala (§3.4) —van 34 y 56—; y el de la
promesa, porque `.ci-avatar` y `.avatar-xl` pesan lo mismo y ganaba la que cada
hoja pusiera después. **Es el mismo defecto que `.us-menu` ayer**: se resolvió
con el antepasado delante, `.ci-caja .ci-avatar`, que gana en las dos hojas se
ordenen como se ordenen.

**R49 · la tabla ancha.** `.tb-envoltura` es el deslizador —lleva el
`overflow-x`— y en el componente envolvía el árbol **entero**: arrastrar a la
derecha se llevaba el buscador, el «Mostrar», el recuento, Filtros, Columnas,
CSV, el rango y la paginación. El catálogo nunca lo hizo así: allí la barra, la
envoltura y el pie son hermanos. Ahora el componente emite `.tb-bloque` y
`.tb-envoltura` envuelve **la tabla y nada más**; la cabecera va dentro a
propósito, porque columnas y datos tienen que moverse juntos.

Medido con la hoja que viaja —tabla de 1145px en una caja de 650—: al desplazar
400px, cabecera y celdas se mueven **−400** y la barra, el pie y la paginación
se mueven **0**. El catálogo, medido igual, hace lo mismo.

**Ningún candado podía verlo**: el de la promesa resuelve la cascada sobre el
marcado del catálogo y no mira el árbol que emite el componente. Lo fijan tres
pruebas del componente, vistas en rojo con la estructura vieja.

**R48.** Reportado a 900px: «está el menú comprimido, pero el botón de expandir
se muestra; al dar clic sigue comprimido pero se ven las opciones de extendido».
Reproducido en el navegador con la hoja que viaja: la lateral seguía en 56px con
su clase de plegada y **los cuatro paneles flotantes** encima del contenido.

La causa: el clic re-sincronizaba la apertura de los grupos con el valor
**pedido**. Sin control de fuera da igual —pedir es aplicar—, pero **controlado**
(R21) manda el producto: si no devuelve el valor nuevo, el carril sigue plegado
y los grupos se abrían igual. Y plegado, un grupo abierto **es** un panel
flotante. No hace falta que el producto se equivoque: guardar la preferencia en
el perfil —lo que el sistema recomienda— hace que el valor vuelva tarde.

**Y la promesa no enseñaba ese ancho.** R38a movió el riel de ≤900 al componente
y el catálogo se quedó sin él. Medido antes de tocar nada, a 900px: catálogo
desplegado a 236px, entrega plegada a 56px. Ahora el catálogo lleva las dos
bandas, su botón gana el `aria-expanded` que nunca tuvo, y plegar pasa por un
solo sitio.

**El candado de la promesa deja de mirar una lista a mano.** El marco no tenía
ni un caso, y eso es lo que pasa con una lista que alguien escribe: vigila lo
que alguien se acordó de mirar. Ahora **se recorre el marcado del catálogo** y
se compara cada elemento que pinta, con su cadena de antepasados real —
**832 elementos · 171.025 propiedades resueltas a cinco anchos**, más 29 estados
fijados a mano que el marcado no tiene abiertos (la lateral plegada, su panel
flotante, el velo). Se dice además cuántos elementos se saltan por ser
mobiliario de la página, para que el verde no se lea como lo que no es.

En su primera pasada completa **sacó un defecto que la lista a mano no veía**:
`PanelBarra` emite `us-menu` y `pb-panel`, pesan igual, y gana la que va
después — en el catálogo `.us-menu`, en la entrega `.pb-panel`—, así que el
panel de notificaciones salía en el producto con 320px de ancho mínimo y otro
relleno del que se enseñaba. Las dos declaraciones muertas se retiraron.

Y se le vio en rojo a propósito: bajando el relleno del botón de 16px a 15px,
36 elementos en rojo.

**El compresor de PDF ya viaja con tipos.** `componentes/src/interno/comprimir-pdf.d.mts`.
Sin él, un producto que compile sin `allowJs` se caía con **TS7016** desde
nuestro propio `index.ts`, sin usar el compresor. Reproducido con un `tsconfig`
de consumidor: dos errores sin la declaración, cero con ella.

---

## Los once candados

Se pasan **todos** antes de subir a `main`. Ninguna versión sube con uno en rojo.

| Candado | Qué impide | Se ha visto en rojo |
|---|---|---|
| `verificar-contraste` | Que el contrato mienta sobre un par | ✅ |
| `verificar-color` | Un hexadecimal, `rgb()` o `hsl()` suelto | ✅ |
| `auditar-cascaron` | Estilo en línea, marcado fuera de norma y duraciones a mano | ✅ |
| `probar-candado` | Que las reglas de ESLint no hagan nada | ✅ |
| `verificar-contrato` | Una regla obligatoria sin prueba que la nombre | ✅ |
| `verificar-entrega` | Que el catálogo enseñe lo que no viaja, y al revés | ✅ |
| huérfanas (en `extraer.mjs`) | Clase emitida sin regla | ✅ |
| `verificar-cascada` | Lo que NO se escribió, a once anchos | ✅ |
| `verificar-promesa` | Que lo entregado no se vea como lo enseñado | ✅ |
| ESLint | El atributo `style`, el hex crudo, `outline:none` | ✅ el mismo día: cazó una comilla invertida que rompía el generador |
| `tsc --noEmit` | Tipos | ✅ |

---

## Números verificados

No los repitas de memoria: **regenéralos**.

```
Versión                      1.45.0
Tokens semánticos                56   + 5 de marca
Pares de contraste              178   (138 bloqueantes, 0 fallos en ambos modos)
Pruebas                         312   en 21 archivos
Reglas que viajan               707   de 1192 · 516 clases, 0 huérfanas
Candado de la promesa           832   elementos · 171.025 propiedades
                                      a 5 anchos (1440, 1024, 900, 700, 390)
                                      + 29 estados fijados a mano
Iconos                           45
Páginas del catálogo             49
```

```powershell
docker compose exec ds node sistema/candado/verificar-contraste.mjs
docker compose exec ds sh -c "cd componentes && npm run probar"
```

---

## Lo que NO está hecho — declarado

| Qué | Por qué |
|---|---|
| **El marco abre TODOS los grupos al desplegar; el catálogo abre solo el de la página** | Divergencia medida hoy y **no resuelta**: son dos modelos de navegación distintos, los dos escritos y defendidos. Decidirlo cambia el menú de todos los productos o la documentación: **es del responsable** |
| **El candado de la promesa compara CSS, no comportamiento** | Y es el hueco que queda abierto. R38, R42, R47 y R48 fueron **comportamiento** —qué se abre, qué se cierra, qué se pliega—, y ahí no hay nada que compare el catálogo con el componente: lo único que los caza son las pruebas del componente, que sólo miran un lado. Cerrarlo pide ejecutar las dos superficies en un navegador y comparar estados; **eso necesita un navegador sin cabeza en el contenedor, y eso es autorización del responsable** |
| **Lo que el catálogo no pinta, no se compara** | Los 29 estados fijados a mano existen por eso. Un estado nuevo que nadie fije ni el catálogo enseñe, no lo mira nadie |
| Compresión de imágenes que no sean JPEG | El compresor solo toca `/DCTDecode` |
| El compresor en Node no toca imágenes | Necesita `canvas`; lo de imágenes se verificó en el navegador |
| Fuentes incrustadas | No se tocan. Es el otro gran peso de un PDF |
| Los seis `--ambito-alt-*` | Aplazado por el responsable del producto (2026-08-10) |
| R8, R14–R17 | Marcados `PENDIENTE` en `comportamiento.md` |
| Selección múltiple y encabezado fijo en la tabla | Declarado en manual §10 |
| Escudo suelto e isotipo simplificado | **Trabajo de diseñador, no de código** |
| ESLint: 2 errores en `Estados.tsx` (46 y 149) | `style=` dinámico de esqueleto y progreso; la decisión **es del responsable** y sigue sin tomarse |

---

## Repositorio

- **`solwarehz/sistema-diseno`** · privado · https://github.com/solwarehz/sistema-diseno
- En esta máquina (Windows) se trabaja en `main` directo, **únicamente con los
  once candados y las pruebas en verde**. Es de donde instala el área de
  sistemas: un `main` roto es un proyecto ajeno roto.
- Nunca `--force`. Nunca `checkout` ni `stash` sobre el árbol compartido.
- `.gitattributes` fija LF; los binarios de diseño no suben.
- Notas de esta máquina: `LEVANTAR-EN-WINDOWS.md`.
