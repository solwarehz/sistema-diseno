# Sistema de diseño v1.10.7 — actualización disponible

Colegio Albert Einstein · 9 de agosto de 2026

---

Hola.

Sale una actualización del sistema de diseño y esta vez cambia bastante para
ustedes. Va todo lo que necesitan para pasar de la v1.7.0 a esta.

## 1 · Instalación

```bash
npm install "github:solwarehz/sistema-diseno#v1.10.7"
```

La etiqueta es **obligatoria**. Sin `#v1.10.7` npm instala la rama por omisión,
que no tiene el sistema. Si sale `404` o `repository not found`, no es el
comando: es acceso al repositorio, que es privado — pídanmelo.

No usen rangos (`^1.10.0`): npm no los resuelve en dependencias de GitHub y
creerían estar en una versión distinta de la real.

Comprueben que quedó lo que esperaban:

```bash
node -p "require('sistema-diseno-ae/package.json').version"   # 1.10.7
```

## 2 · Lo principal: ya no reconstruyen componentes

Hasta ahora la entrega llevaba **el estilo** y ustedes ponían el comportamiento.
Esa es la razón de las 3.983 líneas que les costó la tabla para consumir 1.464.
**Ahora viajan los trece componentes de React, con el comportamiento dentro.**

```jsx
import 'sistema-diseno-ae/tokens.css';       // SIEMPRE primero
import 'sistema-diseno-ae/componentes.css';  // después: usa esas variables

import { TablaDatos, Boton, Chip, Campo, Paginacion } from 'sistema-diseno-ae/componentes';
```

El orden de los dos `import` no es estilo: `componentes.css` usa las variables
que declara `tokens.css`. Al revés, no hay ningún color definido.

| Componente | Lo que ya no escriben ustedes |
|---|---|
| `TablaDatos` | Ordenar, filtrar, paginar, plegar la fila de filtros conservando los valores, volver a la página 1 al filtrar |
| `RangoFecha` | El calendario completo por teclado, el anuncio del cambio de mes, el foco al abrir y al cerrar |
| `Confirmacion` | La devolución del foco al elemento que la abrió y el anuncio a lector de pantalla |
| `Horario` | Ejes rotables, 12/24 h y la preferencia recordada |
| `Boton` `Campo` `Chip` `Avatar` `Interruptor` `Paginacion` `Tarjeta` `Enlace` `Estados` | Anillo de foco, estados, etiqueta vinculada, tamaño táctil |

Los archivos viajan como **`.tsx` sin compilar**. Su empaquetador tiene que
entender TSX — Vite, Next y Webpack con `ts-loader` lo hacen. Si su proyecto no
compila TypeScript, usen `componentes.css` con el marcado de
`comportamiento.md`.

**Los componentes se componen entre ellos.** `TablaDatos` **importa** `Boton`,
`Chip`, `Campo` y `Paginacion` en vez de rehacerlos. Consecuencia práctica:
cuando el botón mejore, el de dentro de la tabla mejora con él. Si tenían un
parche para el botón de la tabla, pueden quitarlo.

## 3 · El color: qué pueden usar y qué no

Hay **114 colores autorizados** y **9 conocidos pero prohibidos**.

- **Autorizado** — puede vivir en el sistema. Se nombra `familia_paso`:
  `azul_600`, `ambar_900`, `negro_1000`.
- **Conocido y no autorizado** — la familia `marca`. Está nombrada **para poder
  bloquearla**: lo que no tiene nombre no se puede vigilar. Un valor de marca
  fuera de su propia variable **falla el build**.

Dentro de un componente **no usen ni el escalón ni el hexadecimal**: usen el
**token semántico**, que es el que está medido contra un fondo concreto.

```jsx
// NO — la primitiva no sabe sobre qué fondo la van a poner
<div className="bg-[#0063CB]">

// SÍ
<div className="bg-accion">
```

## 4 · Lo que se rompe al subir desde la v1.7.0

Poco, y todo es renombrado:

| Antes | Ahora | Por qué |
|---|---|---|
| `.av-` en el avatar | `.avatar-` | Chocaba con el aviso temporal y heredaba su relleno |
| El interruptor usaba `error-*` | `apagado-fondo` `apagado-borde` `apagado-bolita` | «Apagado» es una elección del usuario, no un fallo |
| `--sombra-capa` y `--sombra-aviso` sin declarar | Vienen en `componentes.css` | No llegaban: la capa flotante y el menú salían planos |

Y una corrección que notarán en pantalla: **el aviso temporal ahora lleva fondo
teñido además del filete.** Antes era una tarjeta blanca con una raya de color,
que no era lo que la documentación describía.

## 5 · Un aviso que les conviene leer

El candado de ESLint **no funcionaba** tal como se distribuyó entre la v1.1.0 y
la v1.8.0: duplicaba las barras invertidas al incrustar los patrones, y siete de
los ocho cambiaban de significado mientras el octavo hacía reventar a ESLint.

Si lo instalaron en ese periodo, **creían estar protegidos y no lo estaban.**
Vuélvanlo a pasar ahora: es probable que aparezcan infracciones que llevaban
meses ahí. No es un reproche — el fallo era nuestro y ustedes lo reportaron.

## 6 · Antes de dar por buena la integración

Los tres tienen que salir en cero:

```bash
node node_modules/sistema-diseno-ae/sistema/candado/verificar-contraste.mjs
node node_modules/sistema-diseno-ae/sistema/candado/verificar-color.mjs
npx eslint --config node_modules/sistema-diseno-ae/sistema/candado/candado.eslint.config.mjs .
```

**Si el candado de contraste falla, el candado tiene razón.** No lo desactiven:
avísenme.

## 7 · Si necesitan algo que no existe

**No lo construyan en su proyecto.** Eso deja al sistema sin enterarse y al
siguiente proyecto reconstruyéndolo. Manden el requerimiento y se decide si es
del sistema o de ustedes.

Los criterios están en `sistema/componentes/POLITICA-DE-CREACION.md`, que viaja
en la entrega. Lo que sí es suyo y el sistema no va a decidir: qué datos
muestran, qué permisos tiene cada rol y las reglas de negocio de su pantalla.

---

El detalle completo está en `manual/ACTUALIZAR.md`, dentro del paquete.
Cualquier duda, aquí estoy.
