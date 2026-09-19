# R156 · La fila de totales de `TablaDatos` (reactiva R142)

**Componente:** `TablaDatos`
**Versión observada:** 1.131.0
**Proyecto:** Control Administrativos V2.0
**Fecha:** 19/09/2026

## Por qué vuelve

R142 pidió una fila de totales y se mandó como **deseo, no petición**, porque
entonces el dueño dijo que no bloqueaba: *«si la tabla no admite fila de
totales, el PDF que traiga los totales, no nos hagamos problemas»*.

Ha aparecido un caso donde sí estorba. «Historial de contratos» cierra con el
tiempo laborado de la persona, sumando todos sus contratos:

```
Tiempo laborado   1 a 6 m 12 d   (17 meses completos y 42 días)
```

Se colocó dentro del cuadro de la tabla y el dueño lo cortó en cuanto lo vio:

> colocarlo dentro de la tabla pero no como una fila de la tabla es romper el
> componente tabla

Y es exactamente eso: dentro del cuadro **parece** parte de la tabla sin estar
alineado con sus columnas, sin ordenarse y sin paginar con ella. Fuera del
cuadro no rompe nada, pero queda suelto del dato que resume.

## Y no es un caso suelto

El dueño lo dijo al ver la solución provisional: *«si diseño saca o hace la fila
de totales para tabla, sería de gran ayuda, para pagos, y otros datos»*.

Las pantallas del proyecto que hoy la usarían, todas sobre `TablaDatos`:

| Pantalla | Qué cerraría la fila |
|---|---|
| Historial de contratos | el tiempo laborado — el caso de arriba |
| Reporte diario, semanal y mensual | las horas, tardanzas y faltas del periodo |
| Pagos (Izipay, en plan) | el importe cobrado, que es el dato que se cuadra |

En los reportes de asistencia es donde más se nota: **la fila de totales es lo
que permite ver que las filas cuadran sin repasarlas una a una**, y era ya el
argumento de R142. En pagos, un listado de cobros sin el importe sumado obliga
a sacar los datos fuera para cuadrarlos.

## Qué se pide

Una fila de totales que sea **de la tabla**: alineada con sus columnas, fija al
pie, que **no pagine ni se ordene ni se filtre** con las demás.

```tsx
type PropsTablaDatos<T> = {
  // …lo de siempre
  /**
   * Fila de totales, al pie. No entra en el orden, ni en los filtros, ni en la
   * paginación: resume TODAS las filas, no la página que se está viendo.
   * La clave es la de la columna; lo que falte se pinta vacío.
   */
  totales?: Partial<Record<string, React.ReactNode>>;
};
```

Con el caso de arriba:

```tsx
<TablaDatos<Contrato>
  titulo="Contratos"
  sustantivo="contratos"
  filas={filas}
  claveFila={(f) => f.id}
  columnas={columnas}
  totales={{
    trabajador: 'Tiempo laborado',
    tiempo: <b className="font-mono">1 a 6 m 12 d</b>,
  }}
/>
```

## Cómo se comprueba

- La fila queda **al pie de la tabla**, dentro del mismo cuadro y alineada con
  las columnas: «1 a 6 m 12 d» cae bajo la columna «Tiempo», no suelta.
- **Ordenar por cualquier columna no la mueve** de ahí.
- **Con 3 páginas de 10, la fila es la misma en las tres**: resume el total, no
  la página.
- **Filtrar no la recalcula** — la aporta la pantalla, que es quien sabe qué
  suma. El componente solo la pinta.
- Si `totales` no se pasa, la tabla se ve exactamente como hoy.
- Con la columna congelada de R142, la celda de la fila de totales que caiga en
  una columna fija se congela con ella.

## Qué se hace mientras tanto

El total vive en un bloque **debajo** de la tabla, fuera de su cuadro. No rompe
el componente, pero está separado del dato que resume. En cuanto exista
`totales`, se mete ahí y ese bloque desaparece.
