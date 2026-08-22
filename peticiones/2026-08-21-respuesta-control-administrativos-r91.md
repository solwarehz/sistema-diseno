# Respuesta a Control Administrativos V2.0 — R91 · `AjusteHorario` no se exportaba

**Fecha:** 21 de agosto de 2026 · **Resuelto en:** **v1.66.0**
**Instalar:** `npm install "github:solwarehz/sistema-diseno#v1.66.0"`

---

## Tenían razón, y era peor de lo que vieron

Reportaron que `AjusteHorario` no se exportaba y que lo estaban deduciendo del
componente **en vez de meter mano en el paquete**. Correcto, y el fallo era
nuestro: se añadió `onAjuste` en la v1.64.0 —ayer— y su tipo se quedó dentro.

Al mirarlo no era un olvido puntual:

> **42 de 105 exportaciones no llegaban a `componentes/src/index.ts`.**
> Entre ellas, los `Props` de **todos y cada uno** de los componentes.

`BotonProps`, `ChipProps`, `TablaDatosProps`, `HorarioProps`, `CampoProps`,
`AvatarProps`… ninguno salía. Un paquete que obliga a deducir el tipo de una
prop **no ha publicado esa prop**.

**Ya salen las 42.** Si dedujeron algún tipo para no tocar el paquete, ahora lo
pueden importar:

```ts
import { Horario, type AjusteHorario, type HorarioProps } from 'sistema-diseno-ae/componentes';
```

---

## Y el índice deja de depender de acordarse

`verificar-entrega.mjs` falla ahora si un componente exporta algo que no llega
al índice. Lo que no quiera publicarse, que no se exporte del módulo — ahí la
decisión se ve y se revisa. **Un `export` que no llega al índice no es una
decisión, es un olvido.**

Esto importa más que el arreglo, porque es la **tercera vez el mismo día** que
una lista escrita a mano se queda corta sin avisar:

| | La lista | Qué se le escapó |
|---|---|---|
| R87 | Casos del candado de la promesa | El filtro de columna |
| R90 | Los mismos casos | El horario entero |
| **R91** | El índice del paquete | 42 exportaciones |

Las tres tenían la misma forma. Ninguna avisaba de estar incompleta.

---

## Una cosa que conviene que sepan de cómo lo comprobamos

El candado nuevo, en su primera versión, **no cazó nada**. Buscaba el nombre en
todo el texto del índice y se daba por satisfecho al encontrarlo… **en un
comentario** — el que cita `AjusteHorario` para explicar por qué existe el
candado. Se rompió a propósito quitando la exportación, siguió en verde, y hubo
que rehacerlo para que lea los nombres de las cláusulas `export`.

Lo contamos porque es el mismo error que ya había cometido una prueba nuestra
dos días antes: **una prueba que no se ha visto fallar no protege nada**. Aquí
todo lo que se entrega se rompe antes de darlo por bueno.

---

## Verificación

- **Doce candados en verde** · **415 pruebas** · `tsc --noEmit` limpio.
- `105 exportaciones de componente · todas salen por el índice`.
- Nada más cambia: ni una regla de estilo, ni una prop, ni un token.
