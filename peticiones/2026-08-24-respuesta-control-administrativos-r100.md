# Respuesta a Control Administrativos V2.0 — R100 · el selector con búsqueda se veía distinto

**Fecha:** 24 de agosto de 2026 · **Resuelto en:** **v1.75.0**
**Instalar:** `npm install "github:solwarehz/sistema-diseno#v1.75.0"`

---

## Era la primera de sus tres hipótesis, y acertaron

*«Es un problema de estilo del propio `SelectorBusqueda`, no de que sea nativo.»*
Exacto. Y gracias por descartar la causa fácil antes de escribirnos: saber que
ya estaban usando el componente del sistema nos ahorró buscar donde no era.

## Lo que medimos

Montamos los dos, uno al lado del otro, y comparamos **propiedad a propiedad**
con el motor del navegador:

| | Selector | SelectorBusqueda |
|---|---|---|
| Alto | 32,7 px | **32,7 px** |
| Ancho | 300 px | **300 px** |
| **Sangrado del texto** | **8 px** | **32 px** ← |

Nueve propiedades diferían. **Ocho son intrínsecas del `<select>` nativo** —su
flecha como imagen de fondo, el ajuste de línea, el recorte— y ni se pueden
igualar ni tendría sentido intentarlo.

**La única que se ve es el sangrado**, y la causa es la lupa. En una columna de
formulario, ese campo empezaba el texto bastante más a la derecha que todos los
demás. Eso es lo que notaban.

## Lo que cambia

**La lupa pasa a ser opcional, y por omisión no está.**

```tsx
<SelectorBusqueda etiqueta="Reporta a" … />              // como un Selector
<SelectorBusqueda etiqueta="Buscar" conLupa … />         // buscador de verdad
```

**No se retira del sistema**, porque en el buscador de una tabla es correcta:
allí se *busca*, no se *elige*. Lo que no encajaba era darla por supuesta —
elegir de una lista es el mismo gesto en los dos componentes, y que uno además
filtre escribiendo es un detalle de interacción, no otra clase de campo.

**El chevron sigue siendo obligatorio**: es lo que dice «esto se despliega» y lo
que iguala los dos controles.

Y el sangrado se separó de la clase base: `input.campo.sel-in` ya no declara
`padding-left`; lo declara `.sel-caja.sel-con-lupa`. **Quien no pide lupa no lo
paga.**

⚠️ **Qué revisar de su lado:** si en alguna pantalla esperaban ver la lupa, hay
que pedirla con `conLupa`. El buscador de `TablaDatos` la pide por su cuenta y
**no cambia**.

## Verificación

- Medido antes y después en navegador: el `padding-left` **desaparece de la
  lista de diferencias**; quedan las siete intrínsecas del `<select>`.
- **Trece candados en verde** · **451 pruebas**, 4 nuevas · `tsc` limpio.
- Cuatro reglas nuevas de contrato, tres obligatorias.
- Una prueba antigua afirmaba que la lupa iba siempre. Actualizada: ahora fija lo
  contrario —chevron siempre, lupa solo si se pide—, que es la decisión nueva.
