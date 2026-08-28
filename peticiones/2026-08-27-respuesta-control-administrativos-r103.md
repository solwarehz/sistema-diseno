# Respuesta a Control Administrativos V2.0 · R103

**De:** el área de diseño (sistema de diseño MMI-DS)
**Sobre:** `SelectorBusqueda` — no se puede vaciar una elección, y dos huecos abiertos
**Resuelto en:** v1.79.0 · 27 de agosto de 2026

---

## Lo primero: tenían razón, y el diagnóstico era mejor que el síntoma

Lo confirmamos en el código antes de tocar nada. `onCambio` solo se invocaba
desde `elegir()`, y `elegir()` siempre pasaba `o.valor`. **El componente nunca
emitía `null`.**

Lo que hace valiosa su nota no es haber encontrado la falta, es cómo la
plantearon: *«o sobra el `| null`, o falta el camino»*. Eso convierte una
petición de función en una **contradicción del contrato**, que es algo que este
sistema no puede dejar vivo. Un tipo que documenta un camino inexistente es peor
que la falta: quien lo lee construye contando con él.

**Falta el camino.** El `| null` se queda y ahora es cierto.

## Lo que se hizo, y una decisión distinta a la que propusieron

Está en la v1.79.0. Tres props nuevas, **las tres apagadas por omisión**, así que
nada de lo que tienen en producción cambia — que era su condición.

### 1 · Vaciar: `vacio`, no `permiteVaciar`

Aquí nos apartamos de su propuesta a propósito, y conviene que sepan por qué.

```jsx
<SelectorBusqueda
  etiqueta="Departamento"
  vacio="Todos los departamentos"   // ← sin esto, no se puede vaciar
  valor={depto}
  onCambio={setDepto}               // ← ahora sí recibe null
  opciones={departamentos}
/>
```

Se resuelve con **el mismo gesto que el `Selector`** —su opción vacía— por dos
razones:

- **El vocabulario ya existe y se llama `vacio`.** Ustedes mismos señalaron que
  `Selector` sí lo permitía con su opción vacía; entonces la respuesta correcta
  no es una prop nueva, es **la misma prop**. Dos nombres para el mismo permiso
  es la manera de que un día se separen.
- **Pedir el texto obliga a nombrar el estado vacío.** «Todos», «Sin asignar» y
  «Cualquiera» no significan lo mismo. Un `permiteVaciar` booleano los aplasta en
  un «— Ninguno —» genérico que no dice qué pasa al elegirlo.

La fila va **la primera**, solo cuando hay algo que vaciar, y **se retira al
escribir**: es un mando, no un resultado. Ofrecer «Todos» mientras se busca
«Ancash» no significa nada, y encima empujaría la primera coincidencia fuera del
sitio donde el dedo ya va.

**El Retroceso que pidieron está** —sobre el campo vacío, y solo con `vacio`
puesto—, pero como **acelerador, no como única puerta**: un gesto que solo existe
en el teclado deja fuera a quien usa el ratón.

### 2 · `etiquetaOculta` — su hueco 16

Cerrado. La tenían `Campo` y `Selector`, faltaba solo aquí, y por eso se estaban
apañando con `Selector` bajo las cabeceras de columna. Oculta la etiqueta **a la
vista, no al lector**, y sigue siendo obligatoria: es la diferencia entre no
mostrarla y no tenerla.

### 3 · «Crear …» dentro del propio selector

```jsx
<SelectorBusqueda
  etiqueta="Apoderado"
  opciones={apoderados}
  valor={id}
  onCambio={setId}
  onCrear={(texto) => abrirAltaDeApoderado(texto)}
/>
```

Recibe **lo tecleado**. La fila de «no hay coincidencias» deja de ser un cartel y
pasa a ser el camino: se activa con el ratón y **con Enter** —sin lista no hay
opción activa que Enter pudiera elegir, así que ahí esa tecla estaba libre—.
**Tab no lo dispara**: salir de un campo no es pedir un alta.

Y **no elige ni limpia** al pulsarlo: el alta es suya y puede tardar o
cancelarse. Cerrar dando por hecho un registro que quizá no ocurre dejaría el
campo en blanco a quien vuelve de cancelar. Lo normal es que abran su alta y,
cuando vuelvan con el registro hecho, lo metan en `opciones` y lo pasen por
`valor`.

## Sobre su cascada de ubigeo

Coincidimos con su lectura: ahí **no hay daño**, porque los tres niveles son
obligatorios y la invalidación en cascada la hace su lógica, no la del selector.
No hace falta que toquen `CascadaUbigeo` por esto. Lo que se desbloquea es lo que
decían: **cualquier campo opcional**.

## Lo único que conviene mirar antes de encender `vacio`

No rompe nada, pero sí cambia lo que puede llegar: si tienen un
`if (valor === null)` colgando de este componente, **esa rama nunca se
ejecutaba**. Ahora puede. Es exactamente lo que pedían, pero mírenla antes.

## Cómo se verificó

- **17 pruebas nuevas** con `R103` en el nombre, y **vistas en rojo a propósito**
  antes de dar por bueno el arreglo: se rompieron las tres conductas en el
  componente y cayeron seis casos; se revirtió y volvieron a verde.
- **482 pruebas** en total, `tsc --noEmit` limpio, **13 candados en verde**.
- Comprobado en el catálogo con el navegador: elegir, reabrir y ver «Todos los
  apoderados» **la primera**, Retroceso vaciando, y `Crear «Huaraz Vega, Ana»`
  apareciendo al escribir un nombre que no existe.

## Lo suyo que no tocamos, y por qué

Las dos últimas de su nota son limpieza de su lado y las dejamos donde están:

- El apaño de `CamposPersona.tsx:320` para el aspecto de deshabilitado — tienen
  razón en que **la regla ya existe en la hoja**, así que el apaño se puede
  retirar. Es su código; nosotros no entramos.
- Los comentarios de `CascadaUbigeo` — su criterio de ajustar solo los que
  hablaban de la opción vacía nos parece el correcto.
