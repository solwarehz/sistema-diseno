# Respuesta a Control Administrativos V2.0 — R98 · niveles, móvil y qué pasa al apagar «Ver»

**Fecha:** 23 de agosto de 2026 · **Resuelto en:** **v1.73.0**
**Instalar:** `npm install "github:solwarehz/sistema-diseno#v1.73.0"`

---

## 1 · Niveles por campo — hecho, y no hizo falta inventarlo

El componente que lo resuelve ya existía: **`Segmentado`**, y nació (R69) para
**este caso exacto** y con **este mismo ejemplo** — documento completo
`71602303` contra parcial `*****303`. Lo pidieron ustedes en su momento.

La forma es la suya, en array para que el orden sea estable:

```ts
{ id: 'ver', nombre: 'Ver',
  niveles: [
    { id: 'documento', nombre: 'Documento', opciones: [
        { valor: 'completo', texto: 'Completo', ejemplo: '71602303' },
        { valor: 'parcial',  texto: 'Parcial',  ejemplo: '*****303' },
        { valor: 'oculto',   texto: 'Oculto' },
      ] },
  ] }
```

- **Viven dentro del privilegio**, no del módulo — como decían.
- **Se guardan en el mismo mapa**, bajo la clave `privilegio:nivel`
  (`claveNivel('ver','documento')`). Un solo objeto que persistir.
- **Solo se reparten si el privilegio está concedido**: sin «ver», elegir cuánto
  se ve no significa nada.
- Un nivel que **no aplica** no se pasa. Uno que **no se puede conceder** lleva
  `cerrado` con su motivo — y eso ya estaba en el `Segmentado`, por el caso de
  seguridad que ustedes mismos plantearon: *quien reparte no puede conceder un
  nivel que lo iguale a él*.

**El panel es el dueño de la decisión.** Ya no la tienen suelta por fuera.

---

## 2 · Móvil — verificado a 390 px de viewport real

| | |
|---|---|
| Página desborda en horizontal | **no** |
| Panel, cabecera y segmentado desbordan | **no** |
| Chips de la cabecera a 390 px | se retiran; queda el «4 de 6» |
| Sangrado de los niveles | cae a 0 |
| Alto de la cabecera del módulo | **68 px** de blanco táctil |

**No hay tabla, así que no hay nada que desplazar** — que era su problema.

Una nota de método, porque la primera medida fue **un verde falso**: metimos el
panel en un contenedor de 390 px dentro de una ventana ancha y todo parecía
correcto. Las consultas de medios miden el **viewport**, no el contenedor, así
que no se estaban aplicando. Repetido en un marco con viewport propio, que es
donde salen los números de arriba.

---

## 3 · Qué pasa con los niveles al apagar «Ver» — **se conservan**

Y su motivo es exactamente el que decide: **guardan en cada pulsación, sin botón
de Guardar**. Borrar ahí es irreversible y en el acto.

Hasta la v1.72.0, apagar el privilegio que manda ponía el módulo entero a
`false`. **Ya no.** Es la misma decisión que este sistema tomó con los filtros
de la tabla: *«al plegar la fila, los valores se conservan; plegar es dejar de
ver el control, no dejar de filtrar»*. Aquí, apagar «ver» es dejar de conceder
el módulo, no olvidar cómo estaba repartido.

**Lo que no se conserva es el efecto**, y para eso hay una función nueva:

```ts
guardar(valor);                                   // todo, para no perder el trabajo
enviar(privilegiosEfectivos(MODULOS, valor));     // solo lo que de verdad se aplica
```

Sin `ver`, `privilegiosEfectivos` devuelve el módulo vacío. **Guardar lo
efectivo pierde el trabajo; enviar lo completo concede lo que no se concedió.**
Los dos mapas, cada uno a su sitio.

⚠️ **Esto rompe respecto a la v1.72.0**: si algo suyo esperaba recibir todo en
`false` al apagar «ver», ahora recibe el mapa conservado. La sustitución directa
es `privilegiosEfectivos()`.

---

## Y un defecto nuestro que salió al mirar una captura

En la página del panel del catálogo, **cinco iconos se publicaron como texto
crudo** — la llamada a la plantilla sin resolver, por una barra invertida de más.
Estaba en la v1.72.0, la que anunciamos ayer. **Ningún candado lo veía.**

Corregido, y ahora el generador falla si queda una plantilla sin resolver en el
marcado. Con una lección de propina: la primera versión de esa comprobación daba
**trece falsos positivos** —los ejemplos de código del catálogo llevan
plantillas a propósito—, y un candado con falsos positivos se acaba ignorando
entero.

---

## Lo que anotamos de su mensaje

- **El selector por `children`** se queda como está.
- **No ordenar por estado**: confirmado por los dos lados.
- **Subpermisos**: sus grupos ya cubren el caso de Trabajadores.
- **La quinta regla** —lo modificado se marca— sigue igual, y nos alegra que sea
  justo lo que les faltaba.

## Verificación

- **Trece candados en verde** · **439 pruebas**, 7 nuevas · `tsc --noEmit` limpio.
- Las tres respuestas están **escritas como prueba**: que los niveles solo se
  repartan con el privilegio concedido, que apagar el base conserve, y que
  `privilegiosEfectivos` devuelva el módulo vacío.
