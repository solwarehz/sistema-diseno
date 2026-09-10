# Requerimientos al equipo de diseño · activos de identidad

**De:** el área de sistema de diseño (MMI-DS)
**Para:** el equipo de diseño gráfico / identidad
**Sobre:** cinco entregables. Dos bloquean, uno es un problema de legibilidad
recién medido, uno es una corrección y uno es material pendiente de recibir
**Fecha:** 10 de septiembre de 2026 · sistema en v1.98.0
**Revisión 2** — corregidos dos errores de la primera versión, marcados abajo

---

## Cómo leer esto

Todo lo que sigue está **medido**, no estimado. Los porcentajes de color salen
de decodificar los PNG y contar píxeles opacos; los contrastes, de aplicar la
fórmula de WCAG 2.1 sobre esos valores contra los tokens reales del sistema.
Cada cifra dice de dónde sale.

**Nada de esto se resuelve con código.** El sistema ya tiene el sitio donde
ponerlo; lo que falta es el activo.

### Qué cambió en la revisión 2

Al abrir los PNG para medirlos aparecieron **dos errores nuestros** en la
primera versión de este documento. Se corrigen aquí en vez de reescribirse en
silencio:

| Decíamos | Es |
|---|---|
| «El escudo suelto **no existe**» | **Sí existe** — `AE.png`, 1063 × 1291, fondo transparente. Lo que falta es el juego de tamaños |
| «`#1D1D1B` es el texto «ALBERT EINSTEIN»» | **No.** El wordmark es **rojo**. El casi-negro es «COLEGIO» y el lema |
| «Es un incumplimiento de SC 1.4.3» | **No lo es.** WCAG 2.1 **exime a los logotipos** del mínimo de contraste. Sigue siendo un problema de legibilidad real, pero no normativo |

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

## R-D2 · El juego de tamaños del escudo — **bloquea el catálogo**

**Corregido en la revisión 2.** No es que el escudo suelto no exista: existe.
`imagenes/AE.png`, **1063 × 1291**, fondo transparente, escudo completo. Es el
que consumen de verdad la lateral y la barra móvil.

**Lo que falta** es el juego de tamaños que pide MMI-DS §10, de 32 a 1024 px.

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

## R-D3 · «COLEGIO» y el lema no se leen sobre el marco — **hallazgo nuevo**

Esto no estaba en ninguna lista. Salió al decodificar el PNG del lockup y contar
sus píxeles.

`AE-nombre-horizontal.png` (350 × 94, 8 037 píxeles opacos) tiene el **8,41 % de
su tinta en `#1D1D1B`**, casi negro.

**No es el wordmark** — «ALBERT EINSTEIN» es rojo. Localizando el color por
filas, el casi-negro son **dos bandas de 7 px de alto**:

| Banda | Qué es | Tinta |
|---|---|---|
| y 20-26 | **COLEGIO** | 154 px |
| y 73-79 | **UN EINSTINO: UN TRIUNFADOR** | 522 px |

Son las dos líneas pequeñas, arriba y abajo del nombre. Y son justo las que
desaparecen:

| Color | % de píxeles | Contra `#2C3D71` | Contra `#363532` |
|---|---|---|---|
| `#1D1D1B` — lo de hoy | 8,41 % | **1,62 : 1** | **1,38 : 1** |
| `#FFFFFF` — lo que haría falta | 19,91 % | 10,43 : 1 | 12,27 : 1 |

Como referencia: texto normal necesitaría 4,5 : 1 y texto grande 3 : 1. Un
logotipo **no está obligado a ninguno de los dos** (ver el matiz abajo).

**No llega ni a 3 : 1.** «COLEGIO» y el lema son prácticamente invisibles sobre
la lateral, y lo son **en los dos temas**, porque la lateral es oscura siempre.

**Un matiz que hay que decir, porque en la revisión 1 lo dijimos mal.** WCAG 2.1
**exime expresamente a los logotipos** del mínimo de contraste: *«el texto que
forma parte de un logotipo o nombre de marca no tiene requisito mínimo»*. Así
que esto **no es un incumplimiento normativo**. Es un problema de legibilidad:
dos líneas de texto que no se leen. Se pide arreglarlo porque no se leen, no
porque una norma obligue.

