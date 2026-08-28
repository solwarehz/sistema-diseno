# Respuesta a Control Administrativos V2.0 · R104

**De:** el área de diseño (sistema de diseño MMI-DS)
**Sobre:** el catálogo solo enseña la variante con lupa, que es la que NO sale por omisión
**Resuelto en:** v1.81.0 · 27 de agosto de 2026

---

## Lo confirmamos con su misma cuenta

```
class="sel-caja sel-con-lupa"  →  6
class="sel-caja"               →  0
```

Exacto. Y el daño no es estético: **el catálogo no daba forma de comprobar lo
que se entrega.** Ustedes hicieron lo correcto —comparar su pantalla contra la
referencia— y la referencia les mintió por omisión. Una tarde por una demo que
faltaba.

## Lo que se hizo

**Se enseñan las dos, y la de por omisión va primero.** El «Pruébalo» y los
cuatro estados pasan a **sin lupa**, que es lo que se entrega. La variante con
lupa se enseña al lado, etiquetada con su caso: *el buscador de una tabla, la
caja de búsqueda global*.

```
antes:  6 con lupa · 0 sin lupa
ahora:  2 con lupa · 6 sin lupa
```

Las dos que quedan con lupa son la comparación etiquetada y el buscador de la
tabla, que es el caso documentado.

**No se cambió el defecto.** `conLupa = false` es correcto y sale de su propio
reporte (R100). Su cascada de ubigeo sigue exactamente igual.

## Y su regla general es ahora un candado

Esto es lo que hace valiosa su nota. No pidieron un arreglo, pidieron una regla:

> «Si una prop cambia lo que se VE y tiene un valor por omisión, el catálogo
> debería enseñar el valor por omisión.»

Nace **`verificar-omision.mjs`**, el catorceavo. Y **sin lista escrita a mano**:
toda regla de la hoja que exija dos clases en el mismo elemento
—`.sel-caja.sel-con-lupa`— declara un **modificador** sobre una **base**. Si el
catálogo enseña esa base siempre con su modificador y nunca sin él, el estado
por omisión no se puede mirar.

- **80 reglas compuestas** en la hoja, **0 falsos positivos**.
- **Visto en rojo contra el catálogo de ayer**, antes de arreglar nada:
  encuentra exactamente `.sel-caja` sin `.sel-con-lupa`, y nada más.
- Lleva una lista de excepciones —hoy vacía— para bases que de verdad no existen
  solas, y **falla si una excepción sobra**: el día que esa base se enseñe sola,
  hay que quitar su línea. Una lista que nadie poda vuelve a ser el inventario a
  mano de siempre.

## Por qué hacía falta un candado nuevo

Tienen razón en que la comparación catálogo-contra-paquete no lo atrapa, y
conviene decir por qué con precisión:

| Candado | Qué mira | Por qué no lo vio |
|---|---|---|
| `verificar-promesa` | las propiedades de lo que **se pinta** | no había nada pintado que comparar |
| `verificar-elemento` | las etiquetas de lo que **se pinta** | ídem |
| `verificar-empate` | el orden de las reglas que casan sobre lo **pintado** | ídem |

Los tres miran lo pintado. Esto era **una variante que existe en el código y no
se pintaba en ninguna demo**: salían los tres en verde con el defecto delante.
Es la misma familia que el `box-sizing` que no viajaba o el analizador que no se
entregaba — **el defecto vivía donde nadie estaba mirando**.

## Lo suyo, que no tocamos

Su cascada de ubigeo queda como está: los tres selectores con el CSS del
sistema, sin lupa a propósito, y con la búsqueda funcionando. Nos consta por su
prueba con «anca».
