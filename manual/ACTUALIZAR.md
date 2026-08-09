# Actualizar al sistema de diseño v1.10.7

Para el área de sistemas. Si vienes de la **v1.7.0**, que es la que se entregó
en su momento, esto es todo lo que cambia y todo lo que hay que hacer.

---

## 1 · Instalar

```bash
npm install "github:solwarehz/sistema-diseno#v1.10.7"
```

**La etiqueta es obligatoria.** Sin `#v1.10.7` npm instala la rama por omisión,
que no tiene el sistema. Si el comando falla con `404` o `repository not found`,
no es un problema del comando: es acceso al repositorio, que es privado. Pídelo.

Para actualizar más adelante, cambia el número de la etiqueta. **No uses
rangos** (`^1.10.0`): npm no los resuelve en dependencias de GitHub, y creerías
estar en una versión distinta de la real.

Comprueba que quedó lo que esperabas:

```bash
node -p "require('sistema-diseno-ae/package.json').version"   # 1.10.7
```

---

## 2 · Lo primero que cambia para ti: ya no reconstruyes componentes

Hasta la v1.9.0 la entrega llevaba **el estilo** y tú ponías el comportamiento.
Esa es la razón de las 3.983 líneas que costó la tabla. **Desde la v1.10.7
viajan los trece componentes de React**, con el comportamiento dentro.

```jsx
import 'sistema-diseno-ae/tokens.css';       // SIEMPRE primero
import 'sistema-diseno-ae/componentes.css';  // después: depende de las variables

import { TablaDatos, Boton, Chip, Campo, Paginacion } from 'sistema-diseno-ae/componentes';
```

El orden de los dos `import` de CSS no es estilo: `componentes.css` usa las
variables que declara `tokens.css`. Al revés, no hay ningún color definido.

Lo que traen dentro y ya no tienes que escribir:

| Componente | Lo que resuelve por ti |
|---|---|
| `TablaDatos` | Ordenar, filtrar, paginar, plegar la fila de filtros conservando valores, volver a la página 1 al filtrar |
| `RangoFecha` | El calendario entero por teclado, el anuncio del cambio de mes, el foco al abrir y al cerrar |
| `Confirmacion` | La devolución del foco al elemento que la abrió, y el anuncio a lector de pantalla |
| `Horario` | Ejes rotables, 12/24 h y la preferencia recordada |
| `Boton` `Campo` `Chip` `Avatar` `Interruptor` `Paginacion` `Tarjeta` `Enlace` `Estados` | El anillo de foco, los estados, la etiqueta vinculada, el tamaño táctil |

Los archivos viajan como **`.tsx` sin compilar**. Tu empaquetador tiene que
entender TSX —Vite, Next y Webpack con `ts-loader` lo hacen—. Si tu proyecto no
compila TypeScript, usa `componentes.css` y el marcado de `comportamiento.md`.

### Los componentes se componen entre ellos

`TablaDatos` **importa** `Boton`, `Chip`, `Campo` y `Paginacion` en vez de
rehacerlos. Consecuencia para ti: cuando el botón mejore, el de dentro de la
tabla mejora con él. Si estabas parcheando el botón de la tabla por separado,
puedes quitar ese parche.

---

## 3 · El color: qué puedes usar y qué no

Hay **114 colores autorizados** y **9 conocidos pero prohibidos**. La diferencia
importa:

- **Autorizado** — puede vivir en el sistema. Se nombra `familia_paso`:
  `azul_600`, `ambar_900`, `negro_1000`.
- **Conocido y no autorizado** — la familia `marca`. Existe **para poder
  bloquearla**: lo que no tiene nombre no se puede vigilar. Un valor de marca
  fuera de su propia variable **falla el build**.

En un componente **no uses ni el escalón ni el hexadecimal**: usa el **token
semántico**, que es el que está medido contra un fondo concreto.

```jsx
// NO — la primitiva no sabe sobre qué fondo la vas a poner
<div className="bg-[#0063CB]">     <div style={{ background: 'var(--azul_600)' }}>

// SÍ
<div className="bg-accion">        <div style={{ background: 'var(--accion)' }}>
```

Un color escrito a mano en cualquier hoja del proyecto lo caza el candado:

```bash
node node_modules/sistema-diseno-ae/sistema/candado/verificar-color.mjs
```

---

## 4 · Lo que se rompe al subir desde la v1.7.0

Poco, y todo es renombrado:

| Antes | Ahora | Por qué |
|---|---|---|
| `.av-` en el avatar | `.avatar-` | Chocaba con el aviso temporal y heredaba su relleno |
| El interruptor usaba `error-*` | `apagado-fondo` `apagado-borde` `apagado-bolita` | «Apagado» es una elección, no un fallo |
| Sombras sin declarar | Vienen en `componentes.css` | `--sombra-capa` y `--sombra-aviso` no llegaban: la capa flotante salía plana |

Y **una corrección que quizá notes en pantalla**: el aviso temporal ahora lleva
fondo teñido además del filete. Antes era una tarjeta blanca con una raya de
color, que no es lo que la documentación describía.

---

## 5 · Antes de dar por buena la integración

```bash
node node_modules/sistema-diseno-ae/sistema/candado/verificar-contraste.mjs
node node_modules/sistema-diseno-ae/sistema/candado/verificar-color.mjs
npx eslint --config node_modules/sistema-diseno-ae/sistema/candado/candado.eslint.config.mjs .
```

Los tres tienen que salir en cero. **Si el candado de contraste falla, el
candado tiene razón**: no lo desactives, avisa.

> El candado de ESLint **no funcionaba** tal como se distribuyó entre la v1.1.0 y
> la v1.8.0: duplicaba las barras invertidas y siete de sus ocho patrones
> cambiaban de significado. Si lo instalaste en ese periodo, creías estar
> protegido y no lo estabas. **Vuelve a pasarlo ahora**: es probable que
> aparezcan infracciones que llevaban meses ahí.

---

## 6 · Cómo pedir algo que falta

Si necesitas un elemento que no existe, **no lo construyas en tu proyecto**: eso
deja al sistema sin enterarse y al siguiente proyecto reconstruyéndolo. Manda el
requerimiento y se decide si es del sistema o tuyo. Los criterios están en
`sistema/componentes/POLITICA-DE-CREACION.md`, que viaja en la entrega.

Lo que sí es tuyo y el sistema no va a decidir: qué datos muestras, qué permisos
tiene cada rol, y las reglas de negocio de tu pantalla.
