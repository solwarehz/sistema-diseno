# SPEC 01 — Horario: detalle del bloque en negrita

> **Estado:** Approved
> **Depende de:** ninguna (el «SPEC 12» del requerimiento es del equipo consumidor, no de este repositorio)
> **Fecha:** 2026-10-30
> **Objetivo:** Que el `detalle` de cada bloque de `Horario` se pinte en negrita por omisión, con `detalleEnfasis={false}` para volver al peso normal.

## Por qué existe esta spec

Requerimiento **R163** (numerado por el equipo, no acuñado aquí), prioridad baja, comprobado por el equipo contra v1.148.2. En un contrato híbrido, el rótulo «Remoto» es lo único que distingue un tramo sin reloj de uno presencial, y hoy pesa igual que el rango horario. Al acortarlo de «Remoto · no marca reloj» a «Remoto» para no ensanchar la rejilla, perdió peso visual; la negrita se lo devuelve sin costar ancho.

Estado actual verificado en el repositorio:

- `componentes/src/Horario.tsx:315-316` pinta `<b>{pz.b.titulo}</b>` y `{pz.b.detalle && <span>{pz.b.detalle}</span>}`.
- `BloqueHorario.detalle?: string` (`Horario.tsx:21`).
- `sistema/componentes/componentes.css:737-738`: `.hor-b b` es `600` / `13px`; `.hor-b span` es `12px` sin peso (normal).

## Alcance

**Dentro:**

- El `detalle` del bloque se pinta con `font-weight: 600` por omisión.
- Nueva propiedad opcional `detalleEnfasis?: boolean` en `BloqueHorario`, con valor por omisión `true`. Con `false`, el detalle conserva el peso normal de hoy.
- El tamaño del detalle se mantiene en 12px; el título sigue en 13px.
- Pruebas del componente, actualización del catálogo y del contrato de comportamiento.
- Subida de versión a **v1.148.3** y la entrega de `memoria/01-estado.md`.

**Fuera de alcance:**

- Colores, tonos y sombreado por cuartos.
- El título, el rango y la lógica de solapes.
- Cambiar el tamaño del detalle o introducir pesos fuera de los cuatro permitidos (§3.2).
- Otros campos de texto de `Horario` (avisos, cabeceras de día).
- Verificación en `devgestion`: la hace el equipo consumidor una vez publicada la versión.

## Modelo de datos

Cambia un solo tipo:

```ts
export type BloqueHorario = {
  // …campos actuales sin cambios…
  detalle?: string;
  /** Peso del detalle. `true` (por omisión) = negrita; `false` = peso normal. */
  detalleEnfasis?: boolean;
};
```

Convenciones:

- La clase modificadora la emite el componente solo cuando `detalleEnfasis === false` (el caso minoritario), de modo que el CSS base ya lleva la negrita y la omisión del catálogo coincide con lo que se entrega.
- El detalle y el rango son ambos `<span>` y hoy comparten la regla `.hor-b span` (`componentes.css:738`). La negrita **no** puede ir en esa regla, o el rango también quedaría en negrita. Va en `.hor-b span:not(.hor-rango)`, que no obliga a tocar el marcado del detalle por omisión ni los bloques escritos a mano en `generar-cascaron.mjs`.

## Plan de implementación

0. Requisitos previos, que no son parte del cambio: la rama de trabajo es una `feat/*` según `CLAUDE.md` §8 del repositorio (por ejemplo `feat/2026-10-30-horario-detalle-negrita`, no `spec-01-...`) y se crea **antes** de la primera edición; y las dependencias están instaladas **dentro del contenedor** (el volumen `node_modules` estaba vacío el 2026-10-30; el procedimiento está en `memoria/03-al-clonar.md`). Sin ellas no corren `esbuild`, Vitest ni ESLint.
1. Con la rama ya creada, escribir las pruebas nuevas en `componentes/pruebas/Horario.test.tsx` (detalle en negrita por omisión; `detalleEnfasis={false}` lo quita; bloque sin detalle no cambia) y verlas fallar.
2. En `sistema/componentes/componentes.css`, añadir `font-weight: 600` con el selector `.hor-b span:not(.hor-rango)` y una regla modificadora para `detalleEnfasis={false}` que devuelva `font-weight: 400`, con especificidad suficiente para ganarle. Sin hex ni tamaños arbitrarios, y sin tocar `.hor-rango`.
3. En `componentes/src/Horario.tsx`, añadir `detalleEnfasis` al tipo y emitir la clase modificadora en el `<span>` del detalle cuando sea `false`. Las pruebas del paso 1 pasan.
4. Mostrar en el catálogo (`/diseño`, vía `sistema/cascaron/generar-cascaron.mjs`) un bloque con detalle en negrita y otro con `detalleEnfasis={false}`. Los bloques existentes ya enseñan la omisión (negrita) sin cambios de marcado.
5. Registrar el cambio en `sistema/componentes/comportamiento.md` y la regla de contrato correspondiente si el candado `verificar-contrato` lo exige.
6. Subir `VERSION` a 1.148.3 y reescribir `memoria/01-estado.md` y el número de estado de `CLAUDE.md`.
7. Correr los veinticinco pasos de la sección 8 de `CLAUDE.md` en verde, más las pruebas.