Dónde se ve: `.lat-lockup`, la lateral **desplegada**, a 44 px de alto. Es la
lateral por omisión — no un estado raro.

El sistema ya sabía la mitad de esto: la barra móvil usa el escudo y no el
lockup, y su comentario lo dice con la medición al lado. Lo que nadie miró es
que **la lateral desplegada sigue poniendo el lockup ahí**.

**Entregable**

- Una **versión del lockup para fondo oscuro**, con «COLEGIO» y el lema en
  `#FFFFFF` —que da 10,43 : 1 y 12,27 : 1, holgado— y el escudo y el wordmark
  intactos.
- Horizontal y vertical.
- Nombre sugerido: `AE-nombre-horizontal-oscuro.png` y su par vertical, para que
  convivan con los actuales sin sustituirlos.

> **Mientras tanto el sistema no se queda roto.** Hay un camino de reserva ya
> escrito que pone «COLEGIO» y «ALBERT EINSTEIN» como texto en `--marco-acento`
> (`#DFCA9C`) y blanco, los dos legibles sobre los dos fondos. Cambiar a él es
> una decisión de identidad, y la toma el responsable — no nosotros.

---

## R-D4 · No son dos rojos. Son tres.

MMI-DS §8.5 declara dos rojos en la misma identidad. Contando píxeles y
localizando cada uno por su caja envolvente aparecen **tres**, y la cosa es más
concreta de lo que §8.5 describe:

| Color | Dónde está, exactamente | % de tinta |
|---|---|---|
| **`#E30613`** | El escudo **suelto** (`AE.png`) | 13,29 % |
| `#EC2027` | El wordmark «ALBERT EINSTEIN» | 9,18 % |
| `#EC1C24` | **Dentro del escudo incrustado en el lockup** · x 23-53, y 32-71 | 3,26 % |

El tercero cae dentro de la zona del escudo (x 0-66), no en ningún texto. Y eso
cambia lo que significa el defecto:

> No es «el escudo usa un rojo y el lockup usa otro». Es que **el mismo escudo
> sale de dos rojos distintos según de qué archivo se saque.**

Cuatro unidades de verde y tres de azul de diferencia son la huella de un
recoloreado o de un perfil de color distinto, no un criterio.

**El sistema adopta `#E30613`** porque es el del escudo suelto, que es el
elemento primario. Está autorizado como `marca_rojo`.

**Entregable.** Los lockups rehechos con **un solo rojo, `#E30613`**, en todas
sus piezas — empezando por el escudo que llevan dentro, que debería ser
idéntico al suelto y no lo es. Y confirmar cuál es el rojo correcto de la
identidad: si es `#EC2027` y no `#E30613`, díganlo — se cambia el token, pero se
cambia una vez y para todo.

Desde la **v1.98.0** los tres están **nombrados** en el sistema
(`marca_rojo`, `marca_rojo_lockup`, `marca_rojo_escudo_lockup`). Nombrarlos no
los autoriza: los mete bajo el candado de color, que es lo que impide que
alguien los saque del PNG y los escriba a mano en un producto.

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
| 1 | **R-D1** · isotipo simplificado | El favicon, la lateral plegada y la barra móvil. Sin esto no hay activo válido bajo 56 px. **Es el único que no puede sustituirse por nada** |
| 2 | **R-D3** · lockup para fondo oscuro | «COLEGIO» y el lema no se leen en la lateral, en los dos temas. No es incumplimiento normativo —WCAG exime logotipos— pero es texto invisible |
| 3 | **R-D2** · juego de tamaños del escudo | El catálogo enseña un marcador de posición en cuatro sitios |
| 4 | **R-D4** · un solo rojo | Coherencia de identidad. No rompe nada hoy |
| 5 | **R-D5** · vertical y espécimen | Nada. Completa el inventario |
