# Respuesta a Control Administrativos V2.0 — R89 · sombreado fraccionado y descarte silencioso

**Fecha:** 21 de agosto de 2026 · **Resuelto en:** **v1.64.0**
**Instalar:** `npm install "github:solwarehz/sistema-diseno#v1.64.0"`

---

## Resumen

**Las dos cosas, hechas.** El sombreado fraccionado entra, y el descarte deja de
ser silencioso. La tabla, los `th scope` y los `rowSpan`/`colSpan` se quedan
**exactamente como estaban**, que era su condición.

Y una corrección importante a su diagnóstico, en el §2: **no era un descarte.
Era algo peor.**

---

## 1 · El sombreado, en cuartos de franja

Un bloque de **13:30 a 15:00** con paso de 60 se pinta como **media celda de las
13:00 más la de las 14:00 entera**. Exactamente lo que dibujaron en el pedido.

Se cuenta en **cuartos** —25 %, 50 %, 75 %—, que es la resolución que ustedes
mismos pidieron. Su frase *«el sombreado NO tiene que ser exacto, el rótulo ya
lo es»* es la que hizo viable esto: bajó el listón lo justo para que se pueda
hacer sin `style` en línea, sin píxeles y sin tocar la tabla.

**Cómo, por si les sirve el patrón:** la celda se llena con una pila flexible de
hasta tres piezas —hueco, bloque, hueco— y cada una crece según su número de
cuartos. Así el reparto no necesita saber cuántas celdas abarca el `rowSpan`.

**El bloque sigue en el flujo, y es deliberado.** Sacarlo con
`position: absolute` habría dejado la fila sin nada que la empuje y el texto se
saldría de una celda de 32 px.

### Lo que no es exacto, con su número

**Donde tocaría un 37,5 % sale un 35,5 %.** El bloque **nunca se comprime por
debajo de su texto**, así que cuando el contenido pesa, el reparto cede.

Es la decisión correcta: cortar el título para cuadrar un sombreado sería
cambiar un dato por un adorno. Y es justo la razón de que el rótulo lleve la
hora exacta — su propio argumento, aplicado.

---

## 2 · Una corrección a su diagnóstico: no había descarte, había desplazamiento

Escriben que *«para que un bloque se dibuje, el paso tiene que dividir sus
horas»*. Sondeamos el motor con el componente real antes de tocar nada, y lo que
pasaba era **peor**:

| Bloque, paso 60 | Qué hacía la v1.63.0 |
|---|---|
| `07:45 – 09:00` | **Se dibujaba en la fila de las 08:00** |
| `13:30 – 15:00` (su ejemplo) | **Se dibujaba de 14:00 a 16:00** |
| `07:25 – 07:50` | Desaparecía |
| `06:00 – 07:00`, día 5 | Desaparecían |
| Dos bloques a la misma hora | **Ganaba el segundo**; el primero desaparecía |
| `08:00–10:00` + `09:00–10:00` | Solo se veía el largo |

**No es que no se vieran: es que se veían en una hora que no era**, con el
rótulo correcto al lado. Un bloque de las 07:45 aparecía a las 08:00 diciendo
«07:45 – 09:00».

Eran **cuatro silencios distintos**, no uno. Ahora:

- el bloque **se ancla a la franja donde cae su inicio**, no a la más cercana;
- **en un solapamiento gana el primero** (era el último) y el otro se anuncia;
- lo más corto que medio paso **ya se dibuja**, en cuartos.

---

## 3 · `onAjuste` — el descarte se dice

```ts
<Horario … onAjuste={(avisos) => registrar(avisos)} />
```

| Motivo | Cuándo |
|---|---|
| `fuera-de-rango` | Empieza o acaba fuera de la ventana del horario |
| `dia-inexistente` | Apunta a un día que no está en `dias` |
| `duracion-nula` | Dura menos de un cuarto de franja |
| `sin-sitio` | Se solapa con otro ya colocado |
| `span-largo` | Abarca más de seis franjas: se pinta a celda entera |

Cada aviso trae el bloque y una frase lista para un registro.

**Por qué importaba tanto:** una celda vacía es un estado normal en una rejilla,
así que un bloque que desaparece **no deja hueco visible**. Nadie lo echa en
falta hasta que alguien pregunta por qué no sale su clase.

**Y el propio tope se dice.** El sombreado llega hasta seis franjas de span; por
encima, celda entera **y aviso**. Un límite que no se anuncia es otro descarte
silencioso, y no íbamos a arreglar el defecto introduciéndolo de nuevo.

---

## 4 · Lo que se descartó, y por qué

Se valoró `style` en línea con variables CSS de geometría, que habría dado el
fraccionado **exacto al minuto** y sin tope de span. Se descartó: relaja la
regla que prohíbe el `style` en línea para toda una superficie, y el candado
dejaría de proteger algo que hoy protege entero. **Los cuartos bastan para lo
que pidieron**, y lo pidieron ustedes así.

---

## 5 · Lo que cambia en pantallas ya montadas

Esto **sí se ve**, y conviene que lo revisen una vez:

1. **Los bloques desalineados cambian de sitio** — a donde de verdad les toca.
2. **En un solapamiento ahora gana el primero.** Si algún horario dependía sin
   saberlo de que ganara el último, verá el otro bloque.
3. **Bloques que antes desaparecían ahora aparecen** (los más cortos que medio
   paso). Si su pantalla parecía correcta, puede que empiece a mostrar cosas que
   siempre estuvieron en los datos.

**Y una consecuencia que ustedes vieron y conviene aprovechar:** con esto la
rejilla puede subir a **franjas más gruesas** sin perder precisión. Nos hicieron
notar un horario donde la mañana ocupa siete filas y quedan dieciséis vacías —
eso ya no obliga a nada: el paso lo eligen por legibilidad, no por el turno más
fino que exista.

---

## Verificación

- **Doce candados en verde** · **415 pruebas**, 11 nuevas · `tsc --noEmit` limpio.
- Nueve reglas nuevas de contrato, ocho obligatorias.
- Los casos de la tabla del §2 quedan **como prueba**, incluidos los que antes
  fallaban en silencio.
- Comprobado en navegador con turnos reales a las 07:45, 07:15 y 13:30: la
  rejilla se queda en sus filas y el sombreado cae donde debe.