## Criterios de aceptación

- [ ] Un bloque con `detalle: 'Remoto'` y sin `detalleEnfasis` renderiza el detalle con peso computado 600.
- [ ] Un bloque con `detalleEnfasis: false` renderiza el detalle con peso computado 400, igual que en v1.148.2.
- [ ] Un bloque sin `detalle` produce el mismo marcado que en v1.148.2.
- [ ] El título (`<b>`) sigue en 600/13px y el rango (`.hor-rango`) conserva su peso y tamaño de v1.148.2.
- [ ] En un navegador, con «Remoto» en negrita, las siete columnas de una rejilla de muestra mantienen el mismo ancho que antes del cambio (medido, no mirado).
- [ ] A 360 px de ancho el detalle no se corta ni obliga a deslizar en horizontal.
- [ ] Los colores, tonos y clases `hor-d1…hor-d24` no cambian; los pares de contraste del candado siguen en verde.
- [ ] Los veinticinco pasos de `CLAUDE.md` §8 salen en verde, incluidos `verificar-promesa`, `verificar-omision` y `verificar-forma`.
- [ ] Las pruebas nuevas se vieron fallar antes de la implementación (paso 1).

## Decisiones tomadas y descartadas

- **Sí:** negrita por omisión **y** propiedad para desactivarla. Decisión del responsable el 2026-10-30. Cubre el caso real sin romper a quien necesite el peso normal.
- **No:** solo negrita fija (lo que el equipo prefería). El responsable eligió conservar una salida.
- **No:** solo propiedad con valor por omisión `false`. Obligaría a todos los consumidores a activarla y el catálogo enseñaría una omisión distinta de la que se entrega con el caso real.
- **Sí:** peso 600 y tamaño 12px. Reutiliza el peso ya presente en el bloque; el título se distingue por tamaño (13px). Decisión del responsable el 2026-10-30.
- **No:** peso 500. Habría que comprobar que sea uno de los cuatro permitidos y distinguible del 400.
- **Sí:** v1.148.3 para este cambio.
- **Sí:** selector `.hor-b span:not(.hor-rango)` para la negrita. Es lo único que separa el detalle del rango sin tocar el marcado; la clase solo aparece en el caso minoritario (`detalleEnfasis={false}`).
- **No:** clase fija `hor-det` en todo detalle. Obligaría a cambiar el marcado a mano del catálogo y a pasar de nuevo los candados de elemento y atributo por un beneficio que el selector ya da.
- **Sí:** rama `feat/*` y no `spec-01-...`. `CLAUDE.md` §8 del repositorio manda sobre el nombre por omisión de `/spec-impl`. La convención `feat/<fecha>-<tema>` es solo un ejemplo: la §19.1 que la fija vive en el manual general del VPS, fuera del repo, y no se cita como norma de este proyecto.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| La negrita ensancha las columnas y rompe la rejilla, que fue la razón de acortar el rótulo | Criterio de aceptación medido en navegador con siete columnas; «Remoto» es una palabra corta |
| Añadir una prop pública bajo una versión de parche | Es aditiva y retrocompatible en tipos; solo cambia el aspecto por omisión. Si el responsable prefiere honrar la convención, subir a v1.149.0 |
| Los consumidores que usen `detalle` con texto largo verán más peso | Pueden fijar `detalleEnfasis={false}`; se anuncia en las notas de la versión |
| Los candados de omisión, promesa o forma detectan el cambio de aspecto por omisión | Es un cambio de aspecto declarado: se actualiza la declaración en el mismo commit, no se desactiva el candado |
| `verificar-forma` marca el campo nuevo `detalleEnfasis` en `BloqueHorario` (no comprobado al escribir esta spec) | Si lo marca, se declara el cambio de forma como aditivo en el mismo commit; no se silencia |
| El selector con `:not()` empata o pierde frente a otra regla de `.hor-b span` | Se mide con `verificar-empate` y `verificar-promesa`, y con el peso computado en los criterios 1 y 2 |
| Dependencias sin instalar: los pasos 2 en adelante no se pueden verificar | El paso 0 las exige antes de empezar; si no se instalan, la tarea se detiene y se avisa |

## Lo que **no** está en esta spec

- Cambios de color, tono o sombreado.
- Cambios al título, al rango o a los solapes.
- Nuevos pesos o tamaños de letra.
- Verificación en `devgestion` y publicación (`npm run publicar`): son pasos posteriores.
