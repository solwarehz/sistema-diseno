# Respuesta a Control Administrativos V2.0 — R95 · el atajo que borraba el color

**Fecha:** 21 de agosto de 2026 · **Resuelto en:** **v1.70.0**
**Instalar:** `npm install "github:solwarehz/sistema-diseno#v1.70.0"`

---

## Su diagnóstico era exacto, hasta la posición de las reglas

```
posición 521   .chip-identidad-1 { border-color: var(--identidad-1) }
posición 541   .chip             { border-left: 3px solid currentcolor }
```

Misma especificidad, gana la última, y **el atajo no solo pone grosor y estilo:
reescribe el color**. Los cuatro tonos salían en `rgb(44,42,37)`. Confirmado en
nuestra hoja línea por línea.

Y su observación de que `.chip-punto.chip-identidad-N` sí funcionaba **por tener
dos clases** es justamente el arreglo:

```css
.chip.chip-identidad-N { border-left-color: var(--identidad-N); }
```

Dos clases ganan siempre a una, y `border-left-color` declara el lado que de
verdad se pinta — con `border-color` a secas volvería a pisarlo el atajo.

**Es la lección de R87 aplicada a nuestro propio código**, dos días después de
escribirla. Se la reportamos a ustedes y la repetimos nosotros.

---

## Lo que encontramos al mirar por qué había pasado

**Los tonos semánticos se salvaban por accidente.** El extractor emite
`.chip-exito` dos veces, y la segunda copia cae **después** de `.chip`. Por eso
el verde, el rojo y el ámbar sí se veían.

Apoyarse en eso no es tener una regla: es tener suerte. Así que **todos** los
tonos de `Chip` y `Mensaje` pasan a ganar por especificidad, no solo los de
identidad.

**Y aparecieron dos defectos que nadie había reportado**, del mismo tipo:

| | Qué pasaba |
|---|---|
| `.chip-pend`, `.chip-inact` | Perdían su `borde-fuerte` y salían con el gris del texto |
| `.app-cascaron` | Pedía `100vh` y recibía los `520px` de `.app` |

El gris de `pendiente` e `inactivo` parecía intencionado. No lo era. **Eso es un
cambio visible en su producto** y va declarado.

---

## El candado que debía cazarlo, y no lo hacía

Lo escribimos en la v1.62.0 después de R87, y **este defecto se le escapó** por
dos motivos:

1. comparaba propiedades **por nombre**, y `border-left` no se parece en nada a
   `border-color`;
2. solo miraba divergencias **entre las dos hojas**, y esto estaba igual de mal
   en las dos.

Ahora expande los atajos a las partes que de verdad se pisan, y añade una regla
dentro de **una misma hoja**:

> Un modificador no puede perder contra su propia clase base.

**Al estrenarla salieron 26 casos y 17 eran ruido.** Se indexaba la *primera*
aparición de cada regla cuando en CSS manda la última; y faltaba descartar los
que declaran el mismo valor —`.btn-ic` repite el `display` de `.btn`— y los que
llevan `!important`, como `.chip-sin-filete`.

Lo decimos porque es una regla que nos aplicamos: **un candado que grita por lo
que funciona se acaba ignorando entero**, y entonces deja de proteger aunque
siga en verde.

---

## Lo que cambia en su pantalla

1. **Los cuatro tonos de identidad del `Chip` ya se pintan** y se distinguen
   entre sí. Comprobado en navegador: 4 colores distintos de 4.
2. **Los chips `pendiente` e `inactivo` cambian**: del gris del texto a
   `borde-fuerte`.
3. Los semánticos y `chip-sin-filete` **no cambian** — pero ahora por regla, no
   por casualidad.

---

## Verificación

- **Trece candados en verde** · **420 pruebas** · `tsc --noEmit` limpio.
- Medido en navegador con la hoja que viaja: los cuatro tonos de identidad, los
  cuatro semánticos, `pendiente`, `inactivo`, `sin-filete` y los dos mensajes.
- La prueba nueva exige **las dos clases y la longhand**, que es exactamente lo
  que impide que esto vuelva.
