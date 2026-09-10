# Requerimientos al equipo de diseño · activos de identidad

**De:** el área de sistema de diseño (MMI-DS)
**Para:** el equipo de diseño gráfico / identidad
**Sobre:** cinco entregables. Dos bloquean, uno es un defecto de accesibilidad
recién medido, uno es una corrección y uno es material pendiente de recibir
**Fecha:** 10 de septiembre de 2026 · sistema en v1.97.0

---

## Cómo leer esto

Todo lo que sigue está **medido**, no estimado. Los porcentajes de color salen
de decodificar los PNG y contar píxeles opacos; los contrastes, de aplicar la
fórmula de WCAG 2.1 sobre esos valores contra los tokens reales del sistema.
Cada cifra dice de dónde sale.

**Nada de esto se resuelve con código.** El sistema ya tiene el sitio donde
ponerlo; lo que falta es el activo.

---

## Los dos fondos contra los que hay que trabajar

La barra lateral de la aplicación es **oscura en los dos temas**. No hay ninguna
superficie clara donde viva la marca dentro del marco:

| Token | Tema claro | Tema oscuro |
|---|---|---|
| `--marco-fondo` | **`#2C3D71`** azul | **`#363532`** gris |

Cualquier activo que se entregue tiene que leerse sobre esos dos.

---

## R-D1 · Isotipo simplificado — **bloqueante**

**El problema.** Por debajo de 56 px, «COLEGIO» y «HUARAZ» dentro del escudo son
ilegibles (MMI-DS §8.6). El sistema lo dibuja hoy por debajo de ese umbral en
dos sitios reales, no hipotéticos:

| Dónde | Alto | Verificado en |
|---|---|---|
| Lateral plegada | **40 px** | `componentes.css` línea 1265, `.lat-escudo` |
| Barra superior en móvil | **44 px** | generador del cascarón, `[data-vista='movil'] .top-marca img` |
| Favicon | 16 px | no existe |
| `apple-touch-icon` | 180 px | no existe |

**Lo que hace falta.** El escudo con **solo el AE dentro**, sin las palabras.
Dibujado, no escalado: reducir el escudo completo no arregla la ilegibilidad,
solo la hace más pequeña.

**Entregable**

- Fuente vectorial **SVG**, un solo trazo limpio, sin texto convertido a curvas
  que luego no se pueda reeditar.
- **PNG con fondo transparente** a 16, 32, 40, 44, 64, 128, 180 y 512 px.
- Rojo **`#E30613`** (ver R-D4).
- **Verificado por ustedes a 16 px y a 40 px sobre `#2C3D71` y sobre `#363532`**
  antes de entregar. Si a 16 px no se distingue de una mancha, no está.

---

## R-D2 · Escudo suelto — **bloqueante para el catálogo**

**El problema.** MMI-DS §10 lista `AE-escudo-*.png` de 32 a 1024 px. **No
existen.** Lo único que hay es `AE.png`, una sola pieza de **1063 × 1291**.

Consecuencia visible hoy: las maquetas del catálogo —el marco de aplicación, el
panel de marca y la barra móvil— dibujan un **marcador de posición a trazos** a
22, 30, 34 y 80 px. Quien abra el catálogo ve un contorno discontinuo con las
letras AE donde debería ir el escudo.

**Entregable**

- **SVG** vectorial.
- **PNG con fondo transparente** a 32, 48, 64, 96, 128, 256, 512 y 1024 px.
- **No se recorta del lockup.** Recortar un logo produce bordes sucios y
  proporciones que no son las del original.

---

## R-D3 · El wordmark no se lee sobre el marco — **hallazgo nuevo, sin declarar**

Esto no estaba en ninguna lista. Salió al decodificar el PNG del lockup y contar
sus píxeles.

`AE-nombre-horizontal.png` (350 × 94, 8 037 píxeles opacos) tiene el **8,41 % de
su tinta en `#1D1D1B`**, casi negro. Es el texto «ALBERT EINSTEIN».

