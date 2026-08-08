# Respuesta a los requerimientos de Control de Asistencia

**De:** mantenimiento del sistema de diseño · MMI-DS
**Para:** área de sistemas · proyecto Control de Asistencia
**Fecha:** 2026-08-08 · **Sistema:** v1.6.0

---

## Resumen

Los cuatro puntos están bien planteados. **Tres se aceptan enteros** y **uno se
acepta partido**, porque mezcla algo que es del sistema con algo que es vuestro.

Dos premisas del documento hay que corregirlas, y una cambia la respuesta.

| | Petición | Veredicto |
|---|---|---|
| 1 | Iconografía | **Del sistema.** Aceptado entero. Es deuda nuestra |
| 2 | Estado de fallo de pantalla | **Del sistema.** Aceptado como estado **séptimo**, no como el que falta |
| 3 | Avatar de persona | **Del sistema** salvo el origen de la foto. Necesita tokens nuevos |
| 4 | Conmutador de densidad | **Partido.** El control es nuestro; dónde vive y dónde se guarda, vuestro |

**No estáis bloqueados en el punto 4:** los tokens ya existen en el preset que
tenéis (`fila-comoda: 34px`, `fila-compacta: 28px`). Podéis construir contra
ellos hoy y sustituir el control cuando lo publiquemos.

---

## 1 · Iconografía — del sistema, aceptado entero

**Vuestras mediciones sobre el emoji son correctas** y coinciden con lo que el
propio documento MMI-DS ya reportaba: no heredan color, no se alinean y cambian
según el sistema operativo. No hay discusión.

### Lo que hay que corregir de la premisa

El conjunto **no está sin implementar**. Existen **24 iconos**, dibujados sobre
retícula de 24×24 con trazo de 1,5px, que heredan `currentColor` y se usan en las
36 páginas del catálogo. Lo que decía «sin implementar» era nuestra tabla de
estado, que estaba desactualizada. Eso es culpa nuestra y ya está corregido.

Lo que de verdad falta es lo que pedís en los puntos segundo y tercero: **la
entrega como módulo consumible, la tabla de tamaños y la regla de significado.**

### Y algo que encontramos al verificar vuestra petición

Auditando para responderos, el catálogo usa hoy **seis tamaños de icono
distintos sin ninguna regla**: 13, 14, 15, 16, 18 y 32px. Tres de ellos —13, 14 y
15— **ni siquiera están en la rejilla de 4**.

Es decir: teníais razón por un motivo más grave del que planteabais. No es que
falte documentar la regla; es que **no había regla**. Gracias por el empujón.

### Qué define el sistema

- El conjunto entero como **un archivo consumible**, sin dependencia externa.
- La **tabla de tamaños por sitio** —en botón, en tabla, en aviso, en menú—,
  reducida a los pasos de la rejilla. Los tamaños fuera de rejilla desaparecen.
- La **regla de significado**, que es la que pedís y va cerrada:

| Caso | Qué se hace |
|---|---|
| Icono **junto a texto visible** | `aria-hidden="true"`. El texto ya lo nombra; con las dos cosas el lector lo dice dos veces |
| Icono **solo, dentro de un control** | El **control** lleva `aria-label`. El icono sigue oculto |
| Icono que **aporta información que no está en el texto** | No vale solo el icono. Necesita equivalente en texto: SC 1.4.1 |

### Qué decide vuestro proyecto

Qué icono usáis para cada concepto de vuestras pantallas.

**Con un límite:** si necesitáis un icono que no está en el conjunto, **no lo
dibujéis en local**. Pedidlo y entra en el sistema. Si cada proyecto dibuja el
suyo, en seis meses hay tres iconos distintos de «asistencia» en la misma
institución, y eso es exactamente lo que el sistema existe para evitar.

---

## 2 · Estado de fallo — del sistema, y es el séptimo, no el que falta

### Lo que hay que corregir de la premisa

El catálogo **no cubre tres estados: cubre seis.**

