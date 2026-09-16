# R139 · `RangoFecha` no es controlado — no se puede limitar el rango

**Para:** equipo del sistema de diseño
**De:** Control Administrativos V2.0 — módulo de Marcaciones
**Fecha:** 2026-09-16
**Comprobado contra:** `sistema-diseno-ae` **v1.120.0 instalada**, leyendo el paquete.
**Prioridad: alta.** No bloquea, pero obliga a dejar elegir algo que luego se rechaza.

> **Llegó por el chat, no como archivo.** Se transcribe entero aquí porque el
> registro `R###` es del equipo que pide y una cita sin fuente archivada se lee
> como si la tuviera — es la lección del R119, que también llegó así.

---

## Qué pasa

`RangoFecha` guarda su rango en estado **interno**:

```tsx
// componentes/src/RangoFecha.tsx:130-131
const [desde, setDesde] = useState<string | null>(desdeProp);
const [hasta, setHasta] = useState<string | null>(hastaProp);
```

`desde` y `hasta` son **valores iniciales, no una atadura**. El producto no
puede mover el rango después de montar el componente: devolverle por `onCambio`
un rango corregido no lo mueve.

## Por qué nos importa

El **reporte semanal de asistencia** existe por el tope de **48 horas**, que es
**semanal** (Constitución, art. 25). Sobre nueve días ese tope no significa
nada, así que la columna que justifica el reporte se apaga sola.

Quisimos que el periodo no pudiera pasar de siete días, y **por las buenas**:
al elegir «Desde», colocar «Hasta» seis días después, para que siempre midiera
una semana y nadie tuviera que contar días con el dedo.

**El componente lo ignora.** Nos quedamos en avisar *después* de que el usuario
ya eligió mal:

> ⚠️ Máximo 7 días: el tope de 48 h es semanal. Has elegido 14.

Funciona, pero es peor producto: el calendario deja elegir catorce días y luego
el formulario los rechaza.

## Qué pedimos

Cualquiera de las dos. **Con una nos vale.**

1. **`RangoFecha` controlado** — que `desde`/`hasta` manden siempre, como en
   cualquier campo controlado de React. Es lo general.

2. **`maxDias?: number`** — que el propio calendario apague los días fuera de
   alcance desde el primer clic:

   ```tsx
   <RangoFecha titulo="Rango de fechas" maxDias={7} primerDia={1} … />
   ```

   Resuelve nuestro caso mejor: el error deja de existir en vez de mostrarse.

## Qué haremos cuando llegue

Retirar la validación de la pantalla y el comentario que la explica. El aviso
pasa de avisar a impedir, y el usuario no llega nunca a elegir un rango que no
se puede consultar.

---

## Nota del sistema de diseño, al archivarlo

**Es el tercer hueco anotado del mismo componente.** Los otros dos, que el mismo
equipo trae anotados: **no tiene `error`** y **no tiene forma de
deshabilitarse**. Los tres son el mismo hueco de fondo: `RangoFecha` es el único
campo del sistema que no se comporta como un campo.

**Lo de la falta de control está verificado aquí**, leyendo el componente:
`useState(desdeProp)` usa la prop **solo como valor inicial**. No es «poco
controlado»: es **no controlado**.

**El tope de 48 horas semanales se transcribe como ellos lo dan**, con su cita
legal. El sistema de diseño no verifica normativa laboral; lo que sí verifica es
que hoy no hay forma de imponer un tope, y eso es cierto.