| Color | % de píxeles | Contra `#2C3D71` | Contra `#363532` | Norma |
|---|---|---|---|---|
| `#1D1D1B` | 8,41 % | **1,62 : 1** | **1,38 : 1** | 4,5 : 1 (SC 1.4.3) |
| `#FFFFFF` | 19,91 % | 10,43 : 1 | 12,27 : 1 | — |

**No llega ni a 3 : 1.** El wordmark es prácticamente invisible sobre la lateral,
y lo es **en los dos temas**, porque la lateral es oscura siempre.

Dónde se ve: `.lat-lockup`, la lateral **desplegada**, a 44 px de alto. Es la
lateral por omisión — no un estado raro.

El sistema ya sabía la mitad de esto: la barra móvil usa el escudo y no el
lockup, y su comentario lo dice con la medición al lado. Lo que nadie miró es
que **la lateral desplegada sigue poniendo el lockup ahí**.

**Entregable**

- Una **versión del lockup para fondo oscuro**, con el wordmark en `#FFFFFF`
  —que da 10,43 : 1 y 12,27 : 1, holgado— y el escudo intacto.
- Horizontal y vertical.
- Nombre sugerido: `AE-nombre-horizontal-oscuro.png` y su par vertical, para que
  convivan con los actuales sin sustituirlos.

> **Mientras tanto el sistema no se queda roto.** Hay un camino de reserva ya
> escrito que pone «COLEGIO» y «ALBERT EINSTEIN» como texto en `--marco-acento`
> (`#DFCA9C`) y blanco, los dos legibles sobre los dos fondos. Cambiar a él es
> una decisión de identidad, y la toma el responsable — no nosotros.

---

## R-D4 · No son dos rojos. Son tres.

MMI-DS §8.5 declara dos rojos en la misma identidad. Contando píxeles aparecen
**tres**:

| Color | Dónde | % de píxeles opacos de su archivo |
|---|---|---|
| **`#E30613`** | escudo (`AE.png`) | 13,29 % |
| `#EC2027` | lockup | 9,18 % |
| `#EC1C24` | lockup | 3,26 % |

Los dos del lockup se diferencian en 11 unidades de verde y 3 de azul: es la
huella de un archivo que se ha reexportado o recoloreado más de una vez, no una
elección.

**El sistema adopta `#E30613`** porque es el del escudo, que es el elemento
primario. Está autorizado como `marca-rojo`.

**Entregable.** Los lockups rehechos con **un solo rojo, `#E30613`**, en todas
sus piezas. Y confirmar cuál es el rojo correcto de la identidad: si es
`#EC2027` y no `#E30613`, díganlo — se cambia el token, pero se cambia una vez y
para todo.

---

## R-D5 · Material pendiente de recibir — no bloquea

| Archivo | Estado |
|---|---|
| `AE-nombre-horizontal.png` | **Recibido** · 350 × 94 |
| `AE-nombre-vertical.png` | Pendiente |
| `TIPOGRAFIA-web-y-sistema.png` | Pendiente · espécimen de las dos escalas |

---

## Cómo se entregan

**Por el chat, no al repositorio.** `.gitignore` excluye `*.png`, `*.jpg`,
`*.pdf`, `*.ai` y `*.psd` a propósito: los binarios de identidad son **propiedad
del cliente** y el repositorio versiona el sistema, no la marca. Quien clone verá
`marca/02_identidad/` con solo un `LEEME.md`, y eso es lo correcto.

Se mandan por el canal habitual y se guardan en la máquina de trabajo.

---

## Resumen de prioridad

| | Entregable | Bloquea |
|---|---|---|
| 1 | **R-D1** · isotipo simplificado | El favicon, la lateral plegada y la barra móvil. Sin esto no hay activo válido bajo 56 px |
| 2 | **R-D3** · lockup para fondo oscuro | Accesibilidad de la marca en la lateral, en los dos temas. Es un incumplimiento de SC 1.4.3 medido |
| 3 | **R-D2** · escudo suelto | El catálogo enseña un marcador de posición en cuatro sitios |
| 4 | **R-D4** · un solo rojo | Coherencia de identidad. No rompe nada hoy |
| 5 | **R-D5** · vertical y espécimen | Nada. Completa el inventario |