| Estado | Cuándo |
|---|---|
| Cargando | La petición está en marcha |
| Nunca consultado | Aún no se ha pedido nada |
| Sin resultados | Se buscó y no hubo coincidencias |
| Primera vez | No hay datos porque no se ha creado ninguno |
| **Error** | **La petición falló** → acción «Reintentar» |
| Sin permiso | La persona no puede ver esto |

Merece la pena que los reviséis los seis: la página **«Las tres parejas que se
confunden»** existe justo porque «sin resultados» y «primera vez» se tratan como
si fueran lo mismo, y no lo son.

### Pero vuestra petición sigue siendo válida

Lo que pedís —**fallo de dibujado**— no es el «Error» que ya existe. Son cosas
distintas y confundirlas da una pantalla que miente:

| | Error | Fallo de dibujado |
|---|---|---|
| Qué pasó | La petición falló | El componente reventó al pintarse |
| Queda pantalla | Sí. El error se muestra **dentro** del área de contenido | No. **No hay área** donde pintar |
| Qué se ofrece | **Reintentar** la petición | **Recargar**. Reintentar el mismo dibujado repite el fallo |

Ese es el motivo de fondo: ofrecer «Reintentar» tras un fallo de dibujado es
ofrecer un botón que vuelve a fallar. **Se acepta como estado séptimo.**

### Qué define el sistema

- La composición, el tono y qué se ofrece: **recargar la pantalla**, **volver al
  inicio** y un **código de referencia** corto y copiable.
- La regla de qué **no** se dice: ni traza, ni nombre de excepción, ni ruta, ni
  nombre de servicio. A quien lo lee no le sirve y a quien no debería verlo, sí.

### Qué decide vuestro proyecto

- Cómo se genera el código de referencia y **dónde se registra la traza**. El
  código sin registro detrás es decorativo.
- **La granularidad del límite de error.** Recomendación: por región de pantalla,
  no una sola para toda la aplicación. Con una sola, un panel roto deja la
  pantalla entera en blanco cuando el resto funcionaba.

---

## 3 · Avatar — del sistema, y necesita tokens nuevos

Aceptado, y ya estaba reconocido como deuda nuestra: el catálogo lo tiene
implementado **de tres formas distintas y en cuatro tamaños** —30, 36, 42 y
48px—, uno de ellos fuera de la rejilla de 4. Es el mismo defecto que ya nos
costó tener dos paginaciones.

### Colores sin foto — la parte que hay que decidir bien

Preguntáis si uno o varios. **Varios**, porque en una tabla de treinta personas
un color único hace que el avatar deje de ayudar a distinguir, que es su trabajo.

Pero hay una trampa que conviene decir en voz alta: **no se pueden reutilizar los
colores que ya tenemos.** Los tonos del chip —verde, ámbar, rojo— significan
algo en este sistema. Un avatar rojo diría «esta persona tiene un problema» sin
que nadie lo haya dicho. Sería pintar un estado donde solo hay una identidad.

Por eso el sistema **añade una paleta de identidad propia**, que no significa
nada, con estas condiciones:

1. Colores que **no coinciden** con ningún tono de estado.
2. Las iniciales **cumplen 4,5:1 sobre todos** ellos, verificado en los dos modos
   y en el contrato, como cualquier otro par.
3. La asignación es **determinista y por identificador estable**, no por nombre:
   un cambio de apellido no debe cambiarle el color a nadie.
4. El color **no se usa nunca para filtrar, agrupar ni informar**. Es ayuda de
   reconocimiento, nada más.

Esto implica **versión nueva del sistema** (§2.5 regla 8: cualquier cambio de
color la exige). Es el punto de los cuatro con más plazo, por eso lo arrancamos
en paralelo y no al final.

### Forma, tamaños y foto — del sistema

- **Círculo**, y una escala corta de tamaños por sitio, toda en rejilla de 4.
- Con foto: proporción **1:1** y recorte centrado. Nunca deformada.
- **Si la imagen no carga, vuelve a las iniciales.** Sin marco roto y sin hueco.

### Qué decide vuestro proyecto

