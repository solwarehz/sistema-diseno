# Respuesta a Control Administrativos V2.0 — R92 · el candado de ESLint no leía TypeScript

**Fecha:** 21 de agosto de 2026 · **Resuelto en:** **v1.67.0**
**Instalar:** `npm install "github:solwarehz/sistema-diseno#v1.67.0"`

---

## Antes de nada: lo de `AjusteHorario` ya estaba resuelto

Lo reportaron dos veces y con razón las dos. Salió en la **v1.66.0**, publicada
poco antes de su mensaje. Al arreglarlo apareció que no era un olvido puntual:
**42 de 105 exportaciones** no llegaban al índice, incluidos los `Props` de
todos los componentes. Ya salen todas, y el índice **deja de depender de
acordarse** — `verificar-entrega` falla si un componente exporta algo que no
llega allí.

```ts
import { Horario, type AjusteHorario, type HorarioProps } from 'sistema-diseno-ae/componentes';
```

Pueden retirar la deducción del tipo.

---

## Y el candado: tenían razón, y era más ancho de lo que vieron

Lo reprodujimos montando el candado **a solas**, tal como lo documenta su propia
cabecera:

```
1:15  error  Parsing error: Unexpected token AjusteHorario
```

**No es que no parsee `import { type X }`: es que no parseaba nada de
TypeScript.** El candado no traía analizador, así que ESLint moría en el
análisis **antes de llegar a ninguna regla del sistema**. Su `import` es solo
donde lo notaron; habría muerto igual con la primera anotación de tipo. Por eso
les fallaba también en `app/contratos/page.tsx`, que no habían tocado.

### La parte incómoda

El `eslint.config.mjs` de **nuestro propio repositorio** lleva el analizador
desde hace versiones, con este comentario al lado:

> *«Sin él, ESLint no sabe leer `.tsx` y falla con "Parsing error" ANTES de
> llegar a las reglas del candado.»*

**Sabíamos el problema, lo resolvimos para nosotros y entregamos el candado sin
él**, documentando el uso que no funciona. Es exactamente el mismo defecto que
el reset `box-sizing` que no viajaba: lo que el sistema usa y no entrega, lo
sufre quien lo instala. Es la segunda vez que nos lo encuentran ustedes.

---

## Qué cambia

Ahora esto basta, que es lo que la documentación prometía:

```js
import candado from 'sistema-diseno-ae/eslint';
export default [ ...candado ];
```

- El analizador se carga con `await import`. **Si no tienen
  `typescript-eslint`, el candado no revienta**: sigue cubriendo el JavaScript y
  **avisa por consola** con qué instalar. Queda declarado como peer opcional.
- Los archivos de declaración (`.d.ts`, `.d.mts`) quedan fuera: no llevan color
  y solo producían ruido.

**Si tenían el candado apagado o con excepciones por este fallo, ya pueden
quitarlas.**

---

## La prueba que faltaba

`probar-con-eslint.sh` gana un tercer paso: **el candado a solas, sobre un
`.tsx` con sintaxis de TypeScript, no puede morir en el análisis**. Se probó
desarmando el candado y viéndolo en rojo antes de verlo en verde.

Se probaba a solas **a propósito**: el hueco estaba justo ahí, en que la config
del repositorio sí traía el analizador y tapaba el fallo de lo entregado.

**Y de paso, el paso 1 de ese script estaba roto.** Exigía cero infracciones de
ESLint cuando hay **dos declaradas como deuda** en `Estados.tsx` — los `style=`
del esqueleto y la barra de progreso, pendientes de decisión. Así que fallaba
siempre, y **una prueba que falla siempre nadie la corre**: llevaba versiones
sin ejecutarse por eso. Ahora tolera exactamente esa deuda y falla con cualquier
otra.

---

## Y gracias por el detalle de la integración

Que retirasen su apaño —redondear el bloque a su celda— y que ahora un 07:25 se
dibuje y se rotule 07:25 es justo lo que R89 buscaba. Y haber enganchado
`onAjuste` para que lo no dibujable salga escrito en pantalla en vez de
desaparecer es **mejor uso del que teníamos previsto**: nosotros lo pensamos
para un registro, ustedes lo pusieron delante del usuario. Lo anotamos como el
patrón recomendado.

---

## Verificación

- **Doce candados en verde** · **415 pruebas** · `tsc --noEmit` limpio.
- `probar-con-eslint.sh`: los tres pasos en verde, el tercero visto en rojo antes.
- Nada más cambia: ni una regla de estilo, ni una prop, ni un token.
