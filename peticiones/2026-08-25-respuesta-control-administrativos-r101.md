# Respuesta a Control Administrativos V2.0 — R101 · orden inicial y columna que identifica la fila

**Fecha:** 25 de agosto de 2026 · **Resuelto en:** **v1.76.0**
**Instalar:** `npm install "github:solwarehz/sistema-diseno#v1.76.0"`

---

## Lo que pedían, hecho — y las dos cosas van por omisión

**1 · La tabla arranca ordenada.** Por la primera columna ordenable,
ascendente. Antes empezaba sin orden, así que lo que se veía era el **orden de
llegada de la consulta**, que para quien mira la pantalla no es ningún orden:
dos cargas de los mismos datos se ven distintas y nadie sabe por dónde buscar.

El comparador ya era correcto y no hubo que tocarlo: `localeCompare` en español
con `numeric`, así que **la Ñ cae entre la N y la O** y «zapata» en minúscula no
se va al final.

**2 · La primera columna no se puede ocultar.** `columnasFijas` existía desde la
v1.25.0, pero su valor por omisión era «ninguna» — se podían ocultar **todas** y
quedarse con una tabla de filas en blanco.

```tsx
<TablaDatos … />                              // ordena por la 1.ª y la protege
<TablaDatos … ordenInicial={null} />          // sin orden, como antes
<TablaDatos … ordenInicial={{ clave: 'fecha', dir: 'desc' }} />
<TablaDatos … columnasFijas={[]} />           // renunciar, diciéndolo
```

---

## Y un defecto que encontramos al mirarlo, que no habían reportado

**La casilla de la columna fija se podía desmarcar, y no pasaba nada.** La
columna seguía ahí porque la lógica la reponía siempre. Es un control que
miente: quien lo pulsa ve que su acción no tiene efecto y no sabe por qué.

El código lo justificaba con un argumento bueno —*«no se confía en deshabilitar
el control: un `disabled` se quita desde el inspector»*— pero planteaba una
falsa disyuntiva. **Ahora se hacen las dos cosas**: la casilla va deshabilitada,
que evita el gesto inútil, y la columna se repone igual, que protege el dato.

De paso, `SeleccionMultiple` gana `deshabilitada` en sus opciones — sirve para
cualquier grupo con una opción que no es negociable.

---

## `modo="servidor"`: ahí no se impone orden, y es deliberado

En servidor la tabla **no ordena** —ordenaría solo la página recibida, que es el
defecto que ustedes midieron en su día—. Pintar la flecha sin que el backend
haya ordenado sería mentir. Si su consulta ya viene ordenada, decláren­lo con
`ordenInicial` y la cabecera lo refleja.

---

## ⚠️ Dos cambios visibles que conviene revisar

1. **Las tablas que no declaraban orden ahora arrancan ordenadas.** Si alguna
   dependía del orden de llegada de la consulta —una lista de auditoría por
   fecha de inserción, por ejemplo—, pásenle `ordenInicial={null}`.
2. **La primera columna deja de poder ocultarse.** Si en alguna pantalla eso era
   intencionado, `columnasFijas={[]}`.

## Verificación

- **Trece candados en verde** · **460 pruebas**, 9 nuevas · `tsc` limpio.
- El orden en español está **escrito como prueba** con un caso que lo distingue:
  `Álvarez · Bustamante · Ñuñez · zapata`.
- Tres reglas nuevas de contrato, las tres obligatorias.