De dónde salen las fotos, dónde se guardan y con qué caducidad.

**Y una advertencia que no es de diseño.** Este es un colegio: buena parte de las
personas retratadas son **menores de edad**. Si el avatar va a mostrar fotos de
estudiantes, esa **no es una decisión de interfaz** y no la resolvemos nosotros
ni vosotros: es de dirección, y con consentimiento por escrito. El sistema os da
el componente; a qué caras se aplica, no.

Mientras eso no esté resuelto, las iniciales funcionan solas y no bloquean nada.

---

## 4 · Conmutador de densidad — partido

Decís que «es del sistema y debería ser el mismo en todas partes». **De acuerdo
en la mitad.**

### Del sistema

- El aspecto del control, sus dos opciones y sus etiquetas.
- Que la elección **se recuerde**, en vez de volver al valor por omisión.
- Y una decisión que no preguntabais y necesitáis: **la densidad es global, no
  por tabla.** Un control por tabla permite dos tablas con distinta altura de
  fila en la misma pantalla, y eso no se lee como una preferencia: se lee como un
  fallo. **Un control por aplicación.**

### De vuestro proyecto

- **Si lo ofrecéis o no.** Podéis fijar la densidad cómoda y no dar la opción.
- **Dónde vive** en vuestra interfaz. Recomendación: en el menú de usuario, junto
  al tema. Es una preferencia de la persona, no una acción de la pantalla.
- **Dónde se guarda**, y aquí una recomendación en contra de lo fácil: guardadla
  en **el perfil del usuario**, no en el navegador. Si va en `localStorage`, la
  preferencia se queda en ese equipo: la persona entra desde el móvil y su
  elección no le sigue. El catálogo usa `localStorage` porque no tiene sesión;
  vosotros sí la tenéis. Lo mismo vale para el tema y para el formato horario.

---

## Orden en que lo vais a recibir

No es el vuestro. Va razonado:

| | Qué | Por qué en ese lugar |
|---|---|---|
| 1.º | **Iconografía** | Es lo que os frena hoy y es deuda nuestra. Además arrastra la limpieza de los seis tamaños sin regla |
| 2.º | **Avatar** | Es el de plazo más largo —tokens nuevos, verificación de contraste y versión nueva—, así que arranca en paralelo con el primero |
| 3.º | **Fallo de dibujado** | Acotado y sin dependencias |
| 4.º | **Conmutador de densidad** | El último **porque no os bloquea**: los tokens ya los tenéis |

---

## Tres cosas que no pedisteis y os afectan

1. **El sistema se entrega en ZIP**, desde el catálogo → menú de usuario →
   «Descargar el sistema». Trae el motor de tokens, los dos candados, el manual y
   el catálogo navegable, con un LEEME de implementación.
2. **El LEEME enumera todo lo que el sistema cubre**, generado desde el índice
   del catálogo, así que no puede quedarse viejo. Si algo os pareció que faltaba,
   miradlo ahí antes de darlo por inexistente.
3. **Hay un elemento nuevo desde esta semana: Horario** —rejilla de día por hora,
   rota los ejes y admite 12 o 24 horas—. Si en Control de Asistencia hay
   horarios de turno, ya está resuelto.

---

## Cómo os llegarán estas mejoras

Reemplazando la carpeta, nunca resolviendo conflictos: **nada dentro de
`sistema/` se edita en vuestro proyecto.**

- **Hoy:** descargáis el ZIP nuevo y reemplazáis `sistema/tokens/` y
  `sistema/candado/` enteras.
- **Mejor, en cuanto esté:** dependencia de git anclada a una etiqueta, para que
  la versión quede registrada en vuestro control de versiones. Falta publicar la
  etiqueta y daros lectura al repositorio.

**Después de cada actualización, siempre:**

```bash
node sistema/candado/verificar-contraste.mjs   # tiene que dar 0 fallos
npm run lint
npm run build
```

Si un token desapareció o cambió de nombre, el build falla **en compilación, no
en producción**. Eso es intencionado.
