# R143 · Solo hay CUATRO colores de chip, y hacen falta cinco

> **Llegó por el chat, no como archivo.** Se archiva aquí porque una cita sin
> fuente archivada se lee como si la tuviera — es la lección del R119, que
> tampoco llegó como archivo y quedó solo transcrito en el contrato.
> Transcripción literal del mensaje del 16 de septiembre de 2026.

**Para:** equipo del sistema de diseño
**De:** Control Administrativos V2.0 — módulo de Marcaciones
**Fecha:** 2026-09-16
**Comprobado contra:** `sistema-diseno-ae` **v1.120.0 instalada**, **midiendo en el navegador**.
**Prioridad: media.**

---

## Qué pasa

El registro diario clasifica cada fila con hasta cinco estados, y **ninguno
puede repetir color** porque una misma fila lleva varios a la vez:

```
Puntual · Tardanza · S. Anticipada · Incompleta · Falta
```

El sistema publica **diez** tonos de `Chip`. Para separar estados sirven
**cuatro**. Medido en el navegador, luminancia del fondo:

| tono | fondo | luminancia |
|---|---|---|
| `exito` | `#E3F4E1` | 239 |
| `aviso` | `#FFEBD6` | 238 |
| `error` | `#FFE6DF` | 235 |
| `info` | `#E9EEFF` | 238 |
| `pendiente` | `#F0EFEE` | **239** ← el mismo claro que `info` |
| `inactivo` | `#E0DFDE` | 223 |

- **`pendiente` e `info` no se distinguen.** Lo vio el dueño en pantalla antes
  de que nosotros lo midiéramos: *«Tardanza y S. Anticipada veo el mismo color
  yo»*.
- **Los cuatro `identidad-N` tampoco sirven:** comparten el **mismo fondo**
  (`--fondo-encabezado`); solo cambia un borde lateral de 1 px.

```css
.chip.chip-identidad-1{ background: var(--fondo-encabezado); …
  border-left-color: var(--identidad-1); }
```

## Cómo lo rodeamos

`inactivo` para «S. Anticipada». Es el único quinto que se ve — 16 puntos más
oscuro que el resto.

## 🔴 Lo que tiene de malo

**Gris se lee como «no aplica»**, y salir antes de hora **sí descuenta tiempo
trabajado**. Estamos pintando de gris una infracción laboral.

Funciona como distinción visual y comunica lo contrario de lo que es.

## Qué pedimos

**Un quinto tono semántico con color propio.** Nos da igual cuál —violeta,
turquesa, lo que encaje en la paleta—. Lo que necesitamos es:

- que sea **un color y no un gris**;
- con el **mismo contraste verificado** que los otros cuatro;
- distinguible de `info`, que es el más cercano en claro.

---

## Atendido en la v1.123.0 — y la decisión, para que conste

**No entra ningún color nuevo, y lo decidió el responsable** con estas palabras:
*«tenemos 5 estados, pedí que cada uno sea diferente, pero se puede usar un
color ya definido?, para qué crear otro color»*.

El diagnóstico de fondo resultó ser otro y más grave que el reportado: **cinco de
los diez tonos pintaban el mismo relleno**, no cuatro — `chip-pend` también sale
en `fondo-encabezado`, a **0,0** de distancia perceptual de los cuatro de
identidad. El defecto no era que faltara un color: era que **el chip no usaba los
que ya tenía**.

La corrección del dato reportado: el filete es de **3 px**, no de 1.
