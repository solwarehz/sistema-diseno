# Respuesta a Control Administrativos V2.0 — R88 · colores de identidad en `Horario` y `Chip`

**Fecha:** 21 de agosto de 2026 · **Resuelto en:** **v1.63.0**
**Instalar:** `npm install "github:solwarehz/sistema-diseno#v1.63.0"`

---

## Resumen

**Aceptado.** Es cambiar una línea en su lado, como decían: la constante que
lista los tonos. Con una condición, que va abajo.

Tenían razón en todo el diagnóstico, incluido el argumento que lo sostiene:
usar `error` como color decorativo **gasta el rojo**. Es literalmente lo que
este sistema defiende en la `Nota`, y no lo habíamos aplicado a nuestra propia
paleta.

```ts
tono?: 'info' | 'exito' | 'aviso' | 'error' | 'oro' | 'neutro'
     | 'identidad-1' | 'identidad-2' | 'identidad-3' | 'identidad-4';   // Horario

tono?: 'exito' | 'aviso' | 'error' | 'info' | 'pendiente' | 'inactivo'
     | 'identidad-1' | 'identidad-2' | 'identidad-3' | 'identidad-4';   // Chip
```

---

## Su pregunta sobre el modo oscuro, contestada con el número

Preguntaron si el contraste sobre una celda de horario es el mismo que sobre un
círculo de avatar, y pidieron saberlo en vez de que se ajustara en silencio.

**Es el mismo, y da igual el modo.** Los cuatro pares estaban ya medidos:

| Par | Ratio | Mínimo |
|---|---|---|
| `identidad-texto` sobre `identidad-1` | **6,04:1** | 4,5 |
| `identidad-texto` sobre `identidad-2` | **7,41:1** | 4,5 |
| `identidad-texto` sobre `identidad-3` | **6,47:1** | 4,5 |
| `identidad-texto` sobre `identidad-4` | **7,52:1** | 4,5 |

Idénticos en claro y en oscuro, **y la razón importa**: el par es texto blanco
sobre un color pleno, no un color sobre el fondo de la página. El modo no entra
en la cuenta. Los cuatro tonos valen el mismo hexadecimal en los dos temas, por
la misma decisión que tomó el marco en su día.

---

## Lo único donde no les hicimos caso: el color no va en el fondo

Pidieron `background: var(--identidad-N)` con texto blanco — que es como se ve
el avatar. **Montamos las tres formas con la rejilla real y bloques de estado
mezclados**, que es como se verá de verdad, y la medimos:

| Forma | Contraste | Qué pasó |
|---|---|---|
| Fondo macizo, texto blanco | 6,05–7,53:1 ✅ | Se lee rapidísimo, **pero cuatro cajas macizas decorativas pesan más que un bloque de `error` en rojo tenue**. La alarma queda por debajo del adorno |
| Título en el color | 5,27–6,55:1 ✅ | Aquí el **texto** de color ya significa estado. Un título verde se lee como «bien» |
| **Filete de 6 px, fondo neutro** | 12,48:1 ✅ | **Elegido** |

El primero es su propio argumento del revés: en vez de gastar el rojo, **lo
tapa**. Si el bloque «Sin docente» pesa menos que el de una sede normal, la
señal se pierde igual.

**Por qué 6 px y no 3:** los tonos de estado llevan 3. El grosor distinto es
**en sí la señal** de que esto es otra dimensión y no un estado más. En el
`Chip` el filete se queda en 3 px, y es deliberado: un chip dice su grupo en el
texto y no compite con ninguna alarma en la misma línea; 6 px en una ficha de
22 px de alto la desequilibran.

Está en el catálogo, en la página de Horario, con la rejilla montada y el bloque
rojo al lado para que se vea la comparación.

---

## La condición que se compra con esto

El token tenía escrito que **«nunca informa, agrupa ni filtra»**. Su caso es
justo agrupar, y el argumento es bueno, así que se reescribió la regla en vez de
dejarla contradicha:

- **Agrupar, sí** — una sede, un turno, un responsable.
- **Informar, no** — el color **no puede ser el único medio** (SC 1.4.1). Lo
  agrupado va **también en texto** dentro de la pieza, y una **leyenda** dice
  qué es cada color. **Sin las dos cosas, no se usa.**
- **Filtrar, no** — no son un valor: no se ordena ni se criba por ellos.

No es burocracia: cuatro colores sin leyenda son cuatro adornos, y quien no
distinga dos de ellos —o no vea color— se queda sin el dato.

**La pieza de leyenda ya existía y no la habían visto:** `chip-punto` con el
tono de identidad.

```html
<span class="chip chip-punto chip-identidad-1"></span> Sede Centro
```

---

## Lo demás que preguntaron

**«Cuatro bastan».** De acuerdo, y no es una concesión: son cuatro porque es lo
que la paleta de estado deja libre. Cada uno queda a 30° o más del tono de
estado más cercano, salvo pizarra, que va al 17 % de saturación. Está escrito
como regla — si alguien pide un quinto, la respuesta ya está razonada.

**«El reparto lo hacemos nosotros».** Correcto, y `colorIdentidad(id)` sigue
exportada. Queda como regla del proyecto: para sedes con nombre, seguramente
quieran un orden fijo en vez del hash.

---

## Verificación

- **Doce candados en verde** · **404 pruebas**, 6 nuevas · `tsc --noEmit` limpio.
- Seis reglas nuevas de contrato en `comportamiento.md`, cuatro obligatorias.
- La decisión de diseño está **escrita como prueba**: si alguien cambia el
  filete por un fondo macizo, sale en rojo. (Y esa prueba se rompió a propósito
  hasta verla fallar: la primera versión no lo cazaba.)
